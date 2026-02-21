import { useMemo } from "react";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, format, isSameMonth, isToday
} from "date-fns";
import { cn } from "@/lib/utils";
import { PostChip, type ContentPost } from "./PostChip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MonthlyViewProps {
  currentMonth: Date;
  posts: ContentPost[];
  onPostClick: (post: ContentPost) => void;
  onPostsChange: (updater: (prev: ContentPost[]) => ContentPost[]) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthlyView({ currentMonth, posts, onPostClick, onPostsChange }: MonthlyViewProps) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  const postsByDate = useMemo(() => {
    const map: Record<string, ContentPost[]> = {};
    posts.forEach(p => {
      if (p.scheduled_date) {
        const key = p.scheduled_date;
        if (!map[key]) map[key] = [];
        map[key].push(p);
      }
    });
    return map;
  }, [posts]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData("text/plain");
    if (!postId) return;

    const post = posts.find(p => p.id === postId);
    if (!post || post.status === "posted" || post.scheduled_date === dateStr) return;

    // Optimistic update
    onPostsChange(prev => prev.map(p => p.id === postId ? { ...p, scheduled_date: dateStr } : p));

    const { error } = await supabase
      .from("content_posts")
      .update({ scheduled_date: dateStr })
      .eq("id", postId);

    if (error) {
      // Revert
      onPostsChange(prev => prev.map(p => p.id === postId ? { ...p, scheduled_date: post.scheduled_date } : p));
      toast.error("Failed to reschedule post");
    } else {
      toast.success(`Post rescheduled to ${format(new Date(dateStr + "T00:00:00"), "MMM d, yyyy")}`);
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 bg-muted/50">
        {WEEKDAYS.map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2 border-b border-border">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((day, i) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayPosts = postsByDate[dateStr] || [];
          const inMonth = isSameMonth(day, currentMonth);

          return (
            <div
              key={i}
              data-date={dateStr}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, dateStr)}
              className={cn(
                "min-h-[100px] border-b border-r border-border p-1.5 transition-colors",
                !inMonth && "bg-muted/30",
                "hover:bg-accent/20"
              )}
            >
              <div className={cn(
                "text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                isToday(day) && "bg-primary text-primary-foreground",
                !inMonth && "text-muted-foreground/50"
              )}>
                {format(day, "d")}
              </div>
              <div className="space-y-1">
                {dayPosts.map(post => (
                  <PostChip key={post.id} post={post} onClick={onPostClick} compact />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
