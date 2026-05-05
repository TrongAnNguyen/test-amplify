# Passwordless Login Rebuild Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Rebuild the login page with a premium glassmorphic design and passwordless email OTP authentication (8 digits).

**Architecture:** A two-phase authentication flow using AWS Amplify's `signIn` and `confirmSignIn`. The UI features a glassmorphic card over an animated mesh background.

**Tech Stack:** Next.js (App Router), AWS Amplify, Tailwind CSS v4, Framer Motion, Lucide React.

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install framer-motion**

Run: `rtk npm install framer-motion`

**Step 2: Commit**

```bash
rtk git add package.json package-lock.json
rtk git commit -m "auth: install framer-motion"
```

---

### Task 2: Create AnimatedBackground component

**Files:**
- Create: `components/auth/AnimatedBackground.tsx`

**Step 1: Create the component with mesh gradient logic**

```tsx
"use client";

import { motion } from "framer-motion";

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-background">
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
          x: [-100, 100, -100],
          y: [-50, 50, -50],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -top-[20%] -left-[10%] h-[80%] w-[80%] rounded-full bg-primary/20 blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -120, 0],
          x: [100, -100, 100],
          y: [50, -50, 50],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute -bottom-[20%] -right-[10%] h-[70%] w-[70%] rounded-full bg-accent/20 blur-[100px]"
      />
    </div>
  );
}
```

**Step 2: Commit**

```bash
rtk git add components/auth/AnimatedBackground.tsx
rtk git commit -m "auth: add AnimatedBackground component"
```

---

### Task 3: Create AuthCard component

**Files:**
- Create: `components/auth/AuthCard.tsx`

**Step 1: Create the glassmorphic card container**

```tsx
"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-md overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl dark:bg-black/20"
    >
      <div className="flex flex-col space-y-6">{children}</div>
    </motion.div>
  );
}
```

**Step 2: Commit**

```bash
rtk git add components/auth/AuthCard.tsx
rtk git commit -m "auth: add AuthCard component"
```

---

### Task 4: Create EmailPhase component

**Files:**
- Create: `components/auth/EmailPhase.tsx`

**Step 1: Create the email input form**

```tsx
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
```

**Step 2: Commit**

```bash
rtk git add components/auth/EmailPhase.tsx
rtk git commit -m "auth: add EmailPhase component"
```

---

### Task 5: Create OTPPhase component

**Files:**
- Create: `components/auth/OTPPhase.tsx`

**Step 1: Create the segmented OTP input form**

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, ShieldCheck, RefreshCw } from "lucide-react";

interface OTPPhaseProps {
  email: string;
  onVerify: (code: string) => Promise<void>;
  onResend: () => Promise<void>;
  isLoading: boolean;
  error?: string;
}

export function OTPPhase({ email, onVerify, onResend, isLoading, error }: OTPPhaseProps) {
  const [otp, setOtp] = useState<string[]>(new Array(8).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.value !== "" && index < 7) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((v) => v !== "")) {
      onVerify(newOtp.join(""));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const data = e.clipboardData.getData("text").trim();
    if (data.length === 8 && !isNaN(Number(data))) {
      const newOtp = data.split("");
      setOtp(newOtp);
      onVerify(data);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Check your email
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ve sent an 8-digit code to <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>

      <div className="flex justify-between gap-2">
        {otp.map((data, index) => (
          <input
            key={index}
            type="text"
            maxLength={1}
            ref={(el) => { inputRefs.current[index] = el; }}
            value={data}
            onChange={(e) => handleChange(e.target, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={index === 0 ? handlePaste : undefined}
            className="h-12 w-full rounded-xl border border-border bg-background/50 text-center text-xl font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-hidden"
          />
        ))}
      </div>

      {error && <p className="text-center text-xs font-medium text-destructive">{error}</p>}

      <div className="flex flex-col space-y-4">
        <button
          onClick={() => onVerify(otp.join(""))}
          disabled={isLoading || otp.some((v) => v === "")}
          className="flex w-full items-center justify-center rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Code"}
        </button>

        <button
          onClick={onResend}
          disabled={isLoading}
          className="flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Resend code
        </button>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
rtk git add components/auth/OTPPhase.tsx
rtk git commit -m "auth: add OTPPhase component"
```

---

### Task 6: Rebuild LoginPage

**Files:**
- Modify: `app/login/page.tsx`

**Step 1: Replace existing content with custom auth logic**

```tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, confirmSignIn } from "aws-amplify/auth";
import { AnimatedBackground } from "@/components/auth/AnimatedBackground";
import { AuthCard } from "@/components/auth/AuthCard";
import { EmailPhase } from "@/components/auth/EmailPhase";
import { OTPPhase } from "@/components/auth/OTPPhase";
import { AnimatePresence, motion } from "framer-motion";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const handleSendCode = async (email: string) => {
    setIsLoading(true);
    setError(undefined);
    try {
      await signIn({
        username: email,
        options: {
          authFlowType: "USER_AUTH",
          preferredChallenge: "EMAIL_OTP",
        },
      });
      setEmail(email);
      setStep("OTP");
    } catch (err: any) {
      setError(err.message || "Failed to send code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (code: string) => {
    setIsLoading(true);
    setError(undefined);
    try {
      const { nextStep } = await confirmSignIn({
        challengeResponse: code,
      });

      if (nextStep.signInStep === "DONE") {
        router.push(redirect);
      } else {
        setError("Sign in not complete. Step: " + nextStep.signInStep);
      }
    } catch (err: any) {
      setError(err.message || "Invalid code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <AnimatedBackground />
      <AuthCard>
        <AnimatePresence mode="wait">
          {step === "EMAIL" ? (
            <motion.div
              key="email"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <EmailPhase 
                onSendCode={handleSendCode} 
                isLoading={isLoading} 
                error={error} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <OTPPhase 
                email={email}
                onVerify={handleVerifyCode}
                onResend={() => handleSendCode(email)}
                isLoading={isLoading}
                error={error}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </AuthCard>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
```

**Step 2: Commit**

```bash
rtk git add app/login/page.tsx
rtk git commit -m "auth: rebuild login page with passwordless OTP flow"
```

---

### Task 7: Verification

**Files:**
- None

**Step 1: Check build and lint**

Run: `rtk npm run lint`
Expected: SUCCESS

**Step 2: Smoke test**
- Open the dev server.
- Enter a test email.
- Verify the OTP code step appears.
- (Manual) Verify it works with a real email if possible.

**Step 3: Commit tracker**

```bash
rtk git add docs/plans/task.md
rtk git commit -m "auth: complete login page rebuild"
```
