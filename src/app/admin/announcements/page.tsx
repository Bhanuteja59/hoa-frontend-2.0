"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPostJson, apiPutJson, apiDelete } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Loader2, Megaphone, Edit2, Trash2, ArrowLeft, Send } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useState } from "react";
import Link from "next/link";

function Skeleton({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded-xl admin-surface-2 ${className}`} />;
}

export default function PlatformAnnouncementsPage() {
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
            audience: "ALL",
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
        <div className="p-6 lg:p-8 space-y-8 min-h-screen">
            {/* Header */}
            <div className="flex flex-col gap-4">
                <Link href="/admin/dashboard">
                    <button className="flex items-center gap-2 text-xs admin-muted hover:admin-text transition-colors">
                        <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
                    </button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black admin-text tracking-tight">System Updates</h1>
                    <p className="admin-muted text-sm mt-1 flex items-center gap-2">
                        <Megaphone className="h-3.5 w-3.5 text-violet-400" />
                        Internal communications for Super Admins
                    </p>
                </div>
            </div>

            {/* Post Update Card */}
            <div className="rounded-2xl border admin-border admin-glass p-6 space-y-5 bg-gradient-to-br from-violet-500/5 to-transparent">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                        <Send className="h-5 w-5 text-violet-400" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold admin-text">Broadcast New Update</h3>
                        <p className="text-xs admin-muted">Public system-wide notifications for the platform</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-4">
                        <div className="sm:col-span-1">
                            <label className="text-[10px] uppercase tracking-widest font-black admin-muted ml-1 mb-1.5 block">Subject</label>
                            <input
                                placeholder="e.g. Server Maintenance"
                                value={title} onChange={(e) => setTitle(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl admin-input text-sm"
                            />
                        </div>
                        <div className="sm:col-span-3">
                            <label className="text-[10px] uppercase tracking-widest font-black admin-muted ml-1 mb-1.5 block">Message Body</label>
                            <textarea
                                placeholder="Describe the update in detail..."
                                value={body} onChange={(e) => setBody(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl admin-input text-sm min-h-[100px] resize-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={() => createAnnouncement.mutate()}
                            disabled={!title || !body || createAnnouncement.isPending}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-bold shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50"
                        >
                            {createAnnouncement.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Megaphone className="h-4 w-4" />}
                            Post Announcement
                        </button>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {isLoading ? (
                    [...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)
                ) : announcements?.length === 0 ? (
                    <div className="col-span-full py-20 flex flex-col items-center gap-3 admin-muted bg-admin-surface-2 rounded-2xl border border-dashed admin-border">
                        <Megaphone className="h-10 w-10 opacity-20" />
                        <p className="text-sm font-medium">No system updates yet</p>
                    </div>
                ) : (
                    announcements?.map((a: any) => (
                        <div key={a.id} className="group relative rounded-2xl border admin-border admin-glass p-6 hover:admin-surface-2 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="font-bold admin-text pr-12 line-clamp-1">{a.title}</h4>
                                    <p className="text-[10px] admin-muted font-medium mt-1 uppercase tracking-wider">
                                        {new Date(a.published_at || a.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                    </p>
                                </div>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 uppercase">
                                    Admin
                                </span>
                            </div>

                            <p className="text-sm admin-muted line-clamp-4 whitespace-pre-wrap min-h-[80px]">{a.body}</p>

                            <div className="absolute top-4 right-4 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => {
                                        setEditTitle(a.title);
                                        setEditBody(a.body);
                                        setEditingAnn(a);
                                    }}
                                    className="h-8 w-8 rounded-lg admin-surface-btn flex items-center justify-center admin-muted hover:text-violet-400 transition-all"
                                >
                                    <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => setDeletingAnn(a)}
                                    className="h-8 w-8 rounded-lg admin-surface-btn flex items-center justify-center text-rose-400/50 hover:text-rose-400 transition-all"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editingAnn} onOpenChange={(open) => !open && setEditingAnn(null)}>
                <DialogContent className="admin-glass border admin-border">
                    <DialogHeader>
                        <DialogTitle className="admin-text">Edit Announcement</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-widest font-black admin-muted">Subject</label>
                            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full px-4 py-2 rounded-xl admin-input text-sm" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-widest font-black admin-muted">Content</label>
                            <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} className="w-full px-4 py-2 rounded-xl admin-input text-sm min-h-[150px] resize-none" />
                        </div>
                    </div>
                    <DialogFooter>
                        <button onClick={() => setEditingAnn(null)} className="px-4 py-2 rounded-xl admin-muted hover:admin-text font-bold transition-colors">Cancel</button>
                        <button
                            disabled={updateAnnouncement.isPending}
                            onClick={() => {
                                if (editingAnn) updateAnnouncement.mutate({ id: editingAnn.id, body: { title: editTitle, body: editBody, audience: "ALL", publish: true } });
                            }}
                            className="px-6 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all"
                        >
                            Save Changes
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={!!deletingAnn} onOpenChange={(open) => !open && setDeletingAnn(null)}>
                <DialogContent className="admin-glass border admin-border">
                    <DialogHeader>
                        <DialogTitle className="text-rose-400">Delete Announcement?</DialogTitle>
                        <DialogDescription className="admin-muted">This action is permanent and will remove the broadcast signal immediately.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                        <button onClick={() => setDeletingAnn(null)} className="px-4 py-2 rounded-xl admin-muted hover:admin-text font-bold transition-colors">Cancel</button>
                        <button
                            onClick={() => { if (deletingAnn) deleteAnnouncement.mutate(deletingAnn.id); }}
                            className="px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all"
                        >
                            Delete Broadcast
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
