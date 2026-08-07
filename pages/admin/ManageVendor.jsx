"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import AdminLayout from "@/components/layouts/AdminLayout";
import toast, { Toaster } from "react-hot-toast";
import { requireAdminPage } from "@/lib/requireAdminPage";

const locations = ["Lagos", "Abeokuta", "Ibadan"];

const BACKENDURL =
  "https://chowspace-backend.vercel.app" || "http://localhost:2005";

const ManageVendor = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState({
    fullname: "",
    email: "",
    businessName: "",
    phoneNumber: "",
    location: "",
    paymentPreference: "paystack",
  });

  useEffect(() => {
    if (status !== "loading" && !session) {
      router.push("/Login");
    }
  }, [status, session, router]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        fullname: form.fullname,
        email: form.email,
        // No password here on purpose. This literal shipped in the public JS
        // bundle, so every admin-created vendor shared a password anyone could
        // read. The server now generates one and emails it to the vendor.
        businessName: form.businessName,
        contact: form.phoneNumber,
        location: form.location,
        address: "Default Address",
        category: "general",
        paymentPreference: form.paymentPreference,
      };

      const res = await axios.post(`${BACKENDURL}/api/vendor/create`, payload);

      if (res.status === 200 || res.status === 201) {
        toast.success("Vendor created — sign-in details emailed to them.");
        setForm({
          fullname: "",
          email: "",
          businessName: "",
          phoneNumber: "",
          location: "",
          paymentPreference: "paystack",
        });
        setModal(false);
        fetchVendorData();
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to create vendor.");
    } finally {
      setLoading(false);
    }
  };

  const fetchVendorData = async () => {
    try {
      const res = await axios.get(`${BACKENDURL}/api/vendor/getVendors`);
      const vendors = res.data.vendors;
      if (vendors) setVendors(vendors);
    } catch (error) {
      console.error(
        "Error fetching vendors:",
        error.response?.data || error.message,
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BACKENDURL}/api/vendor/delete/${id}`);
      toast.success("Vendor deleted!");
      fetchVendorData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete vendor.");
    }
  };

  useEffect(() => {
    fetchVendorData();
  }, []);

  return (
    <AdminLayout title="Manage Vendors">
      {/* Vendor Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-gray-600 text-sm uppercase">
            <tr>
              <th className="text-left py-3 px-4 font-medium">Full Name</th>
              <th className="text-left py-3 px-4 font-medium">Email</th>
              <th className="text-left py-3 px-4 font-medium">Phone</th>
              <th className="text-left py-3 px-4 font-medium">Business</th>
              <th className="text-left py-3 px-4 font-medium">Location</th>
              <th className="text-left py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {vendors.map((vendor, idx) => (
              <tr
                key={idx}
                className="border-t hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="py-3 px-4 font-medium">{vendor.fullname}</td>
                <td className="py-3 px-4 text-blue-600">{vendor.email}</td>
                <td className="py-3 px-4">{vendor.contact}</td>
                <td className="py-3 px-4">{vendor.businessName}</td>
                <td className="py-3 px-4">{vendor.location}</td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => handleDelete(vendor._id)}
                    className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors duration-200"
                  >
                    delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards View */}
      <section className="flex-1 p-3 sm:p-4 lg:p-6 overflow-hidden">
        <div className="block lg:hidden space-y-4">
          {vendors.map((vendor, idx) => (
            <div key={idx} className="bg-white rounded-lg shadow-md p-4 border">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {vendor.fullname}
                  </h3>
                  <p className="text-xs text-gray-500">#{vendor._id}</p>
                </div>
                <button
                  onClick={() => handleDelete(vendor._id)}
                  className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors duration-200"
                >
                  delete
                </button>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 font-medium">Business:</span>
                  <span className="text-gray-800">{vendor.businessName}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 font-medium">Email:</span>
                  <span className="text-blue-600 break-all">
                    {vendor.email}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 font-medium">Phone:</span>
                  <span className="text-gray-800">{vendor.contact}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between">
                  <span className="text-gray-600 font-medium">Location:</span>
                  <span className="text-gray-800">{vendor.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Button */}
      <button
        onClick={() => setModal(true)}
        className="fixed bottom-6 right-6 bg-[#AE2108] hover:bg-[#941B06] text-white px-4 py-2 rounded-full shadow-lg z-50 text-2xl"
      >
        +<span className="sr-only">Delete</span>
      </button>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/20 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-3xl relative">
            <button
              onClick={() => setModal(false)}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold text-gray-700 mb-4">
              Create New Vendor
            </h3>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Full Name
                </label>
                <input
                  name="fullname"
                  value={form.fullname}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="Vendor Full Name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="vendor@example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Business Name
                </label>
                <input
                  name="businessName"
                  value={form.businessName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="Business Name"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Phone Number
                </label>
                <input
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  placeholder="+234 801 234 5678"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Payment Preference
                </label>
                <select
                  name="paymentPreference"
                  value={form.paymentPreference}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value="paystack">Paystack</option>
                  <option value="direct">Direct (WhatsApp)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Location
                </label>
                <select
                  name="location"
                  value={form.location}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select Location</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3  bg-[#AE2108] text-white rounded-md hover:bg-[#941B06] transition flex justify-center items-center"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    "Create Vendor"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ManageVendor;

// Gated before any HTML is sent — the client-side check alone let a
// non-admin render the page and fire its data requests first.
export const getServerSideProps = requireAdminPage();
