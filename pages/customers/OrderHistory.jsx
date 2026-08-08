"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const BACKENDURL =
  "https://chowspace-backend.vercel.app" || "http://localhost:2005";

const OrderHistory = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const customerId = session?.user?.id;
        if (!customerId) return;

        const res = await axios.get(
          `${BACKENDURL}/api/orderHistory/${customerId}`
        );
        setOrders(res.data.orders || []);
      } catch (err) {
        console.error("Error fetching order history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [session]);

  useEffect(() => {
    const filtered = getFilteredOrders();
    const total = filtered.reduce((acc, curr) => acc + curr.totalAmount, 0);
    setTotalSpent(total);
  }, [orders, selectedDate]);

  const getFilteredOrders = () => {
    return selectedDate
      ? orders.filter(
          (order) =>
            new Date(order.createdAt).toDateString() ===
            new Date(selectedDate).toDateString()
        )
      : orders;
  };

  const handleReorder = (order) => {
    if (!order || !order.items) return;

    localStorage.setItem("reorderItems", JSON.stringify(order.items));
    alert("Order added to cart. You can proceed to checkout.");
    // You may want to route to /checkout or /cart page
  };

  const filteredOrders = getFilteredOrders();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-600 text-sm">Loading order history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition"
      >
        <ArrowLeft className="h-5 w-5 mr-2 text-[#AE2108]" />
        Back
      </button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-semibold text-[#AE2108]">Order History</h2>
        <div>
          <label className="text-sm mr-2 text-gray-700">Filter by Date:</label>
          <input
            type="date"
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="mb-6 text-lg font-medium text-[#AE2108]">
        Total Spent: ₦{totalSpent.toLocaleString()}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center text-gray-500">No orders found.</div>
      ) : (
        <ul className="space-y-6">
          {filteredOrders.map((order) => (
            <li
              key={order._id}
              className="border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex justify-between mb-2">
                <span className="font-medium text-gray-700">Vendor</span>
                <span className="text-sm text-gray-800">
                  {order.vendorName || "Unknown Vendor"}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-gray-700">Total</span>
                <span className="text-green-600 font-semibold">
                  ₦{order.totalAmount?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-gray-700">Status</span>
                <span className="capitalize">{order.paymentStatus}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-gray-700">Delivery</span>
                <span>{order.deliveryMethod}</span>
              </div>
              <div className="flex justify-between mb-4">
                <span className="font-medium text-gray-700">Date</span>
                <span>
                  {new Date(order.createdAt).toLocaleDateString("en-NG")}
                </span>
              </div>

              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Items Ordered:
                </p>
                <ul className="text-sm space-y-1 pl-4 list-disc">
                  {order.items?.map((item, idx) => (
                    <li key={idx}>
                      {item.name} × {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleReorder(order)}
                className="mt-3 px-4 py-2 text-sm bg-[#AE2108] text-white rounded hover:bg-[#941B06] transition"
              >
                Reorder
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default OrderHistory;
