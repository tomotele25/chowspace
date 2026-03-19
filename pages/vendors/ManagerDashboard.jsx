"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  MapPin,
  PackageOpen,
  Settings,
  LogOut,
  Menu,
  X,
  UtensilsCrossed,
  MessageCircle,
  ChevronRight,
  Flame,
  TrendingUp,
  Clock,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";

const STATUS_COLORS = {
  completed: { bg: "#ECFDF5", text: "#065F46", border: "#6EE7B7" },
  pending: { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" },
  assigned: { bg: "#EFF6FF", text: "#1E40AF", border: "#BFDBFE" },
  picked_up: { bg: "#F5F3FF", text: "#5B21B6", border: "#DDD6FE" },
  delivered: { bg: "#ECFDF5", text: "#065F46", border: "#6EE7B7" },
  cancelled: { bg: "#FEF2F2", text: "#991B1B", border: "#FECACA" },
};

function StatusChip({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span
      className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg"
      style={{
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
    >
      {status?.replace("_", " ") || "pending"}
    </span>
  );
}

export default function ManagerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [vendorStatus, setVendorStatus] = useState("");
  const [toggling, setToggling] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadChats, setUnreadChats] = useState(0);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();

const BACKENDURL =
  "https://chowspace-backend.vercel.app" 
  const CHAT_URL = "http://localhost:2005";
  const vendorId = session?.user?.id;

  /* ── Fetch orders + vendor status ── */
  useEffect(() => {
    if (status !== "authenticated") return;

    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${BACKENDURL}/api/manager/orders`, {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
        });
        const today = new Date().toISOString().slice(0, 10);
        const todaysOrders = (res.data.orders || []).filter(
          (o) => new Date(o.createdAt).toISOString().slice(0, 10) === today,
        );
        setOrders(todaysOrders);
        setPendingCount(
          todaysOrders.filter((o) => o.status === "pending").length,
        );
      } catch {
        toast.error("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    const fetchVendorStatus = async () => {
      try {
        const res = await axios.get(`${BACKENDURL}/api/getVendorStatus`, {
          headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
        });
        if (res.data.status) setVendorStatus(res.data.status);
      } catch {
        toast.error("Failed to load store status");
      }
    };

    fetchOrders();
    fetchVendorStatus();
  }, [session, status]);

  /* ── Unread chats ── */
  useEffect(() => {
    if (!vendorId) return;
    axios
      .get(`${CHAT_URL}/api/chat/vendor/${vendorId}`)
      .then((res) => {
        const unread = (res.data.rooms || []).filter(
          (r) => r.unreadCount > 0,
        ).length;
        setUnreadChats(unread);
      })
      .catch(() => {});
  }, [vendorId]);

  /* ── Real-time socket ── */
  useEffect(() => {
    if (!vendorId) return;
    const socket = io(CHAT_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    socket.on("connect", () => socket.emit("joinVendorRoom", vendorId));
    socket.on("newChatNotification", () => setUnreadChats((p) => p + 1));
    socket.on("receiveMessage", (msg) => {
      if (msg.senderType !== "vendor") setUnreadChats((p) => p + 1);
    });
    return () => socket.disconnect();
  }, [vendorId]);

  const toggleStoreStatus = async () => {
    const newStatus = vendorStatus === "closed" ? "opened" : "closed";
    setToggling(true);
    try {
      const res = await axios.put(
        `${BACKENDURL}/api/vendor/toggleStatus`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${session?.user?.accessToken}` } },
      );
      setVendorStatus(res.data.vendor?.status);
      toast.success(`Store is now ${res.data.vendor?.status}`);
    } catch {
      toast.error("Could not toggle store status");
    } finally {
      setToggling(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/Login");
  };

  const revenue = orders
    .filter((o) => ["completed", "delivered"].includes(o.status))
    .reduce((s, o) => s + Number(o.totalAmount || 0), 0);

  const completedCount = orders.filter((o) =>
    ["completed", "delivered"].includes(o.status),
  ).length;

  const navItems = [
    {
      href: "/vendors/ManagerDashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      active: true,
    },
    { href: "/vendors/ManageLocation", icon: MapPin, label: "Locations" },
    {
      href: "/manager/ManagerOrder",
      icon: UtensilsCrossed,
      label: "Orders",
      badge: pendingCount || null,
      badgeColor: "#F59E0B",
    },
    { href: "/vendors/ManageProducts", icon: PackageOpen, label: "Products" },
    // {
    //   href: "/vendors/chat",
    //   icon: MessageCircle,
    //   label: "Chat",
    //   badge: unreadChats || null,
    //   badgeColor: "#AE2108",
    // },
    { href: "/manager/Profile", icon: Settings, label: "Profile" },
  ];

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "#FBF8F4" }}
    >
      <Toaster position="top-right" />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white border-r border-[#F0E8E0] flex flex-col justify-between transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div>
          {/* Brand */}
          <div className="px-6 py-5 border-b border-[#F0E8E0] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div>
                <p className="font-black text-[#AE2108] text-sm leading-tight">
                  ChowSpace
                </p>
                <p className="text-[10px] text-gray-400 font-semibold">
                  Manager
                </p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden text-gray-400 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>

          {/* Nav */}
          <div className="px-3 py-5">
            <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest px-3 mb-2">
              Menu
            </p>
            <nav className="space-y-0.5">
              {navItems.map(
                ({ href, icon: Icon, label, active, badge, badgeColor }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold transition-colors"
                    style={
                      active
                        ? { background: "#AE2108", color: "white" }
                        : { color: "#6B7280" }
                    }
                  >
                    <Icon size={16} />
                    <span className="flex-1">{label}</span>
                    {badge && (
                      <span
                        className="min-w-[20px] h-5 flex items-center justify-center rounded-full text-white text-[9px] font-black px-1.5"
                        style={{ background: badgeColor }}
                      >
                        {badge > 99 ? "99+" : badge}
                      </span>
                    )}
                    {active && (
                      <ChevronRight size={14} className="opacity-60" />
                    )}
                  </Link>
                ),
              )}
            </nav>
          </div>
        </div>

        <div className="px-3 py-4 border-t border-[#F0E8E0]">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold text-red-500 hover:bg-red-50 w-full transition-colors"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 md:ml-64 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 bg-white border-b border-[#F0E8E0] px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500"
            >
              <Menu size={18} />
            </button>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-gray-900 tracking-tight">
                Dashboard
              </h1>
              <p className="text-xs text-gray-400 font-semibold">
                Today's overview
              </p>
            </div>
          </div>

          {/* Store toggle */}
          {vendorStatus && (
            <button
              onClick={toggleStoreStatus}
              disabled={toggling}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border-2 text-sm font-black transition-colors disabled:opacity-60"
              style={
                vendorStatus === "opened"
                  ? {
                      borderColor: "#6EE7B7",
                      background: "#ECFDF5",
                      color: "#065F46",
                    }
                  : {
                      borderColor: "#FECACA",
                      background: "#FEF2F2",
                      color: "#991B1B",
                    }
              }
            >
              {vendorStatus === "opened" ? (
                <>
                  <ToggleRight size={18} className="text-green-500" /> Store
                  Open
                </>
              ) : (
                <>
                  <ToggleLeft size={18} className="text-red-400" /> Store Closed
                </>
              )}
            </button>
          )}
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6">
          {/* ── Stats grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Orders Today",
                value: orders.length,
                icon: ShoppingBag,
                color: "#6B7280",
                bg: "#F9FAFB",
                border: "#E5E7EB",
              },
              {
                label: "Pending",
                value: pendingCount,
                icon: Clock,
                color: "#D97706",
                bg: "#FFFBEB",
                border: "#FDE68A",
              },
              {
                label: "Completed",
                value: completedCount,
                icon: CheckCircle2,
                color: "#059669",
                bg: "#ECFDF5",
                border: "#6EE7B7",
              },
              {
                label: "Revenue",
                value: `₦${revenue.toLocaleString()}`,
                icon: TrendingUp,
                color: "#AE2108",
                bg: "#FFF5F5",
                border: "#FECACA",
              },
            ].map(({ label, value, icon: Icon, color, bg, border }) => (
              <div
                key={label}
                className="rounded-2xl px-4 py-4"
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
                  {loading ? "—" : value}
                </p>
              </div>
            ))}
          </div>

          {/* ── Quick links ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              {
                href: "/manager/ManagerOrder",
                label: "Manage Orders",
                sub: `${pendingCount} pending`,
                accent: "#AE2108",
                icon: UtensilsCrossed,
              },
              {
                href: "/vendors/ManageProducts",
                label: "Manage Products",
                sub: "Add or edit items",
                accent: "#C44B2B",
                icon: PackageOpen,
              },
              // {
              //   href: "/vendors/chat",
              //   label: "Customer Chats",
              //   sub: `${unreadChats} unread`,
              //   accent: "#E07B39",
              //   icon: MessageCircle,
              // },
              {
                href: "/vendors/ManageLocation",
                label: "Locations",
                sub: "Delivery zones",
                accent: "#B5451B",
                icon: MapPin,
              },
              {
                href: "/manager/Profile",
                label: "Profile",
                sub: "Account settings",
                accent: "#963214",
                icon: Settings,
              },
            ].map(({ href, label, sub, accent, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 bg-white rounded-2xl px-4 py-4 border border-[#F0E8E0] hover:shadow-md transition-shadow"
              >
                <div
                  className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                  style={{ background: `${accent}15` }}
                >
                  <Icon size={18} style={{ color: accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-gray-900 truncate">
                    {label}
                  </p>
                  <p className="text-[10px] text-gray-400 font-semibold">
                    {sub}
                  </p>
                </div>
                <ArrowRight
                  size={14}
                  className="text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors"
                />
              </Link>
            ))}
          </div>

          {/* ── Recent orders ── */}
          <div
            className="bg-white rounded-3xl border border-[#F0E8E0] overflow-hidden"
            style={{ boxShadow: "0 2px 12px #0000000a" }}
          >
            <div className="px-5 sm:px-6 py-4 border-b border-[#F0E8E0] flex items-center justify-between">
              <div>
                <h2 className="font-black text-gray-900 text-base">
                  Recent Orders
                </h2>
                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mt-0.5">
                  Today · latest first
                </p>
              </div>
              <Link
                href="/manager/ManagerOrder"
                className="flex items-center gap-1.5 text-xs font-black text-[#AE2108] hover:underline"
              >
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-10 h-10 border-4 border-[#F0E8E0] border-t-[#AE2108] rounded-full animate-spin" />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-2">
                <div className="w-14 h-14 rounded-2xl bg-[#FBF8F4] border border-[#F0E8E0] flex items-center justify-center">
                  <ShoppingBag size={24} className="text-gray-200" />
                </div>
                <p className="text-sm font-bold text-gray-400">
                  No orders today yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F7F3EF]">
                {recentOrders.map((order, idx) => {
                  const name =
                    order.guestInfo?.name?.trim() ||
                    order.customerId?.fullname ||
                    "Guest";
                  const phone = order.guestInfo?.phone || "";
                  const address = order.guestInfo?.address || "";
                  const time = new Date(order.createdAt).toLocaleTimeString(
                    [],
                    { hour: "2-digit", minute: "2-digit" },
                  );
                  const accents = [
                    "#AE2108",
                    "#C44B2B",
                    "#E07B39",
                    "#B5451B",
                    "#963214",
                    "#7A2910",
                  ];
                  const accent = accents[idx % accents.length];
                  const initials = name
                    .split(" ")
                    .filter(Boolean)
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <div
                      key={order._id}
                      className="px-5 sm:px-6 py-4 flex items-center gap-4 hover:bg-[#FBF8F4] transition-colors"
                    >
                      {/* Avatar */}
                      <div
                        className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xs font-black text-white"
                        style={{ background: accent }}
                      >
                        {initials}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <p className="text-sm font-black text-gray-900 truncate">
                            {order.orderId ||
                              `#${order._id.slice(-6).toUpperCase()}`}
                          </p>
                          <StatusChip status={order.status} />
                        </div>
                        <p className="text-xs text-gray-500 font-semibold truncate">
                          {name}
                        </p>
                        {phone && (
                          <p className="text-[10px] text-gray-400 truncate">
                            {phone}
                            {address ? ` · ${address}` : ""}
                          </p>
                        )}
                      </div>

                      {/* Amount + time */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-black text-gray-900">
                          ₦{Number(order.totalAmount).toLocaleString()}
                        </p>
                        <p className="text-[10px] text-gray-400 font-semibold">
                          {time}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {order.items?.length} item
                          {order.items?.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom padding */}
          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}
