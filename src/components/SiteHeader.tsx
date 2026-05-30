"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";

type SiteHeaderProps = {
  isLoggedIn?: boolean;
  authHref?: string;
  position?: "fixed" | "sticky" | "static";
};

const navItems = [
  { href: "/studio", label: "סטודיו" },
  { href: "/ai-vision", label: "AI Vision" },
  { href: "/visualize", label: "הדמיה" },
  { href: "/pricing-guide", label: "מחירון" },
  { href: "/pricing", label: "מחירים" },
  { href: "/tips", label: "מאמרים" },
];

const positionClass = {
  fixed: "fixed inset-x-0 top-0",
  sticky: "sticky top-0",
  static: "relative",
};

export default function SiteHeader({
  isLoggedIn = false,
  authHref = "/login",
  position = "fixed",
}: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const accountHref = isLoggedIn ? "/dashboard" : authHref;
  const accountLabel = isLoggedIn ? "לאזור האישי" : "התחברות";

  return (
    <header
      className={`${positionClass[position]} z-50 h-16 border-b border-slate-200/80 bg-white md:h-[76px]`}
      dir="ltr"
    >
      <div className="mx-auto grid h-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-5 sm:px-8 lg:px-10">
        <Link
          href="/"
          className="justify-self-start inline-flex items-center gap-2.5 text-slate-950"
          aria-label="ShiputzAI דף הבית"
        >
          <Image
            src="/brand/shiputzai-modern-logo-mark-transparent.png"
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 object-contain"
            priority
          />
          <span className="text-[21px] font-semibold leading-none">ShiputzAI</span>
        </Link>

        <nav
          className="hidden items-center justify-center gap-8 lg:flex xl:gap-10"
          aria-label="ניווט ראשי"
          dir="rtl"
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap text-sm font-medium text-slate-700 transition-colors hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="justify-self-end">
          <Link
            href={accountHref}
            className="hidden whitespace-nowrap text-sm font-semibold text-slate-900 transition-colors hover:text-emerald-700 lg:inline-flex"
            dir="rtl"
          >
            {accountLabel}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="inline-flex h-10 w-10 items-center justify-center text-slate-900 transition-colors hover:text-emerald-700 lg:hidden"
            aria-label={mobileOpen ? "סגור תפריט" : "פתח תפריט"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="absolute inset-x-0 top-full border-b border-slate-200 bg-white shadow-[0_18px_30px_rgba(15,23,42,0.08)] lg:hidden" dir="rtl">
          <nav className="mx-auto flex max-w-7xl flex-col px-5 py-4" aria-label="ניווט מובייל">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="border-b border-slate-100 py-3 text-sm font-medium text-slate-700 last:border-b-0 hover:text-slate-950"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={accountHref}
              onClick={() => setMobileOpen(false)}
              className="mt-2 py-3 text-sm font-semibold text-slate-950"
            >
              {accountLabel}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
