"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  X,
  LayoutDashboard,
  MapPin,
  UtensilsCrossed,
  PackageOpen,
  Settings,
  LogOut,
  Pencil,
  Save,
  Trash2,
  Plus,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Menu,
} from "lucide-react";
import { useSession } from "next-auth/react";
import ManagerLayout from "@/components/layouts/ManagerLayout";
import { useRouter } from "next/navigation";

export default function ManageLocation() {
  const [location, setLocation] = useState("");
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState(null);
  const [vendorId, setVendorId] = useState(null);
  const [managerId, setManagerId] = useState(null);
  const [locations, setLocations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({ location: "", price: "" });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

const BACKENDURL =
  "https://chowspace-backend.vercel.app" 
  const { data: session } = useSession();
  const router = useRouter();
  const token = session?.user?.accessToken;
  const role = session?.user?.role;
  const sessionVendorId = session?.user?.vendorId; // only on vendor role
  const sessionUserId = session?.user?.id;


  useEffect(() => {
    if (!role || !token) return;

    if (role === "manager") {
      setManagerId(sessionUserId);
      return;
    }

    // vendor role — look up their manager
    if (!sessionVendorId) return;
    const resolveManagerId = async () => {
      try {
        const res = await axios.get(`${BACKENDURL}/api/getManagerByVendorId`, {
          params: { vendorId: sessionVendorId },
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.managerId) setManagerId(res.data.managerId);
      } catch (err) {
        console.error("Failed to resolve manager ID:", err);
        setMessage({
          type: "error",
          text: "Could not resolve manager account.",
        });
      }
    };
    resolveManagerId();
  }, [role, sessionUserId, sessionVendorId, token]);

  // Step 2: fetch locations using managerId (same endpoint for both roles now)
  useEffect(() => {
    if (!managerId) return;
    const fetchLocations = async () => {
      try {
        const res = await axios.get(
          `${BACKENDURL}/api/locations/manager/${managerId}`,
        );
        if (res.data?.vendor?._id) setVendorId(res.data.vendor._id);
        setLocations(res.data.locations || []);
      } catch (err) {
        console.error("Failed to fetch locations:", err);
        setMessage({
          type: "error",
          text: "Couldn't load delivery locations. Please refresh.",
        });
      }
    };
    fetchLocations();
  }, [managerId]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 4000);
    return () => clearTimeout(t);
  }, [message]);

  // Create — vendor sends vendorId, manager sends managerId
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!token) return setMessage({ type: "error", text: "Missing token." });
  try {
    const res = await axios.post(
      `${BACKENDURL}/api/createVendorLocation`,
      { managerId, location, price },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    setMessage({ type: "success", text: "Location added successfully!" });
    setLocation("");
    setPrice("");
    setFormOpen(false);
    setLocations((prev) => [...prev, res.data.location]);
  } catch (err) {
    setMessage({
      type: "error",
      text: err.response?.data?.message || "Failed to create location.",
    });
  }
};

  const startEditing = (loc) => {
    setEditingId(loc._id);
    setEditValues({ location: loc.location, price: loc.price });
  };

  const saveEdit = async (id) => {
    if (!token || !managerId) return;
    try {
      const res = await axios.put(
        `${BACKENDURL}/api/locations/${managerId}`,
        { locations: [{ ...editValues, _id: id }] },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const updatedLoc = res.data.locations.find((l) => l._id === id);
      setLocations((prev) =>
        prev.map((loc) => (loc._id === id ? updatedLoc : loc)),
      );
      setEditingId(null);
      setMessage({ type: "success", text: "Location updated!" });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update.",
      });
    }
  };

  const handleDelete = async (id) => {
    if (!token) return;
    try {
      await axios.delete(`${BACKENDURL}/api/locations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLocations((prev) => prev.filter((loc) => loc._id !== id));
      setDeleteConfirm(null);
      setMessage({ type: "success", text: "Location deleted." });
    } catch (err) {
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to delete.",
      });
    }
  };



  return (
    <ManagerLayout
      title="Delivery Locations"
      subtitle="Manage where you deliver and set prices"
      actions={
        <>
              <button
                onClick={() => router.back()}
                className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-gray-600 hover:text-gray-900 transition"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                onClick={() => setFormOpen(true)}
                className="flex items-center gap-1.5 bg-[#AE2108] text-white text-sm font-bold px-3 sm:px-4 py-2 rounded-xl hover:bg-[#941B06] transition-all shadow-md shadow-red-200 whitespace-nowrap"
              >
                <Plus size={16} />
                <span>Add Location</span>
              </button>
        </>
      }
    >
        {/* Toast */}
        {message && (
          <div
            className={`mx-4 sm:mx-6 mt-4 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium shadow-sm border ${
              message.type === "success"
                ? "bg-green-50 text-green-800 border-green-200"
                : "bg-red-50 text-red-800 border-red-200"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2
                size={16}
                className="text-green-500 flex-shrink-0"
              />
            ) : (
              <XCircle size={16} className="text-red-500 flex-shrink-0" />
            )}
            {message.text}
          </div>
        )}

        <div className="px-4 sm:px-6 py-6 w-full max-w-3xl mx-auto space-y-5">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                Total Zones
              </p>
              <p className="text-3xl font-black text-gray-900">
                {locations.length}
              </p>
            </div>
            <div className="bg-[#AE2108] rounded-2xl p-4 shadow-sm shadow-red-200">
              <p className="text-[10px] font-bold text-red-200 uppercase tracking-widest mb-1">
                Min. Delivery
              </p>
              <p className="text-2xl sm:text-3xl font-black text-white truncate">
                {locations.length
                  ? `₦${Math.min(...locations.map((l) => Number(l.price))).toLocaleString()}`
                  : "—"}
              </p>
            </div>
          </div>

          {/* Locations list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-black text-gray-900">
                Active Locations
              </h2>
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {locations.length} zone{locations.length !== 1 ? "s" : ""}
              </span>
            </div>

            {!managerId ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
                <div className="w-5 h-5 border-2 border-gray-300 border-t-[#AE2108] rounded-full animate-spin mr-3" />
                Loading…
              </div>
            ) : locations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <MapPin size={36} className="mb-3 opacity-30" />
                <p className="text-sm font-semibold">No delivery zones yet</p>
                <p className="text-xs mt-1">
                  Click "Add Location" to get started
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {locations.map((loc) => (
                  <div
                    key={loc._id}
                    className={`px-4 sm:px-6 py-4 transition-colors duration-150 ${
                      editingId === loc._id
                        ? "bg-amber-50/60"
                        : "hover:bg-gray-50/40"
                    }`}
                  >
                    {editingId === loc._id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                              Location
                            </label>
                            <input
                              type="text"
                              value={editValues.location}
                              onChange={(e) =>
                                setEditValues((p) => ({
                                  ...p,
                                  location: e.target.value,
                                }))
                              }
                              className="w-full border-2 border-amber-400 bg-white rounded-xl px-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#AE2108]"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">
                              Price (₦)
                            </label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">
                                ₦
                              </span>
                              <input
                                type="number"
                                value={editValues.price}
                                onChange={(e) =>
                                  setEditValues((p) => ({
                                    ...p,
                                    price: e.target.value,
                                  }))
                                }
                                className="w-full border-2 border-amber-400 bg-white rounded-xl pl-7 pr-3 py-2 text-sm font-semibold focus:outline-none focus:border-[#AE2108]"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(loc._id)}
                            className="flex items-center gap-1.5 bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-green-600 transition"
                          >
                            <Save size={13} /> Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex items-center gap-1.5 bg-gray-200 text-gray-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                          >
                            <X size={13} /> Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-9 h-9 rounded-xl bg-[#AE2108]/10 flex items-center justify-center flex-shrink-0">
                            <MapPin size={15} className="text-[#AE2108]" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 text-sm truncate">
                              {loc.location}
                            </p>
                            <p className="text-xs text-gray-500 font-semibold mt-0.5">
                              ₦{Number(loc.price).toLocaleString()} delivery fee
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => startEditing(loc)}
                            className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-bold px-3 py-2 rounded-lg hover:bg-gray-200 transition"
                          >
                            <Pencil size={13} />
                            <span className="hidden sm:inline">Edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(loc._id)}
                            className="flex items-center gap-1.5 bg-red-50 text-[#AE2108] text-xs font-bold px-3 py-2 rounded-lg hover:bg-red-100 transition"
                          >
                            <Trash2 size={13} />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      {/* Add Location Modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setFormOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-md p-6 z-10">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5 sm:hidden" />
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  Add New Zone
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Set a delivery location and fee
                </p>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition"
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  Location Name
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold focus:border-[#AE2108] focus:outline-none transition"
                  placeholder="e.g. Lekki Phase 1"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">
                  Delivery Fee (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">
                    ₦
                  </span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm font-semibold focus:border-[#AE2108] focus:outline-none transition"
                    placeholder="e.g. 2000"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-[#AE2108] text-white text-sm font-bold hover:bg-[#941B06] transition shadow-md shadow-red-200"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 z-10 text-center">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} className="text-[#AE2108]" />
            </div>
            <h3 className="text-lg font-black text-gray-900 mb-2">
              Delete Location?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              This will permanently remove{" "}
              <span className="font-bold text-gray-800">
                {locations.find((l) => l._id === deleteConfirm)?.location}
              </span>{" "}
              from your delivery zones.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3 rounded-xl bg-[#AE2108] text-white text-sm font-bold hover:bg-[#941B06] transition shadow-md shadow-red-200"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </ManagerLayout>
  );
}
