import React, { useState, useEffect } from "react";
import { Megaphone, Calendar, X, BellRing, Sparkles, Volume2 } from "lucide-react";

export function PublicAnnouncementsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch("/api/announcements")
        .then((res) => {
          if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return [];
          return res.json();
        })
        .then((data) => {
          if (Array.isArray(data)) {
            setAnnouncements(data);
          } else {
            setAnnouncements([]);
          }
        })
        .catch(() => setAnnouncements([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="bg-card w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-border-subtle flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-default to-indigo-700 p-6 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Megaphone className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">اطلاعیه‌های همگانی پلتفرم</h2>
              <p className="text-xs text-white/80 font-medium mt-0.5">
                جدیدترین اطلاعیه‌ها و اخبار رسمی برای تمامی کاربران
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-text-muted gap-3">
              <div className="w-8 h-8 border-3 border-primary-default border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-bold">در حال دریافت اطلاعیه‌ها...</span>
            </div>
          ) : announcements.length === 0 ? (
            <div className="py-12 text-center text-text-muted space-y-2">
              <Volume2 className="w-12 h-12 mx-auto opacity-30 text-primary-default" />
              <p className="text-base font-bold text-text-secondary">اطلاعیه جدیدی ثبت نشده است</p>
              <p className="text-xs">تمام پیام‌ها و اخبار پلتفرم در این بخش قرار می‌گیرند.</p>
            </div>
          ) : (
            announcements.map((ann) => (
              <div
                key={ann.id}
                onClick={() => setSelectedAnnouncement(ann)}
                className="p-5 rounded-2xl border border-border-subtle bg-surface hover:bg-card hover:border-primary-default/40 transition-all duration-200 cursor-pointer shadow-sm group"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary-default"></span>
                    <h3 className="font-extrabold text-base text-text-primary group-hover:text-primary-default transition-colors">
                      {ann.title}
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2.5 py-1 bg-primary-default/10 text-primary-default rounded-full flex items-center gap-1 shrink-0">
                    <Calendar className="w-3 h-3" />
                    {new Date(ann.createdAt || Date.now()).toLocaleDateString("fa-IR")}
                  </span>
                </div>
                <p className="text-sm text-text-secondary leading-relaxed line-clamp-2 font-medium">
                  {ann.content}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle bg-surface/50 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-card hover:bg-surface text-text-primary border border-border-subtle rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            بستن
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedAnnouncement && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            className="bg-card w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-6 text-right border border-border-subtle"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start border-b border-border-subtle pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-default/10 text-primary-default rounded-2xl">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-text-primary">
                    {selectedAnnouncement.title}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {new Date(selectedAnnouncement.createdAt || Date.now()).toLocaleDateString("fa-IR")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="p-2 text-text-muted hover:text-text-primary hover:bg-surface rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto pl-2 space-y-4">
              {selectedAnnouncement.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-border-subtle shadow-sm">
                  <img
                    src={selectedAnnouncement.imageUrl}
                    alt={selectedAnnouncement.title}
                    className="w-full h-auto max-h-72 object-cover"
                  />
                </div>
              )}
              <div className="text-text-secondary text-sm leading-relaxed font-medium whitespace-pre-wrap">
                {selectedAnnouncement.content}
              </div>
              {selectedAnnouncement.attachmentUrl && (
                <div className="pt-3 border-t border-border-subtle">
                  <a
                    href={selectedAnnouncement.attachmentUrl}
                    download={`announcement-${selectedAnnouncement.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-default/10 hover:bg-primary-default/20 text-primary-default rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    📎 دریافت فایل پیوست اطلاعیه
                  </a>
                </div>
              )}
            </div>
            <div className="mt-6 text-left">
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="px-5 py-2 bg-primary-default text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors"
              >
                متوجه شدم
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
