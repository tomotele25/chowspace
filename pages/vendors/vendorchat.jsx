"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { io } from "socket.io-client";
import axios from "axios";
import {
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
  CheckCheck,
  CreditCard,
  Printer,
  Zap,
  X,
  AlertCircle,
} from "lucide-react";
import { cloudinaryResize } from "@/utils/captcha";
import { BACKENDURL, SOCKET_URL } from "@/lib/api";
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

/* ─── Receipt printing ───
   Thermal rolls print black on white, no fills, no emoji. So the slip is
   rebuilt from the parsed order rather than printing the on-screen card.
   ₦ is written as N — Courier has no naira glyph and prints a blank box. */
const asciiOnly = (s = "") => s.replace(/[^\x20-\x7E]/g, "").trim();
const naira = (s = "") => s.replace(/₦/g, "N");

function ReceiptRule() {
  return (
    <div
      style={{
        borderTop: "1px dashed #000",
        margin: "6px 0",
      }}
    />
  );
}

function ReceiptRow({ left, right, bold }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "8px",
        fontWeight: bold ? 700 : 400,
      }}
    >
      <span style={{ flex: 1, wordBreak: "break-word" }}>{left}</span>
      {right ? <span style={{ whiteSpace: "nowrap" }}>{right}</span> : null}
    </div>
  );
}

function ReceiptSheet({ text, vendorName }) {
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
  const printedAt = new Date().toLocaleString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div id="cs-receipt">
      <style jsx global>{`
        #cs-receipt {
          display: none;
        }
        @media print {
          body * {
            visibility: hidden !important;
          }
          #cs-receipt,
          #cs-receipt * {
            visibility: visible !important;
          }
          #cs-receipt {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 72mm;
            padding: 0;
            color: #000;
            background: #fff;
            font-family: "Courier New", Courier, monospace;
            font-size: 11px;
            line-height: 1.45;
          }
          @page {
            size: 80mm auto;
            margin: 4mm;
          }
        }
      `}</style>

      <div style={{ textAlign: "center" }}>
        <div
          style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "1px" }}
        >
          {asciiOnly(vendorName || "ChowSpace").toUpperCase()}
        </div>
        <div style={{ fontSize: "10px" }}>Order slip</div>
      </div>

      <ReceiptRule />

      <ReceiptRow left="ORDER" right={asciiOnly(orderId)} bold />
      <ReceiptRow left="PRINTED" right={printedAt} />

      <ReceiptRule />

      {customer ? (
        <div style={{ fontWeight: 700 }}>{asciiOnly(customer)}</div>
      ) : null}
      {phone ? <div>{asciiOnly(phone)}</div> : null}
      {location || address ? (
        <div style={{ wordBreak: "break-word" }}>
          {[asciiOnly(location), asciiOnly(address)]
            .filter(Boolean)
            .join(" - ")}
        </div>
      ) : null}

      <ReceiptRule />

      {packs.map((pack, i) => (
        <div key={i} style={{ marginBottom: "6px" }}>
          <div style={{ fontWeight: 700 }}>
            {asciiOnly(pack.title).toUpperCase()}
          </div>
          {pack.items.map((item, j) => {
            const [name, price] = item.split("  —  ");
            return (
              <ReceiptRow
                key={j}
                left={asciiOnly(name)}
                right={naira(asciiOnly(price))}
              />
            );
          })}
        </div>
      ))}

      {totals.length > 0 ? (
        <>
          <ReceiptRule />
          {totals.map((line, i) => {
            const match = line.match(/^(.+?)\s+(₦[\d,]+)$/);
            return (
              <ReceiptRow
                key={i}
                left={asciiOnly(match ? match[1] : line)}
                right={match ? naira(match[2]) : ""}
              />
            );
          })}
        </>
      ) : null}

      {totalLine ? (
        <>
          <div style={{ borderTop: "2px solid #000", margin: "6px 0" }} />
          <ReceiptRow
            left="TOTAL"
            right={naira(asciiOnly(totalLine.replace(/^TOTAL\s*/i, "")))}
            bold
          />
        </>
      ) : null}

      <ReceiptRule />

      <div style={{ textAlign: "center", fontSize: "10px" }}>
        Thank you for your order
      </div>
      <div style={{ height: "10mm" }} />
    </div>
  );
}

/* The vendor's day runs on the paper slip, so the order rides in the header
   as a ticket line: customer, order number, total, and the two things they
   actually do about it. The header is already fixed, so this costs no space
   in the conversation. */
const PAPER = "#FAF9F7";

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
    <div className="rounded-xl overflow-hidden border border-stone-200 bg-white shadow-sm max-w-xs w-full">
      <div className="h-1 bg-[#AE2108]" />

      <div className="px-4 pt-3 pb-3 border-b border-dashed border-stone-200">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
            New order
          </span>
          <span className="font-mono text-[11px] font-bold text-stone-900 truncate">
            {orderId}
          </span>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-dashed border-stone-200 space-y-1.5">
        {customer && (
          <div className="flex items-center gap-2 text-xs text-stone-800">
            <User size={12} className="text-stone-400 flex-shrink-0" />
            <span className="font-semibold">{customer}</span>
          </div>
        )}
        {phone && (
          <div className="flex items-center gap-2 text-xs text-stone-600">
            <Phone size={12} className="text-stone-400 flex-shrink-0" />
            <span className="font-mono">{phone}</span>
          </div>
        )}
        {(location || address) && (
          <div className="flex items-start gap-2 text-xs text-stone-600">
            <MapPin size={12} className="text-stone-400 flex-shrink-0 mt-0.5" />
            <span>
              {location}
              {location && address ? " · " : ""}
              {address}
            </span>
          </div>
        )}
      </div>

      {packs.map((pack, i) => (
        <div
          key={i}
          className="px-4 py-3 border-b border-dashed border-stone-200"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400 mb-2">
            {pack.title.replace("📦 ", "")}
          </p>
          {pack.items.map((item, j) => {
            const [name, price] = item.split("  —  ");
            return (
              <div key={j} className="flex items-baseline gap-1.5 py-0.5">
                <span className="text-xs text-stone-700">{name?.trim()}</span>
                <span className="flex-1 border-b border-dotted border-stone-300 translate-y-[-2px]" />
                <span className="font-mono text-xs text-stone-900 tabular-nums">
                  {price?.trim()}
                </span>
              </div>
            );
          })}
        </div>
      ))}

      {totals.length > 0 && (
        <div className="px-4 py-3 space-y-1">
          {totals.map((line, i) => {
            const match = line.match(/^(.+?)\s+(₦[\d,]+)$/);
            return (
              <div key={i} className="flex items-baseline gap-1.5">
                <span className="text-xs text-stone-500">
                  {match ? match[1].trim() : line}
                </span>
                <span className="flex-1 border-b border-dotted border-stone-200 translate-y-[-2px]" />
                <span className="font-mono text-xs text-stone-500 tabular-nums">
                  {match ? match[2].trim() : ""}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {totalLine && (
        <div className="px-4 py-3 border-t-2 border-stone-900/10 flex justify-between items-baseline">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
            Total
          </span>
          <span className="font-mono text-lg font-bold text-[#AE2108] tabular-nums">
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
    <div className="rounded-xl overflow-hidden border border-stone-200 bg-white shadow-sm max-w-xs w-full">
      <div className="h-1 bg-[#AE2108]" />
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
            Payment requested
          </span>
          <span className="font-mono text-[11px] text-stone-500 truncate">
            {orderId}
          </span>
        </div>
        <p className="font-mono text-2xl font-bold text-[#AE2108] tabular-nums leading-none">
          {amount}
        </p>
        {bankName && (
          <div className="mt-3 pt-3 border-t border-dashed border-stone-200">
            <p className="text-xs text-stone-500">{bankName}</p>
            <p className="font-mono text-sm font-semibold text-stone-900 tabular-nums">
              {accountNumber}
            </p>
          </div>
        )}
        <p className="text-[11px] text-stone-400 mt-2">
          Waiting for the customer to pay
        </p>
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
        src={cloudinaryResize(src, 1200)}
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
          <p className="text-[10px] text-stone-400 mb-1 ml-2 font-medium">
            {msg.senderName}
          </p>
        )}
        {isCard ? (
          <OrderCard text={msg.text} />
        ) : isPayCard ? (
          <PaymentRequestCardSent text={msg.text} />
        ) : (
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.isOwn ? "bg-[#AE2108] text-white rounded-br-sm" : "bg-white text-stone-800 rounded-bl-sm border border-stone-200"}`}
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
                    src={cloudinaryResize(msg.fileUrl, 300)}
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
                className={`mt-2 flex items-center gap-2 rounded-lg p-2 text-xs border ${msg.isOwn ? "border-white/30" : "border-stone-200"}`}
              >
                <Paperclip size={13} />
                <span className="truncate">{msg.fileName || "View file"}</span>
              </a>
            )}
            <span
              className={`block mt-1 text-[10px] text-right leading-none ${msg.isOwn ? "text-white/50" : "text-stone-300"}`}
            >
              {msg.time}
              {msg.isOwn && (
                <CheckCircle2 size={10} className="inline ml-1 opacity-60" />
              )}
            </span>
          </div>
        )}
        {(isCard || isPayCard) && (
          <p className="text-[10px] mt-1 text-left text-stone-400 ml-1">
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
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <CreditCard size={18} className="text-[#AE2108]" />
            <span className="font-bold text-stone-900 text-sm">
              Request Payment
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition"
          >
            <X size={15} className="text-stone-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Amount */}
          <div>
            <label className="text-xs font-semibold text-stone-500 mb-1.5 block">
              Amount (₦)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm font-semibold">
                ₦
              </span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="w-full pl-8 pr-4 py-3 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108] bg-stone-50 focus:bg-white transition"
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
              <label className="text-xs font-semibold text-stone-500 mb-1.5 block">
                Your bank account (auto-filled)
              </label>
              <div className="bg-stone-50 rounded-xl border border-stone-100 p-3 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Bank</span>
                  <span className="font-semibold text-stone-800">
                    {vendorData.bankName}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Account number</span>
                  <span className="font-bold text-stone-900 font-mono">
                    {vendorData.accountNumber}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-400">Account name</span>
                  <span className="font-semibold text-stone-800">
                    {vendorData.accountName}
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-stone-400 mt-1.5">
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
            <label className="text-xs font-semibold text-stone-500 mb-1.5 block">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. includes delivery"
              className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108] bg-stone-50 focus:bg-white transition"
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
          <p className="text-center text-xs text-stone-400">
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
  // Needed for the socket handshake — the server uses it to decide whether
  // this connection may join the vendor room.
  const { data: session } = useSession();
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
          `${BACKENDURL}/api/chat/vendor/${vendorId}`,
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
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      // The server derives senderType and vendor-room access from this, so
      // without it the dashboard is treated as an anonymous customer.
      auth: { token: session?.user?.accessToken },
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
      <div className="px-4 py-4 border-b border-stone-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-stone-900 uppercase tracking-[0.1em]">
            Orders
          </h2>
          <button
            onClick={() => fetchRooms()}
            disabled={refreshing}
            className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition disabled:opacity-40"
          >
            <RefreshCw
              size={14}
              className={`text-stone-400 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
        <div className="flex rounded-lg bg-stone-100 p-1 mb-3">
          {[
            {
              key: "active",
              label: "Active",
              count: activeRooms.length,
              color: "bg-[#AE2108]",
            },
            {
              key: "completed",
              label: "Done",
              count: completedRooms.length,
              color: "bg-emerald-600",
            },
          ].map(({ key, label, count, color }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition ${activeTab === key ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-700"}`}
            >
              {label}
              {count > 0 && (
                <span
                  className={`min-w-[16px] h-4 flex items-center justify-center rounded-full ${color} text-white text-[9px] font-bold tabular-nums px-1`}
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
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
          />
          <input
            type="text"
            placeholder="Search name or order number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-stone-100 rounded-lg outline-none focus:ring-2 focus:ring-[#AE2108]/20"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-12">
            <RefreshCw size={20} className="text-stone-300 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <p className="text-sm text-stone-500 font-medium">
              {activeTab === "completed"
                ? "Nothing finished yet"
                : "No orders right now"}
            </p>
            <p className="text-xs text-stone-400 mt-1">
              {activeTab === "completed"
                ? "Orders you mark as confirmed land here"
                : "New orders arrive here on their own"}
            </p>
          </div>
        ) : (
          filtered.map((room) => {
            const isSelected = room._id === selectedRoomId;
            const isOrderChat = room._id?.startsWith("order_");
            const isCompleted = completedIds.has(room._id);
            const previewText = isOrderCard(room.lastMessage)
              ? "New order received"
              : isPaymentRequestCard(room.lastMessage)
                ? "Payment requested"
                : room.lastMessage || "No messages yet";
            return (
              <button
                key={room._id}
                onClick={() => onSelectRoom(room)}
                className={`w-full text-left px-4 py-3.5 border-b border-stone-100 border-l-2 transition hover:bg-stone-50 ${
                  isSelected
                    ? "bg-[#AE2108]/5 border-l-[#AE2108]"
                    : "border-l-transparent"
                } ${isCompleted ? "opacity-70" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${isCompleted ? "bg-emerald-50" : "bg-[#AE2108]/8"}`}
                  >
                    {isCompleted ? (
                      <CheckCheck size={15} className="text-emerald-600" />
                    ) : isOrderChat ? (
                      <Package size={15} className="text-[#AE2108]" />
                    ) : (
                      <User size={15} className="text-[#AE2108]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-stone-900 truncate">
                        {room.lastSender || "Customer"}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!isCompleted && room.unreadCount > 0 && (
                          <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#AE2108] text-white text-[9px] font-bold tabular-nums px-1">
                            {room.unreadCount > 99 ? "99+" : room.unreadCount}
                          </span>
                        )}
                        <span className="text-[10px] text-stone-400 tabular-nums">
                          {formatTime(room.lastTime)}
                        </span>
                      </div>
                    </div>
                    {room.orderId && (
                      <p className="font-mono text-[10px] text-stone-400 mb-0.5 truncate">
                        {room.orderId}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-stone-500 truncate">
                        {previewText}
                      </p>
                      {isCompleted && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleComplete(room._id, false);
                          }}
                          className="flex-shrink-0 text-[10px] text-stone-400 hover:text-[#AE2108] hover:underline"
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
  // Needed for the socket handshake — the server derives senderType from it,
  // so without it this vendor's messages would be recorded as a customer's.
  const { data: session } = useSession();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [historyLoading, setHistoryLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [printText, setPrintText] = useState(null);
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
  // The order card scrolls out of view in a long chat, so the header keeps
  // a way back to it.
  const orderCardText = useMemo(
    () => messages.find((m) => isOrderCard(m.text))?.text || null,
    [messages],
  );
  // Mount the slip, let it paint, then open the print dialog. `afterprint`
  // fires on cancel too, so the slip always unmounts.
  useEffect(() => {
    if (!printText) return;
    const clear = () => setPrintText(null);
    window.addEventListener("afterprint", clear);
    const timer = setTimeout(() => window.print(), 80);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("afterprint", clear);
    };
  }, [printText]);
  useEffect(() => {
    setHistoryLoading(true);
    setMessages([]);
    axios
      .get(`${BACKENDURL}/api/chat/${roomId}`)
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
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      // The server derives senderType and vendor-room access from this, so
      // without it the dashboard is treated as an anonymous customer.
      auth: { token: session?.user?.accessToken },
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
      const { data } = await axios.post(`${BACKENDURL}/api/upload`, form);
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
      <header className="bg-white border-b border-stone-200 px-4 py-2.5 flex items-center gap-2.5 flex-shrink-0">
        <button
          onClick={onBack}
          aria-label="Back to orders"
          className="lg:hidden w-9 h-9 rounded-full hover:bg-stone-100 flex items-center justify-center flex-shrink-0"
        >
          <ArrowLeft size={18} className="text-stone-600" />
        </button>

        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-stone-900 text-sm truncate leading-tight">
            {customerName}
          </h2>
          {orderCardText ? (
            <p className="text-[11px] truncate leading-tight mt-0.5">
              <span className="font-mono text-stone-500">
                {resolvedOrderId}
              </span>
              {resolvedTotal && (
                <>
                  <span className="text-stone-300 mx-1.5">·</span>
                  <span className="font-mono font-bold text-[#AE2108] tabular-nums">
                    {resolvedTotal}
                  </span>
                </>
              )}
            </p>
          ) : (
            <p className="text-[11px] text-stone-400 leading-tight mt-0.5">
              {connected ? "Connected" : "Reconnecting…"}
            </p>
          )}
        </div>

        {orderCardText && (
          <>
            <button
              type="button"
              onClick={() => setPrintText(orderCardText)}
              title="Print the order slip"
              aria-label="Print the order slip"
              className="w-9 h-9 rounded-lg border border-stone-200 flex items-center justify-center text-stone-500 hover:text-[#AE2108] hover:border-[#AE2108]/30 hover:bg-[#AE2108]/5 active:scale-95 transition flex-shrink-0"
            >
              <Printer size={15} />
            </button>
            <button
              type="button"
              onClick={() => setShowPaymentModal(true)}
              aria-label="Request payment"
              className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#AE2108] text-white text-xs font-semibold hover:bg-[#941B06] active:scale-95 transition flex-shrink-0"
            >
              <CreditCard size={13} />
              <span className="hidden sm:inline">Request payment</span>
            </button>
          </>
        )}

        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? "bg-emerald-500 animate-pulse" : "bg-stone-300"}`}
          title={connected ? "Connected" : "Reconnecting"}
        />
      </header>
      <main
        className="flex-1 overflow-y-auto px-4 py-5 space-y-3"
        style={{ background: PAPER }}
      >
        {historyLoading ? (
          <div className="flex justify-center py-16">
            <RefreshCw size={22} className="text-stone-300 animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center">
            <p className="text-sm text-stone-400">No messages yet</p>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}
        <div ref={messagesEndRef} />
      </main>
      <footer className="bg-white border-t border-stone-200 flex-shrink-0">
        {showQuickReplies && (
          <div className="border-b border-stone-200 px-4 py-3 max-h-80 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.14em]">
                Quick replies
              </p>
              <button
                onClick={() => setAddingNew(true)}
                className="text-xs text-[#AE2108] font-semibold hover:underline"
              >
                + Add new
              </button>
            </div>
            <div className="space-y-2">
              {quickReplies.map((qr) =>
                editingId === qr.id ? (
                  <div
                    key={qr.id}
                    className="bg-stone-50 rounded-xl p-3 space-y-2"
                  >
                    <input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      placeholder="Label"
                      className="w-full text-xs border border-stone-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#AE2108]"
                    />
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      placeholder="Message text"
                      className="w-full text-xs border border-stone-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#AE2108] resize-none"
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
                        className="flex-1 py-1.5 bg-stone-100 text-stone-600 text-xs font-semibold rounded-lg"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={qr.id}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2.5 group ${qr.id === "qr2" ? "bg-emerald-50 border border-emerald-100" : "bg-stone-50"}`}
                  >
                    <button
                      onClick={() => handleQuickSend(qr.text, qr.id)}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-semibold text-stone-800">
                          {qr.label}
                        </p>
                        {qr.id === "qr2" && (
                          <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">
                            Marks as done
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-400 truncate mt-0.5">
                        {qr.text}
                      </p>
                    </button>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition flex-shrink-0">
                      <button
                        onClick={() => {
                          setEditingId(qr.id);
                          setEditLabel(qr.label);
                          setEditText(qr.text);
                        }}
                        className="text-[10px] text-stone-500 hover:text-stone-900 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          saveQuickReplies(
                            quickReplies.filter((q) => q.id !== qr.id),
                          )
                        }
                        className="text-[10px] text-stone-400 hover:text-[#AE2108] hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ),
              )}
              {addingNew && (
                <div className="bg-stone-50 rounded-xl p-3 space-y-2">
                  <input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Label"
                    className="w-full text-xs border border-stone-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#AE2108]"
                  />
                  <textarea
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    rows={3}
                    placeholder="Message text…"
                    className="w-full text-xs border border-stone-200 rounded-lg px-3 py-1.5 outline-none focus:border-[#AE2108] resize-none"
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
                      className="flex-1 py-1.5 bg-stone-100 text-stone-600 text-xs font-semibold rounded-lg"
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
            aria-label="Quick replies"
            className={`w-10 h-10 rounded-full flex items-center justify-center transition flex-shrink-0 ${showQuickReplies ? "bg-[#AE2108] text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"}`}
          >
            <Zap size={16} />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Attach a file"
            className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition disabled:opacity-40 flex-shrink-0"
          >
            <Paperclip size={17} className="text-stone-500" />
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
            className="flex-1 min-w-0 bg-stone-100 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#AE2108]/30"
          />
          <button
            type="button"
            onClick={() => sendMessage({ text: input.trim() })}
            disabled={!input.trim() || uploading || !connected}
            aria-label="Send"
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
      {printText && <ReceiptSheet text={printText} vendorName={vendorName} />}
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
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <RefreshCw size={24} className="text-stone-300 animate-spin" />
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
      <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
        <p className="text-sm text-stone-400">
          Vendor ID not found in session. Please log in again.
        </p>
      </div>
    );
  }
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: PAPER }}
    >
      <div
        className={`w-full lg:w-80 xl:w-96 bg-white border-r border-stone-200 flex-shrink-0 flex flex-col ${selectedRoom ? "hidden lg:flex" : "flex"}`}
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
            {/* An empty ticket rail, not a grey circle */}
            <div className="w-40 space-y-2 mb-6" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-10 rounded-lg border border-dashed border-stone-300"
                  style={{ opacity: 1 - i * 0.3 }}
                />
              ))}
            </div>
            <h3 className="text-sm font-semibold text-stone-600 mb-1">
              Pick an order to work on
            </h3>
            <p className="text-xs text-stone-400 max-w-[15rem]">
              Open one on the left to print the slip, request payment, or reply
              to the customer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
