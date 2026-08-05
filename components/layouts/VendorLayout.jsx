"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import axios from "axios";
import { User, AlertTriangle, ChevronRight } from "lucide-react";

import DashboardShell from "./DashboardShell";
import { VENDOR_NAV } from "@/constants/navigation";

const BACKENDURL = "https://chowspace-backend.vercel.app";

function StatusDot({ status }) {
  const open = status === "opened";
  return (
    <span className="relative flex h-2 w-2">
      {open && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
      )}
      <span
        className={`relative inline-flex rounded-full h-2 w-2 ${
          open ? "bg-emerald-500" : "bg-gray-300"
        }`}
      />
    </span>
  );
}

/**
 * Vendor dashboard layout.
 *
 * On top of the shared shell this owns two things that used to live only on
 * Dashboard.jsx, and were therefore invisible from the other nine vendor pages:
 *
 *   - the store open/closed pill
 *   - the "not visible to customers yet" verification banner
 *
 * Fetching both here means one request per session rather than one per page,
 * and a vendor can no longer be unaware their store is hidden just because they
 * happen to be on Wallet.
 */
export default function VendorLayout({ title, subtitle, actions, children }) {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const [storeStatus, setStoreStatus] = useState(null);
  const [verification, setVerification] = useState(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/Login");
  }, [authStatus, router]);

  useEffect(() => {
    const token = session?.user?.accessToken;
    const vendorId = session?.user?.vendorId;
    if (!token) return;

    if (vendorId) {
      axios
        .get(`${BACKENDURL}/api/getVendorStatusById/${vendorId}`)
        .then((r) => setStoreStatus(r.data?.status || null))
        .catch(() => {});
    }

    axios
      .get(`${BACKENDURL}/api/vendor/verification/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setVerification(r.data))
      .catch(() => {
        // Non-fatal — the page still works, the banner just won't render.
      });
  }, [session]);

  const identity = (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#AE2108]/5 border border-[#AE2108]/10">
      <div className="w-8 h-8 rounded-full bg-[#AE2108]/15 flex items-center justify-center flex-shrink-0">
        <User size={14} className="text-[#AE2108]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-gray-900 text-xs font-bold truncate">
          {session?.user?.businessName || session?.user?.fullname || "My store"}
        </p>
        {storeStatus && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <StatusDot status={storeStatus} />
            <p className="text-gray-400 text-[10px] font-medium capitalize">
              Store {storeStatus}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const banner =
    verification && !verification.live ? (
      <div className="px-5 pt-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle
            size={17}
            className="text-amber-600 mt-0.5 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-amber-900">
              Your store isn&apos;t visible to customers yet
            </p>
            <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
              {verification.items
                ?.filter((i) => !i.done)
                .map((i) => i.label)
                .join(" · ") || "Finishing up…"}
            </p>
          </div>
          <Link
            href="/vendors/Verification"
            className="flex items-center gap-1 text-xs font-bold text-[#AE2108] hover:underline flex-shrink-0 whitespace-nowrap"
          >
            Finish setup <ChevronRight size={13} />
          </Link>
        </div>
      </div>
    ) : null;

  return (
    <DashboardShell
      nav={VENDOR_NAV}
      title={title}
      subtitle={subtitle}
      actions={actions}
      identity={identity}
      banner={banner}
    >
      {children}
    </DashboardShell>
  );
}
