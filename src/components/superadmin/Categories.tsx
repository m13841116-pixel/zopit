import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, CheckCircle, XCircle, RefreshCw, X, FolderTree, Search, Layers, Tag } from "lucide-react";

interface Category {
  id: number;
  name: string;
  isActive: boolean;
  sortOrder?: number;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: "موبایل", isActive: true, sortOrder: 1 },
  { id: 2, name: "لپ‌تاپ", isActive: true, sortOrder: 2 },
  { id: 3, name: "کالای دیجیتال", isActive: true, sortOrder: 3 },
  { id: 4, name: "خانه و آشپزخانه", isActive: true, sortOrder: 4 },
  { id: 5, name: "لوازم خانگی برقی", isActive: true, sortOrder: 5 },
  { id: 6, name: "آرایشی و بهداشتی", isActive: true, sortOrder: 6 },
  { id: 7, name: "مد و پوشاک", isActive: true, sortOrder: 7 },
  { id: 8, name: "طلا و نقره", isActive: true, sortOrder: 8 },
  { id: 9, name: "خودرو و موتورسیکلت", isActive: true, sortOrder: 9 },
  { id: 10, name: "سلامت و پزشکی", isActive: true, sortOrder: 10 },
  { id: 11, name: "ابزارآلات و تجهیزات", isActive: true, sortOrder: 11 },
  { id: 12, name: "کتاب و هنر", isActive: true, sortOrder: 12 },
  { id: 13, name: "ورزش و سفر", isActive: true, sortOrder: 13 },
  { id: 14, name: "اسباب بازی کودک و نوزاد", isActive: true, sortOrder: 14 },
  { id: 15, name: "محصولات بومی و محلی", isActive: true, sortOrder: 15 },
  { id: 16, name: "پت شاپ", isActive: true, sortOrder: 16 },
];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [sortOrder, setSortOrder] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/admin/categories", {
        credentials: "include",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data?.categories || []);
        if (list.length > 0) {
          setCategories(list);
          return;
        }
      }
      
      // Fallback to public endpoint
      const pubRes = await fetch("/api/public/categories");
      if (pubRes.ok) {
        const pubData = await pubRes.json();
        if (Array.isArray(pubData) && pubData.length > 0) {
          setCategories(pubData);
          return;
        }
      }

      const catRes = await fetch("/api/categories");
      if (catRes.ok) {
        const catData = await catRes.json();
        if (Array.isArray(catData) && catData.length > 0) {
          setCategories(catData);
          return;
        }
      }
      
      // Keep default categories if backend returns empty
      setCategories((prev) => (prev.length > 0 ? prev : DEFAULT_CATEGORIES));
    } catch (err) {
      console.error("Error loading categories:", err);
      setCategories((prev) => (prev.length > 0 ? prev : DEFAULT_CATEGORIES));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setCategoryName("");
    setIsActive(true);
    setSortOrder(categories.length + 1);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setIsActive(cat.isActive);
    setSortOrder(cat.sortOrder || 0);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setCategoryName("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setMessage({ text: "لطفاً نام دسته‌بندی را وارد کنید.", type: "error" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem("token");
      const url = editingCategory
        ? `/api/admin/categories/${editingCategory.id}`
        : "/api/admin/categories";
      const method = editingCategory ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: categoryName.trim(),
          isActive,
          sortOrder: Number(sortOrder) || 0,
        }),
      });

      const data = await res.json().catch(() => ({}));

      const newCategory: Category = {
        id: data.id || Date.now(),
        name: data.name || categoryName.trim(),
        isActive: data.isActive !== undefined ? data.isActive : isActive,
        sortOrder: data.sortOrder !== undefined ? data.sortOrder : (Number(sortOrder) || 0)
      };

      if (editingCategory) {
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategory.id ? { ...c, ...newCategory } : c))
        );
      } else {
        setCategories((prev) => {
          const exists = prev.some((c) => c.id === newCategory.id || c.name === newCategory.name);
          if (exists) return prev;
          return [...prev, newCategory];
        });
      }

      setMessage({
        text: editingCategory ? "دسته‌بندی با موفقیت ویرایش شد." : "دسته‌بندی جدید با موفقیت اضافه شد.",
        type: "success",
      });

      closeModal();
      fetchCategories();
    } catch (err: any) {
      setMessage({ text: err.message || "خطایی رخ داد.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (cat: Category) => {
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id ? { ...c, isActive: !c.isActive } : c))
    );
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !cat.isActive }),
      });
    } catch (err) {
      console.error("Error toggling status:", err);
    }
  };

  const handleDelete = async (id: number) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setMessage({ text: "دسته‌بندی حذف شد.", type: "success" });
    try {
      const token = localStorage.getItem("token");
      await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Error deleting category:", err);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 space-y-6 animate-fade-in text-slate-800" dir="rtl">
      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium flex justify-between items-center shadow-sm transition-all ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
              : "bg-rose-50 text-rose-800 border border-rose-200/80"
          }`}
        >
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white text-slate-800 border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-slate-50/50 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-slate-100 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 border border-slate-200">
              <FolderTree className="w-4 h-4 text-slate-500" />
              <span>مدیریت ساختار کاتالوگ</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">دسته‌بندی‌های اصلی محصولات</h2>
            <p className="text-slate-500 text-sm max-w-xl leading-relaxed">
              تعریف، ویرایش و مدیریت تمام دسته‌بندی‌های کالایی سیستم برای دسترسی آسان مشتریان و فروشندگان.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-2xl text-sm font-extrabold shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" /> افزودن دسته جدید
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Stats Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در دسته‌بندی‌ها..."
            className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 transition-all outline-none"
          />
        </div>

        <div className="flex items-center gap-4 text-sm font-semibold text-slate-600 self-end sm:self-center">
          <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl text-slate-700">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>کل: <strong className="text-slate-900 font-bold">{categories.length}</strong> دسته</span>
          </div>
          <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl text-emerald-700 border border-emerald-100">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>فعال: <strong className="text-emerald-900 font-bold">{categories.filter(c => c.isActive).length}</strong></span>
          </div>
        </div>
      </div>

      {/* Categories Grid / Table */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-slate-200/80 shadow-sm flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-7 h-7 animate-spin text-purple-600" />
          <span className="text-sm font-medium text-slate-500">در حال دریافت لیست دسته‌بندی‌ها...</span>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/80 shadow-sm space-y-4">
          <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto border border-purple-100">
            <Tag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">هیچ دسته‌بندی یافت نشد</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto">
            موردی مطابق با عبارت جستجوی شما پیدا نشد یا هنوز دسته‌بندی ایجاد نکرده‌اید.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={openAddModal}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition"
            >
              افزودن دسته‌بندی جدید
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-600 font-bold text-xs uppercase tracking-wider">
                  <th className="px-6 py-4">کد</th>
                  <th className="px-6 py-4">نام دسته‌بندی</th>
                  <th className="px-6 py-4">اولویّت ترتیب</th>
                  <th className="px-6 py-4">وضعیت</th>
                  <th className="px-6 py-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-purple-50/40 transition-colors group">
                    <td className="px-6 py-4 font-mono font-bold text-slate-400 text-xs">#{c.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 font-extrabold flex items-center justify-center border border-purple-100 group-hover:scale-105 transition-transform">
                          {c.name.charAt(0)}
                        </div>
                        <span className="font-bold text-slate-800 text-base">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-sm font-semibold">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg">
                        {c.sortOrder || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(c)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          c.isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 border border-amber-200/80 hover:bg-amber-100"
                        }`}
                      >
                        {c.isActive ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> فعال
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5 text-amber-600" /> غیرفعال
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-2 text-slate-600 hover:text-purple-700 hover:bg-purple-100/70 rounded-xl transition"
                          title="ویرایش"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden text-slate-800">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                  <Tag className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-lg text-slate-900">
                  {editingCategory ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی جدید"}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-200/50 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  نام دسته‌بندی
                </label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  placeholder="مثال: قطعات الکترونیک"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none text-sm transition-all font-medium"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  ترتیب نمایش (عدد کوچک‌تر اولویت بالاتر دارد)
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 outline-none text-sm transition-all font-mono font-bold"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-xs font-bold text-slate-700">
                  وضعیت انتشار دسته‌بندی
                </span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isActive ? "bg-purple-600" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isActive ? "translate-x-1" : "translate-x-6"
                    }`}
                  />
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition shadow-md shadow-purple-600/20 disabled:opacity-50"
                >
                  {saving ? "در حال ثبت..." : "ذخیره دسته‌بندی"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

