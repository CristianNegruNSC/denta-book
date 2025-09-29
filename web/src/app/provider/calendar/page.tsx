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
  provider_id: number;
  client_id: number | null;
  service_id: number | null;
  start_at: string;
  end_at: string;
  status: string;
  created_by: string;
}

interface WorkingHour {
  id: number;
  day_of_week: number; // 0=Sunday, 1=Monday ...
  start_time: string;  // "09:00"
  end_time: string;    // "18:00"
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
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [message, setMessage] = useState("");
  const [popup, setPopup] = useState<{ start: Date; end: Date } | null>(null);

  const timeZone = "Europe/Bucharest";

  async function fetchAppointments() {
    const token = localStorage.getItem("token");
    if (!token) return;
    setToken(token);
    try {
      const res = await api.get("/appointments/provider/me");
      setAppointments(res.data);
    } catch {
      setMessage("Failed to load appointments");
    }
  }

  async function fetchWorkingHours() {
    const token = localStorage.getItem("token");
    if (!token) return;
    setToken(token);
    try {
      const res = await api.get("/working-hours/me");
      setWorkingHours(res.data);
    } catch {
      setMessage("Failed to load working hours");
    }
  }

  async function setAvailability(start: Date, end: Date) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setToken(token);

    const day_of_week = start.getDay(); // 0=Sunday ... 6=Saturday
    try {
      await api.post("/working-hours/", {
        day_of_week,
        start_time: start.toTimeString().slice(0, 5),
        end_time: end.toTimeString().slice(0, 5),
      });
      setMessage("Disponibilitate setată");
      setPopup(null);
      fetchWorkingHours();
    } catch {
      setMessage("Failed to set availability");
    }
  }

  async function blockTime(start: Date, end: Date) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setToken(token);

    try {
      await api.post("/appointments/block", {
        start_at: start.toISOString(),
        end_at: end.toISOString(),
      });
      setMessage("Blocaj adăugat");
      setPopup(null);
      fetchAppointments();
    } catch {
      setMessage("Failed to block time");
    }
  }

  async function deleteAvailability(whId: number) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setToken(token);
    try {
      await api.delete(`/working-hours/${whId}`);
      setMessage("Disponibilitate ștearsă");
      fetchWorkingHours();
    } catch {
      setMessage("Failed to delete availability");
    }
  }

  useEffect(() => {
    fetchAppointments();
    fetchWorkingHours();
  }, []);

  // appointments -> evenimente
  const appointmentEvents = appointments.map((a) => {
    const start = toZonedTime(new Date(a.start_at), timeZone);
    const end = toZonedTime(new Date(a.end_at), timeZone);

    return {
      id: a.id,
      title:
        a.created_by === "provider"
          ? `Blocaj (${a.status})`
          : `Client ${a.client_id} (${a.status})`,
      start,
      end,
      status: a.status,
    };
  });

  // working_hours -> evenimente recurente (4 săpt. în avans)
  const workingEvents = workingHours.flatMap((wh) => {
    const events: any[] = [];

    for (let i = 0; i < 4; i++) {
      const baseDate = new Date();
      // mergem la începutul săptămânii (duminică)
      baseDate.setDate(
        baseDate.getDate() - baseDate.getDay() + wh.day_of_week + i * 7
      );

      const [sh, sm] = wh.start_time.split(":").map(Number);
      const [eh, em] = wh.end_time.split(":").map(Number);

      const start = new Date(baseDate);
      start.setHours(sh, sm, 0, 0);
      const end = new Date(baseDate);
      end.setHours(eh, em, 0, 0);

      events.push({
        id: `wh-${wh.id}`,
        title: "Disponibilitate",
        start,
        end,
        status: "available",
      });
    }

    return events;
  });

  const events = [...workingEvents, ...appointmentEvents];

  const eventPropGetter = (event: any) => {
    let bg = "#d1d5db"; // disponibilitate
    if (event.status === "pending") bg = "#fbbf24";
    if (event.status === "confirmed") bg = "#34d399";
    if (event.status === "canceled") bg = "#f87171";
    if (event.title.startsWith("Blocaj")) bg = "#60a5fa";
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
      <div className="flex flex-col min-h-screen bg-gray-100 p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center">Provider Calendar</h1>
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
          selectable
          eventPropGetter={eventPropGetter}
          onSelectSlot={(slot) => {
            setPopup({ start: slot.start, end: slot.end });
          }}
          onSelectEvent={(event: any) => {
            if (event.status === "available") {
              if (window.confirm("Ștergi această disponibilitate?")) {
                const whId = parseInt(event.id.toString().split("-")[1]);
                deleteAvailability(whId);
              }
            }
          }}
        />

        {/* Popup pentru selecție */}
        {popup && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 shadow-lg w-[400px] space-y-4">
              <h2 className="text-lg font-bold">Alege acțiunea</h2>
              <p>
                Interval:{" "}
                {popup.start.toLocaleString("ro-RO")} →{" "}
                {popup.end.toLocaleString("ro-RO")}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setAvailability(popup.start, popup.end)}
                  className="flex-1 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                >
                  Setează disponibilitate
                </button>
                <button
                  onClick={() => blockTime(popup.start, popup.end)}
                  className="flex-1 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                >
                  Blochează timp
                </button>
                <button
                  onClick={() => setPopup(null)}
                  className="flex-1 bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                >
                  Anulează
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}
