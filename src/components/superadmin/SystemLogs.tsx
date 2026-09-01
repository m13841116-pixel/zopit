import React, { useState, useEffect } from "react";
import { Activity, CreditCard, ChevronLeft, ChevronRight, Eye, X } from "lucide-react";

interface PaymentLog {
  id: string;
  requestId: string;
  gateway: string;
  action: string;
  status: string;
  targetUrl: string | null;
  httpStatus: number | null;
  durationMs: number | null;
  errorMessage: string | null;
  errorCode: string | null;
  requestBody: string | null;
  responseBody: string | null;
  orderId: string | null;
  userId: string | null;
  createdAt: string;
}

export default function SystemLogs() {
  const [activeTab, setActiveTab] = useState<'activity' | 'payment'>('activity');
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment Logs State
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentPageSize] = useState(20);
  const [paymentTotalPages, setPaymentTotalPages] = useState(1);
  const [paymentFilterStatus, setPaymentFilterStatus] = useState('');
  const [paymentFilterGateway, setPaymentFilterGateway] = useState('');

  // Modal State
  const [selectedPaymentLog, setSelectedPaymentLog] = useState<PaymentLog | null>(null);

  useEffect(() => {
    if (activeTab === 'activity') {
      setLoading(true);
      fetch("/api/admin/logs", {
        credentials: "include",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      })
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return [];
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setActivityLogs(data);
        else setActivityLogs([]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    } else if (activeTab === 'payment') {
      fetchPaymentLogs();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'payment') {
      fetchPaymentLogs();
    }
  }, [paymentPage, paymentFilterStatus, paymentFilterGateway]);

  const fetchPaymentLogs = () => {
    setLoading(true);
    let url = `/api/admin/payment-logs?page=${paymentPage}&pageSize=${paymentPageSize}`;
    if (paymentFilterStatus) url += `&status=${paymentFilterStatus}`;
    if (paymentFilterGateway) url += `&gateway=${paymentFilterGateway}`;

    fetch(url, {
      credentials: "include",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
    })
    .then((res) => res.json())
    .then((data) => {
      setPaymentLogs(data.logs || []);
      setPaymentTotal(data.total || 0);
      setPaymentTotalPages(data.totalPages || 1);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  };

  const getStatusColor = (status: string) => {
    if (status === 'SUCCESS') return 'text-emerald-600 bg-emerald-50';
    if (status === 'TIMEOUT') return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in relative min-h-screen">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-primary">گزارش‌های سیستم (Logs)</h2>
          <p className="text-muted mt-1">مشاهده رویدادها و ترافیک تراکنش‌ها</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-subtle pb-4">
        <button
          onClick={() => setActiveTab('activity')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'activity' ? 'bg-primary text-white' : 'text-muted hover:bg-surface'
          }`}
        >
          <Activity className="w-4 h-4" />
          لاگ فعالیت کاربران
        </button>
        <button
          onClick={() => { setActiveTab('payment'); setPaymentPage(1); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'payment' ? 'bg-primary text-white' : 'text-muted hover:bg-surface'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          تله‌متری تراکنش‌ها و درگاه
        </button>
      </div>

      {activeTab === 'activity' && (
        <>
          {loading ? (
            <div className="text-center p-12 text-muted">در حال بارگذاری...</div>
          ) : (
            <div className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden">
              <table className="w-full text-right text-sm min-w-[800px]">
                <thead className="bg-background border-b border-subtle text-muted font-medium">
                  <tr>
                    <th className="px-6 py-4">زمان</th>
                    <th className="px-6 py-4">کاربر</th>
                    <th className="px-6 py-4">عملیات</th>
                    <th className="px-6 py-4">جزئیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activityLogs.map((l: any, i: number) => (
                    <tr key={i} className="hover:bg-background">
                      <td className="px-6 py-4 font-mono text-xs text-muted" dir="ltr">
                        {new Date(l.createdAt).toLocaleString("fa-IR")}
                      </td>
                      <td className="px-6 py-4 text-secondary font-medium">
                        {l.user?.username || "سیستم"}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-surface text-muted rounded text-xs font-mono">
                          {l.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted text-xs">{l.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {activityLogs.length === 0 && (
                <div className="p-8 text-center text-muted">لاگی یافت نشد.</div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'payment' && (
        <div className="space-y-4">
          <div className="flex gap-4 items-center bg-card p-4 rounded-xl shadow-sm border border-subtle">
            <select
              value={paymentFilterGateway}
              onChange={(e) => setPaymentFilterGateway(e.target.value)}
              className="border border-subtle rounded-lg px-3 py-2 text-sm bg-background"
            >
              <option value="">همه درگاه‌ها</option>
              <option value="ZIBAL">ZIBAL</option>
              <option value="SEP">SEP</option>
              <option value="SYSTEM">SYSTEM</option>
            </select>
            <select
              value={paymentFilterStatus}
              onChange={(e) => setPaymentFilterStatus(e.target.value)}
              className="border border-subtle rounded-lg px-3 py-2 text-sm bg-background"
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="SUCCESS">SUCCESS (موفق)</option>
              <option value="FAILED">FAILED (ناموفق)</option>
              <option value="TIMEOUT">TIMEOUT (تایم‌اوت)</option>
              <option value="NETWORK_ERROR">NETWORK_ERROR (شبکه)</option>
              <option value="VALIDATION_ERROR">VALIDATION_ERROR (دیتا)</option>
            </select>
            <button 
              onClick={fetchPaymentLogs}
              className="bg-surface hover:bg-slate-200 text-secondary px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              اعمال فیلتر
            </button>
            <div className="mr-auto text-sm text-muted">
              تعداد کل: {paymentTotal}
            </div>
          </div>

          {loading ? (
            <div className="text-center p-12 text-muted">در حال بارگذاری...</div>
          ) : (
            <div className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm min-w-[800px]">
                  <thead className="bg-background border-b border-subtle text-muted font-medium whitespace-nowrap">
                    <tr>
                      <th className="px-6 py-4">زمان</th>
                      <th className="px-6 py-4">درگاه</th>
                      <th className="px-6 py-4">عملیات</th>
                      <th className="px-6 py-4">وضعیت</th>
                      <th className="px-6 py-4">مدت (ms)</th>
                      <th className="px-6 py-4">سفارش / کاربر</th>
                      <th className="px-6 py-4">خطا</th>
                      <th className="px-6 py-4 text-center">جزئیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-background transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-muted" dir="ltr">
                          {new Date(log.createdAt).toLocaleString("fa-IR")}
                        </td>
                        <td className="px-6 py-4 font-bold text-secondary text-xs">
                          {log.gateway}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-mono">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(log.status)}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs" dir="ltr">
                          {log.durationMs !== null ? `${log.durationMs}ms` : '-'}
                        </td>
                        <td className="px-6 py-4 text-xs text-muted">
                          {log.orderId ? `Order: ${log.orderId}` : ''}
                          {log.orderId && log.userId && <br/>}
                          {log.userId ? `User: ${log.userId}` : ''}
                        </td>
                        <td className="px-6 py-4 text-xs text-red-600 max-w-[200px] truncate" title={log.errorMessage || ''}>
                          {log.errorMessage || '-'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => setSelectedPaymentLog(log)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {paymentLogs.length === 0 && (
                <div className="p-8 text-center text-muted">رکوردی یافت نشد.</div>
              )}

              {/* Pagination */}
              {paymentTotalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-subtle bg-background">
                  <button
                    disabled={paymentPage === 1}
                    onClick={() => setPaymentPage(p => p - 1)}
                    className="p-2 text-muted hover:bg-surface rounded-lg disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-secondary font-medium">
                    صفحه {paymentPage} از {paymentTotalPages}
                  </span>
                  <button
                    disabled={paymentPage === paymentTotalPages}
                    onClick={() => setPaymentPage(p => p + 1)}
                    className="p-2 text-muted hover:bg-surface rounded-lg disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedPaymentLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-subtle bg-background">
              <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                جزئیات تراکنش
                <span className="text-xs font-mono bg-surface px-2 py-1 rounded text-muted select-all">
                  {selectedPaymentLog.requestId}
                </span>
              </h3>
              <button 
                onClick={() => setSelectedPaymentLog(null)}
                className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface p-3 rounded-xl border border-subtle">
                  <p className="text-xs text-muted mb-1">درگاه</p>
                  <p className="font-bold text-secondary">{selectedPaymentLog.gateway}</p>
                </div>
                <div className="bg-surface p-3 rounded-xl border border-subtle">
                  <p className="text-xs text-muted mb-1">عملیات</p>
                  <p className="font-bold text-secondary font-mono text-sm">{selectedPaymentLog.action}</p>
                </div>
                <div className="bg-surface p-3 rounded-xl border border-subtle">
                  <p className="text-xs text-muted mb-1">وضعیت شبکه</p>
                  <p className="font-bold text-secondary" dir="ltr">{selectedPaymentLog.httpStatus || 'N/A'}</p>
                </div>
                <div className="bg-surface p-3 rounded-xl border border-subtle">
                  <p className="text-xs text-muted mb-1">مدت زمان (کامل)</p>
                  <p className="font-bold text-secondary" dir="ltr">{selectedPaymentLog.durationMs || 0} ms</p>
                </div>
              </div>

              {selectedPaymentLog.targetUrl && (
                <div>
                  <h4 className="text-sm font-bold text-primary mb-2">آدرس مقصد (Target URL)</h4>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm font-mono text-slate-700 break-all" dir="ltr">
                    {selectedPaymentLog.targetUrl}
                  </div>
                </div>
              )}

              {selectedPaymentLog.errorMessage && (
                <div>
                  <h4 className="text-sm font-bold text-red-600 mb-2">پیام خطا</h4>
                  <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-sm font-mono text-red-700" dir="ltr">
                    {selectedPaymentLog.errorCode ? `[${selectedPaymentLog.errorCode}] ` : ''}
                    {selectedPaymentLog.errorMessage}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-bold text-primary mb-2">داده‌های ارسالی (Request Body) - ماسک شده</h4>
                <div className="bg-slate-900 p-4 rounded-xl overflow-x-auto">
                  <pre className="text-xs text-emerald-400 font-mono" dir="ltr">
                    {(() => {
                      if (!selectedPaymentLog.requestBody) return 'No payload';
                      try {
                        return JSON.stringify(JSON.parse(selectedPaymentLog.requestBody), null, 2);
                      } catch {
                        return selectedPaymentLog.requestBody;
                      }
                    })()}
                  </pre>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-primary mb-2">پاسخ دریافتی (Response Body) - ماسک شده</h4>
                <div className="bg-slate-900 p-4 rounded-xl overflow-x-auto">
                  <pre className="text-xs text-blue-400 font-mono" dir="ltr">
                    {(() => {
                      if (!selectedPaymentLog.responseBody) return 'No response';
                      try {
                        return JSON.stringify(JSON.parse(selectedPaymentLog.responseBody), null, 2);
                      } catch {
                        return selectedPaymentLog.responseBody;
                      }
                    })()}
                  </pre>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
