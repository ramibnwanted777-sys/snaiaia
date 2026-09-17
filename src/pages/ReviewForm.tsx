import { ImageUpload } from "@/components/ImageUpload";
import { EmptyState, Field, Kicker, LoadingBlock, Monogram, StarPicker } from "@/components/kit";
import { useAuth } from "@/hooks/use-auth";
import { PageShell } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight, ChevronDown, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

export default function ReviewForm() {
  const { artisanId = "" } = useParams();
  const validId = artisanId.length >= 16;

  const artisan = useQuery(
    api.artisans.profile,
    validId ? { artisanId: artisanId as Id<"artisans"> } : "skip",
  );
  const createReview = useMutation(api.reviews.create);
  const { user, isAuthenticated } = useAuth();
  const myReview = useQuery(
    api.reviews.myReviewFor,
    validId ? { artisanId: artisanId as Id<"artisans"> } : "skip",
  );

  const [rating, setRating] = useState(0);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [comment, setComment] = useState("");
  const [beforeId, setBeforeId] = useState<Id<"_storage"> | null>(null);
  const [afterId, setAfterId] = useState<Id<"_storage"> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // تعبئة الاسم تلقائياً للحساب المسجّل
  useEffect(() => {
    if (!customerName && user?.name) setCustomerName(user.name);
  }, [user?.name, customerName]);

  const submit = async () => {
    setError(null);
    if (rating < 1) {
      setError("اختر عدد النجوم من 1 إلى 5.");
      return;
    }
    if (customerName.trim().length < 2) {
      setError("اكتب اسمك حتى يعرف الحرفي من قيّمه.");
      return;
    }

    setBusy(true);
    try {
      await createReview({
        artisanId: artisanId as Id<"artisans">,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        rating,
        comment: comment.trim() || undefined,
        beforeId: beforeId ?? undefined,
        afterId: afterId ?? undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إرسال التقييم، أعد المحاولة.");
    } finally {
      setBusy(false);
    }
  };

  if (!validId || artisan === null) {
    return (
      <PageShell width="narrow">
        <EmptyState
          title="تعذّر تقييم هذا الملف"
          description="الملف غير متاح أو لم يُعتمد بعد."
          action={
            <Button asChild variant="outline">
              <Link to="/search">العودة إلى البحث</Link>
            </Button>
          }
        />
      </PageShell>
    );
  }

  if (artisan === undefined) {
    return (
      <PageShell width="narrow">
        <LoadingBlock label="جارٍ تحميل الملف…" />
      </PageShell>
    );
  }

  if (done) {
    return (
      <PageShell width="narrow">
        <div className="rounded-lg border border-border p-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-foreground text-background">
            <Check className="size-5" />
          </span>
          <h1 className="mt-6 text-xl font-semibold">شكراً، تم نشر تقييمك</h1>
          <p className="mx-auto mt-3 max-w-md text-xs leading-7 text-muted-foreground">
            تقييمك ظاهر الآن على ملف {artisan.fullName} ويساعد سكان الحي على اختيار الحرفي
            المناسب. يمكن للإدارة حذف التقييمات المخالفة.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link to={`/artisan/${artisan._id}`}>عرض ملف الحرفي</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/search">البحث عن حرفي آخر</Link>
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell width="narrow">
      <Link
        to={`/artisan/${artisan._id}`}
        className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowRight className="size-3.5" />
        رجوع إلى ملف الحرفي
      </Link>

      <header className="mt-6 flex items-center gap-4 border-b border-border pb-6">
        <Monogram name={artisan.fullName} url={artisan.photoUrl} className="size-14" />
        <div>
          <Kicker>تقييم بعد الخدمة</Kicker>
          <h1 className="mt-1 text-lg font-semibold">{artisan.fullName}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {artisan.specialty} · {artisan.commune}، {artisan.wilaya}
          </p>
        </div>
      </header>

      <div className="mt-8 flex flex-col gap-7">
        <Field label="تقييمك بالنجوم" required hint="1 نجمة = خدمة سيئة، 5 نجوم = خدمة ممتازة">
          <StarPicker value={rating} onChange={setRating} disabled={busy} />
        </Field>

        {isAuthenticated && myReview && !showAll && (
          <div className="rounded-lg border border-border px-6 py-6">
            <p className="text-sm font-medium">سبق أن قيّمت هذا الحرفي</p>
            <p className="mt-2 text-[11px] leading-6 text-muted-foreground">
              تقييمك الحالي ({myReview.rating} من 5) ظاهر على ملفه. يمكنك إضافة تقييم جديد
              لخدمة أخرى، أو مراجعة تقييمك من صفحة «حساب الزبون».
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" size="sm" variant="outline" onClick={() => setShowAll(true)}>
                <ChevronDown className="size-3.5" />
                إضافة تقييم جديد
              </Button>
              <Button asChild size="sm" variant="ghost">
                <Link to="/dashboard">حساب الزبون</Link>
              </Button>
            </div>
          </div>
        )}

        <div className={isAuthenticated && myReview && !showAll ? "hidden" : "flex flex-col gap-7"}>
        <Field label="اسمك" required>
          <Input
            value={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            placeholder="مثال: أمينة ح."
            disabled={busy}
          />
        </Field>

        <Field label="رقم هاتفك (اختياري)" hint="لا يُنشر للعموم، تستعمله الإدارة عند التحقق فقط.">
          <Input
            value={customerPhone}
            onChange={(event) => setCustomerPhone(event.target.value)}
            placeholder="0551234567"
            dir="ltr"
            inputMode="tel"
            disabled={busy}
          />
        </Field>

        <Field label="تعليقك" hint="ما الذي أُنجز؟ هل التزم بالموعد والسعر؟">
          <Textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            maxLength={600}
            placeholder="مثال: أصلح تسريب الحمّام في نفس اليوم وسعر واضح قبل البدء."
            disabled={busy}
          />
        </Field>

        <div className="grid gap-5 rounded-lg border border-border p-5 md:grid-cols-2">
          <ImageUpload
            label="صورة قبل الخدمة (اختياري)"
            value={beforeId}
            onChange={setBeforeId}
          />
          <ImageUpload
            label="صورة بعد الخدمة (اختياري)"
            value={afterId}
            onChange={setAfterId}
          />
        </div>

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={submit} disabled={busy} size="lg" className="gap-2">
            {busy && <Loader2 className="size-4 animate-spin" />}
            نشر التقييم
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link to={`/artisan/${artisan._id}`}>إلغاء</Link>
          </Button>
        </div>
        </div>

        {!isAuthenticated && (
          <p className="text-[11px] leading-6 text-muted-foreground">
            نصيحة: سجّل الدخول بحساب زبون لتظهر تقييماتك في سجلك وتبقى محفوظة مع المفضلة. —{" "}
            <Link
              to={`/login?role=customer&returnTo=${encodeURIComponent(`/artisan/${artisan._id}/review`)}`}
              className="underline decoration-border underline-offset-4 hover:text-foreground"
            >
              دخول الزبون
            </Link>
          </p>
        )}
      </div>
    </PageShell>
  );
}
