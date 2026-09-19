import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BadgeCheck, Check, Copy, History, Image, LogOut, Pencil, User } from "lucide-react";
import { AppLayout } from "../components/Layout";
import { Avatar } from "../components/Navbar";
import { Alert, Button, Card, Input, PageHeader } from "../components/ui";
import { useAuth } from "../contexts/AuthContext";
import { fmtDate } from "../lib/format";

export default function Profile() {
  const { currentUser, logout, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [photoURL, setPhotoURL] = useState(currentUser?.photoURL || "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const isGoogle = currentUser?.providerData.some((p) => p.providerId === "google.com");
  const verified = currentUser?.emailVerified || isGoogle;

  function startEditing() {
    setDisplayName(currentUser?.displayName || "");
    setPhotoURL(currentUser?.photoURL || "");
    setError("");
    setMessage("");
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await updateUserProfile({ displayName: displayName.trim(), photoURL: photoURL.trim() });
      setMessage("Profile updated.");
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function copyUid() {
    try {
      await navigator.clipboard.writeText(currentUser.uid);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <AppLayout className="max-w-4xl">
      <PageHeader title="Profile" description="Manage your DeepScan account." />

      <div className="space-y-4">
        {message && <Alert variant="success">{message}</Alert>}
        {error && <Alert>{error}</Alert>}
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-5">
        <Card className="p-6 sm:p-8 lg:col-span-3">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar user={currentUser} className="h-20 w-20 text-3xl" />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-xl font-semibold text-white">{currentUser?.displayName || "Unnamed user"}</h2>
              <p className="truncate text-sm text-zinc-400">{currentUser?.email}</p>
              <span
                className={
                  verified
                    ? "mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300 ring-1 ring-inset ring-emerald-500/30"
                    : "mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 ring-1 ring-inset ring-amber-500/30"
                }
              >
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {verified ? "Email verified" : "Verification pending"}
              </span>
            </div>
            {!editing && (
              <Button variant="secondary" onClick={startEditing}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit
              </Button>
            )}
          </div>

          {editing && (
            <form onSubmit={handleSave} className="mt-8 space-y-4 border-t border-zinc-800 pt-6">
              <Input
                id="display-name"
                label="Display name"
                icon={User}
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={saving}
              />
              <Input
                id="photo-url"
                type="url"
                label="Photo URL"
                icon={Image}
                placeholder="https://example.com/photo.jpg"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                disabled={saving}
                hint="Link to a square image. Leave empty to use your initial."
              />
              <div className="flex gap-2 pt-2">
                <Button type="submit" loading={saving}>
                  Save changes
                </Button>
                <Button variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="font-medium text-white">Account</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-zinc-500">Sign-in method</dt>
              <dd className="mt-0.5 text-zinc-100">{isGoogle ? "Google" : "Email and password"}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Member since</dt>
              <dd className="mt-0.5 text-zinc-100">
                {fmtDate(currentUser?.metadata?.creationTime, { dateStyle: "long" })}
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">Last sign-in</dt>
              <dd className="mt-0.5 text-zinc-100">{fmtDate(currentUser?.metadata?.lastSignInTime)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">User ID</dt>
              <dd className="mt-1 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-md bg-zinc-950/70 px-2 py-1 font-mono text-xs text-zinc-300">
                  {currentUser?.uid}
                </code>
                <Button variant="ghost" size="icon" onClick={copyUid} aria-label="Copy user ID">
                  {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </Button>
              </dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-col gap-2 border-t border-zinc-800 pt-6">
            <Button to="/history" variant="secondary">
              <History className="h-4 w-4" aria-hidden="true" />
              View history
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
