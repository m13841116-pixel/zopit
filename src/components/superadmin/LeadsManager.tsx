import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  Target,
  Plus,
  Users,
  Phone,
  Building,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  DollarSign,
  Award,
  Trash2,
  Edit2,
  UserCheck,
  Sparkles,
  ArrowUpDown,
  TrendingUp,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Download,
  FileSpreadsheet,
  Copy,
  Check,
  Send,
  Smartphone,
  FileText,
  MessageSquare,
  Share2,
  HelpCircle,
  Globe,
  Radio,
  Eye,
  EyeOff,
  Zap
} from "lucide-react";
import { toast } from "../GlobalToast";

interface Lead {
  id: number;
  name: string;
  phone: string;
  additionalPhones?: string | null;
  websiteUrl?: string | null;
  address?: string | null;
  category?: string | null;
  commission: number;
  status: "PENDING" | "ASSIGNED" | "IN_NEGOTIATION" | "COMPLETED" | "CANCELLED";
  isPublished?: boolean;
  ambassadorId?: number | null;
  ambassador?: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    mobile?: string;
  } | null;
  createdAt: string;
}

interface Ambassador {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  mobile?: string;
  role: string;
}

interface Stats {
  totalLeads: number;
  draftLeads?: number;
  publishedLeads?: number;
  pendingLeads: number;
  assignedLeads: number;
  completedLeads: number;
  totalCommissions: number;
  paidCommissions: number;
  ambassadorsCount: number;
}

export default function LeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [ambassadors, setAmbassadors] = useState<Ambassador[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalLeads: 0,
    draftLeads: 0,
    publishedLeads: 0,
    pendingLeads: 0,
    assignedLeads: 0,
    completedLeads: 0,
    totalCommissions: 0,
    paidCommissions: 0,
    ambassadorsCount: 0
  });

  const [loading, setLoading] = useState(true);
  const [activeViewTab, setActiveViewTab] = useState<"leads" | "ambassadors">("leads");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [ambassadorFilter, setAmbassadorFilter] = useState<string>("ALL");
  const [publishFilter, setPublishFilter] = useState<string>("ALL");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showAdditionalPhones, setShowAdditionalPhones] = useState(false);
  const [showMoreFormFields, setShowMoreFormFields] = useState(false);
  const [viewingLeadDetails, setViewingLeadDetails] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    additionalPhones: "",
    websiteUrl: "",
    address: "",
    category: "لوازم جانبی و دیجیتال",
    commission: 150000,
    ambassadorId: "",
    isPublished: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBulkPublishing, setIsBulkPublishing] = useState(false);

  // SMS & Excel Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportScope, setExportScope] = useState<"ALL" | "CURRENT_FILTER" | "PENDING" | "ASSIGNED" | "COMPLETED">("ALL");
  const [exportIncludeAdditional, setExportIncludeAdditional] = useState(true);
  const [exportOnlyMobiles, setExportOnlyMobiles] = useState(true);
  const [exportDeduplicate, setExportDeduplicate] = useState(true);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeadsData();
  }, []);

  const fetchLeadsData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const token = localStorage.getItem("token") || "";
      if (!token) {
        setFetchError("نشست ورود شما منقضی شده یا در پنجره ناشناس (Incognito) وارد نشده‌اید. لطفاً وارد حساب مدیریت شوید.");
        setLoading(false);
        return;
      }
      const res = await fetch("/api/admin/leads", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setAmbassadors(data.ambassadors || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } else if (res.status === 401 || res.status === 403) {
        setFetchError("عدم احراز هویت: لطفاً مجدداً به عنوان مدیر کل وارد سیستم شوید.");
      } else {
        const errData = await res.json().catch(() => ({}));
        setFetchError(errData.error || "خطا در دریافت لیست تامین‌کنندگان هدف از سرور.");
      }
    } catch (err: any) {
      console.error(err);
      setFetchError("خطا در برقراری ارتباط با سرور. لطفاً اتصال اینترنت خود را بررسی کنید.");
      toast.error("خطا در بارگذاری اطلاعات سفیران و سرنخ‌ها");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoMatch = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/admin/leads/auto-match", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "تطبیق هوشمند شماره‌ها و برندها انجام شد.");
        fetchLeadsData();
      } else {
        toast.error(data.error || "خطا در ارزیابی خودکار");
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    }
  };

  const handleSaveLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error("نام و شماره تماس تامین‌کننده اجباری است.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        additionalPhones: formData.additionalPhones.trim(),
        websiteUrl: formData.websiteUrl.trim(),
        address: formData.address.trim(),
        category: formData.category.trim(),
        commission: Number(formData.commission),
        isPublished: Boolean(formData.isPublished),
        ambassadorId: formData.ambassadorId ? Number(formData.ambassadorId) : null
      };

      let res;
      if (editingLead) {
        res = await fetch(`/api/admin/leads/${editingLead.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch("/api/admin/leads", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success(editingLead ? "اطلاعات تامین‌کننده هدف بروزرسانی شد." : "تامین‌کننده هدف با موفقیت اضافه شد.");
        setShowAddModal(false);
        setEditingLead(null);
        setFormData({
          name: "",
          phone: "",
          additionalPhones: "",
          websiteUrl: "",
          address: "",
          category: "لوازم جانبی و دیجیتال",
          commission: 150000,
          ambassadorId: "",
          isPublished: false
        });
        fetchLeadsData();
      } else {
        toast.error(result.error || "خطا در ذخیره‌سازی اطلاعات");
      }
    } catch (err) {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePublish = async (leadId: number) => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/admin/leads/${leadId}/toggle-publish`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
        fetchLeadsData();
      } else {
        toast.error(data.error || "خطا در تغییر وضعیت انتشار");
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    }
  };

  const handleBulkPublish = async () => {
    const draftCount = leads.filter(l => !l.isPublished).length;
    if (draftCount === 0) {
      toast.error("هیچ پرونده پیش‌نویسی برای انتشار وجود ندارد.");
      return;
    }
    if (!window.confirm(`آیا از انتشار همگانی ${draftCount.toLocaleString("fa-IR")} پرونده پیش‌نویس برای تمام تأمین‌یاب‌ها اطمینان دارید؟`)) {
      return;
    }

    setIsBulkPublishing(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/admin/leads/bulk-publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "پرونده‌ها با موفقیت برای تأمین‌یاب‌ها منتشر شدند.");
        fetchLeadsData();
      } else {
        toast.error(data.error || "خطا در انتشار گروهی");
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setIsBulkPublishing(false);
    }
  };

  const handleStatusChange = async (leadId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/admin/leads/${leadId}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success("وضعیت پیشرفت با موفقیت بروز شد.");
        fetchLeadsData();
      } else {
        toast.error("خطا در تغییر وضعیت");
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    }
  };

  const handleAssignAmbassador = async (leadId: number, ambassadorId: string) => {
    try {
      const token = localStorage.getItem("token") || "";
      const ambId = ambassadorId ? Number(ambassadorId) : null;
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ambassadorId: ambId,
          status: ambId ? "ASSIGNED" : "PENDING"
        })
      });
      if (res.ok) {
        toast.success(ambId ? "سفیر مسئول با موفقیت مشخص شد." : "تامین‌کننده به وضعیت آزاد برگشت.");
        fetchLeadsData();
      } else {
        toast.error("خطا در تخصیص سفیر");
      }
    } catch {
      toast.error("خطا در ارتباط با سرور");
    }
  };

  const handleDeleteLead = async (id: number) => {
    if (!window.confirm("آیا از حذف این تامین‌کننده هدف اطمینان دارید؟")) return;
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("تامین‌کننده هدف حذف گردید.");
        fetchLeadsData();
      }
    } catch {
      toast.error("خطا در حذف سرنخ");
    }
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      name: lead.name,
      phone: lead.phone,
      additionalPhones: lead.additionalPhones || "",
      websiteUrl: lead.websiteUrl || "",
      address: lead.address || "",
      category: lead.category || "لوازم جانبی و دیجیتال",
      commission: lead.commission || 150000,
      ambassadorId: lead.ambassadorId ? String(lead.ambassadorId) : "",
      isPublished: Boolean(lead.isPublished)
    });
    setShowAdditionalPhones(Boolean(lead.additionalPhones));
    setShowMoreFormFields(Boolean(lead.additionalPhones || lead.websiteUrl || lead.category !== "لوازم جانبی و دیجیتال" || lead.commission !== 150000 || lead.ambassadorId));
    setShowAddModal(true);
  };

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
      (lead.websiteUrl && lead.websiteUrl.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.additionalPhones && lead.additionalPhones.includes(searchQuery)) ||
      (lead.category && lead.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.address && lead.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (lead.ambassador && (
        (lead.ambassador.firstName || "") + " " + (lead.ambassador.lastName || "") + " " + lead.ambassador.username
      ).toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "PENDING" && lead.status === "PENDING") ||
      (statusFilter === "ASSIGNED" && (lead.status === "ASSIGNED" || lead.status === "IN_NEGOTIATION")) ||
      (statusFilter === "COMPLETED" && lead.status === "COMPLETED") ||
      (statusFilter === "CANCELLED" && lead.status === "CANCELLED");

    const matchesAmbassador =
      ambassadorFilter === "ALL" ||
      (ambassadorFilter === "NONE" && !lead.ambassadorId) ||
      (lead.ambassadorId === Number(ambassadorFilter));

    const matchesPublish =
      publishFilter === "ALL" ||
      (publishFilter === "PUBLISHED" && lead.isPublished) ||
      (publishFilter === "DRAFT" && !lead.isPublished);

    return matchesSearch && matchesStatus && matchesAmbassador && matchesPublish;
  });

  // Calculate Ambassador Leaderboard Stats
  const ambassadorStats = ambassadors.map((amb) => {
    const ambLeads = leads.filter((l) => l.ambassadorId === amb.id);
    const completed = ambLeads.filter((l) => l.status === "COMPLETED");
    const inProgress = ambLeads.filter((l) => l.status === "ASSIGNED" || l.status === "IN_NEGOTIATION");
    const earnedCommission = completed.reduce((sum, l) => sum + (l.commission || 0), 0);

    return {
      ambassador: amb,
      totalAssigned: ambLeads.length,
      completedCount: completed.length,
      inProgressCount: inProgress.length,
      earnedCommission,
      conversionRate: ambLeads.length > 0 ? Math.round((completed.length / ambLeads.length) * 100) : 0
    };
  }).sort((a, b) => b.completedCount - a.completedCount || b.earnedCommission - a.earnedCommission);

  // Normalization and phone extraction
  const cleanPhoneDigits = (raw: string | null | undefined): string[] => {
    if (!raw) return [];
    const persianDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    let text = String(raw);
    for (let i = 0; i < 10; i++) {
      text = text.replace(persianDigits[i], String(i)).replace(arabicDigits[i], String(i));
    }
    const parts = text.split(/[,،\n\r/|; -]+/).map((p) => p.trim()).filter(Boolean);
    const results: string[] = [];
    for (const p of parts) {
      let digits = p.replace(/\D/g, "");
      if (!digits) continue;
      if (digits.startsWith("0098")) {
        digits = "0" + digits.slice(4);
      } else if (digits.startsWith("98") && digits.length === 12) {
        digits = "0" + digits.slice(2);
      } else if (digits.length === 10 && digits.startsWith("9")) {
        digits = "0" + digits;
      }
      if (digits.length >= 7) {
        results.push(digits);
      }
    }
    return results;
  };

  const isIranianMobile = (phone: string) => /^09[0-9]{9}$/.test(phone);

  // Selected leads according to scope
  const targetLeadsForExport = useMemo(() => {
    switch (exportScope) {
      case "CURRENT_FILTER":
        return filteredLeads;
      case "PENDING":
        return leads.filter((l) => l.status === "PENDING");
      case "ASSIGNED":
        return leads.filter((l) => l.status === "ASSIGNED" || l.status === "IN_NEGOTIATION");
      case "COMPLETED":
        return leads.filter((l) => l.status === "COMPLETED");
      case "ALL":
      default:
        return leads;
    }
  }, [leads, filteredLeads, exportScope]);

  // Processed export items for preview and export
  const exportData = useMemo(() => {
    const rawItems: {
      phone: string;
      isMobile: boolean;
      name: string;
      category: string;
      address: string;
      statusText: string;
      commission: number;
      ambassadorName: string;
      leadId: number;
      isAdditional: boolean;
    }[] = [];

    const statusMap: Record<string, string> = {
      PENDING: "آزاد (در انتظار تأمین‌یاب)",
      ASSIGNED: "در حال مذاکره",
      IN_NEGOTIATION: "در حال مذاکره",
      COMPLETED: "جذب موفق (ثبت‌نام شده)",
      CANCELLED: "عدم توافق / لغو"
    };

    targetLeadsForExport.forEach((lead) => {
      const mainPhones = cleanPhoneDigits(lead.phone);
      const additionalPhones = exportIncludeAdditional ? cleanPhoneDigits(lead.additionalPhones) : [];
      const statusText = statusMap[lead.status] || lead.status;
      const ambassadorName = lead.ambassador
        ? `${lead.ambassador.firstName || lead.ambassador.username} ${lead.ambassador.lastName || ""}`.trim()
        : "بدون تأمین‌یاب";

      mainPhones.forEach((ph) => {
        rawItems.push({
          phone: ph,
          isMobile: isIranianMobile(ph),
          name: lead.name,
          category: lead.category || "عمومی",
          address: lead.address || "",
          statusText,
          commission: lead.commission || 0,
          ambassadorName,
          leadId: lead.id,
          isAdditional: false
        });
      });

      additionalPhones.forEach((ph) => {
        rawItems.push({
          phone: ph,
          isMobile: isIranianMobile(ph),
          name: lead.name,
          category: lead.category || "عمومی",
          address: lead.address || "",
          statusText,
          commission: lead.commission || 0,
          ambassadorName,
          leadId: lead.id,
          isAdditional: true
        });
      });
    });

    let filtered = rawItems;
    if (exportOnlyMobiles) {
      filtered = filtered.filter((item) => item.isMobile);
    }

    if (exportDeduplicate) {
      const seen = new Set<string>();
      filtered = filtered.filter((item) => {
        if (seen.has(item.phone)) return false;
        seen.add(item.phone);
        return true;
      });
    }

    return filtered;
  }, [targetLeadsForExport, exportIncludeAdditional, exportOnlyMobiles, exportDeduplicate]);

  // Export handlers
  const handleDownloadMeliPayamakExcel = () => {
    if (exportData.length === 0) {
      toast.error("شماره‌ای برای استخراج یافت نشد.");
      return;
    }

    const rows = exportData.map((item) => ({
      "شماره موبایل": item.phone,
      "نام مخاطب": item.name,
      "صنف و دسته‌بندی": item.category,
      "آدرس و موقعیت": item.address,
      "وضعیت": item.statusText,
      "کد پرونده": item.leadId
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 16 },
      { wch: 30 },
      { wch: 22 },
      { wch: 35 },
      { wch: 24 },
      { wch: 12 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "مخاطبین ملی پیامک");
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `melipayamak_suppliers_${dateStr}.xlsx`);
    toast.success(`فایل اکسل با ${exportData.length.toLocaleString("fa-IR")} مخاطب با موفقیت دانلود شد.`);
  };

  const handleDownloadFullExcel = () => {
    if (exportData.length === 0) {
      toast.error("شماره‌ای برای استخراج یافت نشد.");
      return;
    }

    const rows = exportData.map((item, idx) => ({
      "ردیف": idx + 1,
      "کد پرونده": item.leadId,
      "نام تامین‌کننده / فروشگاه": item.name,
      "شماره تماس": item.phone,
      "نوع شماره": item.isMobile ? "همراه" : "ثابت / نامعتبر",
      "شماره فرعی": item.isAdditional ? "بله" : "خیر",
      "صنف و دسته‌بندی": item.category,
      "آدرس": item.address,
      "وضعیت پیگیری": item.statusText,
      "پاداش جذب (تومان)": item.commission,
      "تأمین‌یاب مسئول": item.ambassadorName
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 12 },
      { wch: 30 },
      { wch: 16 },
      { wch: 14 },
      { wch: 12 },
      { wch: 22 },
      { wch: 35 },
      { wch: 24 },
      { wch: 18 },
      { wch: 22 }
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "تامین‌کنندگان هدف");
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `suppliers_full_leads_${dateStr}.xlsx`);
    toast.success(`فایل اکسل جامع با ${exportData.length.toLocaleString("fa-IR")} ردیف دانلود شد.`);
  };

  const handleDownloadCsv = () => {
    if (exportData.length === 0) {
      toast.error("شماره‌ای برای استخراج یافت نشد.");
      return;
    }

    const headers = ["شماره موبایل", "نام تامین کننده", "دسته بندی", "آدرس", "وضعیت"];
    const rows = exportData.map((item) => [
      `"${item.phone}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      `"${item.category.replace(/"/g, '""')}"`,
      `"${item.address.replace(/"/g, '""')}"`,
      `"${item.statusText}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute("download", `melipayamak_numbers_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`فایل CSV با موفقیت دانلود شد.`);
  };

  const handleCopyPhones = (separator: "comma" | "newline") => {
    if (exportData.length === 0) {
      toast.error("شماره‌ای برای کپی یافت نشد.");
      return;
    }

    const text = exportData.map((item) => item.phone).join(separator === "comma" ? "," : "\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopiedType(separator);
      toast.success(
        separator === "comma"
          ? `${exportData.length.toLocaleString("fa-IR")} شماره با کاما کپی شد (آماده برای درج در ملی پیامک).`
          : `${exportData.length.toLocaleString("fa-IR")} شماره در خطوط مجزا کپی شد.`
      );
      setTimeout(() => setCopiedType(null), 2500);
    }).catch(() => {
      toast.error("خطا در دسترسی به حافظه موقت (Clipboard)");
    });
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-900" dir="rtl" id="leads-ambassadors-section">
      {/* Top Header */}
      <div className="bg-white p-6 md:p-7 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 text-white flex items-center justify-center shadow-lg shadow-purple-600/25 shrink-0">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-2.5">
              تأمین‌یاب‌ها و مدیریت جذب تامین‌کنندگان هدف
              <span className="text-[11px] px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200 font-black">
                توسعه بازار B2B
              </span>
            </h1>
            <p className="text-xs text-slate-600 mt-1.5 font-medium leading-relaxed">
              تعریف تامین‌کنندگان هدف بازار، تعیین پاداش جذب، انتساب به تأمین‌یاب‌ها و پایش لحظه‌ای مذاکرات
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="bg-white hover:bg-purple-50 text-purple-700 border-2 border-purple-200 hover:border-purple-300 px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-xs group"
            title="خروجی فایل اکسل شماره‌ها ویژه سامانه ملی پیامک و پیامک انبوه"
          >
            <FileSpreadsheet className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
            <span>خروجی اکسل شماره‌ها (ملی‌پیامک)</span>
            <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-black">
              {leads.length.toLocaleString("fa-IR")}
            </span>
          </button>

          <button
            type="button"
            onClick={handleAutoMatch}
            className="bg-purple-50 hover:bg-purple-100 text-purple-800 border-2 border-purple-200 px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-xs"
            title="ارزیابی اتوماتیک شماره‌های همراه/ثابت و اسامی برندها با تامین‌کنندگان ثبت‌نامی"
          >
            <Sparkles className="w-4 h-4 text-purple-600 animate-pulse" />
            <span>تطبیق هوشمند شماره‌ها</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingLead(null);
              setFormData({
                name: "",
                phone: "",
                additionalPhones: "",
                websiteUrl: "",
                address: "",
                category: "لوازم جانبی و دیجیتال",
                commission: 150000,
                ambassadorId: "",
                isPublished: false
              });
              setShowAdditionalPhones(false);
              setShowMoreFormFields(false);
              setShowAddModal(true);
            }}
            className="bg-gradient-to-r from-violet-600 via-purple-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white px-5 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن تامین‌کننده هدف جدید</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center justify-between hover:border-purple-200 transition-colors">
          <div>
            <p className="text-xs font-bold text-slate-500">کل تامین‌کنندگان هدف</p>
            <p className="text-2xl md:text-3xl font-black text-slate-900 mt-1.5 tracking-tight font-mono">
              {stats.totalLeads.toLocaleString("fa-IR")}{" "}
              <span className="text-xs font-bold text-slate-500 font-sans">فروشگاه / برند</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100 shadow-xs">
            <Building className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center justify-between hover:border-indigo-200 transition-colors">
          <div>
            <p className="text-xs font-bold text-slate-500">در حال پیگیری و مذاکره</p>
            <p className="text-2xl md:text-3xl font-black text-slate-900 mt-1.5 tracking-tight font-mono">
              {stats.assignedLeads.toLocaleString("fa-IR")}{" "}
              <span className="text-xs font-bold text-indigo-600 font-sans">مورد فعال</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 shadow-xs">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center justify-between hover:border-emerald-200 transition-colors">
          <div>
            <p className="text-xs font-bold text-slate-500">جذب‌شده و ثبت‌نام موفق</p>
            <p className="text-2xl md:text-3xl font-black text-slate-900 mt-1.5 tracking-tight font-mono">
              {stats.completedLeads.toLocaleString("fa-IR")}{" "}
              <span className="text-xs font-bold text-emerald-600 font-sans">تامین‌کننده</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex items-center justify-between hover:border-amber-200 transition-colors">
          <div>
            <p className="text-xs font-bold text-slate-500">پورسانت‌های پرداخت‌شده</p>
            <p className="text-2xl md:text-3xl font-black text-slate-900 mt-1.5 tracking-tight font-mono">
              {stats.paidCommissions.toLocaleString("fa-IR")}{" "}
              <span className="text-xs font-bold text-amber-600 font-sans">تومان</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100 shadow-xs">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs self-start w-fit">
        <button
          type="button"
          onClick={() => setActiveViewTab("leads")}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeViewTab === "leads"
              ? "bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-md shadow-purple-600/25"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Target className="w-4 h-4" />
          <span>لیست تامین‌کنندگان هدف ({leads.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewTab("ambassadors")}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeViewTab === "ambassadors"
              ? "bg-gradient-to-r from-violet-600 to-purple-700 text-white shadow-md shadow-purple-600/25"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>عملکرد و رتبه‌بندی تأمین‌یاب‌ها ({ambassadors.length})</span>
        </button>
      </div>

      {/* Delay Publish & SMS Banner */}
      {(stats.draftLeads ?? 0) > 0 && (
        <div className="bg-white p-5 rounded-3xl border-2 border-purple-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-scale-up">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 border border-purple-200 shadow-xs">
              <Radio className="w-6 h-6 animate-pulse text-purple-700" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-black text-purple-900">فرصت ارسال مستقیم پیامک بدون پورسانت (تاخیر انتشار)</span>
                <span className="bg-purple-100 text-purple-800 text-[11px] px-2.5 py-0.5 rounded-full border border-purple-200 font-black">
                  {(stats.draftLeads ?? 0).toLocaleString("fa-IR")} پرونده در حالت پیش‌نویس
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                این شماره‌ها هنوز در پنل تأمین‌یاب‌ها منتشر نشده‌اند. می‌توانید ابتدا خروجی اکسل شماره‌ها را بگیرید و در پنل ملی‌پیامک به آن‌ها پیامک بزنید. پس از آن، برای کسانی که ثبت‌نام نکرده‌اند، با دکمه انتشار، پرونده‌ها را برای تأمین‌یاب‌ها فعال کنید تا تماس بگیرند.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleBulkPublish}
            disabled={isBulkPublishing}
            className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 shrink-0 shadow-md shadow-purple-600/20 transition-all cursor-pointer whitespace-nowrap disabled:opacity-50"
          >
            <Zap className="w-4 h-4 text-purple-200" />
            <span>{isBulkPublishing ? "در حال انتشار..." : "انتشار همگانی همه پیش‌نویس‌ها"}</span>
          </button>
        </div>
      )}

      {/* VIEW TAB 1: LEADS LIST */}
      {activeViewTab === "leads" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 md:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-purple-600" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو بر اساس نام تامین‌کننده، شماره تماس، لینک سایت، دسته‌بندی یا تأمین‌یاب..."
                className="w-full pl-4 pr-10 py-3 bg-white border-2 border-slate-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-500/10 rounded-2xl text-xs font-bold text-slate-900 outline-none transition-all placeholder:text-slate-400"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={publishFilter}
                onChange={(e) => setPublishFilter(e.target.value)}
                className="bg-white border-2 border-slate-200 hover:border-purple-300 focus:border-purple-600 rounded-2xl px-3.5 py-3 text-xs font-bold text-slate-900 outline-none cursor-pointer transition-all shadow-xs"
              >
                <option value="ALL">وضعیت انتشار (همه)</option>
                <option value="PUBLISHED">🌐 منتشرشده برای تأمین‌یاب</option>
                <option value="DRAFT">📝 پیش‌نویس (مخفی / ویژه پیامک)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border-2 border-slate-200 hover:border-purple-300 focus:border-purple-600 rounded-2xl px-3.5 py-3 text-xs font-bold text-slate-900 outline-none cursor-pointer transition-all shadow-xs"
              >
                <option value="ALL">همه وضعیت‌ها</option>
                <option value="PENDING">آزاد (در انتظار تأمین‌یاب)</option>
                <option value="ASSIGNED">در حال مذاکره</option>
                <option value="COMPLETED">جذب موفق (ثبت‌نام شده)</option>
                <option value="CANCELLED">عدم توافق / لغو</option>
              </select>

              <select
                value={ambassadorFilter}
                onChange={(e) => setAmbassadorFilter(e.target.value)}
                className="bg-white border-2 border-slate-200 hover:border-purple-300 focus:border-purple-600 rounded-2xl px-3.5 py-3 text-xs font-bold text-slate-900 outline-none cursor-pointer transition-all shadow-xs"
              >
                <option value="ALL">همه تأمین‌یاب‌ها</option>
                <option value="NONE">بدون تأمین‌یاب (آزاد)</option>
                {ambassadors.map((amb) => (
                  <option key={amb.id} value={amb.id}>
                    {amb.firstName || amb.username} ({amb.mobile || "بدون شماره"})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setExportScope("CURRENT_FILTER");
                  setShowExportModal(true);
                }}
                className="bg-purple-50 hover:bg-purple-100 text-purple-800 border-2 border-purple-200 hover:border-purple-300 px-4 py-3 rounded-2xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-xs"
                title="خروجی اکسل شماره‌های فیلتر شده"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-purple-700" />
                <span>خروجی اکسل</span>
              </button>
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs min-w-[700px]">
                <thead className="bg-purple-50/60 border-b border-purple-100 text-slate-900 font-black">
                  <tr>
                    <th className="p-4">نام تامین‌کننده / برند</th>
                    <th className="p-4">شماره تماس</th>
                    <th className="p-4">آدرس</th>
                    <th className="p-4">وضعیت و تأمین‌یاب</th>
                    <th className="p-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-500 font-bold">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-slate-700 font-bold">در حال بارگذاری اطلاعات تامین‌کنندگان...</span>
                        </div>
                      </td>
                    </tr>
                  ) : fetchError ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center">
                        <div className="max-w-md mx-auto p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col items-center gap-3">
                          <span className="text-xs font-bold text-amber-900">{fetchError}</span>
                          <button
                            type="button"
                            onClick={() => fetchLeadsData()}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs"
                          >
                            تلاش مجدد و بارگذاری
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-slate-500 font-bold">
                        تامین‌کننده‌ای با مشخصات مدنظر یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => {
                      const isCompleted = lead.status === "COMPLETED";
                      const isAssigned = lead.status === "ASSIGNED" || lead.status === "IN_NEGOTIATION";

                      return (
                        <tr
                          key={lead.id}
                          className="hover:bg-purple-50/40 transition-colors"
                        >
                          {/* 1. Name */}
                          <td className="p-4">
                            <div className="font-extrabold text-slate-900 text-sm">
                              {lead.name}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-500 font-mono">
                                #{lead.id}
                              </span>
                              {lead.category && (
                                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                                  {lead.category}
                                </span>
                              )}
                              {lead.websiteUrl && (
                                <a
                                  href={lead.websiteUrl.startsWith("http") ? lead.websiteUrl : `https://${lead.websiteUrl}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 hover:underline bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 max-w-[140px] truncate"
                                  title={lead.websiteUrl}
                                >
                                  <Globe className="w-2.5 h-2.5 shrink-0" />
                                  <span className="truncate" dir="ltr">{lead.websiteUrl.replace(/^https?:\/\//, "")}</span>
                                </a>
                              )}
                            </div>
                          </td>

                          {/* 2. Phone */}
                          <td className="p-4">
                            <div className="flex items-center gap-1.5 font-mono text-xs font-black text-purple-700" dir="ltr">
                              <Phone className="w-3.5 h-3.5 text-purple-600" />
                              <a href={`tel:${lead.phone}`} className="hover:underline">
                                {lead.phone}
                              </a>
                            </div>
                            {lead.additionalPhones && (
                              <span className="text-[10px] text-amber-700 font-mono block mt-1" dir="ltr" title={lead.additionalPhones}>
                                +شماره‌های دیگر موجود
                              </span>
                            )}
                          </td>

                          {/* 3. Address */}
                          <td className="p-4">
                            {lead.address ? (
                              <div className="flex items-center gap-1 text-xs text-slate-700 max-w-xs truncate">
                                <Building className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                <span className="truncate">{lead.address}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">-</span>
                            )}
                          </td>

                          {/* 4. Status & Ambassador */}
                          <td className="p-4">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-black border ${
                                    isCompleted
                                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                      : isAssigned
                                      ? "bg-purple-100 text-purple-800 border-purple-300"
                                      : lead.status === "CANCELLED"
                                      ? "bg-rose-100 text-rose-800 border-rose-300"
                                      : "bg-amber-100 text-amber-900 border-amber-300"
                                  }`}
                                >
                                  {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                                  {isAssigned && <Clock className="w-3 h-3" />}
                                  {isCompleted
                                    ? "جذب موفق"
                                    : isAssigned
                                    ? "در حال مذاکره"
                                    : lead.status === "CANCELLED"
                                    ? "عدم توافق"
                                    : "آزاد"}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => handleTogglePublish(lead.id)}
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black border transition-all cursor-pointer ${
                                    lead.isPublished
                                      ? "bg-purple-100 text-purple-800 border-purple-200"
                                      : "bg-slate-100 text-slate-700 border-slate-200"
                                  }`}
                                  title={lead.isPublished ? "منتشرشده در پنل" : "پیش‌نویس"}
                                >
                                  {lead.isPublished ? "منتشرشده" : "پیش‌نویس"}
                                </button>
                              </div>

                              <div className="flex items-center gap-1 text-[11px] text-slate-600">
                                <select
                                  value={lead.ambassadorId ? String(lead.ambassadorId) : ""}
                                  onChange={(e) => handleAssignAmbassador(lead.id, e.target.value)}
                                  className="bg-white border border-slate-200 hover:border-purple-300 text-slate-800 rounded-lg px-2 py-1 text-[11px] font-bold outline-none cursor-pointer"
                                >
                                  <option value="">-- بدون تأمین‌یاب --</option>
                                  {ambassadors.map((amb) => (
                                    <option key={amb.id} value={amb.id}>
                                      {amb.firstName || amb.username}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </td>

                          {/* 5. Actions */}
                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setViewingLeadDetails(lead)}
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer shadow-xs"
                                title="مشاهده اطلاعات کامل تامین‌کننده"
                              >
                                <Info className="w-4 h-4 text-slate-700" />
                              </button>

                              {!isCompleted && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(lead.id, "COMPLETED")}
                                  className="p-2 bg-emerald-100 hover:bg-emerald-600 text-emerald-800 hover:text-white rounded-xl transition-all cursor-pointer shadow-xs"
                                  title="ثبت به عنوان جذب موفق"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => openEditModal(lead)}
                                className="p-2 bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white rounded-xl transition-all cursor-pointer shadow-xs"
                                title="ویرایش"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteLead(lead.id)}
                                className="p-2 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white rounded-xl transition-all cursor-pointer shadow-xs"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: View Full Lead Details */}
      {viewingLeadDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up my-auto" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">{viewingLeadDetails.name}</h3>
                  <span className="text-[11px] text-slate-500 font-mono">کد پرونده: #{viewingLeadDetails.id}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingLeadDetails(null)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">شماره تماس اصلی:</span>
                  <a href={`tel:${viewingLeadDetails.phone}`} className="font-mono font-black text-purple-700 hover:underline" dir="ltr">
                    {viewingLeadDetails.phone}
                  </a>
                </div>
                {viewingLeadDetails.additionalPhones && (
                  <div className="flex justify-between items-center border-t border-purple-100 pt-2">
                    <span className="text-slate-500 font-bold">شماره‌های دیگر:</span>
                    <span className="font-mono font-bold text-slate-800" dir="ltr">{viewingLeadDetails.additionalPhones}</span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">آدرس / موقعیت:</span>
                  <span className="font-bold text-slate-900">{viewingLeadDetails.address || "ثبت نشده"}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                  <span className="text-slate-500 font-bold">دسته‌بندی و صنف:</span>
                  <span className="font-bold text-slate-800">{viewingLeadDetails.category || "عمومی"}</span>
                </div>
                {viewingLeadDetails.websiteUrl && (
                  <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                    <span className="text-slate-500 font-bold">وب‌سایت / پیج:</span>
                    <a
                      href={viewingLeadDetails.websiteUrl.startsWith("http") ? viewingLeadDetails.websiteUrl : `https://${viewingLeadDetails.websiteUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-purple-700 hover:underline flex items-center gap-1"
                      dir="ltr"
                    >
                      <span>{viewingLeadDetails.websiteUrl}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">مبلغ پاداش جذب:</span>
                  <span className="font-mono font-black text-purple-800 text-sm">
                    {Number(viewingLeadDetails.commission).toLocaleString("fa-IR")} تومان
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                  <span className="text-slate-500 font-bold">تأمین‌یاب مسئول:</span>
                  <span className="font-bold text-slate-800">
                    {viewingLeadDetails.ambassador
                      ? `${viewingLeadDetails.ambassador.firstName || viewingLeadDetails.ambassador.username} (${viewingLeadDetails.ambassador.mobile || "بدون شماره"})`
                      : "آزاد (در انتظار انتخاب تأمین‌یاب)"}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-200 pt-2">
                  <span className="text-slate-500 font-bold">وضعیت انتشار:</span>
                  <span className={`font-black ${viewingLeadDetails.isPublished ? "text-purple-700" : "text-slate-600"}`}>
                    {viewingLeadDetails.isPublished ? "🌐 منتشرشده برای تأمین‌یاب" : "📝 پیش‌نویس (ویژه پیامک)"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const leadToEdit = viewingLeadDetails;
                  setViewingLeadDetails(null);
                  openEditModal(leadToEdit);
                }}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>ویرایش این تامین‌کننده</span>
              </button>
              <button
                type="button"
                onClick={() => setViewingLeadDetails(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TAB 2: AMBASSADOR LEADERBOARD */}
      {activeViewTab === "ambassadors" && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 md:p-6 border-b border-slate-100 bg-purple-50/40">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" />
                <span>رتبه‌بندی و گزارش عملکرد تأمین‌یاب‌ها</span>
              </h3>
              <p className="text-xs text-slate-600 mt-1 font-medium">
                تعداد تامین‌کنندگان راضی‌شده، پرونده‌های در جریان و مجموع پاداش‌های کسب‌شده توسط هر تأمین‌یاب
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs min-w-[800px]">
                <thead className="bg-purple-50/60 border-b border-purple-100 text-slate-900 font-black">
                  <tr>
                    <th className="p-4">رتبه</th>
                    <th className="p-4">نام تأمین‌یاب</th>
                    <th className="p-4">شماره تماس</th>
                    <th className="p-4">پرونده‌های فعال</th>
                    <th className="p-4">تامین‌کنندگان جذب‌شده</th>
                    <th className="p-4">درصد موفقیت</th>
                    <th className="p-4">مجموع پاداش دریافتی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ambassadorStats.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-500 font-bold">
                        هنوز تأمین‌یاب فعالی در سیستم ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    ambassadorStats.map((item, idx) => (
                      <tr key={item.ambassador.id} className="hover:bg-purple-50/30 transition-colors">
                        <td className="p-4">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                            idx === 0
                              ? "bg-purple-600 text-white font-black shadow-xs"
                              : idx === 1
                              ? "bg-slate-300 text-slate-900 font-black"
                              : idx === 2
                              ? "bg-purple-200 text-purple-900 font-black"
                              : "bg-slate-100 text-slate-800 border border-slate-200"
                          }`}>
                            {idx + 1}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="font-extrabold text-slate-900 text-sm">
                            {item.ambassador.firstName || item.ambassador.username} {item.ambassador.lastName || ""}
                          </div>
                          <span className="text-[10px] text-slate-500 font-mono">شناسه: #{item.ambassador.id}</span>
                        </td>

                        <td className="p-4 font-mono text-xs font-bold text-slate-800" dir="ltr">
                          {item.ambassador.mobile || item.ambassador.username || "-"}
                        </td>

                        <td className="p-4 font-bold text-purple-700">
                          {item.inProgressCount} مورد در حال مذاکره
                        </td>

                        <td className="p-4">
                          <span className="font-black text-emerald-700 text-sm">
                            {item.completedCount} تامین‌کننده
                          </span>
                        </td>

                        <td className="p-4 font-bold text-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-100 border border-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-purple-600 h-full rounded-full"
                                style={{ width: `${item.conversionRate}%` }}
                              />
                            </div>
                            <span className="font-mono text-slate-900 font-bold">{item.conversionRate}%</span>
                          </div>
                        </td>

                        <td className="p-4 font-black text-slate-900 text-sm font-mono">
                          {item.earnedCommission.toLocaleString("fa-IR")} تومان
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add / Edit Target Supplier Lead */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up my-auto" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Target className="w-4 h-4" />
                </div>
                <span>{editingLead ? "ویرایش تامین‌کننده هدف" : "تعریف تامین‌کننده هدف جدید"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-3.5">
              {/* 1. Name */}
              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">
                  نام تامین‌کننده / فروشگاه / برند <span className="text-purple-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: بازرگانی پارس یا عمده‌فروشی برادران احمدی"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 placeholder:text-slate-400 transition-all"
                />
              </div>

              {/* 2. Phone */}
              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">
                  شماره تماس / موبایل مدیر <span className="text-purple-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="09123456789"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-mono font-black text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 text-left placeholder:text-slate-400 transition-all"
                />
              </div>

              {/* 3. Address */}
              <div>
                <label className="block text-xs font-black text-slate-900 mb-1">
                  آدرس یا موقعیت بازار
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="مثال: تهران، پاساژ علاءالدین، طبقه ۳، پلاک ۳۱۵"
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 placeholder:text-slate-400 transition-all"
                />
              </div>

              {/* EXPANDABLE SECTION BUTTON */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowMoreFormFields(!showMoreFormFields)}
                  className="w-full border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-100/50 text-purple-900 text-xs font-black py-2.5 px-3.5 rounded-xl flex items-center justify-between transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-purple-600" />
                    <span>اطلاعات و تنظیمات بیشتر (دسته‌بندی، پاداش، وب‌سایت، انتشار)</span>
                  </div>
                  {showMoreFormFields ? (
                    <ChevronUp className="w-4 h-4 text-purple-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>

              {/* EXPANDABLE FIELDS */}
              {showMoreFormFields && (
                <div className="space-y-3 p-3.5 bg-purple-50/30 rounded-2xl border border-purple-100/80 animate-fade-in">
                  {/* Category & Website */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-black text-slate-800 mb-1">
                        صنف و دسته‌بندی کالا
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="مثال: لوازم جانبی"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-slate-800 mb-1 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-purple-600" />
                        <span>وب‌سایت / پیج</span>
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={formData.websiteUrl}
                        onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                        placeholder="example.com"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:border-purple-600 text-left"
                      />
                    </div>
                  </div>

                  {/* Reward & Ambassador */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-black text-slate-800 mb-1">
                        پاداش ثبت‌نام (تومان)
                      </label>
                      <input
                        type="number"
                        step={10000}
                        value={formData.commission}
                        onChange={(e) => setFormData({ ...formData, commission: Number(e.target.value) })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-black text-purple-800 outline-none focus:border-purple-600 text-left"
                        dir="ltr"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {[50000, 100000, 150000, 200000].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setFormData({ ...formData, commission: preset })}
                            className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                              formData.commission === preset
                                ? "bg-purple-600 text-white font-black border-purple-600"
                                : "bg-white hover:bg-purple-50 text-slate-700 border-slate-200"
                            }`}
                          >
                            {(preset / 1000).toLocaleString("fa-IR")}هزار
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-slate-800 mb-1">
                        تخصیص به تأمین‌یاب
                      </label>
                      <select
                        value={formData.ambassadorId}
                        onChange={(e) => setFormData({ ...formData, ambassadorId: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600 cursor-pointer"
                      >
                        <option value="">-- آزاد --</option>
                        {ambassadors.map((amb) => (
                          <option key={amb.id} value={amb.id}>
                            {amb.firstName || amb.username}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Publish Toggle */}
                  <div className="p-3 bg-white border border-purple-200 rounded-xl flex items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">انتشار برای تأمین‌یاب‌ها</span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {formData.isPublished ? "نمایش فوری در پنل" : "پیش‌نویس ویژه پیامک"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, isPublished: !formData.isPublished })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                        formData.isPublished
                          ? "bg-purple-600 text-white"
                          : "bg-slate-700 text-white"
                      }`}
                    >
                      {formData.isPublished ? "🌐 منتشرشده" : "📝 پیش‌نویس"}
                    </button>
                  </div>

                  {/* Additional Phones */}
                  <div>
                    {!showAdditionalPhones ? (
                      <button
                        type="button"
                        onClick={() => setShowAdditionalPhones(true)}
                        className="text-[11px] text-purple-700 hover:text-purple-900 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>افزودن شماره‌های تماس همراه/ثابت دیگر</span>
                      </button>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-black text-slate-800">شماره‌های دیگر</label>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAdditionalPhones(false);
                              setFormData({ ...formData, additionalPhones: "" });
                            }}
                            className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                          >
                            بستن
                          </button>
                        </div>
                        <input
                          type="text"
                          dir="ltr"
                          value={formData.additionalPhones}
                          onChange={(e) => setFormData({ ...formData, additionalPhones: e.target.value })}
                          placeholder="09181112233, 08734221100"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-900 text-left outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white rounded-xl text-xs font-black shadow-md shadow-purple-600/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "در حال ثبت..." : editingLead ? "ذخیره تغییرات" : "ثبت تامین‌کننده"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPORT MODAL FOR EXCEL & MELIPAYAMAK */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6" dir="rtl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
                    خروجی اکسل شماره‌ها و ارسال در ملی‌پیامک
                  </h3>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    استخراج لیست تلفن‌های همراه تامین‌کنندگان هدف با فرمت استاندارد اکسل، متنی یا کپی سریع
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Selection */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-purple-600" />
                <span>انتخاب دامنه تامین‌کنندگان برای استخراج:</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {[
                  { id: "ALL", title: "همه تامین‌کنندگان", count: leads.length },
                  { id: "CURRENT_FILTER", title: "فیلتر جاری جدول", count: filteredLeads.length },
                  { id: "PENDING", title: "آزاد (در انتظار)", count: leads.filter((l) => l.status === "PENDING").length },
                  { id: "ASSIGNED", title: "در حال مذاکره", count: leads.filter((l) => l.status === "ASSIGNED" || l.status === "IN_NEGOTIATION").length },
                  { id: "COMPLETED", title: "جذب موفق", count: leads.filter((l) => l.status === "COMPLETED").length }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setExportScope(item.id as any)}
                    className={`p-3.5 rounded-2xl border-2 text-right transition-all flex flex-col justify-between cursor-pointer ${
                      exportScope === item.id
                        ? "bg-purple-50 border-purple-600 text-purple-950 font-black shadow-xs ring-2 ring-purple-500/20"
                        : "bg-white border-slate-200 text-slate-700 hover:border-purple-300 font-bold"
                    }`}
                  >
                    <span className="text-[11px] font-bold truncate">{item.title}</span>
                    <span className="text-sm font-black mt-1 text-slate-900">
                      {item.count.toLocaleString("fa-IR")}{" "}
                      <span className="text-[10px] font-medium opacity-70">پرونده</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Filters and Options */}
            <div className="bg-purple-50/30 border-2 border-purple-100 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-slate-900">تنظیمات پردازش و پالایش شماره‌ها برای پیامک:</p>
                <span className="text-[11px] text-purple-800 font-bold bg-purple-100 px-2.5 py-1 rounded-xl border border-purple-200">
                  🛡️ شماره‌های ثابت در سیستم باقی می‌مانند
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <label className="flex items-center gap-2.5 p-3.5 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:border-purple-500 transition-colors shadow-xs">
                  <input
                    type="checkbox"
                    checked={exportOnlyMobiles}
                    onChange={(e) => setExportOnlyMobiles(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900">فقط خطوط همراه در فایل پیامک</span>
                    <span className="text-[10px] text-slate-500 font-medium">فیلتر شماره‌های ثابت در فایل خروجی (جهت عدم خطای پنل پیامک)</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3.5 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:border-purple-500 transition-colors shadow-xs">
                  <input
                    type="checkbox"
                    checked={exportIncludeAdditional}
                    onChange={(e) => setExportIncludeAdditional(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900">استخراج شماره‌های همراه فرعی</span>
                    <span className="text-[10px] text-slate-500 font-medium">شامل کردن موبایل مسئولین و شماره‌های همراه دوم</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3.5 bg-white rounded-2xl border border-slate-200 cursor-pointer hover:border-purple-500 transition-colors shadow-xs">
                  <input
                    type="checkbox"
                    checked={exportDeduplicate}
                    onChange={(e) => setExportDeduplicate(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="font-black text-slate-900">حذف شماره‌های همراه تکراری</span>
                    <span className="text-[10px] text-slate-500 font-medium">جلوگیری از ارسال پیامک تکراری به یک مخاطب</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Live Count & Summary Card */}
            <div className="bg-purple-50 border-2 border-purple-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-600 font-bold">شماره‌های آماده ارسال و استخراج:</p>
                  <p className="text-xl font-black text-purple-900 mt-0.5">
                    {exportData.length.toLocaleString("fa-IR")}{" "}
                    <span className="text-xs font-bold text-slate-900">شماره معتبر تفکیک‌شده</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-white px-3.5 py-2 rounded-xl border border-slate-200 self-start sm:self-auto shadow-xs">
                <span>تعداد کل پرونده‌ها:</span>
                <span className="text-slate-900 font-black">{targetLeadsForExport.length.toLocaleString("fa-IR")}</span>
              </div>
            </div>

            {/* Action Buttons Grid */}
            <div className="space-y-3">
              <p className="text-xs font-black text-slate-900">انتخاب روش دریافت و دانلود خروجی:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Melipayamak Excel Button */}
                <button
                  type="button"
                  onClick={handleDownloadMeliPayamakExcel}
                  disabled={exportData.length === 0}
                  className="p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-right transition-all flex items-start gap-3 shadow-md shadow-purple-600/20 cursor-pointer disabled:opacity-50 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">دانلود اکسل استاندارد ملی‌پیامک (.xlsx)</span>
                      <Download className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-[11px] font-medium opacity-90 mt-1 leading-relaxed">
                      فرمت اختصاصی آماده جهت آپلود مستقیم در ماژول «ارسال پیامک از فایل اکسل» یا «دفترچه تلفن» ملی پیامک
                    </p>
                  </div>
                </button>

                {/* 2. Full CRM Excel Button */}
                <button
                  type="button"
                  onClick={handleDownloadFullExcel}
                  disabled={exportData.length === 0}
                  className="p-4 bg-white hover:bg-purple-50/50 border-2 border-slate-200 hover:border-purple-600 text-slate-900 rounded-2xl text-right transition-all flex items-start gap-3 shadow-xs cursor-pointer disabled:opacity-50 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Download className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">دانلود اکسل جامع پرونده‌ها (.xlsx)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                        فول دیتا
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium mt-1 leading-relaxed">
                      شامل نام برند، تلفن اصلی و فرعی، حوزه کالا، آدرس، پاداش جذب و نام تأمین‌یاب مسئول
                    </p>
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {/* 3. CSV File Download */}
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  disabled={exportData.length === 0}
                  className="p-3 bg-white hover:bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-bold text-slate-900 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                  title="دانلود فایل CSV با انکودینگ UTF-8 BOM"
                >
                  <FileText className="w-4 h-4 text-purple-600" />
                  <span>دانلود فایل متنی CSV (.csv)</span>
                </button>

                {/* 4. Quick Copy with Comma */}
                <button
                  type="button"
                  onClick={() => handleCopyPhones("comma")}
                  disabled={exportData.length === 0}
                  className={`p-3 border-2 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-xs ${
                    copiedType === "comma"
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white hover:bg-purple-50 border-slate-200 text-slate-900"
                  }`}
                  title="کپی شماره‌ها جداشده با کاما جهت پیست کردن مستقیم در کادر ارسال سریع ملی پیامک"
                >
                  {copiedType === "comma" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-purple-600" />}
                  <span>{copiedType === "comma" ? "کپی شد! (با کاما)" : "کپی سریع شماره‌ها (با کاما)"}</span>
                </button>

                {/* 5. Quick Copy with Newline */}
                <button
                  type="button"
                  onClick={() => handleCopyPhones("newline")}
                  disabled={exportData.length === 0}
                  className={`p-3 border-2 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-xs ${
                    copiedType === "newline"
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-white hover:bg-purple-50 border-slate-200 text-slate-900"
                  }`}
                  title="کپی شماره‌ها در خطوط مجزا"
                >
                  {copiedType === "newline" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-purple-600" />}
                  <span>{copiedType === "newline" ? "کپی شد! (خط به خط)" : "کپی شماره‌ها (خط جدید)"}</span>
                </button>
              </div>
            </div>

            {/* Live Data Preview */}
            {exportData.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>پیش‌نمایش ۵ ردیف نخست خروجی:</span>
                  </p>
                  <span className="text-[11px] text-slate-600 font-bold">
                    نمایش ۵ از {exportData.length.toLocaleString("fa-IR")} شماره
                  </span>
                </div>

                <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-purple-50/60 border-b border-purple-100 text-slate-900 font-black">
                      <tr>
                        <th className="p-3">شماره موبایل</th>
                        <th className="p-3">نام تامین‌کننده</th>
                        <th className="p-3">صنف / حوزه</th>
                        <th className="p-3">نوع ردیف</th>
                        <th className="p-3">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {exportData.slice(0, 5).map((row, index) => (
                        <tr key={index} className="hover:bg-purple-50/30">
                          <td className="p-3 font-mono font-black text-purple-700" dir="ltr">
                            {row.phone}
                          </td>
                          <td className="p-3 font-black text-slate-900">{row.name}</td>
                          <td className="p-3 text-slate-700 font-bold">{row.category}</td>
                          <td className="p-3">
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-lg font-black ${
                                row.isAdditional
                                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                                  : "bg-slate-100 text-slate-800 border border-slate-200"
                              }`}
                            >
                              {row.isAdditional ? "شماره فرعی" : "شماره اصلی"}
                            </span>
                          </td>
                          <td className="p-3 text-slate-700 text-[11px] font-bold">{row.statusText}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MeliPayamak Help Guide Box */}
            <div className="bg-purple-50/40 border-2 border-purple-200 p-4 rounded-2xl flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-slate-700 leading-relaxed font-medium">
                <p className="font-black text-slate-900">نحوه ارسال در پنل سامانه ملی‌پیامک (Melipayamak):</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] pr-1">
                  <li>
                    <strong className="text-slate-900 font-black">روش اول (فایل اکسل):</strong> در منوی پنل ملی‌پیامک وارد بخش{" "}
                    <span className="text-purple-700 font-black">«ارسال پیامک ← ارسال از طریق فایل اکسل»</span> شوید، فایل دانلود شده بالا را آپلود نموده و ستون شماره موبایل را انتخاب کنید.
                  </li>
                  <li>
                    <strong className="text-slate-900 font-black">روش دوم (دفترچه تلفن):</strong> می‌توانید با انتخاب فایل اکسل در منوی{" "}
                    <span className="text-purple-700 font-black">«دفترچه تلفن ← افزودن سریع یا ورود از اکسل»</span>، گروه مخاطبین جدیدی به نام «تامین‌کنندگان هدف» بسازید.
                  </li>
                  <li>
                    <strong className="text-slate-900 font-black">روش سوم (کپی سریع):</strong> با کلیک روی «کپی سریع با کاما»، شماره‌ها در حافظه قرار گرفته و می‌توانید مستقیماً در کادر گیرندگان ارسال پیامک معمولی پیست (Paste) کنید.
                  </li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
