import { getPrisma } from '../../../prisma.js';
import WooCommerceRestApi from '@woocommerce/woocommerce-rest-api';
import { processOrderPayload } from './WebhookService.js';

const prisma = getPrisma();

export async function syncSingleOrder(storeId: number, orderId: string) {
  const connection = await prisma.storeConnection.findUnique({
    where: { storeId },
  });
  if (!connection) {
    throw new Error('Store connection not found');
  }

  const WC = (WooCommerceRestApi as any).default?.default || (WooCommerceRestApi as any).default || WooCommerceRestApi;
  const api = new WC({
    url: connection.storeUrl,
    consumerKey: connection.consumerKey,
    consumerSecret: connection.consumerSecret,
    version: 'wc/v3',
  });

  const response = await api.get(`orders/${orderId}`);
  if (response.status === 200 && response.data) {
    await processOrderPayload(storeId, response.data);
    return response.data;
  }
  throw new Error(`Failed to fetch order ${orderId} from WooCommerce`);
}
