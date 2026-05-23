"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { io } from "socket.io-client";
import axios from "axios";
import {
  MessageCircle,
  Send,
  Paperclip,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  Package,
  MapPin,
  Phone,
  User,
  Search,
  Clock,
  CheckCheck,
  CreditCard,
  X,
  AlertCircle,
} from "lucide-react";

const BACKEND_URL = "https://chowspace-backend-1.onrender.com";
const COMPLETED_ROOMS_KEY = "cs_vendor_completed_rooms";

const loadCompletedRooms = () => {
  if (typeof window === "undefined") return new Set();
  try {
    const saved = localStorage.getItem(COMPLETED_ROOMS_KEY);
    return new Set(saved ? JSON.parse(saved) : []);
  } catch {
    return new Set();
  }
};

const persistCompletedRooms = (set) => {
  localStorage.setItem(COMPLETED_ROOMS_KEY, JSON.stringify([...set]));
};

const isOrderCard = (text) =>
  typeof text === "string" && text.startsWith("🛒 NEW ORDER");

const isPaymentRequestCard = (text) =>
  typeof text === "string" && text.startsWith("💳 PAYMENT REQUEST");

const parseOrderCard = (text) => {
  const lines = text.split("\n");
  const orderId = lines[0]?.replace("🛒 NEW ORDER — ", "").trim();
  const customer = lines
    .find((l) => l.startsWith("👤"))
    ?.replace("👤 Customer :", "")
    .trim();
  const phone = lines
    .find((l) => l.startsWith("📞"))
    ?.replace("📞 Phone    :", "")
    .trim();
  const location = lines
    .find((l) => l.startsWith("📍"))
    ?.replace("📍 Location :", "")
    .trim();
  const address = lines
    .find((l) => l.startsWith("🏠"))
    ?.replace("🏠 Address  :", "")
    .trim();

  const packs = [];
  let currentPack = null;
  for (const line of lines) {
    if (line.startsWith("📦 Pack")) {
      currentPack = { title: line, items: [] };
      packs.push(currentPack);
    } else if (currentPack && line.startsWith("  •")) {
      currentPack.items.push(line.replace("  •", "").trim());
    }
  }

  const dividerIdx = lines.findIndex((l) => l.startsWith("─"));
  const totals = [];
  const seenLabels = new Set();
  if (dividerIdx > 0) {
    for (let i = 0; i < dividerIdx; i++) {
      const line = lines[i]?.trim();
      if (!line) continue;
      if (
        line.includes("₦") &&
        !line.startsWith("📦") &&
        !line.startsWith("  •") &&
        !line.startsWith("🛒") &&
        !line.startsWith("👤") &&
        !line.startsWith("📞") &&
        !line.startsWith("📍") &&
        !line.startsWith("🏠") &&
        !line.includes("  —  ")
      ) {
        const label = line.split(/\s+/)[0]?.toLowerCase();
        if (label && !seenLabels.has(label)) {
          seenLabels.add(label);
          totals.push(line);
        }
      }
    }
  }
  const totalLine = dividerIdx >= 0 ? lines[dividerIdx + 1]?.trim() : "";
  return {
    orderId,
    customer,
    phone,
    location,
    address,
    packs,
    totals,
    totalLine,
  };
};

/* ─── OrderCard ─── */
function OrderCard({ text }) {
  const {
    orderId,
    customer,
    phone,
    location,
    address,
    packs,
    totals,
    totalLine,
  } = parseOrderCard(text);
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-200 bg-white max-w-xs w-full">
      <div className="bg-[#AE2108] px-4 py-3">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-white" />
          <span className="text-white font-bold text-sm">New Order</span>
        </div>
        <p className="text-white/70 text-xs font-mono mt-0.5">{orderId}</p>
      </div>
      <div className="px-4 py-3 border-b border-gray-100 space-y-1.5">
        {customer && (
          <div className="flex items-center gap-2 text-xs text-gray-700">
            <User size={12} className="text-gray-400 flex-shrink-0" />
            <span className="font-medium">{customer}</span>
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Phone size={12} className="text-gray-400 flex-shrink-0" />
            <span>{phone}</span>
          </div>
        )}
        {(location || address) && (
          <div className="flex items-start gap-2 text-xs text-gray-600">
            <MapPin size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
            <span>
              {location}
              {location && address ? " · " : ""}
              {address}
            </span>
          </div>
        )}
      </div>
      {packs.map((pack, i) => (
        <div key={i} className="px-4 py-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-2">
            {pack.title}
          </p>
          {pack.items.map((item, j) => {
            const [name, price] = item.split("  —  ");
            return (
              <div
                key={j}
                className="flex justify-between items-center text-xs text-gray-700 py-0.5"
              >
                <span>{name?.trim()}</span>
                <span className="font-semibold text-gray-900">
                  {price?.trim()}
                </span>
              </div>
            );
          })}
        </div>
      ))}
      {totals.length > 0 && (
        <div className="px-4 pt-3 space-y-1">
          {totals.map((line, i) => {
            const match = line.match(/^(.+?)\s+(₦[\d,]+)$/);
            return (
              <div
                key={i}
                className="flex justify-between text-xs text-gray-500"
              >
                <span>{match ? match[1].trim() : line}</span>
                <span>{match ? match[2].trim() : ""}</span>
              </div>
            );
          })}
        </div>
      )}
      {totalLine && (
        <div className="px-4 py-3 border-t border-gray-200 mt-2 flex justify-between items-center">
          <span className="text-sm font-bold text-gray-800">Total</span>
          <span className="text-base font-extrabold text-[#AE2108]">
            {totalLine.replace(/^TOTAL\s*/i, "").trim()}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── PaymentRequestCardSent (vendor side) ─── */
function PaymentRequestCardSent({ text }) {
  const lines = text.split("\n");
  const orderId = lines[0]?.replace("💳 PAYMENT REQUEST — ", "").trim();
  const amount = lines
    .find((l) => l.startsWith("Amount:"))
    ?.replace("Amount:", "")
    .trim();
  const bankName = lines
    .find((l) => l.startsWith("Bank:"))
    ?.replace("Bank:", "")
    .trim();
  const accountNumber = lines
    .find((l) => l.startsWith("Account:"))
    ?.replace("Account:", "")
    .trim();

  return (
    <div className="rounded-2xl overflow-hidden border border-[#AE2108]/20 bg-[#AE2108]/5 max-w-xs w-full">
      <div className="bg-[#AE2108] px-4 py-3 flex items-center gap-2">
        <CreditCard size={16} className="text-white" />
        <span className="text-white font-bold text-sm">
          Payment Request Sent
        </span>
      </div>
      <div className="px-4 py-3 space-y-1">
        <p className="text-xs text-gray-400 font-mono">{orderId}</p>
        <p className="text-lg font-extrabold text-[#AE2108]">{amount}</p>
        {bankName && (
          <p className="text-xs text-gray-500">
            {bankName} · {accountNumber}
          </p>
        )}
        <p className="text-xs text-gray-400">Awaiting customer payment…</p>
      </div>
    </div>
  );
}

/* ─── ImageLightbox ─── */
function ImageLightbox({ src, alt, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
      >
        ✕
      </button>
      <img
        src={src}
        alt={alt || "Image"}
        className="max-w-[92vw] max-h-[88vh] rounded-2xl shadow-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}

/* ─── MessageBubble ─── */
function MessageBubble({ msg }) {
  const isCard = isOrderCard(msg.text);
  const isPayCard = isPaymentRequestCard(msg.text);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const isImage =
    msg.fileUrl &&
    (/\.(jpg|jpeg|png|gif|webp)$/i.test(msg.fileName || "") ||
      (msg.fileUrl.includes("cloudinary") && !msg.fileUrl.includes(".pdf")));

  return (
    <div className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[80%]">
        {!msg.isOwn && !isCard && !isPayCard && (
          <p className="text-[10px] text-gray-400 mb-1 ml-2 font-medium">
            {msg.senderName}
          </p>
        )}
        {isCard ? (
          <OrderCard text={msg.text} />
        ) : isPayCard ? (
          <PaymentRequestCardSent text={msg.text} />
        ) : (
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.isOwn ? "bg-[#AE2108] text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none border border-gray-100"}`}
          >
            {msg.text && (
              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            )}
            {isImage && (
              <>
                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="mt-2 block focus:outline-none"
                >
                  <img
                    src={msg.fileUrl}
                    alt={msg.fileName || "Image"}
                    className="rounded-xl max-w-[220px] max-h-[220px] w-full object-cover cursor-pointer hover:opacity-90 transition"
                  />
                </button>
                {lightboxOpen && (
                  <ImageLightbox
                    src={msg.fileUrl}
                    alt={msg.fileName}
                    onClose={() => setLightboxOpen(false)}
                  />
                )}
              </>
            )}
            {msg.fileUrl && !isImage && (
              <a
                href={msg.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-2 flex items-center gap-2 rounded-lg p-2 text-xs border ${msg.isOwn ? "border-white/30" : "border-gray-200"}`}
              >
                <Paperclip size={13} />
                <span className="truncate">{msg.fileName || "View file"}</span>
              </a>
            )}
            <span
              className={`block mt-1 text-[10px] text-right leading-none ${msg.isOwn ? "text-white/50" : "text-gray-300"}`}
            >
              {msg.time}
              {msg.isOwn && (
                <CheckCircle2 size={10} className="inline ml-1 opacity-60" />
              )}
            </span>
          </div>
        )}
        {(isCard || isPayCard) && (
          <p className="text-[10px] mt-1 text-left text-gray-400 ml-1">
            {msg.time}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── SendPaymentModal — auto-filled from vendor session ─── */
function SendPaymentModal({
  orderId,
  resolvedTotal,
  vendorData,
  onSend,
  onClose,
}) {
  const hasBankDetails =
    vendorData?.accountNumber &&
    vendorData?.bankName &&
    vendorData?.accountName;

  const [amount, setAmount] = useState(
    resolvedTotal?.replace("₦", "").replace(/,/g, "") || "",
  );
  const [note, setNote] = useState("");

  const handleSend = () => {
    const amt = amount.trim();
    if (!amt || !hasBankDetails) return;
    const formatted = `₦${parseInt(amt.replace(/,/g, ""), 10).toLocaleString()}`;
    const text =
      `💳 PAYMENT REQUEST — ${orderId || "Order"}\n` +
      `Amount: ${formatted}\n` +
      `Bank: ${vendorData.bankName}\n` +
      `Account: ${vendorData.accountNumber}\n` +
      `AccountName: ${vendorData.accountName}\n` +
      (note.trim() ? `Note: ${note.trim()}\n` : "") +
      `__PAYMENT_REQUEST__`;
    onSend(text);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-[#AE2108]" />
            <span className="font-bold text-gray-900 text-sm">
              Request Payment
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
          >
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
              Amount (₦)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">
                ₦
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108] bg-gray-50 focus:bg-white transition"
              />
            </div>
            {resolvedTotal && (
              <button
                onClick={() =>
                  setAmount(resolvedTotal.replace("₦", "").replace(/,/g, ""))
                }
                className="mt-1.5 text-xs text-[#AE2108] font-semibold hover:underline"
              >
                Use order total ({resolvedTotal})
              </button>
            )}
          </div>

          {/* Vendor bank details — read only, auto-filled */}
          {hasBankDetails ? (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
                Your bank account (auto-filled)
              </label>
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Bank</span>
                  <span className="font-semibold text-gray-800">
                    {vendorData.bankName}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Account number</span>
                  <span className="font-bold text-gray-900 font-mono">
                    {vendorData.accountNumber}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Account name</span>
                  <span className="font-semibold text-gray-800">
                    {vendorData.accountName}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                These details come from your vendor profile. Update them in
                Settings.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2.5">
              <AlertCircle
                size={16}
                className="text-amber-500 flex-shrink-0 mt-0.5"
              />
              <div>
                <p className="text-xs font-semibold text-amber-800">
                  Bank details not set
                </p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Go to Settings → Bank Details to add your account. Customers
                  will still see the Monei and Card options.
                </p>
              </div>
            </div>
          )}

          {/* Optional note */}
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. includes delivery"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108] bg-gray-50 focus:bg-white transition"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={!amount.trim() || !hasBankDetails}
            className="w-full py-3.5 bg-[#AE2108] text-white font-bold text-sm rounded-xl hover:bg-[#941B06] transition disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <CreditCard size={16} />
            Send Payment Request
          </button>
          <p className="text-center text-xs text-gray-400">
            Customer will choose between Monei, your bank account, or card
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Quick replies defaults ─── */
const DEFAULT_QUICK_REPLIES = [
  {
    id: "qr1",
    label: "Payment details",
    text: "Kindly send payment using the payment request above. You can pay via Monei, bank transfer, or card.",
  },
  {
    id: "qr2",
    label: "Order confirmed",
    text: "Your order has been confirmed and is being processed. 🎉\n\n*NOTE*: Delivery is within *15–40 minutes* after payment confirmation.\n\nKindly stay by your phone and avoid DND.\n\nThank you for your patronage! 🙏",
  },
  {
    id: "qr3",
    label: "Food unavailable",
    text: "Sorry 😔, this food item is currently unavailable. Kindly check our menu for other available options or contact us for more info.",
  },
  {
    id: "qr4",
    label: "Send proof of payment",
    text: "Please send a screenshot as proof of payment showing your account name so we can confirm your order. Thank you!",
  },
];
const QR_STORAGE_KEY = "cs_vendor_quick_replies";

/* ─── RoomList ─── */
function RoomList({
  vendorId,
  onSelectRoom,
  selectedRoomId,
  completedIds,
  onToggleComplete,
}) {
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  const fetchRooms = useCallback(
    async (silent = false) => {
      if (!silent) setRefreshing(true);
      try {
        const { data } = await axios.get(
          `${BACKEND_URL}/api/chat/vendor/${vendorId}`,
        );
        setRooms(data.rooms || []);
      } catch (err) {
        console.error("fetchRooms failed:", err.message);
      } finally {
        setLoading(false);
        if (!silent) setRefreshing(false);
      }
    },
    [vendorId],
  );

  useEffect(() => {
    if (vendorId) fetchRooms();
  }, [vendorId, fetchRooms]);

  useEffect(() => {
    if (!vendorId) return;
    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    socket.on("connect", () => socket.emit("joinVendorRoom", vendorId));
    socket.on("newChatNotification", () => fetchRooms(true));
    socket.on("receiveMessage", () => fetchRooms(true));
    return () => socket.disconnect();
  }, [vendorId, fetchRooms]);

  useEffect(() => {
    if (!vendorId) return;
    const interval = setInterval(() => fetchRooms(true), 10_000);
    return () => clearInterval(interval);
  }, [vendorId, fetchRooms]);

  useEffect(() => {
    if (!vendorId) return;
    const handle = () => {
      if (document.visibilityState === "visible") fetchRooms(true);
    };
    document.addEventListener("visibilitychange", handle);
    return () => document.removeEventListener("visibilitychange", handle);
  }, [vendorId, fetchRooms]);

  const orderRoomOrderIds = new Set(
    rooms
      .filter((r) => r._id.startsWith("order_") && r.orderId)
      .map((r) => r.orderId),
  );
  const deduped = rooms.filter((r) => {
    if (r._id.startsWith("order_")) return true;
    if (r.orderId && orderRoomOrderIds.has(r.orderId)) return false;
    return true;
  });

  const activeRooms = deduped.filter((r) => !completedIds.has(r._id));
  const completedRooms = deduped.filter((r) => completedIds.has(r._id));
  const tabRooms = activeTab === "active" ? activeRooms : completedRooms;

  const filtered = tabRooms.filter((r) => {
    const s = search.toLowerCase();
    return (
      (r.lastSender || "").toLowerCase().includes(s) ||
      (r.lastMessage || "").toLowerCase().includes(s) ||
      (r.orderId || "").toLowerCase().includes(s)
    );
  });

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const isToday = d.toDateString() === new Date().toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle size={18} className="text-[#AE2108]" />
            Customer Chats
          </h2>
          <button
            onClick={() => fetchRooms()}
            disabled={refreshing}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition disabled:opacity-40"
          >
            <RefreshCw
              size={14}
              className={`text-gray-400 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        <div className="flex rounded-xl bg-gray-100 p-1 mb-3">
          {[
            {
              key: "active",
              icon: MessageCircle,
              label: "Active",
              count: activeRooms.length,
              color: "bg-[#AE2108]",
            },
            {
              key: "completed",
              icon: CheckCheck,
              label: "Completed",
              count: completedRooms.length,
              color: "bg-green-500",
            },
          ].map(({ key, icon: Icon, label, count, color }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${activeTab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
            >
              <Icon size={12} />
              {label}
              {count > 0 && (
                <span
                  className={`min-w-[16px] h-4 flex items-center justify-center rounded-full ${color} text-white text-[9px] font-bold px-1`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search by name or order ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#AE2108]/20"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw size={20} className="text-gray-300 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            {activeTab === "completed" ? (
              <>
                <CheckCheck size={32} className="text-gray-200 mb-3" />
                <p className="text-sm text-gray-400 font-medium">
                  No completed orders yet
                </p>
              </>
            ) : (
              <>
                <MessageCircle size={32} className="text-gray-200 mb-3" />
                <p className="text-sm text-gray-400 font-medium">
                  No active chats
                </p>
              </>
            )}
          </div>
        ) : (
          filtered.map((room) => {
            const isSelected = room._id === selectedRoomId;
            const isOrderChat = room._id?.startsWith("order_");
            const isCompleted = completedIds.has(room._id);
            const previewText = isOrderCard(room.lastMessage)
              ? "🛒 New order received"
              : isPaymentRequestCard(room.lastMessage)
                ? "💳 Payment request sent"
                : room.lastMessage || "No messages yet";

            return (
              <button
                key={room._id}
                onClick={() => onSelectRoom(room)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-50 transition hover:bg-gray-50 ${isSelected ? "bg-[#AE2108]/5 border-l-2 border-l-[#AE2108]" : ""} ${isCompleted ? "opacity-75" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isCompleted ? "bg-green-50" : "bg-[#AE2108]/10"}`}
                  >
                    {isCompleted ? (
                      <CheckCheck size={16} className="text-green-500" />
                    ) : isOrderChat ? (
                      <Package size={16} className="text-[#AE2108]" />
                    ) : (
                      <User size={16} className="text-[#AE2108]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {room.lastSender || "Customer"}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                        {!isCompleted && room.unreadCount > 0 && (
                          <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#AE2108] text-white text-[9px] font-bold px-1">
                            {room.unreadCount > 99 ? "99+" : room.unreadCount}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <Clock size={9} />
                          {formatTime(room.lastTime)}
                        </span>
                      </div>
                    </div>
                    {room.orderId && (
                      <p className="text-[10px] text-[#AE2108] font-mono mb-0.5">
                        {room.orderId}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-500 truncate">
                        {previewText}
                      </p>
                      {isCompleted && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete(room._id, false);
                          }}
                          className="flex-shrink-0 text-[10px] text-blue-400 hover:text-blue-600 hover:underline"
                        >
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ─── ChatWindow ─── */
function ChatWindow({
  room,
  vendorId,
  vendorName,
  vendorData,
  onBack,
  onComplete,
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [quickReplies, setQuickReplies] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_QUICK_REPLIES;
    try {
      const saved = localStorage.getItem(QR_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_QUICK_REPLIES;
    } catch {
      return DEFAULT_QUICK_REPLIES;
    }
  });
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newText, setNewText] = useState("");

  const saveQuickReplies = (updated) => {
    setQuickReplies(updated);
    localStorage.setItem(QR_STORAGE_KEY, JSON.stringify(updated));
  };
  const handleQuickSend = (text, qrId) => {
    sendMessage({ text });
    setShowQuickReplies(false);
    if (qrId === "qr2") onComplete?.(room._id);
  };

  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const roomId = room._id;
  const senderName = vendorName || "Vendor";
  const senderType = "vendor";

  const resolvedTotal = useMemo(() => {
    const cardMsg = messages.find((m) => isOrderCard(m.text));
    if (!cardMsg) return null;
    const lines = cardMsg.text.split("\n");
    const dividerIdx = lines.findIndex((l) => l.startsWith("─"));
    if (dividerIdx >= 0) {
      const totalLine = lines[dividerIdx + 1]?.trim();
      const totalMatch = totalLine?.match(/TOTAL\s+(₦[\d,]+)/i);
      if (totalMatch) return totalMatch[1];
    }
    return null;
  }, [messages]);

  const resolvedOrderId = useMemo(() => {
    const cardMsg = messages.find((m) => isOrderCard(m.text));
    if (!cardMsg) return room.orderId || null;
    return cardMsg.text.split("\n")[0]?.replace("🛒 NEW ORDER — ", "").trim();
  }, [messages, room.orderId]);

  useEffect(() => {
    setHistoryLoading(true);
    setMessages([]);
    axios
      .get(`${BACKEND_URL}/api/chat/${roomId}`)
      .then(({ data }) => {
        setMessages(
          (data.messages || []).map((m) => ({
            id: m._id,
            isOwn: m.senderType === "vendor",
            senderName: m.sender,
            senderType: m.senderType,
            text: m.text,
            fileUrl: m.fileUrl || null,
            fileName: m.fileName || null,
            time: new Date(m.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          })),
        );
      })
      .catch((err) => console.error("history load failed:", err.message))
      .finally(() => setHistoryLoading(false));
  }, [roomId]);

  useEffect(() => {
    if (socketRef.current) socketRef.current.disconnect();
    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    socketRef.current = socket;
    socket.on("connect", () => {
      setConnected(true);
      if (roomId.startsWith("order_"))
        socket.emit("joinOrderRoom", roomId.replace("order_", ""));
      else socket.emit("joinVendorRoom", vendorId);
    });
    socket.on("disconnect", () => setConnected(false));
    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => {
        if (msg._id && prev.some((m) => m.id === msg._id)) return prev;
        if (msg.senderType === "vendor") return prev;
        return [
          ...prev,
          {
            id: msg._id || `inc_${Date.now()}`,
            isOwn: false,
            senderName: msg.sender,
            senderType: msg.senderType,
            text: msg.text,
            fileUrl: msg.fileUrl || null,
            fileName: msg.fileName || null,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ];
      });
    });
    socket.on("paymentConfirmed", ({ orderId, amount }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `pay_${Date.now()}`,
          isOwn: false,
          senderName: "Customer",
          senderType: "customer",
          text: `✅ Customer confirmed payment of ${amount} for order ${orderId}`,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    });
    return () => socket.disconnect();
  }, [roomId, vendorId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    ({ text = "", fileUrl = null, fileName = null } = {}) => {
      if ((!text && !fileUrl) || !socketRef.current?.connected) return;
      const optimisticId = `opt_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: optimisticId,
          isOwn: true,
          senderName,
          senderType,
          text,
          fileUrl,
          fileName,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
      setInput("");
      socketRef.current.emit("sendMessage", {
        roomId,
        text,
        sender: senderName,
        senderType,
        vendorId,
        orderId: room.orderId || null,
        fileUrl,
        fileName,
      });
    },
    [roomId, senderName, senderType, vendorId, room.orderId],
  );

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await axios.post(`${BACKEND_URL}/api/upload`, form);
      sendMessage({ fileUrl: data.url, fileName: file.name });
    } catch {
      sendMessage({ text: `📎 ${file.name} (upload failed)` });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const customerName = room.lastSender || "Customer";

  return (
    <div className="flex flex-col h-full">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm flex-shrink-0">
        <button
          onClick={onBack}
          className="lg:hidden w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div className="w-10 h-10 rounded-full bg-[#AE2108]/10 flex items-center justify-center flex-shrink-0">
          <User size={20} className="text-[#AE2108]" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 text-sm truncate">
            {customerName}
          </h2>
          <p className="text-xs text-gray-400">
            {room.orderId ? `Order: ${room.orderId}` : "General enquiry"}
          </p>
        </div>
        <button
          onClick={() => setShowPaymentModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#AE2108] text-white text-xs font-semibold rounded-xl hover:bg-[#941B06] transition flex-shrink-0"
        >
          <CreditCard size={13} />
          <span className="hidden sm:inline">Request Payment</span>
        </button>
        <div className="flex items-center gap-1.5">
          {connected ? (
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          ) : (
            <RefreshCw size={13} className="text-gray-300 animate-spin" />
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-5 space-y-3 bg-gray-50">
        {historyLoading ? (
          <div className="flex justify-center py-16">
            <RefreshCw size={22} className="text-gray-300 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <MessageCircle size={28} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-white border-t flex-shrink-0">
        {showQuickReplies && (
          <div className="border-b border-gray-100 px-4 py-3 max-h-80 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                ⚡ Quick Replies
              </p>
              <button
                onClick={() => setAddingNew(true)}
                className="text-xs text-[#AE2108] font-semibold hover:underline"
              >
                + Add new
              </button>
            </div>

            {resolvedTotal && (
              <div className="mb-3 p-3 bg-[#AE2108]/5 border border-[#AE2108]/20 rounded-xl">
                <p className="text-[10px] font-bold text-[#AE2108] uppercase tracking-wide mb-2">
                  📦 This Order · {resolvedTotal}
                </p>
                <button
                  onClick={() => {
                    setShowPaymentModal(true);
                    setShowQuickReplies(false);
                  }}
                  className="px-3 py-1.5 bg-[#AE2108] text-white text-xs font-semibold rounded-lg hover:bg-[#941B06] transition flex items-center gap-1"
                >
                  <CreditCard size={11} /> Request payment ({resolvedTotal})
                </button>
              </div>
            )}

            <div className="space-y-2">
              {quickReplies.map((qr) =>
                editingId === qr.id ? (
                  <div
                    key={qr.id}
                    className="bg-gray-50 rounded-xl p-3 space-y-2"
                  >
                    <input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="Label"
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#AE2108]"
                    />
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      placeholder="Message text"
                      className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#AE2108] resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          saveQuickReplies(
                            quickReplies.map((q) =>
                              q.id === editingId
                                ? { ...q, label: editLabel, text: editText }
                                : q,
                            ),
                          );
                          setEditingId(null);
                        }}
                        className="flex-1 py-1.5 bg-[#AE2108] text-white text-xs font-semibold rounded-lg"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={qr.id}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2.5 group ${qr.id === "qr2" ? "bg-green-50 border border-green-100" : "bg-gray-50"}`}
                  >
                    <button
                      onClick={() => handleQuickSend(qr.text, qr.id)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-gray-800">
                          {qr.label}
                        </p>
                        {qr.id === "qr2" && (
                          <span className="text-[9px] bg-green-100 text-green-600 font-bold px-1.5 py-0.5 rounded-full">
                            Moves to Completed
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 truncate mt-0.5">
                        {qr.text}
                      </p>
                    </button>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingId(qr.id);
                          setEditLabel(qr.label);
                          setEditText(qr.text);
                        }}
                        className="text-[10px] text-blue-500 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          saveQuickReplies(
                            quickReplies.filter((q) => q.id !== qr.id),
                          )
                        }
                        className="text-[10px] text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ),
              )}

              {addingNew && (
                <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                  <input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Label"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#AE2108]"
                  />
                  <textarea
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    rows={3}
                    placeholder="Message text…"
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#AE2108] resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (!newLabel.trim() || !newText.trim()) return;
                        saveQuickReplies([
                          ...quickReplies,
                          {
                            id: `qr_${Date.now()}`,
                            label: newLabel.trim(),
                            text: newText.trim(),
                          },
                        ]);
                        setNewLabel("");
                        setNewText("");
                        setAddingNew(false);
                      }}
                      className="flex-1 py-1.5 bg-[#AE2108] text-white text-xs font-semibold rounded-lg"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setAddingNew(false)}
                      className="flex-1 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={() => setShowQuickReplies((p) => !p)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition flex-shrink-0 ${showQuickReplies ? "bg-[#AE2108] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
          >
            <span className="text-base leading-none">⚡</span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition disabled:opacity-40 flex-shrink-0"
          >
            <Paperclip size={17} className="text-gray-500" />
          </button>
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf"
          />
          <input
            type="text"
            placeholder={uploading ? "Uploading…" : `Reply to ${customerName}…`}
            value={input}
            disabled={uploading}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage({ text: input.trim() });
              }
            }}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#AE2108]/30"
          />
          <button
            type="button"
            onClick={() => sendMessage({ text: input.trim() })}
            disabled={!input.trim() || uploading || !connected}
            className="w-10 h-10 rounded-full bg-[#AE2108] text-white flex items-center justify-center hover:bg-[#941B06] active:scale-95 transition disabled:opacity-40 flex-shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      </footer>

      {showPaymentModal && (
        <SendPaymentModal
          orderId={resolvedOrderId}
          resolvedTotal={resolvedTotal}
          vendorData={vendorData}
          onSend={(text) => sendMessage({ text })}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
}

/* ─── Main export ─── */
export default function VendorChat() {
  const { data: session, status } = useSession();
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [completedIds, setCompletedIds] = useState(loadCompletedRooms);

  const handleToggleComplete = useCallback((roomId, completed) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (completed) next.add(roomId);
      else next.delete(roomId);
      persistCompletedRooms(next);
      return next;
    });
  }, []);

  const handleComplete = useCallback(
    (roomId) => {
      handleToggleComplete(roomId, true);
      setSelectedRoom(null);
    },
    [handleToggleComplete],
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw size={24} className="text-gray-300 animate-spin" />
      </div>
    );
  }

  const vendorId = session?.user?.vendorId;
  const vendorName =
    session?.user?.businessName || session?.user?.name || "Vendor";

  // 🔧 Dummy bank details for now — replace with session data later:
  // bankName: session?.user?.bankName,
  // accountNumber: session?.user?.accountNumber,
  // accountName: session?.user?.accountName,
  const vendorData = {
    bankName: "Opay",
    accountNumber: "8012345678",
    accountName: "Boripe Foods",
  };

  if (!vendorId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <p className="text-sm text-gray-400">
          Vendor ID not found in session. Please log in again.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <div
        className={`w-full lg:w-80 xl:w-96 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col ${selectedRoom ? "hidden lg:flex" : "flex"}`}
      >
        <RoomList
          vendorId={vendorId}
          selectedRoomId={selectedRoom?._id}
          onSelectRoom={setSelectedRoom}
          completedIds={completedIds}
          onToggleComplete={handleToggleComplete}
        />
      </div>
      <div
        className={`flex-1 flex flex-col min-w-0 ${selectedRoom ? "flex" : "hidden lg:flex"}`}
      >
        {selectedRoom ? (
          <ChatWindow
            room={selectedRoom}
            vendorId={vendorId}
            vendorName={vendorName}
            vendorData={vendorData}
            onBack={() => setSelectedRoom(null)}
            onComplete={handleComplete}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 rounded-full bg-white border-2 border-gray-100 flex items-center justify-center mb-5 shadow-sm">
              <MessageCircle size={36} className="text-gray-200" />
            </div>
            <h3 className="text-base font-semibold text-gray-400 mb-1">
              Select a conversation
            </h3>
            <p className="text-sm text-gray-300">
              Choose a customer chat from the left to start replying
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
