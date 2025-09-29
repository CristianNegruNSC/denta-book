"use client";
import { useEffect, useState } from "react";
import { api, setToken } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";

interface Service {
  id: number; // ID din provider_services
  provider_id: number;
  service_id: number;
  price: number;
  duration_minutes: number;
  service: {
    id: number;
    name: string;
  };
}

export default function ProviderServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [name, setName] = useState(""); // pentru serviciu nou/custom
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
        service_id: editing.service_id,
        price: parseFloat(price),
        duration_minutes: parseInt(duration),
      });

      setServices((prev) =>
        prev.map((s) => (s.id === editing.id ? res.data : s))
      );
      setEditing(null);
      setPrice("");
      setDuration("");
    } catch {
      setMessage("Failed to update service");
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) return;
    setToken(token);

    try {
      const res = await api.post("/services/custom", {
        name,
        price: parseFloat(price),
        duration_minutes: parseInt(duration),
      });

      setServices([...services, res.data]);
      setName("");
      setPrice("");
      setDuration("");
    } catch {
      setMessage("Failed to add service");
    }
  }

  useEffect(() => {
    fetchServices();
  }, []);

  return (
    <RequireAuth>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Manage My Services</h1>

        {/* Add Custom Service */}
        {!editing && (
          <div>
            <h2 className="font-semibold mb-2">Add New Service</h2>
            <form onSubmit={handleAdd} className="space-y-2">
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
                Add
              </button>
            </form>
          </div>
        )}

        {/* Edit Service */}
        {editing && (
          <div>
            <h2 className="font-semibold mb-2">Edit Service</h2>
            <form onSubmit={handleUpdate} className="space-y-2">
              <p className="font-medium">{editing.service.name}</p>
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
                Update
              </button>
              <button
                type="button"
                className="ml-2 bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => {
                  setEditing(null);
                  setPrice("");
                  setDuration("");
                }}
              >
                Cancel
              </button>
            </form>
          </div>
        )}

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
                  {s.service.name} - {s.price} lei ({s.duration_minutes} min)
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      setEditing(s);
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
