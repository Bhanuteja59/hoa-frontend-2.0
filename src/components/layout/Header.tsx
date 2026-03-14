"use client";

import {
    LogOut,
    Menu,
    Search,
    User,
    Building2,
    Bell,
    Info,
    CheckCircle2,
    AlertCircle,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { ModeToggle } from "@/components/mode-toggle";
import Sidebar from "@/components/layout/Sidebar";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";

export default function Header() {
    const { data: session } = useSession();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const qc = useQueryClient();

    const dummyNotifications = [
        { id: 1, title: "Maintenance Request Update", text: "Your request for 'Plumbing Leak' has been assigned.", time: "10m ago", icon: Info, color: "text-blue-500" },
        { id: 2, title: "Payment Received", text: "Your January dues have been processed successfully.", time: "2h ago", icon: CheckCircle2, color: "text-emerald-500" },
        { id: 3, title: "New Announcement", text: "Upcoming pool maintenance scheduled for next week.", time: "5h ago", icon: AlertCircle, color: "text-amber-500" },
    ];

    const userInitials =
        session?.user?.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            ?.toUpperCase() || "U";

    const [isScrolled, setIsScrolled] = useState(false);
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header className={cn(
            "sticky top-0 z-50 transition-all duration-500",
            isScrolled 
                ? "border-b bg-background/80 backdrop-blur-xl py-0 shadow-sm" 
                : "bg-transparent py-2 border-transparent"
        )}>
            <div className={cn(
                "mx-auto flex max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8 transition-all duration-500",
                isScrolled ? "h-14" : "h-20"
            )}>

                <div className="flex items-center gap-4">
                    {/* LEFT — MENU (Only if logged in) */}
                    {session && (
                        <Sheet open={open} onOpenChange={setOpen}>
                            <SheetTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-lg md:hidden hover:bg-primary/10 transition-colors"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="p-0 [&>button]:hidden">
                                <Sidebar onNavigate={() => setOpen(false)} />
                            </SheetContent>
                        </Sheet>
                    )}

                    {/* LOGO */}
                    <div
                        className="flex items-center gap-2.5 font-bold text-xl tracking-tight cursor-pointer group"
                        onClick={() => {
                            if (!session) {
                                router.push("/");
                                return;
                            }
                            // @ts-ignore
                            if (session.user?.isPlatformAdmin) {
                                router.push("/admin/dashboard");
                            } else {
                                router.push("/dashboard");
                            }
                        }}
                    >
                        <div className="p-2 rounded-xl bg-gradient-to-br from-primary/15 to-blue-600/15 text-primary transition-all duration-300 group-hover:from-primary/25 group-hover:to-blue-600/25 group-hover:shadow-md group-hover:shadow-primary/20 group-hover:scale-105">
                            <Building2 className="h-5 w-5" />
                        </div>
                        <span className="hidden sm:inline-block bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent group-hover:from-primary group-hover:via-blue-600 group-hover:to-purple-600 transition-all duration-300">
                            HOA Platform
                        </span>
                    </div>
                </div>

                {/* SEARCH (Only if logged in) */}
                {session && (
                    <div className="hidden md:flex relative items-center max-w-md w-full mx-auto px-4">
                        <Search className="absolute left-7 h-4 w-4 text-muted-foreground/70 transition-colors peer-focus:text-primary" />
                        <Input
                            type="search"
                            placeholder="Search documents, events..."
                            className={cn(
                                "h-10 w-full peer",
                                "rounded-full",
                                "border-[2px] border-gray-500",
                                "bg-muted/40",
                                "pl-10 pr-4",
                                "text-sm",
                                "transition-all duration-300",
                                "placeholder:text-muted-foreground/60",
                                "hover:bg-muted/60",
                                "focus:bg-background",
                                "focus:ring-2",
                                "focus:ring-primary/30",
                                "focus:shadow-lg",
                                "focus:shadow-primary/10"
                            )}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && e.currentTarget.value.trim()) {
                                    router.push(
                                        `/dashboard/search?q=${encodeURIComponent(
                                            e.currentTarget.value
                                        )}`
                                    );
                                }
                            }}
                        />
                    </div>
                )}

                {/* RIGHT — ACTIONS */}
                <div className="flex items-center gap-2">
                    <ModeToggle />

                    {session ? (
                        <>
                            <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                                <SheetTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full h-10 w-10 relative hover:bg-primary/10 transition-colors"
                                    >
                                        <Bell className="h-5 w-5 text-muted-foreground" />
                                        <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-primary border-2 border-background animate-pulse" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[350px] sm:w-[450px] p-0 rounded-l-2xl border-l shadow-2xl">
                                    <div className="flex flex-col h-full bg-background">
                                        <SheetHeader className="p-6 border-b">
                                            <div className="flex items-center justify-between">
                                                <SheetTitle className="text-2xl font-bold flex items-center gap-2">
                                                    <Bell className="h-6 w-6 text-primary" /> Notifications
                                                </SheetTitle>
                                            </div>
                                            <SheetDescription>
                                                Stay up to date with the latest from your community.
                                            </SheetDescription>
                                        </SheetHeader>

                                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                            {dummyNotifications.map((n) => (
                                                <div key={n.id} className="p-4 rounded-xl border bg-card/50 hover:bg-card transition-all cursor-pointer group hover:shadow-md">
                                                    <div className="flex gap-4">
                                                        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shrink-0 bg-muted/50", n.color)}>
                                                            <n.icon className="h-5 w-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="font-semibold text-sm truncate">{n.title}</h4>
                                                                <span className="text-[10px] text-muted-foreground font-medium">{n.time}</span>
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.text}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            <div className="pt-8 flex flex-col items-center justify-center text-center px-6 opacity-60">
                                                <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                                                    <Bell className="h-6 w-6 text-primary/40" />
                                                </div>
                                                <p className="text-sm font-medium">End of notifications</p>
                                                <p className="text-xs mt-1">We&apos;ll let you know when there&apos;s more.</p>
                                            </div>
                                        </div>

                                        <div className="p-4 border-t">
                                            <Button className="w-full rounded-xl font-bold" variant="outline" onClick={() => setNotificationsOpen(false)}>
                                                Mark all as Read
                                            </Button>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full h-10 w-10 ring-2 ring-border/50 hover:ring-primary/40 transition-all duration-300 hover:shadow-md hover:shadow-primary/10"
                                    >
                                        <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary via-blue-600 to-purple-600 text-xs font-bold text-primary-foreground shadow-inner">
                                            {userInitials}
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>

                                <DropdownMenuContent
                                    align="end"
                                    className="w-64 rounded-xl border-border/50 shadow-xl bg-background/95 backdrop-blur-xl"
                                >
                                    <DropdownMenuLabel className="pb-3">
                                        <div className="flex flex-col space-y-1.5">
                                            <p className="text-sm font-semibold leading-none bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                                                {session?.user?.name || "User"}
                                            </p>
                                            <p className="text-xs text-muted-foreground leading-none">
                                                {session?.user?.email}
                                            </p>
                                        </div>
                                    </DropdownMenuLabel>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                        onClick={() => router.push("/dashboard/settings")}
                                        className="cursor-pointer rounded-lg my-1 transition-colors hover:bg-primary/10 focus:bg-primary/10"
                                    >
                                        <User className="mr-2 h-4 w-4 text-primary" />
                                        <span className="font-medium">Profile</span>
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                        onClick={() => {
                                            qc.clear();
                                            signOut({ callbackUrl: "/" });
                                        }}
                                        className="text-destructive focus:text-destructive cursor-pointer rounded-lg my-1 transition-colors hover:bg-destructive/10 focus:bg-destructive/10"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span className="font-medium">Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <Button
                            onClick={() => router.push("/login")}
                            className="rounded-full px-6 font-semibold shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-105"
                        >
                            Log In
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
