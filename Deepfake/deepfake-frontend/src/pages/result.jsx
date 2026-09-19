import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Clock,
  FileText,
  FileVideo,
  Film,
  Gauge,
  History,
  RotateCcw,
  SearchX,
  ShieldAlert,
  ShieldCheck,
  Timer,
} from "lucide-react";
import { AppLayout } from "../components/Layout";
import { Alert, Button, Card, EmptyState, Spinner, StatCard, VerdictBadge } from "../components/ui";
import { cn } from "../lib/cn";
import { useAuth } from "../contexts/AuthContext";
import { errorMessage, fetchResult } from "../lib/api";
import { fmtDate, fmtDuration, fmtNum, isNum } from "../lib/format";
import { generateHTMLReport } from "../utils/reportGenerator";

function ScoreRing({ value, threshold, fake }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(Math.max(Number(value) || 0, 0), 100);
  const tickAngle = isNum(threshold) ? (Number(threshold) / 100) * 2 * Math.PI : null;

  return (
    <div className="relative mx-auto h-48 w-48 shrink-0">
      <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="90" cy="90" r={radius} fill="none" strokeWidth="12" className="stroke-zinc-800" />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
          className={cn("transition-all duration-1000 ease-out", fake ? "stroke-rose-500" : "stroke-emerald-500")}
        />
        {tickAngle !== null && (
          <line
            x1={90 + (radius - 11) * Math.cos(tickAngle)}
            y1={90 + (radius - 11) * Math.sin(tickAngle)}
            x2={90 + (radius + 11) * Math.cos(tickAngle)}
            y2={90 + (radius + 11) * Math.sin(tickAngle)}
            strokeWidth="2.5"
            strokeLinecap="round"
            className="stroke-amber-300"
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-semibold tabular-nums tracking-tight text-white">{fmtNum(value, 1)}%</span>
        <span className="mt-1 text-xs text-zinc-400">fake probability</span>
      </div>
    </div>
  );
}

function ProbabilityBar({ label, value, tone, threshold }) {
  const pct = Math.min(Math.max(Number(value) || 0, 0), 100);
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="text-zinc-300">{label}</span>
        <span className="font-medium tabular-nums text-white">{fmtNum(value, 2)}%</span>
      </div>
      <div className="relative h-2.5 rounded-full bg-zinc-800">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-1000 ease-out",
            tone === "fake" ? "bg-rose-500" : "bg-emerald-500"
          )}
          style={{ width: `${pct}%` }}
        />
        {isNum(threshold) && (
          <div
            className="absolute -top-1 h-[18px] w-0.5 rounded-full bg-amber-300"
            style={{ left: `${threshold}%` }}
            title={`Detection threshold: ${threshold}%`}
          />
        )}
      </div>
    </div>
  );
}

function DetailList({ items }) {
  return (
    <dl className="divide-y divide-zinc-800/80">
      {items.map(([term, value]) => (
        <div key={term} className="flex items-start justify-between gap-4 py-3 text-sm">
          <dt className="shrink-0 text-zinc-400">{term}</dt>
          <dd className="min-w-0 break-words text-right font-medium text-zinc-100">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function openReport(result, { confidence, realProb, fakeProb, threshold }) {
  const html = generateHTMLReport(result, confidence, realProb, fakeProb, threshold);
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const win = window.open(url, "_blank", "width=1200,height=800");
  if (!win) {
    // Popup blocked: fall back to downloading the file.
    const a = document.createElement("a");
    a.href = url;
    a.download = `deepscan-report-${result.id || Date.now()}.html`;
    a.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export default function Result() {
  const { currentUser } = useAuth();
  const { id } = useParams();
  const location = useLocation();
  const stateResult = location.state?.result ?? null;

  // Holds the outcome of fetching `forId`; a mismatch with the current id means "still loading".
  const [fetched, setFetched] = useState({ forId: null, data: null, error: "" });
  const needsFetch = !stateResult && Boolean(id);

  useEffect(() => {
    if (!needsFetch) return undefined;
    let cancelled = false;
    fetchResult(id)
      .then((data) => !cancelled && setFetched({ forId: id, data, error: "" }))
      .catch(
        (err) =>
          !cancelled &&
          setFetched({ forId: id, data: null, error: errorMessage(err, "Couldn't load this result.") })
      );
    return () => {
      cancelled = true;
    };
  }, [id, needsFetch]);

  const loading = needsFetch && fetched.forId !== id;
  const error = needsFetch ? fetched.error : "";
  const result = stateResult || (needsFetch ? fetched.data : null);

  if (loading) {
    return (
      <AppLayout className="flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-zinc-400" role="status">
          <Spinner className="h-7 w-7" />
          Loading result…
        </div>
      </AppLayout>
    );
  }

  if (error || !result) {
    return (
      <AppLayout>
        <EmptyState
          className="mx-auto max-w-lg"
          icon={SearchX}
          title={error ? "Couldn't load this result" : "No result to show"}
          description={error || "Run an analysis first, or open a past result from your history."}
          action={
            <>
              <Button to="/">Analyze a video</Button>
              {currentUser && (
                <Button to="/history" variant="secondary">
                  View history
                </Button>
              )}
            </>
          }
        />
      </AppLayout>
    );
  }

  if (result.success === false || !result.prediction) {
    return (
      <AppLayout>
        <EmptyState
          className="mx-auto max-w-lg"
          icon={AlertTriangle}
          title="The analysis didn't finish"
          description={result.error || "The model could not produce a result for this video."}
          action={<Button to="/">Try another video</Button>}
        />
      </AppLayout>
    );
  }

  const fake = result.prediction === "FAKE";
  const realProb = Number(result.real_probability) || 0;
  const fakeProb = Number(result.fake_probability) || 0;
  const confidence = Number(result.confidence) || 0;
  const threshold = isNum(result.threshold) ? Number(result.threshold) : null;
  const info = result.video_info || {};
  const VerdictIcon = fake ? ShieldAlert : ShieldCheck;

  const comparison =
    threshold === null
      ? ""
      : fake
        ? `, at or above the ${fmtNum(threshold, 0)}% detection threshold`
        : `, below the ${fmtNum(threshold, 0)}% detection threshold`;

  return (
    <AppLayout>
      <Card
        className={cn(
          "relative overflow-hidden p-6 sm:p-10",
          fake ? "border-rose-500/30" : "border-emerald-500/30"
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-25 blur-3xl",
            fake ? "bg-rose-600" : "bg-emerald-600"
          )}
        />
        <div className="relative flex flex-col gap-10 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl ring-1",
                  fake ? "bg-rose-500/10 text-rose-300 ring-rose-500/30" : "bg-emerald-500/10 text-emerald-300 ring-emerald-500/30"
                )}
              >
                <VerdictIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <VerdictBadge prediction={result.prediction} />
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {fake ? "This video shows signs of manipulation" : "No signs of manipulation found"}
            </h1>
            <p className="mt-3 leading-relaxed text-zinc-400">
              The model rated this video {fmtNum(fakeProb, 1)}% likely to be fake{comparison}.
            </p>
            <p className="mt-5 flex min-w-0 items-center gap-2 text-sm text-zinc-500">
              <FileVideo className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{result.filename || "Untitled video"}</span>
            </p>
          </div>
          <ScoreRing value={fakeProb} threshold={threshold} fake={fake} />
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Confidence"
          value={`${fmtNum(confidence, 1)}%`}
          sublabel={`in the "${fake ? "fake" : "real"}" verdict`}
          icon={Gauge}
          tone={fake ? "fake" : "real"}
        />
        <StatCard
          label="Frames analyzed"
          value={info.frames_analyzed ?? "—"}
          sublabel={isNum(info.total_frames) ? `of ${info.total_frames} total` : undefined}
          icon={Film}
          tone="accent"
        />
        <StatCard label="Duration" value={fmtDuration(info.duration)} icon={Clock} />
        <StatCard
          label="Processing time"
          value={isNum(result.processing_time_ms) ? fmtDuration(result.processing_time_ms / 1000) : "—"}
          icon={Timer}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-3">
          <h2 className="font-medium text-white">Probability breakdown</h2>
          <p className="mt-1 text-sm text-zinc-400">How the model split its score between the two classes.</p>
          <div className="mt-6 space-y-6">
            <ProbabilityBar label="Real" value={realProb} tone="real" />
            <ProbabilityBar label="Fake" value={fakeProb} tone="fake" threshold={threshold} />
          </div>
          {threshold !== null && (
            <p className="mt-6 flex items-center gap-2 text-xs text-zinc-500">
              <span className="h-3 w-0.5 rounded-full bg-amber-300" aria-hidden="true" />
              Videos at or above {fmtNum(threshold, 0)}% fake probability are flagged as deepfakes.
            </p>
          )}
        </Card>

        <Card className="px-6 py-4 lg:col-span-2">
          <h2 className="pt-2 font-medium text-white">Details</h2>
          <DetailList
            items={[
              ["File size", isNum(result.file_size_mb) ? `${fmtNum(result.file_size_mb, 2)} MB` : "—"],
              ["Frame rate", isNum(info.fps) ? `${fmtNum(info.fps, 2)} fps` : "—"],
              ["Analyzed on", fmtDate(result.timestamp)],
              ["Model", result.model_version || "—"],
              ["Result ID", <span className="font-mono text-xs">{result.id || "—"}</span>],
            ]}
          />
        </Card>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button to="/" size="lg">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Analyze another video
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => openReport(result, { confidence, realProb, fakeProb, threshold: threshold ?? 45 })}
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          Open full report
        </Button>
        {currentUser && (
          <Button to="/history" variant="ghost" size="lg">
            <History className="h-4 w-4" aria-hidden="true" />
            View history
          </Button>
        )}
      </div>

      <Alert variant="info" className="mt-10">
        DeepScan gives a probability, not proof. The Xception + BiLSTM model looked at {info.frames_analyzed ?? "the sampled"}{" "}
        frames from this video. Check important content against other sources before you act on it.
      </Alert>
    </AppLayout>
  );
}
