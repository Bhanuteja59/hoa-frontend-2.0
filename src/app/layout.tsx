// frontend/src/app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import Providers from "./providers";
import { Toaster } from "@/components/ui/toaster";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { Suspense } from "react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  verification: {
    google: "WF2XUxGii2MkY2Ltao10yC2dsAichcRx64AU3siGsQc",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="google-site-verification" content="WF2XUxGii2MkY2Ltao10yC2dsAichcRx64AU3siGsQc" />
      </head>
      <body className="h-full">
        <Providers>
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
