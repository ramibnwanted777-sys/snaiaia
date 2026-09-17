import {
  DataRow,
  EmptyState,
  Kicker,
  LoadingBlock,
  Monogram,
  PremiumBadge,
  Stars,
  StatusChip,
} from "@/components/kit";
import { PageShell } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import {
  formatDate,
  formatPhone,
  formatRelative,
  reviewCountLabel,
  telHref,
} from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Heart,
  Image as ImageIcon,
  MapPin,
  Phone,
  Star,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

export default function ArtisanProfile() {
  const { artisanId = "" } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const validId = artisanId.length >= 16;

  const artisan = useQuery(
    api.artisans.profile,
    validId ? { artisanId: artisanId as Id<"artisans"> } : "skip",
  );
  const reviews = useQuery(
    api.reviews.listByArtisan,
    validId ? { artisanId: artisanId as Id<"artisans"> } : "skip",
  );
  const saved = useQuery(
    api.favorites.isSaved,
    validId ? { artisanId: artisanId as Id<"artisans"> } : "skip",
  );
  const toggleFavorite = useMutation(api.favorites.toggle);

  const handleSave = async () => {
    if (saved === null || saved === undefined) {
      navigate(`/login?role=customer&returnTo=${encodeURIComponent(`/artisan/${artisanId}`)}`);
      return;
    }
    try {
      const result = await toggleFavorite({ artisanId: artisanId as Id<"artisans"> });
      toast.success(result.saved ? "أُضيف إلى المفضلة" : "أُزيل من المفضلة");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "تعذّر تحديث المفضلة.");
    }
  };

  if (!validId) {
    return (
      <PageShell width="narrow">
        <EmptyState
          title="ملف غير موجود"
          description="الرابط الذي فتحته لا يطابق أي حرفي في الدليل."
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

  if (artisan === null) {
    return (
      <PageShell width="narrow">
        <EmptyState
          title="هذا الملف غير منشور حالياً"
          description="قد يكون ملف الحرفي قيد المراجعة من الإدارة، أو أن اشتراكه لم يُفعَّل بعد."
          action={
            <Button asChild variant="outline">
              <Link to="/search">ابحث عن حرفي آخر</Link>
            </Button>
          }
        />
      </PageShell>
    );
  }

  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: (reviews ?? []).filter((review) => review.rating === stars).length,
  }));
  const total = reviews?.length ?? 0;

  return (
    <PageShell>
      <Link
        to="/search"
        className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowRight className="size-3.5" />
        رجوع إلى نتائج البحث
      </Link>

      {/* رأس الملف */}
      <section className="mt-6 grid gap-8 border-b border-border pb-10 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-5">
          <div className="flex items-start gap-5">
            <Monogram
              name={artisan.fullName}
              url={artisan.photoUrl}
              className="size-20 rounded-lg text-xl"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold">{artisan.fullName}</h1>
                {artisan.isPremium && <PremiumBadge />}
              </div>
              <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <BriefcaseBusiness className="size-3.5" />
                  {artisan.specialty}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {artisan.commune}، {artisan.wilaya}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="size-3.5" />
                  في الدليل منذ {formatDate(artisan.memberSince)}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <a href={telHref(artisan.phone)}>
                <Phone className="size-4" />
                اتصل الآن
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="gap-2">
              <Link to={`/artisan/${artisan._id}/review`}>
                <Star className="size-4" />
                أضف تقييمك
              </Link>
            </Button>
            <Button
              type="button"
              size="lg"
              variant="ghost"
              className="gap-2"
              onClick={handleSave}
            >
              <Heart className={saved ? "size-4 fill-current" : "size-4"} />
              {saved ? "محفوظ في المفضلة" : "حفظ في المفضلة"}
            </Button>
            <span className="num text-sm text-muted-foreground" dir="ltr">
              {formatPhone(artisan.phone)}
            </span>
          </div>

          <p className="max-w-2xl text-sm leading-8 text-muted-foreground">
            {artisan.bio ?? "لم يُضف الحرفي وصفاً بعد."}
          </p>
        </div>

        <div className="rounded-lg border border-border p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="num text-3xl font-semibold">
                {artisan.ratingCount ? artisan.rating.toFixed(1) : "—"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {reviewCountLabel(artisan.ratingCount)}
              </p>
            </div>
            <Stars value={artisan.rating} size={16} />
          </div>

          <div className="mt-5 flex flex-col gap-2 border-t border-border pt-5">
            {distribution.map((row) => (
              <div key={row.stars} className="flex items-center gap-3">
                <span className="num w-8 text-[11px] text-muted-foreground">{row.stars} نجوم</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <span
                    className="block h-full bg-foreground/70"
                    style={{ width: total ? `${(row.count / total) * 100}%` : "0%" }}
                  />
                </span>
                <span className="num w-6 text-end text-[11px] text-muted-foreground">
                  {row.count}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-border pt-3">
            <DataRow label="سنوات الخبرة" value={artisan.yearsExperience ?? "—"} />
            <DataRow label="صور الأعمال" value={artisan.works.length} />
            <DataRow
              label="نوع الاشتراك"
              value={artisan.planName ?? "غير مشترك"}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
            <StatusChip tone="ink">
              <BadgeCheck className="size-3.5" />
              ملف مُراجَع من الإدارة
            </StatusChip>
          </div>
        </div>
      </section>

      {/* صور الأعمال */}
      <section className="mt-12">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-foreground/25" />
          <Kicker>أعمال سابقة (قبل / بعد)</Kicker>
        </div>

        {artisan.works.length === 0 ? (
          <EmptyState
            className="mt-6"
            title="لا توجد صور أعمال منشورة"
            description="يمكن للحرفي إضافة صور «قبل/بعد» من ملفه، وتظهر هنا للزبائن."
          />
        ) : (
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {artisan.works.map((work, index) => {
              const hasImages = Boolean(work.beforeUrl || work.afterUrl);
              return (
              <article key={index} className="rounded-lg border border-border p-5">
                {!hasImages && (
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-secondary text-muted-foreground">
                      <ImageIcon className="size-4" />
                    </span>
                    <div>
                      <p className="text-xs leading-6">{work.caption ?? "عمل منجز"}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        لم يرفع الحرفي صور «قبل/بعد» لهذا العمل.
                      </p>
                    </div>
                  </div>
                )}
                {hasImages && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "قبل", url: work.beforeUrl },
                    { label: "بعد", url: work.afterUrl },
                  ].map((side) => (
                    <figure key={side.label} className="flex flex-col gap-2">
                      {side.url ? (
                        <img
                          src={side.url}
                          alt={side.label}
                          loading="lazy"
                          className="aspect-4/3 w-full rounded-md object-cover hairline border"
                        />
                      ) : (
                        <div className="grid aspect-4/3 w-full place-items-center rounded-md border border-dashed text-muted-foreground">
                          <ImageIcon className="size-4" />
                        </div>
                      )}
                      <figcaption className="text-[11px] text-muted-foreground">
                        {side.label}
                      </figcaption>
                    </figure>
                  ))}
                </div>
                )}
                {hasImages && work.caption && (
                  <p className="mt-4 text-xs leading-6 text-muted-foreground">{work.caption}</p>
                )}
              </article>
              );
            })}
          </div>
        )}
      </section>

      {/* التقييمات */}
      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-foreground/25" />
            <Kicker>تقييمات الزبائن</Kicker>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link to={`/artisan/${artisan._id}/review`}>
              <Star className="size-3.5" />
              قيّم هذه الخدمة
            </Link>
          </Button>
        </div>

        {reviews === undefined ? (
          <div className="mt-6">
            <LoadingBlock label="جارٍ تحميل التقييمات…" />
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState
            className="mt-8"
            title="لا توجد تقييمات بعد"
            description="كن أول من يقيّم هذا الحرفي: نجمة إلى خمس نجوم، تعليق نصي، وصورة اختيارية للنتيجة."
            action={
              <Button asChild>
                <Link to={`/artisan/${artisan._id}/review`}>أضف أول تقييم</Link>
              </Button>
            }
          />
        ) : (
          <ul className="mt-2">
            {reviews.map((review) => (
              <li key={review._id} className="border-b border-border py-6 last:border-b-0">
                <div className="flex items-start gap-4">
                  <Monogram name={review.customerName} className="size-10 text-xs" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium">{review.customerName}</p>
                      <span className="text-[11px] text-muted-foreground">
                        {formatRelative(review.createdAt)}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <Stars value={review.rating} />
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-xs leading-7 text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                    {(review.beforeUrl || review.afterUrl) && (
                      <div className="mt-4 grid max-w-md grid-cols-2 gap-3">
                        {[
                          { label: "قبل", url: review.beforeUrl },
                          { label: "بعد", url: review.afterUrl },
                        ]
                          .filter((side) => side.url)
                          .map((side) => (
                            <figure key={side.label} className="flex flex-col gap-1.5">
                              <img
                                src={side.url as string}
                                alt={side.label}
                                loading="lazy"
                                className="aspect-4/3 w-full rounded-md object-cover hairline border"
                              />
                              <figcaption className="text-[11px] text-muted-foreground">
                                {side.label}
                              </figcaption>
                            </figure>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-secondary/60 px-6 py-5">
        <p className="text-xs leading-6 text-muted-foreground">
          {isAuthenticated
            ? `هل أنت ${artisan.fullName}؟ تابع اشتراكك وإيصالات الدفع من مساحة الحرفي، أو ابحث عن ملفك برقم الهاتف.`
            : `هل أنت ${artisan.fullName}؟ ادخل بحساب الحرفي لمتابعة اشتراكك وإيصالات الدفع.`}
        </p>
        <div className="flex flex-wrap gap-3">
          {!isAuthenticated && (
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/login?role=artisan&returnTo=/my">دخول الحرفي</Link>
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <Link to="/me">البحث برقم الهاتف</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
