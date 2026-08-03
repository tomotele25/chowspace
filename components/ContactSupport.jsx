"use client";

import { BACKENDURL } from "@/lib/api";
import { useEffect, useState, useRef } from "react";
import { Headset, X } from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";


export default function ContactSupport() {
  const [open, setOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatMode, setChatMode] = useState(false);
  const [ticketId, setTicketId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const chatRef = useRef(null);
  const { data: session } = useSession();

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, 100);
  };

  const fetchMessages = async (id) => {
    try {
      if (!id) return;
      const res = await axios.get(`${BACKENDURL}/api/ticket/${id}/messages`, {
        headers: {
          Authorization: `Bearer ${session?.user?.accessToken}`,
        },
      });
      
      setMessages(res.data.messages || []);
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  const sendTicket = async (topic) => {
    if (!session) {
      toast.error("Please log in to contact support.");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(
        `${BACKENDURL}/api/support/ticket/create`,
        {
          subject: topic,
          message: `User selected topic: ${topic}`,
        },
        {
          headers: {
            Authorization: `Bearer ${session?.user?.accessToken}`,
          },
        }
      );

      if (res.data.success) {
        const id = res.data.ticket._id;
        setTicketId(id);
        setChatMode(true);
        setSelected(topic);
        localStorage.setItem("chowspace_ticketId", id);
        localStorage.setItem("chowspace_chatMode", "true");
        localStorage.setItem("chowspace_selected", topic);
        fetchMessages(id);
      } else {
        toast.error("Failed to submit ticket.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const res = await axios.post(
        `${BACKENDURL}/api/ticket/${ticketId}/reply/customer`,
        {
          message: newMessage,
        },
        {
          headers: {
            Authorization: `Bearer ${session?.user?.accessToken}`,
          },
        }
      );
      setMessages((prev) => [...prev, res.data.supportMessage]);
      setNewMessage("");
      scrollToBottom();
    } catch (err) {
      console.error(err);
      toast.error("Message not sent");
    }
  };

  // 🔁 Fetch messages every 15 seconds while chat is active
  useEffect(() => {
    if (chatMode && ticketId && session?.user?.accessToken) {
      const interval = setInterval(() => {
        fetchMessages(ticketId);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [chatMode, ticketId, session?.user?.accessToken]);

  const handleClose = () => {
    setOpen(false);
    setIsMinimized(false);
    setSelected(null);
    setChatMode(false);
    setMessages([]);
    setTicketId(null);
    localStorage.removeItem("chowspace_ticketId");
    localStorage.removeItem("chowspace_chatMode");
    localStorage.removeItem("chowspace_selected");
  };

  return (
    <>
      <button
        onClick={() => {
          if (!open) {
            setOpen(true);
            setIsMinimized(false);

            if (session?.user?.accessToken) {
              const savedTicketId = localStorage.getItem("chowspace_ticketId");
              const savedMode = localStorage.getItem("chowspace_chatMode");
              const savedTopic = localStorage.getItem("chowspace_selected");

              if (savedTicketId && savedMode === "true") {
                setTicketId(savedTicketId);
                setChatMode(true);
                setSelected(savedTopic);
                fetchMessages(savedTicketId);
              }
            }
          } else {
            setIsMinimized(!isMinimized);
          }
        }}
        className="fixed bottom-6 right-6 z-50 bg-[#AE2108] hover:bg-red-800 text-white p-3 rounded-full shadow-lg transition"
        title="Contact ChowSpace Support"
        aria-label="Open Support Chat"
      >
        <Headset className="w-5 h-5" />
      </button>

      {open && !isMinimized && (
        <div className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col h-[520px] max-h-[90vh] animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#AE2108] rounded-t-2xl shadow-md">
            <h2 className="text-white font-semibold text-lg tracking-wide">
              ChowSpace Help
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMinimized(true)}
                className="text-white text-xl font-bold hover:text-gray-300"
                title="Minimize"
              >
                –
              </button>
              <button
                onClick={handleClose}
                className="text-white hover:text-gray-300 focus:outline-none"
                aria-label="Close Chat"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          <div
            ref={chatRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
            style={{ scrollbarWidth: "thin" }}
          >
            {!session ? (
              <p className="text-gray-700 text-center font-medium">
                🚫 You need to{" "}
                <a
                  href="/Login"
                  className="text-[#AE2108] underline hover:text-red-800"
                >
                  log in
                </a>{" "}
                to contact support.
              </p>
            ) : !chatMode ? (
              <>
                <p className="mb-4 text-gray-700 font-semibold text-base">
                  👋 How can we help you today?
                </p>
                {[
                  "Orders & Deliveries",
                  "Payments & Refunds",
                  "Account & Login Issues",
                  "Vendor Menus or Food",
                  "App or Website Bugs",
                  "Other Questions",
                ].map((topic, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelected(topic);
                      sendTicket(topic);
                    }}
                    disabled={loading}
                    className="w-full text-left bg-white hover:bg-gray-100 shadow rounded-lg px-4 py-3 font-medium text-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading && selected === topic ? "Creating..." : topic}
                  </button>
                ))}
              </>
            ) : (
              <div className="flex flex-col space-y-4">
                {messages.map((msg, idx) => {
                  const isUser = msg.senderId === session?.user?.id;
                  const senderName = isUser ? "You" : "Admin";

                  return (
                    <div
                      key={idx}
                      className={`max-w-[80%] p-4 rounded-xl break-words whitespace-pre-line shadow-sm
                        ${
                          isUser
                            ? "bg-[#AE2108] text-white self-end"
                            : "bg-white text-gray-900 self-start"
                        }`}
                      style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                    >
                      <div className="flex items-center mb-1 space-x-2">
                        <span className="font-semibold text-sm select-none">
                          {senderName}
                        </span>
                        {!isUser && (
                          <span
                            className="inline-block w-3 h-3 bg-green-500 rounded-full"
                            title="Admin Online"
                            aria-label="Admin is online"
                          />
                        )}
                      </div>
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                      <small className="text-xs text-gray-400 mt-2 block select-none">
                        {new Date(msg.createdAt).toLocaleString()}
                      </small>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Input Area */}
          {chatMode && (
            <footer className="flex items-center gap-3 p-4 border-t border-gray-200 bg-white rounded-b-2xl shadow-inner">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#AE2108] focus:border-transparent text-sm transition"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newMessage.trim()) sendMessage();
                }}
                aria-label="Message input"
                autoFocus
              />
              <button
                onClick={sendMessage}
                disabled={loading || !newMessage.trim()}
                className="px-5 py-2 rounded-full bg-[#AE2108] text-white font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed select-none"
                aria-label="Send message"
              >
                Send
              </button>
            </footer>
          )}
        </div>
      )}
    </>
  );
}
