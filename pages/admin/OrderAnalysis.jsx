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
} from "recharts";

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

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const logout = async () => await signOut({ callbackUrl: "/Login" });

  // Fetch vendors
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await axios.get(`${BACKENDURL}/api/vendor/getVendors`);
        setVendors(res.data.vendors || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchVendors();
  }, []);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      if (!session?.user?.accessToken) return;
      setLoading(true);
      try {
        const res = await axios.get(`${BACKENDURL}/api/getAllOrdersForAdmin`, {
          headers: { Authorization: `Bearer ${session.user.accessToken}` },
        });
        setOrders(res.data.orders || []);
        processAnalytics(res.data.orders || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [session]);

  // Week range helper
  const getWeekRange = (date = new Date()) => {
    const d = new Date(date);
    const day = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  };

  const processAnalytics = (ordersData) => {
    const { start, end } = getWeekRange();
    const weekOrders = ordersData.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= start && d <= end;
    });

    const days = Array.from({ length: 7 }).map((_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      const dayOrders = weekOrders.filter(
        (o) =>
          new Date(o.createdAt) >= dayStart && new Date(o.createdAt) <= dayEnd
      );
      return {
        name: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
      };
    });

    setAnalyticsData(days);
  };

  const totalOrders = analyticsData.reduce((sum, d) => sum + d.orders, 0);
  const totalRevenue = analyticsData.reduce((sum, d) => sum + d.revenue, 0);
  const avgDailyOrders = (totalOrders / 7).toFixed(1);
  const totalCommission =
    orders.filter((o) => {
      const { start, end } = getWeekRange();
      const d = new Date(o.createdAt);
      return d >= start && d <= end;
    }).length * 60;

  const openVendorModal = (vendor) => {
    setSelectedVendor(vendor);
    const vendorOrders = orders.filter((o) => o.vendorId?._id === vendor._id);
    setFilteredOrders(vendorOrders);
    setModalOpen(true);
    setFilterType("daily");
    setFilterDate("");
  };

  const applyFilter = () => {
    if (!selectedVendor) return;
    let filtered = orders.filter((o) => o.vendorId?._id === selectedVendor._id);
    if (filterDate) {
      if (filterType === "daily") {
        filtered = filtered.filter(
          (o) =>
            new Date(o.createdAt).toDateString() ===
            new Date(filterDate).toDateString()
        );
      } else if (filterType === "weekly") {
        const { start, end } = getWeekRange(filterDate);
        filtered = filtered.filter(
          (o) => new Date(o.createdAt) >= start && new Date(o.createdAt) <= end
        );
      }
    }
    setFilteredOrders(filtered);
  };

  const resetFilter = () => {
    if (!selectedVendor) return;
    const vendorOrders = orders.filter(
      (o) => o.vendorId?._id === selectedVendor._id
    );
    setFilteredOrders(vendorOrders);
    setFilterDate("");
    setFilterType("daily");
  };

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed z-30 inset-y-0 left-0 w-64 bg-white shadow-md flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
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
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-64 overflow-auto h-screen">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 bg-white shadow-md sticky top-0 z-10">
          <button className="md:hidden text-gray-700" onClick={toggleSidebar}>
            <Menu size={24} />
          </button>
          <h2 className="text-lg font-semibold text-gray-800">
            Admin Dashboard
          </h2>
        </header>

        {/* Content */}
        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl shadow flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Vendors</p>
                  <h3 className="text-2xl font-bold text-[#AE2108]">
                    {vendors.length}
                  </h3>
                </div>
                <Users className="text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders (Week)</p>
                  <h3 className="text-2xl font-bold text-[#AE2108]">
                    {totalOrders}
                  </h3>
                </div>
                <TrendingUp className="text-green-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <h3 className="text-2xl font-bold text-[#AE2108]">
                    ₦{totalRevenue.toLocaleString()}
                  </h3>
                </div>
                <ArrowUpRight className="text-green-600" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Daily Orders</p>
                  <h3 className="text-2xl font-bold text-[#AE2108]">
                    {avgDailyOrders}
                  </h3>
                </div>
                <Calendar className="text-blue-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Our Commission</p>
                  <h3 className="text-2xl font-bold text-[#AE2108]">
                    ₦{totalCommission.toLocaleString()}
                  </h3>
                </div>
                <TrendingUp className="text-purple-500" />
              </div>
            </div>
          </div>

          {/* Orders Chart */}
          <div className="bg-white p-6 rounded-xl shadow mb-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="text-[#AE2108]" size={18} />
              Orders & Revenue Overview
            </h3>
            <div className="w-full h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#AE2108"
                    strokeWidth={2}
                    name="Orders"
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#16a34a"
                    strokeWidth={2}
                    name="Revenue (₦)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Vendor Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {vendors.map((vendor) => {
              const vendorOrders = orders.filter(
                (o) => o.vendorId?._id === vendor._id
              );
              const gross = vendorOrders.reduce(
                (sum, o) => sum + (o.totalAmount || 0),
                0
              );
              const commission = vendorOrders.length * 60;
              const net = gross - commission;

              return (
                <div
                  key={vendor._id}
                  className="bg-white rounded-lg shadow-md p-4 flex flex-col justify-between"
                >
                  <h3 className="text-xl font-semibold text-[#AE2108]">
                    {vendor.businessName}
                  </h3>
                  <p className="text-gray-600 mt-2">
                    Total Orders: {vendorOrders.length}
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
                    className="mt-3 text-sm text-white bg-[#AE2108] hover:bg-[#941B06] px-3 py-2 rounded-md"
                  >
                    View Customer
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Vendor Modal */}
      {modalOpen && selectedVendor && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-3/4 max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {selectedVendor.businessName} Customers
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
              />
              <button
                onClick={applyFilter}
                className="px-3 py-1 bg-[#AE2108] text-white rounded hover:bg-[#941B06]"
              >
                Filter
              </button>
              <button
                onClick={resetFilter}
                className="px-3 py-1 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Reset
              </button>
            </div>

            {filteredOrders.length > 0 ? (
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
}
