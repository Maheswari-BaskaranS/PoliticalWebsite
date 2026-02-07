export const API_BASE_URL = (
  (import.meta.env.VITE_TMK_SERVER_URL as string | undefined) ||
  "https://tmkdev.appxes-erp.in"
).replace(/\/+$/, "");

export const apiUrl = (path: string) => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export async function apiFetch(path: string, init?: RequestInit) {
  const url = /^https?:\/\//i.test(path) ? path : apiUrl(path);
  const headers = new Headers(init?.headers || {});
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  return fetch(url, { ...init, headers });
}
