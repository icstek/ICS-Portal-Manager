import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useRole } from "@/hooks/useRole";
import { toast } from "sonner";

export default function ReportDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = window.location.pathname.split("/").pop();
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.ServiceReport.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report deleted");
      navigate("/reports");
    },
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ["report", id],
    queryFn: async () => {
      const reports = await base44.entities.ServiceReport.filter({ id });
      return reports[0];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Report not found</p>
        <Button variant="outline" onClick={() => navigate("/reports")} className="mt-4">Back to Reports</Button>
      </div>
    );
  }

  const r = report;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/reports")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4" /> Print
          </Button>
          {isAdmin && (
            <Button
              variant="destructive"
              onClick={() => { if (confirm("Delete this report?")) deleteMutation.mutate(); }}
              className="gap-2"
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-xl">Service Report {r.report_number ? `#${r.report_number}` : ""}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {r.date ? format(new Date(r.date), "MMMM d, yyyy") : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="capitalize">{r.report_type}</Badge>
              <Badge variant={r.service_status === "complete" ? "default" : "secondary"} className="capitalize">{r.service_status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Customer */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Customer</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{r.customer_name}</span></div>
              {r.customer_address && <div><span className="text-muted-foreground">Address:</span> {r.customer_address}</div>}
              {r.customer_city && <div><span className="text-muted-foreground">City:</span> {r.customer_city} {r.customer_zip}</div>}
              {r.customer_tel && <div><span className="text-muted-foreground">Tel:</span> {r.customer_tel}</div>}
              {r.customer_cell && <div><span className="text-muted-foreground">Cell:</span> {r.customer_cell}</div>}
            </div>
          </div>

          {/* Problem */}
          {r.problem_description && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Problem Description</h3>
              <p className="text-sm bg-muted/50 rounded-lg p-3">{r.problem_description}</p>
            </div>
          )}

          {/* Technician */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Technician & Labor</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {r.technician_name && <div><span className="text-muted-foreground">Technician:</span> <span className="font-medium">{r.technician_name}</span></div>}
              {r.time_arrive && <div><span className="text-muted-foreground">Arrive:</span> {r.time_arrive}</div>}
              {r.time_left && <div><span className="text-muted-foreground">Left:</span> {r.time_left}</div>}
              <div><span className="text-muted-foreground">Hours:</span> {r.total_time_hours || 0}</div>
              <div><span className="text-muted-foreground">Rate:</span> ${r.hourly_rate || 0}/hr</div>
              <div><span className="text-muted-foreground">Labor:</span> <span className="font-medium">${(r.labor_charge || 0).toFixed(2)}</span></div>
            </div>
          </div>

          {/* Service Description */}
          {r.service_description && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Service Description</h3>
              <p className="text-sm bg-muted/50 rounded-lg p-3">{r.service_description}</p>
            </div>
          )}

          {/* Parts */}
          {r.items_replaced?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Parts Replaced</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-2 font-medium">Part</th>
                      <th className="text-right p-2 font-medium">Qty</th>
                      <th className="text-right p-2 font-medium">Unit Cost</th>
                      <th className="text-right p-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.items_replaced.map((item, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{item.part_name}</td>
                        <td className="p-2 text-right">{item.qty}</td>
                        <td className="p-2 text-right">${(item.unit_cost || 0).toFixed(2)}</td>
                        <td className="p-2 text-right font-medium">${(item.total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Charges Summary */}
          <div className="bg-muted/50 rounded-lg p-4 max-w-xs ml-auto space-y-2">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Labor</span><span>${(r.labor_charge || 0).toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Parts</span><span>${(r.parts_charge || 0).toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Travel</span><span>${(r.travel_charge || 0).toFixed(2)}</span></div>
            <hr className="border-border" />
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sub Total</span><span>${(r.sub_total || 0).toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax ({r.tax_rate || 9.5}%)</span><span>${(r.tax_amount || 0).toFixed(2)}</span></div>
            <hr className="border-border" />
            <div className="flex justify-between font-bold text-base"><span>Total</span><span>${(r.total_charges || 0).toFixed(2)}</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}