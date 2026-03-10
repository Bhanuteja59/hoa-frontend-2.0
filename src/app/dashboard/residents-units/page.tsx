"use client";

import { useMemo, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiGet, apiPostJson, apiPutJson, apiDelete } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";  // Added Textarea import
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Building2, Home, Users, Edit2, Trash2, Plus, CheckCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const buildingSchema = z.object({ name: z.string().min(2) });
const unitSchema = z.object({ unit_number: z.string().min(1), building_id: z.string().optional().nullable() });

import { useRouter } from "next/navigation";

// ... existing imports

export default function ResidentsUnitsPage() {
  const { data: session }: any = useSession();
  const roles: string[] = session?.roles ?? [];
  // Allow all authenticated users to view
  const hasAccess = true; // session is already checked by layout/middleware usually, but effectively all roles can view
  const isAdmin = roles.some(r => ["ADMIN", "BOARD_ADMIN", "BOARD", "BOARD_MEMBER", "HOA_BOARD_MEMBER"].includes(r));
  const canWrite = isAdmin;

  if (!session) {
    // Just a fallback, layout handles protection mostly
  }

  const router = useRouter();
  useEffect(() => {
    // Non-admins and non-board-admins cannot view the directory
    if (session && !isAdmin) {
      router.replace("/dashboard");
    }
  }, [session, isAdmin, router]);

  const { toast } = useToast();

  const qc = useQueryClient();
  const buildings = useQuery({ queryKey: ["buildings", session?.user?.tenantId], queryFn: () => apiGet<any[]>("/units/buildings"), enabled: isAdmin });
  const units = useQuery({ queryKey: ["units", session?.user?.tenantId], queryFn: () => apiGet<any[]>("/units"), enabled: isAdmin });
  const users = useQuery({ queryKey: ["users", session?.user?.tenantId], queryFn: () => apiGet<any[]>("/users"), enabled: isAdmin });
  const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => apiGet<any>("/auth/me") });

  // Creation State for Buildings/Units
  const [bName, setBName] = useState("");
  const [unitNumber, setUnitNumber] = useState("");
  const [buildingId, setBuildingId] = useState<string>("");

  // User Management State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [viewingUser, setViewingUser] = useState<any>(null);

  // Form Data (Shared for Add/Edit)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
    unit: "",
    address: "",
    phone: "",
    status: "active",
    community_type: "APARTMENTS",
    registration_number: "",
    account_number: ""
  });

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", role: "USER", unit: "", address: "", phone: "", status: "active", community_type: "APARTMENTS", registration_number: "", account_number: "" });
  };

  const createBuilding = useMutation({
    mutationFn: (body: any) => apiPostJson<any>("/units/buildings", body),
    onSuccess: async () => {
      setBName("");
      await qc.invalidateQueries({ queryKey: ["buildings"] });
      toast({ title: "Building created" });
    },
    onError: (err: any) => {
      toast({ title: "Error creating building", description: err.message || "Failed to create building", variant: "destructive" });
    }
  });

  const createUnit = useMutation({
    mutationFn: (body: any) => apiPostJson<any>("/units", body),
    onSuccess: async () => {
      setUnitNumber("");
      await qc.invalidateQueries({ queryKey: ["units"] });
      toast({ title: "Unit created" });
    },
    onError: (err: any) => {
      toast({ title: "Error creating unit", description: err.message || "Failed to create unit", variant: "destructive" });
    }
  });

  const createUser = useMutation({
    mutationFn: async (data: any) => {
      await apiPostJson("/users", data);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["users"] });
      setIsAddUserOpen(false);
      resetForm();
      toast({ title: "User created successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error creating user", description: err.message || "Failed to create user", variant: "destructive" });
    }
  });

  const updateUser = useMutation({
    mutationFn: (vars: { id: string, body: any }) => apiPutJson<any>(`/users/${vars.id}`, vars.body),
    onSuccess: async () => {
      setEditingUser(null);
      await qc.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error updating user", description: err.message, variant: "destructive" });
    }
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => apiDelete<any>(`/users/${id}`),
    onSuccess: async () => {
      setDeletingUser(null);
      await qc.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "User removed" });
    },
    onError: (err: any) => {
      toast({ title: "Error removing user", description: err.message || "Failed", variant: "destructive" });
    }
  });

  const buildingOptions = useMemo(() => buildings.data ?? [], [buildings.data]);
  const unitOptions = useMemo(() => units.data ?? [], [units.data]);
  // Show all users now
  const userList = useMemo(() => (users.data ?? []), [users.data]);

  // Filtering Logic
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterBuilding, setFilterBuilding] = useState<string>("all");
  const [searchName, setSearchName] = useState("");

  const filteredUsers = useMemo(() => {
    let result = userList;

    if (filterStatus !== "all") {
      result = result.filter((u: any) => u.status === filterStatus);
    }
    if (filterRole !== "all") {
      result = result.filter((u: any) => u.role === filterRole);
    }
    if (filterBuilding !== "all") {
      if (filterBuilding === "unassigned") {
        result = result.filter((u: any) => !u.building_id && !u.unit_number);
      } else {
        result = result.filter((u: any) => u.building_id === filterBuilding);
      }
    }
    if (searchName) {
      result = result.filter((u: any) => u.name.toLowerCase().includes(searchName.toLowerCase()) || u.email.toLowerCase().includes(searchName.toLowerCase()));
    }

    return result;
  }, [userList, filterStatus, filterRole, filterBuilding, searchName]);

  const openEdit = (u: any) => {
    setEditingUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: "",
      role: u.role,
      unit: u.unit_number ? (u.building_name && u.building_name !== "Main Building" ? `${u.building_name} - ${u.unit_number}` : u.unit_number) : "",
      address: u.address || "",
      phone: u.phone || "",
      status: u.status || "active",
      community_type: me?.community_type || "APARTMENTS",
      registration_number: u.registration_number || "",
      account_number: u.account_number || ""
    });
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Community Directory</h2>
        {canWrite && (
          <Button onClick={() => { resetForm(); setIsAddUserOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Add User
          </Button>
        )}
      </div>

      <Tabs defaultValue="residents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="residents">Residents</TabsTrigger>
          {canWrite && <TabsTrigger value="structure">Buildings & Units</TabsTrigger>}
        </TabsList>

        <TabsContent value="residents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Directory</CardTitle>
                  <CardDescription>Manage residents, admins, and unit assignments.</CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <Input
                    placeholder="Search name..."
                    className="w-[150px]"
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                  />
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="USER">Resident</SelectItem>
                      <SelectItem value="BOARD">Board</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterBuilding} onValueChange={setFilterBuilding}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {buildingOptions.map((b: any) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {users.isLoading ? <p>Loading residents...</p> : (
                <div className="rounded-md border overflow-x-auto">
                  <table className="w-full text-sm min-w-[800px]">
                    <thead className="bg-muted/50">
                      <tr className="border-b transition-colors hover:bg-muted/50 text-left">
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Name</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Email</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Phone</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Unit / Location</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Address</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Community Type</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Role</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Joined</th>
                        {canWrite && <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr><td colSpan={10} className="p-4 text-center text-muted-foreground">No users found matching filters.</td></tr>
                      ) : filteredUsers.map((u: any) => (
                        <tr
                          key={u.id}
                          className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                          onClick={(e) => {
                            // Prevent triggering when clicking action buttons
                            if ((e.target as HTMLElement).closest('button')) return;
                            setViewingUser(u);
                          }}
                        >
                          <td className="p-4 align-middle font-medium">
                            {u.name === "Resident" ? (
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground italic">Resident</span>
                                <Badge variant="secondary" className="text-[10px] h-4 px-1 opacity-70">Private</Badge>
                              </div>
                            ) : u.name}
                          </td>
                          <td className="p-4 align-middle text-muted-foreground">
                            {!u.privacy_show_email && u.id !== session?.user?.id && !isAdmin ? (
                              <Badge variant="outline" className="text-[10px] font-normal border-dashed opacity-60">Private</Badge>
                            ) : (u.email || "-")}
                          </td>
                          <td className="p-4 align-middle text-muted-foreground whitespace-nowrap">
                            {!u.privacy_show_phone && u.id !== session?.user?.id && !isAdmin ? (
                              <Badge variant="outline" className="text-[10px] font-normal border-dashed opacity-60">Private</Badge>
                            ) : (u.phone || "-")}
                          </td>
                          <td className="p-4 align-middle">
                            {u.unit_number ? (
                              <div 
                                className="inline-flex flex-col items-center justify-center min-h-12 min-w-16 px-3 py-1.5 rounded-[10px] border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-sm overflow-hidden text-center shrink-0 transition-transform hover:scale-105"
                                title={u.building_name ? `${u.building_name} - ${u.unit_number}` : u.unit_number}
                              >
                                <span className="text-[10px] sm:text-xs font-bold leading-tight line-clamp-2 whitespace-normal break-all">
                                  {u.unit_number}
                                </span>
                                {u.building_name && (
                                  <span className="text-[8px] sm:text-[9px] font-medium opacity-80 truncate w-full mt-0.5">
                                    {u.building_name}
                                  </span>
                                )}
                              </div>
                            ) : <span className="text-muted-foreground italic text-sm">Unassigned</span>}
                          </td>
                          <td className="p-4 align-middle text-muted-foreground max-w-[200px] truncate" title={u.address || ""}>
                            {!u.privacy_show_address && u.id !== session?.user?.id && !isAdmin ? (
                              <Badge variant="outline" className="text-[10px] font-normal border-dashed opacity-60">Private</Badge>
                            ) : (u.address || "-")}
                          </td>
                          <td className="p-4 align-middle">
                            <Badge variant="outline" className="text-xs">
                              {u.community_type?.replace('_', ' ') || "APARTMENTS"}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle">
                            <Badge variant={u.status === "active" ? "default" : u.status === "rejected" ? "destructive" : "secondary"} className={u.status === "pending" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" : ""}>
                              {u.status || "active"}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle">
                            <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>{u.role}</Badge>
                          </td>
                          <td className="p-4 align-middle">{new Date(u.created_at).toLocaleDateString()}</td>
                          {canWrite && (
                            <td className="p-4 align-middle text-right">
                              <div className="flex justify-end gap-2">
                                {u.status === "pending" && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateUser.mutate({ id: u.id, body: { status: "active" } });
                                    }}
                                    disabled={updateUser.isPending}
                                    title="Approve Resident"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); openEdit(u); }}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => { e.stopPropagation(); setDeletingUser(u); }}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canWrite && (
          <TabsContent value="structure" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Add Building</CardTitle>
                  <CardDescription>Define a new building structure.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2">
                    <Input placeholder="Building Name (e.g. Building A)" value={bName} onChange={(e) => setBName(e.target.value)} />
                  </div>
                  <Button
                    onClick={() => {
                      const parsed = buildingSchema.safeParse({ name: bName });
                      if (!parsed.success) return;
                      createBuilding.mutate(parsed.data);
                    }}
                    disabled={createBuilding.isPending}
                  >
                    {createBuilding.isPending ? "Creating..." : "Create Building"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Add Unit</CardTitle>
                  <CardDescription>Create a new unit within a building.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input placeholder="Unit Number (e.g. 101)" value={unitNumber} onChange={(e) => setUnitNumber(e.target.value)} />
                    <Select value={buildingId} onValueChange={setBuildingId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Building" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Building</SelectItem>
                        {buildingOptions.map((b: any) => (
                          <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => {
                      const parsed = unitSchema.safeParse({ unit_number: unitNumber, building_id: buildingId === "none" ? null : buildingId });
                      if (!parsed.success) return;
                      createUnit.mutate(parsed.data);
                    }}
                    disabled={createUnit.isPending}
                  >
                    {createUnit.isPending ? "Creating..." : "Create Unit"}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">Buildings</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mt-2">
                    {(buildings.data ?? []).map((b: any) => (
                      <li key={b.id} className="flex items-center p-2 rounded-md hover:bg-muted/50">
                        <span className="font-medium">{b.name}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-medium">Units</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mt-2 max-h-[300px] overflow-y-auto">
                    {(unitOptions).map((u: any) => (
                      <li key={u.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 border-b last:border-0 border-border/50">
                        <span className="font-medium">{u.unit_number}</span>
                        {u.building_id && <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">Bldg {buildingOptions.find((b: any) => b.id === u.building_id)?.name}</span>}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Add User Dialog */}
      <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new account for a resident or admin.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label className="font-bold text-black">Full Name</Label>
              <Input className="border-2 border-black" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold text-black">Email</Label>
              <Input className="border-2 border-black" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-black font-bold">Account Number (12 Digits)</Label>
                <div className="flex gap-2">
                  <Input 
                    value={formData.account_number} 
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value.replace(/\D/g, '') })} 
                    placeholder="12-digit ID"
                    maxLength={12}
                    className="border-black border-2"
                  />
                  {(formData.role === "USER" || formData.role === "BOARD") && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        const num = Array.from({length: 12}, () => Math.floor(Math.random() * 10)).join('');
                        setFormData(prev => ({ ...prev, account_number: num }));
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-black font-bold">Registration Code (6 Digits)</Label>
                <div className="flex gap-2">
                  <Input 
                    value={formData.registration_number} 
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value.replace(/\D/g, '') })} 
                    placeholder="6-digit code"
                    maxLength={6}
                    className="border-black border-2"
                  />
                  {(formData.role === "USER" || formData.role === "BOARD") && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        const num = Array.from({length: 6}, () => Math.floor(Math.random() * 10)).join('');
                        setFormData(prev => ({ ...prev, registration_number: num }));
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <p className="text-[10px] text-black font-medium mt-[-8px]">Registration code is valid for 7 days. Account number is permanent.</p>
            <div className="grid gap-2">
              <Label className="font-bold text-black">Password {(formData.role === "USER" || formData.role === "BOARD") && <span className="text-xs font-normal text-muted-foreground">(Leave blank to send invitation)</span>}</Label>
              <Input 
                type="password" 
                className="border-2 border-black"
                value={formData.password} 
                onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                placeholder={(formData.role === "USER" || formData.role === "BOARD") ? "Optional for invitation" : "Enter password"}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="font-bold text-black">Role</Label>
                <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                  <SelectTrigger className="border-2 border-black"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Resident</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="BOARD">Board Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="font-bold text-black">Community Type</Label>
                <Select value={formData.community_type} onValueChange={(val) => setFormData({ ...formData, community_type: val })}>
                  <SelectTrigger className="border-2 border-black"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APARTMENTS">Apartments</SelectItem>
                    <SelectItem value="OWN_HOUSES">Individual Houses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>


            {/* Simplified Unit Input for Creation (matches add-users logic) */}
            <div className="grid gap-2">
              <Label className="font-bold text-black">Unit (e.g. 101 or Building A - 101)</Label>
              <Input className="border-2 border-black" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="Enter unit number" />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold text-black">Phone <span className="text-red-500">*</span></Label>
              <Input className="border-2 border-black" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Enter phone number" />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold text-black">Address <span className="text-red-500">*</span></Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter physical address"
                className="min-h-[80px] border-2 border-black"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (!formData.address?.trim() || !formData.phone?.trim()) {
                toast({ title: "Address and Phone are required", variant: "destructive" });
                return;
              }
              const cleanPhone = formData.phone.replace(/\D/g, '');
              if (cleanPhone.length < 10 || cleanPhone.length > 15) {
                toast({ title: "Valid Phone number (10-15 digits) is required", variant: "destructive" });
                return;
              }
              // Passwords are only required if not a Resident invitation
              if (formData.password) {
                if (formData.password.length < 8) {
                  toast({ title: "Password must be at least 8 characters", variant: "destructive" });
                  return;
                }
                if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/\d/.test(formData.password)) {
                  toast({ title: "Password must contain at least one uppercase, lowercase, and number", variant: "destructive" });
                  return;
                }
              } else if (formData.role === "ADMIN") {
                 toast({ title: "Password is required for Admin roles", variant: "destructive" });
                 return;
              }

              createUser.mutate({ ...formData, phone: cleanPhone });
            }} disabled={createUser.isPending}>
              {createUser.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update profile and permissions.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Full Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold text-black">Email</Label>
              <Input 
                value={formData.email} 
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!(roles.includes("BOARD_ADMIN") || roles.includes("ADMIN"))} 
                className={`border-2 border-black ${!(roles.includes("BOARD_ADMIN") || roles.includes("ADMIN")) ? "bg-muted" : ""}`} 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="font-bold text-black">Role</Label>
                <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                  <SelectTrigger className="border-2 border-black"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Resident</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="BOARD">Board Member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="font-bold text-black">Status</Label>
                <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
                  <SelectTrigger className="border-2 border-black"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="font-bold text-black">Community Type</Label>
              <Select value={formData.community_type} onValueChange={(val) => setFormData({ ...formData, community_type: val })}>
                <SelectTrigger className="border-2 border-black"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="APARTMENTS">Apartments</SelectItem>
                  <SelectItem value="OWN_HOUSES">Individual Houses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-black font-bold">Account Number (12 Digits)</Label>
                <div className="flex gap-2">
                  <Input 
                    value={formData.account_number} 
                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value.replace(/\D/g, '') })} 
                    placeholder="12-digit ID"
                    maxLength={12}
                    className="border-black border-2"
                  />
                  {(formData.role === "USER" || formData.role === "BOARD") && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        const num = Array.from({length: 12}, () => Math.floor(Math.random() * 10)).join('');
                        setFormData(prev => ({ ...prev, account_number: num }));
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-black font-bold">Registration Code (6 Digits)</Label>
                <div className="flex gap-2">
                  <Input 
                    value={formData.registration_number} 
                    onChange={(e) => setFormData({ ...formData, registration_number: e.target.value.replace(/\D/g, '') })} 
                    placeholder="6-digit code"
                    maxLength={6}
                    className="border-black border-2"
                  />
                  {(formData.role === "USER" || formData.role === "BOARD") && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="icon"
                      onClick={() => {
                        const num = Array.from({length: 6}, () => Math.floor(Math.random() * 10)).join('');
                        setFormData(prev => ({ ...prev, registration_number: num }));
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="font-bold text-black">Unit</Label>
              <Input className="border-2 border-black" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} placeholder="Type unit number" />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold text-black">Phone <span className="text-red-500">*</span></Label>
              <Input className="border-2 border-black" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Enter phone number" />
            </div>
            <div className="grid gap-2">
              <Label className="font-bold text-black">Address <span className="text-red-500">*</span></Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="min-h-[80px] border-2 border-black"
                placeholder="Enter physical address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button disabled={updateUser.isPending} onClick={() => {
              if (editingUser) {
                if (!formData.address?.trim() || !formData.phone?.trim()) {
                  toast({ title: "Address and Phone are required", variant: "destructive" });
                  return;
                }
                const cleanPhone = formData.phone.replace(/\D/g, '');
                if (cleanPhone.length < 10 || cleanPhone.length > 15) {
                  toast({ title: "Valid Phone number (10-15 digits) is required", variant: "destructive" });
                  return;
                }
                updateUser.mutate({
                  id: editingUser.id,
                  body: {
                    name: formData.name,
                    email: formData.email,
                    role: formData.role,
                    unit: formData.unit,
                    address: formData.address,
                    phone: cleanPhone,
                    status: formData.status,
                    community_type: formData.community_type,
                    registration_number: formData.registration_number,
                    account_number: formData.account_number
                  }
                });
              }
            }}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove User?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <b>{deletingUser?.name}</b>? They will lose access.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingUser(null)}>Cancel</Button>
            <Button variant="destructive" disabled={deleteUser.isPending} onClick={() => {
              if (deletingUser) {
                deleteUser.mutate(deletingUser.id);
              }
            }}>Remove User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog (Read Only) */}
      <Dialog open={!!viewingUser} onOpenChange={(open) => !open && setViewingUser(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Resident Details</DialogTitle>
            <DialogDescription>View user information.</DialogDescription>
          </DialogHeader>
          {viewingUser && (
            <div className="grid gap-4 py-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary">
                  {viewingUser.name?.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold leading-none">{viewingUser.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{viewingUser.email}</p>
                  <Badge variant="outline" className="mt-2 text-xs">{viewingUser.role}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="font-medium capitalize">{viewingUser.status}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Community Type</Label>
                  <div className="font-medium">{viewingUser.community_type?.replace('_', ' ') || "APARTMENTS"}</div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Unit / Bldg</Label>
                  <div className="font-medium">
                    {viewingUser.unit_number ? (
                      viewingUser.building_name && viewingUser.building_name !== "Main Building" 
                        ? `${viewingUser.building_name} - ${viewingUser.unit_number}` 
                        : viewingUser.unit_number
                    ) : (
                      "Unassigned"
                    )}
                  </div>
                </div>
                <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-muted/10 border border-border/50 rounded-[10px] mt-2">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">Account Number</Label>
                    <div>
                      {viewingUser.account_number ? (
                        <div className="flex items-center justify-center px-4 h-10 border border-primary/20 rounded-[8px] text-base font-mono font-bold bg-primary/10 text-primary shadow-sm tracking-widest">
                          {viewingUser.account_number}
                        </div>
                      ) : <span className="text-xs text-muted-foreground italic">None</span>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">Registration Code</Label>
                    <div>
                      {viewingUser.registration_number ? (
                        <div className="flex items-center justify-center px-4 h-10 border border-primary/20 rounded-[8px] text-base font-mono font-bold bg-primary/10 text-primary shadow-sm tracking-widest">
                          {viewingUser.registration_number}
                        </div>
                      ) : <span className="text-xs text-muted-foreground italic">None</span>}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <div className="font-medium">
                    {!viewingUser.privacy_show_phone && viewingUser.id !== session?.user?.id && !isAdmin ? (
                      <Badge variant="outline" className="text-[10px] border-dashed opacity-60">Private</Badge>
                    ) : (viewingUser.phone || "Not provided")}
                  </div>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Address</Label>
                  <div className="font-medium text-sm leading-relaxed bg-muted/30 p-2 rounded-md border border-border/50">
                    {!viewingUser.privacy_show_address && viewingUser.id !== session?.user?.id && !isAdmin ? (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground italic text-xs">This information is private</span>
                        <Badge variant="outline" className="text-[10px] border-dashed opacity-60">Private</Badge>
                      </div>
                    ) : (viewingUser.address || "No address provided")}
                  </div>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs text-muted-foreground">Joined</Label>
                  <div className="font-medium">{new Date(viewingUser.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:justify-between">
            <Button variant="ghost" onClick={() => setViewingUser(null)}>Close</Button>
            {canWrite && viewingUser && (
              <Button onClick={() => {
                setViewingUser(null);
                openEdit(viewingUser);
              }}>
                <Edit2 className="mr-2 h-4 w-4" /> Edit User
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
