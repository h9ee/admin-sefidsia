/**
 * Persian text utilities — digit normalization, ZWNJ helpers, common Arabic→Persian
 * character mapping, and a couple of light typography fixes.
 */

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EN_DIGITS = "0123456789";

const AR_TO_FA_CHARS: Record<string, string> = {
  "ي": "ی",
  "ك": "ک",
  // Arabic Tatweel: collapse, prevents stretching artifacts when copied from PDFs.
  "ـ": "",
};

/** Replace Arabic-Indic and European digits with Persian digits. */
export function toPersianDigits(input: string): string {
  let out = "";
  for (const ch of input) {
    const en = EN_DIGITS.indexOf(ch);
    if (en !== -1) {
      out += FA_DIGITS[en];
      continue;
    }
    const ar = AR_DIGITS.indexOf(ch);
    if (ar !== -1) {
      out += FA_DIGITS[ar];
      continue;
    }
    out += ch;
  }
  return out;
}

/** Replace Arabic-only letters with their Persian counterparts. */
export function normalizeArabicLetters(input: string): string {
  let out = "";
  for (const ch of input) {
    out += AR_TO_FA_CHARS[ch] ?? ch;
  }
  return out;
}

/** Insert ZWNJ in common Persian word boundaries that authors usually forget. */
export function applyZwnj(input: string): string {
  return input
    // می + verb → می‌verb (می + space + بینم → می‌بینم)
    .replace(/\bمی\s+(\S)/g, "می‌$1")
    // نمی + verb
    .replace(/\bنمی\s+(\S)/g, "نمی‌$1")
    // word + ه + ای / ها  →  word + ZWNJ + ها
    .replace(/([؀-ۿ])\s+(ها|های|تر|ترین|ام|ای|اید|اند|ایم)\b/g, "$1‌$2");
}

/**
 * Full-pipeline Persian text normalization that's safe to run on author input.
 * Order matters: letters first, then digits, then ZWNJ, then collapse
 * duplicated whitespace/extra ZWNJ.
 */
export function normalizePersian(input: string): string {
  let s = normalizeArabicLetters(input);
  s = toPersianDigits(s);
  s = applyZwnj(s);
  // Collapse runs of ZWNJ
  s = s.replace(/‌{2,}/g, "‌");
  return s;
}
