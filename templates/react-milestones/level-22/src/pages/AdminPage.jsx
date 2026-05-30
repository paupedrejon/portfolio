import { useState } from "react";
import PageHero from "../components/PageHero.jsx";
import { addProject } from "../lib/projectsStore.js";

export default function AdminPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState("");

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    setImageFile(file ?? null);
    setPreview(file ? URL.createObjectURL(file) : "");
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    addProject({
      title: name.trim(),
      description: description.trim() || "Proyecto añadido desde el panel admin.",
      image: preview || "/projects/landing.svg",
      imageAlt: name.trim(),
      tech: ["Nuevo"],
    });
    setName("");
    setDescription("");
    setImageFile(null);
    setPreview("");
    alert("Proyecto guardado en localStorage (demo)");
  }

  return (
    <main>
      <PageHero title="Admin" subtitle="Añade proyectos de demo al portfolio." />
      <section className="px-4 md:px-6 py-12 max-w-xl mx-auto">
        <form onSubmit={handleSubmit} className="theme-surface border rounded-2xl p-6 space-y-4">
          <div>
            <label htmlFor="admin-name" className="block text-sm font-medium theme-text mb-1.5">Título</label>
            <input
              id="admin-name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="theme-input rounded-lg px-3 py-2.5 w-full"
            />
          </div>
          <div>
            <label htmlFor="admin-desc" className="block text-sm font-medium theme-text mb-1.5">Descripción</label>
            <textarea
              id="admin-desc"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="theme-input rounded-lg px-3 py-2.5 w-full"
            />
          </div>
          <div>
            <label htmlFor="admin-image" className="block text-sm font-medium theme-text mb-1.5">Imagen</label>
            <input
              id="admin-image"
              type="file"
              name="image"
              accept="image/*"
              onChange={handleFileChange}
              className="theme-input rounded-lg px-3 py-2 w-full"
            />
            {preview ? (
              <img src={preview} alt="Vista previa del proyecto" className="mt-3 rounded-lg aspect-video object-cover w-full" />
            ) : null}
          </div>
          <button type="submit" className="px-6 py-3 rounded-full theme-accent-btn font-semibold">
            Guardar proyecto
          </button>
        </form>
      </section>
    </main>
  );
}
