"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HiArrowLeft, HiPlus, HiXMark, HiPhoto, HiDocumentText, HiCheck, HiAcademicCap, HiCodeBracket, HiClipboardDocumentList, HiPencilSquare, HiLightBulb, HiPlay } from "react-icons/hi2";
import { TbFileUpload } from "react-icons/tb";

export default function CreateCoursePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const coverImageInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: 0,
    maxDurationDays: null as number | null,
    coverImage: null as string | null,
    isExam: false,
    topics: [{ 
      name: "", 
      pdfs: [] as string[], 
      subtopics: [] as Array<{ name: string; pdfs: string[] }>,
      flashcards: [] as Array<{ 
        question: string; 
        correct_answer_index: number; // Índice de la opción correcta (0-based)
        options: string[] 
      }>
    }],
    examExamples: [] as string[],
    availableTools: {
      flashcards: false,
      code_interpreter: false,
      notes: true,
      tests: true,
      exercises: true,
      games: false,
    },
    generateSummaries: false,
    additionalComments: "",
    geminiModel: "gemini-3-pro",
  });
  
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState({ percentage: 0, currentItem: "", status: "" });
  const [courseId, setCourseId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.id) {
      // Usuario autenticado, puede continuar
    } else if (window.location.pathname !== "/auth/signin") {
      // Evitar loops: solo redirigir si no estamos ya en la página de signin
      router.push("/auth/signin?callbackUrl=/study-agents/create-course");
    }
  }, [session, router]);

  // Desactivar juegos automáticamente si el precio baja de 10€
  useEffect(() => {
    if (formData.price < 10 && formData.availableTools.games) {
      setFormData(prev => ({
        ...prev,
        availableTools: { ...prev.availableTools, games: false },
      }));
    }
  }, [formData.price]);

  const handleAddTopic = () => {
    setFormData({
      ...formData,
      topics: [...formData.topics, { name: "", pdfs: [], subtopics: [], flashcards: [] }],
    });
  };

  const handleRemoveTopic = (index: number) => {
    const newTopics = formData.topics.filter((_, i) => i !== index);
    setFormData({ ...formData, topics: newTopics });
  };

  const handleTopicChange = (index: number, field: "name" | "pdfs", value: string | string[]) => {
    const newTopics = [...formData.topics];
    if (field === "name") {
      newTopics[index].name = value as string;
    } else {
      newTopics[index].pdfs = value as string[];
    }
    setFormData({ ...formData, topics: newTopics });
  };

  const handleAddSubtopic = (topicIndex: number) => {
    const newTopics = [...formData.topics];
    if (!newTopics[topicIndex].subtopics) {
      newTopics[topicIndex].subtopics = [];
    }
    newTopics[topicIndex].subtopics.push({ name: "", pdfs: [] });
    setFormData({ ...formData, topics: newTopics });
  };

  const handleRemoveSubtopic = (topicIndex: number, subtopicIndex: number) => {
    const newTopics = [...formData.topics];
    newTopics[topicIndex].subtopics = newTopics[topicIndex].subtopics.filter((_, i) => i !== subtopicIndex);
    setFormData({ ...formData, topics: newTopics });
  };

  const handleSubtopicChange = (topicIndex: number, subtopicIndex: number, field: "name" | "pdfs", value: string | string[]) => {
    const newTopics = [...formData.topics];
    if (field === "name") {
      newTopics[topicIndex].subtopics[subtopicIndex].name = value as string;
    } else {
      newTopics[topicIndex].subtopics[subtopicIndex].pdfs = value as string[];
    }
    setFormData({ ...formData, topics: newTopics });
  };

  const handleUploadPDF = async (topicIndex: number, file: File, subtopicIndex?: number) => {
    if (!file.name.endsWith(".pdf")) {
      alert("Solo se permiten archivos PDF");
      return;
    }

    const uploadKey = subtopicIndex !== undefined 
      ? `topic-${topicIndex}-subtopic-${subtopicIndex}` 
      : `topic-${topicIndex}`;
    setUploading({ ...uploading, [uploadKey]: true });

    try {
      // Intentar obtener API key del localStorage, pero no es obligatorio
      // El backend puede usar la API key de .env.local si está configurada
      const apiKey = localStorage.getItem("openai_api_key");

      const formDataUpload = new FormData();
      formDataUpload.append("files", file);
      // Solo añadir API key si existe en localStorage, sino el backend usará la de .env.local
      if (apiKey) {
        formDataUpload.append("apiKey", apiKey);
      }

      const response = await fetch("/api/study-agents/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error al subir el archivo" }));
        throw new Error(errorData.error || "Error al subir el archivo");
      }

      const data = await response.json();
      if (data.success && data.data?.saved_paths) {
        // Las rutas ya vienen como /api/files/filename desde el backend
        const savedPath = data.data.saved_paths[0];
        if (subtopicIndex !== undefined) {
          // Añadir PDF a subapartado
          const newTopics = [...formData.topics];
          if (!newTopics[topicIndex].subtopics) {
            newTopics[topicIndex].subtopics = [];
          }
          const currentPdfs = newTopics[topicIndex].subtopics[subtopicIndex].pdfs || [];
          newTopics[topicIndex].subtopics[subtopicIndex].pdfs = [...currentPdfs, savedPath];
          setFormData({ ...formData, topics: newTopics });
        } else {
          // Añadir PDF al tema principal
          const currentPdfs = formData.topics[topicIndex].pdfs || [];
          handleTopicChange(topicIndex, "pdfs", [...currentPdfs, savedPath]);
        }
      }
    } catch (error) {
      console.error("Error subiendo PDF:", error);
      alert(error instanceof Error ? error.message : "Error al subir el archivo. Inténtalo de nuevo.");
    } finally {
      setUploading({ ...uploading, [uploadKey]: false });
    }
  };

  const handleUploadCoverImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Solo se permiten archivos de imagen");
      return;
    }

    setUploading({ ...uploading, coverImage: true });

    try {
      // Intentar obtener API key del localStorage, pero no es obligatorio
      // El backend puede usar la API key de .env.local si está configurada
      const apiKey = localStorage.getItem("openai_api_key");

      const formDataUpload = new FormData();
      formDataUpload.append("files", file);
      // Solo añadir API key si existe en localStorage, sino el backend usará la de .env.local
      if (apiKey) {
        formDataUpload.append("apiKey", apiKey);
      }

      const response = await fetch("/api/study-agents/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error al subir la imagen" }));
        throw new Error(errorData.error || "Error al subir la imagen");
      }

      const data = await response.json();
      if (data.success && data.data?.saved_paths) {
        // La URL ya viene completa desde el endpoint de Next.js
        const savedPath = data.data.saved_paths[0];
        setFormData({ ...formData, coverImage: savedPath });
      }
    } catch (error) {
      console.error("Error subiendo imagen:", error);
      alert(error instanceof Error ? error.message : "Error al subir la imagen. Inténtalo de nuevo.");
    } finally {
      setUploading({ ...uploading, coverImage: false });
    }
  };

  const handleUploadExamExample = async (file: File) => {
    if (!file.name.endsWith(".pdf")) {
      alert("Solo se permiten archivos PDF");
      return;
    }

    setUploading({ ...uploading, examExample: true });

    try {
      // Intentar obtener API key del localStorage, pero no es obligatorio
      // El backend puede usar la API key de .env.local si está configurada
      const apiKey = localStorage.getItem("openai_api_key");

      const formDataUpload = new FormData();
      formDataUpload.append("files", file);
      // Solo añadir API key si existe en localStorage, sino el backend usará la de .env.local
      if (apiKey) {
        formDataUpload.append("apiKey", apiKey);
      }

      const response = await fetch("/api/study-agents/upload", {
        method: "POST",
        body: formDataUpload,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error al subir el archivo" }));
        throw new Error(errorData.error || "Error al subir el archivo");
      }

      const data = await response.json();
      if (data.success && data.data?.saved_paths) {
        const savedPath = data.data.saved_paths[0];
        setFormData({
          ...formData,
          examExamples: [...formData.examExamples, savedPath],
        });
      }
    } catch (error) {
      console.error("Error subiendo PDF:", error);
      alert(error instanceof Error ? error.message : "Error al subir el archivo. Inténtalo de nuevo.");
    } finally {
      setUploading({ ...uploading, examExample: false });
    }
  };

  // Funciones para manejar flashcards por tema
  const handleAddFlashcard = (topicIndex: number) => {
    const newTopics = [...formData.topics];
    if (!newTopics[topicIndex].flashcards) {
      newTopics[topicIndex].flashcards = [];
    }
    newTopics[topicIndex].flashcards.push({
      question: "",
      correct_answer_index: 0, // Por defecto, la primera opción es la correcta
      options: ["", ""] // Mínimo 2 opciones
    });
    setFormData({ ...formData, topics: newTopics });
  };

  const handleRemoveFlashcard = (topicIndex: number, flashcardIndex: number) => {
    const newTopics = [...formData.topics];
    newTopics[topicIndex].flashcards = newTopics[topicIndex].flashcards.filter((_, i) => i !== flashcardIndex);
    setFormData({ ...formData, topics: newTopics });
  };

  const handleFlashcardChange = (
    topicIndex: number,
    flashcardIndex: number,
    field: "question" | "correct_answer_index" | "options",
    value: string | string[] | number
  ) => {
    const newTopics = [...formData.topics];
    if (field === "options") {
      newTopics[topicIndex].flashcards[flashcardIndex].options = value as string[];
    } else if (field === "correct_answer_index") {
      newTopics[topicIndex].flashcards[flashcardIndex].correct_answer_index = value as number;
    } else {
      (newTopics[topicIndex].flashcards[flashcardIndex] as any)[field] = value;
    }
    setFormData({ ...formData, topics: newTopics });
  };

  const handleAddOption = (topicIndex: number, flashcardIndex: number) => {
    const newTopics = [...formData.topics];
    const currentOptions = newTopics[topicIndex].flashcards[flashcardIndex].options;
    if (currentOptions.length < 4) {
      newTopics[topicIndex].flashcards[flashcardIndex].options = [...currentOptions, ""];
      setFormData({ ...formData, topics: newTopics });
    }
  };

  const handleRemoveOption = (topicIndex: number, flashcardIndex: number, optionIndex: number) => {
    const newTopics = [...formData.topics];
    const currentOptions = newTopics[topicIndex].flashcards[flashcardIndex].options;
    if (currentOptions.length > 2) {
      newTopics[topicIndex].flashcards[flashcardIndex].options = currentOptions.filter((_, i) => i !== optionIndex);
      setFormData({ ...formData, topics: newTopics });
    }
  };

  const handleOptionChange = (topicIndex: number, flashcardIndex: number, optionIndex: number, value: string) => {
    const newTopics = [...formData.topics];
    newTopics[topicIndex].flashcards[flashcardIndex].options[optionIndex] = value;
    setFormData({ ...formData, topics: newTopics });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user?.id) {
      alert("Debes estar autenticado para crear un curso");
      return;
    }

    if (!formData.title.trim()) {
      alert("El título es obligatorio");
      return;
    }

    if (!formData.description.trim()) {
      alert("La descripción es obligatoria");
      return;
    }

    if (formData.topics.length === 0 || formData.topics.some((t) => !t.name.trim())) {
      alert("Debes añadir al menos un tema con nombre");
      return;
    }

    // Verificar que cada tema tenga PDFs o subapartados con PDFs
    const hasValidContent = formData.topics.every((t) => {
      const hasTopicPdfs = t.pdfs && t.pdfs.length > 0;
      const hasSubtopicPdfs = t.subtopics && t.subtopics.some((st) => st.pdfs && st.pdfs.length > 0);
      return hasTopicPdfs || hasSubtopicPdfs;
    });
    
    if (!hasValidContent) {
      alert("Cada tema debe tener al menos un PDF (en el tema o en sus subapartados)");
      return;
    }
    
    // Verificar que los subapartados tengan nombre si existen
    const hasInvalidSubtopics = formData.topics.some((t) => 
      t.subtopics && t.subtopics.some((st) => !st.name.trim())
    );
    
    if (hasInvalidSubtopics) {
      alert("Todos los subapartados deben tener un título");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/study-agents/create-course", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          creatorId: session.user.id,
          title: formData.title,
          description: formData.description,
          price: formData.price,
          maxDurationDays: formData.maxDurationDays,
          coverImage: formData.coverImage,
          isExam: formData.isExam,
          topics: formData.topics,
          examExamples: formData.examExamples,
          availableTools: formData.availableTools,
          generateSummaries: formData.generateSummaries,
          additionalComments: formData.additionalComments,
          geminiModel: formData.geminiModel,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || "Error al crear el curso");
      }

      if (data.success && data.course) {
        // Si se están generando resúmenes, mostrar pantalla de progreso
        if (data.generating_summaries) {
          setCourseId(data.course.course_id);
          setShowProgress(true);
          setProgress({ percentage: 0, currentItem: "Iniciando...", status: "processing" });
          
          // Iniciar polling del progreso
          const pollProgress = async () => {
            const interval = setInterval(async () => {
              try {
                const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_URL || 'http://localhost:8000';
                const progressResponse = await fetch(`${FASTAPI_URL}/api/summary-progress/${data.course.course_id}`);
                const progressData = await progressResponse.json();
                
                if (progressData.status === "not_found") {
                  // Si no hay progreso, esperar un poco más
                  return;
                }
                
                setProgress({
                  percentage: progressData.percentage || 0,
                  currentItem: progressData.current_item || "",
                  status: progressData.status || "processing"
                });
                
                // Si está completado, redirigir
                if (progressData.completed || progressData.status === "completed") {
                  clearInterval(interval);
                  setTimeout(() => {
                    router.push(`/study-agents/course/${data.course.course_id}`);
                  }, 1000);
                }
              } catch (error) {
                console.error("Error obteniendo progreso:", error);
              }
            }, 1000); // Poll cada segundo
            
            // Limpiar intervalo después de 10 minutos (timeout de seguridad)
            setTimeout(() => {
              clearInterval(interval);
              if (showProgress) {
                router.push(`/study-agents/course/${data.course.course_id}`);
              }
            }, 600000);
          };
          
          pollProgress();
        } else {
          // Si no se generan resúmenes, redirigir directamente
          router.push(`/study-agents/course/${data.course.course_id}`);
        }
      }
    } catch (error) {
      console.error("Error creando curso:", error);
      alert(error instanceof Error ? error.message : "Error al crear el curso");
      setLoading(false);
      setShowProgress(false);
    }
  };

  if (!session) {
    return null;
  }

  return (
    <div style={{ 
      minHeight: "100vh",
      background: "var(--bg-primary)",
      padding: "0"
    }}>
      {/* Hero Section */}
      <div style={{
        padding: "4rem 2rem 3rem",
        maxWidth: "1200px",
        margin: "0 auto",
      }}>
        <Link
          href="/study-agents"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            color: "var(--text-secondary)",
            textDecoration: "none",
            marginBottom: "2rem",
            fontSize: "0.95rem",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
          onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
        >
          <HiArrowLeft size={18} /> Volver
        </Link>

        <h1 style={{ 
          fontSize: "clamp(2rem, 4vw, 3rem)", 
          fontWeight: "700", 
          marginBottom: "0.75rem",
          color: "var(--text-primary)",
          letterSpacing: "-0.03em",
          lineHeight: "1.1"
        }}>
          Crear Nuevo Curso
        </h1>
        <p style={{ 
          color: "var(--text-secondary)", 
          fontSize: "1.1rem",
          maxWidth: "600px"
        }}>
          Configura tu curso con los temas, documentos y herramientas disponibles
        </p>
      </div>

      {/* Form Content */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 2rem 3rem" }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
          {/* Foto de Portada */}
          <div style={{ 
            background: "var(--bg-overlay-02)", 
            padding: "2.5rem", 
            borderRadius: "16px", 
            border: "1px solid var(--border-overlay-05)",
          }}>
            <h2 style={{ 
              fontSize: "1.25rem", 
              fontWeight: "600", 
              marginBottom: "1.5rem",
              color: "var(--text-primary)"
            }}>
              Foto de Portada
            </h2>
            <div style={{ display: "flex", gap: "2rem", alignItems: "flex-start" }}>
              {formData.coverImage ? (
                <div style={{ 
                  position: "relative", 
                  width: "280px", 
                  height: "160px", 
                  borderRadius: "12px", 
                  overflow: "hidden",
                  border: "1px solid var(--border-overlay-1)"
                }}>
                  <img
                    src={formData.coverImage}
                    alt="Portada"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, coverImage: null })}
                    style={{
                      position: "absolute",
                      top: "0.75rem",
                      right: "0.75rem",
                      padding: "0.5rem",
                      background: "rgba(0, 0, 0, 0.8)",
                      backdropFilter: "blur(10px)",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239, 68, 68, 0.9)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(0, 0, 0, 0.8)"}
                  >
                    <HiXMark size={18} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => coverImageInputRef.current?.click()}
                  style={{
                    width: "280px",
                    height: "160px",
                    border: "1px solid var(--border-overlay-1)",
                    borderRadius: "12px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background: "var(--bg-overlay-02)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.5)";
                    e.currentTarget.style.background = "rgba(99, 102, 241, 0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                    e.currentTarget.style.background = "var(--bg-overlay-02)";
                  }}
                >
                  <HiPhoto size={40} color="var(--text-muted)" />
                  <div style={{ 
                    fontSize: "0.9rem", 
                    color: "var(--text-secondary)",
                    marginTop: "0.75rem",
                    fontWeight: "500"
                  }}>
                    Añadir portada
                  </div>
                  <div style={{ 
                    fontSize: "0.75rem", 
                    color: "var(--text-muted)",
                    marginTop: "0.5rem"
                  }}>
                    1200x600px
                  </div>
                </div>
              )}
              <input
                ref={(el) => (coverImageInputRef.current = el)}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleUploadCoverImage(file);
                }}
                style={{ display: "none" }}
              />
              <div style={{ flex: 1, fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: "1.6" }}>
                <p style={{ marginBottom: "0.75rem", fontWeight: "500", color: "var(--text-secondary)" }}>
                  Añade una imagen de portada para tu curso.
                </p>
                <p style={{ fontSize: "0.85rem" }}>
                  Recomendado: 1200x600px, formato JPG o PNG. La imagen aparecerá en la tarjeta del curso.
                </p>
              </div>
            </div>
          </div>

          {/* Información Básica */}
          <div style={{ 
            background: "var(--bg-overlay-02)", 
            padding: "2.5rem", 
            borderRadius: "16px", 
            border: "1px solid var(--border-overlay-05)",
          }}>
            <h2 style={{ 
              fontSize: "clamp(1.75rem, 3vw, 2.5rem)", 
              fontWeight: "700", 
              marginBottom: "2.5rem",
              color: "var(--text-primary)",
              letterSpacing: "-0.02em",
              lineHeight: "1.2"
            }}>
              Información Básica
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "0.75rem", 
                  fontWeight: "500", 
                  fontSize: "0.95rem",
                  color: "var(--text-primary)"
                }}>
                  Título del Curso/Examen *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  style={{
                    width: "100%",
                    padding: "1.5rem 1.75rem",
                    background: "var(--bg-overlay-05)",
                    border: "1px solid var(--border-overlay-1)",
                    borderRadius: "12px",
                    color: "var(--text-primary)",
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.5)";
                    e.currentTarget.style.background = "var(--bg-overlay-08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                    e.currentTarget.style.background = "var(--bg-overlay-05)";
                  }}
                  placeholder="Ej: Examen Final de Bases de Datos"
                />
              </div>

              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "0.75rem", 
                  fontWeight: "500", 
                  fontSize: "0.95rem",
                  color: "var(--text-primary)"
                }}>
                  Descripción *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  style={{
                    width: "100%",
                    padding: "1rem 1.25rem",
                    background: "var(--bg-overlay-05)",
                    border: "1px solid var(--border-overlay-1)",
                    borderRadius: "10px",
                    color: "var(--text-primary)",
                    fontSize: "1rem",
                    fontFamily: "inherit",
                    resize: "vertical",
                    transition: "all 0.2s",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.5)";
                    e.currentTarget.style.background = "var(--bg-overlay-08)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                    e.currentTarget.style.background = "var(--bg-overlay-05)";
                  }}
                  placeholder="Describe el contenido del curso y qué se estudiará..."
                />
              </div>

              {/* Tipo: Curso o Examen */}
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "1rem", 
                  fontWeight: "500", 
                  fontSize: "0.95rem",
                  color: "var(--text-primary)"
                }}>
                  Tipo *
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div
                    onClick={() => setFormData({ ...formData, isExam: false })}
                    style={{
                      padding: "1.5rem",
                      background: formData.isExam ? "var(--bg-overlay-05)" : "rgba(99, 102, 241, 0.15)",
                      border: formData.isExam 
                        ? "2px solid var(--border-overlay-1)" 
                        : "2px solid rgba(99, 102, 241, 0.5)",
                      borderRadius: "12px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      transform: formData.isExam ? "scale(1)" : "scale(1.02)",
                      boxShadow: formData.isExam ? "none" : "0 4px 20px rgba(99, 102, 241, 0.2)",
                    }}
                    onMouseEnter={(e) => {
                      if (!formData.isExam) return;
                      e.currentTarget.style.background = "var(--bg-overlay-08)";
                      e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      if (!formData.isExam) return;
                      e.currentTarget.style.background = "var(--bg-overlay-05)";
                      e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                    }}
                  >
                    <div style={{ 
                      fontSize: "1.25rem", 
                      fontWeight: "700", 
                      color: formData.isExam ? "var(--text-secondary)" : "#6366f1",
                      marginBottom: "0.5rem"
                    }}>
                      Curso
                    </div>
                    <div style={{ 
                      fontSize: "0.9rem", 
                      color: formData.isExam ? "var(--text-muted)" : "var(--text-secondary)"
                    }}>
                      Preparación continua
                    </div>
                  </div>
                  
                  <div
                    onClick={() => setFormData({ ...formData, isExam: true })}
                    style={{
                      padding: "1.5rem",
                      background: formData.isExam ? "rgba(139, 92, 246, 0.15)" : "var(--bg-overlay-05)",
                      border: formData.isExam 
                        ? "2px solid rgba(139, 92, 246, 0.5)" 
                        : "2px solid var(--border-overlay-1)",
                      borderRadius: "12px",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      transform: formData.isExam ? "scale(1.02)" : "scale(1)",
                      boxShadow: formData.isExam ? "0 4px 20px rgba(139, 92, 246, 0.2)" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (formData.isExam) return;
                      e.currentTarget.style.background = "var(--bg-overlay-08)";
                      e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      if (formData.isExam) return;
                      e.currentTarget.style.background = "var(--bg-overlay-05)";
                      e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                    }}
                  >
                    <div style={{ 
                      fontSize: "1.25rem", 
                      fontWeight: "700", 
                      color: formData.isExam ? "#8b5cf6" : "var(--text-secondary)",
                      marginBottom: "0.5rem"
                    }}>
                      Examen
                    </div>
                    <div style={{ 
                      fontSize: "0.9rem", 
                      color: formData.isExam ? "var(--text-secondary)" : "var(--text-muted)"
                    }}>
                      Preparación para examen específico
                    </div>
                  </div>
                </div>
              </div>

              {/* Precio: Selector de Plan */}
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "1.5rem", 
                  fontWeight: "500", 
                  fontSize: "0.95rem",
                  color: "var(--text-primary)"
                }}>
                  Precio de Curso *
                </label>
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(3, 1fr)", 
                  gap: "1.25rem"
                }}>
                  {[
                    { price: 0, name: "Gratis", ai: 0, platform: 0, creator: 0 },
                    { price: 2, name: "Básico", ai: 1.0, platform: 0.5, creator: 0.5 },
                    { price: 5, name: "Estándar", ai: 3.0, platform: 1.0, creator: 1.0 },
                    { price: 10, name: "Premium", ai: 6.0, platform: 2.0, creator: 2.0 },
                    { price: 20, name: "Pro", ai: 10.0, platform: 6.0, creator: 4.0 },
                    { price: 50, name: "Enterprise", ai: 20.0, platform: 20.0, creator: 10.0 },
                  ].map((plan) => (
                    <div
                      key={plan.price}
                      onClick={() => setFormData({ ...formData, price: plan.price })}
                      style={{
                        padding: "1.5rem",
                        background: formData.price === plan.price 
                          ? "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)" 
                          : "var(--bg-overlay-05)",
                        border: formData.price === plan.price 
                          ? "2px solid rgba(99, 102, 241, 0.6)" 
                          : "2px solid var(--border-overlay-1)",
                        borderRadius: "16px",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        transform: formData.price === plan.price ? "scale(1.03)" : "scale(1)",
                        boxShadow: formData.price === plan.price 
                          ? "0 8px 30px rgba(99, 102, 241, 0.3)" 
                          : "none",
                        position: "relative",
                        overflow: "hidden",
                      }}
                      onMouseEnter={(e) => {
                        if (formData.price === plan.price) return;
                        e.currentTarget.style.background = "var(--bg-overlay-08)";
                        e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
                        e.currentTarget.style.transform = "scale(1.02)";
                        e.currentTarget.style.boxShadow = "0 4px 20px rgba(99, 102, 241, 0.15)";
                      }}
                      onMouseLeave={(e) => {
                        if (formData.price === plan.price) return;
                        e.currentTarget.style.background = "var(--bg-overlay-05)";
                        e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {/* Badge de selección */}
                      {formData.price === plan.price && (
                        <div style={{
                          position: "absolute",
                          top: "0.75rem",
                          right: "0.75rem",
                          padding: "0.25rem 0.75rem",
                          background: "rgba(99, 102, 241, 0.9)",
                          borderRadius: "20px",
                          fontSize: "0.7rem",
                          fontWeight: "700",
                          color: "var(--text-primary)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}>
                          Seleccionado
                        </div>
                      )}
                      
                      {/* Nombre del plan */}
                      <div style={{ 
                        fontSize: "0.85rem", 
                        fontWeight: "600", 
                          color: formData.price === plan.price 
                          ? "rgba(99, 102, 241, 1)" 
                          : "var(--text-secondary)",
                        marginBottom: "0.5rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}>
                        {plan.name}
                      </div>
                      
                      {/* Precio */}
                      <div style={{ 
                        fontSize: "2rem", 
                        fontWeight: "700", 
                        color: formData.price === plan.price ? "#6366f1" : "var(--text-primary)",
                        marginBottom: "0.75rem",
                        lineHeight: "1"
                      }}>
                        {plan.price === 0 ? "Gratis" : `${plan.price}€`}
                      </div>
                      
                      {/* Divider */}
                      <div style={{
                        height: "1px",
                        background: formData.price === plan.price 
                          ? "rgba(99, 102, 241, 0.3)" 
                          : "var(--border-overlay-1)",
                        margin: "1rem 0",
                      }} />
                      
                      {/* Condiciones */}
                      <div style={{ 
                        display: "flex", 
                        flexDirection: "column", 
                        gap: "0.75rem",
                        fontSize: "0.8rem",
                      }}>
                        {plan.price === 0 ? (
                          <div style={{ 
                            color: formData.price === plan.price 
                              ? "var(--text-primary)" 
                              : "var(--text-secondary)",
                            textAlign: "center",
                            padding: "0.75rem 0",
                            fontSize: "0.85rem",
                          }}>
                            <div style={{ marginBottom: "0.5rem", fontWeight: "600" }}>Modelo Gratuito</div>
                            <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                              Sin créditos de IA
                            </div>
                          </div>
                        ) : (
                          <>
                            <div style={{
                              fontSize: "0.75rem",
                              color: formData.price === plan.price 
                                ? "var(--text-primary)" 
                                : "var(--text-secondary)",
                              marginBottom: "0.25rem",
                              fontWeight: "600",
                            }}>
                              Distribución por venta:
                            </div>
                            <div style={{ 
                              display: "flex", 
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "0.5rem 0",
                              borderBottom: "1px solid var(--border-overlay-05)",
                            }}>
                              <div>
                                <div style={{ 
                                  color: formData.price === plan.price 
                                    ? "var(--text-primary)" 
                                    : "var(--text-secondary)",
                                  fontWeight: "500",
                                }}>
                                  Créditos IA
                                </div>
                                <div style={{ 
                                  fontSize: "0.7rem",
                                  color: formData.price === plan.price 
                                    ? "var(--text-secondary)" 
                                    : "var(--text-muted)",
                                  marginTop: "0.15rem",
                                }}>
                                  Para el estudiante
                                </div>
                              </div>
                              <span style={{ 
                                fontWeight: "700", 
                                fontSize: "1rem",
                                color: formData.price === plan.price ? "#6366f1" : "var(--text-primary)"
                              }}>
                                {plan.ai}€
                              </span>
                            </div>
                            <div style={{ 
                              display: "flex", 
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "0.5rem 0",
                              borderBottom: "1px solid var(--border-overlay-05)",
                            }}>
                              <div>
                                <div style={{ 
                                  color: formData.price === plan.price 
                                    ? "var(--text-primary)" 
                                    : "var(--text-secondary)",
                                  fontWeight: "500",
                                }}>
                                  Plataforma
                                </div>
                                <div style={{ 
                                  fontSize: "0.7rem",
                                  color: formData.price === plan.price 
                                    ? "var(--text-secondary)" 
                                    : "var(--text-muted)",
                                  marginTop: "0.15rem",
                                }}>
                                  Comisión
                                </div>
                              </div>
                              <span style={{ 
                                fontWeight: "700", 
                                fontSize: "1rem",
                                color: formData.price === plan.price ? "var(--text-on-accent)" : "var(--text-secondary)"
                              }}>
                                {plan.platform}€
                              </span>
                            </div>
                            <div style={{ 
                              display: "flex", 
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "0.5rem 0",
                              background: formData.price === plan.price 
                                ? "rgba(99, 102, 241, 0.1)" 
                                : "transparent",
                              borderRadius: "8px",
                              marginTop: "0.25rem",
                              padding: "0.75rem",
                            }}>
                              <div>
                                <div style={{ 
                                  color: formData.price === plan.price 
                                    ? "#6366f1" 
                                    : "var(--text-secondary)",
                                  fontWeight: "600",
                                }}>
                                  Tus Ingresos
                                </div>
                                <div style={{ 
                                  fontSize: "0.7rem",
                                  color: formData.price === plan.price 
                                    ? "rgba(99, 102, 241, 0.8)" 
                                    : "var(--text-muted)",
                                  marginTop: "0.15rem",
                                }}>
                                  Por cada venta
                                </div>
                              </div>
                              <span style={{ 
                                fontWeight: "700", 
                                fontSize: "1.25rem",
                                color: formData.price === plan.price ? "#6366f1" : "var(--text-primary)"
                              }}>
                                {plan.creator}€
                              </span>
                            </div>
                            <div style={{
                              marginTop: "0.5rem",
                              padding: "0.5rem",
                              background: formData.price === plan.price 
                                ? "rgba(99, 102, 241, 0.05)" 
                                : "var(--bg-overlay-02)",
                              borderRadius: "8px",
                              fontSize: "0.7rem",
                              color: formData.price === plan.price 
                                ? "var(--text-primary)" 
                                : "var(--text-secondary)",
                              textAlign: "center",
                              lineHeight: "1.4",
                            }}>
                              Total: {plan.price}€
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Duración Máxima */}
              <div>
                <label style={{ 
                  display: "block", 
                  marginBottom: "0.75rem", 
                  fontWeight: "500", 
                  fontSize: "0.95rem",
                  color: "var(--text-primary)"
                }}>
                  Duración Máxima (días)
                </label>
                <input
                  type="number"
                  value={formData.maxDurationDays || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxDurationDays: e.target.value ? parseInt(e.target.value) : null,
                    })
                  }
                  min={1}
                  style={{
                    width: "100%",
                    padding: "1rem 1.25rem",
                    background: "var(--bg-overlay-05)",
                    border: "1px solid var(--border-overlay-1)",
                    borderRadius: "10px",
                    color: "var(--text-primary)",
                    fontSize: "1rem",
                  }}
                  placeholder="Opcional"
                />
              </div>
            </div>
          </div>

          {/* Temas */}
          <div style={{ 
            background: "var(--bg-overlay-02)", 
            padding: "2.5rem", 
            borderRadius: "16px", 
            border: "1px solid var(--border-overlay-05)",
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", color: "var(--text-primary)", marginBottom: "2rem" }}>Temas del Curso *</h2>

            {formData.topics.map((topic, index) => (
              <div
                key={index}
                style={{
                  padding: "2rem",
                  background: "linear-gradient(135deg, var(--bg-overlay-05) 0%, var(--bg-overlay-02) 100%)",
                  borderRadius: "16px",
                  marginBottom: "1.5rem",
                  border: "2px solid var(--border-overlay-1)",
                  transition: "all 0.3s ease",
                  position: "relative",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                  e.currentTarget.style.boxShadow = "0 8px 30px rgba(99, 102, 241, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Header del Tema con Indexación */}
                <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2rem" }}>
                  <div style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "14px",
                    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.2) 100%)",
                    border: "2px solid rgba(99, 102, 241, 0.4)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: "#6366f1",
                    flexShrink: 0,
                    boxShadow: "0 4px 15px rgba(99, 102, 241, 0.2)",
                  }}>
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <input
                    type="text"
                    value={topic.name}
                    onChange={(e) => handleTopicChange(index, "name", e.target.value)}
                    placeholder="Nombre del tema"
                    required
                    style={{
                      flex: 1,
                      padding: "1.25rem 1.75rem",
                      background: "var(--bg-overlay-05)",
                      border: "2px solid var(--border-overlay-1)",
                      borderRadius: "12px",
                      color: "var(--text-primary)",
                      fontSize: "1.15rem",
                      fontWeight: "600",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.5)";
                      e.currentTarget.style.background = "var(--bg-overlay-08)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                      e.currentTarget.style.background = "var(--bg-overlay-05)";
                    }}
                  />
                  {formData.topics.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(index)}
                      style={{
                        padding: "0.75rem 1rem",
                        background: "rgba(239, 68, 68, 0.1)",
                        color: "#ef4444",
                        border: "2px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: "10px",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                        fontWeight: "700",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                        e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)";
                        e.currentTarget.style.transform = "scale(1.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                        e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                        e.currentTarget.style.transform = "scale(1)";
                      }}
                    >
                      <HiXMark size={18} />
                    </button>
                  )}
                </div>

                {/* PDFs del Tema Principal (Opcional) */}
                <div style={{ marginBottom: "2rem" }}>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: "1rem"
                  }}>
                    <label style={{ 
                      fontSize: "0.95rem", 
                      color: "var(--text-secondary)",
                      fontWeight: "600"
                    }}>
                      PDFs del tema (opcional)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const inputId = `topic-${index}`;
                        if (!fileInputRefs.current[inputId]) {
                          const input = document.createElement("input");
                          input.type = "file";
                          input.accept = ".pdf";
                          input.multiple = true;
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files;
                            if (files) {
                              Array.from(files).forEach((file) => handleUploadPDF(index, file));
                            }
                          };
                          fileInputRefs.current[inputId] = input;
                        }
                        fileInputRefs.current[inputId]?.click();
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1.25rem",
                        background: "rgba(99, 102, 241, 0.15)",
                        border: "2px solid rgba(99, 102, 241, 0.3)",
                        borderRadius: "10px",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        fontSize: "0.9rem",
                        color: "#6366f1",
                        fontWeight: "700",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.5)";
                        e.currentTarget.style.background = "rgba(99, 102, 241, 0.25)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 15px rgba(99, 102, 241, 0.2)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                        e.currentTarget.style.background = "rgba(99, 102, 241, 0.15)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <TbFileUpload size={18} /> Añadir
                    </button>
                  </div>

                  {uploading[`topic-${index}`] && (
                    <div style={{ 
                      padding: "1rem", 
                      background: "rgba(99, 102, 241, 0.1)", 
                      borderRadius: "10px",
                      color: "var(--text-secondary)",
                      fontSize: "0.9rem",
                      textAlign: "center",
                      marginBottom: "1rem"
                    }}>
                      Subiendo archivo...
                    </div>
                  )}
                  {topic.pdfs && topic.pdfs.length > 0 && (
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", 
                      gap: "1rem"
                    }}>
                      {topic.pdfs.map((pdf, pdfIndex) => (
                        <div
                          key={pdfIndex}
                          style={{
                            padding: "1rem 1.25rem",
                            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)",
                            borderRadius: "12px",
                            border: "2px solid rgba(99, 102, 241, 0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "0.75rem",
                            transition: "all 0.3s ease",
                            position: "relative",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
                            e.currentTarget.style.background = "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)";
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = "0 4px 15px rgba(99, 102, 241, 0.2)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.2)";
                            e.currentTarget.style.background = "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flex: 1, minWidth: 0 }}>
                            <HiDocumentText size={20} color="#6366f1" />
                            <span style={{ 
                              fontSize: "0.85rem",
                              color: "var(--text-primary)",
                              fontWeight: "500",
                              overflow: "hidden", 
                              textOverflow: "ellipsis", 
                              whiteSpace: "nowrap"
                            }}>
                              {pdf.split("/").pop()}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newPdfs = topic.pdfs.filter((_, i) => i !== pdfIndex);
                              handleTopicChange(index, "pdfs", newPdfs);
                            }}
                            style={{
                              background: "rgba(239, 68, 68, 0.1)",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              color: "#ef4444",
                              cursor: "pointer",
                              padding: "0.5rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              borderRadius: "8px",
                              transition: "all 0.2s",
                              flexShrink: 0,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)";
                              e.currentTarget.style.transform = "scale(1.1)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                              e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                          >
                            <HiXMark size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Subapartados */}
                <div>
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginBottom: "1.5rem"
                  }}>
                    <label style={{ 
                      fontSize: "1rem", 
                      color: "var(--text-primary)",
                      fontWeight: "600"
                    }}>
                      Subapartados
                    </label>
                  </div>

                  {topic.subtopics && topic.subtopics.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "1.5rem" }}>
                      {topic.subtopics.map((subtopic, subtopicIndex) => (
                        <div
                          key={subtopicIndex}
                          style={{
                            padding: "1.5rem",
                            background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)",
                            borderRadius: "14px",
                            border: "2px solid rgba(139, 92, 246, 0.2)",
                            transition: "all 0.3s ease",
                            position: "relative",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.4)";
                            e.currentTarget.style.boxShadow = "0 4px 20px rgba(139, 92, 246, 0.15)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.2)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1.25rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flex: 1 }}>
                              <div style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "10px",
                                background: "linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(99, 102, 241, 0.2) 100%)",
                                border: "2px solid rgba(139, 92, 246, 0.4)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.9rem",
                                fontWeight: "700",
                                color: "#8b5cf6",
                                flexShrink: 0,
                                boxShadow: "0 2px 10px rgba(139, 92, 246, 0.2)",
                              }}>
                                {String(index + 1).padStart(2, '0')}.{String(subtopicIndex + 1).padStart(2, '0')}
                              </div>
                              <input
                                type="text"
                                value={subtopic.name}
                                onChange={(e) => handleSubtopicChange(index, subtopicIndex, "name", e.target.value)}
                                placeholder="Título del subapartado"
                                required
                                style={{
                                  flex: 1,
                                  padding: "0.875rem 1.25rem",
                                  background: "var(--bg-overlay-05)",
                                  border: "2px solid var(--border-overlay-1)",
                                  borderRadius: "10px",
                                  color: "var(--text-primary)",
                                  fontSize: "1rem",
                                  fontWeight: "500",
                                  transition: "all 0.2s",
                                }}
                                onFocus={(e) => {
                                  e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.5)";
                                  e.currentTarget.style.background = "var(--bg-overlay-08)";
                                }}
                                onBlur={(e) => {
                                  e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                                  e.currentTarget.style.background = "var(--bg-overlay-05)";
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveSubtopic(index, subtopicIndex)}
                              style={{
                                padding: "0.625rem 0.875rem",
                                background: "rgba(239, 68, 68, 0.1)",
                                color: "#ef4444",
                                border: "2px solid rgba(239, 68, 68, 0.3)",
                                borderRadius: "10px",
                                cursor: "pointer",
                                fontSize: "0.8rem",
                                fontWeight: "700",
                                transition: "all 0.2s",
                                marginLeft: "0.75rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)";
                                e.currentTarget.style.transform = "scale(1.05)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                                e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                                e.currentTarget.style.transform = "scale(1)";
                              }}
                            >
                              <HiXMark size={16} />
                            </button>
                          </div>

                          {/* PDFs del Subapartado */}
                          <div>
                            <div style={{ 
                              display: "flex", 
                              justifyContent: "space-between", 
                              alignItems: "center",
                              marginBottom: "1rem"
                            }}>
                              <span style={{ 
                                fontSize: "0.9rem", 
                                color: "var(--text-secondary)",
                                fontWeight: "500"
                              }}>
                                Documentos
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const inputId = `topic-${index}-subtopic-${subtopicIndex}`;
                                  if (!fileInputRefs.current[inputId]) {
                                    const input = document.createElement("input");
                                    input.type = "file";
                                    input.accept = ".pdf";
                                    input.multiple = true;
                                    input.onchange = (e) => {
                                      const files = (e.target as HTMLInputElement).files;
                                      if (files) {
                                        Array.from(files).forEach((file) => handleUploadPDF(index, file, subtopicIndex));
                                      }
                                    };
                                    fileInputRefs.current[inputId] = input;
                                  }
                                  fileInputRefs.current[inputId]?.click();
                                }}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.5rem",
                                  padding: "0.625rem 1rem",
                                  background: "rgba(139, 92, 246, 0.15)",
                                  border: "2px solid rgba(139, 92, 246, 0.3)",
                                  borderRadius: "10px",
                                  cursor: "pointer",
                                  transition: "all 0.3s ease",
                                  fontSize: "0.85rem",
                                  color: "#8b5cf6",
                                  fontWeight: "700",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.5)";
                                  e.currentTarget.style.background = "rgba(139, 92, 246, 0.25)";
                                  e.currentTarget.style.transform = "translateY(-2px)";
                                  e.currentTarget.style.boxShadow = "0 4px 15px rgba(139, 92, 246, 0.2)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.3)";
                                  e.currentTarget.style.background = "rgba(139, 92, 246, 0.15)";
                                  e.currentTarget.style.transform = "translateY(0)";
                                  e.currentTarget.style.boxShadow = "none";
                                }}
                              >
                                <TbFileUpload size={16} /> Añadir
                              </button>
                            </div>

                            {uploading[`topic-${index}-subtopic-${subtopicIndex}`] && (
                              <div style={{ 
                                padding: "0.875rem", 
                                background: "rgba(139, 92, 246, 0.1)", 
                                borderRadius: "10px",
                                color: "var(--text-secondary)",
                                fontSize: "0.85rem",
                                textAlign: "center",
                                marginBottom: "1rem"
                              }}>
                                Subiendo archivo...
                              </div>
                            )}
                            {subtopic.pdfs && subtopic.pdfs.length > 0 && (
                              <div style={{ 
                                display: "grid", 
                                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", 
                                gap: "0.875rem"
                              }}>
                                {subtopic.pdfs.map((pdf, pdfIndex) => (
                                  <div
                                    key={pdfIndex}
                                    style={{
                                      padding: "0.875rem 1rem",
                                      background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)",
                                      borderRadius: "10px",
                                      border: "2px solid rgba(139, 92, 246, 0.25)",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: "0.5rem",
                                      transition: "all 0.3s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.4)";
                                      e.currentTarget.style.background = "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.15) 100%)";
                                      e.currentTarget.style.transform = "translateY(-2px)";
                                      e.currentTarget.style.boxShadow = "0 4px 15px rgba(139, 92, 246, 0.2)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.25)";
                                      e.currentTarget.style.background = "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(99, 102, 241, 0.1) 100%)";
                                      e.currentTarget.style.transform = "translateY(0)";
                                      e.currentTarget.style.boxShadow = "none";
                                    }}
                                  >
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", flex: 1, minWidth: 0 }}>
                                      <HiDocumentText size={18} color="#8b5cf6" />
                                      <span style={{ 
                                        fontSize: "0.8rem",
                                        color: "var(--text-primary)",
                                        fontWeight: "500",
                                        overflow: "hidden", 
                                        textOverflow: "ellipsis", 
                                        whiteSpace: "nowrap"
                                      }}>
                                        {pdf.split("/").pop()}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newTopics = [...formData.topics];
                                        const newPdfs = subtopic.pdfs.filter((_, i) => i !== pdfIndex);
                                        newTopics[index].subtopics[subtopicIndex].pdfs = newPdfs;
                                        setFormData({ ...formData, topics: newTopics });
                                      }}
                                      style={{
                                        background: "rgba(239, 68, 68, 0.1)",
                                        border: "1px solid rgba(239, 68, 68, 0.3)",
                                        color: "#ef4444",
                                        cursor: "pointer",
                                        padding: "0.375rem",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: "6px",
                                        transition: "all 0.2s",
                                        flexShrink: 0,
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                                        e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.5)";
                                        e.currentTarget.style.transform = "scale(1.1)";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                                        e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                                        e.currentTarget.style.transform = "scale(1)";
                                      }}
                                    >
                                      <HiXMark size={14} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Botón grande para añadir subapartado */}
                  <button
                    type="button"
                    onClick={() => handleAddSubtopic(index)}
                    style={{
                      width: "100%",
                      padding: "1.5rem",
                      background: "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)",
                      border: "2px dashed rgba(139, 92, 246, 0.4)",
                      borderRadius: "14px",
                      cursor: "pointer",
                      fontSize: "1rem",
                      fontWeight: "700",
                      color: "#8b5cf6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.75rem",
                      transition: "all 0.3s ease",
                      marginTop: topic.subtopics && topic.subtopics.length > 0 ? "0" : "0",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(99, 102, 241, 0.1) 100%)";
                      e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.6)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 8px 25px rgba(139, 92, 246, 0.25)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%)";
                      e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.4)";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <HiPlus size={22} />
                    <span>Añadir Subapartado</span>
                  </button>
                </div>

                {/* Flashcards del Tema */}
                {formData.availableTools.flashcards && (
                  <div style={{ marginTop: "2rem" }}>
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center",
                      marginBottom: "1.5rem"
                    }}>
                      <label style={{ 
                        fontSize: "1rem", 
                        color: "var(--text-primary)",
                        fontWeight: "600"
                      }}>
                        Flashcards del Tema (Opcional)
                      </label>
                      <button
                        type="button"
                        onClick={() => handleAddFlashcard(index)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.75rem 1.25rem",
                          background: "rgba(99, 102, 241, 0.15)",
                          border: "2px solid rgba(99, 102, 241, 0.3)",
                          borderRadius: "10px",
                          cursor: "pointer",
                          fontSize: "0.9rem",
                          fontWeight: "700",
                          color: "#6366f1",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "rgba(99, 102, 241, 0.25)";
                          e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.5)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "rgba(99, 102, 241, 0.15)";
                          e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }}
                      >
                        <HiPlus size={18} /> Añadir Flashcard
                      </button>
                    </div>

                    {topic.flashcards && topic.flashcards.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        {topic.flashcards.map((flashcard, flashcardIndex) => (
                          <div
                            key={flashcardIndex}
                            style={{
                              padding: "1.5rem",
                              background: "var(--bg-card)",
                              borderRadius: "12px",
                              border: "2px solid var(--border-subtle)",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                              <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "var(--text-secondary)" }}>
                                Flashcard {flashcardIndex + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveFlashcard(index, flashcardIndex)}
                                style={{
                                  padding: "0.5rem",
                                  background: "rgba(239, 68, 68, 0.1)",
                                  color: "#ef4444",
                                  border: "1px solid rgba(239, 68, 68, 0.3)",
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <HiXMark size={16} />
                              </button>
                            </div>

                            {/* Pregunta */}
                            <div style={{ marginBottom: "1rem" }}>
                              <label style={{ 
                                display: "block", 
                                marginBottom: "0.5rem", 
                                fontSize: "0.9rem",
                                fontWeight: "500",
                                color: "var(--text-secondary)"
                              }}>
                                Pregunta *
                              </label>
                              <input
                                type="text"
                                value={flashcard.question}
                                onChange={(e) => handleFlashcardChange(index, flashcardIndex, "question", e.target.value)}
                                placeholder="Ej: ¿Qué es Python?"
                                required
                                style={{
                                  width: "100%",
                                  padding: "0.875rem 1rem",
                                  background: "var(--bg-overlay-05)",
                                  border: "2px solid var(--border-overlay-1)",
                                  borderRadius: "10px",
                                  color: "var(--text-primary)",
                                  fontSize: "0.95rem",
                                }}
                              />
                            </div>

                            {/* Opciones (2-4) con selección de respuesta correcta */}
                            <div>
                              <label style={{ 
                                display: "block", 
                                marginBottom: "0.75rem", 
                                fontSize: "0.9rem",
                                fontWeight: "500",
                                color: "var(--text-secondary)"
                              }}>
                                Opciones de Respuesta (2-4) - Selecciona la correcta *
                              </label>
                              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {flashcard.options.map((option, optionIndex) => (
                                  <div 
                                    key={optionIndex} 
                                    style={{ 
                                      display: "flex", 
                                      gap: "0.75rem", 
                                      alignItems: "center",
                                      padding: "0.75rem",
                                      background: flashcard.correct_answer_index === optionIndex 
                                        ? "rgba(99, 102, 241, 0.1)" 
                                        : "var(--bg-overlay-02)",
                                      border: flashcard.correct_answer_index === optionIndex
                                        ? "2px solid rgba(99, 102, 241, 0.5)"
                                        : "2px solid var(--border-overlay-1)",
                                      borderRadius: "10px",
                                      transition: "all 0.2s",
                                    }}
                                  >
                                    {/* Radio button para seleccionar respuesta correcta */}
                                    <input
                                      type="radio"
                                      name={`flashcard-${index}-${flashcardIndex}-correct`}
                                      checked={flashcard.correct_answer_index === optionIndex}
                                      onChange={() => handleFlashcardChange(index, flashcardIndex, "correct_answer_index", optionIndex)}
                                      style={{
                                        width: "20px",
                                        height: "20px",
                                        cursor: "pointer",
                                        accentColor: "#6366f1",
                                      }}
                                    />
                                    <input
                                      type="text"
                                      value={option}
                                      onChange={(e) => handleOptionChange(index, flashcardIndex, optionIndex, e.target.value)}
                                      placeholder={`Opción ${optionIndex + 1}`}
                                      required
                                      style={{
                                        flex: 1,
                                        padding: "0.75rem 1rem",
                                        background: "transparent",
                                        border: "none",
                                        color: "var(--text-primary)",
                                        fontSize: "0.9rem",
                                      }}
                                    />
                                    {flashcard.options.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          // Si eliminamos la opción correcta, ajustar el índice
                                          const newTopics = [...formData.topics];
                                          if (flashcard.correct_answer_index === optionIndex) {
                                            // Si eliminamos la opción correcta, poner la primera como correcta
                                            newTopics[index].flashcards[flashcardIndex].correct_answer_index = 0;
                                          } else if (flashcard.correct_answer_index > optionIndex) {
                                            // Si la opción correcta está después, reducir el índice
                                            newTopics[index].flashcards[flashcardIndex].correct_answer_index -= 1;
                                          }
                                          handleRemoveOption(index, flashcardIndex, optionIndex);
                                        }}
                                        style={{
                                          padding: "0.5rem",
                                          background: "rgba(239, 68, 68, 0.1)",
                                          color: "#ef4444",
                                          border: "1px solid rgba(239, 68, 68, 0.3)",
                                          borderRadius: "8px",
                                          cursor: "pointer",
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                        }}
                                      >
                                        <HiXMark size={14} />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                {flashcard.options.length < 4 && (
                                  <button
                                    type="button"
                                    onClick={() => handleAddOption(index, flashcardIndex)}
                                    style={{
                                      padding: "0.75rem 1rem",
                                      background: "var(--bg-overlay-05)",
                                      border: "1px dashed var(--border-overlay-1)",
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                      fontSize: "0.85rem",
                                      color: "var(--text-secondary)",
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "0.5rem",
                                    }}
                                  >
                                    <HiPlus size={14} /> Añadir Opción
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ 
                        color: "var(--text-muted)", 
                        fontSize: "0.9rem", 
                        fontStyle: "italic",
                        textAlign: "center",
                        padding: "1.5rem"
                      }}>
                        No hay flashcards añadidas. Las preguntas se generarán automáticamente con IA si no añades ninguna.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Botón grande para añadir tema */}
            <button
              type="button"
              onClick={handleAddTopic}
              style={{
                width: "100%",
                padding: "2rem",
                background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)",
                border: "2px dashed rgba(99, 102, 241, 0.4)",
                borderRadius: "16px",
                cursor: "pointer",
                fontSize: "1.1rem",
                fontWeight: "700",
                color: "#6366f1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "1rem",
                transition: "all 0.3s ease",
                marginTop: formData.topics.length > 0 ? "1.5rem" : "0",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)";
                e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.6)";
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 12px 35px rgba(99, 102, 241, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)";
                e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <HiPlus size={26} />
              <span>Añadir Nuevo Tema</span>
            </button>
          </div>

          {/* Ejemplos de Exámenes */}
          <div style={{ 
            background: "var(--bg-overlay-02)", 
            padding: "2.5rem", 
            borderRadius: "16px", 
            border: "1px solid var(--border-overlay-05)",
          }}>
            <h2 style={{ 
              fontSize: "1.25rem", 
              fontWeight: "600", 
              marginBottom: "1rem",
              color: "var(--text-primary)"
            }}>
              Ejemplos de Exámenes (Opcional)
            </h2>
            <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginBottom: "1.5rem" }}>
              Sube PDFs con ejemplos de exámenes anteriores para ayudar a los estudiantes
            </p>
            <button
              type="button"
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".pdf";
                input.multiple = true;
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files) {
                    Array.from(files).forEach((file) => handleUploadExamExample(file));
                  }
                };
                input.click();
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.75rem",
                padding: "1rem 1.5rem",
                background: "rgba(99, 102, 241, 0.15)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                borderRadius: "10px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                fontSize: "0.95rem",
                color: "var(--text-primary)",
                fontWeight: "700",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.5)";
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.25)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                e.currentTarget.style.background = "rgba(99, 102, 241, 0.15)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <TbFileUpload size={20} /> Añadir PDF de Ejemplo
            </button>
            {uploading.examExample && (
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginLeft: "1rem" }}>Subiendo...</span>
            )}
            {formData.examExamples.length > 0 && (
              <div style={{ marginTop: "1.5rem", display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
                {formData.examExamples.map((pdf, index) => (
                  <div
                    key={index}
                    style={{
                      padding: "0.75rem 1rem",
                      background: "var(--bg-overlay-05)",
                      borderRadius: "10px",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      border: "1px solid var(--border-overlay-1)",
                    }}
                  >
                    <HiDocumentText size={18} color="#6366f1" />
                    <span style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {pdf.split("/").pop()}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newExamples = formData.examExamples.filter((_, i) => i !== index);
                        setFormData({ ...formData, examExamples: newExamples });
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        padding: "0.25rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "4px",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                        e.currentTarget.style.color = "#ef4444";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--text-muted)";
                      }}
                    >
                      <HiXMark size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Herramientas Disponibles */}
          <div style={{ 
            background: "var(--bg-overlay-02)", 
            padding: "2.5rem", 
            borderRadius: "16px", 
            border: "1px solid var(--border-overlay-05)",
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "1.5rem", color: "var(--text-primary)" }}>
              Herramientas Disponibles
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              {Object.entries(formData.availableTools).map(([tool, enabled]) => {
                // Iconos para cada herramienta
                const getIcon = () => {
                  switch (tool) {
                    case "flashcards":
                      return <HiAcademicCap size={22} />;
                    case "code_interpreter":
                      return <HiCodeBracket size={22} />;
                    case "notes":
                      return <HiDocumentText size={22} />;
                    case "tests":
                      return <HiClipboardDocumentList size={22} />;
                    case "exercises":
                      return <HiLightBulb size={22} />;
                    case "games":
                      return <HiPlay size={22} />;
                    default:
                      return <HiPencilSquare size={22} />;
                  }
                };

                const getToolName = () => {
                  switch (tool) {
                    case "code_interpreter":
                      return "Intérprete de Código";
                    case "flashcards":
                      return "Flashcards";
                    case "notes":
                      return "Apuntes";
                    case "tests":
                      return "Tests";
                    case "exercises":
                      return "Ejercicios";
                    case "games":
                      return "Juegos";
                    default:
                      return tool;
                  }
                };

                // Los juegos solo están disponibles para cursos >= 10€
                const isGamesDisabled = tool === "games" && formData.price < 10;
                const isDisabled = isGamesDisabled && !enabled;

                return (
                  <label
                    key={tool}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.75rem",
                      cursor: isDisabled ? "not-allowed" : "pointer",
                      padding: "1.5rem 1.25rem",
                      borderRadius: "14px",
                      background: enabled 
                        ? "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%)" 
                        : isDisabled
                        ? "var(--bg-overlay-02)"
                        : "var(--bg-card)",
                      border: enabled 
                        ? "2px solid rgba(99, 102, 241, 0.4)" 
                        : isDisabled
                        ? "2px solid var(--border-overlay-05)"
                        : "2px solid var(--border-subtle)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      position: "relative",
                      overflow: "hidden",
                      minHeight: "120px",
                      opacity: isDisabled ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (isDisabled) return;
                      if (!enabled) {
                        e.currentTarget.style.background = "var(--bg-overlay-05)";
                        e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 4px 12px var(--shadow-card)";
                      } else {
                        e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                        e.currentTarget.style.boxShadow = "0 8px 20px rgba(99, 102, 241, 0.25)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isDisabled) return;
                      if (!enabled) {
                        e.currentTarget.style.background = "var(--bg-card)";
                        e.currentTarget.style.borderColor = "var(--border-subtle)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      } else {
                        e.currentTarget.style.transform = "translateY(0) scale(1)";
                        e.currentTarget.style.boxShadow = "none";
                      }
                    }}
                  >
                    {/* Checkbox personalizado */}
                    <div style={{
                      position: "absolute",
                      top: "0.75rem",
                      right: "0.75rem",
                      width: "24px",
                      height: "24px",
                      borderRadius: "6px",
                      background: enabled ? "rgba(99, 102, 241, 0.9)" : "var(--bg-overlay-05)",
                      border: enabled ? "2px solid rgba(99, 102, 241, 1)" : "2px solid var(--border-overlay-1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s",
                    }}>
                      {enabled && <HiCheck size={16} color="white" />}
                    </div>

                    {/* Icono */}
                    <div style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "14px",
                      background: enabled 
                        ? "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.15) 100%)" 
                        : "var(--bg-overlay-05)",
                      border: enabled 
                        ? "2px solid rgba(99, 102, 241, 0.3)" 
                        : "2px solid var(--border-overlay-1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: enabled ? "#6366f1" : "var(--text-secondary)",
                      transition: "all 0.3s",
                      marginTop: "0.5rem",
                    }}>
                      {getIcon()}
                    </div>

                    {/* Nombre de la herramienta */}
                    <span style={{ 
                      fontSize: "0.95rem", 
                      fontWeight: "600",
                      color: enabled ? "var(--text-primary)" : isDisabled ? "var(--text-muted)" : "var(--text-secondary)",
                      textAlign: "center",
                      transition: "color 0.2s",
                    }}>
                      {getToolName()}
                    </span>
                    {/* Mensaje para juegos deshabilitados */}
                    {isGamesDisabled && !enabled && (
                      <span style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        textAlign: "center",
                        fontStyle: "italic",
                        marginTop: "-0.5rem",
                      }}>
                        Requiere precio ≥ 10€
                      </span>
                    )}

                    {/* Input oculto */}
                    <input
                      type="checkbox"
                      checked={enabled}
                      disabled={isDisabled}
                      onChange={(e) => {
                        // Si es juegos y el precio < 10€, no permitir activarlo
                        if (tool === "games" && formData.price < 10 && e.target.checked) {
                          return;
                        }
                        setFormData({
                          ...formData,
                          availableTools: { ...formData.availableTools, [tool]: e.target.checked },
                        });
                      }}
                      style={{ 
                        position: "absolute",
                        opacity: 0,
                        pointerEvents: isDisabled ? "none" : "auto",
                      }}
                    />
                  </label>
                );
              })}
            </div>
          </div>

          {/* Sección de Generación de Apuntes */}
          <div style={{
            padding: "2rem",
            background: "var(--bg-card)",
            borderRadius: "16px",
            border: "2px solid var(--border-subtle)",
            marginTop: "2rem",
          }}>
            <h3 style={{
              fontSize: "1.25rem",
              fontWeight: "700",
              color: "var(--text-primary)",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}>
              <HiAcademicCap size={24} color="#8b5cf6" />
              Generación Automática de Apuntes
            </h3>

            {/* Checkbox para generar resúmenes */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                cursor: "pointer",
                fontSize: "1rem",
                color: "var(--text-primary)",
              }}>
                <input
                  type="checkbox"
                  checked={formData.generateSummaries}
                  onChange={(e) => setFormData({ ...formData, generateSummaries: e.target.checked })}
                  style={{ width: "20px", height: "20px", cursor: "pointer" }}
                />
                <span>Generar apuntes automáticamente al crear el curso</span>
              </label>
              <p style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginTop: "0.5rem",
                marginLeft: "2rem",
              }}>
                Los apuntes se generarán usando IA (Gemini) para cada apartado y subapartado
              </p>
            </div>

            {formData.generateSummaries && (
              <>
                {/* Selector de modelo */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{
                    display: "block",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    marginBottom: "0.5rem",
                  }}>
                    Modelo de IA:
                  </label>
                  <select
                    value={formData.geminiModel}
                    onChange={(e) => setFormData({ ...formData, geminiModel: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      background: "var(--bg-overlay-02)",
                      border: "2px solid var(--border-subtle)",
                      borderRadius: "10px",
                      color: "var(--text-primary)",
                      fontSize: "0.95rem",
                      cursor: "pointer",
                    }}
                  >
                    <option value="gemini-3-pro">Gemini 3 Pro (Mejor calidad)</option>
                    <option value="gemini-3-flash">Gemini 3 Flash (Rápido y económico)</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
                  </select>
                </div>

                {/* Comentarios adicionales */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{
                    display: "block",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    color: "var(--text-primary)",
                    marginBottom: "0.5rem",
                  }}>
                    Comentarios adicionales para la IA (opcional):
                  </label>
                  <textarea
                    value={formData.additionalComments}
                    onChange={(e) => setFormData({ ...formData, additionalComments: e.target.value })}
                    placeholder="Ej: Enfócate en las preguntas más frecuentes del examen, usa ejemplos prácticos..."
                    style={{
                      width: "100%",
                      minHeight: "100px",
                      padding: "0.75rem",
                      background: "var(--bg-overlay-02)",
                      border: "2px solid var(--border-subtle)",
                      borderRadius: "10px",
                      color: "var(--text-primary)",
                      fontSize: "0.95rem",
                      resize: "vertical",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Botones de Acción */}
          <div style={{ 
            display: "flex", 
            gap: "1.25rem", 
            justifyContent: "flex-end", 
            paddingTop: "1rem",
            borderTop: "1px solid var(--border-overlay-05)"
          }}>
            <Link
              href="/study-agents"
              style={{
                padding: "1rem 2rem",
                background: "var(--bg-overlay-05)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-overlay-1)",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "0.95rem",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--bg-overlay-08)";
                e.currentTarget.style.borderColor = "var(--border-overlay-2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bg-overlay-05)";
                e.currentTarget.style.borderColor = "var(--border-overlay-1)";
              }}
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "1rem 2.5rem",
                background: loading 
                  ? "rgba(156, 163, 175, 0.5)" 
                  : "#6366f1",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "700",
                fontSize: "1rem",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "#7c3aed";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.background = "#6366f1";
                  e.currentTarget.style.transform = "translateY(0)";
                }
              }}
            >
              {loading ? "Creando..." : "Crear Curso"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
