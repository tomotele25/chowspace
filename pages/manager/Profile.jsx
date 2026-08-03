"use client";

import { BACKENDURL } from "@/lib/api";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Menu,
  X,
  LayoutDashboard,
  PackageOpen,
  UtensilsCrossed,
  Settings,
  LogOut,
  MapPin as LocationEditIcon,
} from "lucide-react";


const ManagerProfile = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setFullname(session.user.fullname);
      setEmail(session.user.email);
    }
  }, [session]);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = async () => {
    await signOut();
    router.push("/Login");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullname || !email) {
      return toast.error("Name and email are required.");
    }

    try {
      setLoading(true);
      const res = await axios.put(
        `${BACKENDURL}/api/manager/update/${session?.user?.id}`,
        {
          fullname,
          email,
          newPassword,
        }
      );

      if (res.data.success) {
        toast.success("Profile updated successfully!");
        setNewPassword("");
      } else {
        toast.error(res.data.message || "Update failed");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };
  if (status === "unauthenticated") {
    router.push("/Login");
  }
  return (
    <div className="flex min-h-screen bg-gray-50 relative">
      {/* Hamburger button */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 bg-white border rounded-md p-2 shadow"
        onClick={toggleSidebar}
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-full w-64 bg-white shadow-lg flex flex-col justify-between transition-transform duration-300 ease-in-out ${
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
              className="flex items-center gap-2 text-gray-700 font-semibold"
            >
              <LayoutDashboard size={18} />
              Dashboard
            </Link>
            <Link
              href="/vendors/ManageLocation"
              className="flex items-center gap-2 text-gray-700 hover:text-[#AE2108]"
            >
              <LocationEditIcon size={18} />
              Locations
            </Link>
            <Link
              href="/manager/ManagerOrder"
              className="flex items-center gap-2 text-gray-700 hover:text-[#AE2108]"
            >
              <UtensilsCrossed size={18} />
              Orders
            </Link>
            <Link
              href="/vendors/ManageProducts"
              className="flex items-center gap-2 text-gray-700 hover:text-[#AE2108]"
            >
              <PackageOpen size={18} />
              Products
            </Link>
            <Link
              href="/manager/Profile"
              className="flex items-center gap-2 text-[#AE2108] font-semibold"
            >
              <Settings size={18} />
              Profile
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-red-600 hover:bg-red-100 px-3 py-2 rounded-md w-full"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 p-6">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#AE2108] text-white flex items-center justify-center rounded-full text-lg font-bold uppercase">
              {session?.user?.fullname?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Hello, {session?.user?.fullname} 👋
              </h2>
              <p className="text-sm text-gray-500">{session?.user?.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto w-full">
          <h3 className="text-lg font-bold mb-4 text-gray-800">Profile Info</h3>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={fullname}
                onChange={(e) => setFullname(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#AE2108] focus:outline-none focus:border-[#AE2108]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#AE2108] focus:outline-none focus:border-[#AE2108]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-[#AE2108] focus:outline-none focus:border-[#AE2108]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-[#AE2108] text-white rounded-md hover:bg-[#8c1a06] transition disabled:opacity-50"
            >
              {loading ? "Updating..." : "Save Changes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManagerProfile;
