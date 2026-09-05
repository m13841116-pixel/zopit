import { toast } from "../GlobalToast";
import React, { useState } from "react";
import {
  Users,
  Percent,
  Gift,
  Copy,
  Check,
  Share2,
  Send,
  MessageCircle,
  Calendar,
  Sparkles,
  TrendingUp,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Award,
  ArrowLeft,
  ChevronRight,
  Calculator
} from "lucide-react";

interface SupplierReferralProgramProps {
  user?: any;
}

export function SupplierReferralProgram({ user }: SupplierReferralProgramProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [monthlyTurnover, setMonthlyTurnover] = useState(150000000); // 150 Million Tomans default

  // Standard commission rate is 1.5%
  const baseCommissionRate = 1.5;

  // Referral code from user or fallback
  const referralCode = user?.referralCode || `SUP-${(user?.id || 1042).toString().padStart(4, "0")}`;
  const referralLink = `${window.location.origin}/supplier-register?ref=${referralCode}`;

  // Mock / Initial referral data
  const referredSuppliers = [
    {
      id: "ref_1",
      name: "بازرگانی پخش آریا (صالح‌آباد)",
      registeredAt: "۱۴۰۳/۰۵/۱۲",
      status: "فعال",
      freeMonthAwarded: true,
      category: "لوازم خانه و آشپزخانه",
    },
    {
      id: "ref_2",
      name: "تولیدی پارس تکنیک (چراغ‌برق)",
      registeredAt: "۱۴۰۳/۰۵/۲۸",
      status: "فعال",
      freeMonthAwarded: true,
      category: "قطعات و لوازم یدکی",
    },
    {
      id: "ref_3",
      name: "عمده‌فروشی برادران مرادی (بازار بزرگ)",
      registeredAt: "۱۴۰۳/۰۶/۰۲",
      status: "در حال احراز هویت",
      freeMonthAwarded: true,
      category: "لوازم جانبی و دیجیتال",
    },
  ];

  const totalReferred = referredSuppliers.length;
  // Each referred active supplier grants 1 month of 0% commission (up to 12 months)
  const freeMonthsEarned = Math.min(totalReferred, 12);
  const isZeroCommissionActive = freeMonthsEarned > 0;
  const currentCommissionRate = isZeroCommissionActive ? 0 : baseCommissionRate;

  // Calculate monthly and annual savings
  const monthlySavings = (monthlyTurnover * baseCommissionRate) / 100;
  const totalEarnedSavings = monthlySavings * freeMonthsEarned;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success("لینک اختصاصی دعوت با موفقیت کپی شد.");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    toast.success("کد معرف با موفقیت کپی شد.");
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const shareText = `سلام همکار گرامی؛\nمن به عنوان تأمین‌کننده عمده در پلتفرم زوپیت (بزرگ‌ترین بازار B2B کشور) فعال هستم و محصولاتم به صدها فروشگاه معتبر سراسر ایران معرفی می‌شود.\nاگر شما هم می‌خواهید بدون واسطه و با تسویه نقدی به بازار کل کشور بفروشید، با لینک اختصاصی من ثبت‌نام کنید تا از امتیازات ویژه و طرح کارمزد صفر درصد بهره‌مند شوید:\n${referralLink}`;

  const handleShareTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  const handleShareEitaa = () => {
    navigator.clipboard.writeText(shareText);
    toast.success("متن پیام دعوت کپی شد؛ در حال هدایت به ایتا...");
    setTimeout(() => {
      window.open("https://web.eitaa.com", "_blank");
    }, 600);
  };

  const handleShareWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900 pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-emerald-500/20">
        <div className="absolute -left-16 -top-16 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-16 w-64 h-64 bg-teal-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-400/20 text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-black border border-emerald-400/30">
              <Gift className="w-4 h-4 text-emerald-300" />
              <span>طرح طلایی معرف همکار (کارمزد ۰٪)</span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white leading-tight">
              به ازای هر ۱ همکار، ۱ ماه کارمزد ۰٪ بگیرید!
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              کارمزد استاندارد پلتفرم زوپیت <strong className="text-white font-bold">۱.۵٪</strong> است. با دعوت هر بنکدار، تولیدکننده یا همکار صنف خود به زوپیت، <strong className="text-emerald-300 font-bold">۱ ماه معافیت ۱۰۰٪ از کارمزد</strong> دریافت کنید. با معرفی ۱۲ همکار، یک سال کامل بدون کسر حتی ۱ ریال کارمزد بفروشید!
            </p>
          </div>

          {/* Current Status Badge */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl w-full md:w-auto shrink-0 space-y-3 text-center md:text-right">
            <div className="text-xs text-emerald-200 font-bold">وضعیت کارمزد فعلی شما:</div>
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-4xl font-black font-mono text-emerald-400">
                {currentCommissionRate}%
              </span>
              <div className="text-right">
                <div className="text-xs font-black text-white">
                  {isZeroCommissionActive ? "کارمزد صفر درصد فعال است!" : "کارمزد استاندارد"}
                </div>
                <div className="text-[11px] text-emerald-200">
                  {freeMonthsEarned > 0 ? `${freeMonthsEarned} ماه رایگان باقی‌مانده` : "همکاری معرفی نشده است"}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 text-[11px] text-slate-300 flex items-center justify-between gap-4">
              <span>تعداد همکاران فعال شما:</span>
              <strong className="text-white font-mono text-sm">{totalReferred} نفر</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Referral Link & Code Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Invite Link & Sharing */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">لینک و کد اختصاصی دعوت شما</h2>
              <p className="text-xs text-slate-500">این لینک را برای همکاران بازار یا گروه‌های صنفی بفرستید</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">لینک اختصاصی دعوت:</label>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-1 bg-transparent px-3 py-1.5 text-xs font-mono text-slate-700 outline-none truncate text-left"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer shadow-xs"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? "کپی شد" : "کپی لینک"}</span>
              </button>
            </div>
          </div>

          {/* Quick Share Buttons */}
          <div className="space-y-2">
            <span className="block text-xs font-bold text-slate-700">اشتراک‌گذاری مستقیم در شبکه‌های اجتماعی و پیام‌رسان‌ها:</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={handleShareTelegram}
                className="flex items-center justify-center gap-2 p-3 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4 text-sky-600" />
                <span>اشتراک در تلگرام</span>
              </button>

              <button
                type="button"
                onClick={handleShareEitaa}
                className="flex items-center justify-center gap-2 p-3 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-orange-600" />
                <span>کپی متن و باز کردن ایتا</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex items-center justify-center gap-2 p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-emerald-600" />
                <span>اشتراک در واتساپ</span>
              </button>
            </div>
          </div>

          {/* Rules / Steps */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>قوانین و مراحل اعطای کارمزد ۰٪:</span>
            </h3>
            <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>همکار شما از طریق لینک یا با وارد کردن کد معرف شما در فرم ثبت‌نام تأمین‌کننده عضو شود.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>به محض تأیید غرفه و ثبت اولین محصول توسط همکار، ۱ ماه کارمزد ۰٪ به صورت خودکار برای شما اعمال می‌شود.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>این طرح قابلیت تجمیع دارد؛ مثلاً با معرفی ۳ همکار، ۳ ماه متوالی و با معرفی ۱۲ همکار، ۱ سال تمام معاف از کارمزد خواهید بود.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Right: Profit & Savings Calculator */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 border border-indigo-900/50 shadow-lg flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-400">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">ماشین‌حساب سود و کارمزد</h3>
                <p className="text-[11px] text-slate-400">محاسبه میزان پولی که در جیب شما می‌ماند</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">تخمین فروش ماهانه شما:</span>
                <strong className="font-mono text-emerald-400 text-sm">
                  {(monthlyTurnover / 1000000).toLocaleString("fa-IR")} میلیون تومان
                </strong>
              </div>
              <input
                type="range"
                min={20000000}
                max={1000000000}
                step={10000000}
                value={monthlyTurnover}
                onChange={(e) => setMonthlyTurnover(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>۲۰ م تومان</span>
                <span>۵۰۰ م تومان</span>
                <span>۱ میلیارد تومان</span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">کارمزد عادی (۱.۵٪):</span>
                <span className="font-mono text-slate-300">
                  {monthlySavings.toLocaleString("fa-IR")} تومان / ماه
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">کارمزد با طرح معرف (۰٪):</span>
                <span className="font-mono font-black text-emerald-400">۰ تومان (کاملاً رایگان)</span>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-xs font-bold text-white">صرفه‌جویی خالص شما ({freeMonthsEarned} ماه):</span>
                <strong className="font-mono text-base font-black text-amber-400">
                  {totalEarnedSavings.toLocaleString("fa-IR")} تومان
                </strong>
              </div>
            </div>
          </div>

          <div className="bg-emerald-950/60 border border-emerald-500/30 p-3.5 rounded-2xl text-[11px] text-emerald-300 text-center leading-relaxed">
            💡 این مبلغ مستقیماً به سود خالص کسب‌وکار شما اضافه می‌شود و نیازی به پرداخت کارمزد به پلتفرم ندارید.
          </div>
        </div>
      </div>

      {/* Referred Suppliers Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900">
              لیست همکاران معرفی‌شده توسط شما ({referredSuppliers.length.toLocaleString("fa-IR")} همکار)
            </h3>
          </div>

          <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-xl border border-emerald-200">
            {freeMonthsEarned} ماه کارمزد ۰٪ فعال شده است
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-slate-500">
                <th className="p-3 font-bold">نام فروشگاه / بنکداری</th>
                <th className="p-3 font-bold">صنف و حوزه کاری</th>
                <th className="p-3 font-bold">تاریخ عضویت</th>
                <th className="p-3 font-bold">وضعیت احراز</th>
                <th className="p-3 font-bold text-center">پاداش کارمزد ۰٪</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {referredSuppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="p-3 font-bold text-slate-900">{s.name}</td>
                  <td className="p-3 text-slate-600">{s.category}</td>
                  <td className="p-3 font-mono text-slate-500">{s.registeredAt}</td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        s.status === "فعال"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${s.status === "فعال" ? "bg-emerald-500" : "bg-amber-500"}`} />
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-2xs">
                      <Check className="w-3.5 h-3.5" />
                      <span>+۱ ماه کارمزد ۰٪</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
