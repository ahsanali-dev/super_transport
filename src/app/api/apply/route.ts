import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendApplicationEmails } from "@/app/utils/email";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Basic required field validations
    if (!body.firstName || !body.lastName || !body.email || !body.phone || !body.signatureName || !body.signatureData) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Save submission to database via Prisma
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
        prevAddressLine2: body.hasPrevAddress ? body.prevAddressLine2 : null,
        prevAddressCity: body.hasPrevAddress ? body.prevAddressCity : null,
        prevAddressState: body.hasPrevAddress ? body.prevAddressState : null,
        prevAddressZip: body.hasPrevAddress ? body.prevAddressZip : null,
        
        cdlNumber: body.cdlNumber,
        cdlState: body.cdlState,
        cdlClass: body.cdlClass,
        cdlExpiration: body.cdlExpiration || null,
        endorsements: Array.isArray(body.endorsements) 
          ? body.endorsements.join(", ") 
          : (body.endorsements || null),
        cdlTenYears: !!body.cdlTenYears,
        referral: body.referral || null,
        
        employmentHistory: Array.isArray(body.employmentHistory)
          ? JSON.stringify(body.employmentHistory)
          : (body.employmentHistory || null),
        employmentGaps: !!body.employmentGaps,
        gapsDetail: body.employmentGaps ? body.gapsDetail : null,
        
        yearsExperience: body.yearsExperience,
        equipmentOperated: Array.isArray(body.equipmentOperated) 
          ? body.equipmentOperated.join(", ") 
          : (body.equipmentOperated || ""),
        
        hasAccidents: !!body.hasAccidents,
        accidentsDetail: body.hasAccidents ? body.accidentsDetail : null,
        hasViolations: !!body.hasViolations,
        violationsDetail: body.hasViolations ? body.violationsDetail : null,
        
        sapStatus: !!body.sapStatus,
        
        docDlFront: body.docDlFront || null,
        docDlBack: body.docDlBack || null,
        docMedCert: body.docMedCert || null,
        
        fcraConsent: !!body.fcraConsent,
        pspConsent: !!body.pspConsent,
        clearinghouseConsent: !!body.clearinghouseConsent,
        drugTestPositive: !!body.drugTestPositive,
        drugTestDoc: !!body.drugTestDoc,
        companyPolicyConsent: !!body.companyPolicyConsent,
        
        ssn: body.ssn || null,
        signatureName: body.signatureName,
        signatureData: body.signatureData,
        status: "PENDING"
      }
    });

    // Send emails in the background with updated data representation
    sendApplicationEmails({
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      dob: body.dob,
      addressStreet: body.addressStreet,
      addressLine2: body.addressLine2,
      addressCity: body.addressCity,
      addressState: body.addressState,
      addressZip: body.addressZip,
      addressDuration: body.addressDuration,
      
      prevAddressStreet: body.hasPrevAddress ? body.prevAddressStreet : undefined,
      prevAddressLine2: body.hasPrevAddress ? body.prevAddressLine2 : undefined,
      prevAddressCity: body.hasPrevAddress ? body.prevAddressCity : undefined,
      prevAddressState: body.hasPrevAddress ? body.prevAddressState : undefined,
      prevAddressZip: body.hasPrevAddress ? body.prevAddressZip : undefined,
      
      cdlNumber: body.cdlNumber,
      cdlState: body.cdlState,
      cdlClass: body.cdlClass,
      cdlExpiration: body.cdlExpiration,
      endorsements: Array.isArray(body.endorsements) ? body.endorsements : [],
      cdlTenYears: !!body.cdlTenYears,
      referral: body.referral,
      
      employmentHistory: Array.isArray(body.employmentHistory) ? body.employmentHistory : [],
      employmentGaps: !!body.employmentGaps,
      gapsDetail: body.gapsDetail,
      
      yearsExperience: body.yearsExperience,
      equipmentOperated: Array.isArray(body.equipmentOperated) ? body.equipmentOperated : [],
      
      hasAccidents: !!body.hasAccidents,
      accidentsDetail: body.accidentsDetail,
      hasViolations: !!body.hasViolations,
      violationsDetail: body.violationsDetail,
      
      sapStatus: !!body.sapStatus,
      
      docDlFrontUploaded: !!body.docDlFront,
      docDlBackUploaded: !!body.docDlBack,
      docMedCertUploaded: !!body.docMedCert,
      
      fcraConsent: !!body.fcraConsent,
      pspConsent: !!body.pspConsent,
      clearinghouseConsent: !!body.clearinghouseConsent,
      drugTestPositive: !!body.drugTestPositive,
      drugTestDoc: !!body.drugTestDoc,
      companyPolicyConsent: !!body.companyPolicyConsent,
      
      ssnMasked: body.ssn ? `***-**-${body.ssn.slice(-4)}` : undefined,
      signatureName: body.signatureName,
      signatureData: body.signatureData,
    }).catch(err => {
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
