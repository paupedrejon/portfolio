import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    alert("Mensaje enviado (demo)");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full">
      <div>
        <label htmlFor="contact-name" className="block text-sm font-medium theme-text mb-1.5">
          Nombre
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          className="theme-input rounded-lg px-3 py-2.5 w-full"
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="block text-sm font-medium theme-text mb-1.5">
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="theme-input rounded-lg px-3 py-2.5 w-full"
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="block text-sm font-medium theme-text mb-1.5">
          Mensaje
        </label>
        <textarea
          id="contact-message"
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder="Cuéntame en qué puedo ayudarte…"
          className="theme-input rounded-lg px-3 py-2.5 w-full resize-y min-h-[120px]"
        />
      </div>
      <button type="submit" className="w-full sm:w-auto px-6 py-3 rounded-full theme-accent-btn font-semibold">
        Enviar
      </button>
    </form>
  );
}
