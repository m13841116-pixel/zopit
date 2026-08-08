import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Megaphone,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Check,
  ShoppingBag,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  Trash2,
  BellOff
} from "lucide-react";

export interface NotificationItem {
  id: string | number;
  title: string;
  message: string;
  date: string;
  type?: "announcement" | "order" | "system" | "ticket" | "alert";
  isRead?: boolean;
  linkTab?: string;
  priority?: "normal" | "high" | "urgent";
}

interface NotificationBellProps {
  userRole?: string;
  onNavigateTab?: (tabId: string) => void;
  className?: string;
}

export default function NotificationBell({
  userRole = "STORE_MANAGER",
  onNavigateTab,
  className = "",
}: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "announcement">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("read_notification_ids");
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Fetch announcements & notifications from APIs
  useEffect(() => {
    async function loadNotifications() {
      const items: NotificationItem[] = [];

      // Default welcome notification
      items.push({
        id: "welcome_sys",
        title: "به سیستم مدیریت خوش آمدید",
        message: "حساب کاربری شما فعال است. می‌توانید وضعیت سفارشات، محصولات و تراکنش‌های خود را پیگیری کنید.",
        date: "امروز",
        type: "system",
        priority: "normal",
      });

      try {
        // Fetch announcements
        const annRes = await fetch("/api/announcements");
        if (annRes.ok) {
          const annData = await annRes.json();
          if (Array.isArray(annData)) {
            annData.forEach((a: any) => {
              items.push({
                id: `ann_${a.id}`,
                title: a.title || "اطلاعیه سامانه",
                message: a.content || a.summary || "",
                date: a.createdAt ? new Date(a.createdAt).toLocaleDateString("fa-IR") : "به‌روز",
                type: "announcement",
                linkTab: "announcements",
                priority: a.priority?.toLowerCase() || "normal",
              });
            });
          }
        }
      } catch (err) {
        console.error("Error fetching announcements:", err);
      }

      try {
        // Fetch info pages
        const infoRes = await fetch("/api/info-pages");
        if (infoRes.ok) {
          const infoData = await infoRes.json();
          if (Array.isArray(infoData)) {
            infoData.slice(0, 4).forEach((p: any) => {
              if (!items.some((i) => i.id === `info_${p.id}`)) {
                items.push({
                  id: `info_${p.id}`,
                  title: p.title || "خبر جدید",
                  message: p.summary || p.content || "",
                  date: p.publishDate || "جدید",
                  type: "announcement",
                  linkTab: "announcements",
                  priority: p.isPinned ? "high" : "normal",
                });
              }
            });
          }
        }
      } catch (err) {
        console.error("Error fetching info pages:", err);
      }

      setNotifications(items);
    }

    loadNotifications();
  }, [userRole]);

  // Save read state
  const markAsRead = (id: string | number) => {
    const idStr = String(id);
    if (!readIds.includes(idStr)) {
      const updated = [...readIds, idStr];
      setReadIds(updated);
      try {
        localStorage.setItem("read_notification_ids", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save read state:", e);
      }
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => String(n.id));
    setReadIds(allIds);
    try {
      localStorage.setItem("read_notification_ids", JSON.stringify(allIds));
    } catch (e) {
      console.error("Failed to save read state:", e);
    }
  };

  const clearAllNotifications = () => {
    markAllAsRead();
    setNotifications([]);
  };

  const isRead = (id: string | number) => readIds.includes(String(id));

  const unreadCount = notifications.filter((n) => !isRead(n.id)).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === "unread") return !isRead(n.id);
    if (activeFilter === "announcement") return n.type === "announcement";
    return true;
  });

  const getItemIcon = (type?: string, priority?: string) => {
    if (priority === "urgent" || priority === "high") {
      return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
    switch (type) {
      case "announcement":
        return <Megaphone className="w-4 h-4 text-indigo-500" />;
      case "order":
        return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
      case "ticket":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-primary-default" />;
    }
  };

  return (
    <div className={`relative inline-block text-right ${className}`} ref={dropdownRef} dir="rtl">
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl bg-surface hover:bg-subtle text-secondary hover:text-primary border border-subtle transition-all duration-200 cursor-pointer flex items-center justify-center group shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-default/40"
        title="اعلانات و پیام‌ها"
        aria-label="اعلانات و پیام‌ها"
      >
        <Bell className="w-5 h-5 text-secondary group-hover:text-primary-default transition-colors group-hover:scale-110" />

        {/* Unread Badge Indicator */}
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-danger text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-md shadow-danger/30 animate-pulse border-2 border-card">
            {unreadCount > 9 ? "+۹" : unreadCount}
          </span>
        ) : (
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 mt-3 w-80 sm:w-96 bg-card border border-subtle rounded-3xl shadow-2xl z-[100] overflow-hidden animate-fade-in origin-top-left">
          {/* Popover Header */}
          <div className="p-4 bg-surface/80 backdrop-blur-md border-b border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-default/10 text-primary-default flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-primary flex items-center gap-2">
                  اعلانات و پیام‌ها
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-danger/15 text-danger px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} خوانده‌نشده
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-muted">جدیدترین اطلاعیه‌ها و پیام‌های سامانه</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-muted hover:text-primary rounded-xl hover:bg-subtle transition-colors"
              title="بستن"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Filter Bar & Quick Actions */}
          <div className="px-4 py-2 bg-background/50 border-b border-subtle flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  activeFilter === "all"
                    ? "bg-primary-default text-white shadow-sm"
                    : "text-muted hover:text-primary hover:bg-surface"
                }`}
              >
                همه ({notifications.length})
              </button>
              <button
                onClick={() => setActiveFilter("unread")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  activeFilter === "unread"
                    ? "bg-primary-default text-white shadow-sm"
                    : "text-muted hover:text-primary hover:bg-surface"
                }`}
              >
                خوانده‌نشده ({unreadCount})
              </button>
              <button
                onClick={() => setActiveFilter("announcement")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                  activeFilter === "announcement"
                    ? "bg-primary-default text-white shadow-sm"
                    : "text-muted hover:text-primary hover:bg-surface"
                }`}
              >
                اطلاعیه‌ها
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-primary-default hover:text-primary-hover font-bold flex items-center gap-1 transition-colors"
                title="خوانده شدن همه"
              >
                <Check className="w-3 h-3" /> خواندن همه
              </button>
            )}
          </div>

          {/* Notification Items List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-subtle/50">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center text-muted space-y-2">
                <BellOff className="w-10 h-10 mx-auto opacity-30 text-secondary" />
                <p className="text-xs font-bold">هیچ اعلانی یافت نشد</p>
                <p className="text-[11px] opacity-75">پیام یا اطلاعیه جدیدی برای نمایش وجود ندارد.</p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const read = isRead(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      markAsRead(item.id);
                      if (item.linkTab && onNavigateTab) {
                        onNavigateTab(item.linkTab);
                        setIsOpen(false);
                      }
                    }}
                    className={`p-3.5 transition-all cursor-pointer flex items-start gap-3 relative group ${
                      read
                        ? "bg-card hover:bg-surface/60 opacity-80"
                        : "bg-primary-default/5 hover:bg-primary-default/10"
                    }`}
                  >
                    {/* Unread Indicator Dot */}
                    {!read && (
                      <span className="absolute top-4 right-2 w-2 h-2 rounded-full bg-primary-default shadow-sm shadow-primary-default/50" />
                    )}

                    {/* Category Icon */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        read ? "bg-surface border border-subtle" : "bg-card border border-primary-default/20 shadow-sm"
                      }`}
                    >
                      {getItemIcon(item.type, item.priority)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h4
                          className={`text-xs font-bold truncate ${
                            read ? "text-secondary" : "text-primary font-black"
                          }`}
                        >
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-muted shrink-0 dir-ltr">{item.date}</span>
                      </div>
                      <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                    </div>

                    {/* Direct Navigate Arrow */}
                    {item.linkTab && (
                      <ChevronLeft className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-center" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-3 bg-surface/80 backdrop-blur-md border-t border-subtle flex items-center justify-between text-xs">
            {onNavigateTab ? (
              <button
                onClick={() => {
                  onNavigateTab("announcements");
                  setIsOpen(false);
                }}
                className="w-full text-center text-xs font-bold text-primary-default hover:text-primary-hover transition-colors py-1 flex items-center justify-center gap-1.5"
              >
                مشاهده تمامی اطلاعیه‌ها و پیام‌ها <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={clearAllNotifications}
                className="text-[11px] text-muted hover:text-danger transition-colors flex items-center gap-1 mx-auto"
              >
                <Trash2 className="w-3 h-3" /> پاک‌سازی اعلانات
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
