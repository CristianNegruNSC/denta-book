"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");  // if not logged in, redirect
    }
  }, [router]);

  return <>{children}</>;
}
