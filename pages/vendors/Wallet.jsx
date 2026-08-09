"use client";

import { BACKENDURL } from "@/lib/api";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { ArrowDown } from "lucide-react";

import VendorLayout from "@/components/layouts/VendorLayout";


export default function VendorWalletPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState("");
  const { data: session, status } = useSession();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`${BACKENDURL}/api/getAllOrders`, {
          headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
        });
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
        toast.error("Failed to load wallet transactions");
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
        (o) => new Date(o.createdAt).toISOString().slice(0, 10) === filterDate,
      )
    : paidOrders;

  // What the vendor is actually owed: the order total minus Chowspace's flat
  // service fee. This used to take 95% of the total, a 5% cut that exists
  // nowhere else in the platform — the fee is a flat ₦100 (₦60 before 19 July
  // 2026), charged to the customer on top of the food.
  //
  // `vendorShare` is computed server-side at checkout; the fallback covers
  // orders placed before that existed.
  const totalRevenue = filteredOrders.reduce((sum, o) => {
    const share =
      typeof o.vendorShare === "number"
        ? o.vendorShare
        : Math.max(0, (o.totalAmount || 0) - (o.serviceFee || 0));
    return sum + share;
  }, 0);

  const recentTransactions = filteredOrders.slice(0, 5).map((order) => ({
    id: order._id,
    amount:
      typeof order.vendorShare === "number"
        ? order.vendorShare
        : Math.max(0, (order.totalAmount || 0) - (order.serviceFee || 0)),
    customer: order.guestInfo?.name || "Unknown customer",
    description: `Payment from ${order.guestInfo?.name || "someone"} for ${
      order.items?.length || 0
    } item${order.items?.length > 1 ? "s" : ""}`,
    date: new Date(order.createdAt).toLocaleDateString(),
  }));

  return (
    <VendorLayout
      title="Wallet"
      subtitle={
        filterDate
          ? `Filtered to ${new Date(filterDate).toLocaleDateString()}`
          : "All time earnings"
      }
    >
      <div className="p-4 md:p-6">
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
      </div>
    </VendorLayout>
  );
}
