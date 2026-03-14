import Link from "next/link";

const nav = [
  { href: "/dashboard/page1", label: "Page 1" },
  { href: "/dashboard/page2", label: "Page 2" },
  { href: "/dashboard/page3", label: "Page 3" },
  { href: "/dashboard/page4", label: "Page 4" },
  { href: "/dashboard/page5", label: "Page 5" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link
            href="/dashboard/page1"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
          >
            Analytics Dashboard
          </Link>
          <nav className="flex gap-2">
            {nav.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
