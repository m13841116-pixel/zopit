let prismaInstance: any = null;

// [UPDATE]: Version 1.0.1 - Added Vercel Serverless (pgbouncer) compatibility for Neon DB.
// Use globalThis to persist Prisma client in development or serverless environments
const globalForPrisma = globalThis as unknown as { prisma: any };

export function getPrisma(): any {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const isProduction =
    process.env.VERCEL === '1' ||
    process.env.VERCEL === 'true' ||
    process.env.NODE_ENV === 'production';

  if (!prismaInstance) {
    try {
      let dbUrl = process.env.DATABASE_URL || '';
      
      // Auto-fix for Neon Postgres Pooler on Vercel to prevent "Server has closed the connection"
      if (dbUrl.includes('neon.tech') && dbUrl.includes('-pooler') && !dbUrl.includes('pgbouncer=true')) {
        dbUrl += (dbUrl.includes('?') ? '&' : '?') + 'pgbouncer=true';
        console.log('[Prisma] Auto-appended pgbouncer=true to Neon pooled connection string for Serverless compatibility.');
      }

      const isRealDb = dbUrl && (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) && !dbUrl.includes('dummy_db') && !dbUrl.includes('dummy:dummy');
      
      if (isProduction) {
        if (!isRealDb) {
          throw new Error('DATABASE_URL must be a valid PostgreSQL URL in production');
        }

        let ClientClass: any = null;
        try {
          const prismaModule = require('@prisma/client');
          ClientClass = prismaModule.PrismaClient;
        } catch (e: any) {
          throw new Error(`[Prisma Fatal] Could not load @prisma/client package: ${e.message}`);
        }

        if (!ClientClass) {
          throw new Error('[Prisma Fatal] PrismaClient class is not available.');
        }

        prismaInstance = new ClientClass({
          datasources: {
            db: {
              url: dbUrl,
            },
          },
        });
        
        prismaInstance.$connect().catch((err: any) => {
          console.error('[Prisma] Database eager connection notice:', err?.message || err);
        });
      } else {
        // Local development / testing mode
        if (!isRealDb) {
          console.log('[Prisma Dev] Non-PostgreSQL or missing DATABASE_URL in dev, using memory proxy.');
          prismaInstance = createMemoryPrismaProxy();
        } else {
          let ClientClass: any = null;
          try {
            const prismaModule = require('@prisma/client');
            ClientClass = prismaModule.PrismaClient;
          } catch (e: any) {
            console.warn('[Prisma] Could not load @prisma/client in dev:', e.message);
          }

          if (ClientClass) {
            prismaInstance = new ClientClass({
              datasources: {
                db: {
                  url: dbUrl,
                },
              },
            });
          } else {
            prismaInstance = createMemoryPrismaProxy();
          }
        }
      }
    } catch (err: any) {
      if (isProduction) {
        console.error('[Prisma Fatal Error]:', err.message);
        throw err;
      }
      console.warn('[Prisma] Dev initialization fallback to mock proxy:', err.message);
      prismaInstance = createMemoryPrismaProxy();
    }
    globalForPrisma.prisma = prismaInstance;
  }
  return prismaInstance;
}

function createMemoryPrismaProxy(): any {
  return new Proxy({}, {
    get(target, prop) {
      if (typeof prop !== 'string') return Reflect.get(target, prop);
      if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined;
      if (prop.startsWith('$')) {
        if (prop === '$connect' || prop === '$disconnect') return async () => {};
        if (prop === '$transaction') return async (cb) => typeof cb === 'function' ? cb(prismaInstance) : cb;
        return async () => [];
      }
      return {
        findMany: async () => [],
        findUnique: async () => null,
        findFirst: async () => null,
        create: async (args) => ({ id: 1, ...(args?.data || {}) }),
        update: async (args) => ({ id: 1, ...(args?.data || {}) }),
        upsert: async (args) => ({ id: 1, ...(args?.create || {}) }),
        delete: async () => ({}),
        deleteMany: async () => ({ count: 0 }),
        count: async () => 0,
        aggregate: async () => ({}),
        groupBy: async () => [],
      };
    }
  });
}

export const prisma = getPrisma();

