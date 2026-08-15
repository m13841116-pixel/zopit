import React, { useState, useEffect } from "react";
import { toast } from "../GlobalToast";
import { Ticket, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";

export default function SuperAdminDiscountCodes() {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [type, setType] = useState("PERCENTAGE");
  const [value, setValue] = useState("100");
  const [maxUses, setMaxUses] = useState("");

  const fetchDiscounts = async () => {
    try {
      const res = await fetch("/api/admin/discounts", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      setDiscounts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDiscounts(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/discounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          code,
          discountType: type,
          discountValue: parseFloat(value),
          maxUses: maxUses ? parseInt(maxUses) : null
        })
      });
      if (res.ok) {
        toast("کد تخفیف با موفقیت ایجاد شد.", "success");
        setCode("");
        fetchDiscounts();
      } else {
        const d = await res.json();
        toast(d.error || "خطا در ایجاد", "error");
      }
    } catch (err) {
      toast("خطا", "error");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        toast("حذف شد", "success");
        fetchDiscounts();
      }
    } catch (err) {}
  };

  const toggleStatus = async (id: number, isActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/discounts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ isActive: !isActive })
      });
      if (res.ok) {
        toast("وضعیت تغییر کرد", "success");
        fetchDiscounts();
      }
    } catch (err) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <Ticket className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">کدهای تخفیف (کوپن)</h2>
          <p className="text-xs text-slate-400">مدیریت کوپن‌های تخفیف جهت ارائه اکانت پرو رایگان یا ارزان‌تر</p>
        </div>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
        <h3 className="font-bold text-emerald-400 mb-4">ایجاد کد تخفیف جدید</h3>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="block text-xs mb-1">کد تخفیف (مثال: FREE-100)</label>
            <input required value={code} onChange={e=>setCode(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-left dir-ltr text-white" />
          </div>
          <div>
            <label className="block text-xs mb-1">نوع تخفیف</label>
            <select value={type} onChange={e=>setType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white">
              <option value="PERCENTAGE">درصد (%)</option>
              <option value="FIXED">مبلغ ثابت (تومان)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs mb-1">مقدار تخفیف</label>
            <input required type="number" value={value} onChange={e=>setValue(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-center text-white" />
          </div>
          <div>
            <label className="block text-xs mb-1">تعداد مجاز (خالی=نامحدود)</label>
            <input type="number" value={maxUses} onChange={e=>setMaxUses(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-center text-white" />
          </div>
          <button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold py-2 px-4 rounded-lg flex justify-center items-center gap-2">
            <Plus className="w-4 h-4" /> افزودن
          </button>
        </form>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
        <table className="w-full text-sm text-right">
          <thead className="bg-slate-900/50 text-slate-400">
            <tr>
              <th className="px-4 py-3">کد تخفیف</th>
              <th className="px-4 py-3">نوع</th>
              <th className="px-4 py-3">مقدار</th>
              <th className="px-4 py-3">استفاده شده</th>
              <th className="px-4 py-3">وضعیت</th>
              <th className="px-4 py-3 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {discounts.map(d => (
              <tr key={d.id} className="hover:bg-slate-750">
                <td className="px-4 py-3 font-mono font-bold text-emerald-400 text-left" dir="ltr">{d.code}</td>
                <td className="px-4 py-3">{d.discountType === 'PERCENTAGE' ? 'درصد' : 'مبلغ ثابت'}</td>
                <td className="px-4 py-3">{d.discountValue}</td>
                <td className="px-4 py-3">{d.usedCount} / {d.maxUses || 'نامحدود'}</td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleStatus(d.id, d.isActive)} className={`flex items-center gap-1 ${d.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {d.isActive ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {d.isActive ? 'فعال' : 'غیرفعال'}
                  </button>
                </td>
                <td className="px-4 py-3 flex justify-center gap-2">
                  <button onClick={() => handleDelete(d.id)} className="text-red-400 hover:text-red-300 p-1 bg-red-400/10 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
            {discounts.length === 0 && !loading && (
              <tr><td colSpan={6} className="text-center py-6 text-slate-400">هیچ کدی ثبت نشده است.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
