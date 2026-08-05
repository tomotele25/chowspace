"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";
import { Menu, X, LogOut } from "lucide-react";

/**
 * The chrome every dashboard shares: sidebar, mobile drawer, sticky header,
 * logout, active-route highlight.
 *
 * Family layouts (Vendor/Manager/Admin/Rider) wrap this rather than repeating
 * it — putting the markup in four places would recreate the duplication this
 * exists to remove.
 *
 * Design is lifted from pages/vendors/Dashboard.jsx, which had the most
 * complete of the twenty hand-rolled sidebars.
 *
 * @param {Array}  nav       groups of { label?, items: [{ name, path, icon, badge? }] }
 * @param {string} title     header title
 * @param {string} subtitle  header subtitle
 * @param {node}   actions   header right slot — page-specific controls
 * @param {node}   identity  optional pill under the brand (e.g. vendor + store status)
 * @param {node}   banner    optional full-width strip above the content
 */
export default function DashboardShell({
  nav = [],
  title,
  subtitle,
  actions,
  identity,
  banner,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  // Derived from the route, so pages no longer carry hardcoded `active: true`
  // flags that go stale the moment a page is copied.
  const isActive = (path) => router.pathname === path;

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-20 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed z-30 inset-y-0 left-0 w-64 bg-white border-r border-gray-100 flex flex-col shadow-xl transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 md:shadow-none`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100 flex-shrink-0">
          <Link
            href="/"
            className="font-bold text-base tracking-tight text-[#AE2108]"
          >
            Chowspace
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
            aria-label="Close menu"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        {identity && (
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            {identity}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {nav.map((group, gi) => (
            <div key={group.label || gi} className="space-y-0.5">
              {group.label && (
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pb-1.5">
                  {group.label}
                </p>
              )}
              {group.items.map(({ name, path, icon: Icon, badge }) => {
                const active = isActive(path);
                return (
                  <Link
                    key={path}
                    href={path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                      ${
                        active
                          ? "bg-[#AE2108] text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                      }`}
                  >
                    <span className="flex items-center gap-3">
                      {Icon && (
                        <Icon
                          size={16}
                          className={
                            active
                              ? "text-white"
                              : "text-gray-400 group-hover:text-gray-600 transition-colors"
                          }
                        />
                      )}
                      <span>{name}</span>
                    </span>
                    {badge ? (
                      <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#AE2108] text-white text-[9px] font-bold px-1">
                        {badge > 99 ? "99+" : badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={() => signOut({ callbackUrl: "/Login" })}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-100 px-5 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="md:hidden w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition flex-shrink-0"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={18} className="text-gray-600" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-gray-900 leading-tight truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="text-[11px] text-gray-400 hidden sm:block leading-tight truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
          )}
        </header>

        {banner}

        {children}
      </main>
    </div>
  );
}
