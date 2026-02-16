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
import { Settings as SettingsIcon } from "lucide-react";

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

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="bg-gradient-hero rounded-xl p-6 -mx-2 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
        </div>

        <Card className="hover-lift animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
          <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Full Name</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} className="input-glow" /></div>
            <div className="space-y-2"><Label>Email</Label><Input defaultValue={user?.email || ""} disabled /></div>
            <div className="space-y-2"><Label>Role</Label><Input value={role || ""} disabled className="capitalize" /></div>
            <Button onClick={saveProfile} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
          </CardContent>
        </Card>

        {role === "admin" && (
          <>
            <Separator className="my-2" />
            <Card className="hover-lift animate-fade-in" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
              <CardHeader><CardTitle className="text-base">API Integrations</CardTitle></CardHeader>
              <CardContent className="space-y-4">
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
                <Button variant="outline">Save API Keys</Button>
              </CardContent>
            </Card>

            <Separator className="my-2" />
            <Card className="hover-lift animate-fade-in" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
              <CardHeader><CardTitle className="text-base">Default Prompt Template</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>AI Content Generation Prompt</Label>
                  <Textarea rows={4} defaultValue="Generate a comprehensive monthly marketing plan for a veterinary clinic including content calendar, captions, reel ideas, hashtags, ad copy, and email newsletter." className="input-glow" />
                  <p className="text-xs text-muted-foreground">This template is used as the base prompt for AI content generation</p>
                </div>
                <Button variant="outline">Save Template</Button>
              </CardContent>
            </Card>

            <Separator className="my-2" />
            <Card className="hover-lift animate-fade-in" style={{ animationDelay: "400ms", animationFillMode: "both" }}>
              <CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Email notifications</p>
                    <p className="text-xs text-muted-foreground">Receive email when content is submitted for review</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Weekly digest</p>
                    <p className="text-xs text-muted-foreground">Receive weekly performance summary</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Separator className="my-2" />
            <Card className="hover-lift animate-fade-in" style={{ animationDelay: "500ms", animationFillMode: "both" }}>
              <CardHeader><CardTitle className="text-base">Branding</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>Agency Name</Label><Input defaultValue="VSA Vetmedia" className="input-glow" /></div>
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <Input defaultValue="#6366f1" type="color" className="w-12 h-10 p-1 rounded-lg cursor-pointer" />
                    <Input defaultValue="#6366f1" className="w-28 font-mono text-sm" />
                  </div>
                </div>
                <Button variant="outline">Save Branding</Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
