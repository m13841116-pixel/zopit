import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught React error:", error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background text-primary flex items-center justify-center p-4" dir="rtl">
          <div className="bg-card border border-subtle rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl space-y-6">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-black text-primary mb-2">بروز خطای غیرمنتظره در برنامه</h2>
              <p className="text-xs text-secondary leading-relaxed">
                یک خطای سیستمی رخ داده است. می‌توانید صفحه را بازنشانی کنید یا حافظه موقت مرورگر را پاک نمایید.
              </p>
              {this.state.error?.message && (
                <div className="mt-4 p-3 bg-surface rounded-xl text-left font-mono text-[11px] text-muted overflow-x-auto" dir="ltr">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-3 px-4 bg-primary-default hover:bg-primary-hover text-inverse font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-4 h-4" /> تلاش مجدد (تلاش دوباره)
              </button>
              <button
                onClick={this.handleReset}
                className="py-3 px-4 bg-surface hover:bg-subtle text-secondary font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                پاکسازی حافظه و بازنشانی
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
