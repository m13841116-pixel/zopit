import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
import {
  Settings,
  Info,
  Shield,
  ShieldCheck,
  Bell,
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
  Play,
  GraduationCap,
  CheckCircle,
  HelpCircle,
  Activity,
  Plus,
  Trash2,
  GitCommit,
  Bot,
  Database,
  CreditCard,
  MessageSquare,
  Phone,
  Code,
  FileText,
  Globe,
  ShoppingBag,
  Send,
  Save,
  Link,
  Upload,
  Paperclip,
  Copy,
  Check,
  Eye,
  Download,
  Sparkles,
} from "lucide-react";
import PaymentSmsSettings from "./PaymentSmsSettings";

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState<
    "core" | "gateways" | "sms" | "support" | "terms" | "code" | "woocommerce"
  >("core");

  const [config, setConfig] = useState<Record<string, any>>({
    // Defaults
    STORE_CATALOG_ENABLED: true,
    STORE_ORDERS_ENABLED: true,
    STORE_FINANCIAL_ENABLED: true,
    SUPPLIER_CATALOG_ENABLED: true,
    SUPPLIER_ORDERS_ENABLED: true,
    SUPPLIER_FINANCIAL_ENABLED: true,
    COMMISSION_PERCENTAGE: 10,
    TAX_RATE: 9,
    MAX_DELIVERY_HOURS: 48,
    RETURN_PERIOD_DAYS: 7,
    DAILY_DELAY_PENALTY: 2,
    CRITICAL_SUSPENSION_THRESHOLD: 70,
    MIN_PAYOUT_AMOUNT: 1000000,
    MAX_PRODUCT_PRICE: 500000000,
    WEEKLY_MAX_ORDER_AMOUNT: 2000000000,
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
    
    // Gateway defaults
    PAYMENT_GATEWAY_TYPE: "ZIBAL",
    PAYMENT_GATEWAY_MERCHANT_CODE: "zibal_merchant_key",
    PAYMENT_GATEWAY_KEY: "",
    CARD_TO_CARD_SHABA: "IR330560611828006022464501",
    CARD_TO_CARD_CARD: "6219-8618-1832-7263",
    CARD_TO_CARD_OWNER: "مهدی مشرفی",
    
    // SMS defaults
    SMS_PANEL_PROVIDER: "FARAZSMS",
    SMS_PANEL_API_KEY: "faraz_sms_key_sample",
    SMS_NOTIFY_ON_ORDER_SUBMIT: true,
    SMS_NOTIFY_ON_ORDER_PAYMENT: true,
    SMS_NOTIFY_ON_SUPPLIER_VERIFY: true,
    SMS_NOTIFY_ON_PAYOUT_SETTLE: true,
    SMS_NOTIFY_ON_TICKET_REPLY: true,

    // Support Channels defaults
    SUPPORT_PHONE: "09180088358",
    SUPPORT_PHONE_2: "02188888888",
    SUPPORT_TELEGRAM: "@Zopit_Support",
    SUPPORT_RUBIKA: "https://rubika.ir/Zopit_official",
    SUPPORT_BALE: "https://ble.ir/Zopit_support",
    SUPPORT_EMAIL: "support@Zopit.ir",

    // Education Channel Links
    EDUCATION_APARAT: "https://www.aparat.com",
    EDUCATION_YOUTUBE: "https://www.youtube.com",
    EDUCATION_TELEGRAM: "https://t.me",

    // Legal Terms defaults
    SUPPLIER_RULES: "۱. تضمین اصالت و سلامت کالا: تامین‌کننده متعهد می‌گردد تمامی کالاهای ارسالی را منطبق بر اصالت، کیفیت توصیف‌شده و سلامت فیزیکی کامل تأمین و ارسال کند.\n۲. درج قیمت رقابتی و واقعی: درج قیمت‌های غیرواقعی، موجودی کاذب یا قیمت‌گذاری خارج از چارچوب بازار آزاد ممنوع بوده و منجر به تعلیق موقت پنل خواهد شد.\n۳. زمان‌بندی دقیق ارسال سفارش: تامین‌کننده موظف است سفارشات پذیرفته شده را حداکثر ظرف مهلت مجاز ارسال (SLA) بسته‌بندی کرده و تحویل نمایندگان پستی یا ارسال مستقیم دهد.\n۴. جرایم تاخیر و لغو سفارش: هرگونه تاخیر غیرموجه در ارسال یا لغو سفارشات تایید شده، مشمول کسر امتیاز عملکرد و اعمال جریمه نقدی روزانه خواهد شد.\n۵. کمیسیون و تسویه مالی: کارمزد توافق‌شده پلتفرم به صورت خودکار از هر فروش کسر گردیده و تسویه حساب پس از تایید تحویل کالا توسط خریدار و منقضی شدن مهلت مرجوعی انجام می‌گردد.",
    STORE_RULES: "۱. ثبت‌نام و احراز هویت: تمامی مدیران فروشگاه‌ها ملزم به ارائه پروانه کسب معتبر، کد ملی و اطلاعات تماس حقیقی جهت فعالیت در پلتفرم می‌باشند.\n۲. خرید عمده و فاکتورها: خریدهای ثبت شده به عنوان سفارش قطعی تلقی شده و پرداخت فیش بانکی یا درگاه آنلاین باید حداکثر ظرف مدت ۲۴ ساعت نهایی شود.\n۳. سیاست مرجوعی کالا: امکان مرجوعی کالا تنها در صورت مغایرت مشخصات، آسیب فیزیکی یا عدم تطابق اصالت کالا تا ۷ روز پس از تحویل میسر است.\n۴. تسویه حساب و فاکتور رسمی: فاکتورهای رسمی خرید توسط سیستم صادر شده و هرگونه ادعا پس از تسویه نهایی پذیرفته نخواهد شد.\n۵. حفظ محرمانگی: اطلاعات قیمت‌های همکاری و فاکتورهای دریافتی کاملاً محرمانه بوده و اشتراک‌گذاری آن‌ها با اشخاص ثالث ممنوع است.",
    CUSTOMER_RULES: "۱. مشتریان حق مرجوعی کالا تا ۷ روز طبق شرایط قانونی را دارا می‌باشند.",

    // Custom Code Injection defaults
    CUSTOM_CODE_HEADER: "<!-- کدهای فرانت‌اند هدر (CSS / Google Analytics) -->",
    CUSTOM_CODE_FOOTER: "<!-- کدهای اسکریپت فوتر -->",
    CUSTOM_CODE_BACKEND: "// هوک‌های بک‌اند سفارشی",

    // WooCommerce toggle
    WOOCOMMERCE_SYNC_ENABLED: false,
  });

  // Dynamic Custom SMS Triggers
  const [customTriggers, setCustomTriggers] = useState<Array<{
    id: string;
    title: string;
    condition: string;
    recipientPhone: string;
    template: string;
    isActive: boolean;
  }>>([
    {
      id: "trg_1",
      title: "اطلاع‌رسانی صادر نمودن لیبل پستی",
      condition: "ORDER_CREATED_REQUIRES_POSTAL_LABEL",
      recipientPhone: "09180088358",
      template: "سفارش جدید شماره {ORDER_ID} نیازمند صادر نمودن لیبل پستی است.",
      isActive: true,
    }
  ]);

  const [newTriggerTitle, setNewTriggerTitle] = useState("");
  const [newTriggerCondition, setNewTriggerCondition] = useState("ORDER_CREATED_REQUIRES_POSTAL_LABEL");
  const [newTriggerPhone, setNewTriggerPhone] = useState("09180088358");
  const [newTriggerTemplate, setNewTriggerTemplate] = useState("سفارش شماره {ORDER_ID} نیازمند برچسب پستی می‌باشد.");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newStepName, setNewStepName] = useState("");

  const fetchConfig = () => {
    setLoading(true);
    fetch("/api/config")
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => {
        if (data && !data.error) {
          // Merge defaults with actual DB data
          setConfig((prev) => ({ ...prev, ...data }));
          if (data.CUSTOM_SMS_TRIGGERS) {
            try {
              const parsed = JSON.parse(data.CUSTOM_SMS_TRIGGERS);
              if (Array.isArray(parsed)) setCustomTriggers(parsed);
            } catch (e) {
              console.error("Error parsing CUSTOM_SMS_TRIGGERS", e);
            }
          }
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching config:", err);
        setLoading(false);
      });
  };

  const handleAddCustomTrigger = () => {
    if (!newTriggerTitle.trim()) {
      toast("لطفا عنوان رویداد را وارد نمایید", "error");
      return;
    }
    const newTrg = {
      id: "trg_" + Date.now(),
      title: newTriggerTitle,
      condition: newTriggerCondition,
      recipientPhone: newTriggerPhone,
      template: newTriggerTemplate,
      isActive: true,
    };
    const updated = [...customTriggers, newTrg];
    setCustomTriggers(updated);
    saveSingleConfig("CUSTOM_SMS_TRIGGERS", JSON.stringify(updated));
    setNewTriggerTitle("");
    toast("✅ رویداد پیامکی سفارشی با موفقیت ذخیره شد.", "success");
  };

  const handleRemoveCustomTrigger = (id: string) => {
    const updated = customTriggers.filter((t) => t.id !== id);
    setCustomTriggers(updated);
    saveSingleConfig("CUSTOM_SMS_TRIGGERS", JSON.stringify(updated));
    toast("رویداد پیامکی حذف شد.", "info");
  };

  const handleToggleCustomTrigger = (id: string) => {
    const updated = customTriggers.map((t) =>
      t.id === id ? { ...t, isActive: !t.isActive } : t
    );
    setCustomTriggers(updated);
    saveSingleConfig("CUSTOM_SMS_TRIGGERS", JSON.stringify(updated));
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const saveSingleConfig = (key: string, value: any) => {
    fetch("/api/config", {
      credentials: "include",
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: String(value) }),
    })
      .then((res) => {
        if (!res.ok) return null;
        return res.json().catch(() => null);
      })
      .then(() => {
        setConfig((prev) => ({ ...prev, [key]: value }));
      })
      .catch((err) => console.error(`Error saving config key ${key}:`, err));
  };

  const saveConfig = async (key: string, value: string) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
    try {
      const res = await fetch("/api/config", {
        credentials: "include",
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ key, value: String(value) }),
      });
      const data = await res.json();
      if (data && !data.error) {
        toast("✅ تنظیمات با موفقیت ذخیره شد.", "success");
        
        // Sync rules keys with other fallback term keys
        if (key === "STORE_RULES") {
          await fetch("/api/config", {
            credentials: "include",
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: "STORE_TERMS", value: String(value) }),
          }).catch(() => {});
        } else if (key === "SUPPLIER_RULES") {
          await fetch("/api/config", {
            credentials: "include",
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: "SUPPLIER_TERMS", value: String(value) }),
          }).catch(() => {});
          await fetch("/api/config", {
            credentials: "include",
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: "TERMS_AND_CONDITIONS", value: String(value) }),
          }).catch(() => {});
        }
      } else {
        toast("خطا در ذخیره تنظیمات", "error");
      }
    } catch (err) {
      console.error("Error saving config key " + key + ":", err);
      toast("خطا در ذخیره اطلاعات", "error");
    }
  };

  const toggleConfig = (key: string) => {
    const newValue = !config[key];
    saveSingleConfig(key, newValue);
  };

  const handleRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Save all business rule fields sequentially
    const keysToSave = [
      "COMMISSION_PERCENTAGE",
      "TAX_RATE",
      "MAX_DELIVERY_HOURS",
      "RETURN_PERIOD_DAYS",
      "DAILY_DELAY_PENALTY",
      "CRITICAL_SUSPENSION_THRESHOLD",
      "MIN_PAYOUT_AMOUNT",
      "MAX_PRODUCT_PRICE",
      "WEEKLY_MAX_ORDER_AMOUNT",
      "ORDER_WORKFLOW_STEPS",
      "AUTO_NOTIFY_ON_WARNING",
      "AUTO_PENALIZE_ON_DELAY",
      "ORDER_PROCESSING_HOURS",
      "SLA_CRITICAL_HOURS",
      "SUPPLIER_AUTO_VERIFY",
      "REFUND_RULES_AUTO_APPROVE",
      "CANCEL_SCORE_DEDUCTION",
      "RETURN_SCORE_DEDUCTION",
      "DELAY_SCORE_DEDUCTION",
    ];

    const promises = keysToSave.map((key) => {
      return fetch("/api/config", {
        credentials: "include",
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: String(config[key]) }),
      });
    });

    Promise.all(promises)
      .then(() => {
        setSaving(false);
        toast("✅ قوانین جدید کسب‌وکار با موفقیت در سراسر سیستم اعمال گردید!", "success");
      })
      .catch((err) => {
        console.error("Error saving rules:", err);
        setSaving(false);
        toast("❌ خطا در ذخیره اطلاعات. لطفا دوباره تلاش نمایید.", "error");
      });
  };

  const handleInputChange = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Workflow steps array derived from comma separated string
  const workflowSteps = config.ORDER_WORKFLOW_STEPS
    ? config.ORDER_WORKFLOW_STEPS.split(",").filter(
        (s: string) => s.trim() !== "",
      )
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
    const updatedSteps = workflowSteps.filter(
      (_: any, i: number) => i !== index,
    );
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-default mr-2"></div>
        در حال دریافت اطلاعات قوانین و تنظیمات سیستم...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in" dir="rtl">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-6 rounded-2xl border border-subtle">
        <div>
          <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary-default animate-spin-slow" />
            موتور قوانین کسب‌وکار و پیکربندی سیستم
          </h2>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            تنظیم بدون نیاز به برنامه‌نویسی برای تغییر درصد کمیسیون، آستانه
            تعلیق تامین‌کنندگان، گام‌های سفارش و دسترسی ماژول‌ها.
          </p>
        </div>
        <div className="bg-primary-default/10 text-primary-default border border-primary-default/20 px-3 py-1.5 rounded-xl text-xs flex items-center gap-2">
          <Shield className="w-4 h-4" /> وضعیت امنیتی: کاملاً محافظت شده
        </div>
        <button
          onClick={async () => {
            try {
              const response = await fetch("/api/admin/export-all-data", {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
              });
              if (!response.ok) {
                throw new Error("خطا در دریافت داده‌ها از سرور");
              }
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `site-data-export-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              toast("✅ داده‌های سایت با موفقیت دریافت شد.", "success");
            } catch (err: any) {
              toast("❌ خطا در خروجی گرفتن از داده‌ها: " + err.message, "error");
            }
          }}
          className="px-4 py-2 bg-primary-default text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer hover:bg-primary-hover"
        >
          <Database className="w-4 h-4" />
          خروجی گرفتن از تمام داده‌های سایت
        </button>
      </div>

      
      {/* System Update Module */}
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-subtle space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-subtle">
          <Upload className="w-5 h-5 text-primary-default" />
          <div>
            <h3 className="font-bold text-text-primary">
              بروزرسانی نسخه سیستم
            </h3>
            <p className="text-[10px] text-muted mt-0.5">
              آپلود فایل زیپ استخراج شده از گوگل استودیو برای اعمال تغییرات بدون خرابی دیتابیس
            </p>
          </div>
        </div>
        <div>
          <input type="file" id="updateZip" accept=".zip" className="block w-full text-xs text-muted
            file:mr-4 file:py-2 file:px-4
            file:rounded-xl file:border-0
            file:text-xs file:font-bold
            file:bg-primary-default/10 file:text-primary-default
            hover:file:bg-primary-default/20
            cursor-pointer" 
          />
          <button 
            onClick={async () => {
              const fileInput = document.getElementById("updateZip") as HTMLInputElement;
              if (!fileInput.files || fileInput.files.length === 0) {
                toast("لطفاً فایل زیپ بروزرسانی را انتخاب کنید", "error");
                return;
              }
              const formData = new FormData();
              formData.append("updateFile", fileInput.files[0]);
              try {
                toast("در حال آپلود بروزرسانی... لطفا منتظر بمانید", "info");
                const res = await fetch("/api/admin/system/update", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                  body: formData
                });
                const data = await res.json();
                if (res.ok) {
                  toast("✅ " + data.message, "success");
                } else {
                  toast("❌ خطا: " + data.error, "error");
                }
              } catch (err: any) {
                toast("خطای شبکه", "error");
              }
            }}
            className="mt-4 px-4 py-2 bg-success text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-emerald-700"
          >
            آپلود و اعمال بروزرسانی
          </button>
        </div>
      </div>

      {/* 1. MAIN SYSTEM ACCESS & MAINTENANCE MODULE */}
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-subtle space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-subtle">
          <Power className="w-5 h-5 text-primary-default animate-pulse" />
          <div>
            <h3 className="font-bold text-text-primary">
              تنظیمات اضطراری و دسترسی سراسری به پنل‌ها
            </h3>
            <p className="text-[10px] text-muted mt-0.5">
              غیرفعال‌سازی موقت بخش‌ها در مواقع بروزرسانی یا تعمیرات
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Store Manager Access */}
          <div className="space-y-4">
            <h4 className="font-bold text-text-primary bg-background p-3 rounded-xl border border-subtle text-center text-xs">
              دسترسی‌های پنل مدیر فروشگاه
            </h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 border border-subtle rounded-xl hover:bg-background/50 cursor-pointer transition-all">
                <span className="text-xs font-semibold text-text-primary">
                  مشاهده کاتالوگ و محصولات کل تامین‌کنندگان
                </span>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-default text-primary-default focus:ring-primary-default"
                  checked={config.STORE_CATALOG_ENABLED !== false}
                  onChange={() => toggleConfig("STORE_CATALOG_ENABLED")}
                />
              </label>
              <label className="flex items-center justify-between p-3.5 border border-subtle rounded-xl hover:bg-background/50 cursor-pointer transition-all">
                <span className="text-xs font-semibold text-text-primary">
                  امکان ثبت و پیگیری سفارشات عمده
                </span>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-default text-primary-default focus:ring-primary-default"
                  checked={config.STORE_ORDERS_ENABLED !== false}
                  onChange={() => toggleConfig("STORE_ORDERS_ENABLED")}
                />
              </label>
              <label className="flex items-center justify-between p-3.5 border border-subtle rounded-xl hover:bg-background/50 cursor-pointer transition-all">
                <span className="text-xs font-semibold text-text-primary">
                  دسترسی به بخش مالی و ثبت فیش پرداخت
                </span>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-default text-primary-default focus:ring-primary-default"
                  checked={config.STORE_FINANCIAL_ENABLED !== false}
                  onChange={() => toggleConfig("STORE_FINANCIAL_ENABLED")}
                />
              </label>
            </div>
          </div>

          {/* Supplier Access */}
          <div className="space-y-4">
            <h4 className="font-bold text-text-primary bg-background p-3 rounded-xl border border-subtle text-center text-xs">
              دسترسی‌های پنل تامین‌کنندگان کالا
            </h4>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3.5 border border-subtle rounded-xl hover:bg-background/50 cursor-pointer transition-all">
                <span className="text-xs font-semibold text-text-primary">
                  ایجاد کالا، ویرایش قیمت و مدیریت تنوع‌ها
                </span>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-default text-primary-default focus:ring-primary-default"
                  checked={config.SUPPLIER_CATALOG_ENABLED !== false}
                  onChange={() => toggleConfig("SUPPLIER_CATALOG_ENABLED")}
                />
              </label>
              <label className="flex items-center justify-between p-3.5 border border-subtle rounded-xl hover:bg-background/50 cursor-pointer transition-all">
                <span className="text-xs font-semibold text-text-primary">
                  مدیریت سفارشات دریافتی و تغییر وضعیت ارسال
                </span>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-default text-primary-default focus:ring-primary-default"
                  checked={config.SUPPLIER_ORDERS_ENABLED !== false}
                  onChange={() => toggleConfig("SUPPLIER_ORDERS_ENABLED")}
                />
              </label>
              <label className="flex items-center justify-between p-3.5 border border-subtle rounded-xl hover:bg-background/50 cursor-pointer transition-all">
                <span className="text-xs font-semibold text-text-primary">
                  مشاهده کیف‌پول و ارسال درخواست تسویه حساب
                </span>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-default text-primary-default focus:ring-primary-default"
                  checked={config.SUPPLIER_FINANCIAL_ENABLED !== false}
                  onChange={() => toggleConfig("SUPPLIER_FINANCIAL_ENABLED")}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="bg-warning/5 p-4 rounded-xl border border-warning/20 flex gap-3 text-warning text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <p className="leading-relaxed font-semibold">
            نکته بسیار مهم: با غیرفعال‌سازی هر یک از این دسترسی‌ها، کاربران در
            حین ورود به ماژول مربوطه با یک صفحه زیبای "🚧 در حال بروزرسانی و
            تعمیر موقت" مواجه می‌شوند تا از بروز تداخل اطلاعاتی جلوگیری شود.
          </p>
        </div>
      </div>

      {/* 2. BUSINESS RULE ENGINE */}
      <form
        onSubmit={handleRuleSubmit}
        className="bg-surface p-6 rounded-2xl shadow-sm border border-subtle space-y-6"
      >
        <div className="flex items-center justify-between pb-4 border-b border-subtle">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-success" />
            <div>
              <h3 className="font-bold text-text-primary">
                موتور قوانین و کارمزدها (Business Rules Core)
              </h3>
              <p className="text-[10px] text-muted mt-0.5">
                تنظیم ضرایب فرمول‌های مالی و انضباطی کل پلتفرم
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-success hover:bg-success disabled:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer transition-colors"
          >
            {saving ? "در حال ذخیره‌سازی..." : "ثبت و اعمال تغییرات قوانین"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Commission rate */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1">
              <Percent className="w-4 h-4 text-muted" /> درصد کارمزد پلتفرم
              (کمیسیون)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={config.COMMISSION_PERCENTAGE}
                onChange={(e) =>
                  handleInputChange(
                    "COMMISSION_PERCENTAGE",
                    Number(e.target.value),
                  )
                }
                className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-default text-text-primary font-mono font-bold"
              />
              <span className="absolute left-4 top-3 text-xs text-muted">
                درصد (٪)
              </span>
            </div>
            <p className="text-[10px] text-muted">
              از کل فروش تامین‌کننده سهم سیستم می‌شود.
            </p>
          </div>

          {/* Tax Rate */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-muted" /> درصد مالیات بر ارزش
              افزوده (VAT)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={config.TAX_RATE}
                onChange={(e) =>
                  handleInputChange("TAX_RATE", Number(e.target.value))
                }
                className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-default text-text-primary font-mono font-bold"
              />
              <span className="absolute left-4 top-3 text-xs text-muted">
                درصد (٪)
              </span>
            </div>
            <p className="text-[10px] text-muted">
              به قیمت نهایی جهت واریز فاکتورها افزوده می‌شود.
            </p>
          </div>

          {/* Max ship period */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted" /> حداکثر زمان ارسال کالا
              توسط تامین‌کننده
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={config.MAX_DELIVERY_HOURS}
                onChange={(e) =>
                  handleInputChange(
                    "MAX_DELIVERY_HOURS",
                    Number(e.target.value),
                  )
                }
                className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-default text-text-primary font-mono font-bold"
              />
              <span className="absolute left-4 top-3 text-xs text-muted">
                ساعت
              </span>
            </div>
            <p className="text-[10px] text-muted">
              پس از این مهلت، سیستم وضعیت را تاخیردار محاسبه می‌کند.
            </p>
          </div>

          {/* Return period */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1">
              <RotateCcw className="w-4 h-4 text-muted" /> مهلت مرجوعی کالا برای
              فروشگاه
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={config.RETURN_PERIOD_DAYS}
                onChange={(e) =>
                  handleInputChange(
                    "RETURN_PERIOD_DAYS",
                    Number(e.target.value),
                  )
                }
                className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-default text-text-primary font-mono font-bold"
              />
              <span className="absolute left-4 top-3 text-xs text-muted">
                روز کاری
              </span>
            </div>
            <p className="text-[10px] text-muted">
              مدت زمانی که فروشگاه می‌تواند کالا را مرجوع کند.
            </p>
          </div>

          {/* Delay points */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1">
              <TrendingDown className="w-4 h-4 text-muted" /> کسر امتیاز منفی به
              ازای هر روز تاخیر
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={config.DAILY_DELAY_PENALTY}
                onChange={(e) =>
                  handleInputChange(
                    "DAILY_DELAY_PENALTY",
                    Number(e.target.value),
                  )
                }
                className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-default text-text-primary font-mono font-bold"
              />
              <span className="absolute left-4 top-3 text-xs text-muted">
                امتیاز منفی/روز
              </span>
            </div>
            <p className="text-[10px] text-muted">
              امتیاز منفی از کارنامه عملکرد تامین‌کننده کسر می‌شود.
            </p>
          </div>

          {/* LOGISTICS & FIXED SHIPPING FEE CONFIGURATION */}
          <div className="p-5 bg-indigo-500/5 rounded-2xl border border-indigo-500/20 space-y-4 col-span-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-indigo-500/10">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <h4 className="font-extrabold text-sm text-text-primary">
                    تنظیمات هزینه ارسال پستی و کرایه مرسوله (Fixed Shipping Rate Settings)
                  </h4>
                  <p className="text-[11px] text-text-muted mt-0.5">
                    امکان فعال‌سازی محاسبه خودکار مبلغ ثابت برای پست دولتی و تیپاکس یا برآورد و ثبت دستی توسط مدیریت.
                  </p>
                </div>
              </div>
              <label className="flex items-center gap-3 px-4 py-2 bg-surface rounded-xl border border-border-subtle cursor-pointer hover:border-indigo-500/40 transition-all">
                <span className="text-xs font-black text-text-secondary">
                  {config.FIXED_SHIPPING_ENABLED === true || config.FIXED_SHIPPING_ENABLED === "true"
                    ? "🟢 محاسبه خودکار هزینه ثابت"
                    : "🔴 برآورد و ثبت دستی توسط مدیریت"}
                </span>
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  checked={config.FIXED_SHIPPING_ENABLED === true || config.FIXED_SHIPPING_ENABLED === "true"}
                  onChange={(e) => {
                    handleInputChange("FIXED_SHIPPING_ENABLED", e.target.checked);
                    saveSingleConfig("FIXED_SHIPPING_ENABLED", e.target.checked);
                  }}
                />
              </label>
            </div>

            {(config.FIXED_SHIPPING_ENABLED === true || config.FIXED_SHIPPING_ENABLED === "true") && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary flex items-center justify-between">
                    <span>هزینه ثابت ارسال پست دولتی (پست پیشتاز / ایران)</span>
                    <span className="text-[10px] text-indigo-600 font-mono font-bold">تومان</span>
                  </label>
                  <input
                    type="number"
                    value={config.FIXED_POST_SHIPPING_FEE || 50000}
                    onChange={(e) => {
                      handleInputChange("FIXED_POST_SHIPPING_FEE", e.target.value);
                      saveSingleConfig("FIXED_POST_SHIPPING_FEE", e.target.value);
                    }}
                    className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-text-primary"
                    placeholder="مثلاً 50000"
                  />
                  <p className="text-[10px] text-text-muted">
                    هنگام انتخاب روش پست توسط مدیر فروشگاه، این مبلغ مستقیماً به فاکتور افزوده و سفارش آماده پرداخت می‌شود.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-secondary flex items-center justify-between">
                    <span>هزینه ثابت ارسال تیپاکس / پیک اختصاصی</span>
                    <span className="text-[10px] text-indigo-600 font-mono font-bold">تومان</span>
                  </label>
                  <input
                    type="number"
                    value={config.FIXED_TIPAX_SHIPPING_FEE || 80000}
                    onChange={(e) => {
                      handleInputChange("FIXED_TIPAX_SHIPPING_FEE", e.target.value);
                      saveSingleConfig("FIXED_TIPAX_SHIPPING_FEE", e.target.value);
                    }}
                    className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold text-text-primary"
                    placeholder="مثلاً 80000"
                  />
                  <p className="text-[10px] text-text-muted">
                    هنگام انتخاب روش تیپاکس / اکسپرس توسط مدیر فروشگاه، این مبلغ اعمال می‌گردد.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Critical suspend threshold */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1">
              <AlertTriangle className="w-4 h-4 text-muted" /> آستانه امتیاز
              عملکرد برای تعلیق خودکار
            </label>
            <div className="relative">
              <input
                type="number"
                min="10"
                max="100"
                value={config.CRITICAL_SUSPENSION_THRESHOLD}
                onChange={(e) =>
                  handleInputChange(
                    "CRITICAL_SUSPENSION_THRESHOLD",
                    Number(e.target.value),
                  )
                }
                className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-default text-text-primary font-mono font-bold"
              />
              <span className="absolute left-4 top-3 text-xs text-muted">
                درصد امتیاز (٪)
              </span>
            </div>
            <p className="text-[10px] text-muted">
              اگر نمره عملکرد به کمتر از این برسد، پنل تعلیق می‌شود.
            </p>
          </div>

          {/* Max Product Price */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-emerald-600 flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-emerald-600" /> حداکثر مبلغ مجاز هر کالا
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1000"
                value={config.MAX_PRODUCT_PRICE ?? 500000000}
                onChange={(e) =>
                  handleInputChange(
                    "MAX_PRODUCT_PRICE",
                    Number(e.target.value),
                  )
                }
                className="w-full bg-background border border-emerald-500/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-text-primary font-mono font-bold"
              />
              <span className="absolute left-4 top-3 text-xs text-emerald-600 font-bold">
                تومان
              </span>
            </div>
            <p className="text-[10px] text-muted">
              سقف مجاز قیمت هر محصول در سامانه ({Number(config.MAX_PRODUCT_PRICE || 0).toLocaleString("fa-IR")} تومان).
            </p>
          </div>

          {/* Weekly Max Orders Total */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-indigo-600 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-indigo-600" /> سقف مجاز کل سفارشات هفتگی
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="1000000"
                value={config.WEEKLY_MAX_ORDER_AMOUNT ?? 2000000000}
                onChange={(e) =>
                  handleInputChange(
                    "WEEKLY_MAX_ORDER_AMOUNT",
                    Number(e.target.value),
                  )
                }
                className="w-full bg-background border border-indigo-500/30 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-text-primary font-mono font-bold"
              />
              <span className="absolute left-4 top-3 text-xs text-indigo-600 font-bold">
                تومان
              </span>
            </div>
            <p className="text-[10px] text-muted">
              حداکثر مجموع مبلغ سفارشات مجاز در بازه ۷ روزه ({Number(config.WEEKLY_MAX_ORDER_AMOUNT || 0).toLocaleString("fa-IR")} تومان).
            </p>
          </div>

          {/* Order Processing hours */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted" /> مهلت زمانی تایید سفارش
              توسط تامین‌کننده
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={
                  config.ORDER_PROCESSING_HOURS !== undefined
                    ? config.ORDER_PROCESSING_HOURS
                    : 24
                }
                onChange={(e) =>
                  handleInputChange(
                    "ORDER_PROCESSING_HOURS",
                    Number(e.target.value),
                  )
                }
                className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-default text-text-primary font-mono font-bold"
              />
              <span className="absolute left-4 top-3 text-xs text-muted">
                ساعت
              </span>
            </div>
            <p className="text-[10px] text-muted">
              مهلت زمانی پذیرش سفارش ورودی توسط تامین‌کننده کالا.
            </p>
          </div>

          {/* SLA Warning hours */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1">
              <Clock className="w-4 h-4 text-muted" /> مهلت زمانی هشدار SLA
              بحرانی
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={
                  config.SLA_CRITICAL_HOURS !== undefined
                    ? config.SLA_CRITICAL_HOURS
                    : 12
                }
                onChange={(e) =>
                  handleInputChange(
                    "SLA_CRITICAL_HOURS",
                    Number(e.target.value),
                  )
                }
                className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-default text-text-primary font-mono font-bold"
              />
              <span className="absolute left-4 top-3 text-xs text-muted">
                ساعت مانده
              </span>
            </div>
            <p className="text-[10px] text-muted">
              زمان نزدیک شدن به ددلاین ارسال برای نمایش علامت هشدار قرمز.
            </p>
          </div>

          {/* Supplier Auto Verification */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1">
              <Shield className="w-4 h-4 text-muted" /> قوانین تأیید خودکار
              تامین‌کننده
            </label>
            <div className="relative">
              <select
                value={
                  config.SUPPLIER_AUTO_VERIFY === "true" ||
                  config.SUPPLIER_AUTO_VERIFY === true
                    ? "true"
                    : "false"
                }
                onChange={(e) =>
                  handleInputChange(
                    "SUPPLIER_AUTO_VERIFY",
                    e.target.value === "true",
                  )
                }
                className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-default text-text-primary font-bold"
              >
                <option value="false">تایید دستی توسط مدیرکل (پیش‌فرض)</option>
                <option value="true">
                  تایید خودکار بلافاصله پس از ثبت‌نام
                </option>
              </select>
            </div>
            <p className="text-[10px] text-muted">
              مکانیزم تایید صلاحیت تامین‌کنندگان جدید ثبت‌نام شده.
            </p>
          </div>

          {/* Refund Auto Approval */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1">
              <RotateCcw className="w-4 h-4 text-muted" /> تایید خودکار درخواست
              مرجوعی و بازپرداخت
            </label>
            <div className="relative">
              <select
                value={
                  config.REFUND_RULES_AUTO_APPROVE === "true" ||
                  config.REFUND_RULES_AUTO_APPROVE === true
                    ? "true"
                    : "false"
                }
                onChange={(e) =>
                  handleInputChange(
                    "REFUND_RULES_AUTO_APPROVE",
                    e.target.value === "true",
                  )
                }
                className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-default text-text-primary font-bold"
              >
                <option value="false">
                  بررسی و تایید دستی توسط داور پلتفرم
                </option>
                <option value="true">تایید سیستمی فوری پس از ثبت مرجوعی</option>
              </select>
            </div>
            <p className="text-[10px] text-muted">
              قانون مرجوعی و بازگشت مبالغ فاکتور به فروشگاه خریدار.
            </p>
          </div>

          {/* Cancel score deduction */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1">
              <TrendingDown className="w-4 h-4 text-muted" /> نمره کسر امتیاز
              لغو سفارش تامین‌کننده
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={
                  config.CANCEL_SCORE_DEDUCTION !== undefined
                    ? config.CANCEL_SCORE_DEDUCTION
                    : 4
                }
                onChange={(e) =>
                  handleInputChange(
                    "CANCEL_SCORE_DEDUCTION",
                    Number(e.target.value),
                  )
                }
                className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-default text-text-primary font-mono font-bold"
              />
              <span className="absolute left-4 top-3 text-xs text-muted">
                امتیاز منفی
              </span>
            </div>
            <p className="text-[10px] text-muted">
              در صورت لغو یا عدم پاسخ به سفارش توسط تامین‌کننده.
            </p>
          </div>

          {/* Return score deduction */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1">
              <TrendingDown className="w-4 h-4 text-muted" /> نمره کسر امتیاز
              ثبت مرجوعی کالا
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={
                  config.RETURN_SCORE_DEDUCTION !== undefined
                    ? config.RETURN_SCORE_DEDUCTION
                    : 3
                }
                onChange={(e) =>
                  handleInputChange(
                    "RETURN_SCORE_DEDUCTION",
                    Number(e.target.value),
                  )
                }
                className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-default text-text-primary font-mono font-bold"
              />
              <span className="absolute left-4 top-3 text-xs text-muted">
                امتیاز منفی
              </span>
            </div>
            <p className="text-[10px] text-muted">
              در صورت ارسال کالای معیوب، اشتباه یا مرجوعی ناشی از تقصیر.
            </p>
          </div>

          {/* Min settlement amount */}
          <div className="space-y-2 lg:col-span-3">
            <label className="text-xs font-bold text-text-primary flex items-center gap-1">
              <Briefcase className="w-4 h-4 text-muted" /> حداقل موجودی مجاز
              برای ارسال درخواست تسویه حساب
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="10000"
                value={config.MIN_PAYOUT_AMOUNT}
                onChange={(e) =>
                  handleInputChange("MIN_PAYOUT_AMOUNT", Number(e.target.value))
                }
                className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-default text-text-primary font-mono font-bold"
              />
              <span className="absolute left-4 top-3 text-xs text-muted">
                ریال ایران
              </span>
            </div>
            <p className="text-[10px] text-muted">
              مبلغ فاکتورهای تایید شده تامین‌کننده در کیف‌پول جهت ثبت درخواست
              واریز نقدی باید حداقل به این مقدار برسد.
            </p>
          </div>
        </div>
      </form>

      {/* 3. DYNAMIC ORDER WORKFLOW ENGINE */}
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-subtle space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-subtle justify-between">
          <div className="flex items-center gap-3">
            <GitCommit className="w-5 h-5 text-primary-default" />
            <div>
              <h3 className="font-bold text-text-primary">
                موتور جریان کاری سفارشات (Dynamic Order Lifecycle)
              </h3>
              <p className="text-[10px] text-muted mt-0.5">
                تعریف مراحل پردازش سفارشات از ثبت اولیه تا تحویل و تسویه فاکتور
              </p>
            </div>
          </div>
          <span className="text-[10px] bg-primary-default/10 text-primary-default px-2 py-1 rounded font-bold">
            بدون نیاز به کدنویسی
          </span>
        </div>

        {/* Workflow steps pipeline visualization */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 pt-2">
          {workflowSteps.map((step: string, index: number) => (
            <div
              key={index}
              className="relative bg-background p-3.5 rounded-xl border border-subtle flex flex-col justify-between group"
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono bg-subtle/50 text-muted w-5 h-5 rounded-full flex items-center justify-center font-bold">
                  {index + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => handleMoveStep(index, "up")}
                    className="text-muted hover:text-primary-default p-0.5 rounded cursor-pointer disabled:opacity-30"
                    title="انتقال به قبلی"
                  >
                    ◄
                  </button>
                  <button
                    type="button"
                    disabled={index === workflowSteps.length - 1}
                    onClick={() => handleMoveStep(index, "down")}
                    className="text-muted hover:text-primary-default p-0.5 rounded cursor-pointer disabled:opacity-30"
                    title="انتقال به بعدی"
                  >
                    ►
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(index)}
                    className="text-muted hover:text-danger p-0.5 rounded cursor-pointer opacity-80 group-hover:opacity-100 transition-opacity"
                    title="حذف گام جریان کاری"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <h5 className="text-xs font-bold text-text-primary mt-3 text-center">
                {step}
              </h5>
              <div className="text-[9px] text-muted mt-1 text-center font-medium">
                مرحله فعال
              </div>
            </div>
          ))}
        </div>

        {/* Add new workflow step */}
        <div className="bg-background/40 p-4 rounded-xl border border-subtle flex flex-col md:flex-row gap-3 items-center">
          <div className="flex-1 space-y-1 w-full">
            <label className="text-[10px] font-bold text-muted block">
              نام گام جدید پردازش سفارش
            </label>
            <input
              type="text"
              placeholder="مثال: ترخیص از گمرک، بازرسی کیفی نهایی و ..."
              value={newStepName}
              onChange={(e) => setNewStepName(e.target.value)}
              className="w-full bg-surface border border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-default text-text-primary"
            />
          </div>
          <button
            type="button"
            onClick={handleAddStep}
            className="w-full md:w-auto px-5 py-2.5 bg-primary-default hover:bg-primary-default text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1 cursor-pointer shrink-0 mt-4 md:mt-0"
          >
            <Plus className="w-4 h-4" /> افزودن گام به خط لوله پردازش
          </button>
        </div>
      </div>

      {/* 4. AUTOMATION & INTELLIGENT RULE BOT (Zapier-style policies) */}
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-subtle space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-subtle">
          <Bot className="w-5 h-5 text-primary-default animate-bounce" />
          <div>
            <h3 className="font-bold text-text-primary">
              قوانین اتوماسیون هوشمند پلتفرم (Automation Center)
            </h3>
            <p className="text-[10px] text-muted mt-0.5">
              اقدامات خودکار ربات هوشمند سیستم بدون نیاز به ناظر دستی
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Rule 1 */}
          <div className="bg-background/30 p-5 rounded-xl border border-subtle flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-text-primary">
                  اتوماسیون جریمه و کسر امتیاز خودکار
                </span>
                <span className="text-[9px] bg-success/10 text-success px-1.5 py-0.5 rounded font-bold">
                  ربات فعال
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed mt-2">
                در صورت فراتر رفتن از زمان ارسال مجاز (مثلاً{" "}
                {config.MAX_DELIVERY_HOURS} ساعت)، ربات به ازای هر روز{" "}
                {config.DAILY_DELAY_PENALTY} امتیاز منفی ثبت و به طور لحظه‌ای به
                تامین‌کننده پیامک ارسال می‌کند.
              </p>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-subtle/40">
              <span className="text-[10px] text-muted">
                وضعیت اجرای زمانبندی: هر ۳ ساعت
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={config.AUTO_PENALIZE_ON_DELAY !== false}
                  onChange={() => toggleConfig("AUTO_PENALIZE_ON_DELAY")}
                />
                <div className="w-9 h-5 bg-subtle/60 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-success"></div>
              </label>
            </div>
          </div>

          {/* Rule 2 */}
          <div className="bg-background/30 p-5 rounded-xl border border-subtle flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-text-primary">
                  اطلاع‌رسانی خودکار و پیش‌اخطار کاهش امتیاز
                </span>
                <span className="text-[9px] bg-success/10 text-success px-1.5 py-0.5 rounded font-bold">
                  ربات فعال
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed mt-2">
                هنگامی که امتیاز عملکرد تامین‌کننده‌ای با کسر متوالی به کمتر از{" "}
                {config.CRITICAL_SUSPENSION_THRESHOLD}٪ برسد، ربات به طور خودکار
                اخطار قرمز در پنل ثبت کرده و در صورت تداوم، دسترسی کاتالوگ وی را
                معلق می‌کند.
              </p>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-subtle/40">
              <span className="text-[10px] text-muted">
                وضعیت اخطارهای سیستمی: ارسال آنی
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={config.AUTO_NOTIFY_ON_WARNING !== false}
                  onChange={() => toggleConfig("AUTO_NOTIFY_ON_WARNING")}
                />
                <div className="w-9 h-5 bg-subtle/60 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:right-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-success"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 5. PAYMENT & SMS INTEGRATION */}
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-subtle space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-subtle">
          <Settings className="w-5 h-5 text-primary-default" />
          <div>
            <h3 className="font-bold text-text-primary">
              تنظیمات درگاه پرداخت و پنل پیامکی
            </h3>
            <p className="text-[10px] text-muted mt-0.5">
              پیکربندی API ها و فعال‌سازی سرویس‌ها
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4 bg-background/30 p-5 rounded-xl border border-subtle">
            <h4 className="text-xs font-bold text-text-primary border-b border-subtle/50 pb-2">
              تنظیمات درگاه پرداخت
            </h4>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted block">
                نوع درگاه
              </label>
              <select
                value={config.PAYMENT_GATEWAY_PROVIDER || "zibal"}
                onChange={(e) =>
                  saveConfig("PAYMENT_GATEWAY_PROVIDER", e.target.value)
                }
                className="w-full bg-surface border border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-default"
              >
                <option value="zibal">زیبال (Zibal)</option>
                <option value="zarinpal">زرین‌پال (ZarinPal)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted block">
                توکن / Merchant ID درگاه
              </label>
              <input
                type="text"
                value={config.PAYMENT_GATEWAY_API_KEY || ""}
                onChange={(e) =>
                  saveConfig("PAYMENT_GATEWAY_API_KEY", e.target.value)
                }
                className="w-full bg-surface border border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-default"
                dir="ltr"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted block">
                شماره شبا (جهت واریز و کارت به کارت عمومی)
              </label>
              <input
                type="text"
                value={config.PAYMENT_CARD_SHABA || ""}
                onChange={(e) =>
                  saveConfig("PAYMENT_CARD_SHABA", e.target.value)
                }
                placeholder="IR..."
                className="w-full bg-surface border border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-default"
                dir="ltr"
              />
            </div>

            <div className="border-t border-subtle/50 my-4 pt-3 space-y-4">
              <h5 className="text-[10px] font-black text-primary-default uppercase tracking-wide">
                اطلاعات کارت به کارت پلتفرم (مدیران فروشگاه)
              </h5>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted block">
                  شماره شبا کارت به کارت پلتفرم
                </label>
                <input
                  type="text"
                  value={config.CARD_TO_CARD_SHABA || ""}
                  onChange={(e) =>
                    saveConfig("CARD_TO_CARD_SHABA", e.target.value)
                  }
                  placeholder="IR..."
                  className="w-full bg-surface border border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-default"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted block">
                  شماره کارت کارت به کارت پلتفرم
                </label>
                <input
                  type="text"
                  value={config.CARD_TO_CARD_CARD || ""}
                  onChange={(e) =>
                    saveConfig("CARD_TO_CARD_CARD", e.target.value)
                  }
                  placeholder="6219-..."
                  className="w-full bg-surface border border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-default"
                  dir="ltr"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted block">
                  نام صاحب حساب بانکی
                </label>
                <input
                  type="text"
                  value={config.CARD_TO_CARD_OWNER || ""}
                  onChange={(e) =>
                    saveConfig("CARD_TO_CARD_OWNER", e.target.value)
                  }
                  placeholder="مثال: مهدی مشرفی"
                  className="w-full bg-surface border border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-default"
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4 bg-background/30 p-5 rounded-xl border border-subtle">
            <h4 className="text-xs font-bold text-text-primary border-b border-subtle/50 pb-2">
              تنظیمات پنل پیامکی
            </h4>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted block">
                کلید API پنل پیامک
              </label>
              <input
                type="text"
                value={config.SMS_API_KEY || ""}
                onChange={(e) => saveConfig("SMS_API_KEY", e.target.value)}
                className="w-full bg-surface border border-subtle rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-default"
                dir="ltr"
              />
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">
                  پیامک سفارش جدید به تامین‌کننده
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={config.SMS_ENABLED_ORDER_NOTIFY === true}
                    onChange={() => toggleConfig("SMS_ENABLED_ORDER_NOTIFY")}
                  />
                  <div className="w-9 h-5 bg-subtle/60 rounded-full peer peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-success"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary">
                  پیامک آپدیت وضعیت سفارش به فروشگاه
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={config.SMS_ENABLED_STORE_NOTIFY === true}
                    onChange={() => toggleConfig("SMS_ENABLED_STORE_NOTIFY")}
                  />
                  <div className="w-9 h-5 bg-subtle/60 rounded-full peer peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-border-default after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-success"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. SUPPORT INFO */}
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-subtle space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-subtle">
          <HelpCircle className="w-5 h-5 text-primary-default" />
          <div>
            <h3 className="font-bold text-text-primary">
              اطلاعات پشتیبانی سایت
            </h3>
            <p className="text-[10px] text-muted mt-0.5">
              این شماره در داشبورد تامین‌کنندگان و مدیران فروشگاه نمایش داده می‌شود
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-muted block">
            شماره تماس پشتیبانی
          </label>
          <input
            type="text"
            value={config.SUPPORT_PHONE || ""}
            onChange={(e) => saveConfig("SUPPORT_PHONE", e.target.value)}
            className="w-full max-w-sm bg-background border border-subtle rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-default"
            placeholder="مثال: 09180088358"
            dir="ltr"
          />
        </div>
      </div>

      {/* 6.5. EDUCATIONAL / TRAINING LINKS */}
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-subtle space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-subtle">
          <GraduationCap className="w-5 h-5 text-primary-default" />
          <div>
            <h3 className="font-bold text-text-primary">
              تنظیمات کانال‌ها و ویدیوهای آموزشی
            </h3>
            <p className="text-[10px] text-muted mt-0.5">
              لینک کانال‌های پلتفرم (آپارات، یوتیوب و کانال اطلاع‌رسانی) جهت نمایش در مرکز آموزش کاربران
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted block">
              لینک کانال آپارات (Aparat)
            </label>
            <input
              type="text"
              value={config.EDUCATION_APARAT || ""}
              onChange={(e) => saveConfig("EDUCATION_APARAT", e.target.value)}
              className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-default"
              placeholder="https://www.aparat.com/yourchannel"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted block">
              لینک کانال یوتیوب (YouTube)
            </label>
            <input
              type="text"
              value={config.EDUCATION_YOUTUBE || ""}
              onChange={(e) => saveConfig("EDUCATION_YOUTUBE", e.target.value)}
              className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-default"
              placeholder="https://www.youtube.com/c/yourchannel"
              dir="ltr"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted block">
              لینک کانال اطلاع‌رسانی تلگرام / پیام‌رسان (Telegram/Social Link)
            </label>
            <input
              type="text"
              value={config.EDUCATION_TELEGRAM || ""}
              onChange={(e) => saveConfig("EDUCATION_TELEGRAM", e.target.value)}
              className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-default"
              placeholder="https://t.me/yourchannel"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* 7. TERMS AND CONDITIONS */}
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-subtle space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-subtle">
          <div className="flex items-center gap-3">
            <Scale className="w-5 h-5 text-primary-default" />
            <div>
              <h3 className="font-bold text-text-primary">
                ویرایش شرایط و قوانین سایت
              </h3>
              <p className="text-[10px] text-muted mt-0.5">
                متن قوانینی که هنگام ثبت‌نام نمایش داده می‌شود
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              saveConfig("STORE_RULES", config.STORE_RULES || "");
              saveConfig("SUPPLIER_RULES", config.SUPPLIER_RULES || "");
            }}
            className="px-5 py-2.5 bg-primary-default hover:bg-primary-hover text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            ثبت و ذخیره قوانین در دیتابیس
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted block mb-2">
              قوانین مدیران فروشگاه (Store Rules)
            </label>
            <textarea
              value={config.STORE_RULES || ""}
              onChange={(e) => setConfig({ ...config, STORE_RULES: e.target.value })}
              onBlur={(e) => saveConfig("STORE_RULES", e.target.value)}
              rows={12}
              className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-default leading-relaxed text-text-primary"
              placeholder="متن کامل قوانین فروشگاه را اینجا وارد کنید..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted block mb-2">
              قوانین تامین‌کنندگان (Supplier Rules)
            </label>
            <textarea
              value={config.SUPPLIER_RULES || config.TERMS_AND_CONDITIONS || ""}
              onChange={(e) => setConfig({ ...config, SUPPLIER_RULES: e.target.value })}
              onBlur={(e) => saveConfig("SUPPLIER_RULES", e.target.value)}
              rows={12}
              className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-default leading-relaxed text-text-primary"
              placeholder="متن کامل قوانین تامین‌کننده را اینجا وارد کنید..."
            />
          </div>
        </div>
      </div>

      {/* 8. CUSTOM CODE & EXTENSIBILITY ENGINE */}
      <div className="bg-surface p-6 rounded-2xl shadow-sm border border-subtle space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-subtle">
          <div className="flex items-center gap-3">
            <Code className="w-5 h-5 text-primary-default" />
            <div>
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                تزریق کدهای سفارشی و قابلیت‌های آینده (Dynamic Code Injection)
                <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full font-black">
                  بدون نیاز به خروجی مجدد
                </span>
              </h3>
              <p className="text-[10px] text-muted mt-0.5">
                افزودن اسکریپت‌های چت آنلاین، آمارگیر (Google Analytics/Raychat/Goftino)، استایل‌های CSS و کدهای JS دلخواه بدون دستکاری سورس‌کد
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              saveConfig("CUSTOM_CODE_HEADER", config.CUSTOM_CODE_HEADER || "");
              saveConfig("CUSTOM_CODE_FOOTER", config.CUSTOM_CODE_FOOTER || "");
              saveConfig("CUSTOM_JS_CODE", config.CUSTOM_JS_CODE || "");
              saveConfig("CUSTOM_CSS_CODE", config.CUSTOM_CSS_CODE || "");
              saveConfig("CUSTOM_CODE_BACKEND", config.CUSTOM_CODE_BACKEND || "");
              toast("کدهای سفارشی با موفقیت در دیتابیس ذخیره و اعمال شدند", "success");
            }}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            ذخیره و اجرای آنی کدها
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-text-primary flex items-center justify-between">
              <span>کدهای هدر سایت (Header Code / Meta / Scripts)</span>
              <span className="text-[9px] text-muted">در داخل &lt;head&gt; قرار می‌گیرد</span>
            </label>
            <textarea
              value={config.CUSTOM_CODE_HEADER || ""}
              onChange={(e) => setConfig({ ...config, CUSTOM_CODE_HEADER: e.target.value })}
              onBlur={(e) => saveConfig("CUSTOM_CODE_HEADER", e.target.value)}
              rows={6}
              dir="ltr"
              className="w-full bg-slate-950 text-emerald-400 font-mono border border-subtle rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-default leading-relaxed"
              placeholder="<!-- اسکریپت‌های چت، Google Analytics یا متاتگ‌ها -->"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-text-primary flex items-center justify-between">
              <span>کدهای فوتر سایت (Footer Code / Widgets)</span>
              <span className="text-[9px] text-muted">در انتهای &lt;body&gt; تزریق می‌شود</span>
            </label>
            <textarea
              value={config.CUSTOM_CODE_FOOTER || ""}
              onChange={(e) => setConfig({ ...config, CUSTOM_CODE_FOOTER: e.target.value })}
              onBlur={(e) => saveConfig("CUSTOM_CODE_FOOTER", e.target.value)}
              rows={6}
              dir="ltr"
              className="w-full bg-slate-950 text-emerald-400 font-mono border border-subtle rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-default leading-relaxed"
              placeholder="<!-- اسکریپت‌های چت آنلاین مانند گفتینو یا رایچت -->"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-text-primary flex items-center justify-between">
              <span>کدهای جاوااسکریپت سفارشی (Custom JS Logic)</span>
              <span className="text-[9px] text-muted">اجرای اتوماتیک در تمام صفحات</span>
            </label>
            <textarea
              value={config.CUSTOM_JS_CODE || ""}
              onChange={(e) => setConfig({ ...config, CUSTOM_JS_CODE: e.target.value })}
              onBlur={(e) => saveConfig("CUSTOM_JS_CODE", e.target.value)}
              rows={6}
              dir="ltr"
              className="w-full bg-slate-950 text-amber-300 font-mono border border-subtle rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-default leading-relaxed"
              placeholder="// console.log('Custom feature initialized');"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-text-primary flex items-center justify-between">
              <span>کدهای استایل سفارشی (Custom CSS)</span>
              <span className="text-[9px] text-muted">تغییر استایل‌ها بدون نیاز به بیلد</span>
            </label>
            <textarea
              value={config.CUSTOM_CSS_CODE || ""}
              onChange={(e) => setConfig({ ...config, CUSTOM_CSS_CODE: e.target.value })}
              onBlur={(e) => saveConfig("CUSTOM_CSS_CODE", e.target.value)}
              rows={6}
              dir="ltr"
              className="w-full bg-slate-950 text-sky-300 font-mono border border-subtle rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary-default leading-relaxed"
              placeholder="/* .my-custom-class { display: block; } */"
            />
          </div>
        </div>

        {/* CUSTOM FILE UPLOADER & ATTACHMENT INJECTOR */}
        <div className="pt-6 border-t border-subtle space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-sm text-text-primary flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-indigo-500" />
                مدیریت و تزریق فایل‌های سفارشی (Custom File Manager)
              </h4>
              <p className="text-[11px] text-muted mt-0.5">
                امکان آپلود اسکریپت‌های JS، فایل‌های CSS، تصاویر، استایل‌ها، چت‌بات‌ها و فونت‌ها بدون نیاز به هاست مجزا
              </p>
            </div>

            <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer shadow-md transition-all self-start sm:self-auto">
              <Upload className="w-4 h-4" />
              <span>افزودن فایل جدید</span>
              <input
                type="file"
                multiple
                accept=".js,.css,.html,.json,.txt,.png,.jpg,.jpeg,.svg,.gif,.woff2"
                className="hidden"
                onChange={(e) => {
                  const files = e.target.files;
                  if (!files || files.length === 0) return;

                  let currentInjectedFiles: any[] = [];
                  try {
                    if (typeof config.CUSTOM_INJECTED_FILES === "string") {
                      currentInjectedFiles = JSON.parse(config.CUSTOM_INJECTED_FILES || "[]");
                    } else if (Array.isArray(config.CUSTOM_INJECTED_FILES)) {
                      currentInjectedFiles = config.CUSTOM_INJECTED_FILES;
                    }
                  } catch {
                    currentInjectedFiles = [];
                  }

                  const fileList = Array.from(files);
                  let count = 0;

                  fileList.forEach((file) => {
                    const reader = new FileReader();
                    const isText =
                      file.name.endsWith(".js") ||
                      file.name.endsWith(".css") ||
                      file.name.endsWith(".html") ||
                      file.name.endsWith(".json") ||
                      file.name.endsWith(".txt");

                    reader.onload = (evt) => {
                      const content = evt.target?.result as string;
                      const fileObj = {
                        id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
                        name: file.name,
                        type: file.name.split(".").pop()?.toLowerCase() || "file",
                        size: (file.size / 1024).toFixed(1) + " KB",
                        data: content,
                        isText,
                        uploadedAt: new Date().toLocaleDateString("fa-IR"),
                        autoInject: true,
                      };

                      currentInjectedFiles.push(fileObj);
                      count++;

                      if (count === fileList.length) {
                        const jsonStr = JSON.stringify(currentInjectedFiles);
                        setConfig((prev: any) => ({ ...prev, CUSTOM_INJECTED_FILES: jsonStr }));
                        saveConfig("CUSTOM_INJECTED_FILES", jsonStr);
                        toast(`${fileList.length} فایل با موفقیت آپلود و آماده تزریق شد`, "success");
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

          {/* LIST OF UPLOADED FILES */}
          {(() => {
            let filesList: any[] = [];
            try {
              if (typeof config.CUSTOM_INJECTED_FILES === "string") {
                filesList = JSON.parse(config.CUSTOM_INJECTED_FILES || "[]");
              } else if (Array.isArray(config.CUSTOM_INJECTED_FILES)) {
                filesList = config.CUSTOM_INJECTED_FILES;
              }
            } catch {
              filesList = [];
            }

            if (filesList.length === 0) {
              return (
                <div className="border border-dashed border-subtle rounded-2xl p-8 text-center bg-background/50 space-y-2">
                  <Upload className="w-8 h-8 text-muted mx-auto" />
                  <p className="text-xs font-bold text-text-secondary">هیچ فایل سفارشی هنوز آپلود نشده است.</p>
                  <p className="text-[10px] text-muted">
                    می‌توانید فایل‌های JS، CSS، تصاویر یا کدهای خود را آپلود کرده و مستقیم به هدر یا فوتر تزریق کنید.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {filesList.map((fileObj: any, index: number) => {
                  const isJs = fileObj.type === "js";
                  const isCss = fileObj.type === "css";
                  const isImg = ["png", "jpg", "jpeg", "svg", "gif", "webp"].includes(fileObj.type);

                  return (
                    <div
                      key={fileObj.id || index}
                      className="bg-background border border-subtle rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 font-mono text-xs font-black uppercase">
                          {fileObj.type}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <p className="text-xs font-bold text-text-primary truncate dir-ltr text-right">{fileObj.name}</p>
                          <div className="flex items-center gap-2 text-[10px] text-muted">
                            <span>حجم: {fileObj.size}</span>
                            <span>•</span>
                            <span>تاریخ: {fileObj.uploadedAt}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 self-end md:self-auto">
                        {/* Inject to Header */}
                        <button
                          type="button"
                          onClick={() => {
                            let tag = "";
                            if (fileObj.isText && isJs) {
                              tag = `\n<!-- Injected script: ${fileObj.name} -->\n<script>\n${fileObj.data}\n</script>\n`;
                            } else if (fileObj.isText && isCss) {
                              tag = `\n<!-- Injected style: ${fileObj.name} -->\n<style>\n${fileObj.data}\n</style>\n`;
                            } else if (fileObj.isText) {
                              tag = `\n${fileObj.data}\n`;
                            } else {
                              tag = `\n<script src="${fileObj.data}"></script>\n`;
                            }

                            const updatedHeader = (config.CUSTOM_CODE_HEADER || "") + tag;
                            setConfig((prev: any) => ({ ...prev, CUSTOM_CODE_HEADER: updatedHeader }));
                            saveConfig("CUSTOM_CODE_HEADER", updatedHeader);
                            toast(`فایل ${fileObj.name} به کدهای هدر اضافه شد`, "success");
                          }}
                          className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                          title="افزودن به هدر"
                        >
                          <Sparkles className="w-3 h-3" />
                          تزریق به Header
                        </button>

                        {/* Inject to Footer */}
                        <button
                          type="button"
                          onClick={() => {
                            let tag = "";
                            if (fileObj.isText && isJs) {
                              tag = `\n<!-- Injected footer script: ${fileObj.name} -->\n<script>\n${fileObj.data}\n</script>\n`;
                            } else if (fileObj.isText && isCss) {
                              tag = `\n<!-- Injected footer style: ${fileObj.name} -->\n<style>\n${fileObj.data}\n</style>\n`;
                            } else if (fileObj.isText) {
                              tag = `\n${fileObj.data}\n`;
                            } else {
                              tag = `\n<script src="${fileObj.data}"></script>\n`;
                            }

                            const updatedFooter = (config.CUSTOM_CODE_FOOTER || "") + tag;
                            setConfig((prev: any) => ({ ...prev, CUSTOM_CODE_FOOTER: updatedFooter }));
                            saveConfig("CUSTOM_CODE_FOOTER", updatedFooter);
                            toast(`فایل ${fileObj.name} به کدهای فوتر اضافه شد`, "success");
                          }}
                          className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                          title="افزودن به فوتر"
                        >
                          <Sparkles className="w-3 h-3" />
                          تزریق به Footer
                        </button>

                        {/* Copy Snippet */}
                        <button
                          type="button"
                          onClick={() => {
                            let tag = "";
                            if (fileObj.isText && isJs) {
                              tag = `<script>\n${fileObj.data}\n</script>`;
                            } else if (fileObj.isText && isCss) {
                              tag = `<style>\n${fileObj.data}\n</style>`;
                            } else if (isImg) {
                              tag = `<img referrerPolicy="no-referrer" src="${fileObj.data}" alt="${fileObj.name}" />`;
                            } else {
                              tag = fileObj.data;
                            }
                            navigator.clipboard.writeText(tag);
                            toast("کد Snippet در حافظه کپی شد", "success");
                          }}
                          className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                          title="کپی Snippet"
                        >
                          <Copy className="w-3 h-3" />
                          کپی کد
                        </button>

                        {/* Delete File */}
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = filesList.filter((f) => f.id !== fileObj.id);
                            const jsonStr = JSON.stringify(filtered);
                            setConfig((prev: any) => ({ ...prev, CUSTOM_INJECTED_FILES: jsonStr }));
                            saveConfig("CUSTOM_INJECTED_FILES", jsonStr);
                            toast(`فایل ${fileObj.name} حذف شد`, "success");
                          }}
                          className="p-1.5 hover:bg-rose-500/20 text-rose-500 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                          title="حذف فایل"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

      {/* 9. PAYMENT & SMS SETTINGS MODULE */}
      <PaymentSmsSettings />
    </div>
  );
}
