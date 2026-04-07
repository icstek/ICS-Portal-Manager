import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import CreditCardInput from "./CreditCardInput";

export default function CustomerNotesDialog({ open, onOpenChange, form, setForm, onSave }) {
  const [local, setLocal] = useState({ notes: "", cc_information: "", passwords: "" });

  useEffect(() => {
    if (open) {
      setLocal({
        notes: form.notes || "",
        cc_information: form.cc_information || "",
        passwords: form.passwords || "",
      });
    }
  }, [open]);

  const handleSave = () => {
    setForm({ ...form, ...local });
    if (onSave) onSave(local);
    onOpenChange(false);
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 9999 }}>
      <div className="fixed inset-0 bg-black/80" onClick={() => onOpenChange(false)} />
      <div className="relative bg-background border rounded-lg shadow-lg w-full max-w-2xl mx-4 p-6 space-y-4" style={{ zIndex: 10000 }}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Customer Notes</h2>
          <button onClick={() => onOpenChange(false)} className="rounded-sm opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Customer Notes:</Label>
            <Textarea
              value={local.notes}
              onChange={(e) => setLocal({ ...local, notes: e.target.value })}
              className="mt-1 min-h-[200px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs font-semibold mb-1 block">CC Information:</Label>
              <CreditCardInput
                value={local.cc_information}
                onChange={(val) => setLocal({ ...local, cc_information: val })}
              />
            </div>
            <div>
              <Label className="text-xs">Passwords:</Label>
              <Textarea
                value={local.passwords}
                onChange={(e) => setLocal({ ...local, passwords: e.target.value })}
                className="mt-1 min-h-[120px]"
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}