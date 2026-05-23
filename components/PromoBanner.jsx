"use client";
import { Megaphone, ShoppingBag } from "lucide-react";

export default function PromoBanner() {
  return (
    <section className="relative isolate overflow-hidden bg-[#AE2108] text-white rounded-3xl px-4 sm:px-6 py-10 sm:py-14 shadow-2xl mt-8 mx-2 sm:mx-6 lg:mx-0">
      {/* Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-black/20 pointer-events-none"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-10">
        <div className="flex items-start sm:items-center gap-4 max-w-xl">
          <div className="p-4 bg-white/20 rounded-full shrink-0">
            <Megaphone className="w-8 h-8 text-white animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight tracking-tight">
              Promote Your Business with Chowspace
            </h2>
            <p className="text-sm sm:text-base text-orange-100 mt-1">
              Reach more customers and boost your sales today join Chowspace now!
            </p>
          </div>
        </div>

        <a
          href="https://wa.me/2349152580773?text=Hi%2C%20I%20want%20to%20promote%20my%20business%20on%20ChowSpace!"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-[#AE2108] px-6 sm:px-8 py-3 sm:py-3.5 rounded-full text-sm sm:text-base font-semibold shadow-lg hover:bg-orange-50 hover:scale-105 transition-transform duration-200"
        >
          <ShoppingBag size={20} className="text-[#AE2108]" />
          Get Started
        </a>
      </div>
    </section>
  );
}