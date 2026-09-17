import { useCallback, useState } from "react";

const STORAGE_KEY = "dalil.adminToken";

/**
 * رمز جلسة الإدارة المحفوظ في المتصفح.
 * يُمنح فقط بعد تسجيل دخول ناجح باسم المستخدم وكلمة المرور.
 */
export function useAdminSession() {
  const [token, setTokenState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  const setToken = useCallback((value: string | null) => {
    try {
      if (value) localStorage.setItem(STORAGE_KEY, value);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // تجاهل أخطاء التخزين المحلي (وضع التصفح الخاص مثلاً)
    }
    setTokenState(value);
  }, []);

  return { token, setToken };
}
