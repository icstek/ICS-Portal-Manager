import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useRole } from "@/hooks/useRole";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

export default function Services() {
  const { isAdmin, isGlobalAdmin, loading } = useRole();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const [dialogOpen, setDialogOpen] = useState(urlParams.get("action") === "new");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ shortname: "", description: "" });

  const { data: services = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: () => base44.entities.Service.list("shortname"),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) {
        await base44.entities.Service.update(editing.id, form);
      } else {
        await base44.entities.Service.create(form);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success(editing ? "Service updated" : "Service created");
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Service.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success("Service deleted");
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm({ shortname: "", description: "" });
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({ shortname: s.shortname, description: s.description });
    setDialogOpen(true);
  };

  if (loading) return null;
  if (!isAdmin && !isGlobalAdmin) {
    navigate("/");
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-inter tracking-tight">Service Codes</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage predefined service codes for reports</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Service
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Tag className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No service codes yet</p>
            <p className="text-sm mt-1">Create your first service code to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {services.map((s) => (
            <Card key={s.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-sm">{s.shortname}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1.5">{s.description}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMutation.mutate(s.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Service Code" : "New Service Code"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs text-muted-foreground">Short Code</Label>
              <Input
                value={form.shortname}
                onChange={(e) => setForm((f) => ({ ...f, shortname: e.target.value }))}
                placeholder="e.g. PCLoad"
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Full description of this service..."
                className="mt-1 min-h-[80px]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!form.shortname || !form.description || saveMutation.isPending}
              >
                {editing ? "Update" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}