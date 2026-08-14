import React from "react";

// Universal English to Persian status dictionary
export const STATUS_PERSIAN_MAP: Record<string, string> = {
  // General & Product Statuses
  ACTIVE: "فعال",
  ACTIVE_NEW: "فعال (جدید)",
  PUBLISHED: "منتشر شده",
  PENDING: "در انتظار بررسی",
  PENDING_APPROVAL: "در انتظار تایید",
  WAITING_FOR_APPROVAL: "در انتظار تایید",
  NEW: "جدید",
  DRAFT: "پیش‌نویس",
  SUSPENDED: "در انتظار تایید",
  TEMPORARILY_SUSPENDED: "تعلیق موقت",
  UNDER_REVIEW: "در حال بازبینی",
  WARNING: "دارای اخطار",
  REJECTED: "رد شده",
  BLOCKED: "مسدود شده",
  OUT_OF_STOCK: "ناموجود",
  ARCHIVED: "بایگانی شده",

  // Orders Statuses
  WAITING_SUPPLIER_CONFIRMATION: "۱. در انتظار تایید تأمین‌کننده",
  REQUESTED: "۱. در انتظار تایید تأمین‌کننده",
  WAITING_STORE_ADDRESS: "۲. در انتظار ثبت آدرس",
  WAITING_SHIPPING_COST: "۳. در انتظار برآورد هزینه پستی",
  PENDING_PAYMENT: "۴. در انتظار پرداخت",
  WAITING_FOR_PAYMENT: "۴. در انتظار پرداخت",
  WAITING_SHIPPING_PAYMENT: "۴. در انتظار پرداخت",
  SUPPLIER_APPROVED: "۱. در انتظار تایید تأمین‌کننده",
  PAID: "۵. در انتظار لیبل پستی",
  PENDING_POSTAL_LABEL: "۵. در انتظار لیبل پستی",
  READY_TO_SHIP: "۵. در انتظار لیبل پستی",
  PROCESSING: "۶. تکمیل شده و باید ارسال شود",
  PREPARING: "۵. در انتظار لیبل پستی",
  SHIPPED: "۶. تکمیل شده و باید ارسال شود",
  DELIVERED: "۶. تکمیل شده و باید ارسال شود",
  COMPLETED: "۶. تکمیل شده و باید ارسال شود",
  SUCCESS: "موفق",
  CANCELLED: "لغو شده",
  FAILED: "ناموفق",
  RETURNED: "مرجوع شده",

  // Financial & Settlement Statuses
  SETTLED: "تسویه شده",
  IN_ESCROW: "امانت در صندوق زوپیت",
  REFUNDED: "مسترد شده به حساب",

  // Support Tickets
  OPEN: "در جریان بررسی",
  ANSWERED: "پاسخ داده شده",
  CLOSED: "مختومه شده",
  RESOLVED: "حل شده",

  // Account verification
  APPROVED: "تایید شده",
  UNVERIFIED: "احراز هویت نشده",
  VERIFIED: "احراز هویت شده"
};

/**
 * Returns clean Persian text for any system status code.
 * Guaranteed never to return English terms.
 */
export function getPersianStatus(status: string | undefined | null, fallback = "نامشخص"): string {
  if (!status) return fallback;
  const key = String(status).trim().toUpperCase();
  return STATUS_PERSIAN_MAP[key] || fallback;
}

/**
 * Generates an exclusive, privacy-preserving supplier identification code
 * e.g. "تامین‌کننده کد SUP-1048"
 */
export function formatSupplierCode(supplierId: number | string | undefined | null): string {
  if (!supplierId) return "تامین‌کننده کد SUP-1001";
  const num = parseInt(String(supplierId).replace(/\D/g, "")) || 1001;
  const padded = num < 1000 ? String(1000 + num) : String(num);
  return `تامین‌کننده کد SUP-${padded}`;
}

/**
 * Generates supplier location string (Province + City)
 */
export function formatSupplierLocation(province?: string | null, city?: string | null): string {
  const p = province && province.trim() ? province.trim() : "تهران";
  const c = city && city.trim() ? city.trim() : "تهران";
  return `استان ${p}، شهر ${c}`;
}

/**
 * High-contrast, sharp and distinct status badge component
 * Avoids washed out / faded opacity that blends into backgrounds.
 */
export function HighContrastStatusBadge({
  status,
  customLabel,
  size = "md",
  className = ""
}: {
  status: string;
  customLabel?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const norm = String(status || "PENDING").trim().toUpperCase();
  const label = customLabel || STATUS_PERSIAN_MAP[norm] || "نامشخص";

  // High contrast palette with solid borders and rich text
  let styleClasses = "bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600";

  if (["ACTIVE", "PUBLISHED", "APPROVED", "SUCCESS", "COMPLETED", "PAID", "DELIVERED", "SETTLED", "VERIFIED"].includes(norm)) {
    // Vibrant Emerald / Success
    styleClasses = "bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700 shadow-sm";
  } else if (["PENDING", "PENDING_APPROVAL", "WAITING_FOR_APPROVAL", "REQUESTED", "NEW", "WAITING_SHIPPING_COST", "PENDING_PAYMENT", "WAITING_FOR_PAYMENT", "WAITING_SHIPPING_PAYMENT", "UNDER_REVIEW", "WARNING", "SUSPENDED"].includes(norm)) {
    // Vibrant Amber / Warning
    styleClasses = "bg-amber-50 text-amber-950 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700 shadow-sm";
  } else if (["REJECTED", "FAILED", "CANCELLED", "BLOCKED", "TEMPORARILY_SUSPENDED", "OUT_OF_STOCK"].includes(norm)) {
    // Vibrant Crimson / Danger
    styleClasses = "bg-rose-50 text-rose-950 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-700 shadow-sm";
  } else if (["PROCESSING", "PREPARING", "SHIPPED", "SUPPLIER_APPROVED", "PENDING_POSTAL_LABEL", "IN_ESCROW"].includes(norm)) {
    // Vibrant Indigo / Process
    styleClasses = "bg-blue-50 text-blue-950 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-700 shadow-sm";
  }

  const sizeClasses = size === "sm" 
    ? "px-2 py-0.5 text-[11px] font-bold" 
    : size === "lg" 
    ? "px-3.5 py-1.5 text-sm font-black" 
    : "px-2.5 py-1 text-xs font-extrabold";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-lg border whitespace-nowrap tracking-tight transition-colors ${sizeClasses} ${styleClasses} ${className}`}
    >
      {label}
    </span>
  );
}
