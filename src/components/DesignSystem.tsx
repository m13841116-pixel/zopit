import React, { useState, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
  Search,
  SlidersHorizontal,
  Download,
  Eye,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Loader2,
  MoreVertical,
  Check,
  EyeOff
} from "lucide-react";

// =========================================================================
// 1. TOAST NOTIFICATION SYSTEM
// =========================================================================
export type ToastType = "success" | "warning" | "error" | "info";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

const ToastContext = createContext<{
  showToast: (message: string, type?: ToastType, title?: string) => void;
  removeToast: (id: string) => void;
  toasts: ToastMessage[];
}>({
  showToast: () => {},
  removeToast: () => {},
  toasts: [],
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: ToastType = "info", title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, type, title, message, duration: 4000 };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, removeToast, toasts }}>
      {children}
      <div className="fixed top-6 left-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: -100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.9, transition: { duration: 0.2 } }}
              className={`p-4 rounded-2xl shadow-xl border backdrop-blur-md flex gap-3 pointer-events-auto items-start ${
                toast.type === "success"
                  ? "bg-success/10 dark:bg-success/15 border-success/30 text-success dark:text-success"
                  : toast.type === "warning"
                  ? "bg-warning/10 dark:bg-warning/15 border-warning/30 text-warning dark:text-warning"
                  : toast.type === "error"
                  ? "bg-danger/10 dark:bg-danger/15 border-danger/30 text-danger dark:text-danger"
                  : "bg-primary-default/10 dark:bg-primary-default/15 border-primary-default/30 text-primary-default dark:text-primary-light"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-success" />}
                {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-warning" />}
                {toast.type === "error" && <AlertCircle className="w-5 h-5 text-danger" />}
                {toast.type === "info" && <Info className="w-5 h-5 text-primary-default" />}
              </div>
              <div className="flex-1">
                {toast.title && <h4 className="font-extrabold text-xs mb-1 text-text-primary">{toast.title}</h4>}
                <p className="text-xs leading-relaxed font-semibold text-text-secondary">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-text-muted hover:text-text-primary transition-colors p-0.5 rounded-lg cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToasts() {
  return useContext(ToastContext);
}

// =========================================================================
// 2. CORE COMPONENTS
// =========================================================================

// --- BUTTON COMPONENT ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "warning" | "outline" | "ghost";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  id?: string;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  className = "",
  id,
  ...props
}: ButtonProps) {
  const baseStyle =
    "relative inline-flex items-center justify-center font-bold rounded-xl select-none cursor-pointer overflow-hidden transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 gap-2";

  const variants = {
    primary:
      "bg-primary-default hover:bg-primary-hover text-white shadow-md shadow-primary-default/10 border border-primary-default",
    secondary:
      "bg-surface hover:bg-border-subtle border border-border-default text-text-primary hover:text-text-primary",
    danger:
      "bg-danger hover:bg-danger/90 text-white shadow-md shadow-danger/10 border border-danger",
    warning:
      "bg-warning hover:bg-warning/90 text-white shadow-md shadow-warning/10 border border-warning",
    outline:
      "bg-transparent hover:bg-surface border-2 border-border-default hover:border-text-primary text-text-primary",
    ghost:
      "bg-transparent hover:bg-surface text-text-secondary hover:text-text-primary border border-transparent",
  };

  const sizes = {
    xs: "px-2.5 py-1.5 text-[10px] rounded-lg",
    sm: "px-3.5 py-2 text-xs rounded-lg",
    md: "px-5 py-2.5 text-xs",
    lg: "px-7 py-3 text-sm",
  };

  return (
    <button
      id={id}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {!loading && icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
}

// --- INPUT COMPONENT ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
  icon?: React.ReactNode;
  id: string;
}

export function Input({
  label,
  error,
  required,
  icon,
  className = "",
  id,
  ...props
}: InputProps) {
  return (
    <div className="space-y-1 w-full">
      {label && (
        <label htmlFor={id} className="text-xs font-extrabold text-text-secondary flex items-center gap-1">
          {label}
          {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && <div className="absolute right-4 text-text-muted shrink-0 pointer-events-none">{icon}</div>}
        <input
          id={id}
          className={`w-full bg-surface border rounded-xl py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary-default/10 text-text-primary ${
            icon ? "pr-11 pl-4" : "px-4"
          } ${
            error
              ? "border-danger focus:border-danger ring-danger/20"
              : "border-border-subtle focus:border-primary-default"
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] font-bold text-danger"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// --- SELECT COMPONENT ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  required?: boolean;
  options: { value: string | number; label: string }[];
  id: string;
}

export function Select({
  label,
  error,
  required,
  options,
  className = "",
  id,
  ...props
}: SelectProps) {
  return (
    <div className="space-y-1 w-full">
      {label && (
        <label htmlFor={id} className="text-xs font-extrabold text-text-secondary flex items-center gap-1">
          {label}
          {required && <span className="text-danger">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={`w-full appearance-none bg-surface border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-primary-default/10 text-text-primary cursor-pointer ${
            error
              ? "border-danger focus:border-danger ring-danger/20"
              : "border-border-subtle focus:border-primary-default"
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] font-bold text-danger"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}

// --- CARD COMPONENT ---
interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  id?: string;
}

export function Card({ children, title, subtitle, action, className = "", id }: CardProps) {
  return (
    <div
      id={id}
      className={`bg-card p-5 md:p-6 rounded-2xl border border-border-subtle shadow-sm flex flex-col gap-4 relative overflow-hidden ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle gap-4 shrink-0">
          <div>
            {title && <h3 className="font-extrabold text-text-primary text-sm leading-tight">{title}</h3>}
            {subtitle && <p className="text-[10px] text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}

// --- UNIFIED STATUS BADGE COMPONENT ---
const statusMapping: Record<string, { label: string; colorClass: string }> = {
  // Active states
  ACTIVE: { label: "فعال", colorClass: "bg-success/10 text-success dark:text-success border border-success/20" },
  ACTIVE_NEW: { label: "فعال جدید", colorClass: "bg-success/10 text-success dark:text-success border border-success/20" },
  APPROVED: { label: "تایید شده", colorClass: "bg-success/10 text-success dark:text-success border border-success/20" },
  SUCCESS: { label: "موفق", colorClass: "bg-success/10 text-success dark:text-success border border-success/20" },
  COMPLETED: { label: "تکمیل شده", colorClass: "bg-success/10 text-success dark:text-success border border-success/20" },
  PAID: { label: "پرداخت شده", colorClass: "bg-success/10 text-success dark:text-success border border-success/20" },
  DELIVERED: { label: "تحویل شده", colorClass: "bg-success/10 text-success dark:text-success border border-success/20" },

  // Pending states
  PENDING: { label: "در انتظار بررسی", colorClass: "bg-warning/10 text-warning dark:text-warning border border-warning/20" },
  PENDING_APPROVAL: { label: "در انتظار تایید", colorClass: "bg-warning/10 text-warning dark:text-warning border border-warning/20" },
  REQUESTED: { label: "ثبت اولیه / در انتظار", colorClass: "bg-warning/10 text-warning dark:text-warning border border-warning/20" },
  NEW: { label: "جدید", colorClass: "bg-primary-default/10 text-primary-default dark:text-primary-default border border-primary-default/20" },
  
  // Warning / Suspension states
  UNDER_REVIEW: { label: "در حال بازبینی عملکرد", colorClass: "bg-warning/15 text-warning dark:text-warning border border-warning/30" },
  WARNING: { label: "دارای اخطار انضباطی", colorClass: "bg-warning/15 text-warning dark:text-warning border border-warning/30" },
  TEMPORARILY_SUSPENDED: { label: "تعلیق موقت", colorClass: "bg-danger/10 text-danger dark:text-danger border border-danger/20" },
  SUSPENDED: { label: "معلق", colorClass: "bg-danger/10 text-danger dark:text-danger border border-danger/20" },
  BLOCKED: { label: "مسدود شده", colorClass: "bg-danger/15 text-danger dark:text-danger border border-danger/30" },

  // Danger / Terminated states
  REJECTED: { label: "رد شده", colorClass: "bg-danger/10 text-danger dark:text-danger border border-danger/20" },
  FAILED: { label: "ناموفق", colorClass: "bg-danger/10 text-danger dark:text-danger border border-danger/20" },
  CANCELLED: { label: "لغو شده", colorClass: "bg-danger/10 text-danger dark:text-danger border border-danger/20" },

  // Processing states
  PROCESSING: { label: "در حال پردازش", colorClass: "bg-surface0/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" },
  PREPARING: { label: "در حال آماده‌سازی", colorClass: "bg-surface0/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" },
  SHIPPED: { label: "تحویل به شرکت پست", colorClass: "bg-surface0/10 text-blue-600 dark:text-blue-400 border border-blue-500/20" },
  WAITING_FOR_PAYMENT: { label: "در انتظار پرداخت", colorClass: "bg-primary-default/10 text-primary-default dark:text-primary-default border border-primary-default/20" },
};

export function StatusBadge({ status, customLabel }: { status: string; customLabel?: string }) {
  const norm = String(status || "PENDING").trim().toUpperCase();
  const config = statusMapping[norm] || {
    label: customLabel || status || "نامشخص",
    colorClass: "bg-border-subtle text-text-muted border border-border-default",
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold select-none shrink-0 ${config.colorClass}`}>
      {customLabel || config.label}
    </span>
  );
}

// --- ALERT COMPONENT ---
interface AlertProps {
  type?: "success" | "warning" | "error" | "info";
  title?: string;
  message: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function Alert({ type = "info", title, message, onClose, className = "" }: AlertProps) {
  const colors = {
    success: "bg-success/10 border border-success/20 text-emerald-800 dark:text-success",
    warning: "bg-warning/10 border border-warning/20 text-amber-800 dark:text-warning",
    error: "bg-danger/10 border border-danger/20 text-rose-800 dark:text-danger",
    info: "bg-primary-default/10 border border-primary-default/20 text-primary-hover dark:text-primary-default",
  };

  return (
    <div className={`p-4 rounded-xl flex gap-3 items-start relative ${colors[type]} ${className}`}>
      <div className="shrink-0 mt-0.5">
        {type === "success" && <CheckCircle2 className="w-5 h-5" />}
        {type === "warning" && <AlertTriangle className="w-5 h-5" />}
        {type === "error" && <AlertCircle className="w-5 h-5" />}
        {type === "info" && <Info className="w-5 h-5" />}
      </div>
      <div className="flex-1">
        {title && <h4 className="font-extrabold text-xs mb-1">{title}</h4>}
        <div className="text-xs leading-relaxed font-semibold">{message}</div>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-current opacity-70 hover:opacity-100 p-0.5 rounded-lg cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// --- DIALOG (MODAL) COMPONENT ---
interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Dialog({ isOpen, onClose, title, children, size = "md" }: DialogProps) {
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className={`bg-card border border-border-subtle w-full rounded-2xl shadow-2xl relative z-50 flex flex-col max-h-[90vh] overflow-hidden ${sizes[size]}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-subtle shrink-0">
              <h3 className="font-extrabold text-text-primary text-sm">{title}</h3>
              <button
                onClick={onClose}
                className="p-1 rounded-xl bg-surface hover:bg-border-subtle text-text-muted hover:text-text-primary cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- DETAIL DRAWER COMPONENT ---
interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Drawer({ isOpen, onClose, title, children }: DrawerProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] overflow-hidden">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm cursor-pointer"
          />

          {/* Slide panel */}
          <div className="fixed inset-y-0 right-0 max-w-full flex">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="w-screen max-w-md bg-card border-r border-border-subtle shadow-2xl flex flex-col h-full"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-border-subtle flex items-center justify-between shrink-0">
                <h3 className="font-extrabold text-text-primary text-sm">{title}</h3>
                <button
                  onClick={onClose}
                  className="p-1 rounded-xl bg-surface hover:bg-border-subtle text-text-muted hover:text-text-primary cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">{children}</div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}

// --- TABS COMPONENT ---
interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = "" }: TabsProps) {
  return (
    <div className={`flex border-b border-border-subtle overflow-x-auto gap-4 scrollbar-none shrink-0 ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.value === activeTab;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={`flex items-center gap-2 px-4 py-3.5 border-b-2 font-bold text-xs whitespace-nowrap cursor-pointer transition-all relative ${
              isActive
                ? "border-primary-default text-primary-default"
                : "border-transparent text-text-muted hover:text-text-primary hover:border-border-default"
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-mono font-extrabold ${
                isActive ? "bg-primary-default/10 text-primary-default" : "bg-surface text-text-muted"
              }`}>
                {tab.badge}
              </span>
            )}
            {isActive && (
              <motion.div
                layoutId="activeTabUnderline"
                className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-default"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// --- PAGINATION COMPONENT ---
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({ currentPage, totalPages, onPageChange, className = "" }: PaginationProps) {
  if (totalPages <= 1) return null;

  const renderPages = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`w-8 h-8 rounded-xl font-bold font-mono text-xs cursor-pointer flex items-center justify-center transition-all ${
            i === currentPage
              ? "bg-primary-default text-white shadow-md shadow-primary-default/10"
              : "bg-surface hover:bg-border-subtle text-text-secondary hover:text-text-primary"
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className={`flex items-center justify-center gap-1.5 shrink-0 py-4 ${className}`}>
      <button
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="p-1.5 rounded-xl bg-surface hover:bg-border-subtle text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {renderPages()}

      <button
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="p-1.5 rounded-xl bg-surface hover:bg-border-subtle text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    </div>
  );
}

// --- TOOLTIP COMPONENT ---
export function Tooltip({ content, children }: { content: React.ReactNode; children: React.ReactNode }) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-block shrink-0"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-background dark:bg-card text-[10px] font-bold text-white rounded-lg shadow-lg whitespace-nowrap z-[9999] pointer-events-none border border-border-subtle"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- UNIFIED TIMELINE COMPONENT ---
export interface TimelineItem {
  id: string | number;
  title: string;
  description: string;
  timestamp: string | Date;
  status?: string;
  actor?: string;
  icon?: React.ReactNode;
}

export function Timeline({ items }: { items: TimelineItem[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-6 text-text-muted text-xs">تاریخچه‌ای ثبت نشده است.</div>
    );
  }

  return (
    <div className="relative pr-6 border-r-2 border-border-subtle space-y-6">
      {items.map((item, index) => (
        <div key={item.id} className="relative">
          {/* Timeline node */}
          <div className="absolute -right-[31px] top-1 bg-card w-4.5 h-4.5 rounded-full border-2 border-primary-default flex items-center justify-center z-10 shrink-0">
            {item.icon ? (
              <div className="scale-75">{item.icon}</div>
            ) : (
              <div className="w-1.5 h-1.5 bg-primary-default rounded-full" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h5 className="text-xs font-extrabold text-text-primary">{item.title}</h5>
              <span className="text-[10px] text-text-muted font-mono">
                {new Date(item.timestamp).toLocaleString("fa-IR")}
              </span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed font-semibold">{item.description}</p>
            {item.status && (
              <div className="pt-1 flex items-center gap-2">
                <span className="text-[10px] text-text-muted">وضعیت:</span>
                <StatusBadge status={item.status} />
              </div>
            )}
            {item.actor && (
              <span className="text-[10px] text-text-muted block font-semibold">اقدام توسط: {item.actor}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- UNIFIED HIGH-FIDELITY DATA TABLE ---
interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  selectable?: boolean;
  selectedRows?: (keyof T | any)[];
  onSelectionChange?: (selectedIds: any[]) => void;
  getRowId?: (row: T) => any;
  actions?: (row: T) => React.ReactNode;
  bulkActions?: React.ReactNode;
  exportable?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  id?: string;
}

export function Table<T>({
  columns,
  data,
  loading = false,
  selectable = false,
  onSelectionChange,
  getRowId,
  actions,
  bulkActions,
  exportable = true,
  searchable = true,
  searchPlaceholder = "جستجو...",
  id,
}: TableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.map((c) => String(c.key)));
  const [showColMenu, setShowColMenu] = useState(false);
  const [selectedIds, setSelectedIds] = useState<any[]>([]);

  // 1. Search filter
  const filteredData = data.filter((row: any) => {
    if (!searchTerm) return true;
    return Object.keys(row).some((key) => {
      const val = row[key];
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  // 2. Sorting
  const sortedData = [...filteredData].sort((a: any, b: any) => {
    if (!sortBy) return 0;
    const valA = a[sortBy];
    const valB = b[sortBy];

    if (valA === undefined || valA === null) return 1;
    if (valB === undefined || valB === null) return -1;

    if (typeof valA === "number" && typeof valB === "number") {
      return sortDirection === "asc" ? valA - valB : valB - valA;
    }

    return sortDirection === "asc"
      ? String(valA).localeCompare(String(valB), "fa")
      : String(valB).localeCompare(String(valA), "fa");
  });

  // 3. Selection handle
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!getRowId) return;
    if (e.target.checked) {
      const allIds = sortedData.map((r) => getRowId(r));
      setSelectedIds(allIds);
      if (onSelectionChange) onSelectionChange(allIds);
    } else {
      setSelectedIds([]);
      if (onSelectionChange) onSelectionChange([]);
    }
  };

  const handleSelectRow = (rowId: any, checked: boolean) => {
    let updated: any[];
    if (checked) {
      updated = [...selectedIds, rowId];
    } else {
      updated = selectedIds.filter((id) => id !== rowId);
    }
    setSelectedIds(updated);
    if (onSelectionChange) onSelectionChange(updated);
  };

  // 4. Export CSV (RTL/UTF-8 BOM compliant for Persian Excel)
  const handleExportCSV = () => {
    const activeCols = columns.filter((col) => visibleColumns.includes(String(col.key)));
    const headers = activeCols.map((col) => col.label).join(",");
    const rows = sortedData.map((row: any) => {
      return activeCols
        .map((col) => {
          const val = row[col.key];
          // Strip quotes, commas, clean value
          if (val === null || val === undefined) return "";
          const str = String(val).replace(/"/g, '""');
          return str.includes(",") || str.includes("\n") || str.includes('"') ? `"${str}"` : str;
        })
        .join(",");
    });

    const csvContent = "\uFEFF" + [headers, ...rows].join("\n"); // Add UTF-8 BOM
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `export_${id || "table"}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDirection("asc");
    }
  };

  return (
    <div className="space-y-4 w-full flex-1 flex flex-col">
      {/* Search, filters & export toolbar */}
      {(searchable || exportable || bulkActions) && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 pb-1">
          {searchable && (
            <div className="relative flex-1 max-w-sm">
              <input
                id={`search-input-${id || "table"}`}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-surface border border-border-subtle rounded-xl pr-11 pl-4 py-2.5 text-xs text-text-primary focus:outline-none"
              />
              <Search className="w-4 h-4 text-text-muted absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            {/* Bulk actions */}
            {selectedIds.length > 0 && bulkActions && (
              <div className="flex items-center gap-2 bg-primary-default/10 border border-primary-default/20 px-3 py-1.5 rounded-xl text-xs font-bold text-primary-default animate-fade-in shrink-0">
                <span>{selectedIds.length} ردیف انتخاب شده:</span>
                {bulkActions}
              </div>
            )}

            {/* Column visibility drop toggle */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowColMenu(!showColMenu)}
                className="p-2.5 rounded-xl bg-surface hover:bg-border-subtle text-text-secondary border border-border-subtle flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <SlidersHorizontal className="w-4 h-4" /> ستون‌ها
              </button>
              <AnimatePresence>
                {showColMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowColMenu(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute left-0 mt-2 bg-card border border-border-subtle rounded-xl shadow-xl z-50 p-3 w-48 space-y-2"
                    >
                      <h4 className="font-extrabold text-[10px] text-text-muted pb-1 border-b border-border-subtle">
                        نمایش ستون‌های جدول
                      </h4>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {columns.map((col) => {
                          const colKey = String(col.key);
                          const isVisible = visibleColumns.includes(colKey);
                          return (
                            <label key={colKey} className="flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer py-1">
                              <input
                                type="checkbox"
                                checked={isVisible}
                                onChange={() => {
                                  if (isVisible) {
                                    setVisibleColumns((prev) => prev.filter((k) => k !== colKey));
                                  } else {
                                    setVisibleColumns((prev) => [...prev, colKey]);
                                  }
                                }}
                                className="w-4 h-4 rounded text-primary-default focus:ring-primary-default border-border-default"
                              />
                              {col.label}
                            </label>
                          );
                        })}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* CSV export */}
            {exportable && (
              <button
                onClick={handleExportCSV}
                className="p-2.5 rounded-xl bg-surface hover:bg-border-subtle text-text-secondary border border-border-subtle flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              >
                <Download className="w-4 h-4" /> خروجی Excel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="border border-border-subtle bg-card rounded-2xl shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-right border-collapse text-xs">
            <thead className="bg-surface border-b border-border-subtle text-text-secondary font-extrabold sticky top-0 z-10">
              <tr>
                {selectable && getRowId && (
                  <th className="px-5 py-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={sortedData.length > 0 && selectedIds.length === sortedData.length}
                      onChange={handleSelectAll}
                      className="w-4.5 h-4.5 rounded border-border-default text-primary-default focus:ring-primary-default cursor-pointer"
                    />
                  </th>
                )}
                {columns
                  .filter((col) => visibleColumns.includes(String(col.key)))
                  .map((col) => {
                    const colKey = String(col.key);
                    const isSorted = sortBy === colKey;
                    return (
                      <th
                        key={colKey}
                        onClick={() => col.sortable && handleSort(colKey)}
                        className={`px-5 py-4 font-extrabold ${col.sortable ? "cursor-pointer select-none hover:text-text-primary" : ""}`}
                      >
                        <div className="flex items-center gap-1">
                          <span>{col.label}</span>
                          {col.sortable && (
                            <span className="text-text-muted shrink-0">
                              {isSorted ? (
                                sortDirection === "asc" ? (
                                  <ChevronUp className="w-3.5 h-3.5 text-primary-default" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5 text-primary-default" />
                                )
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 opacity-30" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                {actions && <th className="px-5 py-4 w-20 text-center">عملیات</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle font-semibold text-text-primary">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse bg-background/50">
                    {selectable && <td className="px-5 py-4.5"><div className="w-4 h-4 bg-border-subtle rounded mx-auto" /></td>}
                    {columns
                      .filter((col) => visibleColumns.includes(String(col.key)))
                      .map((col, idx) => (
                        <td key={idx} className="px-5 py-4.5">
                          <div className="h-3.5 bg-border-subtle rounded w-2/3" />
                        </td>
                      ))}
                    {actions && <td className="px-5 py-4.5"><div className="w-10 h-6 bg-border-subtle rounded mx-auto" /></td>}
                  </tr>
                ))
              ) : sortedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.filter((col) => visibleColumns.includes(String(col.key))).length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
                    className="px-5 py-12 text-center text-text-muted"
                  >
                    موردی یافت نشد.
                  </td>
                </tr>
              ) : (
                sortedData.map((row: any) => {
                  const rowId = getRowId ? getRowId(row) : null;
                  const isChecked = rowId ? selectedIds.includes(rowId) : false;
                  return (
                    <tr
                      key={rowId || Math.random()}
                      className={`hover:bg-background/40 transition-colors ${isChecked ? "bg-primary-default/5 hover:bg-primary-default/5" : ""}`}
                    >
                      {selectable && getRowId && (
                        <td className="px-5 py-3.5 w-12 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => handleSelectRow(rowId, e.target.checked)}
                            className="w-4.5 h-4.5 rounded border-border-default text-primary-default focus:ring-primary-default cursor-pointer"
                          />
                        </td>
                      )}
                      {columns
                        .filter((col) => visibleColumns.includes(String(col.key)))
                        .map((col) => {
                          const colKey = String(col.key);
                          return (
                            <td key={colKey} className="px-5 py-3.5 whitespace-nowrap">
                              {col.render ? col.render(row) : String(row[colKey] !== null && row[colKey] !== undefined ? row[colKey] : "")}
                            </td>
                          );
                        })}
                      {actions && (
                        <td className="px-5 py-3.5 w-20 text-center shrink-0">
                          <div className="flex items-center justify-center gap-1.5 shrink-0">{actions(row)}</div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
