import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
import {
  Megaphone,
  Trash2,
  Edit,
  Plus,
  X,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Download,
} from "lucide-react";

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [target, setTarget] = useState("ALL");
  const [isLoginPopup, setIsLoginPopup] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTarget, setEditTarget] = useState("ALL");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editIsLoginPopup, setEditIsLoginPopup] = useState(false);
  const [editIsSticky, setEditIsSticky] = useState(false);
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editAttachmentUrl, setEditAttachmentUrl] = useState("");
  const [editAttachmentName, setEditAttachmentName] = useState("");

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements?all=true");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAnnouncements(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // Helper to convert file to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size limit check (e.g., 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast("حجم فایل نباید بیشتر از ۵ مگابایت باشد.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (isEdit) {
        if (isImage) {
          setEditImageUrl(result);
        } else {
          setEditAttachmentUrl(result);
          setEditAttachmentName(file.name);
        }
      } else {
        if (isImage) {
          setImageUrl(result);
        } else {
          setAttachmentUrl(result);
          setAttachmentName(file.name);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/announcements", {
        credentials: "include",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          target,
          isLoginPopup,
          isSticky,
          imageUrl,
          attachmentUrl,
        }),
      });
      if (res.ok) {
        setTitle("");
        setContent("");
        setTarget("ALL");
        setIsLoginPopup(false);
        setIsSticky(false);
        setImageUrl("");
        setAttachmentUrl("");
        setAttachmentName("");
        toast("اطلاعیه جدید با موفقیت منتشر شد.", "success");
        fetchAnnouncements();
      } else {
        toast("خطا در انتشار اطلاعیه", "error");
      }
    } catch (e) {
      console.error(e);
      toast("خطای شبکه", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleEditInit = (ann: any) => {
    setEditingId(ann.id);
    setEditTitle(ann.title);
    setEditContent(ann.content);
    setEditTarget(ann.target);
    setEditIsActive(ann.isActive);
    setEditIsLoginPopup(ann.isLoginPopup);
    setEditIsSticky(ann.isSticky);
    setEditImageUrl(ann.imageUrl || "");
    setEditAttachmentUrl(ann.attachmentUrl || "");
    setEditAttachmentName(ann.attachmentUrl ? "فایل پیوست شده" : "");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/announcements/${editingId}`, {
        credentials: "include",
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          target: editTarget,
          isActive: editIsActive,
          isLoginPopup: editIsLoginPopup,
          isSticky: editIsSticky,
          imageUrl: editImageUrl,
          attachmentUrl: editAttachmentUrl,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        toast("اطلاعیه با موفقیت ویرایش شد.", "success");
        fetchAnnouncements();
      } else {
        toast("خطا در ویرایش اطلاعیه", "error");
      }
    } catch (e) {
      console.error(e);
      toast("خطای شبکه", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await window.customConfirm("آیا از حذف این اطلاعیه اطمینان دارید؟"))) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        credentials: "include",
        method: "DELETE",
      });
      if (res.ok) {
        toast("اطلاعیه حذف گردید.", "success");
        fetchAnnouncements();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/announcements/${id}`, {
        credentials: "include",
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      fetchAnnouncements();
    } catch (e) {
      console.error(e);
    }
  };

  const getTargetLabel = (tgt: string) => {
    switch (tgt) {
      case "ALL":
        return "همه کاربران";
      case "STORE_MANAGER":
        return "مدیران فروشگاه";
      case "SUPPLIER":
        return "تامین‌کنندگان";
      default:
        return tgt;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in text-slate-800" dir="rtl">
      {/* Create Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Megaphone className="w-5 h-5 text-purple-600" /> ثبت پیام / اطلاع‌رسانی جدید
        </h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                عنوان پیام / اطلاعیه <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all outline-none font-medium"
                placeholder="مثال: به‌روزرسانی سیستم پرداخت و قوانین تسویه"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                مخاطبین هدف
              </label>
              <select
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all outline-none font-medium"
              >
                <option value="ALL">همه (صفحه ورود + پنل‌ها)</option>
                <option value="STORE_MANAGER">مدیران فروشگاه</option>
                <option value="SUPPLIER">تامین‌کنندگان</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              متن پیام <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all outline-none font-medium leading-relaxed"
              placeholder="متن کامل اطلاعیه یا راهنمای جدید را وارد کنید..."
            />
          </div>

          {/* Attachments & File Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
            {/* Image Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-purple-600" /> افزودن تصویر اطلاعیه
              </label>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer bg-white border border-slate-200 hover:border-purple-500 text-slate-700 hover:text-purple-700 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm">
                  <ImageIcon className="w-4 h-4" /> انتخاب عکس
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, true)}
                    className="hidden"
                  />
                </label>
                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="text-xs text-rose-600 hover:underline font-bold"
                  >
                    حذف تصویر
                  </button>
                )}
              </div>
              {imageUrl && (
                <div className="mt-2.5 relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                  <img referrerPolicy="no-referrer" src={imageUrl} alt="پیش‌نمایش" className="w-full h-full object-cover" />
                </div>
              )}
            </div>

            {/* Document / File Upload */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-purple-600" /> افزودن فایل پیوست (PDF, Doc, Zip)
              </label>
              <div className="flex items-center gap-2">
                <label className="cursor-pointer bg-white border border-slate-200 hover:border-purple-500 text-slate-700 hover:text-purple-700 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm">
                  <Paperclip className="w-4 h-4" /> انتخاب فایل
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.zip,.rar,.png,.jpg,.jpeg"
                    onChange={(e) => handleFileUpload(e, false)}
                    className="hidden"
                  />
                </label>
                {attachmentUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentUrl("");
                      setAttachmentName("");
                    }}
                    className="text-xs text-rose-600 hover:underline font-bold"
                  >
                    حذف فایل
                  </button>
                )}
              </div>
              {attachmentUrl && (
                <div className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200/80 inline-flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{attachmentName || "فایل آماده پیوست"}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={isLoginPopup}
                onChange={(e) => setIsLoginPopup(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              نمایش به صورت پاپ‌آپ در صفحه لاگین
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-700">
              <input
                type="checkbox"
                checked={isSticky}
                onChange={(e) => setIsSticky(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              سنجاق شده (مهم)
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-purple-600/20 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> {loading ? "در حال ارسال..." : "ثبت و انتشار اطلاعیه"}
            </button>
          </div>
        </form>
      </div>

      {/* List Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          لیست اطلاعیه‌ها و پیام‌های منتشر شده
        </h3>
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <AlertCircle className="w-10 h-10 text-slate-300 mb-2 animate-pulse" />
            <p className="text-sm font-medium">هیچ اطلاعیه‌ای ثبت نشده است</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                className={`p-5 rounded-2xl border transition-all ${
                  ann.isActive
                    ? "border-purple-200 bg-purple-50/20 shadow-sm"
                    : "border-slate-200 bg-slate-50/50 opacity-70"
                }`}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                      {ann.title}
                      {ann.isSticky && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                          📌 سنجاق شده
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                        مخاطب: {getTargetLabel(ann.target)}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          ann.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {ann.isActive ? "فعال" : "غیرفعال"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => toggleStatus(ann.id, ann.isActive)}
                      className={`p-2 rounded-xl transition-all ${
                        ann.isActive
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                          : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                      }`}
                      title={ann.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}
                    >
                      {ann.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEditInit(ann)}
                      className="p-2 bg-purple-100 text-purple-700 hover:bg-purple-200 rounded-xl transition-all"
                      title="ویرایش"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="p-2 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-xl transition-all"
                      title="حذف کامل"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed mb-3">
                  {ann.content}
                </p>

                {/* Attachments preview in List */}
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                  {ann.imageUrl && (
                    <div className="relative group">
                      <img referrerPolicy="no-referrer"
                        src={ann.imageUrl}
                        alt="تصویر اطلاعیه"
                        className="w-20 h-20 object-cover rounded-xl border border-slate-200 shadow-sm"
                      />
                    </div>
                  )}

                  {ann.attachmentUrl && (
                    <a
                      href={ann.attachmentUrl}
                      download={`announcement-attachment-${ann.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200/80 rounded-xl text-xs font-bold transition shadow-sm"
                    >
                      <Download className="w-4 h-4 text-purple-600" />
                      <span>دانلود فایل پیوست اطلاعیه</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in">
          <div
            className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100"
            dir="rtl"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-purple-600" /> ویرایش اطلاعیه / صفحه راهنما
              </h3>
              <button
                onClick={() => setEditingId(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    عنوان پیام
                  </label>
                  <input
                    required
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مخاطبین هدف
                  </label>
                  <select
                    value={editTarget}
                    onChange={(e) => setEditTarget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all outline-none font-medium"
                  >
                    <option value="ALL">همه (صفحه ورود + پنل‌ها)</option>
                    <option value="STORE_MANAGER">مدیران فروشگاه</option>
                    <option value="SUPPLIER">تامین‌کنندگان</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  متن پیام
                </label>
                <textarea
                  required
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={5}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all outline-none font-medium leading-relaxed"
                />
              </div>

              {/* Edit Attachments */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/70">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-purple-600" /> تغییر تصویر اطلاعیه
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer bg-white border border-slate-200 hover:border-purple-500 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                      <ImageIcon className="w-4 h-4" /> فایل جدید
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, true, true)}
                        className="hidden"
                      />
                    </label>
                    {editImageUrl && (
                      <button
                        type="button"
                        onClick={() => setEditImageUrl("")}
                        className="text-xs text-rose-600 font-bold hover:underline"
                      >
                        حذف تصویر
                      </button>
                    )}
                  </div>
                  {editImageUrl && (
                    <img referrerPolicy="no-referrer"
                      src={editImageUrl}
                      alt="پیش‌نمایش"
                      className="mt-2 w-20 h-20 object-cover rounded-xl border border-slate-200"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-purple-600" /> تغییر فایل پیوست
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer bg-white border border-slate-200 hover:border-purple-500 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm">
                      <Paperclip className="w-4 h-4" /> فایل جدید
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.zip,.rar,.png,.jpg,.jpeg"
                        onChange={(e) => handleFileUpload(e, false, true)}
                        className="hidden"
                      />
                    </label>
                    {editAttachmentUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditAttachmentUrl("");
                          setEditAttachmentName("");
                        }}
                        className="text-xs text-rose-600 font-bold hover:underline"
                      >
                        حذف فایل
                      </button>
                    )}
                  </div>
                  {editAttachmentUrl && (
                    <div className="mt-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block">
                      فایل پیوست آماده ذخیره
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editIsActive}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500 cursor-pointer"
                />
                <label
                  htmlFor="editIsActive"
                  className="text-sm text-slate-800 font-bold cursor-pointer select-none"
                >
                  این اطلاعیه به صورت فعال نمایش داده شود.
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-sm font-bold transition-all cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-purple-600/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" /> ذخیره تغییرات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

