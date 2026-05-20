"use client";

import { getSession } from "@/lib/auth";

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const session = await getSession();
  if (!session?.access_token) {
    throw new Error("Authentication required");
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${session.access_token}`);

  return fetch(input, {
    ...init,
    headers,
  });
}
