import { toast } from "./GlobalToast";
import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Plus,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Paperclip,
  X,
  ChevronLeft,
  User,
  ShieldCheck,
} from "lucide-react";

export function UserTicketing({ user }: { user: any }) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);

  // New ticket modal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [subject, setSubject] = useState("");
  const [department, setDepartment] = useState("GENERAL_MANAGER"); // GENERAL_MANAGER, SUPPORT, FINANCIAL, SHIPPING, DISPUTE
  const [message, setMessage] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reply state
  const [replyText, setReplyText] = useState("");
  const [replyAttachmentUrl, setReplyAttachmentUrl] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const fetchTickets = () => {
    setLoading(true);
    fetch("/api/tickets", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return [];
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setTickets(data);
        else setTickets([]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          subject,
          department,
          message,
          attachmentUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast("تیکت شما با موفقیت ثبت شد و به مدیریت ارشد ارسال گردید.", "success");
        setShowNewModal(false);
        setSubject("");
        setMessage("");
        setAttachmentUrl("");
        fetchTickets();
      } else {
        toast(data.error || "خطا در ثبت تیکت", "error");
      }
    } catch {
      toast("خطای شبکه", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/tickets/${selectedTicket.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          message: replyText,
          attachmentUrl: replyAttachmentUrl || null,
        }),
      });
      if (res.ok) {
        toast("پاسخ شما ارسال شد.", "success");
        setReplyText("");
        setReplyAttachmentUrl("");
        // Refresh ticket details
        const updatedRes = await fetch(`/api/tickets/${selectedTicket.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        const updatedData = await updatedRes.json();
        if (updatedData && updatedData.id) {
          setSelectedTicket(updatedData);
        }
        fetchTickets();
      } else {
        toast("خطا در ارسال پاسخ", "error");
      }
    } catch {
      toast("خطای شبکه", "error");
    } finally {
      setSubmittingReply(false);
    }
  };

  const getDepartmentLabel = (dep: string) => {
    switch (dep) {
      case "GENERAL_MANAGER":
        return "مدیرکل (مدیریت ارشد)";
      case "FINANCIAL":
        return "امور مالی و فاکتورها";
      case "SHIPPING":
        return "لجستیک و پست";
      case "DISPUTE":
        return "شکایات و اختلاف حساب";
      default:
        return "پشتیبانی عمومی";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-500/10 text-blue-600 border border-blue-500/20">باز / جدید</span>;
      case "IN_PROGRESS":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500/10 text-amber-600 border border-amber-500/20">در حال بررسی</span>;
      case "RESOLVED":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">پاسخ داده شده</span>;
      case "CLOSED":
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-gray-500/10 text-gray-600 border border-gray-500/20">بسته شده</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-gray-500/10 text-gray-600">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-4 lg:p-6" dir="rtl">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-indigo-500/20">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-indigo-400" />
            سیستم پشتیبانی و ارتباط مستقیم با مدیریت
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm font-medium mt-1">
            ارسال تیکت‌های پشتیبانی، پیگیری درخواست‌های مالی و پاسخگویی سریع مدیریت ارشد
          </p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> ثبت تیکت جدید
        </button>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="py-16 text-center bg-card rounded-3xl border border-border-subtle shadow-sm text-text-muted">
          <div className="w-8 h-8 border-4 border-primary-default border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm font-bold">در حال دریافت تیکت‌های شما...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="py-16 text-center bg-card rounded-3xl border border-border-subtle shadow-sm text-text-muted space-y-3">
          <MessageSquare className="w-12 h-12 mx-auto text-primary-default opacity-40" />
          <p className="text-base font-bold text-text-primary">شما هیچ تیکتی ثبت نکرده‌اید.</p>
          <button
            onClick={() => setShowNewModal(true)}
            className="px-5 py-2.5 bg-primary-default hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all"
          >
            ایجاد اولین تیکت پشتیبانی
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {tickets.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTicket(t)}
              className="p-5 bg-card hover:bg-surface border border-border-subtle hover:border-primary-default/40 rounded-3xl shadow-sm transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs text-primary-default">#{t.id}</span>
                  <h3 className="font-extrabold text-base text-text-primary">{t.subject}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted font-medium">
                  <span>بخش: {getDepartmentLabel(t.department)}</span>
                  <span>•</span>
                  <span>تاریخ: {new Date(t.createdAt).toLocaleDateString("fa-IR")}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                {getStatusBadge(t.status)}
                <button className="p-2 bg-surface hover:bg-border-subtle text-text-primary rounded-xl border border-border-subtle">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NEW TICKET MODAL */}
      {showNewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setShowNewModal(false)}
        >
          <div
            className="bg-card w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-border-subtle p-6 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-4">
              <h3 className="font-extrabold text-lg text-text-primary">ثبت تیکت پشتیبانی جدید</h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-2 text-text-muted hover:bg-surface rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">موضوع تیکت:</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="عنوان موضوع مورد نظر..."
                  className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-default/20 text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">دپارتمان مربوطه:</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-default/20 text-text-primary cursor-pointer"
                >
                  <option value="GENERAL_MANAGER">ارسال به مدیرکل (مدیریت ارشد) 👑</option>
                  <option value="SUPPORT">پشتیبانی عمومی</option>
                  <option value="FINANCIAL">امور مالی و فاکتورها</option>
                  <option value="SHIPPING">لجستیک و ارسال پستی</option>
                  <option value="DISPUTE">شکایت / اختلاف حساب</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">متن پیام:</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="شرح کامل مسئله یا سوال خود را بنویسید..."
                  className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-default/20 text-text-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1.5">فایل پیوست (اختیاری):</label>
                {attachmentUrl ? (
                  <div className="flex items-center justify-between bg-primary-default/10 p-2.5 rounded-xl text-xs text-primary-default border border-primary-default/20">
                    <span className="truncate max-w-[250px] font-medium">فایل ضمیمه انتخاب شده است</span>
                    <button
                      type="button"
                      onClick={() => setAttachmentUrl("")}
                      className="text-danger font-bold hover:underline text-xs"
                    >
                      حذف فایل
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-border-subtle hover:border-indigo-500 rounded-2xl cursor-pointer transition-colors bg-surface text-text-secondary text-center">
                    <Paperclip className="w-6 h-6 text-indigo-500 mb-2" />
                    <span className="text-xs font-bold">انتخاب فایل یا تصویر (حداکثر ۵ مگابایت)</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast("حجم فایل نباید بیش از ۵ مگابایت باشد.", "error");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setAttachmentUrl(reader.result as string);
                            toast("✅ فایل ضمیمه اضافه شد.", "success");
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {submitting ? "در حال ثبت تیکت..." : "ارسال تیکت به پشتیبانی"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TICKET CHAT / DETAIL MODAL */}
      {selectedTicket && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setSelectedTicket(null)}
        >
          <div
            className="bg-card w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-border-subtle p-6 text-right flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xs text-primary-default">#{selectedTicket.id}</span>
                  <h3 className="font-extrabold text-base text-text-primary">{selectedTicket.subject}</h3>
                </div>
                <p className="text-xs text-text-muted mt-0.5">
                  دپارتمان: {getDepartmentLabel(selectedTicket.department)}
                </p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-2 text-text-muted hover:bg-surface rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Thread */}
            <div className="flex-1 overflow-y-auto space-y-4 p-2 custom-scrollbar my-2">
              {/* First Message */}
              <div className="bg-surface p-4 rounded-2xl border border-border-subtle space-y-2">
                <div className="flex items-center justify-between text-xs text-text-muted font-bold">
                  <span className="text-text-primary flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-primary-default" /> پیام شما
                  </span>
                  <span>{new Date(selectedTicket.createdAt).toLocaleDateString("fa-IR")}</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedTicket.message || selectedTicket.content}
                </p>
                {selectedTicket.attachmentUrl && (
                  <div className="pt-2 border-t border-border-subtle/40 mt-2">
                    <span className="text-xs font-bold text-text-muted block mb-1">ضمیمه:</span>
                    {selectedTicket.attachmentUrl.startsWith("data:image/") ? (
                      <img src={selectedTicket.attachmentUrl} alt="ضمیمه" className="max-w-xs h-auto max-h-48 rounded-lg object-contain border border-border-subtle" referrerPolicy="no-referrer" />
                    ) : selectedTicket.attachmentUrl.startsWith("data:application/pdf") ? (
                      <a href={selectedTicket.attachmentUrl} download="document.pdf" className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">
                        📥 دانلود فایل PDF ضمیمه
                      </a>
                    ) : (
                      <a href={selectedTicket.attachmentUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">
                        📥 مشاهده فایل ضمیمه
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Replies */}
              {selectedTicket.replies && selectedTicket.replies.map((r: any) => (
                <div
                  key={r.id}
                  className={`p-4 rounded-2xl border space-y-2 ${
                    r.isAdmin
                      ? "bg-indigo-500/10 border-indigo-500/20 mr-4"
                      : "bg-surface border-border-subtle ml-4"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-text-muted font-bold">
                    <span className={`flex items-center gap-1 ${r.isAdmin ? "text-indigo-600 font-extrabold" : "text-text-primary"}`}>
                      {r.isAdmin ? <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> : <User className="w-3.5 h-3.5 text-primary-default" />}
                      {r.isAdmin ? "مدیریت ارشد" : "شما"}
                    </span>
                    <span>{new Date(r.createdAt || Date.now()).toLocaleDateString("fa-IR")}</span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap font-medium">
                    {r.message}
                  </p>
                  {r.attachmentUrl && (
                    <div className="pt-2">
                      <a
                        href={r.attachmentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background border border-subtle rounded-lg text-[11px] font-bold text-primary-default hover:underline"
                      >
                        <Paperclip className="w-3.5 h-3.5" /> فایل ضمیمه
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Reply Form */}
            <form onSubmit={handleSendReply} className="pt-4 border-t border-border-subtle space-y-3">
              {replyAttachmentUrl && (
                <div className="flex items-center justify-between bg-primary-default/10 p-2 rounded-xl text-xs text-primary-default border border-primary-default/20">
                  <span className="truncate max-w-[250px]">فایل ضمیمه انتخاب شده است</span>
                  <button
                    type="button"
                    onClick={() => setReplyAttachmentUrl("")}
                    className="text-danger font-bold hover:underline"
                  >
                    حذف
                  </button>
                </div>
              )}
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  required
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="پاسخ یا توضیحات تکمیلی خود را بنویسید..."
                  className="flex-1 px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-default/20 text-text-primary"
                />
                <label className="p-3 bg-surface border border-subtle rounded-xl text-muted hover:text-primary cursor-pointer transition-colors shrink-0">
                  <Paperclip className="w-4 h-4" />
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast("حجم فایل نباید بیش از ۵ مگابایت باشد.", "error");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setReplyAttachmentUrl(reader.result as string);
                          toast("✅ فایل ضمیمه اضافه شد.", "success");
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold transition-colors shrink-0 flex items-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>ارسال</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
