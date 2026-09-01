/**
 * Utility functions for digit normalization and number formatting.
 * Ensures Persian and Arabic digits typed by users are automatically converted to standard English digits.
 */

export function toEnglishDigits(str: string | number | null | undefined): string {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/[۰٠]/g, '0')
    .replace(/[۱١]/g, '1')
    .replace(/[۲٢]/g, '2')
    .replace(/[۳٣]/g, '3')
    .replace(/[۴٤]/g, '4')
    .replace(/[۵٥]/g, '5')
    .replace(/[۶٦]/g, '6')
    .replace(/[۷٧]/g, '7')
    .replace(/[۸٨]/g, '8')
    .replace(/[۹٩]/g, '9');
}

/**
 * Returns a clean string containing only digits (0-9) converted from Persian/Arabic/English input.
 */
export function extractDigits(str: string | number | null | undefined): string {
  const normalized = toEnglishDigits(str);
  return normalized.replace(/\D/g, '');
}

/**
 * Format a number with standard comma separation (e.g. 100,000) using English digits.
 */
export function formatEnglishNumber(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '0';
  const num = typeof val === 'number' ? val : parseFloat(toEnglishDigits(val));
  if (isNaN(num)) return '0';
  return num.toLocaleString('en-US');
}
