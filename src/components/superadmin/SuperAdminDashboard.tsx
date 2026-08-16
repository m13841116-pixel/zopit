import React, { useState, useEffect } from "react";
import {
  Image,
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  Wallet,
  Tags,
  Bell,
  MessageSquare,
  Settings,
  Activity,
  ShieldCheck,
  LogOut,
  DollarSign,
  X,
  Megaphone,
  Sliders,
  Scale,
  GraduationCap
} from "lucide-react";
import NotificationBell from "../NotificationBell";
import { EducationModal } from "../EducationModal";
import Overview from "./Overview";
import AllUsersList from "./AllUsersList";
import ProductsList from "./ProductsList";
import OrdersList from "./OrdersList";
import Financial from "./Financial";
import SettlementsList from "./SettlementsList";
import Categories from "./Categories";
import Tickets from "./Tickets";
import SystemSettings from "./SystemSettings";
import SystemLogs from "./SystemLogs";
import SystemHealth from "./SystemHealth";
import Notifications from "./Notifications";
import ManualInvoices from "./ManualInvoices";
import AdminAnnouncements from "./AdminAnnouncements";
import SuperAdminNewFeatures from "./SuperAdminNewFeatures";
import SuperAdminProAccounts from "./SuperAdminProAccounts";
import TopStoresManager from "./TopStoresManager";
import { Crown, Sparkles, TrendingUp, Award } from "lucide-react";
import SupplierPenaltyManagement from "./SupplierPenaltyManagement";
import AdminBanners from "./AdminBanners";
import CodeEditor from "./CodeEditor";
import { ZopitLogo } from "../ZopitLogo";

export default function SuperAdminDashboard({
  user,
  onLogout,
  showNotification,
  onImpersonateUser,
}: {
  user?: any;
  onLogout: () => void;
  showNotification?: (message: string, type: "success" | "error") => void;
  onImpersonateUser?: (user: any, token?: string) => void;
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [activeUserRoleFilter, setActiveUserRoleFilter] = useState("ALL");
  const [badges, setBadges] = useState({ orders: 0, tickets: 0, invoices: 0, settlements: 0 });

  useEffect(() => {
    fetch("/api/admin/badges", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return null;
        return res.json();
      })
      .then((data) => {
        if (data && typeof data === "object") {
          setBadges({
            orders: data.orders || 0,
            tickets: data.tickets || 0,
            invoices: data.invoices || 0,
            settlements: data.settlements || 0,
          });
        }
      })
      .catch(console.error);
  }, []);

  const menuItems = [
    { id: "overview", label: "پیشخوان", icon: LayoutDashboard },
    { id: "all-users", label: "کل کاربران", icon: Users },
    { id: "products", label: "محصولات", icon: Package },
    { id: "orders", label: "سفارشات", icon: ShoppingCart, badge: badges.orders },
    { id: "settlements", label: "درخواست تسویه", icon: Wallet, badge: badges.settlements },
    { id: "tickets", label: "تیکت‌ها", icon: MessageSquare, badge: badges.tickets },
    { id: "top-stores", label: "فروشندگان برتر و VIP", icon: Award },
    { id: "pro-accounts", label: "اکانت‌های پرو", icon: Crown },
    { id: "announcements", label: "مدیریت اعلانات", icon: Megaphone },
    { id: "manual-invoices", label: "تایید فیش‌ها", icon: DollarSign, badge: badges.invoices },
    { id: "settings", label: "تنظیمات کلی سیستم", icon: Settings },
  ];

  const handleNavigateTab = (tab: string, roleFilter?: string) => {
    setActiveTab(tab);
    if (roleFilter) {
      setActiveUserRoleFilter(roleFilter);
    } else {
      setActiveUserRoleFilter("ALL");
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex min-w-0 overflow-x-hidden" dir="rtl">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-background/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 right-0 w-64 shrink-0 bg-card border-l border-border-subtle text-text-primary flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ZopitLogo size="sm" />
          </div>
          <button
            className="lg:hidden text-text-muted hover:text-text-primary"
            onClick={() => setMobileMenuOpen(false)}
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (item.id === "all-users") setActiveUserRoleFilter("ALL");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-primary-default text-white shadow-lg shadow-primary-default/20"
                  : "text-text-secondary hover:bg-surface hover:text-text-primary"
              }`}
            >
              <div className="flex items-center gap-3">
                <item.icon
                  className={`w-5 h-5 ${
                    activeTab === item.id ? "text-white" : "text-text-muted"
                  }`}
                />
                <span>{item.label}</span>
              </div>
              {(item as any).badge ? (
                <span className="bg-danger text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shrink-0 shadow-sm">
                  {(item as any).badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border-subtle">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-surface text-danger rounded-xl text-sm font-medium hover:bg-surface/80 hover:text-danger transition-colors"
          >
            <LogOut className="w-5 h-5" /> خروج از حساب
          </button>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
        <header className="bg-card px-6 lg:px-8 py-5 flex items-center justify-between border-b border-subtle shadow-sm relative z-40 shrink-0">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 -mr-2 text-muted hover:text-secondary bg-background rounded-xl"
              onClick={() => setMobileMenuOpen(true)}
            >
              <LayoutDashboard className="w-6 h-6" />
            </button>
            <h1 className="text-xl lg:text-2xl font-bold text-primary">
              {menuItems.find((i) => i.id === activeTab)?.label || "پیشخوان"}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEducationModal(true)}
              className="p-2 bg-surface hover:bg-emerald-500/10 text-muted hover:text-emerald-600 rounded-xl transition-all duration-200 border border-subtle hover:border-emerald-200 cursor-pointer flex items-center justify-center gap-1.5"
              title="مرکز آموزش و ویدیوهای راهنما"
            >
              <GraduationCap className="w-5 h-5 text-emerald-500" />
              <span className="text-[11px] font-bold text-emerald-600 hidden md:inline-block">آموزش</span>
            </button>
            <NotificationBell userRole="SUPER_ADMIN" onNavigateTab={handleNavigateTab} />
            <div className="hidden md:flex items-center">
              <ZopitLogo size="sm" />
            </div>
          </div>
        </header>

        <EducationModal
          isOpen={showEducationModal}
          onClose={() => setShowEducationModal(false)}
        />
        <div className="flex-1 min-w-0 overflow-y-auto p-4 lg:p-8 relative">
          {activeTab === "overview" && (
            <Overview onNavigateTab={handleNavigateTab} />
          )}
          {activeTab === "pro-accounts" && (
            <SuperAdminProAccounts showNotification={showNotification} />
          )}
          {activeTab === "top-stores" && (
            <TopStoresManager showNotification={showNotification} />
          )}
          {(activeTab === "all-users" ||
            activeTab === "suppliers" ||
            activeTab === "stores" ||
            activeTab === "customers" ||
            activeTab === "referrers") && (
            <AllUsersList
              initialRoleFilter={activeUserRoleFilter}
              showNotification={showNotification}
              onImpersonateUser={onImpersonateUser}
            />
          )}
          {activeTab === "penalty-management" && <SystemSettings initialTab="supplier_rules" />}
          {activeTab === "products" && <ProductsList />}
          {activeTab === "orders" && <OrdersList />}
          {activeTab === "financial" && <Financial />}
          {activeTab === "manual-invoices" && <ManualInvoices />}
          {activeTab === "settlements" && <SettlementsList />}
          {activeTab === "categories" && <Categories />}
          {activeTab === "notifications" && <Notifications />}
          {activeTab === "announcements" && <AdminAnnouncements />}
          {activeTab === "banners" && (
            <AdminBanners showNotification={showNotification} />
          )}
          {activeTab === "tickets" && <Tickets />}
          {activeTab === "settings" && <SystemSettings initialTab="core" />}
          {activeTab === "logs" && <SystemLogs />}
          {activeTab === "health" && <SystemHealth />}
          {activeTab === "dev-tools" && <CodeEditor />}
        </div>
      </main>
    </div>
  );
}

