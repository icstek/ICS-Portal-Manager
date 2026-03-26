import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const receivedOptions = ["computer", "printer", "laptop", "screen"];

export default function ChargesSection({ form, setForm, partsTotal }) {
  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const laborCharge = (form.total_time_hours || 0) * (form.hourly_rate || 0) + (form.misc_charge || 0);
  const subTotal = laborCharge + partsTotal;
  const taxRate = form.tax_rate ?? 9.75;
  const taxAmount = subTotal * (taxRate / 100);
  const totalCharges = subTotal + taxAmount;

  const toggleReceived = (item) => {
    const current = form.received_items || [];
    const updated = current.includes(item) ? current.filter((i) => i !== item) : [...current, item];
    setForm((f) => ({ ...f, received_items: updated }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Equipment & Charges</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Received Equipment</Label>
            <div className="flex flex-wrap gap-4">
              {receivedOptions.map((item) => (
                <label key={item} className="flex items-center gap-2 text-sm capitalize cursor-pointer">
                  <Checkbox
                    checked={(form.received_items || []).includes(item)}
                    onCheckedChange={() => toggleReceived(item)}
                  />
                  {item}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Model</Label>
              <Input value={form.equipment_model || ""} onChange={(e) => handleChange("equipment_model", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Serial Number</Label>
              <Input value={form.equipment_serial || ""} onChange={(e) => handleChange("equipment_serial", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">System Password</Label>
              <Input value={form.system_password || ""} onChange={(e) => handleChange("system_password", e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Service Status</Label>
              <Select value={form.service_status || "incomplete"} onValueChange={(v) => handleChange("service_status", v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="complete">Complete</SelectItem>
                  <SelectItem value="incomplete">Incomplete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Labor</span>
              <span className="font-medium">${laborCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Parts</span>
              <span className="font-medium">${partsTotal.toFixed(2)}</span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sub Total</span>
              <span className="font-medium">${subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({taxRate}%)</span>
              <span className="font-medium">${taxAmount.toFixed(2)}</span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between text-base font-bold">
              <span>Total Charges</span>
              <span>${totalCharges.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}