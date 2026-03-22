// pages/checkout/[slug].js

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
  Mail,
  MapPin,
  Package,
  ShoppingCart,
  Users,
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
  let d = number.replace(/\D/g, "");
  if (d.startsWith("0")) d = "234" + d.slice(1);
  return d;
};

const generateOrderId = () =>
  `CS-${Math.floor(100000 + Math.random() * 900000)}`;

const BACKENDURL =
  "https://chowspace-backend.vercel.app"

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
  const [packingFeePerPack, setPackingFeePerPack] = useState(300); // fallback default

  const [deliveryDetails, setDeliveryDetails] = useState({
    name: "",
    phone: "",
    address: "",
    location: "",
    email: "",
  });

  /* ── Derived totals ── */
  const cartItems = cart.flat();
  const cartTotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const packFee = cart.length * packingFeePerPack; // ✅ dynamic from vendor
  const serviceCharge = 60;
  const finalTotal = cartTotal + deliveryFee + packFee + serviceCharge;

  /* ── Autofill from session ── */
  useEffect(() => {
    if (session?.user && orderFor === "myself") {
      setDeliveryDetails((p) => ({
        ...p,
        name: session.user.fullname || "",
        email: session.user.email || "",
      }));
    }
    if (orderFor === "guest") {
      setDeliveryDetails((p) => ({ ...p, name: "", email: "" }));
    }
  }, [session, orderFor]);

  /* ── Load vendor + locations ── */
  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        // 1. Fetch vendor
        const vr = await axios.get(`${BACKENDURL}/api/vendor/${slug}`);
        setVendor(vr.data.vendor);

        // 2. ✅ Read packingFee directly from vendor — no extra API call needed
        if (typeof vr.data.vendor.packingFee === "number") {
          setPackingFeePerPack(vr.data.vendor.packingFee);
        }

        // 3. Fetch delivery locations
        const lr = await axios.get(
          `${BACKENDURL}/api/locations/${vr.data.vendor._id}`,
        );
        setLocations(
          (lr.data.locations || []).map((l) => ({
            name: l.location,
            fee: l.price,
          })),
        );
      } catch {
        toast.error("Failed to load vendor");
      }
    })();
  }, [slug]);

  /* ── Form change ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDeliveryDetails((p) => ({ ...p, [name]: value }));
    if (name === "location") {
      const match = locations.find((l) => l.name === value);
      setDeliveryFee(match?.fee || 0);
    }
  };

  /* ── Place order ── */
  const handlePay = async () => {
    if (loading || isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);

    const { name, phone, address, location, email } = deliveryDetails;

    if (!name || !phone || !address || !location) {
      toast.error("Please complete all delivery details");
      setLoading(false);
      isSubmitting.current = false;
      return;
    }

    const orderId = generateOrderId();

    const packsText = cart
      .map((pack, i) => {
        const items = pack
          .map((item) => `- ${item.productName} | qty: ${item.quantity}`)
          .join("\n");
        return `PACK ${i + 1}\n${items}`;
      })
      .join("\n\n");

    const waMessage = encodeURIComponent(
      `🍽️ CHOWSPACE ORDER\n\nORDER DETAILS\nOrder ID: ${orderId}\n\n${packsText}\n\n` +
        `SUB TOTAL: ₦${formatCurrency(cartTotal)}\nPACKING FEE: ₦${formatCurrency(packFee)}\n` +
        `DELIVERY PRICE: ₦${formatCurrency(deliveryFee)}\nSERVICE FEE: ₦${formatCurrency(serviceCharge)}\n` +
        `TOTAL PRICE: 💳 ₦${formatCurrency(finalTotal)}\n\n` +
        `CUSTOMER DETAILS 👤\nName: ${name}\nLocation: ${location}\nAddress: ${address}\nPhone: ${phone}\n\n` +
        `🙏 Thank you for ordering with CHOWSPACE!\n\n` +
        `PRICE CONFIRMATION\n🔗 https://chowspace.ng/confirm/${orderId}\n\n` +
        `Leave a Review ✍️\n🔗 https://chowspace.ng/ReviewPage/${vendor._id}`,
    );

    // ✅ Open WhatsApp FIRST — still within the user gesture
    window.open(
      `https://wa.me/${formatPhoneNumber(vendor.contact)}?text=${waMessage}`,
      "_blank",
    );

    // ✅ Then save the order in the background
    const payload = {
      orderId,
      vendorId: vendor._id,
      items: cartItems.map((item) => ({
        productId: item._id,
        name: item.productName,
        price: item.price,
        quantity: item.quantity,
      })),
      guestInfo: orderFor === "guest" ? { name, phone, email } : null,
      customerInfo: orderFor === "myself" ? { name, phone, email } : null,
      deliveryMethod: "whatsapp",
      note: "",
      totalAmount: finalTotal,
      packFees: packFee,
      deliveryFee,
    };

    try {
      await axios.post(`${BACKENDURL}/api/orders`, payload);
      setPlacedOrderId(orderId);
      if (clearCart) clearCart();
    } catch (err) {
      console.error(err);
      toast.error("Order saved failed, but WhatsApp was opened.");
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  /* ─── LOADING ────────────────────────────────────────────── */
  if (!vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#AE2108] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading checkout…</p>
        </div>
      </div>
    );
  }

  /* ─── EMPTY CART ─────────────────────────────────────────── */
  if (cartItems.length === 0 && !placedOrderId) {
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
            href={`/vendor/${slug}`}
            className="inline-block px-6 py-3 bg-[#AE2108] text-white rounded-xl font-semibold text-sm hover:bg-[#941B06] transition"
          >
            Back to menu
          </Link>
        </div>
      </div>
    );
  }

  /* ─── MAIN CHECKOUT ──────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order from{" "}
            <span className="text-[#AE2108]">{vendor.businessName}</span>
          </h1>
          <p className="text-gray-500">
            Review your items and complete checkout
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left ── */}
          <div className="lg:col-span-2 space-y-6">
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
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 relative rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          <Image
                            src={item.image}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">
                            {item.productName}
                          </p>
                          <p className="text-sm text-[#AE2108] font-bold mt-0.5">
                            ₦{formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
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

            {/* Order for toggle */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={18} className="text-[#AE2108]" />
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
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin size={22} className="text-[#AE2108]" />
                Delivery Details
              </h2>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handlePay();
                }}
                className="space-y-4"
              >
                {[
                  {
                    field: "name",
                    icon: User,
                    placeholder: "Full name",
                    type: "text",
                  },
                  {
                    field: "phone",
                    icon: Phone,
                    placeholder: "Phone number",
                    type: "tel",
                  },
                  {
                    field: "email",
                    icon: Mail,
                    placeholder: "Email address (optional)",
                    type: "email",
                  },
                  {
                    field: "address",
                    icon: MapPin,
                    placeholder: "Delivery address",
                    type: "text",
                  },
                ].map(({ field, icon: Icon, placeholder, type }) => (
                  <div key={field} className="relative">
                    <Icon
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                    <input
                      name={field}
                      type={type}
                      value={deliveryDetails[field]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108] outline-none text-sm transition bg-gray-50 focus:bg-white"
                    />
                  </div>
                ))}

                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                  />
                  <Select
                    value={deliveryDetails.location}
                    onValueChange={(value) => {
                      setDeliveryDetails((p) => ({ ...p, location: value }));
                      const match = locations.find((l) => l.name === value);
                      setDeliveryFee(match?.fee || 0);
                    }}
                  >
                    <SelectTrigger className="w-full pl-10 py-3 h-auto rounded-xl border border-gray-200 bg-gray-50 text-sm focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108]">
                      <SelectValue placeholder="Select delivery location" />
                    </SelectTrigger>
                    <SelectContent>
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

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full mt-4 py-4 rounded-xl font-bold text-white text-base transition flex items-center justify-center gap-2 ${
                    loading
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-[#AE2108] hover:bg-[#941B06] active:scale-[0.99]"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : (
                    "Place Order"
                  )}
                </button>
                <p className="text-center text-xs text-gray-400 pt-1">
                  You&apos;ll be redirected to WhatsApp to confirm your order
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
                      deliveryFee === 0
                        ? "Select location"
                        : `₦${formatCurrency(deliveryFee)}`,
                    ],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between">
                      <span className="text-gray-500">{label}</span>
                      <span
                        className={`font-semibold ${
                          label === "Delivery" && deliveryFee === 0
                            ? "text-gray-400"
                            : "text-gray-900"
                        }`}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-4 border-t-2 border-dashed border-gray-100 flex justify-between items-center">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-extrabold text-[#AE2108]">
                    ₦{formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              {/* WhatsApp CTA hint */}
              <div className="bg-green-50 rounded-2xl border border-green-100 p-4">
                <p className="text-xs text-green-800 font-medium">
                  💬 After placing your order, you&apos;ll be taken to WhatsApp
                  to chat with the vendor and confirm payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
