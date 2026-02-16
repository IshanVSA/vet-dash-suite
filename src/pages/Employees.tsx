import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RoleBadge } from "@/components/RoleBadge";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { AppRole } from "@/hooks/useUserRole";

export default function Employees() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<AppRole>("concierge");

  const { data: roles, isLoading } = useQuery({
    queryKey: ["all-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*, profiles(full_name)");
      if (error) throw error;
      return data;
    },
  });

  const assignRole = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-roles"] });
      toast.success("Role assigned!");
      setOpen(false);
      setUserId("");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Employees</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" /> Assign Role</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Assign Role</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); assignRole.mutate(); }} className="space-y-4">
                <div className="space-y-2"><Label>User ID</Label><Input required value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Paste user UUID" /></div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="concierge">Concierge</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={assignRole.isPending}>Assign</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {isLoading ? <p className="text-muted-foreground">Loading...</p> : roles?.map((r) => (
          <Card key={r.id}>
            <CardContent className="pt-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{(r as any).profiles?.full_name || "Unknown"}</p>
                <p className="text-xs text-muted-foreground">{r.user_id}</p>
              </div>
              <RoleBadge role={r.role as AppRole} />
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
