"use client";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { getCurrentOrganizationId } from "@/lib/data/organization";
import { buildStoragePath, isAllowedMimeType, isWithinSizeLimit, MAX_FILE_SIZE_BYTES } from "@/lib/files-utils";
import { ALLOWED_IMAGE_MIME_TYPES } from "@/lib/files-utils";
import { formatFileSize } from "@/lib/files-utils";

export interface OrganizationBrandingInput {
  displayName: string | null;
  accentColor: string | null;
}

/** Only settings.manage holders can reach here in the UI; RLS (organizations_update_admin) enforces it regardless. */
export async function updateOrganizationBranding(
  organizationId: string,
  input: OrganizationBrandingInput,
): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase
    .from("organizations")
    .update({ display_name: input.displayName || null, accent_color: input.accentColor || null })
    .eq("id", organizationId);
  if (error) throw error;
}

/**
 * Uploads to the existing public "logos" bucket (Etapa 4) — never a new
 * bucket — and writes the resulting public URL onto `organizations`.
 * "logo" and "favicon" only differ by which column gets the URL; both
 * live under the same `{organization_id}/...` prefix the bucket's RLS
 * policies already scope writes to.
 */
export async function uploadOrganizationImage(
  kind: "logo" | "favicon",
  file: File,
): Promise<string> {
  if (!isAllowedMimeType(file.type) || !ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    throw new Error("Envie um arquivo de imagem (JPEG, PNG, WEBP ou GIF).");
  }
  if (!isWithinSizeLimit(file.size)) {
    throw new Error(`Imagem maior que o limite permitido (${formatFileSize(MAX_FILE_SIZE_BYTES)}).`);
  }

  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();
  const path = buildStoragePath(organizationId, file.name, `${kind}-${crypto.randomUUID()}`);

  const { error: uploadError } = await supabase.storage
    .from("logos")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("logos").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("organizations")
    .update(kind === "logo" ? { logo_url: data.publicUrl } : { favicon_url: data.publicUrl })
    .eq("id", organizationId);

  if (updateError) {
    await supabase.storage.from("logos").remove([path]);
    throw updateError;
  }

  return data.publicUrl;
}
