"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  AlertTriangle,
  ClipboardList,
  Megaphone,
  Wrench,
  Activity,
  ArrowRight,
  Clock,
  CheckCircle2,
  Timer,
  TrendingUp,
  Sparkles,
  Copy
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { WelcomeOnboarding } from "@/components/WelcomeOnboarding";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { data: session }: any = useSession();
  const { toast } = useToast();

  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => apiGet<any>("/auth/me") });
  const communityType = me?.community_type || session?.user?.community_type || "APARTMENTS";

  const isHOA = communityType === "OWN_HOUSES" || communityType === "HOA";
  const workOrderSectionLabel = isHOA ? "General Requests" : "Work Orders";
  const userRoles = session?.roles || me?.roles || [];
  const isAdmin = userRoles.some((r: string) => ["ADMIN", "BOARD_ADMIN", "BOARD", "BOARD_MEMBER", "HOA_BOARD_MEMBER"].includes(r));

  const stats = useQuery({
    queryKey: ["stats", session?.user?.tenantId],
    queryFn: () => apiGet<any>("/stats"),
  });

  const recentAnnouncements = useQuery({
    queryKey: ["announcements", "recent", session?.user?.tenantId],
    queryFn: () => apiGet<any[]>("/announcements?limit=5&upcoming=true"),
  });

  const recentWorkOrders = useQuery({
    queryKey: ["work-orders", "recent", session?.user?.tenantId],
    queryFn: () => apiGet<any[]>("/work-orders?limit=5"),
  });

  const s = stats.data || {};
  const communityName = s.community_name || session?.tenant_name || "Community";

  // Greeting based on time
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Safe Date parsing
  const formatDate = (dateString: string | undefined | null) => {
    try {
      if (!dateString) return "No Date";
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "Invalid Date";
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return "Date Error";
    }
  };

  const isNew = (dateString: string | undefined) => {
    if (!dateString) return false;
    const d = new Date(dateString);
    return (new Date().getTime() - d.getTime()) / (1000 * 3600 * 24) < 3;
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-6 lg:p-8 pt-6 max-w-7xl mx-auto">
      <WelcomeOnboarding me={me} tenantName={communityName} />
      {/* Header Section with Gradient Accent */}
      <div className="relative">
        {/* Decorative gradient blur */}
        <div className="absolute -top-10 -left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px] -z-10" />
        <div className="absolute -top-10 -right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] -z-10" />

        <div className="flex flex-col gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 uppercase gap-1.5 py-1 px-3 text-xs shadow-sm">
                <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                {communityType.replace('_', ' ')} Community
              </Badge>
              <Badge variant="secondary" className="uppercase py-1 px-3 text-xs border border-border/50 text-muted-foreground shadow-sm">
                {userRoles[0]?.replace('_', ' ') || "RESIDENT"}
              </Badge>
              {isAdmin && (me?.tenant_slug || session?.tenant_slug || session?.user?.tenant_slug) && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-blue-500/10 text-blue-600 border-blue-500/20 py-1 px-3 text-xs shadow-sm font-mono tracking-wider cursor-pointer hover:bg-blue-500/20 transition-colors flex items-center gap-1.5"
                    title="Click to copy community code"
                    onClick={() => {
                      const code = me?.tenant_slug || session?.tenant_slug || session?.user?.tenant_slug;
                      if (code) {
                        navigator.clipboard.writeText(code);
                        toast({ title: "Copied!", description: "Community code copied to clipboard." });
                      }
                    }}
                  >
                    Code: {me?.tenant_slug || session?.tenant_slug || session?.user?.tenant_slug}
                    <Copy className="h-3 w-3" />
                  </Badge>
                </div>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                {greeting}
              </span>
              <span className="text-foreground">, {session?.user?.name?.split(" ")[0] || "User"}</span>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
              Manage and oversee <span className="font-semibold text-foreground">{communityName}</span> with powerful insights and real-time updates.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview with Modern Cards */}
      <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Residents"
          value={s.residents_count ?? 0}
          subtitle={
            (session?.roles?.includes("ADMIN") && s.residents_pending > 0)
              ? `${s.residents_pending} pending approval`
              : "Active community members"
          }
          icon={Users}
          gradient="from-blue-500 to-cyan-500"
          iconBg="bg-gradient-to-br from-blue-500/10 to-cyan-500/10"
          loading={stats.isLoading}
          href="/dashboard/residents-units"
        />
        <StatCard
          title={isHOA ? "General Requests" : "Work Orders"}
          value={s.open_work_orders ?? 0}
          subtitle="Requests in progress"
          icon={Wrench}
          gradient="from-amber-500 to-orange-500"
          iconBg="bg-gradient-to-br from-amber-500/10 to-orange-500/10"
          loading={stats.isLoading}
          href="/dashboard/requests"
        />
        {isHOA && (
          <StatCard
            title="ARC Requests"
            value={s.pending_arc ?? 0}
            subtitle="Architectural reviews"
            icon={ClipboardList}
            gradient="from-emerald-500 to-teal-500"
            iconBg="bg-gradient-to-br from-emerald-500/10 to-teal-500/10"
            loading={stats.isLoading}
            href="/dashboard/requests?tab=arc"
          />
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:gap-8 grid-cols-1 lg:grid-cols-7">

        {/* Recent Work Orders */}
        <Card className="lg:col-span-4 border-border/40 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden relative group">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
            <div className="space-y-1">
              <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-blue-500/20">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                Recent Activity
              </CardTitle>
              <CardDescription className="text-sm">Latest {isHOA ? "general requests and ARC" : "maintenance requests"} updates</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="hidden sm:flex hover:bg-primary/10 hover:text-primary transition-all" asChild>
              <Link href="/dashboard/requests" className="flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>

          <CardContent className="relative z-10">
            {recentWorkOrders.isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-4 p-4 border rounded-xl shadow-sm">
                    <Skeleton className="h-10 w-10 rounded-xl" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            ) : (recentWorkOrders.data?.length === 0) ? (
              <EmptyState
                icon={Wrench}
                title="No recent activity"
                description={`Everything is quiet. No active ${workOrderSectionLabel.toLowerCase()} at this time.`}
              />
            ) : (
              <div className="space-y-2">
                {(recentWorkOrders.data ?? []).map((wo: any, idx: number) => (
                  <Link
                    key={wo.id}
                    href="/dashboard/requests"
                    className="group/item flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-primary/5 hover:to-transparent rounded-xl transition-all duration-300 border border-transparent hover:border-primary/20 hover:shadow-md"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-center gap-4 overflow-hidden flex-1">
                      <div className={cn("p-2.5 rounded-xl shrink-0 shadow-sm", getStatusColorBg(wo.status))}>
                        {getStatusIcon(wo.status)}
                      </div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-tight truncate group-hover/item:text-primary transition-colors">
                          {wo.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium">{wo.unit_number ? `Unit ${wo.unit_number}` : "Common Area"}</span>
                          <span>•</span>
                          <span>{new Date(wo.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("ml-2 capitalize font-medium", getStatusColorText(wo.status), "border-current/30 bg-current/5")}
                    >
                      {wo.status.toLowerCase().replace('_', ' ')}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-4 sm:hidden">
              <Button variant="outline" className="w-full hover:bg-primary/10 hover:text-primary transition-all" asChild>
                <Link href="/dashboard/requests">View All Activity</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Announcements Feed */}
        <Card className="lg:col-span-3 border-border/40 shadow-lg bg-card/50 backdrop-blur-sm flex flex-col overflow-hidden relative">
          {/* Decorative element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-3xl -z-0" />

          <CardHeader className="relative z-10">
            <CardTitle className="flex items-center gap-2 text-xl md:text-2xl font-bold">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
                <Megaphone className="h-5 w-5 text-primary" />
              </div>
              Community Board
            </CardTitle>
            <CardDescription className="text-sm">
              Latest news and announcements
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 relative z-10">
            {recentAnnouncements.isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-4 p-4 border rounded-xl shadow-sm relative">
                    <Skeleton className="absolute left-[8px] top-6 h-3 w-3 rounded-full border-2 border-background" />
                    <div className="space-y-2 flex-1 ml-4 block w-full">
                      <div className="flex justify-between items-center mb-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-12 rounded-full" />
                      </div>
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-1/4 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (recentAnnouncements.data?.length === 0) ? (
              <EmptyState
                icon={Megaphone}
                title="No announcements"
                description="Check back later for community news and updates."
              />
            ) : (
              <div className="relative space-y-6">
                {/* Gradient timeline */}
                <div className="absolute left-[13px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />

                {(recentAnnouncements.data ?? []).map((a: any, idx: number) => {
                  const dateInfo = a.event_date || a.published_at || a.published_at_formatted || a.created_at;

                  return (
                    <Link
                      key={a.id}
                      href="/dashboard/documents"
                      className="relative pl-10 group/announcement block"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      {/* Timeline Dot with pulse animation */}
                      <div className="absolute left-[6px] top-1 h-4 w-4 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10 shadow-lg group-hover/announcement:scale-110 transition-transform">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      </div>

                      <div className="space-y-2 p-4 rounded-xl hover:bg-primary/5 transition-all duration-300 border border-transparent hover:border-primary/20">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-sm font-semibold leading-tight group-hover/announcement:text-primary transition-colors cursor-pointer flex-1">
                            {a.title}
                          </h4>
                          {isNew(dateInfo) && (
                            <Badge className="text-[10px] h-5 px-2 bg-gradient-to-r from-primary to-blue-600 text-primary-foreground border-none shadow-sm animate-pulse">
                              NEW
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                          {a.body}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium pt-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(dateInfo)}</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-dashed">
              <Button
                variant="ghost"
                className="w-full text-muted-foreground hover:text-primary hover:bg-primary/10 group transition-all"
                asChild
              >
                <Link href="/dashboard/documents" className="flex items-center justify-center gap-2">
                  Read All Updates
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper Components

function StatCard({ title, value, subtitle, icon: Icon, gradient, iconBg, loading, href }: any) {
  const content = (
    <Card className="relative border-border/40 shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden group cursor-pointer bg-card/50 backdrop-blur-sm h-full">
      {/* Animated gradient background */}
      <div className={cn("absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-all duration-500", gradient)} />

      {/* Decorative corner accent */}
      <div className={cn("absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl opacity-5 group-hover:opacity-10 transition-opacity rounded-bl-[100px]", gradient)} />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</CardTitle>
        <div className={cn("p-2.5 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300", iconBg)}>
          <Icon className={cn("h-5 w-5 bg-gradient-to-br bg-clip-text", gradient)} />
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-1">
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold tracking-tight">
             {loading ? <Skeleton className="h-8 w-16" /> : value}
          </div>
          {!loading && value > 0 && (
            <TrendingUp className="h-4 w-4 text-emerald-500 opacity-70" />
          )}
        </div>
        <p className="text-xs text-muted-foreground font-medium leading-relaxed">{subtitle}</p>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

function EmptyState({ icon: Icon, title, description }: any) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground bg-gradient-to-br from-muted/20 to-muted/5 rounded-2xl border-2 border-dashed border-border/50">
      <div className="p-5 bg-gradient-to-br from-background to-muted/30 rounded-2xl mb-4 shadow-sm">
        <Icon className="h-10 w-10 opacity-40" />
      </div>
      <p className="font-semibold text-foreground text-base">{title}</p>
      <p className="text-sm max-w-[280px] mx-auto mt-2 leading-relaxed">{description}</p>
    </div>
  );
}

function getStatusIcon(status: string) {
  switch (status) {
    case "COMPLETED": return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
    case "IN_PROGRESS": return <Timer className="h-5 w-5 text-blue-600" />;
    case "PENDING": return <Clock className="h-5 w-5 text-amber-600" />;
    case "CANCELLED": return <AlertTriangle className="h-5 w-5 text-red-600" />;
    default: return <Activity className="h-5 w-5 text-muted-foreground" />;
  }
}

function getStatusColorText(status: string) {
  switch (status) {
    case "COMPLETED": return "text-emerald-700 dark:text-emerald-400";
    case "IN_PROGRESS": return "text-blue-700 dark:text-blue-400";
    case "PENDING": return "text-amber-700 dark:text-amber-400";
    case "CANCELLED": return "text-red-700 dark:text-red-400";
    default: return "text-muted-foreground";
  }
}

function getStatusColorBg(status: string) {
  switch (status) {
    case "COMPLETED": return "bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/30 dark:to-emerald-900/20";
    case "IN_PROGRESS": return "bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-900/20";
    case "PENDING": return "bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-900/20";
    case "CANCELLED": return "bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-900/20";
    default: return "bg-muted";
  }
}
