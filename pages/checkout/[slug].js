"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useCart } from "@/context/CartContext";
import toast, { Toaster } from "react-hot-toast";
import {
  User,
  Phone,
  MapPin,
  Package,
  ShoppingCart,
  CheckCircle2,
  MessageCircle,
  Gift,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ─── Helpers ─────────────────────────────────────────────── */
const formatCurrency = (n) =>
  typeof n === "number" ? n.toLocaleString() : "0";

const formatPhoneNumber = (number) => {
  let d = String(number).replace(/\D/g, "");
  if (d.startsWith("0")) d = "234" + d.slice(1);
  return d;
};

const generateOrderId = () =>
  `CS-${Math.floor(100000 + Math.random() * 900000)}`;

const isAbeokutaVendor = (v) =>
  v?.location?.toLowerCase().trim() === "abeokuta";

const BACKENDURL =
  "https://chowspace-backend-1.onrender.com" || "http://localhost:2005";

const BIRTHDAY_KEY = "cs_birthday_saved";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/* ─── Shared input style ──────────────────────────────────── */
const inputCls =
  "w-full pl-10 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-[#AE2108] focus:ring-2 focus:ring-[#AE2108]/15 hover:border-gray-300";

const inputErrCls =
  "w-full pl-10 pr-4 py-3.5 rounded-2xl border border-red-400 bg-white text-sm text-gray-800 placeholder-gray-400 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-400/15";

/* ─── Validation ──────────────────────────────────────────── */
const validateNigerianPhone = (raw) => {
  const d = raw.replace(/\D/g, "");
  const local = /^0[7-9][01]\d{8}$/.test(d);
  const intl = /^234[7-9][01]\d{8}$/.test(d);
  return local || intl;
};

const validateName = (name) => {
  const trimmed = name.trim();
  if (trimmed.length < 3) return false;
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return false;
  // Reject same char repeated (e.g. "aaaa", "xxxx xxxx")
  if (/^(.)\1+$/.test(trimmed.replace(/\s/g, ""))) return false;
  return true;
};

/* ─── Birthday Nudge ──────────────────────────────────────── */
function BirthdayNudge({ phone: prefillPhone, vendorId }) {
  const [phone, setPhone] = useState(prefillPhone || "");
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alreadySaved, setAlreadySaved] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(BIRTHDAY_KEY) === "1") setAlreadySaved(true);
    } catch {}
  }, []);

  useEffect(() => {
    if (prefillPhone && !phone) setPhone(prefillPhone);
  }, [prefillPhone]);

  if (alreadySaved || dismissed) return null;

  if (saved) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#AE2108] to-[#7a1706] p-6 text-center">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "radial-gradient(white 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="relative">
          <div className="text-5xl mb-3">🎂</div>
          <p className="font-bold text-white text-base mb-1">
            We&apos;ll celebrate with you!
          </p>
          <p className="text-sm text-white/70 leading-relaxed">
            Birthday locked in. Expect something sweet on your special day 🎁
          </p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!validateNigerianPhone(cleanPhone)) {
      toast.error("Enter a valid Nigerian phone number (e.g. 08012345678)");
      return;
    }
    if (!dobMonth || !dobDay) {
      toast.error("Please pick a month and day");
      return;
    }
    const day = parseInt(dobDay, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      toast.error("Enter a valid day (1–31)");
      return;
    }
    setSaving(true);
    try {
      await axios.post(
        `https://chowspace-backend.vercel.app/api/customers/birthday`,
        {
          phone: formatPhoneNumber(cleanPhone),
          month: dobMonth,
          day,
          vendorId,
        },
      );
      setSaved(true);
      try {
        localStorage.setItem(BIRTHDAY_KEY, "1");
      } catch {}
      toast.success("🎂 Birthday saved! Expect a treat on your big day.");
    } catch {
      toast.error("Couldn't save birthday — please try again");
    } finally {
      setSaving(false);
    }
  };

  const canSave = !!phone.trim() && !!dobMonth && !!dobDay && !saving;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-white">
      <div className="h-1 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400" />
      <div className="p-6">
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="absolute top-5 right-5 text-gray-300 hover:text-gray-500 transition"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
        <div className="flex items-start gap-4 mb-5">
          <div className="w-11 h-11 rounded-xl bg-[#fdf1ee] flex items-center justify-center flex-shrink-0">
            <Gift size={20} className="text-[#AE2108]" />
          </div>
          <div>
            <span className="inline-block text-[10px] font-bold bg-[#AE2108] text-white rounded-full px-2.5 py-0.5 mb-1.5 uppercase tracking-widest">
              Free perk
            </span>
            <h2 className="text-sm font-bold text-gray-900 leading-snug">
              Let&apos;s celebrate with you! 🎉
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">
              Share your birthday and we&apos;ll send a surprise treat. No spam,
              ever.
            </p>
          </div>
        </div>
        <div className="space-y-3 mb-4">
          <div className="relative">
            <Phone
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your phone number"
              disabled={!!prefillPhone}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition ${
                prefillPhone
                  ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white border-gray-200 focus:border-[#AE2108] focus:ring-2 focus:ring-[#AE2108]/15 hover:border-gray-300"
              }`}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={dobMonth}
              onChange={(e) => setDobMonth(e.target.value)}
              className="flex-1 px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:border-[#AE2108] focus:ring-2 focus:ring-[#AE2108]/15 outline-none transition hover:border-gray-300"
            >
              <option value="" disabled>
                Month
              </option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              max="31"
              placeholder="Day"
              value={dobDay}
              onChange={(e) => setDobDay(e.target.value)}
              className="w-20 px-3 py-3 rounded-xl border border-gray-200 bg-white text-sm text-center focus:border-[#AE2108] focus:ring-2 focus:ring-[#AE2108]/15 outline-none transition hover:border-gray-300"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className={`px-4 py-3 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center justify-center min-w-[64px] ${
                canSave
                  ? "bg-[#AE2108] hover:bg-[#941B06] text-white active:scale-[0.98]"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                "Save"
              )}
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="block text-xs text-gray-400 hover:text-gray-500 underline underline-offset-2 transition mx-auto"
        >
          No thanks, skip this
        </button>
      </div>
    </div>
  );
}

/* ─── Main Checkout Page ──────────────────────────────────── */
export default function CheckoutPage() {
  const router = useRouter();
  const { slug } = router.query;
  const { data: session } = useSession();
  const { cart, addToCart, removeFromCart, clearCart } = useCart();
  const isSubmitting = useRef(false);

  const [vendor, setVendor] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [orderFor, setOrderFor] = useState("myself");
  const [placedOrderId, setPlacedOrderId] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [packingFeePerPack, setPackingFeePerPack] = useState(300);
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState("idle");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [deliveryDetails, setDeliveryDetails] = useState({
    name: "",
    phone: "",
    address: "",
    location: "",
  });

  // Inline field errors
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const cartItems = cart.flat();
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const packFee = cart.length * packingFeePerPack;
  const serviceCharge = 60;
  const finalTotal =
    cartTotal + deliveryFee + packFee + serviceCharge - couponDiscount;
  const isLocalVendor = isAbeokutaVendor(vendor);

  const resolvedPhone =
    session?.user?.phone ||
    session?.user?.contact ||
    deliveryDetails.phone ||
    "";

  useEffect(() => {
    if (session?.user && orderFor === "myself") {
      setDeliveryDetails((p) => ({ ...p, name: session.user.fullname || "" }));
    }
    if (orderFor === "guest") setDeliveryDetails((p) => ({ ...p, name: "" }));
  }, [session, orderFor]);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const vr = await axios.get(
          `https://chowspace-backend.vercel.app/api/vendor/${slug}`,
        );
        const vd = vr.data.vendor;
        setVendor(vd);
        if (typeof vd.packingFee === "number")
          setPackingFeePerPack(vd.packingFee);
        if (vd?.location?.toLowerCase().trim() === "abeokuta") {
          const lr = await axios.get(`${BACKENDURL}/api/locations/${vd._id}`);
          setLocations(
            (lr.data.locations || []).map((l) => ({
              name: l.location,
              fee: l.price,
            })),
          );
        }
      } catch {
        toast.error("Failed to load vendor");
      }
    })();
  }, [slug]);

  /* ── Live field validation on change ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDeliveryDetails((p) => ({ ...p, [name]: value }));

    if (name === "location") {
      const match = locations.find((l) => l.name === value);
      setDeliveryFee(match?.fee || 0);
    }

    // Live feedback after user has typed enough
    if (name === "phone" && value.length > 6) {
      setFieldErrors((p) => ({
        ...p,
        phone: validateNigerianPhone(value)
          ? ""
          : "Enter a valid Phone no",
      }));
    } else if (name === "phone" && value.length <= 6) {
      setFieldErrors((p) => ({ ...p, phone: "" }));
    }

    if (name === "name" && value.trim().length > 2) {
      setFieldErrors((p) => ({
        ...p,
        name: validateName(value)
          ? ""
          : "Enter your real full name (e.g. Amara Okafor)",
      }));
    } else if (name === "name" && value.trim().length <= 2) {
      setFieldErrors((p) => ({ ...p, name: "" }));
    }

    if (name === "address") {
      setFieldErrors((p) => ({
        ...p,
        address:
          value.trim().length > 0 && value.trim().length < 5
            ? "Address is too short"
            : "",
      }));
    }
  };

  /* ── Full validation before submit ── */
  const validateInputs = ({ name, phone, address, location }) => {
    const errors = { name: "", phone: "", address: "" };
    let valid = true;

    if (!name.trim()) {
      errors.name = "Please enter your full name";
      valid = false;
    } else if (!validateName(name)) {
      errors.name = "Enter a valid full name (e.g. Amara Okafor)";
      valid = false;
    }

    if (!phone.trim()) {
      errors.phone = "Please enter your phone number";
      valid = false;
    } else if (!validateNigerianPhone(phone)) {
      errors.phone = "Enter a valid Phone ";
      valid = false;
    }

    if (!address.trim()) {
      errors.address = "Please enter your delivery address";
      valid = false;
    } else if (address.trim().length < 5) {
      errors.address = "Address is too short";
      valid = false;
    }

    setFieldErrors(errors);

    if (!valid) {
      toast.error("Please fix the errors in the form");
    }

    if (valid && isLocalVendor && !location) {
      toast.error("Please select a delivery location");
      return false;
    }

    return valid;
  };

  /* ── Place order ── */
  const handlePay = async () => {
    if (loading || isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);

    const { name, phone, address, location } = deliveryDetails;

    if (!validateInputs({ name, phone, address, location })) {
      setLoading(false);
      isSubmitting.current = false;
      return;
    }

    const orderId = generateOrderId();

    if (!isLocalVendor) {
      try {
        sessionStorage.setItem(
          "chatOrder",
          JSON.stringify({
            orderId,
            cart,
            cartTotal,
            packFee,
            serviceCharge,
            customerName: name,
            customerPhone: phone,
            customerAddress: address,
            vendorId: vendor._id,
            vendorName: vendor.businessName,
          }),
        );
        toast.success("Redirecting to vendor chat...");
        router.push("/vendors/chat");
      } catch (err) {
        console.error(err);
        toast.error("Failed to open chat");
      } finally {
        setLoading(false);
        isSubmitting.current = false;
      }
      return;
    }

    const packsText = cart
      .map((pack, i) => {
        const items = pack
          .map(
            (item) =>
              `- ${item.productName} | qty: ${item.quantity} | ₦${formatCurrency(item.price * item.quantity)}`,
          )
          .join("\n");
        return `PACK ${i + 1}\n${items}`;
      })
      .join("\n\n");

    const couponLine = appliedCoupon
      ? `COUPON (${appliedCoupon.code}): -₦${formatCurrency(couponDiscount)}\n`
      : "";

    const waMessage = encodeURIComponent(
      `🍽️ CHOWSPACE ORDER\n\nORDER DETAILS\nOrder ID: ${orderId}\n\n${packsText}\n\n` +
        `SUB TOTAL: ₦${formatCurrency(cartTotal)}\nPACKING FEE: ₦${formatCurrency(packFee)}\n` +
        `DELIVERY PRICE: ₦${formatCurrency(deliveryFee)}\nSERVICE FEE: ₦${formatCurrency(serviceCharge)}\n` +
        `${couponLine}TOTAL PRICE: 💳 ₦${formatCurrency(finalTotal)}\n\n` +
        `CUSTOMER DETAILS 👤\nName: ${name}\nLocation: ${location}\nAddress: ${address}\nPhone: ${phone}\n\n` +
        `🙏 Thank you for ordering with CHOWSPACE!\n\nPRICE CONFIRMATION\n🔗 https://chowspace.ng/confirm/${orderId}\n\n` +
        `Leave a Review ✍️\n🔗 https://chowspace.ng/ReviewPage/${vendor._id}`,
    );

    window.open(
      `https://wa.me/${formatPhoneNumber(vendor.contact)}?text=${waMessage}`,
      "_blank",
    );

    try {
      await axios.post(`${BACKENDURL}/api/orders`, {
        orderId,
        vendorId: vendor._id,
        items: cartItems.map((item) => ({
          productId: item._id,
          name: item.productName,
          price: item.price,
          quantity: item.quantity,
        })),
        ...(session?.user
          ? {
              customerInfo: {
                name: session?.user?.name,
                phone: session?.user?.phone,
              },
            }
          : { guestInfo: { name, phone } }),
        deliveryMethod: isLocalVendor ? "whatsapp" : "chat",
        totalAmount: finalTotal,
        deliveryFee,
        packFees: packFee,
      });
      setPlacedOrderId(orderId);
      if (clearCart) clearCart();
    } catch (err) {
      console.error(err);
      toast.error("Order save failed, but WhatsApp was opened.");
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  /* ── Loading ── */
  if (!vendor)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#AE2108] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading checkout…</p>
        </div>
      </div>
    );

  /* ── Empty cart ── */
  if (cartItems.length === 0 && !placedOrderId)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <ShoppingCart size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Your cart is empty
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Add some items before checking out.
          </p>
          <Link
            href={`/vendor/${vendor._id}`}
            className="inline-block px-6 py-3 bg-[#AE2108] text-white rounded-xl font-semibold text-sm hover:bg-[#941B06] transition"
          >
            Back to menu
          </Link>
        </div>
      </div>
    );

  /* ── Main ── */
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <div className="max-w-5xl mx-auto px-4 py-10 sm:py-12">
        {/* Page title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Order from{" "}
            <span className="text-[#AE2108]">{vendor.businessName}</span>
          </h1>
          <p className="text-gray-500 text-sm">
            Review your items and complete checkout
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Cart packs */}
            {cart.map((pack, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-transparent border-b border-gray-100">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <Package size={18} className="text-[#AE2108]" />
                    Pack {index + 1}
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5 ml-6">
                    {pack.length} item{pack.length !== 1 ? "s" : ""} · packed
                    together
                  </p>
                </div>
                <div className="divide-y divide-gray-50">
                  {pack.map((item) => (
                    <div
                      key={item._id}
                      className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-16 h-16 relative rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">
                            {item.productName}
                          </p>
                          <p className="text-sm text-[#AE2108] font-bold mt-0.5">
                            ₦{formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => removeFromCart(item._id, index)}
                          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-red-50 hover:border-red-200 text-gray-600 font-bold transition"
                        >
                          −
                        </button>
                        <span className="font-bold w-6 text-center text-gray-900 text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(item, index)}
                          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-green-50 hover:border-green-200 text-gray-600 font-bold transition"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Birthday nudge */}
            <BirthdayNudge phone={resolvedPhone} vendorId={vendor._id} />

            {/* Who is this order for */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">
                Who is this order for?
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: "myself", label: "Myself" },
                  { value: "guest", label: "Someone else" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setOrderFor(value)}
                    className={`py-3 rounded-xl text-sm font-semibold border-2 transition ${
                      orderFor === value
                        ? "border-[#AE2108] bg-[#AE2108]/5 text-[#AE2108]"
                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery form */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <MapPin size={22} className="text-[#AE2108]" />
                Delivery Details
              </h2>
              <p className="text-sm text-gray-500 mb-6 ml-8">
                {isLocalVendor
                  ? "Pick your area and drop your address"
                  : "The vendor will reach out to arrange delivery"}
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePay();
                }}
                className="space-y-4"
              >
                {/* Name */}
                <div>
                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      name="name"
                      type="text"
                      value={deliveryDetails.name}
                      onChange={handleChange}
                      placeholder="Full name"
                      className={fieldErrors.name ? inputErrCls : inputCls}
                    />
                  </div>
                  {fieldErrors.name && (
                    <p className="text-xs text-red-500 mt-1.5 ml-1">
                      {fieldErrors.name}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <div className="relative">
                    <Phone
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      name="phone"
                      type="tel"
                      value={deliveryDetails.phone}
                      onChange={handleChange}
                      placeholder="Phone number (e.g. 08012345678)"
                      className={fieldErrors.phone ? inputErrCls : inputCls}
                    />
                  </div>
                  {fieldErrors.phone ? (
                    <p className="text-xs text-red-500 mt-1.5 ml-1">
                      {fieldErrors.phone}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1.5 ml-1"></p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <div className="relative">
                    <MapPin
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      name="address"
                      type="text"
                      value={deliveryDetails.address}
                      onChange={handleChange}
                      placeholder={
                        isLocalVendor
                          ? "Delivery address"
                          : "Your city / delivery address"
                      }
                      className={fieldErrors.address ? inputErrCls : inputCls}
                    />
                  </div>
                  {fieldErrors.address && (
                    <p className="text-xs text-red-500 mt-1.5 ml-1">
                      {fieldErrors.address}
                    </p>
                  )}
                </div>

                {/* Location dropdown — Abeokuta only */}
                {/* Location dropdown — Abeokuta only */}
                {isLocalVendor && (
                  <div className="relative">
                    {/* Remove the MapPin icon here — it blocks clicks on mobile */}
                    <Select
                      value={deliveryDetails.location}
                      onValueChange={(value) => {
                        setDeliveryDetails((p) => ({ ...p, location: value }));
                        const match = locations.find((l) => l.name === value);
                        setDeliveryFee(match?.fee || 0);
                      }}
                    >
                      <SelectTrigger className="w-full px-4 py-3.5 h-12 rounded-2xl border border-gray-200 bg-white text-sm focus:ring-2 focus:ring-[#AE2108]/15 focus:border-[#AE2108] cursor-pointer">
                        <SelectValue placeholder="Select delivery location" />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
                        {locations.map((l) => (
                          <SelectItem key={l.name} value={l.name}>
                            <div className="flex items-center justify-between gap-6 w-full">
                              <span>{l.name}</span>
                              <span className="text-[#AE2108] font-semibold">
                                ₦{formatCurrency(l.fee)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Outside Abeokuta banner */}
                {!isLocalVendor && (
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3">
                    <MessageCircle
                      size={18}
                      className="text-orange-500 flex-shrink-0 mt-0.5"
                    />
                    <div>
                      <p className="text-sm font-semibold text-orange-800">
                        Delivery arranged via chat
                      </p>
                      <p className="text-xs text-orange-600 mt-0.5 leading-relaxed">
                        This vendor is outside Abeokuta. After placing your
                        order you&apos;ll be connected with them to sort out
                        delivery cost and logistics.
                      </p>
                    </div>
                  </div>
                )}

                {/* CTA */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full mt-2 py-4 rounded-xl font-bold text-white text-base transition flex items-center justify-center gap-2 ${
                    loading
                      ? "bg-gray-300 cursor-not-allowed"
                      : isLocalVendor
                        ? "bg-[#AE2108] hover:bg-[#941B06] active:scale-[0.99]"
                        : "bg-orange-500 hover:bg-orange-600 active:scale-[0.99]"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                      Processing…
                    </>
                  ) : isLocalVendor ? (
                    "Place Order"
                  ) : (
                    <>
                      <MessageCircle size={18} /> Chat with Vendor
                    </>
                  )}
                </button>
                <p className="text-center text-xs text-gray-400 pt-1">
                  {isLocalVendor
                    ? "You'll be redirected to WhatsApp to confirm your order"
                    : "You'll be taken to a chat to arrange delivery"}
                </p>
              </form>
            </div>
          </div>

          {/* ── Right: summary ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                  <ShoppingCart size={20} className="text-[#AE2108]" />
                  Order Summary
                </h3>
                <div className="space-y-3 text-sm">
                  {[
                    ["Subtotal", `₦${formatCurrency(cartTotal)}`],
                    ["Packing Fee", `₦${formatCurrency(packFee)}`],
                    ["Service Fee", `₦${formatCurrency(serviceCharge)}`],
                    [
                      "Delivery",
                      !isLocalVendor
                        ? "TBD via chat"
                        : deliveryFee === 0
                          ? "Select location"
                          : `₦${formatCurrency(deliveryFee)}`,
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-gray-500">{label}</span>
                      <span
                        className={`font-semibold ${
                          label === "Delivery" &&
                          (!isLocalVendor || deliveryFee === 0)
                            ? "text-gray-400 italic"
                            : "text-gray-900"
                        }`}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                  {couponDiscount > 0 && appliedCoupon && (
                    <div className="flex justify-between text-green-600">
                      <span className="font-medium flex items-center gap-1.5">
                        Coupon
                        <span className="text-xs bg-green-100 text-green-800 rounded px-1.5 py-0.5 font-bold uppercase tracking-wide font-mono">
                          {appliedCoupon.code}
                        </span>
                      </span>
                      <span className="font-bold">
                        − ₦{formatCurrency(couponDiscount)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-5 pt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold text-[#AE2108]">
                      ₦
                      {formatCurrency(
                        !isLocalVendor
                          ? cartTotal + packFee + serviceCharge - couponDiscount
                          : finalTotal,
                      )}
                    </span>
                    {!isLocalVendor && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        + delivery (agreed via chat)
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Hint card */}
              {!isLocalVendor ? (
                <div className="bg-orange-50 rounded-2xl border border-orange-100 p-4">
                  <p className="text-xs text-orange-800 font-medium">
                    💬 You&apos;ll chat directly with the vendor to agree on
                    delivery cost and logistics for your location.
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 rounded-2xl border border-green-100 p-4">
                  <p className="text-xs text-green-800 font-medium">
                    💬 After placing your order, you&apos;ll be taken to
                    WhatsApp to chat with the vendor and confirm payment.
                  </p>
                </div>
              )}

              {/* Birthday sidebar */}
              <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 flex items-start gap-3">
                <Gift
                  size={15}
                  className="text-amber-500 flex-shrink-0 mt-0.5"
                />
                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                  Add your birthday above to get a surprise treat on your
                  special day!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
