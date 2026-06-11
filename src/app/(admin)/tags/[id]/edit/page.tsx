"use client";

import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TagForm } from "@/features/tags/tag-form";
import { tagsService } from "@/services/tags.service";
import { parseApiError } from "@/lib/api-error";
import type { Tag } from "@/types";

export default function EditTagPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tag, setTag] = useState<Tag | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    tagsService
      .get(id)
      .then((t) => {
        if (cancelled) return;
        setTag(t);
        setError(null);
      })
      .catch((e) => {
        if (cancelled) return;
        const msg = parseApiError(e).message;
        setError(msg);
        toast.error(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <>
      <PageHeader
        title={tag ? `ویرایش: ${tag.name}` : "ویرایش برچسب"}
        description="ویرایش اطلاعات برچسب، URL عمومی و سئو."
      />

      {loading ? (
        <Card>
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      ) : tag ? (
        <TagForm editing={tag} />
      ) : null}
    </>
  );
}
