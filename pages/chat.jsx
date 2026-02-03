"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Send,
  Store,
  User,
  CheckCircle2,
  Clock,
  Paperclip,
} from "lucide-react";

const mockMessages = [
  {
    id: 1,
    sender: "vendor",
    text: "Hello 👋 Your order is being prepared.",
    time: "12:01 PM",
  },
  {
    id: 2,
    sender: "user",
    text: "Thank you! How long will it take?",
    time: "12:02 PM",
  },
  { id: 3, sender: "vendor", text: "About 25 minutes 🚴‍♂️", time: "12:03 PM" },
];

export default function Chat() {
  const [messages, setMessages] = useState(mockMessages);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const sendMessage = (text, file) => {
    if (!text && !file) return;

    const newMessage = {
      id: Date.now(),
      sender: "user",
      text: file ? `📎 Sent a receipt: ${file.name}` : text,
      file: file || null,
      time: "Now",
    };

    setMessages([...messages, newMessage]);
    setInput("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);

    // Simulate upload (replace with real upload API)
    setTimeout(() => {
      sendMessage("", file);
      setUploading(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 to-red-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-full bg-[#AE2108]/10 flex items-center justify-center">
          <Store className="text-[#AE2108]" size={20} />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-gray-900">Mama Put Kitchen</h2>
          <p className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle2 size={12} /> Order confirmed
          </p>
        </div>
        <Clock className="text-gray-400" size={18} />
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow ${msg.sender === "user" ? "bg-[#AE2108] text-white rounded-br-sm" : "bg-white text-gray-800 rounded-bl-sm"}`}
            >
              <p>{msg.text}</p>
              {msg.file && (
                <div className="mt-2 border p-2 bg-white rounded-lg shadow-inner flex items-center gap-2">
                  <Paperclip size={16} />
                  <span className="truncate">{msg.file.name}</span>
                </div>
              )}
              <span className="block mt-1 text-[10px] opacity-70 text-right">
                {msg.time}
              </span>
            </div>
          </div>
        ))}
      </main>

      {/* Input */}
      <footer className="bg-white border-t px-4 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer"
            onClick={() => fileInputRef.current.click()}
          >
            <Paperclip size={18} className="text-gray-500" />
          </div>

          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*,application/pdf"
          />

          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#AE2108]"
          />

          <button
            onClick={() => sendMessage(input)}
            className={`w-10 h-10 rounded-full bg-[#AE2108] text-white flex items-center justify-center hover:scale-105 transition ${uploading ? "cursor-not-allowed opacity-60" : ""}`}
            disabled={uploading}
          >
            <Send size={18} />
          </button>
        </div>

        {uploading && (
          <div className="text-xs text-gray-500 text-center">
            Uploading receipt...
          </div>
        )}
      </footer>
    </div>
  );
}
