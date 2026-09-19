import React, { useCallback, useEffect, useState } from "react";
import { Download, FolderOpen, Play, RefreshCw, Trash2, X } from "lucide-react";
import { AppLayout } from "../components/Layout";
import { Alert, Button, Card, EmptyState, PageHeader, Skeleton } from "../components/ui";
import { DOWNLOADER_URL } from "../config";
import { fmtDate } from "../lib/format";

// Note: these endpoints are not implemented by node-downloader/index.js yet.
const videoUrl = (kind, filename) => `${DOWNLOADER_URL}/videos/${kind}/${encodeURIComponent(filename)}`;

export default function Videos() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(null);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${DOWNLOADER_URL}/videos`);
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || "Failed to fetch videos");
      setVideos(data.videos);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  useEffect(() => {
    if (!playing) return undefined;
    const onKey = (e) => e.key === "Escape" && setPlaying(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [playing]);

  async function deleteVideo(filename) {
    if (!window.confirm(`Delete ${filename}?`)) return;
    try {
      const response = await fetch(`${DOWNLOADER_URL}/videos/${encodeURIComponent(filename)}`, { method: "DELETE" });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to delete video");
      setVideos((list) => list.filter((v) => v.filename !== filename));
    } catch (err) {
      setError(err.message);
    }
  }

  const totalMb = videos.reduce((sum, v) => sum + (parseFloat(v.size) || 0), 0);

  return (
    <AppLayout>
      <PageHeader
        title="Downloaded videos"
        description={`${videos.length} videos · ${totalMb.toFixed(1)} MB stored on the server`}
        actions={
          <Button variant="secondary" onClick={fetchVideos} loading={loading}>
            {!loading && <RefreshCw className="h-4 w-4" aria-hidden="true" />}
            Refresh
          </Button>
        }
      />

      {error && <Alert className="mb-6">{error}</Alert>}

      {loading ? (
        <Card className="space-y-4 p-6">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </Card>
      ) : videos.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No downloaded videos"
          description="Videos fetched from links will appear here."
          action={<Button to="/">Analyze a video</Button>}
        />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th scope="col" className="px-6 py-3 font-medium">File</th>
                <th scope="col" className="px-6 py-3 font-medium">Size</th>
                <th scope="col" className="px-6 py-3 font-medium">Created</th>
                <th scope="col" className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/80">
              {videos.map((v) => (
                <tr key={v.filename}>
                  <td className="max-w-xs truncate px-6 py-4 font-medium text-zinc-100">{v.filename}</td>
                  <td className="px-6 py-4 text-zinc-400">{v.size}</td>
                  <td className="px-6 py-4 text-zinc-400">{fmtDate(v.created)}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setPlaying(v.filename)} aria-label={`Play ${v.filename}`}>
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => window.open(videoUrl("download", v.filename), "_blank")}
                        aria-label={`Download ${v.filename}`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                        onClick={() => deleteVideo(v.filename)}
                        aria-label={`Delete ${v.filename}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {playing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setPlaying(null)}
          role="dialog"
          aria-modal="true"
          aria-label={playing}
        >
          <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-4">
              <p className="truncate text-sm text-zinc-300">{playing}</p>
              <Button variant="secondary" size="sm" onClick={() => setPlaying(null)}>
                <X className="h-4 w-4" aria-hidden="true" /> Close
              </Button>
            </div>
            <video
              controls
              autoPlay
              src={videoUrl("stream", playing)}
              className="max-h-[80vh] w-full rounded-xl bg-black shadow-2xl"
            />
          </div>
        </div>
      )}
    </AppLayout>
  );
}
