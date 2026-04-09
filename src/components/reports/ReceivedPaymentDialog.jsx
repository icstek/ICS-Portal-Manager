import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";
import PaymentHistory from "./PaymentHistory";

export default function ReceivedPaymentDialog({ open, onOpenChange, onSubmit, reportId, defaultAmount, totalPaid = 0, payments = [] }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    payment_type: "",
    amount: defaultAmount ? defaultAmount.toFixed(2) : "",
    reference: "",
  });

  const balance = defaultAmount - totalPaid;
  const [saving, setSaving] = useState(false);

  const handleOpen = (isOpen) => {
    if (isOpen) {
      setForm({
        date: new Date().toISOString().split("T")[0],
        payment_type: "",
        amount: "",
        reference: "",
      });
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    if (!form.date) {
      toast({ title: "Please enter a date", variant: "destructive" });
      return;
    }
    if (!form.payment_type) {
      toast({ title: "Please select a payment type", variant: "destructive" });
      return;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast({ title: "Please enter a valid amount", variant: "destructive" });
      return;
    }
    if (!form.reference.trim()) {
      toast({ title: "Please enter a reference", variant: "destructive" });
      return;
    }
    setSaving(true);
    await base44.entities.Payment.create({
      report_id: reportId,
      date: form.date,
      payment_type: form.payment_type,
      amount: parseFloat(form.amount),
      reference: form.reference,
    });
    setSaving(false);
    toast({ title: `Payment of $${parseFloat(form.amount).toFixed(2)} recorded` });
    if (onSubmit) onSubmit(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="max-w-md">
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
                <SelectItem value="echeck">E-Check</SelectItem>
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
        {balance !== undefined && balance > 0 && (
          <div className="text-sm text-muted-foreground bg-muted/50 rounded px-3 py-2">
            Open Balance: <span className="font-semibold text-foreground">${balance.toFixed(2)}</span>
          </div>
        )}
        <PaymentHistory payments={payments} onRemove={onSubmit} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>OK</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}