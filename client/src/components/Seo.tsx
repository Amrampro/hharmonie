import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import seoImage from "../assets/img/default_cat.jpg";

export const SITE_URL = (
  (import.meta as any).env?.VITE_SITE_URL || "https://hormoneharmonie.com"
).replace(/\/+$/, "");
export const SITE_NAME = "Hormones & Harmonie";

const DEFAULT_IMAGE = `${SITE_URL}${seoImage.startsWith("/") ? seoImage : `/${seoImage}`}`;

type SeoMeta = {
  title: string;
  description: string;
};

const indexablePages: Record<string, SeoMeta> = {
  "/": {
    title: "Hormones & Harmonie | Équilibre hormonal naturel",
    description:
      "H&H accompagne le cycle, l'équilibre hormonal et la fertilité avec des produits naturels, des packs ciblés et des consultations personnalisées.",
  },
  "/shop": {
    title: "Produits naturels pour l'équilibre hormonal | Hormones & Harmonie",
    description:
      "Découvrez les tisanes, compléments et packs H&H pour soutenir naturellement l'équilibre hormonal, le cycle, la fertilité et le bien-être intime.",
  },
  "/approach": {
    title: "Notre approche | Hormones & Harmonie",
    description:
      "Phytothérapie, gemmothérapie et nutrithérapie au service d'une approche naturelle, globale et personnalisée.",
  },
  "/about": {
    title: "À propos | Hormones & Harmonie",
    description:
      "Découvrez l'histoire, la mission et l'expertise H&H autour de l'équilibre hormonal naturel.",
  },
  "/consultation": {
    title: "Consultation hormonale et fertilité | Hormones & Harmonie",
    description:
      "Réservez un bilan hormonal naturopathie ou un accompagnement fertilité personnalisé avec Hormones & Harmonie.",
  },
  "/events": {
    title: "Événements et ateliers | Hormones & Harmonie",
    description:
      "Ateliers et rencontres H&H autour du cycle, des hormones, de la fertilité et des approches naturelles.",
  },
  "/blog": {
    title: "Conseils hormones, cycle et fertilité | Hormones & Harmonie",
    description:
      "Conseils naturels, repères et articles autour du cycle, des hormones, de la fertilité et du bien-être intime.",
  },
  "/faqs": {
    title: "FAQ | Hormones & Harmonie",
    description:
      "Réponses aux questions fréquentes sur les produits, commandes, consultations et accompagnements H&H.",
  },
  "/contact": {
    title: "Contact | Hormones & Harmonie",
    description:
      "Contactez H&H pour toute question sur la marque, les produits ou les rendez-vous.",
  },
  "/fidelity": {
    title: "Programme fidélité | Hormones & Harmonie",
    description:
      "Découvrez les avantages fidélité H&H pour vos commandes de produits naturels.",
  },
  "/ambassadors": {
    title: "Ambassadeurs | Hormones & Harmonie",
    description:
      "Rejoignez le programme ambassadeur H&H et accompagnez la communauté autour du bien-être hormonal naturel.",
  },
};

function normalizePath(pathname: string) {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function dynamicPage(pathname: string): SeoMeta | null {
  if (pathname.startsWith("/products/")) {
    return {
      title: "Produit naturel | Hormones & Harmonie",
      description:
        "Découvrez ce produit H&H et ses informations détaillées pour accompagner naturellement votre équilibre.",
    };
  }

  if (pathname.startsWith("/blog/")) {
    return {
      title: "Conseil naturel | Hormones & Harmonie",
      description:
        "Lisez cet article H&H autour du cycle, des hormones, de la fertilité et du bien-être naturel.",
    };
  }

  if (pathname.startsWith("/events/")) {
    return {
      title: "Événement H&H | Hormones & Harmonie",
      description:
        "Découvrez cet événement H&H autour du cycle, des hormones, de la fertilité et des approches naturelles.",
    };
  }

  return null;
}

function absoluteUrl(pathOrUrl: string | null | undefined) {
  const value = String(pathOrUrl || "").trim();
  if (!value) return DEFAULT_IMAGE;
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

export function Seo() {
  const location = useLocation();
  const pathname = normalizePath(location.pathname);
  const page = indexablePages[pathname] ?? dynamicPage(pathname);
  const canonicalPath = page ? pathname : "/";
  const canonicalUrl = `${SITE_URL}${canonicalPath}`;

  const title = page?.title ?? `${SITE_NAME} | Page non indexée`;
  const description =
    page?.description ??
    "Cette page H&H n'est pas destinée à apparaître dans les résultats Google.";
  const image = absoluteUrl(DEFAULT_IMAGE);

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: image,
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: "fr-BE",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/shop?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const webpageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: canonicalUrl,
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    inLanguage: "fr-BE",
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta
        name="robots"
        content={page ? "index,follow,max-image-preview:large" : "noindex,nofollow,noarchive"}
      />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="author" content={SITE_NAME} />
      <meta name="theme-color" content="#A9798F" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="fr_BE" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <script type="application/ld+json">{JSON.stringify(organizationJsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(websiteJsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(webpageJsonLd)}</script>
    </Helmet>
  );
}
