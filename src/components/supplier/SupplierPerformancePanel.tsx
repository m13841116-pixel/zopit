import React, { useState, useEffect } from "react";
import {
  Scale,
  CheckCircle,
  AlertTriangle,
  Clock,
  Layers,
  Calendar,
  ShieldAlert,
  Info
} from "lucide-react";

export default function SupplierPerformancePanel() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchPerformance = () => {
    setLoading(true);
    fetch("/api/supplier/performance", { credentials: "include",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData && !resData.error) {
          setData(resData);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching supplier performance stats:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  const translateStatus = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "Active":
        return {
          label: "فعال",
          color: "text-success bg-success/10 border-success/20",
          desc: "پنل شما در وضعیت کاملا سالم و فعال قرار دارد. از همکاری ارزشمندتان سپاسگزاریم!"
        };
      case "UNDER_REVIEW":
      case "Under Review":
        return {
          label: "تحت بررسی",
          color: "text-warning bg-warning/10 border-warning/20",
          desc: "به دلیل ثبت امتیازهای منفی اخیر، وضعیت حساب کاربری شما توسط واحد پشتیبانی در حال بازنگری است."
        };
      case "TEMPORARILY_SUSPENDED":
      case "Temporarily Suspended":
        return {
          label: "تعلیق موقت",
          color: "text-warning bg-warning/10 border-warning/20",
          desc: "پنل فروشگاهی شما به صورت موقت معلق شده است. لطفاً جهت فعال‌سازی مجدد با بخش پشتیبانی کل سیستم تماس بگیرید."
        };
      case "BLOCKED":
      case "Blocked":
        return {
          label: "مسدود شده",
          color: "text-danger bg-danger/10 border-danger/20",
          desc: "حساب تامین‌کننده شما به دلیل عدم تطابق مکرر با استانداردهای کیفی سیستم به طور کامل مسدود شده است."
        };
      default:
        return {
          label: status || "فعال",
          color: "text-success bg-success/10 border-success/20",
          desc: "پنل شما در وضعیت عادی قرار دارد."
        };
    }
  };

  const translateWarningLevel = (level: string) => {
    switch (level) {
      case "NONE":
        return { label: "بدون هشدار (عادی)", color: "text-success bg-success/10" };
      case "LOW":
        return { label: "هشدار سطح پایین", color: "text-blue-400 bg-surface0/10" };
      case "MEDIUM":
        return { label: "هشدار سطح متوسط", color: "text-warning bg-warning/10" };
      case "HIGH":
        return { label: "هشدار سطح بالا (تعلیق موقت)", color: "text-warning bg-warning/10" };
      case "CRITICAL":
        return { label: "بحرانی (مسدود پنل)", color: "text-danger bg-danger/10" };
      default:
        return { label: "عادی", color: "text-success bg-success/10" };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-default mr-2"></div>
        در حال بارگذاری اطلاعات عملکرد و امتیاز اخطارها...
      </div>
    );
  }

  if (!data || !data.supplier) {
    return (
      <div className="bg-surface p-8 rounded-2xl border border-subtle text-center text-muted">
        موفق به دریافت اطلاعات عملکرد نشدیم. لطفا مجددا تلاش کنید.
      </div>
    );
  }

  const { supplier, penalties, distinctAffectedOrders, affectedOrdersCount } = data;
  const statusInfo = translateStatus(supplier.status);

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Overview Status Alert Banner */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row gap-4 items-start md:items-center justify-between ${statusInfo.color}`}>
        <div className="flex gap-4 items-center">
          <div className="p-3 rounded-xl bg-background/50">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">وضعیت پنل شما: {statusInfo.label}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-background/60 border border-current">
                امتیاز عملکرد: {supplier.performanceScore || 100}٪
              </span>
            </div>
            <p className="text-xs mt-1 opacity-90 leading-relaxed">{statusInfo.desc}</p>
          </div>
        </div>
      </div>

      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Performance Score Progress */}
        <div className="bg-surface p-6 rounded-2xl border border-subtle flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-semibold text-muted">امتیاز عملکرد کلی شما</h4>
              {(!supplier.performanceScore || supplier.performanceScore >= 75) && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-emerald-500" /> عملکرد موفق
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-extrabold text-primary">{supplier.performanceScore || 100}</span>
              <span className="text-muted text-sm">از ۱۰۰ امتیاز</span>
            </div>
            {(!supplier.performanceScore || supplier.performanceScore >= 75) && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-2 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> امتیاز عملکرد کامل دریافت گردیده است.
              </p>
            )}
          </div>
          {/* Progress bar */}
          <div className="mt-6">
            <div className="w-full bg-background rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  supplier.performanceScore > 75
                    ? "bg-success"
                    : supplier.performanceScore > 50
                    ? "bg-warning"
                    : "bg-danger"
                }`}
                style={{ width: `${supplier.performanceScore || 100}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-[10px] text-muted mt-2">
              <span>ضعیف</span>
              <span>قابل قبول</span>
              <span>عالی (۱۰۰٪)</span>
            </div>
          </div>
        </div>

        {/* Penalty Points Tracker */}
        <div className="bg-surface p-6 rounded-2xl border border-subtle flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-muted">کل امتیازات منفی ثبت شده</h4>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-extrabold text-danger">{supplier.penaltyPoints || 0}</span>
              <span className="text-muted text-sm">امتیاز منفی</span>
            </div>
          </div>
          <p className="text-xs text-muted leading-relaxed mt-4">
            ثبت هر اخطار جدید امتیاز منفی را افزایش داده و امتیاز عملکرد کلی را مستقیماً کاهش می‌دهد.
          </p>
        </div>

        {/* Warning Level Display */}
        <div className="bg-surface p-6 rounded-2xl border border-subtle flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-muted">سطح هشدار سیستمی</h4>
            <div className="mt-2.5">
              <span className={`inline-block text-sm font-bold px-3 py-1.5 rounded-xl ${translateWarningLevel(supplier.warningLevel).color}`}>
                {translateWarningLevel(supplier.warningLevel).label}
              </span>
            </div>
          </div>
          <div className="bg-background/50 p-3 rounded-xl border border-subtle flex gap-2 items-start mt-4">
            <Info className="w-4.5 h-4.5 text-muted shrink-0 mt-0.5" />
            <p className="text-[10px] text-muted leading-relaxed">
              با فراتر رفتن امتیاز منفی از آستانه‌ها (۲۰، ۴۰، ۶۰)، وضعیت پنل شما طبق ضوابط تغییر خواهد کرد.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline (Left - 2cols) */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-2xl border border-subtle space-y-6">
          <h3 className="text-base font-bold text-inverse flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-default" />
            تاریخچه و تایم‌لاین ثبت امتیاز اخطارها
          </h3>

          <div className="space-y-5 relative before:absolute before:right-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-subtle/55 pr-8">
            {penalties && penalties.length > 0 ? (
              penalties.map((p: any) => (
                <div key={p.id} className="relative bg-background p-4 rounded-xl border border-subtle space-y-2">
                  <div className="absolute -right-10 top-5 w-4 h-4 rounded-full bg-danger/20 border border-danger/80 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-danger rounded-full"></div>
                  </div>

                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-bold text-danger">-{p.points} امتیاز</span>
                      <span className="text-xs text-inverse font-bold mr-2">{p.reason}</span>
                    </div>
                    <span className="text-[10px] text-muted">
                      {new Date(p.createdAt).toLocaleDateString("fa-IR")}
                    </span>
                  </div>

                  <p className="text-xs text-muted leading-relaxed">{p.description}</p>

                  <div className="flex justify-between items-center text-[10px] text-muted pt-2 border-t border-subtle/25">
                    <span>ثبت‌کننده: {p.adminName || "سیستم"}</span>
                    {p.orderNumber && (
                      <span className="font-mono bg-surface px-1.5 py-0.5 rounded">شماره سفارش: {p.orderNumber}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-muted text-sm flex flex-col items-center justify-center gap-3">
                <CheckCircle className="w-12 h-12 text-success/20" />
                <span>هیچگونه اخطار یا امتیاز منفی در کارنامه همکاری شما ثبت نشده است. پنل شما در عالی‌ترین حالت کیفی قرار دارد.</span>
              </div>
            )}
          </div>
        </div>

        {/* Affected Orders (Right - 1col) */}
        <div className="bg-surface p-6 rounded-2xl border border-subtle space-y-4">
          <h3 className="text-base font-bold text-inverse flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary-default" />
            سفارشات اخطاردار ({affectedOrdersCount || 0})
          </h3>
          <p className="text-xs text-muted leading-relaxed">
            لیست کدهایی از سفارش‌های خرید مشتریان که به دلیل تاخیر، مغایرت یا عیوب کالا، مشمول کسر امتیاز شده‌اند:
          </p>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 pt-2">
            {distinctAffectedOrders && distinctAffectedOrders.length > 0 ? (
              distinctAffectedOrders.map((orderNo: string, index: number) => (
                <div key={index} className="bg-background border border-subtle rounded-xl p-3 flex justify-between items-center font-mono">
                  <span className="text-xs font-semibold text-inverse">{orderNo}</span>
                  <span className="text-[10px] bg-danger/10 text-danger border border-danger/20 px-2 py-0.5 rounded">دارای اخطار</span>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-muted text-xs">سفارش اخطاردار وجود ندارد.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
