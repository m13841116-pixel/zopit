import { toast } from "../GlobalToast";
import React, { useState, useRef } from "react";
import { Send, Bell, Users, Store, Globe, Paperclip, X } from "lucide-react";
export default function Notifications() {
  const [formData, setFormData] = useState({
    title: "",
    target: "ALL",
    message: "",
    type: "INFO",
  });
  const [loading, setLoading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formDataObj = new FormData();
    formDataObj.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataObj,
      });
      if (res.ok) {
        const data = await res.json();
        setAttachmentUrl(data.url);
        toast("فایل با موفقیت آپلود شد.", "success");
      } else {
        toast("خطا در آپلود فایل.", "error");
      }
    } catch (err) {
      toast("خطا در ارتباط با سرور هنگام آپلود.", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast("لطفا عنوان اعلان را وارد کنید.", "error");
      return;
    }
    if (!formData.message.trim()) {
      toast("لطفا متن پیام را وارد کنید.", "error");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          content: attachmentUrl ? `${formData.message}\n\n[پیوست](${attachmentUrl})` : formData.message,
          target: formData.target,
          priority: formData.type === "SYSTEM" ? "HIGH" : "MEDIUM",
          isSticky: formData.type === "SYSTEM",
          isLoginPopup: formData.type === "SYSTEM",
        }),
      });

      if (res.ok) {
        toast("اعلان با موفقیت ثبت و به سیستم ارسال شد.", "success");
        setFormData({ title: "", target: "ALL", message: "", type: "INFO" });
        setAttachmentUrl(null);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast(errData.error || "خطا در ثبت اعلان", "error");
      }
    } catch (err: any) {
      toast("خطا در برقراری ارتباط با سرور", "error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-8 space-y-6 animate-fade-in">
      
      <div>
        
        <h2 className="text-2xl font-bold text-primary">
          مدیریت اعلان‌ها
        </h2>
        <p className="text-muted mt-1">
          ارسال پیام گروهی به کاربران سیستم
        </p>
      </div>
      <div className="bg-card p-6 rounded-2xl shadow-sm border border-subtle max-w-3xl">
        
        <form onSubmit={handleSend} className="space-y-6">
          
          <div>
            <label className="block text-sm font-semibold text-secondary mb-3">
              عنوان اعلان
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="مثال: قطعی موقت سرور در بامداد..."
              className="w-full px-4 py-3 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary mb-3">
              مخاطبین هدف
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <label
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${formData.target === "ALL" ? "border-primary-default bg-primary-default/10 text-primary-hover" : "border-subtle hover:bg-background"}`}
              >
                
                <input
                  type="radio"
                  name="target"
                  value="ALL"
                  checked={formData.target === "ALL"}
                  onChange={(e) =>
                    setFormData({ ...formData, target: e.target.value })
                  }
                  className="hidden"
                />
                <Globe className="w-5 h-5" />
                <span className="font-medium">همه کاربران</span>
              </label>
              <label
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${formData.target === "SUPPLIERS" ? "border-primary-default bg-primary-default/10 text-primary-hover" : "border-subtle hover:bg-background"}`}
              >
                
                <input
                  type="radio"
                  name="target"
                  value="SUPPLIERS"
                  checked={formData.target === "SUPPLIERS"}
                  onChange={(e) =>
                    setFormData({ ...formData, target: e.target.value })
                  }
                  className="hidden"
                />
                <Users className="w-5 h-5" />
                <span className="font-medium">تامین‌کنندگان</span>
              </label>
              <label
                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${formData.target === "STORES" ? "border-primary-default bg-primary-default/10 text-primary-hover" : "border-subtle hover:bg-background"}`}
              >
                
                <input
                  type="radio"
                  name="target"
                  value="STORES"
                  checked={formData.target === "STORES"}
                  onChange={(e) =>
                    setFormData({ ...formData, target: e.target.value })
                  }
                  className="hidden"
                />
                <Store className="w-5 h-5" />
                <span className="font-medium">فروشگاه‌ها</span>
              </label>
            </div>
          </div>
          <div>
            
            <label className="block text-sm font-semibold text-secondary mb-3">
              نوع اعلان
            </label>
            <div className="flex gap-4">
              
              <label className="flex items-center gap-2 cursor-pointer">
                
                <input
                  type="radio"
                  name="type"
                  value="INFO"
                  checked={formData.type === "INFO"}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-4 h-4 text-primary-default"
                />
                <span className="text-sm">اطلاع‌رسانی عمومی</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                
                <input
                  type="radio"
                  name="type"
                  value="SYSTEM"
                  checked={formData.type === "SYSTEM"}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-4 h-4 text-primary-default"
                />
                <span className="text-sm">اعلان سیستمی (مهم)</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary mb-2">
              متن پیام
            </label>
            <textarea
              required
              rows={4}
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              placeholder="پیام خود را بنویسید..."
              className="w-full px-4 py-3 bg-background border border-subtle rounded-xl text-sm focus:outline-none focus:border-primary-default"
            ></textarea>

            <div className="mt-3 flex items-center gap-4">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 text-sm text-primary-default bg-primary-default/10 hover:bg-primary-default/20 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                <Paperclip className="w-4 h-4" />
                {uploading ? "در حال آپلود..." : "افزودن فایل / تصویر"}
              </button>
              {attachmentUrl && (
                <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                  <span>فایل پیوست شد</span>
                  <button type="button" onClick={() => setAttachmentUrl(null)} className="hover:text-emerald-800">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-primary-default text-inverse px-6 py-3 rounded-xl font-medium hover:bg-primary-hover transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-5 h-5" />
              {loading ? "در حال ارسال..." : "ارسال اعلان"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
