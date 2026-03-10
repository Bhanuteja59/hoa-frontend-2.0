"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AddUsersPage() {
    const { data: session }: any = useSession();
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [search, setSearch] = useState("");
    const [isaddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    // Form states
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "USER",
        unit: "",
        phone: "",
    });

    const { data: users, isLoading } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await api.get<any>("/users");
            return res.data || res;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            await api.post("/users", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setIsAddOpen(false);
            setFormData({ name: "", email: "", password: "", role: "USER", unit: "", phone: "" });
            toast({ title: "User created successfully" });
        },
        onError: (err: any) => {
            toast({ title: "Error creating user", description: err.message, variant: "destructive" });
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: any) => {
            await api.put(`/users/${selectedUser.id}`, {
                name: data.name,
                role: data.role,
                unit: data.unit,
                phone: data.phone,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            setIsEditOpen(false);
            toast({ title: "User updated successfully" });
        },
        onError: (err: any) => {
            toast({ title: "Error updating user", description: err.message, variant: "destructive" });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/users/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
            toast({ title: "User deleted successfully" });
        },
    });

    const filteredUsers = users?.filter((u: any) =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.unit_number && u.unit_number.toLowerCase().includes(search.toLowerCase()))
    );

    const handleEdit = (user: any) => {
        setSelectedUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: "", // Not editing password
            role: user.role,
            unit: user.unit_number || "",
            phone: user.phone || "",
        });
        setIsEditOpen(true);
    };

    if (session?.roles && !session.roles.includes("ADMIN")) {
        return <div className="p-8">You do not have permission to view this page.</div>;
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground mt-1">Add residents and assign units easily.</p>
                </div>
                <Dialog open={isaddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add User
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New User</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Full Name</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Password</label>
                                <Input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Role</label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(val) => setFormData({ ...formData, role: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="USER">Resident</SelectItem>
                                        <SelectItem value="ADMIN">Admin</SelectItem>
                                        <SelectItem value="BOARD">Board Member (Read Only)</SelectItem>
                                        {session?.user?.isPlatformAdmin && (
                                            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Phone <span className="text-red-500">*</span></label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="Enter Phone Number"
                                />
                            </div>
                            {formData.role !== "SUPER_ADMIN" && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Unit (e.g. Block A - 101)</label>
                                    <Input
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        placeholder="Block Name - Unit Number"
                                    />
                                    <p className="text-xs text-muted-foreground">The unit will be created if it doesn&apos;t exist.</p>
                                </div>
                            )}
                            <Button className="w-full mt-4" onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending}>
                                {createMutation.isPending ? "Creating..." : "Create User"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-9"
                />
            </div>

            <div className="rounded-xl border bg-card">
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Unit</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Joined</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            {isLoading ? (
                                <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
                            ) : filteredUsers?.map((user: any) => (
                                <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                                    <td className="p-4 align-middle font-medium">{user.name}</td>
                                    <td className="p-4 align-middle">{user.email}</td>
                                    <td className="p-4 align-middle">
                                        {user.unit_number ? (
                                            <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                                {user.unit_number}
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground italic">No Unit</span>
                                        )}
                                    </td>
                                    <td className="p-4 align-middle">
                                        <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent ${user.role === 'ADMIN' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 align-middle">{new Date(user.created_at).toLocaleDateString()}</td>
                                    <td className="p-4 align-middle">
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(user)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => {
                                                if (confirm("Are you sure you want to delete this user?")) deleteMutation.mutate(user.id);
                                            }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                value={formData.email}
                                disabled
                                className="bg-muted"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Role</label>
                            <Select
                                value={formData.role}
                                onValueChange={(val) => setFormData({ ...formData, role: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="USER">Resident</SelectItem>
                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                    <SelectItem value="BOARD">Board Member (Read Only)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phone</label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        {formData.role !== "SUPER_ADMIN" && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Unit (e.g. Block A - 101)</label>
                                <Input
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                    placeholder="Block Name - Unit Number"
                                />
                            </div>
                        )}
                        <Button className="w-full mt-4" onClick={() => updateMutation.mutate(formData)} disabled={updateMutation.isPending}>
                            {updateMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
