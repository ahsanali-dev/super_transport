import { NextResponse } from "next/server";
import { sendInquiryEmail } from "@/app/utils/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.phone || !body.email || !body.message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const emailResult = await sendInquiryEmail({
      name: body.name,
      phone: body.phone,
      email: body.email,
      method: body.method || "phone",
      message: body.message,
    });

    if (emailResult.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: emailResult.error || "Failed to send email" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("API quick inquiry submit failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
