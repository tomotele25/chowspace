"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import toast from "react-hot-toast";
import {
  Building2,
  CheckCircle2,
  Loader2,
  Pencil,
  ShieldCheck,
} from "lucide-react";

const BACKENDURL = "https://chowspace-backend.vercel.app";

/**
 * Where a vendor's money is sent.
 *
 * Its own card rather than another field in the profile form, because it
 * needs a step the rest of the form doesn't: confirming the account name with
 * the bank before saving. A mistyped digit otherwise sends a vendor's takings
 * to a stranger, and a completed transfer cannot be recalled.
 *
 * The old inline fields could only ever be filled once — they were skipped
 * whenever an account already existed, and only saved if a Paystack subaccount
 * could also be created in the same request. That is why 39 of 41 vendors have
 * no payout account at all.
 */
export default function PayoutAccount() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;

  const [banks, setBanks] = useState([]);
  const [current, setCurrent] = useState(null);
  const [editing, setEditing] = useState(false);

  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const [verifying, setVerifying] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${BACKENDURL}/api/banks`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setBanks(r.data?.banks || []))
      .catch(() => toast.error("Couldn't load the bank list"));
  }, [token]);

  // Fetched rather than read from the session: the NextAuth session carries
  // no bank fields, so reading it here would have shown "not set up yet" to a
  // vendor who had already saved an account.
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${BACKENDURL}/api/vendor/payout-account`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => setCurrent(r.data?.account || null))
      .catch(() => {
        // Non-fatal — the form still works, it just can't show what's saved.
      });
  }, [token]);

  // The name is looked up as soon as there are ten digits and a bank, so the
  // vendor sees who they are about to be paid before they commit to it.
  useEffect(() => {
    setAccountName("");
    if (!/^\d{10}$/.test(accountNumber) || !bankCode || !token) return;

    let cancelled = false;
    setVerifying(true);

    axios
      .post(
        `${BACKENDURL}/api/vendor/payout-account/verify`,
        { accountNumber, bankCode },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then((r) => {
        if (!cancelled) setAccountName(r.data?.accountName || "");
      })
      .catch((err) => {
        if (!cancelled) {
          setAccountName("");
          toast.error(
            err?.response?.data?.message || "Couldn't verify that account",
          );
        }
      })
      .finally(() => !cancelled && setVerifying(false));

    return () => {
      cancelled = true;
    };
  }, [accountNumber, bankCode, token]);

  const save = async () => {
    if (!accountName) return;
    setSaving(true);
    try {
      const res = await axios.post(
        `${BACKENDURL}/api/vendor/payout-account`,
        { accountNumber, bankCode },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setCurrent(res.data?.account || null);
      setEditing(false);
      setAccountNumber("");
      setBankCode("");
      setAccountName("");
      toast.success("Payout account saved");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Couldn't save that account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-4 sm:px-5 pt-5 pb-1 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Payout account
          </p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-md">
            Where your money is sent after a customer pays through Chowspace.
          </p>
        </div>
        {current && !editing && (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-[#AE2108] hover:underline flex-shrink-0 min-h-[44px] px-1"
          >
            <Pencil size={13} /> Change
          </button>
        )}
      </div>

      {current && !editing ? (
        <div className="px-4 sm:px-5 pb-5 pt-3">
          <div className="flex items-center gap-3 rounded-xl border-2 border-gray-100 p-4">
            <span className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 size={18} className="text-green-600" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">
                {current.accountName || "Account saved"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {current.accountNumber} · {current.bankName}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-4 sm:px-5 pb-5 pt-3 space-y-3">
          {!current && (
            <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3.5">
              <ShieldCheck
                size={16}
                className="text-amber-600 mt-0.5 flex-shrink-0"
              />
              <p className="text-xs text-amber-900 leading-relaxed">
                You haven&apos;t added one yet. Until you do, money from your
                orders is held in your Chowspace wallet instead of reaching your
                bank.
              </p>
            </div>
          )}

          <select
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108] transition-all"
          >
            <option value="">Select your bank</option>
            {banks.map((b) => (
              <option key={`${b.code}-${b.name}`} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>

          <input
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) =>
              setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
            }
            placeholder="10-digit account number"
            className="w-full px-3.5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#AE2108]/20 focus:border-[#AE2108] transition-all"
          />

          {/* The confirmation that makes this worth doing: the vendor reads
              back the name the bank holds before any money can be sent. */}
          {verifying && (
            <p className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 size={13} className="animate-spin" />
              Checking with the bank…
            </p>
          )}

          {accountName && !verifying && (
            <div className="flex items-center gap-2.5 rounded-xl bg-green-50 border border-green-200 p-3.5">
              <CheckCircle2
                size={16}
                className="text-green-600 flex-shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-green-800 uppercase tracking-wider">
                  Account name
                </p>
                <p className="text-sm font-bold text-green-900 truncate">
                  {accountName}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={save}
              disabled={!accountName || saving}
              className="flex-1 min-h-[44px] rounded-xl bg-[#AE2108] text-white text-sm font-bold hover:bg-[#941B06] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save account"}
            </button>
            {current && (
              <button
                onClick={() => {
                  setEditing(false);
                  setAccountNumber("");
                  setBankCode("");
                }}
                className="px-4 min-h-[44px] rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            )}
          </div>

          <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <Building2 size={11} />
            The name must match — we can&apos;t recall a transfer once it&apos;s
            sent.
          </p>
        </div>
      )}
    </div>
  );
}
