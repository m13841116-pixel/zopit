const fs = require('fs');
let code = fs.readFileSync('src/components/superadmin/AllUsersList.tsx', 'utf8');

const regex = /آدرس کامل انبار فرستنده جهت درج روی مرسوله پستی: \{activeModalUser\.province \|\| "---\"\}، \{activeModalUser\.city \|\| "---\"\}، \{activeModalUser\.address \|\| "آدرس ثبت نشده"\} \(کد پستی: \{activeModalUser\.postalCode \|\| "---\"\}\)/m;
const replacement = `آدرس کامل انبار فرستنده جهت درج روی مرسوله پستی: {activeModalUser.province || "---"}، {activeModalUser.city || "---"}، {activeModalUser.originAddress || activeModalUser.address || "آدرس ثبت نشده"} (کد پستی: {activeModalUser.postalCode || "---"})
                      </p>
                      <p className="text-xs text-text-secondary leading-relaxed bg-surface p-3 rounded-xl border border-subtle mt-2">
                        دسته‌بندی فعالیت: {activeModalUser.activityType || "ثبت نشده"}
                        <br/>
                        تلفن ثابت: {activeModalUser.telephone || "ثبت نشده"}
                        <br/>
                        وب‌سایت: {activeModalUser.website || "ثبت نشده"}
                      `;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/superadmin/AllUsersList.tsx', code);
console.log('patched');
