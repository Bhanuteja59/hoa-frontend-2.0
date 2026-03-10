"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { apiPostJson } from "@/lib/api";
import { useSession } from "next-auth/react";

export function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: session }: any = useSession();
    const lastTracked = useRef<string>("");

    useEffect(() => {
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
    }, [pathname, searchParams, session?.user?.tenantId]);

    return null;
}
