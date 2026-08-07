const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

content = content.replace(/const noOpMock: any = \{/, `const noOpMock: any = new Proxy({
  $transaction: async (cb: any) => {
    if (typeof cb === 'function') {
      return cb(new Proxy({}, { get: () => noOpMock }));
    }
    return [];
  },
  $connect: async () => {},
  $disconnect: async () => {},
}, {
  get: function(target, prop) {
    if (prop in target) return target[prop];
    return new Proxy({}, {
      get: function(subTarget, subProp) {
        return async (...args: any[]) => {
          if (subProp === 'findMany') return [];
          if (subProp === 'findFirst' || subProp === 'findUnique') return null;
          if (subProp === 'create' || subProp === 'update') return args[0]?.data ?? {};
          if (subProp === 'delete' || subProp === 'deleteMany') return { count: 0 };
          if (subProp === 'count') return 0;
          return null;
        };
      }
    });
  }
});
/*`);

content = content.replace(/noOpMock\.\$transaction = async[\s\S]*?\];\s*\};/g, '*/');

fs.writeFileSync('server.ts', content);
