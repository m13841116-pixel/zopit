import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Plus, 
  X, 
  Send, 
  Paperclip, 
  Gift, 
  Sparkles, 
  Trash2,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  Globe
} from "lucide-react";

export const FREE_PRODUCT_REGISTRATION_DEPT = "🎁 ثبت رایگان محصولات توسط زوپیت (ارسال لیست قیمت / کاتالوگ)";

export function SupplierTickets({ showNotification, initialDepartment }: any) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* New ticket state */
  const [subject, setSubject] = useState("");
  const [department, setDepartment] = useState(
    initialDepartment || FREE_PRODUCT_REGISTRATION_DEPT
  );
  const [priority, setPriority] = useState("عادی");
  const [message, setMessage] = useState("");
  const [channelLink, setChannelLink] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");

  /* Reply state */
  const [reply, setReply] = useState("");
  const [replyAttachmentUrl, setReplyAttachmentUrl] = useState("");
  const [replyAttachmentName, setReplyAttachmentName] = useState("");

  // Keep department in sync if initialDepartment prop changes
  useEffect(() => {
    if (initialDepartment) {
      setDepartment(initialDepartment);
      if (!subject) {
        setSubject("درخواست ثبت رایگان محصولات توسط کارشناس زوپیت");
      }
      setShowNewTicket(true);
    }
  }, [initialDepartment]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/tickets", {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setTickets(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      showNotification("لطفاً موضوع تیکت را وارد کنید", "error");
      return;
    }

    let finalMessage = message.trim();
    if (channelLink.trim()) {
      finalMessage = finalMessage 
        ? `${finalMessage}\n\n🔗 لینک کانال تلگرام / ایتا: ${channelLink.trim()}`
        : `🔗 لینک کانال تلگرام / ایتا: ${channelLink.trim()}\nلطفاً محصولات را از این کانال در پنل ثبت نمایید.`;
    }

    if (!finalMessage && !attachmentUrl) {
      showNotification("لطفاً متن پیام، لینک کانال یا فایل کاتالوگ را وارد کنید", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/tickets", {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: subject.trim(),
          department,
          priority,
          message: finalMessage || "ارسال فایل کاتالوگ جهت ثبت در سیستم",
          attachmentUrl,
        }),
      });

      if (res.ok) {
        showNotification("✅ تیکت شما با موفقیت ثبت شد و در صف بررسی قرار گرفت.", "success");
        setShowNewTicket(false);
        setSubject("");
        setMessage("");
        setChannelLink("");
        setAttachmentUrl("");
        setAttachmentName("");
        fetchTickets();
      } else {
        showNotification("خطا در ایجاد تیکت", "error");
      }
    } catch (err) {
      showNotification("خطا در ارتباط با سرور", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selectedTicket) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(
        `/api/supplier/tickets/${selectedTicket.id}/messages`,
        {
          credentials: "include",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            message: reply.trim(), 
            attachmentUrl: replyAttachmentUrl 
          }),
        }
      );
      if (res.ok) {
        setReply("");
        setReplyAttachmentUrl("");
        setReplyAttachmentName("");
        const updatedRes = await fetch("/api/supplier/tickets", {
          credentials: "include",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (updatedRes.ok) {
          const updatedTickets = await updatedRes.json();
          setTickets(updatedTickets);
          const updatedSelected = updatedTickets.find(
            (t: any) => t.id === selectedTicket.id
          );
          setSelectedTicket(updatedSelected);
        }
        showNotification("پاسخ شما با موفقیت ارسال شد.", "success");
      } else {
        showNotification("خطا در ارسال پیام", "error");
      }
    } catch (err) {
      showNotification("خطا در ارتباط با سرور", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Ticket Details View
  if (selectedTicket) {
    return (
      <div className="bg-card rounded-2xl shadow-sm border border-subtle flex flex-col h-[calc(100vh-10rem)] min-h-[500px] overflow-hidden">
        {/* Detail Header */}
        <div className="p-4 sm:p-5 border-b border-subtle flex items-center justify-between bg-surface shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-muted bg-background px-2 py-0.5 rounded-lg border border-subtle">
                #{selectedTicket.id}
              </span>
              <h3 className="font-bold text-primary text-base sm:text-lg">
                {selectedTicket.subject}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted">
              <span className="bg-background px-2.5 py-1 rounded-lg border border-subtle font-medium text-text-primary">
                بخش: {selectedTicket.department}
              </span>
              <span
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  selectedTicket.status === "OPEN"
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-surface text-muted border border-subtle"
                }`}
              >
                وضعیت: {selectedTicket.status === "OPEN" ? "در حال بررسی" : "بسته شده"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedTicket(null)}
            className="text-muted hover:text-text-primary bg-background hover:bg-surface p-2 rounded-xl border border-subtle transition-colors cursor-pointer"
            title="بازگشت به لیست"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-background/50">
          {selectedTicket.messages.map((msg: any) => {
            const isMe = msg.userId === selectedTicket.userId;
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-start" : "justify-end"}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-xs ${
                    isMe
                      ? "bg-primary-default text-inverse rounded-br-none"
                      : "bg-card text-primary border border-subtle rounded-bl-none"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap font-medium leading-relaxed">
                    {msg.message}
                  </p>
                  {msg.attachmentUrl && (
                    <div
                      className={`mt-3 pt-2.5 border-t ${
                        isMe ? "border-white/20" : "border-subtle"
                      }`}
                    >
                      {msg.attachmentUrl.startsWith("data:image/") ? (
                        <img
                          src={msg.attachmentUrl}
                          alt="ضمیمه"
                          className="max-w-xs h-auto max-h-48 rounded-xl object-contain border border-subtle bg-black/5"
                          referrerPolicy="no-referrer"
                        />
                      ) : msg.attachmentUrl.startsWith("data:application/pdf") ? (
                        <a
                          href={msg.attachmentUrl}
                          download="document.pdf"
                          className={`text-xs font-bold underline flex items-center gap-1.5 ${
                            isMe ? "text-white" : "text-primary-default"
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                          <span>دانلود فایل PDF کاتالوگ / لیست</span>
                        </a>
                      ) : (
                        <a
                          href={msg.attachmentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={`text-xs font-bold underline flex items-center gap-1.5 ${
                            isMe ? "text-white" : "text-primary-default"
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                          <span>مشاهده / دانلود فایل ضمیمه</span>
                        </a>
                      )}
                    </div>
                  )}
                  <span
                    className={`text-[10px] mt-2 block font-mono ${
                      isMe ? "text-indigo-200" : "text-muted"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleDateString("fa-IR")} -{" "}
                    {new Date(msg.createdAt).toLocaleTimeString("fa-IR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply Box */}
        {selectedTicket.status === "OPEN" && (
          <div className="p-3 sm:p-4 bg-card border-t border-subtle space-y-2.5 shrink-0">
            {replyAttachmentUrl && (
              <div className="flex items-center justify-between bg-primary-default/10 p-2.5 rounded-xl text-xs text-primary-default border border-primary-default/20">
                <span className="truncate max-w-[250px] font-medium">
                  📎 فایل پیوست: {replyAttachmentName || "انتخاب شده"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setReplyAttachmentUrl("");
                    setReplyAttachmentName("");
                  }}
                  className="text-danger font-bold hover:underline text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف</span>
                </button>
              </div>
            )}
            <form onSubmit={handleReply} className="flex gap-2 items-center">
              <label
                className="p-3 bg-surface hover:bg-background border border-subtle rounded-xl text-muted hover:text-text-primary cursor-pointer transition-colors flex items-center justify-center shrink-0 h-[46px]"
                title="ضمیمه فایل"
              >
                <Paperclip className="w-5 h-5" />
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 8 * 1024 * 1024) {
                        showNotification("حجم فایل نباید بیش از ۸ مگابایت باشد.", "error");
                        return;
                      }
                      setReplyAttachmentName(file.name);
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
              <input
                type="text"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="پاسخ خود را بنویسید..."
                className="flex-1 px-4 py-3 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none text-sm h-[46px]"
              />
              <button
                type="submit"
                disabled={isSubmitting || !reply.trim()}
                className="bg-primary-default text-inverse px-5 rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center h-[46px] cursor-pointer"
              >
                <Send className="w-5 h-5 rtl:-scale-x-100" />
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // Tickets List View
  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-2xl shadow-sm border border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-primary">
              تیکت‌ها و پشتیبانی تامین‌کنندگان
            </h2>
            <p className="text-xs text-muted">
              ارتباط مستقیم با کارشناسان ورود کالا، پشتیبانی فنی و مدیریت زوپیت
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setDepartment(FREE_PRODUCT_REGISTRATION_DEPT);
            setSubject("");
            setMessage("");
            setChannelLink("");
            setAttachmentUrl("");
            setAttachmentName("");
            setShowNewTicket(true);
          }}
          className="bg-primary-default text-inverse px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-hover transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>ثبت تیکت جدید</span>
        </button>
      </div>

      {/* Tickets List */}
      <div className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-default"></div>
            <span className="text-xs text-muted">در حال بارگذاری تیکت‌ها...</span>
          </div>
        ) : tickets.length > 0 ? (
          <div className="divide-y divide-subtle">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="p-4 sm:p-5 hover:bg-surface/60 transition-colors cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-muted bg-background px-2 py-0.5 rounded-md border border-subtle">
                      #{ticket.id}
                    </span>
                    <h4 className="font-bold text-primary text-sm sm:text-base truncate">
                      {ticket.subject}
                    </h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                    <span className="text-text-secondary">بخش: {ticket.department}</span>
                    <span>•</span>
                    <span className="font-mono">
                      {new Date(ticket.createdAt).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      ticket.status === "OPEN"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-surface text-muted border border-subtle"
                    }`}
                  >
                    {ticket.status === "OPEN" ? "در حال پیگیری" : "بسته شده"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mx-auto text-muted border border-subtle">
              <MessageSquare className="w-8 h-8 opacity-50" />
            </div>
            <p className="text-sm text-text-primary font-bold">هنوز هیچ تیکتی ثبت نکرده‌اید</p>
            <p className="text-xs text-muted max-w-sm mx-auto">
              اگر فایل لیست قیمت، اکسل یا آدرس کانال تلگرام دارید، همین حالا تیکت ارسال کنید تا کارشناسان ما محصولات شما را به صورت رایگان ثبت کنند.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setDepartment(FREE_PRODUCT_REGISTRATION_DEPT);
                  setSubject("درخواست ثبت رایگان محصولات توسط کارشناس");
                  setShowNewTicket(true);
                }}
                className="px-4 py-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-xl text-xs font-bold hover:bg-rose-500/20 transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                <Gift className="w-4 h-4 text-rose-500" />
                <span>ثبت درخواست ورود رایگان محصولات</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* NEW TICKET MODAL - Completely Optimized & Scrollable */}
      {showNewTicket && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewTicket(false);
          }}
        >
          <div className="bg-card text-text-primary rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-subtle my-auto animate-fade-in">
            {/* Header (Always Visible) */}
            <div className="p-4 sm:p-5 border-b border-subtle flex justify-between items-center bg-surface shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary-default/10 flex items-center justify-center text-primary-default border border-primary-default/20 shrink-0">
                  <Gift className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-primary">
                    ایجاد تیکت جدید پشتیبانی
                  </h3>
                  <p className="text-[11px] text-muted">
                    ارسال کاتالوگ یا طرح سوال با پاسخگویی کمتر از ۲۴ ساعت
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowNewTicket(false)}
                className="text-muted hover:text-text-primary bg-background hover:bg-surface p-2 rounded-xl border border-subtle transition-colors cursor-pointer shrink-0"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              id="new-ticket-modal-form"
              onSubmit={handleCreateTicket}
              className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain"
            >
              {/* Subject */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-secondary mb-1.5">
                  موضوع تیکت <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: ثبت لیست قیمت محصولات جدید در پنل"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none text-sm"
                />
              </div>

              {/* Department & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-secondary mb-1.5">
                    دپارتمان مربوطه <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none text-xs sm:text-sm font-medium cursor-pointer"
                  >
                    <option value={FREE_PRODUCT_REGISTRATION_DEPT}>
                      {FREE_PRODUCT_REGISTRATION_DEPT}
                    </option>
                    <option value="مدیرکل (مدیریت ارشد) 👑">
                      مدیرکل (مدیریت ارشد) 👑
                    </option>
                    <option value="پشتیبانی فنی">پشتیبانی فنی</option>
                    <option value="امور مالی و تسویه‌حساب">امور مالی و تسویه‌حساب</option>
                    <option value="پیشنهادات و انتقادات">پیشنهادات و انتقادات</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-secondary mb-1.5">
                    اولویت
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none text-xs sm:text-sm cursor-pointer"
                  >
                    <option value="عادی">عادی</option>
                    <option value="مهم">مهم</option>
                    <option value="فوری">فوری (VIP)</option>
                  </select>
                </div>
              </div>

              {/* VIP Banner when Free Product Registration is Selected */}
              {department.includes("ثبت رایگان محصولات") && (
                <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>خدمت ویژه: ثبت محصولات شما توسط کارشناسان زوپیت (بدون کارمزد)</span>
                  </div>
                  <p className="text-muted leading-relaxed text-[11px]">
                    اگر زمان کافی برای تایپ مشخصات کالاها ندارید، کافیست لینک کانال، عکس لیست قیمت یا کاتالوگ PDF خود را ارسال کنید تا کارشناسان ما ظرف ۲۴ ساعت تمام اقلام را در پنل ثبت نمایند.
                  </p>

                  {/* Channel Link Quick Input */}
                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-text-primary mb-1">
                      🔗 لینک کانال تلگرام یا ایتا (اختیاری):
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        dir="ltr"
                        placeholder="https://t.me/your_channel یا @channel_id"
                        value={channelLink}
                        onChange={(e) => setChannelLink(e.target.value)}
                        className="w-full pl-3 pr-8 py-2 text-xs bg-background border border-subtle rounded-xl outline-none focus:ring-2 focus:ring-amber-500 font-mono text-left"
                      />
                      <Globe className="w-4 h-4 text-muted absolute right-2.5 top-2.5" />
                    </div>
                  </div>
                </div>
              )}

              {/* Message */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-secondary mb-1.5">
                  متن پیام یا توضیحات تکمیلی
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="توضیحات خود، نحوه قیمت‌گذاری، تخفیف همکاری یا راه ارتباطی را بنویسید..."
                  className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none resize-none text-xs sm:text-sm leading-relaxed"
                ></textarea>
              </div>

              {/* File Attachment */}
              <div>
                <label className="block text-xs sm:text-sm font-bold text-secondary mb-1.5">
                  فایل کاتالوگ، لیست قیمت، اکسل یا تصویر (اختیاری)
                </label>

                {attachmentUrl ? (
                  <div className="flex items-center justify-between bg-primary-default/10 p-3 rounded-2xl text-xs text-primary-default border border-primary-default/20">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-primary-default shrink-0" />
                      <span className="truncate font-bold">
                        {attachmentName || "فایل ضمیمه انتخاب شده است"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachmentUrl("");
                        setAttachmentName("");
                      }}
                      className="text-rose-600 dark:text-rose-400 font-bold hover:underline text-xs flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-subtle hover:border-indigo-500 rounded-2xl cursor-pointer transition-colors bg-surface/50 text-secondary text-center group">
                    <Upload className="w-6 h-6 text-indigo-500 group-hover:scale-110 transition-transform mb-1.5" />
                    <span className="text-xs font-bold text-text-primary">
                      کلیک کنید یا فایل را اینجا رها کنید
                    </span>
                    <span className="text-[11px] text-muted mt-0.5">
                      فرمت‌های مجاز: عکس (JPG, PNG)، فایل اکسل (Excel)، PDF (حداکثر ۸ مگابایت)
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf,.xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 8 * 1024 * 1024) {
                            showNotification("حجم فایل نباید بیش از ۸ مگابایت باشد.", "error");
                            return;
                          }
                          setAttachmentName(file.name);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setAttachmentUrl(reader.result as string);
                            showNotification("✅ فایل ضمیمه با موفقیت انتخاب شد.", "success");
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </form>

            {/* Sticky Footer (Always Visible) */}
            <div className="p-4 sm:p-5 border-t border-subtle flex gap-3 bg-surface shrink-0">
              <button
                type="button"
                onClick={() => setShowNewTicket(false)}
                className="flex-1 px-4 py-2.5 bg-background border border-subtle text-secondary rounded-xl font-medium hover:bg-surface transition-colors cursor-pointer text-xs sm:text-sm"
              >
                انصراف
              </button>
              <button
                type="submit"
                form="new-ticket-modal-form"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 bg-primary-default text-inverse rounded-xl font-bold hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer text-xs sm:text-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>در حال ارسال...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 rtl:-scale-x-100" />
                    <span>ارسال تیکت به کارشناس</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
