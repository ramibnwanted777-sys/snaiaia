import {
  DataRow,
  EmptyState,
  Field,
  Kicker,
  LoadingBlock,
  Monogram,
  StatusChip,
  Stars,
} from "@/components/kit";
import { PageShell } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/convex/_generated/api";
import {
  ARTISAN_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/convex/data";
import { cleanError } from "@/lib/errors";
import { formatDate, formatDZD, reviewCountLabel } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  BadgeCheck,
  Check,
  CircleDashed,
  Clock,
  ExternalLink,
  Loader2,
  Receipt,
  Search,
  ShieldAlert,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

const SUB_TONES: Record<string, "ink" | "warn" | "danger" | "neutral"> = {
  active: "ink",
  pending: "warn",
  expired: "neutral",
  none: "neutral",
};

function LinkProfilePanel() {
  const linkProfile = useMutation(api.artisans.linkProfile);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await linkProfile({ phone, applicationCode: code });
    } catch (linkError) {
      setError(cleanError(linkError, "تعذّر ربط الملف، تحقق من المعلومات."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="rounded-lg border border-border p-6 md:p-7">
        <h2 className="text-sm font-medium">ربط حسابك بملفك الحرفي</h2>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          إن كنت مسجّلاً في الدليل من قبل، أدخل رقم هاتفك ورمز المتابعة الذي ظهر لك بعد
          التسجيل. بمجرد الربط يمكنك متابعة الاشتراك وطلبات الدفع من هنا.
        </p>

        <div className="mt-6 flex flex-col gap-5">
          <Field label="رقم الهاتف المسجّل" required>
            <Input
              value={phone}
              dir="ltr"
              inputMode="tel"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="0551234567"
              disabled={busy}
            />
          </Field>

          <Field
            label="رمز المتابعة"
            required
            hint="رمز من 6 أحرف ظهر لك بعد التسجيل (تجدده عند الإدارة إن فقدته)."
          >
            <Input
              value={code}
              dir="ltr"
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="U7DYQC"
              maxLength={8}
              disabled={busy}
            />
          </Field>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
              {error}
            </p>
          )}

          <Button onClick={submit} disabled={busy} className="gap-2 self-start">
            {busy && <Loader2 className="size-4 animate-spin" />}
            ربط الملف بحسابي
          </Button>
        </div>
      </section>

      <section className="flex flex-col justify-between rounded-lg border border-border p-6 md:p-7">
        <div>
          <h2 className="text-sm font-medium">لا يوجد لديك ملف بعد؟</h2>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            سجّل ملفك في ثلاث خطوات: معلوماتك، صور أعمالك، ثم اختيار باقة الاشتراك. يظهر ملفك
            للزبائن بعد مراجعة الإدارة وتأكيد الدفع.
          </p>
          <ul className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
            {[
              "ملف شخصي مع صور «قبل/بعد»",
              "رقم هاتفك ظاهر بزر اتصال مباشر",
              "تقييمات الزبائن ترفع ترتيبك",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[11px] leading-6">
                <Check className="mt-1 size-3.5 shrink-0 text-muted-foreground" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Button asChild className="gap-2">
            <Link to="/join">
              <UserPlus className="size-4" />
              تسجيل ملف حرفي
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/me">
              <Search className="size-4" />
              البحث برقم الهاتف
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

export default function ArtisanAccount() {
  const workspace = useQuery(api.artisans.myWorkspace, {});

  if (workspace === undefined) {
    return (
      <PageShell width="narrow">
        <LoadingBlock label="جارٍ تحميل ملفك الحرفي…" />
      </PageShell>
    );
  }

  if (workspace === null) {
    return (
      <PageShell>
        <header className="border-b border-border pb-8">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-foreground/25" />
            <Kicker>حساب الحرفي</Kicker>
          </div>
          <h1 className="mt-4 text-2xl font-semibold md:text-3xl">لا يوجد ملف مرتبط بحسابك</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
            هذا الحساب ليس مرتبطاً بأي ملف حرفي. يمكنك ربط ملف مسجّل مسبقاً برقم هاتفك ورمز
            المتابعة، أو تسجيل ملف جديد من الصفر.
          </p>
        </header>
        <LinkProfilePanel />
      </PageShell>
    );
  }

  const artisan = workspace.artisan;
  const isAutoSuspended = (artisan as any).autoSuspended || (artisan as any).isExpired;
  const published = artisan.status === "approved" && !artisan.suspended && !isAutoSuspended;

  return (
    <PageShell>
      {artisan.suspended && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/10 p-5 text-destructive">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="size-4" />
            <span>تم توقيف ملفك من قبل الإدارة</span>
          </div>
          <p className="mt-2 text-xs leading-6 text-foreground">
            تم توقيف ملفك لانتهاك بنود وقوانين الاستخدام الخاصة بالمنصة. ملفك لا يظهر للزبائن حالياً.
          </p>
          <div className="mt-3">
            <Link to="/terms" className="text-xs underline hover:text-foreground">
              الاطلاع على بنود وقوانين التطبيق
            </Link>
          </div>
        </div>
      )}

      {isAutoSuspended && !artisan.suspended && (
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-5 text-amber-900 dark:text-amber-200">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="size-4" />
              <span>تم توقيف الملف تلقائياً لانتهاء مدة الباقة</span>
            </div>
            <Button asChild size="sm" className="h-8 gap-1.5 shadow-none">
              <Link to={`/subscribe/${artisan._id}`}>
                <Receipt className="size-3.5" />
                تجديد الباقة الآن
              </Link>
            </Button>
          </div>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            وفقاً لقوانين التطبيق، يتوقف ظهور ملفك في نتائج البحث والخريطة فور انتهاء مدة الاشتراك.
            قم بتجديد اشتراكك لتفعيل ظهور ملفك فوراً للزبائن مجدداً.
          </p>
        </div>
      )}

      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
        <div className="flex items-start gap-5">
          <Monogram name={artisan.fullName} url={artisan.photoUrl} className="size-16" />
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-foreground/25" />
              <Kicker>حساب الحرفي</Kicker>
            </div>
            <h1 className="mt-3 text-2xl font-semibold">{artisan.fullName}</h1>
            <p className="mt-2 text-xs text-muted-foreground">
              {artisan.specialty} · {artisan.commune}، {artisan.wilaya}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StatusChip
                tone={
                  artisan.status === "approved"
                    ? "ink"
                    : artisan.status === "rejected"
                      ? "danger"
                      : "warn"
                }
              >
                الملف: {ARTISAN_STATUS_LABELS[artisan.status]}
              </StatusChip>
              <StatusChip tone={SUB_TONES[artisan.subscriptionStatus] ?? "neutral"}>
                الاشتراك: {SUBSCRIPTION_STATUS_LABELS[artisan.subscriptionStatus]}
              </StatusChip>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild className="gap-2">
            <Link to={`/subscribe/${artisan._id}`}>
              <Receipt className="size-4" />
              {artisan.isActive ? "تجديد الاشتراك" : "تفعيل الاشتراك"}
            </Link>
          </Button>
          {published && (
            <Button asChild variant="outline" className="gap-2">
              <Link to={`/artisan/${artisan._id}`}>
                <ExternalLink className="size-4" />
                ملفي العام
              </Link>
            </Button>
          )}
        </div>
      </header>

      {/* حالة الظهور في البحث */}
      <section className="mt-8 rounded-lg border border-border p-6">
        <h2 className="text-sm font-medium">ظهورك في نتائج البحث</h2>
        <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
          ليظهر ملفك للزبائن ويُقبل الاتصال بك، يجب توفر الشرطين معاً.
        </p>
        <ul className="mt-5 grid gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2">
          {[
            {
              label: "ملف مقبول من الإدارة",
              done: artisan.status === "approved" && !artisan.suspended,
              hint:
                artisan.status === "rejected"
                  ? artisan.rejectionReason ?? "الملف مرفوض، صحّح المعلومات وأعد الإرسال."
                  : "راجع الإدارة معلوماتك وصورك قبل النشر.",
            },
            {
              label: "اشتراك فعّال",
              done: artisan.isActive,
              hint: artisan.subscriptionStatus === "pending"
                ? "إيصال الدفع في انتظار تأكيد الإدارة (عادة أقل من 24 ساعة)."
                : artisan.subscriptionExpiresAt
                  ? `آخر اشتراك انتهى في ${formatDate(artisan.subscriptionExpiresAt)}.`
                  : "لم تُرسل إيصال دفع بعد.",
            },
          ].map((item) => (
            <li key={item.label} className="flex items-start gap-3 bg-background p-5">
              <span
                className={
                  item.done
                    ? "grid size-6 shrink-0 place-items-center rounded-full bg-foreground text-background"
                    : "grid size-6 shrink-0 place-items-center rounded-full border border-border text-muted-foreground"
                }
              >
                {item.done ? <Check className="size-3.5" /> : <X className="size-3.5" />}
              </span>
              <span>
                <span className="block text-xs font-medium">{item.label}</span>
                <span className="mt-1 block text-[11px] leading-6 text-muted-foreground">
                  {item.hint}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.85fr]">
        {/* بيانات الملف */}
        <section className="rounded-lg border border-border p-6">
          <h2 className="text-sm font-medium">بيانات ملفك</h2>
          <div className="mt-4">
            <DataRow label="التخصص" value={artisan.specialty} />
            <DataRow label="الموقع" value={`${artisan.commune}، ${artisan.wilaya}`} />
            <DataRow
              label="رقم الهاتف الظاهر"
              value={<span dir="ltr">{artisan.phone}</span>}
            />
            <DataRow label="رمز المتابعة" value={artisan.applicationCode} />
            <DataRow label="الباقة" value={artisan.planName ?? "بدون اشتراك"} />
            <DataRow
              label="تاريخ بداية الاشتراك"
              value={artisan.subscriptionStartedAt ? formatDate(artisan.subscriptionStartedAt) : "—"}
            />
            <DataRow
              label="تاريخ انتهاء الاشتراك"
              value={artisan.subscriptionExpiresAt ? formatDate(artisan.subscriptionExpiresAt) : "—"}
            />
            <DataRow label="تاريخ التسجيل" value={formatDate(artisan.createdAt)} />
          </div>
          <p className="mt-4 flex items-start gap-2 text-[11px] leading-6 text-muted-foreground">
            <CircleDashed className="mt-1 size-3.5 shrink-0" />
            لتعديل معلوماتك أو إضافة صور أعمال جديدة، تواصل مع الإدارة — التعديل الذاتي قيد
            التطوير.
          </p>
        </section>

        {/* التقييمات والطلبات */}
        <div className="flex flex-col gap-8">
          <section className="rounded-lg border border-border p-6">
            <h2 className="text-sm font-medium">تقييمات الزبائن</h2>
            <div className="mt-4 flex items-center justify-between gap-4">
              <div>
                <p className="num text-2xl font-semibold">
                  {artisan.ratingCount ? artisan.rating.toFixed(1) : "—"}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {reviewCountLabel(artisan.ratingCount)}
                </p>
              </div>
              <Stars value={artisan.rating} size={16} />
            </div>
            {artisan.ratingCount > 0 && (
              <p className="mt-4 border-t border-border pt-4 text-[11px] leading-6 text-muted-foreground">
                تُحذف التقييمات المزيفة من طرف الإدارة، ما يعيد حساب معدّلك تلقائياً.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-border p-6">
            <h2 className="text-sm font-medium">طلبات الدفع</h2>
            {workspace.requests.length === 0 ? (
              <p className="mt-3 text-[11px] leading-6 text-muted-foreground">
                لا توجد طلبات بعد. أرسل إيصال تحويل CCP لتفعيل اشتراكك.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {workspace.requests.slice(0, 4).map((request) => (
                  <li
                    key={request._id}
                    className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3 last:border-b-0 last:pb-0"
                  >
                    <span>
                      <span className="num block text-xs font-medium">
                        {request.planName} · {formatDZD(request.amountDZD)}
                      </span>
                      <span className="num mt-1 block text-[11px] text-muted-foreground">
                        {request.ccpReference} · {formatDate(request.createdAt)}
                      </span>
                    </span>
                    <StatusChip
                      tone={
                        request.status === "approved"
                          ? "ink"
                          : request.status === "rejected"
                            ? "danger"
                            : "warn"
                      }
                    >
                      {REQUEST_STATUS_LABELS[request.status]}
                    </StatusChip>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" size="sm" className="mt-5 gap-2">
              <Link to={`/subscribe/${artisan._id}`}>
                <BadgeCheck className="size-3.5" />
                إدارة الاشتراك والإيصالات
              </Link>
            </Button>
          </section>
        </div>
      </div>
    </PageShell>
  );
}
