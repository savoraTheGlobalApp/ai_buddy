import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This middleware only protects specific routes that need authentication
// We keep it minimal to avoid interfering with ChatKit's operation

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow everything - authentication is handled at the component level
  // This prevents any middleware interference with ChatKit
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

