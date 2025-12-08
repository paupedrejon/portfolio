"use client";

import { useState, useRef, useEffect } from "react";
import { spaceGrotesk, outfit, jetbrainsMono } from "../app/fonts";
import APIKeyConfig from "./APIKeyConfig";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DiagramRenderer from "./DiagramRenderer";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  MoonIcon,
  SunIcon,
  FileIcon,
  NotesIcon,
  TestIcon,
  SendIcon,
  CheckIcon,
  XIcon,
  AlertIcon,
  BookIcon,
  LightbulbIcon,
  DownloadIcon,
  UploadIcon,
  SparklesIcon,
  ClipboardIcon,
  MessageIcon,
  QuestionIcon,
  SettingsIcon,
  KeyIcon,
  SparkleIcon,
  StarIcon,
  TargetIcon,
  ZapIcon,
  LinkIcon,
  LoaderIcon,
} from "./Icons";
import { calculateCost, formatCost, estimateTokens, CostEstimate, MODEL_PRICING } from "./costCalculator";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  type?: "message" | "notes" | "test" | "feedback";
  timestamp: Date;
  costEstimate?: CostEstimate;
}

interface TestQuestion {
  id: string;
  question: string;
  type: "multiple_choice" | "true_false" | "short_answer";
  options?: string[];
  correct_answer: string;
  explanation?: string;
}

interface Test {
  id: string;
  questions: TestQuestion[];
  difficulty: string;
}

export default function StudyChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>("Procesando...");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [currentTest, setCurrentTest] = useState<Test | null>(null);
  const [testAnswers, setTestAnswers] = useState<Record<string, string>>({});
  const [showAPIKeyConfig, setShowAPIKeyConfig] = useState(false);
  const [apiKeys, setApiKeys] = useState<{ openai: string } | null>(null);
  // Inicializar colorTheme solo en el cliente para evitar errores de hidratación
  const [colorTheme, setColorTheme] = useState<"dark" | "light">(() => {
    // Solo leer de localStorage en el cliente
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("study_agents_color_theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        return savedTheme;
      }
    }
    return "light";
  });
  const [isMounted, setIsMounted] = useState(false);
  // Inicializar modelo solo en el cliente para evitar errores de hidratación
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    // Solo leer de localStorage en el cliente
    if (typeof window !== "undefined") {
      const savedModel = localStorage.getItem("study_agents_model");
      if (savedModel) {
        return savedModel;
      }
    }
    return "gpt-4-turbo";
  });
  // Estados para acumular tokens y costos totales
  const [totalStats, setTotalStats] = useState<{
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
    byModel: Record<string, { inputTokens: number; outputTokens: number; cost: number }>;
  }>({
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
    byModel: {},
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Marcar como montado después de la hidratación
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Guardar tema cuando cambie (solo en el cliente)
  useEffect(() => {
    if (typeof window !== "undefined" && isMounted) {
      localStorage.setItem("study_agents_color_theme", colorTheme);
    }
  }, [colorTheme, isMounted]);
  
  // Guardar modelo cuando cambie (solo en el cliente)
  useEffect(() => {
    if (typeof window !== "undefined" && isMounted) {
      localStorage.setItem("study_agents_model", selectedModel);
    }
  }, [selectedModel, isMounted]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Verificar si hay API keys configuradas al cargar
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("study_agents_api_keys");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.openai && parsed.openai.startsWith("sk-")) {
            setApiKeys(parsed);
          } else {
            setShowAPIKeyConfig(true);
          }
        } catch (e) {
          setShowAPIKeyConfig(true);
        }
      } else {
        setShowAPIKeyConfig(true);
      }
    }
  }, []);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Verificar API key antes de continuar
    if (!apiKeys?.openai) {
      setShowAPIKeyConfig(true);
      addMessage({
        role: "system",
        content: "Por favor, configura tu API key de OpenAI para subir documentos.",
        type: "message",
      });
      return;
    }

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });
    formData.append("apiKey", apiKeys.openai);

    setIsLoading(true);
    setLoadingMessage("Cargando y procesando documentos...");

    try {
      const response = await fetch("/api/study-agents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const fileNames = Array.from(files).map((f) => f.name);
        setUploadedFiles((prev) => [...prev, ...fileNames]);

        // Crear mensaje visual mejorado con componente especial
        addMessage({
          role: "assistant",
          content: JSON.stringify({
            type: "success",
            fileNames: fileNames,
          }),
          type: "success",
        });
      } else {
        addMessage({
          role: "assistant",
          content: `Error: ${data.error || "No se pudieron procesar los archivos"}`,
          type: "message",
        });
      }
    } catch (error: any) {
      addMessage({
        role: "assistant",
        content: `Error al subir archivos: ${error.message}`,
        type: "message",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (message: Omit<Message, "id" | "timestamp">) => {
    const newMessage: Message = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    
    // Acumular tokens y costos si hay costEstimate
    if (message.costEstimate) {
      setTotalStats((prev) => {
        const model = message.costEstimate!.model;
        const currentModelStats = prev.byModel[model] || { inputTokens: 0, outputTokens: 0, cost: 0 };
        
        return {
          totalInputTokens: prev.totalInputTokens + message.costEstimate!.inputTokens,
          totalOutputTokens: prev.totalOutputTokens + message.costEstimate!.outputTokens,
          totalCost: prev.totalCost + message.costEstimate!.totalCost,
          byModel: {
            ...prev.byModel,
            [model]: {
              inputTokens: currentModelStats.inputTokens + message.costEstimate!.inputTokens,
              outputTokens: currentModelStats.outputTokens + message.costEstimate!.outputTokens,
              cost: currentModelStats.cost + message.costEstimate!.totalCost,
            },
          },
        };
      });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading || isGeneratingTest) return;

    // Verificar API keys antes de continuar
    if (!apiKeys?.openai) {
      setShowAPIKeyConfig(true);
      addMessage({
        role: "system",
        content: "Por favor, configura tu API key de OpenAI para usar el sistema.",
        type: "message",
      });
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    addMessage({
      role: "user",
      content: userMessage,
      type: "message",
    });

    try {
      // Detectar comandos especiales
      const lowerInput = userMessage.toLowerCase();
      
      // Detectar si el usuario está pidiendo un test
      const testKeywords = ["test", "examen", "evaluación", "prueba", "cuestionario", "genera un test", "hazme un test", "crea un test", "quiero un test"];
      const isTestRequest = testKeywords.some(keyword => lowerInput.includes(keyword));

      if (lowerInput.includes("genera apuntes") || lowerInput.includes("crea apuntes")) {
        await generateNotes();
      } else if (isTestRequest || lowerInput.includes("genera test") || lowerInput.includes("crea test")) {
        const difficulty = lowerInput.includes("fácil") || lowerInput.includes("facil") ? "easy" : 
                          lowerInput.includes("difícil") || lowerInput.includes("dificil") ? "hard" : "medium";
        
        // Extraer número de preguntas del mensaje
        let numQuestions: number | null = null;
        const numMatch = userMessage.match(/(\d+)\s*(?:preguntas?|pregunta)/i) || userMessage.match(/test\s*(?:de|con)?\s*(\d+)/i);
        if (numMatch) {
          numQuestions = parseInt(numMatch[1], 10);
        }
        
        // Extraer tema/tópico del mensaje (todo después de "test de", "sobre", "de", etc.)
        let topic: string | null = null;
        const topicPatterns = [
          /test\s+(?:de|sobre|acerca de)\s+(.+?)(?:\s+\d+|\s*$)/i,
          /(\d+)\s+preguntas?\s+(?:de|sobre|acerca de)\s+(.+?)$/i,
          /test\s+(?:de|con)\s+(\d+)\s+preguntas?\s+(?:de|sobre|acerca de)?\s*(.+?)$/i,
        ];
        
        for (const pattern of topicPatterns) {
          const match = userMessage.match(pattern);
          if (match && match[match.length - 1]) {
            topic = match[match.length - 1].trim();
            // Limpiar el tema de palabras comunes
            topic = topic.replace(/^(de|sobre|acerca de|del|de la|de los|de las)\s+/i, '').trim();
            if (topic && topic.length > 2) {
              break;
            }
          }
        }
        
        // Si no se encontró con patrones, buscar palabras clave comunes después de "test de"
        if (!topic) {
          const testDeMatch = userMessage.match(/test\s+(?:de|sobre)\s+(.+?)(?:\s+\d+|\s*$)/i);
          if (testDeMatch) {
            topic = testDeMatch[1].trim();
            // Remover número de preguntas si está al final
            topic = topic.replace(/\s+\d+\s*preguntas?.*$/i, '').trim();
          }
        }
        
        // Extraer condiciones/restricciones del mensaje
        let constraints: string | null = null;
        // Buscar patrones como "usando solo", "solo usar", "con solo", "que use", etc.
        const constraintPatterns = [
          /(?:usando|usar|con|que use|que utilice|que incluya|que contenga)\s+(?:solo|únicamente|exclusivamente|solamente)\s+(.+?)(?:\s+para|\s+en|\s*$)/i,
          /(?:usando|usar|con|que use|que utilice|que incluya|que contenga)\s+(.+?)(?:\s+para|\s+en|\s*$)/i,
          /(?:condiciones?|restricciones?|requisitos?|reglas?):\s*(.+?)(?:\s+para|\s+en|\s*$)/i,
        ];
        
        for (const pattern of constraintPatterns) {
          const match = userMessage.match(pattern);
          if (match && match[1]) {
            constraints = match[1].trim();
            // Limpiar el tema del constraint si está incluido
            if (topic && constraints.includes(topic)) {
              constraints = constraints.replace(new RegExp(topic, 'i'), '').trim();
            }
            if (constraints && constraints.length > 3) {
              break;
            }
          }
        }
        
        // Si no se encontró con patrones, buscar frases comunes
        if (!constraints) {
          // Buscar "solo X, Y y Z" o "únicamente X, Y y Z"
          const soloMatch = userMessage.match(/(?:solo|únicamente|exclusivamente|solamente)\s+([^,]+(?:,\s*[^,]+)*\s+(?:y|e)\s+[^,]+)/i);
          if (soloMatch) {
            constraints = soloMatch[1].trim();
          }
        }
        
        setIsGeneratingTest(true);
        await generateTest(difficulty, numQuestions, topic, constraints);
        setIsGeneratingTest(false);
      } else {
        await askQuestion(userMessage);
      }
    } catch (error: any) {
      addMessage({
        role: "assistant",
        content: `Error: ${error.message}`,
        type: "message",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateNotes = async () => {
    if (!apiKeys?.openai) {
      setShowAPIKeyConfig(true);
      return;
    }

    setIsLoading(true);
    setLoadingMessage("Generando apuntes...");
    // No añadir mensaje de texto, solo mostrar la animación de carga

    try {
      // Crear un AbortController para timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutos de timeout
      
      // Llamar a la API con la key del usuario y el modelo seleccionado
      const response = await fetch("/api/study-agents/generate-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKeys.openai,
          uploadedFiles: uploadedFiles,
          model: selectedModel,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.detail || 'Error al generar apuntes');
      }

      if (data.success && data.notes) {
        // Calcular costo estimado
        let costEstimate: CostEstimate | undefined;
        if (data.inputTokens && data.outputTokens) {
          costEstimate = calculateCost(
            data.inputTokens,
            data.outputTokens,
            selectedModel
          );
        } else {
          // Estimar tokens si no vienen del backend
          const estimatedInput = estimateTokens(data.notes);
          const estimatedOutput = estimateTokens(data.notes);
          costEstimate = calculateCost(estimatedInput, estimatedOutput, selectedModel);
        }
        
        addMessage({
          role: "assistant",
          content: data.notes,
          type: "notes",
          costEstimate,
        });
      } else {
        throw new Error(data.error || 'No se pudieron generar los apuntes');
      }
    } catch (error: any) {
      let errorMessage = 'No se pudieron generar los apuntes. Asegúrate de haber subido documentos primero.';
      
      if (error.name === 'AbortError') {
        errorMessage = 'La solicitud tardó demasiado tiempo. Por favor, intenta de nuevo o verifica que el servidor esté funcionando.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      addMessage({
        role: "assistant",
        content: `Error: ${errorMessage}`,
        type: "message",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateTest = async (difficulty: string = "medium", numQuestions?: number | null, topic?: string | null, constraints?: string | null) => {
    if (!apiKeys?.openai) {
      setShowAPIKeyConfig(true);
      return;
    }

    // Usar el número de preguntas proporcionado o generar uno aleatorio entre 5 y 20
    const finalNumQuestions = numQuestions && numQuestions >= 5 && numQuestions <= 20 
      ? numQuestions 
      : Math.floor(Math.random() * 16) + 5; // 5-20 preguntas
    
    const topicText = topic ? ` sobre ${topic}` : "";
    setLoadingMessage(`Generando test de nivel ${difficulty}${topicText}...`);
    setIsGeneratingTest(true);
    // No añadir mensaje de texto, solo mostrar la animación de carga

    try {
      // Llamar a la API con la key del usuario y el modelo seleccionado
      const response = await fetch("/api/study-agents/generate-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKeys.openai,
          difficulty,
          numQuestions: finalNumQuestions,
          topics: topic ? [topic] : null,
          constraints: constraints || null,
          uploadedFiles: uploadedFiles,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (data.success && data.test) {
        setCurrentTest(data.test);
        setTestAnswers({});

        // Calcular costo estimado
        let costEstimate: CostEstimate | undefined;
        if (data.inputTokens && data.outputTokens) {
          costEstimate = calculateCost(
            data.inputTokens,
            data.outputTokens,
            selectedModel
          );
        } else {
          // Estimar tokens si no vienen del backend
          const estimatedInput = estimateTokens(JSON.stringify(data.test));
          const estimatedOutput = estimateTokens(JSON.stringify(data.test));
          costEstimate = calculateCost(estimatedInput, estimatedOutput, selectedModel);
        }

        addMessage({
          role: "assistant",
          content: `Test generado con ${data.test.questions.length} preguntas`,
          type: "test",
          costEstimate,
        });
      } else {
        // Fallback a simulación
        const test: Test = {
          id: `test_${Date.now()}`,
          difficulty,
          questions: [
            {
              id: "q1",
              question: "¿Qué es la inteligencia artificial?",
              type: "multiple_choice",
              options: [
                "A) Tecnología que permite a las máquinas aprender",
                "B) Un tipo de software",
                "C) Una rama de la informática",
                "D) Todas las anteriores"
              ],
              correct_answer: "D"
            },
            {
              id: "q2",
              question: "Machine Learning es un subconjunto de la IA.",
              type: "true_false",
              correct_answer: "True"
            }
          ]
        };

        setCurrentTest(test);
        setTestAnswers({});

        addMessage({
          role: "assistant",
          content: `Test generado con ${test.questions.length} preguntas`,
          type: "test",
        });
      }
    } catch (error: any) {
      addMessage({
        role: "assistant",
        content: `Error: ${error.message}`,
        type: "message",
      });
    } finally {
      setIsGeneratingTest(false);
      setIsLoading(false);
    }
  };

  const askQuestion = async (question: string) => {
    if (!apiKeys?.openai) {
      setShowAPIKeyConfig(true);
      return;
    }

    setLoadingMessage("Pensando y generando respuesta...");

    try {
      // Llamar a la API con la key del usuario y el modelo seleccionado
      const response = await fetch("/api/study-agents/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKeys.openai,
          question,
          uploadedFiles: uploadedFiles,
          model: selectedModel,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Calcular costo estimado
        let costEstimate: CostEstimate | undefined;
        if (data.inputTokens && data.outputTokens) {
          costEstimate = calculateCost(
            data.inputTokens,
            data.outputTokens,
            selectedModel
          );
        } else {
          // Estimar tokens si no vienen del backend
          const estimatedInput = estimateTokens(data.answer);
          const estimatedOutput = estimateTokens(data.answer);
          costEstimate = calculateCost(estimatedInput, estimatedOutput, selectedModel);
        }
        
        // Detectar si la respuesta contiene markdown o esquemas
        const hasMarkdown = data.answer.includes("```") || 
                           data.answer.includes("##") || 
                           data.answer.includes("###") ||
                           data.answer.includes("```diagram-json");
        
        addMessage({
          role: "assistant",
          content: data.answer,
          type: hasMarkdown ? "notes" : "message",
          costEstimate,
        });
      } else {
        // Fallback a simulación
        setTimeout(() => {
          addMessage({
            role: "assistant",
            content: `Esta es una respuesta simulada a tu pregunta: "${question}".\n\nEn la versión completa, aquí obtendría información relevante de los documentos procesados y te daría una respuesta precisa y contextualizada.`,
            type: "message",
          });
        }, 1500);
      }
    } catch (error: any) {
      // Fallback a simulación
      setTimeout(() => {
        addMessage({
          role: "assistant",
          content: `Esta es una respuesta simulada a tu pregunta: "${question}".\n\nEn la versión completa, aquí obtendría información relevante de los documentos procesados.`,
          type: "message",
        });
      }, 1500);
    }
  };

  const handleTestSubmit = async () => {
    if (!currentTest || !apiKeys?.openai) return;

    addMessage({
      role: "user",
      content: `Test completado. Corrige mis respuestas.`,
      type: "message",
    });

    setIsLoading(true);

    try {
      const response = await fetch("/api/study-agents/grade-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: apiKeys.openai,
          testId: currentTest.id,
          answers: testAnswers,
        }),
      });

      const data = await response.json();

      // Calcular estadísticas y conceptos fallados
      const correctCount = Object.entries(testAnswers).filter(
        ([id, answer]) => {
          const question = currentTest.questions.find((q) => q.id === id);
          return question && question.correct_answer.toLowerCase().trim() === answer.toLowerCase().trim();
        }
      ).length;

      const totalQuestions = currentTest.questions.length;
      const score = (correctCount / totalQuestions) * 100;
      
      // Identificar preguntas falladas y extraer conceptos
      const failedQuestions = currentTest.questions.filter((q) => {
        const userAnswer = testAnswers[q.id];
        return userAnswer && q.correct_answer.toLowerCase().trim() !== userAnswer.toLowerCase().trim();
      });

      // Calcular costo estimado
      let costEstimate: CostEstimate | undefined;
      if (data.inputTokens && data.outputTokens) {
        costEstimate = calculateCost(
          data.inputTokens,
          data.outputTokens,
          selectedModel
        );
      } else {
        // Estimar tokens si no vienen del backend
        const estimatedInput = estimateTokens(JSON.stringify(data.feedback || {}));
        const estimatedOutput = estimateTokens(JSON.stringify(data.feedback || {}));
        costEstimate = calculateCost(estimatedInput, estimatedOutput, selectedModel);
      }

      // Crear objeto de feedback mejorado
      const feedbackData = {
        score,
        correctCount,
        totalQuestions,
        failedQuestions: failedQuestions.map(q => ({
          question: q.question,
          explanation: q.explanation || "No hay explicación disponible",
          correctAnswer: q.correct_answer,
          userAnswer: testAnswers[q.id],
        })),
        feedbackItems: data.success && data.feedback?.feedback_items ? data.feedback.feedback_items : [],
        recommendations: data.success && data.feedback?.recommendations ? data.feedback.recommendations : [],
      };

      addMessage({
        role: "assistant",
        content: JSON.stringify(feedbackData),
        type: "feedback",
        costEstimate,
      });
    } catch (error: any) {
      // Fallback con cálculo local
      const correctCount = Object.entries(testAnswers).filter(
        ([id, answer]) => {
          const question = currentTest.questions.find((q) => q.id === id);
          return question && question.correct_answer.toLowerCase().trim() === answer.toLowerCase().trim();
        }
      ).length;

      const totalQuestions = currentTest.questions.length;
      const score = (correctCount / totalQuestions) * 100;
      
      const failedQuestions = currentTest.questions.filter((q) => {
        const userAnswer = testAnswers[q.id];
        return userAnswer && q.correct_answer.toLowerCase().trim() !== userAnswer.toLowerCase().trim();
      });

      const feedbackData = {
        score,
        correctCount,
        totalQuestions,
        failedQuestions: failedQuestions.map(q => ({
          question: q.question,
          explanation: q.explanation || "No hay explicación disponible",
          correctAnswer: q.correct_answer,
          userAnswer: testAnswers[q.id],
        })),
        feedbackItems: [],
        recommendations: [],
      };

      addMessage({
        role: "assistant",
        content: JSON.stringify(feedbackData),
        type: "feedback",
      });
    } finally {
      setCurrentTest(null);
      setTestAnswers({});
      setIsLoading(false);
    }
  };

  const handleKeysConfigured = (keys: { openai: string }) => {
    setApiKeys(keys);
    setShowAPIKeyConfig(false);
    addMessage({
      role: "system",
      content: "API keys configuradas correctamente. Ya puedes usar el sistema.",
      type: "message",
    });
  };

  // Evitar renderizado hasta que esté montado para prevenir errores de hidratación
  if (!isMounted) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 50vh)",
          background: "var(--bg-secondary)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div style={{ 
          padding: "2rem",
          borderRadius: "16px",
          background: "rgba(26, 26, 36, 0.8)",
        }}>
          <div style={{ 
            width: "40px", 
            height: "40px", 
            border: "4px solid rgba(99, 102, 241, 0.2)",
            borderTop: "4px solid #6366f1",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }} />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 50vh)",
        background: colorTheme === "light" ? "#ffffff" : "var(--bg-secondary)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* API Key Configuration Modal */}
      {showAPIKeyConfig && (
        <APIKeyConfig
          onKeysConfigured={handleKeysConfigured}
          onClose={() => {
            if (apiKeys?.openai) {
              setShowAPIKeyConfig(false);
            }
          }}
        />
      )}
      
      {/* Selector de Tema y Modelo Global */}
      <div style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "1rem 1.5rem",
        gap: "0.75rem",
        background: colorTheme === "dark" 
          ? "rgba(26, 26, 36, 0.4)" 
          : "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(10px)",
        borderBottom: `1px solid ${colorTheme === "dark" ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.2)"}`,
        flexWrap: "wrap",
      }}>
        {/* Selector de Modelo */}
        {isMounted && (
          <>
            <span style={{
              fontSize: "0.875rem",
              color: colorTheme === "dark" ? "var(--text-secondary)" : "#4b5563",
              marginRight: "0.5rem",
              fontWeight: 500,
            }}>
              Modelo:
            </span>
            <div style={{ position: "relative", display: "inline-block" }}>
              {/* Texto visible que muestra solo el nombre del modelo */}
              <div
                style={{
                  padding: "0.625rem 1.25rem",
                  paddingRight: "2.5rem",
                  background: colorTheme === "dark"
                    ? "rgba(26, 26, 36, 0.8)"
                    : "rgba(255, 255, 255, 0.9)",
                  border: `2px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.4)" : "rgba(99, 102, 241, 0.3)"}`,
                  borderRadius: "10px",
                  color: colorTheme === "dark" ? "#e2e8f0" : "#1a1a24",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  pointerEvents: "none",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  zIndex: 1,
                }}
              >
                {selectedModel === "gpt-4-turbo" ? "GPT-4 Turbo" :
                 selectedModel === "gpt-4o" ? "GPT-4o" :
                 selectedModel === "gpt-4" ? "GPT-4" :
                 selectedModel === "gpt-3.5-turbo" ? "GPT-3.5 Turbo" :
                 selectedModel}
              </div>
              {/* Select funcional pero con el texto oculto */}
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{
                  padding: "0.625rem 1.25rem",
                  paddingRight: "2.5rem",
                  background: "transparent",
                  border: `2px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.4)" : "rgba(99, 102, 241, 0.3)"}`,
                  borderRadius: "10px",
                  color: "transparent",
                  cursor: "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  transition: "all 0.3s ease",
                  outline: "none",
                  position: "relative",
                  zIndex: 2,
                  appearance: "none",
                  WebkitAppearance: "none",
                  MozAppearance: "none",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#6366f1";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99, 102, 241, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(99, 102, 241, 0.4)" : "rgba(99, 102, 241, 0.3)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {(() => {
                  // Función para obtener el precio por 1000 tokens (entrada + salida)
                  const getPricePer1K = (modelKey: string): string => {
                    const pricing = MODEL_PRICING[modelKey.toLowerCase()] || MODEL_PRICING["gpt-4-turbo"];
                    const totalPer1K = pricing.input + pricing.output;
                    return formatCost(totalPer1K);
                  };
                  
                  return (
                    <>
                      <option value="gpt-4-turbo" style={{ color: colorTheme === "dark" ? "#e2e8f0" : "#1a1a24" }}>
                        GPT-4 Turbo ({getPricePer1K("gpt-4-turbo")}/1K tokens)
                      </option>
                      <option value="gpt-4o" style={{ color: colorTheme === "dark" ? "#e2e8f0" : "#1a1a24" }}>
                        GPT-4o ({getPricePer1K("gpt-4o")}/1K tokens)
                      </option>
                      <option value="gpt-4" style={{ color: colorTheme === "dark" ? "#e2e8f0" : "#1a1a24" }}>
                        GPT-4 ({getPricePer1K("gpt-4")}/1K tokens)
                      </option>
                      <option value="gpt-3.5-turbo" style={{ color: colorTheme === "dark" ? "#e2e8f0" : "#1a1a24" }}>
                        GPT-3.5 Turbo ({getPricePer1K("gpt-3.5-turbo")}/1K tokens)
                      </option>
                    </>
                  );
                })()}
              </select>
              {/* Icono de flecha */}
              <div
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  zIndex: 3,
                  color: colorTheme === "dark" ? "#e2e8f0" : "#1a1a24",
                  fontSize: "0.75rem",
                }}
              >
                ▼
              </div>
            </div>
          </>
        )}
        
        <span style={{
          fontSize: "0.875rem",
          color: colorTheme === "dark" ? "var(--text-secondary)" : "#4b5563",
          marginRight: "0.5rem",
          marginLeft: "1rem",
          fontWeight: 500,
        }}>
          Tema:
        </span>
        <button
          onClick={() => setColorTheme("dark")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1.25rem",
            background: colorTheme === "dark" 
              ? "linear-gradient(135deg, #6366f1, #06b6d4)"
              : "rgba(99, 102, 241, 0.1)",
            border: `2px solid ${colorTheme === "dark" ? "#6366f1" : "rgba(99, 102, 241, 0.2)"}`,
            borderRadius: "10px",
            color: colorTheme === "dark" ? "white" : "#1a1a24",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
            transition: "all 0.3s ease",
            boxShadow: colorTheme === "dark"
              ? "0 4px 12px rgba(99, 102, 241, 0.3)"
              : "none",
          }}
          onMouseEnter={(e) => {
            if (colorTheme !== "dark") {
              e.currentTarget.style.background = "rgba(99, 102, 241, 0.15)";
              e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (colorTheme !== "dark") {
              e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
              e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.2)";
            }
          }}
        >
          <MoonIcon size={18} />
          <span>Oscuro</span>
        </button>
        <button
          onClick={() => setColorTheme("light")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.625rem 1.25rem",
            background: colorTheme === "light"
              ? "linear-gradient(135deg, #6366f1, #06b6d4)"
              : "rgba(99, 102, 241, 0.1)",
            border: `2px solid ${colorTheme === "light" ? "#6366f1" : "rgba(99, 102, 241, 0.2)"}`,
            borderRadius: "10px",
            color: colorTheme === "light" ? "white" : (colorTheme === "dark" ? "white" : "#1a1a24"),
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 600,
            transition: "all 0.3s ease",
            boxShadow: colorTheme === "light"
              ? "0 4px 12px rgba(99, 102, 241, 0.3)"
              : "none",
          }}
          onMouseEnter={(e) => {
            if (colorTheme !== "light") {
              e.currentTarget.style.background = "rgba(99, 102, 241, 0.15)";
              e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.4)";
            }
          }}
          onMouseLeave={(e) => {
            if (colorTheme !== "light") {
              e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
              e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.2)";
            }
          }}
        >
          <SunIcon size={18} />
          <span>Claro</span>
        </button>
      </div>
      {/* Chat Container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          maxWidth: "1200px",
          width: "100%",
          margin: "0 auto",
          padding: "2rem 1rem",
        }}
      >
        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            marginBottom: "1rem",
            padding: "1rem",
          }}
        >
          {messages.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "3rem 1rem",
                color: "var(--text-secondary)",
              }}
            >
              <h3
                className={spaceGrotesk.className}
                style={{
                  fontSize: "1.5rem",
                  marginBottom: "1rem",
                  color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                }}
              >
                ¡Hola! Soy tu asistente de estudio
              </h3>
              <p className={outfit.className} style={{ marginBottom: "2rem" }}>
                Puedes empezar por:
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  gap: "1rem",
                  maxWidth: "800px",
                  margin: "0 auto",
                }}
              >
                <div
                  style={{
                    padding: "1.75rem",
                    background: colorTheme === "dark"
                      ? "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))"
                      : "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.08))",
                    borderRadius: "20px",
                    border: `2px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.4)"}`,
                    boxShadow: colorTheme === "dark"
                      ? "0 8px 24px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                      : "0 8px 24px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px) scale(1.03)";
                    e.currentTarget.style.boxShadow = colorTheme === "dark"
                      ? "0 16px 40px rgba(99, 102, 241, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)"
                      : "0 16px 40px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6)";
                    e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(99, 102, 241, 0.5)" : "rgba(99, 102, 241, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = colorTheme === "dark"
                      ? "0 8px 24px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                      : "0 8px 24px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)";
                    e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.4)";
                  }}
                >
                  <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
                    <div style={{
                      padding: "1rem",
                      background: colorTheme === "dark"
                        ? "linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(139, 92, 246, 0.2))"
                        : "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))",
                      borderRadius: "16px",
                      display: "inline-flex",
                      boxShadow: colorTheme === "dark"
                        ? "0 4px 12px rgba(99, 102, 241, 0.3)"
                        : "0 4px 12px rgba(99, 102, 241, 0.2)",
                    }}>
                      <FileIcon size={32} color="#6366f1" />
                    </div>
                  </div>
                  <strong style={{ 
                    color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                    fontSize: "1.15rem",
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 700,
                  }}>Sube documentos</strong>
                  <p style={{ 
                    fontSize: "0.875rem", 
                    marginTop: "0.5rem", 
                    opacity: 0.85,
                    color: colorTheme === "dark" ? "var(--text-secondary)" : "#4b5563",
                    lineHeight: 1.6,
                  }}>
                    Arrastra PDFs para procesarlos
                  </p>
                </div>
                <div
                  style={{
                    padding: "1.75rem",
                    background: colorTheme === "dark"
                      ? "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))"
                      : "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.08))",
                    borderRadius: "20px",
                    border: `2px solid ${colorTheme === "dark" ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.4)"}`,
                    boxShadow: colorTheme === "dark"
                      ? "0 8px 24px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                      : "0 8px 24px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px) scale(1.03)";
                    e.currentTarget.style.boxShadow = colorTheme === "dark"
                      ? "0 16px 40px rgba(16, 185, 129, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)"
                      : "0 16px 40px rgba(16, 185, 129, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6)";
                    e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(16, 185, 129, 0.5)" : "rgba(16, 185, 129, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = colorTheme === "dark"
                      ? "0 8px 24px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                      : "0 8px 24px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)";
                    e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.4)";
                  }}
                >
                  <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
                    <div style={{
                      padding: "1rem",
                      background: colorTheme === "dark"
                        ? "linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(5, 150, 105, 0.2))"
                        : "linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.15))",
                      borderRadius: "16px",
                      display: "inline-flex",
                      boxShadow: colorTheme === "dark"
                        ? "0 4px 12px rgba(16, 185, 129, 0.3)"
                        : "0 4px 12px rgba(16, 185, 129, 0.2)",
                    }}>
                      <NotesIcon size={32} color="#10b981" />
                    </div>
                  </div>
                  <strong style={{ 
                    color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                    fontSize: "1.15rem",
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 700,
                  }}>Genera apuntes</strong>
                  <p style={{ 
                    fontSize: "0.875rem", 
                    marginTop: "0.5rem", 
                    opacity: 0.85,
                    color: colorTheme === "dark" ? "var(--text-secondary)" : "#4b5563",
                    lineHeight: 1.6,
                  }}>
                    Di "genera apuntes"
                  </p>
                </div>
                <div
                  style={{
                    padding: "1.75rem",
                    background: colorTheme === "dark"
                      ? "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.1))"
                      : "linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.08))",
                    borderRadius: "20px",
                    border: `2px solid ${colorTheme === "dark" ? "rgba(245, 158, 11, 0.3)" : "rgba(245, 158, 11, 0.4)"}`,
                    boxShadow: colorTheme === "dark"
                      ? "0 8px 24px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                      : "0 8px 24px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px) scale(1.03)";
                    e.currentTarget.style.boxShadow = colorTheme === "dark"
                      ? "0 16px 40px rgba(245, 158, 11, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)"
                      : "0 16px 40px rgba(245, 158, 11, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6)";
                    e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(245, 158, 11, 0.5)" : "rgba(245, 158, 11, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = colorTheme === "dark"
                      ? "0 8px 24px rgba(245, 158, 11, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                      : "0 8px 24px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)";
                    e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(245, 158, 11, 0.3)" : "rgba(245, 158, 11, 0.4)";
                  }}
                >
                  <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
                    <div style={{
                      padding: "1rem",
                      background: colorTheme === "dark"
                        ? "linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(217, 119, 6, 0.2))"
                        : "linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.15))",
                      borderRadius: "16px",
                      display: "inline-flex",
                      boxShadow: colorTheme === "dark"
                        ? "0 4px 12px rgba(245, 158, 11, 0.3)"
                        : "0 4px 12px rgba(245, 158, 11, 0.2)",
                    }}>
                      <QuestionIcon size={32} color="#f59e0b" />
                    </div>
                  </div>
                  <strong style={{ 
                    color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                    fontSize: "1.15rem",
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 700,
                  }}>Haz preguntas</strong>
                  <p style={{ 
                    fontSize: "0.875rem", 
                    marginTop: "0.5rem", 
                    opacity: 0.85,
                    color: colorTheme === "dark" ? "var(--text-secondary)" : "#4b5563",
                    lineHeight: 1.6,
                  }}>
                    Pregunta sobre el contenido
                  </p>
                </div>
                <div
                  style={{
                    padding: "1.75rem",
                    background: colorTheme === "dark"
                      ? "linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(219, 39, 119, 0.1))"
                      : "linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(219, 39, 119, 0.08))",
                    borderRadius: "20px",
                    border: `2px solid ${colorTheme === "dark" ? "rgba(236, 72, 153, 0.3)" : "rgba(236, 72, 153, 0.4)"}`,
                    boxShadow: colorTheme === "dark"
                      ? "0 8px 24px rgba(236, 72, 153, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                      : "0 8px 24px rgba(236, 72, 153, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px) scale(1.03)";
                    e.currentTarget.style.boxShadow = colorTheme === "dark"
                      ? "0 16px 40px rgba(236, 72, 153, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.15)"
                      : "0 16px 40px rgba(236, 72, 153, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.6)";
                    e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(236, 72, 153, 0.5)" : "rgba(236, 72, 153, 0.6)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow = colorTheme === "dark"
                      ? "0 8px 24px rgba(236, 72, 153, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                      : "0 8px 24px rgba(236, 72, 153, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.5)";
                    e.currentTarget.style.borderColor = colorTheme === "dark" ? "rgba(236, 72, 153, 0.3)" : "rgba(236, 72, 153, 0.4)";
                  }}
                >
                  <div style={{ marginBottom: "1rem", display: "flex", justifyContent: "center" }}>
                    <div style={{
                      padding: "1rem",
                      background: colorTheme === "dark"
                        ? "linear-gradient(135deg, rgba(236, 72, 153, 0.25), rgba(219, 39, 119, 0.2))"
                        : "linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(219, 39, 119, 0.15))",
                      borderRadius: "16px",
                      display: "inline-flex",
                      boxShadow: colorTheme === "dark"
                        ? "0 4px 12px rgba(236, 72, 153, 0.3)"
                        : "0 4px 12px rgba(236, 72, 153, 0.2)",
                    }}>
                      <TestIcon size={32} color="#ec4899" />
                    </div>
                  </div>
                  <strong style={{ 
                    color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                    fontSize: "1.15rem",
                    display: "block",
                    marginBottom: "0.5rem",
                    fontWeight: 700,
                  }}>Genera tests</strong>
                  <p style={{ 
                    fontSize: "0.875rem", 
                    marginTop: "0.5rem", 
                    opacity: 0.85,
                    color: colorTheme === "dark" ? "var(--text-secondary)" : "#4b5563",
                    lineHeight: 1.6,
                  }}>
                    Di &quot;genera test&quot;
                  </p>
                </div>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                display: "flex",
                justifyContent: message.role === "user" ? "flex-end" : "flex-start",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  maxWidth: "85%",
                  padding: "1.5rem 2rem",
                  borderRadius: "20px",
                  background:
                    message.role === "user"
                      ? "linear-gradient(135deg, rgba(99, 102, 241, 0.95), rgba(139, 92, 246, 0.95))"
                      : colorTheme === "dark"
                      ? "linear-gradient(135deg, rgba(26, 26, 36, 0.95), rgba(30, 30, 45, 0.95))"
                      : "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98))",
                  border:
                    message.role === "assistant"
                      ? `2px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.4)" : "rgba(99, 102, 241, 0.5)"}`
                      : "none",
                  boxShadow: message.role === "user"
                    ? "0 8px 32px rgba(99, 102, 241, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)"
                    : colorTheme === "dark"
                    ? "0 8px 32px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                    : "0 8px 32px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
                  color: message.role === "user" ? "white" : (colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24"),
                }}
              >
                {message.type === "notes" ? (
                  <>
                    <NotesViewer 
                      content={message.content} 
                      colorTheme={colorTheme}
                    />
                    {message.costEstimate && (
                      <div style={{
                        marginTop: "1.5rem",
                        padding: "0.75rem 1rem",
                        background: colorTheme === "dark" 
                          ? "rgba(99, 102, 241, 0.1)" 
                          : "rgba(99, 102, 241, 0.08)",
                        border: `1px solid ${colorTheme === "dark" 
                          ? "rgba(99, 102, 241, 0.3)" 
                          : "rgba(99, 102, 241, 0.4)"}`,
                        borderRadius: "8px",
                        fontSize: "0.875rem",
                        color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}>
                        <ZapIcon size={16} color="#6366f1" />
                        <span>
                          <strong>Costo estimado:</strong> {formatCost(message.costEstimate.totalCost)} 
                          {" "}({message.costEstimate.inputTokens.toLocaleString()} tokens entrada, {message.costEstimate.outputTokens.toLocaleString()} tokens salida)
                        </span>
                      </div>
                    )}
                  </>
                ) : message.type === "test" && currentTest ? (
                  <>
                    <TestComponent
                      test={currentTest}
                      answers={testAnswers}
                      onAnswerChange={(id, answer) => {
                        setTestAnswers((prev) => ({ ...prev, [id]: answer }));
                      }}
                      onSubmit={handleTestSubmit}
                      colorTheme={colorTheme}
                    />
                    {message.costEstimate && (
                      <div style={{
                        marginTop: "1.5rem",
                        padding: "0.75rem 1rem",
                        background: colorTheme === "dark" 
                          ? "rgba(99, 102, 241, 0.1)" 
                          : "rgba(99, 102, 241, 0.08)",
                        border: `1px solid ${colorTheme === "dark" 
                          ? "rgba(99, 102, 241, 0.3)" 
                          : "rgba(99, 102, 241, 0.4)"}`,
                        borderRadius: "8px",
                        fontSize: "0.875rem",
                        color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}>
                        <ZapIcon size={16} color="#6366f1" />
                        <span>
                          <strong>Costo estimado:</strong> {formatCost(message.costEstimate.totalCost)} 
                          {" "}({message.costEstimate.inputTokens.toLocaleString()} tokens entrada, {message.costEstimate.outputTokens.toLocaleString()} tokens salida)
                        </span>
                      </div>
                    )}
                  </>
                ) : message.type === "feedback" ? (
                  <>
                    <FeedbackComponent 
                      feedbackData={message.content}
                      colorTheme={colorTheme}
                    />
                    {message.costEstimate && (
                      <div style={{
                        marginTop: "1.5rem",
                        padding: "0.75rem 1rem",
                        background: colorTheme === "dark" 
                          ? "rgba(99, 102, 241, 0.1)" 
                          : "rgba(99, 102, 241, 0.08)",
                        border: `1px solid ${colorTheme === "dark" 
                          ? "rgba(99, 102, 241, 0.3)" 
                          : "rgba(99, 102, 241, 0.4)"}`,
                        borderRadius: "8px",
                        fontSize: "0.875rem",
                        color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}>
                        <ZapIcon size={16} color="#6366f1" />
                        <span>
                          <strong>Costo estimado:</strong> {formatCost(message.costEstimate.totalCost)} 
                          {" "}({message.costEstimate.inputTokens.toLocaleString()} tokens entrada, {message.costEstimate.outputTokens.toLocaleString()} tokens salida)
                        </span>
                      </div>
                    )}
                  </>
                ) : message.type === "success" ? (
                  <SuccessMessage 
                    data={message.content}
                    colorTheme={colorTheme}
                  />
                ) : (
                  <>
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.6,
                      }}
                    >
                      {message.content}
                    </div>
                    {message.costEstimate && (
                      <div style={{
                        marginTop: "1rem",
                        padding: "0.75rem 1rem",
                        background: colorTheme === "dark" 
                          ? "rgba(99, 102, 241, 0.1)" 
                          : "rgba(99, 102, 241, 0.08)",
                        border: `1px solid ${colorTheme === "dark" 
                          ? "rgba(99, 102, 241, 0.3)" 
                          : "rgba(99, 102, 241, 0.4)"}`,
                        borderRadius: "8px",
                        fontSize: "0.875rem",
                        color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}>
                        <ZapIcon size={16} color="#6366f1" />
                        <span>
                          <strong>Costo estimado:</strong> {formatCost(message.costEstimate.totalCost)} 
                          {" "}({message.costEstimate.inputTokens.toLocaleString()} tokens entrada, {message.costEstimate.outputTokens.toLocaleString()} tokens salida)
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div
              style={{
                display: "flex",
                justifyContent: "flex-start",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  padding: "1.5rem 2rem",
                  borderRadius: "20px",
                  background: colorTheme === "dark" 
                    ? "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1))"
                    : "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.08))",
                  border: `2px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.4)"}`,
                  boxShadow: colorTheme === "dark"
                    ? "0 8px 24px rgba(99, 102, 241, 0.2)"
                    : "0 8px 24px rgba(99, 102, 241, 0.15)",
                  display: "flex",
                  alignItems: "center",
                  gap: "1rem",
                }}
              >
                <div style={{ position: "relative", width: "40px", height: "40px" }}>
                  <div
                    style={{
                      position: "absolute",
                      width: "40px",
                      height: "40px",
                      border: `4px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.3)"}`,
                      borderTop: "4px solid #6366f1",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      width: "28px",
                      height: "28px",
                      top: "6px",
                      left: "6px",
                      border: `3px solid ${colorTheme === "dark" ? "rgba(6, 182, 212, 0.2)" : "rgba(6, 182, 212, 0.3)"}`,
                      borderTop: "3px solid #06b6d4",
                      borderRadius: "50%",
                      animation: "spin 1.2s linear infinite reverse",
                    }}
                  />
                </div>
                <div>
                  <div style={{ 
                    fontSize: "1rem", 
                    fontWeight: 600,
                    color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                    marginBottom: "0.25rem",
                  }}>
                    {isGeneratingTest ? "Generando test..." : (loadingMessage || "Procesando...")}
                  </div>
                  <div style={{ 
                    fontSize: "0.875rem", 
                    color: colorTheme === "dark" ? "var(--text-secondary)" : "#4b5563",
                    opacity: 0.8,
                  }}>
                    Esto puede tardar unos segundos
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            padding: "1rem",
            background: colorTheme === "light" ? "#ffffff" : "rgba(26, 26, 36, 0.6)",
            borderRadius: "16px",
            border: colorTheme === "light" 
              ? "1px solid rgba(148, 163, 184, 0.2)" 
              : "1px solid rgba(148, 163, 184, 0.1)",
            boxShadow: colorTheme === "light"
              ? "0 4px 20px rgba(0, 0, 0, 0.08)"
              : "none",
          }}
        >
          {/* File Upload and Settings */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleFileUpload(e.target.files)}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.375rem 0.875rem",
                background: colorTheme === "dark" ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.08)",
                border: `1px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.4)"}`,
                borderRadius: "10px",
                color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                cursor: isLoading ? "not-allowed" : "pointer",
                fontSize: "0.8125rem",
                fontWeight: 600,
                opacity: isLoading ? 0.5 : 1,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = "translateX(4px)";
                  e.currentTarget.style.background = colorTheme === "dark" ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.12)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.transform = "translateX(0)";
                  e.currentTarget.style.background = colorTheme === "dark" ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.08)";
                }
              }}
            >
              <div style={{
                width: "22px",
                height: "22px",
                borderRadius: "6px",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <UploadIcon size={13} color="white" />
              </div>
              <span>Subir PDF</span>
            </button>
            <button
              onClick={() => setShowAPIKeyConfig(true)}
              title="Configurar API Keys"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.375rem 0.875rem",
                background: apiKeys?.openai
                  ? (colorTheme === "dark" ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.08)")
                  : (colorTheme === "dark" ? "rgba(245, 158, 11, 0.1)" : "rgba(245, 158, 11, 0.08)"),
                border: apiKeys?.openai
                  ? `1px solid ${colorTheme === "dark" ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.4)"}`
                  : `1px solid ${colorTheme === "dark" ? "rgba(245, 158, 11, 0.3)" : "rgba(245, 158, 11, 0.4)"}`,
                borderRadius: "10px",
                color: apiKeys?.openai ? "#10b981" : "#f59e0b",
                cursor: "pointer",
                fontSize: "0.8125rem",
                fontWeight: 600,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateX(4px)";
                if (apiKeys?.openai) {
                  e.currentTarget.style.background = colorTheme === "dark" ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.12)";
                } else {
                  e.currentTarget.style.background = colorTheme === "dark" ? "rgba(245, 158, 11, 0.15)" : "rgba(245, 158, 11, 0.12)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateX(0)";
                if (apiKeys?.openai) {
                  e.currentTarget.style.background = colorTheme === "dark" ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.08)";
                } else {
                  e.currentTarget.style.background = colorTheme === "dark" ? "rgba(245, 158, 11, 0.1)" : "rgba(245, 158, 11, 0.08)";
                }
              }}
            >
              <div style={{
                width: "22px",
                height: "22px",
                borderRadius: "6px",
                background: apiKeys?.openai 
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "linear-gradient(135deg, #f59e0b, #d97706)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <KeyIcon size={13} color="white" />
              </div>
              <span>{apiKeys?.openai ? "API Configurada" : "Configurar API"}</span>
            </button>
            {uploadedFiles.length > 0 && (
              <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                {uploadedFiles.length} archivo(s) subido(s)
              </div>
            )}
          </div>

          {/* Text Input */}
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-end" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Escribe tu mensaje..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: "1.25rem 1.5rem",
                background: colorTheme === "dark" 
                  ? "linear-gradient(135deg, rgba(26, 26, 36, 0.95), rgba(30, 30, 45, 0.95))" 
                  : "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98))",
                border: `2px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.4)" : "rgba(99, 102, 241, 0.5)"}`,
                borderRadius: "20px",
                color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                fontSize: "1rem",
                resize: "none",
                minHeight: "70px",
                maxHeight: "150px",
                fontFamily: "inherit",
                boxShadow: colorTheme === "dark"
                  ? "0 8px 32px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                  : "0 8px 32px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: "120px" }}>
              {/* Botones de acción rápida */}
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => {
                    setInput("");
                    generateNotes();
                  }}
                  disabled={isLoading || isGeneratingTest}
                  title="Generar apuntes del contenido"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.375rem 0.875rem",
                    background: (isLoading || isGeneratingTest)
                      ? (colorTheme === "dark" ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.12)")
                      : (colorTheme === "dark" ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.08)"),
                    border: `1px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.4)"}`,
                    borderRadius: "10px",
                    color: (isLoading || isGeneratingTest) ? "rgba(99, 102, 241, 0.5)" : (colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24"),
                    cursor: (isLoading || isGeneratingTest) ? "not-allowed" : "pointer",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                    whiteSpace: "nowrap",
                    flex: 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && !isGeneratingTest) {
                      e.currentTarget.style.transform = "translateX(4px)";
                      e.currentTarget.style.background = colorTheme === "dark" ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.12)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading && !isGeneratingTest) {
                      e.currentTarget.style.transform = "translateX(0)";
                      e.currentTarget.style.background = colorTheme === "dark" ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.08)";
                    }
                  }}
                >
                  <div style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "6px",
                    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    opacity: (isLoading || isGeneratingTest) ? 0.5 : 1,
                  }}>
                    <NotesIcon size={13} color="white" />
                  </div>
                  <span>Apuntes</span>
                </button>
                <button
                  onClick={() => {
                    setInput("");
                    generateTest("medium", null, null);
                  }}
                  disabled={isLoading || isGeneratingTest}
                  title="Generar test de evaluación"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0.375rem 0.875rem",
                    background: (isLoading || isGeneratingTest)
                      ? (colorTheme === "dark" ? "rgba(236, 72, 153, 0.15)" : "rgba(236, 72, 153, 0.12)")
                      : (colorTheme === "dark" ? "rgba(236, 72, 153, 0.1)" : "rgba(236, 72, 153, 0.08)"),
                    border: `1px solid ${colorTheme === "dark" ? "rgba(236, 72, 153, 0.3)" : "rgba(236, 72, 153, 0.4)"}`,
                    borderRadius: "10px",
                    color: (isLoading || isGeneratingTest) ? "rgba(236, 72, 153, 0.5)" : (colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24"),
                    cursor: (isLoading || isGeneratingTest) ? "not-allowed" : "pointer",
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    transition: "all 0.3s ease",
                    whiteSpace: "nowrap",
                    flex: 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && !isGeneratingTest) {
                      e.currentTarget.style.transform = "translateX(4px)";
                      e.currentTarget.style.background = colorTheme === "dark" ? "rgba(236, 72, 153, 0.15)" : "rgba(236, 72, 153, 0.12)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading && !isGeneratingTest) {
                      e.currentTarget.style.transform = "translateX(0)";
                      e.currentTarget.style.background = colorTheme === "dark" ? "rgba(236, 72, 153, 0.1)" : "rgba(236, 72, 153, 0.08)";
                    }
                  }}
                >
                  <div style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "6px",
                    background: "linear-gradient(135deg, #ec4899, #db2777)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    opacity: (isLoading || isGeneratingTest) ? 0.5 : 1,
                  }}>
                    <TestIcon size={13} color="white" />
                  </div>
                  <span>{isGeneratingTest ? "Generando test..." : "Test"}</span>
                </button>
              </div>
              {/* Botón Enviar */}
              <button
                onClick={handleSend}
                disabled={isLoading || isGeneratingTest || !input.trim()}
                title="Enviar mensaje"
                style={{
                  padding: "0.875rem 1.25rem",
                  background:
                    (isLoading || isGeneratingTest || !input.trim())
                      ? "rgba(99, 102, 241, 0.2)"
                      : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  border: "none",
                  borderRadius: "10px",
                  color: "white",
                  cursor: (isLoading || isGeneratingTest || !input.trim()) ? "not-allowed" : "pointer",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  opacity: (isLoading || isGeneratingTest || !input.trim()) ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isLoading && !isGeneratingTest && input.trim()) {
                    e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(99, 102, 241, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0) scale(1)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                  <SendIcon size={18} color="white" />
                  <span>Enviar</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Estadísticas Totales de Tokens y Costos - Debajo de la caja de input */}
        {(totalStats.totalInputTokens > 0 || totalStats.totalOutputTokens > 0) && (
          <div
            style={{
              padding: "1rem 1.5rem",
              marginTop: "1rem",
              background: colorTheme === "light"
                ? "rgba(248, 250, 252, 0.8)"
                : "rgba(26, 26, 36, 0.6)",
              borderTop: `2px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.4)"}`,
              borderRadius: "16px 16px 0 0",
            }}
          >
          <div
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
            }}
          >
            <h3
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
                color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              <ZapIcon size={16} color={colorTheme === "dark" ? "#6366f1" : "#6366f1"} />
              Estadísticas Totales
            </h3>
            
            {/* Totales Generales */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "0.75rem",
                marginBottom: Object.keys(totalStats.byModel).length > 0 ? "1rem" : "0",
              }}
            >
              <div
                style={{
                  padding: "0.75rem",
                  background: colorTheme === "light" ? "#ffffff" : "rgba(15, 23, 42, 0.4)",
                  borderRadius: "10px",
                  border: `1px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.3)"}`,
                }}
              >
                <div
                  style={{
                    fontSize: "0.6875rem",
                    color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                    marginBottom: "0.25rem",
                  }}
                >
                  Tokens Entrada
                </div>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: colorTheme === "dark" ? "#6366f1" : "#6366f1",
                  }}
                >
                  {totalStats.totalInputTokens.toLocaleString()}
                </div>
              </div>
              
              <div
                style={{
                  padding: "0.75rem",
                  background: colorTheme === "light" ? "#ffffff" : "rgba(15, 23, 42, 0.4)",
                  borderRadius: "10px",
                  border: `1px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.3)"}`,
                }}
              >
                <div
                  style={{
                    fontSize: "0.6875rem",
                    color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                    marginBottom: "0.25rem",
                  }}
                >
                  Tokens Salida
                </div>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: colorTheme === "dark" ? "#8b5cf6" : "#8b5cf6",
                  }}
                >
                  {totalStats.totalOutputTokens.toLocaleString()}
                </div>
              </div>
              
              <div
                style={{
                  padding: "0.75rem",
                  background: colorTheme === "light" ? "#ffffff" : "rgba(15, 23, 42, 0.4)",
                  borderRadius: "10px",
                  border: `1px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.3)"}`,
                }}
              >
                <div
                  style={{
                    fontSize: "0.6875rem",
                    color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                    marginBottom: "0.25rem",
                  }}
                >
                  Total Tokens
                </div>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: colorTheme === "dark" ? "#10b981" : "#10b981",
                  }}
                >
                  {(totalStats.totalInputTokens + totalStats.totalOutputTokens).toLocaleString()}
                </div>
              </div>
              
              <div
                style={{
                  padding: "0.75rem",
                  background: colorTheme === "light" ? "#ffffff" : "rgba(15, 23, 42, 0.4)",
                  borderRadius: "10px",
                  border: `1px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.2)" : "rgba(99, 102, 241, 0.3)"}`,
                }}
              >
                <div
                  style={{
                    fontSize: "0.6875rem",
                    color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                    marginBottom: "0.25rem",
                  }}
                >
                  Costo Total
                </div>
                <div
                  style={{
                    fontSize: "1rem",
                    fontWeight: 700,
                    color: colorTheme === "dark" ? "#f59e0b" : "#f59e0b",
                  }}
                >
                  {formatCost(totalStats.totalCost)}
                </div>
              </div>
            </div>
            
            {/* Desglose por Modelo */}
            {Object.keys(totalStats.byModel).length > 0 && (
              <div>
                <h4
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    marginBottom: "0.5rem",
                    color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                  }}
                >
                  Por Modelo
                </h4>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  {Object.entries(totalStats.byModel).map(([model, stats]) => (
                    <div
                      key={model}
                      style={{
                        padding: "0.625rem 0.875rem",
                        background: colorTheme === "light" ? "#ffffff" : "rgba(15, 23, 42, 0.3)",
                        borderRadius: "8px",
                        border: `1px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.2)"}`,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
                        }}
                      >
                        {model}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.75rem",
                          fontSize: "0.6875rem",
                          color: colorTheme === "dark" ? "var(--text-secondary)" : "#64748b",
                        }}
                      >
                        <span>
                          E: {stats.inputTokens.toLocaleString()}
                        </span>
                        <span>
                          S: {stats.outputTokens.toLocaleString()}
                        </span>
                        <span
                          style={{
                            fontWeight: 600,
                            color: colorTheme === "dark" ? "#f59e0b" : "#f59e0b",
                          }}
                        >
                          {formatCost(stats.cost)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes slideDown {
          from {
            max-height: 0;
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            max-height: 500px;
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

// Función eliminada: cleanMermaidCode - ya no se usa Mermaid

// Componente mejorado para renderizar apuntes con markdown completo - ULTRA VISUAL
function NotesViewer({ 
  content, 
  colorTheme
}: { 
  content: string;
  colorTheme: "dark" | "light";
}) {
  const notesContainerRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  
  // ELIMINADO: Todo el código de Mermaid - ahora usamos DiagramRenderer con JSON
  // Ya no se necesita useEffect para Mermaid porque usamos diagramas JSON
  
  const handleDownloadPDF = async () => {
    if (!notesContainerRef.current) return;
    
    setIsGeneratingPDF(true);
    
    try {
      // Esperar un momento para que los diagramas se rendericen
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Ajustar el ancho del contenedor para el PDF
      const originalWidth = notesContainerRef.current.style.width;
      const originalMaxWidth = notesContainerRef.current.style.maxWidth;
      const originalBackground = notesContainerRef.current.style.background;
      notesContainerRef.current.style.width = "800px";
      notesContainerRef.current.style.maxWidth = "800px";
      // Asegurar que el fondo sea el correcto para el PDF
      notesContainerRef.current.style.background = colorTheme === "dark" 
        ? "#0a0a0f" 
        : "#f8fafc";
      
      // Crear PDF con fondo según el tema
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      
      // Establecer color de fondo de la página según el tema
      const bgColor = colorTheme === "dark" ? [10, 10, 15] : [248, 250, 252];
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Extraer título de los apuntes del contenido
      let notesTitle = "Apuntes de Estudio";
      if (notesContainerRef.current) {
        const h1Element = notesContainerRef.current.querySelector('h1');
        const h2Element = notesContainerRef.current.querySelector('h2');
        if (h1Element) {
          notesTitle = h1Element.textContent?.trim() || notesTitle;
        } else if (h2Element) {
          notesTitle = h2Element.textContent?.trim() || notesTitle;
        }
      }
      
      // ========== PORTADA ==========
      pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      
      // Logo de Study Agents
      try {
        const logoImg = new Image();
        logoImg.crossOrigin = 'anonymous';
        logoImg.src = '/StudyAgentsLogo.png';
        
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve;
          logoImg.onerror = reject;
          setTimeout(reject, 3000); // Timeout de 3 segundos
        });
        
        // Si está en modo claro, convertir el logo a negro
        let processedLogo = logoImg;
        if (colorTheme === "light") {
          const canvas = document.createElement('canvas');
          canvas.width = logoImg.width;
          canvas.height = logoImg.height;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Dibujar la imagen original
            ctx.drawImage(logoImg, 0, 0);
            
            // Obtener los datos de la imagen
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            // Convertir a escala de grises y luego a negro
            for (let i = 0; i < data.length; i += 4) {
              // Calcular el brillo (luminosidad)
              const brightness = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
              
              // Si el pixel no es completamente transparente, convertirlo a negro
              if (data[i + 3] > 0) {
                // Usar el brillo como opacidad para mantener detalles
                const opacity = brightness / 255;
                data[i] = 0;     // R
                data[i + 1] = 0; // G
                data[i + 2] = 0; // B
                data[i + 3] = Math.min(255, opacity * 255); // A (mantener transparencia relativa)
              }
            }
            
            // Aplicar los cambios
            ctx.putImageData(imageData, 0, 0);
            
            // Convertir canvas a imagen
            processedLogo = new Image();
            processedLogo.src = canvas.toDataURL('image/png');
            
            // Esperar a que se cargue la imagen procesada
            await new Promise((resolve, reject) => {
              processedLogo.onload = resolve;
              processedLogo.onerror = reject;
              setTimeout(reject, 2000);
            });
          }
        }
        
        const logoWidth = 60;
        const logoHeight = (processedLogo.height / processedLogo.width) * logoWidth;
        const logoX = (pdfWidth - logoWidth) / 2;
        const logoY = 50;
        
        pdf.addImage(processedLogo, 'PNG', logoX, logoY, logoWidth, logoHeight);
      } catch (error) {
        console.error("No se pudo cargar el logo, continuando sin él", error);
      }
      
      // Título principal (título de los apuntes)
      pdf.setTextColor(colorTheme === "dark" ? 226 : 26, colorTheme === "dark" ? 232 : 26, colorTheme === "dark" ? 240 : 36);
      pdf.setFontSize(32);
      pdf.setFont("helvetica", "bold");
      
      // Dividir el título si es muy largo
      const maxTitleWidth = pdfWidth - 40;
      const titleLines = pdf.splitTextToSize(notesTitle, maxTitleWidth);
      const titleStartY = 130;
      const lineHeight = 12;
      
      titleLines.forEach((line: string, index: number) => {
        const lineWidth = pdf.getTextWidth(line);
        pdf.text(line, (pdfWidth - lineWidth) / 2, titleStartY + (index * lineHeight));
      });
      
      // Subtítulo decorativo
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(colorTheme === "dark" ? 148 : 75, colorTheme === "dark" ? 163 : 85, colorTheme === "dark" ? 184 : 101);
      const subtitleText = "Material de Estudio Generado";
      const subtitleWidth = pdf.getTextWidth(subtitleText);
      pdf.text(subtitleText, (pdfWidth - subtitleWidth) / 2, titleStartY + (titleLines.length * lineHeight) + 15);
      
      // Línea decorativa
      const lineY = titleStartY + (titleLines.length * lineHeight) + 30;
      pdf.setDrawColor(colorTheme === "dark" ? 99 : 99, colorTheme === "dark" ? 102 : 102, colorTheme === "dark" ? 241 : 241);
      pdf.setLineWidth(0.5);
      pdf.line(40, lineY, pdfWidth - 40, lineY);
      
      // Información adicional
      pdf.setFontSize(12);
      pdf.setTextColor(colorTheme === "dark" ? 148 : 75, colorTheme === "dark" ? 163 : 85, colorTheme === "dark" ? 184 : 101);
      pdf.setFont("helvetica", "italic");
      const dateText = new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      const dateWidth = pdf.getTextWidth(dateText);
      pdf.text(dateText, (pdfWidth - dateWidth) / 2, 220);
      
      // Pie de página en la portada
      pdf.setFontSize(10);
      pdf.setTextColor(colorTheme === "dark" ? 100 : 100, colorTheme === "dark" ? 100 : 100, colorTheme === "dark" ? 100 : 100);
      pdf.setFont("helvetica", "normal");
      pdf.text("Generado con Study Agents", pdfWidth / 2, pdfHeight - 20, { align: 'center' });
      
      // Agregar nueva página para el contenido
      pdf.addPage();
      pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
      pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
      
      const margin = 15; // Aumentar margen para mejor presentación
      const availableWidth = pdfWidth - (margin * 2);
      const availableHeight = pdfHeight - (margin * 2);
      
      const container = notesContainerRef.current;
      
      // Dividir contenido en secciones basadas en h2 (apartados principales)
      const h2Elements = container.querySelectorAll('h2');
      
      // Mantener un contador de posición Y actual
      let currentY = margin;
      
      if (h2Elements.length > 0) {
        // Procesar cada sección (h2 y su contenido hasta el siguiente h2)
        for (let i = 0; i < h2Elements.length; i++) {
          const h2 = h2Elements[i] as HTMLElement;
          const nextH2 = h2Elements[i + 1] as HTMLElement;
          
          // Crear contenedor temporal para esta sección
          const sectionContainer = document.createElement('div');
          sectionContainer.style.width = '800px';
          sectionContainer.style.position = 'absolute';
          sectionContainer.style.left = '-9999px';
          sectionContainer.style.top = '0';
          sectionContainer.style.backgroundColor = colorTheme === "dark" ? "#0a0a0f" : "#f8fafc";
          sectionContainer.style.padding = '30px';
          sectionContainer.style.fontFamily = 'inherit';
          sectionContainer.style.color = colorTheme === "dark" ? "#e2e8f0" : "#1a1a24";
          // Copiar estilos del contenedor original para mantener consistencia
          const computedStyle = window.getComputedStyle(notesContainerRef.current);
          sectionContainer.style.fontSize = computedStyle.fontSize;
          sectionContainer.style.lineHeight = computedStyle.lineHeight;
          
          // Clonar el h2 y todo su contenido hasta el siguiente h2
          let currentElement: Node | null = h2;
          while (currentElement && currentElement !== nextH2) {
            const clone = currentElement.cloneNode(true) as HTMLElement;
            sectionContainer.appendChild(clone);
            currentElement = currentElement.nextSibling;
          }
          
          document.body.appendChild(sectionContainer);
          
          try {
            // Capturar la sección con mejor calidad
            const canvas = await html2canvas(sectionContainer, {
              backgroundColor: colorTheme === "dark" ? "#0a0a0f" : "#f8fafc",
              scale: 2.5, // Aumentar escala para mejor calidad
              useCORS: true,
              logging: false,
              width: 800,
              onclone: (clonedDoc) => {
                // Asegurar que los estilos se apliquen correctamente en el clon
                const clonedContainer = clonedDoc.body.querySelector('div');
                if (clonedContainer) {
                  (clonedContainer as HTMLElement).style.background = colorTheme === "dark" ? "#0a0a0f" : "#f8fafc";
                }
              },
            });
            
            const imgData = canvas.toDataURL("image/png");
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = availableWidth / imgWidth;
            const imgScaledWidth = imgWidth * ratio;
            const imgScaledHeight = imgHeight * ratio;
            
            // Verificar si la sección cabe en la página actual
            if (currentY + imgScaledHeight > pdfHeight - margin && i > 0) {
              // No cabe, añadir nueva página con fondo
              pdf.addPage();
              pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
              pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
              currentY = margin;
            }
            
            // Si la sección es muy alta, dividirla en múltiples páginas
            if (imgScaledHeight > availableHeight) {
              const totalPages = Math.ceil(imgScaledHeight / availableHeight);
              
              for (let p = 0; p < totalPages; p++) {
                if (p > 0) {
                  pdf.addPage();
                  pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
                  pdf.rect(0, 0, pdfWidth, pdfHeight, 'F');
                  currentY = margin;
                }
                
                const pageHeight = Math.min(availableHeight, imgScaledHeight - (p * availableHeight));
                
                // Usar la imagen completa pero posicionarla correctamente
                pdf.addImage(
                  imgData,
                  "PNG",
                  margin,
                  currentY - (p * availableHeight),
                  imgScaledWidth,
                  imgScaledHeight
                );
                
                if (p < totalPages - 1) {
                  currentY = margin + pageHeight;
                } else {
                  currentY = margin + (imgScaledHeight % availableHeight);
                }
              }
            } else {
              // La sección cabe en una página
              pdf.addImage(
                imgData,
                "PNG",
                margin,
                currentY,
                imgScaledWidth,
                imgScaledHeight
              );
              currentY += imgScaledHeight + 15; // 15mm de espacio entre secciones para mejor separación
            }
          } finally {
            document.body.removeChild(sectionContainer);
          }
        }
      } else {
        // Si no hay h2, capturar todo el contenido de una vez (método original mejorado)
        const canvas = await html2canvas(container, {
          backgroundColor: colorTheme === "dark" ? "#0a0a0f" : "#f8fafc",
          scale: 2.5, // Aumentar escala para mejor calidad
          useCORS: true,
          logging: false,
          width: 800,
          onclone: (clonedDoc) => {
            // Asegurar que los estilos se apliquen correctamente en el clon
            const clonedContainer = clonedDoc.querySelector('.notes-viewer');
            if (clonedContainer) {
              (clonedContainer as HTMLElement).style.background = colorTheme === "dark" ? "#0a0a0f" : "#f8fafc";
            }
          },
        });
        
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = availableWidth / imgWidth;
        const imgScaledWidth = imgWidth * ratio;
        const imgScaledHeight = imgHeight * ratio;
        
        const totalPages = Math.ceil(imgScaledHeight / availableHeight);
        
        for (let i = 0; i < totalPages; i++) {
          if (i > 0) {
            pdf.addPage();
          }
          
          pdf.addImage(
            imgData,
            "PNG",
            margin,
            margin - (i * availableHeight),
            imgScaledWidth,
            imgScaledHeight
          );
        }
      }
      
      // Restaurar el ancho original y fondo
      notesContainerRef.current.style.width = originalWidth;
      notesContainerRef.current.style.maxWidth = originalMaxWidth;
      notesContainerRef.current.style.background = originalBackground;
      
      // Descargar PDF
      pdf.save(`apuntes-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Error al generar el PDF. Por favor, intenta de nuevo.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  
  const themeColors = colorTheme === "dark" ? {
    bg: "linear-gradient(135deg, rgba(10, 10, 15, 0.95), rgba(18, 18, 26, 0.95))",
    text: "#f8fafc",
    accent: "#6366f1",
    accentLight: "#06b6d4",
    cardBg: "rgba(26, 26, 36, 0.6)",
    border: "rgba(99, 102, 241, 0.2)",
  } : {
    bg: "linear-gradient(135deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.98))",
    text: "#1a1a24",
    accent: "#6366f1",
    accentLight: "#06b6d4",
    cardBg: "rgba(255, 255, 255, 0.9)",
    border: "rgba(99, 102, 241, 0.3)",
  };
  
  return (
    <>
      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .notes-viewer :global(h1) {
          font-size: 2.5rem;
          font-weight: 800;
          margin: 2.5rem 0 1.5rem;
          color: ${colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24"};
          background: linear-gradient(135deg, #6366f1, #06b6d4, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          border-bottom: 3px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.5)"};
          padding-bottom: 1rem;
          letter-spacing: -0.02em;
        }
        .notes-viewer :global(h2) {
          font-size: 1.75rem;
          font-weight: 700;
          margin: 2.5rem 0 1.25rem;
          color: ${colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24"};
          background: ${colorTheme === "dark" 
            ? "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.15))"
            : "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(6, 182, 212, 0.1))"};
          padding: 1rem 1.5rem;
          border-radius: 12px;
          border-left: 5px solid #6366f1;
          box-shadow: ${colorTheme === "dark" 
            ? "0 4px 12px rgba(99, 102, 241, 0.1)"
            : "0 4px 12px rgba(99, 102, 241, 0.2)"};
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .notes-viewer :global(h2::before) {
          content: "";
          font-size: 1.5rem;
        }
        .notes-viewer :global(h3) {
          font-size: 1.4rem;
          font-weight: 700;
          margin: 2rem 0 1rem;
          color: ${colorTheme === "dark" ? "#6366f1" : "#4f46e5"};
          padding-left: 0.5rem;
          border-left: 4px solid #6366f1;
        }
        .notes-viewer :global(h4) {
          font-size: 1.2rem;
          font-weight: 600;
          margin: 1.5rem 0 0.75rem;
          color: ${colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24"};
        }
        .notes-viewer :global(p) {
          margin: 1.25rem 0;
          line-height: 2;
          font-size: 1.05rem;
          color: ${colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24"};
        }
        .notes-viewer :global(ul), .notes-viewer :global(ol) {
          margin: 1.5rem 0;
          padding-left: 2.5rem;
        }
        .notes-viewer :global(li) {
          margin: 0.75rem 0;
          line-height: 2;
          font-size: 1.05rem;
          position: relative;
        }
        .notes-viewer :global(ul li::marker) {
          color: #6366f1;
          font-weight: 700;
        }
        .notes-viewer :global(ol li::marker) {
          color: #6366f1;
          font-weight: 700;
        }
        .notes-viewer :global(strong) {
          color: ${colorTheme === "dark" ? "#6366f1" : "#4f46e5"};
          font-weight: 700;
          background: ${colorTheme === "dark" 
            ? "rgba(99, 102, 241, 0.1)"
            : "rgba(99, 102, 241, 0.15)"};
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
        }
        .notes-viewer :global(em) {
          color: #06b6d4;
          font-style: italic;
        }
        .notes-viewer :global(code) {
          background: ${colorTheme === "dark" 
            ? "rgba(99, 102, 241, 0.15)"
            : "rgba(99, 102, 241, 0.2)"};
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          font-family: ${jetbrainsMono.style.fontFamily};
          font-size: 0.95em;
          color: ${colorTheme === "dark" ? "#22d3ee" : "#0891b2"};
          border: 1px solid ${colorTheme === "dark" 
            ? "rgba(99, 102, 241, 0.2)"
            : "rgba(99, 102, 241, 0.3)"};
        }
        .notes-viewer :global(pre) {
          background: ${colorTheme === "dark"
            ? "linear-gradient(135deg, rgba(26, 26, 36, 0.95), rgba(30, 30, 45, 0.95))"
            : "linear-gradient(135deg, rgba(241, 245, 249, 0.95), rgba(226, 232, 240, 0.95))"};
          padding: 1.5rem;
          border-radius: 12px;
          overflow-x: auto;
          border: 1px solid ${colorTheme === "dark" 
            ? "rgba(99, 102, 241, 0.3)"
            : "rgba(99, 102, 241, 0.4)"};
          margin: 1.5rem 0;
          box-shadow: ${colorTheme === "dark"
            ? "0 4px 16px rgba(0, 0, 0, 0.3)"
            : "0 4px 16px rgba(0, 0, 0, 0.1)"};
        }
        .notes-viewer :global(pre code) {
          background: transparent;
          padding: 0;
          border: none;
          color: ${colorTheme === "dark" ? "#e2e8f0" : "#1a1a24"};
        }
        .notes-viewer :global(pre code.language-diagram-json) {
          display: none;
        }
        .notes-viewer :global(blockquote) {
          border-left: 5px solid #6366f1;
          padding: 1.25rem 1.5rem;
          margin: 1.5rem 0;
          background: ${colorTheme === "dark"
            ? "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(6, 182, 212, 0.05))"
            : "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(6, 182, 212, 0.05))"};
          border-radius: 0 12px 12px 0;
          color: ${colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24"};
          font-style: italic;
          box-shadow: ${colorTheme === "dark"
            ? "0 4px 12px rgba(99, 102, 241, 0.1)"
            : "0 4px 12px rgba(99, 102, 241, 0.15)"};
          position: relative;
        }
        .notes-viewer :global(blockquote::before) {
          content: "";
          position: absolute;
          left: -2.5rem;
          top: 1rem;
          width: 24px;
          height: 24px;
        }
        .notes-viewer :global(table) {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0;
          margin: 2rem 0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: ${colorTheme === "dark"
            ? "0 4px 16px rgba(0, 0, 0, 0.2)"
            : "0 4px 16px rgba(0, 0, 0, 0.1)"};
          border: 1px solid ${colorTheme === "dark"
            ? "rgba(99, 102, 241, 0.2)"
            : "rgba(99, 102, 241, 0.3)"};
        }
        .notes-viewer :global(th), .notes-viewer :global(td) {
          border: 1px solid ${colorTheme === "dark"
            ? "rgba(148, 163, 184, 0.15)"
            : "rgba(148, 163, 184, 0.3)"};
          padding: 1rem 1.25rem;
          text-align: left;
        }
        .notes-viewer :global(th) {
          background: ${colorTheme === "dark"
            ? "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.15))"
            : "linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.1))"};
          font-weight: 700;
          color: ${colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24"};
          font-size: 1.05rem;
        }
        .notes-viewer :global(td) {
          background: ${colorTheme === "dark"
            ? "rgba(26, 26, 36, 0.6)"
            : "rgba(255, 255, 255, 0.7)"};
        }
        .notes-viewer :global(tr:hover td) {
          background: ${colorTheme === "dark"
            ? "rgba(99, 102, 241, 0.1)"
            : "rgba(99, 102, 241, 0.15)"};
        }
        .notes-viewer :global(hr) {
          border: none;
          border-top: 3px solid rgba(99, 102, 241, 0.3);
          margin: 3rem 0;
          border-radius: 2px;
        }
        .notes-viewer :global(a) {
          color: #6366f1;
          text-decoration: underline;
          text-decoration-color: rgba(99, 102, 241, 0.4);
          transition: all 0.2s ease;
        }
        .notes-viewer :global(a:hover) {
          color: #06b6d4;
          text-decoration-color: #06b6d4;
        }
        /* Tarjetas especiales para conceptos clave */
        .notes-viewer :global(.concept-card) {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.1));
          border: 2px solid rgba(99, 102, 241, 0.3);
          border-radius: 16px;
          padding: 1.5rem;
          margin: 1.5rem 0;
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.15);
        }
        .notes-viewer :global(.definition-box) {
          background: ${colorTheme === "dark"
            ? "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))"
            : "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.08))"};
          border-left: 5px solid #10b981;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          margin: 1.5rem 0;
          box-shadow: ${colorTheme === "dark"
            ? "0 4px 16px rgba(16, 185, 129, 0.1)"
            : "0 4px 16px rgba(16, 185, 129, 0.15)"};
        }
        .notes-viewer :global(.example-box) {
          background: ${colorTheme === "dark"
            ? "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(217, 119, 6, 0.1))"
            : "linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.08))"};
          border-left: 5px solid #f59e0b;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          margin: 1.5rem 0;
          box-shadow: ${colorTheme === "dark"
            ? "0 4px 16px rgba(245, 158, 11, 0.1)"
            : "0 4px 16px rgba(245, 158, 11, 0.15)"};
        }
        .notes-viewer :global(.important-box) {
          background: ${colorTheme === "dark"
            ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))"
            : "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.08))"};
          border-left: 5px solid #ef4444;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          margin: 1.5rem 0;
          box-shadow: ${colorTheme === "dark"
            ? "0 4px 16px rgba(239, 68, 68, 0.1)"
            : "0 4px 16px rgba(239, 68, 68, 0.15)"};
        }
        /* Estilo eliminado: .mermaid-diagram-container - ya no se usa Mermaid */
      `}</style>
      <div style={{ position: "relative", width: "100%" }}>
        <div
          ref={notesContainerRef}
          style={{
            background: themeColors.bg,
            padding: "2.5rem",
            position: 'relative',
            borderRadius: "20px",
            border: `1px solid ${themeColors.border}`,
            boxShadow: colorTheme === "dark" 
              ? "0 20px 60px rgba(0, 0, 0, 0.4)"
              : "0 20px 60px rgba(0, 0, 0, 0.1)",
            maxWidth: "100%",
            width: "100%",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              maxWidth: "100%",
              lineHeight: 2,
              color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
              fontSize: "1.05rem",
            }}
            className="notes-viewer"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
          h2: ({ ...props }) => (
            <h2 {...props} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }} />
          ),
        h3: ({ ...props }) => {
            // Usar un índice determinístico basado en el contenido para evitar problemas de hidratación
            const icons = [
              <SparkleIcon key="sparkle" size={18} color="#6366f1" />,
              <StarIcon key="star" size={18} color="#6366f1" />,
              <TargetIcon key="target" size={18} color="#6366f1" />,
              <ZapIcon key="zap" size={18} color="#6366f1" />,
            ];
            // Usar el hash del contenido del texto para seleccionar un icono de forma determinística
            const textContent = typeof props.children === 'string' ? props.children : 
                               Array.isArray(props.children) ? props.children.join('') : '';
            const iconIndex = textContent.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % icons.length;
            const selectedIcon = icons[iconIndex];
            return (
              <h3 {...props} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                {selectedIcon}
                {props.children}
              </h3>
            );
          },
        p: ({ ...props }) => {
            const text = String(props.children || "");
            // Detectar patrones especiales para crear tarjetas visuales
            if (text.startsWith("**Definición:**") || text.startsWith("**DEFINICIÓN:**")) {
              return (
                <div className="definition-box">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <BookIcon size={20} color="#10b981" />
                    <strong style={{ fontSize: "1.1rem", color: "#10b981" }}>Definición</strong>
                  </div>
                  <p style={{ margin: 0, lineHeight: 1.8 }}>{text.replace(/^\*\*Definición:\*\*|\*\*DEFINICIÓN:\*\*/i, "").trim()}</p>
                </div>
              );
            }
            if (text.startsWith("**Ejemplo:**") || text.startsWith("**EJEMPLO:**")) {
              return (
                <div className="example-box">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <LightbulbIcon size={20} color="#f59e0b" />
                    <strong style={{ fontSize: "1.1rem", color: "#f59e0b" }}>Ejemplo</strong>
                  </div>
                  <p style={{ margin: 0, lineHeight: 1.8 }}>{text.replace(/^\*\*Ejemplo:\*\*|\*\*EJEMPLO:\*\*/i, "").trim()}</p>
                </div>
              );
            }
            if (text.startsWith("**Importante:**") || text.startsWith("**IMPORTANTE:**")) {
              return (
                <div className="important-box">
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <AlertIcon size={20} color="#ef4444" />
                    <strong style={{ fontSize: "1.1rem", color: "#ef4444" }}>Importante</strong>
                  </div>
                  <p style={{ margin: 0, lineHeight: 1.8 }}>{text.replace(/^\*\*Importante:\*\*|\*\*IMPORTANTE:\*\*/i, "").trim()}</p>
                </div>
              );
            }
            return <p {...props} />;
          },
        code: ({ className, children, ...props }: { className?: string; children?: React.ReactNode }) => {
            const match = /language-(\w+)/.exec(className || '');
            const language = match ? match[1] : '';
            const codeString = String(children).replace(/\n$/, '');
            
            // Detectar y ocultar bloques Mermaid (no soportados)
            if (language === 'mermaid' || language === 'flowchart' || language === 'graph' || 
                language === 'gantt' || language === 'sequenceDiagram' || 
                language === 'classDiagram' || language === 'mindmap' ||
                (className && (className.includes('mermaid') || className.includes('flowchart') || 
                 className.includes('gantt') || className.includes('graph')))) {
              // Ocultar completamente los bloques Mermaid
              return null;
            }
            
            // Detectar bloques diagram-json
            if (language === 'diagram-json' || (className && className.includes('diagram-json'))) {
              try {
                // Limpiar el string antes de parsear (eliminar espacios extra, saltos de línea problemáticos)
                let cleanedCode = codeString.trim();
                
                // Si el JSON está en una sola línea con espacios o tiene texto alrededor, extraer solo el JSON
                if (cleanedCode.includes('{') && cleanedCode.includes('}')) {
                  // Buscar el JSON válido dentro del string
                  const jsonStart = cleanedCode.indexOf('{');
                  const jsonEnd = cleanedCode.lastIndexOf('}') + 1;
                  if (jsonStart >= 0 && jsonEnd > jsonStart) {
                    cleanedCode = cleanedCode.substring(jsonStart, jsonEnd);
                  }
                }
                
                // Intentar parsear el JSON
                let diagramData;
                try {
                  diagramData = JSON.parse(cleanedCode);
                } catch (parseError) {
                  // Si falla, intentar reparar JSON incompleto
                  console.warn('First parse attempt failed, trying to repair JSON:', parseError);
                  
                  // Intentar reparar JSON incompleto
                  let repairedCode = cleanedCode;
                  
                  // Si el JSON está incompleto (falta cerrar algo), intentar completarlo
                  const openBraces = (repairedCode.match(/\{/g) || []).length;
                  const closeBraces = (repairedCode.match(/\}/g) || []).length;
                  const openBrackets = (repairedCode.match(/\[/g) || []).length;
                  const closeBrackets = (repairedCode.match(/\]/g) || []).length;
                  
                  // Cerrar corchetes faltantes
                  if (openBrackets > closeBrackets) {
                    repairedCode += ']'.repeat(openBrackets - closeBrackets);
                  }
                  
                  // Cerrar llaves faltantes
                  if (openBraces > closeBraces) {
                    repairedCode += '}'.repeat(openBraces - closeBraces);
                  }
                  
                  // Si hay un campo incompleto (termina con "label": sin valor), intentar cerrarlo
                  if (repairedCode.match(/"label":\s*$/)) {
                    repairedCode = repairedCode.replace(/"label":\s*$/, '"label": "Incompleto"');
                  }
                  
                  // Intentar parsear de nuevo
                  try {
                    diagramData = JSON.parse(repairedCode);
                    console.log('JSON repaired successfully');
                  } catch (repairError) {
                    console.error('Could not repair JSON:', repairError);
                    throw parseError; // Lanzar el error original
                  }
                }
                console.log('Diagram JSON parsed:', diagramData);
                
                // Validar estructura
                if (!diagramData.nodes || !Array.isArray(diagramData.nodes) || diagramData.nodes.length === 0) {
                  console.error('Diagram JSON invalid: missing or empty nodes array', diagramData);
                  return (
                    <div style={{
                      padding: "1.5rem",
                      background: colorTheme === "dark" ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
                      borderRadius: "12px",
                      border: `2px solid ${colorTheme === "dark" ? "rgba(239, 68, 68, 0.4)" : "rgba(239, 68, 68, 0.5)"}`,
                      color: colorTheme === "dark" ? "#ef4444" : "#dc2626",
                    }}>
                      <strong>Error en el diagrama:</strong> El JSON no contiene nodos válidos.
                      <details style={{ marginTop: "0.5rem" }}>
                        <summary style={{ cursor: "pointer", fontSize: "0.875rem" }}>Ver JSON recibido</summary>
                        <pre style={{ marginTop: "0.5rem", fontSize: "0.75rem", overflow: "auto" }}>
                          {codeString}
                        </pre>
                      </details>
                    </div>
                  );
                }
                
                if (!diagramData.edges || !Array.isArray(diagramData.edges)) {
                  console.warn('Diagram JSON missing edges array, using empty array');
                  diagramData.edges = [];
                }
                
                return <DiagramRenderer data={diagramData} colorTheme={colorTheme} />;
              } catch (e) {
                console.error('Error parsing diagram JSON:', e, 'Code string:', codeString.substring(0, 200));
                return (
                  <div style={{
                    padding: "1.5rem",
                    background: colorTheme === "dark" ? "rgba(239, 68, 68, 0.1)" : "rgba(239, 68, 68, 0.05)",
                    borderRadius: "12px",
                    border: `2px solid ${colorTheme === "dark" ? "rgba(239, 68, 68, 0.4)" : "rgba(239, 68, 68, 0.5)"}`,
                    color: colorTheme === "dark" ? "#ef4444" : "#dc2626",
                  }}>
                    <strong>Error al parsear el diagrama JSON:</strong> {String(e)}
                    <details style={{ marginTop: "0.5rem" }}>
                      <summary style={{ cursor: "pointer", fontSize: "0.875rem" }}>Ver código recibido</summary>
                      <pre style={{ marginTop: "0.5rem", fontSize: "0.75rem", overflow: "auto" }}>
                        {codeString.substring(0, 500)}
                      </pre>
                    </details>
                  </div>
                );
              }
            }
            
            // Para otros bloques de código, renderizar normalmente
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
              >
                {content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      
      {/* Botón de descarga PDF */}
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        marginTop: "2.5rem",
        paddingTop: "2rem",
        borderTop: "2px solid rgba(99, 102, 241, 0.2)",
      }}>
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "1rem 2rem",
            background: isGeneratingPDF
              ? "rgba(99, 102, 241, 0.5)"
              : "linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899)",
            border: "none",
            borderRadius: "12px",
            color: "white",
            fontSize: "1.1rem",
            fontWeight: 700,
            cursor: isGeneratingPDF ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            boxShadow: isGeneratingPDF
              ? "none"
              : "0 8px 24px rgba(99, 102, 241, 0.4)",
            transform: isGeneratingPDF ? "scale(0.98)" : "scale(1)",
          }}
          onMouseEnter={(e) => {
            if (!isGeneratingPDF) {
              e.currentTarget.style.transform = "translateY(-2px) scale(1.02)";
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(99, 102, 241, 0.5)";
            }
          }}
          onMouseLeave={(e) => {
            if (!isGeneratingPDF) {
              e.currentTarget.style.transform = "translateY(0) scale(1)";
              e.currentTarget.style.boxShadow = "0 8px 24px rgba(99, 102, 241, 0.4)";
            }
          }}
        >
          {isGeneratingPDF ? (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ animation: "spin 1s linear infinite" }}
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.3" />
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Generando PDF...
            </>
          ) : (
            <>
              <DownloadIcon size={20} />
              Descargar Apuntes en PDF
            </>
          )}
        </button>
      </div>
    </>
  );
}

function TestComponent({
  test,
  answers,
  onAnswerChange,
  onSubmit,
  colorTheme = "dark",
}: {
  test: Test;
  answers: Record<string, string>;
  onAnswerChange: (id: string, answer: string) => void;
  onSubmit: () => void;
  colorTheme?: "dark" | "light";
}) {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [questionResults, setQuestionResults] = useState<Record<string, { isCorrect: boolean; showFeedback: boolean }>>({});
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = test.questions.length;
  const progress = (answeredCount / totalQuestions) * 100;
  
  // Calcular estadísticas en tiempo real
  const correctCount = Object.entries(questionResults).filter(([, result]) => result.isCorrect).length;
  const currentScore = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
  
  // Manejar cambio de respuesta con corrección inmediata
  const handleAnswerChange = (questionId: string, answer: string) => {
    onAnswerChange(questionId, answer);
    
    // Encontrar la pregunta
    const question = test.questions.find(q => q.id === questionId);
    if (!question) return;
    
    // Verificar si es correcta
    const isCorrect = question.correct_answer.toLowerCase().trim() === answer.toLowerCase().trim();
    
    // Actualizar resultados y mostrar feedback inmediatamente
    setQuestionResults(prev => ({
      ...prev,
      [questionId]: {
        isCorrect,
        showFeedback: true,
      }
    }));
  };
  
  const bgColor = colorTheme === "dark" 
    ? "linear-gradient(135deg, rgba(26, 26, 36, 0.95), rgba(30, 30, 45, 0.95))"
    : "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98))";
  const textColor = colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24";
  const secondaryTextColor = colorTheme === "dark" ? "var(--text-secondary)" : "#4b5563";
  
  return (
    <div
      style={{
        background: bgColor,
        borderRadius: "20px",
        padding: "2rem",
        border: `2px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.4)" : "rgba(99, 102, 241, 0.5)"}`,
        boxShadow: colorTheme === "dark"
          ? "0 8px 32px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
          : "0 8px 32px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
      }}
    >
      {/* Header del Test con Estadísticas en Tiempo Real */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{
              padding: "0.75rem",
              background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.15))",
              borderRadius: "12px",
              border: "2px solid rgba(99, 102, 241, 0.3)",
            }}>
              <TestIcon size={24} color="#6366f1" />
            </div>
            <div>
              <h3
                className={spaceGrotesk.className}
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  margin: 0,
                }}
              >
                Test de Evaluación
              </h3>
              <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.875rem", color: secondaryTextColor }}>
                Nivel: <strong style={{ color: "#6366f1" }}>{test.difficulty}</strong>
              </p>
            </div>
          </div>
          
          {/* Puntuación en tiempo real */}
          {answeredCount > 0 && (
            <div style={{
              padding: "1rem 1.5rem",
              background: colorTheme === "dark"
                ? "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))"
                : "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.08))",
              borderRadius: "12px",
              border: `2px solid ${colorTheme === "dark" ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.4)"}`,
              textAlign: "center",
            }}>
              <div style={{ fontSize: "0.75rem", color: secondaryTextColor, marginBottom: "0.25rem" }}>
                Puntuación Actual
              </div>
              <div style={{
                fontSize: "1.75rem",
                fontWeight: 700,
                background: "linear-gradient(135deg, #10b981, #059669)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                {currentScore.toFixed(0)}%
              </div>
              <div style={{ fontSize: "0.75rem", color: secondaryTextColor, marginTop: "0.25rem" }}>
                {correctCount}/{answeredCount} correctas
              </div>
            </div>
          )}
        </div>
        
        {/* Barra de progreso mejorada */}
        <div style={{ marginBottom: "1rem" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
              fontSize: "0.875rem",
              color: secondaryTextColor,
              fontWeight: 500,
            }}
          >
            <span>Progreso: {answeredCount}/{totalQuestions} preguntas</span>
            <span style={{ fontWeight: 700, color: "#6366f1" }}>{Math.round(progress)}%</span>
          </div>
          <div
            style={{
              width: "100%",
              height: "12px",
              background: colorTheme === "dark" ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.2)",
              borderRadius: "8px",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)",
                borderRadius: "8px",
                transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Preguntas */}
      <div style={{ marginBottom: "2rem" }}>
        {test.questions.map((q, index) => {
          const isSelected = selectedQuestion === q.id;
          const isAnswered = answers[q.id] !== undefined;
          const result = questionResults[q.id];
          const isCorrect = result?.isCorrect ?? false;
          const showFeedback = result?.showFeedback ?? false;
          const correctAnswer = q.correct_answer;
          
          // Determinar colores según el resultado
          let questionBg = colorTheme === "dark" ? "rgba(26, 26, 36, 0.8)" : "rgba(255, 255, 255, 0.8)";
          let questionBorder = colorTheme === "dark" ? "rgba(148, 163, 184, 0.1)" : "rgba(148, 163, 184, 0.2)";
          
          if (showFeedback) {
            if (isCorrect) {
              questionBg = colorTheme === "dark" 
                ? "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.1))"
                : "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.08))";
              questionBorder = colorTheme === "dark" ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.5)";
            } else {
              questionBg = colorTheme === "dark"
                ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15), rgba(220, 38, 38, 0.1))"
                : "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.08))";
              questionBorder = colorTheme === "dark" ? "rgba(239, 68, 68, 0.4)" : "rgba(239, 68, 68, 0.5)";
            }
          } else if (isSelected) {
            questionBg = colorTheme === "dark" ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.1)";
            questionBorder = "#6366f1";
          }
          
          return (
            <div
              key={q.id}
              style={{
                marginBottom: "1.5rem",
                padding: "1.5rem",
                background: questionBg,
                borderRadius: "16px",
                border: `2px solid ${questionBorder}`,
                transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                cursor: "pointer",
                position: "relative",
                overflow: "hidden",
              }}
              onClick={() => setSelectedQuestion(q.id === selectedQuestion ? null : q.id)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = colorTheme === "dark"
                    ? "0 12px 32px rgba(99, 102, 241, 0.2)"
                    : "0 12px 32px rgba(99, 102, 241, 0.15)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            >
              {/* Indicador de resultado animado */}
              {showFeedback && (
                <div style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: isCorrect
                    ? "linear-gradient(135deg, #10b981, #059669)"
                    : "linear-gradient(135deg, #ef4444, #dc2626)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isCorrect
                    ? "0 4px 16px rgba(16, 185, 129, 0.4)"
                    : "0 4px 16px rgba(239, 68, 68, 0.4)",
                  animation: "scaleIn 0.3s ease-out",
                }}>
                  {isCorrect ? (
                    <CheckIcon size={24} color="white" />
                  ) : (
                    <XIcon size={24} color="white" />
                  )}
                </div>
              )}
              
              {/* Número de pregunta y estado */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  marginBottom: "1rem",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: showFeedback
                      ? (isCorrect
                          ? "linear-gradient(135deg, #10b981, #059669)"
                          : "linear-gradient(135deg, #ef4444, #dc2626)")
                      : isAnswered
                      ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                      : colorTheme === "dark"
                      ? "rgba(99, 102, 241, 0.2)"
                      : "rgba(99, 102, 241, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    color: (showFeedback || isAnswered) ? "white" : "#6366f1",
                    border: (showFeedback || isAnswered) ? "none" : `2px solid #6366f1`,
                    fontSize: showFeedback ? "0" : "1rem",
                    transition: "all 0.3s ease",
                  }}
                >
                  {showFeedback ? (
                    isCorrect ? <CheckIcon size={20} color="white" /> : <XIcon size={20} color="white" />
                  ) : isAnswered ? (
                    <span style={{ fontSize: "1.25rem" }}>✓</span>
                  ) : (
                    index + 1
                  )}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: "1.1rem",
                    flex: 1,
                    color: textColor,
                  }}
                >
                  {q.question}
                </p>
              </div>

              {/* Opciones */}
              {q.type === "multiple_choice" && q.options && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                    gap: "0.75rem",
                    marginTop: "1rem",
                  }}
                >
                  {q.options.map((opt, optIndex) => {
                    const optionLetter = String.fromCharCode(65 + optIndex);
                    const isSelectedOption = answers[q.id] === optionLetter;
                    
                    return (
                      <label
                        key={optIndex}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                          padding: "1rem",
                          background: isSelectedOption
                            ? "rgba(99, 102, 241, 0.2)"
                            : "rgba(148, 163, 184, 0.05)",
                          borderRadius: "8px",
                          border: isSelectedOption
                            ? "2px solid #6366f1"
                            : "1px solid rgba(148, 163, 184, 0.2)",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelectedOption) {
                            e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                            e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.5)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelectedOption) {
                            e.currentTarget.style.background = "rgba(148, 163, 184, 0.05)";
                            e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
                          }
                        }}
                      >
                        <div
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            border: "2px solid",
                            borderColor: isSelectedOption ? "#6366f1" : "rgba(148, 163, 184, 0.5)",
                            background: isSelectedOption
                              ? "#6366f1"
                              : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          {isSelectedOption ? "✓" : optionLetter}
                        </div>
                        <input
                          type="radio"
                          name={q.id}
                          value={optionLetter}
                          checked={isSelectedOption}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          style={{ display: "none" }}
                        />
                        <span style={{ flex: 1, color: textColor }}>{opt}</span>
                        {/* Indicador de respuesta correcta/incorrecta */}
                        {showFeedback && isSelectedOption && (
                          <div style={{
                            marginLeft: "0.5rem",
                            display: "flex",
                            alignItems: "center",
                          }}>
                            {isCorrect ? (
                              <CheckIcon size={20} color="#10b981" />
                            ) : (
                              <XIcon size={20} color="#ef4444" />
                            )}
                          </div>
                        )}
                        {/* Mostrar si esta es la respuesta correcta (si el usuario se equivocó) */}
                        {showFeedback && !isCorrect && optionLetter === correctAnswer && (
                          <div style={{
                            marginLeft: "0.5rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            padding: "0.25rem 0.5rem",
                            background: "rgba(16, 185, 129, 0.2)",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#10b981",
                          }}>
                            <CheckIcon size={14} color="#10b981" />
                            Correcta
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
              
              {/* Feedback con explicación */}
              {showFeedback && (
                <div style={{
                  marginTop: "1.5rem",
                  padding: "1.25rem",
                  background: isCorrect
                    ? (colorTheme === "dark"
                        ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))"
                        : "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.05))")
                    : (colorTheme === "dark"
                        ? "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))"
                        : "linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(220, 38, 38, 0.05))"),
                  borderRadius: "12px",
                  border: `1px solid ${isCorrect 
                    ? (colorTheme === "dark" ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.4)")
                    : (colorTheme === "dark" ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.4)")}`,
                  animation: "slideDown 0.3s ease-out",
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "0.75rem",
                  }}>
                    {isCorrect ? (
                      <>
                        <CheckIcon size={20} color="#10b981" />
                        <strong style={{ color: "#10b981", fontSize: "1rem" }}>
                          ¡Correcto!
                        </strong>
                      </>
                    ) : (
                      <>
                        <XIcon size={20} color="#ef4444" />
                        <strong style={{ color: "#ef4444", fontSize: "1rem" }}>
                          Incorrecto
                        </strong>
                      </>
                    )}
                  </div>
                  {!isCorrect && (
                    <div style={{
                      marginBottom: "0.75rem",
                      padding: "0.75rem",
                      background: colorTheme === "dark" ? "rgba(26, 26, 36, 0.5)" : "rgba(255, 255, 255, 0.5)",
                      borderRadius: "8px",
                      border: `1px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.4)"}`,
                    }}>
                      <div style={{ fontSize: "0.875rem", color: secondaryTextColor, marginBottom: "0.25rem" }}>
                        Respuesta correcta:
                      </div>
                      <div style={{ fontWeight: 600, color: "#10b981", fontSize: "1rem" }}>
                        {correctAnswer}
                      </div>
                    </div>
                  )}
                  {q.explanation && (
                    <div style={{
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "flex-start",
                    }}>
                      <LightbulbIcon size={18} color={isCorrect ? "#10b981" : "#f59e0b"} style={{ marginTop: "0.125rem", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: "0.875rem", color: secondaryTextColor, marginBottom: "0.25rem", fontWeight: 600 }}>
                          Explicación:
                        </div>
                        <div style={{ color: textColor, lineHeight: 1.6, fontSize: "0.95rem" }}>
                          {q.explanation}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {q.type === "true_false" && (
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    marginTop: "1rem",
                  }}
                >
                  {["True", "False"].map((tf) => {
                    const isSelectedOption = answers[q.id] === tf;
                    return (
                      <label
                        key={tf}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          padding: "1rem",
                          background: isSelectedOption
                            ? tf === "True"
                              ? "rgba(16, 185, 129, 0.2)"
                              : "rgba(239, 68, 68, 0.2)"
                            : "rgba(148, 163, 184, 0.05)",
                          borderRadius: "8px",
                          border: isSelectedOption
                            ? `2px solid ${tf === "True" ? "#10b981" : "#ef4444"}`
                            : "1px solid rgba(148, 163, 184, 0.2)",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          fontWeight: 600,
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelectedOption) {
                            e.currentTarget.style.background = "rgba(99, 102, 241, 0.1)";
                            e.currentTarget.style.borderColor = "rgba(99, 102, 241, 0.5)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelectedOption) {
                            e.currentTarget.style.background = "rgba(148, 163, 184, 0.05)";
                            e.currentTarget.style.borderColor = "rgba(148, 163, 184, 0.2)";
                          }
                        }}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={tf}
                          checked={isSelectedOption}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          style={{ display: "none" }}
                        />
                        <span style={{ color: textColor }}>{tf === "True" ? "✓ Verdadero" : "✗ Falso"}</span>
                        {/* Indicador de respuesta correcta/incorrecta */}
                        {showFeedback && isSelectedOption && (
                          <div style={{
                            marginLeft: "0.5rem",
                            display: "flex",
                            alignItems: "center",
                          }}>
                            {isCorrect ? (
                              <CheckIcon size={20} color="#10b981" />
                            ) : (
                              <XIcon size={20} color="#ef4444" />
                            )}
                          </div>
                        )}
                        {/* Mostrar si esta es la respuesta correcta (si el usuario se equivocó) */}
                        {showFeedback && !isCorrect && tf === correctAnswer && (
                          <div style={{
                            marginLeft: "0.5rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            padding: "0.25rem 0.5rem",
                            background: "rgba(16, 185, 129, 0.2)",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            color: "#10b981",
                          }}>
                            <CheckIcon size={14} color="#10b981" />
                            Correcta
                          </div>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
              
              {/* Feedback con explicación para true/false */}
              {showFeedback && (
                <div style={{
                  marginTop: "1.5rem",
                  padding: "1.25rem",
                  background: isCorrect
                    ? (colorTheme === "dark"
                        ? "linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05))"
                        : "linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(5, 150, 105, 0.05))")
                    : (colorTheme === "dark"
                        ? "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))"
                        : "linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(220, 38, 38, 0.05))"),
                  borderRadius: "12px",
                  border: `1px solid ${isCorrect 
                    ? (colorTheme === "dark" ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.4)")
                    : (colorTheme === "dark" ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.4)")}`,
                  animation: "slideDown 0.3s ease-out",
                }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "0.75rem",
                  }}>
                    {isCorrect ? (
                      <>
                        <CheckIcon size={20} color="#10b981" />
                        <strong style={{ color: "#10b981", fontSize: "1rem" }}>
                          ¡Correcto!
                        </strong>
                      </>
                    ) : (
                      <>
                        <XIcon size={20} color="#ef4444" />
                        <strong style={{ color: "#ef4444", fontSize: "1rem" }}>
                          Incorrecto
                        </strong>
                      </>
                    )}
                  </div>
                  {!isCorrect && (
                    <div style={{
                      marginBottom: "0.75rem",
                      padding: "0.75rem",
                      background: colorTheme === "dark" ? "rgba(26, 26, 36, 0.5)" : "rgba(255, 255, 255, 0.5)",
                      borderRadius: "8px",
                      border: `1px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.4)"}`,
                    }}>
                      <div style={{ fontSize: "0.875rem", color: secondaryTextColor, marginBottom: "0.25rem" }}>
                        Respuesta correcta:
                      </div>
                      <div style={{ fontWeight: 600, color: "#10b981", fontSize: "1rem" }}>
                        {correctAnswer === "True" ? "Verdadero" : "Falso"}
                      </div>
                    </div>
                  )}
                  {q.explanation && (
                    <div style={{
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "flex-start",
                    }}>
                      <LightbulbIcon size={18} color={isCorrect ? "#10b981" : "#f59e0b"} style={{ marginTop: "0.125rem", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: "0.875rem", color: secondaryTextColor, marginBottom: "0.25rem", fontWeight: 600 }}>
                          Explicación:
                        </div>
                        <div style={{ color: textColor, lineHeight: 1.6, fontSize: "0.95rem" }}>
                          {q.explanation}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Botón de envío */}
      <button
        onClick={onSubmit}
        disabled={answeredCount !== totalQuestions}
        style={{
          width: "100%",
          padding: "1rem 2rem",
          background:
            answeredCount === totalQuestions
              ? "linear-gradient(135deg, #10b981, #059669)"
              : "rgba(99, 102, 241, 0.3)",
          border: "none",
          borderRadius: "12px",
          color: "white",
          fontSize: "1.1rem",
          fontWeight: 700,
          cursor: answeredCount === totalQuestions ? "pointer" : "not-allowed",
          transition: "all 0.3s ease",
          boxShadow:
            answeredCount === totalQuestions
              ? "0 4px 16px rgba(16, 185, 129, 0.4)"
              : "none",
        }}
        onMouseEnter={(e) => {
          if (answeredCount === totalQuestions) {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.5)";
          }
        }}
        onMouseLeave={(e) => {
          if (answeredCount === totalQuestions) {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(16, 185, 129, 0.4)";
          }
        }}
      >
        {answeredCount === totalQuestions ? (
          <>
            <CheckIcon size={20} color="white" />
            <span>Finalizar Test y Ver Resultados</span>
          </>
        ) : (
          `Completa todas las preguntas (${answeredCount}/${totalQuestions})`
        )}
      </button>
    </div>
  );
}

// Componente de Mensaje de Éxito Visual
function SuccessMessage({
  data,
  colorTheme = "dark",
}: {
  data: unknown;
  colorTheme?: "dark" | "light";
}) {
  let successData: unknown;
  
  try {
    if (typeof data === 'string') {
      successData = JSON.parse(data);
    } else if (typeof data === 'object' && data !== null) {
      successData = data;
    } else {
      throw new Error('Invalid success data');
    }
  } catch (error) {
    console.error("Error parsing success data", error);
    return null;
  }

  const fileNames = Array.isArray((successData as { fileNames?: unknown }).fileNames)
    ? (successData as { fileNames?: string[] }).fileNames ?? []
    : [];
  const bgColor = colorTheme === "dark" 
    ? "linear-gradient(135deg, rgba(26, 26, 36, 0.95), rgba(30, 30, 45, 0.95))"
    : "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98))";
  const textColor = colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24";
  const secondaryTextColor = colorTheme === "dark" ? "var(--text-secondary)" : "#4b5563";

  return (
    <div
      style={{
        background: bgColor,
        borderRadius: "20px",
        padding: "2rem",
        border: `2px solid ${colorTheme === "dark" ? "rgba(16, 185, 129, 0.4)" : "rgba(16, 185, 129, 0.5)"}`,
        boxShadow: colorTheme === "dark"
          ? "0 8px 32px rgba(16, 185, 129, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
          : "0 8px 32px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
      }}
    >
      {/* Header con icono de éxito */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: "1rem", 
        marginBottom: "1.5rem" 
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #10b981, #059669)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <CheckIcon size={24} color="white" />
        </div>
        <div>
          <h3 style={{
            margin: 0,
            fontSize: "1.5rem",
            fontWeight: 700,
            color: textColor,
            marginBottom: "0.25rem",
          }}>
            ¡Documento procesado correctamente!
          </h3>
          <p style={{
            margin: 0,
            fontSize: "0.875rem",
            color: secondaryTextColor,
          }}>
            {fileNames.length} archivo(s) procesado(s)
          </p>
        </div>
      </div>

      {/* Lista de archivos */}
      {fileNames.length > 0 && (
        <div style={{
          marginBottom: "2rem",
          padding: "1rem",
          background: colorTheme === "dark" ? "rgba(16, 185, 129, 0.1)" : "rgba(16, 185, 129, 0.08)",
          borderRadius: "12px",
          border: `1px solid ${colorTheme === "dark" ? "rgba(16, 185, 129, 0.3)" : "rgba(16, 185, 129, 0.4)"}`,
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "0.75rem",
          }}>
            <FileIcon size={18} color="#10b981" />
            <span style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: secondaryTextColor,
            }}>
              Archivo(s) procesado(s):
            </span>
          </div>
          <ul style={{
            margin: 0,
            paddingLeft: "1.5rem",
            listStyle: "none",
          }}>
            {fileNames.map((fileName: string, index: number) => (
              <li key={index} style={{
                marginBottom: "0.5rem",
                color: textColor,
                fontSize: "0.95rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}>
                <span style={{ color: "#10b981" }}>•</span>
                {fileName}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Opciones disponibles */}
      <div>
        <h4 style={{
          margin: 0,
          marginBottom: "1rem",
          fontSize: "1.1rem",
          fontWeight: 600,
          color: textColor,
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}>
          <TargetIcon size={20} color="#6366f1" />
          ¿Qué quieres hacer ahora?
        </h4>
        
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
        }}>
          {/* Opción 1: Generar apuntes */}
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "1rem",
            padding: "1.25rem",
            background: colorTheme === "dark" ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.08)",
            borderRadius: "12px",
            border: `1px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.4)"}`,
            transition: "all 0.3s ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateX(4px)";
            e.currentTarget.style.background = colorTheme === "dark" ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateX(0)";
            e.currentTarget.style.background = colorTheme === "dark" ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.08)";
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <NotesIcon size={20} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: textColor,
                marginBottom: "0.25rem",
              }}>
                Generar apuntes
              </div>
              <div style={{
                fontSize: "0.875rem",
                color: secondaryTextColor,
                lineHeight: 1.5,
              }}>
                Crea apuntes visuales con esquemas conceptuales y diagramas interactivos
              </div>
            </div>
          </div>

          {/* Opción 2: Hacer preguntas */}
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "1rem",
            padding: "1.25rem",
            background: colorTheme === "dark" ? "rgba(6, 182, 212, 0.1)" : "rgba(6, 182, 212, 0.08)",
            borderRadius: "12px",
            border: `1px solid ${colorTheme === "dark" ? "rgba(6, 182, 212, 0.3)" : "rgba(6, 182, 212, 0.4)"}`,
            transition: "all 0.3s ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateX(4px)";
            e.currentTarget.style.background = colorTheme === "dark" ? "rgba(6, 182, 212, 0.15)" : "rgba(6, 182, 212, 0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateX(0)";
            e.currentTarget.style.background = colorTheme === "dark" ? "rgba(6, 182, 212, 0.1)" : "rgba(6, 182, 212, 0.08)";
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #06b6d4, #0891b2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <QuestionIcon size={20} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: textColor,
                marginBottom: "0.25rem",
              }}>
                Hacer preguntas
              </div>
              <div style={{
                fontSize: "0.875rem",
                color: secondaryTextColor,
                lineHeight: 1.5,
              }}>
                Pregúntame sobre el contenido del documento y obtén respuestas detalladas
              </div>
            </div>
          </div>

          {/* Opción 3: Generar test */}
          <div style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "1rem",
            padding: "1.25rem",
            background: colorTheme === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(139, 92, 246, 0.08)",
            borderRadius: "12px",
            border: `1px solid ${colorTheme === "dark" ? "rgba(139, 92, 246, 0.3)" : "rgba(139, 92, 246, 0.4)"}`,
            transition: "all 0.3s ease",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateX(4px)";
            e.currentTarget.style.background = colorTheme === "dark" ? "rgba(139, 92, 246, 0.15)" : "rgba(139, 92, 246, 0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateX(0)";
            e.currentTarget.style.background = colorTheme === "dark" ? "rgba(139, 92, 246, 0.1)" : "rgba(139, 92, 246, 0.08)";
          }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <TestIcon size={20} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: "1rem",
                fontWeight: 600,
                color: textColor,
                marginBottom: "0.25rem",
              }}>
                Generar test
              </div>
              <div style={{
                fontSize: "0.875rem",
                color: secondaryTextColor,
                lineHeight: 1.5,
              }}>
                Crea un test de evaluación para practicar y evaluar tu conocimiento
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de Feedback Mejorado
function FeedbackComponent({
  feedbackData,
  colorTheme = "dark",
}: {
  feedbackData: unknown;
  colorTheme?: "dark" | "light";
}) {
  let feedback: unknown;
  
  // Manejar si feedbackData ya es un objeto o es un string
  try {
    if (typeof feedbackData === 'string') {
      feedback = JSON.parse(feedbackData);
    } else if (typeof feedbackData === 'object' && feedbackData !== null) {
      feedback = feedbackData;
    } else {
      throw new Error('Invalid feedback data');
    }
  } catch (error) {
    // Si no es JSON válido o es un objeto inválido, mostrar como texto normal
    console.error("Error parsing feedback data", error);
    return (
      <div style={{
        whiteSpace: "pre-wrap",
        lineHeight: 1.6,
        color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
        padding: "1.5rem",
        background: colorTheme === "dark" 
          ? "rgba(26, 26, 36, 0.8)" 
          : "rgba(255, 255, 255, 0.8)",
        borderRadius: "12px",
      }}>
        {typeof feedbackData === 'string' ? feedbackData : JSON.stringify(feedbackData, null, 2)}
      </div>
    );
  }

  // Validar que feedback tenga las propiedades necesarias
  if (!feedback || typeof feedback !== 'object') {
    return (
      <div style={{
        padding: "1.5rem",
        color: colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24",
      }}>
        Error: Datos de feedback inválidos
      </div>
    );
  }

  const { score = 0, correctCount = 0, totalQuestions = 0, failedQuestions = [], recommendations = [] } = feedback as {
    score?: number;
    correctCount?: number;
    totalQuestions?: number;
    failedQuestions?: { question: string; userAnswer: string; correctAnswer: string; explanation?: string }[];
    recommendations?: string[];
  };
  const bgColor = colorTheme === "dark" 
    ? "linear-gradient(135deg, rgba(26, 26, 36, 0.95), rgba(30, 30, 45, 0.95))"
    : "linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98))";
  const textColor = colorTheme === "dark" ? "var(--text-primary)" : "#1a1a24";
  const secondaryTextColor = colorTheme === "dark" ? "var(--text-secondary)" : "#4b5563";
  
  // Determinar nivel de rendimiento
  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: "Excelente", color: "#10b981", icon: <StarIcon size={24} color="#10b981" />, message: "¡Increíble! Dominas perfectamente estos conceptos." };
    if (score >= 80) return { level: "Muy Bueno", color: "#06b6d4", icon: <TargetIcon size={24} color="#06b6d4" />, message: "¡Muy bien! Tienes una comprensión sólida." };
    if (score >= 70) return { level: "Bueno", color: "#6366f1", icon: <CheckIcon size={24} color="#6366f1" />, message: "Buen trabajo, pero hay espacio para mejorar." };
    if (score >= 60) return { level: "Regular", color: "#f59e0b", icon: <AlertIcon size={24} color="#f59e0b" />, message: "Necesitas repasar algunos conceptos importantes." };
    return { level: "Necesita Mejora", color: "#ef4444", icon: <XIcon size={24} color="#ef4444" />, message: "Es importante que repases el material antes de continuar." };
  };

  const performance = getPerformanceLevel(score);

  return (
    <div
      style={{
        background: bgColor,
        borderRadius: "20px",
        padding: "2rem",
        border: `2px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.4)" : "rgba(99, 102, 241, 0.5)"}`,
        boxShadow: colorTheme === "dark"
          ? "0 8px 32px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
          : "0 8px 32px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)",
      }}
    >
      {/* Header con Puntuación */}
      <div style={{ marginBottom: "2rem", textAlign: "center" }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "1rem",
          padding: "1.5rem 2rem",
          background: `linear-gradient(135deg, rgba(${performance.color === "#10b981" ? "16, 185, 129" : performance.color === "#06b6d4" ? "6, 182, 212" : performance.color === "#6366f1" ? "99, 102, 241" : performance.color === "#f59e0b" ? "245, 158, 11" : "239, 68, 68"}, 0.15), rgba(${performance.color === "#10b981" ? "5, 150, 105" : performance.color === "#06b6d4" ? "8, 145, 178" : performance.color === "#6366f1" ? "79, 70, 229" : performance.color === "#f59e0b" ? "217, 119, 6" : "220, 38, 38"}, 0.1))`,
          borderRadius: "16px",
          border: `2px solid ${performance.color}40`,
          marginBottom: "1rem",
        }}>
          {performance.icon}
          <div>
            <div style={{ fontSize: "0.875rem", color: secondaryTextColor, marginBottom: "0.25rem" }}>
              Puntuación Final
            </div>
            <div style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              background: `linear-gradient(135deg, ${performance.color}, ${performance.color}dd)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              {score.toFixed(1)}%
            </div>
            <div style={{ fontSize: "0.875rem", color: performance.color, fontWeight: 600, marginTop: "0.25rem" }}>
              {performance.level}
            </div>
          </div>
        </div>
        <p style={{
          margin: "1rem 0 0 0",
          fontSize: "1rem",
          color: textColor,
          fontWeight: 500,
        }}>
          {performance.message}
        </p>
        <div style={{
          marginTop: "1rem",
          padding: "0.75rem 1.5rem",
          background: colorTheme === "dark" ? "rgba(99, 102, 241, 0.1)" : "rgba(99, 102, 241, 0.08)",
          borderRadius: "12px",
          display: "inline-block",
        }}>
          <span style={{ color: secondaryTextColor, fontSize: "0.875rem" }}>
            Correctas: <strong style={{ color: "#10b981" }}>{correctCount}</strong> / <strong style={{ color: textColor }}>{totalQuestions}</strong>
          </span>
        </div>
      </div>

      {/* Conceptos Fallados */}
      {failedQuestions && failedQuestions.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1.5rem",
          }}>
            <BookIcon size={24} color="#f59e0b" />
            <h3 style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: 700,
              color: textColor,
            }}>
              Conceptos a Repasar ({failedQuestions.length})
            </h3>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {failedQuestions.map((failed: { question: string; userAnswer: string; correctAnswer: string; explanation?: string }, index: number) => (
              <div
                key={index}
                style={{
                  padding: "1.5rem",
                  background: colorTheme === "dark"
                    ? "linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05))"
                    : "linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(220, 38, 38, 0.05))",
                  borderRadius: "16px",
                  border: `2px solid ${colorTheme === "dark" ? "rgba(239, 68, 68, 0.3)" : "rgba(239, 68, 68, 0.4)"}`,
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.75rem",
                  marginBottom: "1rem",
                }}>
                  <XIcon size={20} color="#ef4444" style={{ marginTop: "0.125rem", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontWeight: 600,
                      color: textColor,
                      marginBottom: "0.5rem",
                      fontSize: "1rem",
                    }}>
                      {failed.question}
                    </div>
                    <div style={{
                      display: "flex",
                      gap: "1rem",
                      flexWrap: "wrap",
                      marginTop: "0.75rem",
                    }}>
                      <div style={{
                        padding: "0.5rem 1rem",
                        background: colorTheme === "dark" ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.1)",
                        borderRadius: "8px",
                        fontSize: "0.875rem",
                      }}>
                        <span style={{ color: secondaryTextColor }}>Tu respuesta: </span>
                        <strong style={{ color: "#ef4444" }}>{failed.userAnswer}</strong>
                      </div>
                      <div style={{
                        padding: "0.5rem 1rem",
                        background: colorTheme === "dark" ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)",
                        borderRadius: "8px",
                        fontSize: "0.875rem",
                      }}>
                        <span style={{ color: secondaryTextColor }}>Correcta: </span>
                        <strong style={{ color: "#10b981" }}>{failed.correctAnswer}</strong>
                      </div>
                    </div>
                  </div>
                </div>
                {failed.explanation && (
                  <div style={{
                    marginTop: "1rem",
                    padding: "1rem",
                    background: colorTheme === "dark" ? "rgba(26, 26, 36, 0.5)" : "rgba(255, 255, 255, 0.5)",
                    borderRadius: "12px",
                    border: `1px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.4)"}`,
                  }}>
                    <div style={{
                      display: "flex",
                      gap: "0.75rem",
                      alignItems: "flex-start",
                    }}>
                      <LightbulbIcon size={18} color="#f59e0b" style={{ marginTop: "0.125rem", flexShrink: 0 }} />
                      <div>
                        <div style={{
                          fontSize: "0.875rem",
                          color: secondaryTextColor,
                          marginBottom: "0.5rem",
                          fontWeight: 600,
                        }}>
                          Explicación:
                        </div>
                        <div style={{
                          color: textColor,
                          lineHeight: 1.6,
                          fontSize: "0.95rem",
                        }}>
                          {failed.explanation}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recomendaciones */}
      {recommendations && recommendations.length > 0 && (
        <div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            marginBottom: "1rem",
          }}>
            <SparkleIcon size={24} color="#6366f1" />
            <h3 style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: 700,
              color: textColor,
            }}>
              Recomendaciones
            </h3>
          </div>
          <ul style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}>
            {recommendations.map((rec: string, index: number) => (
              <li
                key={index}
                style={{
                  padding: "1rem 1.25rem",
                  background: colorTheme === "dark"
                    ? "linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.05))"
                    : "linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.05))",
                  borderRadius: "12px",
                  border: `1px solid ${colorTheme === "dark" ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.4)"}`,
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "flex-start",
                }}
              >
                <ZapIcon size={18} color="#6366f1" style={{ marginTop: "0.125rem", flexShrink: 0 }} />
                <span style={{ color: textColor, lineHeight: 1.6 }}>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

