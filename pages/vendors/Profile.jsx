"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  X,
  Camera,
  BadgeCheck,
  MapPin,
  Phone,
  Clock,
  Building2,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  Shield,
  AlertCircle,
  ImagePlus,
} from "lucide-react";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";

import VendorLayout from "@/components/layouts/VendorLayout";

const BANK_OPTIONS = [
  { name: "Access Bank", code: "044" },
  { name: "EcoBank", code: "050" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First Bank", code: "011" },
  { name: "Guaranty Trust Bank", code: "058" },
  { name: "Kuda Microfinance Bank", code: "50211" },
  { name: "Moniepoint MFB", code: "50515" },
  { name: "Opay Digital Services Limited (OPay)", code: "999991" },
  { name: "Paycom", code: "999991" },
  { name: "Palmpay", code: "999992" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "UBA", code: "033" },
  { name: "Union Bank", code: "032" },
  { name: "Zenith Bank", code: "057" },
];

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#fdf1ee] flex items-center justify-center flex-shrink-0">
      <Icon size={15} className="text-[#AE2108]" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] sm:text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-sm font-medium text-gray-800 truncate">
        {value || "Not set"}
      </p>
    </div>
    <ChevronRight size={13} className="text-gray-300 flex-shrink-0" />
  </div>
);

const inputClass =
  "w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108] transition-all";

/* ── Cover image carousel — shows the default brand pattern when there
     are no images, otherwise a swipeable-by-arrows carousel with dots ── */
function CoverCarousel({ images }) {
  const [index, setIndex] = useState(0);
  const slides = images.filter(Boolean);

  useEffect(() => {
    if (index >= slides.length) setIndex(0);
  }, [slides.length, index]);

  if (slides.length === 0) {
    return (
      <div className="absolute inset-0">
        <svg
          className="absolute inset-0 w-full h-full opacity-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="dots"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
        <div className="absolute -right-8 -top-8 w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-white/10" />
        <div className="absolute -right-4 top-6 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/5" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((src, i) => (
          <div key={i} className="w-full h-full flex-shrink-0 relative">
            <Image
              src={src}
              alt={`Cover photo ${i + 1}`}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/10" />
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={() =>
              setIndex((index - 1 + slides.length) % slides.length)
            }
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center transition-colors"
          >
            <ChevronLeft size={13} className="text-white" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((index + 1) % slides.length)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/25 hover:bg-black/40 flex items-center justify-center transition-colors"
          >
            <ChevronRight size={13} className="text-white" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {slides.map((_, i) => (
              <span
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === index ? "w-4 bg-white" : "w-1 bg-white/50"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const Profile = () => {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    businessName: "",
    contact: "",
    location: "",
    address: "",
    accountNumber: "",
    bankName: "",
    deliveryDuration: "",
  });

  const [editMode, setEditMode] = useState(false);
  const [tempData, setTempData] = useState({ ...formData });
  const [logo, setLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Cover images — fixed-length array of 2 slots, each either null,
  // { url, preview, isNew: false } for a saved image, or
  // { url: null, preview: blobUrl, isNew: true, file } for a pending upload
  const [coverSlots, setCoverSlots] = useState([null, null]);
  const [activeCoverSlot, setActiveCoverSlot] = useState(null);

  const BACKENDURL =
    "https://chowspace-backend.vercel.app" || "http://localhost:2005";

  const isVerified =
    !!session?.user?.isVerified ||
    !!(formData.accountNumber && formData.bankName);

  useEffect(() => {
    if (session?.user) {
      const user = session.user;
      const userData = {
        fullname: user.fullname || "",
        email: user.email || "",
        businessName: user.businessName || "",
        contact: user.contact || "",
        location: user.location || "",
        address: user.address || "",
        accountNumber: user.accountNumber || "",
        bankName: user.bankName || "",
        deliveryDuration: user.deliveryDuration || "",
      };
      setFormData(userData);
      setTempData(userData);
      setLogoPreview(user.logo || "");

      const existing = Array.isArray(user.coverImages) ? user.coverImages : [];
      setCoverSlots([
        existing[0]
          ? { url: existing[0], preview: existing[0], isNew: false }
          : null,
        existing[1]
          ? { url: existing[1], preview: existing[1], isNew: false }
          : null,
      ]);
    }
  }, [session]);

  const handleEditClick = () => setEditMode(true);

  const handleCancelClick = () => {
    setTempData(formData);
    setLogoPreview(session?.user?.logo || "");
    setNewPassword("");
    const existing = Array.isArray(session?.user?.coverImages)
      ? session.user.coverImages
      : [];
    setCoverSlots([
      existing[0]
        ? { url: existing[0], preview: existing[0], isNew: false }
        : null,
      existing[1]
        ? { url: existing[1], preview: existing[1], isNew: false }
        : null,
    ]);
    setEditMode(false);
  };

  const handleChange = (e) =>
    setTempData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const triggerCoverInput = (slotIndex) => {
    setActiveCoverSlot(slotIndex);
    document.getElementById("coverInput").click();
  };

  const handleCoverFileChange = (e) => {
    const file = e.target.files[0];
    if (file && activeCoverSlot !== null) {
      const preview = URL.createObjectURL(file);
      setCoverSlots((prev) => {
        const next = [...prev];
        next[activeCoverSlot] = { url: null, preview, isNew: true, file };
        return next;
      });
    }
    e.target.value = ""; // allow re-selecting the same file
  };

  const removeCoverSlot = (slotIndex) => {
    setCoverSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  };

  const handleSaveClick = async (e) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);
    const form = new FormData();

    form.append("businessName", tempData.businessName);
    form.append("contact", tempData.contact);
    form.append("location", tempData.location);
    form.append("address", tempData.address);
    form.append("deliveryDuration", tempData.deliveryDuration);

    if (
      session?.user?.paymentPreference !== "direct" &&
      !formData.accountNumber &&
      tempData.accountNumber &&
      tempData.bankName
    ) {
      form.append("accountNumber", tempData.accountNumber);
      form.append("bankName", tempData.bankName);
    }

    if (logo) form.append("logo", logo);
    if (newPassword) form.append("password", newPassword);

    // Cover images — tell the backend which existing URLs to keep,
    // and attach any newly-picked files. Backend merges + caps at 2.
    const keptExisting = coverSlots
      .filter((slot) => slot && !slot.isNew)
      .map((slot) => slot.url);
    form.append("existingCoverImages", JSON.stringify(keptExisting));
    coverSlots.forEach((slot) => {
      if (slot?.isNew) form.append("coverImages", slot.file);
    });

    const toastId = toast.loading("Updating profile...");
    try {
      await axios.put(`${BACKENDURL}/api/vendor/profile/update`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${session?.user?.accessToken}`,
        },
      });
      toast.success("Profile updated successfully", { id: toastId });
      setFormData(tempData);
      setNewPassword("");
      setEditMode(false);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to update profile",
        { id: toastId },
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <VendorLayout title="Business Profile" subtitle="Your store details">
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-5 sm:py-7 space-y-3">
        {/* ── Hero card ── */}
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          {/* Cover strip — carousel, with upload slots overlaid in edit mode */}
          <div className="h-28 sm:h-36 relative overflow-hidden bg-[#AE2108]">
            <CoverCarousel
              images={[coverSlots[0]?.preview, coverSlots[1]?.preview]}
            />

            {editMode && (
              <div className="absolute top-2 right-2 flex gap-1.5 z-10">
                {[0, 1].map((slotIndex) => {
                  const slot = coverSlots[slotIndex];
                  return (
                    <div
                      key={slotIndex}
                      className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden border-2 border-white shadow-sm"
                    >
                      {slot ? (
                        <div className="relative w-full h-full group">
                          <Image
                            src={slot.preview}
                            alt={`Cover slot ${slotIndex + 1}`}
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeCoverSlot(slotIndex)}
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                            title="Remove"
                          >
                            <X size={13} className="text-white" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => triggerCoverInput(slotIndex)}
                          className="w-full h-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors"
                          title="Add cover photo"
                        >
                          <ImagePlus size={15} className="text-white" />
                        </button>
                      )}
                    </div>
                  );
                })}
                <input
                  type="file"
                  id="coverInput"
                  accept="image/*"
                  onChange={handleCoverFileChange}
                  className="hidden"
                />
              </div>
            )}
          </div>

          <div className="px-4 sm:px-6 pb-5 sm:pb-6">
            {/* ── Avatar + action row ──
                    On mobile: avatar left-aligned, action buttons sit below name row.
                    On sm+: avatar left, action buttons top-right (inline). */}
            <div className="flex items-end justify-between -mt-9 sm:-mt-11 mb-4">
              {/* Avatar column */}
              <div className="flex flex-col items-start gap-2">
                <div className="relative">
                  <div
                    className={`w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-2xl overflow-hidden border-[3px] border-white shadow-lg ${
                      isVerified ? "ring-2 ring-green-400 ring-offset-1" : ""
                    }`}
                  >
                    {logoPreview ? (
                      <Image
                        loading="lazy"
                        src={logoPreview}
                        alt="Logo"
                        width={72}
                        height={72}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold bg-[#AE2108]">
                        {session?.user?.businessName?.[0] ?? "?"}
                      </div>
                    )}
                  </div>

                  {/* Verified bubble */}
                  {isVerified && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 bg-green-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                      <svg
                        className="w-2.5 h-2.5"
                        viewBox="0 0 10 10"
                        fill="none"
                      >
                        <polyline
                          points="2,5 4.5,8 8.5,2.5"
                          stroke="white"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Change logo button — edit mode only */}
                {editMode && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("logoInput").click()
                      }
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-[#AE2108] bg-white border border-[#AE2108]/30 hover:bg-[#AE2108] hover:text-white px-2.5 py-1 rounded-lg shadow-sm transition-all"
                    >
                      <Camera size={11} />
                      Change logo
                    </button>
                    <input
                      type="file"
                      id="logoInput"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                  </>
                )}
              </div>

              {/* Action buttons — top-right on all sizes */}
              {!editMode ? (
                <button
                  onClick={handleEditClick}
                  className="text-xs font-semibold text-[#AE2108] border border-[#AE2108]/25 hover:bg-[#AE2108] hover:text-white px-3 sm:px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap"
                >
                  Edit profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancelClick}
                    className="text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 px-2.5 sm:px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveClick}
                    disabled={isLoading}
                    className="text-xs font-semibold text-white bg-[#AE2108] hover:bg-[#941B06] disabled:opacity-50 px-2.5 sm:px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap"
                  >
                    {isLoading ? "Saving…" : "Save"}
                  </button>
                </div>
              )}
            </div>

            {/* Name + verified badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                {session?.user?.businessName || "Your Business"}
              </h2>
              {isVerified ? (
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full border border-green-200">
                  <BadgeCheck size={10} />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full border border-amber-200">
                  <AlertCircle size={10} />
                  Pending verification
                </span>
              )}
            </div>

            {session?.user?.location && (
              <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <MapPin size={11} />
                {session?.user?.location}
              </p>
            )}
          </div>
        </div>

        {/* ── Details / Edit card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">
              {editMode ? "Edit details" : "Business details"}
            </h3>
          </div>

          {!editMode ? (
            <div className="px-4 sm:px-5">
              <InfoRow
                icon={Building2}
                label="Business name"
                value={formData.businessName}
              />
              <InfoRow
                icon={Phone}
                label="Phone number"
                value={formData.contact}
              />
              <InfoRow
                icon={MapPin}
                label="Location"
                value={formData.location}
              />
              <InfoRow icon={MapPin} label="Address" value={formData.address} />
              <InfoRow
                icon={Clock}
                label="Delivery time"
                value={
                  formData.deliveryDuration
                    ? `${formData.deliveryDuration} mins`
                    : null
                }
              />
              {session?.user?.paymentPreference !== "direct" && (
                <>
                  <InfoRow
                    icon={CreditCard}
                    label="Account number"
                    value={formData.accountNumber}
                  />
                  <InfoRow
                    icon={Building2}
                    label="Bank"
                    value={formData.bankName}
                  />
                </>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleSaveClick}
              className="px-4 sm:px-5 py-4 space-y-3"
            >
              {[
                {
                  name: "businessName",
                  placeholder: "Business name",
                  type: "text",
                },
                {
                  name: "contact",
                  placeholder: "Phone number",
                  type: "tel",
                },
                { name: "location", placeholder: "Location", type: "text" },
              ].map((field) => (
                <input
                  key={field.name}
                  name={field.name}
                  type={field.type}
                  value={tempData[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  className={inputClass}
                />
              ))}

              <textarea
                name="address"
                value={tempData.address}
                onChange={handleChange}
                rows={2}
                placeholder="Full address"
                className={`${inputClass} resize-none`}
              />

              <input
                name="deliveryDuration"
                type="number"
                value={tempData.deliveryDuration}
                onChange={handleChange}
                placeholder="Estimated delivery time (minutes)"
                min={1}
                className={inputClass}
              />

              {session?.user?.paymentPreference !== "direct" &&
                !formData.accountNumber && (
                  <>
                    <input
                      name="accountNumber"
                      value={tempData.accountNumber}
                      onChange={handleChange}
                      placeholder="Account number"
                      className={inputClass}
                    />
                    <select
                      name="bankName"
                      value={tempData.bankName}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">Select bank</option>
                      {BANK_OPTIONS.map((bank) => (
                        <option key={bank.code} value={bank.name}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </>
                )}

              <div className="pt-2 border-t border-gray-100">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2.5">
                  Change password
                </p>
                <input
                  type="password"
                  placeholder="New password (optional)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Full-width save/cancel on mobile */}
              <div className="flex gap-3 pt-1 sm:hidden">
                <button
                  type="button"
                  onClick={handleCancelClick}
                  className="flex-1 py-3 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 text-sm font-semibold text-white bg-[#AE2108] rounded-xl hover:bg-[#941B06] disabled:opacity-50 transition-all"
                >
                  {isLoading ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Verification status card ── */}
        {isVerified ? (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-4 sm:px-5 py-4 flex items-start gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <Shield size={16} className="text-green-600" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <p className="text-sm font-semibold text-gray-900">
                  Verified vendor
                </p>
                <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border border-green-200">
                  <BadgeCheck size={9} /> Active
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Customers see your verified badge on your ChowSpace store. This
                builds trust and increases order conversion.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm px-4 sm:px-5 py-4 flex items-start gap-3 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={16} className="text-amber-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 mb-0.5">
                Verification pending
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                Add your bank account details to complete verification and
                unlock the verified badge on your store.
              </p>
            </div>
          </div>
        )}

        <div className="h-6" />
      </div>
    </VendorLayout>
  );
};

export default Profile;
