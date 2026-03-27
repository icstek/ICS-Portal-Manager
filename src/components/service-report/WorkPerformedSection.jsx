import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

export default function WorkPerformedSection({ selectedServices = [], onChange }) {
  const [adding, setAdding] = useState(false);

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => base44.entities.Service.list("shortname"),
  });

  const availableServices = services.filter(
    (s) => !selectedServices.some((sel) => sel.shortname === s.shortname)
  );

  const handleAdd = (serviceId) => {
    const svc = services.find((s) => s.id === serviceId);
    if (svc) {
      onChange([...selectedServices, { shortname: svc.shortname, description: svc.description }]);
    }
    setAdding(false);
  };

  const handleRemove = (index) => {
    onChange(selectedServices.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Work Performed</h3>
        {availableServices.length > 0 && (
          <Button type="button" variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => setAdding(true)}>
            <Plus className="w-3 h-3" /> Add Service
          </Button>
        )}
      </div>

      {adding && (
        <Select onValueChange={handleAdd}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a service code..." />
          </SelectTrigger>
          <SelectContent>
            {availableServices.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                <span className="font-mono font-medium">{s.shortname}</span>
                <span className="text-muted-foreground ml-2">— {s.description}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {selectedServices.length === 0 && !adding ? (
        <p className="text-xs text-muted-foreground italic">No service codes added yet</p>
      ) : (
        <div className="space-y-2">
          {selectedServices.map((svc, idx) => (
            <div key={idx} className="flex items-start gap-2 bg-muted/50 rounded-lg p-2.5">
              <Badge variant="secondary" className="font-mono text-xs shrink-0 mt-0.5">{svc.shortname}</Badge>
              <p className="text-sm text-muted-foreground flex-1">{svc.description}</p>
              <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleRemove(idx)}>
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}