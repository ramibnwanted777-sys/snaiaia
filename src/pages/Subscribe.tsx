import { ImageUpload } from "@/components/ImageUpload";
import { CopyRow, EmptyState, Field, Kicker, LoadingBlock, StatusChip } from "@/components/kit";
import { PageShell } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  ARTISAN_STATUS_LABELS,
  CCP_INFO,
  PAYMENT_NOTE,
  PLANS,
  REQUEST_STATUS_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
} from "@/convex/data";
import { cn } from "@/lib/utils";
import { formatDate, formatDZD, formatNumber } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Clock,
  Loader2,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";

const SUB_TONES: Record<string, "ink" | "warn" | "danger" | "neutral"> = {
  active: "ink",
  pending: "warn",
  expired: "neutral",
  none: "neutral",
};

export default function Subscribe() {
  const { artisanId = "" } = useParams();
  const validId = artisanId.length >= 16;
  const workspace = useQuery(
    api.artisans.workspace,
    validId ? { artisanId: artisanId as Id<"artisans"> } : "skip",
  );
  const submitSubscription = useMutation(api.artisans.submitSubscription);

  const [planId, setPlanId] = useState<string>("premium");
  const [payerName, setPayerName] = useState("");
  const [ccpReference, setCcpReference] = useState("");
  const [paidAt, setPaidAt] = useState("");
  const [receiptId, setReceiptId] = useState<Id<"_storage"> | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const plan = PLANS.find((item) => item.id === planId);

  const submit = async () => {
    setError(null);
    if (payerName.trim().length < 3) {
      setError("اكتب اسم الدافع كما يظهر في الإيصال.");
      return;
    }
    if (ccpReference.trim().length < 3) {
      setError("اكتب رقم الوصل أو مرجع التحويل.");
      return;
    }
    if (!receiptId) {
      setError("ارفع صورة إيصال التحويل لتأكيد الدفع.");
      return;
    }

    setBusy(true);
    try {
      await submitSubscription({
        artisanId: artisanId as Id<"artisans">,
        planId,
        payerName: payerName.trim(),
        ccpReference: ccpReference.trim(),
        paidAt: paidAt || undefined,
        receiptId,
        note: note.trim() || undefined,
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إرسال الطلب، أعد المحاولة.");
    } finally {
      setBusy(false);
    }
  };

  if (!validId || workspace === null) {
    return (
      <PageShell width="narrow">
        <EmptyState
          title="ملف غير موجود"
          description="تعذّر العثور على ملف الحرفي. سجّل من جديد أو تابع برقم هاتفك من صفحة «حالتي»."
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/join">تسجيل حرفي جديد</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/me">صفحة حالتي</Link>
              </Button>
            </div>
          }
        />
      </PageShell>
    );
  }

  if (workspace === undefined) {
    return (
      <PageShell width="narrow">
        <LoadingBlock label="جارٍ تحميل بيانات الملف…" />
      </PageShell>
    );
  }

  const artisan = workspace.artisan;
  const pendingRequest = workspace.requests.find((request) => request.status === "pending");

  return (
    <PageShell width="narrow">
      <Link
        to="/me"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowRight className="size-3.5" />
        رجوع إلى حالتي
      </Link>

      <header className="mt-6 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-foreground/25" />
          <Kicker>اشتراك الحرفي</Kicker>
        </div>
        <h1 className="mt-4 text-2xl font-semibold leading-snug">{artisan.fullName}</h1>
        <p className="mt-2 text-xs text-muted-foreground">
          {artisan.specialty} · {artisan.commune}، {artisan.wilaya}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusChip tone={artisan.status === "approved" ? "ink" : artisan.status === "rejected" ? "danger" : "warn"}>
            الملف: {ARTISAN_STATUS_LABELS[artisan.status]}
          </StatusChip>
          <StatusChip tone={SUB_TONES[artisan.subscriptionStatus] ?? "neutral"}>
            الاشتراك: {SUBSCRIPTION_STATUS_LABELS[artisan.subscriptionStatus]}
          </StatusChip>
          {artisan.isActive && artisan.subscriptionExpiresAt && (
            <StatusChip tone="ink" showDot={false}>
              ينتهي في {formatDate(artisan.subscriptionExpiresAt)}
            </StatusChip>
          )}
        </div>
      </header>

      {artisan.status === "rejected" && (
        <p className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs leading-6 text-destructive">
          ملفك مرفوض من الإدارة{artisan.rejectionReason ? `: ${artisan.rejectionReason}` : "."} —
          تواصل مع الدعم بعد تصحيح المعلومات.
        </p>
      )}

      {/* حالة قيد المراجعة */}
      {(sent || pendingRequest || artisan.subscriptionStatus === "pending") && (
        <div className="mt-8 rounded-lg border border-foreground/20 p-6">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">طلبك قيد المراجعة اليدوية</p>
              <p className="mt-2 text-xs leading-7 text-muted-foreground">
                استلمنا إيصال التحويل، وتتحقق الإدارة من وصول المبلغ إلى الحساب البريدي قبل
                تفعيل الاشتراك. المدة المعتادة: أقل من 24 ساعة عمل.
              </p>
              {pendingRequest && (
                <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="num">
                    الباقة: <span className="font-medium text-foreground">{pendingRequest.planName}</span>
                  </span>
                  <span className="num">
                    المبلغ: <span className="font-medium text-foreground">{formatDZD(pendingRequest.amountDZD)}</span>
                  </span>
                  <span className="num" dir="ltr">
                    مرجع: {pendingRequest.ccpReference}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* الباقات */}
      <section className="mt-10">
        <h2 className="text-sm font-medium">
          {artisan.isActive ? "تجديد أو تغيير الباقة" : "اختر الباقة المناسبة"}
        </h2>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          يمكنك تغيير الباقة في أي وقت. الباقة المميزة والسنوية تمنحك الترتيب أولاً في نتائج
          البحث وشارة «مميز».
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {PLANS.map((item) => {
            const selected = item.id === planId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPlanId(item.id)}
                className={cn(
                  "flex flex-col gap-3 rounded-lg border p-5 text-start transition-colors",
                  selected ? "border-foreground/40 bg-secondary/50" : "border-border hover:border-foreground/25",
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-3">
                    <span
                      className={cn(
                        "grid size-4 place-items-center rounded-full border",
                        selected ? "border-foreground bg-foreground text-background" : "border-input",
                      )}
                    >
                      {selected && <Check className="size-2.5" />}
                    </span>
                    <span className="text-sm font-medium">{item.name}</span>
                    {item.badge && (
                      <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] text-background">
                        {item.badge}
                      </span>
                    )}
                  </span>
                  <span className="num text-sm font-semibold">
                    {formatDZD(item.priceDZD)}
                    <span className="ms-1 text-[11px] font-normal text-muted-foreground">
                      / {item.periodLabel}
                    </span>
                  </span>
                </div>
                <p className="ps-7 text-[11px] leading-6 text-muted-foreground">
                  {item.features.join(" · ")}
                </p>
                {item.originalPriceDZD && (
                  <p className="num ps-7 text-[11px] text-muted-foreground line-through">
                    السعر الأصلي {formatDZD(item.originalPriceDZD)}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* معلومات CCP */}
      <section className="mt-10 rounded-lg border border-border p-6">
        <div className="flex items-center gap-3">
          <Receipt className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">معلومات التحويل البريدي (CCP)</h2>
        </div>

        <div className="mt-4">
          <CopyRow label="اسم المستفيد" value={CCP_INFO.beneficiary} mono={false} />
          <CopyRow label="رقم الحساب CCP" value={CCP_INFO.accountNumber} />
          <CopyRow label="المفتاح (clé)" value={CCP_INFO.key} />
          <CopyRow label="رقم RIP" value={CCP_INFO.rip} />
          <CopyRow label="الوكالة" value={CCP_INFO.agency} mono={false} />
          <CopyRow
            label="المبلغ المطلوب"
            value={plan ? formatDZD(plan.priceDZD) : "—"}
          />
        </div>

        <ol className="mt-6 flex flex-col gap-4 border-t border-border pt-6">
          {CCP_INFO.steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="num mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border border-border text-[11px] text-muted-foreground">
                {index + 1}
              </span>
              <span className="text-xs leading-6 text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>

        <div className="mt-6 flex items-start gap-3 rounded-md bg-secondary/70 p-4">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-[11px] leading-6 text-muted-foreground">{PAYMENT_NOTE}</p>
        </div>
      </section>

      {/* استمارة التأكيد */}
      <section className="mt-10">
        <h2 className="text-sm font-medium">تأكيد التحويل</h2>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          هذه المعلومات تصل مباشرة إلى الإدارة للمطابقة مع كشف الحساب البريدي.
        </p>

        <div className="mt-6 flex flex-col gap-5">
          <Field label="اسم الدافع (كما في الإيصال)" required>
            <Input
              value={payerName}
              onChange={(event) => setPayerName(event.target.value)}
              placeholder="مثال: مراد بن عمار"
              disabled={busy}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="رقم الوصل / مرجع التحويل" required>
              <Input
                value={ccpReference}
                onChange={(event) => setCcpReference(event.target.value)}
                placeholder="مثال: 4587123"
                dir="ltr"
                disabled={busy}
              />
            </Field>

            <Field label="تاريخ التحويل (اختياري)">
              <Input
                type="date"
                value={paidAt}
                onChange={(event) => setPaidAt(event.target.value)}
                disabled={busy}
              />
            </Field>
          </div>

          <ImageUpload
            label="صورة إيصال التحويل"
            value={receiptId}
            onChange={setReceiptId}
            hint="صورة واضحة تُظهر المبلغ والتاريخ ومرجع العملية. تُضغط تلقائياً قبل الرفع."
          />

          <Field label="ملاحظة للإدارة (اختياري)">
            <Textarea
              value={note}
              rows={3}
              maxLength={300}
              onChange={(event) => setNote(event.target.value)}
              placeholder="مثال: حوّلت من مكتب بريد بوفاريك باسم ابني."
              disabled={busy}
            />
          </Field>

          {error && (
            <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={submit} disabled={busy} size="lg" className="gap-2">
              {busy && <Loader2 className="size-4 animate-spin" />}
              إرسال الإيصال للمراجعة
            </Button>
            <span className="num text-xs text-muted-foreground">
              {plan ? `المبلغ: ${formatDZD(plan.priceDZD)}` : ""}
            </span>
          </div>
        </div>
      </section>

      {/* سجل الطلبات */}
      {workspace.requests.length > 0 && (
        <section className="mt-12">
          <h2 className="text-sm font-medium">سجل طلبات الاشتراك</h2>
          <ul className="mt-4 rounded-lg border border-border">
            {workspace.requests.map((request) => (
              <li
                key={request._id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 last:border-b-0"
              >
                <div>
                  <p className="text-xs font-medium">
                    {request.planName} · {formatDZD(request.amountDZD)}
                  </p>
                  <p className="num mt-1 text-[11px] text-muted-foreground">
                    مرجع {request.ccpReference} · أُرسل {formatDate(request.createdAt)}
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
        </section>
      )}

      <div className="mt-12 flex items-center gap-3 rounded-lg bg-secondary/60 px-6 py-5">
        <BadgeCheck className="size-4 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-6 text-muted-foreground">
          وُجد خطأ في إيصال سابق؟ أرسل طلباً جديداً مع الإيصال الصحيح، وسيظهر ملفك للزبائن مباشرة
          بعد التأكيد ({formatNumber(workspace.requests.length)} طلب سابق).
        </p>
      </div>
    </PageShell>
  );
}
