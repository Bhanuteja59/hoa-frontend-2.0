"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { Command, Check, Building2, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useSession, signIn } from "next-auth/react";
import PreLoginFooter from "@/components/layout/PreLoginFooter";
import { useToast } from "@/hooks/use-toast";
import { apiPostJson } from "@/lib/api";

// Zod Schemas
const baseSchema = z.object({
    fullName: z.string().min(1, "Full Name is required"),
    email: z.string().email("Valid Email is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
});

const adminSchema = baseSchema.extend({
    role: z.literal("BOARD_ADMIN"),
    hoaName: z.string().min(1, "HOA Name is required to create a community"),
    phone: z.string().regex(/^\+?[0-9]{10,15}$/, "Valid Phone number (digits only, 10-15 digits) is required"),
    communityType: z.enum(["APARTMENTS", "OWN_HOUSES"])
});

const residentSchema = baseSchema.extend({
    role: z.enum(["RESIDENT", "HOA_BOARD_MEMBER"]),
    tenantSlug: z.string().min(1, "Community Code is required to join"),
    residentHoaName: z.string().optional()
});

export default function RegisterPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <RegisterForm />
        </Suspense>
    );
}

function RegisterForm() {
    // Form State
    const [role, setRole] = useState<"BOARD_ADMIN" | "RESIDENT" | "HOA_BOARD_MEMBER">("BOARD_ADMIN");
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Admin specific
    const [hoaName, setHoaName] = useState("");
    const [phone, setPhone] = useState("");
    const [communityType, setCommunityType] = useState<"APARTMENTS" | "OWN_HOUSES">("APARTMENTS");

    // Resident/Board Member specific
    const [tenantSlug, setTenantSlug] = useState("");
    const [residentHoaName, setResidentHoaName] = useState(""); // Optional display name
    const [registrationNumber, setRegistrationNumber] = useState(""); // 6-digit ID from board
    const [accountNumber, setAccountNumber] = useState(""); // 12-digit ID from board

    const [err, setErr] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { status } = useSession();
    const { toast } = useToast();

    const urlToken = searchParams.get("token");

    useEffect(() => {
        if (urlToken && role === "BOARD_ADMIN") {
            setRole("RESIDENT");
        }
    }, [urlToken, role]);

    useEffect(() => {
        if (status === "authenticated") {
            router.replace("/dashboard");
        }
    }, [status, router]);

    const handleRegister = async () => {
        setIsLoading(true);
        setErr(null);

        // Custom Validation
        if (!fullName.trim()) { setErr("Full Name is required"); setIsLoading(false); return; }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim() || !emailRegex.test(email)) { setErr("Valid Email is required"); setIsLoading(false); return; }

        // Password validation
        if (password.length < 8) { setErr("Password must be at least 8 characters"); setIsLoading(false); return; }
        if (!/[A-Z]/.test(password)) { setErr("Password must contain at least one uppercase letter"); setIsLoading(false); return; }
        if (!/[a-z]/.test(password)) { setErr("Password must contain at least one lowercase letter"); setIsLoading(false); return; }
        if (!/\d/.test(password)) { setErr("Password must contain at least one number"); setIsLoading(false); return; }
        if (password !== confirmPassword) { setErr("Passwords do not match"); setIsLoading(false); return; }

        let payload: any = {
            email,
            full_name: fullName,
            password,
            role,
        };

        if (role === "BOARD_ADMIN") {
            if (!hoaName.trim()) {
                setErr("HOA Name is required to create a community");
                setIsLoading(false);
                return;
            }
            if (!phone.trim()) {
                setErr("Phone number is required for Board Admins");
                setIsLoading(false);
                return;
            }
            const cleanPhone = phone.replace(/\D/g, '');
            if (cleanPhone.length < 10 || cleanPhone.length > 15) {
                setErr("Valid Phone number (10-15 digits) is required");
                setIsLoading(false);
                return;
            }
            payload.hoa_name = hoaName;
            payload.phone = cleanPhone;
            payload.community_type = communityType;
        } else {
            if (!tenantSlug.trim()) {
                setErr("Community Code is required to join");
                setIsLoading(false);
                return;
            }
            payload.tenant_slug = tenantSlug.toLowerCase();
            if (residentHoaName.trim()) {
                payload.hoa_name = residentHoaName;
            }
            if (registrationNumber.trim()) {
                payload.registration_number = registrationNumber;
            }
            if (accountNumber.trim()) {
                payload.account_number = accountNumber;
            }
            if (urlToken) {
                payload.token = urlToken;
            }
        }

        try {
            await apiPostJson("/auth/register", payload);

            toast({
                title: "Registration successful!",
                description: role === "BOARD_ADMIN" ? "Redirecting to your dashboard..." : "Please sign in with your new credentials.",
            });

            if (role === "BOARD_ADMIN") {
                const signInRes = await signIn("credentials", {
                    email,
                    password,
                    redirect: false,
                });

                if (signInRes?.error) {
                    router.push("/login?registered=true");
                } else {
                    router.push("/dashboard");
                    router.refresh();
                }
            } else {
                router.push("/login?registered=true");
            }
        } catch (e: any) {
            const errorMsg = e.message || "An unexpected error occurred.";
            setErr(errorMsg);
            toast({
                title: "Registration Failed",
                description: errorMsg,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div className="container relative min-h-[90vh] flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0 py-10">
                {/* Left Side (Banner) */}
                <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                    <div className="absolute inset-0 bg-zinc-900" />
                    <div
                        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"
                        style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
                    />
                    <div className="relative z-20 flex items-center text-lg font-medium">
                        <Command className="mr-2 h-6 w-6" />
                        HOA SaaS Platform
                    </div>
                    <div className="relative z-20 mt-auto">
                        <blockquote className="space-y-2">
                            <p className="text-lg">
                                &ldquo;Join thousands of communities managing their HOAs efficiently.&rdquo;
                            </p>
                        </blockquote>
                    </div>
                </div>

                {/* Right Side (Form) */}
                <div className="lg:p-8">
                    <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">

                        <div className="flex flex-col space-y-2 text-center">
                            <div className="flex items-center justify-center text-lg font-medium lg:hidden mb-2">
                                <Command className="mr-2 h-6 w-6" />
                                HOA SaaS Platform
                            </div>
                            <h1 className="text-2xl font-semibold tracking-tight">
                                Create an account
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Get started by selecting your role below.
                            </p>
                        </div>

                        <div className="grid gap-6">
                            {/* Role Selection Cards */}
                            <div className="grid grid-cols-3 gap-2">
                                <RoleCard
                                    id="admin"
                                    label="Board Admin"
                                    current={role}
                                    value="BOARD_ADMIN"
                                    icon={<Building2 className="h-5 w-5 mb-1" />}
                                    setRole={setRole}
                                />
                                <RoleCard
                                    id="resident"
                                    label="Resident"
                                    current={role}
                                    value="RESIDENT"
                                    icon={<User className="h-5 w-5 mb-1" />}
                                    setRole={setRole}
                                />
                                <RoleCard
                                    id="board_member"
                                    label="Board Member"
                                    current={role}
                                    value="HOA_BOARD_MEMBER"
                                    icon={<Users className="h-5 w-5 mb-1" />}
                                    setRole={setRole}
                                />
                            </div>

                            <div className="grid gap-4">
                                {/* Common Fields */}
                                <div className="grid gap-1">
                                    <Label className="font-bold text-black">Full Name</Label>
                                    <Input
                                        className="border-2 border-black"
                                        placeholder="John Doe"
                                        type="text"
                                        disabled={isLoading}
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value.replace(/[^a-zA-Z\s'-]/g, ''))}
                                    />
                                </div>

                                <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-300">
                                    {role === "BOARD_ADMIN" ? (
                                        <>
                                            <div className="grid gap-1">
                                                <Label>HOA Name</Label>
                                                <Input
                                                    className="border-2 border-black"
                                                    placeholder="e.g. Sunset Valley"
                                                    type="text"
                                                    disabled={isLoading}
                                                    value={hoaName}
                                                    onChange={(e) => setHoaName(e.target.value.replace(/[^a-zA-Z0-9\s&'-]/g, ''))}
                                                />
                                            </div>
                                            <div className="grid gap-1">
                                                <Label>Community Type</Label>
                                                <Select value={communityType} onValueChange={(val: any) => setCommunityType(val)} disabled={isLoading}>
                                                    <SelectTrigger className="border-2 border-black">
                                                        <SelectValue placeholder="Select community type" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="APARTMENTS">Apartments / Condos</SelectItem>
                                                        <SelectItem value="OWN_HOUSES">Single Family / Townhouses</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-1">
                                                <Label>Phone Number</Label>
                                                <Input
                                                    className="border-2 border-black"
                                                    placeholder="2345678900"
                                                    type="tel"
                                                    disabled={isLoading}
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                                    maxLength={15}
                                                />
                                                <p className="text-[10px] text-muted-foreground">Used for urgent community alerts.</p>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="grid gap-1">
                                                <Label className="font-bold text-black">HOA Name (Optional)</Label>
                                                <Input
                                                    className="border-2 border-black"
                                                    placeholder="e.g. Sunset Valley"
                                                    type="text"
                                                    disabled={isLoading}
                                                    value={residentHoaName}
                                                    onChange={(e) => setResidentHoaName(e.target.value.replace(/[^a-zA-Z0-9\s&'-]/g, ''))}
                                                />
                                            </div>
                                            <div className="grid gap-1">
                                                <div className="grid gap-1">
                                                    <Label className="font-bold text-black">Community Code</Label>
                                                    <Input
                                                        className="border-2 border-black font-mono uppercase"
                                                        placeholder="Enter the code shared by your Admin"
                                                        type="text"
                                                        disabled={isLoading}
                                                        value={tenantSlug}
                                                        onChange={(e) => setTenantSlug(e.target.value.replace(/[^a-zA-Z0-9-]/g, ''))}
                                                        maxLength={20}
                                                    />
                                                    <p className="text-[10px] text-muted-foreground">This code links your account to your specific HOA.</p>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="grid gap-1">
                                                        <Label className="text-black font-semibold">Account Number</Label>
                                                        <Input
                                                            placeholder="12-digit permanent ID"
                                                            type="text"
                                                            disabled={isLoading}
                                                            value={accountNumber}
                                                            onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                                                            className="font-mono bg-white border-2 border-black text-black placeholder:text-slate-400 h-11"
                                                            maxLength={12}
                                                        />
                                                        <p className="text-[10px] text-black/80 font-medium">Permanent identification number.</p>
                                                    </div>
                                                    <div className="grid gap-1">
                                                        <Label className="text-black font-semibold">Registration Code</Label>
                                                        <Input
                                                            placeholder="6-digit temp code"
                                                            type="text"
                                                            disabled={isLoading}
                                                            value={registrationNumber}
                                                            onChange={(e) => setRegistrationNumber(e.target.value.replace(/\D/g, ''))}
                                                            className="font-mono bg-white border-2 border-black text-black placeholder:text-slate-400 h-11"
                                                            maxLength={6}
                                                        />
                                                        <p className="text-[10px] text-black/80 font-medium">Valid for 7 days only.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Common Auth Fields */}
                                <div className="grid gap-1">
                                    <Label className="font-bold text-black">Email</Label>
                                    <Input
                                        className="border-2 border-black"
                                        placeholder="name@example.com"
                                        type="email"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        autoCorrect="off"
                                        disabled={isLoading}
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label className="font-bold text-black">Password</Label>
                                    <Input
                                        className="border-2 border-black"
                                        placeholder="••••••••"
                                        type="password"
                                        autoCapitalize="none"
                                        disabled={isLoading}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <div className="grid gap-1">
                                    <Label className="font-bold text-black">Confirm Password</Label>
                                    <Input
                                        className="border-2 border-black"
                                        placeholder="••••••••"
                                        type="password"
                                        autoCapitalize="none"
                                        disabled={isLoading}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </div>

                                <Button disabled={isLoading} onClick={handleRegister} className="mt-2">
                                    {isLoading && (
                                        <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                    )}
                                    Sign Up as {role === "BOARD_ADMIN" ? "Admin" : role === "RESIDENT" ? "Resident" : "Board Member"}
                                </Button>
                            </div>
                            {err && <p className="text-sm text-destructive text-center font-medium">{err}</p>}
                        </div>
                    </div>

                    <p className="px-8 text-center text-sm text-muted-foreground mt-6">
                        Already have an account?{" "}
                        <Link href="/login" className="underline underline-offset-4 hover:text-primary">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
            <PreLoginFooter />
        </>
    );
}

// Helper Components
function Label({ children, className }: { children: React.ReactNode; className?: string }) {
    return <p className={cn("text-sm font-medium leading-none mb-1.5 ml-0.5", className)}>{children}</p>;
}

function RoleCard({ id, label, current, value, icon, setRole }: any) {
    const isSelected = current === value;
    return (
        <div
            onClick={() => setRole(value)}
            className={cn(
                "cursor-pointer rounded-lg border-2 p-3 flex flex-col items-center justify-center text-center transition-all hover:bg-muted/50",
                isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-muted bg-transparent"
            )}
        >
            <div className={cn("transition-colors", isSelected ? "text-primary" : "text-muted-foreground")}>
                {icon}
            </div>
            <span className={cn("text-xs font-semibold", isSelected ? "text-foreground" : "text-muted-foreground")}>
                {label}
            </span>
        </div>
    );
}
