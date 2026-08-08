export function getSupplierZopitName(supplier: any): string {
  if (!supplier) return "زوپیت تامین‌کننده نامشخص";
  const idStr = supplier.id ? `${supplier.id}` : "";
  const namePart = supplier.brandName || supplier.companyName || supplier.storeName || supplier.firstName || supplier.username || "";
  return `زوپیت تامین‌کننده ${idStr}${namePart ? ` (${namePart})` : ''}`;
}

export function getSupplierFullAddress(supplier: any): string {
  if (!supplier) return "آدرس انبار ثبت نشده است";
  const parts = [];
  if (supplier.province) parts.push(`استان ${supplier.province}`);
  if (supplier.city) parts.push(`شهر ${supplier.city}`);
  if (supplier.address) parts.push(supplier.address);
  if (supplier.postalCode) parts.push(`کد پستی: ${supplier.postalCode}`);
  if (supplier.mobile) parts.push(`تلفن انبار: ${supplier.mobile}`);
  return parts.length > 0 ? parts.join(" - ") : "آدرس ثبت نشده است";
}
