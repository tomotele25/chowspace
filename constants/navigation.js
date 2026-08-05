import {
  LayoutDashboard,
  UtensilsCrossed,
  PackageOpen,
  UploadCloud,
  Star,
  BarChart,
  MapPin,
  Wallet,
  ShieldCheck,
  Users,
  Megaphone,
  Rocket,
  MessageCircle,
  User,
  Settings,
  Bike,
  Store,
  LifeBuoy,
  ClipboardList,
} from "lucide-react";

/**
 * Every sidebar in the app, in one place.
 *
 * Before this, twenty pages each rendered their own <aside> with the nav array
 * copy-pasted into fifteen of them, and they had drifted badly — a vendor saw
 * thirteen menu items on Dashboard, seven on Wallet, and five pointing at
 * manager routes on Products. Features became unreachable depending on which
 * page you happened to be on.
 *
 * Shape: an array of groups. A group with no `label` renders without a heading,
 * which is what the shorter menus want.
 */

/**
 * Vendor.
 *
 * Trimmed from the fifteen that existed across the old sidebars. Dropped from
 * the sidebar — still reachable by URL, better surfaced as dashboard cards:
 *
 *   Subscribe    — a promotion upsell, not daily navigation
 *   Announcement — posted occasionally, not navigated to
 *
 * Verification is conditional, not listed here: it only applies until the
 * store goes live, so VendorLayout inserts it and drops it once verified.
 *
 * Chat stays — customers message vendors there, so it carries real traffic.
 */
export const VENDOR_NAV = [
  {
    label: "Selling",
    items: [
      { name: "Dashboard", path: "/vendors/Dashboard", icon: LayoutDashboard },
      { name: "Orders", path: "/vendors/Orders", icon: UtensilsCrossed },
      { name: "Products", path: "/vendors/ManageProducts", icon: PackageOpen },
      // Lives on the bulk-product-upload branch. Harmless until that merges:
      // the link 404s rather than breaking the build.
      { name: "Bulk Upload", path: "/vendors/BulkUpload", icon: UploadCloud },
    ],
  },
  {
    label: "Store",
    items: [
      { name: "Analytics", path: "/vendors/Analytics", icon: BarChart },
      { name: "Reviews", path: "/vendors/Reviews", icon: Star },
      { name: "Location", path: "/vendors/VendorLocation", icon: MapPin },
      { name: "Wallet", path: "/vendors/Wallet", icon: Wallet },
    ],
  },
  {
    label: "Account",
    items: [
      // "Business Profile" rather than "Profile", so it reads differently from
      // Settings — the two overlap and the old names didn't say which was which.
      { name: "Business Profile", path: "/vendors/Profile", icon: User },
      { name: "Team", path: "/vendors/ManageTeam", icon: Users },
      { name: "Chat", path: "/vendors/vendorchat", icon: MessageCircle },
      { name: "Settings", path: "/Settings", icon: Settings },
    ],
  },
];

/** Shown only while a vendor still has steps left to go live. */
export const VENDOR_VERIFICATION_ITEM = {
  name: "Verification",
  path: "/vendors/Verification",
  icon: ShieldCheck,
};

/**
 * Manager — a restricted view of the vendor's store.
 *
 * Two of these pages live under pages/vendors/ for historical reasons.
 * Moving them would change their URLs, so they stay where they are and simply
 * use ManagerLayout.
 */
export const MANAGER_NAV = [
  {
    items: [
      {
        name: "Dashboard",
        path: "/vendors/ManagerDashboard",
        icon: LayoutDashboard,
      },
      { name: "Orders", path: "/manager/ManagerOrder", icon: UtensilsCrossed },
      { name: "Products", path: "/vendors/ManageProducts", icon: PackageOpen },
      { name: "Locations", path: "/vendors/ManageLocation", icon: MapPin },
      { name: "Profile", path: "/manager/Profile", icon: User },
    ],
  },
];

/**
 * Admin.
 *
 * Dropped from the old arrays: /admin/dashboard, /admin/settings,
 * /admin/ManagerRider and /admin/Promotion — none of those pages exist, so
 * every one was a 404 waiting to be clicked.
 */
export const ADMIN_NAV = [
  {
    items: [
      { name: "Overview", path: "/admin/AdminDashboard", icon: LayoutDashboard },
      { name: "Vendors", path: "/admin/ManageVendor", icon: Store },
      {
        name: "Verification",
        path: "/admin/VendorVerification",
        icon: ShieldCheck,
      },
      { name: "Riders", path: "/admin/ManageRiders", icon: Bike },
      {
        name: "Assigned Orders",
        path: "/admin/AssignedOrders",
        icon: ClipboardList,
      },
      { name: "Order Analysis", path: "/admin/OrderAnalysis", icon: BarChart },
      { name: "User Analysis", path: "/admin/UserAnalysis", icon: Users },
      { name: "Support", path: "/admin/AdminContactSupport", icon: LifeBuoy },
    ],
  },
];

/** Rider. */
export const RIDER_NAV = [
  {
    items: [
      {
        name: "Dashboard",
        path: "/riders/RiderDashboard",
        icon: LayoutDashboard,
      },
      { name: "Orders", path: "/riders/Orders", icon: UtensilsCrossed },
      { name: "Wallet", path: "/riders/Wallet", icon: Wallet },
      { name: "Profile", path: "/riders/Profile", icon: User },
      { name: "Settings", path: "/riders/Setting", icon: Settings },
    ],
  },
];
