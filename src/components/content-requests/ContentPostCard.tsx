import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ContentPostCardProps {
  post: any;
  index: number;
  defaultOpen?: boolean;
}

export function ContentPostCard({ post, index, defaultOpen = false }: ContentPostCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const weekNum = post.week || Math.ceil((index + 1) / 4);
  const postNum = post.post_number || index + 1;
  const preview = post.caption || post.main_copy || "";
  const previewText = preview.length > 60 ? preview.slice(0, 60) + "…" : preview;

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border/60 bg-card/50 transition-all duration-200 hover:border-primary/30",
        open && "hover:shadow-md hover:shadow-primary/5"
      )}
    >
      {/* Post number indicator */}
      <div className="absolute -top-2.5 -left-1 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm z-10">
        #{postNum}
      </div>

      {/* Collapsed header — always visible, clickable */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 p-3 pt-4 text-left cursor-pointer"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Badge variant="outline" className="text-[10px] font-semibold border-primary/20 text-primary bg-accent/50 shrink-0">
            W{weekNum}
          </Badge>
          {post.content_type && (
            <Badge variant="secondary" className="text-[10px] shrink-0">{post.content_type}</Badge>
          )}
          {!open && previewText && (
            <span className="text-xs text-muted-foreground truncate">{previewText}</span>
          )}
        </div>
        <ChevronDown className={cn(
          "h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200",
          open && "rotate-180"
        )} />
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-4 pb-4 space-y-3 animate-fade-in">
          {post.theme && (
            <span className="text-[10px] text-muted-foreground italic">{post.theme}</span>
          )}

          {post.caption && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Caption</p>
              <p className="text-sm leading-relaxed text-foreground">{post.caption}</p>
            </div>
          )}

          {post.main_copy && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Main Copy</p>
              <p className="text-sm leading-relaxed text-foreground">{post.main_copy}</p>
            </div>
          )}

          {post.cta && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">Call to Action</p>
              <p className="text-sm font-semibold text-primary">{post.cta}</p>
            </div>
          )}

          {post.hashtags && (
            <div className="pt-1 border-t border-border/40">
              <p className="text-[11px] text-primary/70 leading-relaxed">{post.hashtags}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
