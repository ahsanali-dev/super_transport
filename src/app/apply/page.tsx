"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User, 
  FileText, 
  ShieldAlert, 
  Truck, 
  ClipboardCheck, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Plus,
  Trash
} from "lucide-react";

// Sub-types for dynamic employment list
interface EmploymentHistoryItem {
  employer: string;
  city: string;
  state: string;
  position: string;
  startDate: string;
  endDate: string;
  reasonLeaving: string;
  isCmvr: boolean; // Subject to FMCSRs
  isDotTest: boolean; // Subject to DOT drug & alcohol testing
}

// Types for form data
interface ApplicationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  addressStreet: string;
  addressLine2: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  addressDuration: string; // "Less than 3 years" or "3 years or more"
  
  hasPrevAddress: boolean;
  prevAddressStreet: string;
  prevAddressLine2: string;
  prevAddressCity: string;
  prevAddressState: string;
  prevAddressZip: string;
  
  cdlNumber: string;
  cdlState: string;
  cdlClass: string;
  cdlExpiration: string;
  endorsements: string[]; // None, Double/Triple, Tank, Hazmat, Combined, Passenger
  cdlTenYears: boolean; // held CDL in other states in past 10 years?
  referral: string;
  
  employmentHistory: EmploymentHistoryItem[];
  employmentGaps: boolean;
  gapsDetail: string;
  
  yearsExperience: string; // "Less than 2", "2-3", "4-7", "8-10", "10+"
  equipmentOperated: string[]; // Dry Van, Temp-controlled, Hopper/Bulk, Flatbed, Step Deck, Lowboy, Tanker
  
  hasAccidents: boolean;
  accidentsDetail: string;
  hasViolations: boolean;
  violationsDetail: string;
  
  sapStatus: boolean; // participating in RTD/SAP?
  
  docDlFront: string; // Base64
  docDlBack: string; // Base64
  docMedCert: string; // Base64
  
  fcraConsent: boolean;
  pspConsent: boolean;
  clearinghouseConsent: boolean;
  drugTestPositive: boolean;
  drugTestDoc: boolean;
  companyPolicyConsent: boolean;
  
  ssn: string;
  signatureName: string;
  signatureData: string; // Base64 signature image
}

const initialData: ApplicationData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dob: "",
  addressStreet: "",
  addressLine2: "",
  addressCity: "",
  addressState: "",
  addressZip: "",
  addressDuration: "3 years or more",
  hasPrevAddress: false,
  prevAddressStreet: "",
  prevAddressLine2: "",
  prevAddressCity: "",
  prevAddressState: "",
  prevAddressZip: "",
  
  cdlNumber: "",
  cdlState: "",
  cdlClass: "Class A",
  cdlExpiration: "",
  endorsements: [],
  cdlTenYears: false,
  referral: "",
  
  employmentHistory: [],
  employmentGaps: false,
  gapsDetail: "",
  
  yearsExperience: "2-3 years",
  equipmentOperated: [],
  
  hasAccidents: false,
  accidentsDetail: "",
  hasViolations: false,
  violationsDetail: "",
  
  sapStatus: false,
  
  docDlFront: "",
  docDlBack: "",
  docMedCert: "",
  
  fcraConsent: false,
  pspConsent: false,
  clearinghouseConsent: false,
  drugTestPositive: false,
  drugTestDoc: false,
  companyPolicyConsent: false,
  
  ssn: "",
  signatureName: "",
  signatureData: "",
};

const STEPS = [
  { id: 1, name: "Personal Info", icon: User },
  { id: 2, name: "CDL Info", icon: ClipboardCheck },
  { id: 3, name: "Employment", icon: FileText },
  { id: 4, name: "Experience", icon: Truck },
  { id: 5, name: "Accidents", icon: ShieldAlert },
  { id: 6, name: "Drug & Alcohol", icon: ShieldAlert },
  { id: 7, name: "Documents", icon: FileText },
  { id: 8, name: "Disclosures", icon: FileText },
  { id: 9, name: "Signature", icon: ClipboardCheck },
];

export default function ApplyPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ApplicationData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Custom Toast State
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({
    show: false,
    message: "",
    type: "success",
  });

  // Lightbox Preview State
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [previewModalTitle, setPreviewModalTitle] = useState<string>("");

  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ show: true, message, type });
  };

  // Auto-hide toast timer
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast(prev => ({ ...prev, show: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);
  
  // SSN visibility state
  const [showSSN, setShowSSN] = useState(false);

  // Dynamic Employer state
  const [employerForm, setEmployerForm] = useState<EmploymentHistoryItem>({
    employer: "",
    city: "",
    state: "",
    position: "",
    startDate: "",
    endDate: "",
    reasonLeaving: "",
    isCmvr: false,
    isDotTest: false
  });
  const [showEmployerForm, setShowEmployerForm] = useState(false);
  const [employerFormError, setEmployerFormError] = useState("");

  // Canvas signature ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Restore draft on mount
  useEffect(() => {
    const saved = localStorage.getItem("supertransport_onboarding_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
        if (parsed.currentStep) {
          setCurrentStep(parsed.currentStep);
        }
      } catch (e) {
        console.error("Failed to restore draft from localStorage", e);
      }
    }
  }, []);

  // Save Draft locally
  const saveDraft = () => {
    try {
      const dataToSave = { ...formData, currentStep };
      localStorage.setItem("supertransport_onboarding_draft", JSON.stringify(dataToSave));
      triggerToast("Draft saved successfully! You can resume from this step when you return.", "success");
    } catch (e) {
      console.error("Failed to save draft", e);
      triggerToast("Failed to save draft.", "error");
    }
  };

  // Clear Draft
  const clearDraft = () => {
    localStorage.removeItem("supertransport_onboarding_draft");
  };

  // Initialize canvas drawing listeners
  useEffect(() => {
    if (currentStep === 9 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.strokeStyle = "#D4AF37"; // Gold drawing line (matches theme)
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [currentStep]);

  // Canvas drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    // Prevent default scroll behavior on touch devices
    if (e.cancelable) e.preventDefault();
    setIsDrawing(true);

    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if ("touches" in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL();
      setFormData(prev => ({ ...prev, signatureData: dataUrl }));
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    if (e.cancelable) e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX, clientY;
    if ("touches" in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearSignature = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        setFormData(prev => ({ ...prev, signatureData: "" }));
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleCheckboxChange = (name: keyof ApplicationData, value: boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEquipmentToggle = (item: string) => {
    setFormData(prev => {
      const current = [...prev.equipmentOperated];
      const index = current.indexOf(item);
      if (index > -1) {
        current.splice(index, 1);
      } else {
        current.push(item);
      }
      return { ...prev, equipmentOperated: current };
    });
  };

  const handleEndorsementToggle = (item: string) => {
    setFormData(prev => {
      const current = [...prev.endorsements];
      const index = current.indexOf(item);
      if (index > -1) {
        current.splice(index, 1);
      } else {
        current.push(item);
      }
      return { ...prev, endorsements: current };
    });
  };

  // Convert uploaded documents to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'docDlFront' | 'docDlBack' | 'docMedCert') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      triggerToast("Only PDF, JPG, or PNG files are accepted.", "error");
      return;
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      triggerToast("File size exceeds the 10 MB limit.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFormData(prev => ({ ...prev, [fieldName]: reader.result as string }));
        if (errors[fieldName]) {
          setErrors(prev => {
            const next = { ...prev };
            delete next[fieldName];
            return next;
          });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const renderDocumentUploadCard = (
    fieldName: 'docDlFront' | 'docDlBack' | 'docMedCert',
    label: string,
    placeholderText: string,
    subText: string,
    error: string | undefined
  ) => {
    const fileValue = formData[fieldName];
    const isPdf = fileValue && fileValue.startsWith("data:application/pdf");

    return (
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 block">{label}</label>
        {fileValue ? (
          <div className="relative border border-brand-border rounded-xl p-5 bg-brand-dark/30 flex flex-col items-center justify-center space-y-4 shadow-inner">
            {/* Preview Section */}
            {isPdf ? (
              <div className="flex flex-col items-center space-y-2 p-3 bg-brand-dark/70 rounded-lg w-full max-w-xs border border-brand-border/60">
                <FileText className="h-10 w-10 text-red-500/90 drop-shadow" />
                <span className="text-xs font-bold text-slate-300 text-center truncate w-full font-sans">
                  PDF Document Loaded
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewModalUrl(fileValue);
                    setPreviewModalTitle(label);
                  }}
                  className="text-[10px] text-gold hover:underline font-bold bg-gold/10 px-2.5 py-1 rounded transition-colors cursor-pointer"
                >
                  View PDF
                </button>
              </div>
            ) : (
              <div className="relative group max-w-xs rounded overflow-hidden border border-brand-border bg-brand-dark/50 p-1.5 shadow-md flex flex-col items-center space-y-2">
                <img
                  src={fileValue}
                  alt={`${label} Preview`}
                  className="max-h-36 object-contain rounded"
                />
                <button
                  type="button"
                  onClick={() => {
                    setPreviewModalUrl(fileValue);
                    setPreviewModalTitle(label);
                  }}
                  className="text-[10px] text-gold hover:underline font-bold bg-gold/10 px-2.5 py-1 rounded transition-colors cursor-pointer"
                >
                  View Full Image
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData(prev => ({ ...prev, [fieldName]: "" }));
                  triggerToast(`${label.replace(" *", "")} removed`, "info");
                }}
                className="px-4 py-2 bg-red-950/40 hover:bg-red-950/80 text-red-400 hover:text-red-300 text-xs font-bold border border-red-500/30 hover:border-red-500/60 rounded-lg flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remove File
              </button>
            </div>
          </div>
        ) : (
          <div className="relative border border-dashed border-brand-border rounded-xl p-6 bg-brand-dark/50 hover:bg-brand-dark flex flex-col items-center justify-center cursor-pointer transition">
            <input
              type="file"
              accept=".pdf, .jpg, .jpeg, .png"
              onChange={(e) => handleFileUpload(e, fieldName)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="text-center space-y-2 text-slate-500">
              <Upload className="h-6 w-6 mx-auto text-gold/65" />
              <p className="text-xs font-bold text-slate-300">{placeholderText}</p>
              <p className="text-[10px]">JPG, PNG, or PDF - Max 10 MB</p>
            </div>
          </div>
        )}
        <p className="text-[10px] text-slate-500">{subText}</p>
        {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
      </div>
    );
  };

  // Dynamic Employer handlers
  const addEmployer = () => {
    if (!employerForm.employer.trim()) {
      setEmployerFormError("Employer name is required");
      return;
    }
    if (!employerForm.position.trim()) {
      setEmployerFormError("Position held is required");
      return;
    }
    if (!employerForm.startDate.trim()) {
      setEmployerFormError("Start date is required");
      return;
    }
    if (!employerForm.endDate.trim()) {
      setEmployerFormError("End date or 'Present' is required");
      return;
    }

    setFormData(prev => ({
      ...prev,
      employmentHistory: [...prev.employmentHistory, employerForm]
    }));

    // Reset employer sub-form
    setEmployerForm({
      employer: "",
      city: "",
      state: "",
      position: "",
      startDate: "",
      endDate: "",
      reasonLeaving: "",
      isCmvr: false,
      isDotTest: false
    });
    setShowEmployerForm(false);
    setEmployerFormError("");
  };

  const removeEmployer = (index: number) => {
    setFormData(prev => ({
      ...prev,
      employmentHistory: prev.employmentHistory.filter((_, idx) => idx !== index)
    }));
  };

  // Step validation
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
      if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Valid email is required";
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
      if (!formData.dob.trim()) newErrors.dob = "Date of birth is required";
      if (!formData.addressStreet.trim()) newErrors.addressStreet = "Street address is required";
      if (!formData.addressCity.trim()) newErrors.addressCity = "City is required";
      if (!formData.addressState.trim()) newErrors.addressState = "State is required";
      if (!formData.addressZip.trim()) newErrors.addressZip = "ZIP code is required";
      
      if (formData.addressDuration === "Less than 3 years") {
        if (!formData.prevAddressStreet.trim()) newErrors.prevAddressStreet = "Previous street address is required";
        if (!formData.prevAddressCity.trim()) newErrors.prevAddressCity = "Previous city is required";
        if (!formData.prevAddressState.trim()) newErrors.prevAddressState = "Previous state is required";
        if (!formData.prevAddressZip.trim()) newErrors.prevAddressZip = "Previous ZIP code is required";
      }
    } else if (step === 2) {
      if (!formData.cdlNumber.trim()) newErrors.cdlNumber = "CDL license number is required";
      if (!formData.cdlState.trim()) newErrors.cdlState = "CDL license state is required";
      if (!formData.cdlExpiration.trim()) newErrors.cdlExpiration = "CDL expiration date is required";
    } else if (step === 3) {
      if (formData.employmentHistory.length === 0) {
        newErrors.employmentHistory = "Please add at least one employer for history check.";
      }
      if (formData.employmentGaps && !formData.gapsDetail.trim()) {
        newErrors.gapsDetail = "Please provide details for any employment gaps.";
      }
    } else if (step === 4) {
      // Experience has selections pre-filled, no hard fields.
    } else if (step === 5) {
      if (formData.hasAccidents && !formData.accidentsDetail.trim()) {
        newErrors.accidentsDetail = "Accident details are required";
      }
      if (formData.hasViolations && !formData.violationsDetail.trim()) {
        newErrors.violationsDetail = "Violation details are required";
      }
    } else if (step === 6) {
      // Radio only, pre-filled.
    } else if (step === 7) {
      if (!formData.docDlFront) newErrors.docDlFront = "Front of Driver's License is required";
      if (!formData.docDlBack) newErrors.docDlBack = "Rear of Driver's License is required";
      if (!formData.docMedCert) newErrors.docMedCert = "Medical Certificate (Short Form) is required";
    } else if (step === 8) {
      if (!formData.fcraConsent) newErrors.fcraConsent = "You must authorize the FCRA disclosure";
      if (!formData.pspConsent) newErrors.pspConsent = "You must authorize the PSP screening check";
      if (!formData.clearinghouseConsent) newErrors.clearinghouseConsent = "You must authorize the Drug & Alcohol Clearinghouse consent";
      if (!formData.companyPolicyConsent) newErrors.companyPolicyConsent = "You must accept the Company testing policy";
      if (formData.drugTestPositive && !formData.drugTestDoc) {
        newErrors.drugTestDoc = "Documentation receipt declaration is required if you answered Yes";
      }
    } else if (step === 9) {
      if (!formData.ssn.trim()) newErrors.ssn = "Social security number is required";
      if (!formData.signatureName.trim()) newErrors.signatureName = "Full legal name is required";
      if (!formData.signatureData) newErrors.signatureData = "Drawn signature is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(9)) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSuccess(true);
        clearDraft();
        setFormData(initialData);
      } else {
        const resData = await response.json();
        triggerToast(resData.error || "Submission failed. Please try again.", "error");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Network error. Please try again later.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-brand-dark">
      {/* Fixed Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-dark/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="rounded-lg bg-gold/10 p-2 text-gold group-hover:bg-gold/20 transition-all duration-300">
              <Truck className="h-7 w-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-wider text-slate-50">SUPERTRANSPORT</span>
              <span className="text-[10px] uppercase tracking-widest text-gold font-semibold">Established 2011</span>
            </div>
          </Link>
          <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-slate-400 hover:text-gold transition-colors duration-200">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </header>

      <main className="flex-1 py-12 px-6">
        <div className="container mx-auto max-w-4xl">
          {isSuccess ? (
            /* Success Screen in Dark theme */
            <div className="rounded-2xl border border-brand-border bg-brand-card p-12 text-center shadow-xl space-y-6">
              <div className="inline-flex rounded-full bg-gold/10 p-4 text-gold mx-auto">
                <CheckCircle2 className="h-16 w-16" />
              </div>
              <h1 className="text-3xl font-extrabold text-slate-50">Application Submitted!</h1>
              <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
                Thank you for applying to partner with SuperTransport. We have successfully received your CDL details, safety history, and qualification documents. A confirmation email has been dispatched to your address.
              </p>
              <div className="pt-6">
                <Link
                  href="/"
                  className="rounded-xl bg-gold px-8 py-3 text-sm font-bold text-brand-dark transition-colors duration-200 hover:bg-gold-hover"
                >
                  Return to Home
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Stepper Status Indicators (Dark theme) */}
              <div className="bg-brand-card border border-brand-border rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-gold uppercase tracking-widest">
                    Step {currentStep} of {STEPS.length}
                  </span>
                  <span className="text-sm font-black text-slate-300 uppercase tracking-wider">
                    {STEPS[currentStep - 1].name}
                  </span>
                </div>
                
                {/* Visual Tracker Dots */}
                <div className="hidden sm:flex items-center justify-between gap-1 overflow-x-auto py-1">
                  {STEPS.map((step) => {
                    const isActive = currentStep >= step.id;
                    const isCurrent = currentStep === step.id;
                    return (
                      <div 
                        key={step.id} 
                        onClick={() => {
                          if (step.id < currentStep) setCurrentStep(step.id);
                        }}
                        className="flex flex-col items-center flex-1 min-w-[50px] cursor-pointer"
                      >
                        <div 
                          className={`h-2.5 w-full rounded-full transition-all duration-300 ${
                            isCurrent 
                              ? "bg-gold shadow-lg shadow-gold/20" 
                              : isActive 
                                ? "bg-gold/40" 
                                : "bg-brand-border"
                          }`}
                        />
                        <span className={`text-[9px] font-bold mt-1.5 uppercase truncate text-center ${
                          isCurrent ? "text-gold" : "text-slate-500"
                        }`}>
                          {step.name.split(" ")[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Mobile Progress Bar */}
                <div className="block sm:hidden space-y-2 mt-2">
                  <div className="w-full bg-brand-border h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gold h-full rounded-full transition-all duration-300"
                      style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-bold">
                    <span>PROGRESS</span>
                    <span>{Math.round((currentStep / STEPS.length) * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Form Content Body (Dark card theme) */}
              <div className="rounded-2xl border border-brand-border bg-brand-card p-8 shadow-xl">
                
                {/* STEP 1: PERSONAL INFO */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="border-b border-brand-border pb-4">
                      <h2 className="text-2xl font-black text-slate-50">Personal Information</h2>
                      <p className="text-xs text-slate-400 mt-1">Please provide your legal name and contact details as they appear on your CDL license.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">Legal First Name *</label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleTextChange}
                          className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none"
                          placeholder="E.g., John"
                        />
                        {errors.firstName && <p className="text-xs text-red-500 font-bold">{errors.firstName}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">Legal Last Name *</label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleTextChange}
                          className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none"
                          placeholder="E.g., Doe"
                        />
                        {errors.lastName && <p className="text-xs text-red-500 font-bold">{errors.lastName}</p>}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-4">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-bold text-slate-400">Email Address *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleTextChange}
                          className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none"
                          placeholder="E.g., john.doe@example.com"
                        />
                        {errors.email && <p className="text-xs text-red-500 font-bold">{errors.email}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">Phone Number *</label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleTextChange}
                          className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none"
                          placeholder="E.g., (555) 000-0000"
                        />
                        {errors.phone && <p className="text-xs text-red-500 font-bold">{errors.phone}</p>}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400">Date of Birth *</label>
                      <input
                        type="date"
                        name="dob"
                        value={formData.dob}
                        onChange={handleTextChange}
                        className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none [color-scheme:dark]"
                      />
                      {errors.dob && <p className="text-xs text-red-500 font-bold">{errors.dob}</p>}
                    </div>

                    {/* Current Address */}
                    <div className="border-t border-brand-border pt-5 space-y-4">
                      <h4 className="text-sm font-bold text-slate-200">Current Residential Address</h4>
                      
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="space-y-1 sm:col-span-2">
                          <label className="text-xs font-bold text-slate-400">Street Address *</label>
                          <input
                            type="text"
                            name="addressStreet"
                            value={formData.addressStreet}
                            onChange={handleTextChange}
                            className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none"
                            placeholder="E.g., 123 Main St"
                          />
                          {errors.addressStreet && <p className="text-xs text-red-500 font-bold">{errors.addressStreet}</p>}
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400">Apt / Suite / Line 2</label>
                          <input
                            type="text"
                            name="addressLine2"
                            value={formData.addressLine2}
                            onChange={handleTextChange}
                            className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none"
                            placeholder="E.g., Apt 4B"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400">City *</label>
                          <input
                            type="text"
                            name="addressCity"
                            value={formData.addressCity}
                            onChange={handleTextChange}
                            className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none"
                            placeholder="City"
                          />
                          {errors.addressCity && <p className="text-xs text-red-500 font-bold">{errors.addressCity}</p>}
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400">State *</label>
                          <input
                            type="text"
                            name="addressState"
                            value={formData.addressState}
                            onChange={handleTextChange}
                            className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none"
                            placeholder="State"
                          />
                          {errors.addressState && <p className="text-xs text-red-500 font-bold">{errors.addressState}</p>}
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400">ZIP Code *</label>
                          <input
                            type="text"
                            name="addressZip"
                            value={formData.addressZip}
                            onChange={handleTextChange}
                            className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none"
                            placeholder="Zip"
                          />
                          {errors.addressZip && <p className="text-xs text-red-500 font-bold">{errors.addressZip}</p>}
                        </div>
                      </div>

                      {/* Duration Choice */}
                      <div className="space-y-2 pt-2">
                        <label className="text-xs font-bold text-slate-400 block">How long have you lived at this address? *</label>
                        <div className="flex gap-4">
                          <label className="flex items-center gap-2 cursor-pointer border border-brand-border rounded-lg px-4 py-2.5 bg-brand-dark hover:bg-brand-dark/50 flex-1">
                            <input
                              type="radio"
                              name="addressDuration"
                              checked={formData.addressDuration === "3 years or more"}
                              onChange={() => {
                                setFormData(prev => ({ ...prev, addressDuration: "3 years or more", hasPrevAddress: false }));
                              }}
                              className="accent-gold"
                            />
                            <span className="text-sm font-semibold text-slate-300">3 years or more</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer border border-brand-border rounded-lg px-4 py-2.5 bg-brand-dark hover:bg-brand-dark/50 flex-1">
                            <input
                              type="radio"
                              name="addressDuration"
                              checked={formData.addressDuration === "Less than 3 years"}
                              onChange={() => {
                                setFormData(prev => ({ ...prev, addressDuration: "Less than 3 years", hasPrevAddress: true }));
                              }}
                              className="accent-gold"
                            />
                            <span className="text-sm font-semibold text-slate-300">Less than 3 years</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Previous Address (Conditional) */}
                    {formData.hasPrevAddress && (
                      <div className="space-y-4 pt-5 border-t border-brand-border bg-brand-dark/30 p-4 rounded-xl border border-gold/20">
                        <h4 className="text-sm font-bold text-slate-200">Previous Address (required to complete 3-year history)</h4>
                        
                        <div className="grid sm:grid-cols-3 gap-4">
                          <div className="space-y-1 sm:col-span-2">
                            <label className="text-xs font-bold text-slate-400">Street Address *</label>
                            <input
                              type="text"
                              name="prevAddressStreet"
                              value={formData.prevAddressStreet}
                              onChange={handleTextChange}
                              className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none"
                              placeholder="E.g., 456 Old Lane"
                            />
                            {errors.prevAddressStreet && <p className="text-xs text-red-500 font-bold">{errors.prevAddressStreet}</p>}
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400">Apt / Line 2</label>
                            <input
                              type="text"
                              name="prevAddressLine2"
                              value={formData.prevAddressLine2}
                              onChange={handleTextChange}
                              className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none"
                              placeholder="Line 2"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400">City *</label>
                            <input
                              type="text"
                              name="prevAddressCity"
                              value={formData.prevAddressCity}
                              onChange={handleTextChange}
                              className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none"
                              placeholder="City"
                            />
                            {errors.prevAddressCity && <p className="text-xs text-red-500 font-bold">{errors.prevAddressCity}</p>}
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400">State *</label>
                            <input
                              type="text"
                              name="prevAddressState"
                              value={formData.prevAddressState}
                              onChange={handleTextChange}
                              className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none"
                              placeholder="State"
                            />
                            {errors.prevAddressState && <p className="text-xs text-red-500 font-bold">{errors.prevAddressState}</p>}
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400">ZIP Code *</label>
                            <input
                              type="text"
                              name="prevAddressZip"
                              value={formData.prevAddressZip}
                              onChange={handleTextChange}
                              className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none"
                              placeholder="Zip"
                            />
                            {errors.prevAddressZip && <p className="text-xs text-red-500 font-bold">{errors.prevAddressZip}</p>}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 2: CDL INFO */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="border-b border-brand-border pb-4">
                      <h2 className="text-2xl font-black text-slate-50">CDL License & Endorsements</h2>
                      <p className="text-xs text-slate-400 mt-1">Provide your Commercial Driver&apos;s License credentials and any certifications you possess.</p>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">CDL License Number *</label>
                        <input
                          type="text"
                          name="cdlNumber"
                          value={formData.cdlNumber}
                          onChange={handleTextChange}
                          className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none"
                          placeholder="CDL Number"
                        />
                        {errors.cdlNumber && <p className="text-xs text-red-500 font-bold">{errors.cdlNumber}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">CDL License State *</label>
                        <input
                          type="text"
                          name="cdlState"
                          value={formData.cdlState}
                          onChange={handleTextChange}
                          className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none"
                          placeholder="MO / IL / KS"
                        />
                        {errors.cdlState && <p className="text-xs text-red-500 font-bold">{errors.cdlState}</p>}
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">CDL Classification *</label>
                        <select
                          name="cdlClass"
                          value={formData.cdlClass}
                          onChange={handleTextChange}
                          className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none"
                        >
                          <option value="Class A">Class A CDL (Tractor-Trailer)</option>
                          <option value="Class B">Class B CDL (Straight Truck)</option>
                          <option value="Class C">Class C CDL</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400">CDL Expiration Date *</label>
                        <input
                          type="date"
                          name="cdlExpiration"
                          value={formData.cdlExpiration}
                          onChange={handleTextChange}
                          className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none [color-scheme:dark]"
                        />
                        {errors.cdlExpiration && <p className="text-xs text-red-500 font-bold">{errors.cdlExpiration}</p>}
                      </div>
                    </div>

                    {/* Endorsements Checklist */}
                    <div className="space-y-3 pt-4 border-t border-brand-border">
                      <label className="text-xs font-bold text-slate-400 block">CDL Endorsements</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          "None",
                          "Double/Triple (T)",
                          "Tanker (N)",
                          "Hazmat (H)",
                          "Combined Tank/Hazmat (X)",
                          "Passenger (P)"
                        ].map((end) => (
                          <label key={end} className="flex items-center gap-3 bg-brand-dark border border-brand-border p-3 rounded-lg cursor-pointer hover:border-gold/40">
                            <input
                              type="checkbox"
                              checked={formData.endorsements.includes(end)}
                              onChange={() => handleEndorsementToggle(end)}
                              className="h-4 w-4 accent-gold"
                            />
                            <span className="text-xs font-semibold text-slate-300">{end}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Other states check */}
                    <div className="space-y-3 pt-4 border-t border-brand-border">
                      <label className="text-xs font-bold text-slate-400 block">Have you held a CDL in any other state in the past 10 years? *</label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => handleCheckboxChange("cdlTenYears", true)}
                          className={`px-6 py-2 rounded-lg text-xs font-bold border transition-all ${
                            formData.cdlTenYears 
                              ? "bg-gold text-brand-dark border-gold" 
                              : "border-brand-border text-slate-400 bg-brand-dark hover:bg-brand-dark/50"
                          }`}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCheckboxChange("cdlTenYears", false)}
                          className={`px-6 py-2 rounded-lg text-xs font-bold border transition-all ${
                            !formData.cdlTenYears 
                              ? "bg-slate-700 text-slate-200 border-slate-700" 
                              : "border-brand-border text-slate-400 bg-brand-dark hover:bg-brand-dark/50"
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>

                    {/* Referral */}
                    <div className="space-y-1 pt-4 border-t border-brand-border">
                      <label className="text-xs font-bold text-slate-400 font-sans">How did you hear about us?</label>
                      <select
                        name="referral"
                        value={formData.referral}
                        onChange={handleTextChange}
                        className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none"
                      >
                        <option value="">Select Referral Source</option>
                        <option value="Craigslist">Craigslist</option>
                        <option value="Indeed">Indeed</option>
                        <option value="Facebook">Facebook / Social Media</option>
                        <option value="Driver Referral">Driver Referral</option>
                        <option value="Recruiter">Recruiter</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* STEP 3: EMPLOYMENT HISTORY */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="border-b border-brand-border pb-4">
                      <h2 className="text-2xl font-black text-slate-55">10-Year Employment History</h2>
                      <p className="text-xs text-slate-400 mt-1">
                        DOT regulations (49 CFR §391.21) require a commercial driver applicant to list all commercial driving employment for the past 10 years.
                      </p>
                    </div>

                    {/* List of current added employers */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-bold text-slate-300">Employers Added ({formData.employmentHistory.length})</h4>
                      
                      {formData.employmentHistory.length === 0 ? (
                        <div className="border border-dashed border-brand-border rounded-xl p-8 text-center text-xs text-slate-500 bg-brand-dark/30">
                          No employers added yet. Please click the button below to add your jobs.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {formData.employmentHistory.map((job, idx) => (
                            <div key={idx} className="border border-brand-border bg-brand-dark/50 rounded-xl p-4 flex justify-between items-start gap-4">
                              <div className="space-y-1">
                                <span className="font-bold text-sm text-slate-200">{job.employer}</span>
                                <div className="text-xs text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                                  <span>Position: <strong>{job.position}</strong></span>
                                  <span>Location: <strong>{job.city}, {job.state}</strong></span>
                                  <span>Dates: <strong>{job.startDate} - {job.endDate}</strong></span>
                                </div>
                                <div className="text-[10px] text-slate-500 space-x-2 pt-1">
                                  <span>CMV Regulated: {job.isCmvr ? "Yes" : "No"}</span>
                                  <span>•</span>
                                  <span>DOT Drug Tested: {job.isDotTest ? "Yes" : "No"}</span>
                                </div>
                              </div>
                              <button 
                                type="button"
                                onClick={() => removeEmployer(idx)}
                                className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg transition"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {errors.employmentHistory && <p className="text-xs text-red-500 font-bold">{errors.employmentHistory}</p>}

                      {/* Add Employer Sub-form */}
                      {showEmployerForm ? (
                        <div className="border border-gold/30 bg-gold/5 rounded-xl p-6 space-y-4 relative">
                          <h5 className="font-bold text-xs text-gold uppercase tracking-widest">Add Employer Details</h5>
                          
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-400">Employer Name *</label>
                              <input
                                type="text"
                                value={employerForm.employer}
                                onChange={(e) => setEmployerForm(prev => ({ ...prev, employer: e.target.value }))}
                                className="w-full rounded-lg border border-brand-border bg-brand-dark px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold"
                                placeholder="E.g., Swift Transport"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400">City</label>
                                <input
                                  type="text"
                                  value={employerForm.city}
                                  onChange={(e) => setEmployerForm(prev => ({ ...prev, city: e.target.value }))}
                                  className="w-full rounded-lg border border-brand-border bg-brand-dark px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold"
                                  placeholder="City"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-400">State</label>
                                <input
                                  type="text"
                                  value={employerForm.state}
                                  onChange={(e) => setEmployerForm(prev => ({ ...prev, state: e.target.value }))}
                                  className="w-full rounded-lg border border-brand-border bg-brand-dark px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold"
                                  placeholder="MO"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="grid sm:grid-cols-3 gap-4">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-400">Position Held *</label>
                              <input
                                type="text"
                                value={employerForm.position}
                                onChange={(e) => setEmployerForm(prev => ({ ...prev, position: e.target.value }))}
                                className="w-full rounded-lg border border-brand-border bg-brand-dark px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold"
                                placeholder="E.g., OTR Driver"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-400">Start Date *</label>
                              <input
                                type="text"
                                value={employerForm.startDate}
                                onChange={(e) => setEmployerForm(prev => ({ ...prev, startDate: e.target.value }))}
                                className="w-full rounded-lg border border-brand-border bg-brand-dark px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold"
                                placeholder="MM/YYYY"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-400">End Date *</label>
                              <input
                                type="text"
                                value={employerForm.endDate}
                                onChange={(e) => setEmployerForm(prev => ({ ...prev, endDate: e.target.value }))}
                                className="w-full rounded-lg border border-brand-border bg-brand-dark px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold"
                                placeholder="MM/YYYY or 'Present'"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400">Reason for Leaving</label>
                            <input
                              type="text"
                              value={employerForm.reasonLeaving}
                              onChange={(e) => setEmployerForm(prev => ({ ...prev, reasonLeaving: e.target.value }))}
                              className="w-full rounded-lg border border-brand-border bg-brand-dark px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-gold"
                              placeholder="Reason for leaving"
                            />
                          </div>

                          <div className="grid sm:grid-cols-2 gap-4 pt-2">
                            <label className="flex items-center gap-2 cursor-pointer border border-brand-border bg-brand-dark p-2.5 rounded-lg text-xs font-semibold text-slate-300">
                              <input
                                type="checkbox"
                                checked={employerForm.isCmvr}
                                onChange={(e) => setEmployerForm(prev => ({ ...prev, isCmvr: e.target.checked }))}
                                className="accent-gold"
                              />
                              <span>Subject to FMCSR regulations?</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer border border-brand-border bg-brand-dark p-2.5 rounded-lg text-xs font-semibold text-slate-300">
                              <input
                                type="checkbox"
                                checked={employerForm.isDotTest}
                                onChange={(e) => setEmployerForm(prev => ({ ...prev, isDotTest: e.target.checked }))}
                                className="accent-gold"
                              />
                              <span>Subject to DOT drug/alcohol testing?</span>
                            </label>
                          </div>

                          {employerFormError && <p className="text-xs text-red-500 font-bold">{employerFormError}</p>}

                          <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
                            <button
                              type="button"
                              onClick={() => setShowEmployerForm(false)}
                              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={addEmployer}
                              className="px-4 py-2 rounded-lg bg-gold text-brand-dark font-bold text-xs hover:bg-gold-hover"
                            >
                              Save Employer
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEmployerFormError("");
                            setShowEmployerForm(true);
                          }}
                          className="flex items-center justify-center gap-2 w-full border border-dashed border-gold/40 p-3 text-xs font-bold text-gold hover:bg-gold/5 rounded-xl transition"
                        >
                          <Plus className="h-4 w-4" /> Add Employer
                        </button>
                      )}
                    </div>

                    {/* Employment Gaps check */}
                    <div className="border-t border-brand-border pt-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="employmentGaps"
                          checked={formData.employmentGaps}
                          onChange={(e) => handleCheckboxChange("employmentGaps", e.target.checked)}
                          className="h-4 w-4 accent-gold"
                        />
                        <label htmlFor="employmentGaps" className="text-xs text-slate-400 font-bold cursor-pointer">
                          I have gaps in my employment history in the last 10 years (e.g. unemployment, medical, education).
                        </label>
                      </div>

                      {formData.employmentGaps && (
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-slate-400">Explain Employment Gaps *</label>
                          <textarea
                            name="gapsDetail"
                            value={formData.gapsDetail}
                            onChange={handleTextChange}
                            rows={3}
                            className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-xs text-slate-200 focus:border-gold focus:outline-none"
                            placeholder="E.g. December 2021 to March 2022: Unemployed due to medical recovery."
                          />
                          {errors.gapsDetail && <p className="text-xs text-red-500 font-bold">{errors.gapsDetail}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 4: EXPERIENCE */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="border-b border-brand-border pb-4">
                      <h2 className="text-2xl font-black text-slate-50">Driving Experience</h2>
                      <p className="text-xs text-slate-400 mt-1">Specify your total commercial road experience and trailer types you are qualified to pull.</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400">Years of Commercial Experience *</label>
                      <select
                        name="yearsExperience"
                        value={formData.yearsExperience}
                        onChange={handleTextChange}
                        className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none"
                      >
                        <option value="Less than 2 years">Less than 2 years</option>
                        <option value="2-3 years">2 - 3 years</option>
                        <option value="4-7 years">4 - 7 years</option>
                        <option value="8-10 years">8 - 10 years</option>
                        <option value="10+ years">10 years or more</option>
                      </select>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-brand-border">
                      <label className="text-xs font-bold text-slate-400 block">Equipment & Trailer Configurations Run</label>
                      <p className="text-[11px] text-slate-500">Select all configurations you have verifiable OTR experience hauling:</p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          "Dry Van",
                          "Temp-controlled (Reefer)",
                          "Hopper / Bulk",
                          "Flatbed",
                          "Step Deck",
                          "Lowboy",
                          "Tanker"
                        ].map((equip) => (
                          <label key={equip} className="flex items-center gap-3 bg-brand-dark border border-brand-border p-3 rounded-lg cursor-pointer hover:border-gold/40">
                            <input
                              type="checkbox"
                              checked={formData.equipmentOperated.includes(equip)}
                              onChange={() => handleEquipmentToggle(equip)}
                              className="h-4 w-4 accent-gold"
                            />
                            <span className="text-xs font-semibold text-slate-300">{equip}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: ACCIDENTS & SAFETY */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <div className="border-b border-brand-border pb-4">
                      <h2 className="text-2xl font-black text-slate-55">Accidents & Violations</h2>
                      <p className="text-xs text-slate-400 mt-1">Disclose any DOT recordable accidents or traffic citations for the past 3 years.</p>
                    </div>

                    {/* Accidents query */}
                    <div className="space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <label className="text-sm font-semibold text-slate-300">
                          Have you been involved in any DOT-recordable accidents in the last 3 years? *
                        </label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleCheckboxChange("hasAccidents", true)}
                            className={`px-5 py-2 rounded-lg text-xs font-bold border transition-all ${
                              formData.hasAccidents 
                                ? "bg-gold text-brand-dark border-gold" 
                                : "border-brand-border text-slate-400 bg-brand-dark hover:bg-brand-dark/50"
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleCheckboxChange("hasAccidents", false);
                              setFormData(prev => ({ ...prev, accidentsDetail: "" }));
                            }}
                            className={`px-5 py-2 rounded-lg text-xs font-bold border transition-all ${
                              !formData.hasAccidents 
                                ? "bg-slate-700 text-slate-200 border-slate-700" 
                                : "border-brand-border text-slate-400 bg-brand-dark hover:bg-brand-dark/50"
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                      
                      {formData.hasAccidents && (
                        <div className="space-y-1 pt-1">
                          <label className="text-xs font-bold text-slate-400">Accidents Detail (Date, Location, Injuries, description) *</label>
                          <textarea
                            name="accidentsDetail"
                            value={formData.accidentsDetail}
                            onChange={handleTextChange}
                            rows={3}
                            className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-xs text-slate-200 focus:border-gold focus:outline-none"
                            placeholder="Provide date, location, injuries, and details for each accident..."
                          />
                          {errors.accidentsDetail && <p className="text-xs text-red-500 font-bold">{errors.accidentsDetail}</p>}
                        </div>
                      )}
                    </div>

                    {/* Violations query */}
                    <div className="space-y-3 pt-5 border-t border-brand-border">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <label className="text-sm font-semibold text-slate-300">
                          Have you had any moving violations in the last 3 years? *
                        </label>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleCheckboxChange("hasViolations", true)}
                            className={`px-5 py-2 rounded-lg text-xs font-bold border transition-all ${
                              formData.hasViolations 
                                ? "bg-gold text-brand-dark border-gold" 
                                : "border-brand-border text-slate-400 bg-brand-dark hover:bg-brand-dark/50"
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleCheckboxChange("hasViolations", false);
                              setFormData(prev => ({ ...prev, violationsDetail: "" }));
                            }}
                            className={`px-5 py-2 rounded-lg text-xs font-bold border transition-all ${
                              !formData.hasViolations 
                                ? "bg-slate-700 text-slate-200 border-slate-700" 
                                : "border-brand-border text-slate-400 bg-brand-dark hover:bg-brand-dark/50"
                            }`}
                          >
                            No
                          </button>
                        </div>
                      </div>
                      
                      {formData.hasViolations && (
                        <div className="space-y-1 pt-1">
                          <label className="text-xs font-bold text-slate-400">Violations Detail (Date, Location, Violation description) *</label>
                          <textarea
                            name="violationsDetail"
                            value={formData.violationsDetail}
                            onChange={handleTextChange}
                            rows={3}
                            className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-xs text-slate-200 focus:border-gold focus:outline-none"
                            placeholder="Provide date, location, speed/violation, and state..."
                          />
                          {errors.violationsDetail && <p className="text-xs text-red-500 font-bold">{errors.violationsDetail}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 6: DRUG & ALCOHOL */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <div className="border-b border-brand-border pb-4">
                      <h2 className="text-2xl font-black text-slate-50">DOT Drug & Alcohol Status</h2>
                      <p className="text-xs text-slate-400 mt-1">SAP (Substance Abuse Professional) Disclosure</p>
                    </div>

                    <div className="space-y-4">
                      <label className="text-sm font-semibold text-slate-300 block">
                        Are you currently participating in a DOT Return-to-Duty or Substance Abuse Professional (SAP) process? *
                      </label>
                      
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => handleCheckboxChange("sapStatus", false)}
                          className={`px-6 py-2.5 rounded-lg text-xs font-bold border transition-all ${
                            !formData.sapStatus 
                              ? "bg-slate-700 text-slate-200 border-slate-700" 
                              : "border-brand-border text-slate-400 bg-brand-dark hover:bg-brand-dark/50"
                          }`}
                        >
                          No
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCheckboxChange("sapStatus", true)}
                          className={`px-6 py-2.5 rounded-lg text-xs font-bold border transition-all ${
                            formData.sapStatus 
                              ? "bg-gold text-brand-dark border-gold" 
                              : "border-brand-border text-slate-400 bg-brand-dark hover:bg-brand-dark/50"
                          }`}
                        >
                          Yes
                        </button>
                      </div>

                      <p className="text-xs text-slate-500 italic">Selecting &apos;Yes&apos; does not automatically disqualify you.</p>

                      <div className="rounded-xl border border-gold/30 bg-gold/5 p-5 text-xs text-gold/80 leading-relaxed shadow-sm">
                        <strong>Note:</strong> If you are currently in a SAP process, you will be asked to provide documentation of your progress during the onboarding review. Selecting &apos;Yes&apos; does not automatically disqualify you.
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 7: DOCUMENTS UPLOADS */}
                {currentStep === 7 && (
                  <div className="space-y-6">
                    <div className="border-b border-brand-border pb-4">
                      <h2 className="text-2xl font-black text-slate-55">Document Uploads</h2>
                      <p className="text-xs text-slate-400 mt-1">Upload clear photos or scans of the following documents. JPG, PNG, and PDF files are accepted.</p>
                    </div>

                    <div className="rounded-xl border border-gold/20 bg-gold/5 p-4 text-xs text-gold flex items-start gap-2 shadow-sm">
                      <span className="font-bold text-sm leading-none pt-0.5">ⓘ</span>
                      <span><strong>File requirements:</strong> PDF, JPG, or PNG only - Maximum 10 MB per file</span>
                    </div>

                    <div className="space-y-6 pt-2">
                      {renderDocumentUploadCard(
                        "docDlFront",
                        "Front of Driver's License *",
                        "Tap to upload or drag & drop",
                        "Photo must be clear and all text readable",
                        errors.docDlFront
                      )}

                      {renderDocumentUploadCard(
                        "docDlBack",
                        "Rear of Driver's License *",
                        "Tap to upload or drag & drop",
                        "Photo must be clear and all text readable",
                        errors.docDlBack
                      )}

                      {renderDocumentUploadCard(
                        "docMedCert",
                        "Medical Certificate (Short Form) *",
                        "Tap to upload or drag & drop",
                        "Must be current and not expired",
                        errors.docMedCert
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 8: DISCLOSURES */}
                {currentStep === 8 && (
                  <div className="space-y-6">
                    <div className="border-b border-brand-border pb-4">
                      <h2 className="text-2xl font-black text-slate-50">Disclosures & Authorizations</h2>
                      <p className="text-xs text-slate-400 mt-1">Please read and authorize each disclosure below.</p>
                    </div>

                    {/* FCRA */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Fair Credit Reporting Act Authorization</h4>
                      <div className="rounded-lg border border-brand-border bg-brand-dark/50 p-4 max-h-[120px] overflow-y-auto text-[11px] text-slate-400 leading-relaxed">
                        I hereby authorize SUPERTRANSPORT to conduct a background investigation through a consumer reporting agency as permitted by the Fair Credit Reporting Act. This investigation may include, but is not limited to: Social Security Number verification, residential history, employment history, education verification, personal and professional references, credit history, criminal records, motor vehicle records (MVR), and any other public records deemed relevant. I understand that this investigation is a condition of my application and continued employment.
                      </div>
                    </div>

                    {/* PSP */}
                    <div className="space-y-3 pt-4 border-t border-brand-border">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">PSP Authorization</h4>
                      <div className="rounded-lg border border-brand-border bg-brand-dark/50 p-4 max-h-[120px] overflow-y-auto text-[11px] text-slate-400 leading-relaxed">
                        <strong>Important Disclosure Regarding Background Reports from the PSP Online Service</strong>
                        <p className="mt-1">In connection with your application for employment with SUPERTRANSPORT, LLC, we may obtain one or more reports regarding your driving and safety inspection history from the Federal Motor Carrier Safety Administration (FMCSA). If any adverse employment decision is made based on this information, you will be notified and provided a copy of the report.</p>
                        <p className="mt-1">Neither the Prospective Employer nor the FMCSA contractor has the capability to correct safety data. You may challenge the accuracy of the data at https://dataqs.fmcsa.dot.gov.</p>
                      </div>
                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-3 pt-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.fcraConsent}
                          onChange={(e) => handleCheckboxChange("fcraConsent", e.target.checked)}
                          className="mt-1 h-4 w-4 accent-gold"
                        />
                        <span className="text-xs font-semibold text-slate-300 leading-relaxed">
                          I authorize SUPERTRANSPORT, LLC to access the FMCSA Pre-Employment Screening Program (PSP) system to seek information regarding my commercial driving safety record and safety inspection history, including crash data from the previous five (5) years and inspection history from the previous three (3) years.
                        </span>
                      </label>
                      {errors.fcraConsent && <p className="text-xs text-red-500 font-bold">{errors.fcraConsent}</p>}

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.clearinghouseConsent}
                          onChange={(e) => handleCheckboxChange("clearinghouseConsent", e.target.checked)}
                          className="mt-1 h-4 w-4 accent-gold"
                        />
                        <span className="text-xs font-semibold text-slate-300 leading-relaxed">
                          I consent to the release of information regarding my DOT drug and alcohol testing history from previous employers, including the FMCSA Drug & Alcohol Clearinghouse.
                        </span>
                      </label>
                      {errors.clearinghouseConsent && <p className="text-xs text-red-500 font-bold">{errors.clearinghouseConsent}</p>}

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.pspConsent}
                          onChange={(e) => handleCheckboxChange("pspConsent", e.target.checked)}
                          className="mt-1 h-4 w-4 accent-gold"
                        />
                        <span className="text-xs font-semibold text-slate-300 leading-relaxed">
                          I have read the above Disclosure Regarding Background Reports and I hereby authorize Prospective Employer and its employees, authorized agents, and/or affiliates to obtain the information authorized above.
                        </span>
                      </label>
                      {errors.pspConsent && <p className="text-xs text-red-500 font-bold">{errors.pspConsent}</p>}
                    </div>

                    {/* Pre-employment drug query */}
                    <div className="border-t border-brand-border pt-5 space-y-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">DOT Drug & Alcohol Pre-Employment Questions</h4>
                      <div className="rounded-xl border border-brand-border bg-brand-dark/50 p-4 text-[11px] text-slate-400 leading-relaxed">
                        <strong>49 CFR Part 40.25(j) Notice:</strong> As required by federal regulations, you must answer the following questions truthfully. This information will be used to assess your eligibility to perform safety-sensitive transportation functions.
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-300">
                            1. Have you tested positive, or refused to test, on any pre-employment drug or alcohol test administered by an employer to which you applied for, but did not obtain, safety-sensitive transportation work covered by DOT agency drug and alcohol testing rules during the past two years? *
                          </label>
                          <div className="flex gap-4">
                            <button
                              type="button"
                              onClick={() => {
                                handleCheckboxChange("drugTestPositive", false);
                                handleCheckboxChange("drugTestDoc", false);
                              }}
                              className={`px-5 py-2 rounded-lg text-xs font-bold border transition-all ${
                                !formData.drugTestPositive 
                                  ? "bg-[#1E293B] text-slate-200 border-transparent" 
                                  : "border-brand-border text-slate-400 bg-brand-dark hover:bg-brand-dark/50"
                              }`}
                            >
                              No
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCheckboxChange("drugTestPositive", true)}
                              className={`px-5 py-2 rounded-lg text-xs font-bold border transition-all ${
                                formData.drugTestPositive 
                                  ? "bg-gold text-brand-dark border-gold" 
                                  : "border-brand-border text-slate-400 bg-brand-dark hover:bg-brand-dark/50"
                              }`}
                            >
                              Yes
                            </button>
                          </div>
                        </div>

                        {formData.drugTestPositive && (
                          <div className="space-y-3 bg-brand-dark/40 p-4 rounded-xl border border-gold/20">
                            <label className="text-xs font-bold text-slate-300">
                              2. Can you provide documentation of successful completion of DOT return-to-duty requirements (including follow-up tests)? *
                            </label>
                            <div className="flex gap-4">
                              <button
                                type="button"
                                onClick={() => handleCheckboxChange("drugTestDoc", false)}
                                className={`px-5 py-2 rounded-lg text-xs font-bold border transition-all ${
                                  !formData.drugTestDoc 
                                    ? "bg-[#1E293B] text-slate-200 border-transparent" 
                                    : "border-brand-border text-slate-400 bg-brand-dark hover:bg-brand-dark/50"
                                }`}
                              >
                                No
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCheckboxChange("drugTestDoc", true)}
                                className={`px-5 py-2 rounded-lg text-xs font-bold border transition-all ${
                                  formData.drugTestDoc 
                                    ? "bg-gold text-brand-dark border-gold" 
                                    : "border-brand-border text-slate-400 bg-brand-dark hover:bg-brand-dark/50"
                                }`}
                              >
                                Yes
                              </button>
                            </div>
                            {errors.drugTestDoc && <p className="text-xs text-red-500 font-bold">{errors.drugTestDoc}</p>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Company testing policy receipt */}
                    <div className="border-t border-brand-border pt-5 space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Certificate of Receipt — Company Testing Policy</h4>
                      <div className="rounded-lg border border-brand-border bg-brand-dark/50 p-4 max-h-[100px] overflow-y-auto text-[11px] text-slate-400 leading-relaxed">
                        <strong>SUPERTRANSPORT — Federal Motor Carrier Safety Compliance Notice</strong>
                        <p className="mt-1">By accepting these terms, you acknowledge that you have received, read, and understand SUPERTRANSPORT&apos;s Drug and Alcohol Policy as required by 49 CFR §382.601. You certify that you are familiar with the requirements of 49 CFR Parts 40, 382, and 391, and you agree to comply with all applicable FMCSA regulations while operating under SUPERTRANSPORT&apos;s authority.</p>
                      </div>
                      <label className="flex items-start gap-3 cursor-pointer pt-1">
                        <input
                          type="checkbox"
                          checked={formData.companyPolicyConsent}
                          onChange={(e) => handleCheckboxChange("companyPolicyConsent", e.target.checked)}
                          className="mt-1 h-4 w-4 accent-gold"
                        />
                        <span className="text-xs font-semibold text-slate-300 leading-relaxed">
                          I accept the Terms and Conditions, acknowledge receipt of the Company Drug & Alcohol Testing Policy, and certify that all information in this application is true and complete.
                        </span>
                      </label>
                      {errors.companyPolicyConsent && <p className="text-xs text-red-500 font-bold">{errors.companyPolicyConsent}</p>}
                    </div>
                  </div>
                )}

                {/* STEP 9: SIGNATURE & SUBMIT */}
                {currentStep === 9 && (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="border-b border-brand-border pb-4">
                      <h2 className="text-2xl font-black text-slate-50">Certification & Signature</h2>
                      <p className="text-xs text-slate-400 mt-1">Review the certification statement and provide your electronic signature below.</p>
                    </div>

                    <div className="rounded-xl border border-brand-border bg-brand-dark/50 p-5 text-xs text-slate-400 leading-relaxed">
                      <strong>Certification:</strong> I certify that all information provided in this application is true, correct, and complete to the best of my knowledge. I understand that: providing false or misleading information may result in disqualification or termination; the motor carrier will conduct independent verification as required by FMCSA; approximate information is acceptable when exact details are unavailable. I authorize all investigations and release of information described in this application.
                    </div>

                    {/* SSN Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 block">Social Security Number *</label>
                      <div className="relative max-w-sm">
                        <input
                          type={showSSN ? "text" : "password"}
                          name="ssn"
                          value={formData.ssn}
                          onChange={handleTextChange}
                          className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none pr-10 font-mono tracking-widest"
                          placeholder="XXX-XX-XXXX"
                          maxLength={11}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSSN(!showSSN)}
                          className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-350 transition"
                        >
                          {showSSN ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">Required by FMCSA per 49 CFR § 391.21. Your SSN is encrypted and stored securely.</p>
                      {errors.ssn && <p className="text-xs text-red-500 font-bold">{errors.ssn}</p>}
                    </div>

                    {/* Typed name */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 block">Type Your Full Legal Name *</label>
                      <input
                        type="text"
                        name="signatureName"
                        value={formData.signatureName}
                        onChange={handleTextChange}
                        className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 focus:border-gold focus:outline-none"
                        placeholder="Type your full legal name"
                      />
                      <p className="text-[10px] text-slate-550">This serves as your electronic signature acknowledgment</p>
                      {errors.signatureName && <p className="text-xs text-red-500 font-bold">{errors.signatureName}</p>}
                    </div>

                    {/* Signature Pad */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-400 block">Signature *</label>
                        <button
                          type="button"
                          onClick={clearSignature}
                          className="text-xs font-bold text-gold hover:text-gold-hover flex items-center gap-1 hover:bg-brand-dark/60 px-2.5 py-1 rounded transition"
                        >
                          ⟲ Clear
                        </button>
                      </div>

                      <div className="rounded-xl border border-brand-border bg-slate-100 overflow-hidden shadow-inner">
                        <canvas
                          ref={canvasRef}
                          width={600}
                          height={200}
                          onMouseDown={startDrawing}
                          onMouseUp={stopDrawing}
                          onMouseOut={stopDrawing}
                          onMouseMove={draw}
                          onTouchStart={startDrawing}
                          onTouchEnd={stopDrawing}
                          onTouchMove={draw}
                          className="w-full h-[200px] cursor-crosshair touch-none bg-slate-100"
                        />
                      </div>
                      {errors.signatureData && <p className="text-xs text-red-500 font-bold">{errors.signatureData}</p>}
                    </div>

                    {/* Date */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400">Date</label>
                      <input
                        type="text"
                        value={new Date().toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}
                        disabled
                        className="w-full rounded-lg border border-brand-border bg-brand-dark/40 px-4 py-3 text-sm text-slate-500 cursor-not-allowed font-semibold"
                      />
                    </div>
                  </form>
                )}

                {/* Bottom Navigation Buttons */}
                <div className="flex justify-between items-center border-t border-brand-border pt-6 mt-8">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex items-center gap-2 rounded-xl border border-slate-700 bg-brand-dark/50 px-6 py-2.5 text-xs font-bold text-slate-300 hover:bg-brand-card hover:text-slate-100 transition"
                      disabled={isSubmitting}
                    >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                  ) : (
                    <div />
                  )}

                  <div className="flex gap-2">
                    {/* Save Draft Button */}
                    <button
                      type="button"
                      onClick={saveDraft}
                      className="flex items-center gap-2 rounded-xl border border-slate-700 bg-brand-dark/50 px-6 py-2.5 text-xs font-bold text-slate-300 hover:bg-brand-card hover:text-slate-100 transition"
                      disabled={isSubmitting}
                    >
                      💾 Save Draft
                    </button>

                    {currentStep < 9 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="flex items-center gap-2 rounded-xl bg-gold hover:bg-gold-hover px-8 py-3 text-xs font-black text-brand-dark transition-all shadow-md cursor-pointer"
                      >
                        Continue <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-2 rounded-xl bg-gold hover:bg-gold-hover px-10 py-3.5 text-xs font-black text-brand-dark disabled:opacity-50 transition-all shadow-md cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                          </>
                        ) : (
                          "Submit Application"
                        )}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-brand-border bg-brand-dark py-8 text-center text-xs text-slate-500">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>Copyright &copy; 2026 | SUPERTRANSPORT | All Rights Reserved.</p>
          <div className="flex gap-4">
            <span className="font-semibold text-slate-400">DOT# 2309365</span>
            <span className="text-slate-600">|</span>
            <span className="font-semibold text-slate-400">MC# 788425</span>
          </div>
        </div>
      </footer>

      {/* Floating Toast Notification */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 rounded-xl border p-4 shadow-2xl transition-all duration-300 max-w-sm ${
          toast.type === "success" 
            ? "border-emerald-500/20 bg-brand-card text-emerald-400" 
            : toast.type === "error" 
              ? "border-rose-500/20 bg-brand-card text-rose-450" 
              : "border-gold/20 bg-brand-card text-gold"
        }`}>
          <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
            toast.type === "success" 
              ? "bg-emerald-500/10 text-emerald-400" 
              : toast.type === "error" 
                ? "bg-rose-500/10 text-rose-450" 
                : "bg-gold/10 text-gold"
          }`}>
            {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ⓘ"}
          </div>
          <div className="flex-1 text-[11px] font-bold text-slate-200">
            {toast.message}
          </div>
          <button 
            type="button" 
            onClick={() => setToast(prev => ({ ...prev, show: false }))}
            className="text-slate-500 hover:text-slate-350 text-[10px] pl-1 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {previewModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="relative bg-brand-card border border-brand-border rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-brand-border bg-brand-dark/40">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">{previewModalTitle.replace(" *", "")}</h3>
              <button
                type="button"
                onClick={() => setPreviewModalUrl(null)}
                className="text-slate-450 hover:text-slate-200 text-xs font-bold bg-brand-dark hover:bg-brand-dark/80 px-3 py-1.5 rounded-lg border border-brand-border transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-brand-dark/30 min-h-[300px]">
              {previewModalUrl.startsWith("data:application/pdf") ? (
                <iframe 
                  src={previewModalUrl} 
                  className="w-full h-[65vh] rounded border border-brand-border bg-white"
                  title={previewModalTitle}
                />
              ) : (
                <img 
                  src={previewModalUrl} 
                  alt="Full Preview" 
                  className="max-w-full max-h-[65vh] object-contain rounded shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
