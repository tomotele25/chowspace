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
  Plus,
  Pencil,
  Save,
  Trash2,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";

const BACKENDURL =
 "http://localhost:2005";

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

export default function VendorLocation() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [storeStatus] = useState("opened");
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [managerId, setManagerId] = useState(null);
  const [locations, setLocations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ location: "", price: "" });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unreadChats] = useState(0);

  const router = useRouter();
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;
  const role = session?.user?.role;
  const sessionVendorId = session?.user?.vendorId;
  const sessionUserId = session?.user?.id;
  const vendorName =
    session?.user?.businessName || session?.user?.name || "Vendor";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/Login");
  }, [status]);

  const refetchLocations = async (mId) => {
    try {
      const res = await axios.get(`${BACKENDURL}/api/locations/manager/${mId}`);
      setLocations(res.data.locations || []);
    } catch (err) {
      console.error("Failed to fetch locations:", err);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: resolve managerId
  useEffect(() => {
    if (!role || !token) return;
    if (role === "manager") {
      setManagerId(sessionUserId);
      return;
    }
    if (!sessionVendorId) return;
    const resolve = async () => {
      try {
        const res = await axios.get(`${BACKENDURL}/api/getManagerByVendorId`, {
          params: { vendorId: sessionVendorId },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.managerId) setManagerId(res.data.managerId);
      } catch (err) {
        toast.error("Could not resolve manager account.");
      }
    };
    resolve();
  }, [role, sessionUserId, sessionVendorId, token]);

  // Step 2: fetch locations
  useEffect(() => {
    if (!managerId) return;
    refetchLocations(managerId);
  }, [managerId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return toast.error("Missing token.");
    const tid = toast.loading("Adding location…");
    try {
      await axios.post(
        `${BACKENDURL}/api/createVendorLocation`,
        { location, price },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.dismiss(tid);
      toast.success("Location added!");
      setLocation("");
      setPrice("");
      setFormOpen(false);
      await refetchLocations(managerId);
    } catch (err) {
      toast.dismiss(tid);
      toast.error(err.response?.data?.message || "Failed to create location.");
    }
  };

  const startEditing = (loc) => {
    setEditingId(loc._id);
    setEditValues({ location: loc.location, price: loc.price });
  };

  const saveEdit = async (id) => {
    if (!token || !managerId) return;
    const tid = toast.loading("Saving…");
    try {
      const res = await axios.put(
        `${BACKENDURL}/api/locations/${managerId}`,
        { locations: [{ ...editValues, _id: id }] },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const updated = res.data.locations.find((l) => l._id === id);
      setLocations((prev) => prev.map((l) => (l._id === id ? updated : l)));
      setEditingId(null);
      toast.dismiss(tid);
      toast.success("Location updated!");
    } catch (err) {
      toast.dismiss(tid);
      toast.error(err.response?.data?.message || "Failed to update.");
    }
  };

  const handleDelete = async (id) => {
    if (!token) return;
    const tid = toast.loading("Deleting…");
    try {
      await axios.delete(`${BACKENDURL}/api/locations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocations((prev) => prev.filter((l) => l._id !== id));
      setDeleteConfirm(null);
      toast.dismiss(tid);
      toast.success("Location deleted.");
    } catch (err) {
      toast.dismiss(tid);
      toast.error(err.response?.data?.message || "Failed to delete.");
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

  const minPrice = locations.length
    ? Math.min(...locations.map((l) => Number(l.price)))
    : null;

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
            <span className="font-bold text-gray-900 text-base tracking-tight">
              <span className="text-[#AE2108]">Chowspace</span>
            </span>
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
                className="md:hidden w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu size={18} className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-sm font-bold text-gray-900 leading-tight">
                  Delivery Locations
                </h1>
                <p className="text-[11px] text-gray-400 hidden sm:block leading-tight">
                  Manage where you deliver and set prices
                </p>
              </div>
            </div>
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-1.5 bg-[#AE2108] text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-[#941B06] transition shadow-sm shadow-red-200"
            >
              <Plus size={14} /> Add Location
            </button>
          </header>

          {/* Content */}
          <div className="px-5 py-6 max-w-4xl mx-auto space-y-6">
            {/* Welcome banner */}
            <div className="relative overflow-hidden rounded-2xl bg-[#AE2108] px-6 py-5 shadow-lg shadow-[#AE2108]/15">
              <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute right-10 -bottom-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
              <div className="absolute right-36 top-2 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <p className="text-white/60 text-xs font-medium mb-0.5">
                    Delivery Coverage
                  </p>
                  <h2 className="text-white text-lg font-bold leading-tight">
                    {loading
                      ? "Loading zones…"
                      : `${locations.length} Zone${locations.length !== 1 ? "s" : ""} Active`}
                  </h2>
                  <p className="text-white/60 text-xs mt-1.5">
                    {minPrice != null
                      ? `Minimum delivery fee ₦${minPrice.toLocaleString()}`
                      : "Add your first delivery zone to get started"}
                  </p>
                </div>
                <button
                  onClick={() => setFormOpen(true)}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-xl transition whitespace-nowrap"
                >
                  Add Zone <ChevronRight size={13} />
                </button>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <StatCard
                label="Total Zones"
                value={loading ? "—" : locations.length}
                icon={MapPin}
                primary
              />
              <StatCard
                label="Min. Delivery Fee"
                value={
                  loading
                    ? "—"
                    : minPrice != null
                      ? `₦${minPrice.toLocaleString()}`
                      : "—"
                }
                icon={Wallet}
                trend={
                  locations.length > 0 ? `${locations.length} zones` : undefined
                }
              />
            </div>

            {/* Locations list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Active Locations
                  </h3>
                  {!loading && locations.length > 0 && (
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {locations.length} zone{locations.length !== 1 ? "s" : ""}{" "}
                      configured
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setFormOpen(true)}
                  className="flex items-center gap-1 text-xs text-[#AE2108] font-semibold hover:underline"
                >
                  Add new <ChevronRight size={12} />
                </button>
              </div>

              {loading ? (
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
                      <div className="h-8 bg-gray-100 rounded-xl w-24" />
                    </div>
                  ))}
                </div>
              ) : locations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center px-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#AE2108]/5 border border-[#AE2108]/10 flex items-center justify-center mb-3">
                    <MapPin size={24} className="text-[#AE2108]/40" />
                  </div>
                  <p className="text-sm font-semibold text-gray-500">
                    No delivery zones yet
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    New zones will appear here once added
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {locations.map((loc) => (
                    <div
                      key={loc._id}
                      className={`px-5 py-3.5 transition-colors ${
                        editingId === loc._id
                          ? "bg-amber-50/60"
                          : "hover:bg-gray-50/70"
                      }`}
                    >
                      {editingId === loc._id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                                Location
                              </label>
                              <input
                                type="text"
                                value={editValues.location}
                                onChange={(e) =>
                                  setEditValues((p) => ({
                                    ...p,
                                    location: e.target.value,
                                  }))
                                }
                                className="w-full border-2 border-amber-400 bg-white rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#AE2108]"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                                Price (₦)
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                                  ₦
                                </span>
                                <input
                                  type="number"
                                  value={editValues.price}
                                  onChange={(e) =>
                                    setEditValues((p) => ({
                                      ...p,
                                      price: e.target.value,
                                    }))
                                  }
                                  className="w-full border-2 border-amber-400 bg-white rounded-xl pl-7 pr-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#AE2108]"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveEdit(loc._id)}
                              className="flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-emerald-600 transition"
                            >
                              <Save size={13} /> Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-semibold px-4 py-2 rounded-xl hover:bg-gray-200 transition"
                            >
                              <X size={13} /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#AE2108]/8 flex items-center justify-center flex-shrink-0">
                            <MapPin size={15} className="text-[#AE2108]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {loc.location}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5">
                              ₦{Number(loc.price).toLocaleString()} delivery fee
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => startEditing(loc)}
                              className="flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-2 rounded-xl hover:bg-gray-200 transition"
                            >
                              <Pencil size={12} />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(loc._id)}
                              className="flex items-center gap-1.5 bg-red-50 text-[#AE2108] text-xs font-semibold px-3 py-2 rounded-xl hover:bg-red-100 transition"
                            >
                              <Trash2 size={12} />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── Add Location Modal ── */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setFormOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md p-6 z-10">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Add New Zone
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Set a delivery location and fee
                </p>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
              >
                <X size={15} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Location Name
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium bg-gray-50 focus:bg-white focus:border-[#AE2108] focus:outline-none focus:ring-2 focus:ring-[#AE2108]/10 transition"
                  placeholder="e.g. Lekki Phase 1"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                  Delivery Fee (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
                    ₦
                  </span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm font-medium bg-gray-50 focus:bg-white focus:border-[#AE2108] focus:outline-none focus:ring-2 focus:ring-[#AE2108]/10 transition"
                    placeholder="e.g. 2000"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#AE2108] text-white text-sm font-semibold hover:bg-[#941B06] transition shadow-sm shadow-red-200"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 z-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-[#AE2108]" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2">
              Delete Location?
            </h3>
            <p className="text-sm text-gray-400 mb-6">
              This will permanently remove{" "}
              <span className="font-semibold text-gray-700">
                {locations.find((l) => l._id === deleteConfirm)?.location}
              </span>{" "}
              from your delivery zones.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3 rounded-xl bg-[#AE2108] text-white text-sm font-semibold hover:bg-[#941B06] transition shadow-sm shadow-red-200"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
