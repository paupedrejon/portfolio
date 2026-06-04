import { SITE_NAME, SITE_URL } from "./config";

export function personSchema(params: {
  name: string;
  description: string;
  locale: string;
  sameAs?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: params.name,
    description: params.description,
    url: `${SITE_URL}/${params.locale}`,
    jobTitle: "Software Engineer",
    sameAs: params.sameAs ?? [
      "https://github.com/paupedrejon",
      "https://es.linkedin.com/in/pau-pedrejon-sobrino-0b5643380",
    ],
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
    author: { "@type": "Person", name: SITE_NAME },
    inLanguage: params.locale,
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
