import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { sendApplicationStatusEmail } from "@/app/utils/email";

// Helper to verify admin token
async function checkAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  return token?.value === "marshalltransports_admin_session";
}

export async function GET() {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await prisma.driverApplication.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, applications });
  } catch (error: any) {
    console.error("Failed to fetch applications:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!(await checkAuth())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const updatedApp = await prisma.driverApplication.update({
      where: { id },
      data: { status },
    });

    // Send approval or rejection email if status matches
    if (status === "APPROVED" || status === "REJECTED") {
      try {
        await sendApplicationStatusEmail(
          updatedApp.email,
          updatedApp.firstName,
          updatedApp.lastName,
          status
        );
      } catch (emailErr) {
        console.error("Failed to send status update email:", emailErr);
      }
    }

    return NextResponse.json({ success: true, application: updatedApp });
  } catch (error: any) {
    console.error("Failed to update application status:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
