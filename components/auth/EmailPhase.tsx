"use client";

import { useState } from "react";
import { Mail, ArrowRight, Loader2 } from "lucide-react";

interface EmailPhaseProps {
  onSendCode: (email: string) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export function EmailPhase({ onSendCode, isLoading, error }: EmailPhaseProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) onSendCode(email);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome Back
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email to receive a secure login code
        </p>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-border bg-background/50 py-3 pr-4 pl-12 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden"
          />
        </div>
        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={isLoading || !email}
        className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            Send Login Code
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
