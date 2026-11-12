import { AsyncLocalStorage } from 'node:async_hooks';
import type pg from 'pg';

export interface RlsContext {
  userId?: string | null;
  role?: string | null;
  organizationId?: string | null;
  systemContext?: 'AUTH' | 'PUBLIC_CATALOG' | 'JOIN_LOOKUP' | 'SUPERUSER' | null;
  txClient?: pg.PoolClient;
}

export const rlsStorage = new AsyncLocalStorage<RlsContext>();

export function runWithRlsContext<T>(ctx: RlsContext, fn: () => T): T {
  const existing = rlsStorage.getStore();
  return rlsStorage.run({ ...existing, ...ctx }, fn);
}

export function getCurrentRlsContext(): RlsContext | undefined {
  return rlsStorage.getStore();
}

export async function applySessionRlsVars(
  client: pg.PoolClient,
  ctx: RlsContext,
  useRestrictedRole = true,
): Promise<void> {
  if (useRestrictedRole && ctx.systemContext !== 'SUPERUSER') {
    await client.query('SET LOCAL ROLE lplatform_app');
  }
  await client.query(
    `SELECT
       set_config('app.user_id', $1, true),
       set_config('app.user_role', $2, true),
       set_config('app.organization_id', $3, true),
       set_config('app.system_context', $4, true)`,
    [ctx.userId ?? '', ctx.role ?? '', ctx.organizationId ?? '', ctx.systemContext ?? ''],
  );
}
