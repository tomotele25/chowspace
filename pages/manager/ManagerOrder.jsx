"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import toast from "react-hot-toast";

export default function ManagerOrder() {
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  const router = useRouter();
  const BACKENDURL =
    "https://chowspace-backend.vercel.app" || "http://localhost:2006";

  useEffect(() => {
    const fetchManagerOrders = async () => {
      try {
        const token = session?.user?.accessToken;
        if (!token) return;

        const res = await axios.get(`${BACKENDURL}/api/manager/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const filtered = (res.data.orders || []).filter((order) => {
          const orderDate = new Date(order.createdAt)
            .toISOString()
            .slice(0, 10);
          return orderDate === dateFilter;
        });

        setOrders(filtered);
      } catch (err) {
        console.error(err);
        setError("Failed to load orders");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchManagerOrders();
    }
  }, [status, session, dateFilter]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleToggleStatus = async (orderId, currentStatus) => {
    const newStatus = currentStatus === "pending" ? "completed" : "pending";

    try {
      await axios.put(
        `${BACKENDURL}/api/order/${orderId}`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${session?.user?.accessToken}`,
          },
        }
      );

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast.success(`Order marked as ${newStatus}`);
    } catch (err) {
      console.error("Status update failed", err);
      toast.error("Failed to update order status");
    }
  };

  const handleCleanup = async () => {
    try {
      const token = session?.user?.accessToken;
      if (!token) return toast.error("Unauthorized");

      await axios.delete(`${BACKENDURL}/api/cleanupPendingOrders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Pending unpaid orders cleaned up");
      router.reload();
    } catch (err) {
      console.error("Cleanup failed", err);
      toast.error("Failed to cleanup pending orders");
    }
  };

  const filteredOrders =
    statusFilter === "all"
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  const getPaymentStatusClasses = (paymentStatus) => {
    switch ((paymentStatus || "").toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-700";
      case "pending":
      case "unpaid":
        return "bg-yellow-100 text-yellow-700";
      default:
        return "bg-red-100 text-red-700";
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Mobile Topbar */}
      <div className="md:hidden flex justify-between items-center px-4 py-3 bg-white shadow z-30 w-full fixed top-0">
        <h1 className="text-xl font-bold text-[#AE2108]">Manager Panel</h1>
        <button onClick={toggleSidebar}>
          {sidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed z-40 top-0 left-0 h-full w-64 bg-white shadow transform transition-transform duration-300 ease-in-out flex flex-col justify-between
        ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div>
          <div className="hidden md:flex items-center justify-center py-4 border-b">
            <h1 className="text-xl font-bold text-[#AE2108]">Manager Panel</h1>
          </div>
          <nav className="mt-4 space-y-2 px-4">
            <Link
              href="/vendors/ManagerDashboard"
              className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
            <Link
              href="/manager/ManagerOrder"
              className="flex items-center gap-3 px-3 py-2 text-[#AE2108] bg-gray-100 rounded font-semibold"
            >
              <UtensilsCrossed size={18} />
              Orders
            </Link>
            <Link
              href="/vendors/ManageProducts"
              className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              <PackageOpen size={18} />
              Products
            </Link>
            <Link
              href="/manager/profile"
              className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded"
            >
              <Settings size={18} />
              Profile
            </Link>
          </nav>
        </div>
        <div className="p-4 border-t">
          <button
            onClick={() => signOut({ callbackUrl: "/Login" })}
            className="flex items-center gap-2 text-red-600 hover:bg-red-100 px-3 py-2 rounded w-full"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 pt-16 md:pt-0 md:ml-64 p-6 overflow-auto">
        {/* Filters */}
        <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-bold text-[#AE2108]">Manage Orders</h1>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Date:</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="border border-gray-300 px-3 py-1 rounded text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">
                Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 px-3 py-1 rounded text-sm"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <button
              onClick={handleCleanup}
              className="bg-[#AE2108] hover:bg-red-700 text-white px-4 py-1 text-sm rounded"
            >
              Cleanup Pending Orders
            </button>
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <p className="text-gray-600">Loading orders...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : filteredOrders.length === 0 ? (
          <p className="text-gray-500">No orders found.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl shadow-sm bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="px-4 py-3">Order ID</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Delivery Info</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Toggle</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      #{order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-3">{order.guestInfo?.name}</td>
                    <td className="px-4 py-3">
                      {order.items
                        ?.map((item) => `${item.name} x${item.quantity}`)
                        .join(", ")}
                    </td>
                    <td className="px-4 py-3">₦{order.totalAmount}</td>
                    <td className="px-4 py-3 text-xs">
                      <div>
                        <strong>Phone:</strong>{" "}
                        {order.guestInfo?.phone || "N/A"}
                      </div>
                      <div>
                        <strong>Address:</strong>{" "}
                        {order.guestInfo?.address || "N/A"}
                      </div>
                      <div>
                        <strong>Method:</strong> {order.deliveryMethod || "N/A"}
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === "completed"
                            ? "bg-green-100 text-green-700"
                            : order.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusClasses(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus || "pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() =>
                          handleToggleStatus(order._id, order.status)
                        }
                        className="border border-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-100 text-xs"
                      >
                        Mark{" "}
                        {order.status === "pending" ? "Completed" : "Pending"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
