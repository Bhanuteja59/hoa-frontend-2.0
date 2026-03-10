"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    FileArchive,
    ClipboardList,
    CreditCard,
    Users,
    Megaphone,
    Settings,
    LogOut,
    Shield,
    Activity,
    Building2,
    X,
    Calendar,
    FolderOpen,
    HelpCircle,
    HeartPulse,
    BarChart3,
    Layers,
    Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

interface SidebarProps {
    className?: string;
    onClose?: () => void;
    onNavigate?: () => void; // Added for compatibility with Header.tsx
}

interface SidebarItem {
    name: string;
    href: string;
    icon: any;
    allowedRoles?: string[];
    isPlatformOnly?: boolean;
}

const sidebarItems: SidebarItem[] = [
    { name: "Home", href: "/dashboard", icon: LayoutDashboard },
    { name: "Requests", href: "/dashboard/requests", icon: ClipboardList },
    { name: "Calendar & Events", href: "/dashboard/calendar-events", icon: Calendar },
    { name: "Documents", href: "/dashboard/documents", icon: FolderOpen },
    { name: "Community Directory", href: "/dashboard/residents-units", icon: Users, allowedRoles: ["ADMIN", "BOARD_ADMIN", "BOARD", "BOARD_MEMBER", "HOA_BOARD_MEMBER"] },
    { name: "FAQ", href: "/dashboard/faq", icon: HelpCircle },
    { name: "Pay Dues", href: "/dashboard/pay-dues", icon: CreditCard },

    // ── Super Admin section ──────────────────────
    { name: "Platform Dashboard", href: "/admin/dashboard", icon: Activity, isPlatformOnly: true },
    { name: "All Communities", href: "/admin/communities", icon: Building2, isPlatformOnly: true },
    { name: "Platform Users", href: "/admin/users", icon: Users, isPlatformOnly: true },
    { name: "Buildings & Units", href: "/admin/buildings", icon: Layers, isPlatformOnly: true },
    { name: "Community Health", href: "/admin/health", icon: HeartPulse, isPlatformOnly: true },
    { name: "Flow Analytics", href: "/admin/analytics", icon: BarChart3, isPlatformOnly: true },
];

export default function Sidebar({ className, onClose, onNavigate }: SidebarProps) {
    const pathname = usePathname();
    const { data: session }: any = useSession();
    const isSuperAdmin = session?.user?.isPlatformAdmin;
    const userRoles = session?.roles || [];
    const qc = useQueryClient();

    // Use either onClose or onNavigate, defaulting to whichever is provided
    const handleClose = onClose || onNavigate;

    // Access Control Check
    const hasAccess = session?.user; // Allow all authenticated users by default

    if (!hasAccess) {
        return (
            <aside className={cn("h-full w-64 flex-col bg-background/95 backdrop-blur-xl border-r shadow-2xl p-6", className)}>
                <div className="rounded-xl border bg-card/80 backdrop-blur-lg text-card-foreground shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/20 w-full">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <h3 className="text-2xl font-semibold leading-none tracking-tight">Access Denied</h3>
                        <p className="text-sm text-muted-foreground">This page is only accessible to administrators.</p>
                    </div>
                </div>
            </aside>
        );
    }

    return (
        <aside
            className={cn(
                "h-full w-64 flex-col bg-background/95 backdrop-blur-xl border-r shadow-2xl transition-all duration-300",
                className
            )}
        >
            {/* HEADER */}
            <div className="flex h-16 items-center justify-between border-b border-border/40 px-6">
                <Link
                    href="/dashboard"
                    onClick={handleClose}
                    className="flex items-center gap-3 font-bold text-lg tracking-tight hover:opacity-80 transition-opacity group"
                >
                    <div className="p-2 rounded-xl bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                        <Building2 className="h-5 w-5" />
                    </div>
                    <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">HOA Platform</span>
                </Link>

                {/* CLOSE BUTTON (Mobile Only) */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClose}
                    className="md:hidden text-muted-foreground hover:text-destructive transition-colors -mr-2"
                >
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close sidebar</span>
                </Button>
            </div>

            {/* NAV */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                {isSuperAdmin && (
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/50 px-3 pb-3">
                        Platform Control
                    </p>
                )}
                <div className="space-y-1">
                    {sidebarItems.map((item) => {
                        // Platform Admin Check
                        if (item.isPlatformOnly && !isSuperAdmin) return null;
                        if (isSuperAdmin && !item.isPlatformOnly) return null;

                        // Role-based Access Control
                        if (item.allowedRoles && !item.allowedRoles.some(role => userRoles.includes(role)) && !isSuperAdmin) {
                            return null;
                        }

                        const Icon = item.icon;
                        const isActive = item.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname === item.href || pathname.startsWith(item.href + "/");

                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                onClick={handleClose}
                                className={cn(
                                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out overflow-hidden",
                                    isActive
                                        ? "bg-primary/10 text-primary shadow-sm"
                                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground hover:shadow-sm"
                                )}
                            >
                                {/* Active Indicator Line */}
                                {isActive && (
                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-primary" />
                                )}

                                <Icon
                                    className={cn(
                                        "h-5 w-5 shrink-0 transition-transform duration-300",
                                        isActive ? "text-primary scale-110" : "group-hover:scale-110 group-hover:text-primary/70"
                                    )}
                                />
                                <span className={cn("truncate transition-all duration-300", isActive && "font-semibold")}>
                                    {item.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* FOOTER */}
            <div className="mt-auto p-4 border-t border-border/40 bg-muted/5">
                <div className="flex items-center gap-3 mb-4 px-2">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary via-primary/80 to-primary/60 flex items-center justify-center text-sm font-bold text-primary-foreground shadow-sm ring-2 ring-background">
                        {session?.user?.name?.substring(0, 2).toUpperCase() || "U"}
                    </div>
                    <div className="overflow-hidden">
                        <p className="truncate text-sm font-medium leading-none">{session?.user?.name || "User"}</p>
                        <p className="truncate text-xs text-muted-foreground mt-1">{session?.tenant_name || "Resident"}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={() => {
                        qc.clear();
                        signOut({ callbackUrl: "/" });
                    }}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </aside>
    );
}
