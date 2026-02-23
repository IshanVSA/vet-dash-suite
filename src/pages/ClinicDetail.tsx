import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, RefreshCw, Loader2, Save } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { toast } from "sonner";
import { MetaConnectionCard } from "@/components/clinic-detail/MetaConnectionCard";
import { PageSelectionDialog } from "@/components/clinic-detail/PageSelectionDialog";
import { FacebookInsightCard } from "@/components/clinic-detail/FacebookInsightCard";

interface ClinicData { clinic_name: string; }
interface ClinicCredentials {
  meta_page_access_token: string | null;
  meta_page_id: string | null;
  meta_instagram_business_id: string | null;
  meta_page_name: string | null;
  google_ads_refresh_token: string | null;
  google_ads_customer_id: string | null;
  google_ads_login_customer_id: string | null;
  last_meta_sync_at: string | null;
  last_google_sync_at: string | null;
}

export default function ClinicDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role } = useUserRole();
  const [clinic, setClinic] = useState<ClinicData | null>(null);
  const [creds, setCreds] = useState<ClinicCredentials>({
    meta_page_access_token: null, meta_page_id: null, meta_instagram_business_id: null, meta_page_name: null,
    google_ads_refresh_token: null, google_ads_customer_id: null, google_ads_login_customer_id: null,
    last_meta_sync_at: null, last_google_sync_at: null,
  });
  const [savingCreds, setSavingCreds] = useState(false);
  const [instaData, setInstaData] = useState<any[]>([]);
  const [fbData, setFbData] = useState<any[]>([]);
  const [googleAdsData, setGoogleAdsData] = useState<any[]>([]);
  const [metaPages, setMetaPages] = useState<any[] | null>(null);
  useEffect(() => {
    if (!id) return;
    supabase.from("clinics").select("clinic_name").eq("id", id).maybeSingle().then(({ data }) => setClinic(data));
    fetchCredentials();
    fetchAnalytics();

    // Check for meta_pages URL parameter (page selection after OAuth)
    const metaPagesParam = searchParams.get("meta_pages");
    if (metaPagesParam) {
      try {
        const decoded = JSON.parse(atob(decodeURIComponent(metaPagesParam)));
        setMetaPages(decoded);
      } catch (e) {
        console.error("Failed to decode meta_pages param:", e);
      }
    }
  }, [id]);

  const fetchCredentials = async () => {
    if (!id) return;
    const { data } = await supabase.from("clinic_api_credentials")
      .select("meta_page_access_token, meta_page_id, meta_instagram_business_id, meta_page_name, google_ads_refresh_token, google_ads_customer_id, google_ads_login_customer_id, last_meta_sync_at, last_google_sync_at")
      .eq("clinic_id", id).maybeSingle();
    if (data) setCreds(data);
  };

  const fetchAnalytics = async () => {
    if (!id) return;
    const { data } = await supabase.from("analytics").select("*").eq("clinic_id", id).order("recorded_at", { ascending: true });
    if (!data) return;
    const insta = data.filter(r => r.platform === "instagram").map(r => {
      const m = (r as any).metrics_json || {};
      return { month: (r as any).date || r.recorded_at?.slice(0, 7), followers: m.followers, reach: m.reach, engagement: m.engagement };
    });
    const fb = data.filter(r => r.platform === "facebook").map(r => {
      const m = (r as any).metrics_json || {};
      return {
        month: (r as any).date || r.recorded_at?.slice(0, 7),
        likes: m.likes, followers: m.followers, reach: m.reach, reach_unique: m.reach_unique,
        engagement: m.engagement, post_engagements: m.post_engagements,
        page_views: m.page_views, fan_adds: m.fan_adds, fan_removes: m.fan_removes,
        video_views: m.video_views, talking_about: m.talking_about,
        daily_trends: m.daily_trends, recent_posts: m.recent_posts,
        reactions: m.reactions,
      };
    });
    const gAds = data.filter(r => r.platform === "google_ads").map(r => {
      const m = (r as any).metrics_json || {};
      return { ...m, date: (r as any).date || r.recorded_at?.slice(0, 7) };
    });
    setInstaData(insta);
    setFbData(fb);
    setGoogleAdsData(gAds);
  };

  const saveCredentials = async () => {
    if (!id) return;
    setSavingCreds(true);
    const { error } = await supabase.from("clinic_api_credentials").upsert({
      clinic_id: id,
      meta_page_access_token: creds.meta_page_access_token || null,
      meta_page_id: creds.meta_page_id || null,
      meta_instagram_business_id: creds.meta_instagram_business_id || null,
      google_ads_refresh_token: creds.google_ads_refresh_token || null,
      google_ads_customer_id: creds.google_ads_customer_id || null,
      google_ads_login_customer_id: creds.google_ads_login_customer_id || null,
    }, { onConflict: "clinic_id" });
    setSavingCreds(false);
    if (error) toast.error("Failed to save: " + error.message); else toast.success("Credentials saved!");
  };

  const hasGoogleCreds = !!(creds.google_ads_refresh_token && creds.google_ads_customer_id);

  const EmptyState = ({ message }: { message: string }) => (
    <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">{message}</p></CardContent></Card>
  );

  const latestInsta = instaData.length > 0 ? instaData[instaData.length - 1] : null;
  const latestFb = fbData.length > 0 ? fbData[fbData.length - 1] : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/clinics"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button></Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{clinic?.clinic_name || "Loading..."}</h1>
            <p className="text-muted-foreground">Clinic Analytics & Performance</p>
          </div>
        </div>

        <Tabs defaultValue="instagram">
          <TabsList className="bg-secondary">
            <TabsTrigger value="instagram">Instagram</TabsTrigger>
            <TabsTrigger value="facebook">Facebook</TabsTrigger>
            <TabsTrigger value="google">Google Ads</TabsTrigger>
            <TabsTrigger value="ai">AI Insights</TabsTrigger>
            {role === "admin" && <TabsTrigger value="connections">Connections</TabsTrigger>}
          </TabsList>

          <TabsContent value="instagram" className="space-y-4 mt-4">
            {instaData.length === 0 ? (
              <EmptyState message="No Instagram data yet — connect your account and sync from the Connections tab." />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Followers</p><p className="text-2xl font-bold text-foreground">{latestInsta?.followers?.toLocaleString() ?? "—"}</p></CardContent></Card>
                  <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Reach</p><p className="text-2xl font-bold text-foreground">{latestInsta?.reach?.toLocaleString() ?? "—"}</p></CardContent></Card>
                  <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Engagement</p><p className="text-2xl font-bold text-foreground">{latestInsta?.engagement ? `${latestInsta.engagement}%` : "—"}</p></CardContent></Card>
                </div>
                <Card>
                  <CardHeader><CardTitle className="text-base">Followers Growth</CardTitle></CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={instaData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip />
                        <Line type="monotone" dataKey="followers" stroke="hsl(var(--primary))" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="facebook" className="space-y-4 mt-4">
            {fbData.length === 0 ? (
              <EmptyState message="No Facebook data yet — connect your account and sync from the Connections tab." />
            ) : (
              <>
                {/* Insight Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FacebookInsightCard
                    title="Views"
                    mainValue={latestFb?.reach?.toLocaleString() ?? "—"}
                    mainLabel="Page impressions (28 days)"
                    sparklineData={latestFb?.daily_trends?.map((d: any) => ({ value: d.impressions ?? 0 }))}
                    subMetrics={[
                      { label: "Unique reach", value: latestFb?.reach_unique?.toLocaleString() ?? "—" },
                      { label: "Video views", value: latestFb?.video_views?.toLocaleString() ?? "—" },
                    ]}
                  />
                  <FacebookInsightCard
                    title="Interactions"
                    mainValue={latestFb?.post_engagements?.toLocaleString() ?? "—"}
                    mainLabel="Post engagements (28 days)"
                    sparklineData={latestFb?.daily_trends?.map((d: any) => ({ value: d.engaged_users ?? 0 }))}
                    subMetrics={[
                      { label: "Engaged users", value: latestFb?.engagement?.toLocaleString() ?? "—" },
                      { label: "Talking about", value: latestFb?.talking_about?.toLocaleString() ?? "—" },
                    ]}
                  />
                  <FacebookInsightCard
                    title="Visits"
                    mainValue={latestFb?.page_views?.toLocaleString() ?? "—"}
                    mainLabel="Page views (28 days)"
                    sparklineData={latestFb?.daily_trends?.map((d: any) => ({ value: d.page_views ?? 0 }))}
                  />
                  <FacebookInsightCard
                    title="Follows"
                    mainValue={`+${latestFb?.fan_adds?.toLocaleString() ?? "0"}`}
                    mainLabel={`Total followers: ${latestFb?.followers?.toLocaleString() ?? "—"}`}
                    sparklineData={latestFb?.daily_trends?.map((d: any) => ({ value: (d.fan_adds ?? 0) - (d.fan_removes ?? 0) }))}
                    subMetrics={[
                      { label: "New follows", value: `+${latestFb?.fan_adds ?? 0}`, color: "primary" },
                      { label: "Unfollows", value: `-${latestFb?.fan_removes ?? 0}`, color: "destructive" },
                      { label: "Net follows", value: (latestFb?.fan_adds ?? 0) - (latestFb?.fan_removes ?? 0), color: "primary" },
                    ]}
                  />
                </div>

                {/* Daily Trends Chart */}
                {latestFb?.daily_trends && latestFb.daily_trends.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Daily Impressions & Engagement (Last 30 Days)</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={latestFb.daily_trends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v: string) => v ? format(new Date(v), "MMM d") : ""} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                          <Tooltip labelFormatter={(v: string) => v ? format(new Date(v), "MMM d, yyyy") : ""} />
                          <Area type="monotone" dataKey="impressions" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} name="Impressions" />
                          <Area type="monotone" dataKey="engaged_users" stroke="hsl(var(--accent-foreground))" fill="hsl(var(--accent) / 0.15)" strokeWidth={2} name="Engaged Users" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Page Views Trend */}
                {latestFb?.daily_trends && latestFb.daily_trends.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Daily Page Views</CardTitle></CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={latestFb.daily_trends}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v: string) => v ? format(new Date(v), "MMM d") : ""} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
                          <Tooltip labelFormatter={(v: string) => v ? format(new Date(v), "MMM d, yyyy") : ""} />
                          <Bar dataKey="page_views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Page Views" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Posts */}
                {latestFb?.recent_posts && latestFb.recent_posts.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Recent Posts Performance</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {latestFb.recent_posts.map((post: any, i: number) => (
                          <div key={post.id || i} className="flex items-start gap-4 p-3 rounded-lg border border-border">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-foreground truncate">{post.message || "(No text)"}</p>
                              <p className="text-xs text-muted-foreground mt-1">{post.created_time ? format(new Date(post.created_time), "MMM d, yyyy h:mm a") : ""}</p>
                            </div>
                            <div className="flex gap-4 text-xs text-muted-foreground shrink-0">
                              <span>👍 {post.likes}</span>
                              <span>💬 {post.comments}</span>
                              <span>🔄 {post.shares}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="google" className="space-y-4 mt-4">
            {googleAdsData.length === 0 ? (
              <EmptyState message="No Google Ads data yet — connect your account and sync from the Connections tab." />
            ) : (
              <Card><CardContent className="pt-6"><p className="text-muted-foreground">Google Ads data available. {googleAdsData.length} records.</p></CardContent></Card>
            )}
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">AI Monthly Insights</CardTitle>
                <Button variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-1" /> Regenerate</Button>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-foreground leading-relaxed">
                <p className="text-muted-foreground">
                  {instaData.length > 0 || fbData.length > 0 || googleAdsData.length > 0
                    ? "Sync your data and regenerate insights to get an up-to-date AI analysis."
                    : "No analytics data available yet. Connect accounts and sync data first."}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {role === "admin" && (
            <TabsContent value="connections" className="space-y-4 mt-4">
              <MetaConnectionCard
                clinicId={id!}
                hasMetaCreds={!!(creds.meta_page_access_token && creds.meta_page_id)}
                metaPageName={(creds as any).meta_page_name || null}
                metaPageId={creds.meta_page_id}
                metaInstagramBusinessId={creds.meta_instagram_business_id}
                lastMetaSyncAt={creds.last_meta_sync_at}
                onRefresh={() => { fetchCredentials(); fetchAnalytics(); }}
              />
              <Card>
                <CardHeader><CardTitle className="text-base">Google Ads</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-3">
                    <div className="space-y-2"><Label className="text-xs">Refresh Token</Label><Input type="password" value={creds.google_ads_refresh_token || ""} onChange={e => setCreds(p => ({ ...p, google_ads_refresh_token: e.target.value }))} placeholder="1//0..." /></div>
                    <div className="space-y-2"><Label className="text-xs">Customer ID</Label><Input value={creds.google_ads_customer_id || ""} onChange={e => setCreds(p => ({ ...p, google_ads_customer_id: e.target.value }))} placeholder="123-456-7890" /></div>
                    <div className="space-y-2"><Label className="text-xs">Login Customer ID (MCC)</Label><Input value={creds.google_ads_login_customer_id || ""} onChange={e => setCreds(p => ({ ...p, google_ads_login_customer_id: e.target.value }))} placeholder="123-456-7890" /></div>
                  </div>
                  <Button onClick={saveCredentials} disabled={savingCreds} className="w-full">
                    {savingCreds ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                    Save Google Ads Credentials
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {metaPages && id && (
          <PageSelectionDialog
            open={!!metaPages}
            pages={metaPages}
            clinicId={id}
            onClose={() => {
              setMetaPages(null);
              setSearchParams({}, { replace: true });
            }}
            onConnected={() => {
              setMetaPages(null);
              setSearchParams({}, { replace: true });
              fetchCredentials();
              fetchAnalytics();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
