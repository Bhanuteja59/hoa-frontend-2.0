"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import { Loader2, HeartPulse, Search, Building2, MapPin, Users, Wrench, AlertTriangle, FileCheck, Database, ArrowLeft, ArrowRight, Hash } from "lucide-react";

function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-xl admin-surface-2 ${className}`} />;
}

function StatPill({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
    return (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl admin-glass border admin-border`}>
            <Icon className={`h-3.5 w-3.5 ${color} shrink-0`} />
            <div>
                <div className="text-xs font-black admin-text opacity-90">{value}</div>
                <div className="text-[10px] admin-muted opacity-60">{label}</div>
            </div>
        </div>
    );
}

export default function CommunityHealthPage() {
    const [search, setSearch] = useState("");

    const { data: detailedStats, isLoading } = useQuery({
        queryKey: ["admin", "stats", "detailed"],
        queryFn: () => apiGet<any>("/admin/stats/detailed"),
        staleTime: 30_000,
    });

    const communities: any[] = detailedStats?.communities || [];
    const filtered = communities.filter(t =>
        t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.slug?.toLowerCase().includes(search.toLowerCase())
    );

    const totalUsers = communities.reduce((s, t) => s + (t.users || 0), 0);
    const totalMaintenance = communities.reduce((s, t) => s + (t.maintenance || 0), 0);
    const totalViolations = communities.reduce((s, t) => s + (t.violations || 0), 0);
    const totalARC = communities.reduce((s, t) => s + (t.arc || 0), 0);

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
                        <h1 className="text-3xl font-black admin-text tracking-tight">Community Health</h1>
                        <p className="admin-muted text-sm mt-1 flex items-center gap-2">
                            <HeartPulse className="h-3.5 w-3.5 text-rose-400" />
                            Infrastructure, storage & activity per community
                        </p>
                    </div>
                    {/* Summary pills */}
                    <div className="flex flex-wrap gap-2">
                        <StatPill icon={Users} label="Users" value={totalUsers} color="text-blue-400" />
                        <StatPill icon={Wrench} label="Maintenance" value={totalMaintenance} color="text-cyan-400" />
                        <StatPill icon={AlertTriangle} label="Violations" value={totalViolations} color="text-amber-400" />
                        <StatPill icon={FileCheck} label="ARC Req." value={totalARC} color="text-emerald-400" />
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 admin-muted pointer-events-none" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search communities…"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl admin-input"
                />
            </div>

            {/* Table Card */}
            <div className="rounded-2xl border admin-border admin-glass overflow-hidden">
                <div className="p-5 border-b admin-border">
                    <h3 className="text-sm font-bold admin-text">Health Datagrid</h3>
                    <p className="text-xs admin-muted mt-0.5">Real-time metrics per tenant</p>
                </div>

                {isLoading ? (
                    <div className="p-2 admin-divide">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4">
                                <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-8 w-16" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-20 flex flex-col items-center gap-3 admin-muted">
                        <Database className="h-12 w-12 opacity-20" />
                        <p className="text-sm font-medium">No communities found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b admin-border text-[11px] uppercase tracking-widest admin-muted font-bold">
                                    <th className="px-5 py-3 text-left">Community</th>
                                    <th className="px-5 py-3 text-center">Status</th>
                                    <th className="px-5 py-3 text-center">Residents</th>
                                    <th className="px-5 py-3 text-center">Maintenance</th>
                                    <th className="px-5 py-3 text-center">Violations</th>
                                    <th className="px-5 py-3 text-center">ARC</th>
                                    <th className="px-5 py-3 text-center">Storage</th>
                                    <th className="px-5 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="admin-divide">
                                {filtered.map((t, i) => (
                                    <tr key={t.id} className="group hover:admin-surface-2 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border admin-border flex items-center justify-center shrink-0">
                                                    {t.community_type === "OWN_HOUSES" ? <MapPin className="h-4 w-4 text-violet-400" /> : <Building2 className="h-4 w-4 text-violet-400" />}
                                                </div>
                                                <div>
                                                    <div className="font-semibold admin-text">{t.name}</div>
                                                    <div className="text-[10px] font-mono admin-muted flex items-center gap-1 mt-0.5 opacity-60"><Hash className="h-2.5 w-2.5" />{t.slug}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full ${t.status === "ACTIVE" ? "bg-emerald-500/15 text-emerald-500" : "bg-amber-500/15 text-amber-500"}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${t.status === "ACTIVE" ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5 admin-text font-bold">
                                                <Users className="h-3.5 w-3.5 text-blue-400" />{t.users || 0}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5 admin-text font-bold">
                                                <Wrench className="h-3.5 w-3.5 text-cyan-400" />{t.maintenance || 0}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5 admin-text font-bold">
                                                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />{t.violations || 0}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5 admin-text font-bold">
                                                <FileCheck className="h-3.5 w-3.5 text-emerald-400" />{t.arc || 0}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5 text-emerald-500 font-bold text-xs">
                                                <Database className="h-3.5 w-3.5" />{t.storage_mb || "0.0"} MB
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <Link href={`/admin/communities`}>
                                                <button className="text-xs px-3 py-1.5 rounded-lg admin-surface-btn admin-muted hover:admin-text transition-all">
                                                    Inspect
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
