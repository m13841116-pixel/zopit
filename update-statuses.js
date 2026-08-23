const fs = require('fs');
let content = fs.readFileSync('src/components/superadmin/OrdersList.tsx', 'utf8');

const oldStatuses = `                  ].map((st) => (`;
const newStatuses = `                    { key: "PENDING", label: "در انتظار بررسی" },
                    { key: "SHIPPED", label: "ارسال شده" },
                    { key: "CANCELLED", label: "لغو شده" },
                  ].map((st) => (`;

if (content.includes(oldStatuses) && !content.includes('{ key: "PENDING", label: "در انتظار بررسی" }')) {
    content = content.replace(oldStatuses, newStatuses);
    fs.writeFileSync('src/components/superadmin/OrdersList.tsx', content);
    console.log("Updated statuses");
} else {
    console.log("Not found or already updated");
}
