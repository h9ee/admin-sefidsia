"use client";

import { Award, Star, Trophy, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";

const sampleBadges = [
  { id: "1", name: "ستاره روز", description: "بیشترین فعالیت در ۲۴ ساعت گذشته", icon: Star, count: 0 },
  { id: "2", name: "پزشک منتخب", description: "بیش از ۵۰ پاسخ تایید شده", icon: Trophy, count: 0 },
  { id: "3", name: "محبوب مقاله‌ها", description: "بازدید بالای ۱۰هزار", icon: TrendingUp, count: 0 },
];

export default function GamificationPage() {
  return (
    <>
      <PageHeader
        title="گیمیفیکیشن"
        description="مدیریت نشان‌ها، امتیازها و رویدادهای انگیزشی پلتفرم."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="کل امتیازات" value={0} icon={Star} />
        <StatCard label="نشان‌های فعال" value={sampleBadges.length} icon={Award} />
        <StatCard label="چالش‌های جاری" value={0} icon={Trophy} />
        <StatCard label="کاربران فعال" value={0} icon={TrendingUp} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>نشان‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sampleBadges.map((b) => (
              <div
                key={b.id}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted">
                  <b.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{b.name}</p>
                    <Badge variant="muted">پیشنهادی</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>رویدادهای جاری</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="رویدادی فعال نیست"
            description="در حال حاضر هیچ رویداد یا چالشی فعال نیست."
            className="border-0 p-0"
          />
        </CardContent>
      </Card>
    </>
  );
}
