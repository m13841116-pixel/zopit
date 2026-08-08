import React, { useState, useEffect } from "react";
import {
  Megaphone,
  X,
  Calendar,
  ArrowLeftRight,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
interface InfoPage {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: string;
  isPinned: boolean;
  publishDate: string;
  tags?: string;
  images?: string;
}
export default function LatestAnnouncementsWidget() {
  const [pages, setPages] = useState<InfoPage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  useEffect(() => {
    // Load dismissed IDs from local storage
    try {
      const stored = localStorage.getItem("dismissed_announcements");
      if (stored) {
        setDismissedIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load dismissed announcements:", e);
    }
    // Fetch latest info pages (which act as recent announcements)
    fetch("/api/info-pages")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          // Take latest 5 informational pages
          setPages(data.slice(0, 5));
        } else {
          setPages([]);
        }
      })
      .catch((err) => console.error("Error fetching latest info pages:", err))
      .finally(() => setLoading(false));
  }, []);
  const dismissPage = (id: number) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    try {
      localStorage.setItem("dismissed_announcements", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save dismissed announcements:", e);
    }
    // Adjust currentIndex if necessary
    if (currentIndex >= visiblePages.length - 1 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  const visiblePages = pages.filter((page) => !dismissedIds.includes(page.id));
  if (loading) {
    return (
      <div className="w-full bg-primary-default/10/50 border border-primary-default/20/60 rounded-3xl p-5 flex items-center justify-center animate-pulse min-h-[100px] mb-6">
        
        <div className="flex items-center gap-3">
          
          <div className="w-5 h-5 border-2 border-primary-default border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-muted">
            در حال بارگذاری آخرین اخبار و اطلاعیه‌های مهم...
          </span>
        </div>
      </div>
    );
  }
  if (visiblePages.length === 0) return null;
  const activePage = visiblePages[currentIndex];
  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % visiblePages.length);
  };
  const handlePrev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + visiblePages.length) % visiblePages.length,
    );
  };
  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" || e.key === "") {
      e.preventDefault();
      action();
    }
  };
  return (
    <div
      className="w-full relative overflow-hidden bg-gradient-to-r from-primary-default/5 via-secondary/5 to-accent/5 dark:from-primary-default/10 dark:via-secondary/10 dark:to-accent/5 border-2 border-primary-default/20 rounded-3xl p-5 md:p-6 shadow-md transition-all duration-300 hover:shadow-lg mb-6 text-right"
      role="region"
      aria-label="آخرین اطلاعیه‌ها و راهنماهای سیستم"
    >
      
      {/* Decorative Top Line */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-default via-secondary to-accent"></div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Main Content Area */}
        <div className="flex items-start gap-4 flex-1">
          
          <div className="p-3 bg-primary-default text-inverse rounded-2xl shadow-md shrink-0 animate-bounce-short">
            
            <Megaphone className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 min-w-0 flex-1">
            
            <div className="flex items-center gap-2 flex-wrap">
              
              <span className="px-2.5 py-0.5 bg-primary-default/10 text-primary-hover rounded-full text-[10px] font-extrabold tracking-wide uppercase">
                
                {activePage.category || "اطلاعیه"}
              </span>
              {activePage.isPinned && (
                <span className="px-2 py-0.5 bg-warning/15 text-warning rounded-full text-[10px] font-extrabold flex items-center gap-1">
                  
                  <CheckCircle2 className="w-3 h-3" /> سنجاق شده
                </span>
              )}
              <span className="text-[10px] text-muted font-medium flex items-center gap-1 font-mono">
                
                <Calendar className="w-3 h-3" />
                {new Date(activePage.publishDate).toLocaleDateString(
                  "fa-IR",
                )}
              </span>
            </div>
            <h3 className="text-sm md:text-base font-black text-primary leading-snug truncate">
              
              {activePage.title}
            </h3>
            <p className="text-xs text-muted font-medium leading-relaxed line-clamp-2 md:line-clamp-1">
              
              {activePage.summary}
            </p>
          </div>
        </div>
        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          
          {/* Slider Pagination Indicators */}
          {visiblePages.length > 1 && (
            <div
              className="flex items-center gap-1.5 ml-2"
              role="group"
              aria-label="صفحه‌بندی اطلاعیه‌ها"
            >
              
              <button
                onClick={handlePrev}
                onKeyDown={(e) => handleKeyDown(e, handlePrev)}
                className="w-8 h-8 rounded-xl bg-card hover:bg-surface text-muted flex items-center justify-center border border-subtle/60 transition-all cursor-pointer"
                aria-label="اطلاعیه قبلی"
              >
                
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-bold text-muted px-1 font-mono">
                
                {currentIndex + 1} از {visiblePages.length}
              </span>
              <button
                onClick={handleNext}
                onKeyDown={(e) => handleKeyDown(e, handleNext)}
                className="w-8 h-8 rounded-xl bg-card hover:bg-surface text-muted flex items-center justify-center border border-subtle/60 transition-all cursor-pointer"
                aria-label="اطلاعیه بعدی"
              >
                
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
          {/* Dismiss Button */}
          <button
            onClick={() => dismissPage(activePage.id)}
            onKeyDown={(e) =>
              handleKeyDown(e, () => dismissPage(activePage.id))
            }
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-danger/10 hover:bg-danger/20 text-danger text-xs font-bold transition-all border border-rose-100/50 cursor-pointer"
            aria-label={`بستن و عدم نمایش اطلاعیه: ${activePage.title}`}
          >
            
            <X className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
            <span>متوجه شدم</span>
          </button>
        </div>
      </div>
    </div>
  );
}
