import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Clock, Cpu, FileVideo, Film, Link2, ScanSearch, ShieldCheck, Upload, X } from "lucide-react";
import { AppLayout } from "../components/Layout";
import { Alert, Button, Card, Input, Spinner } from "../components/ui";
import { cn } from "../lib/cn";
import { useAuth } from "../contexts/AuthContext";
import { analyzeFile, analyzeUrl, errorMessage } from "../lib/api";
import { fmtBytes, fmtElapsed } from "../lib/format";

// Must match allowed_extensions in python-backend/main.py
const ALLOWED_EXT = [".mp4", ".avi", ".mov", ".mkv", ".flv", ".wmv", ".webm"];

const STEPS = [
  {
    icon: Film,
    title: "Sample frames",
    body: "Up to 32 frames are taken at even intervals across the whole clip.",
  },
  {
    icon: Cpu,
    title: "Extract features",
    body: "An Xception network turns each frame into a detailed visual fingerprint.",
  },
  {
    icon: ScanSearch,
    title: "Check consistency",
    body: "A bidirectional LSTM compares frames over time and scores how likely the video is manipulated.",
  },
];

function isValidUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function fileExtension(name) {
  const i = name.lastIndexOf(".");
  return i === -1 ? "" : name.slice(i).toLowerCase();
}

export default function Home() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("file");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [url, setUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | uploading | analyzing
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const abortRef = useRef(null);

  const busy = status !== "idle";
  const trimmedUrl = url.trim();
  const canSubmit = !busy && (mode === "file" ? Boolean(file) : isValidUrl(trimmedUrl));

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    if (!busy) return undefined;
    const start = Date.now();
    setElapsed(0);
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [busy]);

  // Abort an in-flight request if the user leaves the page.
  useEffect(() => () => abortRef.current?.abort(), []);

  function pickFile(candidate) {
    if (!candidate) return;
    const ext = fileExtension(candidate.name);
    const supported = ext ? ALLOWED_EXT.includes(ext) : candidate.type.startsWith("video/");
    if (!supported) {
      setError(`That file type isn't supported. Use ${ALLOWED_EXT.join(", ")}.`);
      return;
    }
    setError("");
    setFile(candidate);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (!busy) pickFile(e.dataTransfer.files?.[0]);
  }

  function switchMode(next) {
    setMode(next);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (mode === "file" && !file) return setError("Choose a video file first.");
    if (mode === "url" && !isValidUrl(trimmedUrl)) return setError("Enter a full link starting with http:// or https://.");

    setError("");
    setProgress(0);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      let result;
      if (mode === "file") {
        setStatus("uploading");
        result = await analyzeFile(file, {
          signal: controller.signal,
          onUploadProgress: (pct) => {
            setProgress(pct);
            if (pct >= 100) setStatus("analyzing");
          },
        });
      } else {
        setStatus("analyzing");
        result = await analyzeUrl(trimmedUrl, { signal: controller.signal });
      }

      navigate(result.id ? `/result/${result.id}` : "/result", { state: { result } });
    } catch (err) {
      const message = errorMessage(err, "The analysis failed. Please try again.");
      if (message) setError(message);
    } finally {
      abortRef.current = null;
      setStatus("idle");
    }
  }

  return (
    <AppLayout>
      <section className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          Xception + BiLSTM video analysis
        </span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Is this video <span className="text-violet-400">real</span>?
        </h1>
        <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">
          Upload a clip or paste a link. DeepScan samples frames across the video and checks them for
          signs of face manipulation.
        </p>
      </section>

      <Card className="mx-auto mt-10 max-w-2xl p-2 shadow-2xl shadow-black/40">
        <div role="tablist" aria-label="Video source" className="grid grid-cols-2 gap-1 rounded-xl bg-zinc-950/70 p-1">
          {[
            { key: "file", label: "Upload file", icon: Upload },
            { key: "url", label: "Paste link", icon: Link2 },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={mode === tab.key}
              disabled={busy}
              onClick={() => switchMode(tab.key)}
              className={cn(
                "flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-medium transition disabled:cursor-not-allowed",
                mode === tab.key ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <tab.icon className="h-4 w-4" aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-4 sm:p-6" noValidate>
          {mode === "file" ? (
            file ? (
              <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
                {previewUrl && (
                  <video
                    src={previewUrl}
                    className="aspect-video max-h-72 w-full bg-black object-contain"
                    controls
                    muted
                    playsInline
                    preload="metadata"
                  />
                )}
                <div className="flex items-center gap-3 p-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300">
                    <FileVideo className="h-4 w-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-100">{file.name}</p>
                    <p className="text-xs text-zinc-500">{fmtBytes(file.size)}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                    disabled={busy}
                    aria-label="Remove file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <label
                htmlFor="video-file"
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition",
                  "focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-500/25",
                  dragging
                    ? "border-violet-400 bg-violet-500/10"
                    : "border-zinc-700/80 hover:border-zinc-500 hover:bg-zinc-800/30"
                )}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 ring-1 ring-zinc-700">
                  <Upload className="h-5 w-5 text-zinc-300" aria-hidden="true" />
                </div>
                <p className="mt-4 text-sm font-medium text-zinc-200">
                  Drop a video here, or <span className="text-violet-400">browse</span>
                </p>
                <p className="mt-1 text-xs text-zinc-500">MP4, MOV, AVI, MKV, WEBM, FLV or WMV</p>
                <input
                  id="video-file"
                  type="file"
                  accept={`${ALLOWED_EXT.join(",")},video/*`}
                  className="sr-only"
                  onChange={(e) => {
                    pickFile(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
              </label>
            )
          ) : (
            <Input
              id="video-url"
              label="Video link"
              type="url"
              inputMode="url"
              icon={Link2}
              placeholder="https://www.youtube.com/watch?v=…"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              disabled={busy}
              autoComplete="off"
              hint="Works with YouTube, Instagram and direct video links. Public videos work best."
            />
          )}

          {error && <Alert>{error}</Alert>}

          {busy ? (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4" aria-live="polite">
              <div className="flex items-center gap-3">
                <Spinner />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-100">
                    {status === "uploading"
                      ? `Uploading… ${progress}%`
                      : mode === "url"
                        ? "Downloading and analyzing the video"
                        : "Analyzing frames"}
                  </p>
                  <p className="text-xs text-zinc-400">This can take a few minutes on CPU. Keep this tab open.</p>
                </div>
                <span className="flex items-center gap-1.5 font-mono text-xs tabular-nums text-zinc-400">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {fmtElapsed(elapsed)}
                </span>
              </div>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                {status === "uploading" ? (
                  <div
                    className="h-full rounded-full bg-violet-500 transition-[width] duration-300"
                    style={{ width: `${progress}%` }}
                  />
                ) : (
                  <div className="h-full w-1/3 animate-indeterminate rounded-full bg-violet-500" />
                )}
              </div>
              <div className="mt-3 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => abortRef.current?.abort()}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button type="submit" size="lg" className="w-full" disabled={!canSubmit}>
              <ScanSearch className="h-5 w-5" aria-hidden="true" />
              Analyze video
            </Button>
          )}
        </form>
      </Card>

      {!currentUser && (
        <p className="mt-5 text-center text-sm text-zinc-500">
          <Link to="/login" className="font-medium text-violet-400 hover:text-violet-300">
            Sign in
          </Link>{" "}
          to keep a history of your analyses.
        </p>
      )}

      <section className="mt-24" aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="text-center text-sm font-semibold uppercase tracking-wider text-zinc-500">
          How it works
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Card key={step.title} className="p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300 ring-1 ring-violet-500/20">
                  <step.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="font-mono text-xs text-zinc-500">0{i + 1}</span>
              </div>
              <h3 className="mt-4 font-medium text-white">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-zinc-400">{step.body}</p>
            </Card>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}
