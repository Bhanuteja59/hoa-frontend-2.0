"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
import { z } from "zod";
import { Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import PreLoginFooter from "@/components/layout/PreLoginFooter";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });

function LoginForm() {
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    // 1. Check for legacy URL param
    const error = searchParams.get("error");
    if (error === "session_expired") {
      toast({
        title: "Session Expired",
        description: "Your session has expired or the database connection changed. Please login again.",
        variant: "destructive",
      });
      if (status === "authenticated") {
        signOut({ redirect: false });
      }
    } else if (error === "CredentialsSignin") {
      setErr("Invalid email or password.");
    }

    // 2. Check for new localStorage flag (CLEAN URL)
    if (typeof window !== "undefined") {
      const expired = localStorage.getItem("session_expired");
      if (expired) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please login again.",
          variant: "destructive",
        });
        localStorage.removeItem("session_expired");
        if (status === "authenticated") {
          signOut({ redirect: false });
        }
      }
    }
  }, [searchParams, status, toast]);

  // Redirect if already logged in, BUT not if session specifically expired
  useEffect(() => {
    const error = searchParams.get("error");
    if (status === "authenticated" && error !== "session_expired") {
      // @ts-ignore
      if (session?.user?.isPlatformAdmin) {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [status, router, searchParams, session]);

  const handleLogin = async () => {
    setIsLoading(true);
    setErr(null);
    try {
      const parsed = schema.safeParse({ email, password });
      if (!parsed.success) {
        setErr("Invalid email or password format");
        return;
      }
      const res = await signIn("credentials", {
        redirect: false,
        ...parsed.data
      });

      if (res?.error) {
        setErr("Login failed. Please check your credentials.");
      } else {
        // We'll let the useEffect handle the actual redirect to be sure we have session data
      }
    } catch (e) {
      setErr("An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-zinc-900" />
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 mix-blend-overlay"
            style={{ backgroundImage: "url('/images/login-bg.jpg')" }}
          />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <Command className="mr-2 h-6 w-6" />
            HOA SaaS Platform
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;This platform has completely transformed how we manage our community. Communication is seamless, and maintenance requests are handled 3x faster.&rdquo;
              </p>
              <footer className="text-sm">Sofia Davis, Board President</footer>
            </blockquote>
          </div>
        </div>
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <div className="flex items-center justify-center text-lg font-medium lg:hidden mb-2">
                <Command className="mr-2 h-6 w-6" />
                HOA SaaS Platform
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Login to your account
              </h1>
              <p className="text-sm text-muted-foreground">
                Enter your email below to access your account
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleLogin();
              }}
              className="grid gap-6"
            >
              <div className="grid gap-2">
                <div className="grid gap-1">
                  <Input
                    id="email"
                    placeholder="name@example.com"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                  <Input
                    id="password"
                    placeholder="Password"
                    type="password"
                    autoCapitalize="none"
                    autoComplete="current-password"
                    disabled={isLoading}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                  />
                </div>
                <Button disabled={isLoading} type="submit">
                  {isLoading && (
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  )}
                  Sign In with Email
                </Button>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link href="/register" className="underline underline-offset-4 hover:text-primary">
                  Sign up
                </Link>
              </div>
              {err && <p className="text-sm text-destructive text-center">{err}</p>}
            </form>
            <p className="px-8 text-center text-sm text-muted-foreground">
              By clicking continue, you agree to our{" "}
              <Link href="/terms" className="underline underline-offset-4 hover:text-primary">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline underline-offset-4 hover:text-primary">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
      <PreLoginFooter />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
