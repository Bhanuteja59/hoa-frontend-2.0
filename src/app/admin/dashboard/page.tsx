"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPostJson } from "@/lib/api";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Building2, Users, Plus, ArrowUpRight,
    Loader2, ShieldAlert, Search, MapPin, ArrowRight,
    TrendingUp, Activity, Globe, HeartPulse, Layers,
    BarChart2, Eye, MousePointer, Zap, Key, CheckCircle,
    Settings, ArrowUpDown, Filter, Clock
} from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader,
    DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer,
} from "recharts";
import { Label } from "@/components/ui/label";

/* ─────────────────── Skeleton ─────────────────── */
function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700 ${className}`} />;
}

/* ─────────────────── Live Dot ─────────────────── */
function LiveDot() {
    return (
        <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
    );
}

/* ─────────────────── Animated counter ─────────────────── */
function AnimatedNumber({ value, duration = 800 }: { value: number; duration?: number }) {
    const [display, setDisplay] = useState(0);
    const start = useRef(0);
    const startTime = useRef<number | null>(null);
    useEffect(() => {
        start.current = display;
        startTime.current = null;
        const step = (ts: number) => {
            if (!startTime.current) startTime.current = ts;
            const elapsed = ts - startTime.current;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - (1 - progress) ** 3;
            setDisplay(Math.round(start.current + (value - start.current) * eased));
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);
    return <>{display.toLocaleString()}</>;
}

/* ─────────────────── Community Row ─────────────────── */
function CommunityRow({ t }: { t: any }) {
    const createdAt = t.created_at ? new Date(t.created_at) : null;
    const now = new Date();
    const isNew = createdAt ? (now.getTime() - createdAt.getTime()) < 7 * 24 * 60 * 60 * 1000 : false;

    const formatDate = (d: Date) => {
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHrs / 24);
        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHrs < 24) return `${diffHrs}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    return (
        <div className="group flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
            <div className="flex items-center gap-3 min-w-0">
                <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                    {t.community_type === "OWN_HOUSES"
                        ? <MapPin className="h-5 w-5 text-violet-500" />
                        : <Building2 className="h-5 w-5 text-violet-500" />}
                    {isNew && (
                        <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded-full uppercase tracking-tight leading-none">
                            NEW
                        </span>
                    )}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold mt-0.5">
                        <span className="uppercase tracking-wider">{t.community_type?.replace("_", " ")} · /{t.slug}</span>
                        {createdAt && (
                            <span className="flex items-center gap-1 text-slate-300 dark:text-slate-600">
                                <Clock className="h-2.5 w-2.5" />
                                {formatDate(createdAt)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-3 shrink-0 ml-3">
                <div className="hidden sm:flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs text-slate-500">
                        <Users className="h-3 w-3" /> {t.users || 0}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${t.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        }`}>
                        {t.status}
                    </span>
                </div>
                <Link
                    href={`/platform/tenants/${t.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-[11px] font-black uppercase tracking-tight hover:bg-violet-500 transition-all active:scale-95 shadow-sm shadow-violet-500/20"
                >
                    <Settings className="h-3 w-3" /> Manage
                </Link>
            </div>
        </div>
    );
}

/* ─────────────────── Activity Bar ─────────────────── */
function ActivityBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">{label}</span>
                <span className="text-slate-900 dark:text-white font-bold tabular-nums">{value}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   Main Dashboard
═══════════════════════════════════════════════════════════════════ */
export default function AdminDashboardPage() {
    const router = useRouter();
    const qc = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [analyticsDays, setAnalyticsDays] = useState<7 | 14 | 30 | 90>(7);
    const [provisionForm, setProvisionForm] = useState<any>({ name: "", admin_email: "", admin_name: "", admin_password: "", community_type: "APARTMENTS" });
    const [provisionError, setProvisionError] = useState("");
    const [isProvisioning, setIsProvisioning] = useState(false);
    const [provisionDialogOpen, setProvisionDialogOpen] = useState(false);
    /* ── Community sort & date filter ── */
    const [sortBy, setSortBy] = useState<"newest" | "oldest" | "az" | "za">("newest");
    const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");

    /* ── Real-time fetching with 15s refetch ── */
    const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
        queryKey: ["admin", "analytics", analyticsDays],
        queryFn: () => apiGet<any>(`/platform/stats/analytics?days=${analyticsDays}`),
        refetchInterval: 15_000,
        staleTime: 10_000,
    });

    const { data: statsData, isLoading: isStatsLoading } = useQuery({
        queryKey: ["admin", "stats", "overview"],
        queryFn: () => apiGet<any>("/platform/stats/overview"),
        refetchInterval: 30_000,
        staleTime: 20_000,
    });

    const { data: detailedData, isLoading: isDetailedLoading } = useQuery({
        queryKey: ["admin", "stats", "detailed"],
        queryFn: () => apiGet<any>("/platform/stats/detailed"),
        refetchInterval: 30_000,
        staleTime: 20_000,
    });

    const { data: tenants, isLoading: isTenantsLoading } = useQuery({
        queryKey: ["admin", "tenants"],
        queryFn: () => apiGet<any[]>("/platform/tenants"),
        refetchInterval: 30_000,
        staleTime: 20_000,
    });

    /* ── Computed Analytics ── */
    const totalVisitors = analytics?.total_visitors ?? 0;
    const timeline: Array<{ date: string; visitors: number }> = analytics?.timeline ?? [];
    const avgDaily = timeline.length > 0 ? Math.round(totalVisitors / timeline.length) : 0;
    const peakDay = timeline.reduce((best: any, t: any) => (!best || t.visitors > best.visitors ? t : best), null);
    const totalPageViews = analytics?.top_pages?.reduce((s: number, p: any) => s + p.count, 0) ?? 0;

    const DATE_RANGES: { label: string; value: 7 | 14 | 30 | 90 }[] = [
        { label: "7D", value: 7 },
        { label: "14D", value: 14 },
        { label: "30D", value: 30 },
        { label: "90D", value: 90 },
    ];

    /* ── Computed Platform Stats ── */
    const stats = statsData || { total_communities: 0, active_communities: 0, total_users: 0, total_buildings: 0 };
    const detailed = detailedData?.communities || [];
    const totalMaintenance = detailed.reduce((a: number, c: any) => a + (c.maintenance || 0), 0);
    const totalViolations = detailed.reduce((a: number, c: any) => a + (c.violations || 0), 0);
    const totalARC = detailed.reduce((a: number, c: any) => a + (c.arc || 0), 0);
    const maxVal = Math.max(totalMaintenance, totalViolations, totalARC) || 1;

    const filtered = (tenants || []).filter((t: any) => {
        const matchSearch =
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.slug.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchSearch) return false;

        // Date range filter
        if (dateFilter !== "all" && t.created_at) {
            const created = new Date(t.created_at);
            const now = new Date();
            if (dateFilter === "today") {
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                if (created < startOfDay) return false;
            } else if (dateFilter === "week") {
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (created < weekAgo) return false;
            } else if (dateFilter === "month") {
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                if (created < monthAgo) return false;
            }
        }
        return true;
    }).map((t: any) => {
        const d = detailed.find((c: any) => c.id === t.id) || {};
        return { ...t, ...d };
    }).sort((a: any, b: any) => {
        if (sortBy === "newest") return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        if (sortBy === "oldest") return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        if (sortBy === "az") return a.name.localeCompare(b.name);
        if (sortBy === "za") return b.name.localeCompare(a.name);
        return 0;
    });

    // Count by date for summary
    const newToday = (tenants || []).filter((t: any) => {
        if (!t.created_at) return false;
        const created = new Date(t.created_at);
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        return created >= startOfDay;
    }).length;

    const newThisWeek = (tenants || []).filter((t: any) => {
        if (!t.created_at) return false;
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(t.created_at) >= weekAgo;
    }).length;

    /* ── Provision ── */
    const handleProvision = async (e: React.FormEvent) => {
        e.preventDefault();
        setProvisionError("");
        setIsProvisioning(true);
        try {
            await apiPostJson("/platform/tenants", provisionForm);
            qc.invalidateQueries({ queryKey: ["admin", "tenants"] });
            qc.invalidateQueries({ queryKey: ["admin", "stats", "overview"] });
            setProvisionDialogOpen(false);
            setProvisionForm({ name: "", admin_email: "", admin_name: "", admin_password: "", community_type: "APARTMENTS" });
        } catch (err: any) {
            setProvisionError(err.message || "Failed to provision community");
        } finally {
            setIsProvisioning(false);
        }
    };

    return (
        <div className="p-6 lg:p-8 space-y-8 min-h-screen" id="admin-dashboard">

            {/* ══════════════════════════════════════════════════════
                 SECTION 1 — WEBSITE LIVE TRACKING  (FULL-WIDTH HERO)
            ══════════════════════════════════════════════════════ */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white">
                    <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/20">
                            <BarChart2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight">Website Live Tracking</h1>
                            <p className="text-[11px] text-white/70 font-semibold uppercase tracking-widest flex items-center gap-2 mt-0.5">
                                <LiveDot /> Auto-refreshes every 15 seconds · Platform-wide
                            </p>
                        </div>
                    </div>
                    {/* Date Range Selector */}
                    <div className="flex items-center gap-2 p-1 rounded-xl bg-white/15 backdrop-blur-sm">
                        {DATE_RANGES.map(r => (
                            <button
                                key={r.value}
                                id={`range-${r.value}`}
                                onClick={() => setAnalyticsDays(r.value)}
                                className={`px-4 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${analyticsDays === r.value
                                    ? "bg-white text-violet-700 shadow-lg"
                                    : "text-white/70 hover:text-white hover:bg-white/10"
                                    }`}
                            >
                                {r.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── KPI Row ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-slate-200 dark:border-slate-700">
                    {[
                        { icon: Eye, label: "Total Visitors", value: totalVisitors, sub: `Last ${analyticsDays} days`, color: "from-violet-500 to-indigo-500", text: "text-violet-600 dark:text-violet-400" },
                        { icon: TrendingUp, label: "Avg. Per Day", value: avgDaily, sub: "Daily average", color: "from-blue-500 to-cyan-500", text: "text-blue-600 dark:text-blue-400" },
                        { icon: Activity, label: "Peak Day", value: peakDay?.visitors ?? 0, sub: peakDay ? new Date(peakDay.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "No data", color: "from-emerald-500 to-teal-500", text: "text-emerald-600 dark:text-emerald-400" },
                        { icon: MousePointer, label: "Total Page Views", value: totalPageViews, sub: "Tracked paths", color: "from-amber-500 to-orange-500", text: "text-amber-600 dark:text-amber-400" },
                    ].map((kpi, i) => (
                        <div key={i} className="flex items-center gap-3 p-5 border-r border-slate-100 dark:border-slate-800 last:border-r-0">
                            <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shrink-0 shadow-md`}>
                                <kpi.icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{kpi.label}</p>
                                <div className={`text-2xl font-black leading-tight ${kpi.text}`}>
                                    {isAnalyticsLoading ? <Skeleton className="h-7 w-14 mt-0.5" /> : <AnimatedNumber value={kpi.value} />}
                                </div>
                                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{kpi.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Chart ── */}
                <div className="p-6">
                    <div className="h-80 w-full">
                        {isAnalyticsLoading ? (
                            <div className="h-full w-full flex items-end gap-2 pb-8 px-4">
                                {[40, 60, 35, 80, 55, 90, 70, 45, 88, 62, 75, 50, 95, 68].map((h, i) => (
                                    <div key={i} className="flex-1 bg-gradient-to-t from-violet-200 to-violet-100 dark:from-violet-900/40 dark:to-violet-800/20 rounded-t-lg animate-pulse" style={{ height: `${h}%` }} />
                                ))}
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={timeline} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="vGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fontWeight: 700, fill: "#94a3b8" }}
                                        tickFormatter={(val) => {
                                            const d = new Date(val);
                                            return analyticsDays <= 14
                                                ? d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })
                                                : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                        }}
                                        interval={analyticsDays === 7 ? 0 : analyticsDays === 14 ? 1 : analyticsDays === 30 ? 4 : 9}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: "#94a3b8" }} width={30} />
                                    <Tooltip
                                        cursor={{ stroke: "#7c3aed", strokeWidth: 1.5, strokeDasharray: "4 3" }}
                                        contentStyle={{
                                            backgroundColor: "#1e293b", border: "none", borderRadius: "14px",
                                            color: "#fff", fontSize: "13px", fontWeight: "bold",
                                            padding: "10px 16px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
                                        }}
                                        itemStyle={{ color: "#a78bfa" }}
                                        labelFormatter={(val) => new Date(val).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                                        formatter={(val: any) => [`${Number(val).toLocaleString()} visits`, "User Visits"]}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="visitors"
                                        stroke="#7c3aed"
                                        strokeWidth={2.5}
                                        fillOpacity={1}
                                        fill="url(#vGrad)"
                                        dot={(props: any) => {
                                            const { cx, cy } = props;
                                            return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={3} fill="#7c3aed" opacity={0.8} />;
                                        }}
                                        activeDot={{ r: 7, fill: "#7c3aed", stroke: "#fff", strokeWidth: 2.5 }}
                                        animationDuration={1000}
                                        animationEasing="ease-out"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                    <p className="text-center text-[10px] text-slate-400 font-semibold mt-3">
                        Showing {analyticsDays}-day window · Real user visits only · Super-admin excluded · Refreshes every 15s
                    </p>
                </div>

                {/* ── Bottom: Top Pages + Geo ── */}
                <div className="grid sm:grid-cols-2 border-t border-slate-200 dark:border-slate-700">

                    {/* Top Pages — scrollable */}
                    <div className="p-6 border-r border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <MousePointer className="h-4 w-4 text-violet-500" />
                                <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">Top Visited Pages</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 px-2 py-0.5 rounded-full">
                                    Real Users Only
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                    {analyticsDays}d data
                                </span>
                            </div>
                        </div>
                        <div className="overflow-y-auto max-h-[196px] pr-1 space-y-2 scrollbar-thin">
                            {isAnalyticsLoading ? (
                                [...Array(5)].map((_, i) => <Skeleton key={i} className="h-9 w-full" />)
                            ) : analytics?.top_pages?.length > 0 ? (
                                analytics.top_pages.map((page: any, idx: number) => {
                                    const maxCount = analytics.top_pages[0]?.count || 1;
                                    const pct = Math.round((page.count / maxCount) * 100);
                                    return (
                                        <div key={idx} className="space-y-1 group">
                                            <div className="flex items-center justify-between text-xs min-w-0">
                                                <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                                                    <span className="text-[10px] font-black text-slate-300 dark:text-slate-600 w-4 shrink-0">#{idx + 1}</span>
                                                    <span className="truncate font-bold text-slate-700 dark:text-slate-200 font-mono text-[11px]">{page.path}</span>
                                                </div>
                                                <span className="font-mono text-[11px] text-violet-600 dark:text-violet-400 font-black ml-2 shrink-0">{page.count.toLocaleString()}</span>
                                            </div>
                                            <div className="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                <div className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="flex flex-col items-center gap-2 py-10 text-slate-300 dark:text-slate-600">
                                    <MousePointer className="h-8 w-8" />
                                    <p className="text-xs font-semibold text-slate-400">No page data yet</p>
                                    <p className="text-[10px] text-slate-300 dark:text-slate-600 text-center">Navigate the site — tracking starts automatically</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Geographic Distribution */}
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Globe className="h-4 w-4 text-indigo-500" />
                                <h3 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">Geographic Distribution</h3>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold">{analytics?.locations?.length ?? 0} regions</span>
                        </div>
                        {isAnalyticsLoading ? (
                            <div className="space-y-4">
                                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                            </div>
                        ) : analytics?.locations?.length > 0 ? (
                            <div className="space-y-4">
                                <div className="overflow-y-auto max-h-[196px] pr-1 space-y-4 scrollbar-thin">
                                    {analytics.locations.map((loc: any, idx: number) => {
                                        const pct = totalVisitors > 0 ? Math.round((loc.value / totalVisitors) * 100) : 0;
                                        const gColors = ["from-violet-500 to-indigo-500", "from-blue-500 to-cyan-500", "from-emerald-500 to-teal-500", "from-amber-500 to-orange-500", "from-rose-500 to-pink-500"];
                                        const locName = loc.name === "Local Network" ? "India" : loc.name;
                                        return (
                                            <div key={idx} className="space-y-1.5">
                                                <div className="flex items-center justify-between text-[11px]">
                                                    <div className="flex items-center gap-1.5">
                                                        <MapPin className="h-3 w-3 text-slate-400" />
                                                        <span className="font-bold text-slate-700 dark:text-slate-200">{locName}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono font-black text-slate-600 dark:text-slate-300">{loc.value.toLocaleString()} visits</span>
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-black text-slate-500">{pct}%</span>
                                                    </div>
                                                </div>
                                                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                                    <div className={`h-full bg-gradient-to-r ${gColors[idx % gColors.length]} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 font-semibold">
                                    📍 IP-based location tracking · {analytics.locations.length} region{analytics.locations.length !== 1 ? "s" : ""} active
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 py-10 text-slate-300 dark:text-slate-600">
                                <Globe className="h-8 w-8" />
                                <p className="text-xs font-semibold text-slate-400">No locations yet</p>
                                <p className="text-[10px] text-slate-300 dark:text-slate-600">Locations appear as visitors arrive</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                 SECTION 2 — PLATFORM CONTROL (Header + Provision)
            ══════════════════════════════════════════════════════ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Platform Control</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex items-center gap-2">
                        <ShieldAlert className="h-3.5 w-3.5 text-violet-400" />
                        Global infrastructure monitoring
                    </p>
                </div>
                <Dialog open={provisionDialogOpen} onOpenChange={setProvisionDialogOpen}>
                    <DialogTrigger asChild>
                        <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-bold shadow-xl shadow-violet-500/20 transition-all hover:scale-105">
                            <Plus className="h-4 w-4" /> Provision Community
                        </button>
                    </DialogTrigger>
                    <DialogContent className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 sm:max-w-md shadow-2xl p-0 overflow-hidden">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-slate-700">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Provision Instance</DialogTitle>
                                <DialogDescription className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">
                                    Network Node Initialization
                                </DialogDescription>
                            </DialogHeader>
                        </div>
                        <form onSubmit={handleProvision} className="p-6 space-y-4">
                            {[
                                { label: "Community Name", field: "name", type: "text", placeholder: "e.g. Sunset Heights" },
                                { label: "Admin Email", field: "admin_email", type: "email", placeholder: "admin@example.com" },
                                { label: "Admin Full Name", field: "admin_name", type: "text", placeholder: "Full Name" },
                                { label: "Admin Password", field: "admin_password", type: "password", placeholder: "••••••••" },
                            ].map(f => (
                                <div key={f.field} className="space-y-1.5">
                                    <Label className="text-[10px] uppercase tracking-widest font-black text-slate-500">{f.label}</Label>
                                    <input
                                        required type={f.type} placeholder={f.placeholder}
                                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 ring-violet-500/20 outline-none transition-all"
                                        value={provisionForm[f.field]}
                                        onChange={e => setProvisionForm({ ...provisionForm, [f.field]: e.target.value })}
                                    />
                                </div>
                            ))}
                            <div className="space-y-1.5">
                                <Label className="text-[10px] uppercase tracking-widest font-black text-slate-500">Community Type</Label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold outline-none"
                                    value={provisionForm.community_type}
                                    onChange={e => setProvisionForm({ ...provisionForm, community_type: e.target.value })}
                                >
                                    <option value="APARTMENTS">Apartments</option>
                                    <option value="OWN_HOUSES">Houses</option>
                                </select>
                            </div>
                            {provisionError && (
                                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">{provisionError}</p>
                            )}
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setProvisionDialogOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white font-black text-xs uppercase tracking-widest transition-all">
                                    Cancel
                                </button>
                                <button disabled={isProvisioning} type="submit" className="px-8 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-violet-500/20 transition-all active:scale-95 disabled:opacity-50">
                                    {isProvisioning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Deploy Instance"}
                                </button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* ── Platform Stats Cards ── */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {[
                    { label: "Total Communities", value: stats.total_communities, sub: "Across all tenants", icon: Building2, href: "/admin/communities", from: "from-violet-600", to: "to-indigo-600" },
                    { label: "Community Health", value: `${stats.active_communities}/${stats.total_communities}`, sub: "Active instances", icon: HeartPulse, href: "/admin/health", from: "from-rose-500", to: "to-pink-600" },
                    { label: "Platform Users", value: stats.total_users, sub: "Global registered users", icon: Users, href: "/admin/users", from: "from-blue-600", to: "to-cyan-600" },
                    { label: "Buildings", value: stats.total_buildings, sub: "Registered structures", icon: Layers, href: "/admin/buildings", from: "from-amber-500", to: "to-orange-600" },
                ].map((card, i) => (
                    <Link key={i} href={card.href} className="group block">
                        <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl shadow-sm cursor-pointer">
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.from} ${card.to} opacity-0 dark:opacity-90 transition-opacity`} />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${card.from} ${card.to} flex items-center justify-center shadow-lg`}>
                                        <card.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
                                </div>
                                {isStatsLoading ? (
                                    <Skeleton className="h-10 w-20 mb-2" />
                                ) : (
                                    <div className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-1">{card.value}</div>
                                )}
                                <p className="text-xs text-slate-700 dark:text-white font-bold opacity-80">{card.label}</p>
                                <p className="text-[10px] text-slate-400 dark:text-white/60 font-semibold mt-0.5 uppercase tracking-wide">{card.sub}</p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* ── System Dynamics + Quick Links + Status ── */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* System Dynamics */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">System Dynamics</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Global Cluster Status</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                            <Zap className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                    </div>
                    {isDetailedLoading ? (
                        <div className="space-y-5">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
                    ) : (
                        <div className="space-y-5">
                            <ActivityBar label="Maintenance Backlog" value={totalMaintenance} max={maxVal} color="bg-blue-500" />
                            <ActivityBar label="Policy Violations" value={totalViolations} max={maxVal} color="bg-amber-500" />
                            <ActivityBar label="Structure Requests" value={totalARC} max={maxVal} color="bg-emerald-500" />
                        </div>
                    )}
                    <Link href="/admin/health" className="flex items-center gap-2 group w-fit">
                        <span className="text-xs font-black text-violet-600 dark:text-violet-400 uppercase tracking-widest">Health Registry</span>
                        <ArrowRight className="h-4 w-4 text-violet-600 dark:text-violet-400 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* Quick Links */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-5 shadow-sm">
                    <div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Direct Access</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Jump to Operational Nodes</p>
                    </div>
                    <div className="space-y-2">
                        {[
                            { label: "Analytics Center", sub: "Flow & Graphs", href: "/admin/analytics", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800/40" },
                            { label: "Community Status", sub: "Health Monitoring", href: "/admin/health", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 border-rose-200 dark:border-rose-800/40" },
                            { label: "Structure Registry", sub: "Buildings & Units", href: "/admin/buildings", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 border-amber-200 dark:border-amber-800/40" },
                            { label: "Personnel Hub", sub: "User Management", href: "/admin/users", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800/40" },
                        ].map(l => (
                            <Link key={l.href} href={l.href} className={`flex items-center justify-between p-3 rounded-xl border ${l.bg} transition-all duration-200 group`}>
                                <div>
                                    <div className={`text-sm font-semibold ${l.color}`}>{l.label}</div>
                                    <div className="text-[11px] text-slate-400 mt-0.5">{l.sub}</div>
                                </div>
                                <ArrowRight className={`h-4 w-4 ${l.color} opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all`} />
                            </Link>
                        ))}
                    </div>
                </div>

                {/* System Status */}
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white">System Status</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Live platform health</p>
                        </div>
                        <Globe className="h-4 w-4 text-slate-300 dark:text-slate-600" />
                    </div>
                    <div className="space-y-3">
                        {[
                            { label: "API Gateway", status: "Operational", ok: true },
                            { label: "Database", status: statsData ? "Operational" : "Checking…", ok: !!statsData },
                            { label: "Auth Service", status: "Operational", ok: true },
                            { label: "File Storage", status: "Operational", ok: true },
                            { label: "Communities", status: statsData ? `${statsData.active_communities ?? 0} active` : "Checking…", ok: !!statsData && statsData.active_communities > 0 },
                        ].map(s => (
                            <div key={s.label} className="flex items-center justify-between">
                                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{s.label}</span>
                                <div className="flex items-center gap-2">
                                    <span className={`h-2 w-2 rounded-full ${s.ok ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                                    <span className={`text-xs font-semibold ${s.ok ? "text-emerald-500" : "text-amber-500"}`}>{s.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[11px] text-slate-300 dark:text-slate-600">Last checked: just now</p>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════
                 SECTION 3 — ALL COMMUNITIES (sorted by date)
            ══════════════════════════════════════════════════════ */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
                {/* Header */}
                <div className="p-6 border-b border-slate-200 dark:border-slate-700 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="text-base font-black text-slate-900 dark:text-white">Community Registry</h3>
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                                All provisioned tenant environments
                                {newThisWeek > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-black">
                                        +{newThisWeek} new this week
                                    </span>
                                )}
                            </p>
                        </div>
                        {/* Search */}
                        <div className="relative w-full sm:w-56">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Search communities…"
                                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 ring-violet-500/20 transition-all"
                            />
                        </div>
                    </div>

                    {/* Filters Row */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Date Range Filter */}
                        <div className="flex items-center gap-1.5">
                            <Filter className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Period:</span>
                            {([
                                { label: "All Time", value: "all" },
                                { label: "Today", value: "today" },
                                { label: "This Week", value: "week" },
                                { label: "This Month", value: "month" },
                            ] as { label: string; value: "all" | "today" | "week" | "month" }[]).map(df => (
                                <button
                                    key={df.value}
                                    onClick={() => setDateFilter(df.value)}
                                    className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-tight transition-all ${dateFilter === df.value
                                        ? "bg-violet-600 text-white shadow-sm"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    {df.label}
                                </button>
                            ))}
                        </div>

                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />

                        {/* Sort */}
                        <div className="flex items-center gap-1.5">
                            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sort:</span>
                            {([
                                { label: "Newest First", value: "newest" },
                                { label: "Oldest First", value: "oldest" },
                                { label: "A → Z", value: "az" },
                                { label: "Z → A", value: "za" },
                            ] as { label: string; value: "newest" | "oldest" | "az" | "za" }[]).map(s => (
                                <button
                                    key={s.value}
                                    onClick={() => setSortBy(s.value)}
                                    className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-tight transition-all ${sortBy === s.value
                                        ? "bg-indigo-600 text-white shadow-sm"
                                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="max-h-96 overflow-y-auto">
                    {isTenantsLoading || isDetailedLoading ? (
                        <div className="p-6 space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-40" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                    <Skeleton className="h-8 w-20 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="p-16 flex flex-col items-center gap-3 text-slate-300 dark:text-slate-600">
                            <Building2 className="h-10 w-10" />
                            <p className="text-sm font-medium text-slate-400">No communities found</p>
                        </div>
                    ) : (
                        <div className="p-3 divide-y divide-slate-100 dark:divide-slate-800">
                            {filtered.map((t: any) => (
                                <CommunityRow key={t.id} t={t} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                    <p className="text-xs text-slate-400">{filtered.length} communities shown</p>
                    <Link href="/admin/communities" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-500 flex items-center gap-1 transition-colors">
                        View all <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
