"use client";

import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ArrowRight,
    Building2,
    Calendar,
    CreditCard,
    FileText,
    Shield,
    Users,
    Wrench,
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import PreLoginFooter from "@/components/layout/PreLoginFooter";

export default function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col bg-background selection:bg-primary/10 selection:text-primary">
            <Header />

            <main className="flex-1">
                {/* HERO SECTION */}
                <section className="relative overflow-hidden pt-24 pb-32 md:pb-48 lg:pb-56">
                    {/* Enhanced Background Decorations */}
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
                    <div className="absolute top-0 right-0 -z-10 h-[800px] w-[800px] translate-x-1/3 -translate-y-1/4 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 blur-[120px] animate-pulse" />
                    <div className="absolute bottom-0 left-0 -z-10 h-[800px] w-[800px] -translate-x-1/3 translate-y-1/4 rounded-full bg-gradient-to-tr from-purple-500/10 to-blue-500/10 blur-[120px] animate-pulse delay-1000" />

                    {/* Animated grid pattern */}
                    <div className="absolute inset-0 -z-10 opacity-20">
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_50%,transparent_100%)]"></div>
                    </div>

                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col items-center gap-8 text-center">
                            {/* Badge with animation */}
                            <div className="inline-flex items-center rounded-full border border-primary/30 bg-gradient-to-r from-primary/10 to-blue-600/10 px-4 py-2 text-sm font-semibold text-primary backdrop-blur-sm animate-[fadeInUp_0.6s_ease-out] shadow-lg shadow-primary/10">
                                <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                                Welcome to the Future of Community Living
                            </div>

                            {/* Main heading with stagger animation */}
                            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl animate-[fadeInUp_0.8s_ease-out_0.2s_both]">
                                Modern Management for <br className="hidden md:inline" />
                                <span className="relative inline-block mt-2">
                                    <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent animate-[gradient_3s_ease_infinite] bg-[length:200%_auto]">
                                        Thriving Communities
                                    </span>
                                    <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 blur-sm"></div>
                                </span>
                            </h1>

                            <p className="max-w-[700px] text-lg text-muted-foreground md:text-xl leading-relaxed animate-[fadeInUp_1s_ease-out_0.4s_both]">
                                Streamline operations, enhance communication, and build a stronger neighborhood with our comprehensive HOA platform. Everything you need, all in one place.
                            </p>

                            {/* CTA buttons with stagger animation */}
                            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6 mt-4 animate-[fadeInUp_1.2s_ease-out_0.6s_both]">
                                <Link href="/login">
                                    <Button size="lg" className="h-12 px-8 rounded-full text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 group">
                                        Login to Portal
                                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                </Link>
                                <Link href="#services">
                                    <Button variant="outline" size="lg" className="h-12 px-8 rounded-full text-base backdrop-blur-sm hover:bg-primary/5 hover:scale-105 transition-all border-primary/20">
                                        Explore Services
                                    </Button>
                                </Link>
                            </div>

                            {/* Floating elements */}
                            <div className="absolute top-1/4 right-10 hidden lg:block animate-[float_6s_ease-in-out_infinite]">
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-xl">
                                    <Calendar className="h-8 w-8 text-blue-500" />
                                </div>
                            </div>
                            <div className="absolute top-1/2 left-10 hidden lg:block animate-[float_6s_ease-in-out_2s_infinite]">
                                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm border border-white/10 flex items-center justify-center shadow-xl">
                                    <Wrench className="h-8 w-8 text-orange-500" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SERVICES SECTION */}
                <section id="services" className="container px-4 py-24 md:px-6 lg:py-32 scroll-mt-16">
                    <div className="mb-12 text-center md:mb-20">
                        <div className="inline-flex items-center rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary mb-4">
                            <Shield className="mr-2 h-4 w-4" />
                            Our Services
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight md:text-5xl mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                            Comprehensive Services
                        </h2>
                        <p className="mx-auto max-w-[600px] text-lg text-muted-foreground">
                            Designed to make community management effortless and transparent for residents and board members alike.
                        </p>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {[
                            {
                                icon: CreditCard,
                                title: "Easy Payments",
                                description: "Pay dues securely online, set up autopay, and view your complete ledger history instantly.",
                                color: "text-blue-500",
                                bg: "bg-blue-500/10",
                                delay: "0ms",
                            },
                            {
                                icon: Wrench,
                                title: "Maintenance Requests",
                                description: "Submit work orders, track status updates in real-time, and communicate directly with maintenance teams.",
                                color: "text-orange-500",
                                bg: "bg-orange-500/10",
                                delay: "100ms",
                            },
                            {
                                icon: Calendar,
                                title: "Community Calendar",
                                description: "Never miss a beat. Stay updated on board meetings, social events, and amenity bookings.",
                                color: "text-green-500",
                                bg: "bg-green-500/10",
                                delay: "200ms",
                            },
                            {
                                icon: FileText,
                                title: "Secure Documents",
                                description: "Access governing documents, meeting minutes, and financial reports anytime, anywhere.",
                                color: "text-purple-500",
                                bg: "bg-purple-500/10",
                                delay: "300ms",
                            },
                            {
                                icon: Users,
                                title: "Neighbor Directory",
                                description: "Connect with your community. Find contact information for neighbors and build a safer environment.",
                                color: "text-pink-500",
                                bg: "bg-pink-500/10",
                                delay: "400ms",
                            },
                            {
                                icon: Shield,
                                title: "Safe & Secure",
                                description: "Enterprise-grade security ensuring your personal data and payments are always protected.",
                                color: "text-indigo-500",
                                bg: "bg-indigo-500/10",
                                delay: "500ms",
                            },
                        ].map((service, i) => (
                            <Card
                                key={i}
                                className="group relative overflow-hidden border-border/50 bg-gradient-to-br from-background to-muted/20 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2 hover:border-primary/30 animate-[fadeInUp_0.6s_ease-out_both]"
                                style={{ animationDelay: service.delay }}
                            >
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${service.bg} to-transparent pointer-events-none`} />
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.1),rgba(255,255,255,0))]" />

                                <CardHeader className="relative z-10">
                                    <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${service.bg} ${service.color} ring-1 ring-inset ring-black/5 shadow-lg transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                                        <service.icon className="h-7 w-7" />
                                    </div>
                                    <CardTitle className="text-xl group-hover:text-primary transition-colors duration-300">{service.title}</CardTitle>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <CardDescription className="text-base leading-relaxed">
                                        {service.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* FEATURES / ABOUT SECTION */}
                <section className="bg-gradient-to-b from-muted/30 via-muted/50 to-muted/30 py-24 lg:py-32 relative overflow-hidden">
                    {/* Enhanced decorative elements */}
                    <div className="absolute right-0 top-1/2 -z-10 h-[1000px] w-[1000px] -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-l from-primary/10 to-transparent blur-[150px] animate-pulse" />
                    <div className="absolute left-0 bottom-0 -z-10 h-[600px] w-[600px] -translate-x-1/2 translate-y-1/2 rounded-full bg-gradient-to-r from-blue-500/10 to-transparent blur-[120px]" />

                    <div className="container px-4 md:px-6">
                        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
                            <div className="flex flex-col justify-center space-y-8 animate-[fadeInLeft_0.8s_ease-out]">
                                <div className="space-y-6">
                                    <div className="inline-flex items-center rounded-xl bg-gradient-to-r from-primary/10 to-blue-600/10 px-4 py-2 text-sm font-semibold text-primary backdrop-blur-sm border border-primary/20 shadow-lg">
                                        <Building2 className="mr-2 h-4 w-4" />
                                        Why Choose Us
                                    </div>
                                    <h2 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl leading-tight">
                                        Experience the <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Difference</span> in Community Management
                                    </h2>
                                    <p className="text-lg text-muted-foreground md:text-xl leading-relaxed">
                                        We believe that managing a community shouldn&apos;t be a chore. Our platform combines powerful tools with an intuitive design to bring you a seamless experience.
                                    </p>
                                </div>
                                <ul className="space-y-5">
                                    {[
                                        { text: "Real-time notifications for important updates.", delay: "0ms" },
                                        { text: "Mobile-optimized design for access on the go.", delay: "100ms" },
                                        { text: "Transparent financial tracking and reporting.", delay: "200ms" },
                                        { text: "Community-focused features to foster connection.", delay: "300ms" },
                                    ].map((item, i) => (
                                        <li
                                            key={i}
                                            className="flex items-center gap-4 group animate-[fadeInLeft_0.6s_ease-out_both]"
                                            style={{ animationDelay: item.delay }}
                                        >
                                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 text-green-600 ring-1 ring-green-500/20 group-hover:scale-110 transition-transform duration-300">
                                                <svg
                                                    className="h-5 w-5"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                    strokeWidth={3}
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                            </div>
                                            <span className="text-lg font-medium group-hover:text-primary transition-colors">{item.text}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="pt-4">
                                    <Link href="/login">
                                        <Button size="lg" className="rounded-full px-8 shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 hover:scale-105 transition-all duration-300">
                                            Get Started Today
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>

                            {/* Enhanced Visual Representation */}
                            <div className="relative mx-auto w-full max-w-[500px] lg:max-w-none animate-[fadeInRight_0.8s_ease-out]">
                                <div className="aspect-square overflow-hidden rounded-3xl bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 shadow-2xl shadow-primary/20 border-2 border-primary/10 p-12 flex items-center justify-center relative dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 backdrop-blur-sm">
                                    {/* Animated grid */}
                                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:32px_32px] opacity-50"></div>

                                    {/* Gradient orbs */}
                                    <div className="absolute top-10 right-10 h-40 w-40 rounded-full bg-gradient-to-br from-primary/20 to-blue-500/20 blur-3xl animate-pulse"></div>
                                    <div className="absolute bottom-10 left-10 h-40 w-40 rounded-full bg-gradient-to-tr from-purple-500/20 to-pink-500/20 blur-3xl animate-pulse delay-1000"></div>

                                    {/* Center icon */}
                                    <div className="relative z-10 text-center space-y-6">
                                        <div className="mx-auto h-28 w-28 rounded-3xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-2xl shadow-primary/40 rotate-3 transition-transform hover:rotate-6 hover:scale-110 duration-500 animate-[float_4s_ease-in-out_infinite]">
                                            <Building2 className="h-14 w-14 text-primary-foreground" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-bold bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">HOA Platform</h3>
                                            <p className="text-sm text-muted-foreground mt-2 font-medium">Connecting Communities</p>
                                        </div>
                                    </div>

                                    {/* Enhanced Floating Cards */}
                                    <div className="absolute -top-8 -right-8 h-24 w-36 rounded-2xl bg-gradient-to-br from-card to-card/80 border-2 border-primary/20 shadow-2xl flex items-center justify-center animate-[float_3s_ease-in-out_infinite] backdrop-blur-sm">
                                        <CreditCard className="h-10 w-10 text-blue-500" />
                                    </div>
                                    <div className="absolute -bottom-8 -left-8 h-24 w-36 rounded-2xl bg-gradient-to-br from-card to-card/80 border-2 border-primary/20 shadow-2xl flex items-center justify-center animate-[float_4s_ease-in-out_1s_infinite] backdrop-blur-sm">
                                        <Users className="h-10 w-10 text-orange-500" />
                                    </div>
                                    <div className="absolute top-1/2 -left-8 h-20 w-20 rounded-xl bg-gradient-to-br from-card to-card/80 border-2 border-primary/20 shadow-2xl flex items-center justify-center animate-[float_5s_ease-in-out_2s_infinite] backdrop-blur-sm">
                                        <Shield className="h-8 w-8 text-green-500" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <PreLoginFooter />

            <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes gradient {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
        </div >
    );
}
