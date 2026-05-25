"use client";

import { useState } from "react";
import Image from "next/image";

interface FAQItem {
  q: string;
  a: string;
}

interface TestimonialItem {
  author: string;
  text: string;
}

interface Product {
  id: number;
  name: string;
  originalPrice: number;
  price: number;
  image: string;
  category: string;
  alt: string;
  ingredients: string[];
  benefits: string[];
  usage: string;
  faqs: FAQItem[];
  testimonials: TestimonialItem[];
}

export default function Products() {
  const products: Product[] = [
    {
      id: 1,
      name: "Hridya Mitra",
      originalPrice: 1260,
      price: 780,
      image: "/images/service_consultation.png",
      category: "Tonics & Syrups",
      alt: "Hridya Mitra cardiac support herbal syrup bottle",
      ingredients: ["Arjuna Bark", "Pushkarmool", "Shankhpushpi", "Ashwagandha", "Brahmi"],
      benefits: [
        "Supports cardiovascular muscle strength.",
        "Aids in maintaining normal blood pressure levels.",
        "Helps calm nervous palpitations and stress-induced heart tightness."
      ],
      usage: "Take 10-15 ml (2-3 teaspoons) with an equal quantity of warm water twice a day after meals, or as advised by your Ayurvedic assessment.",
      faqs: [
        { q: "Is Hridya Mitra safe to take with modern medications?", a: "Yes, it generally supports wellness. However, we advise scheduling a free consultation to align it with any current prescription drugs." },
        { q: "How long should I consume this?", a: "For optimal metabolic support, we recommend taking Hridya Mitra consistently for 3 to 6 months." }
      ],
      testimonials: [
        { author: "Rajesh K., Indore", text: "My mild chest anxiety and racing heart rate during stressful hours have significantly stabilized after 2 months of use." }
      ]
    },
    {
      id: 2,
      name: "Himalyan Shilajeet Resin",
      originalPrice: 1490,
      price: 1200,
      image: "/images/u1st_product_shilajit.png",
      category: "Supplements",
      alt: "Premium Himalyan Shilajeet Resin jar with golden lid and black packaging box",
      ingredients: ["100% Purified Himalayan Shilajit (Shudh Shilajit) resin"],
      benefits: [
        "Rich in Fulvic Acid and over 80+ essential cellular trace minerals.",
        "Improves cellular energy levels, stamina, and recovery speed.",
        "Supports natural immune system defenses and joint mobility."
      ],
      usage: "Dissolve a pea-sized portion (approx. 250mg) in a glass of warm milk, green tea, or warm water. Consume once daily in the morning on an empty stomach.",
      faqs: [
        { q: "How do I test the purity of this Shilajeet?", a: "Our shilajit is lab-certified pure. It completely dissolves in warm water without leaving any residue, and has a rich, smoky aroma." },
        { q: "Can women consume Shilajeet?", a: "Yes, Shilajit is highly beneficial for both men and women to restore mineral balances, improve energy, and support bone density." }
      ],
      testimonials: [
        { author: "Anjali S., Bhopal", text: "I struggled with fatigue and post-workout soreness. A pea-sized dose in warm milk every morning has completely transformed my endurance levels!" }
      ]
    },
    {
      id: 3,
      name: "Triphala Guggul",
      originalPrice: 450,
      price: 320,
      image: "/images/product_supplement.png",
      category: "Supplements",
      alt: "Triphala Guggul digestive health organic tablets",
      ingredients: ["Amalaki (Amla)", "Bibhitaki", "Haritaki", "Shuddh Guggul Resin"],
      benefits: [
        "Gently cleanses the digestive tract and relieves chronic bloating.",
        "Promotes weight management by improving metabolic fire (Agni).",
        "Aids in natural systemic detoxification and joint wellness."
      ],
      usage: "Take 1 to 2 tablets twice a day with warm water after meals, or as directed by an Ayurvedic wellness practitioner.",
      faqs: [
        { q: "Does it cause laxative dependency?", a: "No. Unlike synthetic laxatives, Triphala Guggul is a natural rejuvenator that strengthens bowel walls and regulates functions without causing habituation." },
        { q: "Is it good for joint pain?", a: "Yes, the presence of Guggulu resin helps remove joint toxins (Ama), supporting flexibility and reducing discomfort." }
      ],
      testimonials: [
        { author: "Manoj P., Indore", text: "My morning bloating and stomach heaviness are completely gone. Highly recommend for overall gut relief!" }
      ]
    },
    {
      id: 4,
      name: "Univeer Syrup",
      originalPrice: 1260,
      price: 945,
      image: "/images/service_skincare.png",
      category: "Tonics & Syrups",
      alt: "Univeer immune boosting herbal syrup bottle",
      ingredients: ["Giloy (Guduchi)", "Tulsi (Holy Basil)", "Neem", "Haldi (Turmeric)", "Mulethi (Licorice)"],
      benefits: [
        "Builds robust resistance against seasonal infections and coughs.",
        "Acts as a powerful natural blood purifier and supports skin clarity.",
        "Helps manage fever and maintains healthy respiratory airflow."
      ],
      usage: "Take 15-20 ml (3-4 teaspoons) twice daily with an equal quantity of warm water before meals, or as directed by your physician.",
      faqs: [
        { q: "Is this safe for children?", a: "Yes, children above 5 years can take 5 ml daily under supervision. For personalized dosages, WhatsApp our care team." },
        { q: "Does it help with skin allergies?", a: "Yes, Giloy, Neem, and Turmeric are highly anti-allergenic and support skin health from the inside out." }
      ],
      testimonials: [
        { author: "Sunita R., Indore", text: "We take Univeer every winter. It has drastically reduced the frequency of seasonal colds and sore throats for my entire family." }
      ]
    },
    {
      id: 5,
      name: "Digi Plus Syrup",
      originalPrice: 650,
      price: 495,
      image: "/images/product_serum.png",
      category: "Tonics & Syrups",
      alt: "Digi Plus digestive care organic syrup bottle",
      ingredients: ["Jeera (Cumin)", "Saunf (Fennel)", "Ajwain (Carom)", "Pudina (Mint)", "Chitraka"],
      benefits: [
        "Instantly relieves acidity, flatulence, and stomach cramps.",
        "Stimulates appetite and digestive enzyme secretion.",
        "Supports liver function and smooth nutrient assimilation."
      ],
      usage: "Take 10 ml after lunch and dinner with a little warm water for active digestive assistance.",
      faqs: [
        { q: "Can I take this during pregnancy?", a: "We advise consulting our Ayurvedic doctor via WhatsApp before taking any formulations during pregnancy." },
        { q: "Does it contain added sugar?", a: "No, Digi Plus is formulated sugar-free to ensure it is suitable for diabetic patients as well." }
      ],
      testimonials: [
        { author: "Vikram S., Ujjain", text: "Just one spoon of Digi Plus after heavy meals stops my acid reflux immediately. Very effective formula." }
      ]
    },
    {
      id: 6,
      name: "Pida Harak Oil & Ointment",
      originalPrice: 850,
      price: 650,
      image: "/images/product_oil.png",
      category: "Wellness Oils",
      alt: "Pida Harak joint and muscular pain relief oil bottle",
      ingredients: ["Mahanarayan Oil", "Gandhapura Oil (Wintergreen)", "Nilgiri (Eucalyptus) Oil", "Shallaki Extract"],
      benefits: [
        "Deep penetrating action for joint, knee, and back pain relief.",
        "Reduces swelling, muscular rigidity, and local inflammation.",
        "Supports cartilage wellness and range of motion."
      ],
      usage: "Gently apply 5-10 drops on the affected area and massage in circular motions. For best results, follow with warm compression.",
      faqs: [
        { q: "Is it sticky?", a: "Our sesame-oil base is absorbed quickly into the skin and does not leave a greasy, heavy residue on clothing." },
        { q: "Can I use it for daily knee pain?", a: "Yes, massaging twice daily helps maintain synovial fluid circulation and supports joint mobility in elderly patients." }
      ],
      testimonials: [
        { author: "Guru Das, Indore", text: "My chronic back stiffness has reduced by 80%. The soothing warm feel after application is amazing." }
      ]
    },
    {
      id: 7,
      name: "Jeevan Rakshak Harad",
      originalPrice: 750,
      price: 580,
      image: "/images/product_supplement.png",
      category: "Supplements",
      alt: "Jeevan Rakshak Harad detoxifying ayurvedic powder",
      ingredients: ["Chhoti Harad (Terminalia chebula)", "Saindhav Salt", "Hing (Asafoetida)"],
      benefits: [
        "A classical rejuvenator that corrects gastrointestinal sluggishness.",
        "Clears deep-seated toxins (Ama) from the digestive system.",
        "Helps relieve gas, stomach heaviness, and mild constipation."
      ],
      usage: "Consume 1/2 to 1 teaspoon with warm water at bedtime to ensure smooth morning elimination.",
      faqs: [
        { q: "What makes Harad so special in Ayurveda?", a: "Harad is known as the 'Mother of Herbs' because it balances all three doshas (Vata, Pitta, Kapha) and acts as a daily internal cleanser." },
        { q: "Is it bitter?", a: "It has a traditional astringent, salty, and herbal taste. If you find the taste strong, you can consume it with a teaspoon of organic honey." }
      ],
      testimonials: [
        { author: "Sneha G., Bhopal", text: "Jeevan Rakshak Harad has corrected my bowel habits. I feel much lighter and more energetic throughout the day." }
      ]
    },
    {
      id: 8,
      name: "Aloe Vera Gel & Juice Kit",
      originalPrice: 550,
      price: 395,
      image: "/images/about_practitioner.png",
      category: "Wellness Oils",
      alt: "Organic Aloe Vera soothing gel and pure health juice",
      ingredients: ["99% Pure Organic Aloe Vera Inner-Leaf Pulp", "Vitamin E (Natural Preservative)"],
      benefits: [
        "Hydrates, soothes, and cools inflamed or dry skin.",
        "Aloe juice supports detoxification, gut lining recovery, and liver health.",
        "Aids in healing sunburns, minor cuts, and reduces acne flares."
      ],
      usage: "Gel: Apply topically to face and body as needed. Juice: Take 20-30 ml with warm water first thing in the morning.",
      faqs: [
        { q: "Is this product chemical-free?", a: "Yes, our Aloe Gel is free from artificial colors, parabens, and synthetic fragrances. It is directly cold-stabilized from fresh organic leaves." },
        { q: "How should I store the juice?", a: "Keep the Aloe juice bottle refrigerated once opened, and consume it within 45 days." }
      ],
      testimonials: [
        { author: "Nisha J., Dewas", text: "The aloe gel is extremely pure. It doesn't have that fake green color or sticky smell. It works wonders on my sensitive skin." }
      ]
    }
  ];

  const categories = ["All", "Supplements", "Tonics & Syrups", "Wellness Oils"];

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState(2000);
  const [addedItems, setAddedItems] = useState<{ [key: number]: boolean }>({});
  
  // Product Detail Modal State
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<"ingredients" | "benefits" | "usage" | "faqs" | "testimonials">("ingredients");

  const handleAddToCart = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Prevent opening detail modal
    
    // Read current cart
    const currentCartRaw = localStorage.getItem("u1st_cart");
    let currentCart: any[] = [];
    if (currentCartRaw) {
      try {
        currentCart = JSON.parse(currentCartRaw);
      } catch (err) {
        console.error("Failed to parse cart raw", err);
      }
    }

    // Check if item exists
    const existingIndex = currentCart.findIndex((item) => item.id === product.id);
    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += 1;
    } else {
      currentCart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: 1,
      });
    }

    // Save back to localStorage
    localStorage.setItem("u1st_cart", JSON.stringify(currentCart));

    // Dispatch global cart change event
    window.dispatchEvent(new Event("u1st_cart_change"));

    // Show temporary "Added!" state
    setAddedItems((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const filteredProducts = products.filter((product) => {
    const categoryMatch = selectedCategory === "All" || product.category === selectedCategory;
    const priceMatch = product.price <= maxPrice;
    return categoryMatch && priceMatch;
  });

  return (
    <section id="shop" className="py-16 sm:py-20 lg:py-24 border-t border-foreground/5 scroll-mt-20 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-12 animate-fade-up">
          <span className="text-xs font-bold tracking-widest text-primary uppercase mb-4 inline-block px-3 py-1 rounded-full bg-primary/5">
            Wellness Store
          </span>
          <h2 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl font-serif mb-6 leading-tight">
            Curated Wellness Essentials
          </h2>
          <p className="text-base text-foreground/80 leading-relaxed">
            Explore our range of syrups, capsules, powders, and wellness kits designed to support your metabolic recovery and daily vitality. Click any product to read its ingredients, benefits, and usage guides.
          </p>
        </div>

        {/* Layout: Sidebar & Product Grid */}
        <div className="grid grid-cols-1 gap-y-10 lg:grid-cols-12 lg:gap-x-12">
          {/* Left Column: Filter Sidebar */}
          <aside className="lg:col-span-3 bg-accent-soft/30 rounded-3xl p-6 border border-foreground/5 self-start">
            <h3 className="font-serif text-lg font-semibold text-primary mb-6 border-b border-foreground/5 pb-3">
              Filter by
            </h3>

            {/* Categories */}
            <div className="mb-8">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-4">
                Category
              </h4>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-all duration-200 cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-primary text-white font-medium"
                        : "text-foreground/80 hover:bg-foreground/5 hover:text-primary"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <div className="flex justify-between items-baseline mb-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                  Max Price
                </h4>
                <span className="text-xs font-semibold text-primary">₹{maxPrice}</span>
              </div>
              <input
                type="range"
                min="300"
                max="2000"
                step="50"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full h-1.5 bg-foreground/15 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[10px] text-foreground/40 mt-2">
                <span>₹300</span>
                <span>₹2,000</span>
              </div>
            </div>
          </aside>

          {/* Right Column: Product Grid */}
          <main className="lg:col-span-9">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-accent-soft/10 rounded-3xl border border-dashed border-foreground/10">
                <p className="text-sm text-foreground/60">No products match your active filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6 lg:gap-x-8">
                {filteredProducts.map((product) => (
                  <div 
                    key={product.id} 
                    onClick={() => { setDetailProduct(product); setActiveDetailTab("ingredients"); }}
                    className="flex flex-col h-full group bg-accent-soft/10 rounded-2xl p-4 border border-foreground/5 transition-all duration-300 hover:shadow-md hover:-translate-y-1 hover:border-primary/20 cursor-pointer"
                  >
                    {/* Product Image */}
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden mb-5 border border-foreground/5 bg-foreground/[0.01]">
                      <Image
                        src={product.image}
                        alt={product.alt}
                        fill
                        className="object-cover transition-transform duration-750 group-hover:scale-103"
                        loading="lazy"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex flex-col flex-grow mb-4">
                      <span className="text-[10px] font-semibold tracking-wider text-primary uppercase mb-1.5">
                        {product.category}
                      </span>
                      <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                        {product.name}
                      </h3>
                      <div className="flex gap-x-2.5 items-baseline mt-auto">
                        <span className="text-xs text-foreground/40 line-through">
                          ₹{product.originalPrice}
                        </span>
                        <span className="text-sm font-bold text-primary">
                          ₹{product.price}
                        </span>
                      </div>
                    </div>

                    {/* Add To Cart Button */}
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(product, e)}
                      className={`inline-flex w-full items-center justify-center rounded-full py-2.5 text-xs font-semibold tracking-wider uppercase transition-all duration-350 focus:outline-none cursor-pointer ${
                        addedItems[product.id]
                          ? "bg-primary text-white scale-[0.98]"
                          : "bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow-md hover:shadow-primary/10"
                      }`}
                    >
                      {addedItems[product.id] ? "Added!" : "Add to Cart"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Product Detail Modal (Shows Ingredients, Benefits, Usage, FAQ, Testimonials) */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div onClick={() => setDetailProduct(null)} className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" />
          
          {/* Modal Card */}
          <div className="relative w-full max-w-3xl rounded-[2rem] bg-background p-6 sm:p-8 shadow-2xl border border-foreground/5 animate-fade-up max-h-[90vh] overflow-y-auto grid grid-cols-1 md:grid-cols-12 gap-8 z-10">
            
            {/* Close Button */}
            <button 
              onClick={() => setDetailProduct(null)}
              className="absolute top-4 right-4 p-1.5 text-foreground/60 hover:text-foreground hover:bg-foreground/5 rounded-full z-20 cursor-pointer"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Left Side: Product Image & CTA */}
            <div className="md:col-span-5 flex flex-col items-center">
              <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-foreground/5 bg-foreground/[0.01] mb-6">
                <Image src={detailProduct.image} alt={detailProduct.alt} fill className="object-cover" />
              </div>
              <h3 className="font-serif text-xl font-bold text-primary text-center mb-1">{detailProduct.name}</h3>
              <span className="text-xs uppercase tracking-wider text-foreground/50 font-bold mb-4">{detailProduct.category}</span>
              
              <div className="flex gap-x-3 items-baseline mb-6">
                <span className="text-sm text-foreground/40 line-through">₹{detailProduct.originalPrice}</span>
                <span className="text-xl font-bold text-primary">₹{detailProduct.price}</span>
              </div>

              <button
                type="button"
                onClick={() => { handleAddToCart(detailProduct); setDetailProduct(null); }}
                className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-hover shadow-md transition-all duration-300"
              >
                Add to Shopping Bag
              </button>
            </div>

            {/* Right Side: Informative Tabs (Ingredients, Benefits, Usage, FAQ, Testimonials) */}
            <div className="md:col-span-7 flex flex-col border-t md:border-t-0 md:border-l border-foreground/5 pt-6 md:pt-0 md:pl-6">
              
              {/* Tab Bar */}
              <div className="flex flex-wrap gap-1.5 border-b border-foreground/5 pb-4 mb-4">
                {(["ingredients", "benefits", "usage", "faqs", "testimonials"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDetailTab(tab)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-colors cursor-pointer ${
                      activeDetailTab === tab
                        ? "bg-primary/5 text-primary border border-primary/20"
                        : "text-foreground/60 hover:text-primary hover:bg-foreground/5"
                    }`}
                  >
                    {tab === "faqs" ? "FAQ" : tab}
                  </button>
                ))}
              </div>

              {/* Tab Content Panels */}
              <div className="flex-grow overflow-y-auto max-h-[40vh] pr-2">
                {/* 1. Ingredients */}
                {activeDetailTab === "ingredients" && (
                  <div className="space-y-4 animate-fade-up">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2">Key Ayurvedic Ingredients</h4>
                    <div className="flex flex-wrap gap-2">
                      {detailProduct.ingredients.map((ing, i) => (
                        <span key={i} className="inline-flex items-center rounded-lg bg-[#4caf50]/10 px-3 py-1.5 text-xs font-semibold text-[#1a3b22]">
                          🍀 {ing}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-foreground/60 leading-relaxed mt-4">
                      Every ingredient is hand-selected, cleaned, and processed using ancient classical methodologies to ensure maximum pranic vitality and safety.
                    </p>
                  </div>
                )}

                {/* 2. Benefits */}
                {activeDetailTab === "benefits" && (
                  <ul className="space-y-3 animate-fade-up">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2">Health Benefits</h4>
                    {detailProduct.benefits.map((ben, i) => (
                      <li key={i} className="flex items-start gap-x-2.5 text-sm text-foreground/80 leading-relaxed">
                        <span className="text-[#4caf50] mt-1 font-bold">✓</span>
                        <span>{ben}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* 3. Usage */}
                {activeDetailTab === "usage" && (
                  <div className="space-y-4 animate-fade-up">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2">How to Use / Dosage</h4>
                    <div className="bg-accent-soft/40 border border-foreground/5 p-4 rounded-xl">
                      <p className="text-sm text-foreground/80 font-medium leading-relaxed">
                        {detailProduct.usage}
                      </p>
                    </div>
                    <div className="flex items-start gap-x-2.5 text-xs text-foreground/50">
                      <span className="text-[#b38f4d] font-bold">ℹ</span>
                      <span>For children or specific chronic health histories, please WhatsApp our therapists to customize your daily consumption schedule.</span>
                    </div>
                  </div>
                )}

                {/* 4. FAQ */}
                {activeDetailTab === "faqs" && (
                  <div className="space-y-4 animate-fade-up">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2">Frequently Asked Questions</h4>
                    {detailProduct.faqs.map((faq, i) => (
                      <div key={i} className="border-b border-foreground/5 pb-3">
                        <p className="text-sm font-semibold text-primary mb-1">Q: {faq.q}</p>
                        <p className="text-xs text-foreground/70 leading-relaxed">A: {faq.a}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* 5. Testimonials */}
                {activeDetailTab === "testimonials" && (
                  <div className="space-y-4 animate-fade-up">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/50 mb-2">Verified Patient Testimonials</h4>
                    {detailProduct.testimonials.map((test, i) => (
                      <div key={i} className="bg-foreground/[0.01] p-4 rounded-xl border border-foreground/5 italic text-sm text-foreground/80">
                        <p className="mb-2">"{test.text}"</p>
                        <span className="text-xs font-bold not-italic text-primary block text-right">— {test.author}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        </div>
      )}
    </section>
  );
}
