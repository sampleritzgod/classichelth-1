"use client";

import React, { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Frontend runtime error captured by boundary:", error);
  }, [error]);

  return (
    <div className="flex-grow flex items-center justify-center bg-[#faf9f5] min-h-[70vh] px-4">
      <div className="max-w-md w-full bg-[#faf9f5] border border-foreground/5 rounded-3xl p-8 text-center shadow-lg">
        <span className="h-12 w-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
          ⚠️
        </span>
        <h2 className="font-serif text-2xl font-semibold text-foreground mb-3">
          Something went wrong
        </h2>
        <p className="text-xs text-foreground/60 leading-relaxed mb-8">
          The application encountered an unexpected runtime error. We have logged this event and our technical team will review it.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => reset()}
            className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold uppercase tracking-wider py-3 px-6 rounded-full transition-all cursor-pointer shadow-md"
          >
            Try Again
          </button>
          <a
            href="/"
            className="border border-foreground/15 hover:bg-foreground/5 text-foreground text-xs font-semibold uppercase tracking-wider py-3 px-6 rounded-full transition-all inline-block"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
