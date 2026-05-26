import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Product from "../models/Product.js";

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

const seedDB = async () => {
  try {
    console.log("[Seeder] Connecting to database...");
    await connectDB();

    console.log("[Seeder] Clearing existing products...");
    await Product.deleteMany({});
    console.log("[Seeder] Products cleared.");

    console.log("[Seeder] Inserting new initial products...");
    const createdProducts = await Product.insertMany(initialProducts);
    console.log(`[Seeder] Seeded ${createdProducts.length} products successfully.`);

    console.log("[Seeder] Database seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("[Seeder Error] Failed to seed database:", error);
    process.exit(1);
  }
};

seedDB();
