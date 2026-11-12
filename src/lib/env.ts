const MIN_SECRET_LENGTH = 32;

function requireMinLengthSecret(name: string, value: string | undefined): string {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `${name} must be configured with at least ${MIN_SECRET_LENGTH} characters (refusing insecure fallback secret).`,
    );
  }
  const lowered = trimmed.toLowerCase();
  if (
    lowered.includes('change-in-production') ||
    lowered === 'dev-super-secure-jwt-secret-key-at-least-32-chars-long!'
  ) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`${name} cannot use a default placeholder value in production.`);
    }
  }
  return trimmed;
}

export function getJwtSecret(): Uint8Array {
  return new TextEncoder().encode(requireMinLengthSecret('JWT_SECRET', process.env.JWT_SECRET));
}

export function getCookieSecret(): string {
  return requireMinLengthSecret('COOKIE_SECRET', process.env.COOKIE_SECRET);
}

export function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error('DATABASE_URL must be configured (refusing hardcoded database credentials).');
  }
  return url;
}

const DEFAULT_DEV_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:1420',
  'http://127.0.0.1:1420',
  'tauri://localhost',
  'http://tauri.localhost',
  'https://tauri.localhost',
];

export function getAllowedCorsOrigins(): string[] {
  const configured = (process.env.CORS_ORIGIN || process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (configured.length > 0) {
    return configured;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('CORS_ORIGIN or ALLOWED_ORIGINS must be explicitly configured in production.');
  }

  return DEFAULT_DEV_ORIGINS;
}

export function isDemoResetAllowed(): boolean {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  if (process.env.ENABLE_DEMO_RESET === 'false') {
    return false;
  }
  return (
    process.env.ENABLE_DEMO_RESET === 'true' ||
    process.env.NODE_ENV === 'test' ||
    process.env.NODE_ENV === 'development'
  );
}

export interface SupabaseIntegrationConfig {
  configured: boolean;
  url: string | null;
  anonKeyConfigured: boolean;
  serviceRoleConfigured: boolean;
  jwksUrl: string | null;
}

export function getSupabaseConfig(): SupabaseIntegrationConfig {
  const url = process.env.SUPABASE_URL?.trim() || null;
  const anonKeyConfigured = Boolean(process.env.SUPABASE_ANON_KEY?.trim());
  const serviceRoleConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  return {
    configured: Boolean(url && anonKeyConfigured),
    url,
    anonKeyConfigured,
    serviceRoleConfigured,
    jwksUrl: url ? `${url.replace(/\/$/, '')}/auth/v1/.well-known/jwks.json` : null,
  };
}

export interface OciIntegrationConfig {
  configured: boolean;
  region: string | null;
  tenancyOcidConfigured: boolean;
  userOcidConfigured: boolean;
  fingerprintConfigured: boolean;
  privateKeyConfigured: boolean;
  objectStorageNamespace: string | null;
  objectStorageBucket: string | null;
  contentDatabaseConfigured: boolean;
}

export function getOciConfig(): OciIntegrationConfig {
  const region = process.env.OCI_REGION?.trim() || null;
  const objectStorageNamespace = process.env.OCI_OBJECT_STORAGE_NAMESPACE?.trim() || null;
  const objectStorageBucket = process.env.OCI_OBJECT_STORAGE_BUCKET?.trim() || null;
  const tenancyOcidConfigured = Boolean(process.env.OCI_TENANCY_OCID?.trim());
  const userOcidConfigured = Boolean(process.env.OCI_USER_OCID?.trim());
  const fingerprintConfigured = Boolean(process.env.OCI_FINGERPRINT?.trim());
  const privateKeyConfigured = Boolean(
    process.env.OCI_PRIVATE_KEY_PATH?.trim() || process.env.OCI_PRIVATE_KEY?.trim(),
  );
  const contentDatabaseConfigured = Boolean(process.env.OCI_CONTENT_DATABASE_URL?.trim());
  return {
    configured: Boolean(
      region &&
      tenancyOcidConfigured &&
      userOcidConfigured &&
      fingerprintConfigured &&
      privateKeyConfigured &&
      objectStorageNamespace &&
      objectStorageBucket,
    ),
    region,
    tenancyOcidConfigured,
    userOcidConfigured,
    fingerprintConfigured,
    privateKeyConfigured,
    objectStorageNamespace,
    objectStorageBucket,
    contentDatabaseConfigured,
  };
}
