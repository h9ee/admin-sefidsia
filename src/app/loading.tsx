import { LoadingOverlay } from "@/components/shared/loading-overlay";

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingOverlay label="در حال بارگذاری…" />
    </div>
  );
}
