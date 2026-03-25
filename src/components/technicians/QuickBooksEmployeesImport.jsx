import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

// Maps QuickBooks Employee CSV headers to our Technician fields
const QB_FIELD_MAP = {
  "Employee": "name",
  "Employee Name": "name",
  "Name": "name",
  "First Name": "_first_name",
  "Last Name": "_last_name",
  "Mobile Phone": "phone",
  "Phone": "phone",
  "Work Phone": "phone",
  "Primary Phone": "phone",
  "Cell Phone": "phone",
};

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());

  return lines.slice(1).map((line) => {
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

function mapRow(row) {
  const tech = { name: "", phone: "", active: true };

  for (const [qbField, ourField] of Object.entries(QB_FIELD_MAP)) {
    if (row[qbField]) {
      if (ourField === "_first_name") {
        tech._first = row[qbField].trim();
      } else if (ourField === "_last_name") {
        tech._last = row[qbField].trim();
      } else if (!tech[ourField]) {
        tech[ourField] = row[qbField].trim();
      }
    }
  }

  // Combine first + last if no full name found
  if (!tech.name && (tech._first || tech._last)) {
    tech.name = [tech._first, tech._last].filter(Boolean).join(" ");
  }

  delete tech._first;
  delete tech._last;

  return tech;
}

export default function QuickBooksEmployeesImport({ onImported }) {
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
    reader.onload = (ev) => {
      const rows = parseCSV(ev.target.result);
      const mapped = rows.map(mapRow).filter((t) => t.name);
      setPreview(mapped);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    let count = 0;
    for (const tech of preview) {
      await base44.entities.Technician.create(tech);
      count++;
    }
    setImporting(false);
    setOpen(false);
    setPreview([]);
    setFileName("");
    toast.success(`${count} technicians imported from QuickBooks`);
    onImported();
  };

  const handleClose = () => { setOpen(false); setPreview([]); setFileName(""); };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Upload className="w-4 h-4" /> Import from QuickBooks
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" /> Import Employees from QuickBooks
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-muted/50 border rounded-lg p-4 text-sm text-muted-foreground space-y-1">
              <p className="font-medium text-foreground flex items-center gap-1"><AlertCircle className="w-4 h-4 text-accent" /> How to export from QuickBooks:</p>
              <ol className="list-decimal list-inside space-y-0.5 ml-1">
                <li>Go to <strong>Employees</strong> → <strong>Employee Center</strong></li>
                <li>Click <strong>Excel</strong> → <strong>Export Employee List</strong></li>
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
                  {preview.length} employees ready to import
                </p>
                <div className="max-h-48 overflow-y-auto border rounded-lg divide-y text-sm">
                  {preview.map((t, i) => (
                    <div key={i} className="px-3 py-2 flex items-center justify-between gap-2">
                      <span className="font-medium">{t.name}</span>
                      {t.phone && <span className="text-muted-foreground text-xs">{t.phone}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button
              onClick={handleImport}
              disabled={preview.length === 0 || importing}
              className="gap-2"
            >
              {importing
                ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Download className="w-4 h-4" />}
              {importing ? "Importing..." : `Import ${preview.length} Employees`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}