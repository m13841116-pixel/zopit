import React, { useState, useEffect } from "react";
import { AlertTriangle, Sparkles, X, ChevronLeft, BellRing } from "lucide-react";

export function UrgentNotificationPopup({ userRole }: { userRole?: string }) {
  const [urgentAnnouncement, setUrgentAnnouncement] = useState<any | null>(null);

  useEffect(() => {
    fetch("/api/announcements")
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return [];
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          // Find any high/urgent/sticky active announcement targeted at this user or ALL
          const role = userRole || "GUEST";
          const match = data.find((a: any) => {
            const isTarget = a.target === "ALL" || a.target === role;
            const isUrgent =
              a.priority === "HIGH" ||
              a.priority === "URGENT" ||
              a.isSticky === true;
            if (!isTarget || !isUrgent) return false;

            // Check if dismissed in localStorage
            const dismissedKey = `dismissed_announcement_${a.id}`;
            return !localStorage.getItem(dismissedKey);
          });

          if (match) {
            setUrgentAnnouncement(match);
          }
        }
      })
      .catch(console.error);
  }, [userRole]);

  if (!urgentAnnouncement) return null;

  const handleDismiss = () => {
    localStorage.setItem(
      `dismissed_announcement_${urgentAnnouncement.id}`,
      "true"
    );
    setUrgentAnnouncement(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in"
      dir="rtl"
    >
      <div
        className="bg-card w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border-2 border-danger/40 flex flex-col relative animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Urgent Header */}
        <div className="bg-gradient-to-r from-danger to-red-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner animate-bounce">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-white inline-block mb-1">
                اطلاعیه مهم و فوری
              </span>
              <h3 className="text-base font-black text-white">
                {urgentAnnouncement.title}
              </h3>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          <p className="text-text-secondary text-sm leading-relaxed font-semibold whitespace-pre-wrap">
            {urgentAnnouncement.content}
          </p>

          {urgentAnnouncement.attachmentUrl && (
            <div className="mt-4 pt-4 border-t border-border-subtle">
              <a
                href={urgentAnnouncement.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold text-primary-default hover:underline"
              >
                <Sparkles className="w-4 h-4" /> مشاهده فایل یا لینک پیوست
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border-subtle bg-surface flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-text-muted font-bold">
            <BellRing className="w-4 h-4 text-danger" />
            پیام ارسالی از مدیریت ارشد
          </div>
          <button
            onClick={handleDismiss}
            className="px-6 py-2.5 bg-danger text-white rounded-xl text-xs font-black hover:bg-red-700 transition-all shadow-md shadow-danger/20 flex items-center gap-1 cursor-pointer"
          >
            <span>متوجه شدم</span>
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
