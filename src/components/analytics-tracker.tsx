"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";

// Admin-panel path prefixes - these should never be tracked
const ADMIN_PATH_PREFIXES = ["/admin"];
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000/api/v1";

// Fingerprint the browser session so we can identify anonymous visitors
function getSessionFingerprint(): string {
    if (typeof window === "undefined") return "";
    const key = "_ha_sid";
    let sid = sessionStorage.getItem(key);
    if (!sid) {
        sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
        sessionStorage.setItem(key, sid);
    }
    return sid;
}

export function AnalyticsTracker() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: session, status } = useSession();
    const lastTracked = useRef<string>("");
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        // Wait until we know the session status — don't track while loading
        if (status === "loading") return;

        // Do NOT track if session belongs to a platform admin
        // @ts-ignore
        if ((session as any)?.user?.isPlatformAdmin === true) return;

        // Do NOT track internal admin panel pages
        if (ADMIN_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return;

        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");

        // Prevent double tracking the exact same URL in same render cycle
        if (lastTracked.current === url) return;
        lastTracked.current = url;

        if (timerRef.current) clearTimeout(timerRef.current);

        timerRef.current = setTimeout(async () => {
            try {
                const body: Record<string, string | null> = {
                    event_type: "page_view",
                    path: url,
                    referrer: document.referrer || null,
                    user_agent: navigator.userAgent,
                    // @ts-ignore
                    tenant_id: (session as any)?.user?.tenantId || null,
                    session_id: getSessionFingerprint(),
                };

                // Use plain fetch WITHOUT auth headers so the beacon works even for logged-out users.
                // The backend /analytics/track is a public endpoint (no auth required).
                await fetch(`${API_BASE}/platform/analytics/track`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(body),
                    keepalive: true, // makes the request survive page navigation
                });
            } catch {
                // Silently fail — analytics should never break the UI
            }
        }, 800);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [pathname, searchParams, status, session]);

    return null;
}
