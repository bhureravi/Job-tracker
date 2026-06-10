import Link from "next/link";
import { ArrowRight, Bell, BarChart3, KanbanSquare } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="border-b pb-4 text-sm">
          Job Tracker
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
              Keep track of applications, reminders, and interview updates.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
              A simple app for students to manage job applications, follow-ups, and interview prep in one place.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Open Dashboard <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/applications"
                className="inline-flex items-center gap-2 border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                View Applications
              </Link>
            </div>

            <div className="mt-10 border-t pt-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <MiniItem icon={<KanbanSquare className="h-4 w-4" />} text="Pipeline" />
                <MiniItem icon={<Bell className="h-4 w-4" />} text="Reminders" />
                <MiniItem icon={<BarChart3 className="h-4 w-4" />} text="Analytics" />
              </div>
            </div>
          </div>

          <div className="border p-5">
            <h2 className="text-base font-semibold">What the app does</h2>

            <div className="mt-5 space-y-4">
              <PlainItem
                title="Applications"
                description="Add and edit company, role, deadline, and notes."
              />
              <PlainItem
                title="Pipeline"
                description="Move applications through Applied, OA, Interview, Offer, and Rejected."
              />
              <PlainItem
                title="Reminders"
                description="Set deadline and follow-up reminders, with WhatsApp support."
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function MiniItem({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 border px-3 py-2 text-sm">
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function PlainItem({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="border-b pb-3 last:border-b-0 last:pb-0">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}