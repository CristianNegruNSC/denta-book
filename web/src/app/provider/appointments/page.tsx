"use client";
import { useEffect, useState } from "react";
import { api, setToken } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";

interface Appointment {
  id: number;
  provider_id: number;
  client_id: number;
  start_at: string;
  end_at: string;
  status: string;
}

export default function ProviderAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [message, setMessage] = useState("");

  async function fetchAppointments() {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Not logged in");
      return;
    }
    setToken(token);
    try {
      const res = await api.get("/appointments/provider/me");
      setAppointments(res.data);
    } catch {
      setMessage("Failed to load provider appointments");
    }
  }

  async function updateStatus(id: number, status: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setToken(token);
    try {
      await api.patch(`/appointments/${id}`, null, { params: { status } });
      setMessage(`Appointment ${id} ${status}`);
      fetchAppointments();
    } catch {
      setMessage("Failed to update status");
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <RequireAuth>
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-xl shadow-lg w-[600px] space-y-6">
          <h1 className="text-xl font-bold text-center">Provider Appointments</h1>

          {message && <p className="text-center text-sm">{message}</p>}

          {appointments.length === 0 ? (
            <p className="text-sm text-gray-500">No appointments yet</p>
          ) : (
            <ul className="space-y-2">
              {appointments.map((a) => (
                <li
                  key={a.id}
                  className={`border p-3 rounded flex justify-between items-center ${
                    a.status === "confirmed"
                      ? "border-green-400 bg-green-50"
                      : a.status === "canceled"
                      ? "border-red-400 bg-red-50"
                      : "border-yellow-400 bg-yellow-50"
                  }`}
                >
                  <div>
                    <p>
                      <strong>Client:</strong> {a.client_id}
                    </p>
                    <p>
                      {a.start_at} → {a.end_at}
                    </p>
                    <p>Status: {a.status}</p>
                  </div>
                  {a.status === "pending" && (
                    <div className="space-x-2">
                      <button
                        onClick={() => updateStatus(a.id, "confirmed")}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => updateStatus(a.id, "canceled")}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </RequireAuth>
  );
}