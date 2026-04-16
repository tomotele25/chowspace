"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import Head from "next/head";

// ── SVG Illustrations ─────────────────────────────────────────────────────

function IllustrationAfrica() {
  return (
    <svg
      viewBox="0 0 480 280"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <linearGradient id="sky1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0a06" />
          <stop offset="100%" stopColor="#AE2108" />
        </linearGradient>
        <radialGradient id="sun1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffb347" />
          <stop offset="100%" stopColor="#ff6b35" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="480" height="280" fill="url(#sky1)" />
      {[
        [40, 30],
        [120, 18],
        [200, 45],
        [310, 22],
        [400, 35],
        [450, 55],
        [90, 60],
        [260, 15],
        [370, 50],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r="1.5"
          fill="white"
          opacity={0.6 + (i % 3) * 0.2}
        />
      ))}
      <circle cx="380" cy="50" r="40" fill="url(#sun1)" opacity="0.4" />
      <circle cx="380" cy="50" r="22" fill="#ffda8a" />
      <circle cx="392" cy="44" r="16" fill="#1a0a06" />
      <rect x="0" y="180" width="480" height="100" fill="#0d0503" />
      {[
        [20, 120, 35, 60],
        [70, 140, 28, 40],
        [110, 100, 40, 80],
        [165, 130, 25, 50],
        [200, 110, 50, 70],
        [265, 125, 30, 55],
        [310, 95, 45, 85],
        [370, 135, 30, 45],
        [415, 115, 40, 65],
        [455, 145, 25, 35],
      ].map(([x, y, w, h], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width={w}
          height={h}
          fill={i % 3 === 0 ? "#2a0d07" : "#1a0806"}
        />
      ))}
      {[
        [30, 130],
        [45, 130],
        [30, 150],
        [45, 150],
        [75, 150],
        [85, 150],
        [120, 110],
        [150, 110],
        [120, 130],
        [150, 130],
        [210, 120],
        [235, 120],
        [210, 140],
        [235, 140],
        [320, 105],
        [355, 105],
        [320, 125],
      ].map(([x, y], i) => (
        <rect
          key={i}
          x={x}
          y={y}
          width="8"
          height="6"
          fill={i % 4 === 0 ? "#ffb347" : i % 3 === 0 ? "#ff8c42" : "#3a1208"}
          opacity="0.9"
        />
      ))}
      <rect x="0" y="230" width="480" height="20" fill="#1a0806" />
      {[0, 60, 120, 180, 240, 300, 360, 420].map((x, i) => (
        <rect
          key={i}
          x={x + 10}
          y="238"
          width="35"
          height="2"
          fill="#ffb347"
          opacity="0.3"
        />
      ))}
      <g transform="translate(180,215)">
        <ellipse cx="10" cy="18" rx="8" ry="8" fill="#333" />
        <ellipse cx="10" cy="18" rx="5" ry="5" fill="#555" />
        <ellipse cx="50" cy="18" rx="8" ry="8" fill="#333" />
        <ellipse cx="50" cy="18" rx="5" ry="5" fill="#555" />
        <rect x="8" y="8" width="36" height="10" rx="4" fill="#AE2108" />
        <rect x="18" y="2" width="20" height="8" rx="3" fill="#c73a1e" />
        <circle cx="54" cy="12" r="3" fill="#ffda8a" />
        <path d="M57 12 L68 8 L68 16 Z" fill="#ffda8a" opacity="0.3" />
      </g>
      <g transform="translate(210,185)">
        <rect x="0" y="0" width="22" height="32" rx="4" fill="#222" />
        <rect x="2" y="3" width="18" height="24" rx="2" fill="#AE2108" />
        <text
          x="11"
          y="18"
          textAnchor="middle"
          fontSize="10"
          fill="white"
          fontWeight="bold"
        >
          ✓
        </text>
      </g>
      {[14, 22, 30].map((r, i) => (
        <path
          key={i}
          d={`M ${221 + r} 178 A ${r} ${r} 0 0 1 ${221 - r} 178`}
          fill="none"
          stroke="#ffb347"
          strokeWidth="1.5"
          opacity={0.7 - i * 0.2}
        />
      ))}
      <g transform="translate(60,120)" opacity="0.85">
        <circle cx="16" cy="16" r="16" fill="#c73a1e" />
        <text x="16" y="21" textAnchor="middle" fontSize="14">
          🍔
        </text>
      </g>
      <g transform="translate(380,100)" opacity="0.85">
        <circle cx="16" cy="16" r="16" fill="#c73a1e" />
        <text x="16" y="21" textAnchor="middle" fontSize="14">
          🍜
        </text>
      </g>
      <text
        x="240"
        y="270"
        textAnchor="middle"
        fontSize="10"
        fill="#ff6b35"
        opacity="0.6"
        letterSpacing="3"
      >
        NIGERIA · AFRICA · 2025
      </text>
    </svg>
  );
}

function IllustrationBehindScenes() {
  return (
    <svg
      viewBox="0 0 480 280"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff8f5" />
          <stop offset="100%" stopColor="#ffe0d6" />
        </linearGradient>
        <linearGradient id="screen2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a0a06" />
          <stop offset="100%" stopColor="#2d1208" />
        </linearGradient>
      </defs>
      <rect width="480" height="280" fill="url(#bg2)" />
      <rect x="0" y="200" width="480" height="80" fill="#f5e6df" />
      <rect x="0" y="200" width="480" height="4" fill="#e8cfc5" />
      <rect x="130" y="110" width="220" height="140" rx="8" fill="#2a2a2a" />
      <rect
        x="136"
        y="116"
        width="208"
        height="128"
        rx="4"
        fill="url(#screen2)"
      />
      <rect x="110" y="198" width="260" height="10" rx="4" fill="#3a3a3a" />
      <rect x="190" y="207" width="100" height="4" rx="2" fill="#555" />
      {[
        { x: 145, w: 60, color: "#ff6b6b" },
        { x: 215, w: 80, color: "#51cf66" },
        { x: 305, w: 50, color: "#74c0fc" },
      ].map((l, i) => (
        <rect
          key={i}
          x={l.x}
          y={130 + i * 14}
          width={l.w}
          height="6"
          rx="3"
          fill={l.color}
          opacity="0.8"
        />
      ))}
      {[
        { x: 155, w: 40, c: "#ffd43b" },
        { x: 205, w: 70, c: "#74c0fc" },
        { x: 285, w: 45, c: "#ff6b6b" },
        { x: 145, w: 100, c: "#51cf66" },
        { x: 155, w: 55, c: "#ffd43b" },
        { x: 220, w: 65, c: "#74c0fc" },
      ].map((l, i) => (
        <rect
          key={i}
          x={l.x}
          y={175 + i * 10}
          width={l.w}
          height="5"
          rx="2.5"
          fill={l.c}
          opacity="0.6"
        />
      ))}
      <rect x="290" y="225" width="2" height="8" fill="#fff" opacity="0.9" />
      <g transform="translate(370,160)">
        <rect
          x="0"
          y="10"
          width="36"
          height="32"
          rx="4"
          fill="white"
          stroke="#e8cfc5"
          strokeWidth="2"
        />
        <rect
          x="36"
          y="16"
          width="12"
          height="18"
          rx="6"
          fill="none"
          stroke="#e8cfc5"
          strokeWidth="2"
        />
        <text
          x="18"
          y="36"
          textAnchor="middle"
          fontSize="10"
          fill="#AE2108"
          fontWeight="bold"
        >
          CS
        </text>
        <path
          d="M10 8 Q12 2 10 -4"
          fill="none"
          stroke="#ccc"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M18 6 Q20 0 18 -6"
          fill="none"
          stroke="#ccc"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M26 8 Q28 2 26 -4"
          fill="none"
          stroke="#ccc"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(60,130)">
        <rect width="70" height="70" rx="4" fill="#ffd43b" />
        {[15, 25, 35, 45].map((y, i) => (
          <rect
            key={i}
            x="5"
            y={y}
            width={[60, 45, 52, 38][i]}
            height="4"
            rx="2"
            fill="#e6b800"
            opacity="0.6"
          />
        ))}
        <text
          x="35"
          y="12"
          textAnchor="middle"
          fontSize="9"
          fill="#a68000"
          fontWeight="bold"
        >
          TODO
        </text>
      </g>
      <g transform="translate(20,50)">
        <rect
          width="90"
          height="50"
          rx="10"
          fill="white"
          stroke="#f0d8d0"
          strokeWidth="1.5"
        />
        <text x="20" y="24" textAnchor="middle" fontSize="10">
          📦
        </text>
        <rect x="36" y="13" width="44" height="5" rx="2.5" fill="#ddd" />
        <rect x="36" y="23" width="30" height="4" rx="2" fill="#eee" />
        <rect
          x="10"
          y="35"
          width="70"
          height="6"
          rx="3"
          fill="#AE2108"
          opacity="0.2"
        />
      </g>
      <g transform="translate(370,50)">
        <rect
          width="90"
          height="50"
          rx="10"
          fill="white"
          stroke="#f0d8d0"
          strokeWidth="1.5"
        />
        <text x="20" y="24" textAnchor="middle" fontSize="10">
          🛵
        </text>
        <rect x="36" y="13" width="44" height="5" rx="2.5" fill="#ddd" />
        <rect x="36" y="23" width="30" height="4" rx="2" fill="#eee" />
        <rect
          x="10"
          y="35"
          width="70"
          height="6"
          rx="3"
          fill="#51cf66"
          opacity="0.2"
        />
      </g>
      <path
        d="M110 75 L240 116"
        stroke="#AE2108"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.3"
      />
      <path
        d="M370 75 L340 116"
        stroke="#51cf66"
        strokeWidth="1"
        strokeDasharray="4 3"
        opacity="0.3"
      />
      <text
        x="240"
        y="272"
        textAnchor="middle"
        fontSize="10"
        fill="#AE2108"
        opacity="0.4"
        letterSpacing="2"
      >
        BUILT WITH ❤ IN NIGERIA
      </text>
    </svg>
  );
}

function IllustrationVendorTips() {
  return (
    <svg
      viewBox="0 0 480 280"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <defs>
        <linearGradient id="bg3" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0fff4" />
          <stop offset="100%" stopColor="#e6f9ee" />
        </linearGradient>
      </defs>
      <rect width="480" height="280" fill="url(#bg3)" />
      <rect
        x="120"
        y="130"
        width="240"
        height="100"
        rx="6"
        fill="#fff"
        stroke="#e8e8e8"
        strokeWidth="2"
      />
      <rect x="100" y="110" width="280" height="30" rx="4" fill="#AE2108" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect
          key={i}
          x={100 + i * 40}
          y="110"
          width="20"
          height="30"
          fill="#c73a1e"
          opacity="0.5"
        />
      ))}
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
        <path
          key={i}
          d={`M ${105 + i * 23} 140 L ${116 + i * 23} 152 L ${127 + i * 23} 140`}
          fill="#AE2108"
        />
      ))}
      <rect
        x="170"
        y="115"
        width="140"
        height="20"
        rx="4"
        fill="white"
        opacity="0.25"
      />
      <text
        x="240"
        y="129"
        textAnchor="middle"
        fontSize="11"
        fill="white"
        fontWeight="800"
        letterSpacing="1"
      >
        MAMA&apos;S KITCHEN
      </text>
      <rect x="120" y="190" width="240" height="15" rx="3" fill="#f0e0d8" />
      {[
        { x: 140, e: "🍲", c: "#ff8c42" },
        { x: 200, e: "🍛", c: "#ffb347" },
        { x: 260, e: "🥘", c: "#ff6b6b" },
        { x: 320, e: "🥗", c: "#51cf66" },
      ].map((f, i) => (
        <g key={i} transform={`translate(${f.x},155)`}>
          <circle cx="20" cy="20" r="18" fill={f.c} />
          <text x="20" y="25" textAnchor="middle" fontSize="16">
            {f.e}
          </text>
        </g>
      ))}
      <g transform="translate(218,100)">
        <circle cx="22" cy="14" r="14" fill="#8B6347" />
        <rect x="8" y="26" width="28" height="32" rx="6" fill="#AE2108" />
        <rect x="10" y="2" width="24" height="8" rx="4" fill="white" />
        <ellipse cx="22" cy="2" rx="10" ry="6" fill="white" />
      </g>
      <g transform="translate(18,50)">
        <rect
          width="95"
          height="55"
          rx="12"
          fill="white"
          stroke="#e0f5e8"
          strokeWidth="1.5"
        />
        <text x="12" y="22" fontSize="10" fill="#888" fontWeight="600">
          Orders
        </text>
        <text x="12" y="40" fontSize="22" fill="#51cf66" fontWeight="800">
          +42%
        </text>
        <text x="12" y="52" fontSize="8" fill="#aaa">
          this week
        </text>
        {[18, 28, 22, 35, 30, 42].map((h, i) => (
          <rect
            key={i}
            x={55 + i * 7}
            y={55 - h / 2}
            width="5"
            height={h / 2}
            rx="2"
            fill="#51cf66"
            opacity={0.4 + i * 0.1}
          />
        ))}
      </g>
      <g transform="translate(368,50)">
        <rect
          width="95"
          height="55"
          rx="12"
          fill="white"
          stroke="#fff0ec"
          strokeWidth="1.5"
        />
        <text x="12" y="22" fontSize="10" fill="#888" fontWeight="600">
          Rating
        </text>
        <text x="12" y="40" fontSize="22" fill="#AE2108" fontWeight="800">
          4.9 ★
        </text>
        <text x="12" y="52" fontSize="8" fill="#aaa">
          248 reviews
        </text>
      </g>
      {[
        [80, 220],
        [400, 215],
        [60, 260],
        [420, 255],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x},${y})`}>
          <circle cx="12" cy="12" r="12" fill="#ffd43b" opacity="0.9" />
          <text x="12" y="16" textAnchor="middle" fontSize="11" fill="#a68000">
            ₦
          </text>
        </g>
      ))}
      <text
        x="240"
        y="272"
        textAnchor="middle"
        fontSize="10"
        fill="#51cf66"
        opacity="0.5"
        letterSpacing="2"
      >
        GROW YOUR BUSINESS ON CHOWSPACE
      </text>
    </svg>
  );
}

// ── Full article content ───────────────────────────────────────────────────

const articles = [
  {
    id: 1,
    title: "The Future of Food Delivery in Africa",
    description:
      "Explore how technology is revolutionizing local food vendors and delivery in Nigeria.",
    Illustration: IllustrationAfrica,
    date: "July 19, 2025",
    author: "Tomotele Christopher Oluwatobiloba",
    authorRole: "Founder, ChowSpace",
    category: "Industry",
    readTime: "5 min read",
    content: [
      {
        type: "lead",
        text: "Africa's food delivery market is at an inflection point. With over 1.4 billion people, a rapidly urbanising population, and smartphone penetration climbing past 50% in key markets, the continent is primed for a food-tech revolution that mirrors — and in many ways surpasses — what happened in Asia a decade ago.",
      },
      {
        type: "h2",
        text: "A Market Ready to Leap",
      },
      {
        type: "p",
        text: "Nigeria alone is home to more than 220 million people, and Lagos — one of the fastest-growing megacities on earth — adds thousands of new residents every week. These new city-dwellers are hungry, time-pressed, and mobile-first. They have grown up ordering everything from ride-hailing to airtime top-ups on their phones. Food is the next frontier.",
      },
      {
        type: "p",
        text: "But the story isn't simply about replicating a Western or Asian model. African food culture is rich, hyper-local, and deeply community-driven. The mama put on the corner, the buka tucked into a busy market, the suya spot that only opens at dusk — these are institutions. Technology has to work with that culture, not bulldoze it.",
      },
      {
        type: "h2",
        text: "The Role of Local Platforms",
      },
      {
        type: "p",
        text: "This is precisely where platforms like ChowSpace are carving a different path. Rather than focusing exclusively on high-end restaurant chains, ChowSpace was built from the ground up for local vendors — the kind of food businesses that feed 80% of urban Nigerians every single day but have historically been invisible to technology.",
      },
      {
        type: "quote",
        text: "We didn't want to build a platform for restaurants. We wanted to build one for the woman who has been cooking jollof rice for her neighbourhood for twenty years and deserves the same tools a five-star hotel gets.",
      },
      {
        type: "p",
        text: "Giving small vendors digital storefronts, delivery management, and customer communication tools — in plain, accessible language — changes the economic equation. A vendor who previously served forty customers a day through walk-ins alone can now serve a hundred without leaving their kitchen.",
      },
      {
        type: "h2",
        text: "Infrastructure Challenges and How Tech Solves Them",
      },
      {
        type: "p",
        text: "Logistics remain the single biggest challenge. Africa's urban road networks are notoriously congested, and address systems are inconsistent — a compound in Yaba might have four different names depending on who you ask. Smart routing, real-time GPS tracking, and a growing army of two-wheel delivery riders are gradually closing that gap.",
      },
      {
        type: "p",
        text: "Payment is the other battleground. Cash is still king for millions of Nigerians, but mobile money is growing at a staggering pace. The integration of USSD payments, POS on delivery, and instant bank transfers means that a vendor no longer needs to handle cash or worry about reconciliation at the end of the day.",
      },
      {
        type: "h2",
        text: "What the Next Five Years Look Like",
      },
      {
        type: "p",
        text: "We expect to see consolidation, greater smartphone penetration, and the emergence of dark kitchens specifically designed for delivery-first cooking in African cities. But the most exciting development will be the formalisation of the informal sector — giving millions of small food businesses a digital identity, a transaction history, and eventually access to credit based on their order volume.",
      },
      {
        type: "p",
        text: "Africa is not catching up with the world. In food delivery, it is about to set the pace.",
      },
    ],
  },
  {
    id: 2,
    title: "Behind the Scenes of ChowSpace",
    description:
      "Take a look at how we built a platform that connects local kitchens with hungry customers.",
    Illustration: IllustrationBehindScenes,
    date: "July 12, 2025",
    author: "Tomotele Christopher Oluwatobiloba",
    authorRole: "Founder, ChowSpace",
    category: "Company",
    readTime: "4 min read",
    content: [
      {
        type: "lead",
        text: "Every product has an origin story — a moment where frustration becomes conviction. Ours started on the campus of the Federal University of Agriculture, Abeokuta (FUNAAB), when students were spending more time hunting for food than actually eating — walking from one buka to the next, not knowing what was available, watching vendors turn away customers they simply couldn't keep track of.",
      },
      {
        type: "h2",
        text: "The Problem We Saw",
      },
      {
        type: "p",
        text: "The food vendors around FUNAAB are extraordinarily talented. Many have been feeding students and staff for years. But their operations run entirely on memory, word of mouth, and shouted orders across a busy counter. There is no queue system, no order history, no way to tell a customer their food is ready. The vendor is the system — and when the vendor is overwhelmed, everything breaks down.",
      },
      {
        type: "p",
        text: "We asked ourselves: what if we could give every local food vendor the kind of operational backbone that only large restaurant chains can afford? Not a complicated enterprise system — something that works on a ₦30,000 Android phone and can be set up in under ten minutes.",
      },
      {
        type: "h2",
        text: "Building for the Real User",
      },
      {
        type: "p",
        text: "The first prototype was built in three weeks, right here in Abeokuta. It was rough. We put it in the hands of vendors around FUNAAB and watched what happened. Some called to say they couldn't understand it. Others used it in ways we never anticipated. One found a bug on day one that we hadn't caught in weeks of internal testing.",
      },
      {
        type: "quote",
        text: "The best feedback we ever received was from Mama Ngozi, who told us plainly: 'This is not how I think about my business. Go and come back when you understand me.'",
      },
      {
        type: "p",
        text: "That was the turning point. We threw out our assumptions and spent weeks doing nothing but observing — sitting in canteens around FUNAAB, taking orders, talking to students queuing for lunch. We listened. The product that came out of that period looks almost nothing like what we started with.",
      },
      {
        type: "h2",
        text: "The Technical Stack",
      },
      {
        type: "p",
        text: "ChowSpace is built on a modern JavaScript stack — Next.js on the frontend, Node.js and Express on the backend, MongoDB for flexible data storage, and Socket.io for real-time order updates. We deliberately chose technologies with large, active communities so that Nigerian developers joining the team can onboard quickly.",
      },
      {
        type: "p",
        text: "One of our proudest engineering decisions is our offline-first approach. Network conditions in Nigerian cities are unpredictable. Our vendor app is designed to queue actions locally and sync when connectivity is restored, so a dropped signal during a busy lunch rush doesn't mean lost orders.",
      },
      {
        type: "h2",
        text: "Where We Are Today",
      },
      {
        type: "p",
        text: "We are still proudly based in Abeokuta, growing from the same community that inspired us. The platform serves vendors and customers across the city, and our average vendor has seen a significant increase in daily order volume within months of joining. ChowSpace started as a solution to a problem we saw every day on a university campus — and that closeness to our users is something we will never lose.",
      },
    ],
  },
  {
    id: 3,
    title: "Tips for Vendors: Getting More Orders",
    description:
      "Maximize your sales and visibility on the platform with these practical steps.",
    Illustration: IllustrationVendorTips,
    date: "July 5, 2025",
    author: "Tomotele Christopher Oluwatobiloba",
    authorRole: "Founder, ChowSpace",
    category: "Vendors",
    readTime: "6 min read",
    content: [
      {
        type: "lead",
        text: "Getting your first ten orders on ChowSpace is about setup. Getting your first hundred is about strategy. And getting to five hundred and beyond is about consistency. This guide covers everything you need to know at every stage.",
      },
      {
        type: "h2",
        text: "1. Your Profile is Your First Impression",
      },
      {
        type: "p",
        text: "Customers decide in seconds. A complete, well-written profile with a clear business name, accurate location, and a warm description of what you cook converts browsers into buyers. Vendors with complete profiles receive on average 3x more clicks than those with incomplete ones.",
      },
      {
        type: "p",
        text: "Write your description like you're talking to a friend. Tell people what makes your food special. Are you using your grandmother's recipe? Do you source your tomatoes fresh from the market every morning? That detail matters. It creates trust and emotional connection before the customer has even tasted your food.",
      },
      {
        type: "h2",
        text: "2. Pricing: Be Honest, Not Just Cheap",
      },
      {
        type: "p",
        text: "The temptation when starting out is to undercut everyone. Resist it. Customers on ChowSpace are not just looking for the cheapest food — they are looking for value. Price your food to reflect the quality of your ingredients and the effort you put in. A plate priced too low raises questions; a plate priced fairly with a great description earns trust.",
      },
      {
        type: "quote",
        text: "Our top-earning vendors are almost never the cheapest option in their area. They are the most consistent, the most responsive, and the most honest about what they are selling.",
      },
      {
        type: "h2",
        text: "3. Response Time is Everything",
      },
      {
        type: "p",
        text: "When an order comes in, confirm it within two minutes. Customers who wait longer than five minutes for a confirmation often cancel and order elsewhere. Enable push notifications on your vendor app and keep your phone close during your operating hours. If you cannot take orders for a period, use the 'Store Closed' toggle — this is far better than ignoring orders or confirming them late.",
      },
      {
        type: "h2",
        text: "4. Set Realistic Delivery Times",
      },
      {
        type: "p",
        text: "Under-promise and over-deliver. If your food takes forty-five minutes to prepare, say sixty. If you finish in forty, the customer is delighted. If you say thirty minutes and deliver in fifty, you have lost their trust permanently. Your delivery duration setting in the app directly affects the rating customers leave you — set it honestly.",
      },
      {
        type: "h2",
        text: "5. Keep Your Menu Fresh",
      },
      {
        type: "p",
        text: "Update your menu with the seasons. Add daily specials. Remove items you can no longer source consistently. A stale menu with out-of-stock items is one of the fastest ways to frustrate customers and lose reviews. Spend ten minutes every Monday reviewing your menu — it is one of the highest-leverage activities you can do for your business.",
      },
      {
        type: "h2",
        text: "6. Ask for Reviews — The Right Way",
      },
      {
        type: "p",
        text: "After a successful delivery, a short, friendly message goes a long way: 'We hope you enjoyed your meal! If you have a moment, leaving us a review helps us reach more customers like you.' Most happy customers simply forget to review — a gentle reminder is all it takes. Never offer discounts in exchange for reviews, as this violates platform policy and erodes trust.",
      },
      {
        type: "h2",
        text: "7. Use the Analytics Dashboard",
      },
      {
        type: "p",
        text: "Your vendor dashboard shows you which items sell best, what times of day your orders peak, and how your rating has changed over time. Log in every week and look at these numbers. They will tell you whether to add a new dish, adjust your hours, or focus on a particular neighbourhood. Data-driven vendors consistently outperform those who operate on gut feel alone.",
      },
      {
        type: "p",
        text: "Success on ChowSpace is not a secret. It is the product of a great meal, a fast response, and a genuine commitment to your customer's experience. Do those three things every single day, and the orders will follow.",
      },
    ],
  },
];

const categoryColors = {
  Industry: "bg-blue-50 text-blue-600",
  Company: "bg-purple-50 text-purple-600",
  Vendors: "bg-emerald-50 text-emerald-600",
};

// ── Article content renderer ───────────────────────────────────────────────

function ArticleBody({ content }) {
  return (
    <div className="space-y-5">
      {content.map((block, i) => {
        if (block.type === "lead")
          return (
            <p
              key={i}
              className="text-lg text-gray-700 font-medium leading-relaxed border-l-4 border-[#AE2108] pl-4"
            >
              {block.text}
            </p>
          );
        if (block.type === "h2")
          return (
            <h2
              key={i}
              className="text-xl font-bold text-gray-900 mt-8 mb-2 pt-2"
            >
              {block.text}
            </h2>
          );
        if (block.type === "p")
          return (
            <p key={i} className="text-base text-gray-600 leading-relaxed">
              {block.text}
            </p>
          );
        if (block.type === "quote")
          return (
            <blockquote
              key={i}
              className="relative my-6 px-6 py-5 bg-[#AE2108]/5 border-l-4 border-[#AE2108] rounded-r-2xl"
            >
              <svg
                className="absolute top-3 right-4 opacity-10"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="#AE2108"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-base text-[#AE2108] font-medium leading-relaxed italic">
                &ldquo;{block.text}&rdquo;
              </p>
            </blockquote>
          );
        return null;
      })}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function Blog() {
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // lock body scroll when article is open
  useEffect(() => {
    document.body.style.overflow = activeId ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeId]);

  const activeArticle = articles.find((a) => a.id === activeId);
  const [featured, ...rest] = articles;

  return (
    <>
      <Head>
        <title>ChowSpace | Blog</title>
        <meta
          name="description"
          content="ChowSpace Blog &mdash; stories, insights and tips from the world of food and tech."
        />
        <link rel="canonical" href="https://chowspace.ng/Blog" />
        <meta property="og:title" content="ChowSpace | Blog" />
        <meta
          property="og:description"
          content="Food, tech and community — stories from the people building and using ChowSpace."
        />
        <meta property="og:url" content="https://chowspace.ng/Blog" />
        <meta
          property="og:image"
          content="https://chowspace.ng/og-preview.jpg"
        />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <div className="min-h-screen bg-gray-50 font-sans">
        {/* ── Hero ── */}
        <div className="relative overflow-hidden bg-[#AE2108]">
          <div className="absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-32 -bottom-12 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute left-10 top-6 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Stories & Insights
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-4">
                The ChowSpace
                <br />
                <span className="text-white/60">Blog</span>
              </h1>
              <p className="text-white/70 text-base sm:text-lg max-w-lg leading-relaxed">
                Food, tech, and community — stories from the people building and
                using ChowSpace every day.
              </p>
            </motion.div>
          </div>
        </div>

        {/* ── Blog grid ── */}
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 space-y-8">
          {/* Featured */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Featured
            </p>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300 group">
              <div className="grid grid-cols-1 sm:grid-cols-2">
                <div className="relative h-56 sm:h-full min-h-[220px] overflow-hidden bg-gray-50">
                  <featured.Illustration />
                </div>
                <div className="p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${categoryColors[featured.category]}`}
                      >
                        {featured.category}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {featured.readTime}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug mb-3">
                      {featured.title}
                    </h2>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {featured.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-xs text-gray-400 font-medium">
                      {featured.date}
                    </p>
                    <button
                      onClick={() => setActiveId(featured.id)}
                      className="flex items-center gap-1.5 bg-[#AE2108] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#941B06] transition shadow-sm shadow-red-200"
                    >
                      Read Article
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M5 12h14M13 6l6 6-6 6"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Rest */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
              Latest Posts
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rest.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: index * 0.1 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group"
                >
                  <div className="relative h-44 overflow-hidden bg-gray-50">
                    <post.Illustration />
                    <span
                      className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${categoryColors[post.category]}`}
                    >
                      {post.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] text-gray-400 font-medium">
                        {post.date}
                      </p>
                      <p className="text-[11px] text-gray-400 font-medium">
                        {post.readTime}
                      </p>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 leading-snug mb-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-4">
                      {post.description}
                    </p>
                    <button
                      onClick={() => setActiveId(post.id)}
                      className="flex items-center gap-1 text-xs text-[#AE2108] font-semibold hover:underline"
                    >
                      Read Article
                      <svg
                        width="11"
                        height="11"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M5 12h14M13 6l6 6-6 6"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Newsletter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden bg-[#AE2108] rounded-2xl px-6 sm:px-10 py-8 shadow-lg shadow-[#AE2108]/15"
          >
            <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute right-10 -bottom-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-white/60 text-xs font-medium mb-1">
                  Stay in the loop
                </p>
                <h3 className="text-white text-lg font-bold">
                  Get new posts in your inbox
                </h3>
                <p className="text-white/60 text-xs mt-1">
                  No spam. Just good reads.
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 sm:w-52 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/15 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:border-white/50 transition"
                />
                <button className="px-4 py-2.5 rounded-xl bg-white text-[#AE2108] text-sm font-bold hover:bg-white/90 transition whitespace-nowrap">
                  Subscribe
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Full article slide-in panel ── */}
      <AnimatePresence>
        {activeArticle && (
          <>
            {/* backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setActiveId(null)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            />

            {/* panel */}
            <motion.div
              key="panel"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
              className="fixed top-0 right-0 z-50 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${categoryColors[activeArticle.category]}`}
                  >
                    {activeArticle.category}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {activeArticle.readTime}
                  </span>
                </div>
                <button
                  onClick={() => setActiveId(null)}
                  className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto">
                {/* Illustration */}
                <div className="h-56 sm:h-64 bg-gray-50 overflow-hidden flex-shrink-0">
                  <activeArticle.Illustration />
                </div>

                <div className="px-6 sm:px-10 py-8">
                  {/* Title */}
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight mb-4">
                    {activeArticle.title}
                  </h1>

                  {/* Author + date row */}
                  <div className="flex items-center gap-3 pb-6 mb-6 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-[#AE2108]/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#AE2108] font-bold text-sm">
                        {activeArticle.author
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {activeArticle.author}
                      </p>
                      <p className="text-xs text-gray-400">
                        {activeArticle.authorRole} · {activeArticle.date}
                      </p>
                    </div>
                  </div>

                  {/* Article body */}
                  <ArticleBody content={activeArticle.content} />

                  {/* Footer */}
                  <div className="mt-10 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Written by</p>
                        <p className="text-sm font-bold text-gray-900">
                          {activeArticle.author}
                        </p>
                        <p className="text-xs text-gray-400">
                          {activeArticle.authorRole}
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveId(null)}
                        className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition"
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M19 12H5M12 5l-7 7 7 7"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Back to Blog
                      </button>
                    </div>
                  </div>

                  {/* Other articles */}
                  <div className="mt-8">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
                      More Articles
                    </p>
                    <div className="space-y-3">
                      {articles
                        .filter((a) => a.id !== activeArticle.id)
                        .map((a) => (
                          <button
                            key={a.id}
                            onClick={() => setActiveId(a.id)}
                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition text-left group"
                          >
                            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-white">
                              <a.Illustration />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {a.title}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {a.date} · {a.readTime}
                              </p>
                            </div>
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              className="flex-shrink-0 text-gray-300 group-hover:text-[#AE2108] transition"
                            >
                              <path
                                d="M5 12h14M13 6l6 6-6 6"
                                stroke="currentColor"
                                strokeWidth="2.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
