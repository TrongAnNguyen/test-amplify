"use client";

import { useState } from "react";
import { Mail, ArrowRight, Loader2, Lock, Key } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type LoginMethod = "otp" | "password";

interface EmailPhaseProps {
  onLogin: (
    email: string,
    method: LoginMethod,
    password?: string,
  ) => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export function EmailPhase({ onLogin, isLoading, error }: EmailPhaseProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState<LoginMethod>("otp");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      onLogin(email, method, method === "password" ? password : undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Welcome Back
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {method === "otp"
            ? "Enter your email to receive a secure login code"
            : "Enter your email and password to sign in"}
        </p>
      </div>

      {/* Toggle */}
      <div className="flex justify-center">
        <div className="relative flex w-full max-w-[280px] items-center rounded-full bg-muted/50 p-1 backdrop-blur-sm">
          <motion.div
            className="absolute h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full bg-background shadow-sm"
            animate={{ x: method === "otp" ? 0 : "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
          <button
            type="button"
            onClick={() => setMethod("otp")}
            className={`cursor-pointer relative z-10 flex w-1/2 items-center justify-center py-2 text-sm font-medium transition-colors ${
              method === "otp" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <Key className="mr-2 h-4 w-4" />
            OTP Code
          </button>
          <button
            type="button"
            onClick={() => setMethod("password")}
            className={`cursor-pointer relative z-10 flex w-1/2 items-center justify-center py-2 text-sm font-medium transition-colors ${
              method === "password"
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
          >
            <Lock className="mr-2 h-4 w-4" />
            Password
          </button>
        </div>
      </div>

      <div className="space-y-4">
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
        </div>

        <AnimatePresence mode="popLayout">
          {method === "password" && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              <div className="relative">
                <Lock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required={method === "password"}
                  className="w-full rounded-xl border border-border bg-background/50 py-3 pr-4 pl-12 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <p className="text-xs font-medium text-destructive">{error}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading || !email || (method === "password" && !password)}
        className="group cursor-pointer relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <>
            {method === "otp" ? "Send Login Code" : "Sign In"}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>
    </form>
  );
}
