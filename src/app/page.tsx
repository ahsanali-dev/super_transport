"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Truck, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  FileText, 
  Wrench, 
  ShieldCheck, 
  ArrowRight,
  MessageSquare,
  FileCheck,
  Menu,
  X
} from "lucide-react";

export default function Home() {
  const [activeSection, setActiveSection] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Quick Inquiry Form States
  const [inquiryName, setInquiryName] = useState("");
  const [inquiryPhone, setInquiryPhone] = useState("");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryMethod, setInquiryMethod] = useState("phone");
  const [inquiryMessage, setInquiryMessage] = useState("");
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [inquiryStatus, setInquiryStatus] = useState<{ type: "success" | "error" | null, message: string }>({ type: null, message: "" });

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryLoading(true);
    setInquiryStatus({ type: null, message: "" });

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inquiryName,
          phone: inquiryPhone,
          email: inquiryEmail,
          method: inquiryMethod,
          message: inquiryMessage,
        }),
      });

      if (response.ok) {
        setInquiryStatus({
          type: "success",
          message: "Thank you! Your inquiry has been sent. We will contact you soon.",
        });
        setInquiryName("");
        setInquiryPhone("");
        setInquiryEmail("");
        setInquiryMessage("");
      } else {
        const data = await response.json();
        setInquiryStatus({
          type: "error",
          message: data.error || "Failed to send inquiry. Please try again.",
        });
      }
    } catch (err) {
      console.error(err);
      setInquiryStatus({
        type: "error",
        message: "A network error occurred. Please try again later.",
      });
    } finally {
      setInquiryLoading(false);
    }
  };

  useEffect(() => {
    const sections = ["about", "operators", "policy", "shops", "contact"];
    
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: "-25% 0px -55% 0px", // Trigger when the section occupies the center of the viewport
      threshold: 0.1,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-brand-dark">
      {/* Fixed Navigation Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-dark/95 backdrop-blur-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-12 w-12 overflow-hidden rounded-lg transition-all duration-300 group-hover:scale-105">
              <Image 
                src="/logo.png" 
                alt="Marshall Transports Logo" 
                fill 
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-wider text-slate-50">MARSHALL TRANSPORTS LLC</span>
              <span className="text-[10px] uppercase tracking-widest text-gold font-semibold">Safety & Reliability</span>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a 
              href="#about" 
              className={`transition-all duration-300 relative py-1 ${
                activeSection === "about" 
                  ? "text-gold font-bold after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-gold" 
                  : "text-slate-300 hover:text-gold"
              }`}
            >
              About
            </a>
            <a 
              href="#operators" 
              className={`transition-all duration-300 relative py-1 ${
                activeSection === "operators" 
                  ? "text-gold font-bold after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-gold" 
                  : "text-slate-300 hover:text-gold"
              }`}
            >
              Operators
            </a>
            <a 
              href="#shops" 
              className={`transition-all duration-300 relative py-1 ${
                activeSection === "shops" 
                  ? "text-gold font-bold after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-gold" 
                  : "text-slate-300 hover:text-gold"
              }`}
            >
              Shops
            </a>
            <a 
              href="#policy" 
              className={`transition-all duration-300 relative py-1 ${
                activeSection === "policy" 
                  ? "text-gold font-bold after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-gold" 
                  : "text-slate-300 hover:text-gold"
              }`}
            >
              Policy
            </a>
            <a 
              href="#contact" 
              className={`transition-all duration-300 relative py-1 ${
                activeSection === "contact" 
                  ? "text-gold font-bold after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-gold" 
                  : "text-slate-300 hover:text-gold"
              }`}
            >
              Contact
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/admin"
              className="text-xs text-slate-400 hover:text-gold transition-colors duration-200"
            >
              Admin Portal
            </Link>
            <Link
              href="/apply"
              className="rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-brand-dark transition-all duration-300 hover:bg-gold-hover hover:shadow-lg hover:shadow-gold/25"
            >
              Apply Now
            </Link>
          </div>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-400 hover:bg-brand-card hover:text-gold md:hidden transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-brand-border bg-brand-dark/98 px-6 py-6 transition-all duration-300 animate-in slide-in-from-top-5">
            <nav className="flex flex-col gap-5 text-base font-semibold">
              <a 
                href="#about" 
                onClick={() => setMobileMenuOpen(false)}
                className={`transition-colors py-1 ${activeSection === "about" ? "text-gold" : "text-slate-300 hover:text-gold"}`}
              >
                About
              </a>
              <a 
                href="#operators" 
                onClick={() => setMobileMenuOpen(false)}
                className={`transition-colors py-1 ${activeSection === "operators" ? "text-gold" : "text-slate-300 hover:text-gold"}`}
              >
                Operators
              </a>
              <a 
                href="#shops" 
                onClick={() => setMobileMenuOpen(false)}
                className={`transition-colors py-1 ${activeSection === "shops" ? "text-gold" : "text-slate-300 hover:text-gold"}`}
              >
                Shops
              </a>
              <a 
                href="#policy" 
                onClick={() => setMobileMenuOpen(false)}
                className={`transition-colors py-1 ${activeSection === "policy" ? "text-gold" : "text-slate-300 hover:text-gold"}`}
              >
                Policy
              </a>
              <a 
                href="#contact" 
                onClick={() => setMobileMenuOpen(false)}
                className={`transition-colors py-1 ${activeSection === "contact" ? "text-gold" : "text-slate-300 hover:text-gold"}`}
              >
                Contact
              </a>
              <div className="h-px bg-brand-border my-2" />
              <Link
                href="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-400 hover:text-gold py-1 text-sm"
              >
                Admin Portal
              </Link>
              <Link
                href="/apply"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl bg-gold py-3 text-center text-sm font-bold text-brand-dark hover:bg-gold-hover transition-colors shadow-md mt-2"
              >
                Apply Now
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* Hero / About Section */}
      <section id="about" className="relative flex min-h-[90vh] items-center justify-center overflow-hidden py-24">
        {/* Background Image with Gradients */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero.png"
            alt="Marshall Transports Truck"
            fill
            className="object-cover opacity-35"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/95 via-transparent to-brand-dark/50" />
        </div>

        <div className="container relative z-10 mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col space-y-8 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-4 py-1.5 text-xs font-semibold text-gold tracking-wide uppercase">
              <ShieldCheck className="h-4 w-4" /> MC# 1605225
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-slate-50 tracking-tight">
              Where Owner-Operators <br className="hidden sm:inline" />
              Are Treated Like <span className="gold-gradient-text">Partners</span>
            </h1>
            
            <p className="text-lg text-slate-300 leading-relaxed">
              We know trucking because we&apos;ve lived it. Founded by a driver who started with a single truck, we&apos;ve been helping independent operators succeed with dedicated service.
            </p>

            {/* Mission Box */}
            <div className="rounded-xl border border-brand-border bg-brand-card/75 p-6 backdrop-blur-sm">
              <span className="text-xs uppercase tracking-widest text-gold font-bold block mb-2">Mission Statement</span>
              <p className="text-sm text-slate-400 italic leading-relaxed">
                &ldquo;To work with integrity, conduct ethical business practices, continue to improve every day, and forge lasting relationships with our business partners. We will stand steadfast in creating a culture of safety and accountability on and off the roads of America.&rdquo;
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/apply"
                className="flex items-center justify-center gap-2 rounded-full bg-gold px-8 py-4 text-base font-extrabold text-brand-dark transition-all duration-300 hover:bg-gold-hover hover:scale-[1.02] hover:shadow-lg hover:shadow-gold/25"
              >
                Apply to Partner with Us <ArrowRight className="h-5 w-5" />
              </Link>
              <a
                href="#inquire"
                className="flex items-center justify-center gap-2 rounded-full border border-slate-700 bg-brand-dark/50 px-8 py-4 text-base font-bold text-slate-200 transition-all duration-200 hover:border-slate-500 hover:bg-brand-card"
              >
                Quick Inquiry <MessageSquare className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="hidden md:block relative h-[450px] rounded-2xl border border-brand-border bg-brand-card/40 overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-tr from-gold/10 to-transparent mix-blend-overlay" />
            <div className="p-8 h-full flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <span className="text-[10px] tracking-widest text-slate-500 uppercase font-mono">Operations</span>
                <span className="rounded bg-gold/10 px-2.5 py-1 text-xs text-gold font-bold">Active Interstate Carrier</span>
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-50">Consistent Dedicated Lanes</h3>
                <p className="text-sm text-slate-400">
                  We operate power-only trucking services pulling dry vans. Secure consistent, high-paying lanes across the Southeast, Southwest, Midwest, and Northeast.
                </p>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-brand-border text-xs text-slate-400">
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Plate Program</span>
                    <p className="font-bold text-slate-200">Assistance Available</p>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-slate-500 font-semibold mb-1">Fuel Program</span>
                    <p className="font-bold text-slate-200">Fuel Cards Provided</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About & Operators Section */}
      <section id="operators" className="py-24 border-t border-brand-border bg-brand-dark/50">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-bold uppercase tracking-widest text-gold">The Marshall Transports Edge</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold mt-3 text-slate-50">Partners, Not Numbers</h2>
            <div className="w-16 h-1 bg-gold mx-auto mt-4 rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="rounded-2xl border border-brand-border bg-brand-card p-8 flex flex-col justify-between hover:border-gold/30 transition-all duration-300">
              <div className="space-y-4">
                <div className="rounded-xl bg-gold/10 p-3 text-gold w-fit">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-50">Built by a Driver</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Our founder started behind the wheel with a single truck. Our very first leased-on driver is still with us today, now serving as our Director of Safety and Operations. We build relationships that last.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-border bg-brand-card p-8 flex flex-col justify-between hover:border-gold/30 transition-all duration-300">
              <div className="space-y-4">
                <div className="rounded-xl bg-gold/10 p-3 text-gold w-fit">
                  <FileCheck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-50">Plate & Fuel Programs</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Focus on driving while we support the paperwork. We offer license plate assistance, pre-pass transponders, and carrier fuel cards to keep you moving with lower operational friction.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-brand-border bg-brand-card p-8 flex flex-col justify-between hover:border-gold/30 transition-all duration-300">
              <div className="space-y-4">
                <div className="rounded-xl bg-gold/10 p-3 text-gold w-fit">
                  <Truck className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-50">Power-Only Convenience</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Pull our trailers with your sleeper tractor. We run power-only dry vans which minimizes deadhead miles and keeps you loaded. No company driver hierarchy — we respect owner-operators.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hiring Policy Section */}
      <section id="policy" className="py-24 border-t border-brand-border bg-brand-dark">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="rounded-2xl border border-gold/20 bg-gradient-to-r from-gold/5 via-transparent to-gold/5 p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="inline-block rounded-md bg-gold/10 px-3 py-1 text-xs text-gold font-bold">
                  Step 1 of Onboarding
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-50">
                  Driver Qualification & Hiring Policy
                </h2>
                <p className="text-sm text-slate-400 leading-relaxed">
                  All applicants must review and sign our official Driver Qualification & Hiring Policy. This is the first step toward getting leased on with Marshall Transports.
                </p>
                <a
                  href="/policy.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-brand-dark transition-all duration-200 hover:bg-gold-hover hover:scale-[1.02]"
                >
                  Review & Sign Policy <FileText className="h-4 w-4" />
                </a>
              </div>
              <div className="flex justify-center">
                <div className="relative h-48 w-48 rounded-2xl border border-brand-border bg-brand-card p-6 flex flex-col justify-center items-center text-center shadow-lg">
                  <FileText className="h-16 w-16 text-gold mb-3 animate-pulse" />
                  <span className="text-xs text-slate-400 font-semibold">Policy PDF Document</span>
                  <span className="text-[10px] text-slate-600 mt-1 font-mono">Secure e-signature</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shops Section */}
      <section id="shops" className="py-24 border-t border-brand-border bg-brand-dark/50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-12">
            <span className="text-sm font-bold uppercase tracking-widest text-gold">Driver Resources</span>
            <h2 className="text-3xl font-extrabold mt-3 text-slate-50">Maintenance & Shop Locations</h2>
            <p className="text-sm text-slate-400 mt-2">Quickly locate authorized service shops and lube stations on the road.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <a
              href="https://www.truckdown.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-card p-6 hover:border-gold/30 hover:bg-brand-card/85 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-gold/10 p-2.5 text-gold">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Find A Shop Near You</h4>
                  <p className="text-xs text-slate-500">Search via TruckDown Directory</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-600" />
            </a>

            <a
              href="https://joestrucklube.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl border border-brand-border bg-brand-card p-6 hover:border-gold/30 hover:bg-brand-card/85 transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-lg bg-gold/10 p-2.5 text-gold">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Joe&apos;s Truck Lube</h4>
                  <p className="text-xs text-slate-500">Lube & oil change facilities</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-600" />
            </a>
          </div>
        </div>
      </section>

      {/* Quick Inquiry Form Section */}
      <section id="inquire" className="py-24 border-t border-brand-border bg-brand-dark">
        <div className="container mx-auto px-6 max-w-2xl">
          <div className="text-center mb-12">
            <span className="text-sm font-bold uppercase tracking-widest text-gold">Start a Conversation</span>
            <h2 className="text-3xl font-extrabold mt-3 text-slate-50">Reach Out To Us</h2>
            <p className="text-sm text-slate-400 mt-2">
              Not ready to fill out the full application yet? Ask us anything about pay, lanes, or expectations below.
            </p>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-card p-8">
            <form onSubmit={handleInquirySubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-xs font-semibold text-slate-400">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    value={inquiryName}
                    onChange={(e) => setInquiryName(e.target.value)}
                    className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:border-gold focus:outline-none"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-xs font-semibold text-slate-400">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    value={inquiryPhone}
                    onChange={(e) => setInquiryPhone(e.target.value)}
                    className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:border-gold focus:outline-none"
                    placeholder="(215) 948-6110"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-xs font-semibold text-slate-400">Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={inquiryEmail}
                  onChange={(e) => setInquiryEmail(e.target.value)}
                  className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:border-gold focus:outline-none"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-400 block mb-1">Preferred Connection Method</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input 
                      type="radio" 
                      name="contact-method" 
                      value="phone" 
                      checked={inquiryMethod === "phone"} 
                      onChange={() => setInquiryMethod("phone")}
                      className="accent-gold" 
                    />
                    Phone Call
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input 
                      type="radio" 
                      name="contact-method" 
                      value="text" 
                      checked={inquiryMethod === "text"} 
                      onChange={() => setInquiryMethod("text")}
                      className="accent-gold" 
                    />
                    Text Message
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input 
                      type="radio" 
                      name="contact-method" 
                      value="email" 
                      checked={inquiryMethod === "email"} 
                      onChange={() => setInquiryMethod("email")}
                      className="accent-gold" 
                    />
                    Email
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-xs font-semibold text-slate-400">Questions or Notes</label>
                <textarea
                  id="message"
                  rows={4}
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  className="w-full rounded-lg border border-brand-border bg-brand-dark px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:border-gold focus:outline-none resize-none"
                  placeholder="I am interested in leased-on programs. Do you have run lanes in Georgia?"
                  required
                ></textarea>
              </div>

              {inquiryStatus.type && (
                <p className={`text-xs font-bold text-center p-2.5 rounded-lg border ${
                  inquiryStatus.type === "success" 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                    : "bg-red-500/10 text-red-400 border-red-500/20"
                }`}>
                  {inquiryStatus.message}
                </p>
              )}

              <button
                type="submit"
                disabled={inquiryLoading}
                className="w-full rounded-full bg-gold py-3.5 text-sm font-extrabold text-brand-dark hover:bg-gold-hover transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {inquiryLoading ? "Sending Inquiry..." : "Send Inquiry"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Contact Information & Office Details */}
      <section id="contact" className="py-24 border-t border-brand-border bg-brand-dark/50">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Contact Details Card */}
            <div className="space-y-8">
              <div>
                <span className="text-sm font-bold uppercase tracking-widest text-gold">Office & Location</span>
                <h2 className="text-3xl font-extrabold mt-3 text-slate-50">Get In Touch</h2>
                <p className="text-sm text-slate-400 mt-2">
                  Call, text, or visit our office. We are located in Union City, Tennessee.
                </p>
              </div>

              <div className="space-y-6">
                
                <div className="flex gap-4 items-start">
                  <div className="rounded-lg bg-gold/10 p-2.5 text-gold shrink-0">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-200">Call / Text Support</h5>
                    <p className="text-sm text-slate-400">Call: (215) 948-6110</p>
                    <p className="text-sm text-slate-400">Text: (215) 948-6110</p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="rounded-lg bg-gold/10 p-2.5 text-gold shrink-0">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-200">Email Address</h5>
                    <p className="text-sm text-slate-400">info@marshalltransports.com</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours Card */}
            <div className="rounded-2xl border border-brand-border bg-brand-card p-8">
              <h3 className="text-xl font-bold text-slate-50 mb-6 flex items-center gap-2">
                <Clock className="h-5 w-5 text-gold" /> Hours of Operation
              </h3>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b border-brand-border">
                  <span className="text-slate-400 font-semibold">Monday - Friday</span>
                  <span className="text-slate-200 font-bold">7:00 AM - 5:00 PM CST</span>
                </div>
                <div className="flex justify-between py-2 border-b border-brand-border">
                  <span className="text-slate-400 font-semibold">Saturday - Sunday</span>
                  <span className="text-slate-500">Closed</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400 font-semibold">Dispatch Assistance</span>
                  <span className="rounded bg-gold/10 px-2.5 py-0.5 text-xs text-gold font-bold self-center">24 / 7 / 365</span>
                </div>
              </div>

              <div className="mt-8 p-4 rounded-xl border border-brand-border bg-brand-dark/40 text-center">
                <span className="text-xs text-slate-500 font-semibold">Owner & Operator Management</span>
                <h4 className="text-base font-bold text-slate-200 mt-1">Management Team</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-brand-border bg-brand-dark py-8 text-center text-xs text-slate-500">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>Copyright &copy; 2026 | MARSHALL TRANSPORTS LLC | All Rights Reserved.</p>
          <div className="flex gap-4">
            <span className="font-semibold text-slate-400">DOT# 4172640</span>
            <span className="text-slate-600">|</span>
            <span className="font-semibold text-slate-400">MC# 1605225</span>
          </div>
        </div>
      </footer>

      {/* Structured Schema Data for SEO (JSON-LD) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "@id": "https://marshalltransports.com/#organization",
            "name": "Marshall Transports LLC",
            "url": "https://marshalltransports.com",
            "logo": "https://marshalltransports.com/logo.png",
            "image": "https://marshalltransports.com/hero.png",
            "description": "Marshall Transports LLC partners with independent owner-operators across America, specializing in dry van and power-only freight services built on safety, integrity, and compliance.",
            "telephone": "+1-215-948-6110",
            "email": "info@marshalltransports.com",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "1114 Granger St",
              "addressLocality": "Union City",
              "addressRegion": "TN",
              "postalCode": "38261",
              "addressCountry": "US"
            },
            "geo": {
              "@type": "GeoCoordinates",
              "latitude": 36.4242,
              "longitude": -89.0567
            },
            "openingHoursSpecification": [
              {
                "@type": "OpeningHoursSpecification",
                "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
                "opens": "07:00",
                "closes": "17:00"
              }
            ]
          })
        }}
      />
    </div>
  );
}
