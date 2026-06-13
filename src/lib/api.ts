/**
 * Centralized API layer — all backend fetch calls live here.
 * Components call these functions; no raw fetch() in UI code.
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

function authHeaders(accessToken?: string): Record<string, string> {
  const h: Record<string, string> = {};
  if (accessToken) h["Authorization"] = `Bearer ${accessToken}`;
  return h;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export async function fetchChatHistory(
  sessionId: string,
  accessToken?: string,
) {
  const res = await fetch(
    `${BACKEND_URL}/api/chat/history?sessionId=${sessionId}`,
    {
      headers: authHeaders(accessToken),
    },
  );
  if (!res.ok) throw new Error("Failed to load history");
  return res.json();
}

// ─── Cities ──────────────────────────────────────────────────────────────────

export async function fetchCities(
  query: string,
  accessToken?: string,
): Promise<{ name: string; aliases: string[] }[]> {
  const res = await fetch(
    `${BACKEND_URL}/api/chat/cities?query=${encodeURIComponent(query)}&limit=20`,
    { headers: authHeaders(accessToken) },
  );
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export async function submitQuickOrder(body: unknown, accessToken?: string) {
  const res = await fetch(`${BACKEND_URL}/api/chat/quick-order`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(accessToken),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok)
    throw new Error(data?.error || "Order failed. Please try again.");
  return data;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function googleLoginSync(
  idToken: string,
  user: { name?: string | null; email?: string | null },
) {
  const res = await fetch(`${BACKEND_URL}/api/auth/google-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken, name: user.name, email: user.email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Google login sync failed");
  return data;
}

export async function emailLoginSync(email: string, password: string) {
  const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Login failed");
  return data;
}

// ─── User ────────────────────────────────────────────────────────────────────

export async function deactivateAccount(accessToken?: string) {
  const res = await fetch(`${BACKEND_URL}/api/user/deactivate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(accessToken),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "Failed to deactivate account");
  return data;
}
