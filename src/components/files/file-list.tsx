"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Download, File as FileIcon, FileText, Image as ImageIcon, Trash2, Video } from "lucide-react";

import { getFileSignedUrl, type FileRecord } from "@/lib/data/files";
import { formatFileSize, getFileKind } from "@/lib/files-utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

const KIND_ICON = {
  image: ImageIcon,
  video: Video,
  document: FileText,
  other: FileIcon,
} as const;

interface FileListProps {
  files: FileRecord[];
  onDelete: (file: FileRecord) => void;
}

export function FileList({ files, onDelete }: FileListProps) {
  if (files.length === 0) {
    return (
      <EmptyState
        icon={FileIcon}
        title="Nenhum arquivo anexado"
        description="Envie o primeiro arquivo para começar."
      />
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {files.map((file) => (
        <FileItem key={file.id} file={file} onDelete={onDelete} />
      ))}
    </div>
  );
}

function FileItem({ file, onDelete }: { file: FileRecord; onDelete: (file: FileRecord) => void }) {
  const [opening, setOpening] = useState(false);
  const kind = getFileKind(file.mimeType);
  const Icon = KIND_ICON[kind];

  async function handleOpen() {
    setOpening(true);
    try {
      const url = await getFileSignedUrl(file);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Não foi possível abrir o arquivo. Ele pode ter sido removido do armazenamento.");
    } finally {
      setOpening(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[13px] font-medium text-foreground">{file.name}</span>
          <span className="text-[12px] text-muted-foreground">
            {formatFileSize(file.sizeBytes)} · {new Date(file.createdAt).toLocaleDateString("pt-BR")}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Abrir ${file.name}`}
          onClick={handleOpen}
          disabled={opening}
        >
          <Download className="size-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label={`Excluir ${file.name}`} onClick={() => onDelete(file)}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  );
}
