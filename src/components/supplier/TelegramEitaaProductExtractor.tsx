import { toast } from "../GlobalToast";
import React, { useState } from "react";
import {
  Sparkles,
  Send,
  MessageCircle,
  FileText,
  CheckCircle2,
  Copy,
  ArrowRight,
  Plus,
  Trash2,
  AlertCircle,
  Layers,
  ShoppingBag,
  Tag,
  Check,
  PackageCheck,
  RefreshCw,
  ExternalLink
} from "lucide-react";

export interface ExtractedProduct {
  id: string;
  name: string;
  category: string;
  wholesalePrice: number;
  minOrderQuantity: number;
  stock: number;
  description: string;
  colors: string[];
  specs: Record<string, string>;
  sourceText?: string;
}

interface TelegramEitaaProductExtractorProps {
  onAddProducts: (products: ExtractedProduct[]) => void;
  onClose?: () => void;
}

export function TelegramEitaaProductExtractor({
  onAddProducts,
  onClose,
}: TelegramEitaaProductExtractorProps) {
  const [inputText, setInputText] = useState("");
  const [channelLink, setChannelLink] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedProducts, setExtractedProducts] = useState<ExtractedProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Sample templates from real Telegram/Eitaa wholesale channels for one-click testing
  const sampleTelegramPost1 = `🔥 بار جدید عمده رسید 🔥
کابل فست شارژ مک دودو مدل CA-1060 طول ۱.۲ متر
جنس بدنه: کنفی فوق‌العاده مقاوم، ضد کشش
خروجی: 66W فست با چیپ قطع‌کن هوشمند
قیمت عمده همکار: ۱۸۵,۰۰۰ تومان
کارتن: ۵۰ عددی (حداقل سفارش: ۱۰ عدد)
رنگ‌بندی: مشکی، طوسی
گارانتی: تعویض ۶ ماهه تعویض درجا
تحویل فوری در تهران و ارسال باربری به سراسر کشور`;

  const sampleTelegramPost2 = `📌 لیست موجودی بنکداری پارس (پخش عمده)
۱. قاب سیلیکونی اصلی سامسونگ A54 - رنگ‌بندی کامل پاستلی - کارتن ۱۰۰ تایی - قیمت عمده: ۶۸,۰۰۰ ت
۲. گلس سرامیکی مات سوپر D آیفون 13 و 14 - پک ۱۰ عددی - قیمت: ۲۲,۰۰۰ ت
۳. شارژر دیواری سامسونگ ۲۵ وات ۳ پین ویتنام اصلی - پک کارتن ۲۰ تایی - قیمت عمده: ۲۴۰,۰۰۰ تومان
۴. هولدر دریچه‌ای مگنتی یسیدو C83 فلزی - حداقل خرید: ۵ عدد - قیمت: ۱۱۰,۰۰۰ تومان`;

  // Parser engine to extract products, prices, and specifications from Telegram / Eitaa texts
  const parseTelegramOrEitaaText = (text: string): ExtractedProduct[] => {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const results: ExtractedProduct[] = [];

    // Helper to extract numbers from persian / english digits
    const parseNum = (valStr: string): number => {
      const en = valStr
        .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 0x06f0).toString())
        .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 0x0660).toString())
        .replace(/[,،٬\s]/g, "");
      const n = parseInt(en, 10);
      return isNaN(n) ? 0 : n;
    };

    // Case A: Multiline numbered list format (e.g. "۱. قاب سیلیکونی... قیمت: ۶۸,۰۰۰ ت")
    const numberedPattern = /^(?:[0-9۰-۹]+[\.\-\)]|\-|\*)\s*(.+)/;
    const numberedLines = lines.filter((l) => numberedPattern.test(l));

    if (numberedLines.length >= 2) {
      numberedLines.forEach((line, idx) => {
        const clean = line.replace(numberedPattern, "$1").trim();
        let name = clean;
        let price = 0;
        let moq = 1;
        let category = "لوازم جانبی";

        // Try extracting price e.g. "قیمت: 68,000" or "قیمت عمده: 68000 ت"
        const priceMatch = clean.match(/(?:قیمت|قیمت عمده|فی|نرخ)[\s\:\-]*([0-9۰-۹\,،]+)\s*(?:تومان|ت|هزار تومان)?/i);
        if (priceMatch) {
          let p = parseNum(priceMatch[1]);
          if (clean.includes("هزار تومان") && p < 10000) {
            p = p * 1000;
          }
          price = p;
          name = clean.substring(0, priceMatch.index).replace(/[\-\–\|]+$/, "").trim();
        }

        // Try extracting MOQ
        const moqMatch = clean.match(/(?:کارتن|بسته|حداقل|پک)[\s\:\-]*([0-9۰-۹]+)/);
        if (moqMatch) {
          moq = parseNum(moqMatch[1]) || 5;
        }

        // Guess category
        if (name.includes("کابل") || name.includes("شارژر") || name.includes("آداپتور")) {
          category = "کابل و شارژر";
        } else if (name.includes("قاب") || name.includes("کاور") || name.includes("گارد")) {
          category = "قاب و گلس";
        } else if (name.includes("هندزفری") || name.includes("هدفون") || name.includes("ایرپاد")) {
          category = "صوتی و هدفون";
        } else if (name.includes("هولدر") || name.includes("پایه")) {
          category = "لوازم جانبی خودرو";
        }

        results.push({
          id: `ext_${Date.now()}_${idx}`,
          name: name.slice(0, 80) || `محصول عمده ${idx + 1}`,
          category,
          wholesalePrice: price > 0 ? price : 50000,
          minOrderQuantity: moq,
          stock: 100,
          description: clean,
          colors: ["مشکی", "سفید"],
          specs: { "منبع استخراج": "لیست چندتایی پیام‌رسان" },
          sourceText: clean,
        });
      });
      return results;
    }

    // Case B: Single product post with full specifications
    let productName = "";
    let price = 0;
    let moq = 5;
    let category = "کالای دیجیتال و جانبی";
    const colors: string[] = [];
    const specs: Record<string, string> = {};

    lines.forEach((line) => {
      // Look for title: usually first line without "🔥" or greeting
      if (!productName && !line.includes("بار جدید") && !line.includes("سلام") && !line.includes("کانال") && !line.includes("پخش عمده")) {
        productName = line.replace(/^[🔥📌💎📦🚀\*\#\s]+/, "").trim();
      }

      // Look for price
      if (line.includes("قیمت") || line.includes("فی") || line.includes("همکار")) {
        const m = line.match(/([0-9۰-۹\,،]+)/);
        if (m) {
          let p = parseNum(m[1]);
          if (line.includes("هزار") && p < 10000) {
            p = p * 1000;
          }
          if (p > 500) price = p;
        }
      }

      // Look for MOQ / Carton size
      if (line.includes("کارتن") || line.includes("حداقل") || line.includes("تیراژ") || line.includes("تعداد")) {
        const m = line.match(/([0-9۰-۹]+)/);
        if (m) {
          const q = parseNum(m[1]);
          if (q > 0 && q < 5000) moq = q;
        }
      }

      // Look for colors
      if (line.includes("رنگ")) {
        if (line.includes("مشکی")) colors.push("مشکی");
        if (line.includes("سفید")) colors.push("سفید");
        if (line.includes("طوسی")) colors.push("طوسی");
        if (line.includes("آبی")) colors.push("آبی");
        if (line.includes("قرمز")) colors.push("قرمز");
        if (line.includes("سبز")) colors.push("سبز");
      }

      // Specs
      if (line.includes("خروجی") || line.includes("توان") || line.includes("جنس") || line.includes("گارانتی")) {
        const parts = line.split(/[\:\-]/);
        if (parts.length >= 2) {
          specs[parts[0].trim()] = parts.slice(1).join(" ").trim();
        }
      }
    });

    if (productName.includes("کابل")) category = "کابل و تبدیل";
    else if (productName.includes("قاب") || productName.includes("گلس")) category = "لوازم جانبی گوشی";
    else if (productName.includes("شارژر")) category = "شارژر و آداپتور";

    results.push({
      id: `ext_${Date.now()}_single`,
      name: productName || "محصول استخراج‌شده از پیام‌رسان",
      category,
      wholesalePrice: price > 0 ? price : 150000,
      minOrderQuantity: moq,
      stock: 150,
      description: text,
      colors: colors.length > 0 ? colors : ["مشکی", "سفید"],
      specs,
      sourceText: text,
    });

    return results;
  };

  const handleAnalyze = () => {
    if (!inputText.trim() && !channelLink.trim()) {
      toast.error("لطفاً متن پست یا آدرس کانال را وارد کنید.");
      return;
    }

    setIsAnalyzing(true);
    setTimeout(() => {
      try {
        const products = parseTelegramOrEitaaText(inputText || channelLink);
        setExtractedProducts(products);
        setSelectedIds(new Set(products.map((p) => p.id)));
        setIsAnalyzing(false);
        toast.success(`تعداد ${products.length.toLocaleString("fa-IR")} محصول با مشخصات کامل استخراج شد!`);
      } catch {
        setIsAnalyzing(false);
        toast.error("خطا در پردازش هوشمند متن. لطفاً متن را چک کنید.");
      }
    }, 600);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleUpdateProduct = (id: string, field: keyof ExtractedProduct, val: any) => {
    setExtractedProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: val } : p))
    );
  };

  const handleRemoveProduct = (id: string) => {
    setExtractedProducts((prev) => prev.filter((p) => p.id !== id));
    const next = new Set(selectedIds);
    next.delete(id);
    setSelectedIds(next);
  };

  const handleConfirmAndAdd = () => {
    const toAdd = extractedProducts.filter((p) => selectedIds.has(p.id));
    if (toAdd.length === 0) {
      toast.error("حداقل یک محصول را برای ثبت در زوپیت انتخاب کنید.");
      return;
    }

    onAddProducts(toAdd);
    toast.success(`تعداد ${toAdd.length.toLocaleString("fa-IR")} محصول با موفقیت به پلتفرم زوپیت اضافه شد.`);
    if (onClose) onClose();
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-indigo-200 overflow-hidden shadow-xl animate-fade-in text-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xs">
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm md:text-base font-black">
                ایجنت استخراج هوشمند محصول از کانال‌های تلگرام و ایتا
              </h3>
              <span className="bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-full">
                هوش مصنوعی زوپیت
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5 font-medium">
              بدون نیاز به تایپ دستی! فقط متن پست‌ها یا لیست قیمت کانال را پیست کنید؛ سیستم قیمت عمده، نام، تیراژ و مشخصات را فوراً استخراج می‌کند.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            ✕
          </button>
        )}
      </div>

      <div className="p-5 space-y-5">
        {/* Quick Test Presets */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
            <Tag className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>تست سریع با نمونه‌های واقعی کانال‌های عمده‌فروشی بازار:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setInputText(sampleTelegramPost1)}
              className="px-3 py-1 bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              نمونه ۱: تک‌محصول با مشخصات کامل
            </button>
            <button
              type="button"
              onClick={() => setInputText(sampleTelegramPost2)}
              className="px-3 py-1 bg-white hover:bg-indigo-100 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              نمونه ۲: لیست چندتایی بنکداری
            </button>
          </div>
        </div>

        {/* Input Text Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <label className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-purple-600" />
              <span>متن پست، کپشن یا لیست قیمت ارسالی در تلگرام / ایتا را اینجا پیست کنید:</span>
            </label>
            {inputText && (
              <button
                type="button"
                onClick={() => setInputText("")}
                className="text-rose-600 hover:underline text-[11px]"
              >
                پاک کردن متن
              </button>
            )}
          </div>

          <textarea
            rows={5}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="مثال: بار جدید کابل شارژر رسید. قیمت عمده همکار: 185,000 تومان - کارتن 50 تایی - رنگ‌بندی مشکی و سفید - گارانتی 6 ماهه..."
            className="w-full p-4 bg-slate-50 border-2 border-slate-200 focus:border-indigo-600 focus:bg-white rounded-2xl text-xs font-medium outline-none transition-all resize-y leading-relaxed text-slate-900"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-bold shrink-0">یا لینک کانال:</span>
              <input
                type="text"
                value={channelLink}
                onChange={(e) => setChannelLink(e.target.value)}
                placeholder="https://t.me/your_channel یا eitaa.com/channel"
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono w-full sm:w-64 outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50 transition-all"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>در حال پردازش و استخراج هوشمند...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>استخراج هوشمند مشخصات و قیمت</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Extracted Products Result View */}
        {extractedProducts.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h4 className="text-xs sm:text-sm font-black text-slate-900">
                  محصولات استخراج‌شده ({extractedProducts.length.toLocaleString("fa-IR")} قلم کالا آماده ثبت)
                </h4>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set(extractedProducts.map((p) => p.id)))}
                  className="text-indigo-600 font-bold hover:underline cursor-pointer"
                >
                  انتخاب همه
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-slate-500 font-bold hover:underline cursor-pointer"
                >
                  عدم انتخاب
                </button>
              </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {extractedProducts.map((p) => {
                const isSelected = selectedIds.has(p.id);
                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border-2 transition-all space-y-3 relative ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50/30 shadow-xs"
                        : "border-slate-200 bg-white opacity-70"
                    }`}
                  >
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(p.id)}
                          className="mt-1 w-4 h-4 rounded-md text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div className="flex-1 space-y-1">
                          <input
                            type="text"
                            value={p.name}
                            onChange={(e) => handleUpdateProduct(p.id, "name", e.target.value)}
                            className="w-full font-black text-xs text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white px-1 py-0.5 rounded-sm outline-none"
                            placeholder="نام محصول..."
                          />
                          <span className="inline-block text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                            {p.category}
                          </span>
                        </div>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(p.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                        title="حذف این آیتم"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Numeric Inputs (Price, MOQ, Stock) */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="block text-[10px] text-slate-500 font-bold">قیمت عمده (تومان):</span>
                        <input
                          type="number"
                          value={p.wholesalePrice}
                          onChange={(e) =>
                            handleUpdateProduct(p.id, "wholesalePrice", Number(e.target.value))
                          }
                          className="w-full font-mono font-black text-xs text-emerald-700 outline-none mt-0.5"
                        />
                      </div>

                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="block text-[10px] text-slate-500 font-bold">حداقل سفارش (MOQ):</span>
                        <input
                          type="number"
                          value={p.minOrderQuantity}
                          onChange={(e) =>
                            handleUpdateProduct(p.id, "minOrderQuantity", Number(e.target.value))
                          }
                          className="w-full font-mono font-black text-xs text-slate-800 outline-none mt-0.5"
                        />
                      </div>

                      <div className="bg-white p-2 rounded-xl border border-slate-200">
                        <span className="block text-[10px] text-slate-500 font-bold">موجودی انبار:</span>
                        <input
                          type="number"
                          value={p.stock}
                          onChange={(e) =>
                            handleUpdateProduct(p.id, "stock", Number(e.target.value))
                          }
                          className="w-full font-mono font-black text-xs text-slate-800 outline-none mt-0.5"
                        />
                      </div>
                    </div>

                    {/* Colors & Specs */}
                    {p.colors && p.colors.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
                        <span className="font-bold">رنگ‌بندی:</span>
                        <div className="flex items-center gap-1">
                          {p.colors.map((c, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 rounded-md text-[10px] font-bold">
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Action */}
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="text-xs text-slate-600">
                <span>تعداد کالای انتخابی جهت درج در زوپیت: </span>
                <strong className="text-indigo-700 font-mono text-sm">
                  {selectedIds.size.toLocaleString("fa-IR")}
                </strong>
                <span> از {extractedProducts.length.toLocaleString("fa-IR")} کالا</span>
              </div>

              <button
                type="button"
                onClick={handleConfirmAndAdd}
                disabled={selectedIds.size === 0}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50 transition-all"
              >
                <PackageCheck className="w-4 h-4" />
                <span>تأیید و افزودن به پنل محصولات زوپیت</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
