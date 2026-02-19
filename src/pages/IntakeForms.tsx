import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, FileText, ClipboardList, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const themeOptions = [
  "Pet Dental Health Month", "Valentine's / Love Your Pet", "Educational / Tips",
  "Seasonal / Holiday", "Wellness & Prevention", "New Client Promos",
  "Community / Adoption", "Surgery & Recovery", "Senior Pet Care", "Puppy / Kitten Care",
];

const monthOptions = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(new Date().getFullYear(), i, 1);
  return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") };
});
const nextYearMonths = Array.from({ length: 6 }, (_, i) => {
  const d = new Date(new Date().getFullYear() + 1, i, 1);
  return { value: format(d, "yyyy-MM"), label: format(d, "MMMM yyyy") };
});
const allMonthOptions = [...monthOptions, ...nextYearMonths];

export default function IntakeForms() {
  const { role } = useUserRole();
  const { user } = useAuth();
  const [clinics, setClinics] = useState<{ id: string; clinic_name: string }[]>([]);
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"));
  const [goal, setGoal] = useState("brand_awareness");
  const [secondaryGoals, setSecondaryGoals] = useState("");
  const [promotions, setPromotions] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [adBudget, setAdBudget] = useState("");
  const [specialEvents, setSpecialEvents] = useState("");
  const [tone, setTone] = useState("professional");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState("");
  const [services, setServices] = useState("");
  const [competitors, setCompetitors] = useState("");
  const [notes, setNotes] = useState("");
  const [topPost, setTopPost] = useState("");
  const [avgEngagement, setAvgEngagement] = useState("");
  const [followerGrowth, setFollowerGrowth] = useState("");
  const [topContentType, setTopContentType] = useState("");
  const [performanceNotes, setPerformanceNotes] = useState("");
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [preferredPlatforms, setPreferredPlatforms] = useState("instagram_facebook");
  const [postsPerWeek, setPostsPerWeek] = useState("3");
  const [generating, setGenerating] = useState(false);

  const [clinicPopoverOpen, setClinicPopoverOpen] = useState(false);

  const section1Done = !!selectedClinicId && !!selectedMonth;
  const section2Done = !!(topPost || avgEngagement || followerGrowth);
  const section3Done = !!goal;
  const section4Done = selectedThemes.length > 0;
  const filledSections = [section1Done, section2Done, section3Done, section4Done].filter(Boolean).length;
  const progressPercent = (filledSections / 4) * 100;

  useEffect(() => {
    const loadClinics = async () => {
      let query = supabase.from("clinics").select("id, clinic_name").eq("status", "active");
      if (role === "concierge" && user) query = query.eq("assigned_concierge_id", user.id);
      const { data } = await query.order("clinic_name");
      setClinics(data || []);
    };
    loadClinics();
  }, [role, user]);

  const toggleTheme = (theme: string) => {
    setSelectedThemes(prev => prev.includes(theme) ? prev.filter(t => t !== theme) : [...prev, theme]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClinicId) { toast.error("Please select a clinic first"); return; }
    setGenerating(true);

    const intakeData = {
      clinicName: clinics.find(c => c.id === selectedClinicId)?.clinic_name,
      goal, secondaryGoals, promotions, targetAudience, adBudget, specialEvents,
      tone, services, competitors, notes, selectedMonth, country, language,
      topPost, avgEngagement, followerGrowth, topContentType, performanceNotes,
      selectedThemes, preferredPlatforms, postsPerWeek,
      platform: preferredPlatforms,
    };

    // Also save as calendar_submission for tracking
    await supabase.from("calendar_submissions").insert({
      clinic_id: selectedClinicId,
      submitter_name: user?.email || "Unknown",
      submitter_email: user?.email,
      month: selectedMonth,
      submitted_by: user?.id,
      notes: JSON.stringify(intakeData),
      status: "pending",
    });

    // Call dual-AI generation edge function
    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: { clinic_id: selectedClinicId, intake_data: intakeData },
      });

      if (error) throw error;

      const errorList = data?.errors || [];
      if (errorList.length > 0 && (!data?.versions || data.versions.length === 0)) {
        toast.error("AI generation failed: " + errorList.map((e: any) => `${e.model}: ${e.error}`).join("; "));
      } else if (errorList.length > 0) {
        toast.warning(`Content generated with partial results. ${errorList[0].model} failed.`);
      } else {
        toast.success("Content generated! View results in Content Requests.");
      }
    } catch (err: any) {
      toast.error("Generation failed: " + (err.message || "Unknown error"));
    }

    setGenerating(false);
  };

  const sectionHeader = (step: number, title: string, description: string) => (
    <CardHeader className="border-b border-border/40 bg-muted/20">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-bold flex items-center justify-center shadow-sm">{step}</div>
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="text-xs mt-0.5">{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="hero-section">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="h-5 w-5 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Workflow</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Monthly Client Intake</h1>
            <p className="text-muted-foreground mt-0.5 text-sm">Fill in the details below to generate a monthly content plan.</p>
          </div>
        </div>

        <div className="animate-fade-in" style={{ animationDelay: "100ms", animationFillMode: "both" }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">{filledSections} of 4 sections started</p>
            <p className="text-xs font-medium text-primary">{Math.round(progressPercent)}%</p>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1 */}
          <Card className="animate-fade-in hover-lift" style={{ animationDelay: "150ms", animationFillMode: "both" }}>
            {sectionHeader(1, "Client Information", "Select the client and calendar month.")}
            <CardContent className="space-y-5 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Clinic *</Label>
                   <Popover open={clinicPopoverOpen} onOpenChange={setClinicPopoverOpen}>
                     <PopoverTrigger asChild>
                       <Button variant="outline" role="combobox" className="w-full h-10 justify-between font-normal text-sm">
                         {selectedClinicId ? clinics.find(c => c.id === selectedClinicId)?.clinic_name : "Choose a clinic..."}
                         <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                       </Button>
                     </PopoverTrigger>
                     <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-50 bg-popover" align="start">
                       <Command>
                         <CommandInput placeholder="Search clinics..." />
                         <CommandList>
                           <CommandEmpty>No clinic found.</CommandEmpty>
                           <CommandGroup>
                             {clinics.map(c => (
                               <CommandItem key={c.id} value={c.clinic_name} onSelect={() => { setSelectedClinicId(c.id); setClinicPopoverOpen(false); }} className="cursor-pointer">
                                 {c.clinic_name}
                               </CommandItem>
                             ))}
                           </CommandGroup>
                         </CommandList>
                       </Command>
                     </PopoverContent>
                   </Popover>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Calendar Month *</Label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>{allMonthOptions.map(m => (<SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ad Budget</Label>
                  <Input value={adBudget} onChange={e => setAdBudget(e.target.value)} placeholder="$1,500" className="h-10 input-glow" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tone of Voice *</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="emotional">Emotional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Country</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Select country..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="GB">United Kingdom</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                      <SelectItem value="DE">Germany</SelectItem>
                      <SelectItem value="FR">France</SelectItem>
                      <SelectItem value="ES">Spain</SelectItem>
                      <SelectItem value="IT">Italy</SelectItem>
                      <SelectItem value="BR">Brazil</SelectItem>
                      <SelectItem value="MX">Mexico</SelectItem>
                      <SelectItem value="IN">India</SelectItem>
                      <SelectItem value="NL">Netherlands</SelectItem>
                      <SelectItem value="SE">Sweden</SelectItem>
                      <SelectItem value="NO">Norway</SelectItem>
                      <SelectItem value="DK">Denmark</SelectItem>
                      <SelectItem value="NZ">New Zealand</SelectItem>
                      <SelectItem value="ZA">South Africa</SelectItem>
                      <SelectItem value="AE">United Arab Emirates</SelectItem>
                      <SelectItem value="JP">Japan</SelectItem>
                      <SelectItem value="KR">South Korea</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Select language..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="nl">Dutch</SelectItem>
                      <SelectItem value="sv">Swedish</SelectItem>
                      <SelectItem value="no">Norwegian</SelectItem>
                      <SelectItem value="da">Danish</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="ko">Korean</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2 */}
          <Card className="animate-fade-in hover-lift" style={{ animationDelay: "200ms", animationFillMode: "both" }}>
            {sectionHeader(2, "Past Performance", "Share last month's key metrics and insights.")}
            <CardContent className="space-y-5 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Performing Post</Label>
                  <Input value={topPost} onChange={e => setTopPost(e.target.value)} placeholder="e.g., Dental cleaning before/after" className="h-10 input-glow" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg. Engagement Rate</Label>
                  <Input value={avgEngagement} onChange={e => setAvgEngagement(e.target.value)} placeholder="e.g., 4.2%" className="h-10 input-glow" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Follower Growth</Label>
                  <Input value={followerGrowth} onChange={e => setFollowerGrowth(e.target.value)} placeholder="e.g., +120" className="h-10 input-glow" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Content Type</Label>
                  <Select value={topContentType} onValueChange={setTopContentType}>
                    <SelectTrigger className="h-10"><SelectValue placeholder="Select type..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reels">Reels / Video</SelectItem>
                      <SelectItem value="carousel">Carousel</SelectItem>
                      <SelectItem value="static">Static Image</SelectItem>
                      <SelectItem value="stories">Stories</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Performance Notes</Label>
                <Textarea value={performanceNotes} onChange={e => setPerformanceNotes(e.target.value)} placeholder="Any insights from last month..." rows={2} className="input-glow" />
              </div>
            </CardContent>
          </Card>

          {/* Section 3 */}
          <Card className="animate-fade-in hover-lift" style={{ animationDelay: "250ms", animationFillMode: "both" }}>
            {sectionHeader(3, "Client Goals This Month", "Define primary objectives and promotions.")}
            <CardContent className="space-y-5 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Primary Goal *</Label>
                  <Select value={goal} onValueChange={setGoal}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="brand_awareness">Brand Awareness</SelectItem>
                      <SelectItem value="leads">Lead Generation</SelectItem>
                      <SelectItem value="promotions">Promotions</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Secondary Goals</Label>
                  <Input value={secondaryGoals} onChange={e => setSecondaryGoals(e.target.value)} placeholder="e.g., Increase dental bookings" className="h-10 input-glow" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Promotions to Feature</Label>
                <Textarea value={promotions} onChange={e => setPromotions(e.target.value)} placeholder="Any special promotions..." rows={2} className="input-glow" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upcoming Events</Label>
                  <Input value={specialEvents} onChange={e => setSpecialEvents(e.target.value)} placeholder="Grand opening, adoption day" className="h-10 input-glow" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Target Audience</Label>
                  <Input value={targetAudience} onChange={e => setTargetAudience(e.target.value)} placeholder="Pet owners, age 25-55" className="h-10 input-glow" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Services to Highlight</Label>
                  <Input value={services} onChange={e => setServices(e.target.value)} placeholder="Dental cleanings, wellness exams" className="h-10 input-glow" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Competitors</Label>
                  <Input value={competitors} onChange={e => setCompetitors(e.target.value)} placeholder="List any local competitors" className="h-10 input-glow" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4 */}
          <Card className="animate-fade-in hover-lift" style={{ animationDelay: "300ms", animationFillMode: "both" }}>
            {sectionHeader(4, "Monthly Themes & Content Preferences", "Select themes and platform preferences.")}
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select Themes</Label>
                <div className="flex flex-wrap gap-2">
                  {themeOptions.map(theme => (
                    <button key={theme} type="button" onClick={() => toggleTheme(theme)}
                      className={cn(
                        "px-3.5 py-2 rounded-lg text-xs font-medium border transition-all duration-200",
                        selectedThemes.includes(theme)
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-secondary text-secondary-foreground border-border hover:bg-accent"
                      )}>
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preferred Platforms</Label>
                  <Select value={preferredPlatforms} onValueChange={setPreferredPlatforms}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="instagram_facebook">Instagram + Facebook</SelectItem>
                      <SelectItem value="instagram_tiktok">Instagram + TikTok</SelectItem>
                      <SelectItem value="all">All Platforms</SelectItem>
                      <SelectItem value="instagram">Instagram Only</SelectItem>
                      <SelectItem value="facebook">Facebook Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Posts Per Week</Label>
                  <Select value={postsPerWeek} onValueChange={setPostsPerWeek}>
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 per week</SelectItem>
                      <SelectItem value="3">3 per week</SelectItem>
                      <SelectItem value="4">4 per week</SelectItem>
                      <SelectItem value="5">5 per week</SelectItem>
                      <SelectItem value="7">Daily</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Additional Notes</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional notes..." rows={3} className="input-glow" />
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3 animate-fade-in" style={{ animationDelay: "350ms", animationFillMode: "both" }}>
            <Button type="submit" disabled={generating} className="flex-1 shadow-sm">
              <Sparkles className="h-4 w-4 mr-2" />
              {generating ? "Submitting..." : "Submit Intake & Generate"}
            </Button>
            <Button type="button" variant="outline" onClick={() => toast.success("Draft saved locally!")}>
              <FileText className="h-4 w-4 mr-2" /> Save Draft
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
