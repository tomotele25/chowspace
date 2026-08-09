"use client";

import { BACKENDURL } from "@/lib/api";
import Head from "next/head";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Carousel from "@/components/Carousel";
import ScrollToTopBtn from "@/components/ScrollToTopBtn";
import PromoBanner from "@/components/PromoBanner";
import Faq from "@/components/Faq";
import ContactSupport from "@/components/ContactSupport";
import Categories from "@/components/Categories";
import VendorSkeletonCard from "@/components/VendorSkeletonCard";
import ErrorState from "@/components/ErrorState";
import IOSInstallNotice from "@/components/IOSInstallNotice";
import { cloudinaryResize } from "@/utils/captcha";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import {
  Heart,
  Clock,
  Star,
  StarHalf,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/router";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCategory } from "@/context/CategoryContext";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [loginModal, setLoginModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(null);

  // New Vendor Carousel state
  const [newActiveIndex, setNewActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const autoPlayRef = useRef(null);
  const trackRef = useRef(null);

  const { data: session } = useSession();
  const { selectedCategory } = useCategory();
  const router = useRouter();
  const vendorsPerPage = 8;

  const {
    data: vendorsData,
    error: vendorsError,
    isLoading: vendorsLoading,
    mutate: retryVendors,
  } = useSWR(`${BACKENDURL}/api/vendor/getVendors`, fetcher);
  const { data: locationsData } = useSWR(
    `${BACKENDURL}/api/getLocations`,
    fetcher,
  );
  const vendors = vendorsData?.vendors || [];
  const locations = locationsData?.locations || [];
  const loading = vendorsLoading;

  // New vendors sorted by createdAt (latest 10)
  const newVendors = [...vendors]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  // Auto-advance carousel
  useEffect(() => {
    if (!newVendors.length) return;
    autoPlayRef.current = setInterval(() => {
      setNewActiveIndex((prev) => (prev + 1) % newVendors.length);
    }, 3500);
    return () => clearInterval(autoPlayRef.current);
  }, [newVendors.length]);

  const pauseCarousel = () => clearInterval(autoPlayRef.current);
  const resumeCarousel = () => {
    autoPlayRef.current = setInterval(() => {
      setNewActiveIndex((prev) => (prev + 1) % newVendors.length);
    }, 3500);
  };

  const carouselPrev = () => {
    setNewActiveIndex((p) => (p - 1 + newVendors.length) % newVendors.length);
  };
  const carouselNext = () => {
    setNewActiveIndex((p) => (p + 1) % newVendors.length);
  };

  const onPointerDown = (e) => {
    setIsDragging(true);
    setDragStart(e.clientX ?? e.touches?.[0]?.clientX);
    pauseCarousel();
  };
  const onPointerUp = (e) => {
    if (!isDragging) return;
    setIsDragging(false);
    const end = e.clientX ?? e.changedTouches?.[0]?.clientX;
    const delta = dragStart - end;
    if (Math.abs(delta) > 40) delta > 0 ? carouselNext() : carouselPrev();
    resumeCarousel();
  };

  const getCarouselPosition = (idx) => {
    const total = newVendors.length;
    const diff = (idx - newActiveIndex + total) % total;
    if (diff === 0) return "center";
    if (diff === 1) return "right";
    if (diff === total - 1) return "left";
    return "hidden";
  };

  const getRelativeAge = (dateStr) => {
    const diff = Date.now() - new Date(dateStr);
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  };

  const renderStars = (rating = 0) =>
    Array.from({ length: 5 }).map((_, i) => {
      if (rating >= i + 1)
        return <Star key={i} size={13} fill="currentColor" stroke="none" />;
      if (rating > i)
        return <StarHalf key={i} size={13} fill="currentColor" stroke="none" />;
      return <Star key={i} size={13} className="text-gray-300" fill="none" />;
    });

  // Main vendor grid logic
  const filteredVendors = vendors
    .filter((vendor) => {
      const matchSearch =
        vendor.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.category?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLocation =
        selectedLocation === "All" || vendor.location === selectedLocation;
      const matchCategory =
        !selectedCategory || selectedCategory === "All"
          ? true
          : vendor.category?.toLowerCase() === selectedCategory.toLowerCase();
      return matchSearch && matchLocation && matchCategory;
    })
    .sort((a, b) => {
      const aPromo =
        a.promotionExpiresAt && new Date(a.promotionExpiresAt) > new Date();
      const bPromo =
        b.promotionExpiresAt && new Date(b.promotionExpiresAt) > new Date();
      if (aPromo !== bPromo) return bPromo - aPromo;
      if (a.status === "opened" && b.status === "closed") return -1;
      if (a.status === "closed" && b.status === "opened") return 1;
      return 0;
    });

  const totalPages = Math.ceil(filteredVendors.length / vendorsPerPage);
  const paginated = filteredVendors.slice(
    (currentPage - 1) * vendorsPerPage,
    currentPage * vendorsPerPage,
  );

  const goToNext = () =>
    currentPage < totalPages && setCurrentPage((p) => p + 1);
  const goToPrev = () => currentPage > 1 && setCurrentPage((p) => p - 1);

  const toggleFav = () => setIsFavorite(!isFavorite);

  return (
    <div
      className="font-sans relative overflow-hidden bg-gradient-to-br from-red-50 via-white to-green-50"
    >
      <Head>
        <title>ChowSpace | Order Meals from Trusted Vendors</title>
        <meta
          name="description"
          content="Order delicious meals from trusted vendors near you on ChowSpace. Fast delivery, great food."
        />

        {/* Open Graph */}
        <meta
          property="og:title"
          content="ChowSpace | Order Meals from Trusted Vendors"
        />
        <meta
          property="og:description"
          content="Order delicious meals from trusted vendors near you. Fast delivery, great food."
        />
        <meta
          property="og:image"
          content="https://chowspace.ng/images/og-preview.jpg"
        />
        <meta
          property="og:image:secure_url"
          content="https://chowspace.ng/images/og-preview.jpg"
        />
        <meta property="og:image:type" content="image/jpeg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="ChowSpace - Order Meals from Trusted Vendors"
        />
        <meta property="og:url" content="https://chowspace.ng" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="ChowSpace" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="ChowSpace | Order Meals from Trusted Vendors"
        />
        <meta
          name="twitter:description"
          content="Order delicious meals from trusted vendors near you."
        />
        <meta
          name="twitter:image"
          content="https://chowspace.ng/images/og-preview.jpg"
        />
        <meta
          name="twitter:image:alt"
          content="ChowSpace - Order Meals from Trusted Vendors"
        />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/og-preview.jpg" />
      </Head>
      <ScrollToTopBtn />
      <ContactSupport />
      <main>
        <Navbar />
        <Hero />
        <Categories />
        <Carousel />

        {/* ── New Vendors Carousel ── */}
        {!loading && newVendors.length > 0 && (
          <section className="px-4 sm:px-10 md:px-20 py-12 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#AE2108]/10">
                  <Sparkles size={20} className="text-[#AE2108]" />
                </span>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                    New <span className="text-[#AE2108]">Vendors</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Fresh additions to ChowSpace
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={carouselPrev}
                  className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#AE2108] hover:text-[#AE2108] hover:bg-red-50 transition-all duration-200"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={carouselNext}
                  className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#AE2108] hover:text-[#AE2108] hover:bg-red-50 transition-all duration-200"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Track */}
            <div
              ref={trackRef}
              className="relative flex items-center justify-center h-[370px] select-none"
              onMouseDown={onPointerDown}
              onMouseUp={onPointerUp}
              onTouchStart={onPointerDown}
              onTouchEnd={onPointerUp}
              onMouseEnter={pauseCarousel}
              onMouseLeave={() => {
                setIsDragging(false);
                resumeCarousel();
              }}
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
            >
              {newVendors.map((vendor, idx) => {
                const pos = getCarouselPosition(idx);
                const isPromoted =
                  vendor.promotionExpiresAt &&
                  new Date(vendor.promotionExpiresAt) > new Date();

                const posStyles = {
                  center: "z-20 scale-100 opacity-100 translate-x-0 shadow-2xl",
                  left: "z-10 scale-90 opacity-60 -translate-x-[72%] shadow-md",
                  right: "z-10 scale-90 opacity-60 translate-x-[72%] shadow-md",
                  hidden:
                    "z-0 scale-75 opacity-0 translate-x-0 pointer-events-none",
                };

                return (
                  <div
                    key={vendor._id}
                    onClick={() => pos !== "center" && setNewActiveIndex(idx)}
                    className={`absolute w-72 bg-white rounded-3xl overflow-hidden transition-all duration-500 ease-[cubic-bezier(.34,1.56,.64,1)] ${posStyles[pos]}`}
                    style={{ willChange: "transform, opacity" }}
                  >
                    {/* Image */}
                    <div className="relative w-full h-48">
                      <Image
                        src={cloudinaryResize(vendor.logo, 300) || "/logo.jpg"}
                        alt={vendor.businessName}
                        fill
                        className="object-cover"
                        priority={pos === "center"}
                      />
                      {/* NEW badge */}
                      <div className="absolute top-3 left-3 bg-[#AE2108] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg tracking-wide uppercase">
                        ✦ New
                      </div>
                      {/* Promo badge */}
                      {isPromoted && (
                        <div className="absolute top-3 right-3 bg-yellow-400 text-[#AE2108] text-[10px] font-bold px-2.5 py-1 rounded-full shadow animate-pulse">
                          ⭐ Promoted
                        </div>
                      )}
                      {/* Closed overlay */}
                      {vendor.status === "closed" && (
                        <div className="absolute inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center">
                          <span className="text-white text-sm font-semibold tracking-wide">
                            Closed
                          </span>
                        </div>
                      )}
                      {/* Joined chip */}
                      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-semibold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                        <Clock size={10} className="text-[#AE2108]" />
                        {getRelativeAge(vendor.createdAt)}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-gray-900 text-sm truncate">
                        {vendor.businessName}
                      </h3>
                      <div className="text-xs text-gray-500 flex gap-1.5 truncate">
                        <span>{vendor.category}</span>
                        <span>•</span>
                        <span>{vendor.location}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-0.5 text-yellow-500">
                          {renderStars(vendor.averageRating)}
                          <span className="ml-1 text-xs text-gray-500">
                            ({vendor.averageRating || 0})
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock size={12} className="text-[#AE2108]" />
                          {vendor.deliveryDuration}m
                        </span>
                      </div>
                      <Link
                        href={
                          vendor.status === "opened"
                            ? `/vendors/menu/${vendor.slug}`
                            : ""
                        }
                        className={`block w-full text-center text-xs font-bold py-2 rounded-xl transition-all duration-200 mt-1 ${
                          vendor.status === "opened"
                            ? "bg-[#AE2108] text-white hover:bg-[#941B06]"
                            : "bg-gray-200 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        View Menu
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5 mt-6">
              {newVendors.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setNewActiveIndex(idx)}
                  className={`rounded-full transition-all duration-300 ${
                    idx === newActiveIndex
                      ? "w-6 h-2 bg-[#AE2108]"
                      : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
          </section>
        )}

        {/* ── Main Vendor Section ── */}
        <section id="vendors" className="px-4 sm:px-10 md:px-20 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#AE2108] mb-2">
              Discover Top Vendors
            </h2>
            <p className="text-gray-500 max-w-md mx-auto text-sm sm:text-base">
              Find the best meals from vendors around you and enjoy swift
              delivery.
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-between mb-10">
            <input
              type="text"
              placeholder="Search vendors or categories..."
              className="w-full sm:w-1/2 px-4 py-3 rounded-xl border border-gray-300 shadow-md focus:ring-2 focus:ring-[#AE2108] outline-none text-sm sm:text-base transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full sm:w-1/4 px-4 py-3 rounded-xl border border-gray-300 shadow-md text-black text-sm sm:text-base focus:ring-2 focus:ring-[#AE2108] outline-none transition-all duration-300"
            >
              <option value="All">All Locations</option>
              {locations.map((loc, i) => (
                <option key={i} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Vendor Grid */}
          {vendorsError ? (
            <ErrorState
              title="Couldn't load vendors"
              message="Something went wrong fetching vendors. Please try again."
              onRetry={() => retryVendors()}
            />
          ) : loading ? (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <VendorSkeletonCard key={i} />
              ))}
            </div>
          ) : paginated.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {paginated.map((vendor) => {
                const isPromoted =
                  vendor.promotionExpiresAt &&
                  new Date(vendor.promotionExpiresAt) > new Date();
                return (
                  <div
                    key={vendor._id}
                    className={`group relative bg-white border rounded-3xl overflow-hidden transition-transform duration-300 shadow-md hover:shadow-2xl hover:scale-105`}
                  >
                    {isPromoted && (
                      <div className="absolute top-3 right-3 z-10 bg-yellow-400 text-[#AE2108] px-3 py-1 text-xs font-bold rounded-full shadow-md animate-pulse ring-2 ring-yellow-300/50">
                        ⭐ Promoted
                      </div>
                    )}
                    <div className="relative w-full h-56">
                      <Image
                        src={vendor.logo || "/logo.jpg"}
                        alt={vendor.businessName}
                        fill
                        className="object-cover rounded-t-3xl"
                        priority
                      />
                      {vendor.status === "closed" && (
                        <div className="absolute inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center rounded-t-3xl">
                          <span className="text-white text-sm font-semibold">
                            Closed
                          </span>
                        </div>
                      )}
                      <div className="absolute top-3 left-3 bg-white p-2 rounded-full shadow cursor-pointer">
                        <Heart
                          size={20}
                          onClick={toggleFav}
                          color="#AE2108"
                          fill={isFavorite ? "#AE2108" : "none"}
                        />
                      </div>
                    </div>
                    <div className="p-4 space-y-2 sm:space-y-3">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">
                        {vendor.businessName}
                      </h3>
                      <div className="text-xs sm:text-sm text-gray-500 flex flex-wrap gap-x-2 gap-y-1">
                        <span className="truncate">{vendor.category}</span>
                        <span>•</span>
                        <span className="truncate">{vendor.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                        <Clock size={16} className="text-[#AE2108]" />
                        <span>{vendor.deliveryDuration} mins delivery</span>
                      </div>
                      <div className="flex items-center justify-between flex-wrap gap-y-2">
                        <div className="flex items-center gap-1 text-yellow-500">
                          {Array.from({ length: 5 }).map((_, index) => {
                            const rating = vendor.averageRating || 0;
                            if (rating >= index + 1)
                              return (
                                <Star
                                  key={index}
                                  size={14}
                                  fill="currentColor"
                                  stroke="none"
                                />
                              );
                            else if (rating > index && rating < index + 1)
                              return (
                                <StarHalf
                                  key={index}
                                  size={14}
                                  fill="currentColor"
                                  stroke="none"
                                />
                              );
                            else
                              return (
                                <Star
                                  key={index}
                                  size={14}
                                  className="text-gray-300"
                                  fill="none"
                                />
                              );
                          })}
                          <span className="ml-1 text-xs text-gray-600">
                            ({vendor.averageRating || 0})
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            vendor.status === "opened"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {vendor.status}
                        </span>
                      </div>
                      <Link
                        href={
                          vendor.status === "opened"
                            ? `/vendors/menu/${vendor.slug}`
                            : ""
                        }
                        className={`block w-full text-center text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 ${
                          vendor.status === "opened"
                            ? "bg-[#AE2108] text-white hover:bg-[#941B06]"
                            : "bg-gray-300 text-gray-600 cursor-not-allowed"
                        }`}
                      >
                        View Menu
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-gray-500 text-base sm:text-lg">
              No vendors match your filters.
            </p>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-16 flex justify-center items-center gap-6">
              <button
                onClick={goToPrev}
                disabled={currentPage === 1}
                className="px-6 py-2.5 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:border-[#AE2108] hover:text-[#AE2108] hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                ← Previous
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`w-10 h-10 rounded-lg font-semibold transition-all duration-200 ${
                      currentPage === idx + 1
                        ? "bg-[#AE2108] text-white shadow-lg"
                        : "border-2 border-gray-300 text-gray-700 hover:border-[#AE2108] hover:text-[#AE2108]"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={goToNext}
                disabled={currentPage === totalPages}
                className="px-6 py-2.5 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 hover:border-[#AE2108] hover:text-[#AE2108] hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                Next →
              </button>
            </div>
          )}

          {/* Login Modal */}
          {loginModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/20 p-4">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 w-full max-w-xs text-center border border-white/30">
                <p className="mb-4 text-gray-800 font-medium">
                  Please login or sign up to add to favourites.
                </p>
                <button
                  onClick={() => router.push("/Login")}
                  className="bg-[#AE2108] text-white px-6 py-2 rounded-xl hover:bg-[#941B06] transition"
                >
                  Login
                </button>
              </div>
            </div>
          )}
        </section>

        <PromoBanner />

        <Faq />
        <Footer />
      </main>
    </div>
  );
}
