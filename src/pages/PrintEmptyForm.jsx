import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function PrintEmptyForm() {
  const [reportNumber, setReportNumber] = useState("");
  const [nextNumber, setNextNumber] = useState("");

  useEffect(() => {
    // Fetch the next report number
    base44.entities.ServiceReport.list("-report_number", 1).then((reports) => {
      if (reports.length > 0) {
        const lastNum = parseInt(reports[0].report_number || 0);
        setNextNumber(String(lastNum + 1));
        setReportNumber(String(lastNum + 1));
      } else {
        setNextNumber("1001");
        setReportNumber("1001");
      }
    });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 mb-8 print:hidden">
      <div className="space-y-2">
        <Label htmlFor="report-number">Service Report Number</Label>
        <div className="flex gap-2">
          <Input
            id="report-number"
            type="text"
            value={reportNumber}
            onChange={(e) => setReportNumber(e.target.value)}
            placeholder="Enter report number"
            className="flex-1"
          />
          <Button onClick={handlePrint}>Print Empty Form</Button>
        </div>
      </div>
    </div>
  );
}

export function EmptyServiceReportForm({ reportNumber }) {
  return (
    <div className="hidden print:block">
      <div className="max-w-4xl mx-auto bg-white p-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b pb-4">
            <h1 className="text-2xl font-bold">SERVICE REPORT</h1>
            <p className="text-sm text-muted-foreground">Report #: {reportNumber}</p>
          </div>

          {/* Customer Info Section */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Customer Name</p>
              <div className="h-6 border-b border-foreground"></div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Phone</p>
              <div className="h-6 border-b border-foreground"></div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Address</p>
              <div className="h-6 border-b border-foreground"></div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">City</p>
              <div className="h-6 border-b border-foreground"></div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Zip</p>
              <div className="h-6 border-b border-foreground"></div>
            </div>
          </div>

          {/* Equipment Info */}
          <div className="space-y-3 border-t pt-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Equipment Information</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Model</p>
                <div className="h-6 border-b border-foreground"></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Serial #</p>
                <div className="h-6 border-b border-foreground"></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Password</p>
                <div className="h-6 border-b border-foreground"></div>
              </div>
            </div>
          </div>

          {/* Problem Description */}
          <div className="space-y-2 border-t pt-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Problem Description</p>
            <div className="space-y-1">
              <div className="h-6 border-b border-foreground"></div>
              <div className="h-6 border-b border-foreground"></div>
              <div className="h-6 border-b border-foreground"></div>
            </div>
          </div>

          {/* Service Details */}
          <div className="grid grid-cols-2 gap-6 border-t pt-4">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Technician Name</p>
              <div className="h-6 border-b border-foreground"></div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">Date</p>
              <div className="h-6 border-b border-foreground"></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Time Arrive</p>
              <div className="h-5 border-b border-foreground"></div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Time Left</p>
              <div className="h-5 border-b border-foreground"></div>
            </div>
          </div>

          {/* Parts Table */}
          <div className="space-y-2 border-t pt-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground">Parts Replaced</p>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Part Name</th>
                  <th className="text-right p-2 font-medium">Qty</th>
                  <th className="text-right p-2 font-medium">Unit Cost</th>
                  <th className="text-right p-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-2 h-6 border-b border-foreground"></td>
                    <td className="p-2 text-right h-6 border-b border-foreground"></td>
                    <td className="p-2 text-right h-6 border-b border-foreground"></td>
                    <td className="p-2 text-right h-6 border-b border-foreground"></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Charges Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2 border-t pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Labor:</span>
              <div className="w-24 border-b border-foreground"></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Parts:</span>
              <div className="w-24 border-b border-foreground"></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Travel:</span>
              <div className="w-24 border-b border-foreground"></div>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sub Total:</span>
              <div className="w-24 border-b border-foreground"></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax (%):</span>
              <div className="w-24 border-b border-foreground"></div>
            </div>
            <hr className="border-border" />
            <div className="flex justify-between font-bold text-base">
              <span>Total:</span>
              <div className="w-24 border-b border-foreground"></div>
            </div>
          </div>

          {/* Signature Section */}
          <div className="space-y-4 border-t pt-6">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Customer Signature</p>
              <div className="h-12 border-b border-foreground"></div>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Date:</p>
              <div className="h-6 border-b border-foreground"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}