import React, { useState } from "react";
import {
  Sparkles,
  X,
  Copy,
  Check,
  ArrowDownLeft,
  RefreshCw,
  Info,
  Layers,
  FileText,
  Tag,
  Sliders,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "../../GlobalToast";

interface AIAssistResult {
  title: string;
  shortDescription: string;
  longDescription: string;
  features: string[];
  seoKeywords: string[];
  technicalSpecs: Array<{ key: string; value: string }>;
}

interface ProductAIAssistModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName?: string;
  currentCategory?: string;
  currentBrand?: string;
  onApplyAll: (data: {
    name?: string;
    shortDescription?: string;
    longDescription?: string;
    specs?: Array<{ key: string; value: string }>;
    brand?: string;
  }) => void;
  onApplyField: (field: string, value: any) => void;
}

export function ProductAIAssistModal({
  isOpen,
  onClose,
  currentName = "",
  currentCategory = "",
  currentBrand = "",
  onApplyAll,
  onApplyField,
}: ProductAIAssistModalProps) {
  const [nameInput, setNameInput] = useState(currentName);
  const [brandInput, setBrandInput] = useState(currentBrand);
  const [keywordsInput, setKeywordsInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AIAssistResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [appliedFields, setAppliedFields] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleCopy = (fieldKey: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    toast.success("کپی شد ✓");
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleGenerate = async () => {
    if (!nameInput.trim() && !keywordsInput.trim()) {
      toast.error("لطفاً نام یا حداقل چند کلمه کلیدی درباره محصول بنویسید.");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setAppliedFields({});

    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/products/ai-assist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: nameInput,
          category: currentCategory,
          brand: brandInput,
          keywords: keywordsInput,
        }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        setResult(json.data);
        toast.success("اطلاعات محصول توسط هوش مصنوعی با موفقیت تولید شد.");
      } else {
        toast.error(json.error || "خطا در تولید محتوای هوشمند.");
      }
    } catch (err) {
      toast.error("خطا در ارتباط با سرور هوش مصنوعی.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySingle = (field: string, value: any) => {
    onApplyField(field, value);
    setAppliedFields((prev) => ({ ...prev, [field]: true }));
    toast.success(`فیلد "${getFieldLabel(field)}" در فرم اعمال شد.`);
  };

  const handleApplyEverything = () => {
    if (!result) return;
    onApplyAll({
      name: result.title,
      shortDescription: result.shortDescription,
      longDescription: result.longDescription,
      specs: result.technicalSpecs,
      brand: brandInput,
    });
    toast.success("تمام اطلاعات پیشنهادی در فرم کالا اعمال گردید.");
    onClose();
  };

  const getFieldLabel = (f: string) => {
    switch (f) {
      case "name":
        return "عنوان محصول";
      case "shortDescription":
        return "توضیح کوتاه";
      case "longDescription":
        return "توضیحات کامل";
      case "specs":
        return "مشخصات فنی";
      default:
        return f;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-card border border-subtle rounded-3xl p-6 sm:p-8 max-w-3xl w-full my-auto max-h-[92vh] overflow-y-auto shadow-2xl space-y-6 text-right animate-scale-up"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-subtle">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-primary">
                  دستیار هوشمند تولید محتوای محصول (Gemini)
                </h3>
                <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded-full">
                  هوش مصنوعی
                </span>
              </div>
              <p className="text-xs text-secondary mt-0.5">
                تولید خودکار عنوان جذاب، توضیحات تجاری، مزایا و مشخصات فنی بر اساس استاندارد فروشگاهی
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-surface hover:bg-subtle text-muted hover:text-primary transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Form */}
        <div className="bg-surface border border-subtle rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-black text-secondary flex items-center gap-2">
            <span>اطلاعات اولیه کالا جهت پردازش هوشمند:</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                نام یا مدل کالا
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="مثال: هندزفری بلوتوثی هایلو T15"
                className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-medium text-primary outline-none focus:ring-2 focus:ring-primary-default"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-secondary mb-1">
                برند / شرکت سازنده (اختیاری)
              </label>
              <input
                type="text"
                value={brandInput}
                onChange={(e) => setBrandInput(e.target.value)}
                placeholder="مثال: Haylou / سامسونگ / شیائومی"
                className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-medium text-primary outline-none focus:ring-2 focus:ring-primary-default"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-secondary mb-1">
              ویژگی‌های کلیدی یا نکات مهم (اختیاری)
            </label>
            <textarea
              rows={2}
              value={keywordsInput}
              onChange={(e) => setKeywordsInput(e.target.value)}
              placeholder="مثال: باتری ۲۲۰۰ میلی‌آمپر، ضد تعریق IPX5، تاخیر کم گیمینگ، قابلیت پاوربانک"
              className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-medium text-primary outline-none focus:ring-2 focus:ring-primary-default resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-muted font-medium flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-indigo-500" />
              <span>محتواها برای بازبینی و تایید شما آماده می‌شوند و مستقیماً منتشر نمی‌گردند.</span>
            </span>

            <button
              type="button"
              disabled={isLoading}
              onClick={handleGenerate}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>در حال نگارش هوشمند...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>تولید مشخصات و توضیحات</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Display */}
        {result && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-black text-primary flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>نتایج پیشنهادی هوش مصنوعی:</span>
              </h4>

              <button
                type="button"
                onClick={handleApplyEverything}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>اعمال یکجای تمامی موارد در فرم</span>
              </button>
            </div>

            {/* Field 1: Title */}
            <div className="bg-surface border border-subtle rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-secondary">عنوان استاندارد محصول</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy("title", result.title)}
                    className="p-1.5 rounded-lg bg-background hover:bg-subtle text-secondary border border-subtle text-[11px] font-bold flex items-center gap-1"
                  >
                    {copiedField === "title" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === "title" ? "کپی شد ✓" : "کپی عنوان"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplySingle("name", result.title)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                      appliedFields.name
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-primary-default/10 text-primary-default hover:bg-primary-default/20"
                    }`}
                  >
                    {appliedFields.name ? "اعمال شد ✓" : "اعمال در فرم"}
                  </button>
                </div>
              </div>
              <p className="text-xs font-bold text-primary bg-background p-3 rounded-xl border border-subtle">
                {result.title}
              </p>
            </div>

            {/* Field 2: Short Description */}
            <div className="bg-surface border border-subtle rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-secondary">معرفی کوتاه (۲ جمله)</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy("shortDesc", result.shortDescription)}
                    className="p-1.5 rounded-lg bg-background hover:bg-subtle text-secondary border border-subtle text-[11px] font-bold flex items-center gap-1"
                  >
                    {copiedField === "shortDesc" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === "shortDesc" ? "کپی شد ✓" : "کپی"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplySingle("shortDescription", result.shortDescription)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                      appliedFields.shortDescription
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-primary-default/10 text-primary-default hover:bg-primary-default/20"
                    }`}
                  >
                    {appliedFields.shortDescription ? "اعمال شد ✓" : "اعمال در فرم"}
                  </button>
                </div>
              </div>
              <p className="text-xs text-secondary bg-background p-3 rounded-xl border border-subtle leading-relaxed">
                {result.shortDescription}
              </p>
            </div>

            {/* Field 3: Long Description & Key Features */}
            <div className="bg-surface border border-subtle rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-secondary">توضیحات جامع و مزایای کالا</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy("longDesc", `${result.longDescription}\n\nویژگی‌های کلیدی:\n` + result.features.map(f => `• ${f}`).join('\n'))}
                    className="p-1.5 rounded-lg bg-background hover:bg-subtle text-secondary border border-subtle text-[11px] font-bold flex items-center gap-1"
                  >
                    {copiedField === "longDesc" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === "longDesc" ? "کپی شد ✓" : "کپی توضیحات"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplySingle("longDescription", result.longDescription)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                      appliedFields.longDescription
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-primary-default/10 text-primary-default hover:bg-primary-default/20"
                    }`}
                  >
                    {appliedFields.longDescription ? "اعمال شد ✓" : "اعمال در فرم"}
                  </button>
                </div>
              </div>

              <p className="text-xs text-secondary bg-background p-3 rounded-xl border border-subtle leading-relaxed">
                {result.longDescription}
              </p>

              {result.features && result.features.length > 0 && (
                <div className="bg-background p-3 rounded-xl border border-subtle space-y-1.5">
                  <span className="text-[11px] font-black text-secondary block">ویژگی‌های برجسته کالا:</span>
                  <ul className="space-y-1">
                    {result.features.map((feat, idx) => (
                      <li key={idx} className="text-xs text-secondary flex items-start gap-2">
                        <span className="text-emerald-500 font-black">✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Field 4: Technical Specs */}
            {result.technicalSpecs && result.technicalSpecs.length > 0 && (
              <div className="bg-surface border border-subtle rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-secondary">جدول مشخصات فنی پیشنهادی</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy("specs", result.technicalSpecs.map(s => `${s.key}: ${s.value}`).join('\n'))}
                      className="p-1.5 rounded-lg bg-background hover:bg-subtle text-secondary border border-subtle text-[11px] font-bold flex items-center gap-1"
                    >
                      {copiedField === "specs" ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === "specs" ? "کپی شد ✓" : "کپی مشخصات"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplySingle("specs", result.technicalSpecs)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all ${
                        appliedFields.specs
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-primary-default/10 text-primary-default hover:bg-primary-default/20"
                      }`}
                    >
                      {appliedFields.specs ? "اعمال شد ✓" : "اعمال در فرم"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.technicalSpecs.map((spec, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-background rounded-xl border border-subtle text-xs">
                      <span className="font-bold text-secondary">{spec.key}</span>
                      <span className="font-medium text-primary">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Field 5: SEO Keywords */}
            {result.seoKeywords && result.seoKeywords.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-xs font-bold text-muted flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span>کلمات کلیدی جستجو:</span>
                </span>
                {result.seoKeywords.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-surface border border-subtle rounded-lg text-xs font-medium text-secondary"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-secondary hover:bg-subtle"
          >
            بستن
          </button>

          {result && (
            <button
              type="button"
              onClick={handleApplyEverything}
              className="px-6 py-2.5 bg-primary-default hover:bg-primary-hover text-inverse rounded-xl text-xs font-black shadow-xs cursor-pointer"
            >
              تایید و اعمال همه موارد در فرم
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
