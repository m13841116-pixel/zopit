import React from "react";
import { ShieldCheck } from "lucide-react";
import { ZopitLogo } from "./ZopitLogo";

export function EnamadBadge({ 
  variant = "subtle_footer",
  className = "" 
}: { 
  variant?: "subtle_footer" | "minimal_icon" | "raw";
  className?: string;
}) {
  const enamadUrl = "https://trustseal.enamad.ir/?id=714105&Code=kJCNZ7sYoHXP7CnRASeAmpAdtke8ZSHa";
  const enamadImg = "https://trustseal.enamad.ir/logo.aspx?id=714105&Code=kJCNZ7sYoHXP7CnRASeAmpAdtke8ZSHa";
  const enamadCode = "kJCNZ7sYoHXP7CnRASeAmpAdtke8ZSHa";

  const handleOpenEnamad = (e: React.MouseEvent) => {
    // باز کردن استاندارد برای اطمینان از عملکرد در کلیه محیط‌ها از جمله iframe
    window.open(enamadUrl, "_blank", "noopener,noreferrer");
  };

  if (variant === "raw") {
    return (
      <a
        referrerPolicy="origin"
        target="_blank"
        rel="noopener noreferrer"
        href={enamadUrl}
        onClick={handleOpenEnamad}
      >
        <img
          referrerPolicy="origin"
          src={enamadImg}
          alt="نماد اعتماد الکترونیکی"
          style={{ cursor: "pointer" }}
          {...{ code: enamadCode }}
        />
      </a>
    );
  }

  // Default clean, discreet footer sitting naturally on the dotted auth background
  return (
    <footer
      id="auth-subtle-footer"
      className={`w-full max-w-5xl mx-auto mt-8 pt-6 pb-2 border-t border-border-default/40 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted ${className}`}
      dir="rtl"
    >
      <div className="flex items-center gap-3">
        <ZopitLogo size="xs" />
        <div className="text-right">
          <span className="block font-bold text-text-primary text-[11px]">سامانه یکپارچه زنجیره تامین و فروش کالا زوپیت</span>
          <span className="block text-[10px] text-text-muted">تمامی حقوق برای زوپیت محفوظ است.</span>
        </div>
      </div>

      {/* Discreet Enamad Trust Badge with exact official Enamad tag and attributes */}
      <div className="flex items-center gap-2.5 bg-card/60 dark:bg-zinc-900/60 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-border-default/40 dark:border-white/5">
        <a
          id="enamad-trust-seal-link"
          referrerPolicy="origin"
          target="_blank"
          rel="noopener noreferrer"
          href={enamadUrl}
          onClick={handleOpenEnamad}
          className="w-9 h-9 rounded-lg flex items-center justify-center transition-all opacity-85 hover:opacity-100 hover:scale-105 cursor-pointer"
          title="مشاهده تاییدیه اینماد"
        >
          <img
            referrerPolicy="origin"
            src={enamadImg}
            alt="نماد اعتماد الکترونیکی"
            className="w-full h-full object-contain cursor-pointer"
            style={{ cursor: "pointer" }}
            {...{ code: enamadCode }}
          />
        </a>
        <div className="text-right text-[10px] leading-tight">
          <span className="font-semibold text-text-primary flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-500/80" />
            دارای نماد اعتماد الکترونیکی
          </span>
          <span className="text-text-muted text-[9px]">مرکز توسعه تجارت الکترونیکی</span>
        </div>
      </div>
    </footer>
  );
}
