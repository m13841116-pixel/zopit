import re

with open('src/components/store-manager/StoreProAccount.tsx', 'r') as f:
    code = f.read()

# The start of the block:
start_str = '{formStep > 1 && ('
end_str = '          </div>\n        )}'

start_idx = code.find(start_str)
# Find the specific end_str after start_idx
end_idx = code.find(end_str, start_idx) + len(end_str)

if start_idx != -1 and end_idx != -1:
    new_block = """{formStep > 1 && (
            <div id="pro-register-wizard-container" className="bg-slate-950 border border-slate-800 rounded-[2.5rem] p-6 sm:p-10 space-y-10 shadow-2xl">
              {/* Back to plans button */}
              <button
                type="button"
                onClick={() => {
                  setFormStep(1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="mb-6 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-400 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>بازگشت به انتخاب پلن</span>
              </button>

              <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-emerald-500" />
                    <span>تکمیل اطلاعات و راه‌اندازی پلن {selectedPlan === "VIP" ? "ویژه VIP" : selectedPlan === "PRO" ? "حرفه‌ای (رشد)" : "استارتاپ"}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    لطفاً مشخصات خود را بررسی کرده و سپس پرداخت را انجام دهید.
                  </p>
                </div>
              </div>

              {/* APPLICANT INFO & SERVICES FORM */}
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* SECTION 1: STORE MANAGER PROFILE */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-200 font-black text-sm border-b border-slate-800 pb-2">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <span>۱. مشخصات مدیر فروشگاه</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1.5">
                        نام و نام خانوادگی مدیر فروشگاه <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="مثال: محمد رضایی"
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1.5">
                        کد ملی <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={nationalCode}
                        onChange={(e) => setNationalCode(e.target.value)}
                        placeholder="۱۰ رقم کد ملی"
                        maxLength={10}
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-200"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-400 block mb-1.5">
                        شماره موبایل <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="09123456789"
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-200"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* SECTION 2: ADMIN SERVICES */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-200 font-black text-sm border-b border-slate-800 pb-2">
                    <Shield className="w-4 h-4 text-emerald-500" />
                    <span>۲. خدمات اداری و زیرساختی (رایگان با پلن پرومکس)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-start gap-3 cursor-pointer bg-slate-900 hover:bg-slate-800/80 p-4 rounded-2xl border border-slate-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={hasEnamad}
                        onChange={(e) => setHasEnamad(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-700"
                      />
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-200">اخذ ای‌نماد و درگاه پرداخت</span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            رایگان
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          دریافت نماد اعتماد الکترونیک و درگاه بانکی مستقیم با نام خود شما.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer bg-slate-900 hover:bg-slate-800/80 p-4 rounded-2xl border border-slate-700 transition-colors">
                      <input
                        type="checkbox"
                        checked={hasTaxProfile}
                        onChange={(e) => setHasTaxProfile(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-700"
                      />
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-slate-200">تشکیل پرونده مالیاتی</span>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            رایگان
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          ثبت‌نام و تشکیل پرونده در سازمان امور مالیاتی کشور.
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* SECTION 3: SIGNATURE CANVAS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                        <PenTool className="w-4 h-4 text-emerald-500" />
                        <span>۳. کادر امضای دیجیتال آنلاین قرارداد <span className="text-rose-500">*</span>:</span>
                      </label>
                      {(hasSignature || signatureDataUrl) && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>امضای رسمی ثبت شد</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={autoGenerateSignature}
                        className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold bg-emerald-500/10 hover:bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/20 cursor-pointer transition-all active:scale-95"
                      >
                        <Zap className="w-3.5 h-3.5" /> امضای خودکار با هویت دیجیتال
                      </button>
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-xs text-rose-500 hover:text-rose-400 flex items-center gap-1 font-medium cursor-pointer p-1 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> پاکسازی
                      </button>
                    </div>
                  </div>
                  <div className="border border-slate-700 rounded-2xl bg-slate-900 p-2.5 relative text-center shadow-xs">
                    <canvas
                      ref={canvasRef}
                      width={500}
                      height={140}
                      onPointerDown={handlePointerDown}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      className="w-full h-32 touch-none cursor-crosshair bg-slate-800 rounded-xl border border-slate-700"
                    />
                    {!hasSignature && !signatureDataUrl && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-500 text-xs p-4">
                        <span>جهت ثبت امضا، با دست یا ماوس در این کادر بکشید</span>
                        <span className="text-[10px] text-emerald-500 mt-1 font-bold">یا دکمه «امضای خودکار با هویت دیجیتال» را بفشارید</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 4: INVOICE & DISCOUNT */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-200 font-black text-sm border-b border-slate-800 pb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>۴. فاکتور نهایی و پرداخت</span>
                  </div>
                  
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">پلن انتخابی شما:</span>
                      <span className="text-slate-200 font-bold">{selectedPlan === "VIP" ? "ویژه VIP" : selectedPlan === "PRO" ? "حرفه‌ای (رشد)" : "استارتاپ"}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">هزینه پلن:</span>
                      <span className="text-slate-200 font-bold">
                        {Math.max(0, (selectedPlan === 'VIP' ? (billingCycle === 'ANNUAL' ? 9900000 : 1490000) : selectedPlan === 'PRO' ? (billingCycle === 'ANNUAL' ? 1490000 : 599000) : 259000)).toLocaleString()} تومان
                      </span>
                    </div>

                    {/* Promo code */}
                    <div className="pt-4 border-t border-slate-800">
                      <label className="text-xs font-bold text-slate-400 block mb-2">
                        کد تخفیف (اختیاری)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={discountCodeText}
                          onChange={(e) => setDiscountCodeText(e.target.value)}
                          disabled={isDiscountApplied}
                          placeholder="کد تخفیف خود را وارد کنید"
                          className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-200 disabled:opacity-50"
                        />
                        {isDiscountApplied ? (
                          <button
                            type="button"
                            onClick={() => {
                              setIsDiscountApplied(false);
                              setDiscountCodeText("");
                              setAppliedDiscount(0);
                            }}
                            className="px-4 py-2 bg-rose-500/10 text-rose-500 font-bold text-xs rounded-xl hover:bg-rose-500/20 transition-all shrink-0 border border-rose-500/20"
                          >
                            لغو تخفیف
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleApplyDiscountCode}
                            className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-700 transition-all shrink-0 border border-slate-700"
                          >
                            اعمال کد
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {appliedDiscount > 0 && (
                      <div className="flex justify-between items-center text-sm bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                        <span className="text-emerald-400">تخفیف اعمال شده:</span>
                        <span className="text-emerald-400 font-bold">
                          - {appliedDiscount.toLocaleString()} تومان
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-base pt-4 border-t border-slate-800">
                      <span className="text-slate-300 font-black">مبلغ قابل پرداخت:</span>
                      <span className="text-emerald-400 font-black text-xl">
                        {Math.max(0, (selectedPlan === 'VIP' ? (billingCycle === 'ANNUAL' ? 9900000 : 1490000) : selectedPlan === 'PRO' ? (billingCycle === 'ANNUAL' ? 1490000 : 599000) : 259000) + (hasEnamad ? 50000 : 0) - appliedDiscount).toLocaleString()} تومان
                      </span>
                    </div>
                  </div>
                </div>

                {/* SECTION 5: TERMS ACCEPTANCE & MATH CAPTCHA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-2">
                  <label className="flex items-center gap-3 cursor-pointer bg-slate-900 p-4 rounded-2xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-700 cursor-pointer shrink-0"
                    />
                    <span className="text-xs font-bold text-slate-300 leading-relaxed">
                      با تأیید و ارسال این فرم،
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowTermsModal(true);
                        }}
                        className="text-emerald-400 hover:text-emerald-300 underline font-extrabold mx-1 cursor-pointer inline-block"
                      >
                        قوانین و مقررات رسمی زوپیت
                      </button>
                      را مطالعه نموده و می‌پذیرم.
                    </span>
                  </label>
                  
                  {/* Math Captcha */}
                  <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-400 whitespace-nowrap">کد امنیتی:</span>
                    <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-black text-base px-4 py-1.5 rounded-xl shadow-xs tracking-widest flex items-center gap-2">
                      <span className="text-emerald-400 font-extrabold">{num1}</span>
                      <span className="text-emerald-500 font-bold">+</span>
                      <span className="text-emerald-400 font-extrabold">{num2}</span>
                      <span className="text-emerald-500 font-bold">=</span>
                    </div>
                    <input
                      type="text"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      placeholder="پاسخ"
                      className="w-20 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono font-bold text-center focus:ring-2 focus:ring-emerald-500 outline-none text-slate-200"
                      required
                    />
                    <button
                      type="button"
                      onClick={resetCaptcha}
                      className="text-slate-500 hover:text-slate-300 cursor-pointer p-1"
                      title="تغییر سوال"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4 text-center">
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={submitting}
                    className="w-full md:w-[75%] mx-auto py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base rounded-2xl shadow-[0_0_40px_-10px_rgba(16,185,129,0.4)] transition-all flex items-center justify-center gap-3 cursor-pointer transform hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <span>ارتقا و پرداخت نهایی</span>
                        <ChevronLeft className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
        )}"""
    
    code = code[:start_idx] + new_block + code[end_idx:]
    with open('src/components/store-manager/StoreProAccount.tsx', 'w') as f:
        f.write(code)
    print("Replaced successfully")
else:
    print(f"Could not find start or end index. start={start_idx}, end={end_idx}")

