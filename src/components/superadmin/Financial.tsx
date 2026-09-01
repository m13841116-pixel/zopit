import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Filter,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Search,
} from "lucide-react";

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Financial() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const fetchReports = () => {
    setLoading(true);
    const query = new URLSearchParams({ page: page.toString(), limit: "10" });
    if (statusFilter) query.append("status", statusFilter);
    if (startDate) query.append("startDate", startDate);
    if (endDate) query.append("endDate", endDate);
    fetch(`/api/financial/reports?${query.toString()}`, { credentials: "include",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return null;
        return res.json();
      })
      .then((res) => {
        if (res) setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };
  const debouncedStatus = useDebounce(statusFilter, 400);
  const debouncedStart = useDebounce(startDate, 400);
  const debouncedEnd = useDebounce(endDate, 400);

  useEffect(() => {
    fetchReports();
  }, [page, debouncedStatus, debouncedStart, debouncedEnd]);
  const handleRefund = async (paymentId: string) => {
    if (!await window.customConfirm("آیا از بازپرداخت (Refund) این تراکنش اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/financial/payments/${paymentId}/refund`, { credentials: "include",
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        toast("بازپرداخت با موفقیت انجام شد", "success");
        fetchReports();
      } else {
        const error = await res.json();
        toast(`خطا: ${error.error}`, "error");
      }
    } catch (err) {
      toast("خطا در ارتباط با سرور", "error");
    }
  };
  if (loading && !data)
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-4">
        
        <div className="w-12 h-12 border-4 border-primary-default/30 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-muted font-medium animate-pulse">
          در حال دریافت گزارش‌های مالی...
        </p>
      </div>
    );
  return (
    <div className="p-8 space-y-8 animate-fade-in" dir="rtl">
      
      <div>
        
        <h2 className="text-2xl font-bold text-primary">
          داشبورد مالی و تسویه‌حساب (Financial Engine)
        </h2>
        <p className="text-muted mt-1">
          مدیریت تراکنش‌های بانکی، بازپرداخت‌ها و وضعیت تسویه‌های تامین‌کنندگان
        </p>
      </div>
      {/* Filters */}
      <div className="bg-card p-6 rounded-2xl shadow-sm border border-subtle flex flex-wrap items-end gap-4">
        
        <div>
          
          <label className="block text-xs font-bold text-muted mb-2 uppercase tracking-wider">
            وضعیت تراکنش
          </label>
          <select
            className="w-full bg-background border border-subtle rounded-xl px-4 py-2.5 outline-none focus:border-primary-default transition-all font-medium text-secondary"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            
            <option value="">همه وضعیت‌ها</option>
            <option value="PENDING">در انتظار پرداخت</option>
            <option value="PAID">پرداخت موفق (PAID)</option>
            <option value="FAILED">ناموفق (FAILED)</option>
            <option value="REFUNDED">بازپرداخت شده (REFUNDED)</option>
          </select>
        </div>
        <div>
          
          <label className="block text-xs font-bold text-muted mb-2 uppercase tracking-wider">
            از تاریخ
          </label>
          <input
            type="date"
            className="w-full bg-background border border-subtle rounded-xl px-4 py-2.5 outline-none focus:border-primary-default transition-all font-mono text-secondary"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div>
          
          <label className="block text-xs font-bold text-muted mb-2 uppercase tracking-wider">
            تا تاریخ
          </label>
          <input
            type="date"
            className="w-full bg-background border border-subtle rounded-xl px-4 py-2.5 outline-none focus:border-primary-default transition-all font-mono text-secondary"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <button
          onClick={fetchReports}
          className="bg-primary-default/10 text-primary-hover px-6 py-2.5 rounded-xl font-bold hover:bg-primary-default/20 transition-colors flex items-center gap-2"
        >
          
          <Search className="w-4 h-4" /> اعمال فیلتر
        </button>
        {(statusFilter || startDate || endDate) && (
          <button
            onClick={() => {
              setStatusFilter("");
              setStartDate("");
              setEndDate("");
              setPage(1);
            }}
            className="text-muted hover:text-muted font-medium text-sm px-4"
          >
            
            حذف فیلترها
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Payments Table */}
        <div className="lg:col-span-2 bg-card rounded-3xl shadow-sm border border-subtle overflow-hidden flex flex-col">
          
          <div className="p-6 border-b border-subtle flex items-center justify-between bg-background">
            
            <div className="flex items-center gap-3">
              
              <div className="bg-primary-default/20 p-2 rounded-lg">
                
                <FileText className="w-5 h-5 text-primary-hover" />
              </div>
              <h3 className="font-bold text-primary text-lg">
                تراکنش‌های درگاه پرداخت
              </h3>
            </div>
            {data?.pagination && (
              <span className="text-xs font-bold text-muted bg-card px-3 py-1 rounded-full border border-subtle">
                
                کل: {data.pagination.total} تراکنش
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            
            <table className="w-full text-sm text-right min-w-[800px]">
              
              <thead className="bg-background text-muted border-b border-subtle text-xs uppercase">
                
                <tr>
                  
                  <th className="px-6 py-4 font-bold">شناسه / پیگیری</th>
                  <th className="px-6 py-4 font-bold">مبلغ (ریال)</th>
                  <th className="px-6 py-4 font-bold">وضعیت</th>
                  <th className="px-6 py-4 font-bold">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                
                {data?.payments?.length === 0 ? (
                  <tr>
                    
                    <td colSpan={4} className="p-12 text-center text-muted">
                      
                      تراکنشی با این مشخصات یافت نشد
                    </td>
                  </tr>
                ) : (
                  data?.payments?.map((payment: any) => (
                    <tr
                      key={payment.id}
                      className="hover:bg-background/50 transition-colors"
                    >
                      
                      <td className="px-6 py-4">
                        
                        <div
                          className="font-mono text-primary font-medium text-xs mb-1 truncate max-w-[200px]"
                          title={payment.idempotencyKey}
                        >
                          
                          {payment.idempotencyKey}
                        </div>
                        <div className="text-xs text-muted font-mono">
                          
                          Ref: {payment.gatewayReference || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-primary font-mono">
                        
                        {Number(payment.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${payment.status === "PAID" ? "bg-success/10 text-success" : payment.status === "PENDING" ? "bg-warning/10 text-warning" : payment.status === "REFUNDED" ? "bg-surface text-blue-700" : "bg-danger/10 text-danger"}`}
                        >
                          
                          {payment.status === "PAID" && (
                            <CheckCircle className="w-3.5 h-3.5" />
                          )}
                          {payment.status === "PENDING" && (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          {payment.status === "REFUNDED" && (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                          {(payment.status === "FAILED" ||
                            payment.status === "CANCELLED") && (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        
                        {payment.status === "PAID" && (
                          <button
                            onClick={() => handleRefund(payment.id)}
                            className="text-xs font-bold text-danger bg-danger/10 hover:bg-danger/20 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            
                            Refund (عودت)
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="p-4 border-t border-subtle flex items-center justify-center gap-2 bg-background mt-auto">
              
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 bg-card border border-subtle rounded-xl text-muted font-medium disabled:opacity-50 hover:bg-background transition-colors"
              >
                
                قبلی
              </button>
              <span className="text-sm font-medium text-muted">
                
                صفحه {page} از {data.pagination.totalPages}
              </span>
              <button
                disabled={page === data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 bg-card border border-subtle rounded-xl text-muted font-medium disabled:opacity-50 hover:bg-background transition-colors"
              >
                
                بعدی
              </button>
            </div>
          )}
        </div>
        {/* Settlements Table */}
        <div className="bg-card rounded-3xl shadow-sm border border-subtle overflow-hidden flex flex-col">
          
          <div className="p-6 border-b border-subtle flex items-center gap-3 bg-background">
            
            <div className="bg-success/20 p-2 rounded-lg">
              
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <h3 className="font-bold text-primary text-lg">
              تسویه‌های اخیر (Settlements)
            </h3>
          </div>
          <div className="divide-y divide-slate-100 p-2">
            
            {data?.settlements?.length === 0 ? (
              <div className="p-8 text-center text-muted">
                
                تسویه‌ای یافت نشد
              </div>
            ) : (
              data?.settlements?.map((settlement: any) => (
                <div
                  key={settlement.id}
                  className="p-4 hover:bg-background rounded-xl transition-colors"
                >
                  
                  <div className="flex justify-between items-start mb-2">
                    
                    <div>
                      
                      <p className="font-bold text-primary">
                        {settlement.supplier?.brandName || "تامین‌کننده"}
                      </p>
                      <p className="text-xs text-muted mt-1">
                        {new Date(settlement.createdAt).toLocaleDateString(
                          "fa-IR",
                        )}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-bold ${settlement.status === "SUCCESS" ? "bg-success/10 text-success" : settlement.status === "PROCESSING" ? "bg-surface text-blue-700" : settlement.status === "PENDING" ? "bg-warning/10 text-warning" : "bg-danger/10 text-danger"}`}
                    >
                      
                      {settlement.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-end mt-4">
                    
                    <p className="text-xs text-muted font-mono">
                      Ref: {settlement.bankReference || "N/A"}
                    </p>
                    <p className="font-bold text-primary font-mono">
                      {Number(settlement.totalAmount).toLocaleString()} ریال
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
