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
  Download,
  FileSpreadsheet,
  Copy,
  Check,
  Send,
  Smartphone,
  FileText,
  MessageSquare,
  Share2,
  HelpCircle
} from "lucide-react";
import { toast } from "../GlobalToast";

interface Lead {
  id: number;
  name: string;
  phone: string;
  additionalPhones?: string | null;
  address?: string | null;
  category?: string | null;
  commission: number;
  status: "PENDING" | "ASSIGNED" | "IN_NEGOTIATION" | "COMPLETED" | "CANCELLED";
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

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showAdditionalPhones, setShowAdditionalPhones] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    additionalPhones: "",
    address: "",
    category: "لوازم جانبی و دیجیتال",
    commission: 150000,
    ambassadorId: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // SMS & Excel Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportScope, setExportScope] = useState<"ALL" | "CURRENT_FILTER" | "PENDING" | "ASSIGNED" | "COMPLETED">("ALL");
  const [exportIncludeAdditional, setExportIncludeAdditional] = useState(true);
  const [exportOnlyMobiles, setExportOnlyMobiles] = useState(true);
  const [exportDeduplicate, setExportDeduplicate] = useState(true);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  useEffect(() => {
    fetchLeadsData();
  }, []);

  const fetchLeadsData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
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
      }
    } catch (err) {
      console.error(err);
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
        address: formData.address.trim(),
        category: formData.category.trim(),
        commission: Number(formData.commission),
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
          address: "",
          category: "لوازم جانبی و دیجیتال",
          commission: 150000,
          ambassadorId: ""
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
      address: lead.address || "",
      category: lead.category || "لوازم جانبی و دیجیتال",
      commission: lead.commission || 150000,
      ambassadorId: lead.ambassadorId ? String(lead.ambassadorId) : ""
    });
    setShowAdditionalPhones(Boolean(lead.additionalPhones));
    setShowAddModal(true);
  };

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
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

    return matchesSearch && matchesStatus && matchesAmbassador;
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
    <div className="space-y-6 animate-fade-in text-primary" dir="rtl" id="leads-ambassadors-section">
      {/* Top Header */}
      <div className="bg-card p-6 md:p-7 rounded-3xl border border-border-subtle shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-sm shrink-0">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-primary flex items-center gap-2">
              تأمین‌یاب‌ها و مدیریت جذب تامین‌کنندگان هدف
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                توسعه بازار B2B
              </span>
            </h1>
            <p className="text-xs text-muted mt-1 font-medium leading-relaxed">
              تعریف تامین‌کنندگان هدف بازار، تعیین پاداش جذب، انتساب به تأمین‌یاب‌ها و پایش لحظه‌ای مذاکرات
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-xs group"
            title="خروجی فایل اکسل شماره‌ها ویژه سامانه ملی پیامک و پیامک انبوه"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
            <span>خروجی اکسل شماره‌ها (ملی‌پیامک)</span>
            <span className="bg-emerald-500 text-slate-950 text-[10px] px-2 py-0.5 rounded-full font-black">
              {leads.length.toLocaleString("fa-IR")}
            </span>
          </button>

          <button
            type="button"
            onClick={handleAutoMatch}
            className="bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 px-4 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-xs"
            title="ارزیابی اتوماتیک شماره‌های همراه/ثابت و اسامی برندها با تامین‌کنندگان ثبت‌نامی"
          >
            <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
            <span>تطبیق هوشمند شماره‌ها و برندها</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingLead(null);
              setFormData({
                name: "",
                phone: "",
                additionalPhones: "",
                address: "",
                category: "لوازم جانبی و دیجیتال",
                commission: 150000,
                ambassadorId: ""
              });
              setShowAdditionalPhones(false);
              setShowAddModal(true);
            }}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن تامین‌کننده هدف جدید</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border-subtle rounded-2xl p-5 shadow-xs flex items-center justify-between hover:border-emerald-500/30 transition-all">
          <div>
            <p className="text-xs font-bold text-muted">کل تامین‌کنندگان هدف</p>
            <p className="text-2xl font-black text-primary mt-1">
              {stats.totalLeads.toLocaleString("fa-IR")} <span className="text-xs font-medium text-muted">فروشگاه / برند</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-surface text-secondary flex items-center justify-center border border-subtle">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card border border-border-subtle rounded-2xl p-5 shadow-xs flex items-center justify-between hover:border-blue-500/30 transition-all">
          <div>
            <p className="text-xs font-bold text-blue-500 dark:text-blue-400">در حال پیگیری و مذاکره</p>
            <p className="text-2xl font-black text-blue-600 dark:text-blue-300 mt-1">
              {stats.assignedLeads.toLocaleString("fa-IR")} <span className="text-xs font-medium text-muted">مورد فعال</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card border border-border-subtle rounded-2xl p-5 shadow-xs flex items-center justify-between hover:border-emerald-500/30 transition-all">
          <div>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">جذب‌شده و ثبت‌نام موفق</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.completedLeads.toLocaleString("fa-IR")} <span className="text-xs font-medium text-muted">تامین‌کننده</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-card border border-border-subtle rounded-2xl p-5 shadow-xs flex items-center justify-between hover:border-amber-500/30 transition-all">
          <div>
            <p className="text-xs font-bold text-amber-500 dark:text-amber-400">پورسانت‌های پرداخت‌شده</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-300 mt-1">
              {stats.paidCommissions.toLocaleString("fa-IR")} <span className="text-xs font-medium text-muted">تومان</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 bg-surface p-1.5 rounded-2xl border border-subtle self-start w-fit">
        <button
          type="button"
          onClick={() => setActiveViewTab("leads")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeViewTab === "leads"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "text-muted hover:text-primary"
          }`}
        >
          <Target className="w-4 h-4" />
          <span>لیست تامین‌کنندگان هدف ({leads.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewTab("ambassadors")}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeViewTab === "ambassadors"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
              : "text-muted hover:text-primary"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>عملکرد و رتبه‌بندی تأمین‌یاب‌ها ({ambassadors.length})</span>
        </button>
      </div>

      {/* VIEW TAB 1: LEADS LIST */}
      {activeViewTab === "leads" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-card p-4 rounded-2xl border border-border-subtle shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو بر اساس نام تامین‌کننده، شماره تماس، دسته‌بندی یا تأمین‌یاب..."
                className="w-full pl-4 pr-10 py-2.5 bg-background border border-subtle rounded-xl text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-background border border-subtle rounded-xl px-3 py-2.5 text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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
                className="bg-background border border-subtle rounded-xl px-3 py-2.5 text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
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
                className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap shadow-xs"
                title="خروجی اکسل شماره‌های فیلتر شده"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>خروجی اکسل</span>
              </button>
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-card rounded-2xl border border-border-subtle overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs min-w-[800px]">
                <thead className="bg-surface border-b border-subtle text-muted font-bold">
                  <tr>
                    <th className="p-4">نام تامین‌کننده / برند</th>
                    <th className="p-4">دسته‌بندی و حوزه کالا</th>
                    <th className="p-4">شماره تماس و آدرس</th>
                    <th className="p-4">پاداش جذب</th>
                    <th className="p-4">تأمین‌یاب مسئول</th>
                    <th className="p-4">وضعیت پیشرفت</th>
                    <th className="p-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-muted font-bold">
                        در حال بارگذاری اطلاعات...
                      </td>
                    </tr>
                  ) : filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-muted font-bold">
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
                          className="hover:bg-surface/50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="font-extrabold text-primary text-sm">
                              {lead.name}
                            </div>
                            <span className="text-[10px] text-muted block mt-0.5 font-mono">
                              کد پرونده: #{lead.id}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className="inline-block px-2.5 py-1 bg-surface text-secondary border border-subtle rounded-lg text-[11px] font-bold">
                              {lead.category || "عمومی"}
                            </span>
                          </td>

                          <td className="p-4 text-secondary">
                            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
                              <Phone className="w-3.5 h-3.5" />
                              <a href={`tel:${lead.phone}`} className="hover:underline">
                                {lead.phone}
                              </a>
                            </div>
                            {lead.additionalPhones && (
                              <div className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-mono mt-1" dir="ltr">
                                <span className="text-[10px] text-muted font-sans font-normal">شماره‌های دیگر:</span>
                                <span className="font-bold truncate max-w-[180px]" title={lead.additionalPhones}>{lead.additionalPhones}</span>
                              </div>
                            )}
                            {lead.address && (
                              <div className="flex items-center gap-1 text-[11px] text-muted mt-1 max-w-xs truncate">
                                <Building className="w-3 h-3 shrink-0" />
                                <span>{lead.address}</span>
                              </div>
                            )}
                          </td>

                          <td className="p-4">
                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm font-mono">
                              {Number(lead.commission).toLocaleString("fa-IR")}{" "}
                              <span className="text-[10px] font-bold">تومان</span>
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={lead.ambassadorId ? String(lead.ambassadorId) : ""}
                                onChange={(e) => handleAssignAmbassador(lead.id, e.target.value)}
                                className="bg-background border border-subtle text-primary rounded-xl px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                              >
                                <option value="">-- بدون تأمین‌یاب (آزاد) --</option>
                                {ambassadors.map((amb) => (
                                  <option key={amb.id} value={amb.id}>
                                    {amb.firstName || amb.username}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </td>

                          <td className="p-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
                                isCompleted
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                  : isAssigned
                                  ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                  : lead.status === "CANCELLED"
                                  ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                              }`}
                            >
                              {isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {isAssigned && <Clock className="w-3.5 h-3.5" />}
                              {isCompleted
                                ? "جذب موفق و ثبت‌نام شد"
                                : isAssigned
                                ? "در حال مذاکره تأمین‌یاب"
                                : lead.status === "CANCELLED"
                                ? "عدم توافق"
                                : "آزاد (در انتظار تأمین‌یاب)"}
                            </span>
                          </td>

                          <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {!isCompleted && (
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(lead.id, "COMPLETED")}
                                  className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-slate-950 rounded-lg transition-all cursor-pointer"
                                  title="ثبت به عنوان جذب موفق و واریز پاداش تأمین‌یاب"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => openEditModal(lead)}
                                className="p-1.5 bg-surface hover:bg-subtle text-secondary hover:text-primary rounded-lg transition-all cursor-pointer"
                                title="ویرایش اطلاعات و مبلغ پاداش"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteLead(lead.id)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-lg transition-all cursor-pointer"
                                title="حذف تامین‌کننده هدف"
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

      {/* VIEW TAB 2: AMBASSADOR LEADERBOARD */}
      {activeViewTab === "ambassadors" && (
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border-subtle overflow-hidden shadow-xs">
            <div className="p-5 border-b border-subtle">
              <h3 className="text-base font-black text-primary flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>رتبه‌بندی و گزارش عملکرد تأمین‌یاب‌ها</span>
              </h3>
              <p className="text-xs text-muted mt-1 font-medium">
                تعداد تامین‌کنندگان راضی‌شده، پرونده‌های در جریان و مجموع پاداش‌های کسب‌شده توسط هر تأمین‌یاب
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs min-w-[800px]">
                <thead className="bg-surface border-b border-subtle text-muted font-bold">
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
                <tbody className="divide-y divide-subtle">
                  {ambassadorStats.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-muted font-bold">
                        هنوز تأمین‌یاب فعالی در سیستم ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    ambassadorStats.map((item, idx) => (
                      <tr key={item.ambassador.id} className="hover:bg-surface/50 transition-colors">
                        <td className="p-4">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                            idx === 0
                              ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                              : idx === 1
                              ? "bg-slate-300 text-slate-900 font-black"
                              : idx === 2
                              ? "bg-amber-700 text-amber-50 font-black"
                              : "bg-surface text-secondary border border-subtle"
                          }`}>
                            {idx + 1}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="font-extrabold text-primary text-sm">
                            {item.ambassador.firstName || item.ambassador.username} {item.ambassador.lastName || ""}
                          </div>
                          <span className="text-[10px] text-muted font-mono">شناسه: #{item.ambassador.id}</span>
                        </td>

                        <td className="p-4 font-mono text-xs font-bold text-secondary" dir="ltr">
                          {item.ambassador.mobile || item.ambassador.username || "-"}
                        </td>

                        <td className="p-4 font-bold text-blue-500">
                          {item.inProgressCount} مورد در حال مذاکره
                        </td>

                        <td className="p-4">
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                            {item.completedCount} تامین‌کننده
                          </span>
                        </td>

                        <td className="p-4 font-bold text-secondary">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-surface border border-subtle h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${item.conversionRate}%` }}
                              />
                            </div>
                            <span className="font-mono">{item.conversionRate}%</span>
                          </div>
                        </td>

                        <td className="p-4 font-black text-primary text-sm font-mono">
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border-subtle rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-scale-up" dir="rtl">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <h3 className="text-base font-black text-primary flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-500" />
                <span>{editingLead ? "ویرایش تامین‌کننده هدف و پاداش" : "تعریف تامین‌کننده هدف جدید"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-surface text-muted hover:text-primary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-4">
              {/* 1. Name */}
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  نام تامین‌کننده / فروشگاه / برند *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: بازرگانی پارس دیجیتال یا عمده‌فروشی برادران احمدی"
                  className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 2. Phone & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    شماره تماس / موبایل مدیر *
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="09123456789"
                    className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-mono font-bold text-primary outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    صنف و دسته‌بندی کالا
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="مثال: لوازم جانبی موبایل"
                    className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* 3. Address */}
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  آدرس یا موقعیت بازار
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="مثال: تهران، پاساژ علاءالدین، طبقه ۳، پلاک ۳۱۵"
                  className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 4. Reward & Ambassador */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    پاداش تأمین‌یاب به ازای ثبت‌نام (تومان) *
                  </label>
                  <input
                    type="number"
                    required
                    step={10000}
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                    dir="ltr"
                  />
                  {/* Quick Commission Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {[30000, 60000, 90000, 100000, 150000, 200000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormData({ ...formData, commission: preset })}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                          formData.commission === preset
                            ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 font-bold"
                            : "bg-surface text-muted border-subtle hover:text-primary"
                        }`}
                      >
                        {(preset / 1000).toLocaleString("fa-IR")} هزار
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    تخصیص به تأمین‌یاب (اختیاری)
                  </label>
                  <select
                    value={formData.ambassadorId}
                    onChange={(e) => setFormData({ ...formData, ambassadorId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">-- آزاد (انتخاب توسط خود تأمین‌یاب‌ها) --</option>
                    {ambassadors.map((amb) => (
                      <option key={amb.id} value={amb.id}>
                        {amb.firstName || amb.username} ({amb.mobile || "تأمین‌یاب"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5. Additional Phones (Collapsible section at the bottom) */}
              <div className="pt-1">
                {!showAdditionalPhones ? (
                  <button
                    type="button"
                    onClick={() => setShowAdditionalPhones(true)}
                    className="w-full border border-dashed border-emerald-500/40 hover:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>+ افزودن شماره‌های تماس بیشتر / همراه دیگر (اختیاری)</span>
                  </button>
                ) : (
                  <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5 transition-all">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-secondary flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-amber-500" />
                        <span>شماره‌های تماس بیشتر (همراه / ثابت دیگر)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAdditionalPhones(false);
                          setFormData({ ...formData, additionalPhones: "" });
                        }}
                        className="text-[11px] text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>حذف و بستن</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      dir="ltr"
                      value={formData.additionalPhones}
                      onChange={(e) => setFormData({ ...formData, additionalPhones: e.target.value })}
                      placeholder="مثال: 09181112233, 08734221100"
                      className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-mono font-bold text-primary outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                    />
                    <p className="text-[10px] text-muted leading-relaxed">
                      💡 با جداکننده کاما (،) یا فاصله وارد کنید. سیستم تمامی این شماره‌ها را موقع احراز هویت خودکار و اعتبارسنجی ثبت‌نام تامین‌کننده بررسی خواهد کرد.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted hover:text-primary bg-surface hover:bg-subtle cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "در حال ثبت..." : editingLead ? "ذخیره تغییرات" : "ثبت تامین‌کننده هدف"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXPORT MODAL FOR EXCEL & MELIPAYAMAK */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-card border border-border-subtle rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 md:p-7 space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-black text-primary flex items-center gap-2">
                    خروجی اکسل شماره‌ها و ارسال در ملی‌پیامک
                  </h3>
                  <p className="text-xs text-muted font-medium mt-0.5">
                    استخراج لیست تلفن‌های همراه تامین‌کنندگان هدف با فرمت استاندارد اکسل، متنی یا کپی سریع
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="w-9 h-9 rounded-xl bg-surface hover:bg-subtle text-muted hover:text-primary flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope Selection */}
            <div className="space-y-2">
              <label className="text-xs font-black text-primary flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-500" />
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
                    className={`p-3 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer ${
                      exportScope === item.id
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 font-black shadow-xs ring-1 ring-emerald-500/30"
                        : "bg-surface border-subtle text-muted hover:text-primary hover:border-emerald-500/30 font-medium"
                    }`}
                  >
                    <span className="text-[11px] font-bold truncate">{item.title}</span>
                    <span className="text-sm font-black mt-1">
                      {item.count.toLocaleString("fa-IR")}{" "}
                      <span className="text-[10px] font-normal opacity-70">پرونده</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Filters and Options */}
            <div className="bg-surface/50 border border-subtle p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black text-primary">تنظیمات پردازش و پالایش شماره‌ها برای پیامک:</p>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                  🛡️ شماره‌های ثابت در سیستم باقی می‌مانند
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <label className="flex items-center gap-2.5 p-2.5 bg-card rounded-xl border border-subtle cursor-pointer hover:border-emerald-500/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={exportOnlyMobiles}
                    onChange={(e) => setExportOnlyMobiles(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-primary">فقط خطوط همراه در فایل پیامک</span>
                    <span className="text-[10px] text-muted">فیلتر شماره‌های ثابت در فایل خروجی (جهت عدم خطای پنل پیامک)</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 bg-card rounded-xl border border-subtle cursor-pointer hover:border-emerald-500/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={exportIncludeAdditional}
                    onChange={(e) => setExportIncludeAdditional(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-primary">استخراج شماره‌های همراه فرعی</span>
                    <span className="text-[10px] text-muted">شامل کردن موبایل مسئولین و شماره‌های همراه دوم</span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 bg-card rounded-xl border border-subtle cursor-pointer hover:border-emerald-500/30 transition-colors">
                  <input
                    type="checkbox"
                    checked={exportDeduplicate}
                    onChange={(e) => setExportDeduplicate(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-primary">حذف شماره‌های همراه تکراری</span>
                    <span className="text-[10px] text-muted">جلوگیری از ارسال پیامک تکراری به یک مخاطب</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Live Count & Summary Card */}
            <div className="bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/15 border border-emerald-500/30 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-muted font-bold">شماره‌های آماده ارسال و استخراج:</p>
                  <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {exportData.length.toLocaleString("fa-IR")}{" "}
                    <span className="text-xs font-bold text-primary">شماره معتبر تفکیک‌شده</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-muted bg-card/80 px-3 py-2 rounded-xl border border-subtle self-start sm:self-auto">
                <span>تعداد کل پرونده‌ها:</span>
                <span className="text-primary font-black">{targetLeadsForExport.length.toLocaleString("fa-IR")}</span>
              </div>
            </div>

            {/* Action Buttons Grid */}
            <div className="space-y-3">
              <p className="text-xs font-black text-primary">انتخاب روش دریافت و دانلود خروجی:</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1. Melipayamak Excel Button */}
                <button
                  type="button"
                  onClick={handleDownloadMeliPayamakExcel}
                  disabled={exportData.length === 0}
                  className="p-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl text-right transition-all flex items-start gap-3 shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-950/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="w-5 h-5 text-slate-950" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">دانلود اکسل استاندارد ملی‌پیامک (.xlsx)</span>
                      <Download className="w-4 h-4 text-slate-950" />
                    </div>
                    <p className="text-[11px] font-medium opacity-80 mt-1 leading-relaxed">
                      فرمت اختصاصی آماده جهت آپلود مستقیم در ماژول «ارسال پیامک از فایل اکسل» یا «دفترچه تلفن» ملی پیامک
                    </p>
                  </div>
                </button>

                {/* 2. Full CRM Excel Button */}
                <button
                  type="button"
                  onClick={handleDownloadFullExcel}
                  disabled={exportData.length === 0}
                  className="p-4 bg-card hover:bg-surface border border-border-subtle hover:border-blue-500/40 text-primary rounded-2xl text-right transition-all flex items-start gap-3 shadow-xs cursor-pointer disabled:opacity-50 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform border border-blue-500/20">
                    <Download className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black">دانلود اکسل جامع پرونده‌ها (.xlsx)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
                        فول دیتا
                      </span>
                    </div>
                    <p className="text-[11px] text-muted font-medium mt-1 leading-relaxed">
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
                  className="p-3 bg-surface hover:bg-subtle border border-subtle rounded-xl text-xs font-bold text-primary flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  title="دانلود فایل CSV با انکودینگ UTF-8 BOM"
                >
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>دانلود فایل متنی CSV (.csv)</span>
                </button>

                {/* 4. Quick Copy with Comma */}
                <button
                  type="button"
                  onClick={() => handleCopyPhones("comma")}
                  disabled={exportData.length === 0}
                  className={`p-3 border rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${
                    copiedType === "comma"
                      ? "bg-emerald-500 text-slate-950 border-emerald-500 shadow-xs"
                      : "bg-surface hover:bg-subtle border-subtle text-primary"
                  }`}
                  title="کپی شماره‌ها جداشده با کاما جهت پیست کردن مستقیم در کادر ارسال سریع ملی پیامک"
                >
                  {copiedType === "comma" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-indigo-500" />}
                  <span>{copiedType === "comma" ? "کپی شد! (با کاما)" : "کپی سریع شماره‌ها (با کاما)"}</span>
                </button>

                {/* 5. Quick Copy with Newline */}
                <button
                  type="button"
                  onClick={() => handleCopyPhones("newline")}
                  disabled={exportData.length === 0}
                  className={`p-3 border rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 ${
                    copiedType === "newline"
                      ? "bg-emerald-500 text-slate-950 border-emerald-500 shadow-xs"
                      : "bg-surface hover:bg-subtle border-subtle text-primary"
                  }`}
                  title="کپی شماره‌ها در خطوط مجزا"
                >
                  {copiedType === "newline" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4 text-teal-500" />}
                  <span>{copiedType === "newline" ? "کپی شد! (خط به خط)" : "کپی شماره‌ها (خط جدید)"}</span>
                </button>
              </div>
            </div>

            {/* Live Data Preview */}
            {exportData.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-muted flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>پیش‌نمایش ۵ ردیف نخست خروجی:</span>
                  </p>
                  <span className="text-[11px] text-muted font-medium">
                    نمایش ۵ از {exportData.length.toLocaleString("fa-IR")} شماره
                  </span>
                </div>

                <div className="bg-surface border border-subtle rounded-2xl overflow-hidden">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-card border-b border-subtle text-muted font-bold">
                      <tr>
                        <th className="p-3">شماره موبایل</th>
                        <th className="p-3">نام تامین‌کننده</th>
                        <th className="p-3">صنف / حوزه</th>
                        <th className="p-3">نوع ردیف</th>
                        <th className="p-3">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                      {exportData.slice(0, 5).map((row, index) => (
                        <tr key={index} className="hover:bg-card/50">
                          <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400" dir="ltr">
                            {row.phone}
                          </td>
                          <td className="p-3 font-bold text-primary">{row.name}</td>
                          <td className="p-3 text-muted">{row.category}</td>
                          <td className="p-3">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                                row.isAdditional
                                  ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20"
                                  : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                              }`}
                            >
                              {row.isAdditional ? "شماره فرعی" : "شماره اصلی"}
                            </span>
                          </td>
                          <td className="p-3 text-muted text-[11px]">{row.statusText}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* MeliPayamak Help Guide Box */}
            <div className="bg-indigo-500/5 border border-indigo-500/20 p-4 rounded-2xl flex items-start gap-3">
              <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-muted leading-relaxed">
                <p className="font-bold text-primary">نحوه ارسال در پنل سامانه ملی‌پیامک (Melipayamak):</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] pr-1">
                  <li>
                    <strong className="text-primary font-bold">روش اول (فایل اکسل):</strong> در منوی پنل ملی‌پیامک وارد بخش{" "}
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">«ارسال پیامک ← ارسال از طریق فایل اکسل»</span> شوید، فایل دانلود شده بالا را آپلود نموده و ستون شماره موبایل را انتخاب کنید.
                  </li>
                  <li>
                    <strong className="text-primary font-bold">روش دوم (دفترچه تلفن):</strong> می‌توانید با انتخاب فایل اکسل در منوی{" "}
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">«دفترچه تلفن ← افزودن سریع یا ورود از اکسل»</span>، گروه مخاطبین جدیدی به نام «تامین‌کنندگان هدف» بسازید.
                  </li>
                  <li>
                    <strong className="text-primary font-bold">روش سوم (کپی سریع):</strong> با کلیک روی «کپی سریع با کاما»، شماره‌ها در حافظه قرار گرفته و می‌توانید مستقیماً در کادر گیرندگان ارسال پیامک معمولی پیست (Paste) کنید.
                  </li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-muted hover:text-primary bg-surface hover:bg-subtle cursor-pointer"
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
