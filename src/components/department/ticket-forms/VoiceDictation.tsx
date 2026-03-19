import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VoiceDictationProps {
  formType: string;
  onFieldsExtracted: (fields: Record<string, any>) => void;
}

// Check browser support
const SpeechRecognition =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export function VoiceDictation({ formType, onFieldsExtracted }: VoiceDictationProps) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
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
      // For "no-speech" or "network" errors, let onend handle restart
    };

    recognition.onend = () => {
      // Auto-restart if user hasn't explicitly stopped
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
  }, []);

  const extractFields = useCallback(async () => {
    if (!transcript.trim()) return;
    setExtracting(true);

    try {
      const { data, error } = await supabase.functions.invoke("extract-ticket-fields", {
        body: { transcript: transcript.trim(), formType },
      });

      if (error) throw error;
      if (data?.fields) {
        onFieldsExtracted(data.fields);
        toast.success("Form fields autofilled from your dictation!");
        setTranscript("");
      } else {
        toast.error("Could not extract fields. Try again with more detail.");
      }
    } catch (err) {
      console.error("Extraction error:", err);
      toast.error("Failed to extract fields. Please try again.");
    } finally {
      setExtracting(false);
    }
  }, [transcript, formType, onFieldsExtracted]);

  if (!SpeechRecognition) return null;

  return (
    <div className="space-y-2">
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

        {transcript.trim() && !listening && (
          <Button
            type="button"
            variant="default"
            size="sm"
            className="gap-1.5"
            onClick={extractFields}
            disabled={extracting}
          >
            {extracting ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Extracting…</>
            ) : (
              <><Sparkles className="h-3.5 w-3.5" /> Fill Form</>
            )}
          </Button>
        )}
      </div>

      {(transcript || listening) && (
        <div className="rounded-md border border-border/50 bg-muted/30 p-2.5 text-xs text-muted-foreground leading-relaxed max-h-24 overflow-y-auto">
          {transcript || (
            <span className="italic">Listening… speak now</span>
          )}
        </div>
      )}
    </div>
  );
}
