import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "driver-documents";
// Signed URL expires in 1 hour (3600 seconds)
const SIGNED_URL_EXPIRY = 3600;

export async function POST(request: Request) {
  // Only authenticated admins can generate signed URLs
  const cookieStore = await cookies();
  const adminSession = cookieStore.get("admin_session");
  if (!adminSession || adminSession.value !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filePath } = await request.json();

    if (!filePath || typeof filePath !== "string") {
      return NextResponse.json({ error: "filePath is required" }, { status: 400 });
    }

    // Generate a temporary signed URL — valid for 1 hour only
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(filePath, SIGNED_URL_EXPIRY);

    if (error || !data?.signedUrl) {
      console.error("Signed URL generation failed:", error?.message);
      return NextResponse.json({ error: "Failed to generate signed URL" }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl });
  } catch (err: any) {
    console.error("Signed URL API error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
