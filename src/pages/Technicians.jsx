import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Wrench, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import QuickBooksEmployeesImport from "@/components/technicians/QuickBooksEmployeesImport";
import { useRole } from "@/hooks/useRole";

export default function Technicians() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ hourly_rate: 0, specialization: "" });
  const queryClient = useQueryClient();
  const { isAdmin } = useRole();

  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ["technicians"],
    queryFn: () => base44.entities.User.list(),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
      setDialogOpen(false);
      toast.success("User updated");
    },
  });

  const openEdit = (t) => { setEditing(t); setForm({ hourly_rate: t.hourly_rate || 0, specialization: t.specialization || "" }); setDialogOpen(true); };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-inter tracking-tight">Team Members</h1>
          <p className="text-muted-foreground text-sm mt-1">{technicians.length} users</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <QuickBooksEmployeesImport onImported={() => queryClient.invalidateQueries({ queryKey: ["technicians"] })} />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : technicians.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Wrench className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No team members yet</p></CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {technicians.map((t) => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {t.profile_picture ? (
                      <img src={t.profile_picture} alt={t.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <Wrench className="w-4 h-4 text-amber-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{t.full_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.email} · {t.role}
                    </p>
                  </div>
                </div>
                {isAdmin && (
                   <div className="flex gap-1 shrink-0">
                     <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="w-4 h-4" /></Button>
                   </div>
                 )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Name</Label><Input disabled value={editing?.full_name || ""} className="mt-1" /></div>
            <div><Label className="text-xs">Email</Label><Input disabled value={editing?.email || ""} className="mt-1" /></div>
            <div><Label className="text-xs">Hourly Rate</Label><Input type="number" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: parseFloat(e.target.value) || 0 })} className="mt-1" /></div>
            <div><Label className="text-xs">Specialization</Label><Input value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}