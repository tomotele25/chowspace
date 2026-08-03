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
  CreditCard,
  Copy,
  Clock,
  X,
  ShieldCheck,
  Building2,
  Smartphone,
} from "lucide-react";

import { BACKENDURL, SOCKET_URL } from "@/lib/api";

/* ─────────────────────────────────────────────────────────────
   Helpers
─────────────────────────────────────────────────────────────── */
const formatCurrency = (n) =>
  typeof n === "number" ? n.toLocaleString() : "0";

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

const parsePaymentRequest = (text) => {
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
  const accountName = lines
    .find((l) => l.startsWith("AccountName:"))
    ?.replace("AccountName:", "")
    .trim();
  const note = lines
    .find((l) => l.startsWith("Note:"))
    ?.replace("Note:", "")
    .trim();
  const rawAmount = amount ? parseInt(amount.replace(/[₦,]/g, ""), 10) : 0;
  return {
    orderId,
    amount,
    bankName,
    accountNumber,
    accountName,
    note,
    rawAmount,
  };
};

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
  // Temporarily disabled — force both fees to 0 regardless of what
  // checkout passes in via packFee / serviceCharge.
  const packing = 0;
  const service = 0;
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
   PaymentMethodPicker — 3 options shown when customer taps Pay
─────────────────────────────────────────────────────────────── */
function PaymentMethodPicker({ amount, onSelect, onClose }) {
  const methods = [
    {
      key: "monei",
      icon: Smartphone,
      title: "Monei Bank Transfer",
      sub: "Get a unique virtual account — expires in 30 min",
      badge: "Recommended",
      badgeColor: "bg-green-100 text-green-700",
    },
    {
      key: "bank",
      title: "Vendor's Bank Account",
      icon: Building2,
      sub: "Transfer directly to the vendor's saved account",
    },
    {
      key: "card",
      icon: CreditCard,
      title: "Debit / Credit Card",
      sub: "Pay securely with your card",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-0 sm:pb-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-sm font-bold text-gray-900">
              Choose payment method
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              How would you like to pay {amount}?
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
          >
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        <div className="p-4 space-y-2.5">
          {methods.map(({ key, icon: Icon, title, sub, badge, badgeColor }) => (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className="w-full flex items-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl hover:border-[#AE2108] hover:bg-[#AE2108]/5 transition group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-[#AE2108]/10 flex items-center justify-center flex-shrink-0 transition">
                <Icon
                  size={18}
                  className="text-gray-500 group-hover:text-[#AE2108] transition"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-gray-800">{title}</p>
                  {badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColor}`}
                    >
                      {badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
              </div>
              <ArrowLeft
                size={14}
                className="text-gray-300 rotate-180 group-hover:text-[#AE2108] transition flex-shrink-0"
              />
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-1.5 pb-4">
          <ShieldCheck size={12} className="text-gray-300" />
          <p className="text-[10px] text-gray-300">
            All payments are secure and encrypted
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MoneiPanel — virtual account from Monei API
─────────────────────────────────────────────────────────────── */
function MoneiPanel({
  orderId,
  amount,
  rawAmount,
  note,
  customerName,
  customerPhone,
  customerEmail,
  vendorId,
  vendorName,
  onSuccess,
  onBack,
}) {
  const [stage, setStage] = useState("loading");
  const [depositData, setDepositData] = useState(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!depositData?.expiry_datetime) return;
    const tick = () => {
      const diff = new Date(depositData.expiry_datetime) - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        return;
      }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${m}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [depositData]);

  useEffect(() => {
    const init = async () => {
      setStage("loading");
      try {
        const tx_ref = `DEP-${orderId}-${Date.now()}`;
        const { data } = await axios.post(
          `${BACKENDURL}/api/payment/monei/initialize`,
          {
            amount: rawAmount,
            email: customerEmail || "guest@chowspace.ng",
            vendorId,
            tx_ref,
            orderPayload: {
              items: [],
              deliveryMethod: "chat",
              note: note || "",
            },
            guestInfo: {
              name: customerName || "Guest",
              phone: customerPhone || "",
              email: customerEmail || "guest@chowspace.ng",
            },
          },
        );
        setDepositData(data.deposit);
        setStage("ready");
      } catch (err) {
        const backendError = err?.response?.data?.error;
        const backendMessage = err?.response?.data?.message;
        setError(
          backendError
            ? `${backendMessage || "Payment setup failed"}: ${backendError}`
            : backendMessage || "Could not generate account. Please try again.",
        );
        setStage("error");
      }
    };
    init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const copy = () => {
    if (!depositData?.accountNumber) return;
    navigator.clipboard.writeText(depositData.accountNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (stage === "loading") {
    return (
      <div className="p-8 flex flex-col items-center gap-3">
        <RefreshCw size={24} className="text-[#AE2108] animate-spin" />
        <p className="text-sm text-gray-500">Generating virtual account…</p>
        <p className="text-xs text-gray-400 text-center">
          A unique account is being created for this payment
        </p>
      </div>
    );
  }

  if (stage === "error") {
    return (
      <div className="p-5 space-y-3">
        <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600 text-center">
          {error}
        </div>
        <button
          onClick={onBack}
          className="w-full py-3 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 transition"
        >
          ← Try another method
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      <div className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-4 py-2.5 flex items-center justify-between bg-[#AE2108]/5">
          <span className="text-xs font-bold text-[#AE2108]">
            {depositData.bankName}
          </span>
          {timeLeft && (
            <span className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
              <Clock size={10} />
              Expires in {timeLeft}
            </span>
          )}
        </div>
        <div className="px-4 py-3 space-y-3">
          <div>
            <p className="text-[10px] text-gray-400 mb-1">Account number</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xl font-bold text-gray-900 font-mono tracking-widest">
                {depositData.accountNumber}
              </span>
              <button
                onClick={copy}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition flex-shrink-0 ${copied ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}
              >
                <Copy size={11} />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Account name</span>
            <span className="text-sm font-semibold text-gray-800">
              {depositData.accountName}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Amount</span>
            <span className="text-sm font-bold text-[#AE2108]">{amount}</span>
          </div>
        </div>
      </div>

      {/* NOTE: depositData.amount from the API comes back in naira, not
          kobo — if it's ever displayed directly elsewhere, don't divide
          by 100. This panel currently shows the pre-formatted `amount`
          prop instead, so no conversion is needed here. */}
      {depositData.note && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
          {depositData.note}
        </div>
      )}

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
        ⚠️ Transfer the <span className="font-bold">exact amount</span> shown.
        After transfer, tap the button below.
      </div>

      <button
        onClick={() =>
          onSuccess({
            orderId,
            amount,
            reference: depositData?.reference || `DEP-${Date.now()}`,
          })
        }
        className="w-full py-3.5 bg-[#AE2108] text-white font-bold text-sm rounded-xl hover:bg-[#941B06] transition flex items-center justify-center gap-2"
      >
        <CheckCircle2 size={15} />
        I&apos;ve made the transfer
      </button>

      <button
        onClick={onBack}
        className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition"
      >
        ← Choose a different method
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   BankPanel — vendor's saved account details
─────────────────────────────────────────────────────────────── */
function BankPanel({
  amount,
  bankName,
  accountNumber,
  accountName,
  orderId,
  onSuccess,
  onBack,
}) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (!accountNumber) return;
    navigator.clipboard.writeText(accountNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!accountNumber) {
    return (
      <div className="p-5 space-y-3">
        <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-700 text-center">
          The vendor hasn&apos;t saved their bank details yet. Please choose
          another payment method.
        </div>
        <button
          onClick={onBack}
          className="w-full py-3 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 transition"
        >
          ← Go back
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-4">
      <p className="text-xs text-gray-500 text-center leading-relaxed">
        Transfer exactly{" "}
        <span className="font-bold text-gray-800">{amount}</span> to this
        account.
      </p>

      <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Bank</span>
          <span className="text-sm font-semibold text-gray-800">
            {bankName || "—"}
          </span>
        </div>
        <div className="flex justify-between items-center gap-2">
          <span className="text-xs text-gray-400 flex-shrink-0">
            Account number
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900 font-mono tracking-wider">
              {accountNumber}
            </span>
            <button
              onClick={copy}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition flex-shrink-0 ${copied ? "bg-green-100 text-green-600" : "bg-gray-200 text-gray-600 hover:bg-gray-300"}`}
            >
              <Copy size={10} />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">Account name</span>
          <span className="text-sm font-semibold text-gray-800">
            {accountName || "—"}
          </span>
        </div>
        <div className="flex justify-between items-center border-t border-gray-100 pt-2">
          <span className="text-xs text-gray-400">Amount</span>
          <span className="text-sm font-bold text-[#AE2108]">{amount}</span>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
        ⚠️ Transfer the <span className="font-bold">exact amount</span>. Send a
        screenshot to the vendor as proof.
      </div>

      <button
        onClick={() => onSuccess({ orderId, amount })}
        className="w-full py-3.5 bg-[#AE2108] text-white font-bold text-sm rounded-xl hover:bg-[#941B06] transition flex items-center justify-center gap-2"
      >
        <CheckCircle2 size={15} />
        I&apos;ve made the transfer
      </button>

      <button
        onClick={onBack}
        className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition"
      >
        ← Choose a different method
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CardPanel — debit/credit card form
─────────────────────────────────────────────────────────────── */
function CardPanel({ amount, orderId, customerName, onSuccess, onBack }) {
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [nameOnCard, setNameOnCard] = useState(customerName || "");
  const [paying, setPaying] = useState(false);

  const formatCard = (v) =>
    v
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  const formatExpiry = (v) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
  };

  const handlePay = async () => {
    setPaying(true);
    // TODO: integrate with your card payment provider here
    // For now simulate a 1.5s processing then success
    await new Promise((r) => setTimeout(r, 1500));
    onSuccess({ orderId, amount, reference: `CARD-${Date.now()}` });
    setPaying(false);
  };

  return (
    <div className="p-5 space-y-3">
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1.5">
          Card number
        </p>
        <input
          type="text"
          value={cardNumber}
          onChange={(e) => setCardNumber(formatCard(e.target.value))}
          placeholder="0000  0000  0000  0000"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108] bg-gray-50 focus:bg-white transition tracking-widest font-mono"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1.5">Expiry</p>
          <input
            type="text"
            value={expiry}
            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
            placeholder="MM / YY"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108] bg-gray-50 focus:bg-white transition font-mono"
          />
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1.5">CVV</p>
          <input
            type="password"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.slice(0, 4))}
            placeholder="•••"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108] bg-gray-50 focus:bg-white transition font-mono"
          />
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1.5">
          Name on card
        </p>
        <input
          type="text"
          value={nameOnCard}
          onChange={(e) => setNameOnCard(e.target.value)}
          placeholder="Adewale Johnson"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108] bg-gray-50 focus:bg-white transition"
        />
      </div>
      <button
        onClick={handlePay}
        disabled={paying || !cardNumber || !expiry || !cvv}
        className="w-full py-3.5 bg-[#AE2108] text-white font-bold text-sm rounded-xl hover:bg-[#941B06] transition disabled:opacity-40 flex items-center justify-center gap-2 mt-1"
      >
        {paying ? (
          <RefreshCw size={15} className="animate-spin" />
        ) : (
          <CreditCard size={15} />
        )}
        {paying ? "Processing…" : `Pay ${amount}`}
      </button>
      <div className="flex items-center justify-center gap-1.5">
        <ShieldCheck size={12} className="text-gray-300" />
        <p className="text-[10px] text-gray-300">
          Your card details are encrypted
        </p>
      </div>
      <button
        onClick={onBack}
        className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition"
      >
        ← Choose a different method
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PaymentModal — wraps method picker + panels
─────────────────────────────────────────────────────────────── */
function PaymentModal({
  orderId,
  amount,
  rawAmount,
  note,
  customerName,
  customerPhone,
  customerEmail,
  vendorId,
  vendorName,
  vendorBankName,
  vendorAccountNumber,
  vendorAccountName,
  onSuccess,
  onClose,
}) {
  const [method, setMethod] = useState(null); // null | monei | bank | card

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-0 sm:pb-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#AE2108] flex items-center justify-center">
              <span className="text-white text-xs font-bold">CS</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900">
                ChowSpace Payment
              </p>
              <p className="text-[10px] text-gray-400">
                {orderId} · {vendorName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
          >
            <X size={15} className="text-gray-500" />
          </button>
        </div>

        {/* Amount banner */}
        <div className="bg-gray-50 px-5 py-3 text-center border-b border-gray-100">
          <p className="text-xs text-gray-400">Amount due</p>
          <p className="text-2xl font-bold text-gray-900">{amount}</p>
          {note && (
            <p className="text-xs text-gray-500 mt-0.5 italic">{note}</p>
          )}
        </div>

        {/* Content */}
        {!method && (
          <div className="p-4 space-y-2.5">
            <p className="text-xs font-semibold text-gray-400 mb-1">
              Choose how to pay
            </p>
            {[
              {
                key: "monei",
                icon: Smartphone,
                title: "Monei Virtual Account",
                sub: "Get a unique virtual account (expires in 30 min)",
                badge: "Recommended",
              },
              {
                key: "bank",
                icon: Building2,
                title: "Vendor's Bank Account",
                sub: "Transfer to the vendor's saved bank account",
              },
              {
                key: "card",
                icon: CreditCard,
                title: "Debit / Credit Card",
                sub: "Pay securely with your Visa, Mastercard or Verve",
              },
            ].map(({ key, icon: Icon, title, sub, badge }) => (
              <button
                key={key}
                onClick={() => setMethod(key)}
                className="w-full flex items-center gap-3 px-4 py-3.5 border border-gray-200 rounded-xl hover:border-[#AE2108] hover:bg-[#AE2108]/5 transition group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-[#AE2108]/10 flex items-center justify-center flex-shrink-0 transition">
                  <Icon
                    size={18}
                    className="text-gray-500 group-hover:text-[#AE2108] transition"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">
                      {title}
                    </p>
                    {badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                        {badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
                <ArrowLeft
                  size={14}
                  className="text-gray-300 rotate-180 group-hover:text-[#AE2108] transition flex-shrink-0"
                />
              </button>
            ))}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <ShieldCheck size={12} className="text-gray-300" />
              <p className="text-[10px] text-gray-300">
                All payments are secure and encrypted
              </p>
            </div>
          </div>
        )}

        {method === "monei" && (
          <MoneiPanel
            orderId={orderId}
            amount={amount}
            rawAmount={rawAmount}
            note={note}
            customerName={customerName}
            customerPhone={customerPhone}
            customerEmail={customerEmail}
            vendorId={vendorId}
            vendorName={vendorName}
            onSuccess={onSuccess}
            onBack={() => setMethod(null)}
          />
        )}

        {method === "bank" && (
          <BankPanel
            amount={amount}
            bankName={vendorBankName}
            accountNumber={vendorAccountNumber}
            accountName={vendorAccountName}
            orderId={orderId}
            onSuccess={onSuccess}
            onBack={() => setMethod(null)}
          />
        )}

        {method === "card" && (
          <CardPanel
            amount={amount}
            orderId={orderId}
            customerName={customerName}
            onSuccess={onSuccess}
            onBack={() => setMethod(null)}
          />
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PaymentRequestCard — shows pay button, opens PaymentModal
─────────────────────────────────────────────────────────────── */
function PaymentRequestCard({ text, onPay, paid }) {
  const { orderId, amount, note, rawAmount } = parsePaymentRequest(text);

  if (paid) {
    return (
      <div className="rounded-2xl overflow-hidden border border-green-200 bg-green-50 max-w-xs w-full">
        <div className="bg-green-500 px-4 py-3 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-white" />
          <span className="text-white font-bold text-sm">Payment Sent</span>
        </div>
        <div className="px-4 py-3">
          <p className="text-xs text-gray-500 font-mono">{orderId}</p>
          <p className="text-lg font-extrabold text-green-600">{amount}</p>
          <p className="text-xs text-green-600 mt-0.5">
            Awaiting vendor confirmation ✓
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-[#AE2108]/20 bg-white shadow-sm max-w-xs w-full">
      <div className="bg-[#AE2108] px-4 py-3 flex items-center gap-2">
        <CreditCard size={16} className="text-white" />
        <span className="text-white font-bold text-sm">Payment Request</span>
      </div>
      <div className="px-4 py-3 space-y-1">
        <p className="text-xs text-gray-400 font-mono">{orderId}</p>
        <p className="text-2xl font-extrabold text-[#AE2108]">{amount}</p>
        {note && <p className="text-xs text-gray-500 italic">{note}</p>}
        <p className="text-xs text-gray-400 mt-1">
          Choose how you&apos;d like to pay
        </p>
      </div>
      <div className="px-4 pb-4">
        <button
          onClick={() => onPay({ orderId, amount, rawAmount, note })}
          className="w-full py-3 bg-[#AE2108] text-white font-bold text-sm rounded-xl hover:bg-[#941B06] transition flex items-center justify-center gap-2"
        >
          <CreditCard size={15} />
          Pay {amount} now
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PaymentSuccess
─────────────────────────────────────────────────────────────── */
function PaymentSuccess({ amount, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-7 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} className="text-green-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">
          Payment initiated!
        </h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Your payment of{" "}
          <span className="font-bold text-gray-800">{amount}</span> has been
          initiated. The vendor will confirm once received.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold text-sm rounded-xl hover:bg-gray-50 transition"
          >
            Back to chat
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-[#AE2108] text-white font-bold text-sm rounded-xl hover:bg-[#941B06] transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MessageBubble
─────────────────────────────────────────────────────────────── */
function MessageBubble({ msg, onPayRequest, paidOrders }) {
  const isCard = isOrderCard(msg.text);
  const isPayCard = isPaymentRequestCard(msg.text);

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
          <PaymentRequestCard
            text={msg.text}
            onPay={onPayRequest}
            paid={paidOrders.has(parsePaymentRequest(msg.text).orderId)}
          />
        ) : (
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.isOwn ? "bg-[#AE2108] text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none border border-gray-100"}`}
          >
            {msg.text && (
              <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
            )}
            {msg.fileUrl && (
              <a
                href={msg.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-2 flex items-center gap-2 rounded-lg p-2 text-xs transition border ${msg.isOwn ? "border-white/30" : "border-gray-200"}`}
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

/* ─────────────────────────────────────────────────────────────
   Main — CustomerChat
─────────────────────────────────────────────────────────────── */
export default function CustomerChat() {
  const [order, setOrder] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [orderSent, setOrderSent] = useState(false);

  const [paymentModal, setPaymentModal] = useState(null);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [paidOrders, setPaidOrders] = useState(new Set());

  const [vendorBankDetails, setVendorBankDetails] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
  });

  const socketRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const orderSentRef = useRef(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("chatOrder");
      if (raw) setOrder(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  const roomId = order ? `order_${order.orderId}` : null;
  const customerName = order?.customerName || "Customer";
  const customerEmail = order?.customerEmail || "guest@chowspace.ng";
  const customerPhone = order?.customerPhone || "";
  const vendorName = order?.vendorName || "Vendor";
  const vendorId = order?.vendorId || null;

  useEffect(() => {
    if (!roomId) return;
    setHistoryLoading(true);
    axios
      .get(`${BACKENDURL}/api/chat/${roomId}`)
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
        const alreadySent = mapped.some((m) => isOrderCard(m.text));
        if (alreadySent) {
          orderSentRef.current = true;
          setOrderSent(true);
        }

        // Extract vendor bank details from any payment request in history
        const payReq = mapped.find((m) => isPaymentRequestCard(m.text));
        if (payReq) {
          const parsed = parsePaymentRequest(payReq.text);
          setVendorBankDetails({
            bankName: parsed.bankName || "",
            accountNumber: parsed.accountNumber || "",
            accountName: parsed.accountName || "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !vendorId) return;
    if (socketRef.current) socketRef.current.disconnect();

    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("joinOrderRoom", order.orderId);

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
        sessionStorage.removeItem("chatOrder");
      }
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on("receiveMessage", (msg) => {
      setMessages((prev) => {
        if (msg._id && prev.some((m) => m.id === msg._id)) return prev;
        if (msg.senderType === "customer") return prev;

        // Extract vendor bank details if this is a payment request
        if (isPaymentRequestCard(msg.text)) {
          const parsed = parsePaymentRequest(msg.text);
          setVendorBankDetails({
            bankName: parsed.bankName || "",
            accountNumber: parsed.accountNumber || "",
            accountName: parsed.accountName || "",
          });
        }

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

  const handlePayRequest = (paymentData) => {
    setPaymentModal(paymentData);
  };

  const handlePaymentSuccess = ({
    orderId: paidOrderId,
    amount,
    reference,
  }) => {
    setPaymentModal(null);
    setPaymentSuccess({ amount });
    setPaidOrders((prev) => new Set([...prev, paidOrderId]));
    socketRef.current?.emit("paymentConfirmed", {
      roomId,
      orderId: paidOrderId,
      amount,
      reference,
      customerName,
      vendorId,
    });
    sendMessage({
      text: `✅ I've initiated payment of ${amount}.\n\nPlease confirm once you receive it.`,
    });
  };

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
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#AE2108] text-white rounded-xl font-semibold text-sm hover:bg-[#941B06] transition"
          >
            <ArrowLeft size={16} />
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm flex-shrink-0">
        <button
          onClick={() => window.history.back()}
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
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onPayRequest={handlePayRequest}
              paidOrders={paidOrders}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </main>

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

      {/* Payment modal with 3 options */}
      {paymentModal && (
        <PaymentModal
          orderId={paymentModal.orderId}
          amount={paymentModal.amount}
          rawAmount={paymentModal.rawAmount}
          note={paymentModal.note}
          customerName={customerName}
          customerEmail={customerEmail}
          customerPhone={customerPhone}
          vendorId={vendorId}
          vendorName={vendorName}
          vendorBankName={vendorBankDetails.bankName}
          vendorAccountNumber={vendorBankDetails.accountNumber}
          vendorAccountName={vendorBankDetails.accountName}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPaymentModal(null)}
        />
      )}

      {paymentSuccess && (
        <PaymentSuccess
          amount={paymentSuccess.amount}
          onClose={() => setPaymentSuccess(null)}
        />
      )}
    </div>
  );
}
