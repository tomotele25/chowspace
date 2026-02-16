"use client";

import { useEffect, useState, useRef } from "react";
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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import Head from "next/head";

const VendorMenuPage = () => {
  const router = useRouter();
  const { slug } = router.query;
  const categoryRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartOpen, setCartOpen] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const BACKENDURL = "https://chowspace-backend.vercel.app";

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
    0,
  );

  useEffect(() => {
    if (!slug) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${BACKENDURL}/api/product/vendor/slug/${slug}`,
        );
        if (!res.data.success) {
          setError("Vendor or products not found");
          return;
        }
        setVendor(res.data.vendor);
        setProducts(res.data.products);
        setSelectedCategory("All");
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug]);

  const categories = [
    "All",
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];

  const sortedAndFilteredProducts = [...products]
    .filter(
      (product) =>
        selectedCategory === "All" || product.category === selectedCategory,
    )
    .sort((a, b) => {
      if (a.position !== b.position) return a.position - b.position;

      const aIsDrink = a.category?.toLowerCase().includes("drink");
      const bIsDrink = b.category?.toLowerCase().includes("drink");
      if (aIsDrink && !bIsDrink) return 1;
      if (!aIsDrink && bIsDrink) return -1;
      return 0;
    });

  const checkScroll = () => {
    if (categoryRef.current) {
      setCanScrollLeft(categoryRef.current.scrollLeft > 0);
      setCanScrollRight(
        categoryRef.current.scrollLeft <
          categoryRef.current.scrollWidth -
            categoryRef.current.clientWidth -
            10,
      );
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction) => {
    if (categoryRef.current) {
      const scrollAmount = 150;
      categoryRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  return (
    <>
      <Head>
        <title>
          {vendor
            ? `${vendor.businessName} | Menu | ChowSpace`
            : "Menu | ChowSpace"}
        </title>
      </Head>

      <section className="px-6 py-8 bg-white min-h-screen">
        <div className="max-w-6xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-[#AE2108] hover:underline"
          >
            <ArrowLeftCircle size={20} /> Back
          </button>

          {/* Vendor Info */}
          {vendor && (
            <div className="flex items-center gap-4 mb-10">
              <div className="w-20 h-20 relative rounded-full overflow-hidden border-2 border-[#AE2108]">
                <Image
                  loading="lazy"
                  src={vendor.logo || "/logo.jpg"}
                  alt={vendor.businessName}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {vendor.businessName}
                </h1>
                <p className="text-sm text-gray-500">{vendor.location}</p>
                <p className="text-xs text-gray-400 mt-1">{vendor.category}</p>
              </div>
            </div>
          )}

          {/* Pack Buttons */}
          <div className="flex flex-wrap gap-2 mb-8">
            {cart.map((_, index) => (
              <button
                key={index}
                onClick={() => switchPack(index)}
                className={`px-4 py-1 rounded-full text-sm font-medium transition-all duration-150 ${
                  index === currentPackIndex
                    ? "bg-[#AE2108] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <ShoppingCart size={16} className="inline-block mr-1" /> Pack{" "}
                {index + 1}
              </button>
            ))}
            <button
              onClick={createPack}
              className="px-3 py-1 bg-[#AE2108] text-white rounded-full text-sm flex items-center gap-1 hover:bg-[#941B06] transition"
            >
              <PackagePlus size={16} /> New Pack
            </button>
            <button
              onClick={() => duplicatePack(currentPackIndex)}
              className="px-3 py-1 bg-[#AE2108] text-white rounded-full text-sm flex items-center gap-1 hover:bg-[#941B06] transition"
            >
              <CopyPlus size={16} /> Duplicate
            </button>
          </div>

          {/* Horizontal Scrollable Categories */}
          {!loading && categories.length > 1 && (
            <div className="mb-8 flex items-center gap-3">
              {canScrollLeft && (
                <button
                  onClick={() => scroll("left")}
                  className="p-1 hover:bg-gray-100 rounded transition flex-shrink-0"
                >
                  <ChevronLeft size={18} className="text-gray-600" />
                </button>
              )}

              <div
                ref={categoryRef}
                onScroll={checkScroll}
                className="flex gap-2 overflow-x-auto flex-1"
                style={{ scrollbarWidth: "none" }}
              >
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${
                      selectedCategory === category
                        ? "bg-[#AE2108] text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:border-[#AE2108] hover:text-[#AE2108]"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

              {canScrollRight && (
                <button
                  onClick={() => scroll("right")}
                  className="p-1 hover:bg-gray-100 rounded transition flex-shrink-0"
                >
                  <ChevronRight size={18} className="text-gray-600" />
                </button>
              )}
            </div>
          )}

          {/* Menu */}
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {selectedCategory === "All" ? "Menu" : selectedCategory}
          </h2>

          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p className="text-red-600">{error}</p>
          ) : sortedAndFilteredProducts.length > 0 ? (
            <div className="grid pb-20 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {sortedAndFilteredProducts.map((product) => {
                const item = currentPack.find((p) => p._id === product._id);
                const count = item ? item.quantity : 0;

                return (
                  <div
                    key={product._id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1 flex flex-col"
                  >
                    {/* Product Image */}
                    <div className="w-full h-32 relative overflow-hidden rounded-t-2xl">
                      <Image
                        priority
                        src={product.image || "/placeholder.png"}
                        alt={product.productName}
                        fill
                        className="object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>

                    <div className="p-4 flex flex-col justify-between flex-grow">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {product.productName}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {product.category}
                        </p>
                        <p className="text-sm text-[#AE2108] font-semibold">
                          ₦{product.price}
                        </p>
                        <span
                          className={`text-xs font-medium ${
                            product.available
                              ? "text-green-600"
                              : "text-red-500"
                          }`}
                        >
                          {product.available ? "Available" : "Unavailable"}
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="mt-3">
                        {count > 0 ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeFromCart(product._id)}
                              className="p-1 bg-gray-200 rounded hover:bg-gray-300 transition"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-sm font-medium">{count}</span>
                            <button
                              onClick={() => incrementItem(product._id)}
                              className="p-1 bg-gray-200 rounded hover:bg-gray-300 transition"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            disabled={!product.available}
                            className={`w-full py-2 mt-2 rounded text-xs font-medium flex items-center justify-center gap-1 transition ${
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
            <p className="text-gray-500">
              {selectedCategory === "All"
                ? "No items on the menu yet."
                : `No items in ${selectedCategory} yet.`}
            </p>
          )}

          {/* Cart (Mobile + Desktop) */}
          {currentPack.length > 0 && (
            <>
              {/* Mobile Drawer */}
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

              {/* Desktop Cart */}
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
      </section>
    </>
  );
};

export default VendorMenuPage;
