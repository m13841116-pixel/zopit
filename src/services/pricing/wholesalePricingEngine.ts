/**
 * Zopit Authoritative Wholesale & Bulk Purchase Pricing Engine
 * 
 * Reuses the existing Product Governance Engine & Authoritative Pricing architecture.
 * Implements server-authoritative quantity-based tier pricing, validation, margin protection,
 * multi-store isolation, and immutable order snapshot generation.
 */

export interface WholesaleTier {
  id?: number;
  productId?: number;
  minQuantity: number;
  maxQuantity?: number | null;
  unitPrice: number;
}

export interface AuthoritativeWholesaleCalculationResult {
  quantity: number;
  supplierBasePrice: number;
  supplierUnitPrice: number;
  applicableTier: {
    id?: number;
    minQuantity: number;
    maxQuantity: number | null;
    unitPrice: number;
  } | null;
  isWholesaleTierApplied: boolean;
  wholesaleDiscountPercentage: number;
  zopitMarginType: string;
  zopitMarginValue: number;
  zopitProfitPerUnit: number;
  zopitTotalProfit: number;
  storeAcquisitionUnitPrice: number; // "قیمت همکاری"
  storeAcquisitionTotalPrice: number;
  suggestedRetailUnitPrice: number;
  totalSupplierAmount: number;
  variantId?: number | null;
  sku?: string;
  calculatedAt: string;
}

/**
 * Server-authoritative final price calculation incorporating Zopit Governance margin
 */
export function calculateAuthoritativeFinalPrice(
  supplierBasePrice: number,
  marginType: string,
  marginValue: number
): number {
  const base = Math.max(0, typeof supplierBasePrice === 'number' ? supplierBasePrice : parseFloat(String(supplierBasePrice)) || 0);
  const val = Math.max(0, typeof marginValue === 'number' ? marginValue : parseFloat(String(marginValue)) || 0);
  const type = String(marginType || 'PERCENTAGE').toUpperCase();

  if (type === 'PERCENTAGE') {
    return Math.round(base * (1 + val / 100));
  } else if (type === 'FIXED') {
    return Math.round(base + val);
  }
  return base;
}

/**
 * Validates wholesale quantity tiers according to Zopit business rules
 */
export function validateWholesaleTiers(
  tiers: any[],
  supplierBasePrice: number
): {
  valid: boolean;
  errors: string[];
  normalizedTiers: Array<{ minQuantity: number; maxQuantity: number | null; unitPrice: number }>;
} {
  const errors: string[] = [];
  const normalizedTiers: Array<{ minQuantity: number; maxQuantity: number | null; unitPrice: number }> = [];

  const basePrice = Math.max(0, typeof supplierBasePrice === 'number' ? supplierBasePrice : parseFloat(String(supplierBasePrice)) || 0);
  if (basePrice <= 0) {
    errors.push('قیمت پایه کالا نامعتبر است.');
    return { valid: false, errors, normalizedTiers };
  }

  if (!Array.isArray(tiers) || tiers.length === 0) {
    return { valid: true, errors: [], normalizedTiers: [] };
  }

  if (tiers.length > 10) {
    errors.push('حداکثر ۱۰ پله تخفیف خرید عمده برای هر کالا مجاز است.');
  }

  const rawParsed = tiers.map((t, idx) => {
    const minQ = parseInt(String(t.minQuantity), 10);
    const maxQ = t.maxQuantity !== undefined && t.maxQuantity !== null && String(t.maxQuantity).trim() !== ''
      ? parseInt(String(t.maxQuantity), 10)
      : null;
    const price = typeof t.unitPrice === 'number' ? t.unitPrice : parseFloat(String(t.unitPrice).replace(/[^0-9.]/g, ''));

    return { index: idx + 1, minQuantity: minQ, maxQuantity: maxQ, unitPrice: price };
  });

  // Check individual fields
  for (const item of rawParsed) {
    if (isNaN(item.minQuantity) || item.minQuantity < 2) {
      errors.push(`پله ${item.index}: حداقل تعداد سفارش عمده باید حداقل ۲ عدد باشد (تعداد ۱ شامل قیمت تکی پایه است).`);
    }

    if (item.maxQuantity !== null) {
      if (isNaN(item.maxQuantity) || item.maxQuantity < item.minQuantity) {
        errors.push(`پله ${item.index}: حداکثر تعداد (${item.maxQuantity}) نمی‌تواند کمتر از حداقل تعداد (${item.minQuantity}) باشد.`);
      }
    }

    if (isNaN(item.unitPrice) || item.unitPrice <= 0) {
      errors.push(`پله ${item.index}: قیمت واحد خرید عمده باید بزرگتر از صفر باشد.`);
    } else if (item.unitPrice >= basePrice) {
      errors.push(`پله ${item.index}: قیمت واحد عمده (${item.unitPrice.toLocaleString('fa-IR')} تومان) باید کمتر از قیمت پایه تکی (${basePrice.toLocaleString('fa-IR')} تومان) باشد.`);
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors, normalizedTiers: [] };
  }

  // Sort tiers by minQuantity ascending
  const sorted = [...rawParsed].sort((a, b) => a.minQuantity - b.minQuantity);

  // Check for duplicate minQuantities, overlaps, and decreasing price curve
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];

    if (i > 0) {
      const prev = sorted[i - 1];

      // Overlap checks
      if (prev.maxQuantity === null) {
        errors.push(`پله با شروع از ${prev.minQuantity} عدد بدون سقف (بی‌نهایت) تعریف شده است، بنابراین پله‌های بعدی نمی‌توانند ثبت شوند.`);
      } else if (current.minQuantity <= prev.maxQuantity) {
        errors.push(`تداخل در پله‌های تعداد: پله (${prev.minQuantity} تا ${prev.maxQuantity}) با پله (${current.minQuantity} تا ${current.maxQuantity || 'نامحدود'}) هم‌پوشانی دارد.`);
      }

      // Decreasing / Non-increasing price curve check (higher quantity must have lower or equal unit price)
      if (current.unitPrice > prev.unitPrice) {
        errors.push(`عدم انطباق تخفیف پلکانی: قیمت واحد برای تعداد بیشتر (${current.minQuantity}+ عدد با قیمت ${current.unitPrice.toLocaleString('fa-IR')}) نمی‌تواند گران‌تر از تعداد کمتر (${prev.minQuantity} عدد با قیمت ${prev.unitPrice.toLocaleString('fa-IR')}) باشد.`);
      }
    }

    normalizedTiers.push({
      minQuantity: current.minQuantity,
      maxQuantity: current.maxQuantity,
      unitPrice: Math.round(current.unitPrice)
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    normalizedTiers: errors.length === 0 ? normalizedTiers : []
  };
}

/**
 * Authoritative Server-Side Wholesale Tier Calculator
 * Strictly determines applicable tier, supplier price, store acquisition price, and Zopit margin.
 * Never trusts frontend prices.
 */
export function calculateAuthoritativeWholesalePricing(params: {
  product: {
    id: number;
    supplierBasePrice: number;
    marginType?: string | null;
    marginValue?: number | null;
    finalPrice?: number | null;
    wholesaleTiers?: WholesaleTier[];
    sku?: string | null;
  };
  variant?: {
    id: number;
    supplierBasePrice?: number | null;
    sku?: string | null;
  } | null;
  quantity: number;
}): AuthoritativeWholesaleCalculationResult {
  const { product, variant, quantity: rawQty } = params;
  const quantity = Math.max(1, parseInt(String(rawQty || 1), 10));

  // Determine base supplier price for single unit
  const supplierBasePrice = Math.max(
    0,
    variant?.supplierBasePrice !== undefined && variant?.supplierBasePrice !== null && Number(variant.supplierBasePrice) > 0
      ? Number(variant.supplierBasePrice)
      : Number(product.supplierBasePrice || 0)
  );

  const tiers: WholesaleTier[] = Array.isArray(product.wholesaleTiers) ? product.wholesaleTiers : [];

  // Find matching tier based on quantity
  let applicableTier: WholesaleTier | null = null;
  if (tiers.length > 0) {
    const sortedTiers = [...tiers].sort((a, b) => a.minQuantity - b.minQuantity);
    for (const tier of sortedTiers) {
      const min = tier.minQuantity;
      const max = tier.maxQuantity !== null && tier.maxQuantity !== undefined ? tier.maxQuantity : Infinity;
      if (quantity >= min && quantity <= max) {
        applicableTier = tier;
        break;
      }
    }
  }

  // Determine supplier-side unit price
  let supplierUnitPrice = supplierBasePrice;
  let isWholesaleTierApplied = false;

  if (applicableTier && typeof applicableTier.unitPrice === 'number' && applicableTier.unitPrice > 0) {
    supplierUnitPrice = applicableTier.unitPrice;
    isWholesaleTierApplied = true;
  }

  // Zopit Product Governance Margin calculation
  const marginType = String(product.marginType || 'PERCENTAGE').toUpperCase();
  const marginValue = product.marginValue !== null && product.marginValue !== undefined ? Number(product.marginValue) : 0;

  // Store acquisition unit price (قیمت همکاری فروشگاه)
  const storeAcquisitionUnitPrice = calculateAuthoritativeFinalPrice(supplierUnitPrice, marginType, marginValue);
  const storeAcquisitionTotalPrice = Math.round(storeAcquisitionUnitPrice * quantity);

  // Zopit Profit / Margin calculations
  const zopitProfitPerUnit = Math.max(0, storeAcquisitionUnitPrice - supplierUnitPrice);
  const zopitTotalProfit = Math.round(zopitProfitPerUnit * quantity);
  const totalSupplierAmount = Math.round(supplierUnitPrice * quantity);

  // Suggested Retail Price (~25% markup or product suggested)
  const suggestedRetailUnitPrice = Math.round(storeAcquisitionUnitPrice * 1.25);

  const wholesaleDiscountPercentage = supplierBasePrice > 0 && supplierUnitPrice < supplierBasePrice
    ? Math.round(((supplierBasePrice - supplierUnitPrice) / supplierBasePrice) * 100)
    : 0;

  return {
    quantity,
    supplierBasePrice,
    supplierUnitPrice,
    applicableTier: applicableTier ? {
      id: applicableTier.id,
      minQuantity: applicableTier.minQuantity,
      maxQuantity: applicableTier.maxQuantity ?? null,
      unitPrice: applicableTier.unitPrice
    } : null,
    isWholesaleTierApplied,
    wholesaleDiscountPercentage,
    zopitMarginType: marginType,
    zopitMarginValue: marginValue,
    zopitProfitPerUnit,
    zopitTotalProfit,
    storeAcquisitionUnitPrice,
    storeAcquisitionTotalPrice,
    suggestedRetailUnitPrice,
    totalSupplierAmount,
    variantId: variant?.id || null,
    sku: variant?.sku || product.sku || `PROD-${product.id}`,
    calculatedAt: new Date().toISOString()
  };
}

/**
 * Detects wholesale pricing anomalies on a product for admin inspection
 */
export function detectWholesaleAnomalies(product: {
  id: number;
  name: string;
  supplierBasePrice: number;
  wholesaleTiers?: WholesaleTier[];
  marginType?: string | null;
  marginValue?: number | null;
  finalPrice?: number | null;
}): { hasAnomalies: boolean; anomalies: string[] } {
  const anomalies: string[] = [];
  const basePrice = Number(product.supplierBasePrice || 0);

  if (!product.wholesaleTiers || product.wholesaleTiers.length === 0) {
    return { hasAnomalies: false, anomalies: [] };
  }

  const tiers = [...product.wholesaleTiers].sort((a, b) => a.minQuantity - b.minQuantity);

  for (let i = 0; i < tiers.length; i++) {
    const tier = tiers[i];

    if (tier.minQuantity < 2) {
      anomalies.push(`حداقل تعداد پله ${i + 1} (${tier.minQuantity}) نامعتبر است (باید ≥ ۲ باشد).`);
    }

    if (tier.maxQuantity !== null && tier.maxQuantity !== undefined && tier.maxQuantity < tier.minQuantity) {
      anomalies.push(`حداکثر تعداد (${tier.maxQuantity}) در پله ${i + 1} کمتر از حداقل تعداد (${tier.minQuantity}) است.`);
    }

    if (tier.unitPrice <= 0) {
      anomalies.push(`قیمت پله ${i + 1} نامعتبر یا صفر است.`);
    }

    if (tier.unitPrice >= basePrice) {
      anomalies.push(`قیمت پله ${i + 1} (${tier.unitPrice.toLocaleString('fa-IR')} تومان) بزرگتر یا مساوی قیمت پایه (${basePrice.toLocaleString('fa-IR')} تومان) است.`);
    }

    if (i > 0) {
      const prev = tiers[i - 1];
      if (prev.maxQuantity !== null && prev.maxQuantity !== undefined && tier.minQuantity <= prev.maxQuantity) {
        anomalies.push(`هم‌پوشانی پله ${i} و ${i + 1} در بازه تعداد.`);
      }
      if (tier.unitPrice > prev.unitPrice) {
        anomalies.push(`انحراف قیمت: پله تعداد بالاتر (${tier.minQuantity}) گران‌تر از پله قبلی (${prev.minQuantity}) است.`);
      }
    }
  }

  return {
    hasAnomalies: anomalies.length > 0,
    anomalies
  };
}

/**
 * Builds an immutable Order Snapshot for historical auditing
 */
export function buildWholesaleOrderSnapshot(params: {
  orderId: number;
  orderItemId: number;
  product: { id: number; name: string; sku?: string | null };
  calculation: AuthoritativeWholesaleCalculationResult;
  storeRetailPrice?: number;
}): Record<string, any> {
  const { orderId, orderItemId, product, calculation, storeRetailPrice } = params;

  return {
    orderId,
    orderItemId,
    productId: product.id,
    productName: product.name,
    sku: calculation.sku,
    quantity: calculation.quantity,
    isWholesaleTierApplied: calculation.isWholesaleTierApplied,
    applicableTier: calculation.applicableTier ? {
      minQuantity: calculation.applicableTier.minQuantity,
      maxQuantity: calculation.applicableTier.maxQuantity,
      unitPrice: calculation.applicableTier.unitPrice
    } : null,
    supplierBasePrice: calculation.supplierBasePrice,
    supplierAcquisitionUnitPrice: calculation.supplierUnitPrice,
    supplierAcquisitionTotalPrice: calculation.totalSupplierAmount,
    storeAcquisitionUnitPrice: calculation.storeAcquisitionUnitPrice,
    storeAcquisitionTotalPrice: calculation.storeAcquisitionTotalPrice,
    storeRetailPrice: storeRetailPrice || calculation.suggestedRetailUnitPrice,
    zopitProfitPerUnit: calculation.zopitProfitPerUnit,
    zopitTotalProfit: calculation.zopitTotalProfit,
    zopitMarginType: calculation.zopitMarginType,
    zopitMarginValue: calculation.zopitMarginValue,
    timestamp: new Date().toISOString()
  };
}
