import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CreditCard,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle,
  Calendar,
  AlertCircle,
  Search,
} from "lucide-react";
import { api } from "@/lib/api";
import type { PaymentRecord } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

export default function PaymentsModule() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    payment_type: "made" as PaymentRecord["payment_type"],
    amount: "",
    party_name: "",
    purpose: "",
    payment_method: "UPI",
    status: "completed" as PaymentRecord["status"],
    is_recurring: false,
    due_date: "",
    payment_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ["payments", filterType],
    queryFn: () => api.payments.list(filterType ? { payment_type: filterType } : {}),
  });

  const createPaymentMutation = useMutation({
    mutationFn: (data: Partial<PaymentRecord>) => api.payments.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Payment record saved!");
      setIsModalOpen(false);
      setForm({
        payment_type: "made",
        amount: "",
        party_name: "",
        purpose: "",
        payment_method: "UPI",
        status: "completed",
        is_recurring: false,
        due_date: "",
        payment_date: new Date().toISOString().split("T")[0],
        notes: "",
      });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save payment"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: PaymentRecord["status"] }) =>
      api.payments.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      toast.success("Payment status updated!");
    },
  });

  const filtered = payments.filter((p) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      p.party_name.toLowerCase().includes(query) ||
      p.purpose.toLowerCase().includes(query) ||
      p.payment_method.toLowerCase().includes(query)
    );
  });

  const totalReceived = payments
    .filter((p) => p.payment_type === "received" && p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const totalMade = payments
    .filter((p) => p.payment_type === "made" && p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const pendingCount = payments.filter((p) => p.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 border-emerald-200 dark:border-emerald-900/40 bg-gradient-to-br from-emerald-500/10 via-background to-transparent">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            <ArrowDownLeft className="h-4 w-4" /> Total Received
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-2">
            ₹{totalReceived.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-muted-foreground">Inflows & client receipts</span>
        </Card>

        <Card className="p-4 border-rose-200 dark:border-rose-900/40 bg-gradient-to-br from-rose-500/10 via-background to-transparent">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-400">
            <ArrowUpRight className="h-4 w-4" /> Total Paid Out
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-2">
            ₹{totalMade.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-muted-foreground">Bills, vendors & outlays</span>
        </Card>

        <Card className="p-4 border-amber-200 dark:border-amber-900/40 bg-gradient-to-br from-amber-500/10 via-background to-transparent">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Clock className="h-4 w-4" /> Pending / Upcoming Bills
          </div>
          <div className="text-2xl font-extrabold text-foreground mt-2">
            {pendingCount} Pending
          </div>
          <span className="text-[11px] text-muted-foreground">Due for clearance</span>
        </Card>
      </div>

      {/* Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search recipient, purpose..."
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
              onClick={() => setFilterType("received")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                filterType === "received" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Received
            </button>
            <button
              onClick={() => setFilterType("made")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                filterType === "made" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground"
              }`}
            >
              Paid
            </button>
          </div>

          <Button onClick={() => setIsModalOpen(true)} size="sm" className="bg-[#007ACC] hover:bg-[#0060a0] text-white">
            <Plus className="h-4 w-4 mr-1.5" /> Record Payment
          </Button>
        </div>
      </div>

      {/* Payment List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Payments Ledger</CardTitle>
          <CardDescription className="text-xs">
            Searchable history of pending and settled money transfers
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-muted-foreground">Loading payments...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center space-y-2">
              <CreditCard className="h-8 w-8 text-muted-foreground mx-auto opacity-40" />
              <p className="text-xs text-muted-foreground">No payments found.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((item) => {
                const isRecv = item.payment_type === "received";
                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 sm:px-6 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
                      <div
                        className={`p-2 rounded-xl text-white shrink-0 ${
                          isRecv ? "bg-emerald-500" : "bg-indigo-500"
                        }`}
                      >
                        {isRecv ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-foreground truncate">
                          {item.party_name}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                          <span className="truncate">{item.purpose}</span>
                          <span>•</span>
                          <span className="shrink-0">{item.payment_method}</span>
                          <span>•</span>
                          <span className="shrink-0">{item.payment_date}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <div className="text-right">
                        <div
                          className={`text-sm font-bold ${
                            isRecv
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-foreground"
                          }`}
                        >
                          {isRecv ? "+" : "-"}₹
                          {Number(item.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                        </div>
                        <Badge
                          variant={
                            item.status === "completed"
                              ? "success"
                              : item.status === "pending"
                              ? "warning"
                              : "destructive"
                          }
                          className="text-[9px] py-0"
                        >
                          {item.status.toUpperCase()}
                        </Badge>
                      </div>

                      {item.status === "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs border-emerald-500 text-emerald-600 hover:bg-emerald-500/10"
                          onClick={() => updateStatusMutation.mutate({ id: item.id, status: "completed" })}
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Mark Settled
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal: Record Payment */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Payment"
        description="Add money received or payment made."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createPaymentMutation.mutate({
              payment_type: form.payment_type,
              amount: form.amount,
              party_name: form.party_name,
              purpose: form.purpose,
              payment_method: form.payment_method,
              status: form.status,
              is_recurring: form.is_recurring,
              due_date: form.due_date || null,
              payment_date: form.payment_date,
              notes: form.notes,
            });
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <select
                value={form.payment_type}
                onChange={(e) =>
                  setForm({ ...form, payment_type: e.target.value as PaymentRecord["payment_type"] })
                }
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                <option value="made">Payment Made (Outflow)</option>
                <option value="received">Payment Received (Inflow)</option>
              </select>
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Person / Organization *</Label>
              <Input
                required
                placeholder="e.g. Landlord, Electricity Board, Client A"
                value={form.party_name}
                onChange={(e) => setForm({ ...form, party_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Purpose *</Label>
              <Input
                required
                placeholder="e.g. Monthly Rent, Freelance Invoice"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Payment Method</Label>
              <Input
                placeholder="UPI, Net Banking, Cash"
                value={form.payment_method}
                onChange={(e) => setForm({ ...form, payment_method: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as PaymentRecord["status"] })
                }
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                <option value="completed">Completed / Paid</option>
                <option value="pending">Pending / Scheduled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Payment Date</Label>
              <Input
                type="date"
                value={form.payment_date}
                onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Due Date (Optional)</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPaymentMutation.isPending}>
              {createPaymentMutation.isPending ? "Saving..." : "Save Payment"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
