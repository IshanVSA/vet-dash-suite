import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ClipboardList } from "lucide-react";

export default function IntakeForms() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [petName, setPetName] = useState("");
  const [petType, setPetType] = useState("");
  const [notes, setNotes] = useState("");

  const section1Done = !!(name && email);
  const section2Done = !!(petName && petType);
  const filledSections = [section1Done, section2Done].filter(Boolean).length;
  const progressPercent = (filledSections / 2) * 100;

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
    pending: "bg-warning/20 text-warning",
    reviewed: "bg-success/20 text-success",
    completed: "bg-primary/20 text-primary",
  };

  const sectionHeader = (step: number, title: string, description: string) => (
    <CardHeader>
      <div className="flex items-center gap-3">
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-bold flex items-center justify-center shadow-sm">
          {step}
        </div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4 animate-fade-in">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" />
              Intake Forms
            </h1>
            <p className="text-muted-foreground">Submit a new intake form or view past submissions.</p>
          </div>
        </div>

        {/* Progress */}
        <div className="animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">{filledSections} of 2 sections started</p>
            <p className="text-xs font-medium text-primary">{Math.round(progressPercent)}%</p>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        <form onSubmit={(e) => { e.preventDefault(); submit.mutate(); }} className="space-y-6">
          <Card className="animate-fade-in hover-lift" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
            {sectionHeader(1, "Contact Information", "Your name and email address.")}
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Your Name *</Label><Input required value={name} onChange={(e) => setName(e.target.value)} className="input-glow" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-glow" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in hover-lift" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
            {sectionHeader(2, "Pet Details", "Information about the pet.")}
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Pet Name</Label><Input value={petName} onChange={(e) => setPetName(e.target.value)} className="input-glow" /></div>
                <div className="space-y-2"><Label>Pet Type</Label><Input value={petType} onChange={(e) => setPetType(e.target.value)} placeholder="Dog, Cat, etc." className="input-glow" /></div>
              </div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="input-glow" /></div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={submit.isPending}>Submit Intake Form</Button>
        </form>

        {/* Submissions list */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Past Submissions</h2>
          {isLoading ? <p className="text-muted-foreground">Loading...</p> : !submissions?.length ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No submissions yet.</CardContent></Card>
          ) : submissions.map((s, i) => (
            <Card key={s.id} className="hover-lift animate-fade-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{s.submitter_name} — {s.pet_name} ({s.pet_type})</p>
                  <p className="text-sm text-muted-foreground">{s.notes}</p>
                </div>
                <Badge className={statusColor[s.status] ?? "bg-muted text-muted-foreground"}>{s.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
