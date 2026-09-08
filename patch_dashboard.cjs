const fs = require('fs');
let code = fs.readFileSync('src/components/supplier/SupplierDashboard.tsx', 'utf8');

const regex = /const \[activeTab, setActiveTab\] = useUrlQueryState<TabId>\(\s*"tab",\s*"overview"\s*\);/;
const replacement = `const [activeTab, setActiveTabRaw] = useUrlQueryState<TabId>("tab", "overview");

  const hasBusinessInfo = Boolean(
    (user?.firstName && user?.lastName) &&
    user?.brandName &&
    user?.activityType &&
    user?.activityType.length > 2
  );

  const hasAddressInfo = Boolean(
    user?.province &&
    user?.city &&
    user?.originAddress && user.originAddress.trim().length >= 10 &&
    user?.postalCode && user.postalCode.trim().length >= 10
  );

  const hasBankInfo = Boolean(
    (user?.shaba && user.shaba.replace(/\\D/g, '').length >= 24) &&
    user?.accountHolderName &&
    user?.bankName
  );

  const isFullyCompleted = hasBusinessInfo && hasAddressInfo && hasBankInfo;

  const setActiveTab = (tab: TabId) => {
    if (!isFullyCompleted && (tab === "add-product" || tab === "woocommerce-import")) {
      showNotification("لطفاً ابتدا فرآیند تکمیل حساب (اطلاعات هویتی، آدرس مبدا، اطلاعات بانکی) را تکمیل کنید.", "error");
      setActiveTabRaw("overview");
      return;
    }
    setActiveTabRaw(tab);
  };
`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/supplier/SupplierDashboard.tsx', code);
console.log('patched');
