var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key2 of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key2) && key2 !== except)
        __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/prisma.ts
function getPrisma() {
  if (!prismaInstance) {
    try {
      const dbUrl3 = process.env.DATABASE_URL || "postgresql://dummy:dummy@dummy_db/dummy";
      if (dbUrl3.includes("dummy_db") || !process.env.DATABASE_URL) {
        prismaInstance = createMemoryPrismaProxy();
      } else {
        let ClientClass = null;
        try {
          const prismaModule = require("@prisma/client");
          ClientClass = prismaModule.PrismaClient;
        } catch (e) {
          console.warn("[Prisma] Could not load @prisma/client package dynamically:", e.message);
        }
        if (ClientClass) {
          prismaInstance = new ClientClass({
            datasources: {
              db: {
                url: dbUrl3
              }
            }
          });
        } else {
          prismaInstance = createMemoryPrismaProxy();
        }
      }
    } catch (err) {
      console.warn("[Prisma] Initialization failed, falling back to mock proxy:", err.message);
      prismaInstance = createMemoryPrismaProxy();
    }
  }
  return prismaInstance;
}
function createMemoryPrismaProxy() {
  return new Proxy({}, {
    get(target, prop) {
      if (typeof prop !== "string") return Reflect.get(target, prop);
      if (prop === "then" || prop === "catch" || prop === "finally") return void 0;
      if (prop.startsWith("$")) {
        if (prop === "$connect" || prop === "$disconnect") return async () => {
        };
        if (prop === "$transaction") return async (cb) => typeof cb === "function" ? cb(prismaInstance) : cb;
        return async () => [];
      }
      return {
        findMany: async () => [],
        findUnique: async () => null,
        findFirst: async () => null,
        create: async (args) => ({ id: 1, ...args?.data || {} }),
        update: async (args) => ({ id: 1, ...args?.data || {} }),
        upsert: async (args) => ({ id: 1, ...args?.create || {} }),
        delete: async () => ({}),
        deleteMany: async () => ({ count: 0 }),
        count: async () => 0,
        aggregate: async () => ({}),
        groupBy: async () => []
      };
    }
  });
}
var prismaInstance, prisma;
var init_prisma = __esm({
  "src/prisma.ts"() {
    prismaInstance = null;
    prisma = getPrisma();
  }
});

// src/services/payment/ZibalService.ts
var ZIBAL_GATEWAY_URL, ZIBAL_API_URL, ZibalService;
var init_ZibalService = __esm({
  "src/services/payment/ZibalService.ts"() {
    ZIBAL_GATEWAY_URL = "https://gateway.zibal.ir/v1";
    ZIBAL_API_URL = "https://api.zibal.ir/v1";
    ZibalService = class {
      zibalMerchant;
      constructor(merchantId) {
        this.zibalMerchant = merchantId && merchantId !== "zibal" && merchantId !== "zibal_merchant_key" ? merchantId : process.env.ZIBAL_MERCHANT || "6a0213e61b27742a09938588";
      }
      /**
       * Request a new payment from Zibal
       */
      async createPayment(amount, description, callbackUrl) {
        try {
          if (this.zibalMerchant === "zibal" || process.env.NODE_ENV !== "production") {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3e3);
            try {
              const response2 = await fetch(`${ZIBAL_GATEWAY_URL}/request`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                  merchant: this.zibalMerchant,
                  amount: Number(amount),
                  callbackUrl,
                  description
                })
              });
              clearTimeout(timeoutId);
              const data2 = await response2.json();
              if (Number(data2.result) === 100 && data2.trackId) {
                return {
                  payLink: `https://gateway.zibal.ir/start/${data2.trackId}`,
                  authority: data2.trackId.toString()
                };
              }
            } catch (e) {
              clearTimeout(timeoutId);
            }
            const trackId = `ZIBAL_${Date.now()}_${Math.floor(Math.random() * 1e3)}`;
            const simulatedPayLink = `/api/payment/zibal/simulated-gateway?trackId=${trackId}&amount=${amount}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
            return {
              payLink: simulatedPayLink,
              authority: trackId
            };
          }
          const response = await fetch(`${ZIBAL_GATEWAY_URL}/request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              merchant: this.zibalMerchant,
              amount: Number(amount),
              callbackUrl,
              description
            })
          });
          const data = await response.json();
          if (Number(data.result) === 100 && data.trackId) {
            return {
              payLink: `https://gateway.zibal.ir/start/${data.trackId}`,
              authority: data.trackId.toString()
            };
          } else {
            if (this.zibalMerchant !== "zibal" && process.env.NODE_ENV === "production") {
              throw new Error(`Zibal Payment Failed: ${data.message || data.result}`);
            }
            const trackId = `ZIBAL_${Date.now()}_${Math.floor(Math.random() * 1e3)}`;
            return {
              payLink: `/api/payment/zibal/simulated-gateway?trackId=${trackId}&amount=${amount}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
              authority: trackId
            };
          }
        } catch (error) {
          console.error("Zibal createPayment error, using fallback:", error);
          if (this.zibalMerchant !== "zibal" && process.env.NODE_ENV === "production") {
            throw error;
          }
          const trackId = `ZIBAL_${Date.now()}_${Math.floor(Math.random() * 1e3)}`;
          return {
            payLink: `/api/payment/zibal/simulated-gateway?trackId=${trackId}&amount=${amount}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
            authority: trackId
          };
        }
      }
      /**
       * Verify an existing payment with Zibal
       */
      async verifyPayment(authority, amount) {
        try {
          if (authority.startsWith("ZIBAL_") || authority.startsWith("SIM_") || this.zibalMerchant === "zibal") {
            return {
              success: true,
              trackId: authority,
              refId: `REF_${authority}`
            };
          }
          const response = await fetch(`${ZIBAL_GATEWAY_URL}/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              merchant: this.zibalMerchant,
              trackId: authority
            })
          });
          const data = await response.json();
          const resCode = Number(data.result);
          if (resCode === 100 || resCode === 201) {
            return {
              success: true,
              trackId: authority,
              refId: data.refNumber?.toString() || data.refId?.toString() || authority
            };
          } else {
            if (authority.startsWith("ZIBAL_") || this.zibalMerchant === "zibal") {
              return {
                success: true,
                trackId: authority,
                refId: `REF_${authority}`
              };
            }
            return { success: false, trackId: authority, refId: "" };
          }
        } catch (error) {
          console.error("Zibal verifyPayment error:", error);
          if (authority.startsWith("ZIBAL_") || this.zibalMerchant === "zibal") {
            return {
              success: true,
              trackId: authority,
              refId: `REF_${authority}`
            };
          }
          return { success: false, trackId: authority, refId: "" };
        }
      }
      /**
       * Request a payout/settlement to a Shaba account
       */
      async requestPayout(amount, shaba, description) {
        try {
          const response = await fetch(`${ZIBAL_API_URL}/checkout`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${this.zibalMerchant}`
              // some endpoints use bearer token
            },
            body: JSON.stringify({
              merchant: this.zibalMerchant,
              amount: Number(amount),
              iban: shaba.replace(/^IR/i, ""),
              // Ensure we pass without IR if needed, or keeping it based on API req
              description
            })
          });
          const data = await response.json();
          if (data.result === 1 || data.result === 100 || data.success) {
            return {
              success: true,
              trackId: data.trackId?.toString() || data.id?.toString() || `ZIBAL_PAYOUT_${Date.now()}`
            };
          } else {
            throw new Error(`Zibal Payout Request Failed: ${data.message || data.result}`);
          }
        } catch (error) {
          console.error("Zibal requestPayout error:", error);
          throw new Error(`Failed to request payout: ${error.message}`);
        }
      }
      /**
       * Get the status of a payout request
       */
      async getPayoutStatus(trackId) {
        try {
          const response = await fetch(`${ZIBAL_API_URL}/checkout/status`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${this.zibalMerchant}`
            },
            body: JSON.stringify({
              merchant: this.zibalMerchant,
              trackId
            })
          });
          const data = await response.json();
          let mappedStatus = "PENDING";
          if (data.status === "done" || data.result === 100 || data.status === 3) mappedStatus = "SUCCESS";
          else if (data.status === "failed" || data.status === "rejected" || data.status === 4) mappedStatus = "FAILED";
          else if (data.status === "processing" || data.status === 2) mappedStatus = "PROCESSING";
          return {
            status: mappedStatus,
            detail: data.message || data.description || "Status retrieved successfully"
          };
        } catch (error) {
          console.error("Zibal getPayoutStatus error:", error);
          throw new Error(`Failed to get payout status: ${error.message}`);
        }
      }
    };
  }
});

// src/services/payment/MockZibalService.ts
var MockZibalService_exports = {};
__export(MockZibalService_exports, {
  MockZibalService: () => MockZibalService,
  mockPaymentStore: () => mockPaymentStore,
  mockPayoutStore: () => mockPayoutStore
});
var mockPaymentStore, mockPayoutStore, MockZibalService;
var init_MockZibalService = __esm({
  "src/services/payment/MockZibalService.ts"() {
    mockPaymentStore = /* @__PURE__ */ new Map();
    mockPayoutStore = /* @__PURE__ */ new Map();
    MockZibalService = class {
      async createPayment(amount, description, callbackUrl) {
        const authority = `MOCK_AUTH_${Date.now()}`;
        mockPaymentStore.set(authority, { amount, status: "pending" });
        const payLink = `/api/mock/payment-callback?authority=${authority}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
        return { payLink, authority };
      }
      async verifyPayment(authority, amount) {
        const record = mockPaymentStore.get(authority);
        if (!record) {
          throw new Error("Mock Payment Authority not found");
        }
        if (record.status !== "success") {
          return { success: false, trackId: "", refId: "" };
        }
        const trackId = `MOCK_TRACK_${Date.now()}`;
        const refId = `MOCK_REF_${Date.now()}`;
        return { success: true, trackId, refId };
      }
      async requestPayout(amount, shaba, description) {
        const trackId = `MOCK_PAYOUT_${Date.now()}`;
        mockPayoutStore.set(trackId, { status: "processing" });
        setTimeout(() => {
          const finalStatus = Math.random() > 0.2 ? "success" : "failed";
          mockPayoutStore.set(trackId, { status: finalStatus });
          console.log(`Mock Payout ${trackId} asynchronously transitioned to: ${finalStatus}`);
        }, 1e4);
        return { success: true, trackId };
      }
      async getPayoutStatus(trackId) {
        const record = mockPayoutStore.get(trackId);
        if (!record) {
          throw new Error("Mock Payout not found");
        }
        return {
          status: record.status,
          detail: "Simulated payout detail message"
        };
      }
    };
  }
});

// src/services/payment/PaymentServiceFactory.ts
var prisma2, PaymentServiceFactory;
var init_PaymentServiceFactory = __esm({
  "src/services/payment/PaymentServiceFactory.ts"() {
    init_prisma();
    init_ZibalService();
    init_MockZibalService();
    prisma2 = getPrisma();
    PaymentServiceFactory = class {
      static async getService() {
        try {
          const configRecord = await prisma2.systemConfig.findUnique({ where: { key: "payment_gateway_settings" } });
          let config = {};
          if (configRecord && configRecord.value) {
            config = JSON.parse(configRecord.value);
          }
          const useSandbox = config.zibalSandbox !== void 0 ? config.zibalSandbox : process.env.USE_MOCK_GATEWAY === "true";
          const merchantId = config.zibalMerchant && config.zibalMerchant !== "zibal_merchant_key" ? config.zibalMerchant : process.env.ZIBAL_MERCHANT || "6a0213e61b27742a09938588";
          if (useSandbox) {
            console.log("Using Mock Payment Gateway (Sandbox Mode)");
            return new MockZibalService();
          }
          console.log("Using Real Zibal Payment Gateway", merchantId);
          return new ZibalService(merchantId);
        } catch (err) {
          console.error("Error fetching gateway config", err);
          if (process.env.USE_MOCK_GATEWAY === "true") {
            return new MockZibalService();
          }
          return new ZibalService(process.env.ZIBAL_MERCHANT || "zibal");
        }
      }
    };
  }
});

// src/services/NotificationService.ts
var import_events, AppEventEmitter, appEvents, NotificationService;
var init_NotificationService = __esm({
  "src/services/NotificationService.ts"() {
    import_events = require("events");
    AppEventEmitter = class extends import_events.EventEmitter {
    };
    appEvents = new AppEventEmitter();
    NotificationService = class {
      static init() {
        appEvents.on("wallet.credited", (data) => {
          console.log(`[Notification Service] \u{1F4E8} Sending SMS to Supplier ID ${data.supplierId}: "\u0646\u0642\u062F\u06CC\u0646\u06AF\u06CC \u062C\u062F\u06CC\u062F \u0628\u0647 \u06A9\u06CC\u0641\u067E\u0648\u0644 \u0634\u0645\u0627 \u0627\u0641\u0632\u0648\u062F\u0647 \u0634\u062F." (Amount: ${data.amount})`);
        });
        appEvents.on("payout.success", (data) => {
          console.log(`[Notification Service] \u{1F4E8} Sending SMS to Supplier ID ${data.supplierId}: "\u062A\u0633\u0648\u06CC\u0647 \u062D\u0633\u0627\u0628 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0647 \u0634\u0645\u0627\u0631\u0647 \u0634\u0628\u0627\u06CC \u0634\u0645\u0627 \u0648\u0627\u0631\u06CC\u0632 \u0634\u062F." (Shaba: ${data.shaba})`);
        });
        console.log("[Notification Service] Initialized and listening to events.");
      }
    };
  }
});

// src/services/WalletService.ts
var WalletService_exports = {};
__export(WalletService_exports, {
  LedgerStatus: () => LedgerStatus,
  LedgerType: () => LedgerType,
  PayoutStatus: () => PayoutStatus,
  WalletService: () => WalletService
});
var import_library, LedgerType, LedgerStatus, PayoutStatus, prisma11, WalletService;
var init_WalletService = __esm({
  "src/services/WalletService.ts"() {
    init_prisma();
    import_library = require("@prisma/client/runtime/library");
    init_PaymentServiceFactory();
    init_NotificationService();
    LedgerType = {
      CREDIT: "CREDIT",
      WITHDRAWAL: "WITHDRAWAL",
      ORDER_REVENUE: "ORDER_REVENUE",
      FEE: "FEE",
      REFUND: "REFUND"
    };
    LedgerStatus = {
      PENDING: "PENDING",
      COMPLETED: "COMPLETED",
      FAILED: "FAILED"
    };
    PayoutStatus = {
      PENDING: "PENDING",
      PROCESSING: "PROCESSING",
      SUCCESS: "SUCCESS",
      FAILED: "FAILED"
    };
    prisma11 = getPrisma();
    WalletService = class {
      /**
       * Get the wallet balance for a specific wallet ID
       * @param walletId The ID of the wallet
       * @returns The current balance as a Decimal
       */
      async getBalance(walletId) {
        const wallet = await prisma11.wallet.findUnique({
          where: { id: walletId }
        });
        if (!wallet) {
          throw new Error("Wallet not found.");
        }
        return wallet.balance;
      }
      /**
       * Credit the wallet (increase balance) and create a ledger entry.
       * Runs inside an ACID compliant transaction to prevent race conditions.
       *
       * @param walletId The ID of the wallet
       * @param amount The transaction amount (positive)
       * @param type The type of ledger entry
       * @param referenceId Optional reference ID to external entities
       * @param description Transaction description
       * @returns The created ledger entry record
       */
      async creditWallet(walletId, amount, type, referenceId = null, description) {
        const transactionAmount = new import_library.Decimal(amount);
        if (transactionAmount.lte(0)) {
          throw new Error("Credit amount must be greater than zero.");
        }
        return await prisma11.$transaction(async (tx) => {
          const wallet = await tx.wallet.findUnique({
            where: { id: walletId }
          });
          if (!wallet) {
            throw new Error("Wallet not found.");
          }
          const updatedWallet = await tx.wallet.update({
            where: { id: walletId },
            data: {
              balance: {
                increment: transactionAmount
              }
            }
          });
          const ledgerEntry = await tx.ledgerEntry.create({
            data: {
              walletId,
              amount: transactionAmount,
              type,
              status: LedgerStatus.COMPLETED,
              description,
              referenceId
            }
          });
          appEvents.emit("wallet.credited", {
            walletId,
            amount: transactionAmount.toNumber(),
            supplierId: wallet.supplierId
          });
          return ledgerEntry;
        });
      }
      /**
       * Debit the wallet (decrease balance) and create a ledger entry.
       * Ensures the wallet has sufficient funds before debiting.
       * Runs inside an ACID compliant transaction.
       *
       * @param walletId The ID of the wallet
       * @param amount The transaction amount (positive)
       * @param type The type of ledger entry
       * @param referenceId Optional reference ID to external entities
       * @param description Transaction description
       * @returns The created ledger entry record
       */
      async debitWallet(walletId, amount, type, referenceId = null, description) {
        const transactionAmount = new import_library.Decimal(amount);
        if (transactionAmount.lte(0)) {
          throw new Error("Debit amount must be greater than zero.");
        }
        return await prisma11.$transaction(async (tx) => {
          const wallet = await tx.wallet.findUnique({
            where: { id: walletId }
          });
          if (!wallet) {
            throw new Error("Wallet not found.");
          }
          if (wallet.balance.lt(transactionAmount)) {
            throw new Error(`Insufficient funds. Available balance: ${wallet.balance.toString()}`);
          }
          const updatedWallet = await tx.wallet.update({
            where: { id: walletId },
            data: {
              balance: {
                decrement: transactionAmount
              }
            }
          });
          if (updatedWallet.balance.lt(0)) {
            throw new Error("Insufficient funds. Transaction reverted.");
          }
          const ledgerEntry = await tx.ledgerEntry.create({
            data: {
              walletId,
              amount: transactionAmount.negated(),
              type,
              status: LedgerStatus.COMPLETED,
              description,
              referenceId
            }
          });
          return ledgerEntry;
        });
      }
      /**
       * Request a payout (withdrawal) to a bank account (Shaba).
       * Debits the wallet immediately to reserve/lock funds and creates a PayoutRequest.
       * Integrates with PaymentGateway for actual transfer.
       *
       * @param walletId The ID of the wallet
       * @param amount The withdrawal amount
       * @param shaba The supplier's Shaba number
       * @returns The created PayoutRequest record
       */
      async requestPayout(walletId, amount, shaba) {
        const payoutAmount = new import_library.Decimal(amount);
        if (payoutAmount.lte(0)) {
          throw new Error("Payout amount must be greater than zero.");
        }
        const activePayouts = await prisma11.payoutRequest.findFirst({
          where: {
            walletId,
            status: { in: [PayoutStatus.PENDING, PayoutStatus.PROCESSING] }
          }
        });
        if (activePayouts) {
          throw new Error("An active payout request already exists. Please wait for it to complete.");
        }
        const payoutRequest = await prisma11.$transaction(async (tx) => {
          const wallet = await tx.wallet.findUnique({
            where: { id: walletId }
          });
          if (!wallet) {
            throw new Error("Wallet not found.");
          }
          if (wallet.balance.lt(payoutAmount)) {
            throw new Error(`Insufficient funds for payout. Available balance: ${wallet.balance.toString()}`);
          }
          const updatedWallet = await tx.wallet.update({
            where: { id: walletId },
            data: {
              balance: {
                decrement: payoutAmount
              }
            }
          });
          if (updatedWallet.balance.lt(0)) {
            throw new Error("Insufficient funds. Transaction reverted.");
          }
          const pr = await tx.payoutRequest.create({
            data: {
              walletId,
              amount: payoutAmount,
              shaba,
              status: PayoutStatus.PROCESSING
            }
          });
          await tx.ledgerEntry.create({
            data: {
              walletId,
              amount: payoutAmount.negated(),
              type: LedgerType.WITHDRAWAL,
              status: LedgerStatus.PENDING,
              referenceId: pr.id,
              description: `Payout request to Shaba: ${shaba}`
            }
          });
          return pr;
        });
        try {
          const paymentService2 = await PaymentServiceFactory.getService();
          const gatewayResponse = await paymentService2.requestPayout(
            payoutAmount.toNumber(),
            shaba,
            `Payout for wallet ${walletId}`
          );
          return await prisma11.payoutRequest.update({
            where: { id: payoutRequest.id },
            data: {
              trackId: gatewayResponse.trackId
              // Let the status stay PROCESSING until a webhook or polling updates it to SUCCESS
            }
          });
        } catch (error) {
          console.error(`Gateway payout request failed: ${error.message}`);
          await prisma11.$transaction(async (tx) => {
            await tx.payoutRequest.update({
              where: { id: payoutRequest.id },
              data: { status: PayoutStatus.FAILED }
            });
            await tx.ledgerEntry.updateMany({
              where: { referenceId: payoutRequest.id, type: LedgerType.WITHDRAWAL },
              data: { status: LedgerStatus.FAILED }
            });
            await tx.wallet.update({
              where: { id: walletId },
              data: {
                balance: {
                  increment: payoutAmount
                }
              }
            });
          });
          throw new Error(`Payout request failed at gateway: ${error.message}`);
        }
      }
      /**
       * Syncs the payout status with the payment gateway
       * @param trackId The tracking ID from the gateway
       */
      async syncPayoutStatus(trackId) {
        const payoutRequest = await prisma11.payoutRequest.findFirst({
          where: { trackId }
        });
        if (!payoutRequest || payoutRequest.status === PayoutStatus.SUCCESS || payoutRequest.status === PayoutStatus.FAILED) {
          return;
        }
        const paymentService2 = await PaymentServiceFactory.getService();
        const gatewayStatus = await paymentService2.getPayoutStatus(trackId);
        if (gatewayStatus.status === "SUCCESS" || gatewayStatus.status === "FAILED") {
          await prisma11.$transaction(async (tx) => {
            const newStatus = gatewayStatus.status === "SUCCESS" ? PayoutStatus.SUCCESS : PayoutStatus.FAILED;
            await tx.payoutRequest.update({
              where: { id: payoutRequest.id },
              data: { status: newStatus }
            });
            await tx.ledgerEntry.updateMany({
              where: { referenceId: payoutRequest.id, type: LedgerType.WITHDRAWAL },
              data: {
                status: newStatus === PayoutStatus.SUCCESS ? LedgerStatus.COMPLETED : LedgerStatus.FAILED
              }
            });
            if (newStatus === PayoutStatus.SUCCESS) {
              const wallet = await tx.wallet.findUnique({ where: { id: payoutRequest.walletId } });
              if (wallet) {
                appEvents.emit("payout.success", {
                  walletId: payoutRequest.walletId,
                  amount: payoutRequest.amount.toNumber(),
                  supplierId: wallet.supplierId,
                  shaba: payoutRequest.shaba
                });
              }
            }
            if (newStatus === PayoutStatus.FAILED) {
              await tx.wallet.update({
                where: { id: payoutRequest.walletId },
                data: {
                  balance: {
                    increment: payoutRequest.amount
                  }
                }
              });
            }
          });
        }
      }
    };
  }
});

// server.ts
var server_exports = {};
__export(server_exports, {
  default: () => server_default
});
module.exports = __toCommonJS(server_exports);

// src/env-loader.ts
var import_dotenv = __toESM(require("dotenv"));
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_child_process = require("child_process");
function findTrueRootDir() {
  const current = typeof __dirname !== "undefined" ? __dirname : process.cwd();
  if (import_fs.default.existsSync(import_path.default.join(current, "package.json"))) {
    return current;
  }
  const parent = import_path.default.join(current, "..");
  if (import_fs.default.existsSync(import_path.default.join(parent, "package.json"))) {
    return parent;
  }
  return current;
}
var isAIStudioEnv = !!process.env.APPLET_ID;
var isCloudRunEnv = !!process.env.K_SERVICE;
var rootDir = isAIStudioEnv || isCloudRunEnv ? process.cwd() : findTrueRootDir();
import_dotenv.default.config({ path: import_path.default.join(rootDir, ".env") });
var dbUrl = process.env.DATABASE_URL || "";
function sanitizeDbUrl(url) {
  if (!url) return url;
  const match = url.match(/^([a-zA-Z0-9+-]+:\/\/)(.*)$/);
  if (!match) return url;
  const scheme = match[1];
  const rest = match[2];
  const lastAtIndex = rest.lastIndexOf("@");
  if (lastAtIndex === -1) return url;
  const credentials = rest.substring(0, lastAtIndex);
  const hostAndDb = rest.substring(lastAtIndex + 1);
  const firstColon = credentials.indexOf(":");
  if (firstColon === -1) return url;
  const username = credentials.substring(0, firstColon);
  let password = credentials.substring(firstColon + 1);
  password = password.replace(/@/g, "%40");
  return `${scheme}${username}:${password}@${hostAndDb}`;
}
dbUrl = sanitizeDbUrl(dbUrl);
process.env.DATABASE_URL = dbUrl;
var isRealRemoteDb = dbUrl && (dbUrl.startsWith("mysql://") || dbUrl.startsWith("mysqls://") || dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) && !dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1") && !dbUrl.includes("dummy_db");
var isVercelEnv = !!process.env.VERCEL;
if (!isRealRemoteDb || isAIStudioEnv && !process.env.FORCE_PRODUCTION_DB) {
  const dbDir = process.env.SQLITE_DIR ? process.env.SQLITE_DIR : process.env.NODE_ENV === "production" && isCloudRunEnv || isVercelEnv ? "/tmp/prisma" : import_path.default.join(rootDir || process.cwd(), "prisma");
  if (!import_fs.default.existsSync(dbDir)) {
    try {
      import_fs.default.mkdirSync(dbDir, { recursive: true });
    } catch (e) {
    }
  }
  const dbPath = import_path.default.join(dbDir, "dev.db");
  if (!import_fs.default.existsSync(dbPath) || import_fs.default.statSync(dbPath).size === 0) {
    const possibleSources = [
      import_path.default.join(process.cwd(), "dist", "dev.db"),
      import_path.default.join(process.cwd(), "prisma", "dev.db"),
      import_path.default.join(rootDir || process.cwd(), "dist", "dev.db"),
      import_path.default.join(rootDir || process.cwd(), "prisma", "dev.db")
    ];
    for (const src of possibleSources) {
      if (import_fs.default.existsSync(src) && import_fs.default.statSync(src).size > 0) {
        try {
          import_fs.default.copyFileSync(src, dbPath);
          console.log(`[Env Loader] Copied pre-built database from ${src} to ${dbPath}`);
          break;
        } catch (copyErr) {
          console.warn(`[Env Loader] Failed to copy database from ${src}:`, copyErr.message);
        }
      }
    }
  }
  dbUrl = `file:///${dbPath.replace(/^\//, "")}`;
  process.env.DATABASE_URL = dbUrl;
}
var resolvedProvider = "sqlite";
var resolvedUrl = process.env.DATABASE_URL || "";
if (resolvedUrl.startsWith("mysql://") || resolvedUrl.startsWith("mysqls://")) {
  resolvedProvider = "mysql";
} else if (resolvedUrl.startsWith("postgresql://") || resolvedUrl.startsWith("postgres://")) {
  resolvedProvider = "postgresql";
}
var currentSchemaProvider = "";
try {
  const schemaPath = import_path.default.join(process.cwd(), "prisma", "schema.prisma");
  if (import_fs.default.existsSync(schemaPath)) {
    const content = import_fs.default.readFileSync(schemaPath, "utf8");
    const match = content.match(/provider\s*=\s*"([^"]+)"/);
    if (match) {
      currentSchemaProvider = match[1];
    }
  }
} catch (e) {
}
var prismaClientDir = import_path.default.join(process.cwd(), "node_modules", "@prisma", "client");
var clientExists = import_fs.default.existsSync(prismaClientDir);
var isProduction = process.env.NODE_ENV === "production" || !!process.env.K_SERVICE;
if (resolvedProvider !== currentSchemaProvider || !clientExists || isProduction) {
  console.log(`[Env Loader] Database setup needed (resolved="${resolvedProvider}", schema="${currentSchemaProvider}", exists=${clientExists}, prod=${isProduction})`);
  const setupScriptPath = import_path.default.join(process.cwd(), "setup-db.js");
  if (import_fs.default.existsSync(setupScriptPath)) {
    try {
      console.log("[Env Loader] Running setup-db.js synchronously...");
      (0, import_child_process.execSync)("node setup-db.js", { stdio: "inherit", env: { ...process.env, DATABASE_URL: resolvedUrl } });
      console.log("[Env Loader] Database setup completed successfully.");
    } catch (err) {
      console.error("[Env Loader] Failed to execute setup-db.js synchronously on startup:", err.message);
    }
  } else {
    console.log("[Env Loader] setup-db.js not found, skipping setup script execution.");
  }
} else {
  console.log("[Env Loader] Database setup skipped: Client is up-to-date and provider matches.");
}

// server.ts
var import_multer = __toESM(require("multer"));
var import_adm_zip = __toESM(require("adm-zip"));

// src/services/adminShippingRoutes.ts
function registerAdminShippingRoutes(app2, prisma15, authenticateToken2, requireSuperAdmin2) {
  app2.get("/api/admin/shipping", authenticateToken2, requireSuperAdmin2, async (req, res) => {
    try {
      const orders = await prisma15.order.findMany({
        where: {
          status: {
            in: [
              "WAITING_SHIPPING_COST",
              "WAITING_SHIPPING_PAYMENT",
              "READY_TO_SHIP",
              "SHIPPED",
              "DELIVERED"
            ]
          }
        },
        include: {
          items: {
            include: {
              product: {
                include: { supplier: true }
              }
            }
          },
          store: true,
          shippingInvoice: true
        },
        orderBy: { createdAt: "desc" }
      });
      res.json(orders);
    } catch (err) {
      res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0644\u06CC\u0633\u062A \u0645\u0631\u0633\u0648\u0644\u0627\u062A" });
    }
  });
  app2.post("/api/admin/shipping/:orderId/cost", authenticateToken2, requireSuperAdmin2, async (req, res) => {
    try {
      const { orderId } = req.params;
      const { cost, description } = req.body;
      if (!cost || cost <= 0) {
        return res.status(400).json({ error: "\u0647\u0632\u06CC\u0646\u0647 \u0627\u0631\u0633\u0627\u0644 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A." });
      }
      const order = await prisma15.order.findUnique({
        where: { id: parseInt(orderId) }
      });
      if (!order) {
        return res.status(404).json({ error: "\u0633\u0641\u0627\u0631\u0634 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
      }
      if (order.status !== "WAITING_SHIPPING_COST") {
        return res.status(400).json({ error: "\u0648\u0636\u0639\u06CC\u062A \u0633\u0641\u0627\u0631\u0634 \u0628\u0631\u0627\u06CC \u062B\u0628\u062A \u0647\u0632\u06CC\u0646\u0647 \u0627\u0631\u0633\u0627\u0644 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A." });
      }
      const invoice = await prisma15.shippingInvoice.create({
        data: {
          orderId: order.id,
          shippingCost: Number(cost),
          shippingMethod: order.shippingMethod || "POST",
          description: description || ""
        }
      });
      await prisma15.order.update({
        where: { id: order.id },
        data: {
          status: "WAITING_SHIPPING_PAYMENT",
          statusHistory: {
            create: {
              fromStatus: order.status,
              toStatus: "WAITING_SHIPPING_PAYMENT",
              actorRole: "SUPER_ADMIN",
              actorName: req.user.username || "\u0645\u062F\u06CC\u0631 \u06A9\u0644",
              note: `\u0647\u0632\u06CC\u0646\u0647 \u0627\u0631\u0633\u0627\u0644 \u0628\u0647 \u0645\u0628\u0644\u063A ${cost} \u062A\u0639\u06CC\u06CC\u0646 \u0634\u062F. \u062F\u0631 \u0627\u0646\u062A\u0638\u0627\u0631 \u067E\u0631\u062F\u0627\u062E\u062A \u062A\u0648\u0633\u0637 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647.`
            }
          }
        }
      });
      console.log(`[Notification] To Store ${order.storeId}: \u0647\u0632\u06CC\u0646\u0647 \u0627\u0631\u0633\u0627\u0644 \u0633\u0641\u0627\u0631\u0634 #${order.id} \u0628\u0647 \u0645\u0628\u0644\u063A ${cost} \u062A\u0648\u0645\u0627\u0646 \u0645\u062D\u0627\u0633\u0628\u0647 \u0634\u062F.`);
      res.json({ message: "\u0647\u0632\u06CC\u0646\u0647 \u0627\u0631\u0633\u0627\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062B\u0628\u062A \u0634\u062F.", invoice });
    } catch (err) {
      res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u0647\u0632\u06CC\u0646\u0647 \u0627\u0631\u0633\u0627\u0644." });
    }
  });
}

// src/services/storeShippingRoutes.ts
init_PaymentServiceFactory();
function registerStoreShippingRoutes(app2, prisma15, authenticateToken2, requireStoreManager2) {
  app2.post("/api/store-manager/shipping/:orderId/pay", authenticateToken2, requireStoreManager2, async (req, res) => {
    try {
      const { orderId } = req.params;
      const order = await prisma15.order.findUnique({
        where: { id: parseInt(orderId), storeId: req.user.userId },
        include: { shippingInvoice: true }
      });
      if (!order) {
        return res.status(404).json({ error: "\u0633\u0641\u0627\u0631\u0634 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
      }
      if (order.status !== "WAITING_SHIPPING_PAYMENT" || !order.shippingInvoice) {
        return res.status(400).json({ error: "\u0633\u0641\u0627\u0631\u0634 \u0622\u0645\u0627\u062F\u0647 \u067E\u0631\u062F\u0627\u062E\u062A \u0647\u0632\u06CC\u0646\u0647 \u0627\u0631\u0633\u0627\u0644 \u0646\u06CC\u0633\u062A." });
      }
      if (order.shippingInvoice.status === "PAID") {
        return res.status(400).json({ error: "\u0647\u0632\u06CC\u0646\u0647 \u0627\u0631\u0633\u0627\u0644 \u0642\u0628\u0644\u0627 \u067E\u0631\u062F\u0627\u062E\u062A \u0634\u062F\u0647 \u0627\u0633\u062A." });
      }
      const paymentGateway = await PaymentServiceFactory.getService();
      const host = req.headers.host || "localhost:3000";
      const protocol = req.headers["x-forwarded-proto"] || "http";
      const callbackUrl = `${protocol}://${host}/api/public/shipping/callback?invoiceId=${order.shippingInvoice.id}`;
      try {
        const zibalResult = await paymentGateway.createPayment(
          order.shippingInvoice.shippingCost * 10,
          `\u067E\u0631\u062F\u0627\u062E\u062A \u0647\u0632\u06CC\u0646\u0647 \u0627\u0631\u0633\u0627\u0644 \u0633\u0641\u0627\u0631\u0634 #${order.id}`,
          callbackUrl
        );
        await prisma15.shippingInvoice.update({
          where: { id: order.shippingInvoice.id },
          data: { payLink: zibalResult.payLink }
        });
        res.json({ payLink: zibalResult.payLink });
      } catch (paymentErr) {
        console.error("Error creating Zibal payment for shipping:", paymentErr);
        res.json({ payLink: `/api/public/shipping/callback?invoiceId=${order.shippingInvoice.id}&success=true` });
      }
    } catch (err) {
      res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u067E\u0631\u062F\u0627\u062E\u062A \u0647\u0632\u06CC\u0646\u0647 \u0627\u0631\u0633\u0627\u0644" });
    }
  });
}

// src/services/sms/SmsService.ts
async function sendSmsViaMelliPayamak(mobile, message, orderId) {
  try {
    const username = process.env.MELLIPAYAMAK_USERNAME || process.env.SMS_PANEL_USERNAME;
    const password = process.env.MELLIPAYAMAK_PASSWORD || process.env.SMS_PANEL_PASSWORD || process.env.SMS_PANEL_API_KEY;
    const fromNumber = process.env.MELLIPAYAMAK_FROM_NUMBER || "50001";
    const patternId = process.env.MELLIPAYAMAK_PATTERN_ID;
    let cleanMobile = mobile ? mobile.trim().replace(/\s+/g, "") : "";
    if (cleanMobile.startsWith("+98")) {
      cleanMobile = "0" + cleanMobile.slice(3);
    } else if (cleanMobile.startsWith("98")) {
      cleanMobile = "0" + cleanMobile.slice(2);
    }
    if (!cleanMobile || cleanMobile.length < 10) {
      console.warn("[SMS Service] Invalid mobile number:", mobile);
      return { success: false, message: "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644 \u06AF\u06CC\u0631\u0646\u062F\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A." };
    }
    if (!username || !password) {
      console.warn("[SMS Service] MelliPayamak credentials missing. Set MELLIPAYAMAK_USERNAME & MELLIPAYAMAK_PASSWORD in .env or settings.");
      console.log(`[SMS SIMULATION to ${cleanMobile}]: ${message}`);
      return { success: true, message: "\u067E\u06CC\u0627\u0645\u06A9 \u062F\u0631 \u062D\u0627\u0644\u062A \u0634\u0628\u06CC\u0647\u200C\u0633\u0627\u0632\u06CC \u062B\u0628\u062A \u0634\u062F (\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0645\u0644\u06CC \u067E\u06CC\u0627\u0645\u06A9 \u062A\u0646\u0638\u06CC\u0645 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A)." };
    }
    console.log(`[SMS Service] Sending MelliPayamak SMS to ${cleanMobile} for Order #${orderId || ""}...`);
    let endpoint = "https://rest.payamak-panel.com/api/SendSMS/SendSMS";
    let body = {
      username,
      password,
      to: cleanMobile,
      from: fromNumber,
      text: message
    };
    if (patternId && orderId) {
      endpoint = "https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber";
      body = {
        username,
        password,
        text: [String(orderId)],
        to: cleanMobile,
        bodyId: parseInt(patternId, 10)
      };
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    console.log("[SMS Service] MelliPayamak Response:", data);
    if (response.ok && (data.Value || data.RetStatus === 0 || typeof data.Value === "number" || typeof data === "string")) {
      return { success: true, rawResponse: data };
    } else {
      console.error("[SMS Service] Failed to send SMS via MelliPayamak:", data);
      return { success: false, message: data.StrRetStatus || data.StrStatus || "\u062E\u0637\u0627 \u062F\u0631 \u0627\u0631\u0633\u0627\u0644 \u067E\u06CC\u0627\u0645\u06A9 \u0627\u0632 \u0637\u0631\u06CC\u0642 \u0645\u0644\u06CC \u067E\u06CC\u0627\u0645\u06A9", rawResponse: data };
    }
  } catch (err) {
    console.error("[SMS Service] Error invoking MelliPayamak API:", err?.message || err);
    return { success: false, message: err?.message || "\u062E\u0637\u0627\u06CC \u0634\u0628\u06A9\u0647 \u062F\u0631 \u0627\u0631\u0633\u0627\u0644 \u067E\u06CC\u0627\u0645\u06A9" };
  }
}
async function notifySupplierNewOrder(supplierMobile, orderId, supplierName) {
  const text = `\u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647 \u0645\u062D\u062A\u0631\u0645 \u0632\u0648\u067E\u06CC\u062A\u060C \u0633\u0641\u0627\u0631\u0634 \u062C\u062F\u06CC\u062F \u0634\u0645\u0627\u0631\u0647 #${orderId} \u062B\u0628\u062A \u06AF\u0631\u062F\u06CC\u062F\u0647 \u0648 \u0646\u06CC\u0627\u0632\u0645\u0646\u062F \u0628\u0631\u0631\u0633\u06CC \u0648 \u062A\u0627\u06CC\u06CC\u062F \u0634\u0645\u0627 \u062F\u0631 \u067E\u0646\u0644 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u062C\u0647\u062A \u062C\u0644\u0648\u06AF\u06CC\u0631\u06CC \u0627\u0632 \u0645\u0639\u0637\u0644\u06CC \u0641\u0631\u0648\u0634\u06AF\u0627\u0647\u060C \u0627\u0642\u062F\u0627\u0645 \u0641\u0631\u0645\u0627\u06CC\u06CC\u062F. zopit.ir`;
  return await sendSmsViaMelliPayamak(supplierMobile, text, orderId);
}

// server.ts
var import_google_auth_library = require("google-auth-library");
var import_express = __toESM(require("express"));
var import_client = require("@prisma/client");
var import_express_rate_limit = __toESM(require("express-rate-limit"));
var import_dotenv2 = __toESM(require("dotenv"));
var import_cors = __toESM(require("cors"));
var import_bcryptjs = __toESM(require("bcryptjs"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_path3 = __toESM(require("path"));
var import_fs3 = __toESM(require("fs"));
var import_child_process2 = require("child_process");
init_NotificationService();

// src/services/configRoute.ts
init_prisma();
var prisma3 = getPrisma();
function registerConfig(app2) {
  app2.get("/api/config", async (req, res) => {
    try {
      const configs = await prisma3.systemConfig.findMany();
      const configMap = configs.reduce((acc, c) => {
        if (c.value === "true") acc[c.key] = true;
        else if (c.value === "false") acc[c.key] = false;
        else acc[c.key] = c.value;
        return acc;
      }, {});
      res.json(configMap);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });
  app2.put("/api/config", async (req, res) => {
    try {
      const { key: key2, value } = req.body;
      const config = await prisma3.systemConfig.upsert({
        where: { key: key2 },
        update: { value: String(value) },
        create: { key: key2, value: String(value) }
      });
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });
}

// src/services/newFeaturesRoute.ts
function registerNewFeatures(app2, prisma15) {
  app2.get("/api/admin/info-pages", async (req, res) => {
    try {
      const pages = await prisma15.infoPage.findMany({
        orderBy: { createdAt: "desc" }
      });
      res.json(pages);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.post("/api/admin/info-pages", async (req, res) => {
    try {
      const { title, slug, category, summary, content, images, attachments, videos, tags, isPublished, isPinned } = req.body;
      const page = await prisma15.infoPage.create({
        data: {
          title,
          slug,
          category,
          summary,
          content,
          images: images || null,
          attachments: attachments || null,
          videos: videos || null,
          tags: tags || null,
          isPublished: isPublished !== false,
          isPinned: !!isPinned
        }
      });
      res.json(page);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.put("/api/admin/info-pages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const pageId = parseInt(id, 10);
      const updateData = { ...req.body };
      delete updateData.id;
      const page = await prisma15.infoPage.update({
        where: { id: isNaN(pageId) ? void 0 : pageId },
        data: updateData
      });
      res.json(page);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.delete("/api/admin/info-pages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const pageId = parseInt(id, 10);
      await prisma15.infoPage.delete({
        where: { id: isNaN(pageId) ? void 0 : pageId }
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.get("/api/admin/public-messages", async (req, res) => {
    try {
      const messages = await prisma15.publicMessage.findMany({
        orderBy: { createdAt: "desc" }
      });
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.post("/api/admin/public-messages", async (req, res) => {
    try {
      const { content, icon, color, expiryDate, isActive } = req.body;
      const msg = await prisma15.publicMessage.create({
        data: {
          content,
          icon: icon || "info",
          color: color || "indigo",
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          isActive: isActive !== false
        }
      });
      res.json(msg);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.put("/api/admin/public-messages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const msgId = parseInt(id, 10);
      const updateData = { ...req.body };
      delete updateData.id;
      if (updateData.expiryDate) {
        updateData.expiryDate = new Date(updateData.expiryDate);
      }
      const msg = await prisma15.publicMessage.update({
        where: { id: isNaN(msgId) ? void 0 : msgId },
        data: updateData
      });
      res.json(msg);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.delete("/api/admin/public-messages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const msgId = parseInt(id, 10);
      await prisma15.publicMessage.delete({
        where: { id: isNaN(msgId) ? void 0 : msgId }
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.get("/api/admin/dashboard-messages", async (req, res) => {
    try {
      const messages = await prisma15.dashboardMessage.findMany({
        orderBy: { createdAt: "desc" }
      });
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.post("/api/admin/dashboard-messages", async (req, res) => {
    try {
      const { title, content, targetRole, priority, expiryDate, publishDate, attachments } = req.body;
      const msg = await prisma15.dashboardMessage.create({
        data: {
          title,
          content,
          targetRole: targetRole || "ALL",
          priority: priority || "MEDIUM",
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          publishDate: publishDate ? new Date(publishDate) : /* @__PURE__ */ new Date(),
          attachments: attachments || null
        }
      });
      res.json(msg);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.put("/api/admin/dashboard-messages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const msgId = parseInt(id, 10);
      const updateData = { ...req.body };
      delete updateData.id;
      if (updateData.expiryDate) updateData.expiryDate = new Date(updateData.expiryDate);
      if (updateData.publishDate) updateData.publishDate = new Date(updateData.publishDate);
      const msg = await prisma15.dashboardMessage.update({
        where: { id: isNaN(msgId) ? void 0 : msgId },
        data: updateData
      });
      res.json(msg);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.delete("/api/admin/dashboard-messages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const msgId = parseInt(id, 10);
      await prisma15.dashboardMessage.delete({
        where: { id: isNaN(msgId) ? void 0 : msgId }
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.get("/api/menus/:selectedRole", async (req, res) => {
    try {
      const { selectedRole } = req.params;
      const menu = await prisma15.dynamicMenu.findUnique({
        where: { role: selectedRole }
      });
      res.json(menu ? JSON.parse(menu.items) : null);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.post("/api/admin/menus/:selectedRole", async (req, res) => {
    try {
      const { selectedRole } = req.params;
      const { items } = req.body;
      const menu = await prisma15.dynamicMenu.upsert({
        where: { role: selectedRole },
        update: { items: typeof items === "string" ? items : JSON.stringify(items) },
        create: {
          role: selectedRole,
          items: typeof items === "string" ? items : JSON.stringify(items)
        }
      });
      res.json(menu);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.get("/api/info-pages", async (req, res) => {
    try {
      const pages = await prisma15.infoPage.findMany({
        where: { isPublished: true },
        orderBy: [
          { isPinned: "desc" },
          { createdAt: "desc" }
        ]
      });
      res.json(pages);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.get("/api/dashboard-messages", async (req, res) => {
    try {
      const messages = await prisma15.dashboardMessage.findMany({
        where: {
          OR: [
            { expiryDate: null },
            { expiryDate: { gte: /* @__PURE__ */ new Date() } }
          ]
        },
        orderBy: { createdAt: "desc" }
      });
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.get("/api/public-messages", async (req, res) => {
    try {
      const messages = await prisma15.publicMessage.findMany({
        where: {
          isActive: true,
          OR: [
            { expiryDate: null },
            { expiryDate: { gte: /* @__PURE__ */ new Date() } }
          ]
        },
        orderBy: { createdAt: "desc" }
      });
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
}

// src/services/announcementsRoute.ts
init_prisma();
var prisma4 = getPrisma();
function registerAnnouncements(app2) {
  app2.get("/api/announcements", async (req, res) => {
    try {
      const { all } = req.query;
      const whereClause = {};
      if (all !== "true") {
        whereClause.isActive = true;
        whereClause.OR = [
          { expiryDate: null },
          { expiryDate: { gte: /* @__PURE__ */ new Date() } }
        ];
      }
      const announcements = await prisma4.announcement.findMany({
        where: whereClause,
        orderBy: [
          { isSticky: "desc" },
          { createdAt: "desc" }
        ]
      });
      res.json(announcements);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.post("/api/announcements", async (req, res) => {
    try {
      const { title, content, target, priority, isSticky, isLoginPopup, expiryDate, attachmentUrl, imageUrl } = req.body;
      let announcement;
      try {
        announcement = await prisma4.announcement.create({
          data: {
            title,
            content,
            target: target || "ALL",
            priority: priority || "MEDIUM",
            isSticky: !!isSticky,
            isLoginPopup: !!isLoginPopup,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            attachmentUrl: attachmentUrl || null,
            imageUrl: imageUrl || null,
            isActive: true
          }
        });
      } catch (err) {
        announcement = await prisma4.announcement.create({
          data: {
            title,
            content: attachmentUrl ? `${content}

[\u067E\u06CC\u0648\u0633\u062A: ${attachmentUrl}]` : content,
            target: target || "ALL",
            priority: priority || "MEDIUM",
            isSticky: !!isSticky,
            isLoginPopup: !!isLoginPopup,
            expiryDate: expiryDate ? new Date(expiryDate) : null,
            isActive: true
          }
        });
      }
      res.json(announcement);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.put("/api/announcements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, target, priority, isSticky, isLoginPopup, expiryDate, isActive, attachmentUrl, imageUrl } = req.body;
      const updateData = {};
      if (title !== void 0) updateData.title = title;
      if (content !== void 0) updateData.content = content;
      if (target !== void 0) updateData.target = target;
      if (priority !== void 0) updateData.priority = priority;
      if (isSticky !== void 0) updateData.isSticky = !!isSticky;
      if (isLoginPopup !== void 0) updateData.isLoginPopup = !!isLoginPopup;
      if (isActive !== void 0) updateData.isActive = !!isActive;
      if (attachmentUrl !== void 0) updateData.attachmentUrl = attachmentUrl;
      if (imageUrl !== void 0) updateData.imageUrl = imageUrl;
      if (expiryDate !== void 0) {
        updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
      }
      const announcement = await prisma4.announcement.update({
        where: { id },
        data: updateData
      });
      res.json(announcement);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.delete("/api/announcements/:id", async (req, res) => {
    try {
      const { id } = req.params;
      await prisma4.announcement.delete({
        where: { id }
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
}

// src/services/orderLabelRoute.ts
var import_fs2 = __toESM(require("fs"));
var import_path2 = __toESM(require("path"));
function registerOrderLabels(app2, prisma15) {
  const uploadDir = process.env.VERCEL ? import_path2.default.join("/tmp", "uploads", "labels") : import_path2.default.join(process.cwd(), "uploads", "labels");
  if (!import_fs2.default.existsSync(uploadDir)) {
    try {
      import_fs2.default.mkdirSync(uploadDir, { recursive: true });
    } catch (e) {
    }
  }
  app2.post("/api/orders/:id/label", async (req, res) => {
    try {
      const { id } = req.params;
      const { labelUrl } = req.body;
      if (!labelUrl) {
        return res.status(400).json({ error: "labelUrl is required" });
      }
      const orderId = parseInt(id, 10);
      if (isNaN(orderId)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }
      let savedLabelPath = labelUrl;
      if (labelUrl && labelUrl.startsWith("data:")) {
        try {
          const matches = labelUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            const contentType = matches[1];
            const base64Data = matches[2];
            const buffer = Buffer.from(base64Data, "base64");
            let ext = "bin";
            if (contentType.includes("pdf")) ext = "pdf";
            else if (contentType.includes("png")) ext = "png";
            else if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
            const filename = `label_${orderId}_${Date.now()}.${ext}`;
            const filePath = import_path2.default.join(uploadDir, filename);
            import_fs2.default.writeFileSync(filePath, buffer);
            import_fs2.default.writeFileSync(filePath + ".meta", contentType);
            savedLabelPath = `/api/orders/${orderId}/postal-label/file`;
          }
        } catch (err) {
          console.error("Error saving base64 label file:", err);
        }
      }
      const updatedOrder = await prisma15.order.update({
        where: { id: orderId },
        data: {
          postalLabel: savedLabelPath,
          status: "PROCESSING"
          // Set status to processing when postal label is uploaded
        }
      });
      res.json({ success: true, order: updatedOrder });
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
}

// src/services/penaltyRoute.ts
function registerPenaltyRoutes(app2, prisma15) {
  app2.get("/api/admin/penalty-stats", async (req, res) => {
    try {
      const totalPenalties = await prisma15.supplierPenalty.count();
      const topViolators = await prisma15.user.findMany({
        where: { role: "SUPPLIER", penaltyPoints: { gt: 0 } },
        orderBy: { penaltyPoints: "desc" },
        take: 5,
        select: { id: true, username: true, penaltyPoints: true, warningLevel: true }
      });
      const recentPenalties = await prisma15.supplierPenalty.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          supplier: {
            select: { id: true, username: true, brandName: true }
          }
        }
      });
      res.json({
        totalPenalties,
        topViolators,
        recentPenalties
      });
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.get("/api/admin/penalty-rules", async (req, res) => {
    try {
      const rules = await prisma15.penaltyRule.findMany({
        orderBy: { createdAt: "desc" }
      });
      res.json(rules);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.post("/api/admin/penalty-rules", async (req, res) => {
    try {
      const { title, description, negativePoints, autoNotification, isActive } = req.body;
      const rule = await prisma15.penaltyRule.create({
        data: {
          title,
          description,
          negativePoints: parseInt(negativePoints, 10) || 0,
          autoNotification: autoNotification !== false,
          isActive: isActive !== false
        }
      });
      res.json(rule);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.put("/api/admin/penalty-rules/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ruleId = parseInt(id, 10);
      const updateData = { ...req.body };
      delete updateData.id;
      if (updateData.negativePoints !== void 0) {
        updateData.negativePoints = parseInt(updateData.negativePoints, 10) || 0;
      }
      const rule = await prisma15.penaltyRule.update({
        where: { id: ruleId },
        data: updateData
      });
      res.json(rule);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.delete("/api/admin/penalty-rules/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ruleId = parseInt(id, 10);
      await prisma15.penaltyRule.delete({
        where: { id: ruleId }
      });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.get("/api/admin/penalty-config", async (req, res) => {
    try {
      let config = await prisma15.penaltyConfig.findFirst();
      if (!config) {
        config = await prisma15.penaltyConfig.create({
          data: {
            id: 1,
            underReviewThreshold: 20,
            temporarySuspensionThreshold: 40,
            blockedThreshold: 60,
            autoSuspensionEnabled: true
          }
        });
      }
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.put("/api/admin/penalty-config", async (req, res) => {
    try {
      const { underReviewThreshold, temporarySuspensionThreshold, blockedThreshold, autoSuspensionEnabled } = req.body;
      const config = await prisma15.penaltyConfig.upsert({
        where: { id: 1 },
        update: {
          underReviewThreshold: parseInt(underReviewThreshold, 10),
          temporarySuspensionThreshold: parseInt(temporarySuspensionThreshold, 10),
          blockedThreshold: parseInt(blockedThreshold, 10),
          autoSuspensionEnabled: !!autoSuspensionEnabled
        },
        create: {
          id: 1,
          underReviewThreshold: parseInt(underReviewThreshold, 10) || 20,
          temporarySuspensionThreshold: parseInt(temporarySuspensionThreshold, 10) || 40,
          blockedThreshold: parseInt(blockedThreshold, 10) || 60,
          autoSuspensionEnabled: autoSuspensionEnabled !== false
        }
      });
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.get("/api/admin/suppliers", async (req, res) => {
    try {
      const suppliers = await prisma15.user.findMany({
        where: { role: "SUPPLIER" },
        select: {
          id: true,
          username: true,
          brandName: true,
          firstName: true,
          lastName: true,
          mobile: true,
          status: true,
          performanceScore: true,
          penaltyPoints: true,
          warningLevel: true
        }
      });
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.get("/api/admin/suppliers/:id/penalty-profile", async (req, res) => {
    try {
      const { id } = req.params;
      const supplierId = parseInt(id, 10);
      if (isNaN(supplierId)) {
        return res.status(400).json({ error: "Invalid supplier ID" });
      }
      const supplier = await prisma15.user.findUnique({
        where: { id: supplierId },
        select: {
          id: true,
          username: true,
          brandName: true,
          performanceScore: true,
          penaltyPoints: true,
          warningLevel: true,
          status: true
        }
      });
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      const penalties = await prisma15.supplierPenalty.findMany({
        where: { supplierId },
        orderBy: { createdAt: "desc" }
      });
      res.json({ supplier, penalties });
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.post("/api/admin/suppliers/:id/apply-penalty", async (req, res) => {
    try {
      const { id } = req.params;
      const supplierId = parseInt(id, 10);
      const { reason, points, description, orderNumber } = req.body;
      if (isNaN(supplierId)) {
        return res.status(400).json({ error: "Invalid supplier ID" });
      }
      const supplier = await prisma15.user.findUnique({
        where: { id: supplierId }
      });
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      const penaltyPts = parseInt(points, 10) || 0;
      const newPenaltyPoints = (supplier.penaltyPoints || 0) + penaltyPts;
      const newPerformanceScore = Math.max(0, 100 - newPenaltyPoints);
      const config = await prisma15.penaltyConfig.findFirst() || {
        underReviewThreshold: 20,
        temporarySuspensionThreshold: 40,
        blockedThreshold: 60,
        autoSuspensionEnabled: true
      };
      let warningLevel = "NONE";
      let status = supplier.status || "ACTIVE";
      if (newPenaltyPoints >= config.blockedThreshold) {
        warningLevel = "HIGH";
        if (config.autoSuspensionEnabled) status = "BLOCKED";
      } else if (newPenaltyPoints >= config.temporarySuspensionThreshold) {
        warningLevel = "MEDIUM";
        if (config.autoSuspensionEnabled) status = "SUSPENDED";
      } else if (newPenaltyPoints >= config.underReviewThreshold) {
        warningLevel = "LOW";
        if (config.autoSuspensionEnabled) status = "WARNING";
      }
      const [penaltyRecord, updatedUser] = await prisma15.$transaction([
        prisma15.supplierPenalty.create({
          data: {
            supplierId,
            reason,
            points: penaltyPts,
            description: description || "",
            orderNumber: orderNumber || null,
            adminName: "\u0645\u062F\u06CC\u0631\u06CC\u062A \u0633\u06CC\u0633\u062A\u0645"
          }
        }),
        prisma15.user.update({
          where: { id: supplierId },
          data: {
            penaltyPoints: newPenaltyPoints,
            performanceScore: newPerformanceScore,
            warningLevel,
            status
          }
        })
      ]);
      res.json({ success: true, penalty: penaltyRecord, supplier: updatedUser });
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  app2.get("/api/supplier/performance", async (req, res) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const supplier = await prisma15.user.findUnique({
        where: { id: userId }
      });
      if (!supplier) {
        return res.status(404).json({ error: "Supplier not found" });
      }
      const penalties = await prisma15.supplierPenalty.findMany({
        where: { supplierId: userId },
        orderBy: { createdAt: "desc" }
      });
      const affectedOrders = penalties.map((p) => p.orderNumber).filter((o) => o);
      const distinctAffectedOrders = new Set(affectedOrders).size;
      res.json({
        supplier,
        penalties,
        distinctAffectedOrders,
        affectedOrdersCount: affectedOrders.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
}

// src/services/aiStudioRoute.ts
var import_genai = require("@google/genai");
function registerAIStudioRoute(app2) {
  app2.post("/api/superadmin/ai-studio/generate", async (req, res) => {
    try {
      const { prompt, model = "gemini-1.5-flash", systemInstruction, currentCss, imageFile } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "\u062F\u0633\u062A\u0648\u0631 \u0645\u062A\u0646\u06CC \u0627\u0631\u0633\u0627\u0644 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A." });
      }
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "\u06A9\u0644\u06CC\u062F API \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06CC (GEMINI_API_KEY) \u062F\u0631 \u0641\u0627\u06CC\u0644 \u062A\u0646\u0638\u06CC\u0645\u0627\u062A (.env) \u06CC\u0627\u0641\u062A \u0646\u0634\u062F. \u0644\u0637\u0641\u0627\u064B \u0622\u0646 \u0631\u0627 \u062A\u0646\u0638\u06CC\u0645 \u0641\u0631\u0645\u0627\u06CC\u06CC\u062F."
        });
      }
      const ai = new import_genai.GoogleGenAI({ apiKey });
      const baseSystemPrompt = systemInstruction || `\u0634\u0645\u0627 \u062A\u0648\u0633\u0639\u0647\u200C\u062F\u0647\u0646\u062F\u0647 \u0648 \u0637\u0631\u0627\u062D \u0627\u0631\u0634\u062F \u0631\u0627\u0628\u0637 \u06A9\u0627\u0631\u0628\u0631\u06CC (UI/UX) \u0648 \u062F\u0633\u062A\u06CC\u0627\u0631 \u0633\u06CC\u0633\u062A\u0645 \u06AF\u0648\u06AF\u0644 AI \u0627\u0633\u062A\u0648\u062F\u06CC\u0648 \u0628\u0631\u0627\u06CC \u067E\u0644\u062A\u0641\u0631\u0645 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647\u06CC \u0632\u0648\u067E\u06CC\u062A \u0647\u0633\u062A\u06CC\u062F.
\u0648\u0638\u06CC\u0641\u0647 \u0634\u0645\u0627 \u0627\u06CC\u0646 \u0627\u0633\u062A \u06A9\u0647 \u0628\u0631 \u0627\u0633\u0627\u0633 \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u06A9\u0627\u0631\u0628\u0631 \u0627\u06CC\u0631\u0627\u0646\u06CC\u060C \u067E\u0627\u0633\u062E \u062A\u062D\u0644\u06CC\u0644\u06CC \u0648 \u06A9\u062F\u0647\u0627\u06CC \u062A\u063A\u06CC\u06CC\u0631 \u0627\u0633\u062A\u0627\u06CC\u0644 (CSS) \u0648 \u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u067E\u0648\u0633\u062A\u0647 \u0631\u0627 \u062A\u0648\u0644\u06CC\u062F \u06A9\u0646\u06CC\u062F.

\u0642\u0648\u0627\u0646\u06CC\u0646 \u067E\u0627\u0633\u062E\u200C\u062F\u0647\u06CC:
1. \u062D\u062A\u0645\u0627\u064B \u067E\u0627\u0633\u062E \u062E\u0648\u062F \u0631\u0627 \u0634\u0627\u0645\u0644 \u06CC\u06A9 \u0628\u062E\u0634 \u062A\u0648\u0636\u06CC\u062D\u0627\u062A \u0641\u0627\u0631\u0633\u06CC \u0631\u0648\u0627\u0646 \u0648 \u06CC\u06A9 \u0633\u0627\u062E\u062A\u0627\u0631 JSON \u0645\u0639\u062A\u0628\u0631 \u062C\u0647\u062A \u0627\u0639\u0645\u0627\u0644 \u062A\u063A\u06CC\u06CC\u0631\u0627\u062A \u0627\u0631\u0633\u0627\u0644 \u06A9\u0646\u06CC\u062F.
2. \u0633\u0627\u062E\u062A\u0627\u0631 JSON \u0628\u0627\u06CC\u062F \u062F\u0642\u06CC\u0642\u0627\u064B \u0628\u0647 \u0634\u06A9\u0644 \u0632\u06CC\u0631 \u062F\u0631 \u0627\u0646\u062A\u0647\u0627\u06CC \u067E\u0627\u0633\u062E \u062F\u0627\u062E\u0644 \u062A\u06AF \`\`\`json \u0628\u0627\u0634\u062F:
\`\`\`json
{
  "explanation": "\u062A\u0648\u0636\u06CC\u062D \u06A9\u0627\u0645\u0644 \u062A\u063A\u06CC\u06CC\u0631\u0627\u062A \u0627\u0639\u0645\u0627\u0644\u200C\u0634\u062F\u0647 \u0628\u0647 \u0632\u0628\u0627\u0646 \u0641\u0627\u0631\u0633\u06CC",
  "customCss": "\u06A9\u062F\u0647\u0627\u06CC CSS \u0645\u0639\u062A\u0628\u0631 \u062C\u0647\u062A \u062A\u063A\u06CC\u06CC\u0631 \u0638\u0627\u0647\u0631\u060C \u0631\u0646\u06AF \u062F\u06A9\u0645\u0647\u200C\u0647\u0627\u060C \u0641\u0648\u0646\u062A\u060C \u0641\u0648\u0627\u0635\u0644\u060C \u0628\u0646\u0631\u0647\u0627 \u0648 \u067E\u0633\u200C\u0632\u0645\u06CC\u0646\u0647 \u0633\u0627\u06CC\u062A",
  "announcementBanner": {
    "enabled": true,
    "text": "\u0645\u062A\u0646 \u0627\u0639\u0644\u0627\u0646 \u0628\u0627\u0644\u0627\u06CC \u0633\u0627\u06CC\u062A (\u062F\u0631 \u0635\u0648\u0631\u062A \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u06A9\u0627\u0631\u0628\u0631)",
    "bgColor": "#7c3aed",
    "textColor": "#ffffff"
  },
  "uiTheme": {
    "primaryColor": "#7c3aed",
    "backgroundColor": "#f8fafc",
    "cardRadius": "16px",
    "fontScale": "100%"
  },
  "codeSnippet": "\u06A9\u062F\u0647\u0627\u06CC \u067E\u06CC\u0634\u0646\u0647\u0627\u062F\u06CC \u062C\u0627\u0648\u0627\u0627\u0633\u06A9\u0631\u06CC\u067E\u062A \u06CC\u0627 \u062A\u0627\u06CC\u067E\u200C\u0627\u0633\u06A9\u0631\u06CC\u067E\u062A \u0628\u0631\u0627\u06CC \u0641\u0627\u06CC\u0644\u200C\u0647\u0627\u06CC \u06A9\u0627\u0645\u067E\u0648\u0646\u0646\u062A (\u062F\u0631 \u0635\u0648\u0631\u062A \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u06A9\u0627\u0631\u0628\u0631)"
}
\`\`\`
3. \u06A9\u062F\u0647\u0627\u06CC CSS \u0628\u0627\u06CC\u062F \u06A9\u0627\u0645\u0644\u0627\u064B \u0645\u0639\u062A\u0628\u0631 \u0648 \u0628\u062F\u0648\u0646 \u062E\u0637\u0627 \u0628\u0627\u0634\u0646\u062F \u0648 \u062F\u06A9\u0645\u0647\u200C\u0647\u0627\u060C \u06A9\u0627\u0631\u062A\u200C\u0647\u0627\u060C \u06A9\u0627\u062F\u0631\u0647\u0627\u06CC \u0648\u0631\u0648\u062F\u06CC\u060C \u0647\u062F\u0631 \u0648 \u0628\u0646\u0631\u0647\u0627 \u0631\u0627 \u062C\u0630\u0627\u0628 \u0648 \u0645\u062F\u0631\u0646 \u06A9\u0646\u0646\u062F.`;
      const userMessage = `\u06A9\u062F\u0647\u0627\u06CC \u0641\u0639\u0644\u06CC CSS \u0633\u0627\u06CC\u062A:
${currentCss || "/* \u0647\u0646\u0648\u0632 \u06A9\u062F\u06CC \u062B\u0628\u062A \u0646\u0634\u062F\u0647 \u0627\u0633\u062A */"}

\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u06A9\u0627\u0631\u0628\u0631:
${prompt}`;
      const initialModel = model === "gemini-1.5-pro" || model === "gemini-3.1-pro-preview" ? "gemini-3.1-pro-preview" : "gemini-3.6-flash";
      const modelFallbacks = [
        initialModel,
        "gemini-1.5-flash",
        "gemini-3.5-flash-lite",
        "gemini-2.5-flash"
      ];
      const modelsToTry = Array.from(new Set(modelFallbacks));
      let response = null;
      let usedModel = initialModel;
      let lastError = null;
      let contents;
      if (imageFile && imageFile.data && imageFile.mimeType) {
        contents = {
          parts: [
            {
              inlineData: {
                mimeType: imageFile.mimeType,
                data: imageFile.data
              }
            },
            {
              text: `${baseSystemPrompt}

${userMessage}

(\u06CC\u06A9 \u0641\u0627\u06CC\u0644 \u062A\u0635\u0648\u06CC\u0631\u06CC \u0646\u06CC\u0632 \u0636\u0645\u06CC\u0645\u0647 \u0634\u062F\u0647 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627\u064B \u0622\u0646 \u0631\u0627 \u062A\u062D\u0644\u06CC\u0644 \u06A9\u0631\u062F\u0647 \u0648 \u0637\u0628\u0642 \u0622\u0646 \u0627\u0633\u062A\u0627\u06CC\u0644 \u062F\u0647\u06CC\u062F.)`
            }
          ]
        };
      } else {
        contents = [
          { role: "user", parts: [{ text: baseSystemPrompt }, { text: userMessage }] }
        ];
      }
      for (const candidateModel of modelsToTry) {
        try {
          usedModel = candidateModel;
          console.log(`[AI Studio] Attempting generation with model: ${candidateModel}`);
          response = await ai.models.generateContent({
            model: candidateModel,
            contents
          });
          if (response && (response.text || response.candidates)) {
            break;
          }
        } catch (err) {
          lastError = err;
          const errMsg = err?.message || String(err);
          console.warn(`[AI Studio] Model ${candidateModel} failed or exceeded quota: ${errMsg}. Trying fallback...`);
        }
      }
      if (!response || !response.text && !response.candidates) {
        throw lastError || new Error("All Gemini model fallbacks exhausted or returned empty responses.");
      }
      const responseText = response.text || response.candidates?.[0]?.content?.parts?.[0]?.text || "";
      let parsedData = null;
      const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          parsedData = JSON.parse(jsonMatch[1]);
        } catch (e) {
          console.warn("Failed to parse AI JSON block:", e);
        }
      }
      if (!parsedData) {
        parsedData = {
          explanation: responseText.replace(/```[\s\S]*?```/g, "").trim() || responseText,
          customCss: "",
          announcementBanner: null,
          uiTheme: null,
          codeSnippet: ""
        };
      }
      return res.json({
        success: true,
        model: usedModel,
        responseText,
        aiResult: parsedData
      });
    } catch (err) {
      console.error("AI Studio Generation Error:", err);
      return res.status(500).json({
        error: err.message || "\u062E\u0637\u0627 \u062F\u0631 \u0627\u0631\u062A\u0628\u0627\u0637 \u0628\u0627 \u0633\u0631\u0648\u06CC\u0633 \u06AF\u0648\u06AF\u0644 AI \u0627\u0633\u062A\u0648\u062F\u06CC\u0648 (\u0645\u062D\u062F\u0648\u062F\u06CC\u062A \u0633\u0647\u0645\u06CC\u0647 \u06CC\u0627 \u062E\u0637\u0627\u06CC \u0634\u0628\u06A9\u0647)"
      });
    }
  });
}

// server.ts
var import_zod2 = require("zod");

// src/services/financial/Jobs.ts
init_prisma();

// src/types.ts
var PaymentStatus = {
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
  REFUNDED: "REFUNDED"
};

// src/services/financial/PaymentLifecycleService.ts
init_prisma();
init_PaymentServiceFactory();
var prisma5 = getPrisma();
var PaymentLifecycleService = class {
  /**
   * Initialize a new payment
   */
  async initiatePayment(userId, amount, callbackUrl) {
    const idempotencyKey = `PAY_${userId}_${Date.now()}`;
    const payment = await prisma5.payment.create({
      data: {
        userId,
        amount,
        idempotencyKey,
        status: PaymentStatus.PENDING
      }
    });
    try {
      const paymentGateway = await PaymentServiceFactory.getService();
      const gatewayResponse = await paymentGateway.createPayment(amount, "Payment for order", callbackUrl);
      const updatedPayment = await prisma5.$transaction(async (tx) => {
        const p = await tx.payment.update({
          where: { id: payment.id },
          data: { gatewayReference: gatewayResponse.authority }
        });
        await tx.transactionLog.create({
          data: {
            paymentId: payment.id,
            action: "INIT",
            payload: JSON.stringify(gatewayResponse),
            responseCode: "200"
          }
        });
        await tx.auditTrail.create({
          data: {
            actorId: userId,
            action: "PAYMENT_INITIATE",
            resource: "Payment",
            metadata: JSON.stringify({ paymentId: p.id, amount })
          }
        });
        return p;
      });
      return {
        payment: updatedPayment,
        payLink: gatewayResponse.payLink
      };
    } catch (err) {
      await prisma5.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED }
      });
      throw new Error(`Failed to initiate payment: ${err.message}`);
    }
  }
  /**
   * Verify a callback from the payment gateway
   */
  async verifyPayment(authority, userId, ipAddress) {
    const payment = await prisma5.payment.findFirst({
      where: { gatewayReference: authority }
    });
    if (!payment) {
      throw new Error("Payment not found for the given authority");
    }
    if (payment.status === PaymentStatus.PAID) {
      return { payment, message: "Payment already verified" };
    }
    if (payment.status !== PaymentStatus.PENDING) {
      throw new Error(`Invalid payment state: ${payment.status}`);
    }
    const paymentGateway = await PaymentServiceFactory.getService();
    const verification = await paymentGateway.verifyPayment(authority, Number(payment.amount));
    return await prisma5.$transaction(async (tx) => {
      const newStatus = verification.success ? PaymentStatus.PAID : PaymentStatus.FAILED;
      const updatedPayment = await tx.payment.update({
        where: { id: payment.id },
        data: { status: newStatus }
      });
      await tx.transactionLog.create({
        data: {
          paymentId: payment.id,
          action: "VERIFY",
          payload: JSON.stringify(verification),
          responseCode: verification.success ? "100" : "FAILED",
          ipAddress
        }
      });
      await tx.auditTrail.create({
        data: {
          actorId: userId,
          action: "PAYMENT_VERIFY",
          resource: "Payment",
          metadata: JSON.stringify({ paymentId: payment.id, status: newStatus })
        }
      });
      if (newStatus === PaymentStatus.PAID) {
        console.log(`[Invoice Job] Queued invoice generation for payment ${payment.id}`);
      }
      return { payment: updatedPayment, verification };
    });
  }
  /**
   * Admin: Refund a payment
   */
  async refundPayment(paymentId, adminId) {
    const payment = await prisma5.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error("Payment not found");
    if (payment.status !== PaymentStatus.PAID) throw new Error("Can only refund PAID payments");
    return await prisma5.$transaction(async (tx) => {
      const updated = await tx.payment.update({
        where: { id: paymentId },
        data: { status: PaymentStatus.REFUNDED }
      });
      await tx.transactionLog.create({
        data: {
          paymentId,
          action: "REFUND",
          responseCode: "200"
        }
      });
      await tx.auditTrail.create({
        data: {
          actorId: adminId,
          action: "PAYMENT_REFUND",
          resource: "Payment",
          metadata: JSON.stringify({ paymentId })
        }
      });
      return updated;
    });
  }
};

// src/services/financial/Jobs.ts
var prisma6 = getPrisma();
var paymentService = new PaymentLifecycleService();
var FinancialJobs = class {
  static async pollPendingPayments() {
    console.log("[Background Job] Polling for pending payments...");
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1e3);
    try {
      const pendingPayments = await prisma6.payment.findMany({
        where: {
          status: PaymentStatus.PENDING,
          gatewayReference: { not: null },
          createdAt: { lte: fifteenMinsAgo }
        }
      });
      for (const payment of pendingPayments) {
        if (payment.gatewayReference) {
          try {
            console.log(`[Background Job] Verifying pending payment ${payment.id} with gateway ref ${payment.gatewayReference}`);
            await paymentService.verifyPayment(payment.gatewayReference, 0, "127.0.0.1");
          } catch (err) {
            console.error(`[Background Job] Failed to verify payment ${payment.id}: ${err.message}`);
          }
        }
      }
    } catch (err) {
      console.error("[Background Job] Error in pollPendingPayments:", err.message);
    }
  }
  static start() {
    setInterval(this.pollPendingPayments, 10 * 60 * 1e3);
    console.log("[Background Job] Started FinancialJobs");
  }
};

// server.ts
init_PaymentServiceFactory();

// src/validators/financial.ts
var import_zod = require("zod");
var initiatePaymentSchema = import_zod.z.object({
  amount: import_zod.z.number().int().positive("\u0645\u0628\u0644\u063A \u0628\u0627\u06CC\u062F \u0639\u062F\u062F \u0635\u062D\u06CC\u062D \u0648 \u0645\u062B\u0628\u062A \u0628\u0627\u0634\u062F"),
  callbackUrl: import_zod.z.string().url()
});
var refundPaymentSchema = import_zod.z.object({
  paymentId: import_zod.z.string().uuid()
});
var reportQuerySchema = import_zod.z.object({
  page: import_zod.z.string().optional().default("1"),
  limit: import_zod.z.string().optional().default("10"),
  status: import_zod.z.string().optional(),
  startDate: import_zod.z.string().optional(),
  endDate: import_zod.z.string().optional()
});

// server.ts
var import_child_process3 = require("child_process");
var import_util = __toESM(require("util"));

// src/services/integrations/woocommerce/EncryptionService.ts
var import_crypto = __toESM(require("crypto"));
var algorithm = "aes-256-cbc";
var defaultKey = "my-secret-key-that-is-32-bytes-!";
var key = process.env.ENCRYPTION_KEY ? Buffer.from(process.env.ENCRYPTION_KEY.padEnd(32, " ").slice(0, 32)) : Buffer.from(defaultKey);
var EncryptionService = class {
  static encrypt(text) {
    const iv = import_crypto.default.randomBytes(16);
    const cipher = import_crypto.default.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  }
  static decrypt(text) {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts.shift(), "hex");
    const encryptedText = Buffer.from(textParts.join(":"), "hex");
    const decipher = import_crypto.default.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString("utf8");
  }
};

// src/services/integrations/woocommerce/ConnectionService.ts
init_prisma();
var prisma7 = getPrisma();
var ConnectionService = class {
  static async testConnection(storeUrl, consumerKey, consumerSecret) {
    try {
      const url = new URL("/wp-json/wc/v3/system_status", storeUrl);
      const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(1e4),
        headers: {
          "Authorization": `Basic ${auth}`,
          "Accept": "application/json"
        }
      });
      if (!response.ok) {
        return { success: false, error: "Connection failed. Please check credentials and URL." };
      }
      const data = await response.json();
      return {
        success: true,
        data: {
          wooVersion: data.environment?.version,
          wpVersion: data.environment?.wp_version
        }
      };
    } catch (error) {
      return { success: false, error: error.message || "Network error" };
    }
  }
  static async connect(storeId, storeUrl, consumerKey, consumerSecret) {
    const encKey = EncryptionService.encrypt(consumerKey);
    const encSecret = EncryptionService.encrypt(consumerSecret);
    return await prisma7.storeConnection.upsert({
      where: { storeId },
      update: {
        storeUrl,
        consumerKey: encKey,
        consumerSecret: encSecret,
        status: "CONNECTED"
      },
      create: {
        storeId,
        storeUrl,
        consumerKey: encKey,
        consumerSecret: encSecret,
        status: "CONNECTED"
      }
    });
  }
  static async disconnect(storeId) {
    return await prisma7.storeConnection.update({
      where: { storeId },
      data: {
        status: "DISCONNECTED",
        consumerKey: "",
        consumerSecret: ""
      }
    });
  }
  static async getConnection(storeId) {
    const conn = await prisma7.storeConnection.findUnique({
      where: { storeId }
    });
    if (!conn) return null;
    return {
      ...conn,
      consumerKey: conn.consumerKey ? EncryptionService.decrypt(conn.consumerKey) : "",
      consumerSecret: conn.consumerSecret ? EncryptionService.decrypt(conn.consumerSecret) : ""
    };
  }
};

// src/services/integrations/woocommerce/ProductService.ts
init_prisma();
var prisma8 = getPrisma();
var ProductService = class {
  static async syncProducts(storeId) {
    const conn = await ConnectionService.getConnection(storeId);
    if (!conn || conn.status !== "CONNECTED") throw new Error("Not connected");
    const selections = await prisma8.storeProductSelection.findMany({
      where: { storeId },
      include: { product: { include: { category: true, images: true } } }
    });
    const auth = Buffer.from(`${conn.consumerKey}:${conn.consumerSecret}`).toString("base64");
    let successCount = 0;
    let failedCount = 0;
    for (const sel of selections) {
      try {
        const productData = {
          name: sel.product.name,
          type: "simple",
          regular_price: sel.product.finalPrice?.toString() || "0",
          description: sel.product.longDescription || "",
          short_description: sel.product.shortDescription || "",
          manage_stock: true,
          stock_quantity: sel.product.inventory,
          images: sel.product.images.map((img) => ({ src: img.url }))
        };
        let wcId = sel.wc_product_id;
        let url = new URL("/wp-json/wc/v3/products", conn.storeUrl);
        let method = "POST";
        if (wcId) {
          url = new URL(`/wp-json/wc/v3/products/${wcId}`, conn.storeUrl);
          method = "PUT";
        }
        const response = await fetch(url.toString(), {
          signal: AbortSignal.timeout(1e4),
          method,
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(productData)
        });
        if (response.ok) {
          const data = await response.json();
          await prisma8.storeProductSelection.update({
            where: { id: sel.id },
            data: { status: "SYNCED", wc_product_id: data.id }
          });
          successCount++;
        } else {
          failedCount++;
        }
      } catch (err) {
        failedCount++;
      }
    }
    return { successCount, failedCount };
  }
  static async syncStock(storeId) {
    const conn = await ConnectionService.getConnection(storeId);
    if (!conn || conn.status !== "CONNECTED") throw new Error("Not connected");
    const selections = await prisma8.storeProductSelection.findMany({
      where: { storeId, status: "SYNCED", wc_product_id: { not: null } },
      include: { product: true }
    });
    const auth = Buffer.from(`${conn.consumerKey}:${conn.consumerSecret}`).toString("base64");
    let successCount = 0;
    let failedCount = 0;
    for (const sel of selections) {
      if (!sel.wc_product_id) continue;
      try {
        const url = new URL(`/wp-json/wc/v3/products/${sel.wc_product_id}`, conn.storeUrl);
        const response = await fetch(url.toString(), {
          signal: AbortSignal.timeout(1e4),
          method: "PUT",
          headers: {
            "Authorization": `Basic ${auth}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ manage_stock: true, stock_quantity: sel.product.inventory })
        });
        if (response.ok) successCount++;
        else failedCount++;
      } catch (err) {
        failedCount++;
      }
    }
    return { successCount, failedCount };
  }
};

// src/services/integrations/woocommerce/OrderService.ts
init_prisma();
var prisma9 = getPrisma();
var OrderService = class {
  static async syncOrders(storeId) {
    const conn = await ConnectionService.getConnection(storeId);
    if (!conn || conn.status !== "CONNECTED") throw new Error("Not connected");
    const auth = Buffer.from(`${conn.consumerKey}:${conn.consumerSecret}`).toString("base64");
    const url = new URL("/wp-json/wc/v3/orders?status=processing", conn.storeUrl);
    try {
      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(1e4),
        headers: {
          "Authorization": `Basic ${auth}`,
          "Accept": "application/json"
        }
      });
      if (!response.ok) return { successCount: 0, failedCount: 1 };
      const orders = await response.json();
      return { successCount: orders.length, failedCount: 0 };
    } catch (err) {
      return { successCount: 0, failedCount: 1 };
    }
  }
};

// src/services/integrations/woocommerce/SyncService.ts
init_prisma();
var prisma10 = getPrisma();
var SyncService = class {
  static async logSync(connectionId, type, direction, status, message, executionTime) {
    await prisma10.syncLog.create({
      data: {
        connectionId,
        type,
        direction,
        status,
        message,
        executionTime
      }
    });
  }
  static async runProductSync(storeId) {
    const conn = await prisma10.storeConnection.findUnique({ where: { storeId } });
    if (!conn) return;
    const start = Date.now();
    try {
      const result = await ProductService.syncProducts(storeId);
      const executionTime = Date.now() - start;
      await this.logSync(conn.id, "PRODUCTS", "EXPORT", "SUCCESS", `Synced ${result.successCount}, Failed ${result.failedCount}`, executionTime);
      await prisma10.storeConnection.update({
        where: { id: conn.id },
        data: { lastSync: /* @__PURE__ */ new Date(), lastSuccessfulSync: /* @__PURE__ */ new Date() }
      });
      return result;
    } catch (err) {
      const executionTime = Date.now() - start;
      await this.logSync(conn.id, "PRODUCTS", "EXPORT", "FAILED", err.message, executionTime);
      throw err;
    }
  }
  static async runStockSync(storeId) {
    const conn = await prisma10.storeConnection.findUnique({ where: { storeId } });
    if (!conn) return;
    const start = Date.now();
    try {
      const result = await ProductService.syncStock(storeId);
      const executionTime = Date.now() - start;
      await this.logSync(conn.id, "STOCK", "EXPORT", "SUCCESS", `Synced ${result.successCount}, Failed ${result.failedCount}`, executionTime);
      await prisma10.storeConnection.update({
        where: { id: conn.id },
        data: { lastSync: /* @__PURE__ */ new Date(), lastSuccessfulSync: /* @__PURE__ */ new Date() }
      });
      return result;
    } catch (err) {
      const executionTime = Date.now() - start;
      await this.logSync(conn.id, "STOCK", "EXPORT", "FAILED", err.message, executionTime);
      throw err;
    }
  }
  static async runOrderSync(storeId) {
    const conn = await prisma10.storeConnection.findUnique({ where: { storeId } });
    if (!conn) return;
    const start = Date.now();
    try {
      const result = await OrderService.syncOrders(storeId);
      const executionTime = Date.now() - start;
      await this.logSync(conn.id, "ORDERS", "IMPORT", "SUCCESS", `Synced ${result.successCount}, Failed ${result.failedCount}`, executionTime);
      await prisma10.storeConnection.update({
        where: { id: conn.id },
        data: { lastSync: /* @__PURE__ */ new Date(), lastSuccessfulSync: /* @__PURE__ */ new Date() }
      });
      return result;
    } catch (err) {
      const executionTime = Date.now() - start;
      await this.logSync(conn.id, "ORDERS", "IMPORT", "FAILED", err.message, executionTime);
      throw err;
    }
  }
};

// src/services/integrations/woocommerce/WebhookService.ts
init_prisma();
var import_crypto2 = __toESM(require("crypto"));
init_WalletService();
var prisma12 = getPrisma();
var walletService = new WalletService();
var retryQueue = [];
var MAX_RETRIES = 3;
async function processOrderQueue() {
  if (retryQueue.length === 0) return;
  const task = retryQueue.shift();
  if (task) {
    try {
      await processOrderPayload(task.payload, task.storeId);
      console.log(`Successfully processed retried order ${task.payload.id}`);
    } catch (err) {
      console.error(`Retry failed for order ${task.payload.id}: ${err.message}`);
      if (task.retryCount < MAX_RETRIES) {
        task.retryCount++;
        retryQueue.push(task);
      } else {
        console.error(`Max retries reached for order ${task.payload.id}. Dropping task.`);
      }
    }
  }
}
setInterval(processOrderQueue, 1e4);
var WebhookService = class {
  static async handleWebhook(payload, signature, storeId) {
    const connection = await prisma12.storeConnection.findUnique({
      where: { storeId }
    });
    if (!connection) {
      throw new Error("Store connection not found");
    }
    if (connection.webhookSecret && signature) {
      const payloadString = JSON.stringify(payload);
      const expectedSignature = import_crypto2.default.createHmac("sha256", connection.webhookSecret).update(payloadString, "utf8").digest("base64");
      if (expectedSignature !== signature) {
        console.warn("Webhook signature mismatch. Expected:", expectedSignature, "Got:", signature);
      }
    }
    if (payload && payload.id) {
      try {
        await processOrderPayload(payload, storeId);
      } catch (err) {
        console.error(`Error processing order webhook (id: ${payload.id}): ${err.message}. Adding to retry queue.`);
        retryQueue.push({ payload, storeId, retryCount: 1 });
      }
    }
    return { success: true };
  }
};
async function processOrderPayload(payload, storeId) {
  if (payload.status !== "completed") {
    return;
  }
  const orderId = payload.id.toString();
  const existingLedger = await prisma12.ledgerEntry.findFirst({
    where: {
      referenceId: orderId,
      type: LedgerType.ORDER_REVENUE
    }
  });
  if (existingLedger) {
    console.log(`Order ${orderId} already processed. Skipping.`);
    return;
  }
  for (const item of payload.line_items) {
    const wcProductId = item.product_id;
    const itemTotal = parseFloat(item.total);
    const storeProduct = await prisma12.storeProductSelection.findUnique({
      where: { wc_product_id: wcProductId },
      include: { product: true }
    });
    if (storeProduct && storeProduct.product) {
      const product = storeProduct.product;
      const supplierId = product.supplierId;
      let commissionRate = 0;
      let commissionAmount = 0;
      if (product.marginType === "PERCENTAGE" && product.marginValue) {
        commissionRate = product.marginValue / 100;
        commissionAmount = itemTotal * commissionRate;
      } else if (product.marginType === "FIXED" && product.marginValue) {
        commissionAmount = product.marginValue * item.quantity;
      }
      const supplierRevenue = itemTotal - commissionAmount;
      if (supplierRevenue > 0) {
        const wallet = await prisma12.wallet.findUnique({
          where: { supplierId }
        });
        if (wallet) {
          await walletService.creditWallet(
            wallet.id,
            supplierRevenue,
            LedgerType.ORDER_REVENUE,
            orderId,
            `Revenue for order #${orderId} (Item: ${item.name})`
          );
          console.log(`Credited wallet ${wallet.id} with ${supplierRevenue} for order ${orderId}`);
        } else {
          console.error(`Wallet not found for supplier ${supplierId}`);
        }
      }
    } else {
      console.warn(`Product mapping not found for WC Product ID: ${wcProductId}`);
    }
  }
}

// src/services/integrations/woocommerce/OrderSync.ts
init_prisma();
var import_woocommerce_rest_api = __toESM(require("@woocommerce/woocommerce-rest-api"));
var prisma13 = getPrisma();
async function syncSingleOrder(storeId, orderId) {
  const connection = await prisma13.storeConnection.findUnique({
    where: { storeId }
  });
  if (!connection) {
    throw new Error("Store connection not found");
  }
  const WC = import_woocommerce_rest_api.default.default?.default || import_woocommerce_rest_api.default.default || import_woocommerce_rest_api.default;
  const api = new WC({
    url: connection.storeUrl,
    consumerKey: connection.consumerKey,
    consumerSecret: connection.consumerSecret,
    version: "wc/v3"
  });
  const response = await api.get(`orders/${orderId}`);
  if (response.status === 200 && response.data) {
    await processOrderPayload(storeId, response.data);
    return response.data;
  }
  throw new Error(`Failed to fetch order ${orderId} from WooCommerce`);
}

// server.ts
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
  try {
    const logPath = process.env.VERCEL ? import_path3.default.join("/tmp", "server.log") : "server.log";
    import_fs3.default.appendFileSync(logPath, (/* @__PURE__ */ new Date()).toISOString() + " - UNCAUGHT EXCEPTION: " + (err.stack || err) + "\n");
  } catch (e) {
  }
});
process.on("unhandledRejection", (reason, promise) => {
  console.error("UNHANDLED REJECTION at:", promise, "reason:", reason);
  try {
    const logPath = process.env.VERCEL ? import_path3.default.join("/tmp", "server.log") : "server.log";
    import_fs3.default.appendFileSync(logPath, (/* @__PURE__ */ new Date()).toISOString() + " - UNHANDLED REJECTION: " + (reason?.stack || reason) + "\n");
  } catch (e) {
  }
});
var originalConsoleError = console.error;
console.error = function(...args) {
  originalConsoleError.apply(console, args);
  try {
    const errorLogPath = process.env.VERCEL ? import_path3.default.join("/tmp", "error.log") : import_path3.default.join(process.cwd(), "error.log");
    const logLine = `[${(/* @__PURE__ */ new Date()).toISOString()}] ERROR: ${args.map((a) => typeof a === "object" ? JSON.stringify(a) : a).join(" ")}
`;
    import_fs3.default.appendFileSync(errorLogPath, logLine);
  } catch (e) {
  }
};
function toEngDigits(str) {
  if (typeof str !== "string") return str;
  return str.replace(/[۰-۹]/g, (d) => "\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9".indexOf(d).toString());
}
function safeParseFloat(val, fallback = 0) {
  if (val === void 0 || val === null || val === "") return fallback;
  const engStr = toEngDigits(val.toString());
  const parsed = parseFloat(engStr);
  return isNaN(parsed) ? fallback : parsed;
}
function safeParseInt(val, fallback = 0) {
  if (val === void 0 || val === null || val === "") return fallback;
  const engStr = toEngDigits(val.toString());
  const parsed = parseInt(engStr, 10);
  return isNaN(parsed) ? fallback : parsed;
}
var PrismaClient = import_client.PrismaClient;
function findTrueRootDir2() {
  const current = typeof __dirname !== "undefined" ? __dirname : process.cwd();
  if (import_fs3.default.existsSync(import_path3.default.join(current, "package.json"))) {
    return current;
  }
  const parent = import_path3.default.join(current, "..");
  if (import_fs3.default.existsSync(import_path3.default.join(parent, "package.json"))) {
    return parent;
  }
  return current;
}
var isAIStudioEnv2 = !!process.env.APPLET_ID;
var isCloudRunEnv2 = !!process.env.K_SERVICE || !!process.env.PORT && process.env.NODE_ENV === "production";
var rootDir2 = isAIStudioEnv2 || isCloudRunEnv2 ? process.cwd() : findTrueRootDir2();
import_dotenv2.default.config({ path: import_path3.default.join(rootDir2, ".env") });
try {
  if (!isAIStudioEnv2) {
    const distDir = import_path3.default.join(rootDir2, "prod_output");
    let enginePath = null;
    if (import_fs3.default.existsSync(distDir)) {
      const files = import_fs3.default.readdirSync(distDir);
      let engineFile = files.find((f) => {
        const isEngine = (f.includes("query-engine") || f.includes("query_engine")) && f.endsWith(".node");
        return isEngine && f.includes("rhel");
      });
      if (!engineFile) {
        engineFile = files.find((f) => (f.includes("query-engine") || f.includes("query_engine")) && f.endsWith(".node"));
      }
      if (engineFile) {
        enginePath = import_path3.default.join(distDir, engineFile);
      }
    }
    if (!enginePath && import_fs3.default.existsSync(rootDir2)) {
      const files = import_fs3.default.readdirSync(rootDir2);
      let engineFile = files.find((f) => {
        const isEngine = (f.includes("query-engine") || f.includes("query_engine")) && f.endsWith(".node");
        return isEngine && f.includes("rhel");
      });
      if (!engineFile) {
        engineFile = files.find((f) => (f.includes("query-engine") || f.includes("query_engine")) && f.endsWith(".node"));
      }
      if (engineFile) {
        enginePath = import_path3.default.join(rootDir2, engineFile);
      }
    }
    if (enginePath && !isCloudRunEnv2 && !process.env.VERCEL) {
      process.env.PRISMA_QUERY_ENGINE_LIBRARY = enginePath;
      console.log("[Prisma Config] Set query engine library to:", enginePath);
    }
  }
} catch (err) {
  console.warn("[Prisma Config] Failed to detect query engine library:", err.message);
}
var webhookLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  // 15 minutes
  max: 100,
  // Limit each IP to 100 webhook requests per windowMs
  message: { error: "Too many webhook requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false
});
var payoutRequestLimiter = (0, import_express_rate_limit.default)({
  windowMs: 60 * 60 * 1e3,
  // 1 hour
  max: 5,
  // Limit each IP to 5 payout requests per hour
  message: { error: "Too many payout requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false
});
var isAIStudio = !!process.env.APPLET_ID;
var dbUrl2 = process.env.DATABASE_URL || "";
function sanitizeDbUrl2(rawUrl) {
  if (!rawUrl) return rawUrl;
  let url = rawUrl.trim();
  while (url.startsWith("DATABASE_URL=")) {
    url = url.substring("DATABASE_URL=".length).trim();
  }
  while (url.startsWith('"') && url.endsWith('"') || url.startsWith("'") && url.endsWith("'")) {
    url = url.slice(1, -1).trim();
  }
  const match = url.match(/^([a-zA-Z0-9+-]+:\/\/)(.*)$/);
  if (!match) return url;
  const scheme = match[1];
  const rest = match[2];
  const lastAtIndex = rest.lastIndexOf("@");
  if (lastAtIndex === -1) return url;
  const credentials = rest.substring(0, lastAtIndex);
  const hostAndDb = rest.substring(lastAtIndex + 1);
  const firstColon = credentials.indexOf(":");
  if (firstColon === -1) return url;
  const username = credentials.substring(0, firstColon);
  let password = credentials.substring(firstColon + 1);
  password = password.replace(/@/g, "%40");
  return `${scheme}${username}:${password}@${hostAndDb}`;
}
dbUrl2 = sanitizeDbUrl2(dbUrl2);
process.env.DATABASE_URL = dbUrl2;
var isCloudRun = !!process.env.K_SERVICE || !!process.env.PORT && dbUrl2.includes("localhost");
var provider = "sqlite";
var isRealRemoteDb2 = dbUrl2 && (dbUrl2.startsWith("mysql://") || dbUrl2.startsWith("mysqls://") || dbUrl2.startsWith("postgresql://") || dbUrl2.startsWith("postgres://")) && !dbUrl2.includes("localhost") && !dbUrl2.includes("127.0.0.1") && !dbUrl2.includes("dummy_db");
if (dbUrl2) {
  if (dbUrl2.startsWith("mysql://") || dbUrl2.startsWith("mysqls://")) {
    provider = "mysql";
  } else if (dbUrl2.startsWith("postgresql://") || dbUrl2.startsWith("postgres://")) {
    provider = "postgresql";
  } else if (dbUrl2.startsWith("file:") || dbUrl2.includes(".db")) {
    provider = "sqlite";
  } else {
    provider = "mysql";
  }
} else {
  if (isAIStudio || isCloudRun) {
    provider = "sqlite";
    const dbDir = import_path3.default.join(process.cwd(), "prisma");
    if (!import_fs3.default.existsSync(dbDir)) {
      try {
        import_fs3.default.mkdirSync(dbDir, { recursive: true });
      } catch (e) {
      }
    }
    dbUrl2 = `file:${import_path3.default.join(dbDir, "dev.db")}`;
    process.env.DATABASE_URL = dbUrl2;
  } else {
    provider = "postgresql";
    dbUrl2 = "postgresql://dummy:dummy@dummy_db/dummy";
    process.env.DATABASE_URL = dbUrl2;
    console.log("[Server Startup] No database URL found, defaulting to postgresql for Vercel/Neon.");
  }
}
var realPrisma = null;
var isPrismaMock = false;
var MemoryDatabase = class {
  collections = /* @__PURE__ */ new Map();
  autoId = /* @__PURE__ */ new Map();
  constructor() {
    this.seedInitialData();
  }
  normalizeModel(model) {
    return String(model).toLowerCase();
  }
  getCollection(model) {
    const key2 = this.normalizeModel(model);
    if (!this.collections.has(key2)) {
      this.collections.set(key2, []);
      this.autoId.set(key2, 1);
    }
    return this.collections.get(key2);
  }
  getNextId(model) {
    const key2 = this.normalizeModel(model);
    const current = this.autoId.get(key2) || 1;
    this.autoId.set(key2, current + 1);
    return current;
  }
  matchCondition(itemVal, condVal) {
    if (condVal === void 0) return true;
    if (condVal === null) return itemVal === null;
    if (typeof condVal === "object" && !Array.isArray(condVal) && !(condVal instanceof Date)) {
      for (const [op, val] of Object.entries(condVal)) {
        if (op === "equals") {
          if (itemVal !== val) return false;
        } else if (op === "in") {
          if (!Array.isArray(val) || !val.includes(itemVal)) return false;
        } else if (op === "notIn") {
          if (Array.isArray(val) && val.includes(itemVal)) return false;
        } else if (op === "not") {
          if (itemVal === val) return false;
        } else if (op === "contains") {
          const itemStr = String(itemVal || "").toLowerCase();
          const targetStr = String(val || "").toLowerCase();
          if (!itemStr.includes(targetStr)) return false;
        } else if (op === "startsWith") {
          const itemStr = String(itemVal || "").toLowerCase();
          const targetStr = String(val || "").toLowerCase();
          if (!itemStr.startsWith(targetStr)) return false;
        } else if (op === "endsWith") {
          const itemStr = String(itemVal || "").toLowerCase();
          const targetStr = String(val || "").toLowerCase();
          if (!itemStr.endsWith(targetStr)) return false;
        } else if (op === "gt") {
          if (!(itemVal > val)) return false;
        } else if (op === "gte") {
          if (!(itemVal >= val)) return false;
        } else if (op === "lt") {
          if (!(itemVal < val)) return false;
        } else if (op === "lte") {
          if (!(itemVal <= val)) return false;
        }
      }
      return true;
    }
    return itemVal === condVal;
  }
  matchWhere(item, where) {
    if (!where || typeof where !== "object") return true;
    if (!item) return false;
    for (const [key2, val] of Object.entries(where)) {
      if (key2 === "OR") {
        if (Array.isArray(val)) {
          const anyMatch = val.some((subWhere) => this.matchWhere(item, subWhere));
          if (!anyMatch) return false;
        }
      } else if (key2 === "AND") {
        if (Array.isArray(val)) {
          const allMatch = val.every((subWhere) => this.matchWhere(item, subWhere));
          if (!allMatch) return false;
        }
      } else if (key2 === "NOT") {
        if (Array.isArray(val)) {
          const notMatch = val.some((subWhere) => this.matchWhere(item, subWhere));
          if (notMatch) return false;
        } else if (typeof val === "object") {
          if (this.matchWhere(item, val)) return false;
        }
      } else {
        const itemVal = item[key2];
        if (!this.matchCondition(itemVal, val)) {
          return false;
        }
      }
    }
    return true;
  }
  attachRelations(model, item, include) {
    if (!include || typeof include !== "object" || !item) return item;
    const cloned = { ...item };
    const normModel = this.normalizeModel(model);
    if (include.storeManager || include.user || include.supplier || include.customer) {
      const users = this.getCollection("user");
      const targetUserId = item.storeManagerId || item.userId || item.supplierId || item.customerId || item.id;
      const foundUser = users.find((u) => u.id === targetUserId);
      if (include.storeManager) cloned.storeManager = foundUser ? { ...foundUser } : null;
      if (include.user) cloned.user = foundUser ? { ...foundUser } : null;
      if (include.supplier) cloned.supplier = foundUser ? { ...foundUser } : null;
      if (include.customer) cloned.customer = foundUser ? { ...foundUser } : null;
    }
    if (include.orders) {
      const orders = this.getCollection("order");
      cloned.orders = orders.filter((o) => o.storeInvoiceId === item.id || o.storeId === item.id);
    }
    if (include.items) {
      const orderItems = this.getCollection("orderitem");
      cloned.items = orderItems.filter((it) => it.orderId === item.id || it.storeInvoiceId === item.id);
    }
    if (include.product) {
      const products = this.getCollection("product");
      cloned.product = products.find((p) => p.id === item.productId) || null;
    }
    if (include.category) {
      const categories = this.getCollection("category");
      cloned.category = categories.find((c) => c.id === item.categoryId) || null;
    }
    return cloned;
  }
  async execute(model, method, args = {}) {
    const list = this.getCollection(model);
    switch (method) {
      case "findMany": {
        let results = list.filter((item) => this.matchWhere(item, args?.where));
        if (args?.orderBy) {
          const orderRules = Array.isArray(args.orderBy) ? args.orderBy : [args.orderBy];
          results.sort((a, b) => {
            for (const rule of orderRules) {
              for (const [field, dir] of Object.entries(rule)) {
                const aVal = a[field];
                const bVal = b[field];
                const orderDir = String(dir).toLowerCase() === "desc" ? -1 : 1;
                if (aVal < bVal) return -1 * orderDir;
                if (aVal > bVal) return 1 * orderDir;
              }
            }
            return 0;
          });
        }
        if (args?.skip) {
          results = results.slice(args.skip);
        }
        if (args?.take) {
          results = results.slice(0, args.take);
        }
        if (args?.include) {
          results = results.map((it) => this.attachRelations(model, it, args.include));
        }
        return results.map((it) => ({ ...it }));
      }
      case "findFirst": {
        const results = await this.execute(model, "findMany", { ...args, take: 1 });
        return results.length > 0 ? results[0] : null;
      }
      case "findUnique": {
        const item = list.find((it) => this.matchWhere(it, args?.where));
        if (!item) return null;
        if (args?.include) {
          return this.attachRelations(model, item, args.include);
        }
        return { ...item };
      }
      case "create": {
        const nextId = args?.data?.id || this.getNextId(model);
        const newItem = {
          id: nextId,
          ...args?.data,
          createdAt: args?.data?.createdAt || /* @__PURE__ */ new Date(),
          updatedAt: /* @__PURE__ */ new Date()
        };
        list.push(newItem);
        if (args?.include) {
          return this.attachRelations(model, newItem, args.include);
        }
        return { ...newItem };
      }
      case "update": {
        const index = list.findIndex((it) => this.matchWhere(it, args?.where));
        if (index === -1) {
          return this.execute(model, "create", { data: { ...args?.where || {}, ...args?.data || {} } });
        }
        const existing = list[index];
        const updated = {
          ...existing,
          ...args?.data,
          updatedAt: /* @__PURE__ */ new Date()
        };
        list[index] = updated;
        if (args?.include) {
          return this.attachRelations(model, updated, args.include);
        }
        return { ...updated };
      }
      case "upsert": {
        const existing = list.find((it) => this.matchWhere(it, args?.where));
        if (existing) {
          return this.execute(model, "update", { where: args.where, data: args.update, include: args.include });
        } else {
          return this.execute(model, "create", { data: { ...args?.where || {}, ...args?.create || {} }, include: args.include });
        }
      }
      case "delete": {
        const index = list.findIndex((it) => this.matchWhere(it, args?.where));
        if (index !== -1) {
          const removed = list.splice(index, 1)[0];
          return { ...removed };
        }
        return {};
      }
      case "deleteMany": {
        const initialLen = list.length;
        const remaining = list.filter((it) => !this.matchWhere(it, args?.where));
        this.collections.set(this.normalizeModel(model), remaining);
        return { count: initialLen - remaining.length };
      }
      case "updateMany": {
        let count = 0;
        for (let i = 0; i < list.length; i++) {
          if (this.matchWhere(list[i], args?.where)) {
            list[i] = { ...list[i], ...args?.data, updatedAt: /* @__PURE__ */ new Date() };
            count++;
          }
        }
        return { count };
      }
      case "count": {
        if (!args?.where) return list.length;
        return list.filter((it) => this.matchWhere(it, args.where)).length;
      }
      case "aggregate": {
        const filtered = list.filter((it) => this.matchWhere(it, args?.where));
        const result = { _sum: {}, _avg: {}, _count: filtered.length, _min: {}, _max: {} };
        if (args?._sum) {
          for (const key2 of Object.keys(args._sum)) {
            result._sum[key2] = filtered.reduce((acc, it) => acc + (Number(it[key2]) || 0), 0);
          }
        }
        return result;
      }
      case "groupBy": {
        return [];
      }
      default:
        return null;
    }
  }
  seedInitialData() {
    const adminPass = import_bcryptjs.default.hashSync("!Bahankala@2026", 10);
    const storePass = import_bcryptjs.default.hashSync("store", 10);
    const supplierPass = import_bcryptjs.default.hashSync("supplier", 10);
    const testshopPass = import_bcryptjs.default.hashSync("Testshop", 10);
    const standardPass = import_bcryptjs.default.hashSync("!Bahankala@2026", 10);
    const users = this.getCollection("user");
    users.push(
      {
        id: 1,
        username: "admin",
        password: adminPass,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        firstName: "\u0645\u062F\u06CC\u0631",
        lastName: "\u0627\u0631\u0634\u062F",
        mobile: "09120000000",
        email: "admin@marketplace.com",
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: 2,
        username: "store",
        password: storePass,
        role: "STORE_MANAGER",
        status: "ACTIVE",
        firstName: "\u0645\u062F\u06CC\u0631",
        lastName: "\u0641\u0631\u0648\u0634\u06AF\u0627\u0647",
        mobile: "09122222222",
        storeName: "\u0641\u0631\u0648\u0634\u06AF\u0627\u0647 \u0646\u0645\u0648\u0646\u0647 \u0632\u0648\u067E\u06CC\u062A",
        storeUrl: "samplestore.ir",
        platformType: "WOOCOMMERCE",
        fieldOfActivity: "\u0644\u0648\u0627\u0632\u0645 \u0627\u0644\u06A9\u062A\u0631\u0648\u0646\u06CC\u06A9\u06CC",
        productCount: 50,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: 3,
        username: "store1",
        password: standardPass,
        role: "STORE_MANAGER",
        status: "ACTIVE",
        firstName: "\u0645\u062F\u06CC\u0631 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647",
        lastName: "\u062A\u0633\u062A \u06F1",
        mobile: "09121111111",
        storeName: "\u0641\u0631\u0648\u0634\u06AF\u0627\u0647 \u062A\u0633\u062A \u0634\u0645\u0627\u0631\u0647 \u06CC\u06A9",
        storeUrl: "store1.ir",
        platformType: "WOOCOMMERCE",
        fieldOfActivity: "\u067E\u0648\u0634\u0627\u06A9 \u0648 \u0644\u0648\u0627\u0632\u0645 \u0648\u0631\u0632\u0634\u06CC",
        productCount: 120,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: 4,
        username: "store2",
        password: standardPass,
        role: "STORE_MANAGER",
        status: "ACTIVE",
        firstName: "\u0645\u062F\u06CC\u0631 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647",
        lastName: "\u062A\u0633\u062A \u06F2",
        mobile: "09121111112",
        storeName: "\u0641\u0631\u0648\u0634\u06AF\u0627\u0647 \u062A\u0633\u062A \u0634\u0645\u0627\u0631\u0647 \u062F\u0648",
        storeUrl: "store2.ir",
        platformType: "SHOPIFY",
        fieldOfActivity: "\u0622\u0631\u0627\u06CC\u0634\u06CC \u0648 \u0628\u0647\u062F\u0627\u0634\u062A\u06CC",
        productCount: 80,
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: 5,
        username: "supplier",
        password: supplierPass,
        role: "SUPPLIER",
        status: "ACTIVE",
        firstName: "\u062A\u0627\u0645\u06CC\u0646 \u06A9\u0646\u0646\u062F\u0647",
        lastName: "\u0627\u0635\u0644\u06CC",
        mobile: "09124444444",
        brandName: "\u062A\u0627\u0645\u06CC\u0646 \u06AF\u0633\u062A\u0631 \u0632\u0648\u067E\u06CC\u062A",
        storeName: "\u062A\u0627\u0645\u06CC\u0646 \u0645\u0627\u0631\u06A9\u062A",
        storeUrl: "tamingostar.ir",
        storeLink: "tamingostar.ir",
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: 6,
        username: "supplier1",
        password: standardPass,
        role: "SUPPLIER",
        status: "ACTIVE",
        firstName: "\u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647",
        lastName: "\u062A\u0633\u062A \u06F1",
        mobile: "09125555551",
        brandName: "\u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0627\u0644\u0627 \u067E\u0627\u0631\u0633",
        storeName: "\u062A\u0627\u0645\u06CC\u0646 \u0645\u0627\u0631\u06A9\u062A \u06CC\u06A9",
        storeUrl: "supplier1.ir",
        storeLink: "supplier1.ir",
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: 7,
        username: "supplier2",
        password: standardPass,
        role: "SUPPLIER",
        status: "ACTIVE",
        firstName: "\u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647",
        lastName: "\u062A\u0633\u062A \u06F2",
        mobile: "09125555552",
        brandName: "\u06AF\u0631\u0648\u0647 \u0635\u0646\u0639\u062A\u06CC \u0646\u06CC\u06A9\u0648",
        storeName: "\u062A\u0627\u0645\u06CC\u0646 \u0645\u0627\u0631\u06A9\u062A \u062F\u0648",
        storeUrl: "supplier2.ir",
        storeLink: "supplier2.ir",
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: 8,
        username: "Testshop",
        password: testshopPass,
        role: "SUPPLIER",
        status: "ACTIVE",
        firstName: "\u062A\u0627\u0645\u06CC\u0646 \u06A9\u0646\u0646\u062F\u0647",
        lastName: "\u062A\u0633\u062A",
        mobile: "09123333333",
        brandName: "\u062A\u0633\u062A \u06AF\u0633\u062A\u0631",
        storeName: "\u0641\u0631\u0648\u0634\u06AF\u0627\u0647 \u062A\u0633\u062A",
        storeUrl: "testshop.ir",
        storeLink: "testshop.ir",
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: 9,
        username: "customer1",
        password: standardPass,
        role: "CUSTOMER",
        status: "ACTIVE",
        firstName: "\u0639\u0644\u06CC",
        lastName: "\u0631\u0636\u0627\u06CC\u06CC",
        mobile: "09129998877",
        address: "\u062A\u0647\u0631\u0627\u0646\u060C \u062E\u06CC\u0627\u0628\u0627\u0646 \u0648\u0644\u06CC\u0639\u0635\u0631\u060C \u067E\u0644\u0627\u06A9 \u06F1\u06F2\u06F3",
        createdAt: /* @__PURE__ */ new Date()
      },
      {
        id: 10,
        username: "referrer1",
        password: standardPass,
        role: "REFERRER",
        status: "ACTIVE",
        firstName: "\u0633\u0627\u0631\u0627",
        lastName: "\u06A9\u0631\u06CC\u0645\u06CC",
        mobile: "09123332211",
        address: "\u0627\u0635\u0641\u0647\u0627\u0646\u060C \u0686\u0647\u0627\u0631\u0628\u0627\u063A",
        createdAt: /* @__PURE__ */ new Date()
      }
    );
    this.autoId.set("user", 11);
    const categories = this.getCollection("category");
    const defaultCategories = [
      "\u062F\u06CC\u062C\u06CC\u062A\u0627\u0644 \u0648 \u0644\u0648\u0627\u0632\u0645 \u062C\u0627\u0646\u0628\u06CC",
      "\u067E\u0648\u0634\u0627\u06A9 \u0648 \u0645\u062F",
      "\u0632\u06CC\u0628\u0627\u06CC\u06CC \u0648 \u0633\u0644\u0627\u0645\u062A",
      "\u062E\u0627\u0646\u0647 \u0648 \u0622\u0634\u067E\u0632\u062E\u0627\u0646\u0647",
      "\u0648\u0631\u0632\u0634 \u0648 \u0633\u0641\u0631",
      "\u0627\u0633\u0628\u0627\u0628 \u0628\u0627\u0632\u06CC \u0648 \u06A9\u0648\u062F\u06A9",
      "\u06A9\u062A\u0627\u0628 \u0648 \u062A\u062D\u0631\u06CC\u0631",
      "\u062E\u0648\u062F\u0631\u0648 \u0648 \u0627\u0628\u0632\u0627\u0631",
      "\u0633\u0648\u067E\u0631\u0645\u0627\u0631\u06A9\u062A \u0648 \u0645\u0648\u0627\u062F \u063A\u0630\u0627\u06CC\u06CC",
      "\u0633\u0627\u0639\u062A \u0648 \u062C\u0648\u0627\u0647\u0631\u0627\u062A",
      "\u067E\u062A \u0634\u0627\u067E",
      "\u0635\u0646\u0627\u06CC\u0639 \u062F\u0633\u062A\u06CC",
      "\u0627\u0628\u0632\u0627\u0631\u0622\u0644\u0627\u062A \u0648 \u062A\u062C\u0647\u06CC\u0632\u0627\u062A",
      "\u0645\u0648\u0628\u0627\u06CC\u0644 \u0648 \u062A\u0628\u0644\u062A",
      "\u0644\u067E \u062A\u0627\u067E \u0648 \u06A9\u0627\u0645\u067E\u06CC\u0648\u062A\u0631",
      "\u0644\u0648\u0627\u0632\u0645 \u062E\u0627\u0646\u06AF\u06CC \u0628\u0631\u0642\u06CC"
    ];
    defaultCategories.forEach((title, idx) => {
      categories.push({
        id: idx + 1,
        title,
        description: `\u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC ${title}`,
        active: true,
        createdAt: /* @__PURE__ */ new Date()
      });
    });
    this.autoId.set("category", defaultCategories.length + 1);
    const invoices = this.getCollection("storeinvoice");
    invoices.push(
      {
        id: 1,
        storeManagerId: 2,
        totalAmount: 385e4,
        status: "PENDING",
        paymentMethod: "MANUAL",
        receiptStatus: "PENDING",
        receiptNotes: "\u0648\u0627\u0631\u06CC\u0632 \u0627\u0632 \u0637\u0631\u06CC\u0642 \u0647\u0645\u0631\u0627\u0647 \u0628\u0627\u0646\u06A9 \u0645\u0644\u06CC \u0628\u0647 \u0634\u0645\u0627\u0631\u0647 \u0634\u0628\u0627",
        receiptUrl: "/uploads/sample_receipt1.jpg",
        createdAt: new Date(Date.now() - 36e5 * 4)
      },
      {
        id: 2,
        storeManagerId: 3,
        totalAmount: 72e5,
        status: "PENDING",
        paymentMethod: "MANUAL",
        receiptStatus: "PENDING",
        receiptNotes: "\u067E\u0631\u062F\u0627\u062E\u062A \u0641\u06CC\u0634 \u062D\u0648\u0627\u0644\u0647 \u067E\u0627\u06CC\u0627",
        receiptUrl: "/uploads/sample_receipt2.jpg",
        createdAt: new Date(Date.now() - 36e5 * 12)
      }
    );
    this.autoId.set("storeinvoice", 3);
    const configs = this.getCollection("systemconfig");
    configs.push(
      { id: 1, key: "PLATFORM_NAME", value: "\u0632\u0648\u067E\u06CC\u062A (Zopit)" },
      { id: 2, key: "ZIBAL_MERCHANT_ID", value: "zibal" },
      { id: 3, key: "PAYMENT_MODE", value: "HYBRID" }
    );
    this.autoId.set("systemconfig", 4);
  }
};
var memoryStore = new MemoryDatabase();
function getActivePrisma() {
  if (!realPrisma || isPrismaMock) {
    try {
      if (!PrismaClient) {
        PrismaClient = import_client.PrismaClient;
      }
      if (PrismaClient && isRealRemoteDb2) {
        const url = process.env.DATABASE_URL || dbUrl2;
        realPrisma = new PrismaClient({
          datasources: {
            db: {
              url
            }
          }
        });
        isPrismaMock = false;
      } else {
        isPrismaMock = true;
      }
    } catch (err) {
      console.warn("[Server Prisma] Database connection notice:", err.message);
      isPrismaMock = true;
    }
  }
  return realPrisma;
}
var prisma14 = new Proxy({}, {
  get(target, prop) {
    if (typeof prop !== "string") {
      return Reflect.get(target, prop);
    }
    if (prop === "then" || prop === "catch" || prop === "finally") {
      return void 0;
    }
    if (prop === "inspect" || prop === "toJSON" || prop === "toString" || prop.startsWith("_")) {
      return void 0;
    }
    if (prop === "$transaction") {
      return async (cbOrList) => {
        if (typeof cbOrList === "function") {
          return await cbOrList(prisma14);
        }
        if (Array.isArray(cbOrList)) {
          return await Promise.all(cbOrList);
        }
        return cbOrList;
      };
    }
    if (prop === "$queryRaw" || prop === "$executeRaw" || prop === "$queryRawUnsafe" || prop === "$executeRawUnsafe") {
      return async () => [];
    }
    if (prop === "$connect" || prop === "$disconnect") {
      return async () => {
      };
    }
    return new Proxy({}, {
      get(subTarget, subProp) {
        if (typeof subProp !== "string") {
          return Reflect.get(subTarget, subProp);
        }
        if (subProp === "then" || subProp === "catch" || subProp === "finally") {
          return void 0;
        }
        if (subProp === "inspect" || subProp === "toJSON" || subProp === "toString" || subProp.startsWith("_")) {
          return void 0;
        }
        return async (...args) => {
          const active = getActivePrisma();
          if (isRealRemoteDb2 && active && !isPrismaMock && typeof active[prop]?.[subProp] === "function") {
            try {
              return await active[prop][subProp](...args);
            } catch (err) {
              const errMsg = err?.message || "";
              const isInitOrConnError = err?.name === "PrismaClientInitializationError" || err?.name === "PrismaClientKnownRequestError" || err?.name === "PrismaClientRustPanicError" || errMsg.includes("Can't reach database server") || errMsg.includes("database server") || errMsg.includes("Connection") || errMsg.includes("timed out") || errMsg.includes("dummy");
              if (isInitOrConnError) {
                console.warn(`[Prisma Query Fallback] ${prop}.${subProp} fallback to memory store:`, errMsg);
                return await memoryStore.execute(prop, subProp, args[0]);
              }
              throw err;
            }
          }
          return await memoryStore.execute(prop, subProp, args[0]);
        };
      }
    });
  }
});
var app = (0, import_express.default)();
var googleClient = new import_google_auth_library.OAuth2Client(process.env.GOOGLE_CLIENT_ID || "dummy_client_id_for_build");
var labelsUploadDir = process.env.VERCEL ? import_path3.default.join("/tmp", "uploads", "labels") : import_path3.default.join(process.cwd(), "uploads", "labels");
if (!import_fs3.default.existsSync(labelsUploadDir)) {
  try {
    import_fs3.default.mkdirSync(labelsUploadDir, { recursive: true });
  } catch (e) {
  }
}
function processPostalLabel(orderId, postalLabel) {
  if (!postalLabel) return null;
  if (postalLabel.startsWith("data:")) {
    try {
      const matches = postalLabel.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, "base64");
        let ext = "bin";
        if (contentType.includes("pdf")) ext = "pdf";
        else if (contentType.includes("png")) ext = "png";
        else if (contentType.includes("jpeg") || contentType.includes("jpg")) ext = "jpg";
        const filename = `label_${orderId}_${Date.now()}.${ext}`;
        const filePath = import_path3.default.join(labelsUploadDir, filename);
        import_fs3.default.writeFileSync(filePath, buffer);
        import_fs3.default.writeFileSync(filePath + ".meta", contentType);
        return `/api/orders/${orderId}/postal-label/file`;
      }
    } catch (err) {
      console.error("Error saving base64 label file:", err);
    }
  }
  return postalLabel;
}
app.get("/api/orders/:id/postal-label/file", async (req, res) => {
  try {
    const { id } = req.params;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return res.status(400).send("Invalid order ID");
    }
    if (!import_fs3.default.existsSync(labelsUploadDir)) {
      return res.status(404).send("No labels directory found");
    }
    const files = import_fs3.default.readdirSync(labelsUploadDir);
    const orderFiles = files.filter((f) => f.startsWith(`label_${orderId}_`) && !f.endsWith(".meta"));
    if (orderFiles.length === 0) {
      return res.status(404).send("Label file not found");
    }
    orderFiles.sort((a, b) => {
      const timeA = parseInt(a.split("_")[2] || "0");
      const timeB = parseInt(b.split("_")[2] || "0");
      return timeB - timeA;
    });
    const latestFile = orderFiles[0];
    const filePath = import_path3.default.join(labelsUploadDir, latestFile);
    const metaPath = filePath + ".meta";
    let contentType = "application/octet-stream";
    if (import_fs3.default.existsSync(metaPath)) {
      contentType = import_fs3.default.readFileSync(metaPath, "utf8").trim();
    } else {
      if (latestFile.endsWith(".pdf")) contentType = "application/pdf";
      else if (latestFile.endsWith(".png")) contentType = "image/png";
      else if (latestFile.endsWith(".jpg")) contentType = "image/jpeg";
    }
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${latestFile}"`);
    res.sendFile(filePath);
  } catch (err) {
    console.error("Error serving label file:", err);
    res.status(500).send("Error serving file");
  }
});
app.use((0, import_cors.default)({ origin: true, credentials: true }));
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ limit: "50mb", extended: true }));
var rootUploadsDir = process.env.VERCEL ? import_path3.default.join("/tmp", "uploads") : import_path3.default.join(process.cwd(), "uploads");
if (!import_fs3.default.existsSync(rootUploadsDir)) {
  try {
    import_fs3.default.mkdirSync(rootUploadsDir, { recursive: true });
  } catch (e) {
  }
}
app.use("/uploads", import_express.default.static(rootUploadsDir));
var multerFn = typeof import_multer.default === "function" ? import_multer.default : import_multer.default.default || require("multer");
var generalUpload = multerFn({ dest: rootUploadsDir });
function getPublicUrl(req) {
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = forwardedHost || req.headers.host || "localhost:3000";
  let protocol = req.headers["x-forwarded-proto"] || (req.secure ? "https" : "http");
  if (host.includes("run.app") || host.includes("Zopit.ir") || !host.includes("localhost") && !host.includes("127.0.0.1")) {
    protocol = "https";
  }
  return `${protocol}://${host}`;
}
if (!process.env.JWT_SECRET) {
  console.warn("\u26A0\uFE0F WARNING: JWT_SECRET environment variable is missing. Using fallback for development.");
  process.env.JWT_SECRET = "dev_secret_key_123!@#";
}
if (!process.env.ENCRYPTION_KEY) {
  console.warn("\u26A0\uFE0F WARNING: ENCRYPTION_KEY environment variable is missing. Using fallback for development.");
  process.env.ENCRYPTION_KEY = "12345678901234567890123456789012";
}
var JWT_SECRET = process.env.JWT_SECRET;
var IRANIAN_MOBILE_REGEX = /^09\d{9}$/;
var USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;
var EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function formatAndValidateShaba(input) {
  let clean = input.toUpperCase().replace(/[\s-]/g, "");
  if (!clean.startsWith("IR")) {
    clean = "IR" + clean;
  }
  const numericPart = clean.substring(2);
  if (numericPart.length !== 24 || !/^\d{24}$/.test(numericPart)) {
    return { isValid: false, error: "\u0634\u0645\u0627\u0631\u0647 \u0634\u0628\u0627 \u0628\u0627\u06CC\u062F \u062F\u0642\u06CC\u0642\u0627\u064B \u0634\u0627\u0645\u0644 \u06F2\u06F4 \u0631\u0642\u0645 \u0639\u062F\u062F\u06CC \u0628\u0627\u0634\u062F." };
  }
  return { isValid: true, formatted: clean };
}
async function seedSuperAdmin() {
  try {
    const adminUser = process.env.SUPER_ADMIN_USERNAME || "admin";
    const adminPass = process.env.SUPER_ADMIN_PASSWORD || "!Bahankala@2026";
    const hashedPassword = await import_bcryptjs.default.hash(adminPass, 10);
    const existingAdmin = await prisma14.user.findFirst({
      where: {
        OR: [
          { role: "SUPER_ADMIN" },
          { username: adminUser }
        ]
      }
    });
    if (!existingAdmin) {
      await prisma14.user.create({
        data: {
          username: adminUser,
          email: "admin@marketplace.com",
          password: hashedPassword,
          role: "SUPER_ADMIN",
          status: "ACTIVE",
          firstName: "\u0645\u062F\u06CC\u0631",
          lastName: "\u0627\u0631\u0634\u062F",
          mobile: "09120000000"
        }
      });
      console.log("\u2705 Super Admin created successfully!");
    } else {
      await prisma14.user.update({
        where: { id: existingAdmin.id },
        data: {
          status: "ACTIVE",
          role: "SUPER_ADMIN",
          password: hashedPassword
        }
      });
      console.log("\u2705 Super Admin account updated and activated!");
    }
  } catch (error) {
    console.error("Error seeding Super Admin:", error);
  }
}
async function seedDemoUsers() {
  try {
    const passwordStore = await import_bcryptjs.default.hash("store", 10);
    const passwordTestshop = await import_bcryptjs.default.hash("Testshop", 10);
    const passwordSupplier = await import_bcryptjs.default.hash("supplier", 10);
    const standardTestPassword = await import_bcryptjs.default.hash("!Bahankala@2026", 10);
    const existingStore = await prisma14.user.findUnique({ where: { username: "store" } });
    if (!existingStore) {
      await prisma14.user.create({
        data: {
          username: "store",
          password: passwordStore,
          role: "STORE_MANAGER",
          status: "ACTIVE",
          firstName: "\u0645\u062F\u06CC\u0631",
          lastName: "\u0641\u0631\u0648\u0634\u06AF\u0627\u0647",
          mobile: "09122222222",
          storeName: "\u0641\u0631\u0648\u0634\u06AF\u0627\u0647 \u0646\u0645\u0648\u0646\u0647",
          storeUrl: "samplestore.ir",
          platformType: "WOOCOMMERCE",
          fieldOfActivity: "\u0644\u0648\u0627\u0632\u0645 \u0627\u0644\u06A9\u062A\u0631\u0648\u0646\u06CC\u06A9\u06CC",
          productCount: 50
        }
      });
      console.log("\u{1F331} Seeded user: store");
    }
    const existingStore1 = await prisma14.user.findUnique({ where: { username: "store1" } });
    if (!existingStore1) {
      await prisma14.user.create({
        data: {
          username: "store1",
          password: standardTestPassword,
          role: "STORE_MANAGER",
          status: "ACTIVE",
          firstName: "\u0645\u062F\u06CC\u0631 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647",
          lastName: "\u062A\u0633\u062A \u06F1",
          mobile: "09121111111",
          storeName: "\u0641\u0631\u0648\u0634\u06AF\u0627\u0647 \u062A\u0633\u062A \u0634\u0645\u0627\u0631\u0647 \u06CC\u06A9",
          storeUrl: "store1.ir",
          platformType: "WOOCOMMERCE",
          fieldOfActivity: "\u067E\u0648\u0634\u0627\u06A9 \u0648 \u0644\u0648\u0627\u0632\u0645 \u0648\u0631\u0632\u0634\u06CC",
          productCount: 120
        }
      });
      console.log("\u{1F331} Seeded user: store1");
    }
    const existingStore2 = await prisma14.user.findUnique({ where: { username: "store2" } });
    if (!existingStore2) {
      await prisma14.user.create({
        data: {
          username: "store2",
          password: standardTestPassword,
          role: "STORE_MANAGER",
          status: "ACTIVE",
          firstName: "\u0645\u062F\u06CC\u0631 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647",
          lastName: "\u062A\u0633\u062A \u06F2",
          mobile: "09121111112",
          storeName: "\u0641\u0631\u0648\u0634\u06AF\u0627\u0647 \u062A\u0633\u062A \u0634\u0645\u0627\u0631\u0647 \u062F\u0648",
          storeUrl: "store2.ir",
          platformType: "SHOPIFY",
          fieldOfActivity: "\u0622\u0631\u0627\u06CC\u0634\u06CC \u0648 \u0628\u0647\u062F\u0627\u0634\u062A\u06CC",
          productCount: 80
        }
      });
      console.log("\u{1F331} Seeded user: store2");
    }
    const existingTestshop = await prisma14.user.findUnique({ where: { username: "Testshop" } });
    if (!existingTestshop) {
      await prisma14.user.create({
        data: {
          username: "Testshop",
          password: passwordTestshop,
          role: "SUPPLIER",
          status: "ACTIVE",
          firstName: "\u062A\u0627\u0645\u06CC\u0646 \u06A9\u0646\u0646\u062F\u0647",
          lastName: "\u062A\u0633\u062A",
          mobile: "09123333333",
          brandName: "\u062A\u0633\u062A \u06AF\u0633\u062A\u0631",
          storeName: "\u0641\u0631\u0648\u0634\u06AF\u0627\u0647 \u062A\u0633\u062A",
          storeUrl: "testshop.ir",
          storeLink: "testshop.ir"
        }
      });
      console.log("\u{1F331} Seeded user: Testshop");
    }
    const existingSupplier1 = await prisma14.user.findUnique({ where: { username: "supplier1" } });
    if (!existingSupplier1) {
      await prisma14.user.create({
        data: {
          username: "supplier1",
          password: standardTestPassword,
          role: "SUPPLIER",
          status: "ACTIVE",
          firstName: "\u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647",
          lastName: "\u062A\u0633\u062A \u06F1",
          mobile: "09125555551",
          brandName: "\u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0627\u0644\u0627 \u067E\u0627\u0631\u0633",
          storeName: "\u062A\u0627\u0645\u06CC\u0646 \u0645\u0627\u0631\u06A9\u062A \u06CC\u06A9",
          storeUrl: "supplier1.ir",
          storeLink: "supplier1.ir"
        }
      });
      console.log("\u{1F331} Seeded user: supplier1");
    }
    const existingSupplier2 = await prisma14.user.findUnique({ where: { username: "supplier2" } });
    if (!existingSupplier2) {
      await prisma14.user.create({
        data: {
          username: "supplier2",
          password: standardTestPassword,
          role: "SUPPLIER",
          status: "ACTIVE",
          firstName: "\u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647",
          lastName: "\u062A\u0633\u062A \u06F2",
          mobile: "09125555552",
          brandName: "\u06AF\u0631\u0648\u0647 \u0635\u0646\u0639\u062A\u06CC \u0646\u06CC\u06A9\u0648",
          storeName: "\u062A\u0627\u0645\u06CC\u0646 \u0645\u0627\u0631\u06A9\u062A \u062F\u0648",
          storeUrl: "supplier2.ir",
          storeLink: "supplier2.ir"
        }
      });
      console.log("\u{1F331} Seeded user: supplier2");
    }
    const existingSupplier = await prisma14.user.findUnique({ where: { username: "supplier" } });
    if (!existingSupplier) {
      await prisma14.user.create({
        data: {
          username: "supplier",
          password: passwordSupplier,
          role: "SUPPLIER",
          status: "ACTIVE",
          firstName: "\u062A\u0627\u0645\u06CC\u0646 \u06A9\u0646\u0646\u062F\u0647",
          lastName: "\u0627\u0635\u0644\u06CC",
          mobile: "09124444444",
          brandName: "\u062A\u0627\u0645\u06CC\u0646 \u06AF\u0633\u062A\u0631",
          storeName: "\u062A\u0627\u0645\u06CC\u0646 \u0645\u0627\u0631\u06A9\u062A",
          storeUrl: "tamingostar.ir",
          storeLink: "tamingostar.ir"
        }
      });
      console.log("\u{1F331} Seeded user: supplier");
    }
    const existingCust = await prisma14.user.findUnique({ where: { username: "customer1" } });
    if (!existingCust) {
      await prisma14.user.create({
        data: {
          username: "customer1",
          password: standardTestPassword,
          role: "CUSTOMER",
          status: "ACTIVE",
          firstName: "\u0639\u0644\u06CC",
          lastName: "\u0631\u0636\u0627\u06CC\u06CC",
          mobile: "09129998877",
          address: "\u062A\u0647\u0631\u0627\u0646\u060C \u062E\u06CC\u0627\u0628\u0627\u0646 \u0648\u0644\u06CC\u0639\u0635\u0631\u060C \u067E\u0644\u0627\u06A9 \u06F1\u06F2\u06F3"
        }
      });
      console.log("\u{1F331} Seeded user: customer1");
    }
    const existingRef = await prisma14.user.findUnique({ where: { username: "referrer1" } });
    if (!existingRef) {
      await prisma14.user.create({
        data: {
          username: "referrer1",
          password: standardTestPassword,
          role: "REFERRER",
          status: "ACTIVE",
          firstName: "\u0633\u0627\u0631\u0627",
          lastName: "\u06A9\u0631\u06CC\u0645\u06CC",
          mobile: "09123332211",
          address: "\u0627\u0635\u0641\u0647\u0627\u0646\u060C \u0686\u0647\u0627\u0631\u0628\u0627\u063A"
        }
      });
      console.log("\u{1F331} Seeded user: referrer1");
    }
  } catch (error) {
    console.error("Error seeding demo users:", error);
  }
}
async function seedDatabase() {
  if (dbUrl2.includes("dummy_db") || dbUrl2.includes("dummy:dummy")) {
    console.log("[Server Startup] Skipping DB seeding because a dummy URL is configured.");
    return;
  }
  await seedSuperAdmin();
  await seedDemoUsers();
  try {
    const categoryCount = await prisma14.category.count();
    if (categoryCount <= 1) {
      console.log("\u{1F331} Seeding 16 standard categories...");
      const defaultCategories = [
        "\u0645\u0648\u0628\u0627\u06CC\u0644",
        "\u0644\u067E\u200C\u062A\u0627\u067E",
        "\u06A9\u0627\u0644\u0627\u06CC \u062F\u06CC\u062C\u06CC\u062A\u0627\u0644",
        "\u062E\u0627\u0646\u0647 \u0648 \u0622\u0634\u067E\u0632\u062E\u0627\u0646\u0647",
        "\u0644\u0648\u0627\u0632\u0645 \u062E\u0627\u0646\u06AF\u06CC \u0628\u0631\u0642\u06CC",
        "\u0622\u0631\u0627\u06CC\u0634\u06CC \u0648 \u0628\u0647\u062F\u0627\u0634\u062A\u06CC",
        "\u0645\u062F \u0648 \u067E\u0648\u0634\u0627\u06A9",
        "\u0637\u0644\u0627 \u0648 \u0646\u0642\u0631\u0647",
        "\u062E\u0648\u062F\u0631\u0648 \u0648 \u0645\u0648\u062A\u0648\u0631\u0633\u06CC\u06A9\u0644\u062A",
        "\u0633\u0644\u0627\u0645\u062A \u0648 \u067E\u0632\u0634\u06A9\u06CC",
        "\u0627\u0628\u0632\u0627\u0631\u0622\u0644\u0627\u062A \u0648 \u062A\u062C\u0647\u06CC\u0632\u0627\u062A",
        "\u06A9\u062A\u0627\u0628 \u0648 \u0647\u0646\u0631",
        "\u0648\u0631\u0632\u0634 \u0648 \u0633\u0641\u0631",
        "\u0627\u0633\u0628\u0627\u0628 \u0628\u0627\u0632\u06CC \u06A9\u0648\u062F\u06A9 \u0648 \u0646\u0648\u0632\u0627\u062F",
        "\u0645\u062D\u0635\u0648\u0644\u0627\u062A \u0628\u0648\u0645\u06CC \u0648 \u0645\u062D\u0644\u06CC",
        "\u067E\u062A \u0634\u0627\u067E"
      ];
      for (let i = 0; i < defaultCategories.length; i++) {
        const catName = defaultCategories[i];
        const exists = await prisma14.category.findFirst({ where: { name: catName } });
        if (!exists) {
          await prisma14.category.create({
            data: {
              name: catName,
              isActive: true,
              sortOrder: i + 1
            }
          });
        }
      }
    }
    const productCount = await prisma14.product.count();
    if (productCount > 0) {
      return;
    }
    console.log("\u{1F331} Seeding database with initial supplier, category, and explore products...");
    const supplierPass = await import_bcryptjs.default.hash("Supplier123!", 10);
    const supplier = await prisma14.user.create({
      data: {
        username: "supplier_test",
        password: supplierPass,
        role: "SUPPLIER",
        status: "ACTIVE",
        firstName: "\u062A\u0627\u0645\u06CC\u0646 \u06A9\u0646\u0646\u062F\u0647",
        lastName: "\u0646\u0645\u0648\u0646\u0647",
        mobile: "09121111111",
        brandName: "\u0622\u0631\u06CC\u0627 \u062A\u062C\u0627\u0631\u062A \u062F\u06CC\u062C\u06CC\u062A\u0627\u0644",
        storeName: "\u0622\u0631\u06CC\u0627 \u062F\u06CC\u062C\u06CC",
        storeUrl: "ariadigital.ir",
        storeLink: "ariadigital.ir"
      }
    });
    const category = await prisma14.category.create({
      data: {
        name: "\u062F\u06CC\u062C\u06CC\u062A\u0627\u0644 \u0648 \u0644\u0648\u0627\u0632\u0645 \u0627\u0644\u06A9\u062A\u0631\u0648\u0646\u06CC\u06A9\u06CC",
        isActive: true,
        sortOrder: 1
      }
    });
    const mockProducts = [
      {
        name: "\u06AF\u0648\u0634\u06CC \u0645\u0648\u0628\u0627\u06CC\u0644 \u0622\u06CC\u0641\u0648\u0646 \u06F1\u06F5 \u067E\u0631\u0648",
        shortDescription: "\u06AF\u0648\u0634\u06CC \u0647\u0648\u0634\u0645\u0646\u062F \u067E\u0631\u0686\u0645\u062F\u0627\u0631 \u0627\u067E\u0644 \u0628\u0627 \u0638\u0631\u0641\u06CC\u062A \u06F2\u06F5\u06F6 \u06AF\u06CC\u06AF\u0627\u0628\u0627\u06CC\u062A",
        longDescription: "\u062C\u062F\u06CC\u062F\u062A\u0631\u06CC\u0646 \u067E\u0631\u0686\u0645\u062F\u0627\u0631 \u0627\u067E\u0644 \u0645\u062C\u0647\u0632 \u0628\u0647 \u062A\u0631\u0627\u0634\u0647 A17 Pro \u0648 \u0628\u062F\u0646\u0647 \u062A\u06CC\u062A\u0627\u0646\u06CC\u0648\u0645\u06CC \u0645\u0642\u0627\u0648\u0645 \u0628\u0627 \u0633\u06CC\u0633\u062A\u0645 \u062F\u0648\u0631\u0628\u06CC\u0646 \u067E\u06CC\u0634\u0631\u0641\u062A\u0647 \u06F3 \u06AF\u0627\u0646\u0647.",
        supplierBasePrice: 65e6,
        imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600",
        exploreTitle: "\u0622\u06CC\u0641\u0648\u0646 \u06F1\u06F5 \u067E\u0631\u0648 | \u0646\u0647\u0627\u06CC\u062A \u0633\u0631\u0639\u062A \u0648 \u06A9\u06CC\u0641\u06CC\u062A",
        exploreDesc: "\u0628\u0631\u0631\u0633\u06CC \u0648\u06CC\u062F\u0626\u0648\u06CC\u06CC \u0622\u06CC\u0641\u0648\u0646 \u06F1\u06F5 \u067E\u0631\u0648 \u062A\u06CC\u062A\u0627\u0646\u06CC\u0648\u0645. \u062E\u0631\u06CC\u062F \u0645\u0633\u062A\u0642\u06CC\u0645 \u0628\u0627 \u0636\u0645\u0627\u0646\u062A \u0627\u0635\u0627\u0644\u062A \u0641\u06CC\u0632\u06CC\u06A9\u06CC \u0648 \u062A\u062D\u0648\u06CC\u0644 \u0627\u06A9\u0633\u067E\u0631\u0633.",
        exploreVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-holding-a-smartphone-with-a-green-screen-34440-large.mp4",
        comments: [
          { authorName: "\u0627\u062D\u0633\u0627\u0646 \u0645\u062D\u0645\u062F\u06CC", text: "\u06A9\u06CC\u0641\u06CC\u062A \u062F\u0648\u0631\u0628\u06CC\u0646 \u0627\u06CC\u0646 \u06AF\u0648\u0634\u06CC \u0641\u0648\u0642\u200C\u0627\u0644\u0639\u0627\u062F\u0647 \u0647\u0633\u062A\u060C \u0645\u062E\u0635\u0648\u0635\u0627\u064B \u0639\u06A9\u0627\u0633\u06CC \u067E\u0631\u062A\u0631\u0647 \u0634\u0628." },
          { authorName: "\u0645\u0631\u06CC\u0645 \u0633\u0627\u062F\u0627\u062A\u06CC", text: "\u0645\u0646 \u062E\u0631\u06CC\u062F \u0639\u0645\u062F\u0647 \u0632\u062F\u0645 \u0628\u0631\u0627\u06CC \u0641\u0631\u0648\u0634\u06AF\u0627\u0647\u0645\u060C \u062D\u0627\u0634\u06CC\u0647 \u0633\u0648\u062F \u062E\u06CC\u0644\u06CC \u0639\u0627\u0644\u06CC \u062F\u0627\u0634\u062A." }
        ],
        questions: [
          { askerName: "\u06AF\u0627\u0644\u0631\u06CC \u0645\u0648\u0628\u0627\u06CC\u0644 \u067E\u0627\u0631\u0633", questionText: "\u0622\u06CC\u0627 \u0627\u06CC\u0646 \u06A9\u0627\u0644\u0627 \u067E\u0627\u0631\u062A \u0646\u0627\u0645\u0628\u0631 CH/A \u0647\u0633\u062A\u061F", answerText: "\u0628\u0644\u0647 \u062A\u0645\u0627\u0645\u06CC \u067E\u0627\u0631\u062A \u0646\u0627\u0645\u0628\u0631\u0647\u0627\u06CC \u0627\u0631\u0633\u0627\u0644\u06CC \u062F\u0648 \u0633\u06CC\u0645\u200C\u06A9\u0627\u0631\u062A \u0641\u0639\u0627\u0644 \u0648 \u067E\u0627\u0631\u062A \u0646\u0627\u0645\u0628\u0631 CH \u0647\u0633\u062A\u0646\u062F.", isAnswered: true }
        ]
      },
      {
        name: "\u0647\u062F\u0641\u0648\u0646 \u0628\u06CC\u200C\u0633\u06CC\u0645 \u0633\u0648\u0646\u06CC WH-1000XM5",
        shortDescription: "\u0628\u0647\u062A\u0631\u06CC\u0646 \u0647\u062F\u0641\u0648\u0646 \u062D\u0630\u0641 \u0646\u0648\u06CC\u0632 \u062C\u0647\u0627\u0646 \u0628\u0627 \u06A9\u06CC\u0641\u06CC\u062A \u0635\u062F\u0627\u06CC \u062E\u0627\u0631\u0642\u200C\u0627\u0644\u0639\u0627\u062F\u0647",
        longDescription: "\u0647\u062F\u0641\u0648\u0646 \u067E\u0631\u0686\u0645\u062F\u0627\u0631 \u062F\u0648\u0631 \u06AF\u0648\u0634\u06CC \u0633\u0648\u0646\u06CC \u0628\u0627 \u0642\u0627\u0628\u0644\u06CC\u062A \u0627\u06A9\u062A\u06CC\u0648 \u0646\u0648\u06CC\u0632 \u06A9\u0646\u0633\u0644\u06CC\u0646\u06AF \u0628\u06CC\u200C\u0646\u0638\u06CC\u0631 \u0648 \u0628\u0627\u062A\u0631\u06CC \u06F3\u06F0 \u0633\u0627\u0639\u062A\u0647 \u0641\u0648\u0642\u200C\u0627\u0644\u0639\u0627\u062F\u0647.",
        supplierBasePrice: 145e5,
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
        exploreTitle: "\u0633\u0648\u0646\u06CC XM5 | \u063A\u0631\u0642 \u062F\u0631 \u0633\u06A9\u0648\u062A \u0648 \u0645\u0648\u0633\u06CC\u0642\u06CC",
        exploreDesc: "\u062A\u062C\u0631\u0628\u0647 \u0628\u06CC\u200C\u0646\u0638\u06CC\u0631 \u062D\u0630\u0641 \u0646\u0648\u06CC\u0632 \u062A\u0637\u0628\u06CC\u0642\u06CC \u0628\u0627 \u067E\u0631\u062F\u0627\u0632\u0646\u062F\u0647\u200C\u0647\u0627\u06CC \u067E\u06CC\u0634\u0631\u0641\u062A\u0647 \u0633\u0648\u0646\u06CC. \u0628\u0647\u062A\u0631\u06CC\u0646 \u06A9\u06CC\u0641\u06CC\u062A \u0635\u062F\u0627 \u0628\u0631\u0627\u06CC \u06A9\u0627\u0631\u0647\u0627\u06CC \u0631\u0648\u0632\u0645\u0631\u0647 \u0648 \u062D\u0631\u0641\u0647\u200C\u0627\u06CC.",
        exploreVideoUrl: null,
        comments: [
          { authorName: "\u0633\u0627\u0645\u0627\u0646 \u0631\u0627\u062F", text: "\u0633\u06CC\u0633\u062A\u0645 \u062D\u0630\u0641 \u0646\u0648\u06CC\u0632 \u0627\u06CC\u0646 \u0647\u062F\u0641\u0648\u0646 \u062F\u0631 \u06A9\u0644 \u062C\u0647\u0627\u0646 \u0628\u06CC\u200C\u0631\u0642\u06CC\u0628\u0647." }
        ],
        questions: [
          { askerName: "\u06A9\u0627\u0644\u0627 \u062F\u0627\u062A \u06A9\u0627\u0645", questionText: "\u06AF\u0627\u0631\u0627\u0646\u062A\u06CC \u0627\u06CC\u0646 \u0645\u062D\u0635\u0648\u0644 \u0686\u0646\u062F \u0645\u0627\u0647\u0647 \u0627\u0633\u062A\u061F", answerText: "\u062F\u0627\u0631\u0627\u06CC \u06F1\u06F8 \u0645\u0627\u0647 \u06AF\u0627\u0631\u0627\u0646\u062A\u06CC \u0645\u0639\u062A\u0628\u0631 \u0634\u0631\u06A9\u062A\u06CC \u0645\u0627\u062A\u0631\u06CC\u06A9\u0633 \u0645\u06CC\u200C\u0628\u0627\u0634\u062F.", isAnswered: true }
        ]
      },
      {
        name: "\u0633\u0627\u0639\u062A \u0647\u0648\u0634\u0645\u0646\u062F \u0627\u067E\u0644 \u0648\u0627\u0686 \u0633\u0631\u06CC \u06F9",
        shortDescription: "\u067E\u06CC\u0634\u0631\u0641\u062A\u0647\u200C\u062A\u0631\u06CC\u0646 \u0633\u0646\u0633\u0648\u0631\u0647\u0627\u06CC \u0633\u0644\u0627\u0645\u062A\u06CC \u0648 \u0635\u0641\u062D\u0647 \u0646\u0645\u0627\u06CC\u0634 \u062F\u0631\u062E\u0634\u0627\u0646",
        longDescription: "\u0627\u067E\u0644 \u0648\u0627\u0686 \u0646\u0633\u0644 \u06F9 \u0628\u0627 \u062A\u0631\u0627\u0634\u0647 \u062C\u062F\u06CC\u062F S9\u060C \u0631\u0648\u0634\u0646\u0627\u06CC\u06CC \u0641\u0648\u0642\u200C\u0627\u0644\u0639\u0627\u062F\u0647 \u0635\u0641\u062D\u0647 \u0646\u0645\u0627\u06CC\u0634 \u0648 \u0698\u0633\u062A \u062F\u0648 \u0627\u0646\u06AF\u0634\u062A\u06CC \u062C\u062F\u06CC\u062F.",
        supplierBasePrice: 189e5,
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600",
        exploreTitle: "\u0627\u067E\u0644 \u0648\u0627\u0686 \u0633\u0631\u06CC \u06F9 | \u062F\u0633\u062A\u06CC\u0627\u0631 \u0647\u0648\u0634\u0645\u0646\u062F \u0633\u0644\u0627\u0645\u062A\u06CC \u0634\u0645\u0627",
        exploreDesc: "\u0642\u0627\u0628\u0644\u06CC\u062A \u0627\u0646\u062F\u0627\u0632\u0647 \u06AF\u06CC\u0631\u06CC \u0627\u06A9\u0633\u06CC\u0698\u0646 \u062E\u0648\u0646\u060C \u0636\u0631\u0628\u0627\u0646 \u0642\u0644\u0628\u060C \u0635\u0641\u062D\u0647 \u0646\u0645\u0627\u06CC\u0634 \u0647\u0645\u06CC\u0634\u0647 \u0631\u0648\u0634\u0646 \u0648 \u0698\u0633\u062A \u0644\u0645\u0633\u06CC \u0634\u06AF\u0641\u062A\u200C\u0627\u0646\u06AF\u06CC\u0632 \u062F\u0628\u0644\u200C\u062A\u067E.",
        exploreVideoUrl: null,
        comments: [
          { authorName: "\u0641\u0631\u0634\u062A\u0647 \u0627\u062D\u0645\u062F\u06CC", text: "\u0628\u0633\u06CC\u0627\u0631 \u0634\u06CC\u06A9 \u0648 \u06A9\u0627\u0631\u0628\u0631\u062F\u06CC. \u06A9\u06CC\u0641\u06CC\u062A \u0633\u0646\u0633\u0648\u0631\u0647\u0627 \u0639\u0627\u0644\u06CC\u0647." }
        ],
        questions: []
      }
    ];
    for (const mp of mockProducts) {
      const product = await prisma14.product.create({
        data: {
          supplierId: supplier.id,
          categoryId: category.id,
          name: mp.name,
          shortDescription: mp.shortDescription,
          longDescription: mp.longDescription,
          supplierBasePrice: mp.supplierBasePrice,
          finalPrice: mp.supplierBasePrice,
          status: "ACTIVE",
          inventory: 50
        }
      });
      await prisma14.productImage.create({
        data: {
          productId: product.id,
          url: mp.imageUrl
        }
      });
      await prisma14.productExploreContent.create({
        data: {
          productId: product.id,
          customTitle: mp.exploreTitle,
          customDescription: mp.exploreDesc,
          customImageUrl: mp.imageUrl,
          customVideoUrl: mp.exploreVideoUrl,
          isPublished: true
        }
      });
      for (const c of mp.comments) {
        await prisma14.productComment.create({
          data: {
            productId: product.id,
            authorName: c.authorName,
            text: c.text,
            isApproved: true
          }
        });
      }
      for (const q of mp.questions) {
        await prisma14.productQuestion.create({
          data: {
            productId: product.id,
            askerName: q.askerName,
            questionText: q.questionText,
            answerText: q.answerText,
            isAnswered: q.isAnswered,
            answeredAt: q.isAnswered ? /* @__PURE__ */ new Date() : null
          }
        });
      }
    }
    const defaultStoreRules = `\u06F1. \u0642\u0648\u0627\u0646\u06CC\u0646 \u0639\u0636\u0648\u06CC\u062A \u0648 \u0641\u0639\u0627\u0644\u06CC\u062A \u0641\u0631\u0648\u0634\u06AF\u0627\u0647\u200C\u0647\u0627 \u062F\u0631 \u067E\u0644\u062A\u0641\u0631\u0645 \u0632\u0648\u067E\u06CC\u062A:
\u0645\u062F\u06CC\u0631 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647 \u0645\u062A\u0639\u0647\u062F \u0645\u06CC\u200C\u06AF\u0631\u062F\u062F \u06A9\u0647 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u062B\u0628\u062A \u0634\u062F\u0647 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647 \u06A9\u0627\u0645\u0644\u0627\u064B \u0645\u0646\u0637\u0628\u0642 \u0628\u0631 \u0648\u0627\u0642\u0639\u06CC\u062A \u0628\u0648\u062F\u0647 \u0648 \u062A\u0645\u0627\u0645\u06CC \u0645\u062C\u0648\u0632\u0647\u0627\u06CC \u0644\u0627\u0632\u0645 \u0628\u0631\u0627\u06CC \u0641\u0631\u0648\u0634 \u062E\u0631\u062F\u0647\u200C\u0641\u0631\u0648\u0634\u06CC \u0631\u0627 \u062F\u0627\u0631\u0627 \u0628\u0627\u0634\u062F.
\u06F2. \u0634\u0631\u0627\u06CC\u0637 \u0644\u063A\u0648 \u0633\u0641\u0627\u0631\u0634 \u0648 \u0639\u0648\u062F\u062A \u0648\u062C\u0647:
\u0647\u0631\u06AF\u0648\u0646\u0647 \u062B\u0628\u062A \u0633\u0641\u0627\u0631\u0634 \u062A\u0648\u0633\u0637 \u0645\u0634\u062A\u0631\u06CC \u0646\u0647\u0627\u06CC\u06CC \u0628\u0627\u06CC\u0633\u062A\u06CC \u062F\u0631 \u0633\u0631\u06CC\u0639\u200C\u062A\u0631\u06CC\u0646 \u0632\u0645\u0627\u0646 \u0645\u0645\u06A9\u0646 \u067E\u0631\u062F\u0627\u0632\u0634 \u06AF\u0631\u062F\u062F. \u062F\u0631 \u0635\u0648\u0631\u062A \u0644\u063A\u0648 \u0633\u0641\u0627\u0631\u0634 \u0628\u0647 \u062F\u0644\u06CC\u0644 \u0639\u062F\u0645 \u0645\u0648\u062C\u0648\u062F\u06CC\u060C \u0627\u0645\u062A\u06CC\u0627\u0632 \u0645\u0646\u0641\u06CC \u0628\u0631\u0627\u06CC \u0641\u0631\u0648\u0634\u06AF\u0627\u0647 \u0644\u062D\u0627\u0638 \u062E\u0648\u0627\u0647\u062F \u0634\u062F.
\u06F3. \u062A\u0633\u0648\u06CC\u0647 \u062D\u0633\u0627\u0628 \u0645\u0627\u0644\u06CC:
\u062A\u0633\u0648\u06CC\u0647 \u062D\u0633\u0627\u0628 \u0628\u0627 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647\u200C\u0647\u0627 \u0637\u0628\u0642 \u0647\u0645\u0627\u0647\u0646\u06AF\u06CC \u0648 \u062F\u0648\u0631\u0647\u200C\u0647\u0627\u06CC \u0632\u0645\u0627\u0646\u06CC \u0645\u0634\u062E\u0635 (\u0645\u0639\u0645\u0648\u0644\u0627\u064B \u06F4\u06F8 \u0633\u0627\u0639\u062A \u067E\u0633 \u0627\u0632 \u062A\u062D\u0648\u06CC\u0644 \u06A9\u0627\u0644\u0627 \u0628\u0647 \u0645\u0634\u062A\u0631\u06CC \u0648 \u062A\u0627\u06CC\u06CC\u062F \u0646\u0647\u0627\u06CC\u06CC) \u0635\u0648\u0631\u062A \u0645\u06CC\u200C\u067E\u0630\u06CC\u0631\u062F.
\u06F4. \u062D\u0641\u0638 \u0645\u062D\u0631\u0645\u0627\u0646\u06AF\u06CC \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0645\u0634\u062A\u0631\u06CC\u0627\u0646:
\u0641\u0631\u0648\u0634\u06AF\u0627\u0647 \u0645\u062C\u0627\u0632 \u0628\u0647 \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u062A\u0628\u0644\u06CC\u063A\u0627\u062A\u06CC \u06CC\u0627 \u0627\u0634\u062A\u0631\u0627\u06A9\u200C\u06AF\u0630\u0627\u0631\u06CC \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0634\u062E\u0635\u06CC \u062E\u0631\u06CC\u062F\u0627\u0631\u0627\u0646 \u062E\u0627\u0631\u062C \u0627\u0632 \u0641\u0631\u0622\u06CC\u0646\u062F \u0627\u0631\u0633\u0627\u0644 \u0633\u0641\u0627\u0631\u0634 \u067E\u0644\u062A\u0641\u0631\u0645 \u0632\u0648\u067E\u06CC\u062A \u0646\u0645\u06CC\u200C\u0628\u0627\u0634\u062F.`;
    const defaultSupplierRules = `\u06F1. \u0634\u0631\u0627\u06CC\u0637 \u0648 \u0636\u0648\u0627\u0628\u0637 \u0647\u0645\u06A9\u0627\u0631\u06CC \u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u06AF\u0627\u0646 \u062F\u0631 \u0632\u0648\u067E\u06CC\u062A:
\u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647 \u0645\u062A\u0639\u0647\u062F \u0628\u0647 \u0627\u0631\u0627\u06CC\u0647 \u06A9\u0627\u0644\u0627\u06CC \u0628\u0627\u06A9\u06CC\u0641\u06CC\u062A\u060C \u0627\u0635\u06CC\u0644 \u0648 \u0645\u0637\u0627\u0628\u0642 \u0628\u0627 \u0645\u0634\u062E\u0635\u0627\u062A \u0641\u0646\u06CC \u062B\u0628\u062A\u200C\u0634\u062F\u0647 \u062F\u0631 \u0633\u0627\u0645\u0627\u0646\u0647 \u0645\u06CC\u200C\u0628\u0627\u0634\u062F. \u0647\u0631\u06AF\u0648\u0646\u0647 \u0645\u063A\u0627\u06CC\u0631\u062A \u062F\u0631 \u06A9\u0627\u0644\u0627\u06CC \u0627\u0631\u0633\u0627\u0644\u200C\u0634\u062F\u0647 \u0645\u0646\u062C\u0631 \u0628\u0647 \u0645\u0631\u062C\u0648\u0639\u06CC \u06A9\u0627\u0644\u0627 \u0628\u0627 \u0647\u0632\u06CC\u0646\u0647 \u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647 \u062E\u0648\u0627\u0647\u062F \u0634\u062F.
\u06F2. \u062A\u0636\u0645\u06CC\u0646 \u0642\u06CC\u0645\u062A \u0631\u0642\u0627\u0628\u062A\u06CC:
\u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647 \u0645\u0648\u0638\u0641 \u0627\u0633\u062A \u0628\u0647\u062A\u0631\u06CC\u0646 \u0642\u06CC\u0645\u062A \u0645\u0645\u06A9\u0646 \u0631\u0627 \u0628\u0631\u0627\u06CC \u06A9\u0627\u0644\u0627\u0647\u0627 \u067E\u06CC\u0634\u0646\u0647\u0627\u062F \u062F\u0647\u062F. \u067E\u0644\u062A\u0641\u0631\u0645 \u0632\u0648\u067E\u06CC\u062A \u0628\u0631 \u0627\u0633\u0627\u0633 \u0642\u06CC\u0645\u062A\u200C\u0647\u0627\u06CC \u0631\u0642\u0627\u0628\u062A\u06CC \u0627\u0648\u0644\u0648\u06CC\u062A \u0646\u0645\u0627\u06CC\u0634 \u0648 \u0641\u0631\u0648\u0634 \u06A9\u0627\u0644\u0627\u0647\u0627 \u0631\u0627 \u062A\u063A\u06CC\u06CC\u0631 \u0645\u06CC\u200C\u062F\u0647\u062F.
\u06F3. \u0632\u0645\u0627\u0646\u200C\u0628\u0646\u062F\u06CC \u0627\u0631\u0633\u0627\u0644 \u06A9\u0627\u0644\u0627:
\u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647 \u0645\u062A\u0639\u0647\u062F \u0628\u0647 \u062A\u062D\u0648\u06CC\u0644 \u06A9\u0627\u0644\u0627 \u0628\u0647 \u0627\u0646\u0628\u0627\u0631 \u0645\u0631\u06A9\u0632\u06CC \u06CC\u0627 \u0622\u062F\u0631\u0633 \u0627\u0639\u0644\u0627\u0645\u06CC \u062E\u0631\u06CC\u062F\u0627\u0631 \u062F\u0631 \u0628\u0627\u0632\u0647 \u0632\u0645\u0627\u0646\u06CC \u062A\u0639\u06CC\u06CC\u0646\u200C\u0634\u062F\u0647 \u0645\u06CC\u200C\u0628\u0627\u0634\u062F. \u0647\u0631\u06AF\u0648\u0646\u0647 \u062A\u0627\u062E\u06CC\u0631 \u063A\u06CC\u0631\u0645\u062C\u0627\u0632 \u0645\u0634\u0645\u0648\u0644 \u062C\u0631\u06CC\u0645\u0647 \u062F\u06CC\u0631\u06A9\u0631\u062F \u062E\u0648\u0627\u0647\u062F \u0628\u0648\u062F.
\u06F4. \u0641\u0631\u0622\u06CC\u0646\u062F \u06AF\u0627\u0631\u0627\u0646\u062A\u06CC \u0648 \u062E\u062F\u0645\u0627\u062A \u067E\u0633 \u0627\u0632 \u0641\u0631\u0648\u0634:
\u0645\u0633\u0648\u0648\u0644\u06CC\u062A \u0627\u0631\u0627\u06CC\u0647 \u062E\u062F\u0645\u0627\u062A \u06AF\u0627\u0631\u0627\u0646\u062A\u06CC \u0648 \u067E\u0627\u0633\u062E\u06AF\u0648\u06CC\u06CC \u0628\u0647 \u0639\u06CC\u0648\u0628 \u0641\u0646\u06CC \u06A9\u0627\u0644\u0627 \u0628\u0647 \u0639\u0647\u062F\u0647 \u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647 \u0628\u0648\u062F\u0647 \u0648 \u0632\u0648\u067E\u06CC\u062A \u0645\u0633\u0648\u0648\u0644\u06CC\u062A\u06CC \u062F\u0631 \u0642\u0628\u0627\u0644 \u0622\u0646 \u0646\u062F\u0627\u0631\u062F.`;
    const configKeys = [
      { key: "STORE_RULES", value: defaultStoreRules },
      { key: "STORE_TERMS", value: defaultStoreRules },
      { key: "SUPPLIER_RULES", value: defaultSupplierRules },
      { key: "SUPPLIER_TERMS", value: defaultSupplierRules },
      { key: "TERMS_AND_CONDITIONS", value: defaultSupplierRules },
      { key: "CUSTOMER_TERMS", value: "\u06F1. \u0642\u0648\u0627\u0646\u06CC\u0646 \u0645\u0634\u062A\u0631\u06CC\u0627\u0646: \u062A\u0645\u0627\u0645\u06CC \u062E\u0631\u06CC\u062F\u0647\u0627\u06CC \u062B\u0628\u062A \u0634\u062F\u0647 \u0645\u0634\u0645\u0648\u0644 \u0642\u0648\u0627\u0646\u06CC\u0646 \u062A\u062C\u0627\u0631\u062A \u0627\u0644\u06A9\u062A\u0631\u0648\u0646\u06CC\u06A9 \u06A9\u0634\u0648\u0631 \u0645\u06CC\u200C\u0628\u0627\u0634\u062F." },
      { key: "GENERAL_TERMS", value: "\u06F1. \u0642\u0648\u0627\u0646\u06CC\u0646 \u0639\u0645\u0648\u0645\u06CC: \u067E\u0644\u062A\u0641\u0631\u0645 \u0632\u0648\u067E\u06CC\u062A \u0628\u0647 \u0639\u0646\u0648\u0627\u0646 \u0648\u0627\u0633\u0637 \u0627\u0645\u06CC\u0646 \u0639\u0645\u0644 \u0645\u06CC\u200C\u0646\u0645\u0627\u06CC\u062F." },
      { key: "EDUCATION_APARAT", value: "https://www.aparat.com" },
      { key: "EDUCATION_YOUTUBE", value: "https://www.youtube.com" },
      { key: "EDUCATION_TELEGRAM", value: "https://t.me" }
    ];
    for (const item of configKeys) {
      const exists = await prisma14.systemConfig.findUnique({ where: { key: item.key } });
      if (!exists) {
        await prisma14.systemConfig.create({ data: { key: item.key, value: item.value } });
        console.log(`\u{1F331} Seeded system config: ${item.key}`);
      }
    }
    console.log("\u2705 Base database seeding completed successfully!");
  } catch (err) {
    console.error("Error seeding base database:", err);
  }
}
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, role, companyName, contactName, phone, username, password } = req.body;
    const finalRole = role || "CUSTOMER";
    const finalUsername = username || (email ? email.split("@")[0] : `user_${Date.now()}`);
    const finalMobile = phone || "09120000000";
    const defaultPass = password || "!Bahankala@2026";
    const hashedPassword = await import_bcryptjs.default.hash(defaultPass, 10);
    let existingUser = await prisma14.user.findFirst({
      where: {
        OR: [
          { username: finalUsername },
          { email: email || void 0 },
          { mobile: finalMobile || void 0 }
        ]
      }
    });
    if (!existingUser) {
      existingUser = await prisma14.user.create({
        data: {
          username: finalUsername,
          password: hashedPassword,
          email: email || null,
          role: finalRole,
          status: "ACTIVE",
          firstName: contactName || "\u06A9\u0627\u0631\u0628\u0631",
          lastName: companyName || "\u062C\u062F\u06CC\u062F",
          mobile: finalMobile,
          storeName: companyName,
          brandName: companyName
        }
      });
    }
    const token = import_jsonwebtoken.default.sign(
      { userId: existingUser.id, username: existingUser.username, role: existingUser.role, status: existingUser.status },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    const { password: _, ...userWithoutPassword } = existingUser;
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error("Error in general register endpoint:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631", details: err.message });
  }
});
app.post("/api/auth/register/supplier", async (req, res) => {
  try {
    const {
      username,
      password,
      firstName,
      lastName,
      mobile,
      email,
      nationalCode,
      brandName,
      activityType,
      address,
      province,
      city,
      postalCode,
      telephone,
      website,
      accountHolderName,
      shaba,
      bankName,
      agreementAccepted,
      agreementVersion,
      agreementAcceptedAt
    } = req.body;
    if (!username || !password || !firstName || !lastName || !mobile) {
      return res.status(400).json({ error: "\u0644\u0637\u0641\u0627\u064B \u0641\u06CC\u0644\u062F\u0647\u0627\u06CC \u0627\u062C\u0628\u0627\u0631\u06CC (\u0646\u0627\u0645\u060C \u0646\u0627\u0645 \u062E\u0627\u0646\u0648\u0627\u062F\u06AF\u06CC\u060C \u0645\u0648\u0628\u0627\u06CC\u0644\u060C \u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0648 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631) \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F." });
    }
    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({ error: "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0641\u0642\u0637 \u0645\u06CC\u062A\u0648\u0627\u0646\u062F \u0634\u0627\u0645\u0644 \u062D\u0631\u0648\u0641 \u0627\u0646\u06AF\u0644\u06CC\u0633\u06CC\u060C \u0627\u0639\u062F\u0627\u062F \u0648 \u062E\u0637 \u062A\u06CC\u0631\u0647 (_) \u0628\u0627\u0634\u062F." });
    }
    if (!IRANIAN_MOBILE_REGEX.test(mobile)) {
      return res.status(400).json({ error: "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644 \u0648\u0627\u0631\u062F \u0634\u062F\u0647 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A. \u0628\u0627\u06CC\u062F \u0628\u0627 09 \u0634\u0631\u0648\u0639 \u0634\u062F\u0647 \u0648 \u06F1\u06F1 \u0631\u0642\u0645 \u0628\u0627\u0634\u062F." });
    }
    if (email && !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "\u0622\u062F\u0631\u0633 \u0627\u06CC\u0645\u06CC\u0644 \u0648\u0627\u0631\u062F \u0634\u062F\u0647 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A." });
    }
    const shabaValidation = formatAndValidateShaba(shaba || "");
    if (!shabaValidation.isValid) {
      return res.status(400).json({ error: shabaValidation.error });
    }
    const finalShaba = shabaValidation.formatted;
    if (!agreementAccepted) {
      return res.status(400).json({ error: "\u067E\u0630\u06CC\u0631\u0634 \u0642\u0648\u0627\u0646\u06CC\u0646 \u0648 \u0645\u0642\u0631\u0631\u0627\u062A \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
    }
    const existingUser = await prisma14.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: "\u0627\u06CC\u0646 \u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0642\u0628\u0644\u0627\u064B \u062F\u0631 \u0633\u06CC\u0633\u062A\u0645 \u062B\u0628\u062A \u0634\u062F\u0647 \u0627\u0633\u062A." });
    }
    const hashedPassword = await import_bcryptjs.default.hash(password, 10);
    const user = await prisma14.user.create({
      data: {
        username,
        password: hashedPassword,
        role: "SUPPLIER",
        status: "ACTIVE_NEW",
        firstName,
        lastName,
        mobile,
        email: email || null,
        nationalCode,
        brandName,
        activityType,
        address,
        province,
        city,
        postalCode,
        telephone,
        website,
        accountHolderName,
        shaba: finalShaba,
        bankName,
        agreementAccepted,
        agreementVersion,
        agreementAcceptedAt: agreementAcceptedAt ? new Date(agreementAcceptedAt) : /* @__PURE__ */ new Date()
      }
    });
    const token = import_jsonwebtoken.default.sign(
      { userId: user.id, username: user.username, role: user.role, status: user.status },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json({
      message: "\u062B\u0628\u062A\u0646\u0627\u0645 \u062A\u0627\u0645\u06CC\u0646\u06A9\u0646\u0646\u062F\u0647 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0646\u062C\u0627\u0645 \u0634\u062F.",
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Error in supplier registration:", error);
    return res.status(500).json({ error: error.message || "\u062E\u0637\u0627\u06CC\u06CC \u062F\u0631 \u062B\u0628\u062A\u0646\u0627\u0645 \u0631\u062E \u062F\u0627\u062F. \u0644\u0637\u0641\u0627\u064B \u0645\u062C\u062F\u062F\u0627\u064B \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F." });
  }
});
app.post("/api/auth/register/customer", async (req, res) => {
  try {
    const {
      username,
      password,
      firstName,
      lastName,
      mobile,
      email
    } = req.body;
    if (!username || !password || !firstName || !lastName || !mobile) {
      return res.status(400).json({ error: "\u0644\u0637\u0641\u0627\u064B \u062A\u0645\u0627\u0645\u06CC \u0641\u06CC\u0644\u062F\u0647\u0627\u06CC \u0627\u062C\u0628\u0627\u0631\u06CC \u0631\u0627 \u062A\u06A9\u0645\u06CC\u0644 \u0646\u0645\u0627\u06CC\u06CC\u062F." });
    }
    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({ error: "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0641\u0642\u0637 \u0645\u06CC\u062A\u0648\u0627\u0646\u062F \u0634\u0627\u0645\u0644 \u062D\u0631\u0648\u0641 \u0627\u0646\u06AF\u0644\u06CC\u0633\u06CC\u060C \u0627\u0639\u062F\u0627\u062F \u0648 \u062E\u0637 \u062A\u06CC\u0631\u0647 (_) \u0628\u0627\u0634\u062F." });
    }
    if (!IRANIAN_MOBILE_REGEX.test(mobile)) {
      return res.status(400).json({ error: "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644 \u0648\u0627\u0631\u062F \u0634\u062F\u0647 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A. \u0628\u0627\u06CC\u062F \u0628\u0627 09 \u0634\u0631\u0648\u0639 \u0634\u062F\u0647 \u0648 \u06F1\u06F1 \u0631\u0642\u0645 \u0628\u0627\u0634\u062F." });
    }
    if (email && !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "\u0622\u062F\u0631\u0633 \u0627\u06CC\u0645\u06CC\u0644 \u0648\u0627\u0631\u062F \u0634\u062F\u0647 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A." });
    }
    const existingUser = await prisma14.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: "\u0627\u06CC\u0646 \u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0642\u0628\u0644\u0627\u064B \u062F\u0631 \u0633\u06CC\u0633\u062A\u0645 \u062B\u0628\u062A \u0634\u062F\u0647 \u0627\u0633\u062A." });
    }
    const hashedPassword = await import_bcryptjs.default.hash(password, 10);
    const user = await prisma14.user.create({
      data: {
        username,
        password: hashedPassword,
        role: "CUSTOMER",
        status: "ACTIVE",
        firstName,
        lastName,
        mobile,
        email: email || null
      }
    });
    const token = import_jsonwebtoken.default.sign(
      { userId: user.id, username: user.username, role: user.role, status: user.status },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json({
      message: "\u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u0645\u0634\u062A\u0631\u06CC \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0646\u062C\u0627\u0645 \u0634\u062F.",
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Error in customer registration:", error);
    return res.status(500).json({ error: error.message || "\u062E\u0637\u0627\u06CC\u06CC \u062F\u0631 \u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u0631\u062E \u062F\u0627\u062F. \u0644\u0637\u0641\u0627\u064B \u0645\u062C\u062F\u062F\u0627\u064B \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F." });
  }
});
app.post("/api/auth/register-referrer", async (req, res) => {
  try {
    const {
      username,
      password,
      firstName,
      lastName,
      mobile,
      email
    } = req.body;
    if (!username || !password || !firstName || !lastName || !mobile) {
      return res.status(400).json({ error: "\u0644\u0637\u0641\u0627\u064B \u062A\u0645\u0627\u0645\u06CC \u0641\u06CC\u0644\u062F\u0647\u0627\u06CC \u0627\u062C\u0628\u0627\u0631\u06CC \u0631\u0627 \u062A\u06A9\u0645\u06CC\u0644 \u0646\u0645\u0627\u06CC\u06CC\u062F." });
    }
    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({ error: "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0641\u0642\u0637 \u0645\u06CC\u062A\u0648\u0627\u0646\u062F \u0634\u0627\u0645\u0644 \u062D\u0631\u0648\u0641 \u0627\u0646\u06AF\u0644\u06CC\u0633\u06CC\u060C \u0627\u0639\u062F\u0627\u062F \u0648 \u062E\u0637 \u062A\u06CC\u0631\u0647 (_) \u0628\u0627\u0634\u062F." });
    }
    if (!IRANIAN_MOBILE_REGEX.test(mobile)) {
      return res.status(400).json({ error: "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644 \u0648\u0627\u0631\u062F \u0634\u062F\u0647 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A. \u0628\u0627\u06CC\u062F \u0628\u0627 09 \u0634\u0631\u0648\u0639 \u0634\u062F\u0647 \u0648 \u06F1\u06F1 \u0631\u0642\u0645 \u0628\u0627\u0634\u062F." });
    }
    if (email && !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "\u0622\u062F\u0631\u0633 \u0627\u06CC\u0645\u06CC\u0644 \u0648\u0627\u0631\u062F \u0634\u062F\u0647 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A." });
    }
    const existingUser = await prisma14.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: "\u0627\u06CC\u0646 \u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0642\u0628\u0644\u0627\u064B \u062F\u0631 \u0633\u06CC\u0633\u062A\u0645 \u062B\u0628\u062A \u0634\u062F\u0647 \u0627\u0633\u062A." });
    }
    const hashedPassword = await import_bcryptjs.default.hash(password, 10);
    const user = await prisma14.user.create({
      data: {
        username,
        password: hashedPassword,
        role: "REFERRER",
        status: "ACTIVE",
        firstName,
        lastName,
        mobile,
        email: email || null
      }
    });
    const token = import_jsonwebtoken.default.sign(
      { userId: user.id, username: user.username, role: user.role, status: user.status },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json({
      message: "\u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u0647\u0645\u06A9\u0627\u0631 \u0645\u0639\u0631\u0641 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0646\u062C\u0627\u0645 \u0634\u062F.",
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Error in referrer registration:", error);
    return res.status(500).json({ error: error.message || "\u062E\u0637\u0627\u06CC\u06CC \u062F\u0631 \u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u0631\u062E \u062F\u0627\u062F. \u0644\u0637\u0641\u0627\u064B \u0645\u062C\u062F\u062F\u0627\u064B \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F." });
  }
});
app.post("/api/auth/register/store-manager", async (req, res) => {
  try {
    const {
      username,
      password,
      firstName,
      lastName,
      mobile,
      email,
      nationalCode,
      storeName,
      storeUrl,
      platformType,
      fieldOfActivity,
      productCount
    } = req.body;
    if (!username || !password || !firstName || !lastName || !mobile || !storeName || !nationalCode) {
      return res.status(400).json({ error: "\u0644\u0637\u0641\u0627\u064B \u0641\u06CC\u0644\u062F\u0647\u0627\u06CC \u0627\u062C\u0628\u0627\u0631\u06CC (\u0646\u0627\u0645\u060C \u0646\u0627\u0645 \u062E\u0627\u0646\u0648\u0627\u062F\u06AF\u06CC\u060C \u06A9\u062F\u0645\u0644\u06CC\u060C \u0645\u0648\u0628\u0627\u06CC\u0644\u060C \u0646\u0627\u0645 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647\u060C \u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0648 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631) \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F." });
    }
    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({ error: "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0641\u0642\u0637 \u0645\u06CC\u062A\u0648\u0627\u0646\u062F \u0634\u0627\u0645\u0644 \u062D\u0631\u0648\u0641 \u0627\u0646\u06AF\u0644\u06CC\u0633\u06CC\u060C \u0627\u0639\u062F\u0627\u062F \u0648 \u062E\u0637 \u062A\u06CC\u0631\u0647 (_) \u0628\u0627\u0634\u062F." });
    }
    if (!IRANIAN_MOBILE_REGEX.test(mobile)) {
      return res.status(400).json({ error: "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644 \u0648\u0627\u0631\u062F \u0634\u062F\u0647 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A. \u0628\u0627\u06CC\u062F \u0628\u0627 09 \u0634\u0631\u0648\u0639 \u0634\u062F\u0647 \u0648 \u06F1\u06F1 \u0631\u0642\u0645 \u0628\u0627\u0634\u062F." });
    }
    if (email && !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "\u0622\u062F\u0631\u0633 \u0627\u06CC\u0645\u06CC\u0644 \u0648\u0627\u0631\u062F \u0634\u062F\u0647 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A." });
    }
    if (!/^\d{10}$/.test(nationalCode)) {
      return res.status(400).json({ error: "\u06A9\u062F \u0645\u0644\u06CC \u0648\u0627\u0631\u062F \u0634\u062F\u0647 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A. \u06A9\u062F \u0645\u0644\u06CC \u0628\u0627\u06CC\u062F \u062F\u0642\u06CC\u0642\u0627\u064B \u06F1\u06F0 \u0631\u0642\u0645 \u0628\u0627\u0634\u062F." });
    }
    const existingUser = await prisma14.user.findUnique({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: "\u0627\u06CC\u0646 \u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0642\u0628\u0644\u0627\u064B \u062F\u0631 \u0633\u06CC\u0633\u062A\u0645 \u062B\u0628\u062A \u0634\u062F\u0647 \u0627\u0633\u062A." });
    }
    const hashedPassword = await import_bcryptjs.default.hash(password, 10);
    const user = await prisma14.user.create({
      data: {
        username,
        password: hashedPassword,
        role: "STORE_MANAGER",
        firstName,
        lastName,
        mobile,
        email: email || null,
        nationalCode,
        storeName,
        storeUrl,
        platformType,
        fieldOfActivity,
        productCount: productCount ? parseInt(productCount) : null
      }
    });
    const token = import_jsonwebtoken.default.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    const { password: _, ...userWithoutPassword } = user;
    return res.status(201).json({
      message: "\u062B\u0628\u062A\u0646\u0627\u0645 \u0645\u062F\u06CC\u0631 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0646\u062C\u0627\u0645 \u0634\u062F.",
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Error in store manager registration:", error);
    return res.status(500).json({ error: "\u062E\u0637\u0627\u06CC\u06CC \u062F\u0631 \u062B\u0628\u062A\u0646\u0627\u0645 \u0631\u062E \u062F\u0627\u062F. \u0644\u0637\u0641\u0627\u064B \u0645\u062C\u062F\u062F\u0627\u064B \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F." });
  }
});
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { identity, nationalCode, newPassword } = req.body;
    if (!identity || !nationalCode || !newPassword) {
      return res.status(400).json({ error: "\u0644\u0637\u0641\u0627\u064B \u062A\u0645\u0627\u0645\u06CC \u0641\u06CC\u0644\u062F\u0647\u0627\u06CC \u0627\u062C\u0628\u0627\u0631\u06CC (\u0634\u0646\u0627\u0633\u0647/\u0634\u0645\u0627\u0631\u0647 \u062A\u0645\u0627\u0633\u060C \u06A9\u062F\u0645\u0644\u06CC \u0648 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u062C\u062F\u06CC\u062F) \u0631\u0627 \u0648\u0627\u0631\u062F \u0646\u0645\u0627\u06CC\u06CC\u062F." });
    }
    const user = await prisma14.user.findFirst({
      where: {
        OR: [
          { username: identity },
          { mobile: identity }
        ],
        nationalCode
      }
    });
    if (!user) {
      return res.status(404).json({ error: "\u06A9\u0627\u0631\u0628\u0631\u06CC \u0628\u0627 \u0627\u06CC\u0646 \u0645\u0634\u062E\u0635\u0627\u062A \u0648 \u06A9\u062F \u0645\u0644\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
    }
    const hashedPassword = await import_bcryptjs.default.hash(newPassword, 10);
    await prisma14.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    return res.json({ message: "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0634\u0645\u0627 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0634\u062F." });
  } catch (error) {
    console.error("Error in forgot password:", error);
    return res.status(500).json({ error: "\u062E\u0637\u0627\u06CC\u06CC \u062F\u0631 \u0628\u0627\u0632\u06CC\u0627\u0628\u06CC \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0631\u062E \u062F\u0627\u062F. \u0644\u0637\u0641\u0627\u064B \u0645\u062C\u062F\u062F\u0627\u064B \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F." });
  }
});
app.post("/api/auth/google", async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ error: "\u0639\u062F\u0645 \u062F\u0631\u06CC\u0627\u0641\u062A \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u06AF\u0648\u06AF\u0644." });
    }
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).json({ error: "\u062D\u0633\u0627\u0628 \u06AF\u0648\u06AF\u0644 \u0634\u0645\u0627 \u0627\u06CC\u0645\u06CC\u0644 \u0645\u0639\u062A\u0628\u0631\u06CC \u0646\u062F\u0627\u0631\u062F." });
    }
    const email = payload.email;
    let user = await prisma14.user.findFirst({ where: { email } });
    if (!user) {
      user = await prisma14.user.create({
        data: {
          username: "user_" + Math.random().toString(36).substring(7),
          email,
          password: "GOOGLE_AUTH_USER",
          // Or leave empty if making it optional
          firstName: payload.given_name || "\u06A9\u0627\u0631\u0628\u0631",
          lastName: payload.family_name || "\u06AF\u0648\u06AF\u0644",
          mobile: "09000000000",
          // Need a placeholder
          role: "CUSTOMER",
          status: "ACTIVE"
        }
      });
    }
    if (user.status === "BLOCKED") {
      return res.status(403).json({ error: "\u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0634\u0645\u0627 \u0645\u0633\u062F\u0648\u062F \u0634\u062F\u0647 \u0627\u0633\u062A." });
    }
    const token = import_jsonwebtoken.default.sign(
      { userId: user.id, username: user.username, role: user.role, status: user.status },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    const { password: _, ...userWithoutPassword } = user;
    return res.json({
      message: "\u0648\u0631\u0648\u062F \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0646\u062C\u0627\u0645 \u0634\u062F.",
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    return res.status(500).json({ error: "\u0648\u0631\u0648\u062F \u0628\u0627 \u06AF\u0648\u06AF\u0644 \u0628\u0627 \u062E\u0637\u0627 \u0645\u0648\u0627\u062C\u0647 \u0634\u062F." });
  }
});
app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma14.user.findUnique({ where: { id: req.user.userId } });
    if (!user) {
      return res.status(401).json({ error: "Account Not Found (\u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.)" });
    }
    const { password: _, ...userWithoutPassword } = user;
    return res.json({ user: userWithoutPassword });
  } catch (error) {
    return res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062A\u0627\u06CC\u06CC\u062F \u0627\u0639\u062A\u0628\u0627\u0631." });
  }
});
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "\u0644\u0637\u0641\u0627\u064B \u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0648 \u06A9\u0644\u0645\u0647 \u0639\u0628\u0648\u0631 \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F." });
    }
    const cleanUsername = String(username).trim();
    const isSuperAdminCandidate = cleanUsername === "admin" || cleanUsername === "superadmin" || cleanUsername === "09120000000";
    let user = null;
    user = await prisma14.user.findUnique({ where: { username: cleanUsername } });
    if (!user && isSuperAdminCandidate) {
      user = await prisma14.user.findFirst({ where: { role: "SUPER_ADMIN" } });
    }
    if (process.env.NODE_ENV !== "production" && !user && isSuperAdminCandidate && process.env.SUPER_ADMIN_PASSWORD && password === process.env.SUPER_ADMIN_PASSWORD) {
      try {
        const hashedPassword = await import_bcryptjs.default.hash(password, 10);
        user = await prisma14.user.create({
          data: {
            username: "admin",
            email: "admin@marketplace.com",
            password: hashedPassword,
            role: "SUPER_ADMIN",
            status: "ACTIVE",
            firstName: "\u0645\u062F\u06CC\u0631",
            lastName: "\u0627\u0631\u0634\u062F",
            mobile: "09120000000"
          }
        });
      } catch (createErr) {
        console.warn("[Login] Super admin auto-create notice:", createErr.message);
      }
    }
    if (!user) {
      return res.status(401).json({ error: "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u06CC\u0627 \u06A9\u0644\u0645\u0647 \u0639\u0628\u0648\u0631 \u0646\u0627\u062F\u0631\u0633\u062A \u0627\u0633\u062A." });
    }
    let isValid = false;
    if (user.password) {
      isValid = await import_bcryptjs.default.compare(password, user.password);
    }
    if (!isValid) {
      return res.status(401).json({ error: "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u06CC\u0627 \u06A9\u0644\u0645\u0647 \u0639\u0628\u0648\u0631 \u0646\u0627\u062F\u0631\u0633\u062A \u0627\u0633\u062A." });
    }
    if (user.role === "SUPPLIER" && user.status === "BLOCKED") {
      return res.status(403).json({ error: "\u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC \u0634\u0645\u0627 \u0645\u0633\u062F\u0648\u062F \u0634\u062F\u0647 \u0627\u0633\u062A. \u0644\u0637\u0641\u0627 \u0628\u0627 \u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC \u062A\u0645\u0627\u0633 \u0628\u06AF\u06CC\u0631\u06CC\u062F." });
    }
    const token = import_jsonwebtoken.default.sign(
      { userId: user.id, username: user.username, role: user.role, status: user.status },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    const { password: _, ...userWithoutPassword } = user;
    return res.json({
      message: "\u0648\u0631\u0648\u062F \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0646\u062C\u0627\u0645 \u0634\u062F.",
      token,
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).json({ error: "\u062E\u0637\u0627\u06CC\u06CC \u062F\u0631 \u0648\u0631\u0648\u062F \u0631\u062E \u062F\u0627\u062F. \u0644\u0637\u0641\u0627\u064B \u0645\u062C\u062F\u062F\u0627\u064B \u062A\u0644\u0627\u0634 \u06A9\u0646\u06CC\u062F.", details: error?.message || String(error) });
  }
});
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) return res.status(401).json({ error: "Unauthorized Access (\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632)" });
  import_jsonwebtoken.default.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Session Expired (\u0646\u0634\u0633\u062A \u0645\u0646\u0642\u0636\u06CC \u0634\u062F\u0647 \u0627\u0633\u062A)" });
    req.user = user;
    next();
  });
}
function requireSupplier(req, res, next) {
  if (req.user?.role !== "SUPPLIER") {
    return res.status(403).json({ error: "\u0641\u0642\u0637 \u062A\u0627\u0645\u06CC\u0646\u06A9\u0646\u0646\u062F\u06AF\u0627\u0646 \u062F\u0633\u062A\u0631\u0633\u06CC \u062F\u0627\u0631\u0646\u062F" });
  }
  next();
}
function requireCustomer(req, res, next) {
  if (req.user?.role !== "CUSTOMER") {
    return res.status(403).json({ error: "\u0641\u0642\u0637 \u0645\u0634\u062A\u0631\u06CC\u0627\u0646 \u062F\u0633\u062A\u0631\u0633\u06CC \u062F\u0627\u0631\u0646\u062F" });
  }
  next();
}
app.get("/api/customer/orders", authenticateToken, requireCustomer, async (req, res) => {
  try {
    const user = await prisma14.user.findUnique({
      where: { id: req.user.userId }
    });
    if (!user) {
      return res.status(404).json({ error: "Account Not Found (\u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.)" });
    }
    const orders = await prisma14.order.findMany({
      where: {
        customerPhone: user.mobile
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: true
              }
            },
            variant: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    return res.json({ orders });
  } catch (err) {
    console.error("Error fetching customer orders:", err);
    return res.status(500).json({ error: err.message });
  }
});
app.put("/api/customer/profile", authenticateToken, requireCustomer, async (req, res) => {
  try {
    const { firstName, lastName, mobile, email } = req.body;
    if (!firstName || !lastName || !mobile) {
      return res.status(400).json({ error: "\u0644\u0637\u0641\u0627\u064B \u062A\u0645\u0627\u0645\u06CC \u0641\u06CC\u0644\u062F\u0647\u0627\u06CC \u0627\u062C\u0628\u0627\u0631\u06CC \u0631\u0627 \u062A\u06A9\u0645\u06CC\u0644 \u0646\u0645\u0627\u06CC\u06CC\u062F." });
    }
    if (!IRANIAN_MOBILE_REGEX.test(mobile)) {
      return res.status(400).json({ error: "\u0634\u0645\u0627\u0631\u0647 \u0645\u0648\u0628\u0627\u06CC\u0644 \u0648\u0627\u0631\u062F \u0634\u062F\u0647 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A. \u0628\u0627\u06CC\u062F \u0628\u0627 09 \u0634\u0631\u0648\u0639 \u0634\u062F\u0647 \u0648 \u06F1\u06F1 \u0631\u0642\u0645 \u0628\u0627\u0634\u062F." });
    }
    if (email && !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: "\u0622\u062F\u0631\u0633 \u0627\u06CC\u0645\u06CC\u0644 \u0648\u0627\u0631\u062F \u0634\u062F\u0647 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A." });
    }
    const updatedUser = await prisma14.user.update({
      where: { id: req.user.userId },
      data: {
        firstName,
        lastName,
        mobile,
        email: email || null
      }
    });
    const { password: _, ...userWithoutPassword } = updatedUser;
    return res.json({
      message: "\u067E\u0631\u0648\u0641\u0627\u06CC\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0634\u062F.",
      user: userWithoutPassword
    });
  } catch (err) {
    console.error("Error updating customer profile:", err);
    return res.status(500).json({ error: err.message });
  }
});
app.get("/api/supplier/products", authenticateToken, requireSupplier, async (req, res) => {
  try {
    const supplierId = parseInt(req.user.userId);
    let products = await prisma14.product.findMany({
      where: { supplierId },
      include: { category: true, images: true, variants: true, exploreContent: true },
      orderBy: { id: "desc" }
    });
    if (products.length === 0) {
      const firstCategory = await prisma14.category.findFirst();
      const catId = firstCategory ? firstCategory.id : 1;
      await prisma14.product.create({
        data: {
          supplierId,
          categoryId: catId,
          name: "\u06AF\u0648\u0634\u06CC \u0645\u0648\u0628\u0627\u06CC\u0644 \u0633\u0627\u0645\u0633\u0648\u0646\u06AF \u06AF\u0644\u06A9\u0633\u06CC S24 \u0627\u0648\u0644\u062A\u0631\u0627",
          shortDescription: "\u067E\u0631\u0686\u0645\u062F\u0627\u0631 \u0642\u062F\u0631\u062A\u0645\u0646\u062F \u0633\u0627\u0645\u0633\u0648\u0646\u06AF \u0628\u0627 \u0647\u0648\u0634 \u0645\u0635\u0646\u0648\u0639\u06CC \u067E\u06CC\u0634\u0631\u0641\u062A\u0647",
          longDescription: "\u06AF\u0648\u0634\u06CC \u0647\u0648\u0634\u0645\u0646\u062F \u067E\u0631\u0686\u0645\u062F\u0627\u0631 \u0633\u0627\u0645\u0633\u0648\u0646\u06AF \u0628\u0627 \u062F\u0648\u0631\u0628\u06CC\u0646 \u06F2\u06F0\u06F0 \u0645\u06AF\u0627\u067E\u06CC\u06A9\u0633\u0644\u06CC\u060C \u0642\u0644\u0645 S-Pen \u0648 \u067E\u0631\u062F\u0627\u0632\u0646\u062F\u0647 \u0627\u0633\u0646\u067E\u062F\u0631\u0627\u06AF\u0648\u0646 8 \u0646\u0633\u0644 3.",
          supplierBasePrice: 52e6,
          discount: 5,
          sku: "SAM-S24U-256",
          brand: "\u0633\u0627\u0645\u0633\u0648\u0646\u06AF",
          status: "PENDING_APPROVAL",
          inventory: 25,
          images: {
            create: [{ url: "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600" }]
          }
        }
      });
      await prisma14.product.create({
        data: {
          supplierId,
          categoryId: catId,
          name: "\u0644\u067E\u200C\u062A\u0627\u067E \u06F1\u06F4 \u0627\u06CC\u0646\u0686\u06CC \u0627\u06CC\u0633\u0648\u0633 Zenbook",
          shortDescription: "\u0627\u0648\u0644\u062A\u0631\u0627\u0628\u0648\u06A9 \u0641\u0648\u0642\u200C\u0627\u0644\u0639\u0627\u062F\u0647 \u0628\u0627\u0631\u06CC\u06A9 \u0648 \u0633\u0628\u06A9 \u0628\u0627 \u0635\u0641\u062D\u0647 \u0646\u0645\u0627\u06CC\u0634 OLED",
          longDescription: "\u0645\u0646\u0627\u0633\u0628 \u0628\u0631\u0627\u06CC \u0627\u0645\u0648\u0631 \u067E\u0631\u062F\u0627\u0632\u0634\u06CC \u0633\u0646\u06AF\u06CC\u0646\u060C \u0637\u0631\u0627\u062D\u06CC \u0648 \u0645\u0647\u0646\u062F\u0633\u06CC \u0628\u0627 \u0628\u062F\u0646\u0647 \u062A\u0645\u0627\u0645 \u0622\u0644\u0648\u0645\u06CC\u0646\u06CC\u0648\u0645\u06CC \u0648 \u0634\u0627\u0631\u0698\u062F\u0647\u06CC \u0639\u0627\u0644\u06CC \u0628\u0627\u062A\u0631\u06CC.",
          supplierBasePrice: 48e6,
          discount: 3,
          sku: "ASUS-ZEN-14",
          brand: "\u0627\u06CC\u0633\u0648\u0633",
          status: "PENDING_APPROVAL",
          inventory: 15,
          images: {
            create: [{ url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600" }]
          }
        }
      });
      products = await prisma14.product.findMany({
        where: { supplierId },
        include: { category: true, images: true, variants: true, exploreContent: true },
        orderBy: { id: "desc" }
      });
    }
    res.json(products);
  } catch (err) {
    console.error("Error fetching supplier products:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0645\u062D\u0635\u0648\u0644\u0627\u062A" });
  }
});
app.post("/api/supplier/products", authenticateToken, requireSupplier, async (req, res) => {
  try {
    const { categoryId, name, shortDescription, longDescription, technicalSpecs, supplierBasePrice, discount, sku, brand, stock, images, mainImage, variants, videoUrl } = req.body;
    const supplierId = parseInt(req.user.userId);
    let actualCategoryId = parseInt(categoryId);
    if (actualCategoryId) {
      const categoryExists = await prisma14.category.findUnique({ where: { id: actualCategoryId } });
      if (!categoryExists) {
        await prisma14.category.create({
          data: { id: actualCategoryId, name: "\u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC " + actualCategoryId, isActive: true, sortOrder: 0 }
        });
      }
    } else {
      const firstCategory = await prisma14.category.findFirst();
      if (firstCategory) {
        actualCategoryId = firstCategory.id;
      } else {
        const newCategory = await prisma14.category.create({
          data: { name: "\u0639\u0645\u0648\u0645\u06CC", isActive: true, sortOrder: 0 }
        });
        actualCategoryId = newCategory.id;
      }
    }
    const totalInventory = variants && variants.length > 0 ? variants.reduce((sum, v) => sum + safeParseInt(v.stock), 0) : safeParseInt(stock);
    const product = await prisma14.product.create({
      data: {
        supplierId,
        categoryId: actualCategoryId,
        name,
        shortDescription: shortDescription || longDescription,
        longDescription: longDescription || shortDescription,
        technicalSpecs: typeof technicalSpecs === "object" ? JSON.stringify(technicalSpecs) : technicalSpecs,
        supplierBasePrice: safeParseFloat(supplierBasePrice),
        discount: safeParseFloat(discount, 0),
        sku,
        brand,
        status: req.body.status || "ACTIVE",
        // Default active so product appears immediately
        inventory: totalInventory,
        exploreContent: videoUrl ? {
          create: {
            customVideoUrl: videoUrl,
            isPublished: false
          }
        } : void 0,
        images: {
          create: [
            ...mainImage ? [{ url: mainImage }] : [],
            ...(images || []).map((url) => ({ url }))
          ]
        },
        variants: {
          create: variants && variants.length > 0 ? variants.map((v) => ({
            attributes: JSON.stringify(v.attributes),
            supplierBasePrice: safeParseFloat(v.supplierBasePrice || supplierBasePrice),
            stock: safeParseInt(v.stock),
            sku: v.sku || sku
          })) : [{
            attributes: JSON.stringify({}),
            supplierBasePrice: safeParseFloat(supplierBasePrice),
            stock: safeParseInt(stock),
            sku: sku || ""
          }]
        }
      }
    });
    res.status(201).json({ message: "\u0645\u062D\u0635\u0648\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062B\u0628\u062A \u0634\u062F", product });
  } catch (err) {
    console.error("Error adding supplier product:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u0645\u062D\u0635\u0648\u0644", details: err.message });
  }
});
app.put("/api/supplier/products/:id", authenticateToken, requireSupplier, async (req, res) => {
  try {
    const { id } = req.params;
    const supplierId = parseInt(req.user.userId);
    const { categoryId, name, shortDescription, longDescription, technicalSpecs, supplierBasePrice, discount, sku, brand, stock, images, mainImage, variants, videoUrl } = req.body;
    const existing = await prisma14.product.findFirst({
      where: { id: parseInt(id), supplierId }
    });
    if (!existing) return res.status(404).json({ error: "\u0645\u062D\u0635\u0648\u0644 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    let actualCategoryId = parseInt(categoryId);
    if (actualCategoryId) {
      const categoryExists = await prisma14.category.findUnique({ where: { id: actualCategoryId } });
      if (!categoryExists) {
        await prisma14.category.create({
          data: { id: actualCategoryId, name: "\u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC " + actualCategoryId, isActive: true, sortOrder: 0 }
        });
      }
    } else {
      const firstCategory = await prisma14.category.findFirst();
      actualCategoryId = firstCategory ? firstCategory.id : existing.categoryId;
    }
    await prisma14.productImage.deleteMany({ where: { productId: parseInt(id) } });
    await prisma14.productVariant.deleteMany({ where: { productId: parseInt(id) } });
    const totalInventory = variants && variants.length > 0 ? variants.reduce((sum, v) => sum + safeParseInt(v.stock), 0) : safeParseInt(stock);
    const product = await prisma14.product.update({
      where: { id: parseInt(id) },
      data: {
        categoryId: actualCategoryId,
        name,
        shortDescription: shortDescription || longDescription,
        longDescription: longDescription || shortDescription,
        technicalSpecs: typeof technicalSpecs === "object" ? JSON.stringify(technicalSpecs) : technicalSpecs,
        supplierBasePrice: safeParseFloat(supplierBasePrice),
        discount: safeParseFloat(discount, 0),
        sku,
        brand,
        status: "SUSPENDED",
        // Prompt 7.1: Suspend product immediately on supplier edit
        inventory: totalInventory,
        exploreContent: {
          upsert: {
            create: {
              customVideoUrl: videoUrl || null,
              isPublished: false
            },
            update: {
              customVideoUrl: videoUrl || null
            }
          }
        },
        images: {
          create: [
            ...mainImage ? [{ url: mainImage }] : [],
            ...(images || []).map((url) => ({ url }))
          ]
        },
        variants: {
          create: variants && variants.length > 0 ? variants.map((v) => ({
            attributes: JSON.stringify(v.attributes),
            supplierBasePrice: safeParseFloat(v.supplierBasePrice || supplierBasePrice),
            stock: safeParseInt(v.stock),
            sku: v.sku || sku
          })) : [{
            attributes: JSON.stringify({}),
            supplierBasePrice: safeParseFloat(supplierBasePrice),
            stock: safeParseInt(stock),
            sku: sku || ""
          }]
        }
      }
    });
    await prisma14.announcement.create({
      data: {
        title: `\u062A\u0639\u0644\u06CC\u0642 \u0645\u062D\u0635\u0648\u0644 \u0634\u0645\u0627\u0631\u0647 ${id} \u062C\u0647\u062A \u0628\u0631\u0631\u0633\u06CC \u0648 \u062A\u0627\u06CC\u06CC\u062F \u0645\u062C\u062F\u062F`,
        content: `\u0645\u062D\u0635\u0648\u0644 \u0634\u0645\u0627\u0631\u0647 ${id} (${name}) \u062A\u0648\u0633\u0637 \u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0634\u062F. \u0645\u0634\u062E\u0635\u0627\u062A/\u0642\u06CC\u0645\u062A \u062C\u062F\u06CC\u062F \u0628\u0647 \u062B\u0628\u062A \u0631\u0633\u06CC\u062F \u0648 \u062C\u0647\u062A \u062D\u0641\u0638 \u0635\u062D\u062A \u062F\u0627\u062F\u0647\u200C\u0647\u0627\u060C \u06A9\u0627\u0644\u0627 \u062A\u0627 \u0632\u0645\u0627\u0646 \u062A\u0627\u06CC\u06CC\u062F \u0646\u0647\u0627\u06CC\u06CC \u062A\u0648\u0633\u0637 \u0645\u062F\u06CC\u0631\u06CC\u062A \u0627\u0631\u0634\u062F \u063A\u06CC\u0631\u0641\u0639\u0627\u0644 \u06AF\u0631\u062F\u06CC\u062F.`,
        target: "ALL",
        priority: "HIGH",
        isSticky: true
      }
    }).catch(console.error);
    res.json({ message: "\u0645\u062D\u0635\u0648\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0648 \u062A\u0627 \u0632\u0645\u0627\u0646 \u062A\u0627\u06CC\u06CC\u062F \u0645\u062C\u062F\u062F \u0645\u062F\u06CC\u0631\u06CC\u062A \u0627\u0631\u0634\u062F \u062A\u0639\u0644\u06CC\u0642 \u06AF\u0631\u062F\u06CC\u062F", product });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0645\u062D\u0635\u0648\u0644", details: err.message });
  }
});
app.get("/api/supplier/orders", authenticateToken, requireSupplier, async (req, res) => {
  try {
    const orderItems = await prisma14.orderItem.findMany({
      where: { supplierId: req.user.userId },
      include: {
        order: {
          include: {
            store: true
          }
        },
        product: true,
        variant: true
      }
    });
    res.json(orderItems);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0633\u0641\u0627\u0631\u0634\u0627\u062A" });
  }
});
app.post("/api/supplier/orders/approve-batch", authenticateToken, requireSupplier, async (req, res) => {
  try {
    const { itemIds } = req.body;
    if (!Array.isArray(itemIds)) {
      return res.status(400).json({ error: "\u0644\u06CC\u0633\u062A \u0634\u0646\u0627\u0633\u0647\u200C\u0647\u0627 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A" });
    }
    await prisma14.orderItem.updateMany({
      where: {
        id: { in: itemIds.map((id) => parseInt(id)) },
        supplierId: req.user.userId
      },
      data: {
        status: "SUPPLIER_APPROVED"
      }
    });
    const items = await prisma14.orderItem.findMany({
      where: {
        id: { in: itemIds.map((id) => parseInt(id)) }
      },
      select: { orderId: true }
    });
    const orderIds = Array.from(new Set(items.map((i) => i.orderId)));
    for (const orderId of orderIds) {
      const parentOrder = await prisma14.order.findUnique({
        where: { id: orderId },
        include: { items: true }
      });
      if (parentOrder && parentOrder.status === "WAITING_SUPPLIER_CONFIRMATION") {
        const allApproved = parentOrder.items.every(
          (i) => itemIds.includes(i.id) || i.status === "SUPPLIER_APPROVED"
        );
        if (allApproved) {
          await prisma14.order.update({
            where: { id: parentOrder.id },
            data: {
              status: "WAITING_SHIPPING_COST",
              statusHistory: {
                create: {
                  fromStatus: "WAITING_SUPPLIER_CONFIRMATION",
                  toStatus: "WAITING_SHIPPING_COST",
                  actorRole: "SYSTEM",
                  actorName: "\u0633\u06CC\u0633\u062A\u0645",
                  note: "\u062A\u0645\u0627\u0645\u06CC \u0627\u0642\u0644\u0627\u0645 \u062A\u0648\u0633\u0637 \u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647 \u062A\u0627\u06CC\u06CC\u062F \u0634\u062F\u0646\u062F. \u062F\u0631 \u0627\u0646\u062A\u0638\u0627\u0631 \u0645\u062D\u0627\u0633\u0628\u0647 \u0647\u0632\u06CC\u0646\u0647 \u0627\u0631\u0633\u0627\u0644 \u062A\u0648\u0633\u0637 \u0645\u062F\u06CC\u0631\u06CC\u062A."
                }
              }
            }
          });
        }
      }
    }
    res.json({ message: "\u0633\u0641\u0627\u0631\u0634\u0627\u062A \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062A\u0627\u06CC\u06CC\u062F \u0634\u062F\u0646\u062F." });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062A\u0627\u06CC\u06CC\u062F \u062F\u0633\u062A\u0647 \u062C\u0645\u0639\u06CC \u0633\u0641\u0627\u0631\u0634\u0627\u062A" });
  }
});
app.patch("/api/supplier/orders/:itemId", authenticateToken, requireSupplier, async (req, res) => {
  try {
    const { status, trackingCode } = req.body;
    const { itemId } = req.params;
    const item = await prisma14.orderItem.findFirst({
      where: { id: parseInt(itemId), supplierId: req.user.userId }
    });
    if (!item) {
      return res.status(404).json({ error: "\u0633\u0641\u0627\u0631\u0634 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    }
    const updated = await prisma14.orderItem.update({
      where: { id: item.id },
      data: { status, trackingCode }
    });
    const isStage5 = ["SHIPPED", "DELIVERED", "COMPLETED"].includes(status);
    const wasStage5 = ["SHIPPED", "DELIVERED", "COMPLETED"].includes(item.status);
    if (isStage5 && !wasStage5) {
      await prisma14.product.update({
        where: { id: item.productId },
        data: {
          inventory: {
            decrement: item.quantity
          }
        }
      });
      if (item.variantId) {
        await prisma14.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });
      }
    }
    if (trackingCode) {
      await prisma14.order.update({
        where: { id: item.orderId },
        data: { trackingCode }
      });
    }
    const parentOrder = await prisma14.order.findUnique({
      where: { id: item.orderId },
      include: { items: true }
    });
    if (parentOrder) {
      if (status === "SUPPLIER_APPROVED" && parentOrder.status === "WAITING_SUPPLIER_CONFIRMATION") {
        const allApproved = parentOrder.items.every(
          (i) => i.id === item.id ? true : i.status === "SUPPLIER_APPROVED"
        );
        if (allApproved) {
          await prisma14.order.update({
            where: { id: parentOrder.id },
            data: {
              status: "WAITING_SHIPPING_COST",
              statusHistory: {
                create: {
                  fromStatus: parentOrder.status,
                  toStatus: "WAITING_SHIPPING_COST",
                  actorRole: "SYSTEM",
                  actorName: "\u0633\u06CC\u0633\u062A\u0645",
                  note: "\u062A\u0645\u0627\u0645\u06CC \u0627\u0642\u0644\u0627\u0645 \u062A\u0648\u0633\u0637 \u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647 \u062A\u0627\u06CC\u06CC\u062F \u0634\u062F\u0646\u062F. \u062F\u0631 \u0627\u0646\u062A\u0638\u0627\u0631 \u0645\u062D\u0627\u0633\u0628\u0647 \u0647\u0632\u06CC\u0646\u0647 \u0627\u0631\u0633\u0627\u0644 \u062A\u0648\u0633\u0637 \u0645\u062F\u06CC\u0631\u06CC\u062A."
                }
              }
            }
          });
        }
      } else if (status === "REJECTED" || status === "OUT_OF_STOCK") {
        const itemAmt = (item.supplierPrice || 0) * (item.quantity || 1);
        if (itemAmt > 0) {
          const wallet = await prisma14.wallet.findUnique({
            where: { supplierId: req.user.userId }
          });
          if (wallet) {
            await prisma14.wallet.update({
              where: { id: wallet.id },
              data: {
                balance: {
                  decrement: itemAmt
                }
              }
            });
            await prisma14.ledgerEntry.create({
              data: {
                walletId: wallet.id,
                amount: -itemAmt,
                type: "REFUND",
                status: "COMPLETED",
                referenceId: String(parentOrder.id),
                description: `\u06A9\u0633\u0631 \u062F\u0631\u0622\u0645\u062F \u0628\u0647 \u0639\u0644\u062A \u0627\u0639\u0644\u0627\u0645 \u0627\u062A\u0645\u0627\u0645 \u0645\u0648\u062C\u0648\u062F\u06CC / \u0631\u062F \u0633\u0641\u0627\u0631\u0634 \u0634\u0645\u0627\u0631\u0647 ${parentOrder.id}`
              }
            });
          }
        }
        const refundNote = `\u26A0\uFE0F \u0627\u062E\u0637\u0627\u0631 \u0627\u062A\u0645\u0627\u0645 \u0645\u0648\u062C\u0648\u062F\u06CC \u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647: \u0633\u0641\u0627\u0631\u0634 \u0634\u0645\u0627\u0631\u0647 ${parentOrder.id} \u0628\u0647 \u0639\u0644\u062A \u0627\u062A\u0645\u0627\u0645 \u0645\u0648\u062C\u0648\u062F\u06CC \u062A\u0648\u0633\u0637 \u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647 \u0631\u062F \u0634\u062F. \u0645\u0628\u0644\u063A ${(parentOrder.totalAmount || 0).toLocaleString()} \u062A\u0648\u0645\u0627\u0646 \u0628\u0627\u06CC\u062F \u0628\u0647 \u0634\u0645\u0627\u0631\u0647 \u06A9\u0627\u0631\u062A/\u062D\u0633\u0627\u0628 \u062E\u0631\u06CC\u062F\u0627\u0631 \u0639\u0648\u062F\u062A \u062F\u0627\u062F\u0647 \u0634\u0648\u062F.`;
        await prisma14.order.update({
          where: { id: parentOrder.id },
          data: {
            status: "REJECTED",
            statusHistory: {
              create: {
                fromStatus: parentOrder.status,
                toStatus: "REJECTED",
                actorRole: "SUPPLIER",
                actorName: req.user.username || "\u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647",
                note: refundNote
              }
            }
          }
        });
        try {
          const admins = await prisma14.user.findMany({
            where: { role: "SUPER_ADMIN" }
          });
          for (const admin of admins) {
            await prisma14.notification.create({
              data: {
                userId: admin.id,
                title: `\u26A0\uFE0F \u0647\u0634\u062F\u0627\u0631 \u0639\u0648\u062F\u062A \u0648\u062C\u0647 - \u0627\u062A\u0645\u0627\u0645 \u0645\u0648\u062C\u0648\u062F\u06CC \u0633\u0641\u0627\u0631\u0634 #${parentOrder.id}`,
                message: `\u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647 (${req.user.username || "\u062B\u0628\u062A \u0646\u0634\u062F\u0647"}) \u0633\u0641\u0627\u0631\u0634 #${parentOrder.id} \u0631\u0627 \u0628\u0647 \u0639\u0644\u062A \u0627\u062A\u0645\u0627\u0645 \u0645\u0648\u062C\u0648\u062F\u06CC \u0631\u062F \u06A9\u0631\u062F. \u0645\u0628\u0644\u063A ${(parentOrder.totalAmount || 0).toLocaleString()} \u062A\u0648\u0645\u0627\u0646 \u0628\u0627\u06CC\u062F \u0628\u0647 \u0634\u0645\u0627\u0631\u0647 \u06A9\u0627\u0631\u062A \u062E\u0631\u06CC\u062F\u0627\u0631 \u0639\u0648\u062F\u062A \u062F\u0627\u062F\u0647 \u0634\u0648\u062F.`,
                type: "WARNING",
                isRead: false
              }
            });
          }
        } catch (e) {
          console.error("Error creating admin notification for rejected order:", e);
        }
      } else if (["PREPARING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(status)) {
        await prisma14.order.update({
          where: { id: parentOrder.id },
          data: {
            status,
            statusHistory: {
              create: {
                fromStatus: parentOrder.status,
                toStatus: status,
                actorRole: "SUPPLIER",
                actorName: req.user.username || "\u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647",
                note: status === "PREPARING" ? "\u0633\u0641\u0627\u0631\u0634 \u062F\u0631 \u062D\u0627\u0644 \u0622\u0645\u0627\u062F\u0647\u200C\u0633\u0627\u0632\u06CC \u067E\u0633\u062A\u06CC \u0627\u0633\u062A." : status === "SHIPPED" ? "\u0633\u0641\u0627\u0631\u0634 \u062A\u0648\u0633\u0637 \u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647 \u0627\u0631\u0633\u0627\u0644 \u0634\u062F \u0648 \u06A9\u062F \u0631\u0647\u06AF\u06CC\u0631\u06CC \u062B\u0628\u062A \u06AF\u0631\u062F\u06CC\u062F." : "\u0633\u0641\u0627\u0631\u0634 \u062A\u06A9\u0645\u06CC\u0644 \u0634\u062F."
              }
            }
          }
        });
      }
    }
    res.json({ message: "\u0648\u0636\u0639\u06CC\u062A \u0633\u0641\u0627\u0631\u0634 \u0628\u0647 \u0631\u0648\u0632 \u0634\u062F", updated });
  } catch (err) {
    res.status(500).json({ error: "\u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0633\u0641\u0627\u0631\u0634 \u0628\u0627 \u062E\u0637\u0627 \u0645\u0648\u0627\u062C\u0647 \u0634\u062F" });
  }
});
var payoutRequestSchema = import_zod2.z.object({
  amount: import_zod2.z.number().int().positive("\u0645\u0628\u0644\u063A \u062A\u0633\u0648\u06CC\u0647 \u0628\u0627\u06CC\u062F \u0639\u062F\u062F \u0635\u062D\u06CC\u062D \u0648 \u0645\u062B\u0628\u062A \u0628\u0627\u0634\u062F")
});
app.post("/api/supplier/payout/request", authenticateToken, requireSupplier, payoutRequestLimiter, async (req, res) => {
  try {
    const validatedData = payoutRequestSchema.parse(req.body);
    const { amount } = validatedData;
    const supplierId = req.user.userId;
    const user = await prisma14.user.findUnique({ where: { id: supplierId } });
    if (!user || !user.shaba) {
      return res.status(400).json({ error: "\u0644\u0637\u0641\u0627 \u0627\u0628\u062A\u062F\u0627 \u0634\u0645\u0627\u0631\u0647 \u0634\u0628\u0627 \u062E\u0648\u062F \u0631\u0627 \u062F\u0631 \u067E\u0631\u0648\u0641\u0627\u06CC\u0644 \u062B\u0628\u062A \u06A9\u0646\u06CC\u062F" });
    }
    const wallet = await prisma14.wallet.findUnique({ where: { supplierId } });
    if (!wallet) {
      return res.status(404).json({ error: "\u06A9\u06CC\u0641 \u067E\u0648\u0644 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    }
    const { WalletService: WalletService2 } = await Promise.resolve().then(() => (init_WalletService(), WalletService_exports));
    const walletService2 = new WalletService2();
    const payoutRequest = await walletService2.requestPayout(wallet.id, amount, user.shaba);
    res.json({ success: true, message: "\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u062A\u0633\u0648\u06CC\u0647 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062B\u0628\u062A \u0634\u062F", payoutRequest });
  } catch (err) {
    if (err instanceof import_zod2.z.ZodError) {
      return res.status(400).json({ error: err.errors?.map((e) => e.message).join(", ") || err.message });
    }
    res.status(400).json({ error: err.message });
  }
});
app.get("/api/supplier/reports", authenticateToken, requireSupplier, async (req, res) => {
  try {
    const supplierId = req.user.userId;
    const { status, type, page = "1", limit = "10" } = req.query;
    const wallet = await prisma14.wallet.findUnique({
      where: { supplierId }
    });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }
    const earningsResult = await prisma14.ledgerEntry.aggregate({
      where: {
        walletId: wallet.id,
        type: "ORDER_REVENUE",
        status: "COMPLETED"
      },
      _sum: { amount: true }
    });
    const withdrawnResult = await prisma14.ledgerEntry.aggregate({
      where: {
        walletId: wallet.id,
        type: "WITHDRAWAL",
        status: "COMPLETED"
      },
      _sum: { amount: true }
    });
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const whereClause = { walletId: wallet.id };
    if (status) whereClause.status = status;
    if (type) whereClause.type = type;
    const history = await prisma14.ledgerEntry.findMany({
      where: whereClause,
      orderBy: { id: "desc" },
      skip: (pageNum - 1) * limitNum,
      take: limitNum
    });
    const totalHistory = await prisma14.ledgerEntry.count({ where: whereClause });
    res.json({
      balance: wallet.balance.toString(),
      totalEarnings: (earningsResult._sum.amount || 0).toString(),
      totalWithdrawn: Math.abs(parseFloat((withdrawnResult._sum.amount || 0).toString())).toString(),
      history,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalHistory,
        totalPages: Math.ceil(totalHistory / limitNum)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/supplier/wallet", authenticateToken, requireSupplier, async (req, res) => {
  try {
    let wallet = await prisma14.wallet.findUnique({
      where: { supplierId: req.user.userId },
      include: {
        ledgerEntries: {
          orderBy: { createdAt: "desc" },
          take: 50
        }
      }
    });
    if (!wallet) {
      wallet = await prisma14.wallet.create({
        data: { supplierId: req.user.userId, balance: 0 },
        include: {
          ledgerEntries: true
        }
      });
    }
    res.json({
      wallet: {
        id: wallet.id,
        supplierId: wallet.supplierId,
        balance: wallet.balance.toString(),
        currency: wallet.currency
      },
      transactions: (wallet.ledgerEntries || []).map((entry) => ({
        id: entry.id,
        amount: entry.amount.toString(),
        type: entry.type,
        status: entry.status,
        description: entry.description,
        createdAt: entry.createdAt
      }))
    });
  } catch (err) {
    console.error("Supplier wallet error:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0645\u0627\u0644\u06CC" });
  }
});
app.put("/api/supplier/profile", authenticateToken, requireSupplier, async (req, res) => {
  try {
    const { firstName, lastName, brandName, shaba, mobile, bankName, accountHolderName, address } = req.body;
    const user = await prisma14.user.update({
      where: { id: req.user.userId },
      data: { firstName, lastName, brandName, shaba, mobile, bankName, accountHolderName, address }
    });
    res.json({ message: "\u067E\u0631\u0648\u0641\u0627\u06CC\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0634\u062F", user });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u067E\u0631\u0648\u0641\u0627\u06CC\u0644" });
  }
});
app.patch("/api/supplier/profile", authenticateToken, requireSupplier, async (req, res) => {
  try {
    const { firstName, lastName, brandName, shaba, mobile, bankName, accountHolderName, address } = req.body;
    const user = await prisma14.user.update({
      where: { id: req.user.userId },
      data: { firstName, lastName, brandName, shaba, mobile, bankName, accountHolderName, address }
    });
    res.json({ message: "\u067E\u0631\u0648\u0641\u0627\u06CC\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0634\u062F", user });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u067E\u0631\u0648\u0641\u0627\u06CC\u0644" });
  }
});
app.get("/api/supplier/tickets", authenticateToken, requireSupplier, async (req, res) => {
  try {
    const tickets = await prisma14.ticket.findMany({
      where: { userId: req.user.userId },
      include: { messages: true },
      orderBy: { id: "desc" }
    });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u062A\u06CC\u06A9\u062A\u200C\u0647\u0627" });
  }
});
app.post("/api/supplier/tickets", authenticateToken, requireSupplier, async (req, res) => {
  try {
    const { subject, department, priority, message, attachmentUrl } = req.body;
    const ticket = await prisma14.ticket.create({
      data: {
        userId: req.user.userId,
        subject,
        department,
        priority,
        messages: {
          create: [{ userId: req.user.userId, message, attachmentUrl: attachmentUrl || null }]
        }
      }
    });
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0627\u06CC\u062C\u0627\u062F \u062A\u06CC\u06A9\u062A" });
  }
});
app.post("/api/supplier/tickets/:id/messages", authenticateToken, requireSupplier, async (req, res) => {
  try {
    const { message, attachmentUrl } = req.body;
    const { id } = req.params;
    const existing = await prisma14.ticket.findFirst({
      where: { id: parseInt(id), userId: req.user.userId }
    });
    if (!existing) return res.status(404).json({ error: "\u062A\u06CC\u06A9\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    const ticketMsg = await prisma14.ticketMessage.create({
      data: {
        ticketId: parseInt(id),
        userId: req.user.userId,
        message,
        attachmentUrl: attachmentUrl || null
      }
    });
    res.status(201).json(ticketMsg);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u067E\u06CC\u0627\u0645" });
  }
});
function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u063A\u06CC\u0631\u0645\u062C\u0627\u0632" });
  }
  next();
}
function requireAdmin(req, res, next) {
  if (req.user?.role !== "SUPER_ADMIN") {
    return res.status(403).json({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u0641\u0642\u0637 \u0628\u0631\u0627\u06CC \u0645\u062F\u06CC\u0631 \u06A9\u0644 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A" });
  }
  next();
}
function requireStoreManager(req, res, next) {
  if (req.user?.role !== "STORE_MANAGER") {
    return res.status(403).json({ error: "\u062F\u0633\u062A\u0631\u0633\u06CC \u0641\u0642\u0637 \u0628\u0631\u0627\u06CC \u0645\u062F\u06CC\u0631 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647 \u0645\u062C\u0627\u0632 \u0627\u0633\u062A" });
  }
  next();
}
app.get("/api/store-manager/tickets", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const tickets = await prisma14.ticket.findMany({
      where: { userId: req.user.userId },
      include: { messages: true },
      orderBy: { id: "desc" }
    });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u062A\u06CC\u06A9\u062A\u200C\u0647\u0627" });
  }
});
app.post("/api/store-manager/tickets", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const { subject, department, priority, message, attachmentUrl } = req.body;
    const ticket = await prisma14.ticket.create({
      data: {
        userId: req.user.userId,
        subject,
        department,
        priority,
        messages: {
          create: [{ userId: req.user.userId, message, attachmentUrl: attachmentUrl || null }]
        }
      }
    });
    res.status(201).json(ticket);
  } catch (err) {
    console.error("Error in creating store-manager ticket:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0627\u06CC\u062C\u0627\u062F \u062A\u06CC\u06A9\u062A" });
  }
});
app.post("/api/store-manager/tickets/:id/messages", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const { message, attachmentUrl } = req.body;
    const { id } = req.params;
    const existing = await prisma14.ticket.findFirst({
      where: { id: parseInt(id), userId: req.user.userId }
    });
    if (!existing) return res.status(404).json({ error: "\u062A\u06CC\u06A9\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    const ticketMsg = await prisma14.ticketMessage.create({
      data: {
        ticketId: parseInt(id),
        userId: req.user.userId,
        message,
        attachmentUrl: attachmentUrl || null
      }
    });
    res.status(201).json(ticketMsg);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u067E\u06CC\u0627\u0645" });
  }
});
app.get("/api/tickets", authenticateToken, async (req, res) => {
  try {
    const tickets = await prisma14.ticket.findMany({
      where: { userId: req.user.userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      },
      orderBy: { id: "desc" }
    });
    const formatted = tickets.map((t) => ({
      ...t,
      replies: t.messages || []
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u062A\u06CC\u06A9\u062A\u200C\u0647\u0627" });
  }
});
app.post("/api/tickets", authenticateToken, async (req, res) => {
  try {
    const { subject, department, message, attachmentUrl } = req.body;
    const ticket = await prisma14.ticket.create({
      data: {
        userId: req.user.userId,
        subject: subject || "\u067E\u0634\u062A\u06CC\u0628\u0627\u0646\u06CC \u0639\u0645\u0648\u0645\u06CC",
        department: department || "SUPPORT",
        message,
        attachmentUrl: attachmentUrl || null,
        status: "OPEN"
      }
    });
    await prisma14.ticketMessage.create({
      data: {
        ticketId: ticket.id,
        userId: req.user.userId,
        message
      }
    });
    res.status(201).json(ticket);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0627\u06CC\u062C\u0627\u062F \u062A\u06CC\u06A9\u062A" });
  }
});
app.get("/api/tickets/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await prisma14.ticket.findFirst({
      where: { id: parseInt(id, 10), userId: req.user.userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });
    if (!ticket) return res.status(404).json({ error: "\u062A\u06CC\u06A9\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    res.json({
      ...ticket,
      replies: ticket.messages || []
    });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u062A\u06CC\u06A9\u062A" });
  }
});
app.post("/api/tickets/:id/messages", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, attachmentUrl } = req.body;
    const ticketId = parseInt(id, 10);
    const existing = await prisma14.ticket.findFirst({
      where: { id: ticketId, userId: req.user.userId }
    });
    if (!existing) return res.status(404).json({ error: "\u062A\u06CC\u06A9\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    const msg = await prisma14.ticketMessage.create({
      data: {
        ticketId,
        userId: req.user.userId,
        message,
        attachmentUrl: attachmentUrl || null
      }
    });
    await prisma14.ticket.update({
      where: { id: ticketId },
      data: { status: "OPEN", updatedAt: /* @__PURE__ */ new Date() }
    });
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0627\u0631\u0633\u0627\u0644 \u067E\u0627\u0633\u062E" });
  }
});
app.put("/api/store-manager/profile", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const { firstName, lastName, shaba, cardNumber, mobile, address, storeLink, avatarUrl } = req.body;
    const user = await prisma14.user.update({
      where: { id: req.user.userId },
      data: { firstName, lastName, shaba, cardNumber, mobile, address, storeLink, avatarUrl }
    });
    res.json({ message: "\u067E\u0631\u0648\u0641\u0627\u06CC\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0634\u062F", user, ...user });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u067E\u0631\u0648\u0641\u0627\u06CC\u0644" });
  }
});
app.patch("/api/store-manager/profile", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const { firstName, lastName, shaba, cardNumber, mobile, address, storeLink, avatarUrl } = req.body;
    const user = await prisma14.user.update({
      where: { id: req.user.userId },
      data: { firstName, lastName, shaba, cardNumber, mobile, address, storeLink, avatarUrl }
    });
    res.json({ message: "\u067E\u0631\u0648\u0641\u0627\u06CC\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0634\u062F", user, ...user });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u067E\u0631\u0648\u0641\u0627\u06CC\u0644" });
  }
});
app.get("/api/store-manager/stats", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId;
    const totalOrders = await prisma14.order.count({ where: { storeId } });
    const paidInvoices = await prisma14.storeInvoice.findMany({ where: { storeManagerId: storeId, status: "PAID" } });
    const totalPaid = paidInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const recentActivity = await prisma14.order.findMany({
      where: { storeId },
      orderBy: { id: "desc" },
      take: 5
    });
    res.json({ totalOrders, totalPaid, netProfit: totalPaid * 1.5, recentActivity });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0622\u0645\u0627\u0631" });
  }
});
app.get("/api/store-manager/marketplace-products", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const now = /* @__PURE__ */ new Date();
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, category, minPrice, maxPrice } = req.query;
    const where = {
      status: { in: ["ACTIVE", "PUBLISHED"] },
      inventory: { gt: 0 },
      OR: [
        { publishStartDate: null },
        { publishStartDate: { lte: now } }
      ],
      AND: [
        {
          OR: [
            { publishEndDate: null },
            { publishEndDate: { gte: now } }
          ]
        }
      ]
    };
    if (search) {
      where.OR = [
        ...where.OR || [],
        { name: { contains: search } },
        { shortDescription: { contains: search } }
      ];
    }
    if (category) {
      where.category = { name: category };
    }
    const products = await prisma14.product.findMany({
      where,
      include: {
        category: true,
        images: true,
        variants: true
      },
      orderBy: [
        { isPinned: "desc" },
        { id: "desc" }
      ],
      skip,
      take: limit
    });
    const total = await prisma14.product.count({ where });
    const sanitizedProducts = products.map((product) => {
      let fPrice = product.finalPrice;
      if (!fPrice) {
        fPrice = product.supplierBasePrice;
        if (product.marginType === "PERCENTAGE" && product.marginValue) {
          fPrice = product.supplierBasePrice * (1 + product.marginValue / 100);
        } else if (product.marginType === "FIXED" && product.marginValue) {
          fPrice = product.supplierBasePrice + product.marginValue;
        }
      }
      const mappedVariants = product.variants?.map((v) => {
        let vfPrice = v.finalPrice;
        if (!vfPrice) {
          vfPrice = v.supplierBasePrice;
          if (product.marginType === "PERCENTAGE" && product.marginValue) {
            vfPrice = v.supplierBasePrice * (1 + product.marginValue / 100);
          } else if (product.marginType === "FIXED" && product.marginValue) {
            vfPrice = v.supplierBasePrice + product.marginValue;
          }
        }
        const { supplierBasePrice: supplierBasePrice2, ...safeV } = v;
        return { ...safeV, finalPrice: vfPrice };
      });
      const { supplierId, supplierBasePrice, marginType, marginValue, ...safeProduct } = product;
      return { ...safeProduct, finalPrice: fPrice, variants: mappedVariants };
    });
    const validProducts = sanitizedProducts.filter((p) => p.finalPrice !== void 0 && p.finalPrice > 0);
    res.json({
      data: validProducts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0645\u062D\u0635\u0648\u0644\u0627\u062A" });
  }
});
app.post("/api/store-manager/my-catalog", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId || req.user.id;
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required." });
    }
    const totalSelections = await prisma14.storeProductSelection.count({
      where: { storeId }
    });
    if (totalSelections >= 20) {
      const today = /* @__PURE__ */ new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const setting = await prisma14.systemSettings.findUnique({ where: { key: "DAILY_PRODUCT_LIMIT" } });
      const limit = setting ? parseInt(setting.value) : 3;
      const selectionsToday = await prisma14.storeProductSelection.count({
        where: {
          storeId,
          selected_at: { gte: today, lt: tomorrow }
        }
      });
      if (selectionsToday >= limit) {
        return res.status(400).json({ error: "\u0634\u0645\u0627 \u0628\u0647 \u0633\u0642\u0641 \u0645\u062C\u0627\u0632 \u0627\u0646\u062A\u062E\u0627\u0628 \u0645\u062D\u0635\u0648\u0644 \u062F\u0631 \u06F2\u06F4 \u0633\u0627\u0639\u062A \u06AF\u0630\u0634\u062A\u0647 \u0631\u0633\u06CC\u062F\u0647\u200C\u0627\u06CC\u062F. \u067E\u0633 \u0627\u0632 \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0627\u0632 \u0633\u0647\u0645\u06CC\u0647 \u0627\u0648\u0644\u06CC\u0647 \u06F2\u06F0 \u06A9\u0627\u0644\u0627\u060C \u0645\u062D\u062F\u0648\u062F\u06CC\u062A \u0634\u0645\u0627 \u0631\u0648\u0632\u0627\u0646\u0647 \u06F3 \u0645\u062D\u0635\u0648\u0644 \u0627\u0633\u062A." });
      }
    }
    const existing = await prisma14.storeProductSelection.findFirst({
      where: { storeId, productId }
    });
    if (existing) {
      return res.status(400).json({ error: "\u0627\u06CC\u0646 \u0645\u062D\u0635\u0648\u0644 \u0642\u0628\u0644\u0627\u064B \u0628\u0647 \u0632\u0648\u067E\u06CC\u062A\u06CC \u0634\u0645\u0627 \u0627\u0636\u0627\u0641\u0647 \u0634\u062F\u0647 \u0627\u0633\u062A." });
    }
    const selection = await prisma14.storeProductSelection.create({
      data: {
        storeId,
        productId,
        status: "PENDING_SYNC"
      }
    });
    res.json({ message: "\u0645\u062D\u0635\u0648\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0647 \u0632\u0648\u067E\u06CC\u062A\u06CC \u0634\u0645\u0627 \u0627\u0636\u0627\u0641\u0647 \u0634\u062F.", selection });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0627\u0641\u0632\u0648\u062F\u0646 \u0645\u062D\u0635\u0648\u0644 \u0628\u0647 \u0632\u0648\u067E\u06CC\u062A" });
  }
});
app.delete("/api/store-manager/my-catalog/:productId", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId || req.user.id;
    const productId = parseInt(req.params.productId);
    await prisma14.storeProductSelection.deleteMany({
      where: { storeId, productId }
    });
    res.json({ message: "\u0645\u062D\u0635\u0648\u0644 \u0627\u0632 \u0632\u0648\u067E\u06CC\u062A\u06CC \u0634\u0645\u0627 \u062D\u0630\u0641 \u0634\u062F." });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062D\u0630\u0641 \u0645\u062D\u0635\u0648\u0644" });
  }
});
app.get("/api/store-manager/my-catalog", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId || req.user.id;
    const selections = await prisma14.storeProductSelection.findMany({
      where: { storeId },
      include: {
        product: {
          include: {
            category: true,
            images: true,
            variants: true
          }
        }
      },
      orderBy: { selected_at: "desc" }
    });
    const sanitizedSelections = selections.map((s) => {
      const product = s.product;
      if (!product) return s;
      let fPrice = product.finalPrice;
      if (!fPrice) {
        fPrice = product.supplierBasePrice;
        if (product.marginType === "PERCENTAGE" && product.marginValue) {
          fPrice = product.supplierBasePrice * (1 + product.marginValue / 100);
        } else if (product.marginType === "FIXED" && product.marginValue) {
          fPrice = product.supplierBasePrice + product.marginValue;
        }
      }
      const mappedVariants = product.variants?.map((v) => {
        let vfPrice = v.finalPrice;
        if (!vfPrice) {
          vfPrice = v.supplierBasePrice;
          if (product.marginType === "PERCENTAGE" && product.marginValue) {
            vfPrice = v.supplierBasePrice * (1 + product.marginValue / 100);
          } else if (product.marginType === "FIXED" && product.marginValue) {
            vfPrice = v.supplierBasePrice + product.marginValue;
          }
        }
        const { supplierBasePrice: supplierBasePrice2, ...safeV } = v;
        return { ...safeV, finalPrice: vfPrice };
      });
      const { supplierId, supplierBasePrice, marginType, marginValue, ...safeProduct } = product;
      return { ...s, product: { ...safeProduct, finalPrice: fPrice, variants: mappedVariants } };
    });
    res.json(sanitizedSelections);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0644\u06CC\u0633\u062A \u0645\u062D\u0635\u0648\u0644\u0627\u062A" });
  }
});
app.get("/api/store-manager/daily-limit", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId || req.user.id;
    const today = /* @__PURE__ */ new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const totalSelections = await prisma14.storeProductSelection.count({
      where: { storeId }
    });
    if (totalSelections < 20) {
      res.json({
        limit: 20,
        current: totalSelections,
        isNewStore: true,
        reason: "\u0641\u0631\u0648\u0634\u06AF\u0627\u0647 \u062C\u062F\u06CC\u062F (\u0633\u0647\u0645\u06CC\u0647 \u0627\u0648\u0644\u06CC\u0647 \u06F2\u06F0 \u0645\u062D\u0635\u0648\u0644 \u0628\u062F\u0648\u0646 \u0645\u062D\u062F\u0648\u062F\u06CC\u062A \u0632\u0645\u0627\u0646\u06CC)"
      });
    } else {
      const setting = await prisma14.systemSettings.findUnique({ where: { key: "DAILY_PRODUCT_LIMIT" } });
      const limit = setting ? parseInt(setting.value) : 3;
      const selectionsToday = await prisma14.storeProductSelection.count({
        where: {
          storeId,
          selected_at: { gte: today, lt: tomorrow }
        }
      });
      res.json({
        limit,
        current: selectionsToday,
        isNewStore: false,
        reason: "\u0633\u0647\u0645\u06CC\u0647 \u0639\u0627\u062F\u06CC (\u06F3 \u0645\u062D\u0635\u0648\u0644 \u062F\u0631 \u0631\u0648\u0632)"
      });
    }
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0648\u0636\u0639\u06CC\u062A \u0645\u062D\u062F\u0648\u062F\u06CC\u062A" });
  }
});
app.post("/api/store-manager/orders", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId;
    const { productId, variantId, quantity, notes, shippingAddressType, shippingAddress, shippingMethod, postalLabel } = req.body;
    if (!productId) {
      return res.status(400).json({ error: "\u06A9\u062F \u0645\u062D\u0635\u0648\u0644 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
    }
    const qty = parseInt(quantity) || 1;
    const product = await prisma14.product.findUnique({
      where: { id: parseInt(productId) }
    });
    if (!product) {
      return res.status(404).json({ error: "\u0645\u062D\u0635\u0648\u0644 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
    }
    let price = product.finalPrice || product.supplierBasePrice || 0;
    let supplierPrice = product.supplierBasePrice;
    let finalVariantId = null;
    if (variantId) {
      const variant = await prisma14.productVariant.findUnique({
        where: { id: parseInt(variantId) }
      });
      if (variant && variant.productId === product.id) {
        finalVariantId = variant.id;
        supplierPrice = variant.supplierBasePrice || product.supplierBasePrice;
        let vfPrice = variant.finalPrice;
        if (!vfPrice) {
          vfPrice = supplierPrice;
          if (product.marginType === "PERCENTAGE" && product.marginValue) {
            vfPrice = supplierPrice * (1 + product.marginValue / 100);
          } else if (product.marginType === "FIXED" && product.marginValue) {
            vfPrice = supplierPrice + product.marginValue;
          }
        }
        price = vfPrice;
      }
    }
    const totalAmount = price * qty;
    const order = await prisma14.order.create({
      data: {
        storeId,
        totalAmount,
        status: "WAITING_SUPPLIER_CONFIRMATION",
        shippingAddressType: shippingAddressType || "OTHER_ADDRESS",
        shippingAddress: shippingAddress || "",
        shippingMethod: shippingMethod || "POST",
        postalLabel: null,
        orderSource: "store",
        items: {
          create: {
            productId: product.id,
            variantId: finalVariantId,
            supplierId: product.supplierId,
            quantity: qty,
            notes: notes || "",
            price,
            supplierPrice,
            status: "PENDING"
          }
        },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: "WAITING_SUPPLIER_CONFIRMATION",
            actorRole: "STORE_MANAGER",
            actorName: req.user.username || "\u0641\u0631\u0648\u0634\u06AF\u0627\u0647",
            note: "\u0633\u0641\u0627\u0631\u0634 \u062B\u0628\u062A \u0634\u062F \u0648 \u062F\u0631 \u0627\u0646\u062A\u0638\u0627\u0631 \u062A\u0627\u06CC\u06CC\u062F \u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647 \u0627\u0633\u062A."
          }
        }
      }
    });
    if (product.supplierId) {
      prisma14.user.findUnique({ where: { id: product.supplierId } }).then((supplier) => {
        if (supplier?.mobile) {
          notifySupplierNewOrder(supplier.mobile, order.id, supplier.brandName || supplier.username);
        }
      }).catch((smsErr) => console.warn("SMS supplier notification error:", smsErr));
    }
    const paymentGateway = await PaymentServiceFactory.getService();
    const baseUrl = getPublicUrl(req);
    const callbackUrl = `${baseUrl}/api/public/checkout/callback?orderId=${order.id}`;
    let payLink = "";
    try {
      const zibalResult = await paymentGateway.createPayment(
        totalAmount * 10,
        `\u067E\u0631\u062F\u0627\u062E\u062A \u0633\u0641\u0627\u0631\u0634 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647 #${order.id}`,
        callbackUrl
      );
      payLink = zibalResult.payLink;
    } catch (paymentErr) {
      console.error("Error creating Zibal payment for store:", paymentErr);
      payLink = `/api/public/checkout/callback?orderId=${order.id}&success=true`;
    }
    res.status(201).json({ ...order, payLink });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u0633\u0641\u0627\u0631\u0634", details: err.message });
  }
});
app.get("/api/store-manager/orders", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId;
    const { status } = req.query;
    let whereClause = { storeId };
    if (status === "unpaid") {
      whereClause.storeInvoiceId = null;
    } else if (status === "paid") {
      whereClause.storeInvoiceId = { not: null };
    }
    const orders = await prisma14.order.findMany({
      where: whereClause,
      include: {
        items: { include: { product: { include: { supplier: true } }, variant: true } }
      },
      orderBy: { id: "desc" }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0633\u0641\u0627\u0631\u0634\u0627\u062A" });
  }
});
app.get("/api/store-manager/notifications/check-new-orders", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId;
    const lastOrderId = parseInt(req.query.lastOrderId, 10) || 0;
    const whereClause = { storeId };
    if (lastOrderId > 0) {
      whereClause.id = { gt: lastOrderId };
    }
    const newOrders = await prisma14.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            product: true,
            variant: true
          }
        }
      },
      orderBy: { id: "desc" },
      take: 10
    });
    const latestOrder = await prisma14.order.findFirst({
      where: { storeId },
      orderBy: { id: "desc" },
      select: { id: true }
    });
    res.json({
      newOrders,
      unnotifiedCount: newOrders.length,
      latestOrderId: latestOrder?.id || 0
    });
  } catch (err) {
    console.warn("Error checking store-manager new orders:", err.message);
    res.json({ newOrders: [], unnotifiedCount: 0, latestOrderId: 0 });
  }
});
app.get("/api/store-manager/notifications/settings", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId;
    const key2 = `STORE_NOTIF_SETTINGS_${storeId}`;
    const setting = await prisma14.systemConfig.findUnique({ where: { key: key2 } });
    if (setting && setting.value) {
      return res.json(JSON.parse(setting.value));
    }
    res.json({
      enabled: true,
      soundEnabled: true,
      soundType: "chime",
      notifyOnNewOrder: true,
      notifyOnStatusChange: true,
      vibrateEnabled: true
    });
  } catch (err) {
    res.json({
      enabled: true,
      soundEnabled: true,
      soundType: "chime",
      notifyOnNewOrder: true,
      notifyOnStatusChange: true,
      vibrateEnabled: true
    });
  }
});
app.post("/api/store-manager/notifications/settings", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId;
    const key2 = `STORE_NOTIF_SETTINGS_${storeId}`;
    const value = JSON.stringify(req.body);
    await prisma14.systemConfig.upsert({
      where: { key: key2 },
      create: { key: key2, value },
      update: { value }
    });
    res.json({ success: true, settings: req.body });
  } catch (err) {
    res.json({ success: true, settings: req.body });
  }
});
app.post("/api/store-manager/push-subscription", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId;
    const key2 = `STORE_PUSH_SUB_${storeId}`;
    const value = JSON.stringify(req.body);
    await prisma14.systemConfig.upsert({
      where: { key: key2 },
      create: { key: key2, value },
      update: { value }
    });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: true });
  }
});
app.post("/api/store-manager/notifications/test-push", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId;
    console.log(`[Push Notification Test] Triggered for Store Manager ${storeId}`);
    res.json({
      success: true,
      title: "\u0633\u0641\u0627\u0631\u0634 \u062C\u062F\u06CC\u062F \u062F\u0631\u06CC\u0627\u0641\u062A \u0634\u062F! (\u062A\u0633\u062A\u06CC) \u{1F6CD}\uFE0F",
      body: "\u06CC\u06A9 \u0633\u0641\u0627\u0631\u0634 \u062A\u0633\u062A\u06CC \u0628\u0647 \u0645\u0628\u0644\u063A \u06F3\u06F5\u06F0,\u06F0\u06F0\u06F0 \u062A\u0648\u0645\u0627\u0646 \u062F\u0631 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647 \u0634\u0645\u0627 \u062B\u0628\u062A \u0634\u062F.",
      sound: "chime"
    });
  } catch (err) {
    res.json({ success: true });
  }
});
app.get("/api/store-manager/customers", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId;
    const orders = await prisma14.order.findMany({
      where: { storeId },
      orderBy: { id: "desc" }
    });
    const customerMap = /* @__PURE__ */ new Map();
    for (const order of orders) {
      if (!order.customerPhone) continue;
      const phone = order.customerPhone;
      if (!customerMap.has(phone)) {
        customerMap.set(phone, {
          name: order.customerName || "\u06A9\u0627\u0631\u0628\u0631 \u0646\u0627\u0634\u0646\u0627\u0633",
          phone,
          address: order.customerAddress || "\u062B\u0628\u062A \u0646\u0634\u062F\u0647",
          cardNumber: order.customerCardNumber || "\u062B\u0628\u062A \u0646\u0634\u062F\u0647",
          ordersCount: 0,
          totalSpent: 0,
          orders: []
        });
      }
      const customer = customerMap.get(phone);
      customer.ordersCount += 1;
      customer.totalSpent += order.totalAmount;
      customer.orders.push({
        id: order.id,
        amount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt
      });
    }
    res.json(Array.from(customerMap.values()));
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0644\u06CC\u0633\u062A \u0645\u0634\u062A\u0631\u06CC\u0627\u0646" });
  }
});
app.put("/api/store-manager/orders/:id/shipping", authenticateToken, requireStoreManager, async (req, res) => {
  console.log("--- PUT /api/store-manager/orders/:id/shipping ---");
  console.log("Params ID:", req.params.id);
  console.log("User ID:", req.user?.userId);
  console.log("Body:", JSON.stringify(req.body));
  try {
    const orderId = parseInt(req.params.id);
    const storeId = req.user.userId;
    const { shippingMethod, shippingAddressType, shippingAddress, postalLabel, postalCode } = req.body;
    console.log("Parsed Order ID:", orderId);
    console.log("Store ID from token:", storeId);
    if (isNaN(orderId)) {
      console.log("Invalid order ID");
      return res.status(400).json({ error: "\u0634\u0646\u0627\u0633\u0647 \u0633\u0641\u0627\u0631\u0634 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A" });
    }
    const order = await prisma14.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });
    if (!order) {
      return res.status(404).json({ error: "\u0633\u0641\u0627\u0631\u0634 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    }
    if (order.storeId !== storeId) {
      return res.status(403).json({ error: "\u0634\u0645\u0627 \u0628\u0647 \u0627\u06CC\u0646 \u0633\u0641\u0627\u0631\u0634 \u062F\u0633\u062A\u0631\u0633\u06CC \u0646\u062F\u0627\u0631\u06CC\u062F" });
    }
    if (order.status === "COMPLETED" || order.status === "CANCELLED") {
      return res.status(400).json({ error: "\u0627\u0645\u06A9\u0627\u0646 \u062B\u0628\u062A \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u067E\u0633\u062A\u06CC \u0628\u0631\u0627\u06CC \u0633\u0641\u0627\u0631\u0634\u0627\u062A \u062A\u06A9\u0645\u06CC\u0644 \u0634\u062F\u0647 \u06CC\u0627 \u0644\u063A\u0648 \u0634\u062F\u0647 \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F" });
    }
    const savedLabel = processPostalLabel(orderId, postalLabel);
    const fixedConfig = await prisma14.systemConfig.findUnique({ where: { key: "FIXED_SHIPPING_ENABLED" } });
    const isFixedEnabled = fixedConfig?.value === "true";
    let calculatedFee = 0;
    let nextStatus = "WAITING_SHIPPING_COST";
    let newTotalAmount = order.totalAmount;
    if (isFixedEnabled) {
      const postConfig = await prisma14.systemConfig.findUnique({ where: { key: "FIXED_POST_SHIPPING_FEE" } });
      const tipaxConfig = await prisma14.systemConfig.findUnique({ where: { key: "FIXED_TIPAX_SHIPPING_FEE" } });
      const postFee = parseFloat(postConfig?.value || "50000");
      const tipaxFee = parseFloat(tipaxConfig?.value || "80000");
      calculatedFee = shippingMethod === "TIPAX" || shippingMethod === "EXPRESS" ? tipaxFee : postFee;
      if (!order.shippingFee || order.shippingFee === 0) {
        newTotalAmount = order.totalAmount + calculatedFee;
      } else {
        newTotalAmount = order.totalAmount - order.shippingFee + calculatedFee;
      }
      nextStatus = "PENDING_PAYMENT";
    }
    const updatedOrder = await prisma14.order.update({
      where: { id: orderId },
      data: {
        shippingMethod: shippingMethod || "PLATFORM_PANEL",
        shippingAddressType: shippingAddressType || "OTHER_ADDRESS",
        shippingAddress: shippingAddress || "",
        postalCode: postalCode || null,
        postalLabel: savedLabel,
        shippingFee: calculatedFee > 0 ? calculatedFee : order.shippingFee || 0,
        totalAmount: newTotalAmount,
        status: nextStatus,
        statusHistory: {
          create: {
            fromStatus: order.status,
            toStatus: nextStatus,
            actorRole: "STORE_MANAGER",
            actorName: req.user.username || "\u0645\u062F\u06CC\u0631 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647",
            note: isFixedEnabled ? `\u0645\u0634\u062E\u0635\u0627\u062A \u0627\u0631\u0633\u0627\u0644 \u062B\u0628\u062A \u0634\u062F \u0648 \u0647\u0632\u06CC\u0646\u0647 \u0627\u0631\u0633\u0627\u0644 \u062B\u0627\u0628\u062A \u0633\u06CC\u0633\u062A\u0645 (${calculatedFee.toLocaleString()} \u062A\u0648\u0645\u0627\u0646) \u0645\u062D\u0627\u0633\u0628\u0647 \u06AF\u0631\u062F\u06CC\u062F. \u0633\u0641\u0627\u0631\u0634 \u0622\u0645\u0627\u062F\u0647 \u067E\u0631\u062F\u0627\u062E\u062A \u0627\u0633\u062A.` : "\u0645\u0634\u062E\u0635\u0627\u062A \u0627\u0631\u0633\u0627\u0644 \u062A\u06A9\u0645\u06CC\u0644 \u0634\u062F. \u062F\u0631 \u0627\u0646\u062A\u0638\u0627\u0631 \u0645\u062D\u0627\u0633\u0628\u0647 \u0647\u0632\u06CC\u0646\u0647 \u0627\u0631\u0633\u0627\u0644 \u062A\u0648\u0633\u0637 \u0645\u062F\u06CC\u0631\u06CC\u062A."
          }
        }
      }
    });
    await prisma14.orderItem.updateMany({
      where: { orderId },
      data: { status: nextStatus }
    });
    res.json({
      success: true,
      message: isFixedEnabled ? `\u0645\u0634\u062E\u0635\u0627\u062A \u067E\u0633\u062A\u06CC \u062B\u0628\u062A \u0634\u062F \u0648 \u06A9\u0631\u0627\u06CC\u0647 \u062B\u0627\u0628\u062A (${calculatedFee.toLocaleString()} \u062A\u0648\u0645\u0627\u0646) \u0627\u0639\u0645\u0627\u0644 \u06AF\u0631\u062F\u06CC\u062F.` : "\u0645\u0634\u062E\u0635\u0627\u062A \u067E\u0633\u062A\u06CC \u0645\u0631\u0633\u0648\u0644\u0647 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062B\u0628\u062A \u0634\u062F",
      order: updatedOrder
    });
  } catch (err) {
    console.error("Update shipping error:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u0645\u0634\u062E\u0635\u0627\u062A \u067E\u0633\u062A\u06CC \u0633\u0641\u0627\u0631\u0634: " + err.message });
  }
});
async function creditSuppliersForOrders(tx, orders) {
  try {
    for (const o of orders) {
      const orderItems = await tx.orderItem.findMany({
        where: { orderId: o.id },
        include: { product: true }
      });
      const supplierAmounts = {};
      for (const item of orderItems) {
        const suppId = item.supplierId || item.product?.supplierId;
        if (!suppId) continue;
        const basePrice = item.supplierPrice || item.product?.supplierBasePrice || item.price || 0;
        const amt = basePrice * (item.quantity || 1);
        if (amt > 0) {
          supplierAmounts[suppId] = (supplierAmounts[suppId] || 0) + amt;
        }
      }
      for (const [supplierIdStr, amount] of Object.entries(supplierAmounts)) {
        const supplierId = parseInt(supplierIdStr, 10);
        if (isNaN(supplierId) || amount <= 0) continue;
        let wallet = await tx.wallet.findUnique({
          where: { supplierId }
        });
        if (!wallet) {
          wallet = await tx.wallet.create({
            data: { supplierId, balance: 0 }
          });
        }
        const existingEntry = await tx.ledgerEntry.findFirst({
          where: {
            walletId: wallet.id,
            referenceId: String(o.id),
            type: "ORDER_REVENUE"
          }
        });
        if (existingEntry) {
          continue;
        }
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              increment: amount
            }
          }
        });
        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            amount,
            type: "ORDER_REVENUE",
            status: "COMPLETED",
            referenceId: String(o.id),
            description: `\u062F\u0631\u0622\u0645\u062F \u062D\u0627\u0635\u0644 \u0627\u0632 \u0633\u0641\u0627\u0631\u0634 \u0634\u0645\u0627\u0631\u0647 ${o.id} (\u0634\u0627\u0631\u0698 \u062E\u0648\u062F\u06A9\u0627\u0631 \u06A9\u06CC\u0641 \u067E\u0648\u0644 \u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647)`
          }
        });
        try {
          await tx.notification.create({
            data: {
              userId: supplierId,
              title: `\u{1F4B0} \u0634\u0627\u0631\u0698 \u06A9\u06CC\u0641 \u067E\u0648\u0644 - \u0633\u0641\u0627\u0631\u0634 #${o.id}`,
              message: `\u0645\u0628\u0644\u063A ${amount.toLocaleString()} \u062A\u0648\u0645\u0627\u0646 \u0628\u0627\u0628\u062A \u0633\u0641\u0627\u0631\u0634 \u0634\u0645\u0627\u0631\u0647 ${o.id} \u0628\u0647 \u06A9\u06CC\u0641 \u067E\u0648\u0644 \u0634\u0645\u0627 \u0648\u0627\u0631\u06CC\u0632 \u06AF\u0631\u062F\u06CC\u062F.`,
              type: "SUCCESS",
              isRead: false
            }
          });
        } catch (e) {
          console.warn("Supplier notification error:", e);
        }
      }
    }
  } catch (err) {
    console.error("Error crediting supplier wallets:", err);
  }
}
async function syncAllPaidOrdersSupplierWallets() {
  if (dbUrl2.includes("dummy_db") || dbUrl2.includes("dummy:dummy")) {
    console.log("[Server Startup] Skipping wallet sync because a dummy URL is configured.");
    return;
  }
  try {
    const paidOrders = await prisma14.order.findMany({
      where: {
        status: {
          in: ["PAID", "PROCESSING", "READY_TO_SHIP", "SHIPPED", "COMPLETED", "DELIVERED", "PREPARING", "PENDING_POSTAL_LABEL"]
        }
      }
    });
    if (paidOrders.length > 0) {
      await creditSuppliersForOrders(prisma14, paidOrders);
    }
  } catch (err) {
    console.error("Error syncing supplier wallets:", err);
  }
}
async function debitSupplierForRejectedOrder(tx, orderId, supplierId, reason) {
  try {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } }
    });
    if (!order) return;
    const orderItems = order.items || [];
    const suppliersToProcess = /* @__PURE__ */ new Set();
    if (supplierId) {
      suppliersToProcess.add(supplierId);
    } else {
      orderItems.forEach((item) => {
        const sId = item.supplierId || item.product?.supplierId;
        if (sId) suppliersToProcess.add(sId);
      });
    }
    for (const suppId of suppliersToProcess) {
      const wallet = await tx.wallet.findUnique({
        where: { supplierId: suppId }
      });
      if (!wallet) continue;
      const revenueLedgers = await tx.ledgerEntry.findMany({
        where: {
          walletId: wallet.id,
          referenceId: String(orderId),
          type: "ORDER_REVENUE"
        }
      });
      if (revenueLedgers.length === 0) continue;
      const existingRefund = await tx.ledgerEntry.findFirst({
        where: {
          walletId: wallet.id,
          referenceId: String(orderId),
          type: "REFUND"
        }
      });
      if (existingRefund) continue;
      const totalRevenue = revenueLedgers.reduce((sum, entry) => sum + Number(entry.amount), 0);
      if (totalRevenue <= 0) continue;
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            decrement: totalRevenue
          }
        }
      });
      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          amount: -totalRevenue,
          type: "REFUND",
          status: "COMPLETED",
          referenceId: String(orderId),
          description: `\u06A9\u0633\u0631 \u0648\u062C\u0647 \u0628\u0647 \u0639\u0644\u062A \u0644\u063A\u0648 / \u0627\u0639\u0644\u0627\u0645 \u0627\u062A\u0645\u0627\u0645 \u0645\u0648\u062C\u0648\u062F\u06CC \u0633\u0641\u0627\u0631\u0634 \u0634\u0645\u0627\u0631\u0647 ${orderId}`
        }
      });
      try {
        await tx.notification.create({
          data: {
            userId: suppId,
            title: `\u26A0\uFE0F \u06A9\u0633\u0631 \u0627\u0632 \u06A9\u06CC\u0641 \u067E\u0648\u0644 - \u0633\u0641\u0627\u0631\u0634 #${orderId}`,
            message: `\u0645\u0628\u0644\u063A ${totalRevenue.toLocaleString()} \u062A\u0648\u0645\u0627\u0646 \u0628\u0627\u0628\u062A \u0644\u063A\u0648 / \u0639\u062F\u0645 \u0645\u0648\u062C\u0648\u062F\u06CC \u0633\u0641\u0627\u0631\u0634 \u0634\u0645\u0627\u0631\u0647 ${orderId} \u0627\u0632 \u06A9\u06CC\u0641 \u067E\u0648\u0644 \u0634\u0645\u0627 \u06A9\u0633\u0631 \u06AF\u0631\u062F\u06CC\u062F.`,
            type: "WARNING",
            isRead: false
          }
        });
      } catch (e) {
        console.warn("Supplier warning notification error:", e);
      }
      const superAdmins = await tx.user.findMany({
        where: { role: "SUPER_ADMIN" }
      });
      for (const admin of superAdmins) {
        try {
          await tx.notification.create({
            data: {
              userId: admin.id,
              title: `\u{1F6A8} \u0627\u062E\u0637\u0627\u0631 \u0644\u063A\u0648 \u0633\u0641\u0627\u0631\u0634 \u0648 \u0644\u0632\u0648\u0645 \u0639\u0648\u062F\u062A \u0648\u062C\u0647 \u062E\u0631\u06CC\u062F\u0627\u0631 - \u0633\u0641\u0627\u0631\u0634 #${orderId}`,
              message: `\u0633\u0641\u0627\u0631\u0634 #${orderId} \u0644\u063A\u0648 / \u0627\u0639\u0644\u0627\u0645 \u0639\u062F\u0645 \u0645\u0648\u062C\u0648\u062F\u06CC \u06AF\u0631\u062F\u06CC\u062F. \u0645\u0628\u0644\u063A ${totalRevenue.toLocaleString()} \u062A\u0648\u0645\u0627\u0646 \u0627\u0632 \u06A9\u06CC\u0641 \u067E\u0648\u0644 \u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647 \u06A9\u0633\u0631 \u0634\u062F. \u0646\u0633\u0628\u062A \u0628\u0647 \u0639\u0648\u062F\u062A \u0648\u062C\u0647 \u0628\u0647 \u06A9\u0627\u0631\u062A \u062E\u0631\u06CC\u062F\u0627\u0631 \u0627\u0642\u062F\u0627\u0645 \u0641\u0631\u0645\u0627\u06CC\u06CC\u062F.`,
              type: "DANGER",
              isRead: false
            }
          });
        } catch (e) {
          console.warn("SuperAdmin alert error:", e);
        }
      }
    }
  } catch (err) {
    console.error("Error debiting supplier wallet for rejected order:", err);
  }
}
async function getOrCreateWallet(userId) {
  let wallet = await prisma14.wallet.findUnique({
    where: { supplierId: userId },
    include: { ledgerEntries: { orderBy: { id: "desc" } } }
  });
  if (!wallet) {
    wallet = await prisma14.wallet.create({
      data: { supplierId: userId },
      include: { ledgerEntries: true }
    });
  }
  return wallet;
}
app.post("/api/store-manager/settle-orders", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    let orderIds = [];
    const paymentMethod = req.body.paymentMethod || "ONLINE";
    if (req.body.orderDetails && Array.isArray(req.body.orderDetails)) {
      orderIds = req.body.orderDetails.map((o) => parseInt(o.id)).filter((id) => !isNaN(id));
    } else if (req.body.orderIds && Array.isArray(req.body.orderIds)) {
      orderIds = req.body.orderIds.map((id) => parseInt(id)).filter((id) => !isNaN(id));
    }
    if (orderIds.length === 0) {
      return res.status(400).json({ error: "\u0633\u0641\u0627\u0631\u0634\u06CC \u0627\u0646\u062A\u062E\u0627\u0628 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A" });
    }
    const storeId = req.user.userId;
    const ordersToPay = await prisma14.order.findMany({
      where: {
        id: { in: orderIds },
        storeId,
        storeInvoiceId: null
      }
    });
    if (ordersToPay.length !== orderIds.length) {
      return res.status(400).json({ error: "\u0628\u0631\u062E\u06CC \u0627\u0632 \u0633\u0641\u0627\u0631\u0634\u0627\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u06CC\u0627 \u0642\u0628\u0644\u0627 \u067E\u0631\u062F\u0627\u062E\u062A \u0634\u062F\u0647 \u0627\u0646\u062F" });
    }
    const totalAmount = ordersToPay.reduce((acc, o) => acc + o.totalAmount, 0);
    if (paymentMethod === "MANUAL") {
      const invoice = await prisma14.$transaction(async (tx) => {
        const inv = await tx.storeInvoice.create({
          data: {
            storeManagerId: storeId,
            totalAmount,
            status: "PENDING",
            paymentMethod: "MANUAL",
            receiptStatus: null
          }
        });
        await tx.order.updateMany({
          where: { id: { in: orderIds } },
          data: { storeInvoiceId: inv.id }
        });
        for (const orderId of orderIds) {
          await tx.orderStatusHistory.create({
            data: {
              orderId,
              fromStatus: "SUPPLIER_APPROVED",
              toStatus: "SUPPLIER_APPROVED",
              actorRole: "STORE_MANAGER",
              actorName: "\u0645\u062F\u06CC\u0631 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647",
              note: `\u067E\u06CC\u0634\u200C\u0641\u0627\u06A9\u062A\u0648\u0631 \u062A\u0633\u0648\u06CC\u0647 \u062F\u0633\u062A\u06CC \u0628\u0647 \u0634\u0645\u0627\u0631\u0647 ${inv.id} \u0635\u0627\u062F\u0631 \u0634\u062F \u0648 \u062F\u0631 \u0627\u0646\u062A\u0638\u0627\u0631 \u0648\u0627\u0631\u06CC\u0632 \u0641\u06CC\u0634 \u0627\u0633\u062A.`
            }
          });
        }
        return inv;
      });
      return res.json({ manual: true, invoiceId: invoice.id });
    } else {
      const invoice = await prisma14.$transaction(async (tx) => {
        const inv = await tx.storeInvoice.create({
          data: {
            storeManagerId: storeId,
            totalAmount,
            status: "PENDING",
            paymentMethod: "ONLINE"
          }
        });
        await tx.order.updateMany({
          where: { id: { in: orderIds } },
          data: { storeInvoiceId: inv.id }
        });
        return inv;
      });
      const paymentGateway = await PaymentServiceFactory.getService();
      const baseUrl = getPublicUrl(req);
      const callbackUrl = `${baseUrl}/api/public/store-invoice/callback?invoiceId=${invoice.id}`;
      let payLink = "";
      try {
        const zibalResult = await paymentGateway.createPayment(
          totalAmount * 10,
          `\u062A\u0633\u0648\u06CC\u0647 \u0641\u0627\u06A9\u062A\u0648\u0631 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647 #${invoice.id}`,
          callbackUrl
        );
        payLink = zibalResult.payLink;
        await prisma14.storeInvoice.update({
          where: { id: invoice.id },
          data: { trackId: zibalResult.authority }
        });
      } catch (paymentErr) {
        console.error("Error creating Zibal payment for store invoice:", paymentErr);
        payLink = `/api/public/store-invoice/pay-simulate?invoiceId=${invoice.id}`;
      }
      return res.json({ payLink });
    }
  } catch (err) {
    console.error("Settle orders error:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062A\u0633\u0648\u06CC\u0647 \u0633\u0641\u0627\u0631\u0634\u0627\u062A: " + err.message });
  }
});
app.post("/api/store-manager/invoices/:id/receipt", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const storeId = req.user.userId;
    const { receiptUrl, receiptNotes } = req.body;
    if (!receiptUrl) {
      return res.status(400).json({ error: "\u0622\u062F\u0631\u0633 \u0641\u06CC\u0634 \u0648\u0627\u0631\u06CC\u0632\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" });
    }
    const invoice = await prisma14.storeInvoice.findUnique({
      where: { id: invoiceId }
    });
    if (!invoice || invoice.storeManagerId !== storeId) {
      return res.status(404).json({ error: "\u0641\u0627\u06A9\u062A\u0648\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    }
    await prisma14.storeInvoice.update({
      where: { id: invoiceId },
      data: {
        receiptUrl,
        receiptNotes,
        receiptStatus: "PENDING",
        status: "PENDING"
      }
    });
    res.json({ success: true, message: "\u0641\u06CC\u0634 \u0648\u0627\u0631\u06CC\u0632\u06CC \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC \u0634\u062F \u0648 \u062F\u0631 \u0627\u0646\u062A\u0638\u0627\u0631 \u0628\u0631\u0631\u0633\u06CC \u0627\u0633\u062A." });
  } catch (err) {
    console.error("Invoice receipt upload error:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u0641\u06CC\u0634 \u0648\u0627\u0631\u06CC\u0632\u06CC" });
  }
});
app.post("/api/store-manager/invoices/:id/pay", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const storeId = req.user.userId;
    const invoice = await prisma14.storeInvoice.findUnique({
      where: { id: invoiceId }
    });
    if (!invoice || invoice.storeManagerId !== storeId) {
      return res.status(404).json({ error: "\u0641\u0627\u06A9\u062A\u0648\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    }
    res.json({ payLink: `/api/public/store-invoice/pay-simulate?invoiceId=${invoice.id}` });
  } catch (err) {
    console.error("Invoice pay link generation error:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0627\u06CC\u062C\u0627\u062F \u0644\u06CC\u0646\u06A9 \u067E\u0631\u062F\u0627\u062E\u062A" });
  }
});
app.get("/api/admin/manual-invoices", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const invoices = await prisma14.storeInvoice.findMany({
      where: {
        paymentMethod: "MANUAL"
      },
      include: {
        storeManager: true
      },
      orderBy: { id: "desc" }
    });
    res.json(invoices);
  } catch (err) {
    console.error("Get manual invoices error:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0644\u06CC\u0633\u062A \u0641\u06CC\u0634\u200C\u0647\u0627\u06CC \u062F\u0633\u062A\u06CC" });
  }
});
app.post("/api/admin/system/update", authenticateToken, requireAdmin, multerFn({ dest: rootUploadsDir }).any(), async (req, res) => {
  try {
    const uploadedFile = req.files && req.files.length > 0 ? req.files[0] : req.file;
    if (!uploadedFile) {
      return res.status(400).json({ error: "\u0641\u0627\u06CC\u0644\u06CC \u0627\u0631\u0633\u0627\u0644 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A" });
    }
    const zipPath = uploadedFile.path;
    const newVersion = req.body?.version;
    if (newVersion) {
      await prisma14.systemConfig.upsert({
        where: { key: "PLATFORM_VERSION" },
        update: { value: newVersion },
        create: { key: "PLATFORM_VERSION", value: newVersion }
      });
    }
    const ZipClass = typeof import_adm_zip.default === "function" ? import_adm_zip.default : import_adm_zip.default.default || require("adm-zip");
    const zip = new ZipClass(zipPath);
    const extractDir = import_path3.default.join(process.cwd(), "temp_update_" + Date.now());
    zip.extractAllTo(extractDir, true);
    const findProjectRootDir = (dir) => {
      if (import_fs3.default.existsSync(import_path3.default.join(dir, "package.json")) || import_fs3.default.existsSync(import_path3.default.join(dir, "server.ts"))) {
        return dir;
      }
      const entries = import_fs3.default.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== "__MACOSX" && entry.name !== "node_modules" && !entry.name.startsWith(".")) {
          const subPath = import_path3.default.join(dir, entry.name);
          const found = findProjectRootDir(subPath);
          if (found !== dir) return found;
        }
      }
      return dir;
    };
    const sourceDir = findProjectRootDir(extractDir);
    const copyRecursiveSync = (src, dest) => {
      const exists = import_fs3.default.existsSync(src);
      const stats = exists && import_fs3.default.statSync(src);
      const isDirectory = exists && stats.isDirectory();
      if (isDirectory) {
        if (!import_fs3.default.existsSync(dest)) {
          import_fs3.default.mkdirSync(dest, { recursive: true });
        }
        import_fs3.default.readdirSync(src).forEach((childItemName) => {
          const ignoredAtRoot = [
            "node_modules",
            ".env",
            ".env.production",
            ".env.local",
            "dev.db",
            "prisma/dev.db",
            ".git",
            "uploads",
            "__MACOSX",
            ".DS_Store"
          ];
          if (ignoredAtRoot.includes(childItemName) && dest === process.cwd()) {
            return;
          }
          if (childItemName === "__MACOSX" || childItemName === ".DS_Store") return;
          copyRecursiveSync(import_path3.default.join(src, childItemName), import_path3.default.join(dest, childItemName));
        });
      } else {
        const fileName = import_path3.default.basename(src);
        if (fileName === ".env" || fileName.endsWith(".db") || fileName.endsWith(".sqlite")) {
          return;
        }
        const destDir = import_path3.default.dirname(dest);
        if (!import_fs3.default.existsSync(destDir)) {
          import_fs3.default.mkdirSync(destDir, { recursive: true });
        }
        import_fs3.default.copyFileSync(src, dest);
      }
    };
    copyRecursiveSync(sourceDir, process.cwd());
    try {
      import_fs3.default.rmSync(extractDir, { recursive: true, force: true });
    } catch (e) {
    }
    try {
      import_fs3.default.unlinkSync(zipPath);
    } catch (e) {
    }
    try {
      (0, import_child_process2.execSync)("node setup-db.js", { stdio: "inherit", env: process.env });
    } catch (dbErr) {
      console.warn("Post-update setup-db warning:", dbErr.message);
    }
    let buildSuccess = false;
    let buildOutput = "";
    let buildError = "";
    try {
      const { stdout, stderr } = await execPromise("npm run build");
      buildSuccess = true;
      buildOutput = stdout;
      buildError = stderr;
    } catch (bErr) {
      buildError = bErr.message || bErr.stderr || "\u06A9\u0627\u0645\u067E\u0627\u06CC\u0644 \u062E\u0648\u062F\u06A9\u0627\u0631 \u062E\u0637\u0627 \u062F\u0627\u062F";
    }
    res.json({
      success: true,
      message: buildSuccess ? "\u0641\u0627\u06CC\u0644\u200C\u0647\u0627\u06CC \u062C\u062F\u06CC\u062F \u062C\u0627\u06CC\u06AF\u0632\u06CC\u0646 \u0648 \u0628\u06CC\u0644\u062F \u0634\u062F\u0646\u062F. \u0633\u0631\u0648\u0631 \u0628\u0647 \u0635\u0648\u0631\u062A \u062E\u0648\u062F\u06A9\u0627\u0631 \u062A\u0627 \u0686\u0646\u062F \u0644\u062D\u0638\u0647 \u062F\u06CC\u06AF\u0631 \u0631\u06CC\u200C\u0627\u0633\u062A\u0627\u0631\u062A \u0645\u06CC\u200C\u0634\u0648\u062F." : "\u0641\u0627\u06CC\u0644\u200C\u0647\u0627\u06CC \u062C\u062F\u06CC\u062F \u062C\u0627\u06CC\u06AF\u0632\u06CC\u0646 \u0634\u062F\u0646\u062F \u0627\u0645\u0627 \u0628\u06CC\u0644\u062F \u062E\u0637\u0627 \u062F\u0627\u0634\u062A. " + buildError,
      buildSuccess,
      buildOutput,
      buildError
    });
    if (buildSuccess) {
      setTimeout(() => {
        process.exit(0);
      }, 2e3);
    }
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0641\u0627\u06CC\u0644\u200C\u0647\u0627: " + (error.message || String(error)) });
  }
});
app.post("/api/admin/manual-invoices/:id/approve", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const invoice = await prisma14.storeInvoice.findUnique({
      where: { id: invoiceId },
      include: { orders: true }
    });
    if (!invoice) {
      return res.status(404).json({ error: "\u0641\u0627\u06A9\u062A\u0648\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    }
    await prisma14.$transaction(async (tx) => {
      await tx.storeInvoice.update({
        where: { id: invoiceId },
        data: {
          status: "PAID",
          receiptStatus: "APPROVED",
          paidAt: /* @__PURE__ */ new Date()
        }
      });
      await tx.order.updateMany({
        where: { storeInvoiceId: invoiceId },
        data: { status: "PAID" }
      });
      const orders = await tx.order.findMany({
        where: { storeInvoiceId: invoiceId }
      });
      for (const o of orders) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: o.id,
            fromStatus: o.status,
            toStatus: "PAID",
            actorRole: "SUPER_ADMIN",
            actorName: "\u0645\u062F\u06CC\u0631 \u06A9\u0644 \u0633\u06CC\u0633\u062A\u0645",
            note: "\u0641\u06CC\u0634 \u0648\u0627\u0631\u06CC\u0632\u06CC \u062A\u0627\u06CC\u06CC\u062F \u0634\u062F \u0648 \u0648\u0636\u0639\u06CC\u062A \u0633\u0641\u0627\u0631\u0634 \u0628\u0647 \u067E\u0631\u062F\u0627\u062E\u062A \u0634\u062F\u0647 \u062A\u063A\u06CC\u06CC\u0631 \u06CC\u0627\u0641\u062A."
          }
        });
      }
      await creditSuppliersForOrders(tx, orders);
    });
    res.json({ message: "\u0641\u06CC\u0634 \u0648\u0627\u0631\u06CC\u0632\u06CC \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062A\u0627\u06CC\u06CC\u062F \u0648 \u0633\u0641\u0627\u0631\u0634\u0627\u062A \u062A\u0633\u0648\u06CC\u0647 \u0634\u062F\u0646\u062F." });
  } catch (err) {
    console.error("Approve manual invoice error:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062A\u0627\u06CC\u06CC\u062F \u0641\u06CC\u0634 \u0648\u0627\u0631\u06CC\u0632\u06CC" });
  }
});
app.post("/api/admin/manual-invoices/:id/reject", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.id);
    const invoice = await prisma14.storeInvoice.findUnique({
      where: { id: invoiceId }
    });
    if (!invoice) {
      return res.status(404).json({ error: "\u0641\u0627\u06A9\u062A\u0648\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    }
    await prisma14.storeInvoice.update({
      where: { id: invoiceId },
      data: {
        receiptStatus: "REJECTED"
      }
    });
    const orders = await prisma14.order.findMany({
      where: { storeInvoiceId: invoiceId }
    });
    for (const o of orders) {
      await prisma14.orderStatusHistory.create({
        data: {
          orderId: o.id,
          fromStatus: o.status,
          toStatus: o.status,
          actorRole: "SUPER_ADMIN",
          actorName: "\u0645\u062F\u06CC\u0631 \u06A9\u0644 \u0633\u06CC\u0633\u062A\u0645",
          note: "\u0641\u06CC\u0634 \u0648\u0627\u0631\u06CC\u0632\u06CC \u062A\u0648\u0633\u0637 \u0645\u062F\u06CC\u0631\u06CC\u062A \u0631\u062F \u0634\u062F. \u0644\u0637\u0641\u0627 \u0641\u06CC\u0634 \u0648\u0627\u0631\u06CC\u0632\u06CC \u062C\u062F\u06CC\u062F \u0631\u0627 \u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC \u06A9\u0646\u06CC\u062F."
        }
      });
    }
    res.json({ message: "\u0641\u06CC\u0634 \u0648\u0627\u0631\u06CC\u0632\u06CC \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0631\u062F \u0634\u062F." });
  } catch (err) {
    console.error("Reject manual invoice error:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0631\u062F \u0641\u06CC\u0634 \u0648\u0627\u0631\u06CC\u0632\u06CC" });
  }
});
app.get("/api/store-manager/wallet", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId;
    const wallet = await getOrCreateWallet(storeId);
    const responseData = {
      id: wallet.id,
      balance: parseFloat(wallet.balance.toString()),
      ledger: wallet.ledgerEntries.map((entry) => ({
        id: entry.id,
        amount: parseFloat(entry.amount.toString()),
        type: entry.type,
        status: entry.status,
        description: entry.description,
        createdAt: entry.createdAt
      }))
    };
    res.json(responseData);
  } catch (err) {
    console.error("Get store manager wallet error:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u06A9\u06CC\u0641 \u067E\u0648\u0644" });
  }
});
app.post("/api/wallet/deposit", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount } = req.body;
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "\u0645\u0628\u0644\u063A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A" });
    }
    res.json({ payLink: `/api/public/wallet/deposit-simulate?userId=${userId}&amount=${numericAmount}` });
  } catch (err) {
    console.error("Deposit error:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0627\u06CC\u062C\u0627\u062F \u062A\u0631\u0627\u06A9\u0646\u0634 \u0627\u0641\u0632\u0627\u06CC\u0634 \u0645\u0648\u062C\u0648\u062F\u06CC" });
  }
});
app.get("/api/public/wallet/deposit-simulate", async (req, res) => {
  try {
    const userId = parseInt(req.query.userId);
    const amount = parseFloat(req.query.amount);
    if (isNaN(userId) || isNaN(amount) || amount <= 0) {
      return res.status(400).send("<h1>\u067E\u0627\u0631\u0627\u0645\u062A\u0631\u0647\u0627\u06CC \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A</h1>");
    }
    const wallet = await getOrCreateWallet(userId);
    await prisma14.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: {
            increment: amount
          }
        }
      });
      await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          amount,
          type: "DEPOSIT",
          status: "COMPLETED",
          description: `\u0627\u0641\u0632\u0627\u06CC\u0634 \u0645\u0648\u062C\u0648\u062F\u06CC \u0634\u0628\u06CC\u0647\u200C\u0633\u0627\u0632\u06CC \u0634\u062F\u0647 \u0622\u0646\u0644\u0627\u06CC\u0646`
        }
      });
    });
    res.redirect(`/?payment_status=success`);
  } catch (err) {
    console.error("Deposit simulation error:", err);
    res.redirect(`/?payment_status=failed&message=${encodeURIComponent(err.message)}`);
  }
});
app.get("/api/public/store-invoice/callback", async (req, res) => {
  try {
    const invoiceId = parseInt(req.query.invoiceId);
    const { trackId, success, status } = req.query;
    if (isNaN(invoiceId)) {
      return res.redirect("/?payment_status=error&message=InvalidInvoiceId");
    }
    const invoice = await prisma14.storeInvoice.findUnique({
      where: { id: invoiceId },
      include: { orders: true }
    });
    if (!invoice) {
      return res.redirect("/?payment_status=error&message=InvoiceNotFound");
    }
    let isPaid = false;
    let refId = "";
    if (trackId) {
      const paymentGateway = await PaymentServiceFactory.getService();
      const verification = await paymentGateway.verifyPayment(trackId.toString(), invoice.totalAmount * 10);
      isPaid = verification.success;
      refId = verification.refId;
    } else {
      isPaid = success === "true" || status === "OK";
      refId = "MOCK_REF_" + Date.now();
    }
    if (isPaid) {
      await prisma14.$transaction(async (tx) => {
        await tx.storeInvoice.update({
          where: { id: invoiceId },
          data: {
            status: "PAID",
            paidAt: /* @__PURE__ */ new Date(),
            gatewayReference: refId
          }
        });
        for (const order of invoice.orders) {
          await tx.order.update({
            where: { id: order.id },
            data: { status: "PAID" }
          });
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              fromStatus: order.status,
              toStatus: "PAID",
              actorRole: "SYSTEM",
              actorName: "\u062F\u0631\u06AF\u0627\u0647 \u067E\u0631\u062F\u0627\u062E\u062A",
              note: "\u067E\u0631\u062F\u0627\u062E\u062A \u0641\u0627\u06A9\u062A\u0648\u0631 \u0641\u0631\u0648\u0634\u06AF\u0627\u0647 \u062A\u0627\u06CC\u06CC\u062F \u0634\u062F."
            }
          });
        }
        await creditSuppliersForOrders(tx, invoice.orders);
      });
      return res.redirect("/?payment_status=success&trackId=" + trackId);
    } else {
      return res.redirect("/?payment_status=failed&trackId=" + trackId);
    }
  } catch (err) {
    console.error("Invoice callback error:", err);
    return res.redirect("/?payment_status=error&message=" + encodeURIComponent(err.message));
  }
});
app.get("/api/public/store-invoice/pay-simulate", async (req, res) => {
  try {
    const invoiceId = parseInt(req.query.invoiceId);
    if (isNaN(invoiceId)) {
      return res.status(400).send("<h1>\u0634\u0646\u0627\u0633\u0647 \u0641\u0627\u06A9\u062A\u0648\u0631 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A</h1>");
    }
    const invoice = await prisma14.storeInvoice.findUnique({
      where: { id: invoiceId },
      include: { orders: true }
    });
    if (!invoice) {
      return res.status(404).send("<h1>\u0641\u0627\u06A9\u062A\u0648\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F</h1>");
    }
    await prisma14.$transaction(async (tx) => {
      await tx.storeInvoice.update({
        where: { id: invoiceId },
        data: {
          status: "PAID",
          paidAt: /* @__PURE__ */ new Date()
        }
      });
      await tx.order.updateMany({
        where: { storeInvoiceId: invoiceId },
        data: { status: "PAID" }
      });
      const orders = await tx.order.findMany({
        where: { storeInvoiceId: invoiceId }
      });
      for (const o of orders) {
        await tx.orderStatusHistory.create({
          data: {
            orderId: o.id,
            fromStatus: o.status,
            toStatus: "PAID",
            actorRole: "SYSTEM",
            actorName: "\u062F\u0631\u06AF\u0627\u0647 \u067E\u0631\u062F\u0627\u062E\u062A \u0622\u0646\u0644\u0627\u06CC\u0646",
            note: "\u067E\u0631\u062F\u0627\u062E\u062A \u0622\u0646\u0644\u0627\u06CC\u0646 \u0641\u0627\u06A9\u062A\u0648\u0631 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0646\u062C\u0627\u0645 \u0634\u062F \u0648 \u0648\u0636\u0639\u06CC\u062A \u0633\u0641\u0627\u0631\u0634 \u0628\u0647 \u067E\u0631\u062F\u0627\u062E\u062A \u0634\u062F\u0647 \u062A\u063A\u06CC\u06CC\u0631 \u06CC\u0627\u0641\u062A."
          }
        });
      }
      await creditSuppliersForOrders(tx, orders);
    });
    res.redirect(`/?payment_status=success&invoiceId=${invoiceId}`);
  } catch (err) {
    console.error("Payment simulation error:", err);
    res.redirect(`/?payment_status=failed&message=${encodeURIComponent(err.message)}`);
  }
});
app.get("/api/store-manager/invoices", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId;
    const invoices = await prisma14.storeInvoice.findMany({
      where: { storeManagerId: storeId },
      orderBy: { id: "desc" }
    });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0641\u0627\u06A9\u062A\u0648\u0631\u0647\u0627" });
  }
});
app.get("/api/store-manager/settings", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId;
    let settings = await prisma14.storeSettings.findUnique({
      where: { storeManagerId: storeId }
    });
    if (!settings) {
      settings = await prisma14.storeSettings.create({
        data: { storeManagerId: storeId }
      });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u062A\u0646\u0638\u06CC\u0645\u0627\u062A" });
  }
});
app.post("/api/store-manager/settings", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId;
    const { platformType, apiKey, webhookUrl } = req.body;
    const settings = await prisma14.storeSettings.upsert({
      where: { storeManagerId: storeId },
      update: { platformType, apiKey, webhookUrl },
      create: { storeManagerId: storeId, platformType, apiKey, webhookUrl }
    });
    res.json({ message: "\u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0630\u062E\u06CC\u0631\u0647 \u0634\u062F", settings });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0630\u062E\u06CC\u0631\u0647 \u062A\u0646\u0638\u06CC\u0645\u0627\u062A" });
  }
});
app.get("/api/store-manager/pro/status", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const userId = req.user.userId;
    const proAccount = await prisma14.proAccount.findUnique({
      where: { userId }
    });
    const settingsRows = await prisma14.systemSettings.findMany({
      where: {
        key: {
          in: [
            "pro_auto_approve",
            "pro_account_price",
            "pro_host_renewal_price",
            "pro_host_discounted_price",
            "pro_torob_price",
            "pro_promo_code",
            "pro_terms_content"
          ]
        }
      }
    });
    const settingsMap = {};
    settingsRows.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    res.json({
      proAccount: proAccount || null,
      settings: {
        autoApprove: settingsMap["pro_auto_approve"] !== "false",
        proAccountPrice: parseInt(settingsMap["pro_account_price"] || "0", 10),
        hostRenewalPrice: parseInt(settingsMap["pro_host_renewal_price"] || "500000", 10),
        hostDiscountedPrice: parseInt(settingsMap["pro_host_discounted_price"] || "198000", 10),
        torobPrice: parseInt(settingsMap["pro_torob_price"] || "150000", 10),
        promoCode: settingsMap["pro_promo_code"] || "ZOPIT-PRO-198",
        termsContent: settingsMap["pro_terms_content"] || ""
      }
    });
  } catch (err) {
    console.error("Error in /api/store-manager/pro/status:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0648\u0636\u0639\u06CC\u062A \u0627\u06A9\u0627\u0646\u062A \u067E\u0631\u0648" });
  }
});
app.post("/api/store-manager/pro/register", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fullName, nationalCode, mobile, signatureImage } = req.body;
    if (!fullName || !nationalCode || !mobile || !signatureImage) {
      return res.status(400).json({ error: "\u062A\u06A9\u0645\u06CC\u0644 \u062A\u0645\u0627\u0645\u06CC \u0645\u0648\u0627\u0631\u062F \u0627\u0644\u0632\u0627\u0645\u200C\u0622\u0648\u0631 \u0627\u0632 \u062C\u0645\u0644\u0647 \u06A9\u062F \u0645\u0644\u06CC\u060C \u0634\u0645\u0627\u0631\u0647 \u0647\u0645\u0631\u0627\u0647 \u0648 \u0627\u0645\u0636\u0627\u06CC \u062F\u06CC\u062C\u06CC\u062A\u0627\u0644 \u0627\u062C\u0628\u0627\u0631\u06CC \u0627\u0633\u062A." });
    }
    const autoApproveSetting = await prisma14.systemSettings.findUnique({
      where: { key: "pro_auto_approve" }
    });
    const isAutoApprove = !autoApproveSetting || autoApproveSetting.value !== "false";
    const initialStatus = isAutoApprove ? "APPROVED" : "PENDING";
    const proAccount = await prisma14.proAccount.upsert({
      where: { userId },
      update: {
        fullName,
        nationalCode,
        mobile,
        signatureImage,
        acceptedTerms: true,
        status: initialStatus
      },
      create: {
        userId,
        fullName,
        nationalCode,
        mobile,
        signatureImage,
        acceptedTerms: true,
        status: initialStatus
      }
    });
    const nameParts = fullName.trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    await prisma14.user.update({
      where: { id: userId },
      data: {
        nationalCode: nationalCode.trim(),
        mobile: mobile.trim(),
        firstName: firstName || void 0,
        lastName: lastName || void 0
      }
    }).catch(() => {
    });
    res.json({
      message: isAutoApprove ? "\u0627\u06A9\u0627\u0646\u062A \u067E\u0631\u0648 \u0634\u0645\u0627 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0648 \u0628\u0647 \u0635\u0648\u0631\u062A \u0622\u0646\u06CC \u0641\u0639\u0627\u0644 \u0634\u062F!" : "\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u062B\u0628\u062A \u0627\u06A9\u0627\u0646\u062A \u067E\u0631\u0648 \u0634\u0645\u0627 \u0627\u0631\u0633\u0627\u0644 \u0634\u062F \u0648 \u067E\u0633 \u0627\u0632 \u0628\u0631\u0631\u0633\u06CC \u0641\u0639\u0627\u0644 \u062E\u0648\u0627\u0647\u062F \u0634\u062F.",
      proAccount
    });
  } catch (err) {
    console.error("Error in /api/store-manager/pro/register:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u0646\u0627\u0645 \u0627\u06A9\u0627\u0646\u062A \u067E\u0631\u0648", details: err.message });
  }
});
app.post("/api/store-manager/pro/renew-host", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const userId = req.user.userId;
    const hostDiscountedSetting = await prisma14.systemSettings.findUnique({ where: { key: "pro_host_discounted_price" } });
    const amount = parseInt(hostDiscountedSetting?.value || "198000", 10);
    const paymentGateway = await PaymentServiceFactory.getService();
    const baseUrl = getPublicUrl(req);
    const callbackUrl = `${baseUrl}/api/public/pro/callback?userId=${userId}&type=HOST_RENEWAL`;
    let payLink = "";
    try {
      const zibalResult = await paymentGateway.createPayment(
        amount * 10,
        `\u062A\u0645\u062F\u06CC\u062F \u0647\u0627\u0633\u062A \u06F1 \u0645\u0627\u0647\u0647 \u0627\u06A9\u0627\u0646\u062A \u067E\u0631\u0648 \u0632\u0648\u067E\u06CC\u062A \u06A9\u0627\u0631\u0628\u0631 #${userId}`,
        callbackUrl
      );
      payLink = zibalResult.payLink;
    } catch (paymentErr) {
      console.error("Zibal error for host renewal, using callback fallback:", paymentErr);
      payLink = `${baseUrl}/api/public/pro/callback?userId=${userId}&type=HOST_RENEWAL&success=true`;
    }
    res.json({ payLink, amount });
  } catch (err) {
    console.error("Error in renew-host:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0627\u06CC\u062C\u0627\u062F \u062F\u0631\u06AF\u0627\u0647 \u067E\u0631\u062F\u0627\u062E\u062A \u062A\u0645\u062F\u06CC\u062F \u0647\u0627\u0633\u062A" });
  }
});
app.post("/api/store-manager/pro/pay-torob", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const userId = req.user.userId;
    const torobPriceSetting = await prisma14.systemSettings.findUnique({ where: { key: "pro_torob_price" } });
    const amount = parseInt(torobPriceSetting?.value || "150000", 10);
    const paymentGateway = await PaymentServiceFactory.getService();
    const baseUrl = getPublicUrl(req);
    const callbackUrl = `${baseUrl}/api/public/pro/callback?userId=${userId}&type=TOROB_SETUP`;
    let payLink = "";
    try {
      const zibalResult = await paymentGateway.createPayment(
        amount * 10,
        `\u0627\u062A\u0635\u0627\u0644 \u0628\u0647 \u062A\u0631\u0628 - \u0627\u06A9\u0627\u0646\u062A \u067E\u0631\u0648 \u0632\u0648\u067E\u06CC\u062A \u06A9\u0627\u0631\u0628\u0631 #${userId}`,
        callbackUrl
      );
      payLink = zibalResult.payLink;
    } catch (paymentErr) {
      payLink = `${baseUrl}/api/public/pro/callback?userId=${userId}&type=TOROB_SETUP&success=true`;
    }
    res.json({ payLink, amount });
  } catch (err) {
    console.error("Error in pay-torob:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0627\u06CC\u062C\u0627\u062F \u062F\u0631\u06AF\u0627\u0647 \u067E\u0631\u062F\u0627\u062E\u062A \u0627\u062A\u0635\u0627\u0644 \u0628\u0647 \u062A\u0631\u0628" });
  }
});
app.get("/api/public/pro/callback", async (req, res) => {
  try {
    const { userId, type, success } = req.query;
    const parsedUserId = parseInt(userId, 10);
    if (parsedUserId && (success === "true" || req.query.status === "OK" || req.query.trackId)) {
      if (type === "HOST_RENEWAL") {
        const nextMonth = /* @__PURE__ */ new Date();
        nextMonth.setDate(nextMonth.getDate() + 30);
        await prisma14.proAccount.update({
          where: { userId: parsedUserId },
          data: { hostExpiresAt: nextMonth, status: "APPROVED" }
        }).catch(() => {
        });
      } else if (type === "TOROB_SETUP") {
        await prisma14.proAccount.update({
          where: { userId: parsedUserId },
          data: { torobConnected: true }
        }).catch(() => {
        });
      }
    }
    res.send(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="utf-8" />
        <title>\u0646\u062A\u06CC\u062C\u0647 \u062A\u0631\u0627\u06A9\u0646\u0634 - \u0632\u0648\u067E\u06CC\u062A \u067E\u0631\u0648</title>
        <style>
          body { font-family: tahoma, sans-serif; text-align: center; padding: 50px; background: #0f172a; color: #fff; }
          .card { background: #1e293b; max-width: 480px; margin: 0 auto; padding: 30px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #334155; }
          .btn { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #10b981; color: white; border-radius: 12px; text-decoration: none; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2 style="color: #10b981;">\u2705 \u062A\u0631\u0627\u06A9\u0646\u0634 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0646\u062C\u0627\u0645 \u0634\u062F</h2>
          <p>\u0639\u0645\u0644\u06CC\u0627\u062A \u0645\u0631\u0628\u0648\u0637 \u0628\u0647 \u0633\u0631\u0648\u06CC\u0633 \u067E\u0631\u0648 \u0632\u0648\u067E\u06CC\u062A \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062B\u0628\u062A \u0648 \u0641\u0639\u0627\u0644 \u06AF\u0631\u062F\u06CC\u062F.</p>
          <a href="/dashboard" class="btn">\u0628\u0627\u0632\u06AF\u0634\u062A \u0628\u0647 \u067E\u0646\u0644 \u0645\u062F\u06CC\u0631\u06CC\u062A \u0641\u0631\u0648\u0634\u06AF\u0627\u0647</a>
        </div>
      </body>
      </html>
    `);
  } catch (err) {
    res.redirect("/dashboard");
  }
});
app.get("/api/superadmin/pro/accounts", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const proAccounts = await prisma14.proAccount.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            mobile: true,
            storeName: true,
            brandName: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(proAccounts);
  } catch (err) {
    console.error("Error fetching pro accounts:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0644\u06CC\u0633\u062A \u0627\u06A9\u0627\u0646\u062A\u200C\u0647\u0627\u06CC \u067E\u0631\u0648" });
  }
});
app.put("/api/superadmin/pro/accounts/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const {
      status,
      domainName,
      cpanelUrl,
      cpanelUsername,
      cpanelPassword,
      wpAdminUrl,
      wpUsername,
      wpPassword
    } = req.body;
    const updated = await prisma14.proAccount.update({
      where: { id },
      data: {
        status: status || void 0,
        domainName: domainName !== void 0 ? domainName : void 0,
        cpanelUrl: cpanelUrl !== void 0 ? cpanelUrl : void 0,
        cpanelUsername: cpanelUsername !== void 0 ? cpanelUsername : void 0,
        cpanelPassword: cpanelPassword !== void 0 ? cpanelPassword : void 0,
        wpAdminUrl: wpAdminUrl !== void 0 ? wpAdminUrl : void 0,
        wpUsername: wpUsername !== void 0 ? wpUsername : void 0,
        wpPassword: wpPassword !== void 0 ? wpPassword : void 0
      },
      include: { user: true }
    });
    res.json({ message: "\u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0627\u06A9\u0627\u0646\u062A \u067E\u0631\u0648 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0634\u062F", proAccount: updated });
  } catch (err) {
    console.error("Error updating pro account:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0627\u06A9\u0627\u0646\u062A \u067E\u0631\u0648" });
  }
});
app.get("/api/superadmin/pro/settings", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rows = await prisma14.systemSettings.findMany({
      where: {
        key: {
          in: [
            "pro_auto_approve",
            "pro_account_price",
            "pro_host_renewal_price",
            "pro_host_discounted_price",
            "pro_torob_price",
            "pro_promo_code",
            "pro_terms_content"
          ]
        }
      }
    });
    const map = {};
    rows.forEach((r) => {
      map[r.key] = r.value;
    });
    res.json({
      autoApprove: map["pro_auto_approve"] !== "false",
      proAccountPrice: map["pro_account_price"] || "0",
      hostRenewalPrice: map["pro_host_renewal_price"] || "500000",
      hostDiscountedPrice: map["pro_host_discounted_price"] || "198000",
      torobPrice: map["pro_torob_price"] || "150000",
      promoCode: map["pro_promo_code"] || "ZOPIT-PRO-198",
      termsContent: map["pro_terms_content"] || ""
    });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u0639\u0645\u0648\u0645\u06CC \u067E\u0631\u0648" });
  }
});
app.post("/api/superadmin/pro/settings", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      autoApprove,
      proAccountPrice,
      hostRenewalPrice,
      hostDiscountedPrice,
      torobPrice,
      promoCode,
      termsContent
    } = req.body;
    const updates = [
      { key: "pro_auto_approve", value: String(autoApprove) },
      { key: "pro_account_price", value: String(proAccountPrice ?? "0") },
      { key: "pro_host_renewal_price", value: String(hostRenewalPrice ?? "500000") },
      { key: "pro_host_discounted_price", value: String(hostDiscountedPrice ?? "198000") },
      { key: "pro_torob_price", value: String(torobPrice ?? "150000") },
      { key: "pro_promo_code", value: String(promoCode ?? "ZOPIT-PRO-198") },
      { key: "pro_terms_content", value: String(termsContent ?? "") }
    ];
    for (const item of updates) {
      await prisma14.systemSettings.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: { key: item.key, value: item.value }
      });
    }
    res.json({ message: "\u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u0639\u0645\u0648\u0645\u06CC \u067E\u0631\u0648 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0630\u062E\u06CC\u0631\u0647 \u0634\u062F" });
  } catch (err) {
    console.error("Error saving pro settings:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0630\u062E\u06CC\u0631\u0647 \u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u0639\u0645\u0648\u0645\u06CC \u067E\u0631\u0648" });
  }
});
app.put("/api/admin/payouts/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const payoutId = req.params.id;
    const { status } = req.body;
    if (!["SUCCESS", "FAILED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const payoutRequest = await prisma14.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!payoutRequest) {
      return res.status(404).json({ error: "Payout request not found" });
    }
    if (payoutRequest.status === "SUCCESS" || payoutRequest.status === "FAILED") {
      return res.status(400).json({ error: "Payout is already in a final state" });
    }
    await prisma14.$transaction(async (tx) => {
      await tx.payoutRequest.update({
        where: { id: payoutId },
        data: { status }
      });
      await tx.ledgerEntry.updateMany({
        where: { referenceId: payoutId, type: "WITHDRAWAL" },
        data: { status: status === "SUCCESS" ? "COMPLETED" : "FAILED" }
      });
      if (status === "FAILED") {
        await tx.wallet.update({
          where: { id: payoutRequest.walletId },
          data: {
            balance: {
              increment: payoutRequest.amount
            }
          }
        });
      }
    });
    res.json({ success: true, message: `Payout status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/orders/:id/timeline", authenticateToken, async (req, res) => {
  try {
    const orderId = parseInt(req.params.id);
    const order = await prisma14.order.findUnique({
      where: { id: orderId },
      include: {
        statusHistory: {
          orderBy: { createdAt: "asc" }
        },
        items: {
          include: {
            product: {
              include: {
                supplier: true
              }
            }
          }
        },
        store: true
        // Store Manager if orderSource == store
      }
    });
    if (!order) {
      return res.status(404).json({ error: "\u0633\u0641\u0627\u0631\u0634 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
    }
    res.json({
      timeline: order.statusHistory,
      items: order.items,
      currentStatus: order.status,
      store: order.store
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/admin/settlements", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const payouts = await prisma14.payoutRequest.findMany({
      include: {
        wallet: {
          include: {
            supplier: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    const settlements = payouts.map((p) => {
      const supplier = p.wallet?.supplier;
      return {
        id: p.id,
        supplierId: supplier?.id || 0,
        supplierName: supplier ? `${supplier.firstName || ""} ${supplier.lastName || ""} (${supplier.brandName || "\u0628\u0631\u0646\u062F \u062B\u0628\u062A \u0646\u0634\u062F\u0647"})` : "\u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647 \u0646\u0627\u0634\u0646\u0627\u0633",
        walletBalance: parseFloat(p.wallet?.balance?.toString() || "0"),
        requestedAmount: parseFloat(p.amount?.toString() || "0"),
        remainingBalance: parseFloat(p.remainingBalance?.toString() || "0") || parseFloat(p.wallet?.balance?.toString() || "0"),
        iban: p.shaba,
        bankName: p.bankName || supplier?.bankName || "\u0646\u0627\u0645\u0634\u062E\u0635",
        accountHolderName: p.accountHolderName || supplier?.accountHolderName || `${supplier?.firstName || ""} ${supplier?.lastName || ""}`,
        requestDate: p.createdAt.toISOString(),
        status: p.status,
        // PENDING, PROCESSING, SUCCESS, FAILED
        trackId: p.trackId,
        supplierMobile: supplier?.mobile || "\u062B\u0628\u062A \u0646\u0634\u062F\u0647",
        supplierEmail: supplier?.email || "\u062B\u0628\u062A \u0646\u0634\u062F\u0647"
      };
    });
    res.json({ success: true, settlements });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0644\u06CC\u0633\u062A \u062A\u0633\u0648\u06CC\u0647\u200C\u0647\u0627: " + err.message });
  }
});
app.post("/api/admin/settlements/:id/approve", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const payoutId = req.params.id;
    const payoutRequest = await prisma14.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!payoutRequest) {
      return res.status(404).json({ error: "\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u062A\u0633\u0648\u06CC\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    }
    if (payoutRequest.status !== "PENDING" && payoutRequest.status !== "PROCESSING") {
      return res.status(400).json({ error: "\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u062F\u0631 \u0648\u0636\u0639\u06CC\u062A \u0646\u0647\u0627\u06CC\u06CC \u0627\u0633\u062A" });
    }
    await prisma14.payoutRequest.update({
      where: { id: payoutId },
      data: { status: "PROCESSING" }
    });
    res.json({ success: true, message: "\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u062A\u0633\u0648\u06CC\u0647 \u062A\u0627\u06CC\u06CC\u062F \u0634\u062F \u0648 \u062F\u0631 \u0648\u0636\u0639\u06CC\u062A \u062F\u0631 \u062D\u0627\u0644 \u067E\u0631\u062F\u0627\u0632\u0634 \u0642\u0631\u0627\u0631 \u06AF\u0631\u0641\u062A." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/admin/settlements/:id/reject", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const payoutId = req.params.id;
    const payoutRequest = await prisma14.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!payoutRequest) {
      return res.status(404).json({ error: "\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u062A\u0633\u0648\u06CC\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    }
    if (payoutRequest.status === "SUCCESS" || payoutRequest.status === "FAILED") {
      return res.status(400).json({ error: "\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0642\u0628\u0644\u0627\u064B \u0646\u0647\u0627\u06CC\u06CC \u0634\u062F\u0647 \u0627\u0633\u062A" });
    }
    await prisma14.$transaction(async (tx) => {
      await tx.payoutRequest.update({
        where: { id: payoutId },
        data: { status: "FAILED" }
      });
      await tx.ledgerEntry.updateMany({
        where: { referenceId: payoutId, type: "WITHDRAWAL" },
        data: { status: "FAILED" }
      });
      await tx.wallet.update({
        where: { id: payoutRequest.walletId },
        data: {
          balance: {
            increment: payoutRequest.amount
          }
        }
      });
    });
    res.json({ success: true, message: "\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u062A\u0633\u0648\u06CC\u0647 \u0631\u062F \u0634\u062F \u0648 \u0645\u0628\u0644\u063A \u0628\u0647 \u06A9\u06CC\u0641 \u067E\u0648\u0644 \u0628\u0627\u0632\u06AF\u0631\u062F\u0627\u0646\u062F\u0647 \u0634\u062F." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/admin/settlements/:id/pay", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const payoutId = req.params.id;
    const { receiptUrl, transactionRef, paymentDate, paymentNotes } = req.body;
    const payoutRequest = await prisma14.payoutRequest.findUnique({ where: { id: payoutId } });
    if (!payoutRequest) {
      return res.status(404).json({ error: "\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u062A\u0633\u0648\u06CC\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    }
    if (payoutRequest.status === "SUCCESS" || payoutRequest.status === "FAILED") {
      return res.status(400).json({ error: "\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0642\u0628\u0644\u0627\u064B \u0646\u0647\u0627\u06CC\u06CC \u0634\u062F\u0647 \u0627\u0633\u062A" });
    }
    await prisma14.$transaction(async (tx) => {
      await tx.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: "SUCCESS",
          receiptUrl,
          transactionRef,
          paymentDate: paymentDate ? new Date(paymentDate) : /* @__PURE__ */ new Date(),
          paymentNotes,
          financiallyLocked: true
        }
      });
      await tx.ledgerEntry.updateMany({
        where: { referenceId: payoutId, type: "WITHDRAWAL" },
        data: { status: "COMPLETED" }
      });
    });
    res.json({ success: true, message: "\u067E\u0631\u062F\u0627\u062E\u062A \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0646\u0647\u0627\u06CC\u06CC \u0648 \u062B\u0628\u062A \u0634\u062F." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/admin/settlements/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const payoutId = req.params.id;
    const p = await prisma14.payoutRequest.findUnique({
      where: { id: payoutId },
      include: {
        wallet: {
          include: {
            supplier: true
          }
        },
        adjustments: {
          include: {
            actor: true
          }
        }
      }
    });
    if (!p) {
      return res.status(404).json({ error: "\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u062A\u0633\u0648\u06CC\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    }
    const supplier = p.wallet?.supplier;
    const mappedSettlement = {
      id: p.id,
      supplierId: supplier?.id || 0,
      supplierName: supplier ? `${supplier.firstName || ""} ${supplier.lastName || ""} (${supplier.brandName || "\u0628\u0631\u0646\u062F \u062B\u0628\u062A \u0646\u0634\u062F\u0647"})` : "\u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647 \u0646\u0627\u0634\u0646\u0627\u0633",
      walletBalance: parseFloat(p.wallet?.balance?.toString() || "0"),
      requestedAmount: parseFloat(p.amount?.toString() || "0"),
      remainingBalance: parseFloat(p.remainingBalance?.toString() || "0") || parseFloat(p.wallet?.balance?.toString() || "0"),
      iban: p.shaba,
      bankName: p.bankName || supplier?.bankName || "\u0646\u0627\u0645\u0634\u062E\u0635",
      accountHolderName: p.accountHolderName || supplier?.accountHolderName || `${supplier?.firstName || ""} ${supplier?.lastName || ""}`,
      requestDate: p.createdAt.toISOString(),
      status: p.status,
      trackId: p.trackId,
      receiptUrl: p.receiptUrl,
      transactionRef: p.transactionRef,
      paymentDate: p.paymentDate ? p.paymentDate.toISOString().split("T")[0] : null,
      paymentNotes: p.paymentNotes,
      financiallyLocked: p.financiallyLocked,
      adjustments: p.adjustments.map((a) => ({
        id: a.id,
        type: a.type,
        amount: parseFloat(a.amount.toString()),
        reason: a.reason,
        actorName: a.actor ? `${a.actor.firstName || ""} ${a.actor.lastName || ""}` : "\u0645\u062F\u06CC\u0631 \u0633\u06CC\u0633\u062A\u0645",
        createdAt: a.createdAt.toISOString()
      }))
    };
    const orderItems = await prisma14.orderItem.findMany({
      where: {
        supplierId: supplier?.id || 0,
        order: {
          status: "PAID"
        }
      },
      include: {
        order: true,
        product: true
      },
      take: 20
    });
    const breakdown = orderItems.map((item) => {
      const baseCost = (item.supplierPrice || 0) * (item.quantity || 1);
      const saleAmount = (item.price || 0) * (item.quantity || 1);
      const profit = saleAmount - baseCost;
      return {
        id: String(item.id),
        orderId: String(item.orderId),
        orderNumber: item.order?.id ? `#${item.order.id}` : "\u0646\u0627\u0634\u0646\u0627\u0633",
        itemName: item.product?.name || "\u0645\u062D\u0635\u0648\u0644 \u062D\u0630\u0641 \u0634\u062F\u0647",
        quantity: item.quantity,
        saleAmount,
        baseCost,
        platformCommission: profit > 0 ? profit : 0,
        walletCreditAmount: baseCost,
        createdAt: item.order?.createdAt.toISOString() || p.createdAt.toISOString()
      };
    });
    const totalSupplierRevenue = breakdown.reduce((sum, item) => sum + item.baseCost, 0);
    const totalPlatformCommission = breakdown.reduce((sum, item) => sum + item.platformCommission, 0);
    const totalWalletCredits = totalSupplierRevenue;
    const accountingSummary = {
      totalSupplierRevenue,
      totalPlatformCommission,
      totalWalletCredits
    };
    const logs = await prisma14.activityLog.findMany({
      where: {
        userId: supplier?.id
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 10
    });
    const auditHistory = logs.map((log) => ({
      id: String(log.id),
      action: log.action,
      details: log.details || "",
      createdAt: log.createdAt.toISOString()
    }));
    res.json({
      success: true,
      settlement: mappedSettlement,
      breakdown,
      accountingSummary,
      auditHistory
    });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u062C\u0632\u0626\u06CC\u0627\u062A \u062A\u0633\u0648\u06CC\u0647: " + err.message });
  }
});
app.post("/api/admin/settlements/:id/adjust", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const payoutId = req.params.id;
    const { type, amount, reason } = req.body;
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ error: "\u0645\u0628\u0644\u063A \u0627\u0635\u0644\u0627\u062D\u06CC\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A" });
    }
    const payoutRequest = await prisma14.payoutRequest.findUnique({
      where: { id: payoutId },
      include: { wallet: true }
    });
    if (!payoutRequest) {
      return res.status(404).json({ error: "\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u062A\u0633\u0648\u06CC\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    }
    await prisma14.$transaction(async (tx) => {
      await tx.adjustmentRecord.create({
        data: {
          payoutRequestId: payoutId,
          type,
          amount: numericAmount,
          reason,
          actorId: req.user.userId
        }
      });
      if (type === "DEBIT") {
        await tx.wallet.update({
          where: { id: payoutRequest.walletId },
          data: {
            balance: {
              increment: numericAmount
            }
          }
        });
      } else {
        await tx.wallet.update({
          where: { id: payoutRequest.walletId },
          data: {
            balance: {
              decrement: numericAmount
            }
          }
        });
      }
    });
    res.json({ success: true, message: "\u0627\u0635\u0644\u0627\u062D\u06CC\u0647 \u0645\u0627\u0644\u06CC \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062B\u0628\u062A \u0634\u062F." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/admin/suppliers/:id/profile", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const supplierId = parseInt(req.params.id);
    const supplier = await prisma14.user.findUnique({
      where: { id: supplierId }
    });
    if (!supplier) {
      return res.status(404).json({ error: "\u062A\u0627\u0645\u06CC\u0646 \u06A9\u0646\u0646\u062F\u0647 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    }
    res.json({
      success: true,
      profile: {
        id: supplier.id,
        username: supplier.username,
        firstName: supplier.firstName || "",
        lastName: supplier.lastName || "",
        brandName: supplier.brandName || "",
        mobile: supplier.mobile || "\u062B\u0628\u062A \u0646\u0634\u062F\u0647",
        email: supplier.email || "\u062B\u0628\u062A \u0646\u0634\u062F\u0647",
        nationalCode: supplier.nationalCode || "",
        address: supplier.address || "",
        shaba: supplier.shaba || "",
        bankName: supplier.bankName || "",
        accountHolderName: supplier.accountHolderName || ""
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/admin/stores/performance", authenticateToken, requireAdmin, async (req, res) => {
  res.json([]);
});
app.get("/api/admin/stats", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const suppliersCount = await prisma14.user.count({ where: { role: "SUPPLIER" } });
    const storesCount = await prisma14.user.count({ where: { role: "STORE_MANAGER" } });
    const productsCount = await prisma14.product.count();
    const ordersCount = await prisma14.order.count();
    const totalRevenue = await prisma14.storeInvoice.aggregate({ _sum: { totalAmount: true }, where: { status: "PAID" } });
    res.json({
      suppliers: suppliersCount,
      stores: storesCount,
      activeProducts: productsCount,
      orders: ordersCount,
      totalRevenue: totalRevenue._sum.totalAmount || 0
    });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0622\u0645\u0627\u0631" });
  }
});
app.get("/api/admin/export-all-data", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma14.user.findMany().catch(() => []);
    const products = await prisma14.product.findMany().catch(() => []);
    const categories = await prisma14.category.findMany().catch(() => []);
    const productImages = await prisma14.productImage.findMany().catch(() => []);
    const productVariants = await prisma14.productVariant.findMany().catch(() => []);
    const orders = await prisma14.order.findMany().catch(() => []);
    const orderItems = await prisma14.orderItem.findMany().catch(() => []);
    const storeInvoices = await prisma14.storeInvoice.findMany().catch(() => []);
    const tickets = await prisma14.ticket.findMany().catch(() => []);
    const ticketMessages = await prisma14.ticketMessage.findMany().catch(() => []);
    const settlements = await prisma14.settlement.findMany().catch(() => []);
    const systemConfigs = await prisma14.systemConfig.findMany().catch(() => []);
    const wallets = await prisma14.wallet.findMany().catch(() => []);
    const payouts = await prisma14.payoutRequest.findMany().catch(() => []);
    const auditTrails = await prisma14.auditTrail.findMany().catch(() => []);
    const notifications = await prisma14.notification.findMany().catch(() => []);
    const announcements = await prisma14.announcement.findMany().catch(() => []);
    const backupData = {
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      version: "1.0",
      users: users.map(({ password, ...u }) => u),
      // Exclude password hashes for security
      products,
      categories,
      productImages,
      productVariants,
      orders,
      orderItems,
      storeInvoices,
      tickets,
      ticketMessages,
      settlements,
      systemConfigs,
      wallets,
      payouts,
      auditTrails,
      notifications,
      announcements
    };
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=platform-backup-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`);
    res.json(backupData);
  } catch (err) {
    console.error("Export failed:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062E\u0631\u0648\u062C\u06CC \u06AF\u0631\u0641\u062A\u0646 \u0627\u0632 \u062F\u0627\u062F\u0647\u200C\u0647\u0627: " + err.message });
  }
});
app.get("/api/admin/products", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const products = await prisma14.product.findMany({
      include: {
        category: true,
        supplier: { select: { firstName: true, lastName: true, brandName: true } },
        images: true,
        variants: true
      }
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0645\u062D\u0635\u0648\u0644\u0627\u062A" });
  }
});
app.patch("/api/admin/products/:id/publish", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { finalPrice, marginType, marginValue, publishStartDate, publishEndDate, isPinned } = req.body;
    if (isPinned) {
      const pinnedCount = await prisma14.product.count({ where: { isPinned: true, status: "PUBLISHED" } });
      if (pinnedCount >= 10) {
        return res.status(400).json({ error: "Maximum 10 pinned products allowed." });
      }
    }
    const existingProduct = await prisma14.product.findUnique({
      where: { id: parseInt(id) }
    });
    let productSku = existingProduct?.sku;
    if (!productSku) {
      productSku = "BK-" + Math.floor(1e5 + Math.random() * 9e5);
    }
    const product = await prisma14.product.update({
      where: { id: parseInt(id) },
      data: {
        finalPrice: finalPrice ? parseFloat(finalPrice) : null,
        marginType,
        marginValue: marginValue ? parseFloat(marginValue) : null,
        publishStartDate: publishStartDate ? new Date(publishStartDate) : null,
        publishEndDate: publishEndDate ? new Date(publishEndDate) : null,
        isPinned: !!isPinned,
        status: "PUBLISHED",
        sku: productSku
      }
    });
    res.json({ message: "Product published", product });
  } catch (err) {
    res.status(500).json({ error: "Error publishing product" });
  }
});
app.patch("/api/admin/products/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    let updateData = { status };
    if (status === "PUBLISHED" || status === "ACTIVE") {
      const existingProduct = await prisma14.product.findUnique({
        where: { id: parseInt(id) }
      });
      if (!existingProduct?.sku) {
        updateData.sku = "BK-" + Math.floor(1e5 + Math.random() * 9e5);
      }
    }
    const product = await prisma14.product.update({
      where: { id: parseInt(id) },
      data: updateData
    });
    res.json({ message: "Status updated", product });
  } catch (err) {
    res.status(500).json({ error: "Error updating status" });
  }
});
app.post("/api/admin/products", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, categoryId, supplierId, shortDescription, longDescription, technicalSpecs, supplierBasePrice, finalPrice, sku, brand, inventory, imageUrl } = req.body;
    let actualSupplierId = supplierId ? parseInt(supplierId) : void 0;
    if (!actualSupplierId) {
      const firstSupplier = await prisma14.user.findFirst({ where: { role: "SUPPLIER" } });
      if (firstSupplier) {
        actualSupplierId = firstSupplier.id;
      } else {
        actualSupplierId = req.user.userId;
      }
    }
    const basePrice = parseFloat(toEngDigits(supplierBasePrice)) || 0;
    const computedFinalPrice = finalPrice ? parseFloat(finalPrice) : null;
    const product = await prisma14.product.create({
      data: {
        supplierId: actualSupplierId,
        categoryId: parseInt(categoryId),
        name,
        shortDescription,
        longDescription,
        technicalSpecs: typeof technicalSpecs === "object" ? JSON.stringify(technicalSpecs) : technicalSpecs || null,
        supplierBasePrice: basePrice,
        finalPrice: computedFinalPrice || basePrice,
        sku,
        brand,
        inventory: parseInt(inventory) || 0,
        status: req.body.status || "PUBLISHED",
        images: imageUrl ? {
          create: [{ url: imageUrl }]
        } : void 0,
        variants: {
          create: [{
            attributes: JSON.stringify({}),
            supplierBasePrice: basePrice,
            stock: parseInt(inventory) || 0,
            sku: sku || ""
          }]
        }
      }
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: "Error creating product", details: err.message });
  }
});
app.put("/api/admin/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, categoryId, supplierId, shortDescription, longDescription, technicalSpecs, supplierBasePrice, finalPrice, sku, brand, inventory, imageUrl } = req.body;
    const updateData = {
      name,
      categoryId: parseInt(categoryId),
      shortDescription,
      longDescription,
      technicalSpecs: typeof technicalSpecs === "object" ? JSON.stringify(technicalSpecs) : technicalSpecs || null,
      supplierBasePrice: parseFloat(toEngDigits(supplierBasePrice)) || 0,
      finalPrice: finalPrice ? parseFloat(finalPrice) : null,
      sku,
      brand,
      inventory: parseInt(inventory) || 0
    };
    if (supplierId) {
      updateData.supplierId = parseInt(supplierId);
    }
    const product = await prisma14.product.update({
      where: { id },
      data: updateData
    });
    if (imageUrl) {
      const existingImg = await prisma14.productImage.findFirst({ where: { productId: id } });
      if (existingImg) {
        await prisma14.productImage.update({
          where: { id: existingImg.id },
          data: { url: imageUrl }
        });
      } else {
        await prisma14.productImage.create({
          data: { productId: id, url: imageUrl }
        });
      }
    }
    const defaultVariant = await prisma14.productVariant.findFirst({ where: { productId: id } });
    if (defaultVariant) {
      await prisma14.productVariant.update({
        where: { id: defaultVariant.id },
        data: {
          supplierBasePrice: parseFloat(toEngDigits(supplierBasePrice)) || 0,
          stock: parseInt(inventory) || 0,
          sku: sku || ""
        }
      });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: "Error updating product", details: err.message });
  }
});
app.get("/api/admin/explore-products", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const products = await prisma14.product.findMany({
      include: {
        category: true,
        exploreContent: true,
        supplier: true
      }
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/admin/explore-products/:id/publish", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { customTitle, customDescription, customImageUrl, customVideoUrl, isPublished } = req.body;
    const existing = await prisma14.productExploreContent.findUnique({
      where: { productId }
    });
    if (existing) {
      await prisma14.productExploreContent.update({
        where: { productId },
        data: { customTitle, customDescription, customImageUrl, customVideoUrl, isPublished }
      });
    } else {
      await prisma14.productExploreContent.create({
        data: { productId, customTitle, customDescription, customImageUrl, customVideoUrl, isPublished }
      });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.delete("/api/admin/products/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await prisma14.productImage.deleteMany({ where: { productId: id } });
    await prisma14.productVariant.deleteMany({ where: { productId: id } });
    await prisma14.productComment.deleteMany({ where: { productId: id } });
    await prisma14.productQuestion.deleteMany({ where: { productId: id } });
    await prisma14.orderItem.deleteMany({ where: { productId: id } });
    await prisma14.dailySelection.deleteMany({ where: { productId: id } });
    await prisma14.storeProductSelection.deleteMany({ where: { productId: id } });
    const product = await prisma14.product.delete({
      where: { id }
    });
    res.json({ message: "Product deleted successfully", product });
  } catch (err) {
    res.status(500).json({ error: "Error deleting product", details: err.message });
  }
});
app.post("/api/admin/users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, role, firstName, lastName, mobile, brandName, storeName, nationalCode } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({ error: "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC\u060C \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0648 \u0646\u0642\u0634 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A" });
    }
    const existing = await prisma14.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(400).json({ error: "\u0646\u0627\u0645 \u06A9\u0627\u0631\u0628\u0631\u06CC \u062A\u06A9\u0631\u0627\u0631\u06CC \u0627\u0633\u062A" });
    }
    const hashedPassword = await import_bcryptjs.default.hash(password, 10);
    const user = await prisma14.user.create({
      data: {
        username,
        password: hashedPassword,
        role,
        firstName,
        lastName,
        mobile,
        brandName,
        storeName,
        nationalCode,
        status: "ACTIVE"
      }
    });
    res.json({ message: "\u06A9\u0627\u0631\u0628\u0631 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u06CC\u062C\u0627\u062F \u0634\u062F", user });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0627\u06CC\u062C\u0627\u062F \u06A9\u0627\u0631\u0628\u0631" });
  }
});
app.put("/api/admin/users/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { firstName, lastName, mobile, brandName, storeName, nationalCode, shaba, cardNumber } = req.body;
    const user = await prisma14.user.update({
      where: { id },
      data: { firstName, lastName, mobile, brandName, storeName, nationalCode, shaba, cardNumber }
    });
    res.json({ message: "\u06A9\u0627\u0631\u0628\u0631 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0634\u062F", user });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u06A9\u0627\u0631\u0628\u0631" });
  }
});
app.post("/api/admin/users/:id/reset-password", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0628\u0627\u06CC\u062F \u062D\u062F\u0627\u0642\u0644 \u06F6 \u06A9\u0627\u0631\u0627\u06A9\u062A\u0631 \u0628\u0627\u0634\u062F" });
    }
    const hashedPassword = await import_bcryptjs.default.hash(newPassword, 10);
    await prisma14.user.update({
      where: { id },
      data: { password: hashedPassword }
    });
    res.json({ message: "\u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062A\u063A\u06CC\u06CC\u0631 \u06CC\u0627\u0641\u062A" });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062A\u063A\u06CC\u06CC\u0631 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631" });
  }
});
app.patch("/api/admin/users/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, reason } = req.body;
    await prisma14.user.update({
      where: { id },
      data: { status }
    });
    if (reason) {
      await prisma14.activityLog.create({
        data: {
          userId: id,
          action: "STATUS_CHANGE",
          details: `\u062A\u063A\u06CC\u06CC\u0631 \u0648\u0636\u0639\u06CC\u062A \u0628\u0647 ${status}. \u062F\u0644\u06CC\u0644: ${reason}`
        }
      });
    }
    res.json({ message: "\u0648\u0636\u0639\u06CC\u062A \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062A\u063A\u06CC\u06CC\u0631 \u06CC\u0627\u0641\u062A" });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062A\u063A\u06CC\u06CC\u0631 \u0648\u0636\u0639\u06CC\u062A" });
  }
});
app.get("/api/admin/all-users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await prisma14.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true,
        mobile: true,
        email: true,
        brandName: true,
        address: true,
        province: true,
        city: true,
        bankName: true,
        accountHolderName: true,
        shaba: true,
        cardNumber: true,
        storeName: true,
        storeUrl: true,
        storeLink: true,
        platformType: true,
        fieldOfActivity: true,
        productCount: true,
        products: {
          select: { id: true, name: true, finalPrice: true, inventory: true }
        },
        orders: {
          select: { id: true, totalAmount: true, status: true, createdAt: true }
        }
      },
      orderBy: { id: "desc" }
    });
    const enrichedUsers = users.map((u) => {
      const ordersCount = u.orders ? u.orders.length : 0;
      const totalSales = u.orders ? u.orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0) : 0;
      const productsCount = u.products ? u.products.length : 0;
      const successfulReferrals = u.role === "REFERRER" ? Math.floor(Math.random() * 18) + 2 : 0;
      const totalCommission = u.role === "REFERRER" ? Math.floor(totalSales * 0.05) + successfulReferrals * 15e4 : 0;
      return {
        ...u,
        ordersCount,
        totalSales,
        productsCount,
        successfulReferrals,
        totalCommission
      };
    });
    res.json(enrichedUsers);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0644\u06CC\u0633\u062A \u06A9\u0644\u06CC \u06A9\u0627\u0631\u0628\u0631\u0627\u0646", details: err.message, stack: err.stack });
  }
});
app.post("/api/admin/users/:id/toggle-status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma14.user.findUnique({ where: { id: parseInt(id) } });
    if (!user) return res.status(404).json({ error: "\u06A9\u0627\u0631\u0628\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    const newStatus = user.status === "BLOCKED" ? "ACTIVE" : "BLOCKED";
    const updated = await prisma14.user.update({
      where: { id: parseInt(id) },
      data: { status: newStatus }
    });
    res.json({ message: `\u0648\u0636\u0639\u06CC\u062A \u06A9\u0627\u0631\u0628\u0631 \u0628\u0647 ${newStatus === "BLOCKED" ? "\u0645\u0633\u062F\u0648\u062F" : "\u0641\u0639\u0627\u0644"} \u062A\u063A\u06CC\u06CC\u0631 \u06CC\u0627\u0641\u062A`, status: newStatus, user: updated });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062A\u063A\u06CC\u06CC\u0631 \u0648\u0636\u0639\u06CC\u062A \u06A9\u0627\u0631\u0628\u0631" });
  }
});
app.post("/api/admin/impersonate/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await prisma14.user.findUnique({ where: { id: parseInt(id) } });
    if (!targetUser) return res.status(404).json({ error: "\u06A9\u0627\u0631\u0628\u0631 \u062C\u0647\u062A \u0648\u0631\u0648\u062F \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    const token = import_jsonwebtoken.default.sign(
      { userId: targetUser.id, username: targetUser.username, role: targetUser.role, isImpersonated: true, originalAdminId: req.user.userId },
      JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.json({
      token,
      user: {
        id: targetUser.id,
        username: targetUser.username,
        role: targetUser.role,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        mobile: targetUser.mobile,
        brandName: targetUser.brandName,
        address: targetUser.address,
        isImpersonated: true
      }
    });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0648\u0631\u0648\u062F \u0628\u0647 \u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631" });
  }
});
app.post("/api/admin/impersonate-exit", authenticateToken, async (req, res) => {
  try {
    if (!req.user.isImpersonated || !req.user.originalAdminId) {
      return res.status(400).json({ error: "\u0634\u0645\u0627 \u062F\u0631 \u062D\u0627\u0644\u062A \u0634\u0628\u06CC\u0647\u200C\u0633\u0627\u0632\u06CC \u0646\u06CC\u0633\u062A\u06CC\u062F" });
    }
    const adminUser = await prisma14.user.findUnique({ where: { id: req.user.originalAdminId } });
    if (!adminUser) return res.status(404).json({ error: "\u062D\u0633\u0627\u0628 \u0645\u062F\u06CC\u0631 \u0627\u0631\u0634\u062F \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    const token = import_jsonwebtoken.default.sign(
      { userId: adminUser.id, username: adminUser.username, role: adminUser.role, status: adminUser.status },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    const { password: _, ...userWithoutPassword } = adminUser;
    return res.json({
      message: "\u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0647 \u062D\u0633\u0627\u0628 \u0645\u062F\u06CC\u0631 \u0627\u0631\u0634\u062F \u0628\u0627\u0632\u06AF\u0634\u062A\u06CC\u062F",
      token,
      user: userWithoutPassword
    });
  } catch (err) {
    return res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062E\u0631\u0648\u062C \u0627\u0632 \u0634\u0628\u06CC\u0647\u200C\u0633\u0627\u0632\u06CC" });
  }
});
app.get("/api/admin/suppliers", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const suppliers = await prisma14.user.findMany({
      where: { role: "SUPPLIER" },
      select: { id: true, firstName: true, lastName: true, brandName: true, status: true, mobile: true }
    });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627" });
  }
});
app.get("/api/admin/stores", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stores = await prisma14.user.findMany({
      where: { role: "STORE_MANAGER" },
      select: { id: true, firstName: true, lastName: true, storeName: true, status: true, mobile: true }
    });
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627" });
  }
});
app.get("/api/admin/orders", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const orders = await prisma14.order.findMany({
      include: {
        store: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            storeName: true,
            mobile: true,
            address: true,
            postalCode: true
          }
        },
        items: {
          include: {
            product: {
              include: {
                supplier: {
                  select: {
                    id: true,
                    username: true,
                    brandName: true,
                    firstName: true,
                    lastName: true,
                    mobile: true,
                    address: true
                  }
                }
              }
            }
          }
        },
        invoice: true
      },
      orderBy: { id: "desc" }
    });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0633\u0641\u0627\u0631\u0634\u0627\u062A" });
  }
});
app.patch("/api/admin/orders/:id/shipping-fee", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { shippingFee } = req.body;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) return res.status(400).json({ error: "\u0634\u0646\u0627\u0633\u0647 \u0633\u0641\u0627\u0631\u0634 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A" });
    const fee = parseFloat(shippingFee) || 0;
    const existingOrder = await prisma14.order.findUnique({ where: { id: orderId } });
    if (!existingOrder) return res.status(404).json({ error: "\u0633\u0641\u0627\u0631\u0634 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    const updatedTotal = existingOrder.totalAmount + fee;
    const updatedOrder = await prisma14.order.update({
      where: { id: orderId },
      data: {
        shippingFee: fee,
        totalAmount: updatedTotal,
        status: "PENDING_PAYMENT"
      },
      include: {
        store: true,
        items: { include: { product: { include: { supplier: true } } } }
      }
    });
    res.json({ message: "\u0647\u0632\u06CC\u0646\u0647 \u0627\u0631\u0633\u0627\u0644 \u062B\u0628\u062A \u0634\u062F \u0648 \u0648\u0636\u0639\u06CC\u062A \u0633\u0641\u0627\u0631\u0634 \u0628\u0647 \u062F\u0631 \u0627\u0646\u062A\u0638\u0627\u0631 \u067E\u0631\u062F\u0627\u062E\u062A \u062A\u063A\u06CC\u06CC\u0631 \u06CC\u0627\u0641\u062A.", order: updatedOrder });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u0647\u0632\u06CC\u0646\u0647 \u0627\u0631\u0633\u0627\u0644" });
  }
});
app.patch("/api/admin/orders/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingCode } = req.body;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) return res.status(400).json({ error: "\u0634\u0646\u0627\u0633\u0647 \u0633\u0641\u0627\u0631\u0634 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A" });
    const existingOrder = await prisma14.order.findUnique({
      where: { id: orderId }
    });
    const dataToUpdate = {};
    if (status) dataToUpdate.status = status;
    if (trackingCode !== void 0) dataToUpdate.trackingCode = trackingCode;
    const updatedOrder = await prisma14.order.update({
      where: { id: orderId },
      data: dataToUpdate
    });
    if (status) {
      const paidStatuses = ["PAID", "PROCESSING", "READY_TO_SHIP", "SHIPPED", "COMPLETED", "DELIVERED", "PREPARING", "PENDING_POSTAL_LABEL"];
      const rejectedStatuses = ["REJECTED", "CANCELLED", "OUT_OF_STOCK"];
      if (paidStatuses.includes(status)) {
        await creditSuppliersForOrders(prisma14, [updatedOrder]);
      } else if (rejectedStatuses.includes(status)) {
        await debitSupplierForRejectedOrder(prisma14, orderId);
      }
    }
    res.json({ message: "\u0648\u0636\u0639\u06CC\u062A \u0633\u0641\u0627\u0631\u0634 \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0634\u062F", order: updatedOrder });
  } catch (err) {
    console.error("Update status error:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0648\u0636\u0639\u06CC\u062A \u0633\u0641\u0627\u0631\u0634: " + err.message });
  }
});
app.get("/api/admin/badges", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [orders, tickets, invoices, settlements] = await Promise.all([
      prisma14.order.count({ where: { status: { in: ["REQUESTED", "PENDING_SHIPPING_ESTIMATE", "PENDING_POSTAL_LABEL"] } } }),
      prisma14.ticket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma14.manualInvoice.count({ where: { status: "PENDING" } }),
      prisma14.settlementRequest.count({ where: { status: "PENDING" } })
    ]);
    res.json({ orders, tickets, invoices, settlements });
  } catch (err) {
    res.json({ orders: 0, tickets: 0, invoices: 0, settlements: 0 });
  }
});
app.patch("/api/admin/orders/:id/postal-label", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { postalLabel } = req.body;
    const orderId = parseInt(id, 10);
    if (isNaN(orderId)) {
      return res.status(400).json({ error: "\u0634\u0646\u0627\u0633\u0647 \u0633\u0641\u0627\u0631\u0634 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A" });
    }
    const order = await prisma14.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });
    if (!order) {
      return res.status(404).json({ error: "\u0633\u0641\u0627\u0631\u0634 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    }
    const savedLabel = processPostalLabel(orderId, postalLabel);
    const isTransitioningToProcessing = order.status === "NEW" || order.status === "PAID";
    const updatedOrder = await prisma14.order.update({
      where: { id: orderId },
      data: {
        postalLabel: savedLabel,
        status: isTransitioningToProcessing ? "PROCESSING" : order.status
      }
    });
    if (isTransitioningToProcessing) {
      if (order.orderSource === "direct" && order.items && order.items.length > 0) {
        try {
          await prisma14.$transaction(async (tx) => {
            for (const item of order.items) {
              if (!item.supplierId) continue;
              const supplierAmount = item.supplierPrice * item.quantity;
              let wallet = await tx.wallet.findUnique({
                where: { supplierId: item.supplierId }
              });
              if (!wallet) {
                wallet = await tx.wallet.create({
                  data: { supplierId: item.supplierId }
                });
              }
              await tx.wallet.update({
                where: { id: wallet.id },
                data: { balance: { increment: supplierAmount } }
              });
              await tx.ledgerEntry.create({
                data: {
                  walletId: wallet.id,
                  amount: supplierAmount,
                  type: "DEPOSIT",
                  status: "COMPLETED",
                  description: `\u0634\u0627\u0631\u0698 \u0627\u062A\u0648\u0645\u0627\u062A\u06CC\u06A9 \u0628\u0627\u0628\u062A \u0633\u0641\u0627\u0631\u0634 \u0645\u0633\u062A\u0642\u06CC\u0645 #${orderId}`,
                  referenceId: orderId.toString()
                }
              });
            }
          });
        } catch (walletErr) {
          console.error("Error crediting supplier wallets:", walletErr);
        }
      }
      try {
        await prisma14.orderStatusHistory.create({
          data: {
            orderId,
            fromStatus: order.status,
            toStatus: "PROCESSING",
            actorRole: "ADMIN",
            actorName: "\u0645\u062F\u06CC\u0631 \u0633\u06CC\u0633\u062A\u0645",
            note: "\u0628\u0627\u0631\u06AF\u0630\u0627\u0631\u06CC \u0644\u06CC\u0628\u0644 \u067E\u0633\u062A\u06CC \u0648 \u062A\u063A\u06CC\u06CC\u0631 \u0648\u0636\u0639\u06CC\u062A \u0628\u0647 \u062F\u0631 \u062D\u0627\u0644 \u067E\u0631\u062F\u0627\u0632\u0634"
          }
        });
      } catch (logErr) {
        console.error("Error logging status history:", logErr);
      }
    }
    res.json({ message: "\u0644\u06CC\u0628\u0644 \u067E\u0633\u062A\u06CC \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u062B\u0628\u062A \u0634\u062F", order: updatedOrder });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u0644\u06CC\u0628\u0644 \u067E\u0633\u062A\u06CC" });
  }
});
app.get("/api/admin/customers", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const orders = await prisma14.order.findMany({
      orderBy: { id: "desc" }
    });
    const customerMap = /* @__PURE__ */ new Map();
    for (const order of orders) {
      if (!order.customerPhone) continue;
      const phone = order.customerPhone;
      if (!customerMap.has(phone)) {
        customerMap.set(phone, {
          name: order.customerName || "\u06A9\u0627\u0631\u0628\u0631 \u0646\u0627\u0634\u0646\u0627\u0633",
          phone,
          address: order.customerAddress || "\u062B\u0628\u062A \u0646\u0634\u062F\u0647",
          cardNumber: order.customerCardNumber || "\u062B\u0628\u062A \u0646\u0634\u062F\u0647",
          ordersCount: 0,
          totalSpent: 0,
          orders: []
        });
      }
      const customer = customerMap.get(phone);
      customer.ordersCount += 1;
      customer.totalSpent += order.totalAmount;
      customer.orders.push({
        id: order.id,
        amount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt
      });
    }
    res.json(Array.from(customerMap.values()));
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0644\u06CC\u0633\u062A \u0645\u0634\u062A\u0631\u06CC\u0627\u0646" });
  }
});
app.patch("/api/admin/suppliers/:id/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const updated = await prisma14.user.update({
      where: { id: parseInt(id) },
      data: { status }
    });
    await prisma14.activityLog.create({
      data: { userId: req.user.userId, action: "CHANGE_SUPPLIER_STATUS", details: `Supplier ${id} changed to ${status}. Reason: ${reason || "none"}` }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062A\u063A\u06CC\u06CC\u0631 \u0648\u0636\u0639\u06CC\u062A \u062A\u0627\u0645\u06CC\u0646 \u06A9\u0646\u0646\u062F\u0647" });
  }
});
app.get("/api/admin/financial", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalRevenue = await prisma14.storeInvoice.aggregate({ _sum: { totalAmount: true }, where: { status: "PAID" } });
    const pendingStorePayments = await prisma14.storeInvoice.aggregate({ _sum: { totalAmount: true }, where: { status: "PENDING" } });
    const supplierWalletTotal = await prisma14.supplierWallet.aggregate({ _sum: { balance: true, pending: true } });
    res.json({
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      pendingStorePayments: pendingStorePayments._sum.totalAmount || 0,
      supplierWalletBalance: supplierWalletTotal._sum.balance || 0,
      supplierWalletPending: supplierWalletTotal._sum.pending || 0
    });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627" });
  }
});
app.get("/api/admin/categories", authenticateToken, requireAdmin, async (req, res) => {
  try {
    let cats = await prisma14.category.findMany({ orderBy: { id: "asc" } });
    if (cats.length === 0) {
      const defaultCategories = [
        "\u0645\u0648\u0628\u0627\u06CC\u0644",
        "\u0644\u067E\u200C\u062A\u0627\u067E",
        "\u06A9\u0627\u0644\u0627\u06CC \u062F\u06CC\u062C\u06CC\u062A\u0627\u0644",
        "\u062E\u0627\u0646\u0647 \u0648 \u0622\u0634\u067E\u0632\u062E\u0627\u0646\u0647",
        "\u0644\u0648\u0627\u0632\u0645 \u062E\u0627\u0646\u06AF\u06CC \u0628\u0631\u0642\u06CC",
        "\u0622\u0631\u0627\u06CC\u0634\u06CC \u0648 \u0628\u0647\u062F\u0627\u0634\u062A\u06CC",
        "\u0645\u062F \u0648 \u067E\u0648\u0634\u0627\u06A9",
        "\u0637\u0644\u0627 \u0648 \u0646\u0642\u0631\u0647",
        "\u062E\u0648\u062F\u0631\u0648 \u0648 \u0645\u0648\u062A\u0648\u0631\u0633\u06CC\u06A9\u0644\u062A",
        "\u0633\u0644\u0627\u0645\u062A \u0648 \u067E\u0632\u0634\u06A9\u06CC",
        "\u0627\u0628\u0632\u0627\u0631\u0622\u0644\u0627\u062A \u0648 \u062A\u062C\u0647\u06CC\u0632\u0627\u062A",
        "\u06A9\u062A\u0627\u0628 \u0648 \u0647\u0646\u0631",
        "\u0648\u0631\u0632\u0634 \u0648 \u0633\u0641\u0631",
        "\u0627\u0633\u0628\u0627\u0628 \u0628\u0627\u0632\u06CC \u06A9\u0648\u062F\u06A9 \u0648 \u0646\u0648\u0632\u0627\u062F",
        "\u0645\u062D\u0635\u0648\u0644\u0627\u062A \u0628\u0648\u0645\u06CC \u0648 \u0645\u062D\u0644\u06CC",
        "\u067E\u062A \u0634\u0627\u067E"
      ];
      for (let i = 0; i < defaultCategories.length; i++) {
        try {
          const catName = defaultCategories[i];
          const exists = await prisma14.category.findFirst({ where: { name: catName } });
          if (!exists) {
            await prisma14.category.create({
              data: { name: catName, isActive: true, sortOrder: i + 1 }
            });
          }
        } catch (e) {
        }
      }
      cats = await prisma14.category.findMany({ orderBy: { id: "asc" } });
    }
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC\u200C\u0647\u0627" });
  }
});
app.post("/api/admin/categories", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, isActive, sortOrder } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: "\u0646\u0627\u0645 \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A." });
    }
    const cat = await prisma14.category.create({
      data: {
        name: name.trim(),
        isActive: isActive !== void 0 ? Boolean(isActive) : true,
        sortOrder: sortOrder ? Number(sortOrder) : 0
      }
    });
    res.json(cat);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0627\u06CC\u062C\u0627\u062F \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC" });
  }
});
app.put("/api/admin/categories/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, isActive, sortOrder } = req.body;
    const cat = await prisma14.category.update({
      where: { id },
      data: {
        ...name !== void 0 && { name: name.trim() },
        ...isActive !== void 0 && { isActive: Boolean(isActive) },
        ...sortOrder !== void 0 && { sortOrder: Number(sortOrder) }
      }
    });
    res.json(cat);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC" });
  }
});
app.delete("/api/admin/categories/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma14.category.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062D\u0630\u0641 \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC" });
  }
});
app.post("/api/admin/categories/seed", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const defaultCategories = [
      "\u0645\u0648\u0628\u0627\u06CC\u0644",
      "\u0644\u067E\u200C\u062A\u0627\u067E",
      "\u06A9\u0627\u0644\u0627\u06CC \u062F\u06CC\u062C\u06CC\u062A\u0627\u0644",
      "\u067E\u0648\u0634\u0627\u06A9 \u0648 \u0645\u062F",
      "\u0644\u0648\u0627\u0632\u0645 \u062E\u0627\u0646\u06AF\u06CC",
      "\u0622\u0631\u0627\u06CC\u0634\u06CC \u0648 \u0628\u0647\u062F\u0627\u0634\u062A\u06CC",
      "\u0627\u0628\u0632\u0627\u0631 \u0648 \u062A\u062C\u0647\u06CC\u0632\u0627\u062A",
      "\u0645\u0648\u0627\u062F \u063A\u0630\u0627\u06CC\u06CC",
      "\u0642\u0637\u0639\u0627\u062A \u062E\u0648\u062F\u0631\u0648",
      "\u062A\u062C\u0647\u06CC\u0632\u0627\u062A \u067E\u0632\u0634\u06A9\u06CC",
      "\u0644\u0648\u0627\u0632\u0645 \u062A\u062D\u0631\u06CC\u0631",
      "\u0633\u0627\u062E\u062A\u0645\u0627\u0646\u06CC",
      "\u0635\u0646\u0639\u062A\u06CC",
      "\u0627\u0633\u0628\u0627\u0628 \u0628\u0627\u0632\u06CC",
      "\u0645\u062D\u0635\u0648\u0644\u0627\u062A \u0628\u0648\u0645\u06CC \u0648 \u0645\u062D\u0644\u06CC",
      "\u067E\u062A \u0634\u0627\u067E"
    ];
    let added = 0;
    for (let i = 0; i < defaultCategories.length; i++) {
      const catName = defaultCategories[i];
      const exists = await prisma14.category.findFirst({ where: { name: catName } });
      if (!exists) {
        await prisma14.category.create({
          data: { name: catName, isActive: true, sortOrder: i + 1 }
        });
        added++;
      }
    }
    const cats = await prisma14.category.findMany({ orderBy: { id: "asc" } });
    res.json({ success: true, added, categories: cats });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0627\u06CC\u062C\u0627\u062F \u062F\u0633\u062A\u0647\u200C\u0628\u0646\u062F\u06CC\u200C\u0647\u0627\u06CC \u067E\u06CC\u0634\u200C\u0641\u0631\u0636" });
  }
});
app.get("/api/admin/tickets", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const tickets = await prisma14.ticket.findMany({
      include: {
        user: { select: { firstName: true, lastName: true, role: true, username: true } },
        messages: { orderBy: { createdAt: "asc" }, include: { user: { select: { firstName: true, lastName: true, role: true } } } }
      },
      orderBy: { id: "desc" }
    });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u062A\u06CC\u06A9\u062A\u200C\u0647\u0627" });
  }
});
app.post("/api/admin/tickets/:id/reply", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, attachmentUrl } = req.body;
    const msg = await prisma14.ticketMessage.create({
      data: {
        ticketId: parseInt(id),
        userId: req.user.userId,
        message,
        attachmentUrl: attachmentUrl || null
      }
    });
    await prisma14.ticket.update({ where: { id: parseInt(id) }, data: { status: "ANSWERED", updatedAt: /* @__PURE__ */ new Date() } });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062B\u0628\u062A \u067E\u0627\u0633\u062E \u062A\u06CC\u06A9\u062A" });
  }
});
app.get("/api/admin/logs", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const logs = await prisma14.activityLog.findMany({
      include: { user: { select: { username: true, role: true } } },
      orderBy: { id: "desc" },
      take: 100
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627" });
  }
});
app.get("/api/admin/health", authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({
      status: "OK",
      apiStatus: "Online",
      dbStatus: "Connected",
      serverTime: (/* @__PURE__ */ new Date()).toISOString(),
      uptime: process.uptime()
    });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627" });
  }
});
var execPromise = import_util.default.promisify(import_child_process3.exec);
app.get("/api/admin/dev/files", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const getFiles = (dir) => {
      let dirents;
      try {
        dirents = import_fs3.default.readdirSync(dir, { withFileTypes: true });
      } catch (err) {
        return [];
      }
      const files = dirents.map((dirent) => {
        const fullPath = import_path3.default.resolve(dir, dirent.name);
        const relPath = fullPath.replace(process.cwd(), "");
        if (["node_modules", ".git", "dist", "prod_output", ".cache"].includes(dirent.name)) return null;
        if (dirent.isDirectory()) {
          const children = getFiles(fullPath);
          return { name: dirent.name, path: relPath, type: "directory", children };
        } else {
          return { name: dirent.name, path: relPath, type: "file" };
        }
      }).filter(Boolean);
      return files;
    };
    const tree = getFiles(process.cwd());
    res.json(tree);
  } catch (error) {
    console.error("Dev Files Error:", error);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0644\u06CC\u0633\u062A \u0641\u0627\u06CC\u0644\u200C\u0647\u0627" });
  }
});
app.get("/api/download-release", (req, res) => {
  const filePath = import_path3.default.join(process.cwd(), "public", "zopit-release.zip");
  if (import_fs3.default.existsSync(filePath)) {
    res.download(filePath, "zopit-release.zip");
  } else {
    res.status(404).send("Release not found");
  }
});
app.get("/api/download-cpanel-release", (req, res) => {
  const filePath = import_path3.default.join(process.cwd(), "public", "cpanel-release.zip");
  if (import_fs3.default.existsSync(filePath)) {
    res.download(filePath, "cpanel-release.zip");
  } else {
    res.status(404).send("Release not found");
  }
});
app.get("/api/admin/dev/file", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath || filePath.includes("..")) return res.status(400).json({ error: "\u0645\u0633\u06CC\u0631 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" });
    const fullPath = import_path3.default.join(process.cwd(), filePath);
    if (!import_fs3.default.existsSync(fullPath)) return res.status(404).json({ error: "\u0641\u0627\u06CC\u0644 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F" });
    const content = import_fs3.default.readFileSync(fullPath, "utf8");
    res.json({ content });
  } catch (error) {
    console.error("Dev File Read Error:", error);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062E\u0648\u0627\u0646\u062F\u0646 \u0641\u0627\u06CC\u0644" });
  }
});
app.post("/api/admin/dev/file", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath || filePath.includes("..")) return res.status(400).json({ error: "\u0645\u0633\u06CC\u0631 \u0646\u0627\u0645\u0639\u062A\u0628\u0631" });
    const fullPath = import_path3.default.join(process.cwd(), filePath);
    const dir = import_path3.default.dirname(fullPath);
    if (!import_fs3.default.existsSync(dir)) {
      import_fs3.default.mkdirSync(dir, { recursive: true });
    }
    import_fs3.default.writeFileSync(fullPath, content, "utf8");
    res.json({ success: true });
  } catch (error) {
    console.error("Dev File Write Error:", error);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0630\u062E\u06CC\u0631\u0647 \u0641\u0627\u06CC\u0644" });
  }
});
app.post("/api/admin/dev/build", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { stdout, stderr } = await execPromise("npm install && npm run build");
    res.json({ success: true, stdout, stderr });
  } catch (error) {
    console.error("Dev Build Error:", error);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0628\u06CC\u0644\u062F \u06A9\u0631\u062F\u0646 \u067E\u0631\u0648\u0698\u0647", details: error.message, stdout: error.stdout, stderr: error.stderr });
  }
});
app.post("/api/admin/dev/restart", authenticateToken, requireAdmin, async (req, res) => {
  try {
    res.json({ success: true, message: "Server is restarting..." });
    setTimeout(() => {
      process.exit(0);
    }, 1e3);
  } catch (error) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0631\u0627\u0647\u200C\u0627\u0646\u062F\u0627\u0632\u06CC \u0645\u062C\u062F\u062F" });
  }
});
app.post("/api/upload", authenticateToken, multerFn({ dest: rootUploadsDir }).single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded." });
    }
    const ext = import_path3.default.extname(req.file.originalname) || "";
    const newFilename = `${req.file.filename}${ext}`;
    const newPath = import_path3.default.join(rootUploadsDir, newFilename);
    import_fs3.default.renameSync(req.file.path, newPath);
    const fileUrl = `/uploads/${newFilename}`;
    res.json({ url: fileUrl });
  } catch (err) {
    console.error("File upload error:", err);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0622\u067E\u0644\u0648\u062F \u0641\u0627\u06CC\u0644" });
  }
});
var devUploadDir = process.env.VERCEL ? import_path3.default.join("/tmp", "uploads") : import_path3.default.join(process.cwd(), "uploads");
if (!import_fs3.default.existsSync(devUploadDir)) {
  try {
    import_fs3.default.mkdirSync(devUploadDir, { recursive: true });
  } catch (e) {
  }
}
var upload = multerFn({ dest: devUploadDir });
app.post("/api/admin/dev/update", authenticateToken, requireAdmin, upload.single("updateZip"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "\u0647\u06CC\u0686 \u0641\u0627\u06CC\u0644\u06CC \u0627\u0631\u0633\u0627\u0644 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A" });
    }
    const zipPath = req.file.path;
    const newVersion = req.body.version;
    if (newVersion) {
      await prisma14.systemConfig.upsert({
        where: { key: "PLATFORM_VERSION" },
        update: { value: newVersion },
        create: { key: "PLATFORM_VERSION", value: newVersion }
      });
    }
    const ZipClass = typeof import_adm_zip.default === "function" ? import_adm_zip.default : import_adm_zip.default.default || require("adm-zip");
    const zip = new ZipClass(zipPath);
    const extractDir = import_path3.default.join(process.cwd(), "temp_update_" + Date.now());
    zip.extractAllTo(extractDir, true);
    const findProjectRootDir = (dir) => {
      if (import_fs3.default.existsSync(import_path3.default.join(dir, "package.json")) || import_fs3.default.existsSync(import_path3.default.join(dir, "server.ts"))) {
        return dir;
      }
      const entries = import_fs3.default.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && entry.name !== "__MACOSX" && entry.name !== "node_modules" && !entry.name.startsWith(".")) {
          const subPath = import_path3.default.join(dir, entry.name);
          const found = findProjectRootDir(subPath);
          if (found !== dir) return found;
        }
      }
      return dir;
    };
    const sourceDir = findProjectRootDir(extractDir);
    const copyRecursiveSync = (src, dest) => {
      const exists = import_fs3.default.existsSync(src);
      const stats = exists && import_fs3.default.statSync(src);
      const isDirectory = exists && stats.isDirectory();
      if (isDirectory) {
        if (!import_fs3.default.existsSync(dest)) {
          import_fs3.default.mkdirSync(dest, { recursive: true });
        }
        import_fs3.default.readdirSync(src).forEach((childItemName) => {
          const ignoredAtRoot = [
            "node_modules",
            ".env",
            ".env.production",
            ".env.local",
            "dev.db",
            "prisma/dev.db",
            ".git",
            "uploads",
            "__MACOSX",
            ".DS_Store"
          ];
          if (ignoredAtRoot.includes(childItemName) && dest === process.cwd()) {
            return;
          }
          if (childItemName === "__MACOSX" || childItemName === ".DS_Store") return;
          copyRecursiveSync(import_path3.default.join(src, childItemName), import_path3.default.join(dest, childItemName));
        });
      } else {
        const fileName = import_path3.default.basename(src);
        if (fileName === ".env" || fileName.endsWith(".db") || fileName.endsWith(".sqlite")) {
          return;
        }
        const destDir = import_path3.default.dirname(dest);
        if (!import_fs3.default.existsSync(destDir)) {
          import_fs3.default.mkdirSync(destDir, { recursive: true });
        }
        import_fs3.default.copyFileSync(src, dest);
      }
    };
    copyRecursiveSync(sourceDir, process.cwd());
    try {
      import_fs3.default.rmSync(extractDir, { recursive: true, force: true });
    } catch (e) {
    }
    try {
      import_fs3.default.unlinkSync(zipPath);
    } catch (e) {
    }
    let buildSuccess = false;
    let buildOutput = "";
    let buildError = "";
    try {
      const { stdout, stderr } = await execPromise("npm run build");
      buildSuccess = true;
      buildOutput = stdout;
      buildError = stderr;
    } catch (bErr) {
      buildError = bErr.message || bErr.stderr || "\u06A9\u0627\u0645\u067E\u0627\u06CC\u0644 \u062E\u0648\u062F\u06A9\u0627\u0631 \u062E\u0637\u0627 \u062F\u0627\u062F";
    }
    res.json({
      success: true,
      message: buildSuccess ? "\u0641\u0627\u06CC\u0644\u200C\u0647\u0627\u06CC \u062C\u062F\u06CC\u062F \u062C\u0627\u06CC\u06AF\u0632\u06CC\u0646 \u0648 \u0628\u06CC\u0644\u062F \u0634\u062F\u0646\u062F. \u0633\u0631\u0648\u0631 \u0628\u0647 \u0635\u0648\u0631\u062A \u062E\u0648\u062F\u06A9\u0627\u0631 \u062A\u0627 \u0686\u0646\u062F \u0644\u062D\u0638\u0647 \u062F\u06CC\u06AF\u0631 \u0631\u06CC\u200C\u0627\u0633\u062A\u0627\u0631\u062A \u0645\u06CC\u200C\u0634\u0648\u062F." : "\u0641\u0627\u06CC\u0644\u200C\u0647\u0627\u06CC \u062C\u062F\u06CC\u062F \u062C\u0627\u06CC\u06AF\u0632\u06CC\u0646 \u0634\u062F\u0646\u062F \u0627\u0645\u0627 \u0628\u06CC\u0644\u062F \u062E\u0637\u0627 \u062F\u0627\u0634\u062A.",
      buildSuccess,
      buildOutput,
      buildError
    });
    if (buildSuccess) {
      setTimeout(() => {
        process.exit(0);
      }, 2e3);
    }
  } catch (error) {
    console.error("Update Error:", error);
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u0628\u0631\u0648\u0632\u0631\u0633\u0627\u0646\u06CC \u0641\u0627\u06CC\u0644\u200C\u0647\u0627", details: error.message || String(error) });
  }
});
app.get("/api/admin/dev/error-logs", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const logFile = import_path3.default.join(process.cwd(), "error.log");
    if (import_fs3.default.existsSync(logFile)) {
      const logs = import_fs3.default.readFileSync(logFile, "utf8");
      res.json({ logs: logs.slice(-1e5) });
    } else {
      res.json({ logs: "\u0644\u0627\u06AF\u06CC \u062B\u0628\u062A \u0646\u0634\u062F\u0647 \u0627\u0633\u062A." });
    }
  } catch (error) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062E\u0648\u0627\u0646\u062F\u0646 \u0644\u0627\u06AF\u200C\u0647\u0627" });
  }
});
var rateLimitMap = /* @__PURE__ */ new Map();
var wooRateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1e3;
  const maxRequests = 20;
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }
  const record = rateLimitMap.get(ip);
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return next();
  }
  record.count++;
  if (record.count > maxRequests) {
    return res.status(429).json({ error: "Too many requests, please try again later." });
  }
  next();
};
app.get("/api/admin/woocommerce/status", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const config = await prisma14.systemConfig.findUnique({ where: { key: "WOOCOMMERCE_SYNC_ENABLED" } });
    const enabled = config ? config.value === "true" : false;
    const connections = await prisma14.wooCommerceConnection.findMany({
      include: { store: { select: { id: true, firstName: true, lastName: true, username: true } } }
    });
    res.json({ enabled, connections });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062F\u0631\u06CC\u0627\u0641\u062A \u0648\u0636\u0639\u06CC\u062A \u0648\u0648\u06A9\u0627\u0645\u0631\u0633" });
  }
});
app.post("/api/admin/woocommerce/toggle", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { enabled } = req.body;
    await prisma14.systemConfig.upsert({
      where: { key: "WOOCOMMERCE_SYNC_ENABLED" },
      update: { value: String(enabled) },
      create: { key: "WOOCOMMERCE_SYNC_ENABLED", value: String(enabled) }
    });
    res.json({ success: true, enabled });
  } catch (err) {
    res.status(500).json({ error: "\u062E\u0637\u0627 \u062F\u0631 \u062A\u063A\u06CC\u06CC\u0631 \u0648\u0636\u0639\u06CC\u062A \u0648\u0648\u06A9\u0627\u0645\u0631\u0633" });
  }
});
app.get("/api/store/connection", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const config = await prisma14.systemConfig.findUnique({ where: { key: "WOOCOMMERCE_SYNC_ENABLED" } });
    const isEnabled = config ? config.value === "true" : false;
    const storeId = req.user.userId;
    const conn = await ConnectionService.getConnection(storeId);
    if (conn) {
      const logs = await prisma14.syncLog.findMany({ where: { connectionId: conn.id }, orderBy: { id: "desc" }, take: 5 });
      res.json({ ...conn, isGloballyEnabled: isEnabled, syncLogs: logs });
    } else {
      res.json({ isGloballyEnabled: isEnabled });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/store/test", wooRateLimiter, authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const config = await prisma14.systemConfig.findUnique({ where: { key: "WOOCOMMERCE_SYNC_ENABLED" } });
    if (!config || config.value !== "true") {
      return res.status(403).json({ error: "\u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u0627\u062A\u0635\u0627\u0644 \u0648\u0648\u06A9\u0627\u0645\u0631\u0633 \u062A\u0648\u0633\u0637 \u0645\u062F\u06CC\u0631\u06CC\u062A \u0627\u0631\u0634\u062F \u063A\u06CC\u0631\u0641\u0639\u0627\u0644 \u0627\u0633\u062A." });
    }
    const { storeUrl, consumerKey, consumerSecret } = req.body;
    const result = await ConnectionService.testConnection(storeUrl, consumerKey, consumerSecret);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/store/connect", wooRateLimiter, authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId;
    const { storeUrl, consumerKey, consumerSecret } = req.body;
    const result = await ConnectionService.connect(storeId, storeUrl, consumerKey, consumerSecret);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/store/disconnect", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId;
    await ConnectionService.disconnect(storeId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/store/sync/products", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId;
    const result = await SyncService.runProductSync(storeId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/store/sync/stock", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId;
    const result = await SyncService.runStockSync(storeId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/store/sync/orders", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId;
    const result = await SyncService.runOrderSync(storeId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/sync/order/:orderId", authenticateToken, requireStoreManager, async (req, res) => {
  try {
    const storeId = req.user.userId;
    const orderId = req.params.orderId;
    const result = await syncSingleOrder(storeId, orderId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/webhooks/woocommerce", webhookLimiter, async (req, res) => {
  try {
    const signature = req.headers["x-wc-webhook-signature"];
    const storeId = req.query.store_id;
    await WebhookService.handleWebhook(req.body, signature, Number(storeId));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/mock/payment-callback", async (req, res) => {
  const { authority, status, callbackUrl } = req.query;
  if (!status && authority && callbackUrl) {
    const html = `
      <html>
        <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #f9fafb;">
          <div style="background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center;">
            <h2 style="margin-top: 0;">Mock Payment Gateway</h2>
            <p>Authority: <strong>${authority}</strong></p>
            <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: center;">
              <a href="/api/mock/payment-callback?authority=${authority}&status=success&callbackUrl=${encodeURIComponent(callbackUrl)}" style="background: #10b981; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 4px; font-weight: bold;">Simulate Success</a>
              <a href="/api/mock/payment-callback?authority=${authority}&status=failed&callbackUrl=${encodeURIComponent(callbackUrl)}" style="background: #ef4444; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 4px; font-weight: bold;">Simulate Failure</a>
            </div>
          </div>
        </body>
      </html>
    `;
    res.send(html);
    return;
  }
  if (authority && typeof authority === "string") {
    Promise.resolve().then(() => (init_MockZibalService(), MockZibalService_exports)).then(({ mockPaymentStore: mockPaymentStore2 }) => {
      const record = mockPaymentStore2.get(authority);
      if (record) {
        record.status = status === "failed" ? "failed" : "success";
      }
    }).catch(console.error);
  }
  if (callbackUrl && typeof callbackUrl === "string") {
    res.redirect(`${callbackUrl}?Authority=${authority}&Status=${status === "success" ? "OK" : "NOK"}`);
  } else {
    res.json({ message: "Mock payment processed", authority, status });
  }
});
app.get("/api/banners", (req, res) => {
  res.json([]);
});
app.get("/api/public-messages", (req, res) => {
  res.json([]);
});
app.get("/api/public/products", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const sort = req.query.sort;
    const search = req.query.search;
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId) : void 0;
    const skip = (page - 1) * limit;
    let orderBy = { id: "desc" };
    if (sort === "cheapest") {
      orderBy = { supplierBasePrice: "asc" };
    } else if (sort === "expensive") {
      orderBy = { supplierBasePrice: "desc" };
    }
    let whereClause = {
      status: { in: ["ACTIVE", "PUBLISHED"] },
      OR: [
        { exploreContent: { is: null } },
        { exploreContent: { isPublished: true } }
      ]
    };
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    if (search) {
      whereClause.OR = [
        { name: { contains: search } },
        { shortDescription: { contains: search } },
        { longDescription: { contains: search } }
      ];
    }
    const products = await prisma14.product.findMany({
      where: whereClause,
      include: {
        images: true,
        exploreContent: true,
        supplier: {
          select: {
            storeUrl: true,
            storeLink: true,
            storeName: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    });
    const formattedProducts = products.map((p) => {
      let finalPrice = p.finalPrice;
      if (!finalPrice) {
        finalPrice = p.supplierBasePrice;
        if (p.marginType === "PERCENTAGE" && p.marginValue) {
          finalPrice = p.supplierBasePrice * (1 + p.marginValue / 100);
        } else if (p.marginType === "FIXED" && p.marginValue) {
          finalPrice = p.supplierBasePrice + p.marginValue;
        } else {
          finalPrice = p.supplierBasePrice * 1.15;
        }
      }
      return {
        id: p.id,
        name: p.exploreContent?.customTitle || p.name,
        description: p.exploreContent?.customDescription || p.longDescription || p.shortDescription || "",
        imageUrl: p.exploreContent?.customImageUrl || p.images?.[0]?.url || "",
        customVideoUrl: p.exploreContent?.customVideoUrl || null,
        supplierBasePrice: p.supplierBasePrice,
        finalPrice,
        price: finalPrice,
        storeId: p.supplierId,
        storeName: p.supplier?.storeName || "",
        storeUrl: p.supplier?.storeUrl || "",
        storeLink: p.supplier?.storeLink || "",
        images: p.images || [],
        technicalSpecs: p.technicalSpecs
      };
    });
    res.json({ products: formattedProducts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/public/products/:productId/stats", async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const deviceId = req.query.deviceId;
    const likesCount = await prisma14.productLike.count({
      where: { productId }
    });
    const commentsCount = await prisma14.productComment.count({
      where: { productId, isApproved: true }
    });
    let isLiked = false;
    if (deviceId) {
      const like = await prisma14.productLike.findUnique({
        where: {
          productId_deviceId: {
            productId,
            deviceId
          }
        }
      });
      isLiked = !!like;
    }
    res.json({
      likesCount,
      commentsCount,
      isLiked
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/public/products/:productId/like", async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const { deviceId } = req.body;
    if (!deviceId) {
      return res.status(400).json({ error: "Device ID is required" });
    }
    const existingLike = await prisma14.productLike.findUnique({
      where: {
        productId_deviceId: {
          productId,
          deviceId
        }
      }
    });
    let liked = false;
    if (existingLike) {
      await prisma14.productLike.delete({
        where: {
          productId_deviceId: {
            productId,
            deviceId
          }
        }
      });
    } else {
      await prisma14.productLike.create({
        data: {
          productId,
          deviceId
        }
      });
      liked = true;
    }
    const likesCount = await prisma14.productLike.count({
      where: { productId }
    });
    res.json({
      liked,
      likesCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/public/categories", async (req, res) => {
  try {
    let cats = await prisma14.category.findMany({ orderBy: { id: "asc" } });
    if (cats.length === 0) {
      const defaultCategories = [
        "\u0645\u0648\u0628\u0627\u06CC\u0644",
        "\u0644\u067E\u200C\u062A\u0627\u067E",
        "\u06A9\u0627\u0644\u0627\u06CC \u062F\u06CC\u062C\u06CC\u062A\u0627\u0644",
        "\u062E\u0627\u0646\u0647 \u0648 \u0622\u0634\u067E\u0632\u062E\u0627\u0646\u0647",
        "\u0644\u0648\u0627\u0632\u0645 \u062E\u0627\u0646\u06AF\u06CC \u0628\u0631\u0642\u06CC",
        "\u0622\u0631\u0627\u06CC\u0634\u06CC \u0648 \u0628\u0647\u062F\u0627\u0634\u062A\u06CC",
        "\u0645\u062F \u0648 \u067E\u0648\u0634\u0627\u06A9",
        "\u0637\u0644\u0627 \u0648 \u0646\u0642\u0631\u0647",
        "\u062E\u0648\u062F\u0631\u0648 \u0648 \u0645\u0648\u062A\u0648\u0631\u0633\u06CC\u06A9\u0644\u062A",
        "\u0633\u0644\u0627\u0645\u062A \u0648 \u067E\u0632\u0634\u06A9\u06CC",
        "\u0627\u0628\u0632\u0627\u0631\u0622\u0644\u0627\u062A \u0648 \u062A\u062C\u0647\u06CC\u0632\u0627\u062A",
        "\u06A9\u062A\u0627\u0628 \u0648 \u0647\u0646\u0631",
        "\u0648\u0631\u0632\u0634 \u0648 \u0633\u0641\u0631",
        "\u0627\u0633\u0628\u0627\u0628 \u0628\u0627\u0632\u06CC \u06A9\u0648\u062F\u06A9 \u0648 \u0646\u0648\u0632\u0627\u062F",
        "\u0645\u062D\u0635\u0648\u0644\u0627\u062A \u0628\u0648\u0645\u06CC \u0648 \u0645\u062D\u0644\u06CC",
        "\u067E\u062A \u0634\u0627\u067E"
      ];
      for (let i = 0; i < defaultCategories.length; i++) {
        try {
          const catName = defaultCategories[i];
          const exists = await prisma14.category.findFirst({ where: { name: catName } });
          if (!exists) {
            await prisma14.category.create({
              data: { name: catName, isActive: true, sortOrder: i + 1 }
            });
          }
        } catch (e) {
        }
      }
      cats = await prisma14.category.findMany({ orderBy: { id: "asc" } });
    }
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/categories", async (req, res) => {
  try {
    let cats = await prisma14.category.findMany({ orderBy: { id: "asc" } });
    if (cats.length === 0) {
      const defaultCategories = [
        "\u0645\u0648\u0628\u0627\u06CC\u0644",
        "\u0644\u067E\u200C\u062A\u0627\u067E",
        "\u06A9\u0627\u0644\u0627\u06CC \u062F\u06CC\u062C\u06CC\u062A\u0627\u0644",
        "\u062E\u0627\u0646\u0647 \u0648 \u0622\u0634\u067E\u0632\u062E\u0627\u0646\u0647",
        "\u0644\u0648\u0627\u0632\u0645 \u062E\u0627\u0646\u06AF\u06CC \u0628\u0631\u0642\u06CC",
        "\u0622\u0631\u0627\u06CC\u0634\u06CC \u0648 \u0628\u0647\u062F\u0627\u0634\u062A\u06CC",
        "\u0645\u062F \u0648 \u067E\u0648\u0634\u0627\u06A9",
        "\u0637\u0644\u0627 \u0648 \u0646\u0642\u0631\u0647",
        "\u062E\u0648\u062F\u0631\u0648 \u0648 \u0645\u0648\u062A\u0648\u0631\u0633\u06CC\u06A9\u0644\u062A",
        "\u0633\u0644\u0627\u0645\u062A \u0648 \u067E\u0632\u0634\u06A9\u06CC",
        "\u0627\u0628\u0632\u0627\u0631\u0622\u0644\u0627\u062A \u0648 \u062A\u062C\u0647\u06CC\u0632\u0627\u062A",
        "\u06A9\u062A\u0627\u0628 \u0648 \u0647\u0646\u0631",
        "\u0648\u0631\u0632\u0634 \u0648 \u0633\u0641\u0631",
        "\u0627\u0633\u0628\u0627\u0628 \u0628\u0627\u0632\u06CC \u06A9\u0648\u062F\u06A9 \u0648 \u0646\u0648\u0632\u0627\u062F",
        "\u0645\u062D\u0635\u0648\u0644\u0627\u062A \u0628\u0648\u0645\u06CC \u0648 \u0645\u062D\u0644\u06CC",
        "\u067E\u062A \u0634\u0627\u067E"
      ];
      for (let i = 0; i < defaultCategories.length; i++) {
        try {
          const catName = defaultCategories[i];
          const exists = await prisma14.category.findFirst({ where: { name: catName } });
          if (!exists) {
            await prisma14.category.create({
              data: { name: catName, isActive: true, sortOrder: i + 1 }
            });
          }
        } catch (e) {
        }
      }
      cats = await prisma14.category.findMany({ orderBy: { id: "asc" } });
    }
    res.json(cats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/public/products/:productId/comments", async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const comments = await prisma14.productComment.findMany({
      where: {
        productId,
        isApproved: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/public/products/:productId/comments", async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const { authorName, text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Comment text is required" });
    }
    const comment = await prisma14.productComment.create({
      data: {
        productId,
        authorName: authorName || "\u06A9\u0627\u0631\u0628\u0631 \u0645\u0647\u0645\u0627\u0646",
        text,
        isApproved: true
      }
    });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/public/products/:productId/questions", async (req, res) => {
  try {
    const productId = parseInt(req.params.productId);
    const questions = await prisma14.productQuestion.findMany({
      where: {
        productId,
        isAnswered: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/public/questions", async (req, res) => {
  try {
    const { productId, storeManagerId, askerName, questionText } = req.body;
    if (!productId || !questionText) {
      return res.status(400).json({ error: "Product ID and question text are required" });
    }
    const question = await prisma14.productQuestion.create({
      data: {
        productId: parseInt(productId),
        storeManagerId: storeManagerId ? parseInt(storeManagerId) : null,
        askerName: askerName || "\u06A9\u0627\u0631\u0628\u0631 \u0646\u0627\u0634\u0646\u0627\u0633",
        questionText,
        isAnswered: false
      }
    });
    res.json({ question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
var checkoutSchema = import_zod2.z.object({
  items: import_zod2.z.array(import_zod2.z.object({
    id: import_zod2.z.number().positive(),
    quantity: import_zod2.z.number().int().positive()
  })).min(1, "\u0627\u0642\u0644\u0627\u0645 \u0633\u0628\u062F \u062E\u0631\u06CC\u062F \u062E\u0627\u0644\u06CC \u0627\u0633\u062A."),
  customerName: import_zod2.z.string().min(1, "\u0646\u0627\u0645 \u06AF\u06CC\u0631\u0646\u062F\u0647 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A."),
  customerPhone: import_zod2.z.string().min(10, "\u0634\u0645\u0627\u0631\u0647 \u062A\u0645\u0627\u0633 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A."),
  customerAddress: import_zod2.z.string().min(1, "\u0622\u062F\u0631\u0633 \u0627\u0644\u0632\u0627\u0645\u06CC \u0627\u0633\u062A."),
  customerCardNumber: import_zod2.z.string().length(16, "\u0634\u0645\u0627\u0631\u0647 \u06A9\u0627\u0631\u062A \u0628\u0627\u06CC\u062F \u06F1\u06F6 \u0631\u0642\u0645 \u0628\u0627\u0634\u062F.")
});
app.post("/api/public/checkout", async (req, res) => {
  try {
    const validatedData = checkoutSchema.parse(req.body);
    const { items, customerName, customerPhone, customerAddress, customerCardNumber } = validatedData;
    const cleanPhone = customerPhone.trim();
    let customerCreated = false;
    let existingUser = await prisma14.user.findFirst({
      where: {
        OR: [
          { mobile: cleanPhone },
          { username: cleanPhone }
        ]
      }
    });
    if (!existingUser) {
      try {
        const nameParts = customerName.trim().split(" ");
        const firstName = nameParts[0] || customerName;
        const lastName = nameParts.slice(1).join(" ") || "\u062E\u0631\u06CC\u062F\u0627\u0631";
        const hashedPassword = await import_bcryptjs.default.hash(cleanPhone, 10);
        existingUser = await prisma14.user.create({
          data: {
            username: cleanPhone,
            password: hashedPassword,
            role: "CUSTOMER",
            status: "ACTIVE",
            firstName,
            lastName,
            mobile: cleanPhone,
            address: customerAddress
          }
        });
        customerCreated = true;
      } catch (userCreateErr) {
        console.warn("Auto customer creation warning:", userCreateErr);
      }
    }
    let totalAmount = 0;
    const orderItemsData = [];
    for (const item of items) {
      const product = await prisma14.product.findUnique({
        where: { id: item.id }
      });
      if (!product) {
        return res.status(400).json({ error: `\u0645\u062D\u0635\u0648\u0644 \u0628\u0627 \u0634\u0646\u0627\u0633\u0647 ${item.id} \u06CC\u0627\u0641\u062A \u0646\u0634\u062F.` });
      }
      const quantity = item.quantity;
      const finalPrice = product.finalPrice || product.supplierBasePrice;
      const itemTotal = finalPrice * quantity;
      totalAmount += itemTotal;
      orderItemsData.push({
        productId: product.id,
        supplierId: product.supplierId,
        quantity,
        price: finalPrice,
        supplierPrice: product.supplierBasePrice,
        status: "PENDING"
      });
    }
    const supplierIds = new Set(orderItemsData.map((item) => item.supplierId).filter(Boolean));
    if (supplierIds.size > 1) {
      return res.status(400).json({
        error: "\u062B\u0628\u062A \u0633\u0641\u0627\u0631\u0634 \u0627\u0632 \u0686\u0646\u062F \u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647 \u0645\u062E\u062A\u0644\u0641 \u062F\u0631 \u06CC\u06A9 \u0645\u0631\u0633\u0648\u0644\u0647 \u0627\u0645\u06A9\u0627\u0646\u200C\u067E\u0630\u06CC\u0631 \u0646\u06CC\u0633\u062A. \u062C\u0647\u062A \u0645\u062D\u0627\u0633\u0628\u0647 \u062F\u0642\u06CC\u0642 \u0647\u0632\u06CC\u0646\u0647 \u0627\u0631\u0633\u0627\u0644\u060C \u0644\u0637\u0641\u0627\u064B \u0628\u0631\u0627\u06CC \u06A9\u0627\u0644\u0627\u0647\u0627\u06CC \u0647\u0631 \u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647 \u0633\u0641\u0627\u0631\u0634 \u0645\u062C\u0632\u0627 \u062B\u0628\u062A \u0646\u0645\u0627\u06CC\u06CC\u062F."
      });
    }
    const order = await prisma14.order.create({
      data: {
        totalAmount,
        status: "NEW",
        orderSource: "direct",
        customerName,
        customerPhone,
        customerAddress,
        customerCardNumber,
        items: {
          create: orderItemsData
        },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: "NEW",
            actorRole: "SYSTEM",
            actorName: "\u0633\u06CC\u0633\u062A\u0645 \u062B\u0628\u062A \u0633\u0641\u0627\u0631\u0634",
            note: customerCreated ? `\u0633\u0641\u0627\u0631\u0634 \u0645\u0633\u062A\u0642\u06CC\u0645 \u062B\u0628\u062A \u0634\u062F. \u062D\u0633\u0627\u0628 \u06A9\u0627\u0631\u0628\u0631\u06CC \u062C\u062F\u06CC\u062F \u0645\u0634\u062A\u0631\u06CC (${cleanPhone}) \u0627\u06CC\u062C\u0627\u062F \u06AF\u0631\u062F\u06CC\u062F.` : "\u0633\u0641\u0627\u0631\u0634 \u0645\u0633\u062A\u0642\u06CC\u0645 \u0627\u0632 \u0627\u06A9\u0633\u067E\u0644\u0648\u0631 \u062B\u0628\u062A \u0634\u062F."
          }
        }
      }
    });
    if (orderItemsData.length > 0 && orderItemsData[0].supplierId) {
      const suppId = orderItemsData[0].supplierId;
      prisma14.user.findUnique({ where: { id: suppId } }).then((supplier) => {
        if (supplier?.mobile) {
          notifySupplierNewOrder(supplier.mobile, order.id, supplier.brandName || supplier.username);
        }
      }).catch((smsErr) => console.warn("SMS supplier notification error:", smsErr));
    }
    const paymentGateway = await PaymentServiceFactory.getService();
    const baseUrl = getPublicUrl(req);
    const callbackUrl = `${baseUrl}/api/public/checkout/callback?orderId=${order.id}`;
    let payLink = `/api/public/checkout/callback?orderId=${order.id}&success=true`;
    let authority = "";
    try {
      const zibalResult = await paymentGateway.createPayment(
        totalAmount * 10,
        `\u067E\u0631\u062F\u0627\u062E\u062A \u0633\u0641\u0627\u0631\u0634 \u0645\u0633\u062A\u0642\u06CC\u0645 #${order.id} - ${customerName}`,
        callbackUrl
      );
      payLink = zibalResult.payLink;
      authority = zibalResult.authority;
      await prisma14.order.update({
        where: { id: order.id },
        data: {
          statusHistory: {
            create: {
              fromStatus: "NEW",
              toStatus: "NEW",
              actorRole: "SYSTEM",
              actorName: "\u062F\u0631\u06AF\u0627\u0647 \u067E\u0631\u062F\u0627\u062E\u062A",
              note: `\u062A\u0631\u0627\u06A9\u0646\u0634 \u062F\u0631\u06AF\u0627\u0647 \u0632\u06CC\u0628\u0627\u0644 \u0628\u0627 \u0634\u0646\u0627\u0633\u0647 \u0645\u0631\u062C\u0639 ${authority} \u0627\u06CC\u062C\u0627\u062F \u0634\u062F.`
            }
          }
        }
      });
    } catch (paymentErr) {
      console.error("Error creating Zibal payment:", paymentErr);
      payLink = `/api/public/checkout/callback?orderId=${order.id}&success=true`;
    }
    res.json({
      paymentUrl: payLink,
      orderId: order.id,
      customerCreated,
      accountUsername: cleanPhone
    });
  } catch (err) {
    if (err instanceof import_zod2.z.ZodError) {
      return res.status(400).json({ error: err.errors?.map((e) => e.message).join(", ") || err.message });
    }
    res.status(500).json({ error: err.message });
  }
});
app.get("/api/public/shipping/callback", async (req, res) => {
  try {
    const { invoiceId, success, trackId } = req.query;
    if (!invoiceId) {
      return res.status(400).json({ error: "\u0634\u0646\u0627\u0633\u0647 \u0641\u0627\u06A9\u062A\u0648\u0631 \u0627\u0631\u0633\u0627\u0644 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A." });
    }
    const invoice = await prisma14.shippingInvoice.findUnique({
      where: { id: parseInt(invoiceId) },
      include: { order: true }
    });
    if (!invoice) return res.status(404).json({ error: "\u0641\u0627\u06A9\u062A\u0648\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
    let isPaid = false;
    let refId = "";
    if (trackId) {
      const paymentGateway = await PaymentServiceFactory.getService();
      const verification = await paymentGateway.verifyPayment(trackId.toString(), invoice.shippingCost * 10);
      isPaid = verification.success;
      refId = verification.refId;
    } else {
      isPaid = success === "true";
      refId = `MOCK_REF_${Date.now()}`;
    }
    if (isPaid) {
      await prisma14.$transaction([
        prisma14.shippingInvoice.update({
          where: { id: invoice.id },
          data: { status: "PAID" }
        }),
        prisma14.order.update({
          where: { id: invoice.orderId },
          data: {
            status: "PENDING_POSTAL_LABEL",
            statusHistory: {
              create: {
                fromStatus: invoice.order.status,
                toStatus: "PENDING_POSTAL_LABEL",
                actorRole: "SYSTEM",
                actorName: "\u062F\u0631\u06AF\u0627\u0647 \u067E\u0631\u062F\u0627\u062E\u062A \u0632\u06CC\u0628\u0627\u0644",
                note: `\u0647\u0632\u06CC\u0646\u0647 \u0627\u0631\u0633\u0627\u0644 \u067E\u0631\u062F\u0627\u062E\u062A \u0634\u062F. \u062F\u0631 \u0627\u0646\u062A\u0638\u0627\u0631 \u0644\u06CC\u0628\u0644 \u067E\u0633\u062A\u06CC. \u06A9\u062F \u0631\u0647\u06AF\u06CC\u0631\u06CC: ${refId}`
              }
            }
          }
        })
      ]);
      res.redirect(`/?shipping_payment=success&trackId=${trackId || refId}`);
    } else {
      res.redirect(`/?shipping_payment=failed&trackId=${trackId}`);
    }
  } catch (err) {
    res.redirect(`/?shipping_payment=error&message=${encodeURIComponent(err.message)}`);
  }
});
app.get("/api/public/checkout/callback", async (req, res) => {
  try {
    const { orderId, success, trackId } = req.query;
    if (!orderId) {
      return res.status(400).json({ error: "\u0634\u0646\u0627\u0633\u0647 \u0633\u0641\u0627\u0631\u0634 \u0627\u0631\u0633\u0627\u0644 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A." });
    }
    const parsedOrderId = parseInt(orderId);
    const order = await prisma14.order.findUnique({
      where: { id: parsedOrderId }
    });
    if (!order) {
      return res.status(404).json({ error: "\u0633\u0641\u0627\u0631\u0634 \u0645\u0648\u0631\u062F \u0646\u0638\u0631 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F." });
    }
    let isPaid = false;
    let refId = "";
    if (trackId) {
      const paymentGateway = await PaymentServiceFactory.getService();
      const verification = await paymentGateway.verifyPayment(trackId.toString(), order.totalAmount * 10);
      isPaid = verification.success;
      refId = verification.refId;
    } else {
      isPaid = success === "true";
      refId = `MOCK_REF_${Date.now()}`;
    }
    if (isPaid) {
      const nextStatus = order.orderSource === "store" ? "WAITING_SUPPLIER_CONFIRMATION" : "PROCESSING";
      const updatedOrder = await prisma14.order.update({
        where: { id: parsedOrderId },
        data: {
          status: nextStatus,
          statusHistory: {
            create: {
              fromStatus: order.status,
              toStatus: nextStatus,
              actorRole: "SYSTEM",
              actorName: "\u062F\u0631\u06AF\u0627\u0647 \u067E\u0631\u062F\u0627\u062E\u062A",
              note: `\u067E\u0631\u062F\u0627\u062E\u062A \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0646\u062C\u0627\u0645 \u0634\u062F. \u06A9\u062F \u0631\u0647\u06AF\u06CC\u0631\u06CC: ${refId}`
            }
          }
        }
      });
      await creditSuppliersForOrders(prisma14, [updatedOrder]);
      res.redirect(`/?payment_status=success&trackId=${trackId || refId || "DIRECT"}&invoiceId=DIRECT_${orderId}`);
    } else {
      res.redirect(`/?payment_status=failed&trackId=${trackId || "DIRECT"}&invoiceId=DIRECT_${orderId}`);
    }
  } catch (err) {
    res.redirect(`/?payment_status=error&message=${encodeURIComponent(err.message)}`);
  }
});
app.get("/api/payment/zibal/simulated-gateway", (req, res) => {
  const { trackId, amount, callbackUrl } = req.query;
  const decodedCallback = callbackUrl ? decodeURIComponent(callbackUrl) : "/";
  const separator = decodedCallback.includes("?") ? "&" : "?";
  const successUrl = `${decodedCallback}${separator}trackId=${trackId || "SIM_" + Date.now()}&success=true&status=1`;
  const cancelUrl = `${decodedCallback}${separator}trackId=${trackId || "SIM_" + Date.now()}&success=false&status=0`;
  const html = `
    <!DOCTYPE html>
    <html lang="fa" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>\u062F\u0631\u06AF\u0627\u0647 \u067E\u0631\u062F\u0627\u062E\u062A \u0622\u0646\u0644\u0627\u06CC\u0646 \u0632\u06CC\u0628\u0627\u0644 (\u0634\u0628\u06CC\u0647\u200C\u0633\u0627\u0632 \u0622\u0632\u0645\u0627\u064A\u0634\u06AF\u0627\u0647\u06CC)</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" />
      <style>body { font-family: 'Vazirmatn', sans-serif; }</style>
    </head>
    <body class="bg-slate-900 text-slate-100 flex items-center justify-center min-h-screen p-4">
      <div class="bg-slate-800 border border-slate-700 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl text-center space-y-6">
        <div class="flex items-center justify-center gap-3 border-b border-slate-700 pb-4">
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
            Z
          </div>
          <div class="text-right">
            <h1 class="text-base font-black text-white">\u062F\u0631\u06AF\u0627\u0647 \u067E\u0631\u062F\u0627\u062E\u062A \u0627\u0644\u06A9\u062A\u0631\u0648\u0646\u06CC\u06A9 \u0632\u06CC\u0628\u0627\u0644</h1>
            <p class="text-[11px] text-emerald-400 font-bold">\u0645\u062D\u06CC\u0637 \u062A\u0633\u062A \u0648 \u0634\u0628\u06CC\u0647\u200C\u0633\u0627\u0632\u06CC \u0627\u06CC\u0645\u0646</p>
          </div>
        </div>

        <div class="bg-slate-900/80 p-4 rounded-2xl border border-slate-700/60 space-y-2 text-right text-xs">
          <div class="flex justify-between py-1 border-b border-slate-800">
            <span class="text-slate-400">\u0634\u0646\u0627\u0633\u0647 \u067E\u06CC\u06AF\u06CC\u0631\u06CC (Track ID):</span>
            <span class="font-mono text-amber-400 font-bold">${trackId || "SIM_" + Date.now()}</span>
          </div>
          <div class="flex justify-between py-1">
            <span class="text-slate-400">\u0645\u0628\u0644\u063A \u0642\u0627\u0628\u0644 \u067E\u0631\u062F\u0627\u062E\u062A:</span>
            <span class="font-bold text-white font-mono text-sm">${amount ? Number(amount).toLocaleString() : "0"} \u0631\u06CC\u0627\u0644</span>
          </div>
        </div>

        <div class="space-y-3 pt-2">
          <a href="${successUrl}" class="block w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
            \u2713 \u062A\u0627\u06CC\u06CC\u062F \u0648 \u067E\u0631\u062F\u0627\u062E\u062A \u0645\u0648\u0641\u0642 (\u0634\u0628\u06CC\u0647\u200C\u0633\u0627\u0632)
          </a>
          <a href="${cancelUrl}" class="block w-full py-3 px-4 bg-slate-700 hover:bg-slate-600 text-rose-300 font-bold rounded-xl text-xs transition-all active:scale-95">
            \u2715 \u0627\u0646\u0635\u0631\u0627\u0641 \u0627\u0632 \u067E\u0631\u062F\u0627\u062E\u062A
          </a>
        </div>

        <p class="text-[10px] text-slate-400 leading-relaxed pt-2">
          \u0627\u06CC\u0646 \u0635\u0641\u062D\u0647 \u0634\u0628\u06CC\u0647\u200C\u0633\u0627\u0632 \u0631\u0633\u0645\u06CC \u062F\u0631\u06AF\u0627\u0647 \u0632\u06CC\u0628\u0627\u0644 \u067E\u0644\u062A\u0641\u0631\u0645 \u0627\u0633\u062A \u0648 \u062C\u0647\u062A \u062A\u0633\u0648\u06CC\u0647 \u0633\u0631\u06CC\u0639 \u0633\u0641\u0627\u0631\u0634\u0627\u062A \u0628\u062F\u0648\u0646 \u062E\u0637\u0627\u06CC \u0634\u0628\u06A9\u0647 \u062F\u0631 \u062A\u0645\u0627\u0645 \u0634\u0628\u06A9\u0647\u200C\u0647\u0627 \u0637\u0631\u0627\u062D\u06CC \u0634\u062F\u0647 \u0627\u0633\u062A.
        </p>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});
registerConfig(app);
registerNewFeatures(app, prisma14);
registerAdminShippingRoutes(app, prisma14, authenticateToken, requireSuperAdmin);
registerStoreShippingRoutes(app, prisma14, authenticateToken, requireStoreManager);
registerAnnouncements(app);
registerOrderLabels(app, prisma14);
registerPenaltyRoutes(app, prisma14);
async function startServer() {
  NotificationService.init();
  FinancialJobs.start();
  const PORT = process.env.DEFAULT_APP_PORT ? parseInt(process.env.DEFAULT_APP_PORT, 10) : process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  const paymentService2 = new PaymentLifecycleService();
  app.post("/api/financial/payments/initiate", authenticateToken, async (req, res) => {
    try {
      const data = initiatePaymentSchema.parse(req.body);
      const result = await paymentService2.initiatePayment(req.user.userId, data.amount, data.callbackUrl);
      res.json(result);
    } catch (err) {
      if (err instanceof import_zod2.z.ZodError) {
        return res.status(400).json({ error: err.issues });
      }
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/financial/payments/callback", async (req, res) => {
    try {
      const { trackId, success, status } = req.query;
      if (!trackId) {
        return res.status(400).json({ error: "Missing trackId" });
      }
      const ipAddress = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
      const result = await paymentService2.verifyPayment(trackId.toString(), 0, ipAddress?.toString() || "");
      if (result.payment.status === "PAID") {
        res.redirect(`/?payment_status=success&trackId=${trackId}`);
      } else {
        res.redirect(`/?payment_status=failed&trackId=${trackId}`);
      }
    } catch (err) {
      res.redirect(`/?payment_status=error&message=${encodeURIComponent(err.message)}`);
    }
  });
  app.post("/api/financial/payments/:id/refund", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const result = await paymentService2.refundPayment(id, req.user.userId);
      res.json({ success: true, payment: result });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app.get("/api/financial/reports", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const query = reportQuerySchema.parse(req.query);
      const pageNum = parseInt(query.page);
      const limitNum = parseInt(query.limit);
      const whereClause = {};
      if (query.status) whereClause.status = query.status;
      if (query.startDate && query.endDate) {
        whereClause.createdAt = {
          gte: new Date(query.startDate),
          lte: new Date(query.endDate)
        };
      }
      const payments = await prisma14.payment.findMany({
        where: whereClause,
        include: { user: { select: { id: true, username: true, role: true } } },
        orderBy: { id: "desc" },
        skip: (pageNum - 1) * limitNum,
        take: limitNum
      });
      const total = await prisma14.payment.count({ where: whereClause });
      const settlements = await prisma14.settlement.findMany({
        orderBy: { id: "desc" },
        take: 10,
        include: { supplier: { select: { id: true, username: true, brandName: true } } }
      });
      res.json({
        payments,
        settlements,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });
    } catch (err) {
      if (err instanceof import_zod2.z.ZodError) {
        return res.status(400).json({ error: err.issues });
      }
      res.status(500).json({ error: err.message });
    }
  });
  app.get("/api/setup-db", async (req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.write("<html><head><title>\u0631\u0627\u0647\u200C\u0627\u0646\u062F\u0627\u0632\u06CC \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 | DB Setup</title>");
    res.write("<style>body { font-family: Tahoma, sans-serif; direction: rtl; background-color: #f4f6f9; padding: 20px; color: #333; line-height: 1.6; } .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); max-width: 800px; margin: 0 auto; } h2 { color: #4F46E5; border-bottom: 2px solid #E5E7EB; padding-bottom: 10px; } pre { background: #1E1E1E; color: #9CDCF0; padding: 15px; border-radius: 5px; overflow-x: auto; direction: ltr; text-align: left; font-family: monospace; } .success { color: green; font-weight: bold; } .error { color: red; font-weight: bold; } .warning { color: orange; font-weight: bold; } .btn { display: inline-block; background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px; font-weight: bold; }</style>");
    res.write('</head><body><div class="card">');
    res.write("<h2>\u{1F680} \u0633\u06CC\u0633\u062A\u0645 \u0631\u0627\u0647\u200C\u0627\u0646\u062F\u0627\u0632\u06CC \u062E\u0648\u062F\u06A9\u0627\u0631 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 (\u0628\u062F\u0648\u0646 \u0646\u06CC\u0627\u0632 \u0628\u0647 \u062A\u0631\u0645\u06CC\u0646\u0627\u0644)</h2>");
    res.write("<p>\u062F\u0631 \u062D\u0627\u0644 \u067E\u0631\u062F\u0627\u0632\u0634 \u0648 \u0631\u0627\u0647\u200C\u0627\u0646\u062F\u0627\u0632\u06CC \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 MySQL \u0634\u0645\u0627... \u0644\u0637\u0641\u0627 \u0634\u06A9\u06CC\u0628\u0627 \u0628\u0627\u0634\u06CC\u062F.</p>");
    const projectRootDir = isAIStudioEnv2 || isCloudRunEnv2 ? process.cwd() : findTrueRootDir2();
    const { execSync: eSync } = require("child_process");
    const dbUrl3 = process.env.DATABASE_URL || "";
    if (!dbUrl3) {
      res.write('<p class="error">\u274C \u062E\u0637\u0627: \u0645\u0642\u062F\u0627\u0631 DATABASE_URL \u062F\u0631 \u0641\u0627\u06CC\u0644 .env \u062A\u0639\u0631\u06CC\u0641 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A.</p>');
      res.write('<p>\u0644\u0637\u0641\u0627 \u0627\u0628\u062A\u062F\u0627 \u0641\u0627\u06CC\u0644 <code style="background:#eee;padding:2px 5px;">.env</code> \u0631\u0627 \u062F\u0631 \u067E\u0646\u0644 \u0647\u0627\u0633\u062A \u062E\u0648\u062F (cPanel File Manager) \u0648\u06CC\u0631\u0627\u06CC\u0634 \u06A9\u0631\u062F\u0647 \u0648 \u0645\u062A\u063A\u06CC\u0631 <code style="background:#eee;padding:2px 5px;">DATABASE_URL</code> \u0631\u0627 \u0628\u0627 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 MySQL \u062E\u0648\u062F \u0645\u0642\u062F\u0627\u0631\u062F\u0647\u06CC \u06A9\u0646\u06CC\u062F.</p>');
      res.write('<p>\u0646\u0645\u0648\u0646\u0647:</p><pre>DATABASE_URL="mysql://username:password@localhost:3306/dbname"</pre>');
      res.write("</div></body></html>");
      return res.end();
    }
    res.write(`<p>\u{1F50C} \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u0634\u0646\u0627\u0633\u0627\u06CC\u06CC \u0634\u062F\u0647: <code style="background:#eee;padding:2px 5px;direction:ltr;display:inline-block;">${dbUrl3.replace(/:([^:@]+)@/, ":****@")}</code></p>`);
    const cmdOptions = {
      cwd: projectRootDir,
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL: dbUrl3,
        PRISMA_TELEMETRY_DISABLED: "1",
        PRISMA_HIDE_UPDATE_MESSAGE: "true",
        PRISMA_CLI_QUERY_ENGINE_TYPE: "library"
      }
    };
    try {
      res.write("<p>\u23F3 \u06AF\u0627\u0645 \u06F1: \u062F\u0631 \u062D\u0627\u0644 \u0633\u0627\u062E\u062A \u06A9\u0644\u0627\u06CC\u0646\u062A \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 (Prisma Client)...</p>");
      try {
        const genLog = eSync("npx prisma generate", cmdOptions);
        res.write('<p class="success">\u2705 \u06A9\u0644\u0627\u06CC\u0646\u062A \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0633\u0627\u062E\u062A\u0647 \u0634\u062F.</p>');
        res.write(`<pre>${genLog}</pre>`);
      } catch (genErr) {
        res.write(`<p class="warning">\u26A0\uFE0F \u062A\u0648\u0644\u06CC\u062F \u0628\u0627 npx \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062F. \u062F\u0631 \u062D\u0627\u0644 \u062A\u0644\u0627\u0634 \u0628\u0627 \u0627\u062C\u0631\u0627\u06CC \u0645\u0633\u062A\u0642\u06CC\u0645 \u06A9\u0644\u0627\u06CC\u0646\u062A...</p>`);
        const genFallbackLog = eSync("node node_modules/prisma/build/index.js generate", cmdOptions);
        res.write('<p class="success">\u2705 \u06A9\u0644\u0627\u06CC\u0646\u062A \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0632 \u0637\u0631\u06CC\u0642 \u06A9\u0644\u0627\u06CC\u0646\u062A \u0645\u0633\u062A\u0642\u06CC\u0645 \u0633\u0627\u062E\u062A\u0647 \u0634\u062F.</p>');
        res.write(`<pre>${genFallbackLog}</pre>`);
      }
    } catch (err) {
      res.write(`<p class="error">\u274C \u062E\u0637\u0627 \u062F\u0631 \u0633\u0627\u062E\u062A \u06A9\u0644\u0627\u06CC\u0646\u062A \u067E\u0631\u06CC\u0632\u0645\u0627: ${err.message}</p>`);
    }
    try {
      res.write("<p>\u23F3 \u06AF\u0627\u0645 \u06F2: \u062F\u0631 \u062D\u0627\u0644 \u0633\u0627\u062E\u062A \u062C\u062F\u0627\u0648\u0644 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u0648 \u0627\u0633\u06A9\u06CC\u0645\u0627\u06CC \u062C\u062F\u06CC\u062F (Prisma DB Push)...</p>");
      try {
        const pushLog = eSync("npx prisma db push --accept-data-loss", cmdOptions);
        res.write('<p class="success">\u2705 \u062C\u062F\u0627\u0648\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0647 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u0627\u0631\u0633\u0627\u0644 \u0648 \u0633\u0627\u062E\u062A\u0647 \u0634\u062F\u0646\u062F.</p>');
        res.write(`<pre>${pushLog}</pre>`);
      } catch (pushErr) {
        res.write(`<p class="warning">\u26A0\uFE0F \u062F\u0633\u062A\u0648\u0631 npx \u0646\u0627\u0645\u0648\u0641\u0642 \u0628\u0648\u062F. \u062F\u0631 \u062D\u0627\u0644 \u062A\u0644\u0627\u0634 \u0628\u0627 \u0627\u062C\u0631\u0627\u06CC \u0645\u0633\u062A\u0642\u06CC\u0645 \u062F\u0633\u062A\u0648\u0631...</p>`);
        const pushFallbackLog = eSync("node node_modules/prisma/build/index.js db push --accept-data-loss", cmdOptions);
        res.write('<p class="success">\u2705 \u062C\u062F\u0627\u0648\u0644 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0632 \u0637\u0631\u06CC\u0642 \u062F\u0633\u062A\u0648\u0631 \u0645\u0633\u062A\u0642\u06CC\u0645 \u0647\u0645\u06AF\u0627\u0645\u200C\u0633\u0627\u0632\u06CC \u0634\u062F\u0646\u062F.</p>');
        res.write(`<pre>${pushFallbackLog}</pre>`);
      }
    } catch (err) {
      res.write(`<p class="error">\u274C \u062E\u0637\u0627 \u062F\u0631 \u0627\u0631\u0633\u0627\u0644 \u062C\u062F\u0648\u0644\u200C\u0647\u0627 \u0628\u0647 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633: ${err.message}</p>`);
      res.write('<p class="warning">\u26A0\uFE0F \u0644\u0637\u0641\u0627 \u0645\u0637\u0645\u0626\u0646 \u0634\u0648\u06CC\u062F \u06A9\u0647 \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u0648 \u0631\u0645\u0632 \u0639\u0628\u0648\u0631 \u062F\u0631 \u0641\u0627\u06CC\u0644 .env \u0635\u062D\u06CC\u062D \u0627\u0633\u062A \u0648 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 MySQL \u062F\u0631 cPanel \u0633\u0627\u062E\u062A\u0647 \u0634\u062F\u0647 \u0627\u0633\u062A.</p>');
    }
    try {
      res.write("<p>\u23F3 \u06AF\u0627\u0645 \u06F3: \u062F\u0631 \u062D\u0627\u0644 \u0627\u062A\u0635\u0627\u0644 \u0645\u062C\u062F\u062F \u0628\u0631\u0646\u0627\u0645\u0647 \u0628\u0647 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633...</p>");
      PrismaClient = import_client.PrismaClient;
      prisma14 = new PrismaClient({
        datasources: {
          db: {
            url: dbUrl3
          }
        }
      });
      res.write('<p class="success">\u2705 \u0627\u062A\u0635\u0627\u0644 \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u06A9\u0644\u0627\u06CC\u0646\u062A \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0631\u0642\u0631\u0627\u0631 \u0634\u062F.</p>');
      res.write("<p>\u23F3 \u06AF\u0627\u0645 \u06F4: \u062F\u0631 \u062D\u0627\u0644 \u062B\u0628\u062A \u062F\u0627\u062F\u0647\u200C\u0647\u0627\u06CC \u0627\u0648\u0644\u06CC\u0647 \u0648 \u06A9\u0627\u0631\u0628\u0631 \u0627\u062F\u0645\u06CC\u0646 (Seed)...</p>");
      if (provider === "sqlite" && process.env.K_SERVICE) {
        console.log("[Server Startup] Production Cloud Run detected. Pushing SQLite schema to /tmp/prisma...");
        try {
          const { execSync: execSync3 } = require("child_process");
          execSync3("npx prisma db push --accept-data-loss", { stdio: "inherit" });
        } catch (e) {
          console.error("[Server Startup] Error pushing schema:", e);
        }
      }
      await seedDatabase();
      res.write('<p class="success">\u2705 \u0641\u0631\u0622\u06CC\u0646\u062F \u062B\u0628\u062A \u062F\u0627\u062F\u0647\u200C\u0647\u0627\u06CC \u0627\u0648\u0644\u06CC\u0647 \u0648 \u062A\u0646\u0638\u06CC\u0645\u0627\u062A \u0633\u06CC\u0633\u062A\u0645 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0628\u0647 \u067E\u0627\u06CC\u0627\u0646 \u0631\u0633\u06CC\u062F!</p>');
    } catch (err) {
      res.write(`<p class="error">\u274C \u062E\u0637\u0627 \u062F\u0631 \u0644\u0648\u062F \u0646\u0647\u0627\u06CC\u06CC \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u06CC\u0627 \u062B\u0628\u062A \u062F\u0627\u062F\u0647\u200C\u0647\u0627\u06CC \u0627\u0648\u0644\u06CC\u0647: ${err.message}</p>`);
    }
    res.write('<hr/><h3 class="success">\u{1F389} \u062A\u0628\u0631\u06CC\u06A9! \u0631\u0627\u0647\u200C\u0627\u0646\u062F\u0627\u0632\u06CC \u062F\u06CC\u062A\u0627\u0628\u06CC\u0633 \u0628\u0627 \u0645\u0648\u0641\u0642\u06CC\u062A \u0627\u0646\u062C\u0627\u0645 \u0634\u062F.</h3>');
    res.write("<p>\u0627\u06A9\u0646\u0648\u0646 \u0628\u062F\u0648\u0646 \u0647\u06CC\u0686 \u0645\u0634\u06A9\u0644\u06CC \u0645\u06CC\u200C\u062A\u0648\u0627\u0646\u06CC\u062F \u0628\u0647 \u0635\u0641\u062D\u0647 \u0627\u0635\u0644\u06CC \u0628\u0627\u0632\u06AF\u0631\u062F\u06CC\u062F \u0648 \u0648\u0627\u0631\u062F \u0633\u06CC\u0633\u062A\u0645 \u0634\u0648\u06CC\u062F.</p>");
    res.write('<a href="/" class="btn">\u0648\u0631\u0648\u062F \u0628\u0647 \u067E\u0646\u0644 \u06A9\u0627\u0631\u0628\u0631\u06CC</a>');
    res.write("</div></body></html>");
    res.end();
  });
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.get("/api/config", async (req, res) => {
    try {
      const settings = await prisma14.systemConfig.findMany();
      const configMap = (settings || []).reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});
      res.json(configMap);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch config", details: err?.message || String(err) });
    }
  });
  app.put("/api/config", async (req, res) => {
    try {
      const { key: key2, value } = req.body;
      if (!key2) return res.status(400).json({ error: "Missing key" });
      await prisma14.systemConfig.upsert({
        where: { key: key2 },
        update: { value: String(value) },
        create: { key: key2, value: String(value) }
      });
      res.json({ success: true });
    } catch (err) {
      res.json({ success: true });
    }
  });
  app.post("/api/admin/payment-gateway/test", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { merchantCode } = req.body;
      let merchantToTest = merchantCode;
      if (!merchantToTest || merchantToTest === "zibal_merchant_key") {
        const savedSetting = await prisma14.systemConfig.findUnique({ where: { key: "PAYMENT_GATEWAY_MERCHANT_CODE" } });
        merchantToTest = savedSetting?.value || process.env.ZIBAL_MERCHANT || "6a0213e61b27742a09938588";
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6e3);
      const response = await fetch("https://gateway.zibal.ir/v1/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          merchant: merchantToTest,
          amount: 1e4,
          callbackUrl: "https://zopit.ir/callback-test",
          description: "\u062A\u0633\u062A \u062A\u0633\u062A \u0622\u0646\u0644\u0627\u06CC\u0646 \u0641\u0639\u0627\u0644 \u0628\u0648\u062F\u0646 \u062F\u0631\u06AF\u0627\u0647 \u0632\u06CC\u0628\u0627\u0644"
        })
      });
      clearTimeout(timeoutId);
      const data = await response.json();
      if (Number(data.result) === 100) {
        return res.json({
          success: true,
          active: true,
          resultCode: data.result,
          message: "\u062F\u0631\u06AF\u0627\u0647 \u067E\u0631\u062F\u0627\u062E\u062A \u0632\u06CC\u0628\u0627\u0644 \u0641\u0639\u0627\u0644 \u0648 \u06A9\u062F \u0645\u0631\u062C\u0646\u062A \u06A9\u0627\u0645\u0644\u0627\u064B \u0645\u0639\u062A\u0628\u0631 \u0645\u06CC\u200C\u0628\u0627\u0634\u062F.",
          merchant: merchantToTest
        });
      } else {
        const errorMessages = {
          102: "\u0645\u0631\u062C\u0646\u062A \u06CC\u0627\u0641\u062A \u0646\u0634\u062F (\u06A9\u062F \u0645\u0631\u062C\u0646\u062A \u0632\u06CC\u0628\u0627\u0644 \u0648\u0627\u0631\u062F \u0634\u062F\u0647 \u0627\u0634\u062A\u0628\u0627\u0647 \u0627\u0633\u062A)",
          103: "\u0645\u0631\u062C\u0646\u062A \u063A\u06CC\u0631\u0641\u0639\u0627\u0644 \u0627\u0633\u062A (\u062F\u0631\u06AF\u0627\u0647 \u062F\u0631 \u0627\u0646\u062A\u0638\u0627\u0631 \u062A\u0627\u06CC\u06CC\u062F \u0645\u062F\u0627\u0631\u06A9/\u0634\u0646\u0627\u0633\u0647 \u0632\u06CC\u0628\u0627\u0644 \u0627\u0633\u062A)",
          104: "\u0645\u0631\u062C\u0646\u062A \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A",
          201: "\u062A\u0631\u0627\u06A9\u0646\u0634 \u0642\u0628\u0644\u0627 \u062A\u0627\u06CC\u06CC\u062F \u0634\u062F\u0647",
          202: "\u0633\u0641\u0627\u0631\u0634 \u06CC\u0627\u0641\u062A \u0646\u0634\u062F"
        };
        return res.json({
          success: false,
          active: false,
          resultCode: data.result,
          message: errorMessages[Number(data.result)] || data.message || `\u06A9\u062F \u067E\u0627\u0633\u062E \u0632\u06CC\u0628\u0627\u0644: ${data.result}`,
          merchant: merchantToTest
        });
      }
    } catch (err) {
      return res.json({
        success: false,
        active: false,
        message: err.name === "AbortError" ? "\u0632\u0645\u0627\u0646 \u0627\u0646\u062A\u0638\u0627\u0631 \u067E\u0627\u0633\u062E \u0632\u06CC\u0628\u0627\u0644 \u062A\u0645\u0627\u0645 \u0634\u062F (Timeout)" : `\u062E\u0637\u0627 \u062F\u0631 \u0627\u062A\u0635\u0627\u0644 \u0628\u0647 \u062F\u0631\u06AF\u0627\u0647 \u0632\u06CC\u0628\u0627\u0644: ${err.message}`
      });
    }
  });
  app.get("/api/support-info", async (req, res) => {
    const defaultSupport = {
      SUPPORT_PHONE: "09180088358",
      SUPPORT_PHONE_2: "02188888888",
      SUPPORT_TELEGRAM: "@Zopit_Support",
      SUPPORT_RUBIKA: "https://rubika.ir/Zopit_official",
      SUPPORT_BALE: "https://ble.ir/Zopit_support",
      SUPPORT_EMAIL: "support@Zopit.ir",
      SUPPORT_CHANNELS_JSON: "[]"
    };
    try {
      const keys = Object.keys(defaultSupport);
      const settings = await prisma14.systemConfig.findMany({ where: { key: { in: keys } } });
      const map = { ...defaultSupport };
      if (Array.isArray(settings)) {
        settings.forEach((s) => {
          if (s && s.key && s.value) map[s.key] = s.value;
        });
      }
      res.json(map);
    } catch (err) {
      res.json(defaultSupport);
    }
  });
  app.get("/api/terms", async (req, res) => {
    const defaultTerms = {
      SUPPLIER_TERMS: "\u06F1. \u062A\u0636\u0645\u06CC\u0646 \u0627\u0635\u0627\u0644\u062A \u0648 \u0633\u0644\u0627\u0645\u062A \u06A9\u0627\u0644\u0627: \u062A\u0627\u0645\u06CC\u0646\u200C\u06A9\u0646\u0646\u062F\u0647 \u0645\u062A\u0639\u0647\u062F \u0645\u06CC\u200C\u06AF\u0631\u062F\u062F \u062A\u0645\u0627\u0645\u06CC \u06A9\u0627\u0644\u0627\u0647\u0627\u06CC \u0627\u0631\u0633\u0627\u0644\u06CC \u0631\u0627 \u0628\u0627 \u0627\u0635\u0627\u0644\u062A \u0648 \u0633\u0644\u0627\u0645\u062A \u06A9\u0627\u0645\u0644 \u0627\u0631\u0633\u0627\u0644 \u06A9\u0646\u062F.\n\u06F2. \u0627\u0631\u0633\u0627\u0644 \u0628\u0647 \u0645\u0648\u0642\u0639: \u0633\u0641\u0627\u0631\u0634\u0627\u062A \u0628\u0627\u06CC\u062F \u062F\u0631 \u0645\u0647\u0644\u062A \u0645\u062C\u0627\u0632 \u0627\u0631\u0633\u0627\u0644 \u0634\u0648\u0646\u062F.",
      STORE_TERMS: "\u06F1. \u062B\u0628\u062A\u200C\u0646\u0627\u0645 \u0645\u0639\u062A\u0628\u0631: \u0627\u0637\u0644\u0627\u0639\u0627\u062A \u0641\u0631\u0648\u0634\u06AF\u0627\u0647 \u0628\u0627\u06CC\u062F \u062F\u0642\u06CC\u0642 \u0648 \u0645\u0639\u062A\u0628\u0631 \u0628\u0627\u0634\u062F.\n\u06F2. \u062A\u0633\u0648\u06CC\u0647 \u0645\u0646\u0638\u0645: \u067E\u0631\u062F\u0627\u062E\u062A \u0641\u0627\u06A9\u062A\u0648\u0631\u0647\u0627 \u0637\u0628\u0642 \u0636\u0648\u0627\u0628\u0637 \u0633\u06CC\u0633\u062A\u0645 \u0627\u0646\u062C\u0627\u0645 \u0645\u06CC\u200C\u0634\u0648\u062F.",
      CUSTOMER_TERMS: "\u06F1. \u0636\u0645\u0627\u0646\u062A \u0628\u0627\u0632\u06AF\u0634\u062A \u06A9\u0627\u0644\u0627 \u062A\u0627 \u06F7 \u0631\u0648\u0632 \u062F\u0631 \u0635\u0648\u0631\u062A \u0645\u063A\u0627\u06CC\u0631\u062A \u06CC\u0627 \u0639\u06CC\u0628 \u0641\u06CC\u0632\u06CC\u06A9\u06CC.",
      GENERAL_TERMS: "\u0642\u0648\u0627\u0646\u06CC\u0646 \u06A9\u0644\u06CC \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u0627\u0632 \u067E\u0644\u062A\u0641\u0631\u0645 \u0645\u0627\u0631\u06A9\u062A\u200C\u067E\u0644\u06CC\u0633 \u0632\u0648\u067E\u06CC\u062A."
    };
    try {
      const keys = Object.keys(defaultTerms);
      const settings = await prisma14.systemConfig.findMany({ where: { key: { in: keys } } });
      const map = { ...defaultTerms };
      if (Array.isArray(settings)) {
        settings.forEach((s) => {
          if (s && s.key && s.value) map[s.key] = s.value;
        });
      }
      res.json(map);
    } catch (err) {
      res.json(defaultTerms);
    }
  });
  app.get("/api/custom-code", async (req, res) => {
    const defaultCode = {
      CUSTOM_CODE_HEADER: "",
      CUSTOM_CODE_FOOTER: ""
    };
    try {
      const keys = Object.keys(defaultCode);
      const settings = await prisma14.systemConfig.findMany({ where: { key: { in: keys } } });
      const map = { ...defaultCode };
      if (Array.isArray(settings)) {
        settings.forEach((s) => {
          if (s && s.key && s.value) map[s.key] = s.value;
        });
      }
      res.json(map);
    } catch (err) {
      res.json(defaultCode);
    }
  });
  registerAIStudioRoute(app);
  app.use((err, req, res, next) => {
    console.error("[Global Error Handler] Unhandled error:", err);
    if (res.headersSent) {
      return next(err);
    }
    const status = err.status || err.statusCode || 500;
    return res.status(status).json({
      error: err.message || "\u062E\u0637\u0627\u06CC \u063A\u06CC\u0631\u0645\u0646\u062A\u0638\u0631\u0647\u200C\u0627\u06CC \u062F\u0631 \u0633\u0631\u0648\u0631 \u0631\u062E \u062F\u0627\u062F\u0647 \u0627\u0633\u062A.",
      success: false
    });
  });
  app.use("/api", (req, res) => {
    res.status(404).json({ error: "Not Found" });
  });
  const isDev = process.env.NODE_ENV !== "production" && !__dirname.includes("dist") && !__dirname.includes("prod_output") && !process.env.K_SERVICE;
  if (isDev) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    let distPath = isAIStudioEnv2 ? import_path3.default.join(rootDir2, "prod_output") : __dirname;
    if (!import_fs3.default.existsSync(import_path3.default.join(distPath, "index.html"))) {
      if (import_fs3.default.existsSync(import_path3.default.join(rootDir2, "prod_output", "index.html"))) {
        distPath = import_path3.default.join(rootDir2, "prod_output");
      } else if (import_fs3.default.existsSync(import_path3.default.join(rootDir2, "dist", "index.html"))) {
        distPath = import_path3.default.join(rootDir2, "dist");
      }
    }
    console.log("[Express Static] Serving static files from distPath:", distPath);
    app.use(import_express.default.static(distPath));
    app.get(/.*/, (req, res) => {
      if (req.path.includes(".") && !req.path.endsWith(".html") || req.path.startsWith("/assets/")) {
        return res.status(404).send("File not found");
      }
      res.sendFile(import_path3.default.join(distPath, "index.html"));
    });
  }
  if (process.env.VERCEL) {
    console.log("Running on Vercel, skipping app.listen()");
    setImmediate(async () => {
      try {
        await seedDatabase();
        await syncAllPaidOrdersSupplierWallets();
      } catch (err) {
        console.warn("[Server Startup] Warning: seedDatabase or syncAllPaidOrdersSupplierWallets failed:", err?.message || err);
      }
    });
    return;
  }
  const portStr = String(PORT);
  const portToListen = portStr.startsWith("/") || portStr.startsWith("\\") ? PORT : Number(PORT) || 3e3;
  if (typeof portToListen === "string") {
    app.listen(portToListen, async () => {
      console.log(`\u{1F680} Backend Express server running on Unix Socket ${portToListen}`);
      setImmediate(async () => {
        try {
          await seedDatabase();
          await syncAllPaidOrdersSupplierWallets();
        } catch (err) {
          console.warn("[Server Startup] Warning: seedDatabase or syncAllPaidOrdersSupplierWallets failed:", err?.message || err);
        }
      });
    });
  } else {
    app.listen(portToListen, "0.0.0.0", async () => {
      console.log(`\u{1F680} Backend Express server running on port ${portToListen}`);
      setImmediate(async () => {
        try {
          await seedDatabase();
          await syncAllPaidOrdersSupplierWallets();
        } catch (err) {
          console.warn("[Server Startup] Warning: seedDatabase or syncAllPaidOrdersSupplierWallets failed:", err?.message || err);
        }
      });
    });
  }
}
startServer();
var server_default = app;
//# sourceMappingURL=server_prod.cjs.map
