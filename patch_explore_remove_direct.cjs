const fs = require('fs');
let content = fs.readFileSync('src/components/Explore.tsx', 'utf8');

// The user requested:
// "برای بخشی که مربوط به ثبت سفارش مشتریان مستقیم است، فعلاً پلتفرم B2C آن را نمیخواهم. در واقع، همان مشتریان را فعلاً خرید مستقیم برایشان در نظر نگیر تا اکسپلور و فقط همه آنها بروند به آن فروشگاه مورد نظر."
// "Cancel the direct purchase entirely. Remove it from your inventory."

// We will remove the "add to direct cart" button and the direct cart UI entirely.
const cartButtonTarget1 = `<button
                            onClick={() => addToCart(product, currentVariant)}
                            className="bg-white text-black px-4 py-2.5 rounded-full font-bold text-xs hover:bg-slate-200 transition-colors flex items-center justify-center gap-1 flex-1 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>افزودن به سبد خرید (خرید مستقیم)</span>
                          </button>`;
content = content.replace(cartButtonTarget1, '');

const cartButtonTarget2 = `<button
                        onClick={() => addToCart(product, currentVariant)}
                        className="bg-white text-black px-4 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 flex-1 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        <span>افزودن به سبد خرید مستقیم</span>
                      </button>`;
content = content.replace(cartButtonTarget2, '');

const cartFloatTarget = `<div className="absolute top-4 left-4 z-50">
        <button
          onClick={() => setShowCart(true)}
          className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20 text-white relative hover:bg-white/20 transition-colors"
        >
          <ShoppingCart className="w-6 h-6" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>`;
content = content.replace(cartFloatTarget, '');

fs.writeFileSync('src/components/Explore.tsx', content);
