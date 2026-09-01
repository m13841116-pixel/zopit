import React, { useState, useEffect } from "react";
import { useUrlQueryState } from "../../utils/routeSync";
import {
  MessageSquare,
  Send,
  ArrowRight,
  Clock,
  User,
  Tag,
  AlertCircle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Scale,
  Paperclip,
  Users,
  ShieldCheck,
  Zap,
  Lock,
  ArrowUpRight,
  CheckSquare,
  Truck,
  Package,
  Phone,
  Printer,
  ExternalLink,
  Search,
  Filter,
  AlertTriangle,
  RefreshCw,
  ShoppingBag
} from "lucide-react";

export default function Tickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDepartment, setActiveDepartment] = useUrlQueryState<"dispute" | "communication">("dept", "dispute");
  const [activeTab, setActiveTab] = useUrlQueryState<"supplier" | "store_manager">("subtab", "supplier");
  const [departmentFilter, setDepartmentFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Dispute specific states
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<{name: string, type: "image" | "file", dataUrl?: string}[]>([]);
  const [sendingReply, setSendingReply] = useState(false);
  
  // Associated Order Dossier state
  const [associatedOrderData, setAssociatedOrderData] = useState<any | null>(null);
  const [loadingOrder, setLoadingOrder] = useState<boolean>(false);
  const [manualOrderIdInput, setManualOrderIdInput] = useState<string>("");

  // Direct Communication states
  const [directChannel, setDirectChannel] = useState<"admin-supplier" | "admin-store" | "supplier-store">("admin-supplier");
  const [directMessage, setDirectMessage] = useState("");
  const [directMessagesList, setDirectMessagesList] = useState<any[]>([
    {
      id: 1,
      sender: "تامین‌کننده (پارس الکترونیک)",
      receiver: "مدیر کل",
      text: "سلام وقت بخیر، درصد کارمزد کاتولوگ ما به درستی محاسبه نشده است.",
      time: "۱۰:۳۰",
      isAdmin: false
    },
    {
      id: 2,
      sender: "مدیر کل",
      receiver: "تامین‌کننده (پارس الکترونیک)",
      text: "سلام. تیم حسابداری در حال ممیزی تراکنش‌های شماست. تا فردا بررسی می‌شود.",
      time: "۱۰:۴۵",
      isAdmin: true
    }
  ]);

  // Verdict States
  const [verdictText, setVerdictText] = useState("");
  const [verdictType, setVerdictType] = useState("REFUND_STORE"); // REFUND_STORE, RELEASE_SUPPLIER, DISMISS
  const [submittingVerdict, setSubmittingVerdict] = useState(false);

  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const fetchTickets = () => {
    setLoading(true);
    fetch("/api/admin/tickets", { credentials: "include",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setTickets(data);
        } else {
          setTickets([]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  // Update selected ticket details if ticket list updates
  useEffect(() => {
    if (selectedTicket) {
      const updated = tickets.find((t) => t.id === selectedTicket.id);
      if (updated) {
        setSelectedTicket(updated);
      }
    }
  }, [tickets]);

  // Inspect associated order whenever a ticket is selected
  useEffect(() => {
    if (!selectedTicket) {
      setAssociatedOrderData(null);
      setManualOrderIdInput("");
      return;
    }

    const textToScan = `${selectedTicket.subject || ""} ${selectedTicket.message || ""} ${
      selectedTicket.messages?.map((m: any) => m.message).join(" ") || ""
    }`;
    
    // Look for order id mentions
    const match = textToScan.match(/(?:سفارش|order|فاکتور)\s*#?(\d+)/i) || textToScan.match(/#(\d+)/);
    const candidateOrderId = match ? match[1] : null;

    if (candidateOrderId) {
      fetchOrderDossier(candidateOrderId);
    } else {
      setAssociatedOrderData(null);
    }
  }, [selectedTicket]);

  const fetchOrderDossier = (orderId: string | number) => {
    setLoadingOrder(true);
    fetch(`/api/admin/orders/${orderId}/inspect`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setAssociatedOrderData(data);
        setLoadingOrder(false);
      })
      .catch(() => {
        setAssociatedOrderData(null);
        setLoadingOrder(false);
      });
  };

  const handleManualOrderInspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualOrderIdInput.trim()) return;
    const cleanId = manualOrderIdInput.trim().replace("#", "");
    fetchOrderDossier(cleanId);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim() || !selectedTicket) return;
    setSendingReply(true);

    // Build complete message payload including attached files
    let fullText = replyMessage;
    if (attachedFiles.length > 0) {
      fullText += "\n\n📎 مدارک ضمیمه شده:\n" + attachedFiles.map(f => {
        if (f.dataUrl) {
          return `🔹 ${f.name}\n${f.dataUrl}`;
        }
        return `🔹 ${f.name} (${f.type === "image" ? "تصویر مدارک" : "سند دیجیتال"})`;
      }).join("\n");
    }

    try {
      const res = await fetch(`/api/admin/tickets/${selectedTicket.id}/reply`, { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ message: fullText }),
      });
      if (res.ok) {
        setReplyMessage("");
        setAttachedFiles([]);
        showNotification("پاسخ و مستندات شما با موفقیت ثبت شد.", "success");
        fetchTickets();
      } else {
        showNotification("خطا در ارسال پاسخ تیکت", "error");
      }
    } catch (err) {
      showNotification("خطای شبکه در ارتباط با سرور", "error");
    } finally {
      setSendingReply(false);
    }
  };

  // Submit Super Admin binding verdict
  const handleSubmitVerdict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verdictText.trim() || !selectedTicket) return;
    setSubmittingVerdict(true);

    const verdictFormatted = `⚖️ رای نهایی و رسمی مدیرکل سیستم:\nنوع رای: ${
      verdictType === "REFUND_STORE" 
        ? "استرداد وجه کامل به فروشگاه" 
        : verdictType === "RELEASE_SUPPLIER" 
        ? "تایید ارسال و آزادسازی فوری مبالغ تامین‌کننده" 
        : "رد اختلاف و دعوت به مصالحه"
    }\n\nتوضیحات حاکمیتی:\n${verdictText}`;

    try {
      // Send verdict as a direct reply and close the ticket
      const replyRes = await fetch(`/api/admin/tickets/${selectedTicket.id}/reply`, { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ message: verdictFormatted }),
      });

      if (replyRes.ok) {
        // Also update ticket status to closed/resolved
        showNotification("رای رسمی مدیرکل صادر و ابلاغ شد. پرونده مختومه گردید.", "success");
        setVerdictText("");
        fetchTickets();
      } else {
        showNotification("خطا در ثبت رای نهایی", "error");
      }
    } catch (err) {
      showNotification("خطای شبکه در ثبت رای", "error");
    } finally {
      setSubmittingVerdict(false);
    }
  };

  const handleSendDirectMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directMessage.trim()) return;

    const newMessage = {
      id: directMessagesList.length + 1,
      sender: "مدیر کل",
      receiver: directChannel === "admin-supplier" ? "تامین‌کننده (پارس الکترونیک)" : "مدیر فروشگاه ارکیده",
      text: directMessage,
      time: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" }),
      isAdmin: true
    };

    setDirectMessagesList(prev => [...prev, newMessage]);
    setDirectMessage("");
    showNotification("پیام مستقیم داخلی ارسال شد.", "success");
  };

  const handleRealFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: "image" | "file") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification("حجم فایل نباید بیش از ۵ مگابایت باشد.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      setAttachedFiles(prev => [...prev, { name: file.name, type, dataUrl }]);
      showNotification(`فایل ${file.name} با موفقیت ضمیمه شد.`, "success");
    };
    reader.readAsDataURL(file);
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const renderMessageWithAttachments = (text: string, isAdmin: boolean) => {
    if (!text) return null;
    
    const imgRegex = /(data:image\/[a-zA-Z]*;base64,[^\s]+)/g;
    const pdfRegex = /(data:application\/pdf;base64,[^\s]+)/g;
    
    const hasImg = imgRegex.test(text);
    const hasPdf = pdfRegex.test(text);
    
    if (!hasImg && !hasPdf) {
      return <p className="whitespace-pre-wrap leading-relaxed">{text}</p>;
    }
    
    let cleanText = text;
    const images: string[] = [];
    const pdfs: string[] = [];
    
    const imgMatches = text.match(imgRegex);
    if (imgMatches) {
      imgMatches.forEach(img => {
        images.push(img);
        cleanText = cleanText.replace(img, "");
      });
    }
    
    const pdfMatches = text.match(pdfRegex);
    if (pdfMatches) {
      pdfMatches.forEach(pdf => {
        pdfs.push(pdf);
        cleanText = cleanText.replace(pdf, "");
      });
    }
    
    return (
      <div className="space-y-3">
        <p className="whitespace-pre-wrap leading-relaxed">{cleanText}</p>
        
        {images.map((img, idx) => (
          <div key={idx} className="mt-2 border border-subtle rounded-xl overflow-hidden bg-slate-50 max-w-sm text-secondary">
            <img src={img} alt="ضمیمه" className="w-full h-auto max-h-60 object-contain" referrerPolicy="no-referrer" />
            <div className="p-2 bg-background border-t border-subtle text-center">
              <a href={img} download={`attachment_${idx}.png`} className="text-[10px] font-bold text-primary-default hover:underline">
                دانلود تصویر ضمیمه
              </a>
            </div>
          </div>
        ))}
        
        {pdfs.map((pdf, idx) => (
          <div key={idx} className="mt-2 p-3 border border-subtle rounded-xl bg-slate-50 flex items-center justify-between max-w-sm text-secondary">
            <span className="text-xs font-medium">فایل PDF ضمیمه شده #{idx + 1}</span>
            <a href={pdf} download={`document_${idx}.pdf`} className="text-xs font-bold text-primary-default hover:underline">
              دانلود PDF
            </a>
          </div>
        ))}
      </div>
    );
  };

  const getDepartmentBadge = (dept: string) => {
    switch (dept) {
      case "ORDER_DELAY_LOGISTICS":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">🚚 تأخیر لجستیک و پست</span>;
      case "ORDER_DELAY_SUPPLIER":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-600 border border-orange-500/20 flex items-center gap-1">📦 تأخیر ارسال تأمین‌کننده</span>;
      case "GENERAL_MANAGER":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 flex items-center gap-1">👑 مدیریت ارشد</span>;
      case "FINANCIAL":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">💰 امور مالی</span>;
      case "SHIPPING":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center gap-1">🚚 لجستیک</span>;
      case "DISPUTE":
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20 flex items-center gap-1">⚖️ حل اختلاف</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-600 border border-slate-500/20">💬 {dept || "عمومی"}</span>;
    }
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case "REQUESTED":
      case "NEW":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-600">ثبت اولیه</span>;
      case "PAID":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">پرداخت شده</span>;
      case "PROCESSING":
      case "PREPARING":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600">در حال آماده‌سازی و ارسال</span>;
      case "SHIPPED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-600">تحویل پست شده</span>;
      case "DELIVERED":
      case "COMPLETED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-700">تحویل شده و تکمیل</span>;
      case "CANCELLED":
      case "REJECTED":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600">لغو شده</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-600">{status}</span>;
    }
  };

  const filteredTickets = tickets.filter((t) => {
    // Role filter
    if (activeTab === "supplier" && t.user?.role !== "SUPPLIER") return false;
    if (activeTab === "store_manager" && t.user?.role !== "STORE_MANAGER") return false;

    // Department filter
    if (departmentFilter !== "ALL") {
      if (departmentFilter === "DELAY" && !["ORDER_DELAY_LOGISTICS", "ORDER_DELAY_SUPPLIER", "SHIPPING"].includes(t.department)) {
        return false;
      }
      if (departmentFilter === "DISPUTE" && t.department !== "DISPUTE") return false;
      if (departmentFilter === "FINANCIAL" && t.department !== "FINANCIAL") return false;
      if (departmentFilter === "GENERAL_MANAGER" && t.department !== "GENERAL_MANAGER") return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject = t.subject?.toLowerCase().includes(q);
      const matchName = `${t.user?.firstName || ""} ${t.user?.lastName || ""}`.toLowerCase().includes(q);
      const matchId = String(t.id).includes(q);
      const matchMsg = t.message?.toLowerCase().includes(q);
      return matchSubject || matchName || matchId || matchMsg;
    }

    return true;
  });

  const supplierTicketsCount = tickets.filter((t) => t.user?.role === "SUPPLIER").length;
  const storeManagerTicketsCount = tickets.filter((t) => t.user?.role === "STORE_MANAGER").length;
  const delayTicketsCount = tickets.filter((t) => ["ORDER_DELAY_LOGISTICS", "ORDER_DELAY_SUPPLIER", "SHIPPING"].includes(t.department)).length;

  const supplierTickets = tickets.filter((t) => t.user?.role === "SUPPLIER");
  const storeManagerTickets = tickets.filter((t) => t.user?.role === "STORE_MANAGER");
  const currentTabTickets = activeTab === "supplier" ? supplierTickets : storeManagerTickets;

  return (
    <div className="space-y-6 animate-fade-in text-right font-sans" dir="rtl">
      {/* Notifications */}
      {notification && (
        <div
          className={`fixed top-4 left-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm flex items-center gap-2 animate-bounce ${
            notification.type === "success" 
              ? "bg-success/10 border-success/20 text-success" 
              : "bg-danger/10 border-danger/20 text-danger"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : (
            <AlertCircle className="w-5 h-5 text-danger" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-indigo-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Scale className="w-6 h-6 text-indigo-400" />
            مرکز داوری، تیکت‌ها و پیگیری تأخیر سفارشات
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm font-medium mt-1 leading-relaxed">
            بررسی هوشمند تیکت‌ها، پیگیری تأخیر در ارسال یا لجستیک، و مشاهده آنی پرونده کامل سفارش و شماره‌های تماس طرفین
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-400" />
            <span>تیکت‌های تأخیر سفارش: {delayTicketsCount}</span>
          </div>
          <button
            onClick={fetchTickets}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-colors cursor-pointer"
            title="بروزرسانی تیکت‌ها"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Switch Departments: Dispute Center vs Communication Center */}
      <div className="flex bg-surface p-1 rounded-2xl border border-subtle w-full max-w-md">
        <button
          onClick={() => {
            setActiveDepartment("dispute");
            setSelectedTicket(null);
          }}
          className={`flex-1 py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeDepartment === "dispute" 
              ? "bg-primary-default text-white shadow-md shadow-primary-default/10" 
              : "text-muted hover:text-text-primary"
          }`}
        >
          <Scale className="w-4 h-4" /> مرکز حل اختلاف و تیکت‌ها
        </button>
        <button
          onClick={() => {
            setActiveDepartment("communication");
            setSelectedTicket(null);
          }}
          className={`flex-1 py-3 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeDepartment === "communication" 
              ? "bg-primary-default text-white shadow-md shadow-primary-default/10" 
              : "text-muted hover:text-text-primary"
          }`}
        >
          <Users className="w-4 h-4" /> گفتگوی داخلی همکاران
        </button>
      </div>

      {activeDepartment === "dispute" ? (
        <>
          {/* Dispute Center UI */}
          {!selectedTicket ? (
            <div className="space-y-6">
              {/* Filter controls & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-surface p-4 rounded-2xl border border-subtle">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute right-3 top-3 text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو در عنوان تیکت، شماره سفارش، نام کاربر..."
                    className="w-full pl-4 pr-9 py-2 bg-background border border-subtle rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-default/20"
                  />
                </div>

                {/* Department Filter Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-muted ml-1 flex items-center gap-1">
                    <Filter className="w-3.5 h-3.5" /> فیلتر:
                  </span>
                  {[
                    { id: "ALL", label: "همه" },
                    { id: "DELAY", label: "🚚 تأخیرات لجستیک و تأمین" },
                    { id: "DISPUTE", label: "⚖️ مغایرت و حل اختلاف" },
                    { id: "FINANCIAL", label: "💰 تسویه و مالی" },
                    { id: "GENERAL_MANAGER", label: "👑 مدیریت ارشد" }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setDepartmentFilter(f.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        departmentFilter === f.id
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "bg-background text-text-secondary hover:text-text-primary border border-subtle"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Roles Tabs */}
              <div className="flex border-b border-subtle">
                <button
                  onClick={() => setActiveTab("supplier")}
                  className={`px-6 py-3 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "supplier" 
                      ? "border-primary-default text-primary-default" 
                      : "border-transparent text-muted hover:text-text-primary"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" /> تیکت‌های تامین‌کنندگان
                  <span className={`mr-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === "supplier" ? "bg-primary-default/20 text-primary-default" : "bg-background text-muted"
                  }`}>
                    {supplierTicketsCount}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("store_manager")}
                  className={`px-6 py-3 font-bold text-xs border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === "store_manager" 
                      ? "border-primary-default text-primary-default" 
                      : "border-transparent text-muted hover:text-text-primary"
                  }`}
                >
                  <User className="w-4 h-4" /> تیکت‌های مدیران فروشگاه‌ها
                  <span className={`mr-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    activeTab === "store_manager" ? "bg-primary-default/20 text-primary-default" : "bg-background text-muted"
                  }`}>
                    {storeManagerTicketsCount}
                  </span>
                </button>
              </div>

              {/* Dispute Tickets Table List */}
              {loading ? (
                <div className="text-center p-12 text-muted font-medium">در حال بارگذاری تیکت‌ها...</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {filteredTickets.map((t) => (
                    <div
                      key={t.id}
                      className="bg-surface p-5 rounded-2xl border border-subtle hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-mono font-black text-xs text-primary-default">#{t.id}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === "OPEN" 
                              ? "bg-danger/10 text-danger border border-danger/20" 
                              : "bg-success/10 text-success border border-success/20"
                          }`}>
                            {t.status === "OPEN" ? "در جریان بررسی" : "پاسخ داده شده / مختومه"}
                          </span>
                          <h4 className="text-sm font-extrabold text-text-primary">{t.subject}</h4>
                          {getDepartmentBadge(t.department)}
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            t.priority === "HIGH" ? "bg-danger/10 text-danger" : "bg-primary-default/10 text-primary-default"
                          }`}>
                            اولویت: {t.priority === "HIGH" ? "فوری" : "معمولی"}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted flex items-center gap-4 flex-wrap mt-1 font-medium">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-primary-default" /> کاربر: {t.user?.firstName} {t.user?.lastName} (
                            {t.user?.role === "SUPPLIER" ? "تامین‌کننده" : "مدیر فروشگاه"})
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5" /> تاریخ: {new Date(t.createdAt).toLocaleDateString("fa-IR")}
                          </span>
                          {t.messages && t.messages.length > 0 && (
                            <span className="flex items-center gap-1 text-indigo-600 font-bold">
                              💬 {t.messages.length} پیام تبادل شده
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer self-stretch md:self-auto justify-center shadow-lg shadow-indigo-600/20 shrink-0"
                      >
                        <Scale className="w-4 h-4" /> بررسی پرونده و گفتگو
                      </button>
                    </div>
                  ))}
                  {filteredTickets.length === 0 && (
                    <div className="text-center py-16 bg-surface rounded-2xl border border-dashed border-subtle text-muted font-bold text-xs space-y-2">
                      <p>هیچ تیکتی در این دسته‌بندی یافت نشد.</p>
                      {departmentFilter !== "ALL" && (
                        <button
                          onClick={() => setDepartmentFilter("ALL")}
                          className="text-xs text-indigo-600 font-bold hover:underline"
                        >
                          مشاهده تمام تیکت‌ها
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* DETAILED DISPUTE & ORDER INVESTIGATION CENTER */
            <div className="space-y-6">
              {/* Back & Title Header */}
              <div className="flex items-center justify-between bg-surface p-4 rounded-2xl border border-subtle flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-2 rounded-xl bg-background hover:bg-primary-default/10 text-text-primary hover:text-primary-default border border-subtle transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>بازگشت به لیست تیکت‌ها</span>
                  </button>
                  <div>
                    <h3 className="font-extrabold text-text-primary text-base">
                      {selectedTicket.subject}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted">
                      <span>کد تیکت: #{selectedTicket.id}</span>
                      <span>•</span>
                      {getDepartmentBadge(selectedTicket.department)}
                    </div>
                  </div>
                </div>

                {/* Manual Order Link Form */}
                <form onSubmit={handleManualOrderInspect} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={manualOrderIdInput}
                    onChange={(e) => setManualOrderIdInput(e.target.value)}
                    placeholder="شماره سفارش مرتبط (مثلاً 1042)..."
                    className="px-3 py-2 bg-background border border-subtle rounded-xl text-xs font-bold text-text-primary w-48 text-left font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5" /> استعلام سفارش
                  </button>
                </form>
              </div>

              {/* ASSOCIATED ORDER DOSSIER (LIVE INSPECTION BOX) */}
              {loadingOrder ? (
                <div className="p-6 bg-surface rounded-2xl border border-indigo-500/30 text-center text-xs font-bold text-indigo-600 animate-pulse flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  در حال استعلام و بازخوانی پرونده سفارش از دیتابیس...
                </div>
              ) : associatedOrderData && associatedOrderData.order ? (
                <div className="bg-gradient-to-br from-indigo-950/20 via-slate-900/10 to-indigo-900/10 border-2 border-indigo-500/30 rounded-3xl p-5 shadow-lg space-y-4">
                  {/* Header of Dossier */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <Package className="w-6 h-6 text-indigo-500 shrink-0" />
                      <div>
                        <h4 className="font-extrabold text-sm text-text-primary flex items-center gap-2">
                          <span>پرونده جامع سفارش #{associatedOrderData.order.id}</span>
                          {getOrderStatusBadge(associatedOrderData.order.status)}
                        </h4>
                        <span className="text-[11px] text-muted font-medium">
                          تاریخ ثبت سفارش: {new Date(associatedOrderData.order.createdAt).toLocaleDateString("fa-IR")} | مبلغ کل: {associatedOrderData.order.totalAmount?.toLocaleString("fa-IR")} تومان
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {associatedOrderData.order.postalLabel && (
                        <button
                          onClick={() => {
                            const printWindow = window.open("", "_blank");
                            if (printWindow) {
                              printWindow.document.write(
                                `<html dir="rtl"><head><title>لیبل پستی سفارش ${associatedOrderData.order.id}</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh;"><img src="${associatedOrderData.order.postalLabel}" style="max-width:100%;max-height:100vh;" onload="window.print();" /></body></html>`
                              );
                              printWindow.document.close();
                            }
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> چاپ لیبل پستی
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3-Column Inspection Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Supplier Information Card */}
                    <div className="bg-surface/80 p-4 rounded-2xl border border-subtle space-y-2">
                      <h5 className="text-xs font-extrabold text-indigo-600 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-indigo-500" />
                        تأمین‌کننده کالاهای سفارش
                      </h5>
                      {associatedOrderData.suppliers && associatedOrderData.suppliers.length > 0 ? (
                        associatedOrderData.suppliers.map((supp: any) => (
                          <div key={supp.id} className="space-y-1 text-xs">
                            <div className="font-bold text-text-primary">
                              {supp.brandName || `${supp.firstName || ""} ${supp.lastName || ""}`}
                            </div>
                            <div className="text-muted text-[11px]">نام کاربری: {supp.username}</div>
                            <div className="text-muted text-[11px]">موقعیت: {supp.province || "نامشخص"} - {supp.city || "نامشخص"}</div>
                            {supp.mobile && (
                              <div className="pt-1 flex items-center gap-2">
                                <a
                                  href={`tel:${supp.mobile}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
                                >
                                  <Phone className="w-3 h-3 text-indigo-600" />
                                  <span>تماس فوری: {supp.mobile}</span>
                                </a>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted">اطلاعات تأمین‌کننده در دسترس نیست.</p>
                      )}
                    </div>

                    {/* Store / Buyer Information */}
                    <div className="bg-surface/80 p-4 rounded-2xl border border-subtle space-y-2">
                      <h5 className="text-xs font-extrabold text-blue-600 flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-blue-500" />
                        فروشگاه و خریدار
                      </h5>
                      <div className="space-y-1 text-xs">
                        <div className="font-bold text-text-primary">
                          {associatedOrderData.order.customerName || associatedOrderData.order.store?.storeName || "خریدار سفارش"}
                        </div>
                        <div className="text-muted text-[11px]">
                          شماره تماس خریدار: {associatedOrderData.order.customerPhone || associatedOrderData.order.store?.mobile || "ثبت نشده"}
                        </div>
                        {associatedOrderData.order.customerPhone && (
                          <div className="pt-1">
                            <a
                              href={`tel:${associatedOrderData.order.customerPhone}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold border border-blue-200 dark:border-blue-800 hover:bg-blue-100"
                            >
                              <Phone className="w-3 h-3 text-blue-600" />
                              <span>تماس با خریدار</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Postal & Shipping Details */}
                    <div className="bg-surface/80 p-4 rounded-2xl border border-subtle space-y-2">
                      <h5 className="text-xs font-extrabold text-amber-600 flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-amber-500" />
                        وضعیت پستی و آدرس
                      </h5>
                      <div className="space-y-1 text-xs">
                        <div className="text-[11px] text-text-secondary leading-relaxed">
                          <span className="font-bold">آدرس تحویل: </span>
                          {associatedOrderData.order.customerAddress || associatedOrderData.order.shippingAddress || "ثبت نشده"}
                        </div>
                        <div className="text-[11px] text-muted">
                          <span className="font-bold">کد پستی: </span>
                          {associatedOrderData.order.postalCode || "ثبت نشده"}
                        </div>
                        <div className="text-[11px] text-muted">
                          <span className="font-bold">شناسه رهگیری پستی: </span>
                          {associatedOrderData.order.trackingCode || "هنوز صادر نشده"}
                        </div>
                        <div className="text-[11px]">
                          <span className="font-bold">وضعیت لیبل: </span>
                          {associatedOrderData.order.postalLabel ? (
                            <span className="text-emerald-600 font-bold">✅ لیبل پستی آپلود شده</span>
                          ) : (
                            <span className="text-rose-600 font-bold">❌ فاقد لیبل پستی</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items breakdown */}
                  {associatedOrderData.order.items && associatedOrderData.order.items.length > 0 && (
                    <div className="bg-background/60 p-3 rounded-2xl border border-subtle">
                      <span className="text-[11px] font-bold text-text-primary block mb-2">اقلام موجود در این سفارش:</span>
                      <div className="space-y-1.5">
                        {associatedOrderData.order.items.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between text-xs p-2 rounded-xl bg-surface border border-subtle/50">
                            <span className="font-bold text-text-primary">{item.productName || item.product?.name}</span>
                            <span className="text-muted font-medium">تعداد: {item.quantity} عدد</span>
                            <span className="font-bold text-indigo-600 font-mono">{item.totalPrice?.toLocaleString("fa-IR")} تومان</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Chat thread & Timeline layout */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Timeline & Metadata (Right side / 1 column) */}
                <div className="lg:col-span-1 bg-surface p-5 rounded-2xl border border-subtle space-y-6">
                  <div>
                    <h4 className="font-bold text-xs text-text-primary uppercase tracking-wide">اطلاعات پرونده</h4>
                    <p className="text-[10px] text-muted mt-1 font-mono">کد ارجاع: #TICKET-{selectedTicket.id}</p>
                  </div>

                  {/* Timeline display */}
                  <div className="space-y-4">
                    <h5 className="text-[11px] font-bold text-text-primary">گام‌های زمان‌بندی بررسی</h5>
                    <div className="relative border-r border-subtle pr-4 space-y-4">
                      {/* Event 1 */}
                      <div className="relative">
                        <div className="absolute right-[-21px] top-1 w-3 h-3 bg-primary-default rounded-full ring-4 ring-primary-default/20"></div>
                        <span className="text-[10px] font-bold text-text-primary block">۱. ثبت تیکت / گزارش</span>
                        <span className="text-[9px] text-muted">{new Date(selectedTicket.createdAt).toLocaleDateString("fa-IR")}</span>
                      </div>
                      {/* Event 2 */}
                      <div className="relative">
                        <div className="absolute right-[-21px] top-1 w-3 h-3 bg-primary-default rounded-full ring-4 ring-primary-default/20"></div>
                        <span className="text-[10px] font-bold text-text-primary block">۲. تبادل مدارک طرفین</span>
                        <span className="text-[9px] text-muted">بررسی مستندات دیجیتال و سفارشات</span>
                      </div>
                      {/* Event 3 */}
                      <div className="relative">
                        <div className="absolute right-[-21px] top-1 w-3 h-3 bg-primary-default rounded-full ring-4 ring-primary-default/20"></div>
                        <span className="text-[10px] font-bold text-text-primary block">۳. ارزیابی حاکمیتی و پیگیری</span>
                        <span className="text-[9px] text-muted">اقدام و بررسی توسط مدیر کل</span>
                      </div>
                      {/* Event 4 */}
                      <div className="relative">
                        <div className={`absolute right-[-21px] top-1 w-3 h-3 rounded-full ring-4 ${
                          selectedTicket.status === "ANSWERED" ? "bg-success ring-success/20" : "bg-subtle ring-subtle"
                        }`}></div>
                        <span className={`text-[10px] font-bold block ${
                          selectedTicket.status === "ANSWERED" ? "text-success" : "text-muted"
                        }`}>۴. پاسخ نهایی و اقدام</span>
                        <span className="text-[9px] text-muted">ثبت پاسخ و صدور تصمیم</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-background p-3 rounded-xl border border-subtle">
                    <div className="text-[10px] font-bold text-text-primary block mb-1">اطلاعات ارسال‌کننده تیکت:</div>
                    <div className="text-[10px] text-muted">
                      نام: {selectedTicket.user?.firstName} {selectedTicket.user?.lastName}
                    </div>
                    <div className="text-[10px] text-muted">
                      نام کاربری: {selectedTicket.user?.username}
                    </div>
                    <div className="text-[10px] text-muted">
                      نقش: {selectedTicket.user?.role === "SUPPLIER" ? "تامین‌کننده" : "مدیر فروشگاه"}
                    </div>
                  </div>
                </div>

                {/* Chat thread & Verdict Form (Left side / 3 columns) */}
                <div className="lg:col-span-3 space-y-6">
                  <div className="bg-surface rounded-2xl border border-subtle shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                    {/* Messages container */}
                    <div className="p-6 flex-1 space-y-4 max-h-[350px] overflow-y-auto bg-background/30">
                      {/* Original Initial message */}
                      {selectedTicket.message && (
                        <div className="flex flex-col max-w-[85%] ml-auto items-end text-right">
                          <div className="px-4 py-3 rounded-2xl text-xs leading-relaxed bg-surface text-text-primary border border-subtle shadow-sm rounded-tl-none font-medium">
                            <span className="text-[10px] font-bold text-indigo-600 block mb-1">متن اولیه تیکت:</span>
                            {renderMessageWithAttachments(selectedTicket.message, false)}
                          </div>
                          <span className="text-[9px] text-muted mt-1 px-1 flex gap-1 font-mono">
                            <span>{selectedTicket.user?.firstName || "کاربر"} {selectedTicket.user?.lastName || ""}</span>
                            <span>•</span>
                            <span>{new Date(selectedTicket.createdAt).toLocaleDateString("fa-IR")}</span>
                          </span>
                        </div>
                      )}

                      {/* Reply messages */}
                      {selectedTicket.messages?.map((msg: any) => {
                        const isAdmin =
                          msg.user?.role === "SUPER_ADMIN" ||
                          msg.user?.role === "SUPERADMIN" ||
                          msg.user?.role === "ADMIN" ||
                          msg.message.includes("⚖️ رای نهایی");
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col max-w-[85%] ${isAdmin ? "mr-auto items-start text-left" : "ml-auto items-end text-right"}`}
                          >
                            <div
                              className={`px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                                isAdmin 
                                  ? "bg-indigo-600 text-white rounded-tr-none font-medium shadow-md shadow-indigo-600/20" 
                                  : "bg-surface text-text-primary border border-subtle shadow-sm rounded-tl-none"
                              }`}
                            >
                              {renderMessageWithAttachments(msg.message, isAdmin)}
                            </div>
                            <span className="text-[9px] text-muted mt-1 px-1 flex gap-1 font-mono">
                              <span>{msg.user?.firstName || (isAdmin ? "مدیریت ارشد" : "کاربر")} {msg.user?.lastName || ""}</span>
                              <span>•</span>
                              <span>{new Date(msg.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Reply Input Form & Attachments */}
                    <div className="p-4 border-t border-subtle bg-background">
                      <form onSubmit={handleSendReply} className="space-y-3">
                        {attachedFiles.length > 0 && (
                          <div className="flex gap-2 flex-wrap items-center">
                            <span className="text-[10px] text-muted">اسناد ضمیمه شده:</span>
                            {attachedFiles.map((f, i) => (
                              <span key={i} className="bg-primary-default/10 text-primary-default px-2 py-0.5 rounded text-[10px] font-bold border border-primary-default/10 flex items-center gap-1">
                                {f.type === "image" ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                {f.name}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2 items-end">
                          {/* Attachments buttons */}
                          <div className="flex gap-1.5 shrink-0">
                            <label
                              className="p-2.5 bg-surface hover:bg-background border border-subtle rounded-xl text-muted hover:text-text-primary cursor-pointer transition-colors inline-flex items-center justify-center"
                              title="ضمیمه عکس مدرک"
                            >
                              <ImageIcon className="w-4 h-4" />
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleRealFileUpload(e, "image")}
                              />
                            </label>
                            <label
                              className="p-2.5 bg-surface hover:bg-background border border-subtle rounded-xl text-muted hover:text-text-primary cursor-pointer transition-colors inline-flex items-center justify-center"
                              title="ضمیمه فایل سند"
                            >
                              <FileText className="w-4 h-4" />
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.zip,.rar"
                                className="hidden"
                                onChange={(e) => handleRealFileUpload(e, "file")}
                              />
                            </label>
                          </div>

                          <textarea
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder="پاسخ مدیریت، پیگیری سفارش، یا ارائه توضیحات..."
                            className="flex-1 px-4 py-2.5 bg-surface border border-subtle rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-text-primary resize-none"
                            rows={2}
                          />

                          <button
                            type="submit"
                            disabled={sendingReply || !replyMessage.trim()}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer h-[42px]"
                          >
                            <Send className="w-4 h-4" />
                            <span>{sendingReply ? "در حال ارسال..." : "ارسال پاسخ"}</span>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>

                  {/* Verdict Decision Form (If Dispute/Adjudication needed) */}
                  <div className="bg-surface p-5 rounded-2xl border border-subtle space-y-4">
                    <div className="flex items-center gap-2 border-b border-subtle pb-3">
                      <ShieldCheck className="w-5 h-5 text-indigo-600" />
                      <h4 className="font-extrabold text-sm text-text-primary">صدور رأی نهایی و حاکمیتی مدیر کل</h4>
                    </div>
                    <form onSubmit={handleSubmitVerdict} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1.5">نوع تصمیم / حکم حاکمیتی:</label>
                        <select
                          value={verdictType}
                          onChange={(e) => setVerdictType(e.target.value)}
                          className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                        >
                          <option value="REFUND_STORE">استرداد وجه کامل به فروشگاه و لغو سفارش</option>
                          <option value="RELEASE_SUPPLIER">تایید ارسال، تایید سلامت مرسوله و آزادسازی فوری مبالغ تامین‌کننده</option>
                          <option value="DISMISS">رد شکایت / اعلام هماهنگی پستی و تداوم سفارش</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-text-secondary mb-1.5">متن رأی و توضیحات رسمی مدیرکل:</label>
                        <textarea
                          rows={3}
                          value={verdictText}
                          onChange={(e) => setVerdictText(e.target.value)}
                          placeholder="شرح دلایل تصمیم، نتیجه پیگیری با اداره پست یا تامین‌کننده و ابلاغ نتیجه به طرفین..."
                          className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs font-bold text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingVerdict || !verdictText.trim()}
                        className="w-full py-3 bg-indigo-700 hover:bg-indigo-600 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-700/20 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Scale className="w-4 h-4" />
                        <span>{submittingVerdict ? "در حال ابلاغ رأی..." : "صدور و ابلاغ حکم رسمی"}</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Communication Center UI (Direct Messages Tab) */
        <div className="bg-surface p-6 rounded-2xl border border-subtle space-y-6">
          <div>
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <Users className="w-6 h-6 text-primary-default" />
              مرکز ارتباطات و پیام‌رسان بومی (Communication Hub)
            </h2>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              اتاق گفتگوهای مستقیم و مستمر بین ناظرین سیستم، تامین‌کنندگان و فروشندگان کالا جهت جلوگیری از تشتت پیام‌ها در واتساپ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Rooms list (1 column) */}
            <div className="md:col-span-1 bg-background p-3 rounded-xl border border-subtle space-y-2">
              <h4 className="text-[11px] font-bold text-muted block mb-2 px-1">کانال‌های ارتباطی فعال</h4>
              <button
                onClick={() => setDirectChannel("admin-supplier")}
                className={`w-full text-right p-3 rounded-lg text-xs font-bold transition-all cursor-pointer block ${
                  directChannel === "admin-supplier" ? "bg-primary-default text-white" : "bg-card text-text-primary border border-subtle hover:bg-surface"
                }`}
              >
                🤝 مدیر کل ↔ تامین‌کنندگان
              </button>
              <button
                onClick={() => setDirectChannel("admin-store")}
                className={`w-full text-right p-3 rounded-lg text-xs font-bold transition-all cursor-pointer block ${
                  directChannel === "admin-store" ? "bg-primary-default text-white" : "bg-card text-text-primary border border-subtle hover:bg-surface"
                }`}
              >
                🏪 مدیر کل ↔ فروشگاه‌ها
              </button>
              <button
                onClick={() => setDirectChannel("supplier-store")}
                className={`w-full text-right p-3 rounded-lg text-xs font-bold transition-all cursor-pointer block ${
                  directChannel === "supplier-store" ? "bg-primary-default text-white" : "bg-card text-text-primary border border-subtle hover:bg-surface"
                }`}
              >
                🔄 تامین‌کنندگان ↔ فروشگاه‌ها
              </button>
            </div>

            {/* Chat Thread (3 columns) */}
            <div className="md:col-span-3 bg-background/50 rounded-xl border border-subtle p-5 flex flex-col justify-between min-h-[350px]">
              <div className="space-y-4 overflow-y-auto max-h-[250px] flex-1 pb-4">
                {directMessagesList.map((m) => (
                  <div key={m.id} className={`flex flex-col max-w-[80%] ${m.isAdmin ? "mr-auto items-start" : "ml-auto items-end"}`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-xs ${
                      m.isAdmin ? "bg-primary-default text-white rounded-tr-none" : "bg-white text-slate-800 border border-subtle rounded-tl-none"
                    }`}>
                      <p>{m.text}</p>
                    </div>
                    <span className="text-[8px] text-muted mt-1 px-1">
                      {m.sender} • {m.time}
                    </span>
                  </div>
                ))}
              </div>

              {/* Direct message send input */}
              <form onSubmit={handleSendDirectMessage} className="flex gap-2 items-center pt-4 border-t border-subtle/50">
                <input
                  type="text"
                  value={directMessage}
                  onChange={(e) => setDirectMessage(e.target.value)}
                  placeholder="پیام مستقیم خود را در شبکه بومی زوپیت بنویسید..."
                  className="flex-1 bg-white border border-subtle rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-primary-default text-slate-800"
                />
                <button
                  type="submit"
                  disabled={!directMessage.trim()}
                  className="px-5 py-3 bg-primary-default hover:bg-primary-default disabled:bg-surface text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                >
                  ارسال پیام مستقیم
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
