const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const oldFormStart = content.indexOf('{view === "ambassador_form" && (');
const oldFormEnd = content.indexOf('</form>', oldFormStart) + 7;

const newForm = `{view === "ambassador_form" && (
              <div className="max-w-md mx-auto py-12 px-4 animate-fade-in text-right">
                <div className="bg-card border border-border-subtle p-8 rounded-3xl shadow-xl shadow-indigo-500/5 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-subtle">
                    <div>
                      <h2 className="text-2xl font-black text-indigo-500 flex items-center gap-3">
                        <ZopitLogo size="sm" />
                        ثبت‌نام سفیر جذب
                      </h2>
                      <p className="text-xs text-text-muted mt-2">عضویت سریع و آسان به عنوان سفیر زوپیت</p>
                    </div>
                    <button
                      onClick={() => setView("role_select")}
                      className="p-2 bg-surface hover:bg-border text-secondary rounded-full transition-colors"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleReferrerRegister} className="space-y-5">
                    <div>
                      <label className="block text-xs font-black text-secondary mb-1.5">نام و نام خانوادگی (اختیاری)</label>
                      <input
                        type="text"
                        value={refForm.firstName}
                        onChange={(e) => setRefForm({ ...refForm, firstName: e.target.value })}
                        className="w-full px-4 py-3 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                        placeholder="مثال: علی احمدی"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-black text-secondary mb-1.5">شماره موبایل (نام کاربری) *</label>
                      <input
                        type="tel"
                        required
                        value={refForm.mobile}
                        onChange={(e) => setRefForm({ ...refForm, mobile: e.target.value, username: e.target.value })}
                        className="w-full px-4 py-3 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-left"
                        placeholder="0912..."
                        dir="ltr"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-black text-secondary mb-1.5">رمز عبور *</label>
                      <input
                        type="password"
                        required
                        value={refForm.password}
                        onChange={(e) => setRefForm({ ...refForm, password: e.target.value })}
                        className="w-full px-4 py-3 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 transition-all font-mono text-left"
                        dir="ltr"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 mt-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-sm font-black transition-all shadow-lg shadow-indigo-500/30 flex justify-center items-center"
                    >
                      {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : "ثبت‌نام و ورود"}
                    </button>
                  </form>`;

content = content.replace(content.substring(oldFormStart, oldFormEnd), newForm);

// Also remove customer_form completely
const customerFormStart = content.indexOf('{view === "ambassador_form" && (');
// Wait, customer form was replaced by ambassador_form in the previous step? Let's check
fs.writeFileSync('src/App.tsx', content);
