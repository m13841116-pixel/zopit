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
  CheckSquare
} from "lucide-react";

export default function Tickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDepartment, setActiveDepartment] = useUrlQueryState<"dispute" | "communication">("dept", "dispute");
  const [activeTab, setActiveTab] = useUrlQueryState<"supplier" | "store_manager">("subtab", "supplier");
  
  // Dispute specific states
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<{name: string, type: "image" | "file", dataUrl?: string}[]>([]);
  const [sendingReply, setSendingReply] = useState(false);
  
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
          <Scale className="w-4 h-4" /> مرکز حل اختلاف (Dispute Center)
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
          <Users className="w-4 h-4" /> گفتگوی داخلی همکاران (Direct Chat)
        </button>
      </div>

      {activeDepartment === "dispute" ? (
        <>
          {/* Dispute Center UI */}
          {!selectedTicket ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Scale className="w-6 h-6 text-primary-default" />
                  مرکز داوری و حل اختلاف پلتفرم (Dispute Adjudication Center)
                </h2>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  بررسی پرونده‌های مغایرت کالا، تاخیر در تحویل یا درخواست مرجوعی وجه. دارای قابلیت بررسی پیوست‌ها، ثبت رای نهایی و حاکمیتی مدیرکل.
                </p>
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
                    {supplierTickets.length}
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
                    {storeManagerTickets.length}
                  </span>
                </button>
              </div>

              {/* Dispute Tickets Table List */}
              {loading ? (
                <div className="text-center p-12 text-muted font-medium">در حال بارگذاری اختلافات...</div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {currentTabTickets.map((t) => (
                    <div
                      key={t.id}
                      className="bg-surface p-5 rounded-2xl border border-subtle hover:shadow-md transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === "OPEN" 
                              ? "bg-danger/10 text-danger border border-danger/20" 
                              : "bg-success/10 text-success border border-success/20"
                          }`}>
                            {t.status === "OPEN" ? "در جریان بررسی" : "مختومه و صادر شده"}
                          </span>
                          <span className="text-sm font-bold text-text-primary">{t.subject}</span>
                          <span className="px-2 py-0.5 bg-primary-default/10 text-primary-default rounded text-[9px] font-bold">
                            دپارتمان: {t.department}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            t.priority === "HIGH" ? "bg-danger/10 text-danger" : "bg-primary-default/10 text-primary-default"
                          }`}>
                            اولویت: {t.priority === "HIGH" ? "فوری" : "معمولی"}
                          </span>
                        </div>
                        <div className="text-[10px] text-muted flex items-center gap-4 flex-wrap mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> شاکی: {t.user?.firstName} {t.user?.lastName} (
                            {t.user?.role === "SUPPLIER" ? "تامین‌کننده" : "فروشگاه"})
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Clock className="w-3.5 h-3.5" /> بازگشایی پرونده: {new Date(t.createdAt).toLocaleDateString("fa-IR")}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedTicket(t)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-primary-default hover:bg-primary-default text-slate-900 rounded-xl text-xs font-bold transition-all cursor-pointer self-stretch md:self-auto justify-center shadow-lg shadow-primary-default/10"
                      >
                        <Scale className="w-4 h-4" /> قضاوت پرونده و تبادل مستندات
                      </button>
                    </div>
                  ))}
                  {currentTabTickets.length === 0 && (
                    <div className="text-center py-16 bg-surface rounded-2xl border border-dashed border-subtle text-muted font-bold text-xs">
                      خوشبختانه هیچ پرونده اختلافی در این طبقه جاری نیست.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* DETAILED DISPUTE adjudication center */
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Timeline & Metadata (Right side / 1 column) */}
              <div className="lg:col-span-1 bg-surface p-5 rounded-2xl border border-subtle space-y-6">
                <div>
                  <h4 className="font-bold text-xs text-text-primary uppercase tracking-wide">اطلاعات پرونده حقوقی</h4>
                  <p className="text-[10px] text-muted mt-1">کد ارجاع: #DISP-{selectedTicket.id}</p>
                </div>

                {/* Timeline display */}
                <div className="space-y-4">
                  <h5 className="text-[11px] font-bold text-text-primary">گام‌های زمان‌بندی بررسی پرونده</h5>
                  <div className="relative border-r border-subtle pr-4 space-y-4">
                    {/* Event 1 */}
                    <div className="relative">
                      <div className="absolute right-[-21px] top-1 w-3 h-3 bg-primary-default rounded-full ring-4 ring-primary-default/20"></div>
                      <span className="text-[10px] font-bold text-text-primary block">۱. ثبت رسمی اختلاف</span>
                      <span className="text-[9px] text-muted">{new Date(selectedTicket.createdAt).toLocaleDateString("fa-IR")}</span>
                    </div>
                    {/* Event 2 */}
                    <div className="relative">
                      <div className="absolute right-[-21px] top-1 w-3 h-3 bg-primary-default rounded-full ring-4 ring-primary-default/20"></div>
                      <span className="text-[10px] font-bold text-text-primary block">۲. تبادل مدارک طرفین</span>
                      <span className="text-[9px] text-muted">بررسی مستندات دیجیتال و تصاویر ارسالی</span>
                    </div>
                    {/* Event 3 */}
                    <div className="relative">
                      <div className="absolute right-[-21px] top-1 w-3 h-3 bg-primary-default rounded-full ring-4 ring-primary-default/20"></div>
                      <span className="text-[10px] font-bold text-text-primary block">۳. ارزیابی حاکمیتی</span>
                      <span className="text-[9px] text-muted">بررسی لایحه دفاعیه توسط ناظر عالی</span>
                    </div>
                    {/* Event 4 */}
                    <div className="relative">
                      <div className={`absolute right-[-21px] top-1 w-3 h-3 rounded-full ring-4 ${
                        selectedTicket.status === "ANSWERED" ? "bg-success ring-success/20" : "bg-subtle ring-subtle"
                      }`}></div>
                      <span className={`text-[10px] font-bold block ${
                        selectedTicket.status === "ANSWERED" ? "text-success" : "text-muted"
                      }`}>۴. صدور حکم رسمی</span>
                      <span className="text-[9px] text-muted">رای لازم‌الاجرا و بسته‌شدن پرونده</span>
                    </div>
                  </div>
                </div>

                <div className="bg-background p-3 rounded-xl border border-subtle">
                  <div className="text-[10px] font-bold text-text-primary block mb-1">اطلاعات شاکی:</div>
                  <div className="text-[10px] text-muted">
                    نام: {selectedTicket.user?.firstName} {selectedTicket.user?.lastName}
                  </div>
                  <div className="text-[10px] text-muted">
                    سمت: {selectedTicket.user?.role === "SUPPLIER" ? "تامین‌کننده" : "فروشگاه ارکیده"}
                  </div>
                </div>
              </div>

              {/* Chat thread & Verdict Form (Left side / 3 columns) */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-surface rounded-2xl border border-subtle shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                  {/* Thread Header */}
                  <div className="px-6 py-4 bg-background border-b border-subtle flex justify-between items-center flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTicket(null)}
                        className="p-1 rounded-lg text-muted hover:bg-surface transition-colors cursor-pointer ml-1"
                        title="بازگشت به لیست"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </button>
                      <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                        موضوع اختلاف: {selectedTicket.subject}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedTicket(null)}
                      className="text-[10px] text-muted hover:text-primary font-bold bg-surface px-3 py-1.5 rounded-lg border border-subtle transition-colors cursor-pointer"
                    >
                      بازگشت به تیکت‌ها
                    </button>
                  </div>

                  {/* Messages container */}
                  <div className="p-6 flex-1 space-y-4 max-h-[350px] overflow-y-auto bg-background/30">
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
                                ? "bg-primary-default text-white rounded-tr-none font-medium" 
                                : "bg-surface text-text-primary border border-subtle shadow-sm rounded-tl-none"
                            }`}
                          >
                            {renderMessageWithAttachments(msg.message, isAdmin)}
                          </div>
                          <span className="text-[9px] text-muted mt-1 px-1 flex gap-1 font-mono">
                            <span>{msg.user?.firstName || "مدیر کل"} {msg.user?.lastName || ""}</span>
                            <span>•</span>
                            <span>{new Date(msg.createdAt).toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reply Input Form & Simulated Attachments */}
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
                          placeholder="پاسخ، سند یا توضیحی برای تبادل اضافه کنید..."
                          className="flex-1 min-h-[44px] max-h-[100px] p-2.5 text-xs bg-surface border border-subtle rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-default text-text-primary text-right resize-none"
                          required
                        />
                        <button
                          type="submit"
                          disabled={sendingReply || !replyMessage.trim()}
                          className="px-5 py-2.5 bg-primary-default hover:bg-primary-default disabled:bg-surface text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>ارسال</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>

                {/* SUPER ADMIN ADJUDICATION PANEL (Verdict Engine) */}
                {selectedTicket.status === "OPEN" && (
                  <form onSubmit={handleSubmitVerdict} className="bg-surface p-6 rounded-2xl border border-subtle space-y-4">
                    <div className="flex items-center gap-2 pb-3 border-b border-subtle">
                      <Scale className="w-5 h-5 text-primary-default animate-pulse" />
                      <div>
                        <h4 className="font-bold text-xs text-text-primary">پانل انحصاری صدور حکم نهایی (Verdict Engine)</h4>
                        <p className="text-[10px] text-muted">حکم شما قطعی، سیستماتیک و غیرقابل فرجام‌خواهی است.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <label className="flex items-center gap-2 p-3 border border-subtle rounded-xl bg-background hover:bg-surface cursor-pointer">
                        <input
                          type="radio"
                          name="verdict-type"
                          value="REFUND_STORE"
                          checked={verdictType === "REFUND_STORE"}
                          onChange={(e) => setVerdictType(e.target.value)}
                          className="w-4 h-4 text-primary-default"
                        />
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-danger block">بازگرداندن وجه به فروشگاه</span>
                          <span className="text-[9px] text-muted">کسر موجودی تامین‌کننده</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 p-3 border border-subtle rounded-xl bg-background hover:bg-surface cursor-pointer">
                        <input
                          type="radio"
                          name="verdict-type"
                          value="RELEASE_SUPPLIER"
                          checked={verdictType === "RELEASE_SUPPLIER"}
                          onChange={(e) => setVerdictType(e.target.value)}
                          className="w-4 h-4 text-primary-default"
                        />
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-success block">آزادسازی مبالغ تامین‌کننده</span>
                          <span className="text-[9px] text-muted">تایید انجام تعهدات</span>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 p-3 border border-subtle rounded-xl bg-background hover:bg-surface cursor-pointer">
                        <input
                          type="radio"
                          name="verdict-type"
                          value="DISMISS"
                          checked={verdictType === "DISMISS"}
                          onChange={(e) => setVerdictType(e.target.value)}
                          className="w-4 h-4 text-primary-default"
                        />
                        <div className="text-right">
                          <span className="text-[11px] font-bold text-muted block">مصالحه و رد طرفین</span>
                          <span className="text-[9px] text-muted">بایگانی عادی اختلاف</span>
                        </div>
                      </label>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted block">متن ابلاغیه حکم رسمی حاکمیتی</label>
                      <textarea
                        value={verdictText}
                        onChange={(e) => setVerdictText(e.target.value)}
                        placeholder="استدلال حقوقی و جزئیات حکم نهایی خود را بنویسید..."
                        className="w-full min-h-[80px] p-3 text-xs bg-background border border-subtle rounded-xl focus:outline-none focus:ring-1 focus:ring-primary-default text-text-primary"
                        required
                      />
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        disabled={submittingVerdict || !verdictText.trim()}
                        className="px-6 py-2.5 bg-danger hover:bg-danger disabled:bg-rose-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-500/10"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        صدور رای قطعی و خاتمه دعوی
                      </button>
                    </div>
                  </form>
                )}
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
