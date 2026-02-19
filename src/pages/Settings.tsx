import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { Settings as SettingsIcon, User, Key, Sparkles, Bell, Palette } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data?.full_name) setFullName(data.full_name); });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
    if (error) toast.error("Failed to save"); else toast.success("Profile updated");
    setSaving(false);
  };

  const sectionIcon = (Icon: React.ElementType, label: string) => (
    <div className="flex items-center gap-2.5">
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <CardTitle className="text-base">{label}</CardTitle>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Hero */}
        <div className="hero-section">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <SettingsIcon className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Account</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">Manage your account and preferences</p>
          </div>
        </div>

        <Card className="hover-lift animate-fade-in overflow-hidden" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
          <CardHeader className="border-b border-border/40 bg-muted/20">{sectionIcon(User, "Profile")}</CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="space-y-2"><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} className="input-glow" /></div>
            <div className="space-y-2"><Label>Email</Label><Input defaultValue={user?.email || ""} disabled className="bg-muted/30" /></div>
            <div className="space-y-2"><Label>Role</Label><Input value={role || ""} disabled className="capitalize bg-muted/30" /></div>
            <Button onClick={saveProfile} disabled={saving} className="rounded-lg">{saving ? "Saving..." : "Save Changes"}</Button>
          </CardContent>
        </Card>

        {role === "admin" && (
          <>
            <Card className="hover-lift animate-fade-in overflow-hidden" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
              <CardHeader className="border-b border-border/40 bg-muted/20">{sectionIcon(Key, "API Integrations")}</CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="space-y-2">
                  <Label>Meta (Facebook/Instagram) API</Label>
                  <Input placeholder="Meta API key" type="password" className="input-glow" />
                  <p className="text-xs text-muted-foreground">Used for pulling social media analytics</p>
                </div>
                <div className="space-y-2">
                  <Label>Google Ads API</Label>
                  <Input placeholder="Google Ads API key" type="password" className="input-glow" />
                  <p className="text-xs text-muted-foreground">Used for pulling ad performance data</p>
                </div>
                <Button variant="outline" className="rounded-lg">Save API Keys</Button>
              </CardContent>
            </Card>

            <Card className="hover-lift animate-fade-in overflow-hidden" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
              <CardHeader className="border-b border-border/40 bg-muted/20">{sectionIcon(Sparkles, "Default Prompt Template")}</CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="space-y-2">
                  <Label>AI Content Generation Prompt</Label>
                  <Textarea rows={4} defaultValue="Generate a comprehensive monthly marketing plan for a veterinary clinic including content calendar, captions, reel ideas, hashtags, ad copy, and email newsletter." className="input-glow" />
                  <p className="text-xs text-muted-foreground">This template is used as the base prompt for AI content generation</p>
                </div>
                <Button variant="outline" className="rounded-lg">Save Template</Button>
              </CardContent>
            </Card>

            <Card className="hover-lift animate-fade-in overflow-hidden" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
              <CardHeader className="border-b border-border/40 bg-muted/20">{sectionIcon(Bell, "Notifications")}</CardHeader>
              <CardContent className="space-y-5 pt-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Email notifications</p>
                    <p className="text-xs text-muted-foreground">Receive email when content is submitted for review</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Weekly digest</p>
                    <p className="text-xs text-muted-foreground">Receive weekly performance summary</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift animate-fade-in overflow-hidden" style={{ animationDelay: "500ms", animationFillMode: "both" }}>
              <CardHeader className="border-b border-border/40 bg-muted/20">{sectionIcon(Palette, "Branding")}</CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="space-y-2"><Label>Agency Name</Label><Input defaultValue="VSA Vetmedia" className="input-glow" /></div>
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <Input defaultValue="#6366f1" type="color" className="w-12 h-10 p-1 rounded-lg cursor-pointer" />
                    <Input defaultValue="#6366f1" className="w-28 font-mono text-sm" />
                  </div>
                </div>
                <Button variant="outline" className="rounded-lg">Save Branding</Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
