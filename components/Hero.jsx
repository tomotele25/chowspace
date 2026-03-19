"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    title: "Discover\nDelicious Meals",
    subtitle: "From Top Vendors Around You",
    description:
      "Browse curated vendors and enjoy a variety of cuisines delivered hot and fast, just the way you like it.",
    image: "/Hero.png",
    accent: "from-[#AE2108]/80",
  },
  {
    title: "Order\nWith Ease",
    subtitle: "Fast. Trusted. Affordable.",
    description:
      "From breakfast to dinner, ChowSpace makes ordering food seamless and stress free.",
    image: "/Hero (1).png",
    accent: "from-[#7a1706]/80",
  },
  {
    title: "Satisfy\nYour Cravings",
    subtitle: "All your favourite meals, one tap away",
    description:
      "Anytime, anywhere — find dishes from local food heroes near you. Eat better, live better.",
    image: "/Hero (2).png",
    accent: "from-[#AE2108]/70",
  },
];

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [prev, setPrev] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [direction, setDirection] = useState("next");
  const [textVisible, setTextVisible] = useState(true);

  const goTo = (index, dir = "next") => {
    if (transitioning || index === current) return;
    setDirection(dir);
    setTextVisible(false);
    setTransitioning(true);
    setPrev(current);
    setTimeout(() => {
      setCurrent(index);
      setTransitioning(false);
      setPrev(null);
      setTimeout(() => setTextVisible(true), 80);
    }, 500);
  };

  const goNext = () => goTo((current + 1) % slides.length, "next");
  const goPrev = () =>
    goTo((current - 1 + slides.length) % slides.length, "prev");

  useEffect(() => {
    const t = setInterval(goNext, 6500);
    return () => clearInterval(t);
  }, [current, transitioning]);

  const slide = slides[current];

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-black">
      {/* ── Background images ── */}
      {slides.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            opacity: i === current ? 1 : 0,
            zIndex: i === current ? 1 : 0,
          }}
        >
          <Image
            src={s.image}
            alt={s.title}
            fill
            priority={i === 0}
            className="object-cover"
            style={{
              transform: i === current ? "scale(1.04)" : "scale(1)",
              transition: "transform 7s ease-out",
            }}
          />
        </div>
      ))}

      {/* ── Layered overlay ── */}
      <div className="absolute inset-0 z-10">
        {/* side vignette */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/20" />
        {/* bottom fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        {/* warm red tint bottom left */}
        <div
          className={`absolute bottom-0 left-0 w-2/3 h-1/2 bg-gradient-to-tr ${slide.accent} to-transparent opacity-40 transition-all duration-700`}
        />
      </div>

      {/* ── Slide counter (top right) ── */}
      <div className="absolute top-24 right-6 sm:right-10 z-20 flex flex-col items-end gap-1">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > current ? "next" : "prev")}
            className={`transition-all duration-400 rounded-full ${
              i === current
                ? "w-1 h-8 bg-[#AE2108]"
                : "w-1 h-3 bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>

      {/* ── Main content ── */}
      <div className="relative z-20 w-full max-w-6xl mx-auto px-6 sm:px-12 pt-24 pb-20 flex flex-col justify-end min-h-screen">
        <div
          className="max-w-2xl transition-all duration-500"
          style={{
            opacity: textVisible ? 1 : 0,
            transform: textVisible ? "translateY(0)" : "translateY(24px)",
          }}
        >
          {/* Eyebrow label */}
          <div className="flex items-center gap-2 mb-4">
            <span className="w-8 h-px bg-[#AE2108]" />
            <span className="text-[#FF9A76] text-xs font-bold uppercase tracking-[0.2em]">
              {slide.subtitle}
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl font-black text-white leading-[1.05] tracking-tight mb-5 whitespace-pre-line">
            {slide.title.split("\n").map((line, i) => (
              <span key={i} className="block">
                {i === 1 ? (
                  <span className="text-[#AE2108]">{line}</span>
                ) : (
                  line
                )}
              </span>
            ))}
          </h1>

          {/* Description */}
          <p className="text-white/75 text-base sm:text-lg leading-relaxed max-w-md mb-8">
            {slide.description}
          </p>

          {/* CTA row */}
          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="#vendors"
              className="group inline-flex items-center gap-2.5 bg-[#AE2108] text-white px-6 py-3.5 rounded-full font-semibold text-sm sm:text-base shadow-lg shadow-[#AE2108]/30 hover:bg-[#941B06] hover:-translate-y-0.5 hover:shadow-[#AE2108]/50 active:translate-y-0 transition-all duration-200"
            >
              Explore Vendors
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
            <Link
              href="/Signup"
              className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium border border-white/25 hover:border-white/50 px-5 py-3.5 rounded-full transition-all duration-200 hover:bg-white/10"
            >
              Get started free
            </Link>
          </div>
        </div>

        {/* ── Bottom bar: nav arrows + slide number ── */}
        <div className="flex items-center justify-between mt-12 pt-6 border-t border-white/10">
          {/* Slide number */}
          <div className="flex items-baseline gap-1.5">
            <span className="text-white text-2xl font-black tabular-nums">
              {String(current + 1).padStart(2, "0")}
            </span>
            <span className="text-white/30 text-sm font-medium">
              / {String(slides.length).padStart(2, "0")}
            </span>
          </div>

          {/* Progress bar */}
          <div className="flex-1 mx-6 h-px bg-white/15 relative overflow-hidden rounded-full">
            <div
              key={current}
              className="absolute left-0 top-0 h-full bg-[#AE2108] rounded-full"
              style={{
                animation: "progress 6.5s linear forwards",
              }}
            />
          </div>

          {/* Arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={goPrev}
              className="w-10 h-10 rounded-full border border-white/25 hover:border-white/60 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={goNext}
              className="w-10 h-10 rounded-full bg-[#AE2108] hover:bg-[#941B06] flex items-center justify-center text-white shadow-md hover:-translate-y-px active:translate-y-0 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes progress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </section>
  );
}
