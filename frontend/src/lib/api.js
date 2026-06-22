import axios from "axios";

// Use same-origin for API calls. The platform ingress routes `/api` on whatever
// domain the app is served from to the backend, so same-origin keeps cookies
// first-party and avoids cross-domain CORS (the ingress returns
// `Access-Control-Allow-Origin: *` which browsers reject with credentials).
// Falls back to REACT_APP_BACKEND_URL for non-browser/SSR contexts.
const ORIGIN =
  typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : process.env.REACT_APP_BACKEND_URL;

export const api = axios.create({
  baseURL: `${ORIGIN}/api`,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}

export function apiError(e) {
  return formatApiErrorDetail(e?.response?.data?.detail) || e?.message || "Error";
}
