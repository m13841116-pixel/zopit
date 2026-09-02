import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
import OrderTimeline from "../OrderTimeline";
import { PROVINCES } from "../../data/provinces";
import { useMobileScrollLock } from "../../hooks/useMobileScrollLock";
import { requestClientSideZibalPayment } from "../../services/payment/clientPaymentBridge";
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
  Printer,
  Clock,
  Trash2,
  AlertTriangle,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  Globe,
  Search,
  CheckCircle2,
  DollarSign,
  Store,
  Tag,
  Sparkles,
  Phone,
  PackageCheck
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

  // Tabs and Filters State
  const [orderTab, setOrderTab] = useState<"ALL" | "MANUAL" | "WOOCOMMERCE">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [syncingWoo, setSyncingWoo] = useState<boolean>(false);

  const [myCatalog, setMyCatalog] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState<string>("");
  const [orderItems, setOrderItems] = useState<Array<{
    productId: number;
    productName: string;
    variantId: number | null;
    variantName?: string;
    quantity: number;
    price: number;
    supplierId: number;
    supplierName: string;
    image?: string;
  }>>([]);

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
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [issueCategory, setIssueCategory] = useState<"LOGISTICS" | "SUPPLIER" | "FINANCIAL" | "OTHER">("LOGISTICS");
  const [issueText, setIssueText] = useState("");
  const [submittingIssue, setSubmittingIssue] = useState(false);

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
  const handleAddItemToOrder = () => {
    if (!selectedProduct) {
      setError("لطفاً ابتدا یک کالا را انتخاب کنید");
      return;
    }
    const selObj = myCatalog.find((sel) => sel.productId.toString() === selectedProduct);
    if (!selObj || !selObj.product) {
      setError("کالای انتخاب شده معتبر نیست");
      return;
    }
    const prod = selObj.product;
    const prodSupId = Number(prod.supplierId || prod.supplier?.id || 0);

    // Check supplier consistency
    if (orderItems.length > 0) {
      const existingSupId = Number(orderItems[0].supplierId);
      if (existingSupId > 0 && prodSupId > 0 && existingSupId !== prodSupId) {
        setError("تمامی کالاهای یک سفارش باید از یک تامین‌کننده باشند. جهت ثبت سفارش از تامین‌کننده دیگر، سفارش مجزا ثبت کنید.");
        return;
      }
    }

    let variantName = "";
    let finalPrice = prod.finalPrice || prod.supplierBasePrice || 0;
    let vIdParsed: number | null = null;

    if (selectedVariantId) {
      vIdParsed = parseInt(selectedVariantId);
      const variantObj = prod.variants?.find((v: any) => v.id === vIdParsed);
      if (variantObj) {
        if (variantObj.finalPrice) finalPrice = variantObj.finalPrice;
        try {
          const parsedAttrs = typeof variantObj.attributes === "string" ? JSON.parse(variantObj.attributes) : variantObj.attributes;
          variantName = Object.entries(parsedAttrs || {}).map(([k, val]) => `${k}: ${val}`).join(" | ");
        } catch (e) {}
      }
    } else if (prod.variants && prod.variants.length > 0) {
      setError("این کالا دارای تنوع/متغیر است. لطفاً یک متغیر را انتخاب کنید.");
      return;
    }

    setError(null);
    setOrderItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.productId === prod.id && i.variantId === vIdParsed);
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx].quantity += quantity;
        return copy;
      }
      return [
        ...prev,
        {
          productId: prod.id,
          productName: prod.name,
          variantId: vIdParsed,
          variantName,
          quantity,
          price: finalPrice,
          supplierId: prodSupId,
          supplierName: prod.supplier?.companyName || prod.supplierName || `تامین‌کننده SUP-${1000 + prodSupId}`,
          image: prod.images && prod.images[0]?.url,
        },
      ];
    });

    setSelectedProduct("");
    setSelectedVariantId("");
    setQuantity(1);
  };

  const handleUseStoreAddressForNewOrder = () => {
    if (user) {
      if (user.storeName || user.firstName) {
        setShippingRecipientName(`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.storeName || '');
      }
      if (user.mobile) {
        setShippingRecipientPhone(user.mobile);
      }
      if (user.province) {
        setShippingProvince(user.province);
      }
      if (user.city) {
        setShippingCity(user.city);
      }
      if (user.postalCode) {
        setShippingPostalCode(user.postalCode);
      }
      if (user.address) {
        setShippingAddressDetail(user.address);
      }
      toast("اطلاعات فروشگاه در فیلدهای آدرس درج شد.", "info");
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    let finalItems = [...orderItems];

    if (finalItems.length === 0 && selectedProduct) {
      const selObj = myCatalog.find((sel) => sel.productId.toString() === selectedProduct);
      if (selObj && selObj.product) {
        const prod = selObj.product;
        const prodSupId = Number(prod.supplierId || prod.supplier?.id || 0);
        let vIdParsed: number | null = selectedVariantId ? parseInt(selectedVariantId) : null;
        let finalPrice = prod.finalPrice || prod.supplierBasePrice || 0;
        let variantName = "";
        if (vIdParsed) {
          const variantObj = prod.variants?.find((v: any) => v.id === vIdParsed);
          if (variantObj) {
            if (variantObj.finalPrice) finalPrice = variantObj.finalPrice;
            try {
              const parsedAttrs = typeof variantObj.attributes === "string" ? JSON.parse(variantObj.attributes) : variantObj.attributes;
              variantName = Object.entries(parsedAttrs || {}).map(([k, val]) => `${k}: ${val}`).join(" | ");
            } catch (e) {}
          }
        }
        finalItems.push({
          productId: prod.id,
          productName: prod.name,
          variantId: vIdParsed,
          variantName,
          quantity: quantity || 1,
          price: finalPrice,
          supplierId: prodSupId,
          supplierName: prod.supplier?.companyName || prod.supplierName || "",
          image: prod.images && prod.images[0]?.url,
        });
      }
    }

    if (finalItems.length === 0) {
      setError("لطفاً حداقل یک کالا را به سفارش اضافه کنید.");
      return;
    }

    // Validate recipient and shipping address
    if (!shippingRecipientName || shippingRecipientName.trim().length < 2) {
      setError("لطفاً نام و نام‌خانوادگی تحویل‌گیرنده را وارد کنید.");
      return;
    }
    const cleanPhone = shippingRecipientPhone.trim();
    const iranianPhoneRegex = /^09\d{9}$/;
    const landlinePhoneRegex = /^0\d{10}$/;
    if (!cleanPhone || (!iranianPhoneRegex.test(cleanPhone) && !landlinePhoneRegex.test(cleanPhone))) {
      setError("شماره تماس گیرنده نامعتبر است (مثال: 09123456789).");
      return;
    }
    if (!shippingProvince) {
      setError("لطفاً استان مقصد را انتخاب نمایید.");
      return;
    }
    if (!shippingCity) {
      setError("لطفاً شهر مقصد را وارد کنید.");
      return;
    }
    const cleanPostal = shippingPostalCode.trim();
    if (!cleanPostal || cleanPostal.length !== 10 || !/^\d{10}$/.test(cleanPostal)) {
      setError("کد پستی باید دقیقاً یک عدد ۱۰ رقمی باشد.");
      return;
    }
    if (!shippingAddressDetail || shippingAddressDetail.trim().length < 8) {
      setError("لطفاً آدرس پستی دقیق شامل خیابان، کوچه و پلاک را بنویسید (حداقل ۸ حرف).");
      return;
    }

    const fullShippingAddress = `${shippingProvince}، ${shippingCity}، ${shippingAddressDetail} (کد پستی: ${cleanPostal}) - گیرنده: ${shippingRecipientName} - تماس: ${cleanPhone}`;

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
          items: finalItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            notes,
          })),
          notes,
          shippingAddressType,
          shippingAddress: fullShippingAddress,
          shippingMethod,
          recipientName: shippingRecipientName,
          recipientPhone: cleanPhone,
          province: shippingProvince,
          city: shippingCity,
          postalCode: cleanPostal,
          addressDetail: shippingAddressDetail,
          postalLabel: null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowModal(false);
        setOrderItems([]);
        setSelectedProduct("");
        setSelectedVariantId("");
        setQuantity(1);
        setNotes("");
        fetchOrders();
        toast("سفارش شما با موفقیت ثبت شد و در صف برآورد هزینه ارسال قرار گرفت.", "success");
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

  const handleReportIssue = async () => {
    if (!selectedOrderForDetails) return;
    if (!issueText || issueText.trim().length < 5) {
      toast("لطفاً شرح مشکل یا پیگیری را با جزئیات وارد کنید.", "error");
      return;
    }
    setSubmittingIssue(true);
    try {
      const categoryTitles: Record<string, string> = {
        LOGISTICS: "پیگیری مشکل لجستیکی و ارسال پستی",
        SUPPLIER: "گزارش مغایرت یا عدم ارسال تامین‌کننده",
        FINANCIAL: "درخواست بررسی و هماهنگی مالی / تسویه",
        OTHER: "پیگیری سفارش",
      };
      const title = `[سفارش #${selectedOrderForDetails.id}] ${categoryTitles[issueCategory] || "پیگیری سفارش"}`;
      const res = await fetch("/api/store-manager/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({
          title,
          category: issueCategory === "LOGISTICS" ? "ORDER_STATUS" : issueCategory === "FINANCIAL" ? "FINANCIAL" : "PRODUCT_INQUIRY",
          message: `شناسه سفارش: #${selectedOrderForDetails.id}\nدسته‌بندی موضوع: ${categoryTitles[issueCategory]}\n\nتوضیحات و شرح مشکل:\n${issueText.trim()}`,
          orderId: selectedOrderForDetails.id,
        }),
      });
      if (res.ok) {
        toast("گزارش مشکل شما ثبت شد و جهت بررسی در اولویت کارشناسان پشتیبانی قرار گرفت.", "success");
        setShowReportIssue(false);
        setIssueText("");
        setIssueCategory("LOGISTICS");
      } else {
        toast("خطا در ثبت گزارش مشکل", "error");
      }
    } catch (e) {
      toast("خطای شبکه در ارتباط با سرور", "error");
    } finally {
      setSubmittingIssue(false);
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const res = await fetch("/api/store-manager/settle-orders", {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
        body: JSON.stringify({ orderDetails: formattedDetails, paymentMethod }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const resText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(resText);
      } catch (parseErr) {
        console.error("Failed to parse settle-orders response:", resText);
      }

      if (res.ok) {
        if (data.manual) {
          // Store invoice created manually and wallet balance deducted
          setPaymentSuccessData({ invoiceId: data.invoiceId });
          fetchOrders();
        } else if (data.payLink) {
          toast("در حال انتقال به درگاه پرداخت زیبال...", "info");
          window.location.assign(data.payLink);
          setTimeout(() => {
            setPaymentModalOpen(false);
            setSelectedOrders([]);
          }, 1000);
          return;
        } else if (data.clientPaymentRequired && data.invoiceId) {
          toast("در حال دریافت شناسه پرداخت از درگاه زیبال...", "info");
          const clientRes = await requestClientSideZibalPayment({
            invoiceId: data.invoiceId,
            amountInRials: data.amountInRials,
            merchant: data.merchant,
            callbackUrl: data.callbackUrl,
            description: data.description,
          });

          if (clientRes.success && clientRes.payLink) {
            toast("در حال انتقال به درگاه پرداخت زیبال...", "info");
            window.location.assign(clientRes.payLink);
            setTimeout(() => {
              setPaymentModalOpen(false);
              setSelectedOrders([]);
            }, 1000);
            return;
          } else {
            setPaymentError(clientRes.error || "خطا در اتصال به درگاه پرداخت زیبال. لطفاً دوباره تلاش کنید.");
          }
        } else {
          setPaymentError(data.error || "لینک درگاه پرداخت دریافت نشد. لطفاً دوباره تلاش کنید.");
        }
      } else {
        setPaymentError(data.error || "خطا در ارتباط با درگاه پرداخت");
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      if (err.name === 'AbortError') {
        setPaymentError("زمان پاسخگویی سرور به پایان رسید. لطفاً مجدداً دکمه «تایید و ادامه» را فشار دهید.");
      } else {
        setPaymentError(
          err?.message || "خطای شبکه در ارتباط با سرور. لطفاً اتصال خود را بررسی کنید.",
        );
      }
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
      NEW: "text-slate-700 bg-slate-100 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      PENDING_PAYMENT: "text-amber-800 bg-amber-50 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60",
      WAITING_SUPPLIER_CONFIRMATION: "text-purple-800 bg-purple-50 border border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-700/60",
      WAITING_STORE_ADDRESS: "text-blue-800 bg-blue-50 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700/60",
      WAITING_SHIPPING_COST: "text-sky-800 bg-sky-50 border border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-700/60",
      WAITING_SHIPPING_PAYMENT: "text-amber-800 bg-amber-50 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60",
      PENDING_POSTAL_LABEL: "text-indigo-800 bg-indigo-50 border border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700/60",
      READY_TO_SHIP: "text-emerald-800 bg-emerald-50 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60",
      SHIPPED: "text-indigo-900 bg-indigo-100/80 border border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-200 dark:border-indigo-700",
      DELIVERED: "text-emerald-900 bg-emerald-100/80 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700",
      REQUESTED: "text-amber-800 bg-amber-50 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60",
      SUPPLIER_APPROVED: "text-blue-800 bg-blue-50 border border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700/60",
      WAITING_FOR_PAYMENT: "text-amber-800 bg-amber-50 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60",
      PAID: "text-emerald-800 bg-emerald-50 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60",
      PROCESSING: "text-indigo-800 bg-indigo-50 border border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700/60",
      PREPARING: "text-indigo-800 bg-indigo-50 border border-indigo-300 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-700/60",
      COMPLETED: "text-emerald-900 bg-emerald-100/80 border border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700",
      CANCELLED: "text-rose-800 bg-rose-50 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700/60",
      REJECTED: "text-rose-800 bg-rose-50 border border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700/60",
    };
    return colorMap[status] || "text-slate-700 bg-slate-100 border border-slate-300 dark:bg-slate-800 dark:text-slate-300";
  };

  const isOrderPayable = (order: any) => {
    // طبق منطق پلتفرم، تنها سفارش‌هایی که توسط تامین‌کننده تایید شده و در وضعیت «در انتظار پرداخت» قرار دارند قابل پرداخت هستند
    const payableStatuses = [
      "PENDING_PAYMENT",
      "WAITING_FOR_PAYMENT",
      "WAITING_SHIPPING_PAYMENT"
    ];
    if (!payableStatuses.includes(order.status)) return false;
    return order.storeInvoiceId === null || order.storeInvoice?.status === "PENDING";
  };

  const isWooOrder = (order: any) => {
    return (
      (order.orderSource || "").toLowerCase().includes("woocommerce") ||
      (order.customerName || "").includes("WC-#")
    );
  };

  const handleSyncWooCommerceOrders = async () => {
    try {
      setSyncingWoo(true);
      const token = localStorage.getItem("token");
      const res = await fetch("/api/store/sync/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        toast(`همگام‌سازی ووکامرس انجام شد (${data.ordersSynced || data.successCount || 0} سفارش بررسی شد)`, "success");
        fetchOrders();
      } else {
        toast(data.error || "خطا در همگام‌سازی سفارشات با وب‌سایت ووکامرس", "error");
      }
    } catch (err) {
      toast("خطا در ارتباط با سرور ووکامرس", "error");
    } finally {
      setSyncingWoo(false);
    }
  };

  const manualOrdersCount = orders.filter((o) => !isWooOrder(o)).length;
  const wooOrdersCount = orders.filter(isWooOrder).length;

  const filteredOrders = orders.filter((order) => {
    const isWoo = isWooOrder(order);
    if (orderTab === "MANUAL" && isWoo) return false;
    if (orderTab === "WOOCOMMERCE" && !isWoo) return false;

    if (statusFilter !== "ALL") {
      if (statusFilter === "PAYABLE" && !isOrderPayable(order)) return false;
      if (
        statusFilter === "WAITING" &&
        !["WAITING_STORE_ADDRESS", "WAITING_SHIPPING_COST", "REQUESTED", "WAITING_SUPPLIER_CONFIRMATION", "SUPPLIER_APPROVED"].includes(order.status)
      ) return false;
      if (
        statusFilter === "PAID" &&
        !["PAID", "PENDING_POSTAL_LABEL", "READY_TO_SHIP"].includes(order.status)
      ) return false;
      if (
        statusFilter === "SHIPPED" &&
        !["SHIPPED", "PROCESSING", "PREPARING", "DELIVERED", "COMPLETED"].includes(order.status)
      ) return false;
      if (
        statusFilter === "CANCELLED" &&
        !["CANCELLED", "REJECTED"].includes(order.status)
      ) return false;
    }

    if (dateFilter !== "ALL") {
      const orderDate = new Date(order.createdAt).getTime();
      const now = Date.now();
      const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
      if (dateFilter === "TODAY" && diffDays > 1) return false;
      if (dateFilter === "3DAYS" && diffDays > 3) return false;
      if (dateFilter === "7DAYS" && diffDays > 7) return false;
      if (dateFilter === "30DAYS" && diffDays > 30) return false;
    }

    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      const matchId = String(order.id).includes(s);
      const matchCustomer =
        (order.customerName || "").toLowerCase().includes(s) ||
        (order.customerPhone || "").includes(s);
      const matchItem = order.items?.some((i: any) =>
        (i.product?.name || "").toLowerCase().includes(s)
      );
      if (!matchId && !matchCustomer && !matchItem) return false;
    }

    return true;
  });

  const activeFiltersCount =
    (statusFilter !== "ALL" ? 1 : 0) +
    (dateFilter !== "ALL" ? 1 : 0) +
    (searchTerm.trim() ? 1 : 0);

  const payableOrders = filteredOrders.filter(isOrderPayable);

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
    <div className="space-y-6 animate-fade-in text-right">
      {/* Top Header */}
      <div className="bg-card p-5 sm:p-6 rounded-3xl shadow-sm border border-subtle flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-black text-primary flex items-center gap-2.5">
              <ShoppingCart className="w-6 h-6 text-primary-default" />
              مدیریت سفارشات
            </h2>
            <p className="text-xs text-muted mt-1 font-medium">
              پیگیری فرآیند آماده‌سازی، تسویه‌حساب گروهی و ارسال مرسولات به مشتریان نهایی
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
            {/* Filter Toggle Button (Top-Left in LTR, Top-Right in RTL flex) */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                showFilters || activeFiltersCount > 0
                  ? "bg-primary-default/10 text-primary-hover border-primary-default/30 shadow-xs"
                  : "bg-surface hover:bg-surface-hover text-secondary border-border-subtle"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>فیلترها</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary-default text-inverse text-[10px] font-black flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <button
              onClick={handleExportCSV}
              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-emerald-500/30 cursor-pointer"
            >
              <FileText className="w-4 h-4" /> خروجی اکسل
            </button>

            <button
              onClick={() => {
                setError(null);
                setShowModal(true);
              }}
              className="bg-primary-default text-inverse px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> ثبت سفارش جدید
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-t border-subtle pt-4 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setOrderTab("ALL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              orderTab === "ALL"
                ? "bg-primary-default text-inverse shadow-sm"
                : "bg-surface text-muted hover:text-primary hover:bg-surface-hover"
            }`}
          >
            <span>همه سفارشات</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${orderTab === "ALL" ? "bg-white/20 text-white" : "bg-card text-muted"}`}>
              {orders.length}
            </span>
          </button>

          <button
            onClick={() => setOrderTab("MANUAL")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              orderTab === "MANUAL"
                ? "bg-primary-default text-inverse shadow-sm"
                : "bg-surface text-muted hover:text-primary hover:bg-surface-hover"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>سفارشات دستی و پلتفرم</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${orderTab === "MANUAL" ? "bg-white/20 text-white" : "bg-card text-muted"}`}>
              {manualOrdersCount}
            </span>
          </button>

          <button
            onClick={() => setOrderTab("WOOCOMMERCE")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              orderTab === "WOOCOMMERCE"
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-surface text-muted hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>سفارشات متصل ووکامرس</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${orderTab === "WOOCOMMERCE" ? "bg-white/20 text-white" : "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300"}`}>
              {wooOrdersCount}
            </span>
          </button>
        </div>

        {/* Filter Popover Bar */}
        {showFilters && (
          <div className="bg-surface p-4 rounded-2xl border border-subtle space-y-4 animate-fade-in mt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-primary">
                <SlidersHorizontal className="w-4 h-4 text-primary-default" />
                <span>فیلتر و جستجوی سفارشات</span>
              </div>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => {
                    setStatusFilter("ALL");
                    setDateFilter("ALL");
                    setSearchTerm("");
                  }}
                  className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer"
                >
                  پاک کردن همه فیلترها
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="جستجوی شناسه، مشتری، تلفن، کالا..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-card border border-subtle rounded-xl pr-9 pl-4 py-2 text-xs focus:ring-2 focus:ring-primary-default outline-none text-primary"
                />
                <Search className="w-4 h-4 text-muted absolute right-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* Date Filter */}
              <div>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full bg-card border border-subtle rounded-xl px-3 py-2 text-xs font-bold text-primary focus:ring-2 focus:ring-primary-default outline-none"
                >
                  <option value="ALL">📅 همه زمان‌ها</option>
                  <option value="TODAY">امروز (۲۴ ساعت گذشته)</option>
                  <option value="3DAYS">۳ روز اخیر</option>
                  <option value="7DAYS">یک هفته اخیر</option>
                  <option value="30DAYS">یک ماه اخیر</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-card border border-subtle rounded-xl px-3 py-2 text-xs font-bold text-primary focus:ring-2 focus:ring-primary-default outline-none"
                >
                  <option value="ALL">⚡ همه وضعیت‌ها</option>
                  <option value="PAYABLE">قابل پرداخت</option>
                  <option value="WAITING">در انتظار اقدام (آدرس / برآورد)</option>
                  <option value="PAID">پرداخت شده / لیبل پستی</option>
                  <option value="SHIPPED">ارسال شده / تکمیل شده</option>
                  <option value="CANCELLED">لغو یا رد شده</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* WooCommerce Tab Banner */}
        {orderTab === "WOOCOMMERCE" && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-600 text-white rounded-xl shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-purple-950 dark:text-purple-200">
                  اتصال خودکار وب‌سایت ووکامرسی به زوپیت فعال است
                </p>
                <p className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">
                  سفارشات ثبت‌شده در سایت شما به صورت آنی پردازش و با قیمت عمده تامین‌کننده در این بخش نمایش داده می‌شوند.
                </p>
              </div>
            </div>

            <button
              onClick={handleSyncWooCommerceOrders}
              disabled={syncingWoo}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${syncingWoo ? "animate-spin" : ""}`} />
              <span>{syncingWoo ? "در حال دریافت..." : "همگام‌سازی دستی سفارشات"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Batch Payment Banner */}
      {selectedOrders.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-xl">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                تعداد {selectedOrders.length} سفارش جهت پرداخت گروهی انتخاب شده است.
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                مجموع کل قابل پرداخت:{" "}
                <span className="font-black text-sm font-mono text-emerald-950 dark:text-white">
                  {orders
                    .filter((o) => selectedOrders.includes(o.id))
                    .reduce((sum, o) => sum + (o.totalAmount || 0), 0)
                    .toLocaleString("fa-IR")}
                </span>{" "}
                تومان
              </p>
            </div>
          </div>
          <button
            onClick={handleBatchPaymentClick}
            className="w-full md:w-auto bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <CreditCard className="w-4 h-4" /> فاکتورسازی و پرداخت آنلاین ({selectedOrders.length} سفارش)
          </button>
        </div>
      )}

      {/* Orders List / Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 text-primary-default animate-spin" />
        </div>
      ) : (
        <div className="bg-card rounded-3xl shadow-sm border border-subtle overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-muted space-y-3">
              <ShoppingCart className="w-12 h-12 mx-auto opacity-40 text-muted" />
              <p className="font-bold text-sm text-secondary">هیچ سفارشی در این بخش یافت نشد</p>
              <p className="text-xs text-muted max-w-sm mx-auto">
                {activeFiltersCount > 0
                  ? "با تغییر یا حذف فیلترها می‌توانید سفارشات دیگر را مشاهده کنید."
                  : orderTab === "WOOCOMMERCE"
                  ? "سفارشاتی که مشتریان در سایت ووکامرسی شما ثبت می‌کنند در اینجا قرار خواهند گرفت."
                  : "با کلیک بر روی «ثبت سفارش جدید» سفارش مد نظرتان را ایجاد کنید."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right min-w-[850px]">
                <thead className="bg-surface text-muted border-b border-subtle">
                  <tr>
                    <th className="py-3.5 px-4 w-10 text-center">
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
                    <th className="py-3.5 px-4 font-bold">شناسه و منبع</th>
                    <th className="py-3.5 px-4 font-bold">اقلام سفارش</th>
                    <th className="py-3.5 px-4 font-bold">مشتری / مقصد</th>
                    <th className="py-3.5 px-4 font-bold">مبلغ زوپیت (تومان)</th>
                    <th className="py-3.5 px-4 font-bold">وضعیت</th>
                    <th className="py-3.5 px-4 font-bold">تاریخ ثبت</th>
                    <th className="py-3.5 px-4 font-bold text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-subtle">
                  {filteredOrders.map((order) => {
                    const isPayable = isOrderPayable(order);
                    const isSelected = selectedOrders.includes(order.id);
                    const isWoo = isWooOrder(order);

                    return (
                      <tr
                        key={order.id}
                        className={`hover:bg-surface/50 transition-colors ${
                          isSelected ? "bg-primary-default/5" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4 text-center">
                          {isPayable ? (
                            <input
                              type="checkbox"
                              className="rounded border-default text-primary-default focus:ring-primary-default w-4 h-4 cursor-pointer"
                              checked={isSelected}
                              onChange={() => handleToggleOrderSelection(order)}
                            />
                          ) : (
                            <span className="text-muted text-[10px]">-</span>
                          )}
                        </td>

                        {/* Order ID & Source */}
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono font-bold text-primary text-xs">
                              #{Number(order.id).toLocaleString("fa-IR")}
                            </span>
                            {isWoo ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-md w-fit">
                                <Globe className="w-3 h-3" /> ووکامرس
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md w-fit">
                                <Store className="w-3 h-3" /> ثبت پلتفرم
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Items */}
                        <td className="py-3.5 px-4 text-muted">
                          <div className="max-w-[240px]">
                            {order.items?.map((item: any) => {
                              let variantLabel = "";
                              if (item.variant) {
                                try {
                                  const parsed =
                                    typeof item.variant.attributes === "string"
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
                                <div key={item.id} className="flex flex-col gap-0.5 mb-1.5 last:mb-0">
                                  <div className="font-bold text-primary text-xs truncate">
                                    {item.product?.name}{" "}
                                    <span className="text-muted font-normal">
                                      {(item.quantity || 1).toLocaleString("fa-IR")}×
                                    </span>
                                  </div>
                                  {variantLabel && (
                                    <div className="text-[10px] text-primary-default bg-primary-default/5 px-1.5 py-0.5 rounded-md inline-block w-fit font-medium">
                                      {variantLabel}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* Customer / Address Destination */}
                        <td className="py-3.5 px-4 text-xs">
                          <div className="flex flex-col gap-0.5 max-w-[180px]">
                            <span className="font-bold text-primary truncate">
                              {order.customerName || "مدیر فروشگاه"}
                            </span>
                            {order.customerPhone && (
                              <span className="text-[10px] font-mono text-muted truncate">
                                {order.customerPhone}
                              </span>
                            )}
                            {order.shippingAddress && (
                              <span className="text-[10px] text-muted truncate">
                                {order.shippingAddress.slice(0, 30)}...
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Total Wholesale Price */}
                        <td className="py-3.5 px-4 font-mono font-bold text-primary text-xs">
                          {Number(order.totalAmount || 0).toLocaleString("fa-IR")}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-block whitespace-nowrap ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {getStatusText(order.status)}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-muted text-[11px]">
                          {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedOrderForDetails(order)}
                              className="bg-surface hover:bg-surface-hover text-secondary border border-border-subtle px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" /> جزئیات
                            </button>
                            {isPayable && (
                              <button
                                onClick={() => handlePaymentClick(order.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <CreditCard className="w-3.5 h-3.5" /> پرداخت
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
              <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white p-3.5 rounded-xl text-xs leading-relaxed font-bold text-right shadow-xs">
                🚚 نکته ارسال: تمامی محصولاتی که از یک تامین‌کننده انتخاب می‌کنید در یک سفارش گروهی ثبت و با یک هزینه ارسال مشترک فرستاده می‌شوند.
              </div>

              {/* Added Items List */}
              {orderItems.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between text-xs font-black text-slate-900 dark:text-white">
                    <span className="flex items-center gap-1.5">
                      <ShoppingCart className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      اقلام اضافه شده به این سفارش ({orderItems.length} کالا)
                    </span>
                    <span className="text-[11px] font-mono font-extrabold text-slate-800 dark:text-slate-200 bg-slate-200 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
                      {orderItems[0]?.supplierName}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-48 overflow-y-auto">
                    {orderItems.map((item, idx) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {item.image ? (
                            <img src={item.image} className="w-9 h-9 rounded-lg object-cover shrink-0 border border-slate-300 dark:border-slate-600" alt="" />
                          ) : (
                            <div className="w-9 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
                              <ShoppingCart className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{item.productName}</p>
                            {item.variantName && (
                              <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate">{item.variantName}</p>
                            )}
                            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold mt-0.5">
                              {item.price?.toLocaleString()} تومان × {item.quantity} عدد = {(item.price * item.quantity)?.toLocaleString()} تومان
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOrderItems(prev => prev.filter((_, i) => i !== idx))}
                          className="text-rose-600 hover:text-rose-700 dark:text-rose-400 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/50 cursor-pointer shrink-0 transition-colors"
                          title="حذف کالا"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Search and Selector */}
              <div>
                <label className="block text-sm font-bold text-secondary mb-2">
                  انتخاب کالا از کاتالوگ فروشگاه
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
                <div className="max-h-48 overflow-y-auto space-y-2 border border-subtle p-2 rounded-xl bg-background">
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
                                تامین‌کننده: {sel.product.supplier?.companyName || sel.product.supplierName || `SUP-${1000 + (sel.product.supplierId || sel.product.supplier?.id || 0)}`}
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

              {/* Quantity & Add Button */}
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-secondary mb-2">
                    تعداد سفارش
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-background border border-subtle rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-primary-default outline-none font-bold"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddItemToOrder}
                  disabled={!selectedProduct}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن به اقلام این سفارش</span>
                </button>
              </div>

              {/* Recipient and Shipping Address Section */}
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2.5">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    مشخصات گیرنده و نشانی پستی مقصد (یک آدرس واحد برای تمام اقلام این سفارش)
                  </span>
                  <button
                    type="button"
                    onClick={handleUseStoreAddressForNewOrder}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    ⚡ درج آدرس فروشگاه من
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      نام و نام‌خانوادگی گیرنده <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: علی رضایی"
                      value={shippingRecipientName}
                      onChange={(e) => setShippingRecipientName(e.target.value)}
                      className="w-full bg-background border border-subtle rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-default outline-none font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      شماره تماس گیرنده <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="09123456789"
                      dir="ltr"
                      value={shippingRecipientPhone}
                      onChange={(e) => setShippingRecipientPhone(e.target.value)}
                      className="w-full bg-background border border-subtle rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-default outline-none font-mono text-right"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      استان مقصد <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={shippingProvince}
                      onChange={(e) => {
                        setShippingProvince(e.target.value);
                        setShippingCity("");
                      }}
                      className="w-full bg-background border border-subtle rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-default outline-none font-bold"
                    >
                      <option value="">-- انتخاب استان --</option>
                      {PROVINCES.map((p) => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      شهر مقصد <span className="text-rose-500">*</span>
                    </label>
                    {shippingProvince && PROVINCES.find(p => p.name === shippingProvince)?.cities.length ? (
                      <select
                        required
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                        className="w-full bg-background border border-subtle rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-default outline-none font-bold"
                      >
                        <option value="">-- انتخاب شهر --</option>
                        {PROVINCES.find(p => p.name === shippingProvince)?.cities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        required
                        placeholder="مثال: تهران / اصفهان"
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                        className="w-full bg-background border border-subtle rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-default outline-none font-bold"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      کد پستی (۱۰ رقم) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={10}
                      placeholder="1234567890"
                      dir="ltr"
                      value={shippingPostalCode}
                      onChange={(e) => setShippingPostalCode(e.target.value)}
                      className="w-full bg-background border border-subtle rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-default outline-none font-mono text-right"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      روش ارسال ترجیحی
                    </label>
                    <select
                      value={shippingMethod}
                      onChange={(e) => setShippingMethod(e.target.value)}
                      className="w-full bg-background border border-subtle rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-default outline-none font-bold"
                    >
                      <option value="POST">پست پیشتاز سراسری</option>
                      <option value="POST_VIZHE">پست ویژه / اکسپرس</option>
                      <option value="TIPAX">تیپاکس (ارسال سریع)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نشانی دقیق پستی (خیابان، کوچه، پلاک، واحد) <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    placeholder="خیابان اصلی، فرعی، پلاک، طبقه و واحد..."
                    value={shippingAddressDetail}
                    onChange={(e) => setShippingAddressDetail(e.target.value)}
                    className="w-full bg-background border border-subtle rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-primary-default outline-none"
                  />
                </div>
              </div>

              {/* Order Notes */}
              <div>
                <label className="block text-sm font-bold text-secondary mb-2">
                  یادداشت برای تامین‌کننده (اختیاری)
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
                  disabled={submitting || (orderItems.length === 0 && !selectedProduct)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-xs text-inverse bg-primary-default hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-primary-default/20"
                >
                  {submitting ? "در حال ثبت..." : "ثبت نهایی سفارش و ارسال برای برآورد هزینه"}
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
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-3 sm:p-4 overflow-y-auto"
          dir="rtl"
        >
          <div className="bg-card rounded-3xl max-w-5xl w-full p-5 sm:p-7 shadow-2xl relative animate-scale-up my-6 max-h-[90vh] overflow-y-auto border border-subtle text-right">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-subtle pb-4 mb-6 gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-xl font-black text-primary">
                    جزئیات کامل سفارش #{Number(selectedOrderForDetails.id).toLocaleString("fa-IR")}
                  </h3>
                  {isWooOrder(selectedOrderForDetails) ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 px-2.5 py-0.5 rounded-lg">
                      <Globe className="w-3.5 h-3.5" /> سفارش ووکامرس
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-lg">
                      <Store className="w-3.5 h-3.5" /> ثبت مستقیم پلتفرم
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${getStatusColor(
                      selectedOrderForDetails.status
                    )}`}
                  >
                    {getStatusText(selectedOrderForDetails.status)}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-2 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    تاریخ ثبت: {new Date(selectedOrderForDetails.createdAt).toLocaleDateString("fa-IR")}
                  </span>
                  <span className="w-1 h-1 bg-subtle rounded-full"></span>
                  <span>
                    وضعیت تسویه:{" "}
                    <strong className="text-primary font-bold">
                      {["PAID", "PROCESSING", "PREPARING", "SHIPPED", "DELIVERED", "COMPLETED"].includes(
                        selectedOrderForDetails.status
                      )
                        ? "تسویه شده"
                        : selectedOrderForDetails.storeInvoiceId &&
                          selectedOrderForDetails.storeInvoice?.status === "PENDING"
                        ? "در انتظار واریز / ثبت فیش"
                        : "تسویه نشده"}
                    </strong>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedOrderForDetails(null)}
                className="w-9 h-9 rounded-xl hover:bg-surface text-muted hover:text-primary flex items-center justify-center transition-colors cursor-pointer self-end sm:self-auto"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Visual Status Tracking Timeline */}
            <div className="mb-6 bg-surface/60 p-4 rounded-2xl border border-subtle">
              <OrderTimeline orderId={selectedOrderForDetails.id} />
            </div>

            {/* 2-Column Responsive Layout: Right (Items + 3-Tier Pricing) | Left (Address + Logistics) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* RIGHT COLUMN: Items, 3-Tier Pricing Breakdown, Supplier, and Total Amount */}
              <div className="lg:col-span-7 space-y-5">
                {/* Order Items Table */}
                <div className="bg-surface p-4 rounded-2xl border border-subtle space-y-3">
                  <h4 className="text-xs font-bold text-secondary flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4 text-primary-default" />
                    اقلام سفارش داده شده
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-subtle bg-card overflow-hidden">
                    <table className="w-full text-xs text-right min-w-[420px]">
                      <thead className="bg-surface text-muted border-b border-subtle">
                        <tr>
                          <th className="py-2.5 px-3 font-bold">کالا و تنوع</th>
                          <th className="py-2.5 px-3 font-bold text-center">تعداد</th>
                          <th className="py-2.5 px-3 font-bold">قیمت عمده (تومان)</th>
                          <th className="py-2.5 px-3 font-bold">جمع کل (تومان)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-subtle">
                        {selectedOrderForDetails.items?.map((item: any) => {
                          let variantLabel = "";
                          if (item.variant) {
                            try {
                              const parsed =
                                typeof item.variant.attributes === "string"
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
                            <tr key={item.id} className="hover:bg-surface/50">
                              <td className="py-2.5 px-3 font-bold text-primary">
                                <div>
                                  <div>{item.product?.name}</div>
                                  {variantLabel && (
                                    <div className="text-[10px] text-primary-default bg-primary-default/5 px-1.5 py-0.5 rounded-md mt-1 inline-block font-medium">
                                      {variantLabel}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-secondary">
                                {item.quantity}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-muted">
                                {(item.price || 0).toLocaleString("fa-IR")}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-primary">
                                {((item.price || 0) * item.quantity).toLocaleString("fa-IR")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3-Tier Pricing & Profit Calculation Card */}
                <div className="bg-primary-default/5 border border-primary-default/20 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-primary-default/15 pb-2">
                    <span className="text-xs font-black text-primary-hover flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-primary-default" />
                      تفکیک سطوح قیمت‌گذاری و سود فروشگاه
                    </span>
                    <span className="text-[11px] text-muted">شفافیت ۳ لایه قیمت</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    {/* Tier 1: Supplier base price */}
                    <div className="bg-card p-3 rounded-xl border border-subtle flex flex-col justify-between">
                      <span className="text-[11px] text-muted block mb-1">۱. قیمت مبدا تامین‌کننده</span>
                      <span className="font-mono font-black text-primary text-sm">
                        {(() => {
                          const basePrice = selectedOrderForDetails.items?.reduce(
                            (sum: number, it: any) =>
                              sum + ((it.product?.price || it.price || 0) * (it.quantity || 1)),
                            0
                          );
                          return (basePrice || selectedOrderForDetails.totalAmount || 0).toLocaleString("fa-IR");
                        })()}{" "}
                        <span className="text-[10px] font-normal text-muted">تومان</span>
                      </span>
                    </div>

                    {/* Tier 2: Zopit wholesale price */}
                    <div className="bg-card p-3 rounded-xl border border-primary-default/30 flex flex-col justify-between shadow-2xs">
                      <span className="text-[11px] text-primary-default font-bold block mb-1">
                        ۲. قیمت عمده زوپیت (پرداختی شما)
                      </span>
                      <span className="font-mono font-black text-primary-hover text-sm">
                        {Number(selectedOrderForDetails.totalAmount || 0).toLocaleString("fa-IR")}{" "}
                        <span className="text-[10px] font-normal text-muted">تومان</span>
                      </span>
                    </div>

                    {/* Tier 3: Store selling price on website */}
                    <div className="bg-card p-3 rounded-xl border border-emerald-500/30 flex flex-col justify-between">
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold block mb-1">
                        ۳. قیمت فروش در سایت شما
                      </span>
                      <span className="font-mono font-black text-emerald-950 dark:text-emerald-200 text-sm">
                        {(() => {
                          const storeRetail = selectedOrderForDetails.items?.reduce(
                            (sum: number, it: any) => {
                              const retail =
                                it.product?.storeRetailPrice ||
                                it.product?.marketPrice ||
                                Math.round((it.price || 0) * 1.25);
                              return sum + retail * (it.quantity || 1);
                            },
                            0
                          );
                          return (storeRetail || Math.round((selectedOrderForDetails.totalAmount || 0) * 1.25)).toLocaleString(
                            "fa-IR"
                          );
                        })()}{" "}
                        <span className="text-[10px] font-normal text-muted">تومان</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Supplier & Warehouse Source Details */}
                <div className="bg-surface p-4 rounded-2xl border border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <span className="text-muted block text-[11px]">شناسه تامین‌کننده محصول:</span>
                    <span className="font-bold text-primary">
                      {(() => {
                        const supp = selectedOrderForDetails.items?.[0]?.product?.supplier;
                        if (!supp) return "کد تامین‌کننده اختصاصی زوپیت";
                        return `${supp.shopName || supp.name || "تامین‌کننده"} (کد #${supp.id})`;
                      })()}
                    </span>
                  </div>
                  {(selectedOrderForDetails.items?.[0]?.product?.supplier?.province ||
                    selectedOrderForDetails.items?.[0]?.product?.supplier?.city) && (
                    <div className="space-y-1">
                      <span className="text-muted block text-[11px]">موقعیت انبار مبدا:</span>
                      <span className="font-bold text-primary">
                        {selectedOrderForDetails.items?.[0]?.product?.supplier?.province || ""}،{" "}
                        {selectedOrderForDetails.items?.[0]?.product?.supplier?.city || ""}
                      </span>
                    </div>
                  )}
                </div>

                {/* Price Summary Footing */}
                <div className="bg-card p-4 rounded-2xl border border-subtle space-y-2.5 text-xs">
                  <div className="flex justify-between text-muted">
                    <span>مجموع ارزش عمده کالاها:</span>
                    <span className="font-mono font-bold text-primary">
                      {Number(selectedOrderForDetails.totalAmount || 0).toLocaleString("fa-IR")} تومان
                    </span>
                  </div>
                  <div className="flex justify-between text-muted">
                    <span>هزینه بسته‌بندی و ارسال پستی:</span>
                    <span className="font-mono font-bold text-primary">
                      {selectedOrderForDetails.shippingFee
                        ? `${Number(selectedOrderForDetails.shippingFee).toLocaleString("fa-IR")} تومان`
                        : "محاسبه بر اساس روش ارسال (رایگان / در انتظار تایید)"}
                    </span>
                  </div>
                  <div className="h-px bg-subtle my-2"></div>
                  <div className="flex justify-between text-primary font-black text-sm">
                    <span>مبلغ نهایی قابل پرداخت به زوپیت:</span>
                    <span className="text-primary-default font-mono text-base">
                      {Number(
                        (selectedOrderForDetails.totalAmount || 0) + (selectedOrderForDetails.shippingFee || 0)
                      ).toLocaleString("fa-IR")}{" "}
                      تومان
                    </span>
                  </div>
                </div>
              </div>

              {/* LEFT COLUMN: Customer & Destination Address + Logistics & Label Management */}
              <div className="lg:col-span-5 space-y-5">
                {/* Customer & Address Details Card */}
                <div className="bg-surface p-5 rounded-2xl border border-subtle space-y-4">
                  <div className="flex items-center justify-between border-b border-subtle pb-2.5">
                    <h4 className="text-xs font-black text-primary flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-500" />
                      مشخصات گیرنده و آدرس تحویل
                    </h4>
                    <button
                      onClick={() => {
                        setSelectedShippingOrder(selectedOrderForDetails);
                        setShowShippingModal(true);
                      }}
                      className="text-[11px] font-bold text-primary-default hover:text-primary-hover cursor-pointer"
                    >
                      ویرایش آدرس
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-muted block text-[11px] mb-0.5">نام و نام خانوادگی خریدار:</span>
                      <p className="font-bold text-primary">
                        {selectedOrderForDetails.customerName || "مدیر فروشگاه (سفارش داخلی)"}
                      </p>
                    </div>

                    {selectedOrderForDetails.customerPhone && (
                      <div>
                        <span className="text-muted block text-[11px] mb-0.5">شماره تماس گیرنده:</span>
                        <p className="font-mono font-bold text-primary" dir="ltr">
                          {selectedOrderForDetails.customerPhone}
                        </p>
                      </div>
                    )}

                    <div>
                      <span className="text-muted block text-[11px] mb-0.5">نشانی پستی مقصد:</span>
                      <p className="font-medium text-primary leading-relaxed bg-card p-2.5 rounded-xl border border-subtle">
                        {selectedOrderForDetails.shippingAddress || "هنوز آدرس پستی ثبت نشده است."}
                      </p>
                    </div>

                    {selectedOrderForDetails.shippingPostalCode && (
                      <div>
                        <span className="text-muted block text-[11px] mb-0.5">کد پستی ۱۰ رقمی:</span>
                        <p className="font-mono font-bold text-primary">
                          {selectedOrderForDetails.shippingPostalCode}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Logistics, Shipping Method & Label Management */}
                <div className="bg-card p-5 rounded-2xl border border-subtle space-y-4">
                  <div className="flex items-center gap-2 border-b border-subtle pb-2.5">
                    <Truck className="w-4 h-4 text-primary-default" />
                    <h4 className="text-xs font-black text-primary">اطلاعات لجستیک و ارسال</h4>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted">روش ارسال:</span>
                      <span className="font-bold text-primary">
                        {["POST", "POST_PISHTAZ"].includes(selectedOrderForDetails.shippingMethod || "")
                          ? "پست پیشتاز"
                          : ["POST_VIZHE", "POST_EXPRESS"].includes(selectedOrderForDetails.shippingMethod || "")
                          ? "پست ویژه (اکسپرس)"
                          : selectedOrderForDetails.shippingMethod === "TIPAX"
                          ? "تیپاکس"
                          : selectedOrderForDetails.shippingMethod === "PERSONAL_PANEL"
                          ? "پنل پستی اختصاصی"
                          : "پنل ارسال پلتفرم"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted">کد رهگیری مرسوله:</span>
                      <span className="font-mono font-bold text-primary-hover">
                        {selectedOrderForDetails.trackingCode || "در انتظار ارسال و صدور بارنامه"}
                      </span>
                    </div>

                    {/* Postal Label Actions */}
                    {selectedOrderForDetails.postalLabel ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl flex items-center justify-between gap-2">
                        <span className="text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                          لیبل پستی صادر شده است
                        </span>
                        <a
                          href={selectedOrderForDetails.postalLabel}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5" /> چاپ لیبل
                        </a>
                      </div>
                    ) : (
                      <div className="bg-surface p-3 rounded-xl border border-subtle text-center text-muted text-[11px]">
                        لیبل پستی پس از نهایی‌سازی سفارش و بسته‌بندی توسط انبار آماده چاپ خواهد شد.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-7 pt-5 border-t border-subtle">
              <button
                onClick={() => setSelectedOrderForDetails(null)}
                className="flex-1 py-2.5 bg-surface hover:bg-surface-hover text-secondary font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
              >
                بستن پنجره جزئیات
              </button>
              <button
                onClick={() => printOrderInvoice(selectedOrderForDetails)}
                className="flex-1 py-2.5 bg-primary-default/10 hover:bg-primary-default/20 text-primary-hover border border-primary-default/30 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> دریافت فاکتور رسمی
              </button>
              <button
                onClick={() => setShowReportIssue(true)}
                className="flex-1 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-500/30 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-4 h-4" /> ثبت مشکل / پیگیری
              </button>

              {!["PAID", "PROCESSING", "PREPARING", "SHIPPED", "DELIVERED", "COMPLETED", "CANCELLED", "REJECTED"].includes(
                selectedOrderForDetails.status
              ) &&
                (selectedOrderForDetails.storeInvoiceId === null ||
                  selectedOrderForDetails.storeInvoice?.status === "PENDING") && (
                  <button
                    onClick={() => {
                      const id = selectedOrderForDetails.id;
                      setSelectedOrderForDetails(null);
                      handlePaymentClick(id);
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-primary-default hover:bg-primary-hover text-inverse font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer text-center"
                  >
                    اقدام به پرداخت صورت‌حساب
                  </button>
                )}
            </div>

            {selectedOrderForDetails.status === "WAITING_SHIPPING_PAYMENT" && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/store-manager/shipping/${selectedOrderForDetails.id}/pay`, {
                        method: "POST",
                        headers: {
                          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                        },
                      });
                      const data = await res.json();
                      if (res.ok && data.payLink) {
                        window.location.href = data.payLink;
                      } else {
                        toast(data.error || "خطا در پرداخت هزینه ارسال", "error");
                      }
                    } catch (e) {
                      toast("خطای شبکه", "error");
                    }
                  }}
                  className="bg-primary-default text-inverse font-bold text-xs px-5 py-2.5 rounded-xl hover:bg-primary-hover transition-colors shadow-md"
                >
                  پرداخت آنلاین هزینه ارسال
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Issue Modal */}
      {showReportIssue && selectedOrderForDetails && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setShowReportIssue(false)}
        >
          <div
            className="bg-card w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-border-subtle p-6 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border-subtle pb-4 mb-4">
              <h3 className="font-extrabold text-lg text-rose-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> ثبت مشکل و پیگیری سفارش #{selectedOrderForDetails.id}
              </h3>
              <button
                onClick={() => setShowReportIssue(false)}
                className="p-2 text-text-muted hover:bg-surface rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  دسته‌بندی موضوع مشکل <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIssueCategory("LOGISTICS")}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-right transition-all flex items-center gap-2 ${
                      issueCategory === "LOGISTICS"
                        ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20"
                        : "border-border-subtle bg-surface text-text-muted hover:bg-surface-hover"
                    }`}
                  >
                    <span>🚚</span>
                    <span>مشکل لجستیک و ارسال پستی</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIssueCategory("SUPPLIER")}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-right transition-all flex items-center gap-2 ${
                      issueCategory === "SUPPLIER"
                        ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20"
                        : "border-border-subtle bg-surface text-text-muted hover:bg-surface-hover"
                    }`}
                  >
                    <span>📦</span>
                    <span>مغایرت یا عدم ارسال کالا</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIssueCategory("FINANCIAL")}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-right transition-all flex items-center gap-2 ${
                      issueCategory === "FINANCIAL"
                        ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20"
                        : "border-border-subtle bg-surface text-text-muted hover:bg-surface-hover"
                    }`}
                  >
                    <span>💳</span>
                    <span>مسائل مالی و استرداد وجه</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIssueCategory("OTHER")}
                    className={`p-2.5 rounded-xl border text-xs font-bold text-right transition-all flex items-center gap-2 ${
                      issueCategory === "OTHER"
                        ? "border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/20"
                        : "border-border-subtle bg-surface text-text-muted hover:bg-surface-hover"
                    }`}
                  >
                    <span>💬</span>
                    <span>سایر پیگیری‌ها و هماهنگی</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  شرح کامل مشکل و توضیحات <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={issueText}
                  onChange={(e) => setIssueText(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-surface border border-border-subtle rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-rose-500/20 text-text-primary resize-none leading-relaxed"
                  placeholder="لطفاً جزئیات مشکل پیش‌آمده (مانند عدم تطابق کالا، تاخیر، یا عدم ارسال) را به طور کامل شرح دهید..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowReportIssue(false)}
                  className="flex-1 py-3 bg-surface hover:bg-surface-hover text-text-primary rounded-xl text-xs font-bold transition-all"
                >
                  انصراف
                </button>
                <button
                  onClick={handleReportIssue}
                  disabled={submittingIssue || !issueText.trim()}
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {submittingIssue ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  <span>ارسال و ثبت گزارش</span>
                </button>
              </div>
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
