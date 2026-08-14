const fs = require('fs');
let code = fs.readFileSync('src/components/superadmin/ProductsList.tsx', 'utf8');

// Add to state
code = code.replace(
  /const \[pricingStatus, setPricingStatus\] = useState<"ALL" \| "PRICED" \| "UNPRICED">("ALL");/,
  'const [pricingStatus, setPricingStatus] = useState<"ALL" | "PRICED" | "UNPRICED">("ALL");\n  const [approvalStatus, setApprovalStatus] = useState<"ALL" | "PENDING">("ALL");'
);

// Add to reset filters
code = code.replace(
  /setPricingStatus\("ALL"\);/,
  'setPricingStatus("ALL");\n    setApprovalStatus("ALL");'
);

// Add to filter logic
code = code.replace(
  /if \(pricingStatus === "UNPRICED"\) \{/g,
  `if (approvalStatus === "PENDING" && p.status !== "PENDING_APPROVAL") {
        return false;
      }
      if (pricingStatus === "UNPRICED") {`
);

// Add filter to UI
const pricingFilterUI = `<div className="flex items-center gap-1.5 bg-surface px-3 py-2 rounded-xl border border-subtle text-xs">
                  <DollarSign className="w-4 h-4 text-muted" />
                  <select
                    value={pricingStatus}
                    onChange={(e) => setPricingStatus(e.target.value as any)}
                    className="bg-transparent text-primary font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">وضعیت قیمت‌گذاری (همه)</option>
                    <option value="PRICED">تعیین قیمت شده</option>
                    <option value="UNPRICED">تعیین قیمت نشده</option>
                  </select>
                </div>`;

const newFilterUI = `${pricingFilterUI}
                <div className="flex items-center gap-1.5 bg-surface px-3 py-2 rounded-xl border border-subtle text-xs">
                  <select
                    value={approvalStatus}
                    onChange={(e) => setApprovalStatus(e.target.value as any)}
                    className="bg-transparent text-primary font-bold focus:outline-none cursor-pointer"
                  >
                    <option value="ALL">وضعیت تایید (همه)</option>
                    <option value="PENDING">در انتظار تایید جدید</option>
                  </select>
                </div>`;

code = code.replace(pricingFilterUI, newFilterUI);
fs.writeFileSync('src/components/superadmin/ProductsList.tsx', code);
console.log("Patched ProductsList filters");
