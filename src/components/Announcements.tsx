import React, { useState, useEffect } from "react";
import { Megaphone, Calendar, X } from "lucide-react";

export default function Announcements({ role }: { role: string }) {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<any>(null);

  useEffect(() => {
    fetch("/api/announcements")
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return [];
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          const filtered = data.filter(
            (a: any) => a.target === "ALL" || a.target === role,
          );
          setAnnouncements(filtered);
        } else {
          setAnnouncements([]);
        }
      })
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  }, [role]);

  if (loading)
    return (
      <div className="text-xs text-muted animate-pulse text-center py-2">
        در حال دریافت اطلاعیه‌ها...
      </div>
    );

  if (announcements.length === 0) return null;

  return (
    <>
      <div className="space-y-4 mb-6 text-right w-full">
        {announcements.map((ann, idx) => (
          <div
            key={ann.id}
            onClick={() => setSelectedAnnouncement(ann)}
            className="relative overflow-hidden w-full bg-card border-2 border-primary-default/20 p-5 rounded-3xl flex justify-between items-start shadow-md hover:shadow-lg hover:border-primary-default/40 transition-all duration-300 cursor-pointer break-words"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-primary-default to-secondary rounded-r-3xl"></div>
            
            <div className="flex gap-4 pr-3 w-full">
              <div className="p-3 bg-primary-default/10 text-primary-default rounded-2xl shrink-0 self-start shadow-sm">
                <Megaphone className="w-5 h-5" />
              </div>
              <div className="w-full font-sans min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between pb-2 border-b border-subtle/50 mb-2">
                  <h4 className="font-black text-sm md:text-base text-primary truncate">
                    {ann.title}
                  </h4>
                  <span className="shrink-0 w-fit inline-flex items-center gap-1.5 text-[10px] bg-primary-default/10 text-primary-hover font-black px-3 py-1 rounded-full border border-primary-default/10">
                    <Calendar className="w-3 h-3" /> اطلاعیه رسمی پلتفرم
                  </span>
                </div>
                <p className="text-xs md:text-sm text-secondary leading-relaxed font-semibold line-clamp-3">
                  {ann.content}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedAnnouncement(null)}>
          <div className="bg-card w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-6 text-right break-words" onClick={e => e.stopPropagation()} dir="rtl">
            <div className="flex justify-between items-start border-b border-subtle pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-default/10 text-primary-default rounded-2xl">
                  <Megaphone className="w-6 h-6" />
                </div>
                <h3 className="font-black text-lg text-primary">{selectedAnnouncement.title}</h3>
              </div>
              <button onClick={() => setSelectedAnnouncement(null)} className="p-2 text-secondary hover:bg-surface rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto space-y-4">
              {selectedAnnouncement.imageUrl && (
                <div className="rounded-2xl overflow-hidden border border-subtle shadow-sm">
                  <img
                    src={selectedAnnouncement.imageUrl}
                    alt={selectedAnnouncement.title}
                    className="w-full h-auto max-h-72 object-cover"
                  />
                </div>
              )}
              <p className="text-secondary text-sm leading-loose font-semibold whitespace-pre-wrap">
                {selectedAnnouncement.content}
              </p>
              {selectedAnnouncement.attachmentUrl && (
                <div className="pt-3 border-t border-subtle">
                  <a
                    href={selectedAnnouncement.attachmentUrl}
                    download={`attachment-${selectedAnnouncement.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary-default/10 hover:bg-primary-default/20 text-primary-default rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    📎 دریافت فایل پیوست اطلاعیه
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
