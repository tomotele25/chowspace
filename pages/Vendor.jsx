"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Heart, Clock, Star, StarHalf } from "lucide-react";
import { useRouter } from "next/router";
import VendorSkeletonCard from "@/components/VendorSkeletonCard";
import ErrorState from "@/components/ErrorState";
import { useSession } from "next-auth/react";
import Head from "next/head";
import { useCategory } from "@/context/CategoryContext"; // import your context hook

const Vendor = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [loginmodal, setLoginmodal] = useState(false);
  const [isFavorite, setIsFavourite] = useState(null);
  const { data: session } = useSession();
  const { selectedCategory } = useCategory();

  const vendorsPerPage = 8;
  const router = useRouter();
  const BACKENDURL =
    "https://chowspace-backend.vercel.app" || "http://localhost:2005";

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

  const filteredAndSortedVendors = vendors
    .filter((vendor) => {
      const matchSearch =
        vendor.fullname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      return bPromo - aPromo;
    });

  const totalPages = Math.ceil(
    filteredAndSortedVendors.length / vendorsPerPage
  );
  const paginated = filteredAndSortedVendors.slice(
    (currentPage - 1) * vendorsPerPage,
    currentPage * vendorsPerPage
  );

  const goToNext = () =>
    currentPage < totalPages && setCurrentPage((p) => p + 1);
  const goToPrev = () => currentPage > 1 && setCurrentPage((p) => p - 1);

  const handleLoginModal = () => {
    if (!session?.user) {
      setLoginmodal(!loginmodal);
    }
  };

  const toggleFav = () => {
    setIsFavourite(!isFavorite);
  };

  return (
    <>
      <Head>
        <title>ChowSpace | Order Meals from Trusted Vendors</title>
        <meta
          name="description"
          content="Chowspace vendors.Order from your favourite vendor"
        />
        <link rel="canonical" href="https://chowspace.ng/Vendor" />
        <meta
          property="og:title"
          content="ChowSpace | Order Meals from Trusted Vendors"
        />
        <meta
          property="og:description"
          content="Order food from trusted local vendors near you with ChowSpace. Easy checkout, fast delivery."
        />
        <meta property="og:url" content="https://chowspace.ng/Vendor" />
        <meta
          property="og:image"
          content="https://chowspace.ng/og-preview.jpg"
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="ChowSpace | Order Meals from Trusted Vendors"
        />
        <meta
          name="twitter:description"
          content="Order meals fast and fresh from vendors near you."
        />
        <meta
          name="twitter:image"
          content="https://chowspace.ng/og-preview.jpg"
        />
      </Head>
      <section className="relative px-5 sm:px-20 py-16 min-h-screen bg-[#fffdfc] overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-[#AE2108]  mb-2">
              Discover Top Vendors
            </h2>
            <p className="text-gray-500 max-w-md mx-auto">
              Find the best meals from vendors around you and enjoy swift
              delivery.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-10">
            <input
              type="text"
              placeholder="Search vendors or categories..."
              className="w-full md:w-1/2 px-4 py-2 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-[#AE2108] outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full md:w-1/4 px-4 py-2 rounded-lg border border-gray-300 shadow-sm text-black focus:ring-2 focus:ring-[#AE2108] outline-none"
            >
              <option value="All">All Locations</option>
              {locations.map((loc, i) => (
                <option key={i} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {vendorsError ? (
            <ErrorState
              title="Couldn't load vendors"
              message="Something went wrong fetching vendors. Please try again."
              onRetry={() => retryVendors()}
            />
          ) : loading ? (
            <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {[...Array(5)].map((_, i) => (
                <VendorSkeletonCard key={i} />
              ))}
            </div>
          ) : paginated.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {paginated.map((vendor) => {
                const isPromoted =
                  vendor.promotionExpiresAt &&
                  new Date(vendor.promotionExpiresAt) > new Date();

                return (
                  <div
                    key={vendor._id}
                    className={`group relative bg-white border rounded-2xl overflow-hidden transition-all duration-300 shadow-md hover:shadow-xl ${
                      isPromoted
                        ? "border-transparent bg-gradient-to-br from-yellow-100 to-white hover:scale-[1.015]"
                        : "border-gray-200"
                    }`}
                  >
                    {isPromoted && (
                      <div className="absolute top-3 right-3 z-10 bg-yellow-400 text-[#AE2108] px-2 py-1 text-xs font-bold rounded-full shadow-md animate-pulse ring-2 ring-yellow-300/50">
                        ⭐ Promoted
                      </div>
                    )}

                    <div className="relative w-full h-48">
                      <Image
                        src={vendor.logo || "/logo.jpg"}
                        alt={vendor.businessName}
                        fill
                        className="object-cover"
                        priority
                      />

                      {vendor.status === "closed" && (
                        <div className="absolute inset-0 backdrop-blur-sm bg-black/40 flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            Closed
                          </span>
                        </div>
                      )}

                      <div
                        onClick={handleLoginModal}
                        className="absolute top-3 left-3 bg-white p-1.5 rounded-full shadow"
                      >
                        <Heart
                          size={18}
                          onClick={toggleFav}
                          color="#AE2108"
                          fill={isFavorite ? "#AE2108" : "none"}
                        />
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {vendor.businessName}
                      </h3>
                      <div className="text-sm text-gray-500 flex flex-wrap gap-x-2 gap-y-1">
                        <span className="truncate">{vendor.category}</span>
                        <span>•</span>
                        <span className="truncate">{vendor.location}</span>
                      </div>

                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock size={16} className="text-[#AE2108]" />
                        <span>{vendor.deliveryDuration} mins delivery</span>
                      </div>

                      <div className="flex items-center justify-between flex-wrap gap-y-2">
                        <div className="flex items-center gap-1 text-yellow-500">
                          {Array.from({ length: 5 }).map((_, index) => {
                            const rating = vendor.averageRating || 0;
                            if (rating >= index + 1) {
                              return (
                                <Star
                                  key={index}
                                  size={16}
                                  fill="currentColor"
                                  stroke="none"
                                />
                              );
                            } else if (rating > index && rating < index + 1) {
                              return (
                                <StarHalf
                                  key={index}
                                  size={16}
                                  fill="currentColor"
                                  stroke="none"
                                />
                              );
                            } else {
                              return (
                                <Star
                                  key={index}
                                  size={16}
                                  className="text-gray-300"
                                  fill="none"
                                />
                              );
                            }
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
                        className={`block w-full text-center text-sm font-semibold px-4 py-2 rounded-md transition-all duration-200 ${
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
            <p className="text-center text-gray-500">
              No vendors match your filters.
            </p>
          )}

          {totalPages > 1 && (
            <div className="mt-10 flex justify-center items-center gap-6">
              <button
                onClick={goToPrev}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={goToNext}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-100 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {loginmodal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-white/10">
            <div className="bg-white/70 backdrop-blur-xl rounded-xl shadow-xl p-6 w-80 text-center border border-white/30">
              <p className="mb-4 text-gray-800 font-medium">
                Please login or sign up to add to favourites.
              </p>
              <button
                onClick={() => router.push("/Login")}
                className="bg-[#AE2108] text-white px-4 py-2 rounded hover:bg-[#941B06] transition"
              >
                Login
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default Vendor;
