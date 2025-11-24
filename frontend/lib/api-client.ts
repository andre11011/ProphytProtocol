import { siteConfig } from "@/config/site";

const DEFAULT_API_URL = `${siteConfig.url}/api`;

const API_BASE_URL = DEFAULT_API_URL;

function buildUrl(
  base: string,
  path: string,
  params?: Record<string, string | number>,
) {
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const baseWithSlash = base.endsWith("/") ? base : `${base}/`;
  const url = new URL(normalizedPath, baseWithSlash);

  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      url.searchParams.append(key, String(value)),
    );
  }

  return url.toString();
}

export const apiClient = {
  async get<T>(
    path: string,
    params?: Record<string, string | number>,
  ): Promise<T> {
    const url = buildUrl(API_BASE_URL, path, params);
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${response.statusText}`);
    }

    return response.json();
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const url = buildUrl(API_BASE_URL, path);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${response.statusText}`);
    }

    return response.json();
  },

  async put<T>(path: string, body?: unknown): Promise<T> {
    const url = buildUrl(API_BASE_URL, path);
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API Error (${response.status}): ${response.statusText}`);
    }

    return response.json();
  },
};
