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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to send code. Please try again.";
      setError(message);
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invalid code. Please try again.";
      setError(message);
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
