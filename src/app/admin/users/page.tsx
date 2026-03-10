"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import { Users, Search, ArrowLeft, Shield, Mail, Calendar, Building2 } from "lucide-react";

function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-xl admin-surface-2 ${className}`} />;
}

export default function AllUsersPage() {
    const [search, setSearch] = useState("");

    const { data: users, isLoading } = useQuery({
        queryKey: ["admin", "users", "all", search],
        queryFn: () => apiGet<any[]>(`/admin/users/all${search ? `?search=${encodeURIComponent(search)}` : ""}`),
        staleTime: 30_000,
    });

    const data = users || [];
    const adminCount = data.filter((u: any) => u.is_platform_admin).length;

    const AVATAR_COLORS = [
        "from-violet-600 to-purple-700",
        "from-blue-600 to-indigo-700",
        "from-emerald-600 to-teal-700",
        "from-rose-600 to-pink-700",
        "from-amber-600 to-orange-700",
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
                        <h1 className="text-3xl font-black admin-text tracking-tight">Platform Users</h1>
                        <p className="admin-muted text-sm mt-1 flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-blue-400" />
                            All users across every community
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold text-white">
                            <Users className="h-3.5 w-3.5" /> {data.length} Total
                        </div>
                        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 font-semibold text-white">
                            <Shield className="h-3.5 w-3.5" /> {adminCount} Admins
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 admin-muted pointer-events-none" />
                <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or email…"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl admin-input"
                />
            </div>

            {/* Table */}
            <div className="rounded-2xl border admin-border admin-glass overflow-hidden">
                <div className="p-5 border-b admin-border">
                    <h3 className="text-sm font-bold admin-text">User Registry</h3>
                    <p className="text-xs admin-muted mt-0.5">Every registered user, their role and community memberships</p>
                </div>

                {isLoading ? (
                    <div className="p-2 admin-divide">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center gap-4 p-4">
                                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                                <div className="space-y-2 flex-1">
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-3 w-56" />
                                </div>
                                <Skeleton className="h-6 w-24 rounded-full" />
                                <Skeleton className="h-4 w-20" />
                            </div>
                        ))}
                    </div>
                ) : data.length === 0 ? (
                    <div className="p-20 flex flex-col items-center gap-3 admin-muted">
                        <Users className="h-12 w-12 opacity-20" />
                        <p className="text-sm font-medium">No users found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b admin-border text-[11px] uppercase tracking-widest admin-muted font-bold">
                                    <th className="px-5 py-3 text-left">User</th>
                                    <th className="px-5 py-3 text-left">Email</th>
                                    <th className="px-5 py-3 text-left">Communities</th>
                                    <th className="px-5 py-3 text-center">Type</th>
                                    <th className="px-5 py-3 text-center">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="admin-divide">
                                {data.map((user: any, i: number) => (
                                    <tr key={user.id} className="group hover:admin-surface-2 transition-colors">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${AVATAR_COLORS[i % AVATAR_COLORS.length]} flex items-center justify-center text-xs font-black text-white shadow-lg shrink-0`}>
                                                    {user.name?.substring(0, 2).toUpperCase() || "??"}
                                                </div>
                                                <span className="font-semibold admin-text">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2 admin-muted">
                                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                                <span className="text-xs font-mono">{user.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                {user.communities?.length === 0 ? (
                                                    <span className="text-xs admin-muted italic">None</span>
                                                ) : (
                                                    user.communities?.map((c: any) => (
                                                        <span key={c.id} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 flex items-center gap-1">
                                                            <Building2 className="h-2.5 w-2.5" />
                                                            {c.name}
                                                        </span>
                                                    ))
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            {user.is_platform_admin ? (
                                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-500 border border-violet-500/20">
                                                    <Shield className="h-3 w-3" /> Super Admin
                                                </span>
                                            ) : (
                                                <span className="text-xs admin-muted font-medium">Resident</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5 text-xs admin-muted">
                                                <Calendar className="h-3.5 w-3.5" />
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                                            </div>
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
