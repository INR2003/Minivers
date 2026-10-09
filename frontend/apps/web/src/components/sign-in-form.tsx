import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import z from "zod";
import {
  Shield,
  ArrowRight,
  Loader2,
  Sparkles,
  KeyRound,
  FileCheck2,
  Hash,
  Eye,
  EyeOff,
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

export default function SignInForm({
  onSwitchToSignUp,
}: {
  onSwitchToSignUp: () => void;
}) {
  const navigate = useNavigate();
  const [showCode, setShowCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    defaultValues: {
      access_code: "",
    },
    onSubmit: async ({ value }) => {
      setIsLoading(true);
      try {
        const data = await api.auth.login(value.access_code.trim().toUpperCase());
        localStorage.setItem("minivers_user", JSON.stringify(data.user));
        toast.success(`Welcome back, ${data.user.name}! Signed in successfully`);
        navigate("/dashboard");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Sign in failed");
      } finally {
        setIsLoading(false);
      }
    },
    validators: {
      onSubmit: z.object({
        access_code: z
          .string()
          .min(1, "Access code is required")
          .regex(/^MINI-[A-Z0-9]{5}$/i, "Enter a valid access code (e.g. MINI-8072A)"),
      }),
    },
  });

  if (isLoading) {
    return <Loader />;
  }

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
        </div>

        {/* Form Card */}
        <Card className="border border-[#CBF1F5] dark:border-[#1e364d] bg-white dark:bg-[#111d2e] shadow-xl shadow-[#007ACC]/5 rounded-2xl overflow-hidden backdrop-blur-xs">
          <CardHeader className="space-y-1 pb-3 text-center">
            <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
              Enter Your Access Code
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-muted-foreground">
              Use the special code you received when you signed up
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
              {/* Access Code Field */}
              <div>
                <form.Field name="access_code">
                  {(field) => (
                    <div className="space-y-1.5">
                      <Label
                        htmlFor={field.name}
                        className="text-xs sm:text-sm font-medium text-foreground"
                      >
                        Access Code
                      </Label>
                      <div className="relative">
                        <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#71C9CE] dark:text-[#A6E3E9]" />
                        <Input
                          id={field.name}
                          name={field.name}
                          type={showCode ? "text" : "password"}
                          placeholder="MINI-8072A"
                          className="pl-10 pr-11 text-base sm:text-sm font-mono tracking-widest border-[#CBF1F5] dark:border-[#234563] focus-visible:border-[#007ACC] focus-visible:ring-[#A6E3E9] dark:focus-visible:ring-[#007ACC]/30 uppercase"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) =>
                            field.handleChange(e.target.value.toUpperCase())
                          }
                        />
                        <button
                          type="button"
                          onClick={() => setShowCode(!showCode)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-[#007ACC] dark:hover:text-[#A6E3E9] cursor-pointer focus:outline-none transition-colors"
                          tabIndex={-1}
                          aria-label={showCode ? "Hide code" : "Show code"}
                        >
                          {showCode ? (
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
                        Signing in...
                      </>
                    ) : (
                      <>
                        Open My Vault
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </form>
          </CardContent>

          {/* Switch to Sign Up */}
          <CardFooter className="flex flex-col items-center justify-center gap-2 pt-3 pb-5 text-center border-t border-[#E3FDFD] dark:border-[#1e364d] bg-[#E3FDFD]/40 dark:bg-[#162a3d]/30">
            <span className="text-xs text-muted-foreground">
              Don't have an account yet?
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onSwitchToSignUp}
              className="w-full border-[#A6E3E9] text-[#007ACC] hover:bg-[#CBF1F5]/50 dark:border-[#2c5270] dark:text-[#A6E3E9] dark:hover:bg-[#1e3a54] font-medium cursor-pointer"
            >
              Create an account
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
