import { Label } from "@/components/ui/label";

export default function ChargesSection({ form, partsTotal }) {
  const laborCharge = (form.total_time_hours || 0) * (form.hourly_rate || 0) + (form.misc_charge || 0);
  const subTotal = laborCharge + partsTotal;
  const taxRate = form.tax_rate ?? 9.75;
  const taxAmount = subTotal * (taxRate / 100);
  const totalCharges = subTotal + taxAmount;

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Charges</h3>

      <div className="space-y-3">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Labor</span>
              <span className="font-medium">${laborCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Parts</span>
              <span className="font-medium">${partsTotal.toFixed(2)}</span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sub Total</span>
              <span className="font-medium">${subTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({taxRate}%)</span>
              <span className="font-medium">${taxAmount.toFixed(2)}</span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between text-base font-bold">
              <span>Total Service & Travel Charge</span>
              <span>${totalCharges.toFixed(2)}</span>
            </div>
          </div>
      </div>
    </div>
  );
}