import { notFound } from "next/navigation";
import { TicketDetail } from "@/features/tickets/ticket-detail";

export const metadata = { title: "تیکت — سفید و سیاه" };

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) notFound();
  return <TicketDetail id={numeric} />;
}
