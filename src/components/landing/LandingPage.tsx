"use client";

import { useState, useEffect, useRef } from "react";
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
    Database,
    Cloud,
    Server,
    Zap,
    Cpu,
    BrainCircuit,
    Code2,
    Layout,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import Link from "next/link";
import PreLoginFooter from "@/components/layout/PreLoginFooter";

// Reusable Scroll Animation Component
function FadeIn({ children, delay = 0, className = "", direction = "up" }: { children: React.ReactNode, delay?: number, className?: string, direction?: "up" | "left" | "right" }) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const p = ref.current;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.unobserve(entry.target);
            }
        }, { threshold: 0.1, rootMargin: "50px" });

        if (p) observer.observe(p);
        return () => {
            if (p) observer.unobserve(p);
        };
    }, []);

    let transformClass = "translate-y-12";
    if (direction === "left") transformClass = "-translate-x-12";
    if (direction === "right") transformClass = "translate-x-12";

    return (
        <div ref={ref} className={`transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${isVisible ? 'opacity-100 translate-y-0 translate-x-0' : `opacity-0 ${transformClass}`} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
            {children}
        </div>
    );
}

const TECH_STACK = [
    { name: "Next.js 14", icon: Zap, color: "text-slate-800 dark:text-white" },
    { name: "React Components", icon: Code2, color: "text-sky-500" },
    { name: "Tailwind CSS", icon: Layout, color: "text-cyan-400" },
    { name: "Python FastAPI", icon: Server, color: "text-emerald-500" },
    { name: "PostgreSQL", icon: Database, color: "text-indigo-500" },
    { name: "OpenAI GPT-4", icon: BrainCircuit, color: "text-purple-500" },
    { name: "Qdrant Vector DB", icon: Cpu, color: "text-rose-500" },
    { name: "Cloudinary CDN", icon: Cloud, color: "text-blue-500" },
];

function ImageSlider({ images }: { images: string[] }) {
    // We duplicate the array to create a seamless loop
    const doubledImages = [...images, ...images];

    return (
        <div className="relative w-full overflow-hidden py-6 md:py-10">
            {/* Gradient Mask for fading edges - smaller on mobile */}
            <div className="absolute inset-y-0 left-0 w-16 md:w-40 bg-gradient-to-r from-slate-50 dark:from-slate-900 to-transparent z-10" />
            <div className="absolute inset-y-0 right-0 w-16 md:w-40 bg-gradient-to-l from-slate-50 dark:from-slate-900 to-transparent z-10" />

            <div 
                className="flex w-max animate-[scroll_50s_linear_infinite] hover:[animation-play-state:paused] gap-4 md:gap-8"
                style={{ 
                    "--item-width-mobile": "220px",
                    "--item-width-desktop": "340px",
                    "--gap-mobile": "1rem",
                    "--gap-desktop": "2rem"
                } as React.CSSProperties}
            >
                {doubledImages.map((img, i) => (
                    <div 
                        key={i} 
                        className="w-[220px] h-[160px] md:w-[340px] md:h-[240px] shrink-0 rounded-2xl md:rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl group/img relative"
                    >
                        <img
                            src={img}
                            alt={`Gallery ${i + 1}`}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover/img:bg-transparent transition-colors" />
                    </div>
                ))}
            </div>

            <style jsx>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { 
                        transform: translateX(calc(-1 * (220px * ${images.length} + 1rem * ${images.length}))); 
                    }
                }
                @media (min-width: 768px) {
                    @keyframes scroll {
                        0% { transform: translateX(0); }
                        100% { 
                            transform: translateX(calc(-1 * (340px * ${images.length} + 2rem * ${images.length}))); 
                        }
                    }
                }
            `}</style>
        </div>
    );
}

const SLIDE_IMAGES = [
    "/images/slides/img%201.jpeg",
    "/images/slides/img%202.jpeg",
    "/images/slides/img%203.jpeg",
    "/images/slides/img%204.jpeg",
    "/images/slides/img%205.jpeg",
    "/images/slides/img%206.jpeg",
];


export default function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20 selection:text-primary overflow-hidden">
            <Header />

            <main className="flex-1 relative">
                {/* ── GLOBAL BACKGROUND PATTERNS ── */}
                <div className="absolute inset-0 -z-20 pointer-events-none">
                    {/* Architectural Mesh Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
                    
                    {/* Premium Dot Matrix */}
                    <div className="absolute inset-0 bg-[radial-gradient(#80808012_1px,transparent_1px)] [bg-size:24px_24px]" />
                </div>

                {/* ── HERO SECTION ── */}
                <section className="relative min-h-[85vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden pt-10 pb-24 lg:pt-16 lg:pb-32">
                    {/* Cinematic Background Layer */}
                    <div className="absolute inset-x-0 top-0 -z-10 h-full w-full">
                        {/* The Image */}
                        <div className="absolute inset-0 bg-[url('/images/slides/img%202.jpeg')] bg-cover bg-center brightness-[0.25] dark:brightness-[0.15] scale-105" />
                        
                        {/* Gradient Overlays for readability */}
                        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/40 to-background" />
                        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background" />
                        
                        {/* Dynamic Light Orbs */}
                        <div className="absolute top-[-10%] left-[10%] h-[500px] w-[500px] rounded-full bg-primary/20 blur-[130px] animate-pulse" />
                        <div className="absolute bottom-[20%] right-[10%] h-[400px] w-[400px] rounded-full bg-blue-600/15 blur-[100px] animate-pulse duration-[5s]" />
                    </div>
                    <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_at_center,black_60%,transparent_100%)] opacity-40"></div>

                    <div className="container px-4 md:px-6 relative z-10">
                        <FadeIn delay={0}>
                            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-sm font-semibold text-primary backdrop-blur-md mb-4 shadow-sm">
                                <Sparkles className="h-4 w-4 mr-2 text-primary animate-pulse" />
                                Welcome to the Future of Community Living
                            </div>
                        </FadeIn>

                        <FadeIn delay={150}>
                            <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl max-w-5xl mx-auto leading-[1.1]">
                                Modern Management for <br className="hidden md:inline" />
                                <span className="relative inline-block mt-2">
                                    <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        Thriving Communities
                                    </span>
                                </span>
                            </h1>
                        </FadeIn>

                        <FadeIn delay={300}>
                            <p className="mx-auto mt-8 max-w-[750px] text-lg text-slate-500 dark:text-slate-400 md:text-xl leading-relaxed font-medium">
                                Streamline operations, enhance communication, and build a stronger neighborhood with our transparent, all-in-one HOA platform. Everyone stays connected.
                            </p>
                        </FadeIn>

                        <FadeIn delay={450}>
                            <div className="flex flex-col gap-4 sm:flex-row justify-center items-center mt-10">
                                <Link href="/login">
                                    <Button size="lg" className="h-14 px-10 rounded-full text-base font-bold shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 group">
                                        Login to Portal
                                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
                                    </Button>
                                </Link>
                                <Link href="#services">
                                    <Button variant="outline" size="lg" className="h-14 px-10 rounded-full text-base font-bold backdrop-blur-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border-slate-200 dark:border-slate-800 text-foreground shadow-sm">
                                        Explore Services
                                    </Button>
                                </Link>
                            </div>
                        </FadeIn>
                    </div>

                    {/* Floating Mockups / Abstract Shapes */}
                    <div className="absolute top-1/4 right-[5%] hidden xl:block animate-[float_6s_ease-in-out_infinite]">
                        <div className="h-20 w-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex items-center justify-center rotate-6">
                            <Calendar className="h-8 w-8 text-blue-500" />
                        </div>
                    </div>
                    <div className="absolute top-1/2 left-[5%] hidden xl:block animate-[float_8s_ease-in-out_2s_infinite]">
                        <div className="h-24 w-24 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex items-center justify-center -rotate-12">
                            <CreditCard className="h-10 w-10 text-emerald-500" />
                        </div>
                    </div>
                </section>

                {/* ── TECH STACK MARQUEE ── */}
                <section className="border-y border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden py-10 relative">
                    <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
                    <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
                    <div className="container px-4 text-center mb-6">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Powered by the most powerful tech stack</p>
                    </div>
                    
                    <div className="flex w-max animate-[marquee_30s_linear_infinite] hover:[animation-play-state:paused] items-center">
                        {[...TECH_STACK, ...TECH_STACK, ...TECH_STACK].map((tech, i) => (
                            <div key={i} className="flex items-center gap-3 px-10 py-2 group cursor-default">
                                <div className={`h-12 w-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform ${tech.color}`}>
                                    <tech.icon className="h-6 w-6" />
                                </div>
                                <span className="text-lg font-black text-slate-400 group-hover:text-foreground transition-colors whitespace-nowrap">{tech.name}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── SERVICES SECTION ── */}
                <section id="services" className="relative py-24 md:py-32 scroll-mt-20 overflow-hidden">
                    {/* Section Accent Overlay */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" />
                    
                    <div className="container px-4 md:px-6 relative z-10">
                        <FadeIn delay={0}>
                            <div className="text-center mb-20">
                                <h2 className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent mb-6">
                                    Transparent, Elegant Services
                                </h2>
                                <p className="mx-auto max-w-[800px] text-lg text-slate-500 dark:text-slate-400 font-medium">
                                    We&apos;ve built an intuitive ecosystem so any normal person can easily understand and control their community management directly from their phone or computer.
                                </p>
                            </div>
                        </FadeIn>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
                            {[
                                {
                                    icon: CreditCard,
                                    title: "Easy Payments",
                                    description: "Pay dues securely online, set up autopay, and view your complete ledger history instantly. No more physical checks.",
                                    color: "text-blue-500",
                                    bg: "bg-blue-50 dark:bg-blue-500/10",
                                },
                                {
                                    icon: Wrench,
                                    title: "Maintenance",
                                    description: "Submit work orders with photos, track status updates in real-time, and communicate directly with the maintenance teams.",
                                    color: "text-orange-500",
                                    bg: "bg-orange-50 dark:bg-orange-500/10",
                                },
                                {
                                    icon: Calendar,
                                    title: "Community Calendar",
                                    description: "Never miss a beat. Stay completely updated on board meetings, social events, and reserve local amenity bookings.",
                                    color: "text-emerald-500",
                                    bg: "bg-emerald-50 dark:bg-emerald-500/10",
                                },
                                {
                                    icon: FileText,
                                    title: "Secure Documents",
                                    description: "Access governing documents, meeting minutes, budgets, and compliance reports fully organized and fully searchable.",
                                    color: "text-purple-500",
                                    bg: "bg-purple-50 dark:bg-purple-500/10",
                                },
                                {
                                    icon: Users,
                                    title: "Neighbor Directory",
                                    description: "Connect with your whole community. Find contact information for verified neighbors and build a safer environment.",
                                    color: "text-pink-500",
                                    bg: "bg-pink-50 dark:bg-pink-500/10",
                                },
                                {
                                    icon: Shield,
                                    title: "Bank-Grade Security",
                                    description: "Enterprise-grade authorization ensuring your personal data and financial histories are completely locked down.",
                                    color: "text-indigo-500",
                                    bg: "bg-indigo-50 dark:bg-indigo-500/10",
                                },
                            ].map((service, i) => (
                                <FadeIn key={i} delay={i * 100}>
                                    <Card className="group relative h-full overflow-hidden border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-primary/5 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-500 hover:-translate-y-1.5">
                                        <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-900/50 -z-10" />
                                        <CardHeader>
                                            <div className={`mb-6 h-16 w-16 rounded-2xl ${service.bg} ${service.color} flex items-center justify-center ring-1 ring-inset ring-black/5 dark:ring-white/10 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                                                <service.icon className="h-8 w-8" />
                                            </div>
                                            <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors">{service.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <CardDescription className="text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                                {service.description}
                                            </CardDescription>
                                        </CardContent>
                                    </Card>
                                </FadeIn>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── SPLIT FEATURE SHOWCASE ── */}
                <section className="bg-slate-50 dark:bg-slate-900/50 border-y border-slate-200 dark:border-slate-800 py-32 relative overflow-hidden">
                     {/* Decorative Elements */}
                     <div className="absolute right-[-10%] top-0 h-[800px] w-[800px] rounded-full bg-gradient-to-l from-primary/10 to-transparent blur-[150px]" />
                    
                    <div className="container px-4 md:px-6">
                        <div className="flex flex-col gap-20">
                            {/* Text Content */}
                            <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
                                <div className="space-y-10">
                                    <FadeIn direction="left">
                                        <div className="inline-flex items-center rounded-xl bg-white dark:bg-slate-800 px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-sm">
                                            <Building2 className="mr-2 h-4 w-4 text-primary" />
                                            Why Choose Us
                                        </div>
                                        <h2 className="mt-8 text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl leading-[1.1]">
                                            Experience the <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">Difference</span>
                                        </h2>
                                        <p className="mt-6 text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                            We believe community management shouldn&apos;t be a chore. Everything is incredibly clean, simple, and exactly where you expect it to be.
                                        </p>
                                    </FadeIn>

                                    <div className="space-y-6">
                                        {[
                                            "Real-time notifications sent instantly to your devices.",
                                            "Lightning-fast, mobile-optimized design for access anywhere.",
                                            "True, deeply transparent financial ledger tracking.",
                                            "Unified portals for admins, board members, and residents."
                                        ].map((text, i) => (
                                            <FadeIn key={i} direction="left" delay={200 + (i * 100)}>
                                                <div className="flex items-start gap-4 group">
                                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                                        <CheckCircle2 className="h-5 w-5" />
                                                    </div>
                                                    <span className="text-lg font-semibold text-slate-700 dark:text-slate-300 group-hover:text-foreground transition-colors pt-0.5">{text}</span>
                                                </div>
                                            </FadeIn>
                                        ))}
                                    </div>

                                    <FadeIn direction="left" delay={600}>
                                        <Link href="/login" className="inline-block mt-4">
                                            <Button size="lg" className="h-14 rounded-xl px-8 shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90 text-primary-foreground font-bold hover:scale-105 transition-all">
                                                Get Started Today
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </Button>
                                        </Link>
                                    </FadeIn>
                                </div>

                                <FadeIn direction="right" delay={300}>
                                    <div className="relative aspect-video w-full rounded-[2rem] bg-slate-200 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden flex items-center justify-center p-12">
                                         <div className="text-center space-y-4">
                                             <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto text-primary">
                                                 <Shield className="h-8 w-8" />
                                             </div>
                                             <h3 className="text-2xl font-bold">Trusted by Thousands</h3>
                                             <p className="text-slate-500 max-w-[300px] text-sm">Join the fastest growing HOA management network in the country.</p>
                                         </div>
                                    </div>
                                </FadeIn>
                            </div>

                            {/* Subtitle and heading for the gallery */}
                            <FadeIn delay={100}>
                                <div className="text-center space-y-3 mb-8 md:mb-16 px-4">
                                    <h3 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">Community Environments</h3>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto text-base md:text-lg">Discover the diverse, thriving neighborhoods managed with excellence through our unified platform.</p>
                                </div>
                            </FadeIn>

                            {/* Full-Width Infinite Auto-Scrolling Carousel */}
                            <FadeIn delay={200}>
                                <div className="relative">
                                    <ImageSlider images={SLIDE_IMAGES} />
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </section>
            </main>

            {/* FOOTER */}
            <PreLoginFooter />

            <style jsx global>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-33.33%); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                }
            `}</style>
        </div>
    );
}
