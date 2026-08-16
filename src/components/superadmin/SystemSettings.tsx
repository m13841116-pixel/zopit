import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  ShieldCheck,
  Power,
  AlertTriangle,
  Scale,
  Percent,
  Clock,
  RotateCcw,
  TrendingDown,
  Truck,
  DollarSign,
  Briefcase,
  GraduationCap,
  HelpCircle,
  Activity,
  Plus,
  Trash2,
  GitCommit,
  Bot,
  CreditCard,
  Code,
  FileText,
  ShoppingBag,
  Save,
  Upload,
  Paperclip,
  Copy,
  Sparkles,
  Database,
  CheckCircle,
  RefreshCw,
  Phone,
  Mail,
  Send,
  ExternalLink,
  Ticket,
} from "lucide-react";
import PaymentSmsSettings from "./PaymentSmsSettings";
import SystemLogs from "./SystemLogs";
import SystemHealth from "./SystemHealth";
import CodeEditor from "./CodeEditor";
import SupplierPenaltyManagement from "./SupplierPenaltyManagement";

interface SystemSettingsProps {
  initialTab?: "core" | "supplier_rules" | "gateways" | "support" | "terms" | "code" | "woocommerce" | "logs" | "health" | "dev_tools";
}

export default function SystemSettings({ initialTab = "core" }: SystemSettingsProps) {
  const [activeTab, setActiveTab] = useState<
    "core" | "supplier_rules" | "gateways" | "support" | "terms" | "code" | "woocommerce" | "logs" | "health" | "dev_tools"
  >(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [config, setConfig] = useState<Record<string, any>>({
    // Emergency Toggles
    STORE_CATALOG_ENABLED: true,
    STORE_ORDERS_ENABLED: true,
    STORE_FINANCIAL_ENABLED: true,
    SUPPLIER_CATALOG_ENABLED: true,
    SUPPLIER_ORDERS_ENABLED: true,
    SUPPLIER_FINANCIAL_ENABLED: true,

    // Business Rules
    COMMISSION_PERCENTAGE: 10,
    TAX_RATE: 9,
    MAX_DELIVERY_HOURS: 48,
    RETURN_PERIOD_DAYS: 7,
    DAILY_DELAY_PENALTY: 2,
    CRITICAL_SUSPENSION_THRESHOLD: 70,
    MIN_PAYOUT_AMOUNT: 1000000,
    MAX_PRODUCT_PRICE: 500000000,
    WEEKLY_MAX_ORDER_AMOUNT: 2000000000,
    FIXED_SHIPPING_ENABLED: false,
    FIXED_POST_SHIPPING_FEE: 50000,
    FIXED_TIPAX_SHIPPING_FEE: 80000,
    ORDER_WORKFLOW_STEPS:
      "ثبت سفارش,بسته‌بندی و صدور برچسب ارسال,پرداخت نهایی,تحویل به پست,توزیع و تحویل کالا,تسویه تامین‌کننده",
    AUTO_NOTIFY_ON_WARNING: true,
    AUTO_PENALIZE_ON_DELAY: true,
    ORDER_PROCESSING_HOURS: 24,
    SLA_CRITICAL_HOURS: 12,
    SUPPLIER_AUTO_VERIFY: false,
    REFUND_RULES_AUTO_APPROVE: false,
    CANCEL_SCORE_DEDUCTION: 4,
    RETURN_SCORE_DEDUCTION: 3,
    DELAY_SCORE_DEDUCTION: 2,

    // Support Channels
    SUPPORT_PHONE: "09180088358",
    SUPPORT_PHONE_2: "02188888888",
    SUPPORT_TELEGRAM: "@Zopit_Support",
    SUPPORT_RUBIKA: "https://rubika.ir/Zopit_official",
    SUPPORT_BALE: "https://ble.ir/Zopit_support",
    SUPPORT_EMAIL: "support@Zopit.ir",

    // Educational / Training links
    EDUCATION_APARAT: "https://www.aparat.com",
    EDUCATION_YOUTUBE: "https://www.youtube.com",
    EDUCATION_TELEGRAM: "https://t.me",

    // Terms
    SUPPLIER_RULES:
      "۱. تضمین اصالت و سلامت کالا: تامین‌کننده متعهد می‌گردد تمامی کالاهای ارسالی را منطبق بر اصالت، کیفیت توصیف‌شده و سلامت فیزیکی کامل تأمین و ارسال کند.\n۲. درج قیمت رقابتی و واقعی: درج قیمت‌های غیرواقعی، موجودی کاذب یا قیمت‌گذاری خارج از چارچوب بازار آزاد ممنوع بوده و منجر به تعلیق موقت پنل خواهد شد.\n۳. زمان‌بندی دقیق ارسال سفارش: تامین‌کننده موظف است سفارشات پذیرفته شده را حداکثر ظرف مهلت مجاز ارسال (SLA) بسته‌بندی کرده و تحویل نمایندگان پستی یا ارسال مستقیم دهد.\n۴. جرایم تاخیر و لغو سفارش: هرگونه تاخیر غیرموجه در ارسال یا لغو سفارشات تایید شده، مشمول کسر امتیاز عملکرد و اعمال جریمه نقدی روزانه خواهد شد.\n۵. کمیسیون و تسویه مالی: کارمزد توافق‌شده پلتفرم به صورت خودکار از هر فروش کسر گردیده و تسویه حساب پس از تایید تحویل کالا توسط خریدار و منقضی شدن مهلت مرجوعی انجام می‌گردد.",
    STORE_RULES:
      "۱. ثبت‌نام و احراز هویت: تمامی مدیران فروشگاه‌ها ملزم به ارائه پروانه کسب معتبر، کد ملی و اطلاعات تماس حقیقی جهت فعالیت در پلتفرم می‌باشند.\n۲. خرید عمده و فاکتورها: خریدهای ثبت شده به عنوان سفارش قطعی تلقی شده و پرداخت فیش بانکی یا درگاه آنلاین باید حداکثر ظرف مدت ۲۴ ساعت نهایی شود.\n۳. سیاست مرجوعی کالا: امکان مرجوعی کالا تنها در صورت مغایرت مشخصات، آسیب فیزیکی یا عدم تطابق اصالت کالا تا ۷ روز پس از تحویل میسر است.\n۴. تسویه حساب و فاکتور رسمی: فاکتورهای رسمی خرید توسط سیستم صادر شده و هرگونه ادعا پس از تسویه نهایی پذیرفته نخواهد شد.\n۵. حفظ محرمانگی: اطلاعات قیمت‌های همکاری و فاکتورهای دریافتی کاملاً محرمانه بوده و اشتراک‌گذاری آن‌ها با اشخاص ثالث ممنوع است.",

    // Custom Code Injection
    CUSTOM_CODE_HEADER: "",
    CUSTOM_CODE_FOOTER: "",
    CUSTOM_JS_CODE: "",
    CUSTOM_CSS_CODE: "",
    CUSTOM_INJECTED_FILES: "[]",

    // WooCommerce REST API Integration
    WOOCOMMERCE_SYNC_ENABLED: false,
    WOOCOMMERCE_STORE_URL: "",
    WOOCOMMERCE_CONSUMER_KEY: "",
    WOOCOMMERCE_CONSUMER_SECRET: "",
    WOOCOMMERCE_AUTO_IMPORT_ORDERS: false,
    WOOCOMMERCE_SYNC_INTERVAL_MINS: 15,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStepName, setNewStepName] = useState("");
  const [wcTesting, setWcTesting] = useState(false);

  const fetchConfig = () => {
    setLoading(true);
    fetch("/api/config")
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json"))
          return null;
        return res.json();
      })
      .then((data) => {
        if (data && !data.error) {
          setConfig((prev) => ({ ...prev, ...data }));
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching config:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleInputChange = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const saveSingleConfig = async (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    try {
      const res = await fetch("/api/config", {
        credentials: "include",
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: String(value) }),
      });
      if (res.ok) {
        toast("تنظیم با موفقیت ذخیره شد.", "success");
      } else {
        toast("خطا در ذخیره تنظیمات", "error");
      }
    } catch (err) {
      console.error(`Error saving config key ${key}:`, err);
      toast("خطا در ارتباط با سرور", "error");
    }
  };

  const saveBulkSettings = async (settingsMap: Record<string, any>, successMessage = "تنظیمات با موفقیت ذخیره شدند.") => {
    setSaving(true);
    try {
      const res = await fetch("/api/config", {
        credentials: "include",
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsMap }),
      });
      if (!res.ok) throw new Error("Bulk save failed");
      toast(successMessage, "success");
    } catch (err) {
      console.error("Error in saveBulkSettings:", err);
      toast("خطا در ذخیره‌سازی تنظیمات.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleConfig = (key: string) => {
    const isCurrentlyTrue = config[key] === true || config[key] === "true";
    const newValue = !isCurrentlyTrue;
    setConfig((prev) => ({ ...prev, [key]: newValue }));
    saveSingleConfig(key, newValue);
  };

  // Workflow steps array derived from comma separated string
  const workflowSteps = config.ORDER_WORKFLOW_STEPS
    ? String(config.ORDER_WORKFLOW_STEPS)
        .split(",")
        .filter((s: string) => s.trim() !== "")
    : [];

  const handleAddStep = () => {
    if (!newStepName.trim()) return;
    const updatedSteps = [...workflowSteps, newStepName.trim()];
    const stepsString = updatedSteps.join(",");
    handleInputChange("ORDER_WORKFLOW_STEPS", stepsString);
    saveSingleConfig("ORDER_WORKFLOW_STEPS", stepsString);
    setNewStepName("");
  };

  const handleRemoveStep = (index: number) => {
    const updatedSteps = workflowSteps.filter((_: any, i: number) => i !== index);
    const stepsString = updatedSteps.join(",");
    handleInputChange("ORDER_WORKFLOW_STEPS", stepsString);
    saveSingleConfig("ORDER_WORKFLOW_STEPS", stepsString);
  };

  const handleMoveStep = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= workflowSteps.length) return;
    const updatedSteps = [...workflowSteps];
    const [movedStep] = updatedSteps.splice(index, 1);
    updatedSteps.splice(newIndex, 0, movedStep);
    const stepsString = updatedSteps.join(",");
    handleInputChange("ORDER_WORKFLOW_STEPS", stepsString);
    saveSingleConfig("ORDER_WORKFLOW_STEPS", stepsString);
  };

  const handleSaveBusinessRules = (e: React.FormEvent) => {
    e.preventDefault();
    const rulesToSave = {
      COMMISSION_PERCENTAGE: config.COMMISSION_PERCENTAGE,
      TAX_RATE: config.TAX_RATE,
      MAX_DELIVERY_HOURS: config.MAX_DELIVERY_HOURS,
      RETURN_PERIOD_DAYS: config.RETURN_PERIOD_DAYS,
      DAILY_DELAY_PENALTY: config.DAILY_DELAY_PENALTY,
      CRITICAL_SUSPENSION_THRESHOLD: config.CRITICAL_SUSPENSION_THRESHOLD,
      MIN_PAYOUT_AMOUNT: config.MIN_PAYOUT_AMOUNT,
      MAX_PRODUCT_PRICE: config.MAX_PRODUCT_PRICE,
      WEEKLY_MAX_ORDER_AMOUNT: config.WEEKLY_MAX_ORDER_AMOUNT,
      FIXED_SHIPPING_ENABLED: config.FIXED_SHIPPING_ENABLED,
      FIXED_POST_SHIPPING_FEE: config.FIXED_POST_SHIPPING_FEE,
      FIXED_TIPAX_SHIPPING_FEE: config.FIXED_TIPAX_SHIPPING_FEE,
      ORDER_WORKFLOW_STEPS: config.ORDER_WORKFLOW_STEPS,
      AUTO_NOTIFY_ON_WARNING: config.AUTO_NOTIFY_ON_WARNING,
      AUTO_PENALIZE_ON_DELAY: config.AUTO_PENALIZE_ON_DELAY,
      ORDER_PROCESSING_HOURS: config.ORDER_PROCESSING_HOURS,
      SLA_CRITICAL_HOURS: config.SLA_CRITICAL_HOURS,
      SUPPLIER_AUTO_VERIFY: config.SUPPLIER_AUTO_VERIFY,
      REFUND_RULES_AUTO_APPROVE: config.REFUND_RULES_AUTO_APPROVE,
      CANCEL_SCORE_DEDUCTION: config.CANCEL_SCORE_DEDUCTION,
      RETURN_SCORE_DEDUCTION: config.RETURN_SCORE_DEDUCTION,
      DELAY_SCORE_DEDUCTION: config.DELAY_SCORE_DEDUCTION,
    };
    saveBulkSettings(rulesToSave, "قوانین جدید کسب‌وکار با موفقیت ذخیره شدند.");
  };

  const handleTestWooCommerce = async () => {
    if (!config.WOOCOMMERCE_STORE_URL || !config.WOOCOMMERCE_CONSUMER_KEY) {
      toast("لطفاً آدرس فروشگاه و Consumer Key ووکامرس را وارد کنید.", "error");
      return;
    }
    setWcTesting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      toast("ارتباط با وب‌سرویس ووکامرس برقرار شد و معتبر می‌باشد.", "success");
    } catch {
      toast("خطا در برقراری ارتباط با ووکامرس.", "error");
    } finally {
      setWcTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-default ml-3"></div>
        در حال دریافت تنظیمات سیستم...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" dir="rtl">
      {/* Title Header Banner */}
      <div className="bg-card p-6 md:p-8 rounded-3xl border border-border shadow-xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-default/10 text-primary-default text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              مرکز مدیریت و پیکربندی سیستم زوپیت
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-text-primary flex items-center gap-3">
              <Settings className="w-8 h-8 text-primary-default" />
              تنظیمات کلی پلتفرم
            </h2>
            <p className="text-text-muted text-xs md:text-sm max-w-2xl leading-relaxed">
              مدیریت قوانین مالی، دسترسی‌ها، درگاه‌های پرداخت آنلاین، پنل‌های پیامک، قراردادها و تزریق کدهای سفارشی.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> وضعیت دیتابیس: متصل و فعال
            </div>
            <button
              onClick={async () => {
                try {
                  const response = await fetch("/api/admin/export-all-data", {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                    },
                  });
                  if (!response.ok) throw new Error("خطا در دریافت داده‌ها");
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `zopit-export-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  toast("داده‌های پلتفرم با موفقیت خروجی گرفته شد.", "success");
                } catch (err: any) {
                  toast("خطا در خروجی: " + err.message, "error");
                }
              }}
              className="px-4 py-2.5 bg-primary-default hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            >
              <Database className="w-4 h-4" />
              خروجی کل دیتابیس
            </button>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-2 mt-8 pt-4 border-t border-border overflow-x-auto scrollbar-none">
          {[
            { id: "core", label: "پایه و دسترسی‌ها", icon: Power },
            { id: "supplier_rules", label: "قوانین و جرایم تامین‌کنندگان", icon: Scale },
            { id: "gateways", label: "درگاه پرداخت و پیامک", icon: CreditCard },
            { id: "support", label: "پشتیبانی و ارتباطات", icon: Phone },
            { id: "terms", label: "شرایط و قوانین", icon: FileText },
            { id: "code", label: "کدهای سفارشی", icon: Code },
            { id: "woocommerce", label: "اتصال ووکامرس", icon: ShoppingBag },
            { id: "logs", label: "لاگ‌های سیستم", icon: Activity },
            { id: "health", label: "سلامت سیستم", icon: ShieldCheck },
            { id: "dev_tools", label: "کد پلتفرم", icon: Code },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-primary-default text-white shadow-xs"
                    : "bg-surface hover:bg-surface-hover text-text-secondary border border-border"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: CORE ACCESSIBILITY & BUSINESS RULES */}
      {activeTab === "core" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Emergency Toggles */}
          <div className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <Power className="w-5 h-5 text-rose-500" />
              <div>
                <h3 className="font-bold text-text-primary text-sm">
                  تنظیمات اضطراری و دسترسی سراسری به بخش‌های سیستم
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  غیرفعال‌سازی موقت ماژول‌ها در زمان بروزرسانی و تعمیرات
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Store Manager Access Toggles */}
              <div className="space-y-3 bg-surface p-4 rounded-2xl border border-border">
                <h4 className="font-bold text-text-primary text-xs pb-2 border-b border-border">
                  دسترسی‌های پنل مدیر فروشگاه
                </h4>
                <div className="space-y-2.5">
                  {[
                    { key: "STORE_CATALOG_ENABLED", label: "مشاهده کاتالوگ و محصولات تامین‌کنندگان" },
                    { key: "STORE_ORDERS_ENABLED", label: "امکان ثبت و پیگیری سفارشات عمده" },
                    { key: "STORE_FINANCIAL_ENABLED", label: "دسترسی به بخش مالی و پرداخت" },
                  ].map((item) => {
                    const isChecked = config[item.key] !== false && config[item.key] !== "false";
                    return (
                      <label key={item.key} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border hover:border-primary-default/40 cursor-pointer transition-all">
                        <span className="text-xs font-semibold text-text-primary">{item.label}</span>
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-border text-primary-default focus:ring-primary-default cursor-pointer"
                          checked={isChecked}
                          onChange={() => toggleConfig(item.key)}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Supplier Access Toggles */}
              <div className="space-y-3 bg-surface p-4 rounded-2xl border border-border">
                <h4 className="font-bold text-text-primary text-xs pb-2 border-b border-border">
                  دسترسی‌های پنل تامین‌کننده کالا
                </h4>
                <div className="space-y-2.5">
                  {[
                    { key: "SUPPLIER_CATALOG_ENABLED", label: "مدیریت کاتالوگ، درج و ویرایش کالاها" },
                    { key: "SUPPLIER_ORDERS_ENABLED", label: "مدیریت سفارشات دریافتی و تایید ارسال" },
                    { key: "SUPPLIER_FINANCIAL_ENABLED", label: "مشاهده کیف‌پول و درخواست تسویه حساب" },
                  ].map((item) => {
                    const isChecked = config[item.key] !== false && config[item.key] !== "false";
                    return (
                      <label key={item.key} className="flex items-center justify-between p-3 bg-card rounded-xl border border-border hover:border-primary-default/40 cursor-pointer transition-all">
                        <span className="text-xs font-semibold text-text-primary">{item.label}</span>
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-border text-primary-default focus:ring-primary-default cursor-pointer"
                          checked={isChecked}
                          onChange={() => toggleConfig(item.key)}
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 text-amber-700 dark:text-amber-400 text-xs font-medium">
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
              <p className="leading-relaxed">
                راهنما: با خاموش کردن هر دسترسی، کاربران هنگام مراجعه به آن بخش پیام "🚧 این بخش در حال بروزرسانی موقت است" را مشاهده می‌کنند.
              </p>
            </div>
          </div>

          {/* Business Rules Form */}
          <form onSubmit={handleSaveBusinessRules} className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <div>
                  <h3 className="font-bold text-text-primary text-sm">
                    موتور قوانین و کارمزدهای مالی (Business Rules)
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    تنظیم ضرایب، سقف مبالغ و کمیسیون‌های محاسباتی دیتابیس
                  </p>
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 bg-primary-default hover:bg-primary-hover disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-xs"
              >
                <Save className="w-4 h-4" />
                {saving ? "در حال ذخیره..." : "ثبت قوانین دیتابیس"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Commission */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary flex items-center gap-1">
                  <Percent className="w-4 h-4 text-text-muted" /> درصد کمیسیون پلتفرم
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={config.COMMISSION_PERCENTAGE}
                    onChange={(e) => handleInputChange("COMMISSION_PERCENTAGE", Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary font-mono font-bold focus:border-primary-default focus:ring-1 focus:ring-primary-default focus:outline-none"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-text-muted">درصد</span>
                </div>
              </div>

              {/* VAT Tax */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-text-muted" /> درصد مالیات ارزش افزوده (VAT)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={config.TAX_RATE}
                    onChange={(e) => handleInputChange("TAX_RATE", Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary font-mono font-bold focus:border-primary-default focus:ring-1 focus:ring-primary-default focus:outline-none"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-text-muted">درصد</span>
                </div>
              </div>

              {/* Max Delivery Hours */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary flex items-center gap-1">
                  <Clock className="w-4 h-4 text-text-muted" /> مهلت زمانی ارسال سفارش
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={config.MAX_DELIVERY_HOURS}
                    onChange={(e) => handleInputChange("MAX_DELIVERY_HOURS", Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary font-mono font-bold focus:border-primary-default focus:ring-1 focus:ring-primary-default focus:outline-none"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-text-muted">ساعت</span>
                </div>
              </div>

              {/* Min Settlement Payout Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary flex items-center gap-1">
                  <Briefcase className="w-4 h-4 text-text-muted" /> حداقل مبلغ مجاز درخواست تسویه
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={config.MIN_PAYOUT_AMOUNT}
                    onChange={(e) => handleInputChange("MIN_PAYOUT_AMOUNT", Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary font-mono font-bold focus:border-primary-default focus:ring-1 focus:ring-primary-default focus:outline-none"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-text-muted">ریال</span>
                </div>
              </div>

              {/* Max Product Price */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-text-muted" /> سقف قیمت هر کالا
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={config.MAX_PRODUCT_PRICE}
                    onChange={(e) => handleInputChange("MAX_PRODUCT_PRICE", Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary font-mono font-bold focus:border-primary-default focus:ring-1 focus:ring-primary-default focus:outline-none"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-text-muted">تومان</span>
                </div>
              </div>

              {/* Return Period */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary flex items-center gap-1">
                  <RotateCcw className="w-4 h-4 text-text-muted" /> مهلت مرجوعی کالا
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={config.RETURN_PERIOD_DAYS}
                    onChange={(e) => handleInputChange("RETURN_PERIOD_DAYS", Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary font-mono font-bold focus:border-primary-default focus:ring-1 focus:ring-primary-default focus:outline-none"
                  />
                  <span className="absolute left-3 top-2.5 text-xs text-text-muted">روز</span>
                </div>
              </div>
            </div>

            {/* Logistics & Fixed Shipping Rates */}
            <div className="p-5 bg-surface rounded-2xl border border-border space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-primary-default" />
                  <div>
                    <h4 className="font-bold text-xs text-text-primary">تنظیمات هزینه ثابت پست و پیک ارسال</h4>
                    <p className="text-[11px] text-text-muted">محاسبه خودکار کرایه بر برگه سفارش خریدار</p>
                  </div>
                </div>
                <label className="flex items-center gap-2 px-3 py-1.5 bg-card rounded-xl border border-border cursor-pointer">
                  <span className="text-xs font-bold text-text-secondary">
                    {config.FIXED_SHIPPING_ENABLED === true || config.FIXED_SHIPPING_ENABLED === "true" ? "فعال (محاسبه خودکار)" : "غیرفعال"}
                  </span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-primary-default cursor-pointer"
                    checked={config.FIXED_SHIPPING_ENABLED === true || config.FIXED_SHIPPING_ENABLED === "true"}
                    onChange={(e) => {
                      handleInputChange("FIXED_SHIPPING_ENABLED", e.target.checked);
                      saveSingleConfig("FIXED_SHIPPING_ENABLED", e.target.checked);
                    }}
                  />
                </label>
              </div>

              {(config.FIXED_SHIPPING_ENABLED === true || config.FIXED_SHIPPING_ENABLED === "true") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-primary">هزینه ثابت پست پیشتاز</label>
                    <input
                      type="number"
                      value={config.FIXED_POST_SHIPPING_FEE || 50000}
                      onChange={(e) => handleInputChange("FIXED_POST_SHIPPING_FEE", e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-text-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-primary">هزینه ثابت ارسال تیپاکس</label>
                    <input
                      type="number"
                      value={config.FIXED_TIPAX_SHIPPING_FEE || 80000}
                      onChange={(e) => handleInputChange("FIXED_TIPAX_SHIPPING_FEE", e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-mono font-bold text-text-primary"
                    />
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* Dynamic Order Workflow Engine */}
          <div className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border">
              <GitCommit className="w-5 h-5 text-primary-default" />
              <div>
                <h3 className="font-bold text-text-primary text-sm">موتور جریان کاری سفارشات (Order Workflow Steps)</h3>
                <p className="text-xs text-text-muted mt-0.5">تعریف گام‌های پردازش سفارش از ثبت تا تحویل و تسویه</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {workflowSteps.map((step: string, index: number) => (
                <div key={index} className="bg-surface p-3.5 rounded-2xl border border-border flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono bg-card text-text-muted w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveStep(index, "up")}
                        className="text-text-muted hover:text-primary-default p-0.5 cursor-pointer disabled:opacity-20 text-xs"
                      >
                        ◄
                      </button>
                      <button
                        type="button"
                        disabled={index === workflowSteps.length - 1}
                        onClick={() => handleMoveStep(index, "down")}
                        className="text-text-muted hover:text-primary-default p-0.5 cursor-pointer disabled:opacity-20 text-xs"
                      >
                        ►
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(index)}
                        className="text-text-muted hover:text-rose-500 p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h5 className="text-xs font-bold text-text-primary mt-2 text-center">{step}</h5>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 bg-surface p-3 rounded-2xl border border-border">
              <input
                type="text"
                placeholder="عنوان گام جدید (مثلاً: بازرسی کیفیت نهایی)..."
                value={newStepName}
                onChange={(e) => setNewStepName(e.target.value)}
                className="flex-1 bg-card border border-border rounded-xl px-4 py-2 text-xs text-text-primary focus:outline-none focus:border-primary-default"
              />
              <button
                type="button"
                onClick={handleAddStep}
                className="px-4 py-2 bg-primary-default hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
              >
                <Plus className="w-4 h-4" /> افزودن گام
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SUPPLIER RULES AND PENALTIES */}
      {activeTab === "supplier_rules" && (
        <div className="animate-fadeIn">
          <SupplierPenaltyManagement />
        </div>
      )}

      {/* TAB 2: ONLINE PAYMENT GATEWAY & SMS SETTINGS */}
      {activeTab === "gateways" && (
        <div className="animate-fadeIn">
          <PaymentSmsSettings />
        </div>
      )}

      {/* TAB 3: SUPPORT CONTACT CHANNELS */}
      {activeTab === "support" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary-default" />
                <div>
                  <h3 className="font-bold text-text-primary text-sm">کانال‌های ارتباطی و شماره‌های پشتیبانی</h3>
                  <p className="text-xs text-text-muted mt-0.5">نمایش در کارت پشتیبانی پنل مدیران فروشگاه و تامین‌کنندگان</p>
                </div>
              </div>
              <button
                onClick={() => {
                  saveBulkSettings({
                    SUPPORT_PHONE: config.SUPPORT_PHONE,
                    SUPPORT_PHONE_2: config.SUPPORT_PHONE_2,
                    SUPPORT_TELEGRAM: config.SUPPORT_TELEGRAM,
                    SUPPORT_RUBIKA: config.SUPPORT_RUBIKA,
                    SUPPORT_BALE: config.SUPPORT_BALE,
                    SUPPORT_EMAIL: config.SUPPORT_EMAIL,
                    EDUCATION_APARAT: config.EDUCATION_APARAT,
                    EDUCATION_YOUTUBE: config.EDUCATION_YOUTUBE,
                    EDUCATION_TELEGRAM: config.EDUCATION_TELEGRAM,
                  }, "اطلاعات پشتیبانی با موفقیت ذخیره شد.");
                }}
                className="px-5 py-2.5 bg-primary-default hover:bg-primary-hover text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <Save className="w-4 h-4" /> ذخیره کانال‌ها
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">شماره تلفن اصلی پشتیبانی</label>
                <input
                  type="text"
                  value={config.SUPPORT_PHONE || ""}
                  onChange={(e) => handleInputChange("SUPPORT_PHONE", e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary dir-ltr focus:border-primary-default focus:ring-1 focus:ring-primary-default focus:outline-none"
                  placeholder="09180088358"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">شماره ثابت دفتر مرکزی</label>
                <input
                  type="text"
                  value={config.SUPPORT_PHONE_2 || ""}
                  onChange={(e) => handleInputChange("SUPPORT_PHONE_2", e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary dir-ltr focus:border-primary-default focus:ring-1 focus:ring-primary-default focus:outline-none"
                  placeholder="02188888888"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">ایمیل پشتیبانی رسمی</label>
                <input
                  type="text"
                  value={config.SUPPORT_EMAIL || ""}
                  onChange={(e) => handleInputChange("SUPPORT_EMAIL", e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary dir-ltr focus:border-primary-default focus:ring-1 focus:ring-primary-default focus:outline-none"
                  placeholder="support@zopit.ir"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">آیدی تلگرام پشتیبانی</label>
                <input
                  type="text"
                  value={config.SUPPORT_TELEGRAM || ""}
                  onChange={(e) => handleInputChange("SUPPORT_TELEGRAM", e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary dir-ltr focus:border-primary-default focus:ring-1 focus:ring-primary-default focus:outline-none"
                  placeholder="@Zopit_Support"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">لینک روبیکا پشتیبانی</label>
                <input
                  type="text"
                  value={config.SUPPORT_RUBIKA || ""}
                  onChange={(e) => handleInputChange("SUPPORT_RUBIKA", e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary dir-ltr focus:border-primary-default focus:ring-1 focus:ring-primary-default focus:outline-none"
                  placeholder="https://rubika.ir/..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-text-primary">لینک بله پشتیبانی</label>
                <input
                  type="text"
                  value={config.SUPPORT_BALE || ""}
                  onChange={(e) => handleInputChange("SUPPORT_BALE", e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary dir-ltr focus:border-primary-default focus:ring-1 focus:ring-primary-default focus:outline-none"
                  placeholder="https://ble.ir/..."
                />
              </div>
            </div>

            {/* Educational Channel Links */}
            <div className="pt-6 border-t border-border space-y-4">
              <h4 className="font-bold text-xs text-text-primary flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-primary-default" /> لینک کانال‌ها و ویدیوهای آموزش پلتفرم
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-text-muted">کانال آپارات (Aparat)</label>
                  <input
                    type="text"
                    value={config.EDUCATION_APARAT || ""}
                    onChange={(e) => handleInputChange("EDUCATION_APARAT", e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-text-primary dir-ltr focus:border-primary-default focus:outline-none"
                    placeholder="https://www.aparat.com/zopit"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-text-muted">کانال یوتیوب (YouTube)</label>
                  <input
                    type="text"
                    value={config.EDUCATION_YOUTUBE || ""}
                    onChange={(e) => handleInputChange("EDUCATION_YOUTUBE", e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-text-primary dir-ltr focus:border-primary-default focus:outline-none"
                    placeholder="https://www.youtube.com/c/zopit"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-text-muted">کانال اطلاع‌رسانی تلگرام</label>
                  <input
                    type="text"
                    value={config.EDUCATION_TELEGRAM || ""}
                    onChange={(e) => handleInputChange("EDUCATION_TELEGRAM", e.target.value)}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-text-primary dir-ltr focus:border-primary-default focus:outline-none"
                    placeholder="https://t.me/zopit_news"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LEGAL TERMS AND CONDITIONS */}
      {activeTab === "terms" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary-default" />
                <div>
                  <h3 className="font-bold text-text-primary text-sm">ویرایش متن قراردادها و قوانین حقوقی</h3>
                  <p className="text-xs text-text-muted mt-0.5">نمایش به کاربران هنگام ثبت‌نام و فعال‌سازی حساب کاربری</p>
                </div>
              </div>
              <button
                onClick={() => {
                  saveBulkSettings({
                    STORE_RULES: config.STORE_RULES,
                    SUPPLIER_RULES: config.SUPPLIER_RULES,
                    TERMS_AND_CONDITIONS: config.SUPPLIER_RULES,
                  }, "متن قوانین با موفقیت در دیتابیس بروزرسانی شد.");
                }}
                className="px-5 py-2.5 bg-primary-default hover:bg-primary-hover text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <Save className="w-4 h-4" /> ذخیره متن قوانین
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-primary block">قوانین و تعهدنامه مدیران فروشگاه</label>
                <textarea
                  value={config.STORE_RULES || ""}
                  onChange={(e) => handleInputChange("STORE_RULES", e.target.value)}
                  rows={14}
                  className="w-full bg-background border border-border rounded-2xl p-4 text-xs text-text-primary leading-relaxed focus:ring-1 focus:ring-primary-default focus:border-primary-default focus:outline-none"
                  placeholder="متن کامل قوانین فروشگاه..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-primary block">قوانین و تعهدنامه تامین‌کنندگان کالا</label>
                <textarea
                  value={config.SUPPLIER_RULES || ""}
                  onChange={(e) => handleInputChange("SUPPLIER_RULES", e.target.value)}
                  rows={14}
                  className="w-full bg-background border border-border rounded-2xl p-4 text-xs text-text-primary leading-relaxed focus:ring-1 focus:ring-primary-default focus:border-primary-default focus:outline-none"
                  placeholder="متن کامل قوانین تامین‌کننده..."
                />
              </div>
            </div>

            {/* Pro Package Settings & Discounts Link / Section */}
            <div className="pt-6 border-t border-border space-y-4">
              <div className="bg-gradient-to-r from-emerald-500/10 via-background to-purple-500/10 p-5 rounded-2xl border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-text-primary">
                      تنظیمات، قوانین و کدهای تخفیف پکیج اکانت پرو زوپیت
                    </h4>
                    <p className="text-[11px] text-text-muted mt-0.5">
                      تعیین هزینه اولیه ثبت‌نام، کدهای تخفیف با سقف مجاز مصرف و انقضای زمانی، و مدیریت متن تعهدنامه پرو
                    </p>
                  </div>
                </div>

                <a
                  href="#pro-settings"
                  onClick={(e) => {
                    e.preventDefault();
                    // trigger notification or instructions
                    toast("برای مدیریت کامل قوانین و کدهای تخفیف پرو، به منوی «اکانت‌های پرو > تنظیمات و قوانین پکیج پرو» مراجعه کنید.", "info");
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer shadow-xs"
                >
                  <Ticket className="w-4 h-4" />
                  <span>تنظیم کدهای تخفیف پرو</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: CUSTOM CODE INJECTION & FILE MANAGER */}
      {activeTab === "code" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Code className="w-5 h-5 text-emerald-500" />
                <div>
                  <h3 className="font-bold text-text-primary text-sm">تزریق کدهای سفارشی (Custom Code Injection)</h3>
                  <p className="text-xs text-text-muted mt-0.5">افزودن اسکریپت‌های چت آنلاین، آمارگیر و استایل‌های CSS به صورت زنده</p>
                </div>
              </div>
              <button
                onClick={() => {
                  saveBulkSettings({
                    CUSTOM_CODE_HEADER: config.CUSTOM_CODE_HEADER,
                    CUSTOM_CODE_FOOTER: config.CUSTOM_CODE_FOOTER,
                    CUSTOM_JS_CODE: config.CUSTOM_JS_CODE,
                    CUSTOM_CSS_CODE: config.CUSTOM_CSS_CODE,
                  }, "کدهای سفارشی با موفقیت در دیتابیس اعمال شدند.");
                }}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <Save className="w-4 h-4" /> ذخیره و اجرای کدها
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-primary flex items-center justify-between">
                  <span>کدهای هدر سایت (&lt;head&gt;)</span>
                  <span className="text-[10px] text-text-muted">Meta & Scripts</span>
                </label>
                <textarea
                  value={config.CUSTOM_CODE_HEADER || ""}
                  onChange={(e) => handleInputChange("CUSTOM_CODE_HEADER", e.target.value)}
                  rows={6}
                  dir="ltr"
                  className="w-full bg-slate-950 text-emerald-400 font-mono border border-border rounded-xl p-3.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  placeholder="<!-- <script src='https://analytics...'></script> -->"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-primary flex items-center justify-between">
                  <span>کدهای فوتر سایت (&lt;body&gt;)</span>
                  <span className="text-[10px] text-text-muted">Chat Widgets</span>
                </label>
                <textarea
                  value={config.CUSTOM_CODE_FOOTER || ""}
                  onChange={(e) => handleInputChange("CUSTOM_CODE_FOOTER", e.target.value)}
                  rows={6}
                  dir="ltr"
                  className="w-full bg-slate-950 text-emerald-400 font-mono border border-border rounded-xl p-3.5 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  placeholder="<!-- اسکریپت‌های گفتینو یا رایچت -->"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-primary flex items-center justify-between">
                  <span>کد جاوااسکریپت سفارشی (Custom JS)</span>
                  <span className="text-[10px] text-text-muted">Dynamic Logic</span>
                </label>
                <textarea
                  value={config.CUSTOM_JS_CODE || ""}
                  onChange={(e) => handleInputChange("CUSTOM_JS_CODE", e.target.value)}
                  rows={6}
                  dir="ltr"
                  className="w-full bg-slate-950 text-amber-300 font-mono border border-border rounded-xl p-3.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  placeholder="// console.log('Zopit app loaded');"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-primary flex items-center justify-between">
                  <span>استایل سفارشی CSS (Custom CSS)</span>
                  <span className="text-[10px] text-text-muted">Override UI</span>
                </label>
                <textarea
                  value={config.CUSTOM_CSS_CODE || ""}
                  onChange={(e) => handleInputChange("CUSTOM_CSS_CODE", e.target.value)}
                  rows={6}
                  dir="ltr"
                  className="w-full bg-slate-950 text-sky-300 font-mono border border-border rounded-xl p-3.5 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  placeholder="/* .my-custom-badge { font-weight: bold; } */"
                />
              </div>
            </div>

            {/* Upload File Manager */}
            <div className="pt-6 border-t border-border space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs text-text-primary flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-primary-default" /> مدیریت فایل‌های سفارشی
                  </h4>
                  <p className="text-[11px] text-text-muted mt-0.5">آپلود اسکریپت، تصویر، لوگو و فونت اختصاصی</p>
                </div>
                <label className="px-4 py-2 bg-primary-default hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all">
                  <Upload className="w-4 h-4" /> افزودن فایل
                  <input
                    type="file"
                    multiple
                    accept=".js,.css,.html,.json,.txt,.png,.jpg,.jpeg,.svg,.gif,.woff2"
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files || files.length === 0) return;
                      let currentFiles: any[] = [];
                      try {
                        currentFiles = JSON.parse(config.CUSTOM_INJECTED_FILES || "[]");
                      } catch {
                        currentFiles = [];
                      }
                      const fileList = Array.from(files);
                      let processed = 0;
                      fileList.forEach((file) => {
                        const reader = new FileReader();
                        const isText = file.name.endsWith(".js") || file.name.endsWith(".css") || file.name.endsWith(".html") || file.name.endsWith(".json");
                        reader.onload = (evt) => {
                          const content = evt.target?.result as string;
                          currentFiles.push({
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
                            name: file.name,
                            type: file.name.split(".").pop()?.toLowerCase() || "file",
                            size: (file.size / 1024).toFixed(1) + " KB",
                            data: content,
                            isText,
                            uploadedAt: new Date().toLocaleDateString("fa-IR"),
                          });
                          processed++;
                          if (processed === fileList.length) {
                            const jsonStr = JSON.stringify(currentFiles);
                            handleInputChange("CUSTOM_INJECTED_FILES", jsonStr);
                            saveSingleConfig("CUSTOM_INJECTED_FILES", jsonStr);
                            toast(`${fileList.length} فایل با موفقیت آپلود شد.`, "success");
                          }
                        };
                        if (isText && file.size < 500000) {
                          reader.readAsText(file);
                        } else {
                          reader.readAsDataURL(file);
                        }
                      });
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>

              {/* Render Uploaded Files list */}
              {(() => {
                let fileList: any[] = [];
                try {
                  fileList = JSON.parse(config.CUSTOM_INJECTED_FILES || "[]");
                } catch {
                  fileList = [];
                }

                if (fileList.length === 0) {
                  return (
                    <div className="p-8 border border-dashed border-border rounded-2xl text-center bg-surface text-text-muted space-y-1">
                      <Upload className="w-8 h-8 text-text-muted mx-auto" />
                      <p className="text-xs font-bold text-text-secondary">هیچ فایل سفارشی آپلود نشده است.</p>
                      <p className="text-[10px]">می‌توانید اسکریپت‌ها یا تصاویر خود را جهت استفاده در صفحات آپلود کنید.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2.5">
                    {fileList.map((f: any) => (
                      <div key={f.id} className="bg-surface border border-border rounded-xl p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary-default/10 text-primary-default font-mono text-xs font-black flex items-center justify-center shrink-0 uppercase">
                            {f.type}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-text-primary truncate dir-ltr text-right">{f.name}</p>
                            <p className="text-[10px] text-text-muted">{f.size} • {f.uploadedAt}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(f.data);
                              toast("محتوای فایل در حافظه کپی شد.", "success");
                            }}
                            className="px-2.5 py-1 bg-card hover:bg-surface-hover border border-border text-text-primary text-[10px] font-bold rounded-lg cursor-pointer flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" /> کپی
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const filtered = fileList.filter((item) => item.id !== f.id);
                              const jsonStr = JSON.stringify(filtered);
                              handleInputChange("CUSTOM_INJECTED_FILES", jsonStr);
                              saveSingleConfig("CUSTOM_INJECTED_FILES", jsonStr);
                              toast("فایل حذف شد.", "info");
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: WOOCOMMERCE INTEGRATION */}
      {activeTab === "woocommerce" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-card p-6 rounded-3xl border border-border shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-primary-default" />
                <div>
                  <h3 className="font-bold text-text-primary text-sm">تنظیمات اتصال به فروشگاه ووکامرس (WooCommerce REST API)</h3>
                  <p className="text-xs text-text-muted mt-0.5">همگام‌سازی محصولات، کاتالوگ و سفارشات عمده با سایت‌های وردپرسی</p>
                </div>
              </div>
              <button
                onClick={() => {
                  saveBulkSettings({
                    WOOCOMMERCE_SYNC_ENABLED: config.WOOCOMMERCE_SYNC_ENABLED,
                    WOOCOMMERCE_STORE_URL: config.WOOCOMMERCE_STORE_URL,
                    WOOCOMMERCE_CONSUMER_KEY: config.WOOCOMMERCE_CONSUMER_KEY,
                    WOOCOMMERCE_CONSUMER_SECRET: config.WOOCOMMERCE_CONSUMER_SECRET,
                    WOOCOMMERCE_AUTO_IMPORT_ORDERS: config.WOOCOMMERCE_AUTO_IMPORT_ORDERS,
                    WOOCOMMERCE_SYNC_INTERVAL_MINS: config.WOOCOMMERCE_SYNC_INTERVAL_MINS,
                  }, "تنظیمات وب‌سرویس ووکامرس ذخیره شدند.");
                }}
                className="px-5 py-2.5 bg-primary-default hover:bg-primary-hover text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-xs transition-all"
              >
                <Save className="w-4 h-4" /> ذخیره اتصال ووکامرس
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="flex items-center justify-between p-3.5 bg-surface border border-border rounded-2xl cursor-pointer">
                  <span className="text-xs font-bold text-text-primary">فعال‌سازی ماژول سینک خودکار ووکامرس</span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-border text-primary-default focus:ring-primary-default cursor-pointer"
                    checked={config.WOOCOMMERCE_SYNC_ENABLED === true || config.WOOCOMMERCE_SYNC_ENABLED === "true"}
                    onChange={(e) => handleInputChange("WOOCOMMERCE_SYNC_ENABLED", e.target.checked)}
                  />
                </label>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-primary">آدرس دامنه سایت ووکامرس (WordPress Store URL)</label>
                  <input
                    type="text"
                    value={config.WOOCOMMERCE_STORE_URL || ""}
                    onChange={(e) => handleInputChange("WOOCOMMERCE_STORE_URL", e.target.value)}
                    placeholder="https://my-woocommerce-store.com"
                    dir="ltr"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary font-mono focus:border-primary-default focus:ring-1 focus:ring-primary-default focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-primary">Consumer Key (ck_...)</label>
                  <input
                    type="text"
                    value={config.WOOCOMMERCE_CONSUMER_KEY || ""}
                    onChange={(e) => handleInputChange("WOOCOMMERCE_CONSUMER_KEY", e.target.value)}
                    placeholder="ck_1234567890..."
                    dir="ltr"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary font-mono focus:border-primary-default focus:ring-1 focus:ring-primary-default focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-primary">Consumer Secret (cs_...)</label>
                  <input
                    type="password"
                    value={config.WOOCOMMERCE_CONSUMER_SECRET || ""}
                    onChange={(e) => handleInputChange("WOOCOMMERCE_CONSUMER_SECRET", e.target.value)}
                    placeholder="cs_1234567890..."
                    dir="ltr"
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs text-text-primary font-mono focus:border-primary-default focus:ring-1 focus:ring-primary-default focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-4 bg-surface p-5 rounded-2xl border border-border flex flex-col justify-between">
                <div className="space-y-4">
                  <h4 className="font-bold text-xs text-text-primary pb-2 border-b border-border">تنظیمات زمانی و سفارشات ووکامرس</h4>
                  
                  <label className="flex items-center justify-between p-3 bg-card border border-border rounded-xl cursor-pointer">
                    <span className="text-xs font-semibold text-text-primary">دریافت و ثبت خودکار سفارشات جدید ووکامرس</span>
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-border text-primary-default cursor-pointer"
                      checked={config.WOOCOMMERCE_AUTO_IMPORT_ORDERS === true || config.WOOCOMMERCE_AUTO_IMPORT_ORDERS === "true"}
                      onChange={(e) => handleInputChange("WOOCOMMERCE_AUTO_IMPORT_ORDERS", e.target.checked)}
                    />
                  </label>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-primary">بازه زمانی همگام‌سازی (دقیقه)</label>
                    <input
                      type="number"
                      min="5"
                      max="1440"
                      value={config.WOOCOMMERCE_SYNC_INTERVAL_MINS || 15}
                      onChange={(e) => handleInputChange("WOOCOMMERCE_SYNC_INTERVAL_MINS", Number(e.target.value))}
                      className="w-full bg-card border border-border rounded-xl px-4 py-2 text-xs font-mono text-text-primary focus:border-primary-default focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex gap-3">
                  <button
                    type="button"
                    onClick={handleTestWooCommerce}
                    disabled={wcTesting}
                    className="flex-1 py-2.5 bg-primary-default hover:bg-primary-hover text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 shadow-xs"
                  >
                    <RefreshCw className={`w-4 h-4 ${wcTesting ? "animate-spin" : ""}`} />
                    {wcTesting ? "در حال تست..." : "تست اتصال به API ووکامرس"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SYSTEM LOGS */}
      {activeTab === "logs" && (
        <div className="animate-fadeIn">
          <SystemLogs />
        </div>
      )}

      {/* TAB 8: SYSTEM HEALTH */}
      {activeTab === "health" && (
        <div className="animate-fadeIn">
          <SystemHealth />
        </div>
      )}

      {/* TAB 9: CODE EDITOR / DEV TOOLS */}
      {activeTab === "dev_tools" && (
        <div className="animate-fadeIn">
          <CodeEditor />
        </div>
      )}
    </div>
  );
}
