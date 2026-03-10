"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import { Loader2, TrendingUp, Activity, Wrench, AlertTriangle, FileCheck, Users, Calendar, RefreshCw, ArrowLeft, BarChart2 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend, Bar, BarChart } from "recharts";

function isoDateStr(d: Date) { return d.toISOString().slice(0, 10); }

const PRESETS = [
    { label: "7D", days: 7, granularity: "day" },
    { label: "30D", days: 30, granularity: "day" },
    { label: "90D", days: 90, granularity: "week" },
    { label: "6M", days: 180, granularity: "month" },
    { label: "1Y", days: 365, granularity: "month" },
] as const;

const SERIES = [
    { key: "newUsers", name: "New Users", color: "#a78bfa" },
    { key: "workOrders", name: "Work Orders", color: "#60a5fa" },
    { key: "violations", name: "Violations", color: "#fbbf24" },
    { key: "arcRequests", name: "ARC Requests", color: "#34d399" },
];

const CUSTOM_TOOLTIP = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="admin-glass border admin-border rounded-xl p-4 shadow-2xl backdrop-blur-xl">
            <p className="text-xs font-bold admin-muted mb-2">{label}</p>
            {payload.map((p: any) => (
                <div key={p.dataKey} className="flex items-center justify-between gap-6 text-xs">
                    <span className="flex items-center gap-1.5 admin-muted">
                        <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
                        {p.name}
                    </span>
                    <span className="font-bold admin-text">{p.value}</span>
                </div>
            ))}
        </div>
    );
};

export default function FlowAnalyticsPage() {
    const today = new Date();
    const [startDate, setStartDate] = useState(isoDateStr(new Date(today.getTime() - 29 * 86400_000)));
    const [endDate, setEndDate] = useState(isoDateStr(today));
    const [granularity, setGranularity] = useState<"day" | "week" | "month">("day");
    const [activePreset, setActivePreset] = useState("30D");
    const [showBar, setShowBar] = useState(false);

    const { data, isLoading, isFetching, refetch } = useQuery({
        queryKey: ["admin", "timeline", startDate, endDate, granularity],
        queryFn: () => apiGet<any>(`/admin/stats/timeline?start_date=${startDate}&end_date=${endDate}&granularity=${granularity}`),
        staleTime: 30_000,
    });

    const timeline: any[] = data?.timeline ?? [];
    const totals = timeline.reduce(
        (acc, d) => ({
            workOrders: acc.workOrders + (d.workOrders || 0),
            violations: acc.violations + (d.violations || 0),
            arcRequests: acc.arcRequests + (d.arcRequests || 0),
            newUsers: acc.newUsers + (d.newUsers || 0)
        }),
        { workOrders: 0, violations: 0, arcRequests: 0, newUsers: 0 }
    );

    const applyPreset = (days: number, gran: string, label: string) => {
        const end = new Date();
        const start = new Date(end.getTime() - (days - 1) * 86400_000);
        setStartDate(isoDateStr(start));
        setEndDate(isoDateStr(end));
        setGranularity(gran as any);
        setActivePreset(label);
    };

    const STAT_BLOCKS = [
        { label: "New Users", value: totals.newUsers, icon: Users, color: "text-violet-400", bg: "from-violet-600/10 to-purple-900/10" },
        { label: "Work Orders", value: totals.workOrders, icon: Wrench, color: "text-blue-400", bg: "from-blue-600/10 to-indigo-900/10" },
        { label: "Violations", value: totals.violations, icon: AlertTriangle, color: "text-amber-400", bg: "from-amber-600/10 to-orange-900/10" },
        { label: "ARC Requests", value: totals.arcRequests, icon: FileCheck, color: "text-emerald-400", bg: "from-emerald-600/10 to-teal-900/10" },
    ];

    return (
        <div className="p-6 lg:p-8 space-y-8 min-h-screen">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link href="/admin/dashboard">
                    <button className="flex items-center gap-2 text-xs admin-muted hover:admin-text transition-colors">
                        <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
                    </button>
                </Link>
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black admin-text tracking-tight">Flow Analytics</h1>
                        <p className="admin-muted text-sm mt-1 flex items-center gap-2">
                            <TrendingUp className="h-3.5 w-3.5 text-violet-400" />
                            Real-time platform dynamics analysis
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 p-1 rounded-xl admin-surface-2 border admin-border">
                        {PRESETS.map(p => (
                            <button
                                key={p.label}
                                onClick={() => applyPreset(p.days, p.granularity, p.label)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activePreset === p.label
                                    ? "bg-violet-600 text-white shadow-lg shadow-violet-500/20"
                                    : "admin-muted hover:admin-text hover:admin-surface-2"
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-between gap-6 p-6 rounded-2xl border admin-border admin-glass">
                <div className="flex flex-wrap items-center gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-black admin-muted ml-1">Range Start</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 admin-muted" />
                            <input
                                type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setActivePreset(""); }}
                                className="pl-9 pr-4 py-2 rounded-xl admin-input text-xs"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-black admin-muted ml-1">Range End</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 admin-muted" />
                            <input
                                type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setActivePreset(""); }}
                                className="pl-9 pr-4 py-2 rounded-xl admin-input text-xs"
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-widest font-black admin-muted ml-1">Granularity</label>
                        <select
                            value={granularity} onChange={e => { setGranularity(e.target.value as any); setActivePreset(""); }}
                            className="w-32 px-4 py-2 rounded-xl admin-input text-xs"
                        >
                            <option value="day">Daily</option>
                            <option value="week">Weekly</option>
                            <option value="month">Monthly</option>
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowBar(!showBar)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl admin-surface-btn admin-muted hover:admin-text transition-all text-xs font-bold"
                    >
                        {showBar ? <Activity className="h-3.5 w-3.5" /> : <BarChart2 className="h-3.5 w-3.5" />}
                        {showBar ? "Area Chart" : "Bar Chart"}
                    </button>
                    <button
                        onClick={() => refetch()}
                        className="h-9 w-9 flex items-center justify-center rounded-xl admin-surface-btn admin-muted hover:admin-text transition-all"
                    >
                        <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {/* Totals Blocks */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STAT_BLOCKS.map(s => {
                    const Icon = s.icon;
                    return (
                        <div key={s.label} className={`relative overflow-hidden rounded-2xl border admin-border bg-gradient-to-br ${s.bg} p-5`}>
                            <div className="relative z-10">
                                <Icon className={`h-5 w-5 ${s.color} mb-3`} />
                                <div className="text-2xl font-black admin-text">{isLoading ? "---" : s.value}</div>
                                <div className="text-[10px] uppercase tracking-widest font-bold admin-muted">{s.label}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Chart Area */}
            <div className="rounded-2xl border admin-border admin-glass p-6 min-h-[450px] relative">
                {(isLoading || isFetching) && !data && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center admin-glass rounded-2xl">
                        <Loader2 className="h-8 w-8 text-violet-500 animate-spin" />
                    </div>
                )}

                <div className="h-[400px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        {showBar ? (
                            <BarChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.1} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "var(--admin-muted)", fontSize: 10 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--admin-muted)", fontSize: 10 }} />
                                <Tooltip content={<CUSTOM_TOOLTIP />} />
                                <Legend wrapperStyle={{ paddingTop: 20, fontSize: 12, fontWeight: 600, color: "var(--admin-muted)" }} />
                                {SERIES.map(s => (
                                    <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} barSize={20} />
                                ))}
                            </BarChart>
                        ) : (
                            <AreaChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    {SERIES.map(s => (
                                        <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                                        </linearGradient>
                                    ))}
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.1} />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "var(--admin-muted)", fontSize: 10 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--admin-muted)", fontSize: 10 }} />
                                <Tooltip content={<CUSTOM_TOOLTIP />} />
                                <Legend wrapperStyle={{ paddingTop: 20, fontSize: 12, fontWeight: 600, color: "var(--admin-muted)" }} />
                                {SERIES.map(s => (
                                    <Area
                                        key={s.key} type="monotone" dataKey={s.key} name={s.name}
                                        stroke={s.color} strokeWidth={3} fill={`url(#grad-${s.key})`}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                ))}
                            </AreaChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
