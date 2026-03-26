import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EquipmentSection({ form, setForm }) {
  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Equipment Description</h3>
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
      </div>
    </div>
  );
}