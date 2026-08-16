import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Crown,
  Sparkles,
  Phone,
  Mail,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Send,
  MessageSquare,
  Search,
  RefreshCw,
  Award,
  DollarSign,
  ShoppingCart,
  ExternalLink,
  ChevronLeft,
  X,
  CheckCircle2,
  Building,
  CreditCard,
  Globe,
  Sliders,
  HelpCircle
} from "lucide-react";
import { toast } from "../GlobalToast";

interface TopStoresManagerProps {
  showNotification?: (message: string, type: "success" | "error") => void;
}

export default function TopStoresManager({ showNotification }: TopStoresManagerProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    topStores: any[];
    allStores: any[];
    averageSales: number;
    averageOrderCount: number;
    totalSalesSum: number;
    totalOrdersCount: number;
    totalStoresCount: number;
    topStoresCount: number;
  }>({
    topStores: [],
    allStores: [],
    averageSales: 0,
    averageOrderCount: 0,
    totalSalesSum: 0,
    totalOrdersCount: 0,
    totalStoresCount: 0,
    topStoresCount: 0
  });

  const [activeView, setActiveView] = useState<"top" | "all">("top");
  const [searchTerm, setSearchTerm] = useState("");
  const [complianceFilter, setComplianceFilter] = useState("ALL"); // ALL, MISSING_TAX, MISSING_ENAMAD, COMPLIANT

  // Modal for Exclusive VIP Communication
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [contactSubject, setContactSubject] = useState("پیگیری پرونده مالیاتی و توسعه اختصاصی فروشگاه");
  const [contactDepartment, setContactDepartment] = useState("مدیریت و امور مالیاتی و مدارک");
  const [contactPriority, setContactPriority] = useState("CRITICAL");
  const [contactMessage, setContactMessage] = useState("");
  const [smsNotify, setSmsNotify] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Quick Preset message templates
  const messagePresets = [
    {
      title: "پرونده مالیاتی و درگاه اختصاصی",
      subject: "راهنمایی و پیگیری تکمیل پرونده مالیاتی و اتصال درگاه اختصاصی فروشگاه",
      text: `سلام و درود،
با توجه به ثبت فروش فوق‌العاده و حجم بالای سفارشات در فروشگاه شما (بالاتر از میانگین شبکه فروشندگان زوپیت)، تیم مدیریت مایل است جهت تشکیل و ساماندهی پرونده مالیاتی و اتصال درگاه اختصاصی بانکی شما، پشتیبانی اختصاصی و مرحله‌به‌مرحله ارائه دهد.
لطفاً آخرین وضعیت کد رهگیری مالیاتی خود را در پاسخ به همین پیام اعلام نمایید تا در اسرع وقت هماهنگی‌های لازم صورت پذیرد.`
    },
    {
      title: "توسعه کسب‌وکار و اختصاص نماینده فنی",
      subject: "جلسه مشاوره اختصاصی رشد فروش و بررسی نیازمندی‌های فنی فروشگاه",
      text: `با سلام و احترام،
فروشگاه شما به عنوان یکی از فروشگاه‌های پیشرو و برتر شبکه زوپیت شناخته شده است. به منظور بررسی نیازهای اختصاصی شما از جمله بهینه‌سازی هاست، ارتقای ابزارهای مارکتینگ و ارتباط مستقیم با دپارتمان فنی، این خط ارتباط اختصاصی برقرار شده است.
خوشحال می‌شویم هرگونه پیشنهاد یا نیاز فنی خود را با ما در میان بگذارید.`
    },
    {
      title: "یادآوری مدارک حقوقی و نماد اعتماد (اینماد)",
      subject: "تکمیل مدارک احراز هویت حقوقی و دریافت اینماد اختصاصی دامنه",
      text: `فروشنده گرامی،
جهت پایداری و تثبیت وضعیت حقوقی فروشگاه اینترنتی اختصاصی شما، خواهشمند است مدارک هویتی و ثبت‌نام در سامانه اینماد را تکمیل فرمایید. کارشناسان ما آماده همراهی شما در تمامی مراحل دریافت اینماد و ثبت پرونده می‌باشند.`
    }
  ];

  useEffect(() => {
    fetchTopStores();
  }, []);

  const fetchTopStores = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/superadmin/top-stores", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        setData(result);
      } else {
        const msg = "خطا در دریافت لیست فروشگاه‌های برتر";
        if (showNotification) showNotification(msg, "error");
        else toast(msg, "error");
      }
    } catch (err: any) {
      console.error(err);
      toast("خطا در برقراری ارتباط با سرور", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenContact = (store: any) => {
    setSelectedStore(store);
    setContactSubject(`پیگیری پرونده مالیاتی و توسعه فروشگاه ${store.storeName || store.fullName}`);
    setContactMessage(messagePresets[0].text);
    setContactModalOpen(true);
  };

  const handleSendExclusiveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore || !contactMessage) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/superadmin/top-stores/${selectedStore.id}/exclusive-contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: contactSubject,
          department: contactDepartment,
          priority: contactPriority,
          message: contactMessage,
          smsNotify
        })
      });

      const resData = await res.json();
      if (res.ok) {
        const msg = `پیام اختصاصی با موفقیت برای مدیر فروشگاه (${selectedStore.storeName || selectedStore.fullName}) ارسال شد.`;
        if (showNotification) showNotification(msg, "success");
        else toast(msg, "success");
        setContactModalOpen(false);
      } else {
        const msg = resData.error || "خطا در ارسال پیام";
        if (showNotification) showNotification(msg, "error");
        else toast(msg, "error");
      }
    } catch (err: any) {
      toast(err.message || "خطا در ارسال پیام اختصاصی", "error");
    } finally {
      setSendingMessage(false);
    }
  };

  const handleToggleCompliance = async (storeId: number, field: "hasTaxProfile" | "hasEnamad" | "hasGateway", currentValue: boolean) => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/superadmin/top-stores/${storeId}/compliance`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ [field]: !currentValue })
      });

      if (res.ok) {
        toast("وضعیت مدارک با موفقیت بروزرسانی گردید", "success");
        fetchTopStores();
      }
    } catch (err) {
      toast("خطا در بروزرسانی مدارک", "error");
    }
  };

  const currentList = activeView === "top" ? data.topStores : data.allStores;

  const filteredStores = currentList.filter((s) => {
    const nameMatch =
      (s.storeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.mobile || "").includes(searchTerm) ||
      (s.username || "").toLowerCase().includes(searchTerm.toLowerCase());

    if (!nameMatch) return false;

    if (complianceFilter === "MISSING_TAX") return !s.hasTaxProfile;
    if (complianceFilter === "MISSING_ENAMAD") return !s.hasEnamad;
    if (complianceFilter === "COMPLIANT") return s.hasTaxProfile && s.hasEnamad && s.hasGateway;

    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-black">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>هوش تجاری و باشگاه فروشندگان برتر زوپیت</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-white">
              شناسایی هوشمند فروشندگان پرفروش و ارتباط اختصاصی VIP
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              سیستم به صورت خودکار فروشندگانی که حجم فروش و تعداد سفارشات آن‌ها بالاتر از میانگین کل شبکه است را تحلیل و شناسایی کرده و کانال ارتباط مستقیم جهت رسیدگی به پرونده مالیاتی، اینماد و ارتقای زیرساخت فراهم می‌نماید.
            </p>
          </div>

          <button
            onClick={fetchTopStores}
            className="px-4 py-2.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/30 text-indigo-200 text-xs font-bold rounded-2xl flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>بروزرسانی داده‌ها</span>
          </button>
        </div>
      </div>

      {/* Analytics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-card border border-border-subtle p-5 rounded-3xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-bold">میانگین فروش کل شبکه:</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-primary font-mono">
            {Math.round(data.averageSales).toLocaleString("fa-IR")}{" "}
            <span className="text-xs text-muted font-normal">تومان</span>
          </p>
          <span className="text-[11px] text-muted block">معیار سنجش فروشندگان برتر</span>
        </div>

        {/* KPI 2 */}
        <div className="bg-card border border-border-subtle p-5 rounded-3xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-bold">تعداد فروشندگان برتر (بالاتر از میانگین):</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
              {data.topStoresCount}
            </span>
            <span className="text-xs text-muted">از مجموع {data.totalStoresCount} فروشگاه</span>
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 block font-bold">
            {data.totalStoresCount > 0 ? `${Math.round((data.topStoresCount / data.totalStoresCount) * 100)}٪ جامعه فروشندگان` : "۰٪"}
          </span>
        </div>

        {/* KPI 3 */}
        <div className="bg-card border border-border-subtle p-5 rounded-3xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-bold">میانگین سفارشات هر فروشگاه:</span>
            <ShoppingCart className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-black text-primary font-mono">
            {Math.round(data.averageOrderCount)}{" "}
            <span className="text-xs text-muted font-normal">سفارش</span>
          </p>
          <span className="text-[11px] text-muted block">مجموع کل: {data.totalOrdersCount} سفارش</span>
        </div>

        {/* KPI 4 */}
        <div className="bg-card border border-border-subtle p-5 rounded-3xl space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-bold">گردش مالی کل شبکه:</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-black text-purple-600 dark:text-purple-400 font-mono truncate">
            {Math.round(data.totalSalesSum).toLocaleString("fa-IR")}{" "}
            <span className="text-xs text-muted font-normal">تومان</span>
          </p>
          <span className="text-[11px] text-muted block">حجم مبادلات موفق</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-card border border-border-subtle rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
        {/* Controls: Search, View Switcher & Filters */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-border-subtle pb-6">
          <div className="flex items-center gap-2 bg-surface p-1.5 rounded-2xl border border-subtle">
            <button
              onClick={() => setActiveView("top")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeView === "top"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-muted hover:text-primary"
              }`}
            >
              <Award className="w-4 h-4 text-amber-300" />
              <span>فروشندگان برتر (بالای میانگین: {data.topStoresCount})</span>
            </button>
            <button
              onClick={() => setActiveView("all")}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                activeView === "all"
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-muted hover:text-primary"
              }`}
            >
              <Building className="w-4 h-4" />
              <span>همه فروشگاه‌ها ({data.totalStoresCount})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Filter by Compliance */}
            <select
              value={complianceFilter}
              onChange={(e) => setComplianceFilter(e.target.value)}
              className="px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs text-primary font-bold outline-none focus:border-indigo-500"
            >
              <option value="ALL">همه وضعیت‌های مدارک</option>
              <option value="MISSING_TAX">فاقد پرونده مالیاتی</option>
              <option value="MISSING_ENAMAD">فاقد اینماد</option>
              <option value="COMPLIANT">مدارک کامل و احراز شده</option>
            </select>

            {/* Search Input */}
            <div className="relative flex-1 lg:w-64">
              <Search className="w-4 h-4 text-muted absolute right-3 top-3" />
              <input
                type="text"
                placeholder="جستجوی نام فروشگاه، مدیر، شماره..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-3 pr-9 py-2 bg-background border border-subtle rounded-xl text-xs text-primary placeholder-muted outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Top Stores Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-surface text-muted">
              <tr>
                <th className="px-4 py-3.5 font-bold">فروشگاه و مدیر</th>
                <th className="px-4 py-3.5 font-bold">نوع اکانت</th>
                <th className="px-4 py-3.5 font-bold">حجم فروش (تومان)</th>
                <th className="px-4 py-3.5 font-bold">تعداد سفارش</th>
                <th className="px-4 py-3.5 font-bold">نسبت به میانگین</th>
                <th className="px-4 py-3.5 font-bold text-center">پرونده مالیاتی</th>
                <th className="px-4 py-3.5 font-bold text-center">اینماد</th>
                <th className="px-4 py-3.5 font-bold text-center">درگاه پرداخت</th>
                <th className="px-4 py-3.5 font-bold text-center">عملیات VIP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle text-primary">
              {filteredStores.map((store, index) => {
                return (
                  <tr key={store.id} className="hover:bg-surface/50 transition-colors">
                    {/* Store & Owner Info */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center font-bold font-mono text-xs shrink-0">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-primary text-sm">{store.storeName}</span>
                            {store.domainName && (
                              <a
                                href={`https://${store.domainName}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5 font-mono"
                              >
                                <span>{store.domainName}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                          <span className="text-[11px] text-muted block mt-0.5">
                            {store.fullName} • {store.mobile}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Pro Account Status */}
                    <td className="px-4 py-3.5">
                      {store.isPro ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          <Crown className="w-3 h-3 text-amber-500" />
                          <span>اکانت پرو (فعال)</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-muted">اکانت پایه</span>
                      )}
                    </td>

                    {/* Sales Volume */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                        {store.salesVolume.toLocaleString("fa-IR")}
                      </span>
                    </td>

                    {/* Order Count */}
                    <td className="px-4 py-3.5">
                      <span className="font-mono font-bold text-xs text-primary">
                        {store.orderCount} سفارش
                      </span>
                    </td>

                    {/* Above Average Indicator */}
                    <td className="px-4 py-3.5">
                      {store.salesVolume > data.averageSales ? (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>+{store.salesAboveAvgPercentage}٪</span>
                        </span>
                      ) : (
                        <span className="text-xs text-muted font-mono">عادی</span>
                      )}
                    </td>

                    {/* Tax Profile Status & Toggle */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleCompliance(store.id, "hasTaxProfile", store.hasTaxProfile)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                          store.hasTaxProfile
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        }`}
                        title="کلیک برای تغییر وضعیت"
                      >
                        {store.hasTaxProfile ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>ثبت شده</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3 h-3 text-rose-500" />
                            <span>فاقد پرونده</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Enamad Status */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleCompliance(store.id, "hasEnamad", store.hasEnamad)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                          store.hasEnamad
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        }`}
                        title="کلیک برای تغییر وضعیت"
                      >
                        {store.hasEnamad ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>دارد</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3 h-3 text-amber-500" />
                            <span>ندارد</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Gateway Status */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleCompliance(store.id, "hasGateway", store.hasGateway)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                          store.hasGateway
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-zinc-500/10 text-muted border border-border"
                        }`}
                        title="کلیک برای تغییر وضعیت"
                      >
                        {store.hasGateway ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            <span>متصل</span>
                          </>
                        ) : (
                          <span>نامشخص</span>
                        )}
                      </button>
                    </td>

                    {/* Action: Contact VIP */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenContact(store)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center gap-1.5 mx-auto cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>ارتباط انحصاری</span>
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredStores.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-muted">
                    فروشگاهی با این مشخصات یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXCLUSIVE DIRECT VIP CONTACT MODAL */}
      {contactModalOpen && selectedStore && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border-subtle rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-6 border-b border-border-subtle flex items-center justify-between bg-gradient-to-r from-indigo-950/40 via-card to-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-primary flex items-center gap-2">
                    <span>ارتباط انحصاری و مستقیم با فروشنده برتر</span>
                    <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                      VIP DIRECT
                    </span>
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    فروشگاه: <strong>{selectedStore.storeName}</strong> ({selectedStore.fullName} - {selectedStore.mobile})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setContactModalOpen(false)}
                className="p-2 text-muted hover:text-primary rounded-xl hover:bg-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendExclusiveContact} className="p-6 space-y-4">
              {/* Quick Template Selector */}
              <div>
                <label className="block text-xs font-bold text-secondary mb-2">
                  الگوهای آماده پیام اختصاصی:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {messagePresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setContactSubject(preset.subject);
                        setContactMessage(preset.text);
                      }}
                      className="p-2.5 rounded-xl border border-subtle bg-surface hover:border-indigo-500 text-right text-[11px] font-bold text-primary transition-all cursor-pointer"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  موضوع پیام و تیکت اولویت‌دار:
                </label>
                <input
                  type="text"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs text-primary font-bold outline-none focus:border-indigo-500"
                />
              </div>

              {/* Department & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1.5">
                    دپارتمان رسیدگی:
                  </label>
                  <select
                    value={contactDepartment}
                    onChange={(e) => setContactDepartment(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs text-primary font-bold outline-none focus:border-indigo-500"
                  >
                    <option value="مدیریت و امور مالیاتی و مدارک">مدیریت و امور مالیاتی و مدارک</option>
                    <option value="دپارتمان فنی و زیرساخت هاست">دپارتمان فنی و زیرساخت هاست</option>
                    <option value="مشاوره مارکتینگ و اتصال ترب">مشاوره مارکتینگ و اتصال ترب</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1.5">
                    سطح اولویت:
                  </label>
                  <select
                    value={contactPriority}
                    onChange={(e) => setContactPriority(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs text-primary font-bold outline-none focus:border-indigo-500"
                  >
                    <option value="CRITICAL">🔴 بسیار فوری (Critical VIP)</option>
                    <option value="HIGH">🟠 بالا (High)</option>
                    <option value="MEDIUM">🟡 عادی</option>
                  </select>
                </div>
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  متن پیام انحصاری مدیریت:
                </label>
                <textarea
                  rows={6}
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  className="w-full p-4 bg-background border border-subtle rounded-2xl text-xs text-primary leading-relaxed outline-none focus:border-indigo-500 font-sans"
                  placeholder="متن پیام خود را برای فروشنده بنویسید..."
                />
              </div>

              {/* SMS Option */}
              <div className="bg-surface p-3.5 rounded-2xl border border-subtle flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <div>
                    <span className="text-xs font-bold text-primary block">ارسال پیامک اطلاع‌رسانی فوری (SMS)</span>
                    <span className="text-[11px] text-muted">ارسال پیامک آنی به شماره {selectedStore.mobile} جهت بررسی پنل</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={smsNotify}
                  onChange={(e) => setSmsNotify(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  className="px-5 py-2.5 bg-surface hover:bg-subtle text-secondary text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={sendingMessage}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {sendingMessage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>ارسال پیام اختصاصی و بازگشایی تیکت VIP</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
