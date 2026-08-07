"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
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
  ShoppingBag,
  Wallet,
  TrendingUp,
  Bike,
  ClipboardList,
  UserAnalysis,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import AdminLayout from "@/components/layouts/AdminLayout";
import { requireAdminPage } from "@/lib/requireAdminPage";

const BACKENDURL =
  "https://chowspace-backend.vercel.app" || "http://localhost:2005";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [totalVendors, setTotalVendors] = useState(0);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/Login");
  }, [status]);

  useEffect(() => {
    axios
      .get(`${BACKENDURL}/api/vendor/vendorTotalCount`)
      .then((r) => setTotalVendors(r.data.totalVendor || 0))
      .catch(console.error);

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
      .then((r) => setOrders(r.data.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session]);

  // Week range (Sunday start)
  const getWeekRange = () => {
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  };

  const { start, end } = getWeekRange();
  const weekOrders = orders.filter((o) => {
    const d = new Date(o.createdAt);
    return d >= start && d <= end;
  });
  const weekRevenue = weekOrders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const weekCommission = weekOrders.length * 60;

  // Recent signups — last 5 vendors sorted by createdAt
  const recentVendors = [...vendors]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const statCards = [
    {
      label: "Total Vendors",
      value: totalVendors,
      icon: Users,
      iconClass: "bg-blue-50 text-blue-500",
      primary: false,
    },
    {
      label: "Orders This Week",
      value: loading ? "—" : weekOrders.length,
      icon: ShoppingBag,
      iconClass: "bg-[#AE2108]/8 text-[#AE2108]",
      primary: true,
    },
    {
      label: "Weekly Revenue",
      value: loading ? "—" : `₦${weekRevenue.toLocaleString()}`,
      icon: Wallet,
      iconClass: "bg-emerald-50 text-emerald-600",
      primary: false,
    },
    {
      label: "Commission",
      value: loading ? "—" : `₦${weekCommission.toLocaleString()}`,
      icon: TrendingUp,
      iconClass: "bg-purple-50 text-purple-500",
      primary: false,
    },
  ];

  const greeting =
    new Date().getHours() < 12
      ? "morning"
      : new Date().getHours() < 17
        ? "afternoon"
        : "evening";

  return (
    <AdminLayout
      title="Dashboard"
      subtitle={new Date().toLocaleDateString("en-NG", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}
    >
      <div className="px-5 py-6 max-w-6xl mx-auto space-y-6">
        {/* ── Banner ── */}
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
                {session?.user?.name || "Admin"} 👋
              </h2>
              <p className="text-white/60 text-xs mt-1.5">
                {loading
                  ? "Loading summary…"
                  : `${weekOrders.length} orders · ₦${weekRevenue.toLocaleString()} this week`}
              </p>
            </div>
            <Link
              href="/admin/OrderAnalysis"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-xl transition whitespace-nowrap"
            >
              View Analytics <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map(({ label, value, icon: Icon, iconClass, primary }) => (
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
          ))}
        </div>

        {/* ── Recent signups + Quick actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Recent vendor signups */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Recent Vendor Signups
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Latest {recentVendors.length} registrations
                </p>
              </div>
              <Link
                href="/admin/ManageVendor"
                className="flex items-center gap-1 text-xs text-[#AE2108] font-semibold hover:underline"
              >
                View all <ChevronRight size={12} />
              </Link>
            </div>

            {recentVendors.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 rounded-2xl bg-[#AE2108]/5 border border-[#AE2108]/10 flex items-center justify-center mb-3">
                  <Users size={20} className="text-[#AE2108]/40" />
                </div>
                <p className="text-sm font-semibold text-gray-500">
                  No vendors yet
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentVendors.map((v) => (
                  <div
                    key={v._id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/70 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#AE2108]/8 flex items-center justify-center flex-shrink-0">
                      <span className="text-[#AE2108] font-black text-xs">
                        {v.businessName?.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {v.businessName}
                      </p>
                      <p className="text-[11px] text-gray-400 truncate">
                        {v.email}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          v.status === "opened"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {v.status || "active"}
                      </span>
                      <span className="text-[10px] text-gray-400 hidden sm:block">
                        {v.createdAt
                          ? new Date(v.createdAt).toLocaleDateString("en-NG", {
                              month: "short",
                              day: "numeric",
                            })
                          : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-bold text-gray-900">Quick Actions</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Jump to any section
              </p>
            </div>
            <div className="p-3 space-y-1">
              {[
                {
                  label: "Manage Vendors",
                  icon: Users,
                  path: "/admin/ManageVendor",
                  iconClass: "bg-blue-50 text-blue-500",
                },
                {
                  label: "Manage Riders",
                  icon: Bike,
                  path: "/admin/ManageRiders",
                  iconClass: "bg-amber-50 text-amber-500",
                },
                {
                  label: "Assigned Orders",
                  icon: ClipboardList,
                  path: "/admin/AssignedOrders",
                  iconClass: "bg-purple-50 text-purple-500",
                },
                {
                  label: "Order Analysis",
                  icon: BarChart3,
                  path: "/admin/OrderAnalysis",
                  iconClass: "bg-[#AE2108]/8 text-[#AE2108]",
                },
                {
                  label: "Promotions",
                  icon: Star,
                  path: "/admin/Promotion",
                  iconClass: "bg-emerald-50 text-emerald-600",
                },
              ].map(({ label, icon: Icon, path, iconClass }) => (
                <Link
                  key={label}
                  href={path}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClass}`}
                  >
                    <Icon size={15} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1">
                    {label}
                  </span>
                  <ChevronRight
                    size={13}
                    className="text-gray-300 group-hover:text-[#AE2108] transition-colors"
                  />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent orders ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Recent Orders</h3>
              {!loading && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Last {Math.min(orders.length, 8)} orders across all vendors
                </p>
              )}
            </div>
            <Link
              href="/admin/OrderAnalysis"
              className="flex items-center gap-1 text-xs text-[#AE2108] font-semibold hover:underline"
            >
              Full analysis <ChevronRight size={12} />
            </Link>
          </div>

          {loading ? (
            <div className="p-5 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded-full w-2/5" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-1/4" />
                  </div>
                  <div className="h-6 bg-gray-100 rounded-full w-16" />
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-12 h-12 rounded-2xl bg-[#AE2108]/5 border border-[#AE2108]/10 flex items-center justify-center mb-3">
                <ShoppingBag size={20} className="text-[#AE2108]/40" />
              </div>
              <p className="text-sm font-semibold text-gray-500">
                No orders yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {[...orders]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 8)
                .map((order) => {
                  const st = (order.status || "pending").toLowerCase();
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
                          {order.guestInfo?.name ||
                            order.customerId?.fullname ||
                            "Customer"}
                        </p>
                        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                          #{order._id.slice(-6).toUpperCase()} ·{" "}
                          {order.vendorId?.businessName || ""}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-gray-900">
                          ₦{(order.totalAmount || 0).toLocaleString()}
                        </p>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 inline-block ${
                            st === "completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : st === "cancelled"
                                ? "bg-red-50 text-red-600"
                                : "bg-amber-50 text-amber-700"
                          }`}
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
    </AdminLayout>
  );
}

// Gated before any HTML is sent — the client-side check alone let a
// non-admin render the page and fire its data requests first.
export const getServerSideProps = requireAdminPage();
