import { toast } from "../GlobalToast";
import { AppLink } from "../AppLink";
import React, { useState } from "react";
import Announcements from "../Announcements";
import NotificationBell from "../NotificationBell";
import OrderTimeline from "../OrderTimeline";
import { Skeleton, CardSkeleton, TableSkeleton } from "../Skeleton";
import { useEffect } from "react";
import { requestClientSideZibalPayment } from "../../services/payment/clientPaymentBridge";
import {
  Package,
  ShoppingCart,
  Wallet,
  LayoutDashboard,
  LogOut,
  Plus,
  Search,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  X,
  PlusCircle,
  MessageSquare,
  User,
  Settings,
  FileText,
  XCircle,
  ShoppingBag,
  Copy,
  Check,
  Printer,
  RefreshCw,
  Scale,
  Truck,
  Users,
  HelpCircle,
  Sliders,
  Bell,
  BellRing,
  Megaphone,
  Activity,
  ShieldCheck,
  Folder,
  Globe,
  CreditCard,
  Phone,
  CheckSquare,
  Sparkles,
  Link,
  Tag,
  Share2,
  Box,
  List,
  Grid,
  Info,
  Layers,
  Store,
  GraduationCap,
  Ticket,
  Calendar,
  Filter,
  Square,
  ArrowUpDown,
  CheckCheck,
  Menu,
  Play,
  Gift,
  ArrowLeft,
  Save
} from "lucide-react";
import { EducationModal } from "../EducationModal";
import { SupplierOnboardingWidget } from "./SupplierOnboardingWidget";
import { AutomationVideoModal } from "../AutomationVideoModal";
import { ZopitLogo } from "../ZopitLogo";
import { SupplierReferralProgram } from "./SupplierReferralProgram";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Package,
  ShoppingCart,
  ShoppingBag,
  Wallet,
  User,
  Users,
  Settings,
  MessageSquare,
  HelpCircle,
  FileText,
  Scale,
  Truck,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  X,
  Plus,
  PlusCircle,
  Search,
  Copy,
  Check,
  Printer,
  RefreshCw,
  Sliders,
  Bell,
  Megaphone,
  Activity,
  ShieldCheck,
  Folder,
  Globe,
  CreditCard,
  Phone,
  CheckSquare,
  Sparkles,
  Link,
  Tag,
  Share2,
  Box,
  List,
  Grid,
  Info,
  Layers,
  Store
};

const getIconComponent = (iconName: any) => {
  if (typeof iconName === "string" && ICON_MAP[iconName]) {
    return ICON_MAP[iconName];
  }
  return LayoutDashboard;
};
import UserDashboardWidgets from "../UserDashboardWidgets";
import LatestAnnouncementsWidget from "../LatestAnnouncementsWidget";
import { SupplierAddProduct } from "./SupplierAddProduct";
import { SupplierWooCommerceImport } from "./SupplierWooCommerceImport";
import { SupplierTickets } from "./SupplierTickets";
import { SupplierProfile } from "./SupplierProfile";
import SupplierPerformancePanel from "./SupplierPerformancePanel";
import {
  isBrowserNotificationSupported,
  getNotificationPermission,
  requestBrowserNotificationPermission,
  showBrowserNotification
} from "../../utils/browserNotifications";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { useSyncTabWithUrl } from "../../utils/routeSync";
import { getPersianStatus } from "../../utils/statusUtils";

export function SupplierDashboard({
  user,
  onLogout,
  showNotification,
  onUpdateUser,
}: any) {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const initialTab = sessionStorage.getItem("supplier_initial_tab");
      if (initialTab) {
        sessionStorage.removeItem("supplier_initial_tab");
        return initialTab;
      }
      const path = window.location.pathname;
      if (path.startsWith("/supplier/") && path.length > "/supplier/".length) {
        return path.replace("/supplier/", "");
      }
    }
    return "overview";
  });
  const [activeTicketDepartment, setActiveTicketDepartment] = useState("");

  useEffect(() => {
    const expectedPath = `/supplier/${activeTab}`;
    if (window.location.pathname !== expectedPath) {
      window.history.pushState(null, "", expectedPath);
    }
  }, [activeTab]);

  // Valid supplier tabs for routing fallback
  const validSupplierTabs = [
    "overview",
    "products",
    "add-product",
    "edit-product",
    "woocommerce-import",
    "orders",
    "wallet",
    "performance",
    "tickets",
    "announcements",
    "profile"
  ];

  // Sync tab with URL
  useSyncTabWithUrl("/supplier", activeTab, setActiveTab, "overview", validSupplierTabs);

  const [showEducationModal, setShowEducationModal] = useState(false);
  const [showAutomationVideoModal, setShowAutomationVideoModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sysConfig, setSysConfig] = useState<Record<string, boolean>>({});
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customMenu, setCustomMenu] = useState<any[]>([]);
  
  // Quick Excel-like Edit States for Products
  const [isQuickEditMode, setIsQuickEditMode] = useState(false);
  const [quickEditValues, setQuickEditValues] = useState<Record<number, { stock: number; supplierBasePrice: number }>>({});
  const [isSavingQuickEdit, setIsSavingQuickEdit] = useState(false);
  const [printLabelOrder, setPrintLabelOrder] = useState<any>(null);
  
  // Supplier Push Notification States
  const [pushPermission, setPushPermission] = useState<NotificationPermission | "unsupported">("default");
  const [prevPendingIds, setPrevPendingIds] = useState<number[]>([]);

  useEffect(() => {
    if (isBrowserNotificationSupported()) {
      setPushPermission(getNotificationPermission());
    } else {
      setPushPermission("unsupported");
    }
  }, []);

  const handleRequestPushPermission = async () => {
    if (!isBrowserNotificationSupported()) {
      if (showNotification) {
        showNotification("مرورگر شما از اعلان‌های سیستمی پشتیبانی نمی‌کند.", "error");
      }
      return;
    }
    const perm = await requestBrowserNotificationPermission();
    setPushPermission(perm);
    if (perm === "granted") {
      if (showNotification) {
        showNotification("اعلان‌های مرورگر فعال شدند. در زمان ثبت سفارشات منتظر تایید مطلع خواهید شد.", "success");
      }
      showBrowserNotification({
        title: "اعلان‌های تامین‌کننده زوپیت فعال شد! 🎉",
        body: "سیستم اطلاع‌رسانی سفارشات جدید آماده به کار است.",
        sound: false,
      });
    } else if (perm === "denied") {
      if (showNotification) {
        showNotification("دسترسی به اعلان‌ها توسط مرورگر رد شد. لطفاً از تنظیمات مرورگر دسترسی را آزاد کنید.", "error");
      }
    }
  };

  const checkNewSupplierOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const headers = { Authorization: `Bearer ${token}` };
      const ordRes = await fetch("/api/supplier/orders", { credentials: "include", headers }).catch(() => null);
      if (ordRes && ordRes.ok) {
        const orderData = await ordRes.json().catch(() => null);
        if (!orderData || !Array.isArray(orderData)) return;
        setOrders(orderData);
        
        const pendingItems = orderData.filter((o: any) => o.status === "REQUESTED" || o.status === "PENDING");
        const pendingIds = pendingItems.map((o: any) => o.id);
        
        if (prevPendingIds.length > 0) {
          const newIds = pendingIds.filter((id: number) => !prevPendingIds.includes(id));
          if (newIds.length > 0) {
            const newItem = pendingItems.find((o: any) => o.id === newIds[0]);
            if (newItem) {
              showBrowserNotification({
                title: "سفارش جدید برای تایید شما 🛒",
                body: `سفارش جدید به شماره ${newItem.orderId} منتظر تایید موجودی توسط شماست.`,
                sound: false,
              });
              if (showNotification) {
                showNotification(`سفارش جدید شماره ${newItem.orderId} برای تایید دریافت شد`, "success");
              }
            }
          }
        }
        setPrevPendingIds(pendingIds);
      }
    } catch (err) {
      // Silently handle transient background polling network failures
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      checkNewSupplierOrders();
    }, 15000);
    return () => clearInterval(interval);
  }, [prevPendingIds]);
  const [walletInfo, setWalletInfo] = useState<any>({
    balance: 0,
    pendingBalance: 0,
    totalEarnings: 0,
    totalWithdrawn: 0,
    history: [],
    payouts: [],
  });
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [productSearch, setProductSearch] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [productToEdit, setProductToEdit] = useState<any>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isBulkShipping, setIsBulkShipping] = useState(false);
  const [orderDateFilter, setOrderDateFilter] = useState<string>("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>("all");
  const [orderSearchQuery, setOrderSearchQuery] = useState<string>("");
  const [changingOrder, setChangingOrder] = useState<any>(null);
  const [changeStatus, setChangeStatus] = useState<string>("");
  const [changeTracking, setChangeTracking] = useState<string>("");
  const [inventoryIssueOrder, setInventoryIssueOrder] = useState<any>(null);
  const [issueMessage, setIssueMessage] = useState("");
  const [submittingIssue, setSubmittingIssue] = useState(false);
  /* Clipboard copy state */
  const [copiedShaba, setCopiedShaba] = useState(false);
  const handleCopyShaba = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedShaba(true);
      setTimeout(() => setCopiedShaba(false), 2000);
      if (showNotification) {
        showNotification("شماره شبا با موفقیت در حافظه موقت کپی شد", "success");
      }
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };
  const handlePrintPostalLabel = (orderItem: any) => {
    const storeName = orderItem.order?.store?.storeName || orderItem.order?.store?.username || "فروشگاه همکار";
    const recipientName = orderItem.order?.recipientName || orderItem.order?.user?.name || storeName;
    const phone = orderItem.order?.shippingPhone || orderItem.order?.user?.phone || "۰۹۱۲۰۰۰۰۰۰۰";
    const province = orderItem.order?.province || "تهران";
    const city = orderItem.order?.city || "تهران";
    const address = orderItem.order?.shippingAddress || "نشانی ثبت نشده است";
    const postalCode = orderItem.order?.postalCode || "۱۲۳۴۵۶۷۸۹۰";
    const orderId = orderItem.orderId || orderItem.id;
    const productName = orderItem.product?.name || "کالای سفارشی";
    const quantity = orderItem.quantity || 1;

    const printWindow = window.open("", "_blank", "width=850,height=650");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="fa">
      <head>
        <meta charset="UTF-8">
        <title>لیبل پستی مرسوله #${orderId}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700;900&display=swap');
          body {
            font-family: 'Vazirmatn', sans-serif;
            margin: 0;
            padding: 20px;
            background: #fff;
            color: #111;
          }
          .label-box {
            width: 150mm;
            min-height: 110mm;
            border: 3px solid #000;
            border-radius: 14px;
            padding: 18px;
            box-sizing: border-box;
            margin: 0 auto;
            position: relative;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .logo {
            font-size: 18px;
            font-weight: 900;
            color: #000;
          }
          .order-id {
            font-size: 14px;
            font-weight: bold;
            border: 2px solid #000;
            padding: 4px 12px;
            border-radius: 8px;
            background: #f0f0f0;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
          }
          .info-card {
            border: 1.5px solid #333;
            border-radius: 10px;
            padding: 10px 12px;
            font-size: 12px;
            line-height: 1.8;
          }
          .card-title {
            font-weight: 900;
            border-bottom: 1px solid #ddd;
            padding-bottom: 4px;
            margin-bottom: 6px;
            font-size: 13px;
          }
          .address-box {
            border: 1.5px solid #000;
            border-radius: 10px;
            padding: 12px;
            margin-between: 12px;
            font-size: 13px;
            line-height: 1.8;
            background: #fdfdfd;
          }
          .product-box {
            border: 1px solid #ccc;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 12px;
            margin-top: 10px;
            background: #f5f5f5;
          }
          .barcode-section {
            text-align: center;
            border-top: 2px dashed #000;
            padding-top: 10px;
            margin-top: 14px;
          }
          .barcode-lines {
            height: 42px;
            background: repeating-linear-gradient(
              90deg,
              #000,
              #000 3px,
              #fff 3px,
              #fff 6px
            );
            margin: 6px auto;
            width: 75%;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="no-print" style="text-align: center; margin-bottom: 16px;">
          <button onclick="window.print()" style="background: #10B981; color: #fff; border: none; padding: 12px 28px; font-size: 14px; font-weight: bold; border-radius: 10px; cursor: pointer; box-shadow: 0 4px 12px rgba(16,185,129,0.3);">
            🖨️ پرینت لیبل پستی مرسوله
          </button>
        </div>

        <div class="label-box">
          <div class="header">
            <div class="logo">مرسوله پستی پلتفرم B2B زوپیت</div>
            <div class="order-id">کد مرسوله: #${orderId}</div>
          </div>

          <div class="grid">
            <div class="info-card">
              <div class="card-title">📍 فرستنده:</div>
              <div><strong>تامین‌کننده مرکزی زوپیت</strong></div>
              <div>انبار و مرکز پردازش مرسولات</div>
            </div>

            <div class="info-card">
              <div class="card-title">👤 گیرنده:</div>
              <div><strong>نام:</strong> ${recipientName}</div>
              <div><strong>فروشگاه:</strong> ${storeName}</div>
              <div><strong>تلفن:</strong> ${phone}</div>
            </div>
          </div>

          <div class="address-box">
            <div><strong>استان / شهر:</strong> ${province} / ${city}</div>
            <div><strong>نشانی دقیق پستی:</strong> ${address}</div>
            <div style="margin-top: 6px;"><strong>کد پستی ۱۰ رقمی:</strong> <span style="font-family: monospace; font-size: 15px; font-weight: bold; letter-spacing: 1px;">${postalCode}</span></div>
          </div>

          <div class="product-box">
            <div><strong>محتویات مرسوله:</strong> ${productName} (تعداد: <strong>${quantity}</strong> عدد)</div>
          </div>

          <div class="barcode-section">
            <div class="barcode-lines"></div>
            <div style="font-family: monospace; font-size: 12px; font-weight: bold;">ZP-${orderId}-${Date.now().toString().slice(-6)}</div>
          </div>
        </div>

        <script>
          setTimeout(() => { window.print(); }, 350);
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportCSV = () => {
    if (orders.length === 0) {
      if (showNotification)
        showNotification("هیچ سفارشی برای خروجی گرفتن وجود ندارد.", "error");
      return;
    }
    /* Headers: ID, Product, Quantity, Total Amount, Status, Date */
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
        : o.status === "SHIPPED"
          ? "تایید شده"
          : o.status === "PAID"
            ? "پرداخت شده"
            : o.status,
      new Date(o.order?.createdAt || o.createdAt).toLocaleDateString("fa-IR"),
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
    link.setAttribute(
      "download",
      `سفارشات_تامین_کننده_${user?.brandName || "من"}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (showNotification) {
      showNotification("فایل اکسل سفارشات با موفقیت دانلود شد", "success");
    }
  };
  /* Withdrawal States */
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [walletSubTab, setWalletSubTab] = useState<"ledger" | "payouts">(
    "ledger",
  );
  /* Settlement Details Modal */
  const [selectedSettlement, setSelectedSettlement] = useState<any>(null);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [loadingSettlement, setLoadingSettlement] = useState(false);
  const fetchSettlementDetails = async (id: string) => {
    setLoadingSettlement(true);
    setIsSettlementModalOpen(true);
    try {
      const res = await fetch(`/api/supplier/settlements/${id}`, { credentials: "include",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedSettlement(data);
      } else {
        showNotification(data.error || "خطا در دریافت اطلاعات تسویه", "error");
        setIsSettlementModalOpen(false);
      }
    } catch (err) {
      showNotification("خطا در ارتباط با سرور", "error");
      setIsSettlementModalOpen(false);
    } finally {
      setLoadingSettlement(false);
    }
  };
  const handleWithdrawalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawalAmount);
    if (!amount || amount <= 0) {
      showNotification("لطفاً مبلغ معتبری وارد کنید", "error");
      return;
    }
    if (amount > Number(walletInfo.balance || 0)) {
      showNotification("مبلغ درخواستی بیشتر از موجودی قابل تسویه است", "error");
      return;
    }
    setIsSubmittingWithdrawal(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/payout/request", { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification("درخواست تسویه حساب شما با موفقیت ثبت شد", "success");
        setIsWithdrawalModalOpen(false);
        setWithdrawalAmount("");
        fetchData(); /* Refresh wallet state */
      } else {
        showNotification(
          data.error || "خطا در ثبت درخواست تسویه حساب",
          "error",
        );
      }
    } catch (err) {
      showNotification("خطا در ارتباط با سرور", "error");
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  };
  const handleDeposit = async () => {
    if (!depositAmount || Number(depositAmount) < 1000)
      return toast("مبلغ نامعتبر است (حداقل ۱۰۰۰ تومان)", "error");
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/wallet/deposit`, { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: Number(depositAmount) }),
      });
      const data = await res.json();
      if (res.ok && data.payLink) {
        window.location.assign(data.payLink);
      } else if (res.ok && data.clientPaymentRequired) {
        toast("در حال انتقال سریع به درگاه زیبال...", "info");
        const clientRes = await requestClientSideZibalPayment({
          amountInRials: data.amountInRials,
          merchant: data.merchant,
          callbackUrl: data.callbackUrl,
          description: data.description,
        });
        if (clientRes.success && clientRes.payLink) {
          window.location.assign(clientRes.payLink);
        } else {
          toast(clientRes.error || "خطا در اتصال به درگاه پرداخت زیبال", "error");
        }
      } else {
        toast(data.error || "خطا در ارتباط با درگاه پرداخت", "error");
      }
    } catch (err) {
      toast("خطا در ارتباط با سرور", "error");
    }
  };
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const headers = { Authorization: `Bearer ${token}` };
      const [prodRes, ordRes, walRes] = await Promise.all([
        fetch("/api/supplier/products", { credentials: "include", headers }),
        fetch("/api/supplier/orders", { credentials: "include", headers }),
        fetch("/api/supplier/reports", { credentials: "include", headers }),
      ]);
      if (prodRes.ok) setProducts(await prodRes.json());
      if (ordRes.ok) {
        const orderData = await ordRes.json();
        setOrders(orderData);
        
        // Initialize pending order item IDs so we don't spam notifications on initial load
        const pendingItems = orderData.filter((o: any) => o.status === "REQUESTED" || o.status === "PENDING");
        setPrevPendingIds(pendingItems.map((o: any) => o.id));

        const hasNewDirect = orderData.some((o: any) => o.order?.orderSource === "direct" && o.status === "PAID");
        if (hasNewDirect && showNotification) {
          showNotification("شما سفارش پرداخت‌شده و مستقیم جدید از زوپیت دارید!", "success");
        }
      }
      if (walRes.ok) setWalletInfo(await walRes.json());
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetch("/api/config")
      .then((r) => {
        if (!r.ok || !r.headers.get("content-type")?.includes("application/json")) return {};
        return r.json();
      })
      .then(setSysConfig)
      .catch((err) => console.error("Error fetching config:", err));
    fetch("/api/menus/SUPPLIER")
      .then((r) => {
        if (!r.ok || !r.headers.get("content-type")?.includes("application/json")) return [];
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomMenu(data.filter((item: any) => !item.hidden));
        }
      })
      .catch(console.error);
    fetchData();
  }, []);
  
  const handleBulkShip = async () => {
    if (selectedItems.length === 0) return;
    setIsBulkShipping(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/orders/ship-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemIds: selectedItems }),
      });
      if (res.ok) {
        if (showNotification) {
          showNotification("وضعیت سفارشات با موفقیت به ارسال‌شده تغییر یافت و مبلغ به کیف پول شما واریز شد.", "success");
        }
        setSelectedItems([]);
        fetchData();
      } else {
        if (showNotification) {
          showNotification("خطا در ثبت ارسال گروهی.", "error");
        }
      }
    } catch (err) {
      if (showNotification) {
        showNotification("خطای ارتباط با سرور", "error");
      }
    } finally {
      setIsBulkShipping(false);
    }
  };


  const updateOrderStatus = async (itemId: number, newStatus: string) => {
    try {
      const token = localStorage.getItem("token") || "";
      const url = `/api/supplier/orders/${itemId}`;
      const method = "PATCH";
      const body = { status: newStatus };
      const res = await fetch(url, { credentials: "include",
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      });
      if (res.ok) {
        setOrders(
          orders.map((o) =>
            o.id === itemId ? { ...o, status: newStatus } : o,
          ),
        );
        if (newStatus === "SHIPPED") {
          showNotification("مرسوله تحویل پست داده شد و مبلغ درآمد به موجودی کیف پول شما واریز گردید! 💰", "success");
          fetchData();
        } else if (newStatus === "SUPPLIER_APPROVED") {
          showNotification("موجودی کالا تایید گردید و جهت صدور فاکتور و پرداخت به سیستم ارسال شد.", "success");
          fetchData();
        } else if (newStatus === "REJECTED") {
          showNotification("عدم موجودی کالا برای سفارش ثبت گردید.", "warning");
          fetchData();
        } else {
          showNotification("وضعیت سفارش با موفقیت بروزرسانی شد.", "success");
        }
      } else {
        const errorData = await res.json().catch(() => ({}));
        showNotification(errorData.error || "خطا در بروزرسانی سفارش", "error");
      }
    } catch (err) {
      showNotification("خطا در ارتباط با سرور", "error");
    }
  };
  const handleChangeOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changingOrder) return;
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/supplier/orders/${changingOrder.id}`, { credentials: "include",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: changeStatus,
          trackingCode: changeTracking,
        }),
      });
      if (res.ok) {
        setOrders(
          orders.map((o) =>
            o.id === changingOrder.id
              ? { ...o, status: changeStatus, trackingCode: changeTracking }
              : o,
          ),
        );
        showNotification("اطلاعات سفارش با موفقیت بروزرسانی شد.", "success");
        setChangingOrder(null);
      } else {
        const errorData = await res.json().catch(() => ({}));
        showNotification(errorData.error || "خطا در بروزرسانی سفارش", "error");
      }
    } catch (err) {
      showNotification("خطا در ارتباط با سرور", "error");
    }
  };

  const handleInventoryIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inventoryIssueOrder || !issueMessage.trim()) return;
    setSubmittingIssue(true);
    try {
      const token = localStorage.getItem("token") || "";
      const orderItemId = inventoryIssueOrder.items?.[0]?.id || inventoryIssueOrder.itemId || inventoryIssueOrder.id;

      // 1. Submit rejection status to server to trigger automatic wallet debit and admin alerts
      const statusRes = await fetch(`/api/supplier/orders/${orderItemId}`, {
        credentials: "include",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "REJECTED",
          notes: issueMessage
        }),
      });

      // 2. Also submit support ticket for documentation
      await fetch("/api/supplier/tickets", {
        credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subject: `گزارش عدم موجودی سفارش #${inventoryIssueOrder.id}`,
          department: "پشتیبانی فنی",
          priority: "فوری",
          message: issueMessage
        }),
      });

      if (statusRes.ok) {
        if (showNotification) {
          showNotification("گزارش عدم موجودی ثبت شد. سفارش لغو، کیف پول اصلاح و هشدار برای مدیر ارشد ارسال شد.", "success");
        }
        setInventoryIssueOrder(null);
        setIssueMessage("");
        fetchData();
      } else {
        const errData = await statusRes.json().catch(() => ({}));
        if (showNotification) showNotification(errData.error || "خطا در ثبت گزارش عدم موجودی", "error");
      }
    } catch (err) {
      if (showNotification) showNotification("خطا در ارتباط با سرور", "error");
    } finally {
      setSubmittingIssue(false);
    }
  };

  const approveBatchOrders = async () => {
    if (selectedItems.length === 0) return;
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/orders/approve-batch", { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ itemIds: selectedItems }),
      });
      const data = await res.json();
      if (res.ok) {
        showNotification(
          data.message || "سفارشات با موفقیت تایید شدند.",
          "success",
        );
        setOrders(
          orders.map((o) =>
            selectedItems.includes(o.id)
              ? { ...o, status: "SHIPPED" }
              : o,
          ),
        );
        setSelectedItems([]);
      } else {
        showNotification(data.error || "خطا در تایید گروهی سفارشات", "error");
      }
    } catch (err) {
      showNotification("خطا در تایید گروهی سفارشات", "error");
    }
  };
  const navItems = [
    {
      id: "overview",
      label: "پیشخوان",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: "products",
      label: "محصولات من",
      icon: <Package className="w-5 h-5" />,
      subItems: [
        { id: "products", label: "لیست محصولات", icon: <Package className="w-4 h-4" /> },
        { id: "add-product", label: "افزودن محصول جدید", icon: <PlusCircle className="w-4 h-4" /> },
        { id: "woocommerce-import", label: "دریافت از ووکامرس", icon: <Globe className="w-4 h-4 text-indigo-500" /> },
      ],
    },
    {
      id: "orders",
      label: "سفارش‌ها",
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      id: "wallet",
      label: "کیف پول و تسویه",
      icon: <Wallet className="w-5 h-5" />,
    },
    {
      id: "tickets",
      label: "پشتیبانی و تیکت‌ها",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      id: "profile",
      label: "پروفایل و تنظیمات",
      icon: <User className="w-5 h-5" />,
    },
  ];
  const getDynamicNavItems = () => {
    if (!customMenu || !Array.isArray(customMenu) || customMenu.length === 0) {
      return navItems;
    }
    return customMenu
      .filter((item: any) => item && !item.disabled && !item.hidden)
      .map((item: any) => {
        if (item && React.isValidElement(item.icon)) {
          return item;
        }
        const IconComponent = getIconComponent(item.icon);
        return {
          id: item.id || `menu_${Math.random()}`,
          label: item.label || "منو",
          icon: <IconComponent className="w-5 h-5" />,
        };
      });
  };
  const renderMaintenance = (title: string) => (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in w-full">
      <div className="w-20 h-20 bg-warning/20 text-warning rounded-2xl flex items-center justify-center mb-6">
        <span className="text-3xl">🚧</span>
      </div>
      <h3 className="text-2xl font-black text-primary mb-2">
        در حال بروزرسانی
      </h3>
      <p className="text-muted max-w-md mx-auto leading-relaxed">
        بخش «{title}» در حال حاضر جهت ارتقاء امکانات غیرفعال می‌باشد. از صبوری
        شما سپاسگزاریم.
      </p>
    </div>
  );
  return (
    <div
      id="view-dashboard-supplier"
      className="flex h-screen bg-background w-full relative overflow-hidden"
      dir="rtl"
    >
      {/* Mobile Drawer Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar (Desktop static / Mobile slide-over drawer) */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-64 bg-card border-l border-border-subtle text-text-primary flex flex-col h-full shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 lg:shadow-xl lg:z-20 shrink-0 ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 sm:p-6 border-b border-border-subtle bg-surface/30 shrink-0 flex items-center justify-between">
          <div>
            <div className="mb-2">
              <ZopitLogo size="md" />
            </div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Package className="text-primary-default w-5 h-5" /> پنل تامین‌کننده
            </h2>
            <p className="text-text-muted text-xs mt-1 truncate max-w-[180px]">
              {user?.firstName} {user?.lastName} ({user?.brandName})
            </p>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface"
            aria-label="بستن منو"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto min-h-0">
          {getDynamicNavItems().map((item: any) => {
            const isParentActive =
              activeTab === item.id ||
              (item.subItems && item.subItems.some((s: any) => s.id === activeTab));

            return (
              <div key={item.id} className="space-y-1">
                <AppLink
                  href={`/supplier/${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isParentActive
                      ? "bg-primary-default text-white shadow-lg shadow-primary-default/20 font-bold"
                      : "text-text-secondary hover:bg-surface hover:text-text-primary"
                  }`}
                  aria-label={item.label}
                >
                  <div className="flex items-center gap-3">
                    <span className={isParentActive ? "text-white" : "text-text-muted"}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </div>
                </AppLink>

                {item.subItems && isParentActive && (
                  <div className="mr-5 pr-3 border-r-2 border-primary-default/30 space-y-1 my-1">
                    {item.subItems.map((sub: any) => (
                      <AppLink
                        key={sub.id}
                        href={`/supplier/${sub.id}`}
                        onClick={() => {
                          setActiveTab(sub.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                          activeTab === sub.id
                            ? "bg-primary-default text-white font-black shadow-xs"
                            : "text-text-muted hover:text-primary hover:bg-surface"
                        }`}
                      >
                        {sub.icon}
                        <span>{sub.label}</span>
                      </AppLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border-subtle space-y-4 shrink-0 bg-card">
          <div className="bg-surface/50 p-4 rounded-xl text-center border border-border-default">
            <p className="text-xs text-text-primary font-medium mb-2">
              نیاز به راهنمایی دارید؟
            </p>
            <p className="text-[10px] text-text-muted mb-2 leading-relaxed">
              برای هرگونه سوال، ابهام یا مشکل، لطفاً تیکت پشتیبانی ثبت کنید:
            </p>
            <button
              onClick={() => {
                setActiveTab("tickets");
                setIsMobileMenuOpen(false);
              }}
              className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2.5 bg-primary-default text-inverse rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors shadow-sm cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              <span>ارسال تیکت به پشتیبانی</span>
            </button>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-danger hover:bg-danger/10 transition-colors"
            aria-label="خروج از حساب کاربری"
          >
            <LogOut className="w-5 h-5" /> خروج از حساب
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden w-full">
        {/* Header */}
        <header className="bg-card px-4 sm:px-8 py-3.5 sm:py-5 flex items-center justify-between border-b border-subtle shadow-sm relative z-30 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-surface text-text-secondary hover:text-text-primary border border-border-default cursor-pointer"
              aria-label="باز کردن منو"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg sm:text-2xl font-bold text-primary truncate">
              {getDynamicNavItems().find((i) => i.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="bg-surface text-muted text-[11px] sm:text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success" /> 
              <span className="hidden xs:inline">حساب فعال</span>
            </div>
            <button
              onClick={() => setShowAutomationVideoModal(true)}
              className="p-2 sm:px-3 sm:py-1.5 bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-indigo-500/10 hover:from-rose-500/20 hover:to-indigo-500/20 text-rose-600 dark:text-rose-400 rounded-xl transition-all duration-200 border border-rose-500/30 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs group"
              title="مشاهده ویدیوی ۱ دقیقه‌ای آموزش سریع تامین‌کننده"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <Play className="w-3.5 h-3.5 fill-current text-rose-500 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-black hidden sm:inline-block">آموزش سریع ۶۰ ثانیه‌ای</span>
            </button>
            <button
              onClick={() => setShowEducationModal(true)}
              className="p-2 bg-surface hover:bg-emerald-500/10 text-muted hover:text-emerald-600 rounded-xl transition-all duration-200 border border-subtle hover:border-emerald-200 cursor-pointer flex items-center justify-center gap-1.5"
              title="مرکز آموزش و ویدیوهای راهنما"
            >
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
              <span className="text-[11px] font-bold text-emerald-600 hidden md:inline-block">آموزش</span>
            </button>
            <NotificationBell
              userRole="SUPPLIER"
              onNavigateTab={(tabId) => setActiveTab(tabId)}
            />
          </div>
        </header>

        <EducationModal
          isOpen={showEducationModal}
          onClose={() => setShowEducationModal(false)}
        />

        <AutomationVideoModal
          isOpen={showAutomationVideoModal}
          onClose={() => setShowAutomationVideoModal(false)}
          role="SUPPLIER"
        />
        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-8 relative">
          
          {loading ? (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <CardSkeleton rows={2} />
                <CardSkeleton rows={2} />
                <CardSkeleton rows={2} />
                <CardSkeleton rows={2} />
              </div>
              <TableSkeleton cols={6} rows={6} />
            </div>
          ) : (
            <>
              
              {/* OVERVIEW TAB */}
              {activeTab === "overview" && (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* Supplier Order / Request Announcement Alert */}
                  {orders.length > 0 && (
                    <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-2 border-amber-500/40 p-5 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-md animate-pulse">
                          <Bell className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-extrabold text-base text-primary flex items-center gap-2">
                            <span>اطلاعیه ثبت درخواست جدید برای تامین‌کننده</span>
                            <span className="bg-amber-500 text-white text-xs px-2.5 py-0.5 rounded-full font-bold">
                              {orders.filter(o => o.status === "REQUESTED" || o.status === "PAID" || o.status === "PENDING").length} درخواست جدید
                            </span>
                          </h3>
                          <p className="text-xs text-secondary mt-1 leading-relaxed">
                            همکار گرامی، درخواست‌ها و سفارش‌های جدیدی از طرف فروشگاه‌ها و معرفی‌کنندگان زوپیت برای مجموعه شما ثبت شده است. جهت پردازش و ارسال، لیست سفارشات را بررسی نمایید.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                        {pushPermission !== "granted" && (
                          <button
                            type="button"
                            onClick={handleRequestPushPermission}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5"
                          >
                            <BellRing className="w-4 h-4 animate-bounce" />
                            <span>فعال‌سازی اعلان مرورگر</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setActiveTab("orders")}
                          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all shadow cursor-pointer flex items-center gap-1.5"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>مشاهده و بررسی سفارشات</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* KYC / Account Activation Alert Banner */}
                  {!(user?.isVerified || user?.kycVerified) && (
                    <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs animate-fade-in">
                      <div className="flex items-center gap-2.5 text-right">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                        <span>
                          حساب شما هنوز فعال نشده است. برای ثبت کد رهگیری سفارش‌ها و تسویه‌حساب{" "}
                          <strong className="underline decoration-amber-500 font-bold">«تکمیل مدارک»</strong> را کلیک کنید.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("profile")}
                        className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shrink-0 shadow-xs active:scale-95"
                      >
                        تکمیل مدارک
                      </button>
                    </div>
                  )}

                  {/* Compact Welcome Banner */}
                  <div className="bg-gradient-to-r from-primary-default via-indigo-600 to-primary-hover rounded-2xl p-5 text-white shadow-md relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="relative z-10">
                      <h2 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
                        <span>سلام، {user?.firstName || "همکار"} عزیز! 👋</span>
                      </h2>
                      <p className="text-white/85 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                        به پنل تامین‌کنندگان خوش آمدید. مدیریت سریع سفارش‌ها، ثبت کد رهگیری و تسویه‌حساب‌ها.
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab("add-product")}
                      className="bg-white text-primary-default hover:bg-slate-100 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm active:scale-95 cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4 text-primary-default" />
                      <span>افزودن محصول جدید</span>
                    </button>
                  </div>

                  {/* Smart Settlement Reminder (After 3+ fulfilled orders) */}
                  {(() => {
                    const fulfilledOrdersCount = orders.filter(
                      (o) => o.status === "SHIPPED" || o.status === "COMPLETED" || o.status === "DELIVERED"
                    ).length;
                    const walletBalance = walletInfo.wallet?.balance || 0;
                    if (fulfilledOrdersCount >= 3 && walletBalance > 0) {
                      return (
                        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 border border-emerald-500/30 p-4 md:p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm animate-fade-in">
                          <div className="flex items-center gap-3 text-right">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
                              <Wallet className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="text-xs md:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <span>🔔 یادآوری تسویه حساب سفارشات ارسالی</span>
                                <span className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                                  {fulfilledOrdersCount.toLocaleString('fa-IR')} سفارش ارسال شده
                                </span>
                              </h4>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 font-medium leading-relaxed">
                                همکار گرامی، موجودی کیف پول شما مبلغ <strong>{walletBalance.toLocaleString('fa-IR')} تومان</strong> است. در صورت تمایل می‌توانید جهت واریز به شماره شبای خود، درخواست تسویه ثبت نمایید.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveTab("wallet")}
                            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                          >
                            <CreditCard className="w-4 h-4" />
                            <span>ثبت درخواست تسویه حساب</span>
                          </button>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Highly Visible Label Printing Box for Supplier */}
                  {(() => {
                    const pendingLabelOrders = orders.filter(
                      (o) => (o.status === "PENDING_POSTAL_LABEL" || o.order?.status === "PENDING_POSTAL_LABEL" || o.status === "PAID" || o.status === "PREPARING") && o.order?.postalLabel
                    );
                    if (pendingLabelOrders.length === 0) return null;
                    return (
                      <div className="bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/20 dark:to-amber-950/10 border-2 border-rose-500/30 p-6 rounded-3xl shadow-lg space-y-4">
                        <div className="flex items-center justify-between border-b border-rose-200/50 dark:border-rose-800/30 pb-3">
                          <div className="flex items-center gap-2.5 text-rose-800 dark:text-rose-400">
                            <Printer className="w-6 h-6 animate-pulse" />
                            <h3 className="text-base font-extrabold">
                              📥 صدور فوری لیبل‌های پستی جدید (آماده چاپ)
                            </h3>
                          </div>
                          <span className="bg-rose-600 text-white text-xs px-3 py-1 rounded-full font-bold shadow-md shadow-rose-600/20 animate-bounce">
                            {pendingLabelOrders.length.toLocaleString('fa-IR')} سفارش نیازمند چاپ فوری
                          </span>
                        </div>
                        <p className="text-xs text-rose-900/85 dark:text-rose-300/80 leading-relaxed font-bold">
                          همکار گرامی، هزینه ارسال سفارشات زیر پرداخت شده و لیبل پستی آن‌ها توسط مدیریت بارگذاری گردیده است. طبق قوانین پلتفرم، جهت جلوگیری از جریمه دیرکرد، لطفاً سریعاً نسبت به دانلود، چاپ و الصاق برچسب پستی روی کارتن مرسوله اقدام کرده و بسته را تحویل پست/تیپاکس دهید:
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {pendingLabelOrders.map((o) => (
                            <div key={o.id} className="bg-white/80 dark:bg-card/80 p-4 rounded-2xl border border-rose-500/20 flex flex-col justify-between gap-3 shadow-xs">
                              <div className="space-y-1 text-right">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-black text-rose-800 dark:text-rose-400">
                                    سفارش شماره #{o.id.toLocaleString('fa-IR')}
                                  </span>
                                  <span className="text-[10px] bg-slate-100 dark:bg-surface text-secondary px-2 py-0.5 rounded-lg font-bold">
                                    {o.order?.shippingMethod === "TIPAX" ? "ارسال با تیپاکس" : "ارسال با پست"}
                                  </span>
                                </div>
                                <h4 className="text-xs font-extrabold text-primary pt-1">
                                  {o.product?.name} <span className="text-muted">({o.quantity || 1} عدد)</span>
                                </h4>
                                <p className="text-[10px] text-muted font-medium">
                                  خریدار: {o.order?.shippingRecipientName || "مشتری زوپیت"}
                                </p>
                              </div>
                              
                              <a
                                href={o.order?.postalLabel}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-rose-600 hover:bg-rose-700 text-white hover:text-white py-2.5 rounded-xl font-black text-xs text-center transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-600/10 active:scale-95"
                              >
                                <Printer className="w-4 h-4" />
                                چاپ لیبل پستی پلتفرم
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 4 Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Total Products */}
                    <div
                      className="bg-card p-4 sm:p-5 rounded-2xl shadow-xs border border-subtle flex items-center gap-3.5 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setActiveTab("products")}
                    >
                      <div className="w-11 h-11 rounded-xl bg-primary-default/10 text-primary-default flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted font-bold mb-0.5">تعداد محصولات</p>
                        <h3 className="text-xl sm:text-2xl font-black text-primary">
                          {products.length.toLocaleString('fa-IR')}
                        </h3>
                      </div>
                    </div>

                    {/* Card 2: In-Progress Orders */}
                    <div
                      className="bg-card p-4 sm:p-5 rounded-2xl shadow-xs border border-subtle flex items-center gap-3.5 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setActiveTab("orders")}
                    >
                      <div className="w-11 h-11 rounded-xl bg-info/10 text-info flex items-center justify-center shrink-0">
                        <ShoppingCart className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted font-bold mb-0.5">سفارشات در جریان</p>
                        <h3 className="text-xl sm:text-2xl font-black text-primary">
                          {orders.filter((o) => !["DELIVERED", "COMPLETED", "CANCELLED", "REJECTED"].includes(o.status)).length.toLocaleString('fa-IR')}
                        </h3>
                      </div>
                    </div>

                    {/* Card 3: Orders Pending Shipment */}
                    <div
                      className="bg-card p-4 sm:p-5 rounded-2xl shadow-xs border border-subtle flex items-center gap-3.5 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setActiveTab("orders")}
                    >
                      <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted font-bold mb-0.5">نیازمند ارسال</p>
                        <h3 className="text-xl sm:text-2xl font-black text-amber-600">
                          {orders.filter((o) => ["PAID", "PREPARING", "PENDING_POSTAL_LABEL", "PROCESSING", "REQUESTED", "WAITING_SUPPLIER_CONFIRMATION", "NEW"].includes(o.status)).length.toLocaleString('fa-IR')}
                        </h3>
                      </div>
                    </div>

                    {/* Card 4: Wallet Balance */}
                    <div
                      className="bg-card p-4 sm:p-5 rounded-2xl shadow-xs border border-subtle flex items-center gap-3.5 hover:shadow-md transition-all cursor-pointer"
                      onClick={() => setActiveTab("wallet")}
                    >
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted font-bold mb-0.5">موجودی کیف پول</p>
                        <h3 className="text-lg sm:text-xl font-black text-emerald-600 font-mono">
                          {(walletInfo.wallet?.balance || 0).toLocaleString('fa-IR')}{" "}
                          <span className="text-[11px] font-normal">تومان</span>
                        </h3>
                      </div>
                    </div>
                  </div>

                  {/* Operational Table: «سفارش‌های نیازمند ارسال» */}
                  {(() => {
                    const pendingShipmentOrders = orders.filter((o) =>
                      ["PAID", "PREPARING", "PENDING_POSTAL_LABEL", "PROCESSING", "REQUESTED", "WAITING_SUPPLIER_CONFIRMATION", "NEW"].includes(o.status)
                    );

                    return (
                      <div className="bg-card rounded-2xl p-5 shadow-xs border border-subtle space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-subtle pb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
                              <Truck className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-base font-extrabold text-primary flex items-center gap-2">
                                <span>سفارش‌های نیازمند ارسال</span>
                                <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs px-2.5 py-0.5 rounded-full font-bold">
                                  {pendingShipmentOrders.length.toLocaleString('fa-IR')} سفارش
                                </span>
                              </h3>
                              <p className="text-xs text-muted">
                                لیست سفارشاتی که پرداخت شده یا تایید شده و منتظر ثبت کد رهگیری پستی و ارسال هستند.
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => setActiveTab("orders")}
                            className="text-xs font-bold text-primary-default hover:text-primary-hover flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                          >
                            مشاهده همه سفارش‌ها ←
                          </button>
                        </div>

                        {pendingShipmentOrders.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-right text-xs">
                              <thead className="bg-surface border-b border-subtle text-muted font-bold">
                                <tr>
                                  <th className="p-3">شماره سفارش</th>
                                  <th className="p-3">نام محصول</th>
                                  <th className="p-3">آدرس / شهر مقصد</th>
                                  <th className="p-3 text-center">وضعیت</th>
                                  <th className="p-3 text-center">اقدام سریع</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-subtle">
                                {pendingShipmentOrders.slice(0, 8).map((order) => {
                                  const cityProvince =
                                    [order.order?.shippingProvince, order.order?.shippingCity]
                                      .filter(Boolean)
                                      .join(" - ") ||
                                    order.order?.shippingAddress ||
                                    "ثبت‌شده در سیستم";

                                  return (
                                    <tr key={order.id} className="hover:bg-surface/50 transition-colors">
                                      <td className="p-3 font-mono font-bold text-primary-default">
                                        #{order.id}
                                        {order.order?.createdAt && (
                                          <div className="text-[10px] text-muted font-normal">
                                            {new Date(order.order.createdAt).toLocaleDateString("fa-IR")}
                                          </div>
                                        )}
                                      </td>
                                      <td className="p-3">
                                        <div className="font-bold text-primary max-w-[220px] truncate" title={order.product?.name}>
                                          {order.product?.name}
                                        </div>
                                        <div className="text-[11px] text-muted font-mono mt-0.5">
                                          تعداد: {order.quantity || 1} عدد
                                        </div>
                                      </td>
                                      <td className="p-3">
                                        <div className="text-secondary font-medium max-w-[200px] truncate" title={cityProvince}>
                                          {cityProvince}
                                        </div>
                                        <div className="text-[10px] text-muted truncate">
                                          گیرنده: {order.order?.shippingRecipientName || "مشتری زوپیت"}
                                        </div>
                                      </td>
                                      <td className="p-3 text-center">
                                        <span
                                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                            order.status === "PAID" || order.status === "PROCESSING" || order.status === "PREPARING"
                                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                              : order.status === "PENDING_POSTAL_LABEL"
                                              ? "bg-blue-100 text-blue-800 border-blue-300"
                                              : "bg-amber-100 text-amber-800 border-amber-300"
                                          }`}
                                        >
                                          {getPersianStatus(order.status)}
                                        </span>
                                      </td>
                                      <td className="p-3 text-center">
                                        <button
                                          onClick={() => {
                                            setChangingOrder(order);
                                            setChangeStatus("SHIPPED");
                                            setChangeTracking(order.trackingCode || "");
                                          }}
                                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 mx-auto cursor-pointer active:scale-95"
                                        >
                                          <Truck className="w-3.5 h-3.5" />
                                          <span>ثبت کد رهگیری / ارسال</span>
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-surface/30 rounded-xl border border-dashed border-subtle">
                            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                            <p className="text-xs font-bold text-primary">هیچ سفارشی در انتظار ارسال نیست</p>
                            <p className="text-[11px] text-muted mt-1">تمام سفارش‌های ثبت شده ارسال گردیده‌اند.</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                  {/* Business Performance & Insights Section */}
                  <div className="bg-card p-6 rounded-3xl shadow-sm border border-subtle">
                    
                    <div className="flex items-center gap-3 mb-6">
                      
                      <div className="p-2.5 bg-primary-default/10 text-primary-default rounded-xl">
                        
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        
                        <h3 className="text-lg font-bold text-primary">
                          تحلیل عملکرد و بینش‌های کسب‌وکار
                        </h3>
                        <p className="text-xs text-muted">
                          نمودارهای هوشمند از حجم فروش ماهیانه و برترین
                          دسته‌بندی‌های محصولات شما
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      
                      {/* Monthly Sales Volume */}
                      <div className="bg-background/50 p-5 rounded-2xl border border-subtle/80">
                        
                        <h4 className="text-sm font-bold text-secondary mb-4">
                          نمودار حجم فروش ماهیانه (۶ ماه اخیر)
                        </h4>
                        <div className="w-full h-64">
                          
                          <ResponsiveContainer width="100%" height="100%">
                            
                            <LineChart
                              data={[
                                { month: "فروردین", "حجم فروش": 12000000 },
                                { month: "اردیبهشت", "حجم فروش": 18000000 },
                                { month: "خرداد", "حجم فروش": 15000000 },
                                { month: "تیر", "حجم فروش": 22000000 },
                                { month: "مرداد", "حجم فروش": 31000000 },
                                { month: "شهریور", "حجم فروش": 28000000 },
                              ]}
                              margin={{
                                top: 10,
                                right: 10,
                                left: 0,
                                bottom: 0,
                              }}
                            >
                              
                              <XAxis
                                dataKey="month"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#64748b", fontSize: 11 }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#64748b", fontSize: 11 }}
                                tickFormatter={(value) =>
                                  `${(value / 1000000).toFixed(1)}M`
                                }
                              />
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e2e8f0"
                              />
                              <Tooltip
                                contentStyle={{
                                  borderRadius: "12px",
                                  border: "none",
                                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                                formatter={(value: any) => [
                                  (value !== null && value !== undefined && typeof value.toLocaleString === "function" ? value.toLocaleString() : String(value || 0)) + " تومان",
                                  "حجم فروش",
                                ]}
                              />
                              <Line
                                type="monotone"
                                dataKey="حجم فروش"
                                stroke="#4f46e5"
                                strokeWidth={3.5}
                                dot={{
                                  r: 5,
                                  stroke: "#4f46e5",
                                  strokeWidth: 2,
                                  fill: "#fff",
                                }}
                                activeDot={{ r: 7 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      {/* Top Selling Categories */}
                      <div className="bg-background/50 p-5 rounded-2xl border border-subtle/80">
                        
                        <h4 className="text-sm font-bold text-secondary mb-4">
                          مقایسه فروش دسته‌بندی‌های محصولات شما
                        </h4>
                        <div className="w-full h-64">
                          
                          <ResponsiveContainer width="100%" height="100%">
                            
                            <BarChart
                              data={[
                                { name: "آرایشی و بهداشتی", فروش: 45 },
                                { name: "پوشاک و مد", فروش: 32 },
                                { name: "الکترونیک", فروش: 18 },
                                { name: "لوازم خانگی", فروش: 12 },
                                { name: "کتاب و هنر", فروش: 25 },
                              ]}
                              margin={{
                                top: 10,
                                right: 10,
                                left: 0,
                                bottom: 0,
                              }}
                              barSize={24}
                            >
                              
                              <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#64748b", fontSize: 10 }}
                              />
                              <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: "#64748b", fontSize: 11 }}
                              />
                              <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#e2e8f0"
                              />
                              <Tooltip
                                contentStyle={{
                                  borderRadius: "12px",
                                  border: "none",
                                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                                }}
                              />
                              <Bar
                                dataKey="فروش"
                                fill="#10b981"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}
              {/* PRODUCTS TAB */}
              {activeTab === "products" &&
                (sysConfig["SUPPLIER_CATALOG_ENABLED"] === false ? (
                  renderMaintenance("محصولات من")
                ) : (
                  <div className="space-y-6 animate-fade-in">
                    {/* Simple Header with Title and Single Purple Button */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-5 rounded-2xl shadow-sm border border-subtle gap-4">
                      <div>
                        <h2 className="text-xl font-black text-primary flex items-center gap-2">
                          <Package className="w-6 h-6 text-indigo-600" />
                          مدیریت محصولات
                        </h2>
                        <p className="text-xs text-muted mt-1">
                          مشاهده، جستجو و به‌روزرسانی کالاهای ثبت‌شده در پلتفرم زوپیت
                        </p>
                      </div>

                      <button
                        onClick={() => setActiveTab("add-product")}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md hover:shadow-indigo-600/20 flex items-center gap-2 cursor-pointer shrink-0"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ افزودن محصول جدید</span>
                      </button>
                    </div>

                    {/* Filter and Quick Excel View Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between bg-card p-4 rounded-2xl shadow-sm border border-subtle gap-3">
                      <div className="relative w-full sm:w-80">
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          placeholder="جستجوی نام، برند یا شناسه کالا..."
                          className="w-full pl-10 pr-4 py-2 bg-background border border-subtle rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                      </div>

                      <button
                        onClick={() => setIsQuickEditMode(!isQuickEditMode)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 border ${
                          isQuickEditMode
                            ? "bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-600/20"
                            : "bg-surface text-secondary hover:bg-border/60 border-subtle"
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>{isQuickEditMode ? "خروج از نمای اکسلی" : "⚡ ویرایش سریع (نمای اکسلی)"}</span>
                      </button>
                    </div>

                    {/* Excel Quick Edit Save Banner */}
                    {isQuickEditMode && Object.keys(quickEditValues).length > 0 && (
                      <div className="bg-indigo-950 text-white p-4 rounded-2xl flex items-center justify-between shadow-xl border border-indigo-700/50 animate-fade-in">
                        <div className="flex items-center gap-2.5">
                          <Sparkles className="w-5 h-5 text-amber-400" />
                          <span className="text-xs sm:text-sm font-bold">
                            تعداد {Object.keys(quickEditValues).length} تغییر قیمت/موجودی در حال ثبت است.
                          </span>
                        </div>
                        <button
                          onClick={async () => {
                            setIsSavingQuickEdit(true);
                            setTimeout(() => {
                              // Apply quickEditValues to local products state
                              setProducts((prev) =>
                                prev.map((p) => {
                                  if (quickEditValues[p.id]) {
                                    const edit = quickEditValues[p.id];
                                    return {
                                      ...p,
                                      supplierBasePrice: edit.supplierBasePrice ?? p.supplierBasePrice,
                                      variants: p.variants?.map((v: any) => ({
                                        ...v,
                                        stock: edit.stock ?? v.stock,
                                      })),
                                    };
                                  }
                                  return p;
                                })
                              );
                              setIsSavingQuickEdit(false);
                              setQuickEditValues({});
                              if (showNotification) {
                                showNotification("تغییرات قیمت و موجودی اکسلی با موفقیت ذخیره شد.", "success");
                              }
                            }, 600);
                          }}
                          disabled={isSavingQuickEdit}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2 rounded-xl font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          <span>{isSavingQuickEdit ? "در حال ذخیره..." : "ذخیره تغییرات جدول اکسل"}</span>
                        </button>
                      </div>
                    )}

                    <div className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden">
                      {products.filter((p) =>
                        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                        (p.brand && p.brand.toLowerCase().includes(productSearch.toLowerCase())) ||
                        String(p.id).includes(productSearch)
                      ).length > 0 ? (
                        <table className="w-full text-right text-sm min-w-[800px]">
                          <thead className="bg-background border-b border-subtle text-muted font-bold text-xs">
                            <tr>
                              <th className="px-4 py-4 text-center">تصویر کالا</th>
                              <th className="px-6 py-4">نام محصول و شناسه</th>
                              <th className="px-6 py-4">برند</th>
                              <th className="px-6 py-4">موجودی انبار</th>
                              <th className="px-6 py-4">قیمت پایه (تومان)</th>
                              <th className="px-6 py-4">وضعیت</th>
                              <th className="px-6 py-4 text-center">عملیات</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {products.filter((p) =>
                              p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                              (p.brand && p.brand.toLowerCase().includes(productSearch.toLowerCase())) ||
                              String(p.id).includes(productSearch)
                            ).map((product) => {
                              const currentEdit: { stock?: number; supplierBasePrice?: number } = quickEditValues[product.id] || {};
                              const currentStock = currentEdit.stock ?? (product.variants?.[0]?.stock || 0);
                              const currentPrice = currentEdit.supplierBasePrice ?? product.supplierBasePrice;
                              const prodImg = Array.isArray(product.images) && product.images.length > 0
                                ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0]?.url)
                                : (product.imageUrl || product.mainImage || '');

                              return (
                                <tr
                                  key={product.id}
                                  className={`hover:bg-background transition-colors ${
                                    isQuickEditMode ? "bg-indigo-50/20 dark:bg-indigo-950/10" : ""
                                  }`}
                                >
                                  {/* Product Thumbnail (40x40px) */}
                                  <td className="px-4 py-3 text-center">
                                    {prodImg ? (
                                      <img
                                        src={prodImg}
                                        alt={product.name}
                                        className="w-10 h-10 object-cover rounded-lg border border-subtle mx-auto shadow-xs"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center mx-auto text-muted border border-subtle">
                                        <Package className="w-5 h-5" />
                                      </div>
                                    )}
                                  </td>

                                  {/* Product Name & ID */}
                                  <td className="px-6 py-4">
                                    <span className="font-bold text-primary block leading-snug">
                                      {product.name}
                                    </span>
                                    <span className="font-mono text-muted text-[11px] block mt-0.5">
                                      شناسه: #{product.id} {product.sku ? `| SKU: ${product.sku}` : ""}
                                    </span>
                                  </td>

                                  {/* Brand */}
                                  <td className="px-6 py-4 text-muted text-xs font-medium">
                                    {product.brand || "-"}
                                  </td>

                                  {/* Stock */}
                                  <td className="px-6 py-4">
                                    {isQuickEditMode ? (
                                      <input
                                        type="number"
                                        min="0"
                                        value={currentStock}
                                        onChange={(e) => {
                                          const newStock = parseInt(e.target.value) || 0;
                                          setQuickEditValues({
                                            ...quickEditValues,
                                            [product.id]: {
                                              ...currentEdit,
                                              stock: newStock,
                                              supplierBasePrice: currentPrice,
                                            },
                                          });
                                        }}
                                        className="w-24 px-3 py-1.5 bg-background border-2 border-indigo-400 rounded-lg text-xs font-mono font-bold text-center outline-none focus:ring-2 focus:ring-indigo-600"
                                      />
                                    ) : (
                                      <span className={`font-mono font-bold text-xs px-2.5 py-1 rounded-lg ${
                                        currentStock > 0 ? "bg-slate-100 dark:bg-slate-800 text-secondary" : "bg-rose-50 text-rose-600 dark:bg-rose-950/30"
                                      }`}>
                                        {currentStock} عدد
                                      </span>
                                    )}
                                  </td>

                                  {/* Base Price */}
                                  <td className="px-6 py-4">
                                    {isQuickEditMode ? (
                                      <input
                                        type="number"
                                        step="1000"
                                        value={currentPrice}
                                        onChange={(e) => {
                                          const newPrice = parseInt(e.target.value) || 0;
                                          setQuickEditValues({
                                            ...quickEditValues,
                                            [product.id]: {
                                              ...currentEdit,
                                              stock: currentStock,
                                              supplierBasePrice: newPrice,
                                            },
                                          });
                                        }}
                                        className="w-32 px-3 py-1.5 bg-background border-2 border-indigo-400 rounded-lg text-xs font-mono font-bold text-center outline-none focus:ring-2 focus:ring-indigo-600"
                                      />
                                    ) : (
                                      <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                                        {currentPrice.toLocaleString("fa-IR")}
                                      </span>
                                    )}
                                  </td>

                                  {/* Status */}
                                  <td className="px-6 py-4">
                                    <span
                                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                        product.status === "ACTIVE" || product.status === "PUBLISHED"
                                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                                          : product.status === "PENDING_APPROVAL" || product.status === "SUSPENDED"
                                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                                          : product.status === "REJECTED"
                                          ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800"
                                      }`}
                                    >
                                      {product.status === "ACTIVE" || product.status === "PUBLISHED"
                                        ? "فعال"
                                        : product.status === "REJECTED"
                                        ? "رد شده"
                                        : "در انتظار تایید"}
                                    </span>
                                  </td>

                                  {/* Operations: Neutral Blue Edit Button */}
                                  <td className="px-6 py-4 text-center">
                                    <button
                                      onClick={() => {
                                        setProductToEdit(product);
                                        setActiveTab("edit-product");
                                      }}
                                      className="bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs hover:shadow-sm active:scale-95"
                                    >
                                      ویرایش
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="text-center py-16 text-muted">
                          
                          <Package className="w-16 h-16 mx-auto text-inverse mb-4" />
                          <p className="text-lg font-medium text-secondary mb-1">
                            محصولی یافت نشد
                          </p>
                          <p className="text-sm">
                            شما هنوز محصولی در فروشگاه خود ثبت نکرده‌اید.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              {/* ORDERS TAB */}
              {activeTab === "orders" &&
                (() => {
                  if (sysConfig["SUPPLIER_ORDERS_ENABLED"] === false) {
                    return renderMaintenance("سفارشات");
                  }
                  
                  const filteredOrders = orders.filter((order) => {
                    // Date filter
                    if (orderDateFilter !== "all" && order.order?.createdAt) {
                      const orderTime = new Date(order.order.createdAt).getTime();
                      const now = Date.now();
                      const oneDay = 24 * 60 * 60 * 1000;
                      if (orderDateFilter === "today" && (now - orderTime) > oneDay) return false;
                      if (orderDateFilter === "week" && (now - orderTime) > 7 * oneDay) return false;
                      if (orderDateFilter === "month" && (now - orderTime) > 30 * oneDay) return false;
                    }
                    // Status filter
                    if (orderStatusFilter !== "all") {
                      if (orderStatusFilter === "PENDING" && !["REQUESTED", "PENDING", "NEW", "WAITING_SUPPLIER_CONFIRMATION"].includes(order.status)) return false;
                      if (orderStatusFilter === "CONFIRMED" && !["CONFIRMED", "PREPARING", "PENDING_POSTAL_LABEL", "PROCESSING", "PAID"].includes(order.status)) return false;
                      if (orderStatusFilter === "SHIPPED" && !["SHIPPED", "DELIVERED", "COMPLETED"].includes(order.status)) return false;
                      if (orderStatusFilter === "CANCELLED" && !["CANCELLED", "REJECTED"].includes(order.status)) return false;
                    }
                    // Search
                    if (orderSearchQuery.trim()) {
                      const q = orderSearchQuery.trim().toLowerCase();
                      const matchId = String(order.id).toLowerCase().includes(q) || String(order.orderId || "").toLowerCase().includes(q);
                      const matchName = (order.product?.name || "").toLowerCase().includes(q);
                      const matchSku = (order.product?.sku || "").toLowerCase().includes(q);
                      const matchStore = (order.order?.store?.storeName || order.order?.store?.username || "").toLowerCase().includes(q);
                      if (!matchId && !matchName && !matchSku && !matchStore) return false;
                    }
                    return true;
                  });

                  const approvableOrders = filteredOrders.filter(
                    (o) => o.status === "REQUESTED" || o.status === "PENDING" || o.status === "NEW" || o.status === "WAITING_SUPPLIER_CONFIRMATION",
                  );

                  const allFilteredIds = filteredOrders.map((o) => o.id);
                  const isAllFilteredSelected = allFilteredIds.length > 0 && allFilteredIds.every((id) => selectedItems.includes(id));
                  const isAllApprovableSelected = approvableOrders.length > 0 && approvableOrders.every((o) => selectedItems.includes(o.id));

                  return (
                    <div className="space-y-6 animate-fade-in">
                      {/* Top Header & Export */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
                            <ShoppingCart className="w-6 h-6 text-primary-default" />
                            مدیریت سفارشات دریافتی
                          </h2>
                          <p className="text-xs text-text-muted mt-1">
                            بررسی، تایید و ارسال سفارشات فروشگاه‌ها
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleExportCSV}
                            className="bg-success/10 text-success hover:bg-success/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border border-emerald-200 cursor-pointer shadow-sm shadow-emerald-50"
                          >
                            <FileText className="w-4 h-4" /> خروجی اکسل (CSV)
                          </button>
                        </div>
                      </div>

                      {/* Filters and Search Bar */}
                      <div className="bg-card border border-subtle rounded-2xl p-4 space-y-4 shadow-sm">
                        {/* Status Filter Tabs */}
                        <div className="flex flex-wrap gap-2 border-b border-subtle pb-3">
                          <button
                            onClick={() => setOrderStatusFilter("all")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              orderStatusFilter === "all"
                                ? "bg-primary-default text-white shadow-md shadow-primary-default/20"
                                : "bg-surface text-secondary hover:bg-border/60"
                            }`}
                          >
                            همه سفارشات ({orders.length})
                          </button>
                          <button
                            onClick={() => setOrderStatusFilter("PENDING")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              orderStatusFilter === "PENDING"
                                ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
                                : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                            }`}
                          >
                            در انتظار تایید ({orders.filter(o => ["REQUESTED", "PENDING", "NEW", "WAITING_SUPPLIER_CONFIRMATION"].includes(o.status)).length})
                          </button>
                          <button
                            onClick={() => setOrderStatusFilter("CONFIRMED")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              orderStatusFilter === "CONFIRMED"
                                ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                            }`}
                          >
                            تایید شده / در حال آماده‌سازی ({orders.filter(o => ["CONFIRMED", "PREPARING", "PENDING_POSTAL_LABEL", "PROCESSING", "PAID"].includes(o.status)).length})
                          </button>
                          <button
                            onClick={() => setOrderStatusFilter("SHIPPED")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              orderStatusFilter === "SHIPPED"
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            }`}
                          >
                            ارسال شده ({orders.filter(o => ["SHIPPED", "DELIVERED", "COMPLETED"].includes(o.status)).length})
                          </button>
                          <button
                            onClick={() => setOrderStatusFilter("CANCELLED")}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              orderStatusFilter === "CANCELLED"
                                ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                            }`}
                          >
                            لغو / رد شده ({orders.filter(o => ["CANCELLED", "REJECTED"].includes(o.status)).length})
                          </button>
                        </div>

                        {/* Search and Date Filter Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                          {/* Search Input */}
                          <div className="md:col-span-6 relative">
                            <input
                              type="text"
                              placeholder="جستجو بر اساس شماره سفارش، نام کالا، SKU، نام فروشگاه..."
                              value={orderSearchQuery}
                              onChange={(e) => setOrderSearchQuery(e.target.value)}
                              className="w-full pl-8 pr-10 py-2.5 bg-background border border-subtle rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-all"
                            />
                            <Search className="w-4 h-4 text-text-muted absolute right-3.5 top-3" />
                            {orderSearchQuery && (
                              <button
                                onClick={() => setOrderSearchQuery("")}
                                className="absolute left-3 top-3 text-text-muted hover:text-text-primary"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          {/* Date Range Filter */}
                          <div className="md:col-span-6 flex items-center justify-end gap-2">
                            <span className="text-xs text-text-muted flex items-center gap-1 shrink-0">
                              <Calendar className="w-3.5 h-3.5" /> فیلتر تاریخ:
                            </span>
                            <div className="flex bg-surface rounded-xl p-1 border border-subtle text-xs gap-1">
                              <button
                                onClick={() => setOrderDateFilter("all")}
                                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                                  orderDateFilter === "all" ? "bg-primary-default text-white" : "text-text-muted hover:text-text-primary"
                                }`}
                              >
                                همه
                              </button>
                              <button
                                onClick={() => setOrderDateFilter("today")}
                                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                                  orderDateFilter === "today" ? "bg-primary-default text-white" : "text-text-muted hover:text-text-primary"
                                }`}
                              >
                                امروز
                              </button>
                              <button
                                onClick={() => setOrderDateFilter("week")}
                                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                                  orderDateFilter === "week" ? "bg-primary-default text-white" : "text-text-muted hover:text-text-primary"
                                }`}
                              >
                                ۷ روز اخیر
                              </button>
                              <button
                                onClick={() => setOrderDateFilter("month")}
                                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                                  orderDateFilter === "month" ? "bg-primary-default text-white" : "text-text-muted hover:text-text-primary"
                                }`}
                              >
                                ۳۰ روز اخیر
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Fast Select All Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-subtle text-xs">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (isAllFilteredSelected) {
                                  setSelectedItems([]);
                                } else {
                                  setSelectedItems(allFilteredIds);
                                }
                              }}
                              className="px-3 py-1.5 bg-surface hover:bg-border/60 border border-subtle rounded-xl font-bold text-text-primary flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              {isAllFilteredSelected ? (
                                <CheckSquare className="w-4 h-4 text-primary-default" />
                              ) : (
                                <Square className="w-4 h-4 text-text-muted" />
                              )}
                              <span>انتخاب همه موارد این لیست ({filteredOrders.length})</span>
                            </button>

                            {approvableOrders.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (isAllApprovableSelected) {
                                    setSelectedItems([]);
                                  } else {
                                    setSelectedItems(approvableOrders.map(o => o.id));
                                  }
                                }}
                                className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <CheckCheck className="w-4 h-4" />
                                <span>انتخاب فقط سفارشات در انتظار تایید ({approvableOrders.length})</span>
                              </button>
                            )}

                            {selectedItems.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setSelectedItems([])}
                                className="px-2.5 py-1.5 text-rose-600 hover:underline font-bold cursor-pointer"
                              >
                                لغو انتخاب‌ها
                              </button>
                            )}
                          </div>

                          <div className="text-text-muted">
                            نمایش <span className="font-bold text-text-primary font-mono">{filteredOrders.length}</span> از <span className="font-bold text-text-primary font-mono">{orders.length}</span> سفارش
                            {selectedItems.length > 0 && (
                              <span className="mr-2 text-primary-default font-black">
                                ({selectedItems.length} مورد انتخاب شده)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Selected Items Batch Floating Banner */}
                      {selectedItems.length > 0 && (
                        <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in shadow-xl shadow-indigo-950/20 border border-indigo-700/40">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-inner">
                              <Truck className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="font-black text-white text-sm">
                                تعداد {selectedItems.length} سفارش برای عملیات ارسال انتخاب شده است.
                              </p>
                              <p className="text-xs text-slate-200 mt-0.5 font-medium">
                                می‌توانید وضعیت تمام سفارشات انتخاب شده را به صورت یکجا به «ارسال شد» تغییر داده و تحویل پست دهید.
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full md:w-auto">
                            <button
                              onClick={approveBatchOrders}
                              className="flex-1 md:flex-initial bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer active:scale-95"
                            >
                              <Truck className="w-4 h-4" />
                              ارسال شد ({selectedItems.length})
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Orders Table */}
                      <div className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden">
                        {filteredOrders.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm min-w-[850px]">
                              <thead className="bg-background border-b border-subtle text-muted font-bold text-xs">
                                <tr>
                                  <th className="px-4 py-4 w-12 text-center">
                                    <input
                                      type="checkbox"
                                      className="rounded border-default text-primary-default focus:ring-primary-default w-4 h-4 cursor-pointer"
                                      checked={isAllFilteredSelected}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedItems(allFilteredIds);
                                        } else {
                                          setSelectedItems([]);
                                        }
                                      }}
                                      title="انتخاب همه"
                                    />
                                  </th>
                                  <th className="px-5 py-4">شماره سفارش و تاریخ</th>
                                  <th className="px-5 py-4">محصول / SKU / فروشگاه</th>
                                  <th className="px-4 py-4 text-center">تعداد</th>
                                  <th className="px-5 py-4">آدرس مقصد (شهر/استان)</th>
                                  <th className="px-5 py-4">وضعیت</th>
                                  <th className="px-5 py-4 text-center">عملیات</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredOrders.map((order) => {
                                  const isSelected = selectedItems.includes(order.id);
                                  const storeName = order.order?.store?.storeName || order.order?.store?.username || "فروشگاه همکار";
                                  const cityProvince = (order.order?.province || order.order?.city)
                                    ? `${order.order?.province || "تهران"} - ${order.order?.city || "تهران"}`
                                    : "تهران (پیش‌فرض)";

                                  return (
                                    <tr
                                      key={order.id}
                                      className={`hover:bg-background/80 transition-colors ${isSelected ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""}`}
                                    >
                                      <td className="px-4 py-4 text-center">
                                        <input
                                          type="checkbox"
                                          className="rounded border-default text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                                          checked={isSelected}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setSelectedItems([...selectedItems, order.id]);
                                            } else {
                                              setSelectedItems(selectedItems.filter((id) => id !== order.id));
                                            }
                                          }}
                                        />
                                      </td>

                                      {/* Order ID & Date */}
                                      <td className="px-5 py-4">
                                        <div className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                                          #{order.id}
                                        </div>
                                        <div className="text-[11px] text-muted mt-0.5">
                                          {order.order?.createdAt
                                            ? new Date(order.order.createdAt).toLocaleDateString("fa-IR")
                                            : "ثبت شده"}
                                        </div>
                                      </td>

                                      {/* Product, SKU & Store */}
                                      <td className="px-5 py-4 max-w-[280px]">
                                        <div className="font-bold text-primary text-xs sm:text-sm truncate" title={order.product?.name}>
                                          {order.product?.name}
                                        </div>
                                        <div className="flex items-center gap-2 mt-1 text-xs">
                                          <span className="text-muted font-mono bg-surface px-2 py-0.5 rounded border border-subtle">
                                            SKU: {order.product?.sku || "ندارد"}
                                          </span>
                                          <span className="text-indigo-600 font-medium truncate">
                                            {storeName}
                                          </span>
                                        </div>
                                      </td>

                                      {/* Quantity */}
                                      <td className="px-4 py-4 text-center font-black text-primary">
                                        {order.quantity || 1} عدد
                                      </td>

                                      {/* City & Province */}
                                      <td className="px-5 py-4 text-xs font-semibold text-secondary">
                                        <div className="flex items-center gap-1.5">
                                          <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                          <span>{cityProvince}</span>
                                        </div>
                                        {order.order?.shippingAddress && (
                                          <p className="text-[10px] text-muted truncate max-w-[180px] mt-0.5" title={order.order.shippingAddress}>
                                            {order.order.shippingAddress}
                                          </p>
                                        )}
                                      </td>

                                      {/* Order Status */}
                                      <td className="px-5 py-4">
                                        <span
                                          className={`px-3 py-1 rounded-full text-xs font-black border shadow-xs inline-flex items-center gap-1 ${
                                            order.status === "REQUESTED" || order.status === "NEW" || order.status === "WAITING_SUPPLIER_CONFIRMATION" || order.status === "PENDING"
                                              ? "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400"
                                              : order.status === "SHIPPED" || order.status === "PAID" || order.status === "COMPLETED" || order.status === "DELIVERED"
                                                ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-400"
                                                : order.status === "CONFIRMED" || order.status === "PREPARING" || order.status === "PENDING_POSTAL_LABEL" || order.status === "PROCESSING"
                                                  ? "bg-indigo-500/10 text-indigo-700 border-indigo-500/30 dark:text-indigo-400"
                                                  : "bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-400"
                                          }`}
                                        >
                                          <span className={`w-1.5 h-1.5 rounded-full ${
                                            ["SHIPPED", "COMPLETED", "DELIVERED"].includes(order.status)
                                              ? "bg-emerald-500"
                                              : ["REQUESTED", "PENDING", "NEW"].includes(order.status)
                                                ? "bg-amber-500 animate-pulse"
                                                : "bg-indigo-500"
                                          }`}></span>
                                          {getPersianStatus(order.status)}
                                        </span>
                                      </td>

                                      {/* Operations Column */}
                                      <td className="px-5 py-4 text-center">
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5">
                                          {/* Main Green Action Button: View & Submit Dispatch */}
                                          <button
                                            onClick={() => {
                                              setChangingOrder(order);
                                              setChangeStatus(order.status);
                                              setChangeTracking(order.trackingCode || "");
                                            }}
                                            className="w-full sm:w-auto px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                                          >
                                            <Package className="w-3.5 h-3.5" />
                                            <span>مشاهده و ثبت ارسال</span>
                                          </button>

                                          {/* Print Label Shortcut Button */}
                                          <button
                                            onClick={() => handlePrintPostalLabel(order)}
                                            className="p-2 bg-surface hover:bg-subtle text-muted hover:text-primary rounded-xl border border-subtle transition-all cursor-pointer"
                                            title="🖨️ چاپ مستقیم لیبل پستی"
                                          >
                                            <Printer className="w-4 h-4 text-indigo-600" />
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-16 text-muted">
                            <ShoppingCart className="w-16 h-16 mx-auto text-muted mb-4 opacity-50" />
                            <p className="text-lg font-medium text-secondary mb-1">
                              سفارشی مطابق فیلتر یافت نشد
                            </p>
                            <p className="text-xs text-text-muted">
                              می‌توانید فیلترهای جستجو یا تاریخ را تغییر دهید.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              {/* WALLET TAB */}
              {activeTab === "wallet" &&
                (sysConfig["SUPPLIER_FINANCIAL_ENABLED"] === false ? (
                  renderMaintenance("کیف پول و تسویه")
                ) : (
                  <div className="space-y-6 animate-fade-in">
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden md:col-span-2 flex flex-col justify-between min-h-[220px]">
                        
                        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary-default rounded-full blur-3xl opacity-30"></div>
                        <div className="absolute top-10 right-10 w-32 h-32 bg-purple-500 rounded-full blur-3xl opacity-20"></div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 h-full w-full">
                          
                          <div>
                            
                            <p className="text-slate-200 font-bold mb-1">
                              موجودی قابل تسویه (تومان)
                            </p>
                            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">
                              
                              {Number(
                                walletInfo.balance || 0,
                              ).toLocaleString()}
                            </h2>
                            <div className="flex flex-col gap-1.5 mt-4 text-xs text-slate-200">
                              
                              <div className="flex items-center gap-2">
                                
                                <CheckCircle className="w-4 h-4 text-success" />
                                <span>شماره شبا ثبت شده:</span>
                                <span className="font-mono text-white bg-white/10 px-2 py-0.5 rounded text-xs">
                                  {user?.shaba || "ثبت نشده"}
                                </span>
                              </div>
                              {user?.bankName && (
                                <div className="flex items-center gap-2">
                                  
                                  <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] text-white">
                                    🏦
                                  </span>
                                  <span>نام بانک:</span>
                                  <span className="text-white font-medium">
                                    {user.bankName}
                                  </span>
                                </div>
                              )}
                              {user?.accountHolderName && (
                                <div className="flex items-center gap-2">
                                  
                                  <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[8px] text-white">
                                    👤
                                  </span>
                                  <span>صاحب حساب:</span>
                                  <span className="text-white font-medium">
                                    {user.accountHolderName}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-3 w-full md:w-auto">
                            
                            <button
                              onClick={() => setIsWithdrawalModalOpen(true)}
                              className="bg-white text-indigo-950 px-6 py-3.5 rounded-2xl font-extrabold shadow-lg hover:bg-indigo-50 active:scale-95 transition-all whitespace-nowrap self-stretch md:self-auto text-center cursor-pointer"
                            >
                              
                              درخواست تسویه حساب
                            </button>
                            <div className="flex gap-2">
                              
                              <input
                                type="number"
                                placeholder="مبلغ شارژ"
                                value={depositAmount}
                                onChange={(e) =>
                                  setDepositAmount(e.target.value)
                                }
                                className="bg-white/15 border border-white/20 text-white placeholder:text-white/60 rounded-xl px-3 py-2 outline-none focus:bg-white/25 focus:border-white/40 transition-all w-28 text-sm"
                              />
                              <button
                                onClick={handleDeposit}
                                className="bg-primary-default text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-primary-hover active:scale-95 transition-all whitespace-nowrap cursor-pointer shadow-md shadow-primary-default/20"
                              >
                                
                                شارژ حساب
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        
                        <div className="bg-warning/10 rounded-3xl p-5 border border-amber-100 shadow-sm flex flex-col justify-center">
                          
                          <p className="text-amber-800 font-medium mb-1 text-sm">
                            موجودی در انتظار تسویه (تومان)
                          </p>
                          <h3 className="text-2xl font-bold text-amber-900">
                            
                            {Number(
                              walletInfo.pendingBalance || 0,
                            ).toLocaleString()}
                          </h3>
                          <div className="mt-2 text-xs font-medium text-warning flex items-center gap-1">
                            
                            <Clock className="w-3 h-3 text-warning" /> سفارش‌های
                            در جریان (تسویه‌نشده)
                          </div>
                        </div>
                        <div className="bg-card rounded-3xl p-5 border border-subtle shadow-sm flex flex-col justify-center">
                          
                          <p className="text-muted font-medium mb-1 text-sm">
                            کل درآمدهای شما (تومان)
                          </p>
                          <h3 className="text-2xl font-bold text-primary">
                            
                            {Number(
                              walletInfo.totalEarnings || 0,
                            ).toLocaleString()}
                          </h3>
                          <div className="mt-2 text-xs font-medium text-success flex items-center gap-1">
                            
                            <TrendingUp className="w-3 h-3" /> درآمد کل کسب
                            شده
                          </div>
                        </div>
                        <div className="bg-card rounded-3xl p-5 border border-subtle shadow-sm flex flex-col justify-center">
                          
                          <p className="text-muted font-medium mb-1 text-sm">
                            کل تسویه شده (تومان)
                          </p>
                          <h3 className="text-2xl font-bold text-primary">
                            
                            {Number(
                              walletInfo.totalWithdrawn || 0,
                            ).toLocaleString()}
                          </h3>
                          <div className="mt-2 text-xs font-medium text-primary-default flex items-center gap-1">
                            
                            <Wallet className="w-3 h-3" /> مبالغ واریز شده به
                            حساب
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden">
                      
                      <div className="p-6 border-b border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        
                        <div className="flex gap-6 border-b border-subtle pb-0">
                          
                          <button
                            onClick={() => setWalletSubTab("ledger")}
                            className={`pb-3 font-bold text-base transition-colors relative ${walletSubTab === "ledger" ? "text-primary-default border-b-2 border-primary-default" : "text-muted hover:text-muted"}`}
                          >
                            
                            دفتر معین مالی (تراکنش‌ها)
                          </button>
                          <button
                            onClick={() => setWalletSubTab("payouts")}
                            className={`pb-3 font-bold text-base transition-colors relative ${walletSubTab === "payouts" ? "text-primary-default border-b-2 border-primary-default" : "text-muted hover:text-muted"}`}
                          >
                            
                            تاریخچه درخواست‌های تسویه حساب
                          </button>
                        </div>
                        {walletSubTab === "ledger" && (
                          <div className="flex gap-2">
                            
                            <select className="bg-background border border-subtle text-secondary text-sm rounded-lg focus:ring-primary-default focus:border-primary-default block p-2">
                              
                              <option value="">همه وضعیت‌ها</option>
                              <option value="COMPLETED">موفق</option>
                              <option value="PENDING">در حال انجام</option>
                              <option value="FAILED">ناموفق</option>
                            </select>
                            <select className="bg-background border border-subtle text-secondary text-sm rounded-lg focus:ring-primary-default focus:border-primary-default block p-2">
                              
                              <option value="">همه انواع</option>
                              <option value="ORDER_REVENUE">درآمد فروش</option>
                              <option value="WITHDRAWAL">
                                برداشت/تسویه
                              </option>
                            </select>
                          </div>
                        )}
                      </div>
                      {walletSubTab === "ledger" ? (
                        walletInfo.history && walletInfo.history.length > 0 ? (
                          <div className="divide-y divide-slate-100">
                            
                            {walletInfo.history.map((tx: any) => (
                              <div
                                key={tx.id}
                                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-background transition-colors gap-4"
                              >
                                
                                <div className="flex items-center gap-4">
                                  
                                  <div
                                    className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${tx.type === "ORDER_REVENUE" || tx.type === "CREDIT" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"}`}
                                  >
                                    
                                    {tx.type === "ORDER_REVENUE" ||
                                    tx.type === "CREDIT" ? (
                                      <TrendingUp className="w-6 h-6" />
                                    ) : (
                                      <TrendingUp className="w-6 h-6 transform rotate-180" />
                                    )}
                                  </div>
                                  <div>
                                    
                                    <p className="font-bold text-primary text-base">
                                      
                                      {tx.type === "ORDER_REVENUE" ||
                                      tx.type === "CREDIT"
                                        ? "درآمد حاصل از فروش"
                                        : "درخواست تسویه حساب"}
                                    </p>
                                    <p className="text-sm text-muted mt-1">
                                      
                                      {tx.description}
                                    </p>
                                    <div className="flex gap-3 mt-2 text-xs">
                                      
                                      <span className="font-mono text-muted">
                                        
                                        {new Date(
                                          tx.createdAt,
                                        ).toLocaleDateString("fa-IR")}
                                        -
                                        {new Date(
                                          tx.createdAt,
                                        ).toLocaleTimeString("fa-IR", {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded-full font-medium ${tx.status === "COMPLETED" ? "bg-success/20 text-success" : tx.status === "PENDING" ? "bg-warning/20 text-warning" : "bg-danger/20 text-danger"}`}
                                      >
                                        
                                        {tx.status === "COMPLETED"
                                          ? "موفق"
                                          : tx.status === "PENDING"
                                            ? "در حال پردازش"
                                            : "ناموفق"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end shrink-0">
                                  
                                  <span
                                    className={`text-lg font-bold ${tx.type === "ORDER_REVENUE" || tx.type === "CREDIT" ? "text-success" : "text-danger"}`}
                                  >
                                    
                                    {tx.type === "ORDER_REVENUE" ||
                                    tx.type === "CREDIT"
                                      ? "+"
                                      : "-"}
                                    {Number(tx.amount).toLocaleString()}
                                    تومان
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-12 text-center text-muted">
                            
                            <Wallet className="w-16 h-16 mx-auto text-inverse mb-4" />
                            <p className="text-lg font-medium text-secondary mb-1">
                              هیچ تراکنشی یافت نشد
                            </p>
                            <p className="text-sm text-muted">
                              تا کنون فعالیتی در کیف پول شما ثبت نشده است.
                            </p>
                          </div>
                        )
                      ) : walletInfo.payouts &&
                        walletInfo.payouts.length > 0 ? (
                        <div className="overflow-x-auto">
                          
                          <table className="w-full text-right border-collapse min-w-[800px]">
                            
                            <thead>
                              
                              <tr className="bg-background border-b border-subtle text-muted text-sm">
                                
                                <th className="p-4 font-semibold">
                                  کد پیگیری
                                </th>
                                <th className="p-4 font-semibold">
                                  تاریخ درخواست
                                </th>
                                <th className="p-4 font-semibold">
                                  مبلغ درخواستی
                                </th>
                                <th className="p-4 font-semibold">
                                  باقی‌مانده حدودی
                                </th>
                                <th className="p-4 font-semibold">
                                  شماره شبا مقصد
                                </th>
                                <th className="p-4 font-semibold">وضعیت</th>
                                <th className="p-4 font-semibold text-center">
                                  رسید
                                </th>
                                <th className="p-4 font-semibold text-center">
                                  عملیات
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              
                              {walletInfo.payouts.map((po: any) => {
                                const remBalance = Number(
                                  walletInfo.balance || 0,
                                );
                                /* Estimate */ return (
                                  <tr
                                    key={po.id}
                                    className="hover:bg-background transition-colors text-sm text-secondary"
                                  >
                                    
                                    <td className="p-4 font-mono text-xs">
                                      {po.id.substring(0, 8).toUpperCase()}...
                                    </td>
                                    <td className="p-4">
                                      
                                      {new Date(
                                        po.createdAt,
                                      ).toLocaleDateString("fa-IR")}
                                    </td>
                                    <td className="p-4 font-bold text-primary">
                                      
                                      {Number(po.amount).toLocaleString()}
                                      تومان
                                    </td>
                                    <td className="p-4 text-muted">
                                      
                                      {po.status === "PENDING" ||
                                      po.status === "PROCESSING"
                                        ? `${remBalance.toLocaleString()} تومان`
                                        : "محاسبه شده"}
                                    </td>
                                    <td className="p-4 font-mono text-xs">
                                      {po.shaba}
                                    </td>
                                    <td className="p-4">
                                      
                                      <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${po.status === "SUCCESS" ? "bg-success/10 text-success border border-emerald-100" : po.status === "PROCESSING" ? "bg-surface text-blue-700 border border-blue-100" : po.status === "PENDING" ? "bg-warning/10 text-warning border border-amber-100" : "bg-danger/10 text-danger border border-rose-100"}`}
                                      >
                                        
                                        {po.status === "SUCCESS"
                                          ? "واریز شده"
                                          : po.status === "PROCESSING"
                                            ? "در حال پرداخت"
                                            : po.status === "PENDING"
                                              ? "در انتظار تایید"
                                              : "رد شده"}
                                      </span>
                                    </td>
                                    <td className="p-4 text-center">
                                      
                                      {po.receiptUrl ? (
                                        <a
                                          href={po.receiptUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-default/10 hover:bg-primary-default/20 text-primary-hover rounded-lg text-xs font-bold transition-colors"
                                        >
                                          
                                          مشاهده رسید
                                        </a>
                                      ) : po.status === "SUCCESS" ? (
                                        <span className="text-xs text-muted font-bold">
                                          بدون رسید
                                        </span>
                                      ) : (
                                        <span className="text-xs text-inverse">
                                          -
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-4 text-center">
                                      
                                      <button
                                        onClick={() =>
                                          fetchSettlementDetails(po.id)
                                        }
                                        className="text-xs font-bold text-muted hover:text-primary-hover px-3 py-1.5 rounded-lg border border-subtle hover:border-primary-default/30 hover:bg-primary-default/10 transition-colors"
                                      >
                                        
                                        جزئیات
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="p-12 text-center text-muted">
                          
                          <Wallet className="w-16 h-16 mx-auto text-inverse mb-4" />
                          <p className="text-lg font-medium text-secondary mb-1">
                            هیچ درخواست تسویه‌ای یافت نشد
                          </p>
                          <p className="text-sm text-muted">
                            تا کنون درخواست تسویه‌ای ثبت نکرده‌اید.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              {/* WITHDRAWAL MODAL */}
              {isWithdrawalModalOpen && (
                <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  
                  <div className="bg-card rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-subtle animate-scale-up text-right">
                    
                    <div className="flex items-center justify-between mb-6">
                      
                      <h3 className="font-bold text-xl text-primary">
                        درخواست تسویه حساب
                      </h3>
                      <button
                        onClick={() => {
                          setIsWithdrawalModalOpen(false);
                          setWithdrawalAmount("");
                        }}
                        className="text-muted hover:text-muted p-1"
                      >
                        
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    {/* Bank details check */}
                    {!user?.shaba ||
                    !user?.bankName ||
                    !user?.accountHolderName ? (
                      <div className="space-y-4">
                        
                        <div className="bg-danger/10 border border-rose-100 text-rose-800 p-4 rounded-2xl flex items-start gap-3 text-right">
                          
                          <AlertCircle className="w-5 h-5 shrink-0 text-danger mt-0.5" />
                          <div>
                            
                            <p className="font-bold">
                              اطلاعات حساب بانکی ناقص است
                            </p>
                            <p className="text-sm mt-1">
                              جهت ثبت درخواست تسویه حساب، ثبت تمامی اطلاعات زیر
                              در پروفایل الزامی است:
                            </p>
                            <ul className="list-disc list-inside text-xs mt-2 space-y-1 pr-2">
                              
                              <li>شماره شبا معتبر (IR)</li> <li>نام بانک</li>
                              <li>نام و نام خانوادگی صاحب حساب</li>
                            </ul>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsWithdrawalModalOpen(false);
                            setActiveTab("profile");
                          }}
                          className="w-full bg-primary-default hover:bg-primary-hover text-inverse font-bold py-3 rounded-xl transition-colors text-center"
                        >
                          
                          تکمیل اطلاعات در پروفایل
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleWithdrawalSubmit}
                        className="space-y-4"
                      >
                        
                        {/* Quick Balance Status */}
                        <div className="bg-background p-4 rounded-2xl space-y-2 text-sm text-muted text-right">
                          
                          <div className="flex justify-between">
                            
                            <span>موجودی قابل تسویه:</span>
                            <span className="font-bold text-primary-default">
                              {Number(walletInfo.balance || 0).toLocaleString()}
                              تومان
                            </span>
                          </div>
                          <div className="flex justify-between">
                            
                            <span>نام بانک:</span>
                            <span className="font-medium text-primary">
                              {user.bankName}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            
                            <span>صاحب حساب:</span>
                            <span className="font-medium text-primary">
                              {user.accountHolderName}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            
                            <span>شماره شبا:</span>
                            <div className="flex items-center gap-2">
                              
                              <span className="font-mono text-primary">
                                {user.shaba}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyShaba(user.shaba)}
                                className="p-1 hover:bg-surface rounded text-muted hover:text-primary transition-colors cursor-pointer"
                                title="کپی شماره شبا"
                              >
                                
                                {copiedShaba ? (
                                  <Check className="w-4 h-4 text-success" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        {/* Input for Amount */}
                        <div className="text-right">
                          
                          <label className="block text-sm font-semibold text-secondary mb-1.5">
                            مبلغ درخواستی (تومان)
                          </label>
                          <div className="relative">
                            
                            <input
                              type="number"
                              value={withdrawalAmount}
                              onChange={(e) =>
                                setWithdrawalAmount(e.target.value)
                              }
                              placeholder="مبلغ مورد نظر را وارد کنید..."
                              className="w-full px-4 py-3 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none text-left"
                              dir="ltr"
                              required
                            />
                            <span className="absolute right-4 top-3 text-sm text-muted font-semibold">
                              تومان
                            </span>
                          </div>
                          {/* Quick helper buttons */}
                          <div className="flex gap-2 mt-2">
                            
                            <button
                              type="button"
                              onClick={() =>
                                setWithdrawalAmount(
                                  String(
                                    Math.floor(Number(walletInfo.balance || 0)),
                                  ),
                                )
                              }
                              className="text-xs bg-primary-default/10 hover:bg-primary-default/20 text-primary-default px-3 py-1.5 rounded-lg font-medium transition-colors"
                            >
                              
                              تسویه کل موجودی
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setWithdrawalAmount(
                                  String(
                                    Math.floor(
                                      Number(walletInfo.balance || 0) / 2,
                                    ),
                                  ),
                                )
                              }
                              className="text-xs bg-primary-default/10 hover:bg-primary-default/20 text-primary-default px-3 py-1.5 rounded-lg font-medium transition-colors"
                            >
                              
                              ۵۰٪ موجودی
                            </button>
                          </div>
                        </div>
                        {/* Live Calculation */}
                        {withdrawalAmount && Number(withdrawalAmount) > 0 && (
                          <div className="border-t border-subtle pt-3 space-y-1.5 text-sm text-right">
                            
                            <div className="flex justify-between text-muted">
                              
                              <span>مبلغ درخواستی:</span>
                              <span className="font-bold text-secondary">
                                {Number(withdrawalAmount).toLocaleString()}
                                تومان
                              </span>
                            </div>
                            <div className="flex justify-between text-muted">
                              
                              <span>موجودی باقی‌مانده پس از تسویه:</span>
                              <span
                                className={`font-bold ${Number(walletInfo.balance || 0) - Number(withdrawalAmount) < 0 ? "text-danger" : "text-success"}`}
                              >
                                
                                {(
                                  Number(walletInfo.balance || 0) -
                                  Number(withdrawalAmount)
                                ).toLocaleString()}
                                تومان
                              </span>
                            </div>
                            {Number(withdrawalAmount) >
                              Number(walletInfo.balance || 0) && (
                              <p className="text-xs text-danger font-medium mt-1">
                                خطا: مبلغ درخواستی نمی‌تواند بیشتر از موجودی
                                قابل تسویه باشد.
                              </p>
                            )}
                          </div>
                        )}
                        <button
                          type="submit"
                          disabled={
                            isSubmittingWithdrawal ||
                            !withdrawalAmount ||
                            Number(withdrawalAmount) <= 0 ||
                            Number(withdrawalAmount) >
                              Number(walletInfo.balance || 0)
                          }
                          className="w-full bg-primary-default hover:bg-primary-hover disabled:opacity-50 text-inverse font-bold py-3 rounded-xl transition-colors text-center mt-4"
                        >
                          
                          {isSubmittingWithdrawal
                            ? "در حال ثبت درخواست..."
                            : "ثبت نهایی درخواست"}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}
              {/* ADD PRODUCT TAB */}
              {activeTab === "add-product" &&
                (sysConfig["SUPPLIER_CATALOG_ENABLED"] === false ? (
                  renderMaintenance("افزودن محصول")
                ) : (
                  <SupplierAddProduct
                    onSuccess={() => {
                      fetchData();
                      setActiveTab("products");
                    }}
                    onCancel={() => setActiveTab("products")}
                    showNotification={showNotification}
                    onNavigateToTickets={() => {
                      setActiveTicketDepartment("🎁 ثبت رایگان محصولات توسط زوپیت (ارسال لیست قیمت / کاتالوگ)");
                      setActiveTab("tickets");
                    }}
                  />
                ))}
              {/* WOOCOMMERCE IMPORT TAB */}
              {activeTab === "woocommerce-import" && (
                <SupplierWooCommerceImport
                  onSuccess={() => {
                    fetchData();
                    setActiveTab("products");
                  }}
                  onCancel={() => setActiveTab("products")}
                  showNotification={showNotification}
                />
              )}
              {/* EDIT PRODUCT TAB */}
              {activeTab === "edit-product" && productToEdit && (
                <SupplierAddProduct
                  initialData={productToEdit}
                  onSuccess={() => {
                    fetchData();
                    setActiveTab("products");
                    setProductToEdit(null);
                  }}
                  onCancel={() => {
                    setActiveTab("products");
                    setProductToEdit(null);
                  }}
                  showNotification={showNotification}
                  onNavigateToTickets={() => {
                    setActiveTicketDepartment("🎁 ثبت رایگان محصولات توسط زوپیت (ارسال لیست قیمت / کاتالوگ)");
                    setActiveTab("tickets");
                  }}
                />
              )}
              {/* TICKETS TAB */}
              {activeTab === "tickets" && (
                <SupplierTickets showNotification={showNotification} initialDepartment={activeTicketDepartment} />
              )}
              {/* REFERRAL PROGRAM TAB */}
              {activeTab === "referral" && (
                <SupplierReferralProgram user={user} />
              )}
              {/* PERFORMANCE TAB */}
              {activeTab === "performance" && (
                <SupplierPerformancePanel />
              )}
              {/* PROFILE TAB */}
              {activeTab === "profile" && (
                <SupplierProfile
                  user={user}
                  showNotification={showNotification}
                  onUpdateUser={onUpdateUser}
                />
              )}
              {/* ANNOUNCEMENTS TAB */}
              {activeTab === "announcements" && (
                <Announcements role="SUPPLIER" />
              )}
            </>
          )}
        </div>
      </main>
      {/* Settlement Details Modal */}
      {isSettlementModalOpen && selectedSettlement && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          
          <div className="bg-card rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-subtle transform transition-all animate-scale-up font-sans">
            
            <div className="p-6 border-b border-subtle flex items-center justify-between sticky top-0 bg-card/80 backdrop-blur-md z-10">
              
              <h3 className="text-xl font-extrabold text-primary flex items-center gap-2">
                
                <FileText className="w-6 h-6 text-primary-default" /> جزئیات
                درخواست تسویه حساب
              </h3>
              <button
                onClick={() => setIsSettlementModalOpen(false)}
                className="w-10 h-10 rounded-full bg-surface hover:bg-surface text-muted flex items-center justify-center transition-colors"
              >
                
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-8 text-right">
              
              {/* Payment Details if locked */}
              {(selectedSettlement.settlement.status === "SUCCESS" ||
                selectedSettlement.settlement.financiallyLocked) && (
                <div className="bg-success/10/50 p-6 rounded-2xl border border-emerald-100 shadow-sm space-y-4">
                  
                  <h4 className="font-extrabold text-emerald-800 text-sm border-b border-emerald-100 pb-2 flex justify-between items-center">
                    
                    <span className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> اطلاعات پرداخت و رسید
                    </span>
                    <span className="text-[10px] font-bold bg-success/20 text-success px-2 py-0.5 rounded-full">
                      قفل مالی شده (Financially Locked)
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    
                    <div className="space-y-1">
                      
                      <span className="text-success/70 font-bold block">
                        تاریخ پرداخت:
                      </span>
                      <span
                        className="font-mono font-bold text-emerald-900 block"
                        dir="ltr"
                      >
                        
                        {selectedSettlement.settlement.paymentDate
                          ? new Date(
                              selectedSettlement.settlement.paymentDate,
                            ).toLocaleDateString("fa-IR")
                          : "-"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      
                      <span className="text-success/70 font-bold block">
                        کد پیگیری (Reference):
                      </span>
                      <span className="font-mono font-bold text-emerald-900 block">
                        {selectedSettlement.settlement.transactionRef || "-"}
                      </span>
                    </div>
                    <div className="space-y-1">
                      
                      <span className="text-success/70 font-bold block">
                        رسید آپلود شده:
                      </span>
                      {selectedSettlement.settlement.receiptUrl ? (
                        <a
                          href={selectedSettlement.settlement.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-success hover:text-emerald-900 underline font-mono inline-flex items-center gap-1"
                        >
                          
                          مشاهده فایل رسید
                        </a>
                      ) : (
                        <span className="text-emerald-900">بدون فایل</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* Complete Order List & Wallet Credit Breakdown */}
              <div className="space-y-3">
                
                <h4 className="font-extrabold text-primary text-sm flex items-center gap-2">
                  
                  <ShoppingBag className="w-4 h-4 text-primary-default" />
                  سفارشات محاسبه شده در این تسویه
                </h4>
                <div className="border border-subtle rounded-xl overflow-hidden bg-card shadow-sm">
                  
                  <div className="overflow-x-auto">
                    
                    <table className="w-full text-right text-xs min-w-[800px]">
                      
                      <thead className="bg-background border-b border-subtle">
                        
                        <tr>
                          
                          <th className="p-3 font-bold text-muted">
                            سفارش
                          </th>
                          <th className="p-3 font-bold text-muted">
                            محصول (SKU)
                          </th>
                          <th className="p-3 font-bold text-muted text-center">
                            تعداد
                          </th>
                          <th className="p-3 font-bold text-muted">
                            درآمد تأمین‌کننده
                          </th>
                          <th className="p-3 font-bold text-muted">
                            اعتبار به کیف پول
                          </th>
                          <th className="p-3 font-bold text-muted text-center">
                            وضعیت سفارش
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        
                        {selectedSettlement.breakdown.length > 0 ? (
                          selectedSettlement.breakdown.map(
                            (item: any, idx: number) => (
                              <tr
                                key={idx}
                                className="hover:bg-background/50 transition-colors"
                              >
                                
                                <td className="p-3">
                                  
                                  <span className="font-mono text-secondary block">
                                    {item.orderNumber
                                      .substring(0, 8)
                                      .toUpperCase()}
                                    ...
                                  </span>
                                  <span className="text-[10px] text-muted block">
                                    {new Date(
                                      item.orderDate,
                                    ).toLocaleDateString("fa-IR")}
                                  </span>
                                </td>
                                <td className="p-3">
                                  
                                  <span className="font-bold text-secondary block">
                                    {item.productName}
                                  </span>
                                  <span className="font-mono text-muted text-[10px] block">
                                    SKU: {item.sku}
                                  </span>
                                </td>
                                <td className="p-3 text-center font-bold text-secondary">
                                  {item.quantity}
                                </td>
                                <td className="p-3 font-mono font-bold text-primary-default">
                                  {item.supplierRevenue.toLocaleString()} تومان
                                </td>
                                <td className="p-3 font-mono font-bold text-success">
                                  +{item.walletCreditAmount.toLocaleString()}
                                  تومان
                                </td>
                                <td className="p-3 text-center">
                                  
                                  <span className="px-2 py-0.5 rounded-full bg-surface text-muted text-[10px] font-bold">
                                    
                                    {item.currentOrderStatus}
                                  </span>
                                </td>
                              </tr>
                            ),
                          )
                        ) : (
                          <tr>
                            
                            <td
                              colSpan={6}
                              className="p-4 text-center text-muted font-bold"
                            >
                              جزئیاتی یافت نشد
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* REDESIGNED 3-SECTION ORDER DETAILS & POSTAL TRACKING MODAL */}
      {changingOrder && (
        <div className="fixed inset-0 bg-background/75 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all duration-300">
          <div className="bg-card rounded-3xl max-w-2xl w-full shadow-2xl border border-subtle transform transition-all animate-scale-up font-sans overflow-hidden text-right">
            {/* Modal Header */}
            <div className="p-5 border-b border-subtle flex items-center justify-between sticky top-0 bg-card/90 backdrop-blur-md z-10">
              <h3 className="text-base sm:text-lg font-black text-primary flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <span>جزئیات و پیگیری مرسوله سفارش #{changingOrder.id}</span>
              </h3>
              <button
                onClick={() => setChangingOrder(null)}
                className="w-8 h-8 rounded-full bg-surface hover:bg-subtle text-muted flex items-center justify-center transition-all cursor-pointer"
                aria-label="بستن پنجره"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
              {/* SECTION 1: Horizontal Step-by-Step Status Timeline */}
              <div className="bg-surface p-5 rounded-2xl border border-subtle space-y-3">
                <h4 className="text-xs font-black text-primary flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>تایم‌لاین گام‌به‌گام وضعیت مرسوله</span>
                </h4>

                {/* 4-Step Visual Progress Bar */}
                {(() => {
                  const isShipped = ["SHIPPED", "DELIVERED", "COMPLETED"].includes(changingOrder.status);
                  const isDelivered = ["DELIVERED", "COMPLETED"].includes(changingOrder.status);
                  const isPreparing = ["CONFIRMED", "PREPARING", "PENDING_POSTAL_LABEL", "PROCESSING", "PAID"].includes(changingOrder.status) || isShipped;

                  const steps = [
                    { num: 1, label: "ثبت سفارش", active: true, done: true },
                    { num: 2, label: "در حال بسته‌بندی", active: isPreparing, done: isPreparing },
                    { num: 3, label: "تحویل به پست/باربری", active: isShipped, done: isShipped },
                    { num: 4, label: "تحویل نهایی", active: isDelivered, done: isDelivered },
                  ];

                  return (
                    <div className="grid grid-cols-4 gap-2 pt-2 relative">
                      {steps.map((st, idx) => (
                        <div key={idx} className="flex flex-col items-center text-center space-y-1.5 relative z-10">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                              st.done
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/25"
                                : st.active
                                  ? "bg-indigo-600 text-white ring-4 ring-indigo-500/20"
                                  : "bg-background text-muted border border-subtle"
                            }`}
                          >
                            {st.done ? <Check className="w-4 h-4" /> : st.num}
                          </div>
                          <span
                            className={`text-[11px] font-bold ${
                              st.active || st.done ? "text-primary" : "text-muted"
                            }`}
                          >
                            {st.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* SECTION 2: Recipient Details & Postal Label Printing (بسیار مهم) */}
              <div className="bg-card p-5 rounded-2xl border-2 border-indigo-500/20 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-subtle pb-3">
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    اطلاعات آدرس و تحویل‌گیرنده سفارش
                  </span>
                  <span className="text-[11px] font-mono text-muted">
                    فروشگاه: {changingOrder.order?.store?.storeName || changingOrder.order?.store?.username || "ثبت نشده"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed text-secondary">
                  <div className="p-2.5 bg-surface rounded-xl border border-subtle">
                    <strong className="text-primary block">👤 تحویل‌گیرنده:</strong>
                    <span>{changingOrder.order?.recipientName || changingOrder.order?.user?.name || "مشخص نشده"}</span>
                  </div>
                  <div className="p-2.5 bg-surface rounded-xl border border-subtle">
                    <strong className="text-primary block">📞 شماره تماس:</strong>
                    <span className="font-mono">{changingOrder.order?.shippingPhone || changingOrder.order?.user?.phone || "ثبت نشده"}</span>
                  </div>
                  <div className="p-2.5 bg-surface rounded-xl border border-subtle">
                    <strong className="text-primary block">🏛️ استان / شهر:</strong>
                    <span>{changingOrder.order?.province || "تهران"} / {changingOrder.order?.city || "تهران"}</span>
                  </div>
                  <div className="p-2.5 bg-surface rounded-xl border border-subtle">
                    <strong className="text-primary block">📮 کد پستی ۱۰ رقمی:</strong>
                    <span className="font-mono font-bold">{changingOrder.order?.postalCode || "۱۲۳۴۵۶۷۸۹۰"}</span>
                  </div>
                  <div className="md:col-span-2 p-2.5 bg-surface rounded-xl border border-subtle">
                    <strong className="text-primary block">📍 نشانی دقیق پستی:</strong>
                    <span>{changingOrder.order?.shippingAddress || "آدرس دقیق پستی توسط خریدار ثبت گردیده است."}</span>
                  </div>
                </div>

                {/* Print Postal Label Prominent Button */}
                <button
                  type="button"
                  onClick={() => handlePrintPostalLabel(changingOrder)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-black text-xs sm:text-sm py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/25"
                >
                  <Printer className="w-4.5 h-4.5" />
                  <span>🖨️ پرینت آدرس و لیبل پستی (آماده چسباندن روی کارتن)</span>
                </button>
              </div>

              {/* SECTION 3: Dispatch Registration Operations */}
              <div className="bg-surface p-5 rounded-2xl border border-subtle space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-primary flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>عملیات ثبت ارسال توسط تامین‌کننده</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setChangingOrder(null);
                      setInventoryIssueOrder(changingOrder);
                      setIssueMessage("");
                    }}
                    className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>اعلام عدم موجودی / لغو سفارش</span>
                  </button>
                </div>

                {["SHIPPED", "DELIVERED", "COMPLETED"].includes(changingOrder.status) ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-right space-y-2">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-black text-xs sm:text-sm">
                      <CheckCircle className="w-5 h-5" />
                      <span>این سفارش تحویل پست شده و تسویه کیف پول انجام گرفته است.</span>
                    </div>
                    {changingOrder.trackingCode && (
                      <p className="text-xs font-mono font-bold text-primary">
                        کد پیگیری ثبت‌شده: <span className="text-emerald-600 dark:text-emerald-400">{changingOrder.trackingCode}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      await updateOrderStatus(changingOrder.id, "SHIPPED");
                      setChangingOrder(null);
                    }}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-xs font-bold text-primary mb-1.5">
                        کد رهگیری پستی / شماره بارنامه / نام تیپاکس (اختیاری)
                      </label>
                      <input
                        type="text"
                        value={changeTracking}
                        onChange={(e) => setChangeTracking(e.target.value)}
                        placeholder="مثلاً: ۲۴ رقمی پست یا شماره بارنامه تیپاکس..."
                        className="w-full bg-background text-primary border border-subtle rounded-xl px-4 py-2.5 text-xs font-mono outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black py-3.5 px-4 rounded-xl transition-all text-xs sm:text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Truck className="w-4.5 h-4.5" />
                      <span>📦 تأیید و تحویل به پست (شارژ آنی کیف پول)</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Order Timeline Log */}
              <div className="pt-2 border-t border-subtle space-y-2">
                <h5 className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>تاریخچه رویدادهای سفارش:</span>
                </h5>
                <OrderTimeline orderId={changingOrder.orderId} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REPORT INVENTORY ISSUE MODAL */}
      {inventoryIssueOrder && (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-subtle animate-scale-up text-right">
            <div className="flex items-center justify-between mb-4 border-b border-subtle pb-3">
              <h3 className="font-bold text-lg text-danger flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-danger" />
                گزارش مشکل موجودی کالا
              </h3>
              <button
                onClick={() => setInventoryIssueOrder(null)}
                className="text-muted hover:text-primary p-1 cursor-pointer transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleInventoryIssueSubmit} className="space-y-4">
              <div className="bg-danger/5 border border-danger/10 p-3 rounded-2xl text-xs space-y-1 text-slate-600 leading-relaxed">
                <p className="font-bold text-danger">توضیحات مهم:</p>
                <p>
                  شما در حال ثبت گزارش مشکل در تامین یا موجودی کالا برای سفارش مستقیم به شماره 
                  <span className="font-mono text-danger font-bold"> #{inventoryIssueOrder.id} </span> هستید.
                </p>
                <p>
                  کالای سفارش داده شده: <strong>{inventoryIssueOrder.product?.name || "نامشخص"}</strong> به تعداد <strong>{inventoryIssueOrder.quantity || 1}</strong> عدد.
                </p>
                <p>
                  با تایید این فرم، یک تیکت پشتیبانی فوری با بخش پشتیبانی فنی ثبت خواهد شد تا کارشناسان موضوع را با خریدار بررسی کنند.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-muted">
                  توضیح دقیق مشکل و راهکار پیشنهادی شما
                </label>
                <textarea
                  required
                  rows={4}
                  value={issueMessage}
                  onChange={(e) => setIssueMessage(e.target.value)}
                  placeholder="توضیح دهید که آیا کالا به طور کامل ناموجود است، کسری دارد، یا مایل به ارسال کالای جایگزین هستید..."
                  className="w-full bg-background text-primary border border-subtle rounded-xl px-4 py-3 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-danger-default transition-all"
                />
              </div>

              <div className="pt-3 border-t border-subtle flex gap-3">
                <button
                  type="submit"
                  disabled={submittingIssue}
                  className="flex-1 bg-danger hover:bg-rose-700 disabled:opacity-50 text-inverse font-bold py-2.5 rounded-xl transition-all text-xs md:text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  {submittingIssue ? "در حال ثبت گزارش..." : "ارسال گزارش فوری"}
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryIssueOrder(null)}
                  className="flex-1 bg-surface hover:bg-surface text-secondary font-bold py-2.5 rounded-xl transition-all text-xs md:text-sm cursor-pointer"
                >
                  انصراف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable A5 Postal Label Modal */}
      {printLabelOrder && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white text-slate-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative space-y-5 my-8">
            {/* Modal Controls */}
            <div className="flex items-center justify-between border-b pb-3 print:hidden">
              <div className="flex items-center gap-2 text-indigo-700 font-black text-sm md:text-base">
                <Printer className="w-5 h-5" />
                <span>برچسب پستی استاندارد (A5)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>چاپ لیبل (A5)</span>
                </button>
                <button
                  onClick={() => setPrintLabelOrder(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  بستن
                </button>
              </div>
            </div>

            {/* Printable Label Paper Box */}
            <div className="border-2 border-slate-800 rounded-xl p-5 space-y-4 bg-white text-right text-slate-900 dir-rtl print:p-0 print:border-2">
              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-lg text-slate-900">پست پیشتاز / تیپاکس</h3>
                  <p className="text-xs font-mono text-slate-600">سامانه توزیع مرسولات پلتفرم زوپیت (Zupit.ir)</p>
                </div>
                <div className="text-left font-mono">
                  <span className="block text-xs text-slate-500">شماره سفارش:</span>
                  <span className="text-base font-black text-indigo-900">#{printLabelOrder.id}</span>
                </div>
              </div>

              {/* Sender & Receiver Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Sender Box */}
                <div className="border border-slate-300 rounded-lg p-3 bg-slate-50 space-y-1">
                  <span className="text-[10px] font-black uppercase text-indigo-800 tracking-wider block border-b pb-1">
                    فرستنده (تامین‌کننده):
                  </span>
                  <p className="text-xs font-bold">{user?.brandName || user?.firstName || "تامین‌کننده زوپیت"}</p>
                  <p className="text-[11px] text-slate-600">تلفن: {user?.mobile || "ثبت شده در سامانه"}</p>
                  <p className="text-[11px] text-slate-600">کد پستی مبدأ: {user?.postalCode || "۱۹۳۹۵-۴۱۵"}</p>
                  <p className="text-[10px] text-slate-500">آدرس: انبار مرکزی تامین‌کننده زوپیت</p>
                </div>

                {/* Receiver Box */}
                <div className="border-2 border-slate-900 rounded-lg p-3 bg-amber-50/30 space-y-1">
                  <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider block border-b border-amber-200 pb-1">
                    گیرنده (خریدار نهایی):
                  </span>
                  <p className="text-sm font-black text-slate-900">
                    {printLabelOrder.order?.shippingRecipientName || printLabelOrder.order?.customerName || "خریدار زوپیت"}
                  </p>
                  <p className="text-xs font-bold text-slate-800">
                    تلفن گیرنده: {printLabelOrder.order?.shippingPhone || "نامشخص"}
                  </p>
                  <p className="text-xs font-bold text-indigo-900">
                    استان: {printLabelOrder.order?.shippingProvince || "تهران"} — شهر: {printLabelOrder.order?.shippingCity || "تهران"}
                  </p>
                  <p className="text-xs leading-relaxed text-slate-800 font-medium pt-1">
                    آدرس کامل: {printLabelOrder.order?.shippingAddress || "آدرس ثبتی مشتری در پلتفرم"}
                  </p>
                  <div className="pt-1 flex items-center justify-between font-mono font-bold text-xs border-t border-slate-200 mt-2">
                    <span>کد پستی ۱۰ رقمی:</span>
                    <span className="text-sm text-slate-950 font-black">{printLabelOrder.order?.shippingPostalCode || "۱۲۳۴۵۶۷۸۹۰"}</span>
                  </div>
                </div>
              </div>

              {/* Package Content */}
              <div className="border border-slate-300 rounded-lg p-3 text-xs space-y-1">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>محتویات محموله: {printLabelOrder.product?.name || "کالای سفارش داده شده"}</span>
                  <span>تعداد: {printLabelOrder.quantity || 1} عدد</span>
                </div>
                {printLabelOrder.product?.sku && (
                  <p className="font-mono text-[10px] text-slate-500">کد شناسایی SKU: {printLabelOrder.product.sku}</p>
                )}
              </div>

              {/* Barcode Simulator */}
              <div className="pt-2 flex flex-col items-center justify-center space-y-1 border-t border-slate-200">
                <div className="h-10 w-64 bg-slate-900 flex items-center justify-around px-2 text-white font-mono text-[9px] tracking-widest rounded">
                  ||||| ||||||| |||| |||||||| ||||| ||||||
                </div>
                <span className="font-mono text-[10px] font-bold text-slate-600">TRACKING-{printLabelOrder.id}-ZUPIT</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
