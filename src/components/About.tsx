import Image from "next/image";

export default function About() {
  return (
    <section id="about" className="py-16 sm:py-20 lg:py-24 border-t border-foreground/5 scroll-mt-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-12 lg:gap-x-16 lg:items-center">
          {/* Left Column: Vertical Serene Treatment Room Image */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-[3/4] rounded-[2rem] overflow-hidden border border-foreground/5 shadow-xl transition-all duration-500 hover:shadow-2xl group">
              {/* Soft overlay */}
              <div className="absolute inset-0 z-10 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none opacity-60" />
              <Image
                src="/images/u1st_about_room.png"
                alt="A serene therapy room at U 1st Creation wellness clinic with elegant wooden massage tables, clean linen, and lush green plants"
                fill
                loading="lazy"
                className="object-cover transition-transform duration-750 group-hover:scale-103"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </div>

          {/* Right Column: Heading & Philosophy Text */}
          <div className="lg:col-span-7 flex flex-col justify-center text-left">
            <span className="text-xs font-bold tracking-widest text-primary uppercase mb-4 px-3 py-1 rounded-full bg-primary/5 self-start">
              Our Philosophy
            </span>
            <h2 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl font-serif mb-6 leading-tight">
              Our Healing Philosophy
            </h2>
            <div className="space-y-4 text-base text-foreground/80 leading-relaxed max-w-2xl">
              <p>
                We believe that true wellness begins with understanding the root cause of your health journey. At U 1st Creation, we move beyond symptom management to offer personalized treatment plans that integrate natural healing methods with modern healthcare practices.
              </p>
              <p>
                Our clinical protocols are guided by BAMS Doctors and Health Experts, ensuring safe, evidence-based care. We combine traditional pulse diagnosis (Nadi Parikshan) with personalized nutrition and organic botanicals to support long-term recovery.
              </p>
            </div>
            
            {/* Stats and Credentials */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-foreground/5 pt-8 mt-8 mb-8">
              <div>
                <span className="block font-serif text-3xl font-bold text-primary">7+</span>
                <span className="block text-[10px] uppercase tracking-wider text-foreground/60 font-semibold mt-1 leading-tight">Years Clinical Excellence</span>
              </div>
              <div>
                <span className="block font-serif text-3xl font-bold text-primary">10k+</span>
                <span className="block text-[10px] uppercase tracking-wider text-foreground/60 font-semibold mt-1 leading-tight">Consultations Completed</span>
              </div>
              <div>
                <span className="block font-serif text-3xl font-bold text-primary">100%</span>
                <span className="block text-[10px] uppercase tracking-wider text-foreground/60 font-semibold mt-1 leading-tight">Organic Formulations</span>
              </div>
              <div>
                <span className="block font-serif text-3xl font-bold text-primary">98%</span>
                <span className="block text-[10px] uppercase tracking-wider text-foreground/60 font-semibold mt-1 leading-tight">Patient Satisfaction</span>
              </div>
            </div>
            
            <a
              href="#booking"
              className="inline-flex items-center justify-center rounded-full border border-primary px-8 py-3.5 text-sm font-semibold text-primary transition-all duration-350 hover:bg-primary hover:text-white self-start cursor-pointer hover:translate-y-[-2px]"
            >
              Our Approach
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
