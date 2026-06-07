import "./globals.css";
import Link from "next/link";


export const metadata = {
  title: "Job Tracker",
  description: "Smart internship and job tracking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="border-b">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="font-semibold">
              Job Tracker
            </Link>
            <nav className="flex flex-wrap gap-4 text-sm text-muted-foreground">
  <Link href="/">Home</Link>
  <Link href="/dashboard">Dashboard</Link>
  <Link href="/applications">Applications</Link>
  <Link href="/pipeline">Pipeline</Link>
  <Link href="/analytics">Analytics</Link>
  <Link href="/reminders">Reminders</Link>
  <Link href="/settings">Settings</Link>
  <Link href="/sign-in">Sign In</Link>
  <Link href="/sign-up">Sign Up</Link>
</nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}