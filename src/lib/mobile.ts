/**
 * Iranian mobile validation & normalization.
 * Accepts: 09xxxxxxxxx, +989xxxxxxxxx, 989xxxxxxxxx, with optional spaces/dashes.
 * Returns canonical form: 09xxxxxxxxx (11 digits).
 */
const IR_MOBILE = /^09\d{9}$/;

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function toAsciiDigits(input: string): string {
  let out = "";
  for (const ch of input) {
    const fa = FA_DIGITS.indexOf(ch);
    if (fa !== -1) {
      out += fa;
      continue;
    }
    const ar = AR_DIGITS.indexOf(ch);
    if (ar !== -1) {
      out += ar;
      continue;
    }
    out += ch;
  }
  return out;
}

export function normalizeMobile(raw: string): string {
  const cleaned = toAsciiDigits(raw).replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+98")) return "0" + cleaned.slice(3);
  if (cleaned.startsWith("0098")) return "0" + cleaned.slice(4);
  if (cleaned.startsWith("98") && cleaned.length === 12) return "0" + cleaned.slice(2);
  return cleaned;
}

export function isValidIranianMobile(raw: string): boolean {
  return IR_MOBILE.test(normalizeMobile(raw));
}

export function maskMobile(raw: string): string {
  const m = normalizeMobile(raw);
  if (!IR_MOBILE.test(m)) return raw;
  return `${m.slice(0, 4)}***${m.slice(-3)}`;
}

const FA_DIGITS_OUT = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => FA_DIGITS_OUT[Number(d)]);
}
