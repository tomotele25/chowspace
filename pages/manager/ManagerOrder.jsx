"use client";

import { BACKENDURL } from "@/lib/api";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import ManagerLayout from "@/components/layouts/ManagerLayout";
import axios from "axios";
import Link from "next/link";
import {
  LayoutDashboard,
  PackageOpen,
  LogOut,
  Menu,
  X,
  UtensilsCrossed,
  Settings,
  MapPin,
  Clock,
  Phone,
  MapPinned,
  Bike,
  AlertCircle,
  CheckCircle2,
  Package,
  Loader2,
  CalendarDays,
  TrendingUp,
  ShoppingBag,
  ChevronDown,
  Flame,
  ChevronRight,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

// ── Status config ─────────────────────────────────────────────────────────────
const S = {
  pending: { label: "Pending", bg: "#FFF3CD", text: "#856404", dot: "#FFC107" },
  assigned: {
    label: "Assigned",
    bg: "#D1ECF1",
    text: "#0C5460",
    dot: "#17A2B8",
  },
  picked_up: {
    label: "Picked Up",
    bg: "#E2D9F3",
    text: "#4A235A",
    dot: "#9B59B6",
  },
  delivered: {
    label: "Delivered",
    bg: "#D4EDDA",
    text: "#155724",
    dot: "#28A745",
  },
  completed: {
    label: "Completed",
    bg: "#D4EDDA",
    text: "#155724",
    dot: "#20C997",
  },
  cancelled: {
    label: "Cancelled",
    bg: "#F8D7DA",
    text: "#721C24",
    dot: "#DC3545",
  },
};

function Tag({ status }) {
  const c = S[status] || S.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider"
      style={{ background: c.bg, color: c.text }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: c.dot }}
      />
      {c.label}
    </span>
  );
}

// ── Payment status badge ──────────────────────────────────────────────────────
const PAY = {
  paid: { bg: "#D1FAE5", text: "#065F46", label: "Paid" },
  pending: { bg: "#FEF3C7", text: "#92400E", label: "Unpaid" },
  failed: { bg: "#FEE2E2", text: "#991B1B", label: "Failed" },
};
function PayBadge({ status }) {
  const c = PAY[status] || PAY.pending;
  return (
    <span
      className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
      style={{ background: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
}

// ── Order Card ────────────────────────────────────────────────────────────────
function OrderCard({ order, disputes, newOrderIds, onAssign, idx }) {
  const [open, setOpen] = useState(false);
  const disp = disputes.find((d) => d.orderId === order._id);
  const isNew = newOrderIds.includes(order._id) && order.status !== "completed";
  const name =
    order.guestInfo?.name?.trim() || order.customerId?.fullname || "Guest";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const time = new Date(order.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const itemsTotal =
    order.items?.reduce((s, i) => s + i.price * i.quantity, 0) || 0;

  const accents = ["#AE2108", "#C44B2B", "#E07B39", "#B5451B", "#963214"];
  const accent = accents[idx % accents.length];

  return (
    <div
      className="relative bg-white rounded-3xl overflow-hidden transition-shadow duration-200 hover:shadow-xl"
      style={{
        boxShadow: isNew
          ? `0 0 0 2px #AE2108, 0 8px 24px #AE210818`
          : "0 2px 12px #0000000a",
      }}
    >
      {/* Top color band */}
      <div className="h-1.5" style={{ background: accent }} />

      {/* NEW badge */}
      {isNew && (
        <div className="absolute top-4 right-4 z-10">
          <span className="bg-[#AE2108] text-white text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
            <Flame size={9} /> New
          </span>
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-base font-black text-white"
            style={{ background: accent }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {/* Use orderId (e.g. CS-578198-C5P) not _id slice */}
              <span className="font-black text-gray-900 text-sm tracking-tight">
                {order.orderId || `#${order._id.slice(-6).toUpperCase()}`}
              </span>
              <Tag status={order.status} />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs text-gray-500 font-semibold truncate">
                {name}
              </p>
              <PayBadge status={order.paymentStatus} />
            </div>
          </div>
          <p className="text-[10px] text-gray-400 font-bold flex-shrink-0 flex items-center gap-1 mt-1">
            <Clock size={10} />
            {time}
          </p>
        </div>

        {/* Price block */}
        <div
          className="rounded-2xl px-4 py-3 mb-4 flex items-center justify-between"
          style={{ background: `${accent}12`, border: `1px solid ${accent}22` }}
        >
          <div>
            <p
              className="text-[9px] font-black uppercase tracking-widest mb-0.5"
              style={{ color: `${accent}99` }}
            >
              Total
            </p>
            <p className="text-2xl font-black text-gray-900">
              ₦{Number(order.totalAmount).toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p
              className="text-[9px] font-black uppercase tracking-widest mb-0.5"
              style={{ color: `${accent}99` }}
            >
              Via
            </p>
            <div className="flex items-center gap-1.5 text-xs font-black text-gray-700 capitalize">
              <Bike size={13} style={{ color: accent }} />
              {order.deliveryMethod || "N/A"}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-1.5 mb-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Phone
              size={11}
              className="flex-shrink-0"
              style={{ color: accent }}
            />
            <span className="font-semibold">
              {order.guestInfo?.phone || "No phone"}
            </span>
          </div>
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <MapPinned
              size={11}
              className="flex-shrink-0 mt-0.5"
              style={{ color: accent }}
            />
            <span className="font-semibold leading-tight">
              {order.guestInfo?.address || "No address"}
            </span>
          </div>
          {order.note?.trim() && (
            <div className="flex items-start gap-2 text-xs text-gray-400 italic">
              <span className="flex-shrink-0 mt-0.5">📝</span>
              <span className="leading-tight">{order.note}</span>
            </div>
          )}
        </div>

        {/* Items accordion */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors mb-3 text-left"
        >
          <span className="flex items-center gap-2 text-xs font-bold text-gray-600">
            <Package size={12} style={{ color: accent }} />
            {order.items?.length || 0} item
            {order.items?.length !== 1 ? "s" : ""}
            <span className="text-gray-400 font-semibold">
              · ₦{itemsTotal.toLocaleString()}
            </span>
          </span>
          <ChevronDown
            size={13}
            className={`text-gray-400 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="mb-3 space-y-1 max-h-40 overflow-y-auto">
            {order.items?.map((item, i) => (
              <div
                key={item._id || i}
                className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 text-xs"
              >
                <span className="text-gray-700 font-semibold truncate pr-2">
                  {item.name}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-gray-400">×{item.quantity}</span>
                  <span className="font-black text-gray-700">
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dispute */}
        {disp?.message && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-3 text-xs text-red-700">
            <AlertCircle size={12} className="flex-shrink-0 mt-0.5" />
            <span className="font-semibold">{disp.message}</span>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => onAssign(order)}
          disabled={order.status !== "pending"}
          className="w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-colors duration-150"
          style={
            order.status === "pending"
              ? {
                  background: accent,
                  color: "white",
                  boxShadow: `0 4px 16px ${accent}30`,
                }
              : {
                  background: "#F3F4F6",
                  color: "#9CA3AF",
                  cursor: "not-allowed",
                }
          }
        >
          {order.status === "pending"
            ? "Assign Rider"
            : S[order.status]?.label || order.status}
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ManagerOrder() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState("");
  const [assignModal, setAssignModal] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [newOrderIds, setNewOrderIds] = useState([]);
  const [assignStep, setAssignStep] = useState(1);
  const [location, setLocation] = useState({ from: "", to: "" });
  const [price, setPrice] = useState(0);
  const [platformLocations, setPlatformLocations] = useState([]);
  const audioRef = useRef(null);
  const [dateFilter, setDateFilter] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );

  useEffect(() => {
    if (status !== "authenticated") return;
    const interval = setInterval(async () => {
      try {
        const token = session?.user?.accessToken;
        if (!token) return;
        const [r1, r2] = await Promise.all([
          axios.get(`${BACKENDURL}/api/manager/orders`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BACKENDURL}/api/get-disputes`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const filtered = (r1.data.orders || []).filter(
          (o) =>
            new Date(o.createdAt).toISOString().slice(0, 10) === dateFilter,
        );
        const newOnes = filtered.filter(
          (o) => !orders.find((x) => x._id === o._id),
        );
        if (newOnes.length > 0) {
          setNewOrderIds((p) => [...p, ...newOnes.map((o) => o._id)]);
          audioRef.current?.play().catch(() => {});
          toast.custom((t) => (
            <div
              className={`flex items-center gap-3 bg-white rounded-2xl shadow-lg border border-orange-100 px-4 py-3 ${t.visible ? "opacity-100" : "opacity-0"}`}
            >
              <div className="w-9 h-9 rounded-full bg-[#AE2108] flex items-center justify-center flex-shrink-0">
                <Flame size={15} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900">
                  {newOnes.length} New Order{newOnes.length > 1 ? "s" : ""}!
                </p>
                <p className="text-xs text-gray-400">Ready to assign</p>
              </div>
            </div>
          ));
        }
        setOrders(filtered);
        setDisputes(r2.data.disputes || []);
      } catch {
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [status, session, dateFilter, orders]);

  useEffect(() => {
    if (!assignModal) return;
    axios
      .get(`${BACKENDURL}/api/rider/get-riders`)
      .then((r) => setRiders(r.data.riders || []))
      .catch(() => toast.error("Failed to load riders"));
  }, [assignModal]);

  useEffect(() => {
    axios
      .get(`${BACKENDURL}/api/platform-locations`)
      .then((r) => setPlatformLocations(r.data.locations || []))
      .catch(() => {});
  }, []);

  const assignOrderToRider = async () => {
    if (!selectedRider || !location.from || !location.to)
      return toast.error("Complete all fields");
    setAssigning(true);
    try {
      await axios.post(`${BACKENDURL}/api/rider/assign-order`, {
        orderId: assignModal._id,
        riderId: selectedRider,
        from: location.from,
        to: location.to,
        price,
      });
      toast.success("Rider assigned!");
      setOrders((p) =>
        p.map((o) =>
          o._id === assignModal._id
            ? { ...o, rider: selectedRider, status: "assigned" }
            : o,
        ),
      );
      setAssignModal(null);
      setSelectedRider("");
      setAssignStep(1);
      setLocation({ from: "", to: "" });
      setPrice(0);
    } catch {
      toast.error("Failed to assign rider");
    } finally {
      setAssigning(false);
    }
  };

  const filtered =
    statusFilter === "all"
      ? orders
      : orders.filter((o) => o.status === statusFilter);
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    done: orders.filter((o) => ["completed", "delivered"].includes(o.status))
      .length,
    revenue: orders
      .filter((o) => ["completed", "delivered"].includes(o.status))
      .reduce((s, o) => s + Number(o.totalAmount || 0), 0),
  };

  const filterTabs = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "assigned", label: "Assigned" },
    { key: "picked_up", label: "Picked Up" },
    { key: "delivered", label: "Delivered" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <ManagerLayout
      title="Order Management"
      subtitle="Live · refreshes every 3s"
      actions={
          <label className="flex items-center gap-2 bg-[#FBF8F4] border-2 border-[#F0E8E0] rounded-2xl px-3.5 py-2 cursor-pointer hover:border-[#AE2108]/40 transition-colors">
            <CalendarDays size={15} className="text-[#AE2108] flex-shrink-0" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setLoading(true);
                setDateFilter(e.target.value);
              }}
              className="text-xs sm:text-sm font-bold text-gray-700 bg-transparent focus:outline-none w-28 sm:w-36"
            />
          </label>
      }
    >
        {/* Stats */}
        <div className="flex-shrink-0 px-4 sm:px-8 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Total",
              value: stats.total,
              icon: ShoppingBag,
              color: "#6B7280",
              bg: "#F9FAFB",
              border: "#E5E7EB",
            },
            {
              label: "Pending",
              value: stats.pending,
              icon: Clock,
              color: "#D97706",
              bg: "#FFFBEB",
              border: "#FDE68A",
            },
            {
              label: "Done",
              value: stats.done,
              icon: CheckCircle2,
              color: "#059669",
              bg: "#ECFDF5",
              border: "#6EE7B7",
            },
            {
              label: "Revenue",
              value: `₦${stats.revenue.toLocaleString()}`,
              icon: TrendingUp,
              color: "#AE2108",
              bg: "#FFF5F5",
              border: "#FECACA",
            },
          ].map(({ label, value, icon: Icon, color, bg, border }) => (
            <div
              key={label}
              className="rounded-2xl px-4 py-3.5"
              style={{ background: bg, border: `1px solid ${border}` }}
            >
              <div className="flex items-center gap-1.5 mb-2">
                <Icon size={12} style={{ color }} />
                <p
                  className="text-[9px] font-black uppercase tracking-widest"
                  style={{ color: `${color}99` }}
                >
                  {label}
                </p>
              </div>
              <p className="text-xl sm:text-2xl font-black" style={{ color }}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex-shrink-0 px-4 sm:px-8 pb-3">
          <div
            className="flex gap-1.5 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {filterTabs.map(({ key, label }) => {
              const count =
                key === "all"
                  ? orders.length
                  : orders.filter((o) => o.status === key).length;
              const active = statusFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap flex-shrink-0 transition-colors border"
                  style={
                    active
                      ? {
                          background: "#AE2108",
                          color: "white",
                          borderColor: "#AE2108",
                        }
                      : {
                          background: "white",
                          color: "#6B7280",
                          borderColor: "#F0E8E0",
                        }
                  }
                >
                  {label}
                  {count > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[9px] font-black"
                      style={
                        active
                          ? {
                              background: "rgba(255,255,255,0.25)",
                              color: "white",
                            }
                          : { background: "#F3F4F6", color: "#9CA3AF" }
                      }
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 pb-8">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-12 h-12 border-4 border-[#F0E8E0] border-t-[#AE2108] rounded-full animate-spin" />
              <p className="text-sm font-semibold text-gray-400">
                Fetching orders…
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <AlertCircle size={40} className="text-red-300" />
              <p className="text-sm font-semibold text-red-400">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-20 h-20 rounded-3xl bg-white border border-[#F0E8E0] flex items-center justify-center">
                <ShoppingBag size={32} className="text-gray-200" />
              </div>
              <p className="text-sm font-bold text-gray-400">
                No orders for {dateFilter}
              </p>
              <p className="text-xs text-gray-300">
                Check back soon or pick another date
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((order, idx) => (
                <OrderCard
                  key={order._id}
                  order={order}
                  idx={idx}
                  disputes={disputes}
                  newOrderIds={newOrderIds}
                  onAssign={setAssignModal}
                />
              ))}
            </div>
          )}
        </div>

      {/* ── Assign Modal ── */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setAssignModal(null);
              setAssignStep(1);
            }}
          />
          <div
            className="relative bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl z-10 flex flex-col overflow-hidden shadow-2xl"
            style={{ maxHeight: "95dvh" }}
          >
            {/* Drag pill — mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Modal header */}
            <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-[#F0E8E0] flex items-start justify-between">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                  Order #{assignModal._id.slice(-6).toUpperCase()}
                </p>
                <h2 className="text-xl font-black text-gray-900">
                  Assign a Rider
                </h2>
              </div>
              <button
                onClick={() => {
                  setAssignModal(null);
                  setAssignStep(1);
                }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0 mt-1"
              >
                <X size={15} />
              </button>
            </div>

            {/* Step progress */}
            <div className="px-5 sm:px-6 py-4 flex items-center gap-3 bg-[#FBF8F4] border-b border-[#F0E8E0]">
              {[
                { n: 1, label: "Select Rider" },
                { n: 2, label: "Set Route" },
              ].map(({ n, label }, i, arr) => (
                <div key={n} className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-colors"
                      style={
                        assignStep > n
                          ? { background: "#059669", color: "white" }
                          : assignStep === n
                            ? { background: "#AE2108", color: "white" }
                            : { background: "#E5E7EB", color: "#9CA3AF" }
                      }
                    >
                      {assignStep > n ? <CheckCircle2 size={13} /> : n}
                    </div>
                    <span
                      className="text-xs font-bold"
                      style={{ color: assignStep >= n ? "#111827" : "#9CA3AF" }}
                    >
                      {label}
                    </span>
                  </div>
                  {i < arr.length - 1 && (
                    <div
                      className="flex-1 h-px mx-1"
                      style={{
                        background: assignStep > n ? "#059669" : "#E5E7EB",
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-5 sm:px-6 py-5">
              {/* Step 1 */}
              {assignStep === 1 && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 font-semibold">
                    Only active riders can receive deliveries.
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                    {riders.length === 0 ? (
                      <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
                        <Loader2 size={18} className="animate-spin mr-2" />{" "}
                        Loading riders…
                      </div>
                    ) : (
                      riders.map((r) => {
                        const active = r.status?.toLowerCase() === "active";
                        const sel = selectedRider === r._id;
                        return (
                          <button
                            key={r._id}
                            onClick={() => active && setSelectedRider(r._id)}
                            disabled={!active}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-colors"
                            style={
                              sel
                                ? {
                                    borderColor: "#AE2108",
                                    background: "#FFF5F5",
                                  }
                                : active
                                  ? {
                                      borderColor: "#E5E7EB",
                                      background: "white",
                                    }
                                  : {
                                      borderColor: "#F3F4F6",
                                      background: "#F9FAFB",
                                      opacity: 0.5,
                                    }
                            }
                          >
                            <div
                              className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-sm font-black transition-colors"
                              style={
                                sel
                                  ? { background: "#AE2108", color: "white" }
                                  : { background: "#F3F4F6", color: "#374151" }
                              }
                            >
                              {r.fullname?.[0]?.toUpperCase() || "R"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-sm text-gray-900 truncate">
                                {r.fullname}
                              </p>
                              <p className="text-xs text-gray-500">
                                {r.contact}
                              </p>
                            </div>
                            <span
                              className="text-[10px] font-black uppercase px-2 py-1 rounded-full"
                              style={
                                active
                                  ? { background: "#D1FAE5", color: "#065F46" }
                                  : { background: "#F3F4F6", color: "#9CA3AF" }
                              }
                            >
                              {active ? "Active" : "Off"}
                            </span>
                            {sel && (
                              <CheckCircle2
                                size={16}
                                className="flex-shrink-0"
                                style={{ color: "#AE2108" }}
                              />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  <button
                    onClick={() => {
                      if (!selectedRider) return toast.error("Select a rider");
                      const r = riders.find((x) => x._id === selectedRider);
                      if (r?.status?.toLowerCase() !== "active")
                        return toast.error("Rider is not active");
                      setAssignStep(2);
                    }}
                    className="w-full py-3 text-white font-black rounded-2xl text-sm transition-colors"
                    style={{ background: "#AE2108" }}
                  >
                    Continue →
                  </button>
                </div>
              )}

              {/* Step 2 */}
              {assignStep === 2 && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 font-semibold">
                    Set pickup and delivery locations.
                  </p>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                      Pickup Location
                    </label>
                    <input
                      type="text"
                      value={location.from}
                      onChange={(e) =>
                        setLocation((p) => ({ ...p, from: e.target.value }))
                      }
                      placeholder="e.g. Vendor kitchen address"
                      className="w-full border-2 border-[#F0E8E0] rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none transition-colors"
                      style={{ background: "#FBF8F4" }}
                      onFocus={(e) => (e.target.style.borderColor = "#AE2108")}
                      onBlur={(e) => (e.target.style.borderColor = "#F0E8E0")}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                      Delivery Zone
                    </label>
                    <select
                      value={location.to}
                      onChange={(e) => {
                        const to = e.target.value;
                        setLocation((p) => ({ ...p, to }));
                        setPrice(
                          platformLocations.find((l) => l.name === to)?.price ||
                            0,
                        );
                      }}
                      className="w-full border-2 border-[#F0E8E0] rounded-2xl px-4 py-3 text-sm font-semibold focus:outline-none transition-colors bg-[#FBF8F4]"
                    >
                      <option value="">Select delivery zone</option>
                      {platformLocations.map((loc) => (
                        <option key={loc._id} value={loc.name}>
                          {loc.location} — ₦{Number(loc.price).toLocaleString()}
                        </option>
                      ))}
                    </select>
                  </div>

                  {price > 0 && (
                    <div
                      className="flex items-center justify-between rounded-2xl px-4 py-3"
                      style={{
                        background: "#FFF5F5",
                        border: "1px solid #FECACA",
                      }}
                    >
                      <span
                        className="text-xs font-black uppercase tracking-widest"
                        style={{ color: "#AE210888" }}
                      >
                        Delivery Fee
                      </span>
                      <span
                        className="text-xl font-black"
                        style={{ color: "#AE2108" }}
                      >
                        ₦{Number(price).toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setAssignStep(1)}
                      className="flex-1 py-3 rounded-2xl border-2 border-[#F0E8E0] text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      ← Back
                    </button>
                    <button
                      onClick={assignOrderToRider}
                      disabled={assigning}
                      className="flex-1 py-3 rounded-2xl text-sm font-black text-white transition-colors disabled:opacity-60"
                      style={{ background: "#AE2108" }}
                    >
                      {assigning ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 size={14} className="animate-spin" />
                          Assigning…
                        </span>
                      ) : (
                        "Assign Now"
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ManagerLayout>
  );
}
