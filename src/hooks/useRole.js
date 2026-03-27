import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

export function useRole() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const isGlobalAdmin = user?.role === "global_admin";
  const isAdmin = user?.role === "admin" || isGlobalAdmin;
  const isTechnician = !isAdmin && !loading && !!user;

  return { user, loading, isAdmin, isGlobalAdmin, isTechnician };
}