import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Extract client IP, prioritizing request.ip, then headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = (request as any).ip || (forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1");

  // Clone headers and set the client IP
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-client-ip", ip);

  // Pass the modified headers to the API routes
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Apply middleware to API routes
export const config = {
  matcher: "/api/:path*",
};
