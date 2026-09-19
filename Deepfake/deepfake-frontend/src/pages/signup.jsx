import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, UserPlus } from "lucide-react";
import { AuthLayout } from "../components/Layout";
import GoogleButton from "../components/GoogleButton";
import { Alert, Button, Divider, Input, PasswordInput } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";

export default function Signup() {
  const { signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(null);

  const mismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password || !passwordConfirm) return setError("Fill in all fields.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== passwordConfirm) return setError("Passwords don't match.");
    if (!agreeTerms) return setError("Please accept the Terms and Privacy Policy.");

    setError("");
    setPending("email");
    try {
      await signup(email, password);
      // signup() signs the new user out until they verify their email.
      navigate("/login", {
        state: {
          email,
          message: `Account created. We sent a verification link to ${email}. Verify your email, then sign in.`,
        },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setPending(null);
    }
  }

  async function handleGoogle() {
    setError("");
    setPending("google");
    try {
      await signInWithGoogle();
      navigate("/", { replace: true });
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") setError(err.message);
    } finally {
      setPending(null);
    }
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="Create your account"
      subtitle="Save every analysis and come back to it any time."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-violet-400 hover:text-violet-300">
            Sign in
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        {error && <Alert>{error}</Alert>}
        <GoogleButton onClick={handleGoogle} loading={pending === "google"} disabled={Boolean(pending)}>
          Sign up with Google
        </GoogleButton>
      </div>

      <Divider label="or sign up with email" />

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <Input
          id="email"
          type="email"
          label="Email"
          icon={Mail}
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={Boolean(pending)}
        />
        <PasswordInput
          id="password"
          label="Password"
          placeholder="At least 6 characters"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={Boolean(pending)}
          hint="Use at least 6 characters."
        />
        <PasswordInput
          id="password-confirm"
          label="Confirm password"
          placeholder="Repeat your password"
          autoComplete="new-password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          disabled={Boolean(pending)}
          error={mismatch ? "Passwords don't match." : undefined}
        />

        <label htmlFor="terms" className="flex cursor-pointer items-start gap-3 text-sm text-zinc-400">
          <input
            id="terms"
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            disabled={Boolean(pending)}
            className="mt-0.5 h-4 w-4 rounded border-zinc-700 bg-zinc-900 accent-violet-500"
          />
          <span>I agree to the Terms of Service and Privacy Policy.</span>
        </label>

        <Button type="submit" size="lg" className="w-full" loading={pending === "email"} disabled={Boolean(pending)}>
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
