"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  removeEntityFile,
  uploadEntityFile,
  useEntityFiles,
  type FileEntityType,
  type FileRecord,
} from "@/lib/data/files";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FileUploader } from "@/components/files/file-uploader";
import { FileList } from "@/components/files/file-list";

interface EntityFilesPanelProps {
  entityType: FileEntityType;
  entityId: string;
}

/** Drop-in "Arquivos"/"Mídia" section for Conteúdo/Cliente/Projeto detail
 * pages — wires useEntityFiles + FileUploader + FileList + delete confirm
 * so each page doesn't reimplement upload/list/delete on its own. */
export function EntityFilesPanel({ entityType, entityId }: EntityFilesPanelProps) {
  const { files, loading, error, refetch } = useEntityFiles(entityType, entityId);
  const [uploading, setUploading] = useState(false);
  const [deletingFile, setDeletingFile] = useState<FileRecord | null>(null);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      await uploadEntityFile(entityType, entityId, file);
      toast.success("Arquivo enviado com sucesso.");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível enviar o arquivo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deletingFile) return;
    try {
      await removeEntityFile(deletingFile);
      toast.success("Arquivo excluído.");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível excluir o arquivo.");
    } finally {
      setDeletingFile(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <FileUploader onUpload={handleUpload} uploading={uploading} />

      {error ? (
        <ErrorState description={error} onRetry={refetch} />
      ) : loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <FileList files={files} onDelete={setDeletingFile} />
      )}

      <ConfirmDialog
        open={Boolean(deletingFile)}
        onOpenChange={(open) => !open && setDeletingFile(null)}
        title="Excluir arquivo"
        description={`Tem certeza que deseja excluir "${deletingFile?.name}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
