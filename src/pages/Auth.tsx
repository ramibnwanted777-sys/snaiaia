import { Kicker } from "@/components/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { cleanError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Heart,
  Loader2,
  LockKeyhole,
  Mail,
  Star,
  UserX,
  Wrench,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";

export type AccountRole = "customer" | "artisan";

interface AuthProps {
  redirectAfterAuth?: string;
  initialRole?: AccountRole;
}

const ROLES: {
  id: AccountRole;
  title: string;
  body: string;
  perks: string[];
  redirect: string;
}[] = [
  {
    id: "customer",
    title: "حساب زبون",
    body: "للباحثين عن حرفي في حيّهم.",
    perks: ["حفظ الحرفيين في المفضلة", "سجل تقييماتك السابقة", "متابعة من اتصلت بهم"],
    redirect: "/dashboard",
  },
  {
    id: "artisan",
    title: "حساب حرفي",
    body: "لأصحاب الصنعة المسجّلين في الدليل.",
    perks: ["ربط ملفك بحسابك", "متابعة الاشتراك وإيصالات الدفع", "تقييمات الزبائن على ملفك"],
    redirect: "/my",
  },
];

function resolveRedirect(returnTo: string | null, fallback: string) {
  if (returnTo?.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return fallback;
}

function Auth({ redirectAfterAuth, initialRole = "customer" }: AuthProps) {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const setAccountType = useMutation(api.accounts.setAccountType);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const roleParam = searchParams.get("role");
  const returnTo = searchParams.get("returnTo");
  const roleFromUrl = roleParam === "artisan" || roleParam === "customer";
  // المسارات المحمية مثل /my تخصّ الحرفي، فنستنتج نوع الحساب من مسار العودة
  const artisanFromReturnTo = Boolean(returnTo?.startsWith("/my"));

  const [role, setRole] = useState<AccountRole>(
    roleFromUrl ? (roleParam as AccountRole) : artisanFromReturnTo ? "artisan" : initialRole,
  );
  const [step, setStep] = useState<"credentials" | { email: string }>("credentials");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authTimedOut, setAuthTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAuthTimedOut(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const fallback =
    roleFromUrl || artisanFromReturnTo
      ? ROLES.find((item) => item.id === role)!.redirect
      : (redirectAfterAuth ?? ROLES.find((item) => item.id === role)!.redirect);
  const redirect = resolveRedirect(returnTo, fallback);

  /** حفظ نوع الحساب على المستخدم — لا نُفشل الدخول إن تعذّر الحفظ */
  const persistAccountType = async (value: AccountRole) => {
    try {
      await setAccountType({ accountType: value });
    } catch (saveError) {
      console.warn("[auth] تعذّر حفظ نوع الحساب:", saveError);
    }
  };

  // مسجّل الدخول: تُحذف استمارة الدخول كلياً ونحوّله إلى حسابه مباشرة
  if (!authLoading && isAuthenticated) {
    return <Navigate to={redirect} replace />;
  }

  // أثناء التحقق لا نعرض استمارة الدخول أبداً (تجنّب ظهورها لمن هو مسجّل)
  if (authLoading && !authTimedOut) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (submitError) {
      setError(cleanError(submitError, "تعذّر إرسال رمز التحقق. أعد المحاولة."));
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      await persistAccountType(role);
      navigate(redirect);
    } catch (verifyError) {
      setError(cleanError(verifyError, "رمز التحقق غير صحيح. أعد المحاولة."));
      setIsLoading(false);
      setOtp("");
    }
  };

  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await signIn("anonymous");
      await persistAccountType("customer");
      navigate(redirect);
    } catch (guestError) {
      setError(cleanError(guestError, "تعذّر الدخول بدون حساب."));
      setIsLoading(false);
    }
  };

  const activeRole = ROLES.find((item) => item.id === role)!;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-1 items-center px-5 py-12 md:px-8">
        <div className="grid w-full gap-10 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          {/* تعريف الحسابات */}
          <div>
            <Link to="/" className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-md bg-foreground text-background">
                <Wrench className="size-4" />
              </span>
              <span className="text-sm font-semibold">دليل الصنايعية</span>
            </Link>

            <div className="mt-10 flex items-center gap-3">
              <span className="h-px w-8 bg-foreground/25" />
              <Kicker>اختر نوع الحساب</Kicker>
            </div>
            <h1 className="mt-4 text-2xl font-semibold leading-snug md:text-3xl">
              تسجيل الدخول — زبون أو حرفي
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-muted-foreground">
              البحث عن حرفي يبقى متاحاً للجميع بدون حساب. أمّا الحساب فيمنحك الحفظ والمتابعة:
              الزبون يحفظ الحرفيين ويتابع تقييماته، والحرفي يربط ملفه ويتابع اشتراكه.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {ROLES.map((item) => {
                const Icon = item.id === "customer" ? Heart : BadgeCheck;
                const selected = item.id === role;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id)}
                    className={cn(
                      "flex flex-col gap-4 rounded-lg border p-5 text-start transition-colors",
                      selected
                        ? "border-foreground/40 bg-secondary/50"
                        : "border-border hover:border-foreground/25",
                    )}
                  >
                    <span className="flex items-center justify-between">
                      <Icon className="size-4 text-muted-foreground" />
                      <span
                        className={cn(
                          "grid size-5 place-items-center rounded-full border",
                          selected ? "border-foreground bg-foreground text-background" : "border-input",
                        )}
                      >
                        {selected && <Check className="size-3" />}
                      </span>
                    </span>
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-[11px] leading-6 text-muted-foreground">{item.body}</span>
                    <span className="mt-1 flex flex-col gap-2 border-t border-border pt-4">
                      {item.perks.map((perk) => (
                        <span key={perk} className="flex items-start gap-2 text-[11px] leading-5">
                          <Star className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                          {perk}
                        </span>
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* الاستمارة */}
          <div className="rounded-lg border border-border p-6 md:p-8">
            {step === "credentials" ? (
              <>
                <Kicker>{activeRole.title}</Kicker>
                <h2 className="mt-3 text-xl font-semibold">
                  {role === "artisan" ? "دخول الحرفي" : "دخول الزبون"}
                </h2>
                <p className="mt-3 text-xs leading-6 text-muted-foreground">
                  أدخل بريدك الإلكتروني ونتحقق منه برمز من 6 أرقام. أول دخول ينشئ حسابك
                  تلقائياً — بلا كلمة مرور.
                </p>

                <form onSubmit={handleEmailSubmit} className="mt-6">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Mail className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        name="email"
                        placeholder="name@example.com"
                        type="email"
                        className="ps-9"
                        disabled={isLoading}
                        required
                        dir="ltr"
                      />
                    </div>
                    <Button type="submit" variant="outline" size="icon" disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ArrowLeft className="size-4" />
                      )}
                    </Button>
                  </div>

                  {error && (
                    <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                      {error}
                    </p>
                  )}

                  {role === "customer" && (
                    <>
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-background px-3 text-[11px] text-muted-foreground">
                            أو
                          </span>
                        </div>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={handleGuestLogin}
                        disabled={isLoading}
                      >
                        <UserX className="size-4" />
                        متابعة بدون حساب
                      </Button>
                      <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
                        بدون حساب يمكنك البحث والتقييم، لكن المفضلة وسجل تقييماتك يحتاجان
                        تسجيل الدخول.
                      </p>
                    </>
                  )}

                  {role === "artisan" && (
                    <p className="mt-6 rounded-md bg-secondary/70 px-4 py-3 text-[11px] leading-6 text-muted-foreground">
                      بعد الدخول ستربط حسابك بملفك الحرفي برقم هاتفك ورمز المتابعة، أو تسجّل
                      ملفاً جديداً إن لم يكن لديك ملف.
                    </p>
                  )}
                </form>


              </>
            ) : (
              <>
                <Kicker>تأكيد الدخول</Kicker>
                <h2 className="mt-3 text-xl font-semibold">تحقّق من بريدك</h2>
                <p className="mt-3 text-xs leading-6 text-muted-foreground">
                  أرسلنا رمزاً من 6 أرقام إلى <span dir="ltr">{step.email}</span>
                </p>

                <form onSubmit={handleOtpSubmit} className="mt-6">
                  <input type="hidden" name="email" value={step.email} />
                  <input type="hidden" name="code" value={otp} />

                  {/* الرمز يُعرض من اليسار لليمين حتى لا يُقلب ترتيب الأرقام */}
                  <div className="flex justify-center" dir="ltr">
                    <InputOTP
                      value={otp}
                      onChange={setOtp}
                      maxLength={6}
                      disabled={isLoading}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && otp.length === 6 && !isLoading) {
                          const form = (event.target as HTMLElement).closest("form");
                          if (form) form.requestSubmit();
                        }
                      }}
                    >
                      <InputOTPGroup>
                        {Array.from({ length: 6 }).map((_, index) => (
                          <InputOTPSlot key={index} index={index} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  {error && (
                    <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-center text-xs text-destructive">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    className="mt-6 w-full gap-2"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        جارٍ التحقق…
                      </>
                    ) : (
                      <>
                        تأكيد الرمز وفتح {activeRole.title}
                        <ArrowLeft className="size-4" />
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-2 w-full"
                    onClick={() => setStep("credentials")}
                    disabled={isLoading}
                  >
                    استعمال بريد آخر
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}
