import React, { useState, useEffect } from "react";
import { toast } from "../GlobalToast";
import { 
  Zap, 
  Sparkles, 
  TrendingUp, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Check, 
  Package, 
  Eye, 
  ShoppingBag, 
  Plus, 
  HelpCircle 
} from "lucide-react";

interface ProductMetric {
  impressions: number;
  clicks: number;
  imports: number;
  orders: number;
}

interface FeaturedProductItem {
  id: number;
  name: string;
  categoryName: string;
  imageUrl: string;
  inventory: number;
  status: string;
  featuredStatus: "ACTIVE" | "EXPIRED" | "CANCELLED" | "PENDING_PAYMENT" | "PAYMENT_FAILED" | "NONE";
  featuredUntil: string | null;
  remainingSeconds: number;
  isEligible: boolean;
  metrics: ProductMetric;
  priceToman: number;
  durationHours: number;
}

export function SupplierFeaturedProducts() {
  const [products, setProducts] = useState<FeaturedProductItem[]>([]);
  const [configs, setConfigs] = useState<{ priceToman: number; durationHours: number }>({ priceToman: 99000, durationHours: 24 });
  const [loading, setLoading] = useState<boolean>(true);
  const [promotingProduct, setPromotingProduct] = useState<FeaturedProductItem | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState<boolean>(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/featured-placement/dashboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        if (data.configs) {
          setConfigs(data.configs);
        }
      }
    } catch (err) {
      console.error("Failed to load promotion dashboard:", err);
      toast("خطا در دریافت اطلاعات تبلیغات ویژه", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Check payment callback status in URL query params
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment_status");
    if (paymentStatus) {
      if (paymentStatus === "success") {
        toast("تبلیغ ویژه با موفقیت فعال شد! 🎉 محصول شما در صدر پیشنهادات قرار گرفت.", "success");
      } else if (paymentStatus === "failed") {
        toast("پرداخت ناموفق بود یا توسط کاربر لغو شد.", "error");
      } else if (paymentStatus === "error") {
        const msg = params.get("message") || "خطا در تأیید تراکنش";
        toast(`خطا در تأیید پرداخت: ${msg}`, "error");
      }
      
      // Clean query params
      const newUrl = window.location.pathname;
      window.history.replaceState(null, "", newUrl);
    }
  }, []);

  // Set up second-by-second countdown timer for active products
  useEffect(() => {
    if (products.length === 0) return;

    const timer = setInterval(() => {
      setProducts(prev => 
        prev.map(p => {
          if (p.featuredStatus === "ACTIVE" && p.remainingSeconds > 0) {
            return { ...p, remainingSeconds: p.remainingSeconds - 1 };
          }
          if (p.featuredStatus === "ACTIVE" && p.remainingSeconds === 0) {
            return { ...p, featuredStatus: "EXPIRED" };
          }
          return p;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [products]);

  const handlePromoteCheckout = async (product: FeaturedProductItem) => {
    setCheckoutLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      // Construct callback redirect URL pointing back to our authoritative callback endpoint
      const callbackUrl = `${window.location.origin}/api/public/featured-payment/callback`;

      const res = await fetch("/api/supplier/featured-placement/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          callbackUrl
        })
      });

      const data = await res.json();
      if (res.ok && data.payLink) {
        toast("در حال انتقال به درگاه پرداخت ایمن زیبال...", "success");
        // Redirect supplier to the payment gateway
        window.location.href = data.payLink;
      } else {
        toast(data.error || "خطا در ارتباط با درگاه پرداخت", "error");
      }
    } catch (err) {
      console.error("Promotion checkout error:", err);
      toast("خطای ارتباط با سرور پرداخت", "error");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const formatTime = (totalSec: number) => {
    if (totalSec <= 0) return "منقضی شده";
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Metrics aggregate calculation
  const totalImpressions = products.reduce((acc, p) => acc + (p.metrics?.impressions || 0), 0);
  const totalClicks = products.reduce((acc, p) => acc + (p.metrics?.clicks || 0), 0);
  const totalImports = products.reduce((acc, p) => acc + (p.metrics?.imports || 0), 0);
  const totalOrders = products.reduce((acc, p) => acc + (p.metrics?.orders || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in text-right" dir="rtl">
      
      {/* Promotion Benefits & Value Stack Header */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-amber-500/10 border-2 border-amber-500/25 p-6 rounded-3xl shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Zap className="w-6 h-6 fill-amber-500 animate-bounce" />
              <h2 className="text-xl font-black">تبلیغات کلیکی و ویژه محصولات (Sponsored Placement)</h2>
            </div>
            <p className="text-sm text-secondary leading-relaxed max-w-3xl">
              محصولات خود را مستقیماً به صفحه نخست و بالای پیشنهادهای هوشمند بیش از <strong>۳,۰۰۰ فروشگاه فعال</strong> زوپیت انتقال دهید! با قرارگیری در این جایگاه ممتاز، فروش، ایمپورت محصولات و دیده شدن برند شما تا <strong>۶ برابر افزایش</strong> می‌یابد.
            </p>
          </div>
          <div className="bg-card px-5 py-3.5 rounded-2xl border border-subtle shadow-sm flex flex-col items-center shrink-0">
            <span className="text-xs text-muted font-bold">بسته طلایی ۲۴ ساعته</span>
            <span className="text-xl font-black text-primary mt-1">{(configs.priceToman).toLocaleString()} تومان</span>
            <span className="text-[10px] text-success font-extrabold mt-1">فروش و سود تضمینی</span>
          </div>
        </div>

        {/* Benefits Value List */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-subtle">
          <div className="flex items-start gap-2.5 bg-card/60 p-3 rounded-2xl">
            <div className="bg-amber-100 dark:bg-amber-500/20 text-amber-600 p-1.5 rounded-xl mt-0.5">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-primary">صدرنشینی هوشمند</h4>
              <p className="text-[10px] text-muted mt-0.5">جایگاه اول و دوم در صفحه پیشنهادها</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-card/60 p-3 rounded-2xl">
            <div className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 p-1.5 rounded-xl mt-0.5">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-primary">تطبیق هوشمند فروشگاه</h4>
              <p className="text-[10px] text-muted mt-0.5">نمایش اختصاصی به متقاضیان مرتبط</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-card/60 p-3 rounded-2xl">
            <div className="bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 p-1.5 rounded-xl mt-0.5">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-primary">برچسب لوکس تبلیغاتی</h4>
              <p className="text-[10px] text-muted mt-0.5">افزایش اعتماد و کلیک با نشان «ویژه»</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-card/60 p-3 rounded-2xl">
            <div className="bg-rose-100 dark:bg-rose-500/20 text-rose-600 p-1.5 rounded-xl mt-0.5">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-primary">گزارش آنی و پیشرفته</h4>
              <p className="text-[10px] text-muted mt-0.5">مشاهده زنده تعداد کلیک، نمایش و ایمپورت</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-3xl border border-subtle shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-muted font-bold">کل نمایش (Impressions)</span>
            <h3 className="text-xl font-black text-primary mt-1">{totalImpressions.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-card p-4 rounded-3xl border border-subtle shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-muted font-bold">کل کلیک‌ها (Views)</span>
            <h3 className="text-xl font-black text-primary mt-1">
              {totalClicks.toLocaleString()}
              {totalImpressions > 0 && (
                <span className="text-[11px] text-muted font-normal mr-1.5">
                  ({((totalClicks / totalImpressions) * 100).toFixed(1)}% CTR)
                </span>
              )}
            </h3>
          </div>
        </div>

        <div className="bg-card p-4 rounded-3xl border border-subtle shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-muted font-bold">افزودن به فروشگاه‌ها</span>
            <h3 className="text-xl font-black text-primary mt-1">{totalImports.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-card p-4 rounded-3xl border border-subtle shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-600 rounded-2xl flex items-center justify-center shrink-0">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-muted font-bold">سفارشات دریافتی</span>
            <h3 className="text-xl font-black text-primary mt-1">{totalOrders.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Main Promotion Table */}
      <div className="bg-card rounded-3xl border border-subtle shadow-sm overflow-hidden">
        <div className="p-5 border-b border-subtle flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-primary">لیست محصولات و وضعیت تبلیغات ویژه</h3>
            <p className="text-xs text-muted mt-1">از این بخش محصولات برتر خود را ارتقا دهید و گزارش عملکرد هر تبلیغ را بررسی نمایید.</p>
          </div>
          <button 
            onClick={fetchDashboard}
            className="text-xs text-secondary hover:text-primary font-bold flex items-center gap-1.5 bg-surface border border-subtle px-3 py-1.5 rounded-xl cursor-pointer"
          >
            به‌روزرسانی آمار 🔄
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted">در حال بارگذاری آمار تبلیغات...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center text-muted flex flex-col items-center justify-center gap-3">
            <Package className="w-12 h-12 opacity-30" />
            <p className="font-bold text-sm">هیچ محصولی جهت ویژه کردن یافت نشد.</p>
            <p className="text-xs text-muted">ابتدا از منوی «افزودن محصول» کالایی اضافه کنید.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-surface border-b border-subtle text-xs text-muted font-bold">
                  <th className="p-4">محصول</th>
                  <th className="p-4">دسته‌بندی</th>
                  <th className="p-4">وضعیت محصول</th>
                  <th className="p-4">وضعیت ویژه</th>
                  <th className="p-4">زمان باقیمانده</th>
                  <th className="p-4 text-center">آمار تبلیغ (نمایش / کلیک / ایمپورت)</th>
                  <th className="p-4 text-left">عملیات ارتقا</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-surface/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-surface border border-subtle overflow-hidden flex items-center justify-center">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} className="w-full h-full object-cover" alt={product.name} />
                          ) : (
                            <Package className="w-6 h-6 text-muted opacity-40" />
                          )}
                        </div>
                        <div>
                          <span className="font-extrabold text-primary text-sm line-clamp-1 max-w-xs">{product.name}</span>
                          <span className="text-[11px] text-muted font-mono block mt-0.5">شناسه: ZOP-{product.id}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-secondary font-medium">{product.categoryName}</td>
                    
                    <td className="p-4">
                      {product.inventory > 0 ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                          موجود ({product.inventory} عدد)
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded-full">
                          ناموجود در انبار
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      {product.featuredStatus === "ACTIVE" && (
                        <span className="text-xs font-extrabold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full inline-flex items-center gap-1.5 shadow-sm border border-emerald-500/20">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          فعال (Sponsored)
                        </span>
                      )}
                      {product.featuredStatus === "PENDING_PAYMENT" && (
                        <span className="text-xs font-bold text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full">
                          در انتظار پرداخت
                        </span>
                      )}
                      {product.featuredStatus === "PAYMENT_FAILED" && (
                        <span className="text-xs font-bold text-rose-600 bg-rose-500/10 px-3 py-1 rounded-full">
                          پرداخت ناموفق
                        </span>
                      )}
                      {product.featuredStatus === "EXPIRED" && (
                        <span className="text-xs font-bold text-secondary bg-surface border border-subtle px-3 py-1 rounded-full">
                          منقضی شده
                        </span>
                      )}
                      {(product.featuredStatus === "NONE" || !product.featuredStatus) && (
                        <span className="text-xs font-medium text-muted bg-surface/50 px-3 py-1 rounded-full border border-subtle">
                          بدون تبلیغ
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      {product.featuredStatus === "ACTIVE" ? (
                        <span className="font-mono font-bold text-amber-600 bg-amber-500/5 px-2 py-1 rounded-lg border border-amber-500/10 text-xs inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatTime(product.remainingSeconds)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">-</span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      {product.featuredStatus === "ACTIVE" || product.featuredStatus === "EXPIRED" ? (
                        <div className="flex items-center justify-center gap-3.5 text-xs">
                          <div className="flex flex-col items-center">
                            <span className="text-muted text-[10px] font-bold">نمایش</span>
                            <span className="font-black text-primary mt-0.5">{product.metrics?.impressions || 0}</span>
                          </div>
                          <div className="w-[1px] h-6 bg-subtle" />
                          <div className="flex flex-col items-center">
                            <span className="text-muted text-[10px] font-bold">کلیک</span>
                            <span className="font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{product.metrics?.clicks || 0}</span>
                          </div>
                          <div className="w-[1px] h-6 bg-subtle" />
                          <div className="flex flex-col items-center">
                            <span className="text-muted text-[10px] font-bold">ایمپورت</span>
                            <span className="font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{product.metrics?.imports || 0}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted">-</span>
                      )}
                    </td>

                    <td className="p-4 text-left">
                      {product.isEligible ? (
                        <button
                          onClick={() => setPromotingProduct(product)}
                          className="bg-primary hover:bg-primary-hover text-white text-xs font-black px-4 py-2 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {product.featuredStatus === "ACTIVE" ? "تمدید تبلیغ 🔄" : "ارتقا به ویژه ✨"}
                        </button>
                      ) : (
                        <span className="text-xs text-muted font-bold bg-surface p-2 rounded-xl border border-subtle inline-flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          عدم صلاحیت فنی
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Promotion value stack Modal / Dialog */}
      {promotingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-subtle shadow-2xl overflow-hidden text-right" dir="rtl">
            
            {/* Header */}
            <div className="p-6 border-b border-subtle flex items-center justify-between bg-gradient-to-l from-amber-500/10 to-transparent">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                <h3 className="font-extrabold text-base text-primary">تأیید درخواست ارتقای محصول به ویژه</h3>
              </div>
              <button 
                onClick={() => setPromotingProduct(null)}
                className="text-muted hover:text-primary text-xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            {/* Body / Value Stack Checklist */}
            <div className="p-6 space-y-6">
              
              {/* Product Info Block */}
              <div className="flex items-center gap-3.5 bg-surface p-4 rounded-2xl border border-subtle">
                <div className="w-14 h-14 bg-card rounded-xl border border-subtle overflow-hidden flex items-center justify-center shrink-0">
                  {promotingProduct.imageUrl ? (
                    <img src={promotingProduct.imageUrl} className="w-full h-full object-cover" alt={promotingProduct.name} />
                  ) : (
                    <Package className="w-6 h-6 text-muted opacity-40" />
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-primary line-clamp-1">{promotingProduct.name}</h4>
                  <p className="text-xs text-muted mt-1">دسته‌بندی: {promotingProduct.categoryName}</p>
                </div>
              </div>

              {/* Value checklist */}
              <div className="space-y-3.5">
                <h5 className="text-xs font-black text-muted">مزایای انحصاری بسته‌ ارتقای ویژه:</h5>
                
                <div className="flex items-start gap-2.5 text-xs text-secondary leading-relaxed">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>۶۰۰٪ شانس بیشتر دیده شدن:</strong> قرارگیری در ابتدای بخش پیشنهادات برای همه فروشگاه‌های مرتبط.</span>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-secondary leading-relaxed">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>برچسب لوکس «ویژه» (Sponsored):</strong> افزایش ۳ برابری نرخ کلیک طبیعی (CTR) نسبت به سایر کالاها.</span>
                </div>

                <div className="flex items-start gap-2.5 text-xs text-secondary leading-relaxed">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>جذب معرفی‌کنندگان فعال:</strong> دسترسی گسترده همکاران برای فروش کاتالوگی آسان.</span>
                </div>
              </div>

              {/* Price details */}
              <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-secondary">مدت زمان نمایش ویژه:</span>
                  <span className="font-bold text-primary">{configs.durationHours} ساعت</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-secondary">هزینه کل بسته تبلیغاتی:</span>
                  <span className="font-black text-amber-600">{(configs.priceToman).toLocaleString()} تومان</span>
                </div>
              </div>

            </div>

            {/* Footer buttons */}
            <div className="p-6 bg-surface border-t border-subtle flex gap-3">
              <button
                onClick={() => handlePromoteCheckout(promotingProduct)}
                disabled={checkoutLoading}
                className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-white text-xs font-black py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10"
              >
                {checkoutLoading ? "در حال ایجاد فاکتور..." : "تأیید و پرداخت آنلاین زیبال 💳"}
              </button>
              <button
                onClick={() => setPromotingProduct(null)}
                className="bg-card hover:bg-surface border border-subtle text-secondary text-xs font-bold px-4 py-3 rounded-xl transition-all cursor-pointer"
              >
                انصراف
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
