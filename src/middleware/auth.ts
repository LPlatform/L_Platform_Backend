import { FastifyRequest, FastifyReply } from 'fastify';
import { TokenPayload, UserRole, verifyAccessToken } from '../lib/auth.js';
import { Errors } from '../lib/errors.js';
import { verifySupabaseJwt } from '../integrations/supabase.js';
import { db } from '../db/connection.js';
import { users } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { runWithRlsContext } from '../db/rls-context.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
  }
}

export function isPlatformOwnerRole(role: UserRole): boolean {
  return role === 'PLATFORM_OWNER' || role === 'PLATFORM_ADMIN';
}

export function isPlatformDeveloperRole(role: UserRole): boolean {
  return role === 'PLATFORM_DEVELOPER';
}

export async function resolveTokenUser(token: string): Promise<TokenPayload | null> {
  const localPayload = await verifyAccessToken(token);
  if (localPayload) {
    return localPayload;
  }

  const supabaseIdentity = await verifySupabaseJwt(token);
  if (!supabaseIdentity) {
    return null;
  }

  return runWithRlsContext({ systemContext: 'AUTH' }, async () => {
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, supabaseIdentity.email))
      .limit(1);
    if (!dbUser || dbUser.status !== 'ACTIVE') {
      return null;
    }
    return {
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role as UserRole,
      organizationId: dbUser.organizationId,
      name: `${dbUser.firstName} ${dbUser.lastName}`,
    };
  });
}

export async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
  if (request.user) {
    return;
  }

  let token: string | undefined;

  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (request.cookies?.access_token) {
    token = request.cookies.access_token;
  }

  if (!token) {
    throw Errors.unauthorized('No access token provided');
  }

  const payload = await resolveTokenUser(token);
  if (!payload) {
    throw Errors.unauthorized('Invalid or expired access token');
  }

  request.user = payload;
}

export function requireRole(...allowedRoles: Array<UserRole>) {
  const expanded = new Set<UserRole>(allowedRoles);
  if (expanded.has('PLATFORM_ADMIN') || expanded.has('PLATFORM_OWNER')) {
    expanded.add('PLATFORM_OWNER');
    expanded.add('PLATFORM_ADMIN');
  }

  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      await authenticate(request, reply);
    }

    if (!request.user || !expanded.has(request.user.role)) {
      throw Errors.forbidden(
        `Role '${request.user?.role}' is not authorized to access this resource`,
      );
    }
  };
}

export function checkTenantAccess(
  user: TokenPayload,
  targetOrgId: string | null | undefined,
): boolean {
  if (isPlatformOwnerRole(user.role)) return true;
  if (isPlatformDeveloperRole(user.role)) return false;
  if (!targetOrgId || !user.organizationId) return false;
  return user.organizationId === targetOrgId;
}
