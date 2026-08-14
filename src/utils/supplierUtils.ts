export function getSupplierZopitName(supplier: any): string {
  if (!supplier) return "تامین‌کننده زوپیت";
  const idStr = supplier.id ? `${supplier.id}` : "";
  const usernamePart = supplier.username || "";
  return `تامین‌کننده زوپیت ${idStr}${usernamePart ? ` (@${usernamePart})` : ''}`;
}

export function getSupplierFullAddress(supplier: any): string {
  if (!supplier) return "موقعیت تعیین نشده است";
  const parts = [];
  if (supplier.province) parts.push(`استان ${supplier.province}`);
  if (supplier.city) parts.push(`شهر ${supplier.city}`);
  return parts.length > 0 ? parts.join(" - ") : "موقعیت ثبت نشده است";
}
