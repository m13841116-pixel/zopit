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
  const store = new Map<string, any[]>();
  let idCounter = 1000;

  function getTable(name: string): any[] {
    const key = name.toLowerCase();
    if (!store.has(key)) {
      store.set(key, []);
    }
    return store.get(key)!;
  }

  function matchCondition(itemVal: any, condVal: any): boolean {
    if (condVal === undefined) return true;
    if (condVal === null) return itemVal === null;
    if (typeof condVal === 'object' && !Array.isArray(condVal) && !(condVal instanceof Date)) {
      for (const [op, val] of Object.entries(condVal)) {
        if (op === 'equals') {
          if (String(itemVal) !== String(val)) return false;
        } else if (op === 'in') {
          if (!Array.isArray(val) || !val.map(String).includes(String(itemVal))) return false;
        } else if (op === 'notIn') {
          if (Array.isArray(val) && val.map(String).includes(String(itemVal))) return false;
        } else if (op === 'not') {
          if (String(itemVal) === String(val)) return false;
        } else if (op === 'gt') {
          if (!(Number(itemVal) > Number(val))) return false;
        } else if (op === 'gte') {
          if (!(Number(itemVal) >= Number(val))) return false;
        } else if (op === 'lt') {
          if (!(Number(itemVal) < Number(val))) return false;
        } else if (op === 'lte') {
          if (!(Number(itemVal) <= Number(val))) return false;
        }
      }
      return true;
    }
    return String(itemVal) === String(condVal);
  }

  function matchWhere(item: any, where: any): boolean {
    if (!where || Object.keys(where).length === 0) return true;
    if (where.OR && Array.isArray(where.OR)) {
      return where.OR.some((w: any) => matchWhere(item, w));
    }
    if (where.AND && Array.isArray(where.AND)) {
      return where.AND.every((w: any) => matchWhere(item, w));
    }
    for (const [key, cond] of Object.entries(where)) {
      if (key === 'OR' || key === 'AND' || key === 'NOT') continue;
      if (!matchCondition(item[key], cond)) return false;
    }
    return true;
  }

  function applyData(existing: any, data: any) {
    const updated = { ...existing };
    for (const [k, v] of Object.entries(data)) {
      if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
        if ('decrement' in (v as any)) {
          const current = Number(existing[k]?.toNumber ? existing[k].toNumber() : existing[k] || 0);
          const dec = Number((v as any).decrement);
          const next = current - dec;
          updated[k] = wrapBalance(next);
          continue;
        } else if ('increment' in (v as any)) {
          const current = Number(existing[k]?.toNumber ? existing[k].toNumber() : existing[k] || 0);
          const inc = Number((v as any).increment);
          const next = current + inc;
          updated[k] = wrapBalance(next);
          continue;
        }
      }
      if (k === 'balance' && (typeof v === 'number' || typeof v === 'string')) {
        updated[k] = wrapBalance(Number(v));
      } else {
        updated[k] = v;
      }
    }
    return updated;
  }

  function wrapBalance(num: number) {
    return {
      toNumber: () => num,
      toString: () => String(num),
      lt: (o: any) => num < (typeof o === 'object' && o?.toNumber ? o.toNumber() : Number(o)),
      lte: (o: any) => num <= (typeof o === 'object' && o?.toNumber ? o.toNumber() : Number(o)),
      gt: (o: any) => num > (typeof o === 'object' && o?.toNumber ? o.toNumber() : Number(o)),
      gte: (o: any) => num >= (typeof o === 'object' && o?.toNumber ? o.toNumber() : Number(o)),
      negated: () => wrapBalance(-num),
    };
  }

  const modelProxyCache = new Map<string, any>();

  function getModelProxy(modelName: string) {
    if (modelProxyCache.has(modelName)) return modelProxyCache.get(modelName);

    const modelObj = {
      findMany: async (args?: any) => {
        const table = getTable(modelName);
        return table.filter(item => matchWhere(item, args?.where));
      },
      findUnique: async (args?: any) => {
        const table = getTable(modelName);
        return table.find(item => matchWhere(item, args?.where)) || null;
      },
      findFirst: async (args?: any) => {
        const table = getTable(modelName);
        return table.find(item => matchWhere(item, args?.where)) || null;
      },
      create: async (args?: any) => {
        const table = getTable(modelName);
        idCounter++;
        const id = args?.data?.id || idCounter;
        const record = {
          id,
          ...args?.data,
          createdAt: args?.data?.createdAt || new Date(),
          updatedAt: new Date(),
        };
        if (record.balance !== undefined && typeof record.balance !== 'object') {
          record.balance = wrapBalance(Number(record.balance));
        }
        table.push(record);
        return record;
      },
      update: async (args?: any) => {
        const table = getTable(modelName);
        const idx = table.findIndex(item => matchWhere(item, args?.where));
        if (idx === -1) {
          throw new Error(`Record to update not found in ${modelName}`);
        }
        const updated = applyData(table[idx], args?.data || {});
        table[idx] = updated;
        return updated;
      },
      updateMany: async (args?: any) => {
        const table = getTable(modelName);
        let count = 0;
        for (let i = 0; i < table.length; i++) {
          if (matchWhere(table[i], args?.where)) {
            table[i] = applyData(table[i], args?.data || {});
            count++;
          }
        }
        return { count };
      },
      delete: async (args?: any) => {
        const table = getTable(modelName);
        const idx = table.findIndex(item => matchWhere(item, args?.where));
        if (idx !== -1) {
          const [removed] = table.splice(idx, 1);
          return removed;
        }
        return {};
      },
      deleteMany: async (args?: any) => {
        const table = getTable(modelName);
        const initial = table.length;
        const remaining = table.filter(item => !matchWhere(item, args?.where));
        store.set(modelName.toLowerCase(), remaining);
        return { count: initial - remaining.length };
      },
      count: async (args?: any) => {
        const table = getTable(modelName);
        if (!args?.where) return table.length;
        return table.filter(item => matchWhere(item, args?.where)).length;
      },
      aggregate: async () => ({}),
      groupBy: async () => [],
    };

    modelProxyCache.set(modelName, modelObj);
    return modelObj;
  }

  let txMutex: Promise<any> = Promise.resolve();

  const rootProxy = new Proxy({}, {
    get(target, prop) {
      if (typeof prop !== 'string') return Reflect.get(target, prop);
      if (prop in target) return (target as any)[prop];
      if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined;
      if (prop.startsWith('$')) {
        if (prop === '$connect' || prop === '$disconnect') return async () => {};
        if (prop === '$transaction') {
          return async (cb: any) => {
            if (typeof cb === 'function') {
              const runTx = async () => {
                const snapshot = new Map<string, any[]>();
                for (const [k, v] of store.entries()) {
                  snapshot.set(k, v.map(item => ({ ...item })));
                }
                try {
                  return await cb(rootProxy);
                } catch (err) {
                  store.clear();
                  for (const [k, v] of snapshot.entries()) {
                    store.set(k, v);
                  }
                  throw err;
                }
              };

              const currentMutex = txMutex;
              let release: (val?: any) => void = () => {};
              txMutex = new Promise(resolve => { release = resolve; });
              await currentMutex;
              try {
                return await runTx();
              } finally {
                release!();
              }
            }
            if (Array.isArray(cb)) {
              return await Promise.all(cb);
            }
            return cb;
          };
        }
        return async () => [];
      }
      return getModelProxy(prop);
    },
    set(target, prop, value) {
      (target as any)[prop] = value;
      return true;
    }
  });

  return rootProxy;
}

export const prisma = getPrisma();

