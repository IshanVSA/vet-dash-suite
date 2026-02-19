import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, FileText, Clock, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ContentRequestCard } from "@/components/content-requests/ContentRequestCard";
import { StatsCard } from "@/components/StatsCard";

interface ContentRequest {
  id: string;
  clinic_id: string;
  created_by_concierge_id: string;
  intake_data: any;
  status: string;
  created_at: string;
}

interface ContentVersion {
  id: string;
  content_request_id: string;
  model_name: string;
  generated_content: any;
  concierge_preferred: boolean;
  admin_approved: boolean;
  client_selected: boolean;
  created_at: string;
}

export default function ContentRequests() {
  const { role } = useUserRole();
  const { user } = useAuth();
  const [requests, setRequests] = useState<ContentRequest[]>([]);
  const [versions, setVersions] = useState<Record<string, ContentVersion[]>>({});
  const [clinics, setClinics] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [role, user]);

  const fetchData = async () => {
    setLoading(true);
    const { data: reqData } = await supabase
      .from("content_requests")
      .select("*")
      .order("created_at", { ascending: false });

    const reqs = (reqData || []) as unknown as ContentRequest[];
    setRequests(reqs);

    if (reqs.length > 0) {
      const reqIds = reqs.map(r => r.id);
      const { data: verData } = await supabase
        .from("content_versions")
        .select("*")
        .in("content_request_id", reqIds);

      const grouped: Record<string, ContentVersion[]> = {};
      ((verData || []) as unknown as ContentVersion[]).forEach(v => {
        if (!grouped[v.content_request_id]) grouped[v.content_request_id] = [];
        grouped[v.content_request_id].push(v);
      });
      setVersions(grouped);

      const clinicIds = [...new Set(reqs.map(r => r.clinic_id))];
      const { data: clinicData } = await supabase
        .from("clinics")
        .select("id, clinic_name")
        .in("id", clinicIds);
      const map: Record<string, string> = {};
      (clinicData || []).forEach(c => { map[c.id] = c.clinic_name; });
      setClinics(map);
    }
    setLoading(false);
  };

  const setConciergePreferred = async (requestId: string, versionId: string) => {
    const reqVersions = versions[requestId] || [];
    for (const v of reqVersions) {
      await supabase.from("content_versions")
        .update({ concierge_preferred: v.id === versionId })
        .eq("id", v.id);
    }
    await supabase.from("content_requests")
      .update({ status: "concierge_preferred" })
      .eq("id", requestId);
    toast.success("Marked as preferred!");
    fetchData();
  };

  const adminApprove = async (requestId: string, versionId: string) => {
    await supabase.from("content_versions")
      .update({ admin_approved: true })
      .eq("id", versionId);
    await supabase.from("content_requests")
      .update({ status: "admin_approved" })
      .eq("id", requestId);
    toast.success("Content approved! Client will be notified.");
    fetchData();
  };

  const clientSelect = async (requestId: string, versionId: string, clinicId: string) => {
    const reqVersions = versions[requestId] || [];
    for (const v of reqVersions) {
      await supabase.from("content_versions")
        .update({ client_selected: v.id === versionId })
        .eq("id", v.id);
    }
    await supabase.from("content_requests")
      .update({ status: "client_approved" })
      .eq("id", requestId);

    const selectedVersion = reqVersions.find(v => v.id === versionId);
    if (selectedVersion) {
      const content = selectedVersion.generated_content as any;
      const posts = content?.posts || [];

      for (const post of posts) {
        await supabase.from("content_posts").insert({
          clinic_id: clinicId,
          title: post.hook || post.theme || "Untitled Post",
          caption: post.caption || post.main_copy || null,
          platform: (post.platform || "instagram").toLowerCase(),
          content_type: (post.content_type || "IMAGE").toUpperCase(),
          scheduled_date: post.suggested_date || null,
          status: "scheduled",
          tags: [post.goal_type, post.funnel_stage, post.service_highlighted].filter(Boolean),
          compliance_note: null,
          content: post.main_copy || null,
        });
      }
    }

    toast.success("Content selected and added to calendar!");
    fetchData();
  };

  const totalRequests = requests.length;
  const pendingCount = requests.filter(r => !["client_approved"].includes(r.status)).length;
  const completedCount = requests.filter(r => r.status === "client_approved").length;

  return (
    <DashboardLayout>
      <div className="min-h-full dot-grid rounded-xl p-4 sm:p-6 md:p-8">
      <div className="space-y-4 sm:space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-[hsl(280,65%,60%)] p-5 sm:p-8 text-primary-foreground shadow-lg">
          <div className="absolute inset-0 dot-grid opacity-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-2">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold">Content Requests</h1>
            </div>
            <p className="text-primary-foreground/80 text-xs sm:text-sm max-w-lg">
              {role === "admin" && "Review and approve AI-generated content for your clinics"}
              {role === "concierge" && "View generated content and mark your preference for clients"}
              {role === "client" && "Review and select the perfect content for your clinic"}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        {!loading && totalRequests > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard title="Total Requests" value={totalRequests} icon={FileText} index={0} />
            <StatsCard title="Pending Review" value={pendingCount} icon={Clock} index={1} changeType={pendingCount > 0 ? "negative" : "neutral"} change={pendingCount > 0 ? "Needs attention" : "All clear"} />
            <StatsCard title="Completed" value={completedCount} icon={CheckCircle2} index={2} changeType="positive" change={totalRequests > 0 ? `${Math.round((completedCount / totalRequests) * 100)}% completion rate` : ""} />
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2].map(i => (
              <Card key={i} className="animate-pulse">
                <div className="h-1 w-full bg-muted" />
                <div className="p-6 space-y-4">
                  <div className="h-5 w-48 bg-muted rounded" />
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="h-40 bg-muted rounded-xl" />
                    <div className="h-40 bg-muted rounded-xl" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="mx-auto h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <p className="font-semibold text-foreground text-lg mb-1">No content requests yet</p>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {role === "client"
                  ? "No content awaiting your approval at the moment."
                  : "Generate content from the Intake Forms page to get started."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {requests.map((req, idx) => (
              <ContentRequestCard
                key={req.id}
                request={req}
                versions={versions[req.id] || []}
                clinicName={clinics[req.clinic_id] || "Unknown Clinic"}
                role={role}
                index={idx}
                onConciergePrefer={setConciergePreferred}
                onAdminApprove={adminApprove}
                onClientSelect={clientSelect}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}
