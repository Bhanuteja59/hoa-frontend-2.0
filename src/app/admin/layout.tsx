"use client";

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard, Building2, Users, Layers,
    HeartPulse, BarChart3, LogOut, ChevronRight,
    Bell, Menu, X, Shield, Sun, Moon, Activity,
    UserCircle2, Info, CheckCircle2, AlertCircle,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";

/* ─── Theme Hook with Hydration protection ─── */
function useAdminTheme() {
    const [theme, setTheme] = useState<"dark" | "light">("light");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const stored = localStorage.getItem("admin-theme") as "dark" | "light";
        if (stored) setTheme(stored);
    }, []);

    const toggle = () => {
        const next = theme === "dark" ? "light" : "dark";
        setTheme(next);
        localStorage.setItem("admin-theme", next);
    };

    return { theme, toggle, mounted };
}

/* ─── CSS Variables injected on the wrapper via data attr ─── */
const DARK_VARS = {
    "--admin-bg": "#0a0a0f",
    "--admin-surface": "rgba(255,255,255,0.03)",
    "--admin-surface-2": "rgba(255,255,255,0.06)",
    "--admin-border": "rgba(255,255,255,0.08)",
    "--admin-text": "rgba(255,255,255,0.92)",
    "--admin-muted": "rgba(255,255,255,0.38)",
    "--admin-sidebar-bg": "rgba(13,13,23,0.97)",
    "--admin-input-bg": "rgba(255,255,255,0.05)",
    "--admin-input-border": "rgba(255,255,255,0.12)",
    "--admin-orb1": "rgba(124,58,237,0.18)",
    "--admin-orb2": "rgba(59,130,246,0.12)",
};
const LIGHT_VARS = {
    "--admin-bg": "#f9fafb",
    "--admin-surface": "rgba(255,255,255,0.9)",
    "--admin-surface-2": "rgba(99,102,241,0.04)",
    "--admin-border": "rgba(99,102,241,0.1)",
    "--admin-text": "#111827",
    "--admin-muted": "#6b7280",
    "--admin-sidebar-bg": "#ffffff",
    "--admin-input-bg": "#ffffff",
    "--admin-input-border": "rgba(99,102,241,0.15)",
    "--admin-orb1": "rgba(124,58,237,0.08)",
    "--admin-orb2": "rgba(59,130,246,0.06)",
};

const NAV_ITEMS = [
    {
        group: "Overview",
        items: [
            { label: "Platform Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, color: "from-violet-500 to-purple-600" },
            { label: "Flow Analytics", href: "/admin/analytics", icon: BarChart3, color: "from-blue-500 to-indigo-500" },
        ]
    },
    {
        group: "Communities",
        items: [
            { label: "All Communities", href: "/admin/communities", icon: Building2, color: "from-indigo-500 to-blue-600" },
            { label: "Community Health", href: "/admin/health", icon: HeartPulse, color: "from-rose-500 to-pink-600" },
            { label: "Buildings & Units", href: "/admin/buildings", icon: Layers, color: "from-amber-500 to-orange-500" },
        ]
    },
    {
        group: "People",
        items: [
            { label: "Platform Users", href: "/admin/users", icon: Users, color: "from-emerald-500 to-teal-600" },
            { label: "Admin Profile", href: "/admin/profile", icon: UserCircle2, color: "from-fuchsia-500 to-violet-600" },
        ]
    }
];

/* ─── Animated Background ─── */
function AnimatedBackground({ theme, mounted }: { theme: "dark" | "light"; mounted: boolean }) {
    if (!mounted) return null; // Ensure server & first client render are clean

    const gridColor = theme === "dark" ? "rgba(255,255,255,0.03)" : "rgba(99,102,241,0.04)";

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden>
            <div className="absolute inset-0" style={{ background: "var(--admin-bg)" }} />
            <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ background: "var(--admin-orb1)", animationDuration: "14s" }} />
            <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full blur-3xl animate-pulse" style={{ background: "var(--admin-orb2)", animationDuration: "16s", animationDelay: "1s" }} />
            <div className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse" style={{ background: "var(--admin-orb1)", animationDuration: "18s", animationDelay: "2s" }} />
            <div className="absolute inset-0"
                style={{ backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`, backgroundSize: "60px 60px" }}
            />
        </div>
    );
}

/* ─── Sidebar ─── */
function Sidebar({ isOpen, onClose, theme }: { isOpen: boolean; onClose: () => void; theme: "dark" | "light" }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session }: any = useSession();
    const qc = useQueryClient();

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 z-40 md:hidden" onClick={onClose}
                    style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
            )}

            <aside className={cn(
                "fixed left-0 top-0 h-full z-50 flex flex-col w-64 transition-transform duration-300 ease-in-out border-r",
                isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
            )} style={{ background: "var(--admin-sidebar-bg)", borderColor: "var(--admin-border)", backdropFilter: "blur(20px)" }}>

                {/* Brand */}
                <div className="h-16 flex items-center justify-between px-5 border-b" style={{ borderColor: "var(--admin-border)" }}>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/30">
                                <Shield className="h-4 w-4 text-white" />
                            </div>
                            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 animate-pulse" style={{ borderColor: "var(--admin-sidebar-bg)" }} />
                        </div>
                        <div>
                            <span className="font-bold text-sm tracking-tight" style={{ color: "var(--admin-text)" }}>HOA Control</span>
                            <p className="text-[10px] font-semibold text-violet-400">Super Admin</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="md:hidden transition-colors" style={{ color: "var(--admin-muted)" }}>
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-6 scrollbar-none">
                    {NAV_ITEMS.map(group => (
                        <div key={group.group}>
                            <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2" style={{ color: "var(--admin-muted)", opacity: 0.5 }}>
                                {group.group}
                            </p>
                            <div className="space-y-0.5">
                                {group.items.map(item => {
                                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                    const Icon = item.icon;
                                    return (
                                        <Link key={item.href} href={item.href} onClick={onClose}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative"
                                            style={isActive
                                                ? { background: "var(--admin-surface-2)", color: "var(--admin-text)" }
                                                : { color: "var(--admin-muted)" }
                                            }
                                        >
                                            {isActive && (
                                                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-0.5 rounded-full bg-gradient-to-b from-violet-400 to-purple-500" />
                                            )}
                                            <div className={cn(
                                                "h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200",
                                                isActive ? `bg-gradient-to-br ${item.color} shadow-lg` : ""
                                            )} style={!isActive ? { background: "var(--admin-surface-2)" } : {}}>
                                                <Icon className={cn("h-3.5 w-3.5", isActive ? "text-white" : "")}
                                                    style={!isActive ? { color: "var(--admin-muted)" } : {}} />
                                            </div>
                                            <span className={cn("transition-all", isActive && "font-semibold")}>{item.label}</span>
                                            {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto text-violet-400" />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t" style={{ borderColor: "var(--admin-border)" }}>
                    <Link href="/admin/profile" onClick={onClose}>
                        <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:admin-surface-2 transition-all cursor-pointer mb-2">
                            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-xs font-black text-white shadow-md shadow-violet-500/20 shrink-0">
                                {session?.user?.name?.substring(0, 2).toUpperCase() || "SA"}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-semibold truncate" style={{ color: "var(--admin-text)" }}>{session?.user?.name || "Super Admin"}</p>
                                <p className="text-xs text-violet-400 truncate">{session?.user?.email}</p>
                            </div>
                        </div>
                    </Link>
                    <button
                        onClick={() => { qc.clear(); signOut({ callbackUrl: "/" }); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-all duration-200 hover:bg-rose-500/15 hover:text-rose-600 dark:hover:text-rose-400"
                        style={{ color: "var(--admin-muted)" }}
                    >
                        <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}

/* ─── Top Bar ─── */
function TopBar({ onMenuClick, theme, toggleTheme, onNotificationClick }: { onMenuClick: () => void; theme: "dark" | "light"; toggleTheme: () => void; onNotificationClick: () => void }) {
    const pathname = usePathname();
    const { data: session }: any = useSession();
    const router = useRouter();

    const label = pathname.split("/").filter(Boolean).pop()
        ?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Dashboard";

    return (
        <header className="h-16 flex items-center justify-between px-6 border-b shrink-0"
            style={{ borderColor: "var(--admin-border)", background: "var(--admin-sidebar-bg)", backdropFilter: "blur(20px)" }}>
            <div className="flex items-center gap-4">
                <button onClick={onMenuClick}
                    className="md:hidden h-8 w-8 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: "var(--admin-surface-2)", color: "var(--admin-muted)" }}>
                    <Menu className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2 text-sm">
                    <span style={{ color: "var(--admin-muted)" }}>Platform</span>
                    <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--admin-muted)" }} />
                    <span className="font-semibold capitalize" style={{ color: "var(--admin-text)" }}>{label}</span>
                </div>
            </div>

            <div className="flex items-center gap-3">
                {/* Live indicator */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-400 border border-emerald-500/20" style={{ background: "rgba(16,185,129,0.08)" }}>
                    <Activity className="h-3.5 w-3.5 animate-pulse" /> Live
                </div>

                {/* Theme toggle */}
                <button onClick={toggleTheme}
                    className="h-9 w-9 rounded-xl flex items-center justify-center transition-all hover:scale-105"
                    style={{ background: "var(--admin-surface-2)", color: theme === "dark" ? "#fbbf24" : "#7c3aed" }}
                    title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                >
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>

                {/* Notification bell */}
                <button onClick={onNotificationClick} className="h-9 w-9 rounded-xl flex items-center justify-center transition-all relative"
                    style={{ background: "var(--admin-surface-2)", color: "var(--admin-muted)" }}>
                    <Bell className="h-4 w-4" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
                </button>

                {/* Avatar → profile */}
                <button onClick={() => router.push("/admin/profile")}
                    className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-violet-500/20 hover:scale-105 transition-all"
                    title="View profile">
                    {session?.user?.name?.substring(0, 2).toUpperCase() || "SA"}
                </button>
            </div>
        </header>
    );
}

/* ─── Root Layout ─── */
export default function AdminLayout({ children }: { children: ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const { theme, toggle, mounted } = useAdminTheme();

    // Force dark vars on server/first-render to match server stream
    const vars = (mounted && theme === "dark") ? DARK_VARS : LIGHT_VARS;

    const dummyNotifications = [
        { id: 1, title: "New Community Request", text: "Oakwood Estates is requesting platform access.", time: "2m ago", icon: Info, color: "text-blue-400" },
        { id: 2, title: "System Update", text: "Security patches have been applied successfully.", time: "1h ago", icon: CheckCircle2, color: "text-emerald-400" },
        { id: 3, title: "High Usage Alert", text: "Tenant 'Sunny Hills' is approaching storage limit.", time: "3h ago", icon: AlertCircle, color: "text-amber-400" },
    ];

    return (
        <div className={cn("relative min-h-screen overflow-hidden", theme === "dark" && "dark")} style={vars as any}>
            <AnimatedBackground theme={theme} mounted={mounted} />

            <div className="relative z-10 flex h-screen">
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} theme={theme} />

                <div className="flex flex-col flex-1 min-w-0 md:pl-64">
                    <TopBar onMenuClick={() => setSidebarOpen(true)} theme={theme} toggleTheme={toggle} onNotificationClick={() => setNotificationsOpen(true)} />
                    
                    <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                        <SheetContent side="right" className="w-[350px] sm:w-[450px] p-0 border-l border-white/10" style={{ background: "var(--admin-sidebar-bg)", backdropFilter: "blur(20px)" }}>
                            <div className="flex flex-col h-full">
                                <SheetHeader className="p-6 border-b" style={{ borderColor: "var(--admin-border)" }}>
                                    <SheetTitle className="text-xl font-bold flex items-center gap-2" style={{ color: "var(--admin-text)" }}>
                                        <Bell className="h-5 w-5 text-violet-400" /> Notifications
                                    </SheetTitle>
                                    <SheetDescription style={{ color: "var(--admin-muted)" }}>
                                        Stay updated with platform activities.
                                    </SheetDescription>
                                </SheetHeader>
                                
                                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                    {dummyNotifications.map((n) => (
                                        <div key={n.id} className="p-4 rounded-2xl border transition-all hover:scale-[1.02] cursor-pointer group" style={{ background: "var(--admin-surface-2)", borderColor: "var(--admin-border)" }}>
                                            <div className="flex gap-4">
                                                <div className={cn("h-10 w-10 rounded-xl bg-background/50 flex items-center justify-center shrink-0 border border-white/5", n.color)}>
                                                    <n.icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <h4 className="font-bold text-sm truncate" style={{ color: "var(--admin-text)" }}>{n.title}</h4>
                                                        <span className="text-[10px] font-medium" style={{ color: "var(--admin-muted)" }}>{n.time}</span>
                                                    </div>
                                                    <p className="text-xs leading-relaxed" style={{ color: "var(--admin-muted)" }}>{n.text}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    
                                    <div className="pt-10 flex flex-col items-center justify-center text-center px-10 opacity-40">
                                        <div className="h-16 w-16 rounded-3xl bg-violet-500/10 flex items-center justify-center mb-4">
                                            <Bell className="h-8 w-8 text-violet-400" />
                                        </div>
                                        <p className="text-sm font-medium" style={{ color: "var(--admin-text)" }}>No more notifications</p>
                                        <p className="text-xs mt-1" style={{ color: "var(--admin-muted)" }}>We&apos;ll notify you when something important happens.</p>
                                    </div>
                                </div>

                                <div className="p-4 border-t" style={{ borderColor: "var(--admin-border)" }}>
                                    <button className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-550 to-purple-650 text-white text-sm font-bold shadow-lg shadow-violet-500/20 hover:scale-[1.02] transition-all">
                                        Mark all as read
                                    </button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>

                    <main className="flex-1 overflow-auto" style={{ color: "var(--admin-text)" }}>
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
