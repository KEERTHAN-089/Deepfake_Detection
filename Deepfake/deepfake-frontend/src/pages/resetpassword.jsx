import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { confirmPasswordReset } from "firebase/auth";
import { KeyRound, LinkIcon } from "lucide-react";
import { auth } from "../firebase";
import { AuthLayout } from "../components/Layout";
import { Alert, Button, PasswordInput } from "../components/ui";
import { toFriendlyError } from "../lib/authErrors";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const code = searchParams.get("oobCode");

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!done) return undefined;
    const t = setTimeout(() => navigate("/login"), 2500);
    return () => clearTimeout(t);
  }, [done, navigate]);

  const mismatch = passwordConfirm.length > 0 && password !== passwordConfirm;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password || !passwordConfirm) return setError("Fill in both fields.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== passwordConfirm) return setError("Passwords don't match.");

    setError("");
    setLoading(true);
    try {
      await confirmPasswordReset(auth, code, password);
      setDone(true);
    } catch (err) {
      setError(toFriendlyError(err, "Could not reset your password.").message);
    } finally {
      setLoading(false);
    }
  }

  if (!code) {
    return (
      <AuthLayout icon={LinkIcon} title="This link isn't valid" subtitle="The reset link is missing or has expired.">
        <Button to="/forgot-password" size="lg" className="w-full">
          Request a new link
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={KeyRound}
      title="Choose a new password"
      subtitle="Pick something you haven't used here before."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-medium text-violet-400 hover:text-violet-300">
            Sign in
          </Link>
        </>
      }
    >
      {done ? (
        <Alert variant="success" title="Password updated">
          Taking you to sign in…
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && <Alert>{error}</Alert>}
          <PasswordInput
            id="password"
            label="New password"
            placeholder="At least 6 characters"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          <PasswordInput
            id="password-confirm"
            label="Confirm new password"
            placeholder="Repeat your password"
            autoComplete="new-password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            disabled={loading}
            error={mismatch ? "Passwords don't match." : undefined}
          />
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Update password
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
