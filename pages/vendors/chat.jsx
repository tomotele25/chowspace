"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  Store,
  Search,
  Clock,
} from "lucide-react";

const BACKEND_URL = "http://localhost:2005";

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

  const dividerIdx = lines.findIndex((l) => l.startsWith("─"));
  const totals = [];
  for (let i = Math.max(0, dividerIdx - 5); i < dividerIdx; i++) {
    if (lines[i]?.includes("₦")) totals.push(lines[i].trim());
  }
  const totalLine = lines[dividerIdx + 1]?.trim();

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
            const parts = line.split(/\s{2,}/);
            return (
              <div
                key={i}
                className="flex justify-between text-xs text-gray-500"
              >
                <span>{parts[0]}</span>
                <span>{parts[parts.length - 1]}</span>
              </div>
            );
          })}
        </div>
      )}

      {totalLine && (
        <div className="px-4 py-3 border-t border-gray-200 mt-2 flex justify-between items-center">
          <span className="text-sm font-bold text-gray-800">Total</span>
          <span className="text-base font-extrabold text-[#AE2108]">
            {totalLine.replace("TOTAL", "").replace(/\s+/, "").trim()}
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
            {msg.fileUrl && (
              <a
                href={msg.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-2 flex items-center gap-2 rounded-lg p-2 text-xs transition border ${
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
   RoomList — left panel showing all customer conversations
─────────────────────────────────────────────────────────────── */
function RoomList({ vendorId, onSelectRoom, selectedRoomId }) {
  const [rooms, setRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);

  const fetchRooms = useCallback(async () => {
    try {
      const { data } = await axios.get(
        `${BACKEND_URL}/api/chat/vendor/${vendorId}`,
      );
      setRooms(data.rooms || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // Real-time: refresh room list when a new message arrives
  useEffect(() => {
    if (!vendorId) return;

    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => socket.emit("joinVendorRoom", vendorId));
    socket.on("newChatNotification", () => fetchRooms());
    socket.on("receiveMessage", () => fetchRooms());

    return () => socket.disconnect();
  }, [vendorId, fetchRooms]);

  const filtered = rooms.filter((r) => {
    const preview = r.lastMessage || "";
    const sender = r.lastSender || "";
    return (
      preview.toLowerCase().includes(search.toLowerCase()) ||
      sender.toLowerCase().includes(search.toLowerCase()) ||
      (r.orderId || "").toLowerCase().includes(search.toLowerCase())
    );
  });

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    return isToday
      ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
          <MessageCircle size={18} className="text-[#AE2108]" />
          Customer Chats
        </h2>
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Search conversations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-[#AE2108]/20"
          />
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw size={20} className="text-gray-300 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <MessageCircle size={32} className="text-gray-200 mb-3" />
            <p className="text-sm text-gray-400 font-medium">
              No conversations yet
            </p>
            <p className="text-xs text-gray-300 mt-1">
              Customer chats will appear here
            </p>
          </div>
        ) : (
          filtered.map((room) => {
            const isSelected = room._id === selectedRoomId;
            const isOrderChat = room._id?.startsWith("order_");
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
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#AE2108]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {isOrderChat ? (
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
                        {room.unreadCount > 0 && (
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

                    <p className="text-xs text-gray-500 truncate">
                      {previewText}
                    </p>
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
   ChatWindow — right panel for the active conversation
─────────────────────────────────────────────────────────────── */
function ChatWindow({ room, vendorId, vendorName, onBack }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [uploading, setUploading] = useState(false);

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

    const load = async () => {
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/chat/${roomId}`);
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
      } catch {
        // silent
      } finally {
        setHistoryLoading(false);
      }
    };

    load();
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
      // Join correct room type
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
        const isOwn = msg.senderType === "vendor";
        if (isOwn) return prev; // already added optimistically
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
        {/* Back button — mobile only */}
        <button
          onClick={onBack}
          className="lg:hidden w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
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
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <MessageCircle size={28} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">No messages yet</p>
            <p className="text-xs text-gray-300 mt-1">
              Reply to {customerName} below
            </p>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input */}
      <footer className="bg-white border-t px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
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
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#AE2108]/30 transition"
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
   Main export — VendorChat
─────────────────────────────────────────────────────────────── */
export default function VendorChat() {
  const { data: session, status } = useSession();
  const [selectedRoom, setSelectedRoom] = useState(null);

  const vendorId = session?.user?.id;
  const vendorName =
    session?.user?.businessName || session?.user?.name || "Vendor";

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw size={24} className="text-gray-300 animate-spin" />
      </div>
    );
  }

  if (!vendorId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <Store size={40} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">
            You must be logged in as a vendor to view chats.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* ── Left: room list ── */}
      {/* On mobile: show only if no room selected */}
      {/* On desktop: always visible */}
      <div
        className={`w-full lg:w-80 xl:w-96 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col
          ${selectedRoom ? "hidden lg:flex" : "flex"}`}
      >
        <RoomList
          vendorId={vendorId}
          selectedRoomId={selectedRoom?._id}
          onSelectRoom={(room) => setSelectedRoom(room)}
        />
      </div>

      {/* ── Right: chat window ── */}
      <div
        className={`flex-1 flex flex-col min-w-0
          ${selectedRoom ? "flex" : "hidden lg:flex"}`}
      >
        {selectedRoom ? (
          <ChatWindow
            room={selectedRoom}
            vendorId={vendorId}
            vendorName={vendorName}
            onBack={() => setSelectedRoom(null)}
          />
        ) : (
          // Empty state on desktop when no room selected
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 bg-gray-50">
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
