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
  Check,
  Globe,
  MessageCircle,
  Gift,
  Send,
  Search
} from "lucide-react";
import { SupplierWooCommerceImport } from "./SupplierWooCommerceImport";

export function SupplierAddProduct({
  onSuccess,
  onCancel,
  showNotification,
  initialData,
  onNavigateToTickets,
  user,
}: any) {
  const [activeAddTab, setActiveAddTab] = useState<"manual" | "woocommerce" | "excel" | "support">("manual");
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWcImport, setShowWcImport] = useState(false);

  // Support Request Tab State
  const [supportTitle, setSupportTitle] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [supportNote, setSupportNote] = useState("");
  const [supportFile, setSupportFile] = useState<File | null>(null);
  const [isSendingSupport, setIsSendingSupport] = useState(false);

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

  const CANONICAL_CATEGORIES = [
    { id: 1, name: "موبایل و تبلت", icon: "📱" },
    { id: 2, name: "لپ‌تاپ و کامپیوتر", icon: "💻" },
    { id: 3, name: "کالای دیجیتال و جانبی", icon: "🎧" },
    { id: 4, name: "خانه و آشپزخانه", icon: "🏠" },
    { id: 5, name: "لوازم خانگی برقی", icon: "⚡" },
    { id: 6, name: "آرایشی و بهداشتی", icon: "💄" },
    { id: 7, name: "مد و پوشاک", icon: "👔" },
    { id: 8, name: "طلا و زیورآلات", icon: "💍" },
    { id: 9, name: "خودرو و ابزارآلات", icon: "🚗" },
    { id: 10, name: "سلامت و تجهیزات پزشکی", icon: "🩺" },
    { id: 11, name: "ابزارآلات و تجهیزات", icon: "🔧" },
    { id: 12, name: "کتاب، هنر و لوازم تحریر", icon: "📚" },
    { id: 13, name: "ورزش و سفر", icon: "⚽" },
    { id: 14, name: "اسباب بازی، کودک و نوزاد", icon: "🧸" },
    { id: 15, name: "محصولات بومی و محلی", icon: "🍯" },
    { id: 16, name: "پت شاپ و حیوانات خانگی", icon: "🐾" }
  ];

  const CANONICAL_MAPPING: Record<string, string> = {
    "موبایل": "موبایل و تبلت",
    "تبلت": "موبایل و تبلت",
    "قاب و گلس": "موبایل و تبلت",
    "لوازم جانبی موبایل": "موبایل و تبلت",
    "لپ‌تاپ": "لپ‌تاپ و کامپیوتر",
    "کامپیوتر": "لپ‌تاپ و کامپیوتر",
    "کالای دیجیتال": "کالای دیجیتال و جانبی",
    "دیجیتال": "کالای دیجیتال و جانبی",
    "کابل و شارژر": "کالای دیجیتال و جانبی",
    "لوازم جانبی": "کالای دیجیتال و جانبی",
    "دیجیتال و لوازم الکترونیکی": "کالای دیجیتال و جانبی",
    "طلا و نقره": "طلا و زیورآلات",
    "طلا": "طلا و زیورآلات",
    "نقره": "طلا و زیورآلات",
    "خودرو و موتورسیکلت": "خودرو و ابزارآلات",
    "لوازم جانبی خودرو": "خودرو و ابزارآلات",
    "سلامت و پزشکی": "سلامت و تجهیزات پزشکی",
    "کتاب و هنر": "کتاب، هنر و لوازم تحریر",
    "اسباب بازی کودک و نوزاد": "اسباب بازی، کودک و نوزاد",
    "پت شاپ": "پت شاپ و حیوانات خانگی"
  };

  const [categories, setCategories] = useState<any[]>(CANONICAL_CATEGORIES);
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"stepper" | "all">("stepper");
  
  React.useEffect(() => {
    (async () => {
      try {
        let fetchedList: any[] = [];
        const res = await fetch("/api/public/categories");
        if (res.ok) {
          const data = await res.json();
          fetchedList = Array.isArray(data) ? data : (data?.categories || []);
        }
        if (!fetchedList || fetchedList.length === 0) {
          const res2 = await fetch("/api/categories");
          if (res2.ok) {
            const data2 = await res2.json();
            fetchedList = Array.isArray(data2) ? data2 : (data2?.categories || []);
          }
        }

        if (fetchedList && fetchedList.length > 0) {
          // Normalize and deduplicate into strictly the 16 canonical categories
          const uniqueMap = new Map();
          fetchedList.forEach((cat: any) => {
            const rawName = (cat.name || cat.title || cat.categoryName || "").trim();
            const normalizedName = CANONICAL_MAPPING[rawName] || rawName;
            if (normalizedName && !uniqueMap.has(normalizedName)) {
              const matchedCanonical = CANONICAL_CATEGORIES.find(c => c.name === normalizedName);
              uniqueMap.set(normalizedName, {
                id: cat.id,
                name: normalizedName,
                icon: matchedCanonical?.icon || "📦"
              });
            }
          });

          // Ensure any missing canonical categories are also present
          CANONICAL_CATEGORIES.forEach(c => {
            if (!uniqueMap.has(c.name)) {
              uniqueMap.set(c.name, {
                id: c.id,
                name: c.name,
                icon: c.icon
              });
            }
          });

          const uniqueList = Array.from(uniqueMap.values());
          if (uniqueList.length > 0) {
            setCategories(uniqueList);
            setFormData(prev => ({ ...prev, categoryId: prev.categoryId || String(uniqueList[0].id) }));
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
    isWholesaleEnabled: initialData?.isWholesaleEnabled || false,
    wholesaleMinQty: initialData?.wholesaleMinQty?.toString() || "",
    wholesaleUnitPrice: initialData?.wholesaleUnitPrice?.toString() || "",
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
    setStep((prev) => Math.min(prev + 1, 4));
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

      const calculatedSupplierCode = user?.supplierCode || user?.code || (user?.id ? `ZP-${String(user.id).padStart(4, "0")}` : "ZP-8402");

      const payload = {
        ...formData,
        supplierCode: calculatedSupplierCode,
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
    "اطلاعات اصلی و دسته‌بندی",
    "قیمت و موجودی",
    "تنوع و متغیرها",
    "رسانه و پیش‌نمایش نهایی",
  ];

  return (
    <div className="bg-transparent max-w-6xl mx-auto my-6 space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Package className="w-5 h-5" />
            </span>
            {initialData?.id ? "ویرایش محصول" : "افزودن محصول جدید"}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            از روش‌های زیر می‌توانید محصول خود را در پلتفرم ثبت یا ویرایش کنید
          </p>
        </div>

        {initialData?.id && (
          <span className="px-4 py-2 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border-2 border-amber-300 dark:border-amber-800 rounded-2xl text-xs font-black shadow-xs">
            در حال ویرایش کد کالا #{initialData.id}
          </span>
        )}
      </div>

      {/* 4 Navigation Tabs Bar (Distinct container) */}
      {!initialData?.id && (
        <div className="p-3 bg-slate-100 dark:bg-slate-800/90 rounded-3xl border-2 border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => setActiveAddTab("manual")}
              className={`py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                activeAddTab === "manual"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.01]"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <FileUp className="w-4 h-4" />
              <span>۱. ثبت فرم دستی هوشمند</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAddTab("woocommerce")}
              className={`py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                activeAddTab === "woocommerce"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.01]"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>۲. دریافت از ووکامرس (API)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAddTab("excel")}
              className={`py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                activeAddTab === "excel"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.01]"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>۳. فایل اکسل / CSV</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAddTab("support")}
              className={`py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2.5 cursor-pointer ${
                activeAddTab === "support"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-[1.01]"
                  : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700"
              }`}
            >
              <Gift className="w-4 h-4 text-amber-400" />
              <span>۴. درخواست ثبت پشتیبانی</span>
            </button>
          </div>
        </div>
      )}

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

      {/* Conditional Tab Contents */}
      {activeAddTab === "woocommerce" && !initialData?.id ? (
        <div className="p-6 animate-fade-in">
          <SupplierWooCommerceImport
            onSuccess={onSuccess}
            onCancel={onCancel}
            showNotification={showNotification}
          />
        </div>
      ) : activeAddTab === "excel" && !initialData?.id ? (
        /* Tab 3: Excel Upload Box & Sample Excel Button */
        <div className="p-8 space-y-6 animate-fade-in">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 p-6 rounded-2xl border border-indigo-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-primary flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                بارگذاری گروهی محصولات با فایل اکسل یا CSV
              </h3>
              <p className="text-xs text-muted mt-1">
                کافیست فایل لیست محصولات خود را بارگذاری کنید تا اقلام آن استخراج و ثبت شوند.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadSampleCsv}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Download className="w-4 h-4 text-indigo-600" />
              <span>دانلود فایل نمونه اکسل استاندارد</span>
            </button>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-300 dark:border-indigo-800 hover:border-indigo-600 dark:hover:border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 rounded-3xl p-10 text-center cursor-pointer transition-all space-y-4 group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv,.txt,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              className="hidden"
            />
            <div className="w-16 h-16 bg-indigo-600/10 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
              <FileUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm sm:text-base font-bold text-primary">
                فایل اکسل (.xlsx) یا CSV خود را به این کادر بکشید یا برای انتخاب کلیک کنید
              </p>
              <p className="text-xs text-muted mt-1">
                فرمت استاندارد شامل ستون‌های: نام محصول، دسته‌بندی، مدل، رنگ، قیمت عمده و موجودی می‌باشد.
              </p>
            </div>
          </div>
        </div>
      ) : activeAddTab === "support" && !initialData?.id ? (
        /* Tab 4: Support Request */
        <div className="p-8 space-y-6 animate-fade-in">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-6 rounded-2xl space-y-2">
            <h3 className="text-base font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-500" />
              خدمت ویژه: ثبت رایگان کاتالوگ و لیست محصولات توسط پشتیبانی زوپیت
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
              اگر تعداد محصولات شما زیاد است یا فایل کاتالوگ PDF/اکسل/تصاویر دارید، نیازی به ثبت تک‌تک نیست! فایل یا کاتالوگ خود را آپلود کنید تا تیم پشتیبانی ما اقلام شما را به صورت کاملا رایگان ثبت نماید.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!supportTitle) {
                showNotification("لطفاً عنوان درخواست یا نام فروشگاه را وارد فرمایید.", "error");
                return;
              }
              setIsSendingSupport(true);
              setTimeout(() => {
                setIsSendingSupport(false);
                setSupportTitle("");
                setSupportPhone("");
                setSupportNote("");
                setSupportFile(null);
                showNotification("درخواست ثبت کاتالوگ شما ثبت شد. کارشناسان پشتیبانی زوپیت بزودی با شما تماس خواهند گرفت.", "success");
              }, 1000);
            }}
            className="bg-card p-6 rounded-2xl border border-subtle space-y-5"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-primary mb-1.5">
                  عنوان درخواست / نام فروشگاه یا برند *
                </label>
                <input
                  type="text"
                  required
                  value={supportTitle}
                  onChange={(e) => setSupportTitle(e.target.value)}
                  placeholder="مثلا: ثبت لیست ۵۰ قلمی لوازم جانبی موبایل زاگرس"
                  className="w-full px-4 py-3 bg-background border border-subtle rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary mb-1.5">
                  شماره تماس جهت هماهنگی (اختیاری)
                </label>
                <input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="۰۹۱۲..."
                  className="w-full px-4 py-3 bg-background border border-subtle rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-primary mb-1.5">
                توضیحات و راهنمای ثبت کاتالوگ
              </label>
              <textarea
                value={supportNote}
                onChange={(e) => setSupportNote(e.target.value)}
                placeholder="توضیحات بیشتر درباره قیمت‌ها، تخفیف‌ها یا دسته‌بندی اقلام کاتالوگ..."
                className="w-full px-4 py-3 bg-background border border-subtle rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-indigo-500 h-28 resize-none"
              ></textarea>
            </div>

            <div>
              <label className="block text-xs font-bold text-primary mb-1.5">
                آپلود فایل کاتالوگ / اکسل / PDF یا زیپ تصاویر (تا ۵۰ مگابایت)
              </label>
              <div className="border-2 border-dashed border-subtle hover:border-indigo-500 bg-surface rounded-2xl p-6 text-center cursor-pointer transition-colors relative">
                <input
                  type="file"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setSupportFile(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <Upload className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-primary">
                  {supportFile ? `فایل انتخاب شد: ${supportFile.name}` : "برای انتخاب فایل کاتالوگ کلیک کنید"}
                </p>
                <p className="text-[11px] text-muted mt-1">فرمت‌های مجاز: PDF, XLSX, ZIP, RAR, PNG, JPG</p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSendingSupport}
              className="w-full py-3.5 bg-primary-default hover:bg-primary-hover text-white font-black text-sm rounded-xl shadow-md shadow-primary-default/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSendingSupport ? "در حال ارسال درخواست..." : "ارسال درخواست ثبت کاتالوگ به پشتیبانی"}</span>
            </button>
          </form>
        </div>
      ) : (
        /* Tab 1: Manual Form (Default) */
        <div className="p-4 sm:p-8 space-y-8 min-h-[400px]">

          {/* Stepper Header & View Mode Switcher (Distinct elevated card) */}
          <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border-2 border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1">
              {[
                { id: 1, title: "اطلاعات و دسته‌بندی", isDone: !!(formData.name.trim() && formData.categoryId) },
                { id: 2, title: "قیمت و انبارداری", isDone: !!(formData.supplierBasePrice && (Number(formData.stock) > 0 || formData.variants.length > 0)) },
                { id: 3, title: "تنوع و متغیرها", isDone: formData.variants.length > 0 },
                { id: 4, title: "رسانه و بازبینی", isDone: !!formData.mainImage }
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStep(s.id)}
                  className={`p-3 rounded-2xl border-2 text-right transition-all flex items-center gap-2.5 cursor-pointer shadow-xs ${
                    step === s.id
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/25 scale-[1.02]"
                      : s.isDone
                      ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100"
                      : "bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${
                    step === s.id
                      ? "bg-white text-indigo-700"
                      : s.isDone
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                  }`}>
                    {s.isDone && step !== s.id ? <Check className="w-4 h-4 stroke-[3]" /> : s.id}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-[10px] font-bold ${step === s.id ? "text-indigo-100" : "text-slate-500 dark:text-slate-400"}`}>گام {s.id}</p>
                    <p className="text-xs font-black truncate">{s.title}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 self-end md:self-center border-2 border-slate-200 dark:border-slate-700 rounded-2xl p-1 bg-slate-100 dark:bg-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("stepper")}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  viewMode === "stepper"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                گام‌به‌گام
              </button>
              <button
                type="button"
                onClick={() => setViewMode("all")}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  viewMode === "all"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                نمایش کامل
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form Steps */}
            <div className="lg:col-span-8 space-y-8">
              
              {/* Step 1: Basic Info & Category */}
              {(viewMode === "all" || step === 1) && (
                <section className="space-y-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
                  <div className="border-b-2 border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm shadow-indigo-600/30">
                        ۱
                      </span>
                      اطلاعات اصلی و دسته‌بندی محصول
                    </h3>
                    <span className="text-xs font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                      گام ۱ از ۴
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                      نام محصول *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 outline-none text-slate-900 dark:text-white font-bold text-sm transition-all"
                      placeholder="مثال: هندزفری بلوتوثی پرو پلاس مدل ۲۰۲۴"
                    />
                  </div>

                  {/* Compact & Attractive Category Selector */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <label className="text-xs sm:text-sm font-bold text-secondary">
                        دسته‌بندی محصول *
                      </label>
                      <span className="text-[11px] text-muted font-normal">
                        ۱۶ دسته‌بندی استاندارد و بدون تکرار زوپیت
                      </span>
                    </div>

                    {/* Selected Category Compact View (Zero vertical waste) */}
                    {formData.categoryId && !isCategoryPickerOpen ? (
                      <div className="flex items-center justify-between p-3 bg-primary-default/5 border border-primary-default/20 rounded-2xl transition-all shadow-xs">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl p-2 bg-card rounded-xl border border-subtle shadow-xs">
                            {(() => {
                              const found = categories.find(c => String(c.id) === String(formData.categoryId)) ||
                                CANONICAL_CATEGORIES.find(c => String(c.id) === String(formData.categoryId));
                              return found?.icon || "📦";
                            })()}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted font-medium">دسته‌بندی انتخاب‌شده:</span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                <CheckCircle className="w-3 h-3" />
                                تایید شده
                              </span>
                            </div>
                            <span className="text-sm font-black text-primary block mt-0.5">
                              {(() => {
                                const found = categories.find(c => String(c.id) === String(formData.categoryId)) ||
                                  CANONICAL_CATEGORIES.find(c => String(c.id) === String(formData.categoryId));
                                return found?.name || "دسته‌بندی";
                              })()}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsCategoryPickerOpen(true)}
                          className="px-3.5 py-2 bg-card hover:bg-surface text-primary-default border border-primary-default/30 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1"
                        >
                          <span>تغییر دسته‌بندی</span>
                        </button>
                      </div>
                    ) : (
                      /* Expandable Searchable Clean Category Grid */
                      <div className="p-4 bg-surface rounded-2xl border border-subtle space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={categorySearchQuery}
                              onChange={(e) => setCategorySearchQuery(e.target.value)}
                              placeholder="جستجوی سریع در ۱۶ دسته‌بندی اصلی زوپیت..."
                              className="w-full pl-3 pr-9 py-2.5 bg-card border border-subtle rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-primary-default text-primary"
                            />
                            <Search className="w-4 h-4 text-muted absolute right-3 top-3" />
                            {categorySearchQuery && (
                              <button
                                type="button"
                                onClick={() => setCategorySearchQuery("")}
                                className="absolute left-3 top-3 text-muted hover:text-primary cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          {formData.categoryId && (
                            <button
                              type="button"
                              onClick={() => setIsCategoryPickerOpen(false)}
                              className="px-3 py-2 text-xs text-muted hover:text-primary font-bold cursor-pointer rounded-lg hover:bg-card shrink-0"
                            >
                              بستن
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
                          {categories
                            .filter(c => !categorySearchQuery.trim() || (c.name || "").toLowerCase().includes(categorySearchQuery.trim().toLowerCase()))
                            .map((cat) => {
                              const isSelected = String(cat.id) === formData.categoryId;
                              return (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => {
                                    setFormData({ ...formData, categoryId: String(cat.id) });
                                    setIsCategoryPickerOpen(false);
                                    setCategorySearchQuery("");
                                  }}
                                  className={`p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border text-right ${
                                    isSelected
                                      ? "bg-primary-default text-white border-primary-default shadow-sm scale-[1.02]"
                                      : "bg-card text-secondary hover:bg-background border-subtle hover:border-primary-default/40"
                                  }`}
                                >
                                  <span className="text-lg">{cat.icon || "📦"}</span>
                                  <span className="truncate flex-1">{cat.name}</span>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-white shrink-0" />}
                                </button>
                              );
                            })}
                        </div>
                      </div>
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
      )}

      {/* Step 2: Price & Inventory */}
      {(viewMode === "all" || step === 2) && (
        <section className="space-y-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
          <div className="border-b-2 border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm shadow-indigo-600/30">
                ۲
              </span>
              قیمت‌گذاری و انبارداری
            </h3>
            <span className="text-xs font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
              گام ۲ از ۴
            </span>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-950/60 p-4 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 mb-6">
            <p className="text-xs sm:text-sm text-indigo-900 dark:text-indigo-200 font-bold flex items-start gap-2.5">
              <Info className="w-5 h-5 shrink-0 text-indigo-600" />
              <span>
                توجه: مبلغ وارد شده به عنوان "قیمت پایه تامین‌کننده" مبلغی است که با شما تسویه می‌شود. قیمت نهایی برای مشتری توسط پلتفرم محاسبه و تعیین می‌گردد.
              </span>
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
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
                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 outline-none text-left font-mono font-black text-slate-900 dark:text-white text-base transition-all"
                dir="ltr"
                placeholder="مثلاً: 1250000 یا ۱,۲۵۰,۰۰۰"
              />
              <div className="mt-2.5 space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                  {formData.supplierBasePrice ? `مبلغ به عدد: ${Number(toEnglishDigits(formData.supplierBasePrice) || 0).toLocaleString('fa-IR')} تومان` : 'مبلغ را به تومان وارد کنید'}
                </p>
                {formData.supplierBasePrice && Number(toEnglishDigits(formData.supplierBasePrice)) > 0 && (
                  <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/60 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl text-xs space-y-1 shadow-xs">
                    <span className="text-slate-700 dark:text-slate-300 block font-bold">مبلغ به حروف:</span>
                    <span className="text-indigo-700 dark:text-indigo-300 font-black text-sm block">
                      {numberToWords(formData.supplierBasePrice)} تومان
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mb-2">
                موجودی اولیه (تعداد در انبار) *
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
                }
                className="w-full px-4 py-3 bg-white dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-2xl focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 outline-none text-left font-mono font-black text-slate-900 dark:text-white text-base transition-all"
                dir="ltr"
                disabled={formData.variants.length > 0}
                placeholder="مثلاً: 10"
              />
              {formData.variants.length > 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-bold">
                  موجودی کل از مجموع تعداد متغیرهای مرحله ۳ محاسبه می‌گردد.
                </p>
              )}
            </div>
          </div>

          {/* Wholesale Pricing Tier Section */}
          <div className="bg-surface p-4 rounded-xl border border-subtle space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                  <span>📦 قیمت‌گذاری عمده (تخفیف تعداد بالا)</span>
                </h4>
                <p className="text-xs text-muted mt-0.5">
                  امکان تعیین قیمت ویژه برای سفارشات با تعداد بالا
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isWholesaleEnabled}
                  onChange={(e) => setFormData({ ...formData, isWholesaleEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {formData.isWholesaleEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-subtle animate-fade-in">
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    حداقل تعداد برای خرید عمده (عدد)
                  </label>
                  <input
                    type="number"
                    min="2"
                    value={formData.wholesaleMinQty}
                    onChange={(e) => setFormData({ ...formData, wholesaleMinQty: e.target.value })}
                    placeholder="مثلا: 10"
                    className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-primary mb-1">
                    قیمت واحد در خرید عمده (تومان)
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.wholesaleUnitPrice}
                    onChange={(e) => setFormData({ ...formData, wholesaleUnitPrice: e.target.value })}
                    placeholder="مثلا: 1100000"
                    className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>
            )}
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
      )}

      {/* Step 3: Variants */}
      {(viewMode === "all" || step === 3) && (
        <section className="space-y-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
          <div className="border-b-2 border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm shadow-indigo-600/30">
                ۳
              </span>
              تنوع و ویژگی‌های متغیر (رنگ، سایز، مدل)
            </h3>
            <span className="text-xs font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
              گام ۳ از ۴
            </span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border-2 border-slate-200 dark:border-slate-700 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2 text-sm">
                <List className="w-5 h-5 text-indigo-600" />
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
      )}

      {/* Step 4: Media & Final Review */}
      {(viewMode === "all" || step === 4) && (
        <section className="space-y-6 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
          <div className="border-b-2 border-slate-100 dark:border-slate-800 pb-4 flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm shadow-indigo-600/30">
                ۴
              </span>
              تصاویر، ویدیو و رسانه‌های محصول
            </h3>
            <span className="text-xs font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
              گام ۴ از ۴
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white mb-3">تصویر اصلی محصول</h4>
              <div className="aspect-square bg-slate-50 dark:bg-slate-950 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden group hover:border-indigo-600 transition-colors">
                {formData.mainImage ? (
                  <>
                    <img src={formData.mainImage} className="w-full h-full object-cover" alt="Main" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, mainImage: "" })}
                        className="p-3 bg-rose-600 text-white rounded-full hover:bg-rose-700 transition-colors cursor-pointer shadow-lg"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 space-y-3">
                    <ImagePlus className="w-12 h-12 mx-auto text-slate-400" />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      افزودن تصویر اصلی محصول
                    </p>
                    <div className="flex flex-col gap-2 items-center">
                      <label className="px-5 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-2xl text-xs font-black cursor-pointer transition-all inline-flex items-center gap-2 shadow-md shadow-indigo-600/25">
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
      )}

            </div>

            {/* Right Column: Live Quality Score & Real-Time Card Preview */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
              
              {/* Quality & Completion Score Card */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    کیفیت اطلاعات محصول
                  </span>
                  <span className="text-xs font-black px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                    {(() => {
                      let score = 0;
                      if (formData.name.trim()) score += 25;
                      if (formData.categoryId) score += 25;
                      if (formData.supplierBasePrice && Number(toEnglishDigits(formData.supplierBasePrice)) > 0) score += 25;
                      if (formData.mainImage) score += 25;
                      return score;
                    })()}%
                  </span>
                </div>

                {/* Animated Progress bar */}
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div
                    className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                    style={{
                      width: `${(() => {
                        let score = 0;
                        if (formData.name.trim()) score += 25;
                        if (formData.categoryId) score += 25;
                        if (formData.supplierBasePrice && Number(toEnglishDigits(formData.supplierBasePrice)) > 0) score += 25;
                        if (formData.mainImage) score += 25;
                        return score;
                      })()}%`
                    }}
                  />
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className={`flex items-center gap-2.5 ${formData.name.trim() ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-slate-400 dark:text-slate-500"}`}>
                    <CheckCircle className={`w-4 h-4 shrink-0 ${formData.name.trim() ? "text-emerald-600 dark:text-emerald-400" : "text-slate-300 dark:text-slate-600"}`} />
                    <span>عنوان کامل و جذاب محصول</span>
                  </div>
                  <div className={`flex items-center gap-2.5 ${formData.categoryId ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-slate-400 dark:text-slate-500"}`}>
                    <CheckCircle className={`w-4 h-4 shrink-0 ${formData.categoryId ? "text-emerald-600 dark:text-emerald-400" : "text-slate-300 dark:text-slate-600"}`} />
                    <span>انتخاب دسته‌بندی مناسب</span>
                  </div>
                  <div className={`flex items-center gap-2.5 ${formData.supplierBasePrice && Number(toEnglishDigits(formData.supplierBasePrice)) > 0 ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-slate-400 dark:text-slate-500"}`}>
                    <CheckCircle className={`w-4 h-4 shrink-0 ${formData.supplierBasePrice && Number(toEnglishDigits(formData.supplierBasePrice)) > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-slate-300 dark:text-slate-600"}`} />
                    <span>قیمت‌گذاری پایه تامین‌کننده</span>
                  </div>
                  <div className={`flex items-center gap-2.5 ${formData.mainImage ? "text-emerald-700 dark:text-emerald-400 font-bold" : "text-slate-400 dark:text-slate-500"}`}>
                    <CheckCircle className={`w-4 h-4 shrink-0 ${formData.mainImage ? "text-emerald-600 dark:text-emerald-400" : "text-slate-300 dark:text-slate-600"}`} />
                    <span>تصویر باکیفیت و واضح</span>
                  </div>
                </div>
              </div>

              {/* Live Card Preview in Store */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
                <div className="flex items-center justify-between pb-3 border-b-2 border-slate-100 dark:border-slate-800">
                  <h4 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-600" />
                    نمای کارت در ویترین زوپیت
                  </h4>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">پیش‌نمایش زنده</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
                  <div className="aspect-square bg-slate-200 dark:bg-slate-900 relative overflow-hidden flex items-center justify-center">
                    {formData.mainImage ? (
                      <img src={formData.mainImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4 text-slate-400">
                        <ImagePlus className="w-10 h-10 mx-auto mb-1 opacity-50" />
                        <span className="text-xs font-bold">بدون تصویر اصلی</span>
                      </div>
                    )}
                    <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 shadow-sm">
                      <CheckCircle className="w-3 h-3" />
                      موجود در انبار
                    </div>
                  </div>

                  <div className="p-4 space-y-2 text-right">
                    <div className="flex items-center justify-between gap-1">
                      {formData.brand && (
                        <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 rounded-lg">
                          {formData.brand}
                        </span>
                      )}
                      {formData.categoryId && (
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                          {(() => {
                            const found = categories.find(c => String(c.id) === String(formData.categoryId)) ||
                              CANONICAL_CATEGORIES.find(c => String(c.id) === String(formData.categoryId));
                            return found?.name || "";
                          })()}
                        </span>
                      )}
                    </div>
                    <h5 className="font-black text-xs text-slate-900 dark:text-white line-clamp-2 min-h-[32px] leading-relaxed">
                      {formData.name || "عنوان محصول وارد نشده است"}
                    </h5>
                    
                    <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-2.5 mt-2">
                      <span className="text-[11px] text-slate-600 dark:text-slate-400 font-bold">قیمت پایه:</span>
                      <span className="font-mono font-black text-xs text-indigo-700 dark:text-indigo-400">
                        {formData.supplierBasePrice ? `${Number(toEnglishDigits(formData.supplierBasePrice) || 0).toLocaleString('fa-IR')} تومان` : 'نامشخص'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contextual Supplier Hint */}
              <div className="bg-indigo-50 dark:bg-indigo-950/60 p-5 rounded-3xl border-2 border-indigo-200 dark:border-indigo-800 space-y-2">
                <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600" />
                  راهنمای گام {step}:
                </span>
                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-medium">
                  {step === 1 && "انتخاب دقیق دسته‌بندی و عنوان واضح باعث افزایش نمایش محصول در نتایج جستجو و فروش بیشتر خواهد شد."}
                  {step === 2 && "مبلغ پایه تامین‌کننده، دریافتی خالص شماست. هزینه‌های ارسال و پورسانت توسط سامانه افزوده می‌شود."}
                  {step === 3 && "اگر محصول چند رنگ یا مدل مختلف دارد، متغیرها را اضافه کنید تا مشتری تنوع کالا را مشاهده کند."}
                  {step === 4 && "تصاویر باکیفیت و پس‌زمینه سفید یا خنثی شانس خرید محصول را چند برابر می‌کند."}
                </p>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* Footer Controls & Stepper Navigation */}
      <div className="p-4 sm:p-6 border-t-2 border-slate-200 dark:border-slate-800 flex flex-wrap justify-between items-center gap-3 bg-white dark:bg-slate-900 rounded-b-3xl mt-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
          >
            انصراف
          </button>

          {viewMode === "stepper" && step > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
              <span>مرحله قبل</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {viewMode === "stepper" && step < 4 ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-6 py-2.5 rounded-2xl text-xs sm:text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-md shadow-indigo-600/25 cursor-pointer flex items-center gap-2"
            >
              <span>گام بعدی: {step === 1 ? "قیمت و موجودی" : step === 2 ? "تنوع و متغیرها" : "رسانه و بازبینی"}</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-3 rounded-2xl text-xs sm:text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>{initialData?.id ? "ذخیره تغییرات محصول" : "ثبت و تایید نهایی محصول"}</span>
            </button>
          )}
        </div>
      </div>

      {/* WooCommerce Import Modal */}
      {showWcImport && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-6xl w-full my-auto max-h-[92vh] overflow-y-auto bg-card rounded-3xl p-2 border border-subtle shadow-2xl">
            <SupplierWooCommerceImport
              onSuccess={() => {
                setShowWcImport(false);
                onSuccess();
              }}
              onCancel={() => setShowWcImport(false)}
              showNotification={showNotification}
            />
          </div>
        </div>
      )}
    </div>
  );
}
