import "@/app/globals.css";
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
  title: "HOA Platform | Modern Community Management",
  description: "Streamline your HOA operations with our transparent, all-in-one platform.",
  verification: {
    google: "WF2XUxGii2MkY2Ltao10yC2dsAichcRx64AU3siGsQc",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="WF2XUxGii2MkY2Ltao10yC2dsAichcRx64AU3siGsQc" />
      </head>
      <body className="h-full antialiased">
        <Providers>
          {children}
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
