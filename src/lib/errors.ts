/** استخراج رسالة الخطأ القادمة من Convex بشكل نظيف للعرض في الواجهة */
export function cleanError(error: unknown, fallback = "حدث خطأ غير متوقع، أعد المحاولة.") {
  if (!(error instanceof Error)) return fallback;
  const match = error.message.match(/Uncaught Error: ([^\n]+)/);
  if (match?.[1]) return match[1].trim();
  const firstLine = error.message.split("\n").find((line) => line.trim().length > 0);
  return firstLine?.trim() || fallback;
}
