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

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-accent-soft/30 border-t border-foreground/5 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-y-16 lg:grid-cols-12 lg:gap-x-12 lg:items-center">
          
          {/* Left Column: WhatsApp Health Support & Guidance */}
          <div className="lg:col-span-12 flex flex-col items-start text-left animate-fade-up">
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

        </div>
      </div>
    </section>
  );
}
