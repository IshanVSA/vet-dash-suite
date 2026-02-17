import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Star, ThumbsUp, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

interface Clinic {
  id: string;
  clinic_name: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  generated: { label: "Generated", color: "bg-blue-100 text-blue-700" },
  concierge_preferred: { label: "Concierge Preferred", color: "bg-purple-100 text-purple-700" },
  admin_approved: { label: "Admin Approved", color: "bg-success/20 text-success" },
  client_approved: { label: "Client Approved", color: "bg-green-100 text-green-700" },
};

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
    // Reset all, set selected
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
    // Reset all, set selected
    for (const v of reqVersions) {
      await supabase.from("content_versions")
        .update({ client_selected: v.id === versionId })
        .eq("id", v.id);
    }
    await supabase.from("content_requests")
      .update({ status: "client_approved" })
      .eq("id", requestId);

    // Auto-push to content calendar
    const selectedVersion = reqVersions.find(v => v.id === versionId);
    if (selectedVersion) {
      const platform = (requests.find(r => r.id === requestId)?.intake_data as any)?.preferredPlatforms || "instagram";
      await supabase.from("content_calendar").insert({
        clinic_id: clinicId,
        content_request_id: requestId,
        final_content: selectedVersion.generated_content,
        status: "draft",
        platform: platform.includes("instagram") ? "instagram" : platform,
      });
    }

    toast.success("Content selected and added to calendar!");
    fetchData();
  };

  const renderSinglePost = (post: any, index: number) => (
    <div key={index} className="border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="text-xs">
          Week {post.week || Math.ceil((index + 1) / 4)} · Post {post.post_number || index + 1}
        </Badge>
        {post.content_type && (
          <Badge variant="secondary" className="text-xs">{post.content_type}</Badge>
        )}
        {post.theme && (
          <span className="text-xs text-muted-foreground">{post.theme}</span>
        )}
      </div>
      {post.caption && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Caption</p>
          <p className="text-sm text-foreground">{post.caption}</p>
        </div>
      )}
      {post.main_copy && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Main Copy</p>
          <p className="text-sm text-foreground">{post.main_copy}</p>
        </div>
      )}
      {post.cta && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Call to Action</p>
          <p className="text-sm text-foreground font-medium">{post.cta}</p>
        </div>
      )}
      {post.hashtags && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Hashtags</p>
          <p className="text-primary text-xs">{post.hashtags}</p>
        </div>
      )}
    </div>
  );

  const renderContentBlock = (content: any) => {
    if (!content) return <p className="text-sm text-muted-foreground">No content generated</p>;
    
    // Handle new multi-post format
    if (content.posts && Array.isArray(content.posts)) {
      return (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase">
            {content.posts.length} Posts for the Month
          </p>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {content.posts.map((post: any, i: number) => renderSinglePost(post, i))}
          </div>
        </div>
      );
    }

    // Legacy single-post format
    return (
      <div className="space-y-3 text-sm">
        {content.caption && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Caption</p>
            <p className="text-foreground">{content.caption}</p>
          </div>
        )}
        {content.main_copy && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Main Copy</p>
            <p className="text-foreground">{content.main_copy}</p>
          </div>
        )}
        {content.cta && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Call to Action</p>
            <p className="text-foreground font-medium">{content.cta}</p>
          </div>
        )}
        {content.hashtags && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Hashtags</p>
            <p className="text-primary text-xs">{content.hashtags}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="bg-gradient-hero rounded-xl p-6 -mx-2 animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Content Requests
          </h1>
          <p className="text-muted-foreground mt-1">
            {role === "admin" && "Review and approve AI-generated content"}
            {role === "concierge" && "View generated content and mark your preference"}
            {role === "client" && "Review and select content for your clinic"}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading content requests...</div>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium text-foreground mb-1">No content requests yet</p>
              <p className="text-sm text-muted-foreground">
                {role === "client" ? "No content awaiting your approval." : "Generate content from the Intake Forms page."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {requests.map((req, idx) => {
              const reqVersions = versions[req.id] || [];
              const clinicName = clinics[req.clinic_id] || "Unknown Clinic";
              const status = statusConfig[req.status] || { label: req.status, color: "bg-muted text-muted-foreground" };
              const intake = req.intake_data as any;

              return (
                <Card key={req.id} className="animate-fade-in hover-lift" style={{ animationDelay: `${idx * 80}ms`, animationFillMode: "both" }}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{clinicName}</CardTitle>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge className={cn("text-xs font-semibold", status.color)}>{status.label}</Badge>
                          {intake?.goal && <Badge variant="outline" className="text-xs">{intake.goal}</Badge>}
                          {intake?.tone && <Badge variant="outline" className="text-xs">{intake.tone}</Badge>}
                          {intake?.selectedMonth && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {intake.selectedMonth}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(req.created_at), "MMM d, yyyy 'at' h:mm a")}
                          </span>
                        </div>
                      </div>
                      {req.status === "client_approved" && (
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          <Check className="h-3 w-3 mr-1" /> Complete
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {reqVersions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No versions generated yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {reqVersions.map(version => (
                          <div key={version.id} className={cn(
                            "border rounded-lg p-4 space-y-3 transition-all",
                            version.concierge_preferred && "border-purple-300 bg-purple-50/50",
                            version.admin_approved && "border-green-300 bg-green-50/50",
                            version.client_selected && "border-primary bg-primary/5 ring-2 ring-primary/20",
                          )}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs font-bold">
                                  {version.model_name}
                                </Badge>
                                {version.concierge_preferred && (
                                  <Badge className="bg-purple-100 text-purple-700 text-xs">
                                    <Star className="h-3 w-3 mr-1" /> Concierge Pick
                                  </Badge>
                                )}
                                {version.admin_approved && (
                                  <Badge className="bg-success/20 text-success text-xs">
                                    <ThumbsUp className="h-3 w-3 mr-1" /> Admin Approved
                                  </Badge>
                                )}
                                {version.client_selected && (
                                  <Badge className="bg-primary/20 text-primary text-xs">
                                    <Check className="h-3 w-3 mr-1" /> Client Selected
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {renderContentBlock(version.generated_content)}

                            <div className="flex gap-2 pt-2 border-t border-border">
                              {/* Concierge: Mark preferred */}
                              {role === "concierge" && req.status === "generated" && !version.concierge_preferred && (
                                <Button size="sm" variant="outline" onClick={() => setConciergePreferred(req.id, version.id)}>
                                  <Star className="h-3.5 w-3.5 mr-1" /> Mark Preferred
                                </Button>
                              )}

                              {/* Admin: Approve */}
                              {role === "admin" && !version.admin_approved && ["generated", "concierge_preferred"].includes(req.status) && (
                                <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" onClick={() => adminApprove(req.id, version.id)}>
                                  <ThumbsUp className="h-3.5 w-3.5 mr-1" /> Approve
                                </Button>
                              )}

                              {/* Client: Select */}
                              {role === "client" && req.status === "admin_approved" && !version.client_selected && (
                                <Button size="sm" onClick={() => clientSelect(req.id, version.id, req.clinic_id)}>
                                  <Check className="h-3.5 w-3.5 mr-1" /> Select This
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
