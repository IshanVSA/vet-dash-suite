import { Badge } from "@/components/ui/badge";

interface ContentPostCardProps {
  post: any;
  index: number;
}

export function ContentPostCard({ post, index }: ContentPostCardProps) {
  const weekNum = post.week || Math.ceil((index + 1) / 4);
  const postNum = post.post_number || index + 1;

  return (
    <div className="group relative rounded-xl border border-border/60 bg-card/50 p-4 space-y-3 transition-all duration-200 hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
      {/* Post number indicator */}
      <div className="absolute -top-2.5 -left-1 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
        #{postNum}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Badge variant="outline" className="text-[10px] font-semibold border-primary/20 text-primary bg-accent/50">
          Week {weekNum}
        </Badge>
        {post.content_type && (
          <Badge variant="secondary" className="text-[10px]">{post.content_type}</Badge>
        )}
        {post.theme && (
          <span className="text-[10px] text-muted-foreground italic truncate">{post.theme}</span>
        )}
      </div>

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
  );
}
