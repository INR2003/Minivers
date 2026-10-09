import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Wallet,
  Receipt,
  CheckCircle2,
  Handshake,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  FileText,
  KeyRound,
  Users,
  BookOpen,
  Briefcase,
  Dumbbell,
  ShieldCheck,
  Plus,
  ArrowRight,
  Clock,
  Sparkles,
} from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface DashboardOverviewProps {
  onSelectModule: (moduleId: string) => void;
}

export default function DashboardOverview({ onSelectModule }: DashboardOverviewProps) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => api.dashboard.getSummary(),
  });

  const quickToggleMutation = useMutation({
    mutationFn: (type: "office" | "gym") => api.attendance.quickToggle(type),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      toast.success(`Marked today's ${res.record_type} as ${res.status.replace("_", " ")}!`);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update attendance"),
  });

  const summary = data?.summary;
  const accounts = data?.bank_accounts || [];
  const transactions = data?.recent_transactions || [];
  const upcomingPayments = data?.upcoming_payments || [];
  const notes = data?.recent_notes || [];
  const documents = data?.recent_documents || [];

  return (
    <div className="space-y-6">
      {/* 4 Primary Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Total Balance */}
        <Card
          onClick={() => onSelectModule("accounts")}
          className="cursor-pointer border-blue-200 dark:border-blue-900/50 hover:shadow-md transition-all bg-gradient-to-br from-blue-500/10 via-card to-transparent"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Total Balance
              </span>
              <div className="p-2 rounded-xl bg-blue-500 text-white shadow-xs">
                <Wallet className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-foreground mt-2 tracking-tight">
              ₹{(summary?.total_balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
              <span>Across {accounts.length} linked accounts</span>
              <span className="text-[#007ACC] font-semibold hover:underline">View →</span>
            </p>
          </CardContent>
        </Card>

        {/* 2. This Month's Expenses */}
        <Card
          onClick={() => onSelectModule("expenses")}
          className="cursor-pointer border-emerald-200 dark:border-emerald-900/50 hover:shadow-md transition-all bg-gradient-to-br from-emerald-500/10 via-card to-transparent"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Month's Expenses
              </span>
              <div className="p-2 rounded-xl bg-emerald-500 text-white shadow-xs">
                <Receipt className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-foreground mt-2 tracking-tight">
              ₹{(summary?.monthly_expenses || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
              <span>Budget: ₹{(summary?.monthly_budget || 50000).toLocaleString("en-IN")}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
                View →
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 3. Attendance Status */}
        <Card
          onClick={() => onSelectModule("attendance")}
          className="cursor-pointer border-sky-200 dark:border-sky-900/50 hover:shadow-md transition-all bg-gradient-to-br from-sky-500/10 via-card to-transparent"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                Attendance
              </span>
              <div className="p-2 rounded-xl bg-sky-500 text-white shadow-xs">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                {summary?.office_attendance_pct ?? 0}%
              </span>
              <span className="text-xs text-muted-foreground">Office</span>
              <span className="text-foreground/30">•</span>
              <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {summary?.gym_attendance_pct ?? 0}%
              </span>
              <span className="text-xs text-muted-foreground">Gym</span>
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
              <span>
                Today: {summary?.today_office_status === "present" ? "Present ✓" : "Pending"}
              </span>
              <span className="text-sky-600 dark:text-sky-400 font-semibold hover:underline">
                Log →
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 4. Outstanding Debt */}
        <Card
          onClick={() => onSelectModule("debt")}
          className="cursor-pointer border-purple-200 dark:border-purple-900/50 hover:shadow-md transition-all bg-gradient-to-br from-purple-500/10 via-card to-transparent"
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                Outstanding Debt
              </span>
              <div className="p-2 rounded-xl bg-purple-500 text-white shadow-xs">
                <Handshake className="h-4 w-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-foreground mt-2 tracking-tight">
              ₹{(summary?.total_borrowed_outstanding || 0).toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
              <span>Lent: ₹{(summary?.total_lent_outstanding || 0).toLocaleString("en-IN")}</span>
              <span className="text-purple-600 dark:text-purple-400 font-semibold hover:underline">
                Manage →
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="rounded-2xl border bg-card p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-[#007ACC]" /> Quick Action Hub
          </span>
          <span className="text-xs text-muted-foreground">One-click operations</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSelectModule("expenses")}
            className="flex-col h-16 justify-center gap-1 text-[11px] hover:border-emerald-500 hover:text-emerald-600"
          >
            <Receipt className="h-4 w-4 text-emerald-500" />
            <span>Add Expense</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => quickToggleMutation.mutate("office")}
            className="flex-col h-16 justify-center gap-1 text-[11px] hover:border-sky-500 hover:text-sky-600"
          >
            <Briefcase className="h-4 w-4 text-sky-500" />
            <span>Check In</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => quickToggleMutation.mutate("gym")}
            className="flex-col h-16 justify-center gap-1 text-[11px] hover:border-orange-500 hover:text-orange-600"
          >
            <Dumbbell className="h-4 w-4 text-orange-500" />
            <span>Gym Done</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onSelectModule("payments")}
            className="flex-col h-16 justify-center gap-1 text-[11px] hover:border-indigo-500 hover:text-indigo-600"
          >
            <Wallet className="h-4 w-4 text-indigo-500" />
            <span>Add Payment</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onSelectModule("documents")}
            className="flex-col h-16 justify-center gap-1 text-[11px] hover:border-blue-500 hover:text-blue-600"
          >
            <FileText className="h-4 w-4 text-blue-500" />
            <span>Upload File</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onSelectModule("notes")}
            className="flex-col h-16 justify-center gap-1 text-[11px] hover:border-amber-500 hover:text-amber-600"
          >
            <BookOpen className="h-4 w-4 text-amber-500" />
            <span>Write Note</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onSelectModule("vault")}
            className="flex-col h-16 justify-center gap-1 text-[11px] hover:border-emerald-500 hover:text-emerald-600"
          >
            <KeyRound className="h-4 w-4 text-emerald-500" />
            <span>Password</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => onSelectModule("debt")}
            className="flex-col h-16 justify-center gap-1 text-[11px] hover:border-purple-500 hover:text-purple-600"
          >
            <Handshake className="h-4 w-4 text-purple-500" />
            <span>Borrow/Lend</span>
          </Button>
        </div>
      </div>

      {/* Main Dashboard Two-Column Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Recent Transactions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Recent Financial Activity</CardTitle>
                <CardDescription className="text-xs">
                  Latest inflows, expenses, and bank debits
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectModule("accounts")}
                className="text-xs text-[#007ACC]"
              >
                All Transactions <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {transactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No recent transactions recorded.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3.5 sm:px-6 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
                      <div
                        className={`p-2 rounded-xl text-white shrink-0 ${
                          tx.transaction_type === "income" ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      >
                        {tx.transaction_type === "income" ? (
                          <ArrowDownLeft className="h-4 w-4" />
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
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-sm font-bold ${
                          tx.transaction_type === "income"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {tx.transaction_type === "income" ? "+" : "-"}₹
                        {Number(tx.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <Badge variant="outline" className="text-[9px] py-0">
                        {tx.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Upcoming Payments & Bills */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Upcoming Payments & Bills</CardTitle>
                <CardDescription className="text-xs">
                  Pending clearances and schedule dates
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectModule("payments")}
                className="text-xs text-[#007ACC]"
              >
                All Payments <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingPayments.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No pending payments or upcoming bills.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {upcomingPayments.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3.5 sm:px-6 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-foreground truncate">{p.party_name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {p.purpose} • Due: {p.due_date || p.payment_date}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-foreground">
                        ₹{Number(p.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </div>
                      <Badge variant="warning" className="text-[9px] py-0">
                        PENDING
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Left: Recent Documents */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Saved Documents</CardTitle>
                <CardDescription className="text-xs">
                  Quick access to confidential files
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectModule("documents")}
                className="text-xs text-[#007ACC]"
              >
                Storage <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {documents.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No documents uploaded yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3.5 sm:px-6 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
                      <div className="p-2 rounded-xl bg-muted text-[#007ACC] shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {doc.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {doc.folder} • {doc.file_type.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {doc.created_at.slice(0, 10)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Right: Thoughts & Notes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Thoughts & Journal</CardTitle>
                <CardDescription className="text-xs">
                  Pinned ideas and recent diary entries
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSelectModule("notes")}
                className="text-xs text-[#007ACC]"
              >
                Journal <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {notes.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground">
                No thoughts recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center justify-between p-3.5 sm:px-6 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
                      <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-foreground truncate">
                          {note.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {note.content}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {note.category}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
