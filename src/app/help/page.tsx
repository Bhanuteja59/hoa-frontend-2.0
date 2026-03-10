import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HelpPage() {
    return (
        <div className="container mx-auto p-8 max-w-2xl mt-12">
            <h1 className="text-4xl font-bold mb-6">Help & Support Center</h1>
            <p className="text-lg text-muted-foreground mb-8">
                Find answers to common questions and learn how to make the most out of your HOA Management Platform.
            </p>

            <div className="space-y-8">
                <div>
                    <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
                    <p className="text-muted-foreground">If you&apos;re a new resident, please ask your Board Administrator for your unique <strong>Community Code</strong> to join your specific neighborhood upon registration.</p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">Resetting your Password</h2>
                    <p className="text-muted-foreground">If you&apos;ve forgotten your password, please contact your community Administrator who can provide you with a temporary reset password, or use the forgot password tool on the login screen.</p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">Still need help?</h2>
                    <p className="text-muted-foreground">Our support team is ready to assist you.</p>
                    <Link href="/contact" className="mt-2 inline-block">
                        <Button>Contact Support</Button>
                    </Link>
                </div>
            </div>

            <div className="mt-12 pt-8 border-t border-border/50">
                <Link href="/">
                    <Button variant="outline">Return to Home</Button>
                </Link>
            </div>
        </div>
    );
}
