import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, isNull } from 'drizzle-orm';
import { db } from '../db/connection.js';
import { users, credentials, refreshSessions } from '../db/schema/index.js';
import {
  hashPassword,
  verifyPassword,
  createAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  type UserRole,
} from '../lib/auth.js';
import { Errors } from '../lib/errors.js';
import { authenticate } from '../middleware/auth.js';
import { runWithRlsContext } from '../db/rls-context.js';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {
  // POST /api/auth/login
  app.post('/api/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      throw Errors.badRequest('Invalid login payload', parsed.error.issues);
    }

    const { email, password } = parsed.data;

    // Find user and issue refresh session under AUTH system RLS context
    const authResult = await runWithRlsContext({ systemContext: 'AUTH' }, async () => {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
        with: { credentials: true, organization: true },
      });

      if (!user || !user.credentials) {
        throw Errors.unauthorized('Invalid email address or password');
      }

      if (user.status !== 'ACTIVE') {
        throw Errors.unauthorized('Your account is currently inactive or suspended');
      }

      if (user.organization && user.organization.status !== 'ACTIVE') {
        throw Errors.unauthorized('Your organization is currently suspended or inactive');
      }

      const passwordValid = await verifyPassword(user.credentials.passwordHash, password);
      if (!passwordValid) {
        throw Errors.unauthorized('Invalid email address or password');
      }

      const tokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role as UserRole,
        organizationId: user.organizationId,
        name: `${user.firstName} ${user.lastName}`,
      };

      const accessToken = await createAccessToken(tokenPayload);
      const rawRefreshToken = generateRefreshToken();
      const tokenHash = hashRefreshToken(rawRefreshToken);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await db.insert(refreshSessions).values({
        id: uuidv4(),
        userId: user.id,
        tokenHash,
        userAgent: request.headers['user-agent'] || null,
        ipAddress: request.ip || null,
        expiresAt,
      });

      return { user, accessToken, rawRefreshToken };
    });

    const { user, accessToken, rawRefreshToken } = authResult;

    // Set cookie
    reply.setCookie('access_token', accessToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
    });

    reply.setCookie('refresh_token', rawRefreshToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return reply.send({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        role: user.role,
        organizationId: user.organizationId,
        avatarUrl: user.avatarUrl,
      },
      accessToken,
      refreshToken: rawRefreshToken,
    });
  });

  // POST /api/auth/refresh
  app.post('/api/auth/refresh', async (request, reply) => {
    const rawToken = (request.body as any)?.refreshToken || request.cookies?.refresh_token;

    if (!rawToken) {
      throw Errors.unauthorized('No refresh token provided');
    }

    const tokenHash = hashRefreshToken(rawToken);

    const { newAccessToken, newRawRefreshToken } = await runWithRlsContext(
      { systemContext: 'AUTH' },
      async () => {
        const session = await db.query.refreshSessions.findFirst({
          where: eq(refreshSessions.tokenHash, tokenHash),
        });

        if (!session || session.revokedAt || session.expiresAt < new Date()) {
          // Replay or invalid: revoke all sessions if replay detected
          if (session?.revokedAt) {
            await db
              .update(refreshSessions)
              .set({ revokedAt: new Date() })
              .where(eq(refreshSessions.userId, session.userId));
          }
          throw Errors.unauthorized('Refresh token is invalid or expired');
        }

        // Revoke old session
        await db
          .update(refreshSessions)
          .set({ revokedAt: new Date() })
          .where(eq(refreshSessions.id, session.id));

        const user = await db.query.users.findFirst({
          where: eq(users.id, session.userId),
          with: { organization: true },
        });

        if (!user || user.status !== 'ACTIVE') {
          throw Errors.unauthorized('User not found or inactive');
        }

        if (user.organization && user.organization.status !== 'ACTIVE') {
          throw Errors.unauthorized('Organization is suspended or inactive');
        }

        const tokenPayload = {
          userId: user.id,
          email: user.email,
          role: user.role as UserRole,
          organizationId: user.organizationId,
          name: `${user.firstName} ${user.lastName}`,
        };

        const newAccessToken = await createAccessToken(tokenPayload);
        const newRawRefreshToken = generateRefreshToken();
        const newTokenHash = hashRefreshToken(newRawRefreshToken);

        const newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + 7);

        await db.insert(refreshSessions).values({
          id: uuidv4(),
          userId: user.id,
          tokenHash: newTokenHash,
          userAgent: request.headers['user-agent'] || null,
          ipAddress: request.ip || null,
          expiresAt: newExpiresAt,
        });

        return { newAccessToken, newRawRefreshToken };
      },
    );

    reply.setCookie('access_token', newAccessToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
    });

    reply.setCookie('refresh_token', newRawRefreshToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return reply.send({
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken,
    });
  });

  // POST /api/auth/logout
  app.post('/api/auth/logout', async (request, reply) => {
    const rawToken = (request.body as any)?.refreshToken || request.cookies?.refresh_token;

    if (rawToken) {
      const tokenHash = hashRefreshToken(rawToken);
      await runWithRlsContext({ systemContext: 'AUTH' }, async () => {
        await db
          .update(refreshSessions)
          .set({ revokedAt: new Date() })
          .where(eq(refreshSessions.tokenHash, tokenHash));
      });
    }

    reply.clearCookie('access_token', { path: '/' });
    reply.clearCookie('refresh_token', { path: '/' });

    return reply.send({ success: true, message: 'Logged out successfully' });
  });

  // GET /api/auth/me
  app.get('/api/auth/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, request.user!.userId),
      with: { organization: true },
    });

    if (!user) {
      throw Errors.notFound('User not found');
    }

    return reply.send({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role,
      status: user.status,
      organizationId: user.organizationId,
      organization: user.organization,
      avatarUrl: user.avatarUrl,
    });
  });

  // POST /api/auth/change-password
  app.post('/api/auth/change-password', { preHandler: [authenticate] }, async (request, reply) => {
    const body = request.body as any;
    if (!body?.oldPassword || !body?.newPassword) {
      throw Errors.badRequest('Both old and new passwords are required');
    }
    if (typeof body.newPassword !== 'string' || body.newPassword.length < 6) {
      throw Errors.badRequest('New password must be at least 6 characters');
    }

    const cred = await db.query.credentials.findFirst({
      where: eq(credentials.userId, request.user!.userId),
    });

    if (!cred) {
      throw Errors.notFound('Credentials not found');
    }

    const valid = await verifyPassword(cred.passwordHash, body.oldPassword);
    if (!valid) {
      throw Errors.badRequest('Incorrect current password');
    }

    const newHash = await hashPassword(body.newPassword);
    await db
      .update(credentials)
      .set({ passwordHash: newHash, updatedAt: new Date() })
      .where(eq(credentials.userId, request.user!.userId));

    return reply.send({ success: true, message: 'Password updated successfully' });
  });
}
