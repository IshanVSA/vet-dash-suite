import { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Upload, X, FileIcon, Loader2 } from "lucide-react";

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: string;
  services: string[];
  onCreated: () => void;
  defaultType?: string;
  clinicId?: string;
}

interface AttachedFile {
  file: File;
  preview?: string;
}

export function NewTicketDialog({ open, onOpenChange, department, services, onCreated, defaultType = "", clinicId }: NewTicketDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [ticketType, setTicketType] = useState(defaultType);
  const [priority, setPriority] = useState<"regular" | "urgent" | "emergency">("regular");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && defaultType) setTicketType(defaultType);
  }, [open, defaultType]);

  const reset = () => {
    setTitle("");
    setTicketType("");
    setPriority("regular");
    setDescription("");
    setNotes("");
    setFiles([]);
  };

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles).slice(0, 5 - files.length);
    const mapped: AttachedFile[] = arr.map(f => ({
      file: f,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));
    setFiles(prev => [...prev, ...mapped].slice(0, 5));
  }, [files.length]);

  const removeFile = (index: number) => {
    setFiles(prev => {
      const removed = prev[index];
      if (removed.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const uploadFiles = async (ticketId: string): Promise<string[]> => {
    const paths: string[] = [];
    for (const { file } of files) {
      const ext = file.name.split(".").pop() || "bin";
      const path = `tickets/${ticketId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("department-files").upload(path, file);
      if (error) {
        console.error("Upload error:", error);
        continue;
      }
      paths.push(path);
    }
    return paths;
  };

  const handleSubmit = async () => {
    if (!title.trim() || !ticketType) {
      toast.error("Title and Type are required");
      return;
    }
    if (!user) return;

    setLoading(true);

    // Create ticket first
    const { data: ticket, error } = await supabase.from("department_tickets" as any).insert({
      title: title.trim(),
      department,
      ticket_type: ticketType,
      priority,
      description: description.trim() || null,
      notes: notes.trim() || null,
      created_by: user.id,
      ...(clinicId ? { clinic_id: clinicId } : {}),
    } as any).select("id").single();

    if (error || !ticket) {
      toast.error("Failed to create ticket");
      console.error(error);
      setLoading(false);
      return;
    }

    // Upload files if any
    if (files.length > 0) {
      setUploading(true);
      const paths = await uploadFiles((ticket as any).id);
      if (paths.length > 0) {
        await supabase.from("department_tickets" as any)
          .update({ attachments: paths } as any)
          .eq("id", (ticket as any).id);
      }
      setUploading(false);
    }

    setLoading(false);
    toast.success("Ticket created");
    reset();
    onOpenChange(false);
    onCreated();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Ticket</DialogTitle>
          <DialogDescription>Create a new support ticket for this department.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="ticket-title">Title *</Label>
            <Input id="ticket-title" placeholder="Brief summary of the issue" value={title} onChange={e => setTitle(e.target.value)} maxLength={200} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={ticketType} onValueChange={setTicketType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {services.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={v => setPriority(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular (24-48 hrs)</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticket-desc">Description</Label>
            <Textarea id="ticket-desc" placeholder="Describe the issue in detail..." value={description} onChange={e => setDescription(e.target.value)} rows={3} maxLength={2000} />
          </div>

          {/* Attachments */}
          <div className="space-y-1.5">
            <Label>Attachments <span className="text-muted-foreground font-normal">({files.length}/5)</span></Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip"
              onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
            />
            <div
              className={`border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-muted/30"
              }`}
              onClick={() => files.length < 5 && fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-muted-foreground py-1">
                  <Upload className="h-5 w-5 mb-1" />
                  <span className="text-xs">Drag & drop files here or click to browse</span>
                  <span className="text-[10px] mt-0.5">Images, PDFs, Docs, Spreadsheets (max 5 files)</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 p-1.5 rounded-md bg-muted/40 group">
                      {f.preview ? (
                        <img src={f.preview} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                          <FileIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate text-foreground">{f.file.name}</p>
                        <p className="text-[10px] text-muted-foreground">{formatSize(f.file.size)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={e => { e.stopPropagation(); removeFile(i); }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {files.length < 5 && (
                    <p className="text-[10px] text-center text-muted-foreground">Click or drop to add more</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticket-notes">Notes</Label>
            <Textarea id="ticket-notes" placeholder="Additional notes..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} maxLength={1000} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || uploading}>
            {uploading ? (
              <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Uploading…</>
            ) : loading ? "Creating…" : "Create Ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
