import { mutation } from "./_generated/server";

/**
 * يمنح رابطاً مؤقتاً لرفع صورة (صورة شخصية، صورة عمل، إيصال CCP) إلى مخزن الملفات.
 * الصور تُضغط في المتصفح قبل الرفع لتبقى سريعة على الشبكات الضعيفة.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});
