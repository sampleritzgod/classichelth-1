import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Product from "../models/Product.js";
import Blog from "../models/Blog.js";
import User from "../models/User.js";

// Load environment variables from backend directory
dotenv.config();

const initialProducts = [
  {
    name: "Hridya Mitra",
    originalPrice: 1260,
    price: 780,
    image: "/images/service_consultation.png",
    category: "Tonics & Syrups",
    alt: "Hridya Mitra cardiac support herbal syrup bottle",
    description: "Holistic cardiac support herbal syrup crafted to strengthen cardiovascular muscles and promote calm vitality.",
    inStock: true,
    isFeatured: true,
    isAvailable: true,
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
    name: "Himalyan Shilajeet Resin",
    originalPrice: 1490,
    price: 1200,
    image: "/images/u1st_product_shilajit.png",
    category: "Supplements",
    alt: "Premium Himalyan Shilajeet Resin jar with golden lid and black packaging box",
    description: "100% purified Himalayan Shilajit resin containing over 80+ essential minerals to restore daily stamina and cellular energy.",
    inStock: true,
    isFeatured: true,
    isAvailable: true,
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
    name: "Triphala Guggul",
    originalPrice: 450,
    price: 320,
    image: "/images/product_supplement.png",
    category: "Supplements",
    alt: "Triphala Guggul digestive health organic tablets",
    description: "Classical Ayurvedic detoxifying formulation to relieve chronic bloating, cleanse the digestive tract, and improve metabolic fire.",
    inStock: true,
    isFeatured: false,
    isAvailable: true,
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
    name: "Univeer Syrup",
    originalPrice: 1260,
    price: 945,
    image: "/images/service_skincare.png",
    category: "Tonics & Syrups",
    alt: "Univeer immune boosting herbal syrup bottle",
    description: "Highly potent immune booster and natural blood purifier formulated with Giloy, Neem, and Turmeric.",
    inStock: true,
    isFeatured: false,
    isAvailable: true,
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
    name: "Digi Plus Syrup",
    originalPrice: 650,
    price: 495,
    image: "/images/product_serum.png",
    category: "Tonics & Syrups",
    alt: "Digi Plus digestive care organic syrup bottle",
    description: "Fast-acting sugar-free digestive syrup designed to instantly relieve acidity, flatulence, and stomach cramps.",
    inStock: true,
    isFeatured: false,
    isAvailable: true,
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
    name: "Pida Harak Oil & Ointment",
    originalPrice: 850,
    price: 650,
    image: "/images/product_oil.png",
    category: "Wellness Oils",
    alt: "Pida Harak joint and muscular pain relief oil bottle",
    description: "Deep penetrating joint and muscular pain relief oil containing Mahanarayan, Wintergreen, and Eucalyptus oils.",
    inStock: true,
    isFeatured: false,
    isAvailable: true,
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
  }
];

const initialBlogs = [
  {
    title: "Understanding Ayurvedic Doshas: Vata, Pitta, and Kapha",
    snippet: "Discover how the three primary life energies determine your physical constitution and mental health in classical Ayurvedic science.",
    content: `
      <h3>Introduction to Doshas</h3>
      <p>In Ayurvedic medicine, health is defined as the perfect balance of the three body humors or energies, known as <strong>Doshas</strong>: Vata, Pitta, and Kapha. Each individual has a unique combination of these three forces, which determines their physical constitution (Prakriti) and psychological traits.</p>
      
      <h3>The Three Bio-Energies</h3>
      <ul>
        <li><strong>Vata (Space & Air):</strong> Represents movement, nervous energy, and circulation. When balanced, it fosters creativity and flexibility. When imbalanced, it causes anxiety, dry skin, and constipation.</li>
        <li><strong>Pitta (Fire & Water):</strong> Controls digestion, metabolism, and body temperature. Balanced Pitta brings sharp intelligence and determination. Imbalanced Pitta causes anger, skin rashes, and acid reflux.</li>
        <li><strong>Kapha (Water & Earth):</strong> Governs structure, fluid balance, and physical strength. Balanced Kapha brings love, stability, and calm endurance. Imbalanced Kapha triggers sluggishness, weight gain, and sinus congestion.</li>
      </ul>
      
      <h3>Finding Your Balance</h3>
      <p>By adjusting your diet, daily routines, and herbal therapies to match your primary dosha, you can restore metabolic harmony and prevent chronic health issues before they arise.</p>
    `,
    image: "/images/service_consultation.png",
    category: "Mindfulness",
    isPublished: true,
    publishedAt: new Date(),
    seoTitle: "Ayurvedic Doshas Guide: Balancing Vata, Pitta, Kapha",
    seoDescription: "An in-depth guide on the three Ayurvedic doshas and how to align your nutrition and daily habits to restore metabolic health."
  },
  {
    title: "5 Simple Morning Rituals for Systemic Detoxification",
    snippet: "Kickstart your daily wellness journey with these clean, time-tested Ayurvedic habits to clear digestive congestion and boost your morning energy.",
    content: `
      <h3>Daily Morning Rejuvenation</h3>
      <p>How you begin your day sets the tone for your digestive strength (Agni) and mental clarity. Ayurveda recommends a sequence of simple, clean habits to clear metabolic toxins (Ama) accumulated overnight.</p>
      
      <h3>The 5 Habits</h3>
      <ol>
        <li><strong>Warm Water with Lemon:</strong> Drinking a glass of warm water stimulates intestinal peristalsis and wakes up the liver.</li>
        <li><strong>Tongue Scraping (Jihwa Nirlekhan):</strong> Scraping the tongue with a copper scraper removes toxic coating, improves taste perception, and clears oral bacteria.</li>
        <li><strong>Oil Pulling (Gandusha):</strong> Swishing a tablespoon of organic sesame or coconut oil in your mouth for 5-10 minutes strengthens teeth and gums and pulls out fat-soluble toxins.</li>
        <li><strong>Gentle Yoga & Pranayama:</strong> 10 minutes of sun salutations and deep breathing oxygenates tissues and stimulates lymphatic drainage.</li>
        <li><strong>Dry Brushing (Garshana):</strong> Stimulates lymphatic circulation and exfoliates skin, preparing the body for elimination.</li>
      </ol>
    `,
    image: "/images/service_skincare.png",
    category: "Nutrition",
    isPublished: true,
    publishedAt: new Date(),
    seoTitle: "Ayurvedic Morning Detox: 5 Habits for Daily Vitality",
    seoDescription: "Learn the top 5 classical Ayurvedic morning rituals to detoxify your system naturally, clear bloating, and feel lighter."
  }
];

const seedDB = async () => {
  try {
    console.log("[Seeder] Connecting to database...");
    await connectDB();

    // 1. Seed Products
    console.log("[Seeder] Clearing existing products...");
    await Product.deleteMany({});
    console.log("[Seeder] Inserting new initial products...");
    const createdProducts = await Product.insertMany(initialProducts);
    console.log(`[Seeder] Seeded ${createdProducts.length} products successfully.`);

    // 2. Seed Blogs
    console.log("[Seeder] Clearing existing blogs...");
    await Blog.deleteMany({});
    console.log("[Seeder] Inserting sample blogs...");
    // The pre-save hooks in Blog.js will auto-compute readingTime and slugs!
    const createdBlogs = await Blog.insertMany(initialBlogs);
    console.log(`[Seeder] Seeded ${createdBlogs.length} blog posts successfully.`);

    // 3. Seed Default Admin User
    console.log("[Seeder] Clearing existing users...");
    await User.deleteMany({});
    console.log("[Seeder] Creating default administrator user...");
    const adminUser = new User({
      email: "admin@u1stcreation.com",
      password: "AdminPass123!",
      role: "admin"
    });
    await adminUser.save();
    console.log(`[Seeder] Created admin credentials: admin@u1stcreation.com / AdminPass123!`);

    console.log("[Seeder] Database seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("[Seeder Error] Failed to seed database:", error);
    process.exit(1);
  }
};

seedDB();
