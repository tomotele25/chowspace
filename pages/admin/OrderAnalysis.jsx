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
} from "lucide-react";
import Link from "next/link";
import axios from "axios";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { name: "Manage Vendors", icon: Users, path: "/admin/ManageVendor" },
  { name: "Settings", icon: Settings, path: "/admin/settings" },
  { name: "Promotion", icon: Settings, path: "/admin/Promotion" },
  { name: "Order Analysis", icon: Settings, path: "/admin/OrderAnalysis" },
  {
    name: "Contact Support",
    icon: PhoneCall,
    path: "/admin/AdminContactSupport",
  },
];

const BACKENDURL =
  "https://chowspace-backend.vercel.app" || "http://localhost:2005";

const OrderAnalysis = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [orders, setOrders] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [filterDate, setFilterDate] = useState("");
  const [filterType, setFilterType] = useState("daily"); // New state for filter type
  const [filteredOrders, setFilteredOrders] = useState([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/Login");
  }, [status, router]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const logout = async () => {
    await signOut({ callbackUrl: "/Login" });
  };

  // Fetch vendors
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await axios.get(`${BACKENDURL}/api/vendor/getVendors`);
        setVendors(res.data.vendors || []);
      } catch (err) {
        console.error("Failed to fetch vendors:", err);
      }
    };
    fetchVendors();
  }, []);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!session?.user?.accessToken) return;

      try {
        const res = await axios.get(`${BACKENDURL}/api/getAllOrdersForAdmin`, {
          headers: {
            Authorization: `Bearer ${session.user.accessToken}`,
          },
        });
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      }
    };
    fetchOrders();
  }, [session]);

  const isSameUTCDate = (d1, d2) => {
    return (
      d1.getUTCFullYear() === d2.getUTCFullYear() &&
      d1.getUTCMonth() === d2.getUTCMonth() &&
      d1.getUTCDate() === d2.getUTCDate()
    );
  };

  // Helper to get the start and end of the week for a given date
  const getWeekRange = (date) => {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getUTCDay();
    const startOfWeek = new Date(selectedDate);
    startOfWeek.setUTCDate(
      selectedDate.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
    ); // Monday
    startOfWeek.setUTCHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6); // Sunday
    endOfWeek.setUTCHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
  };

  const getVendorOrders = (vendorId, date = null, type = "daily") => {
    let filtered = orders.filter(
      (order) => order.vendorId?._id?.toString() === vendorId.toString()
    );

    if (date) {
      if (type === "daily") {
        filtered = filtered.filter((order) =>
          isSameUTCDate(new Date(order.createdAt), new Date(date))
        );
      } else if (type === "weekly") {
        const { startOfWeek, endOfWeek } = getWeekRange(date);
        filtered = filtered.filter((order) => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= startOfWeek && orderDate <= endOfWeek;
        });
      }
    }
    return filtered;
  };

  const getVendorSummary = (vendorId) => {
    const today = new Date();
    const vendorOrders = getVendorOrders(vendorId, today);

    const gross = vendorOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const commission = vendorOrders.length * 60;
    const net = gross - commission;

    return { gross, commission, net, count: vendorOrders.length };
  };

  const openVendorModal = (vendor) => {
    setSelectedVendor(vendor);
    const vendorOrders = getVendorOrders(vendor._id);
    setFilteredOrders(vendorOrders);
    setFilterDate("");
    setFilterType("daily"); // Reset to daily when opening modal
    setModalOpen(true);
  };

  const applyDateFilter = () => {
    if (!selectedVendor) return;
    const date = filterDate ? new Date(filterDate) : null;
    const vendorOrders = getVendorOrders(selectedVendor._id, date, filterType);
    setFilteredOrders(vendorOrders);
  };

  const resetDateFilter = () => {
    if (!selectedVendor) return;
    const vendorOrders = getVendorOrders(selectedVendor._id);
    setFilteredOrders(vendorOrders);
    setFilterDate("");
    setFilterType("daily");
  };

  const getFilteredSummary = () => {
    const gross = filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const commission = filteredOrders.length * 60;
    const net = gross - commission;
    return { gross, commission, net, count: filteredOrders.length };
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed z-30 inset-y-0 left-0 w-64 bg-white shadow-md transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 flex flex-col justify-between ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="flex items-center justify-between px-4 py-4 border-b">
            <h1 className="text-xl font-bold text-[#AE2108]">Admin Panel</h1>
            <button onClick={toggleSidebar} className="md:hidden text-gray-600">
              <X size={24} />
            </button>
          </div>
          <nav className="mt-4 space-y-1 px-4">
            {menuItems.map(({ name, icon: Icon, path }) => (
              <Link
                key={name}
                href={path}
                className="flex items-center gap-3 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md"
              >
                <Icon size={18} />
                <span>{name}</span>
              </Link>
            ))}
          </nav>
        </div>
        <div className="px-4 mb-4">
          <button
            onClick={logout}
            className="flex items-center gap-3 text-red-500 hover:bg-red-100 px-3 py-2 rounded-md w-full"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-4 py-3 bg-white shadow-md sticky top-0 z-10">
          <button className="md:hidden text-gray-700" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <h2 className="text-lg font-semibold text-gray-800">
            Admin Dashboard
          </h2>
        </header>

        <main className="flex-1 p-6">
          <h2 className="text-2xl font-bold mb-6">Vendors Overview</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {vendors.length > 0 ? (
              vendors.map((vendor) => {
                const { gross, commission, net, count } = getVendorSummary(
                  vendor._id
                );
                return (
                  <div
                    key={vendor._id}
                    className="bg-white rounded-lg shadow-md p-4 flex flex-col justify-between"
                  >
                    <h3 className="text-xl font-semibold text-[#AE2108]">
                      {vendor.businessName}
                    </h3>
                    <p className="text-gray-600 mt-2">
                      Total Orders Today: {count}
                    </p>
                    <p className="text-gray-600">
                      Gross: ₦{gross.toLocaleString()}
                    </p>
                    <p className="text-gray-600">
                      Our Commission: ₦{commission.toLocaleString()}
                    </p>
                    <p className="text-gray-600">
                      Vendor Net: ₦{net.toLocaleString()}
                    </p>
                    <p className="text-gray-500 mt-1">
                      Status: {vendor.status || "Active"}
                    </p>
                    <button
                      onClick={() => openVendorModal(vendor)}
                      className="mt-4 text-sm text-white bg-[#AE2108] hover:bg-[#941B06] px-3 py-2 rounded-md"
                    >
                      View Orders
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-500 col-span-full">No vendors found.</p>
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
      {modalOpen && selectedVendor && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {selectedVendor.businessName} Orders
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex gap-2 mb-4 items-center">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border px-2 py-1 rounded"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="border px-2 py-1 rounded"
                disabled={filterType === "weekly" && !filterDate} // Optional: Disable until a date is selected
              />
              <button
                onClick={applyDateFilter}
                className="px-3 py-1 bg-[#AE2108] text-white rounded hover:bg-[#941B06]"
              >
                Filter
              </button>
              <button
                onClick={resetDateFilter}
                className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Reset
              </button>
            </div>

            {filteredOrders.length > 0 ? (
              <>
                {(() => {
                  const { gross, commission, net, count } =
                    getFilteredSummary();
                  return (
                    <div className="mb-4 space-y-1">
                      <p className="font-semibold">Total Orders: {count}</p>
                      <p className="font-semibold">
                        Gross Amount: ₦{gross.toLocaleString()}
                      </p>
                      <p className="font-semibold">
                        Our Commission: ₦{commission.toLocaleString()}
                      </p>
                      <p className="font-semibold">
                        Vendor Net: ₦{net.toLocaleString()}
                      </p>
                    </div>
                  );
                })()}

                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border px-2 py-1">#</th>
                      <th className="border px-2 py-1">Customer</th>
                      <th className="border px-2 py-1">Items</th>
                      <th className="border px-2 py-1">Gross</th>
                      <th className="border px-2 py-1">Net</th>
                      <th className="border px-2 py-1">Status</th>
                      <th className="border px-2 py-1">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order, idx) => (
                      <tr key={order._id}>
                        <td className="border px-2 py-1">{idx + 1}</td>
                        <td className="border px-2 py-1">
                          {order.guestInfo?.name ||
                            order.customerId?.email ||
                            "Guest"}
                        </td>
                        <td className="border px-2 py-1">
                          {order.items
                            ?.map((i) => `${i.name} x${i.quantity}`)
                            .join(", ")}
                        </td>
                        <td className="border px-2 py-1">
                          ₦{order.totalAmount.toLocaleString()}
                        </td>
                        <td className="border px-2 py-1">
                          ₦{(order.totalAmount - 60).toLocaleString()}
                        </td>
                        <td className="border px-2 py-1">{order.status}</td>
                        <td className="border px-2 py-1">
                          {order.paymentStatus}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <p className="text-gray-500">
                No orders found for selected{" "}
                {filterType === "daily" ? "date" : "week"}.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderAnalysis;
