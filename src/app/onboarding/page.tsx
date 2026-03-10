"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Unit {
    id: string;
    unit_number: string;
}

export default function OnboardingPage() {
    const { data: session, update: updateSession } = useSession();
    const router = useRouter();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");
    const [loading, setLoading] = useState(false);

    // Fetch units
    const { data: units, isLoading: unitsLoading } = useQuery<Unit[]>({
        queryKey: ["units"],
        queryFn: async () => {
            // Now accessible to users
            const res = await api.get<Unit[]>("/units");
            return res;
        },
    });

    const updateUnitMutation = useMutation({
        mutationFn: async (unitNumber: string) => {
            // We pass the unit string to our helper that finds/assigns it
            // Using the current user ID logic from session if available, 
            // but api endpoint /users/{id} requires ID.
            // Let's assume we can use "me" or get ID from session.
            const userId = (session?.user as any)?.id;
            if (!userId) throw new Error("User ID not found");

            await api.put(`/users/${userId}`, {
                unit: unitNumber // Backend handles resolving this string
            });
        },
        onSuccess: async () => {
            toast({ title: "Profile updated!", description: "Welcome to your new home." });
            // Refresh session to get updated unit info? 
            // For now, just redirect.
            router.push("/dashboard");
        },
        onError: (err: any) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    });

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50/50 p-4">
            <Card className="w-full max-w-md shadow-xl border-border/50">
                <CardHeader className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                        <Building className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
                    <CardDescription>
                        Welcome! Please select your residence unit to continue.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            Select Your Unit
                        </label>
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    className="w-full justify-between"
                                >
                                    {value
                                        ? units?.find((unit) => unit.unit_number === value)?.unit_number || value
                                        : "Search or Select Unit..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search unit..." />
                                    <CommandList>
                                        <CommandEmpty>
                                            <p className="p-2 text-sm text-muted-foreground">Unit not found.</p>
                                            {/* Note: We restrict creation to admins usually, or display contact info */}
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {units?.map((unit) => (
                                                <CommandItem
                                                    key={unit.id}
                                                    value={unit.unit_number}
                                                    onSelect={(currentValue) => {
                                                        setValue(currentValue === value ? "" : currentValue);
                                                        setOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            value === unit.unit_number ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {unit.unit_number}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <p className="text-[0.8rem] text-muted-foreground">
                            Don&apos;t see your unit? Contact your administrator.
                        </p>
                    </div>

                    <Button
                        className="w-full"
                        disabled={!value || updateUnitMutation.isPending}
                        onClick={() => updateUnitMutation.mutate(value)}
                    >
                        {updateUnitMutation.isPending ? "Saving..." : "Continue to Home"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
