"use client";
import { useEffect, useState } from "react";
import { api, setToken } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";

interface Service {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
  is_default: boolean;
}

export default function ProviderServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [defaultServices, setDefaultServices] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [editing, setEditing] = useState<Service | null>(null);
  const [message, setMessage] = useState("");

  async function fetchServices() {
    const token = localStorage.getItem("token");
    if (!token) return;
    setToken(token);

    try {
      const res = await api.get("/services/provider/me");
      setServices(res.data);
    } catch {
      setMessage("Failed to load services");
    }
  }

  async function fetchDefaults() {
    try {
      const res = await api.get("/services/defaults");
      setDefaultServices(res.data);
    } catch {
      setMessage("Failed to load default services");
    }
  }

  async function handleAdd(serviceName: string, isDefault = false) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setToken(token);

    try {
      const res = await api.post("/services/", {
        name: serviceName,
        price: parseFloat(price) || 0,
        duration_minutes: parseInt(duration) || 30,
        is_default: isDefault,
      });
      setServices([...services, res.data]);
      setName("");
      setPrice("");
      setDuration("");
    } catch {
      setMessage("Failed to add service");
    }
  }

  async function handleDelete(id: number) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setToken(token);

    try {
      await api.delete(`/services/${id}`);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setMessage("Failed to delete service");
    }
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;

    const token = localStorage.getItem("token");
    if (!token) return;
    setToken(token);

    try {
      const res = await api.put(`/services/${editing.id}`, {
        name,
        price: parseFloat(price),
        duration_minutes: parseInt(duration),
        is_default: editing.is_default,
      });

      setServices((prev) =>
        prev.map((s) => (s.id === editing.id ? res.data : s))
      );
      setEditing(null);
      setName("");
      setPrice("");
      setDuration("");
    } catch {
      setMessage("Failed to update service");
    }
  }

  useEffect(() => {
    fetchServices();
    fetchDefaults();
  }, []);

  return (
    <RequireAuth>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Manage My Services</h1>

        {/* Default Services */}
        <div>
          <h2 className="font-semibold mb-2">Default Services</h2>
          <ul className="space-y-2">
            {defaultServices.map((d, i) => (
              <li key={i} className="flex items-center gap-2">
                <span>{d}</span>
                {!services.find((s) => s.name === d) && (
                  <button
                    className="bg-blue-500 text-white px-2 py-1 rounded"
                    onClick={() => handleAdd(d, true)}
                  >
                    Add
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Add or Edit Service */}
        <div>
          <h2 className="font-semibold mb-2">
            {editing ? "Edit Service" : "Add Custom Service"}
          </h2>
          <form
            onSubmit={(e) =>
              editing ? handleUpdate(e) : (e.preventDefault(), handleAdd(name, false))
            }
            className="space-y-2"
          >
            <input
              placeholder="Service name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-2 w-full"
              required
            />
            <input
              type="number"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="border p-2 w-full"
              required
            />
            <input
              type="number"
              placeholder="Duration (minutes)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="border p-2 w-full"
              required
            />
            <button className="bg-green-500 text-white px-4 py-2 rounded">
              {editing ? "Update Service" : "Add Custom"}
            </button>
            {editing && (
              <button
                type="button"
                className="ml-2 bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => {
                  setEditing(null);
                  setName("");
                  setPrice("");
                  setDuration("");
                }}
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        {/* Current Services */}
        <div>
          <h2 className="font-semibold mb-2">My Services</h2>
          <ul className="space-y-2">
            {services.map((s) => (
              <li
                key={s.id}
                className="flex justify-between items-center border p-2 rounded"
              >
                <span>
                  {s.name} - {s.price} lei ({s.duration_minutes} min)
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      setEditing(s);
                      setName(s.name);
                      setPrice(s.price.toString());
                      setDuration(s.duration_minutes.toString());
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(s.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {message && <p className="text-sm text-red-500">{message}</p>}
      </div>
    </RequireAuth>
  );
}
