/**
 * Builds a standalone, print-ready HTML report for one analysis result.
 * Everything shown comes from the result object; nothing is invented.
 */

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const isNum = (v) => v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v));
const num = (v, digits = 1, suffix = "") => (isNum(v) ? `${Number(v).toFixed(digits)}${suffix}` : "—");
const clampPct = (v) => Math.min(Math.max(Number(v) || 0, 0), 100);

function formatDuration(seconds) {
  if (!isNum(seconds)) return "—";
  const s = Number(seconds);
  if (s < 60) return `${s.toFixed(1)} s`;
  return `${Math.floor(s / 60)} min ${Math.round(s % 60)} s`;
}

function formatDate(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" });
}

/** Ring showing fake probability, with a tick at the detection threshold. */
function scoreRing(fakeProb, threshold, color) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = clampPct(fakeProb);
  let tick = "";
  if (isNum(threshold)) {
    const a = (Number(threshold) / 100) * 2 * Math.PI;
    const p = (radius) => [(70 + radius * Math.cos(a)).toFixed(2), (70 + radius * Math.sin(a)).toFixed(2)];
    const [x1, y1] = p(r - 10);
    const [x2, y2] = p(r + 10);
    tick = `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#d97706" stroke-width="2.5" stroke-linecap="round"/>`;
  }
  return `
    <svg class="ring" viewBox="0 0 140 140" role="img" aria-label="Fake probability ${num(fakeProb, 1)} percent">
      <g transform="rotate(-90 70 70)">
        <circle cx="70" cy="70" r="${r}" fill="none" stroke="#e7e5ee" stroke-width="11"/>
        <circle cx="70" cy="70" r="${r}" fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round"
          stroke-dasharray="${((pct / 100) * c).toFixed(2)} ${c.toFixed(2)}"/>
        ${tick}
      </g>
      <text x="70" y="70" text-anchor="middle" class="ring-value">${num(fakeProb, 1)}%</text>
      <text x="70" y="89" text-anchor="middle" class="ring-label">fake probability</text>
    </svg>`;
}

function probabilityBar(label, value, color, threshold) {
  const marker = isNum(threshold)
    ? `<span class="bar-marker" style="left:${clampPct(threshold)}%" title="Detection threshold"></span>`
    : "";
  return `
    <div class="bar-row">
      <div class="bar-head"><span>${label}</span><strong>${num(value, 2)}%</strong></div>
      <div class="bar-track">
        <span class="bar-fill" style="width:${clampPct(value)}%;background:${color}"></span>
        ${marker}
      </div>
    </div>`;
}

export const generateHTMLReport = (result, confidence, realProb, fakeProb, threshold) => {
  const fake = String(result.prediction).toUpperCase() === "FAKE";
  const info = result.video_info || {};
  const hasThreshold = isNum(threshold);

  const tone = fake
    ? { main: "#e11d48", soft: "#fff1f2", ink: "#9f1239", border: "#fecdd3" }
    : { main: "#059669", soft: "#ecfdf5", ink: "#065f46", border: "#a7f3d0" };

  const verdictLabel = fake ? "Likely deepfake" : "Likely authentic";
  const headline = fake ? "This video shows signs of manipulation" : "No signs of manipulation found";
  const comparison = hasThreshold
    ? fake
      ? `, at or above the ${num(threshold, 0)}% detection threshold`
      : `, below the ${num(threshold, 0)}% detection threshold`
    : "";

  const coverage =
    isNum(info.frames_analyzed) && isNum(info.total_frames) && Number(info.total_frames) > 0
      ? `${((Number(info.frames_analyzed) / Number(info.total_frames)) * 100).toFixed(1)}% of all frames`
      : null;

  const safeId = String(result.id || Date.now()).replace(/[^\w-]/g, "");
  const filename = escapeHtml(result.filename || "Untitled video");
  const model = escapeHtml(result.model_version || "Xception + BiLSTM");
  const generatedAt = formatDate(new Date());

  const details = [
    ["File size", isNum(result.file_size_mb) ? `${num(result.file_size_mb, 2)} MB` : "—"],
    ["Duration", formatDuration(info.duration)],
    ["Frame rate", isNum(info.fps) ? `${num(info.fps, 2)} fps` : "—"],
    ["Total frames", isNum(info.total_frames) ? String(info.total_frames) : "—"],
    [
      "Frames analyzed",
      isNum(info.frames_analyzed) ? `${info.frames_analyzed}${coverage ? ` <span class="muted">(${coverage})</span>` : ""}` : "—",
    ],
    ["Analyzed on", formatDate(result.timestamp)],
    ["Processing time", isNum(result.processing_time_ms) ? formatDuration(result.processing_time_ms / 1000) : "—"],
  ];

  const stats = [
    ["Fake probability", `${num(fakeProb, 1)}%`, hasThreshold ? `Threshold ${num(threshold, 0)}%` : ""],
    ["Confidence", `${num(confidence, 1)}%`, `in the “${fake ? "fake" : "real"}” verdict`],
    ["Frames analyzed", isNum(info.frames_analyzed) ? String(info.frames_analyzed) : "—", isNum(info.total_frames) ? `of ${info.total_frames}` : ""],
    ["Duration", formatDuration(info.duration), isNum(info.fps) ? `${num(info.fps, 0)} fps` : ""],
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DeepScan report · ${filename}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
  <style>
    :root {
      --ink: #18181b; --ink-2: #3f3f46; --muted: #71717a; --line: #e4e4e7; --surface: #fafafa;
      --accent: #7c3aed; --tone: ${tone.main}; --tone-soft: ${tone.soft}; --tone-ink: ${tone.ink}; --tone-border: ${tone.border};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      background: #f4f4f5; color: var(--ink); font-size: 14px; line-height: 1.55;
      -webkit-font-smoothing: antialiased;
    }
    .mono { font-family: "JetBrains Mono", ui-monospace, Consolas, monospace; }
    .muted { color: var(--muted); font-weight: 400; }

    /* Toolbar (screen only) */
    .toolbar {
      position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between;
      gap: 12px; padding: 12px 24px; background: rgba(255,255,255,.85); backdrop-filter: blur(10px);
      border-bottom: 1px solid var(--line);
    }
    .toolbar-title { font-weight: 600; font-size: 13px; color: var(--ink-2); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .toolbar-actions { display: flex; gap: 8px; flex-shrink: 0; }
    .btn {
      font: inherit; font-size: 13px; font-weight: 500; border-radius: 8px; padding: 8px 14px; cursor: pointer;
      border: 1px solid var(--line); background: #fff; color: var(--ink);
    }
    .btn:hover { background: #f4f4f5; }
    .btn-primary { background: var(--accent); border-color: var(--accent); color: #fff; }
    .btn-primary:hover { background: #6d28d9; }
    .btn:disabled { opacity: .6; cursor: progress; }

    /* Page */
    .page {
      max-width: 820px; margin: 32px auto; background: #fff; border: 1px solid var(--line);
      border-radius: 16px; box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 12px 32px rgba(0,0,0,.06); overflow: hidden;
    }
    .doc-head {
      display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;
      padding: 32px 40px 24px; border-bottom: 1px solid var(--line);
    }
    .brand { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 15px; }
    .brand-mark {
      width: 30px; height: 30px; border-radius: 8px; background: var(--accent);
      display: grid; place-items: center;
    }
    .doc-title { margin-top: 18px; font-size: 22px; font-weight: 600; letter-spacing: -0.01em; }
    .doc-meta { text-align: right; font-size: 12px; color: var(--muted); line-height: 1.7; }
    .doc-meta strong { color: var(--ink-2); font-weight: 500; }

    section { padding: 28px 40px; border-bottom: 1px solid var(--line); break-inside: avoid; page-break-inside: avoid; }
    section:last-of-type { border-bottom: 0; }
    h2 {
      font-size: 11px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: var(--muted);
      margin-bottom: 16px;
    }

    /* Verdict */
    .verdict {
      display: flex; align-items: center; justify-content: space-between; gap: 28px;
      background: var(--tone-soft); border: 1px solid var(--tone-border); border-left: 5px solid var(--tone);
      border-radius: 14px; padding: 24px 28px;
    }
    .badge {
      display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; color: var(--tone-ink);
      background: #fff; border: 1px solid var(--tone-border); border-radius: 999px; padding: 3px 10px;
    }
    .badge::before { content: ""; width: 6px; height: 6px; border-radius: 50%; background: var(--tone); }
    .verdict h1 { margin-top: 12px; font-size: 24px; line-height: 1.25; font-weight: 700; letter-spacing: -0.02em; color: var(--ink); }
    .verdict p { margin-top: 8px; color: var(--ink-2); max-width: 460px; }
    .ring { width: 150px; height: 150px; flex-shrink: 0; }
    .ring-value { font: 700 20px Inter, system-ui, sans-serif; fill: var(--ink); }
    .ring-label { font: 500 9.5px Inter, system-ui, sans-serif; fill: var(--muted); }

    /* Stats */
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .stat { border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; background: var(--surface); }
    .stat-label { font-size: 12px; color: var(--muted); }
    .stat-value { margin-top: 6px; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; font-variant-numeric: tabular-nums; }
    .stat-sub { margin-top: 2px; font-size: 11px; color: var(--muted); }

    /* Bars */
    .bar-row + .bar-row { margin-top: 18px; }
    .bar-head { display: flex; justify-content: space-between; font-size: 13px; color: var(--ink-2); margin-bottom: 8px; }
    .bar-head strong { color: var(--ink); font-variant-numeric: tabular-nums; }
    .bar-track { position: relative; height: 10px; border-radius: 999px; background: #f0eff4; }
    .bar-fill { display: block; height: 100%; border-radius: 999px; }
    .bar-marker { position: absolute; top: -4px; width: 2px; height: 18px; border-radius: 2px; background: #d97706; transform: translateX(-1px); }
    .legend { margin-top: 16px; display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--muted); }
    .legend i { width: 2px; height: 12px; background: #d97706; border-radius: 2px; }

    /* Details */
    dl { display: grid; grid-template-columns: 1fr 1fr; column-gap: 32px; }
    .row { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid #f0f0f2; }
    dt { color: var(--muted); flex-shrink: 0; }
    dd { min-width: 0; font-weight: 500; text-align: right; overflow-wrap: anywhere; }
    .row-wide { grid-column: 1 / -1; }

    /* Method + notes */
    .method { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .step { border: 1px solid var(--line); border-radius: 12px; padding: 16px; }
    .step-num { font-size: 11px; color: var(--accent); font-weight: 600; }
    .step h3 { margin-top: 6px; font-size: 14px; font-weight: 600; }
    .step p { margin-top: 4px; font-size: 12.5px; color: var(--ink-2); }
    .model-line { margin-top: 14px; font-size: 12.5px; color: var(--muted); }
    .notes { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 18px 20px; color: #78350f; }
    .notes ul { margin: 0; padding-left: 18px; }
    .notes li + li { margin-top: 6px; }

    .doc-foot {
      display: flex; justify-content: space-between; gap: 16px; flex-wrap: wrap;
      padding: 18px 40px; background: var(--surface); border-top: 1px solid var(--line); font-size: 11.5px; color: var(--muted);
    }

    @media (max-width: 720px) {
      .page { margin: 0; border-radius: 0; border-left: 0; border-right: 0; }
      .doc-head, section, .doc-foot { padding-left: 20px; padding-right: 20px; }
      .doc-head { flex-direction: column; }
      .doc-meta { text-align: left; }
      .verdict { flex-direction: column-reverse; align-items: flex-start; }
      .stats { grid-template-columns: 1fr 1fr; }
      dl, .method { grid-template-columns: 1fr; }
      .toolbar { padding: 10px 16px; }
      .toolbar-title { display: none; }
    }

    @page { size: A4; margin: 12mm; }
    @media print {
      body { background: #fff; font-size: 12.5px; }
      .toolbar { display: none; }
      .page { margin: 0; max-width: none; border: 0; border-radius: 0; box-shadow: none; }
      .doc-head, section, .doc-foot { padding-left: 4px; padding-right: 4px; }
      section { padding-top: 18px; padding-bottom: 18px; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <span class="toolbar-title">Report · ${filename}</span>
    <div class="toolbar-actions">
      <button class="btn" onclick="window.print()">Print</button>
      <button class="btn btn-primary" id="pdf-btn" onclick="downloadPDF()">Download PDF</button>
      <button class="btn" onclick="window.close()">Close</button>
    </div>
  </div>

  <main class="page" id="report">
    <header class="doc-head">
      <div>
        <div class="brand">
          <span class="brand-mark">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>
            </svg>
          </span>
          DeepScan
        </div>
        <h1 class="doc-title">Video authenticity report</h1>
      </div>
      <div class="doc-meta">
        <div>Result ID <strong class="mono">${escapeHtml(safeId)}</strong></div>
        <div>Analyzed <strong>${formatDate(result.timestamp)}</strong></div>
        <div>Generated <strong>${generatedAt}</strong></div>
      </div>
    </header>

    <section>
      <div class="verdict">
        <div>
          <span class="badge">${verdictLabel}</span>
          <h1>${headline}</h1>
          <p>The model rated <strong>${filename}</strong> ${num(fakeProb, 1)}% likely to be fake${comparison}.</p>
        </div>
        ${scoreRing(fakeProb, hasThreshold ? threshold : null, tone.main)}
      </div>
    </section>

    <section>
      <h2>Key figures</h2>
      <div class="stats">
        ${stats
          .map(
            ([label, value, sub]) => `
          <div class="stat">
            <div class="stat-label">${label}</div>
            <div class="stat-value">${value}</div>
            ${sub ? `<div class="stat-sub">${sub}</div>` : ""}
          </div>`
          )
          .join("")}
      </div>
    </section>

    <section>
      <h2>Probability breakdown</h2>
      ${probabilityBar("Real", realProb, "#059669")}
      ${probabilityBar("Fake", fakeProb, "#e11d48", hasThreshold ? threshold : null)}
      ${
        hasThreshold
          ? `<div class="legend"><i></i>Videos at or above ${num(threshold, 0)}% fake probability are flagged as deepfakes.</div>`
          : ""
      }
    </section>

    <section>
      <h2>Video details</h2>
      <dl>
        <div class="row row-wide"><dt>File name</dt><dd>${filename}</dd></div>
        ${details.map(([term, value]) => `<div class="row"><dt>${term}</dt><dd>${value}</dd></div>`).join("")}
      </dl>
    </section>

    <section>
      <h2>How the video was analyzed</h2>
      <div class="method">
        <div class="step">
          <div class="step-num">01</div>
          <h3>Sample frames</h3>
          <p>Frames were taken at even intervals across the whole clip.</p>
        </div>
        <div class="step">
          <div class="step-num">02</div>
          <h3>Extract features</h3>
          <p>An Xception network turned each frame into a visual fingerprint.</p>
        </div>
        <div class="step">
          <div class="step-num">03</div>
          <h3>Check consistency</h3>
          <p>A bidirectional LSTM compared the frames over time and produced the score.</p>
        </div>
      </div>
      <p class="model-line">Model <strong>${model}</strong>${hasThreshold ? ` · detection threshold ${num(threshold, 0)}%` : ""}</p>
    </section>

    <section>
      <h2>How to read this report</h2>
      <div class="notes">
        <ul>
          <li>The score is a probability from an AI model, not proof that a video is real or fake.</li>
          <li>The model can be wrong in both directions. Authentic videos are sometimes flagged, and some deepfakes are missed.</li>
          <li>Low resolution, heavy compression, or no visible faces make the result less reliable.</li>
          <li>For legal, journalistic or security decisions, confirm the result with other forensic methods and a human expert.</li>
        </ul>
      </div>
    </section>

    <footer class="doc-foot">
      <span>Generated by DeepScan · ${generatedAt}</span>
      <span class="mono">${escapeHtml(safeId)}</span>
    </footer>
  </main>

  <script>
    function downloadPDF() {
      var btn = document.getElementById("pdf-btn");
      if (typeof html2pdf === "undefined") { window.print(); return; }
      btn.disabled = true; btn.textContent = "Preparing…";
      html2pdf()
        .set({
          margin: [8, 8, 8, 8],
          filename: "deepscan-report-${safeId}.pdf",
          image: { type: "jpeg", quality: 0.96 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] }
        })
        .from(document.getElementById("report"))
        .save()
        .then(function () { btn.disabled = false; btn.textContent = "Download PDF"; });
    }
  </script>
</body>
</html>`;
};
