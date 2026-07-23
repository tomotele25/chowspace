"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { io } from "socket.io-client";
import {
  Send,
  Store,
  Paperclip,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  Package,
  MapPin,
  Phone,
  User,
  Minus,
  Maximize2,
  CreditCard,
  Copy,
  Check,
  AlertCircle,
  Landmark,
} from "lucide-react";
import axios from "axios";

const BACKEND_URL = "https://chowspace-backend-1.onrender.com";
const PENDING_ORDER_SESSION_KEY = "cs_pending_order";

const isOrderCard = (text) =>
  typeof text === "string" && text.startsWith("🛒 NEW ORDER");

// ⚠️ ASSUMPTION: adjust this prefix to match whatever VendorChat actually
// sends when a vendor issues a payment request.
const isPaymentRequest = (text) =>
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
        !line.startsWith("🏠")
      ) {
        const label = line
          .split(/\s{2,}/)[0]
          ?.trim()
          .toLowerCase();
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

// Pulls a naira amount and an optional note line out of a payment
// request message. Adjust the regex/format to match your real message.
const parsePaymentRequest = (text) => {
  const lines = text.split("\n");
  const headerLine = lines[0] || "";
  const amountMatch = headerLine.match(/₦\s?([\d,]+(?:\.\d{1,2})?)/);
  const amount = amountMatch ? Number(amountMatch[1].replace(/,/g, "")) : null;

  const note = lines.slice(1).join(" ").trim() || null;

  return { amount, note };
};

function OrderCard({ text, isOwn }) {
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
    <div
      className={`rounded-2xl overflow-hidden shadow-sm border max-w-xs w-full ${
        isOwn
          ? "border-[#AE2108]/20 bg-[#AE2108]/5"
          : "border-gray-200 bg-white"
      }`}
    >
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
            const label = parts[0]?.trim();
            const value = parts[parts.length - 1]?.trim();
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
   CopyField — small pill with a value + copy-to-clipboard button
─────────────────────────────────────────────────────────────── */
function CopyField({ label, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable — fail silently, value is still visible
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition"
      >
        {copied ? (
          <Check size={13} className="text-green-600" />
        ) : (
          <Copy size={13} className="text-gray-500" />
        )}
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PaymentRequestCard — renders a vendor's payment request and
   drives the Monei initialize → show account → verify flow.
─────────────────────────────────────────────────────────────── */
function PaymentRequestCard({ text, orderId, vendorId, isOwn }) {
  const { amount, note } = parsePaymentRequest(text);

  // idle → initializing → awaiting_transfer → verifying → paid → error
  const [status, setStatus] = useState("idle");
  const [deposit, setDeposit] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleInitialize = async () => {
    setStatus("initializing");
    setErrorMsg("");
    try {
      // Pull the rest of the order payload the backend needs.
      // ⚠️ Confirm this sessionStorage key/shape matches your checkout page.
      const raw =
        typeof window !== "undefined"
          ? sessionStorage.getItem(PENDING_ORDER_SESSION_KEY)
          : null;
      const pendingOrder = raw ? JSON.parse(raw) : null;

      if (!pendingOrder) {
        setStatus("error");
        setErrorMsg(
          "Couldn't find your order details. Please go back to checkout and try again.",
        );
        return;
      }

      const { data } = await axios.post(
        "http://localhost:2005/api/payment/monei/initialize",
        {
          amount: amount ?? pendingOrder.totalAmount,
          email: pendingOrder.email,
          vendorId,
          tx_ref: orderId,
          orderPayload: {
            items: pendingOrder.items,
            deliveryMethod: pendingOrder.deliveryMethod,
            note: pendingOrder.note || "",
          },
          guestInfo: pendingOrder.guestInfo || undefined,
          customerId: pendingOrder.customerId || undefined,
        },
      );

      if (!data.success) {
        setStatus("error");
        setErrorMsg(data.message || "Could not start payment.");
        return;
      }

      setDeposit(data.deposit);
      setStatus("awaiting_transfer");
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err.response?.data?.message || "Something went wrong starting payment.",
      );
    }
  };

  const handleIveTransferred = async () => {
    if (!deposit?.reference) return;
    setStatus("verifying");
    setErrorMsg("");
    try {
      const { data } = await axios.post(
        `${BACKEND_URL}/api/payment/monei/verify`,
        { reference: deposit.reference },
      );

      if (data.success) {
        setStatus("paid");
      } else {
        // Not confirmed yet — bank transfers can take a minute or two.
        setStatus("awaiting_transfer");
        setErrorMsg(
          "We haven't received your transfer yet. Give it a moment and try again.",
        );
      }
    } catch (err) {
      setStatus("awaiting_transfer");
      setErrorMsg(
        err.response?.data?.message || "Couldn't verify payment just yet.",
      );
    }
  };

  return (
    <div
      className={`rounded-2xl overflow-hidden shadow-sm border max-w-xs w-full ${
        isOwn
          ? "border-[#AE2108]/20 bg-[#AE2108]/5"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="bg-[#AE2108] px-4 py-3">
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-white" />
          <span className="text-white font-bold text-sm">
            Payment Requested
          </span>
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        {amount != null && (
          <p className="text-2xl font-extrabold text-gray-900">
            ₦{amount.toLocaleString()}
          </p>
        )}
        {note && <p className="text-xs text-gray-500">{note}</p>}

        {status === "idle" && (
          <button
            type="button"
            onClick={handleInitialize}
            className="w-full mt-2 py-2.5 rounded-xl bg-[#AE2108] text-white text-sm font-semibold hover:bg-[#941B06] active:scale-[0.98] transition"
          >
            Pay via Bank Transfer
          </button>
        )}

        {status === "initializing" && (
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 py-2">
            <RefreshCw size={13} className="animate-spin" />
            Setting up your payment…
          </div>
        )}

        {(status === "awaiting_transfer" || status === "verifying") &&
          deposit && (
            <div className="mt-2 border border-gray-100 rounded-xl bg-gray-50 px-3 py-2 divide-y divide-gray-200">
              <div className="flex items-center gap-2 pb-1.5 text-[11px] text-gray-500">
                <Landmark size={12} />
                Transfer to this account
              </div>
              <CopyField label="Account Number" value={deposit.accountNumber} />
              <CopyField label="Bank Name" value={deposit.bankName} />
              <CopyField label="Account Name" value={deposit.accountName} />
              {deposit.amount && (
                <CopyField
                  label="Amount"
                  value={`₦${(deposit.amount / 100).toLocaleString()}`}
                />
              )}
            </div>
          )}

        {(status === "awaiting_transfer" || status === "verifying") && (
          <button
            type="button"
            onClick={handleIveTransferred}
            disabled={status === "verifying"}
            className="w-full mt-2 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-black active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {status === "verifying" ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                Checking…
              </>
            ) : (
              "I've Made the Transfer"
            )}
          </button>
        )}

        {status === "paid" && (
          <div className="flex items-center gap-2 mt-2 text-sm font-semibold text-green-600 py-2">
            <CheckCircle2 size={16} />
            Payment confirmed
          </div>
        )}

        {status === "error" && errorMsg && (
          <div className="flex items-start gap-2 mt-1 text-xs text-red-600">
            <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {status === "error" && (
          <button
            type="button"
            onClick={handleInitialize}
            className="w-full mt-1 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-gray-50 transition"
          >
            Try Again
          </button>
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

function MessageBubble({ msg, orderId, vendorId }) {
  const isCard = isOrderCard(msg.text);
  const isPayment = isPaymentRequest(msg.text);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // ✅ Detect image files
  const isImage =
    msg.fileUrl &&
    (/\.(jpg|jpeg|png|gif|webp)$/i.test(msg.fileName || "") ||
      (msg.fileUrl.includes("cloudinary") && !msg.fileUrl.includes(".pdf")));

  return (
    <div className={`flex ${msg.isOwn ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[82%]">
        {!msg.isOwn && !isCard && !isPayment && (
          <p className="text-[10px] text-gray-400 mb-1 ml-2 font-medium">
            {msg.senderName}
            {msg.senderType && msg.senderType !== "customer" && (
              <span className="ml-1 text-[#AE2108] capitalize">
                · {msg.senderType}
              </span>
            )}
          </p>
        )}
        {isCard ? (
          <OrderCard text={msg.text} isOwn={msg.isOwn} />
        ) : isPayment ? (
          <PaymentRequestCard
            text={msg.text}
            orderId={orderId}
            vendorId={vendorId}
            isOwn={msg.isOwn}
          />
        ) : (
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
              msg.isOwn
                ? `bg-[#AE2108] text-white rounded-br-none ${msg.isPending ? "opacity-60" : ""}`
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

            {/* File link for PDFs / non-images */}
            {msg.fileUrl && !isImage && (
              <a
                href={msg.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-2 flex items-center gap-2 rounded-lg p-2 text-xs transition ${
                  msg.isOwn
                    ? "border border-white/30 hover:bg-white/10"
                    : "border border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Paperclip size={13} />
                <span className="truncate">{msg.fileName || "View file"}</span>
              </a>
            )}

            <span
              className={`block mt-1 text-[10px] text-right leading-none ${msg.isOwn ? "text-white/50" : "text-gray-300"}`}
            >
              {msg.time}
              {msg.isOwn && !msg.isPending && (
                <CheckCircle2 size={10} className="inline ml-1 opacity-60" />
              )}
            </span>
          </div>
        )}
        {(isCard || isPayment) && (
          <p
            className={`text-[10px] mt-1 ${msg.isOwn ? "text-right text-gray-400" : "text-left text-gray-400 ml-1"}`}
          >
            {msg.time}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Upload progress loader overlay (shown inside footer)
─────────────────────────────────────────────────────────────── */
function UploadLoader({ fileName }) {
  return (
    <div className="mx-4 mb-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center gap-3">
      {/* Animated thumbnail placeholder */}
      <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-[shimmer_1.2s_infinite] bg-[length:200%_100%]" />
        <Paperclip size={14} className="text-gray-400 relative z-10" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-gray-700 truncate">
          {fileName || "Uploading file…"}
        </p>
        {/* Progress bar */}
        <div className="mt-1.5 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-[#AE2108] rounded-full animate-[upload-progress_1.8s_ease-in-out_infinite]" />
        </div>
      </div>
      <RefreshCw
        size={13}
        className="text-[#AE2108] animate-spin flex-shrink-0"
      />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Chat export
─────────────────────────────────────────────────────────────── */
export default function Chat({ currentUser = null, onBack }) {
  const searchParams = useSearchParams();
  const vendorId = searchParams.get("vendorId");
  const vendorName = searchParams.get("vendorName") || "Vendor";
  const orderId = searchParams.get("orderId");
  const customerName = searchParams.get("customerName");
  const vendorLogo = searchParams.get("vendorLogo")
    ? decodeURIComponent(searchParams.get("vendorLogo"))
    : null;

  if (!vendorId) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-3xl mb-3">💬</p>
          <p className="text-sm text-gray-400">
            Missing vendorId — cannot open chat.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ChatInner
      orderId={orderId}
      vendorId={vendorId}
      vendorName={decodeURIComponent(vendorName)}
      vendorLogo={vendorLogo}
      customerName={customerName ? decodeURIComponent(customerName) : null}
      currentUser={currentUser}
      onBack={onBack}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   ChatInner
─────────────────────────────────────────────────────────────── */
function ChatInner({
  orderId,
  vendorId,
  vendorName,
  vendorLogo,
  customerName,
  currentUser,
  onBack,
}) {
  const [senderName, setSenderName] = useState(() => {
    if (currentUser?.name) return currentUser.name;
    if (customerName) return customerName;
    if (typeof window !== "undefined")
      return localStorage.getItem("cs_chat_name") || "";
    return "";
  });

  const [nameInput, setNameInput] = useState("");
  const [nameConfirmed, setNameConfirmed] = useState(
    !!(
      currentUser?.name ||
      customerName ||
      (typeof window !== "undefined" && localStorage.getItem("cs_chat_name"))
    ),
  );

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const [minimized, setMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  const minimizedRef = useRef(false);

  useEffect(() => {
    minimizedRef.current = minimized;
  }, [minimized]);

  const senderType = currentUser?.role || "customer";
  const roomId = orderId ? `order_${orderId}` : `vendor_${vendorId}`;

  /* ── Load history ── */
  useEffect(() => {
    if (!nameConfirmed) return;
    const load = async () => {
      setHistoryLoading(true);
      try {
        const { data } = await axios.get(`${BACKEND_URL}/api/chat/${roomId}`);
        setMessages(
          (data.messages || []).map((m) => ({
            id: m._id,
            isOwn: m.senderType === "customer" && m.sender === senderName,
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
      } catch (err) {
        console.error("History load failed:", err);
      } finally {
        setHistoryLoading(false);
      }
    };
    load();
  }, [roomId, nameConfirmed, senderType, senderName]);

  /* ── Socket ── */
  useEffect(() => {
    if (!nameConfirmed) return;

    socketRef.current = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    const socket = socketRef.current;

    socket.on("connect", () => {
      setConnected(true);
      if (orderId) socket.emit("joinOrderRoom", orderId);
      else socket.emit("joinVendorRoom", vendorId);
    });
    socket.on("disconnect", () => setConnected(false));

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => {
        if (msg._id && prev.some((m) => m.id === msg._id)) return prev;
        const isOwn =
          msg.senderType === "customer" && msg.sender === senderName;
        if (isOwn) return prev;

        if (minimizedRef.current) setUnreadCount((n) => n + 1);

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
  }, [orderId, vendorId, nameConfirmed, senderType, senderName]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    if (!minimized)
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, minimized]);

  const handleExpand = () => {
    setMinimized(false);
    setUnreadCount(0);
  };

  /* ── Confirm name ── */
  const confirmName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setSenderName(trimmed);
    setNameConfirmed(true);
    localStorage.setItem("cs_chat_name", trimmed);
  };

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
          isPending: true,
        },
      ]);
      setInput("");
      socketRef.current.emit("sendMessage", {
        roomId,
        text,
        sender: senderName,
        senderType,
        vendorId,
        orderId: orderId || null,
        fileUrl,
        fileName,
      });
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === optimisticId ? { ...m, isPending: false } : m,
          ),
        );
      }, 800);
    },
    [roomId, senderName, senderType, vendorId, orderId],
  );

  /* ── File upload ── */
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadingFileName(file.name);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await axios.post(`${BACKEND_URL}/api/upload`, form);
      sendMessage({ fileUrl: data.url, fileName: file.name });
    } catch {
      sendMessage({ text: `📎 ${file.name} (upload failed)` });
    } finally {
      setUploading(false);
      setUploadingFileName("");
      e.target.value = "";
    }
  };

  /* ── Name prompt ── */
  if (!nameConfirmed) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-[#AE2108]/10 flex items-center justify-center mx-auto mb-4 overflow-hidden border border-gray-100">
            {vendorLogo ? (
              <img
                src={vendorLogo}
                alt={vendorName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Store className="text-[#AE2108]" size={28} />
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Chat with {vendorName}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Enter your name so the vendor knows who you are
          </p>
          <input
            autoFocus
            type="text"
            placeholder="Your name e.g. Tunde"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && confirmName()}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108] mb-4"
          />
          <button
            onClick={confirmName}
            disabled={!nameInput.trim()}
            className="w-full py-3 rounded-xl bg-[#AE2108] text-white font-semibold text-sm disabled:opacity-40 hover:bg-[#941B06] transition"
          >
            Start Chat
          </button>
        </div>
      </div>
    );
  }

  /* ── Minimized floating pill ── */
  if (minimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50">
        <button
          onClick={handleExpand}
          className="flex items-center gap-3 bg-[#AE2108] text-white pl-4 pr-5 py-3 rounded-full shadow-xl hover:bg-[#941B06] transition active:scale-95"
        >
          <div className="relative flex-shrink-0">
            {vendorLogo ? (
              <img
                src={vendorLogo}
                alt={vendorName}
                className="w-6 h-6 rounded-full object-cover border border-white/30"
              />
            ) : (
              <Store size={18} />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[16px] h-4 bg-green-400 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 border-2 border-[#AE2108]">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="text-left">
            <p className="text-xs font-bold leading-tight">{vendorName}</p>
            <p className="text-[10px] text-white/70 leading-tight">
              {unreadCount > 0
                ? `${unreadCount} new message${unreadCount > 1 ? "s" : ""}`
                : orderId
                  ? `Order: ${orderId}`
                  : "Tap to open"}
            </p>
          </div>
          <Maximize2 size={14} className="text-white/60 ml-1 flex-shrink-0" />
        </button>
      </div>
    );
  }

  /* ── Full chat UI ── */
  return (
    <div className="fixed inset-0 flex flex-col bg-gray-50">
      {/* ── Keyframes injected via style tag ── */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes upload-progress {
          0%   { width: 0%;   margin-left: 0; }
          50%  { width: 70%;  margin-left: 15%; }
          100% { width: 0%;   margin-left: 100%; }
        }
      `}</style>

      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
        {onBack && (
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
        )}
        <div className="w-10 h-10 rounded-full bg-[#AE2108]/10 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
          {vendorLogo ? (
            <img
              src={vendorLogo}
              alt={vendorName}
              className="w-full h-full object-cover"
            />
          ) : (
            <Store className="text-[#AE2108]" size={20} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-900 text-sm truncate">
            {vendorName}
          </h2>
          <p className="text-xs text-gray-400">
            {orderId ? `Order: ${orderId}` : "General enquiry"}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 mr-1">
            {connected ? (
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            ) : (
              <RefreshCw size={13} className="text-gray-300 animate-spin" />
            )}
            <span className="text-xs text-gray-400 hidden sm:block">
              {connected ? "Online" : "Connecting…"}
            </span>
          </div>
          <button
            onClick={() => setMinimized(true)}
            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
            title="Minimize"
          >
            <Minus size={16} className="text-gray-500" />
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        {historyLoading ? (
          <div className="flex justify-center py-16">
            <RefreshCw size={22} className="text-gray-300 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4 overflow-hidden">
              {vendorLogo ? (
                <img
                  src={vendorLogo}
                  alt={vendorName}
                  className="w-full h-full object-cover opacity-40"
                />
              ) : (
                <Store size={28} className="text-gray-300" />
              )}
            </div>
            <p className="text-sm font-medium text-gray-400">No messages yet</p>
            <p className="text-xs text-gray-300 mt-1">
              Say hi to {vendorName}!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              orderId={orderId}
              vendorId={vendorId}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="bg-white border-t">
        {/* ✅ Upload loader — appears above input bar while uploading */}
        {uploading && <UploadLoader fileName={uploadingFileName} />}

        <div className="flex items-center gap-2 px-4 py-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition flex-shrink-0 ${
              uploading
                ? "bg-[#AE2108]/10 text-[#AE2108] animate-pulse"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {uploading ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Paperclip size={17} className="text-gray-500" />
            )}
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
            placeholder={uploading ? "Uploading…" : "Type a message…"}
            value={input}
            disabled={uploading}
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
