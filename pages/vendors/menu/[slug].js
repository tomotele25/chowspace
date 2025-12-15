"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Image from "next/image";
import {
  ArrowLeftCircle,
  Plus,
  Minus,
  Trash2,
  CopyPlus,
  ShoppingCart,
  PackagePlus,
  X,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import Head from "next/head";

const VendorMenuPage = () => {
  const router = useRouter();
  const { slug } = router.query;

  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartOpen, setCartOpen] = useState(true);

  const BACKENDURL =
    "https://chowspace-backend.vercel.app" || "http://localhost:2005";

  const {
    cart,
    currentPackIndex,
    addToCart,
    removeFromCart,
    incrementItem,
    createPack,
    duplicatePack,
    switchPack,
    emptyCart,
  } = useCart();

  const currentPack = cart[currentPackIndex] || [];
  const total = currentPack.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${BACKENDURL}/api/product/vendor/slug/${slug}`
        );
        if (!res.data.success) {
          setError("Vendor or products not found");
          return;
        }
        setVendor(res.data.vendor);
        setProducts(res.data.products);
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const sortedProducts = [...products].sort((a, b) => {
    if (a.position !== b.position) return a.position - b.position;

    const aIsDrink = a.category?.toLowerCase().includes("drink");
    const bIsDrink = b.category?.toLowerCase().includes("drink");
    if (aIsDrink && !bIsDrink) return 1;
    if (!aIsDrink && bIsDrink) return -1;
    return 0;
  });

  return (
    <>
      <Head>
        <title>
          {vendor
            ? `${vendor.businessName} | Menu | ChowSpace`
            : "Menu | ChowSpace"}
        </title>
      </Head>

      <section className="px-6 py-8 bg-gray-50 min-h-screen relative">
        {/* 🎄 Christmas Rope Lights */}
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

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center gap-2 text-[#AE2108]"
          >
            <ArrowLeftCircle size={20} />
            <span className="text-sm font-medium">Back</span>
          </button>

          {/* Vendor info */}
          {vendor && (
            <div className="flex items-center gap-4 mb-10">
              <div className="w-16 h-16 relative rounded-full overflow-hidden border">
                <Image
                  loading="lazy"
                  src={vendor.logo || "/logo.jpg"}
                  alt={vendor.businessName}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {vendor.businessName}
                </h1>
                <p className="text-sm text-gray-500">{vendor.location}</p>
                <p className="text-xs text-gray-400 mt-1">{vendor.category}</p>
              </div>
            </div>
          )}

          {/* Pack buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            {cart.map((_, index) => (
              <button
                key={index}
                onClick={() => switchPack(index)}
                className={`px-4 py-1 rounded-full text-sm font-medium transition-all duration-150 ${
                  index === currentPackIndex
                    ? "bg-[#AE2108] text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <ShoppingCart size={16} className="inline-block mr-1" /> Pack{" "}
                {index + 1}
              </button>
            ))}
            <button
              onClick={createPack}
              className="px-3 py-1 bg-[#AE2108] text-white rounded-full text-sm flex items-center gap-1"
            >
              <PackagePlus size={16} /> New Pack
            </button>
            <button
              onClick={() => duplicatePack(currentPackIndex)}
              className="px-3 py-1 bg-[#AE2108] text-white rounded-full text-sm flex items-center gap-1"
            >
              <CopyPlus size={16} /> Duplicate
            </button>
          </div>

          {/* Menu */}
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Menu</h2>

          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : sortedProducts.length > 0 ? (
            <div className="grid pb-15 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {sortedProducts.map((product) => {
                const item = currentPack.find((p) => p._id === product._id);
                const count = item ? item.quantity : 0;

                return (
                  <div
                    key={product._id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition duration-200 flex flex-col"
                  >
                    <div className="w-full h-28 relative">
                      <Image
                        priority
                        src={
                          product.image || "https://placehold.co/150x150/png"
                        }
                        alt={product.productName}
                        fill
                        className="object-cover rounded-t-xl"
                      />
                    </div>

                    <div className="p-4 flex flex-col justify-between flex-grow">
                      <div className="flex-grow" />

                      <div className="space-y-1">
                        <h3 className="font-semibold text-gray-900 text-sm leading-snug break-words">
                          {product.productName}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {product.category}
                        </p>
                        <p className="text-sm text-[#AE2108] font-semibold">
                          ₦{product.price}
                        </p>
                        <p
                          className={`text-xs font-medium ${
                            product.available
                              ? "text-[#AE2108]"
                              : "text-red-500"
                          }`}
                        >
                          {product.available ? "Available" : "Unavailable"}
                        </p>
                      </div>

                      <div className="mt-4">
                        {count > 0 ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeFromCart(product._id)}
                              className="p-1 bg-gray-200 rounded"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-sm font-medium">{count}</span>
                            <button
                              onClick={() => incrementItem(product._id)}
                              className="p-1 bg-gray-200 rounded"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            disabled={!product.available}
                            className={`w-full py-1.5 mt-2 rounded text-xs font-medium flex items-center justify-center gap-1 ${
                              product.available
                                ? "bg-[#AE2108] text-white hover:bg-[#941B06]"
                                : "bg-gray-200 text-gray-500 cursor-not-allowed"
                            }`}
                          >
                            <Plus size={14} /> Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">No items on the menu yet.</p>
          )}

          {/* Cart (mobile + desktop) */}
          {currentPack.length > 0 && (
            <>
              {/* Mobile drawer */}
              <div className="fixed bottom-0 left-0 w-full z-50 md:hidden">
                <div
                  className="bg-white border-t border-gray-200 shadow-lg p-4 flex justify-between items-center cursor-pointer"
                  onClick={() => setCartOpen(!cartOpen)}
                >
                  <div>
                    <p className="text-sm font-medium">
                      {currentPack.length}{" "}
                      {currentPack.length === 1 ? "item" : "items"}
                    </p>
                    <p className="font-semibold text-[#AE2108] text-lg">
                      ₦{total}
                    </p>
                  </div>
                  <button>
                    {cartOpen ? <X size={20} /> : <ShoppingCart size={20} />}
                  </button>
                </div>

                {cartOpen && (
                  <div className="bg-white border-t border-gray-200 shadow-inner p-4 max-h-80 overflow-y-auto">
                    <ul className="divide-y text-sm">
                      {currentPack.map((item) => (
                        <li
                          key={item._id}
                          className="py-2 flex justify-between items-center"
                        >
                          <span>
                            {item.productName} × {item.quantity}
                          </span>
                          <span className="font-semibold text-[#AE2108]">
                            ₦{item.price * item.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between mt-4 font-semibold text-base">
                      <span>Total:</span>
                      <span className="text-[#AE2108]">₦{total}</span>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={emptyCart}
                        className="text-sm bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded flex items-center gap-1 w-1/2"
                      >
                        <Trash2 size={16} /> Empty
                      </button>
                      <button
                        onClick={() => router.push(`/checkout/${slug}`)}
                        className="text-sm bg-[#AE2108] text-white hover:bg-[#941B06] px-4 py-2 rounded flex items-center gap-1 w-1/2"
                      >
                        <ShoppingCart size={16} /> Checkout
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop cart */}
              <div className="hidden md:flex fixed right-8 bottom-8 w-80 bg-white border border-gray-200 rounded-2xl shadow-lg flex-col z-50 transition-all duration-300">
                <div className="flex justify-between items-center p-3 border-b cursor-pointer">
                  <div className="flex items-center gap-2">
                    <ShoppingCart size={18} />
                    <span className="font-semibold">
                      {currentPack.length} items
                    </span>
                  </div>
                  <button onClick={() => setCartOpen(!cartOpen)}>
                    {cartOpen ? <X size={18} /> : <ShoppingCart size={18} />}
                  </button>
                </div>

                {cartOpen && (
                  <div className="p-4 flex flex-col">
                    <ul className="divide-y text-sm max-h-60 overflow-y-auto">
                      {currentPack.map((item) => (
                        <li
                          key={item._id}
                          className="py-2 flex justify-between"
                        >
                          <span>
                            {item.productName} × {item.quantity}
                          </span>
                          <span className="font-semibold text-[#AE2108]">
                            ₦{item.price * item.quantity}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex justify-between mt-4 font-semibold text-base">
                      <span>Total:</span>
                      <span className="text-[#AE2108]">₦{total}</span>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        onClick={emptyCart}
                        className="text-sm bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded flex items-center gap-1"
                      >
                        <Trash2 size={16} /> Empty
                      </button>
                      <button
                        onClick={() => router.push(`/checkout/${slug}`)}
                        className="text-sm bg-[#AE2108] text-white hover:bg-[#941B06] px-4 py-2 rounded flex items-center gap-1"
                      >
                        <ShoppingCart size={16} /> Checkout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Bulb animation styles */}
        <style jsx>{`
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
      </section>
    </>
  );
};

export default VendorMenuPage;
