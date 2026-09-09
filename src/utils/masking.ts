/**
 * Financial & Personal Data Masking Utilities for Zopit Platform
 */

/**
 * Masks a Persian IBAN (Shaba) number for security and privacy.
 * Example: "IR120000000000000000001234" -> "IR**-****-****-****-****-1234"
 */
export function maskShaba(shaba?: string | null): string {
  if (!shaba) return "ثبت نشده";
  const clean = shaba.trim().replace(/\s+/g, "").toUpperCase();
  if (clean.length < 8) return "****";

  const prefix = clean.startsWith("IR") ? "IR" : clean.slice(0, 2);
  const suffix = clean.slice(-4);
  return `${prefix}**-****-****-****-****-${suffix}`;
}

/**
 * Masks a 16-digit bank card number.
 * Example: "6037991234567890" -> "6037-****-****-7890"
 */
export function maskCard(cardNumber?: string | null): string {
  if (!cardNumber) return "ثبت نشده";
  const clean = cardNumber.trim().replace(/[-\s]+/g, "");
  if (clean.length < 8) return "****";

  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-4);
  return `${prefix}-****-****-${suffix}`;
}

/**
 * Masks a mobile phone number.
 * Example: "09121234567" -> "0912***4567"
 */
export function maskMobile(mobile?: string | null): string {
  if (!mobile) return "ثبت نشده";
  const clean = mobile.trim();
  if (clean.length < 8) return "****";

  const prefix = clean.slice(0, 4);
  const suffix = clean.slice(-4);
  return `${prefix}***${suffix}`;
}
