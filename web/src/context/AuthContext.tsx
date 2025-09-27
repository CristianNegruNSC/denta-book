"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";

interface AuthContextType {
  role: string | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  role: null,
  token: null,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // reconstrucția stării la mount
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      api.defaults.headers.common["Authorization"] = `Bearer ${savedToken}`;
      setToken(savedToken);

      // cerem backend-ului userul curent
      api
        .get("/users/me")
        .then((res) => setRole(res.data.role))
        .catch(() => {
          setRole(null);
          localStorage.removeItem("token");
        });
    }
  }, []);

  async function login(newToken: string) {
    localStorage.setItem("token", newToken);
    api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
    setToken(newToken);

    // după login, cerem userul curent
    try {
      const res = await api.get("/users/me");
      setRole(res.data.role);
    } catch {
      setRole(null);
    }
  }

  function logout() {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setToken(null);
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ role, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
