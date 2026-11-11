import argon2 from 'argon2';
import crypto from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-super-secure-jwt-secret-key-at-least-32-chars-long!',
);

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'PLATFORM_ADMIN' | 'ORGANIZATION_ADMIN' | 'TEACHER' | 'STUDENT';
  organizationId: string | null;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456, // 19 MiB
    timeCost: 2,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}

export async function createAccessToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m')
    .sign(JWT_SECRET);
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
