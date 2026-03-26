import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function ChargesSection({ form, setForm, partsTotal }) {
  const laborCharge = (form.total_time_hours || 0) * (form.hourly_rate || 0) + (form.misc_charge || 0);
  const subTotal = laborCharge + partsTotal;
  const taxRate = form.tax_rate ?? 9.75;
  const taxAmount = partsTotal * (taxRate / 100);
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
            <div className="flex justify-between text-sm items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                Tax (
                <Input
                type="number"
                min="0"
                step="0.01"
                value={taxRate}
                onChange={(e) => setForm && setForm((f) => ({ ...f, tax_rate: parseFloat(parseFloat(e.target.value).toFixed(2)) || 0 }))}
                className="h-7 w-16 text-xs px-2 inline-flex" />
              
                %):
              </span>
              <span className="font-medium">${taxAmount.toFixed(2)}</span>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between text-base font-bold">
              <span>Total
</span>
              <span>${totalCharges.toFixed(2)}</span>
            </div>
          </div>
      </div>
    </div>);
}