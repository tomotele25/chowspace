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
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { Heart, Clock, Star, StarHalf } from "lucide-react";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useCategory } from "@/context/CategoryContext";

const CHRISTMAS = true;

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
  const [loginmodal, setLoginmodal] = useState(false);
  const [isFavorite, setIsFavourite] = useState(null);

  const { data: session } = useSession();
  const { selectedCategory } = useCategory();
  const router = useRouter();
  const vendorsPerPage = 8;
  const BACKENDURL =
    "https://chowspace-backend.vercel.app" || "http://localhost:2005";

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
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = vendors.filter((vendor) => {
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
  });

  const totalPages = Math.ceil(filtered.length / vendorsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * vendorsPerPage,
    currentPage * vendorsPerPage
  );

  const goToNext = () =>
    currentPage < totalPages && setCurrentPage((p) => p + 1);
  const goToPrev = () => currentPage > 1 && setCurrentPage((p) => p - 1);
  const handleLoginModal = () => {
    if (!session?.user) setLoginmodal(!loginmodal);
  };
  const toggleFav = () => setIsFavourite(!isFavorite);

  return (
    <div
      className={`${poppins.variable} font-sans relative overflow-hidden bg-gradient-to-br from-red-50 via-white to-green-50`}
    >
      <Head>
        <title>ChowSpace | Christmas Specials</title>
      </Head>

      {/* ❄️ FALLING SNOW */}
      {CHRISTMAS && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {[...Array(100)].map((_, i) => (
            <span
              key={i}
              className="snow-fall"
              style={{
                left: `${Math.random() * 100}%`,
                fontSize: `${Math.random() * 6 + 4}px`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${Math.random() * 10 + 10}s`,
              }}
            >
              ❄
            </span>
          ))}
        </div>
      )}

      <ScrollToTopBtn />
      <ContactSupport />
      <main>
        <Navbar />
        <Hero />
        <Categories />
        <PromoBanner />
        <Carousel />

        {/* Vendor Cards */}
        <section className="relative px-5 sm:px-10 md:px-20 py-16">
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
            {loading
              ? [...Array(4)].map((_, i) => <VendorSkeletonCard key={i} />)
              : paginated.map((vendor) => {
                  const isPromoted =
                    vendor.promotionExpiresAt &&
                    new Date(vendor.promotionExpiresAt) > new Date();
                  return (
                    <div
                      key={vendor._id}
                      className="relative bg-white rounded-2xl shadow-xl overflow-hidden transition hover:scale-[1.02]"
                    >
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

                      <div className="relative h-56">
                        <Image
                          src={vendor.logo || "/logo.jpg"}
                          alt={vendor.businessName}
                          fill
                          className="object-cover"
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
                          className="absolute top-3 left-3 bg-white p-1.5 rounded-full shadow cursor-pointer z-20"
                        >
                          <Heart
                            size={18}
                            onClick={toggleFav}
                            color="#AE2108"
                            fill={isFavorite ? "#AE2108" : "none"}
                          />
                        </div>
                        {isPromoted && (
                          <div className="absolute top-3 right-3 z-20 bg-yellow-400 text-[#AE2108] px-2 py-1 text-xs font-bold rounded-full shadow-md animate-pulse ring-2 ring-yellow-300/50">
                            ⭐ Promoted
                          </div>
                        )}
                      </div>

                      <div className="p-4 space-y-2 relative z-20">
                        <h3 className="font-bold text-gray-900 truncate">
                          {vendor.businessName}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {vendor.category} • {vendor.location}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <Clock size={14} /> {vendor.deliveryDuration} mins
                        </div>
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

                        <Link
                          href={
                            vendor.status === "opened"
                              ? `/vendors/menu/${vendor.slug}`
                              : ""
                          }
                          className={`block w-full text-center text-xs sm:text-sm font-semibold px-4 py-2 rounded-md transition-all duration-200 ${
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
        </section>

        <Faq />
        <Footer />
      </main>

      {/* 🎄 CHRISTMAS EFFECT CSS */}
      <style jsx>{`
        /* Falling snow */
        .snow-fall {
          position: absolute;
          top: -10px;
          color: white;
          opacity: 0.9;
          animation-name: fall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }

        @keyframes fall {
          0% {
            transform: translateY(0);
            opacity: 0.9;
          }
          100% {
            transform: translateY(110vh);
            opacity: 0.9;
          }
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
}
