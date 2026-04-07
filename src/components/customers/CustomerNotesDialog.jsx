import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function CustomerNotesDialog({ open, onOpenChange, form, setForm }) {
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
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Customer Notes</DialogTitle>
        </DialogHeader>
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
              <Label className="text-xs">CC Information:</Label>
              <Textarea
                value={local.cc_information}
                onChange={(e) => setLocal({ ...local, cc_information: e.target.value })}
                className="mt-1 min-h-[120px]"
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
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}