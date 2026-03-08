import { useState, useRef, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
}

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content: "👋 Hi! I'm your VSA assistant. I can help you navigate the platform, answer questions about your services, or point you in the right direction. How can I help?",
};

interface ChatAssistantProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatAssistant({ open, onOpenChange }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: text };
    const botMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "Thanks for your message! AI-powered responses are coming soon. For now, please use the ticketing system for support requests.",
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col p-0 sm:max-w-md w-full">
        <SheetHeader className="px-5 py-4 border-b border-border shrink-0">
          <SheetTitle className="flex items-center gap-2 text-base">
            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            Chat Assistant
          </SheetTitle>
        </SheetHeader>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-2.5", msg.role === "user" && "flex-row-reverse")}>
              <div className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                msg.role === "assistant" ? "bg-primary/10" : "bg-muted"
              )}>
                {msg.role === "assistant" ? (
                  <Bot className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </div>
              <div className={cn(
                "rounded-xl px-3.5 py-2.5 text-sm max-w-[80%] leading-relaxed",
                msg.role === "assistant"
                  ? "bg-muted text-foreground"
                  : "bg-primary text-primary-foreground"
              )}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>

        {/* Input */}
        <div className="shrink-0 border-t border-border p-4">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
