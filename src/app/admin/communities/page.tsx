"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, MapPin, Search, ArrowLeft, CheckCircle, XCircle, Calendar, Hash, Users, Wrench, AlertTriangle, FileCheck, ArrowRight } from "lucide-react";

function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-xl admin-surface-2 ${className}`} />;
}

export default function AllCommunitiesPage() {
    const [search, setSearch] = useState("");
    const router = useRouter();

    const { data: tenants, isLoading } = useQuery({
        queryKey: ["admin", "tenants"],
        queryFn: () => apiGet<any[]>("/admin/tenants"),
        staleTime: 30_000,
    });

    const { data: detailedStats } = useQuery({
        queryKey: ["admin", "stats", "detailed"],
        queryFn: () => apiGet<any>("/admin/stats/detailed"),
        staleTime: 30_000,
    });

    const combined = (tenants || []).map((t: any) => {
        const detail = detailedStats?.communities?.find((c: any) => c.id === t.id) || {};
        return { ...t, ...detail };
    });

    const filtered = combined.filter((t: any) =>
        t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.slug?.toLowerCase().includes(search.toLowerCase())
    );

    const activeCount = combined.filter((t: any) => t.status === "ACTIVE").length;
    const inactiveCount = combined.length - activeCount;

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
                        <h1 className="text-3xl font-black admin-text tracking-tight">All Communities</h1>
                        <p className="admin-muted text-sm mt-1 flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-violet-400" />
                            Complete registry of tenant environments
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold">
                            <CheckCircle className="h-3.5 w-3.5" /> {activeCount} Active
                        </div>
                        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold">
                            <XCircle className="h-3.5 w-3.5" /> {inactiveCount} Inactive
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 admin-muted pointer-events-none" />
                <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or slug…"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl admin-input"
                />
            </div>

            {/* Grid */}
            {isLoading ? (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
                </div>
            ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map((t: any, i: number) => (
                        <div
                            key={t.id}
                            onClick={() => router.push(`/admin/tenants/${t.id}`)}
                            className="group relative rounded-2xl border admin-border admin-glass hover:admin-surface-2 overflow-hidden transition-all duration-300 hover:border-violet-500/20 hover:shadow-xl hover:shadow-violet-500/5 cursor-pointer"
                        >
                            {/* Top gradient bar */}
                            <div className={`h-0.5 w-full ${t.status === "ACTIVE" ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-gradient-to-r from-amber-500 to-orange-400"}`} />

                            <div className="p-5">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border admin-border flex items-center justify-center group-hover:from-violet-500/30 group-hover:to-purple-500/30 transition-all">
                                        {t.community_type === "OWN_HOUSES"
                                            ? <MapPin className="h-5 w-5 text-violet-400" />
                                            : <Building2 className="h-5 w-5 text-violet-400" />}
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${t.status === "ACTIVE"
                                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                                        : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                                        }`}>
                                        {t.status}
                                    </span>
                                </div>

                                <h3 className="font-bold admin-text text-base mb-1">{t.name}</h3>
                                <div className="flex items-center gap-1.5 text-[11px] font-mono admin-muted mb-4">
                                    <Hash className="h-3 w-3" />{t.slug}
                                    <span className="ml-auto text-[10px] font-sans font-semibold admin-surface-3 px-1.5 py-0.5 rounded uppercase">
                                        {t.community_type?.replace("_", " ")}
                                    </span>
                                </div>

                                {/* Stats grid */}
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { icon: Users, val: t.users ?? 0, color: "text-blue-400" },
                                        { icon: Wrench, val: t.maintenance ?? 0, color: "text-cyan-400" },
                                        { icon: AlertTriangle, val: t.violations ?? 0, color: "text-amber-400" },
                                        { icon: FileCheck, val: t.arc ?? 0, color: "text-emerald-400" },
                                    ].map((s, j) => (
                                        <div key={j} className="flex flex-col items-center admin-surface-2 rounded-lg p-2">
                                            <s.icon className={`h-3 w-3 ${s.color} mb-1`} />
                                            <span className="text-sm font-black admin-text opacity-80">{s.val}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between mt-4 pt-4 border-t admin-border">
                                    <div className="flex items-center gap-1.5 text-[11px] admin-muted opacity-40">
                                        <Calendar className="h-3 w-3" />
                                        {t.created_at ? new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                                    </div>
                                    <Link href={`/admin/tenants/${t.id}`}>
                                        <button className="flex items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors">
                                            Manage <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="col-span-3 rounded-2xl border admin-border admin-glass p-20 flex flex-col items-center gap-3 admin-muted">
                            <Building2 className="h-12 w-12 opacity-20" />
                            <p className="text-sm font-medium">No communities match.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
