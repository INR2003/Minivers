import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Receipt,
  Plus,
  Download,
  Trash2,
  PieChart,
  ShoppingBag,
  Utensils,
  Car,
  Zap,
  HeartPulse,
  Tag,
  AlertCircle,
} from "lucide-react";
import { api } from "@/lib/api";
import type { DailyExpense } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

const PRESET_CATEGORIES = [
  { name: "Food & Dining", icon: Utensils, color: "text-amber-500 bg-amber-500/10" },
  { name: "Travel & Fuel", icon: Car, color: "text-blue-500 bg-blue-500/10" },
  { name: "Shopping & Retail", icon: ShoppingBag, color: "text-purple-500 bg-purple-500/10" },
  { name: "Bills & Utilities", icon: Zap, color: "text-emerald-500 bg-emerald-500/10" },
  { name: "Health & Fitness", icon: HeartPulse, color: "text-rose-500 bg-rose-500/10" },
  { name: "Other Expenses", icon: Tag, color: "text-slate-500 bg-slate-500/10" },
];

export default function ExpensesModule() {
  const queryClient = useQueryClient();
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const [form, setForm] = useState({
    amount: "",
    date: new Date().toISOString().split("T")[0],
    category: "Food & Dining",
    description: "",
    payment_method: "upi",
    account: "" as string | number,
  });

  const { data: expenses = [], isLoading: expensesLoading } = useQuery({
    queryKey: ["expenses", selectedCategory],
    queryFn: () => api.expenses.list(selectedCategory ? { category: selectedCategory } : {}),
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: () => api.bankAccounts.list(),
  });

  const { data: summaryData } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => api.dashboard.getSummary(),
  });

  const createExpenseMutation = useMutation({
    mutationFn: (data: Partial<DailyExpense>) => api.expenses.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Expense logged successfully!");
      setIsAddExpenseOpen(false);
      setForm({
        amount: "",
        date: new Date().toISOString().split("T")[0],
        category: "Food & Dining",
        description: "",
        payment_method: "upi",
        account: "",
      });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to log expense"),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (id: number) => api.expenses.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Expense deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete expense"),
  });

  const totalSpent = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const monthlyBudget = summaryData?.summary?.monthly_budget || 50000;
  const budgetPct = Math.min(100, Math.round((totalSpent / monthlyBudget) * 100));

  const handleExportCsv = () => {
    window.open(api.expenses.getCsvExportUrl(), "_blank");
  };

  return (
    <div className="space-y-6">
      {/* Budget & Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                Monthly Spending & Budget
              </span>
              <span className="text-xs font-bold text-foreground">
                ₹{totalSpent.toLocaleString("en-IN")} / ₹{monthlyBudget.toLocaleString("en-IN")} ({budgetPct}%)
              </span>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ₹{totalSpent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Progress bar */}
            <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  budgetPct > 90 ? "bg-rose-500" : budgetPct > 70 ? "bg-amber-500" : "bg-emerald-500"
                }`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>{budgetPct < 80 ? "Well within monthly budget ✓" : "Approaching monthly limit ⚠️"}</span>
              <span>Remaining: ₹{Math.max(0, monthlyBudget - totalSpent).toLocaleString("en-IN")}</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Card */}
        <Card className="flex flex-col justify-between p-5">
          <div>
            <h4 className="font-bold text-sm text-foreground">Manage Daily Costs</h4>
            <p className="text-xs text-muted-foreground mt-1">
              Log expenditures to keep bank accounts and monthly balance in sync.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              onClick={() => setIsAddExpenseOpen(true)}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-1.5" /> Log Cost
            </Button>
            <Button onClick={handleExportCsv} variant="outline" size="icon" title="Export CSV">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <Button
          size="sm"
          variant={selectedCategory === "" ? "default" : "outline"}
          onClick={() => setSelectedCategory("")}
          className="text-xs rounded-full h-8 px-3"
        >
          All Costs
        </Button>
        {PRESET_CATEGORIES.map((cat) => (
          <Button
            key={cat.name}
            size="sm"
            variant={selectedCategory === cat.name ? "default" : "outline"}
            onClick={() => setSelectedCategory(cat.name)}
            className="text-xs rounded-full h-8 px-3 whitespace-nowrap"
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Recorded Expenses</CardTitle>
              <CardDescription className="text-xs">
                Detailed transaction log with payment source and notes
              </CardDescription>
            </div>
            <Receipt className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {expensesLoading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Loading expenses...</div>
          ) : expenses.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <Receipt className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
              <p className="text-xs text-muted-foreground">No expenses recorded for this filter.</p>
              <Button size="sm" onClick={() => setIsAddExpenseOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Expense
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {expenses.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3.5 sm:px-6 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
                    <div className="p-2 rounded-xl bg-muted text-foreground shrink-0">
                      <Receipt className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-foreground truncate">
                        {item.description || item.category}
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                        <span className="shrink-0">{item.date}</span>
                        <span>•</span>
                        <Badge variant="outline" className="text-[9px] py-0 px-1.5 uppercase shrink-0">
                          {item.payment_method}
                        </Badge>
                        {item.account_name && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 dark:text-blue-400 font-medium truncate">
                              {item.account_name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <span className="text-xs sm:text-sm font-bold text-foreground">
                      -₹{Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                      onClick={() => deleteExpenseMutation.mutate(item.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Add Expense */}
      <Modal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        title="Record Daily Cost"
        description="Add a new expenditure and automatically deduct from your linked account."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createExpenseMutation.mutate({
              amount: form.amount,
              date: form.date,
              category: form.category,
              description: form.description,
              payment_method: form.payment_method,
              account: form.account ? Number(form.account) : null,
            });
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Amount (₹) *</Label>
              <Input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Date *</Label>
              <Input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                {PRESET_CATEGORIES.map((cat) => (
                  <option key={cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs">Payment Method</Label>
              <select
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                <option value="upi">UPI / GPay / PhonePe</option>
                <option value="cash">Cash in Hand</option>
                <option value="debit_card">Debit Card</option>
                <option value="credit_card">Credit Card</option>
                <option value="net_banking">Net Banking</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Linked Bank Account (Auto Deduct)</Label>
            <select
              value={form.account}
              onChange={(e) => setForm({ ...form, account: e.target.value })}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
            >
              <option value="">None (Don't deduct from bank account)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.account_name} (₹{Number(acc.current_balance).toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label className="text-xs">Description / Items</Label>
            <Input
              placeholder="e.g. Lunch with team, Groceries from DMart"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="ghost" onClick={() => setIsAddExpenseOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createExpenseMutation.isPending}>
              {createExpenseMutation.isPending ? "Logging..." : "Save Expense"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
