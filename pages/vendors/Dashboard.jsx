"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  PackageOpen,
  Settings,
  LogOut,
  Menu,
  X,
  Users,
  User,
  UtensilsCrossed,
  Wallet,
  Rocket,
  Star,
  Bell,
  MapPin,
  BarChart,
  MessageCircle,
  TrendingUp,
  ShoppingBag,
  ChevronRight,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { io } from "socket.io-client";
import Notification from "@/components/Notification";

const BACKENDURL =
  "https://chowspace-backend.vercel.app" || "http://localhost:2005";
const CHAT_URL = "http://localhost:2005";

function StatusDot({ status }) {
  return (
    <span
      className={`inline-flex w-2 h-2 rounded-full flex-shrink-0 ${
        status === "opened"
          ? "bg-emerald-400 shadow-[0_0_6px_2px_rgba(52,211,153,0.4)] animate-pulse"
          : "bg-gray-300"
      }`}
    />
  );
}

function StatCard({ label, value, icon: Icon, trend, primary }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 border transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        primary
          ? "bg-[#AE2108] border-[#AE2108] text-white shadow-[0_4px_24px_rgba(174,33,8,0.2)]"
          : "bg-white border-gray-100 shadow-sm"
      }`}
    >
      {primary && (
        <>
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -right-2 bottom-0 w-16 h-16 rounded-full bg-white/5 pointer-events-none" />
        </>
      )}
      <div className="relative flex items-start justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            primary ? "bg-white/20" : "bg-[#AE2108]/8"
          }`}
        >
          <Icon
            size={18}
            className={primary ? "text-white" : "text-[#AE2108]"}
          />
        </div>
        {trend && (
          <span
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              primary
                ? "bg-white/20 text-white"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <TrendingUp size={9} />
            {trend}
          </span>
        )}
      </div>
      <p
        className={`text-2xl font-bold mb-1 ${primary ? "text-white" : "text-gray-900"}`}
      >
        {value}
      </p>
      <p
        className={`text-xs font-medium ${primary ? "text-white/70" : "text-gray-400"}`}
      >
        {label}
      </p>
    </div>
  );
}

export default function VendorDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [storeStatus, setStoreStatus] = useState("closed");
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [unreadChats, setUnreadChats] = useState(0);

  const router = useRouter();
  const { data: session, status } = useSession();
  const vendorId = session?.user?.vendorId;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/Login");
  }, [status]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(
        `${BACKENDURL}/api/getAllOrders?vendorId=${vendorId}`,
      );
      const allOrders = res.data.orders || [];
      const today = new Date();
      const start = new Date(today.setHours(0, 0, 0, 0));
      const end = new Date(today.setHours(23, 59, 59, 999));
      setOrders(
        allOrders.filter((o) => {
          const c = new Date(o.createdAt);
          return c >= start && c <= end;
        }),
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchStoreStatus = async () => {
    try {
      const res = await axios.get(
        `${BACKENDURL}/api/getVendorStatusById/${vendorId}`,
      );
      if (res.data.status) setStoreStatus(res.data.status);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUnreadChats = async () => {
    if (!vendorId) return;
    try {
      const res = await axios.get(`${CHAT_URL}/api/chat/vendor/${vendorId}`);
      setUnreadChats(
        (res.data.rooms || []).filter((r) => r.unreadCount > 0).length,
      );
    } catch {}
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchOrders();
      fetchStoreStatus();
      fetchUnreadChats();
    }
  }, [session, status]);

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
    const newStatus = storeStatus === "closed" ? "opened" : "closed";
    try {
      const res = await axios.put(
        `${BACKENDURL}/api/vendor/toggleStatus`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${session?.user?.accessToken}` } },
      );
      setStoreStatus(res.data.vendor?.status || newStatus);
      toast.success(`Store is now ${res.data.vendor?.status || newStatus}`);
    } catch {
      toast.error("Could not toggle store status");
    }
  };

  const handleLogout = async () => {
    const id = toast.loading("Logging out...");
    try {
      await signOut({ redirect: false });
      toast.dismiss(id);
      toast.success("Logged out");
      router.push("/");
    } catch {
      toast.dismiss(id);
      toast.error("Logout failed");
    }
  };

  const menuItems = [
    { name: "Orders", icon: PackageOpen, path: "/vendors/Orders" },
    { name: "Reviews", icon: Star, path: "/vendors/Reviews" },
    {
      name: "Products",
      icon: UtensilsCrossed,
      path: "/vendors/ManageProducts",
    },
    { name: "Analytics", icon: BarChart, path: "/vendors/Analytics" },
    { name: "Location", icon: MapPin, path: "/vendors/VendorLocation" },
    { name: "Wallet", icon: Wallet, path: "/vendors/Wallet" },
    { name: "Profile", icon: User, path: "/vendors/Profile" },
    { name: "Subscribe", icon: Rocket, path: "/vendors/Subscribe" },
    { name: "Announcement", icon: Bell, path: "/vendors/Announcement" },
    { name: "Manage Team", icon: Users, path: "/vendors/ManageTeam" },
    {
      name: "Chat",
      icon: MessageCircle,
      path: "/vendors/vendorchat",
      badge: unreadChats || null,
    },
    { name: "Settings", icon: Settings, path: "/Settings" },
  ];

  const todayRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const vendorName =
    session?.user?.businessName || session?.user?.name || "Vendor";
  const statusColors = {
    completed: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    cancelled: "bg-red-50 text-red-600 border border-red-100",
    pending: "bg-amber-50 text-amber-700 border border-amber-100",
  };
  const greeting =
    new Date().getHours() < 12
      ? "morning"
      : new Date().getHours() < 17
        ? "afternoon"
        : "evening";

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: "12px", fontSize: "13px", fontWeight: 500 },
        }}
      />

      <div className="h-screen flex overflow-hidden bg-gray-50">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 md:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`fixed z-30 inset-y-0 left-0 w-64 bg-white border-r border-gray-100 flex flex-col shadow-xl transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 md:shadow-none`}
        >
          {/* Brand */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="font-bold text-gray-900 text-base tracking-tight">
                <span className="text-[#AE2108]"> Chowspace</span>
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>

          {/* Vendor pill */}
          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#AE2108]/5 border border-[#AE2108]/10">
              <div className="w-8 h-8 rounded-full bg-[#AE2108]/15 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-[#AE2108]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-gray-900 text-xs font-bold truncate">
                  {vendorName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <StatusDot status={storeStatus} />
                  <p className="text-gray-400 text-[10px] font-medium capitalize">
                    Store {storeStatus}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
            {menuItems.map(({ name, icon: Icon, path, badge }) => {
              const isActive = router.pathname === path;
              return (
                <Link
                  key={name}
                  href={path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                    ${isActive ? "bg-[#AE2108] text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={16}
                      className={
                        isActive
                          ? "text-white"
                          : "text-gray-400 group-hover:text-gray-600 transition-colors"
                      }
                    />
                    <span>{name}</span>
                  </div>
                  {badge && (
                    <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#AE2108] text-white text-[9px] font-bold px-1">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 overflow-y-auto">
          {/* Topbar */}
          <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-100 px-5 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={18} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-sm font-bold text-gray-900 leading-tight">
                  Dashboard
                </h1>
                <p className="text-[11px] text-gray-400 hidden sm:block leading-tight">
                  {new Date().toLocaleDateString("en-NG", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleStoreStatus}
                className={`flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  storeStatus === "opened"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                    : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                }`}
              >
                <StatusDot status={storeStatus} />
                <span className="hidden sm:inline capitalize">
                  {storeStatus}
                </span>
              </button>
              <Notification />
            </div>
          </header>

          {/* Content */}
          <div className="px-5 py-6 max-w-6xl mx-auto space-y-6">
            {/* Welcome banner */}
            <div className="relative overflow-hidden rounded-2xl bg-[#AE2108] px-6 py-5 shadow-lg shadow-[#AE2108]/15">
              <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute right-10 -bottom-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute right-36 top-2 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <p className="text-white/60 text-xs font-medium mb-0.5">
                    Good {greeting}
                  </p>
                  <h2 className="text-white text-lg font-bold leading-tight">
                    {vendorName} 👋
                  </h2>
                  <p className="text-white/60 text-xs mt-1.5">
                    {loadingOrders
                      ? "Loading summary…"
                      : `${orders.length} order${orders.length !== 1 ? "s" : ""} · ₦${todayRevenue.toLocaleString()} earned today`}
                  </p>
                </div>
                <Link
                  href="/vendors/Orders"
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-xl transition whitespace-nowrap"
                >
                  View Orders <ChevronRight size={13} />
                </Link>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <StatCard
                label="Today's Orders"
                value={loadingOrders ? "—" : orders.length}
                icon={ShoppingBag}
                trend="+12%"
                primary
              />
              <StatCard
                label="Today's Revenue"
                value={
                  loadingOrders ? "—" : `₦${todayRevenue.toLocaleString()}`
                }
                icon={Wallet}
                trend="+8%"
              />
              <div className="col-span-2 lg:col-span-1">
                <StatCard label="Store Rating" value="4.8 ★" icon={Star} />
              </div>
            </div>

            {/* Quick actions */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    label: "Manage Menu",
                    icon: UtensilsCrossed,
                    path: "/vendors/ManageProducts",
                    iconClass: "bg-orange-50 text-orange-500",
                  },
                  {
                    label: "Analytics",
                    icon: BarChart,
                    path: "/vendors/Analytics",
                    iconClass: "bg-blue-50 text-blue-500",
                  },
                  {
                    label: "Chat",
                    icon: MessageCircle,
                    path: "/vendors/vendorchat",
                    iconClass: "bg-[#AE2108]/8 text-[#AE2108]",
                    badge: unreadChats,
                  },
                  {
                    label: "Wallet",
                    icon: Wallet,
                    path: "/vendors/Wallet",
                    iconClass: "bg-emerald-50 text-emerald-600",
                  },
                ].map(({ label, icon: Icon, path, iconClass, badge }) => (
                  <Link
                    key={label}
                    href={path}
                    className="flex flex-col items-center gap-3 bg-white rounded-2xl px-4 py-4 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-center group"
                  >
                    <div
                      className={`relative w-11 h-11 rounded-xl flex items-center justify-center ${iconClass}`}
                    >
                      <Icon size={19} />
                      {badge > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#AE2108] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow">
                          {badge > 9 ? "9+" : badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Orders list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Today&apos;s Orders
                  </h3>
                  {!loadingOrders && orders.length > 0 && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {orders.length} order{orders.length !== 1 ? "s" : ""}{" "}
                      placed
                    </p>
                  )}
                </div>
                <Link
                  href="/vendors/Orders"
                  className="flex items-center gap-1 text-xs text-[#AE2108] font-semibold hover:underline"
                >
                  View all <ChevronRight size={12} />
                </Link>
              </div>

              {loadingOrders ? (
                <div className="p-5 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 animate-pulse"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gray-100 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-100 rounded-full w-2/5" />
                        <div className="h-2.5 bg-gray-100 rounded-full w-1/4" />
                      </div>
                      <div className="space-y-2 text-right">
                        <div className="h-3 bg-gray-100 rounded-full w-16" />
                        <div className="h-4 bg-gray-100 rounded-full w-14 ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center px-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#AE2108]/5 border border-[#AE2108]/10 flex items-center justify-center mb-3">
                    <ShoppingBag size={24} className="text-[#AE2108]/40" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">
                    No orders yet today
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    New orders will appear here automatically
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {orders.slice(0, 6).map((order) => {
                    const st = (order.status || "pending").toLowerCase();
                    const name =
                      order.guestInfo?.name ||
                      order.customerId?.fullname ||
                      "Customer";
                    return (
                      <div
                        key={order._id}
                        className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/70 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#AE2108]/8 flex items-center justify-center flex-shrink-0">
                          <ShoppingBag size={15} className="text-[#AE2108]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {name}
                          </p>
                          <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                            #{order._id.slice(-6).toUpperCase()}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900">
                            ₦{(order.totalAmount || 0).toLocaleString()}
                          </p>
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${statusColors[st] || statusColors.pending}`}
                          >
                            {st.charAt(0).toUpperCase() + st.slice(1)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
