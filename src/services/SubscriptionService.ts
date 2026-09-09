import { prisma } from "../prisma.js";

export interface PlanConfig {
  code: "PRO_MONTHLY" | "PRO_ANNUAL";
  displayName: string;
  billingInterval: "MONTHLY" | "ANNUAL";
  priceToman: number;
  priceRials: number;
  currency: "TOMAN" | "IRR";
  durationMonths: number;
  durationDays: number;
  isActive: boolean;
  description: string;
  hostingIncluded: boolean;
  features: string[];
}

export interface SubscriptionStatusResult {
  userId: number;
  hasSubscription: boolean;
  isActive: boolean;
  status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING_PAYMENT" | "PAYMENT_FAILED" | "PENDING" | "NONE";
  planType: "PRO_MONTHLY" | "PRO_ANNUAL" | string | null;
  planDisplayName: string | null;
  startDate: Date | null;
  expiresAt: Date | null;
  daysRemaining: number;
  canRenew: boolean;
  freeMonthCredits: number;
  renewalCount: number;
  details?: any;
}


export interface ValueStackService {
  id: string;
  name: string;
  shortDesc?: string;
  value: number;
  included: boolean;
  order: number;
  category?: string;
}

const DEFAULT_VALUE_STACK: ValueStackService[] = [
  { 
    id: "hosting", 
    name: "هاست اختصاصی و پرسرعت ابری NVMe", 
    shortDesc: "میزبانی ابری فوق‌سریع همراه با وب‌سرور لایت‌اسپید، رم و پردازنده اختصاصی", 
    value: 1200000, 
    included: true, 
    order: 1, 
    category: "زیرساخت و هاست" 
  },
  { 
    id: "domain", 
    name: "ثبت و تخصیص دامنه دات آی‌آر اختصاصی (.ir)", 
    shortDesc: "ثبت دامنه ملی با مالکیت قطعی ۱۰۰٪ به نام مدیر فروشگاه در ایرنیک", 
    value: 150000, 
    included: true, 
    order: 2, 
    category: "زیرساخت و هاست" 
  },
  { 
    id: "theme", 
    name: "قالب اورجینال و اختصاصی وودمارت (با لایسنس فعال)", 
    shortDesc: "پوسته استاندارد و مدرن فروشگاهی بهینه‌شده برای موبایل و سئو", 
    value: 1100000, 
    included: true, 
    order: 3, 
    category: "طراحی و قالب" 
  },
  { 
    id: "plugins", 
    name: "نصب و فعال‌سازی افزونه‌های ضروری سئو و بهینه‌سازی", 
    shortDesc: "پکیج پلاگین‌های افزایش سرعت، بهینه‌سازی تصاویر و ساختارمندسازی سئو", 
    value: 750000, 
    included: true, 
    order: 4, 
    category: "امکانات فنی" 
  },
  { 
    id: "config", 
    name: "راه‌اندازی فنی، تنظیمات پایه و اتصال درگاه بانکی", 
    shortDesc: "کانفیگ دیتابیس، درگاه پرداخت مستقیم شاپرک و تشکیل پرونده مالیاتی", 
    value: 600000, 
    included: true, 
    order: 5, 
    category: "راه‌اندازی" 
  },
  { 
    id: "support", 
    name: "پشتیبانی فنی و تیکتی VIP با پاسخگویی اولویت‌دار", 
    shortDesc: "همراهی مستقیم تیم فنی زوپیت برای حل ابهامات و بهینه‌سازی مداوم", 
    value: 500000, 
    included: true, 
    order: 6, 
    category: "پشتیبانی" 
  },
  { 
    id: "growth_tools", 
    name: "ابزارهای رشد، تحلیل فروش و هوش مصنوعی Zopit", 
    shortDesc: "موتور پیشنهاد هوشمند محصولات پرفروش، تحلیل تقاضا و گزارش‌های رشد", 
    value: 450000, 
    included: true, 
    order: 7, 
    category: "ابزارهای هوشمند" 
  },
  { 
    id: "academy", 
    name: "آموزش ویدیویی مدیریت فروشگاه و استراتژی فروش آنلاین", 
    shortDesc: "دوره کاربردی مدیریت سفارشات، ارتباط با مشتری و بازاریابی دیجیتال", 
    value: 350000, 
    included: true, 
    order: 8, 
    category: "آموزش و رشد" 
  }
];

export class SubscriptionService {
  /**
   * Get server-authoritative plan configurations from system settings
   */
  static async getPlanConfigs(): Promise<any> {
    try {
      const settingsRows = await prisma.systemSettings.findMany({
        where: {
          key: {
            in: [
              "pro_monthly_price",
              "pro_annual_price",
              "pro_plan_title",
              "pro_plan_desc",
              "pro_plan_active",
              "pro_promotion_text",
              "pro_promotion_start",
              "pro_promotion_end",
              "pro_countdown_visible",
              "pro_featured_plan",
              "pro_discount_badge",
              "pro_value_stack_services",
              "pro_promotion_action_after_expiry",
              // Multi-tier price & value settings
              "startup_monthly_price",
              "startup_original_value",
              "pro_monthly_original_value",
              "pro_annual_original_value",
              "vip_monthly_price",
              "vip_monthly_original_value",
              "vip_annual_price",
              "vip_annual_original_value"
            ]
          }
        }
      });

      const settingsMap: Record<string, string> = {};
      settingsRows.forEach((s) => {
        settingsMap[s.key] = s.value;
      });

      // Standard / PRO Tier
      const monthlyPrice = parseInt(settingsMap["pro_monthly_price"] || "2490000", 10);
      const annualPrice = parseInt(settingsMap["pro_annual_price"] || "24900000", 10);
      const isPlanActive = settingsMap["pro_plan_active"] !== "false";
      const planTitle = settingsMap["pro_plan_title"] || "اشتراک حرفه‌ای Zopit";
      const planDesc = settingsMap["pro_plan_desc"] || "دسترسی کامل به سیستم مدیریت فروشگاه، میزبانی ابری و زیرساخت فصلی";

      // Startup Tier
      const startupMonthlyPrice = parseInt(settingsMap["startup_monthly_price"] || "259000", 10);
      const startupOriginalValue = parseInt(settingsMap["startup_original_value"] || "650000", 10);

      // PRO Tier Original Values
      const proMonthlyOriginalValue = parseInt(settingsMap["pro_monthly_original_value"] || "1200000", 10);
      const proAnnualOriginalValue = parseInt(settingsMap["pro_annual_original_value"] || "4800000", 10);

      // VIP Tier
      const vipMonthlyPrice = parseInt(settingsMap["vip_monthly_price"] || "599000", 10);
      const vipMonthlyOriginalValue = parseInt(settingsMap["vip_monthly_original_value"] || "2400000", 10);
      const vipAnnualPrice = parseInt(settingsMap["vip_annual_price"] || "3999000", 10);
      const vipAnnualOriginalValue = parseInt(settingsMap["vip_annual_original_value"] || "8500000", 10);

      const promotionText = settingsMap["pro_promotion_text"] || "پیشنهاد ویژه شروع همکاری - با ظرفیت محدود!";
      const promotionStart = settingsMap["pro_promotion_start"] || null;
      const promotionEnd = settingsMap["pro_promotion_end"] || null;
      const countdownVisible = settingsMap["pro_countdown_visible"] !== "false";
      const featuredPlan = settingsMap["pro_featured_plan"] || "PRO_ANNUAL";
      const discountBadge = settingsMap["pro_discount_badge"] || "٪۴۶ تخفیف ویژه شروع همکاری";
      const actionAfterExpiry = settingsMap["pro_promotion_action_after_expiry"] || "NONE";

      let valueStackServices = DEFAULT_VALUE_STACK;
      const valStackStr = settingsMap["pro_value_stack_services"];
      if (valStackStr) {
        try {
          valueStackServices = JSON.parse(valStackStr);
        } catch (e) {
          console.error("Error parsing pro_value_stack_services:", e);
        }
      }

      // Authoritative financial arithmetic for value stack
      const totalServiceValueToman = valueStackServices
        .filter((s: any) => s.included)
        .reduce((sum: number, s: any) => sum + s.value, 0);

      // Resolve promotional state based on expiration
      const now = new Date();
      let isExpired = false;
      if (promotionEnd) {
        const endDate = new Date(promotionEnd);
        if (now > endDate) {
          isExpired = true;
        }
      }

      // If action is HIDE_DISCOUNT_BADGE or HIDE_PROMOTION, we can alter values
      let effectiveMonthlyPrice = monthlyPrice;
      let effectiveAnnualPrice = annualPrice;
      let effectiveDiscountBadge = discountBadge;
      let effectiveCountdownVisible = countdownVisible;

      if (isExpired) {
        if (actionAfterExpiry === "HIDE_PROMOTION") {
          // Fallback to standard prices (e.g. increase by 25% or set standard)
          effectiveMonthlyPrice = Math.round(monthlyPrice * 1.25);
          effectiveAnnualPrice = Math.round(annualPrice * 1.25);
          effectiveCountdownVisible = false;
        } else if (actionAfterExpiry === "HIDE_DISCOUNT_BADGE") {
          effectiveDiscountBadge = "";
          effectiveCountdownVisible = false;
        } else if (actionAfterExpiry === "HIDE_BANNER") {
          effectiveCountdownVisible = false;
        }
      }

      // Savings calculations for PRO Tier
      const monthlySavingsToman = totalServiceValueToman - effectiveMonthlyPrice;
      const monthlyDiscountPercentage = totalServiceValueToman > 0 
        ? Math.round((monthlySavingsToman / totalServiceValueToman) * 100) 
        : 0;

      const annualSavingsToman = totalServiceValueToman - effectiveAnnualPrice;
      const annualDiscountPercentage = totalServiceValueToman > 0 
        ? Math.round((annualSavingsToman / totalServiceValueToman) * 100) 
        : 0;

      // Saving compared to equivalent monthly billing
      const equivalentMonthlyBilling = effectiveMonthlyPrice * 12;
      const annualSavingVsMonthlyToman = equivalentMonthlyBilling - effectiveAnnualPrice;
      const annualSavingVsMonthlyPercentage = equivalentMonthlyBilling > 0 
        ? Math.round((annualSavingVsMonthlyToman / equivalentMonthlyBilling) * 100) 
        : 0;

      // Mathematical months free
      const monthsFree = effectiveMonthlyPrice > 0 
        ? Math.round((equivalentMonthlyBilling - effectiveAnnualPrice) / effectiveMonthlyPrice) 
        : 0;

      // VIP Savings calculations
      const vipEquivalentMonthlyBilling = vipMonthlyPrice * 12;
      const vipAnnualSavingVsMonthlyToman = vipEquivalentMonthlyBilling - vipAnnualPrice;
      const vipAnnualSavingVsMonthlyPercentage = vipEquivalentMonthlyBilling > 0 
        ? Math.round((vipAnnualSavingVsMonthlyToman / vipEquivalentMonthlyBilling) * 100) 
        : 0;
      const vipMonthsFree = vipMonthlyPrice > 0 
        ? Math.round(vipAnnualSavingVsMonthlyToman / vipMonthlyPrice) 
        : 0;

      // Plan configurations with value stack and financial arithmetic
      return {
        // Startup Entry Plan (Monthly only)
        STARTUP: {
          code: "STARTUP",
          displayName: "استارتاپ (تست بازار و شروع سریع)",
          billingInterval: "MONTHLY",
          priceToman: startupMonthlyPrice,
          salePrice: startupMonthlyPrice,
          salePriceToman: startupMonthlyPrice,
          originalValue: startupOriginalValue,
          originalValueToman: startupOriginalValue,
          discountPercentage: startupOriginalValue > 0 ? Math.round(((startupOriginalValue - startupMonthlyPrice) / startupOriginalValue) * 100) : 0,
          priceRials: startupMonthlyPrice * 10,
          currency: "TOMAN",
          durationMonths: 1,
          durationDays: 30,
          isActive: isPlanActive,
          description: "پلن اقتصادی با تمرکز بر حداقل هزینه جهت تست بازار و راه‌اندازی سریع فروشگاه",
          hostingIncluded: true,
          hostingLabel: "هاست ابری ۱۰ گیگابایت NVMe در پکیج شما",
          ctaText: "شروع همکاری",
          features: [
            "۱۰ گیگابایت هاست ابری پرسرعت NVMe",
            "۳.۵ هسته پردازنده CPU و ۳ گیگابایت RAM",
            "درگاه پرداخت مستقیم شاپرک به نام مدیر فروشگاه",
            "تشکیل پرونده مالیاتی سریع و اتوماتیک",
            "فروشگاه‌ساز استاندارد وودمارت",
            "پشتیبانی تیکتی پاسخگویی عادی"
          ],
          featured: false
        },

        // PRO Monthly
        PRO_MONTHLY: {
          code: "PRO_MONTHLY",
          displayName: `${planTitle} (ماهانه)`,
          billingInterval: "MONTHLY",
          priceToman: effectiveMonthlyPrice,
          salePrice: effectiveMonthlyPrice,
          salePriceToman: effectiveMonthlyPrice,
          originalValue: proMonthlyOriginalValue,
          originalValueToman: proMonthlyOriginalValue,
          discountPercentage: proMonthlyOriginalValue > 0 ? Math.round(((proMonthlyOriginalValue - effectiveMonthlyPrice) / proMonthlyOriginalValue) * 100) : monthlyDiscountPercentage,
          priceRials: effectiveMonthlyPrice * 10,
          currency: "TOMAN",
          durationMonths: 1,
          durationDays: 30,
          isActive: isPlanActive,
          description: planDesc,
          hostingIncluded: true,
          hostingLabel: "هاست ابری فوق‌سریع ۱۵ گیگابایت NVMe در پکیج شما",
          ctaText: "فعالسازی پلن",
          features: [
            "میزبانی ابری اختصاصی و پرسرعت NVMe (۱۵ گیگ)",
            "۵ هسته پردازنده CPU و ۵ گیگابایت RAM",
            "اتصال به درگاه پرداخت مستقیم بانکی",
            "ثبت و اخذ نماد اعتماد الکترونیکی (کاملاً رایگان و هدیه)",
            "سیستم پشتیبان‌گیری منظم دیتابیس",
            "تولید محتوا و گرافیک هوش مصنوعی Zopit",
            "پشتیبانی اولویت‌دار اختصاصی VIP"
          ],
          totalServiceValueToman,
          savingsToman: monthlySavingsToman,
          featured: featuredPlan === "PRO_MONTHLY"
        },

        // PRO Annual (Best Value / Recommended)
        PRO_ANNUAL: {
          code: "PRO_ANNUAL",
          displayName: `${planTitle} (سالانه)`,
          billingInterval: "ANNUAL",
          priceToman: effectiveAnnualPrice,
          salePrice: effectiveAnnualPrice,
          salePriceToman: effectiveAnnualPrice,
          originalValue: proAnnualOriginalValue || 4800000,
          originalValueToman: proAnnualOriginalValue || 4800000,
          discountPercentage: proAnnualOriginalValue > 0 ? Math.round(((proAnnualOriginalValue - effectiveAnnualPrice) / proAnnualOriginalValue) * 100) : 46,
          monthlyEquivalent: Math.round(effectiveAnnualPrice / 12),
          monthlyEquivalentToman: Math.round(effectiveAnnualPrice / 12),
          annualSaving: annualSavingVsMonthlyToman,
          annualSavingToman: annualSavingVsMonthlyToman,
          priceRials: effectiveAnnualPrice * 10,
          currency: "TOMAN",
          durationMonths: 12,
          durationDays: 365,
          isActive: isPlanActive,
          description: `${planDesc} - شامل بیشترین صرفه‌جویی و خدمات کامل هدیه`,
          hostingIncluded: true,
          hostingLabel: "هاست ابری فوق‌سریع ۱۵ گیگابایت NVMe (۱ ساله) در پکیج شما",
          ctaText: "فعالسازی پلن ویژه",
          features: [
            "میزبانی ابری فوق‌سریع NVMe (۱ ساله کامل)",
            "۵ هسته قدرتمند CPU و ۵ گیگابایت RAM",
            "دریافت ای‌نماد و پرونده مالیاتی ۱۰۰٪ رایگان",
            "سیستم بکاپ‌گیری منظم و خودکار دیتابیس",
            "لوگو + تیزر ویدیویی تولیدی با هوش مصنوعی Zopit",
            "اتصال به پنل پیامکی و ارسال تایید ورود",
            `صرفه‌جویی ویژه معادل ${monthsFree > 0 ? monthsFree : 2} ماه استفاده رایگان`,
            "پشتیبانی اولویت‌دار اختصاصی VIP (زیر ۶ ساعت)"
          ],
          totalServiceValueToman,
          savingsToman: annualSavingsToman,
          annualSavingVsMonthlyToman,
          annualSavingVsMonthlyPercentage,
          monthsFree,
          featured: featuredPlan === "PRO_ANNUAL",
          discountBadge: effectiveDiscountBadge
        },

        // VIP Monthly
        VIP_MONTHLY: {
          code: "VIP_MONTHLY",
          displayName: "ویژه VIP سازمانی (ماهانه)",
          billingInterval: "MONTHLY",
          priceToman: vipMonthlyPrice,
          salePrice: vipMonthlyPrice,
          salePriceToman: vipMonthlyPrice,
          originalValue: vipMonthlyOriginalValue,
          originalValueToman: vipMonthlyOriginalValue,
          discountPercentage: vipMonthlyOriginalValue > 0 ? Math.round(((vipMonthlyOriginalValue - vipMonthlyPrice) / vipMonthlyOriginalValue) * 100) : 0,
          priceRials: vipMonthlyPrice * 10,
          currency: "TOMAN",
          durationMonths: 1,
          durationDays: 30,
          isActive: isPlanActive,
          description: "برای برندهای تثبیت شده، ترافیک بالا، اتصال بومی به ترب و سیستم‌های حسابداری پیشرفته",
          hostingIncluded: true,
          hostingLabel: "هاست اختصاصی پرسرعت ۳۰ گیگابایت (۹ هسته CPU) در پکیج شما",
          ctaText: "انتخاب این پکیج",
          features: [
            "۳۰ گیگابایت هاست ابری سازمانی (۷ تا ۹ هسته اختصاصی)",
            "ثبت و تمدید دامنه اختصاصی .ir به نام مالک",
            "فول بکاپ کامل فایل‌ها هر ۳ روز + دیتابیس ۲۴ ساعته",
            "اتصال خودکار به موتورهای ترب و ایمالز",
            "تولید بنر و محتوای نامحدود با هوش مصنوعی",
            "پشتیبانی مستقیم تلگرام + تماس تلفنی + تیکت فوری"
          ],
          featured: featuredPlan === "VIP_MONTHLY"
        },

        // VIP Annual
        VIP_ANNUAL: {
          code: "VIP_ANNUAL",
          displayName: "ویژه VIP سازمانی (سالانه)",
          billingInterval: "ANNUAL",
          priceToman: vipAnnualPrice,
          salePrice: vipAnnualPrice,
          salePriceToman: vipAnnualPrice,
          originalValue: vipAnnualOriginalValue,
          originalValueToman: vipAnnualOriginalValue,
          discountPercentage: vipAnnualOriginalValue > 0 ? Math.round(((vipAnnualOriginalValue - vipAnnualPrice) / vipAnnualOriginalValue) * 100) : 53,
          monthlyEquivalent: Math.round(vipAnnualPrice / 12),
          monthlyEquivalentToman: Math.round(vipAnnualPrice / 12),
          annualSaving: vipAnnualSavingVsMonthlyToman,
          annualSavingToman: vipAnnualSavingVsMonthlyToman,
          priceRials: vipAnnualPrice * 10,
          currency: "TOMAN",
          durationMonths: 12,
          durationDays: 365,
          isActive: isPlanActive,
          description: "پکیج کامل سازمانی سالانه با تخفیف بیش از ۵۰٪ و حداکثر پایداری",
          hostingIncluded: true,
          hostingLabel: "هاست اختصاصی پرسرعت ۳۰ گیگابایت (۱ ساله) با دامنه رایگان در پکیج شما",
          ctaText: "انتخاب این پکیج",
          features: [
            "۳۰ گیگابایت هاست اختصاصی پرسرعت سازمانی (۱ ساله)",
            "ثبت دامنه اختصاصی .ir کاملاً رایگان به نام شما",
            "اتصال رسمی و وب‌سرویسی به ترب و ایمالز",
            "فول بکاپ ۳ روزه + دیتابیس ۲۴ ساعته",
            "طراحی نامحدود بنرها و ویدیوهای تبلیغاتی AI",
            "مدیر اختصاصی تلگرام + تماس تلفنی + پشتیبانی تیکتی فوری",
            `بیش از ${vipAnnualSavingVsMonthlyPercentage > 0 ? vipAnnualSavingVsMonthlyPercentage : 40}٪ صرفه‌جویی در پرداخت یکجای سالانه`
          ],
          annualSavingVsMonthlyToman: vipAnnualSavingVsMonthlyToman,
          annualSavingVsMonthlyPercentage: vipAnnualSavingVsMonthlyPercentage,
          monthsFree: vipMonthsFree,
          featured: featuredPlan === "VIP_ANNUAL",
          discountBadge: "پیشنهاد ویژه سازمانی"
        },

        valueStackServices,
        totalServiceValueToman,
        promotionConfig: {
          text: promotionText,
          start: promotionStart,
          end: promotionEnd,
          visible: effectiveCountdownVisible,
          featuredPlan,
          discountBadge: effectiveDiscountBadge,
          isExpired
        }
      };
    } catch (error) {
      console.error("Error fetching plan configs:", error);
      // Fallback defaults
      return {
        STARTUP: {
          code: "STARTUP",
          displayName: "استارتاپ (تست اولیه)",
          billingInterval: "MONTHLY",
          priceToman: 259000,
          salePrice: 259000,
          originalValue: 650000,
          discountPercentage: 60,
          currency: "TOMAN",
          durationMonths: 1,
          durationDays: 30,
          isActive: true,
          description: "پلن اقتصادی جهت تست بازار و راه‌اندازی سریع",
          hostingIncluded: true,
          hostingLabel: "هاست ابری ۱۰ گیگابایت NVMe در پکیج شما",
          ctaText: "شروع همکاری",
          features: ["۱۰ گیگابایت هاست ابری NVMe", "درگاه پرداخت مستقیم", "پرونده مالیاتی سریع"],
          featured: false
        },
        PRO_MONTHLY: {
          code: "PRO_MONTHLY",
          displayName: "اشتراک حرفه‌ای Zopit (ماهانه)",
          billingInterval: "MONTHLY",
          priceToman: 2490000,
          salePrice: 2490000,
          originalValue: 1200000,
          discountPercentage: 84,
          priceRials: 24900000,
          currency: "TOMAN",
          durationMonths: 1,
          durationDays: 30,
          isActive: true,
          description: "دسترسی کامل به امکانات توسعه و زیرساخت اختصاصی فروشگاه",
          hostingIncluded: true,
          hostingLabel: "هاست ابری ۱۵ گیگابایت NVMe در پکیج شما",
          ctaText: "فعالسازی پلن",
          features: ["میزبانی ابری NVMe", "درگاه پرداخت مستقیم", "پشتیبانی اختصاصی"],
          totalServiceValueToman: 15150000,
          savingsToman: 12660000,
          featured: false
        },
        PRO_ANNUAL: {
          code: "PRO_ANNUAL",
          displayName: "اشتراک حرفه‌ای Zopit (سالانه)",
          billingInterval: "ANNUAL",
          priceToman: 24900000,
          salePrice: 24900000,
          originalValue: 4800000,
          discountPercentage: 46,
          monthlyEquivalent: 2075000,
          annualSaving: 4980000,
          priceRials: 249000000,
          currency: "TOMAN",
          durationMonths: 12,
          durationDays: 365,
          isActive: true,
          description: "دسترسی ۱ ساله کامل (۲ ماه تخفیف ویژه)",
          hostingIncluded: true,
          hostingLabel: "هاست ابری ۱۵ گیگابایت NVMe (۱ ساله) در پکیج شما",
          ctaText: "فعالسازی پلن ویژه",
          features: ["میزبانی ابری NVMe", "۲ ماه تخفیف سالانه", "پشتیبانی اختصاصی"],
          totalServiceValueToman: 15150000,
          savingsToman: -9750000,
          annualSavingVsMonthlyToman: 4980000,
          annualSavingVsMonthlyPercentage: 17,
          monthsFree: 2,
          featured: true,
          discountBadge: "پیشنهاد ویژه سالانه"
        },
        VIP_MONTHLY: {
          code: "VIP_MONTHLY",
          displayName: "ویژه VIP سازمانی (ماهانه)",
          billingInterval: "MONTHLY",
          priceToman: 599000,
          salePrice: 599000,
          originalValue: 2400000,
          discountPercentage: 75,
          currency: "TOMAN",
          durationMonths: 1,
          durationDays: 30,
          isActive: true,
          description: "برای برندهای تثبیت شده و پربازدید",
          hostingIncluded: true,
          hostingLabel: "هاست ۳۰ گیگابایت اختصاصی در پکیج شما",
          ctaText: "انتخاب این پکیج",
          features: ["۳۰ گیگابایت هاست اختصاصی", "اتصال به ترب و ایمالز", "پشتیبانی تلفنی و تلگرام"],
          featured: false
        },
        VIP_ANNUAL: {
          code: "VIP_ANNUAL",
          displayName: "ویژه VIP سازمانی (سالانه)",
          billingInterval: "ANNUAL",
          priceToman: 3999000,
          salePrice: 3999000,
          originalValue: 8500000,
          discountPercentage: 53,
          monthlyEquivalent: 333250,
          currency: "TOMAN",
          durationMonths: 12,
          durationDays: 365,
          isActive: true,
          description: "پکیج کامل سازمانی سالانه",
          hostingIncluded: true,
          hostingLabel: "هاست ۳۰ گیگابایت اختصاصی (۱ ساله) در پکیج شما",
          ctaText: "انتخاب این پکیج",
          features: ["۳۰ گیگابایت هاست اختصاصی ۱ ساله", "دامنه ir رایگان", "اتصال به ترب و ایمالز"],
          annualSavingVsMonthlyToman: 3189000,
          annualSavingVsMonthlyPercentage: 44,
          monthsFree: 5,
          featured: true,
          discountBadge: "پیشنهاد ویژه سازمانی"
        },
        valueStackServices: DEFAULT_VALUE_STACK,
        totalServiceValueToman: 15150000,
        promotionConfig: {
          text: "پیشنهاد ویژه شروع همکاری - با ظرفیت محدود!",
          start: null,
          end: null,
          visible: true,
          featuredPlan: "PRO_ANNUAL",
          discountBadge: "پیشنهاد ویژه سالانه",
          isExpired: false
        }
      };
    }
  }

  /**
   * Check store subscription status authoritatively on server
   */
  static async getStoreSubscriptionStatus(userId: number): Promise<SubscriptionStatusResult> {
    const proAccount = await prisma.proAccount.findUnique({
      where: { userId }
    });

    if (!proAccount) {
      return {
        userId,
        hasSubscription: false,
        isActive: false,
        status: "NONE",
        planType: null,
        planDisplayName: null,
        startDate: null,
        expiresAt: null,
        daysRemaining: 0,
        canRenew: true,
        freeMonthCredits: 0,
        renewalCount: 0
      };
    }

    const now = new Date();
    // Resolve effective expiration date (check expiresAt or hostExpiresAt)
    let expirationDate = proAccount.expiresAt || proAccount.hostExpiresAt;

    let currentStatus = proAccount.status || "PENDING";
    let isCurrentlyActive = currentStatus === "ACTIVE" || currentStatus === "APPROVED";

    // Handle Expiration Server-Side
    if (isCurrentlyActive && expirationDate && new Date(expirationDate) < now) {
      currentStatus = "EXPIRED";
      isCurrentlyActive = false;

      // Update in DB
      await prisma.proAccount.update({
        where: { userId },
        data: { status: "EXPIRED" }
      }).catch(() => {});

      // Log event
      await prisma.subscriptionEvent.create({
        data: {
          userId,
          proAccountId: proAccount.id,
          eventType: "SUBSCRIPTION_EXPIRED",
          planType: proAccount.planType || "PRO_ANNUAL",
          amount: 0,
          startDate: proAccount.startDate,
          endDate: expirationDate,
          metadata: JSON.stringify({ reason: "Exceeded valid subscription duration" })
        }
      }).catch(() => {});
    }

    let daysRemaining = 0;
    if (isCurrentlyActive && expirationDate) {
      const diffTime = new Date(expirationDate).getTime() - now.getTime();
      daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }

    const plans = await this.getPlanConfigs();
    const effectivePlan = proAccount.planType === "PRO_MONTHLY" ? plans.PRO_MONTHLY : plans.PRO_ANNUAL;

    return {
      userId,
      hasSubscription: true,
      isActive: isCurrentlyActive,
      status: currentStatus as any,
      planType: proAccount.planType,
      planDisplayName: effectivePlan?.displayName || "اشتراک حرفه‌ای Zopit",
      startDate: proAccount.startDate || proAccount.createdAt,
      expiresAt: expirationDate,
      daysRemaining,
      canRenew: true,
      freeMonthCredits: proAccount.freeMonthCredits || 0,
      renewalCount: proAccount.renewalCount || 0,
      details: {
        domainName: proAccount.domainName,
        cpanelUrl: proAccount.cpanelUrl,
        wpAdminUrl: proAccount.wpAdminUrl,
        hasEnamad: proAccount.hasEnamad,
        hasGateway: proAccount.hasGateway,
        torobConnected: proAccount.torobConnected
      }
    };
  }

  /**
   * Handle server-side subscription activation / renewal after payment confirmation
   */
  static async activateOrRenewSubscription(params: {
    userId: number;
    planType: "PRO_MONTHLY" | "PRO_ANNUAL";
    paymentRef: string;
    invoiceId?: number;
    amountPaidToman: number;
  }): Promise<{ success: boolean; proAccount: any; isNew: boolean; extendedDays: number }> {
    const { userId, planType, paymentRef, invoiceId, amountPaidToman } = params;

    // Idempotency check on StoreInvoice if provided
    if (invoiceId) {
      const invoice = await prisma.storeInvoice.findUnique({ where: { id: invoiceId } });
      if (invoice && invoice.status === "PAID" && invoice.trackId === paymentRef) {
        console.log(`[SubscriptionService] Invoice #${invoiceId} already processed as PAID. Idempotent return.`);
        const existingPro = await prisma.proAccount.findUnique({ where: { userId } });
        return { success: true, proAccount: existingPro, isNew: false, extendedDays: 0 };
      }
    }

    const plans = await this.getPlanConfigs();
    const planConfig = planType === "PRO_MONTHLY" ? plans.PRO_MONTHLY : plans.PRO_ANNUAL;
    const durationDays = planConfig.durationDays;

    const existingPro = await prisma.proAccount.findUnique({ where: { userId } });
    const now = new Date();

    let startDate = now;
    let newExpiresAt = new Date();

    let isRenewal = false;

    if (existingPro && (existingPro.status === "ACTIVE" || existingPro.status === "APPROVED")) {
      const currentExp = existingPro.expiresAt || existingPro.hostExpiresAt;
      if (currentExp && new Date(currentExp) > now) {
        // Stack extension on top of current expiration date
        startDate = existingPro.startDate || existingPro.createdAt;
        newExpiresAt = new Date(new Date(currentExp).getTime() + durationDays * 24 * 60 * 60 * 1000);
        isRenewal = true;
      } else {
        newExpiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
      }
    } else {
      newExpiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    }

    // Upsert ProAccount
    const updatedPro = await prisma.proAccount.upsert({
      where: { userId },
      update: {
        planType,
        status: "ACTIVE",
        startDate,
        expiresAt: newExpiresAt,
        hostExpiresAt: newExpiresAt,
        lastRenewedAt: now,
        payLink: null,
        renewalCount: { increment: isRenewal ? 1 : 0 }
      },
      create: {
        userId,
        planType,
        status: "ACTIVE",
        startDate,
        expiresAt: newExpiresAt,
        hostExpiresAt: newExpiresAt,
        lastRenewedAt: now,
        renewalCount: 0
      }
    });

    // Mark invoice paid if present
    if (invoiceId) {
      await prisma.storeInvoice.update({
        where: { id: invoiceId },
        data: {
          status: "PAID",
          paidAt: now,
          trackId: paymentRef,
          receiptNotes: `پرداخت اشتراک ${planConfig.displayName}`
        }
      }).catch((e) => console.error("Error updating StoreInvoice status:", e));
    }

    // Log Subscription Event
    const eventType = isRenewal ? "SUBSCRIPTION_RENEWED" : "SUBSCRIPTION_ACTIVATED";
    await prisma.subscriptionEvent.create({
      data: {
        userId,
        proAccountId: updatedPro.id,
        eventType,
        planType,
        amount: amountPaidToman,
        durationMonths: planConfig.durationMonths,
        startDate,
        endDate: newExpiresAt,
        paymentRef,
        metadata: JSON.stringify({
          invoiceId,
          durationDays,
          planDisplayName: planConfig.displayName
        })
      }
    });

    // Record Audit Trail
    await prisma.auditTrail.create({
      data: {
        actorId: userId,
        action: eventType,
        resource: `ProAccount:${updatedPro.id}`,
        metadata: JSON.stringify({ amountPaidToman, paymentRef, planType, newExpiresAt })
      }
    }).catch(() => {});

    return {
      success: true,
      proAccount: updatedPro,
      isNew: !isRenewal,
      extendedDays: durationDays
    };
  }

  /**
   * Admin configuration update for subscription plan prices
   */
  static async adminUpdatePlanPrices(
    adminId: number, 
    monthlyPriceToman: number, 
    annualPriceToman: number,
    extraSettings?: {
      promotionText?: string;
      promotionStart?: string;
      promotionEnd?: string;
      countdownVisible?: boolean;
      featuredPlan?: string;
      discountBadge?: string;
      valueStackServices?: any[];
      promotionActionAfterExpiry?: string;
      startupMonthlyPrice?: number;
      startupOriginalValue?: number;
      proMonthlyOriginalValue?: number;
      proAnnualOriginalValue?: number;
      vipMonthlyPrice?: number;
      vipMonthlyOriginalValue?: number;
      vipAnnualPrice?: number;
      vipAnnualOriginalValue?: number;
    }
  ): Promise<boolean> {
    if (monthlyPriceToman <= 0 || annualPriceToman <= 0) {
      throw new Error("قیمت اشتراک باید بزرگتر از صفر باشد.");
    }

    await prisma.systemSettings.upsert({
      where: { key: "pro_monthly_price" },
      update: { value: String(monthlyPriceToman) },
      create: { key: "pro_monthly_price", value: String(monthlyPriceToman), description: "قیمت اشتراک ماهانه پرو زوپیت (تومان)" }
    });

    await prisma.systemSettings.upsert({
      where: { key: "pro_annual_price" },
      update: { value: String(annualPriceToman) },
      create: { key: "pro_annual_price", value: String(annualPriceToman), description: "قیمت اشتراک سالانه پرو زوپیت (تومان)" }
    });

    if (extraSettings) {
      if (extraSettings.startupMonthlyPrice !== undefined) {
        await prisma.systemSettings.upsert({
          where: { key: "startup_monthly_price" },
          update: { value: String(extraSettings.startupMonthlyPrice) },
          create: { key: "startup_monthly_price", value: String(extraSettings.startupMonthlyPrice), description: "قیمت ماهانه پلن استارتاپ (تومان)" }
        });
      }
      if (extraSettings.startupOriginalValue !== undefined) {
        await prisma.systemSettings.upsert({
          where: { key: "startup_original_value" },
          update: { value: String(extraSettings.startupOriginalValue) },
          create: { key: "startup_original_value", value: String(extraSettings.startupOriginalValue), description: "ارزش واقعی خدمات پلن استارتاپ (تومان)" }
        });
      }
      if (extraSettings.proMonthlyOriginalValue !== undefined) {
        await prisma.systemSettings.upsert({
          where: { key: "pro_monthly_original_value" },
          update: { value: String(extraSettings.proMonthlyOriginalValue) },
          create: { key: "pro_monthly_original_value", value: String(extraSettings.proMonthlyOriginalValue), description: "ارزش واقعی خدمات پلن پرو ماهانه (تومان)" }
        });
      }
      if (extraSettings.proAnnualOriginalValue !== undefined) {
        await prisma.systemSettings.upsert({
          where: { key: "pro_annual_original_value" },
          update: { value: String(extraSettings.proAnnualOriginalValue) },
          create: { key: "pro_annual_original_value", value: String(extraSettings.proAnnualOriginalValue), description: "ارزش واقعی خدمات پلن پرو سالانه (تومان)" }
        });
      }
      if (extraSettings.vipMonthlyPrice !== undefined) {
        await prisma.systemSettings.upsert({
          where: { key: "vip_monthly_price" },
          update: { value: String(extraSettings.vipMonthlyPrice) },
          create: { key: "vip_monthly_price", value: String(extraSettings.vipMonthlyPrice), description: "قیمت ماهانه پلن VIP (تومان)" }
        });
      }
      if (extraSettings.vipMonthlyOriginalValue !== undefined) {
        await prisma.systemSettings.upsert({
          where: { key: "vip_monthly_original_value" },
          update: { value: String(extraSettings.vipMonthlyOriginalValue) },
          create: { key: "vip_monthly_original_value", value: String(extraSettings.vipMonthlyOriginalValue), description: "ارزش واقعی خدمات پلن VIP ماهانه (تومان)" }
        });
      }
      if (extraSettings.vipAnnualPrice !== undefined) {
        await prisma.systemSettings.upsert({
          where: { key: "vip_annual_price" },
          update: { value: String(extraSettings.vipAnnualPrice) },
          create: { key: "vip_annual_price", value: String(extraSettings.vipAnnualPrice), description: "قیمت سالانه پلن VIP (تومان)" }
        });
      }
      if (extraSettings.vipAnnualOriginalValue !== undefined) {
        await prisma.systemSettings.upsert({
          where: { key: "vip_annual_original_value" },
          update: { value: String(extraSettings.vipAnnualOriginalValue) },
          create: { key: "vip_annual_original_value", value: String(extraSettings.vipAnnualOriginalValue), description: "ارزش واقعی خدمات پلن VIP سالانه (تومان)" }
        });
      }
      if (extraSettings.promotionText !== undefined) {
        await prisma.systemSettings.upsert({
          where: { key: "pro_promotion_text" },
          update: { value: String(extraSettings.promotionText) },
          create: { key: "pro_promotion_text", value: String(extraSettings.promotionText), description: "متن بنر تبلیغاتی اشتراک" }
        });
      }
      if (extraSettings.promotionStart !== undefined) {
        await prisma.systemSettings.upsert({
          where: { key: "pro_promotion_start" },
          update: { value: String(extraSettings.promotionStart) },
          create: { key: "pro_promotion_start", value: String(extraSettings.promotionStart), description: "زمان شروع جشنواره تخفیف" }
        });
      }
      if (extraSettings.promotionEnd !== undefined) {
        await prisma.systemSettings.upsert({
          where: { key: "pro_promotion_end" },
          update: { value: String(extraSettings.promotionEnd) },
          create: { key: "pro_promotion_end", value: String(extraSettings.promotionEnd), description: "زمان پایان جشنواره تخفیف" }
        });
      }
      if (extraSettings.countdownVisible !== undefined) {
        await prisma.systemSettings.upsert({
          where: { key: "pro_countdown_visible" },
          update: { value: String(extraSettings.countdownVisible) },
          create: { key: "pro_countdown_visible", value: String(extraSettings.countdownVisible), description: "نمایش شمارش معکوس تخفیف" }
        });
      }
      if (extraSettings.featuredPlan !== undefined) {
        await prisma.systemSettings.upsert({
          where: { key: "pro_featured_plan" },
          update: { value: String(extraSettings.featuredPlan) },
          create: { key: "pro_featured_plan", value: String(extraSettings.featuredPlan), description: "پلن برجسته شده اشتراک (PRO_MONTHLY / PRO_ANNUAL)" }
        });
      }
      if (extraSettings.discountBadge !== undefined) {
        await prisma.systemSettings.upsert({
          where: { key: "pro_discount_badge" },
          update: { value: String(extraSettings.discountBadge) },
          create: { key: "pro_discount_badge", value: String(extraSettings.discountBadge), description: "برچسب تخفیف ویژه سالانه" }
        });
      }
      if (extraSettings.valueStackServices !== undefined) {
        await prisma.systemSettings.upsert({
          where: { key: "pro_value_stack_services" },
          update: { value: JSON.stringify(extraSettings.valueStackServices) },
          create: { key: "pro_value_stack_services", value: JSON.stringify(extraSettings.valueStackServices), description: "لیست خدمات ارزش پیشنهادی اشتراک پرو (JSON)" }
        });
      }
      if (extraSettings.promotionActionAfterExpiry !== undefined) {
        await prisma.systemSettings.upsert({
          where: { key: "pro_promotion_action_after_expiry" },
          update: { value: String(extraSettings.promotionActionAfterExpiry) },
          create: { key: "pro_promotion_action_after_expiry", value: String(extraSettings.promotionActionAfterExpiry), description: "عملیات بعد از اتمام جشنواره (NONE / HIDE_PROMOTION / HIDE_DISCOUNT_BADGE)" }
        });
      }
    }

    await prisma.auditTrail.create({
      data: {
        actorId: adminId,
        action: "UPDATE_SUBSCRIPTION_PRICES",
        resource: "SystemSettings",
        metadata: JSON.stringify({ monthlyPriceToman, annualPriceToman, ...extraSettings })
      }
    }).catch(() => {});

    return true;
  }

  /**
   * Admin list of all store subscriptions
   */
  static async adminGetSubscriptions(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.status && options.status !== "ALL") {
      where.status = options.status;
    }

    if (options.search && options.search.trim()) {
      const q = options.search.trim();
      where.user = {
        OR: [
          { storeName: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
          { mobile: { contains: q, mode: "insensitive" } },
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } }
        ]
      };
    }

    const [items, total] = await Promise.all([
      prisma.proAccount.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              storeName: true,
              mobile: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.proAccount.count({ where })
    ]);

    // Aggregate subscription revenue from paid invoices
    const revenueAggregate = await prisma.storeInvoice.aggregate({
      where: {
        status: "PAID",
        receiptNotes: { contains: "اشتراک" }
      },
      _sum: { totalAmount: true }
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      totalRevenueToman: revenueAggregate._sum.totalAmount || 0
    };
  }

  /**
   * Admin manual action (Activate, Expire, Extend)
   */
  static async adminManualAction(adminId: number, targetUserId: number, action: "ACTIVATE" | "EXPIRE" | "EXTEND", extensionDays: number = 30) {
    const pro = await prisma.proAccount.findUnique({ where: { userId: targetUserId } });
    const now = new Date();

    if (action === "EXPIRE") {
      const updated = await prisma.proAccount.update({
        where: { userId: targetUserId },
        data: { status: "EXPIRED" }
      });

      await prisma.auditTrail.create({
        data: {
          actorId: adminId,
          action: "ADMIN_EXPIRE_SUBSCRIPTION",
          resource: `ProAccount:${targetUserId}`
        }
      });

      return updated;
    }

    let startDate = pro?.startDate || now;
    let baseExp = (pro?.expiresAt && new Date(pro.expiresAt) > now) ? new Date(pro.expiresAt) : now;
    let newExpiresAt = new Date(baseExp.getTime() + extensionDays * 24 * 60 * 60 * 1000);

    const updated = await prisma.proAccount.upsert({
      where: { userId: targetUserId },
      update: {
        status: "ACTIVE",
        startDate,
        expiresAt: newExpiresAt,
        hostExpiresAt: newExpiresAt
      },
      create: {
        userId: targetUserId,
        status: "ACTIVE",
        startDate: now,
        expiresAt: newExpiresAt,
        hostExpiresAt: newExpiresAt,
        planType: "PRO_ANNUAL"
      }
    });

    await prisma.subscriptionEvent.create({
      data: {
        userId: targetUserId,
        proAccountId: updated.id,
        eventType: action === "EXTEND" ? "SUBSCRIPTION_RENEWED" : "SUBSCRIPTION_ACTIVATED",
        planType: updated.planType || "PRO_ANNUAL",
        amount: 0,
        durationMonths: Math.round(extensionDays / 30),
        startDate: updated.startDate,
        endDate: newExpiresAt,
        metadata: JSON.stringify({ adminAction: action, extensionDays, adminId })
      }
    });

    await prisma.auditTrail.create({
      data: {
        actorId: adminId,
        action: `ADMIN_${action}_SUBSCRIPTION`,
        resource: `ProAccount:${targetUserId}`,
        metadata: JSON.stringify({ extensionDays, newExpiresAt })
      }
    });

    return updated;
  }
}
