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
  Calendar,
  ArrowUpRight,
  ChevronRight,
  ShoppingBag,
  Wallet,
  Star,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

const menuItems = [
  { name: "Dashboard",       icon: LayoutDashboard, path: "/admin/dashboard" },
  { name: "Manage Vendors",  icon: Users,           path: "/admin/ManageVendor" },
  { name: "Order Analysis",  icon: BarChart3,       path: "/admin/OrderAnalysis" },
  { name: "Promotion",       icon: Star,            path: "/admin/Promotion" },
  { name: "Contact Support", icon: PhoneCall,       path: "/admin/AdminContactSupport" },
  { name: "Settings",        icon: Settings,        path: "/admin/settings" },
];

const BACKENDURL = "https://chowspace-backend.vercel.app" || "http://localhost:2005";

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
          {p.name}: {p.name.includes("Revenue") ? `₦${Number(p.value).toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
}

export default function AdminAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filterType, setFilterType] = useState("daily");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/Login");
  }, [status]);

  const logout = async () => await signOut({ callbackUrl: "/Login" });

  useEffect(() => {
    axios.get(`${BACKENDURL}/api/vendor/getVendors`)
      .then(r => setVendors(r.data.vendors || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    setLoading(true);
    axios.get(`${BACKENDURL}/api/getAllOrdersForAdmin`, {
      headers: { Authorization: `Bearer ${session.user.accessToken}` },
    }).then(r => {
      const o = r.data.orders || [];
      setOrders(o);
      processAnalytics(o);
    }).catch(console.error).finally(() => setLoading(false));
  }, [session]);

  const processAnalytics = (ordersData) => {
    const { start } = getWeekRange();
    const days = Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const s = new Date(day); s.setHours(0,0,0,0);
      const e = new Date(day); e.setHours(23,59,59,999);
      const dayOrders = ordersData.filter(o => {
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
  const weekOrders = orders.filter(o => {
    const d = new Date(o.createdAt);
    return d >= wStart && d <= wEnd;
  });

  const totalOrders   = analyticsData.reduce((s, d) => s + d.orders, 0);
  const totalRevenue  = analyticsData.reduce((s, d) => s + d.revenue, 0);
  const avgDaily      = (totalOrders / 7).toFixed(1);
  const totalCommission = weekOrders.length * 60;

  const openVendorModal = (vendor) => {
    setSelectedVendor(vendor);
    setFilteredOrders(orders.filter(o => o.vendorId?._id === vendor._id));
    setModalOpen(true);
    setFilterType("daily");
    setFilterDate("");
  };

  const applyFilter = () => {
    if (!selectedVendor) return;
    let f = orders.filter(o => o.vendorId?._id === selectedVendor._id);
    if (filterDate) {
      if (filterType === "daily") {
        f = f.filter(o => new Date(o.createdAt).toDateString() === new Date(filterDate).toDateString());
      } else {
        const { start, end } = getWeekRange(filterDate);
        f = f.filter(o => new Date(o.createdAt) >= start && new Date(o.createdAt) <= end);
      }
    }
    setFilteredOrders(f);
  };

  const resetFilter = () => {
    if (!selectedVendor) return;
    setFilteredOrders(orders.filter(o => o.vendorId?._id === selectedVendor._id));
    setFilterDate(""); setFilterType("daily");
  };

  const statCards = [
    { label: "Total Vendors",       value: vendors.length,                          icon: Users,       iconClass: "bg-blue-50 text-blue-500",    primary: false },
    { label: "Orders This Week",    value: totalOrders,                             icon: ShoppingBag, iconClass: "bg-[#AE2108]/8 text-[#AE2108]",primary: true  },
    { label: "Weekly Revenue",      value: `₦${totalRevenue.toLocaleString()}`,     icon: Wallet,      iconClass: "bg-emerald-50 text-emerald-600",primary: false },
    { label: "Avg Daily Orders",    value: avgDaily,                                icon: TrendingUp,  iconClass: "bg-amber-50 text-amber-500",   primary: false },
    { label: "Our Commission",      value: `₦${totalCommission.toLocaleString()}`,  icon: ArrowUpRight,iconClass: "bg-purple-50 text-purple-500", primary: false },
  ];

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* ── Sidebar overlay ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-20 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed z-30 inset-y-0 left-0 w-64 bg-white border-r border-gray-100 flex flex-col shadow-xl transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 md:shadow-none`}>

        {/* Brand */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#AE2108] flex items-center justify-center">
              <span className="text-white font-black text-xs">CS</span>
            </div>
            <span className="font-bold text-gray-900 text-sm tracking-tight">
              <span className="text-[#AE2108]">Chowspace</span> Admin
            </span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center">
            <X size={14} className="text-gray-500" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {menuItems.map(({ name, icon: Icon, path }) => {
            const isActive = router.pathname === path;
            return (
              <Link key={name} href={path} onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                  ${isActive ? "bg-[#AE2108] text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={16} className={isActive ? "text-white" : "text-gray-400 group-hover:text-gray-600"} />
                  <span>{name}</span>
                </div>
                {isActive && <ChevronRight size={13} className="text-white/60" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0">
          <button onClick={logout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">
        {/* Topbar */}
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-100 px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="md:hidden w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center" onClick={() => setSidebarOpen(true)}>
              <Menu size={18} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">Analytics</h1>
              <p className="text-[11px] text-gray-400 hidden sm:block leading-tight">
                Week of {wStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {wEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        </header>

        <div className="px-5 py-6 max-w-7xl mx-auto space-y-6">

          {/* ── Welcome banner ── */}
          <div className="relative overflow-hidden rounded-2xl bg-[#AE2108] px-6 py-5 shadow-lg shadow-[#AE2108]/15">
            <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute right-10 -bottom-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
            <div className="absolute right-36 top-2 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
            <div className="relative flex items-center justify-between gap-4">
              <div>
                <p className="text-white/60 text-xs font-medium mb-0.5">Platform Overview</p>
                <h2 className="text-white text-lg font-bold leading-tight">
                  {loading ? "Loading data…" : `${totalOrders} orders · ₦${totalRevenue.toLocaleString()} revenue`}
                </h2>
                <p className="text-white/60 text-xs mt-1.5">
                  Sunday–Saturday · Commission ₦{totalCommission.toLocaleString()} this week
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 bg-white/15 px-3 py-1.5 rounded-xl">
                <Calendar size={13} className="text-white/70" />
                <span className="text-white text-xs font-semibold">This Week</span>
              </div>
            </div>
          </div>

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {statCards.map(({ label, value, icon: Icon, iconClass, primary }) => (
              <div key={label}
                className={`relative overflow-hidden rounded-2xl p-4 border transition-all hover:-translate-y-0.5 hover:shadow-lg
                  ${primary ? "bg-[#AE2108] border-[#AE2108] shadow-[0_4px_24px_rgba(174,33,8,0.2)]" : "bg-white border-gray-100 shadow-sm"}`}
              >
                {primary && <>
                  <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
                  <div className="absolute -right-1 bottom-0 w-12 h-12 rounded-full bg-white/5 pointer-events-none" />
                </>}
                <div className="relative flex items-start justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${primary ? "bg-white/20" : iconClass}`}>
                    <Icon size={16} className={primary ? "text-white" : ""} />
                  </div>
                </div>
                <p className={`text-xl font-bold mb-0.5 ${primary ? "text-white" : "text-gray-900"}`}>{value}</p>
                <p className={`text-[10px] font-medium ${primary ? "text-white/70" : "text-gray-400"}`}>{label}</p>
              </div>
            ))}
          </div>

          {/* ── Chart ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Orders & Revenue</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Sun → Sat this week</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#AE2108]" /><span className="text-[10px] text-gray-500 font-medium">Orders</span></div>
                <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-[10px] text-gray-500 font-medium">Revenue</span></div>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analyticsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#AE2108" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#AE2108" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="orders"  stroke="#AE2108" strokeWidth={2} fill="url(#gradOrders)"  name="Orders" dot={{ r: 3, fill: "#AE2108" }} />
                  <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#gradRevenue)" name="Revenue (₦)" dot={{ r: 3, fill: "#10b981" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ── Vendor cards ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vendor Breakdown</p>
              <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{vendors.length} vendors</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.map((vendor) => {
                const vOrders = orders.filter(o => o.vendorId?._id === vendor._id);
                const gross = vOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
                const commission = vOrders.length * 60;
                const net = gross - commission;

                return (
                  <div key={vendor._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    {/* header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#AE2108]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#AE2108] font-black text-xs">
                            {vendor.businessName?.slice(0,2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900 truncate max-w-[140px]">{vendor.businessName}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${vendor.status === "opened" ? "bg-emerald-400" : "bg-gray-300"}`} />
                            <p className="text-[10px] text-gray-400 capitalize">{vendor.status || "active"}</p>
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full">{vOrders.length} orders</span>
                    </div>

                    {/* stats row */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      {[
                        { label: "Gross",      value: `₦${gross.toLocaleString()}`,      color: "text-gray-900" },
                        { label: "Commission", value: `₦${commission.toLocaleString()}`, color: "text-[#AE2108]" },
                        { label: "Net",        value: `₦${net.toLocaleString()}`,        color: "text-emerald-600" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                          <p className={`text-xs font-bold ${color} leading-tight`}>{value}</p>
                          <p className="text-[9px] text-gray-400 mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => openVendorModal(vendor)}
                      className="w-full flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-[#AE2108] hover:text-white text-gray-600 text-xs font-semibold px-3 py-2.5 rounded-xl transition-all duration-200 group"
                    >
                      View Orders
                      <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* ── Vendor orders modal ── */}
      {modalOpen && selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col z-10">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-gray-900">{selectedVendor.businessName}</h3>
                <p className="text-xs text-gray-400 mt-0.5">{filteredOrders.length} orders shown</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition">
                <X size={14} className="text-gray-500" />
              </button>
            </div>

            {/* Filters */}
            <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap items-center gap-2 flex-shrink-0">
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="border border-gray-200 text-sm px-3 py-1.5 rounded-xl text-gray-700 focus:outline-none focus:border-[#AE2108] bg-gray-50">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly (Sun–Sat)</option>
              </select>
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)}
                className="border border-gray-200 text-sm px-3 py-1.5 rounded-xl text-gray-700 focus:outline-none focus:border-[#AE2108] bg-gray-50" />
              <button onClick={applyFilter} className="px-4 py-1.5 bg-[#AE2108] text-white text-xs font-semibold rounded-xl hover:bg-[#941B06] transition">Filter</button>
              <button onClick={resetFilter}  className="px-4 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-200 transition">Reset</button>

              {/* quick summary */}
              {filteredOrders.length > 0 && (
                <div className="ml-auto flex items-center gap-3">
                  <span className="text-xs text-gray-500">Total: <span className="font-bold text-gray-900">₦{filteredOrders.reduce((s,o) => s+(o.totalAmount||0),0).toLocaleString()}</span></span>
                  <span className="text-xs text-gray-500">Commission: <span className="font-bold text-[#AE2108]">₦{(filteredOrders.length * 60).toLocaleString()}</span></span>
                </div>
              )}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {filteredOrders.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {["#","Customer","Items","Gross","Net","Status","Payment"].map(h => (
                        <th key={h} className="text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest pb-3 pr-4">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredOrders.map((order, idx) => (
                      <tr key={order._id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="py-3 pr-4 text-xs text-gray-400 font-mono">{idx + 1}</td>
                        <td className="py-3 pr-4 text-xs font-semibold text-gray-900">
                          {order.guestInfo?.name || order.customerId?.email || "Guest"}
                        </td>
                        <td className="py-3 pr-4 text-xs text-gray-500 max-w-[180px] truncate">
                          {order.items?.map(i => `${i.name} ×${i.quantity}`).join(", ")}
                        </td>
                        <td className="py-3 pr-4 text-xs font-bold text-gray-900">₦{order.totalAmount?.toLocaleString()}</td>
                        <td className="py-3 pr-4 text-xs font-bold text-emerald-600">₦{(order.totalAmount - 60).toLocaleString()}</td>
                        <td className="py-3 pr-4">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            order.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                            order.status === "cancelled" ? "bg-red-50 text-red-600" :
                            "bg-amber-50 text-amber-700"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                            order.paymentStatus === "paid" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                          }`}>
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
                  <p className="text-sm font-semibold text-gray-500">No orders found</p>
                  <p className="text-xs text-gray-400 mt-1">Try adjusting the filter or reset to see all orders</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}