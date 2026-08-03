"use client";

import { BACKENDURL } from "@/lib/api";
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Plus, X, Trash2 } from "lucide-react";
import axios from "axios";
import { useSession } from "next-auth/react";

import VendorLayout from "@/components/layouts/VendorLayout";

export default function CreateManager() {
  const { data: session } = useSession();

  const [managers, setManagers] = useState([]);
  const [vendorStatus, setVendorStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const fetchManagers = async () => {
      if (!session?.user?.accessToken) return;

      try {
        const res = await axios.get(`${BACKENDURL}/api/getManagers`, {
          headers: {
            Authorization: `Bearer ${session?.user?.accessToken}`,
          },
        });
        setManagers(res.data.managers || []);
      } catch (err) {
        toast.error("Failed to load managers");
      }
    };

    fetchManagers();
  }, [session]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        `${BACKENDURL}/api/createManager`,
        {
          fullname: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phone,
          role: "manager",
          // No password here on purpose. This literal shipped in the public JS
          // bundle, so every manager account shared a password anyone could
          // read. The server generates one and emails it to the manager.
        },
        {
          headers: {
            Authorization: `Bearer ${session?.user?.accessToken}`,
          },
        },
      );

      toast.success(
        `Manager added — sign-in details emailed to them. Store is currently ${res.data.vendorStatus}`,
      );

      setManagers((prev) => [res.data.manager, ...prev]);
      setVendorStatus(res.data.vendorStatus); // ✅ Update store status
      setShowModal(false);
      setFormData({ fullName: "", email: "", phone: "" });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add manager");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this manager?"))
      return;

    try {
      await axios.delete(`${BACKENDURL}/api/vendor/team/${id}`, {
        headers: {
          Authorization: `Bearer ${session?.user?.accessToken}`,
        },
      });
      setManagers((prev) => prev.filter((m) => m._id !== id));
      toast.success("Manager deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  return (
    <VendorLayout
      title="Team"
      subtitle={
        managers.length
          ? `${managers.length} manager${managers.length === 1 ? "" : "s"}`
          : undefined
      }
      actions={
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 bg-[#AE2108] hover:bg-[#941B06] text-white text-xs font-bold px-3 py-2 rounded-xl transition"
        >
          <Plus size={14} /> Add manager
        </button>
      }
    >
      <Toaster position="top-right" />

      <div className="p-4 md:p-6">
        {vendorStatus && (
          <p className="text-sm mb-4 text-gray-600">
            Store is currently:{" "}
            <span className="font-semibold capitalize text-[#AE2108]">
              {vendorStatus}
            </span>
          </p>
        )}

        {managers.length === 0 ? (
          <p className="text-gray-500">No managers yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {managers.map((manager) => (
              <div
                key={manager._id}
                className="bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-[#AE2108] text-lg">
                      {manager.fullname}
                    </h3>
                    <p className="text-gray-600 text-sm">{manager.email}</p>
                    <p className="text-gray-600 text-sm">
                      {manager.phoneNumber}
                    </p>
                    <p className="text-xs text-gray-400 italic">
                      {manager.role}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(manager._id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-black"
            >
              <X size={20} />
            </button>
            <h2 className="text-xl font-semibold text-[#AE2108] mb-4">
              Add Manager
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="Full Name"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-medium text-white transition ${
                  loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#AE2108] hover:bg-[#941B06]"
                }`}
              >
                {loading ? "Adding..." : "Add Manager"}
              </button>
            </form>
          </div>
        </div>
      )}
    </VendorLayout>
  );
}
