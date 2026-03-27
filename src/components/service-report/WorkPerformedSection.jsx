import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, X, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from "@/components/ui/command";
import { useState } from "react";

export default function WorkPerformedSection({ selectedServices = [], onChange }) {
  const [open, setOpen] = useState(false);

  const { data: services = [] } = useQuery({
    queryKey: ["services"],
    queryFn: () => base44.entities.Service.list("shortname"),
  });

  const availableServices = services.filter(
    (s) => !selectedServices.some((sel) => sel.shortname === s.shortname)
  );

  const handleSelect = (serviceId) => {
    const svc = services.find((s) => s.id === serviceId);
    if (svc) {
      onChange([...selectedServices, { shortname: svc.shortname, description: svc.description }]);
    }
    setOpen(false);
  };

  const handleRemove = (index) => {
    onChange(selectedServices.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Work Performed</h3>
        {availableServices.length > 0 && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="gap-1.5 h-7 text-xs">
                <Plus className="w-3 h-3" /> Add Service
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="end">
              <Command>
                <CommandInput placeholder="Search service codes..." />
                <CommandList>
                  <CommandEmpty>No services found.</CommandEmpty>
                  {availableServices.map((s) => (
                    <CommandItem key={s.id} value={`${s.shortname} ${s.description}`} onSelect={() => handleSelect(s.id)}>
                      <span className="font-mono font-medium text-xs">{s.shortname}</span>
                      <span className="text-muted-foreground text-xs ml-2 truncate">— {s.description}</span>
                    </CommandItem>
                  ))}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {selectedServices.length === 0 ? (
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