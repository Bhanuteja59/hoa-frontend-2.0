"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession, getSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  apiGet,
  apiPostJson,
  apiPutJson,
  apiDelete,
} from "@/lib/api";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Edit2,
  Trash2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  X,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { cn } from "@/lib/utils";

const annSchema = z.object({
  title: z.string().min(3),
  body: z.string().min(5),
  audience: z.string().min(1),
  publish: z.boolean(),
  event_date: z.string().optional(),
});

export default function CalendarEventsPage() {
  const { data: session }: any = useSession();
  const roles: string[] = session?.roles ?? [];
  const isAdmin = roles.includes("ADMIN");
  const isBoard = roles.includes("BOARD") || roles.includes("BOARD_MEMBER");
  const canManage = isAdmin || isBoard;
  const { toast } = useToast();

  const qc = useQueryClient();
  const [lastJobId, setLastJobId] = useState<string | null>(null);

  // Queries
  const announcements = useQuery({
    queryKey: ["announcements"],
    queryFn: () => apiGet<any[]>("/announcements?limit=1000"),
  });
  // Create/Edit State
  const [aTitle, setATitle] = useState("");
  const [aBody, setABody] = useState("");
  const [aDate, setADate] = useState<Date | undefined>(undefined);
  const [addToCalendar, setAddToCalendar] = useState(false);
  const [audience, setAudience] = useState("ALL");

  const [editingAnn, setEditingAnn] = useState<any>(null);
  const [deletingAnn, setDeletingAnn] = useState<any>(null);

  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editAudience, setEditAudience] = useState("ALL");
  const [editDate, setEditDate] = useState<Date | undefined>(undefined);
  const [editAddToCalendar, setEditAddToCalendar] = useState(false);

  // Mutations (Announcements)
  const createAnnouncement = useMutation({
    mutationFn: (body: any) => apiPostJson<any>("/announcements", body),
    onSuccess: async () => {
      setATitle("");
      setABody("");
      setAudience("ALL");
      setADate(undefined);
      setAddToCalendar(false);
      toast({ title: "Event Created", description: "Your event has been published." });
      await qc.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  const updateAnnouncement = useMutation({
    mutationFn: (vars: { id: string; body: any }) =>
      apiPutJson<any>(`/announcements/${vars.id}`, vars.body),
    onSuccess: async () => {
      setEditingAnn(null);
      toast({ title: "Updated", description: "Event updated successfully." });
      await qc.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  const deleteAnnouncement = useMutation({
    mutationFn: (id: string) => apiDelete<any>(`/announcements/${id}`),
    onSuccess: async () => {
      setDeletingAnn(null);
      toast({ title: "Deleted", description: "Event removed." });
      await qc.invalidateQueries({ queryKey: ["announcements"] });
    },
  });

  // Document mutations removed

  // Calendar Logic
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("calendar");

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 pt-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="relative">
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-primary/10 rounded-full blur-[100px] -z-10" />
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] -z-10" />

        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Community Hub</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Calendar & Events
          </h2>
          <p className="text-muted-foreground">Stay informed about community happenings</p>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val)}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="calendar" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600">
            Calendar
          </TabsTrigger>
          <TabsTrigger value="events" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600">
            Events
          </TabsTrigger>
        </TabsList>

        {/* CALENDAR TAB */}
        <TabsContent value="calendar" className="space-y-4">
          <Card className="shadow-lg border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between py-4 px-6 border-b bg-gradient-to-r from-muted/30 to-muted/10">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                  {format(currentDate, "MMMM yyyy")}
                </h2>
                <div className="flex items-center rounded-lg border bg-background shadow-sm">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={prevMonth}
                    className="h-9 w-9 rounded-r-none border-r hover:bg-primary/10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={nextMonth}
                    className="h-9 w-9 rounded-l-none hover:bg-primary/10"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="shadow-sm hover:shadow-md transition-shadow"
              >
                Today
              </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden relative">
              <div className="grid grid-cols-7 border-b bg-gradient-to-r from-muted/20 to-muted/10">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                  (day) => (
                    <div
                      key={day}
                      className="text-center font-semibold text-xs text-muted-foreground uppercase tracking-wider py-3"
                    >
                      {day}
                    </div>
                  ),
                )}
              </div>
              <div className="grid grid-cols-7 grid-rows-6 h-[600px]">
                {calendarDays.map((day) => {
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodayDate = isToday(day);
                  const dayEvents = (announcements.data ?? []).filter(
                    (a: any) => {
                      const dateStr =
                        a.event_date ||
                        a.eventDate ||
                        a.published_at ||
                        a.created_at;
                      if (!dateStr) return false;
                      try {
                        const evtDate = parseISO(dateStr);
                        return isSameDay(evtDate, day);
                      } catch (e) {
                        return false;
                      }
                    },
                  );

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "p-2 border-b border-r min-h-[100px] relative group flex flex-col gap-1 transition-all duration-200",
                        isCurrentMonth
                          ? "bg-background hover:bg-muted/5"
                          : "bg-muted/5 text-muted-foreground",
                        isTodayDate && "bg-gradient-to-br from-primary/10 to-blue-500/5 ring-1 ring-primary/30",
                      )}
                    >
                      <div className="flex justify-between items-start">
                        <span
                          className={cn(
                            "text-xs font-semibold h-7 w-7 flex items-center justify-center rounded-full transition-all",
                            isTodayDate
                              ? "bg-gradient-to-r from-primary to-blue-600 text-primary-foreground shadow-md scale-105"
                              : "text-muted-foreground/70 group-hover:bg-muted/50",
                          )}
                        >
                          {format(day, "d")}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 mt-1 overflow-y-auto max-h-[80px] no-scrollbar">
                        {dayEvents.map((ev: any) => (
                          <TooltipProvider key={ev.id}>
                            <Tooltip delayDuration={0}>
                              <TooltipTrigger asChild>
                                <div
                                  className={cn(
                                    "text-[10px] px-2 py-1.5 rounded-md truncate font-medium shadow-sm transition-all duration-300 cursor-default",
                                    "hover:-translate-y-0.5 hover:shadow-md",
                                    ev.audience === "BOARD"
                                      ? "bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-700 dark:text-red-400 border border-red-500/30 hover:border-red-500/50"
                                      : "bg-gradient-to-r from-primary/20 to-blue-500/20 text-primary border border-primary/30 hover:border-primary/50",
                                  )}
                                >
                                  {ev.title}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="right"
                                align="start"
                                className="w-80 p-0 z-50 overflow-hidden shadow-xl border-0 ring-1 ring-black/5 bg-white/95 backdrop-blur dark:bg-zinc-950/95"
                              >
                                <div className={cn(
                                  "h-1.5 w-full bg-gradient-to-r",
                                  ev.audience === "BOARD" ? "from-red-500 to-pink-500" : "from-primary to-blue-600"
                                )} />
                                <div className="p-4 space-y-3">
                                  <div>
                                    <h4 className="font-bold text-base leading-tight tracking-tight text-foreground">
                                      {ev.title}
                                    </h4>
                                    <div className="flex items-center gap-1.5 mt-1.5 text-xs font-medium text-muted-foreground">
                                      <Clock className="h-3.5 w-3.5 opacity-70" />
                                      <span className="tabular-nums">
                                        {new Date(ev.event_date || ev.eventDate || ev.published_at || ev.created_at).toLocaleString(undefined, {
                                          weekday: 'short',
                                          month: 'short',
                                          day: 'numeric',
                                          hour: 'numeric',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-sm text-muted-foreground/90 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto pr-1">
                                    {ev.body}
                                  </div>
                                  {ev.audience !== "ALL" && (
                                    <div className="pt-2 border-t flex justify-end">
                                      <Badge
                                        className={cn(
                                          "px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold",
                                          ev.audience === "BOARD"
                                            ? "bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-700 dark:text-red-400 border-red-500/30"
                                            : "bg-gradient-to-r from-primary/20 to-blue-500/20 text-primary border-primary/30"
                                        )}
                                      >
                                        {ev.audience} Only
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* EVENTS TAB */}
        <TabsContent value="events" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {canManage && (
              <Card className="h-fit shadow-lg bg-card/50 backdrop-blur-sm border-border/60">
                <CardHeader className="bg-gradient-to-br from-primary/5 to-blue-500/5 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    Create Event
                  </CardTitle>
                  <CardDescription>
                    Post a new announcement or calendar event.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-3">
                    <Input
                      placeholder="Event Title"
                      value={aTitle}
                      onChange={(e) => setATitle(e.target.value)}
                      className="shadow-sm"
                    />
                    <Textarea
                      placeholder="Event details and description..."
                      value={aBody}
                      onChange={(e) => setABody(e.target.value)}
                      className="shadow-sm min-h-[100px]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={addToCalendar ? "outline" : "ghost"}
                          size="sm"
                          className={cn(
                            "justify-start text-left font-medium shadow-sm",
                            !addToCalendar && "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {addToCalendar && aDate ? (
                            format(aDate, "MMM d, yyyy")
                          ) : (
                            "Add to Calendar"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={aDate}
                          onSelect={(d) => {
                            setADate(d);
                            if (d) setAddToCalendar(true);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    {addToCalendar && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          setAddToCalendar(false);
                          setADate(undefined);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Select value={audience} onValueChange={setAudience}>
                      <SelectTrigger className="flex-1 h-9 shadow-sm">
                        <SelectValue placeholder="Audience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All Residents</SelectItem>
                        <SelectItem value="RESIDENTS">Residents Only</SelectItem>
                        <SelectItem value="BOARD">Board Only</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="flex-1 h-9 shadow-md shadow-primary/25"
                      onClick={() => {
                        const parsed = annSchema.safeParse({
                          title: aTitle,
                          body: aBody,
                          audience,
                          publish: true,
                          event_date:
                            addToCalendar && aDate
                              ? aDate.toISOString()
                              : undefined,
                        });
                        if (!parsed.success) {
                          toast({
                            title: "Validation Error",
                            description: "Title (min 3) and Details (min 5) required.",
                            variant: "destructive",
                          });
                          return;
                        }
                        createAnnouncement.mutate(parsed.data);
                      }}
                      disabled={createAnnouncement.isPending}
                    >
                      {createAnnouncement.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Publish"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="space-y-4">
              {announcements.isLoading ? (
                <>
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-32 bg-gradient-to-r from-muted/30 via-muted/50 to-muted/30 animate-pulse rounded-xl" />
                  ))}
                </>
              ) : announcements.data?.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-2xl bg-gradient-to-br from-muted/20 to-muted/5 h-[300px]">
                  <div className="p-4 bg-gradient-to-br from-primary/10 to-blue-500/10 rounded-2xl mb-4">
                    <CalendarIcon className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">No Events Found</h3>
                  <p className="text-sm text-muted-foreground">Create your first event to get started.</p>
                </div>
              ) : (
                (announcements.data ?? []).map((a: any) => (
                  <Card key={a.id} className="group hover:shadow-lg transition-all duration-300 bg-card/50 backdrop-blur-sm border-border/60 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                    <CardHeader className="p-4 pb-2 relative z-10">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{a.title}</h4>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(a.event_date || a.eventDate || a.published_at || a.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge
                          className={cn(
                            "text-[10px] h-5 px-2 shrink-0",
                            a.audience === "BOARD"
                              ? "bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-700 border-red-500/30"
                              : a.audience === "ALL"
                                ? "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 border-green-500/30"
                                : "bg-gradient-to-r from-primary/20 to-blue-500/20 text-primary border-primary/30"
                          )}
                        >
                          {a.audience}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 relative z-10">
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {a.body}
                      </p>

                      {canManage && (
                        <div className="mt-3 flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                            onClick={() => {
                              setEditTitle(a.title);
                              setEditBody(a.body);
                              setEditAudience(a.audience);

                              const existingDate = a.event_date || a.eventDate;
                              if (existingDate) {
                                setEditDate(parseISO(existingDate));
                                setEditAddToCalendar(true);
                              } else {
                                setEditDate(undefined);
                                setEditAddToCalendar(false);
                              }
                              setEditingAnn(a);
                            }}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeletingAnn(a)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* DOCUMENTS TAB REMOVED */}
      </Tabs>

      {/* Edit Announcement Dialog */}
      <Dialog
        open={!!editingAnn}
        onOpenChange={(open) => !open && setEditingAnn(null)}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Event</DialogTitle>
            <DialogDescription>Update event content or visibility</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Title</Label>
              <Input
                placeholder="Event title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Details</Label>
              <Textarea
                placeholder="Event details..."
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={editAddToCalendar ? "outline" : "ghost"}
                    className={cn(
                      "justify-start text-left font-normal",
                      !editAddToCalendar && "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {editAddToCalendar && editDate ? (
                      format(editDate, "PPP")
                    ) : (
                      "Add to Calendar"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={editDate}
                    onSelect={(d) => {
                      setEditDate(d);
                      if (d) setEditAddToCalendar(true);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {editAddToCalendar && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    setEditAddToCalendar(false);
                    setEditDate(undefined);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid gap-2">
              <Label className="text-sm font-semibold">Audience</Label>
              <Select value={editAudience} onValueChange={setEditAudience}>
                <SelectTrigger>
                  <SelectValue placeholder="Audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Residents</SelectItem>
                  <SelectItem value="RESIDENTS">Residents Only</SelectItem>
                  <SelectItem value="BOARD">Board Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAnn(null)}>
              Cancel
            </Button>
            <Button
              disabled={updateAnnouncement.isPending}
              onClick={() => {
                if (editingAnn) {
                  updateAnnouncement.mutate({
                    id: editingAnn.id,
                    body: {
                      title: editTitle,
                      body: editBody,
                      audience: editAudience,
                      publish: true,
                      event_date:
                        editAddToCalendar && editDate
                          ? editDate.toISOString()
                          : null,
                    },
                  });
                }
              }}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Announcement Dialog */}
      <Dialog
        open={!!deletingAnn}
        onOpenChange={(open) => !open && setDeletingAnn(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Event?</DialogTitle>
            <DialogDescription>
              Are you sure? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingAnn(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteAnnouncement.isPending}
              onClick={() => {
                if (deletingAnn) deleteAnnouncement.mutate(deletingAnn.id);
              }}
            >
              {deleteAnnouncement.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {deleteAnnouncement.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Dialogs removed */}
    </div>
  );
}
