import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

interface Profile { id: string; full_name: string | null; email: string | null; }
interface UserRole { user_id: string; role: string; }
interface ClinicAssignment { user_id: string; clinic_names: string[]; }

export default function ClientsPage() {
  const { role } = useUserRole();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [assignments, setAssignments] = useState<ClinicAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [creating, setCreating] = useState(false);

  const fetchData = async () => {
    const [profilesRes, rolesRes, clinicsRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("clinics").select("owner_user_id, clinic_name"),
    ]);
    const allRoles = rolesRes.data || [];
    const clientUserIds = allRoles.filter(r => r.role === "client").map(r => r.user_id);
    setProfiles((profilesRes.data || []).filter(p => clientUserIds.includes(p.id)));
    setRoles(allRoles);

    const clinics = clinicsRes.data || [];
    const assignMap = new Map<string, string[]>();
    clinics.forEach(c => {
      if (c.owner_user_id) {
        const existing = assignMap.get(c.owner_user_id) || [];
        existing.push(c.clinic_name);
        assignMap.set(c.owner_user_id, existing);
      }
    });
    setAssignments(Array.from(assignMap.entries()).map(([user_id, clinic_names]) => ({ user_id, clinic_names })));
    setLoading(false);
  };

  useEffect(() => {
    if (role !== "admin") return;
    fetchData();
  }, [role]);

  const getAssignedClinics = (userId: string) => assignments.find(a => a.user_id === userId)?.clinic_names || [];

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Remove client "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success(`"${name}" removed`);
    await fetchData();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground mt-1">Manage your clinic clients</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Client</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Client</DialogTitle>
                <DialogDescription>Create a new client account.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2"><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Jane Doe" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" /></div>
                <div className="space-y-2"><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters" /></div>
              </div>
              <DialogFooter>
                <Button disabled={creating} onClick={async () => {
                  if (!form.full_name || !form.email || !form.password) { toast.error("All fields are required"); return; }
                  if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
                  setCreating(true);
                  const { data, error } = await supabase.functions.invoke("create-team-member", { body: { ...form, role: "client" } });
                  setCreating(false);
                  if (error || data?.error) { toast.error(data?.error || error.message); return; }
                  toast.success("Client created");
                  setForm({ full_name: "", email: "", password: "" });
                  setDialogOpen(false);
                  await fetchData();
                }}>
                  {creating ? "Creating…" : "Create Client"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
        ) : profiles.length === 0 ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No clients found.</CardContent></Card>
        ) : (
          <div className="bg-card rounded-xl border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Clinics</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.map((p) => {
                  const assignedClinics = getAssignedClinics(p.id);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{p.email || "—"}</TableCell>
                      <TableCell>
                        {assignedClinics.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedClinics.map((name, i) => (<Badge key={i} variant="secondary" className="text-xs">{name}</Badge>))}
                          </div>
                        ) : (<span className="text-muted-foreground text-sm italic">None</span>)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(p.id, p.full_name || "User")}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
