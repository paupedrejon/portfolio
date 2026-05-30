import PageHero from "../components/PageHero.jsx";
import ContactForm from "../components/ContactForm.jsx";

export default function ContactPage() {
  return (
    <>
      <PageHero
        title="Contacto"
        subtitle="Cuéntame tu idea — te responderé en cuanto pueda."
      />
      <section className="px-4 md:px-6 py-12 max-w-xl mx-auto">
        <div className="theme-surface border rounded-2xl p-6 md:p-8">
          <ContactForm />
        </div>
      </section>
    </>
  );
}
