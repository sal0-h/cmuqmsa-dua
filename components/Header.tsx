"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Browse" },
    { href: "/submit", label: "Submit Dua" },
    { href: "/my-list", label: "My List" },
  ];

  return (
    <header className="sticky top-0 z-50 glass-bar safe-area-inset-top">
      <nav className="w-full px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <Image
            src="/logo.png"
            alt="DuaMaker"
            width={36}
            height={36}
            className="rounded-lg object-contain shrink-0"
          />
          <span className="font-bold text-slate-100 truncate">DuaMaker</span>
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-cmu-red/20 text-cmu-red"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/admin-dashboard"
            className="px-3 py-2 rounded-md text-xs text-slate-600 hover:text-slate-500 transition-colors"
            aria-label="Admin"
          >
            Admin
          </Link>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>
      {menuOpen && (
        <div className="md:hidden border-t border-slate-700/50 bg-slate-900/98 backdrop-blur-sm">
          <div className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`px-4 py-3 rounded-lg text-base font-medium transition-colors touch-manipulation ${
                  pathname === href
                    ? "bg-cmu-red/20 text-cmu-red"
                    : "text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                {label}
              </Link>
            ))}
            <Link
              href="/admin-dashboard"
              onClick={() => setMenuOpen(false)}
              className="px-4 py-3 rounded-lg text-base text-slate-500 hover:bg-slate-800/60 transition-colors touch-manipulation"
            >
              Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
