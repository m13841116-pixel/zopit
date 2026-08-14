const fs = require('fs');
let code = fs.readFileSync('src/components/superadmin/SettlementsList.tsx', 'utf8');

const intTarget = `
  status: string;
  trackId: string | null;
  supplierMobile?: string;
  supplierEmail?: string;
`;
const intReplacement = `
  status: string;
  trackId: string | null;
  supplierMobile?: string;
  supplierEmail?: string;
  role?: string;
`;
code = code.replace(intTarget.trim(), intReplacement.trim());

const filterTarget = `
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
`;
const filterReplacement = `
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterRole, setFilterRole] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
`;
code = code.replace(filterTarget.trim(), filterReplacement.trim());

const filteredLogicTarget = `
  const filteredRequests = requests.filter(
    (req) =>
      (filterStatus === "ALL" || req.status === filterStatus) &&
      (req.supplierName.includes(searchQuery) ||
        req.iban.includes(searchQuery) ||
        (req.trackId && req.trackId.includes(searchQuery))),
  );
`;
const filteredLogicReplacement = `
  const filteredRequests = requests.filter(
    (req) =>
      (filterStatus === "ALL" || req.status === filterStatus) &&
      (filterRole === "ALL" || req.role === filterRole) &&
      (req.supplierName.includes(searchQuery) ||
        req.iban.includes(searchQuery) ||
        (req.trackId && req.trackId.includes(searchQuery))),
  );
`;
code = code.replace(filteredLogicTarget.trim(), filteredLogicReplacement.trim());

const buttonsTarget = `
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="جستجو در نام، شبا یا کد رهگیری..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-3 rounded-xl bg-surface border border-subtle focus:border-primary-default outline-none text-sm transition-all"
            />
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
`;
const buttonsReplacement = `
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
          <div className="relative w-full sm:w-96">
            <Search className="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="جستجو در نام، شبا یا کد رهگیری..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-3 rounded-xl bg-surface border border-subtle focus:border-primary-default outline-none text-sm transition-all"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
             <button
                onClick={() => setFilterRole("ALL")}
                className={\`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap \${
                  filterRole === "ALL"
                    ? "bg-primary-default text-inverse"
                    : "bg-surface text-secondary hover:bg-surface-hover border border-subtle"
                }\`}
              >
                همه نقش‌ها
              </button>
              <button
                onClick={() => setFilterRole("SUPPLIER")}
                className={\`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap \${
                  filterRole === "SUPPLIER"
                    ? "bg-primary-default text-inverse"
                    : "bg-surface text-secondary hover:bg-surface-hover border border-subtle"
                }\`}
              >
                تامین‌کنندگان
              </button>
              <button
                onClick={() => setFilterRole("STORE_MANAGER")}
                className={\`px-4 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap \${
                  filterRole === "STORE_MANAGER"
                    ? "bg-primary-default text-inverse"
                    : "bg-surface text-secondary hover:bg-surface-hover border border-subtle"
                }\`}
              >
                فروشگاه‌ها
              </button>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
`;
code = code.replace(buttonsTarget.trim(), buttonsReplacement.trim());

const renderTarget = `
                                <div className="text-sm font-bold text-primary mb-1">
                                  {req.supplierName}
                                </div>
                                <div className="text-xs text-muted flex items-center gap-2">
                                  <span>کد تامین‌کننده: {req.supplierId}</span>
                                </div>
`;
const renderReplacement = `
                                <div className="text-sm font-bold text-primary mb-1">
                                  {req.supplierName} 
                                  <span className="text-[10px] mr-2 px-2 py-0.5 rounded-full bg-surface-hover border border-subtle text-muted">
                                    {req.role === 'STORE_MANAGER' ? 'فروشگاه' : 'تامین‌کننده'}
                                  </span>
                                </div>
                                <div className="text-xs text-muted flex items-center gap-2">
                                  <span>کد کاربر: {req.supplierId}</span>
                                </div>
`;
code = code.replace(renderTarget.trim(), renderReplacement.trim());

const divTarget = `
            ))}
          </div>
        ) : (
`;
const divReplacement = `
            ))}
          </div>
          </div>
        ) : (
`;
code = code.replace(divTarget.trim(), divReplacement.trim());


fs.writeFileSync('src/components/superadmin/SettlementsList.tsx', code);
console.log('Patched UI settlements');
