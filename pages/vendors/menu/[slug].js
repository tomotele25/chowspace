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
  Clock,
  ChevronUp,
  ChevronDown,
  Copy,
  Package,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import Head from "next/head";
import { cloudinaryResize } from "@/utils/captcha";

const VendorMenuPage = ({ vendorMeta, ogImage }) => {
  const router = useRouter();
  const { slug } = router.query;
  const categoryRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
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
  const totalAllPacks = cart
    .flat()
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalAllItems = cart
    .flat()
    .reduce((sum, item) => sum + item.quantity, 0);

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
        const vendorData = res.data.vendor;
        setVendor(vendorData);

        if (vendorData?.status === "closed") {
          setProducts([]);
          return;
        }

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

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-white px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4 mb-10 animate-pulse">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex-shrink-0" />
            <div className="space-y-2">
              <div className="h-5 bg-gray-100 rounded w-40" />
              <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-md flex flex-col animate-pulse"
              >
                <div className="w-full h-32 bg-gray-100 rounded-t-2xl" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── Vendor closed screen ── */
  if (vendor && vendor?.status === "closed") {
    return (
      <>
        <Head>
          <title>{vendor.businessName} | Closed | ChowSpace</title>
        </Head>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-20 h-20 relative rounded-full overflow-hidden border-2 border-gray-200 mx-auto mb-6">
              <Image
                src={cloudinaryResize(vendor.logo, 80) || "/logo.jpg"}
                alt={vendor.businessName}
                fill
                unoptimized
                className="object-cover grayscale"
              />
            </div>
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <Clock size={28} className="text-[#AE2108]" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {vendor.businessName} is currently closed
            </h1>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              This vendor is not taking orders right now. Please check back
              later or explore other vendors on ChowSpace.
            </p>
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#AE2108] text-white rounded-xl font-semibold text-sm hover:bg-[#941B06] transition"
            >
              <ArrowLeftCircle size={16} /> Go Back
            </button>
          </div>
        </div>
      </>
    );
  }

  const finalOgImage = ogImage || "https://chowspace.ng/logo.jpg";

  return (
    <>
      <Head>
        <title>
          {vendorMeta
            ? `${vendorMeta.businessName} | Menu | ChowSpace`
            : "Menu | ChowSpace"}
        </title>
        <meta
          property="og:title"
          content={vendorMeta?.businessName || "ChowSpace"}
        />
        <meta
          property="og:description"
          content={`Order from ${vendorMeta?.businessName || "this vendor"} on ChowSpace`}
        />
        <meta property="og:image" content={finalOgImage} />
        <meta property="og:image:secure_url" content={finalOgImage} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:type" content="image/jpeg" />
        <meta
          property="og:url"
          content={`https://chowspace.ng/vendors/menu/${vendorMeta?.slug || ""}`}
        />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ChowSpace" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content={vendorMeta?.businessName || "ChowSpace"}
        />
        <meta
          name="twitter:description"
          content={`Order from ${vendorMeta?.businessName || "this vendor"} on ChowSpace`}
        />
        <meta name="twitter:image" content={finalOgImage} />
      </Head>

      <section className="px-6 py-8 bg-white min-h-screen">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-[#AE2108] hover:underline"
          >
            <ArrowLeftCircle size={20} /> Back
          </button>

          {vendor && (
            <div className="flex items-center gap-4 mb-10">
              <div className="w-20 h-20 relative rounded-full overflow-hidden border-2 border-[#AE2108]">
                <Image
                  loading="lazy"
                  src={cloudinaryResize(vendor.logo, 80) || "/logo.jpg"}
                  alt={vendor.businessName}
                  fill
                  unoptimized
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

          {/* Pack tabs */}
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

          {/* Categories */}
          {categories.length > 1 && (
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

          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            {selectedCategory === "All" ? "Menu" : selectedCategory}
          </h2>

          {error ? (
            <p className="text-red-600">{error}</p>
          ) : sortedAndFilteredProducts.length > 0 ? (
            <div className="grid pb-40 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {sortedAndFilteredProducts.map((product, index) => {
                const item = currentPack.find((p) => p._id === product._id);
                const count = item ? item.quantity : 0;

                return (
                  <div
                    key={product._id}
                    className="bg-white rounded-2xl shadow-md hover:shadow-xl transition transform hover:-translate-y-1 flex flex-col"
                  >
                    <div className="w-full h-32 relative overflow-hidden rounded-t-2xl flex-shrink-0">
                      <Image
                        src={
                          cloudinaryResize(product.image, 300) ||
                          "/placeholder.png"
                        }
                        alt={product.productName}
                        fill
                        unoptimized
                        loading={index < 6 ? "eager" : "lazy"}
                        className="object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>

                    <div className="p-3 flex flex-col flex-grow">
                      <div
                        className="flex flex-col gap-0.5"
                        style={{ minHeight: "72px" }}
                      >
                        <h3
                          className="font-semibold text-gray-900 text-xs leading-tight"
                          style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {product.productName}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {product.category}
                        </p>
                        <p className="text-sm text-[#AE2108] font-semibold">
                          ₦{product.price}
                        </p>
                      </div>

                      <span
                        className={`text-xs font-medium ${product.available ? "text-green-600" : "text-red-500"}`}
                      >
                        {product.available ? "Available" : "Unavailable"}
                      </span>

                      <div className="mt-auto pt-2">
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
                            className={`w-full py-2 rounded text-xs font-medium flex items-center justify-center gap-1 transition ${
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

          {/* ═══════════════════════════════════════════
              CART DRAWER — Mobile & Desktop
              ═══════════════════════════════════════════ */}
          {cart.flat().length > 0 && (
            <>
              {/* ── Mobile Bottom Sheet ── */}
              <div className="fixed bottom-0 left-0 w-full z-50 md:hidden">
                {/* Collapsed bar */}
                <div
                  className="bg-white border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 pt-3 pb-2 cursor-pointer"
                  onClick={() => setCartOpen(!cartOpen)}
                >
                  {/* Drag handle */}
                  <div className="flex justify-center mb-2">
                    <div className="w-8 h-1 rounded-full bg-gray-200" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Animated bag */}
                      <div className="relative w-10 h-10 bg-[#AE2108] rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
                        <ShoppingCart size={18} className="text-white" />
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border-2 border-[#AE2108] rounded-full flex items-center justify-center text-[10px] font-black text-[#AE2108]">
                          {totalAllItems}
                        </span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 leading-none mb-0.5">
                          {cart.length} pack{cart.length !== 1 ? "s" : ""} ·{" "}
                          {totalAllItems} item{totalAllItems !== 1 ? "s" : ""}
                        </p>
                        <p className="font-black text-[#AE2108] text-lg leading-none">
                          ₦{totalAllPacks.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`transition-transform duration-200 ${cartOpen ? "rotate-0" : "rotate-180"}`}
                      >
                        <ChevronDown size={20} className="text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded drawer */}
                {cartOpen && (
                  <div className="bg-white border-t border-gray-100 max-h-[70vh] overflow-y-auto">
                    {/* Pack management bar */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                      <p className="text-xs font-semibold text-gray-400 flex-1">
                        MANAGE PACKS
                      </p>
                      <button
                        onClick={createPack}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#AE2108]/8 text-[#AE2108] text-xs font-bold hover:bg-[#AE2108]/15 transition"
                      >
                        <PackagePlus size={13} /> New Pack
                      </button>
                      <button
                        onClick={() => duplicatePack(currentPackIndex)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition"
                      >
                        <Copy size={13} /> Duplicate
                      </button>
                    </div>

                    {/* Pack tabs inside drawer */}
                    {cart.length > 1 && (
                      <div
                        className="px-4 py-2.5 border-b border-gray-100 flex gap-2 overflow-x-auto"
                        style={{ scrollbarWidth: "none" }}
                      >
                        {cart.map((pack, index) => (
                          <button
                            key={index}
                            onClick={() => switchPack(index)}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              index === currentPackIndex
                                ? "bg-[#AE2108] text-white shadow-sm"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            <Package size={12} />
                            Pack {index + 1}
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded-full ml-0.5 ${
                                index === currentPackIndex
                                  ? "bg-white/25 text-white"
                                  : "bg-gray-200 text-gray-500"
                              }`}
                            >
                              {pack.reduce((s, i) => s + i.quantity, 0)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Current pack items */}
                    <div className="px-4 py-2">
                      {currentPack.length === 0 ? (
                        <div className="text-center py-6">
                          <ShoppingCart
                            size={24}
                            className="text-gray-200 mx-auto mb-2"
                          />
                          <p className="text-xs text-gray-400">
                            This pack is empty
                          </p>
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-50">
                          {currentPack.map((item) => (
                            <li
                              key={item._id}
                              className="py-3 flex items-center justify-between gap-3"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">
                                  {item.productName}
                                </p>
                                <p className="text-xs text-[#AE2108] font-bold mt-0.5">
                                  ₦
                                  {(
                                    item.price * item.quantity
                                  ).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                  onClick={() => removeFromCart(item._id)}
                                  className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition text-gray-500"
                                >
                                  <Minus size={13} />
                                </button>
                                <span className="text-sm font-bold text-gray-900 w-5 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => incrementItem(item._id)}
                                  className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition text-gray-500"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Pack total */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">
                          Pack {currentPackIndex + 1} total
                        </span>
                        <span className="text-sm font-bold text-gray-900">
                          ₦{total.toLocaleString()}
                        </span>
                      </div>
                      {cart.length > 1 && (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            All packs total
                          </span>
                          <span className="text-sm font-black text-[#AE2108]">
                            ₦{totalAllPacks.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="px-4 py-3 flex gap-3 border-t border-gray-100">
                      <button
                        onClick={emptyCart}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
                      >
                        <Trash2 size={15} /> Clear
                      </button>
                      <button
                        onClick={() => router.push(`/checkout/${slug}`)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-[#AE2108] text-white hover:bg-[#941B06] transition active:scale-[0.98] shadow-sm shadow-[#AE2108]/20"
                      >
                        <ShoppingCart size={15} /> Checkout · ₦
                        {totalAllPacks.toLocaleString()}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Desktop Cart Panel ── */}
              <div
                className="hidden md:flex fixed right-6 bottom-6 w-88 bg-white rounded-2xl shadow-2xl shadow-black/10 border border-gray-100 flex-col z-50 overflow-hidden"
                style={{ width: "360px" }}
              >
                {/* Header */}
                <div
                  className="flex items-center justify-between px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => setCartOpen(!cartOpen)}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 bg-[#AE2108] rounded-xl flex items-center justify-center flex-shrink-0">
                      <ShoppingCart size={15} className="text-white" />
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white border border-[#AE2108] rounded-full flex items-center justify-center text-[9px] font-black text-[#AE2108]">
                        {totalAllItems}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 leading-none mb-0.5">
                        {cart.length} pack{cart.length !== 1 ? "s" : ""}
                      </p>
                      <p className="text-sm font-black text-gray-900">
                        ₦{totalAllPacks.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {cartOpen ? (
                      <ChevronDown size={16} className="text-gray-400" />
                    ) : (
                      <ChevronUp size={16} className="text-gray-400" />
                    )}
                  </div>
                </div>

                {cartOpen && (
                  <>
                    {/* Pack management */}
                    <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                      <p className="text-[10px] font-bold text-gray-400 tracking-wide flex-1">
                        PACKS
                      </p>
                      <button
                        onClick={createPack}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#AE2108]/8 text-[#AE2108] text-[11px] font-bold hover:bg-[#AE2108]/15 transition"
                      >
                        <PackagePlus size={12} /> New
                      </button>
                      <button
                        onClick={() => duplicatePack(currentPackIndex)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-[11px] font-bold hover:bg-gray-200 transition"
                      >
                        <Copy size={12} /> Copy
                      </button>
                    </div>

                    {/* Pack switcher */}
                    {cart.length > 1 && (
                      <div
                        className="px-3 py-2 flex gap-1.5 overflow-x-auto border-b border-gray-100"
                        style={{ scrollbarWidth: "none" }}
                      >
                        {cart.map((pack, index) => (
                          <button
                            key={index}
                            onClick={() => switchPack(index)}
                            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition ${
                              index === currentPackIndex
                                ? "bg-[#AE2108] text-white"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            }`}
                          >
                            <Package size={11} /> P{index + 1}
                            <span
                              className={`text-[9px] px-1 rounded-full ml-0.5 ${
                                index === currentPackIndex
                                  ? "bg-white/25 text-white"
                                  : "bg-gray-200 text-gray-500"
                              }`}
                            >
                              {pack.reduce((s, i) => s + i.quantity, 0)}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Items */}
                    <div className="overflow-y-auto max-h-52 px-4 py-1">
                      {currentPack.length === 0 ? (
                        <div className="text-center py-5">
                          <p className="text-xs text-gray-400">
                            This pack is empty
                          </p>
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-50">
                          {currentPack.map((item) => (
                            <li
                              key={item._id}
                              className="py-2.5 flex items-center gap-3"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-900 truncate">
                                  {item.productName}
                                </p>
                                <p className="text-xs text-[#AE2108] font-bold">
                                  ₦
                                  {(
                                    item.price * item.quantity
                                  ).toLocaleString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                <button
                                  onClick={() => removeFromCart(item._id)}
                                  className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition text-gray-500"
                                >
                                  <Minus size={11} />
                                </button>
                                <span className="text-xs font-bold text-gray-900 w-4 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => incrementItem(item._id)}
                                  className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-green-50 hover:text-green-600 transition text-gray-500"
                                >
                                  <Plus size={11} />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Totals */}
                    <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-400">
                          Pack {currentPackIndex + 1}
                        </span>
                        <span className="text-xs font-bold text-gray-700">
                          ₦{total.toLocaleString()}
                        </span>
                      </div>
                      {cart.length > 1 && (
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-400">
                            All packs
                          </span>
                          <span className="text-xs font-black text-[#AE2108]">
                            ₦{totalAllPacks.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="px-4 py-3 flex gap-2 border-t border-gray-100">
                      <button
                        onClick={emptyCart}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200 transition"
                      >
                        <Trash2 size={13} /> Clear
                      </button>
                      <button
                        onClick={() => router.push(`/checkout/${slug}`)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold bg-[#AE2108] text-white hover:bg-[#941B06] transition shadow-sm"
                      >
                        <ShoppingCart size={13} /> Checkout · ₦
                        {totalAllPacks.toLocaleString()}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// Pre-build a static HTML page for EVERY vendor at build time, so each
// vendor page ships with its OG tags already baked into the HTML - the
// same way the homepage (which has no data function) works. This is what
// makes WhatsApp/Facebook see the logo, business name and description:
// they read raw HTML and never run JavaScript, so the tags must exist
// before the page is ever requested.
// ─────────────────────────────────────────────────────────────
export async function getStaticPaths() {
  try {
    const res = await fetch(
      "https://chowspace-backend.vercel.app/api/vendor/getVendors",
    );
    const data = await res.json();
    const paths = (data.vendors || [])
      .filter((v) => v.slug)
      .map((v) => ({ params: { slug: v.slug } }));

    return { paths, fallback: false };
  } catch {
    return { paths: [], fallback: false };
  }
}

export async function getStaticProps({ params }) {
  try {
    const res = await fetch(
      `https://chowspace-backend.vercel.app/api/product/vendor/slug/${params.slug}`,
    );
    const data = await res.json();
    const vendor = data.vendor || null;

    if (!vendor) {
      return { notFound: true };
    }

    let ogImage = "https://chowspace.ng/logo.jpg";
    if (vendor.logo && vendor.logo.includes("/upload/")) {
      ogImage = vendor.logo.replace(
        "/upload/",
        "/upload/w_1200,h_630,c_pad,b_auto,q_auto,f_jpg/",
      );
    } else if (vendor.logo) {
      ogImage = vendor.logo;
    }

    return {
      props: { vendorMeta: vendor, ogImage },
      revalidate: 60, 
    };
  } catch {
    return { notFound: true };
  }
}

export default VendorMenuPage;
