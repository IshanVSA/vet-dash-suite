import { type ContentPost } from "@/types/content-calendar";
import { CompactPostCard } from "../cards/CompactPostCard";

interface ListViewProps {
  posts: ContentPost[];
  selectedPostId: string | null;
  onSelectPost: (post: ContentPost) => void;
}

export function ListView({ posts, selectedPostId, onSelectPost }: ListViewProps) {
  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p className="font-medium text-foreground mb-1">No posts found</p>
        <p className="text-sm">Adjust filters or create a new post.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {posts.map((post) => (
        <CompactPostCard
          key={post.id}
          post={post}
          isSelected={selectedPostId === post.id}
          onClick={() => onSelectPost(post)}
        />
      ))}
    </div>
  );
}
