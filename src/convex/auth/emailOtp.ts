import { Email } from "@convex-dev/auth/providers/Email";
import axios from "axios";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

export const emailOtp = Email({
  id: "email-otp",
  maxAge: 60 * 15, // 15 minutes
  // This function can be asynchronous
  async generateVerificationToken() {
    const random: RandomReader = {
      read(bytes: Uint8Array) {
        crypto.getRandomValues(bytes);
      },
    };
    const alphabet = "0123456789";
    return generateRandomString(random, alphabet, 6);
  },
  async sendVerificationRequest({ identifier: email, token }) {
    console.log(`[AUTH OTP CODE] رمز التحقق للبريد ${email} هو: ${token}`);
    try {
      await axios.post(
        "https://auth.freebuff.app/send_otp",
        {
          to: email,
          otp: token,
          appName: process.env.VLY_APP_NAME || "دليل الصنايعية",
        },
        {
          headers: {
            "x-api-key": "fb_email_2crN1hqIArZP2bEfvjp5Qik4",
          },
        },
      );
    } catch (error: any) {
      console.warn("[AUTH OTP ERROR] تعذّر إرسال البريد عبر المزود:", error?.response?.data || error?.message || error);
      console.info(`[AUTH OTP CODE BACKUP] يمكنك استخدام هذا الرمز للدخول: ${token}`);
      throw new Error("تعذّر إرسال رمز التحقق إلى بريدك الإلكتروني. يمكنك فحص لوحة تحكم Convex لمعرفة الرمز أو المحاولة مجدداً.");
    }
  },
});
