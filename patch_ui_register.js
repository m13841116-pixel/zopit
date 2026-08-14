const fs = require('fs');
let code = fs.readFileSync('src/components/store-manager/StoreProAccount.tsx', 'utf8');

// Add states
code = code.replace(/const \[termsAccepted, setTermsAccepted\] = useState\(false\);/, 
  `const [termsAccepted, setTermsAccepted] = useState(false);
  const [hasEnamad, setHasEnamad] = useState(false);
  const [hasGateway, setHasGateway] = useState(false);
  const [hasTaxProfile, setHasTaxProfile] = useState(false);
  const [promoCodeInput, setPromoCodeInput] = useState("");`);

// Update submit handler
code = code.replace(/const res = await fetch\("\/api\/store-manager\/pro\/register", {\n\s*method: "POST",\n\s*headers: { Authorization: \`Bearer \$\{token\}\`, "Content-Type": "application\/json" },\n\s*body: JSON\.stringify\(\{ fullName, nationalCode, mobile, signatureImage: canvasRef\.current\?\.toDataURL\(\) \}\)\n\s*}\);/,
  `const res = await fetch("/api/store-manager/pro/register", {
        method: "POST",
        headers: { Authorization: \`Bearer \$\{token\}\`, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fullName, nationalCode, mobile, signatureImage: canvasRef.current?.toDataURL(),
          hasEnamad, hasGateway, hasTaxProfile, promoCodeInput
        })
      });`);
      
// Update success flow in submit
code = code.replace(/if \(res\.ok\) \{\n\s*if \(showNotification\) showNotification\(data\.message, "success"\);\n\s*else toast\(data\.message, "success"\);\n\s*fetchProStatus\(\);\n\s*\}\s*else\s*\{/,
  `if (res.ok) {
        if (data.payLink) {
          window.location.href = data.payLink;
          return;
        }
        if (showNotification) showNotification(data.message, "success");
        else toast(data.message, "success");
        fetchProStatus();
      } else {`);

// Inject new Add-on Checkboxes before Captcha
const captchaAnchor = `{/* Captcha */}`;
const addOnCheckboxes = `
                  {/* Add-ons Section */}
                  <div className="bg-surface/50 border border-border-subtle rounded-2xl p-4 space-y-4">
                    <h4 className="text-sm font-black text-primary flex items-center gap-2">
                      <Puzzle className="w-4 h-4 text-emerald-500" />
                      خدمات افزودنی رایگان (اختیاری)
                    </h4>
                    
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={hasEnamad}
                        onChange={(e) => setHasEnamad(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-gray-300 bg-background" 
                      />
                      <div>
                        <span className="text-xs font-bold text-primary group-hover:text-emerald-500 transition-colors">ثبت‌نام و دریافت اینماد (Enamad)</span>
                        <p className="text-[11px] text-muted mt-1 leading-relaxed">
                          هزینه ثبت اینماد ۵۰,۰۰۰ تومان می‌باشد که به فاکتور اضافه خواهد شد.
                        </p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={hasGateway}
                        onChange={(e) => setHasGateway(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-gray-300 bg-background" 
                      />
                      <div>
                        <span className="text-xs font-bold text-primary group-hover:text-emerald-500 transition-colors">اخذ درگاه پرداخت آنلاین</span>
                        <p className="text-[11px] text-muted mt-1 leading-relaxed">این خدمت کاملاً رایگان است. (تایید قوانین اجباری می‌باشد)</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={hasTaxProfile}
                        onChange={(e) => setHasTaxProfile(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-gray-300 bg-background" 
                      />
                      <div>
                        <span className="text-xs font-bold text-primary group-hover:text-emerald-500 transition-colors">تشکیل پرونده مالیاتی</span>
                        <p className="text-[11px] text-muted mt-1 leading-relaxed text-rose-500">
                          زویپت هیچگونه مسئولیتی در قبال پرونده مالیاتی و عواقب آن ندارد. تایید شما به منزله پذیرش مسئولیت شخصی می‌باشد.
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Promo Code */}
                  <div className="bg-surface/50 border border-border-subtle rounded-2xl p-4">
                    <label className="block text-xs font-bold text-secondary mb-2">کد تخفیف سایت (در صورت وجود)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        placeholder="ZOPIT100"
                        className="flex-1 px-4 py-2 bg-background border border-border-subtle rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-left font-mono"
                        dir="ltr"
                      />
                    </div>
                    <p className="text-[10px] text-muted mt-2">
                      کدهای تخفیف به صورت محدود برای ثبت‌نام اولیه اکانت پرو با هزینه {parseInt(settings.proAccountPrice || '239500').toLocaleString('fa-IR')} تومان قابل استفاده می‌باشند.
                    </p>
                  </div>

                  {/* Captcha */}`;
code = code.replace(captchaAnchor, addOnCheckboxes);

// Make "Terms" clickable to open modal
const termsOld = `<label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      required
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-gray-300 bg-background"
                    />
                    <span className="text-xs font-bold text-secondary group-hover:text-primary transition-colors">
                      تمام بندها و شرایط قرارداد اکانت پرو زوپیت را مطالعه نموده و می‌پذیرم.
                    </span>
                  </label>`;
                  
const termsNew = `<label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      required
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 border-gray-300 bg-background shrink-0"
                    />
                    <span className="text-xs font-bold text-secondary group-hover:text-primary transition-colors">
                      تمام بندها و <button type="button" onClick={() => setShowTermsModal(true)} className="text-emerald-500 hover:underline">شرایط قرارداد اکانت پرو زوپیت</button> را مطالعه نموده و می‌پذیرم.
                    </span>
                  </label>`;
                  
code = code.replace(termsOld, termsNew);

// Insert terms modal
const modalText = `{/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-border-subtle flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-border-subtle flex justify-between items-center bg-surface/50">
              <h3 className="font-black text-primary text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-500" />
                متن قرارداد و قوانین رسمی اکانت پرو زوپیت
              </h3>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="p-2 bg-background hover:bg-surface rounded-xl transition-colors text-muted hover:text-rose-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto leading-loose text-sm text-secondary space-y-4">
              {settings.termsContent ? (
                <div className="whitespace-pre-wrap font-medium">{settings.termsContent}</div>
              ) : (
                <div className="text-center py-10 opacity-50">متن قرارداد هنوز توسط مدیر تنظیم نشده است.</div>
              )}
            </div>
            
            <div className="p-4 border-t border-border-subtle bg-surface/50 flex justify-end">
              <button
                onClick={() => {
                  setTermsAccepted(true);
                  setShowTermsModal(false);
                }}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs transition-colors"
              >
                می‌پذیرم و تایید می‌کنم
              </button>
            </div>
          </div>
        </div>
      )}`;

// We can append this before the final closing div/fragment.
code = code.replace(/<\/div>\n\s*<\/div>\n\s*\)\;\n\}/g, `</div>\n        </div>\n      ${modalText}\n    </div>\n  );\n}`);

fs.writeFileSync('src/components/store-manager/StoreProAccount.tsx', code);
