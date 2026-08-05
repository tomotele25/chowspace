"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import axios from "axios";
import toast from "react-hot-toast";

import ManagerLayout from "@/components/layouts/ManagerLayout";

const BACKENDURL =
  "https://chowspace-backend.vercel.app" || "http://localhost:2006";

const ManagerProfile = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
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

  // Logout now lives in the shared layout.

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
    <ManagerLayout title="Profile" subtitle={session?.user?.email}>
      <div className="p-6">

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
    </ManagerLayout>
  );
};

export default ManagerProfile;
