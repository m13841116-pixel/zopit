import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
import {
  Wallet,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  User,
  ArrowLeftRight,
  ShoppingBag,
  TrendingUp,
  Download,
  Eye,
  Ban,
  AlertCircle,
  Calendar,
  Phone,
  Copy,
} from "lucide-react";
interface SettlementRequest {
  id: string;
  supplierId: number;
  supplierName: string;
  walletBalance: number;
  requestedAmount: number;
  remainingBalance: number;
  iban: string;
  bankName: string;
  accountHolderName: string;
  requestDate: string;
  status: string;
  trackId: string | null;
  supplierMobile?: string;
  supplierEmail?: string;
}
export default function SettlementsList() {
  const [requests, setRequests] = useState<SettlementRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  // Modals state
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | null>(
    null,
  );
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [supplierProfile, setSupplierProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [transactionsModalOpen, setTransactionsModalOpen] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [ordersModalOpen, setOrdersModalOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  /* Report Modal */ const [reportModalOpen, setReportModalOpen] =
    useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  /* Settlement Details Modal */ const [detailModalOpen, setDetailModalOpen] =
    useState(false);
  const [selectedSettlementId, setSelectedSettlementId] = useState<
    string | null
  >(null);
  const [settlementDetails, setSettlementDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  /* Payment Confirmation Modal */ const [
    paymentModalOpen,
    setPaymentModalOpen,
  ] = useState(false);
  const [paymentData, setPaymentData] = useState({
    settlementId: "",
    receiptUrl: "",
    transactionRef: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentNotes: "",
  });
  const [loadingPayment, setLoadingPayment] = useState(false);
  /* Adjustment Modal */ const [adjustmentModalOpen, setAdjustmentModalOpen] =
    useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    settlementId: "",
    type: "CREDIT",
    amount: "",
    reason: "",
  });
  const [loadingAdjustment, setLoadingAdjustment] = useState(false);
  const fetchSettlements = () => {
    setLoading(true);
    const query = statusFilter ? `?status=${statusFilter}` : "";
    fetch(`/api/admin/settlements${query}`, { credentials: "include",
      headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setRequests(res.settlements);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };
  useEffect(() => {
    fetchSettlements();
  }, [statusFilter]);
  const handleApprove = async (id: string) => {
    if (!await window.customConfirm("آیا از تایید این درخواست تسویه اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/admin/settlements/${id}/approve`, { credentials: "include",
        method: "POST",
        headers: {
          
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast("درخواست تسویه با موفقیت تایید شد", "success");
        fetchSettlements();
      } else {
        toast(data.error || "خطایی رخ داد", "error");
      }
    } catch (err) {
      toast("خطا در ارتباط با سرور", "error");
    }
  };
  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/settlements/${id}/reject`, { credentials: "include",
        method: "POST",
        headers: {
          
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast("درخواست تسویه با موفقیت رد شد", "success");
        fetchSettlements();
      } else {
        toast(data.error || "خطایی رخ داد", "error");
      }
    } catch (err) {
      toast("خطا در ارتباط با سرور", "error");
    }
  };
  const handleOpenPaymentModal = (id: string) => {
    setPaymentData({
      settlementId: id,
      receiptUrl: "",
      transactionRef: "",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentNotes: "",
    });
    setPaymentModalOpen(true);
  };
  const handleConfirmPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPayment(true);
    try {
      const res = await fetch(
        `/api/admin/settlements/${paymentData.settlementId}/pay`, { credentials: "include",
          method: "POST",
          headers: {
            
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            receiptUrl: paymentData.receiptUrl,
            transactionRef: paymentData.transactionRef,
            paymentDate: paymentData.paymentDate,
            paymentNotes: paymentData.paymentNotes,
          }),
        },
      );
      const data = await res.json();
      if (res.ok && data.success) {
        alert(
          "درخواست با موفقیت به عنوان پرداخت شده نهایی شد و به صورت مالی قفل گردید.",
        );
        setPaymentModalOpen(false);
        setDetailModalOpen(false);
        fetchSettlements();
      } else {
        toast(data.error || "خطایی رخ داد", "error");
      }
    } catch (err) {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setLoadingPayment(false);
    }
  };
  const handleConfirmAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingAdjustment(true);
    try {
      const res = await fetch(
        `/api/admin/settlements/${adjustmentData.settlementId}/adjust`, { credentials: "include",
          method: "POST",
          headers: {
            
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type: adjustmentData.type,
            amount: adjustmentData.amount,
            reason: adjustmentData.reason,
          }),
        },
      );
      const data = await res.json();
      if (res.ok && data.success) {
        toast("اصلاحیه مالی با موفقیت ثبت شد.", "success");
        setAdjustmentModalOpen(false); // Refresh details
        handleViewDetails(adjustmentData.settlementId);
      } else {
        toast(data.error || "خطایی رخ داد", "error");
      }
    } catch (err) {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setLoadingAdjustment(false);
    }
  };
  const handleViewProfile = async (supplierId: number) => {
    setSelectedSupplierId(supplierId);
    setProfileModalOpen(true);
    setLoadingProfile(true);
    try {
      const res = await fetch(`/api/admin/suppliers/${supplierId}/profile`, { credentials: "include",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSupplierProfile(data.profile);
      } else {
        toast("خطا در دریافت پروفایل تامین‌کننده", "error");
      }
    } catch (err) {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setLoadingProfile(false);
    }
  };
  const handleViewTransactions = async (supplierId: number) => {
    setSelectedSupplierId(supplierId);
    setTransactionsModalOpen(true);
    setLoadingTransactions(true);
    try {
      const res = await fetch(
        `/api/admin/suppliers/${supplierId}/wallet-transactions`, { credentials: "include",
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        },
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setTransactions(data.transactions);
      } else {
        toast("خطا در دریافت تراکنش‌های کیف پول", "error");
      }
    } catch (err) {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setLoadingTransactions(false);
    }
  };
  const handleViewOrders = async (supplierId: number) => {
    setSelectedSupplierId(supplierId);
    setOrdersModalOpen(true);
    setLoadingOrders(true);
    try {
      const res = await fetch(
        `/api/admin/suppliers/${supplierId}/wallet-orders`, { credentials: "include",
          headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
        },
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setOrders(data.orders);
      } else {
        toast("خطا در دریافت سفارشات مرتبط", "error");
      }
    } catch (err) {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setLoadingOrders(false);
    }
  };
  const handleGenerateReport = async () => {
    setReportModalOpen(true);
    setLoadingReport(true);
    try {
      const res = await fetch("/api/admin/settlements/report", { credentials: "include",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReportData(data.report);
      } else {
        toast("خطا در تولید گزارش تسویه‌حساب", "error");
      }
    } catch (err) {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setLoadingReport(false);
    }
  };
  const handleViewDetails = async (id: string) => {
    setSelectedSettlementId(id);
    setDetailModalOpen(true);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/admin/settlements/${id}`, { credentials: "include",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettlementDetails(data);
      } else {
        toast(data.error || "خطا در دریافت جزئیات تسویه", "error");
      }
    } catch (err) {
      toast("خطا در ارتباط با سرور", "error");
    } finally {
      setLoadingDetails(false);
    }
  };
  const filteredRequests = requests.filter((req) => {
    const query = searchTerm.toLowerCase();
    return (
      req.supplierName.toLowerCase().includes(query) ||
      req.supplierId.toString().includes(query) ||
      req.iban.toLowerCase().includes(query) ||
      (req.trackId && req.trackId.toLowerCase().includes(query))
    );
  });
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-warning/10 text-warning border border-amber-200">
            
            <Clock className="w-3.5 h-3.5" /> در انتظار تایید (Pending)
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-surface text-blue-700 border border-blue-200">
            
            <TrendingUp className="w-3.5 h-3.5" /> تایید شده (Approved)
          </span>
        );
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-success/10 text-success border border-emerald-200">
            
            <CheckCircle className="w-3.5 h-3.5" /> پرداخت شده (Paid)
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-danger/10 text-danger border border-rose-200">
            
            <XCircle className="w-3.5 h-3.5" /> رد شده (Rejected)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-surface text-secondary">
            
            {status}
          </span>
        );
    }
  };
  return (
    <div
      className="p-8 space-y-8 animate-fade-in"
      dir="rtl"
      id="settlements-management-panel"
    >
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        <div>
          
          <h2 className="text-2xl font-bold text-primary">
            مدیریت تسویه‌حساب تامین‌کنندگان
          </h2>
          <p className="text-muted mt-1">
            بررسی، تایید و پرداخت درخواست‌های تسویه حساب تامین‌کنندگان سامانه
          </p>
        </div>
        <div>
          
          <button
            onClick={handleGenerateReport}
            className="flex items-center gap-2 px-5 py-3 bg-primary-default hover:bg-primary-hover text-inverse rounded-xl font-bold text-sm shadow-md shadow-primary-default/10 transition-colors"
            id="btn-generate-report"
          >
            
            <Download className="w-4 h-4" /> دریافت گزارش تسویه‌حساب
          </button>
        </div>
      </div>
      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        <div className="bg-card p-6 rounded-2xl border border-subtle shadow-sm flex items-center gap-4">
          
          <div className="p-3.5 bg-warning/10 rounded-xl border border-amber-100">
            
            <Clock className="w-6 h-6 text-warning" />
          </div>
          <div>
            
            <span className="text-xs font-bold text-muted block uppercase tracking-wider">
              در انتظار بررسی
            </span>
            <span className="text-xl font-extrabold text-primary mt-1 block">
              
              {requests.filter((r) => r.status === "PENDING").length}
              درخواست
            </span>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-subtle shadow-sm flex items-center gap-4">
          
          <div className="p-3.5 bg-surface rounded-xl border border-blue-100">
            
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            
            <span className="text-xs font-bold text-muted block uppercase tracking-wider">
              تایید شده (در انتظار پرداخت)
            </span>
            <span className="text-xl font-extrabold text-primary mt-1 block">
              
              {requests.filter((r) => r.status === "PROCESSING").length}
              درخواست
            </span>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-subtle shadow-sm flex items-center gap-4">
          
          <div className="p-3.5 bg-success/10 rounded-xl border border-emerald-100">
            
            <CheckCircle className="w-6 h-6 text-success" />
          </div>
          <div>
            
            <span className="text-xs font-bold text-muted block uppercase tracking-wider">
              پرداخت شده
            </span>
            <span className="text-xl font-extrabold text-primary mt-1 block">
              
              {requests.filter((r) => r.status === "SUCCESS").length}
              درخواست
            </span>
          </div>
        </div>
        <div className="bg-card p-6 rounded-2xl border border-subtle shadow-sm flex items-center gap-4">
          
          <div className="p-3.5 bg-danger/10 rounded-xl border border-rose-100">
            
            <XCircle className="w-6 h-6 text-danger" />
          </div>
          <div>
            
            <span className="text-xs font-bold text-muted block uppercase tracking-wider">
              رد شده
            </span>
            <span className="text-xl font-extrabold text-primary mt-1 block">
              
              {requests.filter((r) => r.status === "FAILED").length}
              درخواست
            </span>
          </div>
        </div>
      </div>
      {/* Filter and Search Bar */}
      <div className="bg-card p-5 rounded-2xl border border-subtle shadow-sm flex flex-col md:flex-row items-center gap-4">
        
        <div className="relative flex-1 w-full">
          
          <Search className="w-5 h-5 text-muted absolute right-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجو در نام تامین‌کننده، شناسه تامین‌کننده، شبا یا کد پیگیری..."
            className="w-full bg-background border border-subtle rounded-xl pr-12 pl-4 py-3 outline-none focus:border-primary-default focus:bg-card transition-all font-medium text-sm text-secondary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            id="search-input"
          />
        </div>
        <div className="w-full md:w-64">
          
          <select
            className="w-full bg-background border border-subtle rounded-xl px-4 py-3 outline-none focus:border-primary-default focus:bg-card transition-all font-bold text-sm text-secondary"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            id="status-filter"
          >
            
            <option value="">همه وضعیت‌ها</option>
            <option value="PENDING">در انتظار بررسی (Pending)</option>
            <option value="PROCESSING">تایید شده (Approved)</option>
            <option value="SUCCESS">پرداخت شده (Paid)</option>
            <option value="FAILED">رد شده (Rejected)</option>
          </select>
        </div>
      </div>
      {/* Main Settlements Table Card */}
      <div className="bg-card rounded-3xl border border-subtle shadow-sm overflow-hidden">
        
        <div className="p-6 border-b border-subtle bg-background flex justify-between items-center">
          
          <h3 className="font-extrabold text-primary flex items-center gap-2">
            
            <Wallet className="w-5 h-5 text-primary-default" /> لیست درخواست‌های
            تسویه حساب
          </h3>
          <span className="text-xs font-bold text-muted bg-card px-3 py-1 rounded-full border border-subtle">
            
            کل: {filteredRequests.length} درخواست
          </span>
        </div>
        <div className="overflow-x-auto">
          
          <table className="w-full text-right text-sm">
            
            <thead className="bg-background text-muted border-b border-subtle text-xs font-extrabold">
              
              <tr>
                
                <th className="px-6 py-4">مشخصات تامین‌کننده</th>
                <th className="px-6 py-4">
                  جزئیات حساب بانکی (شبا / بانک / صاحب حساب)
                </th>
                <th className="px-6 py-4">
                  وضعیت کیف پول (موجودی / درخواستی / باقی‌مانده)
                </th>
                <th className="px-6 py-4">تاریخ درخواست</th>
                <th className="px-6 py-4">وضعیت</th>
                <th className="px-6 py-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-medium">
              
              {loading ? (
                <tr>
                  
                  <td colSpan={6} className="p-16 text-center">
                    
                    <div className="flex flex-col items-center justify-center space-y-3">
                      
                      <div className="w-10 h-10 border-4 border-primary-default/30 border-t-indigo-600 rounded-full animate-spin"></div>
                      <span className="text-muted font-bold">
                        در حال بارگذاری اطلاعات تسویه...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  
                  <td
                    colSpan={6}
                    className="p-16 text-center text-muted font-bold"
                  >
                    
                    هیچ درخواست تسویه‌حسابی یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const estRemaining = req.walletBalance - req.requestedAmount;
                  return (
                    <tr
                      key={req.id}
                      className="hover:bg-background/50 transition-colors"
                      id={`row-${req.id}`}
                    >
                      
                      {/* Supplier identity */}
                      <td className="px-6 py-5">
                        
                        <div className="space-y-1">
                          
                          <span className="block font-bold text-primary">
                            {req.supplierName}
                          </span>
                          <span className="block text-xs font-mono text-muted">
                            شناسه: #{req.supplierId}
                          </span>
                          {req.supplierMobile && (
                            <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-full w-fit">
                              <Phone className="w-3 h-3" />
                              <span>تماس: {req.supplierMobile}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      {/* Bank account details */}
                      <td className="px-6 py-5">
                        
                        <div className="space-y-1">
                          
                          <div className="flex items-center gap-1.5">
                            <span
                              className="block text-xs font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/50 px-2 py-0.5 rounded-lg"
                              dir="ltr"
                            >
                              {req.iban}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(req.iban);
                                toast("شماره شبا کپی شد", "success");
                              }}
                              className="p-1 hover:bg-slate-100 rounded text-muted hover:text-indigo-600 transition-colors"
                              title="کپی شماره شبا"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="block text-xs text-muted font-bold">
                            
                            {req.bankName} - {req.accountHolderName}
                          </span>
                        </div>
                      </td>
                      {/* Financial info */}
                      <td className="px-6 py-5">
                        
                        <div className="space-y-1.5">
                          
                          <div className="flex items-center gap-2 text-xs">
                            
                            <span className="text-muted font-bold">
                              موجودی کیف پول:
                            </span>
                            <span className="text-muted font-mono font-bold">
                              
                              {req.walletBalance.toLocaleString()} تومان
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            
                            <span className="text-muted text-xs font-bold">
                              مبلغ درخواستی:
                            </span>
                            <span className="text-primary-default font-extrabold font-mono text-sm">
                              
                              {req.requestedAmount.toLocaleString()} تومان
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            
                            <span className="text-muted font-bold">
                              باقی‌مانده پس از تسویه:
                            </span>
                            <span
                              className={`font-mono font-bold ${estRemaining < 0 ? "text-danger" : "text-muted"}`}
                            >
                              
                              {estRemaining.toLocaleString()} تومان
                            </span>
                          </div>
                        </div>
                      </td>
                      {/* Date */}
                      <td className="px-6 py-5">
                        
                        <span className="text-xs text-muted font-mono">
                          
                          {new Date(req.requestDate).toLocaleDateString(
                            "fa-IR",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-6 py-5">
                        
                        {getStatusBadge(req.status)}
                      </td>
                      {/* Operations */}
                      <td className="px-6 py-5">
                        
                        <div className="flex flex-col gap-2 justify-center">
                          
                          {/* Main Decision Buttons */}
                          <div className="flex gap-2 justify-end">
                            
                            {req.status === "PENDING" && (
                              <button
                                onClick={() => handleApprove(req.id)}
                                className="px-3 py-1.5 text-xs font-bold bg-primary-default/10 hover:bg-primary-default/20 text-primary-hover rounded-lg border border-primary-default/30 transition-colors"
                              >
                                
                                تایید درخواست
                              </button>
                            )}
                            {req.status === "PROCESSING" && (
                              <button
                                onClick={() => handleOpenPaymentModal(req.id)}
                                className="px-3 py-1.5 text-xs font-bold bg-success hover:bg-emerald-700 text-inverse rounded-lg transition-colors shadow-sm"
                              >
                                
                                ثبت پرداخت نهایی (Paid)
                              </button>
                            )}
                            {(req.status === "PENDING" ||
                              req.status === "PROCESSING") && (
                              <button
                                onClick={() => handleReject(req.id)}
                                className="px-3 py-1.5 text-xs font-bold bg-danger/10 hover:bg-danger/20 text-danger rounded-lg border border-rose-200 transition-colors"
                              >
                                
                                رد درخواست
                              </button>
                            )}
                          </div>
                          {/* Detail Inquiries */}
                          <div className="flex gap-1.5 justify-end mt-1.5 border-t border-subtle pt-1.5 font-sans">
                            
                            <button
                              onClick={() => handleViewDetails(req.id)}
                              title="جزئیات کامل و ریز اقلام تسویه‌حساب"
                              className="p-1.5 bg-primary-default/10 hover:bg-primary-default/20 text-primary-hover rounded-lg transition-colors border border-primary-default/30/50 flex items-center gap-1 text-xs font-bold"
                            >
                              
                              <Eye className="w-3.5 h-3.5" /> جزئیات تسویه
                            </button>
                            <button
                              onClick={() => handleViewProfile(req.supplierId)}
                              title="پروفایل تامین‌کننده"
                              className="p-1.5 bg-background hover:bg-surface text-muted rounded-lg transition-colors border border-subtle/50 flex items-center gap-1 text-xs"
                            >
                              
                              <User className="w-3.5 h-3.5" /> پروفایل
                            </button>
                            <button
                              onClick={() =>
                                handleViewTransactions(req.supplierId)
                              }
                              title="تراکنش‌های مالی"
                              className="p-1.5 bg-background hover:bg-surface text-muted rounded-lg transition-colors border border-subtle/50 flex items-center gap-1 text-xs"
                            >
                              
                              <ArrowLeftRight className="w-3.5 h-3.5" />
                              تراکنش‌ها
                            </button>
                            <button
                              onClick={() => handleViewOrders(req.supplierId)}
                              title="سفارشات مرتبط با اعتبار کیف پول"
                              className="p-1.5 bg-background hover:bg-surface text-muted rounded-lg transition-colors border border-subtle/50 flex items-center gap-1 text-xs"
                            >
                              
                              <ShoppingBag className="w-3.5 h-3.5" /> سفارشات
                              اعتبار
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Supplier Profile Modal */}
      {profileModalOpen && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          
          <div className="bg-card rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-subtle transform transition-all animate-scale-up">
            
            <div className="p-6 border-b border-subtle flex items-center justify-between bg-background">
              
              <h3 className="text-lg font-extrabold text-primary flex items-center gap-2">
                
                <User className="w-5 h-5 text-primary-default" /> پروفایل
                تامین‌کننده
              </h3>
              <button
                onClick={() => setProfileModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface hover:bg-surface text-muted font-bold flex items-center justify-center transition-colors text-sm"
              >
                
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              
              {loadingProfile ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  
                  <div className="w-8 h-8 border-3 border-primary-default/30 border-t-indigo-600 rounded-full animate-spin"></div>
                  <span className="text-muted font-bold text-sm">
                    در حال دریافت اطلاعات...
                  </span>
                </div>
              ) : supplierProfile ? (
                <div className="space-y-4">
                  
                  <div className="grid grid-cols-2 gap-4">
                    
                    <div className="bg-background p-3.5 rounded-xl border border-subtle/40">
                      
                      <span className="text-xs text-muted font-bold block">
                        نام و نام خانوادگی
                      </span>
                      <span className="text-sm font-bold text-secondary mt-1 block">
                        {supplierProfile.name}
                      </span>
                    </div>
                    <div className="bg-background p-3.5 rounded-xl border border-subtle/40">
                      
                      <span className="text-xs text-muted font-bold block">
                        نام شرکت
                      </span>
                      <span className="text-sm font-bold text-secondary mt-1 block">
                        {supplierProfile.companyName || "ثبت نشده"}
                      </span>
                    </div>
                    <div className="bg-background p-3.5 rounded-xl border border-subtle/40">
                      
                      <span className="text-xs text-muted font-bold block">
                        ایمیل
                      </span>
                      <span
                        className="text-sm font-mono text-secondary mt-1 block"
                        dir="ltr"
                      >
                        {supplierProfile.email}
                      </span>
                    </div>
                    <div className="bg-background p-3.5 rounded-xl border border-subtle/40">
                      
                      <span className="text-xs text-muted font-bold block">
                        تلفن همراه
                      </span>
                      <span
                        className="text-sm font-mono text-secondary mt-1 block"
                        dir="ltr"
                      >
                        {supplierProfile.phone || "ثبت نشده"}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-subtle pt-4">
                    
                    <h4 className="font-extrabold text-primary text-sm mb-3">
                      اطلاعات بانکی مصوب
                    </h4>
                    <div className="bg-primary-default/10/50 p-4 rounded-xl border border-primary-default/20 space-y-2.5">
                      
                      <div className="flex justify-between items-center text-xs">
                        
                        <span className="text-primary-default font-bold">
                          شماره شبا (IBAN)
                        </span>
                        <span
                          className="font-mono text-secondary font-bold"
                          dir="ltr"
                        >
                          {supplierProfile.shaba || "ثبت نشده"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        
                        <span className="text-primary-default font-bold">
                          نام بانک
                        </span>
                        <span className="text-secondary font-bold">
                          {supplierProfile.bankName || "ثبت نشده"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        
                        <span className="text-primary-default font-bold">
                          صاحب حساب
                        </span>
                        <span className="text-secondary font-bold">
                          {supplierProfile.accountHolderName || "ثبت نشده"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted font-bold text-center py-6">
                  اطلاعاتی یافت نشد
                </p>
              )}
            </div>
            <div className="p-4 border-t border-subtle bg-background flex justify-end">
              
              <button
                onClick={() => setProfileModalOpen(false)}
                className="px-5 py-2.5 bg-surface hover:bg-gray-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Wallet Transactions Modal */}
      {transactionsModalOpen && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          
          <div className="bg-card rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-subtle transform transition-all animate-scale-up">
            
            <div className="p-6 border-b border-subtle flex items-center justify-between bg-background">
              
              <h3 className="text-lg font-extrabold text-primary flex items-center gap-2">
                
                <ArrowLeftRight className="w-5 h-5 text-primary-default" />
                تاریخچه تراکنش‌های کیف پول
              </h3>
              <button
                onClick={() => setTransactionsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface hover:bg-surface text-muted font-bold flex items-center justify-center transition-colors text-sm"
              >
                
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[450px]">
              
              {loadingTransactions ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  
                  <div className="w-8 h-8 border-3 border-primary-default/30 border-t-indigo-600 rounded-full animate-spin"></div>
                  <span className="text-muted font-bold text-sm">
                    در حال دریافت تراکنش‌ها...
                  </span>
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-muted font-bold text-center py-12">
                  تراکنشی برای این کیف پول ثبت نشده است.
                </p>
              ) : (
                <table className="w-full text-right text-xs">
                  
                  <thead className="bg-background text-muted border-b border-subtle font-extrabold">
                    
                    <tr>
                      
                      <th className="px-4 py-3">تاریخ تراکنش</th>
                      <th className="px-4 py-3">شرح / بابت</th>
                      <th className="px-4 py-3">نوع تراکنش</th>
                      <th className="px-4 py-3">وضعیت تراکنش</th>
                      <th className="px-4 py-3">مبلغ تراکنش</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-medium text-muted">
                    
                    {transactions.map((tx: any) => {
                      const amount = parseFloat(tx.amount);
                      return (
                        <tr key={tx.id} className="hover:bg-background/50">
                          
                          <td className="px-4 py-3.5 font-mono text-muted">
                            
                            {new Date(tx.createdAt).toLocaleDateString(
                              "fa-IR",
                              {
                                year: "numeric",
                                month: "numeric",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-secondary">
                            {tx.description}
                          </td>
                          <td className="px-4 py-3.5">
                            
                            {tx.type === "ORDER_REVENUE" ? (
                              <span className="text-success font-bold">
                                سهم درآمد فروش
                              </span>
                            ) : tx.type === "WITHDRAWAL" ? (
                              <span className="text-danger font-bold">
                                برداشت / تسویه حساب
                              </span>
                            ) : (
                              <span className="text-muted">{tx.type}</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            
                            {tx.status === "COMPLETED" ? (
                              <span className="text-success font-bold bg-success/10 px-2 py-0.5 rounded-full border border-emerald-100">
                                نهایی شده
                              </span>
                            ) : tx.status === "PENDING" ? (
                              <span className="text-warning font-bold bg-warning/10 px-2 py-0.5 rounded-full border border-amber-100">
                                رزرو / معلق
                              </span>
                            ) : (
                              <span className="text-danger font-bold bg-danger/10 px-2 py-0.5 rounded-full border border-rose-100">
                                ناموفق
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 font-mono font-bold text-sm">
                            
                            <span
                              className={
                                amount >= 0 ? "text-success" : "text-danger"
                              }
                            >
                              
                              {amount >= 0 ? "+" : ""}
                              {amount.toLocaleString()} تومان
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className="p-4 border-t border-subtle bg-background flex justify-end">
              
              <button
                onClick={() => setTransactionsModalOpen(false)}
                className="px-5 py-2.5 bg-surface hover:bg-gray-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Order History Modal */}
      {ordersModalOpen && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          
          <div className="bg-card rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-subtle transform transition-all animate-scale-up animate-fade-in">
            
            <div className="p-6 border-b border-subtle flex items-center justify-between bg-background">
              
              <h3 className="text-lg font-extrabold text-primary flex items-center gap-2">
                
                <ShoppingBag className="w-5 h-5 text-primary-default" /> سفارشات
                فروش مرتبط با درآمد کیف پول
              </h3>
              <button
                onClick={() => setOrdersModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface hover:bg-surface text-muted font-bold flex items-center justify-center transition-colors text-sm"
              >
                
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[450px]">
              
              {loadingOrders ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  
                  <div className="w-8 h-8 border-3 border-primary-default/30 border-t-indigo-600 rounded-full animate-spin"></div>
                  <span className="text-muted font-bold text-sm">
                    در حال بارگذاری سفارشات...
                  </span>
                </div>
              ) : orders.length === 0 ? (
                <p className="text-muted font-bold text-center py-12">
                  هیچ سفارش درآمدی یافت نشد.
                </p>
              ) : (
                <div className="space-y-6">
                  
                  {orders.map((order: any) => (
                    <div
                      key={order.id}
                      className="bg-background p-4 rounded-2xl border border-subtle/50 space-y-3"
                    >
                      
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-subtle/60 pb-2.5">
                        
                        <div className="flex items-center gap-3">
                          
                          <span className="text-xs font-bold text-muted">
                            سفارش شماره:
                          </span>
                          <span className="text-sm font-extrabold text-primary font-mono">
                            #{order.id}
                          </span>
                          <span className="text-xs text-muted">| فروشگاه:</span>
                          <span className="text-xs font-bold text-secondary">
                            {order.store?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          
                          <span className="text-muted">فاکتور تسویه:</span>
                          <span className="font-mono text-primary-default font-bold bg-primary-default/10 px-2 py-0.5 rounded-md border border-primary-default/20">
                            
                            INV-{order.storeInvoiceId}
                          </span>
                          <span className="text-muted font-mono">
                            
                            {new Date(order.createdAt).toLocaleDateString(
                              "fa-IR",
                            )}
                          </span>
                        </div>
                      </div>
                      {/* Items details */}
                      <div className="space-y-2">
                        
                        {order.items.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center text-xs"
                          >
                            
                            <div className="flex items-center gap-2">
                              
                              <span className="w-2 h-2 bg-primary-default rounded-full"></span>
                              <span className="font-bold text-secondary">
                                {item.product?.name}
                              </span>
                              <span className="text-muted font-bold">
                                ({item.quantity} عدد)
                              </span>
                            </div>
                            <div className="flex gap-4">
                              
                              <div>
                                
                                <span className="text-muted">
                                  قیمت واحد تامین:
                                </span>
                                <span className="font-mono font-bold text-muted mr-1">
                                  
                                  {parseFloat(
                                    item.supplierPrice,
                                  ).toLocaleString()}
                                  تومان
                                </span>
                              </div>
                              <div>
                                
                                <span className="text-success font-bold">
                                  مجموع سهم:
                                </span>
                                <span className="font-mono font-extrabold text-success mr-1">
                                  
                                  {(
                                    parseFloat(item.supplierPrice) *
                                    item.quantity
                                  ).toLocaleString()}
                                  تومان
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-subtle bg-background flex justify-end">
              
              <button
                onClick={() => setOrdersModalOpen(false)}
                className="px-5 py-2.5 bg-surface hover:bg-gray-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Settlement Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          
          <div className="bg-card rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-subtle transform transition-all animate-scale-up animate-fade-in">
            
            <div className="p-6 border-b border-subtle flex items-center justify-between bg-background">
              
              <h3 className="text-lg font-extrabold text-primary flex items-center gap-2">
                
                <FileText className="w-5 h-5 text-primary-default" /> گزارش
                ادواری و تراز کل تسویه‌حساب‌ها
              </h3>
              <button
                onClick={() => setReportModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface hover:bg-surface text-muted font-bold flex items-center justify-center transition-colors text-sm"
              >
                
                ✕
              </button>
            </div>
            <div
              className="p-6 overflow-y-auto max-h-[500px]"
              id="printable-report"
            >
              
              {loadingReport ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  
                  <div className="w-8 h-8 border-3 border-primary-default/30 border-t-indigo-600 rounded-full animate-spin"></div>
                  <span className="text-muted font-bold text-sm">
                    در حال پردازش و برآورد تراکنش‌ها...
                  </span>
                </div>
              ) : reportData ? (
                <div className="space-y-6">
                  
                  {/* Metadata line */}
                  <div className="flex justify-between items-center bg-background p-4 rounded-xl border border-subtle text-xs">
                    
                    <span className="text-muted">
                      تاریخ گزارش:
                      <span className="font-mono font-bold text-primary mr-1">
                        
                        {new Date(reportData.generatedAt).toLocaleDateString(
                          "fa-IR",
                        )}
                      </span>
                    </span>
                    <span className="text-muted">
                      مهر امنیتی:
                      <span className="font-mono font-bold text-primary mr-1">
                        B2B-S-SECURE
                      </span>
                    </span>
                  </div>
                  {/* Summary Grid in Report */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    
                    <div className="bg-background p-4 rounded-xl border border-subtle/60 text-center">
                      
                      <span className="text-[10px] text-muted font-bold block uppercase">
                        کل درخواست شده
                      </span>
                      <span className="text-sm font-extrabold text-primary font-mono mt-1.5 block">
                        
                        {reportData.summary.totalRequested.toLocaleString()}
                        تومان
                      </span>
                    </div>
                    <div className="bg-success/10/50 p-4 rounded-xl border border-emerald-100 text-center">
                      
                      <span className="text-[10px] text-success font-bold block uppercase">
                        پرداخت شده (تسویه نهایی)
                      </span>
                      <span className="text-sm font-extrabold text-success font-mono mt-1.5 block">
                        
                        {reportData.summary.totalPaid.toLocaleString()}
                        تومان
                      </span>
                    </div>
                    <div className="bg-warning/10/50 p-4 rounded-xl border border-amber-100 text-center">
                      
                      <span className="text-[10px] text-warning font-bold block uppercase">
                        در انتظار بررسی
                      </span>
                      <span className="text-sm font-extrabold text-warning font-mono mt-1.5 block">
                        
                        {reportData.summary.totalPending.toLocaleString()}
                        تومان
                      </span>
                    </div>
                    <div className="bg-surface/50 p-4 rounded-xl border border-blue-100 text-center">
                      
                      <span className="text-[10px] text-blue-600 font-bold block uppercase">
                        تایید شده (در جریان)
                      </span>
                      <span className="text-sm font-extrabold text-blue-700 font-mono mt-1.5 block">
                        
                        {reportData.summary.totalApproved.toLocaleString()}
                        تومان
                      </span>
                    </div>
                    <div className="bg-danger/10/50 p-4 rounded-xl border border-rose-100 text-center">
                      
                      <span className="text-[10px] text-danger font-bold block uppercase">
                        رد شده
                      </span>
                      <span className="text-sm font-extrabold text-danger font-mono mt-1.5 block">
                        
                        {reportData.summary.totalRejected.toLocaleString()}
                        تومان
                      </span>
                    </div>
                  </div>
                  {/* Items breakdown list */}
                  <div className="border border-subtle/60 rounded-2xl overflow-hidden">
                    
                    <table className="w-full text-right text-xs">
                      
                      <thead className="bg-background text-muted border-b border-subtle font-bold">
                        
                        <tr>
                          
                          <th className="px-4 py-3">شناسه درخواست</th>
                          <th className="px-4 py-3">نام تامین‌کننده</th>
                          <th className="px-4 py-3">حساب شبا</th>
                          <th className="px-4 py-3">مبلغ تسویه</th>
                          <th className="px-4 py-3">تاریخ</th>
                          <th className="px-4 py-3">وضعیت</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 font-medium text-muted">
                        
                        {reportData.items.map((item: any) => (
                          <tr key={item.id} className="hover:bg-background/30">
                            
                            <td className="px-4 py-3 font-mono text-[10px] text-muted">
                              #{item.id.substring(0, 8)}...
                            </td>
                            <td className="px-4 py-3 font-bold text-primary">
                              {item.supplierName}
                            </td>
                            <td className="px-4 py-3 font-mono text-muted">
                              {item.shaba}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-secondary">
                              {item.amount.toLocaleString()} تومان
                            </td>
                            <td className="px-4 py-3 font-mono">
                              
                              {new Date(item.date).toLocaleDateString(
                                "fa-IR",
                              )}
                            </td>
                            <td className="px-4 py-3">
                              
                              {item.status === "SUCCESS" ? (
                                <span className="text-success font-bold">
                                  پرداخت شده
                                </span>
                              ) : item.status === "PENDING" ? (
                                <span className="text-warning font-bold">
                                  معلق
                                </span>
                              ) : item.status === "PROCESSING" ? (
                                <span className="text-blue-600 font-bold">
                                  تایید شده
                                </span>
                              ) : (
                                <span className="text-danger font-bold">
                                  رد شده
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-muted font-bold text-center py-6">
                  اطلاعاتی یافت نشد
                </p>
              )}
            </div>
            <div className="p-4 border-t border-subtle bg-background flex justify-between">
              
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-surface hover:bg-surface text-secondary font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
              >
                
                <Download className="w-4 h-4" /> پرینت / خروجی PDF
              </button>
              <button
                onClick={() => setReportModalOpen(false)}
                className="px-5 py-2.5 bg-surface hover:bg-gray-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Settlement Detailed Breakdown & Report Page */}
      {detailModalOpen && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          
          <div className="bg-card rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl border border-subtle transform transition-all animate-scale-up max-h-[90vh] flex flex-col font-sans">
            
            <div className="p-6 border-b border-subtle flex items-center justify-between bg-background shrink-0">
              
              <h3 className="text-lg font-extrabold text-primary flex items-center gap-2">
                
                <FileText className="w-5 h-5 text-primary-default" /> جزئیات و
                ریز اقلام تسویه‌حساب (Settlement Details)
              </h3>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface hover:bg-surface text-muted font-bold flex items-center justify-center transition-colors text-sm"
              >
                
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-right">
              
              {loadingDetails ? (
                <div className="py-24 flex flex-col items-center justify-center space-y-3">
                  
                  <div className="w-10 h-10 border-4 border-primary-default/30 border-t-indigo-600 rounded-full animate-spin"></div>
                  <span className="text-muted font-bold text-sm">
                    در حال بارگذاری اطلاعات تفصیلی...
                  </span>
                </div>
              ) : settlementDetails ? (
                <div className="space-y-6">
                  
                  {/* ID & Date Banner */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-primary-default/10/40 p-4 rounded-2xl border border-primary-default/20/60 gap-2 text-right">
                    
                    <div>
                      
                      <span className="text-xs text-primary-default font-bold">
                        شناسه درخواست تسویه:
                      </span>
                      <span className="font-mono font-bold text-sm text-primary-hover mr-2 block md:inline">
                        
                        {settlementDetails.settlement.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      
                      <span className="text-muted font-bold">
                        تاریخ ثبت درخواست:
                      </span>
                      <span className="font-mono font-bold text-primary">
                        
                        {new Date(
                          settlementDetails.settlement.requestDate,
                        ).toLocaleDateString("fa-IR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  {/* Supplier & Bank Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
                    
                    {/* Supplier Identity */}
                    <div className="bg-background p-5 rounded-2xl border border-subtle/40 space-y-3">
                      
                      <h4 className="font-extrabold text-primary text-sm flex items-center gap-2 border-b border-subtle/60 pb-2">
                        
                        <User className="w-4 h-4 text-primary-default" /> مشخصات
                        تامین‌کننده (Supplier)
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        
                        <div>
                          
                          <span className="text-muted font-bold">
                            نام تامین‌کننده:
                          </span>
                          <span className="font-bold text-secondary block mt-1">
                            {settlementDetails.settlement.supplierName}
                          </span>
                        </div>
                        <div>
                          
                          <span className="text-muted font-bold">
                            شناسه تامین‌کننده:
                          </span>
                          <span className="font-mono font-bold text-secondary block mt-1">
                            #{settlementDetails.settlement.supplierId}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Bank Info */}
                    <div className="bg-background p-5 rounded-2xl border border-subtle/40 space-y-3">
                      
                      <h4 className="font-extrabold text-primary text-sm flex items-center gap-2 border-b border-subtle/60 pb-2">
                        
                        <Wallet className="w-4 h-4 text-primary-default" />
                        مشخصات حساب بانکی
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        
                        <div>
                          
                          <span className="text-muted font-bold">
                            نام صاحب حساب:
                          </span>
                          <span className="font-bold text-secondary block mt-1">
                            {settlementDetails.settlement.accountHolderName}
                          </span>
                        </div>
                        <div>
                          
                          <span className="text-muted font-bold">
                            نام بانک:
                          </span>
                          <span className="font-bold text-secondary block mt-1">
                            {settlementDetails.settlement.bankName}
                          </span>
                        </div>
                        <div className="col-span-2">
                          
                          <span className="text-muted font-bold">
                            شماره شبا (IBAN):
                          </span>
                          <span
                            className="font-mono font-bold text-secondary block mt-1 text-right"
                            dir="ltr"
                          >
                            {settlementDetails.settlement.iban}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Wallet Balance Summary Card */}
                  <div className="bg-card p-6 rounded-2xl border border-subtle/60 shadow-sm space-y-4 text-right">
                    
                    <h4 className="font-extrabold text-primary text-sm border-b border-subtle pb-2 flex justify-between items-center">
                      
                      <span>تراز مالی درخواست تسویه</span>
                      <span className="text-xs">
                        {getStatusBadge(settlementDetails.settlement.status)}
                      </span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      <div className="bg-background p-4 rounded-xl border border-subtle/40 text-center space-y-1">
                        
                        <span className="text-xs text-muted font-bold block">
                          موجودی زمان درخواست
                        </span>
                        <span className="text-base font-extrabold text-primary font-mono block">
                          
                          {settlementDetails.settlement.walletBalance.toLocaleString()}
                          تومان
                        </span>
                      </div>
                      <div className="bg-primary-default/10/50 p-4 rounded-xl border border-primary-default/20 text-center space-y-1">
                        
                        <span className="text-xs text-primary-default font-bold block">
                          مبلغ درخواستی تسویه
                        </span>
                        <span className="text-lg font-extrabold text-primary-hover font-mono block">
                          
                          {settlementDetails.settlement.requestedAmount.toLocaleString()}
                          تومان
                        </span>
                      </div>
                      <div className="bg-background p-4 rounded-xl border border-subtle/40 text-center space-y-1">
                        
                        <span className="text-xs text-muted font-bold block">
                          باقی‌مانده پس از تسویه
                        </span>
                        <span className="text-base font-extrabold text-primary font-mono block">
                          
                          {settlementDetails.settlement.remainingBalance.toLocaleString()}
                          تومان
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Payment Receipt Info */}
                  {settlementDetails.settlement.financiallyLocked && (
                    <div className="bg-success/10/50 p-6 rounded-2xl border border-emerald-100 shadow-sm space-y-4 text-right">
                      
                      <h4 className="font-extrabold text-emerald-800 text-sm border-b border-emerald-100 pb-2 flex justify-between items-center">
                        
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" /> اطلاعات پرداخت و
                          رسید
                        </span>
                        <span className="text-[10px] font-bold bg-success/20 text-success px-2 py-0.5 rounded-full">
                          قفل مالی شده (Financially Locked)
                        </span>
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                        
                        <div className="space-y-1">
                          
                          <span className="text-success/70 font-bold block">
                            تاریخ پرداخت:
                          </span>
                          <span
                            className="font-mono font-bold text-emerald-900 block"
                            dir="ltr"
                          >
                            
                            {new Date(
                              settlementDetails.settlement.paymentDate,
                            ).toLocaleDateString("fa-IR")}
                          </span>
                        </div>
                        <div className="space-y-1">
                          
                          <span className="text-success/70 font-bold block">
                            کد پیگیری (Reference):
                          </span>
                          <span className="font-mono font-bold text-emerald-900 block">
                            {settlementDetails.settlement.transactionRef || "-"}
                          </span>
                        </div>
                        <div className="space-y-1 md:col-span-2">
                          
                          <span className="text-success/70 font-bold block">
                            رسید آپلود شده:
                          </span>
                          {settlementDetails.settlement.receiptUrl ? (
                            <a
                              href={settlementDetails.settlement.receiptUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-success hover:text-emerald-900 underline font-mono inline-flex items-center gap-1"
                            >
                              
                              مشاهده فایل رسید بانکی
                            </a>
                          ) : (
                            <span className="text-emerald-900">بدون فایل</span>
                          )}
                        </div>
                        {settlementDetails.settlement.paymentNotes && (
                          <div className="space-y-1 md:col-span-4 mt-2">
                            
                            <span className="text-success/70 font-bold block">
                              یادداشت:
                            </span>
                            <span className="text-emerald-900 block leading-relaxed">
                              {settlementDetails.settlement.paymentNotes}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Complete Order List & Wallet Credit Breakdown */}
                  <div className="space-y-3 text-right">
                    
                    <h4 className="font-extrabold text-primary text-sm flex items-center gap-2">
                      
                      <ShoppingBag className="w-4 h-4 text-primary-default" />
                      ریز اقلام اعتبار (Wallet Credits Breakdown)
                    </h4>
                    <p className="text-xs text-muted font-bold">
                      ریست‌فاکتورها و سفارشات تشکیل‌دهنده کل این درخواست
                      تسویه‌حساب:
                    </p>
                    {settlementDetails.breakdown.length === 0 ? (
                      <div className="p-8 text-center bg-background rounded-2xl border border-subtle text-muted font-bold text-xs">
                        
                        هیچ اعتبار یا سفارش مستقیمی به این درخواست لینک نشده است
                        (تسویه از محل سایر تراکنش‌ها یا تراز ترکیبی).
                      </div>
                    ) : (
                      <div className="border border-subtle/60 rounded-2xl overflow-hidden shadow-sm">
                        
                        <div className="overflow-x-auto">
                          
                          <table className="w-full text-right text-xs">
                            
                            <thead className="bg-background text-muted border-b border-subtle font-extrabold">
                              
                              <tr>
                                
                                <th className="px-4 py-3">شماره سفارش</th>
                                <th className="px-4 py-3">تاریخ سفارش</th>
                                <th className="px-4 py-3">نام محصول / SKU</th>
                                <th className="px-4 py-3 text-center">تعداد</th>
                                <th className="px-4 py-3">سهم تامین‌کننده</th>
                                <th className="px-4 py-3">کارمزد پلتفرم</th>
                                <th className="px-4 py-3">اعتبار کیف پول</th>
                                <th className="px-4 py-3">وضعیت سفارش</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-medium text-muted">
                              
                              {settlementDetails.breakdown.map(
                                (item: any, idx: number) => (
                                  <tr
                                    key={idx}
                                    className="hover:bg-background/40"
                                  >
                                    
                                    <td className="px-4 py-3.5 font-mono font-bold text-primary">
                                      #{item.orderNumber}
                                    </td>
                                    <td className="px-4 py-3.5 font-mono text-muted">
                                      
                                      {new Date(
                                        item.orderDate,
                                      ).toLocaleDateString("fa-IR")}
                                    </td>
                                    <td className="px-4 py-3.5">
                                      
                                      <div className="space-y-0.5">
                                        
                                        <span className="block font-bold text-secondary">
                                          {item.productName}
                                        </span>
                                        <span className="block text-[10px] text-muted font-mono">
                                          SKU: {item.sku}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3.5 text-center font-mono font-bold text-secondary">
                                      {item.quantity}
                                    </td>
                                    <td className="px-4 py-3.5 font-mono font-bold text-secondary">
                                      
                                      {item.supplierRevenue.toLocaleString()}
                                      تومان
                                    </td>
                                    <td className="px-4 py-3.5 font-mono text-muted">
                                      
                                      {item.platformCommission.toLocaleString()}
                                      تومان
                                    </td>
                                    <td className="px-4 py-3.5 font-mono font-extrabold text-primary-default bg-primary-default/5">
                                      
                                      {item.walletCreditAmount.toLocaleString()}
                                      تومان
                                    </td>
                                    <td className="px-4 py-3.5">
                                      
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface text-muted border border-subtle/50">
                                        
                                        {item.currentOrderStatus}
                                      </span>
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Accounting Summary */}
                  <div className="bg-background p-5 rounded-2xl border border-subtle/40 space-y-3 text-right">
                    
                    <h4 className="font-extrabold text-primary text-sm flex items-center gap-2">
                      
                      <FileText className="w-4 h-4 text-primary-default" />
                      خلاصه حسابداری (Accounting Summary)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-bold">
                      
                      <div className="bg-card p-3.5 rounded-xl border border-subtle">
                        
                        <span className="text-muted block mb-1">
                          تعداد ردیف‌های اعتبار:
                        </span>
                        <span className="text-primary font-mono font-extrabold">
                          {
                            settlementDetails.accountingSummary
                              .totalOrdersIncluded
                          }
                          قلم کالا
                        </span>
                      </div>
                      <div className="bg-card p-3.5 rounded-xl border border-subtle">
                        
                        <span className="text-muted block mb-1">
                          مجموع درآمدهای تامین:
                        </span>
                        <span className="text-primary font-mono font-extrabold">
                          {settlementDetails.accountingSummary.totalSupplierRevenue.toLocaleString()}
                          تومان
                        </span>
                      </div>
                      <div className="bg-card p-3.5 rounded-xl border border-subtle">
                        
                        <span className="text-muted block mb-1">
                          مجموع سهم پلتفرم (کارمزد):
                        </span>
                        <span className="text-primary font-mono font-extrabold">
                          {settlementDetails.accountingSummary.totalPlatformCommission.toLocaleString()}
                          تومان
                        </span>
                      </div>
                      <div className="bg-primary-default/10 p-3.5 rounded-xl border border-primary-default/20">
                        
                        <span className="text-primary-default block mb-1">
                          کل اعتبارات تایید شده تسویه:
                        </span>
                        <span className="text-primary-hover font-mono font-extrabold">
                          {settlementDetails.accountingSummary.totalWalletCredits.toLocaleString()}
                          تومان
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Adjustments */}
                  <div className="space-y-3 text-right">
                    
                    <div className="flex items-center justify-between">
                      
                      <h4 className="font-extrabold text-primary text-sm flex items-center gap-2">
                        
                        <Wallet className="w-4 h-4 text-primary-default" />
                        اصلاحیه‌های مالی (Financial Adjustments)
                      </h4>
                      {settlementDetails.settlement.financiallyLocked && (
                        <button
                          onClick={() => {
                            setAdjustmentData({
                              settlementId: settlementDetails.settlement.id,
                              type: "CREDIT",
                              amount: "",
                              reason: "",
                            });
                            setAdjustmentModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-warning/20 hover:bg-amber-200 text-amber-800 text-xs font-bold rounded-lg transition-colors border border-amber-200 flex items-center gap-1"
                        >
                          
                          + ثبت اصلاحیه جدید
                        </button>
                      )}
                    </div>
                    {settlementDetails.settlement.adjustments &&
                    settlementDetails.settlement.adjustments.length > 0 ? (
                      <div className="space-y-2">
                        
                        {settlementDetails.settlement.adjustments.map(
                          (adj: any) => (
                            <div
                              key={adj.id}
                              className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between items-start md:items-center text-xs gap-3 ${adj.type === "CREDIT" ? "bg-success/10/50 border-emerald-100" : "bg-danger/10/50 border-rose-100"}`}
                            >
                              
                              <div className="space-y-1">
                                
                                <span
                                  className={`font-bold block ${adj.type === "CREDIT" ? "text-success" : "text-danger"}`}
                                >
                                  
                                  {adj.type === "CREDIT"
                                    ? "بستانکار (افزایش موجودی تامین‌کننده)"
                                    : "بدهکار (کسر از موجودی تامین‌کننده)"}
                                </span>
                                <span className="text-muted font-medium block">
                                  دلیل: {adj.reason}
                                </span>
                              </div>
                              <div className="flex flex-col md:items-end gap-1">
                                
                                <span
                                  className={`font-mono font-extrabold text-sm ${adj.type === "CREDIT" ? "text-success" : "text-danger"}`}
                                >
                                  
                                  {adj.type === "CREDIT" ? "+" : "-"}
                                  {adj.amount.toLocaleString()} تومان
                                </span>
                                <span
                                  className="text-[10px] text-muted font-mono text-left"
                                  dir="ltr"
                                >
                                  
                                  {new Date(adj.createdAt).toLocaleString(
                                    "fa-IR",
                                  )}
                                </span>
                                <span className="text-[10px] text-muted">
                                  توسط: {adj.actorName}
                                </span>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="p-4 text-center bg-background rounded-xl border border-subtle text-muted font-bold text-xs">
                        
                        هیچ اصلاحیه‌ای برای این تسویه ثبت نشده است.
                      </div>
                    )}
                  </div>
                  {/* Audit Logs */}
                  <div className="space-y-3 text-right">
                    
                    <h4 className="font-extrabold text-primary text-sm flex items-center gap-2">
                      
                      <AlertCircle className="w-4 h-4 text-primary-default" />
                      سابقه ممیزی و رویدادها (Audit Trail)
                    </h4>
                    {settlementDetails.auditHistory.length === 0 ? (
                      <p className="text-xs text-muted font-bold bg-background p-4 rounded-xl text-center">
                        هیچ سابقه رویدادی برای این تسویه ثبت نشده است.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        
                        {settlementDetails.auditHistory.map((trail: any) => (
                          <div
                            key={trail.id}
                            className="bg-background p-3 rounded-xl border border-subtle/30 flex justify-between items-center text-xs"
                          >
                            
                            <div className="space-y-1">
                              
                              <span className="font-bold text-secondary block text-right">
                                
                                {trail.action === "MARK_PAYOUT_AS_PAID"
                                  ? "پرداخت نهایی درخواست تسویه حساب"
                                  : trail.action === "APPROVE_PAYOUT"
                                    ? "تایید و پردازش درخواست تسویه حساب"
                                    : trail.action === "REJECT_PAYOUT"
                                      ? "رد درخواست تسویه حساب و مرجوعی وجه"
                                      : trail.action === "FINANCIAL_ADJUSTMENT"
                                        ? "ثبت اصلاحیه مالی در کیف پول"
                                        : trail.action}
                              </span>
                              <span className="text-[10px] text-muted block text-right">
                                توسط: {trail.actorName}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-muted">
                              
                              {new Date(trail.date).toLocaleString(
                                "fa-IR",
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-muted font-bold text-center py-12">
                  خطا در دریافت اطلاعات جزئیات.
                </p>
              )}
            </div>
            <div className="p-4 border-t border-subtle bg-background flex justify-end shrink-0 gap-3">
              
              {settlementDetails &&
                settlementDetails.settlement.status === "PROCESSING" && (
                  <button
                    onClick={() => {
                      handleOpenPaymentModal(settlementDetails.settlement.id);
                      setDetailModalOpen(false);
                    }}
                    className="px-5 py-2.5 bg-success hover:bg-emerald-700 text-inverse font-bold rounded-xl text-xs transition-colors shadow-sm"
                  >
                    
                    ثبت پرداخت نهایی (Paid)
                  </button>
                )}
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-5 py-2.5 bg-surface hover:bg-gray-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Payment Confirmation Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          
          <div className="bg-card rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-subtle transform transition-all animate-scale-up font-sans">
            
            <div className="p-6 border-b border-subtle flex items-center justify-between bg-success/10">
              
              <h3 className="text-lg font-extrabold text-emerald-800 flex items-center gap-2">
                
                <CheckCircle className="w-5 h-5" /> تایید پرداخت و قفل مالی
              </h3>
              <button
                onClick={() => setPaymentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-success/20/50 hover:bg-emerald-200 text-success font-bold flex items-center justify-center transition-colors text-sm"
              >
                
                ✕
              </button>
            </div>
            <div className="p-6">
              
              <form
                id="payment-form"
                onSubmit={handleConfirmPayment}
                className="space-y-4 text-right"
              >
                
                <p className="text-xs text-danger bg-danger/10 p-3 rounded-xl border border-rose-100 font-bold mb-4">
                  
                  توجه: ثبت پرداخت باعث قفل مالی (Financial Lock) این تسویه‌حساب
                  می‌شود. پس از تایید، امکان ویرایش مبالغ یا حذف رسید وجود
                  نخواهد داشت.
                </p>
                <div className="space-y-1.5">
                  
                  <label className="text-xs font-bold text-secondary block">
                    رسید بانکی (URL فایل)*
                  </label>
                  <input
                    type="url"
                    required
                    value={paymentData.receiptUrl}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        receiptUrl: e.target.value,
                      })
                    }
                    placeholder="https://..."
                    className="w-full bg-background border border-subtle rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-success/20 focus:border-success outline-none transition-all dir-ltr text-left font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  
                  <label className="text-xs font-bold text-secondary block">
                    شماره مرجع تراکنش (Reference)*
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentData.transactionRef}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        transactionRef: e.target.value,
                      })
                    }
                    placeholder="شماره پیگیری پرداخت"
                    className="w-full bg-background border border-subtle rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-success/20 focus:border-success outline-none transition-all font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  
                  <label className="text-xs font-bold text-secondary block">
                    تاریخ پرداخت*
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentData.paymentDate}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        paymentDate: e.target.value,
                      })
                    }
                    className="w-full bg-background border border-subtle rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-success/20 focus:border-success outline-none transition-all font-mono text-left dir-ltr"
                  />
                </div>
                <div className="space-y-1.5">
                  
                  <label className="text-xs font-bold text-secondary block">
                    توضیحات (اختیاری)
                  </label>
                  <textarea
                    value={paymentData.paymentNotes}
                    onChange={(e) =>
                      setPaymentData({
                        ...paymentData,
                        paymentNotes: e.target.value,
                      })
                    }
                    placeholder="یادداشت در مورد پرداخت..."
                    rows={2}
                    className="w-full bg-background border border-subtle rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-success/20 focus:border-success outline-none transition-all resize-none"
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-subtle bg-background flex justify-end gap-3">
              
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="px-5 py-2.5 bg-surface hover:bg-surface text-secondary font-bold rounded-xl text-xs transition-colors"
                disabled={loadingPayment}
              >
                
                انصراف
              </button>
              <button
                type="submit"
                form="payment-form"
                disabled={loadingPayment}
                className="px-5 py-2.5 bg-success hover:bg-emerald-700 text-inverse font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                
                {loadingPayment && (
                  <div className="w-4 h-4 border-2 border-border-subtle/30 border-t-white rounded-full animate-spin"></div>
                )}
                تایید پرداخت و ثبت قفل
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Adjustment Modal */}
      {adjustmentModalOpen && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          
          <div className="bg-card rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-subtle transform transition-all animate-scale-up font-sans">
            
            <div className="p-6 border-b border-subtle flex items-center justify-between bg-warning/10">
              
              <h3 className="text-lg font-extrabold text-amber-800 flex items-center gap-2">
                
                <Wallet className="w-5 h-5" /> ثبت اصلاحیه مالی
              </h3>
              <button
                onClick={() => setAdjustmentModalOpen(false)}
                className="w-8 h-8 rounded-full bg-warning/20/50 hover:bg-amber-200 text-warning font-bold flex items-center justify-center transition-colors text-sm"
              >
                
                ✕
              </button>
            </div>
            <div className="p-6">
              
              <form
                id="adjustment-form"
                onSubmit={handleConfirmAdjustment}
                className="space-y-4 text-right"
              >
                
                <p className="text-xs text-muted bg-background p-3 rounded-xl border border-subtle font-bold mb-4">
                  
                  ثبت اصلاحیه مالی در کیف پول تامین‌کننده اعمال شده و در سوابق
                  تسویه حساب با نام شما ذخیره می‌گردد.
                </p>
                <div className="space-y-1.5">
                  
                  <label className="text-xs font-bold text-secondary block">
                    نوع اصلاحیه*
                  </label>
                  <select
                    required
                    value={adjustmentData.type}
                    onChange={(e) =>
                      setAdjustmentData({
                        ...adjustmentData,
                        type: e.target.value,
                      })
                    }
                    className="w-full bg-background border border-subtle rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-warning outline-none transition-all font-bold"
                  >
                    
                    <option value="CREDIT">
                      بستانکار (افزایش موجودی تامین‌کننده)
                    </option>
                    <option value="DEBIT">
                      بدهکار (کسر از موجودی تامین‌کننده)
                    </option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  
                  <label className="text-xs font-bold text-secondary block">
                    مبلغ اصلاحیه (تومان)*
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={adjustmentData.amount}
                    onChange={(e) =>
                      setAdjustmentData({
                        ...adjustmentData,
                        amount: e.target.value,
                      })
                    }
                    placeholder="مثال: 50000"
                    className="w-full bg-background border border-subtle rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-warning outline-none transition-all dir-ltr text-left font-mono font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  
                  <label className="text-xs font-bold text-secondary block">
                    دلیل اصلاحیه*
                  </label>
                  <textarea
                    required
                    value={adjustmentData.reason}
                    onChange={(e) =>
                      setAdjustmentData({
                        ...adjustmentData,
                        reason: e.target.value,
                      })
                    }
                    placeholder="دلیل اعمال این اصلاحیه مالی چیست؟"
                    rows={3}
                    className="w-full bg-background border border-subtle rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-warning outline-none transition-all resize-none font-medium"
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-subtle bg-background flex justify-end gap-3">
              
              <button
                type="button"
                onClick={() => setAdjustmentModalOpen(false)}
                className="px-5 py-2.5 bg-surface hover:bg-surface text-secondary font-bold rounded-xl text-xs transition-colors"
                disabled={loadingAdjustment}
              >
                
                انصراف
              </button>
              <button
                type="submit"
                form="adjustment-form"
                disabled={loadingAdjustment}
                className="px-5 py-2.5 bg-warning hover:bg-amber-700 text-inverse font-bold rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                
                {loadingAdjustment && (
                  <div className="w-4 h-4 border-2 border-border-subtle/30 border-t-white rounded-full animate-spin"></div>
                )}
                ثبت نهایی اصلاحیه
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
