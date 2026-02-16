"use client";

import { Poppins } from "next/font/google";
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
import IOSInstallNotice from "@/components/IOSInstallNotice";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { Heart, Clock, Star, StarHalf } from "lucide-react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCategory } from "@/context/CategoryContext";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export default function Home() {
  const [vendors, setVendors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [loginModal, setLoginModal] = useState(false);
  const [isFavorite, setIsFavorite] = useState(null);

  const { data: session } = useSession();
  const { selectedCategory } = useCategory();
  const router = useRouter();
  const vendorsPerPage = 8;
  const BACKENDURL = "https://chowspace-backend.vercel.app";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorsRes, locationsRes] = await Promise.all([
          axios.get(`${BACKENDURL}/api/vendor/getVendors`),
          axios.get(`${BACKENDURL}/api/getLocations`),
        ]);
        setVendors(vendorsRes.data.vendors);
        setLocations(locationsRes.data.locations);
      } catch (err) {
        console.error("Error fetching vendors:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      className={`${poppins.variable} font-sans relative overflow-hidden bg-gradient-to-br from-red-50 via-white to-green-50`}
    >
      <Head>
        <title>ChowSpace | Order Meals from Trusted Vendors</title>
      </Head>

      <ScrollToTopBtn />
      <ContactSupport />
      <main>
        <Navbar />
        <Hero />
        <Categories />
        <PromoBanner />
        <Carousel />

        {/* Vendor Section */}
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
          {loading ? (
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

        <Faq />
        <Footer />
      </main>
    </div>
  );
}
