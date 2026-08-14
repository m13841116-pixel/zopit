const fs = require('fs');
let code = fs.readFileSync('src/components/superadmin/SuperAdminProAccounts.tsx', 'utf8');

code = code.replace(/acc\.status === "PENDING" \? \(/, 
  `acc.status === "PENDING_PAYMENT" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold border border-blue-500/20 text-[11px]">
                              <Clock className="w-3.5 h-3.5" /> در انتظار پرداخت
                            </span>
                          ) : acc.status === "PENDING" ? (`);

code = code.replace(/<option value="PENDING">در انتظار بررسی<\/option>\n\s*<option value="REJECTED">رد شده<\/option>/,
  `<option value="PENDING">در انتظار بررسی</option>
                  <option value="PENDING_PAYMENT">در انتظار پرداخت</option>
                  <option value="REJECTED">رد شده</option>`);

fs.writeFileSync('src/components/superadmin/SuperAdminProAccounts.tsx', code);
