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
  Zap,
  AlertTriangle,
  Calculator,
  SendHorizontal
} from "lucide-react";
import { toast } from "../GlobalToast";

export interface SupplierSmsPattern {
  id: string;
  title: string;
  code: string;
  var2?: string;
  var3?: string;
}

export interface SmsPatternPreset {
  id: string;
  title: string;
  code: string;
  template: string;
  var0Desc?: string;
  var2?: string;
  var3?: string;
  isDefault?: boolean;
}

export const DEFAULT_LEAD_PATTERNS: SmsPatternPreset[] = [
  {
    id: "lead-pat-1",
    title: "الگوی اصلی: دعوت تامین‌کننده (رایگان چندبرابر)",
    code: "248910",
    template: `مدیریت محترم {0}؛
فروش کالایتان را رایگان چندبرابر کنید!
اتصال به دهها فروشگاه آنلاین.
ثبت‌نام: zopit.ir/register/supplier`,
    var0Desc: "نام تامین‌کننده (در صورت خالی بودن: نام مدیریت)",
    var2: "",
    var3: "",
    isDefault: true
  },
  {
    id: "lead-pat-2",
    title: "الگوی دوم: فرصت فروش مستقیم و بدون کارمزد",
    code: "248911",
    template: `مدیریت محترم {0}؛
فرصت فروش بی‌واسطه محصولات شما به هزاران مشتری شبکه زوپیت.
بدون کارمزد اولیه.
لینک ثبت‌نام: zopit.ir/register/supplier`,
    var0Desc: "نام تامین‌کننده (در صورت خالی بودن: نام مدیریت)",
    var2: "",
    var3: "",
    isDefault: false
  },
  {
    id: "lead-pat-3",
    title: "الگوی سوم: یادآوری و دعوت ویژه همکاران",
    code: "248912",
    template: `همکار گرامی، مدیریت محترم {0}؛
محصولاتتان را به بازارهای اینترنتی زوپیت معرفی کنید.
عضویت سریع: zopit.ir/register/supplier`,
    var0Desc: "نام تامین‌کننده (در صورت خالی بودن: نام مدیریت)",
    var2: "",
    var3: "",
    isDefault: false
  }
];

interface Lead {
  id: number;
  name: string;
  managerName?: string | null;
  phone: string;
  additionalPhones?: string | null;
  websiteUrl?: string | null;
  address?: string | null;
  category?: string | null;
  commission: number;
  status: "PENDING" | "ASSIGNED" | "IN_NEGOTIATION" | "COMPLETED" | "CANCELLED";
  isPublished?: boolean;
  ambassadorId?: number | null;
  smsPatterns?: string | null;
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
  inProgressCommissions?: number;
  potentialSavingsCommissions?: number;
  ambassadorsCount: number;
  savedInvitePattern?: string;
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
    inProgressCommissions: 0,
    potentialSavingsCommissions: 0,
    ambassadorsCount: 0,
    savedInvitePattern: ""
  });

  const [loading, setLoading] = useState(true);
  const [activeViewTab, setActiveViewTab] = useState<"leads" | "ambassadors">("leads");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [ambassadorFilter, setAmbassadorFilter] = useState<string>("ALL");
  const [publishFilter, setPublishFilter] = useState<string>("ALL");

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showAdditionalPhones, setShowAdditionalPhones] = useState(false);
  const [showMoreFormFields, setShowMoreFormFields] = useState(false);
  const [viewingLeadDetails, setViewingLeadDetails] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    managerName: "",
    phone: "",
    additionalPhones: "",
    websiteUrl: "",
    address: "",
    category: "لوازم جانبی و دیجیتال",
    commission: 150000,
    ambassadorId: "",
    isPublished: false,
    smsPatterns: [] as SupplierSmsPattern[]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBulkPublishing, setIsBulkPublishing] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<number[]>([]);

  // SMS & Excel Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeExportTab, setActiveExportTab] = useState<"direct_sms" | "excel_export" | "telegram">("direct_sms");
  const [exportScope, setExportScope] = useState<"ALL" | "CURRENT_FILTER" | "DRAFTS" | "SELECTED" | "PENDING" | "ASSIGNED" | "COMPLETED">("DRAFTS");
  const [exportIncludeAdditional, setExportIncludeAdditional] = useState(true);
  const [exportOnlyMobiles, setExportOnlyMobiles] = useState(true);
  const [exportDeduplicate, setExportDeduplicate] = useState(true);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Direct SMS Configuration State
  const [smsMethod, setSmsMethod] = useState<"pattern" | "text">("pattern");
  const [leadPatterns, setLeadPatterns] = useState<SmsPatternPreset[]>(DEFAULT_LEAD_PATTERNS);
  const [selectedPatternId, setSelectedPatternId] = useState<string>("lead-pat-1");
  const [showPatternEditorModal, setShowPatternEditorModal] = useState(false);
  const [editingPattern, setEditingPattern] = useState<SmsPatternPreset | null>(null);
  const [patternForm, setPatternForm] = useState({
    title: "",
    code: "",
    template: "",
    var2: "",
    var3: ""
  });
  const [smsPatternCode, setSmsPatternCode] = useState("248910");
  const [patternVar2, setPatternVar2] = useState("");
  const [patternVar3, setPatternVar3] = useState("");
  const [testMobileNumber, setTestMobileNumber] = useState("");
  const [testLeadName, setTestLeadName] = useState("");
  const [isSendingTestSms, setIsSendingTestSms] = useState(false);
  const [showRecipientList, setShowRecipientList] = useState(false);
  const [bulkSmsReport, setBulkSmsReport] = useState<{
    totalRecipients: number;
    sentCount: number;
    failedCount: number;
    errors?: string[];
    message: string;
  } | null>(null);
  const [smsDirectText, setSmsDirectText] = useState("سلام و احترام، از شما جهت حضور به عنوان تامین‌کننده کالا در سامانه دعوت به عمل می‌آید.");
  const [autoPublishAfterSms, setAutoPublishAfterSms] = useState(true);
  const [isSendingSms, setIsSendingSms] = useState(false);

  const [fetchError, setFetchError] = useState<string | null>(null);

  // Helper to resolve display name according to user requirement:
  // "این متغیر صفری که تنظیم کردم اینو باید اسم اون تامین‌کننده باشه. حالا اگر نام نداشت، چون بعضی از تامین‌کننده‌ها نام ندارند، نام مدیریت رو بیاره."
  const getLeadDisplayNameInfo = (lead: Lead | null | undefined) => {
    if (!lead) return { name: "تامین‌کننده نمونه", source: "default" as const };
    const shopName = (lead.name || "").trim();
    const managerName = (lead.managerName || "").trim();
    if (shopName && shopName !== "بدون نام" && shopName !== "-" && shopName !== "تامین‌کننده" && shopName !== "تامین کننده") {
      return { name: shopName, source: "shop" as const };
    }
    if (managerName && managerName !== "بدون نام" && managerName !== "-" && managerName !== "مدیریت") {
      return { name: managerName, source: "manager" as const };
    }
    return { name: "فروشگاه", source: "default" as const };
  };

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
        if (data.patterns && Array.isArray(data.patterns) && data.patterns.length > 0) {
          setLeadPatterns(data.patterns);
          const firstPat = data.patterns.find((p: SmsPatternPreset) => p.code === smsPatternCode) || data.patterns[0];
          if (firstPat) {
            setSelectedPatternId(firstPat.id);
            if (!smsPatternCode) setSmsPatternCode(firstPat.code);
            if (firstPat.var2 && !patternVar2) setPatternVar2(firstPat.var2);
            if (firstPat.var3 && !patternVar3) setPatternVar3(firstPat.var3);
          }
        }
        if (data.stats) {
          setStats(data.stats);
          if (data.stats.savedInvitePattern && !smsPatternCode) {
            setSmsPatternCode(data.stats.savedInvitePattern);
          }
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
        managerName: formData.managerName.trim(),
        phone: formData.phone.trim(),
        additionalPhones: formData.additionalPhones.trim(),
        websiteUrl: formData.websiteUrl.trim(),
        address: formData.address.trim(),
        category: formData.category.trim(),
        commission: Number(formData.commission),
        isPublished: Boolean(formData.isPublished),
        ambassadorId: formData.ambassadorId ? Number(formData.ambassadorId) : null,
        smsPatterns: JSON.stringify(formData.smsPatterns || [])
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
          managerName: "",
          phone: "",
          additionalPhones: "",
          websiteUrl: "",
          address: "",
          category: "لوازم جانبی و دیجیتال",
          commission: 150000,
          ambassadorId: "",
          isPublished: false,
          smsPatterns: []
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
    // If we have selections, publish those. Otherwise, default to publishing all drafts.
    const isSelective = selectedLeadIds.length > 0;
    
    let countToPublish = 0;
    let confirmMsg = "";

    if (isSelective) {
      countToPublish = selectedLeadIds.length;
      confirmMsg = `آیا از انتشار ${countToPublish.toLocaleString("fa-IR")} پرونده انتخاب‌شده برای تأمین‌یاب‌ها اطمینان دارید؟`;
    } else {
      const draftCount = leads.filter(l => !l.isPublished).length;
      if (draftCount === 0) {
        toast.error("هیچ پرونده پیش‌نویسی برای انتشار وجود ندارد.");
        return;
      }
      countToPublish = draftCount;
      confirmMsg = `آیا از انتشار همگانی ${countToPublish.toLocaleString("fa-IR")} پرونده پیش‌نویس برای تمام تأمین‌یاب‌ها اطمینان دارید؟ (در صورت تمایل به انتشار موارد خاص، می‌توانید آنها را از لیست تیک بزنید)`;
    }

    if (!window.confirm(confirmMsg)) {
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
        body: JSON.stringify({ leadIds: isSelective ? selectedLeadIds : [] })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || "پرونده‌ها با موفقیت برای تأمین‌یاب‌ها منتشر شدند.");
        setSelectedLeadIds([]); // Clear selection
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

    let parsedPatterns: SupplierSmsPattern[] = [];
    if (lead.smsPatterns) {
      try {
        parsedPatterns = typeof lead.smsPatterns === "string" ? JSON.parse(lead.smsPatterns) : lead.smsPatterns;
        if (!Array.isArray(parsedPatterns)) parsedPatterns = [];
      } catch {
        if (typeof lead.smsPatterns === "string" && lead.smsPatterns.trim()) {
          parsedPatterns = [{ id: "p1", title: "الگوی اصلی", code: lead.smsPatterns.trim() }];
        }
      }
    }

    setFormData({
      name: lead.name,
      managerName: lead.managerName || "",
      phone: lead.phone,
      additionalPhones: lead.additionalPhones || "",
      websiteUrl: lead.websiteUrl || "",
      address: lead.address || "",
      category: lead.category || "لوازم جانبی و دیجیتال",
      commission: lead.commission || 150000,
      ambassadorId: lead.ambassadorId ? String(lead.ambassadorId) : "",
      isPublished: Boolean(lead.isPublished),
      smsPatterns: parsedPatterns
    });
    setShowAdditionalPhones(Boolean(lead.additionalPhones));
    setShowMoreFormFields(Boolean(lead.additionalPhones || lead.websiteUrl || lead.category !== "لوازم جانبی و دیجیتال" || lead.commission !== 150000 || lead.ambassadorId));
    setShowAddModal(true);
  };

  // Filtered Leads
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.managerName && lead.managerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
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

  // Real-time duplicate check for lead creation/editing
  const duplicateMatches = useMemo(() => {
    const currentPhone = formData.phone.replace(/\D/g, "");
    const currentName = formData.name.trim().toLowerCase();
    const currentManager = formData.managerName.trim().toLowerCase();
    const currentAddPhones = formData.additionalPhones.replace(/\D/g, "");

    if (!currentPhone && !currentName && !currentManager && !currentAddPhones) return [];

    const matches: { lead: Lead; reasons: string[] }[] = [];

    for (const lead of leads) {
      if (editingLead && lead.id === editingLead.id) continue;

      const reasons: string[] = [];
      const leadPhone = lead.phone.replace(/\D/g, "");
      const leadAddPhones = (lead.additionalPhones || "").replace(/\D/g, "");
      const leadName = lead.name.trim().toLowerCase();
      const leadManager = (lead.managerName || "").trim().toLowerCase();

      // 1. Primary phone check
      if (currentPhone && currentPhone.length >= 7) {
        if (leadPhone.length >= 7 && (leadPhone.endsWith(currentPhone) || currentPhone.endsWith(leadPhone))) {
          reasons.push("شماره تماس اصلی یکسان است");
        } else if (leadAddPhones && leadAddPhones.length >= 7 && (leadAddPhones.includes(currentPhone) || currentPhone.includes(leadAddPhones))) {
          reasons.push("شماره تماس با شماره فرعی این تامین‌کننده یکسان است");
        }
      }

      // 2. Secondary phone check
      if (currentAddPhones && currentAddPhones.length >= 7) {
        if (leadPhone.length >= 7 && (leadPhone.endsWith(currentAddPhones) || currentAddPhones.endsWith(leadPhone))) {
          reasons.push("شماره همراه فرعی جدید با شماره اصلی این پرونده مطابقت دارد");
        }
      }

      // 3. Name check
      if (currentName && currentName.length >= 2) {
        if (leadName === currentName) {
          reasons.push("نام تامین‌کننده دقیقاً یکسان است");
        } else if (leadName.includes(currentName) || currentName.includes(leadName)) {
          reasons.push("تشابه اسمی در نام تامین‌کننده");
        }
      }

      // 4. Manager name check
      if (currentManager && currentManager.length >= 3 && leadManager) {
        if (leadManager === currentManager) {
          reasons.push("نام مدیر یکسان است");
        }
      }

      if (reasons.length > 0) {
        matches.push({ lead, reasons });
      }
    }

    return matches;
  }, [formData.phone, formData.name, formData.managerName, formData.additionalPhones, leads, editingLead]);

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
      case "DRAFTS":
        return leads.filter((l) => !l.isPublished);
      case "SELECTED":
        return selectedLeadIds.length > 0 ? leads.filter((l) => selectedLeadIds.includes(l.id)) : leads;
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
  }, [leads, filteredLeads, exportScope, selectedLeadIds]);

  // Available SMS patterns extracted from target leads or system defaults
  const availableLeadPatterns = useMemo(() => {
    const list: Array<{ id?: string; title: string; code: string; var2?: string; var3?: string; supplierName?: string }> = [];
    const seenCodes = new Set<string>();

    const targetList = targetLeadsForExport.length > 0 ? targetLeadsForExport : leads;
    targetList.forEach((lead) => {
      if (lead.smsPatterns) {
        try {
          const arr = typeof lead.smsPatterns === "string" ? JSON.parse(lead.smsPatterns) : lead.smsPatterns;
          if (Array.isArray(arr)) {
            arr.forEach((p: any) => {
              if (p && p.code && !seenCodes.has(p.code)) {
                seenCodes.add(p.code);
                list.push({
                  id: p.id,
                  title: p.title || `پترن ${p.code}`,
                  code: String(p.code).trim(),
                  var2: p.var2,
                  var3: p.var3,
                  supplierName: lead.name
                });
              }
            });
          }
        } catch {}
      }
    });

    if (stats.savedInvitePattern && !seenCodes.has(stats.savedInvitePattern)) {
      list.unshift({
        title: "الگوی پیش‌فرض دعوت سامانه",
        code: stats.savedInvitePattern,
        var2: "zopit.ir",
        var3: ""
      });
    }

    return list;
  }, [targetLeadsForExport, leads, stats.savedInvitePattern]);

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

  // Statistics on mobile vs landline / filtered
  const phoneStats = useMemo(() => {
    let rawTotal = 0;
    targetLeadsForExport.forEach((lead) => {
      rawTotal += cleanPhoneDigits(lead.phone).length;
      if (exportIncludeAdditional) {
        rawTotal += cleanPhoneDigits(lead.additionalPhones).length;
      }
    });
    const validMobiles = exportData.filter((i) => i.isMobile).length;
    const landlines = Math.max(0, rawTotal - validMobiles);
    return { rawTotal, validMobiles, landlines };
  }, [targetLeadsForExport, exportIncludeAdditional, exportData]);

  // Export handlers
  const handleDownloadMeliPayamakExcel = () => {
    // Strictly Iranian mobile numbers in English format (09xxxxxxxxx), under each other, single column, zero extra info
    const mobileRows = exportData
      .filter((item) => item.isMobile)
      .map((item) => ({
        "شماره تلفن": item.phone
      }));

    if (mobileRows.length === 0) {
      toast.error("شماره موبایل معتبری (همراه ۰۹) برای فایل ملی‌پیامک یافت نشد (شماره‌های ثابت تفکیک شدند).");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(mobileRows);
    worksheet["!cols"] = [{ wch: 18 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "شماره‌ها");
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `melipayamak_numbers_${dateStr}.xlsx`);
    toast.success(`فایل استاندارد ملی‌پیامک (تک‌ستونه شماره‌ها زیر هم) با ${mobileRows.length.toLocaleString("fa-IR")} شماره دانلود شد.`);
  };

  const handleDownloadMeliPayamakPhonebook = () => {
    const phonebookRows = exportData
      .filter((item) => item.isMobile)
      .map((item) => ({
        "شماره همراه": item.phone,
        "نام مخاطب": item.name
      }));

    if (phonebookRows.length === 0) {
      toast.error("شماره موبایلی برای دفترچه تلفن یافت نشد.");
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(phonebookRows);
    worksheet["!cols"] = [{ wch: 18 }, { wch: 30 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "دفترچه تلفن");
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(workbook, `melipayamak_phonebook_${dateStr}.xlsx`);
    toast.success(`فایل دفترچه تلفن ملی‌پیامک (۲ ستونه) با ${phonebookRows.length.toLocaleString("fa-IR")} مخاطب دانلود شد.`);
  };

  const handleSelectPattern = (pat: SmsPatternPreset) => {
    setSelectedPatternId(pat.id);
    setSmsPatternCode(pat.code);
    if (pat.var2) setPatternVar2(pat.var2);
    if (pat.var3) setPatternVar3(pat.var3);
    toast.success(`الگوی «${pat.title}» (کد: ${pat.code}) انتخاب شد.`);
  };

  const handleOpenNewPatternModal = () => {
    setEditingPattern(null);
    setPatternForm({
      title: `الگوی ${leadPatterns.length + 1}`,
      code: "",
      template: `مدیریت محترم {0}؛\nفروش کالایتان را رایگان چندبرابر کنید!\nاتصال به دهها فروشگاه آنلاین.\nثبت‌نام: zopit.ir/register/supplier`,
      var2: "",
      var3: ""
    });
    setShowPatternEditorModal(true);
  };

  const handleOpenEditPatternModal = (pat: SmsPatternPreset) => {
    setEditingPattern(pat);
    setPatternForm({
      title: pat.title,
      code: pat.code,
      template: pat.template || "",
      var2: pat.var2 || "",
      var3: pat.var3 || ""
    });
    setShowPatternEditorModal(true);
  };

  const handleSavePatternPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patternForm.title.trim() || !patternForm.code.trim()) {
      toast.error("عنوان الگو و کد پترن الزامی است.");
      return;
    }

    let updatedList: SmsPatternPreset[] = [];
    if (editingPattern) {
      updatedList = leadPatterns.map((p) =>
        p.id === editingPattern.id
          ? {
              ...p,
              title: patternForm.title.trim(),
              code: patternForm.code.trim(),
              template: patternForm.template.trim(),
              var2: patternForm.var2.trim(),
              var3: patternForm.var3.trim()
            }
          : p
      );
    } else {
      const newPat: SmsPatternPreset = {
        id: `lead-pat-${Date.now()}`,
        title: patternForm.title.trim(),
        code: patternForm.code.trim(),
        template: patternForm.template.trim() || `مدیریت محترم {0}؛\nفروش کالایتان را رایگان چندبرابر کنید!\nثبت‌نام: zopit.ir/register/supplier`,
        var0Desc: "نام تامین‌کننده (یا نام مدیریت)",
        var2: patternForm.var2.trim(),
        var3: patternForm.var3.trim(),
        isDefault: false
      };
      updatedList = [...leadPatterns, newPat];
      setSelectedPatternId(newPat.id);
      setSmsPatternCode(newPat.code);
    }

    setLeadPatterns(updatedList);
    setShowPatternEditorModal(false);
    setEditingPattern(null);

    // Save to server
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/admin/leads/patterns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ patterns: updatedList })
      });
      toast.success("الگوی پترن با موفقیت در سیستم ذخیره گردید.");
    } catch {
      toast.success("الگوی پترن در حافظه مرورگر ذخیره شد.");
    }
  };

  const handleDeletePatternPreset = async (id: string) => {
    if (leadPatterns.length <= 1) {
      toast.error("حداقل یک الگوی پترن باید در سیستم باقی بماند.");
      return;
    }
    const updated = leadPatterns.filter((p) => p.id !== id);
    setLeadPatterns(updated);
    if (selectedPatternId === id) {
      handleSelectPattern(updated[0]);
    }
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/admin/leads/patterns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ patterns: updated })
      });
      toast.success("الگوی پترن با موفقیت حذف گردید.");
    } catch {}
  };

  const activeSelectedPattern = useMemo(() => {
    return leadPatterns.find((p) => p.id === selectedPatternId) || leadPatterns.find((p) => p.code === smsPatternCode) || leadPatterns[0];
  }, [leadPatterns, selectedPatternId, smsPatternCode]);

  const renderedPreviewText = useMemo(() => {
    const template = activeSelectedPattern?.template || `مدیریت محترم {0}؛\nفروش کالایتان را رایگان چندبرابر کنید!\nاتصال به دهها فروشگاه آنلاین.\nثبت‌نام: zopit.ir/register/supplier`;
    const firstLead = targetLeadsForExport.length > 0 ? targetLeadsForExport[0] : null;
    const nameInfo = getLeadDisplayNameInfo(firstLead);
    const var0 = nameInfo.name;
    const var1 = patternVar2.trim() || "zopit.ir";
    const var2 = patternVar3.trim() || "021";

    let text = template.replace(/\{0\}/g, var0);
    text = text.replace(/\{1\}/g, var1);
    text = text.replace(/\{2\}/g, var2);
    text = text.replace(/\{name\}/g, var0);
    return text;
  }, [activeSelectedPattern, targetLeadsForExport, patternVar2, patternVar3]);

  const handleSendTestSms = async () => {
    if (!testMobileNumber.trim()) {
      toast.error("لطفاً شماره موبایل مقصد را جهت دریافت پیامک تستی وارد نمایید.");
      return;
    }
    if (smsMethod === "pattern" && !smsPatternCode.trim()) {
      toast.error("لطفاً شناسه پترن تایید شده ملی‌پیامک را وارد فرمایید.");
      return;
    }

    setIsSendingTestSms(true);
    try {
      const token = localStorage.getItem("token");
      const patternValues = [
        "{name}",
        ...(patternVar2.trim() ? [patternVar2.trim()] : []),
        ...(patternVar3.trim() ? [patternVar3.trim()] : [])
      ];

      const firstLead = targetLeadsForExport.length > 0 ? targetLeadsForExport[0] : null;
      const sampleInfo = getLeadDisplayNameInfo(firstLead);
      const effectiveTestName = testLeadName.trim() || sampleInfo.name;

      const res = await fetch("/api/admin/leads/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          testMobile: testMobileNumber.trim(),
          testName: effectiveTestName,
          patternCode: smsMethod === "pattern" ? smsPatternCode.trim() : undefined,
          patternValues: smsMethod === "pattern" ? patternValues : undefined,
          messageText: smsMethod === "text" ? smsDirectText.trim() : undefined
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "خطا در ارسال پیامک تستی به ملی‌پیامک");
      }

      toast.success(data.message || `پیامک تستی پترن با موفقیت به شماره ${testMobileNumber} ارسال شد.`);
    } catch (err: any) {
      toast.error(err.message || "خطا در ارسال پیامک تستی");
    } finally {
      setIsSendingTestSms(false);
    }
  };

  const handleSendDirectSms = async () => {
    const validMobiles = exportData.filter((item) => item.isMobile);
    if (validMobiles.length === 0) {
      toast.error("هیچ شماره موبایل معتبری در دامنه انتخابی برای ارسال پیامک وجود ندارد (شماره‌های ثابت حذف گردیدند).");
      return;
    }

    if (smsMethod === "pattern" && !smsPatternCode.trim()) {
      toast.error("لطفاً شناسه پترن خدماتی ملی‌پیامک را وارد فرمایید.");
      return;
    }

    if (smsMethod === "text" && !smsDirectText.trim()) {
      toast.error("لطفاً متن پیامک ارسالی را وارد نمایید.");
      return;
    }

    setIsSendingSms(true);
    setBulkSmsReport(null);
    try {
      const token = localStorage.getItem("token");
      const targetLeadIds = Array.from(new Set(validMobiles.map((m) => m.leadId)));
      const patternValues = [
        "{name}",
        ...(patternVar2.trim() ? [patternVar2.trim()] : []),
        ...(patternVar3.trim() ? [patternVar3.trim()] : [])
      ];

      const res = await fetch("/api/admin/leads/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          leadIds: targetLeadIds,
          patternCode: smsMethod === "pattern" ? smsPatternCode.trim() : undefined,
          patternValues: smsMethod === "pattern" ? patternValues : undefined,
          messageText: smsMethod === "text" ? smsDirectText.trim() : undefined,
          autoPublishAfterSend: autoPublishAfterSms
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "خطا در ارسال پیامک");
      }

      setBulkSmsReport({
        totalRecipients: data.totalRecipients || validMobiles.length,
        sentCount: data.sentCount ?? 0,
        failedCount: data.failedCount ?? 0,
        errors: data.errors || [],
        message: data.message || `ارسال پیامک انبوه ملی‌پیامک انجام شد: ${data.sentCount} پیامک تحویل داده شد.`
      });

      toast.success(data.message || `ارسال پیامک با موفقیت انجام شد: ${data.sentCount} پیامک تحویل داده شد.`);
      await fetchLeadsData();
    } catch (err: any) {
      toast.error(err.message || "خطا در ارسال مستقیم پیامک");
    } finally {
      setIsSendingSms(false);
    }
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
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 text-white flex items-center justify-center shadow-md shadow-purple-600/20 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
              تأمین‌یاب‌ها و مدیریت جذب تامین‌کنندگان هدف
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200 font-black">
                B2B
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              تعریف تامین‌کنندگان هدف، انتساب به تأمین‌یاب‌ها، ارسال مستقیم پیامک و پایش عملکرد
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Publish Button in Header */}
          {(stats.draftLeads ?? 0) > 0 && (
            <button
              type="button"
              onClick={handleBulkPublish}
              disabled={isBulkPublishing}
              className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-sm shadow-purple-600/20 disabled:opacity-50"
              title="انتشار پرونده‌های پیش‌نویس برای مشاهده و پیگیری تأمین‌یاب‌ها"
            >
              <Zap className="w-3.5 h-3.5 text-purple-200" />
              <span>
                {isBulkPublishing
                  ? "در حال انتشار..."
                  : selectedLeadIds.length > 0
                  ? `انتشار ${selectedLeadIds.length.toLocaleString("fa-IR")} مورد انتخابی`
                  : `انتشار پیش‌نویس‌ها (${(stats.draftLeads ?? 0).toLocaleString("fa-IR")})`}
              </span>
            </button>
          )}

          {/* Direct SMS & Excel Center */}
          <button
            type="button"
            onClick={() => {
              setActiveExportTab("direct_sms");
              setShowExportModal(true);
            }}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-sm shadow-purple-600/20 group"
            title="ارسال پیامک انبوه از طریق وب‌سرویس ملی‌پیامک بر اساس پترن تایید شده"
          >
            <Smartphone className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>ارسال پیامک انبوه ملی‌پیامک</span>
            <span className="bg-purple-800 text-purple-100 text-[10px] px-2 py-0.5 rounded-full font-black font-mono">
              {phoneStats.validMobiles.toLocaleString("fa-IR")}
            </span>
          </button>

          {/* Quick SMS for Selected Leads */}
          {selectedLeadIds.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setExportScope("SELECTED");
                setActiveExportTab("direct_sms");
                setShowExportModal(true);
              }}
              className="bg-purple-50 hover:bg-purple-100 text-purple-900 border-2 border-purple-300 px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs animate-fade-in"
              title="ارسال پیامک پترن به تامین‌کنندگان انتخاب شده"
            >
              <SendHorizontal className="w-3.5 h-3.5 text-purple-600" />
              <span>ارسال پترن به ({selectedLeadIds.length.toLocaleString("fa-IR")}) انتخابی</span>
            </button>
          )}

          {/* Budget & Payout Modal */}
          <button
            type="button"
            onClick={() => setShowBudgetModal(true)}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs"
            title="برآورد بودجه، پاداش‌های پرداخت‌شده و تعهدات مالی سیستم"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-600" />
            <span>برآورد بودجه و پاداش‌ها</span>
          </button>

          <button
            type="button"
            onClick={handleAutoMatch}
            className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
            title="تطبیق هوشمند شماره‌ها با تامین‌کنندگان ثبت‌نامی در سیستم"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>تطبیق شماره‌ها</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingLead(null);
              setFormData({
                name: "",
                managerName: "",
                phone: "",
                additionalPhones: "",
                websiteUrl: "",
                address: "",
                category: "لوازم جانبی و دیجیتال",
                commission: 150000,
                ambassadorId: "",
                isPublished: false,
                smsPatterns: []
              });
              setShowAdditionalPhones(false);
              setShowMoreFormFields(false);
              setShowAddModal(true);
            }}
            className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-600 text-white px-5 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-400/40 hover:ring-emerald-400 hover:scale-[1.02] transition-all cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>افزودن تامین‌کننده جدید</span>
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

      {/* VIEW TAB 1: LEADS LIST */}
      {activeViewTab === "leads" && (
        <div className="space-y-3">
          {/* Quick Status Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setPublishFilter("ALL");
                setStatusFilter("ALL");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                publishFilter === "ALL" && statusFilter === "ALL"
                  ? "bg-white text-purple-800 shadow-xs border border-purple-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              همه تامین‌کنندگان ({leads.length.toLocaleString("fa-IR")})
            </button>

            <button
              type="button"
              onClick={() => {
                setPublishFilter("DRAFT");
                setStatusFilter("ALL");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                publishFilter === "DRAFT"
                  ? "bg-purple-600 text-white shadow-xs"
                  : "text-purple-700 hover:bg-purple-100/50"
              }`}
            >
              <span>📝 پیش‌نویس (ویژه پیامک)</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${publishFilter === "DRAFT" ? "bg-purple-700 text-white" : "bg-purple-200 text-purple-900 font-black"}`}>
                {(stats.draftLeads ?? 0).toLocaleString("fa-IR")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPublishFilter("PUBLISHED");
                setStatusFilter("ALL");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                publishFilter === "PUBLISHED"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-indigo-700 hover:bg-indigo-100/50"
              }`}
            >
              <span>🌐 منتشرشده برای تأمین‌یاب</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${publishFilter === "PUBLISHED" ? "bg-indigo-700 text-white" : "bg-indigo-200 text-indigo-900 font-black"}`}>
                {(stats.publishedLeads ?? 0).toLocaleString("fa-IR")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPublishFilter("ALL");
                setStatusFilter("ASSIGNED");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "ASSIGNED"
                  ? "bg-amber-600 text-white shadow-xs"
                  : "text-amber-800 hover:bg-amber-100/50"
              }`}
            >
              <span>⏳ در حال پیگیری و مذاکره</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === "ASSIGNED" ? "bg-amber-700 text-white" : "bg-amber-200 text-amber-900 font-black"}`}>
                {stats.assignedLeads.toLocaleString("fa-IR")}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPublishFilter("ALL");
                setStatusFilter("COMPLETED");
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === "COMPLETED"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-emerald-800 hover:bg-emerald-100/50"
              }`}
            >
              <span>✅ جذب موفق و ثبت‌نام‌شده</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${statusFilter === "COMPLETED" ? "bg-emerald-700 text-white" : "bg-emerald-200 text-emerald-900 font-black"}`}>
                {stats.completedLeads.toLocaleString("fa-IR")}
              </span>
            </button>
          </div>

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
              <table className="w-full text-right text-xs min-w-[750px]">
                <thead className="bg-purple-50/60 border-b border-purple-100 text-slate-900 font-black">
                  <tr>
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                        checked={filteredLeads.length > 0 && selectedLeadIds.length === filteredLeads.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLeadIds(filteredLeads.map(l => l.id));
                          } else {
                            setSelectedLeadIds([]);
                          }
                        }}
                      />
                    </th>
                    <th className="p-4">نام تامین‌کننده / برند</th>
                    <th className="p-4">شماره تماس</th>
                    <th className="p-4">آدرس</th>
                    <th className="p-4">پاداش جذب</th>
                    <th className="p-4">وضعیت و تأمین‌یاب</th>
                    <th className="p-4 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-slate-500 font-bold">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-xs text-slate-700 font-bold">در حال بارگذاری اطلاعات تامین‌کنندگان...</span>
                        </div>
                      </td>
                    </tr>
                  ) : fetchError ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center">
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
                      <td colSpan={7} className="p-12 text-center text-slate-500 font-bold">
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
                          <td className="p-4">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                              checked={selectedLeadIds.includes(lead.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedLeadIds(prev => [...prev, lead.id]);
                                } else {
                                  setSelectedLeadIds(prev => prev.filter(id => id !== lead.id));
                                }
                              }}
                            />
                          </td>
                          {/* 1. Name & Manager */}
                          <td className="p-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-slate-900 text-sm">{lead.name}</span>
                              {lead.managerName && (
                                <span className="text-[11px] font-bold text-purple-900 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                  <span className="text-purple-600 font-normal">مدیر:</span>
                                  <span>{lead.managerName}</span>
                                </span>
                              )}
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
                              {(() => {
                                let patternCount = 0;
                                try {
                                  if (lead.smsPatterns) {
                                    const parsed = typeof lead.smsPatterns === "string" ? JSON.parse(lead.smsPatterns) : lead.smsPatterns;
                                    if (Array.isArray(parsed)) patternCount = parsed.length;
                                  }
                                } catch {}
                                if (patternCount > 0) {
                                  return (
                                    <span
                                      className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200"
                                      title={`${patternCount} الگوی پیامک ثبت شده`}
                                    >
                                      <MessageSquare className="w-2.5 h-2.5 shrink-0 text-indigo-600" />
                                      <span>{patternCount} پترن</span>
                                    </span>
                                  );
                                }
                                return null;
                              })()}
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

                          {/* 4. Commission (Reward) */}
                          <td className="p-4">
                            <span className="font-mono font-black text-purple-900 text-xs bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg inline-block">
                              {Number(lead.commission).toLocaleString("fa-IR")}{" "}
                              <span className="text-[10px] font-bold text-slate-600 font-sans">تومان</span>
                            </span>
                          </td>

                          {/* 5. Status & Ambassador */}
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
                                onClick={() => {
                                  setSelectedLeadIds([lead.id]);
                                  setExportScope("SELECTED");
                                  setActiveExportTab("direct_sms");
                                  // Pre-fill with lead's first pattern if available
                                  try {
                                    if (lead.smsPatterns) {
                                      const parsed = typeof lead.smsPatterns === "string" ? JSON.parse(lead.smsPatterns) : lead.smsPatterns;
                                      if (Array.isArray(parsed) && parsed.length > 0) {
                                        setSmsPatternCode(parsed[0].code || "");
                                        setPatternVar2(parsed[0].var2 || "");
                                        setPatternVar3(parsed[0].var3 || "");
                                      }
                                    }
                                  } catch {}
                                  setShowExportModal(true);
                                }}
                                className="p-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl transition-all cursor-pointer shadow-xs"
                                title="ارسال پیامک پترن به این تامین‌کننده"
                              >
                                <SendHorizontal className="w-4 h-4" />
                              </button>

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
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-mono">کد پرونده: #{viewingLeadDetails.id}</span>
                    {viewingLeadDetails.managerName && (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.2 rounded-md">
                        مدیر: {viewingLeadDetails.managerName}
                      </span>
                    )}
                  </div>
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

              {/* SMS Patterns configured for this supplier */}
              {(() => {
                let patterns: SupplierSmsPattern[] = [];
                try {
                  if (viewingLeadDetails.smsPatterns) {
                    const parsed = typeof viewingLeadDetails.smsPatterns === "string" ? JSON.parse(viewingLeadDetails.smsPatterns) : viewingLeadDetails.smsPatterns;
                    if (Array.isArray(parsed)) patterns = parsed;
                  }
                } catch {}

                return (
                  <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-950 font-black text-xs flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                        <span>الگوهای پیامک پترن ({patterns.length.toLocaleString("fa-IR")})</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const target = viewingLeadDetails;
                          setViewingLeadDetails(null);
                          setSelectedLeadIds([target.id]);
                          setExportScope("SELECTED");
                          setActiveExportTab("direct_sms");
                          if (patterns.length > 0) {
                            setSmsPatternCode(patterns[0].code || "");
                            setPatternVar2(patterns[0].var2 || "");
                            setPatternVar3(patterns[0].var3 || "");
                          }
                          setShowExportModal(true);
                        }}
                        className="text-[10px] font-black text-indigo-700 bg-white hover:bg-indigo-100 px-2 py-1 rounded-lg border border-indigo-200 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <SendHorizontal className="w-3 h-3 text-indigo-600" />
                        <span>ارسال پیامک</span>
                      </button>
                    </div>

                    {patterns.length === 0 ? (
                      <p className="text-[11px] text-slate-500">الگوی اختصاصی برای این تامین‌کننده تعریف نشده است.</p>
                    ) : (
                      <div className="space-y-1.5 pt-1 max-h-36 overflow-y-auto">
                        {patterns.map((p, idx) => (
                          <div key={idx} className="p-2 bg-white rounded-xl border border-indigo-100 flex items-center justify-between text-[11px]">
                            <div>
                              <span className="font-bold text-slate-900 block">{p.title || `الگو ${idx + 1}`}</span>
                              <span className="font-mono text-slate-500 text-[10px] dir-ltr">کد پترن: {p.code}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const target = viewingLeadDetails;
                                setViewingLeadDetails(null);
                                setSelectedLeadIds([target.id]);
                                setExportScope("SELECTED");
                                setActiveExportTab("direct_sms");
                                setSmsPatternCode(p.code || "");
                                setPatternVar2(p.var2 || "");
                                setPatternVar3(p.var3 || "");
                                setShowExportModal(true);
                              }}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black cursor-pointer transition-colors"
                            >
                              ارسال
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
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
              {/* 1. Name & Manager Name (Side by Side Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">
                    نام تامین‌کننده / برند <span className="text-purple-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: بازرگانی پارس"
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 placeholder:text-slate-400 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">
                    نام مدیر / مدیریت مجموعه
                  </label>
                  <input
                    type="text"
                    value={formData.managerName}
                    onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                    placeholder="مثال: جناب احمدی"
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 placeholder:text-slate-400 transition-all"
                  />
                </div>
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

              {/* 4. Reward / Commission & Website URL (Side by Side Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Right: Reward */}
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1">
                    پاداش ثبت‌نام (تومان) <span className="text-purple-600">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    step={10000}
                    value={formData.commission}
                    onChange={(e) => setFormData({ ...formData, commission: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-mono font-black text-purple-800 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 text-left transition-all"
                    dir="ltr"
                  />
                  {/* Reward Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1 mt-1.5">
                    {[30000, 60000, 90000, 100000, 150000, 200000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormData({ ...formData, commission: preset })}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                          formData.commission === preset
                            ? "bg-purple-600 text-white font-black border-purple-600 shadow-xs"
                            : "bg-slate-100 hover:bg-purple-50 text-slate-800 border-slate-200 hover:border-purple-200 font-bold"
                        }`}
                      >
                        {(preset / 1000).toLocaleString("fa-IR")}هزار
                      </button>
                    ))}
                  </div>
                </div>

                {/* Left (سمت چپش): Website / Page Domain */}
                <div>
                  <label className="block text-xs font-black text-slate-900 mb-1 flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-purple-600" />
                    <span>آدرس وب‌سایت / دامنه یا پیج</span>
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                    placeholder="example.com یا @page"
                    className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-500/10 text-left placeholder:text-slate-400 transition-all"
                  />
                </div>
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
                    <span>اطلاعات و تنظیمات بیشتر (دسته‌بندی، وب‌سایت، تخصیص، انتشار)</span>
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
                  {/* Category & Additional Phones */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-black text-slate-800 mb-1">
                        صنف و دسته‌بندی کالا
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        placeholder="مثال: پوشاک، دیجیتال، کیف و کفش"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black text-slate-800 mb-1">
                        شماره‌های تماس فرعی
                      </label>
                      <input
                        type="text"
                        dir="ltr"
                        value={formData.additionalPhones}
                        onChange={(e) => setFormData({ ...formData, additionalPhones: e.target.value })}
                        placeholder="مثال: 02188888888"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none focus:border-purple-600 text-left"
                      />
                    </div>
                  </div>

                  {/* Ambassador */}
                  <div>
                    <label className="block text-[11px] font-black text-slate-800 mb-1">
                      تخصیص به تأمین‌یاب (اختیاری)
                    </label>
                    <select
                      value={formData.ambassadorId}
                      onChange={(e) => setFormData({ ...formData, ambassadorId: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 outline-none focus:border-purple-600 cursor-pointer"
                    >
                      <option value="">-- آزاد (انتخاب توسط خود تأمین‌یاب‌ها) --</option>
                      {ambassadors.map((amb) => (
                        <option key={amb.id} value={amb.id}>
                          {amb.firstName || amb.username} ({amb.mobile || "تأمین‌یاب"})
                        </option>
                      ))}
                    </select>
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

              {/* Duplicate warning alert banner */}
              {duplicateMatches.length > 0 && (
                <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-black text-xs text-amber-900">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
                      <span>توجه: تامین‌کننده مشابه در سیستم یافت شد!</span>
                    </div>
                    <span className="text-[10px] text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full font-black">
                      {duplicateMatches.length} مورد
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5">
                    {duplicateMatches.map(({ lead, reasons }) => (
                      <div
                        key={lead.id}
                        className="p-2.5 bg-white border border-amber-200 rounded-xl text-xs flex flex-col gap-1 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-slate-900">{lead.name}</span>
                            {lead.managerName && (
                              <span className="text-[10px] font-bold text-purple-700">({lead.managerName})</span>
                            )}
                            <span className="text-[10px] font-mono text-slate-500">#{lead.id}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setViewingLeadDetails(lead)}
                            className="text-[10px] font-bold text-purple-700 hover:underline bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 shrink-0 cursor-pointer"
                          >
                            مشاهده ℹ️
                          </button>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-600 dir-ltr">
                          <span>📞 {lead.phone}</span>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {reasons.map((reason, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md"
                            >
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="text-[10px] text-amber-800 font-bold leading-relaxed pt-1 border-t border-amber-200/60">
                    💡 جهت اطلاع‌رسانی: ثبت تکراری مسدود نشده و در صورت نیاز می‌توانید دکمه ثبت را بزنید.
                  </p>
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

      {/* EXPORT & SMS COMMUNICATION CENTER MODAL */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-5 md:p-7 space-y-5" dir="rtl">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    مرکز ارسال پیامک و خروجی استاندارد ملی‌پیامک
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    ارسال آنی وب‌سرویس یا استخراج اکسل شماره‌های همراه ویژه ماژول ارسال فایل پنل ملی‌پیامک
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveExportTab("direct_sms")}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeExportTab === "direct_sms"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <SendHorizontal className="w-3.5 h-3.5" />
                <span>ارسال مستقیم وب‌سرویس ملی‌پیامک</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveExportTab("excel_export")}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeExportTab === "excel_export"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>دانلود اکسل استاندارد ملی‌پیامک</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveExportTab("telegram")}
                className={`py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeExportTab === "telegram"
                    ? "bg-sky-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>تلگرام</span>
              </button>
            </div>

            {/* Scope Selection (Common for all tabs) */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-900 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-purple-600" />
                  <span>انتخاب دامنه تامین‌کنندگان هدف:</span>
                </span>
                <span className="text-[11px] text-slate-500 font-bold">
                  {targetLeadsForExport.length.toLocaleString("fa-IR")} پرونده انتخاب شده
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { id: "DRAFTS", title: "پیش‌نویس‌ها (ویژه پیامک)", count: leads.filter((l) => !l.isPublished).length },
                  { id: "SELECTED", title: "موارد تیک‌خورده", count: selectedLeadIds.length },
                  { id: "ALL", title: "همه تامین‌کنندگان", count: leads.length },
                  { id: "CURRENT_FILTER", title: "فیلتر جاری جدول", count: filteredLeads.length },
                  { id: "PENDING", title: "آزاد (در انتظار)", count: leads.filter((l) => l.status === "PENDING").length },
                  { id: "ASSIGNED", title: "در حال مذاکره", count: leads.filter((l) => l.status === "ASSIGNED" || l.status === "IN_NEGOTIATION").length }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setExportScope(item.id as any)}
                    className={`p-2.5 rounded-xl border-2 text-right transition-all flex flex-col justify-between cursor-pointer ${
                      exportScope === item.id
                        ? "bg-purple-50 border-purple-600 text-purple-950 font-black shadow-2xs"
                        : "bg-white border-slate-200 text-slate-700 hover:border-purple-300 font-bold"
                    }`}
                  >
                    <span className="text-[11px] font-bold truncate">{item.title}</span>
                    <span className="text-xs font-black mt-1 text-slate-900 font-mono">
                      {item.count.toLocaleString("fa-IR")}{" "}
                      <span className="text-[9px] font-sans font-normal opacity-70">مورد</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* TAB 1: DIRECT SMS VIA MELIPAYAMAK */}
            {activeExportTab === "direct_sms" && (
              <div className="space-y-4 animate-fade-in">
                {/* Auto-Filtering Statistics Banner */}
                <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 border-2 border-purple-200 p-4 rounded-2xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-purple-600" />
                      <span>فیلتر خودکار و هوشمند شماره‌های تامین‌کنندگان جهت ارسال ملی‌پیامک:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowRecipientList(!showRecipientList)}
                      className="text-[11px] text-purple-700 hover:text-purple-950 font-bold flex items-center gap-1 self-end sm:self-auto cursor-pointer underline underline-offset-4"
                    >
                      {showRecipientList ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showRecipientList ? "مخفی کردن لیست شماره‌ها" : "مشاهده لیست شماره‌های فیلتر شده"}</span>
                    </button>
                  </div>

                  {/* Badges / Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                    <div className="bg-white/90 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-black text-emerald-950">همراه‌های معتبر (۰۹...)</p>
                          <p className="text-[10px] text-emerald-700">آماده دریافت پیامک انبوه</p>
                        </div>
                      </div>
                      <span className="text-sm font-black font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                        {phoneStats.validMobiles.toLocaleString("fa-IR")}
                      </span>
                    </div>

                    <div className="bg-white/90 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <p className="font-black text-amber-950">خطوط ثابت و نامعتبر</p>
                          <p className="text-[10px] text-amber-700">فیلتر خودکار (حفظ اعتبار پنل)</p>
                        </div>
                      </div>
                      <span className="text-sm font-black font-mono text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-lg border border-amber-200">
                        {phoneStats.landlines.toLocaleString("fa-IR")}
                      </span>
                    </div>

                    <div className="bg-white/90 border border-purple-200 p-2.5 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-purple-600 shrink-0" />
                        <div>
                          <p className="font-black text-purple-950">کل شماره‌های ثبت‌شده</p>
                          <p className="text-[10px] text-purple-700">اصلی و شماره‌های فرعی</p>
                        </div>
                      </div>
                      <span className="text-sm font-black font-mono text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-lg border border-purple-200">
                        {phoneStats.rawTotal.toLocaleString("fa-IR")}
                      </span>
                    </div>
                  </div>

                  {/* Filter Switches */}
                  <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] text-slate-700 border-t border-purple-100/70">
                    <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={exportIncludeAdditional}
                        onChange={(e) => setExportIncludeAdditional(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-purple-600 accent-purple-600"
                      />
                      <span>شامل کردن شماره‌های فرعی پرونده‌ها ({exportData.filter(i => i.isAdditional && i.isMobile).length} مورد)</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                      <input
                        type="checkbox"
                        checked={exportDeduplicate}
                        onChange={(e) => setExportDeduplicate(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-purple-600 accent-purple-600"
                      />
                      <span>حذف شماره‌های تکراری</span>
                    </label>
                  </div>
                </div>

                {/* Optional Recipient List Preview Drawer */}
                {showRecipientList && (
                  <div className="bg-white border-2 border-purple-200 rounded-2xl p-3 max-h-56 overflow-y-auto space-y-2 animate-fade-in shadow-xs">
                    <div className="flex items-center justify-between text-xs font-black text-slate-800 pb-1 border-b border-slate-100">
                      <span>پیش‌نمایش شماره‌های همراه فیلتر شده ({exportData.filter((i) => i.isMobile).length.toLocaleString("fa-IR")} مورد):</span>
                      <span className="text-[10px] text-emerald-700">تمامی شماره‌ها با فرمت استاندارد ۰۹... تایید شدند</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 text-xs">
                      {exportData
                        .filter((i) => i.isMobile)
                        .slice(0, 30)
                        .map((item, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-200 p-2 rounded-xl flex items-center justify-between">
                            <div className="truncate pr-1">
                              <p className="font-bold text-slate-900 truncate text-[11px]">{item.name}</p>
                              <p className="text-[10px] text-slate-500">{item.category}</p>
                            </div>
                            <span className="font-mono font-bold text-purple-900 text-[11px] shrink-0 bg-purple-100/70 px-1.5 py-0.5 rounded-md" dir="ltr">
                              {item.phone}
                            </span>
                          </div>
                        ))}
                    </div>
                    {exportData.filter((i) => i.isMobile).length > 30 && (
                      <p className="text-[10px] text-center text-slate-400 font-bold pt-1">
                        ... و {(exportData.filter((i) => i.isMobile).length - 30).toLocaleString("fa-IR")} شماره همراه دیگر
                      </p>
                    )}
                  </div>
                )}

                {/* Configuration Card */}
                <div className="bg-white border-2 border-slate-200 p-4 rounded-2xl space-y-4 shadow-xs">
                  {/* SMS Method Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <label
                      onClick={() => setSmsMethod("pattern")}
                      className={`p-3 rounded-xl border-2 cursor-pointer flex items-start gap-2.5 transition-all ${
                        smsMethod === "pattern"
                          ? "bg-purple-50/60 border-purple-600 text-purple-950 shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="smsMethod"
                        checked={smsMethod === "pattern"}
                        onChange={() => setSmsMethod("pattern")}
                        className="mt-0.5 text-purple-600 accent-purple-600"
                      />
                      <div>
                        <p className="font-black text-xs flex items-center gap-1.5">
                          <span>پترن تایید شده ملی‌پیامک (وب‌سرویس خدماتی)</span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full">پیشنهادی</span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          ارسال فوری، عبور تضمینی از بلک‌لیست مخابراتی، بدون نیاز به تایید ناظر
                        </p>
                      </div>
                    </label>

                    <label
                      onClick={() => setSmsMethod("text")}
                      className={`p-3 rounded-xl border-2 cursor-pointer flex items-start gap-2.5 transition-all ${
                        smsMethod === "text"
                          ? "bg-purple-50/60 border-purple-600 text-purple-950 shadow-xs"
                          : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="smsMethod"
                        checked={smsMethod === "text"}
                        onChange={() => setSmsMethod("text")}
                        className="mt-0.5 text-purple-600 accent-purple-600"
                      />
                      <div>
                        <p className="font-black text-xs">ارسال پیامک متنی آزاد (خط اختصاصی)</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          ارسال متن دلخواه بدون کد الگو به شماره‌هایی که دریافت پیامک تبلیغاتی دارند
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Pattern Code Input & Variables */}
                  {smsMethod === "pattern" ? (
                    <div className="space-y-4 pt-1 border-t border-slate-100">
                      {/* Multi-Pattern Selection Shelf */}
                      <div className="space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-purple-50/70 border border-purple-200 p-3 rounded-2xl">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-purple-600" />
                              <span className="text-xs font-black text-purple-950">
                                الگوهای پترن خدماتی ملی‌پیامک (انتخاب سریع یا افزودن پترن دلخواه):
                              </span>
                            </div>
                            <p className="text-[11px] text-purple-800 mt-0.5 leading-relaxed">
                              از میان الگوهای زیر انتخاب کنید یا الگوی جدید با کد و متن دلخواه تعریف نمایید.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleOpenNewPatternModal}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-xs shrink-0 self-start sm:self-center"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>تعریف الگوی جدید</span>
                          </button>
                        </div>

                        {/* Pattern Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                          {leadPatterns.map((pat) => {
                            const isSelected = selectedPatternId === pat.id || smsPatternCode === pat.code;
                            return (
                              <div
                                key={pat.id}
                                onClick={() => handleSelectPattern(pat)}
                                className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${
                                  isSelected
                                    ? "bg-purple-50/90 border-purple-600 shadow-md ring-2 ring-purple-600/20"
                                    : "bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50/70 shadow-2xs"
                                }`}
                              >
                                <div>
                                  <div className="flex items-center justify-between gap-1 mb-1.5">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                      <span
                                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                          isSelected ? "border-purple-600 bg-purple-600" : "border-slate-300 bg-white"
                                        }`}
                                      >
                                        {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                                      </span>
                                      <span className="text-xs font-black text-slate-900 truncate">
                                        {pat.title}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                                        isSelected ? "bg-purple-200 text-purple-950" : "bg-slate-100 text-slate-700"
                                      }`}
                                      dir="ltr"
                                    >
                                      کد: {pat.code}
                                    </span>
                                  </div>

                                  <div className="bg-white/80 border border-slate-100 p-2 rounded-xl text-[11px] text-slate-700 leading-relaxed font-sans whitespace-pre-line mb-2">
                                    {pat.template}
                                  </div>
                                </div>

                                <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between text-[10px]">
                                  <span className="text-purple-700 font-bold">
                                    متغیر {'{0}'}: {pat.var0Desc || "نام تامین‌کننده/مدیریت"}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenEditPatternModal(pat);
                                      }}
                                      className="p-1 text-slate-400 hover:text-purple-700 transition-colors rounded hover:bg-purple-100 cursor-pointer"
                                      title="ویرایش الگو"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    {leadPatterns.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeletePatternPreset(pat.id);
                                        }}
                                        className="p-1 text-slate-400 hover:text-red-600 transition-colors rounded hover:bg-red-100 cursor-pointer"
                                        title="حذف الگو"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Selected Pattern Code & Dynamic Variables */}
                      <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            <span>شناسه پترن فعال ملی‌پیامک (Pattern Code / BodyId):</span>
                            <span className="text-red-500 font-bold">*</span>
                          </label>
                          <span className="text-[11px] text-purple-700 font-bold">
                            الگوی انتخاب‌شده: {activeSelectedPattern?.title || "سفارشی"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div className="sm:col-span-1">
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">
                              کد پترن (Body ID):
                            </label>
                            <input
                              type="text"
                              dir="ltr"
                              value={smsPatternCode}
                              onChange={(e) => setSmsPatternCode(e.target.value)}
                              placeholder="مثلاً: 248910"
                              className="w-full px-3 py-2 bg-white border-2 border-purple-300 focus:border-purple-600 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none"
                            />
                          </div>

                          <div className="sm:col-span-1">
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">
                              متغیر ۰ یا ۱ (هوشمند):
                            </label>
                            <div className="w-full px-2.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 font-bold flex items-center justify-between">
                              <span>نام تامین‌کننده / مدیریت</span>
                              <Check className="w-3 h-3 text-emerald-600" />
                            </div>
                          </div>

                          <div className="sm:col-span-1">
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">
                              متغیر کمکی ۲ (اختیاری):
                            </label>
                            <input
                              type="text"
                              value={patternVar2}
                              onChange={(e) => setPatternVar2(e.target.value)}
                              placeholder="مثلاً: zopit.ir"
                              className="w-full px-2.5 py-2 bg-white border border-slate-300 focus:border-purple-600 rounded-xl text-xs text-slate-900 outline-none"
                            />
                          </div>

                          <div className="sm:col-span-1">
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">
                              متغیر کمکی ۳ (اختیاری):
                            </label>
                            <input
                              type="text"
                              value={patternVar3}
                              onChange={(e) => setPatternVar3(e.target.value)}
                              placeholder="مثلاً: کد یا شماره تماس"
                              className="w-full px-2.5 py-2 bg-white border border-slate-300 focus:border-purple-600 rounded-xl text-xs text-slate-900 outline-none"
                            />
                          </div>
                        </div>

                        {/* Live SMS Smartphone Bubble Preview */}
                        <div className="bg-white border-2 border-purple-200 p-3 rounded-xl space-y-2">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-100">
                            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                              <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                              <span>پیش‌نمایش زنده پیامک برای اولین مخاطب هدف:</span>
                            </span>
                            {(() => {
                              const sampleLead = targetLeadsForExport[0] || leads[0];
                              const info = getLeadDisplayNameInfo(sampleLead);
                              if (info.source === "shop") {
                                return (
                                  <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 self-start sm:self-auto">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>جایگذاری متغیر {'{0}'} از نام تامین‌کننده: «{info.name}»</span>
                                  </span>
                                );
                              } else if (info.source === "manager") {
                                return (
                                  <span className="text-[10px] bg-amber-100 text-amber-950 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 self-start sm:self-auto">
                                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                                    <span>جایگذاری متغیر {'{0}'} از نام مدیریت (نام فروشگاه خالی بود): «{info.name}»</span>
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full self-start sm:self-auto">
                                    جایگذاری متغیر {'{0}'} با عنوان پیش‌فرض «{info.name}»
                                  </span>
                                );
                              }
                            })()}
                          </div>

                          <div className="bg-purple-50/50 border border-purple-100 p-3 rounded-xl text-xs text-slate-900 font-sans leading-relaxed whitespace-pre-line shadow-inner">
                            {renderedPreviewText}
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                            <span>شماره مخاطب تستی نمونه: {targetLeadsForExport[0]?.phone || "09xxxxxxxxx"}</span>
                            <span>طول متن پیامک استاندارد و تایید شده وب‌سرویس ملی‌پیامک</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <label className="text-xs font-black text-slate-800">متن پیامک ارسالی:</label>
                      <textarea
                        rows={3}
                        value={smsDirectText}
                        onChange={(e) => setSmsDirectText(e.target.value)}
                        placeholder="متن پیامک را وارد کنید..."
                        className="w-full px-3.5 py-2 bg-white border-2 border-purple-200 focus:border-purple-600 rounded-xl text-xs text-slate-900 outline-none leading-relaxed"
                      />
                      <p className="text-[11px] text-slate-500">
                        می‌توانید از عبارت <code className="bg-slate-100 px-1 rounded text-purple-700 font-mono">{"{name}"}</code> یا <code className="bg-slate-100 px-1 rounded text-purple-700 font-mono">{"{0}"}</code> جهت درج نام تامین‌کننده در متن استفاده نمایید.
                      </p>
                    </div>
                  )}

                  {/* Single Test SMS Section */}
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-2.5">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-purple-600" />
                      <span>ارسال یک پیامک تستی به شماره دلخواه (قبل از ارسال انبوه):</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        dir="ltr"
                        value={testMobileNumber}
                        onChange={(e) => setTestMobileNumber(e.target.value)}
                        placeholder="شماره موبایل تست (مثلاً: 09121234567)"
                        className="px-3 py-2 bg-white border border-slate-300 focus:border-purple-600 rounded-xl text-xs font-mono text-slate-900 outline-none"
                      />
                      <input
                        type="text"
                        value={testLeadName}
                        onChange={(e) => setTestLeadName(e.target.value)}
                        placeholder="نام متغیر {0} تستی (اختیاری)"
                        className="px-3 py-2 bg-white border border-slate-300 focus:border-purple-600 rounded-xl text-xs text-slate-900 outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSendTestSms}
                        disabled={isSendingTestSms || !testMobileNumber.trim()}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs"
                      >
                        {isSendingTestSms ? (
                          <span>در حال ارسال تست...</span>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>ارسال پیامک تستی به این شماره</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      با این تست سریع، از تایید بودن پترن انتخاب شده و جایگذاری صحیح نام مخاطب در وب‌سرویس ملی‌پیامک اطمینان حاصل کنید.
                    </p>
                  </div>

                  {/* Auto-Publish Toggle */}
                  <label className="flex items-center gap-2.5 p-3 bg-purple-50/40 rounded-xl border border-purple-200 cursor-pointer text-xs shadow-2xs">
                    <input
                      type="checkbox"
                      checked={autoPublishAfterSms}
                      onChange={(e) => setAutoPublishAfterSms(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 accent-purple-600 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="font-black text-slate-900">
                        انتشار خودکار پرونده‌ها برای تأمین‌یاب‌ها پس از ارسال پیامک
                      </span>
                      <span className="text-[10px] text-slate-500">
                        پرونده‌ها از حالت پیش‌نویس خارج شده و در کارتابل تأمین‌یاب‌ها جهت پیگیری تلفنی نمایان می‌شوند.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Bulk SMS Result Report Card */}
                {bulkSmsReport && (
                  <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-2xl space-y-2 animate-fade-in text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-emerald-950 flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>گزارش نتیجه ارسال پیامک انبوه ملی‌پیامک:</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setBulkSmsReport(null)}
                        className="text-emerald-700 hover:text-emerald-950 font-bold"
                      >
                        بستن گزارش
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-bold pt-1">
                      <span className="text-emerald-800">
                        موفق: <strong className="font-mono text-sm">{bulkSmsReport.sentCount.toLocaleString("fa-IR")}</strong> پیامک
                      </span>
                      {bulkSmsReport.failedCount > 0 && (
                        <span className="text-red-700">
                          ناموفق: <strong className="font-mono text-sm">{bulkSmsReport.failedCount.toLocaleString("fa-IR")}</strong>
                        </span>
                      )}
                      <span className="text-slate-600">
                        کل گیرندگان: <strong className="font-mono text-sm">{bulkSmsReport.totalRecipients.toLocaleString("fa-IR")}</strong>
                      </span>
                    </div>
                    {bulkSmsReport.errors && bulkSmsReport.errors.length > 0 && (
                      <div className="text-[10px] text-red-700 bg-white/80 p-2 rounded-lg border border-red-200 mt-2 space-y-0.5">
                        <p className="font-bold">برخی خطاهای ثبت‌شده:</p>
                        {bulkSmsReport.errors.slice(0, 3).map((err, idx) => (
                          <p key={idx} className="font-mono">{err}</p>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Send Button */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                  <div className="text-xs text-slate-600 font-medium">
                    <span>تعداد دریافت‌کنندگان تایید شده: </span>
                    <strong className="text-purple-700 font-bold font-mono text-sm">
                      {exportData.filter((i) => i.isMobile).length.toLocaleString("fa-IR")} شماره همراه
                    </strong>
                    <span className="text-[10px] text-slate-400 mr-1.5">(خطوط ثابت ۰۲۱ و نامعتبر مستثنی گردیدند)</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleSendDirectSms}
                    disabled={isSendingSms || exportData.filter((i) => i.isMobile).length === 0}
                    className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-7 py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <SendHorizontal className="w-4 h-4" />
                    <span>
                      {isSendingSms
                        ? "در حال ارسال پیامک‌های پترن..."
                        : `ارسال پیامک انبوه به ${exportData.filter((i) => i.isMobile).length.toLocaleString("fa-IR")} شماره همراه`}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: EXCEL EXPORT (Single Column MeliPayamak format) */}
            {activeExportTab === "excel_export" && (
              <div className="space-y-4 animate-fade-in">
                {/* Advanced Filters */}
                <div className="bg-purple-50/40 border-2 border-purple-100 p-3.5 rounded-2xl">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <label className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer shadow-2xs">
                      <input
                        type="checkbox"
                        checked={exportOnlyMobiles}
                        onChange={(e) => setExportOnlyMobiles(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 accent-purple-600"
                      />
                      <span className="font-bold text-slate-800 text-[11px]">فقط خطوط همراه ۰۹ (حذف تلفن‌های ثابت)</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer shadow-2xs">
                      <input
                        type="checkbox"
                        checked={exportIncludeAdditional}
                        onChange={(e) => setExportIncludeAdditional(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 accent-purple-600"
                      />
                      <span className="font-bold text-slate-800 text-[11px]">شامل شماره‌های همراه فرعی</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200 cursor-pointer shadow-2xs">
                      <input
                        type="checkbox"
                        checked={exportDeduplicate}
                        onChange={(e) => setExportDeduplicate(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 accent-purple-600"
                      />
                      <span className="font-bold text-slate-800 text-[11px]">حذف شماره‌های همراه تکراری</span>
                    </label>
                  </div>
                </div>

                {/* Primary Download Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Button 1: Single Column MeliPayamak format */}
                  <button
                    type="button"
                    onClick={handleDownloadMeliPayamakExcel}
                    disabled={exportData.filter((i) => i.isMobile).length === 0}
                    className="p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-right transition-all flex flex-col justify-between shadow-md shadow-purple-600/20 cursor-pointer disabled:opacity-50 group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black">اکسل تک‌ستونه ملی‌پیامک</span>
                        <Download className="w-4 h-4 text-white" />
                      </div>
                      <p className="text-[11px] font-medium opacity-90 mt-1.5 leading-relaxed">
                        دقیقاً مطابق استاندارد ماژول «ارسال پیامک از فایل اکسل»: شماره‌های انگلیسی زیر هم در یک ستون، بدون نام و بدون ستون اضافه
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] bg-white/20 px-2 py-0.5 rounded-md self-start font-mono font-bold">
                      {exportData.filter((i) => i.isMobile).length.toLocaleString("fa-IR")} شماره همراه زیر هم
                    </span>
                  </button>

                  {/* Button 2: Two Column Phonebook */}
                  <button
                    type="button"
                    onClick={handleDownloadMeliPayamakPhonebook}
                    disabled={exportData.filter((i) => i.isMobile).length === 0}
                    className="p-4 bg-white hover:bg-purple-50 border-2 border-purple-200 hover:border-purple-600 text-slate-900 rounded-2xl text-right transition-all flex flex-col justify-between shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-purple-900">اکسل دفترچه تلفن ملی‌پیامک</span>
                        <Users className="w-4 h-4 text-purple-600" />
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-1.5 leading-relaxed">
                        دو ستونه (شماره همراه + نام تامین‌کننده) ویژه ورود مخاطبین جدید در دفترچه تلفن سامانه پیامک
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md self-start font-mono font-bold">
                      ۲ ستونه: شماره + نام
                    </span>
                  </button>

                  {/* Button 3: Full CRM Excel */}
                  <button
                    type="button"
                    onClick={handleDownloadFullExcel}
                    disabled={exportData.length === 0}
                    className="p-4 bg-white hover:bg-purple-50 border-2 border-slate-200 hover:border-purple-600 text-slate-900 rounded-2xl text-right transition-all flex flex-col justify-between shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">اکسل جامع پرونده‌ها (CRM)</span>
                        <FileSpreadsheet className="w-4 h-4 text-slate-700" />
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium mt-1.5 leading-relaxed">
                        فول دیتا شامل نام برند، صنف، تلفن ثابت و همراه، پاداش جذب، وضعیت مذاکره و سفیر مسئول
                      </p>
                    </div>
                    <span className="mt-3 text-[10px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md self-start font-mono font-bold">
                      کلیه مشخصات
                    </span>
                  </button>
                </div>

                {/* Quick Copy and CSV Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    disabled={exportData.length === 0}
                    className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5 text-purple-600" />
                    <span>دانلود CSV شماره‌ها</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyPhones("comma")}
                    disabled={exportData.length === 0}
                    className={`p-2.5 border rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
                      copiedType === "comma"
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white hover:bg-purple-50 border-slate-200 text-slate-900"
                    }`}
                  >
                    {copiedType === "comma" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-purple-600" />}
                    <span>{copiedType === "comma" ? "کپی شد (با کاما)" : "کپی شماره‌ها (با کاما)"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyPhones("newline")}
                    disabled={exportData.length === 0}
                    className={`p-2.5 border rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 ${
                      copiedType === "newline"
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-white hover:bg-purple-50 border-slate-200 text-slate-900"
                    }`}
                  >
                    {copiedType === "newline" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-purple-600" />}
                    <span>{copiedType === "newline" ? "کپی شد (خط به خط)" : "کپی شماره‌ها (خط جدید)"}</span>
                  </button>
                </div>

                {/* Live Preview of Single Column MeliPayamak */}
                {exportData.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs font-black text-slate-900 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>پیش‌نمایش ستون اکسل ملی‌پیامک (شماره‌های همراه انگلیسی زیر هم):</span>
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        نمایش ۵ از {exportData.filter((i) => i.isMobile).length.toLocaleString("fa-IR")} شماره همراه
                      </span>
                    </p>

                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-purple-50/70 border-b border-purple-100 text-slate-900 font-black">
                          <tr>
                            <th className="p-2.5 w-16">ردیف</th>
                            <th className="p-2.5">ستون A: شماره تلفن (فقط شماره همراه انگلیسی)</th>
                            <th className="p-2.5">نام تامین‌کننده در سیستم</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {exportData
                            .filter((i) => i.isMobile)
                            .slice(0, 5)
                            .map((row, idx) => (
                              <tr key={idx} className="hover:bg-purple-50/20">
                                <td className="p-2.5 text-slate-400 text-center">{idx + 1}</td>
                                <td className="p-2.5 font-black text-purple-800 dir-ltr text-right">{row.phone}</td>
                                <td className="p-2.5 font-sans font-bold text-slate-700">{row.name}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: TELEGRAM INTEGRATION */}
            {activeExportTab === "telegram" && (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-sky-50/60 border-2 border-sky-200 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2.5 font-black text-xs text-sky-900">
                    <Share2 className="w-4 h-4 text-sky-600" />
                    <span>اشتراک‌گذاری دعوت‌نامه و اطلاع‌رسانی در تلگرام (Telegram)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    می‌توانید پیام دعوت تامین‌کنندگان را به طور مستقیم در کانال‌ها، گروه‌های صنفی یا چت خصوصی تلگرام تامین‌کنندگان به اشتراک بگذارید.
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <a
                      href={`https://t.me/share/url?url=${encodeURIComponent(window.location.origin + "/supplier-onboarding")}&text=${encodeURIComponent(
                        "سلام و احترام، از شما به عنوان تامین‌کننده برتر جهت ثبت‌نام و عرضه کالاهای خود در پلتفرم دعوت به عمل می‌آید."
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-xs transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>اشتراک‌گذاری در تلگرام</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => {
                        const inviteText = `سلام و احترام، از شما به عنوان تامین‌کننده برتر جهت حضور در پلتفرم دعوت به عمل می‌آید.\nلینک ثبت‌نام: ${window.location.origin}/supplier-onboarding`;
                        navigator.clipboard.writeText(inviteText);
                        toast.success("متن دعوت تلگرام با موفقیت کپی شد.");
                      }}
                      className="bg-white hover:bg-sky-50 text-sky-700 border border-sky-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>کپی متن پیام تلگرام</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

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

      {/* BUDGET & COMMISSIONS ESTIMATION MODAL */}
      {showBudgetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-5 md:p-7 space-y-5" dir="rtl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    برآورد جامع بودجه و پاداش‌های جذب تامین‌کنندگان
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    تحلیل هزینه‌ها، تعهدات جاری و صرفه‌جویی بالقوه ناشی از ارسال مستقیم پیامک
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBudgetModal(false)}
                className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <p className="text-xs font-bold text-slate-500">کل بودجه مورد نیاز (کلیه پرونده‌ها)</p>
                <p className="text-xl font-black text-slate-900 mt-1 font-mono">
                  {stats.totalCommissions.toLocaleString("fa-IR")}{" "}
                  <span className="text-xs font-sans font-bold text-slate-500">تومان</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  مجموع پاداش تخصیص‌یافته به {stats.totalLeads.toLocaleString("fa-IR")} تامین‌کننده هدف
                </p>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <p className="text-xs font-bold text-emerald-800">پاداش‌های پرداخت‌شده (جذب موفق)</p>
                <p className="text-xl font-black text-emerald-900 mt-1 font-mono">
                  {stats.paidCommissions.toLocaleString("fa-IR")}{" "}
                  <span className="text-xs font-sans font-bold text-emerald-700">تومان</span>
                </p>
                <p className="text-[10px] text-emerald-700 mt-1">
                  تسویه‌شده بابت {stats.completedLeads.toLocaleString("fa-IR")} تامین‌کننده جذب‌شده
                </p>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <p className="text-xs font-bold text-amber-800">تعهدات مالی جاری (در حال مذاکره)</p>
                <p className="text-xl font-black text-amber-900 mt-1 font-mono">
                  {(stats.inProgressCommissions ?? (stats.assignedLeads * 150000)).toLocaleString("fa-IR")}{" "}
                  <span className="text-xs font-sans font-bold text-amber-700">تومان</span>
                </p>
                <p className="text-[10px] text-amber-700 mt-1">
                  تعهد پرداخت مشروط به ثبت‌نام نهایی {stats.assignedLeads.toLocaleString("fa-IR")} تامین‌کننده فعال
                </p>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl">
                <p className="text-xs font-bold text-purple-900">پتانسیل صرفه‌جویی پورسانت با پیامک مستقیم</p>
                <p className="text-xl font-black text-purple-900 mt-1 font-mono">
                  {(stats.potentialSavingsCommissions ?? ((stats.draftLeads ?? 0) * 150000)).toLocaleString("fa-IR")}{" "}
                  <span className="text-xs font-sans font-bold text-purple-700">تومان</span>
                </p>
                <p className="text-[10px] text-purple-700 mt-1">
                  در صورت ثبت‌نام خودکار تامین‌کنندگان پیش‌نویس قبل از ارجاع به تأمین‌یاب
                </p>
              </div>
            </div>

            {/* Average Commission Stat */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-600">میانگین پاداش به ازای هر تامین‌کننده هدف:</p>
                <p className="text-base font-black text-slate-900 mt-0.5 font-mono">
                  {stats.totalLeads > 0
                    ? Math.round(stats.totalCommissions / stats.totalLeads).toLocaleString("fa-IR")
                    : "۱۵۰,۰۰۰"}{" "}
                  <span className="text-xs font-sans font-normal text-slate-500">تومان</span>
                </p>
              </div>
              <div className="text-left font-mono">
                <span className="text-xs font-bold text-slate-600">تعداد کل سفیران: </span>
                <span className="text-sm font-black text-purple-700">{ambassadors.length.toLocaleString("fa-IR")} نفر</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowBudgetModal(false)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pattern Editor / Add Modal */}
      {showPatternEditorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-100 text-purple-700 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {editingPattern ? "ویرایش الگوی پترن ملی‌پیامک" : "تعریف الگوی پترن جدید ملی‌پیامک"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    تنظیم شناسه پترن تایید شده و ساختار متغیرهای وب‌سرویس خدماتی
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPatternEditorModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePatternPreset} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-800">عنوان یا برچسب الگو:</label>
                <input
                  type="text"
                  required
                  value={patternForm.title}
                  onChange={(e) => setPatternForm({ ...patternForm, title: e.target.value })}
                  placeholder="مثلاً: الگوی دعوت تامین‌کننده (فروش رایگان)"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border-2 border-slate-200 focus:border-purple-600 rounded-xl text-xs text-slate-900 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">
                  شناسه پترن در پنل ملی‌پیامک (Body ID):
                </label>
                <input
                  type="text"
                  dir="ltr"
                  required
                  value={patternForm.code}
                  onChange={(e) => setPatternForm({ ...patternForm, code: e.target.value })}
                  placeholder="مثلاً: 248910"
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border-2 border-slate-200 focus:border-purple-600 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none"
                />
                <p className="text-[10px] text-slate-500">
                  این کد عددی چند رقمی را از منوی «ارسال بر اساس پترن» در پنل ملی‌پیامک کپی کنید.
                </p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800">
                  متن تایید شده در پنل ملی‌پیامک (با علامت متغیرها):
                </label>
                <textarea
                  rows={4}
                  value={patternForm.template}
                  onChange={(e) => setPatternForm({ ...patternForm, template: e.target.value })}
                  placeholder={`مدیریت محترم {0}؛\nفروش کالایتان را رایگان چندبرابر کنید!\nاتصال به دهها فروشگاه آنلاین.\nثبت‌نام: zopit.ir/register/supplier`}
                  className="w-full px-3 py-2 bg-slate-50 focus:bg-white border-2 border-slate-200 focus:border-purple-600 rounded-xl text-xs text-slate-900 outline-none leading-relaxed font-sans"
                />
                <div className="p-2.5 bg-purple-50/70 border border-purple-100 rounded-xl space-y-1 text-[11px] text-purple-900 leading-relaxed">
                  <div className="flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                    <span>عملکرد هوشمند متغیر {'{0}'}:</span>
                  </div>
                  <p>
                    سامانه به صورت هوشمند متغیر <strong>{'{0}'}</strong> را با نام تامین‌کننده پر می‌کند؛ و اگر تامین‌کننده‌ای نام فروشگاه نداشته باشد، به صورت خودکار <strong>نام مدیریت</strong> جایگزین خواهد شد.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">متغیر کمکی ۲ (اختیاری):</label>
                  <input
                    type="text"
                    value={patternForm.var2}
                    onChange={(e) => setPatternForm({ ...patternForm, var2: e.target.value })}
                    placeholder="مثلاً: zopit.ir"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-purple-600 rounded-xl text-xs text-slate-900 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">متغیر کمکی ۳ (اختیاری):</label>
                  <input
                    type="text"
                    value={patternForm.var3}
                    onChange={(e) => setPatternForm({ ...patternForm, var3: e.target.value })}
                    placeholder="مثلاً: شماره تماس یا کد دعوت"
                    className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-purple-600 rounded-xl text-xs text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPatternEditorModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-xl font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>ذخیره الگوی پترن</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
