"use client";
import { useEffect, useState } from "react";
import { api, setToken } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";

interface User {
  id: number;
  email: string;
  role: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Not logged in");
      return;
    }
    setToken(token);

    api.get("/users/me")
      .then((res) => setUser(res.data))
      .catch(() => setMessage("Invalid or expired token"));
  }, []);

  return (
    <RequireAuth>
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-xl shadow-lg w-96 text-center space-y-4">
        <h1 className="text-xl font-bold">Dashboard</h1>
        {user ? (
          <div>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <p>
              <strong>Role:</strong> {user.role}
            </p>
          </div>
        ) : (
          <p>{message || "Loading..."}</p>
        )}
      </div>
    </div>
    </RequireAuth>
  );
}
