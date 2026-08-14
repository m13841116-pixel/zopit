let prismaInstance: any = null;

// Use globalThis to persist Prisma client in development or serverless environments
const globalForPrisma = globalThis as unknown as { prisma: any };

export function getPrisma(): any {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  if (!prismaInstance) {
    try {
      const dbUrl = process.env.DATABASE_URL || '';
      const isRealDb = dbUrl && (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) && !dbUrl.includes('dummy_db');
      if (!isRealDb) {
        prismaInstance = createMemoryPrismaProxy();
      } else {
        let ClientClass: any = null;
        try {
          const prismaModule = require('@prisma/client');
          ClientClass = prismaModule.PrismaClient;
        } catch (e: any) {
          console.warn('[Prisma] Could not load @prisma/client package dynamically:', e.message);
        }

        if (ClientClass) {
          prismaInstance = new ClientClass({
            datasources: {
              db: {
                url: dbUrl,
              },
            },
          });
          // Attempt eager connection to detect immediate failures
          prismaInstance.$connect().catch((err: any) => {
            console.error('[Prisma] Database eager connection failed:', err);
          });
        } else {
          prismaInstance = createMemoryPrismaProxy();
        }
      }
    } catch (err: any) {
      console.warn('[Prisma] Initialization failed, falling back to mock proxy:', err.message);
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

