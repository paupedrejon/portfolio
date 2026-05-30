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
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <input
        id="contact-name"
        name="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Tu nombre"
        className="border border-white/20 rounded px-3 py-2 w-full bg-transparent text-white"
      />
      <input
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="border border-white/20 rounded px-3 py-2 w-full bg-transparent text-white"
      />
      <textarea
        name="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        placeholder="Mensaje"
        className="border border-white/20 rounded px-3 py-2 w-full bg-transparent text-white"
      />
      <button type="submit" className="px-6 py-3 rounded-full bg-[#2a8ca0] text-white font-semibold">
        Enviar
      </button>
    </form>
  );
}
