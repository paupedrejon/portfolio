import FaqJsonLd from "@/components/seo/FaqJsonLd";

export type FaqItem = {
  question: string;
  answer: string;
};

type FaqSectionProps = {
  title: string;
  items: FaqItem[];
  className?: string;
};

export default function FaqSection({ title, items, className }: FaqSectionProps) {
  return (
    <section className={className} aria-labelledby="faq-heading">
      <FaqJsonLd items={items} />
      <h2 id="faq-heading" className="text-xl font-bold sm:text-2xl">
        {title}
      </h2>
      <dl className="mt-6 space-y-5">
        {items.map((item) => (
          <div key={item.question}>
            <dt className="font-semibold text-base">{item.question}</dt>
            <dd className="mt-1.5 text-sm opacity-85 leading-relaxed">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
