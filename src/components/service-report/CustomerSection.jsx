import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CustomerSection({ form, setForm }) {
  const [search, setSearch] = useState("");
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({ name: "", address: "", city: "", zip: "", tel: "", cell: "", email: "" });
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => base44.entities.Customer.list("name", 999999),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Customer.create(data),
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      handleCustomerSelect(newCustomer.id);
      setShowQuickAdd(false);
      setQuickAddForm({ name: "", address: "", city: "", zip: "", tel: "", cell: "", email: "" });
      toast.success("Customer added");
    },
  });

  const handleCustomerSelect = (customerId) => {
    const c = customers.find((c) => c.id === customerId);
    if (c) {
      setForm((f) => ({
        ...f,
        customer_id: c.id,
        customer_name: c.name || "",
        customer_address: c.address || "",
        customer_city: c.city || "",
        customer_zip: c.zip || "",
        customer_tel: c.tel || "",
        customer_cell: c.cell || "",
        customer_email: c.email || "",
      }));
      setSearch("");
    }
  };

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const filteredCustomers = customers.filter((c) =>
    (c.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.tel || "").includes(search) ||
    (c.cell || "").includes(search)
  );

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Customer Information</h3>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Search Customer</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, phone..."
            value={form.customer_id && !search ? form.customer_name : search}
            onChange={(e) => setSearch(e.target.value)}
            className={`pl-9 ${form.customer_id && !search ? "text-muted-foreground" : ""}`}
          />
          {search && (
            <div className="absolute top-full left-0 right-0 border rounded-lg bg-card max-h-48 overflow-y-auto z-10 mt-1">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleCustomerSelect(c.id)}
                    className="w-full text-left px-3 py-2 hover:bg-muted border-b last:border-b-0 text-sm"
                  >
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{[c.city, c.tel].filter(Boolean).join(" · ")}</p>
                  </button>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">No customers found</div>
              )}
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowQuickAdd(true)}
          className="gap-2 w-full"
        >
          <Plus className="w-4 h-4" /> Quick Add Customer
        </Button>
      </div>
      {form.customer_id && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Name</Label>
            <Input value={form.customer_name || ""} disabled className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Address</Label>
            <Input value={form.customer_address || ""} disabled className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">City</Label>
            <Input value={form.customer_city || ""} disabled className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Zip</Label>
            <Input value={form.customer_zip || ""} disabled className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Phone</Label>
            <Input value={form.customer_tel || ""} disabled className="mt-1" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Cell</Label>
            <Input value={form.customer_cell || ""} disabled className="mt-1" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input type="email" value={form.customer_email || ""} disabled className="mt-1" />
          </div>
        </div>
      )}

        <Dialog open={showQuickAdd} onOpenChange={setShowQuickAdd}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Add New Customer</DialogTitle>
           </DialogHeader>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             <div className="sm:col-span-2">
               <Label className="text-xs">Name *</Label>
               <Input
                 value={quickAddForm.name}
                 onChange={(e) => setQuickAddForm({ ...quickAddForm, name: e.target.value })}
                 className="mt-1"
               />
             </div>
             <div>
               <Label className="text-xs">Address</Label>
               <Input
                 value={quickAddForm.address}
                 onChange={(e) => setQuickAddForm({ ...quickAddForm, address: e.target.value })}
                 className="mt-1"
               />
             </div>
             <div>
               <Label className="text-xs">City</Label>
               <Input
                 value={quickAddForm.city}
                 onChange={(e) => setQuickAddForm({ ...quickAddForm, city: e.target.value })}
                 className="mt-1"
               />
             </div>
             <div>
               <Label className="text-xs">Zip</Label>
               <Input
                 value={quickAddForm.zip}
                 onChange={(e) => setQuickAddForm({ ...quickAddForm, zip: e.target.value })}
                 className="mt-1"
               />
             </div>
             <div>
               <Label className="text-xs">Phone</Label>
               <Input
                 value={quickAddForm.tel}
                 onChange={(e) => setQuickAddForm({ ...quickAddForm, tel: e.target.value })}
                 className="mt-1"
               />
             </div>
             <div>
               <Label className="text-xs">Cell</Label>
               <Input
                 value={quickAddForm.cell}
                 onChange={(e) => setQuickAddForm({ ...quickAddForm, cell: e.target.value })}
                 className="mt-1"
               />
             </div>
             <div className="sm:col-span-2">
               <Label className="text-xs">Email</Label>
               <Input
                 type="email"
                 value={quickAddForm.email}
                 onChange={(e) => setQuickAddForm({ ...quickAddForm, email: e.target.value })}
                 className="mt-1"
               />
             </div>
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setShowQuickAdd(false)}>Cancel</Button>
             <Button
               onClick={() => createMutation.mutate(quickAddForm)}
               disabled={!quickAddForm.name || createMutation.isPending}
             >
               {createMutation.isPending ? "Adding..." : "Add Customer"}
             </Button>
           </DialogFooter>
         </DialogContent>
        </Dialog>
        </div>
        );
        }