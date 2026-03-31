import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import { Loader2, Save, Globe } from "lucide-react";
import CompanyBrandingSettings from "@/components/settings/CompanyBrandingSettings";
import { useBranding } from "@/lib/BrandingContext";

export default function GlobalSettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { refresh: refreshBranding } = useBranding();
  const [settingsId, setSettingsId] = useState(null);
  const [form, setForm] = useState({
    default_hourly_rate: 145,
    resend_api_key: "",
    resend_from_email: "",
    company_name: "",
    company_logo_url: "",
    primary_color: "#3b82f6",
    accent_color: "#f59e0b",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const records = await base44.entities.GlobalSettings.filter({ key: "global" });
      if (records.length > 0) {
        const s = records[0];
        setSettingsId(s.id);
        setForm({
          default_hourly_rate: s.default_hourly_rate ?? 145,
          resend_api_key: s.resend_api_key || "",
          resend_from_email: s.resend_from_email || "",
          company_name: s.company_name || "",
          company_logo_url: s.company_logo_url || "",
          primary_color: s.primary_color || "#3b82f6",
          accent_color: s.accent_color || "#f59e0b",
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settingsId) {
        await base44.entities.GlobalSettings.update(settingsId, { ...form, key: "global" });
      } else {
        const created = await base44.entities.GlobalSettings.create({ ...form, key: "global" });
        setSettingsId(created.id);
      }
      toast.success("Global settings saved");
      refreshBranding();
    } catch (e) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-8">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-6">
    <CompanyBrandingSettings form={form} setForm={setForm} onSave={handleSave} saving={saving} />
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          <CardTitle className="text-base">Global Settings</CardTitle>
        </div>
        <CardDescription>These settings apply across the entire application</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Default Hourly Rate ($)</Label>
          <Input
            type="number"
            step="1"
            value={form.default_hourly_rate}
            onChange={(e) => setForm({ ...form, default_hourly_rate: parseFloat(e.target.value) || 0 })}
            className="mt-1 max-w-xs"
          />
          <p className="text-xs text-muted-foreground mt-1">Pre-filled on all new service reports</p>
        </div>

        <div className="pt-2 border-t">
          <p className="text-sm font-medium mb-3">Email Configuration</p>
          <div className="space-y-3">
            <div>
              <Label className="text-sm">API Key</Label>
              <Input
                type="password"
                placeholder="re_xxxxxxxxxxxx"
                value={form.resend_api_key}
                onChange={(e) => setForm({ ...form, resend_api_key: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">From Email</Label>
              <Input
                type="email"
                placeholder="noreply@company.com"
                value={form.resend_from_email}
                onChange={(e) => setForm({ ...form, resend_from_email: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Global Settings
          </Button>
        </div>
      </CardContent>
    </Card>
    </div>
  );
}