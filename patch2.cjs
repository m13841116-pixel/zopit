const fs = require('fs');
let code = fs.readFileSync('src/components/store-manager/StoreOrders.tsx', 'utf8');
const search = `              <button
                onClick={() => printOrderInvoice(selectedOrderForDetails)}
                className="flex-1 py-3 bg-primary-default/10 hover:bg-primary-default/20 text-primary-hover border border-primary-default/30 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-5 h-5" /> دریافت فاکتور رسمی (PDF)
              </button>`;
const replace = `              <button
                onClick={() => printOrderInvoice(selectedOrderForDetails)}
                className="flex-1 py-3 bg-primary-default/10 hover:bg-primary-default/20 text-primary-hover border border-primary-default/30 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-5 h-5" /> دریافت فاکتور رسمی (PDF)
              </button>
              <button
                onClick={() => setShowReportIssue(true)}
                className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <AlertTriangle className="w-5 h-5" /> ثبت مشکل / پیگیری
              </button>`;
code = code.replace(search, replace);

const modalSearch = `            {!["PAID", "PROCESSING", "PREPARING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED", "REJECTED"].includes(selectedOrderForDetails.status) &&
             (selectedOrderForDetails.storeInvoiceId === null || selectedOrderForDetails.storeInvoice?.status === "PENDING") && (`;
             
const modalReplace = `            {showReportIssue && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setShowReportIssue(false)}>
                <div className="bg-card w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-border-subtle p-6 text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-4">
                    <h3 className="font-extrabold text-lg text-rose-600 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> گزارش مشکل در سفارش #{selectedOrderForDetails.id}
                    </h3>
                    <button onClick={() => setShowReportIssue(false)} className="p-2 text-text-muted hover:bg-surface rounded-full"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="space-y-4">
                    <p className="text-sm text-text-muted">لطفاً مشکل پیش آمده در این سفارش را شرح دهید. تیم پشتیبانی در اسرع وقت به آن رسیدگی خواهد کرد.</p>
                    <textarea
                      value={issueText}
                      onChange={(e) => setIssueText(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-text-primary resize-none"
                      placeholder="توضیحات مشکل..."
                    />
                    <div className="flex gap-3 pt-2">
                      <button onClick={() => setShowReportIssue(false)} className="flex-1 py-3 bg-surface hover:bg-surface-hover text-text-primary rounded-xl text-sm font-bold transition-all">انصراف</button>
                      <button onClick={handleReportIssue} disabled={submittingIssue} className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-50 flex justify-center items-center">
                        {submittingIssue ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ثبت مشکل'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!["PAID", "PROCESSING", "PREPARING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED", "REJECTED"].includes(selectedOrderForDetails.status) &&
             (selectedOrderForDetails.storeInvoiceId === null || selectedOrderForDetails.storeInvoice?.status === "PENDING") && (`;
             
code = code.replace(modalSearch, modalReplace);
fs.writeFileSync('src/components/store-manager/StoreOrders.tsx', code);
