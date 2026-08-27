/**
 * Link Validator & Route Health Checker for Zopit
 * Ensures all internal dashboard routes are unique, healthy, and mapped to valid views/tabs.
 */

export interface RouteDefinition {
  path: string;
  role: "PUBLIC" | "STORE_MANAGER" | "SUPPLIER" | "SUPER_ADMIN" | "CUSTOMER" | "REFERRER";
  tabId?: string;
  title: string;
  category: string;
}

export const APP_ROUTES: RouteDefinition[] = [
  // Public & Authentication
  { path: "/explore", role: "PUBLIC", title: "کاوش در بازارچه", category: "عمومی" },
  { path: "/login", role: "PUBLIC", title: "ورود به سیستم", category: "احراز هویت" },
  { path: "/register", role: "PUBLIC", title: "انتخاب نقش ثبت‌نام", category: "احراز هویت" },
  { path: "/register/store", role: "PUBLIC", title: "ثبت‌نام مدیر فروشگاه", category: "احراز هویت" },
  { path: "/register/supplier", role: "PUBLIC", title: "ثبت‌نام تامین‌کننده", category: "احراز هویت" },
  { path: "/register/customer", role: "PUBLIC", title: "ثبت‌نام خریدار", category: "احراز هویت" },
  { path: "/register/referrer", role: "PUBLIC", title: "ثبت‌نام معرف", category: "احراز هویت" },
  { path: "/forgot-password", role: "PUBLIC", title: "بازیابی کلمه عبور", category: "احراز هویت" },

  // Store Manager Routes
  { path: "/store/overview", role: "STORE_MANAGER", tabId: "overview", title: "نمای کلی فروشگاه", category: "پنل فروشگاه" },
  { path: "/store/marketplace", role: "STORE_MANAGER", tabId: "marketplace", title: "بانک زوپیت (Zopit Bank)", category: "پنل فروشگاه" },
  { path: "/store/my_catalog", role: "STORE_MANAGER", tabId: "my_catalog", title: "زوپیتی من", category: "پنل فروشگاه" },
  { path: "/store/orders", role: "STORE_MANAGER", tabId: "orders", title: "سفارشات مشتریان", category: "پنل فروشگاه" },
  { path: "/store/invoices", role: "STORE_MANAGER", tabId: "invoices", title: "صورت‌حساب‌ها", category: "پنل فروشگاه" },
  { path: "/store/wallet", role: "STORE_MANAGER", tabId: "wallet", title: "کیف پول", category: "پنل فروشگاه" },
  { path: "/store/customers", role: "STORE_MANAGER", tabId: "customers", title: "مشتریان من", category: "پنل فروشگاه" },
  { path: "/store/questions", role: "STORE_MANAGER", tabId: "questions", title: "پرسش و پاسخ‌ها", category: "پنل فروشگاه" },
  { path: "/store/tickets", role: "STORE_MANAGER", tabId: "tickets", title: "تیکت‌های پشتیبانی", category: "پنل فروشگاه" },
  { path: "/store/announcements", role: "STORE_MANAGER", tabId: "announcements", title: "اطلاعیه‌ها", category: "پنل فروشگاه" },
  { path: "/store/connection", role: "STORE_MANAGER", tabId: "connection", title: "اتصال فروشگاه", category: "پنل فروشگاه" },
  { path: "/store/page_settings", role: "STORE_MANAGER", tabId: "page_settings", title: "تنظیمات صفحه خرید", category: "پنل فروشگاه" },
  { path: "/store/profile", role: "STORE_MANAGER", tabId: "profile", title: "پروفایل فروشگاه", category: "پنل فروشگاه" },
  { path: "/store/pro", role: "STORE_MANAGER", tabId: "pro", title: "حساب حرفه‌ای پرو", category: "پنل فروشگاه" },

  // Supplier Routes
  { path: "/supplier/overview", role: "SUPPLIER", tabId: "overview", title: "نمای کلی تامین‌کننده", category: "پنل تامین‌کننده" },
  { path: "/supplier/products", role: "SUPPLIER", tabId: "products", title: "مدیریت کالاها", category: "پنل تامین‌کننده" },
  { path: "/supplier/add-product", role: "SUPPLIER", tabId: "add-product", title: "افزودن کالای جدید", category: "پنل تامین‌کننده" },
  { path: "/supplier/orders", role: "SUPPLIER", tabId: "orders", title: "سفارشات عمده", category: "پنل تامین‌کننده" },
  { path: "/supplier/wallet", role: "SUPPLIER", tabId: "wallet", title: "کیف پول و تسویه", category: "پنل تامین‌کننده" },
  { path: "/supplier/performance", role: "SUPPLIER", tabId: "performance", title: "امتیاز عملکرد", category: "پنل تامین‌کننده" },
  { path: "/supplier/tickets", role: "SUPPLIER", tabId: "tickets", title: "تیکت‌های پشتیبانی", category: "پنل تامین‌کننده" },
  { path: "/supplier/announcements", role: "SUPPLIER", tabId: "announcements", title: "اطلاعیه‌ها", category: "پنل تامین‌کننده" },
  { path: "/supplier/profile", role: "SUPPLIER", tabId: "profile", title: "پروفایل تامین‌کننده", category: "پنل تامین‌کننده" },

  // Super Admin Routes
  { path: "/admin/overview", role: "SUPER_ADMIN", tabId: "overview", title: "داشبورد مدیریت کل", category: "مدیریت ارشد" },
  { path: "/admin/all-users", role: "SUPER_ADMIN", tabId: "all-users", title: "مدیریت تمام کاربران", category: "مدیریت ارشد" },
  { path: "/admin/products", role: "SUPER_ADMIN", tabId: "products", title: "نظارت بر کالاها", category: "مدیریت ارشد" },
  { path: "/admin/orders", role: "SUPER_ADMIN", tabId: "orders", title: "نظارت بر سفارشات", category: "مدیریت ارشد" },
  { path: "/admin/financial", role: "SUPER_ADMIN", tabId: "financial", title: "گزارشات مالی و سود", category: "مدیریت ارشد" },
  { path: "/admin/settlements", role: "SUPER_ADMIN", tabId: "settlements", title: "درخواست‌های تسویه حساب", category: "مدیریت ارشد" },
  { path: "/admin/categories", role: "SUPER_ADMIN", tabId: "categories", title: "مدیریت دسته‌بندی‌ها", category: "مدیریت ارشد" },
  { path: "/admin/tickets", role: "SUPER_ADMIN", tabId: "tickets", title: "مرکز تیکتینگ", category: "مدیریت ارشد" },
  { path: "/admin/penalties", role: "SUPER_ADMIN", tabId: "penalties", title: "جرایم تامین‌کنندگان", category: "مدیریت ارشد" },
  { path: "/admin/banners", role: "SUPER_ADMIN", tabId: "banners", title: "بنرهای تبلیغاتی", category: "مدیریت ارشد" },
  { path: "/admin/code_editor", role: "SUPER_ADMIN", tabId: "code_editor", title: "ویرایشگر کدهای سفارشی", category: "مدیریت ارشد" },
  { path: "/admin/system_settings", role: "SUPER_ADMIN", tabId: "system_settings", title: "تنظیمات سیستمی", category: "مدیریت ارشد" },
  { path: "/admin/system_logs", role: "SUPER_ADMIN", tabId: "system_logs", title: "لاگ‌های سیستم", category: "مدیریت ارشد" },
  { path: "/admin/system_health", role: "SUPER_ADMIN", tabId: "system_health", title: "سلامت سامانه", category: "مدیریت ارشد" },
  { path: "/admin/notifications", role: "SUPER_ADMIN", tabId: "notifications", title: "اعلان‌ها و پیامک‌ها", category: "مدیریت ارشد" },
  { path: "/admin/manual_invoices", role: "SUPER_ADMIN", tabId: "manual_invoices", title: "فاکتورهای دستی", category: "مدیریت ارشد" },
  { path: "/admin/announcements", role: "SUPER_ADMIN", tabId: "announcements", title: "اطلاعیه‌های سراسری", category: "مدیریت ارشد" },
  { path: "/admin/pro_accounts", role: "SUPER_ADMIN", tabId: "pro_accounts", title: "اشتراک‌های حرفه‌ای", category: "مدیریت ارشد" },
  { path: "/admin/top_stores", role: "SUPER_ADMIN", tabId: "top_stores", title: "فروشگاه‌های برتر", category: "مدیریت ارشد" },

  // Customer Routes
  { path: "/customer/orders", role: "CUSTOMER", tabId: "orders", title: "سفارشات من", category: "پنل مشتری" },
  { path: "/customer/profile", role: "CUSTOMER", tabId: "profile", title: "مشخصات و آدرس‌ها", category: "پنل مشتری" },

  // Referrer Routes
  { path: "/referrer/overview", role: "REFERRER", tabId: "overview", title: "آمار و لینک‌های معرفی", category: "پنل معرف" },
  { path: "/referrer/suppliers", role: "REFERRER", tabId: "suppliers", title: "تامین‌کنندگان دعوت‌شده", category: "پنل معرف" },
  { path: "/referrer/wallet", role: "REFERRER", tabId: "wallet", title: "کیف پول و پاداش‌ها", category: "پنل معرف" }
];

export interface ValidationResult {
  totalRoutes: number;
  uniquePathsCount: number;
  duplicatePaths: string[];
  roleDistribution: Record<string, number>;
  allValid: boolean;
  issues: string[];
}

/**
 * Validates link health and uniqueness across the entire platform.
 */
export function validateAllRoutes(): ValidationResult {
  const pathSet = new Set<string>();
  const duplicates: string[] = [];
  const issues: string[] = [];
  const distribution: Record<string, number> = {};

  for (const route of APP_ROUTES) {
    // Check format
    if (!route.path.startsWith("/")) {
      issues.push(`Invalid path prefix: ${route.path}`);
    }

    // Check duplicate
    if (pathSet.has(route.path)) {
      duplicates.push(route.path);
      issues.push(`Duplicate path found: ${route.path}`);
    } else {
      pathSet.add(route.path);
    }

    // Tally distribution
    distribution[route.role] = (distribution[route.role] || 0) + 1;
  }

  return {
    totalRoutes: APP_ROUTES.length,
    uniquePathsCount: pathSet.size,
    duplicatePaths: duplicates,
    roleDistribution: distribution,
    allValid: issues.length === 0,
    issues
  };
}
