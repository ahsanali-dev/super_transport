const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Ensure public directory exists
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const pdfPath = path.join(publicDir, 'policy.pdf');
const doc = new PDFDocument({ margin: 50 });

// Pipe its output to a file
const writeStream = fs.createWriteStream(pdfPath);
doc.pipe(writeStream);

// Define styles
const primaryColor = '#1e293b'; // dark slate
const secondaryColor = '#b45309'; // gold/amber-700
const bodyColor = '#334155'; // light slate

// Header / Title Page
doc.rect(0, 0, doc.page.width, 20).fill(secondaryColor);

doc.moveDown(2);
doc.fillColor(primaryColor)
   .fontSize(24)
   .font('Helvetica-Bold')
   .text('MARSHALL TRANSPORTS LLC', { align: 'center' });

doc.fillColor(secondaryColor)
   .fontSize(14)
   .font('Helvetica-Bold')
   .text('DRIVER QUALIFICATION & HIRING POLICY', { align: 'center' })
   .moveDown(1);

doc.fillColor(bodyColor)
   .fontSize(10)
   .font('Helvetica')
   .text('Effective Date: June 1, 2026', { align: 'center' })
   .moveDown(2);

// Draw a separator line
doc.strokeColor('#cbd5e1')
   .lineWidth(1)
   .moveTo(50, doc.y)
   .lineTo(doc.page.width - 50, doc.y)
   .stroke()
   .moveDown(2);

// Add Sections
function addHeading(text) {
  doc.fillColor(secondaryColor)
     .fontSize(12)
     .font('Helvetica-Bold')
     .text(text)
     .moveDown(0.5);
}

function addBodyText(text) {
  doc.fillColor(bodyColor)
     .fontSize(10)
     .font('Helvetica')
     .text(text, { align: 'justify', lineGap: 3 })
     .moveDown(1.2);
}

function addBullet(boldText, text) {
  doc.fillColor(bodyColor)
     .fontSize(10)
     .font('Helvetica-Bold')
     .text('  • ' + boldText, { continued: true })
     .font('Helvetica')
     .text(text, { lineGap: 2 })
     .moveDown(0.6);
}

// Section 1
addHeading('1. INTRODUCTION & PURPOSE');
addBodyText(
  'Marshall Transports LLC is committed to providing safe, reliable, and compliant logistics services. In alignment with our core values of integrity, safety, and regulatory compliance, we establish these qualification requirements and policies. This document details the standards and expectations required of all owner-operators, contract drivers, and company personnel operating commercial motor vehicles (CMVs) under our DOT authority (#4172640) and MC authority (#1605225).'
);

// Section 2
addHeading('2. MINIMUM DRIVER QUALIFICATIONS');
addBodyText(
  'To maintain the highest levels of safety and insurance compliance, all drivers wishing to lease on or drive for Marshall Transports LLC must meet the following minimum qualifications:'
);

addBullet('Age Requirement: ', 'Must be at least 23 years of age at the time of application.');
addBullet('Commercial License: ', 'Possess a valid Class A Commercial Driver\'s License (CDL) issued by their state of residence.');
addBullet('OTR Experience: ', 'Have a minimum of two (2) years of verifiable over-the-road (OTR) tractor-trailer driving experience.');
addBullet('Medical Certification: ', 'Possess and maintain a valid Medical Examiner\'s Certificate (DOT Physical Card) from a registered medical examiner.');
addBullet('Language Proficiency: ', 'Must be able to read, speak, and write the English language sufficiently to converse with the general public, understand highway traffic signs, and respond to official inquiries (49 CFR §391.11).');
doc.moveDown(1);

// Section 3
addHeading('3. BACKGROUND SCREENING & DISCLOSURES');
addBodyText(
  'Prior to approval, Marshall Transports LLC conducts comprehensive background screenings in compliance with the Fair Credit Reporting Act (FCRA) and Federal Motor Carrier Safety Administration (FMCSA) regulations. These screenings include:'
);

addBullet('Motor Vehicle Report (MVR): ', 'An official MVR check covering the last three (3) years. Applicants should have no major violations (e.g., DUI/DWI, reckless driving, speed over 15 mph, or leaving the scene of an accident) within the last 3 years.');
addBullet('Pre-Employment Screening Program (PSP): ', 'Review of the applicant\'s five-year crash history and three-year roadside inspection history through the FMCSA database.');
addBullet('Employment History Verification: ', 'A complete ten-year employment history check, with detailed safety performance inquiries sent to all DOT-regulated employers from the preceding three years (49 CFR §391.23).');
addBullet('FMCSA Clearinghouse Query: ', 'A full query of the FMCSA Drug and Alcohol Clearinghouse database to ensure the applicant has no unresolved drug or alcohol violations.');
doc.moveDown(1);

// Add page break for Section 4
doc.addPage();
doc.rect(0, 0, doc.page.width, 20).fill(secondaryColor);
doc.moveDown(2);

// Section 4
addHeading('4. DRUG AND ALCOHOL TESTING POLICY');
addBodyText(
  'Marshall Transports LLC maintains a strict drug-free and alcohol-free working environment. In compliance with 49 CFR Part 40 and Part 382, all drivers operating under our authority are subject to the following testing protocols:'
);

addBullet('Pre-Employment Testing: ', 'A negative DOT drug test result must be received before a driver is permitted to perform safety-sensitive functions.');
addBullet('Random Testing: ', 'All drivers are enrolled in our DOT random drug and alcohol testing pool. Random selections are unannounced and spread throughout the calendar year.');
addBullet('Post-Accident Testing: ', 'Testing is required following any DOT-reportable accident involving a fatality, or if the driver receives a citation for a moving violation and a vehicle is towed from the scene or medical attention is administered away from the scene.');
addBullet('Reasonable Suspicion Testing: ', 'Conducted if trained supervisors observe physical, behavioral, or speech indicators of drug or alcohol use.');
addBullet('Refusal to Test: ', 'Any refusal to submit to a required drug or alcohol test is considered a positive test result and will result in immediate termination of the lease agreement or contract.');
doc.moveDown(1);

// Section 5
addHeading('5. COMPLIANCE & OPERATIONAL SAFETY EXPECTATIONS');
addBodyText(
  'Drivers are expected to comply with all federal, state, and local regulations. This includes maintaining electronic logging devices (ELDs) in accordance with Hours of Service (HOS) rules, participating in regular vehicle inspection reports (DVIR), and immediately reporting any roadside inspection violations or accidents to our safety director.'
);

// Section 6
addHeading('6. CERTIFICATE OF RECEIPT & ACKNOWLEDGMENT');
addBodyText(
  'By completing and signing the driver application, you certify that you have received, read, and understood Marshall Transports LLC\'s Driver Qualification & Hiring Policy. You agree to comply with all guidelines, FMCSA regulations, and drug and alcohol testing standards outlined in this policy during your partnership.'
);

doc.moveDown(3);

// Signature Block
doc.strokeColor('#94a3b8').lineWidth(1);

doc.moveTo(50, doc.y).lineTo(250, doc.y).stroke();
doc.moveTo(350, doc.y).lineTo(550, doc.y).stroke();

doc.fillColor(primaryColor)
   .fontSize(9)
   .font('Helvetica-Bold')
   .text('Marshall Transports LLC Safety Director', 50, doc.y + 5, { continued: true })
   .text('Driver Acknowledgment & Signature', 225, doc.y + 5, { align: 'right' });

// Finalize PDF file
doc.end();

writeStream.on('finish', () => {
  console.log('PDF successfully generated at:', pdfPath);
});
