import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn, Mail } from "lucide-react";
import { AuthLayout } from "../components/Layout";
import GoogleButton from "../components/GoogleButton";
import { Alert, Button, Divider, Input, PasswordInput } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const { login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const notice = location.state?.message;
  const redirectTo = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(null); // "email" | "google" | null

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return setError("Enter your email and password.");
    setError("");
    setPending("email");
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
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
      navigate(redirectTo, { replace: true });
    } catch (err) {
      if (err.code !== "auth/popup-closed-by-user") setError(err.message);
    } finally {
      setPending(null);
    }
  }

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back"
      subtitle="Sign in to analyze videos and keep your history."
      footer={
        <>
          New to DeepScan?{" "}
          <Link to="/signup" className="font-medium text-violet-400 hover:text-violet-300">
            Create an account
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        {notice && <Alert variant="success">{notice}</Alert>}
        {error && <Alert>{error}</Alert>}

        <GoogleButton onClick={handleGoogle} loading={pending === "google"} disabled={Boolean(pending)} />
      </div>

      <Divider label="or sign in with email" />

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
        <div className="space-y-1.5">
          <PasswordInput
            id="password"
            label="Password"
            placeholder="Your password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={Boolean(pending)}
          />
          <div className="text-right">
            <Link to="/forgot-password" className="text-xs font-medium text-violet-400 hover:text-violet-300">
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={pending === "email"} disabled={Boolean(pending)}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
