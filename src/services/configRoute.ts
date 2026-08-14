import { getPrisma } from '../prisma.js';

export default function registerConfig(app: any) {
  app.get('/api/config', async (req: any, res: any) => {
    try {
      const prisma = getPrisma();
      const configs = await prisma.systemConfig.findMany();
      const configMap = configs.reduce((acc: any, c: any) => {
        if (c.value === 'true') acc[c.key] = true;
        else if (c.value === 'false') acc[c.key] = false;
        else acc[c.key] = c.value; // Store as string if it's neither true nor false
        return acc;
      }, {});
      res.json(configMap);
    } catch (error: any) {
      console.error('Error fetching config:', error);
      res.status(500).json({ error: 'Internal server error', details: error?.message || String(error) });
    }
  });

  app.put('/api/config', async (req: any, res: any) => {
    try {
      const prisma = getPrisma();
      const body = req.body || {};
      
      // 1. Bulk array format: { items: [{ key, value }] }
      if (Array.isArray(body.items)) {
        for (const item of body.items) {
          if (item?.key !== undefined) {
            await prisma.systemConfig.upsert({
              where: { key: String(item.key) },
              update: { value: String(item.value ?? '') },
              create: { key: String(item.key), value: String(item.value ?? '') }
            });
          }
        }
        return res.json({ success: true, updatedCount: body.items.length });
      }

      // 2. Bulk object format: { settings: { k: v } }
      if (body.settings && typeof body.settings === 'object') {
        const entries = Object.entries(body.settings);
        for (const [key, value] of entries) {
          await prisma.systemConfig.upsert({
            where: { key: String(key) },
            update: { value: String(value ?? '') },
            create: { key: String(key), value: String(value ?? '') }
          });
        }
        return res.json({ success: true, updatedCount: entries.length });
      }

      // 3. Single key update format: { key, value }
      const { key, value } = body;
      if (!key) {
        return res.status(400).json({ error: 'Missing key parameter' });
      }
      const config = await prisma.systemConfig.upsert({
        where: { key: String(key) },
        update: { value: String(value ?? '') },
        create: { key: String(key), value: String(value ?? '') }
      });
      res.json(config);
    } catch (error: any) {
      console.error('Error saving configs in route:', error);
      res.status(500).json({ error: 'Internal server error', details: error?.message || String(error) });
    }
  });
}
