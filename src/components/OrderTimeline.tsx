import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Clock, 
  AlertTriangle, 
  X, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  CheckSquare, 
  CreditCard, 
  Package, 
  Truck 
} from 'lucide-react';

interface TimelineEntry {
  id: number;
  fromStatus: string | null;
  toStatus: string;
  actorRole: string;
  actorName: string | null;
  note: string | null;
  createdAt: string;
  durationHours: number;
}

interface OrderTimelineProps {
  orderId: number;
  showContactInfo?: boolean; // For Admin Panel
}

export default function OrderTimeline({ orderId, showContactInfo = false }: OrderTimelineProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    async function fetchTimeline() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
        const res = await fetch(`/api/orders/${orderId}/timeline`, { headers });
        if (!res.ok) {
          throw new Error('خطا در دریافت اطلاعات تایملاین');
        }
        const timelineData = await res.json();
        setData(timelineData);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'خطای شبکه در دریافت اطلاعات');
      } finally {
        setLoading(false);
      }
    }
    fetchTimeline();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10" dir="rtl">
        <div className="w-6 h-6 border-2 border-primary-default border-t-transparent rounded-full animate-spin"></div>
        <span className="mr-3 text-secondary text-xs font-medium">در حال بارگذاری تایملاین...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-600 text-xs font-medium" dir="rtl">
        {error || 'امکان نمایش تایملاین وجود ندارد.'}
      </div>
    );
  }

  const { currentStatus, timeline, isStuck, store, items } = data;

  // Format date helper
  const formatPersianDate = (dateString: string) => {
    try {
      return new Intl.DateTimeFormat('fa-IR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(dateString));
    } catch {
      return dateString;
    }
  };

  // Convert English status values to Persian readable labels
  const getStatusLabel = (status: string) => {
    const mapping: Record<string, string> = {
      REQUESTED: '۱. ثبت سفارش جدید',
      NEW: '۱. ثبت سفارش جدید',
      PENDING_APPROVAL: '۱. در انتظار تکمیل آدرس',
      WAITING_SUPPLIER_CONFIRMATION: '۱. ثبت سفارش',
      WAITING_STORE_ADDRESS: '۱. در انتظار ثبت آدرس پستی',
      APPROVED: 'تایید شده',
      SUPPLIER_APPROVED: '۲. در انتظار برآورد هزینه ارسال',
      WAITING_SHIPPING_COST: '۲. در انتظار برآورد هزینه ارسال',
      PENDING_PAYMENT: '۳. نیازمند پرداخت توسط مدیر فروشگاه',
      WAITING_FOR_PAYMENT: '۳. نیازمند پرداخت توسط مدیر فروشگاه',
      WAITING_SHIPPING_PAYMENT: '۳. نیازمند پرداخت هزینه ارسال',
      PAID: '۴. پرداخت شده (در انتظار صدور و چاپ لیبل)',
      PREPARING: '۴. در حال آماده‌سازی و چاپ لیبل',
      PENDING_POSTAL_LABEL: '۴. صدور و چاپ لیبل پستی',
      READY_TO_SHIP: '۴. آماده تحویل به پست',
      SHIPPED: '۵. تحویل به پست و در حال ارسال',
      PROCESSING: '۴. در حال پردازش و چاپ لیبل',
      DELIVERED: '۵. تحویل داده شده به گیرنده',
      COMPLETED: '۵. تکمیل و تحویل شده',
      CANCELLED: 'لغو شده',
      REJECTED: 'رد شده',
    };
    return mapping[status] || status;
  };

  // Map actor role to Persian
  const getRoleLabel = (role: string) => {
    const mapping: Record<string, string> = {
      SUPPLIER: 'تامین‌کننده',
      STORE_MANAGER: 'مدیر فروشگاه',
      ADMIN: 'مدیر پلتفرم',
      SYSTEM: 'سیستم',
    };
    return mapping[role] || role;
  };

  // Define 5 key milestone steps for the horizontal timeline in chronological order
  const steps = [
    { 
      label: '۱. ثبت و آدرس مقصد', 
      activeStatuses: ['WAITING_STORE_ADDRESS', 'REQUESTED', 'NEW', 'WAITING_SUPPLIER_CONFIRMATION'], 
      completedStatuses: ['WAITING_SHIPPING_COST', 'SUPPLIER_APPROVED', 'PENDING_PAYMENT', 'WAITING_FOR_PAYMENT', 'WAITING_SHIPPING_PAYMENT', 'PAID', 'PENDING_POSTAL_LABEL', 'READY_TO_SHIP', 'PREPARING', 'SHIPPED', 'PROCESSING', 'DELIVERED', 'COMPLETED'], 
      icon: CheckSquare 
    },
    { 
      label: '۲. برآورد هزینه ارسال', 
      activeStatuses: ['WAITING_SHIPPING_COST', 'SUPPLIER_APPROVED'], 
      completedStatuses: ['PENDING_PAYMENT', 'WAITING_FOR_PAYMENT', 'WAITING_SHIPPING_PAYMENT', 'PAID', 'PENDING_POSTAL_LABEL', 'READY_TO_SHIP', 'PREPARING', 'SHIPPED', 'PROCESSING', 'DELIVERED', 'COMPLETED'], 
      icon: Package 
    },
    { 
      label: '۳. نیازمند پرداخت', 
      activeStatuses: ['PENDING_PAYMENT', 'WAITING_FOR_PAYMENT', 'WAITING_SHIPPING_PAYMENT'], 
      completedStatuses: ['PAID', 'PENDING_POSTAL_LABEL', 'READY_TO_SHIP', 'PREPARING', 'SHIPPED', 'PROCESSING', 'DELIVERED', 'COMPLETED'], 
      icon: CreditCard 
    },
    { 
      label: '۴. دریافت و چاپ لیبل', 
      activeStatuses: ['PAID', 'PENDING_POSTAL_LABEL', 'READY_TO_SHIP', 'PREPARING', 'PROCESSING'], 
      completedStatuses: ['SHIPPED', 'DELIVERED', 'COMPLETED'], 
      icon: FileText 
    },
    { 
      label: '۵. ارسال پستی', 
      activeStatuses: ['SHIPPED'], 
      completedStatuses: ['DELIVERED', 'COMPLETED'], 
      icon: Truck 
    }
  ];

  const isCancelledOrRejected = ['CANCELLED', 'REJECTED'].includes(currentStatus);

  // Helper to determine step state: 'completed' | 'active' | 'pending' | 'failed'
  const getStepState = (stepIndex: number) => {
    const step = steps[stepIndex];
    const isCompleted = step.completedStatuses.includes(currentStatus);
    const isActive = step.activeStatuses.includes(currentStatus);

    if (isCancelledOrRejected) {
      if (isCompleted) return 'completed';
      if (isActive) return 'failed';
      
      // If a previous step was active or completed, mark current as failed
      const prevStep = stepIndex > 0 ? steps[stepIndex - 1] : null;
      if (prevStep) {
        const prevIsCompleted = prevStep.completedStatuses.includes(currentStatus);
        const prevIsActive = prevStep.activeStatuses.includes(currentStatus);
        if (prevIsCompleted || prevIsActive) return 'failed';
      }
      return 'pending';
    }

    if (isCompleted) return 'completed';
    if (isActive) return 'active';

    return 'pending';
  };

  // Find furthest active or completed step index for correct RTL filling
  const getFurthestStepIndex = () => {
    for (let i = steps.length - 1; i >= 0; i--) {
      const state = getStepState(i);
      if (state === 'completed' || state === 'active') {
        return i;
      }
    }
    return 0;
  };

  // Find the last entry with note or description
  const lastUpdateWithNote = [...timeline].reverse().find((h: any) => h.note);
  const latestLog = timeline[timeline.length - 1];

  return (
    <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 text-zinc-800 font-sans shadow-sm" dir="rtl" id="order-timeline-container">
      {/* Stuck warning banner */}
      {isStuck && (
        <div className="mb-4 flex items-center gap-2.5 p-3.5 bg-slate-100 border border-slate-300 text-slate-950 rounded-xl text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600" />
          <div className="font-extrabold">
            این سفارش بیش از ۱۲ ساعت در انتظار تایید است.
          </div>
        </div>
      )}

      {/* Admin specific double side contact details */}
      {showContactInfo && (
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-150 text-xs">
          <div className="space-y-1.5 text-right">
            <div className="text-zinc-500 font-bold mb-1 text-[11px] uppercase tracking-wider">مشخصات خریدار (فروشگاه):</div>
            <div>نام فروشگاه: <span className="text-zinc-900 font-semibold">{store?.storeName || 'نامشخص'}</span></div>
            <div>مدیر: <span className="text-zinc-900 font-semibold">{store?.firstName} {store?.lastName}</span></div>
            <div>تلفن: <span className="text-zinc-900 font-semibold font-mono" dir="ltr">{store?.mobile || 'نامشخص'}</span></div>
          </div>
          <div className="space-y-1.5 border-t md:border-t-0 md:border-r border-zinc-200 pt-3 md:pt-0 md:pr-4 text-right">
            <div className="text-zinc-500 font-bold mb-1 text-[11px] uppercase tracking-wider">مشخصات تامین‌کننده:</div>
            {items?.[0]?.product?.supplier ? (
              <>
                {items[0].product.supplier.username && (
                  <div>نام کاربری: <span className="text-zinc-900 font-semibold font-mono">@{items[0].product.supplier.username}</span></div>
                )}
                <div>استان و شهر: <span className="text-zinc-900 font-semibold">{items[0].product.supplier.province || 'نامشخص'} - {items[0].product.supplier.city || 'نامشخص'}</span></div>
              </>
            ) : (
              <div className="text-zinc-400">مشخصات تامین‌کننده یافت نشد.</div>
            )}
          </div>
        </div>
      )}

      {/* Modern Compact Minimal Stepper */}
      <div className="py-6 px-1 select-none">
        <div className="relative flex items-center justify-between w-full">
          {/* Progress Connecting Track */}
          <div className="absolute left-[8%] right-[8%] top-5 h-[2px] bg-zinc-100 rounded-full z-0"></div>

          {/* Glowing active progress line segment (RTL-aware) */}
          <div 
            className="absolute right-[8%] top-5 h-[2px] bg-gradient-to-l from-purple-500 to-emerald-400 transition-all duration-500 rounded-full z-0"
            style={{
              left: `${100 - 8 - (getFurthestStepIndex() * (84 / Math.max(1, steps.length - 1)))}%`,
              display: steps.some((_, i) => getStepState(i) === 'completed') ? 'block' : 'none'
            }}
          ></div>

          {steps.map((step, idx) => {
            const state = getStepState(idx);
            const StepIcon = step.icon;
            
            return (
              <div key={idx} className="relative z-10 flex flex-col items-center flex-1">
                {/* Stepper Node Bubble */}
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-300 relative ${
                    state === 'completed'
                      ? 'bg-emerald-950/15 border-emerald-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                      : state === 'active'
                      ? 'bg-indigo-950/15 border-indigo-700 text-indigo-800 dark:text-indigo-300 shadow-md scale-110 ring-4 ring-indigo-500/20'
                      : state === 'failed'
                      ? 'bg-rose-950/15 border-rose-700 text-rose-800 dark:text-rose-300'
                      : 'bg-zinc-100 border-zinc-300 text-zinc-500 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-400'
                  }`}
                >
                  <StepIcon className={`w-4 h-4 ${state === 'active' ? 'animate-pulse' : ''}`} />

                  {/* Top corner completed badge */}
                  {state === 'completed' && (
                    <span className="absolute -top-1 -right-1 bg-emerald-700 text-white rounded-full p-0.5 border border-white">
                      <Check className="w-2 h-2 stroke-[4]" />
                    </span>
                  )}
                  {state === 'failed' && (
                    <span className="absolute -top-1 -right-1 bg-rose-700 text-white rounded-full p-0.5 border border-white">
                      <X className="w-2 h-2 stroke-[4]" />
                    </span>
                  )}
                </div>

                {/* Step Label */}
                <span 
                  className={`mt-2.5 text-[11px] font-bold tracking-tight text-center whitespace-nowrap transition-colors duration-300 ${
                    state === 'completed' ? 'text-emerald-800 dark:text-emerald-300' :
                    state === 'active' ? 'text-indigo-800 dark:text-indigo-300 font-extrabold' :
                    state === 'failed' ? 'text-rose-800 dark:text-rose-300' : 'text-zinc-500 dark:text-zinc-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Section / Subtitle description */}
      <div className="mt-4 pt-3.5 border-t border-zinc-150 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs text-zinc-500 text-right">
        <div className="flex items-center gap-2 justify-start">
          <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
          <div>
            <span>آخرین وضعیت: </span>
            <span className="text-zinc-800 font-bold">{getStatusLabel(currentStatus)}</span>
            {latestLog && (
              <span className="text-zinc-500 font-medium mr-1">
                (توسط {latestLog.actorName || getRoleLabel(latestLog.actorRole)})
              </span>
            )}
          </div>
        </div>
        
        {latestLog && (
          <div className="text-zinc-400 font-mono text-[11px] text-right sm:text-left">
            {formatPersianDate(latestLog.createdAt)}
          </div>
        )}
      </div>

      {/* User Note Quote if present */}
      {lastUpdateWithNote && lastUpdateWithNote.note && (
        <div className="mt-3 p-3 bg-zinc-50 border border-zinc-150 rounded-xl text-xs text-zinc-600 italic text-right relative pr-6">
          <span className="absolute right-2 top-2 text-purple-400 font-serif text-lg leading-none">“</span>
          <span>{lastUpdateWithNote.note}</span>
        </div>
      )}

      {/* Accordion Toggle for Detailed Logs */}
      <div className="mt-4">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="w-full flex items-center justify-between py-2.5 px-3.5 bg-zinc-50 hover:bg-zinc-100/75 transition-colors border border-zinc-150 rounded-xl text-xs text-zinc-500 hover:text-zinc-700"
        >
          <span className="font-semibold">مشاهده تاریخچه کامل تراکنش‌ها ({timeline.length})</span>
          {showLogs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showLogs && (
          <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto pl-1 pr-2 border border-zinc-150 p-3 rounded-xl bg-zinc-50/30">
            {timeline.map((entry: TimelineEntry) => (
              <div key={entry.id} className="text-[11px] bg-white border border-zinc-150 p-2.5 rounded-lg flex items-start justify-between gap-2.5 text-right shadow-sm">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 justify-start">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 text-[9px] font-bold">
                      {getRoleLabel(entry.actorRole)}
                    </span>
                    <span className="font-bold text-zinc-700">{entry.actorName || 'سیستم'}</span>
                  </div>
                  <div className="text-zinc-500">
                    تغییر از <span className="text-zinc-400">{entry.fromStatus ? getStatusLabel(entry.fromStatus) : 'شروع'}</span> به <span className="text-purple-600 font-bold">{getStatusLabel(entry.toStatus)}</span>
                  </div>
                  {entry.note && (
                    <div className="text-zinc-500 italic bg-zinc-50 p-1.5 rounded border border-zinc-150 mt-1">
                      « {entry.note} »
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-zinc-400 font-mono whitespace-nowrap pt-0.5">
                  {formatPersianDate(entry.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
