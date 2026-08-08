import React, { useState, useEffect } from "react";
import { User, UserRole } from "../types";
import { Store, LogOut, User as UserIcon, Building2, ShoppingBag, Megaphone, BellRing, Bell, X, GraduationCap, PlayCircle, ExternalLink } from "lucide-react";
import { ZopitLogo } from "./ZopitLogo";
import { PublicAnnouncementsModal } from "./PublicAnnouncementsModal";

interface NavbarProps {
  user: User;
  onLogout: () => void;
  cartCount: number;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCart?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onLogout,
  cartCount,
  activeTab,
  setActiveTab,
  onOpenCart
}) => {
  const [showPublicAnnouncements, setShowPublicAnnouncements] = useState(false);
  const [showNotificationsPopover, setShowNotificationsPopover] = useState(false);
  const [showEducationModal, setShowEducationModal] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState<any[]>([]);

  useEffect(() => {
    // Fetch notifications/announcements targeted at this user
    fetch("/api/announcements")
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return [];
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const userRole = user.role || "ALL";
          const list = data.filter((a: any) => a.target === "ALL" || a.target === userRole);
          setUnreadNotifications(list);
        }
      })
      .catch(console.error);
  }, [user.role]);

  return (
    <nav className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Brand */}
          <div className="flex items-center cursor-pointer" onClick={() => setActiveTab("dashboard")}>
            <ZopitLogo size="md" lightText={true} />
          </div>

          {/* Tab Navigation links */}
          <div className="hidden md:flex space-x-1">
            <button
              id="nav_tab_dashboard"
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "dashboard"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              پیشخوان
            </button>
            <button
              id="nav_tab_catalog"
              onClick={() => setActiveTab("catalog")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "catalog"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              {user.role === "SUPPLIER" ? "مدیریت کالاها" : "کاتالوگ کالای تامین‌کنندگان"}
            </button>
            <button
              id="nav_tab_orders"
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "orders"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              سفارشات
            </button>
          </div>

          {/* User Info & Cart / Loudspeaker / Bell / Logout */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Loudspeaker (اطلاعیه‌های همگانی) */}
            <button
              onClick={() => setShowPublicAnnouncements(true)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all relative"
              title="اطلاعیه‌های همگانی پلتفرم"
            >
              <Megaphone className="h-5 w-5 text-indigo-400" />
            </button>

            {/* Education Icon (آیکون آموزش و راهنما) */}
            <button
              onClick={() => setShowEducationModal(true)}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all relative"
              title="مرکز آموزش و ویدیوهای راهنما"
            >
              <GraduationCap className="h-5 w-5 text-emerald-400" />
            </button>

            {/* Bell Icon (زنگوله اعلانات) */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsPopover(!showNotificationsPopover)}
                className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all relative"
                title="اعلانات و پیام‌های شما"
              >
                <Bell className="h-5 w-5 text-amber-400" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {/* Notifications Popover */}
              {showNotificationsPopover && (

                <div
                  className="absolute left-0 mt-2 w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 text-right z-50 animate-fade-in"
                  dir="rtl"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                    <h4 className="text-xs font-black text-white flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-amber-400" /> اعلانات نقش شما
                    </h4>
                    <button
                      onClick={() => setShowNotificationsPopover(false)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 text-xs">
                    {unreadNotifications.length === 0 ? (
                      <p className="text-slate-400 text-center py-4">اعلان جدیدی وجود ندارد.</p>
                    ) : (
                      unreadNotifications.map((ann) => (
                        <div key={ann.id} className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50 space-y-1">
                          <h5 className="font-extrabold text-slate-100">{ann.title}</h5>
                          <p className="text-slate-300 text-[11px] leading-relaxed line-clamp-2">{ann.content}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="pt-3 mt-3 border-t border-slate-800 text-center">
                    <button
                      onClick={() => {
                        setShowNotificationsPopover(false);
                        setShowPublicAnnouncements(true);
                      }}
                      className="w-full py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Megaphone className="w-3.5 h-3.5" /> مشاهده آرشیو کامل اعلانات پلتفرم
                    </button>
                  </div>
                </div>
              )}
            </div>

            {user.role === "STORE_MANAGER" && (
              <button
                id="nav_cart_btn"
                onClick={onOpenCart}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                title="سبد خرید عمده"
              >
                <ShoppingBag className="h-5 w-5 text-emerald-400" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Profile badge */}
            <div className="hidden lg:flex items-center space-x-3 pl-4 border-l border-slate-800">
              <div className="text-right">
                <span className="block text-xs font-semibold text-white leading-tight">
                  {user.contactName}
                </span>
                <span className="block text-[10px] font-mono text-slate-400 leading-none">
                  {user.companyName}
                </span>
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-blue-400 font-bold text-xs uppercase">
                {user.contactName ? user.contactName.substring(0, 2) : "BK"}
              </div>
            </div>

            {/* Logout button */}
            <button
              id="nav_logout_btn"
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/50 rounded-lg transition-colors"
              title="خروج از حساب"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Public Announcements Modal */}
      <PublicAnnouncementsModal
        isOpen={showPublicAnnouncements}
        onClose={() => setShowPublicAnnouncements(false)}
      />

      {/* Educational Center & Channel Guides Modal */}
      {showEducationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in" dir="rtl">
          <div className="bg-slate-900 border border-slate-700 text-slate-100 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">مرکز آموزش و کانال‌های پلتفرم</h3>
                  <p className="text-xs text-slate-400 mt-0.5">فیلم‌های آموزشی آپارات، یوتیوب و کانال‌های اطلاع‌رسانی</p>
                </div>
              </div>
              <button 
                onClick={() => setShowEducationModal(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <PlayCircle className="w-4 h-4 text-red-500" /> کانال رسمی آپارات (ویدیوهای آموزشی)
                  </h4>
                  <p className="text-[11px] text-slate-400">آموزش کامل نحوه ثبت‌نام، بارگذاری محصول و فرآیند تسویه حساب</p>
                </div>
                <a 
                  href="https://www.aparat.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                >
                  مشاهده <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <PlayCircle className="w-4 h-4 text-red-600" /> کانال رسمی یوتیوب
                  </h4>
                  <p className="text-[11px] text-slate-400">وبینارهای تخصصی فروشندگان و آموزش اتصال به ووکامرس</p>
                </div>
                <a 
                  href="https://www.youtube.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 transition-colors"
                >
                  مشاهده <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/60 space-y-2">
                <h4 className="text-xs font-bold text-emerald-400">راهنمای متنی سریع پلتفرم</h4>
                <ul className="text-[11px] text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
                  <li><strong>تامین‌کنندگان:</strong> پس از ثبت سفارش توسط مدیر فروشگاه، حتما سفارش را در پنل خود تایید نمایید تا لینک پرداخت برای فروشگاه فعال شود.</li>
                  <li><strong>مدیران فروشگاه:</strong> برای مشاهده کد رهگیری پستی و صدور لیبل، فاکتور سفارش باید به حالت پرداخت شده تغییر یابد.</li>
                  <li><strong>تسویه حساب:</strong> درخواست‌های تسویه پس از تایید مدیریت ارشد مستقیم به شماره شبای شما واریز می‌گردد.</li>
                </ul>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowEducationModal(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors"
              >
                متوجه شدم (بستن)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation links */}
      <div className="md:hidden flex justify-around py-2 border-t border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center p-1 ${
            activeTab === "dashboard" ? "text-blue-400" : "text-slate-400"
          }`}
        >
          <span className="font-medium">Dashboard</span>
        </button>
        <button
          onClick={() => setActiveTab("catalog")}
          className={`flex flex-col items-center p-1 ${
            activeTab === "catalog" ? "text-blue-400" : "text-slate-400"
          }`}
        >
          <span className="font-medium">
            {user.role === "SUPPLIER" ? "Catalog" : "Shop"}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          className={`flex flex-col items-center p-1 ${
            activeTab === "orders" ? "text-blue-400" : "text-slate-400"
          }`}
        >
          <span className="font-medium">Orders</span>
        </button>
      </div>
    </nav>
  );
};
