"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { signOut, useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import {
  Menu,
  X,
  User,
  Settings as SettingsIcon,
  LogOut,
  Users,
  PackageOpen,
  UtensilsCrossed,
  Wallet,
  Rocket,
  Star,
  Bell,
  MapPin,
  BarChart,
  MessageCircle,
  Clock,
  KeyRound,
  ChevronRight,
  ShieldAlert,
  Store,
  BellRing,
  BellOff,
  ShoppingBag,
  Mail,
  Zap,
  Copy,
  Circle,
  Sparkles,
} from "lucide-react";

const BACKENDURL =
  "https://chowspace-backend.vercel.app" ||  "http://localhost:2005";

const NOTIF_PREFS_KEY = "cs_notif_prefs";
const DEFAULT_NOTIF_PREFS = { orders: true, chat: true, promos: false };

const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const DAY_LETTERS = {
  Monday: "M",
  Tuesday: "T",
  Wednesday: "W",
  Thursday: "T",
  Friday: "F",
  Saturday: "S",
  Sunday: "S",
};

const DEFAULT_HOURS = WEEKDAYS.map((day) => ({
  day,
  open: "09:00",
  close: "21:00",
  closed: false,
}));

const menuItems = [
  { name: "Orders", icon: PackageOpen, path: "/vendors/Orders" },
  { name: "Reviews", icon: Star, path: "/vendors/Reviews" },
  { name: "Products", icon: UtensilsCrossed, path: "/vendors/ManageProducts" },
  { name: "Analytics", icon: BarChart, path: "/vendors/Analytics" },
  { name: "Location", icon: MapPin, path: "/vendors/VendorLocation" },
  { name: "Wallet", icon: Wallet, path: "/vendors/Wallet" },
  { name: "Profile", icon: User, path: "/vendors/Profile" },
  { name: "Subscribe", icon: Rocket, path: "/vendors/Subscribe" },
  { name: "Announcement", icon: Bell, path: "/vendors/Announcement" },
  { name: "Manage Team", icon: Users, path: "/vendors/ManageTeam" },
  { name: "Settings", icon: SettingsIcon, path: "/Settings" },
];

const fmtTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
};

/* ── Small reusable switch, matches the dashboard's toggle styling ── */
function Toggle({ checked, onChange, disabled, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#AE2108]/40 focus-visible:ring-offset-2 ${
        checked ? "bg-[#AE2108]" : "bg-gray-200"
      } ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ── A settings row: icon, title, description, and a control on the right ── */
function SettingRow({ icon: Icon, title, description, control, last }) {
  return (
    <div
      className={`flex items-start gap-3 py-4 px-4 sm:px-5 ${
        last ? "" : "border-b border-gray-100"
      }`}
    >
      <div className="w-9 h-9 rounded-xl bg-[#AE2108]/8 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={16} className="text-[#AE2108]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed max-w-sm">
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0 pt-0.5">{control}</div>
    </div>
  );
}

/* ── A row that links elsewhere, or triggers an onClick (e.g. opens a modal) ── */
function LinkRow({ icon: Icon, title, description, href, onClick, last }) {
  const content = (
    <>
      <div className="w-9 h-9 rounded-xl bg-[#AE2108]/8 flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-[#AE2108]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <ChevronRight
        size={15}
        className="text-gray-300 group-hover:text-gray-400 transition-colors flex-shrink-0"
      />
    </>
  );

  const className = `flex items-center gap-3 py-4 px-4 sm:px-5 hover:bg-gray-50/70 transition-colors group w-full text-left ${
    last ? "" : "border-b border-gray-100"
  }`;

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

function SectionCard({ title, children }) {
  return (
    <div>
      {title && (
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
          {title}
        </h3>
      )}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {children}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Store Hours — modal
   ══════════════════════════════════════════════════════════ */
function StoreHoursModal({ open, onClose, vendorId, accessToken }) {
  const [visible, setVisible] = useState(false);
  const [storeHours, setStoreHours] = useState(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [useAutoHours, setUseAutoHours] = useState(false);
  const [savingAutoHours, setSavingAutoHours] = useState(false);
  const [liveStatus, setLiveStatus] = useState(null);
  const [activeDay, setActiveDay] = useState(0);

  // Mount/unmount with a tick of delay so the enter transition can play
  useEffect(() => {
    if (open) {
      setVisible(true);
    } else {
      const t = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !vendorId) return;

    const fetchHours = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${BACKENDURL}/api/vendor/${vendorId}/opening-hours`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        const fetched = res.data?.openingHours || res.data?.data;
        if (Array.isArray(fetched) && fetched.length > 0) {
          const byDay = Object.fromEntries(fetched.map((d) => [d.day, d]));
          setStoreHours(
            WEEKDAYS.map(
              (day) =>
                byDay[day] || {
                  day,
                  open: "09:00",
                  close: "21:00",
                  closed: false,
                },
            ),
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchLiveStatus = async () => {
      try {
        const res = await axios.get(
          `${BACKENDURL}/api/vendor/${vendorId}/live-status`,
        );
        setLiveStatus(res.data?.status || null);
        setUseAutoHours(Boolean(res.data?.useAutoHours));
      } catch (err) {
        console.error(err);
      }
    };

    fetchHours();
    fetchLiveStatus();
  }, [open, vendorId]);

  const todayName = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Africa/Lagos",
        weekday: "long",
      }).format(new Date()),
    [],
  );

  const todayEntry = storeHours.find((d) => d.day === todayName);

  const todaySummary = !todayEntry
    ? ""
    : todayEntry.closed
      ? "Closed today"
      : `Open today · ${fmtTime(todayEntry.open)} – ${fmtTime(todayEntry.close)}`;

  const updateDay = (index, updated) => {
    setStoreHours((prev) => prev.map((d, i) => (i === index ? updated : d)));
  };

  const applyToAll = (index) => {
    const source = storeHours[index];
    setStoreHours((prev) =>
      prev.map((d) => ({
        ...d,
        open: source.open,
        close: source.close,
        closed: source.closed,
      })),
    );
    toast.success(`${source.day}'s hours applied to every day`, {
      style: { borderRadius: "12px", fontSize: "13px", fontWeight: 500 },
    });
  };

  const validate = () => {
    for (const entry of storeHours) {
      if (entry.closed) continue;
      if (!entry.open || !entry.close) {
        toast.error(`${entry.day}: set both an opening and closing time`);
        return false;
      }
      if (entry.close <= entry.open) {
        toast.error(`${entry.day}: closing time must be after opening time`);
        return false;
      }
    }
    return true;
  };

  const saveStoreHours = async () => {
    if (saving) return;
    if (!validate()) return;

    setSaving(true);
    const toastId = toast.loading("Saving store hours…");
    try {
      await axios.put(
        `${BACKENDURL}/api/vendor/update-hours`,
        { openingHours: storeHours },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      toast.success("Store hours updated", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "Failed to update store hours",
        { id: toastId },
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleAutoHours = async () => {
    if (savingAutoHours) return;
    const next = !useAutoHours;
    const previous = useAutoHours;

    setUseAutoHours(next);
    setSavingAutoHours(true);
    const toastId = toast.loading(
      next
        ? "Turning on automatic open/close…"
        : "Turning off automatic open/close…",
    );

    try {
      await axios.patch(
        `${BACKENDURL}/api/vendor/${vendorId}/auto-hours`,
        { useAutoHours: next },
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      toast.success(
        next
          ? "Your store now opens and closes automatically"
          : "You're back to opening and closing manually",
        { id: toastId, iconTheme: { primary: "#AE2108", secondary: "#fff" } },
      );
    } catch (err) {
      console.error(err);
      setUseAutoHours(previous);
      toast.error(
        err?.response?.data?.message ||
          "Couldn't update this. Save your hours first.",
        { id: toastId },
      );
    } finally {
      setSavingAutoHours(false);
    }
  };

  if (!visible) return null;

  const active = storeHours[activeDay];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Panel */}
      <div
        className={`relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] transition-all duration-200 ${
          open
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-6 opacity-0 sm:scale-95"
        }`}
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 flex-shrink-0">
          <div className="w-9 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header — brand gradient strip */}
        <div className="relative overflow-hidden rounded-t-3xl sm:rounded-t-3xl flex-shrink-0">
          <div className="bg-gradient-to-br from-[#AE2108] to-[#7d1805] px-5 pt-4 pb-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                    <Clock size={15} className="text-white" />
                  </div>
                  <h2 className="text-white font-bold text-base">
                    Store Hours
                  </h2>
                </div>
                <p className="text-white/70 text-xs mt-2">{todaySummary}</p>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X size={13} className="text-white" />
              </button>
            </div>

            {liveStatus && (
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full mt-3 ${
                  liveStatus === "opened"
                    ? "bg-emerald-400/20 text-emerald-50 border border-emerald-300/30"
                    : "bg-white/10 text-white/70 border border-white/15"
                }`}
              >
                <Circle
                  size={7}
                  className={
                    liveStatus === "opened"
                      ? "fill-emerald-300 text-emerald-300"
                      : "fill-white/50 text-white/50"
                  }
                />
                {liveStatus === "opened" ? "Open now" : "Closed now"}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Auto-hours */}
          <div
            className={`rounded-2xl border p-3.5 flex items-center gap-3 transition-colors ${
              useAutoHours
                ? "bg-[#AE2108]/[0.05] border-[#AE2108]/15"
                : "bg-gray-50 border-gray-100"
            }`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                useAutoHours ? "bg-[#AE2108]/10" : "bg-white"
              }`}
            >
              <Zap
                size={15}
                className={useAutoHours ? "text-[#AE2108]" : "text-gray-400"}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900">
                Open &amp; close automatically
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                Follows the hours below on its own
              </p>
            </div>
            <Toggle
              checked={useAutoHours}
              onChange={toggleAutoHours}
              disabled={savingAutoHours}
              label="Open and close automatically"
            />
          </div>

          {/* Day picker — pill row */}
          <div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {storeHours.map((entry, i) => (
                <button
                  key={entry.day}
                  onClick={() => setActiveDay(i)}
                  className={`flex-shrink-0 w-9 h-9 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                    activeDay === i
                      ? "bg-[#AE2108] text-white shadow-sm scale-105"
                      : entry.closed
                        ? "bg-gray-100 text-gray-300"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                  title={entry.day}
                >
                  {DAY_LETTERS[entry.day]}
                </button>
              ))}
            </div>
          </div>

          {/* Active day editor */}
          {loading ? (
            <div className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ) : (
            active && (
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-900">
                    {active.day}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => applyToAll(activeDay)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-[#AE2108] hover:underline"
                    >
                      <Copy size={11} />
                      Apply to all
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500">
                    {active.closed ? "Closed all day" : "Open"}
                  </span>
                  <Toggle
                    checked={!active.closed}
                    onChange={() =>
                      updateDay(activeDay, {
                        ...active,
                        closed: !active.closed,
                      })
                    }
                    label={`${active.day} open`}
                  />
                </div>

                {!active.closed && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-[#AE2108] focus-within:ring-2 focus-within:ring-[#AE2108]/10 transition-all">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                        Opens
                      </p>
                      <input
                        type="time"
                        value={active.open}
                        onChange={(e) =>
                          updateDay(activeDay, {
                            ...active,
                            open: e.target.value,
                          })
                        }
                        className="w-full text-sm font-semibold text-gray-900 outline-none bg-transparent"
                      />
                    </div>
                    <div className="w-4 h-px bg-gray-300 flex-shrink-0" />
                    <div className="flex-1 bg-white border border-gray-200 rounded-xl px-3 py-2.5 focus-within:border-[#AE2108] focus-within:ring-2 focus-within:ring-[#AE2108]/10 transition-all">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-0.5">
                        Closes
                      </p>
                      <input
                        type="time"
                        value={active.close}
                        onChange={(e) =>
                          updateDay(activeDay, {
                            ...active,
                            close: e.target.value,
                          })
                        }
                        className="w-full text-sm font-semibold text-gray-900 outline-none bg-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          )}

          {/* Week-at-a-glance */}
          <div className="space-y-0.5">
            {storeHours.map((entry, i) => (
              <button
                key={entry.day}
                onClick={() => setActiveDay(i)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                  activeDay === i ? "bg-[#AE2108]/5" : "hover:bg-gray-50"
                }`}
              >
                <span
                  className={`text-xs font-medium ${
                    activeDay === i ? "text-[#AE2108]" : "text-gray-600"
                  }`}
                >
                  {entry.day}
                </span>
                <span
                  className={`text-xs ${
                    entry.closed ? "text-gray-300 italic" : "text-gray-400"
                  }`}
                >
                  {entry.closed
                    ? "Closed"
                    : `${fmtTime(entry.open)} – ${fmtTime(entry.close)}`}
                </span>
              </button>
            ))}
          </div>

          <p className="text-[10px] text-gray-300 text-center pt-1">
            Every store closes automatically between 10 PM and 6 AM
          </p>
        </div>

        {/* Sticky footer */}
        <div className="flex-shrink-0 border-t border-gray-100 p-4 bg-white rounded-b-3xl">
          <button
            onClick={saveStoreHours}
            disabled={saving || loading}
            className="w-full py-3 bg-[#AE2108] hover:bg-[#941B06] disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
          >
            {saving ? "Saving…" : "Save hours"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [inAppChat, setInAppChat] = useState(false);
  const [savingChat, setSavingChat] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState(DEFAULT_NOTIF_PREFS);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [hoursModalOpen, setHoursModalOpen] = useState(false);

  const router = useRouter();
  const { data: session, status } = useSession();
  const vendorId = session?.user?.vendorId;
  const vendorName =
    session?.user?.businessName || session?.user?.name || "Vendor";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/Login");
  }, [status]);

  // Chat preference — source of truth is the backend
  useEffect(() => {
    if (status !== "authenticated" || !vendorId) return;
    const fetchChatPref = async () => {
      try {
        const res = await axios.get(
          `${BACKENDURL}/api/vendors/${vendorId}/in-app-chat`,
        );
        setInAppChat(Boolean(res.data?.inAppChat));
      } catch (err) {
        console.error(err);
      }
    };
    fetchChatPref();
  }, [status, vendorId]);

  // Notification prefs — local only for now, read after mount to avoid SSR mismatch
  useEffect(() => {
    try {
      const raw = localStorage.getItem(NOTIF_PREFS_KEY);
      if (raw) setNotifPrefs({ ...DEFAULT_NOTIF_PREFS, ...JSON.parse(raw) });
    } catch {}
  }, []);

  const toggleChatPref = async () => {
    if (savingChat) return;
    const next = !inAppChat;
    const previous = inAppChat;

    setInAppChat(next);
    setSavingChat(true);

    const toastId = toast.loading(
      next ? "Switching to in-app chat…" : "Switching back to WhatsApp…",
    );

    try {
      await axios.patch(
        `${BACKENDURL}/api/vendors/${vendorId}/in-app-chat`,
        { inAppChat: next },
        {
          headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
        },
      );
      toast.success(
        next
          ? "Customers will message you here from now on"
          : "Customers will message you on WhatsApp again",
        { id: toastId, iconTheme: { primary: "#AE2108", secondary: "#fff" } },
      );
    } catch (err) {
      console.error(err);
      setInAppChat(previous);
      toast.error("Couldn't update your chat preference. Try again.", {
        id: toastId,
      });
    } finally {
      setSavingChat(false);
    }
  };

  const toggleNotifPref = (key) => {
    setNotifPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    toast.success("Notification settings saved", {
      style: { borderRadius: "12px", fontSize: "13px", fontWeight: 500 },
    });
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    const toastId = toast.loading("Logging out...");
    try {
      await signOut({ redirect: false });
      toast.success("Logged out", { id: toastId });
      router.push("/");
    } catch {
      toast.error("Logout failed", { id: toastId });
    } finally {
      setLoggingOut(false);
    }
  };

  const handleDeactivate = async () => {
    if (deactivating) return;
    const confirmed = window.confirm(
      "This closes your store to new orders until you reopen it. Continue?",
    );
    if (!confirmed) return;

    setDeactivating(true);
    const toastId = toast.loading("Closing your store…");
    try {
      const res = await axios.put(
        `${BACKENDURL}/api/vendor/toggleStatus`,
        { status: "closed" },
        {
          headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
        },
      );
      toast.success(`Store is now ${res.data.vendor?.status || "closed"}`, {
        id: toastId,
      });
    } catch (err) {
      console.error(err);
      toast.error("Couldn't close your store. Try again.", { id: toastId });
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: "12px", fontSize: "13px", fontWeight: 500 },
        }}
      />

      <StoreHoursModal
        open={hoursModalOpen}
        onClose={() => setHoursModalOpen(false)}
        vendorId={vendorId}
        accessToken={session?.user?.accessToken}
      />

      <div className="h-screen flex overflow-hidden bg-gray-50">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-20 md:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          className={`fixed z-30 inset-y-0 left-0 w-64 bg-white border-r border-gray-100 flex flex-col shadow-xl transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0 md:shadow-none`}
        >
          <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100 flex-shrink-0">
            <span className="font-bold text-gray-900 text-base tracking-tight">
              <span className="text-[#AE2108]">Chowspace</span>
            </span>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>

          <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#AE2108]/5 border border-[#AE2108]/10">
              <div className="w-8 h-8 rounded-full bg-[#AE2108]/15 flex items-center justify-center flex-shrink-0">
                <User size={14} className="text-[#AE2108]" />
              </div>
              <p className="text-gray-900 text-xs font-bold truncate">
                {vendorName}
              </p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
            {menuItems.map(({ name, icon: Icon, path }) => {
              const isActive = router.pathname === path;
              return (
                <Link
                  key={name}
                  href={path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                    ${isActive ? "bg-[#AE2108] text-white shadow-sm" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"}`}
                >
                  <Icon
                    size={16}
                    className={
                      isActive
                        ? "text-white"
                        : "text-gray-400 group-hover:text-gray-600 transition-colors"
                    }
                  />
                  <span>{name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="px-3 py-3 border-t border-gray-100 flex-shrink-0">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 overflow-y-auto">
          <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-gray-100 px-5 h-16 flex items-center gap-3">
            <button
              className="md:hidden w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition flex-shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">
                Settings
              </h1>
              <p className="text-[11px] text-gray-400 hidden sm:block leading-tight">
                Manage how ChowSpace works for your store
              </p>
            </div>
          </header>

          <div className="px-5 py-6 max-w-2xl mx-auto space-y-6">
            {/* Customer chat */}
            <SectionCard title="Customer Chat">
              <SettingRow
                icon={MessageCircle}
                title={
                  inAppChat
                    ? "Chatting inside ChowSpace"
                    : "Chatting on WhatsApp"
                }
                description={
                  inAppChat
                    ? "Orders open a chat thread here. Turn this off to send customers to WhatsApp instead."
                    : "Customers who order are sent to your WhatsApp. Turn this on to chat with them inside ChowSpace instead."
                }
                control={
                  <Toggle
                    checked={inAppChat}
                    onChange={toggleChatPref}
                    disabled={savingChat}
                    label="Chat with customers inside ChowSpace"
                  />
                }
                last
              />
            </SectionCard>

            {/* Notifications */}
            <SectionCard title="Notifications">
              <SettingRow
                icon={ShoppingBag}
                title="New orders"
                description="Get notified the moment a customer places an order."
                control={
                  <Toggle
                    checked={notifPrefs.orders}
                    onChange={() => toggleNotifPref("orders")}
                    label="New order notifications"
                  />
                }
              />
              <SettingRow
                icon={notifPrefs.chat ? BellRing : BellOff}
                title="Chat messages"
                description="Get notified when a customer sends you a message."
                control={
                  <Toggle
                    checked={notifPrefs.chat}
                    onChange={() => toggleNotifPref("chat")}
                    label="Chat message notifications"
                  />
                }
              />
              <SettingRow
                icon={Mail}
                title="Tips and updates"
                description="Occasional emails about features and ways to grow your store."
                control={
                  <Toggle
                    checked={notifPrefs.promos}
                    onChange={() => toggleNotifPref("promos")}
                    label="Product update emails"
                  />
                }
                last
              />
            </SectionCard>

            {/* Store */}
            <SectionCard title="Store">
              <LinkRow
                icon={Clock}
                title="Store hours"
                description="Set your opening and closing time for each day"
                onClick={() => setHoursModalOpen(true)}
              />
              <LinkRow
                icon={Store}
                title="Business details"
                description="Update your name, logo, address, and bank account"
                href="/vendors/Profile"
                last
              />
            </SectionCard>

            {/* Security */}
            <SectionCard title="Security">
              <LinkRow
                icon={KeyRound}
                title="Change password"
                description="Update your password from your profile page"
                href="/vendors/Profile"
                last
              />
            </SectionCard>

            {/* Danger zone */}
            <div>
              <h3 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3 px-1">
                Danger Zone
              </h3>
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
                <div className="flex items-start gap-3 py-4 px-4 sm:px-5">
                  <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ShieldAlert size={16} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      Close store
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed max-w-sm">
                      Stops new orders from coming in until you reopen. Existing
                      orders aren't affected.
                    </p>
                  </div>
                  <button
                    onClick={handleDeactivate}
                    disabled={deactivating}
                    className="flex-shrink-0 text-xs font-semibold text-red-600 border border-red-200 hover:bg-red-50 disabled:opacity-50 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap mt-0.5"
                  >
                    {deactivating ? "Closing…" : "Close store"}
                  </button>
                </div>
              </div>
            </div>

            <div className="h-4" />
          </div>
        </main>
      </div>
    </>
  );
}
