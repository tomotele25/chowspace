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
  Ticket,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
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

// Check vendor location from the backend response
const isAbeokutaVendor = (vendor) =>
  vendor?.location?.toLowerCase().trim() === "abeokuta";

const BACKENDURL = "https://chowspace-backend.vercel.app";

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

  /* ── Coupon state ── */
  const [couponCode, setCouponCode] = useState("");
  const [couponStatus, setCouponStatus] = useState("idle");
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

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
  const packFee = cart.length * packingFeePerPack;
  const serviceCharge = 60;
  const finalTotal =
    cartTotal + deliveryFee + packFee + serviceCharge - couponDiscount;

  /* ── Derived: is this an Abeokuta vendor? (set after vendor loads) ── */
  const isLocalVendor = isAbeokutaVendor(vendor);

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
        const vr = await axios.get(`${BACKENDURL}/api/vendor/${slug}`);
        const vendorData = vr.data.vendor;
        setVendor(vendorData);

        if (typeof vendorData.packingFee === "number") {
          setPackingFeePerPack(vendorData.packingFee);
        }

        // Only fetch delivery locations for Abeokuta vendors (local delivery)
        if (vendorData?.location?.toLowerCase().trim() === "abeokuta") {
          const lr = await axios.get(
            `${BACKENDURL}/api/locations/${vendorData._id}`,
          );
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

  /* ── Form change ── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setDeliveryDetails((p) => ({ ...p, [name]: value }));
    if (name === "location") {
      const match = locations.find((l) => l.name === value);
      setDeliveryFee(match?.fee || 0);
    }
  };

  /* ── Apply coupon ── */
  const applyCoupon = async () => {
    if (!couponCode.trim() || couponStatus === "applied") return;
    setCouponStatus("loading");
    try {
      const { data } = await axios.post(`${BACKENDURL}/api/coupons/validate`, {
        code: couponCode.trim().toUpperCase(),
        vendorId: vendor._id,
        orderTotal: cartTotal,
      });

      const discount =
        data.coupon.type === "percent"
          ? Math.floor((cartTotal * data.coupon.value) / 100)
          : data.coupon.value;

      setCouponDiscount(discount);
      setAppliedCoupon(data.coupon);
      setCouponStatus("applied");
      toast.success(`Coupon applied! You saved ₦${formatCurrency(discount)}`);
    } catch (err) {
      setCouponStatus("error");
      toast.error(err?.response?.data?.message || "Invalid or expired coupon");
    }
  };

  /* ── Remove coupon ── */
  const removeCoupon = () => {
    setCouponCode("");
    setCouponDiscount(0);
    setAppliedCoupon(null);
    setCouponStatus("idle");
  };

  /* ── Place order ── */
  const handlePay = async () => {
    if (loading || isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);

    const { name, phone, address, location, email } = deliveryDetails;

    if (!name || !phone || !address) {
      toast.error("Please complete all delivery details");
      setLoading(false);
      isSubmitting.current = false;
      return;
    }

    const orderId = generateOrderId();

    /* ── Outside Abeokuta → redirect to vendor chat ── */
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
            customerEmail: email,
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

    /* ── Abeokuta vendor → WhatsApp route ── */
    if (!location) {
      toast.error("Please select a delivery location");
      setLoading(false);
      isSubmitting.current = false;
      return;
    }

    const packsText = cart
      .map((pack, i) => {
        const items = pack
          .map(
            (item) =>
              `- ${item.productName} | qty: ${item.quantity} | ₦${formatCurrency(item.price)}`,
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
        `SUB TOTAL: ₦${formatCurrency(cartTotal)}\n` +
        `PACKING FEE: ₦${formatCurrency(packFee)}\n` +
        `DELIVERY PRICE: ₦${formatCurrency(deliveryFee)}\n` +
        `SERVICE FEE: ₦${formatCurrency(serviceCharge)}\n` +
        `${couponLine}` +
        `TOTAL PRICE: 💳 ₦${formatCurrency(finalTotal)}\n\n` +
        `CUSTOMER DETAILS 👤\n` +
        `Name: ${name}\nLocation: ${location}\nAddress: ${address}\nPhone: ${phone}\n\n` +
        `🙏 Thank you for ordering with CHOWSPACE!`,
    );

    // Open WhatsApp first (must be within user gesture)
    window.open(
      `https://wa.me/${formatPhoneNumber(vendor.contact)}?text=${waMessage}`,
      "_blank",
    );

    // Save order in background
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
        customerInfo: { name, phone, email },
        totalAmount: finalTotal,
        deliveryFee,
        packFees: packFee,
        coupon: appliedCoupon
          ? { code: appliedCoupon.code, discount: couponDiscount }
          : null,
      });

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

  /* ─── LOADING ─────────────────────────────────────────────── */
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

  /* ─── EMPTY CART ──────────────────────────────────────────── */
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
            href={`/vendor/${vendor._id}`}
            className="inline-block px-6 py-3 bg-[#AE2108] text-white rounded-xl font-semibold text-sm hover:bg-[#941B06] transition"
          >
            Back to menu
          </Link>
        </div>
      </div>
    );
  }

  /* ─── MAIN CHECKOUT ───────────────────────────────────────── */
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

            {/* ── Coupon card (local/Abeokuta orders only) ── */}
            {/* {isLocalVendor && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Ticket size={18} className="text-[#AE2108]" />
                  Have a coupon?
                </h2>

                {couponStatus === "applied" && appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle2
                        size={18}
                        className="text-green-600 mt-0.5 flex-shrink-0"
                      />
                      <div>
                        <p className="text-sm font-bold text-green-800 tracking-widest uppercase font-mono">
                          {appliedCoupon.code}
                        </p>
                        <p className="text-xs text-green-600 mt-0.5">
                          {appliedCoupon.type === "percent"
                            ? `${appliedCoupon.value}% off`
                            : `₦${formatCurrency(appliedCoupon.value)} off`}{" "}
                          — you save{" "}
                          <span className="font-bold">
                            ₦{formatCurrency(couponDiscount)}
                          </span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold underline underline-offset-2 transition ml-4 flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => {
                          setCouponCode(e.target.value.toUpperCase());
                          if (couponStatus === "error") setCouponStatus("idle");
                        }}
                        onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                        placeholder="Enter coupon code"
                        maxLength={20}
                        className={`flex-1 px-4 py-3 rounded-xl border text-sm tracking-widest font-mono outline-none transition bg-gray-50 focus:bg-white uppercase placeholder:normal-case placeholder:font-sans placeholder:tracking-normal ${
                          couponStatus === "error"
                            ? "border-red-400 focus:ring-2 focus:ring-red-100"
                            : "border-gray-200 focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108]"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={
                          couponStatus === "loading" || !couponCode.trim()
                        }
                        className={`px-5 py-3 rounded-xl font-bold text-sm transition whitespace-nowrap flex items-center justify-center min-w-[80px] ${
                          couponStatus === "loading" || !couponCode.trim()
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-[#AE2108] text-white hover:bg-[#941B06] active:scale-[0.98]"
                        }`}
                      >
                        {couponStatus === "loading" ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </button>
                    </div>
                    {couponStatus === "error" && (
                      <p className="text-xs text-red-500 mt-2 flex items-center gap-1.5 pl-1">
                        <AlertCircle size={13} />
                        Invalid or expired coupon code.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )} */}

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
                    placeholder: isLocalVendor
                      ? "Delivery address"
                      : "Your city / delivery address",
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

                {/* Location dropdown — Abeokuta vendors only */}
                {isLocalVendor && (
                  <div className="relative">
                    <MapPin
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10"
                    />
                    <Select
                      value={deliveryDetails.location}
                      onValueChange={(value) => {
                        setDeliveryDetails((p) => ({
                          ...p,
                          location: value,
                        }));
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
                )}

                {/* Outside vendor info banner */}
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

                {/* CTA button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full mt-4 py-4 rounded-xl font-bold text-white text-base transition flex items-center justify-center gap-2 ${
                    loading
                      ? "bg-gray-300 cursor-not-allowed"
                      : isLocalVendor
                        ? "bg-[#AE2108] hover:bg-[#941B06] active:scale-[0.99]"
                        : "bg-orange-500 hover:bg-orange-600 active:scale-[0.99]"
                  }`}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Processing…
                    </>
                  ) : isLocalVendor ? (
                    "Place Order"
                  ) : (
                    <>
                      <MessageCircle size={18} />
                      Chat with Vendor
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

                  {/* Coupon discount row */}
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

              {/* Hint */}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
