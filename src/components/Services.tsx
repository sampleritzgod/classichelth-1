import Image from "next/image";

export default function Services() {
  const services = [
    {
      title: "Diabetes Care Program",
      description: "A specialized root-cause recovery path for sugar control, reversing insulin resistance and supporting metabolic wellness naturally.",
      image: "/images/u1st_service_diabetes.png",
      alt: "Friendly doctor sitting in clinic helping a patient manage diabetes",
      href: "#booking",
    },
    {
      title: "PCOD & PCOS Correction",
      description: "Holistic hormonal balance strategies utilizing natural adaptogens, lifestyle correction, and custom diet plans to restore cyclic health.",
      image: "/images/u1st_service_thyroid.png",
      alt: "Woman standing mindfully in a tranquil park representing hormone balance",
      href: "#booking",
    },
    {
      title: "Obesity & Weight Management",
      description: "Comprehensive, healthy weight control programs focusing on gut metabolism optimization, personalized nutrition, and cellular vitality.",
      image: "/images/u1st_service_obesity.png",
      alt: "Rustic tray with carrots, tomatoes, greens, and glass water bottle",
      href: "#booking",
    },
    {
      title: "Heart Health Support",
      description: "Cardiovascular wellness support via traditional cardio-protective herbs, stress reduction, and blood pressure regulation practices.",
      image: "/images/service_consultation.png",
      alt: "Wellness check and traditional pulse assessment tools",
      href: "#booking",
    },
    {
      title: "Joint Care & Pain Relief",
      description: "Relief from chronic arthritis, cervical, and joint issues using local warm herbal therapies and natural anti-inflammatory diets.",
      image: "/images/service_massage.png",
      alt: "Warm therapy stones and massage therapy representing joint care",
      href: "#booking",
    },
    {
      title: "Immunity & Wellness",
      description: "Enhance your natural defense mechanism and rejuvenate cellular energy through traditional Rasayana herbs and gentle detox therapies.",
      image: "/images/blog_nutrition.png",
      alt: "Fresh organic vegetables representing immune-boosting nutrition",
      href: "#booking",
    },
  ];

  return (
    <section id="services" className="py-16 sm:py-20 lg:py-24 border-t border-foreground/5 scroll-mt-20 bg-accent-soft/20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-up">
          <span className="text-xs font-bold tracking-widest text-primary uppercase mb-4 inline-block px-3 py-1 rounded-full bg-primary/5">
            Care Programs
          </span>
          <h2 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl font-serif mb-6 leading-tight">
            Disease Management Programs
          </h2>
          <p className="text-base text-foreground/80 leading-relaxed max-w-2xl mx-auto">
            We offer dedicated wellness programs that focus on root-cause analysis, lifestyle modification, and traditional Ayurvedic protocols to restore your health.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6 lg:gap-x-8">
          {services.map((service, index) => (
            <div 
              key={index} 
              className="flex flex-col h-full group bg-background rounded-3xl p-6 border border-foreground/5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-primary/20"
            >
              {/* Image Container */}
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 border border-foreground/5">
                <Image
                  src={service.image}
                  alt={service.alt}
                  fill
                  className="object-cover transition-transform duration-750 group-hover:scale-103"
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>

              {/* Content */}
              <h3 className="text-xl font-medium font-serif text-foreground mb-3 group-hover:text-primary transition-colors">
                {service.title}
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed mb-6 flex-grow">
                {service.description}
              </p>
              
              <a
                href={service.href}
                className="text-sm font-semibold text-primary inline-flex items-center gap-x-1 self-start relative after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-full after:bg-primary after:origin-bottom-right after:scale-x-100 group-hover:after:origin-bottom-left group-hover:after:scale-x-0 after:transition-transform after:duration-300"
              >
                Learn More
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
