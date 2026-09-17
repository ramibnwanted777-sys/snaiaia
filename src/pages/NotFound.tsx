import { PageShell } from "@/components/SiteChrome";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <PageShell width="narrow">
      <div className="rounded-lg border border-border py-20 text-center">
        <p className="num text-5xl font-light text-muted-foreground">404</p>
        <h1 className="mt-6 text-xl font-semibold">الصفحة غير موجودة</h1>
        <p className="mx-auto mt-3 max-w-md text-xs leading-7 text-muted-foreground">
          الرابط الذي فتحته غير متاح في دليل الصنايعية. يمكنك العودة إلى الصفحة الرئيسية أو
          البحث مباشرة عن حرفي في ولايتك.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link to="/search">ابحث عن حرفي</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/">الصفحة الرئيسية</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
