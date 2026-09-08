const fs = require('fs');

const top = fs.readFileSync('/tmp/SupplierAddProduct_top.tsx', 'utf8');
const header = fs.readFileSync('/tmp/header.txt', 'utf8');
const s1 = fs.readFileSync('/tmp/s1.txt', 'utf8');
const s2 = fs.readFileSync('/tmp/s2.txt', 'utf8');
const s3 = fs.readFileSync('/tmp/s3.txt', 'utf8');
const s4 = fs.readFileSync('/tmp/s4.txt', 'utf8');
const s5 = fs.readFileSync('/tmp/s5.txt', 'utf8');
const modals = fs.readFileSync('/tmp/modals.txt', 'utf8');

const newRender = `
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-subtle overflow-hidden animate-fade-in max-w-4xl mx-auto my-8">
${header}

      {/* Stepper Progress Bar */}
      <div className="flex items-center justify-between px-8 py-4 bg-surface border-b border-subtle overflow-x-auto">
        {steps.map((s, idx) => {
          const stepNum = idx + 1;
          const isActive = step === stepNum;
          const isPassed = step > stepNum;
          return (
            <div key={idx} className="flex flex-col items-center gap-2 min-w-[80px]">
              <div className={\`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all \${isActive ? 'bg-primary-default text-inverse shadow-lg scale-110' : isPassed ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}\`}>
                {isPassed ? <CheckCircle className="w-5 h-5" /> : stepNum}
              </div>
              <span className={\`text-xs font-bold text-center \${isActive ? 'text-primary-default' : isPassed ? 'text-emerald-600' : 'text-muted'}\`}>{s}</span>
            </div>
          );
        })}
      </div>

      <div className="p-8 space-y-12 min-h-[400px]">
        {step === 1 && (
          <div className="animate-fade-in">
            ${s1}
          </div>
        )}
        
        {step === 2 && (
          <div className="animate-fade-in">
            ${s2}
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in">
            ${s3}
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in">
            ${s4}
          </div>
        )}

        {step === 5 && (
          <div className="animate-fade-in space-y-8">
            <div className="bg-primary-default/5 border border-primary-default/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-primary mb-2 flex items-center gap-2">
                 <CheckCircle className="w-6 h-6 text-primary-default" />
                 آماده ثبت محصول هستید؟
              </h3>
              <p className="text-sm text-secondary leading-relaxed">
                شما می‌توانید این محصول را به عنوان <strong>پیش‌نویس</strong> ذخیره کنید تا بعداً اطلاعات آن را تکمیل نمایید. 
                در صورتی که تمام اطلاعات را تکمیل کرده‌اید، می‌توانید آن را <strong>ثبت و ارسال برای بررسی</strong> کنید.
                <br/>
                محصول پس از ارسال، توسط کارشناسان بررسی شده و در صورت تایید (و تعیین حاشیه سود پلتفرم)، منتشر خواهد شد.
              </p>
            </div>
            ${s5}
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-6 border-t border-subtle flex flex-col sm:flex-row justify-between items-center gap-4 bg-card rounded-b-2xl mt-4 sticky bottom-0 z-10 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <button
          onClick={step === 1 ? onCancel : prevStep}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-sm font-medium text-text-secondary bg-surface hover:bg-surface-hover transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          {step === 1 ? "انصراف" : "مرحله قبل"}
        </button>
        
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-3">
          {step === 5 ? (
            <>
              <button
                onClick={() => handleSubmit('DRAFT')}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 rounded-xl text-sm font-bold text-slate-700 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-all cursor-pointer"
              >
                ذخیره به عنوان پیش‌نویس
              </button>
              <button
                onClick={() => handleSubmit('PENDING_APPROVAL')}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 rounded-xl text-sm font-extrabold text-inverse bg-primary-default hover:bg-primary-hover transition-all shadow-lg shadow-primary-default/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {initialData?.id ? "ویرایش نهایی و ارسال برای تایید" : "ثبت نهایی و ارسال برای تایید"}
              </button>
            </>
          ) : (
            <button
              onClick={nextStep}
              className="w-full sm:w-auto px-10 py-3 rounded-xl text-sm font-extrabold text-inverse bg-primary-default hover:bg-primary-hover transition-all shadow-lg shadow-primary-default/20 cursor-pointer"
            >
              مرحله بعد
            </button>
          )}
        </div>
      </div>

      ${modals}
`;

fs.writeFileSync('src/components/supplier/SupplierAddProduct.tsx', top + newRender);
console.log('Stitched successfully!');
