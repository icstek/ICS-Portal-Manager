import { useAuth } from "@/lib/AuthContext";

export function useRole() {
  const { user, isLoadingAuth: loading } = useAuth();

  const isGlobalAdmin = user?.role === "global_admin";
  const isAdmin = user?.role === "admin" || isGlobalAdmin;
  const isTechnician = !isAdmin && !loading && !!user;

  return { user, loading, isAdmin, isGlobalAdmin, isTechnician };
}