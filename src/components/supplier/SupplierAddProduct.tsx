import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Plus,
  Trash2,
  CheckCircle,
  Package,
  Layers,
  Sparkles,
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
  Globe,
  MessageCircle,
  Gift,
  Send,
  Video,
  Edit3,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  Save,
  Sliders,
  Award
} from "lucide-react";
import { toast } from "../GlobalToast";
import { numberToWords } from "../../utils/numberToWords";
import { SupplierWooCommerceImport } from "./SupplierWooCommerceImport";
import { SupplierBulkImport } from "./SupplierBulkImport";
import { SupplierProductCreationHome } from "./product-creation/SupplierProductCreationHome";
import {
  ProductQualityScoreBadge,
  computeProductQuality
} from "./product-creation/ProductQualityScoreBadge";
import { ProductImageUploader } from "./product-creation/ProductImageUploader";
import { ProductAIAssistModal } from "./product-creation/ProductAIAssistModal";
import {
  ProductWholesalePricing,
  toEnglishDigits
} from "./product-creation/ProductWholesalePricing";
import { ProductWarrantyAuthenticity } from "./product-creation/ProductWarrantyAuthenticity";
import { ProductMarketplacePreview } from "./product-creation/ProductMarketplacePreview";
import { ProductSubmissionCelebration } from "./product-creation/ProductSubmissionCelebration";

interface SupplierAddProductProps {
  onSuccess: () => void;
  onCancel: () => void;
  showNotification?: (msg: string, type?: "success" | "error" | "info") => void;
  initialData?: any;
  onNavigateToTickets?: () => void;
  onNavigateToBulkImport?: () => void;
  onNavigateToConciergeImport?: () => void;
}

export function SupplierAddProduct({
  onSuccess,
  onCancel,
  showNotification: propShowNotification,
  initialData,
  onNavigateToTickets,
  onNavigateToBulkImport,
  onNavigateToConciergeImport,
}: SupplierAddProductProps) {
  const notify = (msg: string, type: "success" | "error" | "info" = "info") => {
    if (propShowNotification) {
      propShowNotification(msg, type);
    } else {
      if (type === "success") toast.success(msg);
      else if (type === "error") toast.error(msg);
      else toast.info(msg);
    }
  };

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWcImport, setShowWcImport] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [createdProductName, setCreatedProductName] = useState("");
  const [selectedMode, setSelectedMode] = useState<string | null>(
    initialData?.id ? "MANUAL" : null
  );

  const [categories, setCategories] = useState<any[]>([]);

  /* Form Data State */
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    shortDescription:
      initialData?.shortDescription || initialData?.longDescription || "",
    longDescription:
      initialData?.longDescription || initialData?.shortDescription || "",
    categoryId: initialData?.categoryId?.toString() || "",
    brand: initialData?.brand || "",
    sku: initialData?.sku || "",
    supplierBasePrice: initialData?.supplierBasePrice?.toString() || "",
    discount: initialData?.discount?.toString() || "",
    stock:
      initialData?.variants && initialData.variants.length > 0
        ? initialData.variants
            .reduce(
              (sum: number, v: any) =>
                sum + (parseInt(toEnglishDigits(v.stock), 10) || 0),
              0
            )
            .toString()
        : initialData?.inventory?.toString() || "10",
    minStock: "",
    images: Array.isArray(initialData?.images)
      ? initialData.images.map((img: any) =>
          typeof img === "string" ? img : img?.url || ""
        )
      : initialData?.imageUrl || initialData?.mainImage
      ? [initialData.imageUrl || initialData.mainImage]
      : [],
    mainImage:
      Array.isArray(initialData?.images) && initialData.images.length > 0
        ? typeof initialData.images[0] === "string"
          ? initialData.images[0]
          : initialData.images[0]?.url || ""
        : initialData?.imageUrl || initialData?.mainImage || "",
    variants: (initialData?.variants || []).map((v: any) => {
      let attrs = v.attributes || {};
      if (typeof v.attributes === "string") {
        try {
          attrs = JSON.parse(v.attributes);
        } catch {
          attrs = {};
        }
      }
      return {
        ...v,
        attributes: attrs,
      };
    }),
    videoUrl: initialData?.exploreContent?.customVideoUrl || "",
    warranty: initialData?.warranty || "ضمانت سلامت فیزیکی",
    warrantyDuration: initialData?.warrantyDuration || "۷ روز مهلت تست فنی",
    warrantyProvider: initialData?.warrantyProvider || "",
    warrantyType: initialData?.warrantyType || "تعویض کالا در صورت خرابی",
    isAuthenticGuaranteed:
      initialData?.isAuthenticGuaranteed !== undefined
        ? Boolean(initialData.isAuthenticGuaranteed)
        : true,
    dimensions: initialData?.dimensions || "",
    weight: initialData?.weight || "",
    color: initialData?.color || "",
    isWholesaleEnabled: Boolean(
      initialData?.wholesaleTiers && initialData.wholesaleTiers.length > 0
    ),
    wholesaleTiers:
      Array.isArray(initialData?.wholesaleTiers) &&
      initialData.wholesaleTiers.length > 0
        ? initialData.wholesaleTiers.map((tier: any) => ({
            minQuantity: tier.minQuantity?.toString() || "",
            maxQuantity: tier.maxQuantity?.toString() || "",
            unitPrice: tier.unitPrice?.toString() || "",
          }))
        : [{ minQuantity: "5", maxQuantity: "", unitPrice: "" }],
  });

  const [techSpecs, setTechSpecs] = useState<
    Array<{ key: string; value: string }>
  >(() => {
    if (initialData?.technicalSpecs) {
      try {
        const parsed =
          typeof initialData.technicalSpecs === "string"
            ? JSON.parse(initialData.technicalSpecs)
            : initialData.technicalSpecs;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Error parsing specs", e);
      }
    }
    return [
      { key: "کشور سازنده", value: "اصلی / اورجینال" },
      { key: "نوع اتصال / کاربری", value: "استاندارد" },
    ];
  });

  /* Dynamic Variants & Matrix Generation */
  const [attributes, setAttributes] = useState<
    { name: string; values: string[] }[]
  >([]);
  const [newAttrName, setNewAttrName] = useState("");

  const addAttribute = () => {
    if (!newAttrName.trim()) return;
    setAttributes([...attributes, { name: newAttrName.trim(), values: [] }]);
    setNewAttrName("");
  };

  const removeAttribute = (index: number) => {
    const newAttrs = attributes.filter((_, i) => i !== index);
    setAttributes(newAttrs);
    generateMatrix(newAttrs);
  };

  const generateMatrix = (attrs: any[]) => {
    if (attrs.length === 0) {
      setFormData({ ...formData, variants: [] });
      return;
    }
    const cartesian = (arrays: any[][]) => {
      return arrays.reduce(
        (a, b) =>
          a
            .map((x) => b.map((y) => x.concat([y])))
            .reduce((c, d) => c.concat(d), []),
        [[]]
      );
    };
    const validAttrs = attrs.filter((a) => a.values.length > 0);
    if (validAttrs.length === 0) return;
    const valuesArrays = validAttrs.map((a) =>
      a.values.map((v: any) => ({ [a.name]: v }))
    );
    const combinations = cartesian(valuesArrays).map((combo) => {
      const attrObj = Object.assign({}, ...combo);
      return {
        attributes: attrObj,
        supplierBasePrice: formData.supplierBasePrice || "",
        stock: "10",
        sku: "",
        imageUrl: "",
      };
    });
    setFormData({ ...formData, variants: combinations });
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

  /* Categories Fetching */
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token") || "";
        const res = await fetch("/api/supplier/categories", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : data?.categories || [];
          if (list.length > 0) {
            setCategories(list);
            setFormData((prev) => ({
              ...prev,
              categoryId: prev.categoryId || String(list[0].id),
            }));
            return;
          }
        }
        const res2 = await fetch("/api/categories");
        if (res2.ok) {
          const data2 = await res2.json();
          const list2 = Array.isArray(data2) ? data2 : data2?.categories || [];
          if (list2.length > 0) {
            setCategories(list2);
          }
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    })();
  }, []);

  /* Next & Prev Steps with validation */
  const steps = [
    "اطلاعات اصلی",
    "تصاویر و رسانه",
    "قیمت و موجودی",
    "تنوع و مشخصات فنی",
    "ارسال، گارانتی و اصالت",
    "پیش‌نمایش در فروشگاه",
    "بررسی و ارسال",
  ];

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        notify("لطفاً نام یا عنوان محصول را وارد کنید.", "error");
        return false;
      }
      if (!formData.categoryId) {
        notify("لطفاً یک دسته‌بندی برای محصول انتخاب فرمایید.", "error");
        return false;
      }
    }
    if (currentStep === 2) {
      if (!formData.mainImage && formData.images.length === 0) {
        notify(
          "پیشنهاد می‌شود حداقل یک تصویر اصلی برای کالا انتخاب فرمایید.",
          "info"
        );
      }
    }
    if (currentStep === 3) {
      const baseNum = parseFloat(toEnglishDigits(formData.supplierBasePrice));
      if (isNaN(baseNum) || baseNum <= 0) {
        notify("قیمت پایه تامین‌کننده باید عددی بزرگتر از صفر باشد.", "error");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, steps.length));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* Final Submit Handler */
  const handleSubmit = async (
    submitStatus: "DRAFT" | "PENDING_APPROVAL" = "PENDING_APPROVAL"
  ) => {
    const cleanedName = formData.name ? formData.name.trim() : "";
    const cleanedCategoryId = formData.categoryId
      ? String(formData.categoryId).trim()
      : "";
    const cleanedBasePrice = toEnglishDigits(formData.supplierBasePrice);
    const cleanedStock = toEnglishDigits(formData.stock);
    const cleanedDiscount = toEnglishDigits(formData.discount) || "0";
    const cleanedBrand = formData.brand ? formData.brand.trim() : "";
    const cleanedSku = formData.sku ? formData.sku.trim() : "";

    if (!cleanedName) {
      notify("نام محصول الزامی است.", "error");
      setStep(1);
      return;
    }
    if (!cleanedCategoryId) {
      notify("لطفاً یک دسته‌بندی انتخاب فرمایید.", "error");
      setStep(1);
      return;
    }
    if (!cleanedBasePrice || parseFloat(cleanedBasePrice) <= 0) {
      notify(
        "قیمت پایه تامین‌کننده باید عددی بزرگتر از صفر باشد.",
        "error"
      );
      setStep(3);
      return;
    }

    const finalStock =
      cleanedStock ||
      (formData.variants && formData.variants.length > 0 ? "0" : "10");

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const url = initialData?.id
        ? `/api/supplier/products/${initialData.id}`
        : "/api/supplier/products";
      const method = initialData?.id ? "PUT" : "POST";

      const cleanedVariants = (formData.variants || []).map((v: any) => ({
        ...v,
        supplierBasePrice: toEnglishDigits(
          v.supplierBasePrice || cleanedBasePrice
        ),
        stock: toEnglishDigits(v.stock || "10"),
        sku: v.sku ? v.sku.trim() : "",
        imageUrl: v.imageUrl || null,
      }));

      const cleanedSpecs = techSpecs
        .filter((s) => s.key && s.key.trim() && s.value && s.value.trim())
        .map((s) => ({ key: s.key.trim(), value: s.value.trim() }));

      const cleanedWholesaleTiers = formData.isWholesaleEnabled
        ? (formData.wholesaleTiers || [])
            .map((t: any) => ({
              minQuantity: parseInt(toEnglishDigits(t.minQuantity), 10),
              maxQuantity: t.maxQuantity
                ? parseInt(toEnglishDigits(t.maxQuantity), 10)
                : null,
              unitPrice: parseFloat(toEnglishDigits(t.unitPrice)),
            }))
            .filter((t: any) => !isNaN(t.minQuantity) && !isNaN(t.unitPrice))
        : [];

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
        status: submitStatus,
        warranty: formData.warranty || null,
        warrantyDuration: formData.warrantyDuration || null,
        warrantyProvider: formData.warrantyProvider || null,
        warrantyType: formData.warrantyType || null,
        isAuthenticGuaranteed: formData.isAuthenticGuaranteed,
        dimensions: formData.dimensions || null,
        weight: formData.weight || null,
        color: formData.color || null,
        wholesaleTiers: cleanedWholesaleTiers,
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
        setCreatedProductName(cleanedName);
        if (submitStatus === "DRAFT") {
          notify("محصول با موفقیت به صورت پیش‌نویس ذخیره گردید.", "success");
          onSuccess();
        } else {
          setShowCelebration(true);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        const detailMsg = data.details ? `: ${data.details}` : "";
        const mainMsg = data.error || data.message || "خطا در ثبت محصول";
        notify(`${mainMsg}${detailMsg}`, "error");
      }
    } catch (err) {
      notify("خطا در ارتباط با سرور", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  /* AI Assist Apply Handlers */
  const handleApplyAiAll = (aiData: {
    name?: string;
    shortDescription?: string;
    longDescription?: string;
    specs?: Array<{ key: string; value: string }>;
    brand?: string;
  }) => {
    setFormData((prev) => ({
      ...prev,
      name: aiData.name || prev.name,
      shortDescription: aiData.shortDescription || prev.shortDescription,
      longDescription: aiData.longDescription || prev.longDescription,
      brand: aiData.brand || prev.brand,
    }));
    if (aiData.specs && aiData.specs.length > 0) {
      setTechSpecs(aiData.specs);
    }
  };

  const handleApplyAiField = (field: string, value: any) => {
    if (field === "specs") {
      setTechSpecs(value);
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  /* Resume Draft Helper */
  const handleResumeDraft = (draft: any) => {
    setFormData({
      name: draft.name || "",
      shortDescription: draft.shortDescription || draft.longDescription || "",
      longDescription: draft.longDescription || draft.shortDescription || "",
      categoryId: draft.categoryId?.toString() || "",
      brand: draft.brand || "",
      sku: draft.sku || "",
      supplierBasePrice: draft.supplierBasePrice?.toString() || "",
      discount: draft.discount?.toString() || "",
      stock: draft.inventory?.toString() || "10",
      minStock: "",
      images: Array.isArray(draft.images)
        ? draft.images.map((i: any) => (typeof i === "string" ? i : i?.url || ""))
        : [],
      mainImage:
        Array.isArray(draft.images) && draft.images.length > 0
          ? typeof draft.images[0] === "string"
            ? draft.images[0]
            : draft.images[0]?.url || ""
          : "",
      variants: draft.variants || [],
      videoUrl: draft.exploreContent?.customVideoUrl || "",
      warranty: draft.warranty || "ضمانت سلامت فیزیکی",
      warrantyDuration: draft.warrantyDuration || "۷ روز مهلت تست فنی",
      warrantyProvider: draft.warrantyProvider || "",
      warrantyType: draft.warrantyType || "تعویض کالا در صورت خرابی",
      isAuthenticGuaranteed: draft.isAuthenticGuaranteed !== false,
      dimensions: draft.dimensions || "",
      weight: draft.weight || "",
      color: draft.color || "",
      isWholesaleEnabled: Boolean(
        draft.wholesaleTiers && draft.wholesaleTiers.length > 0
      ),
      wholesaleTiers:
        draft.wholesaleTiers?.map((t: any) => ({
          minQuantity: String(t.minQuantity || ""),
          maxQuantity: String(t.maxQuantity || ""),
          unitPrice: String(t.unitPrice || ""),
        })) || [{ minQuantity: "5", maxQuantity: "", unitPrice: "" }],
    });
    setSelectedMode("MANUAL");
    setStep(1);
    toast.info(`پیش‌نویس «${draft.name || "کالا"}» بارگذاری شد.`);
  };

  /* If no mode is active, show the Product Creation Home Landing Panel */
  if (selectedMode === null) {
    return (
      <>
        <SupplierProductCreationHome
          onStartManual={() => {
            setSelectedMode("MANUAL");
            setStep(1);
          }}
          onStartBulkExcel={() => {
            if (onNavigateToBulkImport) {
              onNavigateToBulkImport();
            } else {
              setShowBulkImportModal(true);
            }
          }}
          onStartWooCommerce={() => setShowWcImport(true)}
          onStartConcierge={() => {
            if (onNavigateToConciergeImport) {
              onNavigateToConciergeImport();
            } else if (onNavigateToTickets) {
              onNavigateToTickets();
            } else {
              toast.info(
                "لطفاً درخواست ورود کالای رایگان را از بخش تیکت‌ها به کارشناسان زوپیت ارسال فرمایید."
              );
            }
          }}
          onResumeDraft={handleResumeDraft}
          onViewAllProducts={onCancel}
        />

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
                showNotification={notify}
              />
            </div>
          </div>
        )}

        {/* Bulk Excel Modal */}
        {showBulkImportModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="max-w-6xl w-full my-auto max-h-[92vh] overflow-y-auto bg-card rounded-3xl p-4 md:p-6 border border-subtle shadow-2xl relative">
              <button
                type="button"
                onClick={() => setShowBulkImportModal(false)}
                className="absolute top-6 left-6 p-2 rounded-xl bg-surface hover:bg-subtle text-secondary border border-subtle transition-all cursor-pointer z-20"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
              <SupplierBulkImport
                onSuccess={() => {
                  setShowBulkImportModal(false);
                  onSuccess();
                }}
                onCancel={() => setShowBulkImportModal(false)}
                showNotification={notify}
              />
            </div>
          </div>
        )}
      </>
    );
  }

  /* Main Wizard Screen (7 Steps) */
  return (
    <div
      className="bg-card rounded-3xl shadow-sm border border-subtle overflow-hidden animate-fade-in text-right max-w-5xl mx-auto my-4"
      dir="rtl"
    >
      {/* Top Header Bar */}
      <div className="p-6 border-b border-subtle bg-surface/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-primary-default text-inverse text-xs font-black flex items-center justify-center">
              {step}/7
            </span>
            <h2 className="text-lg sm:text-xl font-black text-primary">
              {initialData?.id
                ? `ویرایش کالا: ${formData.name || ""}`
                : "ثبت کالای جدید در زوپیت"}
            </h2>
            <span className="bg-primary-default/10 text-primary-default text-xs font-bold px-2.5 py-0.5 rounded-full">
              {steps[step - 1]}
            </span>
          </div>
          <p className="text-xs text-secondary mt-1">
            اطلاعات کالا را گام‌به‌گام وارد کنید یا از هوش مصنوعی برای تولید توضیحات و مشخصات کمک بگیرید.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <ProductQualityScoreBadge
            formData={formData}
            techSpecs={techSpecs}
            compact={true}
          />

          <button
            type="button"
            onClick={() => handleSubmit("DRAFT")}
            disabled={isSubmitting}
            className="px-3.5 py-2 bg-surface hover:bg-subtle text-secondary border border-subtle rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="ذخیره موقت کالا"
          >
            <Save className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">ذخیره پیش‌نویس</span>
          </button>
        </div>
      </div>

      {/* Stepper Navigation Tabs (7 Steps) */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-3 bg-surface border-b border-subtle overflow-x-auto gap-2">
        {steps.map((sName, idx) => {
          const stepNum = idx + 1;
          const isActive = step === stepNum;
          const isPassed = step > stepNum;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (isPassed || stepNum < step) {
                  setStep(stepNum);
                } else if (validateStep(step)) {
                  setStep(stepNum);
                }
              }}
              className="flex items-center gap-2 py-2 px-3 rounded-2xl transition-all cursor-pointer shrink-0"
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs transition-all ${
                  isActive
                    ? "bg-primary-default text-inverse shadow-md shadow-primary-default/20 scale-105"
                    : isPassed
                    ? "bg-emerald-500 text-white"
                    : "bg-subtle text-muted"
                }`}
              >
                {isPassed ? <CheckCircle className="w-4 h-4" /> : stepNum}
              </div>
              <span
                className={`text-xs font-bold ${
                  isActive
                    ? "text-primary-default"
                    : isPassed
                    ? "text-primary"
                    : "text-muted"
                }`}
              >
                {sName}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area by Step */}
      <div className="p-6 sm:p-8 space-y-8 min-h-[480px]">
        {/* STEP 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            {/* AI Assistant Quick Trigger Banner */}
            <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10 border border-indigo-500/20 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-primary">
                    دستیار هوش مصنوعی تولید مشخصات و توضیحات (Gemini)
                  </h4>
                  <p className="text-xs text-secondary mt-0.5">
                    با وارد کردن نام کالا، توضیحات جذاب، نقاط قوت، کلمات کلیدی و جدول مشخصات فنی را در چند ثانیه بسازید.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAiModal(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                <span>نگارش هوشمند با هوش مصنوعی</span>
              </button>
            </div>

            {/* Form Fields */}
            <div className="bg-surface border border-subtle rounded-3xl p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  نام کامل کالا و مدل دقیق *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="مثال: هندزفری بلوتوثی هایلو مدل T15 با محفظه شارژ"
                  className="w-full px-4 py-3 bg-background border border-subtle rounded-xl text-xs sm:text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-primary-default"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1.5">
                    دسته‌بندی محصول *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) =>
                      setFormData({ ...formData, categoryId: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-background border border-subtle rounded-xl text-xs sm:text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-primary-default cursor-pointer"
                  >
                    <option value="">-- انتخاب دسته‌بندی محصول --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={String(cat.id)}>
                        {cat.name || cat.title || `دسته‌بندی ${cat.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1.5">
                    برند کالا / شرکت سازنده
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    placeholder="مثال: سامسونگ، شیائومی، تسکو"
                    className="w-full px-4 py-3 bg-background border border-subtle rounded-xl text-xs sm:text-sm font-medium text-primary outline-none focus:ring-2 focus:ring-primary-default"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  کد کالا یا شناسه انبار (SKU - اختیاری)
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) =>
                    setFormData({ ...formData, sku: e.target.value })
                  }
                  placeholder="مثال: ZOP-HL-T15-BLK"
                  className="w-full px-4 py-2.5 bg-background border border-subtle rounded-xl text-xs font-mono text-primary outline-none focus:ring-2 focus:ring-primary-default text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  معرفی کوتاه کالا (یک یا دو جمله جذاب)
                </label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shortDescription: e.target.value,
                    })
                  }
                  placeholder="مثال: هدفون بی‌سیم هایلو T15 با شارژدهی ۶۰ ساعته و کیفیت صدای HD و میکروفون نویزگیر"
                  className="w-full px-4 py-3 bg-background border border-subtle rounded-xl text-xs font-medium text-primary outline-none focus:ring-2 focus:ring-primary-default"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  توضیحات و مشخصات جامع کالا
                </label>
                <textarea
                  rows={5}
                  value={formData.longDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      longDescription: e.target.value,
                    })
                  }
                  placeholder="شرح کامل کارایی، کیفیت ساخت، اقلام همراه جعبه و نکات استفاده..."
                  className="w-full px-4 py-3 bg-background border border-subtle rounded-xl text-xs font-medium text-primary outline-none focus:ring-2 focus:ring-primary-default resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Media & Images */}
        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <ProductImageUploader
              images={formData.images}
              mainImage={formData.mainImage}
              onChange={(newImages, newMain) =>
                setFormData({
                  ...formData,
                  images: newImages,
                  mainImage: newMain,
                })
              }
            />

            {/* Video Support */}
            <div className="bg-surface border border-subtle rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-subtle pb-3">
                <Video className="w-5 h-5 text-indigo-500" />
                <h4 className="text-sm font-black text-primary">
                  ویدیو معرفی و آنباکس محصول (اختیاری)
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    لینک اینترنتی ویدیو (آپارات، یوتیوب، CDN مستقیم)
                  </label>
                  <input
                    type="url"
                    value={formData.videoUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, videoUrl: e.target.value })
                    }
                    placeholder="https://www.aparat.com/v/..."
                    className="w-full px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-mono text-primary outline-none focus:ring-2 focus:ring-primary-default text-left"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Price, Stock & Wholesale Tiers */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            {/* Price Policy Notice */}
            <div className="bg-primary-default/5 border border-primary-default/20 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-primary-default/10 text-primary-default shrink-0 mt-0.5">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-primary">
                  سیاست قیمت‌گذاری پایه تامین‌کننده در زوپیت
                </h4>
                <p className="text-xs text-secondary mt-1 leading-relaxed">
                  مبلغ وارد شده به عنوان «قیمت پایه تامین‌کننده» مبلغ خالص تسویه با شما پس از فروش است.
                  قیمت نهایی فروشگاه و سود پلتفرم به صورت خودکار محاسبه شده و از سهم شما کسر نمی‌گردد.
                </p>
              </div>
            </div>

            {/* Pricing Input Fields */}
            <div className="bg-surface border border-subtle rounded-3xl p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1.5">
                    قیمت پایه تامین‌کننده (تومان) *
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={
                      formData.supplierBasePrice
                        ? Number(
                            toEnglishDigits(formData.supplierBasePrice)
                          ).toLocaleString("fa-IR")
                        : ""
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        supplierBasePrice: toEnglishDigits(e.target.value),
                      })
                    }
                    placeholder="مثال: ۳۵۰,۰۰۰"
                    className="w-full px-4 py-3 bg-background border border-subtle rounded-xl text-sm font-black text-primary outline-none focus:ring-2 focus:ring-primary-default"
                  />
                  {formData.supplierBasePrice &&
                    parseFloat(toEnglishDigits(formData.supplierBasePrice)) >
                      0 && (
                      <div className="mt-2 text-xs text-primary-default font-bold">
                        معادل حروفی:{" "}
                        {numberToWords(
                          parseFloat(toEnglishDigits(formData.supplierBasePrice))
                        )}{" "}
                        تومان
                      </div>
                    )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1.5">
                    موجودی کل انبار (تعداد آماده ارسال) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        stock: toEnglishDigits(e.target.value),
                      })
                    }
                    disabled={formData.variants.length > 0}
                    placeholder="مثال: ۵۰"
                    className="w-full px-4 py-3 bg-background border border-subtle rounded-xl text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-primary-default disabled:opacity-60"
                  />
                  {formData.variants.length > 0 && (
                    <p className="text-[11px] text-muted mt-1">
                      موجودی از مجموع تنوع‌های مرحله ۴ محاسبه می‌شود.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Wholesale Tiered Pricing Engine Component */}
            <ProductWholesalePricing
              isWholesaleEnabled={formData.isWholesaleEnabled}
              onToggleEnabled={(enabled) =>
                setFormData({ ...formData, isWholesaleEnabled: enabled })
              }
              supplierBasePrice={formData.supplierBasePrice}
              wholesaleTiers={formData.wholesaleTiers}
              onChangeTiers={(tiers) =>
                setFormData({ ...formData, wholesaleTiers: tiers })
              }
            />
          </div>
        )}

        {/* STEP 4: Attributes, Variants & Technical Specifications */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            {/* Technical Specs Key-Value Builder */}
            <div className="bg-surface border border-subtle rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-500" />
                  <h4 className="text-sm font-black text-primary">
                    جدول مشخصات و ویژگی‌های فنی کالا
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setTechSpecs([...techSpecs, { key: "", value: "" }])
                  }
                  className="px-3 py-1.5 bg-primary-default/10 text-primary-default hover:bg-primary-default/20 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>افزودن مشخصه جدید</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {techSpecs.map((spec, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 bg-background p-2.5 rounded-xl border border-subtle"
                  >
                    <input
                      type="text"
                      placeholder="عنوان مشخصه (مثال: پورت‌های اتصال)"
                      value={spec.key}
                      onChange={(e) => {
                        const updated = [...techSpecs];
                        updated[idx].key = e.target.value;
                        setTechSpecs(updated);
                      }}
                      className="w-1/3 px-3 py-2 bg-card border border-subtle rounded-lg text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-primary-default"
                    />
                    <input
                      type="text"
                      placeholder="مقدار (مثال: Type-C با شارژ سریع)"
                      value={spec.value}
                      onChange={(e) => {
                        const updated = [...techSpecs];
                        updated[idx].value = e.target.value;
                        setTechSpecs(updated);
                      }}
                      className="flex-1 px-3 py-2 bg-card border border-subtle rounded-lg text-xs font-medium text-primary outline-none focus:ring-2 focus:ring-primary-default"
                    />
                    {techSpecs.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setTechSpecs(techSpecs.filter((_, i) => i !== idx))
                        }
                        className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg cursor-pointer"
                        title="حذف این مشخصه"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Variant Attributes & Matrix Builder */}
            <div className="bg-surface border border-subtle rounded-3xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-subtle pb-3">
                <div className="flex items-center gap-2">
                  <List className="w-5 h-5 text-indigo-500" />
                  <h4 className="text-sm font-black text-primary">
                    تنوع کالا بر اساس ویژگی‌ها (رنگ، سایز، مدل)
                  </h4>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted font-medium">الگوها:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newAttr = {
                        name: "رنگ",
                        values: ["مشکی", "سفید", "سرمه‌ای", "خاکستری"],
                      };
                      const updated = [...attributes, newAttr];
                      setAttributes(updated);
                      generateMatrix(updated);
                      toast.success("الگوی ۴ رنگ اصلی اضافه شد.");
                    }}
                    className="px-2.5 py-1 bg-primary-default/10 text-primary-default border border-primary-default/20 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    🎨 رنگ‌ها
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newAttr = {
                        name: "سایز",
                        values: ["S", "M", "L", "XL", "XXL"],
                      };
                      const updated = [...attributes, newAttr];
                      setAttributes(updated);
                      generateMatrix(updated);
                      toast.success("الگوی سایزبندی اضافه شد.");
                    }}
                    className="px-2.5 py-1 bg-primary-default/10 text-primary-default border border-primary-default/20 rounded-lg text-xs font-bold cursor-pointer"
                  >
                    📐 سایزبندی
                  </button>
                </div>
              </div>

              {/* Attributes Creation Box */}
              {attributes.map((attr, idx) => (
                <div
                  key={idx}
                  className="bg-card p-4 rounded-2xl border border-subtle space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={attr.name}
                      onChange={(e) => {
                        const newAttrs = [...attributes];
                        newAttrs[idx].name = e.target.value;
                        setAttributes(newAttrs);
                      }}
                      className="px-3 py-1.5 bg-background border border-subtle rounded-xl text-xs font-black text-primary outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttribute(idx)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {attr.values.map((v, vIdx) => (
                      <span
                        key={vIdx}
                        className="px-3 py-1 bg-surface border border-subtle rounded-full text-xs font-bold text-primary flex items-center gap-1.5"
                      >
                        <span>{v}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const newAttrs = [...attributes];
                            newAttrs[idx].values = newAttrs[idx].values.filter(
                              (_, i) => i !== vIdx
                            );
                            setAttributes(newAttrs);
                            generateMatrix(newAttrs);
                          }}
                          className="text-muted hover:text-rose-600 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="text"
                  value={newAttrName}
                  onChange={(e) => setNewAttrName(e.target.value)}
                  placeholder="نام ویژگی جدید (مثال: جنس بدنه یا سایز)"
                  className="flex-1 px-3.5 py-2.5 bg-background border border-subtle rounded-xl text-xs font-medium text-primary outline-none"
                />
                <button
                  type="button"
                  onClick={addAttribute}
                  className="px-4 py-2.5 bg-primary-default text-inverse rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>افزودن ویژگی</span>
                </button>
              </div>

              {/* Variants Matrix Table */}
              {formData.variants.length > 0 && (
                <div className="overflow-x-auto rounded-2xl border border-subtle mt-4">
                  <table className="w-full text-right text-xs min-w-[650px]">
                    <thead className="bg-surface text-muted font-black">
                      <tr>
                        <th className="p-3">ترکیب ویژگی</th>
                        <th className="p-3">قیمت پایه (تومان)</th>
                        <th className="p-3">موجودی</th>
                        <th className="p-3">کد تنوع (SKU)</th>
                        <th className="p-3 text-center">حذف</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                      {formData.variants.map((v, idx) => (
                        <tr key={idx} className="bg-background">
                          <td className="p-3 font-bold text-primary">
                            {typeof v.attributes === "object" &&
                            v.attributes !== null
                              ? Object.values(v.attributes).join(" - ")
                              : String(v.attributes || `تنوع ${idx + 1}`)}
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              value={v.supplierBasePrice}
                              onChange={(e) =>
                                handleVariantChange(
                                  idx,
                                  "supplierBasePrice",
                                  e.target.value
                                )
                              }
                              className="w-32 px-2.5 py-1.5 bg-card border border-subtle rounded-lg text-xs font-black text-primary outline-none"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="number"
                              value={v.stock}
                              onChange={(e) =>
                                handleVariantChange(idx, "stock", e.target.value)
                              }
                              className="w-20 px-2.5 py-1.5 bg-card border border-subtle rounded-lg text-xs font-bold text-primary outline-none"
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              value={v.sku || ""}
                              onChange={(e) =>
                                handleVariantChange(idx, "sku", e.target.value)
                              }
                              placeholder="اختیاری"
                              className="w-28 px-2.5 py-1.5 bg-card border border-subtle rounded-lg text-xs font-mono text-primary outline-none text-left"
                              dir="ltr"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = formData.variants.filter(
                                  (_, i) => i !== idx
                                );
                                setFormData({ ...formData, variants: updated });
                              }}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: Shipping, Warranty & Authenticity */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            <ProductWarrantyAuthenticity
              formData={formData}
              onChange={(fields) => setFormData({ ...formData, ...fields })}
            />
          </div>
        )}

        {/* STEP 6: Live Marketplace Preview */}
        {step === 6 && (
          <div className="space-y-6 animate-fade-in">
            <ProductMarketplacePreview
              formData={formData}
              techSpecs={techSpecs}
              categories={categories}
            />
          </div>
        )}

        {/* STEP 7: Final Review & Quality Breakdown */}
        {step === 7 && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-primary-default/5 border border-primary-default/20 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-primary">
                  آماده ارسال محصول برای بررسی و انتشار هستید؟
                </h3>
                <p className="text-xs text-secondary mt-1 leading-relaxed">
                  محصول شما پس از ثبت، توسط ناظران کیفیت زوپیت بررسی شده و پس از تعیین مارجین برای صدها فروشگاه فعال منتشر خواهد شد.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSubmit("DRAFT")}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 bg-surface hover:bg-subtle text-secondary border border-subtle rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  ذخیره به عنوان پیش‌نویس
                </button>
              </div>
            </div>

            {/* Quality Breakdown Card */}
            <ProductQualityScoreBadge
              formData={formData}
              techSpecs={techSpecs}
              compact={false}
            />

            {/* Final Checkpoints List */}
            <div className="bg-surface border border-subtle rounded-3xl p-6 space-y-4">
              <h4 className="text-sm font-black text-primary">
                چک‌لیست نهایی اطلاعات کالا:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2.5 p-3 bg-background rounded-2xl border border-subtle">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs text-secondary">
                    نام محصول: <strong>{formData.name}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2.5 p-3 bg-background rounded-2xl border border-subtle">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs text-secondary">
                    قیمت پایه:{" "}
                    <strong>
                      {Number(formData.supplierBasePrice || 0).toLocaleString(
                        "fa-IR"
                      )}{" "}
                      تومان
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2.5 p-3 bg-background rounded-2xl border border-subtle">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs text-secondary">
                    تعداد تصاویر:{" "}
                    <strong>{formData.images.length || 1} تصویر</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2.5 p-3 bg-background rounded-2xl border border-subtle">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs text-secondary">
                    ضمانت اصالت:{" "}
                    <strong>
                      {formData.isAuthenticGuaranteed ? "تایید شده ✓" : "عادی"}
                    </strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Navigation Bar */}
      <div className="p-4 sm:p-6 border-t border-subtle flex flex-col-reverse sm:flex-row justify-between items-center gap-3 bg-card rounded-b-3xl sticky bottom-0 z-20 shadow-lg">
        <button
          type="button"
          onClick={() => {
            if (step === 1) {
              if (initialData?.id) {
                onCancel();
              } else {
                setSelectedMode(null);
              }
            } else {
              prevStep();
            }
          }}
          className="w-full sm:w-auto px-6 py-3 rounded-2xl text-xs font-bold text-secondary bg-surface hover:bg-subtle border border-subtle transition-all cursor-pointer flex items-center justify-center gap-1.5"
        >
          <ChevronRight className="w-4 h-4" />
          <span>{step === 1 ? "بازگشت به خانه ثبت کالا" : "گام قبلی"}</span>
        </button>

        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
          {step === 7 ? (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit("PENDING_APPROVAL")}
              className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-black shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>در حال ارسال اطلاعات...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>ثبت نهایی و ارسال برای بررسی و انتشار 🚀</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={nextStep}
              className="w-full sm:w-auto px-8 py-3 bg-primary-default hover:bg-primary-hover text-inverse rounded-2xl text-xs font-black shadow-md shadow-primary-default/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>گام بعدی: {steps[step]}</span>
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* AI Assist Modal */}
      <ProductAIAssistModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        currentName={formData.name}
        currentCategory={
          categories.find((c) => String(c.id) === formData.categoryId)?.name ||
          ""
        }
        currentBrand={formData.brand}
        onApplyAll={handleApplyAiAll}
        onApplyField={handleApplyAiField}
      />

      {/* Submission Celebration Modal */}
      <ProductSubmissionCelebration
        isOpen={showCelebration}
        productName={createdProductName || formData.name}
        onAddAnother={() => {
          setShowCelebration(false);
          setFormData({
            name: "",
            shortDescription: "",
            longDescription: "",
            categoryId: categories[0]?.id ? String(categories[0].id) : "",
            brand: "",
            sku: "",
            supplierBasePrice: "",
            discount: "",
            stock: "10",
            minStock: "",
            images: [],
            mainImage: "",
            variants: [],
            videoUrl: "",
            warranty: "ضمانت سلامت فیزیکی",
            warrantyDuration: "۷ روز مهلت تست فنی",
            warrantyProvider: "",
            warrantyType: "تعویض کالا در صورت خرابی",
            isAuthenticGuaranteed: true,
            dimensions: "",
            weight: "",
            color: "",
            isWholesaleEnabled: false,
            wholesaleTiers: [{ minQuantity: "5", maxQuantity: "", unitPrice: "" }],
          });
          setTechSpecs([
            { key: "کشور سازنده", value: "اصلی / اورجینال" },
            { key: "نوع اتصال / کاربری", value: "استاندارد" },
          ]);
          setStep(1);
          setSelectedMode("MANUAL");
        }}
        onViewProducts={() => {
          setShowCelebration(false);
          onSuccess();
        }}
      />
    </div>
  );
}
