"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  LogOut,
  User,
  FileText,
  Check,
  X,
  Truck,
  AlertTriangle,
  FolderOpen,
  Loader2,
  CalendarDays,
  Shield,
  Eye,
  EyeOff,
  Download,
  Calendar,
  ArrowLeft
} from "lucide-react";

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

interface DriverApplication {
  id: string;
  createdAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dob: string;
  addressStreet: string;
  addressLine2: string | null;
  addressCity: string;
  addressState: string;
  addressZip: string;
  addressDuration: string | null;
  
  prevAddressStreet: string | null;
  prevAddressLine2: string | null;
  prevAddressCity: string | null;
  prevAddressState: string | null;
  prevAddressZip: string | null;
  
  cdlNumber: string;
  cdlState: string;
  cdlClass: string;
  cdlExpiration: string | null;
  endorsements: string | null;
  cdlTenYears: boolean;
  referral: string | null;
  
  employmentHistory: string | null; // serialized JSON array
  employmentGaps: boolean;
  gapsDetail: string | null;
  
  yearsExperience: string;
  equipmentOperated: string;
  
  hasAccidents: boolean;
  accidentsDetail: string | null;
  hasViolations: boolean;
  violationsDetail: string | null;
  
  sapStatus: boolean;
  
  docDlFront: string | null;
  docDlBack: string | null;
  docMedCert: string | null;
  
  fcraConsent: boolean;
  pspConsent: boolean;
  clearinghouseConsent: boolean;
  drugTestPositive: boolean;
  drugTestDoc: boolean;
  companyPolicyConsent: boolean;
  
  ssn: string | null;
  signatureName: string;
  signatureData: string;
  signedAt: string;
  status: string;
}


export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<DriverApplication | null>(null);
  const [mobileActiveView, setMobileActiveView] = useState<"list" | "detail">("list");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Login inputs
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // SSN display security
  const [revealSSN, setRevealSSN] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);

  // Fetch applications
  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/applications");
      if (res.status === 401) {
        setIsAuthenticated(false);
      } else if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
        setIsAuthenticated(true);
        // Default select first application if available
        if (data.applications && data.applications.length > 0) {
          setSelectedApp(data.applications[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load applications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        setIsAuthenticated(true);
        fetchApplications();
      } else {
        const data = await res.json();
        setLoginError(data.error || "Login failed");
      }
    } catch (err) {
      setLoginError("Connection error. Try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/admin/logout", { method: "POST" });
      if (res.ok) {
        setIsAuthenticated(false);
        setApplications([]);
        setSelectedApp(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setIsStatusUpdating(true);
    try {
      const res = await fetch("/api/admin/applications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        // Update local list
        setApplications(prev =>
          prev.map(app => (app.id === id ? { ...app, status: newStatus } : app))
        );
        // Update selected app view
        if (selectedApp?.id === id) {
          setSelectedApp(prev => prev ? { ...prev, status: newStatus } : null);
        }
      } else {
        alert("Failed to update status");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStatusUpdating(false);
    }
  };

  // Helper to render documents — handles direct URLs (Supabase) and legacy Base64
  const renderDocPreview = (docValue: string | null, label: string) => {
    if (!docValue) {
      return (
        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-slate-700 bg-[#0B0F19]/40 rounded-xl text-xs text-slate-500">
          No {label} uploaded.
        </div>
      );
    }

    // Normalize value → always a usable src
    // Case 1: Base64  → use as-is
    // Case 2: full https URL → use as-is
    // Case 3: legacy storage path (e.g. "uuid/john/dl-front.jpg") → build Supabase URL
    let src = docValue;
    if (!docValue.startsWith("data:") && !docValue.startsWith("http")) {
      const SUPABASE_URL = "https://jecympxettyntszbiomc.supabase.co";
      src = `${SUPABASE_URL}/storage/v1/object/public/driver-documents/${docValue}`;
    }

    const isPdf =
      src.startsWith("data:application/pdf") ||
      src.toLowerCase().includes(".pdf");

    const isExternal = src.startsWith("http");

    if (isPdf) {
      return (
        <div className="space-y-2">
          <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-amber-500" />
              <div>
                <span className="text-xs font-bold text-slate-300 block">{label}</span>
                <span className="text-[10px] text-slate-500">Document format: PDF</span>
              </div>
            </div>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-slate-950 transition flex items-center gap-1 text-[11px] font-bold"
            >
              <Download className="h-3.5 w-3.5" /> Open / Download
            </a>
          </div>
          <iframe src={src} className="w-full h-[220px] rounded-lg border border-slate-700 bg-slate-800" />
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs text-slate-400">
          <span className="font-semibold">{label}</span>
          <a
            href={src}
            target={isExternal ? "_blank" : undefined}
            rel={isExternal ? "noopener noreferrer" : undefined}
            download={isExternal ? undefined : `${label.replace(/\s+/g, '_')}.jpg`}
            className="text-[10px] text-amber-500 underline flex items-center gap-0.5"
          >
            {isExternal ? "Open Full Size \u2197" : "Download Image"}
          </a>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900 overflow-hidden flex items-center justify-center h-[220px]">
          <img src={src} alt={label} className="max-h-full max-w-full object-contain" />
        </div>
      </div>
    );
  };

  // Helper to parse employment history
  const getEmploymentList = (historyStr: string | null): EmploymentHistoryItem[] => {
    if (!historyStr) return [];
    try {
      return JSON.parse(historyStr);
    } catch (e) {
      return [];
    }
  };

  // Filter application list
  const filteredApps = applications.filter(app => {
    const nameMatch = `${app.firstName} ${app.lastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = app.email.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = app.phone.includes(searchQuery);
    const searchMatch = nameMatch || emailMatch || phoneMatch;

    const statusMatch = statusFilter === "ALL" || app.status === statusFilter;

    return searchMatch && statusMatch;
  });

  // Render loading state initially
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19]">
        <Loader2 className="h-10 w-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  // Render Login Card
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19] px-6">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#161D2B] p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-[#c5a85c]" />

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-2 text-amber-500 bg-amber-500/10 p-2.5 rounded-xl">
              <Truck className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-black text-slate-50 tracking-wider">SUPERTRANSPORT</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Admin Dashboard Login</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#0B0F19] px-4 py-3 text-sm text-slate-200 focus:border-[#c5a85c] focus:outline-none"
                placeholder="Username"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-[#0B0F19] px-4 py-3 text-sm text-slate-200 focus:border-[#c5a85c] focus:outline-none"
                placeholder="Password"
                required
              />
            </div>

            {loginError && (
              <p className="text-xs text-red-500 font-semibold text-center bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full rounded-lg bg-[#c5a85c] hover:bg-[#b0944f] py-3.5 text-sm font-extrabold text-white transition-colors flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Logging in...
                </>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          <div className="text-center mt-6">
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-300">
              Return to Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render Dashboard
  return (
    <div className="flex h-screen flex-col bg-[#0B0F19] text-slate-100 font-sans">
      {/* Dashboard Top Header */}
      <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-[#161D2B] px-8 shrink-0">
        <div className="flex items-center gap-3">
          <Truck className="h-6 w-6 text-amber-500" />
          <span className="font-black tracking-wider text-slate-50 uppercase text-sm">SUPERTRANSPORT</span>
          <span className="rounded bg-amber-500/10 px-2.5 py-0.5 text-[9px] text-amber-500 font-bold uppercase tracking-wider">
            Safety & Onboarding Panel
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors"
        >
          <LogOut className="h-4 w-4" /> Log Out
        </button>
      </header>

      {/* Main Dashboard Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Column: Applications List */}
        <aside className={`w-full md:w-80 border-r border-slate-800 bg-[#0F1524] flex flex-col shrink-0 ${selectedApp && mobileActiveView === "detail" ? "hidden md:flex" : "flex"}`}>
          {/* Search & Filters */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, phone..."
                className="w-full rounded-lg border border-slate-700 bg-[#0B0F19] pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:border-[#c5a85c] focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#0B0F19] px-3 py-2 text-xs text-slate-200 focus:border-[#c5a85c] focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="text-center p-8 text-xs text-slate-500">
                No submissions found.
              </div>
            ) : (
              filteredApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => {
                    setSelectedApp(app);
                    setRevealSSN(false);
                    setMobileActiveView("detail");
                  }}
                  className={`w-full p-4 text-left transition-all flex flex-col gap-1.5 border-l-4 ${selectedApp?.id === app.id
                      ? "bg-[#161D2B]/90 border-amber-500"
                      : "border-transparent hover:bg-[#161D2B]/30"
                    }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-200 text-xs truncate max-w-[130px]">{app.firstName} {app.lastName}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${app.status === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : app.status === "REJECTED"
                            ? "bg-rose-500/10 text-rose-400"
                            : app.status === "REVIEWED"
                              ? "bg-blue-500/10 text-blue-400"
                              : "bg-amber-500/10 text-amber-400"
                        }`}
                    >
                      {app.status}
                    </span>
                  </div>

                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>CDL: {app.cdlState} {app.cdlClass}</span>
                    <span>{app.yearsExperience}</span>
                  </div>

                  <span className="text-[9px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(app.createdAt).toLocaleDateString()}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Right Column: Submission Details View */}
        <main className={`flex-1 overflow-y-auto bg-[#070A12] p-4 md:p-8 ${!selectedApp || mobileActiveView === "list" ? "hidden md:block" : "block"}`}>
          {selectedApp ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Back to List for Mobile */}
              <button
                onClick={() => setMobileActiveView("list")}
                className="flex md:hidden items-center gap-1 text-xs font-bold text-slate-400 hover:text-gold mb-4 bg-[#161D2B] px-4 py-2.5 rounded-lg border border-slate-800 shadow-sm w-fit"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Applicant List
              </button>
              {/* Header Action Sheet */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#161D2B] p-6 rounded-2xl border border-slate-800 shadow-md">
                <div>
                  <h1 className="text-xl font-black text-slate-50">{selectedApp.firstName} {selectedApp.lastName}</h1>
                  <p className="text-[10px] text-slate-400 mt-0.5">Application ID: <span className="font-mono text-slate-300">{selectedApp.id}</span></p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {isStatusUpdating ? (
                    <div className="flex items-center gap-2 bg-[#0B0F19] border border-slate-800 rounded-lg px-4 py-2 text-[10px] text-gold font-bold">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Updating status & sending email...
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(selectedApp.id, "REVIEWED")}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-700 bg-[#0B0F19] text-[10px] font-bold text-slate-300 hover:border-slate-500 hover:text-slate-100 transition cursor-pointer"
                      >
                        Mark Reviewed
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedApp.id, "APPROVED")}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-500 text-[10px] font-black text-slate-950 hover:bg-emerald-400 transition cursor-pointer"
                      >
                        <Check className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedApp.id, "REJECTED")}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg bg-rose-500 text-[10px] font-black text-slate-950 hover:bg-rose-400 transition cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Grid Content Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                
                {/* 1. Contact & Personal */}
                <div className="rounded-2xl border border-slate-800 bg-[#161D2B] p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <User className="h-4.5 w-4.5 text-amber-500" /> Personal & Residential
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Phone:</span>
                      <span className="font-semibold text-slate-200">{selectedApp.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email:</span>
                      <span className="font-semibold text-slate-200">{selectedApp.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date of Birth:</span>
                      <span className="font-semibold text-slate-200">{selectedApp.dob}</span>
                    </div>
                    <div className="flex justify-between items-center bg-[#0B0F19] p-2.5 rounded-lg border border-slate-800">
                      <span className="text-slate-400 font-semibold font-mono text-[10px]">SSN:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-200 font-semibold">
                          {revealSSN 
                            ? selectedApp.ssn 
                            : selectedApp.ssn 
                              ? `***-**-${selectedApp.ssn.slice(-4)}` 
                              : "Not provided"}
                        </span>
                        {selectedApp.ssn && (
                          <button
                            type="button"
                            onClick={() => setRevealSSN(!revealSSN)}
                            className="text-slate-400 hover:text-amber-500"
                          >
                            {revealSSN ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="pt-2">
                      <span className="text-[10px] text-slate-500 block mb-1">Current Residence ({selectedApp.addressDuration || "3yr+"}):</span>
                      <span className="font-semibold text-slate-300 leading-relaxed block bg-[#0B0F19]/60 p-2 rounded border border-slate-800">
                        {selectedApp.addressStreet}{selectedApp.addressLine2 ? ', ' + selectedApp.addressLine2 : ''}, {selectedApp.addressCity}, {selectedApp.addressState} {selectedApp.addressZip}
                      </span>
                    </div>

                    {selectedApp.prevAddressStreet && (
                      <div className="pt-2 border-t border-slate-800/80">
                        <span className="text-[10px] text-slate-500 block mb-1">Previous Residence (3yr check):</span>
                        <span className="font-semibold text-slate-300 leading-relaxed block bg-[#0B0F19]/40 p-2 rounded border border-slate-800/50">
                          {selectedApp.prevAddressStreet}{selectedApp.prevAddressLine2 ? ', ' + selectedApp.prevAddressLine2 : ''}, {selectedApp.prevAddressCity}, {selectedApp.prevAddressState} {selectedApp.prevAddressZip}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. CDL & Driving */}
                <div className="rounded-2xl border border-slate-800 bg-[#161D2B] p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-amber-500" /> CDL & Endorsements
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">CDL License Number:</span>
                      <span className="font-semibold text-slate-200">{selectedApp.cdlNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">CDL License State:</span>
                      <span className="font-semibold text-slate-200">{selectedApp.cdlState}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">CDL Classification:</span>
                      <span className="font-semibold text-slate-200">{selectedApp.cdlClass}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">CDL Expiration:</span>
                      <span className="font-semibold text-slate-200">{selectedApp.cdlExpiration || "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Held CDL other states (10yr):</span>
                      <span className={`font-semibold text-xs px-2 py-0.5 rounded ${selectedApp.cdlTenYears ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-700/50 text-slate-400'}`}>
                        {selectedApp.cdlTenYears ? "YES" : "NO"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Referral:</span>
                      <span className="font-semibold text-slate-200">{selectedApp.referral || "Direct Inquiry"}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-[10px] text-slate-500 block mb-1">CDL Endorsements:</span>
                      <span className="font-semibold text-slate-300 block bg-[#0B0F19]/40 p-2 rounded border border-slate-800/50">
                        {selectedApp.endorsements || "None listed"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. 10-Year Employment History */}
                <div className="rounded-2xl border border-slate-800 bg-[#161D2B] p-6 space-y-4 md:col-span-2">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-amber-500" /> 10-Year DOT Employment History Check
                  </h3>

                  {getEmploymentList(selectedApp.employmentHistory).length === 0 ? (
                    <div className="text-center p-6 text-xs text-slate-500 bg-[#0B0F19]/25 rounded-xl border border-slate-800">
                      No employment records stored.
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 gap-4">
                      {getEmploymentList(selectedApp.employmentHistory).map((job, idx) => (
                        <div key={idx} className="border border-slate-800 bg-[#0B0F19]/40 rounded-xl p-4 space-y-2">
                          <div className="flex justify-between items-start border-b border-slate-800/60 pb-1.5">
                            <span className="font-bold text-xs text-slate-200">{job.employer}</span>
                            <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded uppercase">
                              {job.startDate} - {job.endDate}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-400">
                            <div>Location: <strong className="text-slate-300">{job.city}, {job.state}</strong></div>
                            <div>Position: <strong className="text-slate-300">{job.position}</strong></div>
                          </div>

                          {job.reasonLeaving && (
                            <div className="text-[10px] text-slate-500 pt-1">
                              Reason for leaving: <span className="italic text-slate-400">{job.reasonLeaving}</span>
                            </div>
                          )}

                          <div className="flex gap-4 pt-1.5 border-t border-slate-800/40 text-[9px] font-semibold text-slate-500">
                            <span>Subject to FMCSRs: <strong className={job.isCmvr ? 'text-amber-500' : ''}>{job.isCmvr ? 'YES' : 'NO'}</strong></span>
                            <span>•</span>
                            <span>DOT Drug Tested: <strong className={job.isDotTest ? 'text-amber-500' : ''}>{job.isDotTest ? 'YES' : 'NO'}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedApp.employmentGaps && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mt-2 space-y-1">
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider block">Employment Gaps Disclosed:</span>
                      <p className="text-xs text-slate-300 leading-relaxed">{selectedApp.gapsDetail}</p>
                    </div>
                  )}
                </div>

                {/* 4. Experience & Safety */}
                <div className="rounded-2xl border border-slate-800 bg-[#161D2B] p-6 space-y-4 md:col-span-2">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Truck className="h-4.5 w-4.5 text-amber-500" /> OTR Experience & Safety History
                  </h3>

                  <div className="grid md:grid-cols-3 gap-6 text-xs">
                    <div className="space-y-3">
                      <div>
                        <span className="text-slate-500 block mb-0.5">Years Experience:</span>
                        <span className="font-bold text-slate-200 text-sm">{selectedApp.yearsExperience}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-0.5">Trailer Types Run:</span>
                        <span className="font-semibold text-slate-300 text-[11px] leading-relaxed block p-2 bg-[#0B0F19]/40 rounded border border-slate-800/60">
                          {selectedApp.equipmentOperated || "None selected"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <div className="border border-slate-800 bg-[#0B0F19]/30 rounded-xl p-3 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-300">DOT Accidents (last 3yr):</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${selectedApp.hasAccidents ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {selectedApp.hasAccidents ? "YES" : "NO"}
                          </span>
                        </div>
                        {selectedApp.hasAccidents && (
                          <p className="text-[11px] text-slate-400 leading-relaxed italic bg-[#0B0F19] p-2 rounded border border-slate-800/80">{selectedApp.accidentsDetail}</p>
                        )}
                      </div>

                      <div className="border border-slate-800 bg-[#0B0F19]/30 rounded-xl p-3 space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-slate-300">Traffic Violations (last 3yr):</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${selectedApp.hasViolations ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                            {selectedApp.hasViolations ? "YES" : "NO"}
                          </span>
                        </div>
                        {selectedApp.hasViolations && (
                          <p className="text-[11px] text-slate-400 leading-relaxed italic bg-[#0B0F19] p-2 rounded border border-slate-800/80">{selectedApp.violationsDetail}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Drug & Alcohol Disclosures */}
                <div className="rounded-2xl border border-slate-800 bg-[#161D2B] p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Shield className="h-4.5 w-4.5 text-amber-500" /> Drug & Alcohol / SAP Status
                  </h3>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Currently in SAP process?</span>
                      <span className={`font-semibold text-xs px-2 py-0.5 rounded ${selectedApp.sapStatus ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {selectedApp.sapStatus ? "YES" : "NO"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pre-employment Positive (2yr)?</span>
                      <span className={`font-semibold text-xs px-2 py-0.5 rounded ${selectedApp.drugTestPositive ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {selectedApp.drugTestPositive ? "YES" : "NO"}
                      </span>
                    </div>
                    {selectedApp.drugTestPositive && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">RTD Docs Available?</span>
                        <span className={`font-semibold text-xs px-2 py-0.5 rounded ${selectedApp.drugTestDoc ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {selectedApp.drugTestDoc ? "YES" : "NO"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 6. Disclosures Consents Checklist */}
                <div className="rounded-2xl border border-slate-800 bg-[#161D2B] p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <Shield className="h-4.5 w-4.5 text-amber-500" /> Background Checks Consent
                  </h3>

                  <div className="space-y-2 text-xs text-slate-400">
                    <div className="flex items-center justify-between p-2 bg-[#0B0F19]/40 rounded border border-slate-800/50">
                      <span>FCRA Authorization Check:</span>
                      <span className={selectedApp.fcraConsent ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {selectedApp.fcraConsent ? '✓ AUTHORIZED' : '✗ NO'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-[#0B0F19]/40 rounded border border-slate-800/50">
                      <span>PSP Screening Consent:</span>
                      <span className={selectedApp.pspConsent ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {selectedApp.pspConsent ? '✓ AUTHORIZED' : '✗ NO'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-[#0B0F19]/40 rounded border border-slate-800/50">
                      <span>Clearinghouse Release:</span>
                      <span className={selectedApp.clearinghouseConsent ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {selectedApp.clearinghouseConsent ? '✓ AUTHORIZED' : '✗ NO'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-[#0B0F19]/40 rounded border border-slate-800/50">
                      <span>Testing Policy Receipt:</span>
                      <span className={selectedApp.companyPolicyConsent ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                        {selectedApp.companyPolicyConsent ? '✓ ACCEPTED' : '✗ NO'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 7. Electronic Signature Pad */}
                <div className="rounded-2xl border border-slate-800 bg-[#161D2B] p-6 space-y-4 md:col-span-2">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-amber-500" /> Driver E-Signature Consent
                  </h3>

                  <div className="grid md:grid-cols-2 gap-6 items-center">
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Typed Signature Name:</span>
                        <span className="font-semibold text-slate-200 underline decoration-amber-500/50">{selectedApp.signatureName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Signed Date:</span>
                        <span className="font-semibold text-slate-200">
                          {new Date(selectedApp.signedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="rounded-xl bg-[#0B0F19]/50 p-4 border border-slate-800 text-[10px] text-slate-500 leading-relaxed font-mono">
                        Consent is authorized under 49 CFR §391.23. The driver confirms they authorize background checks, MVR history check, clearinghouse records check, and employment histories.
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 block mb-1">Drawn Signature Image:</span>
                      <div className="rounded-xl border border-slate-800 bg-white p-4 flex items-center justify-center h-[180px]">
                        {selectedApp.signatureData ? (
                          <img
                            src={
                              selectedApp.signatureData.startsWith("data:") || selectedApp.signatureData.startsWith("http")
                                ? selectedApp.signatureData
                                : `https://jecympxettyntszbiomc.supabase.co/storage/v1/object/public/driver-documents/${selectedApp.signatureData}`
                            }
                            alt="Driver Signature"
                            className="max-h-[140px] max-w-full object-contain filter invert"
                          />
                        ) : (
                          <span className="text-xs text-slate-400">No drawn signature on file</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 8. Uploaded Document Images/PDFs previews */}
                <div className="rounded-2xl border border-slate-800 bg-[#161D2B] p-6 space-y-6 md:col-span-2">
                  <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center gap-2">
                    <FileText className="h-4.5 w-4.5 text-amber-500" /> Uploaded Qualification Documents
                  </h3>

                  <div className="grid md:grid-cols-3 gap-6">
                    {renderDocPreview(selectedApp.docDlFront, "Front of Driver's License")}
                    {renderDocPreview(selectedApp.docDlBack, "Rear of Driver's License")}
                    {renderDocPreview(selectedApp.docMedCert, "Medical Certificate")}
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[80vh] text-center space-y-4">
              <FolderOpen className="h-16 w-16 text-slate-700 animate-pulse" />
              <h3 className="text-lg font-bold text-slate-400">No Driver Application Selected</h3>
              <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                Select an applicant from the left-hand pane list to inspect their CDL credentials, 10-year employment history details, background consent, signatures, and document photos.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
