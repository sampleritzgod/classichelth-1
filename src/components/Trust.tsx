"use client";

import React from "react";

export default function Trust() {
  const reviews = [
    {
      name: "Dr. Sandeep Sharma",
      role: "Patient, Indore",
      condition: "Diabetes Recovery",
      text: "I was highly skeptical at first, but U 1st Creation's root-cause approach reversed my HbA1c levels from 8.4 to 6.1 in just 5 months. Their daily WhatsApp follow-up and custom diet plans kept me consistent. Highly recommended.",
      rating: 5
    },
    {
      name: "Priyanka Mandloi",
      role: "Patient, Ujjain",
      condition: "PCOS correction",
      text: "After struggling with PCOD and weight gain for three years, their correction program helped me restore normal cycles within four months. No synthetic hormones, just natural herbal formulations and routine lifestyle correction.",
      rating: 5
    },
    {
      name: "Harish Dewangan",
      role: "Patient, Bhopal",
      condition: "Chronic Pain Relief",
      text: "The joint care oil and localized therapies resolved my long-standing cervical and shoulder stiffness. The pain relief is natural, and their clinical supervisors are very knowledgeable.",
      rating: 5
    }
  ];

  const badges = [
    { title: "BAMS Doctors", desc: "Clinically Supervised" },
    { title: "100% Organic", desc: "Pure Formulations" },
    { title: "Root Cause", desc: "Zero Symptom Masking" },
    { title: "ISO Certified", desc: "Standardized Care" }
  ];

  return (
    <section id="trust" className="py-16 sm:py-20 lg:py-24 bg-accent-soft/20 border-t border-foreground/5 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-up">
          <span className="text-xs font-bold tracking-widest text-primary uppercase mb-4 inline-block px-3 py-1 rounded-full bg-primary/5">
            Patient Stories
          </span>
          <h2 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl font-serif mb-6 leading-tight">
            Restored Health, Real Stories
          </h2>
          <p className="text-base text-foreground/80 leading-relaxed max-w-2xl mx-auto">
            See how our root-cause wellness plans and supervised treatments have made a lasting difference in the lives of our patients.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 mb-16">
          {reviews.map((review, i) => (
            <div 
              key={i} 
              className="flex flex-col justify-between bg-background rounded-3xl p-6 border border-foreground/5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-primary/20"
            >
              <div>
                {/* Stars */}
                <div className="flex gap-x-1 mb-4">
                  {[...Array(review.rating)].map((_, idx) => (
                    <svg key={idx} className="h-4 w-4 text-[#b38f4d]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {/* Condition Tag */}
                <span className="inline-block text-[10px] font-bold tracking-wider text-primary uppercase bg-primary/5 px-2 py-0.5 rounded-md mb-3">
                  {review.condition}
                </span>
                <p className="text-sm text-foreground/80 leading-relaxed italic mb-6">
                  "{review.text}"
                </p>
              </div>
              <div className="border-t border-foreground/5 pt-4">
                <span className="block text-sm font-bold text-foreground">{review.name}</span>
                <span className="block text-xs text-foreground/50">{review.role}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Quality Badges */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 border-t border-foreground/5 pt-12">
          {badges.map((badge, idx) => (
            <div key={idx} className="flex flex-col items-center text-center p-4 rounded-2xl bg-foreground/[0.01] border border-foreground/[0.02]">
              <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center text-primary mb-3 font-bold text-lg">
                ✓
              </div>
              <h4 className="font-serif text-sm font-semibold text-foreground mb-1">{badge.title}</h4>
              <p className="text-[11px] text-foreground/60 uppercase tracking-wider font-semibold">{badge.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
