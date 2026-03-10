"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Wrench, Megaphone, FileText, AlertTriangle, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";

    const { data, isLoading } = useQuery({
        queryKey: ["search", query],
        queryFn: () => apiGet<any>(`/search/global?q=${encodeURIComponent(query)}`),
        enabled: query.length >= 2,
    });

    if (!query) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <p>Enter a search term to begin.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Search Results: &quot;{query}&quot;</h2>

            {isLoading && (
                <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )}

            {data && (
                <div className="space-y-6">
                    {/* Navigation Matches */}
                    {data.navigation?.length > 0 && (
                        <Card className="bg-muted/50 border-primary/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <LinkIcon className="h-4 w-4" /> Suggested Pages
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-2">
                                {data.navigation.map((n: any, i: number) => (
                                    <Link
                                        key={i}
                                        href={n.url}
                                        className="flex items-center justify-between p-3 rounded-md bg-background border hover:border-primary/50 transition-colors"
                                    >
                                        <span className="font-medium">{n.title}</span>
                                        <span className="text-xs text-muted-foreground uppercase">{n.type}</span>
                                    </Link>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Residents */}
                    {data.residents?.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" /> Residents
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {data.residents.map((r: any) => (
                                    <div key={r.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                        <div>
                                            <p className="font-medium">{r.name}</p>
                                            <p className="text-sm text-muted-foreground">{r.email}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Work Orders */}
                    {data.work_orders?.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Wrench className="h-5 w-5" /> Work Orders
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {data.work_orders.map((w: any) => (
                                    <div key={w.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                        <div>
                                            <Link href="/dashboard/requests" className="font-medium hover:underline">{w.title}</Link>
                                            <p className="text-xs text-muted-foreground">ID: {w.id.substring(0, 8)}</p>
                                        </div>
                                        <Badge variant={w.status === "COMPLETED" ? "secondary" : "default"}>{w.status}</Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Announcements */}
                    {data.announcements?.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Megaphone className="h-5 w-5" /> Announcements
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {data.announcements.map((a: any) => (
                                    <div key={a.id} className="border-b pb-2 last:border-0 last:pb-0">
                                        <Link href="/dashboard/announcements-documents" className="font-medium hover:underline">{a.title}</Link>
                                        <p className="text-xs text-muted-foreground">{new Date(a.published_at).toLocaleDateString()}</p>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Documents */}
                    {data.documents?.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" /> Documents
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {data.documents.map((d: any) => (
                                    <div key={d.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                        <div>
                                            <Link href="/dashboard/announcements-documents" className="font-medium hover:underline">{d.title}</Link>
                                            <p className="text-xs text-muted-foreground">{d.filename}</p>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Violations */}
                    {data.violations?.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" /> Violations
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {data.violations.map((v: any) => (
                                    <div key={v.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                        <p className="font-medium">{v.description}</p>
                                        <Badge variant="destructive">{v.status}</Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Empty State */}
                    {!data.residents?.length && !data.work_orders?.length && !data.announcements?.length && !data.documents?.length && !data.violations?.length && (
                        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground border border-dashed rounded-lg">
                            <p>No results found for &quot;{query}&quot;.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SearchResults />
        </Suspense>
    );
}
