import React, { useState, useEffect } from "react";
import { MessageSquare, Plus, X, Send, Paperclip, Gift, Sparkles, HelpCircle, FileText } from "lucide-react";
export function SupplierTickets({ showNotification, initialDepartment }: any) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  /* New ticket state */ const [subject, setSubject] = useState("");
  const [department, setDepartment] = useState(
    initialDepartment || "مدیرکل (مدیریت ارشد) 👑"
  );
  const [priority, setPriority] = useState("عادی");
  const [message, setMessage] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  /* Reply state */ const [reply, setReply] = useState("");
  const [replyAttachmentUrl, setReplyAttachmentUrl] = useState("");
  const fetchTickets = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/tickets", { credentials: "include",
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
    if (!subject || !message) {
      showNotification("لطفاً موضوع و متن پیام را وارد کنید", "error");
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/tickets", { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subject, department, priority, message, attachmentUrl }),
      });
      if (res.ok) {
        showNotification("تیکت با موفقیت ایجاد شد", "success");
        setShowNewTicket(false);
        setSubject("");
        setMessage("");
        setAttachmentUrl("");
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
    if (!reply || !selectedTicket) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(
        `/api/supplier/tickets/${selectedTicket.id}/messages`, { credentials: "include",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: reply, attachmentUrl: replyAttachmentUrl }),
        },
      );
      if (res.ok) {
        setReply("");
        setReplyAttachmentUrl("");
        /* Refresh selected ticket by refetching all and updating selected */ const updatedRes =
          await fetch("/api/supplier/tickets", { credentials: "include",
            headers: { Authorization: `Bearer ${token}` },
          });
        if (updatedRes.ok) {
          const updatedTickets = await updatedRes.json();
          setTickets(updatedTickets);
          const updatedSelected = updatedTickets.find(
            (t: any) => t.id === selectedTicket.id,
          );
          setSelectedTicket(updatedSelected);
        }
      } else {
        showNotification("خطا در ارسال پیام", "error");
      }
    } catch (err) {
      showNotification("خطا در ارتباط با سرور", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  if (selectedTicket) {
    return (
      <div className="bg-card rounded-2xl shadow-sm border border-subtle flex flex-col h-[calc(100vh-8rem)]">
        
        <div className="p-6 border-b border-subtle flex items-center justify-between">
          
          <div>
            
            <h3 className="font-bold text-primary text-lg">
              {selectedTicket.subject}
            </h3>
            <div className="flex gap-4 mt-2 text-sm text-muted">
              
              <span>بخش: {selectedTicket.department}</span>
              <span>
                وضعیت: {selectedTicket.status === "OPEN" ? "باز" : "بسته"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setSelectedTicket(null)}
            className="text-muted hover:text-muted bg-background hover:bg-surface p-2 rounded-xl transition-colors"
          >
            
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-background">
          
          {selectedTicket.messages.map((msg: any) => (
            <div
              key={msg.id}
              className={`flex ${msg.userId === selectedTicket.userId ? "justify-start" : "justify-end"}`}
            >
              
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${msg.userId === selectedTicket.userId ? "bg-primary-default text-inverse rounded-br-none" : "bg-card text-primary border border-subtle rounded-bl-none"}`}
              >
                
                <p className="text-sm whitespace-pre-wrap font-medium">
                  {msg.message}
                </p>
                {msg.attachmentUrl && (
                  <div className={`mt-2 pt-2 border-t ${msg.userId === selectedTicket.userId ? "border-white/20" : "border-border-subtle"}`}>
                    {msg.attachmentUrl.startsWith("data:image/") ? (
                      <img src={msg.attachmentUrl} alt="ضمیمه" className="max-w-xs h-auto max-h-48 rounded-lg object-contain border border-subtle" referrerPolicy="no-referrer" />
                    ) : msg.attachmentUrl.startsWith("data:application/pdf") ? (
                      <a href={msg.attachmentUrl} download="document.pdf" className={`text-xs font-bold underline flex items-center gap-1 ${msg.userId === selectedTicket.userId ? "text-white" : "text-primary-default"}`}>
                        📥 دانلود فایل PDF ضمیمه
                      </a>
                    ) : (
                      <a href={msg.attachmentUrl} target="_blank" rel="noreferrer" className={`text-xs font-bold underline flex items-center gap-1 ${msg.userId === selectedTicket.userId ? "text-white" : "text-primary-default"}`}>
                        📥 مشاهده فایل ضمیمه
                      </a>
                    )}
                  </div>
                )}
                <span
                  className={`text-[10px] mt-2 block ${msg.userId === selectedTicket.userId ? "text-indigo-200" : "text-muted"}`}
                >
                  
                  {new Date(msg.createdAt).toLocaleDateString("fa-IR")} -
                  {new Date(msg.createdAt).toLocaleTimeString("fa-IR")}
                </span>
              </div>
            </div>
          ))}
        </div>
        {selectedTicket.status === "OPEN" && (
          <div className="p-4 bg-card border-t border-subtle space-y-3">
            {replyAttachmentUrl && (
              <div className="flex items-center justify-between bg-primary-default/10 p-2.5 rounded-xl text-xs text-primary-default border border-primary-default/20">
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
            <form onSubmit={handleReply} className="flex gap-2 items-end">
              <label className="p-3 bg-surface hover:bg-background border border-subtle rounded-xl text-muted hover:text-text-primary cursor-pointer transition-colors flex items-center justify-center shrink-0 h-[46px]" title="ضمیمه فایل">
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
              <input
                type="text"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="پاسخ خود را بنویسید..."
                className="flex-1 px-4 py-3 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none text-sm h-[46px]"
              />
              <button
                type="submit"
                disabled={isSubmitting || !reply}
                className="bg-primary-default text-inverse px-6 rounded-xl hover:bg-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center h-[46px]"
              >
                
                <Send className="w-5 h-5 rtl:-scale-x-100" />
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      
      <div className="flex justify-between items-center bg-card p-4 rounded-2xl shadow-sm border border-subtle">
        
        <h2 className="text-lg font-bold text-primary flex items-center gap-2">
          
          <MessageSquare className="w-5 h-5 text-primary-default" /> تیکت‌های
          پشتیبانی
        </h2>
        <button
          onClick={() => {
            setDepartment("مدیرکل (مدیریت ارشد) 👑");
            setSubject("");
            setMessage("");
            setShowNewTicket(true);
          }}
          className="bg-primary-default text-inverse px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
        >
          
          <Plus className="w-4 h-4" /> تیکت جدید
        </button>
      </div>
      <div className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden">
        
        {loading ? (
          <div className="p-12 flex justify-center">
            
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-default"></div>
          </div>
        ) : tickets.length > 0 ? (
          <div className="divide-y divide-slate-100">
            
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="p-4 hover:bg-background transition-colors cursor-pointer flex items-center justify-between"
              >
                
                <div>
                  
                  <h4 className="font-bold text-primary text-sm mb-1">
                    {ticket.subject}
                  </h4>
                  <div className="flex gap-4 text-xs text-muted">
                    
                    <span>شماره: #{ticket.id}</span>
                    <span>بخش: {ticket.department}</span>
                    <span>
                      {new Date(ticket.createdAt).toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ticket.status === "OPEN" ? "bg-success/20 text-success" : "bg-surface text-secondary"}`}
                  >
                    
                    {ticket.status === "OPEN" ? "باز" : "بسته"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            
            <MessageSquare className="w-12 h-12 text-inverse mx-auto mb-4" />
            <p className="text-muted font-medium">هیچ تیکتی یافت نشد</p>
          </div>
        )}
      </div>
      {showNewTicket && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          
          <div className="bg-card rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-fade-in">
            
            <div className="p-5 border-b border-subtle flex justify-between items-center">
              
              <h3 className="font-bold text-lg text-primary">
                ایجاد تیکت جدید
              </h3>
              <button
                onClick={() => setShowNewTicket(false)}
                className="text-muted hover:text-muted bg-surface hover:bg-surface p-2 rounded-full transition-colors"
              >
                
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              
              <div>
                
                <label className="block text-sm font-semibold text-secondary mb-1.5">
                  موضوع
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                
                <div>
                  
                  <label className="block text-sm font-semibold text-secondary mb-1.5">
                    بخش
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none cursor-pointer"
                  >
                    <option value="🎁 ثبت رایگان محصولات توسط زوپیت (ارسال لیست قیمت / کاتالوگ)">
                      🎁 ثبت رایگان محصولات توسط زوپیت (ارسال لیست قیمت / کاتالوگ)
                    </option>
                    <option value="مدیرکل (مدیریت ارشد) 👑">مدیرکل (مدیریت ارشد) 👑</option>
                    <option value="پشتیبانی فنی">پشتیبانی فنی</option>
                    <option value="امور مالی">امور مالی</option>
                    <option value="پیشنهادات و انتقادات">پیشنهادات و انتقادات</option>
                  </select>
                </div>
                <div>
                  
                  <label className="block text-sm font-semibold text-secondary mb-1.5">
                    اولویت
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none"
                  >
                    
                    <option>عادی</option> <option>مهم</option>
                    <option>فوری</option>
                  </select>
                </div>
              </div>

              {department.includes("ثبت رایگان محصولات") && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5 leading-relaxed animate-fade-in">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-black mb-0.5">ثبت ۱۰۰٪ رایگان توسط کارشناسان زوپیت:</strong>
                    فایل عکس لیست قیمت، پی‌دی‌اف، اکسل یا آدرس کانال تلگرام/ایتای خود را در بخش زیر ضمیمه یا در متن پیام وارد کنید. کارشناسان ما تمامی اقلام و قیمت‌ها را برای شما وارد پنل خواهند کرد.
                  </div>
                </div>
              )}
              <div>
                
                <label className="block text-sm font-semibold text-secondary mb-1.5">
                  متن پیام
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none resize-none mb-4"
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-semibold text-secondary mb-1.5">
                  فایل ضمیمه (اختیاری)
                </label>
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
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-subtle hover:border-indigo-500 rounded-2xl cursor-pointer transition-colors bg-background text-secondary text-center">
                    <Paperclip className="w-6 h-6 text-indigo-500 mb-2" />
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
                            setAttachmentUrl(reader.result as string);
                            showNotification("✅ فایل ضمیمه اضافه شد.", "success");
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>
              <div className="pt-4 flex gap-3">
                
                <button
                  type="button"
                  onClick={() => setShowNewTicket(false)}
                  className="flex-1 px-4 py-3 bg-surface text-secondary rounded-xl font-medium hover:bg-surface transition-colors"
                >
                  
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-primary-default text-inverse rounded-xl font-medium hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  
                  {isSubmitting ? "در حال ارسال..." : "ارسال تیکت"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
