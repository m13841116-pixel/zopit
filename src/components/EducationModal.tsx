import React, { useState, useEffect } from "react";
import { GraduationCap, PlayCircle, ExternalLink, X, HelpCircle, ArrowLeft, Video, Tv } from "lucide-react";

interface EducationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EducationModal({ isOpen, onClose }: EducationModalProps) {
  const [links, setLinks] = useState({
    EDUCATION_APARAT: "https://www.aparat.com",
    EDUCATION_YOUTUBE: "https://www.youtube.com",
    EDUCATION_TELEGRAM: "https://t.me"
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch("/api/config")
        .then((res) => {
          if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return null;
          return res.json();
        })
        .then((data) => {
          if (data && !data.error) {
            setLinks({
              EDUCATION_APARAT: data.EDUCATION_APARAT || "https://www.aparat.com",
              EDUCATION_YOUTUBE: data.EDUCATION_YOUTUBE || "https://www.youtube.com",
              EDUCATION_TELEGRAM: data.EDUCATION_TELEGRAM || "https://t.me"
            });
          }
        })
        .catch(console.error)
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
        className="bg-card w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-border-subtle flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <GraduationCap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">مرکز آموزش و راهنمای کاربران</h2>
              <p className="text-xs text-white/80 font-medium mt-0.5">
                ویدیوهای آموزشی و کانال‌های اطلاع‌رسانی پلتفرم
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-text-muted gap-3">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-bold">در حال بارگذاری مرکز آموزش...</span>
            </div>
          ) : (
            <>
              <p className="text-xs text-text-secondary leading-relaxed font-medium bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-2xl">
                به مرکز یادگیری خوش آمدید! جهت یادگیری نحوه کار با پنل، ثبت محصولات، مدیریت سفارشات، فرآیندهای لجستیک و تسویه حساب‌های مالی، از لینک‌های رسمی زیر استفاده نمایید.
              </p>

              <div className="space-y-3">
                {/* Aparat Link */}
                <a
                  href={links.EDUCATION_APARAT}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl border border-border-subtle bg-surface hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all duration-200 flex items-center justify-between group shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center shrink-0">
                      <Tv className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <h4 className="text-sm font-extrabold text-text-primary group-hover:text-emerald-700 transition-colors">
                        کانال ویدیوهای آموزشی آپارات
                      </h4>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        مشاهده آموزش‌های ویدیویی به زبان فارسی در آپارات
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-surface border border-border-subtle flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                    <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
                  </div>
                </a>

                {/* Youtube Link */}
                <a
                  href={links.EDUCATION_YOUTUBE}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl border border-border-subtle bg-surface hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all duration-200 flex items-center justify-between group shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-600/10 text-red-600 flex items-center justify-center shrink-0">
                      <PlayCircle className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <h4 className="text-sm font-extrabold text-text-primary group-hover:text-emerald-700 transition-colors">
                        کانال رسمی یوتیوب (YouTube)
                      </h4>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        آموزش‌های ویدیویی تخصصی پلتفرم در یوتیوب
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-surface border border-border-subtle flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                    <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
                  </div>
                </a>

                {/* Telegram / Social Link */}
                <a
                  href={links.EDUCATION_TELEGRAM}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl border border-border-subtle bg-surface hover:bg-emerald-500/5 hover:border-emerald-500/30 transition-all duration-200 flex items-center justify-between group shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 flex items-center justify-center shrink-0">
                      <Video className="w-5 h-5" />
                    </div>
                    <div className="text-right">
                      <h4 className="text-sm font-extrabold text-text-primary group-hover:text-emerald-700 transition-colors">
                        کانال اطلاع‌رسانی پلتفرم
                      </h4>
                      <p className="text-[11px] text-text-muted mt-0.5">
                        آخرین اخبار، تغییرات و وبینارهای تخصصی
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-surface border border-border-subtle flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0">
                    <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" />
                  </div>
                </a>
              </div>

              {/* Text guides */}
              <div className="bg-surface border border-border-subtle p-4 rounded-2xl space-y-2">
                <h5 className="text-xs font-black text-emerald-600 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4" /> راهنمای متنی سریع پلتفرم
                </h5>
                <ul className="text-[11px] text-text-secondary space-y-2 leading-relaxed list-disc pr-4">
                  <li><strong>تامین‌کنندگان:</strong> پس از ثبت سفارش توسط مدیر فروشگاه، حتماً سفارش را در پنل خود تایید نمایید تا لینک پرداخت برای فروشگاه فعال شود.</li>
                  <li><strong>مدیران فروشگاه:</strong> برای مشاهده کد رهگیری پستی و صدور برچسب مرسوله، فاکتور سفارش باید به حالت پرداخت شده تغییر یابد.</li>
                  <li><strong>تسویه حساب مالی:</strong> درخواست‌های تسویه پس از تایید مدیریت ارشد مستقیم به شماره شبای شما واریز می‌گردد.</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface border-t border-border-subtle text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            متوجه شدم (بستن پنجره)
          </button>
        </div>
      </div>
    </div>
  );
}
