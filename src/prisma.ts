import { PrismaClient } from '@prisma/client';

let prismaInstance: any = null;

function createDummyPrismaProxy(): any {
  const dummyHandler = {
    get(_target: any, prop: string | symbol): any {
      if (prop === '$transaction') {
        return async (arg: any) => {
          if (typeof arg === 'function') {
            return arg(createDummyPrismaProxy());
          }
          if (Array.isArray(arg)) {
            return Promise.all(arg);
          }
          return [];
        };
      }
      if (prop === '$connect' || prop === '$disconnect') {
        return async () => {};
      }
      if (typeof prop === 'string' && prop.startsWith('$')) {
        return async () => null;
      }
      return new Proxy({}, {
        get(_modelTarget, method) {
          if (method === 'findMany') return async () => [];
          if (method === 'findFirst' || method === 'findUnique') return async () => null;
          if (method === 'count') return async () => 0;
          if (method === 'create' || method === 'update' || method === 'upsert') {
            return async (args: any) => args?.data ?? {};
          }
          if (method === 'delete' || method === 'deleteMany' || method === 'updateMany') {
            return async () => ({ count: 0 });
          }
          return async () => null;
        }
      });
    }
  };
  return new Proxy({}, dummyHandler);
}

export function getPrisma(): any {
  if (!prismaInstance) {
    try {
      const dbUrl = process.env.DATABASE_URL;
      if (dbUrl) {
        prismaInstance = new PrismaClient({
          datasources: {
            db: {
              url: dbUrl
            }
          }
        });
      } else {
        prismaInstance = new PrismaClient();
      }
    } catch (err: any) {
      console.warn('[Prisma Singleton] Initial creation failed, returning dynamic safe fallback proxy:', err.message);
      return createDummyPrismaProxy();
    }
  }
  return prismaInstance;
}
