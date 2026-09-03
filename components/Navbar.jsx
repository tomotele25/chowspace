"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X, ChevronDown, User, Store } from "lucide-react";
import { useSession } from "next-auth/react";

/** Click-toggled "Customer / Vendor" dropdown, closes on an outside click. */
function AuthDropdown({ label, options, scrolled, primary }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={
          primary
            ? "flex items-center gap-1 bg-[#AE2108] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#941B06] transition-all shadow-md shadow-[#AE2108]/25 hover:shadow-[#AE2108]/40 hover:-translate-y-px active:translate-y-0"
            : `flex items-center gap-1 text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 ${
                scrolled
                  ? "text-[#AE2108] hover:bg-[#AE2108]/8"
                  : "text-white/90 hover:text-white hover:bg-white/10"
              }`
        }
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black/5 py-1.5 z-50"
        >
          {options.map((opt) => (
            <Link
              key={opt.href}
              href={opt.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-[#AE2108]/5 hover:text-[#AE2108] transition-colors"
            >
              <opt.icon size={15} className="text-gray-400" />
              {opt.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // Mobile auth: pick who you are once, then Log in / Sign up follow the choice.
  const [mobileAudience, setMobileAudience] = useState("customer");
  const { data: session } = useSession();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "#vendors", label: "Vendors" },
    { href: "#Faq", label: "FAQ" },
    { href: "/blog", label: "Blog" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl shadow-[0_2px_24px_rgba(0,0,0,0.08)]"
          : "bg-transparent"
      }`}
    >
      {/* thin red accent line at very top */}
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#AE2108] to-transparent opacity-60" />

      <nav className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm ring-1 ring-[#AE2108]/20 transition group-hover:ring-[#AE2108]/50">
            <Image
              loading="lazy"
              src="/logo.jpg"
              alt="ChowSpace Logo"
              fill
              className="object-cover"
            />
          </div>
          <span
            className={`text-lg font-bold tracking-tight transition-colors duration-300 ${scrolled ? "text-gray-900" : "text-white"}`}
          >
            <span className="text-[#AE2108]">Chowspace</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 group ${
                scrolled
                  ? "text-gray-600 hover:text-[#AE2108] hover:bg-[#AE2108]/5"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
            >
              {link.label}
              <span className="absolute bottom-1 left-4 right-4 h-px bg-[#AE2108] scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </Link>
          ))}
        </div>

        {/* Auth */}
        <div className="hidden md:flex items-center gap-3">
          {session?.user?.role === "customer" ? (
            <Link
              href="/customers/CustomersProfile"
              className="w-9 h-9 rounded-full bg-[#AE2108] text-white text-sm font-bold flex items-center justify-center shadow-md hover:bg-[#941B06] hover:scale-105 transition-all ring-2 ring-[#AE2108]/20"
            >
              {session?.user?.fullname?.[0]}
            </Link>
          ) : (
            <>
              <AuthDropdown
                label="Sign In"
                scrolled={scrolled}
                options={[
                  { label: "I'm a Customer", href: "/Login?as=customer", icon: User },
                  { label: "I'm a Vendor", href: "/Login?as=vendor", icon: Store },
                ]}
              />
              <AuthDropdown
                label="Sign Up"
                scrolled={scrolled}
                primary
                options={[
                  { label: "I'm a Customer", href: "/Signup", icon: User },
                  { label: "I'm a Vendor", href: "/vendors/Signup", icon: Store },
                ]}
              />
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className={`md:hidden w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            scrolled ? "bg-gray-100 text-gray-700" : "bg-white/15 text-white"
          } hover:scale-105 active:scale-95`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[calc(100vh-4rem)]" : "max-h-0"
        }`}
      >
        <div className="bg-white/97 backdrop-blur-xl border-t border-gray-100 px-5 py-4 space-y-1 shadow-lg max-h-[calc(100vh-4rem)] overflow-y-auto overscroll-contain">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:text-[#AE2108] hover:bg-[#AE2108]/5 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-gray-100 mt-2 flex flex-col gap-2">
            {session?.user?.role === "customer" ? (
              <Link
                href="/customers/CustomersProfile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#AE2108] hover:bg-[#AE2108]/5 transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-[#AE2108] text-white text-xs font-bold flex items-center justify-center">
                  {session?.user?.fullname?.[0]}
                </span>
                My Profile
              </Link>
            ) : (
              (() => {
                const isVendor = mobileAudience === "vendor";
                const loginHref = isVendor
                  ? "/Login?as=vendor"
                  : "/Login?as=customer";
                const signupHref = isVendor ? "/vendors/Signup" : "/Signup";
                return (
                  <div className="space-y-2.5">
                    {/* Who are you? */}
                    <div className="flex p-1 bg-gray-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setMobileAudience("customer")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          !isVendor
                            ? "bg-white text-[#AE2108] shadow-sm"
                            : "text-gray-500"
                        }`}
                      >
                        <User size={14} /> Customer
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileAudience("vendor")}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
                          isVendor
                            ? "bg-white text-[#AE2108] shadow-sm"
                            : "text-gray-500"
                        }`}
                      >
                        <Store size={14} /> Vendor
                      </button>
                    </div>

                    <Link
                      href={loginHref}
                      onClick={() => setIsOpen(false)}
                      className="block w-full text-center text-sm font-semibold text-[#AE2108] border border-[#AE2108]/30 px-4 py-3 rounded-xl hover:bg-[#AE2108]/5 transition-colors"
                    >
                      Log in{isVendor ? " as a vendor" : ""}
                    </Link>
                    <Link
                      href={signupHref}
                      onClick={() => setIsOpen(false)}
                      className="block w-full text-center bg-[#AE2108] text-white px-4 py-3 rounded-xl text-sm font-semibold hover:bg-[#941B06] transition-colors shadow-sm"
                    >
                      Create {isVendor ? "a vendor" : "an"} account
                    </Link>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
