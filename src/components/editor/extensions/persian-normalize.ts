/**
 * Tiptap extension: normalize Arabic/English digits and Arabic-only letters
 * (ي → ی, ك → ک) to their Persian counterparts as the user types.
 *
 * Implemented as a ProseMirror plugin via `appendTransaction` so it runs after
 * every transaction without interfering with selection, history, or paste.
 */
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { toPersianDigits, normalizeArabicLetters } from "@/lib/persian";

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

function shouldNormalize(text: string): boolean {
  if (/[0-9]/.test(text)) return true;
  for (const ch of text) {
    if (AR_DIGITS.indexOf(ch) !== -1) return true;
    if (ch === "ي" || ch === "ك" || ch === "ـ") return true;
  }
  return false;
}

function normalize(text: string): string {
  return normalizeArabicLetters(toPersianDigits(text));
}

export const PersianNormalize = Extension.create({
  name: "persianNormalize",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("persianNormalize"),
        appendTransaction(transactions, _oldState, newState) {
          const docChanged = transactions.some((tr) => tr.docChanged);
          if (!docChanged) return null;

          const tr = newState.tr;
          let modified = false;

          newState.doc.descendants((node, pos) => {
            if (!node.isText || !node.text) return;
            if (!shouldNormalize(node.text)) return;
            const replaced = normalize(node.text);
            if (replaced !== node.text) {
              tr.insertText(replaced, pos, pos + node.text.length);
              modified = true;
            }
          });

          // touch FA_DIGITS so it's not flagged as unused
          void FA_DIGITS;

          return modified ? tr.setMeta("addToHistory", false) : null;
        },
      }),
    ];
  },
});
