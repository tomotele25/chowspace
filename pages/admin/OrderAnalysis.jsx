"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  PhoneCall,
  X,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  ShoppingBag,
  Wallet,
  Star,
  Copy,
  Check,
  MessageCircle,
  Crown,
  Clock,
  Repeat,
  Flame,
  Rocket,
  Activity,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
  BarChart,
  Bar,
  Cell,
} from "recharts";

const BACKENDURL =
  "https://chowspace-backend.vercel.app" || "http://localhost:2005";

/* ─────────────────────────────────────────────────────────────────────────
   ── Commission engine (date-aware)
   Old rate applies to every order created BEFORE the change date.
   New rate applies from the change date onward. Change these 4 lines only.
   ───────────────────────────────────────────────────────────────────────── */
const OLD_RATE = 60;
const NEW_RATE = 100;
// Sun Jul 19 2026, 00:00 local — new pricing starts here. (month is 0-indexed)
const RATE_CHANGE_DATE = new Date(2026, 6, 19, 0, 0, 0, 0);
const PAYOUT_ACCOUNT = { number: "9152580773", bank: "Opay" };

// At/above this many orders in the current week = "high volume".
const HIGH_VOLUME_WEEKLY = 20;

const commissionForOrder = (o) =>
  new Date(o.createdAt) >= RATE_CHANGE_DATE ? NEW_RATE : OLD_RATE;

const commissionForOrders = (list) =>
  list.reduce((s, o) => s + commissionForOrder(o), 0);

const rateSplit = (list) => {
  let old = 0;
  let neu = 0;
  list.forEach((o) =>
    commissionForOrder(o) === NEW_RATE ? (neu += 1) : (old += 1),
  );
  return { old, neu };
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

const isSameDay = (a, b) =>
  new Date(a).toDateString() === new Date(b).toDateString();

const pct = (cur, prev) =>
  prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

// Normalise a Nigerian number to wa.me format (234XXXXXXXXXX)
const waNumber = (raw) => {
  if (!raw) return null;
  let d = String(raw).replace(/\D/g, "");
  if (!d) return null;
  if (d.startsWith("234")) return d;
  if (d.startsWith("0")) return "234" + d.slice(1);
  if (d.length === 10) return "234" + d;
  return d;
};

const vendorPhone = (v) =>
  v?.phone ||
  v?.phoneNumber ||
  v?.businessPhone ||
  v?.contact ||
  v?.whatsapp ||
  v?.mobile ||
  "";

const custKey = (o) =>
  o.guestInfo?.phone || o.customerId?._id || o.customerId?.email || null;

const buildBillMessage = (list, mode) => {
  const count = list.length;
  const amount = commissionForOrders(list);
  const header =
    mode === "pending"
      ? "Here's all pending payment"
      : "Here's today's summary :";
  return `${greeting()} 😊
${header}
* Total Orders: ${count}
* Total Amount: ₦${amount.toLocaleString()}
Payment Details:
ACC No: ${PAYOUT_ACCOUNT.number} (${PAYOUT_ACCOUNT.bank})
— Chowspace`;
};

// ── Week helper (Sunday start) ─────────────────────────────────────────────
const getWeekRange = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// ── Custom tooltip ─────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-bold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}:{" "}
          {p.name.includes("Revenue") || p.name.includes("₦")
            ? `₦${Number(p.value).toLocaleString()}`
            : p.value}
        </p>
      ))}
    </div>
  );
}

// Small reusable stat tile for the snapshot grid
function Tile({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div
        className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${
          accent || "bg-gray-100 text-gray-500"
        }`}
      >
        <Icon size={15} />
      </div>
      <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
      <p className="text-[11px] font-medium text-gray-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filterType, setFilterType] = useState("daily");
  const [filterDate, setFilterDate] = useState("");

  // billing + advanced analytics state
  const [billMode, setBillMode] = useState("today"); // "today" | "pending"
  const [copied, setCopied] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState("week"); // today|week|month|all

  // Vendors with no orders in any of the three weeks are hidden by default —
  // on a platform with a long tail of signed-up-but-dormant stores they would
  // otherwise be most of the table.
  const [showInactiveVendors, setShowInactiveVendors] = useState(false);

  // How many weeks back the per-vendor table reaches. Four covers "is this
  // vendor slipping"; twelve is for spotting a season.
  const [weeksShown, setWeeksShown] = useState(4);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/Login");
  }, [status]);

  const logout = async () => await signOut({ callbackUrl: "/Login" });

  useEffect(() => {
    axios
      .get(`${BACKENDURL}/api/vendor/getVendors`)
      .then((r) => setVendors(r.data.vendors || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    setLoading(true);
    axios
      .get(`${BACKENDURL}/api/getAllOrdersForAdmin`, {
        headers: { Authorization: `Bearer ${session.user.accessToken}` },
      })
      .then((r) => {
        const o = r.data.orders || [];
        setOrders(o);
        processAnalytics(o);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session]);

  const processAnalytics = (ordersData) => {
    const { start } = getWeekRange();
    const days = Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const s = new Date(day);
      s.setHours(0, 0, 0, 0);
      const e = new Date(day);
      e.setHours(23, 59, 59, 999);
      const dayOrders = ordersData.filter((o) => {
        const d = new Date(o.createdAt);
        return d >= s && d <= e;
      });
      return {
        name: s.toLocaleDateString("en-US", { weekday: "short" }),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      };
    });
    setAnalyticsData(days);
  };

  const { start: wStart, end: wEnd } = getWeekRange();
  const weekOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= wStart && d <= wEnd;
  });

  const totalOrders = analyticsData.reduce((s, d) => s + d.orders, 0);
  const totalRevenue = analyticsData.reduce((s, d) => s + d.revenue, 0);
  const avgDaily = (totalOrders / 7).toFixed(1);
  const totalCommission = commissionForOrders(weekOrders);

  const openVendorModal = (vendor) => {
    setSelectedVendor(vendor);
    const vAll = orders.filter((o) => o.vendorId?._id === vendor._id);
    setFilteredOrders(vAll);
    setModalOpen(true);
    setFilterType("daily");
    setFilterDate("");
    setCopied(false);
    const weekCount = vAll.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= wStart && d <= wEnd;
    }).length;
    setBillMode(weekCount >= HIGH_VOLUME_WEEKLY ? "today" : "pending");
  };

  const applyFilter = () => {
    if (!selectedVendor) return;
    let f = orders.filter((o) => o.vendorId?._id === selectedVendor._id);
    if (filterDate) {
      if (filterType === "daily") {
        f = f.filter(
          (o) =>
            new Date(o.createdAt).toDateString() ===
            new Date(filterDate).toDateString(),
        );
      } else {
        const { start, end } = getWeekRange(filterDate);
        f = f.filter(
          (o) => new Date(o.createdAt) >= start && new Date(o.createdAt) <= end,
        );
      }
    }
    setFilteredOrders(f);
  };

  const resetFilter = () => {
    if (!selectedVendor) return;
    setFilteredOrders(
      orders.filter((o) => o.vendorId?._id === selectedVendor._id),
    );
    setFilterDate("");
    setFilterType("daily");
  };

  /* ── Billing derivations for the open vendor ── */
  const vendorAll = selectedVendor
    ? orders.filter((o) => o.vendorId?._id === selectedVendor._id)
    : [];
  const vendorToday = vendorAll.filter((o) =>
    isSameDay(o.createdAt, new Date()),
  );
  const vendorWeekCount = vendorAll.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= wStart && d <= wEnd;
  }).length;
  const isHighVolume = vendorWeekCount >= HIGH_VOLUME_WEEKLY;

  const billOrders = billMode === "today" ? vendorToday : vendorAll;
  const billMessage = buildBillMessage(billOrders, billMode);
  const billSplit = rateSplit(billOrders);

  const copyBill = async () => {
    try {
      await navigator.clipboard.writeText(billMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — WhatsApp button still works */
    }
  };

  const sendWhatsApp = () => {
    const num = waNumber(vendorPhone(selectedVendor));
    const text = encodeURIComponent(billMessage);
    const url = num
      ? `https://wa.me/${num}?text=${text}`
      : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  };

  /* ═══════════════════════════════════════════════════════════════════════
     ADVANCED ANALYTICS — all derived from existing order data
     ═══════════════════════════════════════════════════════════════════════ */

  // Lifetime / business snapshot ------------------------------------------------
  const ordersByDate = [...orders].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );
  const startDate = ordersByDate[0]
    ? new Date(ordersByDate[0].createdAt)
    : null;
  const daysLive = startDate
    ? Math.max(1, Math.round((Date.now() - startDate.getTime()) / 86400000))
    : 0;
  const lifetimeGross = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const lifetimeCommission = commissionForOrders(orders);
  const lifetimeAOV = orders.length
    ? Math.round(lifetimeGross / orders.length)
    : 0;
  const ordersPerDay = daysLive ? (orders.length / daysLive).toFixed(1) : "0";

  // Customers (phone dedup) -----------------------------------------------------
  const custMap = {};
  orders.forEach((o) => {
    const k = custKey(o);
    if (!k) return;
    custMap[k] = (custMap[k] || 0) + 1;
  });
  const uniqueCustomers = Object.keys(custMap).length;
  const repeatCustomers = Object.values(custMap).filter((c) => c > 1).length;
  const repeatRate = uniqueCustomers
    ? Math.round((repeatCustomers / uniqueCustomers) * 100)
    : 0;
  const ordersPerCustomer = uniqueCustomers
    ? (orders.length / uniqueCustomers).toFixed(1)
    : "0";

  // Busiest single day ever -----------------------------------------------------
  const dayMap = {};
  orders.forEach((o) => {
    const k = new Date(o.createdAt).toDateString();
    dayMap[k] = (dayMap[k] || 0) + 1;
  });
  const busiestDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];

  // Momentum: this week vs last week -------------------------------------------
  const lw = getWeekRange(new Date(Date.now() - 7 * 86400000));
  const lastWeekOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= lw.start && d <= lw.end;
  });
  const wRev = weekOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const lwRev = lastWeekOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const wCom = commissionForOrders(weekOrders);
  const lwCom = commissionForOrders(lastWeekOrders);
  const momentum = [
    {
      label: "Orders",
      value: weekOrders.length,
      delta: pct(weekOrders.length, lastWeekOrders.length),
      money: false,
    },
    { label: "Revenue", value: wRev, delta: pct(wRev, lwRev), money: true },
    { label: "Commission", value: wCom, delta: pct(wCom, lwCom), money: true },
  ];

  // Four-week order counts, per vendor ------------------------------------------
  // Counting orders only — not revenue, and not restricted to paid — so the
  // numbers answer "who is busy" rather than "who earned".
  //
  // Weeks are held as a list rather than named fields so the count is one
  // number to change, and so the table header and the row cells can never
  // drift out of step with the buckets they describe.
  const weekBuckets = Array.from({ length: weeksShown }, (_, i) => {
    const { start, end } = getWeekRange(
      new Date(Date.now() - i * 7 * 86400000),
    );
    return {
      start,
      end,
      label: i === 0 ? "This week" : i === 1 ? "Last week" : `${i} weeks ago`,
      // Beyond a couple of weeks "5 weeks ago" stops locating anything, so the
      // date the week began goes underneath it.
      sub:
        i < 2
          ? null
          : start.toLocaleDateString("en-NG", {
              day: "numeric",
              month: "short",
            }),
    };
  });

  const zeroes = () => Array(weeksShown).fill(0);
  const weeklyByVendor = new Map();
  const weeklyTotals = zeroes();
  // An order whose vendor has since been deleted still happened, and still
  // belongs in the platform total — but it has no row to sit in. Counted
  // separately so the column adds up instead of quietly losing orders.
  const weeklyUnattributed = zeroes();

  // One pass over orders rather than a filter per vendor per week: that would
  // be 4N scans of a list holding every order the platform has ever taken.
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const i = weekBuckets.findIndex((b) => d >= b.start && d <= b.end);
    if (i === -1) return;

    weeklyTotals[i] += 1;

    const id = o.vendorId?._id;
    if (!id) {
      weeklyUnattributed[i] += 1;
      return;
    }

    if (!weeklyByVendor.has(id)) weeklyByVendor.set(id, zeroes());
    weeklyByVendor.get(id)[i] += 1;
  });

  // A vendor can also be gone from the vendors list while its orders remain,
  // which would drop them from the rows below without dropping them from the
  // total. Fold those in with the genuinely vendorless ones.
  const knownVendorIds = new Set(vendors.map((v) => v._id));
  weeklyByVendor.forEach((counts, id) => {
    if (knownVendorIds.has(id)) return;
    counts.forEach((n, i) => (weeklyUnattributed[i] += n));
  });

  const unattributedTotal = weeklyUnattributed.reduce((s, n) => s + n, 0);

  const weeklyRows = vendors
    .map((v) => {
      const counts = weeklyByVendor.get(v._id) || zeroes();
      return {
        id: v._id,
        name: v.businessName || v.fullname || "Unnamed vendor",
        counts,
        total: counts.reduce((s, n) => s + n, 0),
      };
    })
    .sort((a, b) => b.counts[0] - a.counts[0] || b.total - a.total);

  const activeWeeklyRows = weeklyRows.filter((r) => r.total > 0);
  const inactiveWeeklyCount = weeklyRows.length - activeWeeklyRows.length;
  const visibleWeeklyRows = showInactiveVendors ? weeklyRows : activeWeeklyRows;

  // Monthly growth + cumulative -------------------------------------------------
  const monthMap = {};
  orders.forEach((o) => {
    const d = new Date(o.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
    if (!monthMap[key])
      monthMap[key] = {
        label: d.toLocaleDateString("en-US", { month: "short" }),
        orders: 0,
        revenue: 0,
        ts: new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
      };
    monthMap[key].orders += 1;
    monthMap[key].revenue += o.totalAmount || 0;
  });
  const monthly = Object.values(monthMap)
    .sort((a, b) => a.ts - b.ts)
    .slice(-6);
  let run = 0;
  const cumulative = monthly.map((m) => {
    run += m.orders;
    return { label: m.label, total: run };
  });

  // Run-rate projection (this month) -------------------------------------------
  const now = new Date();
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate();
  const dayOfMonth = now.getDate();
  const monthOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    return (
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    );
  });
  const monthCommission = commissionForOrders(monthOrders);
  const projOrders = Math.round(
    (monthOrders.length / dayOfMonth) * daysInMonth,
  );
  const projCommission = Math.round(
    (monthCommission / dayOfMonth) * daysInMonth,
  );

  // Range-based block -----------------------------------------------------------
  const inRange = (o) => {
    const d = new Date(o.createdAt);
    if (analyticsRange === "today") return isSameDay(d, new Date());
    if (analyticsRange === "week") return d >= wStart && d <= wEnd;
    if (analyticsRange === "month")
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    return true;
  };
  const rangeOrders = orders.filter(inRange);
  const rangeGross = rangeOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const rangeOwed = commissionForOrders(rangeOrders);
  const rangeSplit = rateSplit(rangeOrders);

  const vendorLeaderboard = vendors
    .map((v) => {
      const vo = rangeOrders.filter((o) => o.vendorId?._id === v._id);
      return {
        vendor: v,
        count: vo.length,
        owed: commissionForOrders(vo),
        gross: vo.reduce((s, o) => s + (o.totalAmount || 0), 0),
      };
    })
    .filter((x) => x.count > 0)
    .sort((a, b) => b.owed - a.owed);

  const dowData = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
    (name, i) => ({
      name,
      orders: rangeOrders.filter((o) => new Date(o.createdAt).getDay() === i)
        .length,
    }),
  );
  const dowMax = Math.max(...dowData.map((d) => d.orders), 0);

  const hours = Array.from({ length: 24 }).map((_, h) => ({
    label: `${h % 12 || 12}${h < 12 ? "a" : "p"}`,
    orders: rangeOrders.filter((o) => new Date(o.createdAt).getHours() === h)
      .length,
  }));
  const hourMax = Math.max(...hours.map((h) => h.orders), 0);
  const peakHour = hours.reduce(
    (a, b) => (b.orders > a.orders ? b : a),
    hours[0],
  );

  const rangeLabel = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    all: "All Time",
  }[analyticsRange];

  const statCards = [
    {
      label: "Total Vendors",
      value: vendors.length,
      icon: Users,
      iconClass: "bg-blue-50 text-blue-500",
      primary: false,
    },
    {
      label: "Orders This Week",
      value: totalOrders,
      icon: ShoppingBag,
      iconClass: "bg-[#AE2108]/8 text-[#AE2108]",
      primary: true,
    },
    {
      label: "Weekly Revenue",
      value: `₦${totalRevenue.toLocaleString()}`,
      icon: Wallet,
      iconClass: "bg-emerald-50 text-emerald-600",
      primary: false,
    },
    {
      label: "Avg Daily Orders",
      value: avgDaily,
      icon: TrendingUp,
      iconClass: "bg-amber-50 text-amber-500",
      primary: false,
    },
    {
      label: "Our Commission",
      value: `₦${totalCommission.toLocaleString()}`,
      icon: ArrowUpRight,
      iconClass: "bg-purple-50 text-purple-500",
      primary: false,
    },
  ];

  return (
    <AdminLayout
      title="Analytics"
      subtitle={`Week of ${wStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${wEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}
    >
      <div className="px-5 py-6 max-w-7xl mx-auto space-y-6">
        {/* ── Welcome banner ── */}
        <div className="relative overflow-hidden rounded-2xl bg-[#AE2108] px-6 py-5 shadow-lg shadow-[#AE2108]/15">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-10 -bottom-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-36 top-2 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-white/60 text-xs font-medium mb-0.5">
                Platform Overview
              </p>
              <h2 className="text-white text-lg font-bold leading-tight">
                {loading
                  ? "Loading data…"
                  : `${totalOrders} orders · ₦${totalRevenue.toLocaleString()} revenue`}
              </h2>
              <p className="text-white/60 text-xs mt-1.5">
                Sunday–Saturday · Commission ₦{totalCommission.toLocaleString()}{" "}
                this week
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-xl">
              <Calendar size={13} className="text-white/70" />
              <span className="text-white text-xs font-semibold">
                This Week
              </span>
            </div>
          </div>
        </div>

        {/* ── pricing notice ── */}
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <TrendingUp size={15} className="text-amber-600" />
          </div>
          <p className="text-xs text-amber-800">
            Commission is now{" "}
            <span className="font-bold">₦{NEW_RATE}/order</span> from{" "}
            {RATE_CHANGE_DATE.toLocaleDateString("en-NG", {
              month: "long",
              day: "numeric",
            })}
            . Orders before that still bill at ₦{OLD_RATE}, so mixed periods are
            split automatically.
          </p>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {statCards.map(({ label, value, icon: Icon, iconClass, primary }) => (
            <div
              key={label}
              className={`relative overflow-hidden rounded-2xl p-4 border transition-all hover:-translate-y-0.5 hover:shadow-lg
                  ${primary ? "bg-[#AE2108] border-[#AE2108] shadow-[0_4px_24px_rgba(174,33,8,0.2)]" : "bg-white border-gray-100 shadow-sm"}`}
            >
              {primary && (
                <>
                  <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
                  <div className="absolute -right-1 bottom-0 w-12 h-12 rounded-full bg-white/5 pointer-events-none" />
                </>
              )}
              <div className="relative flex items-start justify-between mb-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${primary ? "bg-white/20" : iconClass}`}
                >
                  <Icon size={16} className={primary ? "text-white" : ""} />
                </div>
              </div>
              <p
                className={`text-xl font-bold mb-0.5 ${primary ? "text-white" : "text-gray-900"}`}
              >
                {value}
              </p>
              <p
                className={`text-[10px] font-medium ${primary ? "text-white/70" : "text-gray-400"}`}
              >
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Weekly chart ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Orders & Revenue
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Sun → Sat this week
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#AE2108]" />
                <span className="text-[10px] text-gray-500 font-medium">
                  Orders
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-gray-500 font-medium">
                  Revenue
                </span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={analyticsData}
                margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#AE2108" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#AE2108" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="orders"
                  stroke="#AE2108"
                  strokeWidth={2}
                  fill="url(#gradOrders)"
                  name="Orders"
                  dot={{ r: 3, fill: "#AE2108" }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#gradRevenue)"
                  name="Revenue (₦)"
                  dot={{ r: 3, fill: "#10b981" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ═════════════════════ BUSINESS SNAPSHOT (all-time) ═════════════════════ */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-[#AE2108]" />
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Business Snapshot · All Time
              </p>
            </div>
            {startDate && (
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                Live since{" "}
                {startDate.toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                · {daysLive} days
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Tile
              icon={ShoppingBag}
              label="Lifetime Orders"
              value={orders.length.toLocaleString()}
              sub={`${ordersPerDay} / day avg`}
              accent="bg-[#AE2108]/8 text-[#AE2108]"
            />
            <Tile
              icon={Wallet}
              label="Lifetime Revenue"
              value={`₦${lifetimeGross.toLocaleString()}`}
              sub={`₦${lifetimeAOV.toLocaleString()} avg order`}
              accent="bg-emerald-50 text-emerald-600"
            />
            <Tile
              icon={ArrowUpRight}
              label="Commission Earned"
              value={`₦${lifetimeCommission.toLocaleString()}`}
              sub="all vendors, all time"
              accent="bg-purple-50 text-purple-500"
            />
            <Tile
              icon={Users}
              label="Unique Customers"
              value={uniqueCustomers.toLocaleString()}
              sub={`${ordersPerCustomer} orders each`}
              accent="bg-blue-50 text-blue-500"
            />
            <Tile
              icon={Repeat}
              label="Repeat Rate"
              value={`${repeatRate}%`}
              sub={`${repeatCustomers} returning`}
              accent="bg-amber-50 text-amber-500"
            />
            <Tile
              icon={CalendarDays}
              label="Business Start"
              value={
                startDate
                  ? startDate.toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"
              }
              sub={`${daysLive} days operating`}
              accent="bg-rose-50 text-rose-500"
            />
            <Tile
              icon={Flame}
              label="Busiest Day Ever"
              value={busiestDay ? `${busiestDay[1]} orders` : "—"}
              sub={
                busiestDay
                  ? new Date(busiestDay[0]).toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : ""
              }
              accent="bg-orange-50 text-orange-500"
            />
            <Tile
              icon={Activity}
              label="Avg Order Value"
              value={`₦${lifetimeAOV.toLocaleString()}`}
              sub="across all orders"
              accent="bg-teal-50 text-teal-600"
            />
          </div>
        </div>

        {/* ═════════════════════ MOMENTUM (WoW) ═════════════════════ */}
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Momentum · this week vs last
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {momentum.map((m) => {
              const up = m.delta >= 0;
              return (
                <div
                  key={m.label}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between"
                >
                  <div>
                    <p className="text-[11px] text-gray-400 font-medium mb-1">
                      {m.label} this week
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {m.money ? `₦${m.value.toLocaleString()}` : m.value}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold ${
                      up
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-500"
                    }`}
                  >
                    {up ? (
                      <ArrowUpRight size={14} />
                    ) : (
                      <ArrowDownRight size={14} />
                    )}
                    {Math.abs(m.delta)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ═════════════════════ GROWTH OVER TIME ═════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Monthly orders + revenue */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              Monthly Growth
            </h3>
            <p className="text-[11px] text-gray-400 mb-4">
              Last {monthly.length} months
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthly}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gMonth" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#AE2108"
                        stopOpacity={0.15}
                      />
                      <stop offset="95%" stopColor="#AE2108" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stroke="#AE2108"
                    strokeWidth={2}
                    fill="url(#gMonth)"
                    name="Orders"
                    dot={{ r: 3, fill: "#AE2108" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cumulative curve */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-1">
              Cumulative Orders
            </h3>
            <p className="text-[11px] text-gray-400 mb-4">
              Total orders growing over time
            </p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={cumulative}
                  margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gCum" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="#10b981"
                        stopOpacity={0.18}
                      />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#gCum)"
                    name="Total orders"
                    dot={{ r: 3, fill: "#10b981" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ═════════════════════ PEAK HOURS + PROJECTION ═════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Peak hours */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-[#AE2108]" />
                <h3 className="text-sm font-bold text-gray-900">Peak Hours</h3>
              </div>
              {hourMax > 0 && (
                <span className="text-[11px] font-semibold text-[#AE2108] bg-[#AE2108]/8 px-2.5 py-1 rounded-full">
                  Busiest: {peakHour.label} ({peakHour.orders})
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mb-4">
              When orders come in ({rangeLabel.toLowerCase()})
            </p>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={hours}
                  margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 9, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    interval={1}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#9ca3af" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: "#f9fafb" }}
                  />
                  <Bar dataKey="orders" name="Orders" radius={[4, 4, 0, 0]}>
                    {hours.map((h, i) => (
                      <Cell
                        key={i}
                        fill={
                          h.orders === hourMax && hourMax > 0
                            ? "#AE2108"
                            : "#f0c4bc"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Run-rate projection */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Rocket size={15} className="text-[#AE2108]" />
              <h3 className="text-sm font-bold text-gray-900">
                {now.toLocaleDateString("en-US", { month: "long" })} Projection
              </h3>
            </div>
            <p className="text-[11px] text-gray-400 mb-4">
              Day {dayOfMonth} of {daysInMonth} · current run-rate
            </p>

            <div className="space-y-3 flex-1">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-gray-400 font-medium">
                    Orders
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {monthOrders.length} so far
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  ≈ {projOrders.toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  projected month-end
                </p>
              </div>

              <div className="bg-[#AE2108]/5 border border-[#AE2108]/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] text-[#AE2108]/70 font-medium">
                    Commission
                  </p>
                  <p className="text-[11px] text-[#AE2108]/70">
                    ₦{monthCommission.toLocaleString()} so far
                  </p>
                </div>
                <p className="text-2xl font-bold text-[#AE2108]">
                  ≈ ₦{projCommission.toLocaleString()}
                </p>
                <p className="text-[10px] text-[#AE2108]/60 mt-0.5">
                  projected to earn this month
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ═════════════════════ RANGE-BASED BLOCK ═════════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Breakdown Explorer
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {rangeLabel} · {rangeOrders.length} orders
              </p>
            </div>
            <div className="flex items-center gap-1 bg-white border border-gray-100 shadow-sm rounded-xl p-1">
              {[
                { k: "today", l: "Today" },
                { k: "week", l: "Week" },
                { k: "month", l: "Month" },
                { k: "all", l: "All" },
              ].map(({ k, l }) => (
                <button
                  key={k}
                  onClick={() => setAnalyticsRange(k)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    analyticsRange === k
                      ? "bg-[#AE2108] text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* range KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-[10px] text-gray-400 font-medium mb-1">
                Gross Revenue
              </p>
              <p className="text-xl font-bold text-gray-900">
                ₦{rangeGross.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-[10px] text-gray-400 font-medium mb-1">
                Commission Owed
              </p>
              <p className="text-xl font-bold text-[#AE2108]">
                ₦{rangeOwed.toLocaleString()}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 col-span-2 lg:col-span-1">
              <p className="text-[10px] text-gray-400 font-medium mb-1">
                Rate Split
              </p>
              <p className="text-sm font-bold text-gray-900">
                {rangeSplit.old}{" "}
                <span className="text-gray-400 font-medium">@ ₦{OLD_RATE}</span>
                <span className="text-gray-300 mx-1.5">·</span>
                {rangeSplit.neu}{" "}
                <span className="text-gray-400 font-medium">@ ₦{NEW_RATE}</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Leaderboard — who owes most */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Crown size={15} className="text-[#AE2108]" />
                  <h3 className="text-sm font-bold text-gray-900">
                    Commission Owed — by vendor
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                  Bill priority
                </span>
              </div>
              {vendorLeaderboard.length === 0 ? (
                <div className="py-10 text-center text-sm text-gray-400">
                  No orders in this range
                </div>
              ) : (
                <div className="divide-y divide-gray-50 max-h-[360px] overflow-y-auto">
                  {vendorLeaderboard.map((row, i) => (
                    <div
                      key={row.vendor._id}
                      className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/70 transition-colors"
                    >
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0 ${
                          i === 0
                            ? "bg-[#AE2108] text-white"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {row.vendor.businessName}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {row.count} orders · ₦{row.gross.toLocaleString()}{" "}
                          gross
                        </p>
                      </div>
                      <p className="text-sm font-bold text-[#AE2108] flex-shrink-0">
                        ₦{row.owed.toLocaleString()}
                      </p>
                      <button
                        onClick={() => openVendorModal(row.vendor)}
                        className="flex-shrink-0 text-[11px] font-semibold text-gray-600 bg-gray-100 hover:bg-[#AE2108] hover:text-white px-3 py-1.5 rounded-lg transition"
                      >
                        Bill
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Orders by day of week */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-1">
                Orders by Day
              </h3>
              <p className="text-[11px] text-gray-400 mb-4">
                {rangeLabel} distribution
              </p>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dowData}
                    margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#f0f0f0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#9ca3af" }}
                      axisLine={false}
                      tickLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: "#f9fafb" }}
                    />
                    <Bar dataKey="orders" name="Orders" radius={[6, 6, 0, 0]}>
                      {dowData.map((d, i) => (
                        <Cell
                          key={i}
                          fill={
                            d.orders === dowMax && dowMax > 0
                              ? "#AE2108"
                              : "#f0c4bc"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* ── Weekly order counts, per vendor ── */}
        <div>
          <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Orders by week
            </p>
            <div className="flex items-center gap-3">
              {inactiveWeeklyCount > 0 && (
                <button
                  onClick={() => setShowInactiveVendors((v) => !v)}
                  className="text-[10px] font-bold text-[#AE2108] hover:underline"
                >
                  {showInactiveVendors
                    ? "Hide inactive"
                    : `Show ${inactiveWeeklyCount} inactive`}
                </button>
              )}
              <select
                value={weeksShown}
                onChange={(e) => setWeeksShown(Number(e.target.value))}
                className="border border-gray-200 bg-white rounded-lg px-2.5 py-1 text-[11px] font-semibold text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#AE2108]/20"
                aria-label="Number of weeks to show"
              >
                {[4, 6, 8, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} weeks
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Vendor
                    </th>
                    {weekBuckets.map((b, i) => (
                      <th
                        key={b.label}
                        className={`py-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right whitespace-nowrap ${
                          i === weekBuckets.length - 1 ? "px-5" : "px-4"
                        }`}
                      >
                        {b.label}
                        {/* Two days measured against full weeks reads as a
                            collapse in orders unless it says so. */}
                        {(i === 0 || b.sub) && (
                          <span className="block font-medium normal-case tracking-normal text-gray-300">
                            {i === 0 ? "so far" : b.sub}
                          </span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleWeeklyRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={weekBuckets.length + 1}
                        className="px-5 py-8 text-center text-xs text-gray-400"
                      >
                        No orders in the last {weeksShown} weeks.
                      </td>
                    </tr>
                  ) : (
                    visibleWeeklyRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#AE2108]/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-[#AE2108] font-black text-[10px]">
                                {row.name.slice(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-gray-800 truncate max-w-[180px]">
                              {row.name}
                            </span>
                          </div>
                        </td>
                        {row.counts.map((n, i) => (
                          <td
                            key={i}
                            className={`py-3 text-right text-sm tabular-nums ${
                              i === 0
                                ? "font-bold text-gray-900"
                                : "text-gray-500"
                            } ${i === row.counts.length - 1 ? "px-5" : "px-4"}`}
                          >
                            {n}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}

                  {unattributedTotal > 0 && (
                    <tr className="border-b border-gray-50 last:border-0 bg-amber-50/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-gray-500 font-black text-[10px]">
                              ?
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-gray-500 italic">
                            Deleted or unknown vendor
                          </span>
                        </div>
                      </td>
                      {weeklyUnattributed.map((n, i) => (
                        <td
                          key={i}
                          className={`py-3 text-right text-sm text-gray-500 tabular-nums ${
                            i === weeklyUnattributed.length - 1
                              ? "px-5"
                              : "px-4"
                          }`}
                        >
                          {n}
                        </td>
                      ))}
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-100">
                    <td className="px-5 py-3 text-xs font-black text-gray-700 uppercase tracking-wide">
                      Platform total
                    </td>
                    {weeklyTotals.map((n, i) => (
                      <td
                        key={i}
                        className={`py-3 text-right text-sm tabular-nums ${
                          i === 0
                            ? "font-black text-[#AE2108]"
                            : "font-bold text-gray-700"
                        } ${i === weeklyTotals.length - 1 ? "px-5" : "px-4"}`}
                      >
                        {n}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <p className="text-[10px] text-gray-400 mt-2">
            Weeks run Sunday to Saturday. This week is still in progress, so it
            counts fewer days than the ones beside it.
          </p>
        </div>

        {/* ── Vendor cards ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Vendor Breakdown
            </p>
            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
              {vendors.length} vendors
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map((vendor) => {
              const vOrders = orders.filter(
                (o) => o.vendorId?._id === vendor._id,
              );
              const gross = vOrders.reduce(
                (s, o) => s + (o.totalAmount || 0),
                0,
              );
              const commission = commissionForOrders(vOrders);
              const net = gross - commission;

              return (
                <div
                  key={vendor._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#AE2108]/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#AE2108] font-black text-xs">
                          {vendor.businessName?.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 truncate max-w-[140px]">
                          {vendor.businessName}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${vendor.status === "opened" ? "bg-emerald-400" : "bg-gray-300"}`}
                          />
                          <p className="text-[10px] text-gray-400 capitalize">
                            {vendor.status || "active"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                      {vOrders.length} orders
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      {
                        label: "Gross",
                        value: `₦${gross.toLocaleString()}`,
                        color: "text-gray-900",
                      },
                      {
                        label: "Commission",
                        value: `₦${commission.toLocaleString()}`,
                        color: "text-[#AE2108]",
                      },
                      {
                        label: "Net",
                        value: `₦${net.toLocaleString()}`,
                        color: "text-emerald-600",
                      },
                    ].map(({ label, value, color }) => (
                      <div
                        key={label}
                        className="bg-gray-50 rounded-xl p-2.5 text-center"
                      >
                        <p
                          className={`text-xs font-bold ${color} leading-tight`}
                        >
                          {value}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-0.5">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => openVendorModal(vendor)}
                    className="w-full flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-[#AE2108] hover:text-white text-gray-600 text-xs font-semibold px-3 py-2.5 rounded-xl transition-all duration-200 group"
                  >
                    View & Bill
                    <ChevronRight
                      size={12}
                      className="group-hover:translate-x-0.5 transition-transform"
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Vendor orders modal ── */}
      {modalOpen && selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {selectedVendor.businessName}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {filteredOrders.length} orders shown
                  </p>
                </div>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    isHighVolume
                      ? "bg-[#AE2108]/8 text-[#AE2108]"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {isHighVolume ? "High volume" : "Accumulating"}
                </span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
              >
                <X size={14} className="text-gray-500" />
              </button>
            </div>

            {/* Bill panel */}
            <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0 bg-gray-50/50">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Generate Bill
                </p>
                <div className="flex items-center gap-1 bg-white border border-gray-100 rounded-lg p-0.5">
                  {[
                    { k: "today", l: "Today's summary" },
                    { k: "pending", l: "All pending" },
                  ].map(({ k, l }) => (
                    <button
                      key={k}
                      onClick={() => {
                        setBillMode(k);
                        setCopied(false);
                      }}
                      className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition ${
                        billMode === k
                          ? "bg-[#AE2108] text-white"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <div className="sm:col-span-3 bg-white rounded-xl border border-gray-100 p-4">
                  <pre className="text-[13px] leading-relaxed text-gray-800 whitespace-pre-wrap font-sans">
                    {billMessage}
                  </pre>
                  {billSplit.old > 0 && billSplit.neu > 0 && (
                    <p className="mt-3 pt-3 border-t border-gray-50 text-[11px] text-gray-400">
                      Split: {billSplit.old} @ ₦{OLD_RATE} + {billSplit.neu} @ ₦
                      {NEW_RATE}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2 flex flex-col gap-2">
                  <div className="bg-white rounded-xl border border-gray-100 p-3 text-center">
                    <p className="text-2xl font-bold text-[#AE2108]">
                      ₦{commissionForOrders(billOrders).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {billOrders.length} orders ·{" "}
                      {billMode === "today" ? "today" : "all pending"}
                    </p>
                  </div>
                  <button
                    onClick={sendWhatsApp}
                    className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1eb955] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                  >
                    <MessageCircle size={15} /> WhatsApp
                  </button>
                  <button
                    onClick={copyBill}
                    className="flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold px-4 py-2.5 rounded-xl transition"
                  >
                    {copied ? (
                      <>
                        <Check size={15} className="text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy size={15} /> Copy
                      </>
                    )}
                  </button>
                  {!vendorPhone(selectedVendor) && (
                    <p className="text-[10px] text-gray-400 text-center leading-tight">
                      No phone on file — WhatsApp opens with the message ready
                      to paste.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2 flex-shrink-0">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-200 text-sm px-3 py-1.5 rounded-xl text-gray-700 focus:outline-none focus:border-[#AE2108] bg-gray-50"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly (Sun–Sat)</option>
              </select>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border border-gray-200 text-sm px-3 py-1.5 rounded-xl text-gray-700 focus:outline-none focus:border-[#AE2108] bg-gray-50"
              />
              <button
                onClick={applyFilter}
                className="px-4 py-1.5 bg-[#AE2108] text-white text-xs font-semibold rounded-xl hover:bg-[#941B06] transition"
              >
                Filter
              </button>
              <button
                onClick={resetFilter}
                className="px-4 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-200 transition"
              >
                Reset
              </button>

              {filteredOrders.length > 0 && (
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    Total:{" "}
                    <span className="font-bold text-gray-900">
                      ₦
                      {filteredOrders
                        .reduce((s, o) => s + (o.totalAmount || 0), 0)
                        .toLocaleString()}
                    </span>
                  </span>
                  <span className="text-xs text-gray-500">
                    Commission:{" "}
                    <span className="font-bold text-[#AE2108]">
                      ₦{commissionForOrders(filteredOrders).toLocaleString()}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {filteredOrders.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {[
                        "#",
                        "Customer",
                        "Items",
                        "Gross",
                        "Net",
                        "Status",
                        "Payment",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-3 pr-4"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredOrders.map((order, idx) => (
                      <tr
                        key={order._id}
                        className="hover:bg-gray-50/70 transition-colors"
                      >
                        <td className="py-3 pr-4 text-xs text-gray-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-3 pr-4 text-xs font-semibold text-gray-900">
                          {order.guestInfo?.name ||
                            order.customerId?.email ||
                            order.guestInfo?.phone ||
                            "Guest"}
                        </td>
                        <td className="py-3 pr-4 text-xs text-gray-500 max-w-[180px] truncate">
                          {order.items
                            ?.map((i) => `${i.name} ×${i.quantity}`)
                            .join(", ")}
                        </td>
                        <td className="py-3 pr-4 text-xs font-bold text-gray-900">
                          ₦{order.totalAmount?.toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 text-xs font-bold text-emerald-600">
                          ₦
                          {(
                            order.totalAmount - commissionForOrder(order)
                          ).toLocaleString()}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                              order.status === "completed"
                                ? "bg-emerald-50 text-emerald-700"
                                : order.status === "cancelled"
                                  ? "bg-red-50 text-red-600"
                                  : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                              order.paymentStatus === "paid"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {order.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-14 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#AE2108]/5 border border-[#AE2108]/10 flex items-center justify-center mb-3">
                    <ShoppingBag size={22} className="text-[#AE2108]/40" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">
                    No orders found
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try adjusting the filter or reset to see all orders
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
