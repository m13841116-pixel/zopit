const fs = require('fs');
let code = fs.readFileSync('src/components/superadmin/SuperAdminProAccounts.tsx', 'utf8');

// Update state to include promo code
code = code.replace(/const \[torobPrice, setTorobPrice\] = useState\("150000"\);/, 
  `const [torobPrice, setTorobPrice] = useState("150000");\n  const [promoCode, setPromoCode] = useState("ZOPIT-PRO-198");\n`);

// Actually promoCode already exists in SuperAdminProAccounts.tsx:
// const [promoCode, setPromoCode] = useState("ZOPIT-PRO-198");
// Let's just update the label for promo code to mention it's for Pro Setup too

code = code.replace(/<label className="block text-xs font-bold text-secondary mb-1.5">\s*کد تخفیف اختصاصی \(برای هاست\):\s*<\/label>/, 
  `<label className="block text-xs font-bold text-secondary mb-1.5">
                کد تخفیف ۱۰۰٪ ثبت نام اکانت پرو:
              </label>`);

code = code.replace(/<p className="text-\[10px\] text-muted mt-1 leading-relaxed">\s*در صورتی که کاربر هنگام تمدید هاست این کد را وارد کند، هزینه تمدید با تخفیف ویژه محاسبه خواهد شد\.\s*<\/p>/, 
  `<p className="text-[10px] text-muted mt-1 leading-relaxed">
                در صورتی که کاربر هنگام ثبت اکانت پرو این کد را وارد کند، هزینه پایه آن کاملا رایگان (۰ تومان) محاسبه می‌شود. هزینه سایر خدمات مانند اینماد جداگانه است.
              </p>`);

// Update modal details to show Enamad, Gateway, Tax
const accountInfoAnchor = `{selectedAccount.mobile}</span>\n                </div>\n              </div>`;
const newAccountInfo = `{selectedAccount.mobile}</span>
                </div>
              </div>
              
              {/* Optional Add-ons */}
              <div className="bg-surface/50 border border-subtle p-3 rounded-xl mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-muted">دریافت اینماد:</span>
                  <span className={selectedAccount.hasEnamad ? "text-emerald-500" : "text-rose-500"}>{selectedAccount.hasEnamad ? "بله (پرداخت شده)" : "خیر"}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-muted">درگاه پرداخت:</span>
                  <span className={selectedAccount.hasGateway ? "text-emerald-500" : "text-rose-500"}>{selectedAccount.hasGateway ? "درخواست داده" : "خیر"}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-muted">پرونده مالیاتی:</span>
                  <span className={selectedAccount.hasTaxProfile ? "text-emerald-500" : "text-rose-500"}>{selectedAccount.hasTaxProfile ? "درخواست داده" : "خیر"}</span>
                </div>
              </div>`;
code = code.replace(accountInfoAnchor, newAccountInfo);

fs.writeFileSync('src/components/superadmin/SuperAdminProAccounts.tsx', code);
