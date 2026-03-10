"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPostJson, apiPutJson, apiDelete } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Megaphone, Edit2, Trash2 } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function PlatformAnnouncementsPage() {
    const { data: session }: any = useSession();
    const queryClient = useQueryClient();

    // Queries
    const { data: announcements, isLoading } = useQuery({
        queryKey: ["platform", "announcements"],
        queryFn: () => apiGet<any[]>("/announcements")
    });

    // Form State
    const [title, setTitle] = useState("");
    const [body, setBody] = useState("");

    const [editingAnn, setEditingAnn] = useState<any>(null);
    const [deletingAnn, setDeletingAnn] = useState<any>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editBody, setEditBody] = useState("");

    // Mutations
    const createAnnouncement = useMutation({
        mutationFn: async () => apiPostJson("/announcements", {
            title,
            body,
            audience: "ALL", // Default to ALL (means all in this tenant i.e. Platform)
            publish: true
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["platform", "announcements"] });
            setTitle("");
            setBody("");
        }
    });

    const updateAnnouncement = useMutation({
        mutationFn: (vars: { id: string, body: any }) => apiPutJson<any>(`/announcements/${vars.id}`, vars.body),
        onSuccess: async () => {
            setEditingAnn(null);
            await queryClient.invalidateQueries({ queryKey: ["platform", "announcements"] });
        },
    });

    const deleteAnnouncement = useMutation({
        mutationFn: (id: string) => apiDelete<any>(`/announcements/${id}`),
        onSuccess: async () => {
            setDeletingAnn(null);
            await queryClient.invalidateQueries({ queryKey: ["platform", "announcements"] });
        },
    });

    return (
        <div className="flex-1 space-y-4 p-4 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Super Admin Updates</h2>
            </div>
            <p className="text-muted-foreground">
                Announcements posted here are visible ONLY to other Super Admins.
            </p>

            <Card className="border-primary/20 bg-primary/5">
                <CardHeader>
                    <CardTitle>Post Update</CardTitle>
                    <CardDescription>Share important information with other Platform Admins.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Input placeholder="Subject" value={title} onChange={(e) => setTitle(e.target.value)} />
                    <Textarea placeholder="Message content..." value={body} onChange={(e) => setBody(e.target.value)} />
                    <Button onClick={() => createAnnouncement.mutate()} disabled={!title || !body || createAnnouncement.isPending}>
                        {createAnnouncement.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Megaphone className="mr-2 h-4 w-4" />}
                        Post Update
                    </Button>
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <div className="col-span-full flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : (
                    announcements?.length === 0 ? (
                        <div className="col-span-full text-center p-8 text-muted-foreground border border-dashed rounded-lg">
                            No updates yet.
                        </div>
                    ) : (
                        announcements?.map((a: any) => (
                            <Card key={a.id} className="relative group">
                                <CardHeader>
                                    <div className="flex justify-between">
                                        <CardTitle className="text-lg">{a.title}</CardTitle>
                                        <Badge variant="outline">Admin</Badge>
                                    </div>
                                    <CardDescription>{new Date(a.published_at || a.created_at).toLocaleDateString()}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="whitespace-pre-wrap text-sm">{a.body}</p>
                                </CardContent>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <Button variant="outline" size="icon" className="h-8 w-8 bg-background" onClick={() => {
                                        setEditTitle(a.title);
                                        setEditBody(a.body);
                                        setEditingAnn(a);
                                    }}>
                                        <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => setDeletingAnn(a)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))
                    )
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingAnn} onOpenChange={(open) => !open && setEditingAnn(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Announcement</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input placeholder="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
                        <Textarea placeholder="Content" value={editBody} onChange={(e) => setEditBody(e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingAnn(null)}>Cancel</Button>
                        <Button disabled={updateAnnouncement.isPending} onClick={() => {
                            if (editingAnn) updateAnnouncement.mutate({ id: editingAnn.id, body: { title: editTitle, body: editBody, audience: "ALL", publish: true } });
                        }}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!deletingAnn} onOpenChange={(open) => !open && setDeletingAnn(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Announcement?</DialogTitle>
                        <DialogDescription>Are you sure? This cannot be undone.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeletingAnn(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => {
                            if (deletingAnn) deleteAnnouncement.mutate(deletingAnn.id);
                        }}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
