import { toast } from "../GlobalToast";
import React, { useState, useEffect } from "react";
import {
  Store,
  Link2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  UploadCloud,
  FileText,
  Check,
} from "lucide-react";
export default function StoreConnection() {
  const [connection, setConnection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  /* Wizard states */ const [step, setStep] = useState(1);
  const [storeUrl, setStoreUrl] = useState("");
  const [consumerKey, setConsumerKey] = useState("");
  const [consumerSecret, setConsumerSecret] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncingProducts, setSyncingProducts] = useState(false);
  const [syncingStock, setSyncingStock] = useState(false);
  useEffect(() => {
    fetchConnection();
  }, []);
  const fetchConnection = async () => {
    try {
      const res = await fetch("/api/store/connection", { credentials: "include",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConnection(data);
        if (data && data.status === "CONNECTED") {
          setStep(5); // Show dashboard
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/store/test", { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          
        },
        body: JSON.stringify({ storeUrl, consumerKey, consumerSecret }),
      });
      const data = await res.json();
      setTestResult(data);
      if (data.success) {
        setStep(4);
      }
    } catch (err) {
      setTestResult({ success: false, error: "خطا در ارتباط با سرور" });
    } finally {
      setTesting(false);
    }
  };
  const handleSaveConnection = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/store/connect", { credentials: "include",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          
        },
        body: JSON.stringify({ storeUrl, consumerKey, consumerSecret }),
      });
      if (res.ok) {
        fetchConnection();
      }
    } catch (err) {
      toast("خطا در ذخیره اطلاعات", "error");
    } finally {
      setSaving(false);
    }
  };
  const handleDisconnect = async () => {
    if (!await window.customConfirm("آیا از قطع ارتباط اطمینان دارید؟")) return;
    try {
      await fetch("/api/store/disconnect", { credentials: "include",
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      setConnection(null);
      setStep(1);
      setStoreUrl("");
      setConsumerKey("");
      setConsumerSecret("");
    } catch (err) {
      toast("خطا در قطع ارتباط", "error");
    }
  };
  const handleSyncProducts = async () => {
    setSyncingProducts(true);
    try {
      const res = await fetch("/api/store/sync/products", { credentials: "include",
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      alert(
        `همگام‌سازی پایان یافت. موفق: ${data.successCount}، ناموفق: ${data.failedCount}`,
      );
      fetchConnection();
    } catch (err) {
      toast("خطا در همگام‌سازی", "error");
    } finally {
      setSyncingProducts(false);
    }
  };
  const handleSyncStock = async () => {
    setSyncingStock(true);
    try {
      const res = await fetch("/api/store/sync/stock", { credentials: "include",
        method: "POST",
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` },
      });
      const data = await res.json();
      alert(
        `همگام‌سازی پایان یافت. موفق: ${data.successCount}، ناموفق: ${data.failedCount}`,
      );
      fetchConnection();
    } catch (err) {
      toast("خطا در همگام‌سازی", "error");
    } finally {
      setSyncingStock(false);
    }
  };
  if (loading) {
    return (
      <div className="p-12 text-center text-muted">در حال بارگذاری...</div>
    );
  }
  /* Active connection dashboard */ if (
    connection &&
    connection.status === "CONNECTED"
  ) {
    return (
      <div className="space-y-6 animate-fade-in">
        
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-emerald-100 flex justify-between items-center">
          
          <div className="flex items-center gap-4">
            
            <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center text-success">
              
              <Store className="w-6 h-6" />
            </div>
            <div>
              
              <h3 className="font-bold text-lg text-primary">
                اتصال به فروشگاه برقرار است
              </h3>
              <p className="text-sm text-muted font-mono mt-1" dir="ltr">
                {connection.storeUrl}
              </p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 border border-rose-200 text-danger rounded-xl hover:bg-danger/10 font-medium text-sm transition-colors"
          >
            
            قطع ارتباط
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-subtle">
            
            <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
              
              <RefreshCw className="w-5 h-5 text-primary-default" /> همگام‌سازی
              دستی
            </h4>
            <div className="space-y-4">
              
              <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                
                <div>
                  
                  <p className="font-bold text-secondary">
                    همگام‌سازی محصولات
                  </p>
                  <p className="text-xs text-muted mt-1">
                    ارسال محصولات انتخاب شده به فروشگاه
                  </p>
                </div>
                <button
                  onClick={handleSyncProducts}
                  disabled={syncingProducts}
                  className="bg-primary-default text-inverse px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2"
                >
                  
                  {syncingProducts ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UploadCloud className="w-4 h-4" />
                  )}
                  شروع همگام‌سازی
                </button>
              </div>
              <div className="flex justify-between items-center p-4 bg-background rounded-xl">
                
                <div>
                  
                  <p className="font-bold text-secondary">
                    همگام‌سازی موجودی
                  </p>
                  <p className="text-xs text-muted mt-1">
                    به‌روزرسانی موجودی محصولات متصل
                  </p>
                </div>
                <button
                  onClick={handleSyncStock}
                  disabled={syncingStock}
                  className="bg-primary-default text-inverse px-4 py-2 rounded-lg font-medium text-sm hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2"
                >
                  
                  {syncingStock ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UploadCloud className="w-4 h-4" />
                  )}
                  همگام‌سازی موجودی
                </button>
              </div>
            </div>
          </div>
          <div className="bg-card p-6 rounded-2xl shadow-sm border border-subtle">
            
            <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
              
              <FileText className="w-5 h-5 text-muted" /> تاریخچه
              همگام‌سازی
            </h4>
            <div className="space-y-3">
              
              {connection.syncLogs?.length > 0 ? (
                connection.syncLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="flex justify-between items-center p-3 border border-subtle rounded-lg text-sm"
                  >
                    
                    <div>
                      
                      <span
                        className={`font-bold mr-2 ${log.status === "SUCCESS" ? "text-success" : "text-danger"}`}
                      >
                        
                        {log.type === "PRODUCTS"
                          ? "محصولات"
                          : log.type === "STOCK"
                            ? "موجودی"
                            : "سفارشات"}
                      </span>
                      <span className="text-muted text-xs">
                        {new Date(log.createdAt).toLocaleString("fa-IR")}
                      </span>
                    </div>
                    <div className="text-xs bg-background px-2 py-1 rounded">
                      
                      {log.message || log.status}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted text-center py-4">
                  هیچ تاریخچه‌ای وجود ندارد.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  /* Connection Wizard */ return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      
      <div className="bg-card p-8 rounded-2xl shadow-sm border border-subtle">
        
        <h2 className="text-2xl font-bold text-primary mb-2">
          اتصال به فروشگاه (ووکامرس)
        </h2>
        <p className="text-muted mb-8">
          برای دریافت محصولات و همگام‌سازی موجودی، فروشگاه ووکامرس خود را متصل
          کنید.
        </p>
        {/* Wizard Steps indicator */}
        <div className="flex items-center justify-between mb-8 relative">
          
          <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-surface -z-10 transform -translate-y-1/2"></div>
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${step >= s ? "bg-primary-default text-inverse shadow-md" : "bg-surface text-muted"}`}
            >
              
              {step > s ? <Check className="w-5 h-5" /> : s}
            </div>
          ))}
        </div>
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            
            <h3 className="font-bold text-lg">آدرس فروشگاه شما</h3>
            <div>
              
              <label className="block text-sm font-semibold text-secondary mb-2">
                Website URL
              </label>
              <input
                type="url"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                placeholder="https://yourstore.com"
                className="w-full px-4 py-3 bg-background border border-subtle rounded-xl text-sm focus:ring-2 focus:ring-primary-default text-left font-mono"
                dir="ltr"
              />
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!storeUrl}
              className="w-full bg-primary-default text-inverse font-medium py-3 rounded-xl hover:bg-primary-hover disabled:opacity-50 transition-colors mt-4"
            >
              
              مرحله بعد
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            
            <h3 className="font-bold text-lg">
              کلیدهای دسترسی (API Keys)
            </h3>
            <p className="text-sm text-muted mb-4">
              در پنل وردپرس خود به مسیر ووکامرس &gt; پیکربندی &gt; پیشرفته &gt;
              REST API بروید و یک کلید جدید با دسترسی «خواندن/نوشتن» ایجاد کنید.
            </p>
            <div>
              
              <label className="block text-sm font-semibold text-secondary mb-2">
                Consumer Key
              </label>
              <input
                type="text"
                value={consumerKey}
                onChange={(e) => setConsumerKey(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-subtle rounded-xl text-sm focus:ring-2 focus:ring-primary-default text-left font-mono"
                dir="ltr"
              />
            </div>
            <div>
              
              <label className="block text-sm font-semibold text-secondary mb-2">
                Consumer Secret
              </label>
              <input
                type="password"
                value={consumerSecret}
                onChange={(e) => setConsumerSecret(e.target.value)}
                className="w-full px-4 py-3 bg-background border border-subtle rounded-xl text-sm focus:ring-2 focus:ring-primary-default text-left font-mono"
                dir="ltr"
              />
            </div>
            <div className="flex gap-3 mt-6">
              
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-subtle text-muted rounded-xl font-medium hover:bg-background transition-colors"
              >
                
                بازگشت
              </button>
              <button
                onClick={handleTestConnection}
                disabled={!consumerKey || !consumerSecret || testing}
                className="flex-1 bg-primary-default text-inverse font-medium py-3 rounded-xl hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                
                {testing ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Link2 className="w-5 h-5" />
                )}
                تست ارتباط
              </button>
            </div>
            {testResult && !testResult.success && (
              <div className="mt-4 p-4 bg-danger/10 text-danger rounded-xl flex items-start gap-3 border border-rose-100">
                
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  
                  <strong>ارتباط ناموفق!</strong>
                  <p className="mt-1">{testResult.error}</p>
                </div>
              </div>
            )}
          </div>
        )}
        {step === 4 && (
          <div className="space-y-6 animate-fade-in text-center">
            
            <div className="w-20 h-20 bg-success/20 text-success rounded-full flex items-center justify-center mx-auto mb-4">
              
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="font-bold text-2xl text-primary">
              ارتباط با موفقیت تست شد!
            </h3>
            <div
              className="bg-background rounded-xl p-4 text-sm text-muted inline-block text-left"
              dir="ltr"
            >
              
              <p>WooCommerce Version: {testResult?.data?.wooVersion}</p>
              <p>WordPress Version: {testResult?.data?.wpVersion}</p>
            </div>
            <p className="text-muted">
              اکنون می‌توانید اطلاعات اتصال را ذخیره کرده و اولین همگام‌سازی را
              انجام دهید.
            </p>
            <button
              onClick={handleSaveConnection}
              disabled={saving}
              className="w-full bg-success text-inverse font-bold py-4 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 mt-6"
            >
              
              {saving ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : null}
              ذخیره و اتصال نهایی
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
