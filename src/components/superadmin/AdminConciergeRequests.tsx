import React, { useState, useEffect } from "react";
import {
  FileCheck,
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Lock,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  PlusCircle,
  Package,
  User,
  Phone,
  Layers,
  Paperclip,
  Send,
  X,
  Tag,
  ShieldCheck,
  Check,
  Building
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
  internalNotes?: string | null;
  attachmentsList?: AttachmentItem[];
  completionData?: CompletionStats | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    firstName?: string;
    lastName?: string;
    brandName?: string;
    storeName?: string;
    mobile?: string;
    email?: string;
    username?: string;
  };
  messages: Array<{
    id: number;
    ticketId: number;
    userId: number;
    message: string;
    attachmentUrl?: string | null;
    isInternal?: boolean;
    createdAt: string;
    user?: {
      firstName?: string;
      lastName?: string;
      role?: string;
    };
  }>;
}

export default function AdminConciergeRequests() {
  const [requests, setRequests] = useState<ConciergeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedRequest, setSelectedRequest] = useState<ConciergeRequest | null>(null);

  // Status update state
  const [newStatus, setNewStatus] = useState("");
  const [internalNotesText, setInternalNotesText] = useState("");
  const [completionStats, setCompletionStats] = useState<CompletionStats>({
    receivedCount: 0,
    createdCount: 0,
    correctionCount: 0,
    rejectedCount: 0
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Message / Note state
  const [messageText, setMessageText] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Product Creation Modal State
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);
  const [categoriesList, setCategoriesList] = useState<any[]>([]);
  const [productForm, setProductForm] = useState({
    name: "",
    categoryId: "",
    supplierBasePrice: "",
    stock: "10",
    sku: "",
    brand: "",
    mainImage: "",
    shortDescription: "",
    targetStatus: "PENDING_APPROVAL"
  });
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [productSuccess, setProductSuccess] = useState<string | null>(null);
  const [productError, setProductError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/concierge-requests", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(Array.isArray(data) ? data : []);
        if (selectedRequest) {
          const updated = (data as ConciergeRequest[]).find(r => r.id === selectedRequest.id);
          if (updated) setSelectedRequest(updated);
        }
      }
    } catch (err) {
      console.error("Error fetching concierge requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      if (res.ok) {
        const data = await res.json();
        setCategoriesList(Array.isArray(data) ? data : []);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchRequests();
    fetchCategories();
  }, []);

  const openDossier = (req: ConciergeRequest) => {
    setSelectedRequest(req);
    setNewStatus(req.status);
    setInternalNotesText(req.internalNotes || "");
    if (req.completionData) {
      setCompletionStats({
        receivedCount: req.completionData.receivedCount || req.approxProductCount || 0,
        createdCount: req.completionData.createdCount || 0,
        correctionCount: req.completionData.correctionCount || 0,
        rejectedCount: req.completionData.rejectedCount || 0
      });
    } else {
      setCompletionStats({
        receivedCount: req.approxProductCount || 0,
        createdCount: 0,
        correctionCount: 0,
        rejectedCount: 0
      });
    }
    setStatusMessage(null);
    setProductSuccess(null);
    setProductError(null);
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setUpdatingStatus(true);
    setStatusMessage(null);

    try {
      const payload: any = {
        status: newStatus,
        internalNotes: internalNotesText
      };

      if (newStatus === "COMPLETED") {
        payload.completionStats = completionStats;
      }

      const res = await fetch(`/api/admin/concierge-requests/${selectedRequest.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMessage("وضعیت پرونده با موفقیت ذخیره و پیام اطلاع‌رسانی برای تامین‌کننده ارسال گردید.");
        await fetchRequests();
      } else {
        setStatusMessage("خطا در به‌روزرسانی: " + (data.error || "خطای نامشخص"));
      }
    } catch (err: any) {
      setStatusMessage("خطای ارتباط با سرور.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !messageText.trim()) return;

    setSendingMessage(true);
    try {
      const res = await fetch(`/api/admin/concierge-requests/${selectedRequest.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          message: messageText.trim(),
          isInternal: isInternalNote
        })
      });

      if (res.ok) {
        setMessageText("");
        setIsInternalNote(false);
        await fetchRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setCreatingProduct(true);
    setProductError(null);
    setProductSuccess(null);

    try {
      const res = await fetch(`/api/admin/concierge-requests/${selectedRequest.id}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(productForm)
      });

      const data = await res.json();
      if (res.ok) {
        setProductSuccess(`محصول "${data.product?.name}" با وضعیت ${data.product?.status === "PENDING_APPROVAL" ? "در انتظار تایید" : "پیش‌نویس"} با موفقیت برای تامین‌کننده ثبت شد.`);
        // Auto-increment createdCount in completion stats
        setCompletionStats(prev => ({
          ...prev,
          createdCount: (prev.createdCount || 0) + 1
        }));
        // Reset form
        setProductForm({
          name: "",
          categoryId: categoriesList[0]?.id || "",
          supplierBasePrice: "",
          stock: "10",
          sku: "",
          brand: selectedRequest.user?.brandName || "",
          mainImage: "",
          shortDescription: "",
          targetStatus: "PENDING_APPROVAL"
        });
      } else {
        setProductError(data.error || "خطا در ثبت محصول");
      }
    } catch (err) {
      setProductError("خطای شبکه در هنگام ثبت محصول.");
    } finally {
      setCreatingProduct(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5" /> جدید / ثبت شده
          </span>
        );
      case "IN_REVIEW":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> در حال بررسی
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <Sparkles className="w-3.5 h-3.5" /> در حال ورود کالاها
          </span>
        );
      case "NEEDS_INFO":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" /> نیازمند اطلاعات
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> تکمیل شده
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface text-text-muted border border-border-default">
            <X className="w-3.5 h-3.5" /> لغو شده
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

  const filteredRequests = requests.filter((r) => {
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesStatus;

    const matchesSubject = r.subject.toLowerCase().includes(query);
    const matchesSupplier =
      `${r.user?.firstName || ""} ${r.user?.lastName || ""} ${r.user?.brandName || ""} ${r.user?.mobile || ""}`
        .toLowerCase()
        .includes(query);
    const matchesId = String(r.id) === query;

    return matchesStatus && (matchesSubject || matchesSupplier || matchesId);
  });

  // Summary Metrics
  const stats = {
    total: requests.length,
    submitted: requests.filter((r) => r.status === "SUBMITTED").length,
    inReview: requests.filter((r) => r.status === "IN_REVIEW").length,
    processing: requests.filter((r) => r.status === "PROCESSING").length,
    needsInfo: requests.filter((r) => r.status === "NEEDS_INFO").length,
    completed: requests.filter((r) => r.status === "COMPLETED").length
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-text-primary flex items-center gap-2.5">
            <FileCheck className="w-6 h-6 text-amber-500" />
            درخواست‌های ورود محصول (خدمت اختصاصی زوپیت)
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            مدیریت کاتالوگ‌ها و لیست‌های ارسالی توسط تامین‌کنندگان جهت ورود اولیه اطلاعات، تصاویر و قیمت‌های پایه
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRequests}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-surface border border-border-default text-text-secondary hover:text-text-primary text-xs font-bold flex items-center gap-2 self-start sm:self-center transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          بروزرسانی داده‌ها
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => setStatusFilter("ALL")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "ALL"
              ? "bg-primary-default/10 border-primary-default shadow-xs"
              : "bg-card border-border-default hover:border-primary-default/30"
          }`}
        >
          <span className="text-xs text-text-muted block">کل پرونده‌ها</span>
          <span className="text-xl font-black text-text-primary mt-1 block">
            {stats.total}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("SUBMITTED")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "SUBMITTED"
              ? "bg-blue-500/15 border-blue-500 shadow-xs"
              : "bg-card border-border-default hover:border-blue-500/30"
          }`}
        >
          <span className="text-xs text-blue-600 dark:text-blue-400 block font-bold">جدید / ثبت شده</span>
          <span className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
            {stats.submitted}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("IN_REVIEW")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "IN_REVIEW"
              ? "bg-amber-500/15 border-amber-500 shadow-xs"
              : "bg-card border-border-default hover:border-amber-500/30"
          }`}
        >
          <span className="text-xs text-amber-600 dark:text-amber-400 block font-bold">در حال بررسی</span>
          <span className="text-xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {stats.inReview}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("PROCESSING")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "PROCESSING"
              ? "bg-purple-500/15 border-purple-500 shadow-xs"
              : "bg-card border-border-default hover:border-purple-500/30"
          }`}
        >
          <span className="text-xs text-purple-600 dark:text-purple-400 block font-bold">در حال ورود کالا</span>
          <span className="text-xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
            {stats.processing}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("NEEDS_INFO")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "NEEDS_INFO"
              ? "bg-rose-500/15 border-rose-500 shadow-xs"
              : "bg-card border-border-default hover:border-rose-500/30"
          }`}
        >
          <span className="text-xs text-rose-600 dark:text-rose-400 block font-bold">نیاز به اطلاعات</span>
          <span className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {stats.needsInfo}
          </span>
        </div>

        <div
          onClick={() => setStatusFilter("COMPLETED")}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === "COMPLETED"
              ? "bg-emerald-500/15 border-emerald-500 shadow-xs"
              : "bg-card border-border-default hover:border-emerald-500/30"
          }`}
        >
          <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-bold">تکمیل شده</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {stats.completed}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card p-3 sm:p-4 rounded-2xl border border-border-default">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-text-muted absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در نام تامین‌کننده، برند، شماره تلفن یا عنوان..."
            className="w-full pr-10 pl-4 py-2 rounded-xl bg-surface border border-border-default text-text-primary text-xs focus:outline-hidden focus:border-primary-default"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-text-muted shrink-0" />
          {["ALL", "SUBMITTED", "IN_REVIEW", "PROCESSING", "NEEDS_INFO", "COMPLETED"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === st
                  ? "bg-primary-default text-white"
                  : "bg-surface text-text-secondary hover:text-text-primary border border-border-subtle"
              }`}
            >
              {st === "ALL" && "همه"}
              {st === "SUBMITTED" && "جدید"}
              {st === "IN_REVIEW" && "در بررسی"}
              {st === "PROCESSING" && "در حال ورود"}
              {st === "NEEDS_INFO" && "نیاز به اطلاعات"}
              {st === "COMPLETED" && "تکمیل"}
            </button>
          ))}
        </div>
      </div>

      {/* Requests Table */}
      {loading ? (
        <div className="p-16 text-center text-text-muted bg-card rounded-2xl border border-border-default">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-primary-default" />
          <p className="text-sm font-medium">در حال فراخوانی پرونده‌های ورود محصول...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="p-16 text-center text-text-muted bg-card rounded-2xl border border-border-default space-y-2">
          <FileCheck className="w-10 h-10 mx-auto text-text-muted opacity-50" />
          <h3 className="text-sm font-bold text-text-primary">پرونده‌ای یافت نشد</h3>
          <p className="text-xs">هیچ درخواست ورود کاتالوگی با فیلترهای انتخابی مطابقت ندارد.</p>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border-default overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-surface/50 text-text-muted text-xs font-bold border-b border-border-subtle">
                <tr>
                  <th className="p-4">شماره</th>
                  <th className="p-4">تامین‌کننده و برند</th>
                  <th className="p-4">عنوان کاتالوگ</th>
                  <th className="p-4">تعداد کالا</th>
                  <th className="p-4">حوزه فعالیت</th>
                  <th className="p-4">وضعیت</th>
                  <th className="p-4">تاریخ ثبت</th>
                  <th className="p-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-surface/30 transition-colors">
                    <td className="p-4 font-mono font-bold text-primary-default">
                      #{req.id}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-text-primary text-xs sm:text-sm">
                        {req.user?.firstName || ""} {req.user?.lastName || req.user?.username || "تامین‌کننده"}
                      </div>
                      <div className="text-[11px] text-text-muted flex items-center gap-1.5 mt-0.5">
                        <Building className="w-3 h-3 text-text-muted" />
                        <span>{req.user?.brandName || req.user?.storeName || "بدون برند"}</span>
                        {req.user?.mobile && <span>• {req.user?.mobile}</span>}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-text-primary text-xs sm:text-sm max-w-[220px] truncate">
                      {req.subject}
                    </td>
                    <td className="p-4 text-xs font-bold">
                      {req.approxProductCount ? (
                        <span className="px-2 py-1 bg-surface rounded-lg border border-border-subtle">
                          {req.approxProductCount} قلم
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-text-secondary">
                      {req.categories || "عمومی"}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(req.status)}
                    </td>
                    <td className="p-4 text-xs text-text-muted">
                      {new Date(req.createdAt).toLocaleDateString("fa-IR")}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        type="button"
                        onClick={() => openDossier(req)}
                        className="px-3.5 py-1.5 rounded-xl bg-primary-default text-white hover:bg-primary-hover text-xs font-bold transition-all shadow-xs cursor-pointer"
                      >
                        بررسی پرونده
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dossier Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border-default rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-border-subtle bg-surface/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  #{selectedRequest.id}
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-base">
                    {selectedRequest.subject}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted mt-0.5">
                    <span>تامین‌کننده: {selectedRequest.user?.firstName} {selectedRequest.user?.lastName} ({selectedRequest.user?.brandName || "ثبت نشده"})</span>
                    <span>•</span>
                    <span>تماس: {selectedRequest.user?.mobile || "—"}</span>
                    <span>•</span>
                    {getStatusBadge(selectedRequest.status)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setProductForm({
                      name: "",
                      categoryId: categoriesList[0]?.id || "",
                      supplierBasePrice: "",
                      stock: "10",
                      sku: `CONC-${Date.now().toString().slice(-6)}`,
                      brand: selectedRequest.user?.brandName || "",
                      mainImage: "",
                      shortDescription: `محصول ثبت شده از پرونده کاتالوگ #${selectedRequest.id}`,
                      targetStatus: "PENDING_APPROVAL"
                    });
                    setShowCreateProductModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  ایجاد محصول برای این تامین‌کننده
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              {/* Status Update Form */}
              <div className="p-4 rounded-2xl bg-surface/50 border border-border-default space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary-default" />
                    مدیریت وضعیت پرونده و اطلاع‌رسانی به تامین‌کننده
                  </h4>
                  {statusMessage && (
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      {statusMessage}
                    </span>
                  )}
                </div>

                <form onSubmit={handleUpdateStatus} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1">
                        تغییر وضعیت پرونده:
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-card border border-border-default text-text-primary text-xs font-bold"
                      >
                        <option value="SUBMITTED">SUBMITTED - ثبت شده (جدید)</option>
                        <option value="IN_REVIEW">IN_REVIEW - در حال بررسی اولیه</option>
                        <option value="PROCESSING">PROCESSING - در حال ورود محصولات</option>
                        <option value="NEEDS_INFO">NEEDS_INFO - نیازمند اطلاعات تکمیلی</option>
                        <option value="COMPLETED">COMPLETED - ورود محصولات تکمیل شد</option>
                        <option value="CANCELLED">CANCELLED - لغو پرونده</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-muted mb-1">
                        یادداشت محرمانه اپراتور (فقط برای مدیران):
                      </label>
                      <input
                        type="text"
                        value={internalNotesText}
                        onChange={(e) => setInternalNotesText(e.target.value)}
                        placeholder="مثلاً: فایل اولیه بررسی شد، ۷ محصول فاقد عکس بود..."
                        className="w-full px-3 py-2 rounded-xl bg-card border border-border-default text-text-primary text-xs"
                      />
                    </div>
                  </div>

                  {/* Completion Stats Fields if marking COMPLETED */}
                  {newStatus === "COMPLETED" && (
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl space-y-2">
                      <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                        ثبت آمار نهایی جهت نمایش به تامین‌کننده:
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <div>
                          <label className="text-[11px] text-text-muted block">محصولات دریافتی:</label>
                          <input
                            type="number"
                            value={completionStats.receivedCount}
                            onChange={(e) => setCompletionStats({ ...completionStats, receivedCount: parseInt(e.target.value) || 0 })}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border-default text-xs font-bold mt-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-emerald-600 block font-bold">ایجاد شده در سیستم:</label>
                          <input
                            type="number"
                            value={completionStats.createdCount}
                            onChange={(e) => setCompletionStats({ ...completionStats, createdCount: parseInt(e.target.value) || 0 })}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border-default text-xs font-bold mt-0.5 text-emerald-600"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-amber-600 block font-bold">نیازمند اصلاح:</label>
                          <input
                            type="number"
                            value={completionStats.correctionCount}
                            onChange={(e) => setCompletionStats({ ...completionStats, correctionCount: parseInt(e.target.value) || 0 })}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border-default text-xs font-bold mt-0.5 text-amber-600"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-text-muted block">رد شده / نامعتبر:</label>
                          <input
                            type="number"
                            value={completionStats.rejectedCount}
                            onChange={(e) => setCompletionStats({ ...completionStats, rejectedCount: parseInt(e.target.value) || 0 })}
                            className="w-full px-2.5 py-1.5 rounded-lg bg-card border border-border-default text-xs font-bold mt-0.5"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={updatingStatus}
                      className="px-4 py-1.5 rounded-xl bg-primary-default text-white font-bold text-xs hover:bg-primary-hover transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {updatingStatus ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      ذخیره تغییرات وضعیت
                    </button>
                  </div>
                </form>
              </div>

              {/* Request Details & Downloadable Files */}
              <div className="bg-card p-4 rounded-2xl border border-border-default space-y-3">
                <h4 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                  اطلاعات و فایل‌های ضمیمه‌شده کاتالوگ
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-surface rounded-xl border border-border-subtle">
                    <span className="text-text-muted block">حوزه فعالیت:</span>
                    <span className="font-bold text-text-primary mt-0.5 block">
                      {selectedRequest.categories || "عمومی"}
                    </span>
                  </div>

                  <div className="p-2.5 bg-surface rounded-xl border border-border-subtle">
                    <span className="text-text-muted block">تعداد تقریبی اعلامی تامین‌کننده:</span>
                    <span className="font-bold text-text-primary mt-0.5 block">
                      {selectedRequest.approxProductCount || "نامشخص"} کالا
                    </span>
                  </div>
                </div>

                {(selectedRequest.catalogUrl || selectedRequest.websiteUrl) && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    {selectedRequest.catalogUrl && (
                      <a
                        href={selectedRequest.catalogUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-surface border border-border-default text-primary-default hover:underline flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        مشاهده لینک کاتالوگ آنلاین
                      </a>
                    )}
                    {selectedRequest.websiteUrl && (
                      <a
                        href={selectedRequest.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-surface border border-border-default text-text-secondary hover:underline flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        وب‌سایت / پیج تامین‌کننده
                      </a>
                    )}
                  </div>
                )}

                {/* Attached files list */}
                {selectedRequest.attachmentsList && selectedRequest.attachmentsList.length > 0 && (
                  <div className="pt-2 border-t border-border-subtle">
                    <span className="text-xs font-bold text-text-primary block mb-2">
                      فایل‌های پیوست کاتالوگ ({selectedRequest.attachmentsList.length}):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedRequest.attachmentsList.map((att, idx) => (
                        <a
                          key={idx}
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-border-subtle hover:border-primary-default text-xs font-medium text-text-primary transition-colors"
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
              </div>

              {/* Messages & Internal Notes Feed */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary-default" />
                    مکاتبات با تامین‌کننده و یادداشت‌های محرمانه
                  </h4>
                  <span className="text-[11px] text-text-muted">
                    یادداشت‌های محرمانه برای تامین‌کننده پنهان هستند
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedRequest.messages?.map((msg) => {
                    const isInternal = !!msg.isInternal;
                    const isOperator = msg.user?.role === "ADMIN" || msg.user?.role === "SUPER_ADMIN";
                    return (
                      <div
                        key={msg.id}
                        className={`rounded-2xl p-4 text-sm leading-relaxed border ${
                          isInternal
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                            : isOperator
                            ? "bg-primary-default/10 border-primary-default/20 text-text-primary"
                            : "bg-surface border-border-default text-text-primary"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-[11px] text-text-muted mb-1.5 border-b border-border-subtle pb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold">
                              {msg.user?.firstName} {msg.user?.lastName} ({isOperator ? "کارشناس زوپیت" : "تامین‌کننده"})
                            </span>
                            {isInternal && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white flex items-center gap-1">
                                <Lock className="w-3 h-3" /> یادداشت محرمانه اپراتور
                              </span>
                            )}
                          </div>
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
                              دانلود فایل ضمیمه پیام
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer (Send Message / Add Internal Note) */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border-subtle bg-surface/50 shrink-0 space-y-2">
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-text-primary">
                  <input
                    type="radio"
                    name="msgType"
                    checked={!isInternalNote}
                    onChange={() => setIsInternalNote(false)}
                    className="text-primary-default"
                  />
                  <span>پیام به تامین‌کننده (ارسال پیام و اعلان)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer font-bold text-amber-600 dark:text-amber-400">
                  <input
                    type="radio"
                    name="msgType"
                    checked={isInternalNote}
                    onChange={() => setIsInternalNote(true)}
                    className="text-amber-500"
                  />
                  <span>🔒 ثبت به عنوان یادداشت محرمانه (مخفی از تامین‌کننده)</span>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={
                    isInternalNote
                      ? "یادداشت محرمانه داخلی تیم زوپیت را وارد کنید..."
                      : "پیام رسمی یا درخواست اطلاعات تکمیلی به تامین‌کننده..."
                  }
                  className="flex-1 px-4 py-2.5 rounded-xl bg-card border border-border-default text-text-primary text-sm focus:outline-hidden focus:border-primary-default"
                />
                <button
                  type="submit"
                  disabled={sendingMessage || !messageText.trim()}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isInternalNote ? "bg-amber-600 hover:bg-amber-700" : "bg-primary-default hover:bg-primary-hover"
                  }`}
                >
                  {sendingMessage ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isInternalNote ? "ثبت یادداشت" : "ارسال پیام"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Create Product Modal */}
      {showCreateProductModal && selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border-default rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scale-in">
            <div className="p-4 sm:p-5 border-b border-border-subtle bg-surface/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-bold text-text-primary text-base">
                    ایجاد محصول برای تامین‌کننده: {selectedRequest.user?.firstName} {selectedRequest.user?.lastName}
                  </h3>
                  <p className="text-xs text-text-muted">
                    برند: {selectedRequest.user?.brandName || "ثبت نشده"} | شماره پرونده: #{selectedRequest.id}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateProductModal(false)}
                className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-5 overflow-y-auto space-y-4 flex-1">
              {productSuccess && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  {productSuccess}
                </div>
              )}

              {productError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  {productError}
                </div>
              )}

              {/* Safety notice about Status and Margin */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>کنترل مارجین پلتفرم:</strong> محصول ثبت شده در وضعیت «در انتظار تایید» یا «پیش‌نویس» قرار می‌گیرد و هرگز مستقیماً منتشر نخواهد شد. سود و مارجین زوپیت در فرآیند بررسی ادمین تعیین می‌گردد.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    نام محصول <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="مثال: هندزفری بی‌سیم مدل Pro 2"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border-default text-text-primary text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    دسته‌بندی <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border-default text-text-primary text-xs"
                  >
                    {categoriesList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    قیمت پایه تامین‌کننده (تومان) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={productForm.supplierBasePrice}
                    onChange={(e) => setProductForm({ ...productForm, supplierBasePrice: e.target.value })}
                    placeholder="مثال: 450000"
                    className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border-default text-text-primary text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    موجودی اولیه
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border-default text-text-primary text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    کد کالا (SKU)
                  </label>
                  <input
                    type="text"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border-default text-text-primary text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    برند
                  </label>
                  <input
                    type="text"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border-default text-text-primary text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    وضعیت اولیه محصول
                  </label>
                  <select
                    value={productForm.targetStatus}
                    onChange={(e) => setProductForm({ ...productForm, targetStatus: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border-default text-text-primary text-xs font-bold"
                  >
                    <option value="PENDING_APPROVAL">PENDING_APPROVAL (در انتظار تایید نهایی)</option>
                    <option value="DRAFT">DRAFT (پیش‌نویس)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    آدرس تصویر شاخص (URL)
                  </label>
                  <input
                    type="text"
                    value={productForm.mainImage}
                    onChange={(e) => setProductForm({ ...productForm, mainImage: e.target.value })}
                    placeholder="https://... یا /uploads/..."
                    className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border-default text-text-primary text-xs font-ltr text-left"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-text-primary mb-1">
                    توضیحات کوتاه
                  </label>
                  <textarea
                    rows={2}
                    value={productForm.shortDescription}
                    onChange={(e) => setProductForm({ ...productForm, shortDescription: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-surface border border-border-default text-text-primary text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setShowCreateProductModal(false)}
                  className="px-4 py-2 rounded-xl bg-surface border border-border-default text-text-secondary hover:text-text-primary text-xs font-bold"
                >
                  بستن
                </button>
                <button
                  type="submit"
                  disabled={creatingProduct}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs flex items-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {creatingProduct ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  ثبت محصول برای این تامین‌کننده
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
