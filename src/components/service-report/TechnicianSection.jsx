import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TechnicianSection({ form, setForm }) {
  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians"],
    queryFn: () => base44.entities.Technician.list("name"),
  });

  const handleTechSelect = (techId) => {
    const t = technicians.find((t) => t.id === techId);
    if (t) {
      setForm((f) => ({
        ...f,
        technician_id: t.id,
        technician_name: t.name || "",
        hourly_rate: t.hourly_rate || f.hourly_rate || 0,
      }));
    }
  };

  const handleChange = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Technician & Labor</h3>
      <div>
        <Label className="text-xs text-muted-foreground">Technician</Label>
        <Select value={form.technician_id || ""} onValueChange={handleTechSelect}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select technician..." />
          </SelectTrigger>
          <SelectContent>
            {technicians.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Service Description (Technician Comments)</Label>
        <Textarea value={form.service_description || ""} onChange={(e) => handleChange("service_description", e.target.value)} className="mt-1 min-h-[80px]" placeholder="Describe the repair work performed..." />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Total Hours</Label>
          <Input type="number" step="0.25" value={form.total_time_hours || ""} onChange={(e) => handleChange("total_time_hours", parseFloat(e.target.value) || 0)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Hr. Rate ($)</Label>
          <Input type="number" step="0.01" value={form.hourly_rate || ""} onChange={(e) => handleChange("hourly_rate", parseFloat(e.target.value) || 0)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Travel Time ($)</Label>
          <Input type="number" step="0.01" value={form.misc_charge || ""} onChange={(e) => handleChange("misc_charge", parseFloat(e.target.value) || 0)} className="mt-1" />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Total Labor</Label>
          <div className="mt-1 h-9 flex items-center px-3 rounded-md bg-muted text-sm font-semibold">
            ${((form.total_time_hours || 0) * (form.hourly_rate || 0)).toFixed(2)}
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Service Charge & Travel Charge</Label>
          <div className="mt-1 h-9 flex items-center px-3 rounded-md bg-primary/10 text-sm font-semibold text-primary">
            ${((form.total_time_hours || 0) * (form.hourly_rate || 0) + (form.misc_charge || 0)).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}