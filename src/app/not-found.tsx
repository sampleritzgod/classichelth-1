import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex-grow flex items-center justify-center bg-[#faf9f5] min-h-[60vh] px-4">
        <div className="max-w-md w-full bg-[#faf9f5] border border-foreground/5 rounded-3xl p-8 text-center shadow-lg">
          <span className="h-12 w-12 rounded-full bg-accent-soft/30 text-primary flex items-center justify-center mx-auto mb-4 font-serif text-xl">
            404
          </span>
          <h2 className="font-serif text-2xl font-semibold text-foreground mb-3">
            Page Not Found
          </h2>
          <p className="text-xs text-foreground/60 leading-relaxed mb-8">
            The page you are looking for does not exist, has been removed, or is temporarily unavailable.
          </p>
          <Link
            href="/"
            className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold uppercase tracking-wider py-3 px-6 rounded-full transition-all inline-block shadow-md"
          >
            Return to Sanctuary
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
