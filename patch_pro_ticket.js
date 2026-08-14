const fs = require('fs');
let code = fs.readFileSync('src/components/store-manager/StoreProAccount.tsx', 'utf8');

// Add states for the ticket modal
code = code.replace(/const \[termsAccepted, setTermsAccepted\] = useState\(false\);/, 
  `const [termsAccepted, setTermsAccepted] = useState(false);
  const [showProTicketModal, setShowProTicketModal] = useState(false);
  const [ticketSubject, setTicketSubject] = useState("ارسال مدارک برای اکانت پرو");
  const [ticketMsg, setTicketMsg] = useState("");
  const [ticketAttachment, setTicketAttachment] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);
  `);

// Add ticket submit function inside StoreProAccount
const submitFunction = `
  const handleSendProTicket = async () => {
    if (!ticketMsg) {
      if (showNotification) showNotification("متن پیام الزامی است.", "error");
      else toast("متن پیام الزامی است.", "error");
      return;
    }
    setSubmittingTicket(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: \`Bearer \${token}\`,
        },
        body: JSON.stringify({
          subject: ticketSubject,
          department: "اکانت پرو",
          priority: "HIGH",
          message: ticketMsg,
          attachmentUrl: ticketAttachment || null
        }),
      });
      if (res.ok) {
        if (showNotification) showNotification("مدارک با موفقیت به پشتیبانی اکانت پرو ارسال شد.", "success");
        else toast("مدارک با موفقیت به پشتیبانی اکانت پرو ارسال شد.", "success");
        setShowProTicketModal(false);
        setTicketMsg("");
        setTicketAttachment("");
      } else {
        const data = await res.json();
        if (showNotification) showNotification(data.error || "خطا در ارسال تیکت", "error");
        else toast(data.error || "خطا در ارسال تیکت", "error");
      }
    } catch (err) {
      if (showNotification) showNotification("خطای شبکه", "error");
      else toast("خطای شبکه", "error");
    } finally {
      setSubmittingTicket(false);
    }
  };
`;

code = code.replace(/const fetchProStatus = async \(\) => \{/, submitFunction + "\n  const fetchProStatus = async () => {");

// Change the button that triggers it
const supportOld = `onClick={() => onNavigateTab && onNavigateTab('tickets')}`;
const supportNew = `onClick={() => setShowProTicketModal(true)}`;
code = code.replace(supportOld, supportNew);

// Add the modal UI
const modalUI = `
      {/* Pro Ticket Modal */}
      {showProTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-border-subtle flex flex-col">
            <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface/50">
              <h3 className="font-black text-primary text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                ارسال مدارک اختصاصی پرو
              </h3>
              <button 
                onClick={() => setShowProTicketModal(false)}
                className="p-2 bg-background hover:bg-surface rounded-xl transition-colors text-muted hover:text-rose-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 text-sm text-secondary space-y-4 text-right" dir="rtl">
              <p className="text-xs text-muted mb-4">
                لطفا تصاویر کارت ملی، شناسنامه و شماره شبا خود را آپلود کرده و پیام خود را جهت بررسی سریع وارد نمایید. این تیکت با اولویت بالا و مستقیما به دپارتمان اکانت پرو ارسال خواهد شد.
              </p>
              
              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">موضوع ارسال</label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">توضیحات</label>
                <textarea
                  value={ticketMsg}
                  onChange={(e) => setTicketMsg(e.target.value)}
                  rows={4}
                  className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="مثال: مدارک برای درگاه پرداخت و اینماد پیوست شد..."
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted mb-1.5">لینک فایل پیوست (اختیاری)</label>
                <input
                  type="text"
                  value={ticketAttachment}
                  onChange={(e) => setTicketAttachment(e.target.value)}
                  className="w-full bg-background border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dir-ltr text-left"
                  placeholder="https://..."
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-border-subtle bg-surface/50 flex justify-end gap-3">
              <button
                onClick={() => setShowProTicketModal(false)}
                className="px-5 py-2.5 bg-background hover:bg-surface text-secondary font-bold rounded-xl text-xs transition-colors border border-border-subtle"
              >
                انصراف
              </button>
              <button
                onClick={handleSendProTicket}
                disabled={submittingTicket}
                className="px-6 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-black rounded-xl text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {submittingTicket ? "در حال ارسال..." : "ارسال مدارک"}
                <PenTool className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(/\{showTermsModal && \(/, modalUI + "\n      {showTermsModal && (");

fs.writeFileSync('src/components/store-manager/StoreProAccount.tsx', code);
