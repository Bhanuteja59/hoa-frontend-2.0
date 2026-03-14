"use client";

import { useMemo, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { apiGet, apiPostJson } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Building2,
  Receipt,
  History,
  Info,
  Calendar,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const chargeSchema = z.object({
  unit_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  description: z.string().min(2),
});

const paymentSchema = z.object({
  unit_id: z.string().uuid(),
  amount_cents: z.number().int().positive(),
  method: z.string().min(1),
  reference: z.string().optional().nullable(),
});

export default function LedgerPage() {
  const { data: session }: any = useSession();
  const roles: string[] = session?.roles ?? [];
  const isAdmin = roles.includes("ADMIN") || roles.includes("BOARD") || roles.includes("BOARD_MEMBER");

  const qc = useQueryClient();

  // States
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [chargeAmt, setChargeAmt] = useState<number>(250.0);
  const [chargeDesc, setChargeDesc] = useState<string>("Monthly dues");
  const [payAmt, setPayAmt] = useState<number>(250.0);
  const [payMethod, setPayMethod] = useState<string>("MANUAL");
  const [payRef, setPayRef] = useState<string>("");

  // Queries
  const summary = useQuery({
    queryKey: ["ledger-summary"],
    queryFn: () => apiGet<any[]>("/ledger/summary"),
    enabled: isAdmin,
  });

  const balance = useQuery({
    queryKey: ["balance", selectedUnitId],
    queryFn: () =>
      apiGet<any>(
        selectedUnitId
          ? `/ledger/balance?unit_id=${encodeURIComponent(selectedUnitId)}`
          : "/ledger/balance"
      ),
    enabled: !!session,
    // Auto-refresh frequently for admins to track updates in near real-time
    refetchInterval: isAdmin ? 10000 : false,
    refetchOnWindowFocus: isAdmin,
  });

  const history = useQuery({
    queryKey: ["history", selectedUnitId],
    queryFn: () =>
      apiGet<any[]>(
        selectedUnitId
          ? `/ledger/history?unit_id=${encodeURIComponent(selectedUnitId)}`
          : "/ledger/history"
      ),
    enabled: !!session,
    // Keep the ledger history up-to-date for admin users
    refetchInterval: isAdmin ? 10000 : false,
    refetchOnWindowFocus: isAdmin,
  });

  // Automatically select first unit for admin if non-selected
  useEffect(() => {
    if (isAdmin && summary.data && summary.data.length > 0 && !selectedUnitId) {
      setSelectedUnitId(summary.data[0].unit_id);
    }
  }, [isAdmin, summary.data, selectedUnitId]);

  // Mutations
  const createCharge = useMutation({
    mutationFn: (body: any) => apiPostJson<any>("/ledger/charges", body),
    onSuccess: async () => {
      setChargeDesc("Monthly dues");
      await qc.invalidateQueries({ queryKey: ["balance"] });
      await qc.invalidateQueries({ queryKey: ["history"] });
      await qc.invalidateQueries({ queryKey: ["ledger-summary"] });
    },
  });

  const createPayment = useMutation({
    mutationFn: (body: any) => apiPostJson<any>("/ledger/payments", body),
    onSuccess: async () => {
      setPayRef("");
      await qc.invalidateQueries({ queryKey: ["balance"] });
      await qc.invalidateQueries({ queryKey: ["history"] });
      await qc.invalidateQueries({ queryKey: ["ledger-summary"] });
    },
  });

  const filteredSummary = useMemo(() => {
    if (!summary.data) return [];
    return summary.data.filter((u: any) => {
      const label = `${u.building_name || ""} ${u.unit_number}`.toLowerCase();
      return label.includes(searchTerm.toLowerCase());
    });
  }, [summary.data, searchTerm]);

  const selectedUnit = useMemo(() => {
    return summary.data?.find((u: any) => u.unit_id === selectedUnitId);
  }, [summary.data, selectedUnitId]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Top Header */}
      <div className="p-6 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              Financial Ledger
            </h2>
            <p className="text-muted-foreground mt-1">
              Manage community dues, charges, and payment history.
            </p>
          </div>
          <Button asChild className="rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95">
            <Link href="/dashboard/pay-dues">
              <DollarSign className="mr-2 h-4 w-4" />
              Pay Dues Online
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Unit Browser Sidebar (Admin Only) */}
        {isAdmin && (
          <div className="w-80 border-r bg-muted/30 flex flex-col hidden md:flex">
            <div className="p-4 border-b space-y-4 bg-background">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search units..."
                  className="pl-9 bg-muted/50 border-black/10 dark:border-white/10 rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <span>Unit List</span>
                <Badge variant="secondary" className="rounded-md">{filteredSummary.length}</Badge>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {summary.isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))
              ) : filteredSummary.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground italic text-sm">
                  No units found.
                </div>
              ) : (
                filteredSummary.map((u: any) => (
                  <button
                    key={u.unit_id}
                    onClick={() => setSelectedUnitId(u.unit_id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                      selectedUnitId === u.unit_id
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02] z-10"
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">
                          {u.building_name ? `${u.building_name} - ` : ""}
                          {u.unit_number}
                        </span>
                        <span className={cn(
                          "text-[10px] uppercase font-bold tracking-tighter opacity-80",
                          selectedUnitId === u.unit_id ? "text-primary-foreground/80" : "text-muted-foreground"
                        )}>
                          Unit ID: {u.unit_id.slice(0, 8)}
                        </span>
                      </div>
                      <div className={cn(
                        "text-sm font-black",
                        u.balance_cents > 0
                          ? (selectedUnitId === u.unit_id ? "text-primary-foreground" : "text-destructive")
                          : (selectedUnitId === u.unit_id ? "text-primary-foreground" : "text-emerald-500")
                      )}>
                        ${(u.balance_cents / 100).toFixed(2)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/20">
          <div className="p-6 space-y-6 max-w-5xl mx-auto">
            {/* Context Stats / Overview */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                    Current Balance
                  </CardTitle>
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-black">
                    {balance.isLoading ? (
                      <Skeleton className="h-10 w-32" />
                    ) : (
                      `$${((balance.data?.balance_cents ?? 0) / 100).toFixed(2)}`
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Building2 className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground font-medium">
                      {isAdmin && selectedUnit
                        ? `${selectedUnit.building_name || "HOA"} - Unit ${selectedUnit.unit_number}`
                        : "Current Unit Account"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {isAdmin && (
                <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                      Unit Selection
                    </CardTitle>
                    <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Building2 className="h-5 w-5" />
                    </div>
                  </CardHeader>
                  <CardContent className="md:hidden">
                    <Select value={selectedUnitId} onValueChange={setSelectedUnitId}>
                      <SelectTrigger className="rounded-xl border-muted bg-muted/20">
                        <SelectValue placeholder="Change Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {summary.data?.map((u: any) => (
                          <SelectItem key={u.unit_id} value={u.unit_id}>
                            {u.building_name ? `${u.building_name} - ${u.unit_number}` : `Unit ${u.unit_number}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                  <CardContent className="hidden md:block">
                    <div className="text-xl font-bold truncate">
                      {selectedUnit?.building_name || "Community"}
                    </div>
                    <div className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mt-1">
                      <Badge variant="outline" className="rounded-md border-primary/20 text-primary uppercase text-[8px] font-black">Active Context</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {isAdmin && selectedUnitId && (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Posting Actions */}
                <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50">
                  <Tabs defaultValue="charge" className="w-full">
                    <div className="px-6 pt-6 flex items-center justify-between">
                      <h3 className="font-bold flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-primary" />
                        Post Transaction
                      </h3>
                      <TabsList className="bg-muted/50 p-1 rounded-xl h-9">
                        <TabsTrigger value="charge" className="rounded-lg text-xs font-bold px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">Charge</TabsTrigger>
                        <TabsTrigger value="payment" className="rounded-lg text-xs font-bold px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">Payment</TabsTrigger>
                      </TabsList>
                    </div>

                    <TabsContent value="charge" className="p-6 space-y-4 m-0">
                      <div className="grid gap-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Description</label>
                        <Input
                          value={chargeDesc}
                          onChange={(e) => setChargeDesc(e.target.value)}
                          placeholder="e.g., Late Fee, Garden Maintenance"
                          className="rounded-xl border-muted/50 bg-muted/20 h-11"
                        />
                      </div>
                      <div className="grid gap-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Amount (USD)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            value={chargeAmt}
                            onChange={(e) => setChargeAmt(Number(e.target.value))}
                            className="pl-9 rounded-xl border-muted/50 bg-muted/20 h-11"
                          />
                        </div>
                      </div>
                      <Button
                        className="w-full h-11 rounded-xl font-bold bg-gradient-to-r from-red-600 to-rose-600 hover:shadow-lg hover:shadow-red-500/20"
                        onClick={() => {
                          const parsed = chargeSchema.safeParse({
                            unit_id: selectedUnitId,
                            amount_cents: Math.round(chargeAmt * 100),
                            description: chargeDesc,
                          });
                          if (!parsed.success) {
                            alert("Validation error: " + parsed.error.issues.map((i) => i.message).join(", "));
                            return;
                          }
                          createCharge.mutate(parsed.data);
                        }}
                        disabled={createCharge.isPending}
                      >
                        <ArrowUpRight className="mr-2 h-4 w-4" />
                        {createCharge.isPending ? "Posting..." : "Post Charge"}
                      </Button>
                    </TabsContent>

                    <TabsContent value="payment" className="p-6 space-y-4 m-0">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Method</label>
                          <Select value={payMethod} onValueChange={setPayMethod}>
                            <SelectTrigger className="rounded-xl border-muted/50 bg-muted/20 h-11">
                              <SelectValue placeholder="Method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MANUAL">Manual</SelectItem>
                              <SelectItem value="CHECK">Check</SelectItem>
                              <SelectItem value="CASH">Cash</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-2">
                          <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Reference</label>
                          <Input
                            value={payRef}
                            onChange={(e) => setPayRef(e.target.value)}
                            placeholder="Check #"
                            className="rounded-xl border-muted/50 bg-muted/20 h-11"
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Amount (USD)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            value={payAmt}
                            onChange={(e) => setPayAmt(Number(e.target.value))}
                            className="pl-9 rounded-xl border-muted/50 bg-muted/20 h-11"
                          />
                        </div>
                      </div>
                      <Button
                        className="w-full h-11 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 hover:shadow-lg hover:shadow-emerald-500/20"
                        onClick={() => {
                          const parsed = paymentSchema.safeParse({
                            unit_id: selectedUnitId,
                            amount_cents: Math.round(payAmt * 100),
                            method: payMethod,
                            reference: payRef || null,
                          });
                          if (!parsed.success) {
                            alert("Validation error: " + parsed.error.issues.map((i) => i.message).join(", "));
                            return;
                          }
                          createPayment.mutate(parsed.data);
                        }}
                        disabled={createPayment.isPending}
                      >
                        <ArrowDownLeft className="mr-2 h-4 w-4" />
                        {createPayment.isPending ? "Recording..." : "Record Payment"}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </Card>

                {/* Info Card / Helpful links */}
                <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50 bg-gradient-to-br from-indigo-600 to-primary text-white p-8 relative overflow-hidden group">
                  <div className="relative z-10 flex flex-col h-full">
                    <h3 className="text-2xl font-black mb-2">Ledger Insights</h3>
                    <p className="text-white/70 text-sm mb-6 max-w-[80%]">
                      Administrative tools allow you to manage financial fairness within your community. Ensure all charges are accurately described.
                    </p>

                    <div className="mt-auto flex gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">Status</span>
                        <Badge className="bg-white/20 text-white rounded-md mt-1 border-none backdrop-blur-md">Secure API</Badge>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">Visibility</span>
                        <Badge className="bg-white/20 text-white rounded-md mt-1 border-none backdrop-blur-md">Admin Only</Badge>
                      </div>
                    </div>
                  </div>
                  {/* Decorative Blob */}
                  <div className="absolute -right-10 -bottom-10 h-64 w-64 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-all duration-500" />
                </Card>
              </div>
            )}

            {/* Transaction History Section */}
            <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none dark:bg-slate-900/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-4 w-4 text-primary" />
                    Transaction History
                  </CardTitle>
                  <CardDescription>Recent charges and payments logged for this unit.</CardDescription>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
                  <Calendar className="h-3 w-3" />
                  {new Date().getFullYear()} Report
                </div>
              </CardHeader>
              <CardContent>
                {history.isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : !history.data || history.data.length === 0 ? (
                  <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                      <Info className="h-8 w-8" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">No transactions found</p>
                      <p className="text-sm text-muted-foreground">No financial activity has been recorded for this unit yet.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.data.map((tx: any) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-5 border-muted/50 border rounded-2xl bg-muted/10 hover:bg-muted/20 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center transition-all group-hover:rotate-12",
                            tx.type === 'CHARGE' ? "bg-rose-100 text-rose-600 dark:bg-rose-950/40" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40"
                          )}>
                            {tx.type === 'CHARGE' ? <ArrowUpRight className="h-6 w-6" /> : <ArrowDownLeft className="h-6 w-6" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-base leading-none mb-1">{tx.description}</span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-tighter">
                              <span>{new Date(tx.posted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              <span>•</span>
                              <span>{tx.type}</span>
                              {tx.reference && (
                                <>
                                  <span>•</span>
                                  <span className="font-bold lowercase">Ref: {tx.reference.slice(0, 12)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={cn(
                          "text-xl font-black tabular-nums",
                          tx.type === "CHARGE" ? "text-rose-600" : "text-emerald-500"
                        )}>
                          ${ (tx.amount_cents / 100).toFixed(2) }
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
