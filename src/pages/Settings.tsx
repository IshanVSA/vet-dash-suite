import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { RoleBadge } from "@/components/RoleBadge";

export default function Settings() {
  const { user } = useAuth();
  const { role } = useUserRole();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated!");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Label className="text-muted-foreground">Role:</Label>
              {role && <RoleBadge role={role} />}
            </div>
            <div className="flex items-center gap-4">
              <Label className="text-muted-foreground">Email:</Label>
              <span className="text-sm">{user?.email}</span>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); updateProfile.mutate(); }} className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <Button type="submit" disabled={updateProfile.isPending}>Save Changes</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
