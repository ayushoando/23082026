import { SITE_URL } from "@/lib/siteUrl";

export interface IndexNowPayload {
  host: string;
  key: string;
  keyLocation?: string;
  urlList: string[];
}

export interface IndexNowResult {
  ok: boolean;
  status: number;
  message: string;
  submittedCount: number;
}

export const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
export const DEFAULT_INDEXNOW_KEY = process.env.INDEXNOW_KEY || "oando-indexnow-key";

/**
 * Validates and normalizes URLs for IndexNow submission.
 * Ensures all URLs are absolute HTTPS URLs matching the target host.
 */
export function sanitizeIndexNowUrls(urls: string[], host: string): string[] {
  const normalizedHost = host.toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const valid = new Set<string>();

  for (const raw of urls) {
    if (typeof raw !== "string") continue;
    const trimmed = raw.trim();
    if (!trimmed.startsWith("/") && !trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      continue;
    }
    try {
      const parsed = new URL(trimmed, `https://${normalizedHost}`);
      if (parsed.hostname.toLowerCase() === normalizedHost) {
        // Enforce trailing slash for directory paths if Next.js trailingSlash: true
        let pathname = parsed.pathname;
        if (!pathname.endsWith("/") && !pathname.includes(".")) {
          pathname = `${pathname}/`;
        }
        valid.add(`https://${normalizedHost}${pathname}`);
      }
    } catch {
      // Ignore malformed URLs
    }
  }

  return [...valid].slice(0, 10000); // IndexNow limit: 10k URLs per request
}

/**
 * Submits a list of modified/published URLs to the IndexNow protocol.
 */
export async function submitToIndexNow(
  urls: string[],
  options?: {
    host?: string;
    key?: string;
    keyLocation?: string;
    endpoint?: string;
    dryRun?: boolean;
  },
): Promise<IndexNowResult> {
  const host = options?.host || new URL(SITE_URL).hostname;
  const key = options?.key || DEFAULT_INDEXNOW_KEY;
  const keyLocation = options?.keyLocation || `https://${host}/${key}.txt`;
  const endpoint = options?.endpoint || INDEXNOW_ENDPOINT;
  const dryRun = options?.dryRun ?? false;

  const validUrls = sanitizeIndexNowUrls(urls, host);

  if (validUrls.length === 0) {
    return {
      ok: false,
      status: 400,
      message: "No valid URLs provided for IndexNow submission.",
      submittedCount: 0,
    };
  }

  const payload: IndexNowPayload = {
    host,
    key,
    keyLocation,
    urlList: validUrls,
  };

  if (dryRun) {
    return {
      ok: true,
      status: 200,
      message: `[Dry Run] Successfully prepared ${validUrls.length} URLs for IndexNow dispatch.`,
      submittedCount: validUrls.length,
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "User-Agent": "Oando-IndexNow-Client/1.0",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.status === 202 || response.status === 200) {
      return {
        ok: true,
        status: response.status,
        message: `Successfully submitted ${validUrls.length} URLs to IndexNow.`,
        submittedCount: validUrls.length,
      };
    }

    return {
      ok: false,
      status: response.status,
      message: `IndexNow submission returned HTTP ${response.status}: ${response.statusText}`,
      submittedCount: 0,
    };
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      status: 500,
      message: `IndexNow network error: ${errMessage}`,
      submittedCount: 0,
    };
  }
}
