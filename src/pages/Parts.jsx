import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Package, Pencil, Trash2, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import QuickBooksPartsImport from "@/components/parts/QuickBooksPartsImport";
import { useRole } from "@/hooks/useRole";

const categories = ["hardware", "cable", "peripheral", "storage", "memory", "display", "battery", "other"];

export default function Parts() {
  const [search, setSearch] = useState("");
  const urlParams = new URLSearchParams(window.location.search);
  const [dialogOpen, setDialogOpen] = useState(urlParams.get("action") === "new");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", sku: "", unit_cost: 0, stock_quantity: 0, category: "other" });
  const [selectedParts, setSelectedParts] = useState(new Set());
  const queryClient = useQueryClient();
  const { isAdmin, isTechnician } = useRole();

  const { data: parts = [], isLoading } = useQuery({
    queryKey: ["parts"],
    queryFn: () => base44.entities.Part.list("name"),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Part.update(editing.id, data)
      : base44.entities.Part.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      setDialogOpen(false);
      toast.success(editing ? "Part updated" : "Part added");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Part.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      toast.success("Part deleted");
    },
  });

  const deleteSelectedMutation = useMutation({
    mutationFn: async () => {
      for (const id of selectedParts) {
        await base44.entities.Part.delete(id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["parts"] });
      setSelectedParts(new Set());
      toast.success(`${selectedParts.size} part(s) deleted`);
    },
  });

  if (isTechnician) {
    return <Navigate to="/" replace />;
  }

  const openNew = () => { setEditing(null); setForm({ name: "", sku: "", unit_cost: 0, stock_quantity: 0, category: "other", taxable: true }); setDialogOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ name: p.name || "", sku: p.sku || "", unit_cost: p.unit_cost || 0, stock_quantity: p.stock_quantity || 0, category: p.category || "other", taxable: p.taxable !== false }); setDialogOpen(true); };

  const filtered = parts.filter((p) => (p.name || "").toLowerCase().includes(search.toLowerCase()) || (p.sku || "").toLowerCase().includes(search.toLowerCase()));

  const togglePart = (id) => {
    const newSelected = new Set(selectedParts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedParts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedParts.size === filtered.length) {
      setSelectedParts(new Set());
    } else {
      setSelectedParts(new Set(filtered.map(p => p.id)));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
         <div>
           <h1 className="text-2xl md:text-3xl font-bold font-inter tracking-tight">Parts Catalog</h1>
           <p className="text-muted-foreground text-sm mt-1">{parts.length} parts</p>
         </div>
         <div className="flex gap-2">
           {isAdmin && (
             <>
               <QuickBooksPartsImport onImported={() => queryClient.invalidateQueries({ queryKey: ["parts"] })} />
               <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Add Part</Button>
             </>
           )}
         </div>
       </div>

      <div className="relative">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
         <Input placeholder="Search parts by name or SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
       </div>

       {filtered.length > 0 && (
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Checkbox 
               checked={selectedParts.size === filtered.length && filtered.length > 0}
               onCheckedChange={toggleSelectAll}
             />
             <span className="text-sm text-muted-foreground">
               {selectedParts.size > 0 ? `${selectedParts.size} selected` : "Select all"}
             </span>
           </div>
           {selectedParts.size > 0 && (
             <Button 
               variant="destructive" 
               size="sm"
               onClick={() => {
                 if (confirm(`Delete ${selectedParts.size} part(s)?`)) {
                   deleteSelectedMutation.mutate();
                 }
               }}
               disabled={deleteSelectedMutation.isPending}
               className="gap-2"
             >
               <Trash2 className="w-4 h-4" /> Delete
             </Button>
           )}
         </div>
       )}

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center"><Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No parts found</p></CardContent></Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
           {filtered.map((p) => (
             <Card 
               key={p.id} 
               className={`hover:shadow-md transition-shadow cursor-pointer ${selectedParts.has(p.id) ? 'ring-2 ring-primary bg-primary/5' : ''}`}
               onClick={() => togglePart(p.id)}
             >
               <CardContent className="p-4">
                 <div className="flex items-start justify-between gap-2">
                   <div className="flex items-start gap-2 min-w-0 flex-1">
                     <Checkbox 
                       checked={selectedParts.has(p.id)}
                       onCheckedChange={() => {}}
                       className="mt-1 flex-shrink-0"
                     />
                     <div className="min-w-0">
                       <p className="font-medium truncate">{p.name}</p>
                       <p className="text-xs text-muted-foreground">{p.sku || "No SKU"}</p>
                     </div>
                   </div>
                   {isAdmin && (
                     <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                       <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="w-3 h-3" /></Button>
                       <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(p.id)}><Trash2 className="w-3 h-3" /></Button>
                     </div>
                   )}
                 </div>
                <div className="flex items-center justify-between mt-3">
                  <Badge variant="secondary" className="text-[10px] capitalize">{p.category || "other"}</Badge>
                  <div className="text-right">
                    <p className="text-sm font-bold">${(p.unit_cost || 0).toFixed(2)}</p>
                    <p className="text-[10px] text-muted-foreground">Stock: {p.stock_quantity || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Part" : "Add Part"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Unit Cost ($) *</Label><Input type="number" step="0.01" value={form.unit_cost} onChange={(e) => setForm({ ...form, unit_cost: parseFloat(e.target.value) || 0 })} className="mt-1" /></div>
            <div><Label className="text-xs">Stock Quantity</Label><Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })} className="mt-1" /></div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (<SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={form.taxable !== false} onCheckedChange={(v) => setForm({ ...form, taxable: !!v })} />
              <Label className="text-xs">Taxable</Label>
            </div>
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