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
    <section
      className={["faq-section", className].filter(Boolean).join(" ")}
      aria-labelledby="faq-heading"
    >
      <FaqJsonLd items={items} />
      <h2 id="faq-heading" className="faq-section__title">
        {title}
      </h2>
      <dl className="faq-section__list">
        {items.map((item) => (
          <div key={item.question} className="faq-section__item">
            <dt className="faq-section__question">{item.question}</dt>
            <dd className="faq-section__answer">{item.answer}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
