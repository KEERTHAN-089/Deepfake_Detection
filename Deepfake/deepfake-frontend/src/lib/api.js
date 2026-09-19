import axios from "axios";
import { auth } from "../firebase";
import { API_URL } from "../config";

async function authHeaders() {
  const user = auth.currentUser;
  if (!user) return {};
  return { Authorization: `Bearer ${await user.getIdToken()}` };
}

/** Turns an axios error into a message for the UI. Returns null for user cancellations. */
export function errorMessage(err, fallback = "Something went wrong. Please try again.") {
  if (axios.isCancel(err) || err?.code === "ERR_CANCELED") return null;
  if (err?.code === "ERR_NETWORK") {
    return "Can't reach the analysis server. It may be starting up, so try again in a minute.";
  }
  const data = err?.response?.data;
  const detail = typeof data?.detail === "string" ? data.detail : null;
  return detail || data?.error || err?.message || fallback;
}

function ensureSuccess(data) {
  if (!data || data.success === false || !data.prediction) {
    throw new Error(data?.error || "The analysis did not return a result.");
  }
  return data;
}

// Signed-in users' results are saved to their history by the server.
export async function analyzeFile(file, { onUploadProgress, signal } = {}) {
  const form = new FormData();
  form.append("file", file, file.name);
  const { data } = await axios.post(`${API_URL}/analyze`, form, {
    signal,
    headers: await authHeaders(),
    onUploadProgress: (e) => {
      if (e.total) onUploadProgress?.(Math.round((e.loaded * 100) / e.total));
    },
  });
  return ensureSuccess(data);
}

export async function analyzeUrl(url, { signal } = {}) {
  const { data } = await axios.post(`${API_URL}/analyze-url`, { url }, { signal, headers: await authHeaders() });
  return ensureSuccess(data);
}

export async function fetchHistory() {
  const { data } = await axios.get(`${API_URL}/history`, { headers: await authHeaders() });
  return data?.results || [];
}

export async function fetchResult(id) {
  const { data } = await axios.get(`${API_URL}/result/${encodeURIComponent(id)}`, {
    headers: await authHeaders(),
  });
  return data;
}
