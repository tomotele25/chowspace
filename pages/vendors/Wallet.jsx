"use client";

import { BACKENDURL } from "@/lib/api";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  Menu,
  X,
  LayoutDashboard,
  PackageOpen,
  UtensilsCrossed,
  Wallet,
  User,
  Users,
  Settings,
  LogOut,
  ArrowDown,
} from "lucide-react";
import Link from "next/link";
import { signOut } from "next-auth/react";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/vendors/Dashboard" },
  { name: "Orders", icon: PackageOpen, path: "/vendors/Orders" },
  { name: "Products", icon: UtensilsCrossed, path: "/vendors/ManageProducts" },
  { name: "Wallet", icon: Wallet, path: "/vendors/Wallet" },
  { name: "Profile", icon: User, path: "/vendors/Profile" },
  { name: "Manage Team", icon: Users, path: "/vendors/ManageTeam" },
  { name: "Settings", icon: Settings, path: "/vendor/settings" },
];


export default function VendorWalletPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/Login");
    }
  }, [status]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(
          `${BACKENDURL}/api/getAllOrders?vendorId=${session?.user?.vendorId}`
        );
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      fetchOrders();
    }
  }, [session, status]);

  const paidOrders = orders.filter((o) => o.paymentStatus === "paid");

  const filteredOrders = filterDate
    ? paidOrders.filter(
        (o) => new Date(o.createdAt).toISOString().slice(0, 10) === filterDate
      )
    : paidOrders;

  const totalRevenue = filteredOrders.reduce((sum, o) => {
    const vendorAmount = o.totalAmount * 0.95;
    return sum + vendorAmount;
  }, 0);

  const recentTransactions = filteredOrders.slice(0, 5).map((order) => ({
    id: order._id,
    amount: order.totalAmount,
    customer: order.guestInfo?.name || "Unknown customer",
    description: `Payment from ${order.guestInfo?.name || "someone"} for ${
      order.items?.length || 0
    } item${order.items?.length > 1 ? "s" : ""}`,
    date: new Date(order.createdAt).toLocaleDateString(),
  }));

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`fixed z-30 inset-y-0 left-0 w-64 bg-white shadow-md flex flex-col justify-between transform transition-transform duration-200 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0`}
      >
        <div className="flex flex-col flex-grow">
          <div className="flex items-center justify-between px-4 py-4 border-b">
            <h1 className="text-xl font-bold text-[#AE2108]">Chowspace</h1>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden">
              <X size={24} />
            </button>
          </div>
          <nav className="mt-4 space-y-1 px-4 flex-1 overflow-auto">
            {menuItems.map(({ name, icon: Icon, path }) => (
              <Link
                key={name}
                href={path}
                className="flex items-center gap-3 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md"
              >
                <Icon size={18} />
                {name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="px-4 py-4 border-t">
          <button
            onClick={() => signOut({ callbackUrl: "/Login" })}
            className="flex items-center gap-3 text-red-500 hover:bg-red-100 px-3 py-2 rounded-md w-full"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#f7f7f7] p-6 md:p-8">
        {/* Page Header */}
        <header className="flex items-center justify-between mb-6">
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-200 transition"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <h2 className="text-2xl font-semibold text-[#AE2108]">
            Wallet Overview
          </h2>
        </header>

        {/* Top Section: Balance left, Filter right */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 max-w-full gap-4">
          {/* Available Balance */}
          <div
            className="bg-white rounded-xl shadow-md p-6 max-w-md w-full"
            aria-label="Wallet balance summary"
          >
            <p className="text-gray-700 text-base font-medium mb-1">
              Available Balance{" "}
              {filterDate
                ? `(Filtered by ${new Date(filterDate).toLocaleDateString()})`
                : "(All Time)"}
            </p>
            <h3 className="text-3xl font-bold text-[#AE2108] truncate">
              ₦
              {totalRevenue.toLocaleString(undefined, {
                maximumFractionDigits: 2,
              })}
            </h3>
          </div>

          {/* Date Filter */}
          <div className="max-w-xs w-full">
            <label
              htmlFor="filterDate"
              className="block mb-1 font-medium text-gray-700"
            >
              Filter by Date
            </label>
            <input
              type="date"
              id="filterDate"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#AE2108] transition text-sm"
              max={new Date().toISOString().slice(0, 10)}
              aria-label="Filter transactions by date"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate("")}
                className="mt-2 text-sm text-[#AE2108] hover:underline font-semibold"
                type="button"
                aria-label="Clear date filter"
              >
                Clear Filter
              </button>
            )}
          </div>
        </section>

        {/* Recent Transactions */}
        <section
          className="bg-white rounded-xl shadow-md p-6 max-w-full w-full"
          aria-label="Recent transactions"
        >
          <h4 className="text-xl font-semibold mb-4 text-gray-900">
            Recent Transactions
          </h4>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading transactions...</p>
          ) : recentTransactions.length === 0 ? (
            <p className="text-gray-500 text-sm">
              {filterDate
                ? "No transactions on selected date."
                : "No transactions yet."}
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {recentTransactions.map((txn) => (
                <li
                  key={txn.id}
                  className="py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0"
                >
                  <div>
                    <p className="text-base font-semibold text-gray-800">
                      {txn.description}
                    </p>
                    <p className="text-xs text-gray-500">{txn.date}</p>
                  </div>
                  <div className="text-lg font-semibold text-green-600 flex items-center gap-1">
                    <ArrowDown size={18} />₦{txn.amount.toLocaleString()}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
