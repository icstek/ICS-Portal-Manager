import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";

export default function PartsSection({ items, setItems }) {
  const { data: parts = [] } = useQuery({
    queryKey: ["parts"],
    queryFn: () => base44.entities.Part.list("name"),
  });

  const addItem = () => {
    setItems([...items, { part_name: "", part_id: "", qty: 1, unit_cost: 0, total: 0 }]);
  };

  const removeItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const updateItem = (idx, field, value) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: value };
    if (field === "qty" || field === "unit_cost") {
      updated[idx].total = (updated[idx].qty || 0) * (updated[idx].unit_cost || 0);
    }
    setItems(updated);
  };

  const handlePartSelect = (idx, partId) => {
    const p = parts.find((p) => p.id === partId);
    if (p) {
      const updated = [...items];
      updated[idx] = {
        ...updated[idx],
        part_id: p.id,
        part_name: p.name,
        unit_cost: p.unit_cost || 0,
        total: (updated[idx].qty || 1) * (p.unit_cost || 0),
      };
      setItems(updated);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Items Replaced</h3>
        <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1 text-xs">
          <Plus className="w-3 h-3" /> Add Part
        </Button>
      </div>
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No parts added yet.</p>
      )}
      {items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-end">
          <div className="col-span-12 md:col-span-4">
            <Label className="text-xs text-muted-foreground">Part</Label>
            <Select value={item.part_id || ""} onValueChange={(v) => handlePartSelect(idx, v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select part..." />
              </SelectTrigger>
              <SelectContent>
                {parts.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} (${p.unit_cost})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-4 md:col-span-2">
            <Label className="text-xs text-muted-foreground">Qty</Label>
            <Input type="number" min="1" value={item.qty || ""} onChange={(e) => updateItem(idx, "qty", parseInt(e.target.value) || 0)} className="mt-1" />
          </div>
          <div className="col-span-4 md:col-span-2">
            <Label className="text-xs text-muted-foreground">Unit Cost</Label>
            <Input type="number" step="0.01" value={item.unit_cost || ""} onChange={(e) => updateItem(idx, "unit_cost", parseFloat(e.target.value) || 0)} className="mt-1" />
          </div>
          <div className="col-span-3 md:col-span-3">
            <Label className="text-xs text-muted-foreground">Total</Label>
            <div className="mt-1 h-9 flex items-center px-3 rounded-md bg-muted text-sm font-semibold">
              ${(item.total || 0).toFixed(2)}
            </div>
          </div>
          <div className="col-span-1 flex justify-end">
            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)} className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}