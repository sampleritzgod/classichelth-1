"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { getWhatsAppUrl } from "@/utils/whatsapp";
import { API_ENDPOINTS } from "@/config";

interface FAQItem {
  q: string;
  a: string;
}

interface TestimonialItem {
  author: string;
  text: string;
}

interface Product {
  id: string | number; // Support mongoose string _id
  _id?: string;
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
  description?: string;
  inStock?: boolean;
  isFeatured?: boolean;
  isAvailable?: boolean;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = ["All", "Supplements", "Tonics & Syrups", "Wellness Oils"];

  const [selectedCategory, setSelectedCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState(2000);
  const [addedItems, setAddedItems] = useState<Record<string | number, boolean>>({});
  
  // Product Detail Modal State
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<"ingredients" | "benefits" | "usage" | "faqs" | "testimonials">("ingredients");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch(API_ENDPOINTS.products);
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const data = await response.json();
        if (data.success) {
          // Map _id to id to keep the rest of the component working cleanly
          const mapped = data.data.map((p: any) => ({
            ...p,
            id: p._id,
          }));
          setProducts(mapped);
        } else {
          throw new Error(data.message || "Failed to fetch products");
        }
      } catch (err: any) {
        console.error("Error loading products:", err);
        setError(err.message || "Something went wrong while loading products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section id="shop" className="py-16 sm:py-20 lg:py-24 border-t border-foreground/5 scroll-mt-20 bg-background animate-pulse">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center py-20">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mb-4" />
          <p className="text-sm text-foreground/60 font-medium font-serif">Harmonizing wellness catalog...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="shop" className="py-16 sm:py-20 lg:py-24 border-t border-foreground/5 scroll-mt-20 bg-background">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center py-20">
          <p className="text-sm text-red-600 font-semibold mb-4">Error: {error}</p>
          <p className="text-xs text-foreground/50">Please verify the server status or try again later.</p>
        </div>
      </section>
    );
  }

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
                      <div className="flex justify-between items-baseline mb-1.5">
                        <span className="text-[10px] font-semibold tracking-wider text-primary uppercase">
                          {product.category}
                        </span>
                        {product.inStock === false && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100 uppercase tracking-wider">
                            Sold Out
                          </span>
                        )}
                      </div>
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
                    {product.inStock !== false ? (
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
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex w-full items-center justify-center rounded-full py-2.5 text-xs font-semibold tracking-wider uppercase bg-foreground/10 text-foreground/45 border border-foreground/5 cursor-not-allowed"
                      >
                        Out of Stock
                      </button>
                    )}
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
                {detailProduct.inStock === false && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center">
                    <span className="bg-red-600 text-white font-serif font-bold text-xs uppercase px-4 py-1.5 rounded-full tracking-widest shadow-md">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>
              <h3 className="font-serif text-xl font-bold text-primary text-center mb-1">{detailProduct.name}</h3>
              <span className="text-xs uppercase tracking-wider text-foreground/50 font-bold mb-3">{detailProduct.category}</span>
              
              {/* Product Short Description */}
              <p className="text-[11px] text-foreground/75 text-center leading-relaxed mb-4 max-w-xs">
                {detailProduct.description || "Premium metabolic recovery formula hand-selected by our clinical specialists."}
              </p>

              <div className="flex gap-x-3 items-baseline mb-6">
                <span className="text-xs text-foreground/40 line-through">₹{detailProduct.originalPrice}</span>
                <span className="text-xl font-bold text-primary">₹{detailProduct.price}</span>
              </div>

              {detailProduct.inStock !== false ? (
                <>
                  <button
                    type="button"
                    onClick={() => { handleAddToCart(detailProduct); setDetailProduct(null); }}
                    className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-white hover:bg-primary-hover shadow-md transition-all duration-300 cursor-pointer"
                  >
                    Add to Shopping Bag
                  </button>

                  <a
                    href={getWhatsAppUrl(`Hello! I would like to order ${detailProduct.name} (₹${detailProduct.price.toLocaleString()}) directly. Please let me know the details.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full rounded-full border border-primary text-primary py-3 text-sm font-semibold hover:bg-primary/5 shadow-xs transition-all duration-300 mt-3 text-center block"
                  >
                    Order on WhatsApp
                  </a>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled
                    className="w-full rounded-full bg-foreground/10 py-3 text-sm font-semibold text-foreground/45 border border-foreground/5 cursor-not-allowed"
                  >
                    Temporarily Unavailable
                  </button>

                  <a
                    href={getWhatsAppUrl(`Hello! I'd like to check availability or join the waiting list for ${detailProduct.name}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full rounded-full border border-primary text-primary py-3 text-sm font-semibold hover:bg-primary/5 shadow-xs transition-all duration-300 mt-3 text-center block"
                  >
                    Join Waitlist (WhatsApp)
                  </a>
                </>
              )}
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
                      <span>For children or specific chronic health histories, please <a href={getWhatsAppUrl(`Hello! I would like to customize a daily consumption schedule for ${detailProduct.name}.`)} target="_blank" rel="noopener noreferrer" className="underline text-primary font-semibold hover:text-[#4caf50]">WhatsApp our therapists</a> to customize your daily consumption schedule.</span>
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
