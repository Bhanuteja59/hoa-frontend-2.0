"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import { Layers, Search, ArrowLeft, Building2, Home, Calendar, Hash } from "lucide-react";

function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-xl admin-surface-2 ${className}`} />;
}

export default function AllBuildingsPage() {
    const [search, setSearch] = useState("");

    const { data: buildings, isLoading } = useQuery({
        queryKey: ["admin", "buildings", "all"],
        queryFn: () => apiGet<any[]>("/admin/buildings/all"),
        staleTime: 30_000,
    });

    const data = buildings || [];
    const filtered = data.filter((b: any) =>
        b.name?.toLowerCase().includes(search.toLowerCase()) ||
        b.tenant_name?.toLowerCase().includes(search.toLowerCase())
    );

    const totalUnits = data.reduce((acc: number, b: any) => acc + (b.unit_count || 0), 0);

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
                        <h1 className="text-3xl font-black admin-text tracking-tight">Buildings & Units</h1>
                        <p className="admin-muted text-sm mt-1 flex items-center gap-2">
                            <Layers className="h-3.5 w-3.5 text-amber-400" />
                            All structures registered across all communities
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold text-white">
                            <Building2 className="h-3.5 w-3.5" /> {data.length} Buildings
                        </div>
                        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold text-white">
                            <Home className="h-3.5 w-3.5" /> {totalUnits} Units
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 admin-muted pointer-events-none" />
                <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by building or community…"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl admin-input"
                />
            </div>

            {/* Table or Card grid for buildings */}
            <div className="rounded-2xl border admin-border admin-glass overflow-hidden">
                <div className="p-5 border-b admin-border">
                    <h3 className="text-sm font-bold admin-text">Building Registry</h3>
                    <p className="text-xs admin-muted mt-0.5">Physical structures and their unit allocations</p>
                </div>

                {isLoading ? (
                    <div className="p-3 admin-divide">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4">
                                <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-8 w-20" />
                                <Skeleton className="h-8 w-20" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-20 flex flex-col items-center gap-3 admin-muted">
                        <Building2 className="h-12 w-12 opacity-20" />
                        <p className="text-sm font-medium">No buildings found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b admin-border text-[11px] uppercase tracking-widest admin-muted font-bold">
                                    <th className="px-5 py-3 text-left">Building</th>
                                    <th className="px-5 py-3 text-left">Community</th>
                                    <th className="px-5 py-3 text-center">Units</th>
                                    <th className="px-5 py-3 text-center">Created</th>
                                    <th className="px-5 py-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="admin-divide">
                                {filtered.map((b: any) => (
                                    <tr key={b.id} className="group hover:admin-surface-2 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border admin-border flex items-center justify-center shrink-0">
                                                    <Building2 className="h-4 w-4 text-amber-500" />
                                                </div>
                                                <div>
                                                    <div className="font-semibold admin-text">{b.name}</div>
                                                    <div className="text-[10px] font-mono admin-muted mt-0.5 flex items-center gap-1 opacity-60">
                                                        <Hash className="h-2.5 w-2.5" />{b.id?.slice(0, 8)}…
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-500 border border-violet-500/20">
                                                <Building2 className="h-3 w-3" />
                                                {b.tenant_name}
                                                <span className="opacity-40 font-mono text-[10px]">· {b.tenant_slug}</span>
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <Home className={`h-4 w-4 ${b.unit_count > 0 ? "text-blue-500" : "admin-muted opacity-20"}`} />
                                                <span className={`font-black text-base ${b.unit_count > 0 ? "text-blue-500" : "admin-muted opacity-30"}`}>{b.unit_count ?? 0}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5 text-xs admin-muted">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {b.created_at ? new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <Link href={`/admin/communities`}>
                                                <button className="text-xs px-3 py-1.5 rounded-lg admin-surface-btn admin-muted hover:admin-text transition-all">
                                                    View Community →
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
