"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { Toaster } from "react-hot-toast";

import RiderLayout from "@/components/layouts/RiderLayout";

export default function RiderDashboard() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/Login");
  }, [status, router]);

  return (
    <>
      <Toaster position="top-right" />
      <RiderLayout
        title="Dashboard"
        subtitle={new Date().toLocaleDateString("en-NG", {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
      >
        <div className="p-5" />
      </RiderLayout>
    </>
  );
}
