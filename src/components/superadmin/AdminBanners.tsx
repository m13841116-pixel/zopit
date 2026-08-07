import { toast } from "../GlobalToast";
import React, { useState } from "react";
import { Image, Plus, Trash2, Edit, Save, X } from "lucide-react";

export default function AdminBanners({ showNotification }: { showNotification?: any }) {
  const [banners, setBanners] = useState([
    {
      id: 1,
      title: "توسعه تجارت در سطح ملی",
      description: "با اتصال به شبکه گسترده تأمین‌کنندگان و فروشگاه‌های زوپیت، زنجیره تأمین خود را بهینه‌سازی کنید.",
      imageUrl: "https://www.transparenttextures.com/patterns/cubes.png",
      isActive: true,
    }
  ]);
  const [isEditing, setIsEditing] = useState(false);

  React.useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/banners');
      const data = await res.json();
      if (Array.isArray(data)) setBanners(data);
    } catch (e) {
      console.error(e);
    }
  };

  const [currentBanner, setCurrentBanner] = useState<any>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (currentBanner.id) {
        await fetch(`/api/banners/${currentBanner.id}`, { credentials: "include",
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentBanner)
        });
        showNotification?.("بنر با موفقیت بروزرسانی شد", "success");
      } else {
        await fetch('/api/banners', { credentials: "include",
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(currentBanner)
        });
        showNotification?.("بنر با موفقیت اضافه شد", "success");
      }
      fetchBanners();
      setIsEditing(false);
      setCurrentBanner(null);
    } catch (e) {
      showNotification?.("خطا در ذخیره بنر", "error");
    }
  };

  const handleDelete = async (id: number) => {
    if(!await window.customConfirm('آیا از حذف مطمئن هستید؟')) return;
    
    try {
      await fetch(`/api/banners/${id}`, { credentials: "include", method: 'DELETE'});
      showNotification?.("بنر با موفقیت حذف شد", "success");
      fetchBanners();
    } catch (e) {
      showNotification?.("خطا در حذف", "error");
    }
  };

  const toggleActive = async (id: number) => {
    const banner = banners.find(b => b.id === id);
    if(!banner) return;
    
    try {
      await fetch(`/api/banners/${id}`, { credentials: "include",
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...banner, isActive: !banner.isActive })
      });
      fetchBanners();
    } catch(e) {}
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      <div className="flex justify-between items-center bg-card p-6 rounded-3xl shadow-sm border border-border-default">
        <div>
          <h2 className="text-xl font-black text-text-primary flex items-center gap-2">
            <Image className="w-6 h-6 text-primary-default" />
            مدیریت بنرهای ورود
          </h2>
          <p className="text-sm text-text-muted mt-1">بنرهایی که در صفحه ورود به کاربران نمایش داده می‌شود را مدیریت کنید</p>
        </div>
        <button
          onClick={() => {
            setCurrentBanner({ title: "", description: "", imageUrl: "", isActive: true, displayLocation: "SHOP" });
            setIsEditing(true);
          }}
          className="bg-primary-default hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          افزودن بنر جدید
        </button>
      </div>

      {isEditing && currentBanner && (
        <form onSubmit={handleSave} className="bg-card p-6 rounded-3xl shadow-sm border border-border-default space-y-4">
          <div className="flex justify-between items-center border-b border-border-default pb-4 mb-4">
            <h3 className="font-bold text-text-primary">{currentBanner.id ? "ویرایش بنر" : "افزودن بنر"}</h3>
            <button type="button" onClick={() => setIsEditing(false)} className="text-text-muted hover:text-danger">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">عنوان بنر</label>
              <input
                required
                value={currentBanner.title}
                onChange={e => setCurrentBanner({...currentBanner, title: e.target.value})}
                className="w-full border border-border-default rounded-xl p-3 text-sm focus:border-primary-default focus:ring-2 focus:ring-primary-default/20 bg-background text-text-primary"
                placeholder="مثال: توسعه تجارت..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-secondary">آدرس تصویر (URL)</label>
              <input
                value={currentBanner.imageUrl}
                onChange={e => setCurrentBanner({...currentBanner, imageUrl: e.target.value})}
                className="w-full border border-border-default rounded-xl p-3 text-sm focus:border-primary-default focus:ring-2 focus:ring-primary-default/20 bg-background text-text-primary text-left"
                placeholder="https://..."
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-text-secondary">توضیحات</label>
              <textarea
                required
                value={currentBanner.description}
                onChange={e => setCurrentBanner({...currentBanner, description: e.target.value})}
                className="w-full border border-border-default rounded-xl p-3 text-sm focus:border-primary-default focus:ring-2 focus:ring-primary-default/20 bg-background text-text-primary"
                rows={3}
              ></textarea>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:col-span-2 bg-surface p-4 rounded-2xl border border-border-default">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={currentBanner.isActive}
                  onChange={e => setCurrentBanner({...currentBanner, isActive: e.target.checked})}
                  className="w-4 h-4 text-primary-default border-border-default rounded focus:ring-primary-default"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-text-primary">وضعیت نمایش فعال باشد</label>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-text-secondary whitespace-nowrap">محل نمایش:</label>
                <select
                  value={currentBanner.displayLocation || 'SHOP'}
                  onChange={e => setCurrentBanner({...currentBanner, displayLocation: e.target.value})}
                  className="border border-border-default rounded-xl px-3 py-2 text-xs font-bold bg-background text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-default/25"
                >
                  <option value="SHOP">فروشگاه (Shop)</option>
                  <option value="LOGIN">صفحه ورود (Login)</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 bg-surface text-text-primary rounded-xl text-sm font-bold hover:bg-border-default transition-colors">
              انصراف
            </button>
            <button type="submit" className="px-4 py-2 bg-primary-default text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary-hover transition-colors">
              <Save className="w-4 h-4" />
              ذخیره اطلاعات
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {banners.map(banner => (
          <div key={banner.id} className={`bg-card rounded-3xl border ${banner.isActive ? 'border-primary-default/30 shadow-md shadow-primary-default/5' : 'border-border-default shadow-sm opacity-60'} overflow-hidden transition-all hover:shadow-lg`}>
            {banner.imageUrl && (
              <div className="h-32 bg-surface relative overflow-hidden">
                <img referrerPolicy="no-referrer" src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-black text-text-primary">{banner.title}</h3>
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${banner.isActive ? 'bg-success/10 text-success' : 'bg-surface text-text-muted'}`}>
                    {banner.isActive ? 'فعال' : 'غیرفعال'}
                  </span>
                  <span className="text-[9px] font-bold text-text-secondary bg-surface px-1.5 py-0.5 rounded border border-border-default">
                    {(banner as any).displayLocation === "LOGIN" ? "صفحه ورود" : "فروشگاه"}
                  </span>
                </div>
              </div>
              <p className="text-xs text-text-muted mb-4 line-clamp-3 leading-relaxed">{banner.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-border-default">
                <button
                  onClick={() => toggleActive(banner.id)}
                  className={`text-xs font-bold ${banner.isActive ? 'text-warning hover:text-amber-600' : 'text-success hover:text-emerald-600'}`}
                >
                  {banner.isActive ? 'غیرفعال کردن' : 'فعال کردن'}
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setCurrentBanner(banner); setIsEditing(true); }} className="p-1.5 text-text-muted hover:text-primary-default hover:bg-primary-default/10 rounded-lg transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(banner.id)} className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
