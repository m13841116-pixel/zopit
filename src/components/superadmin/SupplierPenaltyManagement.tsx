import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
import {
  Scale,
  Plus,
  Edit2,
  Trash2,
  Settings,
  User,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  FileText,
  TrendingDown,
  Percent,
  Calendar,
  Layers,
  ChevronLeft,
  X,
  RefreshCw,
  Clock,
  ShieldAlert,
  Info
} from "lucide-react";

export default function SupplierPenaltyManagement() {
  const [activeTab, setActiveTab] = useState<"stats" | "rules" | "suppliers">("stats");
  const [rules, setRules] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [config, setConfig] = useState<any>({
    underReviewThreshold: 20,
    temporarySuspensionThreshold: 40,
    blockedThreshold: 60,
    autoSuspensionEnabled: true,
  });

  // Loaders
  const [loadingRules, setLoadingRules] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [submittingConfig, setSubmittingConfig] = useState(false);

  // Search/Filters
  const [ruleSearch, setRuleSearch] = useState("");
  const [ruleActiveFilter, setRuleActiveFilter] = useState("all");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierStatusFilter, setSupplierStatusFilter] = useState("all");

  // Modals
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [ruleForm, setRuleForm] = useState({
    title: "",
    description: "",
    negativePoints: 10,
    autoNotification: true,
    isActive: true,
  });

  const [isPenaltyModalOpen, setIsPenaltyModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [penaltyForm, setPenaltyForm] = useState({
    reason: "",
    points: 10,
    description: "",
    orderNumber: "",
    usePreset: "",
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Load Data
  const fetchRules = () => {
    setLoadingRules(true);
    fetch(`/api/admin/penalty-rules?search=${ruleSearch}${ruleActiveFilter !== "all" ? `&isActive=${ruleActiveFilter === "active"}` : ""}`, { credentials: "include",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return [];
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setRules(data);
        setLoadingRules(false);
      })
      .catch(() => setLoadingRules(false));
  };

  const fetchSuppliers = () => {
    setLoadingSuppliers(true);
    fetch("/api/admin/suppliers/performance", { credentials: "include",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return [];
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setSuppliers(data);
        setLoadingSuppliers(false);
      })
      .catch(() => setLoadingSuppliers(false));
  };

  const fetchStats = () => {
    setLoadingStats(true);
    fetch("/api/admin/penalties/stats", { credentials: "include",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => {
        if (data) setStats(data);
        setLoadingStats(false);
      })
      .catch(() => setLoadingStats(false));
  };

  const fetchConfig = () => {
    fetch("/api/admin/penalty-config", { credentials: "include",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => {
        if (data && !data.error) setConfig(data);
      })
      .catch((err) => console.error("Error loading config", err));
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (activeTab === "rules") fetchRules();
    if (activeTab === "suppliers") fetchSuppliers();
    if (activeTab === "stats") {
      fetchStats();
      fetchRules(); // also load for quick manual apply selectors
    }
  }, [activeTab, ruleSearch, ruleActiveFilter]);

  // Handle Threshold Config Submit
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingConfig(true);
    fetch("/api/admin/penalty-config", { credentials: "include",
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        
      },
      body: JSON.stringify(config),
    })
      .then((res) => res.json())
      .then((data) => {
        setSubmittingConfig(false);
        if (data.error) {
          toast(data.error, "error");
        } else {
          toast("تنظیمات با موفقیت ذخیره شدند و وضعیت تامین‌کنندگان بازنگری شد.", "success");
          fetchStats();
          if (activeTab === "suppliers") fetchSuppliers();
        }
      })
      .catch(() => setSubmittingConfig(false));
  };

  // Handle Rule Submit
  const handleRuleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingRule ? `/api/admin/penalty-rules/${editingRule.id}` : "/api/admin/penalty-rules";
    const method = editingRule ? "PUT" : "POST";

    fetch(url, { credentials: "include",
      method,
      headers: {
        "Content-Type": "application/json",
        
      },
      body: JSON.stringify(ruleForm),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast(data.error, "error");
        } else {
          setIsRuleModalOpen(false);
          setEditingRule(null);
          setRuleForm({ title: "", description: "", negativePoints: 10, autoNotification: true, isActive: true });
          fetchRules();
        }
      });
  };

  // Handle Apply Penalty Submit
  const handleApplyPenalty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier) return;

    fetch(`/api/admin/suppliers/${selectedSupplier.id}/penalties`, { credentials: "include",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        
      },
      body: JSON.stringify({
        reason: penaltyForm.reason,
        points: penaltyForm.points,
        description: penaltyForm.description,
        orderNumber: penaltyForm.orderNumber || undefined,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast(data.error, "error");
        } else {
          toast(`جریمه با موفقیت اعمال شد. وضعیت جدید: ${data.newStatus}`, "success");
          setIsPenaltyModalOpen(false);
          setPenaltyForm({ reason: "", points: 10, description: "", orderNumber: "", usePreset: "" });
          fetchSuppliers();
          fetchStats();
        }
      });
  };

  // Handle Edit Action Setup
  const openEditRule = (rule: any) => {
    setEditingRule(rule);
    setRuleForm({
      title: rule.title,
      description: rule.description,
      negativePoints: rule.negativePoints,
      autoNotification: rule.autoNotification,
      isActive: rule.isActive,
    });
    setIsRuleModalOpen(true);
  };

  // Handle Delete Action
  const handleDeleteRule = async (id: number) => {
    if (!await window.customConfirm("آیا از حذف این قانون جریمه اطمینان دارید؟")) return;

    fetch(`/api/admin/penalty-rules/${id}`, { credentials: "include",
      method: "DELETE",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast(data.error, "error");
        } else {
          fetchRules();
        }
      });
  };

  // Handle View Supplier Profile
  const viewSupplierProfile = (id: number) => {
    setLoadingProfile(true);
    setIsProfileModalOpen(true);
    fetch(`/api/admin/suppliers/${id}/performance`, { credentials: "include",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setProfileData(data);
        setLoadingProfile(false);
      })
      .catch(() => setLoadingProfile(false));
  };

  // Preset Selection Helper
  const handlePresetChange = (ruleId: string) => {
    if (!ruleId) {
      setPenaltyForm({ ...penaltyForm, usePreset: "", reason: "", points: 10, description: "" });
      return;
    }
    const selectedRule = rules.find((r) => r.id === parseInt(ruleId));
    if (selectedRule) {
      setPenaltyForm({
        ...penaltyForm,
        usePreset: ruleId,
        reason: selectedRule.title,
        points: selectedRule.negativePoints,
        description: selectedRule.description,
      });
    }
  };

  // Helper translations for status and levels
  const translateStatus = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "Active":
        return { label: "فعال", color: "bg-success/10 text-success border border-success/20" };
      case "UNDER_REVIEW":
      case "Under Review":
        return { label: "تحت بررسی", color: "bg-warning/10 text-warning border border-warning/20" };
      case "TEMPORARILY_SUSPENDED":
      case "Temporarily Suspended":
        return { label: "تعلیق موقت", color: "bg-warning/10 text-warning border border-warning/20" };
      case "BLOCKED":
      case "Blocked":
        return { label: "مسدود شده", color: "bg-danger/10 text-danger border border-danger/20" };
      default:
        return { label: status || "فعال", color: "bg-success/10 text-success border border-success/20" };
    }
  };

  const translateWarningLevel = (level: string) => {
    switch (level) {
      case "NONE":
        return { label: "عادی", color: "text-success bg-success/10" };
      case "LOW":
        return { label: "کم", color: "text-blue-400 bg-surface0/10" };
      case "MEDIUM":
        return { label: "متوسط", color: "text-warning bg-warning/10" };
      case "HIGH":
        return { label: "بالا", color: "text-warning bg-warning/10" };
      case "CRITICAL":
        return { label: "بحرانی", color: "text-danger bg-danger/10" };
      default:
        return { label: "عادی", color: "text-success bg-success/10" };
    }
  };

  // Filtered suppliers list
  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      (s.brandName || "").toLowerCase().includes(supplierSearch.toLowerCase()) ||
      (s.username || "").toLowerCase().includes(supplierSearch.toLowerCase()) ||
      (s.firstName || "").toLowerCase().includes(supplierSearch.toLowerCase()) ||
      (s.lastName || "").toLowerCase().includes(supplierSearch.toLowerCase());
    
    if (supplierStatusFilter === "all") return matchesSearch;
    return matchesSearch && s.status === supplierStatusFilter;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header and Quick Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-6 rounded-2xl border border-subtle">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary-default/10 text-primary-default rounded-xl">
            <Scale className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">سامانه مدیریت اخطارها و عملکرد تامین‌کنندگان</h1>
            <p className="text-muted text-sm mt-1">
              پایش مستمر امتیازها، ثبت تخلفات، تعلیق خودکار و کنترل دستی تمام قوانین B2B
            </p>
          </div>
        </div>
        <div className="flex bg-background p-1.5 rounded-xl border border-subtle">
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "stats" ? "bg-surface text-text-primary shadow-sm" : "text-muted hover:text-inverse"
            }`}
          >
            آمار و تنظیمات آستانه‌ها
          </button>
          <button
            onClick={() => setActiveTab("rules")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "rules" ? "bg-surface text-text-primary shadow-sm" : "text-muted hover:text-inverse"
            }`}
          >
            مدیریت قوانین جریمه
          </button>
          <button
            onClick={() => setActiveTab("suppliers")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "suppliers" ? "bg-surface text-text-primary shadow-sm" : "text-muted hover:text-inverse"
            }`}
          >
            عملکرد تامین‌کنندگان
          </button>
        </div>
      </div>

      {/* TAB 1: OVERALL STATS & CONFIG */}
      {activeTab === "stats" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Statistics Bento-Grid (Left) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface p-5 rounded-2xl border border-subtle flex items-center justify-between">
                <div>
                  <p className="text-muted text-xs">میانگین امتیاز تامین‌کنندگان</p>
                  <p className="text-3xl font-bold text-text-primary mt-1">
                    {stats ? `${stats.averageScore} / ۱۰۰` : "۱۰۰"}
                  </p>
                </div>
                <div className="p-3 bg-success/10 text-success rounded-xl">
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-surface p-5 rounded-2xl border border-subtle flex items-center justify-between">
                <div>
                  <p className="text-muted text-xs">کل جریمه‌های ثبت شده</p>
                  <p className="text-3xl font-bold text-text-primary mt-1">
                    {stats ? stats.totalPenalties : "۰"}
                  </p>
                </div>
                <div className="p-3 bg-warning/10 text-warning rounded-xl">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-surface p-5 rounded-2xl border border-subtle flex items-center justify-between">
                <div>
                  <p className="text-muted text-xs">کل تامین‌کنندگان پایش شده</p>
                  <p className="text-3xl font-bold text-text-primary mt-1">
                    {stats ? stats.totalSuppliers : "۰"}
                  </p>
                </div>
                <div className="p-3 bg-surface/10 text-blue-400 rounded-xl">
                  <User className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Top Violators & Recent Penalties */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Violators */}
              <div className="bg-surface p-6 rounded-2xl border border-subtle flex flex-col h-[350px]">
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2 mb-4">
                  <TrendingDown className="w-5 h-5 text-danger" />
                  بیشترین تخلف و افت امتیاز
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {loadingStats ? (
                    <div className="flex justify-center items-center h-full text-muted">در حال بارگذاری...</div>
                  ) : stats?.topViolators?.length > 0 ? (
                    stats.topViolators.map((v: any) => (
                      <div key={v.id} className="flex justify-between items-center bg-background p-3 rounded-xl border border-subtle">
                        <div>
                          <p className="font-medium text-sm text-text-primary">{v.brandName || v.username}</p>
                          <p className="text-xs text-muted mt-0.5">امتیاز منفی: {v.penaltyPoints} امتیاز</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded-md ${translateStatus(v.status).color}`}>
                            {translateStatus(v.status).label}
                          </span>
                          <p className="text-xs font-bold text-danger mt-1">{v.performanceScore} امتیاز عملکرد</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted py-8">
                      <CheckCircle className="w-12 h-12 text-success/20 mb-2" />
                      <p className="text-sm">هیچ تامین‌کننده متخلفی با امتیاز منفی ثبت نشده است.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Penalties Timeline */}
              <div className="bg-surface p-6 rounded-2xl border border-subtle flex flex-col h-[350px]">
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-primary-default" />
                  آخرین اخطارهای ثبت شده در سیستم
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {loadingStats ? (
                    <div className="flex justify-center items-center h-full text-muted">در حال بارگذاری...</div>
                  ) : stats?.recentPenalties?.length > 0 ? (
                    stats.recentPenalties.map((p: any) => (
                      <div key={p.id} className="bg-background p-3 rounded-xl border border-subtle flex flex-col gap-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs font-semibold text-danger">-{p.points} امتیاز</span>
                            <span className="text-muted text-xs mx-1">|</span>
                            <span className="text-xs font-medium text-text-primary">{p.supplier?.brandName || p.supplier?.username}</span>
                          </div>
                          <span className="text-[10px] text-muted">
                            {new Date(p.createdAt).toLocaleDateString("fa-IR")}
                          </span>
                        </div>
                        <p className="font-semibold text-xs text-text-primary mt-1">{p.reason}</p>
                        <p className="text-[11px] text-muted line-clamp-1">{p.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted py-8">
                      <FileText className="w-12 h-12 text-primary-default/20 mb-2" />
                      <p className="text-sm">هنوز جریمه‌ای ثبت نشده است.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Threshold Configurations Widget (Right) */}
          <div className="bg-surface p-6 rounded-2xl border border-subtle">
            <h3 className="text-lg font-bold text-text-primary flex items-center gap-2 mb-2">
              <Settings className="w-5 h-5 text-primary-default" />
              آستانه‌های تغییر وضعیت خودکار
            </h3>
            <p className="text-xs text-muted mb-6 leading-relaxed">
              با افزایش امتیاز منفی تامین‌کنندگان، وضعیت پنل آن‌ها به صورت کاملا خودکار تغییر می‌کند.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-2">
                  آستانه قرارگیری در وضعیت «تحت بررسی» (امتیاز منفی)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={config.underReviewThreshold}
                    onChange={(e) => setConfig({ ...config, underReviewThreshold: e.target.value })}
                    className="w-full bg-background border border-subtle rounded-xl px-4 py-2 text-text-primary text-sm font-semibold focus:outline-none focus:border-primary-default"
                  />
                  <span className="absolute left-4 top-2 text-xs text-muted">امتیاز</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-2">
                  آستانه «تعلیق موقت پنل» (امتیاز منفی)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={config.temporarySuspensionThreshold}
                    onChange={(e) => setConfig({ ...config, temporarySuspensionThreshold: e.target.value })}
                    className="w-full bg-background border border-subtle rounded-xl px-4 py-2 text-text-primary text-sm font-semibold focus:outline-none focus:border-primary-default"
                  />
                  <span className="absolute left-4 top-2 text-xs text-muted">امتیاز</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-2">
                  آستانه «مسدودسازی کامل پنل» (امتیاز منفی)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    required
                    value={config.blockedThreshold}
                    onChange={(e) => setConfig({ ...config, blockedThreshold: e.target.value })}
                    className="w-full bg-background border border-subtle rounded-xl px-4 py-2 text-text-primary text-sm font-semibold focus:outline-none focus:border-primary-default"
                  />
                  <span className="absolute left-4 top-2 text-xs text-muted">امتیاز</span>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.autoSuspensionEnabled}
                    onChange={(e) => setConfig({ ...config, autoSuspensionEnabled: e.target.checked })}
                    className="w-5 h-5 rounded border-subtle text-primary-default bg-background focus:ring-primary-default focus:ring-offset-background"
                  />
                  <span className="text-xs font-medium text-text-primary">
                    فعال‌سازی سیستم خودکار تعلیق و مسدودسازی
                  </span>
                </label>
                <p className="text-[10px] text-muted mr-8 mt-1 leading-relaxed">
                  در صورت غیرفعال بودن، تخلفات ثبت خواهند شد اما پنل تعلیق یا مسدود نمی‌شود. تغییرات در سابقه حسابرسی ثبت خواهند شد.
                </p>
              </div>

              <button
                type="submit"
                disabled={submittingConfig}
                className="w-full bg-primary-default text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-hover transition disabled:opacity-50 mt-4 cursor-pointer"
              >
                {submittingConfig ? "در حال ثبت و اعمال..." : "ذخیره و اعمال سراسری وضعیت"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE PENALTY RULES */}
      {activeTab === "rules" && (
        <div className="bg-surface p-6 rounded-2xl border border-subtle space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1 max-w-md relative">
              <input
                type="text"
                placeholder="جستجوی قوانین جریمه..."
                value={ruleSearch}
                onChange={(e) => setRuleSearch(e.target.value)}
                className="w-full bg-background border border-subtle rounded-xl pr-10 pl-4 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-default"
              />
              <Search className="absolute right-3 top-2.5 w-4.5 h-4.5 text-muted" />
            </div>

            <div className="flex gap-3 items-center w-full md:w-auto">
              <select
                value={ruleActiveFilter}
                onChange={(e) => setRuleActiveFilter(e.target.value)}
                className="bg-background border border-subtle rounded-xl px-4 py-2 text-text-primary text-sm focus:outline-none"
              >
                <option value="all">وضعیت: همه</option>
                <option value="active">فقط فعال</option>
                <option value="inactive">فقط غیرفعال</option>
              </select>

              <button
                onClick={() => {
                  setEditingRule(null);
                  setRuleForm({ title: "", description: "", negativePoints: 10, autoNotification: true, isActive: true });
                  setIsRuleModalOpen(true);
                }}
                className="flex items-center gap-2 bg-primary-default hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer"
              >
                <Plus className="w-4.5 h-4.5" />
                قانون جدید
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-subtle text-muted text-xs">
                  <th className="pb-3 font-semibold">عنوان قانون</th>
                  <th className="pb-3 font-semibold">شرح تخلف</th>
                  <th className="pb-3 font-semibold text-center">امتیاز منفی</th>
                  <th className="pb-3 font-semibold text-center">اعلان خودکار به تامین‌کننده</th>
                  <th className="pb-3 font-semibold text-center">وضعیت</th>
                  <th className="pb-3 font-semibold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {loadingRules ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted text-sm">در حال بارگذاری قوانین...</td>
                  </tr>
                ) : rules.length > 0 ? (
                  rules.map((rule) => (
                    <tr key={rule.id} className="border-b border-subtle/50 hover:bg-background/20 text-sm">
                      <td className="py-4 font-semibold text-text-primary">{rule.title}</td>
                      <td className="py-4 text-muted max-w-xs truncate">{rule.description}</td>
                      <td className="py-4 text-center font-bold text-danger">-{rule.negativePoints}</td>
                      <td className="py-4 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-md ${
                          rule.autoNotification ? "bg-primary-default/10 text-primary-default" : "bg-background/10 text-text-muted"
                        }`}>
                          {rule.autoNotification ? "بله" : "خیر"}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-md ${
                          rule.isActive ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                        }`}>
                          {rule.isActive ? "فعال" : "غیرفعال"}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => openEditRule(rule)}
                            className="p-1.5 hover:bg-background rounded-lg text-muted hover:text-text-primary transition cursor-pointer"
                            title="ویرایش"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1.5 hover:bg-background rounded-lg text-muted hover:text-danger transition cursor-pointer"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted">قانونی یافت نشد. برای ایجاد قانون جدید کلیک کنید.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUPPLIER PERFORMANCE & PROFILES */}
      {activeTab === "suppliers" && (
        <div className="bg-surface p-6 rounded-2xl border border-subtle space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1 max-w-md relative">
              <input
                type="text"
                placeholder="جستجو بر اساس نام تجاری، ایمیل یا نام کاربری..."
                value={supplierSearch}
                onChange={(e) => setSupplierSearch(e.target.value)}
                className="w-full bg-background border border-subtle rounded-xl pr-10 pl-4 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-default"
              />
              <Search className="absolute right-3 top-2.5 w-4.5 h-4.5 text-muted" />
            </div>

            <div className="flex gap-3 items-center">
              <select
                value={supplierStatusFilter}
                onChange={(e) => setSupplierStatusFilter(e.target.value)}
                className="bg-background border border-subtle rounded-xl px-4 py-2 text-text-primary text-sm focus:outline-none"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="ACTIVE">فعال</option>
                <option value="UNDER_REVIEW">تحت بررسی</option>
                <option value="TEMPORARILY_SUSPENDED">تعلیق موقت</option>
                <option value="BLOCKED">مسدود شده</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-subtle text-muted text-xs">
                  <th className="pb-3 font-semibold">تامین‌کننده</th>
                  <th className="pb-3 font-semibold text-center">امتیاز عملکرد</th>
                  <th className="pb-3 font-semibold text-center">امتیاز منفی</th>
                  <th className="pb-3 font-semibold text-center">سطح هشدار</th>
                  <th className="pb-3 font-semibold text-center">وضعیت فعلی</th>
                  <th className="pb-3 font-semibold text-center">عملیات پایش</th>
                </tr>
              </thead>
              <tbody>
                {loadingSuppliers ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted">در حال بارگذاری لیست عملکرد...</td>
                  </tr>
                ) : filteredSuppliers.length > 0 ? (
                  filteredSuppliers.map((sup) => (
                    <tr key={sup.id} className="border-b border-subtle/50 hover:bg-background/20 text-sm">
                      <td className="py-4">
                        <div>
                          <p className="font-semibold text-text-primary">{sup.brandName || "نام تجاری ثبت نشده"}</p>
                          <p className="text-xs text-muted mt-0.5">@{sup.username} | {sup.mobile || "-"}</p>
                        </div>
                      </td>
                      <td className="py-4 text-center font-bold">
                        <span className={`text-sm ${sup.performanceScore > 75 ? "text-success" : sup.performanceScore > 50 ? "text-warning" : "text-danger"}`}>
                          {sup.performanceScore} / ۱۰۰
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className="font-semibold text-danger">{sup.penaltyPoints || 0}</span>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`text-xs px-2 py-0.5 rounded-md ${translateWarningLevel(sup.warningLevel).color}`}>
                          {translateWarningLevel(sup.warningLevel).label}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`text-xs px-2.5 py-1 rounded-md font-semibold ${translateStatus(sup.status).color}`}>
                          {translateStatus(sup.status).label}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => viewSupplierProfile(sup.id)}
                            className="text-xs font-semibold bg-background border border-subtle text-text-primary px-3 py-1.5 rounded-lg hover:border-primary-default transition cursor-pointer"
                          >
                            مشاهده پروفایل جریمه
                          </button>
                          <button
                            onClick={() => {
                              setSelectedSupplier(sup);
                              setIsPenaltyModalOpen(true);
                            }}
                            className="text-xs font-semibold bg-danger/10 hover:bg-danger/20 text-danger border border-danger/20 px-3 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            اعمال جریمه جدید
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted">هیچ تامین‌کننده‌ای با این معیارها پیدا نشد.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT RULE */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-surface max-w-md w-full rounded-2xl border border-subtle p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-subtle">
              <h3 className="text-lg font-bold text-text-primary">
                {editingRule ? "ویرایش قانون جریمه" : "تعریف قانون جریمه جدید"}
              </h3>
              <button
                onClick={() => {
                  setIsRuleModalOpen(false);
                  setEditingRule(null);
                }}
                className="p-1 text-muted hover:text-text-primary transition rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRuleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-2">عنوان جریمه / نوع خطا</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: لغو مکرر سفارشات"
                  value={ruleForm.title}
                  onChange={(e) => setRuleForm({ ...ruleForm, title: e.target.value })}
                  className="w-full bg-background border border-subtle rounded-xl px-4 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-default"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-2">توضیحات تکمیلی قانون</label>
                <textarea
                  placeholder="مثال: لغو سفارش بیش از ۲ بار در یک هفته کاری..."
                  rows={3}
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                  className="w-full bg-background border border-subtle rounded-xl px-4 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-default"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-2">امتیاز منفی</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={ruleForm.negativePoints}
                    onChange={(e) => setRuleForm({ ...ruleForm, negativePoints: parseInt(e.target.value) })}
                    className="w-full bg-background border border-subtle rounded-xl px-4 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-default"
                  />
                </div>

                <div className="flex items-center justify-center pt-6">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={ruleForm.autoNotification}
                      onChange={(e) => setRuleForm({ ...ruleForm, autoNotification: e.target.checked })}
                      className="w-4 h-4 rounded border-subtle text-primary-default bg-background"
                    />
                    <span className="text-xs font-medium text-text-primary">اعلان خودکار به کاربر</span>
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={ruleForm.isActive}
                    onChange={(e) => setRuleForm({ ...ruleForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded border-subtle text-primary-default bg-background"
                  />
                  <span className="text-xs font-medium text-text-primary">فعال بودن قانون در سیستم</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-primary-default text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-hover transition mt-4 cursor-pointer"
              >
                {editingRule ? "بروزرسانی قانون" : "ایجاد قانون و پیاده‌سازی"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: APPLY PENALTY */}
      {isPenaltyModalOpen && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-surface max-w-lg w-full rounded-2xl border border-subtle p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center pb-3 border-b border-subtle">
              <div>
                <h3 className="text-lg font-bold text-text-primary">ثبت و اعمال جریمه جدید</h3>
                <p className="text-xs text-muted mt-0.5">تامین‌کننده: {selectedSupplier?.brandName || selectedSupplier?.username}</p>
              </div>
              <button
                onClick={() => {
                  setIsPenaltyModalOpen(false);
                  setPenaltyForm({ reason: "", points: 10, description: "", orderNumber: "", usePreset: "" });
                }}
                className="p-1 text-muted hover:text-text-primary transition rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyPenalty} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-2">استفاده از الگوهای آماده اخطارها</label>
                <select
                  value={penaltyForm.usePreset}
                  onChange={(e) => handlePresetChange(e.target.value)}
                  className="w-full bg-background border border-subtle rounded-xl px-4 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-default"
                >
                  <option value="">-- انتخاب جریمه پیش‌فرض یا ثبت جریمه سفارشی --</option>
                  {rules.filter(r => r.isActive).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} (-{r.negativePoints} امتیاز)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-2">علت و عنوان تخلف</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: لغو سفارش به دلیل عدم تطابق قیمت"
                  value={penaltyForm.reason}
                  onChange={(e) => setPenaltyForm({ ...penaltyForm, reason: e.target.value })}
                  className="w-full bg-background border border-subtle rounded-xl px-4 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-default"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-2">امتیاز جریمه</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={penaltyForm.points}
                    onChange={(e) => setPenaltyForm({ ...penaltyForm, points: parseInt(e.target.value) })}
                    className="w-full bg-background border border-subtle rounded-xl px-4 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-default"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-primary mb-2">شماره سفارش مربوطه (اختیاری)</label>
                  <input
                    type="text"
                    placeholder="مثال: ORD-2026-904"
                    value={penaltyForm.orderNumber}
                    onChange={(e) => setPenaltyForm({ ...penaltyForm, orderNumber: e.target.value })}
                    className="w-full bg-background border border-subtle rounded-xl px-4 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-default"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-2">توضیحات و جزئیات نقض قوانین</label>
                <textarea
                  required
                  placeholder="توضیحات کاملی جهت ثبت در سابقه پنل تامین‌کننده وارد کنید..."
                  rows={3}
                  value={penaltyForm.description}
                  onChange={(e) => setPenaltyForm({ ...penaltyForm, description: e.target.value })}
                  className="w-full bg-background border border-subtle rounded-xl px-4 py-2 text-text-primary text-sm focus:outline-none focus:border-primary-default"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-danger hover:bg-danger text-white py-2.5 rounded-xl text-sm font-semibold transition mt-4 cursor-pointer"
              >
                ثبت جریمه، کسر امتیاز و اعلام پیام خودکار
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SUPPLIER PERFORMANCE PROFILE MODAL */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fade-in">
          <div className="bg-surface max-w-2xl w-full rounded-2xl border border-subtle p-6 space-y-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-subtle">
              <div>
                <h3 className="text-lg font-bold text-text-primary">پروفایل جامع عملکرد و اخطارهای تامین‌کننده</h3>
                <p className="text-xs text-muted">شناسایی تخلفات، ردپای سفارشات و جریمه‌ها</p>
              </div>
              <button
                onClick={() => {
                  setIsProfileModalOpen(false);
                  setProfileData(null);
                }}
                className="p-1 text-muted hover:text-text-primary transition rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingProfile ? (
              <div className="py-12 flex justify-center items-center text-muted">در حال بارگذاری جزئیات پروفایل...</div>
            ) : profileData ? (
              <div className="space-y-6">
                {/* Visual Status Blocks */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-background p-4 rounded-xl border border-subtle text-center">
                    <p className="text-[10px] text-muted">نام تجاری</p>
                    <p className="font-bold text-sm text-text-primary mt-1 truncate">{profileData.supplier.brandName || "ثبت نشده"}</p>
                  </div>
                  <div className="bg-background p-4 rounded-xl border border-subtle text-center">
                    <p className="text-[10px] text-muted">امتیاز عملکرد</p>
                    <p className={`font-bold text-lg mt-1 ${profileData.supplier.performanceScore > 75 ? "text-success" : "text-danger"}`}>
                      {profileData.supplier.performanceScore} / ۱۰۰
                    </p>
                  </div>
                  <div className="bg-background p-4 rounded-xl border border-subtle text-center">
                    <p className="text-[10px] text-muted">امتیاز منفی ثبت‌شده</p>
                    <p className="font-bold text-lg text-danger mt-1">{profileData.supplier.penaltyPoints || 0}</p>
                  </div>
                  <div className="bg-background p-4 rounded-xl border border-subtle text-center">
                    <p className="text-[10px] text-muted">وضعیت پنل</p>
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-md mt-1.5 font-semibold ${translateStatus(profileData.supplier.status).color}`}>
                      {translateStatus(profileData.supplier.status).label}
                    </span>
                  </div>
                </div>

                {/* Orders Affected */}
                <div className="bg-background p-4 rounded-xl border border-subtle space-y-2">
                  <h4 className="text-xs font-bold text-text-primary flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary-default" />
                    سفارش‌های تحت تاثیر تخلفات ({profileData.affectedOrdersCount} مورد)
                  </h4>
                  {profileData.distinctAffectedOrders?.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {profileData.distinctAffectedOrders.map((orderNo: string, idx: number) => (
                        <span key={idx} className="bg-surface border border-subtle text-text-primary text-xs px-2.5 py-1 rounded-lg font-mono">
                          {orderNo}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted">هیچ سفارش لغو شده یا با تاخیری برای این تامین‌کننده ثبت نشده است.</p>
                  )}
                </div>

                {/* Timeline and History */}
                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary-default" />
                    تایم‌لاین اخطارها و تاریخچه تخلفات
                  </h4>

                  <div className="space-y-4 relative before:absolute before:right-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-subtle/55 pr-8">
                    {profileData.penalties?.length > 0 ? (
                      profileData.penalties.map((penalty: any) => (
                        <div key={penalty.id} className="relative bg-background p-4 rounded-xl border border-subtle space-y-2">
                          {/* Dot indicator */}
                          <div className="absolute -right-10 top-5 w-4 h-4 rounded-full bg-danger/20 border border-danger/80 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-danger rounded-full"></div>
                          </div>

                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs font-bold text-danger">-{penalty.points} امتیاز</span>
                              <span className="text-xs text-text-primary font-bold mr-2">{penalty.reason}</span>
                            </div>
                            <span className="text-[10px] text-muted">{new Date(penalty.createdAt).toLocaleDateString("fa-IR")}</span>
                          </div>

                          <p className="text-xs text-muted leading-relaxed">{penalty.description}</p>

                          <div className="flex justify-between items-center text-[10px] text-muted pt-1 border-t border-subtle/30">
                            <span>ثبت کننده: {penalty.adminName || "سیستم خودکار"}</span>
                            {penalty.orderNumber && (
                              <span className="font-mono bg-surface px-1.5 py-0.5 rounded">شماره سفارش: {penalty.orderNumber}</span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-muted text-xs">بدون سابقه تخلف. امتیاز عملکرد تامین‌کننده ۱۰۰٪ است!</div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted">داده‌ای یافت نشد.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
