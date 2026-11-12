import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema/index.js';
import { getDatabaseUrl } from '../lib/env.js';
import { applySessionRlsVars, rlsStorage, type RlsContext } from './rls-context.js';

const { Pool } = pg;

// Hosted Postgres (Supabase) needs TLS. Set DATABASE_SSL=true and use the pooler URL without ?sslmode.
const useSsl = process.env.DATABASE_SSL === 'true';

export const pool = new Pool({
  connectionString: getDatabaseUrl(),
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  // Serverless (Vercel) should keep this small, e.g. PG_POOL_MAX=3.
  max: Number(process.env.PG_POOL_MAX) || 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

let rlsRoleAvailableCache: boolean | null = null;

export async function isRestrictedRoleAvailable(): Promise<boolean> {
  if (rlsRoleAvailableCache !== null) return rlsRoleAvailableCache;
  try {
    const res = await pool.query(
      "SELECT 1 FROM pg_roles WHERE rolname = 'lplatform_app' AND rolbypassrls = false",
    );
    rlsRoleAvailableCache = (res.rowCount ?? 0) > 0;
  } catch {
    rlsRoleAvailableCache = false;
  }
  return rlsRoleAvailableCache;
}

export function resetRlsRoleCache(): void {
  rlsRoleAvailableCache = null;
}

const rlsAwarePool = {
  query: async (...args: any[]): Promise<any> => {
    const ctx = rlsStorage.getStore();
    if (!ctx) {
      return (pool as any).query(...args);
    }
    if (ctx.txClient) {
      return (ctx.txClient as any).query(...args);
    }

    const useRole = await isRestrictedRoleAvailable();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await applySessionRlsVars(client, ctx, useRole);
      const result = await (client as any).query(...args);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  },
  connect: () => pool.connect(),
  end: () => pool.end(),
  on: pool.on.bind(pool),
};

export const db = drizzle(rlsAwarePool as unknown as pg.Pool, { schema });

export async function withRlsTransaction<T>(ctx: RlsContext, fn: () => Promise<T>): Promise<T> {
  const existing = rlsStorage.getStore();
  if (existing?.txClient) {
    return fn();
  }
  const useRole = await isRestrictedRoleAvailable();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await applySessionRlsVars(client, { ...existing, ...ctx }, useRole);
    const result = await rlsStorage.run({ ...existing, ...ctx, txClient: client }, fn);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
