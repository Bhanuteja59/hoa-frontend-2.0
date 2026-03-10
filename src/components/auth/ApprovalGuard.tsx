"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function ApprovalGuard({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.replace("/login");
        }
    }, [status, router]);

    // Fetch latest status
    const { data: me, isLoading } = useQuery({
        queryKey: ["auth", "me"],
        queryFn: async () => {
            const res = await api.get<any>("/auth/me");
            return res;
        },
        enabled: !!session,
        // Refetch often to detect approval
        refetchInterval: 5000
    });

    // Prevent rendering children if unauthenticated to avoid flashes on logout/back browser button
    if (status === "unauthenticated") {
        return null;
    }

    if (isLoading) return null; // Or skeleton

    // If active or admin (admins shouldn't be pending usually), show children
    if (me?.status === "active" || !me?.status /* legacy */ || me?.roles?.includes("ADMIN")) {
        return <>{children}</>;
    }

    if (me?.status === "rejected") {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-100 p-4">
                <Dialog open={true}>
                    <DialogContent className="sm:max-w-md" hideClose>
                        <DialogHeader>
                            <DialogTitle>Access Denied</DialogTitle>
                            <DialogDescription>
                                Your request to join this community was declined by the administrator.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex justify-center pt-4">
                            <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
                                <LogOut className="mr-2 h-4 w-4" /> Sign Out
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        )
    }

    // Default: Pending
    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-100 p-4">
            <Dialog open={true}>
                <DialogContent className="sm:max-w-md" hideClose>
                    <DialogHeader>
                        <DialogTitle>Waiting for Approval</DialogTitle>
                        <DialogDescription>
                            Your account is currently pending approval from the community administrator.
                            Please check back later. This page will update automatically once approved.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center pt-4">
                        <Button variant="outline" onClick={() => signOut()}>
                            <LogOut className="mr-2 h-4 w-4" /> Sign Out
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
