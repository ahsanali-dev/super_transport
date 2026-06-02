import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { sendApplicationEmails } from "@/app/utils/email";

const BUCKET = "driver-documents";

/**
 * Uploads a Base64 data URL to Supabase Storage (public bucket, UUID path).
 * Returns the public URL of the uploaded file, or null if nothing to upload.
 */
async function uploadBase64ToStorage(
  base64DataUrl: string | undefined | null,
  fileName: string
): Promise<string | null> {
  if (!base64DataUrl) return null;

  // Parse: "data:<mime>;base64,<data>"
  const match = base64DataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) return null;

  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");

  // Determine file extension from mime type
  const ext = mimeType.includes("pdf")
    ? "pdf"
    : mimeType.includes("png")
    ? "png"
    : mimeType.includes("webp")
    ? "webp"
    : "jpg";

  const filePath = `${fileName}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(filePath, buffer, {
      contentType: mimeType,
      upsert: true,
    });

  if (error) {
    console.error(`Storage upload failed for ${fileName}:`, error.message);
    return null;
  }

  // Return the public URL (bucket is public, paths are UUID-based so unguessable)
  const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic required field validations
    if (!body.firstName || !body.lastName || !body.email || !body.phone || !body.signatureName || !body.signatureData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate unique UUID-based prefix for this applicant's files
    // UUID = 128-bit random = practically impossible to guess
    const uuid = crypto.randomUUID();
    const nameSlug = `${body.firstName}-${body.lastName}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const folder = `${uuid}/${nameSlug}`;

    // Upload documents to Supabase Storage (in parallel for speed)
    const [docDlFrontUrl, docDlBackUrl, docMedCertUrl, signatureUrl] = await Promise.all([
      uploadBase64ToStorage(body.docDlFront,    `${folder}/dl-front`),
      uploadBase64ToStorage(body.docDlBack,     `${folder}/dl-back`),
      uploadBase64ToStorage(body.docMedCert,    `${folder}/med-cert`),
      uploadBase64ToStorage(body.signatureData, `${folder}/signature`),
    ]);

    // Save submission to database via Prisma — only URLs stored, not raw Base64
    const newApp = await prisma.driverApplication.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email,
        phone: body.phone,
        dob: body.dob,
        addressStreet: body.addressStreet,
        addressLine2: body.addressLine2 || null,
        addressCity: body.addressCity,
        addressState: body.addressState,
        addressZip: body.addressZip,
        addressDuration: body.addressDuration || null,

        prevAddressStreet: body.hasPrevAddress ? body.prevAddressStreet : null,
        prevAddressLine2:  body.hasPrevAddress ? body.prevAddressLine2  : null,
        prevAddressCity:   body.hasPrevAddress ? body.prevAddressCity   : null,
        prevAddressState:  body.hasPrevAddress ? body.prevAddressState  : null,
        prevAddressZip:    body.hasPrevAddress ? body.prevAddressZip    : null,

        cdlNumber:    body.cdlNumber,
        cdlState:     body.cdlState,
        cdlClass:     body.cdlClass,
        cdlExpiration: body.cdlExpiration || null,
        endorsements: Array.isArray(body.endorsements)
          ? body.endorsements.join(", ")
          : (body.endorsements || null),
        cdlTenYears: !!body.cdlTenYears,
        referral:    body.referral || null,

        employmentHistory: Array.isArray(body.employmentHistory)
          ? JSON.stringify(body.employmentHistory)
          : (body.employmentHistory || null),
        employmentGaps: !!body.employmentGaps,
        gapsDetail:     body.employmentGaps ? body.gapsDetail : null,

        yearsExperience:   body.yearsExperience,
        equipmentOperated: Array.isArray(body.equipmentOperated)
          ? body.equipmentOperated.join(", ")
          : (body.equipmentOperated || ""),

        hasAccidents:    !!body.hasAccidents,
        accidentsDetail: body.hasAccidents  ? body.accidentsDetail  : null,
        hasViolations:   !!body.hasViolations,
        violationsDetail: body.hasViolations ? body.violationsDetail : null,

        sapStatus: !!body.sapStatus,

        // ✅ Store Supabase public URLs (UUID-based = unguessable)
        // Falls back to original Base64 if Supabase upload fails
        docDlFront: docDlFrontUrl  || body.docDlFront  || null,
        docDlBack:  docDlBackUrl   || body.docDlBack   || null,
        docMedCert: docMedCertUrl  || body.docMedCert  || null,

        fcraConsent:          !!body.fcraConsent,
        pspConsent:           !!body.pspConsent,
        clearinghouseConsent: !!body.clearinghouseConsent,
        drugTestPositive:     !!body.drugTestPositive,
        drugTestDoc:          !!body.drugTestDoc,
        companyPolicyConsent: !!body.companyPolicyConsent,

        ssn:           body.ssn || null,
        signatureName: body.signatureName,
        // Store uploaded URL; fall back to original Base64 if upload failed
        signatureData: signatureUrl || body.signatureData,
        status: "PENDING",
      },
    });

    // Send emails in the background
    sendApplicationEmails({
      firstName:    body.firstName,
      lastName:     body.lastName,
      email:        body.email,
      phone:        body.phone,
      dob:          body.dob,
      addressStreet: body.addressStreet,
      addressLine2:  body.addressLine2,
      addressCity:   body.addressCity,
      addressState:  body.addressState,
      addressZip:    body.addressZip,
      addressDuration: body.addressDuration,

      prevAddressStreet: body.hasPrevAddress ? body.prevAddressStreet : undefined,
      prevAddressLine2:  body.hasPrevAddress ? body.prevAddressLine2  : undefined,
      prevAddressCity:   body.hasPrevAddress ? body.prevAddressCity   : undefined,
      prevAddressState:  body.hasPrevAddress ? body.prevAddressState  : undefined,
      prevAddressZip:    body.hasPrevAddress ? body.prevAddressZip    : undefined,

      cdlNumber:    body.cdlNumber,
      cdlState:     body.cdlState,
      cdlClass:     body.cdlClass,
      cdlExpiration: body.cdlExpiration,
      endorsements:  Array.isArray(body.endorsements) ? body.endorsements : [],
      cdlTenYears:  !!body.cdlTenYears,
      referral:     body.referral,

      employmentHistory: Array.isArray(body.employmentHistory) ? body.employmentHistory : [],
      employmentGaps:    !!body.employmentGaps,
      gapsDetail:        body.gapsDetail,

      yearsExperience:   body.yearsExperience,
      equipmentOperated: Array.isArray(body.equipmentOperated) ? body.equipmentOperated : [],

      hasAccidents:     !!body.hasAccidents,
      accidentsDetail:   body.accidentsDetail,
      hasViolations:    !!body.hasViolations,
      violationsDetail:  body.violationsDetail,

      sapStatus: !!body.sapStatus,

      docDlFrontUploaded:  !!docDlFrontUrl,
      docDlBackUploaded:   !!docDlBackUrl,
      docMedCertUploaded:  !!docMedCertUrl,

      fcraConsent:          !!body.fcraConsent,
      pspConsent:           !!body.pspConsent,
      clearinghouseConsent: !!body.clearinghouseConsent,
      drugTestPositive:     !!body.drugTestPositive,
      drugTestDoc:          !!body.drugTestDoc,
      companyPolicyConsent: !!body.companyPolicyConsent,

      ssnMasked:     body.ssn ? `***-**-${body.ssn.slice(-4)}` : undefined,
      signatureName: body.signatureName,
      signatureData: signatureUrl || body.signatureData,
    }).catch((err) => {
      console.error("Failed to send submission notification emails asynchronously:", err);
    });

    return NextResponse.json({ success: true, id: newApp.id });
  } catch (error: any) {
    console.error("API driver application submit failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
