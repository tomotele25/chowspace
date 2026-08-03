"use client";

import { BACKENDURL } from "@/lib/api";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import axios from "axios";
import { ChevronLeft, ChevronRight, Clock, Crown } from "lucide-react";
import "swiper/css";
import "swiper/css/navigation";


const Carousel = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchVendors = async () => {
      try {
        const response = await axios.get(`${BACKENDURL}/api/vendor/getVendors`);
        const data = response.data.vendors || [];
        const promoted = data.filter((vendor) => vendor.isPromoted);
        if (isMounted) setVendors(promoted.slice(0, 5));
      } catch (error) {
        console.error("Error fetching vendors:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVendors();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading || vendors.length === 0) return null;

  return (
    <section className="py-16 px-5 sm:px-20 bg-gray-50 relative">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-[#AE2108] mb-12">
          Handpicked For You
        </h2>

        {/* Custom Navigation */}
        <div className="absolute top-1/2 left-2 z-10 -translate-y-1/2">
          <div className="swiper-button-prev-custom flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md hover:bg-[#AE2108] hover:text-white transition cursor-pointer">
            <ChevronLeft size={20} />
          </div>
        </div>
        <div className="absolute top-1/2 right-2 z-10 -translate-y-1/2">
          <div className="swiper-button-next-custom flex items-center justify-center w-10 h-10 bg-white rounded-full shadow-md hover:bg-[#AE2108] hover:text-white transition cursor-pointer">
            <ChevronRight size={20} />
          </div>
        </div>

        <Swiper
          spaceBetween={24}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 2 },
            768: { slidesPerView: 3 },
            1024: { slidesPerView: 4 },
          }}
          autoplay={{ delay: 4000 }}
          loop
          navigation={{
            nextEl: ".swiper-button-next-custom",
            prevEl: ".swiper-button-prev-custom",
          }}
          modules={[Autoplay, Navigation]}
        >
          {vendors.map((vendor, index) => (
            <SwiperSlide key={index}>
              {vendor.status === "opened" ? (
                <Link href={`/vendors/menu/${vendor.slug}`} passHref>
                  <div className="group relative cursor-pointer bg-white rounded-3xl shadow-md overflow-hidden hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                    {/* Promoted Badge */}
                    {vendor.isPromoted && (
                      <div className="absolute top-3 left-3 z-10 bg-yellow-400 text-black text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-md animate-pulse">
                        <Crown size={14} /> Promoted
                      </div>
                    )}

                    <div className="w-full h-56 relative overflow-hidden">
                      <img
                        src={vendor.logo || "/logo.jpg"}
                        alt={vendor.businessName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>

                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 truncate">
                        {vendor.businessName}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {vendor.category || "Uncategorized"}
                      </p>
                      <p className="text-sm text-gray-500 truncate">
                        {vendor.location || "Unknown location"}
                      </p>

                      {vendor.deliveryDuration && (
                        <div className="flex items-center text-xs text-gray-600 mt-2">
                          <Clock size={14} className="mr-1 text-[#AE2108]" />
                          {vendor.deliveryDuration} mins delivery
                        </div>
                      )}

                      <span className="inline-block mt-4 text-xs font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
                        Open Now
                      </span>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="relative bg-white rounded-3xl shadow-md overflow-hidden opacity-70 cursor-not-allowed">
                  {/* Promoted Badge */}
                  {vendor.isPromoted && (
                    <div className="absolute top-3 left-3 z-10 bg-yellow-400 text-black text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-md animate-pulse">
                      <Crown size={14} /> Promoted
                    </div>
                  )}

                  <div className="w-full h-56 relative">
                    <img
                      src={vendor.logo || "/logo.jpg"}
                      alt={vendor.businessName}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                      {vendor.businessName}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {vendor.category || "Uncategorized"}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {vendor.location || "Unknown location"}
                    </p>
                    <span className="inline-block mt-4 text-xs font-medium px-3 py-1 rounded-full bg-red-100 text-red-600">
                      Opens Tomorrow
                    </span>
                  </div>
                </div>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </section>
  );
};

export default Carousel;
