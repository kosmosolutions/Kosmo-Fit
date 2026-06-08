"use client";

import { useRef, useState } from "react";
import { Camera, Image as ImageIcon, X, Loader } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

interface ImageUploadButtonProps {
  folder: "recipes" | "daily";
  identifier: string; // recipe_id or entry_date
  onImageUrl?: (url: string) => void;
  existingUrl?: string | null;
  onRemove?: () => void;
}

export function ImageUploadButton({
  folder,
  identifier,
  onImageUrl,
  existingUrl,
  onRemove,
}: ImageUploadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  async function uploadImage(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const path = `${folder}/${user.id}/${identifier}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(path);

      setPreview(publicUrl);
      onImageUrl?.(publicUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setError(msg);
      console.error("Image upload error:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.currentTarget.files?.[0];
    if (file) uploadImage(file);
  }

  function handleRemove() {
    setPreview(null);
    onRemove?.();
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  }

  return (
    <div className="space-y-2">
      {/* Preview */}
      {preview && (
        <div className="relative overflow-hidden rounded-2xl bg-ink-800">
          <img
            src={preview}
            alt="Preview"
            className="h-32 w-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white transition hover:bg-black/70 disabled:opacity-50"
            aria-label="Remove image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={loading}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 ease-ios active:scale-[0.96]",
            preview
              ? "bg-ink-800 text-chalk-300 hover:bg-ink-700"
              : "bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30",
            loading && "opacity-50"
          )}
        >
          <Camera className="h-4 w-4" />
          <span className="hidden sm:inline">Camera</span>
        </button>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={loading}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-[13px] font-semibold transition-all duration-200 ease-ios active:scale-[0.96]",
            preview
              ? "bg-ink-800 text-chalk-300 hover:bg-ink-700"
              : "bg-accent-cyan/20 text-accent-cyan hover:bg-accent-cyan/30",
            loading && "opacity-50"
          )}
        >
          <ImageIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Upload</span>
        </button>

        {loading && (
          <div className="flex items-center gap-2 rounded-2xl bg-ink-800 px-3 py-2.5 text-[13px] font-semibold text-chalk-300">
            <Loader className="h-4 w-4 animate-spin" />
            <span className="hidden sm:inline">Uploading…</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-accent-rose/10 px-3 py-2 text-[12px] font-semibold text-accent-rose">
          {error}
        </div>
      )}

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Upload image file"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        aria-label="Capture photo with camera"
      />
    </div>
  );
}
