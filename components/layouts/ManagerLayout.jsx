"use client";

import DashboardShell from "./DashboardShell";
import { MANAGER_NAV } from "@/constants/navigation";

export default function ManagerLayout(props) {
  return <DashboardShell nav={MANAGER_NAV} {...props} />;
}
