"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const nav = [
  { href: "/dashboard/page1", label: "Overview" },
  { href: "/dashboard/page2", label: "Analysis & Funnel" },
  { href: "/dashboard/page3", label: "Channels" },
  { href: "/dashboard/page4", label: "Content Mix" },
  { href: "/dashboard/page5", label: "Explorer" },
  { href: "/dashboard/page6", label: "KPI" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-lg">
        <div className="flex items-center justify-between gap-3 px-5 py-3 min-h-12 flex-wrap">
          <Link
            href="/dashboard/page1"
            className="flex items-center gap-2 shrink-0"
          >
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">F</span>
            </div>
            <span className="text-sm font-bold text-gray-900 tracking-tight hidden sm:inline">
              FRAMMER AI
            </span>
          </Link>

          <nav className="flex gap-0.5 overflow-x-auto scrollbar-none flex-1 min-w-0 justify-center sm:justify-start">
            {nav.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  title={href === "/dashboard/page6" ? "KPI Builder" : undefined}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-red-500 text-white shadow-sm shadow-red-200"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button className="hidden sm:flex text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-red-300 transition-colors items-center gap-1.5">
              <svg
                className="h-3.5 w-3.5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Jan – Mar 2025
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-medium text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
