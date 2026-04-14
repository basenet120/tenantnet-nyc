"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { IMAGE_LIMITS } from "@/lib/constants";
import { useI18n } from "./i18n-provider";

interface ImageUploadProps {
  maxImages: number;
  onImagesChange: (urls: string[]) => void;
}

export function ImageUpload({ maxImages, onImagesChange }: ImageUploadProps) {
  const { t } = useI18n();
  const [urls, setUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = maxImages - urls.length;
    const toUpload = Array.from(files).slice(0, remaining);

    for (const file of toUpload) {
      if (!IMAGE_LIMITS.acceptedTypes.includes(file.type)) {
        alert(t("upload_invalid_type"));
        return;
      }
      if (file.size > IMAGE_LIMITS.maxSizeBytes) {
        alert(t("upload_too_large"));
        return;
      }
    }

    setUploading(true);

    try {
      const newUrls: string[] = [];

      for (const file of toUpload) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await res.json();
        newUrls.push(data.url);
      }

      const updated = [...urls, ...newUrls];
      setUrls(updated);
      onImagesChange(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("upload_failed"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function removeImage(index: number) {
    const updated = urls.filter((_, i) => i !== index);
    setUrls(updated);
    onImagesChange(updated);
  }

  return (
    <div>
      {urls.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-3">
          {urls.map((url, i) => (
            <div key={url} className="relative">
              <img
                src={url}
                alt={`Upload ${i + 1}`}
                className="h-24 w-24 rounded-none border-2 border-border object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute -top-2 -end-2 flex h-6 w-6 items-center justify-center rounded-none bg-danger text-[0.625rem] font-bold text-offwhite hover:bg-[#a33535] transition-colors"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {urls.length < maxImages && (
        <label className="btn btn-outline rounded-none cursor-pointer text-[0.75rem]">
          {uploading ? t("upload_uploading") : t("upload_add")}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={uploading}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
}
