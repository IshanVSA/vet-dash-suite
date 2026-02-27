import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, FileText, Clock, CheckCircle2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ContentRequestCard } from "@/components/content-requests/ContentRequestCard";
import { StatsCard } from "@/components/StatsCard";

type RegeneratingMap = Record<string, boolean>;

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
  const [regenerating, setRegenerating] = useState<RegeneratingMap>({});
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const isInitial = requests.length === 0;
    if (isInitial) setLoading(true);

    let query = supabase
      .from("content_requests")
      .select("*")
      .order("created_at", { ascending: false });

    // Role-based filtering:
    // Concierge: sees generated + concierge_preferred (RLS handles ownership)
    // Admin: sees concierge_preferred + admin_approved (not generated)
    // Client: sees admin_approved + client_selected (RLS handles this)
    if (role === "admin") {
      query = query.in("status", ["concierge_preferred", "admin_approved", "client_selected", "final_approved"]);
    }

    const { data: reqData } = await query;

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

      setGeneratingIds(prev => {
        const next = new Set(prev);
        for (const id of next) {
          if (grouped[id] && grouped[id].length > 0) next.delete(id);
        }
        return next;
      });
    }
    setLoading(false);
  }, [role]);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel("content-versions-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "content_versions" }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role, user]);

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
    toast.success("Marked as preferred! Sent to admin for review.");
    fetchData();
  };

  const adminApprove = async (requestId: string, versionId: string) => {
    // Admin approves in Content Requests → sends to client (NO post creation yet)
    await supabase.from("content_versions")
      .update({ admin_approved: true })
      .eq("id", versionId);
    await supabase.from("content_requests")
      .update({ status: "admin_approved" })
      .eq("id", requestId);

    toast.success("Content approved! Sent to client for selection.");
    fetchData();
  };

  const clientSelect = async (requestId: string, versionId: string, clinicId: string) => {
    // Client selects their preferred version → sends to Admin Review (NO post creation yet)
    await supabase.from("content_versions")
      .update({ client_selected: true })
      .eq("id", versionId);
    await supabase.from("content_requests")
      .update({ status: "client_selected" })
      .eq("id", requestId);

    toast.success("Selection submitted! Awaiting final admin approval.");
    fetchData();
  };

  const regenerateContent = async (requestId: string) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    setRegenerating(prev => ({ ...prev, [requestId]: true }));
    setGeneratingIds(prev => new Set(prev).add(requestId));

    try {
      await supabase.from("content_versions").delete().eq("content_request_id", requestId);
      await supabase.from("content_requests")
        .update({ status: "generated" })
        .eq("id", requestId);

      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { clinic_id: req.clinic_id, intake_data: req.intake_data },
      });

      if (error) throw error;

      const errorList = data?.errors || [];
      if (errorList.length > 0 && (!data?.versions || data.versions.length === 0)) {
        toast.error("Regeneration failed: " + errorList.map((e: any) => `${e.model}: ${e.error}`).join("; "));
      } else {
        toast.success("Content regenerated successfully!");
      }
    } catch (err: any) {
      toast.error("Regeneration failed: " + (err.message || "Unknown error"));
    } finally {
      setRegenerating(prev => ({ ...prev, [requestId]: false }));
      fetchData();
    }
  };

  const totalRequests = requests.length;
  const pendingCount = requests.filter(r => !["final_approved", "client_selected"].includes(r.status)).length;
  const completedCount = requests.filter(r => r.status === "final_approved").length;

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
              {role === "admin" && "Review concierge-preferred content and approve for clients"}
              {role === "concierge" && "View generated content and mark your preference for admin review"}
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

        {/* Refresh Button */}
        {!loading && requests.length > 0 && (
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setRefreshing(true);
                await fetchData();
                setRefreshing(false);
              }}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
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
                  : role === "admin"
                  ? "No concierge-preferred content awaiting your review."
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
                onRegenerate={regenerateContent}
                isRegenerating={regenerating[req.id] || false}
                isGenerating={generatingIds.has(req.id)}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}
