"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const items = [
  { key: "newReports", label: "گزارش‌های جدید", description: "هر بار که یک گزارش جدید ثبت شود مطلع شوید." },
  { key: "newDoctors", label: "درخواست‌های جدید پزشکان", description: "اعلان برای ثبت‌نام پزشکان جدید." },
  { key: "dangerousContent", label: "محتوای دارای علامت", description: "اعلان برای محتوای علامت‌گذاری‌شده به‌عنوان خطرناک." },
  { key: "weeklySummary", label: "خلاصه هفتگی", description: "ارسال خلاصه عملکرد به‌صورت هفتگی." },
];

export function NotificationPrefs() {
  const [state, setState] = useState<Record<string, boolean>>({
    newReports: true,
    newDoctors: true,
    dangerousContent: true,
    weeklySummary: false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>تنظیمات اعلان‌ها</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((it) => (
          <div
            key={it.key}
            className="flex items-start justify-between gap-4 rounded-lg border border-border p-4"
          >
            <div className="space-y-0.5">
              <Label>{it.label}</Label>
              <p className="text-xs text-muted-foreground">{it.description}</p>
            </div>
            <Switch
              checked={!!state[it.key]}
              onCheckedChange={(v) => setState((s) => ({ ...s, [it.key]: v }))}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
