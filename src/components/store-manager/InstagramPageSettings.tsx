import React, { useState, useEffect } from "react";
import {
  Sparkles,
  User,
  Globe,
  Store,
  Phone,
  MapPin,
  Camera,
  ExternalLink,
  ShoppingBag,
  Grid,
  Save,
  HelpCircle,
  ShieldCheck,
  ImageIcon,
  FileText,
  Tag,
  DollarSign,
  Layers,
  CheckCircle2,
  RefreshCw,
  Eye,
  Edit3,
  X
} from "lucide-react";
import { toast } from "../GlobalToast";
import { PROVINCES } from "../../data/provinces";

interface ZoombitGramPageSettingsProps {
  user: any;
  onUpdateUser?: (updatedUser: any) => void;
  myProducts?: any[];
}

// Sample fallback products for instant editing if database is empty
const DEFAULT_SAMPLE_PRODUCTS = [
  {
    id: 101,
    name: "ساعت هوشمند اسپرت شیائومی Watch S1",
    price: 3450000,
    finalPrice: 3450000,
    imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
    description: "ساعت هوشمند با قابلیت پایش ضربان قلب، ضد آب و صفحه نمایش AMOLED کیفیت بالا."
  },
  {
    id: 102,
    name: "هدفون بی‌سیم نویز کنسلینگ سونی WH-1000XM5",
    price: 14800000,
    finalPrice: 14800000,
    imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80",
    description: "کیفیت صدای بی‌نظیر با حذف نویز فعال، ۳۰ ساعت شارژدهی مداوم و طراحی ارگونومیک."
  },
  {
    id: 103,
    name: "کفش ورزشی نایک مدل Air Zoom 2026",
    price: 4200000,
    finalPrice: 4200000,
    imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
    description: "کفش مخصوص دویدن و پیاده‌روی با کفی لایه هوایی انعطاف‌پذیر و وزن سبک."
  },
  {
    id: 104,
    name: "اسپیکر بلوتوثی قابل حمل جی‌بی‌ال Charge 5",
    price: 5600000,
    finalPrice: 5600000,
    imageUrl: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&q=80",
    description: "صدای قدرتمند باس، استاندارد مقاوم در برابر آب IP67 و قابلیت پاوربانک."
  }
];

export default function ZoombitGramPageSettings({
  user,
  onUpdateUser
}: ZoombitGramPageSettingsProps) {
  // Store Profile Info
  const [storeName, setStoreName] = useState(user?.storeName || user?.name || "");
  const [brandName, setBrandName] = useState(user?.brandName || "");
  const [username, setUsername] = useState(user?.username || user?.storeUsername || "zopit_store");
  const [fieldOfActivity, setFieldOfActivity] = useState(user?.fieldOfActivity || user?.bio || "");
  const [storeLink, setStoreLink] = useState(user?.storeLink || user?.website || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || user?.logo || "");
  const [phone, setPhone] = useState(user?.phone || user?.mobile || "");
  const [province, setProvince] = useState(user?.province || "تهران");
  const [city, setCity] = useState(user?.city || "تهران");

  // Keep state in sync with user prop updates
  useEffect(() => {
    if (user) {
      if (user.storeName) setStoreName(user.storeName);
      if (user.brandName) setBrandName(user.brandName);
      if (user.username) setUsername(user.username);
      if (user.fieldOfActivity) setFieldOfActivity(user.fieldOfActivity);
      if (user.storeLink || user.website) setStoreLink(user.storeLink || user.website);
      if (user.avatarUrl || user.logo) setAvatarUrl(user.avatarUrl || user.logo);
      if (user.phone || user.mobile) setPhone(user.phone || user.mobile);
      if (user.province) setProvince(user.province);
      if (user.city) setCity(user.city);
    }
  }, [user]);

  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  // Catalog Products State for Managing Mockups & Captions
  const [productsList, setProductsList] = useState<any[]>(DEFAULT_SAMPLE_PRODUCTS);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);

  // Active product customization draft state
  const [draftTitle, setDraftTitle] = useState("");
  const [draftCaption, setDraftCaption] = useState("");
  const [draftImageUrl, setDraftImageUrl] = useState("");
  const [draftPrice, setDraftPrice] = useState<number | string>("");
  const [savingProductCustomization, setSavingProductCustomization] = useState(false);

  // Active Tab for Mobile/Desktop Switching if preferred
  const [activeTab, setActiveTab] = useState<"settings" | "preview">("settings");

  // Helper function to safely fetch JSON without throwing on HTML responses or network errors
  const safeFetchJson = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get("content-type") || "";
      if (res.ok && contentType.includes("application/json")) {
        return await res.json();
      }
    } catch {
      // Return null on network error or invalid status
    }
    return null;
  };

  // Fetch store catalog or marketplace products with robust fallback
  const fetchMyCatalog = async () => {
    setLoadingProducts(true);
    try {
      const token = localStorage.getItem("token") || "";
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      let fetchedProds: any[] = [];

      // 1. Try my-catalog
      const myCatalogData = await safeFetchJson("/api/store-manager/my-catalog", {
        credentials: "include",
        headers
      });

      if (Array.isArray(myCatalogData) && myCatalogData.length > 0) {
        fetchedProds = myCatalogData.map((item: any) => {
          if (item.product) {
            const p = item.product;
            return {
              ...p,
              selectionId: item.id,
              id: p.id,
              customization: p.exploreContent || p.customization
            };
          }
          return item;
        });
      }

      // 2. Fallback to marketplace-products if my-catalog is empty
      if (fetchedProds.length === 0) {
        const mData = await safeFetchJson("/api/store-manager/marketplace-products", {
          credentials: "include",
          headers
        });
        if (mData) {
          const rawProds = Array.isArray(mData) ? mData : (mData.products || []);
          if (rawProds.length > 0) {
            fetchedProds = rawProds.map((p: any) => ({
              ...p,
              customization: p.exploreContent || p.customization
            }));
          }
        }
      }

      // 3. Fallback to /api/products
      if (fetchedProds.length === 0) {
        const pData = await safeFetchJson("/api/products");
        if (pData) {
          const rawProds = Array.isArray(pData) ? pData : (pData.products || []);
          if (rawProds.length > 0) {
            fetchedProds = rawProds.map((p: any) => ({
              ...p,
              customization: p.exploreContent || p.customization
            }));
          }
        }
      }

      // 4. Final fallback to sample products if database is empty
      if (fetchedProds.length > 0) {
        setProductsList(fetchedProds);
      } else {
        setProductsList(DEFAULT_SAMPLE_PRODUCTS);
      }
    } catch {
      setProductsList(DEFAULT_SAMPLE_PRODUCTS);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchMyCatalog();
  }, []);

  // Handle Store Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProfile(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/store-manager/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          storeName: storeName.trim(),
          brandName: brandName.trim(),
          fieldOfActivity: fieldOfActivity.trim(),
          storeLink: storeLink.trim(),
          website: storeLink.trim(),
          avatarUrl: avatarUrl.trim(),
          phone: phone.trim(),
          province,
          city
        })
      });

      const contentType = res.headers.get("content-type") || "";
      let data: any = {};
      if (contentType.includes("application/json")) {
        data = await res.json();
      }

      if (res.ok) {
        toast("تنظیمات پیج زوپیت‌گرام با موفقیت بروزرسانی شد", "success");
        if (onUpdateUser && data.user) {
          onUpdateUser(data.user);
        }
      } else {
        toast(data.error || "خطا در ثبت تنظیمات", "error");
      }
    } catch (err: any) {
      toast("خطا در برقراری ارتباط با سرور", "error");
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // Select a product to edit Mockup & Caption
  const handleSelectProductForEditing = (prod: any) => {
    setEditingProductId(prod.id);
    setDraftTitle(prod.customization?.customTitle || prod.name || "");
    setDraftCaption(prod.customization?.customDescription || prod.description || prod.shortDescription || "");
    setDraftImageUrl(prod.customization?.customImageUrl || prod.imageUrl || prod.image || "");
    setDraftPrice(prod.finalPrice || prod.customization?.customPrice || prod.price || "");
  };

  // Save Mockup & Caption for a single product
  const handleSaveProductCustomization = async (prodId: number) => {
    setSavingProductCustomization(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`/api/store-manager/products/${prodId}/customization`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          customTitle: draftTitle.trim(),
          customDescription: draftCaption.trim(),
          customImageUrl: draftImageUrl.trim(),
          customPrice: draftPrice ? Number(draftPrice) : null
        })
      });

      const contentType = res.headers.get("content-type") || "";
      let data: any = {};
      if (contentType.includes("application/json")) {
        data = await res.json();
      }

      if (res.ok) {
        toast("موکاپ تصویر و کپشن محصول با موفقیت ذخیره شد", "success");
      } else {
        toast("تغییرات تصویر موکاپ و کپشن به‌صورت محلی اعمال شد", "success");
      }

      setProductsList((prev) =>
        prev.map((item) => {
          if (item.id === prodId) {
            return {
              ...item,
              name: draftTitle.trim() || item.name,
              customization: {
                ...item.customization,
                customTitle: draftTitle.trim(),
                customDescription: draftCaption.trim(),
                customImageUrl: draftImageUrl.trim(),
                customPrice: draftPrice ? Number(draftPrice) : null
              }
            };
          }
          return item;
        })
      );
      setEditingProductId(null);
    } catch (err) {
      toast("تغییرات به‌صورت محلی اعمال گردید", "info");
      setEditingProductId(null);
    } finally {
      setSavingProductCustomization(false);
    }
  };

  // Filter display products for preview
  const displayProducts = productsList && productsList.length > 0 ? productsList.slice(0, 6) : DEFAULT_SAMPLE_PRODUCTS;

  return (
    <div className="space-y-8 animate-fade-in w-full max-w-full overflow-x-hidden pb-12">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-rose-600 via-purple-600 to-amber-500 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-bold">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>مدیریت پیج اختصاصی زوپیت‌گرام (ZoombitGram)</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black">
              تنظیمات پیج زوپیت‌گرام شما
            </h1>
            <p className="text-white/90 text-xs sm:text-sm max-w-2xl leading-relaxed">
              در این بخش مشخصات پروفایل پیج زوپیت‌گرام، تصویر موکاپ (Mockup) محصولات و متن کپشن هر کالا را به‌راحتی تنظیم فرمایید.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-3.5 py-2 rounded-2xl text-xs font-black flex items-center gap-1.5 backdrop-blur-md">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>پیج زوپیت‌گرام فعال است</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Container - Full Width Stacked Layout to Prevent Squeezing/Clipping */}
      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-8 items-start w-full">
        
        {/* Forms & Product Customization Section (Takes full width or 7/12 on extra wide screens) */}
        <div className="2xl:col-span-7 space-y-8 w-full min-w-0">
          
          {/* Section 1: Store Page Profile Settings Form */}
          <div className="bg-card p-5 sm:p-8 rounded-3xl border border-subtle shadow-sm space-y-6 w-full min-w-0">
            <div className="flex items-center justify-between border-b border-subtle pb-4">
              <h2 className="text-base sm:text-lg font-black text-primary flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-500" />
                <span>پروفایل و مشخصات پیج زوپیت‌گرام</span>
              </h2>
              <span className="text-xs text-muted font-bold font-mono">ZoombitGram</span>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-6 w-full">
              {/* Avatar & Profile Image */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold text-primary">
                  آدرس تصویر پروفایل (آواتار فروشگاه)
                </label>
                <div className="flex gap-3 items-center">
                  <div className="relative w-14 h-14 rounded-full bg-surface border border-subtle overflow-hidden shrink-0 flex items-center justify-center p-0.5 shadow-md">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <Camera className="w-6 h-6 text-muted" />
                    )}
                  </div>
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full bg-surface border border-subtle rounded-xl px-4 py-2.5 text-xs text-primary placeholder-muted outline-none focus:border-amber-500 transition-colors dir-ltr font-mono"
                  />
                </div>
                <p className="text-[11px] text-muted">لینک عکس لوگو یا تصویر پروفایل فروشگاه خود را وارد کنید.</p>
              </div>

              {/* Store Name & Brand Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="space-y-1.5 w-full min-w-0">
                  <label className="block text-xs font-extrabold text-primary">
                    نام فروشگاه (نمایشی)
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: فروشگاه دیجیتال آریا"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full bg-surface border border-subtle rounded-xl px-4 py-2.5 text-xs text-primary placeholder-muted outline-none focus:border-amber-500 transition-colors font-bold"
                    required
                  />
                </div>
                <div className="space-y-1.5 w-full min-w-0">
                  <label className="block text-xs font-extrabold text-primary">
                    نام برند / تجاری
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: آریا استور"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full bg-surface border border-subtle rounded-xl px-4 py-2.5 text-xs text-primary placeholder-muted outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Username & Field of Activity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                <div className="space-y-1.5 w-full min-w-0">
                  <label className="block text-xs font-extrabold text-primary">
                    نام کاربری زوپیت‌گرام (آیدی)
                  </label>
                  <div className="relative w-full">
                    <span className="absolute left-3 top-2.5 text-xs text-muted font-mono font-bold">@</span>
                    <input
                      type="text"
                      placeholder="zopit_store"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-surface border border-subtle rounded-xl pl-8 pr-4 py-2.5 text-xs text-primary placeholder-muted outline-none focus:border-amber-500 transition-colors font-mono font-bold text-left dir-ltr"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 w-full min-w-0">
                  <label className="block text-xs font-extrabold text-primary">
                    حوزه فعالیت / بیو پیج
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: مرکز تخصصی واردات و پخش لوازم جانبی"
                    value={fieldOfActivity}
                    onChange={(e) => setFieldOfActivity(e.target.value)}
                    className="w-full bg-surface border border-subtle rounded-xl px-4 py-2.5 text-xs text-primary placeholder-muted outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>

              {/* Website Direct Link */}
              <div className="space-y-1.5 w-full">
                <label className="block text-xs font-extrabold text-primary flex items-center justify-between">
                  <span>لینک مستقیم وب‌سایت خرید (ارجاع خریداران)</span>
                  <span className="text-amber-500 text-[11px] font-bold">بسیار مهم</span>
                </label>
                <div className="relative w-full">
                  <Globe className="w-4 h-4 text-muted absolute left-3 top-3" />
                  <input
                    type="url"
                    placeholder="https://my-store-website.com/shop"
                    value={storeLink}
                    onChange={(e) => setStoreLink(e.target.value)}
                    className="w-full bg-surface border border-subtle rounded-xl pl-10 pr-4 py-2.5 text-xs text-primary placeholder-muted outline-none focus:border-amber-500 transition-colors dir-ltr font-mono font-bold"
                  />
                </div>
                <p className="text-[11px] text-muted">خریداران در اکسپلور با کلیک روی «خرید از سایت» مستقیم به این آدرس هدایت می‌شوند.</p>
              </div>

              {/* Phone & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <div className="space-y-1.5 w-full min-w-0">
                  <label className="block text-xs font-extrabold text-primary">
                    تلفن پشتیبانی
                  </label>
                  <input
                    type="text"
                    placeholder="۰۹۱۲..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-surface border border-subtle rounded-xl px-4 py-2.5 text-xs text-primary placeholder-muted outline-none focus:border-amber-500 transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1.5 w-full min-w-0">
                  <label className="block text-xs font-extrabold text-primary">
                    استان
                  </label>
                  <select
                    value={province}
                    onChange={(e) => {
                      setProvince(e.target.value);
                      const pObj = PROVINCES.find((p) => p.name === e.target.value);
                      if (pObj && pObj.cities.length > 0) {
                        setCity(pObj.cities[0]);
                      }
                    }}
                    className="w-full bg-surface border border-subtle rounded-xl px-3 py-2.5 text-xs text-primary outline-none focus:border-amber-500 font-bold"
                  >
                    {PROVINCES.map((prov) => (
                      <option key={prov.name} value={prov.name}>
                        {prov.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 w-full min-w-0">
                  <label className="block text-xs font-extrabold text-primary">
                    شهر
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-surface border border-subtle rounded-xl px-3 py-2.5 text-xs text-primary outline-none focus:border-amber-500 font-bold"
                  >
                    {(PROVINCES.find((p) => p.name === province)?.cities || ["تهران"]).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Button for Profile */}
              <div className="pt-4 border-t border-subtle flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmittingProfile}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-amber-600 via-rose-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white rounded-2xl text-xs font-black shadow-lg transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmittingProfile ? "در حال ذخیره‌سازی..." : "ذخیره مشخصات پیج زوپیت‌گرام"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Product Mockup & Caption Management Box */}
          <div className="bg-card p-5 sm:p-8 rounded-3xl border border-subtle shadow-sm space-y-6 w-full min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle pb-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-primary flex items-center gap-2">
                  <Layers className="w-5 h-5 text-rose-500" />
                  <span>مدیریت موکاپ تصویر و کپشن محصولات</span>
                </h2>
                <p className="text-xs text-muted mt-1">
                  برای هر کالا، تصویر موکاپ باکیفیت و کپشن متن پست زوپیت‌گرام را تنظیم کنید.
                </p>
              </div>
              <button
                type="button"
                onClick={fetchMyCatalog}
                className="px-3.5 py-2 bg-surface hover:bg-subtle text-primary border border-subtle rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-center cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingProducts ? "animate-spin text-amber-500" : ""}`} />
                <span>بروزرسانی محصولات</span>
              </button>
            </div>

            {/* List of Products as Manageable Post Cards */}
            {loadingProducts ? (
              <div className="py-12 text-center text-xs text-muted flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
                <span>در حال دریافت و آماده‌سازی لیست محصولات...</span>
              </div>
            ) : productsList && productsList.length > 0 ? (
              <div className="space-y-4 w-full">
                {productsList.map((prod) => {
                  const isEditing = editingProductId === prod.id;
                  const currentImage = prod.customization?.customImageUrl || prod.imageUrl || prod.image || prod.mainImage;
                  const currentCaption = prod.customization?.customDescription || prod.description || prod.shortDescription || "";
                  const currentTitle = prod.customization?.customTitle || prod.name;
                  const currentPrice = prod.customization?.customPrice || prod.finalPrice || prod.price;

                  return (
                    <div
                      key={prod.id}
                      className={`p-4 rounded-2xl border transition-all w-full min-w-0 ${
                        isEditing
                          ? "bg-surface border-amber-500/50 shadow-md"
                          : "bg-surface/50 border-subtle hover:border-subtle/80"
                      }`}
                    >
                      {/* Condensed View when not editing */}
                      {!isEditing ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            {/* Product Thumbnail / Mockup */}
                            <div className="w-14 h-14 rounded-xl bg-card border border-subtle overflow-hidden shrink-0 relative shadow-sm">
                              <img
                                src={currentImage || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80"}
                                alt={currentTitle}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                            <div className="space-y-1 min-w-0 flex-1">
                              <h3 className="text-xs sm:text-sm font-black text-primary truncate">
                                {currentTitle}
                              </h3>
                              <p className="text-[11px] text-muted line-clamp-1 leading-relaxed">
                                {currentCaption ? `کپشن: ${currentCaption}` : "بدون کپشن اختصاصی"}
                              </p>
                              {currentPrice && (
                                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono block">
                                  {Number(currentPrice).toLocaleString('fa-IR')} تومان
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSelectProductForEditing(prod)}
                            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm shrink-0 flex items-center justify-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>مدیریت موکاپ و کپشن</span>
                          </button>
                        </div>
                      ) : (
                        /* Expanded Form Box for Editing Product Mockup & Caption */
                        <div className="space-y-4 w-full min-w-0">
                          <div className="flex items-center justify-between border-b border-subtle pb-3">
                            <span className="text-xs font-black text-amber-500 flex items-center gap-1.5">
                              <ImageIcon className="w-4 h-4" />
                              <span>تنظیمات موکاپ و کپشن کالا: {prod.name}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setEditingProductId(null)}
                              className="text-xs text-muted hover:text-primary font-bold flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>انصراف</span>
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                            {/* Product Title */}
                            <div className="space-y-1 w-full min-w-0">
                              <label className="block text-xs font-extrabold text-primary flex items-center gap-1">
                                <Tag className="w-3.5 h-3.5 text-amber-500" />
                                <span>عنوان نمایشی در زوپیت‌گرام</span>
                              </label>
                              <input
                                type="text"
                                value={draftTitle}
                                onChange={(e) => setDraftTitle(e.target.value)}
                                placeholder="عنوان کالا..."
                                className="w-full bg-card border border-subtle rounded-xl px-3 py-2 text-xs text-primary font-bold outline-none focus:border-amber-500"
                              />
                            </div>

                            {/* Custom Price */}
                            <div className="space-y-1 w-full min-w-0">
                              <label className="block text-xs font-extrabold text-primary flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                                <span>قیمت فروش (تومان)</span>
                              </label>
                              <input
                                type="number"
                                value={draftPrice}
                                onChange={(e) => setDraftPrice(e.target.value)}
                                placeholder="قیمت..."
                                className="w-full bg-card border border-subtle rounded-xl px-3 py-2 text-xs text-primary font-mono font-bold outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>

                          {/* Image Mockup URL */}
                          <div className="space-y-1.5 w-full">
                            <label className="block text-xs font-extrabold text-primary flex items-center gap-1">
                              <Camera className="w-3.5 h-3.5 text-purple-500" />
                              <span>تصویر موکاپ کالا (آدرس عکس کیفیت بالا)</span>
                            </label>
                            <div className="flex gap-2 items-center w-full">
                              <div className="w-12 h-12 rounded-xl bg-card border border-subtle overflow-hidden shrink-0">
                                <img
                                  src={draftImageUrl || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80"}
                                  alt="Mockup Preview"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                              <input
                                type="url"
                                value={draftImageUrl}
                                onChange={(e) => setDraftImageUrl(e.target.value)}
                                placeholder="https://example.com/product-mockup.jpg"
                                className="w-full bg-card border border-subtle rounded-xl px-3 py-2.5 text-xs text-primary font-mono outline-none focus:border-amber-500 dir-ltr"
                              />
                            </div>
                            <p className="text-[10px] text-muted">آدرس تصویر موکاپ باکیفیت جهت جایگذاری در پست زوپیت‌گرام کالا.</p>
                          </div>

                          {/* Post Caption */}
                          <div className="space-y-1.5 w-full">
                            <label className="block text-xs font-extrabold text-primary flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5 text-rose-500" />
                              <span>کپشن و متن توضیحات پست زوپیت‌گرام</span>
                            </label>
                            <textarea
                              rows={3}
                              value={draftCaption}
                              onChange={(e) => setDraftCaption(e.target.value)}
                              placeholder="کپشن معرفی کالا، ویژگی‌ها و هشتگ‌ها را اینجا بنویسید..."
                              className="w-full bg-card border border-subtle rounded-xl p-3 text-xs text-primary placeholder-muted outline-none focus:border-amber-500 leading-relaxed resize-none"
                            />
                          </div>

                          {/* Save Customization Actions */}
                          <div className="flex justify-end gap-2 pt-2 border-t border-subtle">
                            <button
                              type="button"
                              onClick={() => setEditingProductId(null)}
                              className="px-4 py-2 bg-card hover:bg-subtle text-muted text-xs font-bold rounded-xl transition-all"
                            >
                              انصراف
                            </button>
                            <button
                              type="button"
                              disabled={savingProductCustomization}
                              onClick={() => handleSaveProductCustomization(prod.id)}
                              className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>{savingProductCustomization ? "در حال ذخیره..." : "ذخیره موکاپ و کپشن"}</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

        </div>

        {/* Live Mock ZoombitGram Profile Preview Card Section */}
        <div className="2xl:col-span-5 space-y-4 w-full min-w-0 max-w-lg mx-auto 2xl:max-w-none">
          <div className="flex items-center justify-between px-2">
            <span className="text-xs font-black text-primary flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>پیش‌نمایش زنده پیج زوپیت‌گرام</span>
            </span>
            <span className="text-[10px] bg-rose-500/10 text-rose-500 font-bold px-2 py-0.5 rounded-full border border-rose-500/20">
              ZoombitGram Live
            </span>
          </div>

          {/* ZoombitGram Card Frame */}
          <div className="bg-black text-white rounded-[32px] p-5 shadow-2xl border border-zinc-800 space-y-5 font-sans overflow-hidden w-full max-w-full">
            {/* Header Bar */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3 gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                <span className="text-xs font-extrabold font-mono text-zinc-300 dir-ltr inline-block truncate">
                  @{username || "zopit_store"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                  زوپیت‌گرام رسمی
                </span>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex items-center justify-between gap-3">
              {/* Avatar with Ring */}
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-[2.5px] shadow-lg">
                  <div className="w-full h-full rounded-full bg-zinc-950 p-[2px]">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-white text-base font-black">
                        {storeName ? storeName.charAt(0) : "ف"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex-1 grid grid-cols-3 text-center gap-1">
                <div>
                  <span className="text-sm font-black block text-white">{displayProducts.length}</span>
                  <span className="text-[10px] text-zinc-400 font-medium">پست موکاپ</span>
                </div>
                <div>
                  <span className="text-sm font-black block text-white">۱,۲۸۰</span>
                  <span className="text-[10px] text-zinc-400 font-medium">دنبال‌کننده</span>
                </div>
                <div>
                  <span className="text-sm font-black block text-white">۱۰۰٪</span>
                  <span className="text-[10px] text-zinc-400 font-medium">اصالت کالا</span>
                </div>
              </div>
            </div>

            {/* Bio Details */}
            <div className="space-y-1 text-right text-xs">
              <h3 className="font-extrabold text-white text-sm">
                {storeName || "مدیر فروشگاه زوپیت"}
              </h3>
              {brandName && <p className="text-zinc-400 font-bold text-[11px]">{brandName}</p>}
              <p className="text-zinc-300 font-medium text-[11px] leading-relaxed">
                {fieldOfActivity || "تامین و عرضه محصولات با کیفیت عالی در زوپیت‌گرام"}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-zinc-400 pt-0.5">
                <MapPin className="w-3 h-3 text-amber-400" />
                <span>{province}، {city}</span>
              </div>
            </div>

            {/* Action Buttons in Mock */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (storeLink) {
                    window.open(storeLink.startsWith('http') ? storeLink : `https://${storeLink}`, '_blank');
                  } else {
                    toast("لطفاً ابتدا لینک وب‌سایت خود را ثبت کنید.", "error");
                  }
                }}
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer shadow-md"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>خرید از سایت</span>
                <ExternalLink className="w-3 h-3" />
              </button>

              <button
                type="button"
                className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1 transition-all"
              >
                <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
                <span>پرسش</span>
              </button>
            </div>

            {/* Mock ZoombitGram Grid Gallery with Mockups */}
            <div className="pt-2">
              <div className="flex items-center justify-center gap-2 border-t border-zinc-800 py-2 text-zinc-400 text-xs font-bold">
                <Grid className="w-4 h-4 text-white" />
                <span className="text-white">موکاپ پست‌های کالا</span>
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
                {displayProducts.map((item: any, i: number) => {
                  const img = item.customization?.customImageUrl || item.imageUrl || item.image || item.mainImage || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80";
                  return (
                    <div key={item.id || i} className="aspect-square bg-zinc-900 overflow-hidden relative group">
                      <img
                        src={img}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
