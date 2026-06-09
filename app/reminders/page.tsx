import NotificationCenter from "@/components/reminders/notification-center";
import RemindersManager from "@/components/reminders/reminders-manager";

export default function RemindersPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <NotificationCenter />
      <RemindersManager />
    </main>
  );
}