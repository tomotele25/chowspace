"use client";

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  Store,
  Mail,
  Phone,
  MapPin,
  User,
  Lock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  MessageCircle,
  CreditCard,
  Landmark,
  Eye,
  EyeOff,
} from "lucide-react";

const BACKENDURL = "https://chowspace-backend.vercel.app";

// Matches the Vendor.category enum on the backend.
const BUSINESS_TYPES = [
  { value: "restaurant", label: "Restaurant" },
  { value: "drinks", label: "Drinks" },
  { value: "pharmacy", label: "Pharmacy" },
  { value: "mall", label: "Supermarket / Mall" },
];

const PAYMENT_METHODS = [
  {
    value: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
    hint: "Customers order and settle with you directly on WhatsApp",
  },
  {
    value: "paystack",
    label: "Paystack",
    icon: CreditCard,
    hint: "Card and transfer, paid into your Chowspace wallet",
  },
  {
    value: "monei",
    label: "Bank transfer",
    icon: Landmark,
    hint: "A dedicated account number per order",
  },
];

const STEPS = ["Your details", "Your business", "Payments"];

export default function VendorSignup() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    fullname: "",
    email: "",
    contact: "",
    password: "",
    businessName: "",
    category: "",
    location: "",
    address: "",
  });
  const [methods, setMethods] = useState(["whatsapp"]);

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const toggleMethod = (value) =>
    setMethods((prev) =>
      prev.includes(value) ? prev.filter((m) => m !== value) : [...prev, value],
    );

  const stepValid = () => {
    if (step === 0) {
      return (
        form.fullname.trim().length > 1 &&
        /\S+@\S+\.\S+/.test(form.email) &&
        form.contact.trim().length >= 7 &&
        form.password.length >= 8
      );
    }
    if (step === 1) {
      return (
        form.businessName.trim().length > 1 &&
        form.category &&
        form.location.trim() &&
        form.address.trim()
      );
    }
    return methods.length > 0;
  };

  const next = () => {
    if (!stepValid()) {
      toast.error("Fill in everything on this step to continue");
      return;
    }
    setStep((s) => s + 1);
  };

  const submit = async () => {
    if (!stepValid() || loading) return;
    setLoading(true);
    const id = toast.loading("Creating your store…");

    try {
      const res = await axios.post(`${BACKENDURL}/api/vendor/create`, {
        ...form,
        email: form.email.trim().toLowerCase(),
        paymentMethods: methods,
      });
      toast.dismiss(id);
      setDone({
        email: form.email.trim().toLowerCase(),
        emailSent: res.data?.emailSent !== false,
      });
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Couldn't create your account",
        { id },
      );
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    const id = toast.loading("Sending…");
    try {
      const res = await axios.post(
        `${BACKENDURL}/api/auth/resend-verification`,
        { email: done.email },
      );
      toast.success(res.data?.message || "Sent", { id });
    } catch {
      toast.error("Couldn't send it. Try again shortly.", { id });
    }
  };

  const field =
    "w-full pl-10 pr-4 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm outline-none transition focus:border-[#AE2108]";

  /* ── Confirmation screen ───────────────────────────────────────────── */
  if (done) {
    return (
      <>
        <Head>
          <title>Check your email | Chowspace</title>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center px-4">
          <Toaster position="top-right" />
          <div className="max-w-md w-full bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <Image
              src="/logo.jpg"
              alt="Chowspace"
              width={56}
              height={56}
              className="w-14 h-14 rounded-2xl object-cover mx-auto mb-4 shadow-sm"
            />
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-full mb-3">
              <Mail size={12} /> Confirmation sent
            </span>
            <h1 className="text-lg font-black text-gray-900">
              Check your email
            </h1>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              We sent a confirmation link to{" "}
              <span className="font-semibold text-gray-900">{done.email}</span>.
              Click it to log in and start setting up your store.
            </p>

            {!done.emailSent && (
              <p className="mt-4 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3">
                We couldn&apos;t send it just now. Use the button below to try
                again.
              </p>
            )}

            <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                What happens next
              </p>
              <ol className="text-xs text-gray-600 space-y-1.5 leading-relaxed list-decimal list-inside">
                <li>Confirm your email and log in</li>
                <li>Add your logo and at least 7 products</li>
                <li>
                  Upload your CAC, a valid ID and proof of address
                </li>
                <li>We review them, then your store goes live</li>
              </ol>
            </div>

            <button
              onClick={resend}
              className="mt-5 text-xs font-bold text-[#AE2108] hover:underline"
            >
              Resend the confirmation email
            </button>
            <p className="mt-4 text-xs text-gray-400">
              Already confirmed?{" "}
              <Link href="/Login" className="text-[#AE2108] font-semibold">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </>
    );
  }

  /* ── Wizard ────────────────────────────────────────────────────────── */
  return (
    <>
      <Head>
        <title>Sell on Chowspace | Register your business</title>
        <meta
          name="description"
          content="Register your restaurant, store or pharmacy on Chowspace and start taking orders."
        />
      </Head>

      <div className="min-h-screen bg-[#F7F5F2] px-4 py-10">
        <Toaster position="top-right" />

        <div className="max-w-lg mx-auto">
          <div className="text-center mb-6">
            <Link href="/" className="inline-block">
              <Image
                src="/logo.jpg"
                alt="Chowspace"
                width={64}
                height={64}
                priority
                className="w-16 h-16 rounded-2xl object-cover mx-auto mb-3 shadow-sm"
              />
            </Link>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              Sell on Chowspace
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Set up your store in a couple of minutes.
            </p>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-1.5 mb-6">
            {STEPS.map((label, i) => (
              <div key={label} className="flex-1">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    i <= step ? "bg-[#AE2108]" : "bg-gray-200"
                  }`}
                />
                <p
                  className={`mt-1.5 text-[10px] font-bold uppercase tracking-wider ${
                    i <= step ? "text-[#AE2108]" : "text-gray-300"
                  }`}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            {step === 0 && (
              <div className="space-y-3">
                {[
                  { key: "fullname", icon: User, placeholder: "Your full name", type: "text" },
                  { key: "email", icon: Mail, placeholder: "you@example.com", type: "email" },
                  { key: "contact", icon: Phone, placeholder: "Phone number", type: "tel" },
                ].map(({ key, icon: Icon, placeholder, type }) => (
                  <div key={key} className="relative">
                    <Icon
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={type}
                      value={form[key]}
                      onChange={set(key)}
                      placeholder={placeholder}
                      className={field}
                    />
                  </div>
                ))}

                <div className="relative">
                  <Lock
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    placeholder="Password (at least 8 characters)"
                    className={field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-3">
                <div className="relative">
                  <Store
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    value={form.businessName}
                    onChange={set("businessName")}
                    placeholder="Business name"
                    className={field}
                  />
                </div>

                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
                    What do you sell?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {BUSINESS_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() =>
                          setForm((p) => ({ ...p, category: t.value }))
                        }
                        className={`py-2.5 rounded-xl text-xs font-bold border-2 transition ${
                          form.category === t.value
                            ? "border-[#AE2108] bg-[#AE2108]/5 text-[#AE2108]"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    value={form.location}
                    onChange={set("location")}
                    placeholder="Town or city (e.g. Abeokuta)"
                    className={field}
                  />
                </div>

                <div className="relative">
                  <MapPin
                    size={16}
                    className="absolute left-3.5 top-3.5 text-gray-400"
                  />
                  <textarea
                    value={form.address}
                    onChange={set("address")}
                    placeholder="Street address"
                    rows={2}
                    className={`${field} resize-none`}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 leading-relaxed">
                  How should customers pay you? Pick as many as you like — you
                  can change this later.
                </p>

                {PAYMENT_METHODS.map(({ value, label, icon: Icon, hint }) => {
                  const on = methods.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleMethod(value)}
                      className={`w-full text-left flex items-start gap-3 p-3.5 rounded-xl border-2 transition ${
                        on
                          ? "border-[#AE2108] bg-[#AE2108]/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          on ? "bg-[#AE2108]/10" : "bg-gray-50"
                        }`}
                      >
                        <Icon
                          size={16}
                          className={on ? "text-[#AE2108]" : "text-gray-400"}
                        />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-bold text-gray-900">
                          {label}
                        </span>
                        <span className="block text-[11px] text-gray-500 mt-0.5 leading-snug">
                          {hint}
                        </span>
                      </span>
                      {on && (
                        <CheckCircle2
                          size={17}
                          className="text-[#AE2108] flex-shrink-0 mt-1"
                        />
                      )}
                    </button>
                  );
                })}

                {methods.length === 0 && (
                  <p className="text-xs text-red-600">
                    Choose at least one payment method.
                  </p>
                )}
              </div>
            )}

            {/* Nav */}
            <div className="flex items-center justify-between gap-3 mt-6">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900"
                >
                  <ChevronLeft size={15} /> Back
                </button>
              ) : (
                <Link
                  href="/Login"
                  className="text-xs font-semibold text-gray-500 hover:text-gray-900"
                >
                  I already have an account
                </Link>
              )}

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={next}
                  className="flex items-center gap-1.5 bg-[#AE2108] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#941B06] transition"
                >
                  Continue <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={loading || methods.length === 0}
                  className="flex items-center gap-2 bg-[#AE2108] text-white text-sm font-bold px-6 py-2.5 rounded-xl hover:bg-[#941B06] transition disabled:opacity-40"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Creating…
                    </>
                  ) : (
                    "Create my store"
                  )}
                </button>
              )}
            </div>
          </div>

          <p className="text-[11px] text-gray-400 text-center mt-4 leading-relaxed">
            You&apos;ll need your CAC certificate, a valid ID and proof of
            address to go live. You can upload those from your dashboard after
            signing up.
          </p>
        </div>
      </div>
    </>
  );
}
