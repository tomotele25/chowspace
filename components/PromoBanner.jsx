"use client";
import { Rocket, ArrowRight, Sparkles } from "lucide-react";

export default function PromoBanner() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#AE2108] to-[#7d1805] text-white rounded-3xl px-6 sm:px-10 py-10 sm:py-14 shadow-2xl shadow-[#AE2108]/20 mt-8 mx-2 sm:mx-6 lg:mx-0">
      {/* ── Decorative layer — dot texture + soft floating circles,
          same treatment used across the vendor dashboard/profile ── */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.08]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="promoDots"
              x="0"
              y="0"
              width="22"
              height="22"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#promoDots)" />
        </svg>
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10" />
        <div className="absolute right-16 -bottom-20 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute -left-10 bottom-0 w-32 h-32 rounded-full bg-white/5" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-8 sm:gap-10">
        <div className="flex items-start sm:items-center gap-5 max-w-xl text-center sm:text-left">
          <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-white/15 border border-white/20 items-center justify-center shrink-0 shadow-inner">
            <Rocket className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider bg-white/15 border border-white/20 px-3 py-1 rounded-full mb-3">
              <Sparkles size={11} />
              Grow with ChowSpace
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">
              Promote your business on ChowSpace
            </h2>
            <p className="text-sm sm:text-base text-white/70 mt-2 leading-relaxed">
              Get in front of more customers in your area and start growing your
              sales today.
            </p>
          </div>
        </div>

        <a
          href="https://wa.me/2349152580773?text=Hi%2C%20I%20want%20to%20promote%20my%20business%20on%20ChowSpace!"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 bg-white text-[#AE2108] px-7 sm:px-8 py-3.5 rounded-full text-sm sm:text-base font-bold shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5 flex-shrink-0"
        >
          Get Started
          <ArrowRight
            size={18}
            className="transition-transform duration-200 group-hover:translate-x-1"
          />
        </a>
      </div>
    </section>
  );
}
