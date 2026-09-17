import { Button } from "@/components/ui/button";
import { Monogram, PremiumBadge, Stars } from "@/components/kit";
import { formatPhone, reviewCountLabel, telHref } from "@/lib/format";
import { Phone } from "lucide-react";
import { Link } from "react-router";

export interface ArtisanCardData {
  _id: string;
  fullName: string;
  specialty: string;
  wilaya: string;
  commune: string;
  phone: string;
  bio: string | null;
  photoUrl: string | null;
  rating: number;
  ratingCount: number;
  isPremium: boolean;
  planName: string | null;
  worksCount: number;
  createdAt: number;
}

export function ArtisanCard({ artisan }: { artisan: ArtisanCardData }) {
  return (
    <article className="flex gap-4 border-b border-border py-6 last:border-b-0">
      <Monogram name={artisan.fullName} url={artisan.photoUrl} className="size-16" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/artisan/${artisan._id}`}
            className="truncate text-[15px] font-medium transition-opacity hover:opacity-70"
          >
            {artisan.fullName}
          </Link>
          {artisan.isPremium && <PremiumBadge compact />}
        </div>

        <p className="mt-1 text-xs text-muted-foreground">
          {artisan.specialty} · {artisan.commune}، {artisan.wilaya}
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Stars value={artisan.rating} count={artisan.ratingCount} />
          <span className="text-[11px] text-muted-foreground">
            {reviewCountLabel(artisan.ratingCount)}
            {artisan.worksCount > 0 && ` · ${artisan.worksCount} صورة أعمال`}
          </span>
        </div>

        {artisan.bio && (
          <p className="mt-2 line-clamp-2 max-w-2xl text-xs leading-6 text-muted-foreground">
            {artisan.bio}
          </p>
        )}

        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <Button asChild size="sm" className="gap-2">
            <a href={telHref(artisan.phone)}>
              <Phone className="size-3.5" />
              اتصال مباشر
            </a>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`/artisan/${artisan._id}`}>عرض الملف والتقييمات</Link>
          </Button>
          <span className="num text-[11px] text-muted-foreground" dir="ltr">
            {formatPhone(artisan.phone)}
          </span>
        </div>
      </div>
    </article>
  );
}
