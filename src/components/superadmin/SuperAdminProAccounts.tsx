import React, { useState, useEffect } from "react";
import { useUrlQueryState } from "../../utils/routeSync";
import {
  Crown,
  CheckCircle2,
  XCircle,
  Clock,
  Settings, Ticket,
  Search,
  Eye,
  Edit,
  Save,
  RefreshCw,
  Globe,
  Server,
  Lock,
  User,
  Phone,
  FileText,
  BadgePercent,
  ToggleLeft,
  ToggleRight,
  ShieldAlert,
  X,
  Upload,
  Trash2,
  Volume2
} from "lucide-react";
import { toast } from "../GlobalToast";
import SuperAdminDiscountCodes from "./SuperAdminDiscountCodes";

interface SuperAdminProAccountsProps {
  showNotification?: (message: string, type: "success" | "error") => void;
}

export default function SuperAdminProAccounts({ showNotification }: SuperAdminProAccountsProps) {
  const [activeTab, setActiveTab] = useUrlQueryState<"accounts" | "settings" | "discounts">("subtab", "accounts");
  const [loading, setLoading] = useState(true);
  const [proAccounts, setProAccounts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Selected account modal states
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [editDomain, setEditDomain] = useState("");
  const [editCpanelUrl, setEditCpanelUrl] = useState("");
  const [editCpanelUser, setEditCpanelUser] = useState("");
  const [editCpanelPass, setEditCpanelPass] = useState("");
  const [editWpUrl, setEditWpUrl] = useState("");
  const [editWpUser, setEditWpUser] = useState("");
  const [editWpPass, setEditWpPass] = useState("");
  const [editStatus, setEditStatus] = useState("APPROVED");
  const [savingAccount, setSavingAccount] = useState(false);

  // Global Pro Settings states
  const [autoApprove, setAutoApprove] = useState(true);
  const [proAccountPrice, setProAccountPrice] = useState("239500");
  const [hostRenewalPrice, setHostRenewalPrice] = useState("500000");
  const [hostDiscountedPrice, setHostDiscountedPrice] = useState("198000");
  const [torobPrice, setTorobPrice] = useState("150000");
  const [promoCode, setPromoCode] = useState("ZOPIT-PRO-198");
  const [termsContent, setTermsContent] = useState("");
  const [proVideoUrl, setProVideoUrl] = useState("");
  const [proAudioUrl, setProAudioUrl] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchSettings();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/superadmin/pro/accounts", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProAccounts(data || []);
      }
    } catch (err) {
      console.error("Error fetching pro accounts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/superadmin/pro/settings", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAutoApprove(data.autoApprove !== false);
        setProAccountPrice(data.proAccountPrice || "239500");
        setHostRenewalPrice(data.hostRenewalPrice || "500000");
        setHostDiscountedPrice(data.hostDiscountedPrice || "198000");
        setTorobPrice(data.torobPrice || "150000");
        setPromoCode(data.promoCode || "ZOPIT-PRO-198");
        setTermsContent(data.termsContent || "");
        setProVideoUrl(data.videoUrl || "");
        setProAudioUrl(data.audioUrl || "");
      }
    } catch (err) {
      console.error("Error fetching pro settings:", err);
    }
  };

  const handleOpenAccountModal = (acc: any) => {
    setSelectedAccount(acc);
    setEditDomain(acc.domainName || "");
    setEditCpanelUrl(acc.cpanelUrl || "");
    setEditCpanelUser(acc.cpanelUsername || "");
    setEditCpanelPass(acc.cpanelPassword || "");
    setEditWpUrl(acc.wpAdminUrl || "");
    setEditWpUser(acc.wpUsername || "");
    setEditWpPass(acc.wpPassword || "");
    setEditStatus(acc.status || "APPROVED");
  };

  const handleSaveAccount = async () => {
    if (!selectedAccount) return;
    setSavingAccount(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/superadmin/pro/accounts/${selectedAccount.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: editStatus,
          domainName: editDomain,
          cpanelUrl: editCpanelUrl,
          cpanelUsername: editCpanelUser,
          cpanelPassword: editCpanelPass,
          wpAdminUrl: editWpUrl,
          wpUsername: editWpUser,
          wpPassword: editWpPass
        })
      });

      const data = await res.json();
      if (res.ok) {
        const msg = "اطلاعات دسترسی اکانت پرو با موفقیت ویرایش شد.";
        if (showNotification) showNotification(msg, "success");
        else toast(msg, "success");
        setSelectedAccount(null);
        fetchAccounts();
      } else {
        const msg = data.error || "خطا در ذخیره ویرایش";
        if (showNotification) showNotification(msg, "error");
        else toast(msg, "error");
      }
    } catch (err: any) {
      const msg = err.message || "خطا در برقراری ارتباط";
      if (showNotification) showNotification(msg, "error");
      else toast(msg, "error");
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/superadmin/pro/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          autoApprove,
          proAccountPrice,
          hostRenewalPrice,
          hostDiscountedPrice,
          torobPrice,
          promoCode,
          termsContent,
          videoUrl: proVideoUrl,
          audioUrl: proAudioUrl
        })
      });

      const data = await res.json();
      if (res.ok) {
        const msg = "تنظیمات عمومی اکانت پرو با موفقیت ذخیره گردید.";
        if (showNotification) showNotification(msg, "success");
        else toast(msg, "success");
      } else {
        const msg = data.error || "خطا در ذخیره تنظیمات";
        if (showNotification) showNotification(msg, "error");
        else toast(msg, "error");
      }
    } catch (err: any) {
      const msg = err.message || "خطا در ارتباط با سرور";
      if (showNotification) showNotification(msg, "error");
      else toast(msg, "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredAccounts = proAccounts.filter((acc) => {
    const nameMatch =
      (acc.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.user?.storeName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.nationalCode || "").includes(searchTerm) ||
      (acc.mobile || "").includes(searchTerm);

    if (statusFilter === "ALL") return nameMatch;
    return nameMatch && acc.status === statusFilter;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12" dir="rtl">
      {/* Header */}
      <div className="bg-card border border-border-subtle rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <Crown className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-black text-primary">مدیریت اکانت‌های پرو (ویژه)</h1>
            <p className="text-xs text-muted mt-1">
              مدیریت درخواست‌های فعال‌سازی، تخصیص cPanel/ورود وردپرس و تنظیمات عمومی پکیج پرو
            </p>
          </div>
        </div>

        {/* Tabs switcher */}
        <div className="flex items-center gap-2 bg-surface p-1.5 rounded-2xl border border-subtle">
          <button
            onClick={() => setActiveTab("accounts")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === "accounts"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-muted hover:text-primary"
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>لیست درخواست‌ها ({proAccounts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === "settings"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-muted hover:text-primary"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>تنظیمات و قوانین پکیج پرو</span>
          </button>
          <button
            onClick={() => setActiveTab("discounts")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
              activeTab === "discounts"
                ? "bg-emerald-500 text-slate-950 shadow-md"
                : "text-muted hover:text-primary"
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>کدهای تخفیف و کوپن‌ها</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PRO ACCOUNTS LIST */}
      {activeTab === "accounts" && (
        <div className="space-y-6">
          {/* Filters & Search */}
          <div className="bg-card border border-border-subtle rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-muted absolute right-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو بر اساس نام، نام فروشگاه، کد ملی..."
                className="w-full pr-10 pl-4 py-2 bg-background border border-subtle rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-muted whitespace-nowrap">وضعیت:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-background border border-subtle rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">همه وضعیت‌ها</option>
                <option value="APPROVED">فعال / تایید شده (APPROVED)</option>
                <option value="PENDING">در انتظار بررسی (PENDING)</option>
                <option value="REJECTED">رد شده (REJECTED)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card border border-border-subtle rounded-3xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 text-center text-muted flex flex-col items-center gap-3">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                <span className="text-xs font-bold">در حال بارگذاری متقاضیان...</span>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="p-12 text-center text-muted space-y-2">
                <Crown className="w-10 h-10 mx-auto text-muted/50" />
                <p className="text-sm font-bold text-primary">هیچ درخواستی یافت نشد</p>
                <p className="text-xs">هیچ اکانت پرو متناسب با فیلترهای انتخابی ثبت نشده است.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-surface border-b border-subtle text-muted font-bold">
                    <tr>
                      <th className="p-4">کاربر / مدیر فروشگاه</th>
                      <th className="p-4">نام فروشگاه</th>
                      <th className="p-4">کد ملی & شماره همراه</th>
                      <th className="p-4">دامنه اختصاصی</th>
                      <th className="p-4">وضعیت</th>
                      <th className="p-4">تاریخ ثبت</th>
                      <th className="p-4 text-center">عملیات & دسترسی‌ها</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-subtle">
                    {filteredAccounts.map((acc) => (
                      <tr key={acc.id} className="hover:bg-surface/50 transition-colors">
                        <td className="p-4 font-bold text-primary">
                          {acc.fullName || `${acc.user?.firstName || ""} ${acc.user?.lastName || ""}`}
                          <span className="block text-[10px] text-muted font-normal font-mono">
                            Username: {acc.user?.username} (ID: #{acc.userId})
                          </span>
                        </td>

                        <td className="p-4 font-bold text-secondary">
                          {acc.user?.storeName || acc.user?.brandName || "نامشخص"}
                        </td>

                        <td className="p-4 font-mono text-muted space-y-0.5">
                          <div>کد ملی: {acc.nationalCode || "—"}</div>
                          <div>همراه: {acc.mobile || "—"}</div>
                        </td>

                        <td className="p-4 font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                          {acc.domainName || "تعیین نشده"}
                        </td>

                        <td className="p-4">
                          {acc.status === "APPROVED" || acc.status === "ACTIVE" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> فعال (APPROVED)
                            </span>
                          ) : acc.status === "PENDING_PAYMENT" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20 text-[11px]">
                              <Clock className="w-3.5 h-3.5" /> در انتظار پرداخت
                            </span>
                          ) : acc.status === "PENDING" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/20 text-[11px]">
                              <Clock className="w-3.5 h-3.5" /> در انتظار (PENDING)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20 text-[11px]">
                              <XCircle className="w-3.5 h-3.5" /> رد شده (REJECTED)
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-muted font-mono text-[11px]">
                          {acc.createdAt ? new Date(acc.createdAt).toLocaleDateString("fa-IR") : "—"}
                        </td>

                        <td className="p-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleOpenAccountModal(acc)}
                            className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-slate-950 dark:hover:text-slate-950 font-bold rounded-xl border border-emerald-500/20 transition-all text-xs inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>مدیریت دسترسی‌ها</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GLOBAL PRO SETTINGS */}
      {activeTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="bg-card border border-border-subtle rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="border-b border-border-subtle pb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-primary flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-500" />
                <span>تنظیمات هسته و قوانین پکیج اکانت پرو</span>
              </h2>
              <p className="text-xs text-muted mt-1">
                تعیین نحوه فعال‌سازی، هزینه‌ها، کدهای تخفیف تمدید هاست و متن قرارداد پرو
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Auto Approve Toggle */}
            <div className="bg-surface p-4 rounded-2xl border border-subtle flex items-center justify-between col-span-1 sm:col-span-2">
              <div>
                <span className="text-xs font-black text-primary block">فعال‌سازی و تایید خودکار (Auto Approve):</span>
                <span className="text-[11px] text-muted">در صورت فعال بودن، ثبت‌نام‌های پرو فوراً و بدون نیاز به تایید دستی مدیریت فعال می‌گردند.</span>
              </div>

              <button
                type="button"
                onClick={() => setAutoApprove(!autoApprove)}
                className={`p-2 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                  autoApprove ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {autoApprove ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                <span>{autoApprove ? "فعال خودکار" : "تایید دستی"}</span>
              </button>
            </div>

            {/* Pro Account Price */}
            <div>
              <label className="block text-xs font-bold text-secondary mb-1.5">
                هزینه اولیه ثبت‌نام اکانت پرو (تومان):
              </label>
              <input
                type="number"
                value={proAccountPrice}
                onChange={(e) => setProAccountPrice(e.target.value)}
                placeholder="0 برای رایگان"
                className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs text-primary font-mono text-left focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <span className="text-[10px] text-muted mt-1 block">(در حال حاضر 0/رایگان است)</span>
            </div>

            {/* Promo Code for Host Renewal */}
            <div>
              <label className="block text-xs font-bold text-secondary mb-1.5">
                کد تخفیف بنر تمدید هاست:
              </label>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="مثال: ZOPIT-PRO-198"
                className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs text-primary font-mono text-left focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Original Host Price */}
            <div>
              <label className="block text-xs font-bold text-secondary mb-1.5">
                هزینه اصلی تمدید هاست (قبل از تخفیف - تومان):
              </label>
              <input
                type="number"
                value={hostRenewalPrice}
                onChange={(e) => setHostRenewalPrice(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs text-primary font-mono text-left focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Discounted Host Price */}
            <div>
              <label className="block text-xs font-bold text-secondary mb-1.5">
                هزینه تمدید هاست با تخفیف (قابل پرداخت - تومان):
              </label>
              <input
                type="number"
                value={hostDiscountedPrice}
                onChange={(e) => setHostDiscountedPrice(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs text-primary font-mono text-left focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Torob Service Price */}
            <div>
              <label className="block text-xs font-bold text-secondary mb-1.5">
                هزینه سرویس اتصال به ترب (تومان):
              </label>
              <input
                type="number"
                value={torobPrice}
                onChange={(e) => setTorobPrice(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs text-primary font-mono text-left focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Media URLs Section Header */}
            <div className="col-span-1 sm:col-span-2 pt-4 border-t border-border-subtle">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div>
                  <h3 className="text-xs font-black text-primary flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                    <span>فایل صوتی و پادکست اختصاصی راهنمای اکانت پرو:</span>
                  </h3>
                  <p className="text-[11px] text-muted mt-0.5">
                    این فایل صوتی در پنل مدیران فروشگاه جهت راهنمایی ثبت دامنه، نماد و درگاه پرو پخش می‌شود. می‌توانید لینک مستقیم MP3 وارد کنید یا فایل را از سیستم آپلود نمایید.
                  </p>
                </div>

                {/* Audio File Upload Button */}
                <label className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/20 transition-all self-start sm:self-auto shrink-0">
                  <Upload className="w-4 h-4" />
                  <span>انتخاب و آپلود فایل صوتی از دستگاه</span>
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 30 * 1024 * 1024) {
                        toast("حجم فایل صوتی نباید بیشتر از ۳۰ مگابایت باشد.", "error");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          setProAudioUrl(event.target.result as string);
                          toast("فایل صوتی با موفقیت انتخاب شد. لطفاً دکمه ذخیره تنظیمات را بزنید.", "success");
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Pro Audio Input & Controls */}
            <div className="col-span-1 sm:col-span-2 space-y-2">
              <label className="block text-xs font-bold text-secondary">
                لینک یا فایل ذخیره‌شده صوتی (MP3/WAV/DataURL):
              </label>
              <input
                type="text"
                value={proAudioUrl?.startsWith("data:audio") ? "فایل صوتی از سیستم بارگذاری شده است (Base64)" : proAudioUrl}
                onChange={(e) => setProAudioUrl(e.target.value)}
                disabled={proAudioUrl?.startsWith("data:audio")}
                placeholder="https://.../podcast.mp3"
                className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs text-primary font-mono text-left dir-ltr focus:ring-2 focus:ring-emerald-500 outline-none"
              />

              {proAudioUrl && (
                <div className="flex items-center justify-between bg-slate-900 text-white p-3 rounded-2xl border border-slate-800 text-xs dir-rtl">
                  <span className="truncate max-w-md font-mono text-[11px] text-emerald-300 dir-ltr">
                    {proAudioUrl.startsWith("data:audio") ? "فایل صوتی بارگذاری‌شده از سیستم" : proAudioUrl}
                  </span>
                  <button
                    type="button"
                    onClick={() => setProAudioUrl("")}
                    className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> حذف فایل صوتی
                  </button>
                </div>
              )}
            </div>

            {/* DEDICATED DISCOUNT CODE CUSTOMIZATION FOR PRO PACKAGE */}
            <div className="col-span-1 sm:col-span-2 pt-6 border-t border-border-subtle space-y-4">
              <div className="bg-surface/80 p-5 sm:p-6 rounded-3xl border border-emerald-500/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-subtle">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-primary flex items-center gap-2">
                        <span>سفارشی‌سازی و صدور کد تخفیف برای مبلغ نهایی پکیج اکانت پرو</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">ویژه هزینه اولیه ({parseInt(proAccountPrice || "0").toLocaleString()} تومان)</span>
                      </h3>
                      <p className="text-[11px] text-muted mt-0.5">
                        تعیین کوپن تخفیف با محدودیت تعداد استفاده (سقف مجاز) و محدودیت زمانی اعتبار (انقضا) برای هزینه ثبت‌نام
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab("discounts")}
                    className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 dark:text-emerald-400 hover:text-slate-950 dark:hover:text-slate-950 font-bold rounded-xl border border-emerald-500/20 transition-all text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <BadgePercent className="w-3.5 h-3.5" />
                    <span>مدیریت کامل کوپن‌ها</span>
                  </button>
                </div>

                <div className="pt-2">
                  <SuperAdminDiscountCodes />
                </div>
              </div>
            </div>

            {/* Contract Management Section */}
            <div className="col-span-1 sm:col-span-2 pt-4 border-t border-border-subtle">
              <label className="block text-xs font-black text-primary mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                <span>مدیریت متن کامل قرارداد و شرایط تعهدات اکانت پرو:</span>
              </label>
              <p className="text-[11px] text-muted mb-2">
                این متن هنگام ثبت‌نام و مشاهده قرارداد اکانت پرو به مدیران فروشگاه‌ها به عنوان متن رسمی قرارداد نمایش داده خواهد شد.
              </p>
              <textarea
                rows={8}
                value={termsContent}
                onChange={(e) => setTermsContent(e.target.value)}
                placeholder="متن کامل قرارداد و مفاد تعهدات اکانت پرو را وارد نمایید..."
                className="w-full px-4 py-3 bg-background border border-subtle rounded-2xl text-xs text-primary leading-relaxed focus:ring-2 focus:ring-emerald-500 outline-none resize-y"
              />
            </div>
          </div>

          <div className="pt-4 text-left border-t border-border-subtle">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {savingSettings ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>ذخیره تنظیمات عمومی</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: DEDICATED DISCOUNT CODES MANAGEMENT */}
      {activeTab === "discounts" && (
        <div className="bg-card border border-border-subtle rounded-3xl p-6 md:p-8 shadow-xl">
          <SuperAdminDiscountCodes />
        </div>
      )}

      {/* EDIT & ASSIGN CREDENTIALS MODAL */}
      {selectedAccount && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border-subtle rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl animate-scale-up" dir="rtl">
            <div className="border-b border-border-subtle pb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-primary flex items-center gap-2">
                  <Crown className="w-5 h-5 text-emerald-500" />
                  <span>مدیریت اکانت پرو: {selectedAccount.fullName}</span>
                </h3>
                <span className="text-xs text-muted">فروشگاه: {selectedAccount.user?.storeName || "نامشخص"}</span>
              </div>

              <button
                onClick={() => setSelectedAccount(null)}
                className="text-muted hover:text-primary p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Display Signature Image */}
            {selectedAccount.signatureImage && (
              <div className="bg-surface p-4 rounded-2xl border border-subtle space-y-2">
                <span className="text-xs font-bold text-secondary block">امضای دیجیتال ثبت‌شده:</span>
                <div className="bg-background p-2 rounded-xl border border-subtle text-center">
                  <img
                    src={selectedAccount.signatureImage}
                    alt="امضای کاربر"
                    className="max-h-24 mx-auto object-contain"
                  />
                </div>
              </div>
            )}

            {/* Status Select */}
            <div>
              <label className="block text-xs font-bold text-secondary mb-1.5">وضعیت اکانت پرو:</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs text-primary font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="APPROVED">فعال / تایید شده (APPROVED)</option>
                <option value="PENDING">در انتظار بررسی (PENDING)</option>
                <option value="REJECTED">رد شده (REJECTED)</option>
              </select>
            </div>

            {/* Domain & Credentials Inputs */}
            <div className="space-y-4 pt-2">
              <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 border-b border-subtle pb-2">
                اطلاعات هاست، دامنه و وردپرس تخصیصی:
              </h4>

              <div>
                <label className="block text-[11px] font-bold text-muted mb-1">نام دامنه اختصاصی (مثال: mystore.ir)</label>
                <input
                  type="text"
                  value={editDomain}
                  onChange={(e) => setEditDomain(e.target.value)}
                  placeholder="mystore.ir"
                  className="w-full px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-mono text-left focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted mb-1">لینک cPanel</label>
                  <input
                    type="text"
                    value={editCpanelUrl}
                    onChange={(e) => setEditCpanelUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-mono text-left outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted mb-1">نام کاربری cPanel</label>
                  <input
                    type="text"
                    value={editCpanelUser}
                    onChange={(e) => setEditCpanelUser(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-mono text-left outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted mb-1">کلمه عبور cPanel</label>
                  <input
                    type="text"
                    value={editCpanelPass}
                    onChange={(e) => setEditCpanelPass(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-mono text-left outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted mb-1">لینک WP Admin</label>
                  <input
                    type="text"
                    value={editWpUrl}
                    onChange={(e) => setEditWpUrl(e.target.value)}
                    placeholder="https://.../wp-admin"
                    className="w-full px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-mono text-left outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted mb-1">نام کاربری وردپرس</label>
                  <input
                    type="text"
                    value={editWpUser}
                    onChange={(e) => setEditWpUser(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-mono text-left outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-muted mb-1">کلمه عبور وردپرس</label>
                  <input
                    type="text"
                    value={editWpPass}
                    onChange={(e) => setEditWpPass(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-mono text-left outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedAccount(null)}
                className="px-5 py-2.5 bg-surface text-muted font-bold text-xs rounded-xl hover:bg-subtle"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveAccount}
                disabled={savingAccount}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {savingAccount ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>ذخیره تغییرات و ارسال اطلاعات</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
