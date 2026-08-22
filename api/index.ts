import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../server.ts';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Let Express handle routing naturally
  return app(req, res);
}
