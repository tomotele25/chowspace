import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Facebook, Twitter, Instagram } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative bg-[#fdfdfd] border-t border-gray-200 mt-20 text-gray-700 overflow-hidden">
      {/* Background blob for design harmony */}
      <div className="absolute -top-20 -left-20 w-[300px] h-[300px] bg-red-100 opacity-30 rounded-full blur-3xl z-0" />
      <div className="absolute bottom-0 right-0 w-[250px] h-[250px] bg-yellow-100 opacity-30 rounded-full blur-2xl z-0" />

      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
        {/* Logo & Tagline */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Image
              loading="lazy"
              src="/logo.jpg"
              alt="ChowSpace Logo"
              width={35}
              height={35}
            />
            <span className="text-xl font-semibold text-[#AE2108]">
              ChowSpace
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Delicious meals from trusted vendors, right at your doorstep.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <h4 className="font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="#vendors" className="hover:text-[#AE2108]">
                Vendors
              </Link>
            </li>
            <li>
              <Link href="#how-it-works" className="hover:text-[#AE2108]">
                How It Works
              </Link>
            </li>
            <li>
              <Link href="#contact" className="hover:text-[#AE2108]">
                Contact
              </Link>
            </li>
            <li>
              <Link href="/Privacy" className="hover:text-[#AE2108]">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="T&C" className="hover:text-[#AE2108]">
                Terms and conditions
              </Link>
            </li>
          </ul>
        </div>

        {/* Social Media */}
        <div>
          <h4 className="font-semibold mb-3">Follow Us</h4>
          <div className="flex gap-4 text-[#AE2108]">
            <a
              aria-label="View cart"
              href="#"
              className="hover:scale-110 transition"
            >
              <Facebook size={20} />
            </a>
            <a
              aria-label="View cart"
              href="#"
              className="hover:scale-110 transition"
            >
              <Twitter size={20} />
            </a>
            <a
              aria-label="View cart "
              href="#"
              className="hover:scale-110 transition"
            >
              <Instagram size={20} />
            </a>
          </div>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="font-semibold mb-3">Support</h4>
          <p className="text-sm text-gray-600">hello@chowspace.com</p>
          <p className="text-sm text-gray-600 mt-1">0915 258 0773</p>
        </div>
      </div>

      <div className="border-t text-center text-sm text-gray-500 py-4 px-4 relative z-10">
        &copy; {new Date().getFullYear()} Chowspace. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
