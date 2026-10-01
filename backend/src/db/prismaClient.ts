/**
 * Shared Prisma client singleton.
 * Import `prisma` from this file instead of instantiating PrismaClient directly.
 * Prevents connection pool exhaustion from multiple PrismaClient instances.
 *
 * The client is loaded **lazily**, on first property access, rather than at import
 * time. This matters because `platformVotesRouter` is part of the main router, so an
 * eager `new PrismaClient()` would run for every serverless cold start — and a
 * deployment without a reachable database (or without generated Prisma engines, e.g.
 * Vercel running the built-in `mock` provider) would then fail to boot the whole
 * Express app, taking down even `/api/trains-between`.
 *
 * Callers that need the database (see `platformVotesController`) already treat a
 * thrown client as "database unavailable" and degrade gracefully.
 */
import type { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaError?: Error;
};

function createClient(): PrismaClient | undefined {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  if (globalForPrisma.prismaError) return undefined;

  try {
    // Required lazily so a missing/failed Prisma install cannot break module load.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient: PrismaClientCtor } = require('@prisma/client');
    const client = new PrismaClientCtor({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
    globalForPrisma.prisma = client;
    return client;
  } catch (err) {
    globalForPrisma.prismaError = err instanceof Error ? err : new Error(String(err));
    console.error(
      '[Prisma] client unavailable; database-backed routes will report unavailable:',
      globalForPrisma.prismaError.message
    );
    return undefined;
  }
}

/**
 * Drop-in replacement for `new PrismaClient()` that constructs the real client on
 * first use. If the client cannot be created, the access throws with the original
 * error so the calling route can report `available: false` instead of crashing.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = createClient();
    if (!client) {
      throw (
        globalForPrisma.prismaError ??
        new Error('Database client is not available in this environment.')
      );
    }
    const value = Reflect.get(client as object, prop);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});
