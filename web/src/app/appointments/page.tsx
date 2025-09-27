"use client";
import { useEffect, useState } from "react";
import { api, setToken } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";

interface Appointment {
  id: number;
  provider_id: number;
  client_id: number;
  service_id: number;
  start_at: string;
  end_at: string;
  status: string;
}

interface Provider {
  id: number;
  email: string;
}

interface Service {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [slots, setSlots] = useState<string[]>([]);

  const [serviceId, setServiceId] = useState("");
  const [providerId, setProviderId] = useState("");
  const [date, setDate] = useState("");
  const [startAt, setStartAt] = useState("");
  const [message, setMessage] = useState("");

  async function fetchAppointments() {
    const token = localStorage.getItem("token");
    if (!token) return setMessage("Not logged in");
    setToken(token);
    try {
      const res = await api.get("/appointments/me");
      setAppointments(res.data);
    } catch {
      setMessage("Failed to load appointments");
    }
  }

  useEffect(() => {
    fetchAppointments();
    api.get("/services/all").then((res) => setServices(res.data));
  }, []);

  useEffect(() => {
    if (serviceId) {
      api.get(`/services/${serviceId}/providers`).then((res) => setProviders(res.data));
    }
  }, [serviceId]);

  useEffect(() => {
    if (providerId && serviceId && date) {
      api
        .get("/appointments/slots", {
          params: { provider_id: providerId, service_id: serviceId, date },
        })
        .then((res) => setSlots(res.data.slots));
    }
  }, [providerId, serviceId, date]);

  async function handleAdd() {
    const token = localStorage.getItem("token");
    if (!token) return setMessage("Not logged in");
    setToken(token);

    try {
      await api.post("/appointments/", {
        provider_id: parseInt(providerId),
        service_id: parseInt(serviceId),
        start_at: startAt, // direct, fără conversii UTC
      });
      setMessage("Appointment booked!");
      fetchAppointments();
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Failed to book appointment");
    }
  }

  async function cancelAppointment(id: number) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setToken(token);
    try {
      await api.patch(`/appointments/${id}`, null, { params: { status: "canceled" } });
      setMessage("Appointment canceled");
      fetchAppointments();
    } catch {
      setMessage("Failed to cancel appointment");
    }
  }

  return (
    <RequireAuth>
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-xl shadow-lg w-[650px] space-y-6">
          <h1 className="text-xl font-bold text-center">Appointments</h1>

          {/* Booking form */}
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Choose Service</label>
              <select
                value={serviceId}
                onChange={(e) => {
                  setServiceId(e.target.value);
                  setProviderId("");
                  setSlots([]);
                }}
                className="w-full border p-2 rounded"
                required
              >
                <option value="">-- select service --</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} - {s.price} lei ({s.duration_minutes} min)
                  </option>
                ))}
              </select>
            </div>

            {serviceId && (
              <div>
                <label className="block mb-1">Choose Provider</label>
                <select
                  value={providerId}
                  onChange={(e) => {
                    setProviderId(e.target.value);
                    setSlots([]);
                  }}
                  className="w-full border p-2 rounded"
                  required
                >
                  <option value="">-- select provider --</option>
                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {providerId && (
              <div>
                <label className="block mb-1">Choose Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSlots([]);
                  }}
                  className="w-full border p-2 rounded"
                  required
                />
              </div>
            )}

            {slots.length > 0 && (
              <div>
                <label className="block mb-1">Available Slots</label>
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStartAt(s)}
                      className={`border p-2 rounded ${
                        startAt === s ? "bg-blue-500 text-white" : ""
                      }`}
                    >
                      {new Date(s).toLocaleTimeString("ro-RO", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {startAt && (
              <button
                onClick={handleAdd}
                className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
              >
                Book Appointment
              </button>
            )}
          </div>

          {message && <p className="text-center text-sm">{message}</p>}

          {/* My Appointments list */}
          <div>
            <h2 className="text-lg font-semibold mb-2">My Appointments</h2>
            {appointments.length === 0 ? (
              <p className="text-sm text-gray-500">No appointments yet</p>
            ) : (
              <ul className="space-y-2">
                {appointments.map((a) => (
                  <li
                    key={a.id}
                    className={`border p-2 rounded flex justify-between items-center ${
                      a.status === "confirmed"
                        ? "border-green-400 bg-green-50"
                        : a.status === "canceled"
                        ? "border-red-400 bg-red-50"
                        : "border-yellow-400 bg-yellow-50"
                    }`}
                  >
                    <div>
                      Service {a.service_id} with Provider {a.provider_id} <br />
                      {a.start_at} → {a.end_at}
                      <p className="text-sm">Status: {a.status}</p>
                    </div>
                    {a.status === "pending" && (
                      <button
                        onClick={() => cancelAppointment(a.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Cancel
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
