"use client";
import { useEffect, useState } from "react";
import { api, setToken } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { enUS } from "date-fns/locale";

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

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [availableDays, setAvailableDays] = useState<string[]>([]);
  const [slots, setSlots] = useState<string[]>([]);

  const [providerId, setProviderId] = useState("");
  const [date, setDate] = useState("");
  const [startAt, setStartAt] = useState("");
  const [message, setMessage] = useState("");

  // id fix pentru Consultatie
  const CONSULTATIE_ID = 17;

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

    // luam providerii care au serviciul "Consultatie"
    api
      .get("/services/providers_for_service", { params: { service_id: CONSULTATIE_ID } })
      .then((res) => setProviders(res.data))
      .catch(() => setMessage("Failed to load providers"));
  }, []);

  useEffect(() => {
    if (providerId) {
      api
        .get("/appointments/available_days", {
          params: { provider_id: providerId, service_id: CONSULTATIE_ID },
        })
        .then((res) => setAvailableDays(res.data.available_days));
    }
  }, [providerId]);

  useEffect(() => {
    if (providerId && date) {
      api
        .get("/appointments/slots", {
          params: { provider_id: providerId, service_id: CONSULTATIE_ID, date },
        })
        .then((res) => setSlots(res.data.slots));
    }
  }, [providerId, date]);

  async function handleAdd() {
    const token = localStorage.getItem("token");
    if (!token) return setMessage("Not logged in");
    setToken(token);

    try {
      await api.post("/appointments/", {
        provider_id: parseInt(providerId),
        service_id: CONSULTATIE_ID,
        start_at: startAt,
      });
      setMessage("Programarea a fost efectuată, așteptăm medicul să confirme.");
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
      await api.patch(`/appointments/${id}`, null, {
        params: { status: "canceled" },
      });
      setMessage("Appointment canceled");
      fetchAppointments();
    } catch {
      setMessage("Failed to cancel appointment");
    }
  }

  const isDayAvailable = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return availableDays.includes(dateStr);
  };

  return (
    <RequireAuth>
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-xl shadow-lg w-[650px] space-y-6">
          <h1 className="text-xl font-bold text-center">Appointments</h1>

          {/* Booking form */}
          <div className="space-y-4">
            <div>
              <label className="block mb-1">Serviciu</label>
              <p className="font-semibold">Consultatie</p>
            </div>

            {/* Alege Medic */}
            <div>
              <label className="block mb-1">Alege Medic</label>
              <select
                value={providerId}
                onChange={(e) => {
                  setProviderId(e.target.value);
                  setSlots([]);
                  setAvailableDays([]);
                }}
                className="w-full border p-2 rounded"
                required
              >
                <option value="">-- selectează medic --</option>
                {providers.map((p: Provider) => (
                  <option key={p.id} value={p.id}>
                    {p.email}
                  </option>
                ))}
              </select>
            </div>

            {/* Alege Data */}
            {providerId && (
              <div>
                <label className="block mb-1">Alege Data</label>
                <DatePicker
                  selected={date ? new Date(date) : null}
                  onChange={(d: Date | null) =>
                    setDate(d ? d.toISOString().split("T")[0] : "")
                  }
                  filterDate={isDayAvailable}
                  locale={enUS}
                  className="border p-2 rounded w-full"
                  placeholderText="Selectează o zi"
                />
              </div>
            )}

            {/* Sloturi disponibile */}
            {slots.length > 0 && (
              <div>
                <label className="block mb-1">Intervale disponibile</label>
                <div className="grid grid-cols-3 gap-2">
                  {slots.map((s: string) => (
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
                Confirmă programarea
              </button>
            )}
          </div>

          {message && <p className="text-center text-sm">{message}</p>}

          {/* My Appointments list */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Programările mele</h2>
            {appointments.length === 0 ? (
              <p className="text-sm text-gray-500">Nu există programări</p>
            ) : (
              <ul className="space-y-2">
                {appointments.map((a: Appointment) => (
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
                      Medic {a.provider_id} <br />
                      {new Date(a.start_at).toLocaleString("ro-RO")} →{" "}
                      {new Date(a.end_at).toLocaleString("ro-RO")}
                      <p className="text-sm">Status: {a.status}</p>
                    </div>
                    {a.status === "pending" && (
                      <button
                        onClick={() => cancelAppointment(a.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Anulează
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
