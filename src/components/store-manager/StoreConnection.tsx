import React from "react";
import { Store, ShieldAlert, Info } from "lucide-react";

export default function StoreConnection() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in py-8" dir="rtl">
      <div className="bg-card border border-border-subtle rounded-3xl p-8 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-primary">
            اتصال به فروشگاه‌ها و ووکامرس (غیرفعال)
          </h2>
          <p className="text-xs md:text-sm text-secondary leading-relaxed max-w-xl mx-auto">
            بخش اتصال مستقیم به ووکامرس و فروشگاه‌های جانبی در حال حاضر بنا به درخواست مدیریت سیستم غیرفعال گردیده است.
          </p>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-subtle max-w-lg mx-auto text-xs text-muted flex items-start gap-3 text-right">
          <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            تمامی محصولات و سفارشات مستقیماً از طریق بانک اختصاصی زوپیت و پنل مدیریت زوپیت پردازش و پیگیری می‌گردند. در صورت نیاز به اتصال مجدد، این امکان از سمت مدیریت فعال خواهد شد.
          </p>
        </div>
      </div>
    </div>
  );
}
