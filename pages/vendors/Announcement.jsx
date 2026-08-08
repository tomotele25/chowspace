"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { toast } from "react-hot-toast";

import VendorLayout from "@/components/layouts/VendorLayout";

const BACKENDURL =
  "https://chowspace-backend.vercel.app" || "http://localhost:2005";

const Announcement = () => {
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
            },
          );

          if (res?.data?.announcements) {
            setAnnouncements(res.data.announcements);
          }
        }
      } catch (error) {
        console.error("Failed to fetch announcements", error);
        toast.error("Failed to load announcements");
      }
    };

    fetchAnnouncement();
  }, [session, status]);

  return (
    <VendorLayout
      title="Announcements"
      subtitle={
        announcements.length
          ? `${announcements.length} from Chowspace`
          : undefined
      }
    >
      <div className="p-4 md:p-6">
        {announcements.length === 0 ? (
          <p className="text-gray-600 italic">No announcements yet.</p>
        ) : (
          <div className="grid gap-4">
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
    </VendorLayout>
  );
};

export default Announcement;
