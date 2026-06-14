"use client";

import React, { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="bg-background border-t border-foreground/5 py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Column 1: Brand Info */}
          <div className="lg:col-span-4 flex flex-col items-start text-left">
            <a href="#" className="flex items-center gap-x-2.5 font-serif text-lg font-bold tracking-tight text-primary mb-4">
              {/* Shield logo SVG (smaller, matching navbar) */}
              <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg bg-white flex items-center justify-center border border-foreground/5">
                <img 
                  src="/images/u1st_logo_cropped.jpg" 
                  alt="U 1st Creation Logo" 
                  className="h-full w-full object-contain" 
                />
              </div>
              <span className="font-sans font-bold tracking-tight text-[#1e3f20]">
                U <span className="text-[#4caf50]">1st</span> Creation
              </span>
            </a>
            <p className="text-sm text-foreground/70 leading-relaxed max-w-sm mb-6">
              A premium, root-cause wellness clinic restoring balance, vitality, and metabolic health through certified Ayurvedic protocols and organic remedies.
            </p>
            {/* Social Links */}
            <div className="flex gap-x-4">
              <a href="#" className="h-8 w-8 rounded-full border border-foreground/10 flex items-center justify-center text-foreground/60 hover:text-primary hover:border-primary/20 transition-all cursor-pointer" aria-label="Instagram">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.008 3.752.052 2.73.124 4.093 1.503 4.218 4.218.044.968.052 1.322.052 3.752 0 2.43-.008 2.784-.052 3.752-.124 2.73-1.502 4.093-4.218 4.218-.968.044-1.322.052-3.752.052-2.43 0-2.784-.008-3.752-.052-2.73-.124-4.093-1.502-4.218-4.218-.044-.968-.052-1.322-.052-3.752 0-2.43.008-2.784.052-3.752.124-2.73 1.502-4.093 4.218-4.218.968-.044 1.322-.052 3.752-.052zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="h-8 w-8 rounded-full border border-foreground/10 flex items-center justify-center text-foreground/60 hover:text-primary hover:border-primary/20 transition-all cursor-pointer" aria-label="X">
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M13.6823 10.6218L20.2391 3H18.6854L13.0524 9.53401L8.50617 3H3.22003L10.0965 13.0073L3.22003 21H4.77378L10.7259 14.0951L15.4938 21H20.78L13.6823 10.6218ZM11.5173 13.1764L10.8208 12.1802L5.33235 4.32986H7.71882L12.1331 10.6433L12.8296 11.6394L18.6862 20.0152H16.2997L11.5173 13.1764Z" />
                </svg>
              </a>
              <a href="#" className="h-8 w-8 rounded-full border border-foreground/10 flex items-center justify-center text-foreground/60 hover:text-primary hover:border-primary/20 transition-all cursor-pointer" aria-label="Facebook">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:col-span-2 text-left sm:pl-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-5">Quick Links</h4>
            <ul className="space-y-3">
              <li><a href="#" className="text-sm text-foreground/80 hover:text-primary transition-colors">Home</a></li>
              <li><a href="#services" className="text-sm text-foreground/80 hover:text-primary transition-colors">Services</a></li>
              <li><a href="#about" className="text-sm text-foreground/80 hover:text-primary transition-colors">About Us</a></li>
              <li><a href="#blog" className="text-sm text-foreground/80 hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#booking" className="text-sm text-foreground/80 hover:text-primary transition-colors">Book Online</a></li>
            </ul>
          </div>

          {/* Column 3: Care Programs */}
          <div className="lg:col-span-3 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-5">Care Programs</h4>
            <ul className="space-y-3">
              <li><a href="#services" className="text-sm text-foreground/80 hover:text-primary transition-colors">Diabetes Care Program</a></li>
              <li><a href="#services" className="text-sm text-foreground/80 hover:text-primary transition-colors">PCOD & PCOS Correction</a></li>
              <li><a href="#services" className="text-sm text-foreground/80 hover:text-primary transition-colors">Obesity & Weight Management</a></li>
              <li><a href="#services" className="text-sm text-foreground/80 hover:text-primary transition-colors">Joint Care & Pain Relief</a></li>
              <li><a href="#services" className="text-sm text-foreground/80 hover:text-primary transition-colors">Immunity & Wellness</a></li>
            </ul>
          </div>

          {/* Column 4: Newsletter & Contact details */}
          <div className="lg:col-span-3 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-5">Newsletter</h4>
            <p className="text-xs text-foreground/75 leading-relaxed mb-4">
              Subscribe to receive weekly holistic tips, health updates, and restorative wellness guides.
            </p>
            {subscribed ? (
              <p className="text-xs text-[#4caf50] font-semibold mb-6 animate-fade-up">✓ Subscribed successfully!</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-x-2 mb-6">
                <input 
                  type="email" 
                  required 
                  placeholder="Your email address" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 min-w-0 rounded-lg border border-foreground/15 bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                />
                <button 
                  type="submit" 
                  className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover transition-colors cursor-pointer"
                >
                  Join
                </button>
              </form>
            )}
            <p className="text-xs text-foreground/60 leading-relaxed">
              102, Shekhar Central, Palasia Square, Indore, MP 452001
              <br />
              Ph: +91 88150 10090
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-foreground/5 flex flex-col items-center justify-between gap-y-4 sm:flex-row text-center sm:text-left">
          <p className="text-xs text-foreground/60 italic font-serif">
            "Within every body lies an innate wisdom to heal, realign, and restore vitality."
          </p>
          <p className="text-xs text-foreground/60">
            &copy; {new Date().getFullYear()} U 1st Creation. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
