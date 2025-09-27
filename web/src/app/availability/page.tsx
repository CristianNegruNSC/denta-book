"use client";
import { useEffect, useState } from "react";
import { api, setToken } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";

interface Availability {
  id: number;
  provider_id: number;
  date: string;
  start_time: string;
  end_time: string;
}

export default function AvailabilityPage() {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [message, setMessage] = useState("");

  async function fetchAvailability() {
    const token = localStorage.getItem("token");
    if (!token) {
      setMessage("Not logged in");
      return;
    }
    setToken(token);

    try {
      const res = await api.get("/availability/");
      setAvailability(res.data);
    } catch {
      setMessage("Could not load availability");
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return setMessage("Not logged in");
    setToken(token);

    try {
      await api.post("/availability/", {
        date,
        start_time: startTime + ":00", // transformăm 09:00 în 09:00:00
        end_time: endTime + ":00",
      });
      setMessage("Availability added!");
      fetchAvailability();
    } catch {
      setMessage("Failed to add availability");
    }
  }

  async function handleDelete(id: number) {
    const token = localStorage.getItem("token");
    if (!token) return setMessage("Not logged in");
    setToken(token);

    try {
      await api.delete(`/availability/${id}`);
      setAvailability((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setMessage("Failed to delete availability");
    }
  }

  useEffect(() => {
    fetchAvailability();
  }, []);

  return (
    <RequireAuth>
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-xl shadow-lg w-[400px] space-y-6">
          <h1 className="text-xl font-bold text-center">Set Availability</h1>

          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />
            </div>

            <div>
              <label className="block mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border p-2 rounded"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
            >
              Add Availability
            </button>
          </form>

          {message && <p className="text-center text-sm">{message}</p>}

          <div>
            <h2 className="text-lg font-semibold mb-2">Your Availability</h2>
            <ul className="space-y-2">
              {availability.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between border p-2 rounded"
                >
                  <span>
                    {a.date} — {a.start_time} - {a.end_time}
                  </span>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </RequireAuth>
  );
}
