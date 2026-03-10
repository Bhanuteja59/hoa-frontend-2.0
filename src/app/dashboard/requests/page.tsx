"use client";

import { Suspense, useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiGet, apiPostJson, apiDelete, apiPatchJson, apiPostMultipart } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";
import {
    Wrench,
    Plus,
    CheckCircle,
    Clock,
    Trash2,
    Paperclip,
    Paintbrush,
    XCircle,
    Timer,
    Sparkles,
    Loader2
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";


// --- SCHEMAS ---
const woSchema = z.object({
    title: z.string().min(3),
    description: z.string().min(5),
});

const violationSchema = z.object({
    type: z.string().min(2),
    description: z.string().min(5),
});

const arcSchema = z.object({
    title: z.string().min(3),
    description: z.string().min(5),
});

function RequestsContent() {
    const { data: session }: any = useSession();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get("tab");

    const isAdmin = session?.roles?.includes("ADMIN");
    const isBoard = session?.roles?.includes("BOARD") || session?.roles?.includes("BOARD_MEMBER");
    // Default to APARTMENTS if not set, or handle logic safely
    const { data: me } = useQuery({ queryKey: ["me"], queryFn: () => apiGet<any>("/auth/me") });
    // Prefer fetched data, fallback to session, then default
    const communityType = me?.community_type || session?.user?.community_type || "APARTMENTS";

    // Treat "HOA" as synonym for "OWN_HOUSES" if it appears, or just map standard types
    const isApartment = communityType === "APARTMENTS";
    const isHOA = communityType === "OWN_HOUSES" || communityType === "HOA";

    const workOrderLabel = isHOA ? "General Request" : "Work Order";
    const workOrderTabLabel = isHOA ? "General Requests" : "Work Orders";

    const isReadOnly = false;

    const { toast } = useToast();
    const qc = useQueryClient();
    const [activeTab, setActiveTab] = useState(tabParam || "work-orders");
    // Actually, "violations" is safe common ground.

    // Shared State
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    // Queries
    const workOrders = useQuery({ queryKey: ["workOrders"], queryFn: () => apiGet<any[]>("/work-orders") });
    const violations = useQuery({ queryKey: ["violations"], queryFn: () => apiGet<any[]>("/violations") });
    const arcs = useQuery({ queryKey: ["arcRequests"], queryFn: () => apiGet<any[]>("/arc-requests") });
    const units = useQuery({ queryKey: ["units"], queryFn: () => apiGet<any[]>("/units") });

    // --- WORK ORDERS STATE ---
    const [isWODialogOpen, setIsWODialogOpen] = useState(false);
    const [editingWO, setEditingWO] = useState<any>(null);
    const [woTitle, setWOTitle] = useState("");
    const [woDesc, setWODesc] = useState("");
    const [woStatus, setWOStatus] = useState("NEW");
    const [woUnitId, setWOUnitId] = useState<string | undefined>(undefined);

    // --- VIOLATION STATE ---
    const [isViolationOpen, setIsViolationOpen] = useState(false);
    const [editingViolation, setEditingViolation] = useState<any>(null);
    const [vType, setVType] = useState("Noise");
    const [vDesc, setVDesc] = useState("");
    const [vUnit, setVUnit] = useState("");
    const [vUnitAlt, setVUnitAlt] = useState("");
    const [vStatus, setVStatus] = useState("OPEN");
    // --- ARC STATE ---
    const [isArcOpen, setIsArcOpen] = useState(false);
    const [editingArc, setEditingArc] = useState<any>(null);
    const [aTitle, setATitle] = useState("");
    const [aDesc, setADesc] = useState("");
    const [aUnit, setAUnit] = useState("");
    const [aStatus, setAStatus] = useState("SUBMITTED");
    const [aStartDate, setAStartDate] = useState("");
    const [aEndDate, setAEndDate] = useState("");
    const [aActualEndDate, setAActualEndDate] = useState("");

    // --- HELPERS ---
    const uploadFile = async (f: File) => {
        const fd = new FormData();
        fd.append("file", f);
        const res = await apiPostMultipart<{ url: string }>("/uploads", fd);
        return res.url;
    };

    const getFullUrl = (params: string) => {
        if (!params) return "";
        if (params.startsWith("http")) return params;
        let baseUrl = "http://localhost:8000";
        if (process.env.NEXT_PUBLIC_API_BASE) {
            baseUrl = process.env.NEXT_PUBLIC_API_BASE.replace("/api/v1", "");
        }
        if (baseUrl.endsWith("/")) baseUrl = baseUrl.slice(0, -1);
        if (!params.startsWith("/")) params = `/${params}`;
        return `${baseUrl}${params}?t=${Date.now()}`;
    };

    // --- WORK ORDER HANDLERS ---
    const openCreateWO = () => {
        setEditingWO(null);
        setWOTitle("");
        setWODesc("");
        setWOStatus("NEW");
        setWOUnitId(undefined);
        setFile(null);
        setIsWODialogOpen(true);
    };

    const openEditWO = (item: any) => {
        setEditingWO(item);
        setWOTitle(item.title);
        setWODesc(item.description);
        setWOStatus(item.status);
        setWOUnitId(item.unit_id);
        setFile(null);
        setIsWODialogOpen(true);
    };

    const createWO = useMutation({
        mutationFn: (body: any) => apiPostJson<any>("/work-orders", body),
        onSuccess: async () => {
            setIsWODialogOpen(false);
            setWOTitle("");
            setWODesc("");
            setWOStatus("NEW");
            setWOUnitId(undefined);
            setFile(null);
            toast({ title: "Request Submitted", description: "Maintenance request created successfully." });
            await qc.invalidateQueries({ queryKey: ["workOrders"] });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const updateWO = useMutation({
        mutationFn: (vars: { id: string, body: any }) => apiPatchJson<any>(`/work-orders/${vars.id}`, vars.body),
        onMutate: async (vars) => {
            await qc.cancelQueries({ queryKey: ["workOrders"] });
            const previousWOs = qc.getQueryData(["workOrders"]);
            qc.setQueryData(["workOrders"], (old: any[] | undefined) =>
                old ? old.map(w => w.id === vars.id ? { ...w, ...vars.body } : w) : []
            );
            return { previousWOs };
        },
        onError: (err: any, vars, context) => {
            if (context?.previousWOs) {
                qc.setQueryData(["workOrders"], context.previousWOs);
            }
            toast({ title: "Error", description: err.message, variant: "destructive" });
        },
        onSuccess: async () => {
            setIsWODialogOpen(false);
            toast({ title: "Updated", description: "Work order updated successfully" });
        },
        onSettled: () => {
            qc.invalidateQueries({ queryKey: ["workOrders"] });
        }
    });

    const deleteWO = useMutation({
        mutationFn: (id: string) => apiDelete<any>(`/work-orders/${id}`),
        onSuccess: async () => {
            toast({ title: "Deleted", description: "Work order removed" });
            await qc.invalidateQueries({ queryKey: ["workOrders"] });
        }
    });

    const handleWOSubmit = async () => {
        const parsed = woSchema.safeParse({ title: woTitle, description: woDesc });
        if (!parsed.success) {
            toast({ title: "Validation Error", description: "Title (3+) and Description (5+) required.", variant: "destructive" });
            return;
        }
        if (isAdmin && !editingWO && !woUnitId) {
            toast({ title: "Validation Error", description: "Admin must select a Unit.", variant: "destructive" });
            return;
        }

        let attachmentUrl = editingWO?.attachment_url;
        if (file) {
            try {
                setUploading(true);
                attachmentUrl = await uploadFile(file);
            } catch (e: any) {
                toast({ title: "Upload Failed", description: e.message, variant: "destructive" });
                setUploading(false);
                return;
            } finally { setUploading(false); }
        }

        if (editingWO) {
            updateWO.mutate({
                id: editingWO.id,
                body: { title: woTitle, description: woDesc, status: woStatus, attachment_url: attachmentUrl }
            });
        } else {
            createWO.mutate({ ...parsed.data, attachment_url: attachmentUrl, unit_id: woUnitId });
        }
    };

    // --- VIOLATION HANDLERS ---
    const openCreateViolation = () => {
        setEditingViolation(null);
        setVType("Noise");
        setVDesc("");
        setVUnit("");
        setVUnitAlt("");
        setVStatus("OPEN");
        setFile(null);
        setIsViolationOpen(true);
    };

    const openEditViolation = (v: any) => {
        setEditingViolation(v);
        setVType(v.type);
        setVDesc(v.description);
        setVUnit(v.unit_id || "");
        setVUnitAlt("");
        setVStatus(v.status);
        setFile(null);
        setIsViolationOpen(true);
    };

    const createViolation = useMutation({
        mutationFn: (body: any) => apiPostJson<any>("/violations", body),
        onSuccess: async () => {
            setIsViolationOpen(false);
            setVType("Noise");
            setVDesc("");
            setVUnit("");
            setVUnitAlt("");
            setVStatus("OPEN");
            setFile(null);
            toast({ title: "Report Submitted", description: "Violation report has been filed." });
            await qc.invalidateQueries({ queryKey: ["violations"] });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const updateViolation = useMutation({
        mutationFn: (vars: { id: string, body: any }) => apiPatchJson(`/violations/${vars.id}`, vars.body),
        onSuccess: async () => {
            setIsViolationOpen(false);
            toast({ title: "Updated", description: "Violation updated." });
            await qc.invalidateQueries({ queryKey: ["violations"] });
        }
    });

    const deleteViolation = useMutation({
        mutationFn: (id: string) => apiDelete(`/violations/${id}`),
        onSuccess: async () => {
            toast({ title: "Deleted", description: "Violation removed" });
            await qc.invalidateQueries({ queryKey: ["violations"] });
        }
    });

    const handleViolationSubmit = async () => {
        const parsed = violationSchema.safeParse({ type: vType, description: vDesc });
        if (!parsed.success) {
            toast({ title: "Validation Error", description: "Description 5+ chars required", variant: "destructive" });
            return;
        }

        let attachmentUrl = editingViolation?.attachment_url;
        if (file) {
            try {
                setUploading(true);
                attachmentUrl = await uploadFile(file);
            } catch (e: any) {
                setUploading(false);
                toast({ title: "Upload Failed", description: e.message, variant: "destructive" });
                return;
            } finally { setUploading(false); }
        }

        if (editingViolation) {
            updateViolation.mutate({
                id: editingViolation.id,
                body: { description: vDesc, type: vType, status: vStatus, unit_id: vUnit || undefined, attachment_url: attachmentUrl }
            });
        } else {
            let finalDesc = vDesc;
            if (!isAdmin && !isBoard && vUnitAlt) {
                finalDesc = `Reported Area/Unit: ${vUnitAlt}\n\n${vDesc}`;
            }
            createViolation.mutate({ ...parsed.data, description: finalDesc, unit_id: (isAdmin || isBoard) ? (vUnit || undefined) : undefined, attachment_url: attachmentUrl });
        }
    };

    // --- ARC HANDLERS ---
    const openCreateArc = () => {
        setEditingArc(null);
        setATitle("");
        setADesc("");
        setAUnit("");
        setAStatus("SUBMITTED");
        setAStartDate("");
        setAEndDate("");
        setAActualEndDate("");
        setFile(null);
        setIsArcOpen(true);
    };

    const openEditArc = (a: any) => {
        setEditingArc(a);
        setATitle(a.title);
        setADesc(a.description);
        setAUnit(a.unit_id || "");
        setAStatus(a.status);
        setAStartDate(a.estimated_start_date || "");
        setAEndDate(a.estimated_end_date || "");
        setAActualEndDate(a.actual_end_date || "");
        setFile(null);
        setIsArcOpen(true);
    };

    const createArc = useMutation({
        mutationFn: (body: any) => apiPostJson<any>("/arc-requests", body),
        onSuccess: async () => {
            setIsArcOpen(false);
            setATitle("");
            setADesc("");
            setAUnit("");
            setAStatus("SUBMITTED");
            setAStartDate("");
            setAEndDate("");
            setAActualEndDate("");
            setFile(null);
            toast({ title: "Request Submitted", description: "ARC request sent for approval." });
            await qc.invalidateQueries({ queryKey: ["arcRequests"] });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" })
    });

    const updateArc = useMutation({
        mutationFn: (vars: { id: string, body: any }) => apiPatchJson(`/arc-requests/${vars.id}`, vars.body),
        onSuccess: async () => {
            setIsArcOpen(false);
            toast({ title: "Updated", description: "ARC Request updated." });
            await qc.invalidateQueries({ queryKey: ["arcRequests"] });
        }
    });

    const deleteArc = useMutation({
        mutationFn: (id: string) => apiDelete(`/arc-requests/${id}`),
        onSuccess: async () => {
            toast({ title: "Deleted", description: "ARC request removed" });
            await qc.invalidateQueries({ queryKey: ["arcRequests"] });
        }
    });

    const handleArcSubmit = async () => {
        const parsed = arcSchema.safeParse({ title: aTitle, description: aDesc });
        if (!parsed.success) {
            toast({ title: "Validation Error", description: "Title & Desc required", variant: "destructive" });
            return;
        }

        let attachmentUrl = editingArc?.attachment_url;
        if (file) {
            try {
                setUploading(true);
                attachmentUrl = await uploadFile(file);
            } catch (e: any) {
                setUploading(false);
                toast({ title: "Upload Failed", description: e.message, variant: "destructive" });
                return;
            } finally { setUploading(false); }
        }

        if (editingArc) {
            updateArc.mutate({
                id: editingArc.id,
                body: {
                    title: aTitle,
                    description: aDesc,
                    status: aStatus,
                    attachment_url: attachmentUrl,
                    estimated_start_date: aStartDate || null,
                    estimated_end_date: aEndDate || null,
                    actual_end_date: aActualEndDate || null,
                    unit_id: aUnit || undefined
                }
            });
        } else {
            createArc.mutate({
                ...parsed.data,
                attachment_url: attachmentUrl,
                unit_id: aUnit || undefined,
                estimated_start_date: aStartDate || null,
                estimated_end_date: aEndDate || null
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "COMPLETED":
            case "RESOLVED":
            case "APPROVED":
                return (
                    <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 border-none shadow-sm">
                        <CheckCircle className="mr-1 h-3 w-3" /> {status}
                    </Badge>
                );
            case "IN_PROGRESS":
                return (
                    <Badge className="bg-gradient-to-r from-blue-500 to-cyan-600 border-none shadow-sm">
                        <Timer className="mr-1 h-3 w-3" /> In Progress
                    </Badge>
                );
            case "REJECTED":
                return (
                    <Badge className="bg-gradient-to-r from-red-500 to-pink-600 border-none shadow-sm">
                        <XCircle className="mr-1 h-3 w-3" /> {status}
                    </Badge>
                );
            default:
                return (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-400">
                        <Clock className="mr-1 h-3 w-3" /> {status}
                    </Badge>
                );
        }
    };

    return (
        <div className="flex-1 space-y-6 p-4 md:p-6 lg:p-8 pt-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="relative">
                {/* Decorative gradient */}
                <div className="absolute -top-10 -left-10 w-72 h-72 bg-primary/10 rounded-full blur-[100px] -z-10" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                            <span className="text-xs font-semibold text-primary uppercase tracking-wider">Management</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                            Requests & Issues
                        </h2>
                        <p className="text-muted-foreground">Track and manage community requests</p>
                    </div>

                    {activeTab === "work-orders" && !isReadOnly && (
                        <Button onClick={openCreateWO} className="shadow-lg shadow-primary/25">
                            <Plus className="mr-2 h-4 w-4" /> New {workOrderLabel}
                        </Button>
                    )}
                    {activeTab === "arc" && isHOA && (
                        <Button onClick={openCreateArc} className="shadow-lg shadow-primary/25">
                            <Plus className="mr-2 h-4 w-4" /> New ARC Request
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="work-orders" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600">
                        {workOrderTabLabel}
                    </TabsTrigger>
                    {isHOA && (
                        <TabsTrigger value="arc" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-blue-600">
                            ARC
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* WORK ORDERS TAB */}
                <TabsContent value="work-orders" className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {workOrders.isLoading ? (
                            <>
                                {[1, 2, 3].map(i => (
                                    <Card key={i} className="bg-card w-full shadow-sm rounded-xl border">
                                      <CardHeader className="pb-3 border-b border-border/10">
                                         <div className="flex gap-2">
                                            <Skeleton className="h-4 w-1/2" />
                                            <Skeleton className="h-4 w-1/4 ml-auto" />
                                         </div>
                                         <Skeleton className="h-2 w-1/3 mt-2" />
                                         <Skeleton className="h-6 w-24 rounded-full mt-2" />
                                      </CardHeader>
                                      <CardContent className="pt-4">
                                         <Skeleton className="h-3 w-full mb-1" />
                                         <Skeleton className="h-3 w-2/3" />
                                         <Skeleton className="h-2 w-1/2 mt-4" />
                                      </CardContent>
                                    </Card>
                                ))}
                            </>
                        ) : (workOrders.data?.length === 0) ? (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-2xl bg-gradient-to-br from-muted/20 to-muted/5">
                                <div className="p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl mb-4">
                                    <Wrench className="h-12 w-12 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-1">No {workOrderTabLabel}</h3>
                                <p className="text-sm text-muted-foreground">Request queue is empty.</p>
                            </div>
                        ) : (
                            (workOrders.data ?? []).map((w: any) => (
                                <Card
                                    key={w.id}
                                    className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/50 bg-card/50 backdrop-blur-sm overflow-hidden relative"
                                    onClick={(e) => {
                                        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).tagName === 'A') return;
                                        openEditWO(w);
                                    }}
                                >
                                    {/* Gradient overlay on hover */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    <CardHeader className="pb-3 relative z-10">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                                <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 shrink-0">
                                                    <Wrench className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <CardTitle className="text-base font-semibold leading-tight group-hover:text-primary transition-colors truncate">
                                                        {w.title}
                                                    </CardTitle>
                                                    <CardDescription className="text-xs mt-1">ID: {w.id.substring(0, 8)}</CardDescription>
                                                </div>
                                            </div>
                                            {(isAdmin || isBoard) && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm("Delete this work order?")) deleteWO.mutate(w.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="mt-2">
                                            {getStatusBadge(w.status)}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="relative z-10">
                                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{w.description}</p>
                                        {w.user_name && (
                                            <p className="text-xs font-medium mt-3 flex items-center gap-1">
                                                <span className="text-muted-foreground">By</span> {w.user_name}
                                            </p>
                                        )}
                                        {w.attachment_url && (
                                            <a
                                                href={getFullUrl(w.attachment_url)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-3 text-xs flex items-center gap-2 text-primary hover:underline font-medium"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Paperclip className="h-3 w-3" /> View Attachment
                                            </a>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>



                {/* ARC TAB */}
                <TabsContent value="arc" className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {arcs.isLoading ? (
                            <>
                                {[1, 2, 3].map(i => (
                                    <Card key={i} className="bg-card w-full shadow-sm rounded-xl border">
                                      <CardHeader className="pb-3 border-b border-border/10">
                                         <div className="flex gap-2">
                                            <Skeleton className="h-4 w-1/2" />
                                            <Skeleton className="h-4 w-1/4 ml-auto" />
                                         </div>
                                         <Skeleton className="h-6 w-24 rounded-full mt-2" />
                                      </CardHeader>
                                      <CardContent className="pt-4">
                                         <Skeleton className="h-3 w-full mb-1" />
                                         <Skeleton className="h-3 w-2/3" />
                                         <Skeleton className="h-2 w-1/2 mt-4" />
                                      </CardContent>
                                    </Card>
                                ))}
                            </>
                        ) : (arcs.data?.length === 0) ? (
                            <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-2xl bg-gradient-to-br from-muted/20 to-muted/5">
                                <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl mb-4">
                                    <Paintbrush className="h-12 w-12 text-muted-foreground/50" />
                                </div>
                                <h3 className="text-lg font-semibold text-foreground mb-1">No ARC Requests</h3>
                                <p className="text-sm text-muted-foreground">No architectural requests pending.</p>
                            </div>
                        ) : (
                            (arcs.data ?? []).map((a: any) => (
                                <Card
                                    key={a.id}
                                    className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:border-primary/50 bg-card/50 backdrop-blur-sm overflow-hidden relative"
                                    onClick={(e) => {
                                        if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).tagName === 'A') return;
                                        openEditArc(a);
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    <CardHeader className="pb-3 relative z-10">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-start gap-2 flex-1 min-w-0">
                                                <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/10 shrink-0">
                                                    <Paintbrush className="h-4 w-4 text-purple-600" />
                                                </div>
                                                <div className="font-semibold text-base group-hover:text-primary transition-colors truncate">{a.title}</div>
                                            </div>
                                            {(isAdmin || isBoard) && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (confirm("Delete this request?")) deleteArc.mutate(a.id);
                                                    }}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="mt-2">
                                            {getStatusBadge(a.status)}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="relative z-10">
                                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{a.description}</p>

                                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                            {a.estimated_start_date && (
                                                <div className="flex flex-col">
                                                    <span className="text-muted-foreground font-medium">Est. Start</span>
                                                    <span>{a.estimated_start_date}</span>
                                                </div>
                                            )}
                                            {a.estimated_end_date && (
                                                <div className="flex flex-col">
                                                    <span className="text-muted-foreground font-medium">Est. End</span>
                                                    <span>{a.estimated_end_date}</span>
                                                </div>
                                            )}
                                            {a.actual_end_date && (
                                                <div className="flex flex-col col-span-2 mt-1">
                                                    <span className="text-muted-foreground font-medium">Actual Completion</span>
                                                    <span className="font-semibold text-emerald-600">{a.actual_end_date}</span>
                                                </div>
                                            )}
                                        </div>

                                        {a.user_name && (
                                            <p className="text-xs font-medium mt-3 flex items-center gap-1">
                                                <span className="text-muted-foreground">Requested by</span> {a.user_name}
                                            </p>
                                        )}
                                        {a.attachment_url && (
                                            <a
                                                href={getFullUrl(a.attachment_url)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mt-3 text-xs flex items-center gap-2 text-primary hover:underline font-medium"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Paperclip className="h-3 w-3" /> View Document
                                            </a>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* WORK ORDER DIALOG */}
            <Dialog open={isWODialogOpen} onOpenChange={setIsWODialogOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{editingWO ? `Edit ${workOrderLabel}` : `Create ${workOrderLabel}`}</DialogTitle>
                        <DialogDescription>Submit a {isHOA ? "general request" : "maintenance request"} to the community.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label className="text-sm font-semibold">Title</Label>
                            <Input placeholder="Brief summary" value={woTitle} onChange={(e) => setWOTitle(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-sm font-semibold">Description</Label>
                            <Textarea placeholder="Provide details about the issue..." value={woDesc} onChange={(e) => setWODesc(e.target.value)} className="h-32" />
                        </div>
                        {isAdmin && !editingWO && (
                            <div className="grid gap-2">
                                <Label className="text-sm font-semibold">Unit</Label>
                                <Select value={woUnitId} onValueChange={setWOUnitId}>
                                    <SelectTrigger><SelectValue placeholder="Select Unit" /></SelectTrigger>
                                    <SelectContent>
                                        {(units.data ?? []).map((u: any) => (
                                            <SelectItem key={u.id} value={u.id}>{u.unit_number}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label className="text-sm font-semibold">Attachment</Label>
                            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                            {editingWO?.attachment_url && !file && (
                                <div className="mt-2 text-xs">
                                    <a href={getFullUrl(editingWO.attachment_url)} target="_blank" className="text-primary hover:underline">View Current Attachment</a>
                                </div>
                            )}
                        </div>
                        {(isAdmin || isBoard || editingWO) && (
                            <div className="grid gap-2">
                                <Label className="text-sm font-semibold">Status</Label>
                                <Select value={woStatus} onValueChange={setWOStatus} disabled={(!isAdmin && !isBoard) && editingWO}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="NEW">New</SelectItem>
                                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                                        <SelectItem value="COMPLETED">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsWODialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleWOSubmit} disabled={createWO.isPending || updateWO.isPending || uploading}>
                            {uploading ? "Uploading..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* VIOLATION DIALOG */}
            <Dialog open={isViolationOpen} onOpenChange={setIsViolationOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{editingViolation ? "Edit Violation" : "Report Violation"}</DialogTitle>
                        <DialogDescription>Report a compliance issue in the community.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label className="text-sm font-semibold">Offending Unit / Area (Optional)</Label>
                            {isAdmin || isBoard ? (
                                <Select value={vUnit} onValueChange={setVUnit} disabled={!!editingViolation && !isAdmin}>
                                    <SelectTrigger><SelectValue placeholder="Select Unit" /></SelectTrigger>
                                    <SelectContent>
                                        {units.data?.map((u: any) => (
                                            <SelectItem key={u.id} value={u.id}>
                                                {u.building_name ? `${u.building_name} - ${u.unit_number}` : u.unit_number}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    placeholder="E.g. Unit 2B, or Pool Area"
                                    value={vUnitAlt}
                                    onChange={(e) => setVUnitAlt(e.target.value)}
                                />
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-sm font-semibold">Type</Label>
                            <Select value={vType} onValueChange={setVType}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Noise">Noise Complaint</SelectItem>
                                    <SelectItem value="Parking">Parking Violation</SelectItem>
                                    <SelectItem value="Trash">Trash/Debris</SelectItem>
                                    <SelectItem value="Pet">Pet Violation</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-sm font-semibold">Description</Label>
                            <Textarea placeholder="Describe the violation..." value={vDesc} onChange={(e) => setVDesc(e.target.value)} className="h-32" />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-sm font-semibold">Evidence (Optional)</Label>
                            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                            {editingViolation?.attachment_url && !file && (
                                <div className="mt-2 text-xs">
                                    <a href={getFullUrl(editingViolation.attachment_url)} target="_blank" className="text-primary hover:underline">View Evidence</a>
                                </div>
                            )}
                        </div>
                        {(isAdmin || isBoard) && (
                            <div className="grid gap-2">
                                <Label className="text-sm font-semibold">Status</Label>
                                <Select value={vStatus} onValueChange={setVStatus}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="OPEN">Open</SelectItem>
                                        <SelectItem value="RESOLVED">Resolved</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViolationOpen(false)}>Cancel</Button>
                        <Button onClick={handleViolationSubmit} disabled={createViolation.isPending || updateViolation.isPending || uploading}>
                            {uploading ? "Uploading..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ARC DIALOG */}
            <Dialog open={isArcOpen} onOpenChange={setIsArcOpen}>
                <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold">{editingArc ? "Edit ARC Request" : "New ARC Request"}</DialogTitle>
                        <DialogDescription>Submit an architectural review request.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {(isAdmin || isBoard) && (
                            <div className="grid gap-2">
                                <Label className="text-sm font-semibold">Unit</Label>
                                <Select value={aUnit} onValueChange={setAUnit} disabled={!!editingArc && !isAdmin}>
                                    <SelectTrigger><SelectValue placeholder="Select Unit" /></SelectTrigger>
                                    <SelectContent>
                                        {(units.data ?? []).map((u: any) => (
                                            <SelectItem key={u.id} value={u.id}>
                                                {u.building_name ? `${u.building_name} - ${u.unit_number}` : u.unit_number}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label className="text-sm font-semibold">Title</Label>
                            <Input placeholder="Project title" value={aTitle} onChange={(e) => setATitle(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-sm font-semibold">Description</Label>
                            <Textarea placeholder="Describe the proposed changes..." value={aDesc} onChange={(e) => setADesc(e.target.value)} className="h-32" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-sm font-semibold">Est. Start</Label>
                                <Input type="date" value={aStartDate} onChange={(e) => setAStartDate(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-sm font-semibold">Est. End</Label>
                                <Input type="date" value={aEndDate} onChange={(e) => setAEndDate(e.target.value)} />
                            </div>
                        </div>

                        {editingArc && (isAdmin || isBoard) && (
                            <div className="grid gap-2 border-t pt-4">
                                <Label className="text-sm font-semibold text-emerald-600">Actual Completion Date</Label>
                                <Input type="date" value={aActualEndDate} onChange={(e) => setAActualEndDate(e.target.value)} />
                                <p className="text-[10px] text-muted-foreground">Automatically set when approved/rejected, but you can override.</p>
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label className="text-sm font-semibold">Plans/Documents</Label>
                            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                            {editingArc?.attachment_url && !file && (
                                <div className="mt-2 text-xs">
                                    <a href={getFullUrl(editingArc.attachment_url)} target="_blank" className="text-primary hover:underline">View Document</a>
                                </div>
                            )}
                        </div>
                        {(isAdmin || isBoard) && (
                            <div className="grid gap-2">
                                <Label className="text-sm font-semibold">Status</Label>
                                <Select value={aStatus} onValueChange={setAStatus}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SUBMITTED">Submitted</SelectItem>
                                        <SelectItem value="APPROVED">Approved</SelectItem>
                                        <SelectItem value="REJECTED">Rejected</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsArcOpen(false)}>Cancel</Button>
                        <Button onClick={handleArcSubmit} disabled={createArc.isPending || updateArc.isPending || uploading}>
                            {uploading ? "Uploading..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function RequestsPage() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <RequestsContent />
        </Suspense>
    );
}
