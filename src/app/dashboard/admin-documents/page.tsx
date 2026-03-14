"use client";

import React, { useState } from "react";
import { useSession, getSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiDelete, api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Trash2, HardDrive, FileArchive, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminDocumentStats {
  total_count: number;
  total_size_bytes: number;
}

interface AdminDocument {
  id: string;
  title: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  acl: string;
  created_at: string;
}

export default function AdminDocumentsPage() {
  const { data: session, status }: any = useSession();
  const roles: string[] = session?.roles ?? [];
  const isAdmin = roles.includes("ADMIN");
  const { toast } = useToast();
  const qc = useQueryClient();

  const [deletingDoc, setDeletingDoc] = useState<AdminDocument | null>(null);
  const [viewingDoc, setViewingDoc] = useState<AdminDocument | null>(null);
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);

  // Fetch doc token for viewing
  React.useEffect(() => {
    let bUrl: string | null = null;
    if (!viewingDoc) {
      setDocumentUrl(null);
      return;
    }
    apiGet<{ token: string; url: string }>(`/documents/${viewingDoc.id}/token`)
      .then(async ({ url }) => {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api/v1";
        // URL already starts with /documents
        const cleanApiBase = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
        const cleanUrl = url.startsWith("/") ? url : `/${url}`;
        const fullUrl = `${cleanApiBase}${cleanUrl}`;

        const isPreviewable =
          viewingDoc.mime_type === "application/pdf" ||
          viewingDoc.mime_type.startsWith("image/") ||
          viewingDoc.mime_type.startsWith("text/") ||
          viewingDoc.filename.toLowerCase().endsWith(".pdf");

        if (isPreviewable) {
          try {
            // Use api.getBlob to include Auth/Tenant headers (fixing 401)
            const blob = await api.getBlob(url);
            bUrl = URL.createObjectURL(blob);
            setDocumentUrl(bUrl);
          } catch (e) {
            console.warn("Failed to fetch PDF blob, falling back:", e);
            setDocumentUrl(fullUrl);
          }
        } else {
          setDocumentUrl(fullUrl);
        }
      })
      .catch((error) => {
        console.warn("Document file not available:", error);
        setDocumentUrl("ERROR");
      });

    return () => {
      if (bUrl) URL.revokeObjectURL(bUrl);
    };
  }, [viewingDoc]);

  // Queries - Unconditional
  const stats = useQuery({
    queryKey: ["admin-document-stats"],
    queryFn: () => apiGet<AdminDocumentStats>("/documents/my-stats"),
    enabled: isAdmin,
    retry: 1,
  });

  const documents = useQuery({
    queryKey: ["admin-documents"],
    queryFn: () => apiGet<AdminDocument[]>("/documents/my-documents"),
    enabled: isAdmin,
    retry: 1,
  });

  // Delete mutation - Unconditional
  const deleteDoc = useMutation({
    mutationFn: (id: string) => apiDelete<any>(`/documents/${id}`),
    onSuccess: async () => {
      setDeletingDoc(null);
      toast({
        title: "Success",
        description: "Document deleted successfully.",
      });
      await qc.invalidateQueries({ queryKey: ["admin-document-stats"] });
      await qc.invalidateQueries({ queryKey: ["admin-documents"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  // Helper function
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Conditional Renders
  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You do not have permission to view this page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">My Documents</h2>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Documents
            </CardTitle>
            <FileArchive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.isLoading ? <Skeleton className="h-8 w-16" /> : stats.isError ? "Error" : stats.data?.total_count ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.isError ? (stats.error as Error)?.message : "Documents uploaded by you"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Storage Used
            </CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.isLoading
                ? <Skeleton className="h-8 w-24" />
                : stats.isError
                  ? "Error"
                  : formatBytes(stats.data?.total_size_bytes ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.isError ? (stats.error as Error)?.message : "Storage consumed by your documents"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Uploaded Documents</CardTitle>
          <CardDescription>
            View and manage all documents you have uploaded to the system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {documents.isLoading ? (
            <div className="space-y-4 py-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 border rounded-xl shadow-sm">
                  <Skeleton className="h-10 w-10 shrink-0" />
                  <div className="space-y-2 flex-grow">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="h-6 w-24 shrink-0" />
                </div>
              ))}
            </div>
          ) : documents.isError ? (
            <div className="text-center py-4 text-destructive">
              Error loading documents: {(documents.error as Error).message}
            </div>
          ) : documents.data?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No documents found.
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Document
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Size
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Uploaded
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {documents.data?.map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b transition-colors hover:bg-muted/50"
                    >
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{doc.title}</span>
                        </div>
                        <div className="text-xs text-muted-foreground pl-6">
                          {doc.filename}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        {formatBytes(doc.size_bytes)}
                      </td>
                      <td className="p-4 align-middle">
                        <Badge variant="outline">{doc.mime_type}</Badge>
                      </td>
                      <td className="p-4 align-middle">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setViewingDoc(doc)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingDoc(doc)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deletingDoc}
        onOpenChange={(open) => !open && setDeletingDoc(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deletingDoc?.title}&quot;? This
              action cannot be undone and will remove the document from the
              system permanently.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingDoc(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteDoc.isPending}
              onClick={() => {
                if (deletingDoc) deleteDoc.mutate(deletingDoc.id);
              }}
            >
              {deleteDoc.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Dialog */}
      <Dialog
        open={!!viewingDoc}
        onOpenChange={(open) => !open && setViewingDoc(null)}
      >
        <DialogContent className="w-[95vw] max-w-4xl p-4 sm:p-6 sm:max-w-4xl h-[90vh] sm:h-auto sm:max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-none">
            <DialogTitle className="truncate pr-6">{viewingDoc?.title}</DialogTitle>
            <DialogDescription className="truncate">{viewingDoc?.filename}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 w-full overflow-hidden bg-muted/20 rounded-md flex items-center justify-center relative min-h-[50vh]">
            {viewingDoc && (
              <div className="w-full h-full absolute inset-0">
                {!documentUrl ? (
                  <div className="flex items-center justify-center h-full">
                    <p>Loading document...</p>
                  </div>
                ) : documentUrl === "ERROR" ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">Document File Not Found</h3>
                    <p className="text-sm text-muted-foreground mt-2">The file content could not be loaded.</p>
                  </div>
                ) : viewingDoc.mime_type === "application/pdf" ? (
                  <iframe
                    src={documentUrl}
                    className="w-full h-full border-0 rounded-md"
                    title={viewingDoc.title}
                  />
                ) : viewingDoc.mime_type.startsWith("image/") ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={documentUrl}
                    alt={viewingDoc.title}
                    className="w-full h-full object-contain"
                  />
                ) : viewingDoc.mime_type.startsWith("text/") ? (
                  <iframe
                    src={documentUrl}
                    className="w-full h-full border-0 bg-white p-4 rounded-md"
                    title={viewingDoc.title}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">
                      Preview Not Available
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      This file type cannot be previewed in the browser.
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => {
                        if (documentUrl) {
                          const a = document.createElement("a");
                          a.href = documentUrl;
                          a.download = viewingDoc.filename;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                        }
                      }}
                    >
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
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
