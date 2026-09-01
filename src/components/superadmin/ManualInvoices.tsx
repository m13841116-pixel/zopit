import React, { useState, useEffect } from "react";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Search,
  FileText,
  AlertTriangle,
  Check,
  X,
  Eye,
} from "lucide-react";
export default function ManualInvoices() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  // Custom IFrame-safe confirmation modal states
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    invoiceId: number | null;
    action: "approve" | "reject" | null;
  }>({ open: false, invoiceId: null, action: null });
  /* Custom toast notifications */ const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | null;
  }>({ message: "", type: null });
  useEffect(() => {
    fetchInvoices();
  }, []);
  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/admin/manual-invoices", { credentials: "include",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        setInvoices(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: "", type: null });
    }, 4000);
  };
  const triggerAction = (invoiceId: number, action: "approve" | "reject") => {
    setConfirmModal({ open: true, invoiceId, action });
  };
  const executeAction = async () => {
    const { invoiceId, action } = confirmModal;
    if (!invoiceId || !action) return;
    setConfirmModal({ open: false, invoiceId: null, action: null });
    try {
      const res = await fetch(
        `/api/admin/manual-invoices/${invoiceId}/${action}`, { credentials: "include",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
          },
        },
      );
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || "عملیات با موفقیت انجام شد", "success");
        fetchInvoices();
      } else {
        showToast(data.error || "خطا در انجام عملیات", "error");
      }
    } catch (err) {
      showToast("خطا در برقراری ارتباط با سرور", "error");
    }
  };
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        
        <Loader2 className="w-8 h-8 text-muted animate-spin" />
      </div>
    );
  }
  return (
    <div className="space-y-6 relative">
      
      {/* Custom Toast Notification */}
      {toast.type && (
        <div
          className={`fixed bottom-6 left-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-xl border animate-in fade-in slide-in-from-bottom-5 duration-300 ${toast.type === "success" ? "bg-success/10 text-emerald-900 border-emerald-200" : "bg-danger/10 text-rose-900 border-rose-200"}`}
        >
          
          {toast.type === "success" ? (
            <div className="w-6 h-6 bg-success text-inverse rounded-full flex items-center justify-center shrink-0">
              
              <Check className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-6 h-6 bg-danger text-inverse rounded-full flex items-center justify-center shrink-0">
              
              <X className="w-4 h-4" />
            </div>
          )}
          <span className="font-bold text-sm">{toast.message}</span>
        </div>
      )}
      <div className="flex justify-between items-center bg-card p-5 rounded-2xl shadow-sm border border-subtle">
        
        <div>
          
          <h2 className="text-xl font-bold text-primary">
            تایید فیش‌های واریزی
          </h2>
          <p className="text-sm text-muted mt-1">
            مدیریت فاکتورهای پرداخت شده به روش کارت به کارت
          </p>
        </div>
      </div>
      <div className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden">
        
        {invoices.length === 0 ? (
          <div className="p-8 text-center text-muted">
            
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>هیچ فاکتور دستی ثبت نشده است.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            
            <table className="w-full text-right text-sm min-w-[800px]">
              
              <thead className="bg-background border-b border-subtle text-muted font-medium">
                
                <tr>
                  
                  <th className="px-6 py-4">شماره فاکتور</th>
                  <th className="px-6 py-4">مدیر فروشگاه</th>
                  <th className="px-6 py-4">مبلغ کل (تومان)</th>
                  <th className="px-6 py-4">وضعیت فاکتور</th>
                  <th className="px-6 py-4">وضعیت فیش</th>
                  <th className="px-6 py-4">تاریخ ثبت</th>
                  <th className="px-6 py-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-background transition-colors"
                  >
                    
                    <td className="px-6 py-4 font-mono font-bold text-secondary">
                      INV-{invoice.id}
                    </td>
                    <td className="px-6 py-4">
                      
                      <div className="font-bold text-primary">
                        {invoice.storeManager?.storeName}
                      </div>
                      <span className="text-xs text-muted">
                        {invoice.storeManager?.firstName}
                        {invoice.storeManager?.lastName}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-primary">
                      {invoice.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-black border ${
                          invoice.status === "PAID"
                            ? "bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-100"
                            : invoice.status === "FAILED"
                              ? "bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950 dark:text-rose-100"
                              : "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-100"
                        }`}
                      >
                        {invoice.status === "PAID"
                          ? "پرداخت شده"
                          : invoice.status === "FAILED"
                            ? "ناموفق"
                            : "در انتظار پرداخت"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {invoice.receiptUrl ? (
                        <div className="flex flex-col gap-1.5 text-right">
                          <button
                            onClick={() =>
                              setSelectedReceipt(invoice.receiptUrl)
                            }
                            className="text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 font-bold text-xs cursor-pointer text-right flex items-center gap-1 bg-indigo-100 dark:bg-indigo-950/80 hover:bg-indigo-200 px-2.5 py-1 rounded-lg w-max transition-colors border border-indigo-200 dark:border-indigo-800"
                          >
                            <Eye className="w-3.5 h-3.5" /> مشاهده فیش
                          </button>
                          <span
                            className={`px-2.5 py-0.5 inline-block text-center w-max rounded-lg text-[11px] font-black border ${
                              invoice.receiptStatus === "APPROVED"
                                ? "bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-100"
                                : invoice.receiptStatus === "REJECTED"
                                  ? "bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950 dark:text-rose-100"
                                  : "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-100"
                            }`}
                          >
                            {invoice.receiptStatus === "APPROVED"
                              ? "تایید شده"
                              : invoice.receiptStatus === "REJECTED"
                                ? "رد شده"
                                : "در انتظار بررسی"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted text-xs font-medium">
                          فیش بارگذاری نشده
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted font-mono text-xs">
                      
                      {new Date(invoice.createdAt).toLocaleDateString(
                        "fa-IR",
                      )}
                    </td>
                    <td className="px-6 py-4">
                      
                      {invoice.status !== "PAID" && (
                        <div className="flex items-center justify-center gap-2">
                          
                          <button
                            onClick={() => triggerAction(invoice.id, "approve")}
                            className="bg-success/10 text-success hover:bg-success hover:text-white p-2 rounded-xl transition-all cursor-pointer shadow-sm border border-emerald-100"
                            title="تایید و تسویه"
                          >
                            
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => triggerAction(invoice.id, "reject")}
                            className="bg-danger/10 text-danger hover:bg-danger hover:text-white p-2 rounded-xl transition-all cursor-pointer shadow-sm border border-rose-100"
                            title="رد فیش"
                          >
                            
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {/* Custom Confirmation Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-subtle text-right animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center gap-3 text-warning mb-4 pb-2 border-b border-subtle justify-end">
              
              <h3 className="font-bold text-primary text-lg">
                تاییدیه عملیات
              </h3>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <p className="text-sm text-muted leading-relaxed mb-6">
              
              {confirmModal.action === "approve"
                ? "آیا از تایید نهایی این فیش واریزی اطمینان دارید؟ فاکتور تسویه شده و مبالغ تامین‌کنندگان شارژ می‌گردد."
                : "آیا از رد کردن این فیش واریزی اطمینان دارید؟ وضعیت فیش به رد شده تغییر خواهد کرد."}
            </p>
            <div className="flex gap-3">
              
              <button
                onClick={executeAction}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-inverse transition-all cursor-pointer shadow-sm ${confirmModal.action === "approve" ? "bg-success hover:bg-emerald-700" : "bg-danger hover:bg-rose-700"}`}
              >
                
                {confirmModal.action === "approve"
                  ? "تایید و تسویه نهایی"
                  : "رد فیش"}
              </button>
              <button
                onClick={() =>
                  setConfirmModal({
                    open: false,
                    invoiceId: null,
                    action: null,
                  })
                }
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-muted bg-surface hover:bg-surface transition-all cursor-pointer"
              >
                
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View Receipt Image Modal */}
      {selectedReceipt && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all"
          onClick={() => setSelectedReceipt(null)}
        >
          
          <div
            className="bg-card rounded-2xl p-6 max-w-2xl w-full relative shadow-2xl border border-subtle animate-in fade-in zoom-in-95 duration-200 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-subtle">
              
              <h3 className="font-bold text-primary text-lg">
                تصویر فیش واریزی
              </h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-muted hover:text-muted p-1.5 rounded-lg hover:bg-background transition-colors cursor-pointer text-sm font-bold"
              >
                
                بستن
              </button>
            </div>
            <div className="flex justify-center bg-background rounded-xl p-4 overflow-hidden border border-subtle max-h-[70vh]">
              
              <img
                src={selectedReceipt}
                alt="فیش واریزی"
                className="max-h-[60vh] max-w-full rounded-lg shadow-sm object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
