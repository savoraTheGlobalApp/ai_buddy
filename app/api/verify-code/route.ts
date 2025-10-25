import { NextRequest, NextResponse } from "next/server";
import { getFirestoreDB } from "@/lib/firebase-admin";
import { setSessionCookie } from "@/lib/auth";

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= MAX_ATTEMPTS) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Check rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many attempts. Please try again later.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid code format" },
        { status: 400 }
      );
    }

    // Trim and normalize the code
    const normalizedCode = code.trim();

    if (normalizedCode.length === 0) {
      return NextResponse.json(
        { success: false, error: "Code cannot be empty" },
        { status: 400 }
      );
    }

    // Initialize Firestore
    const db = getFirestoreDB();

    // Query Firestore for the security code
    const codesRef = db.collection("security_codes");
    const querySnapshot = await codesRef
      .where("code", "==", normalizedCode)
      .where("active", "==", true)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return NextResponse.json(
        { success: false, error: "Invalid security code" },
        { status: 401 }
      );
    }

    const doc = querySnapshot.docs[0];
    const docData = doc.data();

    // Check if code has expiration date
    if (docData.expiresAt) {
      const expirationDate = docData.expiresAt.toDate();
      if (expirationDate < new Date()) {
        return NextResponse.json(
          { success: false, error: "Security code has expired" },
          { status: 401 }
        );
      }
    }

    // Update last used timestamp
    await doc.ref.update({
      lastUsedAt: new Date(),
      usageCount: (docData.usageCount || 0) + 1,
    });

    // Create session
    await setSessionCookie(doc.id);

    // Clear rate limit for this IP on successful authentication
    rateLimitMap.delete(ip);

    return NextResponse.json({
      success: true,
      message: "Authentication successful",
      userName: docData.userName || "User",
    });
  } catch (error) {
    console.error("Error verifying code:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

