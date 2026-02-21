import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { EditPostDialog } from "@/components/content-calendar/EditPostDialog";
import { NewPostDialog } from "@/components/content-calendar/NewPostDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ViewToggle } from "@/components/content-calendar/ViewToggle";
import { MonthlyApprovalBar } from "@/components/content-calendar/MonthlyApprovalBar";
import { StrategyDashboard } from "@/components/content-calendar/StrategyDashboard";
import { ListView } from "@/components/content-calendar/views/ListView";
import { CalendarGridView } from "@/components/content-calendar/views/CalendarGridView";
import { WeeklyPlanningView } from "@/components/content-calendar/views/WeeklyPlanningView";
import { ContentInspector } from "@/components/content-calendar/inspector/ContentInspector";
import { type ContentPost, type CalendarView } from "@/types/content-calendar";
import {
  ChevronLeft, ChevronRight, Download, Plus,
  CalendarDays, ChevronsUpDown, FileText, FileSpreadsheet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns";
import { toast } from "sonner";

interface Clinic { id: string; clinic_name: string; }

const filterTabs = ["All", "Draft", "Pending", "Approved", "Flagged", "Posted"];

export default function ContentCalendar() {
  const { role } = useUserRole();
  const { user } = useAuth();
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [activeFilter, setActiveFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<ContentPost | null>(null);
  const [clinicPopoverOpen, setClinicPopoverOpen] = useState(false);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);
  const [view, setView] = useState<CalendarView>("list");

  useEffect(() => {
    const fetchClinics = async () => {
      let query = supabase.from("clinics").select("id, clinic_name");
      if (role === "concierge") query = query.eq("assigned_concierge_id", user?.id);
      if (role === "client") query = query.eq("owner_user_id", user?.id);
      const { data } = await query;
      setClinics(data || []);
      if (data && data.length > 0 && !selectedClinicId) {
        setSelectedClinicId(data[0].id);
      }
    };
    fetchClinics();
  }, [role, user]);

  useEffect(() => {
    if (!selectedClinicId) return;
    setLoading(true);
    const start = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const end = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    supabase.from("content_posts").select("*")
      .eq("clinic_id", selectedClinicId)
      .gte("scheduled_date", start)
      .lte("scheduled_date", end)
      .order("scheduled_date", { ascending: true })
      .then(({ data }) => {
        setPosts((data as any as ContentPost[]) || []);
        setLoading(false);
      });
  }, [selectedClinicId, currentMonth]);

  const getExportData = () => {
    const dataToExport = activeFilter === "All" ? posts : posts.filter(p => p.status === activeFilter.toLowerCase());
    if (dataToExport.length === 0) { toast.error("No posts to export."); return null; }
    const headers = ["Title", "Platform", "Content Type", "Scheduled Date", "Time", "Status", "Tags", "Caption", "Content", "Compliance Note"];
    const rows = dataToExport.map(p => [p.title, p.platform, p.content_type, p.scheduled_date || "", p.scheduled_time?.slice(0, 5) || "", p.status, (p.tags || []).join("; "), p.caption || "", p.content || "", p.compliance_note || ""]);
    return { headers, rows, count: dataToExport.length };
  };

  const handleExportCSV = () => {
    try {
      const data = getExportData();
      if (!data) return;
      const csv = [data.headers, ...data.rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `content-calendar-${format(currentMonth, "yyyy-MM")}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(`Exported ${data.count} posts as CSV.`);
    } catch { toast.error("Export failed."); }
  };

  const handleExportPDF = async () => {
    try {
      const data = getExportData();
      if (!data) return;
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");
      const doc = new jsPDF({ orientation: "landscape" });
      const clinicName = clinics.find(c => c.id === selectedClinicId)?.clinic_name || "All Clinics";
      doc.setFontSize(16); doc.text(`Content Calendar — ${clinicName}`, 14, 18);
      doc.setFontSize(10); doc.text(format(currentMonth, "MMMM yyyy"), 14, 25);
      autoTable(doc, { head: [data.headers], body: data.rows, startY: 30, styles: { fontSize: 7, cellPadding: 2 }, headStyles: { fillColor: [59, 130, 246] } });
      doc.save(`content-calendar-${format(currentMonth, "yyyy-MM")}.pdf`);
      toast.success(`Exported ${data.count} posts as PDF.`);
    } catch { toast.error("PDF export failed."); }
  };

  const filtered = activeFilter === "All" ? posts : posts.filter(p => p.status === activeFilter.toLowerCase());

  const handlePostUpdated = (updated: ContentPost) => {
    setPosts(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedPost(updated);
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 h-[calc(100vh-80px)] flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Popover open={clinicPopoverOpen} onOpenChange={setClinicPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full sm:w-[220px] justify-between text-sm">
                  {selectedClinicId ? `🐾 ${clinics.find(c => c.id === selectedClinicId)?.clinic_name}` : "Select clinic..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-0 z-50 bg-popover" align="start">
                <Command>
                  <CommandInput placeholder="Search clinics..." />
                  <CommandList>
                    <CommandEmpty>No clinic found.</CommandEmpty>
                    <CommandGroup>
                      {clinics.map(c => (
                        <CommandItem key={c.id} value={c.clinic_name}
                          onSelect={() => { setSelectedClinicId(c.id); setClinicPopoverOpen(false); }}
                          className="cursor-pointer">
                          🐾 {c.clinic_name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-base font-semibold text-foreground min-w-[140px] text-center">{format(currentMonth, "MMMM yyyy")}</span>
              <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ViewToggle view={view} onViewChange={setView} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs"><Download className="h-4 w-4 mr-1" /> Export</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportCSV}><FileSpreadsheet className="h-4 w-4 mr-2" /> CSV</DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}><FileText className="h-4 w-4 mr-2" /> PDF</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" className="text-xs" onClick={() => setNewPostOpen(true)}><Plus className="h-4 w-4 mr-1" /> New Post</Button>
          </div>
        </div>

        {/* Strategy Dashboard */}
        <StrategyDashboard posts={posts} />

        {/* Monthly Approval */}
        <MonthlyApprovalBar posts={posts} onPostsUpdated={setPosts} />

        {/* Filter Tabs */}
        <div className="flex gap-1 flex-wrap shrink-0">
          {filterTabs.map(tab => (
            <Button key={tab} variant={activeFilter === tab ? "default" : "outline"} size="sm"
              className={cn("text-[10px] rounded-full px-3 h-7", activeFilter === tab && "shadow-sm")}
              onClick={() => setActiveFilter(tab)}>
              {tab}
            </Button>
          ))}
        </div>

        {/* Main Content - Split Screen */}
        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading content...</div>
          ) : (
            <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border border-border">
              <ResizablePanel defaultSize={70} minSize={50}>
                <div className="h-full overflow-auto p-4">
                  {view === "list" && (
                    <ListView posts={filtered} selectedPostId={selectedPost?.id || null} onSelectPost={setSelectedPost} />
                  )}
                  {view === "calendar" && (
                    <CalendarGridView posts={filtered} currentMonth={currentMonth} selectedPostId={selectedPost?.id || null} onSelectPost={setSelectedPost} />
                  )}
                  {view === "weekly" && (
                    <WeeklyPlanningView posts={filtered} currentMonth={currentMonth} selectedPostId={selectedPost?.id || null} onSelectPost={setSelectedPost} />
                  )}
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={25} maxSize={45}>
                <ContentInspector
                  post={selectedPost}
                  onClose={() => setSelectedPost(null)}
                  onPostUpdated={handlePostUpdated}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </div>
      </div>

      <EditPostDialog
        post={editingPost}
        open={!!editingPost}
        onOpenChange={(open) => { if (!open) setEditingPost(null); }}
        onSaved={(updated) => setPosts(prev => prev.map(p => p.id === updated.id ? updated : p))}
      />
      <NewPostDialog
        clinicId={selectedClinicId}
        open={newPostOpen}
        onOpenChange={setNewPostOpen}
        onCreated={(post) => setPosts(prev => [...prev, post])}
      />
    </DashboardLayout>
  );
}
