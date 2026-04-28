"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  PhoneCall,
  BarChart3,
  Star,
  ChevronRight,
  Bike,
  ClipboardList,
  MessageCircle,
  Search,
  Gift,
  Clock,
  TrendingUp,
  ShoppingBag,
  UserCheck,
  RefreshCw,
  UserAnalysis,
} from "lucide-react";
import Link from "next/link";

const BACKENDURL = "https://chowspace-backend.vercel.app";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { name: "Manage Vendors", icon: Users, path: "/admin/ManageVendor" },
  { name: "Manage Riders", icon: Bike, path: "/admin/ManageRiders" },
  {
    name: "Assigned Orders",
    icon: ClipboardList,
    path: "/admin/AssignedOrders",
  },
  { name: "Order Analysis", icon: BarChart3, path: "/admin/OrderAnalysis" },
  { name: "User Analysis", icon: Users, path: "/admin/UserAnalysis" },
  { name: "Promotion", icon: Star, path: "/admin/Promotion" },
  {
    name: "Contact Support",
    icon: PhoneCall,
    path: "/admin/AdminContactSupport",
  },
  { name: "Settings", icon: Settings, path: "/admin/settings" },
];

/* ── helpers ── */
const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : n);

const AVATAR_COLORS = [
  { bg: "bg-blue-50", text: "text-blue-700" },
  { bg: "bg-purple-50", text: "text-purple-700" },
  { bg: "bg-emerald-50", text: "text-emerald-700" },
  { bg: "bg-amber-50", text: "text-amber-700" },
  { bg: "bg-rose-50", text: "text-rose-700" },
];

const avatarColor = (str = "") => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const daysSince = (dateStr) => {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000);
};

const getUserBadge = (user) => {
  const days = daysSince(user.lastOrderDate);
  if (user.orderCount === 1)
    return { label: "New", style: "bg-emerald-50 text-emerald-700" };
  if (days !== null && days > 14)
    return { label: "Inactive", style: "bg-gray-100 text-gray-500" };
  if (user.orderCount >= 5)
    return { label: "Regular", style: "bg-[#AE2108]/10 text-[#AE2108]" };
  return { label: "Returning", style: "bg-blue-50 text-blue-700" };
};

/* ── derive users from orders ── */
const buildUsers = (orders) => {
  const map = {};
  orders.forEach((order) => {
    const phone =
      order.guestInfo?.phone ||
      order.customerInfo?.phone ||
      order.customerId?.phone ||
      null;
    if (!phone) return;

    const name =
      order.guestInfo?.name ||
      order.customerInfo?.name ||
      order.customerId?.fullname ||
      "Unknown";

    const email =
      order.guestInfo?.email ||
      order.customerInfo?.email ||
      order.customerId?.email ||
      "";

    if (!map[phone]) {
      map[phone] = {
        phone,
        name,
        email,
        orderCount: 0,
        totalSpend: 0,
        items: {},
        orders: [],
        lastOrderDate: null,
        firstOrderDate: null,
        dob: null,
      };
    }

    const u = map[phone];
    u.orderCount += 1;
    u.totalSpend += order.totalAmount || 0;
    u.orders.push(order);

    const d = order.createdAt;
    if (!u.lastOrderDate || d > u.lastOrderDate) u.lastOrderDate = d;
    if (!u.firstOrderDate || d < u.firstOrderDate) u.firstOrderDate = d;

    (order.items || []).forEach((item) => {
      u.items[item.name] = (u.items[item.name] || 0) + (item.quantity || 1);
    });
  });

  return Object.values(map).sort((a, b) => b.orderCount - a.orderCount);
};

/* ── top items across all users ── */
const buildTopItems = (users) => {
  const map = {};
  users.forEach((u) =>
    Object.entries(u.items).forEach(([name, qty]) => {
      map[name] = (map[name] || 0) + qty;
    }),
  );
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);
};

/* ════════════════════════════════════════════════════════════ */
export default function UserAnalysisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/Login");
  }, [status]);

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    setLoading(true);
    axios
      .get(`${BACKENDURL}/api/getAllOrdersForAdmin`, {
        headers: { Authorization: `Bearer ${session.user.accessToken}` },
      })
      .then((r) => setOrders(r.data.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session]);

  const logout = async () => await signOut({ callbackUrl: "/Login" });

  const users = buildUsers(orders);
  const topItems = buildTopItems(users);
  const maxItemCount = topItems[0]?.[1] || 1;

  /* ── stats ── */
  const totalUsers = users.length;
  const orderedToday = users.filter(
    (u) => daysSince(u.lastOrderDate) === 0,
  ).length;
  const repeatUsers = users.filter((u) => u.orderCount >= 2).length;
  const repeatPct = totalUsers
    ? Math.round((repeatUsers / totalUsers) * 100)
    : 0;

  const today = new Date();
  const birthdayUsers = users.filter((u) => {
    if (!u.dob) return false;
    const d = new Date(u.dob);
    return d.getMonth() === today.getMonth();
  });

  /* ── filter + search ── */
  const filtered = users.filter((u) => {
    const badge = getUserBadge(u).label.toLowerCase();
    const matchFilter =
      filter === "all" ||
      (filter === "hot" && badge === "regular") ||
      (filter === "new" && badge === "new") ||
      (filter === "cold" && badge === "inactive") ||
      (filter === "returning" && badge === "returning");

    const q = search.toLowerCase();
    const matchSearch =
      !q || u.name.toLowerCase().includes(q) || u.phone.includes(q);

    return matchFilter && matchSearch;
  });

  const waReminder = (user) => {
    const phone = user.phone.replace(/\D/g, "");
    const p = phone.startsWith("0") ? "234" + phone.slice(1) : phone;
    const fav = Object.entries(user.items).sort((a, b) => b[1] - a[1])[0]?.[0];
    const msg = encodeURIComponent(
      `Hi ${user.name.split(" ")[0]}! 👋 We miss you on ChowSpace.\n\nYour favourite ${fav || "food"} is waiting 😋\n\nOrder now: https://chowspace.ng`,
    );
    window.open(`https://wa.me/${p}?text=${msg}`, "_blank");
  };

  const waBirthday = (user) => {
    const phone = user.phone.replace(/\D/g, "");
    const p = phone.startsWith("0") ? "234" + phone.slice(1) : phone;
    const msg = encodeURIComponent(
      `Happy Birthday ${user.name.split(" ")[0]}! 🎂🎉\n\nChowSpace is celebrating with you! Enjoy your special day and treat yourself to something delicious.\n\nOrder now: https://chowspace.ng`,
    );
    window.open(`https://wa.me/${p}?text=${msg}`, "_blank");
  };

  /* ── selected user favourite items ── */
  const userFavItems = selectedUser
    ? Object.entries(selectedUser.items)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  return (
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
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#AE2108] flex items-center justify-center">
              <span className="text-white font-black text-xs">CS</span>
            </div>
            <span className="font-bold text-gray-900 text-sm tracking-tight">
              <span className="text-[#AE2108]">Chowspace</span> Admin
            </span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center"
          >
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {menuItems.map(({ name, icon: Icon, path }) => {
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
                        : "text-gray-400 group-hover:text-gray-600"
                    }
                  />
                  <span>{name}</span>
                </div>
                {isActive && (
                  <ChevronRight size={13} className="text-white/60" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">
        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-100 px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">
                User Analysis
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
        </header>

        <div className="px-5 py-6 max-w-6xl mx-auto space-y-6">
          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                label: "Total customers",
                value: loading ? "—" : fmt(totalUsers),
                sub: "unique phone numbers",
                icon: Users,
                iconClass: "bg-blue-50 text-blue-500",
              },
              {
                label: "Ordered today",
                value: loading ? "—" : orderedToday,
                sub: "active right now",
                icon: ShoppingBag,
                iconClass: "bg-[#AE2108]/10 text-[#AE2108]",
                primary: true,
              },
              {
                label: "Repeat customers",
                value: loading ? "—" : `${repeatPct}%`,
                sub: `${fmt(repeatUsers)} ordered 2+ times`,
                icon: RefreshCw,
                iconClass: "bg-emerald-50 text-emerald-600",
              },
              {
                label: "Birthdays this month",
                value: loading ? "—" : birthdayUsers.length,
                sub: "send them a surprise",
                icon: Gift,
                iconClass: "bg-amber-50 text-amber-500",
              },
            ].map(({ label, value, sub, icon: Icon, iconClass, primary }) => (
              <div
                key={label}
                className={`relative overflow-hidden rounded-2xl p-5 border transition-all hover:-translate-y-0.5 hover:shadow-lg
                ${primary ? "bg-[#AE2108] border-[#AE2108] shadow-[0_4px_24px_rgba(174,33,8,0.2)]" : "bg-white border-gray-100 shadow-sm"}`}
              >
                {primary && (
                  <>
                    <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
                    <div className="absolute -right-1 bottom-0 w-12 h-12 rounded-full bg-white/5 pointer-events-none" />
                  </>
                )}
                <div className="relative flex items-start justify-between mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${primary ? "bg-white/20" : iconClass}`}
                  >
                    <Icon size={18} className={primary ? "text-white" : ""} />
                  </div>
                </div>
                <p
                  className={`text-2xl font-bold mb-0.5 ${primary ? "text-white" : "text-gray-900"}`}
                >
                  {value}
                </p>
                <p
                  className={`text-xs font-medium ${primary ? "text-white/70" : "text-gray-400"}`}
                >
                  {label}
                </p>
                <p
                  className={`text-[10px] mt-0.5 ${primary ? "text-white/50" : "text-gray-300"}`}
                >
                  {sub}
                </p>
              </div>
            ))}
          </div>

          {/* ── Birthday banner ── */}
          {birthdayUsers.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-3">
              <Gift size={18} className="text-amber-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-800">
                  {birthdayUsers.length} customer
                  {birthdayUsers.length > 1 ? "s have" : " has"} a birthday this
                  month
                </p>
                <p className="text-xs text-amber-600 mt-0.5 truncate">
                  {birthdayUsers.map((u) => u.name.split(" ")[0]).join(", ")}
                </p>
              </div>
              <button
                onClick={() => setFilter("bday")}
                className="flex-shrink-0 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition"
              >
                View all
              </button>
            </div>
          )}

          {/* ── Main grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* ── Left: user list ── */}
            <div className="lg:col-span-2 space-y-4">
              {/* Search + filters */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or phone..."
                    className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108] outline-none bg-gray-50 focus:bg-white transition"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "all", label: "All" },
                    { key: "hot", label: "Regulars" },
                    { key: "returning", label: "Returning" },
                    { key: "new", label: "New" },
                    { key: "cold", label: "Inactive" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setFilter(key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition ${
                        filter === key
                          ? "bg-[#AE2108] text-white"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {label}
                      {key === "all" && !loading && (
                        <span className="ml-1 opacity-70">
                          ({users.length})
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* User list */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                  <div className="p-5 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 animate-pulse"
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 bg-gray-100 rounded-full w-2/5" />
                          <div className="h-2.5 bg-gray-100 rounded-full w-1/4" />
                        </div>
                        <div className="h-6 bg-gray-100 rounded-full w-16" />
                      </div>
                    ))}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Users size={28} className="text-gray-200 mb-3" />
                    <p className="text-sm text-gray-400">No customers found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {filtered.map((user) => {
                      const badge = getUserBadge(user);
                      const av = avatarColor(user.phone);
                      const initials = user.name
                        .split(" ")
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase();
                      const days = daysSince(user.lastOrderDate);
                      const isSelected = selectedUser?.phone === user.phone;

                      return (
                        <div
                          key={user.phone}
                          onClick={() =>
                            setSelectedUser(isSelected ? null : user)
                          }
                          className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-colors ${
                            isSelected
                              ? "bg-[#AE2108]/5"
                              : "hover:bg-gray-50/70"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${av.bg} ${av.text}`}
                          >
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {user.name}
                            </p>
                            <p className="text-[11px] text-gray-400 font-mono">
                              {user.phone}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.style}`}
                            >
                              {badge.label}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {user.orderCount} order
                              {user.orderCount !== 1 ? "s" : ""}
                              {days !== null
                                ? ` · ${days === 0 ? "today" : `${days}d ago`}`
                                : ""}
                            </span>
                          </div>
                          <ChevronRight
                            size={14}
                            className={`flex-shrink-0 transition-transform ${isSelected ? "rotate-90 text-[#AE2108]" : "text-gray-300"}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: top items + detail panel ── */}
            <div className="space-y-4">
              {/* Selected user detail */}
              {selectedUser && (
                <div className="bg-white rounded-2xl border border-[#AE2108]/20 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {selectedUser.name}
                      </p>
                      <p className="text-[11px] text-gray-400 font-mono">
                        {selectedUser.phone}
                      </p>
                    </div>
                    <button onClick={() => setSelectedUser(null)}>
                      <X
                        size={16}
                        className="text-gray-400 hover:text-gray-600"
                      />
                    </button>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Mini stats */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { label: "Orders", value: selectedUser.orderCount },
                        {
                          label: "Total spend",
                          value: `₦${fmt(selectedUser.totalSpend)}`,
                        },
                        {
                          label: "Last order",
                          value: selectedUser.lastOrderDate
                            ? `${daysSince(selectedUser.lastOrderDate)}d ago`
                            : "—",
                        },
                        {
                          label: "Customer since",
                          value: selectedUser.firstOrderDate
                            ? new Date(
                                selectedUser.firstOrderDate,
                              ).toLocaleDateString("en-NG", {
                                month: "short",
                                year: "numeric",
                              })
                            : "—",
                        },
                      ].map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 rounded-xl p-3">
                          <p className="text-[10px] text-gray-400 mb-1">
                            {label}
                          </p>
                          <p className="text-sm font-bold text-gray-900">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Favourite items */}
                    {userFavItems.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-2">
                          Favourite items
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {userFavItems.map(([name, qty]) => (
                            <span
                              key={name}
                              className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full"
                            >
                              {name}
                              <span className="ml-1 text-[#AE2108] font-semibold">
                                ×{qty}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent orders */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">
                        Order history
                      </p>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto">
                        {selectedUser.orders
                          .sort(
                            (a, b) =>
                              new Date(b.createdAt) - new Date(a.createdAt),
                          )
                          .slice(0, 6)
                          .map((o) => (
                            <div
                              key={o._id}
                              className="flex items-center justify-between text-xs"
                            >
                              <span className="text-gray-500 font-mono">
                                #{o.orderId || o._id?.slice(-6).toUpperCase()}
                              </span>
                              <span className="text-gray-400">
                                {new Date(o.createdAt).toLocaleDateString(
                                  "en-NG",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                              </span>
                              <span className="font-semibold text-gray-900">
                                ₦{fmt(o.totalAmount)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => waReminder(selectedUser)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl transition"
                      >
                        <MessageCircle size={13} /> Remind
                      </button>
                      {selectedUser.dob && (
                        <button
                          onClick={() => waBirthday(selectedUser)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-xl transition"
                        >
                          <Gift size={13} /> Birthday
                        </button>
                      )}
                      <a
                        href={`https://wa.me/${selectedUser.phone.replace(/\D/g, "").replace(/^0/, "234")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-xl transition"
                      >
                        <PhoneCall size={13} /> Chat
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* Top items chart */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <p className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-[#AE2108]" />
                  Most ordered items
                </p>
                {loading ? (
                  <div className="space-y-3 animate-pulse">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-2.5 bg-gray-100 rounded-full w-24 flex-shrink-0" />
                        <div className="h-2 bg-gray-100 rounded-full flex-1" />
                      </div>
                    ))}
                  </div>
                ) : topItems.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">
                    No data yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topItems.map(([name, count]) => (
                      <div key={name} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-28 truncate flex-shrink-0">
                          {name}
                        </span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#AE2108] rounded-full transition-all"
                            style={{
                              width: `${Math.round((count / maxItemCount) * 100)}%`,
                            }}
                          />
                        </div>
                        <span className="text-[11px] text-gray-400 w-6 text-right flex-shrink-0">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <p className="text-xs font-semibold text-gray-500 mb-3">
                  Quick actions
                </p>
                <div className="space-y-1">
                  {[
                    {
                      label: "Send bulk reminder",
                      icon: MessageCircle,
                      color: "text-emerald-600",
                      bg: "bg-emerald-50",
                    },
                    {
                      label: "Birthday greetings",
                      icon: Gift,
                      color: "text-amber-600",
                      bg: "bg-amber-50",
                    },
                    {
                      label: "Inactive customers",
                      icon: Clock,
                      color: "text-gray-500",
                      bg: "bg-gray-100",
                    },
                    {
                      label: "Top spenders",
                      icon: UserCheck,
                      color: "text-blue-600",
                      bg: "bg-blue-50",
                    },
                  ].map(({ label, icon: Icon, color, bg }) => (
                    <button
                      key={label}
                      onClick={() => {
                        if (label === "Inactive customers") setFilter("cold");
                        if (label === "Top spenders") setFilter("hot");
                        if (label === "Birthday greetings") setFilter("bday");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group text-left"
                    >
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}
                      >
                        <Icon size={14} className={color} />
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1">
                        {label}
                      </span>
                      <ChevronRight
                        size={13}
                        className="text-gray-300 group-hover:text-[#AE2108] transition-colors"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
