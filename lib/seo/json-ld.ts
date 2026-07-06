import { SITE_NAME, SITE_URL } from "./config";
import { CONTACT_EMAIL, GITHUB_URL, LINKEDIN_URL } from "./config";

export function personSchema(params: {
  name: string;
  description: string;
  locale: string;
  jobTitle?: string;
  knowsAbout?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: params.name,
    description: params.description,
    url: `${SITE_URL}/${params.locale}`,
    jobTitle: params.jobTitle ?? "Full-Stack Software Engineer",
    email: CONTACT_EMAIL,
    image: `${SITE_URL}/Favicon.png`,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Castelldefels",
      addressRegion: "Barcelona",
      addressCountry: "ES",
    },
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "Universitat Politècnica de Barcelona",
    },
    ...(params.knowsAbout?.length ? { knowsAbout: params.knowsAbout } : {}),
    sameAs: [GITHUB_URL, LINKEDIN_URL],
  };
}

export function profilePageSchema(mainEntity: Record<string, unknown>) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    name: `${SITE_NAME} — Portfolio`,
    mainEntity,
  };
}

export function websiteSchema(params: {
  name: string;
  description: string;
  locale: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: params.name,
    description: params.description,
    url: `${SITE_URL}/${params.locale}`,
    author: { "@type": "Person", name: SITE_NAME, url: LINKEDIN_URL },
    inLanguage: params.locale,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/${params.locale}/proyectos`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function creativeWorkSchema(params: {
  name: string;
  description: string;
  url: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: params.name,
    description: params.description,
    url: params.url,
    ...(params.image ? { image: params.image } : {}),
    author: { "@type": "Person", name: SITE_NAME },
  };
}
