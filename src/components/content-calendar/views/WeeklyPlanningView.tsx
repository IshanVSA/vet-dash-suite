import { type ContentPost } from "@/types/content-calendar";
import { CompactPostCard } from "../cards/CompactPostCard";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay, addWeeks, startOfMonth, endOfMonth } from "date-fns";

interface WeeklyPlanningViewProps {
  posts: ContentPost[];
  currentMonth: Date;
  selectedPostId: string | null;
  onSelectPost: (post: ContentPost) => void;
}

export function WeeklyPlanningView({ posts, currentMonth, selectedPostId, onSelectPost }: WeeklyPlanningViewProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Get all weeks that overlap with this month
  const weeks: Date[][] = [];
  let weekStart = startOfWeek(monthStart);
  while (weekStart <= monthEnd) {
    const weekEnd = endOfWeek(weekStart);
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    weeks.push(days);
    weekStart = addWeeks(weekStart, 1);
  }

  const getPostsForDay = (date: Date) =>
    posts.filter((p) => p.scheduled_date && isSameDay(new Date(p.scheduled_date), date));

  return (
    <div className="space-y-4">
      {weeks.map((week, wi) => (
        <div key={wi} className="space-y-1">
          <h4 className="text-xs font-semibold text-muted-foreground">
            Week of {format(week[0], "MMM d")}
          </h4>
          <div className="grid grid-cols-7 gap-2">
            {week.map((day) => {
              const dayPosts = getPostsForDay(day);
              return (
                <div key={day.toISOString()} className="space-y-1">
                  <div className="text-[10px] text-muted-foreground text-center font-medium">
                    {format(day, "EEE d")}
                  </div>
                  <div className="space-y-1 min-h-[60px]">
                    {dayPosts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => onSelectPost(post)}
                        className="text-[9px] bg-card border border-border rounded p-1 cursor-pointer hover:bg-muted/50 transition-colors truncate"
                      >
                        {post.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
