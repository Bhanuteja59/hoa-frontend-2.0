"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPutJson, apiPostJson } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function OnboardingModal() {
    const { data: session } = useSession();
    // We fetch checks from /auth/me because session might be stale
    const { data: profile, isLoading } = useQuery({
        queryKey: ["me"],
        queryFn: () => apiGet<any>("/auth/me"),
        enabled: !!session
    });

    // Also need units/buildings to let them select
    const buildings = useQuery({ queryKey: ["buildings"], queryFn: () => apiGet<any[]>("/units/buildings"), enabled: !!profile });
    const units = useQuery({ queryKey: ["units"], queryFn: () => apiGet<any[]>("/units"), enabled: !!profile });

    const [isOpen, setIsOpen] = useState(false);
    const [selectedUnitId, setSelectedUnitId] = useState("");

    const qc = useQueryClient();

    useEffect(() => {
        if (!isLoading && profile) {
            // Check if user is a RESIDENT (USER) and has NO GENERIC Unit ID?
            // Actually, we modified backend to set unit_id = None for new joiners.
            // So if unit_id is null/missing, and role contains "USER" (and maybe not ADMIN?), show modal.
            // Admins usually created the tenant so they might get a default unit or don't need one enforced instantly.
            // User requested "ask the user... after signup". Usually refers to Residents.his 

            const isUser = profile.roles.includes("USER");
            const hasNoUnit = !profile.unit_id;

            if (isUser && hasNoUnit) {
                setIsOpen(true);
            } else {
                setIsOpen(false);
            }
        }
    }, [isLoading, profile]);

    const updateUser = useMutation({
        mutationFn: (body: any) => apiPutJson(`/users/${profile.user_id}`, body),
        onSuccess: async () => {
            await qc.invalidateQueries({ queryKey: ["me"] });
            setIsOpen(false);
            // Force reload to ensure session/state is perfectly synced
            window.location.reload();
        },
        onError: (err: any) => {
            console.error("Failed to update unit:", err);
            alert("Failed to update unit: " + err.message);
        }
    });

    const unitOptions = useMemo(() => units.data ?? [], [units.data]);
    const buildingOptions = useMemo(() => buildings.data ?? [], [buildings.data]);

    const groupedUnits = useMemo(() => {
        // Simple grouping could vary, but flat list is fine for MVP.
        return unitOptions;
    }, [unitOptions]);

    return (
        <Dialog open={isOpen}>
            <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Complete Your Profile</DialogTitle>
                    <DialogDescription>
                        Welcome! Please select your residence unit to continue.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Select Your Unit</Label>
                        <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Search or Select Unit..." />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {unitOptions.map((u: any) => (
                                    <SelectItem key={u.id} value={u.id}>
                                        Unit {u.unit_number} {u.building_id ? `(Bldg ${buildingOptions.find((b: any) => b.id === u.building_id)?.name})` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Don&apos;t see your unit? Contact your administrator...</p>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => {
                        const selectedUnit = unitOptions.find((u: any) => u.id === selectedUnitId);
                        if (selectedUnit) {
                            updateUser.mutate({ unit: selectedUnit.unit_number });
                        }
                    }} disabled={!selectedUnitId || updateUser.isPending}>
                        {updateUser.isPending ? "Saving..." : "Confirm Residence"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
