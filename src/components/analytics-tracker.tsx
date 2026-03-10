"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { apiPostJson } from "@/lib/api";
import { useSession } from "next-auth/react";

// Admin-panel path prefixes that should NEVER be tracked in public analytics
const ADMIN_PATH_PREFIXES = ["/admin"];

export function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: session }: any = useSession();
    const lastTracked = useRef<string>("");

    useEffect(() => {
        // Do NOT track admin panel pages — these are super-admin internal routes
        if (ADMIN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;

        // Do NOT track super-admin visits — they skew real-user analytics
        if (session?.user?.isPlatformAdmin === true) return;

        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

        // Prevent double tracking on same URL
        if (lastTracked.current === url) return;
        lastTracked.current = url;

        const track = async () => {
            try {
                await apiPostJson("/platform/analytics/track", {
                    event_type: "page_view",
                    path: url,
                    referrer: document.referrer,
                    user_agent: navigator.userAgent,
                    tenant_id: session?.user?.tenantId || null
                });
            } catch (err) {
                console.debug("Analytics tracking offline");
            }
        };

        // Delay slightly to ensure page load feels snappy
        const timer = setTimeout(track, 1000);
        return () => clearTimeout(timer);
    }, [pathname, searchParams, session?.user?.tenantId, session?.user?.isPlatformAdmin]);

    return null;
}
