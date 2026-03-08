import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Upload } from "lucide-react";

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: string;
  services: string[];
  onCreated: () => void;
}

export function NewTicketDialog({ open, onOpenChange, department, services, onCreated }: NewTicketDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [ticketType, setTicketType] = useState("");
  const [priority, setPriority] = useState<"regular" | "urgent" | "emergency">("regular");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setTitle("");
    setTicketType("");
    setPriority("regular");
    setDescription("");
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!title.trim() || !ticketType) {
      toast.error("Title and Type are required");
      return;
    }
    if (!user) return;

    setLoading(true);
    const { error } = await supabase.from("department_tickets" as any).insert({
      title: title.trim(),
      department,
      ticket_type: ticketType,
      priority,
      description: description.trim() || null,
      notes: notes.trim() || null,
      created_by: user.id,
    } as any);

    setLoading(false);

    if (error) {
      toast.error("Failed to create ticket");
      console.error(error);
      return;
    }

    toast.success("Ticket created");
    reset();
    onOpenChange(false);
    onCreated();
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

          {/* Attachment placeholder */}
          <div className="space-y-1.5">
            <Label>Attachments</Label>
            <div className="border-2 border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-muted-foreground opacity-60 cursor-not-allowed">
              <Upload className="h-5 w-5 mb-1" />
              <span className="text-xs">Drag & drop files here (coming soon)</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticket-notes">Notes</Label>
            <Textarea id="ticket-notes" placeholder="Additional notes..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} maxLength={1000} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating…" : "Create Ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
