import { getPrisma } from '../../prisma.js';
import { notifySupplierNewOrder, sendSmsViaMelliPayamak, sendMelliPayamakPattern } from '../sms/SmsService.js';
import { Decimal } from '@prisma/client/runtime/library';

export interface OrderCallbackItem {
  zopit_sku?: string;
  sku?: string;
  product_sku?: string;
  product_id?: number | string;
  productId?: number | string;
  variant_id?: number | string;
  variantId?: number | string;
  quantity?: number | string;
  qty?: number | string;
  count?: number | string;
  retail_price?: number | string;
  price?: number | string;
}

export interface OrderCallbackCustomer {
  name?: string;
  customer_name?: string;
  full_name?: string;
  phone?: string;
  mobile?: string;
  customer_phone?: string;
  tel?: string;
  province?: string;
  state?: string;
  ostan?: string;
  city?: string;
  shahr?: string;
  address?: string;
  shipping_address?: string;
  street?: string;
  postal_code?: string;
  postalCode?: string;
  zip?: string;
}

export interface OrderCallbackPayload {
  api_key?: string;
  apiKey?: string;
  external_order_id?: string | number;
  woo_order_id?: string | number;
  order_id?: string | number;
  order_number?: string | number;
  customer?: OrderCallbackCustomer;
  // Alternative flat customer fields
  name?: string;
  customer_name?: string;
  phone?: string;
  mobile?: string;
  province?: string;
  city?: string;
  address?: string;
  postal_code?: string;
  postalCode?: string;
  items?: OrderCallbackItem[];
  // Alternative single-item flat fields
  zopit_sku?: string;
  sku?: string;
  product_id?: number | string;
  variant_id?: number | string;
  quantity?: number | string;
  shipping_method?: string;
  shippingMethod?: string;
  notes?: string;
}

export class OrderCallbackService {
  /**
   * Resolves a product and optional variant from SKU or ID
   */
  static async resolveProductAndVariant(item: OrderCallbackItem) {
    const prisma = getPrisma();
    const rawSku = (item.zopit_sku || item.sku || item.product_sku || '').trim();
    const rawProductId = item.product_id || item.productId;
    const rawVariantId = item.variant_id || item.variantId;

    let product: any = null;
    let variant: any = null;

    // 1. Try resolving by explicit variant_id & product_id if provided
    if (rawProductId) {
      const pId = Number(rawProductId);
      if (!isNaN(pId) && pId > 0) {
        product = await prisma.product.findUnique({
          where: { id: pId },
          include: { variants: true, supplier: true }
        });

        if (product && rawVariantId) {
          const vId = Number(rawVariantId);
          if (!isNaN(vId) && vId > 0) {
            variant = product.variants.find((v: any) => v.id === vId) || null;
          }
        }
      }
    }

    // 2. If not found and SKU is provided, search by SKU in ProductVariant and Product
    if (!product && rawSku) {
      // 2.1 Search by exact Variant SKU
      const foundVariant = await prisma.productVariant.findFirst({
        where: {
          OR: [
            { sku: rawSku },
            { sku: { equals: rawSku, mode: 'insensitive' } }
          ]
        },
        include: {
          product: {
            include: { variants: true, supplier: true }
          }
        }
      });

      if (foundVariant) {
        variant = foundVariant;
        product = foundVariant.product;
      }
    }

    if (!product && rawSku) {
      // 2.2 Search by exact Product SKU
      product = await prisma.product.findFirst({
        where: {
          OR: [
            { sku: rawSku },
            { sku: { equals: rawSku, mode: 'insensitive' } }
          ]
        },
        include: { variants: true, supplier: true }
      });
    }

    // 2.3 Parse standard Zopit SKU format (e.g. ZOP-102-5 or ZOP-102 or 102-5)
    if (!product && rawSku) {
      const cleaned = rawSku.replace(/^ZOP-/i, '').trim();
      const parts = cleaned.split('-');
      if (parts.length >= 1) {
        const parsedPId = parseInt(parts[0], 10);
        const parsedVId = parts.length > 1 ? parseInt(parts[1], 10) : null;

        if (!isNaN(parsedPId) && parsedPId > 0) {
          product = await prisma.product.findUnique({
            where: { id: parsedPId },
            include: { variants: true, supplier: true }
          });

          if (product && parsedVId && !isNaN(parsedVId)) {
            variant = product.variants.find((v: any) => v.id === parsedVId) || null;
          }
        }
      }
    }

    return { product, variant };
  }

  /**
   * Core order processing logic with strict wholesale pricing and wallet automation
   */
  static async processOrder(storeManager: any, payload: OrderCallbackPayload) {
    const prisma = getPrisma();

    // 1. Normalize Customer Recipient Info
    const customerObj = payload.customer || {};
    const recipientName = (customerObj.name || customerObj.customer_name || customerObj.full_name || payload.name || payload.customer_name || '').trim();
    const recipientPhone = (customerObj.phone || customerObj.mobile || customerObj.customer_phone || customerObj.tel || payload.phone || payload.mobile || '').trim();
    const recipientProvince = (customerObj.province || customerObj.state || customerObj.ostan || payload.province || '').trim();
    const recipientCity = (customerObj.city || customerObj.shahr || payload.city || '').trim();
    const recipientAddress = (customerObj.address || customerObj.shipping_address || customerObj.street || payload.address || '').trim();
    const recipientPostalCode = (customerObj.postal_code || customerObj.postalCode || customerObj.zip || payload.postal_code || payload.postalCode || '').trim();

    if (!recipientName) {
      return { success: false, statusCode: 400, error: 'نام گیرنده (name) الزامی است.' };
    }
    if (!recipientPhone) {
      return { success: false, statusCode: 400, error: 'شماره تماس گیرنده (phone / mobile) الزامی است.' };
    }
    if (!recipientAddress) {
      return { success: false, statusCode: 400, error: 'آدرس کامل گیرنده (address) الزامی است.' };
    }

    // 2. Normalize Items List
    let rawItems: OrderCallbackItem[] = [];
    if (Array.isArray(payload.items) && payload.items.length > 0) {
      rawItems = payload.items;
    } else if (payload.zopit_sku || payload.sku || payload.product_id) {
      rawItems = [{
        zopit_sku: payload.zopit_sku,
        sku: payload.sku,
        product_id: payload.product_id,
        variant_id: payload.variant_id,
        quantity: payload.quantity
      }];
    }

    if (rawItems.length === 0) {
      return { success: false, statusCode: 400, error: 'هیچ آیتمی در سبد سفارش ارسال نشده است (فیلد items یا zopit_sku الزامی است).' };
    }

    const shippingMethod = (payload.shipping_method || payload.shippingMethod || 'POST').trim();
    const externalOrderId = String(payload.external_order_id || payload.woo_order_id || payload.order_id || payload.order_number || '').trim();

    // 3. Resolve Items & Calculate Zopit Wholesale Price (Strict DB Lookup)
    const resolvedItems: Array<{
      product: any;
      variant: any;
      quantity: number;
      zopit_wholesale_price: number;
      line_wholesale_total: number;
      skuUsed: string;
    }> = [];

    for (const rawItem of rawItems) {
      const qty = Math.max(1, parseInt(String(rawItem.quantity || rawItem.qty || rawItem.count || 1), 10) || 1);
      const { product, variant } = await this.resolveProductAndVariant(rawItem);

      if (!product) {
        const identifier = rawItem.zopit_sku || rawItem.sku || rawItem.product_id || 'نامشخص';
        return {
          success: false,
          statusCode: 404,
          error: `کالایی با شناسه یا بارکد «${identifier}» در بانک اطلاعاتی زوپیت یافت نشد. لطفاً از صحت zopit_sku یا product_id اطمینان حاصل کنید.`
        };
      }

      // STRICT HOLE CLOSURE: Always extract wholesale price registered in Zopit (supplierBasePrice)
      const wholesalePrice = variant ? Number(variant.supplierBasePrice || product.supplierBasePrice || 0) : Number(product.supplierBasePrice || 0);
      const lineTotal = wholesalePrice * qty;

      resolvedItems.push({
        product,
        variant,
        quantity: qty,
        zopit_wholesale_price: wholesalePrice,
        line_wholesale_total: lineTotal,
        skuUsed: (variant?.sku || product.sku || (rawItem.zopit_sku || `ZOP-${product.id}`))
      });
    }

    // 4. Group items by Supplier to support multi-supplier package dispatch
    const itemsBySupplier = new Map<number, typeof resolvedItems>();
    for (const item of resolvedItems) {
      const suppId = item.product.supplierId || 0;
      if (!itemsBySupplier.has(suppId)) {
        itemsBySupplier.set(suppId, []);
      }
      itemsBySupplier.get(suppId)!.push(item);
    }

    // 5. Calculate Approved Zopit Shipping Rates & Total Invoice
    // Default standard post fee is 45,000 Tomans per supplier package
    const shippingFeePerPackage = 45000;
    const packageCount = itemsBySupplier.size;
    const totalShippingFee = shippingFeePerPackage * packageCount;
    const itemsWholesaleTotal = resolvedItems.reduce((sum, item) => sum + item.line_wholesale_total, 0);
    const grandTotalZopitInvoice = itemsWholesaleTotal + totalShippingFee;

    // 6. Inspect Store Manager's Wallet Balance
    let wallet = await prisma.wallet.findUnique({
      where: { supplierId: storeManager.id }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: {
          supplierId: storeManager.id,
          balance: new Decimal(0)
        }
      });
    }

    const currentWalletBalance = parseFloat(wallet.balance.toString());
    const hasSufficientFunds = currentWalletBalance >= grandTotalZopitInvoice;

    // Target status based on wallet funds
    // Condition A: Sufficient Funds -> Instant debit -> 'PROCESSING' (ارسال‌شده به تامین‌کننده)
    // Condition B: Insufficient Funds -> 'PENDING_WALLET_CHARGE' (در انتظار شارژ کیف پول)
    const orderStatus = hasSufficientFunds ? 'PROCESSING' : 'PENDING_WALLET_CHARGE';
    const fullFormattedAddress = [
      recipientProvince,
      recipientCity,
      recipientAddress
    ].filter(Boolean).join(' - ');

    // 7. Atomic Execution inside Prisma Transaction
    const result = await prisma.$transaction(async (tx: any) => {
      let deductedAmount = 0;
      let newWalletBalance = currentWalletBalance;

      // Execute Wallet Debit if funds are sufficient
      if (hasSufficientFunds) {
        deductedAmount = grandTotalZopitInvoice;
        const updatedWallet = await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              decrement: new Decimal(grandTotalZopitInvoice)
            }
          }
        });
        newWalletBalance = parseFloat(updatedWallet.balance.toString());
      }

      const createdOrders: any[] = [];

      for (const [suppId, supplierItems] of itemsBySupplier.entries()) {
        const suppItemsWholesale = supplierItems.reduce((sum, i) => sum + i.line_wholesale_total, 0);
        const orderGrandTotal = suppItemsWholesale + shippingFeePerPackage;

        const orderSourceLabel = externalOrderId 
          ? `سفارش خارجی (#${externalOrderId})` 
          : 'وب‌هوک اختصاصی زوپیت';

        const order = await tx.order.create({
          data: {
            storeId: storeManager.id,
            totalAmount: orderGrandTotal,
            shippingFee: shippingFeePerPackage,
            status: orderStatus,
            shippingAddressType: 'OTHER_ADDRESS',
            shippingAddress: fullFormattedAddress,
            postalCode: recipientPostalCode,
            orderSource: orderSourceLabel,
            customerName: recipientName,
            customerPhone: recipientPhone,
            customerAddress: recipientAddress,
            shippingMethod: shippingMethod,
            items: {
              create: supplierItems.map(item => ({
                supplierId: suppId,
                productId: item.product.id,
                variantId: item.variant ? item.variant.id : null,
                quantity: item.quantity,
                price: item.zopit_wholesale_price,
                supplierPrice: item.zopit_wholesale_price,
                status: hasSufficientFunds ? 'PENDING' : 'WAITING_PAYMENT',
                notes: `ثبت اتوماتیک - بارکد ${item.skuUsed}`
              }))
            }
          },
          include: {
            items: {
              include: { product: true, variant: true }
            }
          }
        });

        // Add Status History Entry
        if (hasSufficientFunds) {
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              fromStatus: 'NEW',
              toStatus: 'PROCESSING',
              actorRole: 'STORE_MANAGER',
              actorName: storeManager.brandName || storeManager.username,
              note: `پرداخت خودکار مبلغ ${orderGrandTotal.toLocaleString('fa-IR')} تومان از کیف پول با موفقیت انجام شد. سفارش با وضعیت «ارسال‌شده به تامین‌کننده» آماده پردازش و الصاق لیبل پستی است.`
            }
          });
        } else {
          await tx.orderStatusHistory.create({
            data: {
              orderId: order.id,
              fromStatus: 'NEW',
              toStatus: 'PENDING_WALLET_CHARGE',
              actorRole: 'SYSTEM',
              actorName: 'زوپیت خودکار',
              note: `موجودی کیف پول مدیر فروشگاه (${currentWalletBalance.toLocaleString('fa-IR')} تومان) کمتر از مبلغ فاکتور زوپیت (${grandTotalZopitInvoice.toLocaleString('fa-IR')} تومان) است. سفارش در وضعیت «در انتظار شارژ کیف پول» ثبت گردید.`
            }
          });
        }

        createdOrders.push(order);
      }

      // Record Ledger Entry if wallet was debited
      if (hasSufficientFunds) {
        const orderIdsStr = createdOrders.map(o => `#${o.id}`).join(', ');
        await tx.ledgerEntry.create({
          data: {
            walletId: wallet.id,
            amount: new Decimal(grandTotalZopitInvoice).negated(),
            type: 'ORDER_PAYMENT',
            status: 'COMPLETED',
            referenceId: String(createdOrders[0].id),
            description: `پرداخت خودکار سفارش شماره [${orderIdsStr}]${externalOrderId ? ` (سفارش خارجی #${externalOrderId})` : ''}`
          }
        });
      }

      return {
        createdOrders,
        deductedAmount,
        newWalletBalance
      };
    });

    // 8. Notifications & SMS Alerts Dispatch
    if (hasSufficientFunds) {
      // A) Notify Suppliers via SMS
      for (const order of result.createdOrders) {
        for (const item of order.items) {
          if (item.supplierId) {
            prisma.user.findUnique({ where: { id: item.supplierId } }).then((supplier) => {
              if (supplier?.mobile) {
                notifySupplierNewOrder(supplier.mobile, order.id, supplier.brandName || supplier.username);
              }
            }).catch(err => console.warn('[OrderCallback] Supplier SMS error:', err));
          }
        }
      }
    } else {
      // B) Send Alert SMS to Store Manager regarding Insufficient Funds
      if (storeManager.mobile) {
        const deficitAmount = grandTotalZopitInvoice - currentWalletBalance;
        const alertMessage = `مدیر محترم ${storeManager.storeName || storeManager.username}، سفارش جدید شماره ${result.createdOrders.map((o: any) => o.id).join(', ')} به مبلغ ${grandTotalZopitInvoice.toLocaleString('fa-IR')} تومان ثبت شد اما به دلیل کسری موجودی کیف پول (${deficitAmount.toLocaleString('fa-IR')} تومان کسری)، در وضعیت «در انتظار شارژ کیف پول» قرار گرفت. لطفاً جهت ارسال سفارش به تامین‌کننده، کیف پول خود را در پنل زوپیت شارژ فرمایید.\nزوپیت: zopit.ir`;

        sendSmsViaMelliPayamak(storeManager.mobile, alertMessage).catch(err => {
          console.warn('[OrderCallback] Store Manager SMS alert error:', err);
        });
      }
    }

    // 9. Structured Response
    const primaryOrder = result.createdOrders[0];
    const isSplit = result.createdOrders.length > 1;

    return {
      success: true,
      statusCode: hasSufficientFunds ? 200 : 202,
      status: hasSufficientFunds ? 'PAID_AND_SENT_TO_SUPPLIER' : 'PENDING_WALLET_CHARGE',
      order_status: orderStatus,
      order_status_fa: hasSufficientFunds ? 'ارسال‌شده به تامین‌کننده' : 'در انتظار شارژ کیف پول',
      is_split: isSplit,
      package_count: result.createdOrders.length,
      zopit_order_id: primaryOrder.id,
      zopit_order_ids: result.createdOrders.map((o: any) => o.id),
      external_order_id: externalOrderId || null,
      pricing: {
        items_wholesale_total: itemsWholesaleTotal,
        shipping_fee_per_package: shippingFeePerPackage,
        package_count: packageCount,
        total_shipping_fee: totalShippingFee,
        grand_total_zopit_invoice: grandTotalZopitInvoice,
        currency: 'TOMAN'
      },
      wallet: {
        sufficient_funds: hasSufficientFunds,
        previous_balance: currentWalletBalance,
        deducted_amount: result.deductedAmount,
        current_balance: result.newWalletBalance,
        required_charge_amount: hasSufficientFunds ? 0 : (grandTotalZopitInvoice - currentWalletBalance)
      },
      message: hasSufficientFunds
        ? `سفارش با موفقیت ثبت، مبلغ ${grandTotalZopitInvoice.toLocaleString('fa-IR')} تومان از کیف پول کسر و سفارش به تأمین‌کننده ارسال گردید.`
        : `سفارش با وضعیت «در انتظار شارژ کیف پول» ثبت شد. مبلغ مورد نیاز جهت آزادسازی سفارش: ${(grandTotalZopitInvoice - currentWalletBalance).toLocaleString('fa-IR')} تومان.`
    };
  }
}
