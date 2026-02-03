"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";
import { useSession } from "next-auth/react";
import Link from "next/link";
const formatCurrency = (amount) =>
  typeof amount === "number" ? amount.toLocaleString() : "0";

const formatPhoneNumber = (number) => {
  let digits = number.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "234" + digits.slice(1);
  return digits;
};

const generateOrderId = () =>
  `CS-${Math.floor(100000 + Math.random() * 900000)}`;

export default function Checkout() {
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
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const packFee = cart.length * 300;
  const serviceCharge = 60;
  const finalTotal = cartTotal + deliveryFee + packFee + serviceCharge;

  /* Autofill */
  useEffect(() => {
    if (session?.user && orderFor === "myself") {
      setDeliveryDetails((prev) => ({
        ...prev,
        name: session.user.fullname || "",
        email: session.user.email || "",
      }));
    }
  }, [session, orderFor]);

  /* Load vendor */
  useEffect(() => {
    if (!slug) return;

    const loadData = async () => {
      try {
        const vendorRes = await axios.get(`${BACKENDURL}/api/vendor/${slug}`);
        setVendor(vendorRes.data.vendor);

        const locRes = await axios.get(
          `${BACKENDURL}/api/locations/${vendorRes.data.vendor._id}`,
        );

        setLocations(
          (locRes.data.locations || []).map((l) => ({
            name: l.location,
            fee: l.price,
          })),
        );
      } catch {
        toast.error("Failed to load vendor");
      }
    };

    loadData();
  }, [slug]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDeliveryDetails((prev) => ({ ...prev, [name]: value }));

    if (name === "location") {
      const match = locations.find((l) => l.name === value);
      setDeliveryFee(match?.fee || 0);
    }
  };

  const handlePay = async () => {
    if (loading || isSubmitting.current) return;
    isSubmitting.current = true;
    setLoading(true);

    const { name, phone, address, location, email } = deliveryDetails;

    if (!name || !phone || !address || !location) {
      toast.error("Please complete delivery details");
      setLoading(false);
      isSubmitting.current = false;
      return;
    }

    const orderId = generateOrderId();

    // Construct payload for backend
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
      note: "", // you can add a note input if you want
      totalAmount: finalTotal,
      packFees: packFee,
      deliveryFee: deliveryFee,
      // you already have orderId above
    };

    const message = encodeURIComponent(
      `🍽️ *CHOWSPACE ORDER*
Order ID: ${orderId}

Subtotal: ₦${formatCurrency(cartTotal)}
Packing Fee: ₦${formatCurrency(packFee)}
Delivery: ₦${formatCurrency(deliveryFee)}
Service Fee: ₦${formatCurrency(serviceCharge)}

TOTAL: ₦${formatCurrency(finalTotal)}

Customer:
${name}
${phone}
${address}`,
    );

    try {
      await axios.post(`${BACKENDURL}/api/orders`, payload);

      // Redirect to WhatsApp
      window.location.href = `https://wa.me/${formatPhoneNumber(
        vendor.contact,
      )}?text=${message}`;
    } catch (err) {
      console.error(err);
      toast.error("Order failed");
    } finally {
      setLoading(false);
      isSubmitting.current = false;
    }
  };

  if (!vendor)
    return (
      <p className="text-center py-20 font-semibold text-gray-600">
        Loading checkout…
      </p>
    );

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <Toaster position="top-right" />

      {/* Progress */}
      <div className="flex justify-center mb-10">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
          <span className="w-3 h-3 bg-green-500 rounded-full" />
          Cart
          <span className="w-8 h-px bg-gray-300" />
          <span className="w-3 h-3 bg-[#AE2108] rounded-full" />
          Checkout
        </div>
      </div>

      <h1 className="text-3xl font-extrabold mb-10">
        Checkout from{" "}
        <span className="text-[#AE2108]">{vendor.businessName}</span>
      </h1>

      {/* Cart */}
      {cart.map((pack, index) => (
        <div key={index} className="bg-white rounded-2xl border p-6 mb-8">
          <h2 className="font-bold text-lg mb-1">Pack {index + 1}</h2>
          <p className="text-xs text-gray-500 mb-4">Items ordered together</p>

          {pack.map((item) => (
            <div
              key={item._id}
              className="flex justify-between items-center py-4 border-b last:border-none"
            >
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 relative rounded-xl overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.productName}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="font-semibold">{item.productName}</p>
                  <p className="text-sm text-gray-500">
                    ₦{formatCurrency(item.price)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => removeFromCart(item._id, index)}
                  className="w-8 h-8 rounded-full bg-gray-200"
                >
                  –
                </button>
                <span className="font-semibold">{item.quantity}</span>
                <button
                  onClick={() => addToCart(item, index)}
                  className="w-8 h-8 rounded-full bg-gray-200"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Delivery */}
      <section className="bg-white rounded-2xl border p-8">
        <h2 className="text-xl font-bold mb-6">Delivery details</h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePay();
          }}
          className="grid gap-5"
        >
          {["name", "phone", "address", "email"].map((field) => (
            <input
              key={field}
              name={field}
              value={deliveryDetails[field]}
              onChange={handleChange}
              placeholder={field.toUpperCase()}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 focus:ring-2 focus:ring-[#AE2108]/40"
            />
          ))}

          <select
            name="location"
            value={deliveryDetails.location}
            onChange={handleChange}
            className="rounded-xl border border-gray-200 px-4 py-3"
          >
            <option value="">Select location</option>
            {locations.map((l) => (
              <option key={l.name} value={l.name}>
                {l.name} – ₦{formatCurrency(l.fee)}
              </option>
            ))}
          </select>

          {/* Summary */}
          <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₦{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Packing</span>
              <span>₦{formatCurrency(packFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>₦{formatCurrency(deliveryFee)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-lg pt-4 border-t">
              <span>Total</span>
              <span className="text-[#AE2108]">
                ₦{formatCurrency(finalTotal)}
              </span>
            </div>
          </div>

          {/* <Link href="/chat">click this </Link> */}

          <button
            disabled={loading}
            className={`mt-6 w-full py-4 rounded-2xl font-extrabold text-lg shadow-lg transition ${
              loading
                ? "bg-gray-400"
                : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:scale-[1.02]"
            }`}
          >
            {loading ? "Processing…" : "Pay via WhatsApp"}
          </button>

          <p className="text-center text-xs text-gray-500">
            You’ll confirm the order directly with the vendor on WhatsApp.
          </p>
        </form>
      </section>
    </div>
  );
}
