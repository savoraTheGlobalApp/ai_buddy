import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to logout" },
      { status: 500 }
    );
  }
}

