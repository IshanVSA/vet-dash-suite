import { type ContentPost, STAGE_BORDER_COLORS, STAGE_BADGE_COLORS, STAGE_LABELS } from "@/types/content-calendar";
import { Badge } from "@/components/ui/badge";
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface CalendarGridViewProps {
  posts: ContentPost[];
  currentMonth: Date;
  selectedPostId: string | null;
  onSelectPost: (post: ContentPost) => void;
}

export function CalendarGridView({ posts, currentMonth, selectedPostId, onSelectPost }: CalendarGridViewProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDayOfWeek = getDay(monthStart);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getPostsForDay = (date: Date) =>
    posts.filter((p) => p.scheduled_date && isSameDay(new Date(p.scheduled_date), date));

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-7 gap-px">
        {weekdays.map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground uppercase py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px bg-border/50 rounded-lg overflow-hidden">
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="bg-card/50 min-h-[80px] p-1" />
        ))}
        {days.map((day) => {
          const dayPosts = getPostsForDay(day);
          const density = dayPosts.length;
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "bg-card min-h-[80px] p-1 space-y-0.5 transition-colors",
                density >= 4 && "bg-destructive/5",
                density === 0 && "bg-blue-500/3"
              )}
            >
              <span className="text-[10px] text-muted-foreground font-medium">
                {format(day, "d")}
              </span>
              {dayPosts.slice(0, 3).map((post) => {
                const stage = post.workflow_stage || "draft";
                return (
                  <div
                    key={post.id}
                    onClick={() => onSelectPost(post)}
                    className={cn(
                      "text-[9px] truncate rounded px-1 py-0.5 cursor-pointer transition-colors border-l-2",
                      STAGE_BORDER_COLORS[stage],
                      selectedPostId === post.id
                        ? "bg-primary/15 text-primary"
                        : "bg-muted/50 text-foreground hover:bg-muted"
                    )}
                  >
                    {post.title}
                  </div>
                );
              })}
              {dayPosts.length > 3 && (
                <span className="text-[9px] text-muted-foreground">+{dayPosts.length - 3} more</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
