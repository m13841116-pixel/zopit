import React, { useState, useEffect } from "react";
import { useUrlQueryState } from "../../utils/routeSync";
import {
  MessageSquare,
  Send,
  Plus,
  Clock,
  User,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  Paperclip,
  Check,
  ChevronDown
} from "lucide-react";

export default function StoreTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab control: "general" or "returns"
  const [activeCategoryTab, setActiveCategoryTab] = useUrlQueryState<"general" | "returns">("cat", "general");
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReturnsModal, setShowReturnsModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  
  // General ticket states
  const [newSubject, setNewSubject] = useState("");
  const [newDept, setNewDept] = useState("مدیریت کل");
  const [newPriority, setNewPriority] = useState("MEDIUM");
  const [newMsg, setNewMsg] = useState("");
  
  // Returned item states
  const [paidOrders, setPaidOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [returnQuantity, setReturnQuantity] = useState<number>(1);
  const [returnReason, setReturnReason] = useState<string>("");
  const [returnFileBase64, setReturnFileBase64] = useState<string>("");
  const [uploadingReturnFile, setUploadingReturnFile] = useState(false);
  const [uploadReturnProgress, setUploadReturnProgress] = useState(0);

  // Conversation reply state
  const [replyMsg, setReplyMsg] = useState("");
  const [replyAttachmentUrl, setReplyAttachmentUrl] = useState("");
  const [newAttachmentUrl, setNewAttachmentUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const fetchTickets = () => {
    setLoading(true);
    fetch("/api/store-manager/tickets", { credentials: "include",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return [];
        return res.json();
      })
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

  const fetchPaidOrders = () => {
    setLoadingOrders(true);
    fetch("/api/store-manager/orders", { credentials: "include",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return [];
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          // Filter paid orders or show all platform/direct orders
          const paidOnly = data.filter((o: any) => {
            const statusLower = o.status?.toLowerCase();
            return statusLower === "paid" || 
                   statusLower === "processing" || 
                   statusLower === "shipped" || 
                   statusLower === "delivered" ||
                   statusLower === "preparing" ||
                   o.storeInvoiceId !== null;
          });
          setPaidOrders(paidOnly);
        } else {
          setPaidOrders([]);
        }
        setLoadingOrders(false);
      })
      .catch(() => setLoadingOrders(false));
  };

  useEffect(() => {
    fetchTickets();
    fetchPaidOrders();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      const updated = tickets.find((t) => t.id === selectedTicket.id);
      if (updated) {
        setSelectedTicket(updated);
      }
    }
  }, [tickets]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newMsg.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/store-manager/tickets", { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          subject: newSubject,
          department: newDept,
          priority: newPriority,
          message: newMsg,
          attachmentUrl: newAttachmentUrl || null
        }),
      });
      if (res.ok) {
        setNewSubject("");
        setNewMsg("");
        setNewAttachmentUrl("");
        setShowCreateModal(false);
        showNotification(
          "تیکت شما با موفقیت ثبت شد و به بخش مدیریت ارسال گردید.",
          "success",
        );
        fetchTickets();
      } else {
        showNotification("خطا در ایجاد تیکت جدید", "error");
      }
    } catch (err) {
      showNotification("خطای شبکه در ارتباط با سرور", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateReturnReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !selectedProduct || !returnQuantity || !returnReason.trim()) {
      showNotification("لطفاً تمامی فیلدهای الزامی را پر کنید.", "error");
      return;
    }
    setSubmitting(true);
    
    const prodName = selectedProduct.product?.title || selectedProduct.title || "کالای مشخص شده";
    const msgContent = `📦 گزارش کالای مرجوعی / مشکل‌دار
-----------------------------------------
کد سفارش: #${selectedOrderId}
نام محصول: ${prodName}
تعداد آسیب‌دیده/مرجوعی: ${returnQuantity} عدد

شرح مشکل:
${returnReason}

${returnFileBase64 ? `${returnFileBase64}` : ""}`;

    try {
      const res = await fetch("/api/store-manager/tickets", { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          subject: `[کالای مرجوعی] سفارش #${selectedOrderId} - ${prodName}`,
          department: "مرجوعی",
          priority: "HIGH",
          message: msgContent,
        }),
      });
      if (res.ok) {
        setSelectedOrderId("");
        setSelectedProduct(null);
        setReturnQuantity(1);
        setReturnReason("");
        setReturnFileBase64("");
        setShowReturnsModal(false);
        showNotification(
          "گزارش مرجوعی با موفقیت به همراه مدارک ثبت و برای مدیریت ارسال شد.",
          "success",
        );
        fetchTickets();
      } else {
        showNotification("خطا در ثبت گزارش مرجوعی", "error");
      }
    } catch (err) {
      showNotification("خطای ارتباط با سرور", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMsg.trim() || !selectedTicket) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/store-manager/tickets/${selectedTicket.id}/messages`, { credentials: "include",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({ message: replyMsg, attachmentUrl: replyAttachmentUrl || null }),
        },
      );
      if (res.ok) {
        setReplyMsg("");
        setReplyAttachmentUrl("");
        showNotification("پیام شما با موفقیت ارسال شد.", "success");
        fetchTickets();
      } else {
        showNotification("خطا در ارسال پیام", "error");
      }
    } catch (err) {
      showNotification("خطای شبکه در ارتباط با سرور", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Render text containing files or images inline nicely
  const renderMessageWithAttachments = (text: string) => {
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
          <div key={idx} className="mt-2 border border-subtle rounded-xl overflow-hidden bg-slate-50 max-w-sm text-primary">
            <img src={img} alt="ضمیمه" className="w-full h-auto max-h-60 object-contain" referrerPolicy="no-referrer" />
            <div className="p-2 bg-background border-t border-subtle text-center">
              <a href={img} download={`attachment_${idx}.png`} className="text-[10px] font-bold text-primary-default hover:underline">
                دانلود تصویر ضمیمه
              </a>
            </div>
          </div>
        ))}
        
        {pdfs.map((pdf, idx) => (
          <div key={idx} className="mt-2 p-3 border border-subtle rounded-xl bg-slate-50 flex items-center justify-between max-w-sm text-primary">
            <span className="text-xs font-medium text-secondary">فایل PDF ضمیمه شده #{idx + 1}</span>
            <a href={pdf} download={`document_${idx}.pdf`} className="text-xs font-bold text-primary-default hover:underline">
              دانلود PDF
            </a>
          </div>
        ))}
      </div>
    );
  };

  // Filter tickets based on selected tab
  const filteredTickets = tickets.filter((t) => {
    if (activeCategoryTab === "returns") {
      return t.department === "مرجوعی";
    } else {
      return t.department !== "مرجوعی";
    }
  });

  const selectedOrderObj = paidOrders.find((o) => String(o.id) === selectedOrderId);

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      
      {/* Notifications */}
      {notification && (
        <div
          className={`fixed top-4 left-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm flex items-center gap-2 animate-bounce ${notification.type === "success" ? "bg-success/10 border-emerald-100 text-emerald-800" : "bg-danger/10 border-rose-100 text-rose-800"}`}
        >
          {notification.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-success" />
          ) : (
            <AlertCircle className="w-5 h-5 text-danger" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary">
            پشتیبانی و گزارشات
          </h2>
          <p className="text-muted text-xs mt-1">
            ارتباط مستقیم با مدیریت کل، پشتیبانی مالی و فنی و ثبت کالا‌های مرجوعی
          </p>
        </div>
        {!selectedTicket && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                fetchPaidOrders();
                setShowReturnsModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <AlertCircle className="w-4 h-4" /> ثبت گزارش کالای مرجوعی / مشکل‌دار
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-success hover:bg-emerald-700 text-inverse rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-100 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> ثبت تیکت جدید
            </button>
          </div>
        )}
      </div>

      {!selectedTicket && (
        /* Tabs for Categories */
        <div className="flex border-b border-subtle gap-6 mb-2">
          <button
            onClick={() => setActiveCategoryTab("general")}
            className={`pb-3 text-sm font-bold transition-all cursor-pointer relative ${activeCategoryTab === "general" ? "text-primary-default border-b-2 border-primary-default font-extrabold" : "text-muted hover:text-muted"}`}
          >
            تیکت‌های عمومی و پشتیبانی ({tickets.filter((t) => t.department !== "مرجوعی").length})
          </button>
          <button
            onClick={() => setActiveCategoryTab("returns")}
            className={`pb-3 text-sm font-bold transition-all cursor-pointer relative ${activeCategoryTab === "returns" ? "text-rose-600 border-b-2 border-rose-600 font-extrabold" : "text-muted hover:text-muted"}`}
          >
            گزارشات مرجوعی و آسیب‌دیدگی ({tickets.filter((t) => t.department === "مرجوعی").length})
          </button>
        </div>
      )}

      {!selectedTicket ? (
        /* Tickets List View */ loading ? (
          <div className="text-center p-12 text-muted font-medium">
            در حال بارگذاری تیکت‌ها...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTickets.map((t) => (
              <div
                key={t.id}
                className={`bg-card p-5 rounded-2xl border ${t.department === "مرجوعی" ? "border-rose-100 bg-rose-50/20" : "border-subtle"} shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${t.status === "OPEN" ? "bg-danger/20 text-danger" : t.status === "ANSWERED" ? "bg-success/20 text-success" : "bg-surface text-secondary"}`}
                    >
                      {t.status === "OPEN"
                        ? "منتظر پاسخ"
                        : t.status === "ANSWERED"
                          ? "پاسخ داده شده"
                          : "بسته شده"}
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {t.subject}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.department === "مرجوعی" ? "bg-rose-100 text-rose-800" : "bg-surface text-muted"}`}>
                      {t.department}
                    </span>
                  </div>
                  <div className="text-xs text-muted flex gap-4 mt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-muted" /> تاریخ ارسال:
                      {new Date(t.createdAt).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTicket(t)}
                  className="flex items-center gap-1 px-4 py-2 bg-background text-secondary hover:bg-surface rounded-xl text-xs font-bold border border-subtle transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-muted" /> مشاهده گفتگو
                </button>
              </div>
            ))}
            {filteredTickets.length === 0 && (
              <div className="text-center py-16 bg-card rounded-2xl border border-dashed border-subtle text-muted font-medium">
                {activeCategoryTab === "returns" 
                  ? "هیچ گزارش مرجوعی ثبت نکرده‌اید. با کلیک بر روی دکمه قرمز، گزارش جدیدی ثبت کنید."
                  : "هیچ تیکت پشتیبانی عمومی ثبت نکرده‌اید."}
              </div>
            )}
          </div>
        )
      ) : (
        /* Active Conversation Chat View */ 
        <div className="bg-card rounded-2xl border border-subtle shadow-sm overflow-hidden flex flex-col min-h-[450px]">
          {/* Conversation Header */}
          <div className="px-6 py-4 bg-background border-b border-subtle flex justify-between items-center">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg text-muted hover:bg-surface transition-colors cursor-pointer ml-1"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
              <div>
                <h3 className="font-bold text-primary text-sm">
                  {selectedTicket.subject}
                </h3>
                <p className="text-[11px] text-muted mt-0.5">
                  تیکت شماره #{selectedTicket.id} | دپارتمان: {selectedTicket.department}
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${selectedTicket.status === "OPEN" ? "bg-danger/20 text-danger" : "bg-success/20 text-success"}`}
            >
              {selectedTicket.status === "OPEN"
                ? "منتظر پاسخ"
                : "پاسخ داده شده"}
            </span>
          </div>
          {/* Messages Thread list */}
          <div className="p-6 flex-1 space-y-4 max-h-[350px] overflow-y-auto bg-background/30">
            {selectedTicket.messages?.map((msg: any) => {
              let currentUserId = 0;
              try {
                const storedUser = localStorage.getItem("user");
                if (storedUser) currentUserId = parseInt(JSON.parse(storedUser)?.id || "0", 10);
              } catch {}
              const isMe = msg.userId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[80%] ${isMe ? "mr-auto items-start" : "ml-auto items-end"}`}
                >
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? "bg-success text-inverse rounded-tr-none" : "bg-card text-primary border border-subtle shadow-sm rounded-tl-none"}`}
                  >
                    {renderMessageWithAttachments(msg.message)}
                    {msg.attachmentUrl && (
                      <div className={`mt-2 pt-2 border-t ${isMe ? "border-white/20" : "border-border-subtle"}`}>
                        {msg.attachmentUrl.startsWith("data:image/") ? (
                          <img src={msg.attachmentUrl} alt="ضمیمه" className="max-w-xs h-auto max-h-48 rounded-lg object-contain border border-subtle" referrerPolicy="no-referrer" />
                        ) : msg.attachmentUrl.startsWith("data:application/pdf") ? (
                          <a href={msg.attachmentUrl} download="document.pdf" className={`text-xs font-bold underline flex items-center gap-1 ${isMe ? "text-white" : "text-success"}`}>
                            📥 دانلود فایل PDF ضمیمه
                          </a>
                        ) : (
                          <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className={`text-xs font-bold underline flex items-center gap-1 ${isMe ? "text-white" : "text-success"}`}>
                            📥 مشاهده فایل ضمیمه
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-muted mt-1 px-1 font-mono">
                    {new Date(msg.createdAt).toLocaleDateString("fa-IR")} ساعت{" "}
                    {new Date(msg.createdAt).toLocaleTimeString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Conversation Input area */}
          <div className="p-4 border-t border-subtle bg-card space-y-3">
            {replyAttachmentUrl && (
              <div className="flex items-center justify-between bg-success/10 p-2.5 rounded-xl text-xs text-success border border-success/20">
                <span className="truncate max-w-[250px] font-medium">فایل ضمیمه پاسخ انتخاب شد</span>
                <button
                  type="button"
                  onClick={() => setReplyAttachmentUrl("")}
                  className="text-danger font-bold hover:underline text-xs"
                >
                  حذف فایل
                </button>
              </div>
            )}
            <form onSubmit={handleSendReply} className="flex gap-2 items-end">
              <label className="p-3 bg-surface hover:bg-background border border-subtle rounded-xl text-muted hover:text-text-primary cursor-pointer transition-colors flex items-center justify-center shrink-0 h-10" title="ضمیمه فایل">
                <Paperclip className="w-5 h-5" />
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        showNotification("حجم فایل نباید بیش از ۵ مگابایت باشد.", "error");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setReplyAttachmentUrl(reader.result as string);
                        showNotification("✅ فایل ضمیمه پاسخ اضافه شد.", "success");
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
              <textarea
                value={replyMsg}
                onChange={(e) => setReplyMsg(e.target.value)}
                placeholder="پاسخ خود را اینجا بنویسید..."
                className="flex-1 min-h-[40px] p-2.5 text-sm bg-background border border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-success text-right resize-none"
                required
              />
              <button
                type="submit"
                disabled={submitting || !replyMsg.trim()}
                className="px-4 py-3 bg-success hover:bg-emerald-700 disabled:bg-surface text-inverse rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer h-10"
              >
                <Send className="w-4 h-4" /> ارسال پاسخ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-fade-in text-right max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-background border-b border-subtle flex justify-between items-center">
              <h3 className="font-bold text-primary text-sm">
                ثبت تیکت پشتیبانی جدید
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-xs text-muted hover:text-muted font-bold bg-card px-2 py-1 rounded border border-subtle transition-colors cursor-pointer"
              >
                انصراف
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted mb-1">
                  موضوع تیکت
                </label>
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="موضوع تیکت خود را وارد کنید"
                  className="w-full p-2.5 text-sm border border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-success text-right"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">
                    دپارتمان
                  </label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full p-2.5 text-sm border border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-success text-right"
                  >
                    <option value="مدیریت کل">مدیریت کل (ادمین اصلی)</option>
                    <option value="مالی">مالی و حسابداری</option>
                    <option value="فنی">پشتیبانی فنی</option>
                    <option value="فروش">فروش و بازاریابی</option>
                    <option value="عمومی">عمومی و پیشنهادات</option>
                    <option value="اکانت پرو">اکانت پرو (مدارک و فعال‌سازی)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">
                    اولویت
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full p-2.5 text-sm border border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-success text-right"
                  >
                    <option value="LOW">معمولی</option>
                    <option value="MEDIUM">متوسط</option>
                    <option value="HIGH">فوری / اضطراری</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-muted mb-1">
                  متن پیام پشتیبانی
                </label>
                <textarea
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  placeholder="مشکل یا سوال خود را به طور کامل شرح دهید..."
                  className="w-full p-2.5 text-sm border border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-success text-right min-h-[120px]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-muted mb-1">
                  فایل ضمیمه (اختیاری)
                </label>
                {newAttachmentUrl ? (
                  <div className="flex items-center justify-between bg-success/10 p-2.5 rounded-xl text-xs text-success border border-success/20">
                    <span className="truncate max-w-[250px] font-medium">فایل ضمیمه انتخاب شده است</span>
                    <button
                      type="button"
                      onClick={() => setNewAttachmentUrl("")}
                      className="text-danger font-bold hover:underline text-xs"
                    >
                      حذف فایل
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-subtle hover:border-success rounded-2xl cursor-pointer transition-colors bg-background text-secondary text-center">
                    <Paperclip className="w-6 h-6 text-success mb-2" />
                    <span className="text-xs font-bold">انتخاب فایل یا تصویر (حداکثر ۵ مگابایت)</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            showNotification("حجم فایل نباید بیش از ۵ مگابایت باشد.", "error");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewAttachmentUrl(reader.result as string);
                            showNotification("✅ فایل ضمیمه اضافه شد.", "success");
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-success hover:bg-emerald-700 disabled:bg-surface text-inverse rounded-xl text-sm font-bold flex justify-center items-center gap-1.5 transition-all cursor-pointer"
              >
                {submitting ? "در حال ثبت..." : "ثبت و ارسال تیکت"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Returns / Defective Items Modal */}
      {showReturnsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-fade-in text-right max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-background border-b border-subtle flex justify-between items-center">
              <h3 className="font-bold text-rose-600 text-sm flex items-center gap-1">
                <AlertCircle className="w-5 h-5 shrink-0" /> ثبت گزارش کالای مرجوعی یا مشکل‌دار
              </h3>
              <button
                onClick={() => setShowReturnsModal(false)}
                className="text-xs text-muted hover:text-muted font-bold bg-card px-2 py-1 rounded border border-subtle transition-colors cursor-pointer"
              >
                انصراف
              </button>
            </div>
            <form onSubmit={handleCreateReturnReport} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted mb-1">
                  انتخاب سفارش مربوطه <span className="text-red-500">*</span>
                </label>
                {loadingOrders ? (
                  <div className="text-xs text-muted py-2">در حال بارگذاری سفارشات...</div>
                ) : (
                  <select
                    value={selectedOrderId}
                    onChange={(e) => {
                      setSelectedOrderId(e.target.value);
                      setSelectedProduct(null);
                    }}
                    required
                    className="w-full p-2.5 text-sm border border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-right"
                  >
                    <option value="">-- یک سفارش را انتخاب کنید --</option>
                    {paidOrders.map((o) => (
                      <option key={o.id} value={o.id}>
                        سفارش #{o.id} - خریدار: {o.customerName || "نامشخص"} ({new Date(o.createdAt).toLocaleDateString("fa-IR")})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {selectedOrderId && selectedOrderObj && (
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">
                    انتخاب محصول مشکل‌دار <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedProduct ? JSON.stringify(selectedProduct) : ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        try {
                          setSelectedProduct(JSON.parse(e.target.value));
                        } catch {
                          setSelectedProduct(null);
                        }
                      } else {
                        setSelectedProduct(null);
                      }
                    }}
                    required
                    className="w-full p-2.5 text-sm border border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-right"
                  >
                    <option value="">-- محصول مورد نظر را انتخاب کنید --</option>
                    {selectedOrderObj.items?.map((item: any, idx: number) => (
                      <option key={idx} value={JSON.stringify(item)}>
                        {item.product?.title || item.title || "محصول بدون عنوان"} - تعداد خریداری شده: {item.quantity}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedProduct && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">
                      تعداد مرجوعی / آسیب‌دیده <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={selectedProduct.quantity || 1}
                      value={returnQuantity}
                      onChange={(e) => setReturnQuantity(parseInt(e.target.value) || 1)}
                      className="w-full p-2.5 text-sm border border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-right"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-muted mb-1">
                      شدت مشکل کالا
                    </label>
                    <span className="block p-2.5 text-sm bg-slate-50 border border-subtle rounded-xl text-center text-rose-700 font-bold">
                      فوری / نیازمند بررسی سریع
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-muted mb-1">
                  علت مرجوعی و شرح دقیق ایراد کالا <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="لطفاً علت دقیق مرجوعی (مثلاً: شکستگی قطعات، عدم تطابق سایز، خرابی موتور الکتریکی) را با جزئیات بنویسید..."
                  className="w-full p-2.5 text-sm border border-subtle rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 text-right min-h-[100px]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1">
                  بارگذاری عکس یا فایل مدرک آسیب‌دیدگی (اختیاری)
                </label>
                <div className="flex gap-2">
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.pdf"
                    id="return-file-upload-input"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setUploadingReturnFile(true);
                        setUploadReturnProgress(20);
                        const interval = setInterval(() => {
                          setUploadReturnProgress((prev) => {
                            if (prev >= 100) {
                              clearInterval(interval);
                              setUploadingReturnFile(false);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setReturnFileBase64(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                              return 100;
                            }
                            return prev + 40;
                          });
                        }, 80);
                      }
                    }}
                  />
                  <label
                    htmlFor="return-file-upload-input"
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer select-none transition-all"
                  >
                    <Paperclip className="w-4 h-4" /> 
                    {uploadingReturnFile ? `در حال بارگذاری (${uploadReturnProgress}%)` : returnFileBase64 ? "فایل بارگذاری شد ✓" : "آپلود تصویر / فیلم مدرک"}
                  </label>
                  {returnFileBase64 && (
                    <button
                      type="button"
                      onClick={() => setReturnFileBase64("")}
                      className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-bold"
                    >
                      حذف مدرک
                    </button>
                  )}
                </div>
                {returnFileBase64 && returnFileBase64.startsWith("data:image/") && (
                  <div className="mt-2 p-2 border border-subtle rounded-xl bg-slate-50 max-w-xs overflow-hidden">
                    <img src={returnFileBase64} alt="پیش‌نمایش مدرک" className="w-full h-auto max-h-32 object-contain rounded-lg" />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || uploadingReturnFile}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 disabled:bg-surface text-white rounded-xl text-sm font-bold flex justify-center items-center gap-1.5 transition-all cursor-pointer"
              >
                {submitting ? "در حال ثبت و ارسال..." : "ثبت و ارسال گزارش به مدیر کل"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
