"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import AdminLayout from "@/components/layouts/AdminLayout";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { ArrowRightLeftIcon, Menu, X } from "lucide-react";
import { useRouter } from "next/router";

const BACKENDURL =
  "https://chowspace-backend.vercel.app" || "http://localhost:2005";

const AdminContactSupport = () => {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [unreadMap, setUnreadMap] = useState({});
  const router = useRouter();
  const chatRef = useRef(null);

  const getToken = () => session?.user?.accessToken || "";

  useEffect(() => {
    if (session?.user?.accessToken) {
      fetchTickets();
      const interval = setInterval(fetchTickets, 5000);
      return () => clearInterval(interval);
    }
  }, [session?.user?.accessToken]);

  // 🔁 Poll selected ticket messages every 15s
  useEffect(() => {
    if (selectedTicket?._id && session?.user?.accessToken) {
      const interval = setInterval(() => {
        fetchMessages(selectedTicket._id);
      }, 15000);
      return () => clearInterval(interval);
    }
  }, [selectedTicket?._id, session?.user?.accessToken]);

  const fetchTickets = async () => {
    try {
      const res = await axios.get(`${BACKENDURL}/api/support/tickets`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const fetchedTickets = res.data.tickets || [];

      const updatedUnreadMap = { ...unreadMap };
      fetchedTickets.forEach((ticket) => {
        const previous = tickets.find((t) => t._id === ticket._id);
        if (
          previous &&
          previous.lastMessageAt !== ticket.lastMessageAt &&
          selectedTicket?._id !== ticket._id
        ) {
          updatedUnreadMap[ticket._id] = true;
        }
      });

      setUnreadMap(updatedUnreadMap);
      setTickets(fetchedTickets);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tickets");
    }
  };

  const fetchMessages = async (ticketId) => {
    try {
      const res = await axios.get(
        `${BACKENDURL}/api/admin/ticket/${ticketId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      setMessages(res.data.messages || []);
      scrollToBottom();
      setUnreadMap((prev) => ({ ...prev, [ticketId]: false }));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load messages");
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    fetchMessages(ticket._id);
    setSidebarOpen(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;
    setLoading(true);
    try {
      const res = await axios.post(
        `${BACKENDURL}/api/ticket/${selectedTicket._id}/reply`,
        { message: newMessage },
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );
      setMessages((prev) => [...prev, res.data.supportMessage]);
      setNewMessage("");
      scrollToBottom();
    } catch (err) {
      console.error(err);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="Support" subtitle="Customer tickets">
      {/* Two panes inside the shell: the ticket list is page content,
          not navigation, so it keeps its own column. */}
      <div className="flex h-[calc(100vh-4rem)]">
        <aside className="w-72 flex-shrink-0 bg-gray-100 border-r hidden sm:flex flex-col">
          <div className="p-4 border-b bg-white flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">Support Tickets</h2>
          </div>
        <nav className="p-4 space-y-2 overflow-y-auto h-[calc(100%-4rem)]">
          {tickets.length === 0 ? (
            <p className="text-gray-600">No tickets found</p>
          ) : (
            tickets.map((ticket) => (
              <button
                key={ticket._id}
                onClick={() => handleSelectTicket(ticket)}
                className={`relative block w-full text-left px-3 py-2 rounded ${
                  selectedTicket?._id === ticket._id
                    ? "bg-[#AE2108] text-white"
                    : "hover:bg-gray-200"
                }`}
              >
                <p className="font-medium">{ticket.subject}</p>
                <p className="text-xs text-gray-600">Status: {ticket.status}</p>
                {unreadMap[ticket._id] && (
                  <span className="absolute top-2 right-2 text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">
                    New
                  </span>
                )}
              </button>
            ))
          )}
        </nav>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-4 py-3 border-b bg-white flex-shrink-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {selectedTicket
                ? `Ticket: ${selectedTicket.subject}`
                : "Select a ticket"}
            </p>
          </div>
        {/* Chat Body */}
        <div ref={chatRef} className="flex-1 overflow-y-auto p-4 bg-white">
          {!selectedTicket ? (
            <p className="text-gray-500">Please select a ticket</p>
          ) : messages.length === 0 ? (
            <p className="text-gray-500">No messages yet</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg._id}
                className={`max-w-[70%] mb-3 p-2 rounded text-sm ${
                  msg.senderModel === "Admin"
                    ? "bg-[#AE2108] text-white ml-auto"
                    : "bg-gray-200 text-gray-900"
                }`}
              >
                <p>{msg.message}</p>
                <small className="text-xs text-gray-400 block mt-1">
                  {new Date(msg.createdAt).toLocaleString()}
                </small>
              </div>
            ))
          )}
        </div>

        {/* Chat Input */}
        {selectedTicket && (
          <footer className="p-4 bg-gray-100 border-t flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your reply..."
              className="flex-1 border px-3 py-2 rounded outline-none"
              disabled={loading}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-[#AE2108] text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              Send
            </button>
          </footer>
        )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminContactSupport;
