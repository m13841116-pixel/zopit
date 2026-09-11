import React, { useState, useEffect } from "react";
import {
  Store,
  Key,
  RefreshCw,
  Copy,
  Check,
  Percent,
  DollarSign,
  Download,
  Code,
  ShieldCheck,
  Zap,
  HelpCircle,
  ExternalLink,
  Lock,
  Calculator,
  Save
} from "lucide-react";

export default function StoreConnection({ showNotification }: { showNotification?: (msg: string, type: "success" | "error" | "info") => void }) {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [profitMarginPercent, setProfitMarginPercent] = useState<number>(15);
  const [profitFixedAmount, setProfitFixedAmount] = useState<number>(0);
  const [formulaEnabled, setFormulaEnabled] = useState<boolean>(true);
  const [applyToCatalog, setApplyToCatalog] = useState<boolean>(true);
  const [sampleBasePrice, setSampleBasePrice] = useState<number>(100000);
  const [loading, setLoading] = useState(true);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [savingMargin, setSavingMargin] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const productsEndpoint = `${baseUrl}/api/v1/store/products`;
  const ordersEndpoint = `${baseUrl}/api/v1/integrations/order-callback`;

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const [settingsRes, formulaRes] = await Promise.all([
        fetch("/api/store-manager/settings", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/store-manager/pricing-formula", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
      ]);

      const data = await settingsRes.json();
      if (data.success) {
        setApiKey(data.apiKey);
      }

      if (formulaRes && formulaRes.ok) {
        const formulaData = await formulaRes.json();
        setProfitMarginPercent(formulaData.profitMarginPercent ?? 15);
        setProfitFixedAmount(formulaData.profitFixedAmount ?? 0);
        setFormulaEnabled(formulaData.formulaEnabled ?? true);
      } else if (data.success) {
        setProfitMarginPercent(data.profitMarginValue || 15);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateApiKey = async () => {
    if (apiKey && !window.confirm("آیا مطمئن هستید؟ با تولید کلید جدید، کلید قبلی غیرفعال می‌شود و باید کلید جدید را در ووکامرس وارد کنید.")) {
      return;
    }
    setGeneratingKey(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/api-key/generate", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setApiKey(data.apiKey);
        if (showNotification) showNotification("کلید API جدید با موفقیت ایجاد شد.", "success");
      } else {
        if (showNotification) showNotification(data.error || "خطا در تولید کلید API", "error");
      }
    } catch (err) {
      if (showNotification) showNotification("خطای ارتباط با سرور", "error");
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleSavePricingFormula = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMargin(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/pricing-formula", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          profitMarginPercent: Number(profitMarginPercent) || 0,
          profitFixedAmount: Number(profitFixedAmount) || 0,
          formulaEnabled,
          applyToCatalog
        })
      });
      const data = await res.json();
      if (data.success) {
        if (showNotification) showNotification(data.message || "فرمول محاسبه سود با موفقیت ذخیره شد.", "success");
      } else {
        if (showNotification) showNotification(data.error || "خطا در ذخیره فرمول", "error");
      }
    } catch (err) {
      if (showNotification) showNotification("خطا در برقراری ارتباط با سرور", "error");
    } finally {
      setSavingMargin(false);
    }
  };

  const copyToClipboard = (text: string, type: "key" | "endpoint" | "code", label?: string) => {
    navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else if (type === "endpoint") {
      setCopiedEndpoint(label || text);
      setTimeout(() => setCopiedEndpoint(null), 2000);
    } else if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
    if (showNotification) showNotification("در حافظه کپی شد.", "info");
  };

  // Sample price calculation: [قیمت فروش = (قیمت پایه تامین‌کننده × (1 + درصد سود / 100)) + مبلغ ثابت تومان]
  const sampleSellingPrice = formulaEnabled
    ? Math.round(sampleBasePrice * (1 + (profitMarginPercent || 0) / 100) + Number(profitFixedAmount || 0))
    : sampleBasePrice;
  const sampleProfit = Math.max(0, sampleSellingPrice - sampleBasePrice);

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in py-6 px-2" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden border border-indigo-500/30">
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
              <Zap className="w-4 h-4" />
              <span>ماژول ووکامرس فعال و هوشمند</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              اتصال هوشمند ووکامرس به زوپیت (Zopit Connector)
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed max-w-2xl">
              محصولات تأمین‌کنندگان زوپیت را با درصد سود اختصاصی خودتان مستقیماً در سایت وردپرسی همگام‌سازی کنید. تمامی سفارشات مشتریان سایت شما بدون مداخله دستی و با حفظ امنیت کامل قیمت وارد پنل زوپیت می‌گردند.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/zopit-woo-connector.zip"
              download="zopit-woo-connector.zip"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-3 rounded-2xl transition-all shadow-lg flex items-center gap-2 text-xs md:text-sm border border-emerald-400/30"
            >
              <Download className="w-4 h-4" />
              <span>دانلود فایل زیپ افزونه (ZIP)</span>
            </a>
            <button
              onClick={() => setShowCodeModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-3 rounded-2xl transition-all flex items-center gap-2 text-xs border border-slate-700"
            >
              <Code className="w-4 h-4" />
              <span>مشاهده کد PHP</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-card border border-subtle rounded-3xl p-12 text-center text-muted font-bold text-sm">
          در حال بارگذاری تنظیمات اتصال...
        </div>
      ) : (
        <div className="space-y-8">
          {/* Main Card: API Key & Endpoints & Guidance */}
          <div className="bg-card border border-subtle rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-subtle pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center font-bold">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-primary">کلید اختصاصی API Key و آدرس‌های اتوماتیک</h2>
                  <p className="text-xs text-muted">احراز هویت درخواست‌های افزونه وردپرس با سرور زوپیت</p>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-500 shrink-0" />
                <span>قیمت‌گذاری محصولات در بخش «زوپیتی من» مدیریت می‌شود</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* API Key Box */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-secondary">کلید فعال شما (API Key):</label>
                  {apiKey ? (
                    <div className="flex items-center gap-2 bg-surface p-3 rounded-2xl border border-subtle dir-ltr">
                      <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold truncate flex-1">
                        {apiKey}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(apiKey, "key")}
                        className="bg-card hover:bg-subtle p-2 rounded-xl border border-subtle text-secondary transition-all shrink-0"
                        title="کپی کلید"
                      >
                        {copiedKey ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 p-4 rounded-2xl text-xs font-bold">
                      هنوز کلید API تولید نکرده‌اید. روی دکمه زیر کلیک کنید.
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={generatingKey}
                  onClick={handleGenerateApiKey}
                  className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold py-3 px-4 rounded-2xl transition-all text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${generatingKey ? "animate-spin" : ""}`} />
                  <span>{apiKey ? "تولید مجدد کلید API جدید" : "تولید اولین کلید API"}</span>
                </button>
              </div>

              {/* Endpoints listing with explanation */}
              <div className="space-y-4">
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-3.5 text-xs text-indigo-600 dark:text-indigo-300 leading-relaxed font-bold flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black block mb-0.5">توضیح آدرس‌های زیر:</span>
                    نیازی به وارد کردن یا پر کردن دستی این آدرس‌ها توسط شما نیست! این ۲ آدرس به طور اتوماتیک توسط افزونه زوپیت در وردپرس فراخوانی می‌شوند. شما فقط آدرس دامنه سرور (https://zopit.ir) و کلید API بالا را در وردپرس وارد می‌کنید.
                  </div>
                </div>

                <div className="space-y-3">
                  {/* GET Products Endpoint */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-secondary">
                      <span>۱. آدرس همگام‌سازی محصولات (GET):</span>
                      <button
                        onClick={() => copyToClipboard(productsEndpoint, "endpoint", "products")}
                        className="text-indigo-500 hover:underline text-[11px] flex items-center gap-1"
                      >
                        {copiedEndpoint === "products" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>کپی آدرس</span>
                      </button>
                    </div>
                    <div className="bg-surface p-2.5 rounded-xl border border-subtle dir-ltr font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">
                      {productsEndpoint}
                    </div>
                  </div>

                  {/* POST Orders Endpoint */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold text-secondary">
                      <span>۲. آدرس وب‌هوک ثبت سفارشات (POST):</span>
                      <button
                        onClick={() => copyToClipboard(ordersEndpoint, "endpoint", "orders")}
                        className="text-indigo-500 hover:underline text-[11px] flex items-center gap-1"
                      >
                        {copiedEndpoint === "orders" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>کپی آدرس</span>
                      </button>
                    </div>
                    <div className="bg-surface p-2.5 rounded-xl border border-subtle dir-ltr font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate">
                      {ordersEndpoint}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2: Automated Pricing Formula Engine Card */}
          <div className="bg-card border border-subtle rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-subtle pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center font-bold">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-primary">موتور محاسبه و به‌روزرسانی خودکار سود و قیمت</h2>
                  <p className="text-xs text-muted">
                    فرمول قیمت فروش: <code className="text-emerald-600 dark:text-emerald-400 font-mono font-bold">[قیمت فروش = (قیمت پایه × (۱ + درصد سود / ۱۰۰)) + مبلغ ثابت]</code>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-secondary flex items-center gap-2 cursor-pointer bg-surface px-3 py-1.5 rounded-xl border border-subtle">
                  <input
                    type="checkbox"
                    checked={formulaEnabled}
                    onChange={(e) => setFormulaEnabled(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>فعال‌سازی محاسبه خودکار</span>
                </label>
              </div>
            </div>

            <form onSubmit={handleSavePricingFormula} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profit Margin Percent */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-secondary">
                    درصد حاشیه سود (٪):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="500"
                      step="0.5"
                      value={profitMarginPercent}
                      onChange={(e) => setProfitMarginPercent(Math.max(0, Number(e.target.value)))}
                      className="w-full pl-8 pr-4 py-3 bg-surface border border-subtle rounded-2xl text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dir-ltr"
                      placeholder="مثال: ۱۵"
                    />
                    <span className="absolute left-3 top-3.5 text-xs text-muted font-bold">%</span>
                  </div>
                  <p className="text-[11px] text-muted">درصد سودی که به قیمت پایه تامین‌کننده اضافه می‌شود.</p>
                </div>

                {/* Fixed Profit Amount */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-secondary">
                    مبلغ ثابت افزوده سود (تومان):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={profitFixedAmount}
                      onChange={(e) => setProfitFixedAmount(Math.max(0, Number(e.target.value)))}
                      className="w-full pl-12 pr-4 py-3 bg-surface border border-subtle rounded-2xl text-xs font-bold text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all dir-ltr"
                      placeholder="مثال: ۲۰۰۰۰"
                    />
                    <span className="absolute left-3 top-3.5 text-xs text-muted font-bold">تومان</span>
                  </div>
                  <p className="text-[11px] text-muted">مبلغ ثابتی که به علاوه درصد سود به قیمت کالا اضافه می‌گردد.</p>
                </div>
              </div>

              {/* Interactive Live Calculation Preview */}
              <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-3">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-500" />
                    پیش‌نمایش زنده محاسبه قیمت برای نمونه فرضی:
                  </span>
                  <div className="flex items-center gap-2 text-xs text-secondary">
                    <span>قیمت پایه کالا:</span>
                    <input
                      type="number"
                      step="5000"
                      value={sampleBasePrice}
                      onChange={(e) => setSampleBasePrice(Math.max(1000, Number(e.target.value)))}
                      className="w-28 px-2 py-1 bg-surface border border-subtle rounded-lg text-xs font-mono font-bold text-center dir-ltr"
                    />
                    <span>تومان</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="bg-surface/80 p-3 rounded-xl border border-subtle">
                    <span className="text-[11px] text-muted block mb-1">قیمت خرید عمده از زوپیت</span>
                    <span className="font-mono text-xs font-bold text-primary">{sampleBasePrice.toLocaleString()} تومان</span>
                  </div>

                  <div className="bg-surface/80 p-3 rounded-xl border border-subtle">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block mb-1">سود خالص شما در این کالا</span>
                    <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">+{sampleProfit.toLocaleString()} تومان</span>
                  </div>

                  <div className="bg-emerald-500 text-white p-3 rounded-xl shadow-sm">
                    <span className="text-[11px] text-emerald-100 block mb-1">قیمت نهایی فروش در سایت شما</span>
                    <span className="font-mono text-sm font-black">{sampleSellingPrice.toLocaleString()} تومان</span>
                  </div>
                </div>
              </div>

              {/* Action Checkbox & Save Button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <label className="text-xs font-bold text-secondary flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyToCatalog}
                    onChange={(e) => setApplyToCatalog(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                  />
                  <span>همین فرمول را فوراً بر روی تمام محصولات موجود در کاتالوگ زوپیتی من اعمال و بازنویسی کن</span>
                </label>

                <button
                  type="submit"
                  disabled={savingMargin}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-2xl transition-all text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingMargin ? "در حال ذخیره..." : "ذخیره تنظیمات فرمول قیمت‌گذاری"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Security Hole Closure Notice & Webhook Logic (بستن حفره قیمت و تسویه اتوماتیک کیف پول) */}
      <div className="bg-card border border-indigo-500/20 rounded-3xl p-6 shadow-lg space-y-4">
        <div className="flex items-center gap-2 text-indigo-500 font-black text-sm">
          <Lock className="w-5 h-5" />
          <span>امنیت اختصاصی، استعلام قیمت عمده و تسویه خودکار کیف پول (Order Callback API)</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-secondary leading-relaxed">
          <div className="bg-surface p-4 rounded-2xl border border-subtle space-y-2">
            <span className="font-bold text-primary block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              ۱. استعلام قیمت عمده از دیتابیس (Hole Closure):
            </span>
            <p className="text-muted">
              قیمت ارسالی از سمت ووکامرس یا فروشگاه خارجی ملاک فاکتور زوپیت نخواهد بود. زوپیت کد کالای ارسالی (<code className="text-indigo-500 font-mono">zopit_sku</code>) را در بانک داده خود جستجو کرده و قیمت عمده واقعی تأمین‌کننده را به عنوان بهای تمام‌شده لحاظ می‌نماید تا امکان هیچ‌گونه دستکاری قیمتی وجود نداشته باشد.
            </p>
          </div>

          <div className="bg-surface p-4 rounded-2xl border border-subtle space-y-2">
            <span className="font-bold text-primary block flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              ۲. منطق هوشمند کیف پول و تغییر وضعیت سفارش:
            </span>
            <p className="text-muted">
              اگر موجودی کیف پول شما در زوپیت کافی باشد، هزینه فاکتور عمده به صورت اتوماتیک از کیف پول کسر شده، سفارش با وضعیت «ارسال‌شده به تامین‌کننده» ثبت می‌شود و پیامک آماده‌سازی به تامین‌کننده ارسال می‌گردد. در صورت کسری موجودی، سفارش در حالت «در انتظار شارژ کیف پول» قرار گرفته و پیامک اطلاع‌رسانی به شما ارسال می‌شود.
            </p>
          </div>
        </div>
      </div>

      {/* Guide Step-by-Step */}
      <div className="bg-card border border-subtle rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
        <h2 className="text-base font-black text-primary flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-indigo-500" />
          <span>راهنمای ۳ مرحله‌ای راه اندازی افزونه در وردپرس:</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface p-5 rounded-2xl border border-subtle space-y-2">
            <div className="w-7 h-7 bg-indigo-500 text-white font-black text-xs rounded-full flex items-center justify-center">
              ۱
            </div>
            <h3 className="text-xs font-black text-primary">نصب افزونه</h3>
            <p className="text-[11px] text-muted leading-relaxed">
              فایل <code className="text-indigo-500">zopit-woo-connector.php</code> را دانلود کرده و در مسیر افزونه‌های وردپرس یا از بخش «افزودن افزونه» بارگذاری کنید.
            </p>
          </div>

          <div className="bg-surface p-5 rounded-2xl border border-subtle space-y-2">
            <div className="w-7 h-7 bg-indigo-500 text-white font-black text-xs rounded-full flex items-center justify-center">
              ۲
            </div>
            <h3 className="text-xs font-black text-primary">تنظیم API Key</h3>
            <p className="text-[11px] text-muted leading-relaxed">
              در پیشخوان وردپرس وارد منوی «تنظیمات زوپیت» شوید، آدرس دامنه زوپیت و کلید API بالا را قرار داده و ذخیره کنید.
            </p>
          </div>

          <div className="bg-surface p-5 rounded-2xl border border-subtle space-y-2">
            <div className="w-7 h-7 bg-indigo-500 text-white font-black text-xs rounded-full flex items-center justify-center">
              ۳
            </div>
            <h3 className="text-xs font-black text-primary">همگام‌سازی و فروش</h3>
            <p className="text-[11px] text-muted leading-relaxed">
              روی دکمه «همگام‌سازی محصولات» کلیک کنید. با هر خرید مشتری در سایت شما، سفارش اتوماتیک به پنل زوپیت ارسال می‌شود.
            </p>
          </div>
        </div>
      </div>

      {/* PHP Code Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden dir-rtl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Code className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-black text-white">کد کامل افزونه وردپرس (zopit-woo-connector.php)</h3>
              </div>
              <button
                onClick={() => setShowCodeModal(false)}
                className="text-slate-400 hover:text-white font-black text-sm px-2 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 dir-ltr font-mono text-xs text-indigo-300 bg-slate-950">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {`<?php
/**
 * Plugin Name: Zopit WooCommerce Connector
 * Plugin URI: https://zopit.ir
 * Description: افزونه اختصاصی همگام‌سازی محصولات و ارسال خودکار سفارشات ووکامرس به پلتفرم زوپیت.
 * Version: 1.0.0
 * Author: Zopit Platform
 */

if (!defined('ABSPATH')) exit;

class Zopit_Woo_Connector {
    private static $instance = null;

    public static function get_instance() {
        if (self::$instance == null) self::$instance = new self();
        return self::$instance;
    }

    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_init', array($this, 'register_settings'));
        add_action('wp_ajax_zopit_sync_products', array($this, 'ajax_sync_products'));
        add_action('woocommerce_payment_complete', array($this, 'send_order_to_zopit'), 10, 1);
        add_action('woocommerce_order_status_processing', array($this, 'send_order_to_zopit'), 10, 1);
    }

    public function add_admin_menu() {
        add_menu_page('اتصال زوپیت', 'تنظیمات زوپیت', 'manage_options', 'zopit-connector', array($this, 'render_admin_page'), 'dashicons-rest-api', 56);
    }

    public function register_settings() {
        register_setting('zopit_settings_group', 'zopit_api_url');
        register_setting('zopit_settings_group', 'zopit_api_key');
    }

    public function render_admin_page() {
        $api_url = get_option('zopit_api_url', '${baseUrl}');
        $api_key = get_option('zopit_api_key', '');
        ?>
        <div class="wrap" dir="rtl">
            <h1>تنظیمات افزونه اتصال زوپیت به ووکامرس</h1>
            <form method="post" action="options.php">
                <?php settings_fields('zopit_settings_group'); ?>
                <table class="form-table">
                    <tr>
                        <th>آدرس سرور زوپیت:</th>
                        <td><input type="url" name="zopit_api_url" value="<?php echo esc_attr($api_url); ?>" class="regular-text" required /></td>
                    </tr>
                    <tr>
                        <th>کلید API Key زوپیت:</th>
                        <td><input type="text" name="zopit_api_key" value="<?php echo esc_attr($api_key); ?>" class="regular-text" required /></td>
                    </tr>
                </table>
                <?php submit_button('ذخیره تنظیمات'); ?>
            </form>
            <hr />
            <h2>همگام‌سازی محصولات</h2>
            <button id="zopit-sync-btn" class="button button-primary button-hero">همگام‌سازی کالاها از زوپیت</button>
            <div id="zopit-sync-result" style="margin-top: 15px; font-weight: bold;"></div>
            <script>
            jQuery(document).ready(function($) {
                $('#zopit-sync-btn').on('click', function(e) {
                    e.preventDefault();
                    var btn = $(this).prop('disabled', true).text('در حال همگام‌سازی...');
                    $.post(ajaxurl, { action: 'zopit_sync_products' }, function(res) {
                        btn.prop('disabled', false).text('همگام‌سازی کالاها از زوپیت');
                        $('#zopit-sync-result').html(res.success ? '<span style="color:green;">'+res.data.message+'</span>' : '<span style="color:red;">'+res.data.error+'</span>');
                    });
                });
            });
            </script>
        </div>
        <?php
    }

    public function ajax_sync_products() {
        $api_url = rtrim(get_option('zopit_api_url'), '/');
        $api_key = get_option('zopit_api_key');
        if (empty($api_key)) wp_send_json_error(array('error' => 'کلید API تنظیم نشده است.'));

        $response = wp_remote_get($api_url . '/api/v1/store/products', array('headers' => array('X-API-KEY' => $api_key), 'timeout' => 30));
        if (is_wp_error($response)) wp_send_json_error(array('error' => $response->get_error_message()));

        $data = json_decode(wp_remote_retrieve_body($response), true);
        if (!$data || !isset($data['success']) || !$data['success']) wp_send_json_error(array('error' => $data['error'] ?? 'خطا در فراخوانی زوپیت'));

        $synced = 0;
        foreach ($data['products'] as $p) {
            $q = new WP_Query(array('post_type' => 'product', 'meta_key' => '_zopit_product_id', 'meta_value' => $p['id'], 'posts_per_page' => 1));
            if ($q->have_posts()) {
                $q->the_post();
                $id = get_the_ID();
                wp_reset_postdata();
                update_post_meta($id, '_price', $p['price']);
                update_post_meta($id, '_regular_price', $p['price']);
                update_post_meta($id, '_stock', $p['inventory']);
                $synced++;
            } else {
                $post_id = wp_insert_post(array('post_title' => $p['name'], 'post_content' => $p['longDescription'], 'post_excerpt' => $p['shortDescription'], 'post_status' => 'publish', 'post_type' => 'product'));
                if ($post_id && !is_wp_error($post_id)) {
                    wp_set_object_terms($post_id, 'simple', 'product_type');
                    update_post_meta($post_id, '_price', $p['price']);
                    update_post_meta($post_id, '_regular_price', $p['price']);
                    update_post_meta($post_id, '_stock', $p['inventory']);
                    update_post_meta($post_id, '_zopit_product_id', $p['id']);
                    $synced++;
                }
            }
        }
        wp_send_json_success(array('message' => "تعداد {$synced} محصول با موفقیت همگام‌سازی شد."));
    }

    public function send_order_to_zopit($order_id) {
        if (!$order_id || get_post_meta($order_id, '_zopit_synced', true)) return;
        $order = wc_get_order($order_id);
        if (!$order) return;
        $api_url = rtrim(get_option('zopit_api_url'), '/');
        $api_key = get_option('zopit_api_key');
        if (empty($api_key)) return;

        $items = array();
        foreach ($order->get_items() as $item) {
            $zid = get_post_meta($item->get_product_id(), '_zopit_product_id', true);
            if ($zid) $items[] = array('product_id' => intval($zid), 'quantity' => intval($item->get_quantity()));
        }
        if (empty($items)) return;

        $payload = array(
            'woo_order_id' => strval($order_id),
            'items' => $items,
            'customer' => array(
                'name' => trim($order->get_shipping_first_name().' '.$order->get_shipping_last_name()) ?: trim($order->get_billing_first_name().' '.$order->get_billing_last_name()),
                'mobile' => $order->get_billing_phone(),
                'address' => $order->get_shipping_address_1() ?: $order->get_billing_address_1(),
                'province' => $order->get_shipping_state() ?: $order->get_billing_state(),
                'city' => $order->get_shipping_city() ?: $order->get_billing_city(),
                'postal_code' => $order->get_shipping_postcode() ?: $order->get_billing_postcode()
            ),
            'shipping_method' => $order->get_shipping_method() ?: 'POST'
        );

        $res = wp_remote_post($api_url . '/api/v1/store/orders', array('headers' => array('X-API-KEY' => $api_key, 'Content-Type' => 'application/json'), 'body' => json_encode($payload), 'timeout' => 30));
        if (!is_wp_error($res)) {
            $b = json_decode(wp_remote_retrieve_body($res), true);
            if (!empty($b['success'])) update_post_meta($order_id, '_zopit_synced', true);
        }
    }
}
add_action('plugins_loaded', array('Zopit_Woo_Connector', 'get_instance'));`}
              </pre>
            </div>
            <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900">
              <a
                href="/zopit-woo-connector.zip"
                download="zopit-woo-connector.zip"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>دانلود فایل افزونه وردپرس (ZIP)</span>
              </a>
              <button
                onClick={() => setShowCodeModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-5 py-2 rounded-xl text-xs"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
