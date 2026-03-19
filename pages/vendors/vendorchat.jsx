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
} from "lucide-react";

const BACKEND_URL = "http://localhost:2005";
const COMPLETED_ROOMS_KEY = "cs_vendor_completed_rooms";

/* ─────────────────────────────────────────────────────────────
   Completed rooms helpers (localStorage)
─────────────────────────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────────────────────
   Helpers
─────────────────────────────────────────────────────────────── */
const isOrderCard = (text) =>
  typeof text === "string" && text.startsWith("🛒 NEW ORDER");

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

  // ✅ Fixed totals: deduplicate by label, use regex split for single-space lines
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

/* ─────────────────────────────────────────────────────────────
   OrderCard
─────────────────────────────────────────────────────────────── */
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
            // ✅ Use regex to split label from value regardless of spacing
            const match = line.match(/^(.+?)\s+(₦[\d,]+)$/);
            const label = match ? match[1].trim() : line;
            const value = match ? match[2].trim() : "";
            return (
              <div
                key={i}
                className="flex justify-between text-xs text-gray-500"
              >
                <span>{label}</span>
                <span>{value}</span>
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

/* ─────────────────────────────────────────────────────────────
   MessageBubble
─────────────────────────────────────────────────────────────── */
function MessageBubble({ msg }) {
  const isCard = isOrderCard(msg.text);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // ✅ Detect image vs other file
  const isImage =
    msg.fileUrl &&
    (/\.(jpg|jpeg|png|gif|webp)$/i.test(msg.fileName || "") ||
      (msg.fileUrl.includes("cloudinary") && !msg.fileUrl.includes(".pdf")));

  return (
    <div className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[80%]">
        {!msg.isOwn && !isCard && (
          <p className="text-[10px] text-gray-400 mb-1 ml-2 font-medium">
            {msg.senderName}
          </p>
        )}
        {isCard ? (
          <OrderCard text={msg.text} />
        ) : (
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
              msg.isOwn
                ? "bg-[#AE2108] text-white rounded-br-none"
                : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
            }`}
          >
            {msg.text && (
              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            )}

            {/* ✅ Image preview → opens lightbox on click */}
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

            {/* File link for non-images (PDFs etc) */}
            {msg.fileUrl && !isImage && (
              <a
                href={msg.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-2 flex items-center gap-2 rounded-lg p-2 text-xs border ${
                  msg.isOwn ? "border-white/30" : "border-gray-200"
                }`}
              >
                <Paperclip size={13} />
                <span className="truncate">{msg.fileName || "View file"}</span>
              </a>
            )}

            <span
              className={`block mt-1 text-[10px] text-right leading-none ${
                msg.isOwn ? "text-white/50" : "text-gray-300"
              }`}
            >
              {msg.time}
              {msg.isOwn && (
                <CheckCircle2 size={10} className="inline ml-1 opacity-60" />
              )}
            </span>
          </div>
        )}
        {isCard && (
          <p className="text-[10px] mt-1 text-left text-gray-400 ml-1">
            {msg.time}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ImageLightbox — fullscreen image modal
─────────────────────────────────────────────────────────────── */
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
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
      >
        ✕
      </button>
      <img
        src={src}
        alt={alt || "Image"}
        className="max-w-[92vw] max-h-[88vh] rounded-2xl shadow-2xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-5 right-5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-full backdrop-blur-sm transition flex items-center gap-1.5"
      >
        Open original ↗
      </a>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   RoomList
─────────────────────────────────────────────────────────────── */
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
    if (!vendorId) return;
    fetchRooms();
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

  // Poll every 10s as fallback
  useEffect(() => {
    if (!vendorId) return;
    const interval = setInterval(() => fetchRooms(true), 10_000);
    return () => clearInterval(interval);
  }, [vendorId, fetchRooms]);

  // Refresh when tab becomes visible
  useEffect(() => {
    if (!vendorId) return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchRooms(true);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [vendorId, fetchRooms]);

  // Deduplicate: hide vendor_ rooms that have a matching order_ room
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
      {/* Header */}
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
            title="Refresh chats"
          >
            <RefreshCw
              size={14}
              className={`text-gray-400 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Active / Completed tabs */}
        <div className="flex rounded-xl bg-gray-100 p-1 mb-3">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "active"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <MessageCircle size={12} />
            Active
            {activeRooms.length > 0 && (
              <span className="min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[#AE2108] text-white text-[9px] font-bold px-1">
                {activeRooms.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("completed")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === "completed"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <CheckCheck size={12} />
            Completed
            {completedRooms.length > 0 && (
              <span className="min-w-[16px] h-4 flex items-center justify-center rounded-full bg-green-500 text-white text-[9px] font-bold px-1">
                {completedRooms.length}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
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

      {/* List */}
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
                <p className="text-xs text-gray-300 mt-1">
                  Confirmed orders will appear here
                </p>
              </>
            ) : (
              <>
                <MessageCircle size={32} className="text-gray-200 mb-3" />
                <p className="text-sm text-gray-400 font-medium">
                  No active chats
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  Customer chats will appear here
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
              : room.lastMessage || "No messages yet";

            return (
              <button
                key={room._id}
                onClick={() => onSelectRoom(room)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-50 transition hover:bg-gray-50 ${
                  isSelected
                    ? "bg-[#AE2108]/5 border-l-2 border-l-[#AE2108]"
                    : ""
                } ${isCompleted ? "opacity-75" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isCompleted ? "bg-green-50" : "bg-[#AE2108]/10"
                    }`}
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

/* ─────────────────────────────────────────────────────────────
   Default quick replies
─────────────────────────────────────────────────────────────── */
const DEFAULT_QUICK_REPLIES = [
  {
    id: "qr1",
    label: "Payment details",
    text: "Kindly send payment to:\n\n🏦 Opay: 2760XXXXXXXX\n🏦 Moniepoint: 8284XXXXXXXX\n\nAccount Name: Boripe Foods\n\nKINDLY SEND A SCREENSHOT AS PROOF OF PAYMENT SHOWING YOUR ACCOUNT NAME.",
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

/* ─────────────────────────────────────────────────────────────
   ChatWindow
─────────────────────────────────────────────────────────────── */
function ChatWindow({ room, vendorId, vendorName, onBack, onComplete }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [showQuickReplies, setShowQuickReplies] = useState(false);
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
    // "Order confirmed" → mark as completed
    if (qrId === "qr2") onComplete?.(room._id);
  };

  const handleDeleteQR = (id) =>
    saveQuickReplies(quickReplies.filter((q) => q.id !== id));

  const handleStartEdit = (qr) => {
    setEditingId(qr.id);
    setEditLabel(qr.label);
    setEditText(qr.text);
  };

  const handleSaveEdit = () => {
    saveQuickReplies(
      quickReplies.map((q) =>
        q.id === editingId ? { ...q, label: editLabel, text: editText } : q,
      ),
    );
    setEditingId(null);
  };

  const handleAddNew = () => {
    if (!newLabel.trim() || !newText.trim()) return;
    saveQuickReplies([
      ...quickReplies,
      { id: `qr_${Date.now()}`, label: newLabel.trim(), text: newText.trim() },
    ]);
    setNewLabel("");
    setNewText("");
    setAddingNew(false);
  };

  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const roomId = room._id;
  const senderName = vendorName || "Vendor";
  const senderType = "vendor";

  /* ── Load history ── */
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

  /* ── Socket ── */
  useEffect(() => {
    if (socketRef.current) socketRef.current.disconnect();
    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      if (roomId.startsWith("order_")) {
        socket.emit("joinOrderRoom", roomId.replace("order_", ""));
      } else {
        socket.emit("joinVendorRoom", vendorId);
      }
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

    return () => socket.disconnect();
  }, [roomId, vendorId]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Compute order total from loaded messages ── */
  const resolvedTotal = useMemo(() => {
    const cardMsg = messages.find((m) => isOrderCard(m.text));
    if (!cardMsg) return null;
    const lines = cardMsg.text.split("\n");
    const dividerIdx = lines.findIndex((l) => l.startsWith("─"));

    // Try TOTAL line first
    if (dividerIdx >= 0) {
      const totalLine = lines[dividerIdx + 1]?.trim();
      const totalMatch = totalLine?.match(/TOTAL\s+(₦[\d,]+)/i);
      if (totalMatch) return totalMatch[1];
    }

    // Fallback: sum Subtotal + Packing + Delivery + Service fee lines
    let sum = 0;
    const limit = dividerIdx > 0 ? dividerIdx : lines.length;
    for (let i = 0; i < limit; i++) {
      const line = lines[i]?.trim();
      if (!line) continue;
      if (
        line.startsWith("📦") ||
        line.startsWith("  •") ||
        line.includes("  —  ")
      )
        continue;
      const match = line.match(/₦([\d,]+)/);
      if (match) {
        const label = line.split(/\s+/)[0]?.toLowerCase();
        if (
          ["subtotal", "packing", "delivery", "service"].some((k) =>
            label?.startsWith(k),
          )
        ) {
          sum += parseInt(match[1].replace(/,/g, ""), 10);
        }
      }
    }
    return sum > 0 ? `₦${sum.toLocaleString()}` : null;
  }, [messages]);

  /* ── Send ── */
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

  /* ── File upload ── */
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
      {/* Header */}
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
        <div className="flex items-center gap-1.5">
          {connected ? (
            <>
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-xs text-gray-400 hidden sm:block">
                Online
              </span>
            </>
          ) : (
            <>
              <RefreshCw size={13} className="text-gray-300 animate-spin" />
              <span className="text-xs text-gray-400 hidden sm:block">
                Connecting…
              </span>
            </>
          )}
        </div>
      </header>

      {/* Messages */}
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

      {/* Footer */}
      <footer className="bg-white border-t flex-shrink-0">
        {/* Quick replies panel */}
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

            {/* ✅ Order total quick actions */}
            {resolvedTotal && (
              <div className="mb-3 p-3 bg-[#AE2108]/5 border border-[#AE2108]/20 rounded-xl">
                <p className="text-[10px] font-bold text-[#AE2108] uppercase tracking-wide mb-2">
                  📦 This Order · {resolvedTotal}
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() =>
                      handleQuickSend(
                        quickReplies
                          .find((q) => q.id === "qr1")
                          ?.text.replace(
                            "KINDLY SEND A SCREENSHOT AS PROOF OF PAYMENT SHOWING YOUR ACCOUNT NAME.",
                            `Total amount: *${resolvedTotal}*\nKINDLY SEND A SCREENSHOT AS PROOF OF PAYMENT SHOWING YOUR ACCOUNT NAME.`,
                          ) ||
                          `Kindly send *${resolvedTotal}* to complete your order payment.`,
                        "qr1",
                      )
                    }
                    className="px-3 py-1.5 bg-[#AE2108] text-white text-xs font-semibold rounded-lg hover:bg-[#941B06] transition"
                  >
                    💳 Send payment details ({resolvedTotal})
                  </button>
                  <button
                    onClick={() =>
                      handleQuickSend(
                        `Your total is *${resolvedTotal}*. Kindly make payment to proceed with your order.`,
                        null,
                      )
                    }
                    className="px-3 py-1.5 bg-white border border-[#AE2108]/30 text-[#AE2108] text-xs font-semibold rounded-lg hover:bg-[#AE2108]/5 transition"
                  >
                    💬 Share total only
                  </button>
                </div>
              </div>
            )}

            {/* Quick reply list */}
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
                        onClick={handleSaveEdit}
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
                    className={`flex items-center gap-2 rounded-xl px-3 py-2.5 group ${
                      qr.id === "qr2"
                        ? "bg-green-50 border border-green-100"
                        : "bg-gray-50"
                    }`}
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
                        onClick={() => handleStartEdit(qr)}
                        className="text-[10px] text-blue-500 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteQR(qr.id)}
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
                    placeholder="Label e.g. Payment details"
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
                      onClick={handleAddNew}
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

        {/* Input bar */}
        <div className="flex items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={() => setShowQuickReplies((p) => !p)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition flex-shrink-0 ${
              showQuickReplies
                ? "bg-[#AE2108] text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
            title="Quick replies"
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
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main export
─────────────────────────────────────────────────────────────── */
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
      {/* Left — room list */}
      <div
        className={`w-full lg:w-80 xl:w-96 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col
          ${selectedRoom ? "hidden lg:flex" : "flex"}`}
      >
        <RoomList
          vendorId={vendorId}
          selectedRoomId={selectedRoom?._id}
          onSelectRoom={setSelectedRoom}
          completedIds={completedIds}
          onToggleComplete={handleToggleComplete}
        />
      </div>

      {/* Right — chat window */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${selectedRoom ? "flex" : "hidden lg:flex"}`}
      >
        {selectedRoom ? (
          <ChatWindow
            room={selectedRoom}
            vendorId={vendorId}
            vendorName={vendorName}
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
