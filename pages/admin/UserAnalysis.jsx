"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import axios from "axios";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  PhoneCall,
  BarChart3,
  Star,
  ChevronRight,
  Bike,
  ClipboardList,
  MessageCircle,
  Search,
  Gift,
  Clock,
  TrendingUp,
  ShoppingBag,
  UserCheck,
  RefreshCw,
  ChevronLeft,
  Send,
  CheckSquare,
  Square,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

const BACKENDURL = "https://chowspace-backend.vercel.app";
const PAGE_SIZE = 30;

/* ── helpers ── */
const fmt = (n) => (typeof n === "number" ? n.toLocaleString() : n);

const AVATAR_COLORS = [
  { bg: "bg-blue-50", text: "text-blue-700" },
  { bg: "bg-purple-50", text: "text-purple-700" },
  { bg: "bg-emerald-50", text: "text-emerald-700" },
  { bg: "bg-amber-50", text: "text-amber-700" },
  { bg: "bg-rose-50", text: "text-rose-700" },
];

const avatarColor = (str = "") => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
};

const daysSince = (dateStr) => {
  if (!dateStr) return null;
  return Math.floor((Date.now() - new Date(dateStr)) / 86400000);
};

const getUserBadge = (user) => {
  const days = daysSince(user.lastOrderDate);
  if (user.orderCount === 1)
    return { label: "New", style: "bg-emerald-50 text-emerald-700" };
  if (days !== null && days > 14)
    return { label: "Inactive", style: "bg-gray-100 text-gray-500" };
  if (user.orderCount >= 5)
    return { label: "Regular", style: "bg-[#AE2108]/10 text-[#AE2108]" };
  return { label: "Returning", style: "bg-blue-50 text-blue-700" };
};

/* ── Smart WA message by customer type ── */
const getWaMessage = (user) => {
  const badge = getUserBadge(user).label;
  const firstName = user.name.split(" ")[0];
  const link = "https://chowspace.ng";

  // Build combo string from top 3 items
  const topItems = Object.entries(user.items)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const comboText =
    topItems.length === 0
      ? "your favourite food"
      : topItems.length === 1
        ? topItems[0][0]
        : topItems.length === 2
          ? `${topItems[0][0]} and ${topItems[1][0]}`
          : `${topItems[0][0]}, ${topItems[1][0]} and ${topItems[2][0]}`;

  if (badge === "New") {
    return `Hi ${firstName}! 👋 Welcome to ChowSpace — we're so glad you found us!\n\nWe hope you enjoyed your order 🔥. Come back anytime, we've got plenty more deliciousness waiting for you.\n\nOrder again: ${link}`;
  }
  if (badge === "Regular") {
    return `Hey ${firstName}! 🙌 You're one of our most loyal customers and we truly appreciate you.\n\nWe know you love your ${comboText} — it's always ready for you here 💛. Thanks for always choosing ChowSpace!\n\nOrder now: ${link}`;
  }
  if (badge === "Returning") {
    return `Hey ${firstName}! 😄 Great to see you back on ChowSpace!\n\nYour go-to combo of ${comboText} is still on the menu — and we've got new things you'll love too 👀.\n\nOrder now: ${link}`;
  }
  // Inactive
  return `Hi ${firstName}! 👋 We've missed you on ChowSpace!\n\nIt's been a while — your usual ${comboText} is still here waiting for you 😋. Come back and treat yourself!\n\nOrder now: ${link}`;
};
/* ── derive users from orders ── */
const buildUsers = (orders) => {
  const map = {};
  orders.forEach((order) => {
    const phone =
      order.guestInfo?.phone ||
      order.customerInfo?.phone ||
      order.customerId?.phone ||
      null;
    if (!phone) return;
    const name =
      order.guestInfo?.name ||
      order.customerInfo?.name ||
      order.customerId?.fullname ||
      "Unknown";
    const email =
      order.guestInfo?.email ||
      order.customerInfo?.email ||
      order.customerId?.email ||
      "";
    if (!map[phone]) {
      map[phone] = {
        phone,
        name,
        email,
        orderCount: 0,
        totalSpend: 0,
        items: {},
        orders: [],
        lastOrderDate: null,
        firstOrderDate: null,
        dob: null,
      };
    }
    const u = map[phone];
    u.orderCount += 1;
    u.totalSpend += order.totalAmount || 0;
    u.orders.push(order);
    const d = order.createdAt;
    if (!u.lastOrderDate || d > u.lastOrderDate) u.lastOrderDate = d;
    if (!u.firstOrderDate || d < u.firstOrderDate) u.firstOrderDate = d;
    (order.items || []).forEach((item) => {
      u.items[item.name] = (u.items[item.name] || 0) + (item.quantity || 1);
    });
  });
  return Object.values(map).sort((a, b) => b.orderCount - a.orderCount);
};

const buildTopItems = (users) => {
  const map = {};
  users.forEach((u) =>
    Object.entries(u.items).forEach(([name, qty]) => {
      map[name] = (map[name] || 0) + qty;
    }),
  );
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);
};

/* ════════════════════════════════════════════════════════════
   BULK MESSAGE MODAL
   ════════════════════════════════════════════════════════════ */
function BulkMessageModal({ users, onClose }) {
  const [selectedPhones, setSelectedPhones] = useState(new Set());
  const [messageMode, setMessageMode] = useState("smart"); // "smart" | "custom"
  const [customMessage, setCustomMessage] = useState("");
  const [filterGroup, setFilterGroup] = useState("all");
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [done, setDone] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  const today = new Date();

  const groupOptions = [
    { key: "all", label: "All customers" },
    { key: "new", label: "New" },
    { key: "returning", label: "Returning" },
    { key: "regular", label: "Regulars" },
    { key: "inactive", label: "Inactive" },
    { key: "bday", label: "🎂 Birthdays this month" },
  ];

  const filteredUsers = users.filter((u) => {
    const badge = getUserBadge(u).label.toLowerCase();
    const matchGroup =
      filterGroup === "all" ||
      badge === filterGroup ||
      (filterGroup === "bday" &&
        u.dob &&
        new Date(u.dob).getMonth() === today.getMonth());
    const q = searchQ.toLowerCase();
    const matchSearch =
      !q || u.name.toLowerCase().includes(q) || u.phone.includes(q);
    return matchGroup && matchSearch;
  });

  const allSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selectedPhones.has(u.phone));

  const toggleAll = () => {
    if (allSelected) {
      const next = new Set(selectedPhones);
      filteredUsers.forEach((u) => next.delete(u.phone));
      setSelectedPhones(next);
    } else {
      const next = new Set(selectedPhones);
      filteredUsers.forEach((u) => next.add(u.phone));
      setSelectedPhones(next);
    }
  };

  const toggleUser = (phone) => {
    const next = new Set(selectedPhones);
    next.has(phone) ? next.delete(phone) : next.add(phone);
    setSelectedPhones(next);
  };

  const selectedUsers = users.filter((u) => selectedPhones.has(u.phone));

  /* Opens WhatsApp for each selected user one by one with a small delay */
  const handleSend = async () => {
    if (selectedUsers.length === 0) return;
    setSending(true);
    setSentCount(0);

    for (let i = 0; i < selectedUsers.length; i++) {
      const user = selectedUsers[i];
      const phone = user.phone.replace(/\D/g, "");
      const p = phone.startsWith("0") ? "234" + phone.slice(1) : phone;
      const msg =
        messageMode === "smart"
          ? getWaMessage(user)
          : customMessage.replace(/\{name\}/gi, user.name.split(" ")[0]);
      const url = `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");
      setSentCount(i + 1);
      // Small delay so browser doesn't block popup flood
      await new Promise((r) => setTimeout(r, 800));
    }

    setSending(false);
    setDone(true);
  };

  const smartPreview = selectedUsers[0] ? getWaMessage(selectedUsers[0]) : "";

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        onClick={!sending ? onClose : undefined}
      />
      <div className="fixed z-50 inset-x-4 top-1/2 -translate-y-1/2 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-[640px] bg-white rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Send size={15} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Bulk WhatsApp</p>
              <p className="text-[11px] text-gray-400">
                {selectedPhones.size} recipient
                {selectedPhones.size !== 1 ? "s" : ""} selected
              </p>
            </div>
          </div>
          {!sending && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
            >
              <X size={15} className="text-gray-500" />
            </button>
          )}
        </div>

        {done ? (
          /* ── Done state ── */
          <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 size={28} className="text-emerald-500" />
            </div>
            <p className="text-base font-bold text-gray-900">All done!</p>
            <p className="text-sm text-gray-400 text-center">
              Opened WhatsApp for {sentCount} customer
              {sentCount !== 1 ? "s" : ""}. Messages were pre-filled and ready
              to send.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2.5 bg-[#AE2108] text-white text-sm font-semibold rounded-xl hover:bg-[#921b06] transition"
            >
              Close
            </button>
          </div>
        ) : sending ? (
          /* ── Sending state ── */
          <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
            <Loader2 size={32} className="text-[#AE2108] animate-spin" />
            <p className="text-base font-bold text-gray-900">
              Opening WhatsApp chats...
            </p>
            <p className="text-sm text-gray-400">
              {sentCount} / {selectedUsers.length} done
            </p>
            <div className="w-full max-w-xs bg-gray-100 rounded-full h-2">
              <div
                className="bg-[#AE2108] h-2 rounded-full transition-all"
                style={{
                  width: `${Math.round((sentCount / selectedUsers.length) * 100)}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-gray-400 text-center">
              Allow popups in your browser if chats aren't opening
            </p>
          </div>
        ) : (
          /* ── Main content ── */
          <div className="flex-1 overflow-y-auto">
            {/* Message mode tabs */}
            <div className="px-5 pt-4 pb-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Message type
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setMessageMode("smart")}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition border ${
                    messageMode === "smart"
                      ? "bg-[#AE2108] text-white border-[#AE2108]"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  Smart (auto per badge)
                </button>
                <button
                  onClick={() => setMessageMode("custom")}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition border ${
                    messageMode === "custom"
                      ? "bg-[#AE2108] text-white border-[#AE2108]"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  Custom message
                </button>
              </div>

              {messageMode === "custom" ? (
                <div className="mt-3">
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Type your message... Use {name} to personalise e.g. Hi {name}!"
                    rows={4}
                    className="w-full text-xs text-gray-700 border border-gray-200 rounded-xl px-3 py-2.5 resize-none focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108] outline-none bg-gray-50 focus:bg-white transition"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Use{" "}
                    <code className="bg-gray-100 px-1 rounded">{"{name}"}</code>{" "}
                    to insert each customer's first name
                  </p>
                </div>
              ) : (
                selectedUsers.length > 0 && (
                  <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
                    <p className="text-[10px] font-semibold text-gray-400 mb-1">
                      Preview for {selectedUsers[0].name.split(" ")[0]} (
                      {getUserBadge(selectedUsers[0]).label})
                    </p>
                    <p className="text-[11px] text-gray-600 whitespace-pre-line leading-relaxed">
                      {smartPreview}
                    </p>
                  </div>
                )
              )}
            </div>

            {/* Filter + search */}
            <div className="px-5 py-3 border-b border-gray-100 space-y-2">
              <div
                className="flex gap-1.5 overflow-x-auto pb-0.5"
                style={{ scrollbarWidth: "none" }}
              >
                {groupOptions.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilterGroup(key)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap flex-shrink-0 transition ${
                      filterGroup === key
                        ? "bg-[#AE2108] text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Search name or phone..."
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108] outline-none bg-gray-50 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Select all row */}
            <div
              className="flex items-center gap-3 px-5 py-2.5 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition"
              onClick={toggleAll}
            >
              {allSelected ? (
                <CheckSquare
                  size={16}
                  className="text-[#AE2108] flex-shrink-0"
                />
              ) : (
                <Square size={16} className="text-gray-300 flex-shrink-0" />
              )}
              <span className="text-xs font-semibold text-gray-500">
                Select all ({filteredUsers.length})
              </span>
            </div>

            {/* User list */}
            <div className="divide-y divide-gray-50">
              {filteredUsers.slice(0, 100).map((user) => {
                const badge = getUserBadge(user);
                const av = avatarColor(user.phone);
                const initials = user.name
                  .split(" ")
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase();
                const isSelected = selectedPhones.has(user.phone);

                return (
                  <div
                    key={user.phone}
                    onClick={() => toggleUser(user.phone)}
                    className={`flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors ${
                      isSelected ? "bg-emerald-50/50" : "hover:bg-gray-50"
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare
                        size={16}
                        className="text-emerald-500 flex-shrink-0"
                      />
                    ) : (
                      <Square
                        size={16}
                        className="text-gray-300 flex-shrink-0"
                      />
                    )}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-[11px] ${av.bg} ${av.text}`}
                    >
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {user.name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-mono">
                        {user.phone}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.style}`}
                      >
                        {badge.label}
                      </span>
                      {(() => {
                        const days = daysSince(user.lastOrderDate);
                        if (days === null)
                          return (
                            <span className="text-[10px] text-gray-300">
                              No orders
                            </span>
                          );
                        const rel =
                          days === 0
                            ? "Today"
                            : days === 1
                              ? "Yesterday"
                              : `${days}d ago`;
                        const date = new Date(
                          user.lastOrderDate,
                        ).toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                        });
                        const tone =
                          days === 0
                            ? "text-emerald-600"
                            : days > 14
                              ? "text-amber-600"
                              : "text-gray-400";
                        return (
                          <span
                            className={`flex items-center gap-1 text-[10px] font-medium ${tone}`}
                          >
                            <Clock size={9} className="flex-shrink-0" />
                            {date} · {rel}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                );
              })}
              {filteredUsers.length === 0 && (
                <div className="flex flex-col items-center py-10 gap-2">
                  <Users size={24} className="text-gray-200" />
                  <p className="text-xs text-gray-400">No customers found</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        {!done && !sending && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3 flex-shrink-0">
            {messageMode === "custom" && !customMessage.trim() && (
              <div className="flex items-center gap-1.5 flex-1">
                <AlertCircle
                  size={13}
                  className="text-amber-500 flex-shrink-0"
                />
                <p className="text-[11px] text-amber-600">
                  Enter a message first
                </p>
              </div>
            )}
            <div className="flex-1" />
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-500 bg-gray-100 hover:bg-gray-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={
                selectedPhones.size === 0 ||
                (messageMode === "custom" && !customMessage.trim())
              }
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send size={13} />
              Send to {selectedPhones.size}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ── User Detail Drawer ── */
function UserDrawer({ user, onClose }) {
  if (!user) return null;

  const userFavItems = Object.entries(user.items)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const waReminder = () => {
    const phone = user.phone.replace(/\D/g, "");
    const p = phone.startsWith("0") ? "234" + phone.slice(1) : phone;
    const msg = encodeURIComponent(getWaMessage(user));
    window.open(`https://wa.me/${p}?text=${msg}`, "_blank");
  };

  const waBirthday = () => {
    const phone = user.phone.replace(/\D/g, "");
    const p = phone.startsWith("0") ? "234" + phone.slice(1) : phone;
    const msg = encodeURIComponent(
      `Happy Birthday ${user.name.split(" ")[0]}! 🎂🎉\n\nChowSpace is celebrating with you! Enjoy your special day and treat yourself to something delicious.\n\nOrder now: https://chowspace.ng`,
    );
    window.open(`https://wa.me/${p}?text=${msg}`, "_blank");
  };

  const badge = getUserBadge(user);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="fixed z-50 bottom-0 left-0 right-0 md:bottom-auto md:top-0 md:left-auto md:right-0 md:h-full md:w-96 bg-white rounded-t-2xl md:rounded-none shadow-2xl flex flex-col max-h-[90vh] md:max-h-full overflow-hidden">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-gray-900">{user.name}</p>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.style}`}
              >
                {badge.label}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono">{user.phone}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
          >
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Mini stats */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Orders", value: user.orderCount },
              { label: "Total spend", value: `₦${fmt(user.totalSpend)}` },
              {
                label: "Last order",
                value: user.lastOrderDate
                  ? daysSince(user.lastOrderDate) === 0
                    ? "Today"
                    : `${daysSince(user.lastOrderDate)}d ago`
                  : "—",
              },
              {
                label: "Customer since",
                value: user.firstOrderDate
                  ? new Date(user.firstOrderDate).toLocaleDateString("en-NG", {
                      month: "short",
                      year: "numeric",
                    })
                  : "—",
              },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3">
                <p className="text-[10px] text-gray-400 mb-1">{label}</p>
                <p className="text-sm font-bold text-gray-900">{value}</p>
              </div>
            ))}
          </div>

          {/* Favourite items */}
          {userFavItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Favourite items
              </p>
              <div className="flex flex-wrap gap-1.5">
                {userFavItems.map(([name, qty]) => (
                  <span
                    key={name}
                    className="text-[11px] bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full"
                  >
                    {name}
                    <span className="ml-1 text-[#AE2108] font-semibold">
                      ×{qty}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Order history with combo */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">
              Order history
            </p>
            <div className="space-y-2">
              {user.orders
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 8)
                .map((o) => (
                  <div
                    key={o._id}
                    className="bg-gray-50 rounded-xl px-3 py-2.5 space-y-1.5"
                  >
                    {/* Order top row */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-mono">
                        #{o.orderId || o._id?.slice(-6).toUpperCase()}
                      </span>
                      <span className="text-gray-400">
                        {new Date(o.createdAt).toLocaleDateString("en-NG", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className="font-semibold text-gray-900">
                        ₦{fmt(o.totalAmount)}
                      </span>
                    </div>
                    {/* Combo items */}
                    {o.items?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {o.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full"
                          >
                            {item.name}
                            {item.quantity > 1 && (
                              <span className="ml-0.5 text-[#AE2108] font-semibold">
                                ×{item.quantity}
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 p-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={waReminder}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl transition"
          >
            <MessageCircle size={13} /> Message
          </button>
          {user.dob && (
            <button
              onClick={waBirthday}
              className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-xl transition"
            >
              <Gift size={13} /> Birthday
            </button>
          )}
          <a
            href={`https://wa.me/${user.phone.replace(/\D/g, "").replace(/^0/, "234")}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold rounded-xl transition"
          >
            <PhoneCall size={13} /> Chat
          </a>
        </div>
      </div>
    </>
  );
}

/* ── Pagination controls ── */
function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);
  return (
    <div className="flex items-center justify-center gap-1 py-4">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <ChevronLeft size={15} />
      </button>
      {start > 1 && (
        <>
          <button
            onClick={() => onChange(1)}
            className="w-8 h-8 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 transition"
          >
            1
          </button>
          {start > 2 && <span className="text-xs text-gray-300 px-1">…</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
            p === page
              ? "bg-[#AE2108] text-white"
              : "text-gray-500 hover:bg-gray-100"
          }`}
        >
          {p}
        </button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="text-xs text-gray-300 px-1">…</span>
          )}
          <button
            onClick={() => onChange(totalPages)}
            className="w-8 h-8 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 transition"
          >
            {totalPages}
          </button>
        </>
      )}
      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition"
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
   ════════════════════════════════════════════════════════════ */
export default function UserAnalysisPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [page, setPage] = useState(1);
  const [bulkOpen, setBulkOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/Login");
  }, [status]);

  useEffect(() => {
    if (!session?.user?.accessToken) return;
    setLoading(true);
    axios
      .get(`${BACKENDURL}/api/getAllOrdersForAdmin`, {
        headers: { Authorization: `Bearer ${session.user.accessToken}` },
      })
      .then((r) => setOrders(r.data.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [session]);

  const logout = async () => await signOut({ callbackUrl: "/Login" });

  const users = buildUsers(orders);
  const topItems = buildTopItems(users);
  const maxItemCount = topItems[0]?.[1] || 1;

  /* ── stats ── */
  const totalUsers = users.length;
  const orderedToday = users.filter(
    (u) => daysSince(u.lastOrderDate) === 0,
  ).length;
  const repeatUsers = users.filter((u) => u.orderCount >= 2).length;
  const repeatPct = totalUsers
    ? Math.round((repeatUsers / totalUsers) * 100)
    : 0;
  const today = new Date();
  const birthdayUsers = users.filter((u) => {
    if (!u.dob) return false;
    const d = new Date(u.dob);
    return d.getMonth() === today.getMonth();
  });

  /* ── filter + search ── */
  const filtered = users.filter((u) => {
    const badge = getUserBadge(u).label.toLowerCase();
    const matchFilter =
      filter === "all" ||
      (filter === "hot" && badge === "regular") ||
      (filter === "new" && badge === "new") ||
      (filter === "cold" && badge === "inactive") ||
      (filter === "returning" && badge === "returning") ||
      (filter === "bday" &&
        (() => {
          if (!u.dob) return false;
          const d = new Date(u.dob);
          return d.getMonth() === today.getMonth();
        })());
    const q = search.toLowerCase();
    const matchSearch =
      !q || u.name.toLowerCase().includes(q) || u.phone.includes(q);
    return matchFilter && matchSearch;
  });

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <AdminLayout
      title="User Analysis"
      subtitle={new Date().toLocaleDateString("en-NG", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}
      actions={
        <>
          {!loading && users.length > 0 && (
            <button
              onClick={() => setBulkOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl transition shadow-sm"
            >
              <Send size={13} />
              <span className="hidden sm:inline">Bulk Message</span>
            </button>
          )}
          {!loading && (
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
              {filtered.length.toLocaleString()} customer
              {filtered.length !== 1 ? "s" : ""}
            </span>
          )}
        </>
      }
    >
      <div className="px-4 py-5 max-w-6xl mx-auto space-y-5">
        {/* ── Stat cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: "Total customers",
              value: loading ? "—" : fmt(totalUsers),
              sub: "unique phone numbers",
              icon: Users,
              iconClass: "bg-blue-50 text-blue-500",
            },
            {
              label: "Ordered today",
              value: loading ? "—" : orderedToday,
              sub: "active right now",
              icon: ShoppingBag,
              iconClass: "bg-[#AE2108]/10 text-[#AE2108]",
              primary: true,
            },
            {
              label: "Repeat customers",
              value: loading ? "—" : `${repeatPct}%`,
              sub: `${fmt(repeatUsers)} ordered 2+`,
              icon: RefreshCw,
              iconClass: "bg-emerald-50 text-emerald-600",
            },
            {
              label: "Birthdays this month",
              value: loading ? "—" : birthdayUsers.length,
              sub: "send them a surprise",
              icon: Gift,
              iconClass: "bg-amber-50 text-amber-500",
            },
          ].map(({ label, value, sub, icon: Icon, iconClass, primary }) => (
            <div
              key={label}
              className={`relative overflow-hidden rounded-2xl p-4 border transition-all hover:-translate-y-0.5 hover:shadow-lg
                ${primary ? "bg-[#AE2108] border-[#AE2108] shadow-[0_4px_24px_rgba(174,33,8,0.2)]" : "bg-white border-gray-100 shadow-sm"}`}
            >
              {primary && (
                <>
                  <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
                  <div className="absolute -right-1 bottom-0 w-12 h-12 rounded-full bg-white/5 pointer-events-none" />
                </>
              )}
              <div className="relative flex items-start justify-between mb-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center ${primary ? "bg-white/20" : iconClass}`}
                >
                  <Icon size={16} className={primary ? "text-white" : ""} />
                </div>
              </div>
              <p
                className={`text-xl font-bold mb-0.5 ${primary ? "text-white" : "text-gray-900"}`}
              >
                {value}
              </p>
              <p
                className={`text-xs font-medium ${primary ? "text-white/70" : "text-gray-400"}`}
              >
                {label}
              </p>
              <p
                className={`text-[10px] mt-0.5 ${primary ? "text-white/50" : "text-gray-300"}`}
              >
                {sub}
              </p>
            </div>
          ))}
        </div>

        {/* ── Birthday banner ── */}
        {birthdayUsers.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <Gift size={16} className="text-amber-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">
                {birthdayUsers.length} customer
                {birthdayUsers.length > 1 ? "s have" : " has"} a birthday this
                month
              </p>
              <p className="text-xs text-amber-600 mt-0.5 truncate">
                {birthdayUsers.map((u) => u.name.split(" ")[0]).join(", ")}
              </p>
            </div>
            <button
              onClick={() => setFilter("bday")}
              className="flex-shrink-0 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-xl transition"
            >
              View all
            </button>
          </div>
        )}

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left: user list ── */}
          <div className="lg:col-span-2 space-y-3">
            {/* Search + filters */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or phone..."
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108] outline-none bg-gray-50 focus:bg-white transition"
                />
              </div>
              <div
                className="flex gap-2 overflow-x-auto pb-0.5"
                style={{ scrollbarWidth: "none" }}
              >
                {[
                  { key: "all", label: `All (${users.length})` },
                  { key: "hot", label: "Regulars" },
                  { key: "returning", label: "Returning" },
                  { key: "new", label: "New" },
                  { key: "cold", label: "Inactive" },
                  ...(birthdayUsers.length > 0
                    ? [
                        {
                          key: "bday",
                          label: `🎂 Birthdays (${birthdayUsers.length})`,
                        },
                      ]
                    : []),
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilter(key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition whitespace-nowrap flex-shrink-0 ${
                      filter === key
                        ? "bg-[#AE2108] text-white"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* User list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-5 space-y-4">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 animate-pulse"
                    >
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-100 rounded-full w-2/5" />
                        <div className="h-2.5 bg-gray-100 rounded-full w-1/4" />
                      </div>
                      <div className="h-6 bg-gray-100 rounded-full w-16" />
                    </div>
                  ))}
                </div>
              ) : paginated.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Users size={28} className="text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">No customers found</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-50">
                    {paginated.map((user) => {
                      const badge = getUserBadge(user);
                      const av = avatarColor(user.phone);
                      const initials = user.name
                        .split(" ")
                        .slice(0, 2)
                        .map((w) => w[0])
                        .join("")
                        .toUpperCase();
                      const days = daysSince(user.lastOrderDate);
                      return (
                        <div
                          key={user.phone}
                          onClick={() => setSelectedUser(user)}
                          className="flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50/70 transition-colors active:bg-gray-100"
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs ${av.bg} ${av.text}`}
                          >
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {user.name}
                            </p>
                            <p className="text-[11px] text-gray-400 font-mono">
                              {user.phone}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.style}`}
                            >
                              {badge.label}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {user.orderCount} order
                              {user.orderCount !== 1 ? "s" : ""}
                              {days !== null
                                ? ` · ${days === 0 ? "today" : `${days}d ago`}`
                                : ""}
                            </span>
                          </div>
                          <ChevronRight
                            size={14}
                            className="flex-shrink-0 text-gray-300"
                          />
                        </div>
                      );
                    })}
                  </div>
                  {/* Pagination */}
                  <div className="border-t border-gray-100">
                    <Pagination
                      page={page}
                      totalPages={totalPages}
                      onChange={(p) => {
                        setPage(p);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    />
                    <p className="text-center text-[11px] text-gray-400 pb-3">
                      Showing {(page - 1) * PAGE_SIZE + 1}–
                      {Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
                      {filtered.length.toLocaleString()}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Right: top items + quick actions (desktop only) ── */}
          <div className="hidden lg:flex flex-col gap-4">
            {/* Top items chart */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp size={16} className="text-[#AE2108]" />
                Most ordered items
              </p>
              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="h-2.5 bg-gray-100 rounded-full w-24 flex-shrink-0" />
                      <div className="h-2 bg-gray-100 rounded-full flex-1" />
                    </div>
                  ))}
                </div>
              ) : topItems.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-6">
                  No data yet
                </p>
              ) : (
                <div className="space-y-3">
                  {topItems.map(([name, count]) => (
                    <div key={name} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-28 truncate flex-shrink-0">
                        {name}
                      </span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#AE2108] rounded-full transition-all"
                          style={{
                            width: `${Math.round((count / maxItemCount) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[11px] text-gray-400 w-6 text-right flex-shrink-0">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">
                Quick actions
              </p>
              <div className="space-y-1">
                {[
                  {
                    label: "Regulars",
                    icon: UserCheck,
                    color: "text-[#AE2108]",
                    bg: "bg-[#AE2108]/10",
                    filterKey: "hot",
                  },
                  {
                    label: "Birthday greetings",
                    icon: Gift,
                    color: "text-amber-600",
                    bg: "bg-amber-50",
                    filterKey: "bday",
                  },
                  {
                    label: "Inactive customers",
                    icon: Clock,
                    color: "text-gray-500",
                    bg: "bg-gray-100",
                    filterKey: "cold",
                  },
                  {
                    label: "New customers",
                    icon: Users,
                    color: "text-blue-600",
                    bg: "bg-blue-50",
                    filterKey: "new",
                  },
                ].map(({ label, icon: Icon, color, bg, filterKey }) => (
                  <button
                    key={label}
                    onClick={() => setFilter(filterKey)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group text-left"
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}
                    >
                      <Icon size={14} className={color} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 flex-1">
                      {label}
                    </span>
                    <ChevronRight
                      size={13}
                      className="text-gray-300 group-hover:text-[#AE2108] transition-colors"
                    />
                  </button>
                ))}
              </div>

              {/* Bulk message shortcut */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setBulkOpen(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 transition-colors group text-left"
                >
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-100">
                    <Send size={14} className="text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-emerald-700 group-hover:text-emerald-900 flex-1">
                    Bulk WhatsApp
                  </span>
                  <ChevronRight
                    size={13}
                    className="text-emerald-300 group-hover:text-emerald-600 transition-colors"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Most ordered items — mobile only */}
        <div className="lg:hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#AE2108]" />
            Most ordered items
          </p>
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-2.5 bg-gray-100 rounded-full w-24 flex-shrink-0" />
                  <div className="h-2 bg-gray-100 rounded-full flex-1" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {topItems.map(([name, count]) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-28 truncate flex-shrink-0">
                    {name}
                  </span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#AE2108] rounded-full"
                      style={{
                        width: `${Math.round((count / maxItemCount) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-gray-400 w-6 text-right flex-shrink-0">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
