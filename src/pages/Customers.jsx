import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Users, Pencil, Trash2, Check, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import QuickBooksImport from "@/components/customers/QuickBooksImport";
import CustomerReports from "@/components/customers/CustomerReports";
import { useRole } from "@/hooks/useRole";

export default function Customers() {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", address: "", address2: "", city: "", zip: "", tel: "", cell: "", email: "", customer_name: "" });
  const [selectedCustomers, setSelectedCustomers] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [reportsModalOpen, setReportsModalOpen] = useState(false);
  const [selectedCustomerForReports, setSelectedCustomerForReports] = useState(null);
  const pageSize = 50;
  const queryClient = useQueryClient();
  const { isAdmin, isTechnician } = useRole();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "new") {
      openNew();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: () => base44.entities.Customer.list("name", 999999),
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.Customer.update(editing.id, data)
      : base44.entities.Customer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setDialogOpen(false);
      toast.success(editing ? "Customer updated" : "Customer added");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Customer.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted");
    },
  });

  const deleteSelectedMutation = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selectedCustomers);
      const batchSize = 50;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        await Promise.all(batch.map(id => base44.entities.Customer.delete(id)));
      }
    },
    onSuccess: () => {
      const count = selectedCustomers.size;
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      setSelectedCustomers(new Set());
      setCurrentPage(1);
      toast.success(`${count} customer(s) deleted`);
    },
  });

  const openNew = () => { setEditing(null); setForm({ name: "", address: "", address2: "", city: "", zip: "", tel: "", cell: "", email: "", customer_name: "" }); setDialogOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name || "", address: c.address || "", address2: c.address2 || "", city: c.city || "", zip: (c.zip || "").replace(/\D/g, '').slice(0, 5), tel: c.tel || "", cell: c.cell || "", email: c.email || "", customer_name: c.customer_name || "" }); setDialogOpen(true); };

  const filtered = customers.filter((c) => (c.name || "").toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedCustomers = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleCustomer = (id) => {
    const newSelected = new Set(selectedCustomers);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCustomers(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.size === filtered.length) {
      setSelectedCustomers(new Set());
    } else {
      setSelectedCustomers(new Set(filtered.map(c => c.id)));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-inter tracking-tight">Customers</h1>
          <p className="text-muted-foreground text-sm mt-1">{customers.length} customers</p>
        </div>
        {(isAdmin || isTechnician) && (
          <div className="flex gap-2">
            {isAdmin && <QuickBooksImport onImported={() => queryClient.invalidateQueries({ queryKey: ["customers"] })} />}
            <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> Add Customer</Button>
          </div>
        )}
      </div>

      <div className="relative">
         <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
         <Input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
       </div>

       {filtered.length > 0 && isAdmin && (
         <div className="flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Checkbox 
               checked={selectedCustomers.size === filtered.length && filtered.length > 0}
               onCheckedChange={toggleSelectAll}
             />
             <span className="text-sm text-muted-foreground">
               {selectedCustomers.size > 0 ? `${selectedCustomers.size} selected` : `Select all (${filtered.length})`}
             </span>
           </div>
           {selectedCustomers.size > 0 && (
             <Button 
               variant="destructive" 
               size="sm"
               onClick={() => {
                 if (confirm(`Delete ${selectedCustomers.size} customer(s)?`)) {
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
        <Card><CardContent className="py-12 text-center"><Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No customers found</p></CardContent></Card>
      ) : (
        <>
        <div className="grid gap-3">
           {paginatedCustomers.map((c) => (
             <Card 
               key={c.id} 
               className={`hover:shadow-md transition-shadow cursor-pointer ${selectedCustomers.has(c.id) ? 'ring-2 ring-primary bg-primary/5' : ''}`}
               onClick={() => toggleCustomer(c.id)}
             >
               <CardContent className="p-4 flex items-center justify-between gap-3">
                 <div className="flex items-center gap-3 min-w-0 flex-1">
                   <Checkbox 
                     checked={selectedCustomers.has(c.id)}
                     onCheckedChange={() => {}}
                     className="flex-shrink-0"
                   />
                   <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                     <span className="text-sm font-bold text-primary">{(c.name || "?")[0].toUpperCase()}</span>
                   </div>
                   <div className="min-w-0">
                     <p className="font-medium truncate">{c.name}</p>
                     <p className="text-xs text-muted-foreground truncate">
                       {[c.city, c.tel].filter(Boolean).join(" · ") || "No details"}
                     </p>
                   </div>
                 </div>
                 <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                   <Button variant="ghost" size="icon" onClick={() => { setSelectedCustomerForReports(c); setReportsModalOpen(true); }}><FileText className="w-4 h-4" /></Button>
                   {isAdmin && (
                     <>
                       <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                       <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(c.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                     </>
                   )}
                 </div>
               </CardContent>
             </Card>
           ))}
           </div>
           {totalPages > 1 && (
           <div className="flex items-center justify-center gap-2 mt-6">
             <Button 
               variant="outline" 
               size="sm"
               onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
               disabled={currentPage === 1}
             >
               Previous
             </Button>
             <span className="text-sm text-muted-foreground">
               Page {currentPage} of {totalPages}
             </span>
             <Button 
               variant="outline" 
               size="sm"
               onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
               disabled={currentPage === totalPages}
             >
               Next
             </Button>
           </div>
           )}
           </>
           )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Customer" : "Add Customer"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><Label className="text-xs">Name/Company Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" /></div>
             <div><Label className="text-xs">Address</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1" /></div>
             <div><Label className="text-xs">Address Line 2</Label><Input value={form.address2} onChange={(e) => setForm({ ...form, address2: e.target.value })} className="mt-1" placeholder="Suite, unit, floor, etc." /></div>
             <div><Label className="text-xs">City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1" /></div>
             <div><Label className="text-xs">Zip</Label><Input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value.replace(/\D/g, '').slice(0, 5) })} className="mt-1" maxLength={5} placeholder="00000" /></div>
             <div><Label className="text-xs">Telephone</Label><Input value={form.tel} onChange={(e) => setForm({ ...form, tel: e.target.value })} className="mt-1" /></div>
             <div><Label className="text-xs">Cell</Label><Input value={form.cell} onChange={(e) => setForm({ ...form, cell: e.target.value })} className="mt-1" /></div>
             <div>
               <Label className="text-xs">Customer Name</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className="mt-1" />
             </div>
             <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
          </div>
          <DialogFooter className="flex sm:justify-between">
             <Button type="button" className="bg-orange-500 hover:bg-orange-600 text-white" size="sm">Notes</Button>
             <div className="flex gap-2">
               <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
               <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name || saveMutation.isPending}>Save</Button>
             </div>
           </DialogFooter>
        </DialogContent>
      </Dialog>

      <CustomerReports 
        customer={selectedCustomerForReports}
        open={reportsModalOpen}
        onOpenChange={setReportsModalOpen}
      />
      </div>
      );
      }