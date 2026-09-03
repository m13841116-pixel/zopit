import React, { useState, useEffect } from "react";
import { toast } from "../GlobalToast";
import { Loader2, TrendingUp, DollarSign, ShoppingBag, Package, Store, Factory } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function PerformanceAnalytics() {
  const [data, setData] = useState<{ suppliers: any[], stores: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'suppliers' | 'stores'>('suppliers');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/analytics/performance', {
        headers: { 'Authorization': 'Bearer ' + token }
      });
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        toast(json.error || 'خطا در دریافت گزارش', 'error');
      }
    } catch (e) {
      toast('خطا در ارتباط با سرور', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-default" />
      </div>
    );
  }

  if (!data) return null;

  const currentData = activeTab === 'suppliers' ? data.suppliers : data.stores;
  
  // Sort by profit descending
  const sortedData = [...currentData].sort((a, b) => b.profit - a.profit);
  const top10 = sortedData.slice(0, 10);
  
  // Format for charts
  const volumeKey = activeTab === 'suppliers' ? 'salesVolume' : 'purchaseVolume';
  const nameLabel = activeTab === 'suppliers' ? 'تامین‌کننده' : 'فروشگاه';
  
  const chartData = top10.map(item => ({
    name: item.name || 'بدون نام',
    profit: item.profit,
    volume: item[volumeKey],
    orders: item.orders,
    items: item.itemsSold
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">گزارش عملکرد و ارزیابی</h2>
          <p className="text-text-secondary mt-1">مشاهده نمودارها و آمار دقیق عملکرد فروشگاه‌ها و تامین‌کنندگان</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-border-subtle">
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'suppliers' ? 'border-primary-default text-primary-default' : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Factory className="w-4 h-4" /> تامین‌کنندگان
        </button>
        <button
          onClick={() => setActiveTab('stores')}
          className={`pb-4 px-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
            activeTab === 'stores' ? 'border-primary-default text-primary-default' : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          <Store className="w-4 h-4" /> فروشگاه‌ها
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border-subtle rounded-2xl p-6">
          <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            سودآوری زوپیت (۱۰ نفر برتر)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tickFormatter={(v) => (v/1000000).toFixed(1) + 'M'} />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11}} />
                <Tooltip formatter={(value: number) => value.toLocaleString() + ' تومان'} />
                <Bar dataKey="profit" name="سود (تومان)" fill="#00C49F" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border-subtle rounded-2xl p-6">
          <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-500" />
            تعداد سفارشات (۱۰ نفر برتر)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="orders"
                  nameKey="name"
                  label={({name, percent}) => percent > 0.05 ? name : ''}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border-subtle rounded-2xl p-6">
        <h3 className="text-lg font-bold text-text-primary mb-6 flex items-center gap-2">
          <Package className="w-5 h-5 text-indigo-500" />
          جدول عملکرد جامع {nameLabel}ها
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-surface text-text-secondary">
              <tr>
                <th className="px-4 py-3 rounded-r-lg">ردیف</th>
                <th className="px-4 py-3">نام {nameLabel}</th>
                <th className="px-4 py-3">تعداد سفارشات</th>
                <th className="px-4 py-3">کالای فروش‌رفته</th>
                <th className="px-4 py-3">حجم گردش مالی</th>
                <th className="px-4 py-3 rounded-l-lg">سود خالص برای زوپیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {sortedData.map((item, index) => (
                <tr key={item.id} className="hover:bg-surface/50 transition-colors">
                  <td className="px-4 py-4 text-text-muted">{index + 1}</td>
                  <td className="px-4 py-4 font-medium text-text-primary">{item.name || 'کاربر #' + item.id}</td>
                  <td className="px-4 py-4">{item.orders}</td>
                  <td className="px-4 py-4">{item.itemsSold}</td>
                  <td className="px-4 py-4">{(item[volumeKey] || 0).toLocaleString()} تومان</td>
                  <td className="px-4 py-4 font-bold text-emerald-600">{(item.profit || 0).toLocaleString()} تومان</td>
                </tr>
              ))}
              {sortedData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-text-muted">
                    اطلاعاتی برای نمایش وجود ندارد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
