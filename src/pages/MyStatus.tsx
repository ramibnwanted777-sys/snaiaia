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
import { reviewCountLabel, STORAGE_KEY_PHONE, formatDate } from "@/lib/format";
import { useQuery } from "convex/react";
import { ArrowLeft, ExternalLink, Receipt, Search, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";

const SUB_TONES: Record<string, "ink" | "warn" | "danger" | "neutral"> = {
  active: "ink",
  pending: "warn",
  expired: "neutral",
  none: "neutral",
};

export default function MyStatus() {
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY_PHONE);
    if (saved) {
      setPhone(saved);
      setSubmitted(saved);
    }
  }, []);

  const result = useQuery(
    api.artisans.statusByPhone,
    submitted.length >= 6 ? { phone: submitted } : "skip",
  );

  const check = () => {
    const digits = phone.replace(/\D/g, "");
    setSubmitted(digits);
    localStorage.setItem(STORAGE_KEY_PHONE, digits);
  };

  return (
    <PageShell width="narrow">
      <header className="border-b border-border pb-7">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-foreground/25" />
          <Kicker>حالتي كمُسجَّل في الدليل</Kicker>
        </div>
        <h1 className="mt-4 text-2xl font-semibold leading-snug">
          تابع ملفك واشتراكك
        </h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          أدخل رقم الهاتف الذي سجّلت به ملفك لعرض حالة المراجعة، حالة الاشتراك، وسجل طلبات
          تأكيد الدفع. لا حاجة لكلمة سر.
        </p>
      </header>

      <section className="mt-7 rounded-lg border border-border p-5 md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <Field label="رقم الهاتف المسجّل" className="flex-1">
            <Input
              value={phone}
              dir="ltr"
              inputMode="tel"
              onChange={(event) => setPhone(event.target.value)}
              placeholder="0551234567"
              onKeyDown={(event) => {
                if (event.key === "Enter") check();
              }}
            />
          </Field>
          <Button onClick={check} className="gap-2 md:w-40">
            <Search className="size-4" />
            اعرض حالتي
          </Button>
        </div>
        <p className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          نعرض فقط المعلومات المتوفرة أصلاً في ملفك العام.
        </p>
      </section>

      {submitted.length >= 6 && result === undefined && (
        <div className="mt-8">
          <LoadingBlock label="جارٍ البحث عن ملفك…" />
        </div>
      )}

      {result === null && (
        <EmptyState
          className="mt-8"
          title="لا يوجد ملف بهذا الرقم"
          description="تأكد من الرقم أو سجّل ملفاً جديداً. إن سجّلت مسبقاً برقم آخر، استعمله لفتح ملفك."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/join">تسجيل ملف جديد</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/search">تصفح الحرفيين</Link>
              </Button>
            </div>
          }
        />
      )}

      {result && (
        <div className="mt-8 flex flex-col gap-6">
          {/* بطاقة الملف */}
          <section className="rounded-lg border border-border p-6">
            <div className="flex items-start gap-4">
              <Monogram name={result.artisan.fullName} url={result.artisan.photoUrl} className="size-16" />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold">{result.artisan.fullName}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {result.artisan.specialty} · {result.artisan.commune}، {result.artisan.wilaya}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <StatusChip
                    tone={
                      result.artisan.status === "approved"
                        ? "ink"
                        : result.artisan.status === "rejected"
                          ? "danger"
                          : "warn"
                    }
                  >
                    الملف: {ARTISAN_STATUS_LABELS[result.artisan.status]}
                  </StatusChip>
                  <StatusChip
                    tone={SUB_TONES[result.artisan.subscriptionStatus] ?? "neutral"}
                  >
                    الاشتراك: {SUBSCRIPTION_STATUS_LABELS[result.artisan.subscriptionStatus]}
                  </StatusChip>
                  {result.artisan.suspended && <StatusChip tone="danger">موقوف مؤقتاً</StatusChip>}
                </div>
              </div>
            </div>

            <div className="mt-6 border-t border-border pt-4">
              <div className="py-2">
                <Stars value={result.artisan.rating} size={16} />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {reviewCountLabel(result.artisan.ratingCount)}
                </p>
              </div>
              <DataRow
                label="الباقة الحالية"
                value={result.artisan.planName ?? "بدون اشتراك"}
              />
              <DataRow
                label="تاريخ بداية الاشتراك"
                value={
                  result.artisan.subscriptionStartedAt
                    ? formatDate(result.artisan.subscriptionStartedAt)
                    : "—"
                }
              />
              <DataRow
                label="تاريخ انتهاء الاشتراك"
                value={
                  result.artisan.subscriptionExpiresAt
                    ? formatDate(result.artisan.subscriptionExpiresAt)
                    : "—"
                }
              />
              <DataRow label="رمز المتابعة" value={result.artisan.applicationCode} />
              <DataRow label="تاريخ التسجيل" value={formatDate(result.artisan.createdAt)} />
            </div>

            {result.artisan.status === "rejected" && result.artisan.rejectionReason && (
              <p className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs leading-6 text-destructive">
                سبب الرفض: {result.artisan.rejectionReason}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="gap-2">
                <Link to={`/subscribe/${result.artisan._id}`}>
                  <Receipt className="size-4" />
                  {result.artisan.isActive ? "تجديد الاشتراك" : "تفعيل الاشتراك"}
                </Link>
              </Button>
              {result.artisan.status === "approved" && !result.artisan.suspended && (
                <Button asChild variant="outline" className="gap-2">
                  <Link to={`/artisan/${result.artisan._id}`}>
                    <ExternalLink className="size-4" />
                    عرض ملفي العام
                  </Link>
                </Button>
              )}
            </div>
          </section>

          {/* سجل الطلبات */}
          <section>
            <h3 className="text-sm font-medium">سجل طلبات الدفع</h3>
            {result.requests.length === 0 ? (
              <EmptyState
                className="mt-4"
                title="لا توجد طلبات دفع بعد"
                description="فعّل اشتراكك بالتحويل البريدي CCP وارفع صورة الإيصال، وسيظهر ملفك للزبائن بعد التأكيد."
                action={
                  <Button asChild>
                    <Link to={`/subscribe/${result.artisan._id}`}>اختر باقة</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="mt-4 rounded-lg border border-border">
                {result.requests.map((request) => (
                  <li
                    key={request._id}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 last:border-b-0"
                  >
                    <div>
                      <p className="num text-xs font-medium">
                        {request.planName} · {request.amountDZD} دج
                      </p>
                      <p className="num mt-1 text-[11px] text-muted-foreground">
                        مرجع {request.ccpReference} · {formatDate(request.createdAt)}
                      </p>
                      {request.reviewerNote && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          ملاحظة الإدارة: {request.reviewerNote}
                        </p>
                      )}
                    </div>
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
          </section>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-secondary/60 px-6 py-5">
            <p className="text-xs leading-6 text-muted-foreground">
              تريد إضافة صور أعمال جديدة أو تصحيح معلوماتك؟ تواصل مع الإدارة من لوحة التحكم.
            </p>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/search">
                <ArrowLeft className="size-3.5" />
                تصفح الدليل
              </Link>
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
