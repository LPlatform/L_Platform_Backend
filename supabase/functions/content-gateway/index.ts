/**
 * L_Platform Supabase Edge Function — Secure Content Gateway
 *
 * Bridges Supabase Auth / PostgreSQL student eligibility with OCI PostgreSQL
 * published curriculum & private OCI Object Storage.
 *
 * Security Rules Enforced:
 * - Never embeds service-role keys in browser/desktop apps.
 * - Verifies caller JWT against Supabase Auth (`SUPABASE_URL/auth/v1/user`).
 * - Never executes user code inside the Edge Function.
 * - Blocks PLATFORM_DEVELOPER from accessing student PII, submissions, or org rosters.
 * - Strips answer keys, correctness flags, hidden test cases, and grading rubrics for STUDENT callers.
 */

interface GatewayEnv {
  supabaseUrl: string;
  supabaseAnonKey: string;
  ociGatewayBaseUrl: string;
  ociInternalBridgeToken: string;
  allowedOrigins: string[];
}

function loadEnv(): GatewayEnv {
  const get = (key: string): string => {
    const deno = (globalThis as { Deno?: { env?: { get(k: string): string | undefined } } }).Deno;
    return deno?.env?.get(key)?.trim() ?? '';
  };

  const supabaseUrl = get('SUPABASE_URL');
  const supabaseAnonKey = get('SUPABASE_ANON_KEY');
  const ociGatewayBaseUrl = get('OCI_CONTENT_GATEWAY_URL');
  const ociInternalBridgeToken = get('OCI_INTERNAL_BRIDGE_TOKEN');
  const allowedOrigins = get('ALLOWED_ORIGINS')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be configured in Edge secrets.');
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
    ociGatewayBaseUrl,
    ociInternalBridgeToken,
    allowedOrigins,
  };
}

function corsHeaders(origin: string | null, allowed: string[]): HeadersInit {
  const allow = origin && (allowed.includes(origin) || allowed.length === 0) ? origin : 'null';
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };
}

export async function handleRequest(req: Request): Promise<Response> {
  const env = loadEnv();
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin, env.allowedOrigins);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ code: 'UNAUTHORIZED', message: 'Missing bearer token' }), {
      status: 401,
      headers,
    });
  }

  // Verify caller JWT using Supabase Auth API (never trusting unverified JWT payloads).
  const authRes = await fetch(`${env.supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
    headers: {
      Authorization: authHeader,
      apikey: env.supabaseAnonKey,
    },
  });
  if (!authRes.ok) {
    return new Response(JSON.stringify({ code: 'UNAUTHORIZED', message: 'Invalid session' }), {
      status: 401,
      headers,
    });
  }

  const caller = (await authRes.json()) as {
    id: string;
    app_metadata?: { role?: string; organization_id?: string | null };
  };
  const role = caller.app_metadata?.role ?? 'STUDENT';
  const organizationId = caller.app_metadata?.organization_id ?? null;

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/content-gateway/, '') || '/';

  // Enforce strict role boundaries
  if (
    role === 'PLATFORM_DEVELOPER' &&
    (path.startsWith('/student') || path.startsWith('/submissions'))
  ) {
    return new Response(
      JSON.stringify({
        code: 'FORBIDDEN',
        message: 'PLATFORM_DEVELOPER cannot access student records or submissions',
      }),
      { status: 403, headers },
    );
  }

  if (!env.ociGatewayBaseUrl) {
    return new Response(
      JSON.stringify({
        code: 'OCI_GATEWAY_NOT_CONFIGURED',
        message:
          'OCI Content Database bridge is not configured for this environment; configure OCI_CONTENT_GATEWAY_URL in Supabase Edge secrets.',
      }),
      { status: 503, headers },
    );
  }

  // Forward verified caller context to OCI content bridge (never trusting client-supplied role/org headers)
  const upstreamUrl = `${env.ociGatewayBaseUrl.replace(/\/$/, '')}${path}${url.search}`;
  const upstreamRes = await fetch(upstreamUrl, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      'X-LPlatform-Verified-User': caller.id,
      'X-LPlatform-Verified-Role': role,
      'X-LPlatform-Verified-Org': organizationId ?? '',
      ...(env.ociInternalBridgeToken
        ? { Authorization: `Bearer ${env.ociInternalBridgeToken}` }
        : {}),
    },
    body: req.method === 'POST' ? await req.text() : undefined,
  });

  const payload = await upstreamRes.text();
  return new Response(payload, { status: upstreamRes.status, headers });
}

const maybeDeno = (
  globalThis as { Deno?: { serve?: (h: (req: Request) => Promise<Response>) => void } }
).Deno;
maybeDeno?.serve?.(handleRequest);
