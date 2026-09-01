import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { User, ShieldCheck, Database, Key } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export default function Dashboard() {
  const navigate = useNavigate();

  const storedUserRaw = typeof window !== "undefined" ? localStorage.getItem("minivers_user") : null;
  const currentUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;

  // Ping the Django health-check endpoint to show live API status
  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ["django-health"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/`);
      return res.json() as Promise<{ status: string; message: string }>;
    },
    retry: false,
  });

  useEffect(() => {
    if (!currentUser) {
      navigate("/login");
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#007ACC] border-t-transparent" />
      </div>
    );
  }

  const userName = currentUser?.name || "Iyyanar";
  const userEmail = currentUser?.email || "iyyanar@vtindex.com";

  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 sm:py-8 space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-[#CBF1F5] dark:border-[#1e364d] bg-gradient-to-r from-[#E3FDFD] via-white to-[#CBF1F5]/40 dark:from-[#111d2e] dark:via-[#0b131e] dark:to-[#162a3d] p-5 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Personal Details Vault
            </h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, <span className="font-semibold text-[#007ACC] dark:text-[#A6E3E9]">{userName}</span>! Your details are safe and encrypted.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 self-start sm:self-center rounded-full bg-white dark:bg-[#111d2e] border border-[#71C9CE] px-3.5 py-1 text-xs font-semibold text-[#007ACC] dark:text-[#A6E3E9] shadow-xs">
            <ShieldCheck className="h-4 w-4 text-[#71C9CE]" />
            <span>Vault Active</span>
          </div>
        </div>
      </div>

      {/* Grid of details/cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <Card className="border-[#CBF1F5] dark:border-[#1e364d]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#E3FDFD] dark:bg-[#162a3d] text-[#007ACC] dark:text-[#A6E3E9]">
                <User className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>Account credentials</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs sm:text-sm">
            <div>
              <span className="text-muted-foreground block text-xs">Name</span>
              <span className="font-medium text-foreground">{userName}</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Email</span>
              <span className="font-medium text-foreground">{userEmail}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#CBF1F5] dark:border-[#1e364d]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#E3FDFD] dark:bg-[#162a3d] text-[#007ACC] dark:text-[#A6E3E9]">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Saved Data</CardTitle>
                <CardDescription>Status & records</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs sm:text-sm">
            <div>
              <span className="text-muted-foreground block text-xs">Vault Storage</span>
              <span className="font-medium text-foreground">Active & Ready</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">API Status</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {healthLoading
                  ? "Connecting..."
                  : healthData?.status === "ok"
                  ? "Connected ✓"
                  : "Unavailable"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#CBF1F5] dark:border-[#1e364d]">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#E3FDFD] dark:bg-[#162a3d] text-[#007ACC] dark:text-[#A6E3E9]">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Security</CardTitle>
                <CardDescription>Protection level</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-xs sm:text-sm">
            <div>
              <span className="text-muted-foreground block text-xs">Session</span>
              <span className="font-medium text-foreground">Secure Token Active</span>
            </div>
            <div>
              <span className="text-muted-foreground block text-xs">Access</span>
              <span className="font-medium text-foreground">Personal Authorized</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
