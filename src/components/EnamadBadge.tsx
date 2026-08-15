import React from "react";
import { ZopitLogo } from "./ZopitLogo";

// دقیقا همان کد HTML رسمی و خام که کاربر ارسال کرده است
const RAW_ENAMAD_HTML = `<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=714105&Code=kJCNZ7sYoHXP7CnRASeAmpAdtke8ZSHa'><img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=714105&Code=kJCNZ7sYoHXP7CnRASeAmpAdtke8ZSHa' alt='' style='cursor:pointer' code='kJCNZ7sYoHXP7CnRASeAmpAdtke8ZSHa'></a>`;

export function EnamadBadge({ 
  variant = "subtle_footer",
  className = "" 
}: { 
  variant?: "subtle_footer" | "raw";
  className?: string;
}) {
  if (variant === "raw") {
    return (
      <div 
        id="enamad-raw-block"
        className={className} 
        dangerouslySetInnerHTML={{ __html: RAW_ENAMAD_HTML }}
      />
    );
  }

  return (
    <footer
      id="auth-subtle-footer"
      className={`w-full max-w-5xl mx-auto mt-10 pt-6 pb-4 border-t border-border-default/40 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-5 text-xs text-text-muted ${className}`}
      dir="rtl"
    >
      {/* مشخصات سامانه و کپی‌رایت */}
      <div className="flex items-center gap-3">
        <ZopitLogo size="xs" />
        <div className="text-right">
          <span className="block font-bold text-text-primary text-[11px] tracking-tight">
            سامانه یکپارچه تامین و فروش کالا زوپیت
          </span>
          <span className="block text-[10px] text-text-muted mt-0.5">
            تمامی حقوق مادی و معنوی برای زوپیت محفوظ است.
          </span>
        </div>
      </div>

      {/* بخش رسمی نماد اعتماد الکترونیکی با درج مستقیم و بدون تغییر کد خام HTML ارسالی شما */}
      <div className="flex items-center gap-3 bg-white dark:bg-zinc-900/90 shadow-xs px-3.5 py-2 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
        <div 
          id="enamad-html-container"
          className="w-16 h-16 flex items-center justify-center [&_img]:w-full [&_img]:h-full [&_img]:object-contain"
          dangerouslySetInnerHTML={{ __html: RAW_ENAMAD_HTML }}
        />
        
        <div className="text-right leading-tight pr-1">
          <span className="font-bold text-text-primary text-[11px] block">
            نماد اعتماد الکترونیکی
          </span>
          <span className="block text-[9.5px] text-text-muted mt-0.5">
            مرکز توسعه تجارت الکترونیکی (وزارت صمت)
          </span>
          <span className="text-[9px] text-amber-600 dark:text-amber-400 font-semibold mt-1 block">
            جهت اطمینان روی لوگو کلیک نمایید
          </span>
        </div>
      </div>
    </footer>
  );
}
