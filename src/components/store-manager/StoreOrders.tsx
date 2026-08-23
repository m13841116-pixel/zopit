import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
import OrderTimeline from "../OrderTimeline";
import { PROVINCES } from "../../data/provinces";
import { useMobileScrollLock } from "../../hooks/useMobileScrollLock";
import {
  ShoppingCart,
  Plus,
  Check,
  X,
  CreditCard,
  Loader2,
  Eye,
  Info,
  Calendar,
  Truck,
  User,
  MapPin,
  FileText,
  XCircle,
  Printer, Clock,
} from "lucide-react";
import { printOrderInvoice } from "../../utils/printLabel";
import { Bell, BellRing, Volume2, Play } from "lucide-react";

export default function StoreOrders({
  onNavigateToInvoices,
  user,
}: {
  onNavigateToInvoices?: () => void;
  user?: any;
}): React.ReactElement {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [myCatalog, setMyCatalog] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");

  useEffect(() => {
    setSelectedVariantId("");
  }, [selectedProduct]);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [shippingAddressType, setShippingAddressType] = useState<
    "STORE_ADDRESS" | "OTHER_ADDRESS"
  >("OTHER_ADDRESS");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingMethod, setShippingMethod] = useState<string>("POST");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showShippingModal, setShowShippingModal] = useState(false);
  const [selectedShippingOrder, setSelectedShippingOrder] = useState<any | null>(null);
  /* Redesigned form states */ const [productSearch, setProductSearch] =
    useState("");
  const [shippingProvince, setShippingProvince] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingAddressDetail, setShippingAddressDetail] = useState("");
  const [shippingRecipientName, setShippingRecipientName] = useState("");
  const [shippingRecipientPhone, setShippingRecipientPhone] = useState("");
  const [postalLabelUrl, setPostalLabelUrl] = useState("");
  const [uploadingLabel, setUploadingLabel] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const simulateLabelUpload = (file: File) => {
    setUploadingLabel(true);
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setUploadingLabel(false);
          const reader = new FileReader();
          reader.onloadend = () => {
            setPostalLabelUrl(reader.result as string);
          };
          reader.readAsDataURL(file);
          return 100;
        }
        return prev + 30;
      });
    }, 100);
  };
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>({});
  const [enableCardToCard, setEnableCardToCard] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "MANUAL">(
    "ONLINE",
  );
  const [currentOrderIdToPay, setCurrentOrderIdToPay] = useState<number | null>(
    null,
  );
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<
    any | null
  >(null);

  // Lock body scroll on mobile when modals are open
  useMobileScrollLock(showModal || paymentModalOpen || !!selectedOrderForDetails || showShippingModal);

  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const handleExportCSV = () => {
    if (orders.length === 0) {
      toast("هیچ سفارشی برای خروجی گرفتن وجود ندارد.", "error");
      return;
    }
    const headers = [
      "شناسه سفارش",
      "نام محصول",
      "تعداد",
      "مبلغ کل (تومان)",
      "وضعیت",
      "تاریخ ثبت",
    ];
    const rows = orders.map((o) => [
      o.id,
      o.product?.name || "محصول حذف شده",
      o.quantity,
      o.totalAmount || 0,
      o.status === "REQUESTED"
        ? "در انتظار تایید"
        : o.status === "SUPPLIER_APPROVED"
          ? "تایید شده"
          : o.status === "PAID"
            ? "پرداخت شده"
            : o.status,
      new Date(o.createdAt).toLocaleDateString("fa-IR"),
    ]);
    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");
    const blob = new Blob([new Uint8Array([0xef, 0xbb, 0xbf]), csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `سفارشات_فروشگاه.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  useEffect(() => {
    let timer: any;
    if (paymentSuccessData && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (paymentSuccessData && countdown === 0) {
      handleClosePaymentModalAndRedirect();
    }
    return () => clearTimeout(timer);
  }, [paymentSuccessData, countdown]);
  const handleClosePaymentModalAndRedirect = () => {
    setPaymentModalOpen(false);
    setPaymentSuccessData(null);
    setCountdown(5);
    setSelectedOrders([]);
    fetchOrders();
    if (onNavigateToInvoices) onNavigateToInvoices();
  };
  const closePaymentModal = () => {
    setPaymentModalOpen(false);
    setPaymentSuccessData(null);
    setPaymentError(null);
    setCountdown(5);
  };
  useEffect(() => {
    if (selectedShippingOrder) {
      setShippingMethod(selectedShippingOrder.shippingMethod || "POST");
      setShippingAddressType(selectedShippingOrder.shippingAddressType || "OTHER_ADDRESS");
      setShippingProvince(selectedShippingOrder.province || "");
      setShippingCity(selectedShippingOrder.city || "");
      setShippingPostalCode(selectedShippingOrder.postalCode || "");
      setShippingAddressDetail(selectedShippingOrder.addressDetail || "");
      setShippingRecipientName(selectedShippingOrder.recipientName || "");
      setShippingRecipientPhone(selectedShippingOrder.recipientPhone || "");
    }
  }, [selectedShippingOrder]);
  useEffect(() => {
    fetchOrders();
    fetchCatalog();
    fetch("/api/config")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.ENABLE_CARD_TO_CARD !== undefined) {
          setEnableCardToCard(data.ENABLE_CARD_TO_CARD === "true" || data.ENABLE_CARD_TO_CARD === true);
        }
      })
      .catch(() => {});
  }, []);
  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/store-manager/orders", {
        credentials: "include",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const fetchCatalog = async () => {
    try {
      const res = await fetch("/api/store-manager/my-catalog", {
        credentials: "include",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMyCatalog(data);
      }
    } catch (err) {
      console.error(err);
    }
  };
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      setError("لطفاً یک محصول را انتخاب کنید");
      return;
    }
    setError(null);
    let finalAddress = "";
    // Validation for shipping details removed and moved to the next step
    setSubmitting(true);
    try {
      const res = await fetch("/api/store-manager/orders", {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          productId: parseInt(selectedProduct),
          variantId: selectedVariantId ? parseInt(selectedVariantId) : null,
          quantity,
          notes,
          shippingAddressType: "OTHER_ADDRESS",
          shippingAddress: finalAddress,
          shippingMethod: "PLATFORM_PANEL",
          postalLabel: null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setSelectedProduct("");
        setSelectedVariantId("");
        setQuantity(1);
        setNotes("");
        setShippingAddress("");
        setShippingProvince("");
        setShippingCity("");
        setShippingPostalCode("");
        setShippingRecipientName("");
        setShippingRecipientPhone("");
        setShippingAddressDetail("");
        setPostalLabelUrl("");
        fetchOrders();
      } else {
        setError(data.error || "خطا در ثبت سفارش");
      }
    } catch (err) {
      console.error(err);
      setError("خطای شبکه");
    } finally {
      setSubmitting(false);
    }
  };
  const handlePaymentClick = (orderId: number) => {
    setCurrentOrderIdToPay(orderId);
    setOrderDetails({
      [orderId]: { id: orderId },
    });
    setPaymentError(null);
    setPaymentSuccessData(null);
    setPaymentModalOpen(true);
  };
  const handleBatchPaymentClick = () => {
    if (selectedOrders.length === 0) return;

    // Initialize order details
    const initialDetails: any = {};
    selectedOrders.forEach((id) => {
      initialDetails[id] = { id };
    });
    setOrderDetails(initialDetails);

    setCurrentOrderIdToPay(null);
    setPaymentError(null);
    setPaymentSuccessData(null);
    setPaymentModalOpen(true);
  };
  const processPayment = async () => {
    const orderIds = currentOrderIdToPay
      ? [currentOrderIdToPay]
      : selectedOrders;
    if (orderIds.length === 0) return;
    setPaymentSubmitting(true);
    setPaymentError(null);
    setPaymentSuccessData(null);

    const formattedDetails = orderIds.map((id) => ({ id }));

    try {
      const res = await fetch("/api/store-manager/settle-orders", {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ orderDetails: formattedDetails, paymentMethod }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.manual) {
          // Store invoice created manually and wallet balance deducted
          setPaymentSuccessData({ invoiceId: data.invoiceId });
          fetchOrders();
        } else if (data.payLink) {
          window.location.href = data.payLink;
          setPaymentModalOpen(false);
          setSelectedOrders([]);
          return;
        }
      } else {
        // Fallback for online payment: If serverless timeout occurs on backend, attempt direct bankkalaha proxy connection from client
        if (paymentMethod === 'ONLINE' && data?.invoiceId) {
          try {
            const invoiceId = data.invoiceId;
            const totalAmountRials = Math.round((data.totalAmount || 0) * 10);
            const merchantCode = data.merchantCode || "6a0213e61b27742a09938588";
            const callbackUrl = `${window.location.origin}/api/public/store-invoice/callback?invoiceId=${invoiceId}`;

            const directRes = await fetch("https://bankkalaha.ir/zibal-proxy.php", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Proxy-Secret-Key": "ZopitSec_9f84b13a7c6e25d0e81f72ac39014b",
              },
              body: JSON.stringify({
                action: "request",
                merchant: merchantCode,
                amount: totalAmountRials,
                callbackUrl: callbackUrl,
                description: `تسویه فاکتور فروشگاه #${invoiceId}`,
                orderId: String(invoiceId),
              }),
            });

            const directData = await directRes.json().catch(() => null);
            if (directData && (Number(directData.result) === 100 || directData.trackId)) {
              const trackId = directData.trackId;
              const payLink = `https://gateway.zibal.ir/start/${trackId}`;
              window.location.href = payLink;
              setPaymentModalOpen(false);
              setSelectedOrders([]);
              return;
            }
          } catch (directErr) {
            console.error("Direct payment proxy attempt failed:", directErr);
          }
        }

        setPaymentError(data.error || "خطا در ارتباط با درگاه پرداخت");
      }
    } catch (err) {
      setPaymentError(
        "خطای شبکه در ارتباط با سرور. لطفاً اتصال خود را بررسی کنید.",
      );
    } finally {
      setPaymentSubmitting(false);
    }
  };
  const getStatusText = (status: string) => {
    const statusMap: any = {
      NEW: "جدید",
      PENDING_PAYMENT: "۴. در انتظار پرداخت",
      WAITING_SUPPLIER_CONFIRMATION: "۱. در انتظار تایید تأمین‌کننده",
      WAITING_STORE_ADDRESS: "۲. در انتظار ثبت آدرس",
      SUPPLIER_APPROVED: "۱. در انتظار تایید تأمین‌کننده",
      WAITING_SHIPPING_COST: "۳. در انتظار برآورد هزینه پستی",
      WAITING_SHIPPING_PAYMENT: "۴. در انتظار پرداخت",
      SHIPPING_PAID: "هزینه ارسال پرداخت شده",
      PENDING_POSTAL_LABEL: "۵. در انتظار لیبل پستی",
      READY_TO_SHIP: "۵. در انتظار لیبل پستی",
      SHIPPED: "۶. تکمیل شده و باید ارسال شود",
      DELIVERED: "تکمیل شده (تحویل شده)",
      COMPLETED: "۶. تکمیل شده و باید ارسال شود",
      CANCELLED: "لغو شده",
      REJECTED: "رد شده",
      REQUESTED: "۱. در انتظار تایید تأمین‌کننده",
      WAITING_FOR_PAYMENT: "۴. در انتظار پرداخت",
      PAID: "۵. در انتظار لیبل پستی",
      PROCESSING: "۶. تکمیل شده و باید ارسال شود",
      PREPARING: "۵. در انتظار لیبل پستی"
    };
    return statusMap[status] || status;
  };
  const getStatusColor = (status: string) => {
    const colorMap: any = {
      NEW: "text-muted bg-background",
      PENDING_PAYMENT: "text-warning bg-warning/10",
      WAITING_SUPPLIER_CONFIRMATION: "text-purple-600 bg-purple-50",
      WAITING_STORE_ADDRESS: "text-blue-600 bg-surface",
      WAITING_SHIPPING_COST: "text-blue-600 bg-surface",
      WAITING_SHIPPING_PAYMENT: "text-warning bg-warning/10",
      PENDING_POSTAL_LABEL: "text-indigo-600 bg-indigo-50",
      READY_TO_SHIP: "text-success bg-success/10",
      SHIPPED: "text-primary-default bg-primary-default/10",
      DELIVERED: "text-success bg-success/10",
      REQUESTED: "text-warning bg-warning/10",
      SUPPLIER_APPROVED: "text-blue-600 bg-surface",
      WAITING_FOR_PAYMENT: "text-purple-600 bg-purple-50",
      PAID: "text-success bg-success/10",
      PROCESSING: "text-primary-default bg-primary-default/10",
      PREPARING: "text-primary-default bg-primary-default/10",
      COMPLETED: "text-success bg-success/10",
      CANCELLED: "text-error bg-error/10",
      REJECTED: "text-error bg-error/10",
    };
    return colorMap[status] || "text-muted bg-background";
  };
  const isOrderPayable = (order: any) => {
    const paidStatuses = ["PAID", "PROCESSING", "PREPARING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED", "REJECTED"];
    if (paidStatuses.includes(order.status)) return false;
    return order.storeInvoiceId === null || order.storeInvoice?.status === "PENDING";
  };

  const payableOrders = orders.filter(isOrderPayable);

  const getOrderSupplierId = (order: any): number | null => {
    if (order.items && order.items.length > 0) {
      return order.items[0].product?.supplierId || order.items[0].supplierId || null;
    }
    return null;
  };

  const handleToggleOrderSelection = (order: any) => {
    const orderId = order.id;
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    } else {
      const targetSupplierId = getOrderSupplierId(order);
      const firstSelectedOrder = orders.find((o) => selectedOrders.includes(o.id));
      if (firstSelectedOrder) {
        const firstSupplierId = getOrderSupplierId(firstSelectedOrder);
        if (firstSupplierId && targetSupplierId && firstSupplierId !== targetSupplierId) {
          toast("جهت محاسبه دقیق هزینه ارسال، لطفاً سفارش‌های مربوط به یک تأمین‌کننده را به صورت گروهی برای تسویه انتخاب کنید.", "info");
          return;
        }
      }
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-5 rounded-2xl shadow-sm border border-subtle gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            سفارشات
          </h2>
          <p className="text-sm text-muted mt-1">مدیریت، تسویه‌حساب و پیگیری لحظه‌ای سفارشات فروشگاه</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            className="bg-success/10 text-success hover:bg-success/20 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-emerald-200 cursor-pointer shadow-sm shadow-emerald-50"
          >
            <FileText className="w-5 h-5" /> خروجی اکسل (CSV)
          </button>
          <button
            onClick={() => {
              setError(null);
              setShowModal(true);
            }}
            className="bg-primary-default text-inverse px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-hover transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> ثبت سفارش
          </button>
        </div>
      </div>
      {selectedOrders.length > 0 && (
        <div className="bg-success/10 border border-emerald-200/50 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-success text-inverse rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-emerald-900 text-sm">
                تعداد {selectedOrders.length} سفارش جهت پرداخت گروهی انتخاب شده
                است.
              </p>
              <p className="text-xs text-success mt-0.5">
                مجموع کل قابل پرداخت:
                <span className="font-extrabold text-sm text-emerald-950">
                  {orders
                    .filter((o) => selectedOrders.includes(o.id))
                    .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
                    .toLocaleString()}
                </span>
                تومان
              </p>
            </div>
          </div>
          <button
            onClick={handleBatchPaymentClick}
            className="w-full md:w-auto bg-success text-inverse px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-200"
          >
            <CreditCard className="w-4 h-4" /> فاکتورسازی و پرداخت آنلاین (
            {selectedOrders.length} سفارش)
          </button>
        </div>
      )}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-primary-default animate-spin" />
        </div>
      ) : (
        <div className="bg-card rounded-3xl shadow-sm border border-subtle overflow-hidden">
          {orders.length === 0 ? (
            <div className="text-center py-20 text-muted">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>هیچ سفارشی ثبت نشده است</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-background text-muted">
                  <tr>
                    <th className="py-4 px-6 w-12 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-default text-primary-default focus:ring-primary-default w-4 h-4 cursor-pointer"
                        checked={
                          payableOrders.length > 0 &&
                          selectedOrders.length === payableOrders.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedOrders(payableOrders.map((o) => o.id));
                          } else {
                            setSelectedOrders([]);
                          }
                        }}
                      />
                    </th>
                    <th className="py-4 px-6 font-semibold">شناسه سفارش</th>
                    <th className="py-4 px-6 font-semibold">اقلام</th>
                    <th className="py-4 px-6 font-semibold">مبلغ کل (تومان)</th>
                    <th className="py-4 px-6 font-semibold">وضعیت</th>
                    <th className="py-4 px-6 font-semibold">تاریخ ثبت</th>
                    <th className="py-4 px-6 font-semibold text-center">
                      عملیات
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => {
                    const isPayable = isOrderPayable(order);
                    const isSelected = selectedOrders.includes(order.id);
                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-background/50 transition-colors ${isSelected ? "bg-primary-default/10/30" : ""}`}
                      >
                        <td className="py-4 px-6 text-center">
                          {isPayable ? (
                            <input
                              type="checkbox"
                              className="rounded border-default text-primary-default focus:ring-primary-default w-4 h-4 cursor-pointer"
                              checked={isSelected}
                              onChange={() => handleToggleOrderSelection(order)}
                            />
                          ) : (
                            <span className="text-inverse text-xs">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6 font-sans font-bold text-primary">
                          #{Number(order.id).toLocaleString('fa-IR')}
                        </td>
                        <td className="py-4 px-6 text-muted font-sans">
                          {order.items?.map((item: any) => {
                            let variantLabel = "";
                            if (item.variant) {
                              try {
                                const parsed = typeof item.variant.attributes === "string" 
                                  ? JSON.parse(item.variant.attributes) 
                                  : item.variant.attributes;
                                if (parsed && Object.keys(parsed).length > 0) {
                                  variantLabel = Object.entries(parsed)
                                    .map(([k, v]) => `${k}: ${v}`)
                                    .join(" | ");
                                }
                              } catch (e) {}
                            }
                            return (
                              <div key={item.id} className="flex flex-col gap-0.5 mb-1 last:mb-0">
                                <div className="font-bold text-primary text-xs">
                                  {item.product?.name} <span className="text-muted font-normal">{(item.quantity || 1).toLocaleString('fa-IR')}×</span>
                                </div>
                                {variantLabel && (
                                  <div className="text-[10px] text-primary-default bg-primary-default/5 px-1.5 py-0.5 rounded-md inline-block w-fit font-semibold">
                                    {variantLabel}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </td>
                        <td className="py-4 px-6 font-sans font-bold text-primary">
                          {Number(order.totalAmount || 0).toLocaleString('fa-IR')}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(order.status)}`}
                          >
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-muted">
                          {new Date(order.createdAt).toLocaleDateString(
                            "fa-IR",
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => setSelectedOrderForDetails(order)}
                              className="bg-primary-default/10 hover:bg-primary-default/20 text-primary-hover px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> جزئیات سفارش
                            </button>
                            {isPayable && (
                              <button
                                onClick={() => handlePaymentClick(order.id)}
                                className="bg-success/20 text-success hover:bg-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <CreditCard className="w-4 h-4" /> پرداخت
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {showModal && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-card rounded-3xl w-full max-w-xl shadow-2xl p-6 md:p-8 my-8 text-right relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 border-b border-subtle pb-4">
              <h3 className="text-xl font-black text-primary">
                ثبت سفارش جدید
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted hover:bg-surface p-2 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateOrder} className="space-y-6">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3 rounded-xl text-xs leading-relaxed font-bold text-right">
                🚚 نکته هزینه ارسال: محصولاتی که از یک تامین‌کننده یکسان خریداری شوند، هزینه ارسال مشترک و تجمیعی خواهند داشت و در قالب یک مرسوله گروهی فرستاده می‌شوند.
              </div>
              {/* Product Search and Selector */}
              <div>
                <label className="block text-sm font-bold text-secondary mb-2">
                  ۱. انتخاب محصول از زوپیت
                </label>
                {/* Search Box */}
                <div className="relative mb-3">
                  <input
                    type="text"
                    placeholder="جستجوی نام کالا یا شناسه (SKU)..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full bg-background border border-subtle rounded-xl pr-10 pl-4 py-2.5 text-xs focus:ring-2 focus:ring-primary-default outline-none transition-all"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted">
                    <span className="text-xs">🔍</span>
                  </div>
                </div>
                <div className="max-h-52 overflow-y-auto space-y-2 border border-subtle p-2 rounded-xl bg-background">
                  {myCatalog.length === 0 && (
                    <div className="text-center py-6 text-xs text-muted">
                      زوپیتی شما خالی است
                    </div>
                  )}
                  {myCatalog.length > 0 &&
                    myCatalog.filter(
                      (sel) =>
                        sel.product.name
                          .toLowerCase()
                          .includes(productSearch.toLowerCase()) ||
                        (sel.product.sku &&
                          sel.product.sku
                            .toLowerCase()
                            .includes(productSearch.toLowerCase())),
                    ).length === 0 && (
                      <div className="text-center py-6 text-xs text-muted">
                        محصولی با این مشخصات یافت نشد
                      </div>
                    )}
                  {myCatalog
                    .filter(
                      (sel) =>
                        sel.product.name
                          .toLowerCase()
                          .includes(productSearch.toLowerCase()) ||
                        (sel.product.sku &&
                          sel.product.sku
                            .toLowerCase()
                            .includes(productSearch.toLowerCase())),
                    )
                    .map((sel) => {
                      const isSelected =
                        selectedProduct === sel.productId.toString();
                      return (
                        <div
                          key={sel.productId}
                          onClick={() =>
                            setSelectedProduct(sel.productId.toString())
                          }
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${isSelected ? "border-primary-default bg-primary-default/10/70 ring-2 ring-primary-default/10" : "border-subtle hover:bg-surface bg-card"}`}
                        >
                          <div className="w-12 h-12 bg-surface rounded-lg overflow-hidden flex-shrink-0 border border-subtle">
                            {sel.product.images?.length > 0 ? (
                              <img
                                src={sel.product.images[0].url}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-muted bg-background">
                                <ShoppingCart className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-primary truncate">
                              {sel.product.name}
                            </h4>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[10px] text-muted font-mono">
                                SKU: {sel.product.sku || "-"}
                              </span>
                              <span className="text-[10px] text-primary-default font-bold bg-primary-default/10 px-1.5 py-0.5 rounded">
                                موجودی: {sel.product.inventory}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-5 h-5 bg-primary-default text-inverse rounded-full flex items-center justify-center flex-shrink-0">
                              <Check className="w-3.5 h-3.5" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
              {/* Variant Selector */}
              {(() => {
                const selectedProdObj = myCatalog.find(
                  (sel) => sel.productId.toString() === selectedProduct
                )?.product;
                if (!selectedProdObj || !selectedProdObj.variants || selectedProdObj.variants.length === 0) {
                  return null;
                }
                return (
                  <div>
                    <label className="block text-sm font-bold text-secondary mb-2">
                      انتخاب متغیر کالا (الزامی)
                    </label>
                    <select
                      className="w-full bg-background border border-subtle rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary-default outline-none text-primary font-bold"
                      value={selectedVariantId}
                      onChange={(e) => setSelectedVariantId(e.target.value)}
                      required
                    >
                      <option value="">-- لطفاً یک متغیر انتخاب کنید --</option>
                      {selectedProdObj.variants.map((v: any) => {
                        let displayAttrs = "ساده / پیش‌فرض";
                        try {
                          const parsed = typeof v.attributes === "string" 
                            ? JSON.parse(v.attributes) 
                            : v.attributes;
                          if (parsed && Object.keys(parsed).length > 0) {
                            displayAttrs = Object.entries(parsed)
                              .map(([k, val]) => `${k}: ${val}`)
                              .join(" | ");
                          }
                        } catch (e) {}
                        return (
                          <option key={v.id} value={v.id.toString()}>
                            {displayAttrs} (موجودی: {v.stock} عدد | قیمت: {v.finalPrice?.toLocaleString()} تومان)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                );
              })()}
              {/* Quantity */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-bold text-secondary mb-2">
                    ۲. تعداد سفارش
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-background border border-subtle rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary-default outline-none"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    required
                  />
                </div>
              </div>
              {/* Order Notes */}
              <div>
                <label className="block text-sm font-bold text-secondary mb-2">
                  ۳. یادداشت برای تامین‌کننده (اختیاری)
                </label>
                <textarea
                  className="w-full bg-background border border-subtle rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary-default outline-none"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="رنگ، سایز، بسته‌بندی ویژه یا نکات اضطراری مرسوله..."
                />
              </div>

              {error && (
                <div className="bg-danger/10 border border-rose-200 text-danger p-3.5 rounded-xl text-xs font-bold leading-relaxed">
                  {error}
                </div>
              )}
              {/* Submit / Cancel buttons */}
              <div className="pt-4 border-t border-subtle flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-xs text-muted bg-surface hover:bg-surface transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedProduct}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-xs text-inverse bg-primary-default hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "در حال ثبت..." : "ثبت نهایی سفارش"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200 text-right">
            {paymentSuccessData ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-16 h-16 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <Check className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-primary">
                  فاکتور با موفقیت صادر شد! 🎉
                </h3>
                <p className="text-sm text-muted leading-relaxed px-2">
                  سفارشات شما با موفقیت به فاکتور رسمی
                  <strong className="text-primary-default">
                    INV-{paymentSuccessData.invoiceId}
                  </strong>
                  تبدیل شد.
                </p>
                <div className="bg-primary-default/10 text-primary-hover p-4 rounded-xl text-xs text-right space-y-2 border border-primary-default/30 leading-relaxed">
                  <p className="font-bold text-sm mb-1 text-primary-hover">
                    مراحل بعدی پرداخت:
                  </p>
                  <p>
                    ۱. سیستم اکنون شما را به بخش
                    <strong className="text-primary-hover font-bold">
                      «صورت‌حساب‌ها»
                    </strong>
                    منتقل می‌کند.
                  </p>
                  <p>
                    ۲. در آنجا می‌توانید مشخصات دقیق بانکی (شماره کارت و شبا) را
                    به همراه دکمه کپی آسان مشاهده کنید.
                  </p>
                  <p>
                    ۳. پس از انتقال وجه به آن حساب، تصویر فیش واریزی را در همان
                    فاکتور بارگذاری نمایید تا فاکتور شما تایید نهایی شود.
                  </p>
                </div>
                <div className="pt-4 space-y-3">
                  <p className="text-xs text-muted">
                    انتقال خودکار به بخش صورت‌حساب‌ها در
                    <span className="font-bold text-primary-default font-mono text-sm">
                      {countdown}
                    </span>
                    ثانیه...
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={closePaymentModal}
                      className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-muted bg-surface hover:bg-surface transition-all"
                    >
                      بستن و ماندن
                    </button>
                    <button
                      onClick={handleClosePaymentModalAndRedirect}
                      className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-inverse bg-primary-default hover:bg-primary-hover transition-all shadow-md shadow-indigo-100"
                    >
                      انتقال فوری به صورت‌حساب‌ها
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-primary">
                    انتخاب روش پرداخت
                  </h3>
                  <button
                    onClick={closePaymentModal}
                    disabled={paymentSubmitting}
                    className="text-muted hover:text-muted disabled:opacity-50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                  <div className="bg-background border border-subtle rounded-xl p-4 space-y-3">
                    <h4 className="font-bold text-sm text-primary border-b border-subtle pb-2">
                      سفارش‌های در حال تسویه
                    </h4>
                    {Object.keys(orderDetails).map((orderIdStr) => {
                      const id = parseInt(orderIdStr);
                      const orderItem = orders.find((o) => o.id === id);
                      if (!orderItem) return null;
                      const productSummary = orderItem.items && orderItem.items.length > 0
                        ? orderItem.items.map((i: any) => `${i.product?.name || 'کالا'} (${(i.quantity || 1).toLocaleString('fa-IR')} عدد)`).join(' + ')
                        : (orderItem.product?.name ? `${orderItem.product?.name} (${(orderItem.quantity || 1).toLocaleString('fa-IR')} عدد)` : `سفارش #${id}`);
                      return (
                        <div
                          key={id}
                          className="flex justify-between items-center text-xs text-muted py-1 border-b border-subtle/40 last:border-b-0"
                        >
                          <span className="font-medium text-slate-700">
                            سفارش #{Number(id).toLocaleString('fa-IR')}: {productSummary}
                          </span>
                          <span className="font-bold text-primary font-sans">
                            {(orderItem.totalAmount || 0).toLocaleString('fa-IR')}{" "}
                            تومان
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 border-t border-border-default/50">
                    <label className="block text-sm font-bold text-secondary mb-3">
                      روش پرداخت نهایی
                    </label>
                    <div className="space-y-4">
                      <label
                        className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "ONLINE" ? "border-success bg-success/10" : "border-subtle hover:border-emerald-200"} ${paymentSubmitting ? "pointer-events-none opacity-50" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="ONLINE"
                            checked={paymentMethod === "ONLINE"}
                            onChange={() => setPaymentMethod("ONLINE")}
                            disabled={paymentSubmitting}
                            className="text-success focus:ring-success w-4 h-4 cursor-pointer"
                          />
                          <div>
                            <p className="font-bold text-primary">
                              پرداخت آنلاین (درگاه زیبال)
                            </p>
                            <p className="text-sm text-muted mt-1">
                              انتقال سریع و خودکار به درگاه پرداخت
                            </p>
                          </div>
                        </div>
                      </label>
                      {enableCardToCard && (
                        <label
                          className={`block p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === "MANUAL" ? "border-primary-default bg-primary-default/10" : "border-subtle hover:border-primary-default/30"} ${paymentSubmitting ? "pointer-events-none opacity-50" : ""}`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="MANUAL"
                              checked={paymentMethod === "MANUAL"}
                              onChange={() => setPaymentMethod("MANUAL")}
                              disabled={paymentSubmitting}
                              className="text-primary-default focus:ring-primary-default w-4 h-4 cursor-pointer"
                            />
                            <div>
                              <p className="font-bold text-primary">
                                روش دوم: پرداخت کارت به کارت / واریز بانکی
                              </p>
                              <p className="text-sm text-muted mt-1">
                                ثبت فاکتور پرداخت دستی و بارگذاری فیش واریز بانکی
                              </p>
                            </div>
                          </div>
                        </label>
                      )}
                      {enableCardToCard && paymentMethod === "MANUAL" && (
                        <div className="bg-primary-default/10 text-primary-hover p-4 rounded-xl text-sm leading-relaxed border border-primary-default/30 animate-fade-in text-right">
                          <p className="font-bold mb-2 text-primary-hover">
                            مراحل پرداخت کارت به کارت / بانکی:
                          </p>
                          <p className="text-xs text-primary-hover leading-relaxed">
                            با انتخاب این روش، فاکتور شما صادر می‌شود. پس از آن
                            کافیست به بخش
                            <strong className="text-primary-hover font-bold">
                              «صورت‌حساب‌ها»
                            </strong>
                            بروید، شماره کارت و شماره شبای بانکی را در آنجا
                            مشاهده کرده و پس از واریز وجه، تصویر فیش واریزی خود
                            را در همان بخش بارگذاری نمایید تا فاکتور و سفارشات
                            شما نهایی و تایید شوند.
                          </p>
                        </div>
                      )}
                      {paymentError && (
                        <div className="bg-danger/10 border border-rose-200 text-danger p-3 rounded-xl text-xs font-bold leading-relaxed text-right animate-shake">
                          {paymentError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-8">
                  <button
                    onClick={closePaymentModal}
                    disabled={paymentSubmitting}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-muted bg-surface hover:bg-surface transition-colors disabled:opacity-50"
                  >
                    انصراف
                  </button>
                  <button
                    onClick={processPayment}
                    disabled={paymentSubmitting}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-inverse bg-success hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-100 disabled:opacity-75"
                  >
                    {paymentSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> در حال
                        ثبت...
                      </>
                    ) : (
                      "تایید و ادامه"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {/* Visual Order Details and Status Tracking Timeline Modal */}
      {selectedOrderForDetails && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 overflow-y-auto"
          dir="rtl"
        >
          <div className="bg-card rounded-3xl max-w-4xl w-full p-6 lg:p-8 shadow-2xl relative animate-scale-up my-8 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-subtle pb-5 mb-6">
              <div>
                <h3 className="text-xl font-extrabold text-primary">
                  جزئیات و رهگیری سفارش #{selectedOrderForDetails.id}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(
                      selectedOrderForDetails.createdAt,
                    ).toLocaleDateString("fa-IR")}
                  </span>
                  <span className="w-1 h-1 bg-surface rounded-full"></span>
                  <span>
                    وضعیت پرداخت:{" "}
                    {["PAID", "PROCESSING", "PREPARING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(selectedOrderForDetails.status)
                      ? "پرداخت شده"
                      : selectedOrderForDetails.storeInvoiceId && selectedOrderForDetails.storeInvoice?.status === "PENDING"
                      ? "در انتظار واریز / ثبت فیش"
                      : "پرداخت نشده (نیازمند صدور فاکتور)"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrderForDetails(null)}
                className="w-10 h-10 rounded-xl hover:bg-surface text-muted hover:text-muted flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Visual Status Tracking Timeline */}
            <div className="mb-8">
              <OrderTimeline orderId={selectedOrderForDetails.id} />
            </div>

            {/* Order Items Table */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-secondary">
                اقلام و فرآورده‌های سفارش داده شده:
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-subtle overflow-hidden">
                <table className="w-full text-sm text-right">
                  <thead className="bg-background text-muted">
                    <tr>
                      <th className="py-3 px-4 font-bold">نام محصول</th>
                      <th className="py-3 px-4 font-bold text-center">تعداد</th>
                      <th className="py-3 px-4 font-bold">مبلغ واحد (تومان)</th>
                      <th className="py-3 px-4 font-bold">مبلغ کل (تومان)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedOrderForDetails.items?.map((item: any) => {
                      let variantLabel = "";
                      if (item.variant) {
                        try {
                          const parsed = typeof item.variant.attributes === "string" 
                            ? JSON.parse(item.variant.attributes) 
                            : item.variant.attributes;
                          if (parsed && Object.keys(parsed).length > 0) {
                            variantLabel = Object.entries(parsed)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(" | ");
                          }
                        } catch (e) {}
                      }
                      return (
                        <tr key={item.id} className="hover:bg-background/50">
                          <td className="py-3 px-4 font-semibold text-primary">
                            <div>
                              <div>{item.product?.name}</div>
                              {variantLabel && (
                                <div className="text-[10px] text-primary-default bg-primary-default/5 px-2 py-0.5 rounded-md mt-1 inline-block font-semibold">
                                  {variantLabel}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-secondary">
                            {item.quantity}
                          </td>
                          <td className="py-3 px-4 font-mono text-muted">
                            {(item.price || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-primary">
                            {((item.price || 0) * item.quantity).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Footing Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 pt-6 border-t border-subtle text-sm">
              <div className="space-y-3">
                <div className="bg-card p-4 rounded-2xl border border-emerald-500/30 space-y-1.5 text-right shadow-sm">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold block">
                    🚚 کد شناسه ارائه‌دهنده خدمت:
                  </span>
                  <p className="font-mono font-black text-sm text-text-primary">
                    {(() => {
                      const supp = selectedOrderForDetails.items?.[0]?.product?.supplier;
                      if (!supp) return "کد ارائه‌دهنده نامشخص";
                      return `کد شناسه ارائه‌دهنده: #${supp.id}`;
                    })()}
                  </p>
                  {(selectedOrderForDetails.items?.[0]?.product?.supplier?.province || selectedOrderForDetails.items?.[0]?.product?.supplier?.city) && (
                    <p className="text-xs text-text-muted pt-1.5 border-t border-border-subtle font-medium">
                      موقعیت استان انبار: {selectedOrderForDetails.items?.[0]?.product?.supplier?.province || ''}، {selectedOrderForDetails.items?.[0]?.product?.supplier?.city || ''}
                    </p>
                  )}
                </div>
                {/* Shipping Section - Restricted to WAITING_STORE_ADDRESS, WAITING_SHIPPING_COST, PENDING_PAYMENT, PAID and later statuses */}
                {!(
                  selectedOrderForDetails.status === "WAITING_STORE_ADDRESS" ||
                  selectedOrderForDetails.status === "WAITING_SHIPPING_COST" ||
                  selectedOrderForDetails.status === "PENDING_PAYMENT" ||
                  selectedOrderForDetails.status === "PENDING_POSTAL_LABEL" ||
                  selectedOrderForDetails.status === "PAID" ||
                  selectedOrderForDetails.status === "PROCESSING" ||
                  selectedOrderForDetails.status === "PREPARING" ||
                  selectedOrderForDetails.status === "SHIPPED" ||
                  selectedOrderForDetails.status === "DELIVERED" ||
                  selectedOrderForDetails.status === "COMPLETED"
                ) ? (
                  <div className="p-4 bg-background border border-subtle/60 rounded-2xl space-y-2 mt-4 text-center">
                    <Truck className="w-8 h-8 text-muted mx-auto animate-pulse" />
                    <h5 className="font-bold text-xs text-secondary">
                      بخش لجستیک و اطلاعات پستی غیرفعال است
                    </h5>
                    <p className="text-[10px] text-muted leading-relaxed max-w-sm mx-auto">
                      طبق قوانین پلتفرم، خدمات لجستیک، کد رهگیری، و تولید لیبل
                      پستی تنها پس از تایید پذیرش تامین‌کننده، صدور فاکتور
                      نهایی، و مشخص شدن هزینه ارسال در دسترس قرار می‌گیرد.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-primary-default/10/40 border border-primary-default/20 rounded-2xl space-y-3.5 mt-4">
                    <div className="flex items-center gap-1.5 border-b border-primary-default/20 pb-2">
                      <Truck className="w-4 h-4 text-primary-default" />
                      <h5 className="font-bold text-primary-hover text-xs">
                        اطلاعات لجستیک و مرسوله پستی
                      </h5>
                    </div>
                    {selectedOrderForDetails.status === "WAITING_STORE_ADDRESS" || selectedOrderForDetails.status === "WAITING_SHIPPING_COST" ? (
                      !selectedOrderForDetails.shippingAddress ? (
                        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex flex-col items-center justify-center gap-3">
                          <p className="text-amber-700 text-xs font-bold text-center">
                            جهت برآورد هزینه پستی توسط مدیریت مجموعه، ابتدا آدرس مقصد و روش ارسال مورد نظر خود را ثبت نمایید.
                          </p>
                          <button
                            onClick={() => {
                              setSelectedShippingOrder(selectedOrderForDetails);
                              setShowShippingModal(true);
                            }}
                            className="bg-primary-default text-inverse px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer"
                          >
                            تکمیل مشخصات پستی و روش ارسال
                          </button>
                        </div>
                      ) : (
                        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex flex-col gap-2.5">
                          <p className="text-blue-700 text-xs font-bold text-center">
                            مشخصات پستی با موفقیت ثبت شد. در انتظار محاسبه و ثبت هزینه پستی (کرایه) توسط مدیر کل پلتفرم.
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs border-t border-blue-500/10 pt-2 text-muted">
                            <div>
                              <span className="text-muted block mb-0.5">نشانی گیرنده:</span>
                              <span className="font-bold text-primary">{selectedOrderForDetails.shippingAddress}</span>
                            </div>
                            <div>
                              <span className="text-muted block mb-0.5">روش ارسال انتخاب شده:</span>
                              <span className="font-bold text-primary">
                                {["POST", "POST_PISHTAZ"].includes(selectedOrderForDetails.shippingMethod || "") ? "پست پیشتاز" :
                                 ["POST_VIZHE", "POST_EXPRESS"].includes(selectedOrderForDetails.shippingMethod || "") ? "پست ویژه (اکسپرس)" :
                                 selectedOrderForDetails.shippingMethod === "TIPAX" ? "تیپاکس" :
                                 selectedOrderForDetails.shippingMethod === "PERSONAL_PANEL" ? "پنل پستی اختصاصی" : "پنل ارسال پلتفرم"}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedShippingOrder(selectedOrderForDetails);
                              setShowShippingModal(true);
                            }}
                            className="mt-1 text-primary-default hover:text-primary-hover text-[11px] font-bold self-start cursor-pointer hover:underline"
                          >
                            ویرایش مشخصات ارسال
                          </button>
                        </div>
                      )
                    ) : selectedOrderForDetails.status === "PENDING_PAYMENT" ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-col gap-2.5">
                        <p className="text-emerald-800 text-xs font-bold text-center">
                          هزینه پستی (کرایه) توسط مدیریت مشخص گردید. لطفاً برای نهایی‌سازی سفارش، اقدام به پرداخت صورت‌حساب نمایید.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs border-t border-emerald-500/10 pt-2 text-muted">
                          <div>
                            <span className="text-muted block mb-0.5">نشانی گیرنده:</span>
                            <span className="font-bold text-primary">{selectedOrderForDetails.shippingAddress}</span>
                          </div>
                          <div>
                            <span className="text-muted block mb-0.5">روش ارسال:</span>
                            <span className="font-bold text-primary">
                              {["POST", "POST_PISHTAZ"].includes(selectedOrderForDetails.shippingMethod || "") ? "پست پیشتاز" :
                               ["POST_VIZHE", "POST_EXPRESS"].includes(selectedOrderForDetails.shippingMethod || "") ? "پست ویژه (اکسپرس)" :
                               selectedOrderForDetails.shippingMethod === "TIPAX" ? "تیپاکس" :
                               selectedOrderForDetails.shippingMethod === "PERSONAL_PANEL" ? "پنل پستی اختصاصی" : "پنل ارسال پلتفرم"}
                            </span>
                          </div>
                          <div className="md:col-span-2">
                            <span className="text-muted block mb-0.5">هزینه محاسبه شده ارسال:</span>
                            <span className="font-bold text-primary-default font-mono text-sm">
                              {selectedOrderForDetails.shippingFee ? `${selectedOrderForDetails.shippingFee.toLocaleString()} تومان` : "رایگان / برآورد نشده"}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedShippingOrder(selectedOrderForDetails);
                            setShowShippingModal(true);
                          }}
                          className="mt-1 text-primary-default hover:text-primary-hover text-[11px] font-bold self-start cursor-pointer hover:underline"
                        >
                          ویرایش مشخصات ارسال
                        </button>
                      </div>
                    ) : selectedOrderForDetails.status === "PAID" && !selectedOrderForDetails.shippingAddress ? (
                      <div className="bg-warning/10 border border-warning/30 p-4 rounded-xl flex flex-col items-center justify-center gap-3">
                        <p className="text-warning-dark text-xs font-bold text-center">
                          برای ورود به مرحله ارسال، لطفاً اطلاعات پستی را تکمیل نمایید.
                        </p>
                        <button
                          onClick={() => {
                            setSelectedShippingOrder(selectedOrderForDetails);
                            setShowShippingModal(true);
                          }}
                          className="bg-primary-default text-inverse px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors cursor-pointer"
                        >
                          تکمیل مشخصات پستی
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-muted">
                          <div>
                            <span className="text-muted block mb-0.5">
                              نشانی گیرنده:
                            </span>
                            <span className="font-bold text-primary">
                              {selectedOrderForDetails.shippingAddress ||
                                "نشانی پیش‌فرض فروشگاه"}
                            </span>
                          </div>
                           <div>
                             <span className="text-muted block mb-0.5">
                               روش ارسال:
                             </span>
                             <span className="font-bold text-primary">
                               {["POST", "POST_PISHTAZ"].includes(selectedOrderForDetails.shippingMethod || "") ? "پست پیشتاز" :
                                ["POST_VIZHE", "POST_EXPRESS"].includes(selectedOrderForDetails.shippingMethod || "") ? "پست ویژه (اکسپرس)" :
                                selectedOrderForDetails.shippingMethod === "TIPAX" ? "تیپاکس" :
                                selectedOrderForDetails.shippingMethod === "PERSONAL_PANEL" ? "پنل پستی اختصاصی" : "پنل ارسال پلتفرم"}
                             </span>
                           </div>
                          <div>
                            <span className="text-muted block mb-0.5">
                              کد رهگیری مرسوله:
                            </span>
                            <span className="font-mono font-bold text-primary-hover">
                              {selectedOrderForDetails.trackingCode ||
                                `IR-${selectedOrderForDetails.id}09218475293`}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted block mb-0.5">
                              وضعیت حمل و نقل:
                            </span>
                            <span className="px-2 py-0.5 bg-primary-default/20 text-primary-hover rounded font-bold text-[10px]">
                              {selectedOrderForDetails.status === "PAID"
                                ? "آماده جهت بسته‌بندی"
                                : selectedOrderForDetails.status === "PROCESSING" || selectedOrderForDetails.status === "PREPARING"
                                  ? "در حال آماده‌سازی پستی"
                                  : selectedOrderForDetails.status === "SHIPPED"
                                    ? "تحویل به پستچی (ارسال شده)"
                                    : "تحویل داده شده"}
                            </span>
                          </div>
                        </div>
                        {/* Generate Shipping Label (Upload Label) */}
                        {selectedOrderForDetails.status === "PAID" ? (
                          selectedOrderForDetails.shippingMethod === "PERSONAL_PANEL" &&
                          !selectedOrderForDetails.postalLabel && (
                            <div className="pt-2 border-t border-primary-default/20/30">
                              <p className="text-[11px] font-bold text-primary-hover mb-1.5 flex items-center gap-1">
                                <Plus className="w-3.5 h-3.5" /> صدور لیبل جدید:
                              </p>
                              <div className="relative border border-dashed border-primary-default/40 hover:border-primary-default rounded-xl p-3 bg-card text-center transition-colors cursor-pointer">
                                <input
                                  type="file"
                                  accept=".pdf,image/*"
                                  className="absolute inset-0 opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                     const file = e.target.files?.[0];
                                     if (!file) return;
                                     toast("در حال بارگذاری و پردازش لیبل...", "error");
                                     const reader = new FileReader();
                                     reader.onloadend = async () => {
                                       const base64Data = reader.result as string;
                                       try {
                                         const res = await fetch(
                                           `/api/orders/${selectedOrderForDetails.id}/label`,
                                           {
                                             credentials: "include",
                                             method: "POST",
                                             headers: {
                                               "Content-Type": "application/json",
                                               Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                                             },
                                             body: JSON.stringify({
                                               labelUrl: base64Data,
                                             }),
                                           },
                                         );
                                         if (!res.ok) throw new Error("خطا");
                                         toast("لیبل با موفقیت بارگذاری شد.", "success");
                                         fetchOrders(); // Refresh orders
                                         setSelectedOrderForDetails({
                                           ...selectedOrderForDetails,
                                           postalLabel: `/api/orders/${selectedOrderForDetails.id}/postal-label/file`,
                                         });
                                       } catch (err) {
                                         toast("خطا در بارگذاری لیبل", "error");
                                       }
                                     };
                                     reader.readAsDataURL(file);
                                   }}
                                />
                                <div className="text-[10px] text-primary-hover font-bold">
                                  کلیک کنید یا فایل لیبل (PDF) را جهت بارگذاری و
                                  تولید بکشید
                                </div>
                              </div>
                            </div>
                          )
                        ) : (
                          selectedOrderForDetails.shippingMethod === "PERSONAL_PANEL" && (
                            <div className="pt-2 border-t border-primary-default/20/30 text-center py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-[11px] text-zinc-500 font-bold">
                              امکان بارگذاری لیبل پستی پس از پرداخت سفارش فعال خواهد شد.
                            </div>
                          )
                        )}
                        {/* Print Shipping Label */}
                        {selectedOrderForDetails.postalLabel ? (
                          <div className="pt-2 border-t border-primary-default/20/30 flex justify-between items-center bg-primary-default/20/20 p-2.5 rounded-xl border border-primary-default/20/40">
                            <span className="text-primary-hover font-bold text-[11px]">
                              {selectedOrderForDetails.shippingMethod === "PERSONAL_PANEL"
                                ? "لیبل پستی اختصاصی شما:"
                                : "لیبل صادر شده توسط پلتفرم:"}
                            </span>
                            <a
                              href={selectedOrderForDetails.postalLabel}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-primary-default hover:bg-primary-hover text-inverse text-[10px] font-bold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              <Printer className="w-3.5 h-3.5" /> مشاهده و چاپ
                              لیبل پستی
                            </a>
                          </div>
                        ) : (
                          selectedOrderForDetails.shippingMethod === "PLATFORM_PANEL" && (
                            <div className="pt-2 border-t border-primary-default/20/30 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl text-center">
                              <p className="text-[11px] font-bold text-amber-700 flex items-center justify-center gap-1">
                                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
                                در انتظار صدور و بارگذاری لیبل پستی توسط مدیریت مجموعه
                              </p>
                            </div>
                          )
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="bg-background p-4 rounded-2xl space-y-2 border border-subtle">
                <div className="flex justify-between text-muted text-xs">
                  <span>مجموع ارزش کالاها:</span>
                  <span>
                    {selectedOrderForDetails.totalAmount?.toLocaleString()}
                    تومان
                  </span>
                </div>
                <div className="flex justify-between text-muted text-xs">
                  <span>هزینه حمل و نقل و مالیات:</span>
                  <span className="text-success font-semibold">رایگان</span>
                </div>
                <div className="h-px bg-surface my-2"></div>
                <div className="flex justify-between text-primary font-extrabold text-base">
                  <span>مبلغ قابل پرداخت:</span>
                  <span className="text-primary-default font-mono">
                    {selectedOrderForDetails.totalAmount?.toLocaleString()}
                    تومان
                  </span>
                </div>
              </div>
            </div>
            {/* Action buttons */}
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setSelectedOrderForDetails(null)}
                className="flex-1 py-3 bg-surface hover:bg-surface text-secondary font-bold rounded-xl text-sm transition-colors cursor-pointer text-center"
              >
                بستن پنجره جزئیات
              </button>
              <button
                onClick={() => printOrderInvoice(selectedOrderForDetails)}
                className="flex-1 py-3 bg-primary-default/10 hover:bg-primary-default/20 text-primary-hover border border-primary-default/30 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-5 h-5" /> دریافت فاکتور رسمی (PDF)
              </button>
              
            {selectedOrderForDetails.status === "WAITING_SHIPPING_PAYMENT" && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/store-manager/shipping/${selectedOrderForDetails.id}/pay`, {
                        method: 'POST',
                        headers: {
                          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
                        }
                      });
                      const data = await res.json();
                      if (res.ok && data.payLink) {
                        window.location.href = data.payLink;
                      } else {
                        toast(data.error || 'خطا در پرداخت هزینه ارسال', 'error');
                      }
                    } catch (e) {
                      toast('خطای شبکه', 'error');
                    }
                  }}
                  className="bg-primary-default text-inverse font-bold text-sm px-6 py-2.5 rounded-xl hover:bg-primary-hover transition-colors shadow-md"
                >
                  پرداخت آنلاین هزینه ارسال
                </button>
              </div>
            )}

            {!["PAID", "PROCESSING", "PREPARING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED", "REJECTED"].includes(selectedOrderForDetails.status) &&
             (selectedOrderForDetails.storeInvoiceId === null || selectedOrderForDetails.storeInvoice?.status === "PENDING") && (
                  <button
                    onClick={() => {
                      const id = selectedOrderForDetails.id;
                      setSelectedOrderForDetails(null);
                      handlePaymentClick(id);
                    }}
                    className="flex-1 py-3 bg-primary-default hover:bg-primary-hover text-inverse font-bold rounded-xl text-sm shadow-lg shadow-primary-default/10 transition-all cursor-pointer text-center"
                  >
                    اقدام به پرداخت صورت‌حساب
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

{/* Complete Shipping Details Modal */}
      {showShippingModal && selectedShippingOrder && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => {
            setShowShippingModal(false);
            setSelectedShippingOrder(null);
          }}
          dir="rtl"
        >
          <div
            className="bg-card rounded-3xl w-full max-w-xl shadow-2xl p-6 md:p-8 my-8 text-right relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6 border-b border-subtle pb-4">
              <h3 className="text-xl font-black text-primary">
                تکمیل مشخصات ارسال پستی
              </h3>
              <button
                onClick={() => {
                  setShowShippingModal(false);
                  setSelectedShippingOrder(null);
                }}
                className="text-muted hover:bg-surface p-2 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 p-3.5 rounded-xl text-xs leading-relaxed font-bold text-right mb-2">
                🚚 توجه مهم: طبق ضوابط، کالاهایی که از یک تامین‌کننده هستند، در یک بسته تجمیع شده و هزینه ارسال آن‌ها با هم محاسبه می‌گردد.
              </div>
              <div className="mb-4">
                <label className="block text-xs font-black text-secondary mb-1.5 flex items-center gap-1">
                  روش ارسال <span className="text-danger">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  <label className={`flex items-center gap-2 text-xs font-black px-3.5 py-2.5 rounded-xl cursor-pointer border transition-all duration-200 ${shippingMethod === "POST_PISHTAZ" || shippingMethod === "POST" ? "text-emerald-600 bg-emerald-500/5 border-emerald-500/30" : "text-muted bg-surface border-subtle hover:border-emerald-200"}`}>
                    <input type="radio" name="shipMethod" value="POST_PISHTAZ" checked={shippingMethod === "POST_PISHTAZ" || shippingMethod === "POST"} onChange={(e) => setShippingMethod(e.target.value)} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                    پست پیشتاز
                  </label>
                  <label className={`flex items-center gap-2 text-xs font-black px-3.5 py-2.5 rounded-xl cursor-pointer border transition-all duration-200 ${shippingMethod === "POST_VIZHE" || shippingMethod === "POST_EXPRESS" ? "text-emerald-600 bg-emerald-500/5 border-emerald-500/30" : "text-muted bg-surface border-subtle hover:border-emerald-200"}`}>
                    <input type="radio" name="shipMethod" value="POST_VIZHE" checked={shippingMethod === "POST_VIZHE" || shippingMethod === "POST_EXPRESS"} onChange={(e) => setShippingMethod(e.target.value)} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                    پست ویژه (اکسپرس)
                  </label>
                  <label className={`flex items-center gap-2 text-xs font-black px-3.5 py-2.5 rounded-xl cursor-pointer border transition-all duration-200 ${shippingMethod === "TIPAX" ? "text-emerald-600 bg-emerald-500/5 border-emerald-500/30" : "text-muted bg-surface border-subtle hover:border-emerald-200"}`}>
                    <input type="radio" name="shipMethod" value="TIPAX" checked={shippingMethod === "TIPAX"} onChange={(e) => setShippingMethod(e.target.value)} className="w-4 h-4 text-emerald-600 focus:ring-emerald-500" />
                    تیپاکس
                  </label>
                </div>
              </div>

              <div className="mb-4 bg-primary-default/5 p-3 rounded-xl border border-primary-default/20 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="storeAddressCheck"
                  className="w-4 h-4 text-primary-default bg-background border-subtle rounded focus:ring-primary-default focus:ring-2"
                  checked={shippingAddressType === "STORE_ADDRESS"}
                  onChange={async (e) => {
                    const isChecked = e.target.checked;
                    setShippingAddressType(isChecked ? "STORE_ADDRESS" : "OTHER_ADDRESS");
                    if (isChecked) {
                      let currentUserObj = user;
                      if (!currentUserObj) {
                        try {
                          const storedUser = localStorage.getItem("user");
                          if (storedUser) currentUserObj = JSON.parse(storedUser);
                        } catch (err) {
                          console.error("Error parsing user from localStorage:", err);
                        }
                      }

                      if (currentUserObj) {
                        setShippingRecipientName(`${currentUserObj.firstName || ""} ${currentUserObj.lastName || ""}`.trim() || "مدیر فروشگاه");
                        setShippingRecipientPhone(currentUserObj.mobile || "");
                        setShippingAddressDetail(currentUserObj.address || "");
                        toast("مشخصات آدرس فروشگاه شما بارگذاری شد. لطفاً استان، شهر و کد پستی را تکمیل نمایید.", "info");
                      } else {
                        try {
                          const token = localStorage.getItem("token") || "";
                          const res = await fetch("/api/auth/me", {
                            credentials: "include",
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          if (res.ok) {
                            const data = await res.json();
                            const fetchedUser = data.user;
                            if (fetchedUser) {
                              setShippingRecipientName(`${fetchedUser.firstName || ""} ${fetchedUser.lastName || ""}`.trim() || "مدیر فروشگاه");
                              setShippingRecipientPhone(fetchedUser.mobile || "");
                              setShippingAddressDetail(fetchedUser.address || "");
                              toast("مشخصات آدرس فروشگاه شما بارگذاری شد. لطفاً استان، شهر و کد پستی را تکمیل نمایید.", "info");
                            }
                          }
                        } catch (err) {
                          console.error("Error auto-filling store profile:", err);
                        }
                      }
                    } else {
                      setShippingRecipientName("");
                      setShippingRecipientPhone("");
                      setShippingAddressDetail("");
                      setShippingProvince("");
                      setShippingCity("");
                      setShippingPostalCode("");
                    }
                  }}
                />
                <label htmlFor="storeAddressCheck" className="text-xs font-bold text-primary-hover cursor-pointer">
                  ارسال به آدرس فروشگاه (تکمیل خودکار اطلاعات پروفایل)
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-secondary mb-1.5 flex items-center gap-1">
                    نام گیرنده <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="نام و نام خانوادگی گیرنده مرسوله"
                    value={shippingRecipientName}
                    onChange={(e) => setShippingRecipientName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-primary-default"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-secondary mb-1.5 flex items-center gap-1">
                    شماره تماس گیرنده <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 09123456789"
                    value={shippingRecipientPhone}
                    onChange={(e) => setShippingRecipientPhone(e.target.value)}
                    className="w-full px-4 py-2.5 bg-background border rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-primary-default"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-xs font-black text-secondary mb-1.5 flex items-center gap-1">
                    استان <span className="text-danger">*</span>
                  </label>
                  <select
                    required
                    value={shippingProvince}
                    onChange={(e) => {
                      setShippingProvince(e.target.value);
                      setShippingCity("");
                    }}
                    className="w-full px-4 py-2.5 bg-background border rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-primary-default"
                  >
                    <option value="">انتخاب استان...</option>
                    {PROVINCES.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-secondary mb-1.5 flex items-center gap-1">
                    شهر <span className="text-danger">*</span>
                  </label>
                  <select
                    required
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    disabled={!shippingProvince}
                    className="w-full px-4 py-2.5 bg-background border rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-primary-default disabled:opacity-50"
                  >
                    <option value="">انتخاب شهر...</option>
                    {shippingProvince &&
                      (PROVINCES.find((p) => p.name === shippingProvince)?.cities || []).map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-secondary mb-1.5 flex items-center gap-1">
                    کد پستی <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    placeholder="کد پستی ۱۰ رقمی"
                    value={shippingPostalCode}
                    onChange={(e) => setShippingPostalCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-2.5 bg-background border rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-primary-default"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-xs font-black text-secondary mb-1.5 flex items-center gap-1">
                  آدرس دقیق <span className="text-danger">*</span>
                </label>
                <textarea
                  required
                  placeholder="خیابان، کوچه، پلاک، واحد و جزئیات دقیق آدرس پستی"
                  value={shippingAddressDetail}
                  onChange={(e) => setShippingAddressDetail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-background border rounded-xl text-xs text-primary focus:outline-none focus:ring-2 focus:ring-primary-default min-h-[80px]"
                />
              </div>

              <div className="flex gap-3 mt-8 pt-4 border-t border-subtle">
                <button
                  onClick={() => {
                    setShowShippingModal(false);
                    setSelectedShippingOrder(null);
                  }}
                  className="px-6 py-3 bg-surface hover:bg-slate-200 text-secondary font-bold rounded-xl text-xs transition-colors"
                >
                  انصراف
                </button>
                <button
                  onClick={async () => {
                    // Strict manual validations for accuracy
                    if (!["POST", "POST_PISHTAZ", "POST_VIZHE", "POST_EXPRESS", "TIPAX"].includes(shippingMethod)) {
                      toast("لطفاً یکی از روش‌های ارسال معتبر را انتخاب نمایید.", "error");
                      return;
                    }
                    if (!shippingRecipientName || shippingRecipientName.trim().length < 2) {
                      toast("نام گیرنده معتبر نیست (باید حداقل ۲ حرف باشد).", "error");
                      return;
                    }
                    const cleanPhone = shippingRecipientPhone.trim();
                    const iranianPhoneRegex = /^09\d{9}$/;
                    const landlinePhoneRegex = /^0\d{10}$/;
                    if (!cleanPhone || (!iranianPhoneRegex.test(cleanPhone) && !landlinePhoneRegex.test(cleanPhone))) {
                      toast("شماره تماس گیرنده نامعتبر است. نمونه صحیح: 09123456789 یا 02188888888", "error");
                      return;
                    }
                    if (!shippingProvince) {
                      toast("لطفاً استان را انتخاب کنید.", "error");
                      return;
                    }
                    if (!shippingCity) {
                      toast("لطفاً شهر را انتخاب کنید.", "error");
                      return;
                    }
                    const cleanPostal = shippingPostalCode.trim();
                    const postalCodeRegex = /^\d{10}$/;
                    if (!cleanPostal || !postalCodeRegex.test(cleanPostal)) {
                      toast("کد پستی باید دقیقاً یک عدد ۱۰ رقمی باشد.", "error");
                      return;
                    }
                    if (!shippingAddressDetail || shippingAddressDetail.trim().length < 10) {
                      toast("آدرس دقیق خیلی کوتاه است. لطفاً جزئیات کامل شامل خیابان، کوچه و پلاک را بنویسید (حداقل ۱۰ حرف).", "error");
                      return;
                    }

                    setSubmitting(true);
                    try {
                      const finalAddress = `${shippingProvince}، ${shippingCity}، ${shippingAddressDetail} (کد پستی: ${shippingPostalCode}) - گیرنده: ${shippingRecipientName} - تماس: ${shippingRecipientPhone}`;
                      
                      const res = await fetch(`/api/store-manager/orders/${selectedShippingOrder.id}/shipping`, {
                        method: "PUT",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${localStorage.getItem("token")}`
                        },
                        body: JSON.stringify({
                          shippingMethod,
                          shippingAddressType,
                          shippingAddress: finalAddress,
                          recipientName: shippingRecipientName,
                          recipientPhone: shippingRecipientPhone,
                          province: shippingProvince,
                          city: shippingCity,
                          postalCode: shippingPostalCode,
                          addressDetail: shippingAddressDetail
                        })
                      });
                      if (res.ok) {
                        setShowShippingModal(false);
                        setSelectedShippingOrder(null);
                        setSelectedOrderForDetails(null);
                        fetchOrders();
                        toast("مشخصات پستی مرسوله با موفقیت ثبت شد و سفارش در انتظار محاسبه هزینه ارسال قرار گرفت.", "success");
                      } else {
                        toast("خطا در بروزرسانی اطلاعات پستی", "error");
                      }
                    } catch (err) {
                      toast("خطای شبکه", "error");
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-xs text-inverse bg-primary-default hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer text-center"
                >
                  {submitting ? "در حال ثبت..." : "تایید و ثبت آدرس"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
