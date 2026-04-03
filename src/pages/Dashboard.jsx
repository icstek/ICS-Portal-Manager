import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, Wrench, Package, Plus, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useRole } from "@/hooks/useRole";
import { useState } from "react";
import NewCustomerDialog from "@/components/customers/NewCustomerDialog";

export default function Dashboard() {
  const { settings } = useUserSettings();
  const { user } = useRole();
  const navigate = useNavigate();
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const { data: allReports = [] } = useQuery({
    queryKey: ["reports", "all-count"],
    queryFn: () => base44.entities.ServiceReport.list("-created_date", 999999),
  });

  const { data: incompleteReports = [] } = useQuery({
    queryKey: ["reports", "incomplete"],
    queryFn: () => base44.entities.ServiceReport.filter({ service_status: "incomplete" }, "-created_date", 2),
  });

  const { data: myReports = [] } = useQuery({
    queryKey: ["reports", "mine", user?.email],
    queryFn: () =>
      base44.entities.ServiceReport.filter(
        { created_by: user?.email },
        "-created_date",
        8
      ),
    enabled: !!user?.email,
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
    { label: "Service Reports", value: allReports.length, icon: FileText, color: "text-primary", href: "/reports" },
    { label: "Customers", value: customers.length, icon: Users, color: "text-emerald-500", href: "/customers" },
    { label: "Technicians", value: technicians.length, icon: Wrench, color: "text-amber-500", href: "/team" },
    { label: "Parts in Catalog", value: parts.length, icon: Package, color: "text-violet-500", href: "/parts" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-inter tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your service operations</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={() => setShowNewCustomer(true)}>
            <Plus className="w-4 h-4" />
            New Customer
          </Button>
          <Link to="/reports/new">
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              New Service Report
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className="text-xl md:text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Incomplete Reports */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">Incomplete Reports</CardTitle>
          <Link to="/reports?filter=incomplete">
            <Button variant="ghost" size="sm" className="gap-1 text-xs">
              View All <ArrowRight className="w-3 h-3" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {incompleteReports.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No incomplete reports. All caught up!</p>
          ) : (
            <div className="space-y-3">
              {incompleteReports.map((r) => (
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
                          {r.memo && <p className="text-xs text-muted-foreground italic truncate">{r.memo}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant="outline" className="capitalize text-[10px]">{r.report_type || "repair"}</Badge>
                        <Badge variant="secondary" className="text-[10px] capitalize">incomplete</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Technician Reports */}
      {user?.email && myReports.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg">My Recent Reports</CardTitle>
            <Link to="/reports">
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View All <ArrowRight className="w-3 h-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {myReports.map((r) => (
                <Link key={r.id} to={`/reports/${r.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardContent className="p-3 flex flex-col gap-2 h-full">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{r.customer_name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.report_number ? `#${r.report_number}` : "No #"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.date ? format(new Date(r.date), "MMM d, yyyy") : "No date"}
                        </p>
                        {r.memo && <p className="text-xs text-muted-foreground italic truncate mt-1">{r.memo}</p>}
                      </div>
                      <Badge
                        variant={r.service_status === "complete" ? "default" : "secondary"}
                        className="text-[10px] capitalize w-fit"
                      >
                        {r.service_status || "incomplete"}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <NewCustomerDialog open={showNewCustomer} onOpenChange={setShowNewCustomer} />
    </div>
  );
}