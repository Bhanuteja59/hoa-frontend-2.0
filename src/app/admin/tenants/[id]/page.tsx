"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiDelete, apiPutJson } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, Save, ArrowLeft, Building2, Users, Shield, Mail, Calendar, Settings, Activity } from "lucide-react";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";

function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-xl admin-surface-2 ${className}`} />;
}

export default function TenantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const tenantId = params.id as string;

    const { data: tenant, isLoading: isLoadingTenant } = useQuery({
        queryKey: ["admin", "tenant", tenantId],
        queryFn: () => apiGet<any>(`/admin/tenants/${tenantId}`),
    });

    const { data: users, isLoading: isLoadingUsers } = useQuery({
        queryKey: ["admin", "tenant", tenantId, "users"],
        queryFn: () => apiGet<any[]>(`/admin/tenants/${tenantId}/users`),
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editSlug, setEditSlug] = useState("");

    const [editingUser, setEditingUser] = useState<any>(null);
    const [editUserName, setEditUserName] = useState("");
    const [editUserEmail, setEditUserEmail] = useState("");
    const [editUserRole, setEditUserRole] = useState("");

    const updateTenant = useMutation({
        mutationFn: async (data: any) => apiPutJson(`/admin/tenants/${tenantId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "tenant", tenantId] });
            setIsEditing(false);
        }
    });

    const deleteTenant = useMutation({
        mutationFn: async () => apiDelete(`/admin/tenants/${tenantId}`),
        onSuccess: () => router.push("/admin/communities")
    });

    const updateUser = useMutation({
        mutationFn: async (data: any) => apiPutJson(`/admin/tenants/${tenantId}/users/${editingUser.id}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "tenant", tenantId, "users"] });
            setEditingUser(null);
        }
    });

    const deleteUser = useMutation({
        mutationFn: async (userId: string) => apiDelete(`/admin/tenants/${tenantId}/users/${userId}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "tenant", tenantId, "users"] })
    });

    if (isLoadingTenant) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
                <p className="admin-muted text-sm font-medium animate-pulse">Initializing cluster context…</p>
            </div>
        );
    }

    if (!tenant) {
        return (
            <div className="p-20 text-center space-y-4">
                <div className="text-4xl">🛸</div>
                <h1 className="text-2xl font-black admin-text">Cluster Not Found</h1>
                <p className="admin-muted max-w-xs mx-auto text-sm">The requested tenant ID does not exist in the platform registry.</p>
                <button onClick={() => router.back()} className="px-6 py-2 rounded-xl admin-surface-btn admin-text font-bold">Return to Fleet</button>
            </div>
        );
    }

    return (
        <div className="p-6 lg:p-8 space-y-8 min-h-screen">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <button onClick={() => router.back()} className="flex items-center gap-2 text-xs admin-muted hover:admin-text transition-colors w-fit">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to Registry
                </button>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-violet-500/20">
                            {tenant.name?.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-3xl font-black admin-text tracking-tight">{tenant.name}</h1>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border ${tenant.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                                    {tenant.status}
                                </span>
                                <span className="text-xs admin-muted flex items-center gap-1 font-mono">
                                    <Shield className="h-3 w-3" /> {tenant.slug}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => { if (confirm("DANGER: This will delete the entire community and all associated data. Continue?")) deleteTenant.mutate(); }}
                            disabled={deleteTenant.isPending}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-rose-400 hover:text-white hover:bg-rose-500/20 transition-all border border-rose-500/20"
                        >
                            <Trash2 className="h-3.5 w-3.5" /> Delete Instance
                        </button>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-admin-surface-2 p-1 rounded-xl h-auto border admin-border">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-lg px-6 py-2 text-xs font-bold transition-all">
                        <Settings className="h-3.5 w-3.5 mr-2" /> Instance Configuration
                    </TabsTrigger>
                    <TabsTrigger value="users" className="data-[state=active]:bg-violet-600 data-[state=active]:text-white rounded-lg px-6 py-2 text-xs font-bold transition-all">
                        <Users className="h-3.5 w-3.5 mr-2" /> Personnel Registry
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-0 space-y-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Summary side Card */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="rounded-2xl border admin-border admin-glass p-6 space-y-4">
                                <h3 className="text-sm font-bold admin-text">Instance Metrics</h3>
                                <div className="space-y-3">
                                    {[
                                        { label: "Population", value: users?.length ?? 0, icon: Users, color: "text-blue-400" },
                                        { label: "Infrastructure", value: "8 Buildings", icon: Building2, color: "text-amber-400" },
                                        { label: "Live Requests", value: "12 Open", icon: Activity, color: "text-emerald-400" },
                                    ].map(m => (
                                        <div key={m.label} className="flex items-center justify-between p-3 rounded-xl admin-surface-2 border admin-border">
                                            <div className="flex items-center gap-2.5">
                                                <m.icon className={`h-4 w-4 ${m.color}`} />
                                                <span className="text-xs admin-muted font-medium">{m.label}</span>
                                            </div>
                                            <span className="text-sm font-black admin-text">{m.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Config Card */}
                        <div className="lg:col-span-2 rounded-2xl border admin-border admin-glass p-8 space-y-6 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold admin-text">Core Settings</h3>
                                    <p className="text-xs admin-muted">Modify organizational parameters for this tenant</p>
                                </div>
                                {!isEditing && (
                                    <button
                                        onClick={() => { setEditName(tenant.name); setEditSlug(tenant.slug); setIsEditing(true); }}
                                        className="text-xs font-bold text-violet-400 hover:text-violet-300 px-4 py-2 rounded-xl admin-surface-btn"
                                    >
                                        Edit Instance
                                    </button>
                                )}
                            </div>

                            <div className="space-y-5">
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest font-black admin-muted ml-1">Entity Name</label>
                                        <input
                                            value={isEditing ? editName : tenant.name}
                                            disabled={!isEditing}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl admin-input"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] uppercase tracking-widest font-black admin-muted ml-1">Unique Alias (Slug)</label>
                                        <div className="relative">
                                            <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 admin-muted opacity-40" />
                                            <input
                                                value={isEditing ? editSlug : tenant.slug}
                                                disabled={!isEditing}
                                                onChange={(e) => setEditSlug(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-xl admin-input font-mono"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] uppercase tracking-widest font-black admin-muted ml-1">Instance Deployment Date</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 admin-muted opacity-40" />
                                        <input value={new Date(tenant.created_at).toLocaleString()} disabled className="w-full pl-10 pr-4 py-2.5 rounded-xl admin-input opacity-60" />
                                    </div>
                                </div>

                                {isEditing && (
                                    <div className="flex items-center gap-3 pt-4 border-t admin-border">
                                        <button
                                            onClick={() => updateTenant.mutate({ name: editName, slug: editSlug })}
                                            disabled={updateTenant.isPending}
                                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold shadow-lg shadow-violet-500/20 transition-all"
                                        >
                                            <Save className="h-4 w-4" /> Save Snapshot
                                        </button>
                                        <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 rounded-xl admin-muted hover:admin-text font-bold text-sm">Cancel</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="users" className="mt-0">
                    <div className="rounded-2xl border admin-border admin-glass overflow-hidden">
                        <div className="p-6 border-b admin-border flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold admin-text">Cluster Personnel</h3>
                                <p className="text-xs admin-muted">Management of individual access nodes in this tenant</p>
                            </div>
                        </div>

                        {isLoadingUsers ? (
                            <div className="p-6 space-y-4">
                                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16" />)}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b admin-border text-[11px] uppercase tracking-widest admin-muted font-bold">
                                            <th className="px-6 py-4 text-left">Identity</th>
                                            <th className="px-6 py-4 text-left">Access Rights</th>
                                            <th className="px-6 py-4 text-right">Operational Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="admin-divide">
                                        {users?.map(user => (
                                            <tr key={user.id} className="group hover:admin-surface-2 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-9 w-9 rounded-full bg-admin-surface-2 border admin-border flex items-center justify-center text-xs font-black admin-text shadow-sm">
                                                            {user.name?.substring(0, 1).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <div className="font-bold admin-text">{user.name}</div>
                                                            <div className="text-xs admin-muted opacity-60 flex items-center gap-1.5"><Mail className="h-3 w-3" />{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${user.role === 'ADMIN' ? 'bg-violet-500/10 text-violet-500 border-violet-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                                                        {user.role === 'ADMIN' ? <Shield className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => {
                                                                setEditingUser(user);
                                                                setEditUserName(user.name);
                                                                setEditUserEmail(user.email);
                                                                setEditUserRole(user.role);
                                                            }}
                                                            className="text-xs font-bold text-violet-400 hover:text-violet-300"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => { if (confirm(`Remove ${user.name} from this instance?`)) deleteUser.mutate(user.id); }}
                                                            className="text-xs font-bold text-rose-400/60 hover:text-rose-400"
                                                        >
                                                            Revoke
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Custom Modal for User Edit */}
            {editingUser && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/20">
                    <div className="w-full max-w-md rounded-2xl border admin-border admin-glass p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                                <Users className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold admin-text">Modify Personnel</h3>
                                <p className="text-xs admin-muted">Adjusting access nodes for identity {editingUser.id?.slice(0, 8)}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest font-black admin-muted ml-1">Full Identity Name</label>
                                <input value={editUserName} onChange={e => setEditUserName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl admin-input" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest font-black admin-muted ml-1">Communication Endpoint</label>
                                <input value={editUserEmail} onChange={e => setEditUserEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-xl admin-input" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-widest font-black admin-muted ml-1">Cluster Authority Level</label>
                                <select
                                    className="w-full px-4 py-2.5 rounded-xl admin-input"
                                    value={editUserRole} onChange={e => setEditUserRole(e.target.value)}
                                >
                                    <option value="USER">Resident Access</option>
                                    <option value="ADMIN">Community Administrator</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3 pt-6">
                                <button
                                    onClick={() => updateUser.mutate({ name: editUserName, email: editUserEmail, role: editUserRole })}
                                    disabled={updateUser.isPending}
                                    className="flex-1 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold shadow-lg shadow-violet-500/20 transition-all"
                                >
                                    {updateUser.isPending ? "Syncing..." : "Apply Permissions"}
                                </button>
                                <button onClick={() => setEditingUser(null)} className="px-6 py-2.5 rounded-xl admin-surface-btn admin-muted hover:admin-text font-bold text-sm">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
