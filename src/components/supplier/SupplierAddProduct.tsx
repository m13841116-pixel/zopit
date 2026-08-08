import { toast } from "../GlobalToast";
import React, { useState } from "react";
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
  Coins
} from "lucide-react";

export function SupplierAddProduct({
  onSuccess,
  onCancel,
  showNotification,
  initialData,
}: any) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<{id: number, name: string}[]>([
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
    images: initialData?.images?.map((img: any) => img.url) || ([] as string[]),
    mainImage: initialData?.images?.[0]?.url || "",
    variants: initialData?.variants || ([] as any[]),
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
  /* Variant Building */ const [attributes, setAttributes] = useState<
    { name: string; values: string[] }[]
  >([]);
  const [newAttrName, setNewAttrName] = useState("");
  const [newAttrValue, setNewAttrValue] = useState("");
  const isNextDisabled = () => {
    if (step === 1) {
      return !formData.name.trim() || !formData.categoryId;
    }
    if (step === 2) {
      return !formData.supplierBasePrice.toString().trim() || !formData.stock.toString().trim();
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
    /* Cartesian product of attribute values */ const cartesian = (
      arrays: any[][],
    ) => {
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
      a.values.map( (v: any) => ({ [a.name]: v })),
    );
    const combinations = cartesian(valuesArrays).map((combo) => {
      /* flatten */ const attrObj = Object.assign({}, ...combo);
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
      const sum = newVariants.reduce((total, v) => total + (parseInt(v.stock.toString().replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d))) || 0), 0);
      updatedStock = sum.toString();
    }
    
    setFormData({ ...formData, variants: newVariants, stock: updatedStock });
  };
  const handleSubmit = async () => {
    if (
      !formData.name ||
      !formData.categoryId ||
      !formData.supplierBasePrice ||
      !formData.stock
    ) {
      showNotification(
        "لطفاً فیلدهای اجباری (نام، دسته‌بندی، قیمت پایه و موجودی کل) را پر کنید",
        "error",
      );
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token") || "";
      const url = initialData?.id
        ? `/api/supplier/products/${initialData.id}`
        : "/api/supplier/products";
      const method = initialData?.id ? "PUT" : "POST";
      const res = await fetch(url, { credentials: "include",
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          technicalSpecs: JSON.stringify(techSpecs.filter((s) => s.key.trim() && s.value.trim())),
        }),
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
        const data = await res.json();
        showNotification(data.error || "خطا در ثبت محصول", "error");
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
    <div className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden animate-fade-in">
      
      {/* Stepper */}
      <div className="bg-background border-b border-subtle p-6">
        
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          
          {steps.map((s, i) => (
            <div key={i} className="flex flex-col items-center relative z-10">
              
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors ${step > i + 1 ? "bg-success text-inverse" : step === i + 1 ? "bg-primary-default text-inverse shadow-md shadow-indigo-200" : "bg-surface text-muted"}`}
              >
                
                {step > i + 1 ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-xs font-semibold ${step === i + 1 ? "text-primary-hover" : "text-muted"}`}
              >
                
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-8 max-w-3xl mx-auto min-h-[400px]">
        
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            
            <h3 className="text-lg font-bold text-primary mb-6 border-b pb-2">
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
                className="w-full px-4 py-3 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none"
                placeholder="مثال: لپ‌تاپ ایسوس مدل ZenBook"
              />
            </div>
            <div className="grid grid-cols-2 gap-5">
              
              <div>
                
                <label className="block text-sm font-semibold text-secondary mb-1.5">
                  دسته‌بندی *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoryId: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none text-slate-900"
                >
                  <option value="">انتخاب کنید...</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                
                <label className="block text-sm font-semibold text-secondary mb-1.5">
                  برند
                </label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) =>
                    setFormData({ ...formData, brand: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none"
                />
              </div>
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

            {/* Dynamic Technical Specs (Prompt 7.3) */}
            <div className="border-t border-subtle pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-bold text-secondary">
                  مشخصات و ویژگی‌های فنی (Dynamic Key-Value Specs)
                </label>
                <button
                  type="button"
                  onClick={() => setTechSpecs([...techSpecs, { key: "", value: "" }])}
                  className="px-3 py-1 bg-primary-default/10 text-primary-default hover:bg-primary-default/20 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
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
                        className="p-2 text-danger hover:bg-danger/10 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Step 2: Price & Inventory */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            
            <h3 className="text-lg font-bold text-primary mb-6 border-b pb-2">
              قیمت و موجودی
            </h3>
            <div className="bg-primary-default/10 p-4 rounded-xl border border-primary-default/20 mb-6">
              
              <p className="text-sm text-primary-hover font-medium">
                
                توجه: مبلغ وارد شده به عنوان"قیمت پایه تامین‌کننده" مبلغی است که
                با شما تسویه می‌شود. قیمت نهایی برای مشتری توسط پلتفرم محاسبه و
                تعیین می‌گردد.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              
              <div>
                
                <label className="block text-sm font-semibold text-secondary mb-1.5">
                  قیمت پایه تامین‌کننده (تومان) *
                </label>
                <input
                  type="number"
                  value={formData.supplierBasePrice}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      supplierBasePrice: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none text-left"
                  dir="ltr"
                />

                {/* Dynamic Price Suggestion Advisor (User Request) */}
                {formData.supplierBasePrice && !isNaN(parseFloat(formData.supplierBasePrice.toString().replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)))) && (() => {
                  const price = parseFloat(formData.supplierBasePrice.toString().replace(/[۰-۹]/g, d => "۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
                  const benchmarkPrice = Math.round((price * 1.15) / 1000) * 1000;
                  const discountPercent = Math.round(((benchmarkPrice - price) / benchmarkPrice) * 100);

                  let status = "neutral";
                  let multiplier = "۱.۵ برابر بیشتر";
                  let message = "قیمت شما در محدوده عادی بازار است. با کاهش جزئی قیمت، شانس فروش خود را چند برابر کنید.";
                  let colorClass = "text-warning border-warning/20 bg-warning/5";
                  let progressColor = "bg-warning";
                  let percentage = 50;

                  if (discountPercent >= 12) {
                    status = "excellent";
                    multiplier = "۵ الی ۱۰ برابر بیشتر 🚀";
                    message = "فوق‌العاده رقابتی! این قیمت شانس فروش شما را به شدت افزایش می‌دهد و در صدر اکسپلور قرار می‌گیرید.";
                    colorClass = "text-success border-success/20 bg-success/5";
                    progressColor = "bg-success";
                    percentage = 90;
                  } else if (discountPercent <= 2) {
                    status = "danger";
                    multiplier = "بدون تغییر (عادی)";
                    message = "قیمت پیشنهادی شما به میانگین بازار نزدیک است. برای ترغیب بیشتر خریداران، قیمت رقابتی‌تری ثبت کنید.";
                    colorClass = "text-danger border-danger/20 bg-danger/5";
                    progressColor = "bg-danger";
                    percentage = 20;
                  }

                  return (
                    <div className={`mt-3 p-4 rounded-xl border ${colorClass} space-y-3 transition-all animate-fade-in`}>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          <Coins className="w-4 h-4" />
                          پیشنهاد قیمت هوشمند و رقابتی:
                        </span>
                        <span className="text-[10px] bg-card px-2 py-0.5 rounded-full border border-subtle font-black font-mono">
                          {discountPercent > 0 ? `${discountPercent}% سودمندتر` : "نیاز به بازنگری"}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed font-medium">
                        {message}
                      </p>
                      
                      {/* Interactive meter */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span>جذابیت قیمت برای خریدار</span>
                          <span>تخمین افزایش میزان فروش: <strong className="text-sm font-black underline">{multiplier}</strong></span>
                        </div>
                        <div className="w-full bg-background h-2 rounded-full overflow-hidden border border-subtle">
                          <div className={`h-full ${progressColor} transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[9px] pt-1 border-t border-dashed border-subtle">
                        <span>قیمت تخمینی رقبا: {benchmarkPrice.toLocaleString()} تومان</span>
                        <span className="font-bold cursor-pointer hover:underline text-primary-default" onClick={() => {
                          const suggestedPrice = Math.round((benchmarkPrice * 0.88) / 1000) * 1000;
                          setFormData({ ...formData, supplierBasePrice: suggestedPrice.toString() });
                          toast("✅ قیمت پیشنهادی سیستم اعمال شد.", "success");
                        }}>
                          اعمال قیمت طلایی ({(Math.round((benchmarkPrice * 0.88) / 1000) * 1000).toLocaleString()} تومان)
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div>
                
                <label className="block text-sm font-semibold text-secondary mb-1.5">
                  موجودی کل *
                </label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) =>
                    setFormData({ ...formData, stock: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none text-left"
                  dir="ltr"
                  required
                />
              </div>
              <div>
                
                <label className="block text-sm font-semibold text-secondary mb-1.5">
                  هشدار حداقل موجودی
                </label>
                <input
                  type="number"
                  value={formData.minStock}
                  onChange={(e) =>
                    setFormData({ ...formData, minStock: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-background border border-subtle rounded-xl focus:ring-2 focus:ring-primary-default outline-none text-left"
                  dir="ltr"
                  placeholder="مثال: 5"
                />
              </div>
            </div>
          </div>
        )}
        {/* Step 3: Variants */}
        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            
            <h3 className="text-lg font-bold text-primary mb-2">
              ویژگی‌ها و متغیرها
            </h3>
            <p className="text-sm text-muted mb-6 pb-2 border-b">
              اگر محصول شما دارای رنگ، سایز یا ویژگی‌های متغیر است، در این بخش
              تعریف کنید.
            </p>
            {/* Add Attribute */}
            <div className="flex gap-2">
              
              <input
                type="text"
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
                placeholder="نام ویژگی جدید (مثال: رنگ)"
                className="flex-1 px-4 py-2.5 bg-background border border-subtle rounded-xl text-sm"
              />
              <button
                onClick={addAttribute}
                className="bg-primary-default text-inverse hover:bg-primary-hover px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors"
              >
                
                افزودن ویژگی
              </button>
            </div>
            {/* Attributes List */}
            {attributes.map((attr, idx) => (
              <div
                key={idx}
                className="bg-background p-4 rounded-xl border border-subtle"
              >
                
                <div className="flex justify-between items-center mb-3">
                  
                  <h4 className="font-bold text-primary">{attr.name}</h4>
                  <button
                    onClick={() => removeAttribute(idx)}
                    className="text-danger hover:bg-danger/10 p-1.5 rounded-lg"
                  >
                    
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  
                  {attr.values.map((v, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-card border border-subtle rounded-lg text-sm text-secondary flex items-center gap-2"
                    >
                      
                      {v}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  
                  <input
                    type="text"
                    value={newAttrValue}
                    onChange={(e) => setNewAttrValue(e.target.value)}
                    placeholder="مقدار جدید (مثال: قرمز)"
                    className="flex-1 px-4 py-2 bg-card border border-subtle rounded-lg text-sm"
                  />
                  <button
                    onClick={() => addAttributeValue(idx)}
                    className="bg-primary-default/20 text-primary-hover px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors"
                  >
                    
                    افزودن مقدار
                  </button>
                </div>
              </div>
            ))}
            {/* Variation Matrix */}
            {formData.variants.length > 0 && (
              <div className="mt-8 border-t pt-6">
                
                <h4 className="font-bold text-primary mb-4">
                  لیست متغیرهای ایجاد شده
                </h4>
                <div className="overflow-x-auto">
                  
                  <table className="w-full text-right text-sm">
                    
                    <thead className="bg-surface text-muted">
                      
                      <tr>
                        
                        <th className="p-3 rounded-r-lg">
                          ترکیب ویژگی‌ها
                        </th>
                        <th className="p-3">قیمت پایه (تومان)</th>
                        <th className="p-3 rounded-l-lg">موجودی</th>
                      </tr>
                    </thead>
                    <tbody>
                      
                      {formData.variants.map( (v: any, idx: any) => (
                        <tr key={idx} className="border-b border-subtle">
                          
                          <td className="p-3 font-medium text-primary">
                            
                            {Object.values(v.attributes).join(" -")}
                          </td>
                          <td className="p-3">
                            
                            <input
                              type="number"
                              value={v.supplierBasePrice}
                              onChange={(e) =>
                                handleVariantChange(
                                  idx,
                                  "supplierBasePrice",
                                  e.target.value,
                                )
                              }
                              className="w-32 px-3 py-1.5 bg-background border border-subtle rounded text-sm outline-none"
                              dir="ltr"
                            />
                          </td>
                          <td className="p-3">
                            
                            <input
                              type="number"
                              value={v.stock}
                              onChange={(e) =>
                                handleVariantChange(
                                  idx,
                                  "stock",
                                  e.target.value,
                                )
                              }
                              className="w-24 px-3 py-1.5 bg-background border border-subtle rounded text-sm outline-none"
                              dir="ltr"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Step 4: Media */}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            
            <h3 className="text-lg font-bold text-primary mb-2">
              رسانه محصول
            </h3>
            <p className="text-sm text-muted mb-6 pb-2 border-b">
              تصویر اصلی و گالری تصاویر محصول را بارگذاری کنید.
            </p>
            <div>
              
              <label className="block text-sm font-semibold text-secondary mb-2">
                تصویر اصلی محصول (شاخص)
              </label>
              <div className="border-2 border-dashed border-default rounded-2xl h-48 flex flex-col items-center justify-center text-muted hover:bg-background transition-colors cursor-pointer relative overflow-hidden">
                
                {formData.mainImage ? (
                  <img
                    src={formData.mainImage}
                    className="w-full h-full object-cover"
                    alt="Main preview"
                  />
                ) : (
                  <>
                    
                    <Upload className="w-8 h-8 mb-2 text-muted" />
                    <span className="text-sm font-medium">
                      برای آپلود تصویر کلیک کنید
                    </span>
                    <span className="text-xs mt-1">
                      فرمت‌های مجاز: JPG, PNG, WEBP
                    </span>
                  </>
                )}
                {/* Mock file input trigger for demo purposes */}
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (file.size > 2 * 1024 * 1024) {
                        toast("حجم تصویر نباید بیشتر از 2 مگابایت باشد.", "error");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData({
                          ...formData,
                          mainImage: reader.result as string,
                        });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            </div>
            <div>
              
              <label className="block text-sm font-semibold text-secondary mb-2">
                گالری تصاویر (انتخابی)
              </label>
              <div className="grid grid-cols-4 gap-4">
                
                {formData.images.map( (img: any, i: any) => (
                  <div
                    key={i}
                    className="aspect-square bg-surface rounded-xl border border-subtle overflow-hidden relative group"
                  >
                    
                    <img
                      src={img}
                      className="w-full h-full object-cover"
                      alt={`gallery-${i}`}
                    />
                    <button
                      onClick={() =>
                        setFormData({
                          ...formData,
                          images: formData.images.filter( (_: any, idx: any) => idx !== i),
                        })
                      }
                      className="absolute top-2 right-2 bg-card/90 p-1.5 rounded-lg text-danger opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="aspect-square border-2 border-dashed border-default rounded-xl flex items-center justify-center text-muted hover:bg-background cursor-pointer relative">
                  
                  <Plus className="w-8 h-8" />
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={async (e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files);
                        const validFiles = files.filter(
                          (f: any) => f.size <= 2 * 1024 * 1024,
                        );
                        if (validFiles.length < files.length) {
                          toast("حجم تصاویر نباید بیشتر از 2 مگابایت باشد.", "error");
                        }
                        const urls = await Promise.all(
                          validFiles.map(
                            (f: any) =>
                              new Promise<string>((resolve) => {
                                const reader = new FileReader();
                                reader.onloadend = () =>
                                  resolve(reader.result as string);
                                reader.readAsDataURL(f);
                              }),
                          ),
                        );
                        setFormData({
                          ...formData,
                          images: [...formData.images, ...urls],
                        });
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Product Video Upload Component (User Request) */}
            <div className="border-t border-subtle pt-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-secondary flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-primary-default" />
                  ویدیو محصول (اختیاری)
                </label>
                <p className="text-[10px] text-muted mt-0.5">
                  بارگذاری ویدیو معرفی یا آنباکسینگ محصول (فرمت MP4، حداکثر ۱۰ مگابایت) جهت نمایش در اکسپلور
                </p>
              </div>

              {formData.videoUrl ? (
                <div className="space-y-3 animate-fade-in">
                  <div className="border border-subtle rounded-xl overflow-hidden bg-background aspect-video w-full max-w-md relative group">
                    <video
                      src={formData.videoUrl}
                      controls
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, videoUrl: "" })}
                      className="absolute top-2 right-2 bg-card/90 p-1.5 rounded-lg text-danger opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-danger/10 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-[10px] text-success font-medium flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> ویدیو با موفقیت بارگذاری شد.
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-default rounded-2xl p-6 flex flex-col items-center justify-center text-muted hover:bg-background transition-colors cursor-pointer relative overflow-hidden">
                  <Video className="w-10 h-10 mb-2 text-muted animate-pulse" />
                  <span className="text-xs font-semibold text-text-primary">
                    برای آپلود ویدیو کلیک کنید یا فایل را بکشید و رها کنید
                  </span>
                  <span className="text-[9px] mt-1 text-text-muted">
                    فرمت‌های مجاز: MP4, MOV, WEBM (حداکثر 10 مگابایت)
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 10 * 1024 * 1024) {
                          toast("حجم ویدیو نباید بیشتر از 10 مگابایت باشد.", "error");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({
                            ...formData,
                            videoUrl: reader.result as string,
                          });
                          toast("✅ ویدیو با موفقیت بارگذاری شد.", "success");
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
              )}
            </div>

          </div>
        )}
        {/* Step 5: Review & Submit */}
        {step === 5 && (
          <div className="space-y-6 animate-fade-in">
            
            <h3 className="text-lg font-bold text-primary mb-6 border-b pb-2">
              بررسی و ثبت نهایی
            </h3>
            <div className="bg-background p-6 rounded-2xl border border-subtle flex gap-6">
              
              <div className="w-32 h-32 bg-surface rounded-xl overflow-hidden shrink-0">
                
                {formData.mainImage ? (
                  <img
                    src={formData.mainImage}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted">
                    بدون تصویر
                  </div>
                )}
              </div>
              <div className="flex-1">
                
                <h4 className="text-xl font-bold text-primary">
                  {formData.name || "بدون نام"}
                </h4>
                <div className="grid grid-cols-2 gap-y-2 mt-4 text-sm">
                  
                  <p className="text-muted">
                    دسته‌بندی:
                    <span className="font-semibold text-primary">
                      {categories.find(c => c.id.toString() === formData.categoryId)?.name || "-"}
                    </span>
                  </p>
                  <p className="text-muted">
                    برند:
                    <span className="font-semibold text-primary">
                      {formData.brand || "-"}
                    </span>
                  </p>
                  <p className="text-muted">
                    قیمت پایه:
                    <span className="font-bold text-primary-default">
                      {Number(formData.supplierBasePrice).toLocaleString()}
                      تومان
                    </span>
                  </p>
                  <p className="text-muted">
                    موجودی:
                    <span className="font-semibold text-primary">
                      {formData.stock}
                    </span>
                  </p>
                  {formData.videoUrl && (
                    <p className="text-muted col-span-2 mt-2 flex items-center gap-1">
                      <span className="text-success font-semibold text-xs flex items-center gap-1 bg-success/10 px-2 py-0.5 rounded-full">
                        <Video className="w-3 h-3" /> ویدیو محصول بارگذاری شده است
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-warning/10 p-4 rounded-xl border border-amber-100 text-sm text-amber-800 flex items-start gap-3">
              
              <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>
                
                با ثبت این محصول تایید می‌کنم که اطلاعات وارد شده صحیح است. پس
                از تایید توسط مدیر سیستم، محصول در ویترین پلتفرم قرار خواهد
                گرفت.
              </p>
            </div>
          </div>
        )}
      </div>
      {/* Footer Controls */}
      <div className="p-6 border-t border-subtle flex justify-between items-center bg-card rounded-b-2xl">
        
        <button
          onClick={step === 1 ? onCancel : prevStep}
          className="px-6 py-2.5 rounded-xl text-sm font-medium text-text-secondary bg-surface hover:bg-surface transition-colors flex items-center gap-2"
        >
          
          {step === 1 ? (
            "انصراف"
          ) : (
            <>
              <ChevronRight className="w-4 h-4" /> مرحله قبل
            </>
          )}
        </button>
        {step < 5 ? (
          <button
            onClick={nextStep}
            disabled={isNextDisabled()}
            className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2 cursor-pointer ${
              isNextDisabled()
                ? "bg-gray-300 dark:bg-slate-700 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-50"
                : "text-inverse bg-primary-default hover:bg-primary-hover"
            }`}
          >
            
            مرحله بعد <ChevronLeft className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-2.5 rounded-xl text-sm font-bold text-inverse bg-success hover:bg-emerald-700 transition-colors shadow-md disabled:opacity-50"
          >
            
            {isSubmitting ? "در حال پردازش..." : "ثبت نهایی محصول"}
          </button>
        )}
      </div>
    </div>
  );
}
