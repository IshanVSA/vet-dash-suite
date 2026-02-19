import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditPostDialog } from "@/components/content-calendar/EditPostDialog";
import { NewPostDialog } from "@/components/content-calendar/NewPostDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ChevronLeft, ChevronRight, Download, Plus, Pencil, Check, Flag, Clock,
  Instagram, Facebook, LayoutGrid, Film, Tag, AlertTriangle, CheckCircle2, Clock3, CalendarDays
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";

interface Clinic { id: string; clinic_name: string; }
interface ContentPost {
  id: string;
  clinic_id: string;
  title: string;
  caption: string | null;
  platform: string;
  content_type: string;
  scheduled_date: string;
  scheduled_time: string | null;
  status: string;
  tags: string[];
  compliance_note: string | null;
}

const statusColors: Record<string, string> = {
  posted: "bg-success text-success-foreground",
  approved: "bg-success/80 text-success-foreground",
  scheduled: "bg-info text-info-foreground",
  pending: "bg-warning/20 text-warning",
  flagged: "bg-destructive/20 text-destructive",
  draft: "bg-muted text-muted-foreground",
};

const statusLabels: Record<string, string> = {
  posted: "POSTED", approved: "APPROVED", scheduled: "SCHEDULED",
  pending: "PENDING", flagged: "FLAGGED", draft: "DRAFT",
};

const tagColors: Record<string, string> = {
  dental: "bg-purple-100 text-purple-700 border-purple-200",
  seasonal: "bg-pink-100 text-pink-700 border-pink-200",
  educational: "bg-blue-100 text-blue-700 border-blue-200",
  promo: "bg-amber-100 text-amber-700 border-amber-200",
  wellness: "bg-green-100 text-green-700 border-green-200",
};

const getTagColor = (tag: string) => {
  const lower = tag.toLowerCase();
  for (const [key, cls] of Object.entries(tagColors)) {
    if (lower.includes(key)) return cls;
  }
  return "bg-secondary text-secondary-foreground";
};

const platformIcon = (platform: string) => {
  switch (platform) {
    case "instagram": return <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Instagram className="h-3.5 w-3.5 text-white" /></div>;
    case "facebook": return <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center"><Facebook className="h-3.5 w-3.5 text-white" /></div>;
    case "tiktok": return <div className="h-6 w-6 rounded-full bg-foreground flex items-center justify-center text-background font-bold text-[10px]">TT</div>;
    default: return <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-[10px] font-bold">{platform[0]?.toUpperCase()}</div>;
  }
};

const platformGradient: Record<string, string> = {
  instagram: "from-purple-500 to-pink-500",
  facebook: "from-blue-500 to-blue-600",
  tiktok: "from-foreground to-foreground",
};

const filterTabs = ["All", "Scheduled", "Pending", "Flagged", "Posted", "Draft"];

export default function ContentCalendar() {
  const { role } = useUserRole();
  const { user } = useAuth();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<ContentPost | null>(null);
  const [newPostOpen, setNewPostOpen] = useState(false);

  useEffect(() => {
    const fetchClinics = async () => {
      let query = supabase.from("clinics").select("id, clinic_name");
      if (role === "concierge") query = query.eq("assigned_concierge_id", user?.id);
      if (role === "client") query = query.eq("owner_user_id", user?.id);
      const { data } = await query;
      setClinics(data || []);
      if (data && data.length > 0 && !selectedClinicId) {
        setSelectedClinicId(data[0].id);
      }
    };
    fetchClinics();
  }, [role, user]);

  useEffect(() => {
    if (!selectedClinicId) return;
    setLoading(true);
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    supabase.from("content_posts").select("*")
      .eq("clinic_id", selectedClinicId)
      .gte("scheduled_date", start)
      .lte("scheduled_date", end)
      .order("scheduled_date", { ascending: true })
      .then(({ data }) => {
        setPosts((data as any as ContentPost[]) || []);
        setLoading(false);
      });
  }, [selectedClinicId, currentMonth]);

  const updatePostStatus = async (postId: string, status: string) => {
    await supabase.from("content_posts").update({ status }).eq("id", postId);
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, status } : p));
  };

  const filtered = activeFilter === "All" ? posts : posts.filter(p => p.status === activeFilter.toLowerCase());

  const kpis = [
    { icon: <LayoutGrid className="h-4 w-4" />, iconBg: "bg-purple-100 text-purple-600", value: posts.length, label: "Total Posts" },
    { icon: <Film className="h-4 w-4" />, iconBg: "bg-blue-100 text-blue-600", value: posts.filter(p => ["REEL", "VIDEO"].includes(p.content_type)).length, label: "Videos / Reels" },
    { icon: <Tag className="h-4 w-4" />, iconBg: "bg-amber-100 text-amber-600", value: [...new Set(posts.flatMap(p => p.tags || []))].length, label: "Themes" },
    { icon: <AlertTriangle className="h-4 w-4" />, iconBg: "bg-red-100 text-red-600", value: posts.filter(p => p.compliance_note).length, label: "CVBC Flags" },
    { icon: <CheckCircle2 className="h-4 w-4" />, iconBg: "bg-green-100 text-green-600", value: posts.filter(p => p.status === "approved" || p.status === "posted").length, label: "Approved" },
    { icon: <Clock3 className="h-4 w-4" />, iconBg: "bg-teal-100 text-teal-600", value: posts.filter(p => p.status === "pending" || p.status === "scheduled").length, label: "Pending" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Select value={selectedClinicId} onValueChange={setSelectedClinicId}>
              <SelectTrigger className="w-[260px]"><SelectValue placeholder="Select clinic" /></SelectTrigger>
              <SelectContent>
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
            <Button size="sm" onClick={() => setNewPostOpen(true)}><Plus className="h-4 w-4 mr-2" /> New Post</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {kpis.map((kpi, i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3 hover-lift animate-fade-in" style={{ animationDelay: `${i * 60}ms`, animationFillMode: "both" }}>
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0 shadow-sm", kpi.iconBg)}>{kpi.icon}</div>
              <div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Content Cards — {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex gap-1.5">
            {filterTabs.map(tab => (
              <Button key={tab} variant={activeFilter === tab ? "default" : "outline"} size="sm"
                className={cn("text-xs rounded-full px-4", activeFilter === tab && "shadow-sm")}
                onClick={() => setActiveFilter(tab)}
              >{tab}</Button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading content...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground animate-fade-in">
            <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="h-8 w-8 text-accent-foreground" />
            </div>
            <p className="font-medium text-foreground mb-1">No content posts yet</p>
            <p className="text-sm mb-4">Create your first post to get started with this month's calendar.</p>
            <Button size="sm" className="shadow-sm" onClick={() => setNewPostOpen(true)}><Plus className="h-4 w-4 mr-2" /> Create First Post</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((post, i) => (
              <div key={post.id} className="bg-card rounded-xl border border-border overflow-hidden flex flex-col hover-lift animate-fade-in" style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}>
                <div className={cn("h-[3px] bg-gradient-to-r", platformGradient[post.platform] || "from-muted to-muted")} />
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {platformIcon(post.platform)}
                    <span className="text-xs text-muted-foreground">
                      {post.scheduled_date ? format(new Date(post.scheduled_date), "MMM d, yyyy · EEE") : "No date"}
                    </span>
                  </div>
                  <Badge className={cn("text-[10px] font-bold uppercase tracking-wider", statusColors[post.status] || "bg-muted text-muted-foreground")}>
                    {statusLabels[post.status] || post.status}
                  </Badge>
                </div>
                <div className="px-4 pb-3 flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{post.title}</h3>
                  {post.caption && <p className="text-sm text-muted-foreground line-clamp-3">{post.caption}</p>}
                  {post.compliance_note && (
                    <div className="mt-3 p-2.5 rounded-lg bg-warning/10 border border-warning/20">
                      <p className="text-xs font-semibold text-warning mb-0.5 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> CVBC COMPLIANCE ALERT</p>
                      <p className="text-xs text-warning/80">{post.compliance_note}</p>
                    </div>
                  )}
                </div>
                <div className="px-4 pb-3 flex items-center gap-1.5 flex-wrap">
                  {post.tags?.map((tag, ti) => (
                    <Badge key={ti} variant="outline" className={cn("text-[10px] border", getTagColor(tag))}>{tag}</Badge>
                  ))}
                  <Badge variant="outline" className="text-[10px] uppercase">{post.content_type}</Badge>
                  {post.scheduled_time && (
                    <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {post.scheduled_time.slice(0, 5)}
                    </span>
                  )}
                </div>
                <div className="border-t border-border grid grid-cols-3 bg-muted/50">
                  <Button variant="ghost" size="sm" className="rounded-none text-xs h-10" onClick={() => setEditingPost(post)}><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
                  <Button variant="ghost" size="sm" className="rounded-none text-xs h-10 text-success hover:text-success" onClick={() => updatePostStatus(post.id, "approved")}>
                    <Check className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-none text-xs h-10 text-destructive hover:text-destructive" onClick={() => updatePostStatus(post.id, "flagged")}>
                    <Flag className="h-3.5 w-3.5 mr-1" /> Flag
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <EditPostDialog
        post={editingPost}
        open={!!editingPost}
        onOpenChange={(open) => { if (!open) setEditingPost(null); }}
        onSaved={(updated) => setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))}
      />
      <NewPostDialog
        clinicId={selectedClinicId}
        open={newPostOpen}
        onOpenChange={setNewPostOpen}
        onCreated={(post) => setPosts(prev => [...prev, post])}
      />
    </DashboardLayout>
  );
}
