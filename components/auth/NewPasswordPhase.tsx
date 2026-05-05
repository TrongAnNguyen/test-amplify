"use client";

import { useState } from "react";
import { Lock, ArrowRight, Loader2, ShieldCheck } from "lucide-react";

interface NewPasswordPhaseProps {
  onSubmit: (password: string) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export function NewPasswordPhase({ onSubmit, isLoading, error }: NewPasswordPhaseProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [validationError, setValidationError] = useState<string>();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(undefined);

    if (password.length < 8) {
      setValidationError("Password must be at least 8 characters long");
      return;
    }

    if (!/[A-Z]/.test(password)) {
      setValidationError("Password must contain at least one uppercase letter");
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setValidationError("Password must contain at least one special character");
      return;
    }

    if (!/[0-9]/.test(password)) {
      setValidationError("Password must contain at least one number");
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match");
      return;
    }

    onSubmit(password);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Create New Password
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You need to set a new password for your account
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="relative">
            <Lock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              placeholder="New Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background/50 py-3 pr-4 pl-12 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="relative">
            <ShieldCheck className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-border bg-background/50 py-3 pr-4 pl-12 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden"
            />
          </div>
        </div>

        {(error || validationError) && (
          <p className="text-xs font-medium text-destructive">
            {error || validationError}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !password || !confirmPassword}
        className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            Set Password & Sign In
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
