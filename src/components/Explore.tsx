import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  Heart, 
  MessageCircle, 
  ShoppingBag, 
  ShoppingCart,
  X, 
  Store, 
  ChevronUp, 
  ChevronDown, 
  Search, 
  Send,
  Loader2,
  HelpCircle,
  MessageSquare,
  User,
  CheckCircle2,
  Phone,
  Trash2,
  Minus,
  ExternalLink,
  Plus,
  Check,
  CreditCard,
  ArrowRight,
  Image as ImageIcon,
  Grid
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "./GlobalToast";
import { useCart } from "./CartContext";
import { PROVINCES } from "../data/provinces";
import { getValidProductImageUrl } from "../utils/productUtils";

export default function Explore({ onBack }: { onBack?: () => void } = {}) {
  const [products, setProducts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  // Store Page Instagram Modal state
  const [showStorePage, setShowStorePage] = useState(false);
  const [storePageData, setStorePageData] = useState<any>(null);

  // Search & Categories state
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Interactive stats and comments state
  const [deviceId, setDeviceId] = useState("");
  const [stats, setStats] = useState({ likesCount: 0, commentsCount: 0, isLiked: false });
  const [comments, setComments] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"comments" | "qa">("comments");
  const [showComments, setShowComments] = useState(false);
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showLargeHeart, setShowLargeHeart] = useState(false);
  const [direction, setDirection] = useState(1); // 1 = slide up (next), -1 = slide down (prev)

  // Question Form State
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionName, setQuestionName] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastWheelTime = useRef(0);

  // Payment callback result
  const [paymentResult, setPaymentResult] = useState<{success: boolean; orderId?: string} | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment_status");
    const orderId = params.get("orderId");
    if (paymentStatus) {
      setPaymentResult({
        success: paymentStatus === "success",
        orderId: orderId || undefined
      });
      // Clean up URL query parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Guest Device ID setup
  useEffect(() => {
    let id = localStorage.getItem("explore_device_id");
    if (!id) {
      id = "guest-" + Math.random().toString(36).substring(2, 11);
      localStorage.setItem("explore_device_id", id);
    }
    setDeviceId(id);
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    fetch("/api/public/categories")
      .then((res) => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) return [];
        return res.json();
      })
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  // Fetch products
  const fetchProducts = async (pageNum: number, category: number | null = selectedCategory, search: string = searchQuery) => {
    setLoading(true);
    try {
      let url = `/api/public/products?page=${pageNum}&limit=20&sort=cheapest`;
      if (category) {
        url += `&categoryId=${category}`;
      }
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const items = data.products || [];
        if (items.length === 0) {
          if (pageNum === 1) {
            setProducts([]);
          }
          setHasMore(false);
        } else {
          setProducts((prev) => {
            if (pageNum === 1) {
              return items;
            }
            const ids = new Set(prev.map((p) => p.id));
            return [...prev, ...items.filter((p: any) => !ids.has(p.id))];
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Trigger loading products on category or search change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchProducts(1, selectedCategory, searchQuery);
  }, [selectedCategory, searchQuery]);

  // Infinite scroll trigger
  useEffect(() => {
    if (page > 1) {
      fetchProducts(page, selectedCategory, searchQuery);
    }
  }, [page]);

  // Intersection observer for infinite grid scrolling
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // Load stats and comments for current item
  const fetchStatsAndComments = async (productId: number) => {
    if (!deviceId) return;
    try {
      // stats
      const statsRes = await fetch(`/api/public/products/${productId}/stats?deviceId=${deviceId}`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      // comments
      const commentsRes = await fetch(`/api/public/products/${productId}/comments`);
      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setComments(commentsData);
      }
      // questions
      const questionsRes = await fetch(`/api/public/products/${productId}/questions`);
      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        setQuestions(questionsData);
      }
    } catch (err) {
      console.error("Error loading stats and comments:", err);
    }
  };

  useEffect(() => {
    if (viewerIndex !== null && products[viewerIndex]) {
      fetchStatsAndComments(products[viewerIndex].id);
      setShowComments(false);
      setShowQuestionModal(false);
      setActiveTab("comments");
    }
  }, [viewerIndex, products, deviceId]);

  // Navigate reels with loop
  const goNext = useCallback(() => {
    if (viewerIndex === null || products.length === 0) return;
    setDirection(1);
    const next = viewerIndex + 1;
    if (next >= products.length - 3 && hasMore && !loading) {
      setPage((prev) => prev + 1);
    }
    setViewerIndex(next >= products.length ? 0 : next);
  }, [viewerIndex, products.length, hasMore, loading]);

  const goPrev = useCallback(() => {
    if (viewerIndex === null || products.length === 0) return;
    setDirection(-1);
    setViewerIndex(viewerIndex - 1 < 0 ? products.length - 1 : viewerIndex - 1);
  }, [viewerIndex, products.length]);

  // Keyboard & Wheel navigation
  useEffect(() => {
    if (viewerIndex === null) return;
    
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") goNext();
      if (e.key === "ArrowUp") goPrev();
      if (e.key === "Escape") setViewerIndex(null);
    };

    const wheelHandler = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelTime.current < 800) return; // Debounce to prevent multiple fires
      
      if (e.deltaY > 30) {
        lastWheelTime.current = now;
        goNext();
      } else if (e.deltaY < -30) {
        lastWheelTime.current = now;
        goPrev();
      }
    };

    window.addEventListener("keydown", keyHandler);
    window.addEventListener("wheel", wheelHandler, { passive: false });
    
    return () => {
      window.removeEventListener("keydown", keyHandler);
      window.removeEventListener("wheel", wheelHandler);
    };
  }, [viewerIndex, goNext, goPrev]);

  // Like Toggle action
  const handleLikeToggle = async () => {
    if (viewerIndex === null || !products[viewerIndex] || !deviceId) return;
    const productId = products[viewerIndex].id;
    try {
      const res = await fetch(`/api/public/products/${productId}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId })
      });
      if (res.ok) {
        const data = await res.json();
        setStats((prev) => ({
          ...prev,
          isLiked: data.liked,
          likesCount: data.likesCount
        }));
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  // Double tap to like action
  let lastTap = 0;
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      setShowLargeHeart(true);
      setTimeout(() => setShowLargeHeart(false), 800);
      if (!stats.isLiked) {
        handleLikeToggle();
      }
    }
    lastTap = now;
  };

  // Submit comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (viewerIndex === null || !products[viewerIndex] || !commentText.trim()) return;
    const productId = products[viewerIndex].id;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/public/products/${productId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: commentName.trim() || "کاربر مهمان",
          text: commentText.trim()
        })
      });
      if (res.ok) {
        const newComment = await res.json();
        setComments((prev) => [newComment, ...prev]);
        setStats((prev) => ({ ...prev, commentsCount: prev.commentsCount + 1 }));
        setCommentText("");
        toast("نظر شما با موفقیت ثبت شد", "success");
      }
    } catch (err) {
      console.error(err);
      toast("خطا در ثبت نظر", "error");
    } finally {
      setSubmittingComment(false);
    }
  };

  // Submit Question
  const handleQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (viewerIndex === null || !products[viewerIndex]) return;
    if (!questionText.trim()) {
      toast("لطفاً متن سوال را وارد کنید", "error");
      return;
    }
    const currentProduct = products[viewerIndex];
    setSubmittingQuestion(true);
    try {
      const res = await fetch(`/api/public/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: currentProduct.id,
          storeManagerId: currentProduct.storeId || null,
          askerName: questionName.trim() || "کاربر ناشناس",
          questionText: questionText.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setQuestionName("");
        setQuestionText("");
        setShowQuestionModal(false);
        if (data.question) {
          setQuestions((prev) => [data.question, ...prev]);
        }
        toast("سوال شما با موفقیت ثبت شد و پس از پاسخ نمایش داده می‌شود.", "success");
      } else {
        toast(data.error || "خطا در ثبت سوال", "error");
      }
    } catch (err) {
      console.error(err);
      toast("خطای شبکه در ثبت سوال", "error");
    } finally {
      setSubmittingQuestion(false);
    }
  };

  const getStoreRedirectUrl = (product: any) => {
    let link = product?.storeLink || product?.storeUrl || product?.store?.storeLink || product?.storeManager?.storeLink || "";
    if (!link && product?.storeId) {
      link = `https://${product.storeId}.zopit.ir`;
    }
    if (link && !/^https?:\/\//i.test(link)) {
      return "https://" + link;
    }
    return link;
  };

  const current = viewerIndex !== null ? products[viewerIndex] : null;
  const redirectUrl = current ? getStoreRedirectUrl(current) : "";

  return (
    <div dir="rtl" className="min-h-screen bg-black pb-24 font-sans text-right relative overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-white/5 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="text-white hover:text-rose-500 bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 ml-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs"
              title="بازگشت"
            >
              <ArrowRight className="w-4 h-4 text-rose-500" />
              <span>بازگشت به پنل</span>
            </button>
          )}
          <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
          <h1 className="text-white text-lg font-black tracking-tight">اکسپلور کالا</h1>
        </div>
        <div className="text-zinc-500 text-xs font-bold">دیدن واقعی کالاها</div>
      </header>

      {/* Search and Category Filters */}
      <div className="bg-black border-b border-white/5 px-6 py-4 space-y-3 relative z-20">
        {/* Search Input Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="جستجوی هوشمند در کالاها..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-5 py-3 pr-11 text-xs text-white placeholder-zinc-500 outline-none focus:border-rose-500 font-semibold transition-all text-right"
            dir="rtl"
          />
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Categories Horizontal Scroller */}
        <div className="flex items-center gap-2 overflow-x-auto py-1 text-right scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent" dir="rtl">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-[11px] font-extrabold transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === null
                ? "bg-rose-600 text-white shadow-lg shadow-rose-600/25"
                : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/5"
            }`}
          >
            همه دسته‌ها
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-[11px] font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/25"
                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/5"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Instagram Mosaic Staggered Grid without Borders */}
      <main className="px-0.5 py-0.5">
        <div className="grid grid-cols-3 gap-0.5 grid-flow-row-dense">
          {products.map((p, i) => {
            const isLarge = i % 7 === 1;
            return (
              <div
                key={p.id}
                ref={i === products.length - 1 ? lastElementRef : null}
                onClick={() => setViewerIndex(i)}
                className={`group relative overflow-hidden bg-zinc-900 cursor-pointer ${
                  isLarge 
                    ? "col-span-2 row-span-2 h-[280px] md:h-[440px]" 
                    : "col-span-1 row-span-1 h-[140px] md:h-[220px]"
                }`}
              >
                {(() => {
                  const img = getValidProductImageUrl(p);
                  if (img) {
                    return (
                      <img 
                        src={img} 
                        alt={p.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        loading="lazy" 
                        referrerPolicy="no-referrer"
                      />
                    );
                  }
                  return (
                    <div className="w-full h-full bg-zinc-900 flex flex-col items-center justify-center gap-1 text-zinc-500 p-2 text-center">
                      <ImageIcon className="w-8 h-8 opacity-40" />
                      <span className="text-[11px] font-bold">بدون تصویر</span>
                    </div>
                  );
                })()}
                
                {/* Clean hover overlay with a high contrast like icon */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <div className="flex items-center gap-1.5 text-white bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-md text-xs font-bold shadow-lg">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    <span>مشاهده جزئیات</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {products.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 text-xs font-bold gap-3">
            <Search className="w-10 h-10 text-zinc-700" />
            <span>هیچ محصولی با این مشخصات یافت نشد.</span>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-6 h-6 text-primary-default animate-spin" />
            <span className="text-zinc-400 text-xs font-semibold mr-2.5">در حال بارگذاری اکسپلور...</span>
          </div>
        )}

        {/* Explore Footer */}
        <footer className="mt-16 pt-8 pb-12 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6" dir="rtl">
          <div className="flex flex-col gap-1 text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-black text-white">سامانه هوشمند زنجیره تامین و فروش عمده کالا (زوپیت)</span>
            </div>
            <p className="text-[11px] text-zinc-500 font-medium">
              تمامی حقوق مادی و معنوی این وبگاه محفوظ و متعلق به سامانه زوپیت می‌باشد.
            </p>
          </div>
        </footer>
      </main>

      {/* Immersive Instagram Reels-like Fullscreen Viewer */}
      <AnimatePresence>
        {viewerIndex !== null && current && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col justify-center items-center select-none"
          >
            {/* Background decorative blur */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-25 blur-3xl pointer-events-none" 
              style={{ backgroundImage: `url(${getValidProductImageUrl(current)})` }}
            ></div>

            {/* Close button - Top Right */}
            <div className="absolute top-4 right-4 z-50">
              <button 
                onClick={() => setViewerIndex(null)} 
                className="bg-black/50 hover:bg-black/80 border border-white/10 text-white rounded-full p-2.5 transition-all cursor-pointer shadow-lg active:scale-90"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Index Counter - Top Left */}
            <div className="absolute top-4 left-4 z-50">
              <div className="bg-black/50 border border-white/10 px-4 py-1.5 rounded-full text-white/90 text-xs font-bold shadow-lg font-mono">
                {viewerIndex + 1} از {products.length}
              </div>
            </div>

            {/* Reels Viewport Frame */}
            <div className="relative w-full h-full max-w-[500px] bg-zinc-950 flex flex-col justify-center items-center overflow-hidden border-x border-white/5 shadow-2xl">
              <AnimatePresence initial={false} custom={direction}>
                <motion.div
                  key={current.id}
                  custom={direction}
                  variants={{
                    enter: (dir) => ({
                      y: dir > 0 ? "100%" : "-100%",
                      opacity: 0.8
                    }),
                    center: {
                      y: 0,
                      opacity: 1,
                      transition: { y: { type: "spring", stiffness: 300, damping: 32 }, opacity: { duration: 0.25 } }
                    },
                    exit: (dir) => ({
                      y: dir < 0 ? "100%" : "-100%",
                      opacity: 0.8,
                      transition: { y: { type: "spring", stiffness: 300, damping: 32 }, opacity: { duration: 0.25 } }
                    })
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.4}
                  onDragEnd={(e, info) => {
                    if (info.offset.y < -60) {
                      goNext();
                    } else if (info.offset.y > 60) {
                      goPrev();
                    }
                  }}
                  onClick={handleDoubleTap}
                  className="absolute inset-0 w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
                >
                  {/* Big Double-Tap Heart overlay */}
                  <AnimatePresence>
                    {showLargeHeart && (
                      <motion.div 
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.4, 1], opacity: [0, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                        className="absolute z-30 pointer-events-none"
                      >
                        <Heart className="w-24 h-24 text-rose-500 fill-rose-500 filter drop-shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Product Display Video / Image */}
                  {current.customVideoUrl ? (
                    <div className="w-full h-full flex items-center justify-center p-2 bg-black" onClick={(e) => e.stopPropagation()}>
                      <video
                        src={current.customVideoUrl}
                        controls
                        className="w-full max-h-full rounded-lg shadow-xl"
                        playsInline
                      />
                    </div>
                  ) : getValidProductImageUrl(current) ? (
                    <img 
                      src={getValidProductImageUrl(current)} 
                      alt={current.name} 
                      className="w-full h-full object-contain pointer-events-none" 
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 text-zinc-500">
                      <ImageIcon className="w-16 h-16 opacity-30" />
                      <span className="text-xs font-bold">تصویر محصول ثبت نشده است</span>
                    </div>
                  )}

                  {/* Left Vertical Interaction Column */}
                  <div className="absolute left-4 bottom-56 z-30 flex flex-col gap-4 items-center">
                    {/* Like button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleLikeToggle(); }}
                      className="group flex flex-col items-center gap-1 bg-black/50 hover:bg-black/75 border border-white/10 rounded-full p-3 text-white transition-all cursor-pointer shadow-xl active:scale-90"
                    >
                      <Heart className={`w-6 h-6 transition-transform group-active:scale-125 ${stats.isLiked ? "text-rose-500 fill-rose-500" : "text-white"}`} />
                      <span className="text-[11px] font-extrabold font-mono text-zinc-300">{stats.likesCount}</span>
                    </button>

                    {/* Comment button */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowComments(true); }}
                      className="flex flex-col items-center gap-1 bg-black/50 hover:bg-black/75 border border-white/10 rounded-full p-3 text-white transition-all cursor-pointer shadow-xl active:scale-90"
                    >
                      <MessageCircle className="w-6 h-6 text-white" />
                      <span className="text-[11px] font-extrabold font-mono text-zinc-300">{stats.commentsCount}</span>
                    </button>
                  </div>

                  {/* Bottom Info Details and Actions Panel */}
                  <div className="absolute bottom-0 inset-x-0 z-30 bg-gradient-to-t from-black via-black/90 to-transparent pt-12 pb-5 px-3 sm:px-4 flex flex-col gap-3">
                    
                    {/* Store Title & Avatar */}
                    <div className="flex items-center gap-2.5 p-1">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-500 to-emerald-500 p-[2px] shadow-lg flex items-center justify-center overflow-hidden shrink-0">
                        <div className="w-full h-full rounded-full bg-zinc-950 p-[1px]">
                          {current.avatarUrl ? (
                            <img src={current.avatarUrl} alt={current.storeName} className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-black">
                              {current.storeName ? current.storeName.charAt(0) : "ف"}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col text-right min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white text-sm font-black tracking-tight truncate">
                            {current.storeName || "مدیر فروشگاه"}
                          </span>
                          <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0">
                            مدیر فروشگاه
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Product Metadata */}
                    <div className="text-right space-y-1">
                      <h2 className="text-white text-sm sm:text-base font-black leading-snug">{current.name}</h2>
                      
                      {current.description && (
                        <p className="text-zinc-300 text-xs font-medium leading-relaxed line-clamp-2">
                          {current.description}
                        </p>
                      )}
                    </div>

                    {/* Concise Action Buttons (2 buttons on mobile and desktop) */}
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const redirectUrl = current.storeLink || current.storeUrl;
                          if (redirectUrl) {
                            window.open(redirectUrl.startsWith('http') ? redirectUrl : `https://${redirectUrl}`, '_blank', 'noopener,noreferrer');
                          } else {
                            toast(`مدیر فروشگاه (${current.storeName || "زوپیت"}) هنوز آدرس اختصاصی وب‌سایت خود را تنظیم نکرده است.`, "error");
                          }
                        }}
                        className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-950/40 border border-emerald-400/30"
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
                        <span className="truncate">خرید از سایت</span>
                        <ExternalLink className="w-3 h-3 text-emerald-200 shrink-0" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowQuestionModal(true);
                        }}
                        className="w-full py-2.5 px-3 bg-zinc-800/90 hover:bg-zinc-700 border border-white/10 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate">پرسش</span>
                      </button>
                    </div>

                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Desktop Navigation Arrows */}
            <div className="hidden md:flex absolute right-12 bottom-1/2 translate-y-1/2 flex-col gap-4 z-40">
              <button 
                onClick={goPrev} 
                className="bg-black/50 hover:bg-black/85 border border-white/10 rounded-full p-3.5 text-white transition-all cursor-pointer shadow-xl active:scale-90"
              >
                <ChevronUp className="w-6 h-6" />
              </button>
              <button 
                onClick={goNext} 
                className="bg-black/50 hover:bg-black/85 border border-white/10 rounded-full p-3.5 text-white transition-all cursor-pointer shadow-xl active:scale-90"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
            </div>

            {/* Interactive Comments Bottom Sheet */}
            <AnimatePresence>
              {showComments && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowComments(false)}
                  className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex justify-center items-end"
                >
                  <motion.div 
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 26, stiffness: 220 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-zinc-950 border-t border-white/10 w-full max-w-[500px] h-[75vh] rounded-t-3xl flex flex-col overflow-hidden"
                  >
                    {/* Header of sheet with Tabs */}
                    <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/40">
                      <div className="flex gap-4">
                        <button 
                          onClick={() => setActiveTab("comments")} 
                          className={`text-xs md:text-sm font-black transition-all ${activeTab === "comments" ? "text-rose-500 border-b-2 border-rose-500 pb-1" : "text-white/60 hover:text-white"}`}
                        >
                          نظرات ({comments.length})
                        </button>
                        <button 
                          onClick={() => setActiveTab("qa")} 
                          className={`text-xs md:text-sm font-black transition-all ${activeTab === "qa" ? "text-rose-500 border-b-2 border-rose-500 pb-1" : "text-white/60 hover:text-white"}`}
                        >
                          پرسش و پاسخ ({questions.length})
                        </button>
                      </div>
                      <button onClick={() => setShowComments(false)} className="text-white/60 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {activeTab === "comments" ? (
                      <>
                        {/* Comments list */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                          {comments.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-xs py-16">
                              <MessageCircle className="w-12 h-12 mb-3 text-zinc-800" />
                              <span>اولین کسی باشید که نظری ثبت می‌کند!</span>
                            </div>
                          ) : (
                            comments.map((comment) => (
                              <div key={comment.id} className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 text-right">
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-rose-400 text-xs font-black">{comment.authorName}</span>
                                  <span className="text-[10px] text-zinc-500 font-bold font-mono">
                                    {new Date(comment.createdAt).toLocaleDateString("fa-IR")}
                                  </span>
                                </div>
                                <p className="text-white/90 text-xs font-bold leading-relaxed">{comment.text}</p>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Comment submit form */}
                        <form onSubmit={handleSubmitComment} className="p-4 border-t border-white/10 bg-zinc-950 flex flex-col gap-2">
                          <div className="grid grid-cols-1">
                            <input 
                              type="text" 
                              placeholder="نام شما (اختیاری)"
                              value={commentName}
                              onChange={(e) => setCommentName(e.target.value)}
                              className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-rose-500 font-bold"
                            />
                          </div>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              required
                              placeholder="نظر خود را بنویسید..."
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              className="flex-1 bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-500 outline-none focus:border-rose-500 font-bold"
                            />
                            <button 
                              type="submit"
                              disabled={submittingComment}
                              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-5 py-3 flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              {submittingComment ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Send className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </form>
                      </>
                    ) : (
                      /* Q&A list */
                      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                        {questions.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-xs py-16">
                            <HelpCircle className="w-12 h-12 mb-3 text-zinc-800" />
                            <span>هنوز سوالی مطرح نشده است. اولین سوال را بپرسید!</span>
                            <button
                              onClick={() => {
                                setShowComments(false);
                                setShowQuestionModal(true);
                              }}
                              className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition-colors cursor-pointer"
                            >
                              طرح سوال جدید
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {questions.map((q) => (
                              <div key={q.id} className="bg-zinc-900/40 p-4 rounded-xl border border-white/5 text-right flex flex-col gap-3">
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-amber-400 text-[10px] font-black">❓ سوال از {q.askerName || 'کاربر ناشناس'}</span>
                                    <span className="text-[9px] text-zinc-500 font-bold font-mono">
                                      {new Date(q.createdAt).toLocaleDateString("fa-IR")}
                                    </span>
                                  </div>
                                  <p className="text-white/90 text-xs font-bold leading-relaxed">{q.questionText}</p>
                                </div>
                                
                                {q.isAnswered ? (
                                  <div className="bg-zinc-950/60 p-3 rounded-lg border-r-2 border-emerald-500 mr-2">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-emerald-400 text-[10px] font-black">💬 پاسخ فروشگاه</span>
                                      {q.answeredAt && (
                                        <span className="text-[9px] text-zinc-600 font-bold font-mono">
                                          {new Date(q.answeredAt).toLocaleDateString("fa-IR")}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-zinc-300 text-xs font-bold leading-relaxed">{q.answerText}</p>
                                  </div>
                                ) : (
                                  <span className="text-zinc-600 text-[10px] font-semibold italic mr-2">در انتظار پاسخ مدیر فروشگاه...</span>
                                )}
                              </div>
                            ))}
                            
                            <div className="pt-2 flex justify-center pb-6">
                              <button
                                onClick={() => {
                                  setShowComments(false);
                                  setShowQuestionModal(true);
                                }}
                                className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white border border-white/5 rounded-xl text-xs font-black transition-colors cursor-pointer"
                              >
                                طرح سوال جدید
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Ask Question Dialog Modal */}
            <AnimatePresence>
              {showQuestionModal && (
                <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="w-full max-w-[420px] bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
                  >
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/30">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-rose-500" />
                        <span className="text-white text-sm font-black">پرسیدن سوال از فروشگاه</span>
                      </div>
                      <button 
                        onClick={() => setShowQuestionModal(false)}
                        className="text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 p-1 rounded-full transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Content Form */}
                    <form onSubmit={handleQuestionSubmit} className="p-5 flex flex-col gap-4 text-right">
                      <p className="text-zinc-400 text-[11px] font-bold leading-relaxed mb-1">
                        سوال شما مستقیماً برای مدیر غرفه ارسال شده و در اسرع وقت پاسخ داده خواهد شد.
                      </p>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-zinc-300 text-[11px] font-black">نام شما (اختیاری)</label>
                        <input
                          type="text"
                          placeholder="مثال: علی احمدی (یا خالی بگذارید)"
                          value={questionName}
                          onChange={(e) => setQuestionName(e.target.value)}
                          className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 outline-none focus:border-rose-500 font-bold"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-zinc-300 text-[11px] font-black">متن سوال شما</label>
                        <textarea
                          required
                          rows={4}
                          placeholder="سوال خود در مورد قیمت، مشخصات، زمان ارسال و... را اینجا بنویسید..."
                          value={questionText}
                          onChange={(e) => setQuestionText(e.target.value)}
                          className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-3 text-xs text-white placeholder-zinc-600 outline-none focus:border-rose-500 font-bold resize-none leading-relaxed"
                        />
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={submittingQuestion}
                        className="w-full mt-2 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                      >
                        {submittingQuestion ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>در حال ثبت سوال...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>ثبت نهایی سوال</span>
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
            
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Result Modal */}
      <AnimatePresence>
        {paymentResult && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-2xl p-6 text-center shadow-2xl"
            >
              {paymentResult.success ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 className="text-white text-lg font-black">پرداخت با موفقیت انجام شد!</h3>
                  <p className="text-zinc-400 text-xs font-bold leading-relaxed">
                    سفارش شما با شماره <span className="text-white font-mono font-black">{paymentResult.orderId}</span> ثبت گردید و در حال آماده‌سازی برای ارسال می‌باشد.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                    <X className="w-8 h-8" />
                  </div>
                  <h3 className="text-white text-lg font-black">خطا در پرداخت سفارش</h3>
                  <p className="text-zinc-400 text-xs font-bold leading-relaxed">
                    عملیات پرداخت ناموفق بود یا توسط کاربر لغو گردید. در صورت کسر وجه، مبلغ ظرف مدت ۷۲ ساعت آینده به حساب شما عودت داده خواهد شد.
                  </p>
                </div>
              )}
              <button
                onClick={() => setPaymentResult(null)}
                className="mt-6 w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                بستن پنجره
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
