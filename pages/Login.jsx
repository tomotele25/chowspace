"use client";

import React, { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { BACKENDURL } from "@/lib/api";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Set when the backend rejects an unconfirmed vendor, so we can offer a
  // resend rather than leaving them stuck on "invalid credentials".
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // The confirmation link lands back here with a result to report.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const verified = new URLSearchParams(window.location.search).get("verified");
    if (!verified) return;

    if (verified === "1") {
      toast.success("Email confirmed — you can log in now");
    } else if (verified === "expired") {
      toast.error("That link has expired. Log in to get a new one.");
      setNeedsVerification(true);
    } else {
      toast.error("That confirmation link isn't valid.");
      setNeedsVerification(true);
    }

    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  const resendVerification = async () => {
    if (!formData.email) {
      toast.error("Enter your email address first");
      return;
    }
    setResending(true);
    const id = toast.loading("Sending a new link…");
    try {
      const res = await axios.post(`${BACKENDURL}/api/auth/resend-verification`, {
        email: formData.email,
      });
      toast.success(res.data?.message || "Check your inbox", { id });
    } catch {
      toast.error("Couldn't send it. Try again shortly.", { id });
    } finally {
      setResending(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const response = await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    if (response?.ok) {
      setNeedsVerification(false);
      toast.success("Login successful");

      const updatedSession = await getSession();
      const role = updatedSession?.user?.role;

      if (role === "admin") {
        router.push("/admin/AdminDashboard");
      } else if (role === "vendor") {
        router.push("/vendors/Dashboard");
      } else if (role === "manager") {
        router.push("/vendors/ManagerDashboard");
      } else if (role === "rider") {
        router.push("/riders/RiderDashboard");
      } else {
        router.push("/");
      }
    } else if (response?.error?.includes("EMAIL_NOT_VERIFIED")) {
      setNeedsVerification(true);
      toast.error("Confirm your email address to log in");
    } else {
      toast.error("Invalid email or password");
    }

    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>Login | ChowSpace</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen flex flex-col md:flex-row">
        <Toaster position="top-right" />

        {/* Left Image */}
        <div className="md:w-1/2 h-64 md:h-screen relative">
          <Image
            loading="lazy"
            src="/logo.jpg"
            alt="Login Visual"
            fill
            className="sm:object-cover"
          />
        </div>

        {/* Right Form */}
        <div className="md:w-1/2 flex items-center justify-center px-6 py-12 bg-white">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
              Login as Customer
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700">Email</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="relative">
                <label className="block text-sm text-gray-700">Password</label>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <span
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-[38px] cursor-pointer text-sm text-gray-500"
                >
                  {showPassword ? "Hide" : "Show"}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-medium text-white transition ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#AE2108] hover:bg-[#941B06]"
                }`}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            {needsVerification && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  Confirm your email to continue
                </p>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  We sent a link when you registered. Check your inbox and spam
                  folder, or send yourself a new one.
                </p>
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={resending}
                  className="mt-3 text-xs font-bold text-[#AE2108] hover:underline disabled:opacity-50"
                >
                  {resending ? "Sending…" : "Resend confirmation email"}
                </button>
              </div>
            )}

            <p className="text-sm text-gray-600 mt-4 text-center">
              Don’t have an account?{" "}
              <a href="/Signup" className="text-[#AE2108] hover:underline">
                Sign Up
              </a>
            </p>

            <p className="text-sm text-gray-600 mt-2 text-center">
              Want to sell on Chowspace?{" "}
              <a
                href="/vendors/Signup"
                className="text-[#AE2108] font-semibold hover:underline"
              >
                Register your business
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
