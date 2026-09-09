import React from "react";
import {
  Coins,
  Plus,
  Trash2,
  TrendingDown,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from "lucide-react";
import { numberToWords } from "../../../utils/numberToWords";

export function toEnglishDigits(str: any): string {
  if (str === undefined || str === null) return "";
  return str.toString()
    .replace(/[,،٬\s]/g, "")
    .replace(/[۰-۹]/g, (d: string) => (d.charCodeAt(0) - 0x06f0).toString())
    .replace(/[٠-٩]/g, (d: string) => (d.charCodeAt(0) - 0x0660).toString());
}

export interface WholesaleTier {
  minQuantity: string;
  maxQuantity: string;
  unitPrice: string;
}

interface ProductWholesalePricingProps {
  isWholesaleEnabled: boolean;
  onToggleEnabled: (enabled: boolean) => void;
  supplierBasePrice: string;
  wholesaleTiers: WholesaleTier[];
  onChangeTiers: (tiers: WholesaleTier[]) => void;
}

export function ProductWholesalePricing({
  isWholesaleEnabled,
  onToggleEnabled,
  supplierBasePrice,
  wholesaleTiers,
  onChangeTiers,
}: ProductWholesalePricingProps) {
  const basePriceNum = parseFloat(toEnglishDigits(supplierBasePrice) || "0");

  const handleAddTier = () => {
    let nextMin = "10";
    if (wholesaleTiers.length > 0) {
      const lastTier = wholesaleTiers[wholesaleTiers.length - 1];
      const lastMin = parseInt(toEnglishDigits(lastTier.minQuantity) || "10", 10);
      nextMin = String(lastMin + 20);
    }
    const newTiers = [
      ...wholesaleTiers,
      { minQuantity: nextMin, maxQuantity: "", unitPrice: "" },
    ];
    onChangeTiers(newTiers);
  };

  const handleRemoveTier = (index: number) => {
    const newTiers = wholesaleTiers.filter((_, i) => i !== index);
    onChangeTiers(newTiers);
  };

  const handleUpdateTier = (
    index: number,
    field: keyof WholesaleTier,
    value: string
  ) => {
    const newTiers = [...wholesaleTiers];
    newTiers[index] = {
      ...newTiers[index],
      [field]: field === "unitPrice" ? toEnglishDigits(value) : value,
    };
    onChangeTiers(newTiers);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Enable Toggle Card */}
      <div className="bg-surface border border-subtle rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-500" />
            <h4 className="text-sm font-black text-primary">
              تخفیف پله‌ای خرید عمده (پیشنهادی برای افزایش تیراژ فروش)
            </h4>
          </div>
          <p className="text-xs text-secondary leading-relaxed">
            با تعیین قیمت کمتر برای سفارش‌های پرحجم، فروشگاه‌ها را به خرید کارتن کامل و تعداد بالا تشویق کنید.
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={isWholesaleEnabled}
            onChange={(e) => {
              onToggleEnabled(e.target.checked);
              if (e.target.checked && wholesaleTiers.length === 0) {
                onChangeTiers([
                  { minQuantity: "5", maxQuantity: "19", unitPrice: basePriceNum > 0 ? String(Math.round(basePriceNum * 0.95)) : "" },
                  { minQuantity: "20", maxQuantity: "", unitPrice: basePriceNum > 0 ? String(Math.round(basePriceNum * 0.90)) : "" },
                ]);
              }
            }}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          <span className="ms-3 text-xs font-bold text-primary">
            {isWholesaleEnabled ? "فعال است" : "غیرفعال"}
          </span>
        </label>
      </div>

      {/* Main Configuration Form if enabled */}
      {isWholesaleEnabled && (
        <div className="space-y-4 animate-fade-in">
          {/* Base Price Reference */}
          <div className="bg-primary-default/5 border border-primary-default/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-secondary">قیمت پایه تکی شما:</span>
              <span className="text-sm font-black text-primary">
                {basePriceNum > 0 ? `${Number(basePriceNum).toLocaleString("fa-IR")} تومان` : "هنوز وارد نشده"}
              </span>
            </div>
            <span className="text-[11px] text-muted font-medium">
              💡 قیمت هر واحد در پله‌های عمده باید کمتر از قیمت پایه تکی باشد.
            </span>
          </div>

          {/* Tiers Table */}
          <div className="space-y-3">
            {wholesaleTiers.map((tier, idx) => {
              const unitPriceNum = parseFloat(toEnglishDigits(tier.unitPrice) || "0");
              const discountPct = basePriceNum > 0 && unitPriceNum > 0 && unitPriceNum < basePriceNum
                ? Math.round(((basePriceNum - unitPriceNum) / basePriceNum) * 100)
                : 0;
              const isInvalidPrice = basePriceNum > 0 && unitPriceNum >= basePriceNum;

              return (
                <div
                  key={idx}
                  className="bg-surface border border-subtle rounded-2xl p-4 sm:p-5 space-y-3 transition-all hover:border-slate-300 dark:hover:border-slate-600"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary-default/10 text-primary-default text-xs font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-black text-primary">
                        پله تخفیف شماره {idx + 1}
                      </span>
                      {discountPct > 0 && (
                        <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          <span>{discountPct}٪ تخفیف نسبت به تک‌فروشی</span>
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveTier(idx)}
                      className="p-1.5 rounded-lg text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer"
                      title="حذف این پله"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-secondary mb-1">
                        از تعداد (حداقل سفارش) *
                      </label>
                      <input
                        type="number"
                        min="2"
                        value={tier.minQuantity}
                        onChange={(e) => handleUpdateTier(idx, "minQuantity", e.target.value)}
                        placeholder="مثال: ۱۰"
                        className="w-full px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-primary-default"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-secondary mb-1">
                        تا تعداد (اختیاری)
                      </label>
                      <input
                        type="number"
                        min="2"
                        value={tier.maxQuantity}
                        onChange={(e) => handleUpdateTier(idx, "maxQuantity", e.target.value)}
                        placeholder="مثال: ۵۰ یا خالی (نامحدود)"
                        className="w-full px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-medium text-primary outline-none focus:ring-2 focus:ring-primary-default"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-secondary mb-1">
                        قیمت هر عدد در این تیراژ (تومان) *
                      </label>
                      <input
                        type="text"
                        value={tier.unitPrice ? Number(toEnglishDigits(tier.unitPrice)).toLocaleString("fa-IR") : ""}
                        onChange={(e) => handleUpdateTier(idx, "unitPrice", e.target.value)}
                        placeholder="مثال: ۲۸۰,۰۰۰"
                        className={`w-full px-3 py-2 bg-background border rounded-xl text-xs font-black outline-none focus:ring-2 ${
                          isInvalidPrice
                            ? "border-rose-500 text-rose-600 focus:ring-rose-500"
                            : "border-subtle text-primary focus:ring-primary-default"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Helpers / Validations */}
                  {unitPriceNum > 0 && (
                    <div className="flex flex-wrap items-center justify-between text-[11px] pt-1">
                      <span className="text-muted font-medium">
                        معادل حروفی: {numberToWords(unitPriceNum)} تومان
                      </span>
                      {isInvalidPrice && (
                        <span className="text-rose-600 font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>قیمت عمده باید کمتر از قیمت پایه ({Number(basePriceNum).toLocaleString("fa-IR")} تومان) باشد.</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Tier Button */}
          <button
            type="button"
            onClick={handleAddTier}
            className="w-full py-3 border-2 border-dashed border-subtle hover:border-primary-default rounded-2xl text-xs font-bold text-secondary hover:text-primary-default transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-primary-default/5"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن پله تخفیف بعدی (مثلاً برای تعداد بالاتر)</span>
          </button>
        </div>
      )}
    </div>
  );
}
