import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentPostCardProps {
  post: any;
  index: number;
  defaultOpen?: boolean;
  isLast?: boolean;
}

export function ContentPostCard({ post, index, defaultOpen = false, isLast = false }: ContentPostCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const weekNum = post.week || Math.ceil((index + 1) / 4);
  const postNum = post.post_number || index + 1;
  const preview = post.caption || post.main_copy || "";
  const previewText = preview.length > 80 ? preview.slice(0, 80) + "…" : preview;

  return (
    <div className={cn(!isLast && "border-b border-border/30")}>
      {/* Collapsed row */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 py-3 px-1 text-left cursor-pointer group hover:bg-accent/30 transition-colors rounded-md"
      >
        <ChevronRight className={cn(
          "h-3.5 w-3.5 text-muted-foreground/60 shrink-0 transition-transform duration-200",
          open && "rotate-90"
        )} />
        <span className="text-xs font-semibold text-muted-foreground/70 shrink-0 w-6">#{postNum}</span>
        <Badge variant="outline" className="text-[10px] font-medium border-border/50 text-muted-foreground shrink-0 py-0">
          W{weekNum}
        </Badge>
        {post.content_type && (
          <Badge variant="secondary" className="text-[10px] shrink-0 py-0">{post.content_type}</Badge>
        )}
        {!open && previewText && (
          <span className="text-xs text-muted-foreground/60 truncate">{previewText}</span>
        )}
      </button>

      {/* Expanded content */}
      {open && (
        <div className="pl-10 pr-2 pb-4 space-y-3 animate-fade-in">
          {post.theme && (
            <p className="text-xs text-muted-foreground/60 italic">{post.theme}</p>
          )}

          {post.caption && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">Caption</p>
              <p className="text-sm leading-relaxed text-foreground">{post.caption}</p>
            </div>
          )}

          {post.main_copy && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">Main Copy</p>
              <p className="text-sm leading-relaxed text-foreground">{post.main_copy}</p>
            </div>
          )}

          {post.cta && (
            <div className="space-y-1">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">Call to Action</p>
              <p className="text-sm font-medium text-primary">{post.cta}</p>
            </div>
          )}

          {post.hashtags && (
            <p className="text-[11px] text-primary/60 leading-relaxed pt-1">{post.hashtags}</p>
          )}
        </div>
      )}
    </div>
  );
}
