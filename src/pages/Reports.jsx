import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, FileText, Download } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { useRole } from "@/hooks/useRole";
import { toast } from "sonner";

export default function Reports() {
  const [search, setSearch] = useState("");
  const [downloading, setDownloading] = useState(false);
  const { isAdmin } = useRole();
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: () => base44.entities.ServiceReport.list("-created_date"),
  });

  const filtered = reports.filter((r) =>
    (r.customer_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.report_number || "").toLowerCase().includes(search.toLowerCase()) ||
    (r.technician_name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDownloadBlankPDF = async () => {
    try {
      setDownloading(true);
      const response = await fetch('/api/functions/generateBlankReport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url);
    } catch (error) {
      toast.error('Failed to open blank PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-inter tracking-tight">Service Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">{reports.length} total reports</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={handleDownloadBlankPDF} disabled={downloading} className="gap-2">
             <Download className="w-4 h-4" /> {downloading ? 'Downloading...' : 'Blank PDF'}
           </Button>
           <Link to="/reports/new">
             <Button className="gap-2"><Plus className="w-4 h-4" /> New Report</Button>
           </Link>
         </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by customer, report #, or technician..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No reports found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Link key={r.id} to={`/reports/${r.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer mb-3">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{r.customer_name || "Unknown Customer"}</p>
                      <p className="text-xs text-muted-foreground">
                        {r.report_number ? `#${r.report_number} · ` : ""}{r.date ? format(new Date(r.date), "MMM d, yyyy") : "No date"}
                        {r.technician_name ? ` · ${r.technician_name}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="outline" className="capitalize text-[10px]">{r.report_type || "repair"}</Badge>
                    <Badge variant={r.service_status === "complete" ? "default" : "secondary"} className="text-[10px] capitalize">
                      {r.service_status || "incomplete"}
                    </Badge>
                    <span className="text-sm font-bold min-w-[70px] text-right">
                      ${(r.total_charges || 0).toFixed(2)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}