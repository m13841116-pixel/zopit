import React, { useState, useEffect, useRef, useCallback } from "react";
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
  BellOff,
  Clock,
  Wallet,
  Package,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  ExternalLink
} from "lucide-react";

export interface NotificationItem {
  id: string | number;
  title: string;
  message: string;
  date: string;
  type?: string;
  isRead?: boolean;
  linkTab?: string;
  targetUrl?: string;
  priority?: "HIGH" | "MEDIUM" | "LOW" | "urgent" | "normal";
  cta?: string;
  isOperational?: boolean;
  badgeText?: string;
  metadata?: Record<string, any>;
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
  const [activeFilter, setActiveFilter] = useState<"all" | "urgent" | "unread" | "operational">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [operationalReminders, setOperationalReminders] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

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

  // Load notifications from API
  const loadNotifications = useCallback(async () => {
    const token = localStorage.getItem("token") || "";
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      // 1. Fetch user notifications
      const notifRes = await fetch("/api/notifications?limit=30", {
        headers,
        credentials: "include"
      });

      let items: NotificationItem[] = [];

      if (notifRes.ok) {
        const notifData = await notifRes.json();
        if (notifData.success && Array.isArray(notifData.items)) {
          items = notifData.items.map((n: any) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            date: n.createdAt ? new Date(n.createdAt).toLocaleDateString("fa-IR") : "به‌روز",
            type: n.type,
            isRead: n.isRead,
            linkTab: n.linkTab || "dashboard",
            targetUrl: n.targetUrl,
            priority: n.priority || "MEDIUM",
            cta: n.cta || "مشاهده",
            metadata: n.metadata
          }));
          setUnreadCount(notifData.unreadCount || 0);
        }
      }

      // 2. Fetch Operational Reminders
      try {
        const opRes = await fetch("/api/notifications/operational-reminders", {
          headers,
          credentials: "include"
        });
        if (opRes.ok) {
          const opData = await opRes.json();
          if (opData.success && Array.isArray(opData.reminders)) {
            const opItems: NotificationItem[] = opData.reminders.map((r: any) => ({
              id: `op_${r.id}`,
              title: r.title,
              message: r.description,
              date: "اقدام فوری",
              type: r.type,
              isRead: false,
              linkTab: r.linkTab || "orders",
              priority: r.priority || "HIGH",
              cta: r.cta || "انجام اقدام",
              isOperational: true,
              badgeText: r.badgeText
            }));
            setOperationalReminders(opItems);
          }
        }
      } catch (opErr) {
        console.warn("Could not fetch operational reminders:", opErr);
      }

      // 3. If empty, include default welcome
      if (items.length === 0) {
        items.push({
          id: "welcome_sys",
          title: "به پنل مدیریت زوپیت خوش آمدید",
          message: "تمام اعلانات سفارشات، تغییرات وضعیت بارنامه، اعتبارات کیف‌پول و هشدارهای انبار به صورت لحظه‌ای در این بخش نمایش داده می‌شوند.",
          date: "امروز",
          type: "SYSTEM",
          priority: "LOW",
          isRead: true,
          cta: "مشاهده راهنما",
          linkTab: "dashboard"
        });
      }

      setNotifications(items);
    } catch (err) {
      console.error("Error loading notifications:", err);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
    // Poll every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [loadNotifications, userRole]);

  // Save read state on backend
  const markAsRead = async (item: NotificationItem) => {
    if (typeof item.id === "number" || (!String(item.id).startsWith("op_") && !String(item.id).startsWith("welcome_"))) {
      try {
        const token = localStorage.getItem("token") || "";
        await fetch(`/api/notifications/${item.id}/read`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          credentials: "include"
        });
      } catch (err) {
        console.warn("Failed to mark as read on server:", err);
      }
    }

    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      await fetch("/api/notifications/read-all", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        credentials: "include"
      });
    } catch (err) {
      console.warn("Failed to mark all as read on server:", err);
    }

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const handleItemClick = (item: NotificationItem) => {
    markAsRead(item);
    if (item.linkTab && onNavigateTab) {
      onNavigateTab(item.linkTab);
      setIsOpen(false);
    }
  };

  const allDisplayItems = [
    ...operationalReminders,
    ...notifications
  ];

  const totalUrgentCount = allDisplayItems.filter(
    (n) => n.priority === "HIGH" || n.priority === "urgent" || n.isOperational
  ).length;

  const totalEffectiveUnread = unreadCount + operationalReminders.length;

  const filteredNotifications = allDisplayItems.filter((n) => {
    if (activeFilter === "urgent") {
      return n.priority === "HIGH" || n.priority === "urgent" || n.isOperational;
    }
    if (activeFilter === "unread") {
      return !n.isRead;
    }
    if (activeFilter === "operational") {
      return n.isOperational;
    }
    return true;
  });

  const getItemIcon = (type?: string, priority?: string, isOperational?: boolean) => {
    if (isOperational) {
      return <Clock className="w-4 h-4 text-rose-500" />;
    }
    if (priority === "HIGH" || priority === "urgent") {
      return <AlertCircle className="w-4 h-4 text-rose-500" />;
    }
    const t = (type || "").toUpperCase();
    if (t.includes("ORDER")) {
      return <ShoppingBag className="w-4 h-4 text-emerald-500" />;
    }
    if (t.includes("WALLET") || t.includes("PAYOUT") || t.includes("PAYMENT")) {
      return <Wallet className="w-4 h-4 text-amber-500" />;
    }
    if (t.includes("PRODUCT") || t.includes("STOCK") || t.includes("CATALOG")) {
      return <Package className="w-4 h-4 text-indigo-500" />;
    }
    if (t.includes("SUBSCRIPTION")) {
      return <Sparkles className="w-4 h-4 text-purple-500" />;
    }
    return <Megaphone className="w-4 h-4 text-primary-default" />;
  };

  return (
    <div className={`relative inline-block text-right ${className}`} ref={dropdownRef} dir="rtl">
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className="relative p-2.5 rounded-2xl bg-surface hover:bg-subtle text-secondary hover:text-primary border border-subtle transition-all duration-200 cursor-pointer flex items-center justify-center group shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-default/40"
        title="مرکز اعلانات و هشدارهای عملیاتی"
        aria-label="مرکز اعلانات و هشدارهای عملیاتی"
      >
        <Bell className="w-5 h-5 text-secondary group-hover:text-primary-default transition-colors group-hover:scale-110" />

        {/* Unread Badge Indicator */}
        {totalEffectiveUnread > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 bg-danger text-white text-[11px] font-black rounded-full flex items-center justify-center shadow-md shadow-danger/30 animate-pulse border-2 border-card">
            {totalEffectiveUnread > 9 ? "+۹" : totalEffectiveUnread}
          </span>
        ) : (
          <span className="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>

      {/* Notifications Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 mt-3 w-80 sm:w-[420px] bg-card border border-subtle rounded-3xl shadow-2xl z-[100] overflow-hidden animate-fade-in origin-top-left">
          {/* Popover Header */}
          <div className="p-4 bg-surface/80 backdrop-blur-md border-b border-subtle flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary-default/10 text-primary-default flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-primary flex items-center gap-2">
                  مرکز اعلانات و اقدامات فوری
                  {totalEffectiveUnread > 0 && (
                    <span className="text-[10px] bg-danger/15 text-danger px-2 py-0.5 rounded-full font-bold">
                      {totalEffectiveUnread} مورد
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-muted">رویدادهای سفارش، بارنامه، مالی و هشدارهای عملیاتی</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => loadNotifications()}
                className="p-1.5 text-muted hover:text-primary rounded-xl hover:bg-subtle transition-colors"
                title="به‌روزرسانی"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-muted hover:text-primary rounded-xl hover:bg-subtle transition-colors"
                title="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Bar & Quick Actions */}
          <div className="px-4 py-2 bg-background/50 border-b border-subtle flex items-center justify-between gap-2 text-xs overflow-x-auto">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
                  activeFilter === "all"
                    ? "bg-primary-default text-white shadow-sm"
                    : "text-muted hover:text-primary hover:bg-surface"
                }`}
              >
                همه ({allDisplayItems.length})
              </button>
              {totalUrgentCount > 0 && (
                <button
                  onClick={() => setActiveFilter("urgent")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
                    activeFilter === "urgent"
                      ? "bg-rose-500 text-white shadow-sm"
                      : "text-rose-500 hover:bg-rose-500/10"
                  }`}
                >
                  فوری و مهم ({totalUrgentCount})
                </button>
              )}
              {operationalReminders.length > 0 && (
                <button
                  onClick={() => setActiveFilter("operational")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
                    activeFilter === "operational"
                      ? "bg-amber-500 text-white shadow-sm"
                      : "text-amber-600 hover:bg-amber-500/10"
                  }`}
                >
                  اقدامات ({operationalReminders.length})
                </button>
              )}
              <button
                onClick={() => setActiveFilter("unread")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${
                  activeFilter === "unread"
                    ? "bg-primary-default text-white shadow-sm"
                    : "text-muted hover:text-primary hover:bg-surface"
                }`}
              >
                خوانده‌نشده ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] text-primary-default hover:text-primary-hover font-bold flex items-center gap-1 transition-colors shrink-0"
                title="خوانده شدن همه"
              >
                <Check className="w-3 h-3" /> خواندن همه
              </button>
            )}
          </div>

          {/* Notification Items List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-subtle/50">
            {filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center text-muted space-y-2">
                <BellOff className="w-10 h-10 mx-auto opacity-30 text-secondary" />
                <p className="text-xs font-bold">هیچ اعلانی در این دسته‌بندی یافت نشد</p>
                <p className="text-[11px] opacity-75">وضعیت حساب شما در حالت مطلوب و به‌روز قرار دارد.</p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const read = Boolean(item.isRead);
                const isHighPriority = item.priority === "HIGH" || item.priority === "urgent" || item.isOperational;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3.5 transition-all cursor-pointer flex items-start gap-3 relative group ${
                      item.isOperational
                        ? "bg-rose-500/5 hover:bg-rose-500/10 border-r-2 border-rose-500"
                        : read
                        ? "bg-card hover:bg-surface/60 opacity-80"
                        : isHighPriority
                        ? "bg-rose-500/5 hover:bg-rose-500/10"
                        : "bg-primary-default/5 hover:bg-primary-default/10"
                    }`}
                  >
                    {/* Unread Indicator Dot */}
                    {!read && !item.isOperational && (
                      <span className="absolute top-4 right-2 w-2 h-2 rounded-full bg-primary-default shadow-sm shadow-primary-default/50" />
                    )}

                    {/* Category Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        item.isOperational
                          ? "bg-rose-500/15 border border-rose-500/30 text-rose-600"
                          : isHighPriority
                          ? "bg-rose-500/10 border border-rose-500/20 text-rose-500"
                          : read
                          ? "bg-surface border border-subtle"
                          : "bg-card border border-primary-default/20 shadow-sm"
                      }`}
                    >
                      {getItemIcon(item.type, item.priority, item.isOperational)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 truncate">
                          {item.badgeText && (
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500 text-white shrink-0">
                              {item.badgeText}
                            </span>
                          )}
                          <h4
                            className={`text-xs font-bold truncate ${
                              read ? "text-secondary" : "text-primary font-black"
                            }`}
                          >
                            {item.title}
                          </h4>
                        </div>
                        <span className="text-[10px] text-muted shrink-0 dir-ltr">{item.date}</span>
                      </div>

                      <p className="text-[11px] text-muted line-clamp-2 leading-relaxed mb-2">
                        {item.message}
                      </p>

                      {/* CTA Action Button */}
                      {item.cta && (
                        <div className="flex items-center justify-between pt-1">
                          <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-primary-default group-hover:text-primary-hover transition-colors">
                            {item.cta}
                            <ChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-3 bg-surface/80 backdrop-blur-md border-t border-subtle flex items-center justify-between text-xs">
            <button
              onClick={() => {
                if (onNavigateTab) {
                  onNavigateTab("orders");
                  setIsOpen(false);
                }
              }}
              className="w-full text-center text-xs font-bold text-primary-default hover:text-primary-hover transition-colors py-1 flex items-center justify-center gap-1.5"
            >
              مدیریت و پیگیری کلیه سفارشات و اطلاعیه‌ها <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
