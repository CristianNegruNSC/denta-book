"use client";
import { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { api, setToken } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { toZonedTime } from "date-fns-tz";

interface Appointment {
  id: number;
  client_id: number;
  start_at: string;
  end_at: string;
  status: string;
}

const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

export default function ProviderCalendarPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Appointment | null>(null);
  const timeZone = "Europe/Bucharest";

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
      setMessage("Failed to load appointments");
    }
  }

  async function updateStatus(id: number, status: string) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setToken(token);
    try {
      await api.patch(`/appointments/${id}`, null, { params: { status } });
      setMessage(`Appointment ${id} ${status}`);
      setSelected(null);
      fetchAppointments();
    } catch {
      setMessage("Failed to update status");
    }
  }

  useEffect(() => {
    fetchAppointments();
  }, []);

  const events = appointments.map((a) => {
    const start = toZonedTime(new Date(a.start_at), timeZone);
    const end = toZonedTime(new Date(a.end_at), timeZone);

    return {
      id: a.id,
      title: `Client ${a.client_id} (${a.status})`,
      start,
      end,
      status: a.status,
    };
  });

  const eventPropGetter = (event: any) => {
    let bg = "#fbbf24"; // pending
    if (event.status === "confirmed") bg = "#34d399"; // verde
    if (event.status === "canceled") bg = "#f87171"; // roșu
    return {
      style: {
        backgroundColor: bg,
        borderRadius: "6px",
        color: "black",
        border: "none",
        fontWeight: "bold",
      },
    };
  };

  return (
    <RequireAuth>
      <div className="flex flex-col min-h-screen bg-gray-100 p-6">
        <h1 className="text-2xl font-bold text-center mb-4">
          Provider Calendar
        </h1>
        {message && <p className="text-center text-sm text-red-500">{message}</p>}
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          views={["month", "week", "day"]}
          defaultView="week"
          defaultDate={new Date()}
          eventPropGetter={eventPropGetter}
          popup
          onSelectEvent={(event: any) => {
            const appt = appointments.find((a) => a.id === event.id) || null;
            setSelected(appt);
          }}
        />

        {/* Popup */}
        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 shadow-lg w-[400px] space-y-4">
              <h2 className="text-lg font-bold">Appointment Details</h2>
              <p>
                <strong>Client:</strong> {selected.client_id}
              </p>
              <p>
                <strong>Start:</strong>{" "}
                {new Date(selected.start_at).toLocaleString("ro-RO", {
                  timeZone: "Europe/Bucharest",
                })}
              </p>
              <p>
                <strong>End:</strong>{" "}
                {new Date(selected.end_at).toLocaleString("ro-RO", {
                  timeZone: "Europe/Bucharest",
                })}
              </p>
              <p>
                <strong>Status:</strong> {selected.status}
              </p>

              <div className="flex space-x-2">
                {selected.status === "pending" && (
                  <>
                    <button
                      onClick={() => updateStatus(selected.id, "confirmed")}
                      className="flex-1 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => updateStatus(selected.id, "canceled")}
                      className="flex-1 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {selected.status === "canceled" && (
                  <button
                    onClick={async () => {
                      try {
                        await api.delete(`/appointments/${selected.id}`);
                        setMessage(`Appointment ${selected.id} deleted`);
                        setSelected(null);
                        fetchAppointments();
                      } catch {
                        setMessage("Failed to delete appointment");
                      }
                    }}
                    className="flex-1 bg-red-700 text-white px-3 py-1 rounded hover:bg-red-800"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
