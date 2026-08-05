"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Toaster } from "react-hot-toast";
import {
  TrendingUp,
  Calendar,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useSession } from "next-auth/react";

import VendorLayout from "@/components/layouts/VendorLayout";

const BACKENDURL =
  "https://chowspace-backend.vercel.app" || "http://localhost:2005";

const Analytics = () => {
  const { data: session, status } = useSession();
  const [analyticsRange, setAnalyticsRange] = useState("7");
  const [weeklyData, setWeeklyData] = useState([]);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    avgDailyOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAnalyticsData();
    }
  }, [session, status, analyticsRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${BACKENDURL}/api/getAllOrders?vendorId=${session?.user?.vendorId}`,
      );

      const allOrders = res.data.orders || [];
      const today = new Date();
      const rangeDays = parseInt(analyticsRange);

      const days = Array.from({ length: rangeDays }).map((_, i) => {
        const d = new Date();
        d.setDate(today.getDate() - (rangeDays - 1 - i));
        return d;
      });

      const data = days.map((day) => {
        const start = new Date(day.setHours(0, 0, 0, 0));
        const end = new Date(day.setHours(23, 59, 59, 999));
        const dayOrders = allOrders.filter((order) => {
          const createdAt = new Date(order.createdAt);
          return createdAt >= start && createdAt <= end;
        });
        return {
          name:
            rangeDays > 7
              ? start.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                })
              : start.toLocaleDateString("en-US", { weekday: "short" }),
          orders: dayOrders.length,
          revenue: dayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        };
      });

      const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);
      const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
      const avgDailyOrders = (totalOrders / rangeDays).toFixed(1);

      setSummary({ totalOrders, totalRevenue, avgDailyOrders });
      setWeeklyData(data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <VendorLayout
      title="Analytics"
      subtitle={`Last ${analyticsRange} days`}
      actions={
        <select
          value={analyticsRange}
          onChange={(e) => setAnalyticsRange(e.target.value)}
          className="border border-gray-200 bg-white rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#AE2108]"
        >
          <option value="7">Last 7 Days</option>
          <option value="14">Last 14 Days</option>
          <option value="30">Last 30 Days</option>
        </select>
      }
    >
      <div className="p-4 md:p-6">
        <Toaster position="top-right" />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {[
            {
              title: `Total Orders (${analyticsRange} days)`,
              value: summary.totalOrders,
              icon: <TrendingUp className="text-green-600" />,
            },
            {
              title: "Total Revenue",
              value: `₦${summary.totalRevenue.toLocaleString()}`,
              icon: <ArrowUpRight className="text-green-600" />,
            },
            {
              title: "Avg. Daily Orders",
              value: summary.avgDailyOrders,
              icon: <Calendar className="text-blue-500" />,
            },
          ].map((card, i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-xl shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="text-sm text-gray-600">{card.title}</p>
                <h3 className="text-xl md:text-2xl font-bold text-[#AE2108] mt-1">
                  {loading ? "..." : card.value}
                </h3>
              </div>
              {card.icon}
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm">
          <h3 className="text-base md:text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
            <TrendingUp className="text-[#AE2108]" size={18} />
            Orders & Revenue Overview
          </h3>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-gray-500" />
            </div>
          ) : (
            <div className="w-full h-[260px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="#AE2108"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Orders"
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#16a34a"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Revenue (₦)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Comparison Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-xl shadow-sm">
            <h4 className="text-sm md:text-base font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <ArrowUpRight className="text-green-600" size={16} />
              Best Performing Day
            </h4>
            {weeklyData.length > 0 && (
              <p className="text-xl md:text-2xl font-bold text-[#AE2108]">
                {
                  weeklyData.reduce((a, b) => (a.orders > b.orders ? a : b))
                    .name
                }
              </p>
            )}
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm">
            <h4 className="text-sm md:text-base font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <ArrowDownRight className="text-red-600" size={16} />
              Lowest Performing Day
            </h4>
            {weeklyData.length > 0 && (
              <p className="text-xl md:text-2xl font-bold text-[#AE2108]">
                {
                  weeklyData.reduce((a, b) => (a.orders < b.orders ? a : b))
                    .name
                }
              </p>
            )}
          </div>
        </div>
      </div>
    </VendorLayout>
  );
};

export default Analytics;
