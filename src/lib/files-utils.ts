/**
 * Pure, framework-free helpers for the Arquivos/Storage feature (Fase 5.7).
 * No Supabase import here on purpose — this is what gets exercised by a
 * plain Node script when the project has no test runner (see the Fase 5.7
 * report for how these were verified).
 */

export const ALLOWED_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ALLOWED_VIDEO_MIME_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/zip",
];

/** Allowlist, not a denylist — an extension alone never grants access. */
export const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  ...ALLOWED_VIDEO_MIME_TYPES,
  ...ALLOWED_DOCUMENT_MIME_TYPES,
];

/**
 * No limit was documented anywhere in the project before this phase, and
 * the buckets themselves have no `file_size_limit` configured (see the
 * Etapa 4 storage migration). This is a single, deliberately conservative,
 * centralized ceiling — comfortably under Supabase Storage's own 50MB
 * default project-wide cap — rather than a per-component magic number.
 * Change it here only.
 */
export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export type FileKind = "image" | "video" | "document" | "other";

export function getFileKind(mimeType: string | null | undefined): FileKind {
  if (!mimeType) return "other";
  if (ALLOWED_IMAGE_MIME_TYPES.includes(mimeType)) return "image";
  if (ALLOWED_VIDEO_MIME_TYPES.includes(mimeType)) return "video";
  if (ALLOWED_DOCUMENT_MIME_TYPES.includes(mimeType)) return "document";
  return "other";
}

export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

export function isWithinSizeLimit(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE_BYTES;
}

const EXTENSION_PATTERN = /^[a-z0-9]{1,10}$/;

/** Only ever used to pick a display-safe suffix — never trusted for MIME. */
export function sanitizeExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1 || dotIndex === fileName.length - 1) return "";
  const ext = fileName.slice(dotIndex + 1).toLowerCase();
  return EXTENSION_PATTERN.test(ext) ? ext : "";
}

/**
 * `{organization_id}/{random-id}.{ext}` — the org segment is what every
 * storage.objects policy checks (see 20260915215812_storage.sql), and it
 * always comes from the authenticated session server-side, never from the
 * browser. The random id (not the original filename) rules out collision,
 * overwrite and path-injection from a crafted name; the original name is
 * preserved only as files.name metadata, never as part of the path.
 */
export function buildStoragePath(
  organizationId: string,
  fileName: string,
  id: string = crypto.randomUUID(),
): string {
  const ext = sanitizeExtension(fileName);
  return ext ? `${organizationId}/${id}.${ext}` : `${organizationId}/${id}`;
}

export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) return "—";

  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${unitIndex === 0 ? value : value.toFixed(1)} ${units[unitIndex]}`;
}
