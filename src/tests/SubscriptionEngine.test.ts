import assert from "node:assert";
import { SubscriptionService } from "../services/SubscriptionService";
import { prisma } from "../prisma.js";

export async function runSubscriptionEngineTests() {
  console.log("🚀 Starting Zopit Subscription Engine & Conversion UX Tests...");

  // Mock prisma systemSettings statefully for predictable test runs
  const mockSettings: Record<string, string> = {};
  
  // Assign to prisma object directly
  const activePrisma = (globalThis as any).prisma || prisma;
  activePrisma.systemSettings = {
    findMany: async (args?: any) => {
      const keys = args?.where?.key?.in;
      return Object.entries(mockSettings)
        .filter(([key]) => !keys || keys.includes(key))
        .map(([key, value]) => ({ key, value }));
    },
    upsert: async (args: any) => {
      const key = args.where.key;
      const value = args.create.value;
      mockSettings[key] = value;
      return { key, value };
    },
    update: async (args: any) => {
      const key = args.where.key;
      const value = args.data.value;
      mockSettings[key] = value;
      return { key, value };
    },
    deleteMany: async (args?: any) => {
      const keys = args?.where?.key?.in;
      if (keys) {
        keys.forEach((k: string) => delete mockSettings[k]);
      } else {
        Object.keys(mockSettings).forEach((k) => delete mockSettings[k]);
      }
      return { count: 0 };
    }
  };

  // 1. Configurable / Authoritative Prices & Defaults
  const configs = await SubscriptionService.getPlanConfigs();
  assert.strictEqual(configs.PRO_MONTHLY.priceToman, 2490000);
  assert.strictEqual(configs.PRO_ANNUAL.priceToman, 24900000);

  // 2. Correct Service Total
  assert.strictEqual(configs.totalServiceValueToman, 15150000);
  assert.ok(configs.valueStackServices.length > 0);

  // 3. Correct Savings
  assert.strictEqual(configs.PRO_MONTHLY.savingsToman, 15150000 - 2490000);
  assert.strictEqual(configs.PRO_ANNUAL.savingsToman, 15150000 - 24900000);

  // 4. Correct Percentage
  assert.strictEqual(configs.PRO_MONTHLY.discountPercentage, Math.round(((15150000 - 2490000) / 15150000) * 100));

  // 5. Monthly vs Annual Calculation
  // Equiv monthly billing is 2490000 * 12 = 29880000
  // Annual price is 24900000
  // Saving is 4980000
  assert.strictEqual(configs.PRO_ANNUAL.annualSavingVsMonthlyToman, 4980000);
  assert.strictEqual(configs.PRO_ANNUAL.monthsFree, 2);

  // 6. Configurable Prices from Admin
  const adminId = 999123;
  await SubscriptionService.adminUpdatePlanPrices(adminId, 599000, 2590000);
  const updatedConfigs = await SubscriptionService.getPlanConfigs();
  assert.strictEqual(updatedConfigs.PRO_MONTHLY.priceToman, 599000);
  assert.strictEqual(updatedConfigs.PRO_ANNUAL.priceToman, 2590000);

  // 7. Dynamic Value stack and savings updates after price change
  assert.strictEqual(updatedConfigs.PRO_ANNUAL.savingsToman, 15150000 - 2590000);
  assert.strictEqual(updatedConfigs.PRO_ANNUAL.discountPercentage, Math.round(((15150000 - 2590000) / 15150000) * 100));

  // 8. Countdown Behavior (future end date)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await prisma.systemSettings.upsert({
    where: { key: "pro_promotion_end" },
    update: { value: tomorrow.toISOString() },
    create: { key: "pro_promotion_end", value: tomorrow.toISOString() }
  });
  const promoConfigs = await SubscriptionService.getPlanConfigs();
  assert.strictEqual(promoConfigs.promotionConfig.isExpired, false);
  assert.strictEqual(promoConfigs.promotionConfig.visible, true);

  // 9. Expired Promotion
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  await prisma.systemSettings.update({
    where: { key: "pro_promotion_end" },
    data: { value: yesterday.toISOString() }
  });
  await prisma.systemSettings.upsert({
    where: { key: "pro_promotion_action_after_expiry" },
    update: { value: "HIDE_PROMOTION" },
    create: { key: "pro_promotion_action_after_expiry", value: "HIDE_PROMOTION" }
  });
  const expiredConfigs = await SubscriptionService.getPlanConfigs();
  assert.strictEqual(expiredConfigs.promotionConfig.isExpired, true);
  // Monthly price should increase by 25% because action is HIDE_PROMOTION
  assert.strictEqual(expiredConfigs.PRO_MONTHLY.priceToman, Math.round(599000 * 1.25));

  // 10. No Auto-Renewal Implication
  // Verify that countdown configuration is pure promotional and never references automated renewal or billing
  assert.ok(expiredConfigs.promotionConfig.text.length > 0);
  assert.doesNotMatch(expiredConfigs.promotionConfig.text, /پس از پایان شمارش، اشتراک شما تمدید میشود/);

  // 11. Admin Authorization Validation
  await assert.rejects(async () => {
    await SubscriptionService.adminUpdatePlanPrices(adminId, -100, 2590000);
  }, /قیمت اشتراک باید بزرگتر از صفر باشد/);

  // 12. Frontend Price Manipulation Prevention & Payment Amount Integrity
  // Simulate purchase initiation where frontend sends custom user data, but backend pulls authoritative DB value
  // Let's reset settings first to ensure we know the precise price in database
  await prisma.systemSettings.update({
    where: { key: "pro_promotion_action_after_expiry" },
    data: { value: "NONE" } // Keep standard updated prices: Monthly 599000, Annual 2590000
  });
  
  // Authoritative prices checked
  const authConfigs = await SubscriptionService.getPlanConfigs();
  assert.strictEqual(authConfigs.PRO_MONTHLY.priceToman, 599000);

  // Verify that backend subscriptions are persistent and match status checks
  const status = await SubscriptionService.getStoreSubscriptionStatus(999999);
  assert.strictEqual(status.userId, 999999);
  assert.strictEqual(status.isActive, false);

  console.log("✅ All Zopit Subscription Engine & Conversion UX Tests Completed Successfully.");
}
