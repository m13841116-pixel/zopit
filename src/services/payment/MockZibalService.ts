import { PaymentGateway } from '../../interfaces/payment-gateway.interface.js';

// Simple in-memory store to track mock payment and payout state
export const mockPaymentStore = new Map<string, { amount: number | string; status: 'pending' | 'success' | 'failed' }>();
export const mockPayoutStore = new Map<string, { status: 'pending' | 'processing' | 'success' | 'failed' }>();

export class MockZibalService implements PaymentGateway {
  async createPayment(amount: number | string, description: string, callbackUrl: string): Promise<{ payLink: string; authority: string }> {
    const authority = `MOCK_AUTH_${Date.now()}`;
    mockPaymentStore.set(authority, { amount, status: 'pending' });
    
    // A real payLink redirects to the gateway. For mock, we can redirect to a simulated payment page or directly to our mock callback endpoint.
    const payLink = `/api/mock/payment-callback?authority=${authority}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
    
    return { payLink, authority };
  }

  async verifyPayment(authority: string, amount: number | string): Promise<{ success: boolean; trackId: string; refId: string }> {
    const record = mockPaymentStore.get(authority);
    if (!record) {
      throw new Error('Mock Payment Authority not found');
    }

    if (record.status !== 'success') {
      return { success: false, trackId: '', refId: '' };
    }

    // In a real scenario, we might also verify the amount here
    const trackId = `MOCK_TRACK_${Date.now()}`;
    const refId = `MOCK_REF_${Date.now()}`;

    return { success: true, trackId, refId };
  }

  async requestPayout(amount: number | string, shaba: string, description: string): Promise<{ success: boolean; trackId: string }> {
    const trackId = `MOCK_PAYOUT_${Date.now()}`;
    mockPayoutStore.set(trackId, { status: 'processing' });

    // Simulate a random success/fail after a 10-second delay
    // This allows us to test the ledger balance lock/unlock workflow asynchronously
    setTimeout(() => {
      // 80% chance of success for mock testing
      const finalStatus = Math.random() > 0.2 ? 'success' : 'failed';
      mockPayoutStore.set(trackId, { status: finalStatus });
      console.log(`Mock Payout ${trackId} asynchronously transitioned to: ${finalStatus}`);
    }, 10000);

    return { success: true, trackId };
  }

  async getPayoutStatus(trackId: string): Promise<{ status: string; detail: string }> {
    const record = mockPayoutStore.get(trackId);
    if (!record) {
      throw new Error('Mock Payout not found');
    }
    
    return { 
      status: record.status,
      detail: 'Simulated payout detail message'
    };
  }
}
