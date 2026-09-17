/**
 * ضغط الصور في المتصفح قبل الرفع: يقلّل حجم البيانات كثيراً
 * حتى يبقى التطبيق عملياً على شبكة إنترنت ضعيفة.
 */
export async function compressImage(
  file: File,
  maxSize = 1280,
  quality = 0.72,
): Promise<Blob> {
  if (!file.type.startsWith("image/") || typeof createImageBitmap !== "function") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

/** يرفع صورة إلى تخزين Convex ويعيد معرّف الملف */
export async function uploadImage(
  createUploadUrl: () => Promise<string>,
  file: File,
): Promise<string> {
  const blob = await compressImage(file);
  const uploadUrl = await createUploadUrl();
  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": blob.type || "image/jpeg" },
    body: blob,
  });
  if (!response.ok) throw new Error("تعذّر رفع الصورة، تحقّق من اتصالك وأعد المحاولة.");
  const payload = (await response.json()) as { storageId?: string };
  if (!payload.storageId) throw new Error("لم يُرجع الخادم معرّف الصورة.");
  return payload.storageId;
}
