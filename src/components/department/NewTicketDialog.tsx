import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { FileUploader, type AttachedFile } from "./ticket-forms/FileUploader";
import { TimeChangesForm } from "./ticket-forms/TimeChangesForm";
import { PopupOffersForm } from "./ticket-forms/PopupOffersForm";
import { ThirdPartyIntegrationsForm } from "./ticket-forms/ThirdPartyIntegrationsForm";
import { PaymentOptionsForm } from "./ticket-forms/PaymentOptionsForm";
import { AddRemoveTeamForm } from "./ticket-forms/AddRemoveTeamForm";
import { NewFormsForm } from "./ticket-forms/NewFormsForm";
import { PriceListForm } from "./ticket-forms/PriceListForm";

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: string;
  services: string[];
  onCreated: () => void;
  defaultType?: string;
  clinicId?: string;
}


const CUSTOM_FORM_TYPES = ["Time Changes", "Pop-up Offers", "Third Party Integrations", "Payment Options", "Add/Remove Team Members", "New Forms", "Price List Updates"];

const AUTO_TITLES: Record<string, string> = {
  "Time Changes": "Time Changes Request",
  "Pop-up Offers": "Pop-up Offer Request",
  "Third Party Integrations": "Third Party Integration Request",
  "Payment Options": "Payment Options Request",
  "Add/Remove Team Members": "Team Member Update Request",
  "New Forms": "New Form Request",
  "Price List Updates": "Price List Update Request",
};

export function NewTicketDialog({ open, onOpenChange, department, services, onCreated, defaultType = "", clinicId }: NewTicketDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [ticketType, setTicketType] = useState(defaultType);
  const [priority, setPriority] = useState<"regular" | "urgent" | "emergency">("regular");
  const [customDescription, setCustomDescription] = useState("");
  const [genericDescription, setGenericDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [popupConsented, setPopupConsented] = useState(false);
  const [promoteSocial, setPromoteSocial] = useState(false);

  const isCustomForm = CUSTOM_FORM_TYPES.includes(ticketType);
  const isAddTeamMember = ticketType === "Add/Remove Team Members" && customDescription.includes("Action: Add");

  useEffect(() => {
    if (open && defaultType) {
      setTicketType(defaultType);
      if (AUTO_TITLES[defaultType]) {
        setTitle(AUTO_TITLES[defaultType]);
      }
    }
  }, [open, defaultType]);

  useEffect(() => {
    if (AUTO_TITLES[ticketType] && (!title || Object.values(AUTO_TITLES).includes(title))) {
      setTitle(AUTO_TITLES[ticketType]);
    }
  }, [ticketType]);

  const reset = () => {
    setTitle("");
    setTicketType("");
    setPriority("regular");
    setCustomDescription("");
    setGenericDescription("");
    setNotes("");
    setFiles([]);
    setPopupConsented(false);
    setPromoteSocial(false);
  };

  const handleCustomFormChange = useCallback((desc: string) => {
    setCustomDescription(desc);
  }, []);


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
    if (!isCustomForm && (!title.trim() || !ticketType)) {
      toast.error("Title and Type are required");
      return;
    }
    if (isCustomForm && !ticketType) {
      toast.error("Type is required");
      return;
    }
    if (ticketType === "Time Changes" && !customDescription.includes("Start Date:") || (ticketType === "Time Changes" && customDescription.includes("(not set)"))) {
      toast.error("Start date is required for Time Changes");
      return;
    }
    if (ticketType === "Pop-up Offers" && !popupConsented) {
      toast.error("Please verify the offer and provide consent before submitting");
      return;
    }
    if (!user) return;

    let finalDescription = isCustomForm ? customDescription : (genericDescription.trim() || null);
    if (ticketType === "Add/Remove Team Members" && promoteSocial && finalDescription) {
      finalDescription = `${finalDescription}\nPromote on Social Media: Yes`;
    }

    setLoading(true);

    const { data: ticket, error } = await supabase.from("department_tickets" as any).insert({
      title: title.trim(),
      department,
      ticket_type: ticketType,
      priority,
      description: finalDescription,
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


  const renderCustomForm = () => {
    switch (ticketType) {
      case "Time Changes":
        return <TimeChangesForm onChange={handleCustomFormChange} />;
      case "Pop-up Offers":
        return <PopupOffersForm onChange={handleCustomFormChange} onConsentChange={setPopupConsented} clinicId={clinicId} />;
      case "Third Party Integrations":
        return <ThirdPartyIntegrationsForm onChange={handleCustomFormChange} />;
      case "Payment Options":
        return <PaymentOptionsForm onChange={handleCustomFormChange} />;
      case "Add/Remove Team Members":
        return <AddRemoveTeamForm onChange={handleCustomFormChange} />;
      case "New Forms":
        return <NewFormsForm onChange={handleCustomFormChange} />;
      case "Price List Updates":
        return <PriceListForm onChange={handleCustomFormChange} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Ticket — {ticketType || "Select Type"}</DialogTitle>
          <DialogDescription>Create a new support ticket for this department.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {!isCustomForm && (
            <div className="space-y-1.5">
              <Label htmlFor="ticket-title">Title *</Label>
              <Input id="ticket-title" placeholder="Brief summary of the issue" value={title} onChange={e => setTitle(e.target.value)} maxLength={200} />
            </div>
          )}

          {!isCustomForm && (
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
          )}

          {isCustomForm ? (
            renderCustomForm()
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="ticket-desc">Description</Label>
              <Textarea id="ticket-desc" placeholder="Describe the issue in detail..." value={genericDescription} onChange={e => setGenericDescription(e.target.value)} rows={3} maxLength={2000} />
            </div>
          )}

          {ticketType !== "Pop-up Offers" && (
            <div className="space-y-1.5">
              <Label htmlFor="ticket-notes">{ticketType === "Add/Remove Team Members" ? "Bio" : "Notes"}</Label>
              <Textarea id="ticket-notes" placeholder={ticketType === "Add/Remove Team Members" ? "Short bio for the team member..." : "Additional notes..."} value={notes} onChange={e => setNotes(e.target.value)} rows={2} maxLength={1000} />
            </div>
          )}

          {ticketType !== "Time Changes" && ticketType !== "Pop-up Offers" && (
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
          )}

          {isAddTeamMember && (
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
              <Checkbox
                id="promote-social"
                checked={promoteSocial}
                onCheckedChange={(checked) => setPromoteSocial(checked === true)}
              />
              <Label htmlFor="promote-social" className="cursor-pointer text-sm font-normal">
                Promote new team member on social media
              </Label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading || uploading || (ticketType === "Pop-up Offers" && !popupConsented)}>
            {uploading ? (
              <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Uploading…</>
            ) : loading ? "Creating…" : "Create Ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
