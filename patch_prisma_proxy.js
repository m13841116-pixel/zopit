const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// Replace the Proxy part
content = content.replace(/let prisma: any = new Proxy\(\{.*?\}\);/s, `let prisma: any = new Proxy({}, {
  get(target, prop) {
    const active = getActivePrisma();
    if (prop === '$transaction') {
      if (isPrismaMock) return async (cb: any) => { throw new Error('Database (Prisma) failed to initialize on this host. Cannot perform transaction.'); };
      return active.$transaction.bind(active);
    }
    if (isPrismaMock) {
       // Return a proxy that throws a clear error for any method call (findUnique, create, etc)
       return new Proxy({}, {
         get(subTarget, subProp) {
           return async (...args: any[]) => {
             throw new Error('مشکل در اجرای دیتابیس در هاست شما (Prisma Engine Failed). لطفاً لاگ سرور را بررسی کنید.');
           };
         }
       });
    }
    if (typeof active[prop] === 'function') {
      return active[prop].bind(active);
    }
    return active[prop];
  }
});`);

fs.writeFileSync('server.ts', content);
