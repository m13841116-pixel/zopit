import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Ensure CORS headers for API calls
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Proxy-Secret-Key');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Dynamically import the compiled CJS server bundle
    // @ts-ignore
    const serverModule = await import('../dist/server.cjs');
    
    // In Node's ESM, importing a CJS module places its module.exports on the 'default' key.
    // Since our CJS bundle exports a default property (module.exports = { default: app }),
    // we need to unwrap it twice.
    const app = serverModule.default?.default || serverModule.default || serverModule;
    
    if (typeof app !== 'function') {
      throw new Error(`Exported app is not a function. It is: ${typeof app}`);
    }

    // Let Express handle routing naturally
    return app(req, res);
  } catch (err: any) {
    console.error("Failed to load server.cjs:", err);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
}

