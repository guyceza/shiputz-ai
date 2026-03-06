"use client";

import Link from "next/link";

interface CreditErrorProps {
  required?: number;
  balance?: number;
}

/**
 * Reusable credit error banner. Show when API returns 402 / creditError: true.
 */
export default function CreditError({ required, balance }: CreditErrorProps) {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
      <p className="text-amber-800 font-medium mb-1">אין מספיק קרדיטים</p>
      {required !== undefined && balance !== undefined && (
        <p className="text-amber-600 text-sm mb-3">
          נדרש: {required} · יתרה: {balance}
        </p>
      )}
      <Link
        href="/pricing"
        className="inline-block bg-gray-900 text-white text-sm font-bold px-6 py-2 rounded-full hover:bg-gray-800 transition-all"
      >
        רכישת קרדיטים
      </Link>
    </div>
  );
}

/**
 * Check if an API response is a credit error. Use in fetch handlers:
 * 
 * const res = await fetch(...);
 * const data = await res.json();
 * if (isCreditError(res, data)) { setCreditErr(data); return; }
 */
export function isCreditError(res: Response, data: any): boolean {
  return res.status === 402 || data?.creditError === true;
}
