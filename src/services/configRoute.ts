import { getPrisma } from '../prisma.js';

const prisma = getPrisma();

export default function registerConfig(app: any) {
  app.get('/api/config', async (req: any, res: any) => {
    try {
      const configs = await prisma.systemConfig.findMany();
      const configMap = configs.reduce((acc: any, c: any) => {
        if (c.value === 'true') acc[c.key] = true;
        else if (c.value === 'false') acc[c.key] = false;
        else acc[c.key] = c.value; // Store as string if it's neither true nor false
        return acc;
      }, {});
      res.json(configMap);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/config', async (req: any, res: any) => {
    try {
      const { key, value } = req.body;
      const config = await prisma.systemConfig.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}
