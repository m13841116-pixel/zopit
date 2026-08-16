import React, { useState, useEffect } from "react";
import { User, Save } from "lucide-react";

export function StoreManagerProfile({ user, showNotification, onUpdateUser }: any) {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    shaba: user?.shaba || "",
    cardNumber: user?.cardNumber || "",
    mobile: user?.mobile || "",
    address: user?.address || "",
    storeLink: user?.storeLink || "",
    avatarUrl: user?.avatarUrl || "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        shaba: user.shaba || "",
        cardNumber: user.cardNumber || "",
        mobile: user.mobile || "",
        address: user.address || "",
        storeLink: user.storeLink || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/store-manager/profile", {
        credentials: "include",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        const updatedUser = await res.json();
        if (onUpdateUser) {
          onUpdateUser(updatedUser);
        }
        showNotification("ویرایش مشخصات با موفقیت انجام شد", "success");
      } else {
        showNotification("خطا در ویرایش مشخصات", "error");
      }
    } catch (err) {
      showNotification("خطای شبکه", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      <div className="bg-card rounded-3xl p-6 lg:p-8 border border-subtle shadow-sm max-w-2xl mx-auto">
        <div className="flex border-b border-subtle mb-8 pb-1 gap-6">
          <div className="pb-4 text-base font-extrabold flex items-center gap-2 text-primary-default relative">
            <User className="w-5 h-5" /> ویرایش مشخصات کاربری
            <span className="absolute bottom-0 right-0 left-0 h-0.5 bg-primary-default rounded-full"></span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-secondary mb-2">
                نام کاربری (غیرقابل ویرایش)
              </label>
              <input
                type="text"
                className="w-full bg-slate-100 border border-subtle rounded-xl px-4 py-3 text-sm font-mono text-left outline-none text-slate-500 cursor-not-allowed"
                value={user?.username || ""}
                disabled
                readOnly
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-2">
                نام
              </label>
              <input
                type="text"
                className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-colors outline-none"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-2">
                نام خانوادگی
              </label>
              <input
                type="text"
                className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-colors outline-none"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-2">
                موبایل
              </label>
              <input
                type="text"
                className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-colors outline-none font-mono text-left"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({ ...formData, mobile: e.target.value })
                }
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-2">
                شماره کارت بانک
              </label>
              <input
                type="text"
                className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-colors outline-none font-mono text-left"
                value={formData.cardNumber}
                onChange={(e) =>
                  setFormData({ ...formData, cardNumber: e.target.value })
                }
                dir="ltr"
                placeholder="6037990000000000"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary mb-2">
                شماره شبا (بدون IR)
              </label>
              <input
                type="text"
                className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-colors outline-none font-mono text-left"
                value={formData.shaba}
                onChange={(e) =>
                  setFormData({ ...formData, shaba: e.target.value })
                }
                dir="ltr"
                placeholder="000000000000000000000000"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-secondary mb-2">
                آدرس فروشگاه
              </label>
              <textarea
                className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-colors outline-none h-20 resize-none"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="آدرس دقیق و کامل فروشگاه خود را وارد کنید..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-secondary mb-2">
                لینک فروشگاه (سایت، زوپیت‌گرام یا کانال)
              </label>
              <input
                type="text"
                className="w-full bg-background border border-subtle rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-default/20 focus:border-primary-default transition-colors outline-none text-left font-mono"
                value={formData.storeLink}
                onChange={(e) =>
                  setFormData({ ...formData, storeLink: e.target.value })
                }
                placeholder="zoombit.com/my_store"
                dir="ltr"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-secondary mb-2">
                عکس پروفایل / لوگو
              </label>
              <div className="flex items-center gap-6 bg-background border border-subtle rounded-2xl p-4">
                <div className="relative w-16 h-16 rounded-full border-2 border-primary-default/25 bg-surface flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-xs text-muted font-bold">فاقد عکس</span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData({
                              ...formData,
                              avatarUrl: reader.result as string,
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="profile-avatar-file-upload"
                    />
                    <label
                      htmlFor="profile-avatar-file-upload"
                      className="px-4 py-2 bg-primary-default hover:bg-primary-hover text-inverse font-bold text-xs rounded-xl cursor-pointer transition-colors"
                    >
                      تغییر عکس
                    </label>
                    {formData.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, avatarUrl: "" })}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl cursor-pointer transition-colors border border-red-200"
                      >
                        حذف عکس
                      </button>
                    )}
                  </div>
                  <span className="text-[10px] text-muted">پسوند‌های مجاز: JPG, PNG. حجم حداکثر ۱ مگابایت.</span>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-subtle flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 rounded-xl font-bold text-inverse bg-primary-default hover:bg-primary-hover transition-all shadow-lg shadow-primary-default/15 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? "در حال ثبت..." : "ذخیره تغییرات"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
