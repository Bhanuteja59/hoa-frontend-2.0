import Link from "next/link";
import { Building2, Mail, Phone, HelpCircle } from "lucide-react";

export default function PreLoginFooter() {
    return (
        <footer className="border-t bg-gradient-to-b from-background to-muted/20 pb-8 pt-12 md:pt-16 md:pb-12">
            <div className="container px-4 md:px-6 mx-auto">
                <div className="grid gap-10 md:grid-cols-3 lg:gap-16">
                    {/* About Us */}
                    <div className="space-y-4 md:col-span-1">
                        <div className="flex items-center gap-2.5 font-bold text-lg group w-fit">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-primary/15 to-blue-600/15 text-primary transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20">
                                <Building2 className="h-5 w-5" />
                            </div>
                            <span className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">HOA Platform</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Welcome to the HOA Management Platform. We&apos;re dedicated to bringing your community together by streamlining operations, enhancing transparent communication, and building a stronger neighborhood for everyone.
                        </p>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold tracking-wide uppercase text-foreground">Contact Us</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-primary" />
                                <a href="mailto:support@hoaplatform.com" className="hover:text-primary transition-colors">support@hoaplatform.com</a>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-primary" />
                                <span>1-800-HOA-HELP</span>
                            </li>
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold tracking-wide uppercase text-foreground">Help & Support</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li>
                                <Link href="/help" className="flex items-center gap-2 hover:text-primary transition-colors w-fit">
                                    <HelpCircle className="h-4 w-4" />
                                    Help Center
                                </Link>
                            </li>
                            <li>
                                <Link href="/contact" className="hover:text-primary transition-colors w-fit">
                                    Contact Support Team
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 md:mt-16 pt-8 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-center text-sm text-muted-foreground md:text-left">
                        &copy; {new Date().getFullYear()} HOA Management Platform. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm font-medium text-muted-foreground">
                        <Link href="/terms" className="hover:text-primary hover:underline underline-offset-4 transition-colors">
                            Terms
                        </Link>
                        <Link href="/privacy" className="hover:text-primary hover:underline underline-offset-4 transition-colors">
                            Privacy
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
