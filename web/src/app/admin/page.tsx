"use client";
import { useEffect, useState } from "react";
import { api, setToken } from "@/lib/api";
import RequireAuth from "@/components/RequireAuth";

interface User {
  id: number;
  email: string;
  role: string;
}

export default function AdminPage() {
  const [providers, setProviders] = useState<User[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function fetchData() {
    const token = localStorage.getItem("token");
    if (!token) return;
    setToken(token);

    try {
      const provRes = await api.get("/admin/providers");
      const cliRes = await api.get("/admin/clients");
      setProviders(provRes.data);
      setClients(cliRes.data);
    } catch {
      setMessage("Failed to load data");
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleAddProvider(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) return;
    setToken(token);

    try {
      await api.post("/admin/providers", { email, password });
      setMessage("Provider created");
      setEmail("");
      setPassword("");
      fetchData();
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "Failed to create provider");
    }
  }

  async function handleDeleteUser(id: number) {
    const token = localStorage.getItem("token");
    if (!token) return;
    setToken(token);

    try {
      await api.delete(`/admin/user/${id}`);
      setMessage("User deleted");
      fetchData();
    } catch {
      setMessage("Failed to delete user");
    }
  }

  return (
    <RequireAuth>
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        <form onSubmit={handleAddProvider} className="space-y-2">
          <h2 className="font-semibold">Add Provider</h2>
          <input
            type="email"
            placeholder="Email"
            className="border p-2 w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="border p-2 w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="bg-green-500 text-white px-4 py-2 rounded">
            Add Provider
          </button>
        </form>

        {message && <p className="text-sm text-center">{message}</p>}

        <div>
          <h2 className="text-xl font-semibold mb-2">Providers</h2>
          <ul className="space-y-2">
            {providers.map((p) => (
              <li
                key={p.id}
                className="flex justify-between items-center border p-2 rounded"
              >
                <span>{p.email}</span>
                <button
                  onClick={() => handleDeleteUser(p.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Clients</h2>
          <ul className="space-y-2">
            {clients.map((c) => (
              <li
                key={c.id}
                className="flex justify-between items-center border p-2 rounded"
              >
                <span>{c.email}</span>
                <button
                  onClick={() => handleDeleteUser(c.id)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </RequireAuth>
  );
}
