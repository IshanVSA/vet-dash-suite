import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function IntakeForms() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState("");
  const [notes, setNotes] = useState("");

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["submissions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("calendar_submissions").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const submit = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("calendar_submissions").insert({
        submitter_name: name, submitter_email: email, pet_name: petName, pet_type: petType, notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      toast.success("Submission received!");
      setName(""); setEmail(""); setPetName(""); setPetType(""); setNotes("");
    },
    onError: (e) => toast.error(e.message),
  });

  const statusColor: Record<string, string> = {
    pending: "bg-accent text-accent-foreground",
    reviewed: "bg-primary text-primary-foreground",
    completed: "bg-secondary text-secondary-foreground",
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Intake Forms</h1>
        <Card>
          <CardHeader><CardTitle>New Submission</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); submit.mutate(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Your Name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="space-y-2"><Label>Pet Name</Label><Input value={petName} onChange={(e) => setPetName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Pet Type</Label><Input value={petType} onChange={(e) => setPetType(e.target.value)} placeholder="Dog, Cat, etc." /></div>
              </div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
              <Button type="submit" disabled={submit.isPending}>Submit</Button>
            </form>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Submissions</h2>
          {isLoading ? <p className="text-muted-foreground">Loading...</p> : submissions?.map((s) => (
            <Card key={s.id}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{s.submitter_name} — {s.pet_name} ({s.pet_type})</p>
                  <p className="text-sm text-muted-foreground">{s.notes}</p>
                </div>
                <Badge className={statusColor[s.status] ?? ""}>{s.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
