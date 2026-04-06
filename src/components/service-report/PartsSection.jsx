import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Search } from "lucide-react";
import { useState } from "react";

const formatCurrency = (num) =>
  (num || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function PartsSection({ items, setItems }) {
  const [searches, setSearches] = useState({});
  const [editingCost, setEditingCost] = useState(null); // idx of item being edited
  const { data: parts = [] } = useQuery({
    queryKey: ["parts"],
    queryFn: () => base44.entities.Part.list("name", 999999),
  });

  const addItem = () => {
    setItems([...items, { part_name: "", part_description: "", part_id: "", qty: 1, unit_cost: 0, total: 0 }]);
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
        part_name: searches[idx] || p.name,
        part_description: p.name,
        unit_cost: p.unit_cost || 0,
        total: (updated[idx].qty || 1) * (p.unit_cost || 0),
      };
      setItems(updated);
      setSearches({ ...searches, [idx]: "" });
    }
  };

  const getFilteredParts = (idx) => {
    const search = searches[idx] || "";
    return parts.filter((p) =>
      (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(search.toLowerCase())
    );
  };

  const itemsSubTotal = items.reduce((sum, it) => sum + (it.total || 0), 0);

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
      {items.length > 0 && (
        <div className="grid grid-cols-12 gap-2 px-1">
          <div className="col-span-12 md:col-span-2"><Label className="text-xs text-muted-foreground">Part Name</Label></div>
          <div className="col-span-12 md:col-span-4"><Label className="text-xs text-muted-foreground">Description</Label></div>
          <div className="col-span-4 md:col-span-1"><Label className="text-xs text-muted-foreground">Qty</Label></div>
          <div className="col-span-4 md:col-span-2"><Label className="text-xs text-muted-foreground">Unit Cost</Label></div>
          <div className="col-span-3 md:col-span-2"><Label className="text-xs text-muted-foreground">Total</Label></div>
          <div className="col-span-1" />
        </div>
      )}
      {items.map((item, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-center">
          <div className="col-span-12 md:col-span-2">
            <div className="relative">
                {!item.part_name ? (
                  <>
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search part..."
                      value={searches[idx] || ""}
                      onChange={(e) => setSearches({ ...searches, [idx]: e.target.value })}
                      className="pl-9"
                    />
                    {(searches[idx] || "") && (
                      <div className="absolute top-full left-0 right-0 border rounded-lg bg-card max-h-48 overflow-y-auto z-10 mt-1">
                        {getFilteredParts(idx).length > 0 ? (
                          getFilteredParts(idx).map((p) => (
                            <button
                              key={p.id}
                              onClick={() => handlePartSelect(idx, p.id)}
                              className="w-full text-left px-3 py-2 hover:bg-muted border-b last:border-b-0 text-sm"
                            >
                              <p className="font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.sku} · ${p.unit_cost}</p>
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground">No parts found</div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <Input
                    value={item.part_name}
                    onChange={(e) => updateItem(idx, "part_name", e.target.value)}
                    className="text-sm font-medium"
                  />
                )}
              </div>
              <Input
                placeholder="Description..."
                value={item.part_description || ""}
                onChange={(e) => updateItem(idx, "part_description", e.target.value)}
                className="text-sm mt-1"
              />
          </div>
          <div className="col-span-12 md:col-span-4">
            <Input
              placeholder="Description..."
              value={item.part_description || ""}
              onChange={(e) => updateItem(idx, "part_description", e.target.value)}
              className="text-sm"
            />
          </div>
          <div className="col-span-4 md:col-span-1">
            <Input type="number" min="1" value={item.qty || ""} onChange={(e) => updateItem(idx, "qty", parseInt(e.target.value) || 0)} />
          </div>
          <div className="col-span-4 md:col-span-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
              <Input
                type="text"
                inputMode="decimal"
                value={editingCost === idx ? (item.unit_cost || "") : formatCurrency(item.unit_cost)}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9.]/g, "");
                  updateItem(idx, "unit_cost", parseFloat(val) || 0);
                }}
                onBlur={() => setEditingCost(null)}
                onFocus={() => setEditingCost(idx)}
                className="pl-7"
              />
            </div>
          </div>
          <div className="col-span-3 md:col-span-2">
            <div className="h-9 flex items-center px-3 rounded-md bg-muted text-sm font-semibold">
              ${(item.total || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="col-span-1 flex justify-end">
            <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(idx)} className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="border-t pt-4 mt-2 flex flex-col items-end gap-1.5 text-sm">
        <div className="flex gap-8">
          <span className="text-muted-foreground">Items Sub Total:</span>
          <span className="font-semibold w-24 text-right">${itemsSubTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </div>
      </div>
    </div>
  );
}