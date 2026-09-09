import React, { useEffect, useState } from "react";
import {
  Package,
  Plus,
  FileSpreadsheet,
  Globe,
  MessageCircle,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  Store,
  ArrowUpRight,
  Layers,
  FileText,
  Zap,
  Edit3,
  HelpCircle,
  Gift
} from "lucide-react";
import { toast } from "../../GlobalToast";

interface SupplierProductCreationHomeProps {
  onStartManual: () => void;
  onStartBulkExcel: () => void;
  onStartWooCommerce: () => void;
  onStartConcierge: () => void;
  onResumeDraft: (draftProduct: any) => void;
  onViewAllProducts: () => void;
}

export function SupplierProductCreationHome({
  onStartManual,
  onStartBulkExcel,
  onStartWooCommerce,
  onStartConcierge,
  onResumeDraft,
  onViewAllProducts,
}: SupplierProductCreationHomeProps) {
  const [stats, setStats] = useState<any>({
    totalProducts: 0,
    publishedProducts: 0,
    pendingProducts: 0,
    draftProducts: 0,
    rejectedProducts: 0,
    storesImportedCount: 0,
    recentDrafts: [],
    recentProducts: [],
    opportunities: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch("/api/supplier/products/creation-overview", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Error fetching creation overview:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOverview();
  }, []);

  return (
    <div className="space-y-8 animate-fade-in text-right max-w-5xl mx-auto" dir="rtl">
      {/* Motivating Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-default via-primary-hover to-indigo-900 text-inverse p-8 sm:p-10 shadow-xl">
        <div className="absolute top-0 left-0 -translate-x-12 -translate-y-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 translate-x-12 translate-y-12 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-amber-300 text-xs font-black">
              <Sparkles className="w-3.5 h-3.5" />
              <span>بازار عمده‌فروشی و دراپ‌شیپینگ زوپیت</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight tracking-tight">
              هر محصولی که اینجا ثبت می‌کنی، می‌تواند توسط صدها فروشگاه فعال Zopit فروخته شود.
            </h1>

            <p className="text-sm text-white/80 leading-relaxed font-medium">
              اولین محصولت را همین الان وارد کن 🚀 — فقط چند دقیقه تا ثبت محصول و رسیدن به دست خریداران عمده و آنلاین فاصله داری.
            </p>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-3">
            <button
              type="button"
              onClick={onStartManual}
              className="px-6 py-4 bg-white text-primary-default hover:bg-slate-100 rounded-2xl text-sm font-black shadow-lg shadow-black/10 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span>+ افزودن محصول جدید (فرم گام‌به‌گام)</span>
            </button>

            <button
              type="button"
              onClick={onStartBulkExcel}
              className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 backdrop-blur-md"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-300" />
              <span>بارگذاری گروهی با Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Metric Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total */}
        <div className="bg-card border border-subtle rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted">کل محصولات شما</span>
            <div className="w-8 h-8 rounded-xl bg-primary-default/10 text-primary-default flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-primary">
              {stats.totalProducts || 0}
            </span>
            <span className="text-xs text-muted font-bold">کالا</span>
          </div>
        </div>

        {/* Metric 2: Published */}
        <div className="bg-card border border-subtle rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted">منتشرشده و فعال</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.publishedProducts || 0}
            </span>
            <span className="text-xs text-muted font-bold">آماده فروش</span>
          </div>
        </div>

        {/* Metric 3: Pending */}
        <div className="bg-card border border-subtle rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted">در انتظار بررسی ناظر</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {stats.pendingProducts || 0}
            </span>
            <span className="text-xs text-muted font-bold">کالا در صف</span>
          </div>
        </div>

        {/* Metric 4: Stores Imported */}
        <div className="bg-card border border-subtle rounded-2xl p-5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted">فروشگاه‌های متصل</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {stats.storesImportedCount > 0 ? stats.storesImportedCount : "در حال اتصال"}
            </span>
            <span className="text-xs text-muted font-bold">فروشگاه فعال</span>
          </div>
        </div>
      </div>

      {/* Incomplete / Draft Products Resume Section */}
      {stats.recentDrafts && stats.recentDrafts.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
                <Edit3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-primary">
                  پیش‌نویس‌های ناقص و ذخیره‌شده ({stats.recentDrafts.length} کالا)
                </h3>
                <p className="text-xs text-secondary mt-0.5">
                  کالاهایی که قبلاً شروع کرده‌اید و آماده تکمیل و ارسال برای بررسی هستند:
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {stats.recentDrafts.map((draft: any) => (
              <div
                key={draft.id}
                onClick={() => onResumeDraft(draft)}
                className="group bg-surface hover:bg-subtle border border-amber-500/20 hover:border-amber-500 rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-12 h-12 rounded-xl bg-card border border-subtle overflow-hidden shrink-0 flex items-center justify-center">
                    {draft.images && draft.images.length > 0 ? (
                      <img
                        src={typeof draft.images[0] === 'string' ? draft.images[0] : draft.images[0]?.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-muted" />
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <h4 className="text-xs font-black text-primary truncate">
                      {draft.name || "پیش‌نویس بدون نام"}
                    </h4>
                    <span className="text-[10px] text-muted block mt-0.5">
                      {draft.category?.name || "بدون دسته‌بندی"} • ذخیره موقت
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] font-black shrink-0 flex items-center gap-1 group-hover:scale-105 transition-transform"
                >
                  <span>ادامه ثبت</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Creation Channels / Options Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-black text-primary flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary-default" />
          <span>مسیرهای ثبت کالا در زوپیت</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Step by Step Wizard */}
          <div
            onClick={onStartManual}
            className="group relative bg-card hover:bg-primary-default/5 border-2 border-subtle hover:border-primary-default rounded-3xl p-6 cursor-pointer transition-all shadow-xs hover:shadow-lg flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-default/10 text-primary-default flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-base text-primary">
                    فرم گام‌به‌گام و هوشمند
                  </h4>
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                    پیشنهادی
                  </span>
                </div>
                <p className="text-xs text-secondary mt-2 leading-relaxed">
                  ثبت آسان مشخصات در ۷ گام به همراه دستیار هوش مصنوعی Gemini، محاسبه امتیاز کیفی و پیش‌نمایش زنده در مارکت‌پلیس.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center text-xs font-bold text-primary-default gap-1">
              <span>ورود به فرم ثبت کالا</span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Excel Bulk Import */}
          <div
            onClick={onStartBulkExcel}
            className="group relative bg-card hover:bg-indigo-500/5 border-2 border-subtle hover:border-indigo-500 rounded-3xl p-6 cursor-pointer transition-all shadow-xs hover:shadow-lg flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-primary">
                  بارگذاری دسته‌جمعی با Excel
                </h4>
                <p className="text-xs text-secondary mt-2 leading-relaxed">
                  مناسب برای عمده‌فروشان با بیش از ۱۰ قلم کالا. دانلود نمونه اکسل، بارگذاری فایل و ایجاد خودکار صدها محصول در چند ثانیه.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 gap-1">
              <span>بارگذاری فایل اکسل</span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: WooCommerce Sync & Concierge */}
          <div
            onClick={onStartWooCommerce}
            className="group relative bg-card hover:bg-violet-500/5 border-2 border-subtle hover:border-violet-500 rounded-3xl p-6 cursor-pointer transition-all shadow-xs hover:shadow-lg flex flex-col justify-between"
          >
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-violet-500/10 text-violet-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-primary">
                  اتصال خودکار WooCommerce
                </h4>
                <p className="text-xs text-secondary mt-2 leading-relaxed">
                  اتصال مستقیم فروشگاه وردپرسی شما به زوپیت از طریق کلیدهای API و انتقال آنی موجودی، قیمت و تصاویر محصولات.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center text-xs font-bold text-violet-600 dark:text-violet-400 gap-1">
              <span>اتصال به ووکامرس</span>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Concierge Banner */}
        <div
          onClick={onStartConcierge}
          className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-3xl p-5 cursor-pointer hover:border-amber-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-primary">
                  سپردن ورود محصولات به تیم زوپیت (خدمت رایگان)
                </h4>
                <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                  ۱۰۰٪ رایگان
                </span>
              </div>
              <p className="text-xs text-secondary mt-0.5">
                کافیست لیست قیمت یا فایل PDF کالاهایتان را ارسال کنید تا کارشناسان کاتالوگ زوپیت آن‌ها را برایتان ثبت نمایند.
              </p>
            </div>
          </div>

          <div className="flex items-center text-xs font-black text-amber-700 dark:text-amber-400 gap-1 shrink-0">
            <span>ثبت درخواست ورود کالا</span>
            <ChevronLeft className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Product Opportunities & High Demand Gaps */}
      {stats.opportunities && stats.opportunities.length > 0 && (
        <div className="bg-card border border-subtle rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <h3 className="text-sm font-black text-primary">
                فرصت‌های کالایی پرتقاضا در زوپیت
              </h3>
            </div>
            <span className="text-[11px] text-muted font-medium">
              محصولات زیر بیشترین تقاضا را از سوی فروشگاه‌ها دارند
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {stats.opportunities.map((opp: any) => (
              <div
                key={opp.id}
                className="bg-surface border border-subtle rounded-2xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-primary">{opp.category}</span>
                  <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                    تقاضا: {opp.demandScore}٪
                  </span>
                </div>
                <p className="text-[11px] text-secondary leading-relaxed">
                  {opp.reason}
                </p>
                <div className="text-[10px] text-muted font-bold pt-1 border-t border-subtle">
                  مارجین پیشنهادی بازار: {opp.suggestedMargin}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Products List */}
      {stats.recentProducts && stats.recentProducts.length > 0 && (
        <div className="bg-card border border-subtle rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-primary">آخرین کالاهای ثبت‌شده</h3>
            <button
              type="button"
              onClick={onViewAllProducts}
              className="text-xs font-bold text-primary-default hover:text-primary-hover flex items-center gap-1"
            >
              <span>مشاهده همه محصولات</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-subtle">
            {stats.recentProducts.map((prod: any) => (
              <div key={prod.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface border border-subtle overflow-hidden shrink-0 flex items-center justify-center">
                    {prod.images && prod.images.length > 0 ? (
                      <img
                        src={typeof prod.images[0] === 'string' ? prod.images[0] : prod.images[0]?.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-4 h-4 text-muted" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-primary">{prod.name}</h4>
                    <span className="text-[10px] text-muted">
                      قیمت: {Number(prod.supplierBasePrice || 0).toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                </div>

                <div>
                  <span
                    className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                      prod.status === "PUBLISHED"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : prod.status === "PENDING_APPROVAL"
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    {prod.status === "PUBLISHED"
                      ? "منتشرشده ✓"
                      : prod.status === "PENDING_APPROVAL"
                      ? "در انتظار تایید"
                      : "پیش‌نویس"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
