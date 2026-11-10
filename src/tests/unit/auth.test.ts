import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashRefreshToken,
} from '../../lib/auth.js';
import { checkTenantAccess } from '../../middleware/auth.js';

describe('Auth Service & Tenant Isolation', () => {
  it('hashes and verifies passwords correctly with Argon2id', async () => {
    const raw = 'SuperSecureP@ssw0rd!';
    const hash = await hashPassword(raw);
    expect(hash).toMatch(/^\$argon2id\$/);

    const valid = await verifyPassword(hash, raw);
    expect(valid).toBe(true);

    const invalid = await verifyPassword(hash, 'WrongPassword123');
    expect(invalid).toBe(false);
  });

  it('generates and verifies valid JWT access tokens', async () => {
    const payload = {
      userId: 'usr-test-123',
      email: 'test@example.com',
      role: 'TEACHER' as const,
      organizationId: 'org-test-456',
      name: 'Test Teacher',
    };

    const token = await createAccessToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);

    const verified = await verifyAccessToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.role).toBe(payload.role);
    expect(verified?.organizationId).toBe(payload.organizationId);
  });

  it('generates and hashes refresh tokens consistently', () => {
    const token = generateRefreshToken();
    expect(token).toHaveLength(64);

    const hash1 = hashRefreshToken(token);
    const hash2 = hashRefreshToken(token);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });

  it('enforces multi-tenant organization access correctly', () => {
    const platformAdmin = {
      userId: 'admin-1',
      email: 'admin@lplatform.dev',
      role: 'PLATFORM_ADMIN' as const,
      organizationId: null,
      name: 'Admin',
    };

    const orgAdmin = {
      userId: 'orgadmin-1',
      email: 'org@schoolA.com',
      role: 'ORGANIZATION_ADMIN' as const,
      organizationId: 'org-school-A',
      name: 'School A Admin',
    };

    // Platform admin can access any organization
    expect(checkTenantAccess(platformAdmin, 'org-school-A')).toBe(true);
    expect(checkTenantAccess(platformAdmin, 'org-school-B')).toBe(true);
    expect(checkTenantAccess(platformAdmin, null)).toBe(true);

    // Organization admin can ONLY access their own organization
    expect(checkTenantAccess(orgAdmin, 'org-school-A')).toBe(true);
    expect(checkTenantAccess(orgAdmin, 'org-school-B')).toBe(false);
    expect(checkTenantAccess(orgAdmin, null)).toBe(false);
  });
});
