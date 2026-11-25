import type { Metadata } from "next";
import { requireViewer } from "@/lib/auth";
import { getNotifications } from "@/lib/data/notifications";
import { NotificationList } from "@/components/notifications/notification-list";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const viewer = await requireViewer();
  const initial = await getNotifications(viewer.id);
  return (
    <div className="mx-auto max-w-xl md:pt-6">
      <h1 className="border-b border-line px-4 py-4 text-xl font-bold">Notifications</h1>
      <NotificationList initial={initial} />
    </div>
  );
}
