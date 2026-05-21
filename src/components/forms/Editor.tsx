"use client";

import dynamic from "next/dynamic";

/**
 * Client-only entry for the CKEditor 5 editor. `ssr: false` keeps CKEditor's
 * browser-only code out of the server bundle, and (per Next 16) is only allowed
 * inside a Client Component — hence the directive above.
 */
const Editor = dynamic(() => import("./EditorClient"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-input bg-card text-sm text-muted-foreground">
      در حال بارگذاری ویرایشگر…
    </div>
  ),
});

export default Editor;
