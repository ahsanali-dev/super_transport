import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const expectedUsername = process.env.ADMIN_USERNAME || "admin";
    const expectedPassword = process.env.ADMIN_PASSWORD || "SuperTransportAdminPassword2026!";

    if (username === expectedUsername && password === expectedPassword) {
      // Set HTTP-only session cookie
      const cookieStore = await cookies();
      cookieStore.set("admin_token", "supertransport_admin_session", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 1 day
        path: "/",
      });

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  } catch (error) {
    console.error("Login API failed:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
