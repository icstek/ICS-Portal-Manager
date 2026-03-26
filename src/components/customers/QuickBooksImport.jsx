import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// Maps QuickBooks CSV column headers to our Customer fields
const QB_FIELD_MAP = {
  "Customer": "name",
  "Name": "name",
  "Full Name": "name",
  "Company Name": "name",
  "Billing Address Line 1": "address",
  "Bill Addr1": "address",
  "Billing Street": "address",
  "Billing Address City": "city",
  "Bill City": "city",
  "Billing City": "city",
  "Billing Address Postal Code": "zip",
  "Bill Zip": "zip",
  "Billing Zip": "zip",
  "Billing Postal Code": "zip",
  "Phone": "tel",
  "Main Phone": "tel",
  "Mobile": "cell",
  "Alt. Phone": "cell",
  "Email": "email",
  "Main Email": "email",
};

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Parse headers
  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());

  return lines.slice(1).map((line) => {
    // Handle quoted fields with commas inside
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuotes = !inQuotes; }
      else if (line[i] === "," && !inQuotes) { values.push(current.trim()); current = ""; }
      else { current += line[i]; }
    }
    values.push(current.trim());

    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ""; });
    return row;
  });
}

async function mapRow(row) {
  const customer = { name: "", address: "", city: "", zip: "", tel: "", cell: "", email: "" };

  // First try standard field mapping
  for (const [qbField, ourField] of Object.entries(QB_FIELD_MAP)) {
    if (row[qbField] && !customer[ourField]) {
      customer[ourField] = row[qbField];
    }
  }

  // If we have a name, use AI to extract missing fields from raw data
  if (customer.name) {
    const missingFields = Object.keys(customer).filter(field => !customer[field]);
    if (missingFields.length > 0) {
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Extract customer information from the following data. Return only the JSON object without markdown formatting. Missing fields should be empty strings.

Available data: ${JSON.stringify(row)}

Extract and return a JSON object with these fields (only return these exact fields):
- address: street address
- city: city name
- zip: zip/postal code
- tel: phone number
- cell: mobile/cell phone number
- email: email address

Return ONLY valid JSON, no markdown code blocks or extra text.`,
          response_json_schema: {
            type: "object",
            properties: {
              address: { type: "string" },
              city: { type: "string" },
              zip: { type: "string" },
              tel: { type: "string" },
              cell: { type: "string" },
              email: { type: "string" }
            }
          }
        });

        // Merge AI results with existing data
        Object.keys(result).forEach(key => {
          if (!customer[key] && result[key]) {
            customer[key] = result[key];
          }
        });
      } catch (error) {
        console.error('AI extraction failed for row:', error);
        // Continue with partial data if AI fails
      }
    }
  }

  return customer;
}

export default function QuickBooksImport({ onImported }) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  const handleFile = (e) => {
     const file = e.target.files[0];
     if (!file) return;
     setFileName(file.name);
     const reader = new FileReader();
     reader.onload = async (ev) => {
       const rows = parseCSV(ev.target.result);
       const mapped = await Promise.all(rows.map(mapRow));
       setPreview(mapped.filter((c) => c.name));
     };
     reader.readAsText(file);
   };

  const handleImport = async () => {
    setImporting(true);
    try {
      // Process in chunks of 500 to avoid timeouts and memory issues
      const chunkSize = 500;
      for (let i = 0; i < preview.length; i += chunkSize) {
        const chunk = preview.slice(i, i + chunkSize);
        await base44.entities.Customer.bulkCreate(chunk);
      }
      setImporting(false);
      setOpen(false);
      setPreview([]);
      setFileName("");
      toast.success(`${preview.length} customers imported from QuickBooks`);
      onImported();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import customers. Please try again.');
      setImporting(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Upload className="w-4 h-4" /> Import from QuickBooks
      </Button>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPreview([]); setFileName(""); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Import Customers from QuickBooks
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 border rounded-lg p-4 text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground flex items-center gap-1"><AlertCircle className="w-4 h-4 text-accent" /> How to export from QuickBooks:</p>
              <ol className="list-decimal list-inside space-y-0.5 ml-1">
                <li>Go to <strong>Customers</strong> menu → <strong>Customer Center</strong></li>
                <li>Click <strong>Excel</strong> → <strong>Export Customer List</strong></li>
                <li>Save as <strong>CSV</strong> and upload below</li>
              </ol>
            </div>

            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileRef.current.click()}
            >
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              {fileName ? (
                <p className="text-sm font-medium text-primary">{fileName}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Click to select QuickBooks CSV file</p>
              )}
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </div>

            {preview.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {preview.length} customers ready to import
                </p>
                <div className="max-h-48 overflow-y-auto border rounded-lg divide-y text-sm">
                  {preview.map((c, i) => (
                    <div key={i} className="px-3 py-2 flex items-center justify-between gap-2">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-muted-foreground text-xs">{[c.city, c.tel].filter(Boolean).join(" · ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              onClick={handleImport}
              disabled={preview.length === 0 || importing}
              className="gap-2"
            >
              {importing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
              {importing ? "Importing..." : `Import ${preview.length} Customers`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}