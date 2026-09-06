/**
 * Helper utility to export contacts as vCard (.vcf) for instant import
 * into mobile phones (Android, iOS, Google Contacts, iCloud).
 * Automatically prepends "تامین‌کننده - " to contact names as requested.
 */

export interface ContactItem {
  id?: string | number;
  name: string;
  managerName?: string | null;
  phone: string;
  additionalPhones?: string | null;
  category?: string | null;
  address?: string | null;
  notes?: string | null;
}

/**
 * Clean and normalize phone numbers into standard Iranian mobile format (09xxxxxxxxx).
 */
export function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return "";
  // Convert Persian/Arabic digits to English digits
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  
  let cleaned = rawPhone.trim();
  for (let i = 0; i < 10; i++) {
    cleaned = cleaned.replace(new RegExp(persianDigits[i], "g"), String(i));
    cleaned = cleaned.replace(new RegExp(arabicDigits[i], "g"), String(i));
  }
  
  // Strip non-digits
  cleaned = cleaned.replace(/\D/g, "");
  
  // Format to standard 09...
  if (cleaned.startsWith("989") && cleaned.length === 12) {
    cleaned = "0" + cleaned.slice(2);
  } else if (cleaned.startsWith("9") && cleaned.length === 10) {
    cleaned = "0" + cleaned;
  }
  
  return cleaned;
}

/**
 * Format phone to international +98 format for Telegram / WhatsApp deep links.
 */
export function toInternationalPhone(phone: string): string {
  const norm = normalizePhone(phone);
  if (norm.startsWith("09") && norm.length === 11) {
    return "+98" + norm.slice(1);
  }
  if (norm.startsWith("98") && norm.length === 12) {
    return "+" + norm;
  }
  return norm ? `+98${norm}` : "";
}

/**
 * Build a single vCard string compliant with vCard 3.0 specification.
 */
export function createVCardString(contact: ContactItem, prefix = "تامین‌کننده - "): string {
  const normPhone = normalizePhone(contact.phone);
  const displayName = `${prefix}${contact.name || contact.managerName || "بی‌نام"}`.trim();
  const org = "زوپیت - تامین‌کنندگان";
  const title = contact.category || "تامین‌کننده کالا";
  
  const notesParts: string[] = ["تامین‌کننده ثبت‌شده در پلتفرم زوپیت"];
  if (contact.managerName && contact.managerName !== contact.name) {
    notesParts.push(`نام مدیریت: ${contact.managerName}`);
  }
  if (contact.category) {
    notesParts.push(`حوزه فعالیت: ${contact.category}`);
  }
  if (contact.address) {
    notesParts.push(`آدرس: ${contact.address}`);
  }
  if (contact.additionalPhones) {
    notesParts.push(`شماره‌های دیگر: ${contact.additionalPhones}`);
  }
  const note = notesParts.join(" | ");

  let vcf = "BEGIN:VCARD\r\n";
  vcf += "VERSION:3.0\r\n";
  vcf += `FN;CHARSET=UTF-8:${displayName}\r\n`;
  vcf += `N;CHARSET=UTF-8:${displayName};;;;\r\n`;
  vcf += `ORG;CHARSET=UTF-8:${org}\r\n`;
  vcf += `TITLE;CHARSET=UTF-8:${title}\r\n`;
  if (normPhone) {
    vcf += `TEL;TYPE=CELL,VOICE;VALUE=uri:tel:${normPhone}\r\n`;
  }
  if (contact.additionalPhones) {
    const extraPhones = contact.additionalPhones.split(/[,;\n\s]+/).filter(Boolean);
    for (const extra of extraPhones) {
      const normExtra = normalizePhone(extra);
      if (normExtra && normExtra !== normPhone) {
        vcf += `TEL;TYPE=WORK,VOICE;VALUE=uri:tel:${normExtra}\r\n`;
      }
    }
  }
  if (contact.address) {
    vcf += `ADR;TYPE=WORK;CHARSET=UTF-8:;;${contact.address};;;;\r\n`;
  }
  vcf += `NOTE;CHARSET=UTF-8:${note}\r\n`;
  vcf += "END:VCARD\r\n";

  return vcf;
}

/**
 * Trigger download of a .vcf file for a single contact or array of contacts.
 */
export function downloadVcfContacts(contacts: ContactItem[], filename = "Zopit_Suppliers_Contacts.vcf", prefix = "تامین‌کننده - ") {
  if (!contacts || contacts.length === 0) return false;

  let fullVcf = "";
  for (const c of contacts) {
    fullVcf += createVCardString(c, prefix);
  }

  // Prepend UTF-8 BOM so mobile platforms (Android/iOS) recognize Persian characters properly
  const bom = "\uFEFF";
  const blob = new Blob([bom + fullVcf], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

/**
 * Generate Telegram link for chat.
 * When phone is known, opens Telegram chat with prefilled text.
 */
export function getTelegramLink(phone: string, prefilledText?: string): string {
  const intlPhone = toInternationalPhone(phone);
  // Telegram universal link with phone
  const cleanPhone = intlPhone.replace(/\+/g, "");
  const encodedText = prefilledText ? encodeURIComponent(prefilledText) : "";
  
  if (cleanPhone) {
    // t.me/+98... or tg://msg
    if (encodedText) {
      return `https://t.me/+${cleanPhone}?text=${encodedText}`;
    }
    return `https://t.me/+${cleanPhone}`;
  }
  return `https://t.me/share/url?url=&text=${encodedText}`;
}

/**
 * Generate Eitaa direct web/app link.
 */
export function getEitaaLink(phone: string): string {
  const norm = normalizePhone(phone);
  return `https://eitaa.com/${norm}`;
}
