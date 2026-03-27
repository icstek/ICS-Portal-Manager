import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, Save, Building2, Upload, X } from "lucide-react";

export default function CompanyBrandingSettings({ form, setForm, onSave, saving }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm((prev) => ({ ...prev, company_logo_url: file_url }));
    setUploading(false);
    toast.success("Logo uploaded");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          <CardTitle className="text-base">Company Branding</CardTitle>
        </div>
        <CardDescription>Customize company name, logo, and color scheme</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Company Name */}
        <div>
          <Label className="text-sm font-medium">Company Name</Label>
          <Input
            placeholder="Your Company Inc."
            value={form.company_name || ""}
            onChange={(e) => setForm({ ...form, company_name: e.target.value })}
            className="mt-1 max-w-sm"
          />
        </div>

        {/* Logo */}
        <div>
          <Label className="text-sm font-medium">Company Logo</Label>
          <div className="mt-2 flex items-center gap-4">
            {form.company_logo_url ? (
              <div className="relative group">
                <img
                  src={form.company_logo_url}
                  alt="Company logo"
                  className="h-16 w-auto max-w-[200px] object-contain rounded-md border bg-white p-1"
                />
                <button
                  onClick={() => setForm({ ...form, company_logo_url: "" })}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="h-16 w-32 rounded-md border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground">
                No logo
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="gap-2"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? "Uploading..." : "Upload Logo"}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, or SVG. Used on reports and invoices.</p>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div className="pt-2 border-t">
          <p className="text-sm font-medium mb-3">Color Scheme</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Primary Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={form.primary_color || "#3b82f6"}
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  className="w-10 h-9 rounded border cursor-pointer"
                />
                <Input
                  value={form.primary_color || "#3b82f6"}
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  placeholder="#3b82f6"
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm">Accent Color</Label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={form.accent_color || "#f59e0b"}
                  onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                  className="w-10 h-9 rounded border cursor-pointer"
                />
                <Input
                  value={form.accent_color || "#f59e0b"}
                  onChange={(e) => setForm({ ...form, accent_color: e.target.value })}
                  placeholder="#f59e0b"
                  className="flex-1 font-mono text-sm"
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">These colors are used on printed reports and invoices.</p>
        </div>

        {/* Preview */}
        {(form.company_name || form.company_logo_url) && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Preview</p>
            <div className="rounded-lg border p-4 bg-white flex items-center gap-3">
              {form.company_logo_url && (
                <img src={form.company_logo_url} alt="" className="h-10 w-auto object-contain" />
              )}
              <span className="font-bold text-lg" style={{ color: form.primary_color || "#3b82f6" }}>
                {form.company_name || "Company Name"}
              </span>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button onClick={onSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Branding
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}