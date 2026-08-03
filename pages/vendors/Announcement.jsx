"use client";

import { BACKENDURL } from "@/lib/api";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import axios from "axios";


const Announcement = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [announcements, setAnnouncements] = useState([]);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        if (status === "authenticated" && session?.user) {
          const role = session.user.role;
          const token = session.user.accessToken;
          const res = await axios.get(
            `${BACKENDURL}/api/announcement/${role + "s"}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (res?.data?.announcements) {
            setAnnouncements(res.data.announcements);
          }
        }
      } catch (error) {
        console.error("Failed to fetch announcements", error);
      }
    };

    fetchAnnouncement();
  }, [session, status]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 md:p-10">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-[#AE2108] hover:underline mb-6"
      >
        <ArrowLeft size={18} />
        <span className="font-medium">Back</span>
      </button>

      {/* Title */}
      <h1 className="text-2xl md:text-3xl font-bold text-[#AE2108] mb-6">
        Announcements
      </h1>

      {/* No Announcement */}
      {announcements.length === 0 ? (
        <p className="text-gray-600 italic">No announcements yet.</p>
      ) : (
        <div className="grid gap-4 max-h-[75vh] overflow-y-auto pr-1">
          {announcements.map((a, index) => (
            <div
              key={index}
              className="bg-white border-l-4 border-[#AE2108] shadow p-4 rounded-lg transition hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-gray-800">
                {a.header}
              </h2>
              <p className="text-sm text-gray-700 mt-1">{a.message}</p>
              <p className="text-xs text-gray-500 mt-2 italic">
                {new Date(a.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Announcement;
