import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BarChart3, ChevronRight, FileVideo, Plus, Search, ShieldAlert, ShieldCheck } from "lucide-react";
import { AppLayout } from "../components/Layout";
import { Alert, Button, Card, EmptyState, Input, PageHeader, Skeleton, StatCard, VerdictBadge } from "../components/ui";
import { cn } from "../lib/cn";
import { errorMessage, fetchHistory } from "../lib/api";
import { fmtDate, fmtNum } from "../lib/format";

const FILTERS = [
  ["all", "All"],
  ["FAKE", "Deepfakes"],
  ["REAL", "Authentic"],
];

// Firestore docs wrap the analysis in a `data` field; in-memory results do not.
function normalize(doc) {
  const r = doc.data || doc;
  const ts = r.timestamp || doc.created_at;
  return {
    id: r.id || doc.doc_id || doc.result_id,
    filename: r.filename || "Untitled video",
    time: ts ? new Date(ts).getTime() : 0,
    prediction: r.prediction,
    success: r.success !== false,
    fakeProb: Number(r.fake_probability),
    raw: r,
  };
}

function FakeMeter({ value, fake }) {
  const pct = Math.min(Math.max(value || 0, 0), 100);
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={cn("h-full rounded-full", fake ? "bg-rose-500" : "bg-emerald-500")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 text-right text-sm tabular-nums text-zinc-300">{fmtNum(value, 1)}%</span>
    </div>
  );
}

export default function History() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const docs = await fetchHistory();
      const seen = new Set();
      const list = docs
        .map(normalize)
        .filter((a) => a.success && a.prediction)
        .sort((a, b) => b.time - a.time)
        // Older versions saved a result again each time it was viewed; keep one per result ID.
        .filter((a) => {
          if (!a.id) return true;
          if (seen.has(a.id)) return false;
          seen.add(a.id);
          return true;
        });
      setItems(list);
    } catch (err) {
      setError(errorMessage(err, "Couldn't load your history."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const fakes = items.filter((a) => a.prediction === "FAKE").length;
    return { total: items.length, fakes, real: items.length - fakes };
  }, [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (a) => (filter === "all" || a.prediction === filter) && (!q || a.filename.toLowerCase().includes(q))
    );
  }, [items, query, filter]);

  const open = (a) => navigate(a.id ? `/result/${a.id}` : "/result", { state: { result: a.raw } });

  return (
    <AppLayout>
      <PageHeader
        title="History"
        description="Every video you've analyzed while signed in."
        actions={
          <Button to="/">
            <Plus className="h-4 w-4" aria-hidden="true" />
            New analysis
          </Button>
        }
      />

      {error && (
        <Alert
          className="mb-6"
          title="Couldn't load your history"
          action={
            <Button variant="secondary" size="sm" onClick={load}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[116px] rounded-2xl" />
            ))}
          </div>
          <Card className="space-y-4 p-6">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </Card>
        </div>
      ) : !error && items.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="No analyses yet"
          description="Results are saved here automatically after each analysis."
          action={<Button to="/">Analyze your first video</Button>}
        />
      ) : items.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Total analyses" value={stats.total} icon={BarChart3} tone="accent" />
            <StatCard label="Likely authentic" value={stats.real} icon={ShieldCheck} tone="real" />
            <StatCard label="Likely deepfakes" value={stats.fakes} icon={ShieldAlert} tone="fake" />
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="w-full sm:max-w-xs">
              <Input
                id="history-search"
                icon={Search}
                placeholder="Search by filename"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search by filename"
              />
            </div>
            <div role="radiogroup" aria-label="Filter by verdict" className="inline-flex rounded-lg bg-zinc-900 p-1 ring-1 ring-zinc-800">
              {FILTERS.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={filter === key}
                  onClick={() => setFilter(key)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition",
                    filter === key ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-zinc-200"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {visible.length === 0 ? (
            <p className="mt-10 text-center text-sm text-zinc-500">No analyses match your search.</p>
          ) : (
            <>
              {/* Desktop table */}
              <Card className="mt-4 hidden overflow-hidden md:block">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
                    <tr>
                      <th scope="col" className="px-6 py-3 font-medium">Video</th>
                      <th scope="col" className="px-6 py-3 font-medium">Verdict</th>
                      <th scope="col" className="px-6 py-3 font-medium">Fake probability</th>
                      <th scope="col" className="px-6 py-3 font-medium">Analyzed</th>
                      <th scope="col" className="px-6 py-3"><span className="sr-only">Open</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80">
                    {visible.map((a, i) => (
                      <tr
                        key={a.id || i}
                        onClick={() => open(a)}
                        className="group cursor-pointer transition-colors hover:bg-zinc-800/40"
                      >
                        <td className="max-w-xs px-6 py-4">
                          <div className="flex items-center gap-3">
                            <FileVideo className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden="true" />
                            <Link
                              to={a.id ? `/result/${a.id}` : "/result"}
                              state={{ result: a.raw }}
                              onClick={(e) => e.stopPropagation()}
                              className="truncate font-medium text-zinc-100 hover:text-violet-300"
                            >
                              {a.filename}
                            </Link>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <VerdictBadge prediction={a.prediction} />
                        </td>
                        <td className="px-6 py-4">
                          <FakeMeter value={a.fakeProb} fake={a.prediction === "FAKE"} />
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-zinc-400">{fmtDate(a.time)}</td>
                        <td className="px-6 py-4 text-right">
                          <ChevronRight className="ml-auto h-4 w-4 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-zinc-300" aria-hidden="true" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              {/* Mobile cards */}
              <ul className="mt-4 space-y-3 md:hidden">
                {visible.map((a, i) => (
                  <li key={a.id || i}>
                    <Link
                      to={a.id ? `/result/${a.id}` : "/result"}
                      state={{ result: a.raw }}
                      className="block rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-4 transition hover:border-zinc-700"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 truncate font-medium text-zinc-100">{a.filename}</p>
                        <VerdictBadge prediction={a.prediction} />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <FakeMeter value={a.fakeProb} fake={a.prediction === "FAKE"} />
                        <span className="text-xs text-zinc-500">{fmtDate(a.time, { dateStyle: "medium" })}</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      ) : null}
    </AppLayout>
  );
}
