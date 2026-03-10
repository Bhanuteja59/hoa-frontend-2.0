"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiDelete, apiPostMultipart, apiPostMultipartWithProgress, api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    FileText,
    Trash2,
    Upload,
    Eye,
    Folder,
    FolderOpen,
    FolderPlus,
    ChevronRight,
    Home,
    MoreHorizontal,
    FilePlus,
    AlertCircle,
    Pencil,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ─────────────────────────────────────────────────────────

interface FolderItem {
    id: string;
    name: string;
    parent_id: string | null;
    created_at: string;
}

interface DocumentItem {
    id: string;
    title: string;
    filename: string;
    mime_type: string;
    size_bytes: number;
    acl: string;
    folder_id: string | null;
    created_at: string;
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function buildBreadcrumbs(folders: FolderItem[], currentId: string | null): FolderItem[] {
    if (!currentId) return [];
    const map = Object.fromEntries(folders.map((f) => [f.id, f]));
    const path: FolderItem[] = [];
    let cur: FolderItem | undefined = map[currentId];
    while (cur) {
        path.unshift(cur);
        cur = cur.parent_id ? map[cur.parent_id] : undefined;
    }
    return path;
}

// ─── Component ──────────────────────────────────────────────────────

export default function DocumentsPage() {
    const { data: session }: any = useSession();
    const roles: string[] = session?.roles ?? [];
    const isAdmin = roles.includes("ADMIN") || roles.includes("BOARD") || roles.includes("BOARD_MEMBER");
    const isElevated = isAdmin; // alias for semantic clarity
    const { toast } = useToast();
    const qc = useQueryClient();

    // Navigation state
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);

    // Dialog states
    const [createFolderOpen, setCreateFolderOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");

    const [renameFolderTarget, setRenameFolderTarget] = useState<FolderItem | null>(null);
    const [renameFolderName, setRenameFolderName] = useState("");

    const [deleteFolderTarget, setDeleteFolderTarget] = useState<FolderItem | null>(null);

    const [uploadOpen, setUploadOpen] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadTitle, setUploadTitle] = useState("");
    const [uploadAcl, setUploadAcl] = useState("RESIDENT_VISIBLE");
    const [uploadProgress, setUploadProgress] = useState(0);

    const [deleteDocTarget, setDeleteDocTarget] = useState<DocumentItem | null>(null);
    const [viewingDoc, setViewingDoc] = useState<DocumentItem | null>(null);
    const [documentUrl, setDocumentUrl] = useState<string | null>(null);

    // ─── Queries ────────────────────────────────────────────────────

    const { data: folders = [], isLoading: foldersLoading } = useQuery({
        queryKey: ["document-folders"],
        queryFn: () => apiGet<FolderItem[]>("/documents/folders"),
    });

    const { data: documents = [], isLoading: docsLoading } = useQuery({
        queryKey: ["documents", currentFolderId],
        queryFn: () =>
            apiGet<DocumentItem[]>(
                `/documents?folder_id=${currentFolderId ?? "root"}`
            ),
    });

    // Folders at current level
    const currentSubFolders = folders.filter(
        (f) => (f.parent_id ?? null) === currentFolderId
    );

    const breadcrumbs = buildBreadcrumbs(folders, currentFolderId);

    // ─── Fetch doc token for viewing ─────────────────────────────────

    React.useEffect(() => {
        if (!viewingDoc) { setDocumentUrl(null); return; }
        apiGet<{ token: string; url: string }>(`/documents/${viewingDoc.id}/token`)
            .then(({ url }) => {
                const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api/v1";
                // URL already starts with /documents
                const cleanApiBase = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
                const cleanUrl = url.startsWith("/") ? url : `/${url}`;
                const fullUrl = `${cleanApiBase}${cleanUrl}`;
                setDocumentUrl(fullUrl);
            })
            .catch(() => setDocumentUrl("ERROR"));
    }, [viewingDoc]);

    // ─── Mutations ───────────────────────────────────────────────────

    const createFolderMut = useMutation({
        mutationFn: () =>
            api.post("/documents/folders", { name: newFolderName, parent_id: currentFolderId }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["document-folders"] });
            setCreateFolderOpen(false);
            setNewFolderName("");
            toast({ title: "Folder created" });
        },
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });

    const renameFolderMut = useMutation({
        mutationFn: () =>
            api.patch(`/documents/folders/${renameFolderTarget?.id}`, { name: renameFolderName }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["document-folders"] });
            setRenameFolderTarget(null);
            toast({ title: "Folder renamed" });
        },
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });

    const deleteFolderMut = useMutation({
        mutationFn: (target: FolderItem) => apiDelete(`/documents/folders/${target.id}`),
        onSuccess: (_data, target) => {
            qc.invalidateQueries({ queryKey: ["document-folders"] });
            qc.invalidateQueries({ queryKey: ["documents"] });
            setDeleteFolderTarget(null);
            // Navigate up if we deleted the current folder
            if (target.id === currentFolderId) setCurrentFolderId(null);
            toast({ title: "Folder deleted" });
        },
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });

    const uploadMut = useMutation({
        mutationFn: async () => {
            if (!uploadFile) throw new Error("No file selected");
            const fd = new FormData();
            fd.append("file", uploadFile);
            fd.append("title", uploadTitle);
            fd.append("acl", uploadAcl);
            if (currentFolderId) fd.append("folder_id", currentFolderId);
            setUploadProgress(0);
            return apiPostMultipartWithProgress("/documents", fd, (e) => {
                if (e.lengthComputable) {
                    setUploadProgress(Math.round((e.loaded * 100) / e.total));
                }
            });
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["documents"] });
            setUploadOpen(false);
            setUploadFile(null);
            setUploadTitle("");
            setUploadProgress(0);
            toast({ title: "Document uploaded" });
        },
        onError: (e: any) => {
            setUploadProgress(0);
            toast({ title: "Upload failed", description: e.message, variant: "destructive" });
        },
    });

    const deleteDocMut = useMutation({
        mutationFn: (target: DocumentItem) => apiDelete(`/documents/${target.id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["documents"] });
            setDeleteDocTarget(null);
            toast({ title: "Document deleted" });
        },
        onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
    });

    // ─── Render ──────────────────────────────────────────────────────

    const isLoading = foldersLoading || docsLoading;

    return (
        <div className="flex flex-col h-full p-6 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        Community document repository
                    </p>
                </div>
                {isAdmin && (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setCreateFolderOpen(true)} className="gap-2">
                            <FolderPlus className="h-4 w-4" />
                            New Folder
                        </Button>
                        <Button onClick={() => setUploadOpen(true)} className="gap-2">
                            <Upload className="h-4 w-4" />
                            Upload Document
                        </Button>
                    </div>
                )}
            </div>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
                <button
                    onClick={() => setCurrentFolderId(null)}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                >
                    <Home className="h-3.5 w-3.5" />
                    <span>Root</span>
                </button>
                {breadcrumbs.map((crumb) => (
                    <React.Fragment key={crumb.id}>
                        <ChevronRight className="h-3.5 w-3.5" />
                        <button
                            onClick={() => setCurrentFolderId(crumb.id)}
                            className="hover:text-foreground transition-colors font-medium"
                        >
                            {crumb.name}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            <Card className="flex-1 p-6">
                {isLoading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="flex flex-col items-center gap-2 p-4 border rounded-xl shadow-sm">
                                <Skeleton className="h-12 w-12 rounded-lg" />
                                <Skeleton className="h-4 w-3/4 mt-2" />
                            </div>
                        ))}
                    </div>
                ) : currentSubFolders.length === 0 && documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center border-2 border-dashed rounded-xl">
                        <FolderOpen className="h-12 w-12 text-muted-foreground mb-3" />
                        <h3 className="font-semibold text-lg">
                            {currentFolderId ? "This folder is empty" : "No folders or documents yet"}
                        </h3>
                        {isAdmin && (
                            <p className="text-sm text-muted-foreground mt-1">
                                Create a folder or upload a document to get started.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {/* Folders */}
                        {currentSubFolders.map((folder) => (
                            <div key={folder.id} className="group relative">
                                <button
                                    className="w-full flex flex-col items-center gap-2 p-4 rounded-xl border border-transparent hover:border-border hover:bg-accent/40 transition-all"
                                    onDoubleClick={() => setCurrentFolderId(folder.id)}
                                    onClick={() => setCurrentFolderId(folder.id)}
                                >
                                    <FolderOpen className="h-12 w-12 text-amber-400" />
                                    <span className="text-sm font-medium text-center truncate w-full" title={folder.name}>
                                        {folder.name}
                                    </span>
                                </button>
                                {isAdmin && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => {
                                                setRenameFolderTarget(folder);
                                                setRenameFolderName(folder.name);
                                            }}>
                                                <Pencil className="h-3.5 w-3.5 mr-2" /> Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => setDeleteFolderTarget(folder)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>
                        ))}

                        {/* Documents */}
                        {documents.map((doc) => (
                            <div key={doc.id} className="group relative">
                                <button
                                    className="w-full flex flex-col items-center gap-2 p-4 rounded-xl border border-transparent hover:border-border hover:bg-accent/40 transition-all"
                                    onClick={() => setViewingDoc(doc)}
                                >
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <FileText className="h-7 w-7 text-primary" />
                                    </div>
                                    <span className="text-sm font-medium text-center truncate w-full" title={doc.title}>
                                        {doc.title}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{formatBytes(doc.size_bytes)}</span>
                                </button>
                                {isAdmin && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setViewingDoc(doc)}>
                                                <Eye className="h-3.5 w-3.5 mr-2" /> View
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => setDeleteDocTarget(doc)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                                {!isAdmin && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => setViewingDoc(doc)}
                                    >
                                        <Eye className="h-3 w-3" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {/* ── Create Folder Dialog ── */}
            <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FolderPlus className="h-5 w-5" /> New Folder
                        </DialogTitle>
                        <DialogDescription>
                            Create a new folder{currentFolderId ? " inside the current folder" : " at the root level"}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-2 py-2">
                        <Label>Folder Name</Label>
                        <Input
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            placeholder="e.g. Rules & Regulations"
                            onKeyDown={(e) => e.key === "Enter" && createFolderMut.mutate()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => createFolderMut.mutate()}
                            disabled={createFolderMut.isPending || !newFolderName.trim()}
                        >
                            {createFolderMut.isPending ? "Creating..." : "Create Folder"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Rename Folder Dialog ── */}
            <Dialog open={!!renameFolderTarget} onOpenChange={(o) => !o && setRenameFolderTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rename Folder</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-2 py-2">
                        <Label>New Name</Label>
                        <Input
                            value={renameFolderName}
                            onChange={(e) => setRenameFolderName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && renameFolderMut.mutate()}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenameFolderTarget(null)}>Cancel</Button>
                        <Button
                            onClick={() => renameFolderMut.mutate()}
                            disabled={renameFolderMut.isPending || !renameFolderName.trim()}
                        >
                            {renameFolderMut.isPending ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete Folder Dialog ── */}
            <Dialog open={!!deleteFolderTarget} onOpenChange={(o) => !o && setDeleteFolderTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" /> Delete Folder?
                        </DialogTitle>
                        <DialogDescription>
                            Permanently delete <strong>&quot;{deleteFolderTarget?.name}&quot;</strong> and
                            all its subfolders and documents? This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteFolderTarget(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteFolderTarget && deleteFolderMut.mutate(deleteFolderTarget)}
                            disabled={deleteFolderMut.isPending}
                        >
                            {deleteFolderMut.isPending ? "Deleting..." : "Delete Folder"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Upload Document Dialog ── */}
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FilePlus className="h-5 w-5" /> Upload Document
                        </DialogTitle>
                        <DialogDescription>
                            Uploading to:{" "}
                            <strong>
                                {breadcrumbs.length > 0
                                    ? breadcrumbs.map((b) => b.name).join(" / ")
                                    : "Root"}
                            </strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-2">
                        <div className="grid gap-2">
                            <Label>Title</Label>
                            <Input value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="Document title" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Visibility</Label>
                            <Select value={uploadAcl} onValueChange={setUploadAcl}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="RESIDENT_VISIBLE">All Residents</SelectItem>
                                    <SelectItem value="BOARD_ONLY">Board Only</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>File</Label>
                            <Input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} />
                        </div>
                        {uploadMut.isPending && (
                            <div className="space-y-2 mt-2">
                                <div className="flex justify-between text-sm">
                                    <span>Uploading...</span>
                                    <span>{uploadProgress}%</span>
                                </div>
                                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploadMut.isPending}>Cancel</Button>
                        <Button
                            onClick={() => uploadMut.mutate()}
                            disabled={uploadMut.isPending || !uploadFile || !uploadTitle.trim()}
                        >
                            {uploadMut.isPending ? "Uploading..." : "Upload"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Delete Document Confirmation ── */}
            <Dialog open={!!deleteDocTarget} onOpenChange={(o) => !o && setDeleteDocTarget(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Document?</DialogTitle>
                        <DialogDescription>
                            Permanently delete &quot;{deleteDocTarget?.title}&quot;? This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDocTarget(null)}>Cancel</Button>
                        <Button
                            variant="destructive"
                            onClick={() => deleteDocTarget && deleteDocMut.mutate(deleteDocTarget)}
                            disabled={deleteDocMut.isPending}
                        >
                            {deleteDocMut.isPending ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── View Document Dialog ── */}
            <Dialog open={!!viewingDoc} onOpenChange={(o) => !o && setViewingDoc(null)}>
                <DialogContent className="w-[95vw] max-w-4xl p-4 sm:p-6 sm:max-w-4xl h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col">
                    <DialogHeader className="flex-none">
                        <DialogTitle className="truncate pr-6">{viewingDoc?.title}</DialogTitle>
                    </DialogHeader>
                    <div className="flex-1 w-full overflow-hidden bg-muted/20 rounded-md flex items-center justify-center relative min-h-[50vh]">
                        {viewingDoc && documentUrl && documentUrl !== "ERROR" ? (
                            <div className="w-full h-full absolute inset-0">
                                {viewingDoc.mime_type === "application/pdf" ||
                                    viewingDoc.filename.toLowerCase().endsWith(".pdf") ? (
                                    <iframe src={documentUrl} className="w-full h-full border-0 rounded-md" />
                                ) : viewingDoc.mime_type?.startsWith("image/") ||
                                    /\.(jpg|jpeg|png|gif|webp)$/i.test(viewingDoc.filename) ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={documentUrl} alt={viewingDoc.title} className="w-full h-full object-contain" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-center p-4">
                                        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <p>Preview not available for this file type.</p>
                                        <Button
                                            className="mt-4"
                                            onClick={() => {
                                                const a = document.createElement("a");
                                                a.href = documentUrl;
                                                a.download = viewingDoc.filename;
                                                document.body.appendChild(a);
                                                a.click();
                                                document.body.removeChild(a);
                                            }}
                                        >
                                            Download File
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-muted-foreground">
                                    {documentUrl === "ERROR" ? "Failed to load document." : "Loading..."}
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2 sm:justify-end mt-4">
                        {documentUrl && documentUrl !== "ERROR" && (
                            <Button
                                variant="default"
                                onClick={() => {
                                    const a = document.createElement("a");
                                    a.href = documentUrl;
                                    a.download = viewingDoc?.filename || "document";
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                }}
                            >
                                Save Document
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => setViewingDoc(null)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
