import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { toast } from "sonner";
import CreditCardInput from "./CreditCardInput";
import { useRole } from "@/hooks/useRole";

export default function CustomerNotesDialog({ open, onOpenChange, form, setForm, onSave, readOnly = false, customerId, onCCSubmit }) {
  const { isGlobalAdmin } = useRole();
  const [local, setLocal] = useState({ notes: "", cc_information: "", passwords: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      // Immediately populate from form props so fields are usable right away
      setLocal({ notes: form.notes || "", cc_information: form.cc_information || "", passwords: form.passwords || "" });
      setLoading(false);

      if (customerId) {
        // Fetch fresh data in background and update when ready
        base44.entities.Customer.filter({ id: customerId }).then((results) => {
          const fresh = results[0];
          if (fresh) {
            setLocal({
              notes: fresh.notes || "",
              cc_information: fresh.cc_information || "",
              passwords: fresh.passwords || "",
            });
          }
        });
      }
    }
  }, [open, customerId]);

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
              readOnly={readOnly}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 items-stretch">
            <div>
              <Label className="text-xs font-semibold mb-1 block">CC Information:</Label>
              <CreditCardInput
                value={local.cc_information}
                onChange={(val) => setLocal({ ...local, cc_information: val })}
                readOnly={false}
              />
              {customerId && (
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={async () => {
                    await base44.entities.Customer.update(customerId, { cc_information: local.cc_information });
                    setForm((f) => ({ ...f, cc_information: local.cc_information }));
                    if (onCCSubmit) onCCSubmit();
                    toast.success("CC information saved");
                  }}
                >
                  Submit CC Info
                </Button>
              )}
              {customerId && isGlobalAdmin && local.cc_information && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="mt-2 ml-2"
                  onClick={async () => {
                    await base44.entities.Customer.update(customerId, { cc_information: "" });
                    setLocal((l) => ({ ...l, cc_information: "" }));
                    setForm((f) => ({ ...f, cc_information: "" }));
                    if (onCCSubmit) onCCSubmit();
                    toast.success("CC information cleared");
                  }}
                >
                  Clear CC Info
                </Button>
              )}
            </div>
            <div className="flex flex-col">
              <Label className="text-xs">Passwords:</Label>
              <Textarea
                value={local.passwords}
                onChange={(e) => setLocal({ ...local, passwords: e.target.value })}
                className="mt-1 flex-1"
                readOnly={readOnly}
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{readOnly ? "Close" : "Cancel"}</Button>
          {!readOnly && <Button onClick={handleSave}>Save</Button>}
        </div>
      </div>
    </div>,
    document.body
  );
}