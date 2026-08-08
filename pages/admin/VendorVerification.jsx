"use client";

import { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  ChevronLeft,
  ShieldCheck,
  FileText,
  ExternalLink,
  Check,
  X,
  AlertTriangle,
  Package,
  ImageIcon,
} from "lucide-react";
import { requireAdminPage } from "@/lib/requireAdminPage";
import { BACKENDURL } from "@/lib/api";

const TABS = [
  { value: "under_review", label: "Awaiting review" },
  { value: "awaiting_documents", label: "Incomplete" },
  { value: "rejected", label: "Rejected" },
  { value: "approved", label: "Approved" },
];

const DOC_LABELS = {
  cac: "CAC certificate",
  identification: "Identification",
  proof_of_address: "Proof of address",
};

export default function VendorVerification() {
  const router = useRouter();
  const { data: session, status: authStatus } = useSession();

  const [tab, setTab] = useState("under_review");
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/Login");
  }, [authStatus, router]);

  const load = useCallback(async () => {
    if (!session?.user?.accessToken) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `${BACKENDURL}/api/admin/verifications?status=${tab}`,
        { headers: { Authorization: `Bearer ${session.user.accessToken}` } },
      );
      setVendors(res.data.vendors || []);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Couldn't load the review queue",
      );
    } finally {
      setLoading(false);
    }
  }, [session, tab]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (vendorId, decision, reviewNote) => {
    setBusy(vendorId);
    const id = toast.loading(
      decision === "approved" ? "Approving…" : "Rejecting…",
    );
    try {
      const res = await axios.patch(
        `${BACKENDURL}/api/admin/verifications/${vendorId}`,
        { decision, reviewNote },
        { headers: { Authorization: `Bearer ${session?.user?.accessToken}` } },
      );
      toast.success(
        decision === "approved"
          ? res.data?.isLive
            ? "Approved — their store is now live"
            : "Approved, but still hidden until their storefront is complete"
          : "Rejected — we've told them why",
        { id },
      );
      setRejecting(null);
      setNote("");
      await load();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Couldn't save that", { id });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <Head>
        <title>Vendor verification | Chowspace Admin</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <AdminLayout
        title="Vendor Verification"
        subtitle="Check CAC, ID and proof of address before a store goes live"
      >
        <Toaster position="top-right" />

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-4">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  tab === t.value
                    ? "bg-[#AE2108] text-white"
                    : "bg-white border-2 border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <span className="inline-block w-6 h-6 border-2 border-gray-200 border-t-[#AE2108] rounded-full animate-spin" />
            </div>
          ) : vendors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <p className="text-sm font-bold text-gray-900">Nothing here</p>
              <p className="text-xs text-gray-400 mt-1">
                No vendors with this status.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {vendors.map((v) => (
                <div
                  key={v._id}
                  className="bg-white rounded-2xl border border-gray-100 p-5"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-gray-900">
                        {v.businessName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {v.email} · {v.contact}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {v.category} · {v.location} · {v.address}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Storefront readiness — so you can see whether approving
                      actually puts them live. */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        v.productCount >= 7
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <Package size={11} /> {v.productCount} products
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        v.logo
                          ? "bg-green-50 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      <ImageIcon size={11} /> {v.logo ? "Logo" : "No logo"}
                    </span>
                    {!v.wouldGoLive && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                        <AlertTriangle size={11} /> Approving won&apos;t make
                        them live yet
                      </span>
                    )}
                  </div>

                  {/* Documents */}
                  <div className="grid sm:grid-cols-3 gap-2 mb-4">
                    {["cac", "identification", "proof_of_address"].map(
                      (kind) => {
                        const doc = (v.verificationDocuments || []).find(
                          (d) => d.kind === kind,
                        );
                        return (
                          <a
                            key={kind}
                            href={doc?.url || undefined}
                            target="_blank"
                            rel="noreferrer"
                            className={`flex items-center gap-2 rounded-xl border-2 p-2.5 transition ${
                              doc
                                ? "border-gray-200 hover:border-[#AE2108]"
                                : "border-dashed border-gray-200 cursor-not-allowed"
                            }`}
                          >
                            <FileText
                              size={14}
                              className={
                                doc ? "text-[#AE2108]" : "text-gray-300"
                              }
                            />
                            <span className="flex-1 min-w-0 text-[11px] font-bold text-gray-700 truncate">
                              {DOC_LABELS[kind]}
                            </span>
                            {doc ? (
                              <ExternalLink
                                size={12}
                                className="text-gray-400"
                              />
                            ) : (
                              <span className="text-[10px] text-gray-400">
                                missing
                              </span>
                            )}
                          </a>
                        );
                      },
                    )}
                  </div>

                  {v.reviewNote && (
                    <p className="text-[11px] text-red-700 bg-red-50 rounded-lg px-3 py-2 mb-3">
                      Previously rejected: {v.reviewNote}
                    </p>
                  )}

                  {/* Actions */}
                  {rejecting === v._id ? (
                    <div className="space-y-2">
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        rows={2}
                        placeholder="What's wrong? The vendor sees this, so be specific."
                        className="w-full text-sm rounded-xl border-2 border-gray-200 p-3 outline-none focus:border-[#AE2108] resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => decide(v._id, "rejected", note)}
                          disabled={!note.trim() || busy === v._id}
                          className="flex-1 bg-red-600 text-white text-xs font-bold py-2.5 rounded-xl hover:bg-red-700 transition disabled:opacity-40"
                        >
                          Send rejection
                        </button>
                        <button
                          onClick={() => {
                            setRejecting(null);
                            setNote("");
                          }}
                          className="px-4 text-xs font-bold text-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    v.verificationStatus !== "approved" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => decide(v._id, "approved")}
                          disabled={busy === v._id}
                          className="flex items-center justify-center gap-1.5 flex-1 bg-[#AE2108] text-white text-xs font-bold py-2.5 rounded-xl hover:bg-[#941B06] transition disabled:opacity-40"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          onClick={() => setRejecting(v._id)}
                          disabled={busy === v._id}
                          className="flex items-center justify-center gap-1.5 px-4 bg-white border-2 border-gray-200 text-gray-700 text-xs font-bold py-2.5 rounded-xl hover:border-red-300 hover:text-red-600 transition"
                        >
                          <X size={14} /> Reject
                        </button>
                      </div>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminLayout>
    </>
  );
}

// Gated before any HTML is sent — the client-side check alone let a
// non-admin render the page and fire its data requests first.
export const getServerSideProps = requireAdminPage();
