import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

export default function CustomerReports({ customer, open, onOpenChange }) {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["customerReports", customer?.id],
    queryFn: async () => {
      if (!customer?.id) return [];
      const all = await base44.entities.ServiceReport.list("-date", 999999);
      return all.filter(r => r.customer_id === customer.id).sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    enabled: open && !!customer?.id,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reports for {customer?.name}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <Card><CardContent className="py-8 text-center"><FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" /><p className="text-muted-foreground">No reports found</p></CardContent></Card>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {reports.map((r) => (
              <Card key={r.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{r.report_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(r.date), "MMM d, yyyy")} · {r.report_type}
                    </p>
                  </div>
                  <Link to={`/reports/${r.id}`}>
                    <Button size="sm" variant="ghost" className="gap-2">
                      <Eye className="w-4 h-4" /> View
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}