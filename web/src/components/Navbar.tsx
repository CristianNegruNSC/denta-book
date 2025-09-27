"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const { role, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <nav className="bg-gray-800 p-4 text-white flex space-x-6">
      {!role && (
        <>
          <Link href="/register" className="hover:underline">
            Register
          </Link>
          <Link href="/login" className="hover:underline">
            Login
          </Link>
        </>
      )}

      {role === "client" && (
        <>
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/appointments" className="hover:underline">
            Appointments
          </Link>
          <Link href="/client/calendar" className="hover:underline">
            My Calendar
          </Link>
        </>
      )}

      {role === "provider" && (
        <>
          <Link href="/dashboard" className="hover:underline">
            Dashboard
          </Link>
          <Link href="/availability" className="hover:underline">
            Availability
          </Link>
          <Link href="/provider/appointments" className="hover:underline">
            Provider Appointments
          </Link>
          <Link href="/provider/services" className="hover:underline">
            Services
          </Link>
          <Link href="/provider/calendar" className="hover:underline">
            Calendar
          </Link>
        </>
      )}


      {role && (
        <button
          onClick={handleLogout}
          className="ml-auto bg-red-600 px-3 py-1 rounded hover:bg-red-700"
        >
          Logout
        </button>
      )}

      {role === "admin" && (
        <>
          <Link href="/admin" className="hover:underline">
            Admin Dashboard
          </Link>
        </>
      )}
    </nav>
  );
}
