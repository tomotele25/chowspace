import axios from "axios";
import { BACKENDURL } from "@/lib/api";

export const formatCurrency = (n) =>
  typeof n === "number" ? n.toLocaleString() : "0";

export const formatPhoneNumber = (number) => {
  let d = String(number).replace(/\D/g, "");
  if (d.startsWith("0")) d = "234" + d.slice(1);
  return d;
};

export const generateOrderId = () =>
  `CS-${Math.floor(100000 + Math.random() * 900000)}`;

export const isAbeokutaVendor = (v) =>
  v?.location?.toLowerCase().trim() === "abeokuta";

/**
 * Live open/closed check, straight from the backend rather than the vendor
 * object loaded when the page mounted. Fails open on a network error — a
 * flaky connection shouldn't block a real order; the backend rejects with
 * VENDOR_CLOSED as the real guard.
 */
export const isVendorStillOpen = async (vendorId) => {
  try {
    const res = await axios.get(
      `${BACKENDURL}/api/vendor/${vendorId}/live-status`,
    );
    return res.data?.status !== "closed";
  } catch {
    return true;
  }
};

export const validatePhone = (raw) => {
  const d = raw.replace(/\D/g, "");
  return d.length >= 7 && d.length <= 15;
};

export const validateName = (name) => {
  const trimmed = name.trim();
  if (trimmed.length < 2) return false;
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return false;
  if (/^(.)\1+$/.test(trimmed.replace(/\s/g, ""))) return false;
  return true;
};
