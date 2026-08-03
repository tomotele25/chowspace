"use client";

import { BACKENDURL } from "@/lib/api";
import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import Head from "next/head";
const Signup = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullname: "",
    contact: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const passwordsMatch = formData.password === formData.confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!passwordsMatch) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`${BACKENDURL}/api/auth/user/signup`, {
        fullname: formData.fullname,
        contact: formData.contact,
        email: formData.email,
        password: formData.password,
      });

      if (res.data.success) {
        toast.success("Signup successful");
        setTimeout(() => router.push("/Login"), 1500);
      } else {
        toast.error(res.data.message || "Signup failed");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Sign Up | ChowSpace</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen flex flex-col md:flex-row">
        <Toaster position="top-right" />

        {/* Left Image */}
        <div className="md:w-1/2 h-64 md:h-screen relative">
          <Image
            loading="lazy"
            src="/logo.jpg"
            alt="Signup Visual"
            fill
            className="sm:object-cover"
        
          />
        </div>

        {/* Right Form */}
        <div className="md:w-1/2 flex items-center justify-center px-6 py-12 bg-white">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">
              Create Customer Account
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700">Full Name</label>
                <input
                  type="text"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  required
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700">Contact</label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  required
                  placeholder="Phone number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-700">Email</label>
                <input
                  type="email"
                  name="email"
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
                  type={showPassword ? "text" : "password"}
                  name="password"
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

              <div className="relative">
                <label className="block text-sm text-gray-700">
                  Confirm Password
                </label>
                <input
                  type={showConfirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className={`w-full px-4 py-2 border ${
                    formData.confirmPassword.length > 0
                      ? passwordsMatch
                        ? "border-green-500"
                        : "border-red-500"
                      : "border-gray-300"
                  } rounded-lg`}
                />
                <span
                  onClick={() => setShowConfirm((prev) => !prev)}
                  className="absolute right-3 top-[38px] cursor-pointer text-sm text-gray-500"
                >
                  {showConfirm ? "Hide" : "Show"}
                </span>
                {formData.confirmPassword.length > 0 && (
                  <p
                    className={`text-sm mt-1 ${
                      passwordsMatch ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {passwordsMatch
                      ? "Passwords match"
                      : "Passwords do not match"}
                  </p>
                )}
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
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
            </form>

            <p className="text-sm text-gray-600 mt-4 text-center">
              Already have an account?{" "}
              <a
                aria-label="View cart "
                href="/Login"
                className="text-[#AE2108] hover:underline"
              >
                Log In
              </a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Signup;
