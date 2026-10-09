import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Handshake,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  User,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import type { DebtRecord } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

export default function DebtModule() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [repayModalDebt, setRepayModalDebt] = useState<DebtRecord | null>(null);

  const [addForm, setAddForm] = useState({
    record_type: "borrowed" as DebtRecord["record_type"],
    person_name: "",
    contact_info: "",
    principal_amount: "",
    interest_rate: "0",
    start_date: new Date().toISOString().split("T")[0],
    due_date: "",
    notes: "",
  });

  const [repayForm, setRepayForm] = useState({
    amount: "",
    repayment_date: new Date().toISOString().split("T")[0],
    payment_method: "UPI",
    notes: "",
  });

  const { data: debts = [], isLoading } = useQuery({
    queryKey: ["debts", filterType],
    queryFn: () => api.debt.list(filterType ? { record_type: filterType } : {}),
  });

  const createDebtMutation = useMutation({
    mutationFn: (data: Partial<DebtRecord>) => api.debt.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Debt / Loan record created!");
      setIsAddModalOpen(false);
      setAddForm({
        record_type: "borrowed",
        person_name: "",
        contact_info: "",
        principal_amount: "",
        interest_rate: "0",
        start_date: new Date().toISOString().split("T")[0],
        due_date: "",
        notes: "",
      });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create debt record"),
  });

  const repayMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof repayForm }) =>
      api.debt.repay(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Repayment recorded successfully!");
      setRepayModalDebt(null);
      setRepayForm({
        amount: "",
        repayment_date: new Date().toISOString().split("T")[0],
        payment_method: "UPI",
        notes: "",
      });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to record repayment"),
  });

  const deleteDebtMutation = useMutation({
    mutationFn: (id: number) => api.debt.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Debt record deleted");
    },
  });

  const filtered = debts.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.person_name.toLowerCase().includes(q) ||
      d.contact_info.toLowerCase().includes(q) ||
      d.notes.toLowerCase().includes(q)
    );
  });

  const totalBorrowedRem = debts
    .filter((d) => d.record_type === "borrowed" && d.status !== "settled")
    .reduce((sum, d) => sum + Number(d.remaining_balance || d.principal_amount), 0);

  const totalLentRem = debts
    .filter((d) => d.record_type === "lent" && d.status !== "settled")
    .reduce((sum, d) => sum + Number(d.remaining_balance || d.principal_amount), 0);

  const netBalance = totalLentRem - totalBorrowedRem;

  return (
    <div className="space-y-6">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-rose-200 dark:border-rose-900/40 bg-gradient-to-br from-rose-500/10 via-background to-transparent">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-400">
            <ArrowDownLeft className="h-4 w-4" /> Money Borrowed (I Owe)
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-2">
            ₹{totalBorrowedRem.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-muted-foreground">Outstanding liability</span>
        </Card>

        <Card className="p-4 border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-500/10 via-background to-transparent">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <ArrowUpRight className="h-4 w-4" /> Money Lent (Owed to Me)
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-2">
            ₹{totalLentRem.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-muted-foreground">Receivable balance</span>
        </Card>

        <Card className="p-4 border-blue-200 dark:border-blue-900/40 bg-gradient-to-br from-blue-500/10 via-background to-transparent">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
            <Handshake className="h-4 w-4" /> Net Debt Position
          </div>
          <div
            className={`text-2xl font-extrabold mt-2 ${
              netBalance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {netBalance >= 0 ? "+" : "-"}₹
            {Math.abs(netBalance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-muted-foreground">
            {netBalance >= 0 ? "Overall net positive" : "Overall net payable"}
          </span>
        </Card>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search person, contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-muted p-1 rounded-xl">
            <button
              onClick={() => setFilterType("")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                filterType === "" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("borrowed")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                filterType === "borrowed" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Borrowed
            </button>
            <button
              onClick={() => setFilterType("lent")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                filterType === "lent" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Lent
            </button>
          </div>

          <Button
            onClick={() => setIsAddModalOpen(true)}
            size="sm"
            className="bg-[#007ACC] hover:bg-[#0060a0] text-white"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add Agreement
          </Button>
        </div>
      </div>

      {/* Debts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
            Loading borrowing & lending records...
          </div>
        ) : filtered.length === 0 ? (
          <Card className="col-span-full border-dashed border-2 p-8 text-center">
            <Handshake className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
            <h3 className="font-semibold text-foreground">No Borrowing or Lending Records</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Track money owed to friends, family, or lenders, plus partial repayments.
            </p>
            <Button onClick={() => setIsAddModalOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Record
            </Button>
          </Card>
        ) : (
          filtered.map((debt) => {
            const isBorrowed = debt.record_type === "borrowed";
            const rem = Number(debt.remaining_balance);
            const total = Number(debt.principal_amount);
            const repaid = total - rem;
            const pct = Math.min(100, Math.round((repaid / total) * 100));

            return (
              <Card key={debt.id} className="relative overflow-hidden hover:shadow-md transition-all">
                <CardContent className="p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-2 rounded-xl text-white ${
                          isBorrowed ? "bg-rose-500" : "bg-emerald-500"
                        }`}
                      >
                        {isBorrowed ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{debt.person_name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge
                            variant={isBorrowed ? "destructive" : "success"}
                            className="text-[9px] uppercase py-0"
                          >
                            {isBorrowed ? "Borrowed (Owe)" : "Lent (Due)"}
                          </Badge>
                          {debt.contact_info && (
                            <span className="text-[11px] text-muted-foreground">
                              • {debt.contact_info}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <Badge
                        variant={
                          debt.status === "settled"
                            ? "success"
                            : debt.status === "partially_paid"
                            ? "info"
                            : "outline"
                        }
                        className="text-[9px] py-0"
                      >
                        {debt.status.replace("_", " ").toUpperCase()}
                      </Badge>
                      <button
                        onClick={() => deleteDebtMutation.mutate(debt.id)}
                        className="p-1 text-muted-foreground hover:text-rose-500 rounded-md transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amounts breakdown */}
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Principal Amount</span>
                      <span className="font-semibold text-foreground">
                        ₹{total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] block">Remaining Balance</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        ₹{rem.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Repayment progress bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Repaid: ₹{repaid.toLocaleString("en-IN")} ({pct}%)</span>
                      {debt.due_date && <span>Due: {debt.due_date}</span>}
                    </div>
                  </div>

                  {debt.notes && (
                    <p className="text-[11px] text-muted-foreground italic bg-muted/40 p-2 rounded-lg">
                      "{debt.notes}"
                    </p>
                  )}

                  {debt.status !== "settled" && (
                    <div className="pt-2 border-t border-border flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-emerald-500 text-emerald-600 hover:bg-emerald-500/10"
                        onClick={() => {
                          setRepayModalDebt(debt);
                          setRepayForm((prev) => ({
                            ...prev,
                            amount: String(rem),
                          }));
                        }}
                      >
                        <DollarSign className="h-3 w-3 mr-1" /> Record Repayment
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal: Add Debt Agreement */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Borrowing or Lending Agreement"
        description="Track principal, due date, and parties involved."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createDebtMutation.mutate({
              record_type: addForm.record_type,
              person_name: addForm.person_name,
              contact_info: addForm.contact_info,
              principal_amount: addForm.principal_amount,
              interest_rate: addForm.interest_rate || "0",
              start_date: addForm.start_date,
              due_date: addForm.due_date || null,
              notes: addForm.notes,
            });
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type *</Label>
              <select
                value={addForm.record_type}
                onChange={(e) =>
                  setAddForm({ ...addForm, record_type: e.target.value as DebtRecord["record_type"] })
                }
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                <option value="borrowed">Borrowed (Money I owe to someone)</option>
                <option value="lent">Lent (Money someone owes me)</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Principal Amount (₹) *</Label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={addForm.principal_amount}
                onChange={(e) => setAddForm({ ...addForm, principal_amount: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Person Name *</Label>
              <Input
                required
                placeholder="e.g. Anand, Suresh"
                value={addForm.person_name}
                onChange={(e) => setAddForm({ ...addForm, person_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Contact Info (Phone / Email)</Label>
              <Input
                placeholder="+91 98765 43210"
                value={addForm.contact_info}
                onChange={(e) => setAddForm({ ...addForm, contact_info: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Date *</Label>
              <Input
                type="date"
                required
                value={addForm.start_date}
                onChange={(e) => setAddForm({ ...addForm, start_date: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Due Date (Optional)</Label>
              <Input
                type="date"
                value={addForm.due_date}
                onChange={(e) => setAddForm({ ...addForm, due_date: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Agreement Notes</Label>
            <Input
              placeholder="e.g. Emergency medical advance, to be settled next month"
              value={addForm.notes}
              onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createDebtMutation.isPending}>
              {createDebtMutation.isPending ? "Creating..." : "Save Agreement"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Record Repayment */}
      <Modal
        isOpen={!!repayModalDebt}
        onClose={() => setRepayModalDebt(null)}
        title={`Record Repayment for ${repayModalDebt?.person_name || ""}`}
        description="Log partial or full repayment to update balance."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (repayModalDebt) {
              repayMutation.mutate({
                id: repayModalDebt.id,
                data: repayForm,
              });
            }
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Repayment Amount (₹) *</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={repayForm.amount}
                onChange={(e) => setRepayForm({ ...repayForm, amount: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Payment Date *</Label>
              <Input
                type="date"
                required
                value={repayForm.repayment_date}
                onChange={(e) => setRepayForm({ ...repayForm, repayment_date: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Payment Method</Label>
              <Input
                placeholder="UPI, Cash, Bank Transfer"
                value={repayForm.payment_method}
                onChange={(e) => setRepayForm({ ...repayForm, payment_method: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Input
                placeholder="Optional notes"
                value={repayForm.notes}
                onChange={(e) => setRepayForm({ ...repayForm, notes: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="ghost" onClick={() => setRepayModalDebt(null)}>
              Cancel
            </Button>
            <Button type="submit" disabled={repayMutation.isPending}>
              {repayMutation.isPending ? "Recording..." : "Save Repayment"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
