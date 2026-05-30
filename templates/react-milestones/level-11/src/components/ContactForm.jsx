import { useState } from "react";

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  function validate() {
    const next = {};
    if (!name.trim()) next.name = "El nombre es obligatorio";
    if (!email.includes("@")) next.email = "Email no válido";
    if (!message.trim()) next.message = "Escribe un mensaje";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    alert("Mensaje enviado (demo)");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md" noValidate>
      <div>
        <input
          id="contact-name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="border border-white/20 rounded px-3 py-2 w-full bg-transparent text-white"
        />
        {errors.name && <p className="text-red-400 text-sm mt-1" role="alert">{errors.name}</p>}
      </div>
      <div>
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-white/20 rounded px-3 py-2 w-full bg-transparent text-white"
        />
        {errors.email && <p className="text-red-400 text-sm mt-1" role="alert">{errors.email}</p>}
      </div>
      <textarea
        name="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        className="border border-white/20 rounded px-3 py-2 w-full bg-transparent text-white"
      />
      {errors.message && <p className="text-red-400 text-sm" role="alert">{errors.message}</p>}
      <button type="submit" className="px-6 py-3 rounded-full bg-[#2a8ca0] text-white font-semibold">
        Enviar
      </button>
    </form>
  );
}
