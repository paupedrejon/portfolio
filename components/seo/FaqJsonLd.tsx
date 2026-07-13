import JsonLd from "@/components/seo/JsonLd";

export type FaqItem = {
  question: string;
  answer: string;
};

type FaqJsonLdProps = {
  items: FaqItem[];
};

export function faqPageSchema(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export default function FaqJsonLd({ items }: FaqJsonLdProps) {
  if (items.length === 0) return null;
  return <JsonLd data={faqPageSchema(items)} />;
}
