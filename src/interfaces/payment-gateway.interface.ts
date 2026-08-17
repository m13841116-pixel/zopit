export interface PaymentGateway {
  createPayment(amount: number | string, description: string, callbackUrl: string, orderId?: string | number): Promise<{ payLink: string; authority: string }>;
  verifyPayment(authority: string, amount: number | string): Promise<{ success: boolean; trackId: string; refId: string }>;
  requestPayout(amount: number | string, shaba: string, description: string): Promise<{ success: boolean; trackId: string }>;
  getPayoutStatus(trackId: string): Promise<{ status: string; detail: string }>;
}
