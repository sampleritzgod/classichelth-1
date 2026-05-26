"use client";

import React, { useState } from "react";
import { API_ENDPOINTS } from "@/config";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      const response = await fetch(API_ENDPOINTS.messages, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setStatus("success");
      setFormData({ name: "", email: "", message: "" });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="py-16 sm:py-20 lg:py-24 bg-accent-soft scroll-mt-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-12 lg:gap-x-12">
          {/* Left Column: Contact Information */}
          <div className="lg:col-span-5 flex flex-col justify-between text-left">
            <div>
              <span className="text-xs font-semibold tracking-wider text-primary uppercase mb-3 block">
                Inquiries
              </span>
              <h2 id="contact-title" className="text-3xl font-normal tracking-tight text-foreground sm:text-4xl font-serif mb-6">
                Start your journey.
              </h2>
              <p className="text-base text-foreground/80 leading-relaxed max-w-md mb-8">
                Have questions about our treatments or want to check therapist availability? Drop us a line or call our front desk directly.
              </p>
            </div>

            {/* Contact details list */}
            <div className="space-y-8 my-6">
              <div className="flex gap-x-4 items-start">
                <svg className="h-5 w-5 text-primary mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-1">
                    Clinic Hours
                  </h3>
                  <p className="text-sm text-foreground/80">Monday – Saturday: 10:00 AM – 7:00 PM</p>
                  <p className="text-sm text-foreground/80">Sunday: Closed</p>
                </div>
              </div>
              <div className="flex gap-x-4 items-start">
                <svg className="h-5 w-5 text-primary mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-1">
                    Contact Details
                  </h3>
                  <p className="text-sm text-foreground/80">Phone: +91 88150 10090</p>
                  <p className="text-sm text-foreground/80">Email: contact@u1stcreation.com</p>
                </div>
              </div>
              <div className="flex gap-x-4 items-start">
                <svg className="h-5 w-5 text-primary mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-1">
                    Location
                  </h3>
                  <p className="text-sm text-foreground/80">102, Shekhar Central, Palasia Square</p>
                  <p className="text-sm text-foreground/80">Indore, MP 452001, India</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-background p-8 sm:p-10 rounded-2xl border border-foreground/5 shadow-sm">
            {status === "success" ? (
              <div className="flex flex-col items-center justify-center text-center py-12" aria-live="polite">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="text-xl font-normal font-serif text-foreground mb-2">Message received.</h3>
                <p className="text-sm text-foreground/70 max-w-sm">
                  Thank you for reaching out. We will review your request and contact you within 24 business hours.
                </p>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="mt-6 text-sm font-semibold text-primary hover:text-primary-hover cursor-pointer"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-2">
                    Full name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    autoComplete="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    disabled={status === "submitting"}
                    className="block w-full rounded-lg border border-foreground/15 bg-background px-4 py-3 text-sm text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                    Email address
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    disabled={status === "submitting"}
                    className="block w-full rounded-lg border border-foreground/15 bg-background px-4 py-3 text-sm text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-semibold text-foreground mb-2">
                    Message
                  </label>
                  <textarea
                    name="message"
                    id="message"
                    rows={4}
                    required
                    value={formData.message}
                    onChange={handleChange}
                    disabled={status === "submitting"}
                    className="block w-full rounded-lg border border-foreground/15 bg-background px-4 py-3 text-sm text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50 resize-y transition-all"
                    placeholder="Tell us about the therapy you'd like to book..."
                  />
                </div>

                {status === "error" && (
                  <p className="text-sm font-semibold text-red-600 mb-4">
                    Failed to send message. Please try again or call us directly.
                  </p>
                )}

                <div>
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="flex w-full items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 transition-all duration-350 hover:translate-y-[-2px] cursor-pointer"
                  >
                    {status === "submitting" ? "Sending inquiry..." : "Send Message"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
