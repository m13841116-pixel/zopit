import React, { useState, useEffect } from "react";
import {
  FileCheck,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Layers,
  FileSpreadsheet,
  FileText,
  Paperclip,
  Send,
  HelpCircle,
  ExternalLink,
  Trash2,
  MessageSquare,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  Info
} from "lucide-react";

interface AttachmentItem {
  url: string;
  filename?: string;
  size?: number;
}

interface CompletionStats {
  receivedCount?: number;
  createdCount?: number;
  correctionCount?: number;
  rejectedCount?: number;
}

interface ConciergeRequest {
  id: number;
  userId: number;
  subject: string;
  department: string;
  priority: string;
  status: "SUBMITTED" | "IN_REVIEW" | "PROCESSING" | "NEEDS_INFO" | "COMPLETED" | "CANCELLED" | string;
  approxProductCount: number | null;
  categories: string | null;
  catalogUrl: string | null;
  websiteUrl: string | null;
  attachmentsList?: AttachmentItem[];
  completionData?: CompletionStats | null;
  createdAt: string;
  updatedAt: string;
  messages: Array<{
    id: number;
    ticketId: number;
    userId: number;
    message: string;
    attachmentUrl?: string | null;
    createdAt: string;
    user?: {
      firstName?: string;
      lastName?: string;
      role?: string;
    };
  }>;
}

interface SupplierConciergeImportProps {
  user?: any;
  onBack?: () => void;
  onNavigateToAddProduct?: () => void;
  onNavigateToProducts?: () => void;
}

export function SupplierConciergeImport({
  user: propUser,
  onBack,
  onNavigateToAddProduct,
  onNavigateToProducts
}: SupplierConciergeImportProps) {
  const user = propUser || (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  })();
  const [activeSubTab, setActiveSubTab] = useState<"new" | "history">("new");
  
  // Form State
  const [title, setTitle] = useState("");
  const [approxProductCount, setApproxProductCount] = useState<number | "">("");
  const [selectedCategory, setSelectedCategory] = useState("دیجیتال و لوازم جانبی");
  const [customCategory, setCustomCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [catalogUrl, setCatalogUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // History State
  const [requests, setRequests] = useState<ConciergeRequest[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ConciergeRequest | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  const predefinedCategories = [
    "دیجیتال و لوازم جانبی",
    "مد، پوشاک و کفش",
    "خانه، آشپزخانه و دکوراسیون",
    "آرایشی، بهداشتی و مراقبت",
    "ابزارآلات، خودرو و صنعتی",
    "ورزش، سفر و کوهنوردی",
    "کتاب، اسباب‌بازی و فرهنگی",
    "سایر حوزه‌ها"
  ];

  const fetchRequests = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/supplier/concierge-requests", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
        // Update selected if open
        if (selectedRequest) {
          const updated = (data as ConciergeRequest[]).find(r => r.id === selectedRequest.id);
          if (updated) setSelectedRequest(updated);
        }
      }
    } catch (err) {
      console.error("Error fetching concierge requests:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setFormError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) {
        setFormError(`حجم فایل "${file.name}" بیش از حد مجاز (حداکثر ۱۰ مگابایت) است.`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          },
          body: formData
        });

        if (res.ok) {
          const data = await res.json();
          setAttachments(prev => [
            ...prev,
            {
              url: data.url,
              filename: data.filename || file.name,
              size: file.size
            }
          ]);
        } else {
          const errData = await res.json().catch(() => ({}));
          setFormError(errData.error || `خطا در آپلود فایل "${file.name}"`);
        }
      } catch (err) {
        setFormError(`خطای شبکه در هنگام آپلود فایل "${file.name}"`);
      }
    }

    setUploading(false);
    e.target.value = "";
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const categoryFinal = selectedCategory === "سایر حوزه‌ها"
      ? (customCategory.trim() || "عمومی")
      : selectedCategory;

    if (!title.trim()) {
      setFormError("لطفاً یک عنوان برای درخواست خود وارد فرمایید (مثلاً: کاتالوگ محصولات برقی).");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        approxProductCount: typeof approxProductCount === "number" ? approxProductCount : 0,
        categories: categoryFinal,
        catalogUrl: catalogUrl.trim() || null,
        websiteUrl: websiteUrl.trim() || null,
        notes: notes.trim(),
        attachments
      };

      const res = await fetch("/api/supplier/concierge-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setFormSuccess("درخواست شما با موفقیت ثبت شد! کارشناسان زوپیت به زودی بررسی و ثبت اولیه کاتالوگ شما را آغاز خواهند کرد.");
        // Reset form
        setTitle("");
        setApproxProductCount("");
        setNotes("");
        setCatalogUrl("");
        setWebsiteUrl("");
        setAttachments([]);
        setCustomCategory("");
        // Reload list and switch to history
        await fetchRequests();
        setTimeout(() => {
          setActiveSubTab("history");
        }, 1200);
      } else {
        setFormError(data.error || "خطا در ثبت درخواست. لطفاً دوباره تلاش کنید.");
      }
    } catch (err: any) {
      setFormError("خطای ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی نمایید.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !replyText.trim()) return;

    setSendingReply(true);
    setReplyError(null);

    try {
      const res = await fetch(`/api/supplier/concierge-requests/${selectedRequest.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ message: replyText.trim() })
      });

      if (res.ok) {
        setReplyText("");
        await fetchRequests();
      } else {
        const err = await res.json().catch(() => ({}));
        setReplyError(err.error || "خطا در ارسال پیام.");
      }
    } catch (err) {
      setReplyError("خطا در ارسال پیام.");
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5" /> ثبت شده (در انتظار بررسی)
          </span>
        );
      case "IN_REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> در حال بررسی اولیه
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Sparkles className="w-3.5 h-3.5" /> در حال ورود محصولات به سیستم
          </span>
        );
      case "NEEDS_INFO":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> نیاز به اطلاعات تکمیلی
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> تکمیل شد
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface text-text-muted border border-border-default">
            <X className="w-3.5 h-3.5" /> لغو شد
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface text-text-secondary border border-border-default">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6" dir="rtl">
      {/* Value Proposition Header */}
      <div className="bg-gradient-to-l from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              خدمت اختصاصی زوپیت: ورود کاتالوگ توسط کارشناس
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-text-primary tracking-tight">
              محصولاتم را شما وارد کنید
            </h1>
            <p className="text-sm text-text-secondary leading-relaxed max-w-3xl">
              لازم نیست حتماً فنی باشید یا فایل اکسل استاندارد داشته باشید تا محصولاتتان در زوپیت عرضه شود.
              کافیست لیست، فایل کاتالوگ یا پی‌دی‌اف محصولاتتان را برای ما بفرستید؛ کارشناسان زوپیت اطلاعات و عکس‌های اولیه را وارد و جهت تایید نهایی برای شما آماده می‌کنند.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-card border border-border-default hover:bg-surface text-text-primary transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <ArrowRight className="w-4 h-4" />
                بازگشت به محصولات
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-border-subtle pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveSubTab("new");
              setSelectedRequest(null);
            }}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
              activeSubTab === "new"
                ? "bg-primary-default text-white shadow-md shadow-primary-default/20"
                : "text-text-secondary hover:bg-surface hover:text-text-primary"
            }`}
          >
            <Upload className="w-4 h-4" />
            ثبت درخواست جدید
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSubTab("history");
              fetchRequests();
            }}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 relative ${
              activeSubTab === "history"
                ? "bg-primary-default text-white shadow-md shadow-primary-default/20"
                : "text-text-secondary hover:bg-surface hover:text-text-primary"
            }`}
          >
            <Clock className="w-4 h-4" />
            پیگیری درخواست‌ها و تاریخچه
            {requests.length > 0 && (
              <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                activeSubTab === "history" ? "bg-white text-primary-default" : "bg-primary-default/10 text-primary-default"
              }`}>
                {requests.length}
              </span>
            )}
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            امنیت کامل فایل‌ها و اطلاعات
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-primary-default" />
            بررسی توسط تیم فنی زوپیت
          </span>
        </div>
      </div>

      {/* Sub-Tab 1: New Request Form */}
      {activeSubTab === "new" && (
        <form onSubmit={handleSubmitRequest} className="space-y-6">
          {formSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium flex items-center gap-3 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-sm font-medium flex items-center gap-3 animate-fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}

          {/* Supplier Identity Card (Read-only verification) */}
          <div className="bg-card border border-border-default rounded-2xl p-4 sm:p-5 shadow-xs">
            <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
              اطلاعات حساب تامین‌کننده
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-surface rounded-xl border border-border-subtle">
                <span className="text-xs text-text-muted block">نام و نام خانوادگی:</span>
                <span className="font-bold text-text-primary mt-0.5 block truncate">
                  {user?.firstName || ""} {user?.lastName || user?.username || "تامین‌کننده"}
                </span>
              </div>
              <div className="p-3 bg-surface rounded-xl border border-border-subtle">
                <span className="text-xs text-text-muted block">نام برند / فروشگاه:</span>
                <span className="font-bold text-text-primary mt-0.5 block truncate">
                  {user?.brandName || user?.storeName || "ثبت نشده"}
                </span>
              </div>
              <div className="p-3 bg-surface rounded-xl border border-border-subtle">
                <span className="text-xs text-text-muted block">شناسه تامین‌کننده در سیستم:</span>
                <span className="font-mono font-bold text-primary-default mt-0.5 block">
                  #{user?.id || user?.userId || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Request Details */}
          <div className="bg-card border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary-default" />
              مشخصات کاتالوگ و محصولات
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">
                  عنوان درخواست <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: کاتالوگ بهاره لوازم جانبی موبایل و هدفون"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-default text-text-primary text-sm focus:outline-hidden focus:border-primary-default focus:ring-1 focus:ring-primary-default transition-all"
                  required
                />
                <p className="text-[11px] text-text-muted mt-1">
                  یک عنوان کوتاه که کاتالوگ یا حوزه محصولات ارسالی را مشخص کند.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">
                  تعداد تقریبی کالاها (اختیاری)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={approxProductCount}
                  onChange={(e) => setApproxProductCount(e.target.value ? parseInt(e.target.value) : "")}
                  placeholder="مثال: ۱۲۰"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-default text-text-primary text-sm focus:outline-hidden focus:border-primary-default focus:ring-1 focus:ring-primary-default transition-all"
                />
                <p className="text-[11px] text-text-muted mt-1">
                  تخمین حدودی از تعداد اقلام به برنامه‌ریزی سریع‌تر تیم ورود کالا کمک می‌کند.
                </p>
              </div>
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-2">
                حوزه فعالیت / دسته‌بندی کالاها
              </label>
              <div className="flex flex-wrap gap-2">
                {predefinedCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                      selectedCategory === cat
                        ? "bg-primary-default text-white border-primary-default shadow-xs"
                        : "bg-surface text-text-secondary border-border-default hover:border-primary-default/50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {selectedCategory === "سایر حوزه‌ها" && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="نام حوزه کاری خود را بنویسید..."
                    className="w-full sm:w-1/2 px-3.5 py-2 rounded-xl bg-surface border border-border-default text-text-primary text-sm"
                  />
                </div>
              )}
            </div>

            {/* Optional Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-border-subtle">
              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
                  لینک کاتالوگ آنلاین (اختیاری)
                </label>
                <input
                  type="url"
                  value={catalogUrl}
                  onChange={(e) => setCatalogUrl(e.target.value)}
                  placeholder="https://drive.google.com/... یا لینک ایتا / تلگرام"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-default text-text-primary text-sm font-ltr text-left"
                />
                <p className="text-[11px] text-text-muted mt-1">
                  اگر کاتالوگ شما در گوگل‌درایو، دراپ‌باکس یا کانال بارگذاری شده، لینک آن را اینجا قرار دهید.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
                  آدرس وب‌سایت یا پیج اینستاگرام (اختیاری)
                </label>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yoursite.com یا @your_store"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-default text-text-primary text-sm font-ltr text-left"
                />
                <p className="text-[11px] text-text-muted mt-1">
                  جهت دسترسی به عکس‌های باکیفیت‌تر محصولات و بررسی موجودی.
                </p>
              </div>
            </div>

            {/* Supplier Notes */}
            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">
                توضیحات تکمیلی یا نکات مهم برای کارشناس زوپیت
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="هر نکته‌ای که در مورد قیمت‌های پایه، شرایط گارانتی، بسته‌بندی، متغیرهای سایز یا رنگ محصولات دارید در این قسمت بنویسید..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border-default text-text-primary text-sm focus:outline-hidden focus:border-primary-default focus:ring-1 focus:ring-primary-default"
              />
            </div>
          </div>

          {/* Attachments Section */}
          <div className="bg-card border border-border-default rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <Paperclip className="w-5 h-5 text-primary-default" />
                  ضمیمه کردن فایل‌ها و کاتالوگ‌ها
                </h2>
                <p className="text-xs text-text-muted mt-0.5">
                  فرمت‌های مجاز: فایل‌های اکسل (XLSX, XLS)، متن (CSV, TXT)، اسناد (PDF)، تصاویر (JPG, PNG, WEBP) و فایل‌های فشرده (ZIP)
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-surface border border-border-default rounded-lg text-text-secondary">
                حداکثر ۱۰ مگابایت برای هر فایل
              </span>
            </div>

            {/* Drag & drop upload area */}
            <div className="relative border-2 border-dashed border-border-default hover:border-primary-default/60 rounded-2xl p-6 text-center transition-all bg-surface/30 group">
              <input
                type="file"
                multiple
                accept=".xlsx,.xls,.csv,.txt,.pdf,.jpg,.jpeg,.png,.webp,.zip"
                onChange={handleFileUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-primary-default/10 text-primary-default flex items-center justify-center group-hover:scale-110 transition-transform">
                  {uploading ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                <div className="text-sm font-bold text-text-primary">
                  {uploading ? "در حال آپلود و اعتبارسنجی فایل..." : "برای انتخاب فایل کلیک کنید یا فایل را اینجا بکشید و رها کنید"}
                </div>
                <p className="text-xs text-text-muted">
                  می‌توانید کاتالوگ پی‌دی‌اف، فایل اکسل بدون فرمت خاص، یا آرشیو تصاویر را ارسال فرمایید.
                </p>
              </div>
            </div>

            {/* Uploaded attachments preview */}
            {attachments.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold text-text-muted">
                  فایل‌های پیوست‌شده ({attachments.length}):
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border-subtle text-sm"
                    >
                      <div className="flex items-center gap-2.5 truncate max-w-[85%]">
                        <FileText className="w-4 h-4 text-primary-default shrink-0" />
                        <span className="font-medium text-text-primary truncate" dir="ltr">
                          {att.filename || `فایل شماره ${idx + 1}`}
                        </span>
                        {att.size && (
                          <span className="text-[11px] text-text-muted shrink-0">
                            ({(att.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="p-1 rounded-lg text-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="حذف فایل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="text-xs text-text-muted leading-relaxed">
              <span className="font-bold text-text-primary block">تضمین کیفیت و تایید دوطرفه:</span>
              محصولات ایجاد شده مستقیماً در وضعیت «در انتظار تایید» قرار می‌گیرند و هرگز بدون تعیین مارجین و بررسی شما و مدیریت منتشر نخواهند شد.
            </div>

            <button
              type="submit"
              disabled={submitting || uploading}
              className="w-full sm:w-auto px-7 py-3 rounded-xl bg-primary-default text-white font-bold text-sm hover:bg-primary-hover shadow-lg shadow-primary-default/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  در حال ثبت درخواست...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  ارسال کاتالوگ و ثبت درخواست
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Sub-Tab 2: History & Tracking */}
      {activeSubTab === "history" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-text-primary">
                تاریخچه درخواست‌های ورود محصول
              </h2>
              <p className="text-xs text-text-muted">
                مشاهده وضعیت پرونده‌ها، گفتگو با کارشناس زوپیت و پیگیری تعداد کالاهای ثبت‌شده
              </p>
            </div>

            <button
              type="button"
              onClick={fetchRequests}
              disabled={loadingHistory}
              className="px-3.5 py-1.5 rounded-xl bg-surface border border-border-default text-text-secondary hover:text-text-primary text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? "animate-spin" : ""}`} />
              بروزرسانی لیست
            </button>
          </div>

          {loadingHistory && requests.length === 0 ? (
            <div className="p-12 text-center text-text-muted bg-card rounded-2xl border border-border-default">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-primary-default" />
              <p className="text-sm font-medium">در حال دریافت تاریخچه درخواست‌ها...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center bg-card rounded-2xl border border-border-default space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-surface border border-border-default flex items-center justify-center mx-auto text-text-muted">
                <FileCheck className="w-8 h-8 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">
                  هنوز درخواستی ثبت نکرده‌اید
                </h3>
                <p className="text-xs text-text-muted mt-1 max-w-md mx-auto">
                  اگر کاتالوگ یا لیست قیمتی دارید، از تب «ثبت درخواست جدید» آن را برای ما ارسال کنید تا تیم زوپیت ورود اطلاعات اولیه را برای شما انجام دهد.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveSubTab("new")}
                className="px-5 py-2.5 rounded-xl bg-primary-default text-white font-bold text-xs hover:bg-primary-hover shadow-md transition-all"
              >
                ثبت اولین درخواست
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="bg-card border border-border-default hover:border-primary-default/40 rounded-2xl p-5 shadow-xs transition-all space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border-subtle pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 font-bold">
                        #{req.id}
                      </div>
                      <div>
                        <h3 className="font-bold text-text-primary text-sm sm:text-base">
                          {req.subject}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-text-muted mt-0.5">
                          <span>
                            تاریخ ثبت:{" "}
                            {new Date(req.createdAt).toLocaleDateString("fa-IR")}
                          </span>
                          {req.categories && (
                            <>
                              <span>•</span>
                              <span>حوزه: {req.categories}</span>
                            </>
                          )}
                          {req.approxProductCount && req.approxProductCount > 0 && (
                            <>
                              <span>•</span>
                              <span>تعداد تقریبی: {req.approxProductCount} کالا</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      {getStatusBadge(req.status)}
                      <button
                        type="button"
                        onClick={() => setSelectedRequest(req)}
                        className="px-3.5 py-1.5 rounded-xl bg-primary-default/10 text-primary-default hover:bg-primary-default hover:text-white text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        مشاهده پرونده و گفتگو
                      </button>
                    </div>
                  </div>

                  {/* Completion Statistics Banner if Completed */}
                  {req.status === "COMPLETED" && req.completionData && (
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        نتیجه نهایی ورود کاتالوگ:
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                        <div className="bg-card/70 p-2 rounded-lg border border-border-subtle">
                          <span className="text-text-muted block text-[11px]">محصولات دریافتی:</span>
                          <span className="font-bold text-text-primary text-sm mt-0.5 block">
                            {req.completionData.receivedCount || req.approxProductCount || 0}
                          </span>
                        </div>
                        <div className="bg-card/70 p-2 rounded-lg border border-border-subtle">
                          <span className="text-emerald-600 dark:text-emerald-400 block text-[11px]">ایجاد شده در سیستم:</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5 block">
                            {req.completionData.createdCount || 0}
                          </span>
                        </div>
                        <div className="bg-card/70 p-2 rounded-lg border border-border-subtle">
                          <span className="text-amber-600 dark:text-amber-400 block text-[11px]">نیازمند اصلاح:</span>
                          <span className="font-bold text-amber-600 dark:text-amber-400 text-sm mt-0.5 block">
                            {req.completionData.correctionCount || 0}
                          </span>
                        </div>
                        <div className="bg-card/70 p-2 rounded-lg border border-border-subtle">
                          <span className="text-text-muted block text-[11px]">رد شده / نادیده:</span>
                          <span className="font-bold text-text-muted text-sm mt-0.5 block">
                            {req.completionData.rejectedCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Summary preview */}
                  <div className="flex flex-wrap items-center justify-between text-xs text-text-muted gap-2">
                    <div className="flex items-center gap-4">
                      {req.attachmentsList && req.attachmentsList.length > 0 && (
                        <span className="flex items-center gap-1 text-text-secondary">
                          <Paperclip className="w-3.5 h-3.5 text-primary-default" />
                          {req.attachmentsList.length} فایل ضمیمه
                        </span>
                      )}
                      {req.catalogUrl && (
                        <a
                          href={req.catalogUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-primary-default hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          لینک کاتالوگ آنلاین
                        </a>
                      )}
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {req.messages?.length || 0} پیام
                      </span>
                    </div>

                    {req.status === "COMPLETED" && onNavigateToProducts && (
                      <button
                        type="button"
                        onClick={onNavigateToProducts}
                        className="text-xs font-bold text-primary-default hover:underline flex items-center gap-1"
                      >
                        مشاهده کالاهای ثبت شده در پنل من
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detail & Chat Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border-default rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border-subtle bg-surface/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-default/10 text-primary-default flex items-center justify-center font-bold">
                  #{selectedRequest.id}
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-base">
                    {selectedRequest.subject}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
                    <span>ثبت در {new Date(selectedRequest.createdAt).toLocaleDateString("fa-IR")}</span>
                    <span>•</span>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              {/* Stepper */}
              <div className="bg-surface/50 p-4 rounded-xl border border-border-subtle">
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className={`p-2 rounded-lg ${selectedRequest.status === "SUBMITTED" ? "bg-primary-default text-white font-bold" : "bg-card text-text-secondary"}`}>
                    ۱. ثبت درخواست
                  </div>
                  <div className={`p-2 rounded-lg ${selectedRequest.status === "IN_REVIEW" ? "bg-amber-500 text-white font-bold" : "bg-card text-text-secondary"}`}>
                    ۲. بررسی کاتالوگ
                  </div>
                  <div className={`p-2 rounded-lg ${selectedRequest.status === "PROCESSING" ? "bg-purple-500 text-white font-bold" : "bg-card text-text-secondary"}`}>
                    ۳. ورود کالاها
                  </div>
                  <div className={`p-2 rounded-lg ${selectedRequest.status === "COMPLETED" ? "bg-emerald-500 text-white font-bold" : "bg-card text-text-secondary"}`}>
                    ۴. تکمیل نهایی
                  </div>
                </div>
              </div>

              {/* Completion Stats Banner */}
              {selectedRequest.status === "COMPLETED" && selectedRequest.completionData && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    گزارش نهایی کارشناس ورود اطلاعات زوپیت
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs pt-1">
                    <div className="bg-card p-2 rounded-lg border border-border-subtle">
                      <span className="text-text-muted block text-[11px]">محصولات دریافتی:</span>
                      <span className="font-bold text-text-primary text-sm mt-0.5 block">
                        {selectedRequest.completionData.receivedCount || selectedRequest.approxProductCount || 0}
                      </span>
                    </div>
                    <div className="bg-card p-2 rounded-lg border border-border-subtle">
                      <span className="text-emerald-600 block text-[11px]">ایجاد شده:</span>
                      <span className="font-bold text-emerald-600 text-sm mt-0.5 block">
                        {selectedRequest.completionData.createdCount || 0}
                      </span>
                    </div>
                    <div className="bg-card p-2 rounded-lg border border-border-subtle">
                      <span className="text-amber-600 block text-[11px]">نیازمند اصلاح:</span>
                      <span className="font-bold text-amber-600 text-sm mt-0.5 block">
                        {selectedRequest.completionData.correctionCount || 0}
                      </span>
                    </div>
                    <div className="bg-card p-2 rounded-lg border border-border-subtle">
                      <span className="text-text-muted block text-[11px]">رد شده:</span>
                      <span className="font-bold text-text-muted text-sm mt-0.5 block">
                        {selectedRequest.completionData.rejectedCount || 0}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80 pt-1">
                    محصولات وارد شده در لیست محصولات شما به صورت «در انتظار تایید» قرار گرفته‌اند تا پس از تعیین مارجین مدیریت زوپیت، در پلتفرم منتشر گردند.
                  </p>
                </div>
              )}

              {/* Attached files */}
              {selectedRequest.attachmentsList && selectedRequest.attachmentsList.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-text-muted mb-2 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4" />
                    فایل‌های ضمیمه شده به این درخواست:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedRequest.attachmentsList.map((att, idx) => (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-border-subtle hover:border-primary-default/40 text-xs font-medium text-text-primary transition-colors"
                      >
                        <span className="truncate max-w-[80%]" dir="ltr">
                          {att.filename || `دانلود فایل شماره ${idx + 1}`}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5 text-primary-default shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages Thread */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-text-muted flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  گفتگو و توضیحات پرونده
                </h4>

                <div className="space-y-3">
                  {selectedRequest.messages?.map((msg) => {
                    const isMe = msg.userId === user?.id || msg.userId === user?.userId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-start" : "items-end"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                            isMe
                              ? "bg-surface border border-border-default text-text-primary rounded-tr-none"
                              : "bg-primary-default/10 border border-primary-default/20 text-text-primary rounded-tl-none"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[11px] text-text-muted mb-1 border-b border-border-subtle pb-1">
                            <span className="font-bold">
                              {isMe ? "شما (تامین‌کننده)" : "پشتیبانی و کارشناس زوپیت"}
                            </span>
                            <span>{new Date(msg.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                          {msg.attachmentUrl && (
                            <div className="mt-2 pt-2 border-t border-border-subtle">
                              <a
                                href={msg.attachmentUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-primary-default font-bold hover:underline inline-flex items-center gap-1"
                              >
                                <Paperclip className="w-3.5 h-3.5" />
                                دانلود فایل پیوست
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer Reply Box */}
            <form onSubmit={handleSendReply} className="p-4 border-t border-border-subtle bg-surface/50 shrink-0">
              {replyError && (
                <div className="text-xs text-rose-500 mb-2 font-medium">
                  {replyError}
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="پاسخ خود یا توضیحات تکمیلی را اینجا بنویسید..."
                  className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-border-default text-text-primary text-sm focus:outline-hidden focus:border-primary-default"
                />
                <button
                  type="submit"
                  disabled={sendingReply || !replyText.trim()}
                  className="px-5 py-2.5 rounded-xl bg-primary-default text-white font-bold text-xs hover:bg-primary-hover transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0"
                >
                  {sendingReply ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  ارسال پیام
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
