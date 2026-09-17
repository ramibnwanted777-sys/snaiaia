import { ArtisanCard } from "@/components/ArtisanCard";
import {
  EmptyState,
  Kicker,
  LoadingBlock,
  Monogram,
  StatusChip,
  Stars,
} from "@/components/kit";
import { PageShell } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { formatNumber, formatRelative, reviewCountLabel, telHref } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  FileText,
  Heart,
  LogOut,
  Phone,
  Search,
  Settings,
  ShieldCheck,
  Star,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect } from "react";
import { Link, useNavigate } from "react-router";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // إذا كان الحساب حرفياً، توجيهه تلقائياً إلى مساحة الحرفي الخاصة به
  useEffect(() => {
    if (user?.accountType === "artisan") {
      navigate("/my", { replace: true });
    }
  }, [user, navigate]);

  const stats = useQuery(api.artisans.stats, {});
  const favorites = useQuery(api.favorites.list, {});
  const myReviews = useQuery(api.reviews.mine, {});
  const exploreArtisans = useQuery(api.artisans.search, { limit: 4 });
  const toggleFavorite = useMutation(api.favorites.toggle);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <PageShell>
      {/* ترويسة صفحة الزبون */}
      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-foreground/25" />
            <Kicker>حساب الزبون</Kicker>
          </div>
          <h1 className="mt-4 text-2xl font-semibold md:text-3xl">
            أهلًا{user?.name ? `، ${user.name}` : ""}
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            {user?.email ?? "حساب زبون مسجّل"}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusChip tone="ink">
              <Users className="size-3.5" />
              حساب زبون نشط
            </StatusChip>
            <StatusChip tone="neutral">
              <ShieldCheck className="size-3.5" />
              تصفح وتواصل مجاني مع الحرفيين
            </StatusChip>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Button asChild size="sm" className="h-9 gap-2 shadow-none">
            <Link to="/search">
              <Search className="size-4" />
              ابحث عن حرفي
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-9 gap-2">
            <Link to="/settings">
              <Settings className="size-4" />
              الإعدادات
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="size-4" />
            خروج
          </Button>
        </div>
      </header>

      {/* قسم 1: استكشف الحرفيين المتاحين فوراً */}
      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Wrench className="size-4 text-muted-foreground" />
              استكشف الحرفيين المعتمدين في ولايتك
            </h2>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              صنايعية موثوقون جاهزون لخدمتك، تواصل معهم مباشرة بالهاتف بدون أي عمولات.
            </p>
          </div>
          <Button asChild variant="outline" size="sm" className="h-8 text-xs">
            <Link to="/search">عرض كل الحرفيين في الدليل ←</Link>
          </Button>
        </div>

        {exploreArtisans === undefined ? (
          <div className="pt-6">
            <LoadingBlock label="جارٍ تحميل الحرفيين المتاحين…" />
          </div>
        ) : exploreArtisans.length === 0 ? (
          <EmptyState
            className="mt-6"
            title="لا يوجد حرفيون حالياً"
            description="يمكنك تصفح الدليل والبحث حسب ولايتك وتخصصك."
            action={
              <Button asChild variant="outline">
                <Link to="/search">تصفح الدليل</Link>
              </Button>
            }
          />
        ) : (
          <div className="mt-2 divide-y divide-border">
            {exploreArtisans.map((artisan) => (
              <ArtisanCard key={artisan._id} artisan={artisan as any} />
            ))}
          </div>
        )}
      </section>

      {/* قسم 2: الحرفيون المحفوظون (المفضلة) */}
      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Heart className="size-4 text-muted-foreground" />
              الحرفيون المحفوظون في المفضلة
            </h2>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              قائمتك الخاصة للحرفيين المفضلين للوصول إليهم والاتصال بهم بسرعة.
            </p>
          </div>
        </div>

        {favorites === undefined ? (
          <div className="pt-6">
            <LoadingBlock label="جارٍ تحميل المفضلة…" />
          </div>
        ) : favorites.length === 0 ? (
          <EmptyState
            className="mt-6"
            title="لم تحفظ أي حرفي بعد"
            description="عند تصفح أي حرفي، اضغط على زر الحفظ ليظهر رقمه وبياناته هنا دائماً."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/search">تصفح الحرفيين الآن</Link>
              </Button>
            }
          />
        ) : (
          <ul className="mt-2">
            {favorites.map((artisan) => (
              <li
                key={artisan._id}
                className="flex flex-wrap items-center gap-4 border-b border-border py-5 last:border-b-0"
              >
                <Monogram name={artisan.fullName} url={artisan.photoUrl} className="size-12" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{artisan.fullName}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {artisan.specialty} · {artisan.commune}، {artisan.wilaya}
                  </p>
                  <div className="mt-2">
                    <Stars value={artisan.rating} count={artisan.ratingCount} />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button asChild size="sm" className="h-8 gap-1.5 shadow-none">
                    <a href={telHref(artisan.phone)}>
                      <Phone className="size-3.5" />
                      اتصال
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline" className="h-8">
                    <Link to={`/artisan/${artisan._id}`}>عرض الملف</Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 gap-1.5 text-muted-foreground hover:text-destructive"
                    onClick={() => toggleFavorite({ artisanId: artisan._id })}
                  >
                    <Heart className="size-3.5" />
                    إزالة
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* قسم 3: تقييماتي */}
      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Star className="size-4 text-muted-foreground" />
              تقييماتي وتجاربي
            </h2>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              التقييمات التي أضفتها للحرفيين بعد إنجاز الخدمات لمساعدة باقي الزبائن.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
            <Link to="/search">
              <Star className="size-3.5" />
              قيّم خدمة جديدة
            </Link>
          </Button>
        </div>

        {myReviews === undefined ? (
          <div className="pt-6">
            <LoadingBlock label="جارٍ تحميل تقييماتك…" />
          </div>
        ) : myReviews.length === 0 ? (
          <EmptyState
            className="mt-6"
            title="لم تقم بإضافة أي تقييم بعد"
            description="بعد كل خدمة يقدمها لك حرفي، قيّمه بالنجوم وأضف تعليقك لمساعدة جيرانك في الحي."
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/search">ابحث عن الحرفي لقييمه</Link>
              </Button>
            }
          />
        ) : (
          <ul className="mt-2">
            {myReviews.map((review) => (
              <li key={review._id} className="border-b border-border py-5 last:border-b-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{review.artisanName}</p>
                    <span className="text-[11px] text-muted-foreground">
                      {review.specialty} · {review.location}
                    </span>
                    {review.hidden && <StatusChip tone="danger">مخفي من الإدارة</StatusChip>}
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {formatRelative(review.createdAt)}
                  </span>
                </div>
                <div className="mt-2">
                  <Stars value={review.rating} />
                </div>
                {review.comment && (
                  <p className="mt-2 max-w-2xl text-xs leading-6 text-muted-foreground">
                    {review.comment}
                  </p>
                )}
                {review.artisanPublished && (
                  <Link
                    to={`/artisan/${review.artisanId}`}
                    className="mt-3 inline-block text-[11px] text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
                  >
                    عرض ملف الحرفي
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* قسم 4: روابط سريعة للزبون فقط */}
      <section className="mt-14 grid gap-4 md:grid-cols-3">
        {[
          {
            to: "/search",
            icon: Search,
            title: "البحث عن حرفي بالحي",
            body: "تصفية فورية حسب الولاية، البلدية، والتخصص مع أرقام هواتف مباشرة.",
          },
          {
            to: "/terms",
            icon: FileText,
            title: "قوانين وبنود الاستخدام",
            body: "اطلع على حقوقك كزبون، وشروط التقييم، وسياسات المنصة.",
          },
          {
            to: "/settings",
            icon: Settings,
            title: "إعدادات الحساب والأمان",
            body: "تعديل اسمك، بريدك الإلكتروني، وكلمة المرور الخاصة بحسابك.",
          },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.to}
              to={action.to}
              className="group flex flex-col gap-3 rounded-lg border border-border p-6 transition-colors hover:border-foreground/25 hover:bg-secondary/40"
            >
              <Icon className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
              <span className="text-sm font-medium">{action.title}</span>
              <span className="text-xs leading-6 text-muted-foreground">{action.body}</span>
            </Link>
          );
        })}
      </section>

      {/* إحصائيات عامة للمنصة */}
      <section className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-4">
        {[
          { label: "حرفي معتمد متاح", value: stats?.artisans },
          { label: "ولاية مغطّاة", value: stats?.wilayas },
          { label: "تقييم زبون موثوق", value: stats?.reviews },
          { label: "تخصص مهني", value: stats?.specialties },
        ].map((item) => (
          <div key={item.label} className="bg-background px-5 py-4">
            <p className="num text-xl font-semibold">
              {item.value === undefined ? "—" : formatNumber(item.value)}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </section>
    </PageShell>
  );
}
