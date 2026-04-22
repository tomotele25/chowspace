"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import { useRouter } from "next/router";
import {
  MessageCircle,
  Send,
  Paperclip,
  RefreshCw,
  CheckCircle2,
  Package,
  MapPin,
  Phone,
  User,
  ArrowLeft,
  ShoppingCart,
} from "lucide-react";

const BACKEND_URL = "http://localhost:2005";

/* ─────────────────────────────────────────────────────────────
   Helpers
─────────────────────────────────────────────────────────────── */
const formatCurrency = (n) =>
  typeof n === "number" ? n.toLocaleString() : "0";

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
   Build the 🛒 NEW ORDER card text from sessionStorage data
─────────────────────────────────────────────────────────────── */
const buildOrderCardText = (order) => {
  const {
    orderId,
    cart,
    cartTotal,
    packFee,
    serviceCharge,
    customerName,
    customerPhone,
    customerAddress,
    vendorName,
  } = order;

  const packsText = (cart || [])
    .map((pack, i) => {
      const items = pack
        .map(
          (item) =>
            `  • ${item.productName} x${item.quantity}  —  ₦${formatCurrency(item.price * item.quantity)}`,
        )
        .join("\n");
      return `📦 Pack ${i + 1}\n${items}`;
    })
    .join("\n");

  const subtotal = cartTotal || 0;
  const packing = packFee || 0;
  const service = serviceCharge || 60;
  const total = subtotal + packing + service;

  const divider = "─".repeat(32);

  return (
    `🛒 NEW ORDER — ${orderId}\n` +
    `👤 Customer : ${customerName}\n` +
    `📞 Phone    : ${customerPhone}\n` +
    `🏠 Address  : ${customerAddress}\n` +
    `\n${packsText}\n\n` +
    `Subtotal     ₦${formatCurrency(subtotal)}\n` +
    `Packing fee  ₦${formatCurrency(packing)}\n` +
    `Service fee  ₦${formatCurrency(service)}\n` +
    `${divider}\n` +
    `TOTAL ₦${formatCurrency(total)}`
  );
};

/* ─────────────────────────────────────────────────────────────
   OrderCard — renders the structured order bubble
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
   Main — CustomerChat
─────────────────────────────────────────────────────────────── */
export default function CustomerChat() {
  const router = useRouter();

  const [order, setOrder] = useState(null); // parsed from sessionStorage
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [orderSent, setOrderSent] = useState(false); // track if card already sent

  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const orderSentRef = useRef(false); // ref so socket handler closure sees it

  /* ── Read order from sessionStorage on mount ── */
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("chatOrder");
      if (raw) {
        setOrder(JSON.parse(raw));
      }
    } catch {
      // malformed JSON — ignore
    }
  }, []);

  // Derived values
  const roomId = order ? `order_${order.orderId}` : null;
  const customerName = order?.customerName || "Customer";
  const vendorName = order?.vendorName || "Vendor";
  const vendorId = order?.vendorId || null;

  /* ── Load chat history once roomId is known ── */
  useEffect(() => {
    if (!roomId) return;
    setHistoryLoading(true);

    axios
      .get(`${BACKEND_URL}/api/chat/${roomId}`)
      .then(({ data }) => {
        const mapped = (data.messages || []).map((m) => ({
          id: m._id,
          isOwn: m.senderType === "customer",
          senderName: m.sender,
          senderType: m.senderType,
          text: m.text,
          fileUrl: m.fileUrl || null,
          fileName: m.fileName || null,
          time: new Date(m.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setMessages(mapped);

        // If an order card already exists in history, mark it as already sent
        const alreadySent = mapped.some((m) => isOrderCard(m.text));
        if (alreadySent) {
          orderSentRef.current = true;
          setOrderSent(true);
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [roomId]);

  /* ── Socket setup ── */
  useEffect(() => {
    if (!roomId || !vendorId) return;

    if (socketRef.current) socketRef.current.disconnect();

    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      // Join the order room so vendor and customer share the same room
      socket.emit("joinOrderRoom", order.orderId);

      // Send the order card as the first message, only once
      if (!orderSentRef.current && order) {
        orderSentRef.current = true;
        setOrderSent(true);

        const cardText = buildOrderCardText(order);
        const optimisticId = `opt_order_${Date.now()}`;

        setMessages((prev) => [
          ...prev,
          {
            id: optimisticId,
            isOwn: true,
            senderName: customerName,
            senderType: "customer",
            text: cardText,
            fileUrl: null,
            fileName: null,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);

        socket.emit("sendMessage", {
          roomId,
          text: cardText,
          sender: customerName,
          senderType: "customer",
          vendorId,
          orderId: order.orderId,
          fileUrl: null,
          fileName: null,
        });

        // Clear sessionStorage so refreshing doesn't re-send the card
        sessionStorage.removeItem("chatOrder");
      }
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => {
        if (msg._id && prev.some((m) => m.id === msg._id)) return prev;
        // Ignore messages sent by this customer (already added optimistically)
        if (msg.senderType === "customer") return prev;
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
  }, [roomId, vendorId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Auto-scroll ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ── Send message ── */
  const sendMessage = useCallback(
    ({ text = "", fileUrl = null, fileName = null } = {}) => {
      if ((!text && !fileUrl) || !socketRef.current?.connected) return;

      const optimisticId = `opt_${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: optimisticId,
          isOwn: true,
          senderName: customerName,
          senderType: "customer",
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
        sender: customerName,
        senderType: "customer",
        vendorId,
        orderId: order?.orderId || null,
        fileUrl,
        fileName,
      });
    },
    [roomId, customerName, vendorId, order],
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

  /* ─── No order found ─────────────────────────────────────── */
  if (!order && !historyLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <ShoppingCart size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            No order found
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            It looks like you arrived here directly. Please go back and place an
            order first.
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#AE2108] text-white rounded-xl font-semibold text-sm hover:bg-[#941B06] transition"
          >
            <ArrowLeft size={16} />
            Go back
          </button>
        </div>
      </div>
    );
  }

  /* ─── MAIN ───────────────────────────────────────────────── */
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </button>

        <div className="w-10 h-10 rounded-full bg-[#AE2108]/10 flex items-center justify-center flex-shrink-0">
          <Package size={20} className="text-[#AE2108]" />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 text-sm truncate">
            {vendorName}
          </h2>
          <p className="text-xs text-gray-400">
            {order?.orderId ? `Order: ${order.orderId}` : "Chat with vendor"}
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
            <p className="text-sm font-medium text-gray-400">
              Connecting you with {vendorName}…
            </p>
            <p className="text-xs text-gray-300 mt-1">
              Your order details will be sent automatically
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
            placeholder={
              uploading
                ? "Uploading…"
                : connected
                  ? `Message ${vendorName}…`
                  : "Connecting…"
            }
            value={input}
            disabled={uploading || !connected}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage({ text: input.trim() });
              }
            }}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#AE2108]/30 transition disabled:opacity-60"
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
