const fs = require('fs');
let content = fs.readFileSync('src/components/superadmin/PaymentSmsSettings.tsx', 'utf8');

const targetStr = `        {/* Card 5: Interactive SMS Live Test */}`;

const customPatternsSection = `
        {/* Card 4.5: Custom SMS Patterns */}
        <div className="bg-card p-6 rounded-2xl border border-border shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-sm font-bold text-text-primary">الگوهای پیامکی سفارشی</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                const newPattern = {
                  id: Date.now().toString(),
                  name: '',
                  patternCode: '',
                  isActive: true,
                  role: 'all',
                  frequencyHours: 0
                };
                setCustomSmsPatterns([...customSmsPatterns, newPattern]);
              }}
              className="px-3 py-1.5 bg-primary-default/10 text-primary-default rounded-lg text-xs font-bold hover:bg-primary-default/20 transition-colors"
            >
              + افزودن الگوی جدید
            </button>
          </div>

          <div className="space-y-4">
            {customPatternsSectionContent}
          </div>
        </div>

`;

const customPatternsSectionContentStr = `
            {customSmsPatterns.length === 0 ? (
              <div className="text-center py-6 text-text-muted text-xs">هیچ الگوی سفارشی تعریف نشده است.</div>
            ) : (
              customSmsPatterns.map((pattern, index) => (
                <div key={pattern.id} className="p-4 rounded-xl border border-border bg-surface/50 space-y-3">
                  <div className="flex flex-wrap sm:flex-nowrap items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-text-muted mb-1">نام الگو (برای شناسایی):</label>
                          <input
                            type="text"
                            value={pattern.name}
                            onChange={(e) => {
                              const updated = [...customSmsPatterns];
                              updated[index].name = e.target.value;
                              setCustomSmsPatterns(updated);
                            }}
                            placeholder="مثال: یادآوری ارسال محصول"
                            className="w-full px-3 py-1.5 bg-card border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary-default text-text-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-text-muted mb-1">کد پترن ملی‌پیامک:</label>
                          <input
                            type="text"
                            value={pattern.patternCode}
                            onChange={(e) => {
                              const updated = [...customSmsPatterns];
                              updated[index].patternCode = e.target.value;
                              setCustomSmsPatterns(updated);
                            }}
                            placeholder="مثال: 12345"
                            className="w-full px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-mono text-left outline-none focus:ring-1 focus:ring-primary-default text-text-primary"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-semibold text-text-muted mb-1">نقش هدف:</label>
                          <select
                            value={pattern.role}
                            onChange={(e) => {
                              const updated = [...customSmsPatterns];
                              updated[index].role = e.target.value;
                              setCustomSmsPatterns(updated);
                            }}
                            className="w-full px-3 py-1.5 bg-card border border-border rounded-lg text-xs outline-none focus:ring-1 focus:ring-primary-default text-text-primary"
                          >
                            <option value="all">همه کاربران</option>
                            <option value="supplier">تامین‌کنندگان</option>
                            <option value="customer">خریداران</option>
                            <option value="admin">مدیران</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-text-muted mb-1">بازه زمانی یادآوری (ساعت):</label>
                          <div className="flex items-center space-x-2 space-x-reverse">
                            <input
                              type="number"
                              min="0"
                              value={pattern.frequencyHours}
                              onChange={(e) => {
                                const updated = [...customSmsPatterns];
                                updated[index].frequencyHours = Number(e.target.value) || 0;
                                setCustomSmsPatterns(updated);
                              }}
                              className="w-20 px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-mono text-center outline-none focus:ring-1 focus:ring-primary-default text-text-primary"
                            />
                            <span className="text-[10px] text-text-secondary">۰ = بدون تکرار (یک‌بار)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 sm:gap-4 w-full sm:w-auto">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={pattern.isActive}
                          onChange={(e) => {
                            const updated = [...customSmsPatterns];
                            updated[index].isActive = e.target.checked;
                            setCustomSmsPatterns(updated);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-default"></div>
                        <span className="mr-2 text-[10px] font-semibold text-text-secondary">فعال</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...customSmsPatterns];
                          updated.splice(index, 1);
                          setCustomSmsPatterns(updated);
                        }}
                        className="text-red-500 hover:text-red-600 text-[10px] font-bold bg-red-500/10 px-2 py-1 rounded-md"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}`;

const finalReplacement = customPatternsSection.replace('{customPatternsSectionContent}', customPatternsSectionContentStr);

content = content.replace(targetStr, finalReplacement + '\n' + targetStr);
fs.writeFileSync('src/components/superadmin/PaymentSmsSettings.tsx', content);
