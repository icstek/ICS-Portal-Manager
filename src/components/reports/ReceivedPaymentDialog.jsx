import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ReceivedPaymentDialog({ open, onOpenChange, onSubmit, defaultAmount }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    payment_type: "",
    amount: defaultAmount ? defaultAmount.toFixed(2) : "",
    reference: "",
  });

  const handleOpen = (isOpen) => {
    if (isOpen) {
      setForm({
        date: new Date().toISOString().split("T")[0],
        payment_type: "",
        amount: defaultAmount ? defaultAmount.toFixed(2) : "",
        reference: "",
      });
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Received Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Date</Label>
            <Input
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Payment Type</Label>
            <Select value={form.payment_type} onValueChange={(v) => setForm({ ...form, payment_type: v })}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="check">Check</SelectItem>
                <SelectItem value="visa">Visa</SelectItem>
                <SelectItem value="mastercard">Master Card</SelectItem>
                <SelectItem value="discover">Discover</SelectItem>
                <SelectItem value="amex">American Express</SelectItem>
                <SelectItem value="ach">ACH / Bank Transfer</SelectItem>
                <SelectItem value="zelle">Zelle</SelectItem>
                <SelectItem value="venmo">Venmo</SelectItem>
                <SelectItem value="paypal">PayPal</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="mt-1"
              placeholder="0.00"
            />
          </div>
          <div>
            <Label className="text-xs">Reference</Label>
            <Input
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              className="mt-1"
              placeholder="Check #, confirmation, etc."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { if (onSubmit) onSubmit(form); onOpenChange(false); }}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}