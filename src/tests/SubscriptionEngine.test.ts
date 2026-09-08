import assert from "node:assert";
import { SubscriptionService } from "../services/SubscriptionService";

export async function runSubscriptionEngineTests() {
  // 1. Monthly plan price
  const configs = await SubscriptionService.getPlanConfigs();
  assert.strictEqual(configs.PRO_MONTHLY.priceToman, 2490000);
  assert.strictEqual(configs.PRO_MONTHLY.priceRials, 24900000);

  // 2. Annual plan price
  assert.strictEqual(configs.PRO_ANNUAL.priceToman, 24900000);
  assert.strictEqual(configs.PRO_ANNUAL.priceRials, 249000000);

  // 3. Duration
  assert.strictEqual(configs.PRO_MONTHLY.durationDays, 30);
  assert.strictEqual(configs.PRO_MONTHLY.durationMonths, 1);
  assert.strictEqual(configs.PRO_ANNUAL.durationDays, 365);
  assert.strictEqual(configs.PRO_ANNUAL.durationMonths, 12);

  // 4. Server status check
  const status = await SubscriptionService.getStoreSubscriptionStatus(999999);
  assert.strictEqual(status.userId, 999999);
  assert.strictEqual(status.isActive, false);
  assert.strictEqual(status.status, "NONE");
}
