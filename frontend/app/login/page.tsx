"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Mail, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Float } from "@/components/animations/MotionElements";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) return;
    
    if (!email.endsWith("@cuchd.in") && !email.endsWith("@cumail.in")) {
      setError("Please use your @cuchd.in or @cumail.in email address.");
      return;
    }
    
    setLoading(true);
    // Simulate API call — will be replaced with real POST /api/auth/magic-link/
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex relative overflow-hidden">
      {/* Left side — branding */}
      <div className="hidden lg:flex w-1/2 bg-black text-white relative overflow-hidden flex-col justify-between p-16 noise-overlay">
        {/* Code grid overlay */}
        <div className="absolute inset-0 code-grid opacity-50" />

        <div className="relative z-10">
          <Link href="/" className="text-xl font-bold tracking-tight opacity-90">
            CSquareClub
          </Link>
        </div>

        <div className="relative z-10 max-w-md">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-6"
          >
            Your gateway to every tech event on campus.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-lg text-white/60 leading-relaxed"
          >
            Sign in with your email. We&apos;ll send you a magic link — no
            passwords to remember, ever.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative z-10 text-sm text-white/40"
        >
          &copy; {new Date().getFullYear()} C Square Club
        </motion.div>
      </div>

      {/* Right side — login form */}
      <div className="flex-1 flex items-center justify-center px-5 md:px-10">
        <div className="w-full max-w-md">
          {/* Back link */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-12"
          >
            <Link
              href="/"
              className="text-sm text-[var(--c-muted-text)] hover:text-[var(--c-accent)] transition-colors flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to home
            </Link>
          </motion.div>

          <AnimatePresence mode="wait">
            {!sent ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <Sparkles className="w-5 h-5 text-[var(--c-accent)]" />
                  <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--c-muted-text)]">
                    Magic Link Login
                  </span>
                </div>

                <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                  Welcome back.
                </h1>
                <p className="text-[var(--c-secondary-text)] mb-10 leading-relaxed">
                  Enter your email and we&apos;ll send you a magic link to sign
                  in. No password needed — works for both new and returning users.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium text-[var(--c-primary-text)]"
                    >
                      Email address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--c-muted-text)]" />
                      <input
                        id="email"
                        type="email"
                        placeholder="you@cuchd.in"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[var(--c-border)] bg-white text-[var(--c-primary-text)] placeholder:text-[var(--c-muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-accent)]/10 focus:border-[var(--c-accent)] transition-all duration-200"
                      />
                    </div>
                    {error && (
                      <p className="text-sm text-red-500 font-medium">
                        {error}
                      </p>
                    )}
                    <p className="text-xs text-[var(--c-muted-text)]">
                      CU students: use your @cuchd.in or @cumail.in email
                    </p>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full group"
                    disabled={loading}
                  >
                    {loading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <>
                        Send Magic Link
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </Button>
                </form>

                <p className="text-xs text-[var(--c-muted-text)] mt-8 text-center">
                  By signing in, you agree to our terms of service. Your
                  account is created automatically on first sign in.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2,
                  }}
                  className="w-20 h-20 rounded-full bg-black text-white flex items-center justify-center mx-auto mb-8 shadow-lg"
                >
                  <CheckCircle2 className="w-10 h-10" />
                </motion.div>

                <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
                  Check your inbox!
                </h2>
                <p className="text-[var(--c-secondary-text)] mb-2 leading-relaxed max-w-sm mx-auto">
                  We&apos;ve sent a magic link to
                </p>
                <p className="font-semibold text-[var(--c-accent)] mb-8">{email}</p>
                <p className="text-sm text-[var(--c-muted-text)] mb-8">
                  The link expires in 15 minutes. Didn&apos;t receive it?
                </p>
                <Button
                  variant="secondary"
                  onClick={() => setSent(false)}
                  className="mx-auto"
                >
                  Try again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
