import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, CalendarDays, Check, Flag, Pencil, Instagram, Facebook } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const statusColors: Record<string, string> = {
  published: "bg-success text-success-foreground",
  scheduled: "bg-info text-info-foreground",
  draft: "bg-muted text-muted-foreground",
};

const platformIcon = (platform: string) => {
  switch (platform) {
    case "instagram": return <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"><Instagram className="h-3.5 w-3.5 text-white" /></div>;
    case "facebook": return <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center"><Facebook className="h-3.5 w-3.5 text-white" /></div>;
    default: return <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-[10px] font-bold">{platform[0]?.toUpperCase()}</div>;
  }
};

const filterTabs = ["All", "Scheduled", "Draft", "Published"];

export default function ContentCalendar() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("facebook");
  const [status, setStatus] = useState("draft");
  const [activeFilter, setActiveFilter] = useState("All");

  const { data: posts, isLoading } = useQuery({
    queryKey: ["content-posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("content_posts").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createPost = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("content_posts").insert({ title, content, platform, status, created_by: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-posts"] });
      toast.success("Post created!");
      setOpen(false);
      setTitle(""); setContent(""); setPlatform("facebook"); setStatus("draft");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string; newStatus: string }) => {
      const { error } = await supabase.from("content_posts").update({ status: newStatus }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-posts"] });
    },
  });

  const filtered = activeFilter === "All" ? posts : posts?.filter(p => p.status === activeFilter.toLowerCase());

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" />
              Content Calendar
            </h1>
            <p className="text-muted-foreground mt-1">{posts?.length ?? 0} total posts</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" /> New Post</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Post</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createPost.mutate(); }} className="space-y-4">
                <div className="space-y-2"><Label>Title</Label><Input required value={title} onChange={(e) => setTitle(e.target.value)} className="input-glow" /></div>
                <div className="space-y-2"><Label>Content</Label><Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="input-glow" /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createPost.isPending}>Create Post</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5">
          {filterTabs.map(tab => (
            <Button
              key={tab}
              variant={activeFilter === tab ? "default" : "outline"}
              size="sm"
              className={cn("text-xs rounded-full px-4", activeFilter === tab && "shadow-sm")}
              onClick={() => setActiveFilter(tab)}
            >
              {tab}
            </Button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading content...</div>
        ) : !filtered?.length ? (
          <div className="text-center py-16 text-muted-foreground animate-fade-in">
            <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="h-8 w-8 text-accent-foreground" />
            </div>
            <p className="font-medium text-foreground mb-1">No content posts yet</p>
            <p className="text-sm mb-4">Create your first post to get started.</p>
            <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" /> Create First Post</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((post, i) => (
              <div
                key={post.id}
                className="bg-card rounded-xl border border-border overflow-hidden flex flex-col hover-lift animate-fade-in"
                style={{ animationDelay: `${i * 50}ms`, animationFillMode: "both" }}
              >
                <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {platformIcon(post.platform)}
                    <span className="text-xs text-muted-foreground capitalize">{post.platform}</span>
                  </div>
                  <Badge className={cn("text-[10px] font-bold uppercase tracking-wider", statusColors[post.status] || "bg-muted text-muted-foreground")}>
                    {post.status}
                  </Badge>
                </div>
                <div className="px-4 pb-3 flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{post.title}</h3>
                  {post.content && <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>}
                </div>
                <div className="border-t border-border grid grid-cols-3 bg-muted/50">
                  <Button variant="ghost" size="sm" className="rounded-none text-xs h-10">
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    className="rounded-none text-xs h-10 text-success hover:text-success"
                    onClick={() => updateStatus.mutate({ id: post.id, newStatus: "scheduled" })}
                  >
                    <Check className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                  <Button
                    variant="ghost" size="sm"
                    className="rounded-none text-xs h-10 text-destructive hover:text-destructive"
                    onClick={() => updateStatus.mutate({ id: post.id, newStatus: "draft" })}
                  >
                    <Flag className="h-3.5 w-3.5 mr-1" /> Flag
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
