import Image from "next/image";

export default function Blog() {
  const posts = [
    {
      title: "Cultivating Daily Mindfulness",
      snippet: "Learn simple breathing techniques and tea rituals to anchor your focus and find quiet intervals during busy workdays.",
      image: "/images/blog_mindfulness.png",
      alt: "Hands holding a hot ceramic cup of herbal tea with camomile flowers and lemon",
      href: "#",
    },
    {
      title: "The Essentials of Clean Nutrition",
      snippet: "Discover how fresh, organic greens, healthy fats, and seasonal whole foods can elevate energy levels and restore natural digestion.",
      image: "/images/blog_nutrition.png",
      alt: "Fresh organic vegetables like kale, broccoli, avocado, and radishes on an off-white wooden surface",
      href: "#",
    },
    {
      title: "Simple Restorative Routines",
      snippet: "Practical morning stretch habits and evening winding-down rituals to release muscular stress and improve sleep quality.",
      image: "/images/blog_lifestyle.png",
      alt: "A rolled-up green yoga mat and water bottle in a sunlit room on a wooden floor",
      href: "#",
    },
  ];

  return (
    <section id="blog" className="py-20 lg:py-32 border-t border-foreground/5 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mb-16">
          <span className="text-xs font-semibold tracking-wider text-primary uppercase mb-3">
            Insights & Journal
          </span>
          <h2 className="text-3xl font-normal tracking-tight text-foreground sm:text-4xl font-serif mb-4">
            Simple wellness wisdom.
          </h2>
          <p className="text-base text-foreground/80 leading-relaxed">
            Practical guides, clinical notes, and restorative practices compiled by our therapists to help you foster balance in your daily life.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-8 lg:gap-x-12">
          {posts.map((post, index) => (
            <article key={index} className="flex flex-col group">
              {/* Blog Image */}
              <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 border border-foreground/5 shadow-sm">
                <Image
                  src={post.image}
                  alt={post.alt}
                  fill
                  className="object-cover"
                  loading="lazy"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>

              {/* Blog Title & Content */}
              <h3 className="text-xl font-medium font-serif text-foreground mb-3">
                {post.title}
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed mb-4 flex-grow">
                {post.snippet}
              </p>
              <a
                href={post.href}
                className="text-sm font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-x-1 self-start"
              >
                Read More
                <span aria-hidden="true">&rarr;</span>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
