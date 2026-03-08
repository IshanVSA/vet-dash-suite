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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Users, Building2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const TEAM_ROLES = [
  "Developer",
  "Maintenance",
  "Ads Strategist",
  "Ads Analyst",
  "Social",
  "Concierge",
  "SEO Lead",
] as const;

interface Profile { id: string; full_name: string | null; email: string | null; team_role: string | null; }
interface UserRole { user_id: string; role: string; }
interface ClinicAssignment { user_id: string; clinic_names: string[]; clinic_ids: string[]; }
interface ClinicOption { id: string; clinic_name: string; }

export default function Employees() {
  const { role } = useUserRole();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [assignments, setAssignments] = useState<ClinicAssignment[]>([]);
  const [allClinics, setAllClinics] = useState<ClinicOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", password: "", role: "concierge", team_role: "" });
  const [creating, setCreating] = useState(false);
  const [assignDialogUser, setAssignDialogUser] = useState<Profile | null>(null);
  const [assignedClinicIds, setAssignedClinicIds] = useState<string[]>([]);
  const [savingAssign, setSavingAssign] = useState(false);

  const fetchData = async () => {
    const [profilesRes, rolesRes, clinicsRes, teamAssignRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, team_role"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("clinics").select("id, clinic_name"),
      (supabase.from("clinic_team_members" as any).select("user_id, clinic_id") as any),
    ]);
    setProfiles((profilesRes.data as Profile[]) || []);
    setRoles(rolesRes.data || []);

    const clinics = (clinicsRes.data || []) as ClinicOption[];
    setAllClinics(clinics);
    const clinicMap = Object.fromEntries(clinics.map(c => [c.id, c.clinic_name]));
    const teamData = (teamAssignRes.data || []) as { user_id: string; clinic_id: string }[];

    const assignMap = new Map<string, { names: string[]; ids: string[] }>();
    teamData.forEach((a: { user_id: string; clinic_id: string }) => {
      const name = clinicMap[a.clinic_id];
      if (name) {
        const existing = assignMap.get(a.user_id) || { names: [], ids: [] };
        existing.names.push(name);
        existing.ids.push(a.clinic_id);
        assignMap.set(a.user_id, existing);
      }
    });
    setAssignments(Array.from(assignMap.entries()).map(([user_id, { names, ids }]) => ({ user_id, clinic_names: names, clinic_ids: ids })));
    setLoading(false);
  };

  useEffect(() => {
    if (role !== "admin") return;
    fetchData();
  }, [role]);

  const staffProfiles = profiles.filter(p => {
    const r = roles.find(r => r.user_id === p.id)?.role;
    return r === "admin" || r === "concierge";
  });

  const getRole = (userId: string) => roles.find(r => r.user_id === userId)?.role || "unknown";
  const getAssignedClinics = (userId: string) => assignments.find(a => a.user_id === userId)?.clinic_names || [];
  const getAssignedClinicIds = (userId: string) => assignments.find(a => a.user_id === userId)?.clinic_ids || [];

  const openAssignDialog = (user: Profile) => {
    setAssignDialogUser(user);
    setAssignedClinicIds(getAssignedClinicIds(user.id));
  };

  const handleSaveAssignments = async () => {
    if (!assignDialogUser) return;
    setSavingAssign(true);
    const userId = assignDialogUser.id;
    const currentIds = getAssignedClinicIds(userId);
    const toAdd = assignedClinicIds.filter(id => !currentIds.includes(id));
    const toRemove = currentIds.filter(id => !assignedClinicIds.includes(id));

    for (const clinicId of toRemove) {
      await (supabase.from("clinic_team_members" as any).delete().eq("user_id", userId).eq("clinic_id", clinicId) as any);
    }
    for (const clinicId of toAdd) {
      await (supabase.from("clinic_team_members" as any).insert({ user_id: userId, clinic_id: clinicId } as any) as any);
    }
    setSavingAssign(false);
    setAssignDialogUser(null);
    toast.success("Clinic assignments updated");
    await fetchData();
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const { error } = await supabase.from("user_roles").update({ role: newRole as any }).eq("user_id", userId);
    if (error) { toast.error("Failed to update role"); } else {
      toast.success("Access level updated");
      setRoles(prev => prev.map(r => r.user_id === userId ? { ...r, role: newRole } : r));
    }
  };

  const handleTeamRoleChange = async (userId: string, newTeamRole: string) => {
    const { error } = await supabase.from("profiles").update({ team_role: newTeamRole } as any).eq("id", userId);
    if (error) { toast.error("Failed to update team role"); } else {
      toast.success("Team role updated");
      setProfiles(prev => prev.map(p => p.id === userId ? { ...p, team_role: newTeamRole } : p));
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Delete team member "${name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("user_roles").delete().eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    toast.success(`"${name}" removed`);
    await fetchData();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero */}
        <div className="hero-section">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Manage</span>
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Team Members</h1>
              <p className="text-muted-foreground mt-0.5 text-sm">Manage your agency team</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-lg shadow-sm"><Plus className="h-4 w-4 mr-2" />Add Team Member</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                  <DialogDescription>Create a new account with a specific role.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2"><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Jane Doe" className="input-glow" /></div>
                  <div className="space-y-2"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@example.com" className="input-glow" /></div>
                  <div className="space-y-2"><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" className="input-glow" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Access Level</Label>
                      <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="concierge">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Team Role</Label>
                      <Select value={form.team_role} onValueChange={v => setForm(f => ({ ...f, team_role: v }))}>
                        <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                        <SelectContent>
                          {TEAM_ROLES.map(r => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button disabled={creating} onClick={async () => {
                    if (!form.full_name || !form.email || !form.password) { toast.error("All fields are required"); return; }
                    if (form.password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
                    setCreating(true);
                    const { data, error } = await supabase.functions.invoke("create-team-member", {
                      body: { ...form, team_role: form.team_role || null },
                    });
                    setCreating(false);
                    if (error || data?.error) { toast.error(data?.error || error.message); return; }
                    toast.success("Team member created");
                    setForm({ full_name: "", email: "", password: "", role: "concierge", team_role: "" });
                    setDialogOpen(false);
                    await fetchData();
                  }}>
                    {creating ? "Creating…" : "Create Member"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {loading ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <div className="inline-flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading team...
            </div>
          </CardContent></Card>
        ) : staffProfiles.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Users className="h-5 w-5 text-muted-foreground" />
            </div>
            <p>No team members found.</p>
          </CardContent></Card>
        ) : (
          <Card className="overflow-hidden border-border/60">
            <Table className="data-table">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Access Level</TableHead>
                  <TableHead>Team Role</TableHead>
                  <TableHead>Assigned Clinics</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffProfiles.map((p) => {
                  const userRole = getRole(p.id);
                  const assignedClinics = getAssignedClinics(p.id);
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{p.email || "—"}</TableCell>
                      <TableCell>
                        <Select value={userRole} onValueChange={v => handleRoleChange(p.id, v)}>
                          <SelectTrigger className="w-[120px] h-8 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="concierge">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={p.team_role || ""} onValueChange={v => handleTeamRoleChange(p.id, v)}>
                          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue placeholder="Assign role" /></SelectTrigger>
                          <SelectContent>
                            {TEAM_ROLES.map(r => (
                              <SelectItem key={r} value={r}>{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {assignedClinics.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {assignedClinics.map((name, i) => (<Badge key={i} variant="secondary" className="text-[11px] rounded-full">{name}</Badge>))}
                          </div>
                        ) : (<span className="text-muted-foreground text-xs italic">None</span>)}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="sm" className="h-8" onClick={() => openAssignDialog(p)} title="Assign clinics">
                          <Building2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 text-destructive hover:text-destructive" onClick={() => handleDelete(p.id, p.full_name || "User")}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
