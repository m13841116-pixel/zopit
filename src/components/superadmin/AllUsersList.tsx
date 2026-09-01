import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Lock,
  Unlock,
  LogIn,
  Eye,
  X,
  CreditCard,
  FileText,
  Package,
  ShoppingBag,
  Building2,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
  User as UserIcon,
  Award,
  DollarSign,
  TrendingUp,
  Plus,
} from "lucide-react";

interface AllUsersListProps {
  initialRoleFilter?: string;
  showNotification?: (message: string, type: "success" | "error") => void;
  onImpersonateUser?: (user: any, token?: string) => void;
}

export default function AllUsersList({
  initialRoleFilter = "ALL",
  showNotification,
  onImpersonateUser,
}: AllUsersListProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>(initialRoleFilter);

  useEffect(() => {
    if (initialRoleFilter) {
      setRoleFilter(initialRoleFilter);
    }
  }, [initialRoleFilter]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [activeModalUser, setActiveModalUser] = useState<any | null>(null);
  const [modalTab, setModalTab] = useState<"info" | "financial" | "documents" | "products">("info");
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    username: "",
    password: "",
    role: "STORE_MANAGER",
    firstName: "",
    lastName: "",
    mobile: "",
    brandName: "",
    storeName: "",
    nationalCode: "",
  });
  const [submittingUser, setSubmittingUser] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.username || !newUserForm.password || !newUserForm.role) {
      if (showNotification) showNotification("نام کاربری، رمز عبور و نقش الزامی است", "error");
      return;
    }
    setSubmittingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(newUserForm),
      });
      if (res.ok) {
        const data = await res.json();
        if (showNotification) showNotification(data.message || "کاربر با موفقیت ایجاد شد", "success");
        setShowAddUserModal(false);
        setNewUserForm({
          username: "",
          password: "",
          role: "STORE_MANAGER",
          firstName: "",
          lastName: "",
          mobile: "",
          brandName: "",
          storeName: "",
          nationalCode: "",
        });
        fetchUsers();
      } else {
        const errData = await res.json().catch(() => ({}));
        if (showNotification) showNotification(errData.error || "خطا در ایجاد کاربر", "error");
      }
    } catch (err) {
      if (showNotification) showNotification("خطا در ایجاد کاربر", "error");
    } finally {
      setSubmittingUser(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/all-users", {
        credentials: "include",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } else {
        const errData = await res.json().catch(() => ({}));
        if (showNotification) showNotification(`خطا در دریافت کاربران: ${errData.error || res.status}`, "error");
        console.error("Backend error:", errData);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: any) => {
    setActioningId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/toggle-status`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (showNotification) {
          showNotification(data.message, "success");
        }
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, status: data.status } : u))
        );
      }
    } catch (err) {
      if (showNotification) showNotification("خطا در تغییر وضعیت کاربر", "error");
    } finally {
      setActioningId(null);
    }
  };

  const handleImpersonate = async (user: any) => {
    setActioningId(user.id);
    try {
      const res = await fetch(`/api/admin/impersonate/${user.id}`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        if (showNotification) {
          showNotification(`در حال انتقال به پیشخوان ${user.firstName || user.username}...`, "success");
        }
        if (onImpersonateUser) {
          onImpersonateUser(data.user, data.token);
        } else {
          window.location.reload();
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        if (showNotification) showNotification(errData.error || "خطا در شبیه‌سازی ورود", "error");
      }
    } catch (err) {
      if (showNotification) showNotification("خطا در شبیه‌سازی ورود", "error");
    } finally {
      setActioningId(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map((u) => u.id));
    }
  };

  const toggleSelectUser = (id: number) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkAction = async (statusToSet: "ACTIVE" | "BLOCKED") => {
    if (selectedUsers.length === 0) return;

    for (const id of selectedUsers) {
      try {
        await fetch(`/api/admin/users/${id}/toggle-status`, {
          method: "POST",
          credentials: "include",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
      } catch (err) {
        console.error(err);
      }
    }
    if (showNotification) {
      showNotification(`عملیات گروهی با موفقیت اعمال گردید`, "success");
    }
    setSelectedUsers([]);
    fetchUsers();
  };

  // Filtering
  const filteredUsers = users.filter((u) => {
    // Hide customer users from B2B ecosystem
    if (u.role === "CUSTOMER" || u.role === "CUSTOMERS") return false;

    // Role Filter
    if (roleFilter && roleFilter !== "ALL") {
      const uRole = (u.role || "").toUpperCase();
      const rFilter = roleFilter.toUpperCase();
      if (rFilter === "STORE" || rFilter === "STORES" || rFilter === "STORE_MANAGER") {
        if (uRole !== "STORE_MANAGER" && uRole !== "STORE") return false;
      } else if (rFilter === "SUPPLIER" || rFilter === "SUPPLIERS") {
        if (uRole !== "SUPPLIER" && uRole !== "SUPPLIERS") return false;
      } else if (rFilter === "AMBASSADOR" || rFilter === "REFERRER" || rFilter === "TAMINYAB") {
        if (uRole !== "AMBASSADOR" && uRole !== "REFERRER") return false;
      } else if (uRole !== rFilter) {
        return false;
      }
    }
    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
      const username = (u.username || "").toLowerCase();
      const mobile = (u.mobile || "").toLowerCase();
      const brand = (u.brandName || "").toLowerCase();
      const supplierCode = `sup-${1000 + u.id}`.toLowerCase();
      const idStr = String(u.id);
      return (
        fullName.includes(q) ||
        username.includes(q) ||
        mobile.includes(q) ||
        brand.includes(q) ||
        supplierCode.includes(q) ||
        idStr === q
      );
    }
    return true;
  });

  const getRoleBadge = (role: string) => {
    const r = (role || "").toUpperCase();
    switch (r) {
      case "SUPPLIER":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">تامین‌کننده</span>;
      case "STORE_MANAGER":
      case "STORE":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">مدیر فروشگاه</span>;
      case "AMBASSADOR":
      case "REFERRER":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">تأمین‌یاب</span>;
      case "SUPER_ADMIN":
      case "ADMIN":
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">مدیر ارشد</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-600 border border-slate-500/20">کاربر سامانه</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-subtle shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-primary flex items-center gap-3">
            <Users className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            مدیریت یکپارچه تمامی کاربران
          </h2>
          <p className="text-sm text-muted mt-1 font-medium">
            نمایش، بررسی جزئیات، فیلتر نقش‌ها و مدیریت دسترسی‌های سامانه
          </p>
        </div>

        {/* Role Filter Tabs & Add Button */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowAddUserModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" /> افزودن کاربر جدید
          </button>
          <div className="flex flex-wrap items-center gap-2 bg-surface p-1.5 rounded-2xl border border-subtle">
            {[
              { id: "ALL", label: "همه کاربران" },
              { id: "SUPPLIER", label: "تامین‌کنندگان" },
              { id: "STORE_MANAGER", label: "فروشگاه‌ها" },
              { id: "AMBASSADOR", label: "تأمین‌یاب‌ها" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRoleFilter(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  roleFilter === tab.id
                    ? "bg-primary-default text-white shadow-md shadow-primary-default/20"
                    : "text-muted hover:text-primary hover:bg-card"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search & Bulk Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-2xl border border-subtle">
        {/* Search Bar */}
        <div className="relative w-full sm:w-96">
          <input
            type="text"
            placeholder="جستجو بر اساس نام، نام کاربری، شماره تماس..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 bg-surface border border-subtle rounded-xl text-sm font-medium text-primary focus:outline-none focus:border-primary-default transition-all"
          />
          <Search className="w-5 h-5 text-muted absolute right-3 top-3" />
        </div>

        {/* Bulk Action Controls */}
        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-2 animate-fade-in w-full sm:w-auto justify-end">
            <span className="text-xs font-bold text-muted ml-2">
              {selectedUsers.length} کاربر انتخاب شده
            </span>
            <button
              onClick={() => handleBulkAction("BLOCKED")}
              className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-rose-500/20 transition-all"
            >
              <Lock className="w-4 h-4" /> مسدودسازی گروهی
            </button>
            <button
              onClick={() => handleBulkAction("ACTIVE")}
              className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-emerald-500/20 transition-all"
            >
              <Unlock className="w-4 h-4" /> فعال‌سازی گروهی
            </button>
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="bg-card rounded-3xl border border-subtle shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center items-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-muted font-bold">
            هیچ کاربری با مشخصات وارد شده یافت نشد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm min-w-[800px]">
              <thead className="bg-surface text-secondary font-bold border-b border-subtle">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedUsers.length > 0 &&
                        selectedUsers.length === filteredUsers.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-subtle text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                  </th>
                  <th className="p-4">نام کاربری</th>
                  <th className="p-4">نام و نام خانوادگی</th>
                  <th className="p-4">نقش</th>

                  {/* Dynamic Columns for TaminYabs */}
                  {roleFilter === "AMBASSADOR" || roleFilter === "REFERRER" ? (
                    <>
                      <th className="p-4">شماره تماس</th>
                      <th className="p-4 text-center">تعداد جذب‌های موفق</th>
                      <th className="p-4 text-center">مجموع پاداش دریافتی</th>
                    </>
                  ) : (
                    <>
                      <th className="p-4">نام تجاری / برند</th>
                      <th className="p-4">شماره تماس</th>
                      <th className="p-4">آدرس</th>
                    </>
                  )}

                  <th className="p-4 text-center w-36">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-subtle">
                {filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className={`even:bg-slate-50 dark:even:bg-slate-800/20 hover:bg-slate-100 dark:hover:bg-slate-700/40 transition-colors ${
                      u.status === "BLOCKED" ? "bg-rose-500/5 opacity-80" : ""
                    }`}
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(u.id)}
                        onChange={() => toggleSelectUser(u.id)}
                        className="rounded border-subtle text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                      />
                    </td>

                    {/* Username */}
                    <td className="p-4">
                      <div className="font-mono font-bold text-primary">
                        {u.username}
                      </div>
                      {u.role === "SUPPLIER" && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold text-xs border border-indigo-500/20">
                            کد تامین: {(1000 + u.id).toLocaleString('fa-IR')}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Full Name */}
                    <td className="p-4 font-bold text-primary">
                      {u.firstName || u.lastName
                        ? `${u.firstName || ""} ${u.lastName || ""}`
                        : "نام ثبت نشده"}
                    </td>

                    {/* Role Badge */}
                    <td className="p-4">{getRoleBadge(u.role)}</td>

                    {/* Dynamic Columns */}
                    {roleFilter === "AMBASSADOR" || roleFilter === "REFERRER" ? (
                      <>
                        <td className="p-4 font-mono text-secondary" dir="ltr">
                          {u.mobile || "---"}
                        </td>
                        <td className="p-4 text-center font-bold text-emerald-600">
                          {u.successfulReferrals || 0} نفر
                        </td>
                        <td className="p-4 text-center font-bold font-mono text-primary">
                          {(u.totalCommission || 0).toLocaleString()} تومان
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-4 font-medium text-secondary">
                          {u.brandName || u.storeName || "---"}
                        </td>
                        <td className="p-4 font-mono text-secondary" dir="ltr">
                          {u.mobile || "---"}
                        </td>
                        <td className="p-4 text-xs text-muted max-w-xs truncate">
                          {u.address || "---"}
                        </td>
                      </>
                    )}

                    {/* Actions Column (3 Icons) */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* 1. Login as User / Impersonate */}
                        <button
                          onClick={() => handleImpersonate(u)}
                          disabled={actioningId === u.id}
                          className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 rounded-xl transition-all"
                          title="ورود به حساب کاربر"
                        >
                          <LogIn className="w-4 h-4" />
                        </button>

                        {/* 2. Lock / Block User */}
                        <button
                          onClick={() => handleToggleStatus(u)}
                          disabled={actioningId === u.id}
                          className={`p-2 rounded-xl transition-all ${
                            u.status === "BLOCKED"
                              ? "bg-rose-500/20 text-rose-600 hover:bg-rose-500/30"
                              : "bg-surface hover:bg-subtle text-muted hover:text-primary"
                          }`}
                          title={
                            u.status === "BLOCKED"
                              ? "رفع مسدودی کاربر"
                              : "مسدودسازی کاربر"
                          }
                        >
                          {u.status === "BLOCKED" ? (
                            <Lock className="w-4 h-4 text-rose-600" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </button>

                        {/* 3. Details Modal Icon */}
                        <button
                          onClick={() => {
                            setActiveModalUser(u);
                            setModalTab("info");
                          }}
                          className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded-xl transition-all"
                          title="مشاهده جزئیات کامل کاربر"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comprehensive Details Modal */}
      {activeModalUser && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-3xl rounded-3xl border border-subtle shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-subtle flex items-center justify-between bg-surface">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-default text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {activeModalUser.firstName
                    ? activeModalUser.firstName[0]
                    : "U"}
                </div>
                <div>
                  <h3 className="text-lg font-black text-primary flex items-center gap-2">
                    {activeModalUser.firstName || activeModalUser.lastName
                      ? `${activeModalUser.firstName || ""} ${
                          activeModalUser.lastName || ""
                        }`
                      : activeModalUser.username}
                    {getRoleBadge(activeModalUser.role)}
                  </h3>
                  <p className="text-xs font-mono text-muted mt-0.5">
                    نام کاربری: {activeModalUser.username}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveModalUser(null)}
                className="p-2 text-muted hover:text-primary rounded-xl hover:bg-card"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-subtle bg-card px-6">
              {[
                { id: "info", label: "اطلاعات هویت و تماس", icon: UserIcon },
                { id: "financial", label: "اطلاعات بانکی", icon: CreditCard },
                { id: "documents", label: "تصاویر و مدارک", icon: FileText },
                { id: "products", label: "لیست محصولات / عملکرد", icon: Package },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setModalTab(tab.id as any)}
                  className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-colors ${
                    modalTab === tab.id
                      ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                      : "border-transparent text-muted hover:text-primary"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
              {/* Tab 1: Identity & Contact Info */}
              {modalTab === "info" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Zopit Supplier Special Postal Identity Box */}
                  {activeModalUser.role === "SUPPLIER" && (
                    <div className="p-5 bg-card border border-emerald-500/40 rounded-2xl space-y-2.5 md:col-span-2 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-emerald-500" /> شناسه و نام پستی ثبت‌شده در پلتفرم زوپیت:
                        </span>
                        <span className="px-3 py-1 bg-emerald-600 text-white font-mono text-[11px] font-black rounded-full shadow-xs">
                          فرستنده مجاز زوپیت
                        </span>
                      </div>
                      <p className="font-black text-base text-text-primary font-mono">
                        زوپیت تامین‌کننده #{activeModalUser.id} {activeModalUser.brandName ? `(${activeModalUser.brandName})` : ""}
                      </p>
                      <p className="text-xs text-text-secondary leading-relaxed bg-surface p-3 rounded-xl border border-subtle">
                        آدرس کامل انبار فرستنده جهت درج روی مرسوله پستی: {activeModalUser.province || "---"}، {activeModalUser.city || "---"}، {activeModalUser.address || "آدرس ثبت نشده"} (کد پستی: {activeModalUser.postalCode || "---"})
                      </p>
                    </div>
                  )}

                  <div className="p-4 bg-surface rounded-2xl border border-subtle space-y-2">
                    <p className="text-xs text-muted font-bold">نام و نام خانوادگی</p>
                    <p className="font-bold text-primary">
                      {activeModalUser.firstName} {activeModalUser.lastName}
                    </p>
                  </div>
                  <div className="p-4 bg-surface rounded-2xl border border-subtle space-y-2">
                    <p className="text-xs text-muted font-bold">شماره تماس همراه</p>
                    <p className="font-bold text-primary font-mono" dir="ltr">
                      {activeModalUser.mobile || "ثبت نشده"}
                    </p>
                  </div>
                  <div className="p-4 bg-surface rounded-2xl border border-subtle space-y-2">
                    <p className="text-xs text-muted font-bold">نام تجاری / برند / فروشگاه</p>
                    <p className="font-bold text-primary">
                      {activeModalUser.brandName || activeModalUser.storeName || "ثبت نشده"}
                    </p>
                  </div>
                  <div className="p-4 bg-surface rounded-2xl border border-subtle space-y-2">
                    <p className="text-xs text-muted font-bold">استان و شهر</p>
                    <p className="font-bold text-primary">
                      {activeModalUser.province || "---"} - {activeModalUser.city || "---"}
                    </p>
                  </div>
                  <div className="p-4 bg-surface rounded-2xl border border-subtle space-y-2 md:col-span-2">
                    <p className="text-xs text-muted font-bold">آدرس کامل دقیق</p>
                    <p className="font-bold text-primary">
                      {activeModalUser.address || "آدرس ثبت نشده است"}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Financial & IBAN */}
              {modalTab === "financial" && (
                <div className="space-y-4">
                  <div className="p-5 bg-surface rounded-2xl border border-subtle space-y-4">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-emerald-600" />
                      <h4 className="font-bold text-primary">
                        مشخصات حساب و شماره شبا
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-xs text-muted font-bold">نام بانک</p>
                        <p className="font-bold text-primary">
                          {activeModalUser.bankName || "بانک ملی ایران"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted font-bold">نام دارنده حساب</p>
                        <p className="font-bold text-primary">
                          {activeModalUser.accountHolderName ||
                            `${activeModalUser.firstName || ""} ${activeModalUser.lastName || ""}`}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs text-muted font-bold">شماره شبا (IBAN)</p>
                        <p className="font-bold font-mono text-emerald-600 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-center tracking-wider" dir="ltr">
                          {activeModalUser.shaba || "IR000000000000000000000000"}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs text-muted font-bold">شماره کارت بانکی</p>
                        <p className="font-bold font-mono text-primary bg-card p-3 rounded-xl border border-subtle text-center tracking-widest" dir="ltr">
                          {activeModalUser.cardNumber || "---- ---- ---- ----"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Documents */}
              {modalTab === "documents" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-surface rounded-2xl border border-subtle space-y-3 text-center">
                      <p className="font-bold text-xs text-muted">عکس کارت ملی</p>
                      <div className="w-full h-40 bg-card rounded-xl border border-subtle flex items-center justify-center text-muted font-bold">
                        [تصویر احراز هویت تایید شده]
                      </div>
                    </div>
                    <div className="p-4 bg-surface rounded-2xl border border-subtle space-y-3 text-center">
                      <p className="font-bold text-xs text-muted">پروانه کسب / جواز نماد</p>
                      <div className="w-full h-40 bg-card rounded-xl border border-subtle flex items-center justify-center text-muted font-bold">
                        [تصویر مجوز کسب‌وکار]
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Products / Performance */}
              {modalTab === "products" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 bg-surface rounded-2xl border border-subtle text-center">
                      <p className="text-xs text-muted font-bold">تعداد کل سفارشات</p>
                      <p className="text-xl font-black text-primary font-mono mt-1">
                        {activeModalUser.ordersCount || 0}
                      </p>
                    </div>
                    <div className="p-4 bg-surface rounded-2xl border border-subtle text-center">
                      <p className="text-xs text-muted font-bold">مجموع فروش/ارزش</p>
                      <p className="text-xl font-black text-emerald-600 font-mono mt-1">
                        {(activeModalUser.totalSales || 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 bg-surface rounded-2xl border border-subtle text-center">
                      <p className="text-xs text-muted font-bold">محصولات فعال</p>
                      <p className="text-xl font-black text-blue-600 font-mono mt-1">
                        {activeModalUser.productsCount || 0}
                      </p>
                    </div>
                  </div>

                  {activeModalUser.products && activeModalUser.products.length > 0 ? (
                    <div className="border border-subtle rounded-2xl overflow-hidden">
                      <table className="w-full text-right text-xs min-w-[800px]">
                        <thead className="bg-surface font-bold text-muted border-b border-subtle">
                          <tr>
                            <th className="p-3">عنوان محصول</th>
                            <th className="p-3">قیمت (تومان)</th>
                            <th className="p-3">موجودی</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-subtle">
                          {activeModalUser.products.map((p: any) => (
                            <tr key={p.id} className="hover:bg-surface/50">
                              <td className="p-3 font-bold text-primary">{p.title || p.name}</td>
                              <td className="p-3 font-mono font-bold text-emerald-600">
                                {(p.price || p.finalPrice || 0).toLocaleString()}
                              </td>
                              <td className="p-3 font-mono">{p.stock || p.inventory || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-muted font-bold py-6">
                      هیچ محصولی ثبت نشده است.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-subtle bg-surface flex justify-end">
              <button
                onClick={() => setActiveModalUser(null)}
                className="px-6 py-2.5 bg-primary-default text-white rounded-xl font-bold text-xs"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-xl rounded-3xl border border-subtle shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-subtle flex items-center justify-between bg-surface">
              <h3 className="text-lg font-black text-primary flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" /> افزودن کاربر جدید به سامانه
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-2 text-muted hover:text-primary rounded-xl hover:bg-card"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">نام کاربری / شماره موبایل ورود *</label>
                  <input
                    type="text"
                    required
                    value={newUserForm.username}
                    onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value })}
                    className="w-full px-4 py-2 bg-surface border border-subtle rounded-xl text-primary text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="مثلا: user123"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">رمز عبور *</label>
                  <input
                    type="password"
                    required
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                    className="w-full px-4 py-2 bg-surface border border-subtle rounded-xl text-primary text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="حداقل ۶ کاراکتر"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">نقش کاربر *</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="w-full px-4 py-2 bg-surface border border-subtle rounded-xl text-primary text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="STORE_MANAGER">مدیر فروشگاه</option>
                    <option value="SUPPLIER">تامین‌کننده</option>
                    <option value="AMBASSADOR">تأمین‌یاب</option>
                    <option value="SUPER_ADMIN">مدیر ارشد</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">شماره تماس همراه</label>
                  <input
                    type="text"
                    value={newUserForm.mobile}
                    onChange={(e) => setNewUserForm({ ...newUserForm, mobile: e.target.value })}
                    className="w-full px-4 py-2 bg-surface border border-subtle rounded-xl text-primary text-sm focus:outline-none focus:border-emerald-500"
                    placeholder="09120000000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">نام</label>
                  <input
                    type="text"
                    value={newUserForm.firstName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, firstName: e.target.value })}
                    className="w-full px-4 py-2 bg-surface border border-subtle rounded-xl text-primary text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">نام خانوادگی</label>
                  <input
                    type="text"
                    value={newUserForm.lastName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, lastName: e.target.value })}
                    className="w-full px-4 py-2 bg-surface border border-subtle rounded-xl text-primary text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">نام تجاری / برند</label>
                  <input
                    type="text"
                    value={newUserForm.brandName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, brandName: e.target.value })}
                    className="w-full px-4 py-2 bg-surface border border-subtle rounded-xl text-primary text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-muted mb-1">نام فروشگاه</label>
                  <input
                    type="text"
                    value={newUserForm.storeName}
                    onChange={(e) => setNewUserForm({ ...newUserForm, storeName: e.target.value })}
                    className="w-full px-4 py-2 bg-surface border border-subtle rounded-xl text-primary text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-subtle flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-5 py-2.5 bg-surface text-secondary hover:bg-subtle rounded-xl font-bold text-xs"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2"
                >
                  {submittingUser ? "در حال ثبت..." : "ثبت و ایجاد کاربر"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
