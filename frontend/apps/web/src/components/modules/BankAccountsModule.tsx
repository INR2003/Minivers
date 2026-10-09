import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  Wallet,
  CreditCard,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { api } from "@/lib/api";
import type { BankAccount, MoneyTransaction } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

export default function BankAccountsModule() {
  const queryClient = useQueryClient();
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);

  // Form states for account
  const [accForm, setAccForm] = useState({
    account_name: "",
    bank_name: "",
    account_type: "savings" as BankAccount["account_type"],
    account_number_last4: "",
    opening_balance: "",
    color: "#007ACC",
  });

  // Form states for transaction
  const [txForm, setTxForm] = useState({
    account: 0,
    to_account: "" as string | number,
    transaction_type: "expense" as MoneyTransaction["transaction_type"],
    amount: "",
    category: "General",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: () => api.bankAccounts.list(),
  });

  const { data: transactions = [], isLoading: txLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: () => api.transactions.list(),
  });

  const createAccountMutation = useMutation({
    mutationFn: (data: Partial<BankAccount>) => api.bankAccounts.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Bank account added successfully!");
      setIsAddAccountOpen(false);
      setAccForm({
        account_name: "",
        bank_name: "",
        account_type: "savings",
        account_number_last4: "",
        opening_balance: "",
        color: "#007ACC",
      });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to add account"),
  });

  const createTxMutation = useMutation({
    mutationFn: (data: Partial<MoneyTransaction>) => api.transactions.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Transaction recorded and balance updated!");
      setIsAddTxOpen(false);
      setTxForm({
        account: accounts[0]?.id || 0,
        to_account: "",
        transaction_type: "expense",
        amount: "",
        category: "General",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to record transaction"),
  });

  const totalBalance = accounts.reduce((acc, a) => acc + Number(a.current_balance || 0), 0);

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "wallet":
        return <Wallet className="h-5 w-5" />;
      case "credit_card":
        return <CreditCard className="h-5 w-5" />;
      default:
        return <Building2 className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-cyan-500/5 to-teal-500/10 border border-blue-200 dark:border-blue-900/40">
        <div>
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Total Net Balance
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              ₹{totalBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h2>
            <span className="text-xs text-muted-foreground">across {accounts.length} accounts</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              if (accounts.length > 0 && !txForm.account) {
                setTxForm((prev) => ({ ...prev, account: accounts[0].id }));
              }
              setIsAddTxOpen(true);
            }}
            variant="outline"
            className="border-blue-300 dark:border-blue-800"
          >
            <ArrowLeftRight className="h-4 w-4 mr-1.5 text-blue-600 dark:text-blue-400" />
            Record Transaction
          </Button>
          <Button
            onClick={() => setIsAddAccountOpen(true)}
            className="bg-[#007ACC] hover:bg-[#0060a0] text-white"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Account
          </Button>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accountsLoading ? (
          <div className="col-span-full py-8 text-center text-muted-foreground">
            Loading bank accounts...
          </div>
        ) : accounts.length === 0 ? (
          <Card className="col-span-full border-dashed border-2 p-8 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
            <h3 className="font-semibold text-foreground">No Bank Accounts Added</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Connect your savings, current, wallet, or salary accounts to track balances.
            </p>
            <Button onClick={() => setIsAddAccountOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add Your First Account
            </Button>
          </Card>
        ) : (
          accounts.map((acc) => (
            <Card
              key={acc.id}
              className="relative overflow-hidden border transition-all hover:shadow-md"
            >
              <div
                className="h-1.5 w-full"
                style={{ backgroundColor: acc.color || "#007ACC" }}
              />
              <CardContent className="p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="p-2 rounded-xl text-white shadow-xs"
                      style={{ backgroundColor: acc.color || "#007ACC" }}
                    >
                      {getAccountIcon(acc.account_type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{acc.account_name}</h4>
                      <p className="text-xs text-muted-foreground">{acc.bank_name}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                    {acc.account_type.replace("_", " ")}
                  </Badge>
                </div>

                <div className="mt-5 space-y-1">
                  <span className="text-[11px] text-muted-foreground block">Available Balance</span>
                  <div className="text-2xl font-extrabold text-foreground tracking-tight">
                    ₹{Number(acc.current_balance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    A/C: {acc.account_number_last4 ? `•••• ${acc.account_number_last4}` : "Active"}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-3.5 w-3.5" /> Masked & Secure
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Recent Transactions List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Transaction History</CardTitle>
              <CardDescription className="text-xs">
                Real-time deposits, withdrawals, and account transfers
              </CardDescription>
            </div>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {txLoading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Loading transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No transactions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.slice(0, 10).map((tx) => {
                const isIncome = tx.transaction_type === "income";
                const isTransfer = tx.transaction_type === "transfer";
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3.5 sm:px-6 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
                      <div
                        className={`p-2 rounded-xl text-white shrink-0 ${
                          isIncome
                            ? "bg-emerald-500"
                            : isTransfer
                            ? "bg-blue-500"
                            : "bg-rose-500"
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : isTransfer ? (
                          <ArrowLeftRight className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {tx.description || tx.category}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {tx.date} • {tx.account_name}
                          {tx.to_account_name ? ` → ${tx.to_account_name}` : ""}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-sm font-bold ${
                          isIncome
                            ? "text-emerald-600 dark:text-emerald-400"
                            : isTransfer
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isIncome ? "+" : "-"}₹
                        {Number(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <Badge variant="outline" className="text-[9px] py-0">
                        {tx.category}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Add Bank Account */}
      <Modal
        isOpen={isAddAccountOpen}
        onClose={() => setIsAddAccountOpen(false)}
        title="Add Bank Account or Wallet"
        description="Add a private account to track your balances and transactions."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createAccountMutation.mutate({
              account_name: accForm.account_name,
              bank_name: accForm.bank_name,
              account_type: accForm.account_type,
              account_number_last4: accForm.account_number_last4,
              opening_balance: accForm.opening_balance || "0",
              color: accForm.color,
            });
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <Label className="text-xs">Account Nickname *</Label>
            <Input
              required
              placeholder="e.g. HDFC Salary, SBI Primary, Cash Wallet"
              value={accForm.account_name}
              onChange={(e) => setAccForm({ ...accForm, account_name: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Bank / Institution Name *</Label>
              <Input
                required
                placeholder="e.g. HDFC Bank, SBI, Cash"
                value={accForm.bank_name}
                onChange={(e) => setAccForm({ ...accForm, bank_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Account Type</Label>
              <select
                value={accForm.account_type}
                onChange={(e) =>
                  setAccForm({ ...accForm, account_type: e.target.value as BankAccount["account_type"] })
                }
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                <option value="savings">Savings Account</option>
                <option value="salary">Salary Account</option>
                <option value="current">Current Account</option>
                <option value="wallet">Cash / Wallet</option>
                <option value="credit_card">Credit Card</option>
                <option value="investment">Investment</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Opening Balance (₹) *</Label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={accForm.opening_balance}
                onChange={(e) => setAccForm({ ...accForm, opening_balance: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Last 4 Digits (Masked)</Label>
              <Input
                maxLength={4}
                placeholder="4821"
                value={accForm.account_number_last4}
                onChange={(e) => setAccForm({ ...accForm, account_number_last4: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Card Color Accent</Label>
            <div className="flex gap-2 mt-1.5">
              {["#007ACC", "#059669", "#D97706", "#7C3AED", "#DC2626", "#4B5563"].map((col) => (
                <button
                  type="button"
                  key={col}
                  onClick={() => setAccForm({ ...accForm, color: col })}
                  className={`h-6 w-6 rounded-full border-2 ${
                    accForm.color === col ? "border-foreground scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: col }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="ghost" onClick={() => setIsAddAccountOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAccountMutation.isPending}>
              {createAccountMutation.isPending ? "Adding..." : "Add Bank Account"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Transaction */}
      <Modal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        title="Record Bank Transaction"
        description="Deposit income, withdraw expenses, or transfer funds."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createTxMutation.mutate({
              account: Number(txForm.account),
              to_account: txForm.to_account ? Number(txForm.to_account) : null,
              transaction_type: txForm.transaction_type,
              amount: txForm.amount,
              category: txForm.category,
              description: txForm.description,
              date: txForm.date,
            });
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Transaction Type</Label>
              <select
                value={txForm.transaction_type}
                onChange={(e) =>
                  setTxForm({
                    ...txForm,
                    transaction_type: e.target.value as MoneyTransaction["transaction_type"],
                  })
                }
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                <option value="expense">Withdrawal / Expense</option>
                <option value="income">Deposit / Income</option>
                <option value="transfer">Account Transfer</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Amount (₹) *</Label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={txForm.amount}
                onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">
                {txForm.transaction_type === "transfer" ? "From Account *" : "Account *"}
              </Label>
              <select
                required
                value={txForm.account}
                onChange={(e) => setTxForm({ ...txForm, account: Number(e.target.value) })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.account_name} (₹{Number(a.current_balance).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>

            {txForm.transaction_type === "transfer" && (
              <div>
                <Label className="text-xs">To Account *</Label>
                <select
                  required
                  value={txForm.to_account}
                  onChange={(e) => setTxForm({ ...txForm, to_account: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
                >
                  <option value="">Select recipient account</option>
                  {accounts
                    .filter((a) => a.id !== Number(txForm.account))
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.account_name}
                      </option>
                    ))}
                </select>
              </div>
            )}

            {txForm.transaction_type !== "transfer" && (
              <div>
                <Label className="text-xs">Category</Label>
                <Input
                  placeholder="e.g. Salary, Groceries, Fuel"
                  value={txForm.category}
                  onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                  className="mt-1"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={txForm.date}
                onChange={(e) => setTxForm({ ...txForm, date: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Description / Note</Label>
              <Input
                placeholder="Optional description"
                value={txForm.description}
                onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="ghost" onClick={() => setIsAddTxOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTxMutation.isPending}>
              {createTxMutation.isPending ? "Recording..." : "Save Transaction"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
