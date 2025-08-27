"use client";

import { useEffect, useState, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import axios from "axios";
import { useRouter } from "next/router";
import Link from "next/link";
import {
  LayoutDashboard,
  PackageOpen,
  LogOut,
  Menu,
  X,
  UtensilsCrossed,
  Settings,
  LocationEditIcon,
  MoreHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ManagerOrder() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState("");
  const [assignModal, setAssignModal] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [newOrderIds, setNewOrderIds] = useState([]);
  const [assignStep, setAssignStep] = useState(1);
  const [location, setLocation] = useState({ from: "", to: "" });
  const [price, setPrice] = useState(0);
  const [platformLocations, setPlatformLocations] = useState([]);
  const audioRef = useRef(null);
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  const BACKENDURL =
    process.env.NODE_ENV === "production"
      ? "https://api.chowspace.ng"
      : "http://localhost:2006";

  // Poll orders + disputes
  useEffect(() => {
    if (status !== "authenticated") return;

    const interval = setInterval(async () => {
      try {
        const token = session?.user?.accessToken;
        if (!token) return;

        const [resOrders, resDisputes] = await Promise.all([
          axios.get(`${BACKENDURL}/api/manager/orders`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BACKENDURL}/api/get-disputes`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const filtered = (resOrders.data.orders || []).filter((order) => {
          const orderDate = new Date(order.createdAt)
            .toISOString()
            .slice(0, 10);
          return orderDate === dateFilter;
        });

        const newOnes = filtered.filter(
          (order) => !orders.find((o) => o._id === order._id)
        );

        if (newOnes.length > 0) {
          setNewOrderIds((prev) => [...prev, ...newOnes.map((o) => o._id)]);
          if (audioRef.current) {
            audioRef.current.muted = false;
            audioRef.current.volume = 1;
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          }
          toast.success("New order received!");
        }

        setOrders(filtered || []);
        setDisputes(resDisputes.data.disputes || []);
      } catch (err) {
        console.error("Failed to load orders or disputes:", err);
        setError("Failed to load orders or disputes");
      } finally {
        setLoading(false);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status, session, dateFilter, orders]);

  // Fetch riders when modal opens
  useEffect(() => {
    if (!assignModal) return;
    const fetchRiders = async () => {
      try {
        const res = await axios.get(`${BACKENDURL}/api/rider/get-riders`);
        setRiders(Array.isArray(res.data.riders) ? res.data.riders : []);
      } catch (err) {
        console.error("Failed to load riders:", err);
        toast.error("Failed to load riders");
      }
    };
    fetchRiders();
  }, [assignModal]);

  // Fetch platform locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await axios.get(`${BACKENDURL}/api/platform-locations`);
        const locations = Array.isArray(res.data.locations)
          ? res.data.locations
          : [];
        setPlatformLocations(
          locations.map((loc) => ({
            _id: loc._id,
            name: loc.name || "Unknown",
            location:
              typeof loc.location === "string" ? loc.location : "Unknown",
            price: loc.price || 0,
          }))
        );
      } catch (err) {
        console.error("Failed to load platform locations:", err);
        toast.error("Failed to load platform locations");
        setPlatformLocations([]);
      }
    };
    fetchLocations();
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const handleLogout = () => signOut({ callbackUrl: "/Login" });

  const assignOrderToRider = async () => {
    if (!selectedRider || !assignModal || !location.from || !location.to) {
      toast.error("Please complete all fields");
      return;
    }
    setAssigning(true);
    try {
      await axios.post(`${BACKENDURL}/api/rider/assign-order`, {
        orderId: assignModal._id,
        riderId: selectedRider,
        from: location.from,
        to: location.to,
        price,
      });

      toast.success("Order assigned successfully!");
      setOrders((prev) =>
        prev.map((o) =>
          o._id === assignModal._id
            ? { ...o, rider: selectedRider, status: "assigned" }
            : o
        )
      );
      setAssignModal(null);
      setSelectedRider("");
      setAssignStep(1);
      setLocation({ from: "", to: "" });
      setPrice(0);
    } catch (err) {
      console.error("Failed to assign rider:", err);
      toast.error("Failed to assign rider");
    } finally {
      setAssigning(false);
    }
  };

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  return (
    <div className="flex h-screen bg-gray-50 relative">
      {/* Sidebar + Mobile Header */}
      <div className="md:hidden flex justify-between items-center px-4 py-3 bg-white shadow z-30 w-full fixed top-0">
        <h1 className="text-xl font-bold text-[#AE2108]">Manager Panel</h1>
        <button onClick={toggleSidebar}>
          {sidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white shadow-xl flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div>
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-xl font-bold text-[#AE2108]">Manager Panel</h2>
            <button onClick={toggleSidebar} className="md:hidden">
              <X />
            </button>
          </div>
          <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
            <Link
              href="/vendors/ManagerDashboard"
              className="flex items-center gap-2 text-gray-700 font-semibold hover:text-[#AE2108]"
            >
              <LayoutDashboard size={18} /> Dashboard
            </Link>
            <Link
              href="/vendors/ManageLocation"
              className="flex items-center gap-2 text-gray-700 hover:text-[#AE2108]"
            >
              <LocationEditIcon size={18} /> Locations
            </Link>
            <Link
              href="/manager/ManagerOrder"
              className="flex items-center gap-2 text-[#AE2108] font-semibold"
            >
              <UtensilsCrossed size={18} /> Orders
            </Link>
            <Link
              href="/vendors/ManageProducts"
              className="flex items-center gap-2 text-gray-700 hover:text-[#AE2108]"
            >
              <PackageOpen size={18} /> Products
            </Link>
            <Link
              href="/manager/Profile"
              className="flex items-center gap-2 text-gray-700 hover:text-[#AE2108]"
            >
              <Settings size={18} /> Profile
            </Link>
          </nav>
        </div>
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:bg-red-100 px-3 py-2 rounded-lg w-full transition"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {/* Main */}
      <main className="flex-1 pt-16 md:pt-0 md:ml-64 p-6 overflow-auto">
        {/* Header + Date Filter */}
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold text-[#AE2108]">Manage Orders</h1>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Date:</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => {
                  setLoading(true);
                  setDateFilter(e.target.value);
                }}
                className="border border-gray-300 px-3 py-1 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#AE2108]/50"
              />
            </div>
          </div>
        </div>

        {/* Orders */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-gray-200 border-t-[#AE2108] rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium">
              Loading orders for {dateFilter || "today"}...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-red-500 font-medium">{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-gray-500 font-medium">
              No orders found for {dateFilter}.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {filteredOrders.map((order) => {
              const disp = disputes.find((d) => d.orderId === order._id);
              return (
                <div
                  key={order._id}
                  className="bg-white rounded-xl shadow-md p-5 hover:shadow-lg transition border border-gray-100 flex flex-col overflow-hidden"
                >
                  {/* Header */}
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-800">
                        #{order._id.slice(-6).toUpperCase()}
                      </span>
                      {newOrderIds.includes(order._id) &&
                        order.status !== "completed" && (
                          <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                            NEW
                          </span>
                        )}
                    </div>
                    <button
                      onClick={() => setAssignModal(order)}
                      disabled={order.status !== "pending"}
                      className={`text-sm px-3 py-1 rounded-lg transition ${
                        order.status === "pending"
                          ? "bg-[#AE2108] text-white hover:bg-[#941B06]"
                          : "bg-gray-300 text-gray-600 cursor-not-allowed"
                      }`}
                    >
                      <MoreHorizontal />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="flex flex-col gap-2 text-sm text-gray-700">
                    <span>
                      <strong>Customer:</strong>{" "}
                      {order.guestInfo?.name ||
                        order.customerId?.fullname ||
                        "N/A"}
                    </span>
                    <span>
                      <strong>Total:</strong> ₦{order.totalAmount || 0}
                    </span>
                    <span>
                      <strong>Delivery:</strong> {order.deliveryMethod || "N/A"}
                    </span>
                    <span>
                      <strong>Phone:</strong> {order.guestInfo?.phone || "N/A"}
                    </span>
                    <span>
                      <strong>Address:</strong>{" "}
                      {order.guestInfo?.address || "N/A"}
                    </span>
                  </div>

                  {/* Items */}
                  <details className="mt-3 border-t pt-2 group">
                    <summary className="cursor-pointer font-medium text-gray-700 hover:text-[#AE2108]">
                      Items ({order.items?.length || 0})
                    </summary>
                    <div className="mt-2 max-h-40 overflow-y-auto text-sm text-gray-600 space-y-1 transition-all duration-300">
                      {(order.items || []).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between border-b py-1"
                        >
                          <span>{item.name || "Unknown Item"}</span>
                          <span>x{item.quantity || 0}</span>
                        </div>
                      ))}
                    </div>
                  </details>

                  {/* Dispute */}
                  <div className="mt-3">
                    {disp?.message ? (
                      <span className="inline-block bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs">
                        Dispute: {disp.message}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">No dispute</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Assign Rider Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg relative">
            <button
              onClick={() => setAssignModal(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-lg font-bold"
            >
              ✕
            </button>

            {/* Step Indicator */}
            <div className="flex items-center justify-between mb-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex-1 flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      assignStep >= step
                        ? "bg-[#AE2108] text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        assignStep > step ? "bg-[#AE2108]" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Steps */}
            {assignStep === 1 && (
              <div>
                <h2 className="text-lg font-bold mb-4">
                  Step 1: Select Rider for Order #
                  {assignModal._id?.slice(-6).toUpperCase() || "N/A"}
                </h2>

                {/* Dropdown */}
                <select
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[#AE2108]/50"
                  value={selectedRider}
                  onChange={(e) => setSelectedRider(e.target.value)}
                >
                  <option value="">Select a rider</option>
                  {(riders || []).map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.fullname || "Unknown Rider"} ({r.contact || "N/A"}) -{" "}
                      <span
                        className={`inline-flex items-center gap-1 text-sm ${
                          r.status?.toLowerCase() === "active"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            r.status?.toLowerCase() === "active"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        ></span>
                        {r.status?.toUpperCase() || "N/A"}
                      </span>
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    if (!selectedRider) {
                      toast.error("Please select a rider");
                      return;
                    }
                    const rider = riders.find((r) => r._id === selectedRider);
                    if (rider?.status?.toLowerCase() !== "active") {
                      toast.error("Cannot assign to an inactive rider");
                      return;
                    }
                    setAssignStep(2);
                  }}
                  className="w-full bg-[#AE2108] text-white px-4 py-2 rounded-lg hover:bg-[#941B06]"
                >
                  Next
                </button>
              </div>
            )}

            {assignStep === 2 && (
              <div>
                <h2 className="text-lg font-bold mb-4">Step 2: Delivery</h2>

                {/* From (Pickup) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Pickup (From)
                  </label>
                  <input
                    type="text"
                    value={location.from}
                    onChange={(e) =>
                      setLocation((prev) => ({ ...prev, from: e.target.value }))
                    }
                    placeholder="Enter pickup location"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#AE2108]/50"
                  />
                </div>

                {/* To (Delivery) */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Delivery (To)
                  </label>
                  <select
                    value={location.to}
                    onChange={(e) => {
                      const to = e.target.value;
                      setLocation((prev) => ({ ...prev, to }));
                      const selectedLoc = platformLocations.find(
                        (loc) => loc.name === to
                      );
                      setPrice(selectedLoc?.price || 0);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#AE2108]/50"
                  >
                    <option value="">Select delivery location</option>
                    {(platformLocations || []).map((loc) => (
                      <option key={loc._id} value={loc.name}>
                        {loc.location || "Unknown Location"} - ₦{loc.price || 0}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <span className="text-sm font-medium">
                    Price: ₦{price || 0}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setAssignStep(1)}
                    className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Back
                  </button>
                  <button
                    onClick={assignOrderToRider}
                    className="w-full bg-[#AE2108] text-white px-4 py-2 rounded-lg hover:bg-[#941B06]"
                    disabled={assigning}
                  >
                    {assigning ? "Assigning..." : "Assign Rider"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
