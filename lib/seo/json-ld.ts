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
    hasOccupation: {
      "@type": "Occupation",
      name: params.jobTitle ?? "Full-Stack Software Engineer",
      occupationalCategory: "Software Development",
    },
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
      name: "Universitat Politècnica de Catalunya",
      sameAs: "https://www.upc.edu/",
    },
    worksFor: {
      "@type": "Organization",
      name: "Owius",
      url: "https://owius.com/",
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
  };
}

export function creativeWorkSchema(params: {
  name: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  keywords?: string[];
  programmingLanguage?: string[];
  codeRepository?: string;
  demoUrl?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: params.name,
    description: params.description,
    url: params.url,
    ...(params.image ? { image: params.image } : {}),
    ...(params.datePublished ? { datePublished: params.datePublished } : {}),
    ...(params.keywords?.length ? { keywords: params.keywords.join(", ") } : {}),
    ...(params.programmingLanguage?.length
      ? { programmingLanguage: params.programmingLanguage }
      : {}),
    ...(params.codeRepository ? { codeRepository: params.codeRepository } : {}),
    ...(params.demoUrl ? { workExample: { "@type": "WebApplication", url: params.demoUrl } } : {}),
    author: { "@type": "Person", name: SITE_NAME },
  };
}

export function blogPostingSchema(params: {
  title: string;
  description: string;
  url: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  tags?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: params.title,
    description: params.description,
    url: params.url,
    datePublished: params.datePublished,
    dateModified: params.dateModified ?? params.datePublished,
    ...(params.image ? { image: params.image } : {}),
    ...(params.tags?.length ? { keywords: params.tags.join(", ") } : {}),
    author: { "@type": "Person", name: SITE_NAME, url: LINKEDIN_URL },
    publisher: {
      "@type": "Person",
      name: SITE_NAME,
      url: SITE_URL,
    },
    inLanguage: params.url.includes("/en/") ? "en" : params.url.includes("/it/") ? "it" : "es",
  };
}
