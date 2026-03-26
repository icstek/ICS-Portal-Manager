import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CustomerSection({ form, setForm }) {
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => base44.entities.Customer.list("name"),
  });

  const handleCustomerSelect = (customerId) => {
    if (customerId === "__new__") {
      setForm((f) => ({
        ...f,
        customer_id: "",
        customer_name: "",
        customer_address: "",
        customer_city: "",
        customer_zip: "",
        customer_tel: "",
        customer_cell: "",
        customer_email: "",
      }));
      return;
    }
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
    }
  };

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Customer Information</h3>
      <div>
        <Label className="text-xs text-muted-foreground">Select Existing Customer</Label>
        <Select value={form.customer_id || "__new__"} onValueChange={handleCustomerSelect}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select or add new..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__new__">+ New Customer</SelectItem>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Name *</Label>
          <Input value={form.customer_name || ""} onChange={(e) => handleChange("customer_name", e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Address</Label>
          <Input value={form.customer_address || ""} onChange={(e) => handleChange("customer_address", e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">City</Label>
          <Input value={form.customer_city || ""} onChange={(e) => handleChange("customer_city", e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Zip</Label>
          <Input value={form.customer_zip || ""} onChange={(e) => handleChange("customer_zip", e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Telephone</Label>
          <Input value={form.customer_tel || ""} onChange={(e) => handleChange("customer_tel", e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Cell</Label>
          <Input value={form.customer_cell || ""} onChange={(e) => handleChange("customer_cell", e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Email</Label>
          <Input type="email" value={form.customer_email || ""} onChange={(e) => handleChange("customer_email", e.target.value)} className="mt-1" />
        </div>
      </div>
    </div>
  );
}