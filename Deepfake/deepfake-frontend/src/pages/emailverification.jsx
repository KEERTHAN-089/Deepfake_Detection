import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { auth } from "../firebase";
import { AuthLayout } from "../components/Layout";
import { Alert, Button, Divider } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";

export default function EmailVerification() {
  const { currentUser, sendVerificationEmail, logout } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(null); // "check" | "resend" | null
  const [countdown, setCountdown] = useState(0);
  const [verified, setVerified] = useState(Boolean(currentUser?.emailVerified));

  useEffect(() => {
    if (!currentUser) navigate("/login", { replace: true });
  }, [currentUser, navigate]);

  useEffect(() => {
    if (!verified) return undefined;
    const t = setTimeout(() => navigate("/", { replace: true }), 1500);
    return () => clearTimeout(t);
  }, [verified, navigate]);

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function handleResend() {
    setError("");
    setMessage("");
    setPending("resend");
    try {
      await sendVerificationEmail();
      setMessage("Verification email sent. Check your inbox.");
      setCountdown(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(null);
    }
  }

  async function handleCheck() {
    setError("");
    setMessage("");
    setPending("check");
    try {
      await auth.currentUser?.reload();
      if (auth.currentUser?.emailVerified) {
        setVerified(true);
      } else {
        setError("Your email isn't verified yet. Click the link in the email we sent, then try again.");
      }
    } catch (err) {
      setError(err.message || "Could not check your verification status.");
    } finally {
      setPending(null);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <AuthLayout
      icon={MailCheck}
      title="Verify your email"
      subtitle={
        <>
          We sent a verification link to{" "}
          <span className="font-medium text-zinc-200">{currentUser?.email}</span>.
        </>
      }
      footer={
        <button type="button" onClick={handleLogout} className="font-medium text-violet-400 hover:text-violet-300">
          Sign in with a different account
        </button>
      }
    >
      <div className="space-y-4">
        {verified && <Alert variant="success">Email verified. Taking you to DeepScan…</Alert>}
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert>{error}</Alert>}

        <ul className="space-y-2 rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 text-sm text-zinc-400">
          <li>Open the email and click the verification link.</li>
          <li>Can't find it? Check your spam folder.</li>
          <li>The link expires after 24 hours.</li>
        </ul>

        <Button size="lg" className="w-full" onClick={handleCheck} loading={pending === "check"} disabled={Boolean(pending) || verified}>
          I've verified my email
        </Button>
      </div>

      <Divider label="didn't get it?" />

      <Button
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={handleResend}
        loading={pending === "resend"}
        disabled={Boolean(pending) || countdown > 0 || verified}
      >
        {countdown > 0 ? `Resend in ${countdown}s` : "Resend verification email"}
      </Button>
    </AuthLayout>
  );
}
