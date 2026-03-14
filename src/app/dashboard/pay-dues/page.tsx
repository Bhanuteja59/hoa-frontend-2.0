"use client";

import React, { useState, useEffect, useCallback } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPostJson, apiGet } from "@/lib/api";
import {
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ArrowLeft,
  Lock,
  Loader2,
  DollarSign,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// ── Stripe promise — load lazily with publishable key ──────────────────
let stripePromise: Promise<Stripe | null> | null = null;

function getStripe(publishableKey: string) {
  if (!stripePromise) {
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
}

// ──────────────────────────────────────────────────────────────────────
// Inner checkout form (rendered inside <Elements>)
// ──────────────────────────────────────────────────────────────────────

function CheckoutForm({
  amount,
  paymentId,
  unitId,
  onSuccess,
  onError,
}: {
  amount: number;
  paymentId: string;
  unitId: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [cardMessage, setCardMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setCardMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/pay-dues`,
      },
      redirect: "if_required",
    });

    if (error) {
      const msg =
        error.type === "card_error" || error.type === "validation_error"
          ? error.message ?? "An error occurred."
          : "An unexpected error occurred. Please try again.";
      setCardMessage(msg);
      setIsLoading(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      try {
        await apiPostJson("/payments/confirm", {
          unit_id: unitId,
          amount_cents: Math.round(amount * 100),
          payment_id: paymentId,
        });
        onSuccess();
      } catch (err: any) {
        onError(
          err?.message ||
            "Payment succeeded but failed to record in ledger. Please contact support."
        );
      }
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Stripe PaymentElement */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900/50">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {cardMessage && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{cardMessage}</span>
        </div>
      )}

      <Button
        type="submit"
        disabled={isLoading || !stripe || !elements}
        className="w-full h-14 rounded-xl text-base font-bold shadow-xl shadow-primary/20 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 transition-all disabled:opacity-60"
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Pay ${amount.toFixed(2)} Securely
          </span>
        )}
      </Button>

      <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
        Secured by Stripe. Your card details are never stored on our servers.
      </p>
    </form>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Step indicator
// ──────────────────────────────────────────────────────────────────────

function StepBadge({ step, active, done }: { step: number; active: boolean; done: boolean }) {
  return (
    <div
      className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all",
        done
          ? "bg-emerald-500 border-emerald-500 text-white"
          : active
          ? "bg-primary border-primary text-primary-foreground"
          : "bg-muted border-border text-muted-foreground"
      )}
    >
      {done ? <CheckCircle2 className="h-4 w-4" /> : step}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────────────────────────────

type PageState = "amount" | "checkout" | "success" | "error";

export default function PayDuesPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>("amount");
  const [amount, setAmount] = useState<string>("");
  const [clientSecret, setClientSecret] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [publishableKey, setPublishableKey] = useState<string>("");

  // Fetch publishable key from backend (or fall back to env var)
  useEffect(() => {
    const envKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (envKey && !envKey.includes("REPLACE")) {
      setPublishableKey(envKey);
      return;
    }
    // Try to fetch from backend config endpoint
    apiGet<{ publishable_key: string }>("/payments/config")
      .then((data) => {
        if (data.publishable_key && !data.publishable_key.includes("placeholder")) {
          setPublishableKey(data.publishable_key);
        }
      })
      .catch(() => {});
  }, []);

  // Handle redirect-back from Stripe (3D Secure flows)
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const piClientSecret = query.get("payment_intent_client_secret");
    const piId = query.get("payment_intent");
    const redirectStatus = query.get("redirect_status");

    if (!piClientSecret || !piId) return;

    setClientSecret(piClientSecret);
    setPaymentId(piId);

    if (redirectStatus === "succeeded") {
      // Need to confirm on our backend — unit_id comes from PI metadata
      const confirmRedirectedPayment = async () => {
        try {
          if (!publishableKey) return;
          const stripe = await getStripe(publishableKey);
          if (!stripe) return;
          const { paymentIntent } = await stripe.retrievePaymentIntent(piClientSecret);
          if (paymentIntent?.status === "succeeded") {
            const meta = (paymentIntent as any).metadata || {};
            await apiPostJson("/payments/confirm", {
              unit_id: meta.unit_id || "",
              amount_cents: paymentIntent.amount,
              payment_id: paymentIntent.id,
            });
            setPageState("success");
          }
        } catch {
          setPageState("error");
          setErrorMsg("Payment recorded by Stripe but failed to update your ledger. Please contact support.");
        }
      };
      confirmRedirectedPayment();
    } else if (redirectStatus === "failed") {
      setPageState("error");
      setErrorMsg("Your payment was declined. Please try again with a different card.");
    }
  }, [publishableKey]);

  const handleInitiatePayment = useCallback(async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) return;

    setIsCreating(true);
    try {
      const data = await apiPostJson<any>("/payments/create-intent", {
        amount: amountNum,
        currency: "USD",
        description: "HOA Dues Payment",
      });
      setClientSecret(data.client_secret);
      setPaymentId(data.payment_id);
      setUnitId(data.unit_id || "");
      setPageState("checkout");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to initiate payment. Please try again.");
      setPageState("error");
    } finally {
      setIsCreating(false);
    }
  }, [amount]);

  const amountNum = parseFloat(amount) || 0;
  const isValidAmount = amountNum > 0;
  const isSuccess = pageState === "success";
  const isCheckout = pageState === "checkout";
  const isAmount = pageState === "amount";

  // ── Render states ─────────────────────────────────────────────────

  if (isSuccess) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto h-24 w-24 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Payment Successful!</h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-base">
              Your payment of <span className="font-bold text-foreground">${amountNum.toFixed(2)}</span> has been
              processed and recorded in your ledger.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="rounded-xl font-bold"
              onClick={() => router.push("/dashboard/dues-ledger")}
            >
              View My Ledger
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-xl"
              onClick={() => {
                setPageState("amount");
                setAmount("");
                setClientSecret("");
              }}
            >
              Make Another Payment
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto h-24 w-24 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
            <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Payment Issue</h2>
            <p className="mt-3 text-slate-500 dark:text-slate-400 text-base">{errorMsg}</p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              size="lg"
              className="rounded-xl"
              onClick={() => {
                setPageState("amount");
                setErrorMsg("");
                setClientSecret("");
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button size="lg" className="rounded-xl" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2 text-muted-foreground">
          <Link href="/dashboard/dues-ledger">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Ledger
          </Link>
        </Button>
        <h1 className="text-3xl font-extrabold tracking-tight">Pay HOA Dues</h1>
        <p className="mt-2 text-muted-foreground">
          Securely pay your community dues online via Stripe.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        <StepBadge step={1} active={isAmount} done={isCheckout || isSuccess} />
        <div className={cn("flex-1 h-0.5 rounded-full", isAmount ? "bg-border" : "bg-primary")} />
        <StepBadge step={2} active={isCheckout} done={isSuccess} />
        <div className={cn("flex-1 h-0.5 rounded-full", isSuccess ? "bg-primary" : "bg-border")} />
        <StepBadge step={3} active={false} done={isSuccess} />
        <div className="text-xs font-medium text-muted-foreground ml-1">
          {isAmount ? "Enter amount" : isCheckout ? "Card details" : "Done"}
        </div>
      </div>

      {/* ── Step 1: Amount Entry ── */}
      {pageState === "amount" && (
        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Enter Payment Amount</h2>
              <p className="text-sm text-muted-foreground">How much would you like to pay today?</p>
            </div>
          </div>

          {/* Quick amount buttons */}
          <div className="grid grid-cols-3 gap-3">
            {[150, 250, 500].map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(String(preset))}
                className={cn(
                  "py-3 rounded-xl text-sm font-bold border-2 transition-all",
                  amount === String(preset)
                    ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "border-border text-foreground hover:border-primary/50 hover:bg-primary/5"
                )}
              >
                ${preset}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Custom Amount (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">$</span>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-8 h-14 text-xl font-bold rounded-xl border-2 focus:border-primary"
              />
            </div>
          </div>

          {isValidAmount && (
            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total due now</span>
              <span className="text-2xl font-extrabold text-foreground">${amountNum.toFixed(2)}</span>
            </div>
          )}

          <Button
            size="lg"
            className="w-full h-14 rounded-xl text-base font-bold shadow-xl shadow-primary/25 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 transition-all"
            disabled={!isValidAmount || isCreating || !session}
            onClick={handleInitiatePayment}
          >
            {isCreating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing checkout…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Continue to Payment
              </span>
            )}
          </Button>

          {!session && (
            <p className="text-center text-sm text-destructive">
              You must be logged in to make a payment.
            </p>
          )}
        </div>
      )}

      {/* ── Step 2: Stripe Checkout ── */}
      {pageState === "checkout" && clientSecret && publishableKey && (
        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Card Details</h2>
              <p className="text-sm text-muted-foreground">
                Paying{" "}
                <span className="font-bold text-foreground">${amountNum.toFixed(2)}</span> via Stripe
              </p>
            </div>
          </div>

          <Elements
            stripe={getStripe(publishableKey)}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#7c3aed",
                  colorBackground: "#ffffff",
                  colorText: "#1e293b",
                  colorDanger: "#ef4444",
                  fontFamily: "Inter, system-ui, sans-serif",
                  spacingUnit: "4px",
                  borderRadius: "10px",
                },
              },
            }}
          >
            <CheckoutForm
              amount={amountNum}
              paymentId={paymentId}
              unitId={unitId}
              onSuccess={() => setPageState("success")}
              onError={(msg) => {
                setErrorMsg(msg);
                setPageState("error");
              }}
            />
          </Elements>

          <button
            type="button"
            className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
            onClick={() => {
              setPageState("amount");
              setClientSecret("");
            }}
          >
            ← Change amount
          </button>
        </div>
      )}

      {/* Stripe not configured banner */}
      {pageState === "checkout" && !publishableKey && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-6 text-center space-y-3">
          <AlertCircle className="h-8 w-8 text-amber-500 mx-auto" />
          <h3 className="font-bold text-amber-800 dark:text-amber-300">Stripe not yet configured</h3>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Add your{" "}
            <code className="font-mono bg-amber-200 dark:bg-amber-900 px-1.5 py-0.5 rounded">
              NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
            </code>{" "}
            to <code className="font-mono">.env.local</code> and your{" "}
            <code className="font-mono bg-amber-200 dark:bg-amber-900 px-1.5 py-0.5 rounded">
              STRIPE_SECRET_KEY
            </code>{" "}
            to the backend <code className="font-mono">.env</code>.
          </p>
        </div>
      )}
    </div>
  );
}
