"use client";

import DashboardShell from "./DashboardShell";
import { RIDER_NAV } from "@/constants/navigation";

export default function RiderLayout(props) {
  return <DashboardShell nav={RIDER_NAV} {...props} />;
}
