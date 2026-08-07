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
} from "lucide-react";

export default function PaymentSmsSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // States for Settings
  const [gatewayType, setGatewayType] = useState("ZARINPAL");
  const [merchantCode, setMerchantCode] = useState("");
  const [gatewayKey, setGatewayKey] = useState("");
  const [shabaNumber, setShabaNumber] = useState("330560611828006022464501");
  const [cardNumber, setCardNumber] = useState("6219-8618-1832-7263");
  const [accountOwner, setAccountOwner] = useState("مهدی مشرفی");
  const [smsProvider, setSmsProvider] = useState("MELIPAYAMAK");
  const [smsApiKey, setSmsApiKey] = useState("");
  const [melliUsername, setMelliUsername] = useState("");
  const [melliPassword, setMelliPassword] = useState("");
  const [melliFromNumber, setMelliFromNumber] = useState("50001");
  const [melliPatternId, setMelliPatternId] = useState("");

  // SMS Notification Checkboxes
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

  const handleTestGateway = async () => {
    setTestingGateway(true);
    setGatewayTestResult(null);
    try {
      const res = await fetch("/api/admin/payment-gateway/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ merchantCode }),
      });
      const data = await res.json();
      setGatewayTestResult(data);
      if (data.active) {
        toast("درگاه زیبال کاملاً فعال و معتبر است.", "success");
      } else {
        toast(`هشدار درگاه: ${data.message}`, "error");
      }
    } catch {
      toast("خطا در برقراری ارتباط با سرور", "error");
    } finally {
      setTestingGateway(false);
    }
  };

  useEffect(() => {
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error) {
          if (data.PAYMENT_GATEWAY_TYPE) setGatewayType(data.PAYMENT_GATEWAY_TYPE);
          if (data.PAYMENT_GATEWAY_MERCHANT_CODE) setMerchantCode(data.PAYMENT_GATEWAY_MERCHANT_CODE);
          if (data.PAYMENT_GATEWAY_KEY) setGatewayKey(data.PAYMENT_GATEWAY_KEY);
          if (data.CARD_TO_CARD_SHABA) setShabaNumber(data.CARD_TO_CARD_SHABA);
          if (data.CARD_TO_CARD_CARD) setCardNumber(data.CARD_TO_CARD_CARD);
          if (data.CARD_TO_CARD_OWNER) setAccountOwner(data.CARD_TO_CARD_OWNER);
          if (data.SMS_PANEL_PROVIDER) setSmsProvider(data.SMS_PANEL_PROVIDER);
          if (data.SMS_PANEL_API_KEY) setSmsApiKey(data.SMS_PANEL_API_KEY);
          if (data.MELLIPAYAMAK_USERNAME) setMelliUsername(data.MELLIPAYAMAK_USERNAME);
          if (data.MELLIPAYAMAK_PASSWORD) setMelliPassword(data.MELLIPAYAMAK_PASSWORD);
          if (data.MELLIPAYAMAK_FROM_NUMBER) setMelliFromNumber(data.MELLIPAYAMAK_FROM_NUMBER);
          if (data.MELLIPAYAMAK_PATTERN_ID) setMelliPatternId(data.MELLIPAYAMAK_PATTERN_ID);

          // SMS Booleans (coming as "true" or "false" from API map)
          setSmsOnOrderSubmit(data.SMS_NOTIFY_ON_ORDER_SUBMIT !== false);
          setSmsOnOrderPaid(data.SMS_NOTIFY_ON_ORDER_PAYMENT !== false);
          setSmsOnSupplierVerify(data.SMS_NOTIFY_ON_SUPPLIER_VERIFY !== false);
          setSmsOnPayoutSettle(data.SMS_NOTIFY_ON_PAYOUT_SETTLE !== false);
          setSmsOnTicketReply(data.SMS_NOTIFY_ON_TICKET_REPLY !== false);
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

    const payload = [
      { key: "PAYMENT_GATEWAY_TYPE", value: gatewayType },
      { key: "PAYMENT_GATEWAY_MERCHANT_CODE", value: merchantCode },
      { key: "PAYMENT_GATEWAY_KEY", value: gatewayKey },
      { key: "CARD_TO_CARD_SHABA", value: shabaNumber },
      { key: "CARD_TO_CARD_CARD", value: cardNumber },
      { key: "CARD_TO_CARD_OWNER", value: accountOwner },
      { key: "SMS_PANEL_PROVIDER", value: smsProvider },
      { key: "SMS_PANEL_API_KEY", value: smsApiKey },
      { key: "MELLIPAYAMAK_USERNAME", value: melliUsername },
      { key: "MELLIPAYAMAK_PASSWORD", value: melliPassword },
      { key: "MELLIPAYAMAK_FROM_NUMBER", value: melliFromNumber },
      { key: "MELLIPAYAMAK_PATTERN_ID", value: melliPatternId },
      { key: "SMS_NOTIFY_ON_ORDER_SUBMIT", value: String(smsOnOrderSubmit) },
      { key: "SMS_NOTIFY_ON_ORDER_PAYMENT", value: String(smsOnOrderPaid) },
      { key: "SMS_NOTIFY_ON_SUPPLIER_VERIFY", value: String(smsOnSupplierVerify) },
      { key: "SMS_NOTIFY_ON_PAYOUT_SETTLE", value: String(smsOnPayoutSettle) },
      { key: "SMS_NOTIFY_ON_TICKET_REPLY", value: String(smsOnTicketReply) },
    ];

    try {
      const promises = payload.map((item) =>
        fetch("/api/config", {
          credentials: "include",
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        })
      );
      await Promise.all(promises);
      setSuccessMsg("تنظیمات درگاه پرداخت و پنل پیامکی با موفقیت ذخیره و در سراسر سامانه اعمال شد.");
      setTimeout(() => setSuccessMsg(null), 5000);
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
    <div className="space-y-8 animate-fade-in text-right" dir="rtl">
      {/* Description card */}
      <div className="bg-card rounded-2xl p-6 border border-subtle flex gap-4 items-center">
        <div className="w-12 h-12 rounded-xl bg-primary-default/10 flex items-center justify-center text-primary-default shrink-0">
          <CreditCard className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-black text-primary">تنظیمات درگاه‌های پرداخت، شبا و پنل پیامک</h2>
          <p className="text-xs text-muted mt-1 leading-relaxed">
            مدیریت درگاه‌های بانکی فعال سیستم (زرین‌پال، زیبال)، شماره شبا اختصاصی بابت کارت به کارت تامین‌کنندگان، تنظیم پنل‌های پیامکی و نوتیفیکیشن رویدادهای مختلف برای کاربران.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="bg-success/10 border border-success/30 text-success rounded-2xl p-4 flex items-center gap-3 text-xs font-semibold animate-scale-up">
          <Check className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Payment Gateways */}
          <div className="bg-card rounded-3xl p-6 border border-subtle space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-subtle">
              <CreditCard className="w-5 h-5 text-primary-default" />
              <h3 className="text-sm font-bold text-primary">تنظیمات درگاه پرداخت مستقیم</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-secondary mb-2">نوع درگاه پرداخت فعال</label>
                <div className="grid grid-cols-2 gap-3">
                  {["ZARINPAL", "ZIBAL"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setGatewayType(t)}
                      className={`p-3 rounded-xl border text-center text-xs transition-all cursor-pointer ${
                        gatewayType === t
                          ? "border-primary-default bg-primary-default/10 text-primary-hover font-bold shadow-md shadow-primary-default/5"
                          : "border-subtle text-muted bg-background hover:bg-surface"
                      }`}
                    >
                      {t === "ZARINPAL" ? "زرین‌پال (ZarinPal)" : "زیبال (Zibal)"}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-black text-secondary">کد مرجنت (Merchant Code)</label>
                  <button
                    type="button"
                    onClick={handleTestGateway}
                    disabled={testingGateway}
                    className="text-[11px] font-bold text-primary-default hover:text-primary-hover flex items-center gap-1 bg-primary-default/10 px-2.5 py-1 rounded-lg border border-primary-default/20 cursor-pointer disabled:opacity-50 transition-all"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{testingGateway ? "در حال استعلام..." : "بررسی و تست آنلاین درگاه"}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={merchantCode}
                    onChange={(e) => setMerchantCode(e.target.value)}
                    placeholder="مثال: 6a0213e61b27742a09938588 یا zibal"
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-subtle rounded-xl text-xs text-primary font-mono text-left focus:outline-none focus:ring-2 focus:ring-primary-default"
                  />
                  <Database className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
                </div>

                {gatewayTestResult && (
                  <div
                    className={`mt-2 p-3 rounded-xl border text-xs font-bold flex items-start gap-2 animate-fade-in ${
                      gatewayTestResult.active
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                        : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {gatewayTestResult.active ? "✅" : "⚠️"}
                    </div>
                    <div>
                      <p className="font-extrabold">{gatewayTestResult.message}</p>
                      {gatewayTestResult.resultCode !== undefined && (
                        <p className="text-[10px] opacity-80 mt-0.5 dir-ltr font-mono">
                          Zibal Result Code: {gatewayTestResult.resultCode}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-secondary mb-1.5">کلید درگاه پرداخت (Gateway Private Key)</label>
                <div className="relative">
                  <input
                    type="password"
                    value={gatewayKey}
                    onChange={(e) => setGatewayKey(e.target.value)}
                    placeholder="رمز یا کلید اختصاصی درگاه"
                    className="w-full pl-10 pr-4 py-2.5 bg-background border border-subtle rounded-xl text-xs text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary-default"
                  />
                  <Key className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
                </div>
                <span className="text-[10px] text-muted leading-relaxed block mt-1">
                  کلیدهای پرداخت به صورت کاملا ایمن و رمزگذاری‌شده در دیتابیس مرکزی نگهداری خواهند شد.
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Shaba Card-to-Card & SMS Provider */}
          <div className="bg-card rounded-3xl p-6 border border-subtle space-y-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-subtle">
                <ShieldAlert className="w-5 h-5 text-primary-default" />
                <h3 className="text-sm font-bold text-primary">شماره شبا و پنل پیامک</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-secondary mb-1.5">شماره شبا بابت کارت به کارت پلتفرم</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={shabaNumber}
                      onChange={(e) => setShabaNumber(e.target.value)}
                      placeholder="IR000000000000000000000000"
                      className="w-full pl-12 pr-4 py-2.5 bg-background border border-subtle rounded-xl text-xs text-primary font-mono text-left focus:outline-none focus:ring-2 focus:ring-primary-default"
                    />
                    <span className="text-muted absolute left-3.5 top-2.5 font-bold text-xs select-none">IR</span>
                  </div>
                  <span className="text-[10px] text-muted leading-relaxed block mt-1">
                    شماره شبا رسمی مدیریت سیستم جهت انتقال کارت به کارت فیش‌های صادر شده توسط فروشگاه‌ها.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-black text-secondary mb-1.5">شماره کارت بابت کارت به کارت پلتفرم</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="6219-8618-1832-7263"
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs text-primary font-mono text-left focus:outline-none focus:ring-2 focus:ring-primary-default"
                  />
                  <span className="text-[10px] text-muted leading-relaxed block mt-1">
                    شماره کارت ۱۶ رقمی جهت واریز دستی فروشگاه‌ها.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-black text-secondary mb-1.5">نام صاحب حساب بانکی</label>
                  <input
                    type="text"
                    value={accountOwner}
                    onChange={(e) => setAccountOwner(e.target.value)}
                    placeholder="مثال: مهدی مشرفی"
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-primary-default text-right"
                  />
                  <span className="text-[10px] text-muted leading-relaxed block mt-1">
                    نام کامل صاحب حساب جهت اطمینان فروشگاه‌ها در زمان واریز.
                  </span>
                </div>

                <div className="pt-2 border-t border-subtle/40">
                  <label className="block text-xs font-black text-secondary mb-1.5">پنل پیامک انتخابی</label>
                  <select
                    value={smsProvider}
                    onChange={(e) => setSmsProvider(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-primary-default"
                  >
                    <option value="MELIPAYAMAK">ملی پیامک (MeliPayamak)</option>
                    <option value="FARAZSMS">فراز اس‌ام‌اس (FarazSMS)</option>
                    <option value="KAVENEGAR">کاوه نگار (Kavenegar)</option>
                  </select>
                </div>

                {smsProvider === "MELIPAYAMAK" ? (
                  <div className="p-4 bg-surface rounded-2xl border border-subtle space-y-3">
                    <span className="text-xs font-bold text-primary block">تنظیمات وب‌سرویس ملی پیامک (Melli Payamak):</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-muted mb-1">نام کاربری ملی پیامک</label>
                        <input
                          type="text"
                          value={melliUsername}
                          onChange={(e) => setMelliUsername(e.target.value)}
                          placeholder="مثال: 09123456789"
                          className="w-full px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-primary-default outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-muted mb-1">کلمه عبور / رمز پنل</label>
                        <input
                          type="password"
                          value={melliPassword}
                          onChange={(e) => setMelliPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-primary-default outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-muted mb-1">شماره خط ارسال (From)</label>
                        <input
                          type="text"
                          value={melliFromNumber}
                          onChange={(e) => setMelliFromNumber(e.target.value)}
                          placeholder="50001..."
                          className="w-full px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-primary-default outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-muted mb-1">شناسه پترن / BodyId (اختیاری)</label>
                        <input
                          type="text"
                          value={melliPatternId}
                          onChange={(e) => setMelliPatternId(e.target.value)}
                          placeholder="کد پترن خدماتی"
                          className="w-full px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-primary-default outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-black text-secondary mb-1.5">کلید وب‌سرویس پیامک (API Key)</label>
                    <div className="relative">
                      <input
                        type="password"
                        value={smsApiKey}
                        onChange={(e) => setSmsApiKey(e.target.value)}
                        placeholder="API Key / Token"
                        className="w-full pl-10 pr-4 py-2.5 bg-background border border-subtle rounded-xl text-xs text-primary text-left focus:outline-none focus:ring-2 focus:ring-primary-default"
                      />
                      <Phone className="w-4 h-4 text-muted absolute left-3.5 top-3.5" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Detailed SMS Toggles */}
        <div className="bg-card rounded-3xl p-6 border border-subtle space-y-6">
          <div className="flex items-center gap-2 pb-4 border-b border-subtle">
            <Bell className="w-5 h-5 text-primary-default" />
            <h3 className="text-sm font-bold text-primary">تیک‌های فعال‌سازی نوتیفیکیشن پیامکی رویدادها</h3>
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
                label: "پیامک تایید تامین‌کننده",
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
                className={`p-4 rounded-2xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                  item.checked
                    ? "border-primary-default/40 bg-primary-default/[0.03] hover:bg-primary-default/[0.05]"
                    : "border-subtle hover:bg-surface/50"
                }`}
              >
                <div className="relative flex items-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => item.onChange(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-5 h-5 bg-background border border-subtle rounded-md peer-checked:bg-primary-default peer-checked:border-primary-default transition-all flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-inverse opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div>
                  <span className="text-xs font-black text-primary block">{item.label}</span>
                  <span className="text-[10px] text-muted mt-1 leading-relaxed block">{item.desc}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Form Action Bar */}
        <div className="bg-card rounded-2xl p-4 border border-subtle flex justify-end gap-3 items-center">
          <span className="text-[11px] text-muted ml-auto">آخرین بروزرسانی تنظیمات به طور خودکار کش‌زدایی و در کل پلتفرم اعمال می‌گردد.</span>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-primary-default hover:bg-primary-hover text-inverse text-xs font-bold rounded-xl flex items-center gap-2 transition-all shadow-md shadow-primary-default/10 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "در حال ذخیره‌سازی..." : "ذخیره و انتشار نهایی تنظیمات"}
          </button>
        </div>
      </form>
    </div>
  );
}
