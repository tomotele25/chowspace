"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  PackageOpen,
  BarChart3,
  Menu,
  X,
  PhoneCall,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";

const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { name: "Manage Vendors", icon: Users, path: "/admin/ManageVendor" },
  { name: "Manage Riders", icon: Users, path: "/admin/ManageRiders" },
  { name: "Assigned Orders", icon: Users, path: "/admin/AssignedOrders" },
  { name: "Settings", icon: Settings, path: "/admin/settings" },
  { name: "Promotion", icon: Settings, path: "/admin/Promotion" },
  { name: "Order Analysis", icon: Settings, path: "/admin/OrderAnalysis" },
  {
    name: "Conatct-support",
    icon: PhoneCall,
    path: "/admin/AdminContactSupport",
  },
];

const AdminDashboard = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [totalVendors, setTotalVendors] = useState(0);
  const BACKENDURL =
    "https://chowspace-backend.vercel.app" || "http://localhost:2006";
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/Login");
    }
  }, [status, router]);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const logout = async () => {
    await signOut({ callbackUrl: "/Login" });
  };

  useEffect(() => {
    const fetchTotalVendor = async () => {
      const res = await axios.get(`${BACKENDURL}/api/vendor/vendorTotalCount`);
      if (res) {
        setTotalVendors(res.data.totalVendor);
      }
    };
    fetchTotalVendor();
  }, []);

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
              <span className="sr-only">Delete</span>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-sm font-semibold text-gray-600">
                Total Vendors
              </h3>
              <p className="text-2xl font-bold text-[#AE2108] mt-2">
                {totalVendors}
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-sm font-semibold text-gray-600">
                Total Orders
              </h3>
              <p className="text-2xl font-bold text-[#AE2108] mt-2">320</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-sm font-semibold text-gray-600">
                Total Revenue
              </h3>
              <p className="text-2xl font-bold text-[#AE2108] mt-2">
                ₦1,250,000
              </p>
            </div>
          </div>

          <div className="mt-10">
            <h3 className="text-lg font-bold mb-4 text-gray-700">
              Recent Vendor Signups
            </h3>
            <div className="bg-white shadow rounded-xl p-4">
              <ul className="space-y-2 text-sm text-gray-700">
                <li>🔸 FoodieMart - foodie@example.com</li>
                <li>🔸 ChowFiesta - fiesta@example.com</li>
                <li>🔸 YumNation - yum@example.com</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
