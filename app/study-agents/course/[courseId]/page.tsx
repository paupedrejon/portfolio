"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import DOMPurify from "dompurify";
import ReactMarkdown from "react-markdown";
import CourseRanking from "@/components/CourseRanking";
import GamesView from "@/components/CourseGame";
import SatisfactionFeedback from "@/components/SatisfactionFeedback";
import { HiArrowLeft, HiAcademicCap, HiClock, HiTrophy, HiXMark, HiDocumentText, HiSparkles, HiClipboardDocumentCheck, HiPencilSquare, HiCheckCircle, HiArrowDownTray, HiMicrophone, HiPaperAirplane } from "react-icons/hi2";
import { TbTrophy, TbCoins, TbFlame } from "react-icons/tb";
import { HiChatBubbleLeftRight } from "react-icons/hi2";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface Course {
  course_id: string;
  title: string;
  description: string;
  price: number;
  max_duration_days?: number;
  cover_image?: string;
  is_exam?: boolean;
  creator_id?: string;
  topics: Array<{ 
    name: string; 
    pdfs: string[]; 
    subtopics?: Array<{ name: string; pdfs: string[] }>;
    flashcards?: Array<{ question: string; correct_answer_index: number; options: string[] }>;
  }>;
  available_tools: Record<string, boolean>;
}

interface Enrollment {
  user_id: string;
  course_id: string;
  credits_remaining: number;
  credits_used: number;
  xp: number;
  topic_progress: Record<string, number>;
  messages: Message[];
  generated_notes: Record<string, string[]>;
  exam_date?: string;
  end_date?: string;
}

export default function CoursePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const courseId = params?.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [activeView, setActiveView] = useState<"chat" | "topics" | "summary" | "games">("topics");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [generatingNotes, setGeneratingNotes] = useState<Record<string, boolean>>({});
  const [topicSummary, setTopicSummary] = useState<Record<string, string>>({});
  const [userLevel, setUserLevel] = useState<number | null>(null);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [streakData, setStreakData] = useState<any>(null);
  const [showStreakModal, setShowStreakModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [regeneratingSummaries, setRegeneratingSummaries] = useState(false);
  const notesContentRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Usar useRef para evitar múltiples llamadas
  const hasLoadedRef = useRef(false);
  
  // Inicializar reconocimiento de voz
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'es-ES';
        
        recognition.onstart = () => {
          setIsRecording(true);
        };
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage(prev => prev + (prev ? ' ' : '') + transcript);
          setIsRecording(false);
        };
        
        recognition.onerror = () => {
          setIsRecording(false);
        };
        
        recognition.onend = () => {
          setIsRecording(false);
        };
        
        recognitionRef.current = recognition;
      }
    }
  }, []);
  
  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('El reconocimiento de voz no está disponible en tu navegador');
      return;
    }
    
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
    }
  };
  
  // Función para procesar fórmulas matemáticas LaTeX ($...$)
  const processMathFormulas = (content: string): string => {
    if (!content) return "";
    // Convertir $...$ a <span class="math-inline">...</span> para renderizado
    // También manejar $$...$$ para bloques
    let processed = content;
    
    // Primero procesar bloques de matemáticas $$...$$ (más específico primero)
    // Usar un marcador temporal para evitar procesar el contenido interno
    const blockPlaceholders: string[] = [];
    processed = processed.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
      const placeholder = `__MATH_BLOCK_${blockPlaceholders.length}__`;
      blockPlaceholders.push(formula.trim());
      return placeholder;
    });
    
    // Luego procesar fórmulas inline $...$ (evitar los que ya fueron procesados como $$)
    const inlinePlaceholders: string[] = [];
    processed = processed.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
      const placeholder = `__MATH_INLINE_${inlinePlaceholders.length}__`;
      inlinePlaceholders.push(formula.trim());
      return placeholder;
    });
    
    // Reemplazar placeholders de bloques
    blockPlaceholders.forEach((formula, index) => {
      processed = processed.replace(
        `__MATH_BLOCK_${index}__`,
        `<div class="math-block" style="text-align: center; margin: 1.5rem 0; padding: 1rem; background: rgba(99, 102, 241, 0.1); border-radius: 8px; font-family: 'Courier New', monospace; font-size: 1.1em; white-space: pre-wrap;">$${formula}$</div>`
      );
    });
    
    // Reemplazar placeholders inline
    inlinePlaceholders.forEach((formula, index) => {
      processed = processed.replace(
        `__MATH_INLINE_${index}__`,
        `<span class="math-inline" style="font-family: 'Courier New', monospace; background: rgba(99, 102, 241, 0.15); padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.95em;">$${formula}$</span>`
      );
    });
    
    return processed;
  };
  
  // Función para descargar PDF
  const downloadPDF = async () => {
    if (!notesContentRef.current || !selectedTopic) return;
    
    try {
      const element = notesContentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      const safeTopicName = selectedTopic.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      pdf.save(`${course?.title || "curso"}_${safeTopicName}.pdf`);
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Error al generar el PDF. Por favor, intenta de nuevo.");
    }
  };
  
  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  useEffect(() => {
    // Esperar a que la sesión se cargue completamente
    if (status === "loading") {
      return; // Aún cargando, no hacer nada
    }
    
    if (status === "unauthenticated") {
      // Solo redirigir si no estamos ya en la página de signin
      if (window.location.pathname !== "/auth/signin") {
        router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      }
      return;
    }
    
    // Solo cargar una vez cuando hay sesión y courseId
    if (session?.user?.id && courseId && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadCourseData();
    }
  }, [session, status, courseId, router]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const loadCourseData = async () => {
    if (!session?.user?.id || !courseId) return;

    setLoading(true);
    try {
      let loadedCourse: Course | null = null;
      
      // Cargar curso
      const courseResponse = await fetch("/api/study-agents/get-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });

      if (courseResponse.ok) {
        const courseData = await courseResponse.json();
        if (courseData.success) {
          loadedCourse = courseData.course;
          setCourse(loadedCourse);
          // Seleccionar primer tema por defecto
          if (loadedCourse.topics.length > 0) {
            setSelectedTopic(loadedCourse.topics[0].name);
          }
        }
      }

      // Cargar inscripción
      const enrollmentResponse = await fetch("/api/study-agents/get-enrollment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          courseId,
        }),
      });

      if (enrollmentResponse.ok) {
        const enrollmentData = await enrollmentResponse.json();
        if (enrollmentData.success) {
          // Actualizar racha y créditos antes de cargar la inscripción
          try {
            const streakResponse = await fetch("/api/study-agents/update-streak-credits", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                user_id: session.user.id,
                course_id: courseId,
              }),
            });

            if (streakResponse.ok) {
              const streakDataResult = await streakResponse.json();
              if (streakDataResult.success) {
                setStreakData(streakDataResult);
                // Mostrar modal automáticamente si hay créditos disponibles para reclamar
                if (streakDataResult.credits_available > 0 && !streakDataResult.today_claimed) {
                  setShowStreakModal(true);
                }
              }
            }
          } catch (error) {
            console.error("Error actualizando racha:", error);
          }
          
          // Recargar inscripción actualizada después de actualizar la racha
          const updatedEnrollmentResponse = await fetch("/api/study-agents/get-enrollment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: session.user.id,
              courseId,
            }),
          });
          
          if (updatedEnrollmentResponse.ok) {
            const updatedEnrollmentData = await updatedEnrollmentResponse.json();
            if (updatedEnrollmentData.success) {
              setEnrollment(updatedEnrollmentData.enrollment);
            }
          } else {
            setEnrollment(enrollmentData.enrollment);
          }
          
          const finalEnrollment = enrollmentData.enrollment;
          const savedMessages = finalEnrollment.messages || [];
          setMessages(savedMessages);
          
          // Cargar resúmenes: primero usar course.summaries (generados automáticamente con Gemini)
          // Si no existen, usar enrollment.generated_notes (generados manualmente)
          const summaries: Record<string, string> = {};
          
          // 1. Intentar usar resúmenes generados automáticamente (course.summaries)
          if (loadedCourse && loadedCourse.summaries) {
            Object.keys(loadedCourse.summaries).forEach((topicName) => {
              const topicSummaryData = loadedCourse.summaries[topicName];
              if (topicSummaryData) {
                // Puede ser un objeto con {summary, subtopics} o un string directo
                let summaryText = "";
                if (typeof topicSummaryData === "string") {
                  summaryText = topicSummaryData;
                } else if (topicSummaryData && typeof topicSummaryData === "object" && "summary" in topicSummaryData) {
                  summaryText = topicSummaryData.summary || "";
                }
                
                if (summaryText && summaryText.trim().length > 0) {
                  summaries[topicName] = summaryText;
                  console.log(`✅ Resumen automático cargado para tema: ${topicName}`);
                }
              }
            });
          }
          
          // 2. Si no hay resúmenes automáticos para algún tema, usar los generados manualmente
          const notes = finalEnrollment.generated_notes || {};
          Object.keys(notes).forEach((topicName) => {
            // Solo usar si no hay resumen automático ya cargado
            if (!summaries[topicName]) {
              const topicNotes = notes[topicName];
              if (topicNotes) {
                // Manejar tanto string como array
                const summary = Array.isArray(topicNotes) ? topicNotes.join("\n\n") : topicNotes;
                if (summary && summary.trim().length > 0) {
                  summaries[topicName] = summary;
                  console.log(`✅ Resumen manual cargado para tema: ${topicName}`);
                }
              }
            }
          });
          
          setTopicSummary(summaries);
          
          // No enviar mensaje automático - el usuario debe seleccionar su nivel primero
        } else {
          // No está inscrito, redirigir a inscripción
          router.push("/study-agents");
        }
      }
    } catch (error) {
      console.error("Error cargando curso:", error);
    } finally {
      setLoading(false);
    }
  };

  // Función para enviar mensaje de bienvenida con nivel del usuario
  const sendWelcomeMessage = async (level: number) => {
    if (!session?.user?.id) return;
    
    setSending(true);
    try {
      const savedKeys = localStorage.getItem("study_agents_api_keys");
      let apiKey = null;
      if (savedKeys) {
        try {
          const parsed = JSON.parse(savedKeys);
          apiKey = parsed.openai;
        } catch (e) {
          console.error("Error parsing API keys:", e);
        }
      }
      if (!apiKey) {
        setSending(false);
        return;
      }

      // Llamar al agente guía con el nivel del usuario
      const response = await fetch("/api/study-agents/course-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          courseId,
          question: `Mi nivel actual en este curso es ${level}/10.`,
          apiKey,
          model: null, // modo auto
          userLevel: level,
        }),
      });

      const data = await response.json();
      if (data.success) {
        const welcomeMessage: Message = {
          role: "assistant",
          content: data.answer,
          timestamp: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
        setUserLevel(level);
        setShowLevelSelector(false);
        // Guardar mensaje en el backend
        await fetch("/api/study-agents/update-enrollment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: session.user.id,
            courseId,
            updates: {
              messages: [welcomeMessage],
            },
          }),
        });
      }
    } catch (error) {
      console.error("Error enviando mensaje de bienvenida:", error);
    } finally {
      setSending(false);
    }
  };

  // Función para generar apuntes automáticamente
  const generateAutoNotes = async (topicName: string) => {
    if (!session?.user?.id || !course || generatingNotes[topicName]) return;
    
    // Verificar si ya hay apuntes generados
    const existingNotes = enrollment?.generated_notes?.[topicName];
    if (existingNotes) {
      // Ya hay apuntes, cargar resumen si existe
      const summary = Array.isArray(existingNotes) ? existingNotes.join("\n\n") : existingNotes;
      if (summary && summary.trim().length > 0) {
        setTopicSummary((prev) => ({ ...prev, [topicName]: summary }));
        return; // Ya hay resumen, no generar
      }
    }

    setGeneratingNotes((prev) => ({ ...prev, [topicName]: true }));
    
    try {
      const savedKeys = localStorage.getItem("study_agents_api_keys");
      let apiKey = null;
      if (savedKeys) {
        try {
          const parsed = JSON.parse(savedKeys);
          apiKey = parsed.openai;
        } catch (e) {
          console.error("Error parsing API keys:", e);
        }
      }
      if (!apiKey) {
        setGeneratingNotes((prev) => ({ ...prev, [topicName]: false }));
        return;
      }

      // Encontrar el tema y sus PDFs
      const topic = course.topics.find((t) => t.name === topicName);
      if (!topic) {
        setGeneratingNotes((prev) => ({ ...prev, [topicName]: false }));
        return;
      }

      // Generar apuntes esquemáticos del tema completo
      const response = await fetch("/api/study-agents/generate-course-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          courseId,
          apiKey,
          notesType: "topic",
          topicName: topicName,
          model: null, // modo auto para optimizar costes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        console.error("Error en la respuesta:", errorData);
        setGeneratingNotes((prev) => ({ ...prev, [topicName]: false }));
        return;
      }

      const data = await response.json();
      if (data.success && data.notes) {
        // Guardar resumen inmediatamente ANTES de recargar
        const notesContent = data.notes;
        setTopicSummary((prev) => ({ ...prev, [topicName]: notesContent }));
        // Detener el estado de carga inmediatamente
        setGeneratingNotes((prev) => ({ ...prev, [topicName]: false }));
        
        // Recargar datos en segundo plano para sincronizar con el backend
        // Pero no esperar a que termine para actualizar la UI
        loadCourseData().then(() => {
          // Después de recargar, asegurarse de que el resumen se mantenga
          setTopicSummary((prev) => {
            if (!prev[topicName] || prev[topicName] !== notesContent) {
              return { ...prev, [topicName]: notesContent };
            }
            return prev;
          });
        }).catch((error) => {
          console.error("Error recargando datos después de generar apuntes:", error);
          // Aunque falle la recarga, mantener el resumen
          setTopicSummary((prev) => {
            if (!prev[topicName]) {
              return { ...prev, [topicName]: notesContent };
            }
            return prev;
          });
        });
      } else {
        console.error("Error generando apuntes:", data.error || "Error desconocido");
        setGeneratingNotes((prev) => ({ ...prev, [topicName]: false }));
      }
    } catch (error) {
      console.error("Error generando apuntes automáticos:", error);
      setGeneratingNotes((prev) => ({ ...prev, [topicName]: false }));
    }
  };

  // Generar apuntes automáticamente cuando se selecciona un tema
  useEffect(() => {
    if (selectedTopic && course && enrollment && !loading) {
      // Cargar resumen si ya existe
      const existingNotes = enrollment.generated_notes?.[selectedTopic];
      if (existingNotes) {
        // Manejar tanto string como array
        const summary = Array.isArray(existingNotes) ? existingNotes.join("\n\n") : existingNotes;
        if (summary && summary.trim().length > 0) {
          setTopicSummary((prev) => {
            // Solo actualizar si no existe o es diferente
            if (!prev[selectedTopic] || prev[selectedTopic] !== summary) {
              return { ...prev, [selectedTopic]: summary };
            }
            return prev;
          });
          return; // Ya hay resumen, no generar
        }
      }
      
      // Si no hay resumen y no se está generando, generarlo automáticamente
      if (!generatingNotes[selectedTopic] && !topicSummary[selectedTopic]) {
        generateAutoNotes(selectedTopic);
      }
    }
  }, [selectedTopic, course, enrollment, loading]); // Removido enrollment?.generated_notes para evitar loops infinitos

  // Asegurar que el resumen esté disponible cuando se cambia a la vista de resumen
  useEffect(() => {
    if (activeView === "summary" && selectedTopic && enrollment) {
      // Si no hay resumen en topicSummary, intentar cargarlo desde enrollment
      if (!topicSummary[selectedTopic]) {
        const existingNotes = enrollment.generated_notes?.[selectedTopic];
        if (existingNotes) {
          const summary = Array.isArray(existingNotes) ? existingNotes.join("\n\n") : existingNotes;
          if (summary && summary.trim().length > 0) {
            setTopicSummary((prev) => ({ ...prev, [selectedTopic]: summary }));
            return; // Ya hay resumen, no generar
          }
        }
        // Si no hay resumen y no se está generando, generarlo
        if (!generatingNotes[selectedTopic] && course) {
          generateAutoNotes(selectedTopic);
        }
      }
    }
  }, [activeView, selectedTopic]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !session?.user?.id || !course || !enrollment) return;

    const userMessage: Message = {
      role: "user",
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputMessage;
    setInputMessage("");
    setSending(true);

    try {
      // Obtener API key del usuario
      const savedKeys = localStorage.getItem("study_agents_api_keys");
      let apiKey = null;
      if (savedKeys) {
        try {
          const parsed = JSON.parse(savedKeys);
          apiKey = parsed.openai;
        } catch (e) {
          console.error("Error parsing API keys:", e);
        }
      }
      if (!apiKey) {
        alert("Por favor, configura tu API key de OpenAI");
        return;
      }

      // Llamar al agente guía del curso
      const response = await fetch("/api/study-agents/course-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          courseId,
          question: currentInput,
          apiKey,
          model: null, // modo auto para optimizar costes
        }),
      });

      const data = await response.json();
      const assistantMessage: Message = {
        role: "assistant",
        content: data.success ? data.answer : (data.error || "Lo siento, no pude procesar tu pregunta."),
        timestamp: new Date().toISOString(),
      };
      
      setMessages((prev) => [...prev, assistantMessage]);

      // Recargar inscripción para obtener créditos actualizados
      if (data.success) {
        loadCourseData();
      }
    } catch (error) {
      console.error("Error enviando mensaje:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Error al procesar tu mensaje. Por favor, inténtalo de nuevo.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const getDaysUntil = (dateString?: string) => {
    if (!dateString) return null;
    const today = new Date();
    const target = new Date(dateString);
    const diffTime = target.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // No mostrar pantalla en blanco durante la carga inicial
  // Solo mostrar contenido básico mientras carga

  // Mostrar modal de valoración si el curso ha finalizado y no se ha valorado
  // Este useEffect debe estar ANTES del return temprano para mantener el orden de hooks
  useEffect(() => {
    // Solo ejecutar si tenemos todos los datos necesarios
    if (!enrollment || !session?.user?.id || !courseId) {
      return;
    }
    
    const daysUntil = enrollment.exam_date 
      ? getDaysUntil(enrollment.exam_date) 
      : enrollment.end_date 
      ? getDaysUntil(enrollment.end_date) 
      : null;
    
    const isCourseFinished = daysUntil !== null && daysUntil <= 0;
    
    if (isCourseFinished && !hasReviewed) {
      // Verificar si ya tiene una review
      fetch("/api/study-agents/get-course-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            const userReview = data.reviews.find((r: any) => r.user_id === session.user.id);
            if (!userReview) {
              setShowReviewModal(true);
            } else {
              setHasReviewed(true);
            }
          }
        })
        .catch(() => {});
    }
  }, [enrollment, hasReviewed, session?.user?.id, courseId]);

  if (!course || !enrollment) {
    return (
      <div style={{ 
        padding: "2rem", 
        textAlign: "center",
        minHeight: "100vh",
        background: "linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-tertiary) 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center"
      }}>
        <p style={{ color: "var(--text-primary)", fontSize: "1.25rem", marginBottom: "1rem" }}>
          Curso no encontrado o no estás inscrito
        </p>
        <Link href="/study-agents" style={{ color: "#6366f1", textDecoration: "none", fontSize: "1rem" }}>
          Volver a Cursos
        </Link>
      </div>
    );
  }

  const daysUntil = enrollment.exam_date 
    ? getDaysUntil(enrollment.exam_date) 
    : enrollment.end_date 
    ? getDaysUntil(enrollment.end_date) 
    : null;
  
  const isCourseFinished = daysUntil !== null && daysUntil <= 0;
  
  const currentTopicProgress = selectedTopic ? enrollment.topic_progress[selectedTopic] || 0 : 0;
  // Asegurar que topicNotes siempre sea un array
  const topicNotesRaw = selectedTopic ? enrollment.generated_notes[selectedTopic] : null;
  const topicNotes = topicNotesRaw 
    ? (Array.isArray(topicNotesRaw) ? topicNotesRaw : [topicNotesRaw])
    : [];

  return (
    <div style={{ 
      display: "flex", 
      height: "100vh", 
      overflow: "hidden",
      background: "var(--bg-primary)"
    }}>
      {/* Sidebar de Temas - Estilo Página Principal */}
      <div
        style={{
          width: "320px",
          background: "var(--bg-card)",
          borderRight: "1px solid var(--border-overlay-1)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header del Sidebar */}
        <div style={{ 
          padding: "2rem 1.5rem", 
          borderBottom: "1px solid var(--border-overlay-1)",
          background: "var(--bg-card)"
        }}>
          <Link
            href="/study-agents"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              color: "var(--text-secondary)",
              textDecoration: "none",
              marginBottom: "1.25rem",
              fontSize: "0.9rem",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--text-primary)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-secondary)"}
          >
            <HiArrowLeft size={18} /> Volver
          </Link>
          <h2 style={{ 
            fontSize: "1.35rem", 
            fontWeight: "600", 
            marginBottom: "0.75rem",
            color: "var(--text-primary)",
            lineHeight: "1.3"
          }}>
            {course.title}
          </h2>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
            {daysUntil !== null && (
              <div style={{ marginTop: "0.5rem" }}>
                {daysUntil > 0 ? (
                  <span style={{ 
                    color: daysUntil < 7 ? "#ef4444" : daysUntil < 30 ? "#f59e0b" : "#10b981",
                    fontWeight: "500"
                  }}>
                    {daysUntil} días restantes
                  </span>
                ) : (
                  <span style={{ color: "#ef4444" }}>Finalizado</span>
                )}
              </div>
            )}
          </div>
          
          {/* Botón para regenerar resúmenes (solo para creador) */}
          {course.creator_id && session?.user?.id === course.creator_id && (
            <button
              onClick={async () => {
                if (regeneratingSummaries) return;
                
                const confirmed = window.confirm(
                  "¿Regenerar los resúmenes del curso? Esto consumirá créditos de tu wallet. Los resúmenes se generarán en segundo plano."
                );
                
                if (!confirmed) return;
                
                setRegeneratingSummaries(true);
                try {
                  const response = await fetch("/api/study-agents/regenerate-course-summaries", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      user_id: session.user.id,
                      course_id: courseId,
                      model: "gemini-1.5-pro",
                    }),
                  });
                  
                  const data = await response.json();
                  
                  if (data.success) {
                    alert(`✅ Regeneración iniciada. Los resúmenes se generarán en segundo plano.\n\nCosto estimado: ${data.cost_estimate?.estimated_cost_eur?.toFixed(2) || "0.00"}€`);
                    // Recargar el curso después de unos segundos para ver los nuevos resúmenes
                    setTimeout(() => {
                      loadCourseData();
                    }, 5000);
                  } else {
                    alert(`❌ Error: ${data.error || "No se pudo iniciar la regeneración"}`);
                  }
                } catch (error: any) {
                  console.error("Error regenerando resúmenes:", error);
                  alert(`❌ Error: ${error.message || "Error desconocido"}`);
                } finally {
                  setRegeneratingSummaries(false);
                }
              }}
              disabled={regeneratingSummaries}
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                background: regeneratingSummaries ? "var(--bg-overlay-05)" : "#6366f1",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: regeneratingSummaries ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                justifyContent: "center",
                opacity: regeneratingSummaries ? 0.6 : 1,
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!regeneratingSummaries) {
                  e.currentTarget.style.background = "#4f46e5";
                }
              }}
              onMouseLeave={(e) => {
                if (!regeneratingSummaries) {
                  e.currentTarget.style.background = "#6366f1";
                }
              }}
            >
              <HiSparkles size={16} />
              <span>{regeneratingSummaries ? "Regenerando..." : "Regenerar Resúmenes"}</span>
            </button>
          )}
          
        </div>

        {/* Lista de Temas - Compacto y Responsive */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 1rem" }}>
          <div style={{ 
            marginBottom: "1.25rem", 
            fontWeight: "600", 
            fontSize: "0.75rem", 
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.1em"
          }}>
            Temas
          </div>
          {course.topics.map((topic) => {
            const progress = enrollment.topic_progress[topic.name] || 0;
            const isSelected = selectedTopic === topic.name || (selectedTopic && selectedTopic.startsWith(topic.name + " > "));
            const hasSubtopics = topic.subtopics && topic.subtopics.length > 0;

            return (
              <div key={topic.name} style={{ marginBottom: "0.75rem" }}>
                <div
                  onClick={() => {
                    setSelectedTopic(topic.name);
                    setActiveView("topics");
                  }}
                  style={{
                    padding: "1.25rem",
                    background: isSelected 
                      ? "rgba(99, 102, 241, 0.1)" 
                      : "var(--bg-card)",
                    borderRadius: "16px",
                    cursor: "pointer",
                    border: isSelected 
                      ? "1px solid #6366f1" 
                      : "1px solid var(--border-overlay-1)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "var(--bg-overlay-04)";
                      e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "var(--bg-card)";
                      e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    marginBottom: "0.75rem" 
                  }}>
                    <span style={{ 
                      fontWeight: isSelected ? "600" : "500", 
                      fontSize: "0.95rem",
                      color: "var(--text-primary)"
                    }}>
                      {topic.name}
                    </span>
                    <span style={{ 
                      fontSize: "0.85rem", 
                      color: "var(--text-secondary)",
                      fontWeight: "500"
                    }}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "4px",
                      background: "var(--bg-overlay-05)",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${progress}%`,
                        height: "100%",
                        background: "#6366f1",
                        borderRadius: "4px",
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>
                
                {/* Mostrar subtopics si existen - Seleccionables */}
                {topic.subtopics && topic.subtopics.length > 0 && (
                  <div style={{ 
                    marginTop: "0.5rem", 
                    paddingLeft: "0.75rem",
                    borderLeft: "1px solid rgba(255, 255, 255, 0.08)"
                  }}>
                    {topic.subtopics.map((subtopic, idx) => {
                      const subtopicKey = `${topic.name} > ${subtopic.name}`;
                      const isSubtopicSelected = selectedTopic === subtopicKey;
                      const subtopicProgress = enrollment.topic_progress[subtopicKey] || 0;
                      
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setSelectedTopic(subtopicKey);
                            setActiveView("topics");
                          }}
                          style={{
                            padding: "1rem",
                            marginBottom: "0.5rem",
                            background: isSubtopicSelected 
                              ? "rgba(99, 102, 241, 0.1)" 
                              : "var(--bg-card)",
                            borderRadius: "12px",
                            fontSize: "0.875rem",
                            color: isSubtopicSelected ? "#6366f1" : "var(--text-secondary)",
                            border: isSubtopicSelected 
                              ? "1px solid #6366f1" 
                              : "1px solid var(--border-overlay-1)",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSubtopicSelected) {
                              e.currentTarget.style.background = "var(--bg-overlay-04)";
                              e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                              e.currentTarget.style.transform = "translateY(-2px)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSubtopicSelected) {
                              e.currentTarget.style.background = "var(--bg-card)";
                              e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                              e.currentTarget.style.transform = "translateY(0)";
                            }
                          }}
                        >
                          <div style={{ 
                            display: "flex", 
                            justifyContent: "space-between", 
                            alignItems: "center", 
                            marginBottom: "0.5rem" 
                          }}>
                            <span style={{ 
                              fontWeight: isSubtopicSelected ? "600" : "500", 
                              fontSize: "0.875rem",
                              color: isSubtopicSelected ? "#6366f1" : "var(--text-primary)",
                            }}>
                              {subtopic.name}
                            </span>
                            <span style={{ 
                              fontSize: "0.75rem", 
                              color: "var(--text-muted)",
                              fontWeight: "500"
                            }}>
                              {Math.round(subtopicProgress)}%
                            </span>
                          </div>
                          <div
                            style={{
                              width: "100%",
                              height: "2px",
                              background: "rgba(255, 255, 255, 0.05)",
                              borderRadius: "2px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${subtopicProgress}%`,
                                height: "100%",
                                background: isSubtopicSelected ? "#6366f1" : "rgba(99, 102, 241, 0.4)",
                                borderRadius: "2px",
                                transition: "width 0.4s ease",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Racha y Créditos */}
      {showStreakModal && streakData && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            backdropFilter: "blur(8px)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
          onClick={() => setShowStreakModal(false)}
        >
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: isMobile ? "16px" : "24px",
              border: "1px solid var(--border-overlay-1)",
              maxWidth: isMobile ? "95%" : "600px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
              margin: isMobile ? "1rem" : "0",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: isMobile ? "1rem" : "2rem",
              borderBottom: "1px solid var(--border-overlay-1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)"
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "0.5rem" : "0.75rem" }}>
                  <TbFlame size={isMobile ? 24 : 28} color="#f59e0b" />
                  <h2 style={{ 
                    margin: 0, 
                    fontSize: isMobile ? "1.5rem" : "2rem", 
                    fontWeight: "800", 
                    color: "var(--text-primary)" 
                  }}>
                    Calendario de Racha
                  </h2>
                </div>
                <p style={{ 
                  margin: isMobile ? "0.5rem 0 0 0" : "0.75rem 0 0 0", 
                  fontSize: isMobile ? "0.875rem" : "1rem", 
                  color: "var(--text-secondary)", 
                  fontWeight: "600" 
                }}>
                  Racha actual: <span style={{ fontWeight: "700", color: "#f59e0b" }}>{streakData.streak_days} días</span>
                </p>
              </div>
              <button
                onClick={() => setShowStreakModal(false)}
                style={{
                  padding: "0.5rem",
                  background: "var(--bg-overlay-05)",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                  borderRadius: "8px",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <HiXMark size={24} />
              </button>
            </div>

            <div style={{ padding: "2rem" }}>
              {/* Calendario de Racha - Última Semana */}
              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ 
                  marginBottom: isMobile ? "1rem" : "1.5rem", 
                  fontSize: isMobile ? "1.25rem" : "1.5rem", 
                  fontWeight: "700", 
                  color: "var(--text-primary)" 
                }}>
                  Esta Semana
                </h3>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile 
                    ? "repeat(4, 1fr)" 
                    : isTablet 
                    ? "repeat(5, 1fr)" 
                    : "repeat(7, 1fr)",
                  gap: isMobile ? "0.5rem" : "1rem",
                }}>
                  {(() => {
                    const calendar = streakData.streak_calendar || {};
                    const today = new Date().toISOString().split('T')[0];
                    const days: JSX.Element[] = [];
                    
                    // Obtener nombres de los días de la semana
                    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                    
                    // Calcular créditos para días futuros (aproximación basada en el precio del curso)
                    const calculateFutureCredits = (dayOffset: number, coursePrice: number, maxCredits: number, currentCredits: number) => {
                      if (dayOffset === 0) return null; // Hoy ya tiene sus créditos calculados
                      
                      const creditsToEarn = maxCredits - currentCredits;
                      let creditsPerDay = 1;
                      
                      if (coursePrice === 2) creditsPerDay = Math.max(1, Math.floor(creditsToEarn / 30));
                      else if (coursePrice === 5) creditsPerDay = Math.max(2, Math.floor(creditsToEarn / 25));
                      else if (coursePrice === 10) creditsPerDay = Math.max(3, Math.floor(creditsToEarn / 20));
                      else if (coursePrice === 20) creditsPerDay = Math.max(5, Math.floor(creditsToEarn / 15));
                      else if (coursePrice === 50) creditsPerDay = Math.max(10, Math.floor(creditsToEarn / 10));
                      else creditsPerDay = Math.max(1, Math.floor(creditsToEarn / 20));
                      
                      // Bonus por racha (simulado)
                      const streakBonus = Math.min(Math.floor((streakData.streak_days + dayOffset) / 3), 5);
                      return creditsPerDay + streakBonus;
                    };
                    
                    // Generar hoy y los próximos 6 días (7 días en total)
                    for (let i = 0; i < 7; i++) {
                      const date = new Date();
                      date.setDate(date.getDate() + i);
                      const dateStr = date.toISOString().split('T')[0];
                      const dayEntry = calendar[dateStr];
                      const isToday = dateStr === today;
                      const isClaimed = dayEntry?.claimed || false;
                      const hasCredits = dayEntry?.credits > 0;
                      const dayName = dayNames[date.getDay()];
                      
                      // Para días futuros sin entrada en el calendario, calcular créditos estimados
                      let futureCredits = null;
                      if (!dayEntry && i > 0) {
                        // Intentar obtener el precio del curso desde el contexto
                        futureCredits = calculateFutureCredits(
                          i,
                          course?.price || 5,
                          streakData.max_credits || 250,
                          streakData.credits_remaining || 0
                        );
                      }
                      
                      const showCredits = hasCredits || (futureCredits !== null && futureCredits > 0);
                      const creditsToShow = hasCredits ? dayEntry.credits : (futureCredits || 0);
                      
                      days.push(
                        <div
                          key={dateStr}
                          style={{
                            aspectRatio: "1",
                            borderRadius: isMobile ? "12px" : "16px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: isMobile ? "0.5rem" : "1rem",
                            background: isToday
                              ? "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"
                              : isClaimed
                              ? "linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)"
                              : showCredits
                              ? "linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(251, 191, 36, 0.05) 100%)"
                              : "var(--bg-overlay-05)",
                            border: isToday
                              ? "3px solid #6366f1"
                              : isClaimed
                              ? "2px solid #10b981"
                              : showCredits
                              ? "2px solid #fbbf24"
                              : "2px solid var(--border-overlay-1)",
                            boxShadow: isToday
                              ? "0 8px 24px rgba(99, 102, 241, 0.3)"
                              : isClaimed
                              ? "0 4px 12px rgba(16, 185, 129, 0.2)"
                              : showCredits
                              ? "0 4px 12px rgba(251, 191, 36, 0.2)"
                              : "0 2px 8px rgba(0, 0, 0, 0.05)",
                            transition: "all 0.2s ease",
                            position: "relative",
                          }}
                        >
                          <div style={{ 
                            fontSize: isMobile ? "0.7rem" : "0.875rem", 
                            fontWeight: "600", 
                            color: isToday ? "rgba(255, 255, 255, 0.8)" : "var(--text-secondary)",
                            marginBottom: isMobile ? "0.25rem" : "0.5rem"
                          }}>
                            {dayName}
                          </div>
                          <div style={{ 
                            fontSize: isMobile ? "1.25rem" : isTablet ? "1.5rem" : "1.75rem", 
                            fontWeight: "800", 
                            color: isToday ? "white" : "var(--text-primary)",
                            marginBottom: (showCredits && !isClaimed) || isToday ? "0.25rem" : "0"
                          }}>
                            {date.getDate()}
                          </div>
                          
                          {/* Botón de reclamar solo en el día de hoy */}
                          {isToday && !isClaimed && streakData.credits_available > 0 && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (!session?.user?.id || !courseId) {
                                  alert("Error: No se pudo identificar al usuario o el curso");
                                  return;
                                }
                                
                                try {
                                  const response = await fetch("/api/study-agents/claim-daily-credits", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      user_id: session.user.id,
                                      course_id: courseId,
                                    }),
                                  });
                                  
                                  const data = await response.json();
                                  
                                  if (response.ok && data.success) {
                                    // Recargar datos de racha y enrollment
                                    const streakResponse = await fetch("/api/study-agents/update-streak-credits", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        user_id: session.user.id,
                                        course_id: courseId,
                                      }),
                                    });
                                    
                                    if (streakResponse.ok) {
                                      const streakDataResult = await streakResponse.json();
                                      if (streakDataResult.success) {
                                        setStreakData(streakDataResult);
                                      }
                                    }
                                    
                                    // Recargar enrollment
                                    loadCourseData();
                                    
                                    // Cerrar modal inmediatamente
                                    setShowStreakModal(false);
                                  } else {
                                    alert(data.error || data.detail || data.message || "Error al reclamar créditos");
                                  }
                                } catch (error) {
                                  console.error("Error reclamando créditos:", error);
                                  alert(`Error al reclamar créditos: ${error instanceof Error ? error.message : "Error desconocido"}`);
                                }
                              }}
                              style={{
                                marginTop: "0.5rem",
                                padding: isMobile ? "0.5rem 0.75rem" : "0.75rem 1rem",
                                background: "rgba(255, 255, 255, 0.2)",
                                backdropFilter: "blur(8px)",
                                color: "white",
                                border: "2px solid rgba(255, 255, 255, 0.3)",
                                borderRadius: "8px",
                                fontSize: isMobile ? "0.7rem" : "0.875rem",
                                fontWeight: "700",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "0.5rem",
                                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                                transition: "all 0.2s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
                                e.currentTarget.style.transform = "scale(1.05)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                                e.currentTarget.style.transform = "scale(1)";
                              }}
                            >
                              <TbCoins size={isMobile ? 14 : 16} />
                              <span>Reclamar {streakData.credits_available}</span>
                            </button>
                          )}
                          
                          {/* Mostrar créditos disponibles o futuros */}
                          {showCredits && !isClaimed && !isToday && (
                            <div style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              gap: "0.25rem",
                              marginTop: isMobile ? "0.25rem" : "0.5rem",
                              fontSize: isMobile ? "0.7rem" : "0.875rem", 
                              fontWeight: "700",
                              color: "#f59e0b" 
                            }}>
                              <TbCoins size={isMobile ? 12 : 16} />
                              <span>+{creditsToShow}</span>
                            </div>
                          )}
                          
                          {isClaimed && (
                            <div style={{ 
                              marginTop: isMobile ? "0.25rem" : "0.5rem",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}>
                              <HiCheckCircle size={isMobile ? 18 : 24} color="#10b981" />
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    return days;
                  })()}
                </div>
                <div style={{ 
                  marginTop: isMobile ? "1rem" : "1.5rem", 
                  display: "grid",
                  gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, auto)",
                  gap: isMobile ? "0.75rem" : "1.5rem", 
                  fontSize: isMobile ? "0.75rem" : "0.875rem", 
                  color: "var(--text-secondary)",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ 
                      width: isMobile ? "16px" : "20px", 
                      height: isMobile ? "16px" : "20px", 
                      borderRadius: "6px", 
                      background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                      boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)"
                    }} />
                    <span style={{ fontWeight: "600" }}>Hoy</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ 
                      width: isMobile ? "16px" : "20px", 
                      height: isMobile ? "16px" : "20px", 
                      borderRadius: "6px", 
                      background: "rgba(16, 185, 129, 0.15)", 
                      border: "2px solid #10b981",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <HiCheckCircle size={isMobile ? 10 : 12} color="#10b981" />
                    </div>
                    <span style={{ fontWeight: "600" }}>Reclamado</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ 
                      width: isMobile ? "16px" : "20px", 
                      height: isMobile ? "16px" : "20px", 
                      borderRadius: "6px", 
                      background: "rgba(251, 191, 36, 0.15)", 
                      border: "2px solid #fbbf24",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <TbCoins size={isMobile ? 10 : 12} color="#fbbf24" />
                    </div>
                    <span style={{ fontWeight: "600" }}>Disponible</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ 
                      width: isMobile ? "16px" : "20px", 
                      height: isMobile ? "16px" : "20px", 
                      borderRadius: "6px", 
                      background: "var(--bg-overlay-05)", 
                      border: "2px solid var(--border-overlay-1)" 
                    }} />
                    <span style={{ fontWeight: "600" }}>Sin conexión</span>
                  </div>
                </div>
              </div>


              {/* Información de Créditos */}
              <div style={{
                background: "var(--bg-overlay-05)",
                borderRadius: "12px",
                padding: "1.5rem",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Créditos Actuales</span>
                  <span style={{ fontWeight: "700", fontSize: "1.25rem", color: "var(--text-primary)" }}>
                    {streakData.credits_remaining}
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Créditos Máximos</span>
                  <span style={{ fontWeight: "600", color: "var(--text-primary)" }}>
                    {streakData.max_credits}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista de Ranking Modal */}
      <div
        id="ranking-view"
        style={{
          display: "none",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.7)",
          backdropFilter: "blur(8px)",
          zIndex: 1000,
          padding: "2rem",
          overflow: "auto",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            e.currentTarget.style.display = "none";
          }
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            width: "90%",
            margin: "0 auto",
            background: "var(--bg-card)",
            backdropFilter: "blur(20px)",
            borderRadius: "24px",
            border: "1px solid var(--border-overlay-1)",
            maxHeight: "85vh",
            overflow: "auto",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ 
            padding: "2rem", 
            borderBottom: "1px solid var(--border-overlay-1)", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)"
          }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "600", color: "var(--text-primary)" }}>Ranking del Curso</h2>
            <button
              onClick={() => {
                const rankingView = document.getElementById("ranking-view");
                if (rankingView) rankingView.style.display = "none";
              }}
              style={{
                padding: "0.5rem",
                background: "var(--bg-overlay-05)",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: "var(--text-secondary)",
                borderRadius: "8px",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                e.currentTarget.style.color = "#ef4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--bg-overlay-05)";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <HiXMark size={24} />
            </button>
          </div>
          {session?.user?.id && <CourseRanking courseId={courseId} currentUserId={session.user.id} />}
        </div>
      </div>

      {/* Contenido Principal */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Cover Image Header - REMOVIDO */}

        {/* Barra de Navegación Unificada - Tabs + Espacio para Botones */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid var(--border-overlay-1)", 
          background: "var(--bg-card)",
          position: "relative",
          minHeight: "72px",
          padding: "0 1rem",
        }}>
          {/* Tabs de Vista - Diseño Profesional Mejorado */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            height: "100%",
            gap: "0.25rem"
          }}>
            <button
              onClick={() => setActiveView("topics")}
              style={{
                padding: "0.875rem 1.5rem",
                background: activeView === "topics" 
                  ? "var(--bg-card)" 
                  : "transparent",
                border: "none",
                borderBottom: activeView === "topics" 
                  ? "3px solid #6366f1" 
                  : "3px solid transparent",
                color: activeView === "topics" ? "#6366f1" : "var(--text-secondary)",
                cursor: "pointer",
                fontWeight: activeView === "topics" ? "600" : "500",
                fontSize: "0.9375rem",
                transition: "all 0.2s ease",
                position: "relative",
                height: "100%",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (activeView !== "topics") {
                  e.currentTarget.style.color = "var(--text-primary)";
                  e.currentTarget.style.background = "var(--bg-overlay-02)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeView !== "topics") {
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <HiAcademicCap size={18} />
              <span>{selectedTopic && !selectedTopic.includes(" > ") ? selectedTopic : "Temas"}</span>
            </button>
            <button
              onClick={() => setActiveView("summary")}
              style={{
                padding: "0.875rem 1.5rem",
                background: activeView === "summary" 
                  ? "var(--bg-card)" 
                  : "transparent",
                border: "none",
                borderBottom: activeView === "summary" 
                  ? "3px solid #6366f1" 
                  : "3px solid transparent",
                color: activeView === "summary" ? "#6366f1" : "var(--text-secondary)",
                cursor: "pointer",
                fontWeight: activeView === "summary" ? "600" : "500",
                fontSize: "0.9375rem",
                transition: "all 0.2s ease",
                height: "100%",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (activeView !== "summary") {
                  e.currentTarget.style.color = "var(--text-primary)";
                  e.currentTarget.style.background = "var(--bg-overlay-02)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeView !== "summary") {
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <HiDocumentText size={18} />
              <span>Resumen</span>
            </button>
            <button
              onClick={() => setActiveView("chat")}
              style={{
                padding: "0.875rem 1.5rem",
                background: activeView === "chat" 
                  ? "var(--bg-card)" 
                  : "transparent",
                border: "none",
                borderBottom: activeView === "chat" 
                  ? "3px solid #6366f1" 
                  : "3px solid transparent",
                color: activeView === "chat" ? "#6366f1" : "var(--text-secondary)",
                cursor: "pointer",
                fontWeight: activeView === "chat" ? "600" : "500",
                fontSize: "0.9375rem",
                transition: "all 0.2s ease",
                height: "100%",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (activeView !== "chat") {
                  e.currentTarget.style.color = "var(--text-primary)";
                  e.currentTarget.style.background = "var(--bg-overlay-02)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeView !== "chat") {
                  e.currentTarget.style.color = "var(--text-secondary)";
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <HiChatBubbleLeftRight size={18} />
              <span>Chat</span>
            </button>
          </div>
          
          {/* Botones de Acción - Integrados con el diseño */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "0.375rem",
            flexShrink: 0,
            marginLeft: "auto",
            paddingLeft: "1rem",
            borderLeft: "1px solid var(--border-overlay-1)",
          }}>
            <button
              onClick={async () => {
                if (session?.user?.id) {
                  try {
                    const streakResponse = await fetch("/api/study-agents/update-streak-credits", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        user_id: session.user.id,
                        course_id: courseId,
                      }),
                    });
                    
                    if (streakResponse.ok) {
                      const streakDataResult = await streakResponse.json();
                      if (streakDataResult.success) {
                        setStreakData(streakDataResult);
                        setShowStreakModal(true);
                      }
                    }
                  } catch (error) {
                    console.error("Error cargando racha:", error);
                  }
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.375rem",
                padding: "0.5rem 0.875rem",
                background: "transparent",
                border: "none",
                borderRadius: "6px",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "500",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-overlay-02)";
                e.currentTarget.style.color = "#fbbf24";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <TbFlame size={16} />
              <span>Racha</span>
            </button>
            
            <button
              onClick={() => {
                const rankingView = document.getElementById("ranking-view");
                if (rankingView) rankingView.style.display = "flex";
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.375rem",
                padding: "0.5rem 0.875rem",
                background: "transparent",
                border: "none",
                borderRadius: "6px",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "500",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-overlay-02)";
                e.currentTarget.style.color = "#6366f1";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <HiTrophy size={16} />
              <span>Ranking</span>
            </button>
            
            <button
              onClick={async () => {
                // Verificar si ya tiene una review antes de finalizar
                if (!hasReviewed) {
                  setShowReviewModal(true);
                  return;
                }
                
                if (!confirm("¿Estás seguro de que quieres finalizar este curso?")) {
                  return;
                }
                
                try {
                  const response = await fetch("/api/study-agents/unenroll-course", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: session?.user?.id,
                      courseId: courseId,
                    }),
                  });
                  
                  if (response.ok) {
                    router.push("/study-agents");
                  } else {
                    alert("Error al finalizar el curso");
                  }
                } catch (error) {
                  console.error("Error:", error);
                  alert("Error al finalizar el curso");
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.375rem",
                padding: "0.5rem 0.875rem",
                background: "transparent",
                border: "none",
                borderRadius: "6px",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "500",
                transition: "all 0.2s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg-overlay-02)";
                e.currentTarget.style.color = "#ef4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-secondary)";
              }}
            >
              <HiXMark size={16} />
              <span>Finalizar</span>
            </button>
          </div>
        </div>

        {/* Contenido según vista activa */}
        {activeView === "topics" && selectedTopic ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "3rem 2rem" }}>
            <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
              {(() => {
                // Detectar si es un subtopic (contiene " > ")
                const isSubtopic = selectedTopic.includes(" > ");
                if (isSubtopic) {
                  const [mainTopic, subtopic] = selectedTopic.split(" > ");
                  return (
                    <>
                      <h1 style={{ 
                        fontSize: "clamp(2rem, 4vw, 3rem)", 
                        fontWeight: "700", 
                        marginBottom: "0.5rem",
                        color: "var(--text-primary)",
                        letterSpacing: "-0.03em",
                        lineHeight: "1.1"
                      }}>
                        {mainTopic}
                      </h1>
                      <h2 style={{ 
                        fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)", 
                        fontWeight: "500", 
                        marginBottom: "0.75rem",
                        color: "var(--text-secondary)",
                        letterSpacing: "-0.02em",
                        lineHeight: "1.2"
                      }}>
                        {subtopic}
                      </h2>
                    </>
                  );
                } else {
                  return (
                    <h1 style={{ 
                      fontSize: "clamp(2rem, 4vw, 3rem)", 
                      fontWeight: "700", 
                      marginBottom: "0.75rem",
                      color: "var(--text-primary)",
                      letterSpacing: "-0.03em",
                      lineHeight: "1.1"
                    }}>
                      {selectedTopic}
                    </h1>
                  );
                }
              })()}
              <div style={{ 
                marginBottom: "3rem", 
                color: "var(--text-secondary)",
                fontSize: "1rem"
              }}>
                Progreso: <span style={{ color: "#6366f1", fontWeight: "600" }}>{Math.round(currentTopicProgress)}%</span>
              </div>

              {/* Herramientas Disponibles - Cards estilo página principal */}
              <div style={{ marginBottom: "3rem" }}>
                <h3 style={{ 
                  fontSize: "1.5rem", 
                  fontWeight: "600", 
                  marginBottom: "1.5rem",
                  color: "var(--text-primary)"
                }}>
                  Herramientas
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
                  {course.available_tools.notes && (
                    <div
                      onClick={async () => {
                        // TODO: Generar apuntes para el tema
                        alert("Generando apuntes...");
                      }}
                      style={{
                        background: "var(--bg-card)",
                        borderRadius: "16px",
                        border: "1px solid var(--border-overlay-1)",
                        padding: "2rem",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        textDecoration: "none",
                        color: "inherit",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                        e.currentTarget.style.background = "var(--bg-overlay-04)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                        e.currentTarget.style.background = "var(--bg-card)";
                      }}
                    >
                      <div style={{
                        marginBottom: "1.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "64px",
                        height: "64px",
                        borderRadius: "12px",
                        background: "rgba(99, 102, 241, 0.1)",
                        border: "1px solid rgba(99, 102, 241, 0.2)",
                      }}>
                        <HiDocumentText size={32} color="#6366f1" />
                      </div>
                      <h4 style={{ 
                        fontSize: "1.25rem", 
                        fontWeight: "600", 
                        marginBottom: "0.5rem",
                        color: "var(--text-primary)",
                        lineHeight: "1.3"
                      }}>
                        Generar Apuntes
                      </h4>
                      <p style={{ 
                        color: "var(--text-secondary)", 
                        fontSize: "0.95rem", 
                        lineHeight: "1.6"
                      }}>
                        Ideal para repasar y consolidar conceptos clave
                      </p>
                    </div>
                  )}
                  {course.available_tools.tests && (
                    <div
                      onClick={async () => {
                        // TODO: Generar test para el tema
                        alert("Generando test...");
                      }}
                      style={{
                        background: "var(--bg-card)",
                        borderRadius: "16px",
                        border: "1px solid var(--border-overlay-1)",
                        padding: "2rem",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        textDecoration: "none",
                        color: "inherit",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                        e.currentTarget.style.background = "var(--bg-overlay-04)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                        e.currentTarget.style.background = "var(--bg-card)";
                      }}
                    >
                      <div style={{
                        marginBottom: "1.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "64px",
                        height: "64px",
                        borderRadius: "12px",
                        background: "rgba(99, 102, 241, 0.1)",
                        border: "1px solid rgba(99, 102, 241, 0.2)",
                      }}>
                        <HiClipboardDocumentCheck size={32} color="#6366f1" />
                      </div>
                      <h4 style={{ 
                        fontSize: "1.25rem", 
                        fontWeight: "600", 
                        marginBottom: "0.5rem",
                        color: "var(--text-primary)",
                        lineHeight: "1.3"
                      }}>
                        Generar Test
                      </h4>
                      <p style={{ 
                        color: "var(--text-secondary)", 
                        fontSize: "0.95rem", 
                        lineHeight: "1.6"
                      }}>
                        Evalúa tu nivel y conocimientos del tema
                      </p>
                    </div>
                  )}
                  {course.available_tools.exercises && (
                    <div
                      onClick={async () => {
                        // TODO: Generar ejercicio para el tema
                        alert("Generando ejercicio...");
                      }}
                      style={{
                        background: "var(--bg-card)",
                        borderRadius: "16px",
                        border: "1px solid var(--border-overlay-1)",
                        padding: "2rem",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        textDecoration: "none",
                        color: "inherit",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                        e.currentTarget.style.background = "var(--bg-overlay-04)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                        e.currentTarget.style.background = "var(--bg-card)";
                      }}
                    >
                      <div style={{
                        marginBottom: "1.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "64px",
                        height: "64px",
                        borderRadius: "12px",
                        background: "rgba(99, 102, 241, 0.1)",
                        border: "1px solid rgba(99, 102, 241, 0.2)",
                      }}>
                        <HiPencilSquare size={32} color="#6366f1" />
                      </div>
                      <h4 style={{ 
                        fontSize: "1.25rem", 
                        fontWeight: "600", 
                        marginBottom: "0.5rem",
                        color: "var(--text-primary)",
                        lineHeight: "1.3"
                      }}>
                        Generar Ejercicio
                      </h4>
                      <p style={{ 
                        color: "var(--text-secondary)", 
                        fontSize: "0.95rem", 
                        lineHeight: "1.6"
                      }}>
                        Practica con ejercicios personalizados
                      </p>
                    </div>
                  )}
                  {course.available_tools.games && (
                    <div
                      onClick={() => {
                        setActiveView("games");
                      }}
                      style={{
                        background: "var(--bg-card)",
                        borderRadius: "16px",
                        border: "1px solid var(--border-overlay-1)",
                        padding: "2rem",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        textDecoration: "none",
                        color: "inherit",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.3)";
                        e.currentTarget.style.background = "var(--bg-overlay-04)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                        e.currentTarget.style.background = "var(--bg-card)";
                      }}
                    >
                      <div style={{
                        marginBottom: "1.5rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "64px",
                        height: "64px",
                        borderRadius: "12px",
                        background: "rgba(99, 102, 241, 0.1)",
                        border: "1px solid rgba(99, 102, 241, 0.2)",
                      }}>
                        <HiTrophy size={32} color="#6366f1" />
                      </div>
                      <h4 style={{ 
                        fontSize: "1.25rem", 
                        fontWeight: "600", 
                        marginBottom: "0.5rem",
                        color: "var(--text-primary)",
                        lineHeight: "1.3"
                      }}>
                        Juegos Multijugador
                      </h4>
                      <p style={{ 
                        color: "var(--text-secondary)", 
                        fontSize: "0.95rem", 
                        lineHeight: "1.6"
                      }}>
                        Juega parchís con preguntas del curso junto a otros estudiantes
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : activeView === "games" ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "2rem" }}>
            <GamesView 
              courseId={courseId}
              userId={session?.user?.id || ""}
              course={course}
            />
          </div>
        ) : activeView === "topics" && !selectedTopic ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "3rem 2rem" }}>
            <div style={{ maxWidth: "1400px", margin: "0 auto", textAlign: "center" }}>
              <div style={{ 
                width: "80px", 
                height: "80px", 
                borderRadius: "20px",
                background: "rgba(99, 102, 241, 0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 2rem"
              }}>
                <HiAcademicCap size={40} style={{ color: "#6366f1" }} />
              </div>
              <h2 style={{ 
                fontSize: "clamp(1.5rem, 3vw, 2rem)", 
                fontWeight: "600", 
                marginBottom: "0.75rem",
                color: "var(--text-primary)",
                letterSpacing: "-0.02em"
              }}>
                Selecciona un tema
              </h2>
              <p style={{ 
                color: "var(--text-secondary)", 
                fontSize: "0.95rem",
                lineHeight: "1.6",
                maxWidth: "500px",
                margin: "0 auto"
              }}>
                Elige un tema del curso para comenzar a estudiar con las herramientas de IA
              </p>
            </div>
          </div>
        ) : activeView === "summary" && selectedTopic ? (
          <div style={{ flex: 1, overflowY: "auto", padding: "3rem 2rem" }}>
            <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
              {(() => {
                // Detectar si es un subtopic (contiene " > ")
                const isSubtopic = selectedTopic.includes(" > ");
                if (isSubtopic) {
                  const [mainTopic, subtopic] = selectedTopic.split(" > ");
                  return (
                    <>
                      <h1 style={{ 
                        fontSize: "clamp(2rem, 4vw, 3rem)", 
                        fontWeight: "700", 
                        marginBottom: "0.5rem",
                        color: "var(--text-primary)",
                        letterSpacing: "-0.03em",
                        lineHeight: "1.1"
                      }}>
                        Resumen: {mainTopic}
                      </h1>
                      <h2 style={{ 
                        fontSize: "clamp(1.25rem, 2.5vw, 1.75rem)", 
                        fontWeight: "500", 
                        marginBottom: "2rem",
                        color: "var(--text-secondary)",
                        letterSpacing: "-0.02em",
                        lineHeight: "1.2"
                      }}>
                        {subtopic}
                      </h2>
                    </>
                  );
                } else {
                  return (
                    <h1 style={{ 
                      fontSize: "clamp(2rem, 4vw, 3rem)", 
                      fontWeight: "700", 
                      marginBottom: "2rem",
                      color: "var(--text-primary)",
                      letterSpacing: "-0.03em",
                      lineHeight: "1.1"
                    }}>
                      Resumen: {selectedTopic}
                    </h1>
                  );
                }
              })()}
              
              {generatingNotes[selectedTopic] ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "4rem 2rem",
                  color: "var(--text-secondary)"
                }}>
                  <div style={{
                    width: "40px",
                    height: "40px",
                    border: "3px solid rgba(99, 102, 241, 0.2)",
                    borderTop: "3px solid #6366f1",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                    margin: "0 auto 1rem"
                  }} />
                  <p>Generando resumen del tema...</p>
                  <style jsx>{`
                    @keyframes spin {
                      0% { transform: rotate(0deg); }
                      100% { transform: rotate(360deg); }
                    }
                  `}</style>
                </div>
              ) : topicSummary[selectedTopic] ? (
                <>
                  {/* Botón de descargar PDF */}
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "flex-end", 
                    marginBottom: "1rem",
                    gap: "0.5rem"
                  }}>
                    <button
                      onClick={downloadPDF}
                      style={{
                        padding: "0.75rem 1.5rem",
                        background: "#6366f1",
                        color: "white",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "0.9rem",
                        fontWeight: "500",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "#4f46e5";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "#6366f1";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      <HiArrowDownTray size={18} />
                      <span>Descargar PDF</span>
                    </button>
                  </div>
                  
                  {/* Contenedor de apuntes con formato de página */}
                  <div 
                    ref={notesContentRef}
                    style={{
                      background: "#ffffff",
                      padding: "4rem",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                      maxWidth: "210mm", // A4 width
                      margin: "0 auto",
                      minHeight: "297mm", // A4 height
                      color: "#1f2937",
                      fontFamily: "'Georgia', 'Times New Roman', serif",
                      lineHeight: "1.8",
                      fontSize: "1.1rem",
                    }}
                  >
                    {/* Detectar si es HTML o Markdown */}
                    {topicSummary[selectedTopic].trim().startsWith('<') || 
                     topicSummary[selectedTopic].includes('<div') || 
                     topicSummary[selectedTopic].includes('<h1') || 
                     topicSummary[selectedTopic].includes('<p') ? (
                      // Es HTML, usar dangerouslySetInnerHTML con procesamiento de fórmulas
                      <div 
                        className="notes-html-content"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(processMathFormulas(topicSummary[selectedTopic]), {
                            ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'ul', 'ol', 'li', 'strong', 'em', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'section', 'span', 'hr', 'blockquote', 'br', 'img'],
                            ALLOWED_ATTR: ['style', 'class', 'id', 'src', 'alt', 'title'],
                            ALLOW_DATA_ATTR: false,
                            KEEP_CONTENT: true,
                            FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
                            FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout'],
                            ALLOWED_STYLES: {
                              '*': {
                                '*': true  // Permitir todos los estilos CSS
                              }
                            },
                            ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
                          })
                        }}
                        style={{
                          color: "#1f2937",
                          lineHeight: "1.8",
                          fontSize: "1.1rem",
                        }}
                      />
                    ) : (
                      // Es Markdown, usar ReactMarkdown con procesamiento de fórmulas
                      <div 
                        className="notes-markdown-content"
                        style={{
                          color: "#1f2937",
                          lineHeight: "1.8",
                          fontSize: "1.1rem",
                        }}
                      >
                        <ReactMarkdown
                          remarkPlugins={[]}
                          components={{
                            h1: ({ ...props }) => <h1 {...props} style={{ fontSize: "2.5rem", fontWeight: 700, marginTop: "2rem", marginBottom: "1.5rem", color: "#111827", borderBottom: "2px solid #6366f1", paddingBottom: "0.5rem" }} />,
                            h2: ({ ...props }) => <h2 {...props} style={{ fontSize: "2rem", fontWeight: 600, marginTop: "2rem", marginBottom: "1rem", color: "#1f2937" }} />,
                            h3: ({ ...props }) => <h3 {...props} style={{ fontSize: "1.5rem", fontWeight: 600, marginTop: "1.5rem", marginBottom: "0.75rem", color: "#374151" }} />,
                            p: ({ ...props }) => {
                              // ReactMarkdown pasa children como ReactNode, necesitamos extraer el texto
                              let childrenStr = '';
                              if (typeof props.children === 'string') {
                                childrenStr = props.children;
                              } else if (Array.isArray(props.children)) {
                                childrenStr = props.children.map(c => {
                                  if (typeof c === 'string') return c;
                                  if (typeof c === 'object' && c !== null && 'props' in c) {
                                    // Es un elemento React, extraer texto
                                    return c.props?.children?.toString() || String(c);
                                  }
                                  return String(c);
                                }).join('');
                              } else if (props.children) {
                                childrenStr = String(props.children);
                              }
                              const processed = processMathFormulas(childrenStr);
                              return <p {...props} style={{ marginBottom: "1.25rem", textAlign: "justify" }} dangerouslySetInnerHTML={{ __html: processed }} />;
                            },
                            strong: ({ ...props }) => <strong {...props} style={{ fontWeight: 700, color: "#6366f1" }} />,
                            em: ({ ...props }) => <em {...props} style={{ fontStyle: "italic" }} />,
                            ul: ({ ...props }) => <ul {...props} style={{ marginLeft: "2rem", marginBottom: "1.25rem", listStyleType: "disc" }} />,
                            ol: ({ ...props }) => <ol {...props} style={{ marginLeft: "2rem", marginBottom: "1.25rem" }} />,
                            li: ({ ...props }) => {
                              // ReactMarkdown pasa children como ReactNode, necesitamos extraer el texto
                              let childrenStr = '';
                              if (typeof props.children === 'string') {
                                childrenStr = props.children;
                              } else if (Array.isArray(props.children)) {
                                childrenStr = props.children.map(c => {
                                  if (typeof c === 'string') return c;
                                  if (typeof c === 'object' && c !== null && 'props' in c) {
                                    // Es un elemento React, extraer texto
                                    return c.props?.children?.toString() || String(c);
                                  }
                                  return String(c);
                                }).join('');
                              } else if (props.children) {
                                childrenStr = String(props.children);
                              }
                              const processed = processMathFormulas(childrenStr);
                              return <li {...props} style={{ marginBottom: "0.5rem" }} dangerouslySetInnerHTML={{ __html: processed }} />;
                            },
                            img: ({ ...props }) => <img {...props} style={{ maxWidth: "100%", height: "auto", borderRadius: "8px", margin: "1.5rem 0", display: "block", marginLeft: "auto", marginRight: "auto" }} />,
                            code: ({ ...props }) => <code {...props} style={{ background: "#f3f4f6", padding: "0.2em 0.4em", borderRadius: "4px", fontFamily: "'Courier New', monospace", fontSize: "0.9em" }} />,
                            pre: ({ ...props }) => <pre {...props} style={{ background: "#1f2937", color: "#f9fafb", padding: "1rem", borderRadius: "8px", overflow: "auto", margin: "1.5rem 0" }} />,
                          }}
                        >
                          {topicSummary[selectedTopic]}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ 
                  textAlign: "center", 
                  padding: "4rem 2rem",
                  color: "var(--text-secondary)"
                }}>
                  <p>No hay resumen disponible para este tema.</p>
                  <p style={{ fontSize: "0.9rem", marginTop: "0.5rem", color: "var(--text-muted)" }}>
                    El resumen se generará automáticamente cuando selecciones el tema.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Vista de Chat */
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ flex: 1, overflowY: "auto", padding: "2rem" }}>
              {messages.length === 0 ? (
                <div style={{ 
                  textAlign: "center", 
                  padding: "6rem 2rem", 
                  color: "var(--text-secondary)",
                  maxWidth: "700px",
                  margin: "0 auto"
                }}>
                  <HiChatBubbleLeftRight size={64} style={{ margin: "0 auto 1.5rem", color: "rgba(99, 102, 241, 0.5)" }} />
                  <p style={{ fontSize: "1.5rem", marginBottom: "0.75rem", color: "var(--text-primary)", fontWeight: "500" }}>
                    ¡Hola! Soy tu asistente de estudio
                  </p>
                  <p style={{ fontSize: "1rem", lineHeight: "1.6" }}>
                    Pregúntame lo que necesites o pídeme que te guíe en tu preparación.
                  </p>
                </div>
              ) : (
                <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: "1.5rem",
                        display: "flex",
                        justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                        alignItems: "flex-start",
                        gap: "0.75rem",
                      }}
                    >
                      {msg.role === "assistant" && (
                        <div style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: "0 2px 10px rgba(99, 102, 241, 0.3)",
                        }}>
                          <HiChatBubbleLeftRight size={20} color="white" />
                        </div>
                      )}
                      <div
                        style={{
                          maxWidth: "75%",
                          padding: "1.25rem 1.5rem",
                          background: msg.role === "user" 
                            ? "#6366f1" 
                            : "var(--bg-card)",
                          color: msg.role === "user" ? "white" : "var(--text-primary)",
                          borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                          border: msg.role === "assistant" ? "1px solid var(--border-overlay-1)" : "none",
                          boxShadow: msg.role === "user" 
                            ? "0 4px 20px rgba(99, 102, 241, 0.25)" 
                            : "0 2px 10px rgba(0, 0, 0, 0.05)",
                          lineHeight: "1.7",
                          fontSize: "0.95rem",
                        }}
                      >
                        {msg.role === "assistant" ? (
                          <div style={{ color: "var(--text-primary)" }}>
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: "1.6" }}>{msg.content}</p>
                        )}
                      </div>
                      {msg.role === "user" && (
                        <div style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          background: "rgba(99, 102, 241, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          border: "1px solid rgba(99, 102, 241, 0.2)",
                        }}>
                          <span style={{ color: "#6366f1", fontWeight: "600", fontSize: "0.875rem" }}>Tú</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {sending && (
                    <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "1.5rem", alignItems: "flex-start", gap: "0.75rem" }}>
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: "0 2px 10px rgba(99, 102, 241, 0.3)",
                      }}>
                        <HiChatBubbleLeftRight size={20} color="white" />
                      </div>
                      <div
                        style={{
                          padding: "1.25rem 1.5rem",
                          background: "var(--bg-card)",
                          borderRadius: "16px 16px 16px 4px",
                          border: "1px solid var(--border-overlay-1)",
                          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.05)",
                        }}
                      >
                        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                          <div style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "var(--text-muted)",
                            animation: "pulse 1.4s ease-in-out infinite",
                          }} />
                          <div style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "var(--text-muted)",
                            animation: "pulse 1.4s ease-in-out infinite 0.2s",
                          }} />
                          <div style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "var(--text-muted)",
                            animation: "pulse 1.4s ease-in-out infinite 0.4s",
                          }} />
                        </div>
                        <style jsx>{`
                          @keyframes pulse {
                            0%, 60%, 100% { opacity: 0.3; transform: scale(1); }
                            30% { opacity: 1; transform: scale(1.2); }
                          }
                        `}</style>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input de Mensaje - Diseño como buscador */}
            <div style={{ 
              padding: "1.5rem 2rem", 
              borderTop: "1px solid var(--border-overlay-1)", 
              background: "var(--bg-card)",
            }}>
              <div style={{ 
                maxWidth: "800px", 
                margin: "0 auto",
                position: "relative"
              }}>
                <div style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  background: "var(--bg-card)",
                  border: "3px solid var(--border-overlay-1)",
                  borderRadius: "50px",
                  padding: "0.75rem 1.5rem",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#6366f1";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.25)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-overlay-1)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
                >
                  {/* Botón de micrófono a la izquierda */}
                  <button
                    onClick={toggleRecording}
                    disabled={sending}
                    style={{
                      background: isRecording ? "#ef4444" : "transparent",
                      border: "none",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: sending ? "not-allowed" : "pointer",
                      marginRight: "1rem",
                      flexShrink: 0,
                      transition: "all 0.2s ease",
                      color: isRecording ? "white" : "#6366f1",
                    }}
                    onMouseEnter={(e) => {
                      if (!sending && !isRecording) {
                        e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!sending && !isRecording) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    <HiMicrophone 
                      size={20}
                      style={{
                        animation: isRecording ? "pulse 1.5s ease-in-out infinite" : "none"
                      }}
                    />
                    <style jsx>{`
                      @keyframes pulse {
                        0%, 100% { opacity: 1; transform: scale(1); }
                        50% { opacity: 0.7; transform: scale(1.1); }
                      }
                    `}</style>
                  </button>
                  
                  {/* Input */}
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Escribe tu pregunta..."
                    disabled={sending}
                    style={{
                      flex: 1,
                      padding: "0.25rem 0",
                      fontSize: "1.05rem",
                      fontWeight: "600",
                      background: "transparent",
                      border: "none",
                      color: "var(--text-primary)",
                      outline: "none",
                      transition: "all 0.2s ease",
                    }}
                    onFocus={(e) => {
                      const container = e.currentTarget.closest('div[style*="background"]') as HTMLElement;
                      if (container) {
                        container.style.borderColor = "#6366f1";
                        container.style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.3)";
                      }
                    }}
                    onBlur={(e) => {
                      const container = e.currentTarget.closest('div[style*="background"]') as HTMLElement;
                      if (container) {
                        container.style.borderColor = "var(--border-overlay-1)";
                        container.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)";
                      }
                    }}
                  />
                  
                  {/* Botón de enviar */}
                  <button
                    onClick={handleSendMessage}
                    disabled={sending || !inputMessage.trim()}
                    style={{
                      background: sending || !inputMessage.trim() 
                        ? "rgba(156, 163, 175, 0.2)" 
                        : "#6366f1",
                      border: "none",
                      borderRadius: "50%",
                      width: "40px",
                      height: "40px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: sending || !inputMessage.trim() ? "not-allowed" : "pointer",
                      marginLeft: "1rem",
                      flexShrink: 0,
                      transition: "all 0.2s ease",
                      color: "white",
                      boxShadow: sending || !inputMessage.trim() 
                        ? "none" 
                        : "0 4px 12px rgba(99, 102, 241, 0.3)",
                    }}
                    onMouseEnter={(e) => {
                      if (!sending && inputMessage.trim()) {
                        e.currentTarget.style.transform = "translateY(-2px)";
                        e.currentTarget.style.boxShadow = "0 6px 20px rgba(99, 102, 241, 0.4)";
                        e.currentTarget.style.background = "#5855eb";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!sending && inputMessage.trim()) {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(99, 102, 241, 0.3)";
                        e.currentTarget.style.background = "#6366f1";
                      }
                    }}
                  >
                    <HiPaperAirplane size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Valoración */}
      {showReviewModal && session?.user?.id && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
          }}
          onClick={(e) => {
            // No permitir cerrar sin valorar si el curso ha finalizado
            if (!isCourseFinished && e.target === e.currentTarget) {
              setShowReviewModal(false);
            }
          }}
        >
          <div
            style={{
              maxWidth: "600px",
              width: "100%",
              background: "var(--bg-card)",
              borderRadius: "24px",
              border: "1px solid var(--border-overlay-1)",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: "2rem",
              borderBottom: "1px solid var(--border-overlay-1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)"
            }}>
              <h2 style={{ fontSize: "1.5rem", fontWeight: "600", color: "var(--text-primary)", margin: 0 }}>
                {isCourseFinished ? "¡Curso Finalizado!" : "Valorar Curso"}
              </h2>
              {!isCourseFinished && (
                <button
                  onClick={() => setShowReviewModal(false)}
                  style={{
                    padding: "0.5rem",
                    background: "var(--bg-overlay-05)",
                    border: "none",
                    fontSize: "1.5rem",
                    cursor: "pointer",
                    color: "var(--text-secondary)",
                    borderRadius: "8px",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
                    e.currentTarget.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--bg-overlay-05)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  <HiXMark size={24} />
                </button>
              )}
            </div>
            <div style={{ padding: "2rem" }}>
              <SatisfactionFeedback
                courseId={courseId}
                userId={session.user.id}
                onSubmitted={() => {
                  setHasReviewed(true);
                  setShowReviewModal(false);
                  if (isCourseFinished) {
                    // Después de valorar, permitir finalizar
                    if (confirm("¿Quieres finalizar el curso ahora?")) {
                      fetch("/api/study-agents/unenroll-course", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          userId: session.user.id,
                          courseId: courseId,
                        }),
                      })
                        .then(res => {
                          if (res.ok) {
                            router.push("/study-agents");
                          }
                        });
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
