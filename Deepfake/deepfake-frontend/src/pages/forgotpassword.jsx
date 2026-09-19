import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, KeyRound, Mail, MailCheck } from "lucide-react";
import { AuthLayout } from "../components/Layout";
import { Alert, Button, Input } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";

export default function ForgotPassword() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email) return setError("Enter your email address.");
    setError("");
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSentTo(email);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const backToLogin = (
    <Link to="/login" className="inline-flex items-center gap-1.5 font-medium text-violet-400 hover:text-violet-300">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to sign in
    </Link>
  );

  if (sentTo) {
    return (
      <AuthLayout icon={MailCheck} title="Check your inbox" footer={backToLogin}>
        <div className="space-y-4 text-center text-sm text-zinc-400">
          <p>
            If an account exists for <span className="font-medium text-zinc-100">{sentTo}</span>, you'll get a link
            to reset your password in a few minutes.
          </p>
          <p>Don't see it? Check your spam folder.</p>
          <Button variant="secondary" className="w-full" onClick={() => setSentTo("")}>
            Use a different email
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={KeyRound}
      title="Reset your password"
      subtitle="Enter your account email and we'll send you a reset link."
      footer={backToLogin}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {error && <Alert>{error}</Alert>}
        <Input
          id="email"
          type="email"
          label="Email"
          icon={Mail}
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
}
