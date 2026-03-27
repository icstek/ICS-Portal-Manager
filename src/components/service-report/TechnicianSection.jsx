import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";

export default function TechnicianSection({ form, setForm }) {
  const [travelChecked, setTravelChecked] = useState(false);
  const { user } = useAuth();
  const autoSelected = useRef(false);
  const isGlobalAdmin = user?.role === "global_admin";

  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians"],
    queryFn: () => base44.entities.Technician.list("name"),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list("full_name"),
    enabled: isGlobalAdmin,
  });

  // For global admins, merge technicians + users (deduplicate by name)
  const techOptions = useMemo(() => {
    if (!isGlobalAdmin) return technicians.map((t) => ({ id: t.id, name: t.name, hourly_rate: t.hourly_rate, source: "tech" }));
    const options = technicians.map((t) => ({ id: t.id, name: t.name, hourly_rate: t.hourly_rate, source: "tech" }));
    const techNames = new Set(options.map((o) => o.name?.trim().toLowerCase()));
    allUsers.forEach((u) => {
      if (!techNames.has(u.full_name?.trim().toLowerCase())) {
        options.push({ id: `user_${u.id}`, name: u.full_name, hourly_rate: null, source: "user" });
      }
    });
    return options;
  }, [technicians, allUsers, isGlobalAdmin]);

  useEffect(() => {
    if (autoSelected.current || !user || !techOptions.length) return;
    if (form.technician_id && form.technician_id !== "") return;
    const userName = (user.full_name || "").trim().toLowerCase();
    const userEmail = (user.email || "").trim().toLowerCase();
    const match = techOptions.find(
      (t) => t.name?.trim().toLowerCase() === userName
    ) || technicians.find(
      (t) => t.created_by?.trim().toLowerCase() === userEmail
    );
    if (match) {
      autoSelected.current = true;
      setForm((f) => ({
        ...f,
        technician_id: match.id,
        technician_name: match.name || "",
        hourly_rate: match.hourly_rate || f.hourly_rate || 145,
      }));
    }
  }, [techOptions, user]);

  const handleTechSelect = (optionId) => {
    const opt = techOptions.find((o) => o.id === optionId);
    if (opt) {
      setForm((f) => ({
        ...f,
        technician_id: opt.id,
        technician_name: opt.name || "",
        hourly_rate: opt.hourly_rate || f.hourly_rate || 145,
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
            {techOptions.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs text-muted-foreground">Service Description (Technician Comments)</Label>
        <Textarea value={form.service_description || ""} onChange={(e) => handleChange("service_description", e.target.value)} className="mt-1 min-h-[80px]" placeholder="Describe the repair work performed..." />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
        <div>
          <Label className="text-xs text-muted-foreground block mb-1">Total Hours</Label>
          <Input type="number" step="1" value={form.total_time_hours || ""} onChange={(e) => handleChange("total_time_hours", parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground block mb-1">Hr. Rate ($)</Label>
          <Input type="number" step="1" value={form.hourly_rate || ""} onChange={(e) => handleChange("hourly_rate", parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Checkbox
              id="travel-check"
              checked={travelChecked}
              onCheckedChange={(checked) => {
                setTravelChecked(checked);
                handleChange("misc_charge", checked ? 85 : "");
              }}
            />
            <Label htmlFor="travel-check" className="text-xs text-muted-foreground cursor-pointer leading-none">Travel Charge ($)</Label>
          </div>
          <Input type="number" step="1" value={form.misc_charge || ""} onChange={(e) => handleChange("misc_charge", parseFloat(e.target.value) || 0)} />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground block mb-1">Total Labor</Label>
          <div className="h-9 flex items-center px-3 rounded-md bg-muted text-sm font-semibold">
            ${((form.total_time_hours || 0) * (form.hourly_rate || 0)).toFixed(2)}
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground block mb-1">Service & Travel Charge</Label>
          <div className="h-9 flex items-center px-3 rounded-md bg-primary/10 text-sm font-semibold text-primary">
            ${((form.total_time_hours || 0) * (form.hourly_rate || 0) + (form.misc_charge || 0)).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}