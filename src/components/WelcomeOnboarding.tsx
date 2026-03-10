import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiPutJson } from "@/lib/api";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Home, User as UserIcon } from "lucide-react";

export function WelcomeOnboarding({ me, tenantName }: { me: any, tenantName: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");

    const qc = useQueryClient();
    const { toast } = useToast();

    useEffect(() => {
        // Show onboarding if they are logged in but missing phone or address
        if (me && (!me.phone || !me.address)) {
            setIsOpen(true);
        } else {
            setIsOpen(false);
        }
    }, [me]);

    const updateProfile = useMutation({
        mutationFn: (data: any) => apiPutJson(`/users/${me.user_id}`, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["me"] });
            setIsOpen(false);
            toast({ title: "Profile complete!", description: "Welcome to your community dashboard." });
        },
        onError: (err: any) => {
            toast({ title: "Failed to update profile", description: err.message, variant: "destructive" });
        }
    });

    if (!me) return null;

    const roleLabels: Record<string, string> = {
        "ADMIN": "Community Admin",
        "BOARD": "Board Member",
        "BOARD_MEMBER": "Board Member",
        "USER": "Resident"
    };

    const userRole = roleLabels[me.roles?.[0] || "USER"] || me.roles?.[0] || "Resident";
    const commType = me.community_type?.replace('_', ' ') || "APARTMENTS";

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
                className="sm:max-w-[500px] border-primary/20 bg-card text-card-foreground"
                onInteractOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
                        <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                    </div>
                    <DialogTitle className="text-2xl text-center font-bold text-foreground">Welcome to {tenantName}!</DialogTitle>
                    <DialogDescription className="text-center text-base pt-2 text-muted-foreground">
                        We are excited to have you! Let&apos;s get your profile set up so you can access all community features securely.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex flex-col md:flex-row gap-4 justify-center items-center bg-muted/50 p-4 rounded-xl border border-border/50">
                        <div className="flex items-center gap-2">
                            <UserIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{userRole}</span>
                        </div>
                        <div className="hidden md:block w-px h-4 bg-border" />
                        <div className="flex items-center gap-2">
                            <Home className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium capitalize">{commType.toLowerCase()}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {!me.phone && (
                            <div className="grid gap-2">
                                <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
                                <Input
                                    id="phone"
                                    placeholder="5551234567"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    maxLength={15}
                                />
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="address">Physical Address <span className="text-destructive">*</span></Label>
                            <Textarea
                                id="address"
                                placeholder="123 Main St, Unit 4B"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="resize-none h-24"
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter className="sm:justify-center">
                    <Button
                        size="lg"
                        className="w-full sm:w-auto min-w-[200px]"
                        disabled={(!me.phone && !phone.trim()) || !address.trim() || updateProfile.isPending}
                        onClick={() => {
                            updateProfile.mutate({ phone: me.phone || phone, address });
                        }}
                    >
                        {updateProfile.isPending ? "Saving..." : "Save and Continue"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
