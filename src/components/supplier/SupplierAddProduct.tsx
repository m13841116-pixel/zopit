import { toast } from "../GlobalToast";
import React, { useState } from "react";
import { numberToWords } from "../../utils/numberToWords";

export function toEnglishDigits(str: any): string {
  if (str === undefined || str === null) return "";
  return str.toString()
    .replace(/[,،٬\s]/g, "")
    .replace(/[۰-۹]/g, (d: string) => (d.charCodeAt(0) - 0x06f0).toString())
    .replace(/[٠-٩]/g, (d: string) => (d.charCodeAt(0) - 0x0660).toString());
}
import {
  Package,
  Upload,
  Plus,
  Trash2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Video,
  Sparkles,
  TrendingUp,
  HelpCircle,
  Coins,
  Info,
  List,
  X,
  ImagePlus,
  Eye,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  FileUp,
  Check
} from "lucide-react";

export function SupplierAddProduct({
  onSuccess,
  onCancel,
  showNotification,
  initialData,
}: any) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk Product Import State
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState<{
    type: "success" | "error";
    message: string;
    details?: string[];
  } | null>(null);
  const [previewProducts, setPreviewProducts] = useState<any[]>([]);
  const [showBulkPreviewModal, setShowBulkPreviewModal] = useState(false);

  // Function to download predefined Sample CSV Template
  const handleDownloadSampleCsv = () => {
    // UTF-8 BOM for perfect Excel Persian display
    const BOM = "\uFEFF";
    const csvContent =
      BOM +
      "نام محصول,دسته‌بندی,مدل گوشی,رنگ,قیمت عمده,موجودی\r\n" +
      "قاب سیلیکونی مات اورجینال,لوازم جانبی موبایل,iPhone 13 Pro,مشکی,145000,50\r\n" +
      "گلس سرامیکی تمام صفحه ضد ضربه,لوازم جانبی موبایل,Samsung Galaxy A54,شفاف,65000,120\r\n" +
      "هندزفری بلوتوثی پرو پلاس,صوتی و دیجیتال,Universal,سفید,480000,30\r\n" +
      "کابل شارژ سریع تایپ سی به لایتنینگ,کابل و تبدیل,iPhone 14 / 13 / 12,طوسی,95000,80\r\n";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "Zupit_Products_Sample_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("فایل اکسل نمونه با موفقیت دانلود شد.");
  };

  // Function to parse uploaded CSV / Excel file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset feedback
    setBulkFeedback(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          setBulkFeedback({
            type: "error",
            message: "فایل بارگذاری شده خالی است.",
          });
          return;
        }

        // Clean UTF-8 BOM and split lines
        const cleanText = text.replace(/^\uFEFF/, "");
        const lines = cleanText
          .split(/\r\n|\n|\r/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        if (lines.length <= 1) {
          setBulkFeedback({
            type: "error",
            message: "فایل بارگذاری شده شامل ردیف اطلاعات محصول نیست یا فقط سطر عناوین دارد.",
          });
          return;
        }

        // Auto-detect delimiter: comma, semicolon, tab
        const header = lines[0];
        let delimiter = ",";
        if (header.includes(";") && !header.includes(",")) delimiter = ";";
        else if (header.includes("\t") && !header.includes(",")) delimiter = "\t";

        const parsedList: any[] = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const rowNum = i + 1;
          const line = lines[i];

          // Parse CSV line with quotes support
          const regex = new RegExp(`(?:^|${delimiter})(?:"([^"]*)"|([^${delimiter}]*))`, "g");
          const cols: string[] = [];
          let match;
          while ((match = regex.exec(line)) !== null) {
            cols.push((match[1] !== undefined ? match[1] : match[2] || "").trim());
          }

          const finalCols = cols.length >= 2 ? cols : line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, ""));
          if (finalCols.length < 2 || finalCols.every((c) => !c)) continue; // skip blank rows

          // Expected columns:
          // Column A: نام محصول (Required)
          // Column B: دسته‌بندی (Required)
          // Column C: مدل گوشی (Optional)
          // Column D: رنگ (Optional)
          // Column E: قیمت عمده (Required)
          // Column F: موجودی (Required)
          const name = (finalCols[0] || "").trim();
          const category = (finalCols[1] || "").trim();
          const phoneModel = (finalCols[2] || "").trim();
          const color = (finalCols[3] || "").trim();
          const rawPrice = toEnglishDigits(finalCols[4] || "");
          const rawStock = toEnglishDigits(finalCols[5] || "");

          const wholesalePrice = parseFloat(rawPrice.replace(/[,]/g, ""));
          const stock = parseInt(rawStock.replace(/[,]/g, ""));

          if (!name) {
            errors.push(`ردیف ${rowNum}: نام محصول الزامی است و خالی می‌باشد.`);
            continue;
          }
          if (!category) {
            errors.push(`ردیف ${rowNum} (${name}): فیلد دسته‌بندی الزامی است.`);
            continue;
          }
          if (isNaN(wholesalePrice) || wholesalePrice <= 0) {
            errors.push(`ردیف ${rowNum} (${name}): فیلد قیمت عمده نامعتبر یا خالی است.`);
            continue;
          }
          if (isNaN(stock) || stock < 0) {
            errors.push(`ردیف ${rowNum} (${name}): فیلد موجودی نامعتبر یا خالی است.`);
            continue;
          }

          parsedList.push({
            rowNum,
            name,
            category,
            phoneModel,
            color,
            wholesalePrice,
            stock,
          });
        }

        if (errors.length > 0 && parsedList.length === 0) {
          setBulkFeedback({
            type: "error",
            message: `خطا در پردازش فایل اکسل: هیچ ردیف معتبری یافت نشد.`,
            details: errors,
          });
          return;
        }

        if (errors.length > 0) {
          setBulkFeedback({
            type: "error",
            message: `تعداد ${errors.length} ردیف دارای نقص اطلاعاتی بودند:`,
            details: errors,
          });
        }

        setPreviewProducts(parsedList);
        setShowBulkPreviewModal(true);
      } catch (err: any) {
        setBulkFeedback({
          type: "error",
          message: "خطا در خواندن فایل. لطفاً از قالب استاندارد اکسل/CSV استفاده نمایید.",
        });
      } finally {
        if (e.target) e.target.value = "";
      }
    };

    reader.readAsText(file, "UTF-8");
  };

  // Submit parsed bulk products to server
  const handleConfirmBulkUpload = async () => {
    if (previewProducts.length === 0) return;
    setIsBulkImporting(true);
    setBulkFeedback(null);

    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/products/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ products: previewProducts }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowBulkPreviewModal(false);
        setPreviewProducts([]);
        const successText = `تعداد ${data.count} محصول با موفقیت به سیستم اضافه شد.`;
        setBulkFeedback({
          type: "success",
          message: successText,
        });
        toast.success(successText);
        if (showNotification) showNotification(successText, "success");
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1800);
        }
      } else {
        const errorList = Array.isArray(data.errors)
          ? data.errors.map((e: any) => `ردیف ${e.row} (${e.name}): ${e.error}`)
          : [];
        setBulkFeedback({
          type: "error",
          message: data.error || "خطا در ثبت دسته‌جمعی محصولات",
          details: errorList.length > 0 ? errorList : undefined,
        });
        toast.error("خطا در ثبت برخی محصولات فایل اکسل");
      }
    } catch (err) {
      setBulkFeedback({
        type: "error",
        message: "خطا در برقراری ارتباط با سرور جهت ثبت دسته‌جمعی.",
      });
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setIsBulkImporting(false);
    }
  };
  const [categories, setCategories] = useState<any[]>([
    { id: 1, name: "موبایل" },
    { id: 2, name: "لپ‌تاپ" },
    { id: 3, name: "کالای دیجیتال" },
    { id: 4, name: "خانه و آشپزخانه" },
    { id: 5, name: "لوازم خانگی برقی" },
    { id: 6, name: "آرایشی و بهداشتی" },
    { id: 7, name: "مد و پوشاک" },
    { id: 8, name: "طلا و نقره" },
    { id: 9, name: "خودرو و موتورسیکلت" },
    { id: 10, name: "سلامت و پزشکی" },
    { id: 11, name: "ابزارآلات و تجهیزات" },
    { id: 12, name: "کتاب و هنر" },
    { id: 13, name: "ورزش و سفر" },
    { id: 14, name: "اسباب بازی کودک و نوزاد" },
    { id: 15, name: "محصولات بومی و محلی" },
    { id: 16, name: "پت شاپ" }
  ]);
  
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/public/categories");
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data?.categories || []);
          if (list.length > 0) {
            setCategories(list);
            setFormData(prev => ({ ...prev, categoryId: prev.categoryId || String(list[0].id) }));
            return;
          }
        }
        const res2 = await fetch("/api/categories");
        if (res2.ok) {
          const data2 = await res2.json();
          const list2 = Array.isArray(data2) ? data2 : (data2?.categories || []);
          if (list2.length > 0) {
            setCategories(list2);
            return;
          }
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    })();
  }, []);

  /* Form Data */ const [formData, setFormData] = useState({
    name: initialData?.name || "",
    shortDescription: initialData?.shortDescription || initialData?.longDescription || "",
    longDescription: initialData?.longDescription || initialData?.shortDescription || "",
    categoryId: initialData?.categoryId?.toString() || "",
    brand: initialData?.brand || "",
    sku: initialData?.sku || "",
    supplierBasePrice: initialData?.supplierBasePrice?.toString() || "",
    discount: initialData?.discount?.toString() || "",
    stock: (initialData?.variants && initialData.variants.length > 0)
      ? initialData.variants.reduce((sum: number, v: any) => sum + (parseInt(v.stock.toString().replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))) || 0), 0).toString()
      : initialData?.inventory?.toString() || "",
    minStock: "",
    images: Array.isArray(initialData?.images)
      ? initialData.images.map((img: any) => typeof img === 'string' ? img : (img?.url || ''))
      : (initialData?.imageUrl || initialData?.mainImage ? [initialData.imageUrl || initialData.mainImage] : []),
    mainImage: Array.isArray(initialData?.images) && initialData.images.length > 0
      ? (typeof initialData.images[0] === 'string' ? initialData.images[0] : initialData.images[0]?.url || '')
      : (initialData?.imageUrl || initialData?.mainImage || ''),
    variants: (initialData?.variants || []).map((v: any) => {
      let attrs = v.attributes || {};
      if (typeof v.attributes === 'string') {
        try {
          attrs = JSON.parse(v.attributes);
        } catch {
          attrs = {};
        }
      }
      return {
        ...v,
        attributes: attrs
      };
    }),
    videoUrl: initialData?.exploreContent?.customVideoUrl || "",
  });

  const [techSpecs, setTechSpecs] = useState<Array<{ key: string; value: string }>>(() => {
    if (initialData?.technicalSpecs) {
      try {
        const parsed = typeof initialData.technicalSpecs === 'string' ? JSON.parse(initialData.technicalSpecs) : initialData.technicalSpecs;
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error("Error parsing specs", e);
      }
    }
    return [{ key: "", value: "" }];
  });
  /* Variant Building */
  const [attributes, setAttributes] = useState<{ name: string; values: string[] }[]>([]);
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrValue, setNewAttrValue] = useState("");

  const isNextDisabled = () => {
    if (step === 1) {
      return !formData.name.trim() || !formData.categoryId;
    }
    if (step === 2) {
      const price = toEnglishDigits(formData.supplierBasePrice);
      const stockVal = toEnglishDigits(formData.stock);
      return !price || parseFloat(price) <= 0 || (!stockVal && formData.variants.length === 0);
    }
    return false;
  };

  const nextStep = () => {
    if (isNextDisabled()) {
      showNotification("لطفاً تمامی فیلدهای ستاره‌دار این مرحله را پر کنید.", "error");
      return;
    }
    setStep((prev) => Math.min(prev + 1, 5));
  };
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));
  const addAttribute = () => {
    if (!newAttrName.trim()) return;
    setAttributes([...attributes, { name: newAttrName, values: [] }]);
    setNewAttrName("");
  };
  const addAttributeValue = (index: number) => {
    if (!newAttrValue.trim()) return;
    const newAttrs = [...attributes];
    if (!newAttrs[index].values.includes(newAttrValue)) {
      newAttrs[index].values.push(newAttrValue);
    }
    setAttributes(newAttrs);
    setNewAttrValue("");
    generateMatrix(newAttrs);
  };
  const generateMatrix = (attrs: any[]) => {
    if (attrs.length === 0) {
      setFormData({ ...formData, variants: [] });
      return;
    }
    /* Cartesian product of attribute values */
    const cartesian = (arrays: any[][]) => {
      return arrays.reduce(
        (a, b) =>
          a
            .map((x) => b.map((y) => x.concat([y])))
            .reduce((c, d) => c.concat(d), []),
        [[]],
      );
    };
    const validAttrs = attrs.filter((a) => a.values.length > 0);
    if (validAttrs.length === 0) return;
    const valuesArrays = validAttrs.map((a) =>
      a.values.map((v: any) => ({ [a.name]: v })),
    );
    const combinations = cartesian(valuesArrays).map((combo) => {
      /* flatten */
      const attrObj = Object.assign({}, ...combo);
      return {
        attributes: attrObj,
        supplierBasePrice: formData.supplierBasePrice || "",
        stock: "",
        sku: "",
      };
    });
    setFormData({ ...formData, variants: combinations });
  };
  const removeAttribute = (index: number) => {
    const newAttrs = attributes.filter((_, i) => i !== index);
    setAttributes(newAttrs);
    generateMatrix(newAttrs);
  };
  const handleVariantChange = (index: number, field: string, value: string) => {
    const newVariants = [...formData.variants];
    newVariants[index][field] = value;
    
    let updatedStock = formData.stock;
    if (field === "stock") {
      const sum = newVariants.reduce((total, v) => {
        const parsed = parseInt(toEnglishDigits(v.stock), 10);
        return total + (isNaN(parsed) ? 0 : parsed);
      }, 0);
      updatedStock = sum.toString();
    }
    
    setFormData({ ...formData, variants: newVariants, stock: updatedStock });
  };

  const handleSubmit = async () => {
    const cleanedName = formData.name ? formData.name.trim() : "";
    const cleanedCategoryId = formData.categoryId ? String(formData.categoryId).trim() : "";
    const cleanedBasePrice = toEnglishDigits(formData.supplierBasePrice);
    const cleanedStock = toEnglishDigits(formData.stock);
    const cleanedDiscount = toEnglishDigits(formData.discount) || "0";
    const cleanedBrand = formData.brand ? formData.brand.trim() : "";
    const cleanedSku = formData.sku ? formData.sku.trim() : "";

    if (!cleanedName) {
      showNotification("نام محصول الزامی است.", "error");
      return;
    }
    if (!cleanedCategoryId) {
      showNotification("لطفاً یک دسته‌بندی انتخاب فرمایید.", "error");
      return;
    }
    if (!cleanedBasePrice || parseFloat(cleanedBasePrice) <= 0) {
      showNotification("قیمت پایه تامین‌کننده باید عددی بزرگتر از صفر باشد.", "error");
      return;
    }
    
    const finalStock = cleanedStock || (formData.variants && formData.variants.length > 0 ? "0" : "10");

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const url = initialData?.id
        ? `/api/supplier/products/${initialData.id}`
        : "/api/supplier/products";
      const method = initialData?.id ? "PUT" : "POST";

      const cleanedVariants = (formData.variants || []).map((v: any) => ({
        ...v,
        supplierBasePrice: toEnglishDigits(v.supplierBasePrice || cleanedBasePrice),
        stock: toEnglishDigits(v.stock || "10"),
        sku: v.sku ? v.sku.trim() : "",
        imageUrl: v.imageUrl || null
      }));

      const cleanedSpecs = techSpecs
        .filter((s) => s.key && s.key.trim() && s.value && s.value.trim())
        .map(s => ({ key: s.key.trim(), value: s.value.trim() }));

      const payload = {
        ...formData,
        name: cleanedName,
        categoryId: cleanedCategoryId,
        supplierBasePrice: cleanedBasePrice,
        stock: finalStock,
        discount: cleanedDiscount,
        brand: cleanedBrand,
        sku: cleanedSku,
        variants: cleanedVariants,
        technicalSpecs: JSON.stringify(cleanedSpecs),
      };

      const res = await fetch(url, {
        credentials: "include",
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showNotification(
          initialData?.id
            ? "محصول با موفقیت ویرایش شد"
            : "محصول با موفقیت ثبت شد و در انتظار تایید است",
          "success",
        );
        onSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        const detailMsg = data.details ? `: ${data.details}` : "";
        const mainMsg = data.error || data.message || "خطا در ثبت محصول";
        showNotification(`${mainMsg}${detailMsg}`, "error");
      }
    } catch (err) {
      showNotification("خطا در ارتباط با سرور", "error");
    } finally {
      setIsSubmitting(false);
    }
  };
  const steps = [
    "اطلاعات اصلی",
    "قیمت و موجودی",
    "ویژگی‌ها و متغیرها",
    "رسانه",
    "بررسی و ثبت",
  ];
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden animate-fade-in max-w-4xl mx-auto my-8">
      
      <div className="bg-background border-b border-subtle p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-primary">
            {initialData?.id ? "ویرایش محصول" : "افزودن محصول جدید"}
          </h2>
          <p className="text-xs text-secondary mt-1">
            تمام اطلاعات محصول خود را در این فرم وارد نمایید
          </p>
        </div>

        {/* Compact Excel Import Tool in Header */}
        {!initialData?.id && (
          <div className="flex items-center gap-2 shrink-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.txt,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
            />
            
            <button
              type="button"
              onClick={handleDownloadSampleCsv}
              title="دانلود فایل اکسل نمونه"
              className="px-3 py-2 bg-surface hover:bg-border-subtle text-text-secondary hover:text-text-primary border border-border-default rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-primary-default" />
              <span>فایل اکسل نمونه</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 bg-primary-default hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm shadow-primary-default/20 cursor-pointer"
            >
              <FileUp className="w-3.5 h-3.5" />
              <span>ورود دسته‌جمعی با اکسل</span>
            </button>
          </div>
        )}
      </div>

      {/* Success / Error Feedback Alert Bar if any */}
      {bulkFeedback && (
        <div className="mx-6 mt-4 p-3.5 rounded-xl border text-xs font-bold transition-all bg-surface border-border-default">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {bulkFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-danger shrink-0" />
              )}
              <span className={bulkFeedback.type === "success" ? "text-success font-black text-xs" : "text-danger font-black text-xs"}>
                {bulkFeedback.message}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setBulkFeedback(null)}
              className="text-text-muted hover:text-text-primary p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {bulkFeedback.details && bulkFeedback.details.length > 0 && (
            <ul className="mt-2 mr-6 list-disc space-y-1 text-[11px] font-bold text-danger">
              {bulkFeedback.details.slice(0, 5).map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
              {bulkFeedback.details.length > 5 && (
                <li>و {bulkFeedback.details.length - 5} ردیف دیگر...</li>
              )}
            </ul>
          )}
        </div>
      )}

      {/* Bulk Upload Preview Modal */}
      {showBulkPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-3xl w-full shadow-2xl space-y-5 animate-scale-up text-slate-900 dark:text-white" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-950 dark:text-white">
                  پیش‌نمایش محصولات استخراج‌شده از اکسل ({previewProducts.length} محصول)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkPreviewModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-right text-xs min-w-[800px]">
                <thead className="bg-slate-100 dark:bg-slate-800 font-extrabold text-slate-700 dark:text-slate-300 sticky top-0">
                  <tr>
                    <th className="p-3">ردیف</th>
                    <th className="p-3">نام محصول</th>
                    <th className="p-3">دسته‌بندی</th>
                    <th className="p-3">مدل گوشی</th>
                    <th className="p-3">رنگ</th>
                    <th className="p-3">قیمت عمده (تومان)</th>
                    <th className="p-3">موجودی</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {previewProducts.map((p, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-3 font-mono">{p.rowNum || idx + 1}</td>
                      <td className="p-3 font-bold text-slate-950 dark:text-white">{p.name}</td>
                      <td className="p-3">{p.category}</td>
                      <td className="p-3">{p.phoneModel || "-"}</td>
                      <td className="p-3">{p.color || "-"}</td>
                      <td className="p-3 font-black text-emerald-600 dark:text-emerald-400">
                        {Number(p.wholesalePrice).toLocaleString("fa-IR")}
                      </td>
                      <td className="p-3 font-bold">{p.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <span className="text-xs text-slate-500 font-bold">
                تمام این اقلام با وضعیت اولیه ثبت و پس از تایید در سیستم فعال خواهند شد.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkPreviewModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  disabled={isBulkImporting}
                  onClick={handleConfirmBulkUpload}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isBulkImporting ? "در حال ثبت اقلام..." : `تایید و افزودن ${previewProducts.length} محصول`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-8 space-y-12 min-h-[400px]">
        
        {/* Step 1: Basic Info */}
        <section className="space-y-5">
          <h3 className="text-lg font-bold text-primary mb-6 border-b pb-2 flex items-center gap-2">
             <span className="w-8 h-8 rounded-full bg-primary-default/10 text-primary-default flex items-center justify-center font-bold">1</span>
             اطلاعات اصلی محصول
          </h3>

          <div>
            <label className="block text-sm font-semibold text-secondary mb-1.5">
              نام محصول *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-3 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none text-primary font-medium"
              placeholder="مثال: لپ‌تاپ ایسوس مدل ZenBook"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-sm font-bold text-secondary">
                دسته‌بندی محصول * (یکی از موارد زیر را انتخاب کنید)
              </label>
              <span className="text-xs text-muted font-normal">
                {categories.length} دسته‌بندی در دسترس
              </span>
            </div>

            {/* Category Select Dropdown */}
            <div className="bg-surface p-3.5 rounded-2xl border border-subtle">
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-3 bg-card text-primary border border-subtle rounded-xl font-medium outline-none focus:ring-2 focus:ring-primary-default text-sm cursor-pointer"
              >
                <option value="" className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100">
                  -- انتخاب دسته‌بندی محصول از منوی کشویی --
                </option>
                {categories.map((cat) => {
                  const cName = cat.name || cat.title || cat.categoryName || `دسته‌بندی ${cat.id}`;
                  return (
                    <option
                      key={cat.id}
                      value={String(cat.id)}
                      className="text-slate-900 bg-white dark:bg-slate-800 dark:text-slate-100 py-1"
                    >
                      {cName}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Selected Category Record Banner */}
            {formData.categoryId ? (
              <div className="mt-2.5 p-3 bg-primary-default/10 border border-primary-default/30 text-primary-default rounded-xl text-xs font-bold flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-primary-default" />
                  دسته‌بندی انتخاب‌شده: <strong className="text-sm font-black bg-primary-default text-inverse px-2 py-0.5 rounded-md">
                    {(() => {
                      const found = categories.find(c => String(c.id) === formData.categoryId);
                      return found ? (found.name || found.title || found.categoryName || `دسته‌بندی ${found.id}`) : 'ثبت‌شده';
                    })()}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, categoryId: "" })}
                  className="text-xs text-danger hover:underline cursor-pointer"
                >
                  تغییر دسته‌بندی
                </button>
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                جهت ادامه ثبت محصول، حتماً یکی از دسته‌بندی‌های فوق را انتخاب کنید.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-secondary mb-1.5">
              برند کالا (اختیاری)
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) =>
                setFormData({ ...formData, brand: e.target.value })
              }
              className="w-full px-4 py-3 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none text-primary"
              placeholder="مثال: سامسونگ، شیائومی، ایسوس"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-secondary mb-1.5">
              توضیحات و معرفی محصول *
            </label>
            <textarea
              value={formData.longDescription || formData.shortDescription}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  shortDescription: e.target.value,
                  longDescription: e.target.value,
                })
              }
              className="w-full px-4 py-3 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none h-32 resize-none"
              placeholder="توضیحات جامع، مشخصات اصلی و کاربردهای محصول..."
            ></textarea>
          </div>
          
          <div className="border-t border-subtle pt-4 space-y-3 mt-6">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-bold text-secondary">
                مشخصات و ویژگی‌های فنی
              </label>
              <button
                type="button"
                onClick={() => setTechSpecs([...techSpecs, { key: "", value: "" }])}
                className="px-3 py-1 bg-primary-default/10 text-primary-default hover:bg-primary-default/20 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> افزودن ویژگی
              </button>
            </div>
            <div className="space-y-2">
              {techSpecs.map((spec, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="عنوان ویژگی (مثلاً: حافظه RAM)"
                    value={spec.key}
                    onChange={(e) => {
                      const updated = [...techSpecs];
                      updated[idx].key = e.target.value;
                      setTechSpecs(updated);
                    }}
                    className="flex-1 px-3 py-2 bg-background border border-subtle rounded-lg text-xs outline-none"
                  />
                  <input
                    type="text"
                    placeholder="مقدار (مثلاً: 16 گیگابایت DDR5)"
                    value={spec.value}
                    onChange={(e) => {
                      const updated = [...techSpecs];
                      updated[idx].value = e.target.value;
                      setTechSpecs(updated);
                    }}
                    className="flex-1 px-3 py-2 bg-background border border-subtle rounded-lg text-xs outline-none"
                  />
                  {techSpecs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setTechSpecs(techSpecs.filter((_, i) => i !== idx))}
                      className="p-2 text-danger hover:bg-danger/10 rounded-lg cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Step 2: Price & Inventory */}
        <section className="space-y-5">
          <h3 className="text-lg font-bold text-primary mb-6 border-b pb-2 flex items-center gap-2">
             <span className="w-8 h-8 rounded-full bg-primary-default/10 text-primary-default flex items-center justify-center font-bold">2</span>
             قیمت و موجودی
          </h3>
          <div className="bg-primary-default/10 p-4 rounded-xl border border-primary-default/20 mb-6">
            <p className="text-sm text-primary-hover font-medium flex items-start gap-2">
              <Info className="w-5 h-5 shrink-0" />
              <span>
                توجه: مبلغ وارد شده به عنوان "قیمت پایه تامین‌کننده" مبلغی است که با شما تسویه می‌شود. قیمت نهایی برای مشتری توسط پلتفرم محاسبه و تعیین می‌گردد.
              </span>
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">
                قیمت پایه تامین‌کننده (تومان) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.supplierBasePrice}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    supplierBasePrice: e.target.value,
                  })
                }
                className="w-full px-4 py-3 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none text-left font-mono font-bold text-primary"
                dir="ltr"
                placeholder="مثلاً: 1250000 یا ۱,۲۵۰,۰۰۰"
              />
              <div className="mt-2 space-y-2">
                <p className="text-xs text-muted font-medium">
                  {formData.supplierBasePrice ? `مبلغ به عدد: ${Number(toEnglishDigits(formData.supplierBasePrice) || 0).toLocaleString('fa-IR')} تومان` : 'مبلغ را به تومان وارد کنید'}
                </p>
                {formData.supplierBasePrice && Number(toEnglishDigits(formData.supplierBasePrice)) > 0 && (
                  <div className="p-3 bg-primary-default/10 border border-primary-default/25 rounded-xl text-xs space-y-1 shadow-sm">
                    <span className="text-secondary block font-semibold">مبلغ به حروف:</span>
                    <span className="text-primary-default font-black text-sm block">
                      {numberToWords(formData.supplierBasePrice)} تومان
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-secondary mb-1.5">
                موجودی اولیه (تعداد در انبار) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
                className="w-full px-4 py-3 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none text-left font-mono font-bold text-primary"
                dir="ltr"
                disabled={formData.variants.length > 0}
                placeholder="مثلاً: 10"
              />
              {formData.variants.length > 0 && (
                <p className="text-xs text-muted mt-1">
                  موجودی کل از مجموع تعداد متغیرهای مرحله ۳ محاسبه می‌گردد.
                </p>
              )}
            </div>
          </div>

          {/* Stock Availability Notification Card */}
          <div className="bg-surface p-4 rounded-xl border border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary">
                  اطلاع‌رسانی وضعیت موجودی کالا
                </p>
                <p className="text-[11px] text-muted">
                  {Number(formData.stock || 0) > 0 || formData.variants.length > 0
                    ? "وضعیت: «موجود در انبار و آماده ارسال» — در صورت اتمام موجودی، برچسب عدم موجودی به صورت خودکار فعال می‌شود."
                    : "وضعیت: لطفا موجودی کالا را مشخص فرمایید تا برچسب موجود در انبار فعال شود."}
                </p>
              </div>
            </div>
            <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 shadow-sm ${
              Number(formData.stock || 0) > 0 || formData.variants.length > 0
                ? "bg-emerald-600 text-white"
                : "bg-danger text-white"
            }`}>
              {Number(formData.stock || 0) > 0 || formData.variants.length > 0 ? "کالا موجود است" : "در انتظار موجودی"}
            </span>
          </div>
        </section>

        {/* Step 3: Variants */}
        <section className="space-y-5">
          <h3 className="text-lg font-bold text-primary mb-6 border-b pb-2 flex items-center gap-2">
             <span className="w-8 h-8 rounded-full bg-primary-default/10 text-primary-default flex items-center justify-center font-bold">3</span>
             ویژگی‌های متغیر (مانند رنگ، سایز)
          </h3>
          <div className="bg-surface p-5 rounded-xl border border-subtle mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h4 className="font-bold text-primary flex items-center gap-2">
                <List className="w-5 h-5 text-secondary" />
                تعریف ویژگی‌ها
              </h4>
              
              {/* Quick Attribute Preset Templates */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted font-medium">الگوهای آماده:</span>
                <button
                  type="button"
                  onClick={() => {
                    const newAttr = { name: "رنگ", values: ["مشکی", "سفید", "سرمه‌ای", "خاکستری"] };
                    const updated = [...attributes, newAttr];
                    setAttributes(updated);
                    generateMatrix(updated);
                    showNotification("الگوی «رنگ» با ۴ مقدار اضافه شد", "success");
                  }}
                  className="px-2.5 py-1 bg-primary-default/10 text-primary-default hover:bg-primary-default/20 border border-primary-default/30 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>🎨 رنگ‌های اصلی</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newAttr = { name: "سایز", values: ["S", "M", "L", "XL", "XXL"] };
                    const updated = [...attributes, newAttr];
                    setAttributes(updated);
                    generateMatrix(updated);
                    showNotification("الگوی «سایزبندی» اضافه شد", "success");
                  }}
                  className="px-2.5 py-1 bg-primary-default/10 text-primary-default hover:bg-primary-default/20 border border-primary-default/30 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>📐 سایزبندی پوشاک</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newAttr = { name: "گارانتی", values: ["ضمانت اصالت و سلامت فیزیکی", "گارانتی ۱۸ ماهه شرکتی"] };
                    const updated = [...attributes, newAttr];
                    setAttributes(updated);
                    generateMatrix(updated);
                    showNotification("الگوی «گارانتی» اضافه شد", "success");
                  }}
                  className="px-2.5 py-1 bg-primary-default/10 text-primary-default hover:bg-primary-default/20 border border-primary-default/30 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>🛡️ گارانتی</span>
                </button>
              </div>
            </div>
            
            {attributes.map((attr, idx) => (
              <div
                key={idx}
                className="mb-4 bg-background p-4 rounded-lg border border-subtle"
              >
                <div className="flex gap-4 items-start">
                  <div className="flex-1 space-y-3">
                    <input
                      type="text"
                      value={attr.name}
                      onChange={(e) => {
                        const newAttrs = [...attributes];
                        newAttrs[idx].name = e.target.value;
                        setAttributes(newAttrs);
                      }}
                      placeholder="نام ویژگی (مثلاً رنگ)"
                      className="w-full px-3 py-2 bg-background border border-subtle rounded-lg text-sm outline-none"
                    />
                    <div className="flex gap-2">
                       <input
                          id={`attr-val-input-${idx}`}
                          type="text"
                          placeholder="مقدار جدید (مثلاً قرمز)"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const val = e.currentTarget.value.trim();
                              if (val && !attr.values.includes(val)) {
                                const newAttrs = [...attributes];
                                newAttrs[idx].values.push(val);
                                setAttributes(newAttrs);
                                generateMatrix(newAttrs);
                              }
                              e.currentTarget.value = "";
                            }
                          }}
                          className="flex-1 px-3 py-2 bg-background border border-subtle rounded-lg text-sm outline-none text-primary"
                       />
                       <button
                         type="button"
                         onClick={() => {
                           const inputEl = document.getElementById(`attr-val-input-${idx}`) as HTMLInputElement;
                           if (inputEl && inputEl.value.trim()) {
                             const val = inputEl.value.trim();
                             if (!attr.values.includes(val)) {
                               const newAttrs = [...attributes];
                               newAttrs[idx].values.push(val);
                               setAttributes(newAttrs);
                               generateMatrix(newAttrs);
                             }
                             inputEl.value = "";
                           }
                         }}
                         className="px-3 py-2 bg-primary-default text-inverse hover:bg-primary-hover rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                       >
                         <Plus className="w-4 h-4" /> افزودن مقدار
                       </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {attr.values.map((v, vIdx) => (
                        <div
                          key={vIdx}
                          className="px-3 py-1 bg-surface border border-subtle rounded-full text-xs font-semibold flex items-center gap-2"
                        >
                          {v}
                          <button
                            type="button"
                            onClick={() => {
                              const newAttrs = [...attributes];
                              newAttrs[idx].values = newAttrs[idx].values.filter(
                                (_, i) => i !== vIdx,
                              );
                              setAttributes(newAttrs);
                              generateMatrix(newAttrs);
                            }}
                            className="text-muted hover:text-danger cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeAttribute(idx)}
                    className="p-2 text-danger hover:bg-danger/10 rounded-lg shrink-0 cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
              <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                <input
                  type="text"
                  value={newAttrName}
                  onChange={(e) => setNewAttrName(e.target.value)}
                  placeholder="نام ویژگی جدید (مثلاً جنس یا سایز)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addAttribute();
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-background border border-subtle rounded-lg text-sm outline-none text-primary"
                />
                <button
                  type="button"
                  onClick={addAttribute}
                  className="px-4 py-2 bg-primary-default text-inverse hover:bg-primary-hover rounded-lg text-sm font-bold cursor-pointer transition-colors shrink-0 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> افزودن ویژگی
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const newVariant = {
                    attributes: { "تنوع": `تنوع سفارشی ${formData.variants.length + 1}` },
                    supplierBasePrice: formData.supplierBasePrice || "",
                    stock: "1",
                    sku: "",
                    imageUrl: "",
                  };
                  setFormData({ ...formData, variants: [...formData.variants, newVariant] });
                  showNotification("تنوع جدید به جدول اضافه شد", "success");
                }}
                className="px-4 py-2 bg-primary-default text-inverse hover:bg-primary-hover rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1 shrink-0 shadow-sm"
              >
                <Plus className="w-4 h-4" /> افزودن دستی تنوع به جدول
              </button>
            </div>
          </div>

          {formData.variants.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <h4 className="font-bold text-primary text-base flex items-center gap-2">
                  <List className="w-5 h-5 text-primary-default" />
                  لیست متغیرهای ایجاد شده ({formData.variants.length} مورد)
                </h4>
                
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!formData.supplierBasePrice) {
                        showNotification("لطفاً ابتدا قیمت پایه را در مرحله ۲ وارد کنید.", "error");
                        return;
                      }
                      const updatedVariants = formData.variants.map((v: any) => ({
                        ...v,
                        supplierBasePrice: formData.supplierBasePrice,
                      }));
                      setFormData({ ...formData, variants: updatedVariants });
                      showNotification("قیمت پایه روی تمامی متغیرها اعمال شد", "success");
                    }}
                    className="px-3 py-2 bg-primary-default/10 text-primary-default hover:bg-primary-default/20 border border-primary-default/30 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Coins className="w-4 h-4" />
                    <span>اعمال قیمت پایه ({formData.supplierBasePrice ? Number(formData.supplierBasePrice).toLocaleString('fa-IR') + ' تومان' : 'نامشخص'}) به همه متغیرها</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-subtle">
                <table className="w-full text-right text-sm min-w-[800px]">
                  <thead className="bg-surface text-muted">
                    <tr>
                      <th className="p-3 rounded-tr-xl">ترکیب / نام ویژگی</th>
                      <th className="p-3">قیمت پایه (تومان) *</th>
                      <th className="p-3">موجودی</th>
                      <th className="p-3">تصویر تنوع (فایل سیستم / لینک)</th>
                      <th className="p-3 rounded-tl-xl w-12">حذف</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.variants.map((v, idx) => (
                      <tr key={idx} className="border-t border-subtle bg-background hover:bg-surface/50">
                        <td className="p-3 font-medium text-primary">
                          {typeof v.attributes === 'object' && v.attributes !== null
                            ? Object.values(v.attributes).join(" - ")
                            : String(v.attributes || `تنوع ${idx + 1}`)}
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            value={v.supplierBasePrice}
                            onChange={(e) => handleVariantChange(idx, "supplierBasePrice", e.target.value)}
                            className="w-36 px-3 py-1.5 bg-card border border-primary-default/40 rounded text-sm font-semibold outline-none focus:ring-2 focus:ring-primary-default text-primary"
                            placeholder="قیمت تومان"
                            dir="ltr"
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            value={v.stock}
                            onChange={(e) => handleVariantChange(idx, "stock", e.target.value)}
                            className="w-24 px-3 py-1.5 bg-background border border-subtle rounded text-sm outline-none text-primary"
                            dir="ltr"
                            placeholder="تعداد"
                          />
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {v.imageUrl ? (
                              <div className="relative w-9 h-9 shrink-0 rounded-lg overflow-hidden border border-subtle group">
                                <img src={v.imageUrl} alt="" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => handleVariantChange(idx, "imageUrl", "")}
                                  className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  title="حذف تصویر"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : null}
                            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
                              <label className="px-2.5 py-1.5 bg-primary-default/10 text-primary-default hover:bg-primary-default/20 border border-primary-default/30 rounded-lg text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1 shrink-0">
                                <Upload className="w-3.5 h-3.5" />
                                <span>انتخاب فایل</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (e) => {
                                        const img = new Image();
                                        img.onload = () => {
                                          const canvas = document.createElement("canvas");
                                          let width = img.width;
                                          let height = img.height;
                                          const maxDim = 800;
                                          if (width > maxDim || height > maxDim) {
                                            if (width > height) {
                                              height = Math.round((height * maxDim) / width);
                                              width = maxDim;
                                            } else {
                                              width = Math.round((width * maxDim) / height);
                                              height = maxDim;
                                            }
                                          }
                                          canvas.width = width;
                                          canvas.height = height;
                                          const ctx = canvas.getContext("2d");
                                          if (ctx) {
                                            ctx.drawImage(img, 0, 0, width, height);
                                            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
                                            handleVariantChange(idx, "imageUrl", compressedDataUrl);
                                          }
                                        };
                                        img.src = e.target?.result as string;
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                              <input
                                type="text"
                                value={v.imageUrl || ""}
                                onChange={(e) => handleVariantChange(idx, "imageUrl", e.target.value)}
                                className="flex-1 px-2.5 py-1.5 bg-background border border-subtle rounded-lg text-xs outline-none text-primary"
                                dir="ltr"
                                placeholder="یا وارد کردن لینک تصویر"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = formData.variants.filter((_: any, i: number) => i !== idx);
                              setFormData({ ...formData, variants: updated });
                            }}
                            className="p-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors cursor-pointer"
                            title="حذف این تنوع"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {/* Step 4: Media */}
        <section className="space-y-5">
          <h3 className="text-lg font-bold text-primary mb-6 border-b pb-2 flex items-center gap-2">
             <span className="w-8 h-8 rounded-full bg-primary-default/10 text-primary-default flex items-center justify-center font-bold">4</span>
             تصاویر و ویدیو محصول
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-bold text-sm text-secondary mb-3">تصویر اصلی محصول</h4>
              <div className="aspect-square bg-surface border-2 border-dashed border-subtle rounded-2xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-primary-default transition-colors">
                {formData.mainImage ? (
                  <>
                    <img src={formData.mainImage} className="w-full h-full object-cover" alt="Main" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, mainImage: "" })}
                        className="p-3 bg-danger text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <ImagePlus className="w-10 h-10 mx-auto text-muted" />
                    <p className="text-sm font-semibold text-secondary">
                      افزودن تصویر اصلی محصول
                    </p>
                    <div className="flex flex-col gap-2 items-center">
                      <label className="px-4 py-2 bg-primary-default text-inverse hover:bg-primary-hover rounded-xl text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-sm">
                        <Upload className="w-4 h-4" />
                        <span>انتخاب فایل از سیستم</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                const img = new Image();
                                img.onload = () => {
                                  const canvas = document.createElement("canvas");
                                  let width = img.width;
                                  let height = img.height;
                                  const maxDim = 800;
                                  if (width > maxDim || height > maxDim) {
                                    if (width > height) {
                                      height = Math.round((height * maxDim) / width);
                                      width = maxDim;
                                    } else {
                                      width = Math.round((width * maxDim) / height);
                                      height = maxDim;
                                    }
                                  }
                                  canvas.width = width;
                                  canvas.height = height;
                                  const ctx = canvas.getContext("2d");
                                  if (ctx) {
                                    ctx.drawImage(img, 0, 0, width, height);
                                    const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
                                    setFormData({ ...formData, mainImage: compressedDataUrl });
                                  }
                                };
                                img.src = e.target?.result as string;
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt("آدرس URL تصویر اصلی را وارد کنید:");
                          if (url) setFormData({ ...formData, mainImage: url });
                        }}
                        className="text-xs text-primary-default hover:underline cursor-pointer"
                      >
                        یا وارد کردن آدرس اینترنتی (URL)
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-sm text-secondary mb-3">گالری تصاویر (حداکثر 4)</h4>
              <div className="grid grid-cols-2 gap-3">
                {formData.images.map((img, idx) => (
                  <div key={idx} className="aspect-square bg-surface rounded-xl relative overflow-hidden group">
                    <img src={img} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          const newImages = [...formData.images];
                          newImages.splice(idx, 1);
                          setFormData({ ...formData, images: newImages });
                        }}
                        className="p-2 bg-danger text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {formData.images.length < 4 && (
                  <div className="aspect-square bg-surface border-2 border-dashed border-subtle rounded-xl flex flex-col items-center justify-center hover:border-primary-default transition-colors p-3 text-center">
                    <Plus className="w-6 h-6 mb-1 text-muted" />
                    <label className="text-xs font-bold text-primary-default cursor-pointer hover:underline mb-1">
                      انتخاب از سیستم
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const img = new Image();
                              img.onload = () => {
                                const canvas = document.createElement("canvas");
                                let width = img.width;
                                let height = img.height;
                                const maxDim = 800;
                                if (width > maxDim || height > maxDim) {
                                  if (width > height) {
                                    height = Math.round((height * maxDim) / width);
                                    width = maxDim;
                                  } else {
                                    width = Math.round((width * maxDim) / height);
                                    height = maxDim;
                                  }
                                }
                                canvas.width = width;
                                canvas.height = height;
                                const ctx = canvas.getContext("2d");
                                if (ctx) {
                                  ctx.drawImage(img, 0, 0, width, height);
                                  const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.7);
                                  setFormData({ ...formData, images: [...formData.images, compressedDataUrl] });
                                }
                              };
                              img.src = e.target?.result as string;
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt("آدرس URL تصویر گالری را وارد کنید:");
                        if (url) setFormData({ ...formData, images: [...formData.images, url] });
                      }}
                      className="text-[10px] text-muted hover:underline cursor-pointer"
                    >
                      یا لینک اینترنتی
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 border-t border-subtle pt-6">
            <h4 className="font-bold text-sm text-secondary mb-3 flex items-center gap-2">
              <Video className="w-5 h-5 text-primary-default" />
              ویدیو معرفی محصول (انتخاب از فایل‌های سیستم یا لینک اینترنتی)
            </h4>
            
            <div className="bg-surface p-5 rounded-xl border border-subtle space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-subtle">
                <div>
                  <p className="text-xs font-bold text-primary">انتخاب و بارگذاری مستقیم ویدیو از کامپیوتر</p>
                  <p className="text-[11px] text-muted">پشتیبانی از فرمت‌های ویدیویی MP4، WebM، MOV</p>
                </div>
                <label className="px-4 py-2 bg-primary-default text-inverse hover:bg-primary-hover rounded-xl text-xs font-bold cursor-pointer transition-colors inline-flex items-center gap-1.5 shadow-sm shrink-0">
                  <Upload className="w-4 h-4" />
                  <span>انتخاب فایل ویدیو</span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 15 * 1024 * 1024) {
                          showNotification("حجم ویدیو نباید بیشتر از 15 مگابایت باشد. برای ویدیوهای بزرگتر از آدرس لینک استفاده کنید.", "error");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const result = event.target?.result as string;
                          setFormData({ ...formData, videoUrl: result });
                          showNotification("ویدیو با موفقیت از سیستم انتخاب شد", "success");
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-3 items-center pt-1">
                <span className="text-xs font-medium text-secondary">یا وارد کردن آدرس اینترنتی (لینک مستقیم):</span>
                <input
                  type="text"
                  placeholder="لینک مستقیم ویدیوی آپارات، یوتیوب یا فایل آنلاین"
                  value={formData.videoUrl.startsWith("data:video") ? "فایل ویدیویی از سیستم بارگذاری شده است" : formData.videoUrl}
                  onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                  disabled={formData.videoUrl.startsWith("data:video")}
                  className="flex-1 min-w-[240px] px-4 py-2.5 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none text-left text-xs font-mono text-primary disabled:opacity-75"
                  dir="ltr"
                />

                {formData.videoUrl && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, videoUrl: "" })}
                    className="px-3 py-2 bg-danger/10 text-danger hover:bg-danger/20 rounded-xl text-xs font-bold cursor-pointer transition-colors flex items-center gap-1"
                    title="حذف ویدیو"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف ویدیو</span>
                  </button>
                )}
              </div>

              {formData.videoUrl && (
                <div className="mt-3 border-t border-subtle pt-3">
                  <p className="text-xs font-bold text-primary-default mb-2 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-primary-default" />
                    پیش‌نمایش ویدیو:
                  </p>
                  {formData.videoUrl.startsWith("data:video") || formData.videoUrl.endsWith(".mp4") || formData.videoUrl.endsWith(".webm") || formData.videoUrl.includes("blob:") ? (
                    <video
                      src={formData.videoUrl}
                      controls
                      className="w-full max-h-72 rounded-xl bg-black border border-subtle shadow-inner"
                    />
                  ) : (
                    <div className="p-3 bg-background border border-subtle rounded-lg text-xs font-mono text-primary truncate" dir="ltr">
                      {formData.videoUrl}
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-muted mt-2">
              خریداران می‌توانند ویدیو محصول را به صورت مستقیم در صفحه جزئیات محصول یا بخش ویدیوها مشاهده نمایند.
            </p>
          </div>
        </section>
        {/* Live Marketplace Card Preview Section */}
        <section className="mt-8 border-t border-subtle pt-8 bg-surface/50 p-6 rounded-2xl border">
          <h4 className="font-bold text-base text-primary mb-2 flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary-default" />
            پیش‌نمایش آنلاین کارت محصول در خروجی فروشگاه Zopit
          </h4>
          <p className="text-xs text-muted mb-6">
            خریداران محصول شما را با این کادر، عنوان، قیمت و برچسب موجودی در ویترین فروشگاه مشاهده خواهند کرد:
          </p>

          <div className="max-w-xs mx-auto bg-card rounded-2xl border border-subtle overflow-hidden shadow-lg transition-transform hover:-translate-y-1">
            <div className="aspect-square bg-surface relative overflow-hidden flex items-center justify-center">
              {formData.mainImage ? (
                <img src={formData.mainImage} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4 text-muted">
                  <ImagePlus className="w-10 h-10 mx-auto mb-1 opacity-50" />
                  <span className="text-xs font-semibold">بدون تصویر اصلی</span>
                </div>
              )}
              <div className="absolute top-3 right-3 bg-emerald-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm">
                <CheckCircle className="w-3 h-3" />
                موجود در انبار
              </div>
            </div>

            <div className="p-4 space-y-2.5 text-right">
              {formData.brand && (
                <span className="text-[10px] font-bold text-primary-default bg-primary-default/10 px-2 py-0.5 rounded-md inline-block">
                  {formData.brand}
                </span>
              )}
              <h5 className="font-bold text-sm text-primary line-clamp-2">
                {formData.name || "عنوان محصول وارد نشده است"}
              </h5>
              
              <div className="flex items-center justify-between border-t border-subtle pt-3 mt-2">
                <span className="text-xs text-muted font-medium">قیمت پایه:</span>
                <span className="font-mono font-bold text-sm text-primary">
                  {formData.supplierBasePrice ? `${Number(formData.supplierBasePrice).toLocaleString('fa-IR')} تومان` : 'نامشخص'}
                </span>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Footer Controls */}
      <div className="p-6 border-t border-subtle flex justify-between items-center bg-card rounded-b-2xl mt-4">
        <button
          onClick={onCancel}
          className="px-6 py-2.5 rounded-xl text-sm font-medium text-text-secondary bg-surface hover:bg-surface-hover transition-colors flex items-center gap-2 cursor-pointer"
        >
          انصراف
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-8 py-3 rounded-xl text-sm font-extrabold text-inverse bg-primary-default hover:bg-primary-hover transition-all shadow-lg shadow-primary-default/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
             <CheckCircle className="w-4 h-4" />
          )}
          {initialData?.id ? "ویرایش نهایی" : "ثبت نهایی محصول"}
        </button>
      </div>
    </div>
  );
}
