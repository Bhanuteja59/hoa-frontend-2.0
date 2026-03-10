"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiDelete, apiPutJson } from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Save, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TenantDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const tenantId = params.id as string;

    const { data: tenant, isLoading: isLoadingTenant } = useQuery({
        queryKey: ["platform", "tenant", tenantId],
        queryFn: () => apiGet<any>(`/platform/tenants/${tenantId}`),
    });

    const { data: users, isLoading: isLoadingUsers } = useQuery({
        queryKey: ["platform", "tenant", tenantId, "users"],
        queryFn: () => apiGet<any[]>(`/platform/tenants/${tenantId}/users`),
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState("");
    const [editSlug, setEditSlug] = useState("");

    const [editingUser, setEditingUser] = useState<any>(null);
    const [editUserName, setEditUserName] = useState("");
    const [editUserEmail, setEditUserEmail] = useState("");
    const [editUserRole, setEditUserRole] = useState("");


    const updateTenant = useMutation({
        mutationFn: async (data: any) => {
            return apiPutJson(`/platform/tenants/${tenantId}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["platform", "tenant", tenantId] });
            setIsEditing(false);
        }
    });

    const deleteTenant = useMutation({
        mutationFn: async () => {
            return apiDelete(`/platform/tenants/${tenantId}`);
        },
        onSuccess: () => {
            router.push("/platform/dashboard");
        }
    });

    const updateUser = useMutation({
        mutationFn: async (data: any) => {
            return apiPutJson(`/platform/tenants/${tenantId}/users/${editingUser.id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["platform", "tenant", tenantId, "users"] });
            setEditingUser(null);
        }
    });

    const deleteUser = useMutation({
        mutationFn: async (userId: string) => {
            return apiDelete(`/platform/tenants/${tenantId}/users/${userId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["platform", "tenant", tenantId, "users"] });
        }
    });

    if (isLoadingTenant) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    if (!tenant) return <div className="p-8">Tenant not found</div>;

    return (
        <div className="flex-1 space-y-4 p-4 pt-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-3xl font-bold tracking-tight">{tenant.name}</h2>
                <Badge>{tenant.status}</Badge>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                            <CardDescription>Manage community details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Name</Label>
                                <Input
                                    value={isEditing ? editName : tenant.name}
                                    disabled={!isEditing}
                                    onChange={(e) => setEditName(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Community Code (Slug)</Label>
                                <Input
                                    value={isEditing ? editSlug : tenant.slug}
                                    disabled={!isEditing}
                                    onChange={(e) => setEditSlug(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Created At</Label>
                                <Input value={new Date(tenant.created_at).toLocaleString()} disabled />
                            </div>

                            <div className="flex gap-2 pt-4">
                                {isEditing ? (
                                    <>
                                        <Button onClick={() => updateTenant.mutate({ name: editName, slug: editSlug })} disabled={updateTenant.isPending}>
                                            <Save className="mr-2 h-4 w-4" /> Save
                                        </Button>
                                        <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                                    </>
                                ) : (
                                    <Button onClick={() => { setEditName(tenant.name); setEditSlug(tenant.slug); setIsEditing(true); }}>
                                        Edit Details
                                    </Button>
                                )}

                                <div className="flex-1"></div>

                                <Button variant="destructive" onClick={() => { if (confirm("Are you sure? This will delete the community and all data.")) deleteTenant.mutate(); }} disabled={deleteTenant.isPending}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete Community
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Users</CardTitle>
                            <CardDescription>Residents and admins in this community.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingUsers ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                                <div className="space-y-4">
                                    {users?.map(user => (
                                        <div key={user.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">{user.role}</Badge>
                                                <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>

                                                <Button variant="ghost" size="sm" onClick={() => {
                                                    setEditingUser(user);
                                                    setEditUserName(user.name);
                                                    setEditUserEmail(user.email);
                                                    setEditUserRole(user.role);
                                                }}>Edit</Button>
                                                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => {
                                                    if (confirm("Delete this user?")) deleteUser.mutate(user.id);
                                                }}>Delete</Button>
                                            </div>
                                        </div>
                                    ))}
                                    {users?.length === 0 && <p className="text-muted-foreground">No users found.</p>}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit User Dialog */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Edit User</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Label>Name</Label>
                                <Input value={editUserName} onChange={e => setEditUserName(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Email</Label>
                                <Input value={editUserEmail} onChange={e => setEditUserEmail(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Role</Label>
                                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={editUserRole} onChange={e => setEditUserRole(e.target.value)}>
                                    <option value="USER">Resident</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div className="flex gap-2 justify-end pt-4">
                                <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                                <Button onClick={() => updateUser.mutate({ name: editUserName, email: editUserEmail, role: editUserRole })} disabled={updateUser.isPending}>
                                    Save
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
