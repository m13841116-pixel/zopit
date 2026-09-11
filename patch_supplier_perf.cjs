const fs = require('fs');

let code = fs.readFileSync('src/components/supplier/SupplierPerformancePanel.tsx', 'utf-8');

// We will add the fulfillment rate and avg processing time in the UI
// Let's replace the top section of SupplierPerformancePanel

const newScoreUI = `
      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Fulfillment Rate */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 p-6 rounded-2xl border border-emerald-500/20 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <CheckCircle className="w-24 h-24 text-emerald-500" />
          </div>
          <div className="relative z-10">
            <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-300">نرخ تأمین موفق</h4>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {typeof supplier.fulfillmentRate === 'number' ? supplier.fulfillmentRate.toFixed(1) : 100}٪
              </span>
            </div>
            <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-2 font-medium">
              درصد سفارشاتی که با موفقیت ارسال کرده‌اید
            </p>
          </div>
          <div className="relative z-10 mt-4 bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-emerald-500/20">
            <p className="text-[10px] text-emerald-800 dark:text-emerald-200 font-bold">
              💡 نکته: تأمین‌کنندگان با نرخ بالای ۹۵٪ نشان طلایی دریافت می‌کنند و محصولاتشان در ویترین فروشگاه‌ها بالاتر نمایش داده می‌شود.
            </p>
          </div>
        </div>

        {/* Processing Time */}
        <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 p-6 rounded-2xl border border-blue-500/20 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap className="w-24 h-24 text-blue-500" />
          </div>
          <div className="relative z-10">
            <h4 className="text-sm font-black text-blue-800 dark:text-blue-300">میانگین زمان پردازش</h4>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl font-extrabold text-blue-600 dark:text-blue-400">
                {typeof supplier.avgProcessingTimeHours === 'number' ? supplier.avgProcessingTimeHours.toFixed(1) : 12}
              </span>
              <span className="text-blue-700 dark:text-blue-300 text-sm font-bold">ساعت</span>
            </div>
            <p className="text-xs text-blue-700/80 dark:text-blue-300/80 mt-2 font-medium">
              زمان سپری شده از دریافت تا ارسال سفارش
            </p>
          </div>
          <div className="relative z-10 mt-4 bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-blue-500/20">
            <p className="text-[10px] text-blue-800 dark:text-blue-200 font-bold">
              ⚡ نکته: پردازش زیر ۲۴ ساعت نشان "تأمین‌کننده سریع" را برای شما فعال می‌کند و اعتماد مدیران فروشگاه را جلب می‌کند.
            </p>
          </div>
        </div>
`;

code = code.replace(
  `{/* Primary Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">`,
  newScoreUI
);

// We need to import Zap
if (!code.includes('Zap')) {
  code = code.replace(/Calendar,/, 'Calendar, Zap,');
}

fs.writeFileSync('src/components/supplier/SupplierPerformancePanel.tsx', code);
console.log('Patched SupplierPerformancePanel successfully');
