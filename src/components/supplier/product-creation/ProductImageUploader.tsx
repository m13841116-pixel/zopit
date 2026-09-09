import React, { useState, useRef } from "react";
import {
  Upload,
  ImagePlus,
  Trash2,
  Star,
  ArrowRight,
  ArrowLeft,
  Link,
  Info,
  Check,
  AlertCircle,
  Eye,
  Plus
} from "lucide-react";
import { toast } from "../../GlobalToast";

interface ProductImageUploaderProps {
  images: string[];
  mainImage: string;
  onChange: (images: string[], mainImage: string) => void;
}

export function ProductImageUploader({
  images,
  mainImage,
  onChange,
}: ProductImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [showUrlModal, setShowUrlModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to compress image client-side to keep data snappy
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

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
            resolve(canvas.toDataURL("image/jpeg", 0.85));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newUploaded: string[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) {
        toast.error(`فایل ${file.name} فرمت تصویری معتبری نیست.`);
        continue;
      }
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`حجم تصویر ${file.name} نباید بیشتر از ۸ مگابایت باشد.`);
        continue;
      }
      try {
        const compressed = await compressImage(file);
        newUploaded.push(compressed);
      } catch (err) {
        console.error("Error reading image:", err);
      }
    }

    if (newUploaded.length > 0) {
      const combined = [...images, ...newUploaded];
      const newMain = mainImage || combined[0] || "";
      onChange(combined, newMain);
      toast.success(`${newUploaded.length} تصویر با موفقیت افزوده شد.`);
    }
  };

  const handleAddUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      toast.error("لطفاً یک آدرس اینترنتی معتبر با http یا https وارد کنید.");
      return;
    }
    const combined = [...images, trimmed];
    const newMain = mainImage || combined[0] || "";
    onChange(combined, newMain);
    setImageUrlInput("");
    setShowUrlModal(false);
    toast.success("لینک تصویر با موفقیت اضافه شد.");
  };

  const handleSetMain = (url: string) => {
    onChange(images, url);
    toast.success("تصویر اصلی تغییر یافت.");
  };

  const handleRemove = (index: number) => {
    const targetUrl = images[index];
    const updated = images.filter((_, i) => i !== index);
    let newMain = mainImage;
    if (mainImage === targetUrl) {
      newMain = updated[0] || "";
    }
    onChange(updated, newMain);
    toast.info("تصویر حذف گردید.");
  };

  const handleMove = (index: number, direction: "left" | "right") => {
    const newImages = [...images];
    const targetIndex = direction === "right" ? index - 1 : index + 1; // RTL direction
    if (targetIndex < 0 || targetIndex >= newImages.length) return;

    const temp = newImages[index];
    newImages[index] = newImages[targetIndex];
    newImages[targetIndex] = temp;

    // If we moved something to first index, optionally sync main image if none is set
    onChange(newImages, mainImage || newImages[0] || "");
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Informational Recommendation Bar */}
      <div className="bg-primary-default/5 border border-primary-default/20 rounded-2xl p-4 flex items-start gap-3">
        <div className="p-2 rounded-xl bg-primary-default/10 text-primary-default shrink-0 mt-0.5">
          <ImagePlus className="w-5 h-5" />
        </div>
        <div className="text-right">
          <h4 className="text-sm font-black text-primary">
            توصیه زوپیت برای تصاویر محصول
          </h4>
          <p className="text-xs text-secondary mt-1 leading-relaxed">
            ثبت حداقل ۳ تصویر واضح، ترجیحاً با زمینه سفید یا محیطی، شانس انتخاب کالا توسط فروشگاه‌های همکار را بیشتر می‌کند.
            تصویر اصلی را با کلیک روی نشان ستاره تعیین کنید.
          </p>
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-primary-default bg-primary-default/10 scale-[1.01]"
            : "border-subtle bg-surface hover:border-primary-default/50 hover:bg-subtle/50"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => handleFiles(e.target.files)}
          multiple
          accept="image/*"
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-primary-default/10 text-primary-default flex items-center justify-center">
            <Upload className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-black text-primary">
              تصاویر محصول را اینجا بکشید و رها کنید یا کلیک کنید
            </p>
            <p className="text-xs text-muted mt-1">
              پشتیبانی از فرمت‌های JPG ،PNG و WEBP (حداکثر ۸ مگابایت)
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <span className="px-4 py-2 bg-primary-default text-inverse rounded-xl text-xs font-black shadow-xs">
              انتخاب از حافظه دستگاه
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowUrlModal(true);
              }}
              className="px-4 py-2 bg-surface hover:bg-subtle text-secondary border border-subtle rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Link className="w-3.5 h-3.5 text-muted" />
              <span>افزودن با آدرس اینترنتی (URL)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Image Gallery Grid */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-secondary">
              تصاویر بارگذاری‌شده ({images.length} تصویر)
            </h4>
            <span className="text-[11px] text-muted font-medium">
              تصویر دارای نشان ستاره به عنوان تصویر شاخص نمایش داده می‌شود.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((imgUrl, idx) => {
              const isMain = mainImage === imgUrl || (!mainImage && idx === 0);
              return (
                <div
                  key={idx}
                  className={`group relative bg-surface border rounded-2xl overflow-hidden aspect-square flex flex-col justify-between transition-all shadow-xs ${
                    isMain
                      ? "border-primary-default ring-2 ring-primary-default/20 shadow-md"
                      : "border-subtle hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Product ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Primary Badge */}
                  {isMain && (
                    <div className="absolute top-2 right-2 bg-primary-default text-inverse text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Star className="w-3 h-3 fill-current" />
                      <span>تصویر اصلی</span>
                    </div>
                  )}

                  {/* Action Overlays */}
                  <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleRemove(idx)}
                        className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-all cursor-pointer shadow-xs"
                        title="حذف تصویر"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {!isMain && (
                        <button
                          type="button"
                          onClick={() => handleSetMain(imgUrl)}
                          className="px-2 py-1 rounded-lg bg-white/90 dark:bg-slate-900/90 hover:bg-white text-primary text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Star className="w-3 h-3 text-amber-500" />
                          <span>تنظیم اصلی</span>
                        </button>
                      )}
                    </div>

                    {/* Reorder Arrows */}
                    <div className="flex items-center justify-center gap-2">
                      {idx < images.length - 1 && (
                        <button
                          type="button"
                          onClick={() => handleMove(idx, "left")}
                          className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-800 transition-all cursor-pointer"
                          title="انتقال به بعد"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => handleMove(idx, "right")}
                          className="p-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-800 transition-all cursor-pointer"
                          title="انتقال به قبل"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Quick Add More Card */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-subtle hover:border-primary-default rounded-2xl aspect-square flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all hover:bg-primary-default/5 text-muted hover:text-primary-default"
            >
              <Plus className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">افزودن تصویر دیگر</span>
            </div>
          </div>
        </div>
      )}

      {/* URL Import Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-subtle rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-up text-right" dir="rtl">
            <div className="flex items-center justify-between pb-3 border-b border-subtle">
              <h3 className="text-base font-black text-primary flex items-center gap-2">
                <Link className="w-4 h-4 text-primary-default" />
                <span>افزودن تصویر با لینک اینترنتی</span>
              </h3>
            </div>
            <p className="text-xs text-secondary leading-relaxed">
              آدرس مستقیم عکس کالا (مثلاً با پسوند .jpg یا .png) را در کادر زیر وارد کنید:
            </p>
            <input
              type="url"
              value={imageUrlInput}
              onChange={(e) => setImageUrlInput(e.target.value)}
              placeholder="https://example.com/product.jpg"
              className="w-full px-4 py-3 bg-background border border-subtle rounded-xl text-xs font-mono text-primary outline-none focus:ring-2 focus:ring-primary-default text-left"
              dir="ltr"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUrlModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-secondary hover:bg-subtle"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleAddUrl}
                className="px-5 py-2.5 bg-primary-default hover:bg-primary-hover text-inverse rounded-xl text-xs font-black shadow-xs cursor-pointer"
              >
                ثبت تصویر
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
