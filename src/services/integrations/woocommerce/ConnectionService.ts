import { getPrisma } from '../../../prisma.js';
import { EncryptionService } from './EncryptionService.js';

const prisma = getPrisma();

export class ConnectionService {
  static async testConnection(storeUrl: string, consumerKey: string, consumerSecret: string) {
    try {
      const url = new URL('/wp-json/wc/v3/system_status', storeUrl);
      const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
      const response = await fetch(url.toString(), { signal: AbortSignal.timeout(10000), 
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return { success: false, error: 'Connection failed. Please check credentials and URL.' };
      }

      const data = await response.json() as any;
      return { 
        success: true, 
        data: {
          wooVersion: data.environment?.version,
          wpVersion: data.environment?.wp_version,
        }
      };
    } catch (error: any) {
      return { success: false, error: error.message || 'Network error' };
    }
  }

  static async connect(storeId: number, storeUrl: string, consumerKey: string, consumerSecret: string) {
    const encKey = EncryptionService.encrypt(consumerKey);
    const encSecret = EncryptionService.encrypt(consumerSecret);

    return await prisma.storeConnection.upsert({
      where: { storeId },
      update: {
        storeUrl,
        consumerKey: encKey,
        consumerSecret: encSecret,
        status: 'CONNECTED'
      },
      create: {
        storeId,
        storeUrl,
        consumerKey: encKey,
        consumerSecret: encSecret,
        status: 'CONNECTED'
      }
    });
  }

  static async disconnect(storeId: number) {
    return await prisma.storeConnection.update({
      where: { storeId },
      data: {
        status: 'DISCONNECTED',
        consumerKey: '',
        consumerSecret: ''
      }
    });
  }

  static async getConnection(storeId: number) {
    const conn = await prisma.storeConnection.findUnique({
      where: { storeId }
    });
    if (!conn) return null;
    
    return {
      ...conn,
      consumerKey: conn.consumerKey ? EncryptionService.decrypt(conn.consumerKey) : '',
      consumerSecret: conn.consumerSecret ? EncryptionService.decrypt(conn.consumerSecret) : ''
    };
  }
}
