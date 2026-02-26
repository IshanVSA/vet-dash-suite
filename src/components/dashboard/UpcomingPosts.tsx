import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, ArrowRight, Facebook, Instagram } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";

interface UpcomingPost {
  id: string;
  title: string;
  platform: string;
  status: string;
  scheduled_date: string;
  clinic_name: string;
}

const platformIcon = (platform: string) => {
  if (platform.toLowerCase().includes("instagram"))
    return <Instagram className="h-3.5 w-3.5 text-pink-500" />;
  return <Facebook className="h-3.5 w-3.5 text-blue-500" />;
};

const statusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "approved":
    case "published":
      return "default";
    case "pending":
      return "outline";
    case "rejected":
      return "destructive";
    default:
      return "secondary";
  }
};

export default function UpcomingPosts() {
  const [posts, setPosts] = useState<UpcomingPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("content_posts")
        .select("id, title, platform, status, scheduled_date, clinic_id, clinics(clinic_name)")
        .gte("scheduled_date", today)
        .order("scheduled_date", { ascending: true })
        .limit(7);

      const mapped: UpcomingPost[] = (data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        platform: p.platform,
        status: p.status,
        scheduled_date: p.scheduled_date,
        clinic_name: p.clinics?.clinic_name || "Unknown",
      }));
      setPosts(mapped);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) return null;

  return (
    <Card
      className="overflow-hidden border-border/60 animate-fade-in"
      style={{ animationDelay: "250ms", animationFillMode: "both" }}
    >
      <CardHeader className="border-b border-border/40 bg-muted/30 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Upcoming Posts</CardTitle>
              <p className="text-xs text-muted-foreground">Next scheduled content</p>
            </div>
          </div>
          <Link to="/content-calendar">
            <Button variant="outline" size="sm" className="rounded-lg">
              View Calendar <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {posts.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-sm">No upcoming scheduled posts.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/40">
            {posts.map((post, i) => (
              <li
                key={post.id}
                className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3 hover:bg-muted/40 transition-colors animate-fade-in"
                style={{ animationDelay: `${300 + i * 50}ms`, animationFillMode: "both" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="shrink-0">{platformIcon(post.platform)}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{post.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{post.clinic_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    {format(parseISO(post.scheduled_date), "MMM d")}
                  </span>
                  <Badge variant={statusVariant(post.status)} className="rounded-full text-[11px]">
                    {post.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
