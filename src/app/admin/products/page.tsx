"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
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
  _id?: string;
  name: string;
  originalPrice: number;
  price: number;
  image: string;
  category: "Supplements" | "Tonics & Syrups" | "Wellness Oils";
  alt: string;
  ingredients: string[];
  benefits: string[];
  usage: string;
  faqs: FAQItem[];
  testimonials: TestimonialItem[];
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Notification Toast state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null); // null means "Add New"
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form Fields State
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"Supplements" | "Tonics & Syrups" | "Wellness Oils">("Supplements");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [image, setImage] = useState("");
  const [alt, setAlt] = useState("");
  const [usage, setUsage] = useState("");
  const [ingredientsText, setIngredientsText] = useState(""); // Comma separated
  const [benefitsText, setBenefitsText] = useState(""); // Line separated
  
  // Sub-forms for FAQs & Testimonials
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [faqQ, setFaqQ] = useState("");
  const [faqA, setFaqA] = useState("");

  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [testAuthor, setTestAuthor] = useState("");
  const [testText, setTestText] = useState("");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let url = API_ENDPOINTS.products;
      if (categoryFilter !== "all") {
        url += `?category=${encodeURIComponent(categoryFilter)}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      if (json.success) {
        setProducts(json.data);
      } else {
        throw new Error(json.message || "Failed to load products");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to retrieve products from the database.");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Open Add Form Modal
  const openAddModal = () => {
    setCurrentProduct(null);
    setName("");
    setCategory("Supplements");
    setPrice("");
    setOriginalPrice("");
    setImage("/images/product_supplement.png"); // Default safe fallback
    setAlt("");
    setUsage("");
    setIngredientsText("");
    setBenefitsText("");
    setFaqs([]);
    setTestimonials([]);
    setIsFormModalOpen(true);
  };

  // Open Edit Form Modal
  const openEditModal = (prod: Product) => {
    setCurrentProduct(prod);
    setName(prod.name);
    setCategory(prod.category);
    setPrice(prod.price.toString());
    setOriginalPrice(prod.originalPrice.toString());
    setImage(prod.image);
    setAlt(prod.alt);
    setUsage(prod.usage);
    setIngredientsText(prod.ingredients.join(", "));
    setBenefitsText(prod.benefits.join("\n"));
    setFaqs(prod.faqs || []);
    setTestimonials(prod.testimonials || []);
    setIsFormModalOpen(true);
  };

  // FAQ Array management
  const addFAQItem = () => {
    if (!faqQ.trim() || !faqA.trim()) return;
    setFaqs((prev) => [...prev, { q: faqQ.trim(), a: faqA.trim() }]);
    setFaqQ("");
    setFaqA("");
  };

  const removeFAQItem = (index: number) => {
    setFaqs((prev) => prev.filter((_, i) => i !== index));
  };

  // Testimonial Array management
  const addTestimonialItem = () => {
    if (!testAuthor.trim() || !testText.trim()) return;
    setTestimonials((prev) => [...prev, { author: testAuthor.trim(), text: testText.trim() }]);
    setTestAuthor("");
    setTestText("");
  };

  const removeTestimonialItem = (index: number) => {
    setTestimonials((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit form handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !price || !originalPrice || !image.trim() || !usage.trim()) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    const payload = {
      name: name.trim(),
      category,
      price: parseFloat(price),
      originalPrice: parseFloat(originalPrice),
      image: image.trim(),
      alt: alt.trim() || `${name} catalog image`,
      usage: usage.trim(),
      ingredients: ingredientsText.split(",").map((i) => i.trim()).filter(Boolean),
      benefits: benefitsText.split("\n").map((b) => b.trim()).filter(Boolean),
      faqs,
      testimonials,
    };

    try {
      let url = API_ENDPOINTS.adminProducts;
      let method = "POST";

      if (currentProduct && currentProduct._id) {
        url = `${API_ENDPOINTS.adminProducts}/${currentProduct._id}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer mock_token",
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();
      if (response.ok && json.success) {
        showToast(currentProduct ? "Product updated successfully" : "Product added successfully");
        setIsFormModalOpen(false);
        fetchProducts(); // Refresh list
      } else {
        throw new Error(json.message || "Failed to save product changes");
      }
    } catch (err: any) {
      showToast(err.message || "Error saving product changes", "error");
    }
  };

  // Delete product handler
  const handleDeleteProduct = async (id: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.adminProducts}/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: "Bearer mock_token",
        },
      });

      const json = await response.json();
      if (response.ok && json.success) {
        showToast("Product deleted successfully");
        setProducts((prev) => prev.filter((p) => p._id !== id));
      } else {
        throw new Error(json.message || "Failed to delete product");
      }
    } catch (err: any) {
      showToast(err.message || "Could not delete product", "error");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Filter products locally for search, while category uses API filter
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center p-4 rounded-xl shadow-lg border transition-all duration-300 ${
          toast.type === "success" 
            ? "bg-green-50 border-green-200 text-green-800" 
            : "bg-red-50 border-red-200 text-red-800"
        }`}>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-foreground/5 pb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight font-serif text-foreground">
            Product Catalog Catalog
          </h1>
          <p className="text-xs text-foreground/50 mt-1">
            Add new wellness products, modify pricing, upload images, and update Ayurvedic details.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="mt-4 sm:mt-0 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-white hover:bg-primary-hover cursor-pointer transition-all shadow-md shadow-primary/10"
        >
          + Add New Product
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="bg-white rounded-2xl border border-foreground/5 p-6 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        {/* Search */}
        <div className="w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search products by catalog name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
          />
        </div>

        {/* Category selector */}
        <div className="flex gap-x-2 w-full sm:w-auto">
          {["all", "Supplements", "Tonics & Syrups", "Wellness Oils"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                categoryFilter === cat
                  ? "bg-primary text-white border-primary"
                  : "bg-background text-foreground/75 border-foreground/10 hover:bg-foreground/5"
              }`}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products catalog list grid */}
      {loading && products.length === 0 ? (
        <div className="text-center py-20 animate-pulse font-serif text-foreground/50">
          Syncing product catalog...
        </div>
      ) : error ? (
        <div className="p-12 text-center text-red-600 font-semibold">{error}</div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-foreground/5 p-16 text-center shadow-xs">
          <span className="text-4xl block mb-4">📦</span>
          <h3 className="font-serif text-lg font-medium text-foreground mb-1">
            No products logged.
          </h3>
          <p className="text-xs text-foreground/50">
            Create your first catalog item by clicking the "+ Add New Product" button.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <div
              key={product._id}
              className="bg-white rounded-2xl border border-foreground/5 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
            >
              {/* Image box */}
              <div className="relative w-full aspect-square bg-foreground/[0.02] border-b border-foreground/5">
                <Image
                  src={product.image}
                  alt={product.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                />
              </div>

              {/* Body */}
              <div className="p-4 flex-grow flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                    {product.category}
                  </span>
                  <h3 className="font-serif text-base font-semibold text-foreground mt-1 line-clamp-1">
                    {product.name}
                  </h3>

                  <div className="flex gap-x-2 items-baseline mt-2 mb-4">
                    <span className="text-[10px] text-foreground/40 line-through">₹{product.originalPrice}</span>
                    <span className="text-xs font-bold text-primary">₹{product.price}</span>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-x-2 border-t border-foreground/5 pt-3">
                  <button
                    onClick={() => openEditModal(product)}
                    className="flex-1 rounded-lg border border-primary/20 py-2 text-center text-[10px] font-bold text-primary hover:bg-primary/5 transition-all cursor-pointer"
                  >
                    Edit Details
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(product._id || null)}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all cursor-pointer border border-red-50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD Product Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsFormModalOpen(false)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-2xl bg-background rounded-3xl p-6 sm:p-8 border border-foreground/5 shadow-2xl z-10 max-h-[90vh] overflow-y-auto animate-fade-up">
            <h2 className="font-serif text-xl font-bold text-primary mb-6 border-b border-foreground/5 pb-4">
              {currentProduct ? `Edit Catalog Details: ${currentProduct.name}` : "Create New Product Entry"}
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    placeholder="e.g. Organic Shatavari Capsule"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="Supplements">Supplements</option>
                    <option value="Tonics & Syrups">Tonics & Syrups</option>
                    <option value="Wellness Oils">Wellness Oils</option>
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Sale Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    placeholder="e.g. 580"
                  />
                </div>

                {/* Original Price */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Original Retail Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    placeholder="e.g. 750"
                  />
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Image Asset Path / URL *</label>
                  <input
                    type="text"
                    required
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    placeholder="e.g. /images/product_supplement.png"
                  />
                </div>

                {/* Image Alt */}
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1.5">Image Accessibility Alt *</label>
                  <input
                    type="text"
                    value={alt}
                    onChange={(e) => setAlt(e.target.value)}
                    className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    placeholder="Describe image for screenreaders"
                  />
                </div>
              </div>

              {/* Usage guidelines */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">Usage / Dosage Guidelines *</label>
                <textarea
                  required
                  rows={2}
                  value={usage}
                  onChange={(e) => setUsage(e.target.value)}
                  className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none resize-y"
                  placeholder="Take 1 tablet daily at bedtime with warm water..."
                />
              </div>

              {/* Ingredients & Benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Key Ingredients (Comma separated)</label>
                  <span className="text-[10px] text-foreground/40 block mb-1.5">Example: Amalaki, Bibhitaki, Haritaki</span>
                  <input
                    type="text"
                    value={ingredientsText}
                    onChange={(e) => setIngredientsText(e.target.value)}
                    className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground mb-1">Health Benefits (One per line)</label>
                  <span className="text-[10px] text-foreground/40 block mb-1.5">Press Enter for each new bullet benefit</span>
                  <textarea
                    rows={2}
                    value={benefitsText}
                    onChange={(e) => setBenefitsText(e.target.value)}
                    className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none resize-y"
                  />
                </div>
              </div>

              {/* FAQ Sub-form list */}
              <div className="border-t border-foreground/5 pt-4">
                <label className="block text-xs font-bold text-primary mb-2">Configure Frequently Asked Questions</label>
                <div className="bg-accent-soft/30 p-4 rounded-2xl border border-foreground/5 space-y-3">
                  {faqs.map((f, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs border-b border-foreground/5 pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="font-semibold text-primary">Q: {f.q}</p>
                        <p className="text-foreground/70">A: {f.a}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFAQItem(idx)}
                        className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Question"
                      value={faqQ}
                      onChange={(e) => setFaqQ(e.target.value)}
                      className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Answer"
                      value={faqA}
                      onChange={(e) => setFaqA(e.target.value)}
                      className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addFAQItem}
                    className="inline-flex rounded-lg bg-primary/5 text-primary text-[10px] font-bold px-3 py-1.5 border border-primary/10 hover:bg-primary/10 cursor-pointer"
                  >
                    + Add FAQ
                  </button>
                </div>
              </div>

              {/* Testimonials Sub-form list */}
              <div className="border-t border-foreground/5 pt-4">
                <label className="block text-xs font-bold text-primary mb-2">Configure Patient Testimonials</label>
                <div className="bg-accent-soft/30 p-4 rounded-2xl border border-foreground/5 space-y-3">
                  {testimonials.map((t, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs border-b border-foreground/5 pb-2 last:border-0 last:pb-0">
                      <div>
                        <p className="italic text-foreground/80">"{t.text}"</p>
                        <p className="font-bold text-primary mt-0.5">— {t.author}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTestimonialItem(idx)}
                        className="text-[10px] font-bold text-red-600 hover:underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Author/Patient Name (e.g. Ramesh K.)"
                      value={testAuthor}
                      onChange={(e) => setTestAuthor(e.target.value)}
                      className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none"
                    />
                    <textarea
                      placeholder="Testimonial text"
                      rows={1}
                      value={testText}
                      onChange={(e) => setTestText(e.target.value)}
                      className="block w-full rounded-lg border border-foreground/15 bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none resize-y"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addTestimonialItem}
                    className="inline-flex rounded-lg bg-primary/5 text-primary text-[10px] font-bold px-3 py-1.5 border border-primary/10 hover:bg-primary/10 cursor-pointer"
                  >
                    + Add Testimonial
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-x-3 justify-end border-t border-foreground/5 pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-5 py-2.5 border border-foreground/15 rounded-full text-xs font-semibold text-foreground/80 hover:bg-foreground/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary text-white rounded-full text-xs font-semibold hover:bg-primary-hover cursor-pointer"
                >
                  Save Catalog Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setDeleteConfirmId(null)}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-xs"
          />
          <div className="relative bg-background p-6 rounded-2xl border border-foreground/5 shadow-xl max-w-sm w-full z-10 animate-fade-up">
            <h3 className="font-serif text-lg font-semibold text-primary mb-2">Delete Product?</h3>
            <p className="text-xs text-foreground/60 leading-relaxed mb-6">
              Are you sure you want to permanently delete this product from the public catalog? This action cannot be undone.
            </p>
            <div className="flex gap-x-3 justify-end">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-foreground/15 rounded-full text-xs font-semibold text-foreground/80 hover:bg-foreground/5 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 text-white rounded-full text-xs font-semibold hover:bg-red-700 cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
