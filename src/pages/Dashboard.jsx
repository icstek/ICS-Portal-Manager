import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, Wrench, Package, Plus, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useUserSettings } from "@/hooks/useUserSettings";

export default function Dashboard() {
  const { settings } = useUserSettings();

  const { data: reports = [] } = useQuery({
    queryKey: ["reports"],
    queryFn: () => base44.entities.ServiceReport.list("-created_date", 5),
  });
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => base44.entities.Customer.list("name", 999999),
  });
  const { data: technicians = [] } = useQuery({
    queryKey: ["technicians"],
    queryFn: () => base44.entities.Technician.list("name", 999999),
  });
  const { data: parts = [] } = useQuery({
    queryKey: ["parts"],
    queryFn: () => base44.entities.Part.list("name", 999999),
  });

  const stats = [
    { label: "Service Reports", value: reports.length, icon: FileText, color: "text-primary" },
    { label: "Customers", value: customers.length, icon: Users, color: "text-emerald-500" },
    { label: "Technicians", value: technicians.length, icon: Wrench, color: "text-amber-500" },
    { label: "Parts in Catalog", value: parts.length, icon: Package, color: "text-violet-500" },
  ];

  const isListLayout = settings.dashboardLayout === "list";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-inter tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your service operations</p>
        </div>
        <Link to="/reports/new">
          <Button className="gap-2 w-full sm:w-auto">
            <Plus className="w-4 h-4" />
            New Service Report
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-5">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Recent Reports</CardTitle>
          <Link to="/reports">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View All <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No service reports yet. Create your first one!</p>
          ) : isListLayout ? (
            /* List Layout */
            <div className="divide-y divide-border">
              {reports.map((r) => (
                <Link key={r.id} to={`/reports/${r.id}`} className="flex items-center justify-between py-3 hover:bg-muted/50 px-2 rounded transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.customer_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.report_number || "No #"} · {r.date ? format(new Date(r.date), "MMM d, yyyy") : "No date"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <Badge variant={r.service_status === "complete" ? "default" : "secondary"} className="text-[10px] hidden sm:inline-flex">
                      {r.service_status || "pending"}
                    </Badge>
                    {r.total_charges != null && (
                      <span className="text-sm font-semibold">${r.total_charges.toFixed(2)}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            /* Grid Layout */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {reports.map((r) => (
                <Link key={r.id} to={`/reports/${r.id}`} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{r.customer_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">
                      {r.report_number || "No #"} · {r.date ? format(new Date(r.date), "MMM d, yyyy") : "No date"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <Badge variant={r.service_status === "complete" ? "default" : "secondary"} className="text-[10px]">
                      {r.service_status || "pending"}
                    </Badge>
                    {r.total_charges != null && (
                      <span className="text-xs font-semibold">${r.total_charges.toFixed(2)}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}