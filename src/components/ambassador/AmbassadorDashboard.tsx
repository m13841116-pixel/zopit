import React, { useState, useEffect } from "react";
import { LogOut, LayoutDashboard, Target, Wallet, CheckCircle, Clock, Phone, MapPin, Building, ChevronLeft, Award, UserCheck, AlertCircle, ArrowLeftRight } from "lucide-react";
import { toast } from "../GlobalToast";

export default function AmbassadorDashboard({ user, onLogout }: any) {
  const [activeTab, setActiveTab] = useState<"leads" | "wallet">("leads");
  const [leadSubTab, setLeadSubTab] = useState<"public" | "my">("public");
  const [leads, setLeads] = useState<any[]>([]);
  const [wallet, setWallet] = useState({ balance: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLeads();
    fetchWallet();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ambassador/leads", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) setLeads(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await fetch("/api/ambassador/wallet", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) setWallet(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const claimLead = async (id: number) => {
    try {
      const res = await fetch(`/api/ambassador/leads/${id}/claim`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("تامین‌کننده با موفقیت انتخاب شد و از تابلوی عمومی حذف گردید. به پنل شما منتقل شد.");
        fetchLeads();
        setLeadSubTab("my");
      } else {
        toast.error(data.error || "خطا در پذیرش فرصت جذب");
      }
    } catch (err) {
      toast.error("خطا در ارتباط با سرور");
    }
  };

  const updateLeadStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/ambassador/leads/${id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        toast.success(status === "COMPLETED" ? "تبریک! جذب تامین‌کننده تایید نهایی و پورسانت به کیف پول شما اضافه شد." : "وضعیت مذاکره به‌روزرسانی شد.");
        fetchLeads();
        fetchWallet();
      } else {
        toast.error("خطا در به‌روزرسانی وضعیت");
      }
    } catch (err) {
      toast.error("خطا در ارتباط با سرور");
    }
  };

  // Filter leads
  const publicLeads = leads.filter(l => l.status === "PENDING" && (!l.ambassadorId || l.ambassadorId === null));
  const myLeads = leads.filter(l => l.ambassadorId === user?.id);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans" dir="rtl">
      {/* Top Navbar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-8 sticky top-0 z-40 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">پنل تأمین‌یاب و توسعه بازار B2B</h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">اتصال تامین‌کنندگان کالا به پلتفرم زوپیت</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user?.firstName || "تأمین‌یاب"} {user?.lastName || ""}</p>
            <p className="text-[10px] text-slate-400 font-mono">{user?.phone || user?.username}</p>
          </div>
          <button onClick={onLogout} className="p-2.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-slate-600 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400 rounded-xl transition-all cursor-pointer">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0 space-y-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-1 shadow-xs">
            <button
              onClick={() => setActiveTab("leads")}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === "leads" 
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Target className="w-4 h-4" />
                <span>فرصت‌های جذب کالا</span>
              </div>
              <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px] font-mono">{publicLeads.length + myLeads.length}</span>
            </button>

            <button
              onClick={() => setActiveTab("wallet")}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === "wallet" 
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Wallet className="w-4 h-4" />
                <span>کیف پول و پاداش‌ها</span>
              </div>
              <span className="text-emerald-500 font-mono font-bold text-[11px]">{wallet.balance.toLocaleString()}</span>
            </button>
          </div>

          <div className="bg-linear-to-br from-emerald-950 to-slate-900 text-white rounded-2xl p-4 space-y-3 shadow-md border border-emerald-800/40">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Award className="w-4 h-4" />
              <span>پاداش هر جذب موفق</span>
            </div>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              با برقراری ارتباط و هدایت تامین‌کننده برای ثبت‌نام در سامانه، پاداش نقدی بلافاصله به کیف پول شما اضافه می‌شود.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 space-y-6">
          {/* Top Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">فرصت‌های عمومی آزاد</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{publicLeads.length} <span className="text-xs font-normal text-slate-400">مورد</span></p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">پرونده‌های فعال من</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{myLeads.filter(l => l.status !== "COMPLETED").length} <span className="text-xs font-normal text-slate-400">مورد</span></p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">جذب‌های موفق من</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{myLeads.filter(l => l.status === "COMPLETED").length} <span className="text-xs font-normal text-slate-400">تامین‌کننده</span></p>
              </div>
            </div>
          </div>

          {activeTab === "leads" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
              {/* Header with Sub-Tabs */}
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">جدول تامین‌کنندگان هدف و ماموریت‌ها</h2>
                </div>

                {/* Sub-Tabs Toggle */}
                <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
                  <button
                    onClick={() => setLeadSubTab("public")}
                    className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      leadSubTab === "public"
                        ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    فرصت‌های عمومی آزاد ({publicLeads.length})
                  </button>

                  <button
                    onClick={() => setLeadSubTab("my")}
                    className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      leadSubTab === "my"
                        ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    پرونده‌ها و جذب‌های من ({myLeads.length})
                  </button>
                </div>
              </div>

              {/* Sub-Tab 1: Public Board (Free Opportunities) */}
              {leadSubTab === "public" && (
                <div className="p-4 sm:p-6 space-y-4">
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 p-3.5 rounded-xl text-xs leading-relaxed flex items-center gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>به محض اینکه روی دکمه «قبول و هماهنگی» کلیک کنید، این فرصت از تابلوی عمومی حذف شده و اختصاصاً به پنل شخصی شما منتقل خواهد شد.</span>
                  </div>

                  {publicLeads.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <Target className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">در حال حاضر فرصت عمومی آزاد جدیدی در تابلوی سیستم موجود نیست.</p>
                      <p className="text-[11px] text-slate-400">به محض ثبت هدف جدید توسط مدیران سیستم، در این قسمت نمایش داده خواهد شد.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {publicLeads.map((lead) => (
                        <div key={lead.id} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 space-y-3 hover:border-emerald-500/50 transition-all shadow-2xs">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">{lead.name}</h3>
                              <span className="inline-block mt-1 px-2.5 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md text-[10px] font-bold">
                                {lead.category || "عمومی"}
                              </span>
                            </div>
                            <div className="text-left">
                              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                {Number(lead.commission || 0).toLocaleString()} تومان
                              </span>
                              <p className="text-[10px] text-slate-400 mt-0.5">پاداش جذب موفق</p>
                            </div>
                          </div>

                          {lead.address && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 truncate">
                              <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                              <span>{lead.address}</span>
                            </p>
                          )}

                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">شناسه هدف: #{lead.id}</span>
                            <button
                              onClick={() => claimLead(lead.id)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>قبول و انتقال به پنل من</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-Tab 2: My Personal Leads */}
              {leadSubTab === "my" && (
                <div className="p-4 sm:p-6 space-y-4">
                  {myLeads.length === 0 ? (
                    <div className="text-center py-12 space-y-3">
                      <UserCheck className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">هنوز هیچ فرصت جذبی را انتخاب نکرده‌اید.</p>
                      <button
                        onClick={() => setLeadSubTab("public")}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        <span>مشاهده فرصت‌های عمومی آزاد</span>
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myLeads.map((lead) => (
                        <div key={lead.id} className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{lead.name}</h3>
                                {lead.status === "COMPLETED" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    <CheckCircle className="w-3 h-3" />
                                    جذب موفق و ثبت نهایی
                                  </span>
                                ) : lead.status === "IN_NEGOTIATION" ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    <Clock className="w-3 h-3" />
                                    در حال مذاکره
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                                    <Clock className="w-3 h-3" />
                                    رزرو شده (در انتظار تماس اولیه)
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{lead.category || "صنف عمومی"}</p>
                            </div>

                            <div className="text-left">
                              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                {Number(lead.commission || 0).toLocaleString()} تومان
                              </span>
                              <p className="text-[10px] text-slate-400">مبلغ پاداش اختصاصی شما</p>
                            </div>
                          </div>

                          {/* Contact Details for Ambassador */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="text-slate-500 dark:text-slate-400">شماره تماس تامین‌کننده:</span>
                              <a href={`tel:${lead.phone}`} className="font-mono font-bold text-slate-900 dark:text-white hover:text-emerald-600 dir-ltr text-right">
                                {lead.phone}
                              </a>
                            </div>

                            {lead.address && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                                <span className="text-slate-500 dark:text-slate-400">آدرس / بازار:</span>
                                <span className="font-semibold text-slate-900 dark:text-white truncate">{lead.address}</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          {lead.status !== "COMPLETED" && (
                            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                              {lead.status === "ASSIGNED" && (
                                <button
                                  onClick={() => updateLeadStatus(lead.id, "IN_NEGOTIATION")}
                                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>تغییر به در حال مذاکره</span>
                                </button>
                              )}

                              <button
                                onClick={() => updateLeadStatus(lead.id, "COMPLETED")}
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>تایید هماهنگی و ثبت جذب موفق (دریافت پاداش)</span>
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "wallet" && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center shadow-xs max-w-lg mx-auto space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Wallet className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">کیف پول و درآمد پاداش جذب</h3>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                  {wallet.balance.toLocaleString()} <span className="text-sm font-normal text-slate-400">تومان</span>
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-400 text-right space-y-2">
                <p className="font-bold text-slate-900 dark:text-white">راهنمای تسویه حساب:</p>
                <p>پاداش‌های مربوط به ثبت‌نام و جذب موفق تامین‌کنندگان بلافاصله پس از تایید هماهنگی به کیف پول شما اضافه می‌شوند.</p>
                <p>تسویه‌حساب‌ها به طور منظم به شماره شبای ثبت‌شده در حساب شما واریز خواهد شد.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

