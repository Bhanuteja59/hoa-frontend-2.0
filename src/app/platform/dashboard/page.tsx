"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPostJson } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlatformDashboard() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);

    // Form State
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [adminName, setAdminName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [communityType, setCommunityType] = useState<"APARTMENTS" | "OWN_HOUSES">("APARTMENTS");
    const [error, setError] = useState("");

    const { data: tenants, isLoading } = useQuery({
        queryKey: ["platform", "tenants"],
        queryFn: () => apiGet<any[]>("/platform/tenants"),
    });

    const createTenant = useMutation({
        mutationFn: async () => {
            return apiPostJson("/platform/tenants", {
                name,
                slug: slug || undefined,
                admin_name: adminName,
                admin_email: adminEmail,
                admin_password: adminPassword,
                community_type: communityType
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["platform", "tenants"] });
            setIsOpen(false);
            // Reset form
            setName("");
            setSlug("");
            setAdminName("");
            setAdminEmail("");
            setAdminPassword("");
            setCommunityType("APARTMENTS");
            setError("");
        },
        onError: (err: any) => {
            setError(err.message || "Failed to create community");
        }
    });

    const handleSubmit = () => {
        if (!name || !adminEmail || !adminPassword) {
            setError("Please fill in required fields");
            return;
        }
        createTenant.mutate();
    }

    return (
        <div className="flex-1 space-y-4 p-4 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Platform Overview</h2>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create Community
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Community</DialogTitle>
                            <DialogDescription>
                                Add a new tenant and default administrator.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <div className="grid gap-2">
                                <Label>Community Name *</Label>
                                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sunnyvale HOA" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Community Code (Slug) (Optional)</Label>
                                <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Auto-generated if empty" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Default Admin Name</Label>
                                <Input value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="Admin User" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Default Admin Email *</Label>
                                <Input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} placeholder="admin@example.com" type="email" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Default Admin Password *</Label>
                                <Input value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} type="password" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Community Type</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div 
                                        onClick={() => setCommunityType("APARTMENTS")}
                                        className={`cursor-pointer rounded-md border p-3 text-center text-sm font-medium transition-all hover:bg-muted/50 ${communityType === "APARTMENTS" ? "border-primary bg-primary/5 ring-1 ring-primary text-primary" : "border-muted text-muted-foreground"}`}
                                    >
                                        Apartments
                                    </div>
                                    <div 
                                        onClick={() => setCommunityType("OWN_HOUSES")}
                                        className={`cursor-pointer rounded-md border p-3 text-center text-sm font-medium transition-all hover:bg-muted/50 ${communityType === "OWN_HOUSES" ? "border-primary bg-primary/5 ring-1 ring-primary text-primary" : "border-muted text-muted-foreground"}`}
                                    >
                                        Own Houses
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button onClick={handleSubmit} disabled={createTenant.isPending}>
                                {createTenant.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Create User Dialog */}
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="ml-2">
                             Create User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New User</DialogTitle>
                            <DialogDescription>
                                Create a user for a specific community.
                            </DialogDescription>
                        </DialogHeader>
                        <CreateUserForm onSuccess={() => setIsOpen(false)} />
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Communities</CardTitle>
                    <CardDescription>Manage all registered communities.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tenants?.map((tenant) => (
                                <Link
                                    href={`/platform/tenants/${tenant.id}`}
                                    key={tenant.id}
                                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0 hover:bg-muted/50 p-2 rounded-md transition-colors cursor-pointer"
                                >
                                    <div>
                                        <p className="font-medium text-primary">{tenant.name}</p>
                                        <p className="text-xs text-muted-foreground font-mono">{tenant.slug}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            {tenant.community_type?.replace('_', ' ') || "APARTMENTS"}
                                        </Badge>
                                        <Badge variant={tenant.status === "ACTIVE" ? "default" : "secondary"}>{tenant.status}</Badge>
                                        <p className="text-xs text-muted-foreground">{new Date(tenant.created_at).toLocaleDateString()}</p>
                                    </div>
                                </Link>
                            ))}
                            {tenants?.length === 0 && (
                                <p className="text-muted-foreground text-sm">No communities found.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function CreateUserForm({ onSuccess }: { onSuccess: () => void }) {
    const queryClient = useQueryClient();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("USER");
    const [communityCode, setCommunityCode] = useState("");
    const [unit, setUnit] = useState("");
    const [error, setError] = useState("");

    const createUser = useMutation({
        mutationFn: async () => {
            return apiPostJson("/users", {
                name,
                email,
                password,
                role,
                community_code: communityCode,
                unit: unit || undefined
            });
        },
        onSuccess: () => {
            setName("");
            setEmail("");
            setPassword("");
            setCommunityCode("");
            setUnit("");
            setError("");
            alert("User created successfully!");
            onSuccess();
        },
        onError: (err: any) => {
            setError(err.message || "Failed to create user");
        }
    });

    return (
        <div className="grid gap-4 py-4">
             {error && <p className="text-sm text-red-500">{error}</p>}
             <div className="grid gap-2">
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
                <Label>Email</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            </div>
            <div className="grid gap-2">
                <Label>Password</Label>
                <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
            </div>
             <div className="grid gap-2">
                <Label>Community Code (Slug)</Label>
                <Input value={communityCode} onChange={(e) => setCommunityCode(e.target.value)} placeholder="e.g. sunnyvale-hoa" />
                <p className="text-[10px] text-muted-foreground">The user will be created in this community.</p>
            </div>
             <div className="grid gap-2">
                <Label>Unit (Optional)</Label>
                <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. 101" />
            </div>
            <div className="grid gap-2">
                 <Label>Role</Label>
                 <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="USER">Resident</option>
                    <option value="BOARD">Board Member</option>
                    <option value="ADMIN">Admin</option>
                 </select>
            </div>
            <Button onClick={() => createUser.mutate()} disabled={createUser.isPending}>
                {createUser.isPending ? "Creating..." : "Create User"}
            </Button>
        </div>
    );
}

