import nodemailer from 'nodemailer';

interface EmploymentHistoryItem {
  employer: string;
  city: string;
  state: string;
  position: string;
  startDate: string;
  endDate: string;
  reasonLeaving: string;
  isCmvr: boolean;
  isDotTest: boolean;
}

interface ApplicationMailDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  addressStreet: string;
  addressLine2?: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  addressDuration?: string;
  
  prevAddressStreet?: string;
  prevAddressLine2?: string;
  prevAddressCity?: string;
  prevAddressState?: string;
  prevAddressZip?: string;
  
  cdlNumber: string;
  cdlState: string;
  cdlClass: string;
  cdlExpiration?: string;
  endorsements: string[];
  cdlTenYears: boolean;
  referral?: string;
  
  employmentHistory: EmploymentHistoryItem[];
  employmentGaps: boolean;
  gapsDetail?: string;
  
  yearsExperience: string;
  equipmentOperated: string[];
  
  hasAccidents: boolean;
  accidentsDetail?: string;
  hasViolations: boolean;
  violationsDetail?: string;
  
  sapStatus: boolean;
  
  docDlFrontUploaded: boolean;
  docDlBackUploaded: boolean;
  docMedCertUploaded: boolean;
  
  fcraConsent: boolean;
  pspConsent: boolean;
  clearinghouseConsent: boolean;
  drugTestPositive: boolean;
  drugTestDoc: boolean;
  companyPolicyConsent: boolean;
  
  ssnMasked?: string;
  signatureName: string;
  signatureData: string; // Base64 signature image
}

export async function sendApplicationEmails(app: ApplicationMailDetails) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true';
  const from = process.env.EMAIL_FROM || 'info@marshalltransports.com';
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || 'info@marshalltransports.com';

  if (!host || !user || !pass) {
    console.warn('SMTP configuration is missing. Skipping email notifications.');
    return { success: false, error: 'SMTP config missing' };
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  const fullName = `${app.firstName} ${app.lastName}`;

  // Formatted current address
  const fullAddress = `${app.addressStreet}${app.addressLine2 ? ', ' + app.addressLine2 : ''}, ${app.addressCity}, ${app.addressState} ${app.addressZip}`;

  // Formatted employment list for email
  let employmentHtml = '';
  if (app.employmentHistory && app.employmentHistory.length > 0) {
    employmentHtml = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; color: #334155;">
        <thead>
          <tr style="background-color: #f1f5f9; text-align: left;">
            <th style="padding: 6px; border: 1px solid #cbd5e1;">Employer</th>
            <th style="padding: 6px; border: 1px solid #cbd5e1;">Position</th>
            <th style="padding: 6px; border: 1px solid #cbd5e1;">Dates</th>
            <th style="padding: 6px; border: 1px solid #cbd5e1;">FMCSR / DOT Test</th>
          </tr>
        </thead>
        <tbody>
          ${app.employmentHistory.map(job => `
            <tr>
              <td style="padding: 6px; border: 1px solid #cbd5e1;">${job.employer} (${job.city}, ${job.state})</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1;">${job.position}</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1;">${job.startDate} - ${job.endDate}</td>
              <td style="padding: 6px; border: 1px solid #cbd5e1;">${job.isCmvr ? 'Yes' : 'No'} / ${job.isDotTest ? 'Yes' : 'No'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else {
    employmentHtml = '<p style="font-size: 12px; color: #ef4444;">No employment history provided.</p>';
  }

  // 1. HTML Email for Applicant
  const applicantHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1e293b;">
      <div style="background-color: #0b0f19; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
        <h1 style="color: #d4af37; margin: 0; font-size: 24px; letter-spacing: 1px;">MARSHALL TRANSPORTS LLC</h1>
        <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Driver Onboarding</p>
      </div>
      <div style="padding: 20px;">
        <h2 style="color: #0b0f19; margin-top: 0;">Application Confirmed</h2>
        <p>Dear ${app.firstName},</p>
        <p>Thank you for submitting your driver onboarding application to partner with <strong>MARSHALL TRANSPORTS LLC</strong>.</p>
        <p>We have successfully received your CDL details, safety history, and qualification documents. Below is a summary of the details you submitted:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold; width: 45%;">Name:</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${fullName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">CDL Class / State:</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${app.cdlClass} (${app.cdlState})</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">Years of OTR Experience:</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${app.yearsExperience}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">Documents Uploaded:</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">
              DL Front: ${app.docDlFrontUploaded ? 'Loaded' : 'No'}<br/>
              DL Back: ${app.docDlBackUploaded ? 'Loaded' : 'No'}<br/>
              Medical Certificate: ${app.docMedCertUploaded ? 'Loaded' : 'No'}
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; font-weight: bold;">Status:</td>
            <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; color: #b8860b; font-weight: bold;">PENDING ONBOARDING REVIEW</td>
          </tr>
        </table>
        
        <p>Our safety manager Marc Mueller and the onboarding team will review your application, query your FMCSA Clearinghouse status, verify your MVR, and contact you in the next 24-48 business hours.</p>
        
        <p style="margin-top: 30px;">Best regards,<br/><strong>Onboarding Team</strong><br/>MARSHALL TRANSPORTS LLC</p>
      </div>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 0 0 6px 6px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
        MARSHALL TRANSPORTS LLC | 1114 Granger st union city, tn 38261 | DOT# 4172640 | MC# 1605225
      </div>
    </div>
  `;

  // 2. HTML Email for Admin
  const adminHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1e293b;">
      <div style="background-color: #c5a85c; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">NEW APPLICANT NOTIFICATION</h1>
        <p style="color: #f1f5f9; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 1px;">Marshall Transports Onboarding Portal</p>
      </div>
      <div style="padding: 20px;">
        
        <h3 style="color: #0b0f19; margin-top: 0; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px;">Personal & Contact Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; width: 35%;">Name:</td>
            <td style="padding: 6px 0;">${fullName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">SSN (Masked):</td>
            <td style="padding: 6px 0;">${app.ssnMasked || 'Not provided'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Phone:</td>
            <td style="padding: 6px 0;">${app.phone}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Email:</td>
            <td style="padding: 6px 0;">${app.email}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Date of Birth:</td>
            <td style="padding: 6px 0;">${app.dob}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Address:</td>
            <td style="padding: 6px 0;">${fullAddress} (Duration: ${app.addressDuration})</td>
          </tr>
          ${app.prevAddressStreet ? `
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">Previous Address:</td>
              <td style="padding: 6px 0;">${app.prevAddressStreet}${app.prevAddressLine2 ? ', ' + app.prevAddressLine2 : ''}, ${app.prevAddressCity}, ${app.prevAddressState} ${app.prevAddressZip}</td>
            </tr>
          ` : ''}
        </table>

        <h3 style="color: #0b0f19; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; margin-top: 20px;">License & CDL Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; width: 35%;">CDL License #:</td>
            <td style="padding: 6px 0;">${app.cdlNumber} (${app.cdlState}) - Expiration: ${app.cdlExpiration}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Class:</td>
            <td style="padding: 6px 0;">${app.cdlClass}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Endorsements:</td>
            <td style="padding: 6px 0;">${app.endorsements.join(', ') || 'None'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Other State CDL (10yr):</td>
            <td style="padding: 6px 0;">${app.cdlTenYears ? 'YES' : 'NO'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Referral:</td>
            <td style="padding: 6px 0;">${app.referral || 'N/A'}</td>
          </tr>
        </table>

        <h3 style="color: #0b0f19; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; margin-top: 20px;">10-Year Employment History</h3>
        ${employmentHtml}
        ${app.employmentGaps ? `<p style="font-size: 12px; color: #b8860b;"><strong>Employment Gaps Details:</strong> ${app.gapsDetail}</p>` : ''}

        <h3 style="color: #0b0f19; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; margin-top: 20px;">Safety History (Accidents & Citations)</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; width: 35%;">DOT Accidents (3yr):</td>
            <td style="padding: 6px 0; color: ${app.hasAccidents ? '#ef4444' : '#10b981'}; font-weight: bold;">${app.hasAccidents ? 'YES' : 'NO'}</td>
          </tr>
          ${app.hasAccidents ? `<tr><td colspan="2" style="padding: 6px; background-color: #fef2f2; border-radius: 4px; font-size: 12px; color: #334155;">${app.accidentsDetail}</td></tr>` : ''}
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Moving Violations (3yr):</td>
            <td style="padding: 6px 0; color: ${app.hasViolations ? '#ef4444' : '#10b981'}; font-weight: bold;">${app.hasViolations ? 'YES' : 'NO'}</td>
          </tr>
          ${app.hasViolations ? `<tr><td colspan="2" style="padding: 6px; background-color: #fef2f2; border-radius: 4px; font-size: 12px; color: #334155;">${app.violationsDetail}</td></tr>` : ''}
        </table>

        <h3 style="color: #0b0f19; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; margin-top: 20px;">DOT Drug & Alcohol & SAP Status</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; width: 35%;">In SAP Process:</td>
            <td style="padding: 6px 0; color: ${app.sapStatus ? '#ef4444' : '#10b981'}; font-weight: bold;">${app.sapStatus ? 'YES' : 'NO'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Tested Positive (2yr):</td>
            <td style="padding: 6px 0; color: ${app.drugTestPositive ? '#ef4444' : '#10b981'}; font-weight: bold;">${app.drugTestPositive ? 'YES' : 'NO'}</td>
          </tr>
          ${app.drugTestPositive ? `
            <tr>
              <td style="padding: 6px 0; font-weight: bold;">RTD Docs Available:</td>
              <td style="padding: 6px 0; color: ${app.drugTestDoc ? '#10b981' : '#ef4444'}; font-weight: bold;">${app.drugTestDoc ? 'YES' : 'NO'}</td>
            </tr>
          ` : ''}
        </table>

        <h3 style="color: #0b0f19; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; margin-top: 20px;">Documents Vetting Uploads</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; width: 35%;">DL Front Uploaded:</td>
            <td style="padding: 6px 0;">${app.docDlFrontUploaded ? '✅ YES' : '❌ NO'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">DL Rear Uploaded:</td>
            <td style="padding: 6px 0;">${app.docDlBackUploaded ? '✅ YES' : '❌ NO'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Medical Certificate:</td>
            <td style="padding: 6px 0;">${app.docMedCertUploaded ? '✅ YES' : '❌ NO'}</td>
          </tr>
        </table>

        <p style="margin-top: 30px; font-size: 13px;">Log in to the <strong>MARSHALL TRANSPORTS LLC Admin Dashboard</strong> to verify the uploaded document files, examine the signature, and change application status.</p>
      </div>
    </div>
  `;

  try {
    // Send to Driver
    await transporter.sendMail({
      from,
      to: app.email,
      subject: 'MARSHALL TRANSPORTS LLC | Onboarding Application Confirmed',
      html: applicantHtml,
    });

    // Send to Admin
    await transporter.sendMail({
      from,
      to: adminEmail,
      subject: `[New Driver App] ${fullName} - Class A (${app.cdlState})`,
      html: adminHtml,
    });

    return { success: true };
  } catch (err: any) {
    console.error('Failed to send SMTP emails:', err);
    return { success: false, error: err.message };
  }
}

export async function sendApplicationStatusEmail(
  email: string,
  firstName: string,
  lastName: string,
  status: "APPROVED" | "REJECTED"
) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true';
  const from = process.env.EMAIL_FROM || 'info@marshalltransports.com';

  if (!host || !user || !pass) {
    console.warn('SMTP configuration is missing. Skipping status email notification.');
    return { success: false, error: 'SMTP config missing' };
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  const isApproved = status === "APPROVED";
  const subject = isApproved 
    ? 'MARSHALL TRANSPORTS LLC | Onboarding Application Approved - Next Steps' 
    : 'MARSHALL TRANSPORTS LLC | Onboarding Application Status Update';

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1e293b;">
      <div style="background-color: #0b0f19; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
        <h1 style="color: #d4af37; margin: 0; font-size: 24px; letter-spacing: 1px;">MARSHALL TRANSPORTS LLC</h1>
        <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Driver Onboarding</p>
      </div>
      <div style="padding: 20px; line-height: 1.6;">
        <h2 style="color: ${isApproved ? '#10b981' : '#ef4444'}; margin-top: 0; font-size: 20px;">
          Application ${isApproved ? 'Approved' : 'Status Update'}
        </h2>
        <p>Dear ${firstName},</p>
        
        ${isApproved ? `
          <p>Congratulations! We are pleased to inform you that your driver onboarding application with <strong>MARSHALL TRANSPORTS LLC</strong> has been <strong>Approved</strong>.</p>
          <p>Our safety and compliance team has successfully vetted your CDL credentials, safety records, and qualification documents. You have met all of our partnership standards.</p>
          
          <h3 style="color: #0b0f19; margin-top: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; font-size: 15px;">Next Onboarding Steps:</h3>
          <ol style="padding-left: 20px;">
            <li style="margin-bottom: 10px;"><strong>Operational Contact:</strong> Our dispatch and operations manager will contact you in the next 12-24 business hours to discuss your dedicated run lanes, plate setup, and fuel program.</li>
            <li style="margin-bottom: 10px;"><strong>Trailer Coordination:</strong> We will coordinate trailer pick-up locations and lease contract details with you.</li>
          </ol>
          <p>Welcome to the family! We are excited to partner with you and look forward to a mutually successful journey.</p>
        ` : `
          <p>Thank you for your interest in partnering and leasing on with <strong>MARSHALL TRANSPORTS LLC</strong>.</p>
          <p>After careful review of your driver qualification history, safety screening, and compliance records, we regret to inform you that we are unable to approve your onboarding application at this time.</p>
          <p>Our hiring and partnership policy is governed by strict safety, compliance, and insurance guidelines. Although we cannot move forward today, we sincerely appreciate your interest, time, and effort in applying.</p>
          <p>We wish you safe travels and success in your future endeavors.</p>
        `}
        
        <p style="margin-top: 30px;">Best regards,<br/><strong>Safety & Compliance Team</strong><br/>MARSHALL TRANSPORTS LLC</p>
      </div>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 0 0 6px 6px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
        MARSHALL TRANSPORTS LLC | 1114 Granger st union city, tn 38261 | DOT# 4172640 | MC# 1605225
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to: email,
      subject,
      html: htmlContent,
    });
    return { success: true };
  } catch (err: any) {
    console.error('Failed to send status SMTP email:', err);
    return { success: false, error: err.message };
  }
}

export async function sendInquiryEmail(details: {
  name: string;
  phone: string;
  email: string;
  method: string;
  message: string;
}) {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === 'true';
  const from = process.env.EMAIL_FROM || 'info@marshalltransports.com';
  const adminEmail = process.env.ADMIN_NOTIFY_EMAIL || 'info@marshalltransports.com';

  if (!host || !user || !pass) {
    console.warn('SMTP configuration is missing. Skipping email notifications.');
    return { success: false, error: 'SMTP config missing' };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff; color: #1e293b;">
      <div style="background-color: #0b0f19; padding: 20px; border-radius: 6px 6px 0 0; text-align: center;">
        <h1 style="color: #d4af37; margin: 0; font-size: 24px; letter-spacing: 1px;">MARSHALL TRANSPORTS LLC</h1>
        <p style="color: #94a3b8; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">Quick Inquiry</p>
      </div>
      <div style="padding: 20px; line-height: 1.6;">
        <h2 style="color: #0b0f19; margin-top: 0; font-size: 18px; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px;">New Contact/Inquiry Received</h2>
        <p>A new quick inquiry has been submitted from the Marshall Transports landing page. Details are below:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; width: 35%;">Name:</td>
            <td style="padding: 6px 0;">${details.name}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Phone Number:</td>
            <td style="padding: 6px 0;">${details.phone}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Email:</td>
            <td style="padding: 6px 0;">${details.email}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Preferred Contact:</td>
            <td style="padding: 6px 0; text-transform: uppercase; font-weight: bold; color: #d4af37;">${details.method}</td>
          </tr>
        </table>
        
        <h3 style="color: #0b0f19; margin-top: 20px; font-size: 14px;">Questions/Message:</h3>
        <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; font-size: 13px; color: #334155; border: 1px solid #e2e8f0; font-style: italic; white-space: pre-wrap;">
          ${details.message}
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 0 0 6px 6px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0;">
        MARSHALL TRANSPORTS LLC | 1114 Granger st union city, tn 38261 | DOT# 4172640 | MC# 1605225
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from,
      to: adminEmail,
      subject: `[Quick Inquiry] ${details.name} - Prefers ${details.method}`,
      html: htmlContent,
      replyTo: details.email
    });
    return { success: true };
  } catch (err: any) {
    console.error('Failed to send inquiry SMTP email:', err);
    return { success: false, error: err.message };
  }
}
