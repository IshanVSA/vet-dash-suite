import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Download, Plus, Check, Pencil, RotateCcw, Instagram, Facebook, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths } from "date-fns";
import { toast } from "sonner";

interface Clinic { id: string; clinic_name: string; }
interface Submission {
  id: string;
  clinic_id: string | null;
  status: string;
  submitted_by: string | null;
  submitted_at: string | null;
  month: string | null;
  admin_notes: string | null;
}
interface ContentPost {
  id: string;
  clinic_id: string | null;
  title: string;
  caption: string | null;
  platform: string;
  content_type: string;
}
interface Profile { id: string; full_name: string | null; }

const platformIcon = (platform: string) => {
  switch (platform) {
    case "instagram": return <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0"><Instagram className="h-3.5 w-3.5 text-white" /></div>;
    case "facebook": return <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0"><Facebook className="h-3.5 w-3.5 text-white" /></div>;
    default: return <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0 text-muted-foreground text-[10px] font-bold">{platform[0]?.toUpperCase()}</div>;
  }
};

const statusAccent: Record<string, string> = {
  approved: "border-l-success",
  needs_review: "border-l-warning",
  pending: "border-l-warning",
  sent_back: "border-l-destructive",
  no_submission: "border-l-border",
};

export default function AdminReview() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState("all");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [postsByClinic, setPostsByClinic] = useState<Record<string, ContentPost[]>>({});
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStr = format(currentMonth, "yyyy-MM");

  useEffect(() => {
    Promise.all([
      supabase.from("clinics").select("id, clinic_name"),
      supabase.from("profiles").select("id, full_name"),
    ]).then(([clinicsRes, profilesRes]) => {
      setClinics(clinicsRes.data || []);
      setProfiles(profilesRes.data || []);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      let subQuery = supabase.from("calendar_submissions").select("*").eq("month", monthStr);
      if (selectedClinicId !== "all") subQuery = subQuery.eq("clinic_id", selectedClinicId);
      const { data: subs } = await subQuery;
      setSubmissions((subs as any as Submission[]) || []);

      const startDate = `${monthStr}-01`;
      const endDate = `${monthStr}-31`;
      let postQuery = supabase.from("content_posts").select("id, clinic_id, title, caption, platform, content_type")
        .gte("scheduled_date", startDate).lte("scheduled_date", endDate);
      if (selectedClinicId !== "all") postQuery = postQuery.eq("clinic_id", selectedClinicId);
      const { data: posts } = await postQuery;

      const grouped: Record<string, ContentPost[]> = {};
      ((posts as any as ContentPost[]) || []).forEach(p => {
        const cid = p.clinic_id || "";
        if (!grouped[cid]) grouped[cid] = [];
        grouped[cid].push(p);
      });
      setPostsByClinic(grouped);
      setLoading(false);
    };
    fetchData();
  }, [monthStr, selectedClinicId]);

  const updateSubmissionStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("calendar_submissions").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    toast.success(`Calendar ${status === "approved" ? "approved" : status === "sent_back" ? "sent back" : "updated"}!`);
  };

  const getProfileName = (userId: string | null) => {
    if (!userId) return "Unknown";
    return profiles.find(p => p.id === userId)?.full_name || "Unknown";
  };

  const getClinicName = (clinicId: string) => clinics.find(c => c.id === clinicId)?.clinic_name || "Unknown Clinic";

  const relevantClinicIds = [...new Set([
    ...submissions.map(s => s.clinic_id).filter(Boolean) as string[],
    ...Object.keys(postsByClinic),
  ])];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
              <SelectTrigger className="w-[260px]"><SelectValue placeholder="All Clinics" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">🐾 All Clinics</SelectItem>
                {clinics.map(c => (<SelectItem key={c.id} value={c.id}>🐾 {c.clinic_name}</SelectItem>))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-lg font-semibold text-foreground min-w-[160px] text-center">{format(currentMonth, "MMMM yyyy")}</span>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2" /> Export</Button>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" /> New Post</Button>
          </div>
        </div>

        <div className="hero-section">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Review</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Admin Calendar Review</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">Review, tweak, and approve full monthly calendars before concierges can view them.</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading submissions...</div>
        ) : relevantClinicIds.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground animate-fade-in">
            <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="h-8 w-8 text-accent-foreground" />
            </div>
            <p className="font-medium text-foreground mb-1">No submissions yet</p>
            <p className="text-sm">No calendar submissions for this month yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {relevantClinicIds.map((clinicId, idx) => {
              const submission = submissions.find(s => s.clinic_id === clinicId);
              const posts = postsByClinic[clinicId] || [];
              const clinicName = getClinicName(clinicId);
              const submitterName = submission ? getProfileName(submission.submitted_by) : null;
              const status = submission?.status || "no_submission";

              return (
                <div
                  key={clinicId}
                  className={cn(
                    "bg-card rounded-xl border border-border overflow-hidden border-l-4 hover-lift animate-fade-in",
                    statusAccent[status] || "border-l-border"
                  )}
                  style={{ animationDelay: `${idx * 80}ms`, animationFillMode: "both" }}
                >
                  <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-foreground">{clinicName}</h2>
                      <p className="text-sm text-muted-foreground">
                        {format(currentMonth, "MMMM yyyy")}
                        {submitterName && <> · Submitted by <span className="font-medium text-foreground">{submitterName}</span></>}
                        {submission?.submitted_at && <> on {format(new Date(submission.submitted_at), "MMM d, yyyy")}</>}
                      </p>
                      <div className="mt-2">
                        {(status === "needs_review" || status === "pending") && (
                          <Badge className="bg-warning/20 text-warning font-semibold text-xs">⏳ NEEDS REVIEW</Badge>
                        )}
                        {status === "approved" && (
                          <Badge className="bg-success/20 text-success font-semibold text-xs">✅ ADMIN APPROVED</Badge>
                        )}
                        {status === "sent_back" && (
                          <Badge className="bg-destructive/20 text-destructive font-semibold text-xs">↩ SENT BACK</Badge>
                        )}
                        {status === "no_submission" && (
                          <Badge variant="secondary" className="text-xs">No submission</Badge>
                        )}
                      </div>
                    </div>
                    {submission && (
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button size="sm" className="bg-gradient-to-r from-success to-success/90 hover:from-success/90 hover:to-success/80 text-success-foreground shadow-sm shimmer"
                          onClick={() => updateSubmissionStatus(submission.id, "approved")}>
                          <Check className="h-4 w-4 mr-1.5" /> Approve Calendar
                        </Button>
                        <Button variant="outline" size="sm" className="border-border" onClick={() => updateSubmissionStatus(submission.id, "needs_review")}>
                          <Pencil className="h-4 w-4 mr-1.5" /> Tweak & Edit
                        </Button>
                        <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => updateSubmissionStatus(submission.id, "sent_back")}>
                          <RotateCcw className="h-4 w-4 mr-1.5" /> Send Back
                        </Button>
                      </div>
                    )}
                  </div>
                  {posts.length > 0 && (
                    <div className="px-6 pb-5">
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
                        {posts.map(post => (
                          <div key={post.id} className="bg-secondary/50 rounded-lg border border-border p-3 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 mb-2">
                              {platformIcon(post.platform)}
                              <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">{post.title}</h4>
                            </div>
                            {post.caption && <p className="text-xs text-muted-foreground line-clamp-2">{post.caption}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
