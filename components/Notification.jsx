"use client";

import { BACKENDURL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { Bell } from "lucide-react";


const Notification = () => {
  const { data: session, status } = useSession();
  const [unreadAnnouncements, setUnreadAnnouncements] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      if (status === "authenticated" && session?.user?.role) {
        try {
          const res = await axios.get(
            `${BACKENDURL}/api/announcement/${session.user.role + "s"}`,
            {
              headers: {
                Authorization: `Bearer ${session.user.accessToken}`,
              },
            }
          );
          setUnreadAnnouncements(res.data.announcements || []);
        } catch (err) {
          console.error("Error fetching announcements:", err);
        }
      }
    };

    fetchAnnouncements();
  }, [status, session]);

  const latest = unreadAnnouncements?.[0];

  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Notification Bell */}
      <span className="pt-2">
        <Bell
          className="text-[#AE2108] group-hover:animate-wiggle"
          fill="#AE2108"
          size={28}
        />
      </span>

      {/* Unread Dot */}
      {unreadAnnouncements.length > 0 && (
        <span className="absolute top-1 right-0 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
        </span>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute top-10 right-0 z-50 flex flex-col gap-2 p-3 w-64 bg-white border border-red-200 shadow-xl rounded-xl transition-all duration-300">
          {latest ? (
            <>
              <h4 className="text-sm font-semibold text-[#AE2108]">
                {latest.header || "New Announcement"}
              </h4>
              <p className="text-xs text-gray-700">{latest.message}</p>
            </>
          ) : (
            <p className="text-xs text-gray-400 italic">No new announcements</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Notification;
