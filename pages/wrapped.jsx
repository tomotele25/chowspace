"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { toPng } from "html-to-image";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Sparkles,
  X,
  Utensils,
  Store,
  CalendarDays,
  Wallet,
  ShoppingBag,
} from "lucide-react";
import { BACKENDURL } from "@/lib/api";

const YEAR = 2026;
const SLIDE_MS = 5200;
const naira = (n) => "₦" + Number(n || 0).toLocaleString("en-NG");

/* Count-up number, runs once when its slide mounts */
const CountUp = ({ value = 0, prefix = "", duration = 1100 }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf;
    const t0 = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      // easeOutCubic
      setN(Math.round((1 - Math.pow(1 - p, 3)) * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return (
    <span>
      {prefix}
      {n.toLocaleString("en-NG")}
    </span>
  );
};

/* ---- individual slides ---- */
const slideFor = (data) => {
  const s = [];
  s.push({
    bg: "from-[#AE2108] via-[#C63210] to-[#7a1605]",
    render: () => (
      <div className="text-center">
        <Sparkles className="mx-auto mb-6 h-12 w-12 opacity-90" />
        <p className="text-lg font-medium opacity-80">Your {YEAR} in food</p>
        <h1 className="mt-3 text-5xl font-black leading-tight">
          Let&rsquo;s look
          <br />
          back
        </h1>
        <p className="mt-6 text-sm opacity-70">Tap to begin &rarr;</p>
      </div>
    ),
  });

  s.push({
    bg: "from-[#6d28d9] via-[#7c3aed] to-[#4c1d95]",
    render: () => (
      <div className="text-center">
        <ShoppingBag className="mx-auto mb-5 h-10 w-10 opacity-90" />
        <p className="text-lg opacity-80">You placed</p>
        <div className="my-3 text-7xl font-black">
          <CountUp value={data.totalOrders} />
        </div>
        <p className="text-lg opacity-80">
          {data.totalOrders === 1 ? "order" : "orders"} this year
        </p>
        <p className="mt-6 text-sm opacity-70">
          across {data.uniqueVendors}{" "}
          {data.uniqueVendors === 1 ? "kitchen" : "different kitchens"}
        </p>
      </div>
    ),
  });

  s.push({
    bg: "from-[#047857] via-[#059669] to-[#064e3b]",
    render: () => (
      <div className="text-center">
        <Wallet className="mx-auto mb-5 h-10 w-10 opacity-90" />
        <p className="text-lg opacity-80">You spent</p>
        <div className="my-3 text-6xl font-black">
          <CountUp value={data.totalSpent} prefix={"₦"} />
        </div>
        <p className="text-lg opacity-80">on good food</p>
        {data.totalItems ? (
          <p className="mt-6 text-sm opacity-70">
            that&rsquo;s {data.totalItems} items in total
          </p>
        ) : null}
      </div>
    ),
  });

  if (data.topVendor) {
    s.push({
      bg: "from-[#b45309] via-[#d97706] to-[#78350f]",
      render: () => (
        <div className="text-center">
          <p className="text-lg opacity-80">Your top spot</p>
          {data.topVendor.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.topVendor.logo}
              alt=""
              className="mx-auto my-5 h-24 w-24 rounded-2xl object-cover ring-4 ring-white/30"
            />
          ) : (
            <Store className="mx-auto my-5 h-12 w-12 opacity-90" />
          )}
          <h2 className="text-4xl font-black">{data.topVendor.name}</h2>
          <p className="mt-4 text-lg opacity-80">
            {data.topVendor.orders} orders &middot;{" "}
            {naira(data.topVendor.spent)}
          </p>
          {data.runnerUpVendors?.length ? (
            <p className="mt-6 text-sm opacity-70">
              also loved{" "}
              {data.runnerUpVendors.map((v) => v.name).join(" & ")}
            </p>
          ) : null}
        </div>
      ),
    });
  }

  if (data.favoriteDish) {
    s.push({
      bg: "from-[#be123c] via-[#e11d48] to-[#881337]",
      render: () => (
        <div className="text-center">
          <Utensils className="mx-auto mb-5 h-10 w-10 opacity-90" />
          <p className="text-lg opacity-80">You couldn&rsquo;t stop ordering</p>
          <h2 className="my-4 text-4xl font-black leading-tight">
            {data.favoriteDish.name}
          </h2>
          <p className="text-lg opacity-80">
            {data.favoriteDish.qty} times
          </p>
          {data.topItems?.length > 1 ? (
            <p className="mt-6 text-sm opacity-70">
              runners-up:{" "}
              {data.topItems
                .slice(1)
                .map((i) => i.name)
                .join(", ")}
            </p>
          ) : null}
        </div>
      ),
    });
  }

  s.push({
    bg: "from-[#1d4ed8] via-[#2563eb] to-[#1e3a8a]",
    render: () => (
      <div className="text-center">
        <CalendarDays className="mx-auto mb-5 h-10 w-10 opacity-90" />
        <p className="text-lg opacity-80">Your hungriest month was</p>
        <h2 className="my-4 text-5xl font-black">{data.busiestMonth.name}</h2>
        <p className="text-lg opacity-80">
          {data.busiestMonth.orders} orders
        </p>
        {data.favoriteDay?.name ? (
          <p className="mt-6 text-sm opacity-70">
            and {data.favoriteDay.name} was your go-to day
          </p>
        ) : null}
      </div>
    ),
  });

  s.push({
    bg: "from-[#0f172a] via-[#334155] to-[#020617]",
    render: () => (
      <div className="text-center">
        <p className="text-lg opacity-80">This year, you were</p>
        <h2 className="my-5 text-5xl font-black leading-tight">
          {data.persona}
        </h2>
        <p className="text-sm opacity-70">
          Started {new Date(data.firstOrder.date).toLocaleDateString("en-NG")} at{" "}
          {data.firstOrder.vendorName}
        </p>
      </div>
    ),
  });

  return s;
};

/* ---- shareable summary card ---- */
const SummaryCard = ({ data, name, cardRef }) => (
  <div
    ref={cardRef}
    className="mx-auto w-[340px] rounded-3xl bg-gradient-to-br from-[#AE2108] via-[#C63210] to-[#5c1104] p-6 text-white shadow-2xl"
  >
    <div className="flex items-center justify-between">
      <span className="text-sm font-bold tracking-wide">CHOWSPACE</span>
      <span className="text-sm font-medium opacity-80">{YEAR} Wrapped</span>
    </div>
    <p className="mt-4 text-lg font-semibold">{name || "Your"} year in food</p>

    <div className="mt-4 grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-white/10 p-3">
        <p className="text-2xl font-black">{data.totalOrders}</p>
        <p className="text-xs opacity-80">orders</p>
      </div>
      <div className="rounded-2xl bg-white/10 p-3">
        <p className="text-2xl font-black">{naira(data.totalSpent)}</p>
        <p className="text-xs opacity-80">spent</p>
      </div>
      <div className="rounded-2xl bg-white/10 p-3">
        <p className="truncate text-base font-black">
          {data.topVendor?.name || "—"}
        </p>
        <p className="text-xs opacity-80">top spot</p>
      </div>
      <div className="rounded-2xl bg-white/10 p-3">
        <p className="truncate text-base font-black">
          {data.favoriteDish?.name || "—"}
        </p>
        <p className="text-xs opacity-80">most ordered</p>
      </div>
    </div>

    <div className="mt-3 rounded-2xl bg-white/10 p-3 text-center">
      <p className="text-xs opacity-80">your food personality</p>
      <p className="text-lg font-black">{data.persona}</p>
    </div>

    <p className="mt-4 text-center text-xs opacity-70">chowspace.ng</p>
  </div>
);

export default function Wrapped() {
  const router = useRouter();
  const { data: session, status } = useSession();
  // loading | askphone | nodata | ready | error
  const [state, setState] = useState({ phase: "loading" });
  const [phone, setPhone] = useState("");
  const [phoneErr, setPhoneErr] = useState("");
  const [i, setI] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);
  const timerRef = useRef(null);

  const applyResult = (json) => {
    if (!json?.success) setState({ phase: "error" });
    else if (!json.hasData) setState({ phase: "nodata" });
    else setState({ phase: "ready", data: json });
  };

  // Signed-in customers load their own Wrapped straight away.
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      setState({ phase: "askphone" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${BACKENDURL}/api/customer/wrapped?year=${YEAR}`,
          { headers: { Authorization: `Bearer ${session.user.accessToken}` } }
        );
        const json = await res.json();
        if (!cancelled) applyResult(json);
      } catch {
        if (!cancelled) setState({ phase: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [session, status]);

  const loadByPhone = async (e) => {
    e?.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 7) {
      setPhoneErr("Enter the phone number you order with");
      return;
    }
    setPhoneErr("");
    setState({ phase: "loading" });
    setI(0);
    setShowSummary(false);
    try {
      const res = await fetch(
        `${BACKENDURL}/api/customer/wrapped-by-phone?phone=${encodeURIComponent(
          digits
        )}&year=${YEAR}`
      );
      const json = await res.json();
      if (res.status === 400) {
        setPhoneErr(json?.message || "Enter a valid phone number");
        setState({ phase: "askphone" });
        return;
      }
      applyResult(json);
    } catch {
      setState({ phase: "error" });
    }
  };

  const slides = useMemo(
    () => (state.phase === "ready" ? slideFor(state.data) : []),
    [state]
  );

  const next = useCallback(() => {
    setI((p) => {
      if (p + 1 >= slides.length) {
        setShowSummary(true);
        return p;
      }
      return p + 1;
    });
  }, [slides.length]);

  const prev = useCallback(() => {
    setShowSummary(false);
    setI((p) => Math.max(0, p - 1));
  }, []);

  // auto-advance
  useEffect(() => {
    if (state.phase !== "ready" || showSummary) return;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(next, SLIDE_MS);
    return () => clearTimeout(timerRef.current);
  }, [i, showSummary, state.phase, next]);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const url = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = url;
      a.download = `chowspace-wrapped-${YEAR}.png`;
      a.click();
    } catch (e) {
      console.error("wrapped download failed", e);
    }
    setDownloading(false);
  };

  /* ---- non-story states ---- */
  if (state.phase === "loading" || (status === "loading" && !session)) {
    return (
      <Shell>
        <p className="animate-pulse text-white/80">Building your Wrapped…</p>
      </Shell>
    );
  }
  if (state.phase === "error") {
    return (
      <Shell>
        <div className="text-center text-white">
          <p className="mb-4">We couldn&rsquo;t build your Wrapped right now.</p>
          <BackHome router={router} />
        </div>
      </Shell>
    );
  }
  if (state.phase === "askphone") {
    return (
      <Shell>
        <div className="w-full max-w-xs text-center text-white">
          <Sparkles className="mx-auto mb-4 h-10 w-10" />
          <h1 className="text-2xl font-black">Your {YEAR} in food</h1>
          <p className="mt-2 text-sm text-white/80">
            No account? Enter the phone number you order with and we&rsquo;ll
            pull up your year.
          </p>
          <form onSubmit={loadByPhone} className="mt-6 space-y-3">
            <input
              type="tel"
              inputMode="numeric"
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0803 000 0000"
              className="w-full rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-center text-white placeholder-white/50 outline-none focus:border-white"
            />
            {phoneErr ? (
              <p className="text-xs text-yellow-200">{phoneErr}</p>
            ) : null}
            <button
              type="submit"
              className="w-full rounded-full bg-white px-5 py-3 text-sm font-bold text-[#AE2108]"
            >
              See my Wrapped
            </button>
          </form>
          <button
            onClick={() =>
              router.push(
                `/Login?as=customer&callbackUrl=${encodeURIComponent(
                  "/wrapped"
                )}`
              )
            }
            className="mt-4 text-xs text-white/70 underline"
          >
            or sign in to your account
          </button>
        </div>
      </Shell>
    );
  }
  if (state.phase === "nodata") {
    return (
      <Shell>
        <div className="max-w-xs text-center text-white">
          <Sparkles className="mx-auto mb-4 h-10 w-10" />
          <h1 className="text-2xl font-black">No orders found for {YEAR}</h1>
          <p className="mt-3 text-sm text-white/80">
            {session?.user
              ? "Order from a few kitchens and come back — your Wrapped will be waiting."
              : "We couldn't find orders on that number this year. Try another, or order a few times and come back."}
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            {!session?.user && (
              <button
                onClick={() => setState({ phase: "askphone" })}
                className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Try another number
              </button>
            )}
            <BackHome router={router} label="Find food" />
          </div>
        </div>
      </Shell>
    );
  }

  /* ---- story ---- */
  const active = slides[i];
  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-black text-white">
      {/* progress bars */}
      <div className="absolute inset-x-0 top-0 z-20 flex gap-1 p-3">
        {slides.map((_, idx) => (
          <div
            key={idx}
            className="h-1 flex-1 overflow-hidden rounded-full bg-white/25"
          >
            <div
              className="h-full bg-white transition-[width] duration-200"
              style={{
                width:
                  idx < i || showSummary ? "100%" : idx === i ? "100%" : "0%",
                transitionDuration: idx === i && !showSummary ? `${SLIDE_MS}ms` : "0ms",
                transitionTimingFunction: "linear",
              }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => router.push("/")}
        aria-label="Close"
        className="absolute right-3 top-6 z-20 rounded-full bg-white/15 p-2 backdrop-blur"
      >
        <X className="h-5 w-5" />
      </button>

      {/* tap zones */}
      <button
        aria-label="Previous"
        onClick={prev}
        className="absolute inset-y-0 left-0 z-10 w-1/3"
      />
      <button
        aria-label="Next"
        onClick={next}
        className="absolute inset-y-0 right-0 z-10 w-2/3"
      />

      <AnimatePresence mode="wait">
        {!showSummary ? (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${active.bg} px-8`}
          >
            <div className="w-full max-w-sm">{active.render()}</div>
          </motion.div>
        ) : (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex h-full w-full flex-col items-center justify-center gap-5 bg-gradient-to-br from-[#1a0a06] via-[#2a0f08] to-black px-6 py-10"
          >
            <SummaryCard
              data={state.data}
              name={session?.user?.fullname?.split(" ")[0]}
              cardRef={cardRef}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#AE2108] disabled:opacity-60"
              >
                <Download className="h-4 w-4" />
                {downloading ? "Preparing…" : "Download"}
              </button>
              <button
                onClick={() => router.push("/")}
                className="rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold"
              >
                Done
              </button>
            </div>
            <button
              onClick={prev}
              className="mt-1 flex items-center gap-1 text-xs text-white/60"
            >
              <ArrowLeft className="h-3 w-3" /> back
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* desktop nav hint */}
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-6 text-white/50">
        <ArrowLeft className="h-4 w-4" />
        <span className="text-xs">tap to move</span>
        <ArrowRight className="h-4 w-4" />
      </div>
    </div>
  );
}

const Shell = ({ children }) => (
  <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#AE2108] via-[#7a1605] to-black p-6">
    {children}
  </div>
);

const BackHome = ({ router, label = "Back to home" }) => (
  <button
    onClick={() => router.push("/")}
    className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#AE2108]"
  >
    {label}
  </button>
);
