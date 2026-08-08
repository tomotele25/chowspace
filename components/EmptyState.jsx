import { PackageOpen } from "lucide-react";

/**
 * Shared "no data" state — distinct from ErrorState. Use when a fetch
 * succeeded but returned nothing (no results, no orders, no products yet),
 * not when a fetch failed.
 */
export default function EmptyState({
  icon: Icon = PackageOpen,
  title = "Nothing here yet",
  message,
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 text-gray-400">
      <Icon size={44} className="mb-3 opacity-30" />
      <p className="font-semibold text-sm text-gray-600">{title}</p>
      {message && <p className="text-xs mt-1 max-w-xs">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
