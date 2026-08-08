import React, { useState, useEffect } from "react";
import { 
  User as UserIcon, ShoppingBag, Clock, CheckCircle2, AlertCircle, 
  RefreshCw, LogOut, Settings, ListFilter, CreditCard, ChevronDown, 
  ChevronUp, MapPin, Phone, Mail, Calendar, Eye, FileText
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CustomerDashboardProps {
  user: any;
  onLogout: () => void;
  showNotification: (message: string, type: "success" | "error") => void;
  onUpdateUser: (updatedUser: any) => void;
}

export function CustomerDashboard({
  user,
  onLogout,
  showNotification,
  onUpdateUser,
}: CustomerDashboardProps) {
  const [activeTab, setActiveTab] = useState<"orders" | "profile">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    mobile: user?.mobile || "",
    email: user?.email || "",
  });

  // Fetch orders on mount
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/customer/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      } else {
        const errorData = await res.json();
        showNotification(errorData.error || "خطا در دریافت لیست سفارشات", "error");
      }
    } catch (err) {
      console.error("Error fetching customer orders:", err);
      showNotification("خطا در ارتباط با سرور", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/customer/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileForm),
      });

      const data = await res.json();
      if (res.ok) {
        showNotification("پروفایل شما با موفقیت بروزرسانی شد.", "success");
        onUpdateUser(data.user);
      } else {
        showNotification(data.error || "خطا در بروزرسانی پروفایل", "error");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      showNotification("خطا در ارتباط با سرور", "error");
    } finally {
      setUpdatingProfile(false);
    }
  };

  // Status Translation & Styling Helper
  const getStatusDetails = (status: string) => {
    switch (status) {
      case "NEW":
      case "REQUESTED":
        return { text: "در انتظار تایید", color: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800" };
      case "PENDING":
        return { text: "در انتظار پرداخت", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800" };
      case "SUPPLIER_APPROVED":
        return { text: "تایید شده غرفه‌دار", color: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800" };
      case "PREPARING":
      case "PROCESSING":
        return { text: "در حال آماده‌سازی", color: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800" };
      case "SHIPPED":
        return { text: "ارسال شده", color: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800" };
      case "COMPLETED":
      case "DELIVERED":
        return { text: "تکمیل شده", color: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" };
      case "CANCELLED":
        return { text: "لغو شده", color: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800" };
      case "REJECTED":
        return { text: "رد شده", color: "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900" };
      default:
        return { text: status, color: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800" };
    }
  };

  // Calculations for Stats Card
  const totalOrdersCount = orders.length;
  const paidOrdersSum = orders
    .filter(o => o.status !== "CANCELLED" && o.status !== "PENDING")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const activeOrdersCount = orders.filter(o => o.status !== "DELIVERED" && o.status !== "CANCELLED").length;

  return (
    <div className="w-full min-h-[calc(100vh-80px)] bg-background/30 p-4 md:p-8" dir="rtl">
      {/* Upper Welcome Section */}
      <div className="max-w-6xl mx-auto mb-8 bg-card rounded-2xl p-6 border border-subtle shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold text-xl">
            {user?.firstName?.[0] || user?.username?.[0] || "م"}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-primary">
              خوش آمدید، {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-xs text-muted font-semibold mt-1">
              حساب کاربری: {user?.username} | نقش: مشتری خریدار
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setActiveTab(activeTab === "orders" ? "profile" : "orders")}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-subtle bg-background hover:bg-surface text-secondary text-xs font-bold transition-all cursor-pointer"
          >
            <Settings className="w-4 h-4" />
            {activeTab === "orders" ? "ویرایش مشخصات" : "مشاهده سفارشات"}
          </button>
          <button
            onClick={onLogout}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200/50 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/50 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            خروج از حساب
          </button>
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-2xl p-6 border border-subtle shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/40">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-muted block mb-1">تعداد کل سفارشات</span>
            <span className="text-2xl font-black text-primary">{totalOrdersCount}</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-subtle shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/40">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-muted block mb-1">مجموع خریدها</span>
            <span className="text-2xl font-black text-primary">
              {paidOrdersSum.toLocaleString()} <span className="text-xs font-normal text-muted">تومان</span>
            </span>
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 border border-subtle shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-900/40">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-muted block mb-1">سفارشات فعال</span>
            <span className="text-2xl font-black text-primary">{activeOrdersCount}</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === "orders" ? (
            <motion.div
              key="orders-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-card rounded-2xl border border-subtle shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-subtle flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-lg font-black text-primary">سوابق سفارشات شما</h2>
                  <p className="text-xs text-muted font-bold mt-1">
                    لیست سفارشاتی که با شماره موبایل ثبت شده در سیستم ثبت شده‌اند.
                  </p>
                </div>
                <button 
                  onClick={fetchOrders}
                  className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-transparent border-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  بروزرسانی لیست
                </button>
              </div>

              {loading ? (
                <div className="p-16 flex flex-col items-center justify-center gap-3 text-muted">
                  <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="text-sm font-semibold">در حال دریافت سفارشات...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="p-16 flex flex-col items-center justify-center gap-4 text-muted text-center">
                  <ShoppingBag className="w-16 h-16 opacity-30 text-muted" />
                  <div>
                    <h3 className="font-bold text-primary">هنوز سفارشی ثبت نکرده‌اید</h3>
                    <p className="text-xs text-muted mt-1 max-w-sm">
                      محصولات مورد نیاز خود را در صفحه اکسپلور پیدا کرده و مستقیماً خرید خود را ثبت کنید.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse text-sm">
                    <thead>
                      <tr className="bg-surface border-b border-subtle text-muted font-bold text-xs">
                        <th className="p-4">شناسه سفارش</th>
                        <th className="p-4">تاریخ ثبت</th>
                        <th className="p-4">مبلغ کل</th>
                        <th className="p-4">آدرس گیرنده</th>
                        <th className="p-4">وضعیت سفارش</th>
                        <th className="p-4 text-center">جزئیات اقلام</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-subtle">
                      {orders.map((order) => {
                        const statusInfo = getStatusDetails(order.status);
                        const isExpanded = expandedOrderId === order.id;

                        return (
                          <React.Fragment key={order.id}>
                            <tr className="hover:bg-surface/40 transition-colors">
                              <td className="p-4 font-bold text-primary">
                                #{order.id}
                              </td>
                              <td className="p-4 font-semibold text-secondary">
                                {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                              </td>
                              <td className="p-4 font-black text-primary">
                                {order.totalAmount?.toLocaleString()} تومان
                              </td>
                              <td className="p-4 text-xs font-semibold text-muted max-w-xs truncate">
                                {order.shippingAddress || "-"}
                              </td>
                              <td className="p-4">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${statusInfo.color}`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                  {statusInfo.text}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all cursor-pointer border-none"
                                >
                                  {isExpanded ? (
                                    <>
                                      بستن <ChevronUp className="w-4 h-4" />
                                    </>
                                  ) : (
                                    <>
                                      مشاهده اقلام <ChevronDown className="w-4 h-4" />
                                    </>
                                  )}
                                </button>
                              </td>
                            </tr>
                            
                            {/* Expanded items row */}
                            <AnimatePresence>
                              {isExpanded && (
                                <tr>
                                  <td colSpan={6} className="bg-surface/30 p-6 border-b border-subtle">
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="overflow-hidden space-y-4"
                                    >
                                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-dashed border-subtle">
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2 text-xs font-bold text-muted">
                                            <MapPin className="w-4 h-4 text-blue-500" />
                                            <span>آدرس تحویل: {order.shippingAddress || "-"}</span>
                                          </div>
                                          <div className="flex items-center gap-2 text-xs font-bold text-muted">
                                            <Phone className="w-4 h-4 text-emerald-500" />
                                            <span>تلفن گیرنده: {order.customerPhone || "-"}</span>
                                          </div>
                                        </div>
                                        <div className="bg-card px-4 py-2 rounded-xl border border-subtle text-xs font-bold text-secondary">
                                          شیوه تحویل: پنل پلتفرم (تحویل اکسپرس)
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {order.items?.map((item: any) => (
                                          <div 
                                            key={item.id} 
                                            className="bg-card p-4 rounded-xl border border-subtle flex gap-4 items-center"
                                          >
                                            {item.product?.imageUrl ? (
                                              <img
                                                src={item.product.imageUrl}
                                                alt={item.product.name}
                                                className="w-16 h-16 object-cover rounded-lg border border-subtle"
                                                referrerPolicy="no-referrer"
                                              />
                                            ) : (
                                              <div className="w-16 h-16 bg-surface rounded-lg flex items-center justify-center text-muted">
                                                <ShoppingBag className="w-6 h-6" />
                                              </div>
                                            )}
                                            <div className="flex-1 space-y-1 text-right">
                                              <h4 className="text-xs font-black text-primary line-clamp-1">
                                                {item.product?.name || "محصول حذف شده"}
                                              </h4>
                                              <div className="flex justify-between items-center text-xs font-bold text-muted">
                                                <span>تعداد: {item.quantity} عدد</span>
                                                <span className="text-primary font-extrabold">
                                                  {(item.price || 0).toLocaleString()} تومان
                                                </span>
                                              </div>
                                              {item.trackingCode && (
                                                <div className="mt-2 pt-2 border-t border-dashed border-subtle flex justify-between items-center text-[11px] font-bold">
                                                  <span className="text-muted">کد رهگیری پستی:</span>
                                                  <span className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30 font-mono">
                                                    {item.trackingCode}
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </motion.div>
                                  </td>
                                </tr>
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="profile-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="bg-card rounded-2xl border border-subtle shadow-sm max-w-2xl mx-auto overflow-hidden text-right"
            >
              <div className="p-6 border-b border-subtle">
                <h2 className="text-lg font-black text-primary">ویرایش حساب کاربری</h2>
                <p className="text-xs text-muted font-bold mt-1">
                  مشخصات خود را در سیستم بروزرسانی کنید. شماره موبایل برای همگام‌سازی سفارشات استفاده می‌شود.
                </p>
              </div>

              <form onSubmit={handleProfileSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-secondary">نام</label>
                    <input
                      type="text"
                      required
                      value={profileForm.firstName}
                      onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                      className="w-full px-4 py-3 bg-background hover:bg-surface/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-primary font-bold border-subtle"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-secondary">نام خانوادگی</label>
                    <input
                      type="text"
                      required
                      value={profileForm.lastName}
                      onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                      className="w-full px-4 py-3 bg-background hover:bg-surface/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-primary font-bold border-subtle"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary">شماره موبایل</label>
                  <input
                    type="text"
                    required
                    value={profileForm.mobile}
                    onChange={(e) => setProfileForm({ ...profileForm, mobile: e.target.value })}
                    placeholder="مثال: 09123456789"
                    className="w-full px-4 py-3 bg-background hover:bg-surface/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-primary font-bold border-subtle text-left"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-secondary">آدرس ایمیل (اختیاری)</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    className="w-full px-4 py-3 bg-background hover:bg-surface/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-primary font-bold border-subtle text-left"
                    dir="ltr"
                  />
                </div>

                <div className="pt-4 border-t border-subtle flex justify-end">
                  <button
                    type="submit"
                    disabled={updatingProfile}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {updatingProfile ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        در حال ذخیره‌سازی...
                      </>
                    ) : (
                      "ذخیره تغییرات"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
