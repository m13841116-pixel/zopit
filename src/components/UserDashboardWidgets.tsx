import React, { useState, useEffect } from "react";
import {
  Megaphone,
  BookOpen,
  AlertCircle,
  Search,
  ExternalLink,
  ArrowLeft,
  Download,
  Video,
  Calendar,
  User,
  Tag,
  ChevronDown,
  ChevronUp,
  Clock,
  X,
} from "lucide-react";
interface WidgetProps {
  role: "STORE_MANAGER" | "SUPPLIER";
}
export default function UserDashboardWidgets({ role }: WidgetProps) {
  const [activeTab, setActiveTab] = useState<"announcements" | "knowledge">(
    "announcements",
  );
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [infoPages, setInfoPages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);
  const [expandedMessageId, setExpandedMessageId] = useState<
    number | string | null
  >(null);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // 1. Fetch announcements and targeted dashboard messages
        const [annRes, msgRes, infoRes] = await Promise.all([
          fetch("/api/announcements"),
          fetch("/api/dashboard-messages"),
          fetch("/api/info-pages"),
        ]);
        let mergedAnnouncements: any[] = [];
        if (annRes.ok && annRes.headers.get("content-type")?.includes("application/json")) {
          const annData = await annRes.json();
          if (Array.isArray(annData)) {
            // Filter announcements by target role
            const filteredAnn = annData.filter(
              (a: any) =>
                a.target === "ALL" ||
                (role === "STORE_MANAGER" && a.target === "STORE") ||
                (role === "SUPPLIER" && a.target === "SUPPLIER"),
            );
            mergedAnnouncements = [
              ...mergedAnnouncements,
              ...filteredAnn.map((a: any) => ({
                id: `ann-${a.id}`,
                title: a.title,
                content: a.content,
                priority: a.priority || "MEDIUM",
                isSticky: !!a.isSticky,
                createdAt: a.createdAt,
                type: "ANNOUNCEMENT",
              })),
            ];
          }
        }
        if (msgRes.ok && msgRes.headers.get("content-type")?.includes("application/json")) {
          const msgData = await msgRes.json();
          if (Array.isArray(msgData)) {
            // Filter targeted dashboard messages by role
            const filteredMsg = msgData.filter(
              (m: any) =>
                m.targetRole === "ALL" ||
                (role === "STORE_MANAGER" && m.targetRole === "STORE_MANAGER") ||
                (role === "SUPPLIER" && m.targetRole === "SUPPLIER"),
            );
            mergedAnnouncements = [
              ...mergedAnnouncements,
              ...filteredMsg.map((m: any) => ({
                id: m.id,
                title: m.title,
                content: m.content,
                priority: m.priority || "MEDIUM",
                isSticky: false,
                expiryDate: m.expiryDate,
                attachments: m.attachments,
                createdAt: m.createdAt,
                type: "MESSAGE",
              })),
            ];
          }
        }
        // Sort: Sticky first, then HIGH priority, then by date desc
        mergedAnnouncements.sort((a, b) => {
          if (a.isSticky && !b.isSticky) return -1;
          if (!a.isSticky && b.isSticky) return 1;
          if (a.priority === "HIGH" && b.priority !== "HIGH") return -1;
          if (a.priority !== "HIGH" && b.priority === "HIGH") return 1;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
        setAnnouncements(mergedAnnouncements);
        if (infoRes.ok && infoRes.headers.get("content-type")?.includes("application/json")) {
          const pagesData = await infoRes.json();
          if (Array.isArray(pagesData)) setInfoPages(pagesData);
        }
      } catch (err) {
        console.error("Error fetching widget data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [role]);
  const filteredPages = infoPages.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tags && p.tags.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  return (
    <div className="bg-card rounded-3xl border border-subtle shadow-sm overflow-hidden flex flex-col h-[520px]">
      
      {/* Widget Tabs Header */}
      <div className="flex bg-background border-b border-subtle p-2 gap-1.5">
        
        <button
          onClick={() => setActiveTab("announcements")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "announcements" ? "bg-card text-primary-hover shadow-sm border border-subtle/50" : "text-muted hover:bg-surface/70 hover:text-primary"}`}
        >
          
          <Megaphone className="w-4 h-4 text-primary-default" /> مرکز پیام و
          اطلاعیه‌ها
          {announcements.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-danger text-inverse text-[10px] flex items-center justify-center font-bold font-mono">
              
              {announcements.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("knowledge")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "knowledge" ? "bg-card text-primary-hover shadow-sm border border-subtle/50" : "text-muted hover:bg-surface/70 hover:text-primary"}`}
        >
          
          <BookOpen className="w-4 h-4 text-primary-default" /> مرکز اطلاعات و
          راهنما
        </button>
      </div>
      {/* Widget Content Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-5">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted space-y-2">
            
            <div className="w-8 h-8 border-4 border-primary-default border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs">در حال دریافت جدیدترین اطلاعیه‌ها...</p>
          </div>
        ) : activeTab === "announcements" ? (
          // =======================================

          // ANNOUNCEMENTS & MESSAGES TAB

          // =======================================
          announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted text-center p-6 space-y-3">
              
              <Megaphone className="w-10 h-10 text-inverse" />
              <p className="text-xs font-bold">هیچ اطلاعیه جدیدی یافت نشد</p>
              <p className="text-[10px]">
                اعلانات و اطلاعیه‌های همگانی سیستم در این بخش به نمایش در
                می‌آیند.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              
              {announcements.map((ann) => {
                const isExpanded = expandedMessageId === ann.id;
                return (
                  <div
                    key={ann.id}
                    className={`rounded-2xl border transition-all ${ann.priority === "HIGH" ? "bg-danger/10/40 border-rose-100" : ann.isSticky ? "bg-warning/10/30 border-amber-100" : "bg-background/50 border-subtle"}`}
                  >
                    
                    <div
                      onClick={() =>
                        setExpandedMessageId(isExpanded ? null : ann.id)
                      }
                      className="p-4 flex items-start gap-3 cursor-pointer select-none"
                    >
                      
                      <span
                        className={`p-2 rounded-xl shrink-0 ${ann.priority === "HIGH" ? "bg-danger/20 text-danger" : ann.isSticky ? "bg-warning/20 text-warning" : "bg-primary-default/10 text-primary-default"}`}
                      >
                        
                        <AlertCircle className="w-4 h-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        
                        <div className="flex items-center gap-1.5">
                          
                          {ann.isSticky && (
                            <span className="px-1.5 py-0.5 bg-warning/20 text-amber-800 rounded text-[9px] font-bold">
                              سنجاق شده
                            </span>
                          )}
                          {ann.priority === "HIGH" && (
                            <span className="px-1.5 py-0.5 bg-danger/20 text-rose-800 rounded text-[9px] font-bold animate-pulse">
                              مهم و فوری
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 bg-surface text-muted rounded text-[9px] font-mono">
                            
                            {ann.type === "ANNOUNCEMENT"
                              ? "اطلاعیه عمومی"
                              : "پیام اداری"}
                          </span>
                        </div>
                        <h4 className="font-bold text-primary text-xs mt-1.5 leading-relaxed">
                          {ann.title}
                        </h4>
                      </div>
                      <div className="shrink-0 text-muted mt-1">
                        
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-dashed border-subtle text-xs text-muted leading-relaxed space-y-3">
                        
                        <p className="whitespace-pre-wrap">
                          {ann.content}
                        </p>
                        {ann.attachments && (
                          <div className="pt-2">
                            
                            <a
                              href={ann.attachments}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-default hover:text-primary-hover bg-primary-default/10 px-2.5 py-1 rounded-lg"
                            >
                              
                              <Download className="w-3.5 h-3.5" /> دانلود فایل
                              ضمیمه شده
                            </a>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 text-[10px] text-muted">
                          
                          <span className="flex items-center gap-1">
                            
                            <Clock className="w-3.5 h-3.5" /> تاریخ ثبت:
                            {new Date(ann.createdAt).toLocaleDateString(
                              "fa-IR",
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        ) : (
          // =======================================

          // KNOWLEDGE CENTER (INFO PAGES) TAB

          // =======================================
          <div className="space-y-4">
            
            {/* Search Bar */}
            <div className="relative">
              
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی مقاله، آموزش یا قوانین سیستم..."
                className="w-full pr-10 pl-4 py-2 bg-background border border-subtle rounded-xl text-xs focus:ring-2 focus:ring-primary-default focus:outline-none"
              />
            </div>
            {filteredPages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted text-center space-y-2">
                
                <Search className="w-8 h-8 text-inverse" />
                <p className="text-xs">
                  نتیجه‌ای برای جستجوی شما یافت نشد
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                
                {filteredPages.map((page) => (
                  <div
                    key={page.id}
                    onClick={() => setSelectedArticle(page)}
                    className="p-4 rounded-2xl border border-subtle hover:border-primary-default/30 bg-card hover:bg-primary-default/10/10 hover:shadow-sm transition-all cursor-pointer flex justify-between items-center"
                  >
                    
                    <div className="space-y-1.5 min-w-0 flex-1 pl-3">
                      
                      <div className="flex items-center gap-1.5 flex-wrap">
                        
                        <span className="px-2 py-0.5 bg-surface rounded text-[9px] font-bold text-muted">
                          {page.category}
                        </span>
                        {page.isPinned && (
                          <span className="px-1.5 py-0.5 bg-warning/20 text-amber-800 rounded text-[9px] font-bold">
                            مهم
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-primary text-xs truncate leading-relaxed">
                        {page.title}
                      </h4>
                      <p className="text-[10px] text-muted line-clamp-1 leading-normal">
                        {page.summary}
                      </p>
                    </div>
                    <span className="p-1.5 bg-background rounded-lg text-muted hover:text-primary-hover transition-colors shrink-0">
                      
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {/* ARTICLE READER MODAL */}
      {selectedArticle && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-background/40 backdrop-blur-sm">
          
          <div
            className="bg-card rounded-[2rem] w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-subtle animate-fade-in"
            dir="rtl"
          >
            
            {/* Modal Header */}
            <div className="p-6 border-b border-subtle bg-background flex justify-between items-start">
              
              <div>
                
                <span className="px-2.5 py-0.5 bg-primary-default/20 text-primary-hover rounded-lg text-[10px] font-bold">
                  {selectedArticle.category}
                </span>
                <h3 className="font-black text-primary text-base mt-2 leading-relaxed">
                  {selectedArticle.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1 text-muted hover:text-muted hover:bg-surface/50 rounded-lg transition-colors cursor-pointer"
              >
                
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-muted text-xs leading-relaxed">
              
              {/* Optional Hero Banner */}
              {selectedArticle.images && (
                <img
                  src={selectedArticle.images}
                  alt={selectedArticle.title}
                  className="w-full h-40 object-cover rounded-2xl border border-subtle"
                  referrerPolicy="no-referrer"
                />
              )}
              {/* Summary box */}
              <div className="p-3.5 bg-background rounded-2xl border-r-4 border-default text-secondary font-medium">
                
                {selectedArticle.summary}
              </div>
              {/* Core Content */}
              <div className="space-y-3 whitespace-pre-line text-primary leading-relaxed font-normal">
                
                {selectedArticle.content}
              </div>
              {/* Media links or Attachments */}
              {(selectedArticle.attachments || selectedArticle.videos) && (
                <div className="p-4 bg-primary-default/10/30 border border-primary-default/20 rounded-2xl space-y-3">
                  
                  <h5 className="font-bold text-primary-hover text-[11px]">
                    فایل‌ها و رسانه‌های ضمیمه:
                  </h5>
                  <div className="flex flex-col gap-2">
                    
                    {selectedArticle.attachments && (
                      <a
                        href={selectedArticle.attachments}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary-hover hover:text-primary-hover font-bold text-[11px] p-2 bg-card rounded-xl border border-primary-default/20"
                      >
                        
                        <Download className="w-4 h-4 shrink-0" /> دریافت سند
                        ضمیمه شده مقاله
                      </a>
                    )}
                    {selectedArticle.videos && (
                      <a
                        href={selectedArticle.videos}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-teal-700 hover:text-teal-900 font-bold text-[11px] p-2 bg-card rounded-xl border border-teal-100/50"
                      >
                        
                        <Video className="w-4 h-4 shrink-0" /> مشاهده ویدیو
                        آموزشی ضمیمه
                      </a>
                    )}
                  </div>
                </div>
              )}
              {/* Tags */}
              {selectedArticle.tags && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  
                  {selectedArticle.tags
                    .split(",")
                    .map((tag: string, i: number) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-surface text-muted rounded-lg text-[10px] font-medium"
                      >
                        
                        <Tag className="w-3 h-3" /> {tag.trim()}
                      </span>
                    ))}
                </div>
              )}
            </div>
            {/* Modal Footer Meta */}
            <div className="p-4 border-t border-subtle bg-background flex justify-between items-center text-[10px] text-muted">
              
              <span className="flex items-center gap-1">
                
                <User className="w-3.5 h-3.5" /> نویسنده:
                {selectedArticle.author || "مدیریت"}
              </span>
              <span className="flex items-center gap-1 font-mono">
                
                <Calendar className="w-3.5 h-3.5" /> آخرین بروزرسانی:
                {new Date(selectedArticle.updatedAt).toLocaleDateString(
                  "fa-IR",
                )}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
