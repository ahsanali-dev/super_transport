# MARSHALL TRANSPORTS LLC | Driver Onboarding Portal & Admin Dashboard

A premium, full-stack Next.js web application designed for **MARSHALL TRANSPORTS LLC**. This portal features a comprehensive, 9-step driver qualification onboarding stepper form, a secure administrative dashboard, and automated email vetting notifications.

---

## 🚀 Key Features

### 1. 9-Step Onboarding Form (`/apply`)
A structured multi-step stepper qualification form designed to comply with FMCSA and DOT guidelines:
*   **Personal Info:** General details + Address duration. Conditionally reveals Previous Address history if the driver has lived at their current address for less than 3 years.
*   **CDL Info:** CDL licensing numbers, issuing states, classification selection, expiration dates, endorsement checklists, and referral sources.
*   **Employment History:** Dynamic, interactive history list enabling drivers to record their 10-year employment history (FMCSR status, DOT drug/alcohol testing history) and declare gaps.
*   **Experience:** OTR experience durations and operated trailer configuration tags.
*   **Accidents & Citations:** 3-year recordable safety violation logs.
*   **Drug & Alcohol:** Return-to-Duty / SAP process status checks.
*   **Document Uploads & Compression:** Drag-and-drop slots for **Front of DL**, **Back of DL**, and **Medical Certificate**. All uploaded images are **automatically compressed and converted to WebP format** on the client side before upload to optimize storage space and page performance. Displays responsive image thumbnails and PDF badge previews with a custom **Inline Lightbox Modal** viewer and a **Remove File** control.
*   **Disclosures & Consent:** Terms (FCRA, PSP, Clearinghouse, Company Testing Policy) with individual checkbox signatures.
*   **Signature (SSN / EIN Choice):** Features a segmented toggle tab allowing applicants to submit either their **Social Security Number (SSN)** or **Employer Identification Number (EIN)**. Both fields include dynamic input masking/formatting on the fly (adding dashes like `XXX-XX-XXXX` and `XX-XXXXXXX` as the user types), typed signature validation, and a custom drawn canvas signature pad.

### 2. Admin Dashboard (`/admin`)
A central administrative management panel for safety and compliance operations:
*   **Vetting Controls:** Action panel featuring buttons to **Mark Reviewed**, **Approve**, or **Reject** driver applications.
*   **Status Loading Indicators:** Buttons dynamically hide and render a spinning progress indicator (`"Updating status & sending email..."`) to prevent double clicks during processing.
*   **Credentials Inspection:** Full breakdown of the applicant's CDL, dynamic 10-year job history cards, and background consent.
*   **Secure SSN/EIN Decryption:** Dynamically displays either SSN or EIN matching the applicant's choice. Values are masked by default (`***-**-XXXX` / `**-*******`) and feature a secure eye toggle switch to reveal the raw value.
*   **File Previews & Direct Download:** Direct grids displaying DL fronts, DL backs, and Medical Certificates (image rendering or PDF embeds). Features an **integrated direct Download icon button** for both images and PDFs. The system fetches the file as a blob to bypass cross-origin browser download restrictions, saving it locally with a descriptive name (e.g. `john-doe-front-of-driver's-license.webp`).

### 3. Automated SMTP Email Alerts
Nodemailer integrations connecting safety and applicants:
*   **Onboarding Confirmation:** Fires a detailed HTML summary email to the driver immediately upon submission, verifying their credentials.
*   **Admin Submission Alert:** Notifies `ADMIN_NOTIFY_EMAIL` immediately when a new driver application is received.
*   **Status Update Notifications:** Triggers custom, styled HTML notifications directly to the applicant's inbox when their status is changed to `APPROVED` or `REJECTED`.
    *   *Approved Email:* Welcomes them and lists next operational steps (dispatch contact, plate setup, trailer coordination).
    *   *Rejected Email:* Politely notifies them of the decision based on safety/insurance guidelines.

### 4. Progress Retention ("Save Draft")
*   Applicants can click the **Save Draft** button next to form navigation.
*   Form progress is serialized and backed up locally in the browser's `localStorage`.
*   Reloading the application restores progress up to the exact step they left off.
*   The draft cache is cleared automatically upon successful application submission.

---

## 🛠️ Technology Stack

*   **Framework:** Next.js 16 (App Router with Turbopack)
*   **Database Client:** Prisma 7 (PostgreSQL Adapter)
*   **Database Engine:** Supabase PostgreSQL
*   **Styling & Icons:** Tailwind CSS 4 & Lucide React
*   **Mailing Client:** Nodemailer (Gmail App Passwords SMTP integration)
*   **Form Management:** React Hook Form & Zod Validation
*   **State Management:** React Hooks (Context, State, Ref, Effects)

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory and configure the following parameters:

```env
# Database Connections (Supabase PostgreSQL)
DATABASE_URL="postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres"

# Supabase Storage / Client Configuration
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_ID].supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Admin Dashboard Credentials
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="YourSecureAdminPasswordHere"

# SMTP Email Configuration (Nodemailer)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-gmail-address@gmail.com"
SMTP_PASS="your-16-character-app-password"
SMTP_SECURE="false" # Set to "true" for port 465, "false" for 587 (STARTTLS)

# Sender and Recipient Address Configuration
EMAIL_FROM="your-gmail-address@gmail.com"
ADMIN_NOTIFY_EMAIL="info@marshalltransports.com"
```

*Note: If you use Gmail, you must generate a 16-character **App Password** from your Google Account Security settings.*

---

## 🛠️ Getting Started

### 1. Clone & Install Dependencies
```bash
npm install
```

### 2. Run Database Migrations
Push the database schema to your Supabase PostgreSQL database:
```bash
npx prisma db push
```
Generate the Prisma Client types:
```bash
npx prisma generate
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 📂 Project Structure

```text
├── prisma/
│   └── schema.prisma         # Database models for Driver Applications
├── public/
│   ├── favicon.ico
│   └── hero.png              # Marshall Transports Landing Page Hero Image
└── src/
    └── app/
        ├── admin/
        │   └── page.tsx      # Admin Dashboard with SSN Toggles, Previews, & Status Controls
        ├── api/
        │   ├── admin/
        │   │   ├── applications/   # API to get & patch application status (sends approval emails)
        │   │   ├── login/
        │   │   └── logout/
        │   └── apply/
        │       └── route.ts  # API to receive application submissions & notify safety
        ├── apply/
        │   └── page.tsx      # 9-Step Onboarding Form (Canvas signing, previews, localStorage)
        ├── utils/
        │   └── email.ts      # Nodemailer SMTP templates for submissions, approvals, & rejections
        ├── globals.css       # Core Tailwind CSS variables & scrollbar styles
        └── page.tsx          # Responsive landing page with scroll-spy navigation header
```
