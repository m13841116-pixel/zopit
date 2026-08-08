import React, { createContext, useContext, useState, ReactNode } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast, addToast: showToast }}>
      {children}
      <div className="fixed bottom-6 left-6 z-[200] flex flex-col gap-3 pointer-events-none w-80">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-xl shadow-lg border animate-slide-up bg-card
              ${toast.type === "success" ? "border-success bg-success/10" : toast.type === "error" ? "border-danger bg-danger/10" : "border-primary-default bg-primary-default/10"}`}
          >
            <div className="flex items-center gap-3">
              {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-success" />}
              {toast.type === "error" && <AlertCircle className="w-5 h-5 text-danger" />}
              {toast.type === "info" && <AlertCircle className="w-5 h-5 text-primary-default" />}
              <p className={`text-sm font-bold ${toast.type === "success" ? "text-success" : toast.type === "error" ? "text-danger" : "text-primary-default"}`}>
                {toast.message}
              </p>
            </div>
            <button onClick={() => removeToast(toast.id)} className="text-secondary hover:text-primary transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    const fn = (message: string, type: ToastType = "info") => {
      if (typeof window !== "undefined" && (window as any).toast) {
        (window as any).toast(message, type);
      } else {
        console.log(`[Toast ${type}]: ${message}`);
      }
    };
    return {
      showToast: fn,
      addToast: fn,
    };
  }
  return context;
};
