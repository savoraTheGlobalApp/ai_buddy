import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession();

    if (!session || !session.authenticated) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error("Error checking authentication:", error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

