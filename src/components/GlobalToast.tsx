import React, { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

class ToastManager {
  private static listeners: ((toast: Toast) => void)[] = [];

  static subscribe(listener: (toast: Toast) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  static show(message: string, type: ToastType = "info") {
    const toast: Toast = {
      id: Math.random().toString(36).substring(2, 9),
      message,
      type,
    };
    this.listeners.forEach((listener) => listener(toast));
  }
}

export const toast = (message: string, type: ToastType = "info") => {
  ToastManager.show(message, type);
};

export const GlobalToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = ToastManager.subscribe((newToast) => {
      setToasts((prev) => {
        // Prevent stacking duplicate messages and limit to max 3 toasts
        const filtered = prev.filter((t) => t.message !== newToast.message);
        return [...filtered, newToast].slice(-3);
      });
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, 3500);
    });
    return unsubscribe;
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 md:bottom-6 md:left-6 md:translate-x-0 z-[9999] flex flex-col gap-2 pointer-events-none w-[92vw] max-w-sm" dir="rtl">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center justify-between p-3.5 rounded-2xl shadow-2xl border backdrop-blur-md animate-slide-up bg-white/95 dark:bg-zinc-900/95
            ${t.type === "success" ? "border-emerald-500/30 text-emerald-800 dark:text-emerald-200" : t.type === "error" ? "border-red-500/30 text-red-800 dark:text-red-200" : "border-indigo-500/30 text-indigo-800 dark:text-indigo-200"}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
            {t.type === "error" && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
            {t.type === "info" && <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0" />}
            <p className="text-xs sm:text-sm font-bold truncate">
              {t.message}
            </p>
          </div>
          <button onClick={() => removeToast(t.id)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
