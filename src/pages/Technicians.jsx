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
  const [form, setForm] = useState({ name: "", hourly_rate: 0, phone: "", specialization: "" });
  const queryClient = useQueryClient();
  const { isAdmin } = useRole();

  const { data: technicians = [], isLoading } = useQuery({
    queryKey: ["technicians"],
    queryFn: () => base44.entities.Technician.list("name"),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Technician.update(editing.id, data)
      : base44.entities.Technician.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
      setDialogOpen(false);
      toast.success(editing ? "Technician updated" : "Technician added");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Technician.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["technicians"] });
      toast.success("Technician deleted");
    },
  });

  const openNew = () => { setEditing(null); setForm({ name: "", hourly_rate: 0, phone: "", specialization: "" }); setDialogOpen(true); };
  const openEdit = (t) => { setEditing(t); setForm({ name: t.name || "", hourly_rate: t.hourly_rate || 0, phone: t.phone || "", specialization: t.specialization || "" }); setDialogOpen(true); };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-inter tracking-tight">Technicians</h1>
          <p className="text-muted-foreground text-sm mt-1">{technicians.length} technicians</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <QuickBooksEmployeesImport onImported={() => queryClient.invalidateQueries({ queryKey: ["technicians"] })} />
            <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Add Technician</Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : technicians.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Wrench className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No technicians yet</p></CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {technicians.map((t) => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <Wrench className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{t.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.hourly_rate ? `$${t.hourly_rate}/hr` : ""}{t.specialization ? ` · ${t.specialization}` : ""}
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(t.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Technician" : "Add Technician"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name || saveMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}