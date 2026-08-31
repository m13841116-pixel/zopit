const fs = require('fs');
let content = fs.readFileSync('src/components/supplier/SupplierDashboard.tsx', 'utf8');

// Add selectedOrderIds state
content = content.replace(
  'const [changingOrder, setChangingOrder] = useState<any | null>(null);',
  'const [changingOrder, setChangingOrder] = useState<any | null>(null);\n  const [selectedOrderIds, setSelectedOrderIds] = useState<number[]>([]);\n  const [isBulkShipping, setIsBulkShipping] = useState(false);'
);

// Add bulk ship function
const bulkShipFunction = `
  const handleBulkShip = async () => {
    if (selectedOrderIds.length === 0) return;
    setIsBulkShipping(true);
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch("/api/supplier/orders/approve-batch", {
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
        toast.error("خطا در تایید گروهی سفارشات.");
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

fs.writeFileSync('src/components/supplier/SupplierDashboard.tsx', content);
