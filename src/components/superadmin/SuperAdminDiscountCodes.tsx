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
  Info,
  Globe,
  Lock,
  Crown,
  Layers,
  Tag
} from "lucide-react";

export default function SuperAdminDiscountCodes() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [value, setValue] = useState("100");
  const [applicablePlan, setApplicablePlan] = useState<"ALL" | "PRO" | "PRO_MAX">("ALL");
  const [isPublic, setIsPublic] = useState(false);
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
          title: title.trim() || undefined,
          discountType: type,
          discountValue: parseFloat(value),
          applicablePlan,
          isPublic,
          maxUses: maxUses ? parseInt(maxUses) : null,
          expiryDate
        })
      });
      if (res.ok) {
        toast(`کد تخفیف ${finalCode} با موفقیت صادر شد.`, "success");
        setCode("");
        setTitle("");
        fetchDiscounts();
      } else {
        const d = await res.json();
        toast(d.error || "خطا در ایجاد کد تخفیف", "error");
      }
    } catch (err) {
      toast("خطا در ارتباط با سرور", "error");
    }
  };

  const applyPreset = (presetType: "100_PRO_FREE" | "50_PROMAX" | "PUBLIC_30" | "FIXED_200K_PROMAX") => {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    if (presetType === "100_PRO_FREE") {
      setCode(`PRO-FREE-${randomSuffix}`);
      setTitle("کد ۱۰۰٪ رایگان اکانت پرو اولیه");
      setType("PERCENTAGE");
      setValue("100");
      setApplicablePlan("PRO");
      setIsPublic(false);
      setMaxUses("10");
      setExpiryPreset("7days");
      toast("الگوی کد ۱۰۰٪ رایگان پرو (۱۰ اکانت - ۷ روزه) تنظیم شد.", "success");
    } else if (presetType === "50_PROMAX") {
      setCode(`PROMAX-50-${randomSuffix}`);
      setTitle("تخفیف ۵۰ درصدی اشتراک پرومکس");
      setType("PERCENTAGE");
      setValue("50");
      setApplicablePlan("PRO_MAX");
      setIsPublic(false);
      setMaxUses("20");
      setExpiryPreset("30days");
      toast("الگوی کد ۵۰٪ تخفیف پرومکس (۲۰ اکانت - ۳۰ روزه) تنظیم شد.", "success");
    } else if (presetType === "PUBLIC_30") {
      setCode(`ZOPIT-PRO-30`);
      setTitle("جشنواره تخفیف عمومی ۳۰٪ زوپیت");
      setType("PERCENTAGE");
      setValue("30");
      setApplicablePlan("ALL");
      setIsPublic(true);
      setMaxUses("100");
      setExpiryPreset("7days");
      toast("الگوی تخفیف ۳۰٪ همگانی (نمایش خودکار در سایت) تنظیم شد.", "success");
    } else if (presetType === "FIXED_200K_PROMAX") {
      setCode(`PROMAX-200K-${randomSuffix}`);
      setTitle("تخفیف ۲۰۰ هزار تومانی ویژه پرومکس");
      setType("FIXED");
      setValue("200000");
      setApplicablePlan("PRO_MAX");
      setIsPublic(false);
      setMaxUses("15");
      setExpiryPreset("7days");
      toast("الگوی تخفیف ۲۰۰,۰۰۰ تومانی پرومکس تنظیم شد.", "success");
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

  const togglePublic = async (id: number, isPublicCurrent: boolean) => {
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ isPublic: !isPublicCurrent })
      });
      if (res.ok) {
        toast(!isPublicCurrent ? "تخفیف به صورت عمومی در سایت فعال شد" : "تخفیف به حالت خصوصی تغییر یافت", "success");
        fetchDiscounts();
      }
    } catch (err) {
      toast("خطا در تغییر حالت انتشار", "error");
    }
  };

  const filteredDiscounts = discounts.filter(d => 
    d.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.title && d.title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalUsed = discounts.reduce((acc, d) => acc + (d.usedCount || 0), 0);
  const activeCount = discounts.filter(d => d.isActive).length;
  const publicCount = discounts.filter(d => d.isActive && d.isPublic).length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/20 font-black">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">مدیریت کدهای تخفیف اشتراک‌های پرو و پرومکس</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تعریف کوپن‌های تخفیف درصدی و مبلغی با تفکیک طرح (پرو / پرومکس) و قابلیت نمایش عمومی در سایت یا اختصاصی
            </p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex items-center gap-3 self-stretch sm:self-auto flex-wrap">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl text-center shadow-xs">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">کدهای فعال</span>
            <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono">{activeCount}</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl text-center shadow-xs">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">نمایش عمومی در سایت</span>
            <span className="text-sm font-black text-blue-600 dark:text-blue-400 font-mono">{publicCount}</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl text-center shadow-xs">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">مجموع استفاده</span>
            <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 font-mono">{totalUsed} بار</span>
          </div>
        </div>
      </div>

      {/* Scope Info Box with High Contrast */}
      <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 p-4 rounded-2xl flex items-start gap-3.5 text-xs text-indigo-950 dark:text-indigo-200 shadow-xs">
        <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed font-medium">
          <strong className="text-indigo-900 dark:text-white font-extrabold">راهنمای هوشمند سیاست‌های تخفیف:</strong> شما می‌توانید تخفیف‌ها را منحصراً برای <span className="font-bold underline">اشتراک پرو</span>، <span className="font-bold underline">اشتراک پرومکس</span> یا <span className="font-bold underline">هر دو طرح</span> صادر فرمایید. همچنین با فعال‌سازی گزینه <strong>«نمایش همگانی در سایت»</strong>، بنر و دکمه اعمال آنی تخفیف به تمامی فروشگاه‌داران در مرحله ثبت‌نام نشان داده خواهد شد. در صورت استفاده از کد ۱۰۰٪ رایگان، اکانت کاربر بلافاصله و بدون انتقال به درگاه بانکی فعال خواهد گردید.
        </p>
      </div>

      {/* Quick Presets Bar with High Contrast */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-3.5">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-black text-slate-800 dark:text-slate-200">الگوهای آماده و سریع صدور کد تخفیف (Presets):</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => applyPreset("100_PRO_FREE")}
            className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700/80 p-3 rounded-2xl text-xs font-black flex flex-col items-start gap-1.5 transition-all cursor-pointer text-right shadow-xs hover:shadow-md"
          >
            <div className="flex items-center gap-1.5 font-black text-emerald-700 dark:text-emerald-400">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>🎁 ۱۰۰٪ رایگان اکانت پرو</span>
            </div>
            <span className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 font-normal">
              ویژه ۱۰ اکانت اول - انقضا ۷ روزه (خصوصی)
            </span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("50_PROMAX")}
            className="bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 dark:hover:bg-purple-900/60 text-purple-900 dark:text-purple-200 border border-purple-300 dark:border-purple-700/80 p-3 rounded-2xl text-xs font-black flex flex-col items-start gap-1.5 transition-all cursor-pointer text-right shadow-xs hover:shadow-md"
          >
            <div className="flex items-center gap-1.5 font-black text-purple-700 dark:text-purple-400">
              <Crown className="w-4 h-4 shrink-0" />
              <span>👑 ۵۰٪ تخفیف پرومکس</span>
            </div>
            <span className="text-[11px] text-purple-800/80 dark:text-purple-300/80 font-normal">
              منحصراً برای اشتراک ۲۹۹ هزار تومانی (۲۰ اکانت)
            </span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("PUBLIC_30")}
            className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700/80 p-3 rounded-2xl text-xs font-black flex flex-col items-start gap-1.5 transition-all cursor-pointer text-right shadow-xs hover:shadow-md"
          >
            <div className="flex items-center gap-1.5 font-black text-blue-700 dark:text-blue-400">
              <Globe className="w-4 h-4 shrink-0" />
              <span>📢 ۳۰٪ تخفیف همگانی سایت</span>
            </div>
            <span className="text-[11px] text-blue-800/80 dark:text-blue-300/80 font-normal">
              نمایش خودکار بنر در صفحه ثبت‌نام به همه
            </span>
          </button>

          <button
            type="button"
            onClick={() => applyPreset("FIXED_200K_PROMAX")}
            className="bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/80 p-3 rounded-2xl text-xs font-black flex flex-col items-start gap-1.5 transition-all cursor-pointer text-right shadow-xs hover:shadow-md"
          >
            <div className="flex items-center gap-1.5 font-black text-amber-700 dark:text-amber-400">
              <Coins className="w-4 h-4 shrink-0" />
              <span>🏷️ ۲۰۰,۰۰۰ تومان تخفیف پرومکس</span>
            </div>
            <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80 font-normal">
              کاهش مستقیم هزینه پرومکس به ۹۹ هزار تومان
            </span>
          </button>
        </div>
      </div>

      {/* Create New Discount Code Form */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="font-black text-slate-900 dark:text-white text-sm mb-5 flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <span>صدور و پیکربندی کد تخفیف جدید</span>
        </h3>
        
        <form onSubmit={handleCreate} className="space-y-5">
          {/* Row 1: Target Plan & Visibility Policy */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/70">
            {/* Target Plan Selector */}
            <div>
              <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>طرح مشمول تخفیف:</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setApplicablePlan("ALL")}
                  className={`py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center border ${
                    applicablePlan === "ALL"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  همه اشتراک‌ها
                </button>
                <button
                  type="button"
                  onClick={() => setApplicablePlan("PRO")}
                  className={`py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center border ${
                    applicablePlan === "PRO"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  فقط اشتراک پرو
                </button>
                <button
                  type="button"
                  onClick={() => setApplicablePlan("PRO_MAX")}
                  className={`py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center border ${
                    applicablePlan === "PRO_MAX"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  فقط اشتراک پرومکس
                </button>
              </div>
            </div>

            {/* Visibility Policy Selector */}
            <div>
              <label className="block text-xs font-black text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>سیاست انتشار و نمایش در صفحه ثبت‌نام:</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center flex items-center justify-center gap-2 border ${
                    !isPublic
                      ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 border-slate-800 shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>🔒 کد اختصاصی (مخفی)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center flex items-center justify-center gap-2 border ${
                    isPublic
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>📢 نمایش عمومی در سایت</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Code, Title, Type, Value, MaxUses, Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-1">
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                کد تخفیف (لاتین)
              </label>
              <input
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="مثال: PRO-FREE-100"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-left dir-ltr text-indigo-700 dark:text-indigo-300 font-mono font-black focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                عنوان تخفیف (اختیاری)
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: جشنواره افتتاحیه"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                نوع تخفیف
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              >
                <option value="PERCENTAGE">درصدی (%)</option>
                <option value="FIXED">مبلغ ثابت (تومان)</option>
              </select>
            </div>

            <div className="lg:col-span-1">
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                مقدار تخفیف {type === "PERCENTAGE" ? "(درصد از ۱ تا ۱۰۰)" : "(تومان)"}
              </label>
              <input
                required
                type="number"
                min="1"
                max={type === "PERCENTAGE" ? "100" : undefined}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-center text-slate-900 dark:text-white font-black focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                سقف استفاده (تعداد اکانت)
              </label>
              <input
                type="number"
                min="1"
                placeholder="خالی = نامحدود"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-center text-slate-900 dark:text-white font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none font-mono"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block text-[11px] font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                مدت زمان اعتبار
              </label>
              <select
                value={expiryPreset}
                onChange={(e) => setExpiryPreset(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-bold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none"
              >
                <option value="today">تا پایان امروز (۲۴ ساعت)</option>
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 px-6 rounded-xl flex items-center gap-2 text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>ایجاد و فعال‌سازی کد تخفیف</span>
            </button>
          </div>
        </form>
      </div>

      {/* List Table with Crisp Contrast */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <h3 className="font-black text-slate-900 dark:text-white text-sm">لیست کدهای تخفیف صادر شده</h3>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="جستجوی کد تخفیف یا عنوان..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right min-w-[800px]">
            <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3.5">کد تخفیف</th>
                <th className="px-4 py-3.5">طرح هدف</th>
                <th className="px-4 py-3.5">سیاست انتشار</th>
                <th className="px-4 py-3.5">نوع و ارزش تخفیف</th>
                <th className="px-4 py-3.5">تعداد مصرف شده</th>
                <th className="px-4 py-3.5">مهلت انقضا</th>
                <th className="px-4 py-3.5 text-center">وضعیت</th>
                <th className="px-4 py-3.5 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filteredDiscounts.map((d) => {
                const isExpired = d.expiryDate && new Date(d.expiryDate) < new Date();
                const isExhausted = d.maxUses && d.usedCount >= d.maxUses;
                const isValid = d.isActive && !isExpired && !isExhausted;

                return (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div>
                          <span className="font-mono font-black text-indigo-700 dark:text-indigo-400 text-sm bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800 block" dir="ltr">
                            {d.code}
                          </span>
                          {d.title && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">
                              {d.title}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleCopy(d)}
                          title="کپی کردن کد"
                          className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all cursor-pointer"
                        >
                          {copiedId === d.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Target Plan */}
                    <td className="px-4 py-3.5">
                      {d.applicablePlan === "PRO" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          اشتراک پرو
                        </span>
                      ) : d.applicablePlan === "PRO_MAX" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          <Crown className="w-3 h-3 text-purple-600" />
                          اشتراک پرومکس
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          همه اشتراک‌ها
                        </span>
                      )}
                    </td>

                    {/* Public vs Private */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => togglePublic(d.id, !!d.isPublic)}
                        title="کلیک جهت تغییر وضعیت انتشار"
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black border transition-all cursor-pointer ${
                          d.isPublic
                            ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                        }`}
                      >
                        {d.isPublic ? (
                          <>
                            <Globe className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                            <span>📢 نمایش در سایت</span>
                          </>
                        ) : (
                          <>
                            <Lock className="w-3 h-3 text-slate-500" />
                            <span>🔒 اختصاصی</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Value */}
                    <td className="px-4 py-3.5">
                      <span className="font-extrabold">
                        {d.discountType === "PERCENTAGE" ? (
                          <span className="text-purple-700 dark:text-purple-300 font-mono text-sm">{d.discountValue}٪ تخفیف</span>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-300 font-mono text-sm">{d.discountValue?.toLocaleString("fa-IR")} تومان</span>
                        )}
                      </span>
                    </td>

                    {/* Used Count */}
                    <td className="px-4 py-3.5 font-mono">
                      <span className={isExhausted ? "text-rose-600 font-black" : "text-slate-600 dark:text-slate-400 font-bold"}>
                        {d.usedCount || 0} / {d.maxUses ? `${d.maxUses} اکانت` : "نامحدود"}
                      </span>
                    </td>

                    {/* Expiry */}
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                      {d.expiryDate ? (
                        <span className={`flex items-center gap-1 ${isExpired ? "text-rose-600 font-bold" : "text-slate-700 dark:text-slate-300 font-medium"}`}>
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(d.expiryDate).toLocaleDateString("fa-IR")}
                          {isExpired && " (منقضی شده)"}
                        </span>
                      ) : (
                        <span className="text-slate-400">همیشگی (بدون انقضا)</span>
                      )}
                    </td>

                    {/* Active Toggle */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => toggleStatus(d.id, d.isActive)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black transition-all cursor-pointer ${
                          isValid
                            ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700"
                            : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700"
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

                    {/* Delete */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleDelete(d.id)}
                        className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
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
                  <td colSpan={8} className="text-center py-10 text-slate-500 dark:text-slate-400">
                    هیچ کد تخفیفی یافت نشد. می‌توانید با دکمه‌های الگوهای سریع بالا، اولین کد تخفیف را صادر کنید.
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
