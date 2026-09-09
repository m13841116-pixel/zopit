import { EventEmitter } from 'events';

class AppEventEmitter extends EventEmitter {}
export const appEvents = new AppEventEmitter();

export class NotificationService {
  static init() {
    // Listen to wallet credit events
    appEvents.on('wallet.credited', (data: { walletId: string, amount: string | number, supplierId: number }) => {
      console.log(`[Notification Service] 📨 Sending SMS to Supplier ID ${data.supplierId}: "نقدینگی جدید به کیفپول شما افزوده شد." (Amount: ${data.amount})`);
    });

    // Listen to payout success events
    appEvents.on('payout.success', (data: { walletId: string, amount: string | number, supplierId: number, shaba: string }) => {
      console.log(`[Notification Service] 📨 Sending SMS to Supplier ID ${data.supplierId}: "تسویه حساب با موفقیت به شماره شبای شما واریز شد." (Shaba: ${data.shaba})`);
    });
    
    console.log('[Notification Service] Initialized and listening to events.');
  }
}
