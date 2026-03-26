import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const receivedOptions = ["computer", "printer", "laptop", "screen"];

export default function EquipmentSection({ form, setForm }) {
  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const toggleReceived = (item) => {
    const current = form.received_items || [];
    const updated = current.includes(item) ? current.filter((i) => i !== item) : [...current, item];
    setForm((f) => ({ ...f, received_items: updated }));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Equipment Description</h3>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-xs text-muted-foreground">Equipment Model</Label>
          <Input
            value={form.equipment_model || ""}
            onChange={(e) => handleChange("equipment_model", e.target.value)}
            className="mt-1"
            placeholder="e.g. Dell XPS 15"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Serial Number</Label>
          <Input
            value={form.equipment_serial || ""}
            onChange={(e) => handleChange("equipment_serial", e.target.value)}
            className="mt-1"
            placeholder="e.g. SN123456789"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">System Password</Label>
          <Input
            value={form.system_password || ""}
            onChange={(e) => handleChange("system_password", e.target.value)}
            className="mt-1"
          />
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
  );
}