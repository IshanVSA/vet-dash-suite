import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import type { ContentPost } from "./PostChip";

interface NewPostDialogProps {
  clinicId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (post: ContentPost) => void;
}

const platforms = ["instagram", "facebook", "tiktok"];
const contentTypes = ["IMAGE", "REEL", "CAROUSEL", "STORY", "VIDEO"];

export function NewPostDialog({ clinicId, open, onOpenChange, onCreated }: NewPostDialogProps) {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [contentType, setContentType] = useState("IMAGE");
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [scheduledTime, setScheduledTime] = useState("");
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setTitle("");
    setCaption("");
    setPlatform("instagram");
    setContentType("IMAGE");
    setScheduledDate(format(new Date(), "yyyy-MM-dd"));
    setScheduledTime("");
  };

  const handleCreate = async () => {
    if (!title.trim() || !clinicId) return;
    setSaving(true);

    const newPost = {
      clinic_id: clinicId,
      title: title.trim(),
      caption: caption || null,
      platform,
      content_type: contentType,
      scheduled_date: scheduledDate || null,
      scheduled_time: scheduledTime ? scheduledTime + ":00" : null,
      status: "scheduled",
      tags: [],
    };

    const { data, error } = await supabase.from("content_posts").insert(newPost).select().single();
    setSaving(false);

    if (error) {
      toast.error("Failed to create post");
      return;
    }

    toast.success("Post created!");
    onCreated(data as unknown as ContentPost);
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="new-title">Title</Label>
            <Input id="new-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Post title…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-caption">Caption</Label>
            <Textarea id="new-caption" value={caption} onChange={e => setCaption(e.target.value)} rows={3} placeholder="Write the caption…" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {platforms.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Post Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {contentTypes.map(ct => <SelectItem key={ct} value={ct}>{ct}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-date">Date</Label>
              <Input id="new-date" type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-time">Time</Label>
              <Input id="new-time" type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving || !title.trim() || !clinicId}>
            {saving ? "Creating…" : "Create Post"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
