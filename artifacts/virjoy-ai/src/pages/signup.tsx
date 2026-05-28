import { useState, useRef, useEffect, useContext } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sparkles, Mail, Lock, Eye, EyeOff, Phone,
  ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { OTPInput, OTPInputContext } from "input-otp";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { ConfirmationResult } from "firebase/auth";

// ── Schemas ───────────────────────────────────────────────────────────────────
const emailSchema = z
  .object({
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Include one uppercase letter")
      .regex(/[0-9]/, "Include one number"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type EmailForm = z.infer<typeof emailSchema>;

const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, "Enter a valid phone number with country code")
    .regex(/^\+/, "Include country code, e.g. +91 9876543210"),
});
type PhoneForm = z.infer<typeof phoneSchema>;

// ── OTP Slot ──────────────────────────────────────────────────────────────────
function OTPSlot({ index }: { index: number }) {
  const ctx = useContext(OTPInputContext);
  const slot = ctx.slots[index]!;
  return (
    <div
      className={`w-12 h-14 flex items-center justify-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 bg-white/5 ${
        slot.isActive
          ? "border-primary shadow-lg shadow-primary/20 text-white"
          : slot.char
          ? "border-primary/40 text-white"
          : "border-white/15 text-white/30"
      }`}
    >
      {slot.char ?? <span className="w-2 h-0.5 bg-white/20 rounded" />}
    </div>
  );
}

// ── Step dots ─────────────────────────────────────────────────────────────────
function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-6">
      {[1, 2, 3].map((s) => (
        <motion.div
          key={s}
          animate={{
            width: step === s ? 24 : 8,
            backgroundColor:
              step === s
                ? "hsl(var(--primary))"
                : step > s
                ? "hsl(var(--primary) / 0.4)"
                : "rgba(255,255,255,0.15)",
          }}
          transition={{ duration: 0.3 }}
          className="h-2 rounded-full"
        />
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SignupPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const initialStep = new URLSearchParams(search).get("step") === "phone" ? 2 : 1;

  const { signUpWithEmail, sendPhoneOTP, confirmOTPAndLink, isConfigured } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(initialStep);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema) });
  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema) });

  const titles = ["Create your account", "Verify your phone", "Enter the OTP"];
  const subtitles = [
    "Start creating cinematic AI videos",
    "We'll send a 6-digit code to your number",
    "Enter the code sent to your phone",
  ];

  // ── Step 1 ────────────────────────────────────────────────────────────────
  const handleEmailSubmit = async (data: EmailForm) => {
    setLoading(true);
    try {
      await signUpWithEmail(data.email, data.password);
      setStep(2);
    } catch (err: any) {
      toast({ title: "Sign up failed", description: emailErrorMsg(err.code), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2 ────────────────────────────────────────────────────────────────
  const handleSendOTP = async (data: PhoneForm) => {
    setLoading(true);
    try {
      const result = await sendPhoneOTP(data.phone, "recaptcha-container");
      setConfirmation(result);
      setStep(3);
      toast({ title: "OTP sent", description: `Code sent to ${data.phone}` });
    } catch (err: any) {
      toast({ title: "Failed to send OTP", description: phoneErrorMsg(err.code), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3 ────────────────────────────────────────────────────────────────
  const handleVerifyOTP = async () => {
    if (otp.length !== 6 || !confirmation) return;
    setLoading(true);
    try {
      const dbUser = await confirmOTPAndLink(confirmation, otp);
      toast({
        title: "Account created!",
        description: `Welcome! You have ${dbUser.credits} free credits.`,
      });
      navigate("/");
    } catch (err: any) {
      toast({ title: "Verification failed", description: otpErrorMsg(err.code), variant: "destructive" });
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit when full OTP entered
  useEffect(() => {
    if (otp.length === 6) handleVerifyOTP();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 pt-24 pb-12">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[100px]" />
      </div>

      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container" ref={recaptchaRef} className="hidden" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-primary to-cyan-500 flex items-center justify-center shadow-xl shadow-primary/30">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="text-center">
            <h1 className="font-black text-3xl tracking-tight bg-gradient-to-r from-white to-primary bg-clip-text text-transparent">
              VirJoy AI
            </h1>
            <p className="text-white/50 text-sm mt-1">{subtitles[step - 1]}</p>
          </div>
        </div>

        {/* Config warning */}
        {!isConfigured && (
          <div className="mb-4 flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-amber-300">Firebase not configured</p>
              <p className="text-amber-400/70 mt-0.5">
                Add your <code className="text-amber-300">VITE_FIREBASE_*</code> secrets to enable sign-up.
              </p>
            </div>
          </div>
        )}

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <StepDots step={step} />
          <h2 className="text-xl font-bold text-white text-center mb-6">{titles[step - 1]}</h2>

          <AnimatePresence mode="wait">
            {/* Step 1 — Email + Password */}
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={emailForm.handleSubmit(handleEmailSubmit)}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm font-medium">Email address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      {...emailForm.register("email")}
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      disabled={!isConfigured}
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary/60 h-12 disabled:opacity-40"
                    />
                  </div>
                  {emailForm.formState.errors.email && (
                    <p className="text-red-400/80 text-xs">{emailForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm font-medium">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      {...emailForm.register("password")}
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Min 8 chars, 1 uppercase, 1 number"
                      disabled={!isConfigured}
                      className="pl-10 pr-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary/60 h-12 disabled:opacity-40"
                    />
                    <button type="button" onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {emailForm.formState.errors.password && (
                    <p className="text-red-400/80 text-xs">{emailForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm font-medium">Confirm password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      {...emailForm.register("confirmPassword")}
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      disabled={!isConfigured}
                      className="pl-10 pr-11 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary/60 h-12 disabled:opacity-40"
                    />
                    <button type="button" onClick={() => setShowConfirm((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {emailForm.formState.errors.confirmPassword && (
                    <p className="text-red-400/80 text-xs">{emailForm.formState.errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={loading || !isConfigured}
                  className="w-full h-12 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/25 mt-2 disabled:opacity-40">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <span className="flex items-center gap-2">Continue <ArrowRight className="w-4 h-4" /></span>
                  )}
                </Button>
              </motion.form>
            )}

            {/* Step 2 — Phone number */}
            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={phoneForm.handleSubmit(handleSendOTP)}
                className="space-y-5"
              >
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-sm text-white/70">
                  <p className="font-medium text-white/90 mb-1">Why verify your phone?</p>
                  <p>Phone verification prevents fake accounts and keeps your credits secure across devices.</p>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-white/70 text-sm font-medium">Mobile number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input
                      {...phoneForm.register("phone")}
                      type="tel"
                      autoComplete="tel"
                      placeholder="+91 9876543210"
                      className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/25 focus:border-primary/60 h-12"
                    />
                  </div>
                  {phoneForm.formState.errors.phone && (
                    <p className="text-red-400/80 text-xs">{phoneForm.formState.errors.phone.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={loading}
                  className="w-full h-12 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/25">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <span className="flex items-center gap-2">Send OTP <ArrowRight className="w-4 h-4" /></span>
                  )}
                </Button>
              </motion.form>
            )}

            {/* Step 3 — OTP */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <p className="text-center text-white/50 text-sm">
                  Enter the 6-digit code sent to your phone
                </p>

                <div className="flex justify-center">
                  <OTPInput
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    containerClassName="flex gap-2"
                    render={({ slots }) => (
                      <>{slots.map((_, i) => <OTPSlot key={i} index={i} />)}</>
                    )}
                  />
                </div>

                <Button
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  className="w-full h-12 bg-gradient-to-r from-primary to-cyan-500 hover:from-primary/90 hover:to-cyan-500/90 text-white font-semibold rounded-xl shadow-lg shadow-primary/25 disabled:opacity-40"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Verify & Create Account
                    </span>
                  )}
                </Button>

                <button type="button"
                  onClick={() => { setStep(2); setOtp(""); setConfirmation(null); }}
                  className="w-full text-center text-white/40 text-sm hover:text-white/60 transition-colors flex items-center justify-center gap-1.5">
                  <ArrowLeft className="w-3.5 h-3.5" /> Change phone number
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {step === 1 && (
            <div className="mt-6 text-center text-sm text-white/40">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:text-primary/80 font-semibold transition-colors">
                Sign in
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function emailErrorMsg(code?: string) {
  switch (code) {
    case "auth/email-already-in-use": return "An account with this email already exists. Try signing in.";
    case "auth/invalid-email": return "Please enter a valid email address.";
    case "auth/weak-password": return "Password is too weak. Use at least 8 characters.";
    case "auth/network-request-failed": return "Network error. Check your connection.";
    default: return "Sign up failed. Please try again.";
  }
}
function phoneErrorMsg(code?: string) {
  switch (code) {
    case "auth/invalid-phone-number": return "Invalid phone number. Include country code, e.g. +91 9876543210.";
    case "auth/too-many-requests": return "Too many OTP requests. Please wait and try again.";
    case "auth/provider-already-linked": return "This phone is already linked to another account.";
    default: return "Could not send OTP. Check the number and try again.";
  }
}
function otpErrorMsg(code?: string) {
  switch (code) {
    case "auth/invalid-verification-code": return "Incorrect code. Re-enter the 6-digit OTP.";
    case "auth/code-expired": return "Code expired. Go back and request a new OTP.";
    default: return "Verification failed. Please try again.";
  }
}
