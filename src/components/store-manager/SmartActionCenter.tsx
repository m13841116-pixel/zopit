import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Target,
  Award,
  Package,
  ShoppingBag,
  Flame,
  BarChart3,
  CheckCircle2,
  X,
  ChevronLeft,
  RefreshCw,
  Zap,
  Info,
  ShieldCheck,
  Check
} from 'lucide-react';
import { toast } from '../GlobalToast';

export type ActionType =
  | 'PRODUCT_DISCOVERY'
  | 'PRODUCT_IMPORT'
  | 'LOW_STOCK'
  | 'SALES_GROWTH'
  | 'TARGET_PROGRESS'
  | 'NEW_PRODUCT'
  | 'PRODUCT_PERFORMANCE'
  | 'INVENTORY_OPPORTUNITY';

export interface StoreActionCard {
  id: string;
  type: ActionType;
  title: string;
  shortExplanation: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  priorityScore: number;
  reason: string;
  cta: string;
  targetDestination: 'marketplace' | 'recommendations' | 'catalog' | 'growth_center' | 'orders';
  metadata?: Record<string, any>;
  dismissible?: boolean;
}

interface SmartActionCenterProps {
  onNavigateTab: (tabId: string) => void;
  onOpenProductModal?: (productId: number) => void;
  compact?: boolean;
}

export const SmartActionCenter: React.FC<SmartActionCenterProps> = ({
  onNavigateTab,
  onOpenProductModal,
  compact = false
}) => {
  const [actions, setActions] = useState<StoreActionCard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [processingActionId, setProcessingActionId] = useState<string | null>(null);

  const fetchActions = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/store-manager/smart-actions', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!res.ok) {
        throw new Error('خطا در دریافت پیشنهادهای هوشمند رشد فروشگاه');
      }

      const data = await res.json();
      setActions(data.actions || []);

      // Track impressions
      if (data.actions && data.actions.length > 0) {
        const actionIds = data.actions.map((a: StoreActionCard) => a.id);
        fetch('/api/store-manager/smart-actions/impression', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ actionIds }),
          credentials: 'include'
        }).catch(() => {});
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'خطای غیرمنتظره در بارگذاری پیشنهادها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleActionClick = async (action: StoreActionCard) => {
    const token = localStorage.getItem('token') || '';
    // Track click
    fetch(`/api/store-manager/smart-actions/${action.id}/click`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    }).catch(() => {});

    // Navigate to target destination or open product modal
    if (action.metadata?.productId && onOpenProductModal) {
      onOpenProductModal(action.metadata.productId);
      return;
    }

    if (action.targetDestination === 'marketplace') {
      onNavigateTab('marketplace');
    } else if (action.targetDestination === 'recommendations') {
      onNavigateTab('recommendations');
    } else if (action.targetDestination === 'catalog') {
      onNavigateTab('catalog');
    } else if (action.targetDestination === 'growth_center') {
      onNavigateTab('growth_center');
    } else if (action.targetDestination === 'orders') {
      onNavigateTab('orders');
    } else {
      onNavigateTab('marketplace');
    }
  };

  const handleDismiss = async (actionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingActionId(actionId);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/store-manager/smart-actions/${actionId}/dismiss`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (res.ok) {
        toast('پیشنهاد با موفقیت حذف شد', 'info');
        setActions(prev => prev.filter(a => a.id !== actionId));
      } else {
        toast('خطا در حذف پیشنهاد', 'error');
      }
    } catch {
      toast('خطای شبکه در ثبت تغییرات', 'error');
    } finally {
      setProcessingActionId(null);
    }
  };

  const handleComplete = async (actionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setProcessingActionId(actionId);
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/store-manager/smart-actions/${actionId}/complete`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (res.ok) {
        toast('اقدام به عنوان انجام شده ثبت گردید', 'success');
        setActions(prev => prev.filter(a => a.id !== actionId));
      } else {
        toast('خطا در ثبت وضعیت', 'error');
      }
    } catch {
      toast('خطای شبکه در ثبت تغییرات', 'error');
    } finally {
      setProcessingActionId(null);
    }
  };

  const renderActionIcon = (type: ActionType) => {
    switch (type) {
      case 'TARGET_PROGRESS':
        return <Target className="w-5 h-5 text-indigo-500" />;
      case 'LOW_STOCK':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'SALES_GROWTH':
        return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      case 'PRODUCT_IMPORT':
        return <ShoppingBag className="w-5 h-5 text-amber-500" />;
      case 'NEW_PRODUCT':
        return <Flame className="w-5 h-5 text-orange-500" />;
      case 'PRODUCT_PERFORMANCE':
        return <BarChart3 className="w-5 h-5 text-sky-500" />;
      case 'INVENTORY_OPPORTUNITY':
        return <Package className="w-5 h-5 text-purple-500" />;
      case 'PRODUCT_DISCOVERY':
      default:
        return <Sparkles className="w-5 h-5 text-emerald-500" />;
    }
  };

  const getTypeLabel = (type: ActionType) => {
    switch (type) {
      case 'TARGET_PROGRESS':
        return 'هدف و پاداش';
      case 'LOW_STOCK':
        return 'موجودی انبار';
      case 'SALES_GROWTH':
        return 'روند فروش';
      case 'PRODUCT_IMPORT':
        return 'توسعه کاتالوگ';
      case 'NEW_PRODUCT':
        return 'کالای جدید';
      case 'PRODUCT_PERFORMANCE':
        return 'تحلیل کالا';
      case 'INVENTORY_OPPORTUNITY':
        return 'فرصت سودآوری';
      case 'PRODUCT_DISCOVERY':
      default:
        return 'پیشنهاد اختصاصی';
    }
  };

  if (loading) {
    return (
      <div className="bg-card p-6 rounded-2xl border border-subtle shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-subtle">
          <div className="h-5 bg-surface rounded-lg w-48 animate-pulse" />
          <div className="h-4 bg-surface rounded-lg w-20 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-36 bg-surface rounded-xl border border-subtle animate-pulse p-4" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card p-5 rounded-2xl border border-subtle shadow-sm flex items-center justify-between text-xs text-rose-500" dir="rtl">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{error}</span>
        </div>
        <button
          onClick={fetchActions}
          className="px-3 py-1 bg-surface hover:bg-subtle rounded-lg text-primary flex items-center gap-1"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>تلاش مجدد</span>
        </button>
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="bg-card p-6 rounded-2xl border border-subtle shadow-sm text-center text-xs text-muted space-y-2" dir="rtl">
        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <p className="font-bold text-primary text-sm">عملکرد فروشگاه شما عالی است!</p>
        <p className="text-secondary">در حال حاضر پیشنهادی برای اقدام فوری وجود ندارد. کاتالوگ و سفارشات در حالت بهینه قرار دارند.</p>
      </div>
    );
  }

  return (
    <section className="bg-card p-5 md:p-6 rounded-3xl border border-subtle shadow-sm space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-subtle">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-500/30">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-primary">پیشنهادهای Zopit برای رشد فروشگاه</h2>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                {actions.length} پیشنهاد فعال
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              اقدامات هوشمند و اولویت‌بندی شده بر اساس داده‌های واقعی فروشگاه شما
            </p>
          </div>
        </div>

        <button
          onClick={fetchActions}
          className="text-xs text-secondary hover:text-primary flex items-center gap-1.5 self-end sm:self-center bg-surface hover:bg-subtle px-3 py-1.5 rounded-xl border border-subtle transition-all cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>به‌روزرسانی</span>
        </button>
      </div>

      {/* Action Cards Grid */}
      <div className={`grid grid-cols-1 ${compact ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-4`}>
        {actions.map(action => {
          const isHigh = action.priority === 'HIGH';
          const isMedium = action.priority === 'MEDIUM';

          return (
            <div
              key={action.id}
              onClick={() => handleActionClick(action)}
              className={`group bg-surface hover:bg-card border ${
                isHigh
                  ? 'border-rose-500/30 dark:border-rose-500/20'
                  : isMedium
                  ? 'border-amber-500/30 dark:border-amber-500/20'
                  : 'border-subtle'
              } rounded-2xl p-4 flex flex-col justify-between transition-all hover:shadow-md cursor-pointer relative overflow-hidden`}
            >
              {/* Priority Accent Line */}
              <div
                className={`absolute top-0 right-0 left-0 h-1 ${
                  isHigh ? 'bg-rose-500' : isMedium ? 'bg-amber-500' : 'bg-sky-500'
                }`}
              />

              <div>
                {/* Top Bar: Icon, Type Badge, Priority & Dismiss */}
                <div className="flex items-center justify-between mb-3 pt-1">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-background rounded-xl border border-subtle">
                      {renderActionIcon(action.type)}
                    </div>
                    <span className="text-[11px] font-bold text-secondary">
                      {getTypeLabel(action.type)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        isHigh
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                          : isMedium
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-sky-500/10 text-sky-600 border border-sky-500/20'
                      }`}
                    >
                      {isHigh ? 'اولویت بالا' : isMedium ? 'اولویت متوسط' : 'فرصت رشد'}
                    </span>

                    {action.dismissible && (
                      <button
                        type="button"
                        disabled={processingActionId === action.id}
                        onClick={e => handleDismiss(action.id, e)}
                        title="حذف این پیشنهاد"
                        className="p-1 text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Title */}
                <h3 className="font-bold text-primary text-sm mb-1.5 leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {action.title}
                </h3>

                {/* Short Explanation */}
                <p className="text-xs text-secondary mb-3 line-clamp-2 leading-relaxed">
                  {action.shortExplanation}
                </p>

                {/* Reason Insight Box */}
                <div className="bg-background p-2.5 rounded-xl border border-subtle text-[11px] text-muted flex items-start gap-1.5 mb-4">
                  <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-tight">{action.reason}</span>
                </div>
              </div>

              {/* Action CTA Bar */}
              <div className="pt-3 border-t border-subtle flex items-center justify-between gap-2 mt-auto">
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    handleActionClick(action);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-sm"
                >
                  <span>{action.cta}</span>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  disabled={processingActionId === action.id}
                  onClick={e => handleComplete(action.id, e)}
                  title="علامت‌گذاری به عنوان انجام شده"
                  className="p-2 bg-background hover:bg-emerald-500/10 hover:text-emerald-600 text-muted rounded-xl border border-subtle transition-colors cursor-pointer flex items-center justify-center"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default SmartActionCenter;
