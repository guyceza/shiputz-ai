"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

/**
 * Credit balance badge for navbar. Shows current credit count.
 * Fetches from /api/credits on mount. Only renders if user is logged in.
 */
export default function CreditBadge() {
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (!userData) return;
      const user = JSON.parse(userData);
      if (!user.email) return;

      fetch(`/api/credits?email=${encodeURIComponent(user.email)}`)
        .then((r) => r.json())
        .then((d) => {
          if (typeof d.credits === "number") setCredits(d.credits);
        })
        .catch(() => {});
    } catch {}
  }, []);

  if (credits === null) return null;

  return (
    <Link
      href="/pricing"
      className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full font-medium hover:bg-emerald-100 transition-colors"
      title="קרדיטים זמינים"
    >
      {credits} קרדיטים
    </Link>
  );
}
