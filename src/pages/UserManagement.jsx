import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Pencil, Users, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/lib/AuthContext";

const ROLES = [
  { value: "global_admin", label: "Global Admin" },
  { value: "admin", label: "Admin" },
  { value: "technician", label: "Technician" },
  { value: "user", label: "User" },
];

export default function UserManagement() {
  const { isGlobalAdmin, loading: roleLoading } = useRole();
  const { user: currentUser } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ full_name: "", role: "technician", disabled: false });
  const queryClient = useQueryClient();

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["all-users"],
    queryFn: () => base44.entities.User.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.User.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-users"] });
      setDialogOpen(false);
      toast.success("User updated");
    },
    onError: () => toast.error("Failed to update user"),
  });

  if (!roleLoading && !isGlobalAdmin) return <Navigate to="/" replace />;

  const openEdit = (u) => {
    setEditing(u);
    setForm({
      full_name: u.full_name || "",
      role: u.role || "technician",
      disabled: u.disabled || false,
    });
    setDialogOpen(true);
  };

  const handleToggleDisabled = (u) => {
    const newDisabled = !u.disabled;
    updateMutation.mutate(
      { id: u.id, data: { disabled: newDisabled } },
      {
        onSuccess: () => {
          toast.success(newDisabled ? "Account disabled" : "Account enabled");
        },
      }
    );
  };

  const roleColor = (role) => {
    if (role === "global_admin") return "bg-purple-100 text-purple-800";
    if (role === "admin") return "bg-blue-100 text-blue-800";
    return "bg-slate-100 text-slate-700";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <ShieldAlert className="w-6 h-6 text-purple-600" />
        <div>
          <h1 className="text-2xl font-bold font-inter tracking-tight">User Management</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{users.length} registered users</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {users.map((u) => (
            <Card key={u.id} className={u.disabled ? "opacity-60" : ""}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {u.profile_picture ? (
                      <img src={u.profile_picture} alt={u.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-medium text-amber-600">
                        {u.full_name?.[0]?.toUpperCase() || "?"}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate">{u.full_name}</p>
                      {u.disabled && <Badge variant="destructive" className="text-xs">Disabled</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleColor(u.role)}`}>
                      {u.role || "user"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {u.id !== currentUser?.id && (
                    <Switch
                      checked={!u.disabled}
                      onCheckedChange={() => handleToggleDisabled(u)}
                      title={u.disabled ? "Enable account" : "Disable account"}
                    />
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(u)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User — {editing?.full_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Display Name</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Email (read-only)</Label>
              <Input disabled value={editing?.email || ""} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {editing?.id !== currentUser?.id && (
              <div className="flex items-center justify-between pt-2 border-t">
                <div>
                  <Label className="text-sm font-medium">Account Status</Label>
                  <p className="text-xs text-muted-foreground">Toggle to enable or disable this account</p>
                </div>
                <Switch
                  checked={!form.disabled}
                  onCheckedChange={(checked) => setForm({ ...form, disabled: !checked })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => updateMutation.mutate({ id: editing.id, data: form })}
              disabled={updateMutation.isPending}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}