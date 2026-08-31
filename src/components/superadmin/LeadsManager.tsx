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
    phone?: string;
  } | null;
  createdAt: string;
}

interface Ambassador {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
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
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
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
      address: lead.address || "",
      category: lead.category || "لوازم جانبی و دیجیتال",
      commission: lead.commission || 150000,
      ambassadorId: lead.ambassadorId ? String(lead.ambassadorId) : ""
    });
    setShowAddModal(true);
  };

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery) ||
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
    <div className="space-y-8 animate-fade-in text-slate-900 dark:text-slate-100" dir="rtl" id="leads-ambassadors-section">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 shrink-0">
            <Target className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-2">
              تأمین‌یاب‌ها و مدیریت جذب تامین‌کنندگان هدف
              <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-950 dark:bg-indigo-950 dark:text-indigo-200 font-bold">
                توسعه بازار
              </span>
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium leading-relaxed">
              تعریف تامین‌کنندگان مدنظر، تعیین پاداش جذب، انتساب به تأمین‌یاب‌ها و پایش لحظه‌ای مذاکرات
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingLead(null);
            setFormData({
              name: "",
              phone: "",
              address: "",
              category: "لوازم جانبی و دیجیتال",
              commission: 150000,
              ambassadorId: ""
            });
            setShowAddModal(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span>افزودن تامین‌کننده هدف جدید</span>
        </button>
      </div>

      {/* Metric Cards - Ultra Clean High-Contrast */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">کل تامین‌کنندگان هدف</p>
            <p className="text-2xl font-black text-slate-950 dark:text-white mt-1">
              {stats.totalLeads.toLocaleString("fa-IR")} <span className="text-xs font-medium text-slate-500">فروشگاه/برند</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center border border-slate-200 dark:border-slate-700">
            <Building className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400">در حال پیگیری و مذاکره</p>
            <p className="text-2xl font-black text-blue-950 dark:text-blue-100 mt-1">
              {stats.assignedLeads.toLocaleString("fa-IR")} <span className="text-xs font-medium text-slate-500">مورد فعال</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">جذب‌شده و ثبت‌نام موفق</p>
            <p className="text-2xl font-black text-emerald-950 dark:text-emerald-100 mt-1">
              {stats.completedLeads.toLocaleString("fa-IR")} <span className="text-xs font-medium text-slate-500">تامین‌کننده</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400">پورسانت‌های پرداخت‌شده</p>
            <p className="text-2xl font-black text-amber-950 dark:text-amber-100 mt-1">
              {stats.paidCommissions.toLocaleString("fa-IR")} <span className="text-xs font-medium text-slate-500">تومان</span>
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveViewTab("leads")}
          className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeViewTab === "leads"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Target className="w-4 h-4" />
          <span>لیست تامین‌کنندگان هدف ({leads.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveViewTab("ambassadors")}
          className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeViewTab === "ambassadors"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
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
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجو بر اساس نام تامین‌کننده، شماره تماس، دسته‌بندی یا تأمین‌یاب..."
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
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
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-900 dark:text-white outline-none"
              >
                <option value="ALL">همه تأمین‌یاب‌ها</option>
                <option value="NONE">بدون تأمین‌یاب (آزاد)</option>
                {ambassadors.map((amb) => (
                  <option key={amb.id} value={amb.id}>
                    {amb.firstName || amb.username} ({amb.phone || "بدون شماره"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Leads Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
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
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-500 font-bold">
                        در حال بارگذاری اطلاعات...
                      </td>
                    </tr>
                  ) : filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-500 font-bold">
                        تامین‌کننده‌ای با مشخصات مدنظر یافت نشد.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => {
                      const isCompleted = lead.status === "COMPLETED";
                      const isAssigned = lead.status === "ASSIGNED" || lead.status === "IN_NEGOTIATION";
                      const isPending = lead.status === "PENDING";

                      return (
                        <tr
                          key={lead.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="p-4">
                            <div className="font-extrabold text-slate-950 dark:text-white text-sm">
                              {lead.name}
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              کد پرونده: #{lead.id}
                            </span>
                          </td>

                          <td className="p-4">
                            <span className="inline-block px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-[11px] font-bold">
                              {lead.category || "عمومی"}
                            </span>
                          </td>

                          <td className="p-4 text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400" dir="ltr">
                              <Phone className="w-3.5 h-3.5" />
                              <a href={`tel:${lead.phone}`} className="hover:underline">
                                {lead.phone}
                              </a>
                            </div>
                            {lead.address && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1 max-w-xs truncate">
                                <Building className="w-3 h-3 shrink-0" />
                                <span>{lead.address}</span>
                              </div>
                            )}
                          </td>

                          <td className="p-4">
                            <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                              {Number(lead.commission).toLocaleString("fa-IR")}{" "}
                              <span className="text-[10px] font-bold">تومان</span>
                            </span>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <select
                                value={lead.ambassadorId ? String(lead.ambassadorId) : ""}
                                onChange={(e) => handleAssignAmbassador(lead.id, e.target.value)}
                                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2 py-1.5 text-xs font-bold outline-none"
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
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black border ${
                                isCompleted
                                  ? "bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-900 dark:text-emerald-50 dark:border-emerald-700"
                                  : isAssigned
                                  ? "bg-blue-100 text-blue-950 border-blue-300 dark:bg-blue-900 dark:text-blue-50 dark:border-blue-700"
                                  : lead.status === "CANCELLED"
                                  ? "bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-900 dark:text-rose-50 dark:border-rose-700"
                                  : "bg-amber-400 text-slate-950 border-amber-500 dark:bg-amber-400 dark:text-slate-950 dark:border-amber-300"
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
                                  className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 dark:text-emerald-300 rounded-lg transition-all"
                                  title="ثبت به عنوان جذب موفق و واریز پاداش تأمین‌یاب"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => openEditModal(lead)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg transition-all"
                                title="ویرایش اطلاعات و مبلغ پاداش"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteLead(lead.id)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-300 rounded-lg transition-all"
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
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                رتبه‌بندی و گزارش عملکرد تأمین‌یاب‌ها
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                تعداد تامین‌کنندگان راضی‌شده، پرونده‌های در جریان و مجموع پاداش‌های کسب‌شده توسط هر تأمین‌یاب
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold border-b border-slate-200 dark:border-slate-700">
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
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ambassadorStats.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-500 font-bold">
                        هنوز تأمین‌یاب فعالی در سیستم ثبت نشده است.
                      </td>
                    </tr>
                  ) : (
                    ambassadorStats.map((item, idx) => (
                      <tr key={item.ambassador.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-4">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs ${
                            idx === 0
                              ? "bg-amber-400 text-slate-950 font-black shadow-xs"
                              : idx === 1
                              ? "bg-slate-300 text-slate-900 font-black"
                              : idx === 2
                              ? "bg-amber-700 text-amber-50 font-black"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}>
                            {idx + 1}
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="font-extrabold text-slate-950 dark:text-white text-sm">
                            {item.ambassador.firstName || item.ambassador.username} {item.ambassador.lastName || ""}
                          </div>
                          <span className="text-[10px] text-slate-400">شناسه: #{item.ambassador.id}</span>
                        </td>

                        <td className="p-4 font-mono text-xs font-bold text-slate-600 dark:text-slate-300" dir="ltr">
                          {item.ambassador.phone || "-"}
                        </td>

                        <td className="p-4 font-bold text-blue-600 dark:text-blue-400">
                          {item.inProgressCount} مورد در حال مذاکره
                        </td>

                        <td className="p-4">
                          <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                            {item.completedCount} تامین‌کننده
                          </span>
                        </td>

                        <td className="p-4 font-bold text-slate-700 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${item.conversionRate}%` }}
                              />
                            </div>
                            <span>{item.conversionRate}%</span>
                          </div>
                        </td>

                        <td className="p-4 font-black text-slate-950 dark:text-white text-sm">
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-scale-up" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-950 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                {editingLead ? "ویرایش تامین‌کننده هدف و پورسانت" : "تعریف تامین‌کننده هدف جدید"}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLead} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام تامین‌کننده / فروشگاه / برند *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: بازرگانی پارس دیجیتال یا عمده‌فروشی برادران احمدی"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    شماره تماس / موبایل مدیر *
                  </label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="09123456789"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 text-left"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    صنف و دسته‌بندی کالا
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="مثال: قاب و گلس یا لوازم جانبی"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  آدرس یا موقعیت بازار
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="مثال: تهران، پاساژ علاءالدین، طبقه ۳، پلاک ۳۱۵"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    پاداش تأمین‌یاب به ازای ثبت‌نام (تومان) *
                  </label>
                  <input
                    type="number"
                    required
                    step={10000}
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 outline-none focus:border-indigo-500 text-left"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تخصیص به تأمین‌یاب (اختیاری)
                  </label>
                  <select
                    value={formData.ambassadorId}
                    onChange={(e) => setFormData({ ...formData, ambassadorId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                  >
                    <option value="">-- آزاد (انتخاب توسط خود تأمین‌یاب‌ها) --</option>
                    {ambassadors.map((amb) => (
                      <option key={amb.id} value={amb.id}>
                        {amb.firstName || amb.username} ({amb.phone || "تأمین‌یاب"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50"
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
