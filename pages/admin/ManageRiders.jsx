"use client";

import { BACKENDURL } from "@/lib/api";
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
  Pencil,
  Trash,
} from "lucide-react";
import Link from "next/link";
import axios from "axios";
import AdminLayout from "@/components/layouts/AdminLayout";
import toast, { Toaster } from "react-hot-toast";
import { requireAdminPage } from "@/lib/requireAdminPage";

const locations = ["Lagos", "Abeokuta", "Ibadan"];

const ManagerRider = () => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [riders, setRiders] = useState([]);

  const [form, setForm] = useState({
    fullname: "",
    phoneNumber: "",
    location: "",
    type: "platform",
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
        contact: form.phoneNumber,
        location: form.location,
        type: form.type,
      };

      if (editing) {
        await axios.put(
          `${BACKENDURL}/api/rider/update/${editing._id}`,
          payload,
        );
        toast.success("Rider updated successfully!");
      } else {
        await axios.post(`${BACKENDURL}/api/rider/create-rider`, payload);
        toast.success("Rider created successfully!");
      }

      setForm({
        fullname: "",
        phoneNumber: "",
        location: "",
        type: "platform",
      });
      setModal(false);
      setEditing(null);
      fetchRiderData();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to save rider.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRiderData = async () => {
    try {
      const res = await axios.get(`${BACKENDURL}/api/rider/get-riders`);
      setRiders(res.data.riders || []);
    } catch (error) {
      console.error(
        "Error fetching riders:",
        error.response?.data || error.message,
      );
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this rider?")) return;
    try {
      await axios.delete(`${BACKENDURL}/api/rider/delete/${id}`);
      toast.success("Rider deleted!");
      fetchRiderData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete rider.");
    }
  };

  useEffect(() => {
    fetchRiderData();
  }, []);

  return (
    <AdminLayout title="Manage Riders">
      {/* Riders Cards (Responsive) */}
      <section className="flex-1 p-3 sm:p-4 lg:p-6 overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {riders.map((rider, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl shadow-lg p-4 border border-gray-200 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 text-lg">
                      {rider.fullname}
                    </h3>
                    <span
                      className={`h-3 w-3 rounded-full ${
                        rider.status === "active"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    ></span>
                  </div>
                  <p className="text-xs text-gray-500">#{rider._id}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(rider);
                      setForm({
                        fullname: rider.fullname,
                        phoneNumber: rider.contact,
                        location: rider.location,
                        type: rider.type,
                      });
                      setModal(true);
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm px-2 py-1 rounded hover:bg-blue-50 transition"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(rider._id)}
                    className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50 transition"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>

              {/* Rider details */}
              <div className="space-y-2 text-sm flex-1">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Phone:</span>
                  <span className="text-gray-800">{rider.contact}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Location:</span>
                  <span className="text-gray-800">{rider.location}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Status:</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rider.status === "active"}
                      onChange={async () => {
                        try {
                          await axios.put(
                            `${BACKENDURL}/api/rider/update/${rider._id}`,
                            {
                              status:
                                rider.status === "active"
                                  ? "inactive"
                                  : "active",
                            },
                          );
                          fetchRiderData();
                          toast.success("Rider status updated!");
                        } catch (err) {
                          console.error(err);
                          toast.error("Failed to update status");
                        }
                      }}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer peer-checked:bg-green-500 relative transition">
                      <div className="absolute top-0.5 left-[2px] bg-white w-5 h-5 rounded-full transition-transform peer-checked:translate-x-full"></div>
                    </div>
                  </label>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Type:</span>
                  <span className="capitalize">{rider.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Button */}
      <button
        onClick={() => {
          setEditing(null);
          setForm({
            fullname: "",
            phoneNumber: "",
            location: "",
            type: "platform",
          });
          setModal(true);
        }}
        className="fixed bottom-6 right-6 bg-[#AE2108] hover:bg-[#941B06] text-white px-4 py-2 rounded-full shadow-lg z-50 text-2xl"
      >
        +<span className="sr-only">Add Rider</span>
      </button>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/20 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-lg relative">
            <button
              onClick={() => {
                setModal(false);
                setEditing(null);
              }}
              className="absolute top-2 right-3 text-gray-500 hover:text-gray-700 text-2xl"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold text-gray-700 mb-4">
              {editing ? "Edit Rider" : "Create New Rider"}
            </h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
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
                  placeholder="Rider Full Name"
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
                  Location
                </label>
                <select
                  name="location"
                  value={form.location}
                  onChange={handleChange}
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
              <div>
                <label className="block text-sm text-gray-600 mb-1">Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                >
                  <option value="platform">Platform</option>
                  <option value="vendor">Vendor</option>
                </select>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#AE2108] text-white rounded-md hover:bg-[#941B06] transition flex justify-center items-center"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : editing ? (
                    "Update Rider"
                  ) : (
                    "Create Rider"
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

export default ManagerRider;

// Gated before any HTML is sent — the client-side check alone let a
// non-admin render the page and fire its data requests first.
export const getServerSideProps = requireAdminPage();
