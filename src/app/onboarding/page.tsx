"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/start");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white" dir="rtl">
      <p className="text-sm text-gray-500">מעביר להתחלה...</p>
    </div>
  );
}
