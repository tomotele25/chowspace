"use client";

import { BACKENDURL } from "@/lib/api";
import React, { useEffect, useState } from "react";
import axios from "axios";


const AssignedOrders = () => {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRiders = async () => {
      try {
        const res = await axios.get(`${BACKENDURL}/api/rider/get-riders`);
        setRiders(res.data.riders || []);
      } catch (error) {
        console.error("Error fetching riders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRiders();
  }, []);

  if (loading) {
    return <p className="p-4 text-gray-500">Loading assigned orders...</p>;
  }

  if (!riders.length) {
    return <p className="p-4 text-gray-500">No riders found.</p>;
  }

  // Get today's date string in YYYY-MM-DD format
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Today's Assigned Orders</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-h-[80vh] overflow-y-auto">
        {riders.map((rider) => {
          // Filter only today's assigned orders
          const todaysOrders = (rider.assignedOrders || []).filter(
            (order) =>
              new Date(order.assignedAt).toISOString().slice(0, 10) === todayStr
          );

          if (todaysOrders.length === 0) return null;

          return (
            <div
              key={rider._id}
              className="border border-gray-300 rounded-lg p-4 shadow-sm"
            >
              <h2 className="font-semibold text-lg mb-2">
                Rider: {rider.fullname} ({rider.contact})
              </h2>

              <ul className="space-y-3">
                {todaysOrders.map((order) => (
                  <li
                    key={order._id}
                    className="border border-gray-200 p-3 rounded-md"
                  >
                    <p>
                      <span className="font-semibold">Vendor:</span>{" "}
                      {order.vendorName}
                    </p>

                    <p>
                      <span className="font-semibold">To:</span> {order.to}
                    </p>
                    <p className="text-sm text-gray-500">
                      <span className="font-semibold">Assigned At:</span>{" "}
                      {new Date(order.assignedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AssignedOrders;
