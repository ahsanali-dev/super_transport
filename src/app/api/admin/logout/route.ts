import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("admin_token");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout API failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
