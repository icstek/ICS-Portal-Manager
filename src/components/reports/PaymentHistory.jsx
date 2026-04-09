import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "@/components/ui/use-toast";
import { useState } from "react";

const PAYMENT_LABELS = {
  cash: "Cash", check: "Check", visa: "Visa", mastercard: "Master Card",
  discover: "Discover", amex: "Amex", ach: "ACH", zelle: "Zelle",
  venmo: "Venmo", paypal: "PayPal", echeck: "E-Check", other: "Other",
};

export default function PaymentHistory({ payments, onRemove }) {
  const [removing, setRemoving] = useState(null);

  if (!payments?.length) return null;

  const handleRemove = async (payment) => {
    if (!confirm(`Remove $${payment.amount.toFixed(2)} ${PAYMENT_LABELS[payment.payment_type] || payment.payment_type} payment?`)) return;
    setRemoving(payment.id);
    await base44.entities.Payment.delete(payment.id);
    toast({ title: "Payment removed" });
    setRemoving(null);
    if (onRemove) onRemove();
  };

  return (
    <div className="space-y-1">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Payment History</h4>
      <div className="border rounded-md divide-y max-h-40 overflow-auto">
        {payments.map((p) => (
          <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-muted-foreground text-xs whitespace-nowrap">
                {p.date ? format(new Date(p.date.includes("T") ? p.date : p.date + "T00:00:00"), "MM/dd/yy") : "—"}
              </span>
              <span className="font-medium truncate">{PAYMENT_LABELS[p.payment_type] || p.payment_type}</span>
              {p.reference && <span className="text-muted-foreground text-xs truncate">#{p.reference}</span>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-semibold text-green-700">${p.amount.toFixed(2)}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemove(p)}
                disabled={removing === p.id}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}