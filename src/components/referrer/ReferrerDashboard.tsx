import React, { useState, useEffect } from "react";
import {
  Users,
  Wallet,
  Copy,
  Check,
  Share2,
  HelpCircle,
  TrendingUp,
  Clock,
  UserCheck,
  RefreshCw,
  LogOut,
  Gift,
  ArrowUpRight,
  ShieldCheck,
  UserX
} from "lucide-react";
import { useSyncTabWithUrl } from "../../utils/routeSync";

export default function ReferrerDashboard({ currentUser, onLogout, showNotification }: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith("/referrer/") && path.length > "/referrer/".length) {
        return path.replace("/referrer/", "");
      }
    }
    return "overview";
  });

  // Sync tab with URL
  useSyncTabWithUrl("/referrer", activeTab, setActiveTab as any, "overview");

  const fetchStats = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/referrer/stats", {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
        const result = await res.json();
        setData(result);
      } else {
        showNotification("خطا در دریافت اطلاعات داشبورد معرف", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("خطای ارتباط با سرور", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCopyCode = () => {
    if (!data?.referrerCode) return;
    navigator.clipboard.writeText(data.referrerCode);
    setCopied(true);
    showNotification("کد معرف کپی شد", "success");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    if (!data?.referrerCode) return;
    const link = `${window.location.origin}/?ref=${data.referrerCode}`;
    navigator.clipboard.writeText(link);
    showNotification("لینک دعوت اختصاصی کپی شد", "success");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-success/15 text-success border border-success/20">
            <UserCheck className="w-3.5 h-3.5" />
            فعال و تایید شده
          </span>
        );
      case "ACTIVE_NEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-warning/15 text-warning border border-warning/20">
            <Clock className="w-3.5 h-3.5" />
            در انتظار تایید مدارک
          </span>
        );
      case "BLOCKED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-danger/15 text-danger border border-danger/20">
            <UserX className="w-3.5 h-3.5" />
            مسدود شده
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary/15 text-secondary border border-secondary/20">
            {status}
          </span>
        );
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mr-2 mb-4"></div>
        <span className="text-text-secondary text-sm font-medium">در حال دریافت اطلاعات پنل همکاری...</span>
      </div>
    );
  }

  const stats = data?.stats || { totalReferred: 0, activeSuppliersCount: 0, pendingSuppliersCount: 0 };
  const referredSuppliers = data?.referredSuppliers || [];

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans pb-12" dir="rtl">
      {/* Top Header Navbar */}
      <header className="bg-card border-b border-border-default sticky top-0 z-30 shadow-sm backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary-default p-2 rounded-xl text-white">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-text-primary">پنل همکاری معرفین (Referrer)</h1>
              <p className="text-xs text-text-muted">سیستم بازاریابی و دعوت تامین‌کنندگان</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-left hidden sm:block">
              <div className="text-sm font-bold">{currentUser.firstName} {currentUser.lastName}</div>
              <div className="text-xs text-text-muted font-mono">{currentUser.username}</div>
            </div>

            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 bg-danger/10 text-danger hover:bg-danger/20 px-4 py-2 rounded-xl text-sm font-bold transition-all"
            >
              <LogOut className="w-4 h-4" />
              خروج
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Banner with referral links */}
        <div className="bg-gradient-to-r from-indigo-700 to-primary-default text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute left-0 bottom-0 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl -ml-16 -mb-16"></div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md">
                برنامه دعوت و کسب درآمد
              </span>
              <h2 className="text-2xl sm:text-3xl font-black leading-tight">
                با دعوت از تامین‌کنندگان، درآمد همیشگی کسب کنید!
              </h2>
              <p className="text-sm text-indigo-100 leading-relaxed max-w-xl">
                با ارسال کد یا لینک دعوت اختصاصی خود به تولیدکنندگان و تامین‌کنندگان بزرگ، آن‌ها را به بازارچه بزرگ ما دعوت کنید و از هر معامله آن‌ها سود دائمی ببرید.
              </p>
            </div>

            <div className="lg:col-span-5 bg-white/10 backdrop-blur-lg border border-white/10 p-6 rounded-2xl space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-indigo-100">کد دعوت اختصاصی شما</label>
                <div className="flex bg-white/10 border border-white/20 rounded-xl overflow-hidden p-1.5 items-center justify-between">
                  <span className="font-mono font-black text-lg px-3 tracking-widest">{data?.referrerCode}</span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 bg-white text-indigo-900 hover:bg-indigo-50 px-4 py-2 rounded-lg text-xs font-extrabold transition-all shadow"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "کپی شد" : "کپی کد"}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-indigo-100">لینک دعوت مستقیم برای ثبت‌نام</label>
                <div className="flex bg-white/10 border border-white/20 rounded-xl overflow-hidden p-1.5 items-center justify-between">
                  <span className="font-mono text-xs truncate max-w-[180px] sm:max-w-[240px] px-2 text-indigo-200">
                    {window.location.origin}/?ref={data?.referrerCode}
                  </span>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-500 px-4 py-2 rounded-lg text-xs font-extrabold transition-all shadow"
                  >
                    <Share2 className="w-4 h-4" />
                    کپی لینک
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Statistics Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Wallet Balance Card */}
          <div className="bg-card p-6 rounded-2xl border border-border-default shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-text-muted">موجودی کیف پول شما</span>
                <h3 className="text-2xl font-black tracking-tight text-primary-default mt-2">
                  {Number(data?.wallet?.balance || 0).toLocaleString("fa-IR")} <span className="text-xs font-medium">ریال</span>
                </h3>
              </div>
              <div className="bg-primary-default/10 text-primary-default p-3 rounded-xl">
                <Wallet className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border-default/60 flex items-center justify-between">
              <span className="text-[10px] text-text-muted">قابل تسویه حساب آنی</span>
              <button
                onClick={() => showNotification("جهت تسویه حساب لطفاً با پشتیبانی هماهنگ فرمایید.", "info")}
                className="text-xs font-extrabold text-primary-default hover:text-primary-hover flex items-center gap-1"
              >
                درخواست تسویه
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Total Referred Users Card */}
          <div className="bg-card p-6 rounded-2xl border border-border-default shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-text-muted">کل تامین‌کنندگان دعوت شده</span>
                <h3 className="text-2xl font-black tracking-tight text-text-primary mt-2">
                  {stats.totalReferred} <span className="text-xs font-medium">فروشگاه</span>
                </h3>
              </div>
              <div className="bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 p-3 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border-default/60">
              <span className="text-[10px] text-success font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                در حال رشد و توسعه بازار
              </span>
            </div>
          </div>

          {/* Active Referred Users Card */}
          <div className="bg-card p-6 rounded-2xl border border-border-default shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-text-muted">تامین‌کنندگان فعال</span>
                <h3 className="text-2xl font-black tracking-tight text-success mt-2">
                  {stats.activeSuppliersCount} <span className="text-xs font-medium">فروشگاه</span>
                </h3>
              </div>
              <div className="bg-success/10 text-success p-3 rounded-xl">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border-default/60">
              <span className="text-[10px] text-text-muted">سفارشات موفق فعال دارند</span>
            </div>
          </div>

          {/* Pending Referred Users Card */}
          <div className="bg-card p-6 rounded-2xl border border-border-default shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-text-muted">در انتظار تایید مدارک</span>
                <h3 className="text-2xl font-black tracking-tight text-warning mt-2">
                  {stats.pendingSuppliersCount} <span className="text-xs font-medium">فروشگاه</span>
                </h3>
              </div>
              <div className="bg-warning/10 text-warning p-3 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border-default/60">
              <span className="text-[10px] text-text-muted">واحد نظارت در حال بررسی مدارک است</span>
            </div>
          </div>
        </div>

        {/* Dynamic Tab Navigation */}
        <div className="flex border-b border-border-default">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${
              activeTab === "overview"
                ? "border-primary-default text-primary-default"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            خلاصه عملکرد
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${
              activeTab === "suppliers"
                ? "border-primary-default text-primary-default"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            لیست تامین‌کنندگان من ({referredSuppliers.length})
          </button>
          <button
            onClick={() => setActiveTab("terms")}
            className={`px-6 py-3 font-bold text-sm border-b-2 transition-all ${
              activeTab === "terms"
                ? "border-primary-default text-primary-default"
                : "border-transparent text-text-muted hover:text-text-primary"
            }`}
          >
            شرایط و قوانین کمیسیون
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="bg-card rounded-2xl border border-border-default p-6 sm:p-8 shadow-sm">
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary-default/10 p-2.5 rounded-xl text-primary-default">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-extrabold">گزارش خلاصه وضعیت</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-text-secondary pb-2 border-b border-border-default/50">گام‌های شروع همکاری و کسب سود</h4>
                  <ul className="space-y-4 text-xs text-text-secondary">
                    <li className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-primary-default/10 text-primary-default text-center font-bold text-xs flex items-center justify-center shrink-0">۱</span>
                      <p className="leading-relaxed">لینک یا کد دعوت خود را برای تامین‌کننده‌ها، تولیدکننده‌ها یا عمده‌فروشان معتبر ارسال کنید.</p>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-primary-default/10 text-primary-default text-center font-bold text-xs flex items-center justify-center shrink-0">۲</span>
                      <p className="leading-relaxed">تامین‌کننده حین ثبت‌نام کد دعوت شما را وارد کرده و حساب او لینک می‌شود.</p>
                    </li>
                    <li className="flex gap-3 items-start">
                      <span className="w-6 h-6 rounded-full bg-primary-default/10 text-primary-default text-center font-bold text-xs flex items-center justify-center shrink-0">۳</span>
                      <p className="leading-relaxed">پس از فعال شدن حساب تامین‌کننده و شروع فروش محصولات او در بازارچه، کمیسیون شما اتوماتیک محاسبه و به کیف پولتان واریز می‌شود.</p>
                    </li>
                  </ul>
                </div>

                <div className="bg-background rounded-2xl p-6 border border-border-default/60 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h4 className="text-sm font-extrabold flex items-center gap-1.5 text-primary-default">
                      <ShieldCheck className="w-5 h-5" />
                      قوانین و شرایط دریافت پاداش
                    </h4>
                    <ul className="text-xs text-text-muted leading-relaxed list-disc list-inside space-y-1">
                      <li>تامین کننده باید حداقل ۵ محصول ثبت کرده باشد.</li>
                      <li>تامین کننده باید حداقل یک سفارش موفق داشته باشد.</li>
                      <li>مبلغ پاداش بر اساس کیفیت ارزیابی می‌گردد (امکان ویرایش توسط مدیر کل).</li>
                      <li>تامین‌کنندگان واقعی با محصولات خوش‌قیمت حتی بدون شرط محصول پاداش می‌گیرند.</li>
                    </ul>
                  </div>

                  <div className="flex justify-between items-center bg-card p-3 rounded-xl border border-border-default/40">
                    <span className="text-xs font-bold">نرخ کمیسیون استاندارد معرف:</span>
                    <span className="text-sm font-black text-primary-default">۵۰ تا ۱۰۰ هزار تومان (ثابت)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "suppliers" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-extrabold">لیست زیرمجموعه‌ها</h3>
                <button
                  onClick={fetchStats}
                  className="flex items-center gap-1.5 text-xs text-primary-default hover:text-primary-hover font-bold transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  بروزرسانی لیست
                </button>
              </div>

              {referredSuppliers.length === 0 ? (
                <div className="text-center py-16 text-text-muted space-y-4">
                  <Users className="w-16 h-16 mx-auto opacity-20" />
                  <p className="text-sm font-medium">هنوز هیچ تامین‌کننده‌ای با کد دعوت شما ثبت‌نام نکرده است.</p>
                  <button
                    onClick={handleCopyLink}
                    className="bg-primary-default text-white hover:bg-primary-hover px-5 py-2.5 rounded-xl text-xs font-bold shadow transition-all"
                  >
                    ارسال اولین دعوتنامه
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-border-default text-xs text-text-muted">
                        <th className="pb-3 font-extrabold">ردیف</th>
                        <th className="pb-3 font-extrabold">نام تامین‌کننده</th>
                        <th className="pb-3 font-extrabold">برند / فروشگاه</th>
                        <th className="pb-3 font-extrabold">تاریخ عضویت</th>
                        <th className="pb-3 font-extrabold">وضعیت حساب</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default/50 text-xs">
                      {referredSuppliers.map((sup: any, idx: number) => (
                        <tr key={sup.id} className="hover:bg-background/40 transition-colors">
                          <td className="py-4 font-mono">{idx + 1}</td>
                          <td className="py-4 font-bold">{sup.firstName} {sup.lastName}</td>
                          <td className="py-4 text-text-secondary">{sup.brandName || "ثبت نشده"}</td>
                          <td className="py-4 font-mono text-text-secondary">
                            {new Date(sup.createdAt).toLocaleDateString("fa-IR")}
                          </td>
                          <td className="py-4">{getStatusBadge(sup.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "terms" && (
            <div className="space-y-6">
              <h3 className="text-lg font-extrabold">راهنمای کسب درآمد و پاداش</h3>
              <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
                <p>
                  سامانه B2B ما یک طرح پاداش عالی را برای همکاران بازاریاب و معرف (Referrer) تدارک دیده است تا به عنوان واسطه متصل‌کننده اقتصادهای بزرگ به سیستم، سود عالی کسب کنند.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="bg-background rounded-2xl p-5 border border-border-default/60 space-y-3">
                    <h4 className="font-bold text-primary-default">نحوه محاسبه تسویه‌ها</h4>
                    <p className="text-xs text-text-muted leading-relaxed">
                      هر تامین‌کننده‌ای که با کد شما ثبت‌نام کند، پس از بررسی عملکرد، یک پاداش ثابت بین ۵۰ تا ۱۰۰ هزار تومان به کیف پول شما واریز خواهد شد.
                    </p>
                  </div>

                  <div className="bg-background rounded-2xl p-5 border border-border-default/60 space-y-3">
                    <h4 className="font-bold text-success">پشتیبانی و همیاری</h4>
                    <p className="text-xs text-text-muted leading-relaxed">
                      بخش اداری و مالی کل سیستم در کنار شماست تا برای تسویه‌حساب‌ها با سریع‌ترین روند بانکی همکاری کند. شماره شبای خود را می‌توانید به بخش پشتیبانی ارسال کنید.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
