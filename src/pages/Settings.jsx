import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { LayoutGrid, List, Moon, Sun } from "lucide-react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useAuth } from "@/lib/AuthContext";
import { cn } from "@/lib/utils";
import SmtpSettings from "@/components/settings/SmtpSettings";
import ProfileSettings from "@/components/settings/ProfileSettings";
import GlobalSettingsPanel from "@/components/settings/GlobalSettingsPanel";
import { useRole } from "@/hooks/useRole";

export default function Settings() {
  const { settings, updateSetting, loading } = useUserSettings();
  const { user } = useAuth();
  const { isAdmin, isGlobalAdmin } = useRole();

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-inter tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Personalize your experience</p>
      </div>

      {/* Profile */}
      {user && <ProfileSettings user={user} />}

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Control how the app looks for you</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.darkMode ? <Moon className="w-4 h-4 text-muted-foreground" /> : <Sun className="w-4 h-4 text-muted-foreground" />}
              <div>
                <Label className="text-sm font-medium">Dark Mode</Label>
                <p className="text-xs text-muted-foreground">Switch between light and dark theme</p>
              </div>
            </div>
            <Switch
              checked={settings.darkMode}
              onCheckedChange={(val) => updateSetting("darkMode", val)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dashboard Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dashboard Layout</CardTitle>
          <CardDescription>Choose how recent reports appear on the dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <button
              onClick={() => updateSetting("dashboardLayout", "grid")}
              className={cn(
                "flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                settings.dashboardLayout === "grid"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
              )}
            >
              <LayoutGrid className={cn("w-6 h-6", settings.dashboardLayout === "grid" ? "text-primary" : "text-muted-foreground")} />
              <span className="text-sm font-medium">Grid</span>
              <span className="text-xs text-muted-foreground text-center">Compact card view</span>
            </button>
            <button
              onClick={() => updateSetting("dashboardLayout", "list")}
              className={cn(
                "flex-1 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                settings.dashboardLayout === "list"
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-muted-foreground"
              )}
            >
              <List className={cn("w-6 h-6", settings.dashboardLayout === "list" ? "text-primary" : "text-muted-foreground")} />
              <span className="text-sm font-medium">List</span>
              <span className="text-xs text-muted-foreground text-center">Detailed row view</span>
            </button>
          </div>
        </CardContent>
        </Card>

        {/* SMTP Configuration - Admin only */}
        {isAdmin && !isGlobalAdmin && <SmtpSettings />}

        {/* Global Settings - Global Admin only */}
        {isGlobalAdmin && <GlobalSettingsPanel />}
        </div>
        );
        }