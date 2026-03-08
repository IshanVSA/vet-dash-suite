import { useState, useEffect, useRef } from "react";
import { Bell, Check, FileText, MessageSquare, AlertTriangle, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "post_approved" | "post_flagged" | "comment_added" | "status_changed";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

import { Bell, Check, FileText, MessageSquare, AlertTriangle, CheckCircle, Ticket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: "post_approved" | "post_flagged" | "comment_added" | "status_changed" | "ticket_created";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const typeConfig = {
  post_approved: { icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
  post_flagged: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
  comment_added: { icon: MessageSquare, color: "text-primary", bg: "bg-primary/10" },
  status_changed: { icon: FileText, color: "text-muted-foreground", bg: "bg-muted" },
  ticket_created: { icon: Ticket, color: "text-amber-500", bg: "bg-amber-500/10" },
};

export function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Load notifications from post_activity_log as a proxy
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("post_activity_log")
        .select("id, action, metadata, created_at, post_id")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        const mapped: Notification[] = data.map((log: any) => {
          const meta = typeof log.metadata === "object" ? log.metadata : {};
          let type: Notification["type"] = "status_changed";
          if (log.action.includes("approved")) type = "post_approved";
          else if (log.action.includes("flag")) type = "post_flagged";
          else if (log.action.includes("comment")) type = "comment_added";

          return {
            id: log.id,
            type,
            title: log.action.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
            message: meta.message || `Post activity: ${log.action}`,
            read: false,
            created_at: log.created_at,
          };
        });
        setNotifications(mapped);
      }
    };
    fetchNotifications();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "post_activity_log" }, (payload) => {
        const log = payload.new as any;
        const meta = typeof log.metadata === "object" ? log.metadata : {};
        let type: Notification["type"] = "status_changed";
        if (log.action.includes("approved")) type = "post_approved";
        else if (log.action.includes("flag")) type = "post_flagged";
        else if (log.action.includes("comment")) type = "comment_added";

        const newNotif: Notification = {
          id: log.id,
          type,
          title: log.action.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
          message: meta.message || `Post activity: ${log.action}`,
          read: false,
          created_at: log.created_at,
        };
        setNotifications(prev => [newNotif, ...prev].slice(0, 30));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div ref={ref} className="relative">
      <button
        className="relative p-2 rounded-lg hover:bg-muted transition-colors"
        onClick={() => setOpen(!open)}
      >
        <Bell className="h-[18px] w-[18px] text-muted-foreground" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
              <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <Check className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[380px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                notifications.map((notif, i) => {
                  const config = typeConfig[notif.type];
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={cn(
                        "flex items-start gap-3 px-4 py-3 border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer",
                        !notif.read && "bg-primary/[0.03]"
                      )}
                      onClick={() =>
                        setNotifications(prev =>
                          prev.map(n => n.id === notif.id ? { ...n, read: true } : n)
                        )
                      }
                    >
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", config.bg)}>
                        <Icon className={cn("h-4 w-4", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground truncate">{notif.title}</p>
                          {!notif.read && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
