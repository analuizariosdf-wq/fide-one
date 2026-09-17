"use client";

import { useRef, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Upload } from "lucide-react";

import {
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  formatFileSize,
  isAllowedMimeType,
  isWithinSizeLimit,
} from "@/lib/files-utils";
import { Button } from "@/components/ui/button";

interface FileUploaderProps {
  onUpload: (file: File) => void;
  uploading: boolean;
}

export function FileUploader({ onUpload, uploading }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!isAllowedMimeType(file.type)) {
      toast.error("Tipo de arquivo não permitido.");
      return;
    }
    if (!isWithinSizeLimit(file.size)) {
      toast.error(`Arquivo maior que o limite permitido (${formatFileSize(MAX_FILE_SIZE_BYTES)}).`);
      return;
    }

    onUpload(file);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(",")}
        className="sr-only"
        onChange={handleChange}
        disabled={uploading}
        aria-label="Selecionar arquivo para enviar"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="size-3.5" />
        {uploading ? "Enviando..." : "Enviar arquivo"}
      </Button>
    </div>
  );
}
