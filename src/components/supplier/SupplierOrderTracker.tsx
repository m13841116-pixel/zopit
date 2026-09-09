import React, { useState } from 'react';
import { Truck, UploadCloud, Loader2, CheckCircle, Package, Save } from 'lucide-react';

export default function SupplierOrderTracker({ orderItem, onUpdated, showNotification }: { orderItem: any, onUpdated: () => void, showNotification: (msg: string, type: 'success' | 'error') => void }) {
  const [carrier, setCarrier] = useState(orderItem.supplierGroup?.shippingProvider || '');
  const [trackingCode, setTrackingCode] = useState(orderItem.supplierGroup?.trackingCode || '');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const isShipped = ['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(orderItem.supplierGroup?.status || orderItem.status);

  const handleSubmit = async (e: React.FormEvent, isShipment: boolean = false) => {
    e.preventDefault();
    if (!orderItem.supplierGroup?.id) {
      showNotification('خطا: گروه سفارش یافت نشد.', 'error');
      return;
    }
    
    setSaving(true);
    try {
      const token = localStorage.getItem('token') || '';
      const groupId = orderItem.supplierGroup.id;
      
      // Upload file first if exists
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadRes = await fetch(`/api/supplier/order-groups/${groupId}/label`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        if (!uploadRes.ok) {
          showNotification('خطا در بارگذاری فایل لیبل', 'error');
          setSaving(false);
          return;
        }
      }

      // Update tracking
      const newStatus = isShipment ? 'SHIPPED' : undefined;
      const res = await fetch(`/api/supplier/order-groups/${groupId}/tracking`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ carrier, trackingCode, newStatus })
      });

      if (res.ok) {
        showNotification(isShipment ? 'مرسوله با موفقیت ثبت ارسال شد. مبلغ این سفارش به موجودی حساب شما اضافه شد.' : 'کد رهگیری بروزرسانی شد.', 'success');
        onUpdated();
      } else {
        const err = await res.json().catch(() => ({}));
        showNotification(err.error || 'خطا در ثبت اطلاعات', 'error');
      }
    } catch (err) {
      showNotification('خطای ارتباط با سرور', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (isShipped) {
    return (
      <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-right space-y-3">
        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-black text-sm">
          <CheckCircle className="w-5 h-5" />
          <span>این مرسوله تحویل حامل داده شده است</span>
        </div>
        <p className="text-xs text-muted leading-relaxed">
          وضعیت سفارش به «ارسال شد» تغییر یافته است.
        </p>
        <div className="grid grid-cols-2 gap-3 mt-2">
           <div>
             <p className="text-[10px] text-muted">شرکت پستی</p>
             <p className="text-sm font-bold text-primary">{orderItem.supplierGroup?.shippingProvider || 'ثبت نشده'}</p>
           </div>
           <div>
             <p className="text-[10px] text-muted">کد پیگیری</p>
             <p className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">{orderItem.supplierGroup?.trackingCode || 'ندارد'}</p>
           </div>
        </div>
        {orderItem.supplierGroup?.shippingLabelUrl && (
          <div className="pt-2">
            <a href={orderItem.supplierGroup.shippingLabelUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-500 hover:underline">
              مشاهده لیبل الصاق شده
            </a>
          </div>
        )}
      </div>
    );
  }

  return (
    <form className="space-y-4 bg-surface border border-subtle p-4 rounded-2xl">
      <p className="text-sm font-bold text-primary flex items-center gap-2">
        <Package className="w-4 h-4 text-emerald-500" />
        ثبت اطلاعات ارسال و کد رهگیری
      </p>
      <p className="text-xs text-muted leading-relaxed">
        پس از تحویل سفارش به شرکت پستی خود، اطلاعات زیر را جهت پیگیری مشتری ثبت نمایید.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] text-muted font-bold block mb-1">شرکت پستی / باربری</label>
          <input type="text" value={carrier} onChange={e => setCarrier(e.target.value)} placeholder="تیپاکس، چاپار..." className="w-full bg-body border border-subtle rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-primary-default" />
        </div>
        <div>
          <label className="text-[10px] text-muted font-bold block mb-1">کد رهگیری / بارنامه</label>
          <input type="text" value={trackingCode} onChange={e => setTrackingCode(e.target.value)} placeholder="مثلا 123456789" className="w-full bg-body border border-subtle rounded-lg px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-primary-default dir-ltr text-left" />
        </div>
      </div>

      <div>
        <label className="text-[10px] text-muted font-bold block mb-1">رسید پستی / لیبل مرسوله (اختیاری)</label>
        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-subtle border-dashed rounded-xl cursor-pointer bg-body hover:bg-surface transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-6 h-6 mb-2 text-text-muted" />
            <p className="text-xs text-text-muted">{file ? file.name : "برای بارگذاری کلیک کنید"}</p>
          </div>
          <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => { if(e.target.files?.length) setFile(e.target.files[0]); }} />
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={(e) => handleSubmit(e, false)} disabled={saving} className="flex-1 bg-surface border border-primary/30 text-primary-default hover:bg-primary/5 active:scale-95 py-2.5 rounded-xl font-bold text-xs transition-all flex justify-center items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          ذخیره اطلاعات
        </button>
        <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={saving} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 py-2.5 rounded-xl font-bold text-xs transition-all flex justify-center items-center gap-2 shadow-md shadow-emerald-600/25">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
          🚚 ارسال شد
        </button>
      </div>
    </form>
  );
}
