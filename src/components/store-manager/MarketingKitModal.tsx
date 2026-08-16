import React, { useState } from "react";
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Download, 
  Sparkles, 
  Send, 
  MessageSquare, 
  Layers, 
  ExternalLink,
  Tag,
  TrendingUp,
  Store
} from "lucide-react";
import { toast } from "../GlobalToast";
import { getValidProductImageUrl } from "../../utils/productUtils";

interface MarketingKitModalProps {
  product: any;
  onClose: () => void;
  storeName?: string;
  storeId?: number | string;
}

export default function MarketingKitModal({
  product,
  onClose,
  storeName = "فروشگاه من",
  storeId
}: MarketingKitModalProps) {
  const [activeTab, setActiveTab] = useState<"caption" | "story" | "links">("caption");
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!product) return null;

  const productTitle = product.title || product.name || "محصول ویژه زوپیت";
  const productPrice = product.price ? product.price.toLocaleString("fa-IR") : "۰";
  const productCategory = product.category?.name || product.category || "کالای دیجیتال و عمومی";
  const imageUrl = getValidProductImageUrl(product.images || product.image);
  
  const currentHost = typeof window !== "undefined" ? window.location.origin : "https://zopit.ir";
  const storeProductLink = `${currentHost}/store/${storeId || "my-store"}/product/${product.id}`;

  const generatedCaption = `✨ ${productTitle} ✨

🛍️ یک انتخاب فوق‌العاده و باکیفیت برای شما!
🏷️ دسته‌بندی: ${productCategory}
💰 قیمت ویژه: ${productPrice} تومان

🌟 ویژگی‌ها:
✔️ ضمانت اصالت و سلامت کالا
✔️ ارسال سریع به سراسر کشور با بسته‌بندی ایمن
✔️ پشتیبانی و پیگیری سفارش تا زمان تحویل

🛒 جهت مشاهده جزئیات و ثبت سفارش آنلاین به لینک زیر مراجعه کنید:
👇👇👇
${storeProductLink}

#خرید_آنلاین #فروشگاه_اینترنتی #${productCategory.replace(/\s+/g, "_")} #تخفیف_ویژه #خرید_مطمئن`;

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(generatedCaption);
    setCopiedCaption(true);
    toast("کپشن تبلیغاتی با موفقیت کپی شد!", "success");
    setTimeout(() => setCopiedCaption(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeProductLink);
    setCopiedLink(true);
    toast("لینک اختصاصی کالا کپی شد!", "success");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const shareToTelegram = () => {
    const url = `https://t.me/share/url?url=${encodeURIComponent(storeProductLink)}&text=${encodeURIComponent(generatedCaption)}`;
    window.open(url, "_blank");
  };

  const shareToWhatsapp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(generatedCaption)}`;
    window.open(url, "_blank");
  };

  const shareToEitaa = () => {
    const url = `https://eitaa.com/share/url?url=${encodeURIComponent(storeProductLink)}&text=${encodeURIComponent(generatedCaption)}`;
    window.open(url, "_blank");
  };

  const shareToBale = () => {
    const url = `https://ble.ir/share/url?url=${encodeURIComponent(storeProductLink)}&text=${encodeURIComponent(generatedCaption)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200" dir="rtl">
      <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-border-subtle flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-border-subtle flex justify-between items-center bg-surface/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-primary text-base">پک بازاریابی و تولید محتوا (Marketing Kit)</h3>
              <p className="text-xs text-muted mt-0.5">محتوای آماده جهت انتشار در زوپیت‌گرام، تلگرام و شبکه‌های اجتماعی</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface text-muted hover:text-primary rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border-subtle bg-surface/30 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab("caption")}
            className={`pb-3 px-4 text-xs font-black transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "caption"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-muted hover:text-primary"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>متن و کپشن آماده</span>
          </button>
          <button
            onClick={() => setActiveTab("story")}
            className={`pb-3 px-4 text-xs font-black transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "story"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-muted hover:text-primary"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>قالب استوری زوپیت‌گرام</span>
          </button>
          <button
            onClick={() => setActiveTab("links")}
            className={`pb-3 px-4 text-xs font-black transition-all border-b-2 flex items-center gap-2 ${
              activeTab === "links"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-muted hover:text-primary"
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>اشتراک‌گذاری در پیام‌رسان‌ها</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* TAB 1: Caption */}
          {activeTab === "caption" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted">متن آماده با فرمت استاندارد پست و استوری:</span>
                <button
                  onClick={handleCopyCaption}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  {copiedCaption ? <Check className="w-4 h-4 text-emerald-950" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedCaption ? "کپی شد!" : "کپی متن کامل کپشن"}</span>
                </button>
              </div>

              <div className="bg-surface/80 border border-subtle p-4 rounded-2xl">
                <pre className="text-xs text-primary font-sans whitespace-pre-wrap leading-relaxed select-all">
                  {generatedCaption}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: Story Template */}
          {activeTab === "story" && (
            <div className="space-y-4">
              <p className="text-xs text-muted">
                پیش‌نمایش استوری استاندارد (۹:۱۶) مخصوص اسکرین‌شات یا بازنشر در استوری زوپیت‌گرام:
              </p>
              
              <div className="flex justify-center">
                <div className="w-72 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 text-white shadow-2xl space-y-4 relative overflow-hidden text-center">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
                  
                  {/* Top Badge */}
                  <div className="flex items-center justify-between text-[10px] text-slate-300">
                    <span className="bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-md">⭐ پیشنهاد ویژه</span>
                    <span className="font-bold">{storeName}</span>
                  </div>

                  {/* Product Image */}
                  <div className="w-full h-44 rounded-2xl overflow-hidden bg-slate-800 border border-white/10 relative">
                    <img
                      src={imageUrl}
                      alt={productTitle}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Title & Price */}
                  <div className="space-y-1">
                    <h4 className="font-black text-xs text-white line-clamp-2 leading-snug">
                      {productTitle}
                    </h4>
                    <div className="pt-2">
                      <span className="text-lg font-black text-amber-400 font-mono">
                        {productPrice}
                      </span>
                      <span className="text-[10px] text-slate-300 mr-1">تومان</span>
                    </div>
                  </div>

                  {/* CTA Banner */}
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[11px] py-2 px-3 rounded-xl shadow-md">
                    👆 خرید مستقیم با لمس لینک استوری
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Messenger Links */}
          {activeTab === "links" && (
            <div className="space-y-4">
              <div className="bg-surface p-4 rounded-2xl border border-subtle space-y-3">
                <span className="text-xs font-bold text-muted block">لینک خرید مستقیم از فروشگاه شما:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={storeProductLink}
                    className="flex-1 bg-card border border-subtle rounded-xl px-3 py-2 text-xs font-mono text-left dir-ltr text-primary select-all"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="bg-primary-default text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-primary-hover transition-colors shrink-0"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? "کپی شد" : "کپی لینک"}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-muted block">اشتراک‌گذاری مستقیم با ۱ کلیک:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={shareToTelegram}
                    className="p-3 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 border border-sky-500/20 rounded-2xl text-xs font-black flex flex-col items-center justify-center gap-1.5 transition-all"
                  >
                    <Send className="w-5 h-5" />
                    <span>تلگرام (Telegram)</span>
                  </button>
                  <button
                    onClick={shareToWhatsapp}
                    className="p-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 rounded-2xl text-xs font-black flex flex-col items-center justify-center gap-1.5 transition-all"
                  >
                    <MessageSquare className="w-5 h-5" />
                    <span>واتساپ (WhatsApp)</span>
                  </button>
                  <button
                    onClick={shareToEitaa}
                    className="p-3 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/20 rounded-2xl text-xs font-black flex flex-col items-center justify-center gap-1.5 transition-all"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>ایتا (Eitaa)</span>
                  </button>
                  <button
                    onClick={shareToBale}
                    className="p-3 bg-teal-500/10 hover:bg-teal-500/20 text-teal-500 border border-teal-500/20 rounded-2xl text-xs font-black flex flex-col items-center justify-center gap-1.5 transition-all"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>بله (Bale)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
