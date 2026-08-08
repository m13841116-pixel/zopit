import fs from 'fs';
import path from 'path';

export default function registerOrderLabels(app: any, prisma: any) {
  // Ensure uploads/labels directory exists for fast base64 to file storage
  const uploadDir = process.env.VERCEL
    ? path.join('/tmp', 'uploads', 'labels')
    : path.join(process.cwd(), 'uploads', 'labels');
  if (!fs.existsSync(uploadDir)) {
    try {
      fs.mkdirSync(uploadDir, { recursive: true });
    } catch (e) {}
  }

  app.post('/api/orders/:id/label', async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { labelUrl } = req.body;

      if (!labelUrl) {
        return res.status(400).json({ error: 'labelUrl is required' });
      }

      const orderId = parseInt(id, 10);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: 'Invalid order ID' });
      }

      let savedLabelPath = labelUrl;
      if (labelUrl && labelUrl.startsWith('data:')) {
        try {
          const matches = labelUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const contentType = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, 'base64');
            
            let ext = 'bin';
            if (contentType.includes('pdf')) ext = 'pdf';
            else if (contentType.includes('png')) ext = 'png';
            else if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg';
            
            const filename = `label_${orderId}_${Date.now()}.${ext}`;
            const filePath = path.join(uploadDir, filename);
            fs.writeFileSync(filePath, buffer);
            fs.writeFileSync(filePath + '.meta', contentType);
            
            savedLabelPath = `/api/orders/${orderId}/postal-label/file`;
          }
        } catch (err) {
          console.error('Error saving base64 label file:', err);
        }
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { 
          postalLabel: savedLabelPath,
          status: 'PROCESSING' // Set status to processing when postal label is uploaded
        }
      });

      res.json({ success: true, order: updatedOrder });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });
}
