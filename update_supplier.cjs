const fs = require('fs');
let content = fs.readFileSync('src/components/supplier/SupplierDashboard.tsx', 'utf8');

if (!content.includes('selectedOrderIds')) {
  content = content.replace(
    'const [changingOrder, setChangingOrder] = useState<any | null>(null);',
    'const [changingOrder, setChangingOrder] = useState<any | null>(null);\n  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);\n  const [isBulkShipping, setIsBulkShipping] = useState(false);'
  );
}

if (!content.includes('handleBulkShip')) {
  const bulkShipFunction = `
  const handleBulkShip = async () => {
    if (selectedOrderIds.length === 0) return;
    setIsBulkShipping(true);
    try {
      const token = localStorage.getItem("token") || "";
      // We will create a new endpoint for this or update the existing approve-batch
      const res = await fetch("/api/supplier/orders/ship-batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: \`Bearer \${token}\`,
        },
        body: JSON.stringify({ itemIds: selectedOrderIds }),
      });
      if (res.ok) {
        toast.success("وضعیت سفارشات با موفقیت به ارسال‌شده تغییر یافت و مبلغ به کیف پول شما واریز شد.");
        setSelectedOrderIds([]);
        fetchData();
      } else {
        toast.error("خطا در ثبت ارسال گروهی.");
      }
    } catch (err) {
      toast.error("خطای ارتباط با سرور");
    } finally {
      setIsBulkShipping(false);
    }
  };
`;

  content = content.replace(
    'const updateOrderStatus = async (itemId: number, newStatus: string) => {',
    bulkShipFunction + '\n\n  const updateOrderStatus = async (itemId: number, newStatus: string) => {'
  );
}

// Now replace the table headers to include a checkbox
content = content.replace(
  '<th className="pb-4 font-bold w-12 text-center">ردیف</th>',
  '<th className="pb-4 font-bold w-10 text-center"><input type="checkbox" onChange={(e) => setSelectedOrderIds(e.target.checked ? orders.filter(o => ["PAID", "PREPARING"].includes(o.status)).map(o => o.id) : [])} className="rounded border-subtle text-primary focus:ring-primary w-4 h-4 cursor-pointer" /></th><th className="pb-4 font-bold w-12 text-center">ردیف</th>'
);

// Add checkbox in the table body
content = content.replace(
  '<td className="p-4 text-center text-muted font-mono">{idx + 1}</td>',
  '<td className="p-4 text-center"><input type="checkbox" checked={selectedOrderIds.includes(order.id)} disabled={!["PAID", "PREPARING"].includes(order.status)} onChange={(e) => setSelectedOrderIds(prev => e.target.checked ? [...prev, order.id] : prev.filter(id => id !== order.id))} className="rounded border-subtle text-primary focus:ring-primary w-4 h-4 cursor-pointer" /></td><td className="p-4 text-center text-muted font-mono">{idx + 1}</td>'
);

// Replace the status update buttons
content = content.replace(
  '{["PAID", "PREPARING", "SHIPPED"].includes(order.status) ? (',
  `{["PAID", "PREPARING"].includes(order.status) && (
    <button
      onClick={() => updateOrderStatus(order.id, "SHIPPED")}
      className="group inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 text-xs font-black rounded-xl transition-all duration-300 shadow-sm shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:shadow-md cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-emerald-500"
      aria-label="تایید و ارسال"
    >
      <Truck className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
      ثبت ارسال کالا
    </button>
  )}
  {["SHIPPED"].includes(order.status) ? (`
);

content = content.replace(
  '<h3 className="text-xl md:text-2xl font-black text-primary">لیست سفارشات شما</h3>',
  `<div className="flex items-center justify-between w-full">
    <h3 className="text-xl md:text-2xl font-black text-primary">لیست سفارشات شما</h3>
    {selectedOrderIds.length > 0 && (
      <button
        onClick={handleBulkShip}
        disabled={isBulkShipping}
        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-sm font-black rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
      >
        {isBulkShipping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
        اعلام ارسال گروهی ({selectedOrderIds.length} سفارش)
      </button>
    )}
  </div>`
);


fs.writeFileSync('src/components/supplier/SupplierDashboard.tsx', content);
