import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Building2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Clinics() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
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
      toast.success("Clinic created!");
      setOpen(false);
      setName(""); setAddress(""); setPhone(""); setEmail("");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Clinics</h1>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Add Clinic</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Clinic</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createClinic.mutate(); }} className="space-y-4">
                <div className="space-y-2"><Label>Name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Address</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <Button type="submit" className="w-full" disabled={createClinic.isPending}>Create Clinic</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        {isLoading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : clinics?.length === 0 ? (
          <Card><CardContent className="p-12 text-center text-muted-foreground"><Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" /><p>No clinics yet</p></CardContent></Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {clinics?.map((clinic) => (
              <Card key={clinic.id}>
                <CardHeader><CardTitle className="text-lg">{clinic.name}</CardTitle></CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                  {clinic.address && <p>{clinic.address}</p>}
                  {clinic.phone && <p>{clinic.phone}</p>}
                  {clinic.email && <p>{clinic.email}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
