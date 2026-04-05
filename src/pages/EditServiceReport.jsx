import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useRole } from "@/hooks/useRole";
import CustomerSection from "@/components/service-report/CustomerSection";
import TechnicianSection from "@/components/service-report/TechnicianSection";
import PartsSection from "@/components/service-report/PartsSection";
import ChargesSection from "@/components/service-report/ChargesSection";
import EquipmentSection from "@/components/service-report/EquipmentSection";
import SignatureCanvas from "@/components/service-report/SignatureCanvas";
import WorkPerformedSection from "@/components/service-report/WorkPerformedSection";
import { downloadIncompleteReportICS } from "@/lib/generateICS";

export default function EditServiceReport() {
  const id = window.location.pathname.split("/").filter(Boolean).find((_, i, arr) => arr[i - 1] === "edit" || arr[i - 1] === "reports") || window.location.pathname.split("/")[2];
  const navigate = useNavigate();
  const { isGlobalAdmin, isTechnician, loading: roleLoading } = useRole();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(null);
  const [items, setItems] = useState([]);
  const [servicesPerformed, setServicesPerformed] = useState([]);
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  const [addToCalendar, setAddToCalendar] = useState(false);

  const { data: report, isLoading } = useQuery({
    queryKey: ["report", id],
    queryFn: async () => {
      const reports = await base44.entities.ServiceReport.filter({ id });
      return reports[0];
    },
    enabled: !!id,
  });

  // Populate form from report data
  useEffect(() => {
    if (report && !form) {
      setForm({
        report_type: report.report_type || "repair",
        date: report.date || "",
        report_number: report.report_number || "",
        memo: report.memo || "",
        customer_id: report.customer_id || "",
        customer_name: report.customer_name || "",
        customer_address: report.customer_address || "",
        customer_city: report.customer_city || "",
        customer_zip: report.customer_zip || "",
        customer_tel: report.customer_tel || "",
        customer_cell: report.customer_cell || "",
        problem_description: report.problem_description || "",
        technician_id: report.technician_id || "",
        technician_name: report.technician_name || "",
        time_arrive: report.time_arrive || "",
        time_left: report.time_left || "",
        wait_time: report.wait_time || 0,
        total_time_hours: report.total_time_hours || 0,
        hourly_rate: report.hourly_rate || 145,
        misc_charge: report.misc_charge || 0,
        service_description: report.service_description || "",
        system_password: report.system_password || "",
        service_status: report.service_status || "incomplete",
        received_items: report.received_items || [],
        equipment_model: report.equipment_model || "",
        equipment_serial: report.equipment_serial || "",
        travel_charge: report.travel_charge || 0,
        tax_rate: report.tax_rate ?? 9.75,
      });
      setItems(report.items_replaced || []);
      setServicesPerformed(report.services_performed || []);
    }
  }, [report]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let customer_signature_url = report.customer_signature_url;
      if (signatureDataUrl) {
        const blob = await fetch(signatureDataUrl).then(r => r.blob());
        const file = new File([blob], "signature.png", { type: "image/png" });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        customer_signature_url = file_url;
      }

      const partsTotal = items.reduce((sum, it) => sum + (it.total || 0), 0);
      const laborOnly = (form.total_time_hours || 0) * (form.hourly_rate || 0);
      const travelCharge = form.misc_charge || 0;
      const subTotal = laborOnly + travelCharge + partsTotal;
      const taxAmount = partsTotal * ((form.tax_rate ?? 9.75) / 100);
      const totalCharges = subTotal + taxAmount;

      const reportData = {
        ...form,
        total_labor: laborOnly + travelCharge,
        items_replaced: items,
        services_performed: servicesPerformed,
        labor_charge: laborOnly,
        parts_charge: partsTotal,
        travel_charge: travelCharge,
        sub_total: subTotal,
        tax_amount: taxAmount,
        parts_total: partsTotal,
        total_charges: totalCharges,
        customer_signature_url,
      };

      await base44.entities.ServiceReport.update(id, reportData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      queryClient.invalidateQueries({ queryKey: ["report", id] });
      toast.success("Report updated successfully!");

      if (addToCalendar) {
        downloadIncompleteReportICS({
          reportNumber: form.report_number,
          customerName: form.customer_name,
          customerAddress: form.customer_address,
          customerCity: form.customer_city,
          date: form.date,
          problemDescription: form.problem_description,
          technicianName: form.technician_name,
        });
        toast.info("Calendar event file downloaded.");
      }

      navigate(`/reports/${id}`);
    },
  });

  const canEdit = isGlobalAdmin || (isTechnician && report?.service_status === "incomplete");

  // Guard: check permissions
  if (roleLoading || isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report || !form) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Report not found</p>
        <Button variant="outline" onClick={() => navigate("/reports")} className="mt-4">Back to Reports</Button>
      </div>
    );
  }

  if (!canEdit) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {isTechnician ? "You can only edit reports with Incomplete status." : "You don't have permission to edit reports."}
        </p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const partsTotal = items.reduce((sum, it) => sum + (it.total || 0), 0);
  const laborCharge = (form.total_time_hours || 0) * (form.hourly_rate || 0) + (form.misc_charge || 0);
  const subTotal = laborCharge + partsTotal + (form.travel_charge || 0);
  const taxAmount = partsTotal * ((form.tax_rate ?? 9.75) / 100);
  const totalCharges = subTotal + taxAmount;

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
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(`/reports/${id}`)} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-inter tracking-tight">
            Edit Report #{form.report_number}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isGlobalAdmin ? "Editing as Global Admin" : "Editing Incomplete Report"}
          </p>
        </div>
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
                <label className="flex items-center gap-2 text-sm cursor-pointer mt-2">
                  <Checkbox checked={addToCalendar} onCheckedChange={setAddToCalendar} />
                  Add to Calendar
                </label>
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Report #</Label>
                <Input value={form.report_number || ""} onChange={(e) => setForm((f) => ({ ...f, report_number: e.target.value }))} className="mt-1" />
              </div>
              <div className="flex-[2]">
                <Label className="text-xs text-muted-foreground">Memo</Label>
                <Input value={form.memo || ""} onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))} className="mt-1" placeholder="Short description (Internal only)..." />
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

        {/* Equipment */}
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

        {/* Work Performed */}
        <Card>
          <CardContent className="p-6">
            <WorkPerformedSection selectedServices={servicesPerformed} onChange={setServicesPerformed} />
          </CardContent>
        </Card>

        {/* Parts */}
        <Card>
          <CardContent className="p-6">
            <PartsSection items={items} setItems={setItems} />
          </CardContent>
        </Card>

        {/* Terms & Charges */}
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
          <CardContent className="p-6 space-y-3">
            <p className="text-sm text-muted-foreground italic">
              I have read the Terms &amp; Conditions, and agree to pay the above charges in full.
            </p>
            {report.customer_signature_url && !signatureDataUrl && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Current signature:</p>
                <img src={report.customer_signature_url} alt="Current Signature" className="h-20 border rounded-lg p-1 bg-white" />
              </div>
            )}
            <SignatureCanvas onSignatureChange={setSignatureDataUrl} />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3 pb-8">
          <Button type="button" variant="outline" onClick={() => navigate(`/reports/${id}`)}>Cancel</Button>
          <Button type="submit" disabled={saveMutation.isPending} className="gap-2">
            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}