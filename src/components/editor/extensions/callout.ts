/**
 * Tiptap node: callout block with a `type` attr.
 * Renders as `<div data-callout="info|note|warning|danger|tip">…</div>` so the
 * frontend can style it via CSS. Editable block with paragraph content inside.
 *
 * Adds a chainable command:
 *   editor.chain().focus().setCallout('warning').run()
 */
import { mergeAttributes, Node } from "@tiptap/core";

export type CalloutType = "info" | "note" | "warning" | "danger" | "tip";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (type: CalloutType) => ReturnType;
      toggleCallout: (type: CalloutType) => ReturnType;
      unsetCallout: () => ReturnType;
    };
  }
}

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,
  isolating: false,

  addAttributes() {
    return {
      type: {
        default: "note" as CalloutType,
        parseHTML: (el) => (el.getAttribute("data-callout") ?? "note") as CalloutType,
        renderHTML: (attrs) => {
          if (!attrs.type) return {};
          return { "data-callout": attrs.type };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-callout]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { class: "callout" }), 0];
  },

  addCommands() {
    return {
      setCallout:
        (type) =>
        ({ commands }) =>
          commands.wrapIn(this.name, { type }),
      toggleCallout:
        (type) =>
        ({ commands }) =>
          commands.toggleWrap(this.name, { type }),
      unsetCallout:
        () =>
        ({ commands }) =>
          commands.lift(this.name),
    };
  },
});
