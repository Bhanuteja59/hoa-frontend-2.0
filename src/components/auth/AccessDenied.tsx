import { AlertCircle } from "lucide-react";

export function AccessDenied() {
    return (
        <div className="rounded-xl border bg-card/80 backdrop-blur-lg text-card-foreground shadow-sm transition-all duration-300 hover:shadow-lg hover:border-primary/20 max-w-md mx-auto mt-10">
            <div className="flex flex-col space-y-1.5 p-6">
                <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-6 w-6 text-destructive" />
                    <h3 className="text-2xl font-semibold leading-none tracking-tight">Access Denied</h3>
                </div>
                <p className="text-sm text-muted-foreground">This page is only accessible to administrators.</p>
            </div>
        </div>
    );
}
