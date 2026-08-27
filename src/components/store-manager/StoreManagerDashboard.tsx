import StoreMarketplace from "./StoreMarketplace";
import StoreConnection from "./StoreConnection";
import { StoreManagerProfile } from "./StoreManagerProfile";
import MyCatalog from "./MyCatalog";
import StoreOrders from "./StoreOrders";
import StoreTickets from "./StoreTickets";
import StoreQuestions from "./StoreQuestions";
import { StoreCustomers } from "./StoreCustomers";
import { StoreProAccount } from "./StoreProAccount";
import InstagramPageSettings from "./InstagramPageSettings";
import { toast } from "../GlobalToast";
import { AppLink } from "../AppLink";
import React, { useState, useEffect } from "react";
import Announcements from "../Announcements";
import NotificationBell from "../NotificationBell";
import { requestClientSideZibalPayment } from "../../services/payment/clientPaymentBridge";
import {
  Crown,
  Award,
  Store,
  ShoppingCart,
  ShoppingBag,
  Package,
  Wallet,
  LayoutDashboard,
  LogOut,
  Search,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  X,
  FileText,
  Settings,
  Plus,
  RefreshCw,
  Layers,
  User,
  MessageSquare,
  Upload,
  Paperclip,
  Loader2,
  Copy,
  Check,
  Users,
  HelpCircle,
  Sliders,
  Bell,
  BellRing,
  Megaphone,
  Activity,
  ShieldCheck,
  Scale,
  Folder,
  Globe,
  CreditCard,
  Phone,
  Truck,
  CheckSquare,
  Sparkles,
  Link,
  Tag,
  Share2,
  Box,
  List,
  Grid,
  Info,
  GraduationCap,
  Ticket
} from "lucide-react";
import { EducationModal } from "../EducationModal";
import { ZopitLogo } from "../ZopitLogo";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Store,
  ShoppingCart,
  ShoppingBag,
  Package,
  Wallet,
  Settings,
  User,
  Users,
  MessageSquare,
  HelpCircle,
  FileText,
  Layers,
  Search,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  X,
  Plus,
  RefreshCw,
  Upload,
  Paperclip,
  Loader2,
  Copy,
  Check,
  Sliders,
  Bell,
  Megaphone,
  Activity,
  ShieldCheck,
  Scale,
  Folder,
  Globe,
  CreditCard,
  Phone,
  Truck,
  CheckSquare,
  Sparkles,
  Link,
  Tag,
  Share2,
  Box,
  List,
  Grid,
  Info
};

const getIconComponent = (iconName: any) => {
  if (typeof iconName === "string" && ICON_MAP[iconName]) {
    return ICON_MAP[iconName];
  }
  return LayoutDashboard;
};
import UserDashboardWidgets from "../UserDashboardWidgets";
import LatestAnnouncementsWidget from "../LatestAnnouncementsWidget";
import { useSyncTabWithUrl } from "../../utils/routeSync";
import { getPersianStatus } from "../../utils/statusUtils";

export default function StoreManagerDashboard({
  user,
  onLogout,
  showNotification,
  onUpdateUser,
}: any): React.ReactElement {
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith("/store/") && path.length > "/store/".length) {
        return path.replace("/store/", "");
      }
    }
    return "overview";
  });
  
  // Sync tab with URL
  useSyncTabWithUrl("/store", activeTab, setActiveTab, "overview");

  const [showEducationModal, setShowEducationModal] = useState(false);
  const [unansweredQuestionsCount, setUnansweredQuestionsCount] = useState(0);
  const [sysConfig, setSysConfig] = useState<Record<string, any>>({});
  const [stats, setStats] = useState<any>(null);
  const [marketplaceProducts, setMarketplaceProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [customMenu, setCustomMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalSearchTerm, setGlobalSearchTerm] = useState("");
  const [showInstagramPreview, setShowInstagramPreview] = useState(false);

  /* Clipboard feedback states */
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedSheba, setCopiedSheba] = useState(false);

  const handleCopy = async (text: string, type: "card" | "sheba") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "card") {
        setCopiedCard(true);
        setTimeout(() => setCopiedCard(false), 2000);
      } else {
        setCopiedSheba(true);
        setTimeout(() => setCopiedSheba(false), 2000);
      }
      if (showNotification) {
        showNotification("با موفقیت در حافظه موقت کپی شد", "success");
      }
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  /* Settlements selection */
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [selectedInvoiceForModal, setSelectedInvoiceForModal] =
    useState<any>(null);
  const [receiptUrl, setReceiptUrl] = useState("");

  /* Receipts upload modal states */
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [targetInvoiceForUpload, setTargetInvoiceForUpload] =
    useState<any>(null);
  const [receiptNotes, setReceiptNotes] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      /* 20MB limit */
      if (showNotification)
        showNotification("حجم فایل نباید بیشتر از ۵ مگابایت باشد", "error");
      else toast("حجم فایل نباید بیشتر از ۵ مگابایت باشد", "error");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptUrl(reader.result as string);
      if (showNotification)
        showNotification("تصویر فیش با موفقیت خوانده شد", "success");
    };
    reader.onerror = () => {
      if (showNotification)
        showNotification("خطا در خواندن فایل تصویر", "error");
    };
    reader.readAsDataURL(file);
  };

  const handleReceiptSubmit = async () => {
    if (!receiptUrl.trim()) {
      if (showNotification)
        showNotification(
          "لطفا تصویر فیش واریزی را بارگذاری یا آدرس آن را وارد کنید",
          "error",
        );
      else toast("لطفا تصویر فیش واریزی را بارگذاری یا آدرس آن را وارد کنید", "error");
      return;
    }
    setIsUploading(true);
    const invoiceId = targetInvoiceForUpload?.id || selectedInvoiceForModal?.id;
    try {
      const res = await fetch(
        `/api/store-manager/invoices/${invoiceId}/receipt`, { credentials: "include",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token") || ""}`,
          },
          body: JSON.stringify({ receiptUrl, receiptNotes }),
        },
      );
      const data = await res.json();
      if (res.ok) {
        if (showNotification)
          showNotification(
            "فیش واریزی با موفقیت بارگذاری شد و در انتظار بررسی است.",
            "success",
          );
        else toast("فیش واریزی با موفقیت بارگذاری شد", "success");
        setUploadModalOpen(false);
        setTargetInvoiceForUpload(null);
        setSelectedInvoiceForModal(null);
        setReceiptUrl("");
        setReceiptNotes("");
        fetchData();
      } else {
        if (showNotification)
          showNotification(data.error || "خطا در بارگذاری", "error");
        else toast(data.error || "خطا در بارگذاری", "error");
      }
    } catch (err) {
      if (showNotification) showNotification("خطا در ارتباط با سرور", "error");
      else toast("خطا در ارتباط با سرور", "error");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setSysConfig);
    fetch("/api/menus/STORE_MANAGER")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomMenu(data.filter((item: any) => !item.hidden));
        }
      })
      .catch(console.error);
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || "";
      const headers = { Authorization: `Bearer ${token}` };
      if (activeTab === "overview") {
        const res = await fetch("/api/store-manager/stats", { credentials: "include", headers });
        if (res.ok) setStats(await res.json());
      } else if (activeTab === "marketplace") {
        if (sysConfig["STORE_CATALOG_ENABLED"] === false) return;
      } else if (activeTab === "settlements") {
        const res = await fetch("/api/store-manager/orders?status=unpaid", { credentials: "include",
          headers,
        });
        if (res.ok) setOrders(await res.json());
      } else if (activeTab === "invoices") {
        const res = await fetch("/api/store-manager/invoices", { credentials: "include", headers });
        if (res.ok) setInvoices(await res.json());
      } else if (activeTab === "settings") {
        const res = await fetch("/api/store-manager/settings", { credentials: "include", headers });
        if (res.ok) setSettings(await res.json());
      } else if (activeTab === "wallet") {
        const res = await fetch("/api/store-manager/wallet", { credentials: "include", headers });
        if (res.ok) setWalletInfo(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || Number(depositAmount) < 1000)
      return toast("مبلغ نامعتبر است (حداقل ۱۰۰۰ تومان)", "error");
    try {
      const res = await fetch(`/api/wallet/deposit`, { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
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

  const handlePayInvoice = async (invoiceId: number) => {
    try {
      const res = await fetch(`/api/store-manager/invoices/${invoiceId}/pay`, { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`
        },
      });
      const data = await res.json();
      if (res.ok && data.payLink) {
        window.location.assign(data.payLink);
      } else if (res.ok && data.clientPaymentRequired && data.invoiceId) {
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
        } else {
          toast(clientRes.error || "خطا در اتصال به درگاه پرداخت زیبال", "error");
        }
      } else {
        if (showNotification)
          showNotification(
            data.error || "خطا در ارتباط با درگاه پرداخت",
            "error",
          );
        else toast(data.error || "خطا در ارتباط با درگاه پرداخت", "error");
      }
    } catch (err) {
      if (showNotification)
        showNotification("خطای شبکه در ارتباط با درگاه پرداخت", "error");
      else toast("خطای شبکه در ارتباط با درگاه پرداخت", "error");
    }
  };

  const handleSettleOrders = async () => {
    if (selectedOrders.length === 0) return;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/settle-orders", { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderIds: selectedOrders }),
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

      if (res.ok && data.payLink) {
        setSelectedOrders([]);
        showNotification("در حال انتقال به درگاه پرداخت زیبال...", "success");
        window.location.assign(data.payLink);
        return;
      } else if (res.ok && data.clientPaymentRequired && data.invoiceId) {
        setSelectedOrders([]);
        showNotification("در حال دریافت شناسه پرداخت از درگاه زیبال...", "info");
        const clientRes = await requestClientSideZibalPayment({
          invoiceId: data.invoiceId,
          amountInRials: data.amountInRials,
          merchant: data.merchant,
          callbackUrl: data.callbackUrl,
          description: data.description,
        });
        if (clientRes.success && clientRes.payLink) {
          showNotification("در حال انتقال به درگاه پرداخت زیبال...", "success");
          window.location.assign(clientRes.payLink);
          return;
        } else {
          showNotification(clientRes.error || "خطا در برقراری ارتباط با درگاه پرداخت", "error");
        }
      } else {
        showNotification(
          data.error || "خطا در برقراری ارتباط با درگاه پرداخت",
          "error",
        );
      }
    } catch (err: any) {
      console.error("Settlement error:", err);
      showNotification("خطای شبکه در ارتباط با سرور: " + (err.message || ""), "error");
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/settings", { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        toast("تنظیمات با موفقیت ذخیره شد", "success");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleOrderSelection = (id: number) => {
    if (selectedOrders.includes(id)) {
      setSelectedOrders(selectedOrders.filter((oId) => oId !== id));
    } else {
      setSelectedOrders([...selectedOrders, id]);
    }
  };

  const navItems = [
    {
      id: "overview",
      label: "پیشخوان",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      id: "pro_account",
      label: "اکانت پرو (ویژه)",
      icon: <Crown className="w-5 h-5 text-emerald-500 animate-pulse" />,
    },
    {
      id: "orders",
      label: "سفارشات",
      icon: <ShoppingCart className="w-5 h-5" />,
    },
    {
      id: "marketplace",
      label: "بانک زوپیت (Zopit Bank)",
      icon: <Layers className="w-5 h-5" />,
    },
    {
      id: "my_catalog",
      label: "زوپیتی من",
      icon: <CheckCircle className="w-5 h-5" />,
    },
    {
      id: "invoices",
      label: "صورت‌حساب‌ها",
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: "tickets",
      label: "پشتیبانی / تیکت",
      icon: <MessageSquare className="w-5 h-5" />,
    },
    {
      id: "questions",
      label: "سوالات مشتریان",
      icon: <MessageSquare className="w-5 h-5 text-amber-500" />,
    },
    {
      id: "customers",
      label: "مشتریان من",
      icon: <Users className="w-5 h-5" />,
    },
    {
      id: "announcements",
      label: "اطلاعیه‌ها و پیام‌ها",
      icon: <Bell className="w-5 h-5" />,
    },
    {
      id: "page_settings",
      label: "تنظیمات پیج (زوپیت‌گرام)",
      icon: <Sparkles className="w-5 h-5 text-rose-500" />,
    },
    { id: "profile", label: "مشخصات من", icon: <User className="w-5 h-5" /> },
    {
      id: "settings",
      label: "تنظیمات اتصال",
      icon: <Settings className="w-5 h-5" />,
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderMaintenance = (title: string) => (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
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
      className="flex h-screen bg-background w-full overflow-hidden"
      dir="rtl"
    >
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 right-0 w-64 shrink-0 bg-card border-l border-border-subtle text-text-primary flex flex-col h-full shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
      >
        <div className="p-6 border-b border-border-subtle flex justify-between items-center bg-surface/30">
          <div>
            <div className="mb-3">
              <ZopitLogo size="md" />
            </div>
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <Store className="text-primary-default w-5 h-5" /> پنل مدیر فروشگاه
            </h2>
            <p className="text-text-muted text-xs mt-1 truncate max-w-[200px]">
              {user?.storeName}
            </p>
          </div>
          <button
            className="lg:hidden text-text-muted hover:text-text-primary self-start mt-2"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="بستن منوی ناوبری"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {getDynamicNavItems().map((item) => (
            <AppLink href={`/store/${item.id}`} key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${activeTab === item.id ? "bg-primary-default text-white shadow-lg shadow-primary-default/20" : "text-text-secondary hover:bg-surface hover:text-text-primary"}`}
              aria-label={item.label}
            >
              <div className="flex items-center gap-3">
                <span className={activeTab === item.id ? "text-white" : "text-text-muted"}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.id === "questions" && unansweredQuestionsCount > 0 && (
                <span className="bg-danger text-white text-[10px] font-black px-2 py-0.5 rounded-full shrink-0">
                  {unansweredQuestionsCount}
                </span>
              )}
            </AppLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border-subtle space-y-4">
          <div className="bg-surface/50 p-4 rounded-xl text-center border border-border-default">
            <p className="text-xs text-text-primary font-medium mb-2">
              نیاز به راهنمایی دارید؟
            </p>
            <p className="text-[10px] text-text-muted mb-2 leading-relaxed">
              برای هرگونه سوال، ابهام یا مشکل، لطفاً تیکت پشتیبانی ثبت کنید:
            </p>
            <AppLink href="/store/tickets" 
               onClick={() => setActiveTab("tickets")} 
              className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2.5 bg-primary-default text-inverse rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors shadow-sm cursor-pointer"
            >
              <Ticket className="w-4 h-4" />
              <span>ارسال تیکت به مدیر کل</span>
            </AppLink>
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
      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        <header className="bg-card px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-subtle shadow-sm relative z-40">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button
              className="lg:hidden p-2 -mr-2 text-muted hover:text-secondary bg-background rounded-xl"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="باز کردن منوی ناوبری"
            >
              <LayoutDashboard className="w-6 h-6" />
            </button>
            <h1 className="text-xl lg:text-2xl font-bold text-primary">
              {getDynamicNavItems().find((i) => i.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {activeTab === "marketplace" && (
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="جستجو بر اساس نام یا دسته‌بندی..."
                  value={globalSearchTerm}
                  onChange={(e) => setGlobalSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-success focus:border-success text-right"
                />
                <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
              </div>
            )}

            <button
              onClick={() => setShowEducationModal(true)}
              className="p-2 bg-surface hover:bg-emerald-500/10 text-muted hover:text-emerald-600 rounded-xl transition-all duration-200 border border-subtle hover:border-emerald-200 cursor-pointer flex items-center justify-center gap-1.5"
              title="مرکز آموزش و ویدیوهای راهنما"
            >
              <GraduationCap className="w-5 h-5 text-emerald-500" />
              <span className="text-[11px] font-bold text-emerald-600 hidden md:inline-block">آموزش</span>
            </button>

            <NotificationBell
              userRole="STORE_MANAGER"
              onNavigateTab={(tabId) => setActiveTab(tabId)}
            />
          </div>
        </header>

        <EducationModal
          isOpen={showEducationModal}
          onClose={() => setShowEducationModal(false)}
        />
        <div className="flex-1 overflow-auto p-4 lg:p-8 relative">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <RefreshCw className="w-8 h-8 text-success animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === "overview" && stats && (
                <div className="space-y-8 animate-fade-in">
                  {/* Beautiful Welcome Banner */}
                  <div className="bg-gradient-to-r from-primary-default via-indigo-600 to-primary-hover p-8 rounded-3xl text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <h1 className="text-2xl md:text-3xl font-extrabold mb-2 text-white">
                          سلام،{" "}
                          {user?.firstName
                            ? `${user.firstName} ${user.lastName || ""}`
                            : "مدیر فروشگاه گرامی"}
                          ! 👋
                        </h1>
                        <p className="text-white/90 text-sm md:text-base max-w-xl leading-relaxed">
                          به پیشخوان مدیریت فروشگاه خود خوش آمدید. امروز وضعیت
                          سفارشات، تراز مالی و محصولات جدید بازار را رصد کنید.
                        </p>
                      </div>
                      <AppLink href="/store/marketplace" 
                         onClick={() => setActiveTab("marketplace")} 
                        className="bg-white text-primary-default px-6 py-3 rounded-2xl text-sm font-extrabold shadow-md hover:bg-slate-100 transition-all flex items-center gap-2 self-start md:self-auto shrink-0 group active:scale-95 cursor-pointer"
                      >
                        <Layers className="w-4 h-4 transition-transform group-hover:scale-110 text-primary-default" />
                        مشاهده بانک زوپیت (Zopit Bank)
                      </AppLink>
                    </div>
                  </div>

                  {/* Store Link Alert Banner */}
                  <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border border-amber-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-start sm:items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                        <Globe className="w-6 h-6" />
                      </div>
                      <div className="space-y-1 text-right">
                        <h3 className="text-sm font-black text-primary flex items-center gap-2">
                          <span>🌐 لینک خرید اختصاصی وب‌سایت شما برای خریداران</span>
                          <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                            مهم
                          </span>
                        </h3>
                        <p className="text-xs text-muted leading-relaxed max-w-2xl">
                          {user?.storeLink ? (
                            <>خریداران زوپیت در صفحه اکسپلور مستقیماً به آدرس <strong className="font-mono text-amber-600 dark:text-amber-400 dir-ltr inline-block px-1 bg-amber-500/10 rounded">{user.storeLink}</strong> منتقل می‌شوند.</>
                          ) : (
                            <>خریداران در صفحه اکسپلور زوپیت مستقیماً به سایت اختصاصی شما هدایت می‌شوند. لطفاً آدرس اینترنتی یا لینک خرید فروشگاه خود را تنظیم فرمایید.</>
                          )}
                        </p>
                      </div>
                    </div>
                    <AppLink href="/store/page_settings" 
                       onClick={() => setActiveTab("page_settings")} 
                      className="px-5 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-2xl text-xs font-black transition-all shrink-0 cursor-pointer shadow-md flex items-center justify-center gap-2"
                    >
                      <Globe className="w-4 h-4" />
                      <span>{user?.storeLink ? "ویرایش لینک وب‌سایت" : "تنظیم لینک وب‌سایت فروشگاه"}</span>
                    </AppLink>
                  </div>
                  {/* 3 Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-card to-background p-7 rounded-3xl shadow-sm border border-subtle flex flex-col justify-between min-h-[140px] hover:shadow-lg hover:border-primary-default/20 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden cursor-pointer">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-default/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <p className="text-muted font-bold text-sm block">
                            تعداد کل سفارشات
                          </p>
                          <h3 className="text-3xl font-black text-primary mt-2 group-hover:text-primary-hover transition-colors">
                            {stats.totalOrders || 0}
                            <span className="text-xs text-muted font-normal mr-1">
                              عدد
                            </span>
                          </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-primary-default/10 text-primary-default flex items-center justify-center border border-primary-default/10 transition-all duration-300 group-hover:scale-115 group-hover:bg-primary-default group-hover:text-white group-hover:shadow-md">
                          <ShoppingCart className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="text-xs text-muted pt-4 border-t border-slate-50 flex items-center gap-1.5 mt-4 relative z-10">
                        <Clock className="w-3.5 h-3.5 text-primary-default" />
                        به‌روزرسانی شده در چند لحظه پیش
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-card to-background p-7 rounded-3xl shadow-sm border border-subtle flex flex-col justify-between min-h-[140px] hover:shadow-lg hover:border-success/20 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden cursor-pointer">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-success/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <p className="text-muted font-bold text-sm block">
                            پرداختی به پلتفرم
                          </p>
                          <h3 className="text-3xl font-black text-primary mt-2 group-hover:text-success transition-colors">
                            {(stats.totalPaid || 0).toLocaleString()}
                            <span className="text-xs text-muted font-normal mr-1">
                              تومان
                            </span>
                          </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center border border-emerald-100/10 transition-all duration-300 group-hover:scale-115 group-hover:bg-success group-hover:text-white group-hover:shadow-md">
                          <Wallet className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="text-xs text-success pt-4 border-t border-slate-50 flex items-center gap-1.5 mt-4 relative z-10">
                        <CheckCircle className="w-3.5 h-3.5" /> تراکنش‌های موفق
                        و تایید شده
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-card to-background p-7 rounded-3xl shadow-sm border border-subtle flex flex-col justify-between min-h-[140px] hover:shadow-lg hover:border-warning/20 transition-all duration-300 hover:-translate-y-1 group relative overflow-hidden cursor-pointer">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-warning/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <p className="text-muted font-bold text-sm block">
                            سود خالص (تخمینی)
                          </p>
                          <h3 className="text-3xl font-black text-primary mt-2 group-hover:text-warning transition-colors">
                            {(stats.netProfit || 0).toLocaleString()}
                            <span className="text-xs text-muted font-normal mr-1">
                              تومان
                            </span>
                          </h3>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-warning/10 text-warning flex items-center justify-center border border-amber-100/10 transition-all duration-300 group-hover:scale-115 group-hover:bg-warning group-hover:text-white group-hover:shadow-md">
                          <TrendingUp className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="text-xs text-muted pt-4 border-t border-slate-50 flex items-center gap-1.5 mt-4 relative z-10">
                        <TrendingUp className="w-3.5 h-3.5 text-success" />
                        میانگین حاشیه سود روی کالاهای انتخابی
                      </div>
                    </div>
                  </div>
                  {/* Two Unequal Columns: Recent Activity & Shortcuts */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent activity list */}
                    <div className="lg:col-span-2 bg-card p-6 rounded-3xl border border-subtle shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-primary text-lg">
                          آخرین سفارشات ثبت شده
                        </h3>
                        <AppLink href="/store/orders" 
                           onClick={() => setActiveTab("orders")} 
                          className="text-xs font-bold text-primary-default hover:text-primary-hover transition-colors"
                        >
                          مشاهده همه سفارشات
                        </AppLink>
                      </div>
                      {!stats.recentActivity ||
                      stats.recentActivity.length === 0 ? (
                        <div className="text-center py-12 text-muted text-sm">
                          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          سفارشی یافت نشد.
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {stats.recentActivity.map((activity: any) => (
                            <div
                              key={activity.id}
                              className="flex items-center justify-between p-4 rounded-2xl bg-background border border-subtle hover:bg-surface/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-card flex items-center justify-center border border-subtle">
                                  <ShoppingCart className="w-5 h-5 text-primary-default" />
                                </div>
                                <div>
                                  <span className="text-sm font-bold text-primary block">
                                    سفارش شماره #{activity.id}
                                  </span>
                                  <span className="text-xs text-muted font-medium mt-0.5 block">
                                    {new Date(
                                      activity.createdAt,
                                    ).toLocaleDateString("fa-IR")}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-sm font-black text-primary">
                                  {activity.totalAmount?.toLocaleString()}
                                  <span className="text-[10px] font-normal text-muted">
                                    تومان
                                  </span>
                                </span>
                                <span
                                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border shadow-xs ${
                                    activity.status === "REQUESTED" || activity.status === "NEW" || activity.status === "WAITING_SUPPLIER_CONFIRMATION"
                                      ? "text-purple-800 bg-purple-100 border-purple-300"
                                      : activity.status === "PENDING_PAYMENT" || activity.status === "WAITING_FOR_PAYMENT" || activity.status === "WAITING_SHIPPING_PAYMENT"
                                        ? "text-amber-800 bg-amber-100 border-amber-300"
                                        : activity.status === "PAID" || activity.status === "PENDING_POSTAL_LABEL" || activity.status === "PREPARING"
                                          ? "text-blue-800 bg-blue-100 border-blue-300"
                                          : activity.status === "SHIPPED" || activity.status === "DELIVERED" || activity.status === "COMPLETED" || activity.status === "SUCCESS"
                                            ? "text-emerald-800 bg-emerald-100 border-emerald-300"
                                            : activity.status === "CANCELLED" || activity.status === "REJECTED"
                                              ? "text-rose-800 bg-rose-100 border-rose-300"
                                              : "text-slate-800 bg-slate-100 border-slate-300"
                                  }`}
                                >
                                  {getPersianStatus(activity.status)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                  {/* Better Sellers Section (لیست فروشندگان برتر و بالاتر از میانگین) */}
                  <div className="bg-gradient-to-br from-card to-background p-5 sm:p-7 rounded-3xl border border-subtle shadow-sm">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-subtle">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20 shrink-0">
                          <Crown className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-black text-primary flex items-center gap-2 flex-wrap">
                            <span>لیست فروشندگان برتر شبکه</span>
                            <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/20">Top Sellers</span>
                          </h3>
                          <p className="text-xs text-muted mt-0.5">
                            میانگین فروش شبکه: {stats.averageSales ? stats.averageSales.toLocaleString('fa-IR') : '۰'} تومان
                          </p>
                        </div>
                      </div>
                      <div className="bg-surface px-3 py-1.5 rounded-xl border border-subtle text-xs text-muted flex items-center gap-2">
                        <Award className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>رتبه‌بندی عملکرد بر اساس مجموع فروش موفق</span>
                      </div>
                    </div>

                    {/* Vertical List View */}
                    <div className="space-y-3">
                      {stats.betterSellers && stats.betterSellers.length > 0 ? (
                        stats.betterSellers.map((seller: any, idx: number) => {
                          const isAboveAvg = seller.totalSales >= (stats.averageSales || 0);
                          return (
                            <div
                              key={seller.id || idx}
                              className="p-3.5 sm:p-4 rounded-2xl bg-surface/60 border border-subtle hover:border-amber-500/30 hover:bg-surface transition-all flex items-center justify-between gap-3 shadow-xs relative overflow-hidden group"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Medal / Rank badge */}
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm ${
                                  idx === 0 ? "bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black" :
                                  idx === 1 ? "bg-gradient-to-tr from-slate-300 to-slate-100 text-slate-900 font-black" :
                                  idx === 2 ? "bg-gradient-to-tr from-amber-700 to-amber-600 text-white font-black" :
                                  "bg-card text-muted border border-subtle"
                                }`}>
                                  {idx === 0 ? "🥇 ۱" : idx === 1 ? "🥈 ۲" : idx === 2 ? "🥉 ۳" : idx + 1}
                                </div>

                                {/* Avatar */}
                                <div className="w-9 h-9 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-xs shrink-0 overflow-hidden border border-amber-500/20">
                                  {seller.avatarUrl ? (
                                    <img src={seller.avatarUrl} alt={seller.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    (seller.name || seller.storeName || "ف").charAt(0)
                                  )}
                                </div>

                                <div className="min-w-0">
                                  <h4 className="text-xs sm:text-sm font-black text-primary truncate group-hover:text-amber-500 transition-colors">
                                    {seller.name || seller.storeName}
                                  </h4>
                                  <span className="text-[10px] sm:text-xs text-muted block mt-0.5">
                                    {seller.orderCount || 0} سفارش موفق ثبت شده
                                  </span>
                                </div>
                              </div>

                              <div className="text-left shrink-0">
                                <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                                  {seller.totalSales ? seller.totalSales.toLocaleString('fa-IR') : '۰'}
                                  <span className="text-[9px] font-normal text-muted mr-1">تومان</span>
                                </span>
                                {isAboveAvg && (
                                  <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 border border-emerald-500/20">
                                    + بالاتر از میانگین
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-8 text-center text-xs text-muted">
                          اطلاعات فروشندگان به زودی ثبت خواهد شد.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Shortcuts */}
                    <div className="space-y-6">
                      <div className="bg-card p-6 rounded-3xl border border-subtle shadow-sm flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-primary text-lg mb-6">
                            دسترسی سریع
                          </h3>
                          <div className="space-y-4">
                            <AppLink href="/store/marketplace" 
                               onClick={() => setActiveTab("marketplace")} 
                              className="p-4 rounded-2xl border border-subtle hover:border-primary-default/20 hover:bg-primary-default/5 cursor-pointer transition-all flex items-center gap-4 group"
                             style={{ display: 'block' }}>
                              <div className="w-12 h-12 rounded-xl bg-primary-default/10 text-primary-default flex items-center justify-center shrink-0 transition-colors group-hover:bg-primary-hover group-hover:text-white">
                                <Layers className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="font-bold text-primary text-sm">
                                  بانک زوپیت (Zopit Bank)
                                </h4>
                                <p className="text-xs text-muted mt-1 leading-relaxed">
                                  افزودن محصولات تامین‌کنندگان به بانک اختصاصی
                                  خود
                                </p>
                              </div>
                            </AppLink>
                            <AppLink href="/store/my_catalog" 
                               onClick={() => setActiveTab("my_catalog")} 
                              className="p-4 rounded-2xl border border-subtle hover:border-emerald-100 hover:bg-success/10/20 cursor-pointer transition-all flex items-center gap-4 group"
                             style={{ display: 'block' }}>
                              <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center shrink-0 transition-colors group-hover:bg-success group-hover:text-white">
                                <CheckCircle className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="font-bold text-primary text-sm">
                                  زوپیتی من
                                </h4>
                                <p className="text-xs text-muted mt-1 leading-relaxed">
                                  کالاهای انتخاب شده خود را مدیریت کنید
                                </p>
                              </div>
                            </AppLink>
                            <AppLink href="/store/invoices" 
                               onClick={() => setActiveTab("invoices")} 
                              className="p-4 rounded-2xl border border-subtle hover:border-amber-100 hover:bg-warning/10/20 cursor-pointer transition-all flex items-center gap-4 group"
                             style={{ display: 'block' }}>
                              <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center shrink-0 transition-colors group-hover:bg-warning group-hover:text-white">
                                <Wallet className="w-6 h-6" />
                              </div>
                              <div>
                                <h4 className="font-bold text-primary text-sm">
                                  صورت‌حساب‌ها
                                </h4>
                                <p className="text-xs text-muted mt-1 leading-relaxed">
                                  پرداخت فاکتورها و تسویه با پلتفرم
                                </p>
                              </div>
                            </AppLink>
                          </div>
                        </div>
                      </div>
                      <UserDashboardWidgets role="STORE_MANAGER" />
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "orders" &&
                (sysConfig["STORE_ORDERS_ENABLED"] === false ? (
                  renderMaintenance("مدیریت سفارشات")
                ) : (
                  <StoreOrders
                    user={user}
                    onNavigateToInvoices={() => setActiveTab("invoices")}
                  />
                ))}
              {activeTab === "marketplace" &&
                (sysConfig["STORE_CATALOG_ENABLED"] === false ? (
                  renderMaintenance("زوپیت")
                ) : (
                  <StoreMarketplace globalSearchTerm={globalSearchTerm} />
                ))}
              {activeTab === "my_catalog" &&
                (sysConfig["STORE_CATALOG_ENABLED"] === false ? (
                  renderMaintenance("کاتالوگ من")
                ) : (
                  <MyCatalog />
                ))}
              {activeTab === "invoices" &&
                (sysConfig["STORE_FINANCIAL_ENABLED"] === false ? (
                  renderMaintenance("صورت‌حساب‌ها")
                ) : (
                  <div className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden animate-fade-in">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-background border-b border-subtle text-muted font-medium">
                        <tr>
                          <th className="px-6 py-4">شماره فاکتور</th>
                          <th className="px-6 py-4">مبلغ پرداختی</th>
                          <th className="px-6 py-4">وضعیت</th>
                          <th className="px-6 py-4">تاریخ فاکتور</th>
                          <th className="px-6 py-4 text-left">عملیات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {invoices.map((invoice) => (
                          <tr key={invoice.id} className="hover:bg-background">
                            <td className="px-6 py-4 font-mono font-bold text-secondary">
                              INV-{invoice.id}
                            </td>
                            <td className="px-6 py-4 font-bold">
                              {invoice.totalAmount.toLocaleString()} تومان
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${invoice.status === "PAID" ? "bg-success/20 text-success" : invoice.status === "FAILED" ? "bg-danger/20 text-danger" : "bg-warning/20 text-warning"}`}
                              >
                                {invoice.status === "PAID"
                                  ? "موفق"
                                  : invoice.status === "FAILED"
                                    ? "ناموفق"
                                    : invoice.paymentMethod === "MANUAL" &&
                                        invoice.receiptStatus === "PENDING"
                                      ? "در انتظار تایید"
                                      : "در انتظار پرداخت"}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-muted font-mono">
                              {new Date(invoice.createdAt).toLocaleDateString(
                                "fa-IR",
                              )}
                            </td>
                            <td className="px-6 py-4 text-left flex items-center justify-end gap-2.5">
                              <button
                                onClick={() =>
                                  setSelectedInvoiceForModal(invoice)
                                }
                                className="text-primary-default hover:text-primary-hover font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <FileText className="w-4 h-4" /> مشاهده جزئیات
                              </button>
                              {invoice.paymentMethod === "MANUAL" &&
                                invoice.status !== "PAID" && (
                                  <>
                                    {invoice.receiptStatus === "PENDING" && (
                                      <span className="bg-warning/10 text-warning border border-amber-100 px-2 py-1 rounded-lg text-[10px] font-bold">
                                        
                                        در انتظار تایید فیش
                                      </span>
                                    )}
                                    {invoice.receiptStatus === "REJECTED" && (
                                      <button
                                        onClick={() => {
                                          setTargetInvoiceForUpload(invoice);
                                          setReceiptUrl(
                                            invoice.receiptUrl || "",
                                          );
                                          setReceiptNotes(
                                            invoice.receiptNotes || "",
                                          );
                                          setUploadModalOpen(true);
                                        }}
                                        className="bg-danger/10 hover:bg-danger/20 text-danger border border-rose-100 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                                      >
                                        <Upload className="w-3.5 h-3.5" /> اصلاح
                                        فیش رد شده
                                      </button>
                                    )}
                                    {!invoice.receiptStatus && (
                                      <button
                                        onClick={() => {
                                          setTargetInvoiceForUpload(invoice);
                                          setReceiptUrl("");
                                          setReceiptNotes("");
                                          setUploadModalOpen(true);
                                        }}
                                        className="bg-success hover:bg-emerald-700 text-inverse px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-100"
                                      >
                                        <Upload className="w-3.5 h-3.5" />
                                        بارگذاری فیش
                                      </button>
                                    )}
                                  </>
                                )}
                            </td>
                          </tr>
                        ))}
                        {invoices.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-6 py-10 text-center text-muted"
                            >
                               هیچ صورت‌حسابی یافت نشد.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ))}
              {activeTab === "pro_account" && (
                <StoreProAccount
                  user={user}
                  showNotification={showNotification}
                  onNavigateTab={(tab: string) => setActiveTab(tab)}
                />
              )}
              {activeTab === "settings" && <StoreConnection />}
              {activeTab === "customers" && <StoreCustomers />}
              {activeTab === "page_settings" && (
                <InstagramPageSettings
                  user={user}
                  onUpdateUser={onUpdateUser}
                />
              )}
              {activeTab === "profile" && (
                <StoreManagerProfile
                  user={user}
                  showNotification={showNotification}
                  onUpdateUser={onUpdateUser}
                />
              )}
              {activeTab === "tickets" && <StoreTickets />}
              {activeTab === "questions" && (
                <StoreQuestions onUnansweredCountChange={setUnansweredQuestionsCount} />
              )}
              {activeTab === "announcements" && <Announcements role="STORE_MANAGER" />}
            </>
          )}
        </div>
      </main>

      {/* Invoice Details Modal */}
      {selectedInvoiceForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm">
          <div className="bg-card w-full max-w-3xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-background border-b border-subtle">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-default" /> جزئیات
                فاکتور رسمی فروشگاه
              </h3>
              <button
                onClick={() => setSelectedInvoiceForModal(null)}
                className="p-1.5 rounded-lg text-muted hover:bg-surface transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Modal Content - Scrollable */}
            <div
              id="print-area"
              className="p-6 overflow-y-auto space-y-6 text-right"
            >
              {/* Receipt Header branding */}
              <div className="border border-subtle rounded-2xl p-5 bg-background/50 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-black text-primary">
                    زوپیت (BahanKala)
                  </h2>
                  <p className="text-xs text-muted mt-1">
                    سامانه توزیع و تسویه هوشمند تامین‌کنندگان
                  </p>
                </div>
                <div className="text-left">
                  <div className="text-sm font-bold text-secondary">
                    شماره فاکتور:
                    <span className="font-mono text-primary-default">
                      INV-{selectedInvoiceForModal.id}
                    </span>
                  </div>
                  <div className="text-xs text-muted mt-1">
                    تاریخ صدور:
                    {new Date(
                      selectedInvoiceForModal.createdAt,
                    ).toLocaleDateString("fa-IR")}
                  </div>
                  {selectedInvoiceForModal.paidAt && (
                    <div className="text-xs text-muted">
                      تاریخ پرداخت:
                      {new Date(
                        selectedInvoiceForModal.paidAt,
                      ).toLocaleDateString("fa-IR")}
                    </div>
                  )}
                </div>
              </div>
              {/* Buyer & Payment Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-subtle rounded-xl p-4 space-y-2 bg-card">
                  <h4 className="font-bold text-primary border-b border-slate-50 pb-2 mb-2 text-sm text-primary-default">
                    مشخصات خریدار
                  </h4>
                  <div className="text-sm text-muted">
                    <span className="text-muted ml-1">نام فروشگاه:</span>
                    {user?.storeName || "فروشگاه تست"}
                  </div>
                  <div className="text-sm text-muted">
                    <span className="text-muted ml-1">مدیر فروشگاه:</span>
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-sm text-muted">
                    <span className="text-muted ml-1">شماره تماس:</span>
                    <span className="font-mono">{user?.mobile}</span>
                  </div>
                </div>
                <div className="border border-subtle rounded-xl p-4 space-y-2 bg-card">
                  <h4 className="font-bold text-primary border-b border-slate-50 pb-2 mb-2 text-sm text-primary-default">
                    اطلاعات پرداخت (درگاه زیبال)
                  </h4>
                  <div className="text-sm text-muted">
                    <span className="text-muted ml-1">روش پرداخت:</span> درگاه
                    بانکی زیبال (Zibal)
                  </div>
                  <div className="text-sm text-muted">
                    <span className="text-muted ml-1">کد رهگیری درگاه:</span>
                    <span className="font-mono font-bold text-secondary bg-surface px-1.5 py-0.5 rounded text-xs">
                      {selectedInvoiceForModal.trackId || "ثبت نشده"}
                    </span>
                  </div>
                  <div className="text-sm text-muted">
                    <span className="text-muted ml-1">شناسه تراکنش:</span>
                    <span className="font-mono text-muted text-xs">
                      {selectedInvoiceForModal.gatewayReference || "ثبت نشده"}
                    </span>
                  </div>
                  <div className="text-sm text-muted flex items-center gap-1">
                    <span className="text-muted ml-1">وضعیت پرداخت:</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${selectedInvoiceForModal.status === "PAID" ? "bg-success/20 text-success" : selectedInvoiceForModal.status === "FAILED" ? "bg-danger/20 text-danger" : "bg-warning/20 text-warning"}`}
                    >
                      {selectedInvoiceForModal.status === "PAID"
                        ? "موفق و تسویه شده"
                        : selectedInvoiceForModal.status === "FAILED"
                          ? "ناموفق"
                          : selectedInvoiceForModal.paymentMethod ===
                                "MANUAL" &&
                              selectedInvoiceForModal.receiptStatus ===
                                "PENDING"
                            ? "در انتظار تایید"
                            : "در انتظار پرداخت"}
                    </span>
                  </div>
                  {selectedInvoiceForModal.paymentMethod === "MANUAL" && (
                    <div className="text-sm text-muted flex items-center gap-1 mt-2">
                      <span className="text-muted ml-1">وضعیت فیش بانکی:</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${selectedInvoiceForModal.receiptStatus === "APPROVED" ? "bg-success/20 text-success" : selectedInvoiceForModal.receiptStatus === "REJECTED" ? "bg-danger/20 text-danger" : "bg-warning/20 text-warning"}`}
                      >
                        {selectedInvoiceForModal.receiptStatus === "APPROVED"
                          ? "تایید شده"
                          : selectedInvoiceForModal.receiptStatus === "REJECTED"
                            ? "رد شده"
                            : selectedInvoiceForModal.receiptStatus ===
                                "PENDING"
                              ? "در انتظار بررسی"
                              : "ثبت نشده"}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              {/* Items Breakdown Table */}
              <div className="border border-subtle rounded-xl overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-background text-muted border-b border-subtle font-bold">
                    <tr>
                      <th className="px-4 py-3 w-12 text-center">ردیف</th>
                      <th className="px-4 py-3">نام محصول</th>
                      <th className="px-4 py-3 text-center">تعداد</th>
                      <th className="px-4 py-3 text-center">
                        قیمت واحد (تومان)
                      </th>
                      <th className="px-4 py-3 text-left">جمع کل (تومان)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      let itemIdx = 0;
                      return selectedInvoiceForModal.orders?.flatMap(
                        (order: any) =>
                          order.items?.map((item: any) => {
                            itemIdx++;
                            return (
                              <tr
                                key={item.id}
                                className="hover:bg-background/50"
                              >
                                <td className="px-4 py-3 text-center font-mono text-muted">
                                  {itemIdx}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="font-medium text-primary">
                                    {item.product?.name}
                                  </div>
                                  <div className="text-[10px] text-muted mt-0.5">
                                    شناسه سفارش: #{order.id}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center font-bold text-muted">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-center font-mono">
                                  {item.price.toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-left font-mono font-bold text-secondary">
                                  {(
                                    item.price * item.quantity
                                  ).toLocaleString()}
                                </td>
                              </tr>
                            );
                          }),
                      );
                    })()}
                  </tbody>
                </table>
              </div>
              {/* Summary Totals */}
              <div className="flex justify-end">
                <div className="w-64 border border-subtle rounded-xl p-4 bg-background/30 space-y-2">
                  <div className="flex justify-between text-xs text-muted">
                    <span>جمع ناخالص:</span>
                    <span className="font-mono">
                      {selectedInvoiceForModal.totalAmount.toLocaleString()}
                      تومان
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted">
                    <span>مالیات و عوارض (۰٪):</span>
                    <span className="font-mono">۰</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-primary border-t border-subtle pt-2 mt-2">
                    <span>مبلغ کل نهایی:</span>
                    <span className="font-mono text-success">
                      {selectedInvoiceForModal.totalAmount.toLocaleString()}
                      تومان
                    </span>
                  </div>
                </div>
              </div>
            </div>
            {/* Modal Footer */}
            <div className="flex justify-between items-center px-6 py-4 bg-background border-t border-subtle">
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const printContents =
                      document.getElementById("print-area")?.innerHTML;
                    const originalContents = document.body.innerHTML;
                    document.body.innerHTML = printContents || "";
                    window.print();
                    document.body.innerHTML = originalContents;
                    window.location.reload();
                  }}
                  className="bg-surface text-inverse hover:bg-background px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <FileText className="w-4 h-4" /> چاپ و دریافت PDF فاکتور
                </button>
                {(selectedInvoiceForModal.status === "PENDING" ||
                  selectedInvoiceForModal.status === "FAILED") &&
                  selectedInvoiceForModal.paymentMethod !== "MANUAL" && (
                    <button
                      onClick={() =>
                        handlePayInvoice(selectedInvoiceForModal.id)
                      }
                      className="bg-primary-default text-inverse hover:bg-primary-hover px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      پرداخت آنلاین فاکتور
                    </button>
                  )}
              </div>
              {selectedInvoiceForModal.paymentMethod === "MANUAL" &&
                selectedInvoiceForModal.status !== "PAID" &&
                selectedInvoiceForModal.receiptStatus !== "APPROVED" && (
                  <button
                    onClick={() => {
                      setTargetInvoiceForUpload(selectedInvoiceForModal);
                      setReceiptUrl(selectedInvoiceForModal.receiptUrl || "");
                      setReceiptNotes(
                        selectedInvoiceForModal.receiptNotes || "",
                      );
                      setUploadModalOpen(true);
                    }}
                    className="bg-success text-inverse hover:bg-emerald-700 px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-sm mx-4 transition-all"
                  >
                    <Upload className="w-4 h-4" /> ثبت و بارگذاری فیش واریزی
                  </button>
                )}
              <button
                onClick={() => setSelectedInvoiceForModal(null)}
                className="bg-surface hover:bg-surface text-secondary px-5 py-2 rounded-xl text-sm font-medium cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Receipt Modal */}
      {uploadModalOpen && targetInvoiceForUpload && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 text-right">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-background border-b border-subtle">
              <h3 className="font-bold text-primary flex items-center gap-2">
                <Upload className="w-5 h-5 text-success" /> بارگذاری فیش واریز
                رسمی فاکتور
              </h3>
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  setTargetInvoiceForUpload(null);
                }}
                disabled={isUploading}
                className="p-1.5 rounded-lg text-muted hover:bg-surface transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Content */}
            <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              {/* Info summary */}
              <div className="bg-primary-default/10 border border-primary-default/20 rounded-xl p-4 flex justify-between items-center text-sm">
                <div>
                  <p className="text-muted text-xs">شماره فاکتور</p>
                  <p className="font-mono font-black text-primary-hover mt-0.5">
                    INV-{targetInvoiceForUpload.id}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-muted text-xs">مبلغ قابل پرداخت</p>
                  <p className="font-bold text-success mt-0.5 text-base">
                    {targetInvoiceForUpload.totalAmount.toLocaleString()} تومان
                  </p>
                </div>
              </div>
              {/* Bank accounts instructions card */}
              <div className="bg-warning/10/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 leading-relaxed space-y-2 text-right">
                <p className="font-bold text-amber-950 text-sm mb-1">
                  مشخصات حساب جهت واریز وجه:
                </p>
                <p>
                  صاحب حساب:
                  <strong className="text-amber-950 text-sm">
                    {sysConfig["CARD_TO_CARD_OWNER"] || "مهدی مشرفی"}
                  </strong>
                </p>
                <div className="space-y-2 my-2">
                  <div className="flex items-center justify-between bg-card/80 px-3 py-2 rounded-xl border border-amber-100">
                    <span className="text-[10px] text-muted font-bold">
                      شماره کارت
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono font-bold tracking-widest text-xs text-primary"
                        dir="ltr"
                      >
                        {sysConfig["CARD_TO_CARD_CARD"] || "6219-8618-1832-7263"}
                      </span>
                      <button
                        onClick={() =>
                          handleCopy(
                            String(sysConfig["CARD_TO_CARD_CARD"] || "6219-8618-1832-7263").replace(/-/g, ""),
                            "card"
                          )
                        }
                        className="p-1 rounded-lg hover:bg-surface text-muted hover:text-secondary transition-colors flex items-center gap-1 cursor-pointer bg-background border border-subtle"
                        title="کپی شماره کارت"
                      >
                        {copiedCard ? (
                          <Check className="w-3.5 h-3.5 text-success animate-in zoom-in" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[9px] font-bold">
                          {copiedCard ? "کپی شد" : "کپی"}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-card/80 px-3 py-2 rounded-xl border border-amber-100">
                    <span className="text-[10px] text-muted font-bold">
                      شماره شبا
                    </span>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono font-bold text-xs text-primary"
                        dir="ltr"
                      >
                        {(() => {
                          const val = String(sysConfig["CARD_TO_CARD_SHABA"] || "IR330560611828006022464501");
                          return val.toUpperCase().startsWith("IR") ? val : "IR" + val;
                        })()}
                      </span>
                      <button
                        onClick={() => {
                          const val = String(sysConfig["CARD_TO_CARD_SHABA"] || "IR330560611828006022464501");
                          handleCopy(
                            val.toUpperCase().startsWith("IR") ? val : "IR" + val,
                            "sheba"
                          );
                        }}
                        className="p-1 rounded-lg hover:bg-surface text-muted hover:text-secondary transition-colors flex items-center gap-1 cursor-pointer bg-background border border-subtle"
                        title="کپی شماره شبا"
                      >
                        {copiedSheba ? (
                          <Check className="w-3.5 h-3.5 text-success animate-in zoom-in" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[9px] font-bold">
                          {copiedSheba ? "کپی شد" : "کپی"}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Drag and Drop area */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-secondary">
                  تصویر فیش واریزی
                </label>
                <div className="border-2 border-dashed border-subtle hover:border-success rounded-2xl p-6 transition-all flex flex-col items-center justify-center bg-background/50 cursor-pointer relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  />
                  {receiptUrl ? (
                    <div className="space-y-3 text-center relative z-20">
                      <img
                        src={receiptUrl}
                        alt="Receipt preview"
                        className="max-h-48 mx-auto rounded-xl shadow-md border border-subtle object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <p className="text-xs text-success font-bold flex items-center justify-center gap-1">
                        <CheckCircle className="w-4 h-4" /> فیش واریزی با موفقیت
                        بارگذاری شد
                      </p>
                      <p className="text-[10px] text-muted">
                        جهت تعویض تصویر فیش، کلیک یا فایل جدید را رها کنید
                      </p>
                    </div>
                  ) : (
                    <div className="text-center space-y-2.5 text-muted group-hover:text-success transition-colors">
                      <div className="w-12 h-12 rounded-full bg-surface group-hover:bg-success/10 flex items-center justify-center mx-auto transition-colors">
                        <Upload className="w-6 h-6 text-muted group-hover:text-success" />
                      </div>
                      <p className="text-sm font-bold text-muted group-hover:text-success">
                        برای بارگذاری فیش کلیک کنید یا فایل را اینجا رها نمایید
                      </p>
                      <p className="text-xs text-muted">
                        فرمت‌های مجاز: PNG, JPG, JPEG (حداکثر ۵ مگابایت)
                      </p>
                    </div>
                  )}
                </div>
              </div>
              {/* Textarea for description */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-secondary">
                  توضیحات و یادداشت (اختیاری)
                </label>
                <textarea
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  placeholder="در صورت داشتن هرگونه توضیح اضافه (کد پیگیری، زمان پرداخت و...) در این قسمت یادداشت کنید..."
                  disabled={isUploading}
                  rows={3}
                  className="w-full bg-background border border-subtle rounded-xl p-3 text-sm focus:bg-card focus:ring-2 focus:ring-success focus:border-success outline-none transition-all leading-relaxed text-right"
                />
              </div>
            </div>
            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-4 bg-background border-t border-subtle">
              <button
                onClick={() => {
                  setUploadModalOpen(false);
                  setTargetInvoiceForUpload(null);
                }}
                disabled={isUploading}
                className="bg-surface hover:bg-surface text-secondary px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50"
              >
                انصراف
              </button>
              <button
                onClick={handleReceiptSubmit}
                disabled={isUploading || !receiptUrl}
                className="bg-success hover:bg-emerald-700 text-inverse px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-100 disabled:opacity-50 transition-all"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> در حال ثبت
                    فیش...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" /> ثبت و ارسال فیش واریزی
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
