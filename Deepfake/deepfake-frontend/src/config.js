// Backend locations. Production values live in .env.production.
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
// Legacy Node downloader, only used by the local-only Videos page.
export const DOWNLOADER_URL = import.meta.env.VITE_DOWNLOADER_URL || "http://localhost:3001";
