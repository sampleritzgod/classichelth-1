import Image from "next/image";

export default function Hero() {
  const conditions = [
    "Obesity", "Stress", "Sleep", "Hormonal Balance", "Diabetes", "Blood Pressure", "Thyroid", "Chronic Pain", "Gut Health"
  ];

  return (
    <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20 bg-gradient-to-b from-background to-accent-soft/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-12 lg:gap-x-12 lg:items-center">
          {/* Left Column: Text Content */}
          <div className="lg:col-span-6 flex flex-col items-start text-left animate-fade-up">
            <span className="inline-block text-xs font-bold tracking-widest text-primary uppercase mb-4 px-3 py-1 rounded-full bg-primary/5">
              Root-Cause Healing
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl font-serif leading-[1.15] mb-4">
              Complete Health & <br />
              <span className="text-primary italic">Wellness Solution</span>
            </h1>
            <p className="text-lg sm:text-xl text-foreground/85 font-serif mb-6 leading-relaxed">
              Treat the Root Cause, <span className="underline decoration-primary/35 underline-offset-6">Not Just Symptoms</span>
            </p>

            {/* कंडीशन मार्की टिकर (Infinite Condition Scroll Ticker) */}
            <div className="relative w-full overflow-hidden py-3 border-y border-foreground/5 bg-foreground/[0.01] my-4 rounded-lg">
              <div className="flex w-max animate-marquee gap-x-8 whitespace-nowrap text-xs font-semibold tracking-widest text-primary/80 uppercase">
                <div>
                  {conditions.map((c, i) => (
                    <span key={i}>
                      {c} <span className="mx-3 text-foreground/20">•</span>
                    </span>
                  ))}
                </div>
                <div>
                  {conditions.map((c, i) => (
                    <span key={`dup-${i}`}>
                      {c} <span className="mx-3 text-foreground/20">•</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-1 text-sm sm:text-base text-foreground/80 leading-relaxed max-w-xl mb-8">
              <p className="font-semibold text-primary">Clinic in Indore | Online Consultation Across India</p>
              <p className="text-xs sm:text-sm">Specialized Care for Diabetes, BP, Thyroid, Stress & Lifestyle Disorders.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <a
                href="#booking"
                className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white transition-all duration-350 hover:bg-primary-hover hover:translate-y-[-2px] w-full sm:w-auto text-center cursor-pointer shadow-sm"
              >
                Book Appointment
              </a>
              <a
                href="https://wa.me/918815010090"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-primary px-8 py-3.5 text-sm font-semibold text-primary transition-all duration-350 hover:bg-primary/5 hover:translate-y-[-2px] w-full sm:w-auto text-center cursor-pointer"
              >
                Chat On Whatsapp
              </a>
            </div>
          </div>

          {/* Right Column: Hero Image with premium styling */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg aspect-[4/5] sm:aspect-square overflow-hidden rounded-[2.5rem] border border-foreground/5 shadow-2xl transition-all duration-500 hover:shadow-primary/5 group">
              {/* Overlay sheen effect */}
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-primary/10 via-transparent to-transparent pointer-events-none opacity-60 group-hover:opacity-40 transition-opacity duration-300" />
              <Image
                src="/images/u1st_hero_clinic.png"
                alt="Modern luxury interior of U 1st Creation wellness clinic with warm wooden office furniture and plants"
                fill
                priority
                className="object-cover transition-transform duration-750 group-hover:scale-103"
                sizes="(max-width: 1024px) 100vw, 45vw"
              />
            </div>
          </div>
        </div>

        {/* Core Values Bar (Inspired by the U 1st Creation Logo) */}
        <div className="mt-20 pt-10 border-t border-foreground/5 grid grid-cols-1 gap-y-8 sm:grid-cols-3 sm:gap-x-10">
          {/* Pillar 1: Natural */}
          <div className="flex items-start gap-x-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#4caf50]/10 text-[#4caf50]">
              {/* Mortar & Pestle Icon */}
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 5a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12a3 3 0 106 0H9z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Natural</h3>
              <p className="mt-1.5 text-xs text-foreground/75 leading-relaxed">
                100% organic botanical formulations and natural remedies designed to work in harmony with your body.
              </p>
            </div>
          </div>

          {/* Pillar 2: Safe */}
          <div className="flex items-start gap-x-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              {/* Heart + ECG Pulse Icon */}
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h2.25l1.5-2.25 1.5 4.5L15.75 12H18" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Safe</h3>
              <p className="mt-1.5 text-xs text-foreground/75 leading-relaxed">
                Evidence-based diagnostics and clinical protocols supervised by experienced medical professionals.
              </p>
            </div>
          </div>

          {/* Pillar 3: Effective */}
          <div className="flex items-start gap-x-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-[#4caf50]/10 text-[#4caf50]">
              {/* Stylized Active Person Icon */}
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12.5a4 4 0 018 0v3.5a1 1 0 01-1 1h-6a1 1 0 01-1-1v-3.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 10c1.5 1.5 3 2.5 6.5 2.5s5-1 6.5-2.5" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Effective</h3>
              <p className="mt-1.5 text-xs text-foreground/75 leading-relaxed">
                Root-cause therapies focused on long-term health restoration, cellular vitality, and lasting relief.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
