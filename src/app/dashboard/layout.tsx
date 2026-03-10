import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import OnboardingModal from "@/components/dashboard/OnboardingModal";
import ChatWidget from "@/components/dashboard/ChatWidget";
import { ApprovalGuard } from "@/components/auth/ApprovalGuard";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <ApprovalGuard>
            <div className="flex h-screen w-full bg-muted/40">
                <Sidebar className="hidden md:flex" />
                <div className="flex flex-col flex-1 overflow-hidden">
                    <Header />
                    <OnboardingModal />
                    <main className="flex-1 overflow-auto p-4 md:p-6">
                        {children}
                    </main>
                    <ChatWidget />
                </div>
            </div>
        </ApprovalGuard>
    );
}
