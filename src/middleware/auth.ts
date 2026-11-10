import { FastifyRequest, FastifyReply } from 'fastify';
import { TokenPayload, verifyAccessToken } from '../lib/auth.js';
import { Errors } from '../lib/errors.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
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

  const payload = await verifyAccessToken(token);
  if (!payload) {
    throw Errors.unauthorized('Invalid or expired access token');
  }

  request.user = payload;
}

export function requireRole(...allowedRoles: Array<TokenPayload['role']>) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user) {
      await authenticate(request, reply);
    }

    if (!request.user || !allowedRoles.includes(request.user.role)) {
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
  if (user.role === 'PLATFORM_ADMIN') return true;
  if (!targetOrgId || !user.organizationId) return false;
  return user.organizationId === targetOrgId;
}
