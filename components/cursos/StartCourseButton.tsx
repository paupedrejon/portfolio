"use client";

import { signIn, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";

export default function StartCourseButton() {
  const t = useTranslations("cursos");
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") {
    return (
      <button type="button" className="cursos-btn-primary" disabled>
        ...
      </button>
    );
  }

  if (!session) {
    return (
      <button
        type="button"
        className="cursos-btn-primary"
        onClick={() =>
          signIn("google", { callbackUrl: pathname || "/es/cursos/react/mapa" })
        }
      >
        {t("startCourse")}
      </button>
    );
  }

  return (
    <Link href="/cursos/react/mapa" className="cursos-btn-primary">
      {t("startCourse")}
    </Link>
  );
}
