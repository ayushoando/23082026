import fs from "node:fs/promises";
import path from "node:path";
import { listR2ObjectKeys } from "@/lib/storage/r2Catalog";

/**
 * /clients/ stills: R2 first, disk only if the list is empty.
 * Public URLs stay /assets/marketing/… (worker serves those from R2).
 * Disk dirs: marketing/clients, then legacy projects. Next cwd may be repo root or site/.
 */
export function projectFolderCandidates(folder: string): string[] {
  const segments = [
    ["public", "assets", "marketing", "clients", folder],
    ["site", "public", "assets", "marketing", "clients", folder],
    // legacy locations (pre-clients tree)
    ["public", "assets", "marketing", "projects", folder],
    ["site", "public", "assets", "marketing", "projects", folder],
    ["public", "images", "projects", folder],
    ["site", "public", "images", "projects", folder],
  ] as const;
  return segments.map((parts) => path.join(process.cwd(), ...parts));
}

/** Public URL for a file found under clients or projects. */
function clientWorkPhotoWebPath(folder: string, name: string, folderPath: string): string {
  const normalized = folderPath.replace(/\\/g, "/");
  const underClients = /\/assets\/marketing\/clients\//i.test(normalized);
  const base = underClients
    ? `/assets/marketing/clients/${folder}`
    : `/assets/marketing/projects/${folder}`;
  return encodeURI(`${base}/${name}`);
}

/** Filenames omitted from clients-page case mosaics (may still be used in catalog). */
const CLIENT_WORK_PHOTO_EXCLUDES: Partial<Record<string, readonly string[]>> = {
  DMRC: ["dmrc-facility.webp"],
};

/** Prefer folder-specific hero stills; generic `hero.webp` is often a placeholder still. */
function rankClientWorkPhoto(name: string): number {
  const lower = name.toLowerCase();
  if (lower !== "hero.webp" && lower.includes("hero")) {return 0;}
  if (lower.includes("gallery")) {return 1;}
  if (lower.includes("office") || lower.includes("workspace")) {return 2;}
  if (/^dsc_/i.test(name)) {return 3;}
  if (lower === "hero.webp") {return 5;}
  return 4;
}

function sortClientWorkPhotoNames(names: string[]): string[] {
  return [...names].sort(
    (left, right) => rankClientWorkPhoto(left) - rankClientWorkPhoto(right) || left.localeCompare(right),
  );
}

/** Generic hero stills are often placeholders — prefer folder-specific *-hero* / gallery shots. */
const GLOBAL_CLIENT_WORK_PHOTO_EXCLUDES = new Set(["hero.webp"]);

function isExcludedClientWorkPhoto(name: string, folder: string): boolean {
  const lower = name.toLowerCase();
  if (GLOBAL_CLIENT_WORK_PHOTO_EXCLUDES.has(lower)) {return true;}
  if (/ai-editor|edit this/i.test(name)) {return true;}
  const folderExcludes = CLIENT_WORK_PHOTO_EXCLUDES[folder] ?? [];
  return folderExcludes.some((entry) => entry.toLowerCase() === lower);
}

function r2KeyToPublicUrl(key: string): string {
  const trimmed = key.replace(/^\/+/, "");
  if (trimmed.startsWith("assets/")) {
    return `/${trimmed}`;
  }
  return `/assets/${trimmed}`;
}

const CLIENT_R2_PREFIXES = (folder: string): string[] => [
  `assets/marketing/clients/${folder}/`,
  `marketing/clients/${folder}/`,
  `assets/marketing/projects/${folder}/`,
  `marketing/projects/${folder}/`,
];

async function getClientWorkPhotosFromR2(folder: string): Promise<string[]> {
  for (const prefix of CLIENT_R2_PREFIXES(folder)) {
    const keys = await listR2ObjectKeys(prefix);
    const names = keys
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefix.length))
      .filter((name) => name && !name.includes("/"))
      .filter((name) => /\.(webp|jpg|jpeg|png)$/i.test(name))
      .filter((name) => !isExcludedClientWorkPhoto(name, folder));
    const ranked = sortClientWorkPhotoNames(names);
    if (ranked.length > 0) {
      return ranked.map((name) => encodeURI(r2KeyToPublicUrl(`${prefix}${name}`)));
    }
  }
  return [];
}

async function getClientWorkPhotosFromDisk(folder: string): Promise<string[]> {
  for (const folderPath of projectFolderCandidates(folder)) {
    try {
      const names = await fs.readdir(folderPath);
      const photos = sortClientWorkPhotoNames(
        names
          .filter((name) => /\.(webp|jpg|jpeg|png)$/i.test(name))
          .filter((name) => !isExcludedClientWorkPhoto(name, folder)),
      ).map((name) => clientWorkPhotoWebPath(folder, name, folderPath));
      if (photos.length > 0) {
        return photos;
      }
    } catch {
      /* try next candidate */
    }
  }
  return [];
}

export async function getClientWorkPhotos(folder: string): Promise<string[]> {
  const fromR2 = await getClientWorkPhotosFromR2(folder);
  if (fromR2.length > 0) {
    return fromR2;
  }
  return getClientWorkPhotosFromDisk(folder);
}

export async function buildClientWorkWithPhotos<T extends { folder: string }>(
  items: readonly T[],
): Promise<Array<T & { photos: string[] }>> {
  const withPhotos = await Promise.all(
    items.map(async (item) => ({
      ...item,
      photos: await getClientWorkPhotos(item.folder),
    })),
  );
  return withPhotos.filter((item) => item.photos.length >= 1);
}
