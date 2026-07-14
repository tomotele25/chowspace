import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Search,
  Phone,
  MapPin,
  Bike,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/router";
import axios from "axios";

const BACKENDURL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://chowspace-backend.vercel.app";

// One clear step at a time. Each status knows the single next action.
const STATUS = {
  pending: {
    label: "New order",
    accent: "#AE2108",
    tint: "bg-[#AE2108]/10 text-[#AE2108]",
    next: "preparing",
    action: "Start preparing",
  },
  preparing: {
    label: "Preparing",
    accent: "#D97706",
    tint: "bg-amber-100 text-amber-700",
    next: "ready",
    action: "Mark as ready",
  },
  ready: {
    label: "Ready",
    accent: "#059669",
    tint: "bg-emerald-100 text-emerald-700",
    next: "completed",
    action: "Mark as done",
  },
  completed: {
    label: "Done",
    accent: "#94A3B8",
    tint: "bg-slate-100 text-slate-500",
    next: null,
    action: null,
  },
  cancelled: {
    label: "Cancelled",
    accent: "#E11D48",
    tint: "bg-rose-100 text-rose-600",
    next: null,
    action: null,
  },
};

function normaliseStatus(raw) {
  const s = (raw || "").toString().toLowerCase();
  if (
    ["confirmed", "accepted", "preparing", "cooking", "in_progress"].includes(s)
  )
    return "preparing";
  if (["ready", "ready_for_pickup", "prepared"].includes(s)) return "ready";
  if (["completed", "delivered", "done", "fulfilled"].includes(s))
    return "completed";
  if (["cancelled", "canceled", "rejected"].includes(s)) return "cancelled";
  return "pending";
}

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

function naira(n) {
  return "\u20A6" + Number(n || 0).toLocaleString();
}

// Presets ("all"/"today"/"yesterday"/"week") or a specific "YYYY-MM-DD".
function inDateRange(date, filter) {
  if (filter === "all") return true;
  const d = new Date(date);
  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  if (filter === "today") return d >= startOfToday;
  if (filter === "yesterday") {
    const startYesterday = new Date(startOfToday);
    startYesterday.setDate(startYesterday.getDate() - 1);
    return d >= startYesterday && d < startOfToday;
  }
  if (filter === "week") {
    const weekAgo = new Date(startOfToday);
    weekAgo.setDate(weekAgo.getDate() - 6); // last 7 days incl. today
    return d >= weekAgo;
  }
  // specific day picked from the calendar
  const start = new Date(filter + "T00:00:00");
  if (isNaN(start)) return true;
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return d >= start && d < end;
}

function OrderTicket({ order, status, onAdvance, onCancel, updating }) {
  const s = STATUS[status];
  const name = order.guestInfo?.name || order.customerId?.fullname || "Guest";
  const phone = order.guestInfo?.phone || order.customerId?.phone;
  const address = order.guestInfo?.address || order.deliveryAddress;
  const isDelivery = !!address || order.orderType === "delivery";

  return (
    <div
      className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100"
      style={{ borderTop: `4px solid ${s.accent}` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4">
        <div>
          <p className="text-lg font-bold tracking-tight text-gray-900">
            #{order._id.slice(-6).toUpperCase()}
          </p>
          <p className="text-xs text-gray-400">{timeAgo(order.createdAt)}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${s.tint}`}
        >
          {s.label}
        </span>
      </div>

      {/* Customer */}
      <div className="px-5 pt-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
          {isDelivery ? (
            <Bike size={15} className="text-gray-400" />
          ) : (
            <ShoppingBag size={15} className="text-gray-400" />
          )}
          {name}
          <span className="text-xs font-normal text-gray-400">
            {"\u00B7"} {isDelivery ? "Delivery" : "Pickup"}
          </span>
        </div>
        {phone && (
          <a
            href={`tel:${phone}`}
            onClick={(e) => e.stopPropagation()}
            className="mt-1 flex w-fit items-center gap-1.5 text-sm text-gray-500 hover:text-[#AE2108]"
          >
            <Phone size={13} />
            {phone}
          </a>
        )}
        {address && (
          <p className="mt-1 flex items-start gap-1.5 text-sm text-gray-500">
            <MapPin size={13} className="mt-0.5 shrink-0" />
            {address}
          </p>
        )}
      </div>

      {/* Full order - everything the customer got */}
      <div className="mx-5 my-4 rounded-xl bg-gray-50 px-4 py-3">
        <ul className="space-y-2.5">
          {order.items.map((item, i) => {
            const qty = item.quantity || 1;
            const line = item.price != null ? item.price * qty : null;
            const extras =
              item.options || item.addons || item.extras || item.note;
            return (
              <li key={i}>
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-gray-900">
                    {qty}
                    {"\u00D7"}
                  </span>
                  <span className="text-gray-800">{item.name}</span>
                  <span className="mx-1 flex-1 translate-y-[-3px] border-b border-dotted border-gray-300" />
                  {line != null && (
                    <span className="tabular-nums text-gray-700">
                      {naira(line)}
                    </span>
                  )}
                </div>
                {extras && (
                  <p className="pl-6 text-xs text-gray-400">
                    {typeof extras === "string"
                      ? extras
                      : Array.isArray(extras)
                        ? extras
                            .map((e) => (typeof e === "string" ? e : e.name))
                            .join(", ")
                        : ""}
                  </p>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-3 flex items-center justify-between border-t border-dashed border-gray-300 pt-3">
          <span className="text-sm font-medium text-gray-500">Total</span>
          <span className="text-lg font-bold text-gray-900">
            {naira(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* Single clear action */}
      {s.next && (
        <div className="flex items-center gap-3 px-5 pb-4">
          <button
            onClick={() => onAdvance(order)}
            disabled={updating}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ backgroundColor: s.accent }}
          >
            {updating && <Loader2 size={16} className="animate-spin" />}
            {s.action}
          </button>
          <button
            onClick={() => onCancel(order)}
            disabled={updating}
            className="rounded-xl px-3 py-3 text-sm text-gray-400 hover:text-rose-500 disabled:opacity-60"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default function OrderTracking() {
  const { data: session, status: authStatus } = useSession();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("active");
  const [dateFilter, setDateFilter] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    const fetchOrders = async () => {
      try {
        const vendorId = session?.user?.vendorId;
        if (!vendorId) {
          setError(
            "We couldn't find your vendor account. Sign in again to continue.",
          );
          return;
        }
        const res = await axios.get(
          `${BACKENDURL}/api/getAllOrders?vendorId=${vendorId}`,
        );
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error(err);
        setError("Orders didn't load. Check your connection and try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [session, authStatus]);

  const changeStatus = async (order, nextStatus) => {
    const id = order._id;
    const prev = order.status;
    setUpdatingId(id);
    setOrders((list) =>
      list.map((o) => (o._id === id ? { ...o, status: nextStatus } : o)),
    );
    try {
      await axios.patch(`${BACKENDURL}/api/updateOrderStatus`, {
        orderId: id,
        status: nextStatus,
      });
    } catch (err) {
      console.error(err);
      setOrders((list) =>
        list.map((o) => (o._id === id ? { ...o, status: prev } : o)),
      );
      setError("That didn't save. Try again in a moment.");
    } finally {
      setUpdatingId(null);
    }
  };

  const advance = (order) => {
    const next = STATUS[normaliseStatus(order.status)].next;
    if (next) changeStatus(order, next);
  };
  const cancel = (order) => changeStatus(order, "cancelled");

  const decorated = useMemo(
    () => orders.map((o) => ({ ...o, _status: normaliseStatus(o.status) })),
    [orders],
  );

  const dateFiltered = useMemo(
    () => decorated.filter((o) => inDateRange(o.createdAt, dateFilter)),
    [decorated, dateFilter],
  );

  const counts = useMemo(() => {
    const c = { active: 0, completed: 0, cancelled: 0 };
    dateFiltered.forEach((o) => {
      if (["pending", "preparing", "ready"].includes(o._status)) c.active += 1;
      else if (c[o._status] !== undefined) c[o._status] += 1;
    });
    return c;
  }, [dateFiltered]);

  const filters = [
    { key: "active", label: "Active", count: counts.active },
    { key: "completed", label: "Done", count: counts.completed },
    { key: "cancelled", label: "Cancelled", count: counts.cancelled },
  ];

  const visible = useMemo(() => {
    const q = search.toLowerCase();
    return dateFiltered
      .filter((o) => {
        const inFilter =
          filter === "active"
            ? ["pending", "preparing", "ready"].includes(o._status)
            : o._status === filter;
        const matches =
          !q ||
          o.guestInfo?.name?.toLowerCase().includes(q) ||
          o.customerId?.fullname?.toLowerCase().includes(q) ||
          o._id.toLowerCase().includes(q);
        return inFilter && matches;
      })
      .sort((a, b) =>
        filter === "active"
          ? new Date(a.createdAt) - new Date(b.createdAt) // oldest waiting first
          : new Date(b.createdAt) - new Date(a.createdAt),
      );
  }, [dateFiltered, filter, search]);

  return (
    <div className="min-h-screen bg-gray-100 px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-[#AE2108] hover:underline"
          >
            <ArrowLeft size={18} />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        </div>

        <div className="relative mb-4">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search customer or order number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 focus:border-[#AE2108] focus:outline-none focus:ring-1 focus:ring-[#AE2108]"
          />
        </div>

        {/* Date filter */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {[
            { key: "all", label: "All time" },
            { key: "today", label: "Today" },
            { key: "yesterday", label: "Yesterday" },
            { key: "week", label: "Last 7 days" },
          ].map((d) => {
            const active = dateFilter === d.key;
            return (
              <button
                key={d.key}
                onClick={() => setDateFilter(d.key)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-gray-900 text-white"
                    : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
                }`}
              >
                {d.label}
              </button>
            );
          })}
          <input
            type="date"
            value={/^\d{4}-\d{2}-\d{2}$/.test(dateFilter) ? dateFilter : ""}
            onChange={(e) => setDateFilter(e.target.value || "all")}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition focus:border-gray-900 focus:outline-none ${
              /^\d{4}-\d{2}-\d{2}$/.test(dateFilter)
                ? "border-gray-900 text-gray-900"
                : "border-gray-200 text-gray-500"
            }`}
          />
        </div>

        <div className="mb-6 flex gap-2">
          {filters.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  active
                    ? "bg-[#AE2108] text-white"
                    : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
                }`}
              >
                {f.label}
                <span
                  className={`rounded-full px-1.5 text-xs ${
                    active ? "bg-white/20" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {f.count}
                </span>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-600 ring-1 ring-rose-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-gray-400">
            <Loader2 size={18} className="animate-spin" /> Loading orders
          </div>
        ) : visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {visible.map((order) => (
              <OrderTicket
                key={order._id}
                order={order}
                status={order._status}
                onAdvance={advance}
                onCancel={cancel}
                updating={updatingId === order._id}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
            <p className="font-medium text-gray-600">
              No orders here right now
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {filter === "active"
                ? "New orders show up here the moment they come in."
                : "Nothing in this list yet."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
