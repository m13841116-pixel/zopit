import React, { useState, useEffect } from "react";
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
  ChevronDown
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
    </div>
  );
}
