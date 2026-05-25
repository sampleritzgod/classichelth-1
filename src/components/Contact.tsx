"use client";

import React, { useState } from "react";

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

    // Simulate submission
    setTimeout(() => {
      setStatus("success");
      setFormData({ name: "", email: "", message: "" });
    }, 1200);
  };

  return (
    <section id="contact" className="py-20 lg:py-32 bg-accent-soft scroll-mt-20">
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
              <p className="text-base text-foreground/80 leading-relaxed max-w-md mb-10">
                Have questions about our treatments or want to check therapist availability? Drop us a line or call our front desk directly.
              </p>
            </div>

            {/* Contact details list */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-1">
                  Clinic Hours
                </h3>
                <p className="text-sm text-foreground/80">Monday – Friday: 9:00 AM – 6:00 PM</p>
                <p className="text-sm text-foreground/80">Saturday: 10:00 AM – 4:00 PM</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-1">
                  Contact Details
                </h3>
                <p className="text-sm text-foreground/80">Phone: +1 (555) 0199</p>
                <p className="text-sm text-foreground/80">Email: hello@classichealthclinic.com</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-1">
                  Location
                </h3>
                <p className="text-sm text-foreground/80">742 Evergreen Terrace, Suite 100</p>
                <p className="text-sm text-foreground/80">Springfield, OR 97477</p>
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
                  className="mt-6 text-sm font-semibold text-primary hover:text-primary-hover"
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
                    className="block w-full rounded-lg border border-foreground/20 bg-background px-4 py-3 text-sm text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
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
                    className="block w-full rounded-lg border border-foreground/20 bg-background px-4 py-3 text-sm text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50"
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
                    className="block w-full rounded-lg border border-foreground/20 bg-background px-4 py-3 text-sm text-foreground shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none disabled:opacity-50 resize-y"
                    placeholder="Tell us about the therapy you'd like to book..."
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="flex w-full items-center justify-center rounded-full bg-primary px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 transition-colors"
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
