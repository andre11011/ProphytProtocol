function apiSuffix(url: string): string {
  return url.endsWith("/api") ? url : `${url.replace(/\/$/, "")}/api`;
}

export const BACKEND_URL = apiSuffix(
  process.env.API_URL || "http://localhost:8080",
);
