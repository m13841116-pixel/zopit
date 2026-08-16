import React, { useState, useEffect } from "react";
import { toast } from "../GlobalToast";
import { 
  Ticket, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  Sparkles, 
  Clock, 
  Calendar, 
  Percent, 
  Coins, 
  Search,
  Zap,
  Info
} from "lucide-react";

export default function SuperAdminDiscountCodes() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [type, setType] = useState("PERCENTAGE");
  const [value, setValue] = useState("100");
  const [maxUses, setMaxUses] = useState("10");
  const [expiryPreset, setExpiryPreset] = useState("7days"); // today, 3days, 7days, 30days, never
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchDiscounts = async () => {
    try {
      const res = await fetch("/api/admin/discounts", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      setDiscounts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchDiscounts(); 
  }, []);

  const calculateExpiryDate = (preset: string) => {
    if (preset === "never") return null;
    const date = new Date();
    if (preset === "today") {
      date.setHours(23, 59, 59, 999);
      return date.toISOString();
    }
    if (preset === "3days") {
      date.setDate(date.getDate() + 3);
      return date.toISOString();
    }
    if (preset === "7days") {
      date.setDate(date.getDate() + 7);
      return date.toISOString();
    }
    if (preset === "30days") {
      date.setDate(date.getDate() + 30);
      return date.toISOString();
    }
    return null;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCode = code.trim().toUpperCase();
    if (!finalCode) {
      toast("لطفاً کد تخفیف را وارد کنید", "error");
      return;
    }

    try {
      const expiryDate = calculateExpiryDate(expiryPreset);
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          code: finalCode,
          discountType: type,
          discountValue: parseFloat(value),
          maxUses: maxUses ? parseInt(maxUses) : null,
          expiryDate
        })
      });
      if (res.ok) {
        toast(`کد تخفیف ${finalCode} با موفقیت صادر شد.`, "success");
        setCode("");
        fetchDiscounts();
      } else {
        const d = await res.json();
        toast(d.error || "خطا در ایجاد کد تخفیف", "error");
      }
    } catch (err) {
      toast("خطا در ارتباط با سرور", "error");
    }
  };

  const applyPreset = (presetType: "100_FREE" | "50_PERCENT" | "FIXED_200K") => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    if (presetType === "100_FREE") {
      setCode(`PRO-FREE-${randomSuffix}`);
      setType("PERCENTAGE");
      setValue("100");
      setMaxUses("10");
      setExpiryPreset("7days");
      toast("الگوی کد ۱۰۰٪ رایگان اولیه (۱۰ اکانت) تنظیم شد.", "success");
    } else if (presetType === "50_PERCENT") {
      setCode(`PRO-50-${randomSuffix}`);
      setType("PERCENTAGE");
      setValue("50");
      setMaxUses("20");
      setExpiryPreset("7days");
      toast("الگوی کد ۵۰٪ تخفیف (۲۰ اکانت) تنظیم شد.", "success");
    } else if (presetType === "FIXED_200K") {
      setCode(`PRO-200K-${randomSuffix}`);
      setType("FIXED");
      setValue("200000");
      setMaxUses("10");
      setExpiryPreset("3days");
      toast("الگوی تخفیف ۲۰۰,۰۰۰ تومانی تنظیم شد.", "success");
    }
  };

  const handleCopy = (discount: any) => {
    navigator.clipboard.writeText(discount.code);
    setCopiedId(discount.id);
    toast(`کد ${discount.code} کپی شد`, "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این کد تخفیف اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        toast("کد تخفیف حذف شد", "success");
        fetchDiscounts();
      }
    } catch (err) {
      toast("خطا در حذف", "error");
    }
  };

  const toggleStatus = async (id: number, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ isActive: !isActive })
      });
      if (res.ok) {
        toast(isActive ? "کد تخفیف غیرفعال شد" : "کد تخفیف فعال شد", "success");
        fetchDiscounts();
      }
    } catch (err) {
      toast("خطا در تغییر وضعیت", "error");
    }
  };

  const filteredDiscounts = discounts.filter(d => 
    d.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalUsed = discounts.reduce((acc, d) => acc + (d.usedCount || 0), 0);
  const activeCount = discounts.filter(d => d.isActive).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">مدیریت کدهای تخفیف اکانت پرو (کوپن)</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              تعریف کوپن‌های تخفیف درصدی و مبلغ ثابت برای ثبت‌نام اولیه اکانت پرو با محدودیت تعداد و زمان
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 self-stretch sm:self-auto">
          <div className="bg-card border border-border px-4 py-2 rounded-2xl text-center shadow-xs">
            <span className="text-[10px] text-muted block font-bold">کدهای فعال</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">{activeCount}</span>
          </div>
          <div className="bg-card border border-border px-4 py-2 rounded-2xl text-center shadow-xs">
            <span className="text-[10px] text-muted block font-bold">مجموع استفاده</span>
            <span className="text-sm font-black text-purple-600 dark:text-purple-400 font-mono">{totalUsed} بار</span>
          </div>
        </div>
      </div>

      {/* Scope Info Box */}
      <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-2xl flex items-start gap-3 text-xs text-purple-700 dark:text-purple-300">
        <Info className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-primary">نکته مهم در محاسبات مالی:</strong> تمامی این کدهای تخفیف صرفاً بر روی <strong>هزینه اولیه ثبت‌نام اکانت پرو</strong> (مبلغ پایه تنظیم‌شده توسط مدیر) اعمال می‌شوند و مشمول هزینه تمدید سالانه هاست یا اتصال ترب نمی‌گردند. در صورت استفاده از کد ۱۰۰٪ رایگان، اکانت کاربر به صورت آنی و بدون نیاز به درگاه پرداخت تایید خواهد شد.
        </p>
      </div>

      {/* Quick Presets Bar */}
      <div className="bg-surface border border-subtle rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-black text-primary">الگوهای سریع صدور کد (Presets):</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => applyPreset("100_FREE")}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer hover:scale-102"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>🎁 کد ۱۰۰٪ رایگان اولیه (۱۰ اکانت - ۷ روزه)</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset("50_PERCENT")}
            className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer hover:scale-102"
          >
            <Percent className="w-3.5 h-3.5 text-purple-500" />
            <span>⚡ کد ۵۰٪ تخفیف اولیه (۲۰ اکانت)</span>
          </button>
          <button
            type="button"
            onClick={() => applyPreset("FIXED_200K")}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer hover:scale-102"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>🏷️ تخفیف ۲۰۰,۰۰۰ تومانی (۱۰ اکانت - ۳ روزه)</span>
          </button>
        </div>
      </div>

      {/* Create New Discount Code Form */}
      <div className="bg-card rounded-3xl p-6 border border-border-subtle shadow-sm">
        <h3 className="font-black text-primary text-sm mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-500" />
          <span>صدور کد تخفیف جدید برای هزینه نهایی</span>
        </h3>
        
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-secondary mb-1.5">
                کد تخفیف (لاتین)
              </label>
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="مثال: PRO-FREE-100"
                className="w-full bg-background border border-subtle rounded-xl px-3.5 py-2.5 text-xs text-left dir-ltr text-emerald-600 dark:text-emerald-400 font-mono font-bold focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-secondary mb-1.5">
                نوع تخفیف
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-background border border-subtle rounded-xl px-3.5 py-2.5 text-xs text-primary font-bold focus:border-emerald-500 outline-none"
              >
                <option value="PERCENTAGE">درصدی (%)</option>
                <option value="FIXED">مبلغ ثابت (تومان)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-secondary mb-1.5">
                مقدار تخفیف {type === "PERCENTAGE" ? "(درصد از ۱ تا ۱۰۰)" : "(تومان)"}
              </label>
              <input
                required
                type="number"
                min="1"
                max={type === "PERCENTAGE" ? "100" : undefined}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-background border border-subtle rounded-xl px-3.5 py-2.5 text-xs text-center text-primary font-bold focus:border-emerald-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-secondary mb-1.5">
                سقف مجاز استفاده (تعداد اکانت)
              </label>
              <input
                type="number"
                min="1"
                placeholder="خالی = نامحدود"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-full bg-background border border-subtle rounded-xl px-3.5 py-2.5 text-xs text-center text-primary font-bold focus:border-emerald-500 outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-secondary mb-1.5">
                مدت زمان اعتبار
              </label>
              <select
                value={expiryPreset}
                onChange={(e) => setExpiryPreset(e.target.value)}
                className="w-full bg-background border border-subtle rounded-xl px-3.5 py-2.5 text-xs text-primary font-bold focus:border-emerald-500 outline-none"
              >
                <option value="today">فقط تا پایان امروز (۲۴ ساعت)</option>
                <option value="3days">تا ۳ روز آینده</option>
                <option value="7days">تا ۷ روز آینده (۱ هفته)</option>
                <option value="30days">تا ۳۰ روز آینده (۱ ماه)</option>
                <option value="never">بدون تاریخ انقضا (همیشگی)</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-2.5 px-6 rounded-xl flex items-center gap-2 text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ایجاد و فعال‌سازی کد تخفیف</span>
            </button>
          </div>
        </form>
      </div>

      {/* List Table */}
      <div className="bg-card rounded-3xl border border-border-subtle shadow-sm overflow-hidden">
        <div className="p-4 border-b border-subtle flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="font-black text-primary text-sm">لیست کدهای تخفیف صادر شده</h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-muted absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="جستجوی کد تخفیف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-subtle rounded-xl pr-9 pl-3 py-1.5 text-xs text-primary placeholder-muted outline-none focus:border-purple-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="px-4 py-3.5">کد تخفیف</th>
                <th className="px-4 py-3.5">نوع و ارزش تخفیف</th>
                <th className="px-4 py-3.5">تعداد مصرف شده</th>
                <th className="px-4 py-3.5">مهلت انقضا</th>
                <th className="px-4 py-3.5 text-center">وضعیت</th>
                <th className="px-4 py-3.5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle text-primary">
              {filteredDiscounts.map((d) => {
                const isExpired = d.expiryDate && new Date(d.expiryDate) < new Date();
                const isExhausted = d.maxUses && d.usedCount >= d.maxUses;
                const isValid = d.isActive && !isExpired && !isExhausted;

                return (
                  <tr key={d.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm bg-surface px-2.5 py-1 rounded-lg border border-subtle" dir="ltr">
                          {d.code}
                        </span>
                        <button
                          onClick={() => handleCopy(d)}
                          title="کپی کردن کد"
                          className="p-1.5 text-muted hover:text-primary bg-surface hover:bg-subtle rounded-lg transition-all"
                        >
                          {copiedId === d.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold">
                        {d.discountType === "PERCENTAGE" ? (
                          <span className="text-purple-600 dark:text-purple-400 font-mono text-sm">{d.discountValue}٪ تخفیف</span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-mono text-sm">{d.discountValue?.toLocaleString("fa-IR")} تومان</span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-mono">
                      <span className={isExhausted ? "text-rose-500 font-bold" : "text-secondary"}>
                        {d.usedCount || 0} / {d.maxUses ? `${d.maxUses} اکانت` : "نامحدود"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-muted">
                      {d.expiryDate ? (
                        <span className={`flex items-center gap-1 ${isExpired ? "text-rose-500 font-bold" : "text-secondary"}`}>
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(d.expiryDate).toLocaleDateString("fa-IR")}
                          {isExpired && " (منقضی شده)"}
                        </span>
                      ) : (
                        <span className="text-muted">همیشگی (بدون انقضا)</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => toggleStatus(d.id, d.isActive)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer ${
                          isValid
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {d.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>فعال</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>غیرفعال</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="حذف کد"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredDiscounts.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted">
                    هیچ کد تخفیفی یافت نشد. می‌توانید با دکمه‌های الگوهای سریع، اولین کد تخفیف را صادر کنید.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
