import { AlertTriangle, RefreshCw } from "lucide-react";

/**
 * Shared "fetch/action failed" state — distinct from EmptyState so a broken
 * request never looks identical to a genuinely empty result to the user.
 */
export default function ErrorState({
  title = "Something went wrong",
  message = "We couldn't load this. Please try again.",
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <AlertTriangle size={24} className="text-[#AE2108]" />
      </div>
      <p className="font-semibold text-sm text-gray-800">{title}</p>
      <p className="text-xs mt-1 max-w-xs text-gray-400">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 flex items-center gap-1.5 bg-[#AE2108] text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-[#941B06] transition"
        >
          <RefreshCw size={13} />
          Try again
        </button>
      )}
    </div>
  );
}
