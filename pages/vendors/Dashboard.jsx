"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  UtensilsCrossed,
  Wallet,
  Star,
  BarChart,
  MessageCircle,
  TrendingUp,
  ShoppingBag,
  ChevronRight,
  ChevronDown,
  Check,
} from "lucide-react";
import { useSession } from "next-auth/react";
import toast, { Toaster } from "react-hot-toast";
import axios from "axios";
import { io } from "socket.io-client";
import Notification from "@/components/Notification";
import VendorLayout from "@/components/layouts/VendorLayout";
import { BACKENDURL, SOCKET_URL } from "@/lib/api";

const CHAT_PROMPT_DISMISSED_KEY = "cs_chat_prompt_dismissed";

function StatCard({ label, value, icon: Icon, trend, primary }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 border transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        primary
          ? "bg-[#AE2108] border-[#AE2108] text-white shadow-[0_4px_24px_rgba(174,33,8,0.2)]"
          : "bg-white border-gray-100 shadow-sm"
      }`}
    >
      {primary && (
        <>
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -right-2 bottom-0 w-16 h-16 rounded-full bg-white/5 pointer-events-none" />
        </>
      )}
      <div className="relative flex items-start justify-between mb-4">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            primary ? "bg-white/20" : "bg-[#AE2108]/8"
          }`}
        >
          <Icon
            size={18}
            className={primary ? "text-white" : "text-[#AE2108]"}
          />
        </div>
        {trend && (
          <span
            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              primary
                ? "bg-white/20 text-white"
                : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <TrendingUp size={9} />
            {trend}
          </span>
        )}
      </div>
      <p
        className={`text-2xl font-bold mb-1 ${primary ? "text-white" : "text-gray-900"}`}
      >
        {value}
      </p>
      <p
        className={`text-xs font-medium ${primary ? "text-white/70" : "text-gray-400"}`}
      >
        {label}
      </p>
    </div>
  );
}

/* ── Where customers message you ──
   Written for a vendor, not for us: says what changes on their side, and
   lets them look at it before they choose. */
function NewVersionCard({ enabled, onToggle, saving }) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div
      className={`rounded-2xl border transition-colors ${
        enabled
          ? "bg-[#AE2108]/[0.04] border-[#AE2108]/15"
          : "bg-white border-gray-100 shadow-sm"
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <MessageCircle
                size={15}
                className={enabled ? "text-[#AE2108]" : "text-gray-400"}
              />
              <h3 className="text-sm font-bold text-gray-900">
                {enabled
                  ? "Customers now message you here"
                  : "Chat with customers here, not on WhatsApp"}
              </h3>
              {!enabled && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                  New
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
              {enabled
                ? "When someone orders, their chat opens on this page instead of WhatsApp. Turn it off and orders go back to WhatsApp — nothing is lost."
                : "Right now, customers who order are sent to your WhatsApp. You can have them message you inside ChowSpace instead. Your choice — you can change it back any time."}
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-label="Chat with customers inside ChowSpace"
            onClick={onToggle}
            disabled={saving}
            className={`relative w-11 h-6 rounded-full flex-shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#AE2108]/40 focus-visible:ring-offset-2 ${
              enabled ? "bg-[#AE2108]" : "bg-gray-200"
            } ${saving ? "opacity-60 cursor-not-allowed" : ""}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* What actually changes, in their words */}
        {!enabled && (
          <ul className="mt-4 space-y-2">
            {[
              "The order and the chat sit together — you stop copying addresses into WhatsApp.",
              "Send your account number and confirm payment in the same chat.",
              "Your phone still alerts you, so you won't miss an order.",
            ].map((point) => (
              <li key={point} className="flex items-start gap-2">
                <Check
                  size={13}
                  className="text-[#AE2108] mt-0.5 flex-shrink-0"
                />
                <span className="text-xs text-gray-600 leading-relaxed">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-4 mt-4">
          {enabled ? (
            <Link
              href="/vendors/vendorchat"
              className="inline-flex items-center gap-1 text-xs text-[#AE2108] font-semibold hover:underline"
            >
              Open chat <ChevronRight size={12} />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setShowPreview((p) => !p)}
              className="inline-flex items-center gap-1 text-xs text-[#AE2108] font-semibold hover:underline"
            >
              {showPreview ? "Hide example" : "Show me what it looks like"}
              <ChevronDown
                size={12}
                className={`transition-transform ${showPreview ? "rotate-180" : ""}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Example chat — so they can see it before deciding */}
      {!enabled && showPreview && (
        <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-4">
          <p className="text-[11px] text-gray-400 mb-3">
            An example of how an order would come in
          </p>
          <div className="max-w-sm space-y-2">
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-md p-3 shadow-sm">
              <p className="text-[11px] font-bold text-gray-900 mb-1.5">
                🛒 NEW ORDER
              </p>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                2× Jollof Rice, 1× Fried Chicken
                <br />
                Deliver to: 14 Quarry Road, Oke-Ilewo
              </p>
              <p className="text-[11px] font-bold text-gray-900 mt-1.5">
                ₦4,500
              </p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-md px-3 py-2 shadow-sm w-fit">
              <p className="text-[11px] text-gray-600">
                Good afternoon, please add extra plantain 🙏
              </p>
            </div>
            <div className="bg-[#AE2108] rounded-2xl rounded-br-md px-3 py-2 shadow-sm w-fit ml-auto">
              <p className="text-[11px] text-white">
                Noted. Transfer ₦5,000 to 0123456789 — GTB
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VendorDashboard() {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [unreadChats, setUnreadChats] = useState(0);
  const [newVersion, setNewVersion] = useState(false);
  const [savingChatPref, setSavingChatPref] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);

  const { data: session, status } = useSession();
  const vendorId = session?.user?.vendorId;

  // Read the dismissed flag after mount so SSR and client markup match.
  useEffect(() => {
    try {
      setPromptDismissed(
        localStorage.getItem(CHAT_PROMPT_DISMISSED_KEY) === "true",
      );
    } catch {}
  }, []);

  const fetchInAppChatPref = async () => {
    try {
      const res = await axios.get(
        `${BACKENDURL}/api/vendors/${vendorId}/in-app-chat`,
      );
      setNewVersion(Boolean(res.data?.inAppChat));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleNewVersion = async () => {
    if (savingChatPref) return;

    const next = !newVersion;
    const previous = newVersion;

    // Optimistic update — UI flips immediately
    setNewVersion(next);
    setSavingChatPref(true);

    const toastId = toast.loading(
      next ? "Switching to in-app chat…" : "Switching back to WhatsApp…",
      { style: { borderRadius: "12px", fontSize: "13px", fontWeight: 500 } },
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
          ? "Done — customers will message you here from now on"
          : "Done — customers will message you on WhatsApp again",
        {
          id: toastId,
          style: { borderRadius: "12px", fontSize: "13px", fontWeight: 500 },
          iconTheme: { primary: "#AE2108", secondary: "#fff" },
        },
      );

      // Once they've switched on, don't show the promo card again
      if (next) {
        try {
          localStorage.setItem(CHAT_PROMPT_DISMISSED_KEY, "true");
        } catch {}
        setPromptDismissed(true);
      }
    } catch (err) {
      console.error(err);
      // Roll back on failure — the server is the source of truth
      setNewVersion(previous);
      toast.error("Couldn't update your chat preference. Try again.", {
        id: toastId,
        style: { borderRadius: "12px", fontSize: "13px", fontWeight: 500 },
      });
    } finally {
      setSavingChatPref(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${BACKENDURL}/api/getAllOrders`, {
        headers: { Authorization: `Bearer ${session?.user?.accessToken}` },
      });
      const allOrders = res.data.orders || [];
      const today = new Date();
      const start = new Date(today.setHours(0, 0, 0, 0));
      const end = new Date(today.setHours(23, 59, 59, 999));
      setOrders(
        allOrders.filter((o) => {
          const c = new Date(o.createdAt);
          return c >= start && c <= end;
        }),
      );
    } catch (err) {
      console.error(err);
      toast.error("Couldn't load today's orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchUnreadChats = async () => {
    if (!vendorId) return;
    try {
      const res = await axios.get(`${BACKENDURL}/api/chat/vendor/${vendorId}`);
      setUnreadChats(
        (res.data.rooms || []).filter((r) => r.unreadCount > 0).length,
      );
    } catch {}
  };

  useEffect(() => {
    if (status === "authenticated" && vendorId) {
      fetchOrders();
      fetchUnreadChats();
      fetchInAppChatPref();
    }
  }, [session, status]);

  useEffect(() => {
    if (!vendorId) return;
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      // The server derives senderType and vendor-room access from this, so
      // without it the dashboard is treated as an anonymous customer.
      auth: { token: session?.user?.accessToken },
    });
    socket.on("connect", () => socket.emit("joinVendorRoom", vendorId));
    socket.on("newChatNotification", () => setUnreadChats((p) => p + 1));
    socket.on("receiveMessage", (msg) => {
      if (msg.senderType !== "vendor") setUnreadChats((p) => p + 1);
    });
    return () => socket.disconnect();
  }, [vendorId]);

  const todayRevenue = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);
  const vendorName =
    session?.user?.businessName || session?.user?.name || "Vendor";
  const statusColors = {
    completed: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    cancelled: "bg-red-50 text-red-600 border border-red-100",
    pending: "bg-amber-50 text-amber-700 border border-amber-100",
  };
  const greeting =
    new Date().getHours() < 12
      ? "morning"
      : new Date().getHours() < 17
        ? "afternoon"
        : "evening";

  return (
    <VendorLayout
      title="Dashboard"
      subtitle={new Date().toLocaleDateString("en-NG", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}
      actions={<Notification />}
    >
      <Toaster
        position="top-right"
        toastOptions={{
          style: { borderRadius: "12px", fontSize: "13px", fontWeight: 500 },
        }}
      />

      {/* The "not visible to customers yet" banner is VendorLayout's — it
              belongs on every page, not just this one. */}
      <div className="px-5 py-6 max-w-6xl mx-auto space-y-6">
        {/* Welcome banner */}
        <div className="relative overflow-hidden rounded-2xl bg-[#AE2108] px-6 py-5 shadow-lg shadow-[#AE2108]/15">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-10 -bottom-8 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute right-36 top-2 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-white/60 text-xs font-medium mb-0.5">
                Good {greeting}
              </p>
              <h2 className="text-white text-lg font-bold leading-tight">
                {vendorName} 👋
              </h2>
              <p className="text-white/60 text-xs mt-1.5">
                {loadingOrders
                  ? "Loading summary…"
                  : `${orders.length} order${orders.length !== 1 ? "s" : ""} · ₦${todayRevenue.toLocaleString()} earned today`}
              </p>
            </div>
            <Link
              href="/vendors/Orders"
              className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-xl transition whitespace-nowrap"
            >
              View Orders <ChevronRight size={13} />
            </Link>
          </div>
        </div>

        {/* New version opt-in — shown once, then dismissed for good via localStorage */}
        {!promptDismissed && (
          <NewVersionCard
            enabled={newVersion}
            onToggle={toggleNewVersion}
            saving={savingChatPref}
          />
        )}

        {/* Stat cards */}
        <div
          className={`grid grid-cols-2 gap-3 sm:gap-4 ${
            newVersion ? "lg:grid-cols-4" : "lg:grid-cols-3"
          }`}
        >
          <StatCard
            label="Today's Orders"
            value={loadingOrders ? "—" : orders.length}
            icon={ShoppingBag}
            trend="+12%"
            primary
          />
          <StatCard
            label="Today's Revenue"
            value={loadingOrders ? "—" : `₦${todayRevenue.toLocaleString()}`}
            icon={Wallet}
            trend="+8%"
          />
          {newVersion ? (
            <>
              <StatCard
                label="Waiting for your reply"
                value={unreadChats}
                icon={MessageCircle}
              />
              <StatCard label="Store Rating" value="4.8 ★" icon={Star} />
            </>
          ) : (
            <div className="col-span-2 lg:col-span-1">
              <StatCard label="Store Rating" value="4.8 ★" icon={Star} />
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Manage Menu",
                icon: UtensilsCrossed,
                path: "/vendors/ManageProducts",
                iconClass: "bg-orange-50 text-orange-500",
              },
              {
                label: "Analytics",
                icon: BarChart,
                path: "/vendors/Analytics",
                iconClass: "bg-blue-50 text-blue-500",
              },
              {
                label: "Chat",
                icon: MessageCircle,
                path: "/vendors/vendorchat",
                iconClass: "bg-[#AE2108]/8 text-[#AE2108]",
                badge: unreadChats,
              },
              {
                label: "Wallet",
                icon: Wallet,
                path: "/vendors/Wallet",
                iconClass: "bg-emerald-50 text-emerald-600",
              },
            ].map(({ label, icon: Icon, path, iconClass, badge }) => (
              <Link
                key={label}
                href={path}
                className="flex flex-col items-center gap-3 bg-white rounded-2xl px-4 py-4 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all text-center group"
              >
                <div
                  className={`relative w-11 h-11 rounded-xl flex items-center justify-center ${iconClass}`}
                >
                  <Icon size={19} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#AE2108] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-gray-600 group-hover:text-gray-900 transition-colors">
                  {label}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Orders list */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Today&apos;s Orders
              </h3>
              {!loadingOrders && orders.length > 0 && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {orders.length} order{orders.length !== 1 ? "s" : ""} placed
                </p>
              )}
            </div>
            <Link
              href="/vendors/Orders"
              className="flex items-center gap-1 text-xs text-[#AE2108] font-semibold hover:underline"
            >
              View all <ChevronRight size={12} />
            </Link>
          </div>

          {loadingOrders ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 rounded-xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-100 rounded-full w-2/5" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-1/4" />
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="h-3 bg-gray-100 rounded-full w-16" />
                    <div className="h-4 bg-gray-100 rounded-full w-14 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-[#AE2108]/5 border border-[#AE2108]/10 flex items-center justify-center mb-3">
                <ShoppingBag size={24} className="text-[#AE2108]/40" />
              </div>
              <p className="text-sm font-semibold text-gray-500">
                No orders yet today
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {newVersion
                  ? "New orders open a chat thread here automatically"
                  : "New orders will appear here automatically"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {orders.slice(0, 6).map((order) => {
                const st = (order.status || "pending").toLowerCase();
                const name =
                  order.guestInfo?.name ||
                  order.customerId?.fullname ||
                  "Customer";
                return (
                  <div
                    key={order._id}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/70 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#AE2108]/8 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag size={15} className="text-[#AE2108]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {name}
                      </p>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                        #{order._id.slice(-6).toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">
                        ₦{(order.totalAmount || 0).toLocaleString()}
                      </p>
                      <span
                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-0.5 ${statusColors[st] || statusColors.pending}`}
                      >
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                      </span>
                    </div>
                    {newVersion && (
                      <Link
                        href={`/vendors/vendorchat?order=${order._id}`}
                        title="Reply in chat"
                        className="w-8 h-8 rounded-lg border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#AE2108] hover:border-[#AE2108]/20 hover:bg-[#AE2108]/5 transition-colors flex-shrink-0"
                      >
                        <MessageCircle size={14} />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </VendorLayout>
  );
}
