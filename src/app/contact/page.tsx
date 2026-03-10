import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
    return (
        <div className="container mx-auto p-8 max-w-2xl mt-12">
            <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
            <p className="text-lg text-muted-foreground mb-8">
                We&apos;re here to help! If you have any questions, concerns, or need assistance with your community platform, please don&apos;t hesitate to reach out.
            </p>

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-semibold mb-2">Email Support</h2>
                    <p className="text-muted-foreground">Drop us an email at <a href="mailto:support@hoaplatform.com" className="text-primary hover:underline">support@hoaplatform.com</a>. We aim to respond within 24 hours.</p>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-2">Phone Support</h2>
                    <p className="text-muted-foreground">Call us toll-free at <strong>1-800-HOA-HELP</strong> (Available Mon-Fri, 9am - 5pm EST).</p>
                </div>
            </div>

            <div className="mt-12">
                <Link href="/login">
                    <Button variant="outline">Return to Home</Button>
                </Link>
            </div>
        </div>
    );
}
