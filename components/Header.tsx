"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Browse" },
    { href: "/submit", label: "Submit Dua" },
    { href: "/my-list", label: "My List" },
  ];

  return (
    <header className="sticky top-0 z-50 glass-bar">
      <nav className="w-full px-6 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="DuaMaker"
            width={36}
            height={36}
            className="rounded-lg object-contain"
          />
          <span className="font-bold text-slate-100">DuaMaker</span>
        </Link>
        <div className="flex items-center gap-1">
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
        </div>
      </nav>
    </header>
  );
}
