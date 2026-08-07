import React, { useState, useEffect } from "react";
import { Users, Search, RefreshCw, Phone, MapPin, CreditCard, ShoppingBag, ArrowLeft } from "lucide-react";
import { toast } from "../GlobalToast";

interface CustomerOrder {
  id: number;
  amount: number;
  status: string;
  createdAt: string;
}

interface Customer {
  name: string;
  phone: string;
  address: string;
  cardNumber: string;
  ordersCount: number;
  totalSpent: number;
  orders: CustomerOrder[];
}

export const StoreCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers: any = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch("/api/store-manager/customers", {
        headers,
      });
      if (!response.ok) {
        throw new Error("خطا در دریافت اطلاعات مشتریان");
      }
      const data = await response.json();
      setCustomers(data);
    } catch (err: any) {
      toast(err.message || "دریافت اطلاعات مشتریان با خطا مواجه شد", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      customer.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.cardNumber.includes(searchTerm)
  );

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "NEW":
        return { label: "جدید", className: "bg-blue-500/10 text-blue-400 border border-blue-500/20" };
      case "APPROVED":
        return { label: "تایید شده", className: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" };
      case "SHIPPED":
        return { label: "ارسال شده", className: "bg-amber-500/10 text-amber-400 border border-amber-500/20" };
      case "DELIVERED":
        return { label: "تحویل شده", className: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20" };
      case "CANCELLED":
        return { label: "لغو شده", className: "bg-rose-500/10 text-rose-400 border border-rose-500/20" };
      default:
        return { label: status, className: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20" };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="w-8 h-8 text-success animate-spin" />
      </div>
    );
  }

  if (selectedCustomer) {
    return (
      <div className="space-y-6 animate-fade-in text-right" dir="rtl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-default" />
            <span>جزئیات مشتری: {selectedCustomer.name}</span>
          </h2>
          <button
            onClick={() => setSelectedCustomer(null)}
            className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover text-text-primary rounded-xl text-xs font-bold transition-all border border-border-default cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>بازگشت به لیست</span>
          </button>
        </div>

        {/* Customer Profile Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 bg-card border border-border-default rounded-3xl p-6 space-y-4 shadow-sm">
            <div className="flex flex-col items-center text-center pb-4 border-b border-border-subtle">
              <div className="w-16 h-16 rounded-full bg-primary-default/10 text-primary-default flex items-center justify-center text-2xl font-black mb-3">
                {selectedCustomer.name.charAt(0)}
              </div>
              <h3 className="font-extrabold text-text-primary text-lg">{selectedCustomer.name}</h3>
              <p className="text-xs text-text-muted mt-1">عضو سیستم خریداران مستقیم</p>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-text-muted shrink-0" />
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-text-muted">شماره تماس</span>
                  <span className="font-bold text-text-primary font-mono">{selectedCustomer.phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-text-muted shrink-0" />
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-text-muted">شماره کارت عودت وجه</span>
                  <span className="font-bold text-text-primary font-mono">
                    {selectedCustomer.cardNumber && selectedCustomer.cardNumber !== "ثبت نشده"
                      ? selectedCustomer.cardNumber.replace(/(\d{4})/g, "$1 ").trim()
                      : "ثبت نشده"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-text-muted shrink-0 mt-1" />
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-text-muted">نشانی پستی</span>
                  <span className="font-bold text-text-primary leading-relaxed text-xs">
                    {selectedCustomer.address}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Financials & Orders */}
          <div className="md:col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-card border border-border-default rounded-2xl p-5 text-right flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted font-bold">تعداد کل سفارشات</p>
                  <p className="text-2xl font-black text-text-primary mt-1">{selectedCustomer.ordersCount} عدد</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-card border border-border-default rounded-2xl p-5 text-right flex items-center justify-between">
                <div>
                  <p className="text-xs text-text-muted font-bold">مجموع خرید مستقیم</p>
                  <p className="text-xl font-black text-emerald-400 mt-1">
                    {selectedCustomer.totalSpent.toLocaleString()} تومان
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border-default rounded-3xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-border-subtle bg-surface/50">
                <h4 className="font-extrabold text-text-primary text-sm">تاریخچه سفارشات مستقیم این مشتری</h4>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle text-text-muted text-xs">
                      <th className="px-6 py-4 font-bold">شناسه سفارش</th>
                      <th className="px-6 py-4 font-bold">مبلغ سفارش</th>
                      <th className="px-6 py-4 font-bold">تاریخ ثبت</th>
                      <th className="px-6 py-4 font-bold">وضعیت سفارش</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {selectedCustomer.orders.map((o) => (
                      <tr key={o.id} className="text-xs hover:bg-surface/30 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-text-primary">#{o.id}</td>
                        <td className="px-6 py-4 font-bold text-emerald-400">{o.amount.toLocaleString()} تومان</td>
                        <td className="px-6 py-4 text-text-muted">
                          {new Date(o.createdAt).toLocaleDateString("fa-IR")}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black ${getStatusLabel(o.status).className}`}>
                            {getStatusLabel(o.status).label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-right" dir="rtl">
      {/* Search and stats bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card border border-border-default rounded-2xl p-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="جستجوی نام، تلفن، آدرس یا کارت..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-subtle rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-success focus:border-success text-right"
          />
          <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
        </div>

        <button
          onClick={fetchCustomers}
          className="flex items-center gap-2 px-4 py-2 bg-success/10 hover:bg-success/20 text-success rounded-xl text-xs font-bold transition-all border border-success/20 cursor-pointer w-full sm:w-auto justify-center"
        >
          <RefreshCw className="w-4 h-4" />
          <span>بروزرسانی لیست</span>
        </button>
      </div>

      {/* Customers Grid/List */}
      <div className="bg-card border border-border-default rounded-3xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-border-subtle bg-surface/50">
          <h3 className="font-extrabold text-text-primary text-sm">لیست مشتریان مستقیم</h3>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="py-12 text-center text-text-muted">
            <Users className="w-12 h-12 mx-auto text-text-muted opacity-30 mb-3" />
            <p className="text-sm">هیچ مشتری با مشخصات وارد شده یافت نشد.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="border-b border-border-subtle text-text-muted text-xs">
                  <th className="px-6 py-4 font-bold">نام مشتری</th>
                  <th className="px-6 py-4 font-bold">تلفن همراه</th>
                  <th className="px-6 py-4 font-bold text-center">تعداد سفارشات</th>
                  <th className="px-6 py-4 font-bold">شماره کارت بانکی</th>
                  <th className="px-6 py-4 font-bold">مجموع خرید مستقیم</th>
                  <th className="px-6 py-4 font-bold text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.phone} className="text-xs hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-text-primary">{customer.name}</td>
                    <td className="px-6 py-4 font-mono font-bold text-text-secondary">{customer.phone}</td>
                    <td className="px-6 py-4 text-center font-bold text-text-secondary">{customer.ordersCount} عدد</td>
                    <td className="px-6 py-4 font-mono text-text-muted">
                      {customer.cardNumber && customer.cardNumber !== "ثبت نشده"
                        ? customer.cardNumber.replace(/(\d{4})/g, "$1 ").trim()
                        : "ثبت نشده"}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-400">{customer.totalSpent.toLocaleString()} تومان</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setSelectedCustomer(customer)}
                        className="px-3 py-1.5 bg-primary-default/10 hover:bg-primary-default text-primary-default hover:text-white rounded-lg font-bold transition-all cursor-pointer"
                      >
                        مشاهده جزئیات
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
  );
};
