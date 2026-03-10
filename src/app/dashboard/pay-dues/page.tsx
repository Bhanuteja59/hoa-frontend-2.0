"use client";

import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  PaymentElement,
  Elements,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

import { apiPostJson } from "@/lib/api";
import { useSession } from "next-auth/react";

// Initialize Stripe with the public key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_HYPERSWITCH_EX_KEY || "pk_test_...");

function CheckoutForm({ clientSecret, amount, paymentId, unitId }: { clientSecret: string; amount: number; paymentId: string; unitId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: `${window.location.origin}/dashboard/pay-dues`,
      },
      redirect: 'if_required',
    });

    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message || "An error occurred.");
      } else {
        setMessage("An unexpected error occurred.");
      }
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      // Record the payment in our database
      try {
        await apiPostJson("/payments/confirm", {
          unit_id: unitId,
          amount_cents: Math.round(amount * 100),
          payment_id: paymentId
        });
        setMessage("Success! Your payment has been processed.");
      } catch (confirmError) {
          console.error("Confirmation error:", confirmError);
          setMessage("Payment succeeded on Stripe but failed to record in ledger. Please contact support.");
      }
    }

    setIsLoading(false);
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PaymentElement id="payment-element" />
      <button
        disabled={isLoading || !stripe || !elements}
        id="submit"
        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        <span id="button-text">
          {isLoading ? "Processing..." : `Pay $${amount.toFixed(2)}`}
        </span>
      </button>
      {message && <div id="payment-message" className="p-4 bg-blue-50 text-blue-700 rounded border border-blue-200 text-center text-sm">{message}</div>}
      {message?.includes("Success") && (
           <button type="button" onClick={() => window.location.href = '/dashboard/dues-ledger'} className="text-sm underline text-center mt-2">
                Return to Dashboard
            </button>
      )}
    </form>
  );
}

export default function PayDuesPage() {
    const [amount, setAmount] = useState<number>(0);
    const [clientSecret, setClientSecret] = useState<string>("");
    const [paymentId, setPaymentId] = useState<string>("");
    const [unitId, setUnitId] = useState<string>("");
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const { data: session } = useSession();

    // Check for payment status if redirected back from Stripe
    useEffect(() => {
        const query = new URLSearchParams(window.location.search);
        const piClientSecret = query.get("payment_intent_client_secret");
        const piId = query.get("payment_intent");

        if (piClientSecret && piId) {
            setClientSecret(piClientSecret);
            setPaymentId(piId);
            
            // Verify status with Stripe
            const checkStatus = async () => {
                const stripe = await stripePromise;
                if (!stripe) return;

                console.log("Checking status for PI:", piId);
                const { paymentIntent } = await stripe.retrievePaymentIntent(piClientSecret);
                console.log("Retrieved PI:", paymentIntent);
                
                if (paymentIntent?.status === "succeeded") {
                    // Record it in our DB
                    try {
                        const confirmData = {
                            unit_id: (paymentIntent as any).metadata?.unit_id || "",
                            amount_cents: paymentIntent.amount,
                            payment_id: paymentIntent.id
                        };
                        console.log("Sending confirmation to backend:", confirmData);
                        await apiPostJson("/payments/confirm", confirmData);
                        setStatusMessage("Success! Your redirected payment has been processed and recorded.");
                    } catch (e) {
                        console.error("Backend confirmation failed:", e);
                        setStatusMessage("Payment succeeded on Stripe but failed to record. Please contact support.");
                    }
                } else if (paymentIntent?.status === "processing") {
                    setStatusMessage("Your payment is processing.");
                } else {
                    setStatusMessage(`Payment status: ${paymentIntent?.status || 'unknown'}`);
                }
            };
            checkStatus();
        }
    }, []);

    const initiatePayment = async () => {
        try {
            const data = await apiPostJson<any>("/payments/create-intent", {
                amount: amount,
                currency: "USD",
                description: "HOA Dues Payment"
            });

            setClientSecret(data.client_secret);
            setPaymentId(data.payment_id);
            setUnitId(data.unit_id);

            if (!data.unit_id) {
                alert("Your account is not associated with a unit. Payment will not be recorded in your ledger.");
            }
        } catch (error) {
            console.error("Error creating payment:", error);
            alert("Failed to initiate payment. Check console.");
        }
    };

    if (statusMessage) {
        return (
            <div className="p-8 max-w-lg mx-auto text-center border rounded-xl bg-background shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Payment Status</h2>
                <div className="p-4 bg-blue-50 text-blue-700 rounded-lg border mb-6">
                    {statusMessage}
                </div>
                <button 
                    onClick={() => window.location.href = '/dashboard/dues-ledger'} 
                    className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-lg mx-auto">
            <h1 className="text-2xl font-bold mb-4">Pay HOA Dues</h1>

            {!clientSecret ? (
                <div className="flex flex-col gap-4">
                    <label className="flex flex-col">
                        <span className="font-semibold mb-1">Amount (USD)</span>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(Number(e.target.value))}
                            className="border p-2 rounded"
                            min="0.01"
                        />
                    </label>
                    <button
                        onClick={initiatePayment}
                        disabled={amount <= 0 || !session}
                        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        Initiate Payment
                    </button>
                </div>
            ) : (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CheckoutForm clientSecret={clientSecret} amount={amount} paymentId={paymentId} unitId={unitId} />
                </Elements>
            )}
        </div>
    );
}
