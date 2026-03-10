"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useState } from "react";
import Link from "next/link";
import {
    ArrowLeft, User, Mail, Lock, Shield, Building2, Users,
    CheckCircle, AlertTriangle, Wrench, FileCheck, Edit3,
    Save, Eye, EyeOff, Clock, Zap, Activity, RefreshCw,
} from "lucide-react";

/* ── helper ── */
function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-xl admin-surface-2 ${className}`} />;
}

function timeAgo(iso: string | null) {
    if (!iso) return "—";
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return "just now";
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const ACTIVITY_ICONS: Record<string, any> = {
    work_order: { icon: Wrench, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20", label: "Work Order" },
    violation: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20", label: "Violation" },
    arc_request: { icon: FileCheck, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20", label: "ARC Request" },
    new_user: { icon: Users, color: "text-violet-500", bg: "bg-violet-500/10 border-violet-500/20", label: "New User" },
    new_community: { icon: Building2, color: "text-pink-500", bg: "bg-pink-500/10 border-pink-500/20", label: "New Community" },
};


export default function AdminProfilePage() {
    const qc = useQueryClient();

    // ── profile fetch ──
    const { data: profile, isLoading: profileLoading } = useQuery({
        queryKey: ["admin", "profile"],
        queryFn: () => apiGet<any>("/admin/profile"),
        staleTime: 30_000,
    });

    // ── activity feed ──
    const { data: activity, isLoading: activityLoading, refetch: refetchActivity, isFetching: activityFetching } = useQuery({
        queryKey: ["admin", "activity", "recent"],
        queryFn: () => apiGet<any[]>("/admin/activity/recent"),
        staleTime: 15_000,
        refetchInterval: 30_000, // auto-refresh every 30s
    });

    // ── profile edit state ──
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [editingProfile, setEditingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);


    const handleSaveProfile = async () => {
        if (!editName && !editEmail) return;
        const payload: any = {};
        if (editName) payload.name = editName;
        if (editEmail) payload.email = editEmail;
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/profile`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload),
        });
        if (res.ok) {
            qc.invalidateQueries({ queryKey: ["admin", "profile"] });
            setEditingProfile(false);
            setProfileMsg({ type: "ok", text: "Profile updated successfully!" });
            setTimeout(() => setProfileMsg(null), 4000);
        } else {
            const err = await res.json().catch(() => ({}));
            setProfileMsg({ type: "err", text: err.detail?.message || "Update failed" });
        }
    };

    // ── password change ──
    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [showPwd, setShowPwd] = useState(false);
    const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

    const handleChangePassword = async () => {
        if (newPwd !== confirmPwd) { setPwdMsg({ type: "err", text: "Passwords do not match" }); return; }
        if (newPwd.length < 8) { setPwdMsg({ type: "err", text: "Password must be ≥ 8 characters" }); return; }
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/admin/profile/change-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ current_password: currentPwd, new_password: newPwd }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
            setPwdMsg({ type: "ok", text: "Password changed successfully!" });
            setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
            setTimeout(() => setPwdMsg(null), 4000);
        } else {
            setPwdMsg({ type: "err", text: data?.detail?.message || "Change failed" });
        }
    };

    const joinedDate = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
        : "—";

    return (
        <div className="p-6 lg:p-8 space-y-8 min-h-screen">
            {/* Back */}
            <Link href="/admin/dashboard">
                <button className="flex items-center gap-2 text-xs admin-muted hover:admin-text transition-colors">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
                </button>
            </Link>

            {/* Hero Card */}
            <div className="relative rounded-2xl overflow-hidden border admin-border bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-transparent admin-glass p-8 shadow-xl shadow-violet-500/5">
                {/* Orb */}
                <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-2xl font-black text-white shadow-2xl shadow-violet-500/30">
                            {profileLoading ? "…" : profile?.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center dark:border-slate-900">
                            <CheckCircle className="h-3 w-3 text-white" />
                        </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        {profileLoading ? (
                            <div className="space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-64" /></div>
                        ) : (
                            <>
                                <h1 className="text-2xl font-black admin-text">{profile?.name}</h1>
                                <p className="admin-muted text-sm mt-0.5 flex items-center gap-2">
                                    <Mail className="h-3.5 w-3.5 text-violet-500" />{profile?.email}
                                </p>
                                <div className="flex flex-wrap items-center gap-3 mt-3">
                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 border border-violet-500/20 dark:text-violet-400">
                                        <Shield className="h-3 w-3" /> Super Admin
                                    </span>
                                    <span className="text-xs admin-muted flex items-center gap-1.5 font-medium opacity-70">
                                        <Clock className="h-3.5 w-3.5" /> Member since {joinedDate}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Quick stats */}
                    <div className="flex gap-4 shrink-0">
                        <div className="text-center">
                            <div className="text-2xl font-black text-violet-600 dark:text-violet-400">{profile?.platform_stats?.total_communities ?? "—"}</div>
                            <div className="text-[10px] admin-muted font-bold uppercase tracking-wider">Communities</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{profile?.platform_stats?.total_users ?? "—"}</div>
                            <div className="text-[10px] admin-muted font-bold uppercase tracking-wider">Users</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Two column grid */}
            <div className="grid gap-6 lg:grid-cols-2">

                {/* ── Profile Edit ── */}
                <div className="rounded-2xl border admin-border admin-glass p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold admin-text flex items-center gap-2">
                                <User className="h-4.5 w-4.5 text-violet-500" /> Identity Profile
                            </h3>
                            <p className="text-xs admin-muted mt-0.5">Manage your platform authority credentials</p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingProfile(!editingProfile);
                                setEditName(profile?.name || "");
                                setEditEmail(profile?.email || "");
                            }}
                            className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:opacity-80 transition-all"
                        >
                            <Edit3 className="h-3.5 w-3.5" />
                            {editingProfile ? "Cancel Edit" : "Modify"}
                        </button>
                    </div>

                    {profileMsg && (
                        <div className={`text-xs font-bold px-4 py-2.5 rounded-xl border ${profileMsg.type === "ok" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400"}`}>
                            {profileMsg.text}
                        </div>
                    )}

                    {editingProfile ? (
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest admin-muted ml-1">Platform Alias</label>
                                <input
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    placeholder={profile?.name}
                                    className="w-full px-4 py-2.5 text-sm rounded-xl admin-input"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest admin-muted ml-1">Universal ID (Email)</label>
                                <input
                                    type="email"
                                    value={editEmail}
                                    onChange={e => setEditEmail(e.target.value)}
                                    placeholder={profile?.email}
                                    className="w-full px-4 py-2.5 text-sm rounded-xl admin-input"
                                />
                            </div>
                            <button
                                onClick={handleSaveProfile}
                                className="flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold shadow-lg shadow-violet-500/20 transition-all"
                            >
                                <Save className="h-4 w-4" /> Sync Profile State
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {[
                                { label: "Full Identity", value: profile?.name, icon: User },
                                { label: "Auth Endpoint", value: profile?.email, icon: Mail },
                                { label: "Authority Tier", value: "Super Administrator Cluster", icon: Shield },
                            ].map(f => {
                                const Icon = f.icon;
                                return (
                                    <div key={f.label} className="flex items-center gap-3 p-4 rounded-xl admin-surface-2 border admin-border group hover:admin-surface-3 transition-colors">
                                        <div className="h-9 w-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                                            <Icon className="h-4.5 w-4.5 text-violet-500" />
                                        </div>
                                        <div>
                                            <div className="text-[10px] admin-muted font-black uppercase tracking-wider opacity-60">{f.label}</div>
                                            {profileLoading ? <Skeleton className="h-4 w-32 mt-1" /> : (
                                                <div className="text-sm font-bold admin-text">{f.value || "—"}</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── Password Change ── */}
                <div className="rounded-2xl border admin-border admin-glass p-6 space-y-6">
                    <div>
                        <h3 className="text-base font-bold admin-text flex items-center gap-2">
                            <Lock className="h-4.5 w-4.5 text-rose-500" /> Secure Key Exchange
                        </h3>
                        <p className="text-xs admin-muted mt-0.5">Rotate your account encryption password</p>
                    </div>

                    {pwdMsg && (
                        <div className={`text-xs font-bold px-4 py-2.5 rounded-xl border ${pwdMsg.type === "ok" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400"}`}>
                            {pwdMsg.text}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest admin-muted ml-1">Active Password</label>
                            <div className="relative">
                                <input
                                    type={showPwd ? "text" : "password"}
                                    value={currentPwd}
                                    onChange={e => setCurrentPwd(e.target.value)}
                                    placeholder="Enter current password"
                                    className="w-full px-4 py-2.5 pr-10 text-sm rounded-xl admin-input"
                                />
                                <button onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 admin-muted hover:admin-text transition-colors">
                                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest admin-muted ml-1">New Secure Key</label>
                            <input
                                type={showPwd ? "text" : "password"}
                                value={newPwd}
                                onChange={e => setNewPwd(e.target.value)}
                                placeholder="Entropy threshold: 8 chars"
                                className="w-full px-4 py-2.5 text-sm rounded-xl admin-input"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest admin-muted ml-1">Re-Verify Key</label>
                            <input
                                type={showPwd ? "text" : "password"}
                                value={confirmPwd}
                                onChange={e => setConfirmPwd(e.target.value)}
                                placeholder="Repeat new key"
                                className={`w-full px-4 py-2.5 text-sm rounded-xl admin-input ${confirmPwd && confirmPwd !== newPwd ? "border-rose-500/40" : ""}`}
                            />
                            {confirmPwd && confirmPwd !== newPwd && (
                                <p className="text-[11px] text-rose-500 font-bold ml-1">Keys do not match</p>
                            )}
                        </div>

                        {/* Strength indicator */}
                        {newPwd && (
                            <div className="space-y-1.5 px-1">
                                <div className="flex gap-1.5">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${newPwd.length >= i * 3
                                            ? i <= 1 ? "bg-rose-500" : i <= 2 ? "bg-amber-500" : i <= 3 ? "bg-blue-500" : "bg-emerald-500"
                                            : "admin-surface-3"
                                            }`} />
                                    ))}
                                </div>
                                <p className="text-[10px] admin-muted font-bold tracking-wide">
                                    Entropy Strength: <span className="admin-text">{newPwd.length < 3 ? "Critical" : newPwd.length < 6 ? "Low" : newPwd.length < 9 ? "Sustainable" : newPwd.length < 12 ? "Reinforced" : "Absolute"}</span>
                                </p>
                            </div>
                        )}

                        <button
                            onClick={handleChangePassword}
                            disabled={!currentPwd || !newPwd || !confirmPwd}
                            className="flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-700 hover:from-rose-500 hover:to-pink-600 text-white text-sm font-bold shadow-lg shadow-rose-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <Lock className="h-4 w-4" /> Authorize Key Rotation
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Live Activity Feed ── */}
            <div className="rounded-2xl border admin-border admin-glass overflow-hidden shadow-xl shadow-slate-900/5">
                <div className="flex items-center justify-between p-6 border-b admin-border">
                    <div>
                        <h3 className="text-base font-bold admin-text flex items-center gap-2.5">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                            Omni-Platform Activity Signal
                        </h3>
                        <p className="text-xs admin-muted mt-0.5">Unified broadcast stream from all cluster nodes · refreshes every 30s</p>
                    </div>
                    <button
                        onClick={() => refetchActivity()}
                        className="h-9 w-9 rounded-xl admin-surface-btn flex items-center justify-center admin-muted hover:admin-text transition-all"
                    >
                        <RefreshCw className={`h-4 w-4 ${activityFetching ? "animate-spin" : ""}`} />
                    </button>
                </div>

                <div className="divide-y admin-divide max-h-[520px] overflow-y-auto">
                    {activityLoading ? (
                        <div className="p-6 space-y-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="flex items-center gap-4">
                                    <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-3.5 w-48" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            ))}
                        </div>
                    ) : !activity?.length ? (
                        <div className="p-20 flex flex-col items-center gap-4 admin-muted">
                            <Zap className="h-12 w-12 opacity-10" />
                            <p className="text-sm font-bold opacity-40">Static detected. No active signals.</p>
                        </div>
                    ) : (
                        <div className="p-3 space-y-0.5">
                            {activity.map((event: any, i: number) => {
                                const cfg = ACTIVITY_ICONS[event.type] || ACTIVITY_ICONS["work_order"];
                                const Icon = cfg.icon;
                                return (
                                    <div
                                        key={event.id + i}
                                        className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:admin-surface-2 transition-all group"
                                    >
                                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg}`}>
                                            <Icon className={`h-4.5 w-4.5 ${cfg.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold admin-text truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors uppercase tracking-tight">{event.description}</div>
                                            <div className="text-xs admin-muted flex items-center gap-2 mt-0.5 font-medium">
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${cfg.color} opacity-80`}>{cfg.label}</span>
                                                <span className="opacity-30">|</span>
                                                <Building2 className="h-3 w-3 opacity-60" />
                                                <span className="truncate opacity-70">{event.tenant_name}</span>
                                            </div>
                                        </div>
                                        <div className="text-[10px] admin-muted whitespace-nowrap font-black uppercase tracking-widest opacity-50">
                                            {timeAgo(event.created_at)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
