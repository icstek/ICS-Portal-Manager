import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Printer, Trash2, Download, Mail, AlertCircle, CheckCircle2, ChevronDown, Paperclip, Pencil, FileText, DollarSign } from "lucide-react";
import ReceivedPaymentDialog from "@/components/reports/ReceivedPaymentDialog";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { useRole } from "@/hooks/useRole";
import { toast } from "@/components/ui/use-toast";
import { useBranding } from "@/lib/BrandingContext";
import { Edit2, Check } from "lucide-react";

export default function ReportDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = window.location.pathname.split("/").pop();
  const navigate = useNavigate();
  const { user, isAdmin, isGlobalAdmin, isTechnician } = useRole();
  const { companyLogoUrl } = useBranding();
  const queryClient = useQueryClient();
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailData, setEmailData] = useState({ to: '', cc: '', subject: '', body: '' });
  const [editMode, setEditMode] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [statusWarning, setStatusWarning] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const warningTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, []);

  const { data: report, isLoading } = useQuery({
    queryKey: ["report", id],
    queryFn: async () => {
      const reports = await base44.entities.ServiceReport.filter({ id });
      return reports[0];
    },
    enabled: !!id,
  });

  const r = report;

  const handleExportIIF = () => {
    const dateStr = r.date ? format(new Date(r.date.includes("T") ? r.date : r.date + "T00:00:00"), "MM/dd/yyyy") : "";
    const totalAmount = (r.total_charges || 0).toFixed(2);
    const laborAmount = (r.labor_charge || 0).toFixed(2);
    const travelAmount = (r.travel_charge || r.misc_charge || 0).toFixed(2);
    const taxAmount = (r.tax_amount || 0).toFixed(2);
    const partsTotal = (r.parts_charge || 0).toFixed(2);
    const hourlyRate = r.hourly_rate || 145;
    const custName = r.customer_name || "";
    const docNum = r.report_number || "";
    const memo = r.service_description || r.memo || "";
    const addr1 = custName;
    const addr2 = r.customer_address || "";
    const addr3 = r.customer_address2 || "";
    const addr4 = [r.customer_city, r.customer_zip].filter(Boolean).join(" ");
    const addr5 = "";

    const lines = [];
    // Header rows
    lines.push("!TRNS\tTRNSID\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tDOCNUM\tMEMO\tADDR1\tADDR2\tADDR3\tADDR4\tADDR5\tTOPRINT\tNAMEISTAXABLE");
    lines.push("!SPL\tSPLID\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tDOCNUM\tMEMO\tINVITEM\tQNTY\tPRICE\tEXTRA");
    lines.push("!ENDTRNS");

    // TRNS line - main invoice
    lines.push(`TRNS\t\tINVOICE\t${dateStr}\tAccounts Receivable\t${custName}\t\t${totalAmount}\t${docNum}\t${memo}\t${addr1}\t${addr2}\t${addr3}\t${addr4}\t${addr5}\tN\tN`);

    // SPL - Service/Labor
    if (parseFloat(laborAmount) > 0) {
      const laborHours = r.total_time_hours || 0;
      lines.push(`SPL\t\tINVOICE\t${dateStr}\tSales\t${custName}\t\t-${laborAmount}\t${docNum}\tFOR SERVICE RENDERED\tSER\t${laborHours}\t${hourlyRate}\t`);
    }

    // SPL - Travel
    if (parseFloat(travelAmount) > 0) {
      lines.push(`SPL\t\tINVOICE\t${dateStr}\tSales\t${custName}\t\t-${travelAmount}\t${docNum}\tTRAVEL TIME TO CUSTOMER LOCATION\tTRAVEL\t\t${travelAmount}\t`);
    }

    // SPL - Parts (each part as a separate line)
    if (r.items_replaced?.length > 0) {
      r.items_replaced.forEach((item) => {
        const itemTotal = (item.total || 0).toFixed(2);
        lines.push(`SPL\t\tINVOICE\t${dateStr}\tSales\t${custName}\t\t-${itemTotal}\t${docNum}\t${item.part_name || ""}\tPARTS\t${item.qty || 1}\t${(item.unit_cost || 0).toFixed(2)}\t`);
      });
    }

    // SPL - Tax
    if (parseFloat(taxAmount) > 0) {
      lines.push(`SPL\t\tINVOICE\t${dateStr}\tSales Tax Payable\t\t\t-${taxAmount}\t${docNum}\t\tSALESTAX\t\t\tAUTOSTAX`);
    }

    lines.push("ENDTRNS");

    const iifContent = lines.join("\r\n");
    const blob = new Blob([iifContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${docNum || id}.iif`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "IIF file exported" });
  };

  const generatePDFWithTerms = async () => {
    try {
      const cardElement = document.querySelector('[data-report-card]');
      if (!cardElement) return null;

      // Fetch logo as base64 via backend to bypass CORS
      const logoImg = cardElement.querySelector('[data-logo-img]');
      let originalSrc = null;
      if (logoImg && companyLogoUrl) {
        try {
          const logoResp = await base44.functions.invoke('fetchImageBase64', { url: companyLogoUrl });
          const dataUrl = logoResp.data?.dataUrl;
          if (dataUrl) {
            originalSrc = logoImg.src;
            logoImg.src = dataUrl;
            // Wait for the new src to load
            await new Promise(r => setTimeout(r, 100));
          }
        } catch (e) {
          // Continue with original logo
        }
      }

      // Hide elements that shouldn't appear in PDF
      const noPrintEls = cardElement.querySelectorAll('.no-print');
      noPrintEls.forEach(el => el.style.visibility = 'hidden');

      const canvas = await html2canvas(cardElement, { scale: 2, useCORS: true, logging: false });

      // Restore visibility and original logo src
      noPrintEls.forEach(el => el.style.visibility = '');
      if (logoImg && originalSrc) logoImg.src = originalSrc;

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let yPos = 0;
      pdf.addImage(imgData, 'PNG', 0, yPos, imgWidth, imgHeight);
      
      let remainingHeight = imgHeight - 297;
      while (remainingHeight > 0) {
        yPos = remainingHeight - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, yPos, imgWidth, imgHeight);
        remainingHeight -= 297;
      }

      // Add terms and conditions on the last page below the content
      const lastPageHeight = yPos + imgHeight;
      let contentY = Math.min(lastPageHeight + 10, 250);
      
      pdf.setFontSize(8);
      pdf.text('Terms & Conditions', 15, contentY);
      contentY += 5;
      
      const termsText = `The service and repair estimates indicated herein are hereby acceptable to the undersigned. Items not picked up within 30 calendar days from the date below will be subject to sale in order to recover ICS expenses. Customer understands that ICS is not responsible for loss or damage to any equipment in case of fire, theft, or any other causes beyond ICS control. In addition, ICS is not responsible for loss of Customer's programs or data for any reason. Customer is solely responsible to make backup of computer system data, software and applications prior to ICS services herein. All Spyware and Virus Cleanups do not carry warranty for labor due to the nature of the system use with the internet. All returned checks will be charged a $25.00 fee. All returned Sales are subject to a 20% restocking fee. I hereby authorize the repair work herein set forth, to be done with all necessary materials and grants ICS and its employees permission to operate the computer system and other equipment herein described for the purposes of repair and testing at my sole and exclusive risk. An express mechanic's lien is hereby acknowledged on the above equipment to secure the amount of repairs and parts listed in, or hereafter added in, this invoice.`;
      
      pdf.setFontSize(7);
      pdf.text(termsText, 15, contentY, { maxWidth: 180, align: 'left' });

      return pdf;
    } catch (error) {
      toast({ title: "Failed to generate PDF", variant: "destructive" });
      return null;
    }
  };

  const handleExportPDF = async () => {
    const pdf = await generatePDFWithTerms();
    if (pdf) {
      pdf.save(`report-${r.report_number || id}.pdf`);
      toast({ title: "Report exported as PDF" });
    }
  };

  const handlePrint = async () => {
    const pdf = await generatePDFWithTerms();
    if (pdf) {
      window.open(pdf.output('bloburi'));
    }
  };

  const [emailResult, setEmailResult] = useState(null);
  const [showEmailDetails, setShowEmailDetails] = useState(false);

  const openEmailDialog = () => {
    setEmailData({
      to: report?.customer_email || '',
      cc: '',
      subject: `Service Report #${r.report_number}`,
      body: `Service Report for ${r.customer_name}\n\nDate: ${r.date ? format(new Date(r.date.includes("T") ? r.date : r.date + "T00:00:00"), "MMMM d, yyyy") : ""}\nTotal: $${(r.total_charges || 0).toFixed(2)}\n\nReport Number: ${r.report_number}`
    });
    setEditMode(false);
    setEmailResult(null);
    setShowEmailDialog(true);
  };

  const handleSendEmail = async () => {
    if (!emailData.to) {
      toast({ title: "Please enter a recipient email", variant: "destructive" });
      return;
    }

    setSendingEmail(true);
    try {
      const cardElement = document.querySelector('[data-report-card]');
      const canvas = await html2canvas(cardElement, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let yPos = 0;
      pdf.addImage(imgData, 'PNG', 0, yPos, imgWidth, imgHeight);
      
      let remainingHeight = imgHeight - 297;
      while (remainingHeight > 0) {
        yPos = remainingHeight - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, yPos, imgWidth, imgHeight);
        remainingHeight -= 297;
      }

      const pdfBlob = pdf.output('blob');
      const pdfFile = new File([pdfBlob], `report-${r.report_number || id}.pdf`, { type: 'application/pdf' });
      const fileResponse = await base44.integrations.Core.UploadFile({
        file: pdfFile
      });

      const response = await base44.functions.invoke('emailReport', {
        reportId: id,
        recipientEmail: emailData.to,
        ccEmail: emailData.cc || undefined,
        subject: emailData.subject,
        body: emailData.body,
        pdfUrl: fileResponse.file_url,
      });
      
      if (response.data.success) {
        setEmailResult({
          success: true,
          message: response.data.message,
          details: response.data.details
        });
        toast({ title: "Email sent successfully" });
      } else {
        setEmailResult({
          success: false,
          message: response.data.error,
          details: response.data.details
        });
        toast({ title: response.data.error || "Failed to send email", variant: "destructive" });
      }
    } catch (error) {
      const errorData = error.response?.data || {};
      setEmailResult({
        success: false,
        message: errorData.error || error.message || 'Failed to send email',
        details: errorData.details
      });
      toast({ title: "Failed to send email", variant: "destructive" });
    } finally {
      setSendingEmail(false);
      setShowEmailDetails(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.ServiceReport.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast({ title: "Report deleted" });
      navigate("/reports");
    },
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus) => base44.entities.ServiceReport.update(id, { service_status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["report", id] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast({ title: "Status updated" });
    },
  });

  const toggleStatus = () => {
    if (!isAdmin && report?.service_status === "complete") {
      setStatusWarning(true);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
      warningTimerRef.current = setTimeout(() => {
        setStatusWarning(false);
        warningTimerRef.current = null;
      }, 3000);
      return;
    }
    const newStatus = report?.service_status === "complete" ? "incomplete" : "complete";
    statusMutation.mutate(newStatus);
  };

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

  return (
    <div className="max-w-4xl mx-auto space-y-6 print:space-y-2">
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" onClick={() => navigate("/reports")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <div className="flex gap-2">
          {!isTechnician && r.service_status === "complete" && (
            <Button onClick={() => setShowPaymentDialog(true)} className="gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white border-none">
              <DollarSign className="w-4 h-4" /> Received Payment
            </Button>
          )}
          {!isTechnician && (
            <Button onClick={handleExportIIF} className="gap-2 bg-[#2CA01C] hover:bg-[#249016] text-white border-none">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/QuickBooks_logo.png/220px-QuickBooks_logo.png" alt="QB" className="w-4 h-4 object-contain" /> Export to IIF
            </Button>
          )}
          <Button onClick={handleExportPDF} className="gap-2 bg-[#CC0000] hover:bg-[#B30000] text-white border-none">
            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Adobe_Acrobat_DC_logo_2020.svg/180px-Adobe_Acrobat_DC_logo_2020.svg.png" alt="PDF" className="w-4 h-4 object-contain" /> Export to PDF
          </Button>
          <Button onClick={openEmailDialog} className="gap-2 bg-[#0078D4] hover:bg-[#006CBE] text-white border-none">
            <Mail className="w-4 h-4" /> Email
          </Button>
          <Button onClick={handlePrint} className="gap-2 bg-[#0096D6] hover:bg-[#007AB8] text-white border-none">
            <Printer className="w-4 h-4" /> Print
          </Button>
          {(isGlobalAdmin || (isTechnician && r.service_status === "incomplete")) && (
            <Button onClick={() => navigate(`/reports/${id}/edit`)} className="gap-2 bg-[#F5A623] hover:bg-[#E0951E] text-white border-none">
              <Pencil className="w-4 h-4" /> Edit
            </Button>
          )}
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

      {statusWarning && (
        <div className="bg-destructive text-destructive-foreground px-4 py-3 rounded-lg text-sm font-medium animate-in fade-in">
          To change service report status, contact the System admin.
        </div>
      )}

      <Card className="print:shadow-none print:border" data-report-card>
        <CardHeader className="border-b print:py-2 print:px-4">
          <div className="hidden print:flex print:items-center print:justify-between print:gap-4 print:mb-2">
            <div className="text-xs text-muted-foreground leading-tight">
              6038 Tampa Ave., Tarzana, CA 91356 | (818) 609-7648 | service@icstek.com | www.icstek.com
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              {companyLogoUrl && (
                <img src={companyLogoUrl} alt="Company Logo" className="h-12 mb-2 object-contain" data-logo-img />
              )}
              <div className="mb-3">
                <div className="text-xs text-muted-foreground">6038 Tampa Ave, Tarzana, CA 91356 &nbsp;|&nbsp; 818-609-7648 &nbsp;|&nbsp; www.icstek.com &nbsp;|&nbsp; info@icstek.com</div>
              </div>
              <CardTitle className="text-xl print:text-lg">Service Report {r.report_number ? `# ${r.report_number}` : ""}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1 print:mt-0 print:text-xs">
                {r.date ? format(new Date(r.date.includes("T") ? r.date : r.date + "T00:00:00"), "MMMM d, yyyy") : ""}
              </p>
            </div>
            <div className="flex gap-2 print:hidden no-print">
              <Badge variant="outline" className="capitalize">{r.report_type}</Badge>
              <button
                onClick={toggleStatus}
                disabled={statusMutation.isPending}
                title="Click to toggle status"
                className="cursor-pointer"
              >
                <Badge
                  variant={r.service_status === "complete" ? "default" : "secondary"}
                  className="capitalize hover:opacity-75 transition-opacity"
                >
                  {statusMutation.isPending ? "Updating..." : r.service_status}
                </Badge>
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 print:p-3 space-y-6 print:space-y-3">
          {/* Customer */}
          <div className="print:py-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 print:mb-1 print:text-[10px]">Customer</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 print:grid-cols-2 gap-3 print:gap-2 text-sm print:text-xs">
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
              {(isGlobalAdmin || (isTechnician && r.service_status !== "complete")) && (
                <div><span className="text-muted-foreground">Rate:</span> ${r.hourly_rate || 0}/hr</div>
              )}
              {(isGlobalAdmin || (isTechnician && r.service_status !== "complete")) && (
                <div><span className="text-muted-foreground">Labor:</span> <span className="font-medium">${(r.labor_charge || 0).toFixed(2)}</span></div>
              )}
            </div>
          </div>

          {/* Work Performed */}
          {r.services_performed?.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 print:mb-1 print:text-[10px]">Work Performed</h3>
              <div className="text-sm bg-muted/50 rounded-lg p-3 space-y-1">
                {r.services_performed.map((svc, i) => (
                  <div key={i}>
                    <span className="font-medium">{svc.shortname}</span>
                    {svc.description && <span className="ml-1 text-muted-foreground">– {svc.description}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

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
                      <th className="text-left p-2 font-medium">Description</th>
                      <th className="text-right p-2 font-medium">Qty</th>
                      {(isGlobalAdmin || (isTechnician && r.service_status !== "complete")) && <th className="text-right p-2 font-medium">Unit Cost</th>}
                      {(isGlobalAdmin || (isTechnician && r.service_status !== "complete")) && <th className="text-right p-2 font-medium">Total</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {r.items_replaced.map((item, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2">{item.part_name}</td>
                        <td className="p-2">{item.part_description || "—"}</td>
                        <td className="p-2 text-right">{item.qty}</td>
                        {(isGlobalAdmin || (isTechnician && r.service_status !== "complete")) && <td className="p-2 text-right">${(item.unit_cost || 0).toFixed(2)}</td>}
                        {(isGlobalAdmin || (isTechnician && r.service_status !== "complete")) && <td className="p-2 text-right font-medium">${(item.total || 0).toFixed(2)}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Charges Summary - only visible to Global Admins */}
          {(isGlobalAdmin || (isTechnician && r.service_status !== "complete")) && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Labor</span><span>${((r.labor_charge || 0) - (r.travel_charge ? 0 : (r.misc_charge || 0))).toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Parts</span><span>${(r.parts_charge || 0).toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Travel</span><span>${(r.travel_charge || r.misc_charge || 0).toFixed(2)}</span></div>
              <hr className="border-border" />
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Sub Total</span><span>${(r.sub_total || 0).toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax ({r.tax_rate || 9.5}%)</span><span>${(r.tax_amount || 0).toFixed(2)}</span></div>
              <hr className="border-border" />
              <div className="flex justify-between font-bold text-base"><span>Total</span><span>${(r.total_charges || 0).toFixed(2)}</span></div>
            </div>
          )}

          {/* Customer Signature (screen view) */}
          {r.customer_signature_url && (
            <div className="print:hidden space-y-2">
              <p className="text-sm text-muted-foreground italic">I have read the Terms &amp; Conditions, and agree to pay the above charges in full.</p>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Customer Signature</h3>
              <img src={r.customer_signature_url} alt="Customer Signature" className="h-20 border rounded-lg p-1 bg-white" />
            </div>
          )}

          {/* Terms & Conditions (print only, full width) */}
          <div className="hidden print:block space-y-6 border-t pt-6">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Terms & Conditions</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The service and repair estimates indicated herein are hereby acceptable to the undersigned. Items not picked up within 30 calendar days from the date below will be subject to sale in order to recover ICS expenses. Customer understands that ICS is not responsible for loss or damage to any equipment in case of fire, theft, or any other causes beyond ICS control. In addition, ICS is not responsible for loss of Customer's programs or data for any reason. Customer is solely responsible to make backup of computer system data, software and applications prior to ICS services herein. All Spyware and Virus Cleanups do not carry warranty for labor due to the nature of the system use with the internet. All returned checks will be charged a $25.00 fee. All returned Sales are subject to a 20% restocking fee. I hereby authorize the repair work herein set forth, to be done with all necessary materials and grants ICS and its employees permission to operate the computer system and other equipment herein described for the purposes of repair and testing at my sole and exclusive risk. An express mechanic's lien is hereby acknowledged on the above equipment to secure the amount of repairs and parts listed in, or hereafter added in, this invoice.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground italic mb-2">I have read the Terms &amp; Conditions, and agree to pay the above charges in full.</p>
                <p className="text-xs text-muted-foreground">Customer Signature</p>
                {r.customer_signature_url ? (
                  <img src={r.customer_signature_url} alt="Customer Signature" className="h-16 border-b border-foreground" />
                ) : (
                  <div className="h-12 border-b border-foreground"></div>
                )}
              </div>
              <div className="space-y-4">
                <p className="text-xs text-muted-foreground">Date:</p>
                <p className="text-xs text-muted-foreground">{r.date ? format(new Date(r.date.includes("T") ? r.date : r.date + "T00:00:00"), "MMMM d, yyyy") : ""}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ReceivedPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        defaultAmount={r.total_charges || 0}
        onSubmit={(data) => {
          toast({ title: `Payment of $${data.amount} recorded` });
        }}
      />

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent aria-describedby="email-dialog-description" className="max-w-lg">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Email Report</DialogTitle>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setEditMode(!editMode)}
                className="gap-1"
              >
                {editMode ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                {editMode ? 'Done' : 'Edit'}
              </Button>
            </div>
          </DialogHeader>

          {emailResult && (
            <div className="space-y-3">
              <div className={`flex items-start gap-3 p-3 rounded-md ${emailResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                {emailResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="text-sm flex-1">
                  <p className={emailResult.success ? 'text-green-800' : 'text-red-800'}>{emailResult.message}</p>
                </div>
              </div>

              {emailResult.details && !emailResult.success && (
                <button
                  onClick={() => setShowEmailDetails(!showEmailDetails)}
                  className="w-full flex items-center justify-between px-3 py-2 border rounded-md text-sm hover:bg-slate-50"
                >
                  <span>Details</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showEmailDetails ? 'rotate-180' : ''}`} />
                </button>
              )}

              {showEmailDetails && emailResult.details && (
                <div className="bg-slate-900 text-slate-100 rounded-md p-3 font-mono text-xs space-y-2 max-h-64 overflow-auto">
                  {emailResult.details.timestamp && (
                    <div><span className="text-slate-400">Timestamp:</span> {emailResult.details.timestamp}</div>
                  )}
                  {emailResult.details.code && (
                    <div><span className="text-slate-400">Error Code:</span> {emailResult.details.code}</div>
                  )}
                  {emailResult.details.errorMessage && (
                    <div><span className="text-slate-400">Error Message:</span> {emailResult.details.errorMessage}</div>
                  )}
                  {emailResult.details.fullError && (
                    <div><span className="text-slate-400">Full Error:</span> {emailResult.details.fullError}</div>
                  )}
                  {emailResult.details.errorStack && (
                    <div className="mt-2 pt-2 border-t border-slate-700">
                      <div className="text-slate-400 mb-1">Stack Trace:</div>
                      <pre className="whitespace-pre-wrap break-words">{emailResult.details.errorStack}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">To</label>
              <input
                type="email"
                value={emailData.to}
                onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
              />
            </div>

            {editMode ? (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">CC (Optional)</label>
                  <input
                    type="email"
                    value={emailData.cc}
                    onChange={(e) => setEmailData({ ...emailData, cc: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subject</label>
                  <input
                    type="text"
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Body</label>
                  <textarea
                    value={emailData.body}
                    onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border rounded-md text-sm h-32"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Subject</label>
                  <div className="mt-1 px-3 py-2 bg-muted rounded-md text-sm">{emailData.subject}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Body</label>
                  <div className="mt-1 px-3 py-2 bg-muted rounded-md text-sm whitespace-pre-wrap text-xs">{emailData.body}</div>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
                  <Paperclip className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span className="text-sm text-amber-900">PDF attached: report-{r.report_number || id}.pdf</span>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>Cancel</Button>
            <Button onClick={handleSendEmail} disabled={sendingEmail}>
              {sendingEmail ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}