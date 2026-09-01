import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
import { useUrlQueryState } from "../../utils/routeSync";
import {
  BookOpen,
  Plus,
  Trash2,
  Edit,
  Save,
  Eye,
  EyeOff,
  Pin,
  Calendar,
  ChevronUp,
  ChevronDown,
  Sliders,
  BellRing,
  FileText,
  Check,
  X,
  AlertCircle,
  ShieldAlert,
  Star,
  MessageSquare,
  PlusCircle,
} from "lucide-react";
export default function SuperAdminNewFeatures({
  showNotification,
}: {
  showNotification: (msg: string, type: "success" | "error") => void;
}) {
  const [activeSubTab, setActiveSubTab] = useUrlQueryState<
    "info-center" | "login-messages" | "dashboard-messages" | "dynamic-menus"
  >("featureTab", "info-center");
  return (
    <div className="space-y-6">
      
      {/* Sub Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-subtle pb-3">
        
        <button
          onClick={() => setActiveSubTab("info-center")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeSubTab === "info-center" ? "bg-primary-default text-inverse shadow-lg shadow-primary-default/20" : "bg-card text-muted hover:bg-background border border-subtle"}`}
        >
          
          <BookOpen className="w-4 h-4" /> مدیریت مرکز اطلاعات و مقالات
        </button>
        <button
          onClick={() => setActiveSubTab("login-messages")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeSubTab === "login-messages" ? "bg-primary-default text-inverse shadow-lg shadow-primary-default/20" : "bg-card text-muted hover:bg-background border border-subtle"}`}
        >
          
          <Sliders className="w-4 h-4" /> پیام‌های عمومی صفحه ورود
        </button>
        <button
          onClick={() => setActiveSubTab("dashboard-messages")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeSubTab === "dashboard-messages" ? "bg-primary-default text-inverse shadow-lg shadow-primary-default/20" : "bg-card text-muted hover:bg-background border border-subtle"}`}
        >
          
          <BellRing className="w-4 h-4" /> مرکز پیام داشبوردها
        </button>
        <button
          onClick={() => setActiveSubTab("dynamic-menus")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeSubTab === "dynamic-menus" ? "bg-primary-default text-inverse shadow-lg shadow-primary-default/20" : "bg-card text-muted hover:bg-background border border-subtle"}`}
        >
          
          <Sliders className="w-4 h-4" /> مدیریت منوهای پویا
        </button>
      </div>
      {/* Render selected component */}
      {activeSubTab === "info-center" && (
        <InfoCenterManager showNotification={showNotification} />
      )}
      {activeSubTab === "login-messages" && (
        <LoginMessagesManager showNotification={showNotification} />
      )}
      {activeSubTab === "dashboard-messages" && (
        <DashboardMessagesManager showNotification={showNotification} />
      )}
      {activeSubTab === "dynamic-menus" && (
        <DynamicMenusManager showNotification={showNotification} />
      )}
    </div>
  );
}
// =========================================================================

// 1. INFO CENTER MANAGER

// =========================================================================

function InfoCenterManager({
  showNotification,
}: {
  showNotification: (msg: string, type: "success" | "error") => void;
}) {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<any | null>(null);

  // Form states

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("راهنما");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState("");
  const [attachments, setAttachments] = useState("");
  const [videos, setVideos] = useState("");
  const [tags, setTags] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const [author, setAuthor] = useState("مدیریت");
  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/info-pages");
      if (res.ok) {
        const data = await res.json();
        setPages(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchPages();
  }, []);
  const handleOpenCreate = () => {
    setEditingPage(null);
    setTitle("");
    setSlug("");
    setCategory("راهنما");
    setSummary("");
    setContent("");
    setImages("");
    setAttachments("");
    setVideos("");
    setTags("");
    setPublishDate(new Date().toISOString().split("T")[0]);
    setIsPublished(true);
    setIsPinned(false);
    setAuthor("مدیریت");
    setIsModalOpen(true);
  };
  const handleOpenEdit = (page: any) => {
    setEditingPage(page);
    setTitle(page.title);
    setSlug(page.slug);
    setCategory(page.category);
    setSummary(page.summary);
    setContent(page.content);
    setImages(page.images || "");
    setAttachments(page.attachments || "");
    setVideos(page.videos || "");
    setTags(page.tags || "");
    setPublishDate(page.publishDate ? page.publishDate.split("T")[0] : "");
    setIsPublished(page.isPublished);
    setIsPinned(page.isPinned);
    setAuthor(page.author || "مدیریت");
    setIsModalOpen(true);
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      slug: slug || title.toLowerCase().replace(/\s+/g, "-"),
      category,
      summary,
      content,
      images,
      attachments,
      videos,
      tags,
      publishDate: publishDate ? new Date(publishDate) : new Date(),
      isPublished,
      isPinned,
      author,
    };
    try {
      const url = editingPage
        ? `/api/admin/info-pages/${editingPage.id}`
        : "/api/admin/info-pages";
      const method = editingPage ? "PUT" : "POST";
      const res = await fetch(url, { credentials: "include",
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showNotification(
          editingPage
            ? "مقاله با موفقیت بروزرسانی شد"
            : "مقاله جدید با موفقیت ایجاد شد",
          "success",
        );
        setIsModalOpen(false);
        fetchPages();
      } else {
        const err = await res.json();
        showNotification(err.error || "خطا در ذخیره‌سازی مقاله", "error");
      }
    } catch (err) {
      showNotification("خطای شبکه رخ داده است", "error");
    }
  };
  const handleDelete = async (id: number) => {
    if (!await window.customConfirm("آیا از حذف این مقاله اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/admin/info-pages/${id}`, { credentials: "include",
        method: "DELETE",
      });
      if (res.ok) {
        showNotification("مقاله با موفقیت حذف شد", "success");
        fetchPages();
      } else {
        showNotification("خطا در حذف مقاله", "error");
      }
    } catch (e) {
      showNotification("خطای ارتباط با سرور", "error");
    }
  };
  return (
    <div className="bg-card p-6 rounded-3xl border border-subtle/80 shadow-sm space-y-4">
      
      <div className="flex justify-between items-center">
        
        <div>
          
          <h3 className="text-base font-bold text-primary">
            مرکز دانش و اطلاعات
          </h3>
          <p className="text-xs text-muted mt-1">
            تولید محتوای آموزشی، راهنما و اخبار سیستم برای فروشندگان و
            تامین‌کنندگان
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-default hover:bg-primary-hover active:scale-95 text-inverse text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
        >
          
          <Plus className="w-4 h-4" /> افزودن مقاله جدید
        </button>
      </div>
      {loading ? (
        <div className="text-center py-10 text-muted">
          در حال دریافت اطلاعات...
        </div>
      ) : pages.length === 0 ? (
        <div className="text-center py-16 text-muted border-2 border-dashed border-subtle rounded-2xl">
          
          <BookOpen className="w-12 h-12 mx-auto text-inverse mb-3" />
          <p className="text-sm font-bold">
            هیچ مقاله‌ای در سیستم ثبت نشده است
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-subtle">
          
          <table className="w-full text-sm text-right min-w-[800px]">
            
            <thead className="bg-background text-muted text-xs">
              
              <tr>
                
                <th className="py-3.5 px-4 font-bold">عنوان مقاله</th>
                <th className="py-3.5 px-4 font-bold">دسته‌بندی</th>
                <th className="py-3.5 px-4 font-bold">نویسنده</th>
                <th className="py-3.5 px-4 font-bold">وضعیت انتشار</th>
                <th className="py-3.5 px-4 font-bold">پین شده</th>
                <th className="py-3.5 px-4 font-bold">تاریخ انتشار</th>
                <th className="py-3.5 px-4 font-bold text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              
              {pages.map((page) => (
                <tr key={page.id} className="hover:bg-background/50">
                  
                  <td className="py-4 px-4 font-semibold text-primary">
                    
                    <div className="flex items-center gap-2">
                      
                      {page.isPinned && (
                        <Pin className="w-3.5 h-3.5 text-warning fill-amber-500" />
                      )}
                      {page.title}
                    </div>
                    <span className="text-[10px] text-muted block mt-0.5 font-mono">
                      {page.slug}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    
                    <span className="px-2 py-1 bg-surface rounded-lg text-xs font-semibold text-muted">
                      {page.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-muted text-xs">
                    {page.author}
                  </td>
                  <td className="py-4 px-4">
                    
                    {page.isPublished ? (
                      <span className="inline-flex items-center gap-1 text-success text-xs font-bold">
                        
                        <Eye className="w-3.5 h-3.5" /> منتشر شده
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-muted text-xs font-bold">
                        
                        <EyeOff className="w-3.5 h-3.5" /> پیش‌نویس
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    
                    {page.isPinned ? (
                      <span className="text-warning text-xs font-bold">
                        بله
                      </span>
                    ) : (
                      <span className="text-muted text-xs">خیر</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-xs font-mono text-muted">
                    
                    {page.publishDate
                      ? page.publishDate.split("T")[0]
                      : "-"}
                  </td>
                  <td className="py-4 px-4 text-left flex justify-end gap-2">
                    
                    <button
                      onClick={() => handleOpenEdit(page)}
                      className="p-1.5 hover:bg-primary-default/10 hover:text-primary-hover rounded-lg text-muted transition-colors cursor-pointer"
                      title="ویرایش"
                    >
                      
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(page.id)}
                      className="p-1.5 hover:bg-danger/10 hover:text-danger rounded-lg text-muted transition-colors cursor-pointer"
                      title="حذف"
                    >
                      
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/40 backdrop-blur-sm overflow-y-auto">
          
          <div className="bg-card rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-subtle">
            
            <div className="p-6 border-b border-subtle flex justify-between items-center bg-background">
              
              <h3 className="font-bold text-primary text-base">
                
                {editingPage
                  ? "ویرایش مقاله مرکز دانش"
                  : "ایجاد مقاله جدید"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted hover:text-muted cursor-pointer p-1"
              >
                
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={handleSave}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              
              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  
                  <label className="block text-xs font-bold text-secondary">
                    عنوان مقاله
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (!editingPage) {
                        setSlug(
                          e.target.value
                            .toLowerCase()
                            .trim()
                            .replace(/\s+/g, "-"),
                        );
                      }
                    }}
                    className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default"
                    placeholder="مثال: آموزش ثبت کد مرسوله پستی"
                  />
                </div>
                <div className="space-y-1.5 col-span-2 md:col-span-1">
                  
                  <label className="block text-xs font-bold text-secondary">
                    نامک (Slug)
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default font-mono"
                    placeholder="مثال: post-tracking-guide"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                
                <div className="space-y-1.5">
                  
                  <label className="block text-xs font-bold text-secondary">
                    دسته‌بندی
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default"
                  >
                    
                    <option value="راهنما">راهنما و آموزش</option>
                    <option value="قوانین">قوانین و استانداردها</option>
                    <option value="مالی">اطلاعیه‌های مالی</option>
                    <option value="پشتیبانی">راهنمای لجستیک</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  
                  <label className="block text-xs font-bold text-secondary">
                    نویسنده
                  </label>
                  <input
                    type="text"
                    required
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default"
                  />
                </div>
                <div className="space-y-1.5">
                  
                  <label className="block text-xs font-bold text-secondary">
                    تاریخ انتشار (زمان‌بندی)
                  </label>
                  <input
                    type="date"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                
                <label className="block text-xs font-bold text-secondary">
                  خلاصه مقاله (توضیح کوتاه)
                </label>
                <textarea
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default"
                  placeholder="خلاصه‌ای از مقاله که در کارت نمایش داده می‌شود..."
                />
              </div>
              <div className="space-y-1.5">
                
                <label className="block text-xs font-bold text-secondary">
                  محتوای کامل مقاله (ویرایشگر متن)
                </label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default font-mono"
                  placeholder="محتوای متنی کامل مقاله. پشتیبانی از پاراگراف‌ها..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  
                  <label className="block text-xs font-bold text-secondary">
                    آدرس تصویر شاخص (URL)
                  </label>
                  <input
                    type="text"
                    value={images}
                    onChange={(e) => setImages(e.target.value)}
                    className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default font-mono"
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>
                <div className="space-y-1.5">
                  
                  <label className="block text-xs font-bold text-secondary">
                    برچسب‌ها (با کاما جدا کنید)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default"
                    placeholder="پست, رهگیری, راهنمای مالی"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-1.5">
                  
                  <label className="block text-xs font-bold text-secondary">
                    فایل‌های ضمیمه (لینک دانلود)
                  </label>
                  <input
                    type="text"
                    value={attachments}
                    onChange={(e) => setAttachments(e.target.value)}
                    className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default font-mono"
                    placeholder="لینک فایل دانلودی ضمیمه"
                  />
                </div>
                <div className="space-y-1.5">
                  
                  <label className="block text-xs font-bold text-secondary">
                    لینک ویدئو آموزشی
                  </label>
                  <input
                    type="text"
                    value={videos}
                    onChange={(e) => setVideos(e.target.value)}
                    className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-default font-mono"
                    placeholder="https://aparat.com/..."
                  />
                </div>
              </div>
              <div className="flex items-center gap-6 pt-2 bg-background p-4 rounded-xl border border-subtle">
                
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-secondary">
                  
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-4 h-4 text-primary-default border-default rounded focus:ring-primary-default"
                  />
                  انتشار فوری در داشبوردها
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-secondary">
                  
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="w-4 h-4 text-primary-default border-default rounded focus:ring-primary-default"
                  />
                  سنجاق (پین) شدن در بالای لیست
                </label>
              </div>
              <div className="pt-4 border-t border-subtle flex justify-end gap-3 bg-card">
                
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-surface hover:bg-surface text-secondary rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary-default hover:bg-primary-hover text-inverse rounded-xl font-bold text-xs cursor-pointer transition-colors"
                >
                  
                  ذخیره و ثبت مقاله
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
// =========================================================================

// 2. LOGIN MESSAGES MANAGER

// =========================================================================

function LoginMessagesManager({
  showNotification,
}: {
  showNotification: (msg: string, type: "success" | "error") => void;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMsg, setEditingMsg] = useState<any | null>(null);
  const [content, setContent] = useState("");
  const [icon, setIcon] = useState("info");
  const [color, setColor] = useState("indigo");
  const [expiryDate, setExpiryDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/public-messages");
      if (res.ok) setMessages(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMessages();
  }, []);
  const handleOpenCreate = () => {
    setEditingMsg(null);
    setContent("");
    setIcon("info");
    setColor("indigo");
    setExpiryDate("");
    setIsActive(true);
    setIsModalOpen(true);
  };
  const handleOpenEdit = (msg: any) => {
    setEditingMsg(msg);
    setContent(msg.content);
    setIcon(msg.icon);
    setColor(msg.color);
    setExpiryDate(msg.expiryDate ? msg.expiryDate.split("T")[0] : "");
    setIsActive(msg.isActive);
    setIsModalOpen(true);
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      content,
      icon,
      color,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      isActive,
    };
    try {
      const url = editingMsg
        ? `/api/admin/public-messages/${editingMsg.id}`
        : "/api/admin/public-messages";
      const method = editingMsg ? "PUT" : "POST";
      const res = await fetch(url, { credentials: "include",
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showNotification(
          editingMsg ? "پیام عمومی ویرایش شد" : "پیام عمومی ثبت شد",
          "success",
        );
        setIsModalOpen(false);
        fetchMessages();
      } else {
        showNotification("خطا در ثبت پیام", "error");
      }
    } catch (e) {
      showNotification("خطای شبکه", "error");
    }
  };
  const handleDelete = async (id: number) => {
    if (!await window.customConfirm("حذف پیام تایید شود؟")) return;
    try {
      const res = await fetch(`/api/admin/public-messages/${id}`, { credentials: "include",
        method: "DELETE",
      });
      if (res.ok) {
        showNotification("پیام حذف شد", "success");
        fetchMessages();
      }
    } catch (e) {
      showNotification("خطا در حذف", "error");
    }
  };
  return (
    <div className="bg-card p-6 rounded-3xl border border-subtle/80 shadow-sm space-y-4">
      
      <div className="flex justify-between items-center">
        
        <div>
          
          <h3 className="text-base font-bold text-primary">
            پیام‌های عمومی صفحه ورود
          </h3>
          <p className="text-xs text-muted mt-1">
            نمایش پیام‌های مهم، بروزرسانی‌ها و وضعیت موقت سیستم به بازدیدکنندگان
            قبل از ورود
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-default hover:bg-primary-hover active:scale-95 text-inverse text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          
          <Plus className="w-4 h-4" /> ثبت پیام عمومی جدید
        </button>
      </div>
      {loading ? (
        <div className="text-center py-8 text-muted">در حال دریافت...</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 text-muted border-2 border-dashed border-subtle rounded-2xl">
          
          <Sliders className="w-12 h-12 mx-auto text-inverse mb-3" />
          <p className="text-sm">هیچ پیامی ثبت نشده است</p>
        </div>
      ) : (
        <div className="space-y-3">
          
          {messages.map((msg) => (
            <div
              key={msg.id}
              className="p-4 rounded-2xl border border-slate-150 flex items-center justify-between bg-background/50"
            >
              
              <div className="flex items-center gap-3">
                
                <span
                  className={`p-2.5 rounded-xl bg-${msg.color}-50 text-${msg.color}-600`}
                >
                  
                  {msg.icon === "alert" ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : msg.icon === "shield" ? (
                    <ShieldAlert className="w-5 h-5" />
                  ) : msg.icon === "star" ? (
                    <Star className="w-5 h-5" />
                  ) : (
                    <BookOpen className="w-5 h-5" />
                  )}
                </span>
                <div>
                  
                  <p className="text-primary text-sm font-bold leading-relaxed">
                    {msg.content}
                  </p>
                  <div className="flex gap-4 text-[10px] text-muted mt-1">
                    
                    <span>
                      رنگ پوسته:
                      <strong className="text-muted">{msg.color}</strong>
                    </span>
                    {msg.expiryDate && (
                      <span>
                        تاریخ انقضا:
                        <strong className="text-muted font-mono">
                          {msg.expiryDate.split("T")[0]}
                        </strong>
                      </span>
                    )}
                    <span>
                      وضعیت:
                      {msg.isActive ? (
                        <strong className="text-success">فعال</strong>
                      ) : (
                        <strong className="text-danger">غیرفعال</strong>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                
                <button
                  onClick={() => handleOpenEdit(msg)}
                  className="p-2 hover:bg-surface rounded-lg text-muted transition-colors"
                >
                  
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(msg.id)}
                  className="p-2 hover:bg-danger/10 hover:text-danger rounded-lg text-muted hover:text-danger transition-colors"
                >
                  
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/40 backdrop-blur-sm">
          
          <div className="bg-card rounded-[2rem] w-full max-w-md shadow-2xl border border-subtle p-6 space-y-4">
            
            <h3 className="font-bold text-primary text-base">
              {editingMsg ? "ویرایش پیام عمومی" : "پیام عمومی جدید"}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              
              <div className="space-y-1.5">
                
                <label className="block text-xs font-bold text-secondary">
                  متن پیام عمومی
                </label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm focus:ring-2 focus:ring-primary-default focus:outline-none"
                  placeholder="متن پیام جهت نمایش در صفحه اول..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                
                <div className="space-y-1.5">
                  
                  <label className="block text-xs font-bold text-secondary">
                    آیکون
                  </label>
                  <select
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm focus:outline-none"
                  >
                    
                    <option value="info">اطلاعات (Info)</option>
                    <option value="alert">هشدار (Alert)</option>
                    <option value="shield">امنیتی (Shield)</option>
                    <option value="star">ستاره‌دار (Special)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  
                  <label className="block text-xs font-bold text-secondary">
                    رنگ پوسته
                  </label>
                  <select
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm focus:outline-none"
                  >
                    
                    <option value="indigo">آبی نیلی</option>
                    <option value="rose">قرمز گل‌بهی</option>
                    <option value="amber">نارنجی کهربایی</option>
                    <option value="emerald">سبز زمردی</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                
                <label className="block text-xs font-bold text-secondary">
                  تاریخ انقضا (خالی بگذارید برای دائم)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm focus:outline-none font-mono"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-secondary pt-1">
                
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-primary-default rounded"
                />
                وضعیت فعال و قابل نمایش
              </label>
              <div className="flex justify-end gap-2.5 pt-2">
                
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface rounded-xl text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-default hover:bg-primary-hover text-inverse rounded-xl text-xs font-bold"
                >
                  ذخیره
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
// =========================================================================

// 3. DASHBOARD MESSAGES MANAGER

// =========================================================================

function DashboardMessagesManager({
  showNotification,
}: {
  showNotification: (msg: string, type: "success" | "error") => void;
}) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMsg, setEditingMsg] = useState<any | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetRole, setTargetRole] = useState("ALL");
  const [priority, setPriority] = useState("MEDIUM");
  const [expiryDate, setExpiryDate] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [attachments, setAttachments] = useState("");
  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/dashboard-messages");
      if (res.ok) setMessages(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMessages();
  }, []);
  const handleOpenCreate = () => {
    setEditingMsg(null);
    setTitle("");
    setContent("");
    setTargetRole("ALL");
    setPriority("MEDIUM");
    setExpiryDate("");
    setPublishDate(new Date().toISOString().split("T")[0]);
    setAttachments("");
    setIsModalOpen(true);
  };
  const handleOpenEdit = (msg: any) => {
    setEditingMsg(msg);
    setTitle(msg.title);
    setContent(msg.content);
    setTargetRole(msg.targetRole);
    setPriority(msg.priority);
    setExpiryDate(msg.expiryDate ? msg.expiryDate.split("T")[0] : "");
    setPublishDate(msg.publishDate ? msg.publishDate.split("T")[0] : "");
    setAttachments(msg.attachments || "");
    setIsModalOpen(true);
  };
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      title,
      content,
      targetRole,
      priority,
      attachments,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      publishDate: publishDate ? new Date(publishDate) : new Date(),
    };
    try {
      const url = editingMsg
        ? `/api/admin/dashboard-messages/${editingMsg.id}`
        : "/api/admin/dashboard-messages";
      const method = editingMsg ? "PUT" : "POST";
      const res = await fetch(url, { credentials: "include",
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        showNotification("پیام داشبورد ذخیره شد", "success");
        setIsModalOpen(false);
        fetchMessages();
      }
    } catch (e) {
      showNotification("خطا رخ داد", "error");
    }
  };
  const handleDelete = async (id: number) => {
    if (!await window.customConfirm("حذف شود؟")) return;
    try {
      const res = await fetch(`/api/admin/dashboard-messages/${id}`, { credentials: "include",
        method: "DELETE",
      });
      if (res.ok) {
        showNotification("پیام با موفقیت حذف شد", "success");
        fetchMessages();
      }
    } catch (e) {
      console.error(e);
    }
  };
  return (
    <div className="bg-card p-6 rounded-3xl border border-subtle/80 shadow-sm space-y-4">
      
      <div className="flex justify-between items-center">
        
        <div>
          
          <h3 className="text-base font-bold text-primary">
            ارسال پیام مستقیم به پیشخوان نقش‌ها
          </h3>
          <p className="text-xs text-muted mt-1">
            تارگت کردن کاربران با توجه به نقش، اولویت زمانی و سطح اضطراری بودن
            پیام
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-default hover:bg-primary-hover active:scale-95 text-inverse text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          
          <Plus className="w-4 h-4" /> ارسال پیام جدید
        </button>
      </div>
      {loading ? (
        <div className="text-center py-8 text-muted">در حال دریافت...</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 text-muted border-2 border-dashed border-subtle rounded-2xl">
          
          <BellRing className="w-12 h-12 mx-auto text-inverse mb-3" />
          <p className="text-sm">هیچ پیامی ارسال نشده است</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-subtle">
          
          <table className="w-full text-sm text-right min-w-[800px]">
            
            <thead className="bg-background text-muted text-xs">
              
              <tr>
                
                <th className="py-3.5 px-4 font-bold">عنوان پیام</th>
                <th className="py-3.5 px-4 font-bold">مخاطبین هدف</th>
                <th className="py-3.5 px-4 font-bold">اولویت</th>
                <th className="py-3.5 px-4 font-bold">تاریخ ارسال</th>
                <th className="py-3.5 px-4 font-bold">انقضا</th>
                <th className="py-3.5 px-4 font-bold text-left">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              
              {messages.map((msg) => (
                <tr key={msg.id} className="hover:bg-background/50">
                  
                  <td className="py-4 px-4 font-bold text-primary">
                    
                    <div>{msg.title}</div>
                    <span className="text-[10px] text-muted block mt-1 line-clamp-1 max-w-[200px]">
                      {msg.content}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-semibold text-primary-hover">
                    
                    {msg.targetRole === "ALL"
                      ? "همه کاربران"
                      : msg.targetRole === "STORE_MANAGER"
                        ? "فروشگاه‌ها"
                        : msg.targetRole === "SUPPLIER"
                          ? "تامین‌کنندگان"
                          : msg.targetRole === "DEVELOPER"
                            ? "توسعه‌دهندگان"
                            : msg.targetRole}
                  </td>
                  <td className="py-4 px-4">
                    
                    <span
                      className={`px-2 py-1 rounded-md font-bold text-[10px] ${msg.priority === "HIGH" ? "bg-danger/20 text-danger" : msg.priority === "MEDIUM" ? "bg-primary-default/20 text-primary-hover" : "bg-surface text-muted"}`}
                    >
                      
                      {msg.priority === "HIGH"
                        ? "فوری / مهم"
                        : msg.priority === "MEDIUM"
                          ? "متوسط"
                          : "عادی"}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-muted font-mono">
                    {msg.publishDate?.split("T")[0]}
                  </td>
                  <td className="py-4 px-4 text-muted font-mono">
                    {msg.expiryDate?.split("T")[0] || "بدون انقضا"}
                  </td>
                  <td className="py-4 px-4 text-left flex justify-end gap-1.5">
                    
                    <button
                      onClick={() => handleOpenEdit(msg)}
                      className="p-1.5 hover:bg-surface rounded-lg text-muted transition-colors"
                    >
                      
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="p-1.5 hover:bg-danger/10 rounded-lg text-muted hover:text-danger transition-colors"
                    >
                      
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/40 backdrop-blur-sm">
          
          <div className="bg-card rounded-[2rem] w-full max-w-md shadow-2xl border border-subtle p-6 space-y-4">
            
            <h3 className="font-bold text-primary text-base">
              {editingMsg ? "ویرایش پیام هدفمند" : "ارسال پیام جدید به داشبورد"}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              
              <div className="space-y-1.5">
                
                <label className="block text-xs font-bold text-secondary">
                  موضوع / عنوان پیام
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm focus:outline-none"
                  placeholder="مثال: قطعی موقت درگاه پرداخت به دلیل ارتقای فنی"
                />
              </div>
              <div className="space-y-1.5">
                
                <label className="block text-xs font-bold text-secondary">
                  شرح کامل پیام
                </label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm focus:outline-none"
                  placeholder="جزئیات پیام را بنویسید..."
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                
                <div className="space-y-1.5">
                  
                  <label className="block text-xs font-bold text-secondary">
                    مخاطبین هدف (نقش)
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm"
                  >
                    
                    <option value="ALL">همه کاربران</option>
                    <option value="STORE_MANAGER">
                      فروشگاه‌ها (Store Managers)
                    </option>
                    <option value="SUPPLIER">تامین‌کنندگان (Suppliers)</option>
                    <option value="DEVELOPER">توسعه‌دهندگان</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  
                  <label className="block text-xs font-bold text-secondary">
                    سطح اضطرار (اولویت)
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm"
                  >
                    
                    <option value="LOW">عادی (پایین)</option>
                    <option value="MEDIUM">متوسط</option>
                    <option value="HIGH">فوری و مهم (بالا)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                
                <div className="space-y-1.5">
                  
                  <label className="block text-xs font-bold text-secondary">
                    تاریخ انتشار
                  </label>
                  <input
                    type="date"
                    required
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  
                  <label className="block text-xs font-bold text-secondary">
                    تاریخ انقضا
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm font-mono"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                
                <label className="block text-xs font-bold text-secondary">
                  لینک‌های ضمیمه یا راهنما
                </label>
                <input
                  type="text"
                  value={attachments}
                  onChange={(e) => setAttachments(e.target.value)}
                  className="w-full px-4 py-2.5 border border-subtle rounded-xl text-sm font-mono"
                  placeholder="https://example.com/guide.pdf"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2">
                
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-surface rounded-xl text-xs font-bold"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-default text-inverse rounded-xl text-xs font-bold"
                >
                  ارسال پیام
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
// =========================================================================

// 4. DYNAMIC MENUS MANAGER

// =========================================================================

function DynamicMenusManager({
  showNotification,
}: {
  showNotification: (msg: string, type: "success" | "error") => void;
}) {
  const [selectedRole, setSelectedRole] = useState<
    "STORE_MANAGER" | "SUPPLIER" | "SUPER_ADMIN" | "DEVELOPER"
  >("STORE_MANAGER");
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit item substate

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editGroup, setEditGroup] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editHidden, setEditHidden] = useState(false);
  const fetchMenu = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/menus/${selectedRole}`);
      if (res.ok) {
        setMenuItems(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchMenu();
  }, [selectedRole]);
  const handleSaveMenu = async (newItems = menuItems) => {
    try {
      const res = await fetch(`/api/admin/menus/${selectedRole}`, { credentials: "include",
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: newItems }),
      });
      if (res.ok) {
        showNotification("منوی پویای نقش با موفقیت ذخیره شد", "success");
        setEditingIndex(null);
        setMenuItems(await res.json());
      }
    } catch (e) {
      showNotification("خطا در ذخیره‌سازی منو", "error");
    }
  };
  const handleOpenEditItem = (idx: number, item: any) => {
    setEditingIndex(idx);
    setEditLabel(item.label);
    setEditGroup(item.group || "");
    setEditIcon(item.icon || "LayoutDashboard");
    setEditHidden(!!item.hidden);
  };
  const handleSaveItemEdit = () => {
    if (editingIndex === null) return;
    const updated = [...menuItems];
    updated[editingIndex] = {
      ...updated[editingIndex],
      label: editLabel,
      group: editGroup,
      icon: editIcon,
      hidden: editHidden,
    };
    setMenuItems(updated);
    handleSaveMenu(updated);
  };
  const handleMove = (index: number, direction: "up" | "down") => {
    const nextIndex = direction === "up" ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= menuItems.length) return;
    const updated = [...menuItems];
    const temp = updated[index];
    updated[index] = updated[nextIndex];
    updated[nextIndex] = temp;
    setMenuItems(updated);
    handleSaveMenu(updated);
  };
  const handleToggleHide = (index: number) => {
    const updated = [...menuItems];
    updated[index] = { ...updated[index], hidden: !updated[index].hidden };
    setMenuItems(updated);
    handleSaveMenu(updated);
  };
  const handleCreateNewItem = async () => {
    const label = await window.customPrompt("عنوان منوی جدید را وارد کنید:");
    if (!label) return;
    const id = `custom_${Date.now()}`;
    const newItem = {
      id,
      label,
      icon: "Sliders",
      group: "سفارشی",
      hidden: false,
    };
    const updated = [...menuItems, newItem];
    setMenuItems(updated);
    handleSaveMenu(updated);
  };
  return (
    <div className="bg-card p-6 rounded-3xl border border-subtle/80 shadow-sm space-y-4">
      
      <div className="flex justify-between items-center">
        
        <div>
          
          <h3 className="text-base font-bold text-primary">
            مدیریت منوهای پویا
          </h3>
          <p className="text-xs text-muted mt-1">
            شخصی‌سازی، مرتب‌سازی، تغییر آیکون و تغییر عناوین دکمه‌های ناوبری
            برای هر نقش در سیستم به صورت لحظه‌ای
          </p>
        </div>
        <button
          onClick={handleCreateNewItem}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-primary-default hover:bg-primary-hover text-inverse text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          
          <PlusCircle className="w-4 h-4" /> افزودن منوی دلخواه جدید
        </button>
      </div>
      <div className="flex gap-2 bg-background p-1.5 rounded-2xl w-fit border border-subtle">
        
        {[
          { id: "STORE_MANAGER", label: "فروشگاه‌ها (Store)" },
          { id: "SUPPLIER", label: "تامین‌کنندگان (Supplier)" },
          { id: "SUPER_ADMIN", label: "مدیر کل (Super Admin)" },
          { id: "DEVELOPER", label: "توسعه‌دهندگان (Dev)" },
        ].map((role) => (
          <button
            key={role.id}
            onClick={() => setSelectedRole(role.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${selectedRole === role.id ? "bg-card text-primary-hover shadow-sm" : "text-muted hover:text-primary"}`}
          >
            
            {role.label}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="text-center py-8 text-muted">
          در حال لود ساختار منو...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3">
          
          {/* Menu Items List */}
          <div className="space-y-2 border border-subtle p-4 rounded-2xl bg-background/50">
            
            <h4 className="text-xs font-bold text-muted mb-3">
              ساختار چیدمان و ترتیب منوها:
            </h4>
            {menuItems.map((item, idx) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-xl border border-subtle transition-colors ${item.hidden ? "bg-surface/50 opacity-60" : "bg-card"}`}
              >
                
                <div className="flex items-center gap-2.5">
                  
                  <div className="text-muted font-mono text-[10px]">
                    #{idx + 1}
                  </div>
                  <div>
                    
                    <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                      
                      <span>{item.label}</span>
                      {item.group && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-surface text-muted rounded-md font-normal">
                          {item.group}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-muted font-mono block mt-0.5">
                      آیکون: {item.icon} | شناسه: {item.id}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  
                  <button
                    disabled={idx === 0}
                    onClick={() => handleMove(idx, "up")}
                    className="p-1 hover:bg-surface rounded text-muted disabled:opacity-30 cursor-pointer"
                  >
                    
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    disabled={idx === menuItems.length - 1}
                    onClick={() => handleMove(idx, "down")}
                    className="p-1 hover:bg-surface rounded text-muted disabled:opacity-30 cursor-pointer"
                  >
                    
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleHide(idx)}
                    className="p-1 hover:bg-surface rounded text-muted cursor-pointer"
                    title={item.hidden ? "نمایش" : "مخفی کردن"}
                  >
                    
                    {item.hidden ? (
                      <EyeOff className="w-4 h-4 text-danger" />
                    ) : (
                      <Eye className="w-4 h-4 text-success" />
                    )}
                  </button>
                  <button
                    onClick={() => handleOpenEditItem(idx, item)}
                    className="p-1 hover:bg-primary-default/10 hover:text-primary-hover rounded text-muted cursor-pointer"
                  >
                    
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Quick Edit Panel */}
          <div>
            
            {editingIndex !== null ? (
              <div className="p-5 border border-primary-default/20 bg-primary-default/5 rounded-2xl space-y-4">
                
                <div className="flex justify-between items-center border-b border-primary-default/20 pb-2">
                  
                  <h4 className="text-xs font-bold text-primary-hover flex items-center gap-1">
                    
                    <Sliders className="w-4 h-4 text-primary-default" /> ویرایش
                    آیتم منو:
                    <strong className="text-primary-default">
                      {menuItems[editingIndex]?.label}
                    </strong>
                  </h4>
                  <button
                    onClick={() => setEditingIndex(null)}
                    className="text-muted hover:text-muted"
                  >
                    
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-3.5">
                  
                  <div className="space-y-1.5">
                    
                    <label className="block text-xs font-bold text-secondary">
                      عنوان نمایش منو
                    </label>
                    <input
                      type="text"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="w-full px-3 py-2 bg-card border border-subtle rounded-xl text-xs focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    
                    <label className="block text-xs font-bold text-secondary">
                      گروه‌بندی منو
                    </label>
                    <input
                      type="text"
                      value={editGroup}
                      onChange={(e) => setEditGroup(e.target.value)}
                      className="w-full px-3 py-2 bg-card border border-subtle rounded-xl text-xs focus:outline-none"
                      placeholder="مثال: مالی, سیستم, پشتیبانی..."
                    />
                  </div>
                  <div className="space-y-1.5">
                    
                    <label className="block text-xs font-bold text-secondary">
                      کلاس آیکون Lucide
                    </label>
                    <input
                      type="text"
                      value={editIcon}
                      onChange={(e) => setEditIcon(e.target.value)}
                      className="w-full px-3 py-2 bg-card border border-subtle rounded-xl text-xs font-mono focus:outline-none"
                      placeholder="e.g. ShoppingBag, Wallet..."
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-secondary">
                    
                    <input
                      type="checkbox"
                      checked={editHidden}
                      onChange={(e) => setEditHidden(e.target.checked)}
                      className="w-4 h-4 text-primary-default border-default rounded"
                    />
                    مخفی بودن از دید کاربر
                  </label>
                  <button
                    onClick={handleSaveItemEdit}
                    className="w-full py-2.5 bg-primary-default hover:bg-primary-hover text-inverse font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm shadow-primary-default/10 cursor-pointer"
                  >
                    
                    <Save className="w-4 h-4" /> ذخیره و ثبت تغییرات روی کلید
                    منو
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-10 border-2 border-dashed border-subtle rounded-2xl flex flex-col items-center justify-center text-center text-muted h-full">
                
                <Sliders className="w-12 h-12 text-inverse mb-2" />
                <p className="text-xs font-bold">
                  جهت ویرایش جزئیات، روی دکمه ادیت کنار هر منو کلیک کنید
                </p>
                <p className="text-[10px] text-muted mt-1">
                  تغییرات چیدمان و ترتیب منوها به طور آنی در داشبورد کاربران
                  اعمال خواهد شد
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
