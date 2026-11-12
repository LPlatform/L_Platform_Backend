import { createRemoteJWKSet, jwtVerify } from 'jose';
import { getSupabaseConfig } from '../lib/env.js';
import type { UserRole } from '../lib/auth.js';

export interface SupabaseVerifiedIdentity {
  sub: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
  provider: 'supabase';
}

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;
let cachedJwksUrl: string | null = null;

/**
 * Verifies an external Supabase Auth JWT using the project's JWKS endpoint when configured.
 * Fails closed when Supabase integration env vars are absent or verification fails.
 */
export async function verifySupabaseJwt(token: string): Promise<SupabaseVerifiedIdentity | null> {
  const cfg = getSupabaseConfig();
  if (!cfg.configured || !cfg.jwksUrl || !cfg.url) {
    return null;
  }

  if (!cachedJwks || cachedJwksUrl !== cfg.jwksUrl) {
    cachedJwks = createRemoteJWKSet(new URL(cfg.jwksUrl));
    cachedJwksUrl = cfg.jwksUrl;
  }

  try {
    const issuer = `${cfg.url.replace(/\/$/, '')}/auth/v1`;
    const { payload } = await jwtVerify(token, cachedJwks, {
      issuer,
      audience: 'authenticated',
    });

    const email = typeof payload.email === 'string' ? payload.email : null;
    const sub = typeof payload.sub === 'string' ? payload.sub : null;
    if (!sub || !email) {
      return null;
    }

    const appMeta =
      (typeof payload.app_metadata === 'object' && payload.app_metadata !== null
        ? (payload.app_metadata as Record<string, unknown>)
        : {}) ?? {};

    const rawRole = typeof appMeta.role === 'string' ? appMeta.role : 'STUDENT';
    const validRoles: UserRole[] = [
      'PLATFORM_OWNER',
      'PLATFORM_DEVELOPER',
      'PLATFORM_ADMIN',
      'ORGANIZATION_ADMIN',
      'TEACHER',
      'STUDENT',
    ];
    const role = validRoles.includes(rawRole as UserRole) ? (rawRole as UserRole) : 'STUDENT';
    const organizationId =
      typeof appMeta.organization_id === 'string' && appMeta.organization_id.trim()
        ? appMeta.organization_id.trim()
        : null;

    return {
      sub,
      email,
      role,
      organizationId,
      provider: 'supabase',
    };
  } catch {
    return null;
  }
}

export function getSupabaseStatus() {
  const cfg = getSupabaseConfig();
  return {
    mode: cfg.configured ? 'SUPABASE_JWKS_READY' : 'LOCAL_JWT_DEV_MODE',
    configured: cfg.configured,
    url: cfg.url,
    jwksConfigured: Boolean(cfg.jwksUrl),
    blocker: cfg.configured
      ? null
      : 'SUPABASE_URL and SUPABASE_ANON_KEY are not provisioned in the environment.',
  };
}
