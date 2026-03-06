"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Legacy page — redirect to new unified checkout
export default function CheckoutVisionRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/pricing");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">מעביר לדף התשלום...</p>
    </div>
  );
}
