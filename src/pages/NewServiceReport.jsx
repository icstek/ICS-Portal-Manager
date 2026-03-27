import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import CustomerSection from "@/components/service-report/CustomerSection";
import TechnicianSection from "@/components/service-report/TechnicianSection";
import PartsSection from "@/components/service-report/PartsSection";
import ChargesSection from "@/components/service-report/ChargesSection";
import EquipmentSection from "@/components/service-report/EquipmentSection";
import SignatureCanvas from "@/components/service-report/SignatureCanvas";

const initialForm = {
  report_type: "repair",
  date: new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" }),
  report_number: "",
  memo: "",
  customer_id: "",
  customer_name: "",
  customer_address: "",
  customer_city: "",
  customer_zip: "",
  customer_tel: "",
  customer_cell: "",
  problem_description: "",
  technician_id: "",
  technician_name: "",
  time_arrive: "",
  time_left: "",
  wait_time: 0,
  total_time_hours: 0,
  hourly_rate: 0,
  misc_charge: 0,
  service_description: "",
  system_password: "",
  service_status: "incomplete",
  received_items: [],
  equipment_model: "",
  equipment_serial: "",
  travel_charge: 0,
  tax_rate: 9.75,
};

export default function NewServiceReport() {
  const [form, setForm] = useState(initialForm);
  const [items, setItems] = useState([]);
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Auto-generate report number starting at 1000
  useEffect(() => {
    base44.entities.ServiceReport.list().then((reports) => {
      const numbers = reports
        .map((r) => parseInt(r.report_number))
        .filter((n) => !isNaN(n));
      const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1000;
      setForm((f) => ({ ...f, report_number: String(next) }));
    });
  }, []);

  const partsTotal = items.reduce((sum, it) => sum + (it.total || 0), 0);
  const laborCharge = (form.total_time_hours || 0) * (form.hourly_rate || 0) + (form.misc_charge || 0);
  const subTotal = laborCharge + partsTotal + (form.travel_charge || 0);
  const taxAmount = partsTotal * ((form.tax_rate ?? 9.75) / 100);
  const totalCharges = subTotal + taxAmount;

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Save new customer if no existing one selected
      let customerId = form.customer_id;
      if (!customerId && form.customer_name) {
        const newCustomer = await base44.entities.Customer.create({
          name: form.customer_name,
          address: form.customer_address,
          city: form.customer_city,
          zip: form.customer_zip,
          tel: form.customer_tel,
          cell: form.customer_cell,
        });
        customerId = newCustomer.id;
      }

      // Upload signature if present
      let customer_signature_url = null;
      if (signatureDataUrl) {
        const blob = await fetch(signatureDataUrl).then(r => r.blob());
        const file = new File([blob], "signature.png", { type: "image/png" });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        customer_signature_url = file_url;
      }

      const reportData = {
        ...form,
        customer_id: customerId,
        total_labor: laborCharge,
        items_replaced: items,
        labor_charge: laborCharge,
        parts_charge: partsTotal,
        sub_total: subTotal,
        tax_amount: taxAmount,
        parts_total: partsTotal,
        total_charges: totalCharges,
        customer_signature_url,
      };

      await base44.entities.ServiceReport.create(reportData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Service report saved successfully!");
      navigate("/reports");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.customer_name) {
      toast.error("Customer name is required");
      return;
    }
    saveMutation.mutate();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold font-inter tracking-tight">New Service Report</h1>
        <p className="text-muted-foreground text-sm mt-1">Fill out the service report form below</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Report Info */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div>
                <Label className="text-xs text-muted-foreground">Report Type</Label>
                <RadioGroup value={form.report_type} onValueChange={(v) => setForm((f) => ({ ...f, report_type: v }))} className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value="repair" /> Repair
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value="estimate" /> Estimate
                  </label>
                </RadioGroup>
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Report #</Label>
                <Input value={form.report_number || ""} onChange={(e) => setForm((f) => ({ ...f, report_number: e.target.value }))} className="mt-1" placeholder="Loading..." />
              </div>
              <div className="flex-[2]">
                <Label className="text-xs text-muted-foreground">Memo</Label>
                <Input value={form.memo || ""} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} className="mt-1" placeholder="Short description (internal only)..." />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer */}
        <Card>
          <CardContent className="p-6">
            <CustomerSection form={form} setForm={setForm} />
          </CardContent>
        </Card>

        {/* Equipment Description */}
        <Card>
          <CardContent className="p-6">
            <EquipmentSection form={form} setForm={setForm} />
          </CardContent>
        </Card>

        {/* Problem Description */}
        <Card>
          <CardContent className="p-6 space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Problem Description (Customer)</h3>
            <Textarea
              value={form.problem_description || ""}
              onChange={(e) => setForm((f) => ({ ...f, problem_description: e.target.value }))}
              placeholder="Describe the problem as reported by the customer..."
              className="min-h-[80px]"
            />
          </CardContent>
        </Card>

        {/* Technician & Labor */}
        <Card>
          <CardContent className="p-6">
            <TechnicianSection form={form} setForm={setForm} />
          </CardContent>
        </Card>

        {/* Parts */}
        <Card>
          <CardContent className="p-6">
            <PartsSection items={items} setItems={setItems} />
          </CardContent>
        </Card>

        {/* Equipment & Charges */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">Terms &amp; Conditions</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The service and repair estimates indicated herein are hereby acceptable to the undersigned. Items not picked up within 30 calendar days from the date below will be subject to sale in order to recover ICS expenses. Customer understands that ICS is not responsible for loss or damage to any equipment in case of fire, theft, or any other causes beyond ICS control. In addition, ICS is not responsible for loss of Customer's programs or data for any reason. Customer is solely responsible to make backup of computer system data, software and applications prior to ICS services herein. All Spyware and Virus Cleanups do not carry warranty for labor due to the nature of the system use with the internet. All returned checks will be charged a $25.00 fee. All returned Sales are subject to a 20% restocking fee. I hereby authorize the repair work herein set forth, to be done with all necessary materials and grants ICS and its employees permission to operate the computer system and other equipment herein described for the purposes of repair and testing at my sole and exclusive risk. An express mechanic's lien is hereby acknowledged on the above equipment to secure the amount of repairs and parts listed in, or hereafter added in, this invoice.
                </p>
              </div>
              <div className="md:w-72">
                <ChargesSection form={form} setForm={setForm} partsTotal={partsTotal} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Signature */}
        <Card>
          <CardContent className="p-6">
            <SignatureCanvas onSignatureChange={setSignatureDataUrl} />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => navigate("/reports")}>Cancel</Button>
          <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Report
          </Button>
        </div>
      </form>
    </div>
  );
}