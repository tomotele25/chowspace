"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import axios from "axios";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";
import { useSession } from "next-auth/react";

const CHRISTMAS = true; // enable Christmas decorations

const formatCurrency = (amount) =>
  typeof amount === "number" ? amount.toLocaleString() : "0";

const formatPhoneNumber = (number) => {
  let digits = number.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "234" + digits.slice(1);
  return digits;
};

const generateOrderId = () => {
  return `CS-${Math.floor(100000 + Math.random() * 900000)}-${Math.random()
    .toString(36)
    .substring(2, 5)
    .toUpperCase()}`;
};

const Checkout = () => {
  const router = useRouter();
  const { slug } = router.query;
  const { data: session } = useSession();
  const BACKENDURL = "https://chowspace-backend.vercel.app";

  const { cart, addToCart, removeFromCart } = useCart();
  const isSubmitting = useRef(false);

  const [vendor, setVendor] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);

  const [orderFor, setOrderFor] = useState("myself");

  const [deliveryDetails, setDeliveryDetails] = useState({
    name: "",
    phone: "",
    address: "",
    location: "",
    email: "",
  });
  const [deliveryFee, setDeliveryFee] = useState(0);

  const cartItems = cart.flat();
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
    0
  );
  const packFee = cart.length * 300;
  const serviceCharge = 60;
  const finalTotal = cartTotal + deliveryFee + packFee + serviceCharge;

  useEffect(() => {
    if (session?.user && orderFor === "myself") {
      setDeliveryDetails((prev) => ({
        ...prev,
        name: session.user.fullname || "",
        email: session.user.email || "",
      }));
    }
  }, [session, orderFor]);

  useEffect(() => {
    if (!slug) return;
    const fetchVendorAndLocations = async () => {
      try {
        const vendorRes = await axios.get(`${BACKENDURL}/api/vendor/${slug}`);
        const vendorData = vendorRes.data.vendor;
        setVendor(vendorData);

        const locRes = await axios.get(
          `${BACKENDURL}/api/locations/${vendorData._id}`
        );
        setLocations(
          (locRes.data.locations || []).map((loc) => ({
            name: loc.location,
            fee: loc.price,
          }))
        );
      } catch (err) {
        console.error(err);
        toast.error("Could not load vendor or locations");
      }
    };
    fetchVendorAndLocations();
  }, [slug]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDeliveryDetails((prev) => ({ ...prev, [name]: value }));

    if (name === "location") {
      const found = locations.find((loc) => loc.name === value);
      setDeliveryFee(found?.fee || 0);
    }
  };

  const handlePay = async () => {
    if (loading || isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);

    const { name, phone, address, location, email } = deliveryDetails;
    if (!name || !phone || !address || !location) {
      toast.error("Fill in all delivery details");
      setLoading(false);
      isSubmitting.current = false;
      return;
    }
    if (!vendor?._id) {
      toast.error("Vendor not loaded.");
      setLoading(false);
      isSubmitting.current = false;
      return;
    }

    const orderId = generateOrderId();
    const txRef = `chowspace-${Date.now()}`;
    const guestEmail =
      session?.user?.email || email || `guest${Date.now()}@chowspace.com`;

    const orderPayload = {
      orderId,
      vendorId: vendor._id,
      items: cartItems.map((item) => ({
        menuItemId: item._id,
        name: item.productName,
        quantity: item.quantity,
        price: item.price,
        logo: item.image,
      })),
      deliveryMethod: "delivery",
      note: "",
      totalAmount: finalTotal,
      packFees: cart.map(() => 300),
      deliveryFee,
      serviceCharge,
      paymentRef: txRef,
      paymentMethod: "direct",
      paymentStatus: "pending",
    };

    if (orderFor === "myself" && session?.user?.id) {
      orderPayload.customerId = session.user.id;
      orderPayload.customerInfo = {
        fullname: session.user.fullname,
        email: session.user.email,
        phone,
        address,
      };
    } else {
      orderPayload.guestInfo = { name, email: guestEmail, phone, address };
    }

    const generateWhatsAppMessage = () => {
      let message = `*🍽️ CHOWSPACE ORDER*\n\n*ORDER DETAILS*\n*Order ID*: ${orderId}\n`;
      cart.forEach((pack, packIndex) => {
        message += `\n*PACK ${packIndex + 1}*\n`;
        pack.forEach(
          (item) =>
            (message += `- ${item.productName} | qty: ${item.quantity}\n`)
        );
      });
      message += `\n*SUB TOTAL*: ₦${formatCurrency(cartTotal)}\n`;
      message += `*PACKING FEE*: ₦${formatCurrency(packFee)}\n`;
      message += `*DELIVERY PRICE*: ₦${formatCurrency(deliveryFee)}\n`;
      message += `*SERVICE FEE*: ₦${formatCurrency(serviceCharge)}\n`;
      message += `*TOTAL PRICE*: 💳 ₦${formatCurrency(finalTotal)}\n`;
      message += `\n*CUSTOMER DETAILS* 👤\nName: ${name}\nLocation: ${location}\nAddress: ${address}\nPhone: ${phone}\n`;
      message += `\n🙏 *Thank you for ordering with CHOWSPACE!*`;
      message += `\n\n*PRICE CONFIRMATION*\n🔗 https://chowspace.ng/confirm/${orderId}`;
      message += `\n\n*Leave a Review* ✍️\n🔗 https://chowspace.ng/ReviewPage/${vendor._id}`;
      return encodeURIComponent(message);
    };

    try {
      await axios.post(`${BACKENDURL}/api/orders`, orderPayload);
      const waLink = `https://wa.me/${formatPhoneNumber(
        vendor.contact
      )}?text=${generateWhatsAppMessage()}`;
      window.location.href = waLink;
    } catch (err) {
      console.error(err);
      toast.error("Could not process order");
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  if (!vendor)
    return (
      <p className="text-center py-20 text-gray-700 font-semibold text-lg">
        Loading vendor info...
      </p>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 relative">
      <Toaster position="top-right" reverseOrder={false} />

      {/* 🎄 Christmas Rope Lights */}
      {CHRISTMAS && (
        <svg
          className="absolute top-0 left-0 w-full h-12 z-20"
          viewBox="0 0 300 50"
          preserveAspectRatio="none"
        >
          <path
            d="M0 25 Q 50 0, 100 25 T 300 25"
            fill="none"
            stroke="#333"
            strokeWidth="2"
          />
          {[...Array(7)].map((_, i) => (
            <circle
              key={i}
              cx={i * 50 + 25}
              cy={25 + Math.sin(i) * 5}
              r="4"
              className={`bulb bulb-${i % 4}`}
            />
          ))}
        </svg>
      )}

      {/* Subtle falling snow */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {[...Array(50)].map((_, i) => (
          <span
            key={i}
            className="absolute text-white text-xs animate-fall"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random(),
            }}
          >
            ❄
          </span>
        ))}
      </div>

      <h1 className="text-3xl font-extrabold mb-8 text-gray-900 text-center sm:text-left relative z-10">
        Checkout from{" "}
        <span className="text-[#AE2108]">{vendor.businessName}</span>
      </h1>

      {/* Cart Items */}
      {cart.length === 0 || cart.every((pack) => pack.length === 0) ? (
        <p className="text-center text-gray-500 py-10 text-lg relative z-10">
          Your cart is empty.
        </p>
      ) : (
        cart.map((pack, packIndex) => (
          <div
            key={packIndex}
            className="mb-10 bg-white rounded-lg shadow-lg p-5 relative z-10"
          >
            <h2 className="font-semibold text-xl mb-5 text-[#AE2108]">
              Pack {packIndex + 1}
            </h2>
            <div className="space-y-4">
              {pack.map((item, itemIndex) => (
                <div
                  key={`${item._id}-${itemIndex}`}
                  className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 bg-gray-50 p-4 rounded-lg shadow-sm"
                >
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="w-20 h-20 relative rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                      <Image
                        loading="lazy"
                        src={
                          item.image?.startsWith("http")
                            ? item.image
                            : `${BACKENDURL}/uploads/${item.image}`
                        }
                        alt={item.productName}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {item.productName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        ₦{formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    <button
                      onClick={() => removeFromCart(item._id, packIndex)}
                      className="px-4 py-1 rounded-full bg-gray-200 hover:bg-gray-300 transition"
                    >
                      –
                    </button>
                    <span className="font-semibold text-lg">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => addToCart(item, packIndex)}
                      className="px-4 py-1 rounded-full bg-gray-200 hover:bg-gray-300 transition"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {/* Delivery Details */}
      <section className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto relative z-10">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Delivery Details
        </h2>

        <div className="flex justify-center mb-6 gap-4 relative z-10">
          <button
            onClick={() => setOrderFor("myself")}
            className={`px-8 py-2 rounded-t-lg font-semibold transition border-b-4 ${
              orderFor === "myself"
                ? "border-[#AE2108] bg-red-50 text-[#AE2108]"
                : "border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            For Myself
          </button>
          <button
            onClick={() => setOrderFor("friend")}
            className={`px-8 py-2 rounded-t-lg font-semibold transition border-b-4 ${
              orderFor === "friend"
                ? "border-[#AE2108] bg-red-50 text-[#AE2108]"
                : "border-transparent bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            For a Friend
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePay();
          }}
          className="space-y-6"
        >
          {["name", "phone", "address", "email"].map((field) => {
            if (orderFor === "myself" && session?.user && field === "email")
              return null;
            return (
              <div key={field}>
                <label
                  htmlFor={field}
                  className="block text-sm font-medium text-gray-700 capitalize mb-1"
                >
                  {field.replace(/^\w/, (c) => c.toUpperCase())}
                  {field === "email" && (
                    <span className="text-gray-400 text-sm"> (optional)</span>
                  )}
                </label>
                <input
                  id={field}
                  type={
                    field === "phone"
                      ? "tel"
                      : field === "email"
                      ? "email"
                      : "text"
                  }
                  name={field}
                  value={deliveryDetails[field]}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#AE2108] focus:border-[#AE2108] transition"
                  placeholder={`Enter ${field}${
                    orderFor === "friend" ? " of your friend" : ""
                  }`}
                  required={field !== "email"}
                />
              </div>
            );
          })}

          <div>
            <label
              htmlFor="location"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Location
            </label>
            <select
              id="location"
              name="location"
              value={deliveryDetails.location}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#AE2108] focus:border-[#AE2108] transition"
              required
            >
              <option value="">Select location</option>
              {locations.map((loc) => (
                <option key={loc.name} value={loc.name}>
                  {loc.name} - ₦{formatCurrency(loc.fee)}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-8 border-t pt-6 space-y-3 text-gray-700 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₦{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Packing Fee (₦300 × {cart.length})</span>
              <span>₦{formatCurrency(packFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>₦{formatCurrency(deliveryFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Fee</span>
              <span>₦{formatCurrency(serviceCharge)}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold pt-4 border-t mt-3">
              <span>Total:</span>
              <span>₦{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`mt-8 w-full font-bold py-3 rounded-full shadow-lg text-lg transition ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-500 hover:bg-green-600 text-white"
            }`}
          >
            {loading ? "Processing..." : "Pay via WhatsApp"}
          </button>
        </form>
      </section>

      {/* ❄️ Animations */}
      <style jsx>{`
        @keyframes fall {
          0% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(100vh);
          }
        }
        .animate-fall {
          animation: fall linear infinite;
        }

        /* Christmas bulbs animation */
        .bulb {
          animation: glow 2.5s infinite alternate;
          filter: drop-shadow(0 0 6px currentColor);
        }
        .bulb-0 {
          fill: #facc15;
        }
        .bulb-1 {
          fill: #22c55e;
        }
        .bulb-2 {
          fill: #ef4444;
        }
        .bulb-3 {
          fill: #3b82f6;
        }
        @keyframes glow {
          0% {
            opacity: 0.4;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default Checkout;
