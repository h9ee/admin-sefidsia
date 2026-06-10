"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { answersService, type AnswersQuery } from "@/services/questions.service";
import { parseApiError } from "@/lib/api-error";
import type { Answer } from "@/types";

/**
 * Stream all rows matching the inspector's current filters into a CSV.
 * The backend caps `limit` at 100, so we page through until we hit the
 * end or the hard ceiling of 10k rows — enough for monthly audits without
 * letting a misclick exfiltrate the entire DB into the browser.
 */
const HARD_MAX_ROWS = 10_000;
const PAGE_SIZE = 100;

const COLUMNS: { key: keyof Answer | "questionTitle" | "author"; label: string }[] = [
  { key: "id", label: "id" },
  { key: "createdAt", label: "createdAt" },
  { key: "status", label: "status" },
  { key: "isDoctorAnswer", label: "isDoctorAnswer" },
  { key: "isAccepted", label: "isAccepted" },
  { key: "voteScore", label: "voteScore" },
  { key: "commentCount", label: "commentCount" },
  { key: "openReportCount", label: "openReportCount" },
  { key: "author", label: "authorUsername" },
  { key: "questionTitle", label: "questionTitle" },
  { key: "body", label: "body" },
];

export function ExportCsvButton({ filters }: { filters: AnswersQuery }) {
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const rows: Answer[] = [];
      let page = 1;
      // Paging stops on: empty page, fewer-than-PAGE_SIZE returned, or hard cap.
      while (rows.length < HARD_MAX_ROWS) {
        const res = await answersService.list({
          ...filters,
          page,
          limit: PAGE_SIZE,
        });
        rows.push(...res.data);
        if (res.data.length < PAGE_SIZE) break;
        if (page >= res.meta.totalPages) break;
        page++;
      }
      downloadCsv(rows);
      toast.success(`دانلود ${rows.length} ردیف آغاز شد.`);
    } catch (e) {
      toast.error(parseApiError(e).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={run}
      disabled={busy}
      title="خروجی CSV فیلترهای فعلی"
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      دانلود CSV
    </Button>
  );
}

function downloadCsv(rows: Answer[]) {
  const header = COLUMNS.map((c) => c.label).join(",");
  const lines = rows.map((a) =>
    COLUMNS.map((c) => {
      if (c.key === "author") return csvEscape(a.author?.username ?? "");
      if (c.key === "questionTitle") return csvEscape(a.question?.title ?? "");
      const v = (a as unknown as Record<string, unknown>)[c.key as string];
      return csvEscape(v);
    }).join(","),
  );
  // BOM so Excel opens the UTF-8 file with Persian glyphs intact.
  const csv = "﻿" + [header, ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `answers-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer URL revocation by a tick to be safe in older Safari.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  // Strip HTML tags so the spreadsheet sees plain text bodies.
  s = s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  if (/[",\n]/.test(s)) {
    s = `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}
