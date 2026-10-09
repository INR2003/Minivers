import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Search,
  ExternalLink,
  Shield,
  Trash2,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api";
import type { PasswordVaultItem } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";

const CATEGORIES = [
  "Email",
  "Social",
  "Banking",
  "Work",
  "Entertainment",
  "Utilities",
  "Other",
] as const;

export default function VaultModule() {
  const queryClient = useQueryClient();
  const [selectedCat, setSelectedCat] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Record<number, boolean>>({});

  const [form, setForm] = useState({
    title: "",
    login_url: "",
    username: "",
    password: "",
    category: "Work",
    notes: "",
  });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["vault", selectedCat],
    queryFn: () => api.vault.list(selectedCat ? { category: selectedCat } : {}),
  });

  const createItemMutation = useMutation({
    mutationFn: (data: Partial<PasswordVaultItem>) => api.vault.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault"] });
      toast.success("Credential encrypted and stored safely!");
      setIsModalOpen(false);
      setForm({
        title: "",
        login_url: "",
        username: "",
        password: "",
        category: "Work",
        notes: "",
      });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save credential"),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: number) => api.vault.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vault"] });
      toast.success("Credential removed");
    },
  });

  const toggleReveal = (id: number) => {
    setRevealedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const filtered = items.filter((item) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.username.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Encryption Security Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-cyan-500/5 to-teal-500/10 border border-emerald-200 dark:border-emerald-900/40">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Authenticated Encryption Vault</h3>
            <p className="text-xs text-muted-foreground">
              Credentials are encrypted using Fernet AES-128-CBC + HMAC-SHA256 and never stored as plain text.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#007ACC] hover:bg-[#0060a0] text-white shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" /> Add Credential
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logins, apps, usernames..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <Button
            size="sm"
            variant={selectedCat === "" ? "default" : "outline"}
            onClick={() => setSelectedCat("")}
            className="text-xs h-8 rounded-full px-3"
          >
            All Vault
          </Button>
          {CATEGORIES.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={selectedCat === c ? "default" : "outline"}
              onClick={() => setSelectedCat(c)}
              className="text-xs h-8 rounded-full px-3 whitespace-nowrap"
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      {/* Vault Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-8 text-center text-xs text-muted-foreground">
            Decrypting vault entries...
          </div>
        ) : filtered.length === 0 ? (
          <Card className="col-span-full border-dashed border-2 p-8 text-center">
            <KeyRound className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-40" />
            <h3 className="font-semibold text-foreground">No Logins Saved</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Safely store passwords, service accounts, and API credentials.
            </p>
            <Button onClick={() => setIsModalOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Add First Login
            </Button>
          </Card>
        ) : (
          filtered.map((item) => {
            const isRevealed = revealedIds[item.id] || false;
            return (
              <Card key={item.id} className="relative overflow-hidden hover:shadow-md transition-all">
                <CardContent className="p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-muted text-[#007ACC]">
                        <KeyRound className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                        <Badge variant="outline" className="text-[9px] uppercase py-0 mt-0.5">
                          {item.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {item.login_url && (
                        <a
                          href={item.login_url.startsWith("http") ? item.login_url : `https://${item.login_url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-muted-foreground hover:text-[#007ACC] rounded-md transition-colors"
                          title="Open login link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                      <button
                        onClick={() => deleteItemMutation.mutate(item.id)}
                        className="p-1 text-muted-foreground hover:text-rose-500 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Username field */}
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs">
                    <div className="min-w-0 flex-1 truncate mr-2">
                      <span className="text-[10px] text-muted-foreground block">Username / Email</span>
                      <span className="font-semibold truncate block">{item.username}</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                      onClick={() => copyToClipboard(item.username, "Username")}
                      title="Copy username"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Password field */}
                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border flex items-center justify-between text-xs">
                    <div className="min-w-0 flex-1 truncate mr-2">
                      <span className="text-[10px] text-muted-foreground block">Password</span>
                      <span className="font-mono font-semibold text-xs truncate block">
                        {isRevealed ? item.decrypted_password || "••••••••" : "••••••••••••"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => toggleReveal(item.id)}
                        title={isRevealed ? "Hide" : "Reveal"}
                      >
                        {isRevealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={() => copyToClipboard(item.decrypted_password || "", "Password")}
                        title="Copy password"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-[11px] text-muted-foreground italic truncate">
                      Note: {item.notes}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal: Add Credential */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Login Credential"
        description="Encrypted symmetrically on write."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createItemMutation.mutate(form);
          }}
          className="space-y-4 text-xs"
        >
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Service / App Name *</Label>
              <Input
                required
                placeholder="e.g. GitHub, AWS, Netflix, SBI"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Website URL (Optional)</Label>
            <Input
              placeholder="https://github.com/login"
              value={form.login_url}
              onChange={(e) => setForm({ ...form, login_url: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Username / Email *</Label>
              <Input
                required
                placeholder="name@example.com"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Password *</Label>
              <Input
                type="password"
                required
                placeholder="Secure password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Notes / Recovery Details</Label>
            <Input
              placeholder="e.g. 2FA enabled on mobile"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createItemMutation.isPending}>
              {createItemMutation.isPending ? "Encrypting..." : "Save Credential"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
