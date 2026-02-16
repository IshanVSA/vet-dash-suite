import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, Eye, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Clinics() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  const { data: clinics, isLoading } = useQuery({
    queryKey: ["clinics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clinics").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createClinic = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clinics").insert({ name, address, phone, email, owner_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      toast.success("Clinic added!");
      setOpen(false);
      setName(""); setAddress(""); setPhone(""); setEmail("");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteClinic = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clinics").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clinics"] });
      toast.success("Clinic deleted");
    },
    onError: (e) => toast.error(e.message),
  });

  const filtered = clinics?.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) ?? [];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clinics</h1>
            <p className="text-muted-foreground mt-1">{clinics?.length ?? 0} total clinics</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Clinic</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Clinic</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createClinic.mutate(); }} className="space-y-4 pt-2">
                <div className="space-y-2"><Label>Clinic Name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Happy Paws Vet" className="input-glow" /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" className="input-glow" /></div>
                <div className="space-y-2"><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main St" className="input-glow" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@clinic.com" className="input-glow" /></div>
                <Button type="submit" className="w-full" disabled={createClinic.isPending}>Add Clinic</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search clinics..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="bg-card rounded-xl border border-border">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No clinics found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Clinic Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((clinic) => (
                  <TableRow key={clinic.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{clinic.name}</TableCell>
                    <TableCell className="text-muted-foreground">{clinic.phone || "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{clinic.email || "—"}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => deleteClinic.mutate(clinic.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
