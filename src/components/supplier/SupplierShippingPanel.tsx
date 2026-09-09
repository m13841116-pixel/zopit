import React, { useState, useEffect } from "react";
import { Truck, Save, Loader2, MapPin, Building, CreditCard } from "lucide-react";

export default function SupplierShippingPanel({ showNotification }: { showNotification: (msg: string, type: "success" | "error") => void }) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [provider, setProvider] = useState("");
  const [accountId, setAccountId] = useState("");
  const [originAddress, setOriginAddress] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/shipping-profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setProvider(data.provider || "");
        setAccountId(data.accountId || "");
        setOriginAddress(data.originAddress || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/shipping-profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ provider, accountId, originAddress })
      });
      if (res.ok) {
        showNotification("پروفایل پستی با موفقیت ذخیره شد.", "success");
      } else {
        showNotification("خطا در ذخیره اطلاعات", "error");
      }
    } catch (err) {
      showNotification("خطای ارتباط با سرور", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-surface border border-subtle rounded-2xl p-6">
        <h2 className="text-xl font-bold text-primary flex items-center gap-2 mb-6">
          <Truck className="w-6 h-6 text-primary-default" />
          تنظیمات پستی و ارسال مرسولات
        </h2>
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8">
          <p className="text-sm text-secondary font-medium leading-relaxed">
            زوپیت تنها ناظر بر فرآیند ارسال است. تامین‌کننده موظف است پس از آماده‌سازی سفارش، با شرکت پستی یا باربری مدنظر خود (مانند تیپاکس، پست پیشتاز و غیره) هماهنگ کرده و مرسوله را ارسال نماید. سپس کد رهگیری را در جزئیات سفارش ثبت کند تا فروشگاه در جریان ارسال قرار گیرد.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
          <div className="space-y-2">
            <label className="text-sm font-bold text-primary flex items-center gap-2">
              <Building className="w-4 h-4 text-emerald-500" />
              شرکت پستی پیش‌فرض (انتخابی)
            </label>
            <input
              type="text"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="مثلاً: تیپاکس، پست ملی، اسنپ‌باکس"
              className="w-full bg-body border border-subtle rounded-xl px-4 py-3 text-sm focus:border-primary-default focus:ring-1 focus:ring-primary-default transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-primary flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-500" />
              کد اشتراک / شناسه پنل پستی (اختیاری)
            </label>
            <input
              type="text"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="کد اشتراک شما در سیستم پستی"
              className="w-full bg-body border border-subtle rounded-xl px-4 py-3 text-sm text-left dir-ltr focus:border-primary-default focus:ring-1 focus:ring-primary-default transition-colors"
            />
            <p className="text-xs text-muted">این شناسه در سیستم زوپیت ذخیره می‌شود اما نیازی به وارد کردن رمز عبور پنل پستی شما نیست.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-primary flex items-center gap-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              آدرس مبدأ ارسال (الزامی برای رهگیری)
            </label>
            <textarea
              value={originAddress}
              onChange={(e) => setOriginAddress(e.target.value)}
              placeholder="آدرس دقیق انبار یا فروشگاه مبدأ جهت تحویل به مامور پست"
              required
              rows={3}
              className="w-full bg-body border border-subtle rounded-xl px-4 py-3 text-sm focus:border-primary-default focus:ring-1 focus:ring-primary-default transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-primary-default hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            ذخیره پروفایل پستی
          </button>
        </form>
      </div>
    </div>
  );
}
