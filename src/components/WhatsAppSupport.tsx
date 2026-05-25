import React from "react";
import { getWhatsAppUrl } from "@/utils/whatsapp";

export default function WhatsAppSupport() {
  const whatsappFeatures = [
    { title: "Daily Health Tips", desc: "Short, actionable advice based on your body constitution (dosha) delivered every morning." },
    { title: "Medicine Reminders", desc: "Automated, friendly alerts to ensure you never miss your organic supplements or tonics." },
    { title: "Educational Broadcasts", desc: "Access verified videos, health articles, and Ayurvedic awareness campaigns directly in chat." },
    { title: "Patient Follow-up & Care", desc: "Direct weekly check-ins with our clinical team to monitor your wellness progress and adjust plans." },
    { title: "Motivational Guidance", desc: "Supportive lifestyle correction and daily habit-building guidance to keep you inspired." },
  ];

  const deliveryFeatures = [
    "Fast, reliable delivery directly to your home",
    "Subscription refills for ongoing chronic care packages",
    "Family healthcare packages (complete wellness kits)",
    "Convenient Cash on Delivery (COD) & secure online payments",
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-accent-soft/30 border-t border-foreground/5 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-12 lg:gap-x-12 lg:items-center">
          
          {/* Left Column: WhatsApp Health Support & Guidance */}
          <div className="lg:col-span-7 flex flex-col items-start text-left animate-fade-up">
            <span className="text-xs font-bold tracking-widest text-[#4caf50] uppercase mb-4 px-3 py-1 rounded-full bg-[#4caf50]/10">
              Our USP
            </span>
            <h2 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl font-serif mb-6 leading-tight">
              WhatsApp Health Support & <br />
              <span className="text-primary italic">Personalized Wellness Guidance</span>
            </h2>
            <p className="text-base text-foreground/80 leading-relaxed max-w-2xl mb-10">
              Our unique Patient Engagement System acts as your digital health companion. Beyond consultations, we actively guide your daily routines, diet plans, and yoga practices directly through WhatsApp to build long-term wellness habits.
            </p>

            {/* Feature List */}
            <div className="space-y-6 w-full max-w-2xl">
              {whatsappFeatures.map((feat, index) => (
                <div key={index} className="flex gap-x-4 items-start group">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-[#4caf50]/15 text-[#4caf50] mt-1 transition-transform group-hover:scale-110">
                    <span className="text-xs">✔</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-primary group-hover:text-[#4caf50] transition-colors">{feat.title}</h4>
                    <p className="text-xs text-foreground/70 mt-1 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Doorstep Medicine Delivery Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-background rounded-[2.5rem] p-8 border border-foreground/5 shadow-2xl transition-all duration-500 hover:scale-[1.01] hover:shadow-primary/5 flex flex-col">
              
              {/* Delivery Icon & Header */}
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
                {/* Delivery Truck SVG */}
                <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m14 0a2 2 0 012 2v3m-2-5V9a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h2m12-7a2 2 0 11-4 0 2 2 0 014 0zM7 17a2 2 0 11-4 0 2 2 0 014 0zm12 0a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>

              <h3 className="font-serif text-2xl font-bold text-primary mb-3">Doorstep Medicine Delivery</h3>
              <p className="text-xs text-foreground/60 leading-relaxed mb-6">
                Extremely useful for older patients and repeat orders. Have your customized Ayurvedic products, tonics, and subscription refills delivered straight to your home.
              </p>

              {/* Delivery Highlights */}
              <ul className="space-y-3.5 mb-8">
                {deliveryFeatures.map((item, index) => (
                  <li key={index} className="flex items-start gap-x-3 text-xs text-foreground/80 font-medium">
                    <span className="text-[#4caf50] mt-0.5">📦</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {/* CTAs */}
              <div className="flex flex-col gap-3">
                <a
                  href={getWhatsAppUrl("Hello! I would like to order some Ayurvedic medicines to my home.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-x-2 rounded-full bg-[#4caf50] py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-md hover:bg-[#43a047] transition-all duration-300 hover:scale-102 cursor-pointer"
                >
                  {/* WhatsApp SVG logo inside button */}
                  <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.498 1.452 5.411 1.453 5.587 0 10.132-4.547 10.136-10.13.002-2.709-1.051-5.258-2.96-7.17C17.321 1.381 14.773.328 12.008.328 6.415.328 1.87 4.87 1.866 10.463c-.002 1.902.5 3.752 1.455 5.361L2.33 21.73l6.096-1.6c1.551.846 3.298 1.29 5.074 1.291zm11.758-7.905c-.328-.164-1.947-.96-2.25-1.07-.302-.109-.522-.164-.74.164-.219.329-.848 1.07-1.039 1.29-.19.219-.382.247-.71.082-1.144-.572-1.943-.948-2.707-2.25-.192-.328-.088-.507.076-.671.148-.147.328-.382.492-.574.164-.19.219-.328.328-.548.11-.219.055-.411-.027-.575-.082-.164-.74-1.782-1.01-2.438-.263-.633-.53-.547-.729-.557-.19-.01-.41-.01-.629-.01-.219 0-.575.082-.876.411-.301.328-1.15 1.122-1.15 2.738 0 1.616 1.177 3.176 1.341 3.4 1.636 2.196 3.261 3.325 4.836 3.908.435.161.83.256 1.141.353.349.11.666.09.916.053.277-.04.848-.346 1.077-.927.228-.58.228-1.076.16-1.176-.069-.1-.247-.164-.575-.328z" />
                  </svg>
                  Order on WhatsApp
                </a>
                <a
                  href="#booking"
                  className="inline-flex w-full items-center justify-center rounded-full border border-[#1a3b22]/30 py-3 text-xs font-semibold uppercase tracking-wider text-primary hover:bg-primary/5 transition-all duration-300 text-center"
                >
                  Get Delivered to Your Home
                </a>
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
