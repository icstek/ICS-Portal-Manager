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

const initialForm = {
  report_type: "repair",
  date: new Date().toISOString().split("T")[0],
  report_number: "",
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
  tax_rate: 9.5,
};

export default function NewServiceReport() {
  const [form, setForm] = useState(initialForm);
  const [items, setItems] = useState([]);
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
  const taxAmount = subTotal * ((form.tax_rate ?? 9.5) / 100);
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
            <ChargesSection form={form} setForm={setForm} partsTotal={partsTotal} />
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