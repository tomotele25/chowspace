import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Poppins } from "next/font/google";
import {
  ArrowLeft,
  Search,
  Phone,
  MapPin,
  Bike,
  ShoppingBag,
  RefreshCw,
  X,
} from "lucide-react";
import axios from "axios";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const BACKENDURL = "https://chowspace-backend.vercel.app";
const POLL_MS = 30000;

// Every ticket is a full docket — shadow, spine, per-item rows. Mounting a
// vendor's whole history at once is what makes Safari kill the tab. Render a
// page at a time; the vendor asks for more if they want it.
const PAGE_SIZE = 30;

function timeAgo(date) {
  if (!date) return "";
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

function clockTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function naira(n) {
  return "\u20A6" + Number(n || 0).toLocaleString();
}

// Today means the local calendar day. Built from explicit local parts so the
// browser never has to guess a timezone from a parsed string — that parsing is
// inconsistent across mobile engines and silently shifts the window by hours.
function isToday(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  return d >= startOfToday;
}

// The cart is built as packs. If the order carries a pack marker, group by it
// so the kitchen can see the boundaries. Falls back to one flat list.
function groupIntoPacks(items) {
  const marked = items.some(
    (i) => i.packIndex != null || i.packId != null || i.pack != null,
  );
  if (!marked) return [{ key: "all", label: null, items }];

  const map = new Map();
  items.forEach((i) => {
    const k = i.packIndex ?? i.packId ?? i.pack ?? 0;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(i);
  });
  return [...map.entries()].map(([k, v], idx) => ({
    key: String(k),
    label: `Pack ${idx + 1}`,
    items: v,
  }));
}

function extrasText(item) {
  const extras = item.options || item.addons || item.extras || item.note;
  if (!extras) return null;
  if (typeof extras === "string") return extras;
  if (Array.isArray(extras))
    return extras.map((e) => (typeof e === "string" ? e : e.name)).join(", ");
  return null;
}

/* ── The tear line. Two notches punched out of the card edges, a dashed rule
      between them. It separates who the order is for from what to cook. ── */
function Perforation() {
  return (
    <div className="chit-tear" aria-hidden="true">
      <span className="chit-notch chit-notch-l" />
      <span className="chit-notch chit-notch-r" />
    </div>
  );
}

function TicketSkeleton({ index = 0 }) {
  return (
    <div className="chit chit-skeleton" style={{ "--i": index }}>
      <div className="px-5 pb-4 pt-5">
        <div className="mb-3 flex justify-between">
          <div className="space-y-2">
            <div className="h-6 w-28 rounded bg-black/[0.06]" />
            <div className="h-3 w-20 rounded bg-black/[0.06]" />
          </div>
          <div className="h-7 w-24 rounded-full bg-black/[0.06]" />
        </div>
        <div className="h-4 w-36 rounded bg-black/[0.06]" />
      </div>
      <Perforation />
      <div className="space-y-3 px-5 pb-5 pt-5">
        <div className="h-4 w-full rounded bg-black/[0.06]" />
        <div className="h-4 w-4/5 rounded bg-black/[0.06]" />
        <div className="h-4 w-2/3 rounded bg-black/[0.06]" />
      </div>
    </div>
  );
}

function OrderTicket({ order, index = 0 }) {
  const name = order.guestInfo?.name || order.customerId?.fullname || "Guest";
  const phone = order.guestInfo?.phone || order.customerId?.phone;
  const address = order.guestInfo?.address || order.deliveryAddress;
  const isDelivery = !!address || order.orderType === "delivery";
  const items = order.items || [];
  const ref = (order._id || "").slice(-6).toUpperCase();
  const packs = useMemo(() => groupIntoPacks(items), [items]);
  const itemCount = items.reduce((s, i) => s + (i.quantity || 1), 0);

  return (
    <article className="chit" style={{ "--i": index }}>
      {/* ── Stub: who it's for ── */}
      <header className="px-5 pb-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mono text-[22px] font-bold leading-none tracking-tight text-[#AE2108]">
              #{ref}
            </p>
            <p className="mt-1.5 text-xs text-[#8A867F]">
              {clockTime(order.createdAt)}
              <span className="px-1.5 text-[#D6D3CD]">{"\u2022"}</span>
              {timeAgo(order.createdAt)}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#F3F2EF] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#5C584F]">
            {isDelivery ? (
              <Bike size={13} className="text-[#AE2108]" />
            ) : (
              <ShoppingBag size={13} className="text-[#AE2108]" />
            )}
            {isDelivery ? "Delivery" : "Pickup"}
          </span>
        </div>

        <p className="mt-4 text-[15px] font-semibold text-[#171512]">{name}</p>

        <div className="mt-1.5 space-y-1">
          {phone && (
            <a
              href={`tel:${phone}`}
              className="-mx-2 flex w-fit items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-[#6B6862] transition-colors hover:text-[#AE2108] active:bg-[#F3F2EF]"
            >
              <Phone size={13} className="shrink-0" />
              <span className="mono">{phone}</span>
            </a>
          )}
          {address && (
            <p className="flex items-start gap-1.5 text-sm leading-relaxed text-[#6B6862]">
              <MapPin size={13} className="mt-[3px] shrink-0" />
              {address}
            </p>
          )}
        </div>
      </header>

      <Perforation />

      {/* ── Body: what to cook ── */}
      <div className="px-5 pb-5 pt-5">
        {items.length === 0 ? (
          <p className="text-sm text-[#A5A199]">No items on this order.</p>
        ) : (
          packs.map((pack, pi) => (
            <div key={pack.key} className={pi > 0 ? "mt-5" : ""}>
              {pack.label && (
                <p className="mb-2.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#A5A199]">
                  {pack.label}
                  <span className="h-px flex-1 bg-[#EBE9E5]" />
                </p>
              )}
              <ul className="space-y-3">
                {pack.items.map((item, i) => {
                  const qty = item.quantity || 1;
                  const line = item.price != null ? item.price * qty : null;
                  const extras = extrasText(item);
                  return (
                    <li key={i}>
                      <div className="flex items-baseline gap-2.5">
                        <span className="mono shrink-0 rounded bg-[#AE2108]/[0.07] px-1.5 py-0.5 text-[13px] font-bold text-[#AE2108]">
                          {qty}
                          {"\u00D7"}
                        </span>
                        <span className="text-[15px] font-medium text-[#171512]">
                          {item.name}
                        </span>
                        <span className="mx-0.5 h-px flex-1 translate-y-[-2px] border-b border-dashed border-[#DEDBD5]" />
                        {line != null && (
                          <span className="mono shrink-0 text-[14px] font-semibold text-[#171512]">
                            {naira(line)}
                          </span>
                        )}
                      </div>
                      {(qty > 1 || extras) && (
                        <p className="mt-1 pl-9 text-xs leading-relaxed text-[#8A867F]">
                          {qty > 1 && item.price != null && (
                            <span className="mono">
                              {naira(item.price)} each
                            </span>
                          )}
                          {qty > 1 && item.price != null && extras && (
                            <span className="px-1.5 text-[#D6D3CD]">
                              {"\u2022"}
                            </span>
                          )}
                          {extras}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}

        {order.note && (
          <p className="mt-4 rounded-lg border-l-2 border-[#AE2108] bg-[#AE2108]/[0.04] px-3 py-2 text-sm leading-relaxed text-[#5C584F]">
            {order.note}
          </p>
        )}

        {/* ── Tally ── */}
        <div className="mt-5 border-t border-[#EBE9E5] pt-4">
          {order.deliveryFee != null && (
            <div className="mb-1.5 flex items-baseline justify-between text-sm text-[#8A867F]">
              <span>Delivery fee</span>
              <span className="mono">{naira(order.deliveryFee)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#A5A199]">
              Total {"\u00B7"} {itemCount} item{itemCount !== 1 ? "s" : ""}
            </span>
            <span className="mono text-[20px] font-bold leading-none text-[#171512]">
              {naira(order.totalAmount)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function OrderTracking() {
  const { data: session, status: authStatus } = useSession();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const vendorId = session?.user?.vendorId;

  const load = useCallback(
    async ({ silent } = {}) => {
      if (!vendorId) return;
      if (silent) setRefreshing(true);
      try {
        const res = await axios.get(
          `${BACKENDURL}/api/getAllOrders?vendorId=${vendorId}`,
        );
        setOrders(res.data.orders || []);
        setError("");
      } catch (err) {
        console.error(err);
        // A failed background poll should not wipe the screen the vendor is using
        if (!silent)
          setError("Orders didn't load. Check your connection and try again.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [vendorId],
  );

  useEffect(() => {
    // Without this, an unauthenticated visit spins forever on the skeletons
    if (authStatus === "loading") return;
    if (authStatus !== "authenticated") {
      setLoading(false);
      setError("Sign in to view your orders.");
      return;
    }
    if (!vendorId) {
      setLoading(false);
      setError(
        "We couldn't find your vendor account. Sign in again to continue.",
      );
      return;
    }
    load();
  }, [authStatus, vendorId, load]);

  // New orders land on their own, no pull to refresh needed
  useEffect(() => {
    if (authStatus !== "authenticated" || !vendorId) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") load({ silent: true });
    }, POLL_MS);
    return () => clearInterval(id);
  }, [authStatus, vendorId, load]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 6000);
    return () => clearTimeout(t);
  }, [error]);

  // A new search is a fresh look — don't carry a huge page over.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search]);

  // This page is today-only. Everything downstream works off today's orders.
  const todaysOrders = useMemo(
    () => orders.filter((o) => isToday(o.createdAt)),
    [orders],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return todaysOrders
      .filter(
        (o) =>
          !q ||
          o.guestInfo?.name?.toLowerCase().includes(q) ||
          o.customerId?.fullname?.toLowerCase().includes(q) ||
          o.guestInfo?.phone?.includes(q) ||
          o.customerId?.phone?.includes(q) ||
          o._id?.toLowerCase().includes(q) ||
          (o.items || []).some((i) => i.name?.toLowerCase().includes(q)),
      )
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [todaysOrders, search]);

  // Only this slice is ever mounted.
  const shown = useMemo(
    () => visible.slice(0, visibleCount),
    [visible, visibleCount],
  );
  const remaining = visible.length - shown.length;

  // The tally always reflects today in full, not just the rendered slice or a
  // search subset.
  const summary = useMemo(() => {
    const revenue = todaysOrders.reduce(
      (s, o) => s + Number(o.totalAmount || 0),
      0,
    );
    const items = todaysOrders.reduce(
      (s, o) => s + (o.items || []).reduce((n, i) => n + (i.quantity || 1), 0),
      0,
    );
    return { count: todaysOrders.length, revenue, items };
  }, [todaysOrders]);

  return (
    <div className={`${poppins.variable} order-page`}>
      {/* ── Header ── */}
      <div className="order-head">
        <div className="mx-auto max-w-5xl px-4 pb-3 pt-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <button
              onClick={() => window.history.back()}
              className="-ml-2 flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-[#AE2108] transition-colors active:bg-black/[0.04]"
            >
              <ArrowLeft size={17} />
              Back
            </button>

            <div className="flex items-center gap-2.5">
              <div className="text-right">
                <h1 className="text-[17px] font-bold leading-none tracking-tight text-[#171512]">
                  Orders
                </h1>
                <p className="mt-1 text-[11px] leading-none text-[#A5A199]">
                  Today
                </p>
              </div>
              <button
                onClick={() => load({ silent: true })}
                disabled={refreshing}
                aria-label="Refresh orders"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E4E0] bg-white text-[#8A867F] transition-colors active:bg-[#F3F2EF] hover:text-[#AE2108] disabled:opacity-50"
              >
                <RefreshCw size={15} className={refreshing ? "spin" : ""} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search
              size={17}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A5A199]"
            />
            <input
              type="search"
              inputMode="search"
              placeholder="Search name, phone, item or order number"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#E5E4E0] bg-white py-3 pl-11 pr-11 text-base text-[#171512] placeholder:text-[#A5A199] focus:border-[#AE2108] focus:outline-none focus:ring-2 focus:ring-[#AE2108]/15"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[#A5A199] transition-colors active:bg-[#F3F2EF] hover:text-[#171512]"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── List ── */}
      <div className="mx-auto max-w-5xl px-4 pb-24 pt-5">
        {/* Today's tally, set like the foot of a receipt roll */}
        {!loading && todaysOrders.length > 0 && (
          <div className="tally">
            <span className="tally-k">Orders</span>
            <span className="tally-dots" />
            <span className="mono tally-v">{summary.count}</span>

            <span className="tally-k tally-gap">Items</span>
            <span className="tally-dots" />
            <span className="mono tally-v">{summary.items}</span>

            <span className="tally-k tally-gap">Value</span>
            <span className="tally-dots" />
            <span className="mono tally-v tally-brand">
              {naira(summary.revenue)}
            </span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <TicketSkeleton key={i} index={i} />
            ))}
          </div>
        ) : shown.length > 0 ? (
          <>
            <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-2">
              {shown.map((order, i) => (
                <OrderTicket key={order._id} order={order} index={i} />
              ))}
            </div>

            {remaining > 0 && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="rounded-xl border border-[#E5E4E0] bg-white px-5 py-3 text-sm font-semibold text-[#171512] transition-colors hover:border-[#AE2108] hover:text-[#AE2108] active:bg-[#F3F2EF]"
                >
                  Show {Math.min(PAGE_SIZE, remaining)} more
                </button>
                <p className="mt-2 text-xs text-[#A5A199]">
                  {remaining} more order{remaining !== 1 ? "s" : ""} today
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#DEDBD5] bg-white/60 py-20 text-center">
            <p className="text-[15px] font-semibold text-[#171512]">
              {search ? "Nothing matches that search" : "No orders yet today"}
            </p>
            <p className="mx-auto mt-1.5 max-w-[260px] text-sm leading-relaxed text-[#8A867F]">
              {search
                ? "Try a different name, phone number, item or order number."
                : "New orders show up here the moment they come in."}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-5 rounded-xl bg-[#AE2108] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#941B06] active:bg-[#7A1605]"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center p-4">
          <div className="toast pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl bg-[#171512] px-4 py-3.5 text-sm text-white">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#AE2108]" />
            <span className="flex-1">{error}</span>
            <button
              onClick={() => setError("")}
              aria-label="Dismiss"
              className="shrink-0 text-white/40 transition-colors hover:text-white"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .order-page {
          --brand: #ae2108;
          --paper: #ffffff;
          --surface: #f4f3f0;
          --line: #e5e4e0;
          min-height: 100vh;
          background: var(--surface);
          font-family: var(--font-poppins), system-ui, sans-serif;
          color: #171512;
        }

        /* Opaque on purpose. A backdrop-filter here has to re-composite the
           blur against the whole list on every scroll frame, which is a
           memory sink on iOS. */
        .order-head {
          position: sticky;
          top: 0;
          z-index: 20;
          background: var(--surface);
          border-bottom: 1px solid var(--line);
        }

        /* Prices, quantities and refs are data — they line up in a column and
           should be read as a column. */
        .mono {
          font-family: ui-monospace, "SF Mono", "Roboto Mono", Menlo, monospace;
          font-variant-numeric: tabular-nums;
        }

        /* ── The chit ──
           Every card is an order docket: a stub with the customer, a tear,
           then the list to cook from. */
        .chit {
          position: relative;
          background: var(--paper);
          border-radius: 14px;
          box-shadow:
            0 1px 2px rgba(23, 21, 18, 0.04),
            0 4px 16px -6px rgba(23, 21, 18, 0.08);
          animation: rise 0.4s cubic-bezier(0.2, 0.7, 0.3, 1) backwards;
          /* Capped — a full page of tickets would otherwise stagger for
             seconds before the last one appeared. */
          animation-delay: min(calc(var(--i, 0) * 40ms), 400ms);
        }
        /* the spine */
        .chit::before {
          content: "";
          position: absolute;
          left: 0;
          top: 14px;
          bottom: 14px;
          width: 3px;
          border-radius: 0 3px 3px 0;
          background: var(--brand);
        }

        .chit-tear {
          position: relative;
          height: 1px;
          margin: 0 14px;
          border-top: 1px dashed #dedbd5;
        }
        .chit-notch {
          position: absolute;
          top: -8px;
          width: 16px;
          height: 16px;
          border-radius: 999px;
          background: var(--surface);
        }
        .chit-notch-l {
          left: -22px;
        }
        .chit-notch-r {
          right: -22px;
        }

        .chit-skeleton {
          animation: none;
        }
        .chit-skeleton :global(div) {
          animation: pulse 1.4s ease-in-out infinite;
        }

        /* ── Tally ── */
        .tally {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 0 8px;
          margin-bottom: 20px;
          padding: 14px 18px;
          background: var(--paper);
          border-radius: 14px;
          box-shadow: 0 1px 2px rgba(23, 21, 18, 0.04);
        }
        .tally-k {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #a5a199;
        }
        .tally-gap {
          margin-left: 20px;
        }
        .tally-dots {
          flex: 1 1 24px;
          min-width: 16px;
          transform: translateY(-3px);
          border-bottom: 1px dashed #dedbd5;
        }
        .tally-v {
          font-size: 15px;
          font-weight: 700;
          color: #171512;
        }
        .tally-brand {
          color: var(--brand);
        }

        .toast {
          box-shadow: 0 8px 30px -8px rgba(23, 21, 18, 0.4);
          animation: rise 0.25s ease-out backwards;
        }

        .spin {
          animation: spin 0.9s linear infinite;
        }

        @keyframes rise {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes pulse {
          50% {
            opacity: 0.45;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .chit,
          .toast {
            animation: none;
          }
          .chit-skeleton :global(div) {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
