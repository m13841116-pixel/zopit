const fs = require('fs');
let content = fs.readFileSync('src/components/superadmin/PaymentSmsSettings.tsx', 'utf8');

const target = `<label className="block text-[10px] font-semibold text-text-muted">کد پترن تعهد تامین‌کننده (اختیاری):</label>
                <input
                  type="text"
                  value={melliPatternSupplierCommit}
                  onChange={(e) => setMelliPatternSupplierCommit(e.target.value)}
                  placeholder="مثال: 67890 (کد الگو تعهد)"
                  className="w-full px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-mono text-left outline-none focus:ring-1 focus:ring-primary-default text-text-primary"
                />`;

const replacement = `<div>
                  <label className="block text-[10px] font-semibold text-text-muted mb-1">کد پترن تعهد تامین‌کننده (اختیاری):</label>
                  <input
                    type="text"
                    value={melliPatternSupplierCommit}
                    onChange={(e) => setMelliPatternSupplierCommit(e.target.value)}
                    placeholder="مثال: 67890 (کد الگو تعهد)"
                    className="w-full px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-mono text-left outline-none focus:ring-1 focus:ring-primary-default text-text-primary"
                  />
                </div>
                <div className="pt-2">
                  <label className="block text-[10px] font-semibold text-text-muted mb-1">بازه زمانی یادآوری (ساعت):</label>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <input
                      type="number"
                      min="1"
                      max="72"
                      value={supplierReminderHours}
                      onChange={(e) => setSupplierReminderHours(Number(e.target.value) || 6)}
                      className="w-20 px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-mono text-center outline-none focus:ring-1 focus:ring-primary-default text-text-primary"
                    />
                    <span className="text-[10px] text-text-secondary">ساعت (مثال: ۶ ساعت یکبار)</span>
                  </div>
                </div>`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/superadmin/PaymentSmsSettings.tsx', content);
