const fs = require('fs');
let code = fs.readFileSync('src/components/store-manager/StoreTickets.tsx', 'utf8');

const oldSelect = `<option value="عمومی">عمومی و پیشنهادات</option>`;
const newSelect = `<option value="عمومی">عمومی و پیشنهادات</option>
                    <option value="اکانت پرو">اکانت پرو (مدارک و فعال‌سازی)</option>`;

code = code.replace(oldSelect, newSelect);
fs.writeFileSync('src/components/store-manager/StoreTickets.tsx', code);
