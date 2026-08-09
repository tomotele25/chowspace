"use client";

import DashboardShell from "./DashboardShell";
import { ADMIN_NAV } from "@/constants/navigation";

export default function AdminLayout(props) {
  return <DashboardShell nav={ADMIN_NAV} {...props} />;
}
