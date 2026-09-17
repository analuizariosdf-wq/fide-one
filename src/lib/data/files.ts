"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import { getCurrentOrganizationId } from "@/lib/data/organization";
import {
  buildStoragePath,
  formatFileSize,
  isAllowedMimeType,
  isWithinSizeLimit,
  MAX_FILE_SIZE_BYTES,
} from "@/lib/files-utils";
import type { Tables, TablesInsert } from "@/lib/supabase/database.types";

/**
 * Only the entities whose bucket already exists (see the Etapa 4 storage
 * migration: logos, client-files, project-files, content-media). `files`
 * also has a `task_id` column, but there is no `task-files` bucket, so
 * Tarefas is deliberately left out this phase — see project-status.md.
 */
export type FileEntityType = "client" | "project" | "content";

const ENTITY_CONFIG: Record<
  FileEntityType,
  { bucket: string; column: "client_id" | "project_id" | "content_id"; table: "clients" | "projects" | "contents" }
> = {
  client: { bucket: "client-files", column: "client_id", table: "clients" },
  project: { bucket: "project-files", column: "project_id", table: "projects" },
  content: { bucket: "content-media", column: "content_id", table: "contents" },
};

export interface FileRecord {
  id: string;
  name: string;
  path: string;
  bucket: string;
  sizeBytes: number | null;
  mimeType: string | null;
  uploadedBy: string | null;
  createdAt: string;
}

function mapRow(row: Tables<"files">): FileRecord {
  return {
    id: row.id,
    name: row.name,
    path: row.path,
    bucket: row.bucket,
    sizeBytes: row.size_bytes,
    mimeType: row.mime_type,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  };
}

/** Same reasoning as the equivalent asserts in tasks.ts/contents.ts/calendar.ts. */
async function assertEntityBelongsToOrg(entityType: FileEntityType, entityId: string): Promise<void> {
  const { table } = ENTITY_CONFIG[entityType];
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.from(table).select("id").eq("id", entityId).maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Entidade inválida para esta organização.");
}

async function loadEntityFiles(entityType: FileEntityType, entityId: string): Promise<FileRecord[]> {
  const { column } = ENTITY_CONFIG[entityType];
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("files")
    .select("*")
    .eq(column, entityId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export function useEntityFiles(entityType: FileEntityType, entityId: string) {
  const [files, setFiles] = useState<FileRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFiles(await loadEntityFiles(entityType, entityId));
    } catch {
      setError("Não foi possível carregar os arquivos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    let active = true;

    loadEntityFiles(entityType, entityId)
      .then((data) => {
        if (active) setFiles(data);
      })
      .catch(() => {
        if (active) setError("Não foi possível carregar os arquivos. Tente novamente.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [entityType, entityId]);

  return { files, loading, error, refetch };
}

/**
 * Storage upload → files insert. If the insert fails after a successful
 * upload, the object is removed instead of left orphaned — `files` is the
 * only source of truth the UI reads from, so an object with no row would
 * be permanently invisible/unmanageable through the app otherwise.
 */
export async function uploadEntityFile(
  entityType: FileEntityType,
  entityId: string,
  file: File,
): Promise<FileRecord> {
  if (!file) throw new Error("Selecione um arquivo.");
  if (!isAllowedMimeType(file.type)) {
    throw new Error("Tipo de arquivo não permitido.");
  }
  if (!isWithinSizeLimit(file.size)) {
    throw new Error(`Arquivo maior que o limite permitido (${formatFileSize(MAX_FILE_SIZE_BYTES)}).`);
  }

  await assertEntityBelongsToOrg(entityType, entityId);

  const supabase = createSupabaseClient();
  const organizationId = await getCurrentOrganizationId();
  const { bucket, column } = ENTITY_CONFIG[entityType];
  const path = buildStoragePath(organizationId, file.name);

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payload: TablesInsert<"files"> = {
    organization_id: organizationId,
    bucket,
    path,
    name: file.name,
    size_bytes: file.size,
    mime_type: file.type,
    uploaded_by: user?.id ?? null,
  };
  payload[column] = entityId;

  const { data, error: insertError } = await supabase
    .from("files")
    .insert(payload)
    .select("*")
    .single();

  if (insertError || !data) {
    await supabase.storage.from(bucket).remove([path]);
    throw insertError ?? new Error("Falha ao registrar o arquivo.");
  }

  return mapRow(data);
}

/**
 * Deletion always starts from a file_id the caller already has because it
 * came from useEntityFiles() (RLS-scoped) — never from a client-supplied
 * storage path. Storage object is removed first; if the metadata delete
 * then fails, the object is already gone but the row survives, so the UI
 * gets a clear, actionable error instead of a silent inconsistency.
 */
export async function removeEntityFile(file: FileRecord): Promise<void> {
  const supabase = createSupabaseClient();

  const { error: storageError } = await supabase.storage.from(file.bucket).remove([file.path]);
  if (storageError) throw storageError;

  const { error: deleteError } = await supabase.from("files").delete().eq("id", file.id);
  if (deleteError) {
    throw new Error(
      "O arquivo foi removido do armazenamento, mas não foi possível apagar o registro. Atualize a página e tente novamente.",
    );
  }
}

/**
 * Buckets stay private; nothing this app writes is a permanent public URL.
 * A signed URL is generated on demand, used immediately, and never stored.
 */
export async function getFileSignedUrl(file: FileRecord, expiresInSeconds = 60): Promise<string> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.storage.from(file.bucket).createSignedUrl(file.path, expiresInSeconds);
  if (error || !data) throw error ?? new Error("Não foi possível gerar o link do arquivo.");
  return data.signedUrl;
}
