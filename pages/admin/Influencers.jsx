"use client";

import { BACKENDURL } from "@/lib/api";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { Copy, Check, Plus, MousePointerClick, Download, ShoppingBag } from "lucide-react";
import AdminLayout from "@/components/layouts/AdminLayout";
import { requireAdminPage } from "@/lib/requireAdminPage";

export const getServerSideProps = requireAdminPage();

function StatPill({ icon: Icon, value, label }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-600">
      <Icon size={13} className="text-[#AE2108]" />
      <span className="font-semibold text-gray-900">{value}</span>
      <span>{label}</span>
    </div>
  );
}

export default function InfluencersPage() {
  const { data: session } = useSession();
  const [influencers, setInfluencers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const authHeaders = session?.user?.accessToken
    ? { headers: { Authorization: `Bearer ${session.user.accessToken}` } }
    : null;

  const load = async () => {
    if (!authHeaders) return;
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${BACKENDURL}/api/admin/influencers`,
        authHeaders,
      );
      setInfluencers(data.influencers || []);
    } catch (err) {
      toast.error("Could not load influencers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.accessToken]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim() || !authHeaders) return;
    setCreating(true);
    try {
      const { data } = await axios.post(
        `${BACKENDURL}/api/admin/influencers`,
        { name: name.trim(), handle: handle.trim() },
        authHeaders,
      );
      toast.success(`Link ready: ${data.link}`);
      setName("");
      setHandle("");
      load();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Could not create influencer",
      );
    } finally {
      setCreating(false);
    }
  };

  const copyLink = (link, code) => {
    navigator.clipboard?.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  return (
    <AdminLayout
      title="Influencers"
      subtitle="Unique links per influencer — clicks, installs, orders, revenue"
    >
      <div className="px-5 py-6 max-w-6xl mx-auto space-y-6">
        <Toaster position="top-right" />

        {/* Create form */}
        <form
          onSubmit={handleCreate}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row gap-3 sm:items-end"
        >
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chris Ade"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#AE2108]/30"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Handle (optional)
            </label>
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@chrisade"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#AE2108]/30"
            />
          </div>
          <button
            type="submit"
            disabled={creating || !name.trim()}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[#AE2108] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Plus size={15} /> {creating ? "Creating…" : "Create link"}
          </button>
        </form>

        {/* List */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <p className="p-6 text-sm text-gray-500">Loading…</p>
          ) : influencers.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">
              No influencers yet — create one above.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {influencers.map((inf) => (
                <div
                  key={inf._id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {inf.name}{" "}
                      {inf.handle ? (
                        <span className="text-gray-400 font-normal">
                          {inf.handle}
                        </span>
                      ) : null}
                    </p>
                    <button
                      onClick={() => copyLink(inf.link, inf.code)}
                      className="mt-0.5 flex items-center gap-1 text-xs text-[#AE2108] hover:underline"
                    >
                      {copiedCode === inf.code ? (
                        <>
                          <Check size={12} /> Copied
                        </>
                      ) : (
                        <>
                          <Copy size={12} /> {inf.link}
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-4">
                    <StatPill
                      icon={MousePointerClick}
                      value={inf.clicks}
                      label="clicks"
                    />
                    <StatPill
                      icon={Download}
                      value={inf.installs}
                      label="installs"
                    />
                    <StatPill
                      icon={ShoppingBag}
                      value={inf.orders}
                      label="orders"
                    />
                    <div className="text-xs text-gray-600">
                      <span className="font-semibold text-gray-900">
                        ₦{Number(inf.revenue || 0).toLocaleString()}
                      </span>{" "}
                      revenue
                    </div>
                    <div className="text-xs text-gray-600">
                      <span className="font-semibold text-gray-900">
                        {inf.conversionRate}%
                      </span>{" "}
                      conv.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
