import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { type ContentPost } from "@/types/content-calendar";

interface EditPostDialogProps {
  post: ContentPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (updated: ContentPost) => void;
}

const platforms = ["instagram", "facebook", "tiktok"];
const contentTypes = ["IMAGE", "REEL", "CAROUSEL", "STORY", "VIDEO"];
const statuses = ["draft", "scheduled", "pending", "approved", "posted", "flagged"];

export function EditPostDialog({ post, open, onOpenChange, onSaved }: EditPostDialogProps) {
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [contentType, setContentType] = useState("IMAGE");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [status, setStatus] = useState("scheduled");
  const [tags, setTags] = useState("");
  const [complianceNote, setComplianceNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (post) {
      setTitle(post.title);
      setCaption(post.caption || "");
      setContent(post.content || "");
      setPlatform(post.platform);
      setContentType(post.content_type);
      setScheduledDate(post.scheduled_date || "");
      setScheduledTime(post.scheduled_time?.slice(0, 5) || "");
      setStatus(post.status);
      setTags((post.tags || []).join(", "));
      setComplianceNote(post.compliance_note || "");
    }
  }, [post]);

  const handleSave = async () => {
    if (!post) return;
    setSaving(true);
    const updatedFields = {
      title,
      caption: caption || null,
      content: content || null,
      platform,
      content_type: contentType,
      scheduled_date: scheduledDate || null,
      scheduled_time: scheduledTime ? scheduledTime + ":00" : null,
      status,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      compliance_note: complianceNote || null,
    };

    const { error } = await supabase.from("content_posts").update(updatedFields).eq("id", post.id);
    setSaving(false);

    if (error) {
      toast.error("Failed to save changes");
      return;
    }

    toast.success("Post updated!");
    onSaved({ ...post, ...updatedFields } as ContentPost);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Title / Hook</Label>
            <Input id="edit-title" value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-caption">Caption</Label>
            <Textarea id="edit-caption" value={caption} onChange={e => setCaption(e.target.value)} rows={4} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-content">Main Copy</Label>
            <Textarea id="edit-content" value={content} onChange={e => setContent(e.target.value)} rows={4} placeholder="Main copy / body text" />
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
              <Label>Content Type</Label>
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
              <Label htmlFor="edit-date">Scheduled Date</Label>
              <Input id="edit-date" type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-time">Scheduled Time</Label>
              <Input id="edit-time" type="time" value={scheduledTime} onChange={e => setScheduledTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {statuses.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
            <Input id="edit-tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. Awareness, Dental, Top" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-compliance">Compliance Note</Label>
            <Textarea id="edit-compliance" value={complianceNote} onChange={e => setComplianceNote(e.target.value)} rows={2} placeholder="Optional CVBC compliance note" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !title.trim()}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
