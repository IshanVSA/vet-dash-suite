import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VoiceDictationProps {
  formType: string;
  onFieldsExtracted: (fields: Record<string, any>) => void;
}

const SpeechRecognition =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export function VoiceDictation({ formType, onFieldsExtracted }: VoiceDictationProps) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [editableTranscript, setEditableTranscript] = useState("");
  const [extracting, setExtracting] = useState(false);
  const recognitionRef = useRef<any>(null);
  const stoppingRef = useRef(false);
  const finalTranscriptRef = useRef("");

  const startListening = useCallback(() => {
    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    stoppingRef.current = false;
    finalTranscriptRef.current = "";

    recognition.onresult = (event: any) => {
      let interim = "";
      let finalT = "";
      for (let i = 0; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalT += t + " ";
        } else {
          interim = t;
        }
      }
      finalTranscriptRef.current = finalT;
      setTranscript(finalT + interim);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        stoppingRef.current = true;
        setListening(false);
        toast.error("Microphone access denied. Please allow mic access.");
      }
    };

    recognition.onend = () => {
      if (!stoppingRef.current && recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch {
          setListening(false);
        }
      } else {
        setListening(false);
      }
    };

    recognition.start();
    setListening(true);
    setTranscript("");
  }, []);

  const stopListening = useCallback(() => {
    stoppingRef.current = true;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);

    const currentTranscript = finalTranscriptRef.current.trim() || transcript.trim();
    if (currentTranscript) {
      setEditableTranscript(currentTranscript);
      setShowDialog(true);
    }
  }, [transcript]);

  const handleAutofill = useCallback(async () => {
    if (!editableTranscript.trim()) return;
    setExtracting(true);

    try {
      const { data, error } = await supabase.functions.invoke("extract-ticket-fields", {
        body: { transcript: editableTranscript.trim(), formType },
      });

      if (error) throw error;
      if (data?.fields) {
        onFieldsExtracted(data.fields);
        toast.success("Form fields autofilled from your dictation!");
        setShowDialog(false);
        setTranscript("");
        setEditableTranscript("");
      } else {
        toast.error("Could not extract fields. Try again with more detail.");
      }
    } catch (err) {
      console.error("Extraction error:", err);
      toast.error("Failed to extract fields. Please try again.");
    } finally {
      setExtracting(false);
    }
  }, [editableTranscript, formType, onFieldsExtracted]);

  const handleCancel = useCallback(() => {
    setShowDialog(false);
    setTranscript("");
    setEditableTranscript("");
  }, []);

  if (!SpeechRecognition) return null;

  return (
    <>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={listening ? "destructive" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={listening ? stopListening : startListening}
            >
              {listening ? (
                <>
                  <MicOff className="h-3.5 w-3.5" />
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive-foreground opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive-foreground" />
                  </span>
                  Stop
                </>
              ) : (
                <>
                  <Mic className="h-3.5 w-3.5" />
                  Dictate
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {listening ? "Click to stop recording" : "Speak to autofill the form with AI"}
          </TooltipContent>
        </Tooltip>

        {listening && (
          <span className="text-xs text-muted-foreground italic">Listening… speak now</span>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Review Transcript</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Review or edit the transcribed text, then click Autofill to populate the form.
          </p>
          <Textarea
            value={editableTranscript}
            onChange={(e) => setEditableTranscript(e.target.value)}
            className="min-h-[120px]"
            placeholder="Your dictated text will appear here..."
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={extracting}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAutofill}
              disabled={extracting || !editableTranscript.trim()}
              className="gap-1.5"
            >
              {extracting ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Extracting…</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5" /> Autofill Form</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}