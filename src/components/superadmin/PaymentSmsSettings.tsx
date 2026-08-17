import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Key,
  Database,
  Bell,
  Check,
  Save,
  Phone,
  ShieldAlert,
  Send,
  Sparkles,
  Smartphone,
  Printer,
  FileCheck,
  MessageSquare,
  Activity,
  ExternalLink,
  Zap,
} from "lucide-react";

export default function PaymentSmsSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // States for Settings
  const [gatewayType, setGatewayType] = useState("ZIBAL");
  const [merchantCode, setMerchantCode] = useState("");
  const [gatewayKey, setGatewayKey] = useState("");
  const [enableCardToCard, setEnableCardToCard] = useState(false);
  const [shabaNumber, setShabaNumber] = useState("330560611828006022464501");
  const [cardNumber, setCardNumber] = useState("6219-8618-1832-7263");
  const [accountOwner, setAccountOwner] = useState("مهدی مشرفی");
  const [smsProvider, setSmsProvider] = useState("MELIPAYAMAK");
  const [smsApiKey, setSmsApiKey] = useState("");
  const [melliUsername, setMelliUsername] = useState("");
  const [melliPassword, setMelliPassword] = useState("");
  const [melliFromNumber, setMelliFromNumber] = useState("50001");
  const [melliPatternId, setMelliPatternId] = useState("");
  const [melliPatternOtp, setMelliPatternOtp] = useState("");
  const [melliPatternSupplierCommit, setMelliPatternSupplierCommit] = useState("");
  const [melliPatternLabelIssued, setMelliPatternLabelIssued] = useState("");
  const [melliPatternAnnouncement, setMelliPatternAnnouncement] = useState("");

  // Primary Requested SMS Triggers
  const [smsNotifyUserLogin, setSmsNotifyUserLogin] = useState(true);
  const [smsNotifySupplierCommitment, setSmsNotifySupplierCommitment] = useState(true);
  const [smsNotifyLabelPrint, setSmsNotifyLabelPrint] = useState(true);
  const [supplierReminderHours, setSupplierReminderHours] = useState(6);
  const [customSmsPatterns, setCustomSmsPatterns] = useState<any[]>([]);

  // Additional SMS Notification Checkboxes
  const [smsOnOrderSubmit, setSmsOnOrderSubmit] = useState(true);
  const [smsOnOrderPaid, setSmsOnOrderPaid] = useState(true);
  const [smsOnSupplierVerify, setSmsOnSupplierVerify] = useState(true);
  const [smsOnPayoutSettle, setSmsOnPayoutSettle] = useState(true);
  const [smsOnTicketReply, setSmsOnTicketReply] = useState(true);

  // Gateway Test State
  const [testingGateway, setTestingGateway] = useState(false);
  const [gatewayTestResult, setGatewayTestResult] = useState<{
    active?: boolean;
    message?: string;
    resultCode?: number;
  } | null>(null);
  const [creatingTestInvoice, setCreatingTestInvoice] = useState(false);
  const [testInvoiceResult, setTestInvoiceResult] = useState<{
    success?: boolean;
    trackId?: string;
    payLink?: string;
    message?: string;
    error?: string;
  } | null>(null);

  // SMS Test State
  const [testPhone, setTestPhone] = useState("09180088358");
  const [testSmsMode, setTestSmsMode] = useState<"pattern" | "text">("pattern");
  const [testPatternType, setTestPatternType] = useState<"otp" | "supplier" | "label" | "announcement" | "custom">("otp");
  const [testCustomBodyId, setTestCustomBodyId] = useState("");
  const [testOtpCode, setTestOtpCode] = useState("12345");
  const [testMessage, setTestMessage] = useState("این یک پیامک آزمایشی جهت بررسی اتصال درگاه پیامکی زوپیت است.");
  const [testingSms, setTestingSms] = useState(false);
  const [smsTestResult, setSmsTestResult] = useState<any>(null);

  const handleTestGateway = async () => {
    setTestingGateway(true);
    setGatewayTestResult(null);
    setTestInvoiceResult(null);
    try {
      const res = await fetch("/api/admin/payment-gateway/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ merchantCode, gatewayType, gatewayKey }),
      });
      const data = await res.json();
      setGatewayTestResult(data);
      if (data.active) {
        toast(data.message || "درگاه پرداخت کاملاً فعال و معتبر است.", "success");
      } else {
        toast(`هشدار درگاه: ${data.message}`, "error");
      }
    } catch {
      toast("خطا در برقراری ارتباط با سرور", "error");
    } finally {
      setTestingGateway(false);
    }
  };

  const handleCreateTestInvoice = async () => {
    if (!merchantCode) {
      toast("لطفاً ابتدا کد مرچنت را وارد فرمایید", "error");
      return;
    }
    setCreatingTestInvoice(true);
    setTestInvoiceResult(null);
    setGatewayTestResult(null);
    try {
      const res = await fetch("/api/admin/payment-gateway/create-test-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ merchantCode }),
      });
      const data = await res.json();
      setTestInvoiceResult(data);
      if (data.success && data.payLink) {
        toast("فاکتور تست با موفقیت در زیبال ایجاد شد؛ در حال هدایت به درگاه پرداخت...", "success");
        const opened = window.open(data.payLink, "_blank");
        if (!opened) {
          toast("پاپ‌آپ توسط مرورگر مسدود شد؛ لطفاً از دکمه سبز رنگ پایین صفحه وارد درگاه شوید.", "info");
        }
      } else {
        toast(data.error || "خطا در ایجاد فاکتور تست زیبال", "error");
      }
    } catch {
      toast("خطا در برقراری ارتباط با سرور", "error");
    } finally {
      setCreatingTestInvoice(false);
    }
  };

  const handleSendTestSms = async () => {
    if (!testPhone) {
      toast("لطفاً شماره موبایل مقصد را وارد کنید", "error");
      return;
    }
    setTestingSms(true);
    setSmsTestResult(null);
    try {
      const payload: any = {
        mobile: testPhone,
      };

      if (testSmsMode === "pattern") {
        if (testPatternType === "otp") {
          payload.patternKey = "MELLIPAYAMAK_PATTERN_OTP";
          payload.patternCode = melliPatternOtp;
          payload.patternValues = [testOtpCode || "12345"];
        } else if (testPatternType === "supplier") {
          payload.patternKey = "MELLIPAYAMAK_PATTERN_SUPPLIER_COMMIT";
          payload.patternCode = melliPatternSupplierCommit;
          payload.patternValues = [testOtpCode || "1001"];
        } else if (testPatternType === "label") {
          payload.patternKey = "MELLIPAYAMAK_PATTERN_LABEL_ISSUED";
          payload.patternCode = melliPatternLabelIssued;
          payload.patternValues = [testOtpCode || "1001", "2420000111"];
        } else if (testPatternType === "announcement") {
          payload.patternKey = "MELLIPAYAMAK_PATTERN_ANNOUNCEMENT";
          payload.patternCode = melliPatternAnnouncement;
          payload.patternValues = [testOtpCode || "اطلاعیه مهم جدید سیستم"];
        } else if (testPatternType === "custom") {
          if (!testCustomBodyId) {
            toast("لطفاً کد پترن سفارشی (Body ID) را وارد فرمایید", "error");
            setTestingSms(false);
            return;
          }
          payload.patternKey = testCustomBodyId;
          payload.patternCode = testCustomBodyId;
          payload.patternValues = [testOtpCode || "تست"];
        }

        if (testPatternType !== "custom" && !payload.patternCode) {
          toast(`کد پترن برای ${testPatternType.toUpperCase()} وارد نشده است. لطفاً کد الگوی مربوطه را در کارت فوق وارد فرمایید.`, "error");
          setSmsTestResult({
            success: false,
            error: `شناسه پترن (Body ID) برای رویداد انتخاب‌شده در فرم تنظیمات سیستم وارد نشده است. لطفاً کد پترن را در فیلدهای بالا وارد نموده یا ذخیره کنید.`
          });
          setTestingSms(false);
          return;
        }
      } else {
        payload.message = testMessage;
      }

      const res = await fetch("/api/admin/sms/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setSmsTestResult(data);
      if (data.success) {
        toast("درخواست تست پیامک با موفقیت پردازش شد.", "success");
      } else {
        toast(data.error || data.message || "خطا در ارسال پیامک آزمایشی", "error");
      }
    } catch {
      toast("خطا در برقراری ارتباط با سرور پیامک", "error");
    } finally {
      setTestingSms(false);
    }
  };

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          if (data.PAYMENT_GATEWAY_TYPE) setGatewayType(data.PAYMENT_GATEWAY_TYPE);
          if (data.PAYMENT_GATEWAY_MERCHANT_CODE) {
            setMerchantCode(String(data.PAYMENT_GATEWAY_MERCHANT_CODE).trim());
          }
          if (data.PAYMENT_GATEWAY_KEY) setGatewayKey(data.PAYMENT_GATEWAY_KEY);
          if (data.CARD_TO_CARD_SHABA) setShabaNumber(data.CARD_TO_CARD_SHABA);
          if (data.CARD_TO_CARD_CARD) setCardNumber(data.CARD_TO_CARD_CARD);
          if (data.CARD_TO_CARD_OWNER) setAccountOwner(data.CARD_TO_CARD_OWNER);
          if (data.ENABLE_CARD_TO_CARD !== undefined) {
            setEnableCardToCard(data.ENABLE_CARD_TO_CARD === "true" || data.ENABLE_CARD_TO_CARD === true);
          } else {
            setEnableCardToCard(false); // Off by default as requested
          }
          if (data.SMS_PANEL_PROVIDER) setSmsProvider(data.SMS_PANEL_PROVIDER);
          if (data.SMS_PANEL_API_KEY) setSmsApiKey(data.SMS_PANEL_API_KEY);
          if (data.MELLIPAYAMAK_USERNAME) setMelliUsername(data.MELLIPAYAMAK_USERNAME);
          if (data.MELLIPAYAMAK_PASSWORD) setMelliPassword(data.MELLIPAYAMAK_PASSWORD);
          if (data.MELLIPAYAMAK_FROM_NUMBER) setMelliFromNumber(data.MELLIPAYAMAK_FROM_NUMBER);
          if (data.MELLIPAYAMAK_PATTERN_ID) setMelliPatternId(data.MELLIPAYAMAK_PATTERN_ID);
          if (data.MELLIPAYAMAK_PATTERN_OTP) setMelliPatternOtp(data.MELLIPAYAMAK_PATTERN_OTP);
          if (data.MELLIPAYAMAK_PATTERN_SUPPLIER_COMMIT) setMelliPatternSupplierCommit(data.MELLIPAYAMAK_PATTERN_SUPPLIER_COMMIT);
          if (data.MELLIPAYAMAK_PATTERN_LABEL_ISSUED) setMelliPatternLabelIssued(data.MELLIPAYAMAK_PATTERN_LABEL_ISSUED);
          if (data.MELLIPAYAMAK_PATTERN_ANNOUNCEMENT) setMelliPatternAnnouncement(data.MELLIPAYAMAK_PATTERN_ANNOUNCEMENT);

          // Primary Requested Toggles
          setSmsNotifyUserLogin(data.SMS_NOTIFY_USER_LOGIN !== "false" && data.SMS_NOTIFY_USER_LOGIN !== false);
          setSmsNotifySupplierCommitment(data.SMS_NOTIFY_SUPPLIER_COMMITMENT !== "false" && data.SMS_NOTIFY_SUPPLIER_COMMITMENT !== false);
          setSmsNotifyLabelPrint(data.SMS_NOTIFY_LABEL_PRINT !== "false" && data.SMS_NOTIFY_LABEL_PRINT !== false);
          if (data.SUPPLIER_REMINDER_HOURS) setSupplierReminderHours(Number(data.SUPPLIER_REMINDER_HOURS) || 6);
          if (data.MELLIPAYAMAK_CUSTOM_PATTERNS) { try { setCustomSmsPatterns(JSON.parse(data.MELLIPAYAMAK_CUSTOM_PATTERNS)); } catch (e) {} }

          // General SMS Booleans
          setSmsOnOrderSubmit(data.SMS_NOTIFY_ON_ORDER_SUBMIT !== "false" && data.SMS_NOTIFY_ON_ORDER_SUBMIT !== false);
          setSmsOnOrderPaid(data.SMS_NOTIFY_ON_ORDER_PAYMENT !== "false" && data.SMS_NOTIFY_ON_ORDER_PAYMENT !== false);
          setSmsOnSupplierVerify(data.SMS_NOTIFY_ON_SUPPLIER_VERIFY !== "false" && data.SMS_NOTIFY_ON_SUPPLIER_VERIFY !== false);
          setSmsOnPayoutSettle(data.SMS_NOTIFY_ON_PAYOUT_SETTLE !== "false" && data.SMS_NOTIFY_ON_PAYOUT_SETTLE !== false);
          setSmsOnTicketReply(data.SMS_NOTIFY_ON_TICKET_REPLY !== "false" && data.SMS_NOTIFY_ON_TICKET_REPLY !== false);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching payment/SMS config:", err);
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);

    const settingsObj: Record<string, string> = {
      PAYMENT_GATEWAY_TYPE: gatewayType,
      PAYMENT_GATEWAY_MERCHANT_CODE: merchantCode,
      PAYMENT_GATEWAY_KEY: gatewayKey,
      ENABLE_CARD_TO_CARD: String(enableCardToCard),
      CARD_TO_CARD_SHABA: shabaNumber,
      CARD_TO_CARD_CARD: cardNumber,
      CARD_TO_CARD_OWNER: accountOwner,
      SMS_PANEL_PROVIDER: smsProvider,
      SMS_PANEL_API_KEY: smsApiKey,
      MELLIPAYAMAK_USERNAME: melliUsername,
      MELLIPAYAMAK_PASSWORD: melliPassword,
      MELLIPAYAMAK_FROM_NUMBER: melliFromNumber,
      MELLIPAYAMAK_PATTERN_ID: melliPatternId,
      MELLIPAYAMAK_PATTERN_OTP: melliPatternOtp,
      MELLIPAYAMAK_PATTERN_SUPPLIER_COMMIT: melliPatternSupplierCommit,
      MELLIPAYAMAK_PATTERN_LABEL_ISSUED: melliPatternLabelIssued,
      MELLIPAYAMAK_PATTERN_ANNOUNCEMENT: melliPatternAnnouncement,
      SMS_NOTIFY_USER_LOGIN: String(smsNotifyUserLogin),
      SMS_NOTIFY_SUPPLIER_COMMITMENT: String(smsNotifySupplierCommitment),
      SMS_NOTIFY_LABEL_PRINT: String(smsNotifyLabelPrint),
      SUPPLIER_REMINDER_HOURS: String(supplierReminderHours),
      MELLIPAYAMAK_CUSTOM_PATTERNS: JSON.stringify(customSmsPatterns),
      SMS_NOTIFY_ON_ORDER_SUBMIT: String(smsOnOrderSubmit),
      SMS_NOTIFY_ON_ORDER_PAYMENT: String(smsOnOrderPaid),
      SMS_NOTIFY_ON_SUPPLIER_VERIFY: String(smsOnSupplierVerify),
      SMS_NOTIFY_ON_PAYOUT_SETTLE: String(smsOnPayoutSettle),
      SMS_NOTIFY_ON_TICKET_REPLY: String(smsOnTicketReply),
    };

    try {
      const res = await fetch("/api/config", {
        credentials: "include",
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: settingsObj }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      setSuccessMsg("تنظیمات درگاه پرداخت و پنل پیامکی با موفقیت ذخیره و در سراسر سامانه اعمال شد.");
      setTimeout(() => setSuccessMsg(null), 5000);
      toast("تنظیمات با موفقیت ذخیره شدند", "success");
    } catch (err) {
      console.error(err);
      toast("خطا در ذخیره‌سازی تنظیمات.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-default mr-2"></div>
        در حال بارگذاری تنظیمات پرداخت و پیامکی سیستم...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-border shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-text-primary">تنظیمات درگاه پرداخت و وب‌سرویس پیامکی</h2>
            <p className="text-xs text-text-muted mt-1">مدیریت درگاه آنلاین زیبال، زرین‌پال، کارت به کارت، اعتبار ملی‌پیامک و رویدادهای نوتیفیکیشن پیامک</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-primary-default hover:bg-primary-hover text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 rounded-xl flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-xs font-bold animate-fadeIn">
          <Check className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Top 2 Cards: Gateway & Shaba/SMS Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Online Payment Gateway */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-6 flex flex-col justify-between">
            <div className="space-y-5">
              <div className="flex items-center gap-2.5 pb-3.5 border-b border-border">
                <Database className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-text-primary">پیکربندی درگاه پرداخت آنلاین</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">نوع درگاه پرداخت پیش‌فرض</label>
                <select
                  value={gatewayType}
                  onChange={(e) => setGatewayType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-card border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-default"
                >
                  <option value="ZIBAL">درگاه زیبال (Zibal) - پیشنهادی</option>
                  <option value="SEP">درگاه پرداخت الکترونیک سامان (سپ - SEP)</option>
                  <option value="ZARINPAL">درگاه زرین‌پال (ZarinPal)</option>
                  <option value="MELLAT">به پرداخت ملت</option>
                  <option value="IDPAY">آیدی پی (IDPay)</option>
                  <option value="OFFLINE">فقط کارت به کارت و پرداخت آفلاین</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                  {gatewayType === 'SEP' ? 'شماره ترمینال سامان (Terminal ID)' : 'کد مرچنت / پذیرنده درگاه (Merchant ID)'}
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    type="text"
                    value={merchantCode}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setMerchantCode(val);
                      if (val.length === 24 && !val.includes('-') && gatewayType === 'ZARINPAL') {
                        setGatewayType('ZIBAL');
                      }
                    }}
                    placeholder="کد مرچنت درگاه (مثال: zibal یا کد ترمینال سپ)"
                    className="flex-1 px-3.5 py-2.5 bg-card border border-border rounded-xl text-xs text-text-primary font-mono text-left focus:outline-none focus:ring-2 focus:ring-primary-default min-w-[220px]"
                  />
                  <button
                    type="button"
                    onClick={handleTestGateway}
                    disabled={testingGateway || !merchantCode}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl border border-indigo-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-md disabled:opacity-50 whitespace-nowrap"
                  >
                    <Activity className={`w-3.5 h-3.5 ${testingGateway ? 'animate-spin' : ''}`} />
                    {testingGateway ? "در حال بررسی..." : "تست اتصال زنده"}
                  </button>
                  <a
                    href="/api/payment/test"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl border border-emerald-700 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:shadow-md whitespace-nowrap"
                    title="تولید خودکار فاکتور و ورود فوری به صفحه رسمی درگاه زیبال شاپرک"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    ورود مستقیم به درگاه شاپرک
                  </a>
                </div>
                
                <span className="text-[11px] text-emerald-600 font-bold block mt-1.5">
                  ✓ برای درگاه زیبال، تنها وارد کردن «کد مرچنت» کافی است و پرداخت‌ها مستقیماً از طریق زیبال انجام خواهند شد.
                </span>

                {/* Important Notice regarding IP in Zibal */}
                <div className="mt-2 p-2.5 bg-blue-50/70 border border-blue-200 dark:bg-blue-950/30 dark:border-blue-900 rounded-xl text-[11px] text-blue-900 dark:text-blue-200 leading-relaxed">
                  <span className="font-bold">نکته بسیار مهم برای آی‌پی (IP) در پنل زیبال:</span> در پنل کاربری زیبال (بخش ویرایش درگاه)، IP هاست پروکسی شما یعنی <strong className="font-mono bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded text-blue-950 dark:text-blue-100 select-all">88.135.68.18</strong> را در بخش «آدرس IP مجاز سرور» ثبت کنید (یا محدودیت IP را در تیکت زیبال بردارید).
                </div>

                {gatewayTestResult && (
                  <div
                    className={`mt-2.5 p-3 rounded-xl border text-xs flex items-center gap-2 ${
                      gatewayTestResult.active
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200 font-medium"
                        : "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-200 font-medium"
                    }`}
                  >
                    <div>
                      <p className="font-bold">{gatewayTestResult.message}</p>
                      {gatewayTestResult.resultCode !== undefined && (
                        <p className="text-[10px] opacity-80 mt-0.5 dir-ltr font-mono">
                          Zibal Result Code: {gatewayTestResult.resultCode}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {testInvoiceResult && (
                  <div
                    className={`mt-2.5 p-3 rounded-xl border text-xs ${
                      testInvoiceResult.success
                        ? "bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-800 dark:text-emerald-100"
                        : "bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/50 dark:border-rose-800 dark:text-rose-100"
                    }`}
                  >
                    <p className="font-bold mb-1.5">{testInvoiceResult.message || testInvoiceResult.error}</p>
                    {testInvoiceResult.payLink && (
                      <div className="mt-2 pt-2 border-t border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-200">
                          شماره تراکنش پیگیری: <strong className="font-mono">{testInvoiceResult.trackId}</strong>
                        </span>
                        <a
                          href={testInvoiceResult.payLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-xs border border-emerald-700 hover:shadow-md"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          ورود مستقیم به درگاه شاپرک
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">کلید اختصاصی درگاه (Gateway Private Key - اختیاری)</label>
                <div className="relative">
                  <input
                    type="password"
                    value={gatewayKey}
                    onChange={(e) => setGatewayKey(e.target.value)}
                    placeholder="در صورت استفاده از زیبال، نیازی نیست و می‌توانید خالی بگذارید"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-card border border-border rounded-xl text-xs text-text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary-default"
                  />
                  <Key className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
                </div>
                <span className="text-[11px] text-text-muted leading-relaxed block mt-1.5">
                  برای زیبال فقط کد مرچنت بالا استفاده می‌شود. این فیلد برای سایر درگاه‌های خاص به صورت اختیاری تعبیه شده است.
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Shaba Card-to-Card & SMS Provider */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3.5 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">روش دوم: پرداخت کارت به کارت / واریز بانکی</h3>
                    <p className="text-[11px] text-text-muted mt-0.5">امکان فعال/غیرفعال‌سازی روش پرداخت دستی برای فروشگاه‌ها</p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enableCardToCard}
                    onChange={(e) => setEnableCardToCard(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  <span className={`ms-2 text-xs font-bold ${enableCardToCard ? "text-purple-600 dark:text-purple-400" : "text-text-muted"}`}>
                    {enableCardToCard ? "فعال" : "غیرفعال"}
                  </span>
                </label>
              </div>

              {!enableCardToCard && (
                <div className="p-3 bg-slate-500/10 border border-slate-500/20 rounded-xl text-xs text-text-muted leading-relaxed flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0"></span>
                  روش کارت به کارت در حال حاضر <strong>غیرفعال</strong> است و در صفحه تسویه سفارشات فروشگاه فقط درگاه آنلاین نمایش داده می‌شود.
                </div>
              )}

              <div className={`space-y-3.5 transition-opacity ${enableCardToCard ? "opacity-100" : "opacity-60"}`}>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">شماره شبا بابت کارت به کارت پلتفرم</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={shabaNumber}
                      onChange={(e) => setShabaNumber(e.target.value)}
                      placeholder="IR000000000000000000000000"
                      className="w-full pl-12 pr-3.5 py-2.5 bg-card border border-border rounded-xl text-xs text-text-primary font-mono text-left focus:outline-none focus:ring-2 focus:ring-primary-default"
                    />
                    <span className="text-text-muted absolute left-3.5 top-2.5 font-bold text-xs select-none">IR</span>
                  </div>
                  <span className="text-[11px] text-text-muted leading-relaxed block mt-1">
                    شماره شبا رسمی مدیریت سیستم جهت انتقال کارت به کارت فیش‌های صادر شده توسط فروشگاه‌ها.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">شماره کارت بابت کارت به کارت پلتفرم</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="6219-8618-1832-7263"
                    className="w-full px-3.5 py-2.5 bg-card border border-border rounded-xl text-xs text-text-primary font-mono text-left focus:outline-none focus:ring-2 focus:ring-primary-default"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">نام صاحب حساب بانکی</label>
                  <input
                    type="text"
                    value={accountOwner}
                    onChange={(e) => setAccountOwner(e.target.value)}
                    placeholder="مثال: مهدی مشرفی"
                    className="w-full px-3.5 py-2.5 bg-card border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-default text-right"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Card 3: SMS Provider Settings */}
          <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5 pb-3.5 border-b border-border">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
                <div>
                  <h3 className="text-sm font-bold text-text-primary">پنل پیامک (SMS)</h3>
                  <p className="text-[11px] text-text-muted mt-0.5">تنظیمات درگاه پیامکی و وب‌سرویس</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">پنل پیامک انتخابی</label>
                  <select
                    value={smsProvider}
                    onChange={(e) => setSmsProvider(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-card border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-default"
                  >
                    <option value="MELIPAYAMAK">ملی پیامک (MeliPayamak)</option>
                    <option value="FARAZSMS">فراز اس‌ام‌اس (FarazSMS)</option>
                    <option value="KAVENEGAR">کاوه نگار (Kavenegar)</option>
                  </select>
                </div>

                {smsProvider === "MELIPAYAMAK" ? (
                  <div className="p-4 bg-surface rounded-xl border border-border space-y-3">
                    <span className="text-xs font-bold text-text-primary block">تنظیمات وب‌سرویس ملی پیامک (Melli Payamak):</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-text-secondary mb-1">نام کاربری ملی پیامک</label>
                        <input
                          type="text"
                          value={melliUsername}
                          onChange={(e) => setMelliUsername(e.target.value)}
                          placeholder="مثال: 09123456789"
                          className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs font-mono text-left focus:ring-2 focus:ring-primary-default outline-none text-text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-text-secondary mb-1">کلمه عبور / رمز پنل</label>
                        <input
                          type="password"
                          value={melliPassword}
                          onChange={(e) => setMelliPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs font-mono text-left focus:ring-2 focus:ring-primary-default outline-none text-text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-text-secondary mb-1">شماره خط ارسال (From)</label>
                        <input
                          type="text"
                          value={melliFromNumber}
                          onChange={(e) => setMelliFromNumber(e.target.value)}
                          placeholder="50001..."
                          className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs font-mono text-left focus:ring-2 focus:ring-primary-default outline-none text-text-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-text-secondary mb-1">شناسه پترن پیش‌فرض</label>
                        <input
                          type="text"
                          value={melliPatternId}
                          onChange={(e) => setMelliPatternId(e.target.value)}
                          placeholder="کد پترن پیش‌فرض"
                          className="w-full px-3 py-2 bg-card border border-border rounded-lg text-xs font-mono text-left focus:ring-2 focus:ring-primary-default outline-none text-text-primary"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">کلید وب‌سرویس پیامک (API Key)</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={smsApiKey}
                        onChange={(e) => setSmsApiKey(e.target.value)}
                        placeholder="API Key / Token"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-card border border-border rounded-xl text-xs text-text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary-default"
                      />
                      <Phone className="w-4 h-4 text-text-muted absolute left-3.5 top-3.5" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Specific Core SMS Triggers */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">رویدادهای کلیدی پیامک زوپیت (ورود کاربران، تعهد تامین‌کننده، چاپ لیبل)</h3>
                <p className="text-xs text-text-muted mt-0.5">کنترل دقیق فعال‌سازی و کد پترن پیامکی اختصاصی برای ۳ رویداد اصلی و حیاتی سیستم</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 text-[11px] font-bold rounded-full border border-purple-200 dark:border-purple-800">
              رویدادهای اصلی
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Trigger 1: User Login & OTP */}
            <div
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                smsNotifyUserLogin
                  ? "border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20 dark:border-emerald-800"
                  : "border-border bg-surface/40 opacity-75"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300 rounded-lg">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smsNotifyUserLogin}
                      onChange={(e) => setSmsNotifyUserLogin(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">۱. ورود کاربران و کد تایید پیامکی (OTP)</h4>
                  <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                    ارسال کد ورود یکبار مصرف پیامکی در صورت فراموشی رمز عبور یا ورود مستقیم با شماره همراه به کاربران، فروشگاه‌ها و تامین‌کنندگان.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border space-y-1">
                <label className="block text-[10px] font-semibold text-text-muted">کد پترن اختصاصی OTP (اختیاری):</label>
                <input
                  type="text"
                  value={melliPatternOtp}
                  onChange={(e) => setMelliPatternOtp(e.target.value)}
                  placeholder="مثال: 12345 (کد الگو ورود/رمز)"
                  className="w-full px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-mono text-left outline-none focus:ring-1 focus:ring-primary-default text-text-primary"
                />
              </div>
            </div>

            {/* Trigger 2: Supplier Commitment */}
            <div
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                smsNotifySupplierCommitment
                  ? "border-blue-300 bg-blue-50/40 dark:bg-blue-950/20 dark:border-blue-800"
                  : "border-border bg-surface/40 opacity-75"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded-lg">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smsNotifySupplierCommitment}
                      onChange={(e) => setSmsNotifySupplierCommitment(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">۲. تأیید و تعهد تأمین‌کنندگان برای سفارشات</h4>
                  <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                    ارسال پیامک تایید سفارش و تعهد تامین کالا به مدیر فروشگاه و ارسال تاییدیه تعهد به تامین‌کننده پس از پذیرش سفارش.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border space-y-1">
                <div>
                  <label className="block text-[10px] font-semibold text-text-muted mb-1">کد پترن تعهد تامین‌کننده (اختیاری):</label>
                  <input
                    type="text"
                    value={melliPatternSupplierCommit}
                    onChange={(e) => setMelliPatternSupplierCommit(e.target.value)}
                    placeholder="مثال: 67890 (کد الگو تعهد)"
                    className="w-full px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-mono text-left outline-none focus:ring-1 focus:ring-primary-default text-text-primary"
                  />
                </div>
                <div className="pt-2">
                  <label className="block text-[10px] font-semibold text-text-muted mb-1">بازه زمانی یادآوری (ساعت):</label>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="number"
                      min="1"
                      max="72"
                      value={supplierReminderHours}
                      onChange={(e) => setSupplierReminderHours(Number(e.target.value) || 6)}
                      className="w-20 px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-mono text-center outline-none focus:ring-1 focus:ring-primary-default text-text-primary"
                    />
                    <span className="text-[10px] text-text-secondary">ساعت (مثال: ۶ ساعت یکبار)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trigger 3: Postal Label Print */}
            <div
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                smsNotifyLabelPrint
                  ? "border-amber-300 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-800"
                  : "border-border bg-surface/40 opacity-75"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 rounded-lg">
                    <Printer className="w-5 h-5" />
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smsNotifyLabelPrint}
                      onChange={(e) => setSmsNotifyLabelPrint(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">۳. چاپ لیبل پستی و آماده‌سازی مرسوله</h4>
                  <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                    ارسال پیامک صدور و چاپ بارکد لیبل پستی به همراه کد رهگیری به خریدار نهایی، فروشگاه و انبار تامین‌کننده.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border space-y-1">
                <label className="block text-[10px] font-semibold text-text-muted">کد پترن صدور لیبل پستی (اختیاری):</label>
                <input
                  type="text"
                  value={melliPatternLabelIssued}
                  onChange={(e) => setMelliPatternLabelIssued(e.target.value)}
                  placeholder="مثال: 54321 (کد الگو لیبل)"
                  className="w-full px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-mono text-left outline-none focus:ring-1 focus:ring-primary-default text-text-primary"
                />
              </div>
            </div>

            {/* Trigger 4: Announcement Notification */}
            <div
              className={`p-5 rounded-xl border transition-all flex flex-col justify-between ${
                melliPatternAnnouncement
                  ? "border-purple-300 bg-purple-50/40 dark:bg-purple-950/20 dark:border-purple-800"
                  : "border-border bg-surface/40 opacity-80"
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 rounded-lg">
                    <Bell className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-2 py-0.5 rounded-md">
                    جدید
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-text-primary">۴. اعلانات و اطلاعیه‌های گروه‌های شغلی</h4>
                  <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
                    ارسال پیامک اطلاع‌رسانی آنی هنگام ثبت اطلاعیه جدید برای تأمین‌کنندگان، مدیران فروشگاه یا کلیه کاربران.
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border space-y-1">
                <label className="block text-[10px] font-semibold text-text-muted">کد پترن اعلانات سیستم (MelliPayamak):</label>
                <input
                  type="text"
                  value={melliPatternAnnouncement}
                  onChange={(e) => setMelliPatternAnnouncement(e.target.value)}
                  placeholder="مثال: 987654 (کد الگوی اعلانات)"
                  className="w-full px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-mono text-left outline-none focus:ring-1 focus:ring-primary-default text-text-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Additional SMS Toggles */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-6">
          <div className="flex items-center gap-2 pb-3.5 border-b border-border">
            <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-sm font-bold text-text-primary">سایر رویدادهای نوتیفیکیشن پیامکی</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                id: "orderSubmit",
                label: "پیامک ثبت سفارش جدید",
                desc: "ارسال پیامک خوش‌آمد و ثبت نهایی سفارش به فروشگاه و تامین‌کننده",
                checked: smsOnOrderSubmit,
                onChange: setSmsOnOrderSubmit,
              },
              {
                id: "orderPaid",
                label: "پیامک پرداخت فاکتور",
                desc: "ارسال پیامک تایید پرداخت فاکتور صادر شده به مدیر سیستم و طرفین",
                checked: smsOnOrderPaid,
                onChange: setSmsOnOrderPaid,
              },
              {
                id: "supplierVerify",
                label: "پیامک تایید مدارک تامین‌کننده",
                desc: "ارسال پیامک فعال‌سازی حساب کاربری پس از احراز هویت موفق تامین‌کننده",
                checked: smsOnSupplierVerify,
                onChange: setSmsOnSupplierVerify,
              },
              {
                id: "payoutSettle",
                label: "پیامک تسویه وجه حساب",
                desc: "ارسال پیامک واریز شبا و تسویه نهایی کیف پول تامین‌کننده به صورت آنی",
                checked: smsOnPayoutSettle,
                onChange: setSmsOnPayoutSettle,
              },
              {
                id: "ticketReply",
                label: "پیامک پاسخ به تیکت پشتیبانی",
                desc: "ارسال پیامک اطلاع‌رسانی بابت پاسخ به تیکت‌های پشتیبانی کاربران",
                checked: smsOnTicketReply,
                onChange: setSmsOnTicketReply,
              },
            ].map((item) => (
              <label
                key={item.id}
                className={`p-4 rounded-xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                  item.checked
                    ? "border-purple-300 bg-purple-50/50 dark:bg-purple-950/20 dark:border-purple-800"
                    : "border-border hover:bg-surface/50"
                }`}
              >
                <div className="relative flex items-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => item.onChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 bg-card border border-border rounded-md peer-checked:bg-primary-default peer-checked:border-primary-default transition-all flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-text-primary block">{item.label}</span>
                  <span className="text-[11px] text-text-muted mt-1 leading-relaxed block">{item.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>


        {/* Card 4.5: Custom SMS Patterns */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-bold text-text-primary">الگوهای پیامکی سفارشی</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                const newPattern = {
                  id: Date.now().toString(),
                  name: '',
                  patternCode: '',
                  isActive: true,
                  role: 'all',
                  frequencyHours: 0
                };
                setCustomSmsPatterns([...customSmsPatterns, newPattern]);
              }}
              className="px-3 py-1.5 bg-primary-default/10 text-primary-default rounded-lg text-xs font-bold hover:bg-primary-default/20 transition-colors"
            >
              + افزودن الگوی جدید
            </button>
          </div>

          <div className="space-y-4">
            
            {customSmsPatterns.length === 0 ? (
              <div className="text-center py-6 text-text-muted text-xs">هیچ الگوی سفارشی تعریف نشده است.</div>
            ) : (
              customSmsPatterns.map((pattern, index) => (
                <div key={pattern.id} className="p-4 rounded-xl border border-border bg-surface/50 space-y-3">
                  <div className="flex flex-wrap sm:flex-nowrap items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-text-muted mb-1">نام الگو (برای شناسایی):</label>
                          <input
                            type="text"
                            value={pattern.name}
                            onChange={(e) => {
                              const updated = [...customSmsPatterns];
                              updated[index].name = e.target.value;
                              setCustomSmsPatterns(updated);
                            }}
                            placeholder="مثال: یادآوری ارسال محصول"
                            className="w-full px-3 py-1.5 bg-card border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary-default text-text-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-text-muted mb-1">کد پترن ملی‌پیامک:</label>
                          <input
                            type="text"
                            value={pattern.patternCode}
                            onChange={(e) => {
                              const updated = [...customSmsPatterns];
                              updated[index].patternCode = e.target.value;
                              setCustomSmsPatterns(updated);
                            }}
                            placeholder="مثال: 12345"
                            className="w-full px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-mono text-left outline-none focus:ring-1 focus:ring-primary-default text-text-primary"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-text-muted mb-1">نقش هدف:</label>
                          <select
                            value={pattern.role}
                            onChange={(e) => {
                              const updated = [...customSmsPatterns];
                              updated[index].role = e.target.value;
                              setCustomSmsPatterns(updated);
                            }}
                            className="w-full px-3 py-1.5 bg-card border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary-default text-text-primary"
                          >
                            <option value="all">همه کاربران</option>
                            <option value="supplier">تامین‌کنندگان</option>
                            <option value="customer">خریداران</option>
                            <option value="admin">مدیران</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-text-muted mb-1">بازه زمانی یادآوری (ساعت):</label>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <input
                              type="number"
                              min="0"
                              value={pattern.frequencyHours}
                              onChange={(e) => {
                                const updated = [...customSmsPatterns];
                                updated[index].frequencyHours = Number(e.target.value) || 0;
                                setCustomSmsPatterns(updated);
                              }}
                              className="w-20 px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-mono text-center outline-none focus:ring-1 focus:ring-primary-default text-text-primary"
                            />
                            <span className="text-[10px] text-text-secondary">۰ = بدون تکرار (یک‌بار)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 sm:gap-4 w-full sm:w-auto">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pattern.isActive}
                          onChange={(e) => {
                            const updated = [...customSmsPatterns];
                            updated[index].isActive = e.target.checked;
                            setCustomSmsPatterns(updated);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-default"></div>
                        <span className="mr-2 text-[10px] font-semibold text-text-secondary">فعال</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...customSmsPatterns];
                          updated.splice(index, 1);
                          setCustomSmsPatterns(updated);
                        }}
                        className="text-red-500 hover:text-red-600 text-[10px] font-bold bg-red-500/10 px-2 py-1 rounded-md"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>


        {/* Card 5: Interactive SMS Live Test */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-bold text-text-primary">تست زنده و اعتبارسنجی وب‌سرویس پیامکی</h3>
            </div>

            {/* Mode Switch */}
            <div className="flex bg-surface p-1 rounded-xl border border-border text-xs">
              <button
                type="button"
                onClick={() => setTestSmsMode("pattern")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  testSmsMode === "pattern"
                    ? "bg-primary-default text-white shadow-xs"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                تست با پترن خدماتی (Pattern)
              </button>
              <button
                type="button"
                onClick={() => setTestSmsMode("text")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                  testSmsMode === "text"
                    ? "bg-primary-default text-white shadow-xs"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                تست با پیامک متنی ساده
              </button>
            </div>
          </div>

          <p className="text-xs text-text-muted leading-relaxed">
            {testSmsMode === "pattern"
              ? "در این حالت پیامک از طریق خط خدماتی اشتراکی ملی‌پیامک (بدون تاخیر و حتی به شماره‌های بلک‌لیست) بر اساس الگوی انتخابی و متغیرهای تعریف‌شده ارسال می‌شود."
              : "در این حالت پیامک متنی مستقیم با شماره اختصاصی پنل ارسال می‌گردد (در صورتی که شماره گیرنده پیامک‌های تبلیغاتی را بسته باشد، ممکن است دریافت نشود)."}
          </p>

          {testSmsMode === "pattern" && (
            <div className="bg-surface/50 p-3 rounded-xl border border-border space-y-3">
              <label className="block text-[11px] font-bold text-text-primary">انتخاب الگوی پیامکی جهت تست:</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setTestPatternType("otp")}
                  className={`px-2.5 py-2 rounded-lg font-semibold border transition-all text-center cursor-pointer ${
                    testPatternType === "otp"
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                      : "bg-card border-border text-text-secondary hover:bg-surface"
                  }`}
                >
                  🔑 پترن OTP
                </button>
                <button
                  type="button"
                  onClick={() => setTestPatternType("supplier")}
                  className={`px-2.5 py-2 rounded-lg font-semibold border transition-all text-center cursor-pointer ${
                    testPatternType === "supplier"
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                      : "bg-card border-border text-text-secondary hover:bg-surface"
                  }`}
                >
                  📦 پترن تأمین‌کننده
                </button>
                <button
                  type="button"
                  onClick={() => setTestPatternType("label")}
                  className={`px-2.5 py-2 rounded-lg font-semibold border transition-all text-center cursor-pointer ${
                    testPatternType === "label"
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                      : "bg-card border-border text-text-secondary hover:bg-surface"
                  }`}
                >
                  🏷️ پترن لیبل پستی
                </button>
                <button
                  type="button"
                  onClick={() => setTestPatternType("announcement")}
                  className={`px-2.5 py-2 rounded-lg font-semibold border transition-all text-center cursor-pointer ${
                    testPatternType === "announcement"
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                      : "bg-card border-border text-text-secondary hover:bg-surface"
                  }`}
                >
                  📢 پترن اعلانات
                </button>
                <button
                  type="button"
                  onClick={() => setTestPatternType("custom")}
                  className={`px-2.5 py-2 rounded-lg font-semibold border transition-all text-center cursor-pointer col-span-2 sm:col-span-1 ${
                    testPatternType === "custom"
                      ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                      : "bg-card border-border text-text-secondary hover:bg-surface"
                  }`}
                >
                  🔢 کد پترن دلخواه
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-text-secondary mb-1">شماره همراه مقصد تست</label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="09120000000"
                className="w-full px-3.5 py-2.5 bg-card border border-border rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-primary-default outline-none text-text-primary"
              />
            </div>

            {testSmsMode === "pattern" ? (
              <>
                {testPatternType === "custom" ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary mb-1">کد الگوی دلخواه (Body ID)</label>
                    <input
                      type="text"
                      value={testCustomBodyId}
                      onChange={(e) => setTestCustomBodyId(e.target.value)}
                      placeholder="مثال: 123456"
                      className="w-full px-3.5 py-2.5 bg-card border border-border rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-primary-default outline-none text-text-primary"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-text-secondary mb-1">
                      {testPatternType === "otp"
                        ? "کد متغیر OTP"
                        : testPatternType === "supplier" || testPatternType === "label"
                        ? "شماره سفارش نمونه"
                        : "عنوان نمونه خبر"}
                    </label>
                    <input
                      type="text"
                      value={testOtpCode}
                      onChange={(e) => setTestOtpCode(e.target.value)}
                      placeholder="مثال: 58241"
                      className="w-full px-3.5 py-2.5 bg-card border border-border rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-primary-default outline-none text-text-primary"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-text-secondary mb-1">متن پیامک آزمایشی</label>
                <input
                  type="text"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-card border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary-default outline-none"
                />
              </div>
            )}

            <div className="flex items-end">
              <button
                type="button"
                onClick={handleSendTestSms}
                disabled={testingSms || !testPhone}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {testingSms ? "در حال ارسال و تست..." : "ارسال پیامک تستی"}
              </button>
            </div>
          </div>

          {smsTestResult && (
            <div
              className={`p-4 rounded-xl border text-xs flex flex-col gap-1.5 mt-2 transition-all ${
                smsTestResult.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-100"
                  : "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-100"
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span className={smsTestResult.success ? "text-emerald-800 dark:text-emerald-200" : "text-rose-800 dark:text-rose-200"}>
                  {smsTestResult.success ? "✓ وضعیت ارتباط: موفق" : "✕ خطا در ارسال پیامک"}
                </span>
                {smsTestResult.trackingCode && (
                  <span className="font-mono text-[11px] bg-emerald-200/60 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 px-2 py-0.5 rounded-md font-bold">
                    کد پیگیری: {smsTestResult.trackingCode}
                  </span>
                )}
              </div>
              <p className="leading-relaxed text-[11px] font-medium">
                {smsTestResult.message || smsTestResult.error || JSON.stringify(smsTestResult)}
              </p>
              {smsTestResult.simulated && (
                <span className="text-[10px] text-text-muted mt-1">
                  نکته: جهت ارسال واقعی از طریق مخابرات، نام کاربری، رمز عبور و کد پترن اختصاصی پنل ملی‌پیامک را در بخش بالا وارد و دکمه ذخیره را بزنید.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Form Action Bar */}
        <div className="bg-card rounded-2xl p-4 border border-border shadow-xs flex justify-end gap-3 items-center">
          <span className="text-[11px] text-text-muted ml-auto">آخرین بروزرسانی تنظیمات به طور خودکار کش‌زدایی و در کل پلتفرم اعمال می‌گردد.</span>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-primary-default hover:bg-primary-hover text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "در حال ذخیره‌سازی..." : "ذخیره و انتشار نهایی تنظیمات"}
          </button>
        </div>
      </form>
    </div>
  );
}