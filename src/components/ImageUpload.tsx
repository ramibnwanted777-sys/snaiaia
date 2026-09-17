import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { uploadImage } from "@/lib/image";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";

export function ImageUpload({
  label,
  value,
  onChange,
  hint,
  className,
  compact = false,
}: {
  label?: string;
  value: Id<"_storage"> | null | undefined;
  onChange: (id: Id<"_storage"> | null) => void;
  hint?: string;
  className?: string;
  compact?: boolean;
}) {
  const createUploadUrl = useMutation(api.files.generateUploadUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      const storageId = await uploadImage(() => createUploadUrl({}), file);
      onChange(storageId as Id<"_storage">);
    } catch (err) {
      setPreview(null);
      setError(err instanceof Error ? err.message : "تعذّر رفع الصورة.");
    } finally {
      setBusy(false);
    }
  };

  const clear = () => {
    setPreview(null);
    setError(null);
    onChange(null);
  };

  const hasImage = Boolean(preview || value);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && <span className="text-sm font-medium">{label}</span>}
      <div
        className={cn(
          "flex items-center gap-3 rounded-md border border-dashed p-3",
          compact ? "min-h-16" : "min-h-24",
        )}
      >
        {hasImage ? (
          <img
            src={preview ?? undefined}
            alt={label ?? "صورة"}
            className={cn("rounded-md object-cover hairline border", compact ? "size-12" : "size-20")}
          />
        ) : (
          <div
            className={cn(
              "grid place-items-center rounded-md bg-secondary text-muted-foreground",
              compact ? "size-12" : "size-20",
            )}
          >
            <ImagePlus className="size-5" />
          </div>
        )}

        <div className="flex flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-1.5 text-xs font-medium transition-colors hover:bg-secondary disabled:opacity-60"
            >
              {busy && <Loader2 className="size-3.5 animate-spin" />}
              {busy ? "جارٍ الرفع…" : hasImage ? "تغيير الصورة" : "اختيار صورة"}
            </button>
            {hasImage && !busy && (
              <button
                type="button"
                onClick={clear}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-destructive"
              >
                <X className="size-3.5" />
                حذف
              </button>
            )}
          </div>
          <p className="text-[11px] leading-5 text-muted-foreground">
            {hint ?? "تُضغط الصورة تلقائياً قبل الرفع (JPG أو PNG)."}
          </p>
          {error && <p className="text-[11px] text-destructive">{error}</p>}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
