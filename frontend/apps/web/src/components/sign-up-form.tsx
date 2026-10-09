import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import z from "zod";
import {
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  Loader2,
  Sparkles,
  KeyRound,
  FileCheck2,
  Copy,
  CheckCircle2,
} from "lucide-react";

import Loader from "./loader";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { api } from "@/lib/api";

export default function SignUpForm({
  onSwitchToSignIn,
}: {
  onSwitchToSignIn: () => void;
}) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      try {
        const data = await api.auth.register(value.name, value.email, value.password);
        // Store user but show the access code before navigating
        localStorage.setItem("minivers_user", JSON.stringify(data.user));
        setAccessCode(data.access_code);
        toast.success("Account created! Save your access code below 🔑");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Sign up failed");
      } finally {
        setIsLoading(false);
      }
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Please enter a valid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      }),
    },
  });

  const handleCopy = () => {
    if (accessCode) {
      navigator.clipboard.writeText(accessCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return <Loader />;
  }

  // ── Access Code reveal screen ─────────────────────────────────────────────
  if (accessCode) {
    return (
      <div className="flex min-h-[calc(100svh-4rem)] w-full items-center justify-center bg-gradient-to-b from-[#E3FDFD]/40 via-background to-[#CBF1F5]/20 dark:from-[#0b131e] dark:via-background dark:to-[#162a3d] px-3.5 py-6 sm:px-6 sm:py-10">
        <div className="w-full max-w-[420px] space-y-4">
          <div className="text-center space-y-2.5">
            <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-[#71C9CE] bg-[#E3FDFD] dark:bg-[#162a3d] dark:border-[#2c5270] px-3 py-1 text-xs font-semibold text-[#007ACC] dark:text-[#A6E3E9] shadow-xs">
              <Shield className="h-3.5 w-3.5 text-[#007ACC] dark:text-[#71C9CE]" />
              <span>Account Created</span>
            </div>
            <div className="flex items-center justify-center gap-2.5">
              <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[#007ACC] text-white shadow-md shadow-[#007ACC]/25">
                <KeyRound className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                Minivers
              </h1>
            </div>
          </div>

          <Card className="border border-[#CBF1F5] dark:border-[#1e364d] bg-white dark:bg-[#111d2e] shadow-xl shadow-[#007ACC]/5 rounded-2xl overflow-hidden">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
                <CheckCircle2 className="h-7 w-7 text-emerald-500" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
                Your Access Code
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-muted-foreground">
                This is the <strong>only</strong> way to sign in. Save it somewhere safe — it won't be shown again.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-2 space-y-4">
              {/* Code display */}
              <div className="flex items-center gap-2 rounded-xl border-2 border-[#007ACC]/40 bg-[#E3FDFD]/60 dark:bg-[#162a3d] px-4 py-3">
                <span className="flex-1 text-center text-2xl font-mono font-extrabold tracking-[0.25em] text-[#007ACC] dark:text-[#A6E3E9] select-all">
                  {accessCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 rounded-lg p-1.5 text-[#007ACC] hover:bg-[#CBF1F5] dark:hover:bg-[#234563] transition-colors"
                  aria-label="Copy access code"
                >
                  {copied ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </button>
              </div>

              <p className="text-[11px] sm:text-xs text-center text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ Copy and store this code now. You cannot recover it later.
              </p>

              <Button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="w-full bg-[#007ACC] hover:bg-[#0066b8] text-white font-semibold shadow-md shadow-[#007ACC]/25 cursor-pointer h-11 text-base sm:text-sm"
              >
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ── Registration form ──────────────────────────────────────────────────────
  return (
    <div className="flex min-h-[calc(100svh-4rem)] w-full items-center justify-center bg-gradient-to-b from-[#E3FDFD]/40 via-background to-[#CBF1F5]/20 dark:from-[#0b131e] dark:via-background dark:to-[#162a3d] px-3.5 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-[420px] space-y-4">
        {/* Brand & Value Header */}
        <div className="text-center space-y-2.5">
          <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-[#71C9CE] bg-[#E3FDFD] dark:bg-[#162a3d] dark:border-[#2c5270] px-3 py-1 text-xs font-semibold text-[#007ACC] dark:text-[#A6E3E9] shadow-xs">
            <Shield className="h-3.5 w-3.5 text-[#007ACC] dark:text-[#71C9CE]" />
            <span>Personal Details &amp; Vault</span>
          </div>

          <div className="flex items-center justify-center gap-2.5">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-[#007ACC] text-white shadow-md shadow-[#007ACC]/25">
              <KeyRound className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Minivers
            </h1>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground px-2">
            Create an account — a unique access code will be generated for you.
          </p>
        </div>

        {/* Form Card */}
        <Card className="border border-[#CBF1F5] dark:border-[#1e364d] bg-white dark:bg-[#111d2e] shadow-xl shadow-[#007ACC]/5 rounded-2xl overflow-hidden backdrop-blur-xs">
          <CardHeader className="space-y-1 pb-3 text-center sm:text-left">
            <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              Enter your details to create your secure personal vault
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
              className="space-y-4"
            >
              {/* Name Field */}
              <div>
                <form.Field name="name">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name} className="text-xs sm:text-sm font-medium text-foreground">
                        Full Name
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71C9CE] dark:text-[#A6E3E9]" />
                        <Input
                          id={field.name}
                          name={field.name}
                          placeholder="Your Name"
                          className="pl-10 text-base sm:text-sm border-[#CBF1F5] dark:border-[#234563] focus-visible:border-[#007ACC] focus-visible:ring-[#A6E3E9] dark:focus-visible:ring-[#007ACC]/30"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                      {field.state.meta.errors.map((error) => (
                        <p
                          key={error?.message}
                          className="text-xs text-destructive mt-1 font-medium"
                        >
                          {error?.message}
                        </p>
                      ))}
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Email Field */}
              <div>
                <form.Field name="email">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name} className="text-xs sm:text-sm font-medium text-foreground">
                        Email Address
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71C9CE] dark:text-[#A6E3E9]" />
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          placeholder="name@example.com"
                          className="pl-10 text-base sm:text-sm border-[#CBF1F5] dark:border-[#234563] focus-visible:border-[#007ACC] focus-visible:ring-[#A6E3E9] dark:focus-visible:ring-[#007ACC]/30"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </div>
                      {field.state.meta.errors.map((error) => (
                        <p
                          key={error?.message}
                          className="text-xs text-destructive mt-1 font-medium"
                        >
                          {error?.message}
                        </p>
                      ))}
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Password Field */}
              <div>
                <form.Field name="password">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label htmlFor={field.name} className="text-xs sm:text-sm font-medium text-foreground">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71C9CE] dark:text-[#A6E3E9]" />
                        <Input
                          id={field.name}
                          name={field.name}
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-10 pr-11 text-base sm:text-sm border-[#CBF1F5] dark:border-[#234563] focus-visible:border-[#007ACC] focus-visible:ring-[#A6E3E9] dark:focus-visible:ring-[#007ACC]/30"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-[#007ACC] dark:hover:text-[#A6E3E9] cursor-pointer focus:outline-none transition-colors"
                          tabIndex={-1}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      {field.state.meta.errors.map((error) => (
                        <p
                          key={error?.message}
                          className="text-xs text-destructive mt-1 font-medium"
                        >
                          {error?.message}
                        </p>
                      ))}
                    </div>
                  )}
                </form.Field>
              </div>

              {/* Submit Button */}
              <form.Subscribe>
                {(state) => (
                  <Button
                    type="submit"
                    className="w-full mt-2 bg-[#007ACC] hover:bg-[#0066b8] text-white font-semibold shadow-md shadow-[#007ACC]/25 cursor-pointer h-11 text-base sm:text-sm"
                    disabled={!state.canSubmit || state.isSubmitting}
                  >
                    {state.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account &amp; Get Code
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </form>
          </CardContent>

          {/* Switch to Sign In */}
          <CardFooter className="flex flex-col items-center justify-center gap-2 pt-3 pb-5 text-center border-t border-[#E3FDFD] dark:border-[#1e364d] bg-[#E3FDFD]/40 dark:bg-[#162a3d]/30">
            <span className="text-xs text-muted-foreground">
              Already have an account?
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSwitchToSignIn}
              className="w-full border-[#A6E3E9] text-[#007ACC] hover:bg-[#CBF1F5]/50 dark:border-[#2c5270] dark:text-[#A6E3E9] dark:hover:bg-[#1e3a54] font-medium cursor-pointer"
            >
              Sign In with access code
            </Button>
          </CardFooter>
        </Card>

        {/* Feature bullets / trust badge */}
        <div className="flex items-center justify-center gap-4 text-[11px] sm:text-xs text-muted-foreground pt-1">
          <span className="inline-flex items-center gap-1">
            <FileCheck2 className="h-3.5 w-3.5 text-[#71C9CE]" /> Save details
          </span>
          <span className="inline-flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-[#007ACC]" /> Private access
          </span>
          <span className="inline-flex items-center gap-1">
            <Shield className="h-3.5 w-3.5 text-[#71C9CE]" /> Encrypted
          </span>
        </div>
      </div>
    </div>
  );
}
