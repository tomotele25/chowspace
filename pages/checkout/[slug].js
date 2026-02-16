"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import axios from "axios";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/router";
import toast, { Toaster } from "react-hot-toast";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { User, Phone, Mail, MapPin, Package, ShoppingCart } from "lucide-react";

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

    const packsText = cart
      .map((pack, index) => {
        const itemsText = pack
          .map((item) => `- ${item.productName} | qty: ${item.quantity}`)
          .join("\n");
        return `PACK ${index + 1}\n${itemsText}`;
      })
      .join("\n\n");

    const message = encodeURIComponent(
      `🍽️ CHOWSPACE ORDER

ORDER DETAILS
Order ID: ${orderId}

${packsText}

SUB TOTAL: ₦${formatCurrency(cartTotal)}
PACKING FEE: ₦${formatCurrency(packFee)}
DELIVERY PRICE: ₦${formatCurrency(deliveryFee)}
SERVICE FEE: ₦${formatCurrency(serviceCharge)}
TOTAL PRICE: 💳 ₦${formatCurrency(finalTotal)}

CUSTOMER DETAILS 👤
Name: ${name}
Location: ${location}
Address: ${address}
Phone: ${phone}

🙏 Thank you for ordering with CHOWSPACE!

PRICE CONFIRMATION
🔗 https://chowspace.ng/confirm/${orderId}

Leave a Review ✍️
🔗 https://chowspace.ng/ReviewPage/${vendor._id}`,
    );

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
      deliveryFee: deliveryFee,
    };

    try {
      await axios.post(`${BACKENDURL}/api/orders`, payload);

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
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order from{" "}
            <span className="text-[#AE2108]">{vendor.businessName}</span>
          </h1>
          <p className="text-gray-600">
            Review your items and complete checkout
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cart Items */}
            {cart.map((pack, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-transparent border-b border-gray-100">
                  <h2 className="font-bold text-gray-900 flex items-center gap-2">
                    <Package size={18} className="text-[#AE2108]" />
                    Pack {index + 1}
                  </h2>
                  <p className="text-xs text-gray-500 mt-1 ml-6">
                    {pack.length} item{pack.length !== 1 ? "s" : ""} ordered
                    together
                  </p>
                </div>

                <div className="divide-y">
                  {pack.map((item) => (
                    <div
                      key={item._id}
                      className="px-6 py-4 flex justify-between items-center hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 relative rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
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
                          <p className="text-sm text-[#AE2108] font-medium mt-1">
                            ₦{formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => removeFromCart(item._id, index)}
                          className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-red-50 hover:border-red-300 text-gray-600 font-semibold text-lg"
                        >
                          −
                        </button>
                        <span className="font-semibold w-6 text-center text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => addToCart(item, index)}
                          className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-green-50 hover:border-green-300 text-gray-600 font-semibold text-lg"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Delivery Form */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin size={24} className="text-[#AE2108]" />
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
                  { field: "name", icon: User, placeholder: "Full name" },
                  { field: "phone", icon: Phone, placeholder: "Phone number" },
                  { field: "email", icon: Mail, placeholder: "Email address" },
                  {
                    field: "address",
                    icon: MapPin,
                    placeholder: "Delivery address",
                  },
                ].map(({ field, icon: Icon, placeholder }) => (
                  <div key={field} className="relative">
                    <Icon
                      size={18}
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    />
                    <input
                      name={field}
                      value={deliveryDetails[field]}
                      onChange={handleChange}
                      placeholder={placeholder}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108] outline-none text-sm hover:border-gray-400 transition"
                    />
                  </div>
                ))}

                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                  <select
                    name="location"
                    value={deliveryDetails.location}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108] outline-none text-sm bg-white hover:border-gray-400 transition"
                  >
                    <option value="">Select delivery location</option>
                    {locations.map((l) => (
                      <option key={l.name} value={l.name}>
                        {l.name} – ₦{formatCurrency(l.fee)}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  disabled={loading}
                  className={`w-full mt-8 py-4 rounded-lg font-bold text-white text-lg transition ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#AE2108] hover:bg-[#941B06]"
                  }`}
                >
                  {loading ? "Processing…" : "Pay via WhatsApp"}
                </button>

                <p className="text-center text-xs text-gray-600 mt-4">
                  You'll confirm the order directly with the vendor on WhatsApp
                </p>
              </form>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-bold text-lg text-gray-900 mb-6 flex items-center gap-2">
                <ShoppingCart size={22} className="text-[#AE2108]" />
                Order Summary
              </h3>

              <div className="space-y-3 pb-4 border-b border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    ₦{formatCurrency(cartTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Packing Fee</span>
                  <span className="font-semibold text-gray-900">
                    ₦{formatCurrency(packFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Service Fee</span>
                  <span className="font-semibold text-gray-900">
                    ₦{formatCurrency(serviceCharge)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">Delivery</span>
                  <span className="font-semibold text-gray-900">
                    ₦{formatCurrency(deliveryFee)}
                  </span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t-2 border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-lg">Total</span>
                  <span className="text-3xl font-bold text-[#AE2108]">
                    ₦{formatCurrency(finalTotal)}
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-900 font-medium">
                  💡 Payment happens securely on WhatsApp with the vendor
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
