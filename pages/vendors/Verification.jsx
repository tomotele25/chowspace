"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import {
  ChevronLeft,
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Upload,
  FileText,
  ShieldCheck,
} from "lucide-react";
import { BACKENDURL } from "@/lib/api";

const DOCUMENT_HINTS = {
  cac: "Your CAC certificate or business name registration",
  identification: "NIN slip, driver's licence, voter's card or passport",
  proof_of_address: "A utility bill or bank statement from the last 3 months",
};

export default function Verification() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const fileInputRef = useRef(null);
  const targetKind = useRef(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/Login");
  }, [authStatus, router]);

  const load = useCallback(async () => {
    if (!session?.user?.accessToken) return;
    try {
      const res = await axios.get(
        `${BACKENDURL}/api/vendor/verification/status`,
        { headers: { Authorization: `Bearer ${session.user.accessToken}` } },
      );
      setData(res.data);
    } catch {
      toast.error("Couldn't load your verification status");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const upload = async (kind, file) => {
    if (!file) return;
    setUploading(kind);
    const id = toast.loading("Uploading…");
    try {
      const form = new FormData();
      form.append(kind, file);
      const res = await axios.post(
        `${BACKENDURL}/api/vendor/verification/documents`,
        form,
        {
          headers: {
            Authorization: `Bearer ${session?.user?.accessToken}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );
      toast.success(res.data?.message || "Uploaded", { id });
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Upload failed", { id });
    } finally {
      setUploading(null);
    }
  };

  const statusBanner = () => {
    const s = data?.verificationStatus;
    if (data?.live) {
      return {
        tone: "bg-green-50 border-green-200 text-green-900",
        icon: ShieldCheck,
        iconTone: "text-green-600",
        title: "Your store is live",
        body: "Customers can find you on Chowspace.",
      };
    }
    if (s === "under_review") {
      return {
        tone: "bg-blue-50 border-blue-200 text-blue-900",
        icon: Clock,
        iconTone: "text-blue-600",
        title: "Documents under review",
        body: "We're checking them now. You can keep setting up your store meanwhile.",
      };
    }
    if (s === "rejected") {
      return {
        tone: "bg-red-50 border-red-200 text-red-900",
        icon: AlertTriangle,
        iconTone: "text-red-600",
        title: "We couldn't approve your documents",
        body: data?.reviewNote || "Please re-upload and we'll take another look.",
      };
    }
    return {
      tone: "bg-amber-50 border-amber-200 text-amber-900",
      icon: AlertTriangle,
      iconTone: "text-amber-600",
      title: "Your store isn't visible yet",
      body: "Finish the steps below and customers will be able to find you.",
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-gray-200 border-t-[#AE2108] rounded-full animate-spin" />
      </div>
    );
  }

  const banner = statusBanner();
  const BannerIcon = banner.icon;
  const canUpload =
    data?.verificationStatus !== "approved" &&
    data?.verificationStatus !== "under_review";

  return (
    <>
      <Head>
        <title>Verification | Chowspace</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-[#F7F5F2] px-4 py-8">
        <Toaster position="top-right" />

        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push("/vendors/Dashboard")}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 mb-5"
          >
            <ChevronLeft size={16} /> Dashboard
          </button>

          <h1 className="text-xl font-black text-gray-900 tracking-tight">
            Getting your store live
          </h1>
          <p className="text-sm text-gray-500 mt-1 mb-5">
            Two things stand between you and customers: a complete storefront,
            and verified business documents.
          </p>

          <div className={`rounded-2xl border p-4 flex items-start gap-3 ${banner.tone}`}>
            <BannerIcon
              size={18}
              className={`mt-0.5 flex-shrink-0 ${banner.iconTone}`}
            />
            <div>
              <p className="text-sm font-bold">{banner.title}</p>
              <p className="text-xs mt-0.5 leading-relaxed opacity-90">
                {banner.body}
              </p>
            </div>
          </div>

          {/* Checklist */}
          <div className="bg-white rounded-2xl border border-gray-100 mt-4 overflow-hidden">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-5 pt-5 pb-1">
              Your checklist
            </p>
            <ul className="divide-y divide-gray-50">
              {(data?.items || []).map((item) => (
                <li key={item.key} className="flex items-start gap-3 px-5 py-4">
                  {item.done ? (
                    <CheckCircle2
                      size={18}
                      className="text-green-500 mt-0.5 flex-shrink-0"
                    />
                  ) : (
                    <Circle size={18} className="text-gray-300 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-bold ${
                        item.done ? "text-gray-400 line-through" : "text-gray-900"
                      }`}
                    >
                      {item.label}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.detail}</p>
                  </div>
                  {!item.done && item.key === "products" && (
                    <button
                      onClick={() => router.push("/vendors/ManageProducts")}
                      className="text-[11px] font-bold text-[#AE2108] hover:underline flex-shrink-0"
                    >
                      Add
                    </button>
                  )}
                  {!item.done && item.key === "logo" && (
                    <button
                      onClick={() => router.push("/vendors/Profile")}
                      className="text-[11px] font-bold text-[#AE2108] hover:underline flex-shrink-0"
                    >
                      Upload
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl border border-gray-100 mt-4 p-5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              Business documents
            </p>
            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
              We check these by hand before a store goes live. They&apos;re
              stored privately and only used for verification.
            </p>

            <div className="space-y-2.5">
              {(data?.documents || []).map((doc) => (
                <div
                  key={doc.kind}
                  className="flex items-center gap-3 rounded-xl border-2 border-gray-100 p-3.5"
                >
                  <span
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      doc.uploaded ? "bg-green-50" : "bg-gray-50"
                    }`}
                  >
                    {doc.uploaded ? (
                      <CheckCircle2 size={16} className="text-green-600" />
                    ) : (
                      <FileText size={16} className="text-gray-400" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{doc.label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                      {doc.uploaded ? "Uploaded" : DOCUMENT_HINTS[doc.kind]}
                    </p>
                  </div>
                  {canUpload && (
                    <button
                      onClick={() => {
                        targetKind.current = doc.kind;
                        fileInputRef.current?.click();
                      }}
                      disabled={uploading === doc.kind}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-[#AE2108] border border-[#AE2108]/30 rounded-lg px-2.5 py-1.5 hover:bg-red-50 transition disabled:opacity-50 flex-shrink-0"
                    >
                      <Upload size={12} />
                      {uploading === doc.kind
                        ? "…"
                        : doc.uploaded
                          ? "Replace"
                          : "Upload"}
                    </button>
                  )}
                </div>
              ))}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && targetKind.current) upload(targetKind.current, file);
                e.target.value = "";
                targetKind.current = null;
              }}
            />

            {!canUpload && data?.verificationStatus === "under_review" && (
              <p className="text-[11px] text-gray-400 mt-4 text-center">
                Uploads are locked while we review. We&apos;ll email you either way.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
